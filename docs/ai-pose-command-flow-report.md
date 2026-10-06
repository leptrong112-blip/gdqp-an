# AI Pose — khẩu lệnh và tư thế tiền đề

Ngày báo cáo: 06/10/2026. Chỉ thực hiện local trong AI Pose và phần lưu/xem kết quả AI Pose. Không sửa trường bắn, vũ khí, bia hay các module khác. Không commit, push, deploy hoặc áp dụng migration production.

## 1. State machine trước và sau

Trước: kiểm tra camera → hiệu chuẩn → countdown → chấm trực tiếp → kết quả. Bài tĩnh chưa có cổng xác nhận tư thế xuất phát và khoảng chuyển tư thế riêng.

Sau: kiểm tra camera/hiệu chuẩn → `waiting-precondition` → tùy chọn `precondition-scoring` → `countdown` → phát `commandCue` → `transition`/ổn định → `scoring` → freeze FinalResult → `THÔI` → `stop-command` trong 350 ms → result dialog.

Mọi chuyển pha chấm vẫn do `SessionProcessor` quản lý theo timestamp frame. `commandFlow.ts` chỉ là registry và các hàm nhận biết tư thế, không phải state machine thứ hai. Hook chỉ quản lý thời gian hiển thị khẩu lệnh. Đã bỏ hai đếm ngược phụ của UI để không có nhiều vòng 3–2–1 trước khẩu lệnh thật.

## 2. Nội dung đã thay

Câu chính xác trong hướng dẫn, label chân Đứng nghiêm và feedback tương đương:

> 2 gót chân đặt sát vào nhau, 2 mũi bàn chân mở rộng 45 độ.

Đã đồng bộ tại `attentionMovement.ts`, `movements.ts` và `postureFeedback.ts`. Giữ nguyên ID, trọng số, dải góc, thời gian tối thiểu và công thức chấm. Các feedback mô tả lỗi cụ thể, như gót quá xa nhau, vẫn được giữ.

## 3. Flow Đứng nghiêm

UI ghi “Tư thế chuẩn bị: Đứng nghỉ”. Chưa đúng Nghỉ hoặc chưa đủ dữ liệu thì không phát khẩu lệnh chính và không chạy countdown chính thức. Nghỉ ổn định được xác nhận → 3 → 2 → 1 → NGHIÊM. Frame thu chân/tay được tách khỏi evidence chấm. Khi Nghiêm ổn định đủ khoảng 700 ms và ít nhất 6 quan sát hợp lệ, cửa sổ chấm 3 giây mới bắt đầu. FinalResult được freeze một lần → THÔI → kết quả.

Khoảng 700 ms là cổng ổn định/nhận biết chuyển pha, không phải thay đổi điểm hoặc nới threshold của rubric.

## 4. Flow Đứng nghỉ

Đứng nghiêm tiền đề → xác nhận → tùy chọn chấm riêng Nghiêm → 3–2–1 → NGHỈ → chuyển tư thế và ổn định → chấm Nghỉ → freeze → THÔI → kết quả. Transition không được đưa vào điểm Nghỉ.

## 5. Registry movement

| Bài được chọn | Tư thế chuẩn bị | Khẩu lệnh |
| --- | --- | --- |
| Đứng nghiêm | Đứng nghỉ | NGHIÊM |
| Đứng nghỉ | Đứng nghiêm | NGHỈ |
| Quay trái | Đứng nghiêm | BÊN TRÁI — QUAY |
| Quay phải | Đứng nghiêm | BÊN PHẢI — QUAY |
| Chào | Đứng nghiêm | CHÀO |
| Chuỗi Nghiêm → Nghỉ → Chào | Đứng nghỉ ở đầu chuỗi, sau đó tiền đề của từng bước | Khẩu lệnh từng bước |

Quay đằng sau chưa áp dụng: movement đang khóa/sắp ra mắt, chưa có implementation chấm hiện hành. Không tạo logic giả cho bài này.

Trong Basic Drill, ba bước chấm vẫn là Nghiêm, Nghỉ, Chào. Sau bước Nghỉ, người học về Nghiêm để chuẩn bị Chào; đó không phải một bước điểm thứ tư và không cần về menu.

## 6. Transition và dữ liệu thiếu

Bài tĩnh sử dụng bucket chuẩn bị/ổn định riêng và xóa nó trước khi bắt đầu scoring. Khoảng countdown cũng không cộng vào thời gian chấm.

Bài quay cần quan sát đường quay, nên giữ evidence chuyển động kể từ khẩu lệnh; không biến quay thành chấm một ảnh cuối. Logic hướng quay, bàn chân, dịch chuyển và giữ thế hiện có không bị thay công thức trong task này.

`WRONG_PRECONDITION` và `INSUFFICIENT_EVIDENCE` được phân biệt trong snapshot/UI. Khi chờ tiền đề, thiếu dữ liệu không tạo ra điểm động tác chính. Mất tracking trong scoring vẫn được xử lý riêng với lỗi tư thế.

Tại khẩu lệnh bài tĩnh, lịch sử smoothing/outlier được làm mới để việc giơ tay thật không bị so với vị trí tay cũ rồi hiểu nhầm thành landmark mất dữ liệu. Không giảm ngưỡng confidence hoặc thay MediaPipe.

## 7. Chấm tiền đề và snapshot

Tùy chọn “Chấm riêng Đứng nghiêm tiền đề” nằm trong “Thông tin kỹ thuật & Thiết bị”, mặc định tắt. Áp dụng cho Nghỉ, quay trái/phải và Chào; Basic Drill đã có các snapshot bước riêng nên không chấm trùng.

Khi bật, Nghiêm được thu 3 giây evidence và phải có kết luận đạt mới được chuyển tiếp. Score, criteria, feedback, quality metadata và pass/fail được deep-freeze trước movement chính. Các frame sau không được sửa snapshot này.

UI kết quả và Teacher/Admin có phần “Tiền đề — Đứng nghiêm” và “Động tác chính”. Không lấy trung bình hai điểm. Excel có thêm hai cột tiền đề, giữ nguyên điểm chính và các cột bước Basic Drill.

## 8. Persistence và compatibility

Contract có thêm `preconditionResult`, vẫn chỉ whitelist dữ liệu học tập. Node lưu được cấu trúc mới. Worker lưu tiền đề trong envelope JSON của cột `step_results_json` hiện có và vẫn đọc được array Basic Drill cũ. Không cần migration mới; không áp dụng bất kỳ migration remote nào.

Phiên bản bản lưu mới: `v1.9-command-flow`. Quy tắc tổng điểm từ 6,5/10 của task trước không đổi. Các bản ghi lịch sử không bị sửa lại.

Đã điều chỉnh khoảng chờ paint của queue lưu để bao gồm overlay THÔI; việc lưu vẫn async, không chặn result. Nếu result không được render kịp thì thời gian UI vẫn được phép là null, không bịa T7.

## 9. Overlay và audio

Khẩu lệnh chính có overlay lớn khoảng 1,1 giây, không nhận pointer events và không chặn phân tích camera. THÔI hiện 350 ms rồi mới mở dialog. Score đã freeze trước THÔI; không chờ backend hoặc audio phát xong.

Reuse beep hiện có cho countdown. Dùng SpeechSynthesis cho khẩu lệnh, `lang=vi-VN`, ưu tiên voice tiếng Việt nếu có. Không thêm dependency. Speech bị chặn/thiếu voice/throw hoặc phát rất lâu đều không chặn state machine. Có checkbox tắt âm thanh; đổi bài/retry/dừng phiên hủy speech còn chờ.

## 10. Kiểm thử

| Nhóm | Kết quả | Bằng chứng |
| --- | --- | --- |
| AI Pose regression | PASS — 248/248 | Bao gồm 5 test command flow mới, Basic Drill, turn tracking, retry, immutable snapshots, student identity, async save, API, Teacher/Admin và Excel |
| Physics regression | PASS — 17/17 | Không sửa source physics |
| Worker/D1 local | PASS — 1/1 | Migration local giữ dữ liệu cũ, role authorization và tiền đề round-trip riêng 90/100, main 75/100 |
| Lint | PASS | TypeScript client/server và Worker |
| Build | PASS | Client + server; chỉ còn cảnh báo CSS import/chunk có sẵn |
| Browser attention sequence | PASS | Quan sát DOM: 3 → 2 → 1 → NGHIÊM → THÔI → RESULT; trong DOM lúc THÔI chưa có dialog |
| Browser preparation scoring | PASS | Nghỉ có tiền đề Nghiêm 10/10 riêng, main Nghỉ 10/10 riêng, save thành công khi muted |
| Người thật/MediaPipe/webcam | MANUAL REQUIRED | Chưa có người trước webcam |

Fixture browser chỉ thay camera/detector. SessionProcessor, scheduler, hook, UI và API dùng code thật. Đã quan sát một lượt từ cuối cửa sổ chấm đến UI khoảng 528 ms, gồm overlay THÔI. Đây không phải benchmark MediaPipe/webcam thật.

Hai test API ban đầu bị sandbox Windows chặn socket EACCES, sau đó chạy ngoài sandbox và qua. Browser có một lượt đầu khi tải/đọc DOM liên tục bị gate frame-gap từ chối; không nới gate để ép qua. Sau khi module đã tải và dùng quan sát nhẹ hơn, lượt retry hoàn thành. Timeout tải trang QA cũng được phục hồi bằng đọc lại tab hiện hành.

Artifacts tại `artifacts/pose-command-flow/`: preparation, result, precondition-result screenshots và `browser-observations.json`. Không có dữ liệu cá nhân thật hay ảnh webcam.

## 11. SCORING ISSUE DISCOVERED / giới hạn cần kiểm chứng

Dải dung sai góc gối hiện tại có thể cho một tư thế Nghỉ chùng nhẹ điểm cao trên rubric Nghiêm. Không thay công thức đó. Gate nhận biết tư thế dùng các feature/rule đã có để phân biệt tư thế, thay vì dựa duy nhất vào total score. Độ chính xác gate này trên học sinh có chân không đối xứng tự nhiên vẫn cần xác minh bằng người thật; không tuyên bố fixture pass là chính xác ngoài đời.

Cần kiểm tra người thật với: chuyển Nghỉ → Nghiêm, Nghiêm → Nghỉ/Chào, chân trụ hơi chùng tự nhiên, che khuất tay/chân, ánh sáng, máy chậm, âm thanh tiếng Việt và hiệu năng laptop/mobile.

## 12. Files và Git diff

Files trọng tâm:

- Mới: `runtime/commandFlow.ts`, `scripts/tests/pose-command-flow.test.ts`, báo cáo này.
- State/protocol: `runtime/sessionProcessor.ts`, `runtime/workerProtocol.ts`, `runtime/poseRuntime.ts`, `types.ts`, `scoring/scoringTypes.ts`.
- Hook/UI/audio: `hooks/usePoseSession.ts`, `PoseAnalysisPage.tsx`, `PoseViewport.tsx`, `PoseStepDashboard.tsx`, `SessionControls.tsx`, `PoseFinalSummary.tsx`, `utils/audioFeedback.ts`.
- Wording: `attentionMovement.ts`, `movements.ts`, `postureFeedback.ts`.
- Kết quả: `buildPoseResult.ts`, `poseResultTypes.ts`, `poseExcelExport.ts`, `admin/PoseAdminSection.tsx`, `cloudflare/poseResults.ts`.
- Test/harness: các test drill/finalization/pipeline/scoring/contract/admin/API/Worker và `scripts/qa/pose-browser-runtime.ts`.

`git diff --check` không có lỗi whitespace. Worktree đã có nhiều thay đổi từ các task trước; toàn bộ `git diff --stat` không được coi là diff riêng của task này. Không reset hoặc ghi đè các thay đổi đó. HEAD giữ nguyên `5db8a5177f604ca2514a324af81a892e2567faa3`.

## 13. Kết thúc

Đã dừng các server QA tạo trong task và dọn đúng các thư mục tài khoản/kết quả giả cô lập. Giữ ảnh/JSON bằng chứng trong artifacts, ngoài public. Không đụng dữ liệu ứng dụng thật. Dừng sau bàn giao; chưa kiểm thử độ chính xác trên người thật.
