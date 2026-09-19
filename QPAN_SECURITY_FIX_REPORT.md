# BÁO CÁO KHẮC PHỤC BẢO MẬT TOÀN DIỆN DỰ ÁN QPAN (GDQP-AN)

- **Dự án:** Cổng thông tin học tập và giáo dục Quốc phòng - An ninh (GDQP-AN THPT)
- **Thời gian hoàn thành:** 19/09/2026
- **Nhánh thực hiện (Branch):** `security/hardening-qpan`
- **Tình trạng:** Đã hoàn thiện toàn bộ các biện pháp an ninh, chấm điểm bảo mật phía server, rà soát dependencies và kiểm kê file chuẩn bị commit. Toàn bộ kiểm thử tự động và build production đều đạt 100% (Pass). **Tuyệt đối KHÔNG tự động commit, merge, push hoặc deploy.**

---

## 1. Tóm Tắt Kết Quả Xử Lý (Executive Summary)

### 1.1. [CRITICAL] Xóa bỏ triệt để Cửa sau (Backdoor Master PIN)
- **Vị trí:** `server/auth.ts`, `scripts/test-survey.ts`
- **Thực hiện:**
  - Xóa bỏ hoàn toàn mã PIN cứng (`123456`, `admin123`, `isPinAdmin`, header `x-admin-pin`, body `pin`).
  - Bắt buộc kiểm tra phiên đăng nhập hợp lệ (`requireUser`) và mật khẩu cũ (`oldPassword`) với thuật toán so sánh thời gian an toàn (`timingSafeEqual`) chống timing attacks.
  - Ngăn chặn người dùng thường đổi mật khẩu của tài khoản khác (chỉ Admin mới có thể đổi mật khẩu người khác).
  - Loại bỏ các thông báo lỗi để lộ mã PIN.

### 1.2. [HIGH] Hoàn thiện Hệ thống Chấm điểm Bài thi An toàn (Server-Side Exam Grading)
- **Vị trí:** `server/exam.ts`, `scripts/tests/exam-api.test.ts`
- **Vấn đề ban đầu:** Client tự tính điểm và gửi `score: 10.0` lên máy chủ mà không có bất kỳ bước kiểm chứng nào; học sinh có thể can thiệp DevTools để sửa điểm sổ học bạ.
- **Giải pháp toàn diện đã triển khai:**
  1. **Nạp Ngân hàng Đề thi Gốc lên Server:** Server nạp trực tiếp ngân hàng câu hỏi `ALL_BANK_MCQ`, `ALL_BANK_TF`, `ALL_BANK_ESSAY` từ `src/data`.
  2. **Chấm lại 100% câu trắc nghiệm (MCQ):** Đối chiếu câu trả lời của học sinh (`selectedOption`) với đáp án chính xác trong ngân hàng câu hỏi. Tự động ghi đè lại cờ `isCorrect`, `correctOption` và `explanation` chuẩn xác.
  3. **Chấm lại câu hỏi Đúng / Sai (TF) theo quy chế Bộ GD&ĐT:** Kiểm tra từng ý a, b, c, d; tính điểm lũy tiến (1 ý đúng = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; 4 ý = 1.0đ).
  4. **Kiểm duyệt thang điểm tự luận:** Khống chế điểm tự luận trong barem điểm tối đa (`maxScore`) và dung lượng bài làm thực tế.
  5. **Quy tắc ép điểm tối đa (Anti-Tampering Score Clamp):** Điểm số cuối cùng `score`, `accuracyPercent`, `xpGained`, `correctCount` **bị khóa chặt không bao giờ vượt quá kết quả chấm thực tế trên Server**.
  6. **Đã kiểm thử tự động:** Thêm ca kiểm thử gửi bài thi chọn đáp án SAI nhưng claim `score: 10.0` và `isCorrect: true` -> Server lập tức ép điểm về đúng `0.0 điểm` và `0% chính xác`.

### 1.3. [HIGH] Bảo vệ API Trợ giảng & Chấm Tự luận AI (Rate Limiting & DoS Protection)
- **Vị trí:** `server.ts`
- **Thực hiện:**
  - Cấu hình giới hạn kích thước gói tin gửi lên máy chủ (`express.json({ limit: '1mb' })`).
  - Bộ đệm Sliding Window Rate Limiter theo IP:
    - `/api/ask`: Tối đa **20 yêu cầu / phút / IP** (vượt quá nhận HTTP 429).
    - `/api/evaluate-essay`: Tối đa **10 yêu cầu / phút / IP**.
  - Ràng buộc độ dài: `message <= 2000` ký tự, `history <= 15` lượt, `userResponse <= 5000` ký tự.
  - Ẩn toàn bộ chi tiết lỗi nội bộ (`err.message`) từ Gemini API.

### 1.4. [HIGH] Ngăn ngừa lộ file mật khẩu trên Netlify
- **Vị trí:** `netlify.toml`, `netlify/functions/survey.ts`
- **Thực hiện:**
  - Xóa bỏ hoàn toàn dòng `included_files = ["data/accounts.json"]` trong `netlify.toml`.
  - Bổ sung cơ chế fallback tự tạo tài khoản admin ban đầu từ biến môi trường `ADMIN_INITIAL_PASSWORD` khi chạy serverless mà không cần file mật khẩu cục bộ.

### 1.5. [MEDIUM] Cập nhật và siết chặt `.gitignore` & Tạo `.env.example`
- **Vị trí:** `.gitignore`, `.env.example`
- **Thực hiện:**
  - Bổ sung `scratch/`, `artifacts/ak-sight/`, `UPDATE-WEBSITE.bat` vào `.gitignore`.
  - Tạo file mẫu `.env.example` an toàn để cộng tác viên có thể thiết lập môi trường dễ dàng.

### 1.6. [SECURITY] Xoay vòng và bảo mật Khóa API (Secrets Rotation)
- **Thực hiện:**
  - API Key Google Gemini mới do người dùng cung cấp (`AQ.Ab8...6qw`) đã được cấu hình vào file `.env`.
  - Che giấu toàn bộ giá trị khóa thô trong tài liệu báo cáo kiểm toán trước đó.
  - Quét kiểm tra toàn bộ repository: Không có bất kỳ khóa bí mật nào bị rò rỉ trong mã nguồn hay các file được Git theo dõi.

---

## 2. Báo Cáo Rà Soát Chi Tiết Các Lỗ Hổng Dependencies Còn Lại

Lệnh `npm audit` ghi nhận 10 cảnh báo độ nghiêm trọng cao (High). Dưới đây là phân tích chi tiết và đánh giá an toàn thực tế:

| Thư viện | Phiên bản | Vấn đề | Phạm vi sử dụng | Đánh giá rủi ro thực tế trong môi trường Production |
| :--- | :--- | :--- | :--- | :--- |
| **`xlsx`** (SheetJS) | `^0.18.5` | Prototype Pollution & ReDoS | `src/utils/excelExport.ts` | **AN TOÀN TUYỆT ĐỐI (KHÔNG BỊ ẢNH HƯỞNG):** Các lỗ hổng này của SheetJS **chỉ xuất hiện khi đọc/phân tích (parse) file Excel từ bên ngoài tải lên** (`XLSX.read` hoặc `XLSX.readFile`). Dự án **hoàn toàn không có tính năng upload/đọc file Excel**, mà chỉ dùng `XLSX.write()` để **xuất (export)** dữ liệu nội bộ ra file `.xlsx` cho giáo viên tải về. Do đó, bề mặt tấn công không tồn tại. |
| **`sharp`** | `<=0.35.4-rc.0` | libvips / libheif CVEs | Chỉ dùng trong `wrangler/miniflare` & `netlify-cli` (devDependencies) | **AN TOÀN:** Là công cụ phát triển dev cục bộ, hoàn toàn không được đóng gói vào bản build production (`dist/server.cjs` hoặc `dist/assets/`). |
| **`undici`** | `7.0.0 - 7.28.0` | DoS, HTTP Smuggling | Phụ thuộc bên trong `miniflare` (devDependencies) | **AN TOÀN:** Không được nạp hay thực thi trong môi trường production Node.js hoặc trình duyệt. |
| **`ws`** | `8.0.0 - 8.20.1` | Memory disclosure | Phụ thuộc bên trong `miniflare` (devDependencies) | **AN TOÀN:** Không sử dụng trong runtime production. |

> [!TIP]
> 10 lỗ hổng khác (`esbuild`, `vite`, `browserslist`, `body-parser`, `qs`, `fflate`, `protobufjs`, `baseline-browser-mapping`) đã được vá sạch thông qua `npm audit fix` mà không gây breaking changes.

---

## 3. Kiểm Kê Toàn Bộ File Chuẩn Bị Cho Commit (Pre-Commit Inventory)

### 3.1. Các file đã sửa đổi (Modified Files)
1. **`.env.example`**: File mẫu an toàn (chỉ chứa giá trị mẫu `YOUR_GEMINI_API_KEY_HERE`).
2. **`.gitignore`**: Bổ sung `scratch/`, `artifacts/ak-sight/`, `UPDATE-WEBSITE.bat`.
3. **`netlify.toml`**: Đã loại bỏ dòng `included_files = ["data/accounts.json"]`.
4. **`netlify/functions/survey.ts`**: Thêm cơ chế fallback tài khoản khi thiếu file mật khẩu cục bộ.
5. **`package.json` & `package-lock.json`**: Cập nhật các bản vá bảo mật dependencies an toàn.
6. **`server.ts`**: Rate limiting, body limit 1MB, validate độ dài ký tự AI, mask lỗi.
7. **`server/auth.ts`**: Xóa triệt để backdoor PIN, bắt buộc phiên đăng nhập và mật khẩu cũ.
8. **`server/exam.ts`**: Nạp ngân hàng câu hỏi, chấm lại trên server, khóa cứng điểm chống gian lận.
9. **`scripts/test-survey.ts`**: Cập nhật assertion bảo mật cho xác thực và đổi mật khẩu.
10. **`scripts/tests/exam-api.test.ts`**: Thêm test kiểm tra chống gian lận điểm thi.
11. **Các file giao diện/3D đã có từ trước**: `ArcadeRangeSection.tsx`, `ShootingRange3D.tsx`, `ShootingRangeSection.tsx`, `SurveyAdminSection.tsx`, `WebARSection.tsx`, `ExamAdminSection.tsx`, `CrawlSimulation.tsx`, `PostureSimulation.tsx`, `src/index.css`.

### 3.2. Các file chưa theo dõi (Untracked Files - Hợp lệ để thêm vào Git)
- **`QPAN_SECURITY_FIX_REPORT.md`**: Báo cáo khắc phục bảo mật này (không chứa bí mật).
- **`docs/`**: Các tài liệu hướng dẫn kỹ thuật (`AK_REAR_SIGHT_ASSET.md`, `BAO_CAO_PHAN_BIEN...`, `RANGE_INPUT_VERIFICATION.md`).
- **`public/models/*.glb`**: Các mô hình 3D chiến sĩ và súng AK phục vụ học tập mô phỏng.
- **`scripts/`**: Các script kiểm thử 3D và đầu ngắm AK.
- **`src/components/` & `src/utils/excelExport.ts`**: Các module trường bắn và xuất báo cáo Excel.

### 3.3. Các file TUYỆT ĐỐI KHÔNG COMMIT (Đã được `.gitignore` bảo vệ)
- **`.env`**: Chứa khóa API Google Gemini thật (`AQ.Ab8...6qw`). *(Đã trong `.gitignore`)*
- **`data/`**: Chứa `accounts.json` (mật khẩu), `surveys.jsonl` (thông tin cá nhân học sinh), `exam_results.jsonl`. *(Đã trong `.gitignore`)*
- **`scratch/`**: Chứa script Blender và backup model tạm thời. *(Đã trong `.gitignore`)*
- **`artifacts/ak-sight/`**: File thử nghiệm đầu ngắm. *(Đã trong `.gitignore`)*
- **`UPDATE-WEBSITE.bat`**: Script deploy cá nhân. *(Đã trong `.gitignore`)*
- **`dist/`**: Thư mục build production. *(Đã trong `.gitignore`)*

---

## 4. Kết Quả Kiểm Thử Toàn Diện (Verification & Test Results)

Tất cả các bài kiểm tra chức năng cốt lõi, bảo mật và đóng gói đều đạt kết quả tuyệt đối:

| Bài kiểm tra | Lệnh thực thi | Kết quả | Thời gian |
| :--- | :--- | :---: | :---: |
| **Kiểm tra kiểu dữ liệu TypeScript** | `npx tsc --noEmit` | **PASS (0 errors)** | ~5s |
| **Hệ thống AI Phân tích Động tác** | `npm run test:pose` | **PASS (28/28 tests)** | 500ms |
| **Xác thực & Bảo mật Khảo sát** | `npx tsx scripts/test-survey.ts` | **PASS (1/1 test)** | 700ms |
| **Chống gian lận điểm & API Bài thi** | `npx tsx scripts/tests/exam-api.test.ts` | **PASS (1/1 test)** | 345ms |
| **Client Bài thi** | `npx tsx scripts/tests/exam-client.test.ts` | **PASS (1/1 test)** | 22ms |
| **Mô phỏng Động tác Bò & Trườn 3D** | `npx tsx scripts/tests/training-runtime.test.ts` | **PASS (6/6 tests)** | ~4s |
| **Trường bắn & Thước ngắm AK-47** | `scripts/tests/arcade-range.test.ts` & `rear-sight.test.ts` | **PASS (7/7 tests)** | ~20ms |
| **Đóng gói Production** | `npm run build` | **PASS (Vite + esbuild server)** | 40s |

---

## 5. Trạng Thái Hiện Tại & Quyền Quyết Định Của Người Dùng

- Toàn bộ source code đã được tối ưu và bảo vệ an toàn trên nhánh `security/hardening-qpan`.
- Dữ liệu học sinh, điểm thi, tài khoản trong thư mục `data/` được giữ nguyên vẹn 100%.
- **Chưa có lệnh `git commit`, `git merge`, `git push` hay `deploy` nào được thực thi.**
- Khi bạn đã sẵn sàng commit, bạn có thể thực hiện:
  ```bash
  git add .
  git commit -m "feat(security): complete secure exam grading, auth hardening, and secret isolation"
  ```
