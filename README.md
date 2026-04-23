# 🛡️ Fake News Detection System (5-Gate Waterfall)

Một hệ thống kiểm chứng tin tức (Fake News Detection) hiệu năng cao dành cho tiếng Việt, sử dụng kiến trúc **5-Gate Waterfall** để tối ưu chi phí và độ chính xác. Hệ thống kết hợp giữa các mô hình AI cục bộ (PhoBERT, NLI) và mô hình ngôn ngữ lớn (Gemini 2.5) để đưa ra phán quyết tin cậy nhất.

<<<<<<< HEAD
![GitHub Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

=======
>>>>>>> 1350e21fca5c18fd6ab70ab1f5c648d4a614f3ed
## 🚀 Tính năng nổi bật

- **Kiến trúc Thác nước 5 Trạm (5-Gate Waterfall):** 
    1.  **Trạm 1 (Local Cache):** Truy vấn kết quả siêu tốc từ cơ sở dữ liệu SQLite (Prisma) cho các yêu cầu trùng lặp.
    2.  **Trạm 2 (PhoBERT Style):** Sử dụng PhoBERT đã được fine-tune để nhận diện văn phong tin giả, clickbait cục bộ.
    3.  **Trạm 3 (Local NLI):** Tự động tìm kiếm context qua DuckDuckGo và đối chiếu ngữ nghĩa bằng mô hình Cross-Encoder cục bộ.
    4.  **Trạm 4 (Gemini Reasoning):** "Cửa ải cuối cùng" sử dụng Gemini 2.5 Flash để suy luận sâu, đặc biệt soi lỗi các con số, ngày tháng tinh vi.
    5.  **Trạm 5 (Knowledge Base):** Tự động học và lưu kết quả vào máy để tái sử dụng.
- **Xác minh đa năng:** Hỗ trợ nhập văn bản trực tiếp hoặc dán URL bài báo (tự động cào dữ liệu).
- **Giải thích chi tiết:** Không chỉ trả về Đúng/Sai, hệ thống còn cung cấp giải thích bằng tiếng Việt và các link nguồn đối chứng.

## 🛠️ Công nghệ sử dụng

- **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend AI:** Python FastAPI, Prisma ORM, SQLite.
- **Models:** 
    - [VinAI PhoBERT](https://github.com/VinAIResearch/PhoBERT) (Stylistic Filter)
    - Cross-Encoder `xlm-roberta-large-xnli` (Local NLI)
    - Google Gemini 2.5 Flash API (Deep Reasoning)
- **Scraper:** Node.js Express, Axios, Cheerio.

## 📦 Cài đặt và Chạy hệ thống

### 1. Yêu cầu hệ thống
- Node.js (v18+)
- Python 3.10+
- GPU (Khuyến khích để chạy NLI cục bộ nhanh hơn, nếu không sẽ chạy trên CPU)

### 2. Cài đặt AI Backend (Python)
```bash
cd phobert_fake_news_model
pip install -r requirements.txt
# Khởi tạo cơ sở dữ liệu cục bộ
python -m prisma db push
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục `phobert_fake_news_model/` và điền key của bạn:
```env
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Cài đặt Frontend & Proxy (Node.js)
```bash
cd "Web front end"
npm install
```

### 5. Chạy ứng dụng
Mở 2 terminal song song:
- **Terminal 1 (Backend):** `python api.py` (Chạy tại port 8000)
- **Terminal 2 (Frontend):** `npm run dev` (Chạy tại port 25490)

Sau đó truy cập: `http://localhost:25490`

## 📊 Kết quả thử nghiệm

| Tình huống | Trạm xử lý | Kết quả |
| :--- | :--- | :--- |
| "Con mèo có 4 chân" | Gate 3 (NLI) | **TRUE** (Dựa trên context thực tế) |
| "Tăng lương 8% từ 1/3" (Sai ngày) | Gate 4 (Gemini) | **FAKE** (Chỉ ra đúng là 1/7) |
| Câu hỏi đã hỏi trước đó | Gate 1 (Cache) | **INSTANT** (Trả về <100ms) |

## 📝 Giấy phép
Dự án được phát triển phục vụ mục đích nghiên cứu và học tập.

---
© 2026 Web Check Đào Lửa - Project Cuối Kỳ Nhóm 11.
