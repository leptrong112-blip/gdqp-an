# Đăng nhập và khảo sát GDQP-AN

Website mở trang chủ ngay cả khi chưa đăng nhập. Nút **Tài khoản** ở góc phải mở hộp thoại đăng nhập. Đăng nhập xong vẫn ở trang đang xem. Phiên tồn tại tối đa 8 giờ, bị hủy khi đăng xuất hoặc khởi động lại máy chủ.

- Admin: dùng trang chủ bình thường; mở **Tài khoản → Báo cáo khảo sát** để xem phản hồi tất cả giáo viên/học sinh, thống kê trước–sau, CSV, in/PDF, cấp tài khoản.
- Giáo viên: sử dụng website và bộ khảo sát riêng cho giáo viên.
- Học sinh: sử dụng website và bộ khảo sát riêng cho học sinh.
- Máy chủ xác định vai trò và danh tính từ phiên đăng nhập, không tin vai trò hay mã khảo sát do trình duyệt gửi.

## Tài khoản

Chạy `node --import tsx scripts/create-survey-accounts.ts` để cấp ba tài khoản ban đầu: `admin`, `giaovien`, `hocsinh01`. Script chỉ thêm tài khoản chưa tồn tại, sinh mật khẩu ngẫu nhiên và hiển thị một lần để bàn giao. Không có mật khẩu mặc định trong mã nguồn.

Admin mở **Quản lý tài khoản**, nhập tên đăng nhập, tên hiển thị, chọn học sinh hoặc giáo viên và bấm **Cấp tài khoản**. Lưu mật khẩu hiện ra để gửi riêng cho người được cấp. Mỗi học sinh cần tài khoản riêng; không dùng chung tài khoản để thu thập phản hồi cả lớp.

Tài khoản lưu trong `SURVEY_DATA_DIR/accounts.json` bằng mật khẩu băm scrypt có salt riêng. Không lưu mật khẩu gốc. Không còn dùng `SURVEY_ADMIN_PASSWORD` trong `.env`.

## Khảo sát và báo cáo

Mở thẻ Khảo sát hoặc `/survey` sau khi đăng nhập. Mỗi vai trò có 5 câu trước và 8 câu sau. Mỗi tài khoản gửi tối đa một phản hồi ở mỗi giai đoạn; đăng nhập lại hoặc đổi thiết bị vẫn nhận đúng trạng thái đã gửi.

Bốn tiêu chí so sánh: hiểu/ghi nhớ, hình dung/minh họa, hứng thú, ôn tập ngoài giờ. Mặc định ghép hai phản hồi cùng tài khoản và vai trò. Chế độ tất cả có thể gồm những nhóm người khác nhau. Không có dữ liệu không suy thành điểm 0. Đây là tự đánh giá, không thay thế kiểm tra kiến thức.

CSV chứa tên đăng nhập, tên hiển thị, giai đoạn, câu hỏi và câu trả lời của nhóm đang chọn (cả hai giai đoạn), tương thích Excel UTF-8. Phản hồi cũ dùng mã vẫn được giữ nguyên trong báo cáo, không tự gán vào tài khoản mới.

## Vận hành

`npm run dev` chạy website tại cổng 3001. Sau khi sửa mã máy chủ cần khởi động lại. API khảo sát và quản trị yêu cầu phiên đăng nhập; các chức năng học tập giữ khả năng truy cập từ trang chủ.

`SURVEY_DATA_DIR` mặc định `./data`, được loại khỏi Git, chứa tài khoản và `surveys.jsonl`. Sao lưu toàn bộ thư mục. Bản này dành cho một tiến trình Node với ổ đĩa bền vững; không chạy nhiều instance ghi chung tệp hoặc triển khai thành trang tĩnh.

Production cần HTTPS cho cookie Secure. Đặt `APP_URL` đúng URL khi chạy sau reverse proxy. Giới hạn đăng nhập sai là 10 lần/IP/15 phút. Cấu hình trust proxy theo hạ tầng thực tế nếu cần nhận đúng IP.

Kiểm tra: `npm run lint`, `npm run build`, `node --import tsx --test scripts/test-survey.ts`.
