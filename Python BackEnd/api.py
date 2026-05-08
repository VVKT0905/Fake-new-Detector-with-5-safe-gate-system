"""
Fake News Detection API — 5-Gate Waterfall System
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from enum import Enum

import chromadb
import torch
import wikipedia
from ddgs import DDGS
from dotenv import load_dotenv
from fastapi import FastAPI
from google import genai
from prisma import Prisma
from pydantic import BaseModel, field_validator
from sentence_transformers import CrossEncoder, SentenceTransformer

from main import predict as phobert_predict

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
log = logging.getLogger("fake-news-api")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_URL = f"file:{os.path.join(BASE_DIR, 'dev.db')}"
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")
CHROMA_COLLECTION = "verified_claims"

EMBED_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
NLI_MODEL_NAME = "joeddav/xlm-roberta-large-xnli"
GEMINI_MODEL = "gemini-2.0-flash"

SEMANTIC_DISTANCE_THRESHOLD = 0.15
FAKE_PROB_EARLY_EXIT = 0.98
NLI_ENTAIL_THRESHOLD_DEFAULT = 0.90
NLI_ENTAIL_THRESHOLD_NUMERIC = 0.98
NLI_CONTRADICT_THRESHOLD_DEFAULT = 0.95
NLI_CONTRADICT_THRESHOLD_NUMERIC = 0.97

VN_CHAR_PATTERN = re.compile(
    r"[áàảãạăâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]",
    re.IGNORECASE,
)
CLICKBAIT_KEYWORDS = frozenset([
    "sốc", "bí ẩn", "100%", "tin chuẩn", "không thể tin",
    "sự thật", "kinh hoàng", "cực sốc", "lộ diện",
])

GEMINI_SYSTEM_PROMPT = """\
Bạn là một chuyên gia kiểm chứng thông tin (Fact-Checker) chuyên nghiệp.
Nhiệm vụ của bạn là đánh giá tính xác thực của nhận định dựa trên các nguồn đã cung cấp.

Yêu cầu:
1. Phân tích kỹ các con số, ngày tháng, tên người và sự kiện.
2. Đối chiếu nhận định với nguồn thông tin. Nếu không có nguồn, dùng kiến thức nội tại và ghi rõ "Dựa trên kiến thức hệ thống".
3. Kết luận bằng một trong ba nhãn: "true", "fake", hoặc "misleading".
4. Viết giải thích chi tiết bằng tiếng Việt, có trích dẫn cụ thể.
5. Trả về confidence từ 0.0 đến 1.0.

Trả về JSON duy nhất (không có markdown):
{"verdict": "true|fake|misleading", "confidence": 0.0, "explanation": "..."}\
"""

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------

db = Prisma(datasource={"url": DB_URL})
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
chroma_collection = chroma_client.get_or_create_collection(name=CHROMA_COLLECTION)

log.info("Loading embedding model: %s", EMBED_MODEL_NAME)
embed_model = SentenceTransformer(EMBED_MODEL_NAME)

log.info("Loading NLI model: %s", NLI_MODEL_NAME)
try:
    nli_model: CrossEncoder | None = CrossEncoder(NLI_MODEL_NAME)
    log.info("NLI model loaded.")
except Exception:
    log.exception("Failed to load NLI model — Gate 3 disabled.")
    nli_model = None

def get_gemini_client() -> genai.Client | None:
    """Dynamically loads Gemini client to handle frequent key rotations."""
    load_dotenv(override=True)
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key":
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception:
        log.exception("Failed to re-initialize Gemini client.")
        return None

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    log.info("Database connected.")
    yield
    await db.disconnect()
    log.info("Database disconnected.")


app = FastAPI(
    title="Fake News Detection API",
    description="5-Gate Waterfall System",
    version="3.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Enums & Schema
# ---------------------------------------------------------------------------

class Verdict(str, Enum):
    TRUE = "true"
    FAKE = "fake"
    MISLEADING = "misleading"
    UNCERTAIN = "uncertain"


class VerifyRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("text must not be empty")
        return v


class Source(BaseModel):
    title: str
    snippet: str
    url: str
    provider: str


class GateSignal(BaseModel):
    gate: int
    name: str
    verdict: Verdict
    confidence: float | None
    reasoning: str | None = None


class VerifyResponse(BaseModel):
    verdict: Verdict
    confidence: float | None
    explanation: str
    gate_fired: int
    signals: list[GateSignal]
    sources: list[Source]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def is_vietnamese(text: str) -> bool:
    return bool(VN_CHAR_PATTERN.search(text))


def has_numbers(text: str) -> bool:
    return bool(re.search(r"\d", text))


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

def _ddg_search(query: str, num_results: int = 5) -> list[Source]:
    region = "vn-tz" if is_vietnamese(query) else "wt-wt"
    try:
        with DDGS() as ddgs:
            raw = ddgs.text(query, region=region, max_results=num_results)
            return [
                Source(
                    title=r.get("title", ""),
                    snippet=r.get("body", ""),
                    url=r.get("href", ""),
                    provider="DuckDuckGo",
                )
                for r in raw
            ]
    except Exception:
        log.exception("DuckDuckGo search failed.")
        return []


def _wikipedia_search(query: str) -> list[Source]:
    try:
        wikipedia.set_lang("vi" if is_vietnamese(query) else "en")
        hits = wikipedia.search(query, results=1)
        if not hits:
            return []
        page = wikipedia.page(hits[0], auto_suggest=False)
        return [
            Source(
                title=page.title,
                snippet=page.summary[:500] + "…",
                url=page.url,
                provider="Wikipedia",
            )
        ]
    except Exception:
        log.exception("Wikipedia search failed.")
        return []


async def fetch_search_results(query: str) -> list[Source]:
    # Prioritize DDG for fresh news, use Wiki as a "Ground Truth" booster
    ddg_task = asyncio.to_thread(_ddg_search, query)
    wiki_task = asyncio.to_thread(_wikipedia_search, query)
    ddg, wiki = await asyncio.gather(ddg_task, wiki_task)
    return ddg + wiki


# ---------------------------------------------------------------------------
# Gate 1 — Semantic cache
# ---------------------------------------------------------------------------

async def gate1_cache(text: str, claim_hash: str) -> VerifyResponse | None:
    try:
        record = await db.verifiedclaim.find_unique(where={"claim_hash": claim_hash})
        match_label = "Exact Match"

        if record is None:
            embedding = await asyncio.to_thread(lambda: embed_model.encode(text).tolist())
            vec = await asyncio.to_thread(
                lambda: chroma_collection.query(query_embeddings=[embedding], n_results=1)
            )
            if vec["ids"] and vec["ids"][0] and vec["distances"][0][0] < SEMANTIC_DISTANCE_THRESHOLD:
                matched_hash = vec["ids"][0][0]
                similarity_pct = (1 - vec["distances"][0][0]) * 100
                record = await db.verifiedclaim.find_unique(where={"claim_hash": matched_hash})
                match_label = f"Semantic Match ({similarity_pct:.1f}%)"

        if record is None:
            return None

        try:
            cached_sources = [Source(**s) for s in json.loads(record.source_links)]
        except Exception:
            cached_sources = []

        return VerifyResponse(
            verdict=Verdict(record.verdict),
            confidence=None,
            explanation=record.explanation,
            gate_fired=1,
            signals=[
                GateSignal(
                    gate=1,
                    name=f"Hệ thống Cache ({match_label})",
                    verdict=Verdict(record.verdict),
                    confidence=None,
                    reasoning=f"Tìm thấy kết quả đã xác minh trong bộ nhớ đệm với độ tương đồng cao. Nội dung gốc: '{record.original_text}'"
                )
            ],
            sources=cached_sources,
        )

    except Exception:
        log.exception("Gate 1 cache lookup failed.")
        return None


# ---------------------------------------------------------------------------
# Gate 2 — PhoBERT stylistic filter
# ---------------------------------------------------------------------------

async def gate2_phobert(text: str) -> GateSignal | None:
    try:
        label, real_prob, fake_prob = await asyncio.to_thread(phobert_predict, text)

        if label == "FAKE":
            verdict, confidence = Verdict.FAKE, fake_prob
        elif label == "REAL":
            verdict, confidence = Verdict.TRUE, real_prob
        else:
            verdict, confidence = Verdict.UNCERTAIN, None

        reasoning = f"Mô hình PhoBERT phân tích cấu trúc văn phong và từ vựng. Phát hiện {confidence*100:.1f}% xác suất là {label}."
        return GateSignal(gate=2, name="PhoBERT Style Filter", verdict=verdict, confidence=confidence, reasoning=reasoning)
    except Exception:
        log.exception("Gate 2 PhoBERT failed.")
        return None


# ---------------------------------------------------------------------------
# Gate 3 — Local NLI fact-check
# ---------------------------------------------------------------------------

def _run_nli(snippets: list[str], claim: str) -> list[dict[str, float]]:
    assert nli_model is not None
    pairs = [[s, claim] for s in snippets]
    raw = nli_model.predict(pairs)
    return [
        {
            "contradiction": torch.nn.functional.softmax(torch.tensor(s), dim=-1)[0].item(),
            "entailment": torch.nn.functional.softmax(torch.tensor(s), dim=-1)[2].item(),
        }
        for s in raw
    ]


async def gate3_nli(text: str, sources: list[Source]) -> GateSignal | None:
    if not sources or nli_model is None:
        return None

    numeric = has_numbers(text)
    contradict_thresh = NLI_CONTRADICT_THRESHOLD_NUMERIC if numeric else NLI_CONTRADICT_THRESHOLD_DEFAULT
    entail_thresh = NLI_ENTAIL_THRESHOLD_NUMERIC if numeric else NLI_ENTAIL_THRESHOLD_DEFAULT

    try:
        scores = await asyncio.to_thread(_run_nli, [s.snippet for s in sources], text)
    except Exception:
        log.exception("Gate 3 NLI scoring failed.")
        return None

    # Find best matches
    best_idx_contradict = scores.index(max(scores, key=lambda s: s["contradiction"]))
    best_idx_entail = scores.index(max(scores, key=lambda s: s["entailment"]))
    
    val_contradict = scores[best_idx_contradict]["contradiction"]
    val_entail = scores[best_idx_entail]["entailment"]

    if val_contradict > contradict_thresh:
        s = sources[best_idx_contradict]
        reasoning = f"Mâu thuẫn logic với thông tin từ {s.provider}: '{s.title}'. Nội dung đối chiếu: '{s.snippet}'"
        return GateSignal(
            gate=3, name="Local NLI Fact-Check",
            verdict=Verdict.FAKE, confidence=val_contradict, reasoning=reasoning
        )

    if val_entail > entail_thresh and not numeric:
        s = sources[best_idx_entail]
        reasoning = f"Trùng khớp logic với thông tin từ {s.provider}: '{s.title}'. Nội dung đối chiếu: '{s.snippet}'"
        return GateSignal(
            gate=3, name="Local NLI Fact-Check",
            verdict=Verdict.TRUE, confidence=val_entail, reasoning=reasoning
        )

    return GateSignal(
        gate=3, name="Local NLI Fact-Check",
        verdict=Verdict.UNCERTAIN,
        confidence=max(val_contradict, val_entail),
        reasoning="Không tìm thấy sự trùng khớp hoặc mâu thuẫn rõ ràng từ các nguồn tìm kiếm."
    )


# ---------------------------------------------------------------------------
# Gate 4 — Gemini one-shot reasoning
# ---------------------------------------------------------------------------

def _call_gemini_sync_with_client(client: genai.Client, claim: str, sources: list[Source]) -> dict:
    context = "\n".join(
        f"- [{s.provider}] {s.title}: {s.snippet} ({s.url})"
        for s in sources
    ) or "Không tìm thấy kết quả tìm kiếm trực tiếp."

    user_prompt = f'NHẬN ĐỊNH CẦN KIỂM CHỨNG:\n"{claim}"\n\nTHÔNG TIN TÌM ĐƯỢC:\n{context}'

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            {"role": "user", "parts": [{"text": GEMINI_SYSTEM_PROMPT}]},
            {"role": "user", "parts": [{"text": user_prompt}]},
        ],
    )
    raw = response.text
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return {"verdict": "uncertain", "confidence": None, "explanation": raw}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {"verdict": "uncertain", "confidence": None, "explanation": raw}


async def gate4_gemini(text: str, sources: list[Source]) -> GateSignal | None:
    client = get_gemini_client()
    if client is None:
        return None
    log.info("Gate 4: calling Gemini (dynamic client).")
    try:
        data = await asyncio.to_thread(_call_gemini_sync_with_client, client, text, sources)
        try:
            verdict = Verdict(data.get("verdict", "uncertain").lower())
        except ValueError:
            verdict = Verdict.UNCERTAIN
        return GateSignal(
            gate=4, name="Gemini One-Shot Reasoning",
            verdict=verdict, confidence=data.get("confidence"),
            reasoning=data.get("explanation")
        )
    except Exception:
        log.exception("Gate 4 Gemini failed.")
        return None


# ---------------------------------------------------------------------------
# Gate 5 — Persist
# ---------------------------------------------------------------------------

async def gate5_persist(text: str, claim_hash: str, response: VerifyResponse) -> None:
    try:
        await db.verifiedclaim.create(data={
            "claim_hash": claim_hash,
            "original_text": text,
            "verdict": response.verdict.value,
            "explanation": response.explanation,
            "source_links": json.dumps([s.model_dump() for s in response.sources]),
        })
        embedding = await asyncio.to_thread(lambda: embed_model.encode(text).tolist())
        await asyncio.to_thread(
            lambda: chroma_collection.add(
                embeddings=[embedding],
                documents=[text],
                ids=[claim_hash],
            )
        )
        log.info("Gate 5: persisted hash=%s", claim_hash)
    except Exception:
        log.exception("Gate 5 persist failed.")


# ---------------------------------------------------------------------------
# Explanation builder
# ---------------------------------------------------------------------------

def build_explanation(signal: GateSignal, text: str, sources: list[Source]) -> str:
    if signal.gate == 1:
        return f"♻️ Dữ liệu được lấy từ bộ nhớ đệm (Cache). Kết quả này đã được xác minh trước đó cho một nội dung tương tự."

    if signal.gate == 2:
        pct = f"{signal.confidence * 100:.1f}%" if signal.confidence else "N/A"
        found_kws = [kw for kw in CLICKBAIT_KEYWORDS if kw in text.lower()]
        label_text = "tin giả/clickbait" if signal.verdict == Verdict.FAKE else "tin thật"
        msg = f"⚠️ Phân tích văn phong (PhoBERT): {pct} xác suất {label_text}."
        if found_kws:
            msg += f" Từ khóa đánh lừa: '{', '.join(found_kws)}'."
        msg += "\n\n💡 Mô hình PhoBERT phân tích cấu trúc câu và từ vựng để phát hiện các dấu hiệu của tin giả hoặc tiêu đề giật gân."
        return msg

    if signal.gate == 3 and signal.reasoning:
        reasoning = f"✅ NLI Fact-Check: {signal.reasoning}\n\n"
        reasoning += f"💡  Hệ thống tìm kiếm thông tin liên quan và sử dụng mô hình logic (NLI) để so sánh nhận định của bạn với dữ liệu thực tế."
        return reasoning

    if signal.gate == 4 and signal.reasoning:
        return f"🧠 Phân tích chuyên sâu (LLMs):\n{signal.reasoning}"

    return "Hệ thống không đủ bằng chứng để kết luận chắc chắn. Vui lòng tự kiểm chứng thêm từ các nguồn uy tín."


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    from main import model as phobert_model
    return {
        "status": "ok",
        "database": "connected" if db.is_connected() else "disconnected",
        "models": {
            "phobert": phobert_model is not None,
            "nli": nli_model is not None,
            "gemini": get_gemini_client() is not None,
        }
    }

@app.post("/api/verify", response_model=VerifyResponse)
async def verify_claim(req: VerifyRequest) -> VerifyResponse:
    text = req.text
    claim_hash = sha256(text)

    # Gate 1 — cache
    if cached := await gate1_cache(text, claim_hash):
        return cached

    # Parallel setup
    search_task = asyncio.create_task(fetch_search_results(text))
    phobert_task = asyncio.create_task(gate2_phobert(text))
    sources, g2_signal = await asyncio.gather(search_task, phobert_task)

    signals: list[GateSignal] = []
    if g2_signal:
        signals.append(g2_signal)

    # Gate 2 early exit
    if (
        g2_signal
        and g2_signal.verdict == Verdict.FAKE
        and g2_signal.confidence is not None
        and g2_signal.confidence > FAKE_PROB_EARLY_EXIT
    ):
        result = VerifyResponse(
            verdict=Verdict.FAKE, confidence=g2_signal.confidence,
            explanation=build_explanation(g2_signal, text, sources),
            gate_fired=2, signals=signals, sources=sources,
        )
        await gate5_persist(text, claim_hash, result)
        return result

    # Gate 3 — NLI
    g3_signal = await gate3_nli(text, sources)
    if g3_signal:
        signals.append(g3_signal)

    # Conclusive check for 2 & 3
    conclusive = [
        s for s in signals
        if s.verdict != Verdict.UNCERTAIN
        and s.confidence is not None
        and s.confidence > 0.85
    ]
    if conclusive:
        winner = max(conclusive, key=lambda s: s.confidence or 0)
        result = VerifyResponse(
            verdict=winner.verdict, confidence=winner.confidence,
            explanation=build_explanation(winner, text, sources),
            gate_fired=winner.gate, signals=signals, sources=sources,
        )
        await gate5_persist(text, claim_hash, result)
        return result

    # Gate 4 — Gemini
    g4_signal = await gate4_gemini(text, sources)
    if g4_signal:
        signals.append(g4_signal)
        if g4_signal.verdict != Verdict.UNCERTAIN:
            result = VerifyResponse(
                verdict=g4_signal.verdict, confidence=g4_signal.confidence,
                explanation=build_explanation(g4_signal, text, sources),
                gate_fired=4, signals=signals, sources=sources,
            )
            await gate5_persist(text, claim_hash, result)
            return result

    # Fallback
    best_signal: GateSignal | None = None
    valid_signals = [s for s in signals if s.verdict != Verdict.UNCERTAIN and s.confidence is not None]
    if valid_signals:
        best_signal = max(valid_signals, key=lambda s: s.confidence or 0)

    if best_signal:
        warning = "\n\n⚠️ Chú ý: kết luận này dựa trên phân tích sơ bộ vì dữ liệu tìm kiếm không đủ rõ ràng để AI suy luận chuyên sâu."
        result = VerifyResponse(
            verdict=best_signal.verdict, confidence=best_signal.confidence,
            explanation=build_explanation(best_signal, text, sources) + warning,
            gate_fired=best_signal.gate, signals=signals, sources=sources,
        )
        await gate5_persist(text, claim_hash, result)
        return result

    result = VerifyResponse(
        verdict=Verdict.UNCERTAIN, confidence=None,
        explanation="Hệ thống không đủ bằng chứng để kết luận. Vui lòng kiểm tra thủ công.",
        gate_fired=0, signals=signals, sources=sources,
    )
    await gate5_persist(text, claim_hash, result)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)