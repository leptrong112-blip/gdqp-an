# AI Pose: kết luận theo điểm tổng

Áp dụng cho lượt chấm mới với phiên bản `v1.8-overall-score-65`.

- Điểm tổng từ 6,5/10 là Đạt, dưới 6,5/10 là Chưa đạt.
- Bài đơn cộng điểm các tiêu chí theo trọng số, không lấy trung bình các nhóm có trọng số khác nhau.
- Chuỗi Nghiêm → Nghỉ → Chào lấy trung bình ba điểm động tác. Điểm tổng được làm tròn như bộ chấm hiện có và hiển thị thống nhất ở kết quả và bản lưu.
- Tiêu chí chưa đạt vẫn giữ điểm, nhận xét và trạng thái riêng. Một tiêu chí kỹ thuật chưa đạt không tự động phủ quyết kết luận toàn bài.
- Bỏ giới hạn điểm tổng riêng của lỗi quay; các lỗi hướng quay, đi bước, bàn chân và giữ thế vẫn được phản ánh trong tiêu chí tương ứng. Do đó một lỗi riêng có thể đi kèm kết luận tổng Đạt nếu tổng điểm đủ ngưỡng.
- Nếu thiếu dữ liệu quan sát, kết luận là Chưa đủ dữ liệu. Không tự coi phần thiếu là đúng hoặc sai.
- Các kết quả đã lưu theo phiên bản cũ không bị sửa lại. Muốn có kết luận theo quy tắc mới cần thực hiện một lượt mới.

Kiểm thử bổ sung: ngưỡng 65/100, trường hợp 83/100 có tiêu chí chân 11,4/25 chưa đạt, bản lưu hợp lệ giữ cả kết luận tổng Đạt và tiêu chí Chưa đạt, chuỗi 20 + 90 + 90 có tổng trung bình đạt, thiếu dữ liệu không được kết luận đạt.
