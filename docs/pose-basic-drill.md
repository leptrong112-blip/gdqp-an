# Báo cáo: chấm nghiêm/nghỉ và chuỗi điều lệnh cơ bản

## Phạm vi

Chỉ thay đổi pose analysis, test và tài liệu. Tái sử dụng camera, MediaPipe, worker và `SessionProcessor`; không train model, không thay engine physics. Chuỗi mới là bài giữ ba tư thế Nghiêm → Nghỉ → Chào, không phải đánh giá kỹ thuật chuyển chân hay toàn bộ động tác giơ/hạ tay.

## Nguyên nhân tìm thấy trong code

- Mỗi nhóm lấy điểm điều kiện thấp nhất (`Math.min`); một phép đo tay/gót nhiễu có thể trừ điểm cả nhóm.
- Nghiêm đòi gối ≥170°, nghỉ đòi chân trụ ≥170°, chân chùng ≤168° và chênh lệch ≥10°. Chùng nhẹ hợp lý bị phạt dù các phần khác tốt.
- Điểm trung bình từng frame chưa loại những frame xấu đơn lẻ. Nhận xét lại dùng các ngưỡng hard-code khác rubric nên có thể mâu thuẫn với điểm.
- Cổng ổn định đo độ dịch hông trong cửa sổ, với ngưỡng dọc/ngang như nhau. Hạ người nhẹ trong lúc vào tư thế có thể bị ngắt chấm. **Không có phép trừ điểm trực tiếp theo chiều cao hông tuyệt đối**; tọa độ 3D được chuẩn hóa tại hông.
- Khoảng thời gian cuối countdown từng bị cộng luôn vào chấm ở frame chuyển trạng thái. Banner countdown ghi cứng “đứng nghiêm” và không hiện trong fullscreen.

## Ngưỡng và cách gộp điểm

Các ngưỡng dưới đây là dung sai luyện tập beta, dựa trên việc nới giới hạn có sẵn, không phải chuẩn đo sinh học đã hiệu chuẩn trên học sinh. Cần giáo viên và dữ liệu thực tế xác nhận trước khi dùng chấm chính thức.

| Phép đo | Trước | Sau — vùng đủ điểm |
|---|---|---|
| Gối đứng nghiêm | ≥170° | ≥165°; vẫn giảm tuyến tính về 0 tại 140° |
| Chân trụ đứng nghỉ | ≥170° | ≥165°; về 0 tại 145° |
| Chân chùng đứng nghỉ | 145–168° | 145–175°; 0 tại ≤120° hoặc ≥179° |
| Chênh hai gối khi nghỉ | 10–35° | 5–35°; 0 tại ≤1° hoặc ≥55° |
| Mũi chân nghiêm/nghỉ | 35–55° | 25–65°; 0 tại ≤5° hoặc ≥95° |
| Khoảng cách gót/độ rộng vai khi nghiêm | ≤0.18 | ≤0.25; 0 tại 0.65 |

- Nghiêm/nghỉ: bỏ 5% điểm frame thấp nhất **và** 5% cao nhất trước lấy trung bình. Ví dụ 30 frame chỉ bỏ một frame mỗi đầu; không che được lỗi kéo dài.
- Các điều kiện mềm trong nhóm lấy trung bình thay vì điều kiện thấp nhất. Riêng ba đặc trưng chân nghỉ là thiết yếu: một điều kiện không đạt vẫn giới hạn nhóm chân. Không thể chỉ đứng nghiêm rồi được nhận là nghỉ.
- Điểm toàn động tác vẫn là tổng có trọng số 100, không nhân dây chuyền làm sập toàn bộ điểm.
- Thân và chân là hai nhóm bắt buộc của nghiêm/nghỉ. Tổng ≥65/100 và mỗi nhóm bắt buộc ≥60% để đạt mức luyện tập. Điểm số và kết luận được tách rõ: các phần khác làm tốt vẫn có điểm nhưng không bù cho lỗi chân/thân nghiêm trọng.
- Nhận xét nghiêm/nghỉ đọc trực tiếp `rules` của bài tương ứng; nhóm được đánh giá PASS không đồng thời liệt kê lỗi theo ngưỡng cũ.
- Ngưỡng chào và quay trái/phải không thay đổi. Trong chuỗi, chào cần nhóm tay chào đạt tối thiểu 60%; chỉ buông tay không thể qua bằng điểm phần thân.

## Chùng gối, hạ người và ổn định

- Góc gối vẫn đo bằng 3D hip–knee–ankle, không dùng việc các đoạn xương trông thẳng trên ảnh 2D để kết luận gối thẳng.
- Cho phép dịch dọc khi vào tư thế gấp hai ngưỡng ổn định cũ (0.16 chiều dài thân), không nới dịch ngang (0.08). Chỉ áp dụng nghiêm/nghỉ trong countdown/chấm; không cộng điểm cho hạ hông.
- Cửa sổ giữ tư thế 800 ms, ít nhất sáu mẫu; MAD góc thân/vai/hông ≤5°, gối/khuỷu ≤8°, khoảng cách tay-hông ≤0.12 đơn vị chuẩn hóa. Kiểm tra thêm khoảng biến thiên sau bỏ 20% mỗi đầu để phát hiện dao động giữa hai tư thế mà MAD có thể bỏ sót. Đây là ngưỡng ổn định, không phải ngưỡng chấm động tác.
- Tư thế thay đổi đáng kể hoặc tracking chập chờn làm tính lại ba giây giữ, không nối các đoạn rời thành một lần giữ ổn định.
- Vẫn giữ các cổng confidence, thiếu khớp/3D, chồng hình đầu gối, ánh sáng và toàn thân. Không tự bịa khớp bị che. Mất tracking kéo dài trả `notScorable`, không quy thành học sinh làm sai.

## Flow mới

Chọn “Chuỗi điều lệnh cơ bản” trong menu → bật camera → đủ điều kiện theo dõi ổn định → tự động chuẩn bị/hiệu chuẩn nếu tùy chọn đó bật (hoặc bấm hiệu chuẩn) → countdown 3–2–1 → Bắt đầu → giữ Nghiêm 3 giây → countdown riêng cho Nghỉ → giữ 3 giây → countdown cho Chào → giữ 3 giây → modal tổng kết.

- Hiệu chuẩn một lần cho chuỗi; xóa mẫu của bước cũ và lịch sử lọc trước bước mới. Không chấm frame countdown hay thời gian chuyển tư thế.
- Một bước đủ dữ liệu được lưu rồi tự chuyển bước, kể cả điểm thấp. Chỉ có một sự kiện kết quả cuối để không dừng camera giữa chuỗi.
- Mất chất lượng trong countdown đặt lại countdown. Thay đổi vị trí/hướng người trong lúc chuẩn bị được chờ ổn định, không vội hủy. Mất khớp/người kéo dài vẫn hủy và nêu lý do.
- Khi phải hủy, giữ kết quả các bước đã chấm; bước chưa thực hiện hiện “Chưa chấm”, không gán 0/100. Tỷ lệ hoàn thành = số bước đủ dữ liệu / 3; tổng điểm là số điểm đã ghi nhận trên tối đa 300. Không kết luận đạt khi thiếu bước.
- Hoàn tất: từng bước /100 và nhận xét, tổng /300, trung bình /100, tỷ lệ hoàn thành, đạt/chưa đạt. Toàn chuỗi đạt chỉ khi cả ba bước đều đạt; điểm trung bình cao không che được một bước sai.
- Overlay và timeline dùng đúng tên bước, hiển thị cả trong fullscreen. Retry bắt đầu lại từ Nghiêm; chuyển bài xóa tiến trình và điểm cũ.

## File đã sửa/thêm

Tất cả đường dẫn dưới đây tính từ thư mục project `D:/GDQP-WEBSITE - Copy`:

- `src/features/pose-analysis/scoring/attentionMovement.ts`, `atEaseMovement.ts`: ngưỡng, đặc trưng bắt buộc và chế độ gộp điểm.
- `src/features/pose-analysis/scoring/scoringEngine.ts`, `postureFeedback.ts`, `scoringTypes.ts`: chống nhiễu, gộp điểm, nhận xét và kiểu kết quả chuỗi.
- `src/features/pose-analysis/scoring/basicDrill.ts` (mới), `movements.ts`: định nghĩa thứ tự, tổng kết và menu bài mới.
- `src/features/pose-analysis/pipeline/staticHold.ts` (mới), `qualityChecks.ts`: giữ ổn định và dung sai hạ người.
- `src/features/pose-analysis/runtime/sessionProcessor.ts`, `workerProtocol.ts`, `src/features/pose-analysis/types.ts`: countdown, vòng đời từng bước, dữ liệu tiến trình và kết quả.
- `src/features/pose-analysis/hooks/usePoseSession.ts`: chọn bài chuỗi và dọn snapshot cũ khi đổi bài.
- `src/features/pose-analysis/PoseAnalysisPage.tsx`, `components/PoseViewport.tsx`, `components/PoseStepDashboard.tsx`: nhãn bước, overlay và timeline.
- `src/features/pose-analysis/components/DrillResults.tsx` (mới), `ScoreResults.tsx`: tổng kết và phân biệt điểm/tiêu chí bắt buộc.
- `scripts/tests/pose-drill.test.ts` (mới), `scripts/tests/fixtures/pose/drill.ts` (mới), `scripts/tests/pose-scoring.test.ts`: test mới và cập nhật ca tay lệch rõ cho cách gộp điểm mới.
- `scripts/pose-results-smoke.tsx`: đưa pose giả tương ứng từng bước vào processor thật để thử UI không cần webcam.
- `docs/pose-analysis.md`, `docs/pose-basic-drill.md`: mô tả và báo cáo.

## Kiểm thử và giới hạn

- Kết quả kiểm tra ngày 24/09/2026: `npm run test:pose` **85/85 đạt**; `npm run test:physics` **17/17 đạt**; `npm run lint` (TypeScript app và cấu hình worker) và `npm run build` **thành công**. Test loader thực tế xác nhận fallback JavaScript khi fetch lỗi, HTTP lỗi hoặc WASM hỏng; có kiểm tra tải lại thành công.
- Kiểm thử UI trên trình duyệt bằng fixture: chọn chuỗi, chạy đủ ba bước, tự mở modal với 300/300 và 3/3 trên dữ liệu lý tưởng; nút làm lại trở về Nghiêm. Đã chạy chuỗi ở cả chế độ thường và toàn màn hình, xác nhận modal kết quả hiện phía trước, không cần cuộn xuống cuối trang.
- Production build còn cảnh báo có sẵn: `@import` font nằm sau quy tắc CSS, `GamificationSection` vừa import tĩnh vừa import động, bundle chính lớn hơn 500 kB. Không sửa các phần ngoài pose trong đợt này. `git diff --check` không báo lỗi whitespace; Git có cảnh báo chuyển LF sang CRLF theo cấu hình Windows.
- Test tự động: gối hơi chùng/gập rõ, nghỉ khác nghiêm, hạ toàn thân, nhiễu một frame/lỗi kéo dài, dao động tư thế, ba countdown và ba lần giữ riêng, một kết quả cuối, bước sai không được bù, mất tracking ngắn/dài, giữ điểm từng phần, reset/retry/đổi bài và render fullscreen.
- Trang `/scripts/pose-results-smoke.html` dùng camera canvas và worker giả, nhưng chạy `SessionProcessor` thật. Không tải ảnh webcam hay bật webcam thật.
- Chưa xác nhận độ chính xác trên người thật; model 3D từ webcam RGB có thể sai độ sâu ngay cả khi confidence cao. Ngực nở, ánh mắt chính xác, vị trí ngón tay và phân bố lực lên chân chưa đo trực tiếp.
- Không xử lý driver/chọn webcam USB trong đợt này. Ngưỡng beta và kết luận luyện tập không thay thế giáo viên.
