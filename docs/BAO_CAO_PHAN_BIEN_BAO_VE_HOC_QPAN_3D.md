# BÁO CÁO PHẢN BIỆN KỸ THUẬT DỰ ÁN “HỌC QPAN 3D”

**Mục đích:** phục vụ bảo vệ dự án KHKT THPT cấp trường  
**Ngày kiểm tra repository:** 14/09/2026  
**Nguyên tắc kết luận:** chỉ ghi nhận điều có bằng chứng trong mã nguồn, tài sản, cấu hình hoặc kiểm thử. Nội dung trong DOCX/PPTX đính kèm chỉ được dùng để đối chiếu, không được xem là bằng chứng chức năng đã hoàn thiện.

---

## 0. Kết luận điều hành

Dự án đã vượt mức “chỉ có giao diện”: repository có một cổng học tập React hoạt động, học liệu tĩnh lớp 10–12, hai hệ thống câu hỏi, nhiều mô hình/animation 3D, mô phỏng trường bắn, mô-đun khảo sát, tài khoản và một pipeline MediaPipe Pose có thuật toán chấm theo rubric. Lệnh kiểm tra TypeScript đã đạt và 36/36 bài kiểm thử có sẵn đã qua.

Tuy nhiên, khi bảo vệ phải gọi đây là **nguyên mẫu tích hợp đang kiểm thử**, không phải hệ thống đánh giá giáo dục hoàn chỉnh. Bốn giới hạn lớn nhất là:

1. Website public theo cấu hình Cloudflare hiện chỉ cài API khảo sát/tài khoản; không có route cho trợ giảng, chấm tự luận và lưu kết quả thi.
2. AI Pose có thuật toán và test mô phỏng tốt nhưng chưa có bằng chứng độ chính xác trên người thật, nhiều thể trạng, quần áo, ánh sáng và thiết bị.
3. “WebAR” hiện là camera làm nền và mô hình 3D phủ lên màn hình; chưa có nhận diện mặt phẳng, neo mô hình hay theo dõi không gian kiểu AR thực.
4. Hiệu quả học tập, tính mới so với sản phẩm khác và khả năng triển khai quy mô trường chưa được repository chứng minh bằng số liệu.

**Câu định vị an toàn khi mở đầu:**

> Học QPAN 3D là nguyên mẫu cổng học tập web chuyên biệt cho GDQP-AN, tích hợp học liệu, quan sát 3D, luyện tập, thi thử và các mô-đun AI hỗ trợ. Nhóm đã xây dựng được luồng chức năng và kiểm thử kỹ thuật ban đầu; độ chính xác AI và hiệu quả học tập vẫn đang được đánh giá thực nghiệm, giáo viên giữ vai trò quyết định chuyên môn.

---

## 1. Phạm vi và bằng chứng đã kiểm tra

- Đã duyệt mã frontend trong `src/`, backend Express trong `server.ts` và `server/`, Cloudflare Worker, Netlify Function, migration D1, dữ liệu câu hỏi, mô hình GLB, tài liệu kỹ thuật và test.
- Đã đọc nội dung DOCX “Tóm tắt dự án” và PPTX “Trình bày dự án”; chỉ dùng để phát hiện tuyên bố cần kiểm tra lại.
- `npm.cmd run lint`: **đạt**.
- Bộ test Pose + exam API/client + arcade + training: **36/36 đạt**.
- Test chứng minh logic/thuật toán trên fixture; **không** chứng minh độ chính xác Pose trên người thật hoặc hiệu quả sư phạm.
- Không sửa code. Repository vốn đã có các thay đổi chưa commit của nhóm; quá trình audit không làm phát sinh thay đổi code mới.

### Quy ước trạng thái

- **A — Đã có, có thể trình diễn:** luồng chính hiện diện và có bằng chứng mã/test/tài sản.
- **B — Có điều kiện:** có code nhưng phụ thuộc backend, API, mạng, tài khoản hoặc môi trường triển khai.
- **C — Demo/thử nghiệm:** có giao diện/thuật toán nguyên mẫu nhưng chưa đủ bằng chứng để gọi là hoàn thiện hoặc chính xác.
- **D — Chưa có/không được tuyên bố:** repository không chứng minh.

---

## 2. Danh sách chính xác các chức năng hiện đã hoạt động

| Chức năng | Trạng thái | Bằng chứng và phạm vi thật | Luồng trình bày ngắn trước BGK |
|---|---:|---|---|
| Khung website, điều hướng module, giao diện sáng/tối, responsive | A | React 19, TypeScript, Vite, Tailwind CSS 4, Motion; `src/App.tsx` định tuyến nội bộ 15 tab bằng state | Người dùng mở một website, chọn module trên thanh điều hướng; nội dung được đổi trong cùng trang, theme được lưu trên trình duyệt. |
| Học liệu lớp 10–12 | A | 31 bài: lớp 10 có 12, lớp 11 có 10, lớp 12 có 9; 78 mục nội dung chi tiết và 39 câu củng cố trong `lessonsDetailGrade*.ts` | Chọn khối → tìm/chọn bài → xem mục tiêu, nội dung, tóm tắt → làm câu củng cố → có thể in và đánh dấu đã học. |
| Quiz nhanh theo khối | A | 48 câu/khối, tổng 144 câu trong `src/data/quiz.ts`; chấm ngay, giải thích đáp án, lưu kỷ lục trên thiết bị | Học sinh chọn lớp, trả lời từng câu; hệ thống so đáp án tĩnh, phản hồi đúng/sai và lưu điểm cao nhất trong trình duyệt. |
| Thi thử nhiều định dạng | A ở trình duyệt; B với lưu máy chủ | Ngân hàng gồm 120 MCQ, 30 cụm Đúng/Sai (mỗi cụm 4 ý), 18 câu tự luận; có đề lớp 10/11/12/tổng hợp, 4 format, mốc 15/30/45 phút/tự do | Hệ thống xáo câu và phương án, đếm giờ, tự lưu phiên đang làm, chấm MCQ/Đúng-Sai và lưu tối đa 10 kết quả gần nhất trên thiết bị. Nếu đăng nhập và chạy backend Express, kết quả còn được gửi lên máy chủ. |
| Mô hình AK-47 3D | A | Three.js/R3F tải `ak47.glb`; 17 mục chi tiết; tìm/chọn bộ phận, highlight/phóng gần, 6 mốc tháo + 6 mốc lắp, tự chạy animation | Học sinh xoay/phóng mô hình, chọn bộ phận để đọc công dụng/cấu tạo; ở chế độ quy trình, hệ thống đưa animation đến từng mốc tháo hoặc lắp. Đây là quan sát có hướng dẫn, không phải thao tác kéo-thả tự do. |
| Thao trường và điều lệnh 3D | A | `training-ground.glb`, `soldier-animated.glb`; 11 clip chiến sĩ đã được test; 20 lựa chọn thuộc đội ngũ, vận động, địa hình, la bàn | Chọn nội dung → model/animation tương ứng chạy → đổi góc camera, tạm dừng/phát lại, xem một hoặc ba chiến sĩ và khu vực địa hình liên quan. |
| Bài kỹ năng theo bước | A về nội dung/video; một phần A về 3D | 7 kỹ năng, 14 bước, mỗi bước có video YouTube, checklist và câu hỏi; 3 kỹ năng có mô phỏng 3D riêng: trườn/bò, ném lựu đạn, tư thế súng | Học sinh xem video hoặc 3D nếu có, đọc mục tiêu, tự đánh dấu checklist, trả lời đúng câu hỏi rồi mới sang bước tiếp theo. Đây là tự kiểm tra, không có camera xác minh thao tác. |
| Mô phỏng ném lựu đạn | A ở mức hoạt ảnh minh họa | Model `tu_the_nem.glb` + `grenade.glb`; phát động tác, thả vật thể, đường bay/hiệu ứng nổ, reset và đổi góc quan sát | Bấm ném → animation người và vật thể chạy → quan sát quỹ đạo/hiệu ứng → nạp lại. Không được gọi là mô phỏng vật lý đã hiệu chuẩn. |
| Trường bắn ảo | A ở mức game giáo dục | 4 bài bắn tĩnh 10/100/150/200 m; ngắm cơ khí 3D, ADS, sway, nín thở, recoil, âm thanh, điểm và báo bia; thêm 3 màn arcade với băng đạn/bia động | Chọn bài → điều khiển tâm/ngắm → bắn số đạn quy định → ray 3D cắt mặt phẳng bia để tính vòng điểm → tổng kết. Cự ly và đường bay là thông số trò chơi, không phải đạn đạo thật. |
| Không gian di tích 360° | B | 6 địa điểm TP.HCM, mỗi nơi 4 câu hỏi; nhúng Google Street View/Satellite hoặc VR Tour bên thứ ba, lấy ảnh Wikipedia | Chọn địa điểm → website mở nội dung 360° từ dịch vụ ngoài → xem thông tin → đổi câu hỏi và mở đáp án. Cần Internet và phụ thuộc quyền nhúng của bên thứ ba. |
| Gamification cục bộ | A nhưng có lỗi nhất quán | 8 cấp bậc, 11 huy hiệu; XP từ đánh dấu bài, quiz, xem đáp án di tích, hoàn thành kỹ năng; lưu `localStorage` | Mỗi hành động hợp lệ cập nhật một hồ sơ XP ngay trên thiết bị; giao diện tính cấp bậc và hiện huy hiệu. Không đồng bộ theo tài khoản hay giữa thiết bị. |
| Tài khoản và phân quyền | B theo backend | Có đăng nhập, đăng xuất, đổi mật khẩu, tạo tài khoản học sinh/giáo viên; admin xem khảo sát, admin/giáo viên xem kết quả thi. Express dùng JSON + session RAM; Cloudflare dùng D1; Netlify dùng Blobs | Người dùng đăng nhập bằng tài khoản được cấp; cookie phiên xác định vai trò; backend kiểm tra vai trò trước khi trả dữ liệu quản trị. Các triển khai hiện không đồng nhất chức năng. |
| Khảo sát trước/sau | A trên backend Express và Cloudflare/Netlify đã viết | Học sinh/giáo viên; 5 câu trước và 8 câu sau; có người dùng tự do; kiểm tra đủ câu; admin mở/đóng đợt, xem/xóa, biểu đồ, ghép cặp, CSV/XLSX | Người tham gia chọn vai trò/giai đoạn và trả lời; server kiểm tra rồi lưu; admin lọc và so sánh trước–sau, xuất báo cáo. Repository địa phương chỉ có rất ít dữ liệu, chưa đủ kết luận nghiên cứu. |
| Quản trị kết quả thi | A trên Express; không có trên Worker public | Giáo viên/admin lọc, sắp xếp, xem chi tiết, xóa, in và xuất Excel | Kết quả học sinh đăng nhập gửi về Express; tài khoản giáo viên/admin mở dashboard để tổng hợp. Endpoint chưa xuất hiện trong Cloudflare Worker/Netlify redirect. |

### Điều không nên đếm trùng

- “Trợ giảng AI toàn trang” và “trang Trợ giảng AI” dùng cùng `/api/ask`; đây là hai giao diện cho một backend, không phải hai AI khác nhau.
- Quiz nhanh 144 câu và ngân hàng thi 168 đơn vị câu hỏi là hai bộ dữ liệu riêng.
- Các file PDF SGK có trong `public/books/`, nhưng không có code nào mở/nhúng chúng; không nên tuyên bố website đang cho đọc PDF SGK.

---

## 3. Các chức năng mới ở mức demo/thử nghiệm/chưa hoàn thiện

| Chức năng | Mức hiện tại | Điều đã có | Điều chưa được chứng minh/đang thiếu |
|---|---|---|---|
| AI Pose Analysis | C — beta có nền kỹ thuật | MediaPipe Pose Landmarker chạy trên thiết bị, 33 landmark; quality gate, hiệu chỉnh, smoothing, feature extraction, rubric và phản hồi; 4 động tác khả dụng: đứng nghiêm, đứng nghỉ, quay trái, quay phải | Chưa kiểm thử độ chính xác trên mẫu người thật; rubric là ngưỡng beta; chưa đo sai số/độ nhạy/độ đặc hiệu; không đo chính xác ngón tay, ánh mắt; chưa lưu kết quả hay tích hợp giáo viên/XP. Quay sau và chào ghi “sắp ra mắt”. |
| Trợ giảng AI | C/B | Express có `/api/ask` gọi Google Gemini, gửi 8–10 lượt lịch sử và giới hạn bằng system prompt | Không có RAG/truy xuất từ `lessonsDetail*`, không trích nguồn, không kiểm chứng đáp án, không có route này trong Cloudflare Worker/Netlify hiện tại. Không được nói “trả lời dựa trực tiếp trên SGK đã nạp”. |
| AI nhận xét tự luận | C | Express gửi đề, bài làm và rubric cho Gemini; có nút “chấm thử” | `suggestedAnswer` gửi từ client đang để rỗng. Điểm chính thức khi nộp bài không dùng kết quả AI mà ước lượng theo độ dài ký tự; khi lỗi client còn hiện điểm fallback cố định. Chỉ được gọi là nhận xét sơ bộ thử nghiệm. |
| Phân tích góp ý khảo sát bằng AI | B/C | Admin có thể gọi Gemini; dữ liệu góp ý được ẩn email/số điện thoại trước khi gửi; có fallback từ khóa cục bộ và cache | Chỉ phân tích chủ đề/cảm xúc đơn giản; kết quả phụ thuộc model; chưa có kiểm định chất lượng phân loại; dữ liệu gốc vẫn chứa thông tin do người dùng nhập. |
| WebAR | C — AR giả lập trên màn hình | Camera trước/sau làm nền; Canvas 3D trong suốt phủ lên; scale/xoay/cao độ thủ công; chụp ảnh; QR mở URL; 10 mục model (2 vũ khí + 8 chiến sĩ); upload GLB/GLTF | Không WebXR, hit-test, plane detection, anchor, occlusion hay tracking; model không “bám” bàn/sàn khi camera di chuyển. File `.gltf` có tài nguyên ngoài có thể không tải qua blob đơn. Nhãn UI ghi nhóm chiến sĩ “5” nhưng catalog thực tế có 8. |
| Bảng xếp hạng | D về dữ liệu thật | UI có 10 dòng mẫu hard-code | Không lấy từ tài khoản/server; tên và XP là dữ liệu giả lập. Chỉ nên gọi “mockup bảng xếp hạng”. |
| Đồng bộ tiến độ/XP theo tài khoản | D | Có localStorage trên một trình duyệt | Không có API/DB cho bài đã học, XP, huy hiệu, kỷ lục quiz hay lịch sử chat; xóa dữ liệu trình duyệt hoặc đổi máy là mất. |
| VR nhập vai | D | Có iframe 360° của bên thứ ba | Không có headset/WebXR/scene VR do nhóm xây dựng; nên gọi “trình xem nội dung 360°”, không gọi hệ thống VR nhập vai hoàn chỉnh. |
| YOLO | D | Chỉ được nhắc trong tài liệu trình bày | Không có dependency, model, pipeline hay source YOLO trong repository. Pose thực tế dùng MediaPipe. |
| Hiệu quả học tập và khả năng triển khai quy mô trường | D đến khi có dữ liệu | Có form và dashboard khảo sát | Dữ liệu repository hiện không đủ mẫu; chưa có thiết kế thí nghiệm, nhóm đối chứng, thống kê trước–sau, số người/thiết bị, thời gian tải và tỷ lệ lỗi. |

---

## 4. Công nghệ thực tế cho từng chức năng

| Nhóm | Công nghệ thật đang dùng | Nơi lưu/xử lý | Phụ thuộc/giới hạn |
|---|---|---|---|
| Website | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion, Lucide | Trình duyệt | Điều hướng bằng state, không phải router URL đầy đủ; refresh không giữ tab (ngoại trừ `/survey`). |
| 3D | Three.js 0.184, React Three Fiber, Drei, GLB/GLTF, Blender source/scripts | GPU/WebGL trên trình duyệt | Nhiều asset lớn; chất lượng và FPS phụ thuộc thiết bị. |
| AK tháo/lắp | GLB có animation + mapping mesh name + mốc thời gian | Trình duyệt | Là animation scrubbing/hướng dẫn; không có mô phỏng lắp ráp vật lý hay kiểm tra thao tác người dùng. |
| Thao trường/chiến sĩ | GLB rig/skinning, AnimationMixer, camera presets | Trình duyệt | 11 clip chiến sĩ được test headless; tính đúng chuẩn động tác vẫn cần giáo viên xác nhận. |
| AI Pose | `@mediapipe/tasks-vision` 0.10.17, model `pose_landmarker_lite.task`, WASM, Web Worker/CPU fallback, Canvas 2D | Xử lý camera cục bộ; không gửi frame lên server | Chấm bằng luật hình học có trọng số, không phải mô hình được nhóm huấn luyện; cần HTTPS/localhost và camera. |
| Học liệu | Dữ liệu TypeScript tĩnh trong `lessonsDetailGrade10/11/12.ts` | Bundle frontend | Không CMS, không nguồn trích dẫn theo đoạn, không quy trình duyệt phiên bản trong code. Ba PDF nằm trong public nhưng chưa được dùng. |
| Quiz nhanh | Mảng câu hỏi tĩnh + React state + localStorage | Trình duyệt | 144 câu; có thể làm lại để nhận XP; không có chống gian lận. |
| Thi thử | `questionBank.ts`, `examEngine.ts`, localStorage, API Express | Trình duyệt + JSONL khi chạy Express | 120 MCQ + 30 cụm Đ/S + 18 tự luận; server tin điểm do client gửi; Worker public chưa có API exam. |
| XP/gamification | Luật TypeScript, CustomEvent, localStorage | Trình duyệt | Không theo tài khoản; một số nhãn/sự kiện không khớp và có huy hiệu không thể mở khóa. |
| Trợ giảng AI | Google GenAI SDK, model được cấu hình trong server, prompt và lịch sử chat | Express → Gemini; lịch sử UI ở localStorage | Không RAG/citation; route thiếu trên Worker public; nội dung gửi sang dịch vụ AI bên ngoài. |
| Chấm tự luận AI | Google GenAI SDK + rubric trong prompt | Express → Gemini | Chỉ nhận xét sơ bộ; điểm nộp cuối là heuristic độ dài, không phải AI/giáo viên. |
| Khảo sát | React form; Express JSONL hoặc Cloudflare D1 hoặc Netlify Blobs; XLSX | Tùy môi trường deploy | Ba backend khác nhau gây rủi ro lệch tính năng/dữ liệu. |
| Tài khoản | Scrypt + salt; cookie HttpOnly/SameSite; role checks | Express JSON/in-memory session; D1; Netlify Blobs | Express có PIN khôi phục quản trị hard-code rất nguy hiểm; phiên Express mất khi restart. |
| Di tích 360° | iframe Google Maps/Street View/Visit HCMC; Wikipedia API | Dịch vụ bên thứ ba | Cần mạng; URL/quyền nhúng có thể đổi; nội dung 360 không do nhóm tự tạo. |
| Xuất báo cáo | SheetJS `xlsx`, CSV, `window.print` | Trình duyệt tải file | Chưa thấy automated test cho tính đúng file/biểu đồ Excel. |

---

## 5. Các điểm BGK có thể chất vấn hoặc bắt lỗi

### Mức nghiêm trọng cao

1. **Bản public và bản local không cùng chức năng.** `cloudflare/worker.ts` chỉ bắt `/api/survey`; `/api/ask`, `/api/evaluate-essay`, `/api/exam` không có. Nếu demo URL là `workers.dev`, ba nhóm chức năng này có khả năng 404. **Cần nhóm xác nhận môi trường demo thực tế.**
2. **Điểm thi có thể bị giả mạo.** Express xác định đúng danh tính từ session nhưng nhận `score`, `xpGained`, `details` từ client gần như nguyên trạng. Dashboard không nên được gọi là hệ thống điểm chính thức/chống gian lận.
3. **Khôi phục mật khẩu Express có PIN quản trị hard-code trong source và thông báo lỗi.** Đây là lỗ hổng cho phép đổi mật khẩu tài khoản nếu chạy backend Express. Không nên trình diễn như hệ thống bảo mật sản xuất.
4. **Điểm tự luận không phản ánh nội dung.** Điểm cuối dựa vào số ký tự; đoạn văn dài nhưng sai vẫn có điểm cao. AI review riêng không được đưa vào kết quả nộp.
5. **Tuyên bố AI bám SGK mạnh hơn bằng chứng.** Chatbot chỉ nhận prompt liệt kê chủ đề, không nhận nội dung bài học hoặc tài liệu truy xuất.

### Mức nghiêm trọng trung bình

6. **Pose chưa được hiệu chuẩn khoa học.** Test dùng dữ liệu tổng hợp và fake detector; tài liệu kỹ thuật tự ghi rubric là “beta training defaults”. Không có confusion matrix, MAE hay so sánh giáo viên.
7. **Tên WebAR gây hiểu nhầm.** Camera chỉ là lớp nền. Không có nhận diện bàn/sàn và model không neo trong không gian.
8. **Trường bắn không phải mô phỏng đạn đạo.** Bia được phóng đại 4×/7×/9×/11× để nhìn rõ; đường ray cắt mặt phẳng bia; không có gió, rơi đạn, thước ngắm điều chỉnh hay thông số AK thật được hiệu chuẩn.
9. **Gamification không nhất quán.** Nút học liệu ghi `+50 XP` nhưng engine cộng 10; câu củng cố/kỹ năng và XP thi thử có chỗ chỉ hiện toast mà không cộng; quiz nhanh có thể farm XP bằng làm lại.
10. **Một số huy hiệu không đạt được.** `recordMapVisit` không được gọi; `map_scholar` không được trao trong `checkBadges`; do đó huy hiệu toàn năng cũng không thể mở khóa theo luồng hiện tại.
11. **Bảng xếp hạng là giả lập.** 10 người dùng và XP hard-code, không liên kết tài khoản.
12. **Tiến độ không đồng bộ.** Học bài, XP, huy hiệu, kỷ lục quiz, lịch sử thi gần nhất và chat chủ yếu nằm trong localStorage.
13. **Trang chủ và học liệu dùng key tiến độ khác nhau.** `App.tsx` đọc `gqd_completed_lessons`, nhưng không có code ghi key này; hệ thống mới ghi `gqd_gamification_v2`.
14. **Phụ thuộc dịch vụ ngoài.** Video YouTube, bản đồ, VR tour, Wikipedia, QR server và Gemini có thể lỗi/mất mạng/bị chặn nhúng.
15. **Kích thước tài sản lớn.** Tổng các PDF và model đáng kể; riêng một số GLB hàng chục MB. Chưa có số liệu tải lần đầu, FPS, RAM và nhiệt máy thật.

### Nội dung/sư phạm cần xác nhận

16. Nội dung luật, số liệu vũ khí, sơ cứu và tiêu chí động tác được hard-code nhưng thiếu trích dẫn theo đoạn/ngày cập nhật; cần giáo viên GDQP-AN và nguồn chính thống duyệt.
17. Repository có 3 PDF SGK nhưng website không dùng; quyền phân phối các PDF/video/model cần nhóm xác nhận.
18. Các câu “chuẩn Bộ GD&ĐT” trong UI chưa kèm văn bản/ma trận chính thức chứng minh cấu trúc đề và thang điểm áp dụng cho môn này.
19. Form khảo sát lưu tên/lớp/trường và phản hồi; cần quy trình đồng thuận, thời hạn lưu, phân quyền và ẩn danh khi báo cáo.
20. Không có bằng chứng repo về so sánh đối thủ/thị trường, nhóm đối chứng, hiệu quả ghi nhớ, tăng điểm hay giảm thời gian dạy.

---

## 6. Ba mươi câu hỏi phản biện khó và câu trả lời mẫu 20–40 giây

**Ký hiệu `🔴 CẦN SỐ LIỆU`**: nhóm phải chuẩn bị khảo sát, thử nghiệm, log, bảng đo hoặc xác nhận giáo viên; không nên trả lời bằng cảm nhận.

### 1. Vấn đề thực tế nào chứng minh dự án này cần thiết? `🔴 CẦN SỐ LIỆU`

**Trả lời mẫu:** “Repository cho thấy nhóm đã xây được công cụ khảo sát trước–sau, nhưng bản thân code chưa chứng minh mức độ thiếu học liệu hay khó khăn thực hành. Vì vậy nhóm chỉ nên nêu đây là giả thuyết xuất phát từ quan sát ban đầu. Để kết luận, nhóm cần số người khảo sát, cách chọn mẫu và tỷ lệ học sinh/giáo viên gặp từng khó khăn.”

### 2. Dự án mới ở điểm nào so với website bài giảng, LMS hoặc quiz thông thường? `🔴 CẦN ĐỐI CHIẾU`

**Trả lời mẫu:** “Điểm khác biệt có thể chứng minh từ sản phẩm là việc đặt học liệu GDQP-AN, mô hình 3D, thi thử và thử nghiệm Pose trong một luồng web duy nhất. Nhóm chưa có khảo sát thị trường đủ rộng để tuyên bố là đầu tiên hay duy nhất. Vì vậy chúng em gọi đây là cách tích hợp chuyên biệt, không khẳng định độc quyền công nghệ.”

### 3. Có bằng chứng 3D giúp học sinh học tốt hơn hình ảnh hoặc video không? `🔴 CẦN SỐ LIỆU`

**Trả lời mẫu:** “Hiện repository chỉ chứng minh 3D có thể xoay, phóng, chọn bộ phận và phát animation; chưa chứng minh làm tăng điểm hoặc ghi nhớ. Nhóm cần thử nghiệm trước–sau hoặc so sánh hai nhóm học cùng nội dung, dùng cùng bài kiểm tra. Khi chưa có số liệu, chúng em chỉ nói 3D hỗ trợ quan sát đa góc.”

### 4. Những phần nào thực sự hoàn thiện, những phần nào chỉ thử nghiệm?

**Trả lời mẫu:** “Phần ổn định nhất là giao diện web, học liệu tĩnh, quiz, animation 3D và logic chấm trắc nghiệm. Pose, trợ giảng, chấm tự luận và WebAR vẫn là nguyên mẫu thử nghiệm. Đồng bộ tiến độ, bảng xếp hạng thật, YOLO và VR nhập vai chưa có bằng chứng triển khai trong repository.”

### 5. Tại sao chọn React và Three.js?

**Trả lời mẫu:** “React giúp chia giao diện thành các module học liệu, quiz, thi và quản trị; TypeScript kiểm tra kiểu dữ liệu. Three.js qua React Three Fiber cho phép dùng GLB trực tiếp trong trình duyệt, xoay camera và chạy animation mà không cài ứng dụng. Đổi lại, nhóm phải tối ưu model và kiểm tra máy yếu.”

### 6. Website có thật sự dùng tốt trên điện thoại cấu hình thấp không? `🔴 CẦN SỐ LIỆU`

**Trả lời mẫu:** “Code có responsive layout, điều khiển cảm ứng và cơ chế Pose hạ độ phân giải khi suy luận chậm. Nhưng đó chưa phải bằng chứng trên thiết bị thật. Nhóm cần bảng thiết bị, trình duyệt, thời gian tải, FPS, RAM, nhiệt độ và tỷ lệ hoàn thành demo để trả lời chính xác.”

### 7. Mô hình 3D có đúng tỷ lệ và đúng kỹ thuật quân sự không? `🔴 CẦN XÁC NHẬN GIÁO VIÊN`

**Trả lời mẫu:** “Repository chứng minh model GLB chạy được và animation có đủ clip, nhưng không tự chứng minh đúng chuyên môn. Một số mô hình còn dùng tỉ lệ quy ước để dễ quan sát. Nhóm cần biên bản giáo viên GDQP-AN duyệt các bộ phận, thứ tự thao tác và tư thế trước khi gọi là chuẩn.”

### 8. Mô-đun tháo lắp AK có cho học sinh tự thao tác không?

**Trả lời mẫu:** “Chưa. Hiện học sinh chọn bộ phận và mốc bước; model chạy animation đến thời điểm tương ứng, có thể tự phát tuần tự. Đây là mô phỏng quan sát có hướng dẫn, chưa phải bài kéo-thả hoặc hệ thống kiểm tra học sinh lắp đúng thứ tự.”

### 9. Tại sao code nói 6 bước tháo/lắp trong khi một số nội dung nhắc 8 bước?

**Trả lời mẫu:** “Đây là điểm nhóm phải chuẩn hóa cùng giáo viên. Module hiện dùng 6 nhóm animation, trong khi dữ liệu cũ và prompt AI có chỗ mô tả 8 bước chính. Chúng em không nên giải thích bằng suy đoán; cần xác định quy ước gộp bước và sửa nội dung ở phiên bản sau.”

### 10. Trường bắn có mô phỏng đúng đạn đạo AK không?

**Trả lời mẫu:** “Không. Đây là game ngắm bắn trực quan: tia ngắm 3D cắt mặt phẳng bia để tính điểm, có dao động và giật mô phỏng. Code không tính vận tốc đầu đạn, trọng lực, gió hay hiệu chỉnh thước ngắm; bia còn được phóng đại để nhìn rõ. Vì vậy không dùng để dự đoán kết quả bắn thật.”

### 11. Vì sao bia ở 200 m vẫn nhìn rõ?

**Trả lời mẫu:** “Hệ thống nhân kích thước hiển thị của bia theo cự ly: các hệ số 4, 7, 9 và 11. Đây là hỗ trợ thị giác cho màn hình, không phải kích thước thật. Tỷ lệ hình dạng và thuật toán điểm dùng cùng kích thước hiển thị để nhất quán trong game.”

### 12. WebAR có nhận biết mặt bàn và giữ mô hình tại một vị trí thật không?

**Trả lời mẫu:** “Chưa. Phiên bản hiện tại mở camera làm nền rồi vẽ model 3D trong một Canvas trong suốt; người dùng tự chỉnh kích thước, góc và cao độ. Chưa có WebXR hit-test, nhận diện mặt phẳng hoặc neo không gian, nên chúng em gọi chính xác là chế độ AR giả lập/camera overlay.”

### 13. AI Pose hoạt động theo luồng nào?

**Trả lời mẫu:** “Camera được xử lý tại thiết bị. MediaPipe tìm 33 điểm cơ thể; hệ thống kiểm tra ánh sáng, đủ toàn thân, một người và độ tin cậy, sau đó hiệu chỉnh theo tỷ lệ cơ thể. Các góc và khoảng cách chuẩn hóa được so với rubric có trọng số để tạo điểm và góp ý.”

### 14. Đây có thật sự là AI hay chỉ là công thức?

**Trả lời mẫu:** “Phần phát hiện keypoint dùng mô hình học máy MediaPipe đã huấn luyện sẵn. Phần chấm của nhóm là luật hình học và rubric có trọng số, không phải mô hình nhóm tự huấn luyện. Cách tách này giúp giải thích được tiêu chí, nhưng độ đúng của ngưỡng vẫn phải kiểm định.”

### 15. Pose hiện chấm được bao nhiêu động tác?

**Trả lời mẫu:** “Code hiện cho phép bốn động tác: đứng nghiêm, đứng nghỉ, quay trái và quay phải. Quay đằng sau và chào được hiển thị là ‘sắp ra mắt’ và không có definition chấm. Nhóm không nên nói hệ thống đã chấm toàn bộ điều lệnh.”

### 16. Độ chính xác Pose là bao nhiêu? `🔴 CẦN SỐ LIỆU`

**Trả lời mẫu:** “Chúng em chưa có đủ dữ liệu để công bố phần trăm chính xác. 36 test kỹ thuật đã qua nhưng dùng fixture/khung xương tổng hợp, chứng minh logic chứ không đại diện người thật. Cần giáo viên gán nhãn video, thử nhiều người và báo cáo sai số điểm hoặc mức đồng thuận với giáo viên.”

### 17. Pose có đánh giá được ngón tay, ánh mắt và cách đặt chân chính xác không?

**Trả lời mẫu:** “Không đầy đủ. MediaPipe Pose cho mốc cơ thể lớn; hệ thống chỉ xấp xỉ độ mở bàn chân qua chiếu 2D và không đo chính xác ngón tay hay hướng mắt. Vì vậy phản hồi là hỗ trợ tư thế tổng quát, không thay cho quan sát chi tiết của giáo viên.”

### 18. Camera của học sinh có được gửi lên máy chủ không?

**Trả lời mẫu:** “Theo code Pose hiện tại, frame camera được xử lý bằng MediaPipe/WASM trong trình duyệt và không có lệnh upload frame hoặc landmark. Khi rời trang, session bị giải phóng và điểm chỉ nằm trong state. Tuy nhiên chatbot và nội dung tự luận là dữ liệu văn bản được gửi đến backend/Gemini.”

### 19. Test Pose đã chứng minh chạy tốt trên người thật chưa?

**Trả lời mẫu:** “Chưa. Test bao phủ hình học, lọc confidence, quality gate, chuỗi trạng thái, hướng quay và worker; browser smoke chỉ kiểm tra model khởi tạo và từ chối ảnh trống. Tài liệu kỹ thuật cũng ghi rõ chưa xác nhận độ chính xác trên người thật.”

### 20. Trợ giảng lấy kiến thức từ đâu?

**Trả lời mẫu:** “Backend gửi Gemini một prompt mô tả vai trò và liệt kê nhóm chủ đề, cộng lịch sử hội thoại. Nó chưa truy xuất trực tiếp từ các file bài học hoặc PDF trong repository. Vì vậy chúng em không gọi đây là chatbot RAG theo SGK; câu trả lời vẫn cần học sinh đối chiếu nguồn và giáo viên.”

### 21. Làm sao ngăn AI trả lời sai hoặc bịa?

**Trả lời mẫu:** “Hiện mới có giới hạn chủ đề bằng prompt và yêu cầu trả lời sư phạm, chưa có citation, retrieval hay bộ kiểm chứng fact. Giải pháp đang ở mức thử nghiệm. Hướng tiếp theo là kho nguồn đã duyệt, trích dẫn đoạn liên quan, bộ câu hỏi đánh giá và cơ chế báo câu trả lời đáng ngờ.”

### 22. AI chấm tự luận có công bằng không?

**Trả lời mẫu:** “Chưa thể xem là điểm chính thức. Nút AI chỉ trả nhận xét sơ bộ; điểm khi nộp hiện được ước tính theo độ dài bài, nên không đánh giá đúng nội dung. Nhóm phải nói rõ giáo viên chấm cuối cùng và cần bộ bài mẫu đã được giáo viên chấm để đánh giá độ lệch.”

### 23. Ngân hàng câu hỏi có bao nhiêu và đã được ai duyệt? `🔴 CẦN XÁC NHẬN`

**Trả lời mẫu:** “Quiz nhanh có 144 câu. Kho thi có 120 câu ABCD, 30 cụm Đúng/Sai và 18 câu tự luận. Repository chứng minh số lượng và đáp án hard-code, nhưng không có biên bản thẩm định; nhóm cần danh sách nguồn và xác nhận của giáo viên trước khi tuyên bố đã chuẩn hóa.”

### 24. Có thể gọi đề thi là ‘chuẩn Bộ GD&ĐT’ không?

**Trả lời mẫu:** “Chưa nên gọi như vậy nếu chưa đưa ra văn bản và ma trận áp dụng cho môn GDQP-AN. Code dùng cấu trúc ba phần và thang Đúng/Sai theo quy ước đã cài, nhưng nhãn giao diện không phải bằng chứng pháp lý. Cách an toàn là ‘đề mô phỏng ba phần’.”

### 25. Học sinh có thể sửa điểm gửi lên server không?

**Trả lời mẫu:** “Trong phiên bản Express hiện tại, có rủi ro đó. Server lấy danh tính từ session nhưng vẫn tin các trường điểm và chi tiết do client gửi. Vì vậy dashboard chỉ phù hợp demo/theo dõi tham khảo; muốn dùng thật phải gửi đáp án gốc và chấm lại hoàn toàn ở server.”

### 26. Dữ liệu nào lưu trên máy, dữ liệu nào lưu máy chủ?

**Trả lời mẫu:** “XP, huy hiệu, bài đã đọc, quiz, chat và tối đa 10 lịch sử thi nằm trong localStorage của từng trình duyệt. Khảo sát và tài khoản lưu ở JSON/D1/Blobs tùy backend. Kết quả thi chỉ lưu server khi chạy Express và đăng nhập; Cloudflare Worker hiện chưa có API này.”

### 27. Hệ thống tài khoản có an toàn không?

**Trả lời mẫu:** “Có các điểm tốt như scrypt, salt, cookie HttpOnly và kiểm tra vai trò. Nhưng backend Express còn PIN quản trị hard-code, session nằm trong RAM và có ba cách triển khai khác nhau. Vì vậy chưa được xem là bảo mật sản xuất; nhóm cần loại bỏ cơ chế khôi phục cứng và audit trước khi dùng thật.”

### 28. Tại sao demo public có thể không chạy chatbot hoặc lưu điểm thi?

**Trả lời mẫu:** “Cấu hình Worker hiện chỉ triển khai API khảo sát/tài khoản và phục vụ file tĩnh. Các route AI và exam chỉ có trong Express local. Trước buổi bảo vệ nhóm phải chọn đúng môi trường, thử toàn bộ luồng trên chính URL demo và không tuyên bố đồng bộ cloud nếu endpoint chưa được triển khai.”

### 29. XP và bảng xếp hạng có phản ánh người dùng thật không?

**Trả lời mẫu:** “XP hiện là dữ liệu cục bộ theo trình duyệt và còn một số chỗ chỉ hiện thông báo nhưng không cộng thật. Bảng xếp hạng là 10 dòng mock hard-code. Nhóm có thể demo cơ chế tạo động lực, nhưng không gọi đó là bảng thành tích toàn trường hoặc dữ liệu người dùng thật.”

### 30. Dự án đã chứng minh hiệu quả và sẵn sàng triển khai toàn trường chưa? `🔴 CẦN SỐ LIỆU`

**Trả lời mẫu:** “Chưa. Repository chứng minh nguyên mẫu kỹ thuật và công cụ thu thập dữ liệu, không chứng minh tác động giáo dục hoặc khả năng vận hành quy mô lớn. Trước khi kết luận, nhóm cần số mẫu trước–sau, tỷ lệ hoàn thành, lỗi thiết bị, tải hệ thống, phản hồi giáo viên và giới hạn nghiên cứu.”

---

## 7. Danh sách số liệu/minh chứng bắt buộc nên chuẩn bị

1. Số học sinh và giáo viên tham gia; lớp/khối; cách chọn mẫu; số phản hồi trước, sau và ghép cặp hợp lệ.
2. Một bài kiểm tra kiến thức trước–sau giống nhau hoặc tương đương; điểm trung bình, độ lệch chuẩn, chênh lệch và cách tính.
3. Nếu so sánh 3D với video/hình: thiết kế nhóm, thời lượng học, cùng nội dung/cùng đề, tiêu chí loại dữ liệu.
4. Pose: số người, số video, số động tác đúng/sai do giáo viên gán nhãn, điều kiện sáng/góc/quần áo/thiết bị; báo cáo độ lệch điểm hoặc tỷ lệ đồng thuận.
5. Hiệu năng: ít nhất 3 mức thiết bị, thời gian tải lần đầu, FPS 3D/Pose, RAM, tỷ lệ crash/không cấp camera.
6. Bảng nguồn học liệu/câu hỏi/rubric và chữ ký/xác nhận của giáo viên GDQP-AN.
7. Nhật ký chạy thử trên chính URL public: route học liệu, model, Pose, chatbot, chấm tự luận, khảo sát, thi và dashboard.
8. Nguồn/bản quyền của model, PDF, video YouTube, ảnh và nội dung 360°.
9. Chính sách dữ liệu: mục đích thu, đồng thuận, ai xem, thời hạn lưu, cách xóa và cách ẩn danh báo cáo.
10. Bảng so sánh 3–5 giải pháp liên quan theo tiêu chí có thể kiểm chứng; không dùng câu “đầu tiên trên thị trường” nếu chưa chứng minh.

---

## 8. Bảng “Điều nên nói / Điều không nên nói”

| Điều nên nói | Điều không nên nói |
|---|---|
| “Đây là nguyên mẫu tích hợp đang được kiểm thử.” | “Sản phẩm đã hoàn thiện 100% và sẵn sàng triển khai toàn trường.” |
| “Repository có 31 bài học chi tiết cho lớp 10–12.” | “Website đang số hóa toàn bộ SGK/PDF.” |
| “3D hỗ trợ quan sát đa góc và theo dõi animation.” | “3D chắc chắn giúp tăng kết quả học tập.” |
| “AK tháo/lắp là animation có mốc hướng dẫn.” | “Học sinh đang tự tháo lắp vật thể 3D như thật.” |
| “Trường bắn là game ngắm bắn trực quan.” | “Mô phỏng chính xác đạn đạo và kết quả bắn AK ngoài đời.” |
| “WebAR hiện là camera overlay với điều chỉnh thủ công.” | “Mô hình tự nhận diện và bám chính xác mặt bàn/sàn.” |
| “MediaPipe phát hiện keypoint; nhóm chấm bằng rubric hình học.” | “Nhóm đã tự huấn luyện AI nhận diện tư thế.” |
| “Pose hỗ trợ tham khảo; giáo viên quyết định.” | “AI chấm đúng tuyệt đối và thay thế giáo viên.” |
| “Bốn động tác Pose đang khả dụng.” | “AI chấm được toàn bộ điều lệnh và kỹ năng quân sự.” |
| “Test thuật toán hiện có đạt 36/36.” | “36 test chứng minh độ chính xác trên mọi học sinh.” |
| “Chatbot dùng Gemini và prompt giới hạn chủ đề.” | “Chatbot tra cứu trực tiếp SGK và không thể trả lời sai.” |
| “AI tự luận đưa nhận xét thử; điểm cuối hiện còn heuristic.” | “AI đang chấm tự luận khách quan, chính xác.” |
| “Quiz nhanh có 144 câu; kho thi có 120 MCQ, 30 cụm Đ/S, 18 tự luận.” | “Ngân hàng đã được Bộ/giáo viên thẩm định” nếu không có hồ sơ. |
| “Tiến độ và XP hiện lưu trên từng trình duyệt.” | “Mọi tiến độ đã đồng bộ cloud theo tài khoản.” |
| “Bảng xếp hạng hiện là dữ liệu minh họa.” | “Đây là xếp hạng thật của học sinh toàn trường.” |
| “Khảo sát có công cụ trước–sau và dashboard.” | “Khảo sát đã chứng minh dự án hiệu quả” khi mẫu chưa đủ. |
| “Bản public cần được kiểm tra endpoint trước buổi demo.” | “Mọi chức năng local đều chắc chắn chạy trên workers.dev.” |
| “Một số nội dung dùng dịch vụ ngoài như YouTube/Maps/Gemini.” | “Sản phẩm hoàn toàn offline và không phụ thuộc bên thứ ba.” |
| “Tính mới là cách tích hợp chuyên biệt trong sản phẩm của nhóm.” | “Đây là sản phẩm đầu tiên/duy nhất trên thị trường.” |
| “Các giới hạn đã được xác định và có kế hoạch kiểm thử.” | Né tránh lỗi hoặc biến hạn chế kỹ thuật thành kết quả đã đạt. |

---

## 9. Đoạn thuyết trình 3D gợi ý (khoảng 60–75 giây)

> Phần 3D của nhóm không chỉ hiển thị một hình xoay. Với mô hình AK, học sinh có thể chọn 17 mục cấu tạo, phóng gần bộ phận và theo dõi 6 mốc tháo, 6 mốc lắp bằng animation. Thao trường 3D có model địa hình và 11 clip chiến sĩ để quan sát điều lệnh, vận động và góc nhìn khác nhau. Ngoài ra còn có ba mô phỏng kỹ năng riêng và trường bắn dạng game. Nhóm xác định rõ giới hạn: tháo lắp hiện là hướng dẫn quan sát, trường bắn không phải đạn đạo thật, và độ đúng chuyên môn của animation vẫn cần giáo viên thẩm định. Mục tiêu hiện tại là hỗ trợ học sinh hình dung trước khi thực hành trực tiếp, không thay thế thao trường hay giáo viên.

---

## 10. Checklist trước ngày bảo vệ

- [ ] Chọn đúng URL/môi trường demo; thử lại chatbot, essay, exam server và khảo sát trên chính URL đó.
- [ ] Chuẩn bị video quay màn hình dự phòng cho 3D/Pose khi mạng hoặc camera lỗi.
- [ ] Không mở bảng xếp hạng như dữ liệu thật.
- [ ] Không dùng cụm “chuẩn Bộ”, “chính xác”, “hiệu quả” nếu thiếu tài liệu/số liệu kèm theo.
- [ ] Có giáo viên GDQP-AN xác nhận nội dung, animation, rubric và ngân hàng câu hỏi.
- [ ] Chuẩn bị bảng thiết bị và số liệu Pose/hiệu năng.
- [ ] Chuẩn bị sơ đồ dữ liệu: cái gì localStorage, cái gì server, cái gì gửi Gemini.
- [ ] Tránh trình diễn đổi mật khẩu trên backend Express hiện tại.
- [ ] Mỗi thành viên nắm một phần nhưng đều biết bốn giới hạn lớn ở mục 0.
- [ ] Khi không chắc, trả lời đúng câu: “Phần đó repository chưa chứng minh; nhóm xin ghi nhận và sẽ xác nhận bằng thử nghiệm.”

---

## 11. Dấu vết mã nguồn chính để đối chiếu

- Điều hướng: `src/App.tsx:80–154`, `src/App.tsx:692–781`
- Học liệu: `src/components/TheorySection.tsx:31–143`, `src/data/lessonsDetail.ts`, `src/data/lessonsDetailGrade*.ts`
- Quiz: `src/components/QuizSection.tsx`, `src/data/quiz.ts`
- Kho thi: `src/data/questionBank.ts`, `src/utils/examEngine.ts:84–223`, `src/utils/examEngine.ts:288–488`
- API thi: `server/exam.ts`; quản trị: `src/components/exam/ExamAdminSection.tsx`
- AK 3D: `src/components/SimulationSection.tsx`, `src/components/AK47Simulation.tsx`, `src/data/ak47StructureData.ts`
- Thao trường: `src/components/training/Tactical3DSimulation.tsx`, `animationController.ts`, `TrainingGroundModel.tsx`
- Kỹ năng: `src/data/practicalSkills.ts`, `src/components/training/StepByStepModule.tsx`
- Trường bắn: `src/components/ShootingRangeSection.tsx`, `ShootingRange3D.tsx`, `ArcadeRangeSection.tsx`; giới hạn được ghi trong `docs/akm-range-3d.md`
- Pose: `src/features/pose-analysis/`; giới hạn và test trong `docs/pose-analysis.md`
- AI: `server.ts:31–162`, `src/components/AiBotSection.tsx`, `FloatingAiChatbot.tsx`
- Gamification: `src/gamification.ts`, `src/context/GamificationContext.tsx`
- Khảo sát: `src/components/SurveySection.tsx`, `SurveyAdminSection.tsx`, `server/survey.ts`, `cloudflare/worker.ts`
- Triển khai Cloudflare: `wrangler.jsonc`, `cloudflare/worker.ts:265–278`
- Tài khoản: `server/auth.ts`; Cloudflare tương ứng trong `cloudflare/worker.ts`

