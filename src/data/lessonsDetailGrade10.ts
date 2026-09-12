import { DetailedLesson } from './lessonsDetail';

export const DETAILED_LESSONS_10: DetailedLesson[] = [
  {
    id: '10_1',
    order: 'Bài 1',
    title: 'Lịch sử, truyền thống của lực lượng vũ trang nhân dân Việt Nam',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được quá trình hình thành, các mốc son lịch sử chói lọi của Quân đội nhân dân, Công an nhân dân và Dân quân tự vệ.',
        'Phân tích được bản chất giai cấp công nhân, tính nhân dân và tính dân tộc sâu sắc của LLVTND Việt Nam.',
        'Hiểu rõ 6 truyền thống vẻ vang của Quân đội và các truyền thống anh hùng của Công an nhân dân.'
      ],
      skills: [
        'Nhận biết và phân biệt được các giai đoạn lịch sử phát triển của lực lượng vũ trang.',
        'Phân tích và liên hệ được vai trò của thanh niên học sinh trong sự nghiệp xây dựng nền quốc phòng toàn dân.'
      ],
      attitudes: [
        'Bồi dưỡng lòng yêu nước, tự hào, tự tôn dân tộc.',
        'Có ý thức trách nhiệm học tập, rèn luyện để sẵn sàng thực hiện nghĩa vụ thiêng liêng bảo vệ Tổ quốc.'
      ]
    },
    sections: [
      {
        title: 'I. Lịch sử hình thành và phát triển của Quân đội nhân dân Việt Nam',
        paragraphs: [
          'Ngày 22/12/1944, thực hiện chỉ thị của Lãnh tụ Hồ Chí Minh, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại khu rừng giữa hai tổng Hoàng Hoa Thám và Trần Hưng Đạo thuộc châu Nguyên Bình, tỉnh Cao Bằng. Ban đầu Đội gồm 34 chiến sĩ, do đồng chí Võ Nguyên Giáp chỉ huy, trang bị 34 khẩu súng các loại.',
          'Ngay sau khi thành lập, Đội đã mưu trí, táo bạo đánh thắng liên tiếp hai trận Phai Khắt (25/12/1944) và Nà Ngần (26/12/1944), mở đầu cho truyền thống "Trận đầu đánh thắng" của Quân đội nhân dân Việt Nam.'
        ],
        bullets: [
          'Tháng 5/1945: Thống nhất Đội Việt Nam Tuyên truyền Giải phóng quân với Cứu quốc quân thành Việt Nam Giải phóng quân.',
          'Sau Cách mạng Tháng Tám năm 1945: Đổi tên thành Vệ quốc đoàn, rồi Quân đội Quốc gia Việt Nam (1946).',
          'Năm 1950: Đổi tên thành Quân đội nhân dân Việt Nam. Ngày 22/12 hàng năm trở thành Ngày truyền thống của Quân đội nhân dân Việt Nam và Ngày hội Quốc phòng toàn dân (từ năm 1989).'
        ],
        table: {
          headers: ['Thời kỳ / Mốc son', 'Sự kiện tiêu biểu', 'Chiến công hiển hách'],
          rows: [
            ['22/12/1944', 'Thành lập Đội VNTTGPQ', 'Chiến thắng Phai Khắt, Nà Ngần'],
            ['1946 - 1954', 'Kháng chiến chống thực dân Pháp', 'Chiến dịch Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" (07/5/1954)'],
            ['1954 - 1975', 'Kháng chiến chống Mỹ cứu nước', 'Chiến thắng "Hà Nội - Điện Biên Phủ trên không" (1972), Đại thắng mùa Xuân 1975 giải phóng miền Nam']
          ]
        }
      },
      {
        title: 'II. Bản chất và 6 truyền thống vẻ vang của Quân đội nhân dân Việt Nam',
        paragraphs: [
          'Bản chất: QĐND Việt Nam mang bản chất giai cấp công nhân, tính nhân dân và tính dân tộc sâu sắc; đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam; là công cụ bạo lực sắc bén bảo vệ Đảng, Nhà nước và Nhân dân.'
        ],
        bullets: [
          '1. Trung thành vô hạn với Tổ quốc, với Đảng, Nhà nước và Nhân dân.',
          '2. Quyết chiến, quyết thắng, biết đánh và biết thắng.',
          '3. Gắn bó máu thịt với nhân dân - "Quân với dân như cá với nước".',
          '4. Nội bộ đoàn kết thống nhất, kỷ luật tự giác, nghiêm minh.',
          '5. Độc lập, tự chủ, tự lực, tự cường, cần kiệm xây dựng quân đội.',
          '6. Nêu cao tinh thần quốc tế vô sản trong sáng, chí nghĩa, chí tình.'
        ],
        tipBox: {
          title: 'Lời khen ngợi của Chủ tịch Hồ Chí Minh',
          content: '"Quân đội ta trung với Đảng, hiếu với dân, sẵn sàng chiến đấu, hy sinh vì độc lập, tự do của Tổ quốc, vì chủ nghĩa xã hội. Nhiệm vụ nào cũng hoàn thành, khó khăn nào cũng vượt qua, kẻ thù nào cũng đánh thắng."'
        }
      },
      {
        title: 'III. Lịch sử và truyền thống của Công an nhân dân Việt Nam',
        paragraphs: [
          'Ngày 19/8/1945 - ngày Tổng khởi nghĩa Cách mạng Tháng Tám thành công ở Hà Nội cũng chính là Ngày truyền thống của Công an nhân dân Việt Nam. Từ năm 2005, ngày 19/8 hàng năm được xác định là "Ngày hội toàn dân bảo vệ an ninh Tổ quốc".',
          'CAND là lực lượng vũ trang trọng yếu của Đảng và Nhà nước, nòng cốt bảo vệ an ninh quốc gia, bảo đảm trật tự, an toàn xã hội.'
        ],
        bullets: [
          'Truyền thống tuyệt đối trung thành với Tổ quốc, với Đảng, với Nhân dân.',
          'Gắn bó chặt chẽ với nhân dân, vì nhân dân phục vụ, dựa vào dân để công tác và chiến đấu.',
          'Cảnh giác, bí mật, mưu trí, dũng cảm, kiên quyết khôn khéo trong đấu tranh phòng chống tội phạm.'
        ]
      }
    ],
    keyTakeaways: [
      'Đội Việt Nam Tuyên truyền Giải phóng quân thành lập ngày 22/12/1944 tại Cao Bằng gồm 34 chiến sĩ.',
      'Chiến thắng mở đầu truyền thống đánh thắng trận đầu: Phai Khắt và Nà Ngần.',
      'Ngày 19/8/1945 là Ngày truyền thống Công an nhân dân và Ngày hội toàn dân bảo vệ an ninh Tổ quốc.',
      'Quân đội và Công an đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam.'
    ],
    practicalApplication: [
      'Nêu cao tinh thần tự giác, kỷ luật trong sinh hoạt và học tập hàng ngày tại trường.',
      'Tích cực tham gia các phong trào "Đền ơn đáp nghĩa", chăm sóc nghĩa trang liệt sĩ, giúp đỡ gia đình thương binh, liệt sĩ tại địa phương.',
      'Kiên quyết đấu tranh bảo vệ uy tín và hình ảnh Bộ đội Cụ Hồ, Công an nhân dân trước các luận điệu xuyên tạc trên mạng xã hội.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Đội Việt Nam Tuyên truyền Giải phóng quân khi thành lập gồm bao nhiêu chiến sĩ và do ai chỉ huy?',
        options: [
          '34 chiến sĩ, do đồng chí Võ Nguyên Giáp chỉ huy',
          '30 chiến sĩ, do đồng chí Hoàng Văn Thái chỉ huy',
          '36 chiến sĩ, do đồng chí Chu Văn Tấn chỉ huy',
          '40 chiến sĩ, do Lãnh tụ Hồ Chí Minh trực tiếp chỉ huy'
        ],
        correctAnswer: 0,
        explanation: 'Ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại Cao Bằng gồm 34 chiến sĩ do đồng chí Võ Nguyên Giáp chỉ huy.'
      },
      {
        id: 2,
        question: 'Ngày 19 tháng 8 hàng năm có ý nghĩa gì đối với lực lượng vũ trang nhân dân Việt Nam?',
        options: [
          'Ngày truyền thống Công an nhân dân & Ngày hội toàn dân bảo vệ an ninh Tổ quốc',
          'Ngày truyền thống của Dân quân tự vệ',
          'Ngày thành lập Quân đội nhân dân Việt Nam',
          'Ngày thành lập Bộ Tổng tham mưu'
        ],
        correctAnswer: 0,
        explanation: 'Ngày 19/8/1945 là ngày Cách mạng Tháng Tám thắng lợi ở Hà Nội, đồng thời là Ngày truyền thống CAND Việt Nam.'
      }
    ]
  },
  {
    id: '10_2',
    order: 'Bài 2',
    title: 'Nội dung cơ bản một số luật về quốc phòng và an ninh Việt Nam',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được những nội dung cốt lõi của Luật Giáo dục Quốc phòng và An ninh năm 2013.',
        'Trình bày được vị trí, chức năng, cấp bậc hàm và nghĩa vụ, quyền lợi của Sĩ quan QĐND Việt Nam.',
        'Nắm vững chức năng, nhiệm vụ, cơ cấu tổ chức và cấp bậc hàm của Công an nhân dân Việt Nam.'
      ],
      skills: [
        'Phân biệt được cấp bậc hàm, ngạch sĩ quan tại ngũ và sĩ quan dự bị.',
        'Định hướng nghề nghiệp đối với học sinh có nguyện vọng thi vào các học viện, trường sĩ quan quân đội, công an.'
      ],
      attitudes: [
        'Tôn trọng pháp luật, tự giác chấp hành các quy định pháp luật về quốc phòng và an ninh.',
        'Xây dựng ý thức sẵn sàng cống hiến sức trẻ cho sự nghiệp bảo vệ Tổ quốc.'
      ]
    },
    sections: [
      {
        title: 'I. Luật Giáo dục Quốc phòng và An ninh',
        paragraphs: [
          'Mục tiêu: Giáo dục cho công dân về lòng yêu nước, niềm tự hào dân tộc, kiến thức quốc phòng và an ninh; bồi dưỡng nâng cao nhận thức, trách nhiệm của công dân đối với nhiệm vụ xây dựng nền quốc phòng toàn dân và thế trận an ninh nhân dân.',
          'Tính chất môn học: GDQP-AN là môn học chính khóa trong chương trình giáo dục phổ thông (từ cấp THPT), cao đẳng, đại học. Kết quả đánh giá môn học là điều kiện để xét tốt nghiệp.'
        ],
        bullets: [
          'Quyền và trách nhiệm: Công dân có quyền và nghĩa vụ học tập kiến thức quốc phòng và an ninh theo luật định.',
          'Nghiêm cấm các hành vi: Trốn tránh, cản trở việc học tập GDQP-AN; lợi dụng giáo dục quốc phòng để tuyên truyền sai lệch đường lối, chính sách của Đảng và Nhà nước.'
        ]
      },
      {
        title: 'II. Luật Sĩ quan Quân đội nhân dân Việt Nam',
        paragraphs: [
          'Khái niệm Sĩ quan: Là cán bộ của Đảng và Nhà nước hoạt động trong lĩnh vực quân sự, được Nhà nước phong quân hàm cấp Úy, cấp Tá, cấp Tướng.',
          'Hai ngạch sĩ quan: Ngạch sĩ quan tại ngũ (đang phục vụ trong quân đội) và Ngạch sĩ quan dự bị (đã được đào tạo sĩ quan dự bị, đăng ký quản lý tại cơ quan quân sự địa phương).'
        ],
        table: {
          headers: ['Cấp sĩ quan', 'Các bậc quân hàm trong cấp (thấp đến cao)', 'Dấu hiệu nhận biết sao'],
          rows: [
            ['Cấp Tướng (4 bậc)', 'Thiếu tướng -> Trung tướng -> Thượng tướng -> Đại tướng', 'Từ 1 sao vàng lớn đến 4 sao vàng lớn'],
            ['Cấp Tá (4 bậc)', 'Thiếu tá -> Trung tá -> Thượng tá -> Đại tá', 'Từ 1 sao đến 4 sao (cầu vai có 2 vạch vàng/đỏ)'],
            ['Cấp Úy (4 bậc)', 'Thiếu úy -> Trung úy -> Thượng úy -> Đại úy', 'Từ 1 sao đến 4 sao (cầu vai có 1 vạch)']
          ]
        },
        bullets: [
          'Nghĩa vụ của sĩ quan: Tuyệt đối trung thành với Tổ quốc; sẵn sàng chiến đấu, hy sinh; tôn trọng quyền làm chủ của nhân dân; chấp hành nghiêm điều lệnh, giữ bí mật quân sự.',
          'Quyền lợi: Được bảo đảm tiền lương, phụ cấp, nhà ở công vụ, chăm sóc sức khỏe cho bản thân và thân nhân; được cử đi đào tạo bồi dưỡng nâng cao trình độ.'
        ]
      },
      {
        title: 'III. Luật Công an nhân dân',
        paragraphs: [
          'Chức năng của CAND: Làm nòng cốt bảo vệ an ninh quốc gia, bảo đảm trật tự an toàn xã hội, đấu tranh phòng chống tội phạm.',
          'Hệ thống tổ chức 4 cấp: 1. Bộ Công an -> 2. Công an tỉnh, thành phố trực thuộc Trung ương -> 3. Công an huyện, quận, thị xã -> 4. Công an xã, phường, thị trấn.'
        ],
        bullets: [
          'Cấp bậc hàm sĩ quan, hạ sĩ quan nghiệp vụ Công an: Tương tự như Quân đội, gồm cấp Tướng (4 bậc), cấp Tá (4 bậc), cấp Úy (4 bậc), Hạ sĩ quan (3 bậc: Thượng sĩ, Trung sĩ, Hạ sĩ).',
          'Cấp bậc hàm cao nhất của Công an nhân dân là Đại tướng (Bộ trưởng Bộ Công an).'
        ]
      }
    ],
    keyTakeaways: [
      'Môn GDQP-AN là môn học chính khóa bắt buộc ở cấp THPT, điều kiện để xét tốt nghiệp.',
      'Sĩ quan Quân đội nhân dân Việt Nam có 3 cấp (Tướng, Tá, Úy) và 12 bậc quân hàm.',
      'Công an nhân dân được tổ chức chặt chẽ theo mô hình 4 cấp hành chính từ Trung ương đến cấp xã.',
      'Công dân Việt Nam đủ tiêu chuẩn chính trị, phẩm chất đạo đức, học vấn và sức khỏe có quyền thi tuyển vào các trường sĩ quan QĐ và CA.'
    ],
    practicalApplication: [
      'Nghiêm túc trong từng giờ học GDQP-AN lý thuyết cũng như các bài huấn luyện thực hành ngoài thao trường.',
      'Tìm hiểu thông tin tuyển sinh quân sự, công an để chuẩn bị hồ sơ sơ tuyển từ đầu năm học lớp 12 nếu có nguyện vọng phục vụ lâu dài trong lực lượng vũ trang.',
      'Gương mẫu chấp hành pháp luật nơi cư trú, tham gia giữ gìn an ninh trật tự khu phố, trường học.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Hệ thống cấp bậc quân hàm của Sĩ quan Quân đội nhân dân Việt Nam gồm có mấy cấp?',
        options: [
          '3 cấp (Cấp Tướng, Cấp Tá, Cấp Úy)',
          '4 cấp (Cấp Tướng, Cấp Tá, Cấp Úy, Cấp Binh sĩ)',
          '2 cấp (Cấp Chỉ huy, Cấp Binh sĩ)',
          '5 cấp (Thống tướng, Đại tướng, Tướng, Tá, Úy)'
        ],
        correctAnswer: 0,
        explanation: 'Sĩ quan QĐND có 3 cấp: Cấp Tướng (4 bậc), Cấp Tá (4 bậc) và Cấp Úy (4 bậc), tổng cộng 12 bậc.'
      },
      {
        id: 2,
        question: 'Hệ thống tổ chức của Công an nhân dân Việt Nam được phân thành mấy cấp hành chính?',
        options: ['4 cấp (Bộ, Tỉnh, Huyện, Xã)', '3 cấp (Bộ, Tỉnh, Huyện)', '2 cấp (Trung ương và Địa phương)', '5 cấp'],
        correctAnswer: 0,
        explanation: 'CAND được tổ chức theo 4 cấp: Bộ Công an; Công an tỉnh/thành phố; Công an quận/huyện; Công an xã/phường/thị trấn.'
      }
    ]
  },
  {
    id: '10_3',
    order: 'Bài 3',
    title: 'Ma túy, tác hại của ma túy và phòng, chống ma túy trong trường học',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được khái niệm ma túy, các nhóm ma túy tự nhiên, bán tổng hợp và tổng hợp; nhận diện các hình thức ma túy ngụy trang thế hệ mới.',
        'Phân tích sâu sắc tác hại khôn lường của ma túy đối với sức khỏe, gia đình, nhà trường và trật tự xã hội.',
        'Nắm vững các quy định pháp luật xử lý hành vi tàng trữ, sử dụng, mua bán chất ma túy.'
      ],
      skills: [
        'Nhận biết các biểu hiện của người nghiện ma túy để kịp thời phòng ngừa.',
        'Kỹ năng từ chối dứt khoát trước các lời rủ rê, lôi kéo dùng thử chất kích thích.',
        'Biết cách báo cáo kịp thời cho thầy cô, cha mẹ và cơ quan công an khi phát hiện dấu hiệu ma túy.'
      ],
      attitudes: [
        'Kiên quyết nói "KHÔNG" với ma túy dưới mọi hình thức, dù chỉ một lần.',
        'Có thái độ đồng cảm, hỗ trợ cai nghiện, không kỳ thị đối với người sau cai nghiện tái hòa nhập cộng đồng.'
      ]
    },
    sections: [
      {
        title: 'I. Phân loại và nhận diện các chất ma túy',
        paragraphs: [
          'Chất ma túy là chất gây nghiện, chất hướng thần được quy định trong danh mục do Chính phủ ban hành. Ma túy có khả năng làm thay đổi trạng thái tâm sinh lý, gây nghiện về thể chất và tâm thần, nếu ngừng sử dụng sẽ xuất hiện hội chứng cai nghiện vật vã.'
        ],
        table: {
          headers: ['Nhóm ma túy', 'Nguồn gốc / Đại diện', 'Dấu hiệu nhận diện đặc trưng'],
          rows: [
            ['Tự nhiên', 'Thuốc phiện, cần sa, lá coca', 'Nhựa cây đen sẫm, thảo mộc khô mùi khét đặc trưng'],
            ['Bán tổng hợp', 'Morphin, Heroin', 'Bột trắng hoặc vàng ngà, không mùi, vị đắng'],
            ['Tổng hợp', 'Thuốc lắc (MDMA), Ma túy đá (Methamphetamine), Ketamine', 'Dạng viên nén nhiều màu, dạng tinh thể lấp lánh như đá']
          ]
        },
        tipBox: {
          title: 'CẢNH BÁO NGUY HIỂM: Ma túy thế hệ mới ngụy trang',
          content: 'Hiện nay xuất hiện ma túy ngụy trang tinh vi dưới dạng "nước vui", "trà sữa", kẹo cao su, thảo mộc "cỏ Mỹ" và đặc biệt là pha trộn vào tinh dầu thuốc lá điện tử (Pod chill/Vape). Học sinh tuyệt đối không sử dụng đồ ăn, thức uống không rõ nguồn gốc từ người lạ!'
        }
      },
      {
        title: 'II. Tác hại toàn diện của ma túy',
        bullets: [
          'Đối với sức khỏe: Hủy hoại hệ thần kinh trung ương gây loạn thần, hoang tưởng, ảo giác ("ngáo đá"); làm suy kiệt cơ thể, suy gan, thận; nguy cơ lây nhiễm HIV/AIDS và tử vong do sốc thuốc.',
          'Đối với gia đình: Làm khánh kiệt kinh tế, hạnh phúc tan vỡ, gây bạo lực gia đình.',
          'Đối với xã hội: Là nguyên nhân trực tiếp phát sinh các tội phạm hình sự nguy hiểm như cướp của, giết người, trộm cắp; làm suy thoái giống nòi.'
        ]
      },
      {
        title: 'III. Trách nhiệm của học sinh trong phòng chống ma túy',
        bullets: [
          'Không sử dụng ma túy dưới bất kỳ hình thức nào, không thử dù chỉ 1 lần.',
          'Không tàng trữ, vận chuyển, mua bán hoặc rủ rê bạn bè tham gia sử dụng ma túy.',
          'Xây dựng lối sống lành mạnh, tham gia các hoạt động thể thao, văn hóa bổ ích.',
          'Kịp thời thông báo cho thầy cô, bảo vệ trường hoặc công an phường khi phát hiện hành vi nghi vấn.'
        ]
      }
    ],
    keyTakeaways: [
      'Ma túy gây nghiện nghiêm trọng cả về thể xác lẫn tinh thần và tàn phá mọi mặt đời sống.',
      'Cảnh giác tối đa với ma túy ngụy trang trong bánh kẹo, nước uống và tinh dầu thuốc lá điện tử.',
      'Mọi hành vi mua bán, vận chuyển, tàng trữ, tổ chức sử dụng ma túy đều bị pháp luật xử lý hình sự rất nghiêm khắc.',
      'Quy tắc vàng của học sinh: Tuyệt đối không thử, dứt khoát từ chối và báo ngay cho người có trách nhiệm.'
    ],
    practicalApplication: [
      'Không nhận cầm hộ gói hàng, túi đồ của người lạ tại cổng trường hoặc bến xe buýt.',
      'Kiên quyết từ chối thuốc lá điện tử, shisha, bóng cười và các đồ uống pha sẵn lạ mắt tại các tụ điểm vui chơi.',
      'Tích cực tham gia câu lạc bộ "Trường học không ma túy" và tuyên truyền cho người thân trong gia đình.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Hình thức ngụy trang ma túy nào sau đây đang len lỏi và có nguy cơ cao nhất đối với học sinh phổ thông?',
        options: [
          'Pha trộn chất ma túy tổng hợp vào tinh dầu thuốc lá điện tử (Pod/Vape)',
          'Đúc thành bánh như thuốc nổ TNT',
          'Dùng bao tải vận chuyển qua cảng biển',
          'Để nguyên cây tươi trồng trong vườn'
        ],
        correctAnswer: 0,
        explanation: 'Ma túy thế hệ mới thường được ngụy trang vào tinh dầu thuốc lá điện tử (Pod chill), nước vui, kẹo bánh để nhắm vào giới trẻ.'
      }
    ]
  },
  {
    id: '10_4',
    order: 'Bài 4',
    title: 'Phòng, chống vi phạm pháp luật về trật tự an toàn giao thông',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nắm vững hệ thống báo hiệu đường bộ (hiệu lệnh người điều khiển, đèn tín hiệu, 5 nhóm biển báo, vạch kẻ đường).',
        'Nêu được các quy tắc an toàn giao thông đường bộ cốt lõi đối với người đi bộ, đi xe đạp, xe đạp điện và xe máy.',
        'Hiểu rõ quy định pháp luật về độ tuổi và nồng độ cồn khi điều khiển phương tiện.'
      ],
      skills: [
        'Phân biệt đúng ý nghĩa các loại biển báo giao thông.',
        'Thực hành văn hóa tham gia giao thông an toàn, đội mũ bảo hiểm đạt chuẩn.'
      ],
      attitudes: [
        'Tự giác chấp hành pháp luật giao thông, không lạng lách, đánh võng.',
        'Có ý thức nhường nhịn, giúp đỡ người già, trẻ em khi qua đường.'
      ]
    },
    sections: [
      {
        title: 'I. Hệ thống báo hiệu đường bộ',
        paragraphs: [
          'Hệ thống báo hiệu đường bộ gồm có: hiệu lệnh của người điều khiển giao thông, tín hiệu đèn giao thông, biển báo hiệu, vạch kẻ đường, cọc tiêu hoặc tường bảo vệ, rào chắn.',
          'Thứ tự ưu tiên chấp hành: Khi đồng thời có nhiều hình thức báo hiệu thì người tham gia giao thông phải chấp hành theo thứ tự: 1. Hiệu lệnh người điều khiển giao thông -> 2. Tín hiệu đèn -> 3. Biển báo hiệu -> 4. Vạch kẻ đường.'
        ],
        table: {
          headers: ['Nhóm biển báo', 'Đặc điểm nhận diện', 'Ý nghĩa'],
          rows: [
            ['Biển báo cấm', 'Hình tròn, viền đỏ, nền trắng, hình vẽ màu đen', 'Biểu thị các điều cấm người tham gia giao thông không được vi phạm'],
            ['Biển báo nguy hiểm', 'Hình tam giác đều, viền đỏ, nền vàng, hình vẽ màu đen', 'Cảnh báo trước các tình huống nguy hiểm trên đoạn đường'],
            ['Biển hiệu lệnh', 'Hình tròn, nền xanh lam, hình vẽ màu trắng', 'Báo các hiệu lệnh phải thi hành (ví dụ: hướng đi bắt buộc)'],
            ['Biển chỉ dẫn', 'Hình vuông hoặc chữ nhật, nền xanh lam', 'Chỉ dẫn hướng đi hoặc các điều cần biết'],
            ['Biển phụ', 'Hình chữ nhật, nền trắng, viền và chữ màu đen', 'Thuyết minh bổ sung cho các nhóm biển báo chính']
          ]
        }
      },
      {
        title: 'II. Một số quy tắc giao thông đường bộ cốt lõi',
        bullets: [
          'Quy tắc chung: Đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định và phải chấp hành hệ thống báo hiệu đường bộ.',
          'Độ tuổi lái xe: Người đủ 16 tuổi trở lên được lái xe gắn máy có dung tích xi-lanh dưới 50 cm3. Người đủ 18 tuổi trở lên mới được cấp giấy phép lái xe mô tô hai bánh từ 50 cm3 trở lên (hạng A1).',
          'Quy định nồng độ cồn: Nghiêm cấm điều khiển phương tiện tham gia giao thông đường bộ mà trong máu hoặc hơi thở có nồng độ cồn (nồng độ cồn = 0).'
        ],
        tipBox: {
          title: 'Quy chuẩn Mũ bảo hiểm',
          content: 'Người điều khiển, người ngồi trên xe mô tô, xe gắn máy, xe máy điện, xe đạp điện phải đội mũ bảo hiểm có cài quai đúng quy cách để bảo vệ an toàn tính mạng.'
        }
      },
      {
        title: 'III. Trách nhiệm của học sinh',
        bullets: [
          'Tuyệt đối không điều khiển xe mô tô, xe máy khi chưa đủ tuổi và chưa có bằng lái.',
          'Không lạng lách, đánh võng, chở quá số người quy định, không kéo đẩy xe khác.',
          'Không sử dụng ô dù, điện thoại di động, thiết bị âm thanh khi đang lái xe.',
          'Tích cực xây dựng "Cổng trường an toàn giao thông".'
        ]
      }
    ],
    keyTakeaways: [
      'Hiệu lệnh của người điều khiển giao thông luôn có hiệu lực cao nhất.',
      'Học sinh đủ 16 tuổi mới được phép điều khiển xe gắn máy dưới 50 cm3 hoặc xe máy điện.',
      'Pháp luật Việt Nam nghiêm cấm tuyệt đối lái xe khi có nồng độ cồn trong máu hoặc hơi thở.',
      'Đội mũ bảo hiểm cài quai đúng cách là biện pháp bảo vệ bản thân hữu hiệu nhất.'
    ],
    practicalApplication: [
      'Tự giác đội mũ bảo hiểm đạt chuẩn mỗi ngày khi đến trường bằng xe đạp điện, xe máy điện.',
      'Không dàn hàng 3, hàng 4 trò chuyện trước cổng trường gây ách tắc giao thông.',
      'Vận động cha mẹ, người thân tuân thủ nghiêm quy định "Đã uống rượu bia - Không lái xe".'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Theo Luật Giao thông đường bộ Việt Nam, người đủ bao nhiêu tuổi được phép điều khiển xe gắn máy có dung tích xi-lanh dưới 50 cm3?',
        options: ['Đủ 16 tuổi', 'Đủ 15 tuổi', 'Đủ 18 tuổi', 'Đủ 14 tuổi'],
        correctAnswer: 0,
        explanation: 'Người đủ 16 tuổi trở lên được điều khiển xe gắn máy có dung tích xi-lanh dưới 50 cm3 hoặc xe máy điện.'
      },
      {
        id: 2,
        question: 'Khi ở cùng một vị trí có cả đèn tín hiệu giao thông và hiệu lệnh của người cảnh sát giao thông thì người tham gia giao thông phải tuân theo chỉ dẫn nào?',
        options: [
          'Theo hiệu lệnh của người điều khiển giao thông',
          'Theo tín hiệu đèn giao thông',
          'Theo biển báo hiệu đường bộ',
          'Tự lựa chọn phương án thuận tiện nhất'
        ],
        correctAnswer: 0,
        explanation: 'Hiệu lệnh của người điều khiển giao thông (cảnh sát giao thông) luôn có hiệu lực ưu tiên cao nhất.'
      }
    ]
  },
  {
    id: '10_5',
    order: 'Bài 5',
    title: 'Bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được khái niệm an ninh quốc gia, bảo vệ an ninh quốc gia và trật tự, an toàn xã hội.',
        'Trình bày các nguyên tắc và nội dung hoạt động bảo vệ an ninh quốc gia.',
        'Hiểu rõ các nguy cơ đe dọa an ninh truyền thống và an ninh phi truyền thống.'
      ],
      skills: [
        'Nhận diện các biểu hiện vi phạm an ninh trật tự nơi cư trú.',
        'Kỹ năng phòng ngừa và tự bảo vệ bản thân trước các cạm bẫy tội phạm.'
      ],
      attitudes: [
        'Có tinh thần cảnh giác cách mạng, ý thức tự giác tham gia phong trào Toàn dân bảo vệ an ninh Tổ quốc.'
      ]
    },
    sections: [
      {
        title: 'I. Khái niệm cơ bản',
        paragraphs: [
          'An ninh quốc gia là sự ổn định, phát triển bền vững của chế độ xã hội chủ nghĩa và Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam, sự bất khả xâm phạm độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ của Tổ quốc.',
          'Trật tự, an toàn xã hội là trạng thái xã hội bình yên, trong đó mọi người được sống và làm việc an toàn, các quy tắc đạo đức, pháp luật được tôn trọng và chấp hành nghiêm chỉnh.'
        ],
        bullets: [
          'An ninh truyền thống: Mối đe dọa về chủ quyền quân sự, xâm lược lãnh thổ biên giới, hải đảo.',
          'An ninh phi truyền thống: Mối đe dọa từ biến đổi khí hậu, an ninh năng lượng, an ninh mạng, dịch bệnh truyền nhiễm, khủng bố xuyên quốc gia.'
        ]
      },
      {
        title: 'II. Nguyên tắc bảo vệ an ninh quốc gia',
        bullets: [
          '1. Đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam, sự quản lý tập trung, thống nhất của Nhà nước.',
          '2. Tuân thủ Hiến pháp và pháp luật, bảo đảm quyền và lợi ích hợp pháp của cơ quan, tổ chức, cá nhân.',
          '3. Kết hợp chặt chẽ giữa quốc phòng, an ninh với phát triển kinh tế - xã hội.',
          '4. Chủ động phòng ngừa, chủ động tấn công làm thất bại mọi âm mưu của các thế lực thù địch; dựa vào nhân dân để bảo vệ an ninh.'
        ]
      },
      {
        title: 'III. Trách nhiệm của học sinh',
        bullets: [
          'Chăm ngoan học tập, rèn luyện đạo đức, không tụ tập băng nhóm đánh nhau gây rối trật tự công cộng.',
          'Nêu cao tinh thần cảnh giác, không nghe, không tin, không chia sẻ những thông tin xấu độc, kích động bạo lực.',
          'Tích cực hưởng ứng phong trào "Toàn dân bảo vệ an ninh Tổ quốc" tại địa phương và nhà trường.'
        ]
      }
    ],
    keyTakeaways: [
      'Bảo vệ ANQG là sự nghiệp của toàn dân do lực lượng vũ trang làm nòng cốt dưới sự lãnh đạo của Đảng.',
      'Cần nhận diện và ứng phó chủ động với cả an ninh truyền thống lẫn an ninh phi truyền thống.',
      'Học sinh là nhân tố tích cực giữ gìn an ninh học đường và trật tự công cộng.'
    ],
    practicalApplication: [
      'Báo cáo ngay cho ban giám thị khi phát hiện tình trạng bạo lực học đường hoặc đối tượng xấu xâm nhập trường.',
      'Tuyệt đối không tham gia các hội nhóm kín trên mạng xã hội có nội dung chống phá, vi phạm pháp luật.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Nguyên tắc cao nhất trong công tác bảo vệ an ninh quốc gia ở nước ta là gì?',
        options: [
          'Đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam',
          'Giao toàn quyền cho lực lượng vũ trang tự quyết',
          'Dựa hoàn toàn vào các tổ chức quốc tế viện trợ',
          'Chỉ tập trung bảo vệ khu vực biên giới'
        ],
        correctAnswer: 0,
        explanation: 'Bảo vệ an ninh quốc gia đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng Cộng sản Việt Nam.'
      }
    ]
  },
  {
    id: '10_6',
    order: 'Bài 6',
    title: 'Một số hiểu biết về an ninh mạng',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được khái niệm mạng, không gian mạng, an ninh mạng và bảo vệ an ninh mạng theo Luật An ninh mạng năm 2018.',
        'Nhận diện các phương thức, thủ đoạn tấn công mạng và hành vi vi phạm pháp luật trên không gian mạng.',
        'Hiểu rõ các biện pháp bảo vệ thông tin cá nhân trên môi trường số.'
      ],
      skills: [
        'Biết cách thiết lập mật khẩu mạnh, kích hoạt xác thực hai yếu tố (2FA).',
        'Kỹ năng kiểm chứng thông tin, nhận diện tin giả (Fake News) và các đường link lừa đảo (Phishing).'
      ],
      attitudes: [
        'Xây dựng văn hóa ứng xử văn minh, chuẩn mực trên mạng xã hội.',
        'Chủ động phòng tránh và cảnh báo bạn bè trước các chiêu trò lừa đảo qua mạng.'
      ]
    },
    sections: [
      {
        title: 'I. Khái niệm và Luật An ninh mạng',
        paragraphs: [
          'Không gian mạng là mạng lưới kết nối của cơ sở hạ tầng công nghệ thông tin, bao gồm mạng viễn thông, mạng Internet, mạng máy tính, hệ thống xử lý và điều khiển dữ liệu.',
          'An ninh mạng là sự bảo đảm hoạt động trên không gian mạng không gây phương hại đến an ninh quốc gia, trật tự, an toàn xã hội, quyền và lợi ích hợp pháp của cơ quan, tổ chức, cá nhân.',
          'Luật An ninh mạng của nước Cộng hòa XHCN Việt Nam được Quốc hội khóa XIV thông qua ngày 12/6/2018 và có hiệu lực thi hành từ ngày 01/01/2019.'
        ]
      },
      {
        title: 'II. Các hành vi bị nghiêm cấm trên không gian mạng',
        bullets: [
          'Sử dụng không gian mạng để xúc phạm tôn giáo, phân biệt đối xử về giới, phân biệt chủng tộc.',
          'Đăng tải, chia sẻ thông tin sai sự thật gây hoang mang dư luận, gây thiệt hại đến hoạt động kinh tế - xã hội.',
          'Hoạt động mại dâm, tệ nạn xã hội, mua bán người; hướng dẫn người khác chế tạo vũ khí, vật liệu nổ.',
          'Thực hiện tấn công mạng, khủng bố mạng, gián điệp mạng; chiếm đoạt tài khoản cá nhân, lừa đảo tài sản.'
        ],
        tipBox: {
          title: 'Quy tắc 5K trên không gian mạng',
          content: '1. Không tin ngay - 2. Không vội like - 3. Không thêm thắt - 4. Không kích động - 5. Không vội chia sẻ.'
        }
      },
      {
        title: 'III. Bảo mật thông tin cá nhân của học sinh',
        bullets: [
          'Đặt mật khẩu phức tạp (kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt), không dùng ngày sinh làm mật khẩu.',
          'Bật bảo mật xác thực 2 bước (2FA) cho tất cả tài khoản mạng xã hội và email.',
          'Cảnh giác khi kết nối mạng Wi-Fi công cộng miễn phí không có mật khẩu.',
          'Không click vào link lạ nhận quà, trúng thưởng, bình chọn ảnh gửi qua tin nhắn.'
        ]
      }
    ],
    keyTakeaways: [
      'Luật An ninh mạng có hiệu lực từ 01/01/2019 bảo vệ quyền lợi hợp pháp của công dân trên mạng.',
      'Người chia sẻ thông tin sai sự thật, vu khống trên mạng xã hội sẽ bị xử phạt hành chính hoặc truy cứu trách nhiệm hình sự.',
      'Bảo vệ dữ liệu cá nhân là lá chắn then chốt ngăn chặn tội phạm lừa đảo công nghệ cao.'
    ],
    practicalApplication: [
      'Tuyệt đối không công khai số Căn cước công dân, địa chỉ nhà, số điện thoại lên bài đăng công khai trên Facebook/TikTok.',
      'Luôn kiểm chứng nguồn tin từ các trang báo chính thống (.gov.vn, TTXVN, Nhân Dân) trước khi chia sẻ thông tin giật gân.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Luật An ninh mạng của nước Cộng hòa XHCN Việt Nam chính thức có hiệu lực từ thời gian nào?',
        options: ['01/01/2019', '12/06/2018', '01/01/2020', '30/04/2019'],
        correctAnswer: 0,
        explanation: 'Luật An ninh mạng được Quốc hội thông qua ngày 12/6/2018 và chính thức có hiệu lực từ ngày 01/01/2019.'
      }
    ]
  },
  {
    id: '10_7',
    order: 'Bài 7',
    title: 'Thường thức phòng tránh vũ khí huỷ diệt, thiên tai, dịch bệnh và cháy nổ',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết & thực hành',
    objectives: {
      knowledge: [
        'Hiểu được tác hại của các loại vũ khí hủy diệt lớn (hạt nhân, hóa học, sinh học, vũ khí công nghệ cao).',
        'Nêu được biện pháp phòng tránh bom, mìn, đạn còn sót lại sau chiến tranh.',
        'Nắm vững quy tắc xử lý khi có hỏa hoạn, động đất, lũ lụt và dịch bệnh.'
      ],
      skills: [
        'Biết cách thoát hiểm khi xảy ra cháy nổ nhà cao tầng (dùng khăn ướt bịt mũi, bò sát mặt sàn).',
        'Ghi nhớ và sử dụng thành thạo các số điện thoại khẩn cấp quốc gia (114, 115, 113).'
      ],
      attitudes: [
        'Bình tĩnh, chủ động, có ý thức giúp đỡ người xung quanh trong tình huống nguy cấp.'
      ]
    },
    sections: [
      {
        title: 'I. Vũ khí hủy diệt lớn và vũ khí công nghệ cao',
        paragraphs: [
          'Vũ khí hạt nhân: Là loại vũ khí hủy diệt hàng loạt dựa trên năng lượng giải phóng từ phản ứng phân hạch hoặc nhiệt hạch. Tác hại bởi 5 nhân tố: sóng xung kích, bức xạ quang, bức xạ xuyên, chất phóng xạ và xung điện từ.',
          'Vũ khí hóa học: Sử dụng chất độc quân sự gây tổn thương hoặc tiêu diệt sinh lực địch qua đường hô hấp, tiếp xúc da.',
          'Vũ khí sinh học: Dùng vi sinh vật gây bệnh truyền nhiễm (vi khuẩn than, dịch hạch) cho người, động vật và mùa màng.'
        ]
      },
      {
        title: 'II. Phòng chống bom mìn còn sót lại sau chiến tranh',
        bullets: [
          'Việt Nam là một trong những nước chịu ô nhiễm bom mìn nặng nề nhất thế giới sau nhiều thập kỷ chiến tranh.',
          'Quy tắc an toàn: Tuyệt đối không đến gần, không chạm vào, không nhặt, ném, đập phá, tháo gỡ bom mìn, ngòi nổ.',
          'Hành động khi phát hiện: Đánh dấu vị trí nguy hiểm, cảnh báo mọi người xung quanh và báo ngay cho Ban chỉ huy quân sự hoặc Công an gần nhất.'
        ]
      },
      {
        title: 'III. Kỹ năng thoát nạn khi xảy ra cháy nổ',
        bullets: [
          'Hô hoán báo động và lập tức gọi điện thoại số 114 (Cảnh sát PCCC và CNCH).',
          'Ngắt cầu dao điện khu vực bị cháy nếu có thể bảo đảm an toàn.',
          'Dùng khăn ướt, khẩu trang ướt che kín mũi miệng để tránh hít phải khí độc và khói.',
          'Hạ thấp người, bò sát mặt sàn nơi có không khí sạch hơn men theo tường tìm lối thoát hiểm.',
          'Tuyệt đối không dùng thang máy khi có hỏa hoạn, chỉ sử dụng thang bộ thoát hiểm.'
        ],
        tipBox: {
          title: 'Ghi nhớ các số điện thoại khẩn cấp',
          content: '113: Công an giải quyết an ninh trật tự | 114: Cứu hỏa và cứu nạn cứu hộ | 115: Cấp cứu y tế.'
        }
      }
    ],
    keyTakeaways: [
      'Không chạm vào bất kỳ vật thể kim loại gỉ sét nghi là bom mìn.',
      'Khi cháy, ngạt khói độc là nguyên nhân tử vong hàng đầu - phải dùng khăn ướt che mũi và bò thấp.',
      'Gọi ngay 114 khi có cháy nổ, bình tĩnh thông báo rõ địa chỉ và đặc điểm vụ cháy.'
    ],
    practicalApplication: [
      'Kiểm tra và ghi nhớ các lối thoát hiểm tại trường học và khu chung cư nơi sinh sống.',
      'Thường xuyên tắt các thiết bị điện không sử dụng trước khi ra khỏi phòng để phòng chống chập cháy.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Số điện thoại khẩn cấp để gọi Cảnh sát Phòng cháy, chữa cháy và cứu nạn, cứu hộ tại Việt Nam là gì?',
        options: ['114', '113', '115', '112'],
        correctAnswer: 0,
        explanation: '114 là số điện thoại khẩn cấp gọi lực lượng PCCC và Cứu nạn cứu hộ.'
      }
    ]
  },
  {
    id: '10_8',
    order: 'Bài 8',
    title: 'Một số nội dung Điều lệnh quản lí bộ đội và Điều lệnh Công an nhân dân',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết & thực hành',
    objectives: {
      knowledge: [
        'Nắm vững các quy định về xưng hô, chào hỏi của quân nhân và cán bộ, chiến sĩ Công an.',
        'Hiểu rõ ý nghĩa của việc duy trì lễ tiết, tác phong, trang phục chính quy.',
        'Nhận thức tầm quan trọng của kỷ luật tự giác, nghiêm minh trong lực lượng vũ trang.'
      ],
      skills: [
        'Thực hiện đúng động tác chào, xưng hô lễ phép, tác phong nhanh nhẹn.'
      ],
      attitudes: [
        'Tự giác chấp hành nội quy nhà trường, kỷ cương xã hội.'
      ]
    },
    sections: [
      {
        title: 'I. Xưng hô, chào hỏi trong Quân đội và Công an',
        paragraphs: [
          'Xưng hô trong QĐND: Quân nhân xưng "Tôi" và gọi nhau bằng "Đồng chí". Cấp dưới gọi cấp trên bằng "Thủ trưởng" hoặc "Đồng chí" kèm theo cấp bậc hoặc chức vụ.',
          'Chào hỏi: Cấp dưới phải chào cấp trên trước; người được chào phải đáp lễ. Khi gặp nhau, quân nhân chào bằng động tác giơ tay hoặc chào bằng lời nói.'
        ]
      },
      {
        title: 'II. Trang phục và lễ tiết tác phong',
        bullets: [
          'Trang phục phải mang mặc đúng quy định thống nhất, sạch sẽ, gọn gàng, cài đủ cúc áo, chỉnh tề.',
          'Không mang mặc trang phục nửa quân sự, nửa dân sự; không đeo đồ trang sức phản cảm.',
          'Đi đứng, ngồi đúng tư thế tác phong quân nhân: lưng thẳng, mắt nhìn thẳng, hành động dứt khoát.'
        ]
      },
      {
        title: 'III. Ý nghĩa đối với học sinh',
        paragraphs: [
          'Rèn luyện tính kỷ luật, giờ nào việc nấy, tác phong ngăn nắp, biết tôn sư trọng đạo, kính trên nhường dưới trong học đường và đời sống.'
        ]
      }
    ],
    keyTakeaways: [
      'Quân nhân gọi nhau bằng "Đồng chí", xưng "Tôi".',
      'Cấp dưới luôn chào cấp trên trước, thể hiện sự tôn trọng kỷ cương thứ bậc.',
      'Kỷ luật là sức mạnh của quân đội, cũng là nền tảng thành công của mỗi học sinh.'
    ],
    practicalApplication: [
      'Luôn chào hỏi thầy cô giáo, nhân viên nhà trường lễ phép, đàng hoàng.',
      'Mặc đồng phục đúng quy định của trường học, giữ gìn tác phong gọn gàng, đúng giờ.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Trong Quân đội nhân dân Việt Nam, khi tiếp xúc công tác, quân nhân xưng hô với nhau như thế nào?',
        options: [
          'Xưng "Tôi" và gọi nhau là "Đồng chí"',
          'Xưng "Em" và gọi "Anh/Chị"',
          'Xưng tên riêng',
          'Gọi tên kèm chức vụ tùy ý'
        ],
        correctAnswer: 0,
        explanation: 'Theo Điều lệnh Quản lý bộ đội, quân nhân gọi nhau bằng "Đồng chí" và xưng "Tôi".'
      }
    ]
  },
  {
    id: '10_9',
    order: 'Bài 9',
    title: 'Đội ngũ từng người không có súng',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết thực hành',
    objectives: {
      knowledge: [
        'Nắm vững ý nghĩa và quy trình thực hiện các động tác: Nghiêm, Nghỉ, Quay tại chỗ, Đi đều, Đứng lại, Đổi chân khi đi đều sai nhịp.',
        'Hiểu rõ khẩu lệnh, dự lệnh và động lệnh trong điều lệnh đội ngũ.'
      ],
      skills: [
        'Thực hành chuẩn xác, dứt khoát, đúng yếu lĩnh các động tác cá nhân từng người.'
      ],
      attitudes: [
        'Rèn luyện ý thức tổ chức kỷ luật, tác phong khẩn trương, chuẩn xác.'
      ]
    },
    sections: [
      {
        title: 'I. Động tác Nghiêm, Nghỉ, Quay tại chỗ',
        bullets: [
          'Động tác Nghiêm: Đứng thẳng, hai gót chân sát nhau trên đường thẳng, hai mũi chân mở rộng một góc 45 độ. Tay khép tự nhiên dọc chỉ quần, ngực nở, bụng thót, mắt nhìn thẳng.',
          'Động tác Nghỉ: Từ tư thế nghiêm, chùng gối chân trái (hoặc chân phải), trọng tâm dồn vào chân kia, thân người giữ ngay ngắn.',
          'Động tác Quay phải (trái): Lấy gót chân phải (trái) và mũi chân trái (phải) làm trụ, quay người 90 độ về bên phải (trái), sau đó thu chân sau lên thành tư thế nghiêm.',
          'Động tác Quay đằng sau: Khẩu lệnh "Đằng sau - QUAY!". Lấy gót chân phải và mũi chân trái làm trụ, quay người sang phải ra sau 180 độ.'
        ]
      },
      {
        title: 'II. Động tác Đi đều, Đứng lại và Đổi chân',
        bullets: [
          'Khẩu lệnh: "Đi đều - BƯỚC!". Khi nghe động lệnh "BƯỚC", chân trái bước lên trước cách chân phải 60 - 75 cm.',
          'Đánh tay: Tay đánh ra trước vuông góc khuỷu tay ngang ngực; tay đánh ra sau cách thân người 15 - 20 độ, các ngón tay nắm tự nhiên.',
          'Đổi chân khi đi đều sai nhịp: Khi chân bước không khớp với nhịp đếm 1 (chân trái), nhịp 2 (chân phải), thực hiện bước nhảy đệm để chân vào đúng nhịp hô.'
        ]
      }
    ],
    keyTakeaways: [
      'Góc mở của hai mũi bàn chân ở tư thế Nghiêm là 45 độ.',
      'Động tác quay đằng sau luôn thực hiện quay người qua bên phải 180 độ.',
      'Đi đều nhịp 1 rơi vào chân trái, nhịp 2 rơi vào chân phải.'
    ],
    practicalApplication: [
      'Giữ tư thế thẳng lưng, phong thái tự tin trong các buổi chào cờ đầu tuần và diễu hành trường học.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Khi thực hiện động tác "Nghiêm", góc mở giữa hai mũi bàn chân chuẩn xác là bao nhiêu độ?',
        options: ['45 độ', '60 độ', '90 độ', '30 độ'],
        correctAnswer: 0,
        explanation: 'Ở tư thế Nghiêm, hai gót chân sát nhau, hai mũi bàn chân mở rộng một góc 45 độ.'
      }
    ]
  },
  {
    id: '10_10',
    order: 'Bài 10',
    title: 'Đội ngũ tiểu đội',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết thực hành',
    objectives: {
      knowledge: [
        'Nắm được các đội hình cơ bản của tiểu đội: 1 hàng ngang, 2 hàng ngang, 1 hàng dọc, 2 hàng dọc.',
        'Nắm vững 4 bước chỉ huy tập hợp đội hình tiểu đội.'
      ],
      skills: [
        'Biết cách chỉ huy và thực hiện đúng vị trí đứng trong đội hình tiểu đội.'
      ],
      attitudes: [
        'Nâng cao tinh thần tập thể, tính hiệp đồng đoàn kết trong hàng ngũ.'
      ]
    },
    sections: [
      {
        title: 'I. 4 Bước tập hợp đội hình tiểu đội hàng ngang',
        bullets: [
          'Bước 1: Tập hợp (Tiểu đội trưởng đứng quay về hướng định tập hợp, hô "Tiểu đội X thành 1 hàng ngang - TẬP HỢP", tay trái chỉ định vị trí chiến sĩ số 1).',
          'Bước 2: Điểm số (Khẩu lệnh "ĐIỂM SỐ", các chiến sĩ từ số 1 lần lượt quay mặt sang trái điểm số to rõ, người cuối cùng hô "HẾT"). Lưu ý: Đội hình 2 hàng ngang không điểm số.',
          'Bước 3: Chỉnh đốn hàng ngũ (Khẩu lệnh "Nhìn bên phải (trái) - THẲNG!").',
          'Bước 4: Giải tán (Khẩu lệnh "GIẢI TÁN").'
        ]
      },
      {
        title: 'II. Đội hình tiểu đội hàng dọc',
        paragraphs: [
          'Tiểu đội hàng dọc dùng trong hành quân, di chuyển. Thứ tự các bước tương tự như hàng ngang: Tập hợp -> Điểm số -> Chỉnh đốn hàng ngũ -> Giải tán.'
        ]
      }
    ],
    keyTakeaways: [
      '4 bước chỉ huy tiểu đội: Tập hợp -> Điểm số -> Chỉnh đốn hàng ngũ -> Giải tán.',
      'Đội hình 2 hàng ngang không thực hiện điểm số.'
    ],
    practicalApplication: [
      'Vận dụng xếp hàng nhanh chóng, ngay ngắn trong các hoạt động tập thể lớp và ngoại khóa.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Đội hình tiểu đội nào sau đây KHÔNG thực hiện bước điểm số?',
        options: ['Đội hình tiểu đội 2 hàng ngang', 'Đội hình tiểu đội 1 hàng ngang', 'Đội hình tiểu đội 1 hàng dọc', 'Đội hình tiểu đội 2 hàng dọc'],
        correctAnswer: 0,
        explanation: 'Trong điều lệnh đội ngũ quân đội, đội hình 2 hàng ngang không thực hiện bước điểm số.'
      }
    ]
  },
  {
    id: '10_11',
    order: 'Bài 11',
    title: 'Các tư thế, động tác cơ bản vận động trong chiến đấu',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết thực hành',
    objectives: {
      knowledge: [
        'Hiểu rõ ý nghĩa, trường hợp vận dụng các tư thế: đi khom, chạy khom, bò cao, lê, trườn, vọt tiến.',
        'Nắm vững yêu cầu an toàn, bí mật khi tiếp cận mục tiêu địch.'
      ],
      skills: [
        'Thực hành thành thạo các tư thế vận động đúng kỹ thuật, linh hoạt theo địa hình.'
      ],
      attitudes: [
        'Rèn luyện thể lực bền bỉ, tính dũng cảm, mưu trí.'
      ]
    },
    sections: [
      {
        title: 'I. Đi khom, chạy khom và vọt tiến',
        bullets: [
          'Đi khom: Vận dụng khi địa hình có vật che khuất, che đỡ cao ngang ngực, hoặc đêm tối, sương mù, mưa gió. Tư thế: chân chùng, lưng cong, mắt quan sát địch, súng ở tư thế sẵn sàng chiến đấu.',
          'Chạy khom: Vận dụng khi cần vượt nhanh qua đoạn địa hình trống trải có vật che khuất ngắt quãng.',
          'Vọt tiến: Vận dụng khi vượt qua bãi trống hoả lực địch bắn quét dữ dội. Dùng sức bật của hai chân vụt đứng dậy chạy thật nhanh theo đường zíc-zắc sang vị trí ẩn nấp mới.'
        ]
      },
      {
        title: 'II. Bò cao, lê và trườn',
        bullets: [
          'Bò cao: Vận dụng ở nơi gần địch, có vật che khuất cao ngang tầm bụng. Có bò cao 2 chân 1 tay (tay còn lại xách súng hoặc dò mìn) và bò cao 2 chân 2 tay.',
          'Lê: Vận dụng khi gần địch, cần thu hẹp diện tích mục tiêu, mang vác nhiều trang bị khí tài.',
          'Trườn: Vận dụng khi sát địch, hoả lực địch bắn thẳng rất dữ dội, vật che khuất rất thấp (bờ ruộng, gò đất thấp). Thân người áp sát mặt đất, chân co chân duỗi đẩy người tiến lên.'
        ]
      }
    ],
    keyTakeaways: [
      'Đi khom khi vật che khuất ngang tầm ngực.',
      'Trườn áp sát người xuống đất khi sát địch và địa vật rất thấp.',
      'Vọt tiến chạy nhanh zíc-zắc để tránh đường ngắm bắn thẳng của địch.'
    ],
    practicalApplication: [
      'Ứng dụng tư thế bò thấp khi thoát hiểm qua hành lang ngập khói trong sự cố cháy nổ.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Tư thế vận động nào sau đây thường áp dụng khi gần địch, địa hình trống trải, vật che khuất rất thấp và địch bắn thẳng dữ dội?',
        options: ['Trườn', 'Đi khom', 'Chạy đều', 'Bò cao'],
        correctAnswer: 0,
        explanation: 'Trườn giúp thu hẹp tối đa diện tích mục tiêu lộ ra trước hỏa lực bắn thẳng của địch.'
      }
    ]
  },
  {
    id: '10_12',
    order: 'Bài 12',
    title: 'Kĩ thuật cấp cứu và chuyển thương',
    grade: 10,
    textbook: 'Sách giáo khoa GDQP&AN 10 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết lý thuyết & thực hành',
    objectives: {
      knowledge: [
        'Nắm vững nguyên tắc sơ cấp cứu ban đầu tai nạn thông thường (đuối nước, say nắng, bỏng, điện giật).',
        'Nêu được các biện pháp cầm máu tạm thời và nguyên tắc cố định xương gãy.',
        'Nắm vững kỹ thuật hồi sức tim phổi (CPR) và các phương pháp chuyển thương an toàn.'
      ],
      skills: [
        'Thực hành ép tim ngoài lồng ngực kết hợp hà hơi thổi ngạt tỷ lệ 30:2.',
        'Biết cách băng ép vết thương và nẹp cố định xương gãy qua 2 khớp.'
      ],
      attitudes: [
        'Tinh thần tương thân tương ái, sẵn sàng cứu giúp đồng đội, đồng bào khi gặp nạn.'
      ]
    },
    sections: [
      {
        title: 'I. Các biện pháp cầm máu tạm thời',
        paragraphs: [
          'Chảy máu động mạch: Máu đỏ tươi, phun thành tia theo nhịp tim đập - nguy hiểm nhất, phải xử lý khẩn cấp.',
          'Chảy máu tĩnh mạch: Máu đỏ thẫm, chảy từ từ hoặc trào ra.',
          'Chảy máu mao mạch: Máu rỉ ra trên bề mặt vết thương nông.'
        ],
        bullets: [
          'Ấn động mạch: Dùng ngón tay ấn chặt đường đi của động mạch vào nền xương.',
          'Băng ép: Dùng gạc sạch đè lên vết thương rồi băng chặt lại.',
          'Đặt garô: Chỉ áp dụng khi chi bị đứt lìa hoặc chảy máu động mạch ồ ạt mà các biện pháp khác không hiệu quả. Lưu ý: Cứ 45 - 60 phút phải nới garô 1 - 2 phút để nuôi dưỡng phần chi dưới.'
        ]
      },
      {
        title: 'II. Cố định gãy xương tạm thời',
        bullets: [
          'Nguyên tắc 1: Không được nắn chỉnh đầu xương gãy chồi ra ngoài.',
          'Nguyên tắc 2: Nẹp cố định phải bất động được ít nhất 2 khớp (khớp trên và khớp dưới ổ gãy).',
          'Nguyên tắc 3: Phải lót đệm bông mềm vào các đầu nẹp và chỗ tì đè xương trước khi buộc dây.'
        ]
      },
      {
        title: 'III. Hồi sức tim phổi (CPR) và Chuyển thương',
        bullets: [
          'Quy trình CPR: Ép tim ngoài lồng ngực 30 lần (tần số 100-120 lần/phút, độ sâu 5-6 cm) xen kẽ 2 lần thổi ngạt liên tục.',
          'Chuyển thương: Tay không (dìu, cõng, vác), dùng cáng bạt, cáng tự tạo bằng chăn/võng. Giữ đầu nạn nhân nằm thẳng ổn định.'
        ]
      }
    ],
    keyTakeaways: [
      'Garô chỉ dùng khi chảy máu động mạch dữ dội hoặc đứt lìa chi, phải nới sau mỗi 45-60 phút.',
      'Nẹp gãy xương phải vượt qua 2 khớp liền kề ổ gãy.',
      'Tỷ lệ CPR tiêu chuẩn quốc tế: 30 lần ép tim : 2 lần thổi ngạt.'
    ],
    practicalApplication: [
      'Tự tin sơ cứu người bị tai nạn giao thông hoặc đuối nước trước khi nhân viên y tế 115 đến hiện trường.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Trong quy trình hồi sức tim phổi (CPR) cho nạn nhân ngừng thở, ngừng tim, tỷ lệ số lần ép tim và thổi ngạt chuẩn là bao nhiêu?',
        options: ['30 lần ép tim : 2 lần thổi ngạt', '15 lần ép tim : 2 lần thổi ngạt', '50 lần ép tim : 5 lần thổi ngạt', '10 lần ép tim : 1 lần thổi ngạt'],
        correctAnswer: 0,
        explanation: 'Quy chuẩn cấp cứu hiện đại: 30 lần ép tim ngoài lồng ngực xen kẽ 2 lần thổi ngạt.'
      }
    ]
  }
];
