import os
import hashlib
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from sentence_transformers import CrossEncoder
from ddgs import DDGS
from main import predict
from prisma import Prisma
from contextlib import asynccontextmanager

load_dotenv()

db = Prisma()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()

app = FastAPI(title="Fake News Detection API", description="5-Gate Waterfall System", lifespan=lifespan)

# Initialize Gemini
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key and gemini_api_key != "your_gemini_api_key":
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

# Initialize Local Cross-Encoder for Gate 3
print("Loading Local NLI Cross-Encoder model...")
try:
    nli_model = CrossEncoder('joeddav/xlm-roberta-large-xnli')
    print("NLI Model loaded successfully.")
except Exception as e:
    print(f"Failed to load NLI model: {e}")
    nli_model = None

def search_ddg(query: str, num_results=3):
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=num_results))
            return [{"title": res.get("title"), "snippet": res.get("body"), "link": res.get("href")} for res in results]
    except Exception as e:
        print(f"DuckDuckGo Search Error: {e}")
        return []

class VerifyRequest(BaseModel):
    text: str

def get_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

@app.post("/api/verify")
async def verify_claim(req: VerifyRequest):
    text = req.text
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    claim_hash = get_hash(text)

    # --- Gate 1: Cache Check ---
    try:
        cached_result = await db.verifiedclaim.find_unique(where={"claim_hash": claim_hash})
        if cached_result:
            return {
                "source": "Cache (Gate 1)",
                "verdict": cached_result.verdict,
                "explanation": cached_result.explanation,
                "source_links": json.loads(cached_result.source_links)
            }
    except Exception as e:
        print(f"Gate 1 Cache Error: {e}")

    # --- Gate 2: PhoBERT Stylistic Filter ---
    gate2_label = "UNCERTAIN"
    try:
        gate2_label, real_prob, fake_prob = predict(text)
        
        if gate2_label == "FAKE" and fake_prob > 0.98:
            final_result = {
                "source": "PhoBERT Style Filter (Gate 2)",
                "verdict": "Fake",
                "explanation": "Blatant fake-news linguistic patterns detected. Stylistic Warning.",
                "source_links": [],
                "confidence": fake_prob
            }
            # --- Gate 5: Update Cache ---
            try:
                 await db.verifiedclaim.create(data={
                     "claim_hash": claim_hash,
                     "original_text": text,
                     "verdict": final_result["verdict"],
                     "explanation": final_result["explanation"],
                     "source_links": json.dumps(final_result["source_links"])
                 })
            except Exception as e:
                 print(f"Gate 5 Save Error: {e}")
            
            return final_result

    except Exception as e:
        print(f"PhoBERT Error: {e}")

    # --- Gate 3: Retrieval & Local NLI Fact-Check ---
    search_results = search_ddg(text)
    source_links = [res['link'] for res in search_results]
    context_text = "\n".join([f"- {res['title']}: {res['snippet']} ({res['link']})" for res in search_results])

    final_verdict = "UNCERTAIN" 
    explanation = "Stylistic analysis flagged this as potentially problematic. Deep reasoning unavailable."
    source_name = "PhoBERT + Fallback (Gate 2)"
    needs_deep_reasoning = True

    if search_results and nli_model:
        sentence_pairs = [[res['snippet'], text] for res in search_results]
        
        try:
            scores = nli_model.predict(sentence_pairs)
            
            import torch
            max_contradiction = 0
            max_entailment = 0
            
            for score in scores:
                probs = torch.nn.functional.softmax(torch.tensor(score), dim=-1)
                contradiction_prob = probs[0].item()
                neutral_prob = probs[1].item()
                entailment_prob = probs[2].item()
                
                if contradiction_prob > max_contradiction:
                    max_contradiction = contradiction_prob
                if entailment_prob > max_entailment:
                    max_entailment = entailment_prob

            import re
            has_numbers = bool(re.search(r'\d', text))
            
            CONFIDENCE_THRESHOLD_ENTAILMENT = 0.98
            CONFIDENCE_THRESHOLD_CONTRADICTION = 0.95
            
            if max_contradiction > CONFIDENCE_THRESHOLD_CONTRADICTION:
                final_verdict = "Fake"
                explanation = "Theo phân tích ngữ nghĩa tự động (NLI), nội dung này mâu thuẫn rõ rệt với các thông tin tìm kiếm được."
                source_name = "Local NLI Fact-Check (Gate 3)"
                needs_deep_reasoning = False
            elif max_entailment > CONFIDENCE_THRESHOLD_ENTAILMENT and not has_numbers:
                final_verdict = "True"
                explanation = "Theo phân tích ngữ nghĩa tự động (NLI), nội dung này hoàn toàn trùng khớp với thông tin gốc trên mạng."
                source_name = "Local NLI Fact-Check (Gate 3)"
                needs_deep_reasoning = False
                
        except Exception as e:
            print(f"Local NLI Error: {e}")

    # --- Gate 4: Deep LLM Reasoning (Fallback) ---
    if needs_deep_reasoning and model:
        prompt = f"""
        You are an expert fact-checker for Vietnamese news.
        Analyze the following claim based on the provided search results.
        
        Claim: "{text}"
        
        Search Results Context:
        {context_text if context_text else "No reliable search results found."}
        
        Task:
        1. Determine if the claim is "True", "Fake", or "Misleading/Uncertain".
        - RULE 1: If the claim is a universal, undeniable common-sense fact (e.g., "con mèo có 4 chân", "mặt trời mọc đằng đông"), you MUST use your internal knowledge to verify it as "True", even if the search results don't explicitly say it.
        - RULE 2: For news, policies, or specific events, strictly rely on the search results.
        - RULE 3: Pay VERY CLOSE attention to numbers, dates, percentages, and names. If the claim says "1/3" but the search results say "1/7", the verdict MUST be "Fake" or "Misleading", NOT "True".
        2. Provide a detailed explanation (2-4 sentences) in Vietnamese explaining exactly why. If it's common sense, just state that it is a well-known scientific fact. If there is a discrepancy in numbers or dates, explicitly state the difference (e.g., "Thông tin gốc là ngày 1/7, không phải 1/3 như trong bài viết").
        
        Respond EXACTLY in this JSON format:
        {{"verdict": "True/Fake/Misleading", "explanation": "your detailed explanation here"}}
        """
        try:
            response = model.generate_content(prompt)
            import re
            
            match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if match:
                llm_data = json.loads(match.group(0))
                final_verdict = llm_data.get("verdict", gate2_label)
                explanation = llm_data.get("explanation", response.text)
                source_name = "Gemini Reasoning (Gate 4)"
            else:
                explanation = response.text
                source_name = "Gemini Reasoning (Gate 4 - Raw)"
        except Exception as e:
            print(f"Gemini Error: {e}")

    final_result = {
        "source": source_name,
        "verdict": final_verdict,
        "explanation": explanation,
        "source_links": source_links,
    }

    # --- Gate 5: Update Cache ---
    try:
        await db.verifiedclaim.create(data={
            "claim_hash": claim_hash,
            "original_text": text,
            "verdict": final_result["verdict"],
            "explanation": final_result["explanation"],
            "source_links": json.dumps(final_result["source_links"])
        })
    except Exception as e:
        print(f"Gate 5 Save Error: {e}")

    return final_result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
