# AI Pose — kiểm tra trước buổi thử người thật

Phạm vi: một camera laptop/điện thoại, xử lý trên thiết bị. Không tự ghi video hay gửi dữ liệu thực nghiệm lên mạng.

## Trước buổi thử

1. Dùng cùng một bản code/model trong suốt buổi. Không thay ngưỡng giữa các học sinh.
2. Bật chế độ chẩn đoán AI Pose trong giao diện (hoặc tham số `poseDebug=1`).
3. Vào tab Thực nghiệm, nhập mã học sinh như HS01, mã lượt như L01-quay-dung và loại thiết bị. Không nhập tên thật.
4. Bấm Bắt đầu ghi phiên trước khi hiệu chuẩn/đếm ngược. Ghi mỗi lượt thành một phiên riêng.
5. Sau khi có kết quả, bộ ghi tự dừng và lưu kết quả AI. Nhập đánh giá giáo viên, rồi xuất JSON và CSV ở tab Báo cáo.
6. Xuất ngay trước khi đóng bảng, đổi bài hoặc bắt đầu phiên mới. Dữ liệu trong bộ nhớ không được lưu bền qua tải lại trang.

## Các lượt nên kiểm tra

- Quay trái/phải đúng và giữ thế cuối.
- Cố tình quay ngược hướng yêu cầu.
- Quay quá đà, bước dịch chuyển khi quay, bỏ giữ thế cuối.
- Bàn chân song song, mũi chân hướng vào trong hoặc gót cách xa ở lúc chuẩn bị/lúc kết thúc; thêm lượt đúng có chân bị che để kiểm tra không trừ oan.
- Tay/chân bị che, mất người hoặc nhiều người đi vào khung hình.
- Lặp lại một lượt sau khi chờ vài giây, kiểm tra không dùng nhầm kết quả cũ.

Giáo viên đánh giá động tác thực tế trước khi xem điểm AI. Phân biệt đạt, chưa đạt và chưa đủ quan sát; không lấy hướng dẫn của lượt thử làm nhãn kết quả mặc định.

## Ý nghĩa dữ liệu

- JSON có mã phiên, cấu hình, phiên bản tiêu chí, kết quả AI, lý do từ chối, đánh giá giáo viên và các mẫu số đo.
- CSV có các trường trên theo từng mẫu, gồm góc quay, độ nghiêng vai chính thức, khoảng cách tay–hông, giai đoạn và FPS.
- Đây là telemetry lấy mẫu theo cập nhật giao diện, không phải video hoặc toàn bộ khung hình detector; không dùng nó để khẳng định có thể tái hiện chính xác từng điểm số.
- Giới hạn 1000 mẫu. Nếu chạm giới hạn, bộ ghi dừng và đánh dấu `truncated`; phiên này chưa đầy đủ.
- Kết quả thiếu dữ liệu không đồng nghĩa học sinh thực hiện sai.

## Tiêu chí quay từ bản v1.6

Thang 100 điểm: hướng 25, góc quay 25, thân và quay tại chỗ 10, giữ thế cuối 20, tay 10, bàn chân chuẩn bị 5, bàn chân kết thúc 5. Hai tiêu chí bàn chân là bắt buộc; chân sai rõ ràng không được bù bằng điểm thân/tay. Chưa thấy rõ bàn chân thì chưa đánh giá phần đó.

Chỉ kiểm tra chữ V và khoảng cách gót tại hai tư thế đầu/cuối, không chấm hình chữ V trong lúc xoay trụ. Đo trên mặt phẳng 3D vuông góc trục thân, lấy trung vị nhiều mẫu và loại dữ liệu dao động lớn. Các ngưỡng là dung sai thử nghiệm, chưa phải độ chính xác đã được xác nhận trên người thật. Không so trực tiếp tổng điểm bản v1.6 với bản cũ vì trọng số đã thay đổi.

## Giới hạn trước ngày thử

Từ bản v1.7, tư thế chào có thêm 10 điểm bàn tay/ngón tay; tiêu chí tay phải/cánh tay còn 25 điểm, tổng vẫn 100. Mô hình bàn tay tải từ tài nguyên cục bộ của website, chạy khi tay phải đưa gần đầu; tay áp đùi không phải điều kiện nhận diện ngón. Giao diện chỉ yêu cầu giữ tư thế chào, không chấm bước hạ tay. Khi thử, đối chiếu thêm ngón co/xòe, ngón cái mở, cổ tay gập, bàn tay nhỏ/che khuất và hiển thị lật gương. Chuỗi Nghiêm → Nghỉ → Chào dùng cùng tiêu chí này.

Ngưỡng bàn tay là thử nghiệm. Chưa dùng điểm này để xác nhận chính xác hướng lòng bàn tay hay điểm chạm vành mũ; vị trí đầu ngón được ước lượng so với các mốc đầu mà Pose nhìn thấy. JSON có các số đo đã dùng trong từng tiêu chí; phần thiếu hình ảnh vẫn được đánh dấu chưa đánh giá.

Kiểm thử code dùng khớp tổng hợp, không đo được độ chính xác detector trên học sinh thật. Một camera không xác nhận lực tỳ gót/mũi chân, cũng không quan sát chắc chắn các khớp bị che hoàn toàn. Đợt này là thử nghiệm, không dùng điểm AI làm điểm chính thức.
