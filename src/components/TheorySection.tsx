import { useState, useMemo, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, MapPin, Target, Shield, Clock, Brain, FileText, Target as TargetIcon, 
  Flag, Users, Zap, Award, Search, Sword, Star, AlertTriangle, Crosshair, 
  Activity, HeartPulse, Navigation, Radio, Bomb, Flame, Tent, CheckCircle2
} from 'lucide-react';
import { GradeLevel } from '../types';
import { useGamification } from '../context/GamificationContext';

// ============================================================================
// 1. CẤU TRÚC DỮ LIỆU BÀI GIẢNG TÓM TẮT (FULL 3 NĂM HỌC - SẠCH 100%)
// ============================================================================
interface LessonSummary {
  id: string;
  order: string;
  title: string;
  objective: string;
  keyPoints: { icon: ReactNode; title: string; content: string }[];
}

interface GradeModule {
  grade: GradeLevel;
  textbook: string;
  lessons: LessonSummary[];
}

const THEORY_DATA: Record<GradeLevel, GradeModule> = {
  10: {
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức)',
    lessons: [
      { id: '10_1', order: 'Bài 1', title: 'Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam', objective: 'Nêu được những nét chính về lịch sử, bản chất, truyền thống anh hùng của Quân đội nhân dân Việt Nam, Công an nhân dân Việt Nam và Dân quân tự vệ.', keyPoints: [ { icon: <Shield />, title: "Truyền thống Quân đội", content: "Trung thành vô hạn với Tổ Quốc; quyết chiến, quyết thắng; gắn bó máu thịt với nhân dân; kỉ luật tự giác, nghiêm minh." }, { icon: <Clock />, title: "Truyền thống Công an", content: "Tuyệt đối trung thành; vì nhân dân phục vụ, dựa vào dân để làm việc; cảnh giác, bí mật, mưu trí, dũng cảm." } ] },
      { id: '10_2', order: 'Bài 2', title: 'Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam', objective: 'Phân tích và trình bày được những nội dung cơ bản của Luật Giáo dục QPAN, Luật Sĩ quan QĐND và Luật Công an nhân dân.', keyPoints: [ { icon: <FileText />, title: "Luật GDQP&AN", content: "Môn học chính khoá bảo đảm học sinh có hiểu biết ban đầu về nền quốc phòng toàn dân, an ninh nhân dân và kĩ năng quân sự." }, { icon: <Award />, title: "Trách nhiệm Sĩ quan, Công an", content: "Tuyệt đối trung thành với Tổ quốc, nhân dân; sẵn sàng chiến đấu, hi sinh bảo vệ độc lập, chủ quyền, toàn vẹn lãnh thổ." } ] },
      { id: '10_3', order: 'Bài 3', title: 'Ma tuý, tác hại của ma tuý', objective: 'Nêu được quy định pháp luật về phòng chống ma tuý; phân tích tác hại và hình thức gây nghiện.', keyPoints: [ { icon: <Search />, title: "Chất ma tuý", content: "Là chất gây nghiện, chất hướng thần kích thích hoặc ức chế thần kinh, dễ gây tình trạng nghiện." }, { icon: <AlertTriangle />, title: "Trách nhiệm Học sinh", content: "Chủ động bảo vệ bản thân, tuyệt đối không dùng thử; kịp thời tố giác người vi phạm cho gia đình, nhà trường." } ] },
      { id: '10_4', order: 'Bài 4', title: 'Phòng, chống vi phạm pháp luật về trật tự an toàn giao thông', objective: 'Trình bày một số nội dung cơ bản pháp luật về trật tự an toàn giao thông và tự giác tuân thủ.', keyPoints: [ { icon: <MapPin />, title: "Quy tắc đường bộ", content: "Đi bên phải theo chiều đi, đi đúng làn đường, chấp hành hệ thống báo hiệu (người điều khiển, đèn, biển báo)." }, { icon: <Users />, title: "Hành động cụ thể", content: "Đủ 16 tuổi được lái xe dưới 50cm3; phải đội mũ bảo hiểm; tuyên truyền người thân cùng chấp hành." } ] },
      { id: '10_5', order: 'Bài 5', title: 'Bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội', objective: 'Nêu được tình hình, nhiệm vụ và trách nhiệm của công dân, lực lượng vũ trang trong bảo vệ an ninh quốc gia.', keyPoints: [ { icon: <Shield />, title: "An ninh quốc gia", content: "Là sự ổn định, phát triển bền vững của chế độ XHCN và sự bất khả xâm phạm độc lập, chủ quyền Tổ quốc." }, { icon: <Zap />, title: "Trách nhiệm học sinh", content: "Không thực hiện, không tụ tập bạn bè vi phạm pháp luật; kịp thời thông báo, ngăn chặn hành vi xâm phạm an ninh." } ] },
      { id: '10_6', order: 'Bài 6', title: 'Một số hiểu biết về an ninh mạng', objective: 'Nêu khái niệm về mạng, an ninh mạng, bảo mật thông tin cá nhân và nội dung cơ bản Luật An ninh mạng.', keyPoints: [ { icon: <Brain />, title: "An ninh mạng", content: "Bảo đảm hoạt động trên không gian mạng không gây phương hại đến an ninh quốc gia, trật tự, quyền hợp pháp của tổ chức, cá nhân." }, { icon: <AlertTriangle />, title: "Bảo mật thông tin", content: "Đặt mật khẩu mạnh, dùng xác thực 2 yếu tố, tránh Wifi công cộng, chia sẻ thông tin chọn lọc, cảnh giác mã độc." } ] },
      { id: '10_7', order: 'Bài 7', title: 'Thường thức phòng tránh vũ khí huỷ diệt, thiên tai, dịch bệnh và cháy nổ', objective: 'Nhận diện và biết cách phòng tránh tác hại của bom, mìn, đạn, vũ khí hoá học, sinh học, công nghệ cao, thiên tai, dịch bệnh.', keyPoints: [ { icon: <Bomb />, title: "Phòng tránh Bom Mìn", content: "Không đến gần, không đập phá, tháo gỡ mìn; quan sát, làm hầm hố ẩn nấp; báo ngay cho cơ quan chức năng khi phát hiện." }, { icon: <Flame />, title: "Xử lí Cháy nổ", content: "Bình tĩnh ngắt điện, gọi 114, dùng khăn ướt che mặt bò sát đất tìm lối thoát hiểm, kêu gọi sự giúp đỡ." } ] },
      { id: '10_8', order: 'Bài 8', title: 'Một số nội dung Điều lệnh quản lí bộ đội và Điều lệnh Công an nhân dân', objective: 'Nêu được một số nội dung chính trong Điều lệnh và biết vận dụng vào cuộc sống.', keyPoints: [ { icon: <Award />, title: "Xưng hô, chào hỏi", content: "Quân nhân gọi nhau bằng 'Đồng chí', xưng 'Tôi'. Cấp dưới chào cấp trên trước, người được chào phải đáp lễ." }, { icon: <Users />, title: "Trang phục", content: "Thể hiện tính thống nhất. Có trang phục dự lễ, thường dùng, dã chiến, nghiệp vụ. Phải giữ tư thế tác phong nghiêm túc." } ] },
      { id: '10_9', order: 'Bài 9', title: 'Đội ngũ từng người không có súng', objective: 'Thực hiện được một số động tác điều lệnh đội ngũ cá nhân chính xác, nhanh, mạnh, đẹp.', keyPoints: [ { icon: <Activity />, title: "Nghiêm, Nghỉ, Quay", content: "Nghiêm: Gót sát nhau, mũi mở 45 độ. Nghỉ: Chùng một gối. Quay: Lấy gót chân hướng quay và mũi chân kia làm trụ." }, { icon: <Navigation />, title: "Đi đều, chạy đều", content: "Đi đều bước chân dài 60-75cm, đánh tay vuông góc. Khi sai nhịp phải đổi chân. Chạy đều bằng mũi bàn chân." } ] },
      { id: '10_10', order: 'Bài 10', title: 'Đội ngũ tiểu đội', objective: 'Nêu thứ tự và biết cách điều khiển, tập hợp đội hình cơ bản của tiểu đội (hàng ngang, hàng dọc).', keyPoints: [ { icon: <Users />, title: "4 Bước Tập Hợp", content: "Gồm: Bước 1 Tập hợp, Bước 2 Điểm số (đội hình 2 hàng không điểm số), Bước 3 Chỉnh đốn hàng ngũ, Bước 4 Giải tán." }, { icon: <Navigation />, title: "Chỉ huy", content: "Tiểu đội trưởng hô rõ dự lệnh và động lệnh, đứng ở vị trí chuẩn xác để bao quát và đôn đốc đội hình gióng hàng thẳng." } ] },
      { id: '10_11', order: 'Bài 11', title: 'Các tư thế, động tác cơ bản vận động trong chiến đấu', objective: 'Thực hành các động tác vận động phù hợp với địa hình, địa vật và tình huống.', keyPoints: [ { icon: <Crosshair />, title: "Đi khom, chạy khom, bò", content: "Đi khom khi vật che khuất cao ngang ngực. Bò cao hai chân một tay khi cần tay dò mìn. Chạy khom vượt địa hình trống trải." }, { icon: <Tent />, title: "Lê, trườn, vọt tiến", content: "Trườn khi sát địch, hoả lực bắn thẳng. Vọt tiến khi vượt địa hình trống trải, dùng sức bật vụt chạy nhanh rồi dừng lại ẩn nấp." } ] },
      { id: '10_12', order: 'Bài 12', title: 'Kĩ thuật cấp cứu và chuyển thương', objective: 'Nắm được kiến thức cơ bản sơ cứu tai nạn thông thường, cầm máu, băng bó, hô hấp nhân tạo, chuyển thương.', keyPoints: [ { icon: <HeartPulse />, title: "Cầm máu, Cố định xương", content: "Băng ép, ấn động mạch, đặt garô (nới mỗi 1 giờ). Cố định xương gãy bằng nẹp vượt qua 2 khớp trên và dưới." }, { icon: <Users />, title: "Hô hấp, Chuyển thương", content: "Ép tim lồng ngực - thổi ngạt theo chu kì 30:2. Chuyển thương bằng tay không (cõng, vác) hoặc dùng cáng bạt, cáng võng." } ] },
    ]
  },
  11: {
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức)',
    lessons: [
      { id: '11_1', order: 'Bài 1', title: 'Bảo vệ chủ quyền lãnh thổ, biên giới quốc gia nước CHXHCN Việt Nam', objective: 'Phân tích được chủ quyền lãnh thổ, Luật Biển 1982, Luật Biển Việt Nam và trách nhiệm công dân.', keyPoints: [ { icon: <Flag />, title: "Biên giới quốc gia", content: "Là đường và mặt thẳng đứng xác định giới hạn lãnh thổ đất liền, đảo, quần đảo (gồm Hoàng Sa, Trường Sa), vùng biển, vùng trời, lòng đất." }, { icon: <MapPin />, title: "Vùng biển Việt Nam", content: "Gồm nội thuỷ, lãnh hải (12 hải lí), vùng tiếp giáp lãnh hải (12 hải lí), vùng đặc quyền kinh tế (200 hải lí) và thềm lục địa." } ] },
      { id: '11_2', order: 'Bài 2', title: 'Luật Nghĩa vụ quân sự và trách nhiệm của học sinh', objective: 'Nêu nội dung chính của Luật Nghĩa vụ quân sự, quy định tham gia Công an nhân dân và biết đăng kí thực hiện.', keyPoints: [ { icon: <Shield />, title: "Đăng kí NVQS", content: "Công dân nam đủ 17 tuổi trở lên. Độ tuổi gọi nhập ngũ từ đủ 18 đến hết 25 tuổi (đến 27 tuổi nếu học Cao đẳng/Đại học)." }, { icon: <Users />, title: "Trách nhiệm Học sinh", content: "Chấp hành nghiêm lệnh khám tuyển, có mặt đúng thời gian; đấu tranh với hành vi trốn tránh, gian dối khám sức khoẻ." } ] },
      { id: '11_3', order: 'Bài 3', title: 'Phòng chống tệ nạn xã hội ở Việt Nam trong thời kì hội nhập', objective: 'Nêu các loại hình tội phạm, tệ nạn (ma tuý, mại dâm, cờ bạc) và tội phạm sử dụng công nghệ cao.', keyPoints: [ { icon: <AlertTriangle />, title: "Tội phạm công nghệ cao", content: "Sử dụng tri thức, kĩ năng công nghệ thông tin để lừa đảo chiếm đoạt tài sản, đánh bạc, phát tán mã độc, trộm cắp dữ liệu." }, { icon: <Brain />, title: "Phòng chống", content: "Không tham gia tệ nạn; không chia sẻ thông tin chưa kiểm chứng; nâng cao nhận thức và báo cáo hành vi vi phạm cho cơ quan." } ] },
      { id: '11_4', order: 'Bài 4', title: 'Một số vấn đề về vi phạm pháp luật bảo vệ môi trường', objective: 'Hiểu các vấn đề môi trường toàn cầu (biến đổi khí hậu, an ninh lương thực) và cách ngăn chặn vi phạm.', keyPoints: [ { icon: <Zap />, title: "Ô nhiễm, suy thoái", content: "Sự biến đổi tính chất, suy giảm số lượng/chất lượng môi trường đất, nước, không khí do tự nhiên và hoạt động con người." }, { icon: <TargetIcon />, title: "Hành vi bị cấm", content: "Nghiêm cấm xả chất thải chưa xử lí, phá hoại di sản thiên nhiên. Học sinh cần sử dụng tiết kiệm tài nguyên, tích cực dọn vệ sinh." } ] },
      { id: '11_5', order: 'Bài 5', title: 'Kiến thức phổ thông về phòng không nhân dân', objective: 'Nhận biết phương thức tiến công đường không của địch và cách phòng, tránh, sơ tán.', keyPoints: [ { icon: <Crosshair />, title: "Thủ đoạn của địch", content: "Tiến công từ nhiều hướng, đánh đồng loạt liên tục ngày đêm vào trụ sở, nhà máy, sân bay, đầu mối giao thông bằng vũ khí công nghệ cao." }, { icon: <Tent />, title: "Hoạt động phòng tránh", content: "Tổ chức trinh sát, báo động (còi, kẻng). Xây dựng hầm, hào trú ẩn. Sơ tán, phân tán người và tài sản. Tổ chức đánh trả và khắc phục hậu quả." } ] },
      { id: '11_6', order: 'Bài 6', title: 'Giới thiệu súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo', objective: 'Nhận biết súng AK, RPD, thuốc nổ TNT, C4, vật cản và thực hành tháo lắp súng AK.', keyPoints: [ { icon: <Sword />, title: "Súng tiểu liên AK", content: "Cỡ đạn 7,62mm, bắn liên thanh/phát một, tầm bắn hiệu quả 400m. Cấu tạo 11 bộ phận chính. Tháo lắp phải đúng thứ tự, nhẹ nhàng." }, { icon: <Bomb />, title: "Thuốc nổ & Vật cản", content: "TNT đúc thành bánh, C4 dạng dẻo nhào nặn được. Vật cản nổ (mìn) và không nổ (hàng rào thép gai, chông) để làm chậm bước tiến địch." } ] },
      { id: '11_7', order: 'Bài 7', title: 'Pháp luật về quản lí vũ khí, vật liệu nổ, công cụ hỗ trợ', objective: 'Nêu quy định pháp luật và vận động người thân không tàng trữ, sử dụng vũ khí trái phép.', keyPoints: [ { icon: <Shield />, title: "Nguyên tắc quản lí", content: "Trang bị vũ khí đúng thẩm quyền (QĐND, CAND, Dân quân). Cấm cá nhân sở hữu vũ khí quân dụng, súng săn, vật liệu nổ." }, { icon: <FileText />, title: "Trách nhiệm", content: "Trình báo, giao nộp vũ khí nhặt được cho Công an/Quân sự. Tố giác hành vi mua bán, tàng trữ, chế tạo vũ khí trái phép." } ] },
      { id: '11_8', order: 'Bài 8', title: 'Lợi dụng địa hình, địa vật', objective: 'Phân tích ý nghĩa và thực hành lợi dụng vật che khuất, che đỡ, vượt địa hình trống trải.', keyPoints: [ { icon: <Tent />, title: "Vật che khuất, che đỡ", content: "Vật che khuất giấu được hành động nhưng không chống được đạn. Vật che đỡ vừa giấu hành động vừa chống đỡ được đạn bắn thẳng." }, { icon: <Activity />, title: "Cách lợi dụng", content: "Hành động bí mật, khéo léo, không làm rung động vật lợi dụng. Tránh vật đột xuất. Vượt bãi trống trải phải lợi dụng sơ hở, vọt tiến nhanh." } ] },
      { id: '11_9', order: 'Bài 9', title: 'Nhìn, nghe, phát hiện địch, chỉ mục tiêu, truyền tin liên lạc', objective: 'Hiểu yêu cầu và thực hành quan sát, nghe, chỉ mục tiêu và truyền lệnh bí mật, chính xác.', keyPoints: [ { icon: <Search />, title: "Nhìn, Nghe, Phát hiện", content: "Ban ngày nhìn nơi cao, ban đêm nhìn nơi thấp. Áp tai xuống đất/ray tàu để nghe xa. Chú ý sự thay đổi hình dáng, màu sắc, chim thú vụt chạy." }, { icon: <Radio />, title: "Truyền tin, Báo cáo", content: "Truyền lệnh bằng lời nói ngắn gọn hoặc dùng ám hiệu (tay, đèn, màu sắc). Nhận lệnh phải nắm chắc, truyền đi nhanh chóng, bí mật." } ] },
      { id: '11_10', order: 'Bài 10', title: 'Kĩ thuật sử dụng lựu đạn', objective: 'Nêu tính năng lựu đạn F-1, LĐ-01 và thực hành động tác đứng, quỳ, nằm ném lựu đạn.', keyPoints: [ { icon: <Bomb />, title: "Tính năng Lựu đạn", content: "F-1 (thuốc nổ TNT 60g, sát thương 20m), LĐ-01 (sát thương 5-6m). Thời gian cháy chậm 3-4 giây. Rút chốt an toàn để giải phóng kim hoả." }, { icon: <Target />, title: "Động tác ném", content: "Đứng, quỳ, nằm ném tuỳ vật che đỡ. Phải kết hợp sức vút của tay, rướn của thân người và sức bật của chân để ném được xa, đúng hướng." } ] },
    ]
  },
  12: {
    grade: 12,
    textbook: 'Sách giáo khoa GDQP&AN 12 (Bộ Kết nối tri thức)',
    lessons: [
      { id: '12_1', order: 'Bài 1', title: 'Bảo vệ Tổ quốc Việt Nam XHCN sau năm 1975', objective: 'Nêu giá trị lịch sử các cuộc chiến bảo vệ biên giới và chủ quyền biển, đảo trong giai đoạn mới.', keyPoints: [ { icon: <Flag />, title: "Biên giới Tây Nam & Phía Bắc", content: "Hành động tự vệ chính nghĩa đánh đuổi Pol Pot (1978) và đánh trả quân Trung Quốc (1979) để bảo vệ toàn vẹn lãnh thổ." }, { icon: <Shield />, title: "Chủ quyền Biển Đảo", content: "Kiên quyết, kiên trì đấu tranh bằng biện pháp hoà bình, tôn trọng luật quốc tế (UNCLOS 1982) khẳng định chủ quyền Hoàng Sa, Trường Sa." } ] },
      { id: '12_2', order: 'Bài 2', title: 'Tổ chức Quân đội nhân dân và Công an nhân dân', objective: 'Nhận biết chức năng cơ quan, cấp bậc quân hàm, quân hiệu, phù hiệu, trang phục QĐND và CAND.', keyPoints: [ { icon: <Users />, title: "Hệ thống Tổ chức", content: "QĐND gồm Bộ QP, Bộ Tổng tham mưu, Quân khu, Quân chủng, Binh chủng. CAND có 4 cấp: Bộ, Tỉnh, Huyện, Xã." }, { icon: <Award />, title: "Quân hàm, Phù hiệu", content: "Sĩ quan có 3 cấp (Tướng, Tá, Uý), 12 bậc. Nhận biết lực lượng qua màu sắc nền cấp hiệu (Lục quân đỏ, Không quân xanh trời, Hải quân tím than)." } ] },
      { id: '12_3', order: 'Bài 3', title: 'Công tác tuyển sinh, đào tạo trường QĐND và CAND', objective: 'Nắm được hệ thống nhà trường, đối tượng, tiêu chuẩn, phương thức tuyển sinh và định hướng nghề.', keyPoints: [ { icon: <BookOpen />, title: "Hệ thống nhà trường", content: "Đào tạo sĩ quan tại Học viện Kĩ thuật Quân sự, An ninh, Cảnh sát, Trường Sĩ quan Lục quân... Học viên không phải đóng học phí." }, { icon: <TargetIcon />, title: "Tiêu chuẩn dự tuyển", content: "Thanh niên ngoài quân đội dưới 21 tuổi (hoặc 23 tuổi nếu hoàn thành NVQS). Cần đạt chuẩn sức khoẻ, lí lịch chính trị và tốt nghiệp THPT." } ] },
      { id: '12_4', order: 'Bài 4', title: 'Chiến lược "Diễn biến hoà bình", bạo loạn lật đổ', objective: 'Nhận diện âm mưu, thủ đoạn của thế lực thù địch và biết cách phòng chống trên không gian mạng.', keyPoints: [ { icon: <Brain />, title: "Âm mưu & Thủ đoạn", content: "Lật đổ chế độ XHCN từ bên trong bằng phi quân sự. Xuyên tạc lịch sử, kích động tôn giáo, dân tộc, phát tán tin giả trên MXH để gây bạo loạn." }, { icon: <AlertTriangle />, title: "Trách nhiệm Học sinh", content: "Nêu cao cảnh giác, áp dụng quy tắc 5K MXH (Không tin ngay, Không vội Like, Không thêm thắt, Không kích động, Không vội chia sẻ)." } ] },
      { id: '12_5', order: 'Bài 5', title: 'Truyền thống và nghệ thuật đánh giặc của địa phương', objective: 'Phát huy truyền thống của lực lượng vũ trang địa phương, tự giác tu dưỡng xứng đáng với quê hương.', keyPoints: [ { icon: <Sword />, title: "Truyền thống LLVT Địa phương", content: "Gắn bó máu thịt với nhân dân, chiến đấu mưu trí, dũng cảm. Dựa vào sức mình, tiến hành chiến tranh du kích rộng khắp." }, { icon: <Clock />, title: "Nghệ thuật Quân sự", content: "Lấy nhỏ đánh lớn, lấy ít địch nhiều. Cải tạo địa hình, xây dựng làng xã chiến đấu, phối hợp hiệp đồng chặt chẽ với bộ đội chủ lực." } ] },
      { id: '12_6', order: 'Bài 6', title: 'Kĩ thuật bắn súng tiểu liên AK', objective: 'Thực hành thao tác ngắm bắn, hiểu ảnh hưởng của ngắm sai và bắn trúng mục tiêu bia số 4.', keyPoints: [ { icon: <Crosshair />, title: "Lấy đường ngắm", content: "Đường ngắm cơ bản là đường từ mắt qua chính giữa mép trên khe ngắm đến chính giữa mép trên đầu ngắm. Mặt súng nghiêng sẽ lệch điểm chạm." }, { icon: <Target />, title: "Thực hành bắn", content: "Giương súng (Bằng, chắc, đều, bền). Bóp cò êm, đều, thẳng về sau, ngưng thở trước khi kết thúc phát bắn. Tập ngắm chụm, ngắm trúng." } ] },
      { id: '12_7', order: 'Bài 7', title: 'Tìm và giữ phương hướng', objective: 'Sử dụng địa bàn, bản đồ, yếu tố thiên nhiên để xác định, giữ phương hướng vận động.', keyPoints: [ { icon: <Navigation />, title: "Xác định hướng", content: "Dùng địa bàn định vị phương Bắc. Nếu không có: Dựa vào Mặt Trời (Đông mọc, Tây lặn), đồng hồ, bóng gậy; sao Bắc Cực, Mặt Trăng." }, { icon: <Search />, title: "Đặc điểm thực vật", content: "Rêu mọc nhiều hướng Bắc. Tán lá cây phát triển, vòng tuổi gỗ rộng ở hướng Nam. Măng tre mọc nhiều hướng Đông." } ] },
      { id: '12_8', order: 'Bài 8', title: 'Vận dụng tư thế, động tác cơ bản khi vận động', objective: 'Nguyên tắc vận động vào gần địch trên các loại địa hình để tiêu diệt địch, bảo vệ bản thân.', keyPoints: [ { icon: <Shield />, title: "Dưới hoả lực địch", content: "Địch bắn thẳng: vọt tiến, chạy khom, bò, lê, lăn. Địch dùng pháo, súng cối: tận dụng khe rãnh, giao thông hào, áp sát tường để ẩn nấp." }, { icon: <Activity />, title: "Qua địa hình trống trải", content: "Lợi dụng lúc địch sơ hở, sương mù, khói bụi để vọt tiến nhanh. Ban đêm dùng tư thế thấp, tiến thẳng hướng địch, không nhấp nhô." } ] },
      { id: '12_9', order: 'Bài 9', title: 'Chạy vũ trang', objective: 'Thực hiện động tác chạy mang vác súng, kĩ thuật thở, xử lí chuột rút, ngất khi chạy.', keyPoints: [ { icon: <Activity />, title: "Kĩ thuật chạy & Thở", content: "Vác súng trên vai hoặc đeo dưới nách gọn gàng. Hít mạnh bằng mũi, thở từ từ bằng miệng (nhịp 2/2 hoặc 3/3) để tránh hiện tượng cực điểm." }, { icon: <HeartPulse />, title: "Xử lí tình huống", content: "Chạy lên dốc ngả người ra trước, xuống dốc ngả người ra sau. Bị chuột rút cần hít sâu, thả lỏng cơ, ấn mạnh vùng đau. Đánh đích bằng ngực hoặc vai." } ] },
    ]
  }
};

const PATRIOTIC_THEME = { 
  text: 'text-red-700 dark:text-red-400', 
  bg: 'bg-red-600', 
  borderActive: 'border-red-500 bg-red-50 dark:bg-red-950/40 dark:border-red-600',
  badgeText: 'text-yellow-400' 
};

const GRADE_COLOR_MAP: Record<GradeLevel, typeof PATRIOTIC_THEME> = {
  10: PATRIOTIC_THEME,
  11: PATRIOTIC_THEME,
  12: PATRIOTIC_THEME
};

interface TheorySectionProps {
  grade: GradeLevel;
  onGradeChange?: (grade: GradeLevel) => void;
}

export default function TheorySection({ grade, onGradeChange }: TheorySectionProps) {
  const activeGradeModule = useMemo(() => THEORY_DATA[grade], [grade]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(activeGradeModule.lessons[0]?.id || '');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  useEffect(() => {
    if (!activeGradeModule.lessons.some(l => l.id === selectedLessonId)) {
      setSelectedLessonId(activeGradeModule.lessons[0]?.id || '');
    }
    setMobileView('list');
  }, [activeGradeModule, selectedLessonId]);

  const selectedLessonSummary = useMemo(() => 
    activeGradeModule.lessons.find(l => l.id === selectedLessonId),
    [activeGradeModule, selectedLessonId]
  );

  const { state, markLessonRead, fireXPToast } = useGamification();
  const lessonsRead = state.lessonsRead;

  const handleMarkRead = (lessonId: string) => {
    const { xpGained } = markLessonRead(lessonId);
    if (xpGained > 0) {
      fireXPToast(xpGained, "Đọc xong lý thuyết");
    }
  };

  const activeColor = GRADE_COLOR_MAP[grade];

  return (
    <div className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm selection:bg-red-200 selection:text-red-900 transition-colors">
      
      {/* ── MOBILE ── */}
      <div className="flex md:hidden flex-col h-full">

        {/* MOBILE LIST VIEW */}
        {mobileView === 'list' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${activeColor.bg} ${activeColor.badgeText} shadow-sm border border-red-700`}>
                  {grade}
                </div>
                <div>
                  <h2 className={`font-extrabold text-sm ${activeColor.text}`}>Năm học Lớp {grade}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px]">Cổng bài giảng lý thuyết QPAN</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {[10, 11, 12].map((g) => (
                  <button
                    key={g}
                    onClick={() => onGradeChange && onGradeChange(g as GradeLevel)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                      grade === g
                        ? `${activeColor.bg} ${activeColor.badgeText} border border-red-700 shadow-sm`
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    L{g}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 flex flex-col gap-2">
              {activeGradeModule.lessons.map((lesson) => {
                const isActive = selectedLessonId === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLessonId(lesson.id);
                      setMobileView('detail');
                    }}
                    className={`w-full flex items-center text-left gap-3 p-4 rounded-xl transition-all duration-200 border-2 ${
                      isActive
                        ? activeColor.borderActive
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs uppercase transition-colors ${
                      isActive ? `${activeColor.bg} ${activeColor.badgeText} shadow-sm border border-red-700` : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {lesson.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-xs leading-snug ${isActive ? activeColor.text : 'text-slate-800 dark:text-white'}`}>
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{activeGradeModule.textbook}</p>
                        {lessonsRead.includes(lesson.id) && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 text-lg shrink-0">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MOBILE DETAIL VIEW */}
        {mobileView === 'detail' && selectedLessonSummary && (
          <MobileLessonDetail
            lesson={selectedLessonSummary}
            textbook={activeGradeModule.textbook}
            isRead={lessonsRead.includes(selectedLessonSummary.id)}
            onBack={() => setMobileView('list')}
            onMarkRead={() => handleMarkRead(selectedLessonSummary.id)}
          />
        )}
      </div>

      {/* ── DESKTOP/TABLET ── */}
      <div className="hidden md:flex flex-row relative" style={{ minHeight: '640px', height: 'calc(100vh - 230px)' }}>

        {/* SIDEBAR DESKTOP */}
        <div
          className="flex flex-col border-r border-slate-200 dark:border-slate-800 h-full shrink-0 bg-slate-50 dark:bg-slate-900 transition-all duration-300 ease-in-out overflow-hidden"
          style={{ width: isPanelCollapsed ? 0 : 340 }}
        >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${activeColor.bg} ${activeColor.badgeText} shadow-md border border-red-700`}>
              {grade}
            </div>
            <div>
              <h2 className={`font-black text-base ${activeColor.text}`}>Năm học Lớp {grade}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Cổng bài giảng lý thuyết QPAN</p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {[10, 11, 12].map((g) => (
              <button 
                key={g}
                onClick={() => onGradeChange && onGradeChange(g as GradeLevel)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  grade === g 
                  ? `${activeColor.bg} ${activeColor.badgeText} border border-red-700 shadow-sm` 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                }`}
              >
                L{g}
              </button>
            ))}
          </div>
        </div>

        {/* CỘT DANH SÁCH BÀI GIẢNG */}
        <div className="flex-1 p-4 gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 w-[340px]">
          {activeGradeModule.lessons.map((lesson) => {
            const isActive = selectedLessonId === lesson.id;
            return (
              <motion.button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                whileHover={{ scale: 1.01 }}
                className={`w-full flex items-center text-left gap-4 p-4 rounded-2xl transition-all duration-200 group border mb-2 ${
                  isActive 
                    ? `${activeColor.borderActive} shadow-sm border-red-200` 
                    : `bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-red-200 hover:bg-red-50/30 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm`
                }`}
              >
                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs uppercase transition-colors ${
                  isActive ? `${activeColor.bg} ${activeColor.badgeText} shadow-sm border border-red-700` : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 group-hover:bg-red-100 group-hover:text-red-700'
                }`}>
                  {lesson.order}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-[13px] leading-snug ${isActive ? activeColor.text : 'text-slate-800 dark:text-white group-hover:text-red-600'}`}>
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-[11px] line-clamp-1 ${isActive ? 'text-red-700/70 font-medium' : 'text-slate-400 dark:text-slate-400'}`}>
                      {activeGradeModule.textbook}
                    </p>
                    {lessonsRead.includes(lesson.id) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
        </div>

      {/* CỘT NỘI DUNG */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#111827] relative transition-colors">
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-500 dark:text-slate-300 hover:text-red-600 hover:border-red-300 shadow-md cursor-pointer transition-all"
          title={isPanelCollapsed ? "Mở danh sách bài học" : "Thu gọn danh sách bài học"}
        >
          <span className={`text-xs font-bold transition-transform duration-300 ${isPanelCollapsed ? 'rotate-180' : ''}`}>‹</span>
        </button>

        {selectedLessonSummary ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header bài học */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0 bg-white dark:bg-[#111827]">
              <div>
                <span className={`text-xs font-extrabold tracking-wider uppercase ${activeColor.text}`}>
                  {selectedLessonSummary.order}
                </span>
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
                  {selectedLessonSummary.title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {activeGradeModule.textbook}
                </p>
              </div>

              {/* Trạng thái / Đánh dấu đã học */}
              <button
                onClick={() => handleMarkRead(selectedLessonSummary.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                  lessonsRead.includes(selectedLessonSummary.id)
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {lessonsRead.includes(selectedLessonSummary.id) ? 'Đã hoàn thành' : 'Đánh dấu đã đọc'}
              </button>
            </div>

            {/* Chi tiết nội dung bài học */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-thin">
              {/* Mục tiêu */}
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-slate-800/60 border border-amber-200/80 dark:border-slate-700 space-y-2">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" /> Mục tiêu bài học
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans font-medium">
                  {selectedLessonSummary.objective}
                </p>
              </div>

              {/* Key points */}
              <div className="space-y-4">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                  <Star className="w-4 h-4 text-red-600 fill-current" /> Kiến thức cốt lõi
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedLessonSummary.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-4"
                    >
                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-red-600 dark:text-red-400 shrink-0 shadow-xs">
                        {point.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {point.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                          {point.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Vui lòng chọn bài học từ danh sách bên trái.
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

// Mobile Lesson Detail Sub-component
function MobileLessonDetail({
  lesson,
  textbook,
  isRead,
  onBack,
  onMarkRead
}: {
  lesson: LessonSummary;
  textbook: string;
  isRead: boolean;
  onBack: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111827] p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 cursor-pointer"
        >
          ‹ Quay lại danh sách
        </button>
        <button
          onClick={onMarkRead}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] ${
            isRead ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-600 text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isRead ? 'Đã học' : 'Đánh dấu đọc'}
        </button>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{lesson.order}</span>
        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{lesson.title}</h1>
        <p className="text-[10px] text-slate-400">{textbook}</p>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-1">
        <h3 className="font-bold text-xs text-amber-800 dark:text-amber-400 flex items-center gap-1">
          <Target className="w-3.5 h-3.5" /> Mục tiêu
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">{lesson.objective}</p>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Kiến thức cốt lõi</h3>
        {lesson.keyPoints.map((point, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">{point.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{point.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}