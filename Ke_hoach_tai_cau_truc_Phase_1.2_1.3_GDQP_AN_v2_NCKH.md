KẾ HOẠCH TÁI CẤU TRÚC PROJECT
PHASE 1.2 + PHASE 1.3

Dự án Website Giáo dục Quốc phòng & An ninh

# 1. Mục tiêu

- Tách file src/data.ts (~42KB) thành các module dữ liệu nhỏ, dễ bảo trì.

- Giữ nguyên 100% nội dung bài học, câu hỏi, dữ liệu 3D và hành vi hiện tại của hệ thống.

- Tạo GamificationContext để quản lý việc truy cập XP/state trong React thay cho CustomEvent XP rải rác.

- Không thay đổi UI/layout/design nếu không có yêu cầu riêng.

- Sau từng nhóm thay đổi phải kiểm tra build để dễ phát hiện và cô lập lỗi.

# 2. Cấu trúc mong muốn sau khi hoàn thành

src/
├── data/
│   ├── index.ts
│   ├── lessons10.ts
│   ├── lessons11.ts
│   ├── lessons12.ts
│   ├── quiz.ts
│   └── disassembly.ts
│
├── context/
│   └── GamificationContext.tsx
│
├── data.ts                  ← giữ làm compatibility layer
├── gamification.ts          ← giữ logic lõi
├── main.tsx
├── App.tsx
└── components/
    ├── TheorySection.tsx
    ├── QuizSection.tsx
    ├── MapSection.tsx
    └── training/
        └── StepByStepModule.tsx

# 3. PHASE 1.2 — Tách data.ts

## 3.1. Phân tích trước khi chỉnh sửa

- Đọc toàn bộ src/data.ts và xác định chính xác từng nhóm dữ liệu.

- Xác định data bài học lớp 10, lớp 11, lớp 12, ngân hàng Quiz và dữ liệu tháo lắp AK-47/Step-by-Step.

- Xác định các type/interface/constant dùng chung.

- Tìm toàn project tất cả nơi đang import từ data.ts.

- Không đổi tên biến, cấu trúc dữ liệu hoặc nội dung nếu không cần thiết.

## 3.2. Tạo các file dữ liệu

## 3.3. Tạo src/data/index.ts

Chỉ dùng để re-export dữ liệu; không chứa logic xử lý.

export * from "./lessons10";
export * from "./lessons11";
export * from "./lessons12";
export * from "./quiz";
export * from "./disassembly";

## 3.4. Xử lý src/data.ts

KHÔNG xóa src/data.ts ngay. Sau khi dữ liệu đã được tách và kiểm tra, biến src/data.ts thành compatibility layer để các import cũ tiếp tục hoạt động:

export * from "./data/index";

Mục đích là tránh việc refactor làm vỡ hàng loạt import cũ. Không để data 42KB tồn tại song song với data mới.

## 3.5. Kiểm tra Phase 1.2

- Search toàn project các import liên quan đến ./data, ../data và các export cũ.

- Đảm bảo không có hai nguồn dữ liệu độc lập hoặc dữ liệu bị copy trùng.

- Chạy npm run build.

- Nếu build lỗi: DỪNG, sửa lỗi, build lại; không chuyển sang Phase 1.3 khi build chưa pass.

# 4. PHASE 1.3 — GamificationContext

## 4.1. Nguyên tắc

- Giữ nguyên gamification.ts và logic tính XP/Level/Streak/Progress hiện có nếu không cần thay đổi.

- Context chỉ làm lớp kết nối React với logic Gamification.

- Không thay đổi mức XP hiện tại chỉ vì refactor.

- Không thay đổi giao diện hoặc hành vi người dùng.

## 4.2. Tạo Context

Tạo:

src/context/GamificationContext.tsx

Context cung cấp hook useGamification(), tối thiểu phải cho phép các component truy cập state và hàm addXP theo API phù hợp với logic hiện tại.

Ví dụ sử dụng:
const { addXP } = useGamification();
addXP(10, "Đọc xong lý thuyết");

## 4.3. Bọc App bằng Provider

Sửa src/main.tsx để App nằm bên trong GamificationProvider:

<GamificationProvider>
  <App />
</GamificationProvider>

## 4.4. Sửa component theo từng bước

## 4.5. Loại bỏ CustomEvent XP cũ

Search toàn project các chuỗi:

- gqd_xp_updated

- CustomEvent

- dispatchEvent

- addEventListener

Xác định từng chỗ có liên quan đến XP/Gamification. Thay cơ chế giao tiếp XP bằng useGamification() và addXP() khi phù hợp. Không xóa CustomEvent nếu nó đang phục vụ một chức năng khác ngoài Gamification.

## 4.6. Kiểm tra sau Phase 1.3

- npm run build phải thành công.

- Đọc bài học có cộng XP đúng.

- Hoàn thành Quiz có cộng XP đúng.

- Hoàn thành Step-by-Step có cập nhật XP/progress đúng.

- Level cập nhật đúng.

- Streak/progress không bị reset ngoài ý muốn.

- Reload trang không làm mất dữ liệu Gamification nếu trước đây hệ thống có persistence.

# 5. Các file được phép tạo/sửa

# 6. QUY TẮC AN TOÀN BẮT BUỘC

- KHÔNG thay đổi UI/layout/design hiện tại.

- KHÔNG thay đổi nội dung bài học.

- KHÔNG thay đổi câu hỏi, đáp án hoặc dữ liệu Quiz.

- KHÔNG thay đổi dữ liệu 3D/Step-by-Step.

- KHÔNG tự ý thay đổi logic tính XP/Level/Streak.

- KHÔNG xóa gamification.ts.

- KHÔNG xóa data.ts ngay; dùng compatibility layer.

- KHÔNG tạo dữ liệu trùng lặp.

- KHÔNG sửa nhiều nhóm lớn cùng lúc.

- Sau mỗi checkpoint phải chạy npm run build.

- Nếu build lỗi phải dừng và sửa lỗi trước khi tiếp tục.

- Trước khi kết thúc phải kiểm tra toàn bộ import và các CustomEvent liên quan đến Gamification.

# 7. Thứ tự thực hiện cuối cùng

1. Backup project / tạo Git checkpoint.

2. Phân tích src/data.ts và toàn bộ import liên quan.

3. Tạo src/data/.

4. Tách lessons10, lessons11, lessons12, quiz, disassembly.

5. Tạo src/data/index.ts.

6. Biến src/data.ts thành compatibility layer.

7. Kiểm tra import + npm run build → PASS.

8. Tạo GamificationContext.tsx.

9. Bọc App bằng GamificationProvider trong main.tsx.

10. Sửa App.tsx nếu cần.

11. Sửa TheorySection.tsx → build.

12. Sửa QuizSection.tsx → build.

13. Sửa MapSection.tsx → build.

14. Sửa StepByStepModule.tsx → build.

15. Search toàn project các CustomEvent/dispatchEvent/addEventListener liên quan đến XP.

16. Kiểm tra XP, Level, Streak, Progress và persistence.

17. npm run build lần cuối.

# 8. Tiêu chí hoàn thành

- Project build thành công.

- Không có lỗi TypeScript/import.

- UI/layout không thay đổi.

- Nội dung dữ liệu không bị mất hoặc thay đổi.

- Data được tách thành các module đúng mục đích.

- Gamification hoạt động như trước nhưng các component sử dụng Context.

- Không còn CustomEvent XP cũ ở những nơi đã chuyển sang Context.

- Không có dữ liệu bị duplicate giữa data.ts và src/data/.

# 9. Prompt chỉ dẫn cho AI thực hiện

Hãy thực hiện PHASE 1.2 + PHASE 1.3 theo đúng tài liệu này.

Ưu tiên tuyệt đối: bảo toàn chức năng hiện tại, bảo toàn dữ liệu, bảo toàn UI/layout và giảm rủi ro refactor.

Không được tự ý redesign, đổi tên biến hàng loạt, viết lại logic, thay đổi nội dung bài học/Quiz/3D hoặc nâng cấp dependency nếu không cần.

Thực hiện từng checkpoint. Sau mỗi checkpoint chạy npm run build. Nếu build lỗi, dừng lại và sửa lỗi trước khi tiếp tục.

Đặc biệt:
1. Không xóa src/data.ts ngay; chuyển nó thành compatibility layer re-export.
2. Không duplicate data.
3. Giữ nguyên src/gamification.ts và logic lõi.
4. Chỉ thay cơ chế CustomEvent liên quan đến Gamification bằng useGamification khi đã xác định đúng.
5. Cuối cùng phải search toàn project và kiểm tra build lần cuối.

Nếu phát hiện cấu trúc hiện tại khác với kế hoạch, hãy phân tích và báo cáo trước khi thực hiện thay đổi có nguy cơ phá vỡ kiến trúc.

# 10. BỔ SUNG KIỂM SOÁT CHẤT LƯỢNG PHỤC VỤ NCKH

## 10.1. Giải quyết mâu thuẫn về phạm vi file được phép sửa

Danh sách file ở Mục 5 là danh sách tối thiểu, không phải danh sách đóng. Trong quá trình thực hiện, nếu bước rà soát CustomEvent phát hiện thêm file có logic Gamification/XP cần chuyển sang Context, file đó có thể được bổ sung vào phạm vi sửa.

- Bắt buộc search toàn project trước khi thay đổi cơ chế XP.

- Mọi file phát sinh ngoài danh sách tối thiểu phải được ghi vào báo cáo thay đổi (Change Log) trước khi sửa.

- Không tự ý sửa file phát sinh nếu chưa xác định rõ nó thực sự liên quan đến Gamification.

- Nếu phát hiện thay đổi có nguy cơ ảnh hưởng kiến trúc hoặc chức năng ngoài phạm vi Phase 1.2 + 1.3, phải dừng và phân tích trước.

Lệnh rà soát tham khảo:

Tìm các chuỗi: "gqd_xp_updated", "CustomEvent", "dispatchEvent", "addEventListener", "addXP", "XP", "gamification".

## 10.2. Xác minh dữ liệu trước và sau khi tách

Mục tiêu: chứng minh định lượng rằng refactor chỉ thay đổi cách tổ chức mã nguồn, không làm mất, thêm hoặc thay đổi dữ liệu.

TRƯỚC KHI TÁCH:

- Ghi nhận số lượng bài học lớp 10.

- Ghi nhận số lượng bài học lớp 11.

- Ghi nhận số lượng bài học lớp 12.

- Ghi nhận số lượng câu hỏi Quiz.

- Ghi nhận số lượng bước trong dữ liệu Step-by-Step/Disassembly.

- Nếu cấu trúc phù hợp, tạo checksum/hash cho từng nhóm dữ liệu hoặc từng object sau khi chuẩn hóa JSON.

SAU KHI TÁCH:

- Đọc dữ liệu thông qua src/data/index.ts.

- Đếm lại toàn bộ các nhóm dữ liệu tương ứng.

- So sánh số lượng trước/sau.

- Nếu dùng checksum/hash: so sánh checksum trước/sau.

- Mọi sai lệch phải được điều tra và sửa trước khi tiếp tục.

Minh chứng NCKH nên lưu thành bảng Before/After và có thể chụp màn hình kết quả kiểm tra để đưa vào phụ lục báo cáo.

## 10.3. Kiểm tra TypeScript độc lập với build

Không dùng npm run build làm tiêu chí duy nhất. Một số cấu hình Vite có thể transpile TypeScript mà không thực hiện full type-check.

- Checkpoint Phase 1.2: npm run build + npx tsc --noEmit.

- Checkpoint Phase 1.3: npm run build + npx tsc --noEmit.

- Final verification: npm run build + npx tsc --noEmit.

Nếu project đã có script type-check riêng trong package.json thì ưu tiên dùng script đó; không tự ý thay đổi tsconfig/package.json chỉ để làm cho kiểm tra pass.

## 10.4. Quy tắc rollback khi checkpoint thất bại

Mục tiêu là tránh tình trạng sửa lỗi chồng lỗi làm kiến trúc lệch khỏi plan.

- Mỗi Phase phải có Git checkpoint/commit trước khi bắt đầu.

- Sau mỗi nhóm thay đổi quan trọng phải tạo checkpoint mới khi build và type-check đã pass.

- Nếu một file gây lỗi và sau tối đa 2 vòng sửa có chủ đích mà lỗi vẫn chưa được giải quyết, không tiếp tục vá chồng.

- Revert file đó về checkpoint gần nhất hoặc khôi phục trạng thái trước thay đổi.

- Phân tích nguyên nhân gốc rồi mới thiết kế cách sửa khác.

- Không hy sinh tính đúng đắn của dữ liệu hoặc kiến trúc chỉ để ép build pass.

## 10.5. Phạm vi không thực hiện (Out of Scope)

Phase 1.2 + 1.3 chỉ là refactor kiến trúc và quản lý Gamification. Các nội dung sau không thuộc phạm vi:

- Không redesign UI/UX.

- Không thay đổi layout, màu sắc, animation hoặc visual design.

- Không tối ưu hiệu năng nếu không phát sinh trực tiếp từ refactor.

- Không nâng cấp dependency/framework chỉ vì mục đích 'làm mới'.

- Không thay đổi nội dung SGK/bài học.

- Không thay đổi câu hỏi, đáp án hoặc cách chấm Quiz.

- Không thay đổi mô hình 3D, dữ liệu Step-by-Step hoặc thứ tự thao tác.

- Không thay đổi công thức XP/Level/Streak nếu không có yêu cầu riêng.

- Không thực hiện các tính năng mới ngoài mục tiêu của Phase 1.2 + 1.3.

## 10.6. Bảng kết quả kỳ vọng vs. kết quả thực tế

## 10.7. Change Log bắt buộc

Để phù hợp với việc làm NCKH, mọi thay đổi ngoài danh sách ban đầu phải được ghi lại.

# 11. CHECKLIST CUỐI CÙNG TRƯỚC KHI BÀN GIAO

- ☐ Đã có Git checkpoint/backup trước Phase.

- ☐ Đã search toàn project để xác định các điểm dùng data.ts và Gamification.

- ☐ Danh sách file thực tế đã sửa khớp với Change Log.

- ☐ Không có file phát sinh được sửa âm thầm.

- ☐ Số lượng dữ liệu Before/After khớp.

- ☐ Checksum/hash khớp nếu đã áp dụng.

- ☐ npm run build PASS.

- ☐ npx tsc --noEmit PASS.

- ☐ Không còn import/data duplicate ngoài compatibility layer có chủ đích.

- ☐ GamificationContext hoạt động đúng.

- ☐ Các luồng XP chính hoạt động đúng.

- ☐ UI/Layout không thay đổi ngoài chủ đích.

- ☐ Không có thay đổi ngoài phạm vi.

- ☐ Có bảng Kết quả kỳ vọng vs. Kết quả thực tế.

- ☐ Có minh chứng/log/ảnh cần thiết cho báo cáo NCKH.

# 12. Chỉ thị bổ sung cho AI khi thực thi

Trước khi sửa code, AI phải thực hiện inventory/search để xác định phạm vi thực tế. Không được coi danh sách file trong Mục 5 là danh sách đóng. Nếu phát sinh file mới liên quan đến Gamification, phải ghi nhận file + lý do + tác động dự kiến vào Change Log trước khi sửa. Sau refactor phải thực hiện kiểm tra dữ liệu Before/After, npm run build và npx tsc --noEmit. Nếu checkpoint thất bại quá 2 vòng sửa có chủ đích đối với cùng một file, phải rollback về checkpoint gần nhất và phân tích nguyên nhân gốc thay vì tiếp tục vá lỗi.

| File | Nội dung | Yêu cầu |
| --- | --- | --- |
| lessons10.ts | Bài giảng GDQP-AN lớp 10 | Chỉ di chuyển data, không viết lại |
| lessons11.ts | Bài giảng GDQP-AN lớp 11 | Chỉ di chuyển data, không viết lại |
| lessons12.ts | Bài giảng GDQP-AN lớp 12 | Chỉ di chuyển data, không viết lại |
| quiz.ts | Ngân hàng câu hỏi Quiz | Giữ nguyên câu hỏi/đáp án/cấu trúc |
| disassembly.ts | Các bước tháo lắp AK-47/Step-by-Step | Giữ nguyên data và thứ tự |

| Thứ tự | File | Sau khi sửa |
| --- | --- | --- |
| 1 | src/App.tsx | npm run build |
| 2 | src/components/TheorySection.tsx | npm run build |
| 3 | src/components/QuizSection.tsx | npm run build |
| 4 | src/components/MapSection.tsx | npm run build |
| 5 | src/components/training/StepByStepModule.tsx | npm run build |

| File | Hành động | Mục đích |
| --- | --- | --- |
| src/data/lessons10.ts | TẠO | Data lớp 10 |
| src/data/lessons11.ts | TẠO | Data lớp 11 |
| src/data/lessons12.ts | TẠO | Data lớp 12 |
| src/data/quiz.ts | TẠO | Data Quiz |
| src/data/disassembly.ts | TẠO | Data Step-by-Step |
| src/data/index.ts | TẠO | Re-export |
| src/context/GamificationContext.tsx | TẠO | React Context cho Gamification |
| src/data.ts | SỬA | Compatibility layer |
| src/main.tsx | SỬA | GamificationProvider |
| src/App.tsx | SỬA | Kết nối useGamification nếu cần |
| TheorySection.tsx | SỬA | Thay cơ chế XP cũ |
| QuizSection.tsx | SỬA | Thay cơ chế XP cũ |
| MapSection.tsx | SỬA | Thay cơ chế XP cũ |
| StepByStepModule.tsx | SỬA | Thay cơ chế XP cũ |
| src/gamification.ts | GIỮ NGUYÊN | Logic lõi |

| Hạng mục | Kết quả kỳ vọng | Kết quả thực tế | Minh chứng |
| --- | --- | --- | --- |
| Build | Pass |  | Ảnh/log build |
| TypeScript | tsc --noEmit Pass |  | Ảnh/log type-check |
| Bài học L10 | Số lượng không đổi |  | Bảng Before/After |
| Bài học L11 | Số lượng không đổi |  | Bảng Before/After |
| Bài học L12 | Số lượng không đổi |  | Bảng Before/After |
| Quiz | Số lượng không đổi |  | Bảng Before/After |
| Step-by-Step | Số lượng không đổi |  | Bảng Before/After |
| Gamification | XP/Level/Streak/Progress hoạt động như trước |  | Test case |
| UI/Layout | Không thay đổi |  | Ảnh trước/sau |
| CustomEvent XP | Được chuyển sang Context ở các điểm phù hợp |  | Search result |

| Thời điểm | File | Lý do sửa | Thay đổi | Kết quả kiểm tra |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
