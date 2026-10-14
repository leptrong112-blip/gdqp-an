# AI Pose synthetic human audit

Synthetic test results evaluate deterministic software behavior under modeled conditions. They do not establish real-world accuracy on students or real camera performance.

## Kết quả lần chạy

- Tổng scenarios: **160**; Match: **117**; Mismatch: **43**.
- FALSE_POSITIVE: 0; FALSE_NEGATIVE: 0; UNEXPECTED_INSUFFICIENT: 16; UNEXPECTED_DECISION: 0; SCORE_OUT_OF_RANGE: 0; STATE_MACHINE_MISMATCH: 30; FINALIZATION_ERROR: 2; CRITERION_MISMATCH: 4. Một scenario có thể có nhiều loại mismatch.
- Đây là độ khớp với oracle mô phỏng, không phải tỷ lệ chính xác trên học sinh.
- Workbook, JSON và báo cáo được tạo từ cùng object kết quả đã chuẩn hóa; kiểm tra lại workbook sau khi lưu.

| Movement | Scenarios | Match | Mismatch | Actual PASS | Actual FAIL | Actual insufficient |
|---|---:|---:|---:|---:|---:|---:|
| basicDrill | 17 | 1 | 16 | 12 | 0 | 5 |
| attention | 42 | 39 | 3 | 37 | 0 | 5 |
| atEase | 19 | 3 | 16 | 15 | 0 | 4 |
| turnLeft | 24 | 20 | 4 | 18 | 0 | 6 |
| turnRight | 22 | 19 | 3 | 16 | 0 | 6 |
| salute | 36 | 35 | 1 | 22 | 0 | 14 |

## Kiến trúc và phạm vi

- scripts/synthetic/model.ts sinh landmark 3D theo kích thước thân, góc khớp và thời gian; image là phép chiếu pinhole của chính world skeleton, không chèn trực tiếp feature/điểm.
- 5 profiles: reference, narrow-long-legs, wide-short-legs, long-arms, short-arms. Đây là biến thể hình học tương đối, không mô hình sinh trắc học đã kiểm định. Chiều dài tay được nội suy khi chào; không mô phỏng lực tiếp xúc hoặc da/quần áo.
- Lấy bài tập khả dụng từ EXERCISE_CATALOG, MOVEMENTS, commandFlow. aboutFace chưa khả dụng nên không báo là đã test.
- SessionProcessor thật chạy confidence filter, outlier, quality, smoothing, calibration, feature extraction, thời gian giữ, sequence và scoring. FrameFreshnessGate thật kiểm tra transport. Dùng JavaScript sequence engine của production; không chạy MediaPipe inference/browser camera, GPU hay WASM engine.
- Virtual clock, không sleep. FPS 5/8/10/12/15/20, tốc độ 450/1400/2800 ms, camera xiên/cao/thấp/xa, mirror chỉ là metadata trình bày.
- Core suite 160 ca chọn đại diện, không Cartesian. Missing feet/knee/shoulder/wrist, crop, hand missing/blur/low confidence/stale, drop frames có seed, burst và gap.
- Bàn tay 21 điểm, wrist gắn với cẳng tay, các ngón gập/xòe/ngón cái mở/cổ tay lệch; độ nét/confidence là giá trị mô phỏng, không đo từ ảnh.
- Oracle nằm trong scenarios.ts, đặt trước khi chạy và không lấy expected từ scorer. Điểm PASS theo policy hiện có >=65/100 khi đủ dữ liệu; một tiêu chí sai không nhất thiết làm tổng FAIL.
- Chuỗi cơ bản: nghiêm → nghỉ → chào. Có biến thể sai từng bước và mất tracking giữa bước. Những ca bị quality gate chặn không chứng minh đã kiểm thử được bước sau.

## Phát hiện cần ưu tiên

1. **5 FPS:** nghiêm/nghỉ kết thúc cửa sổ 3 s với 15 mẫu nhưng scorer đòi 18. Chào có chờ đủ mẫu; hai bài tĩnh không có cùng điều kiện. Không nới ngưỡng trong task này.
2. **Sai hướng/góc quay:** điểm tiêu chí giảm nhưng kết luận có thể thành thiếu dữ liệu vì không có tư thế cuối hợp lệ. Cần xem lại ưu tiên FAIL/INSUFFICIENT, không tự nhận thiếu dữ liệu là người dùng làm sai.
3. **Chuyển sang nghỉ:** cửa sổ chấm có thể bắt đầu khi phần nhỏ chuyển động gối còn tiếp tục. Bộ kiểm tra so với thời điểm mô hình dừng hoàn toàn nghiêm hơn readiness tolerance; đánh dấu NEEDS_REVIEW, không khẳng định tất cả là lỗi.
4. **Dịch chuyển khi quay:** đối chiếu turnTechnique trong JSON; mô hình dịch thân không chứng nhận đúng/sai kỹ thuật đặt trụ chân ngoài đời.
5. **Sai tư thế mạnh:** quality/stability có thể từ chối trước khi chấm lỗi. Đã thử chuyển động 500 ms thay vì nhảy landmark tức thời; cần video thật để phân biệt lỗi oracle/mô hình với lỗi sản phẩm.
6. **Không kết thúc trong budget:** mất tracking giữa bước hoặc jitter cao có thể ở trạng thái chờ. Không coi là duplicate finalize hay tự kết luận memory leak.

## Boundary, repeatability và differential

- 44 FeatureRule; 6 band không theo thứ tự zeroLo ≤ idealLo ≤ idealHi ≤ zeroHi. Các rule động là metadata và không dùng ruleScore trong route động; không tự sửa threshold.
- Mỗi rule có ideal/boundaries/midpoint/near-failure/failure; valid bands kiểm tra monotonic hai phía.
- 20 repeats có seed: mean 100.000/100, std 0.00000. Top criterion variability: torso std=0.00000; balance std=0.00000; legs std=0.00000; feet std=0.00000; arms std=0.00000.
- 132 số đo kép trên 3 camera × 4 tư thế. Chênh lệch 2D/3D không phải sai số thực tế và không chứng minh 3D luôn tốt hơn.
- Reset isolation A→B/B→A: 4/4. Snapshot cuối và drill steps được kiểm tra frozen; 5 frame xấu sau kết thúc không làm đổi kết quả.

## Performance

| Active preflight frames | Total CPU wall ms | Median ms | P90 ms | Heap delta bytes |
|---:|---:|---:|---:|---:|
| 100 | 9.208 | 0.0811 | 0.1029 | -35767640 |
| 500 | 48.524 | 0.0820 | 0.1128 | 22645856 |
| 1000 | 84.146 | 0.0804 | 0.0901 | -22015264 |

finalizationMs trong JSON là thời gian thật của toàn bộ process() tạo kết quả cuối (upper bound), không phải đồng hồ ảo. Không bao gồm MediaPipe, webcam, transport hoặc UI. Heap delta chịu ảnh hưởng GC, không dùng làm chứng minh leak. Không giữ toàn bộ landmark/frame logs; chỉ bounded trace của ca lệch.

## Tái hiện

`npm run test:pose:synthetic` tạo đủ 3 outputs và trả exit 1 nếu có mismatch; đây là lỗi oracle/regression được báo, không giấu bằng đổi expected.

`npm run test:pose:synthetic -- --testId turnLeft-walking --seed 12345` chạy đúng một ca, in kết quả và không ghi đè artifacts đầy đủ.

Danh sách issue chi tiết nằm trong JSON issues và sheet Regression_issues. Các kiểm tra phụ nằm trong JSON audits, không cộng vào 160 scenarios.

## Xác minh và giới hạn

- npm run test:pose: PASS — 277/277; initial sandbox EACCES for two local HTTP tests; authorized rerun passed
- npm run test:pose:synthetic: MISMATCH — Harness 7/7 pass; core 117 match / 43 mismatch / 160 total; exit 1 intentionally exposes unresolved differences
- npm run test:physics: PASS — 17/17
- npm run lint: PASS — Both TypeScript projects
- npm run build: PASS — Client and server; existing CSS import order, mixed imports and bundle-size warnings

**SOFTWARE LOGIC VERIFIED BY SYNTHETIC TESTS:** các đường đi và kết quả thực tế nêu trên; không đồng nghĩa toàn bộ oracle đã khớp.

**MANUAL REAL-WEBCAM VALIDATION REQUIRED:** người thật, ánh sáng, che khuất tự nhiên, nhận diện trái/phải, bàn tay nhỏ trong ảnh, low-end hardware và tính hợp lý sư phạm. Chưa thể chứng nhận độ chính xác này bằng mô phỏng.

Không ghi synthetic result vào production/student database. Không nhập/xóa/chỉnh dữ liệu Excel học sinh. Không sửa scoring production, không commit/push/deploy. Workbook synthetic dùng xlsx của repo; CE hỗ trợ cột rộng và autofilter, không hứa có styling/freeze panes nâng cao.

## Run metadata

- Git HEAD: 587d8d9c66cb26550ab5c6c3b35c0db023a4ab9a
- Rubric: v1.10-salute-dynamic; suite: synthetic-human-v1
- Node: v24.15.0; OS: win32 10.0.26200; CPU: 13th Gen Intel(R) Core(TM) i7-13620H
- Generated: 2026-10-07T06:47:43.340Z
- Source SHA256: 6d68211ab999514a694b3983ec1fb198bb9ee8819493178a5f5d9ffa8ab3466f
- Working tree dirty; SHA256 bao gồm mã nguồn AI Pose, harness và package.json tại lần chạy. Commit HEAD một mình không đủ tái hiện.
