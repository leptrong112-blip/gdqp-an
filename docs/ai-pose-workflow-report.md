# Báo cáo AI Pose — workflow kết quả và quyền quản trị

Ngày kiểm tra: 04/10/2026. Phạm vi: yêu cầu trong `QPAN_AI_POSE_COMPLETE_WORKFLOW_ADMIN_ONLY_EXPORT.txt`, đã được bạn xác nhận. Đây là bản triển khai và kiểm thử local, không phải xác nhận độ chính xác trên học sinh thật.

## 1. Kết quả triển khai

Đã nối một luồng hoàn chỉnh vào hệ thống Pose hiện có:

```text
Nhập họ tên + lớp → bắt đầu lượt với attemptId mới → camera/quality/calibration/countdown
→ thu đủ dữ liệu → chốt một lần, đóng băng kết quả → gửi UI và dừng xử lý thừa
→ hiện kết quả ngắn gọn → lưu bất đồng bộ
→ Giáo viên/Admin xem, lọc, mở chi tiết → chỉ Admin xuất Excel hoặc xóa
```

Không thay model MediaPipe, trọng số tiêu chí, ngưỡng torso/knee/feet, điểm đạt hoặc thời gian giữ tư thế trong task này. Các sửa quay trái/phải và nhận diện bàn tay của những task trước được bảo toàn.

## 2. Audit và nguyên nhân có cảm giác chấm lâu

Đã kiểm tra đường đi webcam → scheduler → ImageBitmap/worker hoặc fallback → MediaPipe → SessionProcessor → scoring → hook React → dialog. Kết quả cuối vốn đã đi riêng, không bị throttle 200 ms của số liệu preview. Không tìm thấy timeout dư sau hold, đợi animation hay đợi API save trong đường chốt điểm trước khi sửa.

Những khoảng chờ thực tế gồm quality warmup, đếm ngược tự hiệu chuẩn, hiệu chuẩn 2 giây, đếm ngược động tác và hold bắt buộc. Mất chất lượng hoặc tư thế không ổn định có thể làm cửa sổ dữ liệu hợp lệ bắt đầu lại; quay sai có thể chờ timeout chuyển động 8 giây hiện có. Đây là thời gian chuẩn bị/thu bằng chứng, không phải thời gian CPU chấm sau khi hoàn thành.

Điểm cải thiện có bằng chứng: dừng các analysis/frame không cần thiết sau kết quả, tránh frame/score của lượt cũ lọt vào lượt mới, đóng băng snapshot và không gắn save API vào việc hiển thị.

## 3. BEFORE / AFTER và giới hạn số đo

Đo trước khi sửa bằng 40 lượt attention mô phỏng cho mỗi chu kỳ frame. Chỉ số là CPU của lệnh `SessionProcessor.process` cuối cùng, bao gồm feature extraction và chấm điểm; không bao gồm webcam, MediaPipe thật, worker thật hoặc React.

| Chu kỳ frame | BEFORE CPU median / max | AFTER CPU median / max | Trễ lấy mẫu qua ranh giới hold |
| --- | --- | --- | --- |
| 67 ms | 0.240 / 1.190 ms | 0.351 / 1.760 ms | 15 ms |
| 100 ms | 0.180 / 0.317 ms | 0.265 / 0.907 ms | 0 ms |
| 125 ms | 0.174 / 0.406 ms | 0.219 / 0.545 ms | 0 ms |

Deep clone/freeze tăng một ít CPU, không được trình bày như cải thiện tốc độ CPU. Trong nhóm 40 lượt, mỗi lượt đưa thêm 20 frame sau hoàn thành: số analysis thừa giảm **800 → 0**. Không cắt cửa sổ dữ liệu cần thiết.

**BEFORE T3→T7 thực tế: chưa đo. AFTER T3→T7 thực tế: chưa đo.** Browser smoke test chỉ kiểm tra form/navigation, không có người thực hiện trước webcam. Chưa đủ bằng chứng khẳng định kết quả hiện trong ≤1 giây trên laptop/điện thoại thật.

Đã instrument T0 bắt đầu lượt, T1 quality đạt, T2 hết countdown, T3 hết cửa sổ scoring, T4 xử lý frame cuối, T5 chốt snapshot, T6 hook nhận và T7 marker trình bày dialog. `inferenceMs`, `workerLatencyMs`, `finalizationMs` và thời gian UI được tách riêng. T7 dùng `requestAnimationFrame` sau `showModal`: là marker DOM/trình bày, không phải đo thời điểm màn hình vật lý đã vẽ xong. Countdown/hold không được cộng vào độ trễ sau hoàn thành.

Chi tiết và lệnh tái hiện CPU: `docs/ai-pose-latency-audit.md`, `scripts/benchmark-pose-finalization.ts`.

## 4. FinalResult và retry

SessionProcessor finalize ngay trên frame đủ điều kiện đầu tiên, chỉ một lần. Kết quả, criteria, feedback, confidence và từng bước Basic Drill được deep clone/freeze. Frame đến sau không chấm lại hoặc đổi snapshot. Scheduler dừng; score event tự kết thúc promise đang đợi worker, không cần đợi thêm analysis event.

Command, frame và event có attemptId. Capture đang chờ của lượt trước bị loại bỏ khi reset; hook không nhận score cũ. Retry/reset tạo attemptId và timestamps mới, xóa countdown/samples/lỗi/kết quả cũ nhưng giữ thông tin học sinh. Hiệu chuẩn lại sau lượt đã kết thúc cũng cấp ID mới, tránh va chạm bản lưu.

## 5. Phiên học sinh

Form bắt buộc họ tên và lớp trước khi mở phần camera. Trim, không rỗng, tối đa 120 ký tự tên và 40 ký tự lớp; loại ký tự điều khiển. Không cần tài khoản học sinh mới.

Thông tin giữ trong phiên module, không hỏi lại khi đổi động tác hoặc retry. Mỗi attempt gắn bản sao bất biến của danh tính ngay khi được tạo. “Đổi học sinh” dừng/reset phiên, xóa danh tính/kết quả/so sánh điểm hiện tại và mở form mới. Thoát module unmount phiên; quay lại cần nhập lại. Bản lưu đang gửi giữ danh tính ban đầu, không lấy tên mới của học sinh B.

## 6. Result UI và dữ liệu thiếu

Dialog hiển thị tên/lớp, động tác, điểm, trạng thái và độ trễ đã ghi nhận. Phần “Cần sửa” ưu tiên tối đa 3 lỗi, tiêu chí bắt buộc chưa đạt trước; có “Xem tất cả”. Các tiêu chí đã đạt không chiếm phần này. Thông số đầy đủ đóng mặc định và chỉ mount khi mở.

`MOTION_ERROR` chỉ ra tiêu chí quan sát được nhưng cần sửa. `INSUFFICIENT_EVIDENCE` hiển thị riêng là camera chưa đủ dữ liệu, không kết luận người dùng làm sai. Ví dụ 86 điểm đã quan sát trên tối đa 90 điểm quan sát được không bị trình bày như 86/100 đã chấm đầy đủ; phần chưa đánh giá vẫn có nhãn riêng. Trang quản trị và Excel cũng giữ sự phân biệt này. Không tự cộng điểm vào phần bị che.

Result Dialog học sinh không có export/download/print. Diagnostic export cũng được khóa với role khác Admin.

## 7. Lưu bất đồng bộ và chống trùng

Chỉ record từ kết quả `scored` cuối cùng được đưa vào bộ lưu; không lưu preview, warmup, countdown, attempt bỏ dở hay Basic Drill chưa hoàn thành. Kết quả chấm vẫn hiện trước khi API hoàn tất.

UI có “Đang lưu kết quả…”, “Kết quả đã được lưu”, hoặc lỗi kèm “Lưu lại kết quả”. Lưu lại dùng đúng payload/ID cũ, không chấm lại. HTTP 200 không đủ để coi thành công: API client kiểm tra ack `ok`, ID và cờ duplicate. Save lỗi không xóa kết quả trên màn hình.

Bộ lưu giữ snapshot riêng cho từng ID và deduplicate request đồng thời/rerender. Được tạo ngay ở callback finalize, không phụ thuộc việc dialog còn mở: chờ tối đa 100 ms để nhận T7 rồi gửi; nếu không có T7 gửi latency `null`, không bịa 0 ms. Khoảng chờ này không chặn hiển thị result. Sau khi gửi, payload không bị sửa khi mở lại dialog. Queue hiện ở bộ nhớ tab; đây không phải offline outbox bền vững qua refresh/đóng trình duyệt. Cần kiểm tra trạng thái “đã lưu” trước khi đóng tab khi mạng chập chờn.

Backend: ID là khóa duy nhất, không unique theo tên+động tác. Cùng ID/cùng payload trả duplicate ack; cùng ID/khác payload trả 409, không ghi đè. Express tuần tự hóa ghi file; D1 dùng primary key, conflict handling và content hash.

## 8. Schema, migration và privacy

Migration mới: `migrations/0004_pose_results.sql`. Không chỉnh migration cũ. Đã chạy migration bằng SQLite local trong test, xác nhận dữ liệu account/Survey cũ còn nguyên.

Bảng `pose_results` có: `id`, `student_name`, `class_name`, `movement_id`, `movement_label`, `score`, `passed`, `assessment`, `required_passed`, `criteria_json`, `feedback_json`, `quality_json`, `step_results_json`, `started_at`, `finished_at`, `processing_latency_ms`, `rubric_version`, `content_hash`, `created_at`. Index tên, lớp, movement, created/finished, passed và assessment. Overall score 0–100; required có thể null nếu chưa kết luận.

Express local lưu tại `pose_results.jsonl` trong thư mục dữ liệu hiện có (`SURVEY_DATA_DIR` hoặc `data`), tái đọc được sau restart. Cloudflare lưu trong D1 theo schema mới. Không lưu ảnh/video/khuôn mặt/raw landmarks; parser whitelist chỉ dữ liệu học tập. Vite dev chặn cả JSONL và file `.tmp` để tránh đi vòng API bằng `/@fs/`.

Server validate shape/type/range, thời gian, trạng thái và các trường lồng; giới hạn payload 256 KiB và trả lỗi khi bộ lọc vượt 10.000 kết quả. Có hạn chế tần suất POST theo process/IP. Dữ liệu chấm được tính trên thiết bị; validation không chứng minh động tác là thật hoặc ngăn hoàn toàn client tự dựng điểm. Không thu camera để xác minh phía server trong task này.

## 9. API và quyền

| Endpoint | Anonymous | Student | Teacher | Admin |
| --- | --- | --- | --- | --- |
| `POST /api/pose-results` | Cho phép kết quả hợp lệ | Cho phép | Cho phép | Cho phép |
| `GET /api/pose-results` | 401 | 403 | Cho phép | Cho phép |
| `GET /api/pose-results/:id` | 401 | 403 | Cho phép | Cho phép |
| `GET /api/pose-results/export` | 401 | 403 | 403 | Cho phép |
| `DELETE /api/pose-results/:id` | 401 | 403 | 403 | Cho phép |

Cả Express và Worker dùng session/auth hiện có. Export/delete kiểm tra Admin tại server, không dựa vào việc ẩn nút. Anonymous chỉ xem result của lượt đang thực hiện trong UI, không lấy danh sách quản trị. Các route Pose nằm trong namespace riêng, không thay logic Exam hoặc Survey production.

## 10. Trang quản trị và Excel

AccountMenu thêm “Kết quả AI Pose” cho Teacher/Admin, App có tab `pose_admin` và lazy component riêng, không ghép vào ExamAdminSection.

Trang có tổng lượt, điểm trung bình, số đạt/chưa đạt, tỷ lệ đạt; kết quả thiếu dữ liệu thống kê riêng, không tính vào điểm trung bình/tỷ lệ đạt. Có lọc tên, lớp, động tác, pass/fail/incomplete, ngày và sắp mới nhất/điểm cao. Detail có criteria/required, cần sửa/dữ liệu thiếu, confidence, latency, thời gian và điểm 3 bước chuỗi.

Teacher không render export/delete. Admin xuất `.xlsx` theo bộ lọc đang dùng, backend xác thực lại và trả đúng tập dữ liệu. Frontend lazy-load XLSX chỉ trong action Admin; kiểm tra lại quyền sau các bước async. Đổi bộ lọc/rời trang trong khi đang tải XLSX hủy download cũ. Workbook có tên/lớp/động tác/điểm/trạng thái, tiêu chí cần sửa, required, quality/phần chưa đánh giá, latency/thời gian, điểm Nghiêm–Nghỉ–Chào và ID/version. Không export media/landmarks, không tạo URL download công khai. Chuỗi bắt đầu bằng dấu công thức được ghi dưới dạng text cell, có test đọc lại workbook.

## 11. Basic Drill

Chỉ lưu một record sau khi đủ Nghiêm → Nghỉ → Chào. Mỗi step chứa snapshot score/criteria/pass-fail/feedback riêng; overall chuẩn hóa 0–100, không POST từng step tạm. Test chứng minh frame bước sau không thay điểm bước trước; chuỗi thiếu bước không được lưu như chuỗi hoàn chỉnh.

## 12. Files trong task này và git diff

Các file mới chính:

```text
src/features/pose-analysis/runtime/attemptTiming.ts
src/features/pose-analysis/results/poseResultTypes.ts
src/features/pose-analysis/results/studentSession.ts
src/features/pose-analysis/results/resultPresentation.ts
src/features/pose-analysis/results/buildPoseResult.ts
src/features/pose-analysis/results/resultSaver.ts
src/features/pose-analysis/results/poseResultsApi.ts
src/features/pose-analysis/results/poseExcelExport.ts
src/features/pose-analysis/hooks/usePoseResultStorage.ts
src/features/pose-analysis/components/PoseStudentForm.tsx
src/features/pose-analysis/components/PoseFinalSummary.tsx
src/features/pose-analysis/admin/PoseAdminSection.tsx
server/poseResults.ts
server/poseResultPolicy.ts
server/devFilePolicy.ts
cloudflare/poseResults.ts
migrations/0004_pose_results.sql
scripts/benchmark-pose-finalization.ts
scripts/tests/fixtures/pose/result.ts
scripts/tests/pose-admin.test.ts
scripts/tests/pose-finalization.test.ts
scripts/tests/pose-result-contract.test.ts
scripts/tests/pose-result-workflow.test.ts
scripts/tests/pose-results-api.test.ts
scripts/tests/pose-storage-privacy.test.ts
cloudflare/tests/pose-results.test.ts
docs/ai-pose-latency-audit.md
docs/ai-pose-workflow-report.md
```

Các file tích hợp đã chỉnh: `PoseAnalysisPage`, `usePoseSession`, `poseRuntime`, `pose.worker`, `workerProtocol`, `sessionProcessor`, `PoseResultDialog`, `ScoreResults`, `PoseStepDashboard`, `PoseDiagnosticOverlay`, `App`, `AccountGate`, `server.ts`, `cloudflare/worker.ts`, `scripts/tests/pose-runtime.test.ts`.

`cloudflare/tests/survey-rounds.test.ts` chỉ bổ sung migration 0003 vào harness local sau assertion bảo toàn dữ liệu. Harness cũ dừng ở 0002 trong khi Worker hiện có đã đọc `deleted_at`; không đổi route hay dữ liệu Survey production.

Working tree đã có nhiều thay đổi quay trái/phải/chào/hand model/scoring/fixtures trước task. Toàn bộ `git diff` so với HEAD còn bao gồm những thay đổi đó; không được coi tất cả là thay đổi mới của workflow này. Đã phối hợp ownership với các agent, không reset/stash/checkout đè.

HEAD trước và sau task vẫn: `5db8a5177f604ca2514a324af81a892e2567faa3`. `git diff --check` không phát hiện lỗi whitespace; Git có cảnh báo chuyển LF→CRLF. Không tạo commit/push.

Lệnh xem local, không chỉnh Git:

```powershell
git status --short
git diff --stat
git diff -- src/features/pose-analysis server.ts cloudflare/worker.ts src/App.tsx src/components/AccountGate.tsx
git diff --no-index -- /dev/null migrations/0004_pose_results.sql
```

Trên Windows có thể mở trực tiếp migration và các file untracked thay cho lệnh `/dev/null`. `git diff --stat` không liệt kê nội dung file mới chưa track.

## 13. QA cuối

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run test:pose` | 235 pass, 0 fail |
| `npm run test:physics` | 17 pass, 0 fail |
| Exam API/client + Survey rounds + Pose Worker/migration | 5 pass, 0 fail |
| `npm run lint` | Pass, chạy lại sau build |
| `npm run build` | Pass, client + server |
| `git diff --check` | Pass |

Pose suite bao gồm test finalize-once, snapshot bất biến, T3 chính xác, stale worker/bitmap, retry ID, async save/dedup/lỗi API, danh tính A/B, feedback ngắn/evidence, chuỗi ba bước, quyền UI/API, Excel đọc lại, migration, persistence và Vite private-file HTTP. Test HTTP thực tế xác nhận `/@fs/...pose_results.jsonl` và `.tmp` trả 403, không lộ nội dung; accounts/exam vẫn được bảo vệ và file công khai trả 200.

Một lần chạy lint đồng thời `build` gặp TS6053 vì lệnh clean xóa các file dist đang được TypeScript quét. Đã chạy lint riêng sau build và pass; không sửa cấu hình ngoài phạm vi để che lỗi. Build còn cảnh báo CSS @import, Gamification static/dynamic import và chunk >500 kB hiện có, không làm build thất bại.

Browser smoke test local phát hiện và đã sửa null timing lúc vừa vào trang. Có regression test cho chưa có result, timing của lượt cũ và timing đúng lượt. Đồng thời sửa nhãn/checklist hướng dẫn không báo camera đạt khi chưa có dữ liệu. Đã kiểm tra form → studio không crash, tên/lớp đúng, đổi động tác không hỏi lại, Đổi học sinh trả form rỗng. Không bật/thu camera và không ghi học sinh thật trong smoke test. Skill computer-use được dùng để kiểm tra giao diện và tìm ra lỗi khởi tạo này.

## 14. SCORING ISSUE DISCOVERED

Không tìm thấy lỗi rubric mới có đủ bằng chứng trong phạm vi workflow. Không đổi điểm/ngưỡng để làm test dễ đạt. Dữ liệu mô phỏng vẫn không chứng minh độ chính xác trên 10–20 học sinh thật. Các tình huống một camera như che tay phía xa, chân bị che, ánh sáng yếu, chiều sâu không đáng tin vẫn có thể cho “chưa đủ dữ liệu”; đây không được chuyển thành lời kết luận người dùng làm sai trong giao diện mới.

## 15. Checklist webcam và thao tác thật còn cần làm

Các dòng dưới **chưa được xác nhận bằng webcam thật**:

- Đúng từng động tác, sai rõ ràng, quay ngược hướng, bước đi khi quay; đối chiếu nhận xét giáo viên và tiêu chí bắt buộc.
- Mất tracking ngắn, tay/chân ra ngoài khung hoặc bị che: không gọi lỗi kỹ thuật là lỗi động tác.
- Đo T3→T7 cùng inference/worker/finalize/UI trên laptop và điện thoại; ghi nhiều lượt, không chỉ một lượt tốt nhất. So lại thời gian sau hoàn thành, không cộng countdown/hold.
- Retry ngay sau result, nhiều lượt cùng tên/lớp; mỗi lượt ID mới nhưng mở lại result không tạo bản lưu mới.
- Đổi học sinh A→B cả khi API A còn đang lưu; xác nhận Admin nhận đúng hai danh tính và không so điểm chéo học sinh.
- Basic Drill hoàn chỉnh, dừng giữa bước và tracking mất ở bước sau; điểm bước trước giữ nguyên, không lưu chuỗi bỏ dở.
- Lỗi mạng/save: dialog hiện trước API, điểm không mất, “Lưu lại” dùng cùng ID; chờ “đã lưu” trước khi refresh khi đang có lỗi mạng.
- Teacher/Admin đăng nhập qua UI: refresh trang, lọc tên/lớp/động tác/ngày/status, mở chi tiết; Teacher không export/delete; Student/anonymous không mở danh sách.
- Admin xuất workbook theo bộ lọc, kiểm tra dòng/cột/điểm từng step, không có media; Teacher/Student gọi trực tiếp export bị 403, anonymous 401 (đã có test API local).
- Cố tình đổi bộ lọc trong lúc xuất: download cũ bị hủy; giao diện học sinh không có action xuất file.

Trang local đang phục vụ tại `http://localhost:3097/`. Dữ liệu học sinh trong kiểm thử UI là tên giả, camera vẫn tắt. Nếu cần chạy lại server đã build:

```powershell
$env:PORT='3097'
$env:NODE_ENV='production'
node dist-server/server.cjs
```

## 16. Migration sau khi được duyệt — KHÔNG ĐÃ CHẠY

Cấu hình `wrangler.jsonc` hiện trỏ database `gdqp-survey`, migrations directory `./migrations`. Sau khi bạn duyệt code/local và cho phép thao tác production, cần xem danh sách migration đang pending rồi mới apply. Lệnh apply có thể chạy mọi migration pending, không chỉ 0004; cần xác nhận trạng thái các migration trước.

```powershell
# Chỉ thực hiện sau khi được bạn duyệt và cho phép production:
npx wrangler d1 migrations list gdqp-survey --remote
npx wrangler d1 migrations apply gdqp-survey --remote
```

Không chạy hai lệnh remote trên trong task này. Local migration đã được kiểm tra bằng SQLite test. Migration production và deploy là hai bước riêng, đều chưa làm. Phiên bản đang chạy trên website công khai chưa có workflow mới.

MIGRATION PENDING  
CHƯA APPLY PRODUCTION  
CHƯA DEPLOY  
KHÔNG COMMIT — KHÔNG PUSH

Dừng ở bản local để bạn kiểm tra và duyệt.
