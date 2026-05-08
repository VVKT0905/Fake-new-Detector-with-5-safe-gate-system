# BÁO CÁO DỰ ÁN: HỆ THỐNG PHÁT HIỆN TIN GIẢ (FAKE NEWS DETECTION SYSTEM)

## 1. Tổng Quan Dự Án (Project Overview)
Dự án "Hệ thống phát hiện tin giả" (Fake News Detection System) là một giải pháp kiểm chứng thông tin tiếng Việt hiệu năng cao. Điểm đột phá của hệ thống nằm ở **kiến trúc Thác nước 5 Trạm (5-Gate Waterfall Architecture)**, được thiết kế nhằm tối ưu hóa chi phí vận hành, ưu tiên năng lực tính toán cục bộ (local compute) và chỉ sử dụng các Mô hình Ngôn ngữ Lớn (LLM) khi thực sự cần thiết đối với các suy luận phức tạp.

## 2. Công Nghệ Sử Dụng (Technology Stack)
Hệ thống được phát triển toàn diện từ giao diện người dùng đến xử lý AI chuyên sâu, bao gồm:
*   **Giao diện (Frontend):** React.js (Vite), Tailwind CSS, Framer Motion, Lucide Icons. Cung cấp trải nghiệm người dùng hiện đại, có khả năng nhập văn bản trực tiếp hoặc dán URL bài báo (tự động cào dữ liệu).
*   **Máy chủ Trung gian (Backend Proxy/Scraper):** Node.js Express kết hợp Axios và Cheerio để xử lý việc cào dữ liệu (web scraping) và làm proxy phục vụ Frontend.
*   **Máy chủ Trí tuệ Nhân tạo (AI Backend API):** Python FastAPI, đóng vai trò điều phối luồng xử lý 5-Gate.
*   **Cơ sở dữ liệu (Database & ORM):** SQLite cục bộ được quản lý thông qua Prisma ORM (`dev.db`).
*   **Tìm kiếm & Trích xuất:** DuckDuckGo Search (thông qua thư viện `ddgs`) để trích xuất ngữ cảnh thực tế tự động.
*   **Mô hình AI (AI Models):**
    *   *Local Stylistic:* VinAI PhoBERT (đã được fine-tune) để nhận diện văn phong tin giả.
    *   *Local Semantic:* Cross-Encoder `xlm-roberta-large-xnli` xử lý tác vụ NLI.
    *   *Deep Reasoning:* API Google Gemini 2.5 Flash để suy luận sâu.

## 3. Kiến Trúc 5 Trạm Thác Nước (The 5-Gate Waterfall Workflow)
Luồng xử lý cốt lõi của hệ thống được chia làm 5 trạm kiểm duyệt, thông tin sẽ được lọc dần qua từng trạm nhằm tối ưu tốc độ và chi phí:

*   **Trạm 1 - Bộ Nhớ Đệm Cục Bộ (Gate 1: Local Cache):** 
    Ngay khi nhận yêu cầu, hệ thống sẽ truy vấn SQLite thông qua Prisma. Nếu nội dung (claim) đã được kiểm chứng trước đó, kết quả sẽ được trả về ngay lập tức (dưới 100ms).
*   **Trạm 2 - Phân Tích Văn Phong (Gate 2: PhoBERT Style):**
    Sử dụng mô hình PhoBERT cục bộ để phân tích đặc trưng ngôn ngữ. Nếu phát hiện văn phong mang tính chất "clickbait" hoặc tin rác với độ tin cậy > 98%, hệ thống sẽ lập tức đưa ra phán quyết "FAKE" mà không cần gọi các API bên ngoài.
*   **Trạm 3 - Đối Chiếu Ngữ Nghĩa (Gate 3: Local NLI Fact-Check):**
    Hệ thống tự động tìm kiếm thông tin liên quan qua DuckDuckGo. Sau đó, sử dụng mô hình Cross-Encoder cục bộ để đối chiếu thông tin tìm được với nội dung cần kiểm chứng.
    *   Nếu độ tin cậy > 96% và câu nói không chứa các con số/ngày tháng, trạm này sẽ đưa ra kết quả.
    *   **Number-Aware Routing:** Nếu nội dung chứa các con số hoặc ngày tháng, hệ thống tự động bỏ qua Trạm 3 và chuyển sang Trạm 4 để tránh rủi ro sai sót toán học của các mô hình nhỏ.
*   **Trạm 4 - Suy Luận Chuyên Sâu (Gate 4: Gemini Reasoning):**
    Được xem là "Cửa ải cuối cùng". Trạm này sử dụng sức mạnh suy luận của Gemini 2.5 Flash để phân tích nội dung dựa trên ngữ cảnh được cung cấp. Gemini được thiết lập prompt đặc biệt như một "Expert Fact-Checker" để soi xét kỹ các lỗi tinh vi về số liệu, ngày tháng (ví dụ: 1/3 khác 1/7).
*   **Trạm 5 - Cập Nhật Cơ Sở Tri Thức (Gate 5: Knowledge Base Update):**
    Sau khi có kết quả cuối cùng (kèm giải thích chi tiết và link nguồn đối chứng), dữ liệu sẽ được lưu ngược lại vào SQLite. Điều này giúp hệ thống "tự học" và tăng tốc tuyệt đối cho các lần truy vấn câu hỏi tương tự sau này.

## 4. Kết Quả Thử Nghiệm Nổi Bật
Quá trình thử nghiệm cho thấy sự phân bổ công việc hiệu quả giữa các trạm:
*   **Truy vấn lặp lại:** Các câu hỏi đã hỏi trước đó được Trạm 1 (Cache) xử lý tức thời (<100ms).
*   **Kiến thức chung thông thường:** Các nhận định như "Con mèo có 4 chân" được hệ thống đánh giá **TRUE** chính xác thông qua Trạm 3 hoặc Trạm 4 dựa trên ngữ cảnh thực tế.
*   **Bắt lỗi số liệu tinh vi:** Nhận định sai lệch về thời gian/số liệu (VD: "Tăng lương 8% từ 1/3" trong khi thực tế là 1/7) đã bị Trạm 4 (Gemini) phát hiện và đánh giá **FAKE**, đồng thời chỉ ra đúng số liệu chuẩn.

## 5. Cài Đặt và Khởi Chạy
Hệ thống được thiết kế để dễ dàng triển khai:
*   **Backend:** Chạy môi trường Python với FastAPI (`python api.py`), yêu cầu thư viện từ `requirements.txt` và cài đặt Prisma database.
*   **Frontend:** Chạy qua Node.js (`npm run dev` trong thư mục web).
*   Yêu cầu cấu hình biến môi trường `.env` chứa `GEMINI_API_KEY`.

## 6. Tổng Kết
Dự án đã xây dựng thành công một công cụ kiểm chứng tin tức không chỉ chính xác mà còn tối ưu hóa tài nguyên phần cứng. Bằng việc phân lớp xử lý theo tầng từ nhẹ đến nặng (Waterfall), hệ thống giải quyết được bài toán chi phí API của các hệ thống AI hiện nay trong khi vẫn giữ được khả năng suy luận sắc bén đối với các trường hợp tin giả phức tạp. Việc cung cấp minh bạch nguồn gốc và lời giải chi tiết bằng tiếng Việt giúp công cụ có tính ứng dụng rất cao.