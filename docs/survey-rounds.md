# Khảo sát theo đợt / phiên bản website

## Sử dụng

1. Vào trang admin, mục **Lịch sử & so sánh các đợt khảo sát**.
2. Chọn đợt ở **Báo cáo đang xem** để lọc biểu đồ, góp ý, AI và báo cáo Excel/CSV.
3. Sau khi cải tiến website, nhập tên đợt mới và ghi chú những thay đổi. Tạo đợt không tự mở nhận phiếu.
4. Bấm **Mở nhận phiếu đợt này** khi sẵn sàng. Nút Mở/Đóng trên thanh công cụ điều khiển đợt nhận phiếu hiện tại, không phải đợt đang xem báo cáo.
5. Mục so sánh chọn hai đợt khác nhau, cùng đối tượng, khối lớp và phần câu hỏi. Mặc định so sánh phần **Sau trải nghiệm**, phản ánh đánh giá website ở mỗi lần khảo sát. Có nút xuất Excel so sánh riêng.

Đợt 1 giữ toàn bộ dữ liệu có trước tính năng này, không suy đoán mốc thời gian để chia dữ liệu. Nếu dữ liệu cũ đã chứa nhiều đợt, cần xác nhận mốc và sao lưu trước khi phân loại lại; giao diện hiện chưa có chức năng phân loại lại dữ liệu cũ.

Không tạo số liệu mẫu. Không tự mở đợt 2. Không xóa/ghi đè phiếu cũ khi tạo hoặc mở đợt mới. Nút xóa toàn bộ đã được bỏ và API từ chối xóa `responses/all`. Xóa riêng một phiếu vẫn yêu cầu admin xác nhận.

Giữ nguyên bộ câu hỏi cốt lõi để so sánh. Bảng ghi số phiếu trả lời từng tiêu chí (n); không có dữ liệu được ghi rõ, không coi là điểm 0. Các tỷ lệ đa lựa chọn tính trên số phiếu trả lời câu đó. Khác biệt giữa hai nhóm không chứng minh quan hệ nhân quả và không mặc định là cùng một nhóm người.

## Backend và bảo toàn dữ liệu

- Cloudflare D1: migration bổ sung `0002_survey_rounds.sql` tạo danh mục đợt, gắn các phiếu cũ vào `legacy`, thêm cache AI theo đợt. Không xóa hoặc thay đổi câu trả lời cũ.
- Node/Express local: tự đọc cấu hình cũ dưới dạng đợt `legacy`, lưu danh mục đợt trong `survey_config.json`; phiếu cũ không bị viết lại.
- Gửi mới dùng `POST /api/survey/submissions`, cả trước/sau cùng một đợt. Cloudflare ghi hai phần trong một câu SQL có điều kiện kiểm tra đợt vẫn mở. Form đang mở từ đợt cũ nhận lỗi 409, không tự chuyển câu trả lời sang đợt mới.
- Một tài khoản được khảo sát lại ở đợt mới. Không ghép cặp trước/sau xuyên đợt. Người không đăng nhập vẫn gửi được.
- Bản Netlify cũ chưa được chuyển sang API đợt; không triển khai frontend mới lên backend Netlify cũ.

## Kiểm thử

```powershell
npm.cmd run lint
node --require ./scripts/tests/tsx-windows-preload.cjs --import tsx --test scripts/test-survey.ts cloudflare/tests/survey-rounds.test.ts
npm.cmd run build:client
```

Kiểm thử Worker dùng SQLite trong bộ nhớ và SQL thật của Worker, không gửi dữ liệu mẫu vào database online. Kiểm thử Express dùng thư mục tạm riêng.

## Đưa lên Cloudflare (chỉ sau khi duyệt bản cập nhật)

Workspace có thể chứa các sửa đổi khác: kiểm tra chúng trước khi build/deploy để tránh đưa lên thay đổi chưa được duyệt.

1. Sao lưu D1 bằng Wrangler export vào thư mục `data/` đã được gitignore. File chứa dữ liệu cá nhân, không đưa lên GitHub.
2. Xem danh sách migration đang chờ, chỉ áp dụng sau khi xác nhận đúng database `gdqp-survey` và migration `0002_survey_rounds.sql`.
3. Áp dụng migration trước, sau đó build/deploy Worker và assets cùng nhau. Backend cũ vẫn đọc được schema bổ sung trong khoảng chuyển tiếp.
4. Kiểm tra `/api/survey/config` trả `activeRoundId` và `activeRoundName`, đăng nhập admin kiểm tra số phiếu cũ không đổi. Không tạo khảo sát thử trong production.

```powershell
node node_modules/wrangler/bin/wrangler.js d1 export gdqp-survey --remote --output data/survey-before-rounds.sql
node node_modules/wrangler/bin/wrangler.js d1 migrations list gdqp-survey --remote
node node_modules/wrangler/bin/wrangler.js d1 migrations apply gdqp-survey --remote
npm.cmd run build:client
node node_modules/wrangler/bin/wrangler.js deploy --dry-run
node node_modules/wrangler/bin/wrangler.js deploy
```

Nếu cần rollback Worker, vẫn giữ schema bổ sung và bản sao lưu; không xóa bảng/phiếu để rollback. Dừng nhận phiếu trong lúc xử lý nếu cần.
