$ErrorActionPreference='Stop'
$root='D:\GDQP-WEBSITE - Copy\docs'
$assets=Join-Path $root 'presentation_assets'
$output=Join-Path $root 'HOC_QPAN_3D_LY_DO_CHUC_NANG_KY_THUAT.pptx'
$renders=Join-Path $assets 'slides'
[IO.Directory]::CreateDirectory($renders)|Out-Null
Add-Type -AssemblyName System.Drawing
function RGB([string]$hex){return [Convert]::ToInt32($hex.Substring(0,2),16)+256*[Convert]::ToInt32($hex.Substring(2,2),16)+65536*[Convert]::ToInt32($hex.Substring(4,2),16)}
$navy=RGB '102D47';$teal=RGB '007E87';$red=RGB 'D23C50';$bg=RGB 'F4F7FA';$ink=RGB '18354B';$muted=RGB '526778';$white=RGB 'FFFFFF';$pale=RGB 'E5F1F3'
$app=New-Object -ComObject PowerPoint.Application
$p=$app.Presentations.Add(0)
$p.PageSetup.SlideWidth=960;$p.PageSetup.SlideHeight=540
$script:n=0
function Box($s,$x,$y,$w,$h,$color){$q=$s.Shapes.AddShape(1,$x,$y,$w,$h);$q.Fill.ForeColor.RGB=$color;$q.Line.Visible=0;return $q}
function Txt($s,[string]$text,$x,$y,$w,$h,$size=20,$color=$ink,$bold=$false){
 $q=$s.Shapes.AddTextbox(1,$x,$y,$w,$h);$f=$q.TextFrame;$f.MarginLeft=0;$f.MarginRight=0;$f.MarginTop=0;$f.MarginBottom=0;$f.WordWrap=-1
 $f.TextRange.Text=$text;$f.TextRange.Font.Name='Arial';$f.TextRange.Font.Size=$size;$f.TextRange.Font.Color.RGB=$color;$f.TextRange.Font.Bold=([int]$bold)*-1
 $f.TextRange.ParagraphFormat.SpaceAfter=8
 return $q
}
function Note($s,[string]$text){$s.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text=$text}
function Slide([string]$part,[string]$title,[string]$sub,[string]$source){
 $script:n++;$s=$p.Slides.Add($script:n,12);$s.FollowMasterBackground=0;$s.Background.Fill.ForeColor.RGB=$bg
 [void](Box $s 0 0 960 8 $teal);[void](Txt $s $part 36 24 870 20 11 $teal $true)
 [void](Txt $s $title 36 53 888 63 30 $navy $true)
 if($sub){[void](Txt $s $sub 36 117 888 44 16 $muted)}
 [void](Box $s 36 505 888 1 (RGB 'D5DFE7'))
 [void](Txt $s ('HỌC QPAN 3D  •  '+$source) 36 515 835 16 9 $muted)
 [void](Txt $s ('{0:00}' -f $script:n) 895 513 28 20 12 $teal $true)
 return $s
}
function Card($s,$x,$y,$w,$h,[string]$label,[string]$body,$size=19){
 [void](Box $s $x $y $w $h $white);[void](Box $s $x $y 4 $h $teal)
 [void](Txt $s $label ($x+18) ($y+16) ($w-36) 45 21 $navy $true)
 [void](Txt $s $body ($x+18) ($y+68) ($w-36) ($h-78) $size $ink)
}
function Banner($s,[string]$t,$y=459){[void](Box $s 36 $y 888 34 $pale);[void](Txt $s $t 48 ($y+8) 864 25 13 $teal $true)}
function Pic($s,[string]$file,$x,$y,$w,$h){
 $path=Join-Path $assets $file;$im=[Drawing.Image]::FromFile($path);$r=[Math]::Min($w/$im.Width,$h/$im.Height);$iw=$im.Width*$r;$ih=$im.Height*$r;$im.Dispose()
 [void]($s.Shapes.AddPicture($path,0,-1,($x+($w-$iw)/2),($y+($h-$ih)/2),$iw,$ih))
}
function Step($s,$x,$y,$w,[string]$num,[string]$title,[string]$body){
 [void](Box $s $x $y $w 205 $white);[void](Txt $s $num ($x+14) ($y+12) ($w-28) 42 28 $teal $true)
 [void](Txt $s $title ($x+14) ($y+66) ($w-28) 54 21 $navy $true)
 [void](Txt $s $body ($x+14) ($y+129) ($w-28) 69 16 $muted)
}
try {
 $s=Slide 'ĐỀ TÀI NGHIÊN CỨU KHOA HỌC KỸ THUẬT • 2026' 'HỌC QPAN 3D' 'Website hỗ trợ học tập lý thuyết và thực hành môn GDQP-AN' 'Dựa trên báo cáo DOCX do nhóm cung cấp'
 [void](Txt $s 'Ứng dụng tái tạo 3D và AI tạo sinh' 36 174 470 74 27 $navy $true)
 [void](Txt $s "Lê Trọng Phúc • 12C3`nNguyễn Anh Khôi • 12C7`nTrường TH–THCS–THPT Tân Phú" 36 269 470 95 19 $ink)
 Pic $s 'doc_image6.png' 528 178 396 230
 [void](Txt $s 'Ảnh giao diện sản phẩm trong báo cáo' 534 413 390 20 11 $muted)
 Banner $s '01  Lý do chọn đề tài     →     02  Chức năng sản phẩm     →     03  Kỹ thuật thực hiện'
 Note $s 'Kính thưa Ban giám khảo, nhóm chúng em trình bày dự án Học QPAN 3D, ứng dụng tái tạo 3D và AI tạo sinh để hỗ trợ học tập lý thuyết và thực hành môn GDQP-AN. Phần trình bày đi theo ba ý: vì sao chọn đề tài, sản phẩm có những chức năng gì, và nhóm thực hiện các chức năng đó bằng công nghệ nào. Tên tác giả trên slide được lấy theo báo cáo DOCX mới nhất do nhóm cung cấp.'

 $s=Slide '01 / LÝ DO CHỌN ĐỀ TÀI' 'Từ nhu cầu quan sát đến nhu cầu tự học' 'GDQP-AN kết hợp kiến thức lý thuyết với nội dung thực hành theo trình tự.' 'Báo cáo §1.1–1.2'
 Card $s 36 183 280 255 'Khó quan sát đa góc' 'Hình tĩnh và video khó cho người học tự chọn góc nhìn, phóng to chi tiết và xem riêng từng bước.'
 Card $s 340 183 280 255 'Công cụ còn rời rạc' 'Bài học, câu hỏi, video, mô hình 3D và công cụ hỏi đáp thường nằm ở nhiều nơi.'
 Card $s 644 183 280 255 'Cần nơi tự ôn tập' 'Học sinh cần xem lại kiến thức và thao tác trước hoặc sau giờ học, trên thiết bị quen thuộc.'
 Banner $s 'Mục tiêu: tạo một luồng học thống nhất, truy cập trực tiếp trên trình duyệt.'
 Note $s 'Lý do chọn đề tài xuất phát từ đặc thù môn học có cả lý thuyết và thực hành. Hình ảnh, video hỗ trợ tốt nhưng người học khó tự đổi góc nhìn hoặc chọn một bộ phận để quan sát kỹ. Đồng thời, học liệu và công cụ ôn tập còn rời rạc. Nhóm muốn đưa các hoạt động này vào một website để học sinh tự ôn thuận tiện hơn. Đây là nhu cầu thiết kế của đề tài, không phải kết luận đã khảo sát toàn bộ thị trường.'

 $s=Slide '01 / LÝ DO CHỌN ĐỀ TÀI' 'Giải pháp: học – quan sát – luyện tập' 'Đối tượng chính: học sinh THPT lớp 10–12; giáo viên dùng để minh họa và hướng dẫn.' 'Báo cáo §2.1–2.2; §4.4'
 Step $s 36 186 270 '01' 'Học kiến thức' 'Chọn khối lớp, đọc bài và củng cố bằng câu hỏi.'
 Step $s 345 186 270 '02' 'Quan sát 3D' 'Xoay mô hình, chọn chi tiết và xem thao tác theo bước.'
 Step $s 654 186 270 '03' 'Luyện và phản hồi' 'Làm quiz, thi thử, thử Pose và gửi khảo sát.'
 [void](Txt $s '→' 312 256 35 40 28 $teal $true);[void](Txt $s '→' 622 256 35 40 28 $teal $true)
 Banner $s 'Vai trò: hỗ trợ tự học và chuẩn bị thực hành; thực hành thật vẫn cần giáo viên hướng dẫn.'
 Note $s 'Giải pháp của nhóm là kết nối ba hoạt động: học kiến thức, quan sát mô hình và luyện tập có phản hồi. Giáo viên có thể trình chiếu mô hình, còn học sinh dùng để xem trước hoặc ôn lại. Tính đóng góp được trình bày ở cách tích hợp và điều khiển mô hình theo bước trong bối cảnh GDQP-AN. Nhóm chưa khẳng định đây là sản phẩm đầu tiên hay duy nhất trên thị trường.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' '12 mô-đun dành cho người học' 'Gom theo trải nghiệm để dễ giới thiệu; mức hoàn thiện của từng mô-đun khác nhau.' 'Báo cáo tóm tắt; §4.2–4.3'
 Card $s 36 180 426 131 'Học và luyện kiến thức' "01 Lý thuyết   •   02 Quiz nhanh`n03 Thi thử   •   04 Kỹ năng / thao trường 3D" 17
 Card $s 486 180 438 131 'Quan sát và mô phỏng' "05 Tháo/lắp AK   •   06 Studio / WebAR`n07 Trường bắn mô phỏng" 17
 Card $s 36 328 426 119 'AI hỗ trợ' '08 AI Pose   •   09 Trợ giảng AI' 18
 Card $s 486 328 438 119 'Khám phá và phản hồi' "10 Bản đồ   •   11 XP / huy hiệu`n12 Khảo sát" 17
 Banner $s 'Bảng kỹ thuật có 13 phân hệ do tách “Kỹ năng” và “Thao trường 3D”; không tính trang chủ/quản trị.'
 Note $s 'Sản phẩm được báo cáo là 12 mô-đun người học. Em gom thành bốn nhóm để dễ theo dõi: học và luyện kiến thức; quan sát mô phỏng; AI hỗ trợ; khám phá và phản hồi. Trong bảng kỹ thuật, phần kỹ năng và thao trường 3D được tách riêng nên có 13 phân hệ. Hai con số là hai cách phân loại, không phải hai quy mô khác nhau. Trang chủ và các màn hình quản trị không được tính thành mô-đun người học ở đây.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' 'Học liệu, quiz nhanh và thi thử' 'Luồng sử dụng: chọn khối → đọc bài / chọn đề → trả lời → xem kết quả và ôn lại.' 'Báo cáo §4.2.1; §4.3'
 Pic $s 'doc_image7.png' 36 186 450 251
 Card $s 510 177 414 266 'Dữ liệu đã có' "31 bài lý thuyết lớp 10–12.`n144 câu quiz nhanh: 48 câu/khối.`nKho thi: 120 trắc nghiệm + 30 cụm Đúng/Sai + 18 tự luận.`nCó xáo đề, đếm giờ và khôi phục cục bộ." 17
 Banner $s 'Tự luận chỉ chấm ước lượng; lưu bài thi qua API còn phụ thuộc môi trường backend.'
 Note $s 'Nhóm học tập có 31 bài lý thuyết và 144 câu quiz nhanh, chia đều 48 câu cho mỗi khối. Kho thi gồm 120 câu trắc nghiệm, 30 cụm Đúng/Sai và 18 câu tự luận. Học sinh chọn khối, làm bài và xem phản hồi để ôn lại. Cần phân biệt kho câu hỏi với số câu trong một đề. Điểm tự luận hiện chỉ mang tính gợi ý; API lưu bài thi chưa có trên Worker công khai theo báo cáo.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' 'Kỹ năng và mô phỏng 3D tương tác' 'Quan sát theo bước, thay đổi góc nhìn và tập trung vào chi tiết cần học.' 'Báo cáo §4.2; §4.2.2'
 Pic $s 'doc_image8.png' 36 177 270 196;Pic $s 'doc_image9.png' 345 177 270 196;Pic $s 'doc_image10.png' 654 177 270 196
 [void](Txt $s 'Thao trường / điều lệnh' 36 383 280 27 19 $navy $true)
 [void](Txt $s 'Vận động theo bước' 345 383 280 27 19 $navy $true)
 [void](Txt $s 'Cấu tạo và tháo/lắp AK' 654 383 280 27 19 $navy $true)
 [void](Txt $s 'Đội ngũ, vận động, địa vật; la bàn ở mức nguyên mẫu.' 36 416 280 43 15 $muted)
 [void](Txt $s '7 nhóm kỹ năng / 14 bước; video, checklist và câu hỏi.' 345 416 280 43 15 $muted)
 [void](Txt $s '11 nhóm chi tiết; 6 bước tháo và 6 bước lắp.' 654 416 270 43 15 $muted)
 Note $s 'Phần 3D cho phép người học chủ động đổi góc nhìn và xem thao tác theo bước. Báo cáo ghi nhận 7 nhóm kỹ năng với 14 bước, kết hợp video và checklist. Thao trường thể hiện đội ngũ, vận động và địa vật; phần la bàn còn là nguyên mẫu. Với mô hình AK, hệ thống có chọn nhóm chi tiết và điều khiển trình tự tháo lắp. Đây là minh họa học tập; độ đúng chuyên môn của tư thế và trình tự vẫn cần giáo viên thẩm định.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' 'AI Pose: phản hồi tư thế qua camera' 'Mức hiện tại: beta; chưa có kiểm định độ chính xác trên mẫu người thật.' 'Báo cáo §4.2.2–4.2.3'
 Card $s 36 183 426 252 'Nội dung luyện tập' "5 bài riêng: nghiêm, nghỉ, quay trái, quay phải và chào.`nMột chuỗi: Nghiêm → Nghỉ → Chào.`nQuay đằng sau chưa khả dụng." 20
 Card $s 486 183 438 252 'Học sinh sử dụng thế nào?' "Chọn bài → bật camera → đứng vào khung hình.`nHệ thống kiểm tra chất lượng rồi mới đánh giá.`nNhận điểm và góp ý theo tiêu chí." 20
 Banner $s 'Điểm Pose là phản hồi hỗ trợ; chưa dùng thay cho đánh giá chuyên môn của giáo viên.'
 Note $s 'AI Pose hiện có năm bài riêng và một chuỗi ba động tác. Người học chọn bài, cho phép dùng camera và đứng trong khung hình. Hệ thống kiểm tra dữ liệu quan sát trước khi tạo phản hồi theo tiêu chí. Chúng em công khai rằng chức năng này ở mức beta, chưa có nghiên cứu kiểm định trên mẫu người thật. Vì vậy không thể lấy điểm Pose làm điểm thực hành chính thức hoặc nói rằng AI chấm chính xác tuyệt đối.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' 'Studio / WebAR và trường bắn' 'Hai hình thức trải nghiệm trực quan, có giới hạn mô phỏng rõ ràng.' 'Báo cáo §3.2.1; §4.2'
 Card $s 36 183 426 254 'Studio / WebAR — nguyên mẫu' "Chọn hoặc tải mô hình GLB.`nCấp quyền camera để ghép mô hình lên hình ảnh thật.`nCó chụp PNG và QR.`nChưa có neo mô hình vào mặt phẳng bằng WebXR." 19
 Card $s 486 183 438 254 'Trường bắn — mô phỏng học tập' "Có bia 4/6/8, ngắm và trò chơi.`nCó đồ thị đạn đạo minh họa.`nDùng để quan sát và luyện tương tác; số liệu và mô hình vẫn cần thẩm định chuyên môn." 19
 Banner $s 'WebAR cần HTTPS và quyền camera; kết quả mô phỏng không đại diện cho thực hành bắn thật.'
 Note $s 'Studio và WebAR cho phép xem mô hình, tải GLB và ghép cảnh 3D lên video camera. Cần nói đúng đây là ghép hình, chưa có khả năng nhận mặt phẳng và neo không gian như một hệ AR hoàn chỉnh. Trường bắn là mô phỏng phục vụ học tập, có bia, ngắm, trò chơi và đồ thị minh họa. Nhóm chưa có bằng chứng để tuyên bố các kết quả này mô tả chính xác toàn bộ điều kiện bắn thật.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' 'Trợ giảng AI, bản đồ và động lực học' 'Các tiện ích bổ sung cho hành trình tự học.' 'Báo cáo §4.2.3'
 Card $s 36 181 280 257 'Trợ giảng AI' "Chat, gợi ý và lịch sử.`nGemini qua backend Express.`nWorker công khai chưa có API chat; chưa truy xuất bài học/PDF hoặc trích dẫn." 18
 Card $s 340 181 280 257 'Bản đồ di tích' "6 di tích lịch sử.`nCó marker, lớp bản đồ, nội dung và tour.`nChức năng ghi lượt ghé chưa hoàn thiện." 18
 Card $s 644 181 280 257 'XP và huy hiệu' "8 cấp bậc, 11 huy hiệu.`nTiến độ và XP lưu tại trình duyệt.`nBảng xếp hạng là mẫu; một số luồng XP chưa nhất quán." 18
 Banner $s 'Trợ giảng tạo sinh có thể trả lời sai; cần đối chiếu tài liệu và giáo viên.'
 Note $s 'Ba tiện ích bổ sung gồm trợ giảng, bản đồ và gamification. Trợ giảng dùng Gemini qua Express, nhưng trên Worker công khai route chat chưa triển khai; cũng chưa có truy hồi bài học hoặc PDF để trích dẫn. Bản đồ có sáu di tích và tour. Gamification có cấp bậc, huy hiệu và XP cục bộ, nhưng bảng xếp hạng vẫn là dữ liệu mẫu. Các giới hạn này cần nói rõ khi demo.'

 $s=Slide '02 / CHỨC NĂNG SẢN PHẨM' 'Khảo sát và thống kê trải nghiệm' 'Luồng: học sinh / giáo viên trả lời → lưu phản hồi → ghép cặp → xem và xuất thống kê.' 'Báo cáo §4.2.4; ảnh ngày 21/09/2026'
 Pic $s 'doc_image12.jpg' 36 177 481 272
 Card $s 540 177 384 272 'Chức năng đã có' "Biểu mẫu học sinh và giáo viên.`nTài khoản phân vai.`nGhép cặp trước–sau, lọc theo khối và biểu đồ Likert.`nXuất Excel / CSV và in báo cáo." 19
 Banner $s 'Số liệu khảo sát được dùng để mô tả trải nghiệm và xác định hướng cải tiến.'
 Note $s 'Khảo sát là một chức năng của hệ thống, tách biểu mẫu học sinh và giáo viên. Quản trị viên có thể ghép hai phản hồi của cùng người trước và sau trải nghiệm, lọc theo khối và xuất báo cáo. Phần này giúp nhóm thu thập góp ý và thống kê mô tả. Các con số kết quả ở phần sau được lấy theo mốc ngày 21 tháng 9 năm 2026 trong báo cáo, không được coi là số người dùng trực tuyến hiện tại.'

 $s=Slide '03 / KỸ THUẬT THỰC HIỆN' 'Kiến trúc: bốn lớp phối hợp' 'Giao diện điều phối trải nghiệm; chức năng gọi dữ liệu, mô hình hoặc dịch vụ phù hợp.' 'Báo cáo §3.1–3.2'
 Card $s 36 181 426 123 '1. Giao diện' 'React + TypeScript; Tailwind và Motion.' 18
 Card $s 486 181 438 123 '2. Học tập – đánh giá' 'Bài học, quiz, đề thi, kỹ năng và XP.' 18
 Card $s 36 325 426 123 '3. 3D và Pose' 'Three.js / R3F / Drei; MediaPipe + rubric.' 18
 Card $s 486 325 438 123 '4. Dịch vụ – dữ liệu' 'Express, Worker / D1, Gemini và localStorage.' 18
 Banner $s 'Hai môi trường backend hiện chưa hỗ trợ hoàn toàn giống nhau.'
 Note $s 'Nhóm chia hệ thống thành bốn lớp. Lớp giao diện nhận thao tác của học sinh. Lớp học tập xử lý bài học và câu hỏi. Lớp 3D và Pose hiển thị mô hình hoặc phân tích các mốc cơ thể. Lớp dịch vụ lưu dữ liệu và gọi AI. Việc chia như vậy giúp giải thích mỗi công nghệ làm nhiệm vụ gì. Hiện Express và Worker có mức hỗ trợ khác nhau, nên khi demo phải chọn đúng môi trường.'

 $s=Slide '03 / KỸ THUẬT THỰC HIỆN' 'Ngôn ngữ, công cụ và vai trò' 'Phân biệt ngôn ngữ lập trình với thư viện, công cụ và định dạng tài nguyên.' 'Báo cáo §3.3'
 $rows=@(@('TypeScript / JavaScript','Logic web; React xây giao diện; Vite đóng gói.'),@('Python / bpy + Blender','Script và công cụ dựng hình, rig, hoạt ảnh, xuất tài nguyên.'),@('Three.js + R3F + Drei','Hiển thị mô hình GLB, điều khiển camera và hoạt ảnh.'),@('MediaPipe + rubric; Gemini','Nhận mốc cơ thể / chấm theo tiêu chí; AI tạo sinh qua API.'),@('C++ / WebAssembly','Phần tính toán; có phương án JavaScript dự phòng.'),@('Express; Worker / D1','Backend và dữ liệu máy chủ; localStorage lưu cục bộ.'))
 $yy=178;foreach($row in $rows){[void](Box $s 36 $yy 888 47 $white);[void](Txt $s $row[0] 48 ($yy+11) 300 33 17 $teal $true);[void](Txt $s $row[1] 361 ($yy+11) 546 33 17 $ink);$yy+=52}
 Note $s 'Ngôn ngữ chính của website là TypeScript và JavaScript. React là thư viện giao diện, còn Vite là công cụ đóng gói. Blender và script Python hỗ trợ tài nguyên 3D; GLB là định dạng tệp chứ không phải ngôn ngữ. MediaPipe nhận các mốc cơ thể, còn Gemini phục vụ AI tạo sinh. C++ được biên dịch sang WebAssembly cho một số tính toán, có JavaScript dự phòng. Không nên nói nhóm tự huấn luyện mô hình AI vì báo cáo không chứng minh điều đó.'

 $s=Slide '03 / KỸ THUẬT THỰC HIỆN' 'Từ mô hình đến tương tác 3D' 'Quy trình tạo tài nguyên và điều khiển trên trình duyệt.' 'Báo cáo §3.2.1; §3.3; §4.2.2'
 Step $s 36 181 204 '01' 'Dựng hình' 'Blender: hình học và vật liệu.'
 Step $s 264 181 204 '02' 'Rig / hoạt ảnh' 'Gắn khung xương và chuẩn bị clip.'
 Step $s 492 181 204 '03' 'Xuất GLB' 'Đóng gói mô hình, vật liệu và hoạt ảnh.'
 Step $s 720 181 204 '04' 'Nạp lên web' 'useGLTF / useAnimations; camera và chọn chi tiết.'
 [void](Txt $s 'Điều khiển: timeline / phát ngược  •  chuyển clip mượt  •  Raycaster chọn chi tiết  •  Box3 focus camera' 36 412 888 40 17 $ink)
 Banner $s 'Theo báo cáo: 14 tệp GLB trong repository; 12 tệp được mã chạy thực tế tham chiếu.'
 Note $s 'Quy trình 3D đi từ mô hình trong Blender đến rig và clip hoạt ảnh, sau đó xuất GLB để dùng trên web. Three.js và các thư viện hỗ trợ nạp tệp, phát clip và điều khiển camera. Trình tự tháo lắp được điều khiển bằng timeline, có chạy ngược; việc chọn chi tiết dùng raycasting và tính vùng bao để camera tập trung. Báo cáo ghi nhận 14 tệp GLB nhưng chỉ 12 tệp được runtime tham chiếu, nên không nói tất cả 14 đều đang được sử dụng.'

 $s=Slide '03 / KỸ THUẬT THỰC HIỆN' 'AI Pose: từ ảnh đến góp ý tư thế' 'Mô hình nhận mốc cơ thể; phần chấm dựa trên các tiêu chí hình học của hệ thống.' 'Báo cáo §3.1–3.3; §4.2.2–4.2.3'
 Step $s 36 181 204 '01' 'Camera' 'Người học cấp quyền; xử lý frame tại trình duyệt.'
 Step $s 264 181 204 '02' '33 mốc' 'MediaPipe nhận các điểm đặc trưng cơ thể.'
 Step $s 492 181 204 '03' 'Lọc chất lượng' 'Kiểm tra dữ liệu trước khi chấm tư thế.'
 Step $s 720 181 204 '04' 'Rubric' 'Đối chiếu tiêu chí → điểm và góp ý.'
 [void](Txt $s 'MediaPipe không tự quyết định tiêu chuẩn GDQP-AN; rubric vẫn cần giáo viên thẩm định.' 36 412 888 40 19 $navy $true)
 Banner $s 'Theo báo cáo: không có lệnh upload ảnh camera; chưa có số liệu độ chính xác trên người thật.'
 Note $s 'AI Pose gồm hai phần cần phân biệt. MediaPipe là mô hình có sẵn giúp nhận 33 mốc cơ thể từ ảnh. Sau đó mã của hệ thống lọc chất lượng, tính đặc trưng hình học và so với rubric để đưa điểm và góp ý. Vì vậy độ tin cậy phụ thuộc cả việc nhìn thấy cơ thể và bộ tiêu chí. Báo cáo chưa có kiểm định người thật; các test tự động không thể thay thế cho việc đối chiếu với giáo viên và nhiều điều kiện camera.'

 $s=Slide '03 / KỸ THUẬT THỰC HIỆN' 'AI tạo sinh và dữ liệu được xử lý ở đâu?' 'Đây là giới hạn cần nắm rõ trước khi chọn môi trường demo.' 'Báo cáo §3.2; §4.2.1; §4.2.3'
 Card $s 36 181 280 262 'Trên trình duyệt' "Hiển thị 3D và xử lý Pose.`nlocalStorage lưu tiến độ, XP và trạng thái cục bộ.`nChưa đồng bộ tiến độ đa thiết bị." 18
 Card $s 340 181 280 262 'Cloudflare Worker / D1' "Bản công khai có tài khoản và khảo sát lưu D1.`nAPI chatbot và API bài thi chưa triển khai theo báo cáo." 18
 Card $s 644 181 280 262 'Backend Express' "Có /api/ask gọi Gemini khi cấu hình khóa.`nCó API bài thi.`nChatbot chưa truy hồi bài học/PDF và chưa trích dẫn." 18
 Banner $s 'Luồng chatbot: câu hỏi → backend Express → Gemini → phản hồi; cần giáo viên/tài liệu kiểm chứng.'
 Note $s 'Có ba nơi xử lý dữ liệu. Trình duyệt hiển thị 3D, phân tích Pose và lưu tiến độ cục bộ. Worker và D1 phục vụ tài khoản cùng khảo sát trên bản công khai. Express có thêm API chatbot và bài thi. Chatbot gửi câu hỏi tới backend để gọi Gemini khi có khóa cấu hình; chưa có hệ truy hồi bài học hoặc PDF. Xóa dữ liệu trình duyệt có thể làm mất tiến độ cục bộ. Đây là lý do nhóm cần tiếp tục hợp nhất backend và đồng bộ dữ liệu.'

 $s=Slide '03 / KỸ THUẬT THỰC HIỆN' 'Kiểm chứng kỹ thuật của bản báo cáo' 'Đối chiếu mã nguồn, tài nguyên, kiểu dữ liệu và các bài kiểm thử tự động.' 'Báo cáo §3.4; §4.3 — số liệu của lần rà soát được báo cáo'
 Card $s 36 181 280 252 '136/136 ca đạt' 'Trong 23 tệp kiểm thử; gồm API thi, vòng đời chức năng, vật lý/WASM và pipeline Pose.' 20
 Card $s 340 181 280 252 'Type-check đạt' 'Kiểm tra kiểu TypeScript giúp phát hiện lỗi không tương thích dữ liệu và cách dùng mã.' 20
 Card $s 644 181 280 252 'Đối chiếu tài nguyên' 'Kiểm kê bài học, câu hỏi và GLB; kiểm tra clip, nơi sử dụng và ảnh minh chứng.' 20
 Banner $s 'Kết quả test xác nhận logic đã kiểm tra; chưa chứng minh độ chính xác Pose hay hiệu quả học tập.'
 Note $s 'Báo cáo ghi nhận type-check đạt và 136 trên 136 ca kiểm thử trong 23 tệp. Các kiểm tra bao phủ một số logic như API thi, vòng đời chức năng, vật lý và pipeline Pose. Ngoài ra nhóm kiểm kê dữ liệu cùng tài nguyên. Cần diễn giải đúng: kết quả này cho biết những tình huống đã viết test hoạt động như kỳ vọng, không có nghĩa phần mềm không còn lỗi hoặc AI đã được chứng minh chính xác trên người thật.'

 $s=Slide 'KẾT QUẢ BƯỚC ĐẦU' 'Khảo sát ghi nhận tín hiệu tích cực' 'Mốc dữ liệu: 21/09/2026 • 47 phản hồi = 45 học sinh + 2 giáo viên • 20 cặp học sinh trước–sau.' 'Báo cáo §4.2.4; §4.3'
 [void](Box $s 36 181 400 265 $white)
 [void](Txt $s 'Điểm trung bình / 5' 56 194 345 25 18 $navy $true)
 [void](Box $s 109 317 91 108 (RGB '91AABD'));[void](Box $s 271 262 91 163 $teal)
 [void](Txt $s '2,69' 112 278 94 35 27 $navy $true);[void](Txt $s '4,08' 274 225 94 35 27 $teal $true)
 [void](Txt $s 'Trước' 122 427 91 22 16 $muted);[void](Txt $s 'Sau' 295 427 91 22 16 $muted)
 Card $s 461 181 463 265 '+51,7% điểm trung bình' "Tổng hợp 4 tiêu chí Likert tự đánh giá.`n75% đánh giá tích cực.`n95% muốn tiếp tục sử dụng.`nChưa có nhóm đối chứng; mẫu giáo viên nhỏ." 20
 Banner $s 'Không diễn giải mức tăng tự đánh giá thành “kết quả học tập thực tế tăng 51,7%”.'
 Note $s 'Theo dữ liệu ngày 21 tháng 9, có 47 phản hồi, trong đó 45 của học sinh và 2 của giáo viên. Với 20 cặp học sinh trước và sau, điểm trung bình bốn tiêu chí tự đánh giá tăng từ 2,69 lên 4,08 trên 5, tương ứng khoảng 51,7 phần trăm. Đây là điểm Likert về trải nghiệm, không phải điểm kiểm tra kiến thức. Vì chưa có nhóm đối chứng, chúng em chỉ ghi nhận tín hiệu ban đầu và chưa kết luận website gây ra mức cải thiện đó.'

 $s=Slide 'HƯỚNG HOÀN THIỆN' 'Những việc cần làm tiếp' 'Ưu tiên độ đúng chuyên môn, bằng chứng thực nghiệm và tính ổn định khi sử dụng.' 'Báo cáo §4.5'
 Card $s 36 181 426 126 '1. Thẩm định chuyên môn' 'Giáo viên rà soát bài học, câu hỏi, tư thế và thao tác.' 18
 Card $s 486 181 438 126 '2. Kiểm định Pose' 'Đối chiếu người thật với giáo viên; thử góc máy và ánh sáng.' 18
 Card $s 36 327 426 126 '3. Hoàn thiện hệ thống' 'Hợp nhất backend, đồng bộ tiến độ; sửa XP và tối ưu thiết bị yếu.' 18
 Card $s 486 327 438 126 '4. Mở rộng thực nghiệm' 'Tăng mẫu, bổ sung nhóm đối chứng; nghiên cứu WebXR và truy hồi nguồn AI.' 18
 Note $s 'Bước tiếp theo của nhóm có bốn ưu tiên. Trước hết cần giáo viên thẩm định nội dung và tiêu chí. Tiếp theo là kiểm định Pose trên người thật. Về phần mềm, nhóm cần hợp nhất backend, đồng bộ tiến độ và tối ưu thiết bị. Về nghiên cứu, cần mở rộng mẫu và có nhóm đối chứng. WebXR và truy hồi nguồn cho chatbot là hướng phát triển, chưa được trình bày như chức năng đã hoàn thành.'

 $s=Slide 'CẢM ƠN BAN GIÁM KHẢO' 'Một cổng học tập, nhiều cách tiếp cận' 'Học lý thuyết • Quan sát 3D • Luyện tập • Nhận phản hồi' 'Tổng hợp từ báo cáo do nhóm cung cấp'
 [void](Txt $s "Giá trị hiện tại`nKết nối học liệu, mô phỏng và phản hồi trong một website." 36 182 608 107 27 $navy $true)
 [void](Txt $s "Phạm vi cam kết`nNguyên mẫu hỗ trợ học tập; tiếp tục kiểm định kỹ thuật và sư phạm." 36 312 608 100 23 $ink)
 Pic $s 'doc_image2.png' 704 182 190 190
 [void](Txt $s 'QR từ báo cáo' 712 383 195 24 13 $muted)
 [void](Txt $s 'gdqp-an.gdqp-3d.workers.dev' 36 459 888 32 21 $teal $true)
 Note $s 'Chúng em chọn đề tài từ nhu cầu quan sát và tự học GDQP-AN, triển khai các chức năng học liệu, luyện tập, 3D và AI trên nền tảng web. Giá trị hiện tại nằm ở nguyên mẫu tích hợp với quy mô dữ liệu và giới hạn được nêu rõ. Nhóm mong tiếp tục được giáo viên hỗ trợ thẩm định và tổ chức thực nghiệm. Chúng em xin cảm ơn Ban giám khảo và sẵn sàng trình bày demo, giải thích kỹ thuật cũng như những phần đang hoàn thiện. QR và địa chỉ được giữ theo báo cáo, chưa xác minh khả dụng trực tuyến trong lần dựng slide này.'

 $p.SaveAs($output,24)
 $issues=@()
 for($i=1;$i -le $p.Slides.Count;$i++){
  $s=$p.Slides.Item($i)
  foreach($q in $s.Shapes){if($q.HasTextFrame -eq -1 -and $q.TextFrame.HasText -eq -1){
   if($q.TextFrame.TextRange.BoundHeight -gt ($q.Height+2)){$issues+=('Slide '+$i+': '+$q.TextFrame.TextRange.Text.Substring(0,[Math]::Min(60,$q.TextFrame.TextRange.Text.Length)))}
  }}
  $s.Export((Join-Path $renders ('slide-{0:00}.png' -f $i)),'PNG',1280,720)
 }
 Write-Output ('OUTPUT='+$output)
 Write-Output ('SLIDES='+$p.Slides.Count)
 Write-Output ('OVERFLOW_COUNT='+$issues.Count)
 $issues|ForEach-Object{Write-Output $_}
} finally {
 $p.Close();$app.Quit();[void][Runtime.InteropServices.Marshal]::ReleaseComObject($p);[void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
 [GC]::Collect();[GC]::WaitForPendingFinalizers()
}
