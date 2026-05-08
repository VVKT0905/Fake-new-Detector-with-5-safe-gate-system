<div align="right">
  <b>🇺🇸 English</b> | <a href="README-vi.md">🇻🇳 Tiếng Việt</a>
</div>

<div align="center">
  <h1>🛡️ Fake News Detection System</h1>
  <p><i>An Industry-Grade, AI-Agent Fact-Checking Engine for Vietnamese News</i></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python Version" />
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangChain-ReAct_Agent-green" alt="LangChain" />
  <img src="https://img.shields.io/badge/ChromaDB-Semantic_Cache-purple" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Gemini_2.0-Flash-orange" alt="Gemini AI" />
</div>

<br />

## 📖 Overview

**For Everyone:**
This application is an autonomous AI Agent designed to verify if a piece of news or a claim is true or false. Instead of just a generic answer, it acts like a human researcher: searching the web and Wikipedia, analyzing language for clickbait, spotting logical errors, and providing a detailed explanation with exact quotes and source links.

**For Developers:**
This project implements an **Industry-Grade 5-Gate Waterfall Architecture**. It cascades from ultra-fast **Semantic Caching (Vector DB)** to local NLP models (PhoBERT, Cross-Encoder NLI), and ultimately deploys a **LangChain ReAct Agent** powered by Gemini 2.0 Flash for multi-step reasoning. This maximizes accuracy while minimizing LLM API costs.

---

## ✨ Key Features

- **🌐 Multi-Source Intelligence:** Retrieves and synthesizes live context from DuckDuckGo and Wikipedia.
- **🔗 Smart URL Scraper:** Automatically extracts content from news articles via URL to verify entire stories.
- **⚡ Semantic Caching:** Uses ChromaDB and embeddings to detect synonymous claims (e.g. "Cat has 4 legs" vs "Felines possess four limbs"), saving 100% of API costs on repeat concepts.
- **🧠 Autonomous Agentic Workflow:** Complex claims trigger a LangChain ReAct Agent that can think, search, and iterate before deciding.
- **🔍 Exact Quote Verification:** Verifications include direct snippet citations to prove or disprove the claim.

---

## 🏗️ Architecture: The 5-Gate Waterfall

1. **Gate 1: Semantic Cache (ChromaDB + Prisma)**
   - Computes a vector embedding of the input. If a conceptually identical claim exists in the vector database (>85% similarity), it returns instantly.
2. **Gate 2: Stylistic Filter (Local PhoBERT)**
   - Analyzes linguistic style. Flags obvious clickbait or sensationalism. *Note: Acts as an academic soft-filter.*
3. **Gate 3: Semantic Fact-Check (Local Cross-Encoder NLI)**
   - Extracts live context from Wikipedia and DuckDuckGo. A local Natural Language Inference model compares the claim. If confidence is high, it returns a verdict immediately with the exact matched snippet.
4. **Gate 4: Agentic Reasoning (LangChain + Gemini 2.0)**
   - *The AI Researcher.* A ReAct (Reasoning + Acting) Agent takes over for complex or numerical claims. It uses Search Tools to gather evidence, thinks step-by-step, and provides a final verdict with quoted proof.
5. **Gate 5: Knowledge Base Update**
   - The final verdict is stored in SQLite and embedded into ChromaDB to serve future queries at Gate 1.

---

## 🚀 Getting Started

Follow these instructions to set up the environment.

### Prerequisites
- **Node.js** (v18.0+)
- **Python** (v3.10+)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/fake-news-detector.git
cd fake-news-detector
```

### 2. Set Up the AI Backend (Python)
```bash
cd "Python BackEnd"
pip install -r requirements.txt
```

**Database Initialization:**
Run the universal setup script to build the local SQLite DB:
```bash
python reset_db.py
```

**Environment Variables:**
Create a `.env` file in the `Python BackEnd` folder:
```env
# /Python BackEnd/.env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **⚠️ Note About Local Models (Gate 2):**
> Due to GitHub's file size limits, the `model.safetensors` file (~540MB) used for Gate 2 (PhoBERT) is not included. 
> - The backend is designed to **automatically detect this missing file and gracefully skip Gate 2**.
> - *To enable Gate 2*, obtain the pre-trained weights and place them in the `Python BackEnd` directory.

### 3. Run the Application
You need two separate terminals.

**Terminal 1 (Backend):**
```bash
cd "Python BackEnd"
python api.py
```
*(Note: The first run will download the ~500MB multilingual embedding model for the Vector DB. Port: 8000).*

**Terminal 2 (Frontend):**
```bash
cd "ReactWeb FrontEnd"
npm install
npm run dev
```

Open **http://localhost:25490** in your browser.

---

## 🛠️ Tech Stack

- **AI Framework:** LangChain (ReAct Agent Workflow)
- **Vector Database:** ChromaDB (Semantic Caching)
- **LLM:** Google Gemini 2.0 Flash
- **Local NLP:** HuggingFace Transformers (PhoBERT, xlm-roberta Cross-Encoder, paraphrase-multilingual-MiniLM)
- **Backend:** FastAPI, Python, Prisma ORM
- **Frontend:** React 19, Vite 6, Tailwind CSS 4
- **Data Sources:** DuckDuckGo, Wikipedia API

---

## 👨‍💻 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  <p>Built with ❤️ for a safer, more truthful internet.</p>
</div>
