# Mẫu đối chiếu tiền đề nghiêm/nghỉ

Ngày kiểm tra: 09/10/2026. Nguồn: ba ảnh đứng nghiêm và một ảnh đứng nghỉ người dùng gửi ngày 08/10/2026.

## Phạm vi sử dụng

`scripts/tests/fixtures/pose/referenceSilhouettes.ts` lưu tọa độ 2D được chép gần đúng từ các điểm khung xương nhìn thấy trong ảnh. Không lưu ảnh hoặc danh tính học sinh. Chiều sâu bằng 0 và độ tin cậy .99 trong fixture là giả định mô phỏng, không phải số đo MediaPipe thu từ ảnh.

Các mẫu dùng để kiểm tra hình dáng và luồng tiền đề, không huấn luyện lại MediaPipe, không thay thế dữ liệu camera hiện tại, không chứng minh góc bàn chân 3D hoặc điểm tuyệt đối của người trong ảnh.

## Áp dụng bộ kiểm tra chung

`runtime/commandFlow.ts` khai báo tiền đề; `SessionProcessor` dùng `preparationDefinition` và `PreparationReadiness` cho tất cả động tác:

| Bài tập | Tiền đề | Khẩu lệnh |
| --- | --- | --- |
| Đứng nghiêm | Đứng nghỉ | NGHIÊM |
| Đứng nghỉ | Đứng nghiêm | NGHỈ |
| Quay trái | Đứng nghiêm | BÊN TRÁI — QUAY |
| Quay phải | Đứng nghiêm | BÊN PHẢI — QUAY |
| Chào | Đứng nghiêm | CHÀO |
| Chuỗi Nghiêm → Nghỉ → Chào | Nghỉ → Nghiêm → Nghiêm, theo từng bước | NGHIÊM → NGHỈ → CHÀO |

Các sửa lỗi ổn định tiền đề hiện có vì vậy áp dụng chung, không có bộ nhận diện riêng chỉ cho bài đứng nghiêm. Không đổi công thức điểm hoặc ngưỡng chấm theo ảnh của một học sinh.

## Kiểm tra hồi quy

`scripts/tests/pose-reference-preconditions.test.ts` chạy qua SessionProcessor thực:

- Cả sáu lựa chọn bài tập; cả ba mẫu nghiêm và mẫu nghỉ tương ứng.
- 5, 10, 15, 30 FPS; bật/tắt điểm tiền đề; cổ tay rõ hoặc một bên bị che và bên còn lại mất dấu ngắn.
- 224 tổ hợp chuẩn bị phải phát đúng một khẩu lệnh sau đếm ngược 3 giây, không chấm động tác chính trước khẩu lệnh.
- Thiếu khớp chân cốt lõi hoặc thiếu sáng không được thay bằng mẫu để cho qua.
- Chuỗi điều lệnh hoàn thành hai bước đầu và tới đúng khẩu lệnh CHÀO với tiền đề đúng ở cả ba bước. Mẫu nghiêm/nghỉ không thay cho chuyển động nâng tay của bước chào.

Chạy: `node --import tsx --test scripts/tests/pose-reference-preconditions.test.ts`.

Kết quả này kiểm chứng logic với quan sát mô phỏng; vẫn cần kiểm tra webcam thực tế với nhiều người, góc camera và điều kiện ánh sáng.
