KẾ HOẠCH PHASE 2 — MỞ RỘNG CHỨC NĂNG HỌC TẬP & ĐÁNH GIÁ

Dự án: Cổng học tập số Giáo dục Quốc phòng và An ninh

Phiên bản 1.2 — đã sửa lỗi đánh số và bổ sung các quyết định cần chốt trước khi code

# 1. Mục tiêu Phase 2

Tổ chức thi thử có kiểm soát thời gian.

Chấm điểm và phân tích kết quả học tập.

Lưu lịch sử kết quả để học sinh theo dõi tiến bộ.

Tích hợp kết quả thi với Gamification.

Tạo báo cáo kết quả học tập cho học sinh/giáo viên.

Phase 2 ưu tiên các chức năng có giá trị trực tiếp đối với mục tiêu giáo dục.

# 2. Nguyên tắc an toàn

## 2.1. Không phá vỡ Phase 1

src/data/

src/data.ts

src/gamification.ts

src/context/GamificationContext.tsx

src/main.tsx

Hệ thống bài học, Quiz, Map, Practical Skills

Gamification / XP / Rank / Badge

localStorage hiện tại

Không tự ý thay đổi kiến trúc nếu Phase 2 không thực sự yêu cầu.

## 2.2. Không tự ý mở rộng phạm vi

Không đổi framework/thư viện lớn.

Không đổi UI toàn hệ thống.

Không viết lại gamification.ts hoặc data.ts.

Không thêm backend/API/AI nếu chưa phê duyệt.

Không tự tạo hàng loạt câu hỏi mới.

Không xóa chức năng hiện tại.

Nếu phát hiện cần thay đổi ngoài phạm vi: DỪNG → Báo cáo → Chờ phê duyệt.

# 3. Phạm vi Phase 2

Phase 2A — Mock Exam Mode

Phase 2B — Learning Report

Phase 2C — PWA

Phase 2D — Audio / TTS

[BỔ SUNG] Phân loại phạm vi: Phase 2A (Mock Exam) và Phase 2B (Learning Report) là CORE — ưu tiên bắt buộc của Phase 2. Phase 2C (PWA) và Phase 2D (Audio / TTS) là OPTIONAL — chỉ triển khai khi 2A và 2B đã ổn định, đủ thời gian và được phê duyệt.

Ưu tiên: 2A → 2B → 2C → 2D. Không triển khai tất cả cùng lúc.

# 4. Phase 2A — Mock Exam Mode

## 4.1. Mục tiêu

Timer

Random câu hỏi

Random đáp án

Chấm điểm

Kết quả

Tích hợp Gamification

## 4.2. Inventory trước khi code

Kiểm tra src/data/quiz.ts và số lượng câu hỏi thực tế.

Kiểm tra cấu trúc câu hỏi/đáp án.

Kiểm tra QuizSection, GamificationContext, localStorage và navigation.

Không giả định ngân hàng có 40 câu.

Baseline hiện tại: L10 = 8 câu; L11 = 8 câu; L12 = 8 câu; tổng = 24 câu.

Nếu cần tăng số lượng câu: lập kế hoạch bổ sung dữ liệu riêng; không tự sinh/copy câu hỏi.

## 4.3. Phạm vi đề

Phải xác định thi theo lớp hay tổng hợp L10–L12. Không tự chọn nếu codebase chưa quy định. (Quyết định này chốt tại Checkpoint 2.0 — xem mục 18, mục a.)

## 4.4. Số lượng câu

Dựa trên số câu thực tế. Không duplicate để đủ số lượng. Nếu thiếu dữ liệu → báo cáo → không tự sửa data.

## 4.5. Random câu hỏi & đáp án

[BỔ SUNG] Cụ thể: Mock Exam không được mutate, ghi đè hoặc chỉnh sửa file src/data/quiz.ts. Việc random chỉ được thực hiện trên bản sao/dữ liệu runtime.

Shuffle câu hỏi nhưng không sửa data gốc.

Shuffle đáp án nhưng giữ identity đáp án đúng.

Chấm theo identity, không theo vị trí ban đầu.

## 4.6. Timer

Hiển thị thời gian còn lại.

Hết giờ tự submit.

Khóa chỉnh sửa sau khi kết thúc.

Thời lượng phải được xác định trước khi code. (Chốt tại Checkpoint 2.0 — xem mục 18, mục b.)

[BỔ SUNG] Hành vi khi reload/đóng tab/mất mạng giữa bài thi phải được chốt rõ trước khi code — không để mặc định ngầm:

Phương án Resume (khuyến nghị): dùng startedAt + durationSeconds trong Exam State để tính lại thời gian còn lại khi tải lại trang; bài thi tiếp tục như chưa gián đoạn.

Phương án Invalidate: nếu mất phiên giữa chừng, coi bài thi là expired/hỏng, học sinh phải làm lại.

Chọn 1 trong 2 phương án ở Checkpoint 2.0, ghi rõ vào Exam State (mục 4.7) trước khi implement Timer.

## 4.7. Exam State

Tối thiểu: id, startedAt, submittedAt, durationSeconds, questionIds, answers, status = in-progress/submitted/expired. Có thể điều chỉnh tên field theo codebase.

## 4.8. Chấm điểm

Đúng

Sai

Chưa trả lời

Tổng

Accuracy

Score

Trạng thái hoàn thành

Chuẩn quy đổi điểm phải được phê duyệt trước implementation. (Chốt tại Checkpoint 2.0 — xem mục 18, mục c.)

## 4.9. Kết quả thi

Tổng số câu

Đúng/sai/chưa trả lời

Điểm

Tỷ lệ chính xác

Thời gian

Trạng thái

## 4.10. Gamification

Dùng useGamification().

Không tạo XP system riêng.

XP nếu có phải đi qua Context/API hiện tại.

Không đưa CustomEvent trở lại UI.

## 4.11. Lưu lịch sử

Lưu exam id/type, thời gian, số câu đúng/sai/chưa trả lời, score, accuracy, duration.

Không ghi đè localStorage hiện tại.

Có versioning nếu cần.

[BỔ SUNG] Kiểm soát dung lượng localStorage: vì hệ thống không có backend (mục 2.2), lịch sử thi cộng dồn theo thời gian có thể làm đầy localStorage (giới hạn phổ biến ~5–10MB tùy trình duyệt). Áp dụng nguyên tắc:

Giữ tối đa N lần thi gần nhất trong localStorage (N cụ thể chốt ở Checkpoint 2.0); lịch sử cũ hơn có thể được tóm tắt thay vì lưu chi tiết.

Trước khi ghi dữ liệu mới, kiểm tra khả năng ghi (try/catch quota exceeded) để tránh mất dữ liệu Gamification nếu localStorage đầy.

## 4.12. Checkpoint 2A

Chạy: npx tsc --noEmit và npm run build.

Quiz cũ PASS

Mock Exam PASS

Timer/submit/auto-submit PASS

Điểm chính xác

Gamification PASS

Reload không hỏng dữ liệu

Không CustomEvent tại UI

Không lỗi runtime nghiêm trọng

FAIL → dừng → rollback checkpoint gần nhất → phân tích.

# 5. Phase 2B — Learning Report

XP, Rank, Badge

Số bài học và kỹ năng hoàn thành

Kết quả Quiz

Lịch sử Mock Exam

Điểm trung bình

Accuracy

Tiến bộ theo thời gian

## 5.1. Export Report

[BỔ SUNG] Nếu cần dependency mới để thực hiện Export PDF/PNG hoặc chức năng khác: DỪNG → báo cáo dependency, lý do cần dùng, tác động và phương án thay thế (nếu có) → chờ phê duyệt. Không tự ý cài dependency.

Báo cáo: thông tin học sinh → tiến trình → Gamification → Quiz → Mock Exam → thống kê. Kiểm tra dependency trước khi thêm PDF/PNG.

## 5.2. Certificate

OPTIONAL. Chỉ ghi nhận thành tích thực tế và đúng điều kiện.

## 5.3. Checkpoint 2B

Chạy tsc + build; kiểm tra Gamification, lịch sử, báo cáo, export, reload và localStorage.

# 6. Phase 2C — PWA

Manifest

Installable

Responsive

Icon/Theme

Service worker nếu cần

Offline strategy

Không triển khai offline toàn bộ dữ liệu nếu chưa kiểm tra dung lượng/kiến trúc.

Checkpoint: desktop, Android, iOS/Safari nếu có; install, reload, cache, routing, asset 3D; tsc + build.

# 7. Phase 2D — Audio / TTS

Enhancement, ưu tiên thấp hơn Mock Exam và Report.

SFX XP/đúng-sai/tương tác

Text-to-Speech

Không tự động phát gây khó chịu; không thêm API trả phí nếu chưa phê duyệt; không gửi dữ liệu học sinh ra ngoài nếu chưa có thiết kế. TTS có bật/tắt, volume và fallback.

# 8. File management

Files To Create — liệt kê trước khi sửa.

Files To Modify — liệt kê trước khi sửa.

Files To Leave Untouched — liệt kê file quan trọng không được sửa.

Phát sinh file ngoài danh sách → DỪNG → Báo cáo → Chờ phê duyệt.

# 9. Verification protocol

Sau mỗi checkpoint: npx tsc --noEmit.

Sau mỗi checkpoint: npm run build.

Không chỉ dựa vào build; type-check độc lập.

# 10. Rollback strategy

Lần 1: phân tích và sửa nguyên nhân trực tiếp.

Lần 2: nếu cùng thay đổi vẫn lỗi → dừng, không vá chồng.

Quay về checkpoint gần nhất.

Báo cáo nguyên nhân, file, thay đổi đã thử, lý do thất bại và phương án.

Không tự mở rộng phạm vi để chữa cháy.

# 11. Out of scope

Viết lại UI toàn bộ

Đổi framework/React architecture/database

Xây backend hoặc login

AI tutor/chatbot/nhận diện khuôn mặt

Thay đổi nội dung SGK

Tự động tạo nội dung giáo dục

Thay đổi 3D model

Tối ưu hiệu năng không liên quan Phase 2

Các chức năng này cần Phase riêng.

# 12. Checkpoint table

# 13. Quy trình thực thi

Phase 1.2 + 1.3 → Final Audit → Checkpoint → Phase 2.0 Inventory + Design → Approval → 2A Mock Exam → Verification → 2B Learning Report → Verification → 2C PWA → Verification → 2D Audio/TTS.

# 14. Yêu cầu đối với AI Coding Agent

Không code khi chưa được phép.

Không mở rộng phạm vi.

Không tự tạo dữ liệu giáo dục.

[BỔ SUNG] Quy tắc dependency: nếu phát sinh nhu cầu cài dependency mới → DỪNG, báo cáo và xin phê duyệt trước; chỉ được cài sau khi có phê duyệt rõ ràng.

Không tự cài dependency.

Không sửa file ngoài danh sách.

Báo cáo trước checkpoint.

Chạy tsc và build.

Dừng khi FAIL.

Giữ nguyên chức năng Phase 1.

Tái sử dụng architecture hiện tại.

Không CustomEvent tại UI.

Không viết lại Gamification Engine nếu chưa yêu cầu.

Không tự đổi layout/UI ngoài phạm vi.

# 15. Tiêu chí thành công

Mock Exam ổn định

Chấm điểm/timer chính xác

Lưu lịch sử

Gamification tích hợp

Learning Report hoạt động

Export/PWA/Audio nếu được triển khai

Không phá Phase 1

tsc PASS

build PASS

Không lỗi runtime nghiêm trọng

Không mất dữ liệu

# 16. Baseline dữ liệu

Lessons: L10 3; L11 3; L12 3; tổng 9.

Quiz: L10 8; L11 8; L12 8; tổng 24.

AK Disassembly: 8 bước.

Practical Skills: 6 kỹ năng.

Chỉ thay đổi khi có data change được phê duyệt.

# 17. Trạng thái ban đầu

18A. QUY TẮC CHỐT PHẠM VI TRƯỚC KHI CODE

[BỔ SUNG] Core = 2A + 2B. Optional = 2C + 2D. Không tự chuyển hạng mục Optional thành bắt buộc. Mọi dependency mới và mọi thay đổi ngoài danh sách file được phê duyệt đều phải DỪNG → báo cáo → chờ phê duyệt.

# 18. Checkpoint đầu tiên — Phase 2.0

Đọc codebase liên quan.

Đọc quiz.ts.

Kiểm tra data model.

Kiểm tra GamificationContext.

Kiểm tra QuizSection.

Kiểm tra localStorage.

Đề xuất architecture Mock Exam.

Liệt kê file tạo/sửa.

Liệt kê rủi ro.

Lập verification plan.

[BỔ SUNG] Các quyết định bắt buộc phải chốt và được phê duyệt trước khi sang Phase 2A:

(a) Phạm vi đề: thi theo lớp (10/11/12 riêng) hay tổng hợp L10–L12 (theo mục 4.3).

(b) Thời lượng thi và hành vi khi reload/mất mạng giữa bài — Resume hay Invalidate (theo mục 4.6).

(c) Chuẩn quy đổi điểm/thang điểm (theo mục 4.8).

(d) Số lượng lịch sử thi tối đa lưu trong localStorage (N lần gần nhất) (theo mục 4.11).

TUYỆT ĐỐI KHÔNG CODE Ở CHECKPOINT 2.0. Hoàn thành xong phải dừng và chờ phê duyệt.



|  |  |

| --- | --- |

| Phiên bản | 1.1 |

| Phạm vi | Phase 2 |

| Tiền đề | Phase 1.2 + Phase 1.3 đã hoàn thành và vượt Final Codebase Audit. |

| Nguyên tắc | Không phá vỡ chức năng hiện có, không thay đổi ngoài phạm vi. |





| Checkpoint | Nội dung | Verification | PASS |

| --- | --- | --- | --- |

| 2.0 | Inventory & Design | Không sửa code | Plan approved |

| 2A.1 | Mock Exam data/session | tsc | PASS |

| 2A.2 | Timer & Exam UI | tsc + build | PASS |

| 2A.3 | Scoring & Result | tsc + build | PASS |

| 2A.4 | Gamification | tsc + build | PASS |

| 2A.5 | Persistence & regression | tsc + build + runtime | PASS |

| 2B.1 | Learning Report | tsc + build | PASS |

| 2B.2 | Export | tsc + build | PASS |

| 2C.1 | PWA foundation | tsc + build | PASS |

| 2C.2 | Install/offline | runtime | PASS |

| 2D.1 | Audio/TTS | tsc + build | PASS |





| Hạng mục | Trạng thái |

| --- | --- |

| Phase 1.2 | COMPLETED |

| Phase 1.3 | COMPLETED |

| Phase 2.0 | NOT STARTED |

| Phase 2A | NOT STARTED |

| Phase 2B | NOT STARTED |

| Phase 2C | NOT STARTED |

| Phase 2D | NOT STARTED |

