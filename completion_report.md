# Fake News Detection System: Completion Report

## 1. Project Overview
The "Fake News Detection System" is a high-performance, 5-gate waterfall architecture designed to verify the truthfulness of Vietnamese news claims. It prioritizes local compute and cost-efficiency by cascading from fast, local checks to deep LLM reasoning only when necessary.

## 2. Final Technology Stack
*   **Frontend:** React.js (Vite) + Tailwind CSS + Lucide Icons + Framer Motion.
*   **Backend Proxy:** Node.js Express (serves the React app and handles web scraping via Axios/Cheerio).
*   **AI Backend API:** Python FastAPI (orchestrates the 5-Gate logic).
*   **Database & ORM:** Prisma ORM with a local SQLite database (`dev.db`).
*   **AI Models:**
    *   **Gate 2:** Fine-tuned PhoBERT (Local) for stylistic linguistic analysis.
    *   **Gate 3:** Multilingual Cross-Encoder (`xlm-roberta-large-xnli`) for local semantic inference (NLI).
    *   **Gate 4:** Gemini 2.5 Flash API for deep reasoning and detailed explanation.
*   **Search Retrieval:** DuckDuckGo Search (Direct Scraping via `ddgs` library).

## 3. The 5-Gate Waterfall Workflow
1.  **Gate 1 (Local Cache):** Immediate lookup in the local SQLite database using Prisma. If the claim hash exists, the result is returned instantly (< 100ms).
2.  **Gate 2 (PhoBERT Style):** Local linguistic analysis. If stylistic patterns are > 98% confident of "FAKE" (clickbait/spam), it returns a verdict without calling APIs.
3.  **Gate 3 (NLI Fact-Check):** Retrieves real-world snippets via DuckDuckGo and compares them to the claim using a local NLI model.
    *   If confidence > 96% and the claim contains no numbers, it returns a verdict immediately.
    *   Claims with numbers/dates are automatically passed to Gate 4 to avoid numerical reasoning errors in lightweight models.
4.  **Gate 4 (Gemini Reasoning):** The "Final Safe Gate". Uses Gemini 2.5 Flash to analyze the claim against retrieved context. It is specifically prompted to detect numerical/date discrepancies (e.g., 1/3 vs 1/7).
5.  **Gate 5 (Knowledge Base Update):** Automatically saves the final verdict, detailed explanation, and source links back to the SQLite database via Prisma for future reuse.

## 4. Current Configuration
*   **API Keys:** Stored in `phobert_fake_news_model/.env`.
*   **Database:** `phobert_fake_news_model/dev.db` (SQLite).
*   **Schema:** Defined in `phobert_fake_news_model/schema.prisma`.

## 5. Verification Results
*   **Common Sense:** Claims like "con mèo có 4 chân" are verified as TRUE using Gemini's internal knowledge when search snippets are generic.
*   **Numerical Discrepancies:** Claims with wrong dates (e.g., "1/3" instead of "1/7") are caught by Gate 4's strict prompting.
*   **Performance:** Second-time requests for the same claim are served instantly from Gate 1.
