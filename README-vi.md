<div align="right">
  <a href="README.md">🇺🇸 English</a> | <b>🇻🇳 Tiếng Việt</b>
</div>

<div align="center">
  <h1>🛡️ Hệ Thống Phát Hiện Tin Giả (Fake News Detection System)</h1>
  <p><i>Động cơ kiểm chứng tin tức AI Agent cấp Công nghiệp dành cho tiếng Việt</i></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python Version" />
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangChain-ReAct_Agent-green" alt="LangChain" />
  <img src="https://img.shields.io/badge/ChromaDB-Semantic_Cache-purple" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Gemini_2.0-Flash-orange" alt="Gemini AI" />
</div>

<br />

## 📖 Tổng Quan

**Dành cho Người Dùng Phổ Thông:**
Ứng dụng này là một Trợ lý AI tự trị (AI Agent) được thiết kế để giúp bạn xác minh nhận định là đúng hay sai. Không chỉ trả lời chung chung, hệ thống hoạt động như một nhà nghiên cứu thực thụ: tự động tìm kiếm trên web và Wikipedia, phân tích văn phong giật gân, phát hiện lỗi logic, và cung cấp một lời giải thích chi tiết kèm theo **trích dẫn bằng chứng cụ thể** và liên kết nguồn.

**Dành cho Lập Trình Viên:**
Dự án này triển khai một **Kiến trúc Thác nước 5 Trạm (5-Gate Waterfall) chuẩn Công nghiệp**. Hệ thống phân luồng dữ liệu từ **Semantic Caching (Cơ sở dữ liệu Vector)** siêu tốc, qua các mô hình NLP cục bộ (PhoBERT, Cross-Encoder NLI), và cuối cùng kích hoạt một **LangChain ReAct Agent** sử dụng Gemini 2.0 Flash để suy luận đa bước. Thiết kế này tối đa hóa độ chính xác đồng thời giảm thiểu hoàn toàn chi phí gọi API.

---

## ✨ Tính Năng Nổi Bật

- **🌐 Trí tuệ Đa Nguồn:** Trích xuất và tổng hợp ngữ cảnh thực tế từ cả DuckDuckGo và Wikipedia.
- **🔗 Trình Trích xuất URL Thông minh:** Tự động lấy nội dung từ các bài báo qua URL để kiểm chứng toàn bộ câu chuyện.
- **⚡ Bộ Nhớ Đệm Ngữ Nghĩa (Semantic Cache):** Sử dụng ChromaDB và Vector Embeddings để nhận diện các câu hỏi đồng nghĩa (VD: "Chó có 4 chân" và "Loài khuyển sở hữu bốn chi"), tiết kiệm 100% chi phí API cho các chủ đề lặp lại.
- **🧠 Luồng Xử lý Agent Tự trị:** Các nhận định phức tạp sẽ kích hoạt LangChain ReAct Agent, cho phép AI tự "suy nghĩ", tìm kiếm công cụ, và lặp lại quá trình để đưa ra phán quyết.
- **🔍 Xác minh bằng Trích dẫn:** Mỗi kết luận đều đi kèm với một đoạn trích dẫn (quote) lấy trực tiếp từ nguồn web để làm bằng chứng thép.

---

## 🏗️ Kiến Trúc: Thác Nước 5 Trạm

1. **Trạm 1: Bộ Nhớ Đệm Ngữ Nghĩa (ChromaDB + Prisma)**
   - Hệ thống mã hóa câu hỏi thành Vector. Nếu tìm thấy một nhận định có ý nghĩa tương đồng (>85%) trong CSDL Vector, nó sẽ trả về kết quả ngay lập tức (O(1)).
2. **Trạm 2: Bộ Lọc Văn Phong (PhoBERT Cục Bộ)**
   - Phân tích văn phong ngôn ngữ. Đánh dấu cảnh báo các tin tức giật gân hoặc clickbait. *Lưu ý: Trạm này đóng vai trò như một bộ lọc học thuật phụ trợ.*
3. **Trạm 3: Kiểm Chứng Ngữ Nghĩa (Cross-Encoder NLI Cục Bộ)**
   - Trích xuất ngữ cảnh trực tiếp từ Wikipedia và DuckDuckGo. Mô hình Natural Language Inference cục bộ sẽ so sánh nhận định. Nếu độ tin cậy cao, nó đưa ra kết quả lập tức kèm theo đoạn trích dẫn đối chiếu.
4. **Trạm 4: Suy Luận AI Agent (LangChain + Gemini 2.0)**
   - *Nhà Nghiên Cứu AI.* Một ReAct (Reasoning + Acting) Agent sẽ tiếp quản các câu hỏi khó hoặc chứa số liệu. Nó sử dụng Công cụ Tìm kiếm (Search Tools) để thu thập bằng chứng, suy luận từng bước, và đưa ra kết luận cuối cùng với bằng chứng trích dẫn rõ ràng.
5. **Trạm 5: Cập Nhật Cơ Sở Tri Thức**
   - Kết luận cuối cùng được lưu vào SQLite và mã hóa ngược lại vào ChromaDB để phục vụ Trạm 1 cho các truy vấn tương lai.

---

## 🚀 Hướng Dẫn Cài Đặt

Làm theo các hướng dẫn sau để thiết lập và chạy một bản sao của dự án trên máy tính cục bộ của bạn cho mục đích phát triển và thử nghiệm.

### Yêu Cầu Cấu Hình
- **Node.js** (phiên bản v18.0+ hoặc cao hơn)
- **Python** (phiên bản v3.10+ hoặc cao hơn)
- **Git**

### 1. Clone Kho Lưu Trữ (Repository)
```bash
git clone https://github.com/your-username/fake-news-detector.git
cd fake-news-detector
```

### 2. Thiết Lập Backend AI (Python)
```bash
cd "Python BackEnd"
pip install -r requirements.txt
```

**Khởi tạo Cơ sở dữ liệu:**
Chạy script cài đặt tự động (hỗ trợ mọi HĐH) để xây dựng CSDL SQLite:
```bash
python reset_db.py
```

**Biến Môi Trường:**
Tạo một tệp có tên `.env` bên trong thư mục `Python BackEnd` và thêm API Key Gemini của bạn:
```env
# /Python BackEnd/.env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **⚠️ Lưu ý quan trọng về Mô hình cục bộ (Trạm 2):**
> Do giới hạn kích thước tệp của GitHub, tệp `model.safetensors` (~540MB) dùng cho Trạm 2 (PhoBERT) không được bao gồm trong mã nguồn này.
> - Backend đã được lập trình để **tự động phát hiện việc thiếu tệp này và nhẹ nhàng bỏ qua Trạm 2**.
> - *Nếu bạn muốn bật lại Trạm 2*, bạn cần tải trọng số mô hình (`model.safetensors`) và đặt nó vào thư mục `Python BackEnd`.

### 3. Thiết Lập Frontend (Node.js)
```bash
cd "ReactWeb FrontEnd"
npm install
```

### 4. Chạy Ứng Dụng
Bạn sẽ cần chạy đồng thời cả backend và frontend.

**Terminal 1 (Backend):**
```bash
cd "Python BackEnd"
python api.py
```
*(Lưu ý: Lần chạy đầu tiên sẽ tốn chút thời gian để tải mô hình Embedding ~500MB cho ChromaDB. Cổng: 8000).*

**Terminal 2 (Frontend):**
```bash
cd "ReactWeb FrontEnd"
npm run dev
```

Mở trình duyệt và truy cập vào **http://localhost:25490**.

---

## 🛠️ Công Nghệ Sử Dụng

- **AI Framework:** LangChain (ReAct Agent Workflow)
- **Vector Database:** ChromaDB (Semantic Caching)
- **LLM:** Google Gemini 2.0 Flash
- **Local NLP:** HuggingFace Transformers (PhoBERT, xlm-roberta Cross-Encoder, paraphrase-multilingual-MiniLM)
- **Backend:** FastAPI, Python, Prisma ORM
- **Frontend:** React 19, Vite 6, Tailwind CSS 4
- **Nguồn Dữ Liệu:** DuckDuckGo, Wikipedia API

---

## 👨‍💻 Đóng Góp

Đóng góp là điều khiến cộng đồng mã nguồn mở trở thành một nơi tuyệt vời để học hỏi, truyền cảm hứng và sáng tạo. Bất kỳ đóng góp nào bạn thực hiện đều được **đánh giá rất cao**.

1. Fork Dự Án
2. Tạo Nhánh Chức Năng (Feature Branch) của bạn (`git checkout -b feature/AmazingFeature`)
3. Commit Thay Đổi (`git commit -m 'Thêm chức năng AmazingFeature'`)
4. Push Nhánh (`git push origin feature/AmazingFeature`)
5. Mở Yêu Cầu Kéo (Pull Request)

---

## 📝 Giấy Phép

Được phân phối theo Giấy Phép MIT. Xem `LICENSE` để biết thêm thông tin.

---
<div align="center">
  <p>Được xây dựng với ❤️ vì một không gian mạng an toàn và chân thực hơn.</p>
</div>
