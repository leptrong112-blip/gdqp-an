# Chuyển kết quả AI Pose local lên Cloudflare

Localhost lưu `data/pose_results.jsonl` (hoặc thư mục `SURVEY_DATA_DIR`). Website Cloudflare lưu vào D1 được khai báo trong `wrangler.jsonc`. Deploy code không chuyển dữ liệu giữa hai nơi.

Đã có công cụ nhập một chiều, chỉ dành cho người quản trị máy có quyền D1:

```powershell
# Chỉ kiểm tra file local, không kết nối cloud
npm run pose:sync:cloudflare

# Kiểm tra mã lượt và hash trên D1, không ghi dữ liệu
npm run pose:sync:cloudflare -- --check-remote

# Nhập các lượt chưa có rồi đối chiếu toàn bộ mã lượt và hash
npm run pose:sync:cloudflare -- --apply
```

Cần Wrangler đã đăng nhập (`npx wrangler login`) và bảng từ migration `0004_pose_results.sql` đã được tạo trên D1. Token Cloudflare không đưa vào frontend, Git hay gửi cho người khác.

Công cụ đọc và kiểm tra toàn bộ file trước khi ghi. Giữ nguyên điểm, kết luận, nhận xét, thời gian, tư thế tiền đề và kết quả từng bước. Dùng cùng danh sách trường cho phép và cách tính hash với Worker; ảnh, video, dữ liệu khớp thô và token không được nhập. Các lượt cùng mã/nội dung được bỏ qua; cùng mã nhưng khác nội dung khiến công cụ dừng. Dữ liệu production đang có không bị sửa/xóa. Có thể chạy lại sau gián đoạn để nhập phần còn thiếu.

SQL tạm chỉ nằm trong thư mục `data/` đã bị loại khỏi Git, được xóa khi hoàn tất hoặc có lỗi. Không đưa file nguồn hoặc SQL vào `public/`, `dist/` hay thư mục static. Wrangler nhập file qua kết nối HTTPS và có thể tạm giữ việc truy vấn D1 trong thời gian nhập. Kết quả trên website vẫn dùng quyền đọc hiện có: giáo viên/admin; xuất và xóa dành cho admin. Các kiểm thử quyền đọc được giữ nguyên.

Đây là nhập dữ liệu hiện có, không phải đồng bộ hai chiều tự động. Khi tập trực tiếp trên tên miền Cloudflare, lượt mới được lưu thẳng vào D1. Nếu tiếp tục tập trên localhost thì chạy lại công cụ để nhập thêm. Công cụ chỉ chuyển kết quả AI Pose, không chuyển tài khoản, mật khẩu, phiên đăng nhập, XP, khảo sát hoặc điểm thi.
