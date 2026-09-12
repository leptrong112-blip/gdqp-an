import {
  MultipleChoiceQuestion,
  TrueFalseQuestionSource,
  EssayQuestionSource,
} from "../types";

// =========================================================================
// PHẦN 1: CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (ABCD)
// Phân bổ bám sát 100% 32 bài học SGK Kết nối tri thức với cuộc sống
// =========================================================================

export const BANK_MCQ_10: MultipleChoiceQuestion[] = [
  {
    id: 1001,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    question: "Đội Việt Nam Tuyên truyền Giải phóng quân – tiền thân của Quân đội nhân dân Việt Nam được thành lập vào ngày tháng năm nào?",
    options: ["22/12/1944", "19/08/1945", "02/09/1945", "22/12/1946"],
    correctAnswer: 0,
    explanation: "Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập ngày 22/12/1944 tại khu rừng giữa hai tổng Hoàng Hoa Thám và Trần Hưng Đạo (Châu Nguyên Bình, tỉnh Cao Bằng) theo chỉ thị của Lãnh tụ Hồ Chí Minh."
  },
  {
    id: 1002,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    question: "Ngày truyền thống của Công an nhân dân Việt Nam là ngày nào?",
    options: ["19/08/1945", "22/12/1944", "02/09/1945", "30/04/1975"],
    correctAnswer: 0,
    explanation: "Ngày 19/8/1945 là ngày Cách mạng Tháng Tám thành công, đồng thời là ngày truyền thống vẻ vang của lực lượng Công an nhân dân Việt Nam."
  },
  {
    id: 1003,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    question: "Bản chất giai cấp của Quân đội nhân dân Việt Nam là gì?",
    options: [
      "Bản chất của giai cấp công nhân",
      "Bản chất của giai cấp nông dân",
      "Bản chất của tầng lớp trí thức",
      "Mang bản chất của toàn thể các tầng lớp nhân dân lao động tự do"
    ],
    correctAnswer: 0,
    explanation: "Quân đội nhân dân Việt Nam mang bản chất của giai cấp công nhân, có tính nhân dân và tính dân tộc sâu sắc; đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam."
  },
  {
    id: 1004,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    question: "Ai là người chỉ huy đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân gồm 34 chiến sĩ?",
    options: ["Đồng chí Võ Nguyên Giáp", "Đồng chí Hoàng Văn Thái", "Đồng chí Nguyễn Chí Thanh", "Đồng chí Văn Tiến Dũng"],
    correctAnswer: 0,
    explanation: "Đồng chí Võ Nguyên Giáp được Chủ tịch Hồ Chí Minh ủy nhiệm tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân vào ngày 22/12/1944."
  },
  {
    id: 1005,
    grade: 10,
    lesson: "Bài 2: Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam",
    question: "Sĩ quan Quân đội nhân dân Việt Nam phục vụ tại ngũ gồm mấy ngạch cơ bản?",
    options: [
      "Ngạch sĩ quan tại ngũ và ngạch sĩ quan dự bị",
      "Ngạch sĩ quan chỉ huy và ngạch sĩ quan tham mưu",
      "Ngạch sĩ quan lục quân và ngạch sĩ quan hải quân",
      "Ngạch sĩ quan chính trị và ngạch sĩ quan hậu cần"
    ],
    correctAnswer: 0,
    explanation: "Theo Luật Sĩ quan QĐND Việt Nam, sĩ quan gồm hai ngạch: Ngạch sĩ quan tại ngũ (đang phục vụ trong quân đội) và Ngạch sĩ quan dự bị (đã đăng ký vào ngạch dự bị để sẵn sàng động viên khi Tổ quốc cần)."
  },
  {
    id: 1006,
    grade: 10,
    lesson: "Bài 2: Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam",
    question: "Hệ thống cấp bậc quân hàm của sĩ quan Quân đội nhân dân Việt Nam gồm có mấy cấp?",
    options: [
      "3 cấp (Cấp Tướng, Cấp Tá, Cấp Úy)",
      "4 cấp (Cấp Tướng, Cấp Tá, Cấp Úy, Cấp Hạ sĩ quan)",
      "2 cấp (Cấp Chỉ huy, Cấp Binh sĩ)",
      "5 cấp (Thống tướng, Đại tướng, Thượng tướng, Tá, Úy)"
    ],
    correctAnswer: 0,
    explanation: "Sĩ quan Quân đội nhân dân Việt Nam có 3 cấp: Cấp Tướng (4 bậc: Đại tướng, Thượng tướng, Trung tướng, Thiếu tướng), Cấp Tá (4 bậc: Đại tá, Thượng tá, Trung tá, Thiếu tá) và Cấp Úy (4 bậc: Đại úy, Thượng úy, Trung úy, Thiếu úy)."
  },
  {
    id: 1007,
    grade: 10,
    lesson: "Bài 3: Ma tuý, tác hại của ma tuý và phòng, chống ma tuý trong trường học",
    question: "Chất nào sau đây được xếp vào nhóm chất ma tuý có nguồn gốc tự nhiên?",
    options: ["Thuốc phiện", "Heroin", "Ma tuý đá (Methamphetamine)", "Thuốc lắc (MDMA)"],
    correctAnswer: 0,
    explanation: "Thuốc phiện, cần sa, lá coca là các chất ma túy có nguồn gốc tự nhiên; Heroin là bán tổng hợp; còn ma túy đá, thuốc lắc, ketamine là ma túy tổng hợp."
  },
  {
    id: 1008,
    grade: 10,
    lesson: "Bài 3: Ma tuý, tác hại của ma tuý và phòng, chống ma tuý trong trường học",
    question: "Tác hại nguy hiểm nhất của việc tiêm chích ma tuý chung bơm kim tiêm là gì?",
    options: [
      "Nguy cơ lây nhiễm HIV/AIDS và các bệnh truyền nhiễm qua đường máu rất cao",
      "Làm giảm thị lực tạm thời",
      "Gây đau nhức các khớp xương nhẹ",
      "Tăng cân mất kiểm soát"
    ],
    correctAnswer: 0,
    explanation: "Tiêm chích ma túy bằng bơm kim tiêm dùng chung là một trong những con đường lây truyền HIV/AIDS, viêm gan B, viêm gan C nhanh và nguy hiểm nhất."
  },
  {
    id: 1009,
    grade: 10,
    lesson: "Bài 4: Phòng, chống vi phạm pháp luật về trật tự, an toàn giao thông",
    question: "Người đủ bao nhiêu tuổi trở lên thì được điều khiển xe mô tô hai bánh, xe mô tô ba bánh có dung tích xi lanh từ 50 cm3 trở lên?",
    options: ["Đủ 18 tuổi", "Đủ 16 tuổi", "Đủ 17 tuổi", "Đủ 20 tuổi"],
    correctAnswer: 0,
    explanation: "Theo Luật Giao thông đường bộ, người đủ 16 tuổi trở lên được lái xe gắn máy dưới 50 cm3; người đủ 18 tuổi trở lên mới được lái xe mô tô hai bánh từ 50 cm3 trở lên và phải có giấy phép lái xe hợp lệ."
  },
  {
    id: 1010,
    grade: 10,
    lesson: "Bài 4: Phòng, chống vi phạm pháp luật về trật tự, an toàn giao thông",
    question: "Hành vi nào sau đây của học sinh khi tham gia giao thông bằng xe đạp, xe đạp điện là vi phạm luật?",
    options: [
      "Đi xe dàn hàng ngang từ 3 xe trở lên và buông cả hai tay khi đang chạy",
      "Đội mũ bảo hiểm có cài quai đúng quy cách khi đi xe đạp điện",
      "Đi đúng phần đường, làn đường quy định bên phải",
      "Bật đèn báo rẽ trước khi chuyển hướng sang đường"
    ],
    correctAnswer: 0,
    explanation: "Hành vi dàn hàng ngang từ 3 xe trở lên, buông cả hai tay, lạng lách đánh võng, dùng ô, thiết bị âm thanh khi điều khiển phương tiện là những hành vi bị pháp luật nghiêm cấm."
  },
  {
    id: 1011,
    grade: 10,
    lesson: "Bài 5: Bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội",
    question: "An ninh quốc gia là gì theo định nghĩa của Luật An ninh quốc gia?",
    options: [
      "Là sự ổn định, phát triển bền vững của chế độ XHCN và Nhà nước CHXHCN Việt Nam, sự bất khả xâm phạm độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ",
      "Là việc giữ gìn trật tự công cộng trong các đô thị lớn",
      "Là việc quản lý vũ khí, vật liệu nổ của quân đội",
      "Là hoạt động tuần tra biên giới của lực lượng biên phòng"
    ],
    correctAnswer: 0,
    explanation: "Luật An ninh quốc gia quy định: An ninh quốc gia là sự ổn định, phát triển bền vững của chế độ XHCN và Nhà nước CHXHCN Việt Nam, sự bất khả xâm phạm độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ của Tổ quốc."
  },
  {
    id: 1012,
    grade: 10,
    lesson: "Bài 6: Một số hiểu biết về an ninh mạng",
    question: "Hành vi nào sau đây vi phạm nghiêm trọng Luật An ninh mạng?",
    options: [
      "Phát tán thông tin sai sự thật, xúc phạm danh dự nhân phẩm của người khác trên mạng xã hội",
      "Đổi mật khẩu tài khoản cá nhân định kỳ 3 tháng một lần",
      "Bật xác thực hai yếu tố (2FA) để bảo vệ hòm thư điện tử",
      "Chia sẻ các tài liệu học tập chính thống của Bộ Giáo dục và Đào tạo"
    ],
    correctAnswer: 0,
    explanation: "Hành vi tung tin giả, vu khống, bôi nhọ, xúc phạm nghiêm trọng danh dự người khác hoặc tuyên truyền chống phá Nhà nước trên không gian mạng là hành vi bị nghiêm cấm theo Luật An ninh mạng."
  },
  {
    id: 1013,
    grade: 10,
    lesson: "Bài 7: Tác hại của bom, mìn, đạn, vật liệu nổ và chất độc hoá học",
    question: "Khi bất ngờ phát hiện thấy vật lạ nghi ngờ là bom mìn hoặc đầu đạn sót lại sau chiến tranh, học sinh phải làm gì?",
    options: [
      "Tuyệt đối không chạm vào, giữ khoảng cách an toàn, đánh dấu cảnh báo và báo ngay cho chính quyền hoặc quân sự địa phương",
      "Dùng gậy gõ mạnh vào xem bên trong có thuốc nổ không",
      "Tự ý nhặt mang về trường hoặc bán phế liệu lấy tiền",
      "Đốt lửa xung quanh để kiểm tra độ phát nổ"
    ],
    correctAnswer: 0,
    explanation: "Nguyên tắc sống còn: Tuyệt đối không sờ, chạm, dịch chuyển vật nổ; cảnh báo mọi người xung quanh và báo ngay cho công an, ban chỉ huy quân sự nơi gần nhất xử lý."
  },
  {
    id: 1014,
    grade: 10,
    lesson: "Bài 7: Tác hại của bom, mìn, đạn, vật liệu nổ và chất độc hoá học",
    question: "Chất độc màu da cam mà quân đội Mỹ sử dụng trong chiến tranh Việt Nam chứa hàm lượng chất độc cực kỳ nguy hiểm nào?",
    options: ["Dioxin", "Thủy ngân", "Photpho trắng", "Xyanua"],
    correctAnswer: 0,
    explanation: "Chất độc màu da cam chứa hàm lượng rất lớn Dioxin – một trong những hợp chất độc hại nhất mà con người từng biết đến, gây di chứng quái thai, ung thư qua nhiều thế hệ."
  },
  {
    id: 1015,
    grade: 10,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    question: "Thế nào là 'Vật che khuất' trong nghệ thuật chiến thuật?",
    options: [
      "Vật có thể che giấu được hành động của ta nhưng không có tác dụng chống đạn bắn xuyên qua",
      "Vật vừa che giấu được hành động vừa cản được mảnh bom và đạn bắn thẳng",
      "Là khoảng đất trống trải không có cây cối hay mương rãnh",
      "Là các mục tiêu giả do quân địch dựng lên để đánh lừa ta"
    ],
    correctAnswer: 0,
    explanation: "Vật che khuất (như bụi cây, rèm cỏ, đồi sậy) chỉ che mắt nhìn của địch, đạn vẫn có thể xuyên qua. Vật che đỡ (như bờ ruộng kiên cố, tảng đá lớn, ụ đất dày) mới cản được đạn."
  },
  {
    id: 1016,
    grade: 10,
    lesson: "Bài 9: Đội ngũ từng người không có súng",
    question: "Khi thực hiện động tác quay bên phải, người chỉ huy hô khẩu lệnh như thế nào?",
    options: [
      "Khẩu lệnh có dự lệnh và động lệnh: 'Bên phải - QUAY!'",
      "Chỉ hô động lệnh: 'QUAY!'",
      "Chỉ hô dự lệnh: 'Bên phải!'",
      "Khẩu lệnh: 'Đằng sau - QUAY!'"
    ],
    correctAnswer: 0,
    explanation: "Động tác quay tại chỗ có khẩu lệnh gồm dự lệnh 'Bên phải' (kéo dài) và động lệnh 'QUAY' (dứt khoát)."
  },
  {
    id: 1017,
    grade: 10,
    lesson: "Bài 9: Đội ngũ từng người không có súng",
    question: "Khi thực hiện động tác 'Quay đằng sau', người chiến sĩ dùng gót chân nào và mũi bàn chân nào làm trụ?",
    options: [
      "Lấy gót chân phải và mũi bàn chân trái làm trụ, quay sang bên phải 180 độ",
      "Lấy gót chân trái và mũi bàn chân phải làm trụ, quay sang bên trái 180 độ",
      "Lấy cả hai gót chân làm trụ quay tự do",
      "Nhảy bật lên không trung xoay 180 độ"
    ],
    correctAnswer: 0,
    explanation: "Động tác Quay đằng sau: Lấy gót chân phải và mũi bàn chân trái làm trụ, quay người sang phía bên phải một góc 180 độ, sau đó kéo chân trái lên đặt sát gót chân phải."
  },
  {
    id: 1018,
    grade: 10,
    lesson: "Bài 10: Đội ngũ tiểu đội",
    question: "Các bước thực hiện chỉ huy đội hình tiểu đội hàng ngang gồm mấy bước theo thứ tự?",
    options: [
      "4 bước: Tập hợp -> Điểm số -> Chỉnh đốn hàng ngũ -> Giải tán",
      "3 bước: Điểm số -> Tập hợp -> Hành tiến",
      "2 bước: Chỉnh đốn hàng ngũ -> Giải tán",
      "5 bước: Điểm số -> Chạy đều -> Tập hợp -> Chỉnh đốn -> Nghỉ"
    ],
    correctAnswer: 0,
    explanation: "Trình tự 4 bước chỉ huy đội hình tiểu đội gồm: Bước 1: Tập hợp; Bước 2: Điểm số; Bước 3: Chỉnh đốn hàng ngũ; Bước 4: Giải tán."
  },
  {
    id: 1019,
    grade: 10,
    lesson: "Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu",
    question: "Động tác 'Bò cao' thường được vận dụng trong điều kiện chiến đấu nào?",
    options: [
      "Nơi có địa hình che khuất che đỡ cao ngang tầm ngực hoặc đêm tối gần địch cần vận chuyển vũ khí đạn dược bí mật",
      "Nơi bãi đất trống trải hoàn toàn dưới ánh sáng ban ngày",
      "Khi vượt qua chướng ngại vật rào thép gai sát mặt đất",
      "Khi cơ động trên đường cao tốc hành quân thần tốc"
    ],
    correctAnswer: 0,
    explanation: "Bò cao được áp dụng ở nơi địa hình có vật che khuất, che đỡ cao ngang tầm ngực, hoặc đêm tối, sương mù; thường dùng để mang vác trang bị, chuyển thương hoặc tiếp cận địch."
  },
  {
    id: 1020,
    grade: 10,
    lesson: "Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu",
    question: "Động tác 'Trườn' trong chiến đấu thường được áp dụng khi nào?",
    options: [
      "Khi địa hình trống trải, vật che khuất che đỡ rất thấp (dưới 30cm) hoặc hỏa lực địch bắn thẳng rất rát",
      "Khi chạy vượt qua cây cầu lớn",
      "Khi vận động trong chiến hào sâu quá đầu người",
      "Khi hành quân trên đường nhựa ban ngày"
    ],
    correctAnswer: 0,
    explanation: "Trườn là động tác áp sát toàn bộ thân mình xuống mặt đất, áp dụng khi hỏa lực địch dày đặc, vật che đỡ che khuất rất thấp nhằm thu nhỏ tối đa diện tích mục tiêu tiếp xúc."
  },
  {
    id: 1021,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    question: "Khi tiến hành đặt garo cầm máu cho vết thương đứt động mạch ở tứ chi, vị trí đặt garo chuẩn là ở đâu?",
    options: [
      "Đặt sát phía trên mép vết thương từ 2 đến 3 cm (về phía tim)",
      "Đặt trực tiếp đè lên trên miệng vết thương đang chảy máu",
      "Đặt cách xa vết thương 20 đến 30 cm",
      "Đặt ở phía dưới mép vết thương (về phía ngọn chi)"
    ],
    correctAnswer: 0,
    explanation: "Garo phải đặt sát phía trên miệng vết thương từ 2 đến 3 cm (phía dòng máu từ tim chảy tới) có lót vải gạc để tránh hoại tử mô dưới dây garo."
  },
  {
    id: 1022,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    question: "Thời gian quy định nới garo định kỳ khi vận chuyển nạn nhân đến bệnh viện là bao lâu một lần?",
    options: [
      "Cứ sau 45 đến 60 phút phải nới garo một lần (mỗi lần nới 1-2 phút)",
      "Cứ sau 5 phút phải nới garo một lần",
      "Không bao giờ được nới garo cho đến khi bác sĩ phẫu thuật",
      "Cứ sau 4 đến 5 tiếng mới cần nới garo"
    ],
    correctAnswer: 0,
    explanation: "Quy tắc vàng: Garo không được để quá 1,5 - 2 giờ liên tục. Cứ 45 - 60 phút phải nới garo 1 lần từ 1 - 2 phút để máu nuôi phần chi phía dưới, tránh hoại tử dẫn đến cưa cụt chi."
  },
  {
    id: 1023,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    question: "Nguyên tắc cố định xương gãy là gì?",
    options: [
      "Bất động được cả khớp trên và khớp dưới của ổ gãy xương",
      "Chỉ cần bó chặt ngay vị trí xương gãy",
      "Nắn bóp mạnh xương gãy thẳng hàng trước khi nẹp",
      "Để nạn nhân đứng dậy đi lại ngay để thử khớp xương"
    ],
    correctAnswer: 0,
    explanation: "Nguyên tắc bất di bất dịch trong sơ cứu gãy xương: Nẹp phải cố định được cả khớp trên và khớp dưới của đoạn xương bị gãy, không nắn chỉnh xương hở tại hiện trường."
  },
  {
    id: 1024,
    grade: 10,
    lesson: "Bài 2: Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam",
    question: "Luật Giáo dục Quốc phòng và An ninh quy định môn học GDQP-AN trong trường THPT là:",
    options: [
      "Môn học chính khóa bắt buộc",
      "Môn học tự chọn không tính điểm",
      "Môn sinh hoạt ngoại khóa tự nguyện",
      "Môn học chỉ dành cho nam sinh"
    ],
    correctAnswer: 0,
    explanation: "Theo Luật GDQP&AN, giáo dục quốc phòng và an ninh trong trường THPT, cơ sở giáo dục nghề nghiệp và đại học là môn học chính khóa bắt buộc đối với mọi học sinh, sinh viên."
  },
  {
    id: 1025,
    grade: 10,
    lesson: "Bài 3: Ma tuý, tác hại của ma tuý và phòng, chống ma tuý trong trường học",
    question: "Ma túy đá (chứa Methamphetamine) gây tác hại đặc biệt nguy hiểm nào đối với tâm thần kinh người sử dụng?",
    options: [
      "Gây ảo giác nặng nề, hoang tưởng bị hại, dẫn tới hành vi bạo lực ('ngáo đá')",
      "Làm tăng khả năng tập trung học tập lâu dài",
      "Giúp tinh thần luôn an yên, thư giãn",
      "Tăng cường trí nhớ và phản xạ vận động"
    ],
    correctAnswer: 0,
    explanation: "Methamphetamine phá hủy hệ thống tế bào thần kinh, gây hoang tưởng, ảo giác bị truy sát dẫn tới các hành vi mất kiểm soát, chém giết vô cớ cực kỳ nguy hiểm cho xã hội."
  },
  {
    id: 1026,
    grade: 10,
    lesson: "Bài 4: Phòng, chống vi phạm pháp luật về trật tự, an toàn giao thông",
    question: "Biển báo giao thông hình tròn, viền đỏ, nền trắng, hình vẽ màu đen là loại biển báo gì?",
    options: ["Biển báo cấm", "Biển báo nguy hiểm", "Biển hiệu lệnh", "Biển chỉ dẫn"],
    correctAnswer: 0,
    explanation: "Biển báo cấm có đặc điểm nhận diện: hình tròn, viền đỏ, nền trắng, trên nền có hình vẽ hoặc chữ số, chữ viết màu đen thể hiện điều cấm."
  },
  {
    id: 1027,
    grade: 10,
    lesson: "Bài 5: Bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội",
    question: "Lực lượng nào là nòng cốt trong sự nghiệp bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội?",
    options: [
      "Công an nhân dân",
      "Dân quân tự vệ",
      "Lực lượng hải quan",
      "Đoàn thanh niên cộng sản Hồ Chí Minh"
    ],
    correctAnswer: 0,
    explanation: "Theo Luật An ninh quốc gia và Luật CAND, lực lượng Công an nhân dân là lực lượng nòng cốt trong công cuộc bảo vệ an ninh quốc gia và trật tự an toàn xã hội."
  },
  {
    id: 1028,
    grade: 10,
    lesson: "Bài 6: Một số hiểu biết về an ninh mạng",
    question: "Để bảo đảm an toàn thông tin cá nhân trên mạng, học sinh KHÔNG NÊN làm điều gì?",
    options: [
      "Công khai số căn cước công dân, địa chỉ nhà và mật khẩu tài khoản cho người lạ trên mạng",
      "Đặt mật khẩu mạnh gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt",
      "Kiểm tra kỹ đường link trước khi nhấp vào để tránh trang web giả mạo (phishing)",
      "Đăng xuất khỏi tài khoản mạng xã hội khi sử dụng máy tính công cộng"
    ],
    correctAnswer: 0,
    explanation: "Học sinh tuyệt đối không công khai thông tin cá nhân nhạy cảm, số CCCD, thẻ ngân hàng hay mật khẩu trên mạng xã hội để tránh bị kẻ xấu lợi dụng lừa đảo."
  },
  {
    id: 1029,
    grade: 10,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    question: "Khi tiến lại gần vật che khuất hoặc che đỡ, góc tiếp cận của chiến sĩ cần tuân thủ nguyên tắc gì?",
    options: [
      "Tiếp cận từ phía sau hoặc mép của vật, triệt để hạ thấp tư thế, không làm rung động cây cỏ",
      "Đứng thẳng người giơ súng lên cao",
      "Chạy thẳng vào chính diện với tốc độ cao nhất",
      "Gõ vào vật che đỡ để thử độ chắc chắn"
    ],
    correctAnswer: 0,
    explanation: "Tiếp cận vật che khuất phải từ phía sau, men theo gờ mép, hạ thấp trọng tâm và chú ý không làm rung động cành cây khiến địch phát hiện dấu vết."
  },
  {
    id: 1030,
    grade: 10,
    lesson: "Bài 9: Đội ngũ từng người không có súng",
    question: "Động tác 'Đi đều' có độ dài bước chân chuẩn của học sinh phổ thông là khoảng bao nhiêu?",
    options: ["60 cm - 70 cm", "30 cm - 40 cm", "90 cm - 100 cm", "120 cm"],
    correctAnswer: 0,
    explanation: "Độ dài bước chân đi đều quy chuẩn đối với học sinh là khoảng 60 - 70 cm, tốc độ đi đều khoảng 106 - 110 bước/phút."
  },
  {
    id: 1031,
    grade: 10,
    lesson: "Bài 10: Đội ngũ tiểu đội",
    question: "Trong đội hình tiểu đội 1 hàng ngang, vị trí của Tiểu đội trưởng đứng ở đâu khi tập hợp?",
    options: [
      "Đứng bên phải đội hình của tiểu đội",
      "Đứng chính giữa phía sau hàng ngũ",
      "Đứng bên trái người cuối cùng",
      "Đứng cách xa đội hình 20 mét"
    ],
    correctAnswer: 0,
    explanation: "Trong đội hình tiểu đội hàng ngang, Tiểu đội trưởng là người đứng đầu bên phải hàng ngũ làm chuẩn cho toàn tiểu đội gióng hàng."
  },
  {
    id: 1032,
    grade: 10,
    lesson: "Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu",
    question: "Động tác 'Đi khom' và 'Chạy khom' khác nhau cơ bản ở điểm nào?",
    options: [
      "Tốc độ vận động và cự ly cơ động: Chạy khom nhanh hơn, áp dụng khi cần vượt nhanh qua hỏa lực địch",
      "Đi khom mang súng sau lưng, chạy khom vứt súng đi",
      "Đi khom dùng cho ban đêm, chạy khom chỉ dùng ban ngày",
      "Chạy khom người phải đứng thẳng hoàn toàn"
    ],
    correctAnswer: 0,
    explanation: "Đi khom dùng khi tiếp cận gần địch nhẹ nhàng, giữ bí mật; Chạy khom thực hiện khi cần cơ động thật nhanh qua bãi trống hoặc khu vực địch đang bắn rát."
  },
  {
    id: 1033,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    question: "Khi sơ cứu vết thương thủng ngực hở (khí phế mạc hở), việc đầu tiên cần làm là gì?",
    options: [
      "Bịt kín ngay vết thương ngực bằng miếng gạc vô trùng không thấm khí (đặt nilon và băng ép chặt)",
      "Để vết thương thông thoáng cho không khí lưu thông",
      "Đổ cồn 90 độ trực tiếp vào màng phổi",
      "Kéo nạn nhân đứng dậy chạy bộ về trạm y tế"
    ],
    correctAnswer: 0,
    explanation: "Thủng ngực hở khiến phổi xẹp do tràn khí màng phổi. Cần lập tức bịt kín vết thương bằng miếng nilon hoặc gạc vô trùng rồi băng ép chặt để cứu sống nạn nhân."
  },
  {
    id: 1034,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    question: "Lời thề thứ mấy trong 10 Lời thề danh dự của quân nhân QĐND Việt Nam nhấn mạnh: 'Hy sinh tất cả vì Tổ quốc Việt Nam'?",
    options: ["Lời thề thứ nhất", "Lời thề thứ năm", "Lời thề thứ bảy", "Lời thề thứ mười"],
    correctAnswer: 0,
    explanation: "Lời thề thứ nhất mở đầu: 'Hy sinh tất cả vì Tổ quốc Việt Nam; dưới sự lãnh đạo của Đảng Cộng sản Việt Nam...' thể hiện lòng trung thành tuyệt đối với Tổ quốc."
  },
  {
    id: 1035,
    grade: 10,
    lesson: "Bài 2: Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam",
    question: "Cấp bậc quân hàm cao nhất của sĩ quan Quân đội nhân dân Việt Nam là gì?",
    options: ["Đại tướng", "Thượng tướng", "Trung tướng", "Đại tá"],
    correctAnswer: 0,
    explanation: "Đại tướng là cấp bậc quân hàm sĩ quan cao nhất của Quân đội nhân dân Việt Nam cũng như Công an nhân dân Việt Nam."
  },
  {
    id: 1036,
    grade: 10,
    lesson: "Bài 3: Ma tuý, tác hại của ma tuý và phòng, chống ma tuý trong trường học",
    question: "Cỏ Mỹ thực chất là loại ma túy nào và có tác hại ra sao?",
    options: [
      "Là thảo mộc tẩm cần sa tổng hợp, độc hại gấp nhiều lần cần sa tự nhiên và gây loạn thần nghiêm trọng",
      "Là loại cỏ thuốc nam chữa bệnh mất ngủ",
      "Là thực phẩm chức năng bổ sung vitamin",
      "Là nước giải khát tăng lực không chứa chất kích thích"
    ],
    correctAnswer: 0,
    explanation: "'Cỏ Mỹ' là lá cây được tẩm ướp hóa chất cần sa tổng hợp (synthetic cannabinoids), gây ảo giác hoang tưởng cực mạnh, suy tim và tổn thương não vĩnh viễn."
  },
  {
    id: 1037,
    grade: 10,
    lesson: "Bài 4: Phòng, chống vi phạm pháp luật về trật tự, an toàn giao thông",
    question: "Nồng độ cồn trong máu hoặc hơi thở của người điều khiển xe mô tô, xe ô tô tham gia giao thông theo Luật Phòng chống tác hại của rượu bia quy định thế nào?",
    options: [
      "Nghiêm cấm hoàn toàn điều khiển phương tiện khi trong máu hoặc hơi thở có nồng độ cồn",
      "Được phép có dưới 0.25 mg/lít khí thở",
      "Được phép có dưới 50 mg/100 ml máu",
      "Không có quy định cấm nồng độ cồn"
    ],
    correctAnswer: 0,
    explanation: "Luật Phòng, chống tác hại của rượu, bia và Luật GTĐB quy định nghiêm cấm tuyệt đối hành vi điều khiển phương tiện giao thông mà trong máu hoặc hơi thở có nồng độ cồn (Zero tolerance)."
  },
  {
    id: 1038,
    grade: 10,
    lesson: "Bài 5: Bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội",
    question: "Học sinh THPT cần làm gì để góp phần bảo vệ an ninh trật tự tại địa phương?",
    options: [
      "Tích cực tham gia phong trào Toàn dân bảo vệ an ninh Tổ quốc, không tin, không nghe theo luận điệu xuyên tạc",
      "Tự ý lập chốt kiểm tra giấy tờ của người đi đường",
      "Tự ý mua sắm súng đạn để bảo vệ trường học",
      "Im lặng giấu giếm khi thấy bạn bè bị kẻ xấu dụ dỗ phạm pháp"
    ],
    correctAnswer: 0,
    explanation: "Trách nhiệm học sinh là chấp hành nghiêm chỉnh pháp luật, tham gia phong trào bảo vệ an ninh Tổ quốc, cảnh giác trước thông tin xấu độc và báo cáo kịp thời khi phát hiện vi phạm."
  },
  {
    id: 1039,
    grade: 10,
    lesson: "Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu",
    question: "Khi thực hiện động tác 'Lê', người chiến sĩ dùng những bộ phận nào của cơ thể để tiếp đất và đẩy người tiến lên?",
    options: [
      "Nghiêng người về một bên, dùng cẳng tay và cẳng chân để đẩy và kéo thân người",
      "Chỉ dùng hai bàn chân",
      "Chỉ dùng hai đầu ngón tay",
      "Lăn tròn cả thân mình trên đất cát"
    ],
    correctAnswer: 0,
    explanation: "Động tác Lê: Nghiêng người về bên trái (hoặc phải), lấy cẳng tay và má ngoài cẳng chân tì xuống đất, dùng sức co đẩy của tay và chân để trượt người tới trước mà súng vẫn trong tư thế sẵn sàng bắn."
  },
  {
    id: 1040,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    question: "Cáng thương chuyên dụng dùng để chuyển thương nhân có đặc điểm gì quan trọng?",
    options: [
      "Mặt cáng căng đều, chắc chắn, có dây đai cố định nạn nhân tránh rơi ngã khi qua địa hình gồ ghề",
      "Bề mặt cáng làm bằng sắt mỏng sắc nhọn",
      "Cáng không có tay cầm",
      "Chỉ dành cho việc vận chuyển hàng hóa đạn dược"
    ],
    correctAnswer: 0,
    explanation: "Cáng thương chuẩn dã chiến có vải bạt hoặc lưới chịu lực tốt, tay khiêng êm ái và có đai giằng giữ nạn nhân an toàn qua khe suối, dốc núi."
  }
];

export const BANK_MCQ_11: MultipleChoiceQuestion[] = [
  {
    id: 1101,
    grade: 11,
    lesson: "Bài 1: Bảo vệ Tổ quốc Việt Nam xã hội chủ nghĩa sau năm 1975",
    question: "Cuộc chiến tranh bảo vệ biên giới Tây Nam của Tổ quốc diễn ra chống lại tập đoàn phản động nào?",
    options: ["Tập đoàn phản động Pôn Pốt - Iêng Xari", "Quân đội viễn chinh Pháp", "Quân viễn chinh Mỹ", "Quân đội Tưởng Giới Thạch"],
    correctAnswer: 0,
    explanation: "Chiến tranh bảo vệ biên giới Tây Nam diễn ra từ năm 1975 đến năm 1979 chống lại hành động xâm lấn, tàn sát dã man đồng bào ta của tập đoàn Pôn Pốt - Iêng Xari."
  },
  {
    id: 1102,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    question: "Độ tuổi gọi công dân nhập ngũ trong thời bình theo Luật Nghĩa vụ quân sự năm 2015 là từ bao nhiêu tuổi?",
    options: [
      "Từ đủ 18 tuổi đến hết 25 tuổi (kéo dài đến hết 27 tuổi với công dân tốt nghiệp ĐH, CĐ)",
      "Từ đủ 17 tuổi đến hết 30 tuổi",
      "Từ đủ 19 tuổi đến hết 28 tuổi",
      "Từ đủ 18 tuổi đến hết 35 tuổi"
    ],
    correctAnswer: 0,
    explanation: "Điều 30 Luật NVQS 2015 quy định: Độ tuổi gọi nhập ngũ từ đủ 18 tuổi đến hết 25 tuổi; đối với công dân được đào tạo trình độ cao đẳng, đại học đã được tạm hoãn thì gọi nhập ngũ đến hết 27 tuổi."
  },
  {
    id: 1103,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    question: "Thời hạn phục vụ tại ngũ trong thời bình của hạ sĩ quan, binh sĩ là bao nhiêu tháng?",
    options: ["24 tháng", "12 tháng", "18 tháng", "36 tháng"],
    correctAnswer: 0,
    explanation: "Theo Điều 21 Luật Nghĩa vụ quân sự năm 2015, thời hạn phục vụ tại ngũ trong thời bình của hạ sĩ quan, binh sĩ là 24 tháng."
  },
  {
    id: 1104,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    question: "Công dân nam đủ bao nhiêu tuổi thì phải đăng ký nghĩa vụ quân sự lần đầu?",
    options: ["Đủ 17 tuổi trong năm", "Đủ 18 tuổi tròn", "Đủ 16 tuổi", "Đủ 20 tuổi"],
    correctAnswer: 0,
    explanation: "Theo Điều 12 Luật NVQS 2015, công dân nam đủ 17 tuổi trong năm có trách nhiệm đến cơ quan quân sự cấp xã/phường để đăng ký nghĩa vụ quân sự lần đầu vào tháng 4 hàng năm."
  },
  {
    id: 1105,
    grade: 11,
    lesson: "Bài 3: Phòng chống vi phạm pháp luật trên không gian mạng",
    question: "Phương thức tấn công mạng 'Phishing' là hình thức tấn công như thế nào?",
    options: [
      "Giả mạo các tổ chức uy tín (ngân hàng, cơ quan nhà nước) để lừa người dùng cung cấp mật khẩu, mã OTP",
      "Cắt đứt dây cáp quang biển bằng thiết bị cơ học",
      "Gây nhiễu sóng radio của các đài phát thanh địa phương",
      "Cài đặt phần mềm diệt virus chính hãng vào máy tính cá nhân"
    ],
    correctAnswer: 0,
    explanation: "Phishing (tấn công giả mạo) sử dụng email, tin nhắn hoặc website có giao diện y hệt ngân hàng/mạng xã hội để đánh cắp tên đăng nhập, mật khẩu và mã OTP của nạn nhân."
  },
  {
    id: 1106,
    grade: 11,
    lesson: "Bài 4: Một số vấn đề về vi phạm pháp luật bảo vệ môi trường",
    question: "Hành vi nào sau đây bị nghiêm cấm theo Luật Bảo vệ môi trường?",
    options: [
      "Chôn lấp, đổ chất thải độc hại, phóng xạ trái quy định ra môi trường",
      "Phân loại rác thải tại nguồn trước khi thu gom",
      "Trồng cây xanh bóng mát trong khuôn viên trường học",
      "Sử dụng túi vải tái sử dụng nhiều lần thay cho túi nilon dùng một lần"
    ],
    correctAnswer: 0,
    explanation: "Luật Bảo vệ môi trường nghiêm cấm việc xả thải chưa qua xử lý đạt chuẩn, đổ trộm chất thải độc hại hoặc chất phóng xạ vào lòng đất, nguồn nước và không khí."
  },
  {
    id: 1107,
    grade: 11,
    lesson: "Bài 5: Kiến thức phổ thông về phòng không nhân dân",
    question: "Mục tiêu cơ bản của công tác Phòng không nhân dân là gì?",
    options: [
      "Bảo vệ tính mạng, tài sản của nhân dân, giảm thiểu thiệt hại do địch đánh phá đường không và chi viện cho phòng thủ tác chiến",
      "Xây dựng các giàn khoan dầu khí ngoài khơi",
      "Mua sắm phương tiện giao thông công cộng",
      "Quản lý việc khai thác rừng đầu nguồn"
    ],
    correctAnswer: 0,
    explanation: "Phòng không nhân dân là tổng thể các biện pháp tổ chức, chuẩn bị và thực hành đánh địch, sơ tán phân tán, phòng tránh và khắc phục hậu quả đòn tiến công đường không của địch."
  },
  {
    id: 1108,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Cỡ nòng và loại đạn của súng tiểu liên AK-47 là bao nhiêu?",
    options: [
      "Cỡ nòng 7,62 mm, sử dụng đạn cỡ 7,62 x 39 mm (đạn kiểu K56)",
      "Cỡ nòng 5,56 mm, sử dụng đạn M193",
      "Cỡ nòng 9 mm, sử dụng đạn súng ngắn Makarov",
      "Cỡ nòng 12,7 mm, sử dụng đạn cao xạ"
    ],
    correctAnswer: 0,
    explanation: "Súng tiểu liên AK cỡ 7,62 mm, bắn đạn cỡ 7,62 x 39 mm do Liên Xô thiết kế, Việt Nam gọi là đạn K56."
  },
  {
    id: 1109,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Tầm bắn hiệu quả đối với mục tiêu mặt đất của súng tiểu liên AK là bao nhiêu?",
    options: ["400 mét", "1000 mét", "800 mét", "1500 mét"],
    correctAnswer: 0,
    explanation: "Tầm bắn ghi trên thước ngắm là 800m (AK) hoặc 1000m (AKM), nhưng tầm bắn hiệu quả nhất đối với mục tiêu mặt đất là 400m; bắn máy bay và quân nhảy dù là 500m."
  },
  {
    id: 1110,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Hộp tiếp đạn của súng tiểu liên AK chứa được bao nhiêu viên đạn?",
    options: ["30 viên", "20 viên", "10 viên", "40 viên"],
    correctAnswer: 0,
    explanation: "Hộp tiếp đạn cong hình quả chuối của súng tiểu liên AK có sức chứa tiêu chuẩn 30 viên đạn."
  },
  {
    id: 1111,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Hộp tiếp đạn của súng trường bán tự động CKC chứa được bao nhiêu viên đạn?",
    options: ["10 viên (lắp cố định trong thân súng)", "30 viên", "5 viên", "20 viên"],
    correctAnswer: 0,
    explanation: "Súng trường CKC có hộp tiếp đạn chứa 10 viên đạn được gắn cố định trong thân súng, nạp đạn bằng kẹp đạn 10 viên từ phía trên."
  },
  {
    id: 1112,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Thuốc nổ TNT (Trinitrotoluen) có đặc tính an toàn vật lý nổi bật nào?",
    options: [
      "Tương đối ổn định, va đập thông thường hay đốt cháy ở áp suất khí quyển không nổ, chỉ nổ khi có kíp kích nổ mạnh",
      "Rất nhạy nổ, va chạm nhẹ bằng ngón tay là phát nổ ngay",
      "Hòa tan hoàn toàn trong nước mát",
      "Bốc cháy tự do tạo ra oxy nguyên chất"
    ],
    correctAnswer: 0,
    explanation: "Thuốc nổ TNT rất an toàn trong bảo quản vận chuyển, đạn bắn xuyên qua không nổ, đốt cháy tự do không nổ, muốn nổ phải có sóng xung kích của kíp nổ số 8 kích hoạt."
  },
  {
    id: 1113,
    grade: 11,
    lesson: "Bài 7: Pháp luật về quản lý vũ khí, vật liệu nổ và công cụ hỗ trợ",
    question: "Hành vi nào sau đây bị pháp luật Việt Nam nghiêm cấm tuyệt đối?",
    options: [
      "Chế tạo, tàng trữ, vận chuyển, sử dụng, mua bán trái phép vũ khí quân dụng và súng săn tự chế",
      "Giao nộp vũ khí sót lại sau chiến tranh cho cơ quan công an địa phương",
      "Học sinh tập ngắm súng tiểu liên AK mô hình gỗ trong giờ học GDQP-AN",
      "Chiến sĩ biên phòng mang vũ khí tuần tra bảo vệ biên giới theo kế hoạch"
    ],
    correctAnswer: 0,
    explanation: "Luật Quản lý vũ khí, vật liệu nổ quy định nghiêm cấm mọi hành vi cá nhân tự chế, tàng trữ, mua bán, sử dụng trái phép các loại vũ khí, súng hơi cay, súng tự chế."
  },
  {
    id: 1114,
    grade: 11,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    question: "So với 'Vật che khuất', 'Vật che đỡ' có ưu thế vượt trội nào?",
    options: [
      "Vừa che giấu được hành động vừa có khả năng chống được đạn bắn thẳng và mảnh bom đạn",
      "Có màu sắc sặc sỡ hơn",
      "Trọng lượng nhẹ hơn rất nhiều",
      "Dễ di chuyển từ vị trí này sang vị trí khác bằng tay không"
    ],
    correctAnswer: 0,
    explanation: "Vật che đỡ là các vật thể kiên cố (như gốc cây to, tảng đá lớn, bờ đất dày) vừa che mắt địch, vừa có khả năng hấp thụ động năng cản mảnh đạn, bảo vệ an toàn tính mạng người bắn."
  },
  {
    id: 1115,
    grade: 11,
    lesson: "Bài 9: Nhìn, nghe, phát hiện địch, chỉ mục tiêu, truyền tin liên lạc",
    question: "Khi thực hiện nghe ngóng âm thanh của địch trong đêm tối, quy luật truyền âm trong không khí như thế nào?",
    options: [
      "Âm thanh truyền theo chiều xuôi gió đi xa hơn và rõ hơn so với chiều ngược gió",
      "Âm thanh truyền ngược gió đi xa hơn",
      "Gió không có bất kỳ ảnh hưởng nào đến cự ly truyền âm",
      "Ban đêm âm thanh truyền kém hơn ban ngày"
    ],
    correctAnswer: 0,
    explanation: "Theo vật lý chiến thuật, âm thanh xuôi theo chiều gió sẽ truyền đi xa và rõ hơn rất nhiều. Ngoài ra, ban đêm không khí tĩnh lặng và độ ẩm cao nên nghe âm thanh rõ hơn ban ngày."
  },
  {
    id: 1116,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    question: "Lựu đạn F-1 của Việt Nam là loại lựu đạn gì và bán kính sát thương của mảnh văng là bao nhiêu?",
    options: [
      "Lựu đạn phòng ngự, bán kính sát thương của mảnh văng lên tới 20 mét",
      "Lựu đạn tấn công, bán kính sát thương chỉ 2 mét",
      "Lựu đạn khói, không có khả năng gây sát thương",
      "Lựu đạn cay chống bạo động thể thao"
    ],
    correctAnswer: 0,
    explanation: "Lựu đạn F-1 là loại lựu đạn phòng ngự gang khía, trọng lượng 600g, khi nổ tạo ra các mảnh văng nguy hiểm với bán kính sát thương lên tới 20m (người ném bắt buộc phải ở trong công sự kiên cố)."
  },
  {
    id: 1117,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    question: "Thời gian cháy chậm từ khi mỏ vịt bung ra đến khi lựu đạn F-1 phát nổ là bao nhiêu giây?",
    options: ["Từ 3,2 giây đến 4,2 giây", "Từ 10 giây đến 15 giây", "Từ 0,5 giây đến 1 giây", "Sau 1 phút"],
    correctAnswer: 0,
    explanation: "Thời gian cháy chậm của kíp nổ lựu đạn F-1 và LĐ-97 tiêu chuẩn là 3,2 đến 4,2 giây để đảm bảo người ném kịp ném lựu đạn tới mục tiêu trước khi nổ."
  },
  {
    id: 1118,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Tốc độ bắn lý thuyết của súng tiểu liên AK là bao nhiêu phát/phút?",
    options: ["600 phát/phút", "100 phát/phút", "40 phát/phút", "1200 phát/phút"],
    correctAnswer: 0,
    explanation: "Tốc độ bắn lý thuyết của súng AK là 600 phát/phút; tốc độ bắn chiến đấu bắn phát một khoảng 40 phát/phút, bắn liên thanh khoảng 100 phát/phút."
  },
  {
    id: 1119,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Sơ tốc đầu đạn của súng tiểu liên AK-47 là bao nhiêu?",
    options: ["710 m/s", "300 m/s", "1000 m/s", "500 m/s"],
    correctAnswer: 0,
    explanation: "Sơ tốc đầu đạn của AK-47 là 710 m/s; của AKM cải tiến là 715 m/s."
  },
  {
    id: 1120,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    question: "Học sinh THPT có thuộc đối tượng được tạm hoãn gọi nhập ngũ trong thời bình không?",
    options: [
      "Có, đang học tại cơ sở giáo dục phổ thông thì được tạm hoãn gọi nhập ngũ",
      "Không, cứ đủ 18 tuổi là bắt buộc phải nghỉ học nhập ngũ ngay",
      "Chỉ được tạm hoãn nếu đạt danh hiệu học sinh xuất sắc",
      "Chỉ được tạm hoãn nếu gia đình làm đơn xin cứu xét"
    ],
    correctAnswer: 0,
    explanation: "Điểm g Khoản 1 Điều 41 Luật NVQS 2015 quy định: Tạm hoãn gọi nhập ngũ đối với công dân đang học tại cơ sở giáo dục phổ thông; đang được đào tạo trình độ đại học, cao đẳng chính quy."
  },
  {
    id: 1121,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    question: "Khi luyện tập ném lựu đạn thật, quy tắc an toàn nghiêm ngặt hàng đầu là gì?",
    options: [
      "Chỉ được ném khi có khẩu lệnh của người chỉ huy, hướng ném vào khu vực thao trường an toàn đã phong tỏa",
      "Tự do rút chốt ném thử để xem tầm xa",
      "Thi ném xem ai giữ lựu đạn trên tay lâu hơn trước khi ném",
      "Ném lựu đạn về phía có đông người đứng xem để cổ vũ"
    ],
    correctAnswer: 0,
    explanation: "Quy tắc an toàn huấn luyện: Tuyệt đối chấp hành mệnh lệnh người chỉ huy; kiểm tra chốt kẹp, hướng ném bảo đảm cự ly an toàn cho người ném và thao trường."
  },
  {
    id: 1122,
    grade: 11,
    lesson: "Bài 7: Pháp luật về quản lý vũ khí, vật liệu nổ và công cụ hỗ trợ",
    question: "Vũ khí thể thao bao gồm những loại nào sau đây?",
    options: [
      "Súng trường bắn đạn chì, súng thể thao bắn đạn ghém, cung, nỏ phục vụ thi đấu thể thao",
      "Súng tiểu liên AK, súng trường CKC, đại liên K53",
      "Lựu đạn cay, mìn định hướng M18A1",
      "Bom hạt nhân, tên lửa hành trình"
    ],
    correctAnswer: 0,
    explanation: "Vũ khí thể thao là súng và vũ khí chế tạo để luyện tập, thi đấu thể thao (như súng bắn đĩa bay, súng trường thể thao cal 5.6mm, cung, nỏ thể thao)."
  },
  {
    id: 1123,
    grade: 11,
    lesson: "Bài 3: Phòng chống vi phạm pháp luật trên không gian mạng",
    question: "Khi nhận được tin nhắn từ tài khoản của người quen nhờ chuyển tiền gấp qua tài khoản lạ, việc cần làm ngay là gì?",
    options: [
      "Gọi điện thoại trực tiếp hoặc gặp mặt trực tiếp người đó để xác minh xem tài khoản có bị hack hay không",
      "Lập tức chuyển toàn bộ số tiền theo yêu cầu ngay",
      "Chụp ảnh thẻ ngân hàng và mã OTP gửi qua tin nhắn",
      "Xóa ngay tài khoản mạng xã hội của mình"
    ],
    correctAnswer: 0,
    explanation: "Đây là thủ đoạn lừa đảo chiếm quyền điều khiển tài khoản (hack nick). Luôn phải gọi điện trực tiếp bằng số điện thoại di động thông thường để kiểm chứng trước khi chuyển tiền."
  },
  {
    id: 1124,
    grade: 11,
    lesson: "Bài 4: Một số vấn đề về vi phạm pháp luật bảo vệ môi trường",
    question: "Tội phạm nào sau đây được quy định trong Bộ luật Hình sự Việt Nam liên quan đến môi trường?",
    options: [
      "Tội gây ô nhiễm môi trường; Tội hủy hoại nguồn lợi thủy sản; Tội hủy hoại rừng",
      "Tội trồng thêm cây xanh quanh đồi trọc",
      "Tội nhặt rác bảo vệ bờ biển",
      "Tội tuyên truyền tiết kiệm điện năng sinh hoạt"
    ],
    correctAnswer: 0,
    explanation: "Chương XIX Bộ luật Hình sự 2015 quy định các Tội phạm về môi trường bao gồm: Gây ô nhiễm môi trường, vi phạm quản lý chất thải nguy hại, hủy hoại rừng, buôn bán động vật hoang dã nguy cấp."
  },
  {
    id: 1125,
    grade: 11,
    lesson: "Bài 5: Kiến thức phổ thông về phòng không nhân dân",
    question: "Khi nghe thấy tiếng còi hú báo động phòng không liên hồi, người dân và học sinh cần lập tức làm gì?",
    options: [
      "Nhanh chóng di chuyển xuống hầm trú ẩn, hầm hào cá nhân hoặc tìm vật che đỡ chắc chắn, tắt nguồn điện lửa",
      "Chạy ra giữa sân trường đứng ngửa mặt lên trời quan sát máy bay",
      "Bật hết các thiết bị chiếu sáng công suất lớn",
      "Tụ tập đông người trên các tòa nhà cao tầng để quay video"
    ],
    correctAnswer: 0,
    explanation: "Khi có báo động phòng không, phải lập tức sơ tán vào công sự, hầm trú ẩn, ngắt điện ga để phòng chống cháy nổ và hạn chế tối đa thương vong từ bom đạn."
  },
  {
    id: 1126,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Khối lượng của súng tiểu liên AK-47 khi không có đạn là khoảng bao nhiêu?",
    options: ["3,8 kg", "1,5 kg", "6,5 kg", "10 kg"],
    correctAnswer: 0,
    explanation: "Khối lượng súng tiểu liên AK-47 không có đạn là 3,8 kg; khi lắp đầy 30 viên đạn là khoảng 4,3 kg (AKM cải tiến nhẹ hơn, không đạn chỉ nặng 3,1 kg)."
  },
  {
    id: 1127,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Thuốc nổ C4 có ưu điểm vượt trội gì trong công binh chiến thuật?",
    options: [
      "Có tính dẻo cao, dễ nhào nặn theo hình dạng mục tiêu, có sức công phá rất lớn",
      "Tự phát sáng trong đêm tối",
      "Uống được thay nước",
      "Không cần dùng kíp nổ vẫn phát nổ được"
    ],
    correctAnswer: 0,
    explanation: "Thuốc nổ dẻo C4 (thành phần chính là RDX pha chất dẻo hóa) có màu trắng ngà, dẻo như đất nặn giúp ốp sát vào kết cấu bê tông cốt thép, phá hủy mục tiêu cực kỳ hiệu quả."
  },
  {
    id: 1128,
    grade: 11,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    question: "Khi lợi dụng gốc cây to làm vật che đỡ để bắn súng, vị trí tì súng bắn chuẩn xác nhất là:",
    options: [
      "Bắn ở mép bên phải gốc cây (đối với người thuận tay phải)",
      "Bắn trực tiếp đè lên đỉnh chỏm ngọn cây cao",
      "Đứng hẳn ra ngoài trống cách xa gốc cây 3 mét",
      "Quay lưng vào gốc cây bắn ngược ra sau"
    ],
    correctAnswer: 0,
    explanation: "Người bắn thuận tay phải tì súng ở mép bên phải thân cây để toàn bộ thân mình ẩn nấp sau thân gỗ che đỡ, chỉ để lộ phần tối thiểu đầu và nòng súng."
  },
  {
    id: 1129,
    grade: 11,
    lesson: "Bài 9: Nhìn, nghe, phát hiện địch, chỉ mục tiêu, truyền tin liên lạc",
    question: "Phương pháp chỉ mục tiêu theo quy ước 'Phương pháp đồng hồ' lấy hướng nào làm hướng 12 giờ?",
    options: [
      "Hướng chính diện trước mặt người quan sát (hoặc hướng tiến quân)",
      "Hướng mặt trời mọc vào buổi sáng",
      "Hướng Bắc địa lý của la bàn",
      "Hướng tay phải người chỉ huy"
    ],
    correctAnswer: 0,
    explanation: "Quy ước đồng hồ quân sự: Hướng thẳng trước mặt là 12 giờ, bên phải là 3 giờ, phía sau lưng là 6 giờ, bên trái là 9 giờ."
  },
  {
    id: 1130,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    question: "Trong tư thế 'Đứng ném lựu đạn', khi lấy đà ném, chân nào bước lên trước (đối với người thuận tay phải)?",
    options: [
      "Chân trái bước lên trước một bước dài",
      "Chân phải bước lên trước",
      "Nhảy cả hai chân lên cao",
      "Ngồi bệt xuống đất"
    ],
    correctAnswer: 0,
    explanation: "Người ném tay phải: Chân trái bước lên một bước theo hướng ném, tay phải cầm lựu đạn vung từ trước xuống dưới ra sau, dùng sức rướn của thân và sức vút của cánh tay để ném xa."
  },
  {
    id: 1131,
    grade: 11,
    lesson: "Bài 1: Bảo vệ Tổ quốc Việt Nam xã hội chủ nghĩa sau năm 1975",
    question: "Thắng lợi của cuộc chiến tranh bảo vệ biên giới Tây Nam có ý nghĩa quốc tế to lớn nào?",
    options: [
      "Giúp nhân dân Campuchia thoát khỏi thảm họa diệt chủng của chế độ Khmer Đỏ",
      "Mở rộng diện tích lãnh thổ Việt Nam",
      "Xây dựng liên minh quân sự đa quốc gia",
      "Chấm dứt hoàn toàn chiến tranh lạnh trên thế giới"
    ],
    correctAnswer: 0,
    explanation: "Quân tình nguyện Việt Nam đã phối hợp cùng các lực lượng vũ trang cách mạng Campuchia lật đổ chế độ diệt chủng Pôn Pốt, cứu đất nước Chùa Tháp hồi sinh kỳ diệu."
  },
  {
    id: 1132,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    question: "Trường hợp nào sau đây được MIỄN gọi nhập ngũ trong thời bình?",
    options: [
      "Con của liệt sĩ; con của thương binh hạng một",
      "Học sinh có điểm thi đại học cao",
      "Công dân là lao động tự do tại các thành phố lớn",
      "Công dân có cân nặng trên 70 kg"
    ],
    correctAnswer: 0,
    explanation: "Điều 41 Luật NVQS quy định miễn gọi nhập ngũ đối với: Con của liệt sĩ, con của thương binh hạng một; một anh hoặc một em của liệt sĩ; một con của thương binh hạng hai..."
  },
  {
    id: 1133,
    grade: 11,
    lesson: "Bài 3: Phòng chống vi phạm pháp luật trên không gian mạng",
    question: "Hành vi sử dụng hình ảnh của bạn học ghép vào ảnh nhạy cảm rồi đăng lên mạng xã hội để chế giễu sẽ bị xử lý như thế nào?",
    options: [
      "Vi phạm pháp luật, bị xử phạt vi phạm hành chính hoặc truy cứu trách nhiệm hình sự về tội làm nhục người khác",
      "Chỉ là trò đùa vui vô hại, pháp luật không can thiệp",
      "Được khuyến khích để tăng tương tác trên mạng",
      "Chỉ bị nhà trường trừ điểm rèn luyện nhẹ nhàng"
    ],
    correctAnswer: 0,
    explanation: "Hành vi xúc phạm nghiêm trọng danh dự, nhân phẩm người khác trên không gian mạng có thể bị phạt tiền từ 10 - 20 triệu đồng (Nghị định 15/2020/NĐ-CP) hoặc bị phạt tù theo Điều 155 Bộ luật Hình sự."
  },
  {
    id: 1134,
    grade: 11,
    lesson: "Bài 5: Kiến thức phổ thông về phòng không nhân dân",
    question: "Trong chiến tranh hiện đại, vũ khí công nghệ cao của địch có đặc điểm nguy hiểm nào?",
    options: [
      "Tầm bắn xa, độ chính xác rất cao, khả năng xuyên phá ngầm và có thể đánh phá cả ngày lẫn đêm",
      "Chỉ nổ được vào ban ngày khi có ánh nắng mặt trời",
      "Không gây sát thương cho con người",
      "Tốc độ bay chậm hơn tốc độ người đi bộ"
    ],
    correctAnswer: 0,
    explanation: "Vũ khí công nghệ cao (như tên lửa hành trình Tomahawk, bom thông minh dẫn đường bằng laser/GPS) có tầm tác chiến hàng nghìn km, độ sai số dưới 1-3m và có uy lực phá hủy khủng khiếp."
  },
  {
    id: 1135,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Tác dụng của lò xo đẩy về trong súng tiểu liên AK là gì?",
    options: [
      "Đẩy bệ khóa nòng và khóa nòng về phía trước, đưa viên đạn vào buồng đạn và đóng kín buồng đạn",
      "Làm giảm trọng lượng khẩu súng khi ngắm bắn",
      "Phát ra tiếng nổ khi bóp cò",
      "Giữ hộp tiếp đạn dính chặt vào thân súng"
    ],
    correctAnswer: 0,
    explanation: "Lò xo đẩy về có nhiệm vụ tích trữ năng lượng khi bệ khóa nòng lùi và đẩy bệ khóa nòng cùng khóa nòng tiến về phía trước, nạp đạn vào buồng và khóa then an toàn."
  },
  {
    id: 1136,
    grade: 11,
    lesson: "Bài 7: Pháp luật về quản lý vũ khí, vật liệu nổ và công cụ hỗ trợ",
    question: "Công cụ hỗ trợ bao gồm trang bị nào sau đây?",
    options: [
      "Gậy cao su, roi điện, bình xịt hơi cay, dùi cui kim loại, khóa số tám",
      "Súng tiểu liên AK và súng chống tăng B40",
      "Xe tăng chiến đấu T-90",
      "Tàu ngầm Kilo 636"
    ],
    correctAnswer: 0,
    explanation: "Công cụ hỗ trợ là phương tiện phi sát thương dùng để tự vệ, thi hành công vụ gồm: gậy cao su, bình xịt cay, súng bắn đạn cao su, còng số 8..."
  },
  {
    id: 1137,
    grade: 11,
    lesson: "Bài 9: Nhìn, nghe, phát hiện địch, chỉ mục tiêu, truyền tin liên lạc",
    question: "Khi quan sát mục tiêu vào ban đêm, kinh nghiệm quân sự chỉ ra cách quan sát hiệu quả nhất là gì?",
    options: [
      "Không nhìn chăm chú trực tiếp vào một điểm mà đảo mắt nhìn liếc xung quanh mục tiêu (sử dụng tế bào que ở vùng ngoại vi võng mạc)",
      "Mở to mắt nhìn chằm chằm liên tục vào điểm đen",
      "Nhắm một mắt lại và bật đèn pin chiếu thẳng vào mặt mình",
      "Chỉ nhìn lên bầu trời sao"
    ],
    correctAnswer: 0,
    explanation: "Vào ban đêm, tế bào que nhạy sáng nằm ở ngoại vi đáy mắt, do đó phương pháp 'nhìn liếc' qua lại xung quanh mục tiêu giúp bắt tín hiệu ánh sáng mờ tốt hơn nhìn chăm chú chính diện."
  },
  {
    id: 1138,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    question: "Khi ném lựu đạn F-1 từ trong giao thông hào ra ngoài, điểm chạm đất của lựu đạn cần cách miệng hào tối thiểu bao nhiêu mét?",
    options: ["Tối thiểu ngoài 25 đến 30 mét", "Cách 1 mét", "Cách 3 mét", "Không cần ném ra ngoài"],
    correctAnswer: 0,
    explanation: "Vì bán kính sát thương của mảnh văng lựu đạn F-1 là 20m, nên điểm nổ phải cách miệng hào từ 25 - 30m trở lên để đảm bảo an toàn tuyệt đối cho bộ đội."
  },
  {
    id: 1139,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    question: "Hành vi trốn tránh nghĩa vụ quân sự có thể bị truy cứu trách nhiệm hình sự với mức án cao nhất lên đến mấy năm tù?",
    options: ["Đến 5 năm tù", "Đến 1 năm tù", "Đến 10 năm tù", "Tù chung thân"],
    correctAnswer: 0,
    explanation: "Theo Điều 332 Bộ luật Hình sự, tội trốn tránh nghĩa vụ quân sự có khung hình phạt cao nhất lên đến 5 năm tù giam nếu phạm tội trong thời chiến hoặc tái phạm nguy hiểm."
  },
  {
    id: 1140,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    question: "Thước ngắm của súng tiểu liên AKM có các vạch chia cự ly bắn từ bao nhiêu đến bao nhiêu?",
    options: [
      "Từ vạch 1 đến vạch 10 (tương ứng 100m đến 1000m) và chữ 'Đ' (thước ngắm chiến đấu)",
      "Từ vạch 1 đến vạch 5",
      "Từ vạch 10 đến vạch 50",
      "Không có chia vạch"
    ],
    correctAnswer: 0,
    explanation: "Thước ngắm AKM có các khía khắc chữ số từ 1 đến 10 tương ứng với cự ly từ 100m đến 1000m, phía dưới cùng có khắc chữ 'Đ' (hoặc 'П') gọi là thước ngắm chiến đấu (tương đương thước 3 hoặc 4)."
  }
];

export const BANK_MCQ_12: MultipleChoiceQuestion[] = [
  {
    id: 1201,
    grade: 12,
    lesson: "Bài 1: Một số nội dung cơ bản về chiến lược 'Diễn biến hoà bình', bạo loạn lật đổ",
    question: "Chiến lược 'Diễn biến hoà bình' của các thế lực thù địch nhằm mục tiêu tối hậu nào?",
    options: [
      "Xóa bỏ vai trò lãnh đạo của Đảng Cộng sản Việt Nam, lật đổ chế độ XHCN ở Việt Nam",
      "Giúp đỡ kinh tế Việt Nam phát triển nhảy vọt",
      "Mở rộng thị trường du lịch quốc tế",
      "Hợp tác bảo vệ môi trường toàn cầu"
    ],
    correctAnswer: 0,
    explanation: "Bản chất chiến lược 'Diễn biến hòa bình' là sử dụng các biện pháp phi quân sự (kết hợp răn đe quân sự) nhằm làm xói mòn nền tảng tư tưởng, lật đổ chế độ chính trị XHCN từ bên trong."
  },
  {
    id: 1202,
    grade: 12,
    lesson: "Bài 1: Một số nội dung cơ bản về chiến lược 'Diễn biến hoà bình', bạo loạn lật đổ",
    question: "Thủ đoạn của các thế lực thù địch trên lĩnh vực tư tưởng - văn hóa trong 'Diễn biến hòa bình' là gì?",
    options: [
      "Phủ nhận chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh, truyền bá lối sống thực dụng, đồi trụy",
      "Xây dựng nhiều nhà hát ca múa nhạc truyền thống",
      "Tài trợ học bổng cho học sinh nghèo vượt khó",
      "Bảo tồn các di tích lịch sử cách mạng hào hùng"
    ],
    correctAnswer: 0,
    explanation: "Chúng tập trung xuyên tạc, phủ nhận nền tảng tư tưởng Mác - Lênin, tư tưởng Hồ Chí Minh; chia rẽ khối đại đoàn kết toàn dân tộc và làm suy đồi đạo đức thế hệ trẻ."
  },
  {
    id: 1203,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    question: "Hiện nay Quân đội nhân dân Việt Nam có bao nhiêu Quân khu?",
    options: [
      "7 Quân khu (Quân khu 1, 2, 3, 4, 5, 7, 9) và Bộ Tư lệnh Thủ đô Hà Nội",
      "4 Quân khu",
      "10 Quân khu",
      "Không phân chia theo Quân khu"
    ],
    correctAnswer: 0,
    explanation: "Quân đội nhân dân Việt Nam gồm 7 Quân khu chiến lược (1, 2, 3, 4, 5, 7, 9) cùng Bộ Tư lệnh Thủ đô Hà Nội có vị trí tương đương quân khu."
  },
  {
    id: 1204,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    question: "Các Quân chủng trong Quân đội nhân dân Việt Nam hiện nay bao gồm:",
    options: [
      "Quân chủng Hải quân và Quân chủng Phòng không - Không quân",
      "Quân chủng Pháo binh và Quân chủng Thiết giáp",
      "Quân chủng Tác chiến không gian mạng và Quân chủng Bộ binh",
      "Quân chủng Biên phòng và Quân chủng Cảnh sát biển"
    ],
    correctAnswer: 0,
    explanation: "QĐND Việt Nam có 2 Quân chủng lớn: Quân chủng Hải quân và Quân chủng Phòng không - Không quân. (Lục quân không tổ chức thành bộ tư lệnh quân chủng riêng mà trực tiếp dưới sự chỉ đạo của Bộ Tổng Tham mưu)."
  },
  {
    id: 1205,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    question: "Hệ thống cấp bậc quân hàm Cấp Tá trong Quân đội nhân dân Việt Nam gồm những bậc nào?",
    options: [
      "Đại tá, Thượng tá, Trung tá, Thiếu tá",
      "Đại tá, Trung tá, Thiếu tá, Chuẩn tá",
      "Thượng tá, Trung tá, Hạ tá",
      "Đại tá, Thượng tá, Trung tá, Thiếu úy"
    ],
    correctAnswer: 0,
    explanation: "Cấp Tá gồm 4 bậc theo thứ tự từ cao xuống thấp: Đại tá, Thượng tá, Trung tá và Thiếu tá."
  },
  {
    id: 1206,
    grade: 12,
    lesson: "Bài 3: Công tác tuyển sinh, đào tạo trong các trường Quân đội, Công an",
    question: "Học sinh muốn đăng ký dự thi vào các trường đại học Quân đội, Công an bắt buộc phải trải qua khâu nào đầu tiên?",
    options: [
      "Sơ tuyển về lý lịch chính trị, sức khỏe và độ tuổi tại Ban Chỉ huy quân sự hoặc Công an cấp quận/huyện",
      "Nộp học phí toàn khóa học 4 năm",
      "Phải tham gia nghĩa vụ quân sự 3 năm trước khi thi",
      "Phải biết bơi vượt biển 5 km"
    ],
    correctAnswer: 0,
    explanation: "Quy chế bắt buộc: Mọi thí sinh muốn thi vào khối trường Quân đội, Công an phải qua vòng sơ tuyển tại địa phương (đạt tiêu chuẩn về phẩm chất chính trị, đạo đức, lý lịch gia đình và sức khỏe đạt loại 1, 2)."
  },
  {
    id: 1207,
    grade: 12,
    lesson: "Bài 4: Một số hiểu biết về chiến lược bảo vệ Tổ quốc trong tình hình mới",
    question: "Quan điểm 'Bảo vệ Tổ quốc từ sớm, từ xa, giữ nước từ khi nước chưa nguy' thể hiện tinh thần gì?",
    options: [
      "Chủ động phòng ngừa, triệt tiêu các mầm mống bất ổn từ khi chưa bùng phát thành xung đột vũ trang",
      "Đưa quân đội đi đánh chiếm biên giới các nước khác",
      "Đóng cửa biên giới hoàn toàn không giao thương quốc tế",
      "Giải tán lực lượng vũ trang thường trực"
    ],
    correctAnswer: 0,
    explanation: "Kế sách 'giữ nước từ khi nước chưa nguy' là truyền thống ngàn đời của cha ông ta, kết hợp ngoại giao hòa bình, kinh tế vững mạnh, củng cố quốc phòng để đẩy lùi nguy cơ chiến tranh."
  },
  {
    id: 1208,
    grade: 12,
    lesson: "Bài 5: Nghệ thuật quân sự Việt Nam",
    question: "Ba bộ phận hợp thành của Nghệ thuật quân sự Việt Nam là gì?",
    options: [
      "Chiến lược quân sự, Nghệ thuật chiến dịch và Chiến thuật",
      "Bắn súng, Ném lựu đạn và Bơi lội",
      "Lục quân, Hải quân và Phòng không",
      "Quân sự, Ngoại giao và Thương mại"
    ],
    correctAnswer: 0,
    explanation: "Nghệ thuật quân sự Việt Nam gồm 3 bộ phận hữu cơ: Chiến lược quân sự (đỉnh cao), Nghệ thuật chiến dịch (cấp chiến dịch tác chiến) và Chiến thuật (hành động tác chiến phân đội nhỏ)."
  },
  {
    id: 1209,
    grade: 12,
    lesson: "Bài 5: Nghệ thuật quân sự Việt Nam",
    question: "Truyền thống đánh giặc nổi bật nhất trong lịch sử dựng nước và giữ nước của dân tộc Việt Nam là:",
    options: [
      "Lấy nhỏ thắng lớn, lấy ít địch nhiều, lấy đoản binh thắng trường trận",
      "Dùng quân số áp đảo để đè bẹp đối phương",
      "Mua chuộc tướng giặc bằng vàng bạc",
      "Chờ đợi viện trợ từ bên ngoài rồi mới đánh"
    ],
    correctAnswer: 0,
    explanation: "Do luôn phải đối đầu với các thế lực ngoại xâm có quân số và tiềm lực kinh tế lớn hơn gấp bội, tổ tiên ta đã sáng tạo nên nghệ thuật 'lấy nhỏ đánh lớn, lấy ít địch nhiều', toàn dân là lính."
  },
  {
    id: 1210,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Định nghĩa 'Đường ngắm cơ bản' trong bắn súng tiểu liên AK là gì?",
    options: [
      "Là đường thẳng từ mắt người bắn qua chính giữa mép trên khe ngắm đến chính giữa mép trên đầu ngắm",
      "Là đường nối từ mắt người bắn thẳng đến tâm điểm bia",
      "Là trục của nòng súng kéo dài vô tận",
      "Là khoảng cách từ mặt đất đến báng súng"
    ],
    correctAnswer: 0,
    explanation: "Đường ngắm cơ bản: Là đường thẳng xuất phát từ mắt người ngắm qua chính giữa mép trên khe ngắm đến chính giữa mép trên đỉnh đầu ngắm (đầu ngắm phải ở chính giữa và ngang bằng mép khe ngắm)."
  },
  {
    id: 1211,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Thế nào là 'Đường ngắm đúng'?",
    options: [
      "Là đường ngắm cơ bản được dóng vào điểm định bắn đã xác định trên mục tiêu",
      "Là khi bóp cò nghe thấy tiếng đạn nổ giòn giã",
      "Là khi mắt nhìn lệch hẳn sang bên mép trái khe ngắm",
      "Là đường ngắm khi súng đặt song song với mặt đất"
    ],
    correctAnswer: 0,
    explanation: "Đường ngắm đúng: Là đường ngắm cơ bản được giữ thăng bằng và dóng chính xác vào điểm định bắn trên mục tiêu (mặt súng thăng bằng, không nghiêng trái hay nghiêng phải)."
  },
  {
    id: 1212,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Khi bắn bài 1 súng tiểu liên AK ở cự ly 100m mục tiêu Bia số 4 (Bia ngực thu nhỏ có vòng điểm), điểm định ngắm bắn chuẩn là ở đâu?",
    options: [
      "Chính giữa mép dưới của mục tiêu bia (điểm chính giữa mép dưới bia số 4)",
      "Chính giữa đỉnh đầu mục tiêu",
      "Bắn vu vơ vào góc trên bên phải bia",
      "Bắn xuống dưới chân cọc đỡ bia 50cm"
    ],
    correctAnswer: 0,
    explanation: "Với thước ngắm 3 ở cự ly 100m, đường đạn bay cao hơn đường ngắm khoảng 28cm (trùng tim bia 10 điểm), do đó điểm ngắm chuẩn là chính giữa mép dưới bia số 4."
  },
  {
    id: 1213,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Hiện tượng 'Mặt súng bị nghiêng sang phải' khi bóp cò sẽ làm cho điểm chạm của đầu đạn trên bia bị sai lệch thế nào?",
    options: [
      "Điểm chạm của đầu đạn lệch sang phải và xuống thấp",
      "Điểm chạm bay cao vọt lên trên",
      "Điểm chạm lệch sang trái và bay cao",
      "Điểm đạn vẫn trúng tâm 10 điểm tuyệt đối"
    ],
    correctAnswer: 0,
    explanation: "Quy luật sai lệch đường ngắm: Mặt súng nghiêng về bên nào thì điểm chạm của đạn sẽ bị lệch về bên đó và hạ thấp xuống (nghiêng phải -> đạn lệch phải và xuống thấp)."
  },
  {
    id: 1214,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Yếu lĩnh 'Bóp cò' khi bắn súng quân dụng yêu cầu động tác kỹ thuật như thế nào?",
    options: [
      "Dùng phần giữa đốt thứ nhất của ngón tay trỏ bóp cò êm dần đều thẳng trục nòng súng, kết hợp nín thở",
      "Giật mạnh cò thật nhanh và bất ngờ",
      "Dùng cả bàn tay bóp thật chặt báng súng",
      "Vừa thở mạnh vừa bóp cò liên tục"
    ],
    correctAnswer: 0,
    explanation: "Bóp cò êm dần đều: Đặt đốt 1 ngón trỏ vào cò, kéo cò từ từ thẳng theo trục nòng về sau cho đến khi súng nổ mà không bị giật cục hay làm xê dịch mặt súng."
  },
  {
    id: 1215,
    grade: 12,
    lesson: "Bài 7: Tính năng, tác dụng một số loại lựu đạn",
    question: "Khi rút chốt an toàn lựu đạn, tại sao lựu đạn vẫn chưa phát nổ trên tay người ném?",
    options: [
      "Vì bàn tay người ném vẫn đang nắm chặt giữ đòn bẩy (mỏ vịt) ép sát vào thân lựu đạn",
      "Vì hạt lửa chưa được lắp vào kíp nổ",
      "Vì thuốc nổ cần có ánh sáng mặt trời mới bắt cháy",
      "Vì lựu đạn chưa tiếp xúc với mặt đất"
    ],
    correctAnswer: 0,
    explanation: "Nguyên lý chốt mỏ vịt: Khi tay còn nắm chặt mỏ vịt, lò xo kim hỏa bị giữ lại. Chỉ khi ném lựu đạn bay ra khỏi tay, mỏ vịt bật tung thì kim hỏa mới đập vào hạt lửa."
  },
  {
    id: 1216,
    grade: 12,
    lesson: "Bài 8: Đội ngũ từng người có súng",
    question: "Khi thực hiện động tác 'Khám súng' tiểu liên AK, người chiến sĩ phải hướng nòng súng về đâu để bảo đảm an toàn?",
    options: [
      "Chếch lên trên một góc khoảng 45 độ về phía trước, tuyệt đối không chĩa vào người khác",
      "Chĩa thẳng vào ngực đồng đội đối diện",
      "Cắm chúc nòng súng xuống bàn chân mình",
      "Chĩa ngang sang hai bên hàng quân"
    ],
    correctAnswer: 0,
    explanation: "Quy tắc an toàn vũ khí: Khi khám súng luôn hướng nòng súng chếch 45 độ lên trời nơi không có người, kéo bệ khóa nòng về sau kiểm tra buồng đạn hoàn toàn rỗng."
  },
  {
    id: 1217,
    grade: 12,
    lesson: "Bài 9: Đội ngũ phân đội",
    question: "Đội hình cơ bản của trung đội bộ binh gồm có những hình thức nào?",
    options: [
      "Trung đội hàng ngang (1 hàng, 2 hàng, 3 hàng) và Trung đội hàng dọc (1 hàng, 2 hàng, 3 hàng)",
      "Đội hình hình tròn và hình tam giác",
      "Đội hình phân tán tự do không theo hàng lối",
      "Đội hình cánh cung bao vây"
    ],
    correctAnswer: 0,
    explanation: "Đội hình trung đội gồm: Trung đội hàng ngang (1, 2, 3 hàng ngang) và Trung đội hàng dọc (1, 2, 3 hàng dọc) phục vụ tập hợp điểm quân và hành tiến."
  },
  {
    id: 1218,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    question: "Tỷ lệ bản đồ 1:50.000 có ý nghĩa khoảng cách trên thực địa như thế nào?",
    options: [
      "1 cm đo trên bản đồ tương ứng với 50.000 cm (tức 500 mét) ngoài thực địa",
      "1 cm đo trên bản đồ tương ứng với 50 mét ngoài thực địa",
      "1 cm đo trên bản đồ tương ứng với 5 km ngoài thực địa",
      "1 cm đo trên bản đồ tương ứng với 50 km ngoài thực địa"
    ],
    correctAnswer: 0,
    explanation: "Tỷ lệ xích 1:50.000 nghĩa là 1 đơn vị trên bản đồ bằng 50.000 đơn vị ngoài thực tế. Do đó 1 cm trên bản đồ = 50.000 cm = 500m = 0,5 km trên thực địa."
  },
  {
    id: 1219,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    question: "Các đường cong khép kín trên bản đồ địa hình nối liền các điểm có cùng độ cao gọi là gì?",
    options: ["Đường bình độ", "Đường kinh tuyến", "Đường vĩ tuyến", "Đường phương vị"],
    correctAnswer: 0,
    explanation: "Đường bình độ (đường đồng mức) là đường cong khép kín nối liền các điểm có cùng độ cao tuyệt đối so với mực nước biển, dùng để biểu thị hình dáng lồi lõm của địa hình."
  },
  {
    id: 1220,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    question: "Khi đọc đường bình độ trên bản đồ, nếu các đường bình độ nằm càng sít nhau (dày đặc) thì độ dốc địa hình thế nào?",
    options: [
      "Độ dốc càng lớn (địa hình rất dốc hoặc vách đứng)",
      "Độ dốc càng thoai thoải bằng phẳng",
      "Khu vực đó là đầm lầy ngập nước",
      "Khu vực đó là bãi cát bằng phẳng ven biển"
    ],
    correctAnswer: 0,
    explanation: "Quy tắc đọc dáng đất: Đường bình độ càng mau (sát nhau) thì sườn đồi càng dốc; đường bình độ càng thưa thì sườn đồi càng thoai thoải."
  },
  {
    id: 1221,
    grade: 12,
    lesson: "Bài 1: Một số nội dung cơ bản về chiến lược 'Diễn biến hoà bình', bạo loạn lật đổ",
    question: "'Bạo loạn lật đổ' thường được các thế lực thù địch kích động ở những khu vực địa bàn nào?",
    options: [
      "Những nơi kinh tế khó khăn, có mâu thuẫn nội bộ tôn giáo, dân tộc hoặc điểm nóng tranh chấp đất đai",
      "Những nơi có kinh tế phát triển đồng đều nhất",
      "Các khu công nghiệp hiện đại do nước ngoài đầu tư",
      "Các trung tâm nghiên cứu vũ trụ khoa học kỹ thuật"
    ],
    correctAnswer: 0,
    explanation: "Chúng triệt để lợi dụng vấn đề 'dân tộc', 'tôn giáo', 'nhân quyền', tranh chấp khiếu kiện để kích động biểu tình, gây rối trật tự rồi biến thành bạo loạn lật đổ chính quyền."
  },
  {
    id: 1222,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    question: "Cơ quan chỉ huy tham mưu cao nhất của Quân đội nhân dân Việt Nam là cơ quan nào?",
    options: [
      "Bộ Tổng Tham mưu Quân đội nhân dân Việt Nam",
      "Tổng cục Hậu cần",
      "Tổng cục Kỹ thuật",
      "Tổng cục Công nghiệp Quốc phòng"
    ],
    correctAnswer: 0,
    explanation: "Bộ Tổng Tham mưu là cơ quan chỉ huy tham mưu quân sự đầu não của Quân đội nhân dân Việt Nam, bảo đảm sẵn sàng chiến đấu và chỉ huy các lực lượng vũ trang."
  },
  {
    id: 1223,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    question: "Cơ quan đảm nhiệm công tác Đảng, công tác chính trị trong toàn quân là:",
    options: [
      "Tổng cục Chính trị Quân đội nhân dân Việt Nam",
      "Bộ Tư lệnh Cảnh vệ",
      "Ban Cơ yếu Chính phủ",
      "Học viện Quốc phòng"
    ],
    correctAnswer: 0,
    explanation: "Tổng cục Chính trị là cơ quan đảm nhiệm công tác Đảng, công tác chính trị trong Quân đội nhân dân, đặt dưới sự lãnh đạo trực tiếp của Ban Bí thư và Quân ủy Trung ương."
  },
  {
    id: 1224,
    grade: 12,
    lesson: "Bài 3: Công tác tuyển sinh, đào tạo trong các trường Quân đội, Công an",
    question: "Học viên khi trúng tuyển và theo học tại các trường đại học, sĩ quan Quân đội nhân dân được hưởng quyền lợi gì?",
    options: [
      "Được bao cấp toàn bộ học phí, quân trang, tiền ăn, nơi ở và được phong quân hàm sĩ quan sau khi tốt nghiệp",
      "Phải tự chi trả toàn bộ học phí và tiền thuê nhà trọ",
      "Sau khi ra trường phải tự đi xin việc tại các công ty tư nhân",
      "Không được cấp thẻ bảo hiểm y tế"
    ],
    correctAnswer: 0,
    explanation: "Học viên quân đội được Nhà nước bảo đảm toàn bộ chế độ ăn ở, quân trang, phụ cấp hàng tháng và được Bộ Quốc phòng điều động phân công công tác với tư cách sĩ quan tại ngũ."
  },
  {
    id: 1225,
    grade: 12,
    lesson: "Bài 4: Một số hiểu biết về chiến lược bảo vệ Tổ quốc trong tình hình mới",
    question: "Chính sách quốc phòng 'Bốn không' của Việt Nam được khẳng định trong Sách trắng Quốc phòng gồm những nội dung nào?",
    options: [
      "Không liên minh quân sự; Không cho nước ngoài đặt căn cứ quân sự; Không liên kết với nước này để chống nước kia; Không sử dụng vũ lực hoặc đe dọa sử dụng vũ lực",
      "Không sản xuất vũ khí; Không tuyển quân; Không tuần tra biên giới; Không tham gia Liên hợp quốc",
      "Không buôn bán vũ khí; Không cử sĩ quan đi học nước ngoài; Không tiếp xúc ngoại giao; Không phát triển kinh tế biển",
      "Không phòng không; Không phòng hóa; Không công binh; Không thông tin"
    ],
    correctAnswer: 0,
    explanation: "Chính sách Quốc phòng 4 Không: 1) Không tham gia liên minh quân sự; 2) Không liên kết với nước này chống nước khác; 3) Không cho nước ngoài đặt căn cứ; 4) Không đe dọa sử dụng vũ lực trong quan hệ quốc tế."
  },
  {
    id: 1226,
    grade: 12,
    lesson: "Bài 5: Nghệ thuật quân sự Việt Nam",
    question: "Chiến dịch Điện Biên Phủ năm 1954 đã chuyển đổi phương châm tác chiến lịch sử nào của Đại tướng Võ Nguyên Giáp?",
    options: [
      "Từ 'Đánh nhanh, thắng nhanh' chuyển sang 'Đánh chắc, tiến chắc'",
      "Từ 'Đánh du kích' chuyển sang 'Cố thủ trong hầm hào'",
      "Từ 'Bao vây kinh tế' sang 'Rút lui chiến thuật'",
      "Từ 'Đánh chắc tiến chắc' sang 'Đánh liều thắng vội'"
    ],
    correctAnswer: 0,
    explanation: "Quyết định chuyển phương châm tác chiến từ 'đánh nhanh thắng nhanh' sang 'đánh chắc tiến chắc' của Đại tướng Võ Nguyên Giáp là quyết định khó khăn nhất và sáng suốt nhất làm nên chiến thắng lừng lẫy năm châu."
  },
  {
    id: 1227,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Khi bắn súng ở tư thế 'Nằm bắn có bệ tì', góc tạo bởi thân người bắn và hướng bắn là bao nhiêu độ?",
    options: [
      "Tạo thành một góc khoảng 25 đến 30 độ về phía bên trái hướng bắn",
      "Nằm thẳng hàng 0 độ vuông góc với bệ tì",
      "Tạo thành góc 90 độ vuông góc hoàn toàn",
      "Nằm ngửa người ra sau"
    ],
    correctAnswer: 0,
    explanation: "Tư thế nằm bắn chuẩn: Người bắn nằm nghiêng tạo góc khoảng 25 - 30 độ so với trục súng/hướng bắn giúp cơ thể tì vững chãi vào mặt đất, giảm rung lắc và triệt tiêu sức giật lùi."
  },
  {
    id: 1228,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Khi giương súng ngắm bắn, báng súng phải được giữ chặt vào vị trí nào trên cơ thể?",
    options: [
      "Tì sát và giữ chặt vào hõm vai phải",
      "Tì vào xương quai xanh hoặc cằm",
      "Tì lên đỉnh bắp tay trên",
      "Thả lỏng báng súng lơ lửng trong không khí"
    ],
    correctAnswer: 0,
    explanation: "Báng súng phải tì chắc nịch vào hõm vai phải, má áp sát gối báng súng tự nhiên để giữ súng thăng bằng ổn định khi đạn nổ giật lùi."
  },
  {
    id: 1229,
    grade: 12,
    lesson: "Bài 7: Tính năng, tác dụng một số loại lựu đạn",
    question: "Khoảng cách an toàn tối thiểu của người chỉ huy và người phục vụ khi bộ đội tập ném lựu đạn thật là bao nhiêu?",
    options: [
      "Đứng sau công sự kiên cố cách vị trí ném tối thiểu 50 mét",
      "Đứng ngay cạnh người ném cách 10 cm",
      "Đứng ở bãi nổ để quan sát mảnh văng",
      "Không cần công sự bảo vệ"
    ],
    correctAnswer: 0,
    explanation: "Mọi cán bộ chỉ huy, dẫn bắn, cấp phát đạn dược phải ở trong hầm chỉ huy hoặc công sự bê tông kiên cố, cách xa vị trí ném tối thiểu 50m theo phương án bảo đảm an toàn thao trường."
  },
  {
    id: 1230,
    grade: 12,
    lesson: "Bài 8: Đội ngũ từng người có súng",
    question: "Khi mang súng tiểu liên AK ở tư thế 'Đeo súng', nòng súng hướng về phía nào?",
    options: [
      "Nòng súng hướng chếch lên trên vai trái, thân súng chéo sau lưng",
      "Nòng súng chĩa thẳng xuống gót chân phải",
      "Nòng súng kẹp ngang nách",
      "Nòng súng cầm ở hai tay trước ngực"
    ],
    correctAnswer: 0,
    explanation: "Tư thế đeo súng: Dây súng quàng chéo qua ngực, súng nằm sau lưng, nòng súng chếch lên trên sang vai trái, báng súng ở phía dưới hông phải."
  },
  {
    id: 1231,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    question: "Góc phương vị từ là gì?",
    options: [
      "Là góc hợp bởi hướng bắc từ (đầu kim la bàn chỉ bắc) và hướng đến mục tiêu, tính theo chiều kim đồng hồ từ 0 đến 360 độ",
      "Là góc hợp bởi hướng nam và hướng tây",
      "Là góc tạo bởi đường xích đạo và cực bắc",
      "Là góc nghiêng của mặt phẳng bản đồ"
    ],
    correctAnswer: 0,
    explanation: "Góc phương vị từ (Azimuth) là góc đo theo chiều kim đồng hồ xuất phát từ hướng Bắc của kim nam châm (Bắc từ) đến đường hướng tới mục tiêu, có giá trị từ 0° đến 360°."
  },
  {
    id: 1232,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    question: "Tọa độ ô vuông 4 số (tọa độ sơ lược) trên bản đồ quân sự dùng để làm gì?",
    options: [
      "Xác định vị trí mục tiêu nằm trong một ô vuông lưới có kích thước cạnh 1 km x 1 km",
      "Xác định độ sâu của đại dương",
      "Đo vận tốc gió trên bầu trời",
      "Đếm số lượng dân cư trong thị xã"
    ],
    correctAnswer: 0,
    explanation: "Tọa độ 4 số gồm 2 số trục dọc (kinh tuyến) và 2 số trục ngang (vĩ tuyến), chỉ đích danh ô vuông địa hình 1km² chứa mục tiêu."
  },
  {
    id: 1233,
    grade: 12,
    lesson: "Bài 1: Một số nội dung cơ bản về chiến lược 'Diễn biến hoà bình', bạo loạn lật đổ",
    question: "Trong phòng chống 'Diễn biến hòa bình', giải pháp hàng đầu có ý nghĩa quyết định là:",
    options: [
      "Tăng cường sự lãnh đạo của Đảng, củng cố vững chắc trận địa tư tưởng chính trị và niềm tin của nhân dân",
      "Cắt đứt hoàn toàn internet với toàn thế giới",
      "Ngừng buôn bán thương mại với các nước tư bản",
      "Tập trung mua sắm vũ khí hạt nhân"
    ],
    correctAnswer: 0,
    explanation: "Nhiệm vụ cốt lõi: Xây dựng Đảng trong sạch vững mạnh, nâng cao đời sống nhân dân, giữ vững lập trường tư tưởng, củng cố 'thế trận lòng dân' là bức tường thành vững chắc nhất đánh bại mọi âm mưu DBHB."
  },
  {
    id: 1234,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    question: "Đơn vị cơ sở nhỏ nhất trong tổ chức Quân đội nhân dân Việt Nam là gì?",
    options: ["Tiểu đội", "Trung đội", "Đại đội", "Tiểu đoàn"],
    correctAnswer: 0,
    explanation: "Tiểu đội là phân đội cơ sở nhỏ nhất trong tổ chức lục quân (thường gồm từ 7 đến 9 chiến sĩ, do Tiểu đội trưởng chỉ huy)."
  },
  {
    id: 1235,
    grade: 12,
    lesson: "Bài 3: Công tác tuyển sinh, đào tạo trong các trường Quân đội, Công an",
    question: "Thí sinh có độ tuổi từ bao nhiêu thì được dự tuyển vào đào tạo đại học quân sự (đối với thanh niên ngoài Quân đội)?",
    options: ["Từ 17 đến 21 tuổi", "Từ 15 đến 18 tuổi", "Từ 22 đến 30 tuổi", "Không giới hạn độ tuổi"],
    correctAnswer: 0,
    explanation: "Theo quy chế tuyển sinh quân sự: Thanh niên ngoài Quân đội có độ tuổi từ 17 đến 21 tuổi; quân nhân tại ngũ hoặc xuất ngũ từ 18 đến 23 tuổi."
  },
  {
    id: 1236,
    grade: 12,
    lesson: "Bài 4: Một số hiểu biết về chiến lược bảo vệ Tổ quốc trong tình hình mới",
    question: "Mục tiêu trọng yếu nhất của Quốc phòng - An ninh Việt Nam là:",
    options: [
      "Bảo vệ vững chắc độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ của Tổ quốc, bảo vệ Đảng, Nhà nước, nhân dân và chế độ XHCN",
      "Chiếm lĩnh thêm nhiều vùng biển quốc tế",
      "Trở thành cường quốc xuất khẩu vũ khí quân dụng lớn nhất",
      "Chỉ tập trung phát triển các đô thị lớn ven biển"
    ],
    correctAnswer: 0,
    explanation: "Nghị quyết Trung ương khẳng định: Mục tiêu bất biến là bảo vệ vững chắc Tổ quốc, giữ vững môi trường hòa bình, ổn định chính trị để phát triển đất nước bền vững."
  },
  {
    id: 1237,
    grade: 12,
    lesson: "Bài 5: Nghệ thuật quân sự Việt Nam",
    question: "Kế sách 'Tiên phát chế nhân' của danh tướng Lý Thường Kiệt năm 1075 có ý nghĩa gì?",
    options: [
      "Chủ động đem quân đánh trước vào các căn cứ tập kết quân xâm lược của địch để làm phá sản kế hoạch của chúng",
      "Bỏ thành chạy trốn khi địch vừa tới gần",
      "Cầu hòa nộp đất đai cho giặc Tống",
      "Đóng kín cổng thành cố thủ tuyệt đối"
    ],
    correctAnswer: 0,
    explanation: "Thái úy Lý Thường Kiệt chủ trương: 'Ngồi yên đợi giặc không bằng đem quân đánh trước để chặn mũi nhọn của giặc', chủ động tập kích vào Ung Châu, Khâm Châu triệt hạ bàn đạp xâm lược của giặc Tống."
  },
  {
    id: 1238,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    question: "Khi đầu ngắm cao hơn mép trên khe ngắm, điểm chạm của đầu đạn trên bia mục tiêu sẽ như thế nào?",
    options: [
      "Điểm chạm sẽ bay cao hơn so với điểm định bắn",
      "Điểm chạm sẽ ăn xuống thấp",
      "Điểm chạm bị lệch hẳn sang trái",
      "Điểm chạm bị lệch hẳn sang phải"
    ],
    correctAnswer: 0,
    explanation: "Nếu đầu ngắm nhô cao hơn mép trên khe ngắm thì góc bắn tăng lên, kết quả là đầu đạn sẽ bay cao vượt lên trên mục tiêu."
  },
  {
    id: 1239,
    grade: 12,
    lesson: "Bài 7: Tính năng, tác dụng một số loại lựu đạn",
    question: "Trong tư thế 'Nằm ném lựu đạn', người chiến sĩ dùng tay nào để gài và rút chốt an toàn?",
    options: [
      "Tay phải cầm lựu đạn, ngón tay trái xỏ vào vòng chốt rút dứt khoát",
      "Dùng răng cắn đứt chốt",
      "Đập chốt vào đá cho gãy",
      "Nhờ đồng đội bên cạnh kéo chốt"
    ],
    correctAnswer: 0,
    explanation: "Thao tác chuẩn xác: Tay phải giữ chặt thân và mỏ vịt lựu đạn, tay trái bẻ thẳng hai nhánh chốt an toàn rồi xỏ ngón tay vào khuyên sắt giật thẳng ra ngoài."
  },
  {
    id: 1240,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    question: "Khi sử dụng la bàn từ tính để xác định phương hướng, ta phải tránh đứng gần những vật thể nào sau đây để kim la bàn không bị chỉ sai lệch?",
    options: [
      "Tránh xa đường dây điện cao thế, ô tô, xe tăng, khối kim loại sắt thép lớn và vũ khí",
      "Tránh xa vũng nước mưa nhỏ",
      "Tránh xa bụi cỏ xanh",
      "Tránh xa chiếc mũ vải học sinh"
    ],
    correctAnswer: 0,
    explanation: "Hiện tượng lệch từ địa phương: Khối kim loại sắt thép lớn, từ trường của dây điện cao áp sẽ hút kim nam châm khiến la bàn chỉ sai lệch nghiêm trọng."
  }
];

export const ALL_BANK_MCQ: MultipleChoiceQuestion[] = [
  ...BANK_MCQ_10,
  ...BANK_MCQ_11,
  ...BANK_MCQ_12
];

// =========================================================================
// PHẦN 2: CÂU HỎI TRẮC NGHIỆM ĐÚNG / SAI (MỖI CÂU GỒM 4 Ý A, B, C, D)
// Theo chuẩn đánh giá năng lực của Bộ GD&ĐT (Chương trình GDPT 2018)
// Điểm: 1 ý = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; 4 ý = 1.0đ
// =========================================================================

export const BANK_TF_10: TrueFalseQuestionSource[] = [
  {
    id: 2001,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    context: "Khi tìm hiểu về lịch sử hình thành và phát triển của Quân đội nhân dân Việt Nam, một nhóm học sinh Lớp 10 đưa ra các nhận định sau:",
    items: [
      {
        id: "a",
        statement: "Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập ngày 22/12/1944 tại tỉnh Cao Bằng với 34 chiến sĩ ban đầu.",
        isCorrect: true,
        explanation: "Đúng. Đội thành lập ngày 22/12/1944 theo chỉ thị của Hồ Chủ tịch gồm 34 cán bộ, chiến sĩ anh dũng."
      },
      {
        id: "b",
        statement: "Quân đội nhân dân Việt Nam mang bản chất của giai cấp nông dân và chịu sự lãnh đạo của Quốc hội.",
        isCorrect: false,
        explanation: "Sai. QĐND Việt Nam mang bản chất của giai cấp công nhân, chịu sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam."
      },
      {
        id: "c",
        statement: "Đồng chí Võ Nguyên Giáp là người chỉ huy đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân.",
        isCorrect: true,
        explanation: "Đúng. Đồng chí Võ Nguyên Giáp được Bác Hồ trao trọng trách tổ chức và chỉ huy Đội."
      },
      {
        id: "d",
        statement: "Ngày 22/12 hàng năm vừa là ngày thành lập QĐND Việt Nam vừa là Ngày hội Quốc phòng toàn dân.",
        isCorrect: true,
        explanation: "Đúng. Năm 1989, Đảng và Nhà nước quyết định lấy ngày 22/12 hàng năm là Ngày hội Quốc phòng toàn dân."
      }
    ]
  },
  {
    id: 2002,
    grade: 10,
    lesson: "Bài 2: Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam",
    context: "Về quy định của Luật Sĩ quan Quân đội nhân dân Việt Nam và Luật Công an nhân dân:",
    items: [
      {
        id: "a",
        statement: "Sĩ quan Quân đội nhân dân Việt Nam được phân thành hai ngạch: ngạch sĩ quan tại ngũ và ngạch sĩ quan dự bị.",
        isCorrect: true,
        explanation: "Đúng. Điều 8 Luật Sĩ quan quy định rõ hai ngạch sĩ quan này."
      },
      {
        id: "b",
        statement: "Cấp bậc quân hàm sĩ quan Quân đội nhân dân có 4 cấp gồm: Cấp Tướng, Cấp Tá, Cấp Úy và Cấp Sĩ.",
        isCorrect: false,
        explanation: "Sai. Hệ thống quân hàm sĩ quan chỉ có 3 cấp: Cấp Tướng, Cấp Tá và Cấp Úy (mỗi cấp 4 bậc)."
      },
      {
        id: "c",
        statement: "Đại tướng là cấp bậc hàm cao nhất của sĩ quan trong cả Quân đội nhân dân và Công an nhân dân.",
        isCorrect: true,
        explanation: "Đúng. Đại tướng là cấp bậc hàm quân sự và công an cao nhất theo luật định."
      },
      {
        id: "d",
        statement: "Học sinh tốt nghiệp THPT được phong ngay quân hàm Thiếu úy mà không cần trải qua đào tạo tại trường sĩ quan.",
        isCorrect: false,
        explanation: "Sai. Để được phong quân hàm sĩ quan, học sinh phải trúng tuyển và tốt nghiệp các trường đào tạo sĩ quan của Quân đội/Công an."
      }
    ]
  },
  {
    id: 2003,
    grade: 10,
    lesson: "Bài 3: Ma tuý, tác hại của ma tuý và phòng, chống ma tuý trong trường học",
    context: "Trong buổi ngoại khóa phòng chống ma túy học đường, các ý kiến thảo luận về ma túy được ghi nhận như sau:",
    items: [
      {
        id: "a",
        statement: "Thuốc phiện, cần sa và lá coca thuộc nhóm ma túy có nguồn gốc tự nhiên.",
        isCorrect: true,
        explanation: "Đúng. Các chất này được thu hoạch trực tiếp từ cây trồng tự nhiên."
      },
      {
        id: "b",
        statement: "Sử dụng ma túy tổng hợp ('thuốc lắc', 'đá') một vài lần không gây nghiện và không ảnh hưởng đến não bộ.",
        isCorrect: false,
        explanation: "Sai. Ma túy tổng hợp gây nghiện cực nhanh ngay từ lần thử đầu tiên và phá hủy các tế bào thần kinh trung ương."
      },
      {
        id: "c",
        statement: "Học sinh nếu bị bạn xấu rủ rê thử ma túy phải cương quyết từ chối và báo ngay cho thầy cô, phụ huynh hoặc cơ quan công an.",
        isCorrect: true,
        explanation: "Đúng. Đây là kỹ năng phòng vệ thiết yếu để bảo vệ bản thân và môi trường học đường."
      },
      {
        id: "d",
        statement: "Người nghiện ma túy tiêm chích chung bơm kim tiêm có nguy cơ lây truyền virus HIV và viêm gan B rất cao.",
        isCorrect: true,
        explanation: "Đúng. Dùng chung bơm kim tiêm là con đường truyền máu trực tiếp lây lan HIV/AIDS nhanh nhất."
      }
    ]
  },
  {
    id: 2004,
    grade: 10,
    lesson: "Bài 4: Phòng, chống vi phạm pháp luật về trật tự, an toàn giao thông",
    context: "Các quy định pháp luật về an toàn giao thông đối với học sinh trung học phổ thông:",
    items: [
      {
        id: "a",
        statement: "Người đủ 16 tuổi trở lên được phép điều khiển xe gắn máy có dung tích xi lanh dưới 50 cm3.",
        isCorrect: true,
        explanation: "Đúng. Khoản 1 Điều 60 Luật GTĐB quy định người đủ 16 tuổi được lái xe gắn máy dưới 50 cm3."
      },
      {
        id: "b",
        statement: "Học sinh 16 tuổi được phép điều khiển xe mô tô 110 cm3 đến trường nếu có sự đồng ý bằng văn bản của cha mẹ.",
        isCorrect: false,
        explanation: "Sai. Luật quy định cứng phải đủ 18 tuổi trở lên và có GPLX hạng A1 mới được lái xe từ 50 cm3 trở lên, sự đồng ý của cha mẹ không thay thế được luật."
      },
      {
        id: "c",
        statement: "Học sinh ngồi trên xe đạp điện, xe máy điện bắt buộc phải đội mũ bảo hiểm cài quai đúng quy cách.",
        isCorrect: true,
        explanation: "Đúng. Đội mũ bảo hiểm đúng quy chuẩn là bắt buộc khi tham gia giao thông bằng xe đạp điện, xe máy điện."
      },
      {
        id: "d",
        statement: "Pháp luật cho phép người điều khiển xe mô tô có nồng độ cồn nhỏ hơn 0,25 mg/lít khí thở khi tham gia giao thông.",
        isCorrect: false,
        explanation: "Sai. Luật hiện hành nghiêm cấm hoàn toàn hành vi điều khiển phương tiện mà trong máu hoặc hơi thở có nồng độ cồn."
      }
    ]
  },
  {
    id: 2005,
    grade: 10,
    lesson: "Bài 6: Một số hiểu biết về an ninh mạng",
    context: "Khi tham gia các hoạt động trên không gian mạng và mạng xã hội:",
    items: [
      {
        id: "a",
        statement: "Việc tự ý đăng ảnh chụp thông tin căn cước công dân của bạn lên trang cá nhân mà không được phép là hành vi vi phạm bảo vệ dữ liệu cá nhân.",
        isCorrect: true,
        explanation: "Đúng. Căn cước công dân là dữ liệu thông tin cá nhân cần được bảo vệ nghiêm ngặt theo Luật An ninh mạng."
      },
      {
        id: "b",
        statement: "Học sinh được quyền chia sẻ các bài viết chưa kiểm chứng có nội dung bôi nhọ trường lớp với mục đích 'giải trí'.",
        isCorrect: false,
        explanation: "Sai. Chia sẻ thông tin sai sự thật, vu khống, xúc phạm danh dự tổ chức cá nhân bị xử lý nghiêm minh."
      },
      {
        id: "c",
        statement: "Sử dụng mật khẩu phức tạp gồm chữ hoa, chữ thường, số, ký tự đặc biệt giúp nâng cao tính bảo mật cho tài khoản cá nhân.",
        isCorrect: true,
        explanation: "Đúng. Đây là biện pháp kỹ thuật an toàn số cơ bản và hữu hiệu nhất."
      },
      {
        id: "d",
        statement: "Mạng xã hội là không gian ảo nên các hành vi lừa đảo, chiếm đoạt tài sản trên mạng sẽ không bị pháp luật hình sự xử lý.",
        isCorrect: false,
        explanation: "Sai. Bộ luật Hình sự quy định Tội sử dụng mạng máy tính, viễn thông thực hiện hành vi chiếm đoạt tài sản với mức án rất nghiêm khắc."
      }
    ]
  },
  {
    id: 2006,
    grade: 10,
    lesson: "Bài 7: Tác hại của bom, mìn, đạn, vật liệu nổ và chất độc hoá học",
    context: "Nhận định về bom mìn và chất độc hóa học tồn lưu sau chiến tranh tại Việt Nam:",
    items: [
      {
        id: "a",
        statement: "Sau chiến tranh, bom mìn sót lại dưới lòng đất đã tự phân hủy hết và không còn khả năng gây phát nổ nguy hiểm.",
        isCorrect: false,
        explanation: "Sai. Bom mìn chôn vùi hàng chục năm vẫn còn ngòi nổ và thuốc nổ nguyên vẹn, cực kỳ nhạy nổ khi bị va đập hoặc cày xới."
      },
      {
        id: "b",
        statement: "Khi phát hiện vật nghi là đạn pháo hoặc bom bi, học sinh phải giữ nguyên hiện trường, không được chạm vào và báo ngay cho quân sự địa phương.",
        isCorrect: true,
        explanation: "Đúng. Giữ nguyên hiện trường, cắm biển cảnh báo và báo cơ quan chức năng là quy tắc an toàn số một."
      },
      {
        id: "c",
        statement: "Dioxin trong chất độc da cam là chất cực độc, gây tổn thương gen, dị tật bẩm sinh di truyền qua nhiều thế hệ nạn nhân.",
        isCorrect: true,
        explanation: "Đúng. Dioxin phá hủy cấu trúc gen con người, gây ra nỗi đau da cam qua 3 - 4 thế hệ."
      },
      {
        id: "d",
        statement: "Bom bi là loại bom có bán kính sát thương nhỏ, khi gặp phải có thể nhặt lên ném xuống hồ nước an toàn.",
        isCorrect: false,
        explanation: "Sai. Bom bi có ngòi nổ rất nhạy cảm, mọi hành vi di chuyển hay ném đều gây nổ tức thì gây thương vong lớn."
      }
    ]
  },
  {
    id: 2007,
    grade: 10,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    context: "Về các nguyên tắc chiến thuật lợi dụng địa hình, địa vật trong chiến đấu:",
    items: [
      {
        id: "a",
        statement: "Vật che khuất là vật có thể che giấu hành động nhưng không ngăn cản được đạn bắn xuyên qua.",
        isCorrect: true,
        explanation: "Đúng. Bụi cây, đống rơm chỉ che mắt nhìn nhưng đạn súng bộ binh bắn xuyên qua dễ dàng."
      },
      {
        id: "b",
        statement: "Vật che đỡ vừa che giấu được hành động vừa có khả năng cản được đạn bắn thẳng và mảnh bom.",
        isCorrect: true,
        explanation: "Đúng. Bờ đê kiên cố, tảng đá lớn, gốc cây cổ thụ là những vật che đỡ lý tưởng."
      },
      {
        id: "c",
        statement: "Khi vận động tiếp cận vật che khuất, chiến sĩ phải đi thẳng người, gạt cành lá mạnh để mở đường cơ động.",
        isCorrect: false,
        explanation: "Sai. Phải hạ thấp người, nhẹ nhàng không làm rung động cây cỏ tránh địch quan sát phát hiện."
      },
      {
        id: "d",
        statement: "Địa hình trống trải là địa hình không có vật che khuất và che đỡ, khi vượt qua phải triệt để áp dụng động tác chạy khom hoặc trườn nhanh.",
        isCorrect: true,
        explanation: "Đúng. Vượt bãi trống phải tranh thủ lúc hỏa lực ta kiềm chế hoặc địch sơ hở để cơ động nhanh nhất có thể."
      }
    ]
  },
  {
    id: 2008,
    grade: 10,
    lesson: "Bài 9: Đội ngũ từng người không có súng",
    context: "Quy chuẩn các động tác đội ngũ từng người không có súng:",
    items: [
      {
        id: "a",
        statement: "Khi đứng ở tư thế 'Nghiêm', hai bàn chân mở rộng thành góc 45 độ, hai tay buông thẳng, ngón tay khép sát đùi.",
        isCorrect: true,
        explanation: "Đúng. Hai gót chân sát nhau, hai bàn chân mở hình chữ V một góc khoảng 45 độ."
      },
      {
        id: "b",
        statement: "Động tác 'Quay bên trái' lấy gót chân phải và mũi bàn chân trái làm trụ quay sang trái 90 độ.",
        isCorrect: false,
        explanation: "Sai. Quay bên trái phải lấy gót chân trái và mũi bàn chân phải làm trụ quay sang trái 90 độ."
      },
      {
        id: "c",
        statement: "Động tác 'Đi đều' có khẩu lệnh gồm dự lệnh 'Đi đều' và động lệnh 'BƯỚC!'.",
        isCorrect: true,
        explanation: "Đúng. Dự lệnh 'Đi đều' kéo dài và động lệnh 'BƯỚC' dứt khoát."
      },
      {
        id: "d",
        statement: "Khi có lệnh 'Đứng lại - ĐỨNG!', người đi đều bước thêm 2 bước nữa rồi mới kéo chân về tư thế nghiêm.",
        isCorrect: true,
        explanation: "Đúng. Động lệnh 'ĐỨNG' rơi vào chân phải; bước tiếp chân trái, bước chân phải rồi kéo chân trái về sát chân phải."
      }
    ]
  },
  {
    id: 2009,
    grade: 10,
    lesson: "Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu",
    context: "Quy định vận dụng các tư thế động tác vận động trên chiến trường:",
    items: [
      {
        id: "a",
        statement: "Động tác 'Đi khom' được áp dụng ở nơi có vật che khuất che đỡ cao ngang tầm ngực hoặc đêm tối.",
        isCorrect: true,
        explanation: "Đúng. Giúp hạ thấp tầm quan sát của địch và cơ động tương đối nhẹ nhàng."
      },
      {
        id: "b",
        statement: "Động tác 'Trườn' được áp dụng khi vật che khuất che đỡ cao trên 1,5 mét.",
        isCorrect: false,
        explanation: "Sai. Trườn áp dụng khi vật che đỡ rất thấp (dưới 30-40cm) hoặc hỏa lực địch bắn quét rát sát mặt đất."
      },
      {
        id: "c",
        statement: "Khi thực hiện động tác 'Bò cao', súng được đeo sau lưng hoặc đặt trên cẳng tay trước ngực tùy tình huống.",
        isCorrect: true,
        explanation: "Đúng. Có thể mang súng sau lưng hoặc súng đặt ngang trên hai cẳng tay khi sẵn sàng tác chiến."
      },
      {
        id: "d",
        statement: "Tất cả các tư thế vận động chiến đấu đều yêu cầu người chiến sĩ phải vừa vận động vừa quan sát mục tiêu và giữ vững yếu lĩnh an toàn vũ khí.",
        isCorrect: true,
        explanation: "Đúng. Luôn luôn giữ vững tầm mắt quan sát địch và bảo đảm súng không cướp cò."
      }
    ]
  },
  {
    id: 2010,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    context: "Các nguyên tắc kỹ thuật trong sơ cứu thương tích chiến tranh và đời sống:",
    items: [
      {
        id: "a",
        statement: "Dây garo chỉ được áp dụng trong trường hợp vết thương chảy máu ồ ạt do đứt động mạch lớn ở tứ chi.",
        isCorrect: true,
        explanation: "Đúng. Garo là biện pháp cầm máu tạm thời nghiêm ngặt, chỉ dùng cho đứt động mạch để tránh hoại tử chi."
      },
      {
        id: "b",
        statement: "Khi đã đặt garo thì phải để nguyên dây thắt chặt liên tục không được nới ra cho đến khi tới bệnh viện.",
        isCorrect: false,
        explanation: "Sai. Phải nới garo định kỳ 45 - 60 phút một lần (mỗi lần 1 - 2 phút) để máu nuôi phần chi phía dưới."
      },
      {
        id: "c",
        statement: "Khi nẹp cố định xương cẳng tay gãy, nẹp phải đủ dài để bất động được cả khớp cổ tay và khớp khuỷu tay.",
        isCorrect: true,
        explanation: "Đúng. Nguyên tắc bất di bất dịch: cố định khớp trên và khớp dưới của đoạn xương gãy."
      },
      {
        id: "d",
        statement: "Đối với nạn nhân bị gãy xương hở đầu xương lòi ra ngoài, người sơ cứu phải dùng tay đẩy mạnh đầu xương tụt vào trong thịt.",
        isCorrect: false,
        explanation: "Sai. Tuyệt đối không được ấn đầu xương gãy lòi vào trong vì sẽ gây nhiễm trùng sâu và tổn thương mạch máu thần kinh."
      }
    ]
  }
];

export const BANK_TF_11: TrueFalseQuestionSource[] = [
  {
    id: 2101,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    context: "Các quy định pháp lý về độ tuổi và chế độ thực hiện nghĩa vụ quân sự theo Luật NVQS 2015:",
    items: [
      {
        id: "a",
        statement: "Độ tuổi gọi công dân nhập ngũ thông thường trong thời bình là từ đủ 18 tuổi đến hết 25 tuổi.",
        isCorrect: true,
        explanation: "Đúng. Đây là khung tuổi nhập ngũ cơ bản quy định tại Điều 30 Luật NVQS 2015."
      },
      {
        id: "b",
        statement: "Công dân đã tốt nghiệp cao đẳng, đại học được tạm hoãn thì độ tuổi gọi nhập ngũ kéo dài đến hết 27 tuổi.",
        isCorrect: true,
        explanation: "Đúng. Luật kéo dài đến hết 27 tuổi để tận dụng nguồn nhân lực có trình độ khoa học kỹ thuật cho quân đội."
      },
      {
        id: "c",
        statement: "Học sinh đang học lớp 12 tại trường THPT vẫn thuộc diện bị gọi nhập ngũ ngay trong năm học nếu đủ 18 tuổi.",
        isCorrect: false,
        explanation: "Sai. Học sinh đang học tại cơ sở giáo dục phổ thông được tạm hoãn gọi nhập ngũ theo Điểm g Khoản 1 Điều 41."
      },
      {
        id: "d",
        statement: "Thời hạn phục vụ tại ngũ trong thời bình của hạ sĩ quan, binh sĩ là 24 tháng.",
        isCorrect: true,
        explanation: "Đúng. Điều 21 quy định thời hạn phục vụ tại ngũ là 24 tháng."
      }
    ]
  },
  {
    id: 2102,
    grade: 11,
    lesson: "Bài 3: Phòng chống vi phạm pháp luật trên không gian mạng",
    context: "Về các quy định của Luật An ninh mạng và trách nhiệm bảo vệ an toàn thông tin:",
    items: [
      {
        id: "a",
        statement: "Hành vi lập trang web giả mạo ngân hàng để chiếm đoạt thông tin thẻ ATM của người khác là hành vi bị nghiêm cấm.",
        isCorrect: true,
        explanation: "Đúng. Đây là tội phạm công nghệ cao giả mạo lừa đảo trực tuyến."
      },
      {
        id: "b",
        statement: "Người đăng tải thông tin xuyên tạc sự thật về lịch sử dân tộc trên mạng xã hội có thể bị phạt tiền và xử lý hình sự.",
        isCorrect: true,
        explanation: "Đúng. Xuyên tạc lịch sử, phủ nhận thành quả cách mạng là hành vi vi phạm pháp luật an ninh mạng."
      },
      {
        id: "c",
        statement: "Học sinh được phép bẻ khóa (hack) mật khẩu Wi-Fi của cơ quan quân sự để dùng miễn phí vì đó là tài sản công.",
        isCorrect: false,
        explanation: "Sai. Xâm nhập trái phép vào mạng viễn thông, máy tính của cơ quan nhà nước là tội phạm nghiêm trọng."
      },
      {
        id: "d",
        statement: "Bật chế độ xác thực hai bước (2FA) giúp ngăn chặn kẻ xấu đăng nhập tài khoản ngay cả khi lộ mật khẩu cấp 1.",
        isCorrect: true,
        explanation: "Đúng. 2FA đòi hỏi mã OTP từ điện thoại nên hacker có mật khẩu vẫn không thể truy cập."
      }
    ]
  },
  {
    id: 2103,
    grade: 11,
    lesson: "Bài 4: Một số vấn đề về vi phạm pháp luật bảo vệ môi trường",
    context: "Khi tìm hiểu về pháp luật bảo vệ môi trường của Việt Nam:",
    items: [
      {
        id: "a",
        statement: "Doanh nghiệp xả nước thải độc hại chưa qua xử lý ra sông hồ gây chết cá hàng loạt có thể bị xử lý hình sự về tội gây ô nhiễm môi trường.",
        isCorrect: true,
        explanation: "Đúng. Điều 235 Bộ luật Hình sự quy định Tội gây ô nhiễm môi trường với mức phạt tiền tỷ và phạt tù."
      },
      {
        id: "b",
        statement: "Học sinh vứt rác thải nhựa bừa bãi ra sân trường chỉ là lỗi văn minh ứng xử, hoàn toàn không có văn bản pháp luật nào quy định chế tài xử phạt.",
        isCorrect: false,
        explanation: "Sai. Nghị định 45/2022/NĐ-CP quy định xử phạt vi phạm hành chính đối với hành vi xả rác nơi công cộng."
      },
      {
        id: "c",
        statement: "Hành vi săn bắt, buôn bán động vật rừng nguy cấp, quý hiếm (như hổ, tê tê, rùa biển) là tội phạm môi trường nghiêm trọng.",
        isCorrect: true,
        explanation: "Đúng. Điều 244 Bộ luật Hình sự quy định khung hình phạt lên tới 15 năm tù."
      },
      {
        id: "d",
        statement: "Phân loại rác thải tại nguồn giúp giảm khối lượng rác chôn lấp và tăng tỷ lệ tái chế bảo vệ tài nguyên quốc gia.",
        isCorrect: true,
        explanation: "Đúng. Luật Bảo vệ môi trường 2020 quy định bắt buộc phân loại chất thải rắn sinh hoạt tại nguồn."
      }
    ]
  },
  {
    id: 2104,
    grade: 11,
    lesson: "Bài 5: Kiến thức phổ thông về phòng không nhân dân",
    context: "Nội dung kiến thức về công tác phòng không nhân dân:",
    items: [
      {
        id: "a",
        statement: "Công tác phòng không nhân dân chỉ được triển khai khi chiến tranh đã thực sự nổ ra trên phạm vi toàn quốc.",
        isCorrect: false,
        explanation: "Sai. Công tác PKND được tổ chức, chuẩn bị chu đáo từ thời bình để sẵn sàng đối phó khi có chiến tranh."
      },
      {
        id: "b",
        statement: "Sơ tán, phân tán nhân dân và các cơ sở sản xuất ra khỏi các trọng điểm đánh phá là biện pháp phòng tránh đường không quan trọng.",
        isCorrect: true,
        explanation: "Đúng. Phân tán lực lượng giúp giảm thiểu tối đa thiệt hại về người và cơ sở vật chất khi địch ném bom."
      },
      {
        id: "c",
        statement: "Mạng lưới quan sát, thông báo, báo động phòng không có nhiệm vụ phát hiện sớm máy bay, tên lửa địch để nhân dân kịp thời ẩn nấp.",
        isCorrect: true,
        explanation: "Đúng. Báo động sớm giúp cứu sống hàng vạn người dân trước các đợt tập kích hỏa lực."
      },
      {
        id: "d",
        statement: "Vũ khí công nghệ cao trong chiến tranh hiện đại không thể đánh trúng các mục tiêu vào ban đêm.",
        isCorrect: false,
        explanation: "Sai. Vũ khí công nghệ cao trang bị cảm biến hồng ngoại, radar khẩu độ tổng hợp và định vị vệ tinh hoạt động ngày đêm như nhau."
      }
    ]
  },
  {
    id: 2105,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    context: "Tính năng kỹ - chiến thuật của súng tiểu liên AK-47:",
    items: [
      {
        id: "a",
        statement: "Súng tiểu liên AK sử dụng đạn cỡ 7,62 x 39 mm, hộp tiếp đạn chứa tiêu chuẩn 30 viên.",
        isCorrect: true,
        explanation: "Đúng. Cỡ đạn 7,62 mm và hộp tiếp đạn 30 viên là thông số chuẩn mực của súng AK."
      },
      {
        id: "b",
        statement: "Tầm bắn hiệu quả đối với mục tiêu mặt đất của súng tiểu liên AK là 400 mét.",
        isCorrect: true,
        explanation: "Đúng. Ở cự ly 400m hỏa lực súng AK phát huy độ chính xác và sức sát thương cao nhất."
      },
      {
        id: "c",
        statement: "Tốc độ bắn lý thuyết của súng tiểu liên AK là 1500 phát/phút.",
        isCorrect: false,
        explanation: "Sai. Tốc độ bắn lý thuyết của súng AK là 600 phát/phút."
      },
      {
        id: "d",
        statement: "Súng tiểu liên AK hoạt động theo nguyên lý trích khí thuốc phản lực qua lỗ trích khí ở thành nòng súng.",
        isCorrect: true,
        explanation: "Đúng. Một phần khí thuốc đẩy đầu đạn được trích qua lỗ dẫn khí tác động vào piston đẩy bệ khóa nòng lùi."
      }
    ]
  },
  {
    id: 2106,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    context: "Về súng trường bán tự động CKC và một số vật liệu nổ:",
    items: [
      {
        id: "a",
        statement: "Súng trường CKC có hộp tiếp đạn chứa 10 viên đạn được lắp liền cố định trong thân súng.",
        isCorrect: true,
        explanation: "Đúng. CKC chứa 10 viên trong hộp tiếp đạn cố định dưới thân súng."
      },
      {
        id: "b",
        statement: "Súng trường CKC có thể bắn được cả chế độ liên thanh nhiều viên cùng lúc.",
        isCorrect: false,
        explanation: "Sai. CKC là súng trường bán tự động (chỉ bắn được phát một)."
      },
      {
        id: "c",
        statement: "Thuốc nổ TNT khi bị đốt cháy ở môi trường thoáng khí thông thường sẽ cháy thành ngọn lửa mà không phát nổ.",
        isCorrect: true,
        explanation: "Đúng. TNT cháy đều, chỉ nổ khi có sóng kích nổ cực mạnh từ kíp nổ hoặc bị giam kín trong không gian hẹp."
      },
      {
        id: "d",
        statement: "Kíp nổ số 8 chứa thuốc nổ rất nhạy nổ, va chạm mạnh hoặc cọ xát nhiệt có thể làm kíp nổ gây cụt tay.",
        isCorrect: true,
        explanation: "Đúng. Vỏ kíp chứa thuốc nổ mồi cực nhạy, bảo quản kíp nổ phải hết sức nhẹ nhàng, cẩn trọng."
      }
    ]
  },
  {
    id: 2107,
    grade: 11,
    lesson: "Bài 7: Pháp luật về quản lý vũ khí, vật liệu nổ và công cụ hỗ trợ",
    context: "Các quy định pháp luật về vũ khí và công cụ hỗ trợ:",
    items: [
      {
        id: "a",
        statement: "Công dân có quyền tự do sản xuất, mua bán các loại súng tự chế bắn đạn hoa cải để săn bắn chim thú rừng.",
        isCorrect: false,
        explanation: "Sai. Luật nghiêm cấm cá nhân tự chế, tàng trữ, mua bán các loại súng săn, súng tự chế."
      },
      {
        id: "b",
        statement: "Người tự giác giao nộp vũ khí, vật liệu nổ cho cơ quan chức năng sẽ được miễn hoặc giảm nhẹ trách nhiệm pháp lý theo quy định.",
        isCorrect: true,
        explanation: "Đúng. Nhà nước luôn khuyến khích và khoan hồng đối với người tự giác giao nộp vũ khí."
      },
      {
        id: "c",
        statement: "Bình xịt hơi cay và gậy cao su được xếp vào nhóm công cụ hỗ trợ và được quản lý sử dụng theo giấy phép.",
        isCorrect: true,
        explanation: "Đúng. Đây là công cụ hỗ trợ thuộc diện quản lý nghiêm ngặt của Bộ Công an."
      },
      {
        id: "d",
        statement: "Học sinh được mang dao găm, kiếm sắc nhọn vào trường học để phòng thân nếu cảm thấy bị bạn bè đe dọa.",
        isCorrect: false,
        explanation: "Sai. Dao găm, kiếm là vũ khí thô sơ; mang vào trường học là hành vi vi phạm nghiêm trọng nội quy và pháp luật."
      }
    ]
  },
  {
    id: 2108,
    grade: 11,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    context: "Kỹ năng lợi dụng địa hình, địa vật trong trinh sát và tác chiến bộ binh:",
    items: [
      {
        id: "a",
        statement: "Khi chọn vật che đỡ để bắn súng, chiến sĩ nên chọn vật có độ dày chắc chắn và độ cao phù hợp với tư thế bắn.",
        isCorrect: true,
        explanation: "Đúng. Vật che đỡ phải đủ dày để chống đạn xuyên và vừa tầm ngắm bắn."
      },
      {
        id: "b",
        statement: "Khi quan sát qua khe hở của vật che khuất, đầu của chiến sĩ phải nhô hẳn lên trên ngọn cây để nhìn toàn cảnh.",
        isCorrect: false,
        explanation: "Sai. Nhô đầu lên ngọn cây sẽ làm lộ mục tiêu trên nền trời (bóng mục tiêu), địch dễ dàng bắn trúng."
      },
      {
        id: "c",
        statement: "Đêm tối hay sương mù dày đặc cũng được coi là một dạng vật che khuất đặc biệt đối với mắt thường.",
        isCorrect: true,
        explanation: "Đúng. Màn đêm và sương mù che giấu hành động nhưng không ngăn cản được mảnh đạn súng bắn."
      },
      {
        id: "d",
        statement: "Khi rời khỏi vật che đỡ để cơ động sang vị trí mới, chiến sĩ cần chuẩn bị trước đường cơ động và thời cơ xuất kích bất ngờ.",
        isCorrect: true,
        explanation: "Đúng. Cơ động phải nhanh chóng, dứt khoát, triệt để hạ thấp thân hình để không bị hỏa lực địch đón lõng."
      }
    ]
  },
  {
    id: 2109,
    grade: 11,
    lesson: "Bài 9: Nhìn, nghe, phát hiện địch, chỉ mục tiêu, truyền tin liên lạc",
    context: "Về phương pháp trinh sát nhìn, nghe và chỉ mục tiêu trên thao trường:",
    items: [
      {
        id: "a",
        statement: "Vào ban đêm, việc áp tai sát xuống mặt đất có thể giúp nghe thấy tiếng xe cơ giới di chuyển từ xa tốt hơn nghe trong không khí.",
        isCorrect: true,
        explanation: "Đúng. Vận tốc và độ truyền âm thanh trong chất rắn (đất đá) nhanh và ít hao tán hơn trong không khí."
      },
      {
        id: "b",
        statement: "Khi chỉ mục tiêu theo phương pháp đồng hồ, hướng 6 giờ là hướng thẳng ngay trước mặt người quan sát.",
        isCorrect: false,
        explanation: "Sai. Hướng 12 giờ mới là hướng thẳng trước mặt, hướng 6 giờ là hướng phía sau lưng."
      },
      {
        id: "c",
        statement: "Chọn vật chuẩn để chỉ mục tiêu cần chọn những vật thể cố định, có đặc điểm dễ nhận biết và không bị thay đổi theo thời gian.",
        isCorrect: true,
        explanation: "Đúng. Vật chuẩn như cây cầu, tảng đá lớn hình tháp, ngã ba đường giúp toàn phân đội đồng loạt nhận ra mục tiêu."
      },
      {
        id: "d",
        statement: "Khi truyền tin bí mật trong đêm tối gần địch, chiến sĩ nên dùng loa pin công suất lớn gọi to tên đồng đội.",
        isCorrect: false,
        explanation: "Sai. Phải dùng ám hiệu tay, giật dây chuyền tín hiệu hoặc tiếng thì thầm áp sát tai để giữ bí mật tuyệt đối."
      }
    ]
  },
  {
    id: 2110,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    context: "Tính năng và quy tắc sử dụng lựu đạn F-1:",
    items: [
      {
        id: "a",
        statement: "Lựu đạn F-1 là loại lựu đạn phòng ngự, khối lượng toàn bộ quả lựu đạn khoảng 600 gam.",
        isCorrect: true,
        explanation: "Đúng. Trọng lượng 600g với vỏ gang khía quả dứa tạo mảnh sát thương cao."
      },
      {
        id: "b",
        statement: "Bán kính sát thương của mảnh văng lựu đạn F-1 lên tới 20 mét.",
        isCorrect: true,
        explanation: "Đúng. Bán kính sát thương 20m nên người ném phải ở vị trí có công sự bảo vệ chắc chắn."
      },
      {
        id: "c",
        statement: "Thời gian cháy chậm của kíp nổ lựu đạn F-1 là từ 3,2 đến 4,2 giây kể từ khi đòn bẩy mỏ vịt bung ra.",
        isCorrect: true,
        explanation: "Đúng. Đây là khoảng thời gian thuốc cháy chậm đếm lùi trước khi kích nổ kíp."
      },
      {
        id: "d",
        statement: "Trong kiểm tra ném lựu đạn trúng đích, người ném thuận tay phải sẽ bước chân phải lên trước một bước dài khi vung tay ném.",
        isCorrect: false,
        explanation: "Sai. Người thuận tay phải bắt buộc phải bước chân trái lên trước để tạo trục xoay thân người vút tay ném."
      }
    ]
  }
];

export const BANK_TF_12: TrueFalseQuestionSource[] = [
  {
    id: 2201,
    grade: 12,
    lesson: "Bài 1: Một số nội dung cơ bản về chiến lược 'Diễn biến hoà bình', bạo loạn lật đổ",
    context: "Khi nghiên cứu về âm mưu, thủ đoạn của chiến lược 'Diễn biến hòa bình' và bạo loạn lật đổ:",
    items: [
      {
        id: "a",
        statement: "Chiến lược 'Diễn biến hòa bình' chủ yếu sử dụng các thủ đoạn phi quân sự trên các mặt kinh tế, chính trị, tư tưởng, văn hóa.",
        isCorrect: true,
        explanation: "Đúng. Đây là cuộc chiến tranh tâm lý, ý thức hệ và kinh tế nhằm làm suy yếu đối phương từ gốc rễ."
      },
      {
        id: "b",
        statement: "Bạo loạn lật đổ là hành động công khai dùng bạo lực có tổ chức do lực lượng phản động kích động nhằm lật đổ chính quyền nhân dân.",
        isCorrect: true,
        explanation: "Đúng. Bạo loạn lật đổ là đỉnh cao kết hợp giữa kích động quần chúng gây rối và vũ trang lật đổ chính quyền cơ sở."
      },
      {
        id: "c",
        statement: "Các thế lực thù địch tuyệt đối không quan tâm đến thế hệ học sinh, sinh viên vì cho rằng thanh niên không có vai trò chính trị.",
        isCorrect: false,
        explanation: "Sai. Chúng coi thanh niên, học sinh, sinh viên là đối tượng trọng điểm để tiêm nhiễm lối sống lai căng, kích động biểu tình chống đối."
      },
      {
        id: "d",
        statement: "Xây dựng khối đại đoàn kết toàn dân tộc vững chắc là một trong những giải pháp then chốt để phòng chống 'Diễn biến hòa bình'.",
        isCorrect: true,
        explanation: "Đúng. 'Thế trận lòng dân' vững như bàn thạch là bức tường thành vô hiệu hóa mọi âm mưu chia rẽ."
      }
    ]
  },
  {
    id: 2202,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    context: "Hệ thống tổ chức và chỉ huy của Quân đội nhân dân Việt Nam:",
    items: [
      {
        id: "a",
        statement: "Bộ Quốc phòng là cơ quan quản lý nhà nước về quốc phòng và chỉ huy cao nhất của Quân đội nhân dân và Dân quân tự vệ.",
        isCorrect: true,
        explanation: "Đúng. Bộ Quốc phòng trực thuộc Chính phủ, chịu trách nhiệm quản lý nhà nước về quân sự, quốc phòng."
      },
      {
        id: "b",
        statement: "Hiện nay Việt Nam có 7 Quân khu và Bộ Tư lệnh Thủ đô Hà Nội.",
        isCorrect: true,
        explanation: "Đúng. Quân khu 1, 2, 3, 4, 5, 7, 9 và Bộ Tư lệnh Thủ đô Hà Nội tạo thành mạng lưới phòng thủ liên hoàn."
      },
      {
        id: "c",
        statement: "Bộ đội Biên phòng là lực lượng vũ trang thuộc Bộ Ngoại giao quản lý.",
        isCorrect: false,
        explanation: "Sai. Bộ đội Biên phòng là một thành phần lực lượng chuyên trách của Quân đội nhân dân Việt Nam trực thuộc Bộ Quốc phòng."
      },
      {
        id: "d",
        statement: "Cấp bậc hàm sĩ quan cấp Tá trong QĐND Việt Nam gồm: Đại tá, Thượng tá, Trung tá và Thiếu tá.",
        isCorrect: true,
        explanation: "Đúng. Gồm 4 bậc quân hàm cấp Tá theo quy định của Luật Sĩ quan."
      }
    ]
  },
  {
    id: 2203,
    grade: 12,
    lesson: "Bài 3: Công tác tuyển sinh, đào tạo trong các trường Quân đội, Công an",
    context: "Quy định về tiêu chuẩn dự tuyển vào các trường đại học, sĩ quan Quân đội, Công an:",
    items: [
      {
        id: "a",
        statement: "Thí sinh bắt buộc phải qua vòng sơ tuyển sức khỏe và lý lịch chính trị tại địa phương trước khi đăng ký xét tuyển.",
        isCorrect: true,
        explanation: "Đúng. Đây là điều kiện tiên quyết bắt buộc của khối trường lực lượng vũ trang."
      },
      {
        id: "b",
        statement: "Học sinh có hình xăm phản cảm, kỳ dị trên cơ thể vẫn được xét tuyển bình thường nếu có điểm thi tốt nghiệp xuất sắc.",
        isCorrect: false,
        explanation: "Sai. Quy định tuyển sinh Quân đội, Công an nghiêm cấm các hình xăm trổ phản cảm trên cơ thể."
      },
      {
        id: "c",
        statement: "Học viên được bao cấp toàn bộ tiền ăn, học phí, quân trang và được bố trí việc làm sau khi tốt nghiệp ra trường.",
        isCorrect: true,
        explanation: "Đúng. Nhà nước đài thọ 100% kinh phí đào tạo và phong quân hàm sĩ quan khi tốt nghiệp."
      },
      {
        id: "d",
        statement: "Các trường sĩ quan Lục quân chỉ tuyển nam thanh niên, không tuyển nữ sinh.",
        isCorrect: true,
        explanation: "Đúng. Trường Sĩ quan Lục quân 1 và Lục quân 2 chỉ tuyển sinh đối tượng là nam thanh niên."
      }
    ]
  },
  {
    id: 2204,
    grade: 12,
    lesson: "Bài 4: Một số hiểu biết về chiến lược bảo vệ Tổ quốc trong tình hình mới",
    context: "Nội dung quan điểm chiến lược bảo vệ Tổ quốc Việt Nam XHCN trong tình hình mới:",
    items: [
      {
        id: "a",
        statement: "Quan điểm bảo vệ Tổ quốc 'từ sớm, từ xa' nhấn mạnh việc chủ động ngăn ngừa nguy cơ xung đột chiến tranh từ thời bình.",
        isCorrect: true,
        explanation: "Đúng. Giữ nước từ khi nước chưa nguy, triệt tiêu nguy cơ chiến tranh là tư tưởng xuyên suốt."
      },
      {
        id: "b",
        statement: "Việt Nam thực hiện chính sách quốc phòng mang tính chất hòa bình, tự vệ, không tham gia liên minh quân sự với bất kỳ nước nào.",
        isCorrect: true,
        explanation: "Đúng. Chính sách quốc phòng '4 không' thể hiện bản chất yêu chuộng hòa bình của dân tộc ta."
      },
      {
        id: "c",
        statement: "Phát triển kinh tế - xã hội phải gắn chặt chẽ với củng cố, tăng cường tiềm lực quốc phòng và an ninh.",
        isCorrect: true,
        explanation: "Đúng. Mỗi bước phát triển kinh tế là một bước củng cố vững chắc tiềm lực quốc phòng."
      },
      {
        id: "d",
        statement: "Chiến lược bảo vệ Tổ quốc chỉ chú trọng bảo vệ vùng đất liền, không cần quan tâm đến vùng trời và vùng biển đảo.",
        isCorrect: false,
        explanation: "Sai. Bảo vệ toàn vẹn lãnh thổ bao gồm cả vùng đất, vùng trời, vùng biển đảo và không gian mạng quốc gia."
      }
    ]
  },
  {
    id: 2205,
    grade: 12,
    lesson: "Bài 5: Nghệ thuật quân sự Việt Nam",
    context: "Các giá trị đặc sắc của Nghệ thuật quân sự Việt Nam truyền thống và hiện đại:",
    items: [
      {
        id: "a",
        statement: "Nghệ thuật quân sự Việt Nam bao gồm ba bộ phận cấu thành: Chiến lược quân sự, Nghệ thuật chiến dịch và Chiến thuật.",
        isCorrect: true,
        explanation: "Đúng. Ba bộ phận này gắn bó mật thiết, trong đó Chiến lược quân sự đóng vai trò chỉ đạo."
      },
      {
        id: "b",
        statement: "Tư tưởng cốt lõi của nghệ thuật đánh giặc của tổ tiên ta là 'lấy đoản binh thắng trường trận', 'lấy ít địch nhiều'.",
        isCorrect: true,
        explanation: "Đúng. Đây là nét độc đáo bậc thầy giúp dân tộc ta đánh thắng các đế chế xâm lược hùng mạnh."
      },
      {
        id: "c",
        statement: "Chiến dịch Hồ Chí Minh lịch sử mùa Xuân năm 1975 là chiến dịch tiến công chiến lược đỉnh cao giải phóng hoàn toàn miền Nam.",
        isCorrect: true,
        explanation: "Đúng. Đại thắng mùa Xuân 1975 đỉnh cao là Chiến dịch Hồ Chí Minh giải phóng Sài Gòn, thống nhất non sông."
      },
      {
        id: "d",
        statement: "Nghệ thuật chiến tranh nhân dân Việt Nam chỉ dựa vào quân đội chính quy tác chiến, cấm nhân dân tham gia đánh giặc.",
        isCorrect: false,
        explanation: "Sai. Chiến tranh nhân dân thực hiện 'toàn dân đánh giặc', mỗi người dân là một chiến sĩ, mỗi làng xã là một pháo đài."
      }
    ]
  },
  {
    id: 2206,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    context: "Các định nghĩa và quy luật sai lệch trong kỹ thuật bắn súng tiểu liên AK bài 1:",
    items: [
      {
        id: "a",
        statement: "Đường ngắm cơ bản là đường thẳng dóng từ mắt người bắn qua điểm chính giữa mép trên khe ngắm đến đỉnh chính giữa đầu ngắm.",
        isCorrect: true,
        explanation: "Đúng. Đây là chuẩn định nghĩa đường ngắm cơ bản trong tài liệu huấn luyện bắn súng AK."
      },
      {
        id: "b",
        statement: "Khi mặt súng bị nghiêng sang bên trái, điểm chạm của đầu đạn trên bia sẽ lệch sang bên trái và xuống thấp.",
        isCorrect: true,
        explanation: "Đúng. Mặt súng nghiêng bên nào thì đạn lệch sang bên đó và hạ thấp theo độ nghiêng."
      },
      {
        id: "c",
        statement: "Khi ngắm thấy đỉnh đầu ngắm cao hơn mép trên khe ngắm, điểm đạn chạm trên bia sẽ bay vọt lên cao hơn mục tiêu.",
        isCorrect: true,
        explanation: "Đúng. Đầu ngắm cao làm góc bắn tăng khiến đường đạn bay cao hơn bình thường."
      },
      {
        id: "d",
        statement: "Động tác bóp cò đòi hỏi người bắn phải giật ngón tay thật nhanh và mạnh ngay khi vừa nhìn thấy bia mục tiêu.",
        isCorrect: false,
        explanation: "Sai. Bóp cò phải êm dần đều, giữ súng thăng bằng và nín thở để không làm giật lệch đường ngắm đúng."
      }
    ]
  },
  {
    id: 2207,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    context: "Yếu lĩnh bắn và điều kiện bài bắn 1 súng tiểu liên AK (Mục tiêu Bia số 4 ngực thu nhỏ có vòng điểm):",
    items: [
      {
        id: "a",
        statement: "Cự ly bắn bài 1 súng tiểu liên AK mục tiêu bia số 4 là 100 mét.",
        isCorrect: true,
        explanation: "Đúng. Cự ly 100m là cự ly chuẩn mực bài 1 bắn mục tiêu cố định ban ngày."
      },
      {
        id: "b",
        statement: "Tư thế bắn của bài 1 trong chương trình GDQP-AN lớp 12 là tư thế Nằm bắn có bệ tì.",
        isCorrect: true,
        explanation: "Đúng. Học sinh thực hành nằm bắn có bao cát bệ tì đỡ súng bảo đảm vững chắc."
      },
      {
        id: "c",
        statement: "Số lượng đạn bắn tính điểm tiêu chuẩn cho mỗi học sinh là 3 viên phát một.",
        isCorrect: true,
        explanation: "Đúng. Bắn 3 viên phát một, tính tổng điểm vòng trên bia (từ 25 đến 30 điểm là loại Giỏi)."
      },
      {
        id: "d",
        statement: "Khi kết thúc bài bắn, học sinh có thể tự ý xách súng đi lại trên thao trường mà không cần khám súng.",
        isCorrect: false,
        explanation: "Sai. Tuyệt đối phải khám súng, bóp cò kiểm tra buồng đạn hoàn toàn an toàn theo lệnh của chỉ huy bắn."
      }
    ]
  },
  {
    id: 2208,
    grade: 12,
    lesson: "Bài 8: Đội ngũ từng người có súng",
    context: "Các tư thế mang súng và thao tác súng tiểu liên AK:",
    items: [
      {
        id: "a",
        statement: "Tư thế 'Mang súng' nòng súng hướng lên trên, súng ép sát phía bên phải thân người.",
        isCorrect: true,
        explanation: "Đúng. Mang súng bên phải, tay phải nắm ốp lót tay, báng súng hướng xuống dưới."
      },
      {
        id: "b",
        statement: "Khi thực hiện động tác 'Đặt súng', học sinh được phép ném súng mạnh xuống nền đất cứng.",
        isCorrect: false,
        explanation: "Sai. Súng là vũ khí quý báu, đặt súng phải cúi người đặt nhẹ nhàng, bảo vệ thân súng và nòng súng."
      },
      {
        id: "c",
        statement: "Động tác 'Khám súng' nòng súng phải luôn hướng chếch 45 độ lên không trung về phía an toàn.",
        isCorrect: true,
        explanation: "Đúng. Đảm bảo an toàn phòng ngừa trường hợp buồng đạn còn đạn sót lại."
      },
      {
        id: "d",
        statement: "Động tác 'Treo súng' thường được vận dụng khi làm nhiệm vụ tuần tra canh gác hoặc duyệt đội ngũ.",
        isCorrect: true,
        explanation: "Đúng. Súng treo chéo trước ngực giúp chiến sĩ sẵn sàng chuyển sang tư thế chiến đấu nhanh chóng."
      }
    ]
  },
  {
    id: 2209,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    context: "Quy chuẩn đọc và sử dụng bản đồ địa hình quân sự:",
    items: [
      {
        id: "a",
        statement: "Bản đồ tỷ lệ 1:25.000 có tỷ lệ lớn hơn bản đồ tỷ lệ 1:100.000 và thể hiện địa hình chi tiết hơn.",
        isCorrect: true,
        explanation: "Đúng. Mẫu số càng nhỏ thì tỷ lệ bản đồ càng lớn và biểu thị địa vật càng chi tiết, rõ nét."
      },
      {
        id: "b",
        statement: "Đường bình độ là đường cong khép kín nối liền các điểm có cùng độ cao so với mặt nước biển.",
        isCorrect: true,
        explanation: "Đúng. Đây là nguyên lý cơ bản biểu diễn độ cao dáng đất trên bản đồ phẳng."
      },
      {
        id: "c",
        statement: "Khoảng cách giữa các đường bình độ càng thưa thớt thì địa hình nơi đó càng dốc đứng hiểm trở.",
        isCorrect: false,
        explanation: "Sai. Đường bình độ càng mau (gần nhau) mới là càng dốc; thưa thớt là sườn đồi thoai thoải."
      },
      {
        id: "d",
        statement: "Tọa độ phẳng UTM hoặc tọa độ VN-2000 giúp xác định vị trí mục tiêu một cách chính xác bằng con số toán học.",
        isCorrect: true,
        explanation: "Đúng. Hệ lưới tọa độ vuông giúp phân đội pháo binh và bộ binh lấy phần tử bắn chính xác."
      }
    ]
  },
  {
    id: 2210,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    context: "Sử dụng la bàn quân sự để định hướng ngoài thực địa:",
    items: [
      {
        id: "a",
        statement: "Kim nam châm của la bàn luôn tự do chỉ về hướng Bắc từ của Trái Đất khi không bị nhiễu từ.",
        isCorrect: true,
        explanation: "Đúng. Đầu sơn màu đậm (hoặc chữ N) của kim la bàn luôn định hướng về cực bắc từ."
      },
      {
        id: "b",
        statement: "Góc phương vị từ của một mục tiêu được đo theo chiều ngược chiều kim đồng hồ từ 360 độ về 0 độ.",
        isCorrect: false,
        explanation: "Sai. Góc phương vị từ luôn đo theo chiều thuận kim đồng hồ xuất phát từ hướng Bắc (0° đến 360°)."
      },
      {
        id: "c",
        statement: "Để đo góc phương vị chính xác, phải đặt la bàn thăng bằng trên mặt phẳng và tránh xa các khối sắt thép lớn.",
        isCorrect: true,
        explanation: "Đúng. Đặt nghiêng la bàn làm kẹt kim, sắt thép xung quanh gây lệch từ trường làm sai kết quả."
      },
      {
        id: "d",
        statement: "Sử dụng la bàn kết hợp với bản đồ địa hình giúp người chỉ huy định vị điểm đứng và dẫn đường hành quân trong đêm tối.",
        isCorrect: true,
        explanation: "Đúng. Đây là kỹ năng sinh tồn và định hướng quân sự tối quan trọng của người chỉ huy."
      }
    ]
  }
];

export const ALL_BANK_TF: TrueFalseQuestionSource[] = [
  ...BANK_TF_10,
  ...BANK_TF_11,
  ...BANK_TF_12
];

// =========================================================================
// PHẦN 3: CÂU HỎI TỰ LUẬN (KÈM BAREM BIỂU ĐIỂM & ĐÁP ÁN MẪU CỦA GIÁO VIÊN)
// Thang điểm: 2.0 đến 3.0 điểm / câu
// =========================================================================

export const BANK_ESSAY_10: EssayQuestionSource[] = [
  {
    id: 3001,
    grade: 10,
    lesson: "Bài 1: Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam",
    prompt: "Em hãy nêu tóm tắt quá trình thành lập Đội Việt Nam Tuyên truyền Giải phóng quân (ngày 22/12/1944). Từ truyền thống 'Trung với Đảng, hiếu với dân, sẵn sàng chiến đấu hy sinh vì độc lập tự do của Tổ quốc', học sinh thế hệ trẻ hôm nay cần làm gì để phát huy truyền thống anh hùng đó?",
    maxScore: 3.0,
    rubric: [
      { criterion: "Nêu chính xác hoàn cảnh, thời gian (22/12/1944), địa điểm (Cao Bằng), số lượng chiến sĩ (34 người) và người chỉ huy (đồng chí Võ Nguyên Giáp).", points: 1.0 },
      { criterion: "Giải thích rõ nội hàm truyền thống 'Trung với Đảng, hiếu với dân, nhiệm vụ nào cũng hoàn thành, khó khăn nào cũng vượt qua, kẻ thù nào cũng đánh thắng'.", points: 1.0 },
      { criterion: "Liên hệ sâu sắc trách nhiệm học sinh: nỗ lực học tập tốt, rèn luyện đạo đức, chấp hành pháp luật, sẵn sàng bảo vệ Tổ quốc.", points: 1.0 }
    ],
    suggestedAnswer: `1. Quá trình thành lập Đội VN Tuyên truyền Giải phóng quân:
- Ngày 22/12/1944, tại khu rừng giữa hai tổng Hoàng Hoa Thám và Trần Hưng Đạo (Châu Nguyên Bình, tỉnh Cao Bằng), Đội Việt Nam Tuyên truyền Giải phóng quân chính thức được thành lập theo chỉ thị của Lãnh tụ Hồ Chí Minh.
- Đội ban đầu gồm 34 chiến sĩ, được trang bị vũ khí thô sơ, do đồng chí Võ Nguyên Giáp trực tiếp chỉ huy. Ngay sau khi thành lập, Đội đã mưu trí, dũng cảm đánh thắng hai trận Phai Khắt và Nà Ngần, mở đầu cho trang sử vẻ vang của QĐND Việt Nam.

2. Ý nghĩa truyền thống anh hùng:
- Thể hiện lòng trung thành vô hạn với mục tiêu lý tưởng của Đảng và hạnh phúc của nhân dân; tinh thần quyết chiến quyết thắng, gắn bó máu thịt với nhân dân.

3. Trách nhiệm của học sinh hôm nay:
- Tích cực học tập tri thức khoa học, rèn luyện thể lực và phẩm chất đạo đức lối sống lành mạnh.
- Tham gia nghiêm túc môn học GDQP-AN trong nhà trường, nắm vững kiến thức quốc phòng cơ bản.
- Có lập trường tư tưởng kiên định, không nghe theo luận điệu xuyên tạc của kẻ xấu trên mạng xã hội.
- Sẵn sàng đăng ký nghĩa vụ quân sự khi đủ tuổi, cống hiến sức trẻ bảo vệ vững chắc biên cương, biển đảo Tổ quốc.`
  },
  {
    id: 3002,
    grade: 10,
    lesson: "Bài 3: Ma tuý, tác hại của ma tuý và phòng, chống ma tuý trong trường học",
    prompt: "Ma túy học đường đang diễn biến hết sức phức tạp với nhiều hình thức ngụy trang tinh vi (như bánh cần sa, nước vui, thuốc lá điện tử chứa tinh dầu ma túy). Em hãy phân tích tác hại của ma túy đối với học sinh và đề xuất ít nhất 3 biện pháp thiết thực để bản thân và các bạn trong trường không sa vào tệ nạn ma túy.",
    maxScore: 3.0,
    rubric: [
      { criterion: "Phân tích toàn diện tác hại của ma túy trên 3 khía cạnh: Sức khỏe bản thân, Hạnh phúc gia đình và Trật tự an toàn xã hội.", points: 1.25 },
      { criterion: "Nêu đúng các thủ đoạn lôi kéo tinh vi hiện nay (thuốc lá điện tử, trà sữa, bánh kẹo lạ chứa chất ma túy tổng hợp).", points: 0.75 },
      { criterion: "Đề xuất ít nhất 3 giải pháp phòng ngừa cụ thể, thực tế và khả thi trong môi trường học đường.", points: 1.0 }
    ],
    suggestedAnswer: `1. Phân tích tác hại của ma túy:
- Đối với bản thân học sinh: Hủy hoại hệ thần kinh trung ương, suy giảm trí nhớ, dẫn tới hoang tưởng, ảo giác ('ngáo đá'), tổn thương các nội tạng (tim, gan, thận); nguy cơ tử vong do sốc thuốc hoặc lây nhiễm HIV khi tiêm chích; đánh mất tương lai học vấn.
- Đối với gia đình: Gây khánh kiệt kinh tế vì chi phí mua ma túy; làm cha mẹ đau khổ, tan vỡ hạnh phúc gia đình.
- Đối với xã hội: Là nguyên nhân trực tiếp làm phát sinh các loại tội phạm nguy hiểm như trộm cắp, cướp giật, giết người; gây bất ổn an ninh trật tự công cộng.

2. Các thủ đoạn lôi kéo mới hiện nay:
- Tẩm ướp cần sa tổng hợp vào tinh dầu thuốc lá điện tử (pod, vape); ngụy trang thành 'nước xoài', 'nước vui', kẹo dẻo kích thích sự tò mò của học sinh với lời dụ dỗ 'không nghiện, dùng thử để giải tỏa căng thẳng'.

3. Ba biện pháp thiết thực phòng ngừa trong trường học:
- Một là, bản thân kiên quyết nói 'KHÔNG' với mọi lời rủ rê dùng thử thuốc lá điện tử, đồ uống lạ; chủ động tìm hiểu kiến thức nhận diện ma túy.
- Hai là, xây dựng lối sống lành mạnh, tích cực tham gia các câu lạc bộ thể thao, văn nghệ của trường để rèn luyện thể chất và tinh thần.
- Ba là, phát huy tinh thần cảnh giác, dũng cảm phát hiện và báo cáo ngay với Ban Giám hiệu nhà trường hoặc cơ quan Công an khi thấy bạn bè có dấu hiệu bị kẻ xấu lôi kéo mua bán, sử dụng chất lạ.`
  },
  {
    id: 3003,
    grade: 10,
    lesson: "Bài 4: Phòng, chống vi phạm pháp luật về trật tự, an toàn giao thông",
    prompt: "Hiện nay tại nhiều cổng trường THPT, tình trạng học sinh đi xe máy có dung tích xi lanh trên 50cm3 khi chưa đủ tuổi, không đội mũ bảo hiểm, chở ba, lạng lách đánh võng vẫn còn diễn ra. Em hãy phân tích nguyên nhân của tình trạng trên và nêu các quy định của pháp luật về độ tuổi được điều khiển phương tiện cùng các biện pháp giải quyết dứt điểm vấn đề này.",
    maxScore: 3.0,
    rubric: [
      { criterion: "Nêu chính xác quy định pháp luật về độ tuổi điều khiển xe gắn máy dưới 50cm3 (từ đủ 16 tuổi) và trên 50cm3 (từ đủ 18 tuổi, có GPLX).", points: 1.0 },
      { criterion: "Chỉ rõ nguyên nhân từ phía học sinh (ý thức kém, thích thể hiện) và phụ huynh (buông lỏng, nuông chiều giao xe).", points: 1.0 },
      { criterion: "Đề xuất giải pháp phối hợp chặt chẽ giữa Gia đình - Nhà trường - Lực lượng Cảnh sát giao thông.", points: 1.0 }
    ],
    suggestedAnswer: `1. Quy định của Luật Giao thông đường bộ:
- Người đủ 16 tuổi trở lên được lái xe gắn máy có dung tích xi lanh dưới 50 cm3.
- Người đủ 18 tuổi trở lên, có giấy phép lái xe hợp lệ mới được điều khiển xe mô tô hai bánh từ 50 cm3 trở lên.
- Đội mũ bảo hiểm đạt chuẩn cài quai đúng cách là bắt buộc khi ngồi trên xe máy điện, xe mô tô.

2. Nguyên nhân dẫn đến tình trạng vi phạm:
- Về phía học sinh: Nhận thức pháp luật còn hạn chế; tâm lý lứa tuổi thích thể hiện, đua đòi bạn bè; ý thức tự bảo vệ tính mạng bản thân chưa cao.
- Về phía phụ huynh: Còn nuông chiều, thiếu kiểm soát, giao xe phân khối lớn cho con em khi chưa đủ tuổi và chưa có bằng lái.
- Về phía quản lý: Một số bãi trông giữ xe quanh cổng trường vẫn nhận giữ xe phân khối lớn cho học sinh để thu lợi.

3. Biện pháp giải quyết:
- Nhà trường: Tổ chức ký cam kết an toàn giao thông giữa gia đình, học sinh và nhà trường; đưa tiêu chí chấp hành luật giao thông vào đánh giá hạnh kiểm.
- Phụ huynh: Kiên quyết không giao chìa khóa xe mô tô trên 50cm3 cho con em khi chưa đủ tuổi; bố trí phương tiện xe đạp điện hoặc xe bus công cộng cho con.
- Lực lượng chức năng: Tăng cường tuần tra xung quanh cổng trường, lập biên bản xử phạt nghiêm cả học sinh vi phạm và phụ huynh giao xe cho người không đủ điều kiện.`
  },
  {
    id: 3004,
    grade: 10,
    lesson: "Bài 6: Một số hiểu biết về an ninh mạng",
    prompt: "Không gian mạng mang lại nhiều tiện ích học tập nhưng cũng tiềm ẩn nhiều cạm bẫy đối với học sinh. Em hãy phân tích 2 thủ đoạn lừa đảo phổ biến trên mạng xã hội hiện nay và nêu các quy tắc ứng xử văn minh, bảo vệ dữ liệu cá nhân theo Luật An ninh mạng.",
    maxScore: 2.5,
    rubric: [
      { criterion: "Mô tả cụ thể 2 thủ đoạn lừa đảo qua mạng (như giả danh công an/ngân hàng, hack tài khoản mượn tiền, lừa việc làm online đóng tiền cọc).", points: 1.0 },
      { criterion: "Nêu các quy tắc bảo vệ thông tin mật khẩu, mã OTP, không truy cập liên kết lạ.", points: 0.75 },
      { criterion: "Trình bày văn hóa ứng xử văn minh trên không gian mạng theo quy định pháp luật.", points: 0.75 }
    ],
    suggestedAnswer: `1. Hai thủ đoạn lừa đảo phổ biến trên mạng:
- Thứ nhất, hack tài khoản mạng xã hội (Facebook, Zalo) rồi nhắn tin mượn tiền: Kẻ xấu đánh cắp quyền kiểm soát tài khoản, sau đó nhắn tin cho người thân, bạn bè trong danh bạ với lý do khẩn cấp để nhờ chuyển khoản vào tài khoản ngân hàng lạ.
- Thứ hai, chiêu trò 'làm cộng tác viên online nạp tiền giật đơn hàng nhận hoa hồng cao': Ban đầu kẻ xấu cho nạn nhân rút tiền hoa hồng thật để tạo niềm tin, khi số tiền nạp lên đến hàng chục triệu đồng thì chúng đóng băng hệ thống và chiếm đoạt toàn bộ tiền.

2. Quy tắc ứng xử và bảo vệ dữ liệu cá nhân:
- Tuyệt đối không chia sẻ mã xác thực OTP, mật khẩu, số căn cước công dân hoặc ảnh chụp giấy tờ tùy thân cho bất kỳ ai trên mạng.
- Cài đặt bảo mật 2 lớp cho tất cả các tài khoản mạng xã hội và email.
- Kiểm tra kỹ đường link trước khi click chuột; khi có yêu cầu chuyển tiền từ người quen, luôn gọi điện thoại trực tiếp để xác thực.
- Ứng xử có văn hóa trên mạng: Không đăng tải, chia sẻ thông tin bịa đặt chưa kiểm chứng; không bình luận xúc phạm danh dự, kỳ thị hay lăng mạ người khác.`
  },
  {
    id: 3005,
    grade: 10,
    lesson: "Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu",
    prompt: "Em hãy nêu các trường hợp vận dụng và phân biệt sự khác nhau giữa hai động tác 'Bò cao' và 'Trườn' trong chiến đấu. Vì sao khi thực hiện các động tác này, người chiến sĩ phải luôn quan sát mục tiêu và giữ súng an toàn?",
    maxScore: 2.5,
    rubric: [
      { criterion: "Nêu chính xác trường hợp vận dụng của động tác Bò cao (vật che khuất/che đỡ cao ngang ngực, chuyển thương, mang vác vũ khí).", points: 0.75 },
      { criterion: "Nêu chính xác trường hợp vận dụng của động tác Trườn (vật che đỡ rất thấp dưới 30cm, địa hình trống trải, hỏa lực địch bắn rát).", points: 0.75 },
      { criterion: "Chỉ rõ lý do phải luôn quan sát mục tiêu và bảo đảm yếu lĩnh an toàn vũ khí (chống bị tập kích bất ngờ, chống cướp cò nguy hiểm).", points: 1.0 }
    ],
    suggestedAnswer: `1. Trường hợp vận dụng của động tác Bò cao:
- Vận dụng ở nơi địa hình có vật che khuất, che đỡ cao ngang tầm ngực; hoặc trong đêm tối, sương mù dày đặc.
- Thường dùng để vận chuyển vũ khí đạn dược, trang thiết bị nặng, cứu thương chuyển thương hoặc bí mật áp sát tiếp cận công sự địch.

2. Trường hợp vận dụng của động tác Trườn:
- Vận dụng ở nơi địa hình bằng phẳng trống trải, vật che khuất che đỡ rất thấp (dưới 30 cm) hoặc khi hỏa lực bắn thẳng của địch quét rát sát mặt đất.
- Toàn bộ cơ thể áp sát mặt đất để thu hẹp tối đa diện tích tiếp xúc với mảnh đạn và tầm nhìn của địch.

3. Lý do phải luôn quan sát mục tiêu và giữ súng an toàn:
- Quan sát mục tiêu liên tục giúp nắm chắc hành động của địch, kịp thời phát hiện cạm bẫy mìn vướng nổ và phản ứng bắn trả ngay khi địch xuất hiện bất ngờ.
- Giữ súng an toàn (ngón tay trỏ ngoài vành cò, hướng nòng súng chếch an toàn, đậy nắp phòng bụi nòng súng) để súng không bị đất cát làm kẹt đạn và tuyệt đối không cướp cò làm thương vong đồng đội.`
  },
  {
    id: 3006,
    grade: 10,
    lesson: "Bài 12: Kĩ thuật cấp cứu và chuyển thương dã chiến",
    prompt: "Trong một tình huống khẩn cấp, một nạn nhân bị tai nạn dẫn đến đứt động mạch lớn ở cẳng tay, máu đỏ tươi phun thành tia mạnh. Em hãy trình bày các bước thao tác kỹ thuật đặt dây garo cầm máu theo đúng nguyên tắc y học dã chiến.",
    maxScore: 2.5,
    rubric: [
      { criterion: "Xác định đúng vị trí đặt garo (cách vết thương 2-3cm về phía tim) và nguyên tắc lót gạc.", points: 0.75 },
      { criterion: "Nêu đúng quy trình quấn dây garo vừa đủ chặt để máu ngừng chảy, không siết quá mức làm nát cơ bắp.", points: 0.75 },
      { criterion: "Nêu quy định ghi phiếu garo (ngày, giờ, phút đặt) và nguyên tắc nới garo định kỳ 45-60 phút một lần.", points: 1.0 }
    ],
    suggestedAnswer: `Quy trình các bước đặt garo cầm máu đứt động mạch:
- Bước 1: Dùng ngón tay ấn mạnh vào đường đi của động mạch phía trên vết thương (điểm ấn động mạch cánh tay) để cầm máu tạm thời; đồng thời nâng cao chi bị thương.
- Bước 2: Chuẩn bị dây garo cao su hoặc dây vải bản rộng; lót một lớp gạc hoặc vải sạch quanh chi ở vị trí cách mép vết thương 2 - 3 cm về phía tim để tránh làm kẹp dập nát da thịt dưới dây garo.
- Bước 3: Đặt dây garo và quấn vòng đầu tiên giữ chặt, các vòng sau quấn khít dần. Siết chặt dây garo với lực vừa đủ cho đến khi máu ngừng phun thành tia và bắt mạch ở ngọn chi không còn đập nữa thì cố định mối buộc garo.
- Bước 4: Viết Phiếu Garo hoặc dùng bút viết trực tiếp lên trán nạn nhân/băng garo ghi rõ: Họ tên, Giờ, Phút đặt garo, tên người thực hiện.
- Bước 5: Băng vết thương, ủ ấm nạn nhân và vận chuyển ngay đến cơ sở y tế gần nhất. Trên đường đi, cứ sau 45 - 60 phút phải nới garo một lần từ 1 - 2 phút cho máu nuôi chi rồi siết lại.`
  }
];

export const BANK_ESSAY_11: EssayQuestionSource[] = [
  {
    id: 3101,
    grade: 11,
    lesson: "Bài 2: Luật Nghĩa vụ quân sự và trách nhiệm của học sinh",
    prompt: "Nghĩa vụ quân sự là nghĩa vụ vẻ vang của công dân đối với Tổ quốc. Em hãy nêu các tiêu chuẩn cơ bản để công dân được gọi nhập ngũ theo Luật Nghĩa vụ quân sự 2015. Là một học sinh THPT, em có nhận thức và trách nhiệm gì về việc đăng ký và thực hiện nghĩa vụ quân sự khi đến tuổi?",
    maxScore: 3.0,
    rubric: [
      { criterion: "Nêu đầy đủ 4 tiêu chuẩn công dân được gọi nhập ngũ: Lý lịch chính trị, Độ tuổi, Sức khỏe, Trình độ văn hóa.", points: 1.25 },
      { criterion: "Nêu quy định độ tuổi đăng ký nghĩa vụ quân sự lần đầu của nam công dân (đủ 17 tuổi trong năm).", points: 0.75 },
      { criterion: "Trình bày nhận thức đúng đắn và quyết tâm hành động của bản thân đối với trách nhiệm bảo vệ Tổ quốc.", points: 1.0 }
    ],
    suggestedAnswer: `1. Bốn tiêu chuẩn công dân được gọi nhập ngũ theo Luật NVQS 2015:
- Tiêu chuẩn lý lịch: Có lý lịch gia đình và bản thân rõ ràng, gương mẫu chấp hành đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước.
- Tiêu chuẩn độ tuổi: Công dân từ đủ 18 tuổi đến hết 25 tuổi; công dân tốt nghiệp đại học, cao đẳng đã được tạm hoãn thì gọi đến hết 27 tuổi.
- Tiêu chuẩn sức khỏe: Đạt sức khỏe loại 1, loại 2, loại 3 theo quy định liên bộ Y tế - Quốc phòng (không gọi nhập ngũ công dân cận thị từ 1.5 đi-ốp trở lên, loạn thị, nghiện ma túy...).
- Tiêu chuẩn văn hóa: Có trình độ học vấn từ lớp 8 trở lên; những địa phương khó khăn thì tuyển người có trình độ lớp 7.

2. Trách nhiệm của học sinh THPT:
- Về đăng ký nghĩa vụ quân sự: Khi đủ 17 tuổi trong năm, chủ động mang giấy tờ theo lệnh gọi của Ban Chỉ huy quân sự cấp xã/phường để đăng ký NVQS lần đầu nghiêm túc.
- Về tư tưởng, nhận thức: Xác định phụng sự Tổ quốc trong quân ngũ là niềm tự hào, môi trường rèn luyện kỷ luật thép, bản lĩnh, sức khỏe và trưởng thành.
- Về hành động: Không nghe theo những lời xúi giục trốn tránh nghĩa vụ; nỗ lực hoàn thành chương trình lớp 12; sẵn sàng lên đường tòng quân khi có lệnh gọi để cống hiến sức trẻ bảo vệ Tổ quốc.`
  },
  {
    id: 3102,
    grade: 11,
    lesson: "Bài 6: Giới thiệu một số loại súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo",
    prompt: "Em hãy nêu các tính năng chiến đấu cơ bản của súng tiểu liên AK-47 (cỡ nòng, loại đạn, tầm bắn hiệu quả, tốc độ bắn, khối lượng). Tại sao súng tiểu liên AK được đánh giá là một trong những khẩu súng bộ binh huyền thoại và tin cậy nhất trong lịch sử chiến tranh hiện đại?",
    maxScore: 3.0,
    rubric: [
      { criterion: "Nêu chính xác các thông số kỹ thuật: Cỡ nòng 7,62mm, đạn K56, tầm bắn hiệu quả 400m, tốc độ lý thuyết 600 phát/phút, khối lượng 3,8kg.", points: 1.25 },
      { criterion: "Phân tích cấu tạo ưu việt: Cơ chế trích khí đơn giản, khe hở các bộ phận hợp lý, dễ tháo lắp bảo dưỡng.", points: 1.0 },
      { criterion: "Khẳng định khả năng tác chiến bền bỉ: Hoạt động hoàn hảo trong mọi môi trường bùn lầy, cát bụi, mưa bão, kháng chịu va đập cực tốt.", points: 0.75 }
    ],
    suggestedAnswer: `1. Các tính năng chiến đấu cơ bản của súng tiểu liên AK-47:
- Cỡ nòng: 7,62 mm, sử dụng loại đạn 7,62 x 39 mm (đạn K56).
- Tầm bắn ghi trên thước ngắm: Thước ngắm từ 1 đến 8 (AK) hoặc từ 1 đến 10 (AKM tương ứng 1000m).
- Tầm bắn hiệu quả: 400 mét đối với mục tiêu mặt đất; 500 mét đối với máy bay, quân dù.
- Tầm bắn thẳng: 350m đối với mục tiêu người nằm (cao 0,5m); 525m đối với mục tiêu người chạy (cao 1,5m).
- Tốc độ bắn: Lý thuyết 600 phát/phút; chiến đấu bắn phát một 40 phát/phút, liên thanh 100 phát/phút.
- Khối lượng: Khối lượng súng không đạn là 3,8 kg (AK) và 3,1 kg (AKM); hộp tiếp đạn chứa 30 viên.

2. Lý do súng AK trở thành vũ khí huyền thoại và đáng tin cậy nhất:
- Thiết kế cơ khí thông minh và đơn giản: Các bộ phận chuyển động có độ dung sai lớn, ít chi tiết nhỏ phức tạp, cho phép tháo lắp bảo dưỡng chỉ trong vòng dưới 30 giây mà không cần dụng cụ đặc biệt.
- Khả năng thích ứng môi trường phi thường: Súng AK có thể ngâm dưới bùn lầy, chôn vùi trong cát bụi sa mạc hay đóng băng trong tuyết giá; khi vớt lên chỉ cần lắc nhẹ nước ra khỏi nòng là lập tức nhả đạn trơn tru không hề kẹt đạn.
- Uy lực sát thương và hỏa lực mạnh mẽ: Đầu đạn 7,62mm có sơ tốc 710m/s, sức xuyên phá công sự và bia mục tiêu rất lớn, tạo nên uy thế áp đảo trong tác chiến bộ binh tầm gần và trung bình.`
  },
  {
    id: 3103,
    grade: 11,
    lesson: "Bài 7: Pháp luật về quản lý vũ khí, vật liệu nổ và công cụ hỗ trợ",
    prompt: "Thời gian gần đây, xuất hiện tình trạng một số thanh thiếu niên lên mạng internet tìm mua linh kiện súng hoa cải, súng săn tự chế hoặc hóa chất để chế tạo pháo nổ trái phép dẫn tới tai nạn thương tâm cụt tay, mù mắt. Em hãy phân tích các hành vi bị pháp luật nghiêm cấm về vũ khí, vật liệu nổ và trách nhiệm của học sinh trong việc phòng chống vi phạm này.",
    maxScore: 2.5,
    rubric: [
      { criterion: "Nêu các hành vi bị nghiêm cấm theo Luật Quản lý vũ khí, vật liệu nổ (chế tạo, tàng trữ, vận chuyển, mua bán, sử dụng trái phép).", points: 1.0 },
      { criterion: "Nêu hậu quả nghiêm trọng: Thương tật vĩnh viễn, chết người, cháy nổ, bị xử lý hình sự.", points: 0.75 },
      { criterion: "Nêu các giải pháp hành động cụ thể của học sinh để phòng ngừa và tố giác tội phạm.", points: 0.75 }
    ],
    suggestedAnswer: `1. Các hành vi bị pháp luật nghiêm cấm:
- Chế tạo, tàng trữ, vận chuyển, sử dụng, mua bán trái phép vũ khí, vật liệu nổ, tiền chất thuốc nổ và công cụ hỗ trợ.
- Chiếm đoạt, mua bán linh kiện, cụm chi tiết hoặc hướng dẫn chế tạo súng tự chế, pháo nổ trên mạng internet.
- Mang vũ khí, dao nhọn, công cụ hỗ trợ trái phép vào nơi công cộng, trường học.

2. Hậu quả khôn lường:
- Về tính mạng sức khỏe: Chế tạo pháo nổ tự chế rất dễ phát nổ tức thì do cọ xát nhiệt, dẫn đến mù mắt, cụt bàn tay, bỏng diện rộng, thậm chí mất mạng khi tuổi đời còn quá trẻ.
- Về pháp luật: Người thực hiện có thể bị truy cứu trách nhiệm hình sự về tội 'Chế tạo, tàng trữ, sử dụng trái phép vật liệu nổ' hoặc 'Gây rối trật tự công cộng' với mức án tù nhiều năm, để lại án tích phá hủy cả tương lai.

3. Trách nhiệm của học sinh:
- Tuyệt đối không xem, không học theo các video hướng dẫn làm pháo, chế tạo súng trên Youtube, Tiktok; không mua bán tiền chất hóa học trên mạng.
- Khi biết bạn bè hoặc người xung quanh có hành vi tàng trữ vũ khí, pháo nổ, phải can ngăn và báo ngay cho thầy cô hoặc cơ quan Công an gần nhất để kịp thời ngăn chặn hiểm họa.`
  },
  {
    id: 3104,
    grade: 11,
    lesson: "Bài 10: Kĩ thuật sử dụng lựu đạn",
    prompt: "Em hãy nêu các trường hợp vận dụng và phân tích yếu lĩnh động tác trong tư thế 'Đứng ném lựu đạn'. Nêu 3 quy tắc an toàn tuyệt đối bắt buộc phải tuân thủ trong quá trình huấn luyện và kiểm tra ném lựu đạn.",
    maxScore: 3.0,
    rubric: [
      { criterion: "Nêu trường hợp vận dụng tư thế Đứng ném (trong công sự giao thông hào sâu, sau vật che đỡ cao, mục tiêu ở xa).", points: 0.75 },
      { criterion: "Phân tích tuần tự động tác: Chuẩn bị, Rút chốt an toàn, Vung tay lấy đà và Ném lựu đạn.", points: 1.25 },
      { criterion: "Nêu đủ 3 quy tắc an toàn huấn luyện: Chấp hành mệnh lệnh, Kiểm tra hướng ném, Xử lý khi lựu đạn tuột rơi tại chỗ.", points: 1.0 }
    ],
    suggestedAnswer: `1. Trường hợp vận dụng tư thế Đứng ném:
- Vận dụng khi người ném đang ở trong chiến hào, giao thông hào có chiều sâu ngang ngực, hoặc sau vật che đỡ cao che kín thân mình; mục tiêu ở cự ly xa cần lực ném tối đa.

2. Yếu lĩnh động tác Đứng ném lựu đạn:
- Cử động 1 (Chuẩn bị): Tay phải cầm lựu đạn (ngón tay ôm chặt đòn bẩy mỏ vịt), chân trái bước lên một bước dài theo hướng ném, mũi chân trái thẳng hướng ném, chân phải làm trụ hơi chùng gối.
- Cử động 2 (Rút chốt an toàn): Tay trái bẻ thẳng hai nhánh chốt an toàn, xỏ ngón tay vào vòng khuyên rồi giật thẳng ra ngoài; tay phải vẫn giữ chặt mỏ vịt ép vào thân lựu đạn.
- Cử động 3 (Ném lựu đạn): Lấy đà bằng cách xoay người sang phải, tay phải cầm lựu đạn hạ xuống dưới vung ra sau; kết hợp sức rướn của thân người, sức vút của cánh tay và độ gập của cổ tay ném quả lựu đạn bay vút đi theo góc 45 độ về phía mục tiêu; sau đó nhanh chóng cúi thấp ẩn nấp sau thành hào.

3. Ba quy tắc an toàn bắt buộc:
- Một là: Chỉ được rút chốt và ném lựu đạn khi có khẩu lệnh chuẩn xác của người chỉ huy trường bắn.
- Hai là: Tuyệt đối không được ném lựu đạn về hướng có người; khu vực bãi nổ phải có cờ đỏ cảnh báo và phong tỏa hoàn toàn.
- Ba là: Nếu lựu đạn đã rút chốt bị trượt rơi ngay trong công sự hào ném, người ném phải lập tức hô to báo động và nhặt lựu đạn ném nhanh ra ngoài hào rồi nằm rạp xuống đáy hầm tránh mảnh văng.`
  },
  {
    id: 3105,
    grade: 11,
    lesson: "Bài 5: Kiến thức phổ thông về phòng không nhân dân",
    prompt: "Em hãy nêu mục đích, tính chất của công tác Phòng không nhân dân. Khi có tình huống địch sử dụng vũ khí công nghệ cao tập kích đường không vào khu vực trường học hoặc địa phương em, em và gia đình cần thực hiện những hành động phòng tránh nào để bảo đảm an toàn tính mạng?",
    maxScore: 2.5,
    rubric: [
      { criterion: "Trình bày đúng mục đích và tính chất toàn dân, toàn diện của công tác Phòng không nhân dân.", points: 1.0 },
      { criterion: "Nêu các biện pháp phòng tránh trước khi có báo động (chuẩn bị hầm trú ẩn, bao cát, túi cứu thương, đèn pin, ngắt nguồn cháy nổ).", points: 0.75 },
      { criterion: "Nêu hành động đúng khi có còi báo động và xử lý khắc phục hậu quả sau đợt đánh phá.", points: 0.75 }
    ],
    suggestedAnswer: `1. Mục đích và tính chất của Phòng không nhân dân:
- Mục đích: Nhằm bảo toàn tính mạng, tài sản của nhân dân, bảo vệ các mục tiêu kinh tế, văn hóa, chính trị trọng yếu; hạn chế đến mức thấp nhất thiệt hại do đòn tập kích đường không của địch gây ra.
- Tính chất: Là công tác mang tính toàn dân, toàn diện, kết hợp giữa phòng tránh thụ động và đánh trả chủ động, do toàn dân tiến hành dưới sự chỉ đạo của cơ quan quân sự.

2. Hành động phòng tránh của bản thân và gia đình:
- Trước khi xảy ra tập kích:
  + Chủ động đào hầm trú ẩn, chuẩn bị túi cấp cứu y tế, nước uống, lương khô và đèn pin.
  + Gia cố cửa kính bằng băng dính chéo chữ X để tránh vỡ vụn gây sát thương do sóng xung kích.
  + Tham gia sơ tán phân tán ra khỏi khu vực trọng điểm theo hướng dẫn của chính quyền.
- Khi có còi báo động tập kích:
  + Lập tức ngắt cầu dao điện, khóa van bình gas để phòng chống cháy nổ thứ cấp.
  + Nhanh chóng cùng gia đình di chuyển xuống hầm trú ẩn hoặc ẩn nấp dưới chân tường chịu lực, gầm bàn vững chắc; bảo vệ đầu và vùng ngực.
- Sau khi dứt đợt tập kích:
  + Cùng lực lượng địa phương tham gia dập lửa, cấp cứu người bị thương, không đến gần các hố bom đạn chưa nổ.`
  },
  {
    id: 3106,
    grade: 11,
    lesson: "Bài 8: Lợi dụng địa hình, địa vật",
    prompt: "Trong chiến thuật bộ binh, việc so sánh, lựa chọn giữa 'Vật che khuất' và 'Vật che đỡ' có ý nghĩa sống còn như thế nào đối với người chiến sĩ? Em hãy phân tích các yếu tố sai lầm thường gặp khi học sinh thực hành lợi dụng vật che khuất, che đỡ trên bãi tập.",
    maxScore: 2.5,
    rubric: [
      { criterion: "So sánh chính xác bản chất khác biệt giữa vật che khuất và vật che đỡ về khả năng chống đạn xuyên.", points: 1.0 },
      { criterion: "Chỉ ra ít nhất 2 sai lầm thường gặp (nhô đầu quá cao lộ trên nền trời, làm rung động cây cỏ, bắn trực tiếp trên đỉnh vật).", points: 0.75 },
      { criterion: "Rút ra bài học thực tiễn để bảo vệ an toàn tính mạng trong tình huống chiến đấu thực tế.", points: 0.75 }
    ],
    suggestedAnswer: `1. So sánh và ý nghĩa sống còn:
- Vật che khuất: Chỉ có tác dụng che mắt nhìn của đối phương, không có khả năng chống đạn. Do đó, nấp sau vật che khuất (như lùm cây, vách tôn mỏng) khi địch dùng súng bắn thẳng quét qua thì người nấp vẫn bị trúng đạn thương vong.
- Vật che đỡ: Vừa che mắt địch, vừa cản được đạn bắn thẳng và mảnh bom nổ (như tảng đá khối, ụ đất dày 50cm trở lên, gốc cây cổ thụ). Lựa chọn đúng vật che đỡ giúp bảo vệ an toàn tính mạng, tạo điểm tì bắn súng ổn định để tiêu diệt địch.

2. Các sai lầm thường gặp của học sinh trên bãi tập:
- Thứ nhất, nhô đầu quá cao trên đỉnh vật che khuất: Tạo thành bóng mục tiêu tương phản rõ rệt trên nền trời, khiến địch phát hiện vị trí ngay lập tức.
- Thứ hai, tì người quá mạnh làm rung động cành cây, ngọn cỏ: Cử động cành cây bất thường sẽ làm lộ vị trí ẩn nấp cho các tay súng bắn tỉa của đối phương.
- Thứ ba, chọn vật che đỡ quá nhỏ so với thân hình hoặc tư thế đứng quá cao: Để lộ phần vai, mông hoặc chân ra ngoài mép vật che đỡ dẫn tới nguy cơ bị trúng đạn lạc.`
  }
];

export const BANK_ESSAY_12: EssayQuestionSource[] = [
  {
    id: 3201,
    grade: 12,
    lesson: "Bài 1: Một số nội dung cơ bản về chiến lược 'Diễn biến hoà bình', bạo loạn lật đổ",
    prompt: "Chiến lược 'Diễn biến hòa bình' là một trong những âm mưu nguy hiểm nhất của các thế lực thù địch nhằm chống phá cách mạng Việt Nam. Em hãy phân tích nội dung, phương thức chống phá của kẻ thù trên lĩnh vực tư tưởng - văn hóa và nêu rõ trách nhiệm của đoàn viên, học sinh lớp 12 trong việc giữ vững trận địa tư tưởng của Đảng hiện nay.",
    maxScore: 3.0,
    rubric: [
      { criterion: "Nêu bản chất, mục tiêu tối hậu của chiến lược 'Diễn biến hòa bình' (lật đổ chế độ XHCN từ bên trong).", points: 0.75 },
      { criterion: "Phân tích sâu sắc các thủ đoạn trên lĩnh vực tư tưởng - văn hóa (xuyên tạc chủ nghĩa Mác - Lênin, bôi nhọ lãnh tụ, gieo rắc lối sống thực dụng).", points: 1.25 },
      { criterion: "Đề xuất trách nhiệm của học sinh lớp 12: tỉnh táo nhận diện thông tin độc hại, không 'like/share' vô tội vạ, kiên định lý tưởng cách mạng.", points: 1.0 }
    ],
    suggestedAnswer: `1. Bản chất và mục tiêu của chiến lược 'Diễn biến hòa bình':
- Là chiến lược tổng hợp của chủ nghĩa đế quốc và các thế lực thù địch sử dụng biện pháp phi quân sự là chủ yếu (kết hợp răn đe quân sự) nhằm làm suy yếu, chuyển hóa chế độ XHCN từ bên trong, tiến tới xóa bỏ vai trò lãnh đạo của Đảng Cộng sản Việt Nam.

2. Thủ đoạn chống phá trên lĩnh vực tư tưởng - văn hóa:
- Xuyên tạc, phủ nhận nền tảng tư tưởng là chủ nghĩa Mác - Lênin và tư tưởng Hồ Chí Minh; bôi nhọ các đồng chí lãnh đạo Đảng, Nhà nước và các anh hùng dân tộc.
- Tuyên truyền lối sống thực dụng, đề cao chủ nghĩa cá nhân ích kỷ, sùng bái phương Tây, làm phai nhạt lý tưởng cách mạng trong giới trẻ.
- Triệt để lợi dụng internet, mạng xã hội để phát tán video, bài viết độc hại tạo tâm lý hoang mang, nghi ngờ trong các tầng lớp nhân dân.

3. Trách nhiệm của đoàn viên, học sinh lớp 12:
- Tự giác học tập, nắm vững chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh và lịch sử vẻ vang của dân tộc; giữ vững bản lĩnh chính trị vững vàng.
- Nâng cao 'sức đề kháng' trước thông tin xấu độc: Luôn kiểm chứng nguồn tin từ các cơ quan báo chí chính thống của Đảng và Nhà nước; tuyệt đối không chia sẻ, bình luận ủng hộ các quan điểm lệch lạc, phản động.
- Tích cực lan tỏa những tấm gương người tốt, việc tốt, hình ảnh đẹp về đất nước và con người Việt Nam trên mạng xã hội ('lấy cái đẹp dẹp cái xấu').`
  },
  {
    id: 3202,
    grade: 12,
    lesson: "Bài 4: Một số hiểu biết về chiến lược bảo vệ Tổ quốc trong tình hình mới",
    prompt: "Nghị quyết Trung ương khẳng định quan điểm nhất quán: 'Bảo vệ Tổ quốc từ sớm, từ xa; giữ nước từ khi nước chưa nguy'. Em hãy giải thích ý nghĩa cốt lõi của quan điểm trên và phân tích chính sách quốc phòng 'Bốn không' của Việt Nam được công bố trong Sách trắng Quốc phòng.",
    maxScore: 3.0,
    rubric: [
      { criterion: "Giải thích đúng quan điểm 'Bảo vệ Tổ quốc từ sớm, từ xa, giữ nước từ khi nước chưa nguy' kế thừa truyền thống ông cha.", points: 1.0 },
      { criterion: "Trình bày chính xác và phân tích ý nghĩa của chính sách quốc phòng 'Bốn không'.", points: 1.25 },
      { criterion: "Khẳng định đường lối quốc phòng hòa bình, tự vệ chính đáng của Nhà nước ta.", points: 0.75 }
    ],
    suggestedAnswer: `1. Ý nghĩa quan điểm 'Bảo vệ Tổ quốc từ sớm, từ xa, giữ nước từ khi nước chưa nguy':
- Đây là sự đúc kết đỉnh cao truyền thống dựng nước đi đôi với giữ nước của tổ tiên ta suốt hàng nghìn năm lịch sử.
- 'Từ sớm, từ xa' có nghĩa là: Chủ động phát hiện, ngăn ngừa và triệt tiêu các nhân tố gây mất ổn định chính trị, mâu thuẫn xã hội ngay từ cơ sở; chuẩn bị tiềm lực quốc phòng toàn diện từ thời bình; không để Tổ quốc bị động, bất ngờ trước bất kỳ tình huống nào.
- Giữ vững môi trường hòa bình, độc lập, chủ quyền lãnh thổ để phát triển kinh tế đất nước bền vững.

2. Phân tích chính sách quốc phòng 'Bốn không' của Việt Nam:
- Một là: Không tham gia liên minh quân sự với bất kỳ nước nào để tránh bị kéo vào vòng xoáy đối đầu của các cường quốc.
- Hai là: Không liên kết với nước này để chống nước kia, kiên quyết giữ vững nguyên tắc độc lập tự chủ trong quan hệ quốc tế.
- Ba là: Không cho nước ngoài đặt căn cứ quân sự hoặc sử dụng lãnh thổ Việt Nam để chống lại nước khác.
- Bốn là: Không sử dụng vũ lực hoặc đe dọa sử dụng vũ lực trong quan hệ quốc tế, giải quyết mọi tranh chấp lãnh thổ bằng biện pháp hòa bình trên cơ sở luật pháp quốc tế (đặc biệt là UNCLOS 1982).

3. Kết luận:
- Chính sách 'Bốn không' thể hiện bản chất nhân văn, yêu chuộng hòa bình sâu sắc của dân tộc Việt Nam, đồng thời thể hiện ý chí kiên quyết tự vệ bằng sức mạnh của chính khối đại đoàn kết toàn dân tộc khi Tổ quốc bị xâm phạm.`
  },
  {
    id: 3203,
    grade: 12,
    lesson: "Bài 5: Nghệ thuật quân sự Việt Nam",
    prompt: "Nghệ thuật quân sự Việt Nam là di sản vô giá kết tinh trí tuệ của bao thế hệ cha anh. Em hãy phân tích bài học 'Lấy nhỏ thắng lớn, lấy ít địch nhiều' trong nghệ thuật chiến tranh nhân dân Việt Nam qua các cuộc kháng chiến giải phóng dân tộc và rút ra bài học cho công cuộc bảo vệ chủ quyền biển đảo ngày nay.",
    maxScore: 3.0,
    rubric: [
      { criterion: "Phân tích nguồn gốc xuất phát điểm của nghệ thuật 'lấy nhỏ đánh lớn, lấy ít địch nhiều' (do tương quan lực lượng ban đầu luôn chênh lệch).", points: 1.0 },
      { criterion: "Nêu các minh chứng lịch sử tiêu biểu (Bạch Đằng, Chi Lăng, Điện Biên Phủ, Chiến dịch Hồ Chí Minh).", points: 1.0 },
      { criterion: "Vận dụng vào bảo vệ chủ quyền biển đảo: Phát huy sức mạnh tổng hợp, đoàn kết toàn dân, kết hợp pháp lý - thực địa - ngoại giao kiên quyết, kiên trì.", points: 1.0 }
    ],
    suggestedAnswer: `1. Phân tích bài học 'Lấy nhỏ thắng lớn, lấy ít địch nhiều':
- Xuất phát điểm lịch sử: Việt Nam luôn phải đương đầu với những đạo quân xâm lược có tiềm lực quân sự, kinh tế và vũ khí vượt trội gấp nhiều lần. Để tồn tại và chiến thắng, tổ tiên ta không thể dùng đọ lực đối đầu trực diện mà phải sáng tạo nên nghệ thuật tác chiến phi đối xứng.
- Biện pháp cốt lõi: 'Đem đại nghĩa để thắng hung tàn, lấy chí nhân để thay cường bạo'; phát huy sức mạnh của thế trận chiến tranh nhân dân rộng khắp, buộc địch phải phân tán lực lượng đối phó để ta tập trung hỏa lực tiêu diệt từng bộ phận của địch.

2. Minh chứng lịch sử hào hùng:
- Trong lịch sử phong kiến: Trận Bạch Đằng năm 938 của Ngô Quyền, trận Như Nguyệt năm 1077 của Lý Thường Kiệt, ba lần đại thắng quân Nguyên - Mông của nhà Trần, trận Chi Lăng - Xương Giang của khởi nghĩa Lam Sơn.
- Trong thời đại Hồ Chí Minh: Chiến dịch Điện Biên Phủ 1954 'lừng lẫy năm châu' đánh bại thực dân Pháp và cuộc kháng chiến chống Mỹ cứu nước vĩ đại giải phóng miền Nam thống nhất đất nước.

3. Vận dụng bảo vệ chủ quyền biển đảo hiện nay:
- Kiên quyết, kiên trì đấu tranh bảo vệ từng tấc đảo, sải biển thiêng liêng bằng sức mạnh tổng hợp: Sức mạnh chính nghĩa của luật pháp quốc tế (UNCLOS 1982), thế trận quốc phòng toàn dân trên biển gắn với thế trận an ninh nhân dân.
- Xây dựng lực lượng Hải quân, Cảnh sát biển, Kiểm ngư cách mạng chính quy, tinh nhuệ, hiện đại; động viên ngư dân vươn khơi bám biển vừa phát triển kinh tế vừa khẳng định mốc chủ quyền sống.`
  },
  {
    id: 3204,
    grade: 12,
    lesson: "Bài 6: Kĩ thuật bắn súng tiểu liên AK",
    prompt: "Bắn súng tiểu liên AK là nội dung thực hành trọng tâm của học sinh lớp 12. Em hãy phân tích 3 yếu lĩnh cơ bản khi ngắm bắn (Đường ngắm cơ bản, Đường ngắm đúng, Bóp cò êm dần đều). Nếu người bắn có hiện tượng 'Mặt súng nghiêng sang bên phải' thì kết quả điểm đạn trên bia sẽ lệch như thế nào và cách sửa chữa?",
    maxScore: 3.0,
    rubric: [
      { criterion: "Định nghĩa chính xác Đường ngắm cơ bản và Đường ngắm đúng.", points: 1.0 },
      { criterion: "Phân tích kỹ thuật bóp cò êm dần đều kết hợp nín thở đúng thời điểm.", points: 1.0 },
      { criterion: "Giải thích rõ quy luật lệch đạn khi mặt súng nghiêng phải (lệch sang phải và xuống thấp) và cách khắc phục.", points: 1.0 }
    ],
    suggestedAnswer: `1. Phân tích 3 yếu lĩnh ngắm bắn cơ bản:
- Đường ngắm cơ bản: Là đường thẳng xuất phát từ mắt người ngắm qua chính giữa mép trên khe ngắm đến điểm chính giữa đỉnh đầu ngắm. Yêu cầu: Đỉnh đầu ngắm phải ngang bằng mép khe ngắm và khoảng cách khe hở ánh sáng hai bên đầu ngắm phải đều nhau.
- Đường ngắm đúng: Là đường ngắm cơ bản được dóng chính xác vào điểm định bắn trên mục tiêu (chính giữa mép dưới bia số 4), giữ mặt súng thăng bằng tuyệt đối không nghiêng.
- Bóp cò êm dần đều: Đặt đốt thứ nhất ngón tay trỏ vào cò súng, kéo cò tịnh tiến thẳng trục nòng về sau. Khi đường ngắm đã đúng vào điểm định ngắm thì nín thở nhẹ nhàng và tiếp tục tăng lực bóp cò từ từ cho đến khi súng nổ mà mắt vẫn nhìn thấy đường ngắm chuẩn.

2. Quy luật sai lệch khi 'Mặt súng nghiêng sang bên phải':
- Kết quả trên bia: Điểm chạm của đầu đạn trên bia sẽ bị lệch sang bên phải và bị hạ xuống thấp so với điểm định bắn.
- Nguyên nhân: Khi mặt súng nghiêng phải, góc nâng của nòng súng bị giảm đi (khiến đạn ăn xuống dưới) và lực phụt khí thuốc đẩy nòng bị xoay góc khiến đạn lệch hẳn sang phải.

3. Cách sửa chữa, khắc phục:
- Người bắn cần chỉnh lại tư thế nằm bắn, hai cùi tay tì chắc xuống đất tạo thế chân kiềng vững chắc.
- Giữ chặt báng súng tì sát vào hõm vai phải, má áp tự nhiên vào báng súng.
- Trước khi bóp cò, luôn liếc mắt kiểm tra mép trên của khe ngắm xem đã nằm trên một đường thẳng nằm ngang thăng bằng song song với mặt đất hay chưa.`
  },
  {
    id: 3205,
    grade: 12,
    lesson: "Bài 10: Bản đồ quân sự",
    prompt: "Bản đồ quân sự là 'con mắt của người chỉ huy'. Em hãy giải thích ý nghĩa của tỷ lệ bản đồ 1:50.000 và nêu cách đo cự ly giữa hai điểm trên bản đồ bằng thước milimét. Đường bình độ là gì và có vai trò như thế nào trong việc đánh giá mức độ cơ động của xe tăng, bộ binh qua địa hình đồi núi?",
    maxScore: 2.5,
    rubric: [
      { criterion: "Giải thích đúng tỷ lệ 1:50.000 (1cm trên bản đồ = 500m ngoài thực địa) và cách đo cự ly.", points: 1.0 },
      { criterion: "Định nghĩa chính xác đường bình độ.", points: 0.75 },
      { criterion: "Phân tích vai trò đường bình độ trong đánh giá độ dốc địa hình đối với khả năng cơ động xe tăng, bộ binh.", points: 0.75 }
    ],
    suggestedAnswer: `1. Ý nghĩa của tỷ lệ bản đồ 1:50.000:
- Tỷ lệ 1:50.000 cho biết mức độ thu nhỏ của bề mặt Trái Đất lên mặt phẳng bản đồ. 1 đơn vị đo trên bản đồ tương ứng với 50.000 đơn vị ngoài thực địa.
- Cụ thể: 1 cm đo trên bản đồ tương ứng với 50.000 cm = 500 mét (0,5 km) ngoài thực tế.
- Cách đo cự ly giữa hai điểm A và B: Dùng thước milimét đo độ dài đoạn thẳng AB trên bản đồ (ví dụ đo được 6,4 cm). Lấy số đo nhân với 500m: Cự ly thực địa = 6,4 x 500m = 3.200m (3,2 km).

2. Đường bình độ và vai trò trong đánh giá địa hình:
- Khái niệm: Đường bình độ là đường cong khép kín nối liền tất cả các điểm có cùng độ cao tuyệt đối trên mặt đất so với mực nước biển trung bình.
- Vai trò trong cơ động quân sự:
  + Khoảng cách giữa các đường bình độ phản ánh trực tiếp độ dốc của sườn đồi núi.
  + Nếu các đường bình độ nằm rất sát nhau (mau): Độ dốc lớn (trên 25 - 30 độ), xe tăng thiết giáp và xe cơ giới không thể vượt qua, bộ binh cơ động rất tốn sức và dễ bị trượt ngã.
  + Nếu các đường bình độ cách xa nhau (thưa): Địa hình thoai thoải hoặc bình nguyên bằng phẳng, tạo điều kiện lý tưởng cho xe tăng, bộ binh thần tốc cơ động triển khai đội hình chiến đấu.`
  },
  {
    id: 3206,
    grade: 12,
    lesson: "Bài 2: Tổ chức Quân đội và Công an nhân dân Việt Nam",
    prompt: "Em hãy trình bày cơ cấu tổ chức cơ bản của Quân đội nhân dân Việt Nam (từ Bộ Quốc phòng đến các đơn vị cơ sở). Việc học sinh trung học phổ thông hiểu rõ về tổ chức QĐND và CAND có ý nghĩa gì đối với việc định hướng nghề nghiệp và tham gia xây dựng lực lượng vũ trang nhân dân?",
    maxScore: 2.5,
    rubric: [
      { criterion: "Nêu đúng khung cơ cấu tổ chức: Bộ Quốc phòng -> Các cơ quan Bộ (BTTM, TCCT, các Tổng cục) -> Quân khu, Quân đoàn, Quân chủng, Binh chủng -> Sư đoàn, Trung đoàn, Tiểu đoàn, Đại đội, Trung đội, Tiểu đội.", points: 1.25 },
      { criterion: "Nêu ý nghĩa đối với định hướng nghề nghiệp (thi vào các học viện, trường sĩ quan quân đội, công an).", points: 0.75 },
      { criterion: "Ý nghĩa đối với nhận thức trách nhiệm công dân trong bảo vệ Tổ quốc.", points: 0.5 }
    ],
    suggestedAnswer: `1. Cơ cấu tổ chức cơ bản của Quân đội nhân dân Việt Nam:
- Cấp trung ương: Bộ Quốc phòng là cơ quan quản lý và chỉ huy cao nhất.
- Các cơ quan trực thuộc Bộ Quốc phòng: Bộ Tổng Tham mưu (chỉ huy tác chiến), Tổng cục Chính trị (công tác Đảng, công tác chính trị), Tổng cục Hậu cần - Kỹ thuật, Tổng cục Công nghiệp Quốc phòng, Tổng cục 2.
- Các đơn vị tác chiến chiến lược: 7 Quân khu (1, 2, 3, 4, 5, 7, 9) và Bộ Tư lệnh Thủ đô Hà Nội; 2 Quân chủng (Hải quân, Phòng không - Không quân); Các Quân đoàn cơ động chiến lược; Các Binh chủng chiến đấu (Pháo binh, Tăng thiết giáp, Đặc công, Công binh, Thông tin, Hóa học); Bộ đội Biên phòng và Cảnh sát biển Việt Nam.
- Hệ thống phân đội cơ sở bộ binh: Sư đoàn -> Trung đoàn -> Tiểu đoàn -> Đại đội -> Trung đội -> Tiểu đội.

2. Ý nghĩa đối với học sinh THPT:
- Về định hướng nghề nghiệp: Giúp học sinh hiểu rõ tính chất nhiệm vụ của từng quân binh chủng, từ đó định hướng đăng ký dự thi vào các Học viện, Trường Sĩ quan Quân đội (như Học viện Kỹ thuật Quân sự, Học viện Quân y, Sĩ quan Lục quân, Sĩ quan Chính trị, Sĩ quan Không quân...) phù hợp với năng lực và sở nguyện phục vụ lâu dài trong quân đội.
- Về trách nhiệm công dân: Củng cố niềm tự hào và sự tin tưởng tuyệt đối vào sức mạnh của lực lượng vũ trang nhân dân; nâng cao ý thức chấp hành pháp luật, sẵn sàng nhập ngũ hoàn thành nghĩa vụ thiêng liêng với Tổ quốc.`
  }
];

export const ALL_BANK_ESSAY: EssayQuestionSource[] = [
  ...BANK_ESSAY_10,
  ...BANK_ESSAY_11,
  ...BANK_ESSAY_12
];
