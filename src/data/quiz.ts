import { QuizQuestion } from "../types";

export const GDQP_QUIZZES: Record<number, QuizQuestion[]> = {
  10: [
    {
      id: 101,
      question: "Tiền thân của Quân đội nhân dân Việt Nam là lực lượng nào?",
      options: [
        "A. Đội Du kích Bắc Sơn",
        "B. Cứu quốc quân",
        "C. Đội Việt Nam Tuyên truyền Giải phóng quân",
        "D. Vệ quốc đoàn"
      ],
      correctAnswer: 2,
      explanation: "Tiền thân của QĐNDVN là Đội Việt Nam Tuyên truyền Giải phóng quân, thành lập ngày 22/12/1944 tại Cao Bằng gồm 34 chiến sĩ."
    },
    {
      id: 102,
      question: "Ngày truyền thống của lực lượng Công an nhân dân Việt Nam là ngày nào?",
      options: [
        "A. Ngày 22 tháng 12",
        "B. Ngày 19 tháng 8",
        "C. Ngày 02 tháng 9",
        "D. Ngày 30 tháng 4"
      ],
      correctAnswer: 1,
      explanation: "Ngày 19/8/1945 gắn liền với mốc thành công của Cách mạng tháng Tám vĩ đại là ngày chính thức thành lập Công an nhân dân Việt Nam."
    },
    {
      id: 103,
      question: "Khi thực hiện khẩu lệnh động tác 'Nghiêm', hai bàn chân học sinh đặt thế nào?",
      options: [
        "A. Hai bàn chân đặt song song sát nhau.",
        "B. Hai bàn chân mở rộng bằng vai.",
        "C. Hai gót chân sát nhau, hai mũi bàn chân mở rộng một góc 45 độ.",
        "D. Gót chân trái sát mũi chân phải góc 90 độ."
      ],
      correctAnswer: 2,
      explanation: "Tư thế nghiêm chuẩn mực là hai gót chân sát nhau, hai thân gót chân thăng bằng thẳng, hai bàn chân mở rộng góc 45 độ tự nhiên."
    },
    {
      id: 104,
      question: "Khi muốn quay đằng sau tại chỗ trong điều lệnh đội ngũ, học sinh thực hiện quay theo chiều nào?",
      options: [
        "A. Quay sang bên trái 180 độ.",
        "B. Quay sang bên phải 180 độ.",
        "C. Quay hướng nào thuận tay nhất.",
        "D. Quay hai lần 90 độ liên tục."
      ],
      correctAnswer: 1,
      explanation: "Quay đằng sau luôn quay sang bên phải hướng ra sau một góc 180 độ bằng cách lấy gót chân phải và mũi chân trái làm trụ đỡ."
    },
    {
      id: 105,
      question: "Đâu không phải là hình thức gây nghiện độc hại thường trá hình ma túy học đường hiện nay?",
      options: [
        "A. Nước khoáng tinh khiết đóng chai có kiểm định an toàn của Bộ Y tế",
        "B. Bóng cười chứa khí N2O độc hại thần kinh",
        "C. Tinh dầu thuốc lá điện tử không rõ nguồn gốc chứa bồ đà dạng lỏng",
        "D. Chất bột ngụy trang kẹo khói bọc kín túi zipper"
      ],
      correctAnswer: 0,
      explanation: "Nước khoáng đóng chai đạt chuẩn cấp phép y tế là thực phẩm sạch, còn lại các loại thuốc lá điện tử, bóng cười đầy nguy hiểm gây hại thần kinh học đường."
    },
    {
      id: 106,
      question: "Ai là người trực tiếp chỉ huy chỉ đạo thành lập quân đội nguyên sơ đầu tiên của Đội VN Tuyên truyền Giải phóng quân?",
      options: [
        "A. Chủ tịch Hồ Chí Minh",
        "B. Đồng chí Trường Chinh",
        "C. Đồng chí Võ Nguyên Giáp",
        "D. Đồng chí Phạm Văn Đồng"
      ],
      correctAnswer: 2,
      explanation: "Đại tướng Võ Nguyên Giáp (lúc bấy giờ là đồng chí Võ Nguyên Giáp) được Bác Hồ tin tưởng trực tiếp phụ trách lãnh đạo chỉ huy thành lập đội ban đầu."
    },
    {
      id: 107,
      question: "Trong điều lệnh đội ngũ từng người, khẩu lệnh quay gồm có phần gì?",
      options: [
        "A. Động lệnh và dự lệnh",
        "B. Chỉ gồm độc nhất động lệnh thúc giục",
        "C. Khẩu lệnh viết dạng văn bản hành chính",
        "D. Gọi tên học sinh từng cá nhân"
      ],
      correctAnswer: 0,
      explanation: "Khẩu lệnh thường có Dự lệnh (để chuẩn bị tư thế đứng trụ) và Động lệnh (để dứt khoát làm động tác quay). Ví dụ: 'Bên phải' (Dự lệnh) - 'Quay!' (Động lệnh)."
    },
    {
      id: 108,
      question: "Khẩu lệnh chuẩn xác cho động tác nghỉ là gì?",
      options: [
        "A. 'Hãy Nghỉ!'",
        "B. 'Đứng Nghiêm và Nghỉ!'",
        "C. 'Nghỉ!'",
        "D. 'Tự do hoạt động!'"
      ],
      correctAnswer: 2,
      explanation: "Khẩu lệnh cho động tác nghỉ chỉ gồm duy nhất từ hô dứt khoát: 'Nghỉ!'."
    }
  ],
  11: [
    {
      id: 111,
      question: "Độ tuổi tham gia nghĩa vụ quân sự bình thường đối với công dân nam trong điều kiện thời bình là bao nhiêu?",
      options: [
        "A. Từ đủ 17 tuổi đến hết 25 tuổi",
        "B. Từ đủ 18 tuổi đến hết 25 tuổi",
        "C. Từ đủ 18 tuổi đến hết 27 tuổi",
        "D. Từ đủ 16 tuổi đến hết 30 tuổi"
      ],
      correctAnswer: 1,
      explanation: "Luật NVQS sửa đổi bổ sung quy định độ tuổi gọi nhập ngũ bình thường là từ đủ 18 tuổi đến hết 25 tuổi."
    },
    {
      id: 112,
      question: "Học sinh đang học Đại học, Cao đẳng chính quy được kéo dài độ tuổi gọi nhập ngũ đến hết bao nhiêu tuổi?",
      options: [
        "A. Hết 25 tuổi",
        "B. Hết 26 tuổi",
        "C. Hết 27 tuổi",
        "D. Hết 28 tuổi"
      ],
      correctAnswer: 2,
      explanation: "Được gia hạn tạm hoãn để hoàn thành khoá học Đại Học/Cao đẳng chính quy đến hết tuổi 27."
    },
    {
      id: 113,
      question: "Không gian bao trùm lên vùng đất và vùng nước của quốc gia gọi là gì?",
      options: [
        "A. Vùng thềm lục địa ngoài rìa lãnh hải",
        "B. Vùng an ninh biên thùy",
        "C. Vùng trời quốc gia",
        "D. Vùng tiếp giáp hải bờ"
      ],
      correctAnswer: 2,
      explanation: "Vùng trời quốc gia là phần giới hạn không gian phía trên vùng đất liền và vùng nước thuộc chủ quyền tuyệt đối của Việt Nam."
    },
    {
      id: 114,
      question: "Súng tiểu liên AK-47 do nước nào thiết kế, chế tạo đầu tiên?",
      options: [
        "A. Nước Mỹ",
        "B. Nước Cộng hòa Pháp",
        "C. Liên bang Xô Viết (Liên Xô)",
        "D. Cộng hòa nhân dân Trung Hoa"
      ],
      correctAnswer: 2,
      explanation: "AK-47 do nhà thiết kế Mikhail Kalashnikov nổi tiếng của Liên Xô sáng tạo vào năm 1947."
    },
    {
      id: 115,
      question: "Khẩu súng AK-47 nguyên bản nặng khoảng bao nhiêu kilôgam khi không nạp đạn?",
      options: [
        "A. Khoảng 1,5 kg",
        "B. Khoảng 2,8 kg",
        "C. Khoảng 3,8 kg",
        "D. Khoảng 5,0 kg"
      ],
      correctAnswer: 2,
      explanation: "Súng AK-47 nguyên bản không lắp lê và không chứa đạn nặng khoảng 3,8 kg (với báng gỗ đặc trưng)."
    },
    {
      id: 116,
      question: "Quá trình tháo lắp súng AK gồm mấy bước tháo chính cơ bản?",
      options: [
        "A. Gồm 5 bước tháo",
        "B. Gồm 7 bước tháo dỡ linh kiện rời",
        "C. Gồm 8 bước tháo chính",
        "D. Gồm 10 bước tháo lắp phức tạp"
      ],
      correctAnswer: 2,
      explanation: "Theo sách giáo khoa Quốc phòng An ninh lớp 11 hiện hành, quy trình tháo rời súng AK-47 có đúng 8 bước chính tự liên kết tuần tự bảo đảm an toàn."
    },
    {
      id: 117,
      question: "Bước thứ nhất bắt buộc phải thực hiện trong quy trình tháo súng AK là gì?",
      options: [
        "A. Tháo nắp hộp khóa nòng bắn thử.",
        "B. Tháo bộ phận lò xo của pittông đẩy về liền kề.",
        "C. Tháo hộp tiếp đạn và thực hiện khám súng (kiểm tra an toàn buồng chứa đạn).",
        "D. Rút thông nòng thông suốt súng ngay tức khắc."
      ],
      correctAnswer: 2,
      explanation: "Nguyên tắc sống còn: Luôn tháo hộp tiếp đạn trước rồi bóp cò kiểm tra an toàn (bước khám súng) tránh tai nạn đáng tiếc do đạn sót trong súng."
    },
    {
      id: 118,
      question: "Lãnh hải của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam rộng bao nhiêu hải lý tính từ đường cơ sở?",
      options: [
        "A. Rộng 3 hải lý",
        "B. Rộng 12 hải lý",
        "C. Rộng 24 hải lý",
        "D. Rộng 200 hải lý"
      ],
      correctAnswer: 1,
      explanation: "Ranh giới Lãnh hải quốc gia của Việt Nam rộng đúng 12 hải lý tính từ đường cơ sở quy định pháp lý quốc tế hoàn vũ."
    }
  ],
  12: [
    {
      id: 121,
      question: "Sĩ quan cấp Tá trong Quân đội nhân dân Việt Nam cao nhất là cấp hàm nào?",
      options: [
        "A. Trung tá",
        "B. Thượng tá",
        "C. Đại tá (4 sao dệt nổi trên 2 vạch vàng)",
        "D. Thiếu tướng"
      ],
      correctAnswer: 2,
      explanation: "Cấp Tá gồm 4 bậc từ thấp đến cao: Thiếu tá, Trung tá, Thượng tá, Đại tá. Cao nhất cấp Tá là Đại tá."
    },
    {
      id: 122,
      question: "Cầu vai có dệt cầu nhung đỏ, đính 2 sao vàng và có 1 vạch sọc chạy song song biểu trưng cấp hàm gì?",
      options: [
        "A. Thiếu úy",
        "B. Trung úy (1 vạch dọc, 2 sao vàng viền đỏ dọc tay áo)",
        "C. Trung tá",
        "D. Thiếu tá"
      ],
      correctAnswer: 1,
      explanation: "1 vạch dọc vàng dệt chìm biểu thị cấp Úy, kết hợp đính kèm đúng 2 ngôi sao vàng phản chiếu đại diện cho học vị sĩ quan Trung úy quân nhân."
    },
    {
      id: 123,
      question: "Khi đối phương dội súng đạn xối xả nằm phục kích bắn tỉa, tư thế tiến công bò lê nào là phù hợp an toàn nhất cho người lính?",
      options: [
        "A. Đi lom khom chạy nhanh vượt hào rộng",
        "B. Trườn sấp phẳng người dưới đất sâu vạt rác cỏ ẩm",
        "C. Nhảy lùi dốc phòng thủ dã chiến",
        "D. Đi hiên ngang khiêu khích dụ đối thủ tốn đạn"
      ],
      correctAnswer: 1,
      explanation: "Trườn sấp sát sụt hạ xuống mặt đất mấp mô sỏi đá cỏ rậm là tư thế khép thấp nhất diện tích cơ thể, hạn chế tối đa hỏa lực quét trực diện."
    },
    {
      id: 124,
      question: "Một địa vật được xem là che chở (hay che đỡ) kiên cố hoàn hảo khi thỏa mãn đặc tính kỹ thuật nào?",
      options: [
        "A. Giúp học sinh che giấu mắt kẻ thù nhưng đạn dễ dàng xuyên thẳng qua",
        "B. Vừa che được mắt địch quan sát vừa ngăn chặn được mảnh vỡ thuốc súng đạn ráo thẳng",
        "C. Là nơi hông có ánh sáng mặt trời rọi thẳng xuống",
        "D. Chỉ che chắn được dơi muỗi rừng ẩm xung quanh"
      ],
      correctAnswer: 1,
      explanation: "Địa vật che chở có giá trị bền chắc cao vừa che khuất thân thể khỏi ánh tầm bắt, vừa có khả năng phản lực hứng lực chống đạn xuyên thép vững vàng."
    },
    {
      id: 125,
      question: "Bức tranh tổng thể hệ thống Công an nhân dân Việt Nam được xây dựng bởi hai mũi nhọn trọng pháp nào?",
      options: [
        "A. Lực lượng Đặc công thủy và Không quân an ninh",
        "B. Lực lượng An ninh nhân dân và Cảnh sát nhân dân",
        "C. Cảnh vệ dinh thự và Phạt nguội công bằng",
        "D. An ninh cơ mật mật vụ và Bộ binh dã chiến"
      ],
      correctAnswer: 1,
      explanation: "Cơ cấu trụ cột của Bộ Công an chính là lực lượng An ninh nhân dân bảo vệ mật vụ quốc phòng nội vụ & Cảnh sát nhân dân giữ gìn trật tự an sinh."
    },
    {
      id: 126,
      question: "Trên bản đồ quân sự, hướng hành quân tấn công hay điểm xuất phát thực binh của quân ta dã chiến được biểu hiệu quy định bằng màu gì?",
      options: [
        "A. Màu lục thẫm bảo trì nguy trang",
        "B. Màu xanh lam đậm chỉ điểm rút lui",
        "C. Màu đỏ tươi anh dũng chí nhiệt huyết",
        "D. Màu vàng chanh cảnh báo khói bụi hiểm họa"
      ],
      correctAnswer: 2,
      explanation: "Theo đúng điều luật đồ bản vẽ quân sự chung, màu đỏ tươi biểu hiện chủ thể quân ta hành chiến dã trận, sọc màu xanh lam đại diện đối phương địch."
    },
    {
      id: 127,
      question: "Độ tuổi cao nhất được phép xin tạm hoãn thi hành nghĩa vụ quân sự để học cử nhân đại học lần đầu là hết bao nhiêu?",
      options: [
        "A. Hết 22 tuổi",
        "B. Hết 25 tuổi",
        "C. Hết 27 tuổi",
        "D. Hết 30 tuổi"
      ],
      correctAnswer: 2,
      explanation: "Theo điểm g khoản 1 Điều 41 Luật nghĩa vụ quân sự 2015, sinh viên đại học chính quy được tạm hoãn tối đa tới hết năm 27 tuổi."
    },
    {
      id: 128,
      question: "Tầm bắn thẳng đối với mục tiêu bia người nằm của súng AK-47 là khoảng bao nhiêu mét?",
      options: [
        "A. 100 m",
        "B. 350 m",
        "C. 525 m",
        "D. 800 m"
      ],
      correctAnswer: 1,
      explanation: "Tầm bắn thẳng mục tiêu bia người nằm (bia số 4) của súng tiểu liên AK-47 là 350 mét, đối với bia người chạy khom là 525 mét."
    }
  ]
};
