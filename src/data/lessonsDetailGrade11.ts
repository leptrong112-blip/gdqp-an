import { DetailedLesson } from './lessonsDetail';

export const DETAILED_LESSONS_11: DetailedLesson[] = [
  {
    id: '11_1',
    order: 'Bài 1',
    title: 'Bảo vệ chủ quyền lãnh thổ, biên giới quốc gia nước CHXHCN Việt Nam',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được khái niệm chủ quyền lãnh thổ, các bộ phận cấu thành lãnh thổ quốc gia Việt Nam.',
        'Nắm vững Công ước Liên Hợp Quốc về Luật Biển 1982 (UNCLOS 1982) và Luật Biển Việt Nam năm 2012 (nội thủy, lãnh hải, tiếp giáp, EEZ, thềm lục địa).',
        'Khẳng định chứng cứ lịch sử và pháp lý không thể chối cãi về chủ quyền Việt Nam đối với quần đảo Hoàng Sa và Trường Sa.'
      ],
      skills: [
        'Xác định được các vùng biển trên bản đồ hải đồ Việt Nam.',
        'Nhận diện các thủ đoạn xâm phạm chủ quyền và biết cách phản bác các luận điệu xuyên tạc trên mạng.'
      ],
      attitudes: [
        'Nuôi dưỡng tình yêu biển đảo, ý thức bảo vệ từng tấc đất thiêng liêng biên cương Tổ quốc.'
      ]
    },
    sections: [
      {
        title: 'I. Lãnh thổ quốc gia và Biên giới quốc gia',
        subsections: [
          {
            subtitle: '1. Các bộ phận cấu thành lãnh thổ quốc gia',
            paragraphs: [
              'Lãnh thổ quốc gia Việt Nam là không gian địa lý bao gồm vùng đất, vùng nước, vùng trời và vùng lòng đất thuộc chủ quyền hoàn toàn, tuyệt đối và bất khả xâm phạm của nước CHXHCN Việt Nam.'
            ],
            bullets: [
              'Vùng đất: Bao gồm toàn bộ đất liền và hàng ngàn hòn đảo, quần đảo thuộc chủ quyền Việt Nam.',
              'Vùng nước: Bao gồm vùng nước nội địa (sông, hồ, kênh rạch), vùng nước nội thủy và vùng nước lãnh hải.',
              'Vùng trời: Không gian bao trùm trên vùng đất và vùng nước của lãnh thổ quốc gia.',
              'Vùng lòng đất: Toàn bộ lòng đất dưới vùng đất và đáy biển thuộc chủ quyền quốc gia kéo dài đến tâm Trái Đất.'
            ]
          },
          {
            subtitle: '2. Đường biên giới quốc gia',
            paragraphs: [
              'Biên giới quốc gia là đường và mặt thẳng đứng theo đường đó để xác định giới hạn lãnh thổ đất liền, các đảo, các quần đảo trong đó có quần đảo Hoàng Sa và quần đảo Trường Sa, vùng biển, lòng đất, vùng trời của nước CHXHCN Việt Nam.'
            ]
          }
        ]
      },
      {
        title: 'II. Các vùng biển thuộc chủ quyền và quyền chủ quyền của Việt Nam',
        paragraphs: [
          'Theo UNCLOS 1982 và Luật Biển Việt Nam 2012, các vùng biển của Việt Nam bao gồm 5 vùng xác định từ đường cơ sở:'
        ],
        table: {
          headers: ['Tên vùng biển', 'Phạm vi / Chiều rộng', 'Chế độ pháp lý'],
          rows: [
            ['Nội thủy', 'Vùng nước nằm phía trong đường cơ sở', 'Chủ quyền hoàn toàn, tuyệt đối như trên lãnh thổ đất liền'],
            ['Lãnh hải', 'Rộng 12 hải lý tính từ đường cơ sở ra phía ngoài', 'Thuộc chủ quyền quốc gia trên biển; tàu thuyền nước ngoài được quyền "đi qua không gây hại"'],
            ['Vùng tiếp giáp lãnh hải', 'Rộng 12 hải lý tiếp liền lãnh hải (cách cơ sở 24 hải lý)', 'Kiểm soát an ninh, thuế quan, y tế, môi trường và nhập cư'],
            ['Vùng đặc quyền kinh tế (EEZ)', 'Rộng 200 hải lý tính từ đường cơ sở', 'Quyền chủ quyền kinh tế (đánh bắt, khai thác dầu khí) và quyền tài phán'],
            ['Thềm lục địa', 'Đáy biển và lòng đất đáy biển mở rộng tối thiểu 200 đến 350 hải lý', 'Quyền chủ quyền thăm dò, khai thác tài nguyên thiên nhiên khoáng sản']
          ]
        },
        highlight: '1 hải lý (Dặm biển quốc tế) = 1.852 mét (1,852 km).'
      },
      {
        title: 'III. Khẳng định chủ quyền Hoàng Sa và Trường Sa',
        paragraphs: [
          'Việt Nam có đầy đủ bằng chứng lịch sử và cơ sở pháp lý để khẳng định chủ quyền đối với hai quần đảo Hoàng Sa và Trường Sa.',
          'Nhà nước Việt Nam qua các thời kỳ lịch sử (từ thời chúa Nguyễn thế kỷ XVII, triều Tây Sơn, triều Nguyễn đến nay) đã xác lập, quản lý và thực thi chủ quyền một cách thực sự, liên tục và hòa bình đối với hai quần đảo này.'
        ],
        bullets: [
          'Các tư liệu lịch sử: Phủ biên tạp lục của Lê Quý Đôn (1776), Đại Nam nhất thống toàn chí, các Châu bản triều Nguyễn ghi chép hoạt động Đội Hoàng Sa kiêm quản Bắc Hải.',
          'Các hiệp định quốc tế: Tuyên bố Cairo (1943), Tuyên bố Potsdam (1945), Hội nghị San Francisco (1951) có 51 quốc gia tham dự thừa nhận tuyên bố chủ quyền của phái đoàn Việt Nam mà không có quốc gia nào phản đối.'
        ]
      }
    ],
    keyTakeaways: [
      'Biên giới quốc gia là đường và mặt thẳng đứng xác định ranh giới lãnh thổ độc lập, bất khả xâm phạm.',
      'Việt Nam có 5 vùng biển: Nội thủy, Lãnh hải (12 hải lý), Tiếp giáp lãnh hải (12 hải lý), Vùng đặc quyền kinh tế (200 hải lý), Thềm lục địa.',
      'Việt Nam có đầy đủ bằng chứng lịch sử và pháp lý vững chắc khẳng định chủ quyền với Hoàng Sa và Trường Sa.'
    ],
    practicalApplication: [
      'Tham gia các hoạt động hướng về biển đảo quê hương, viết thư thăm hỏi các chiến sĩ nhà giàn DK1 và chiến sĩ Trường Sa.',
      'Đăng tải hình ảnh bản đồ Việt Nam đầy đủ 2 quần đảo Hoàng Sa và Trường Sa trên mạng xã hội.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Theo Luật Biển Việt Nam năm 2012 và UNCLOS 1982, chiều rộng của vùng Lãnh hải là bao nhiêu hải lý tính từ đường cơ sở?',
        options: ['12 hải lý', '24 hải lý', '200 hải lý', '100 hải lý'],
        correctAnswer: 0,
        explanation: 'Lãnh hải của nước CHXHCN Việt Nam rộng 12 hải lý tính từ đường cơ sở ra phía ngoài.'
      },
      {
        id: 2,
        question: 'Vùng biển mà tại đó quốc gia ven biển có toàn quyền chủ quyền thăm dò và khai thác tài nguyên sinh vật và phi sinh vật, kéo dài 200 hải lý tính từ đường cơ sở là vùng nào?',
        options: ['Vùng đặc quyền kinh tế (EEZ)', 'Vùng tiếp giáp lãnh hải', 'Lãnh hải', 'Nội thủy'],
        correctAnswer: 0,
        explanation: 'Vùng đặc quyền kinh tế có chiều rộng 200 hải lý tính từ đường cơ sở.'
      }
    ]
  },
  {
    id: '11_2',
    order: 'Bài 2',
    title: 'Luật Nghĩa vụ quân sự và trách nhiệm của học sinh',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nắm vững nội dung cơ bản của Luật Nghĩa vụ quân sự năm 2015.',
        'Nắm chắc độ tuổi đăng ký NVQS, độ tuổi gọi nhập ngũ, thời hạn phục vụ tại ngũ.',
        'Hiểu rõ các đối tượng được tạm hoãn và miễn gọi nhập ngũ thời bình.'
      ],
      skills: [
        'Biết quy trình đăng ký NVQS lần đầu đối với công dân nam đủ 17 tuổi.'
      ],
      attitudes: [
        'Nhận thức thực hiện NVQS là nghĩa vụ thiêng liêng và quyền cao quý của công dân.'
      ]
    },
    sections: [
      {
        title: 'I. Độ tuổi đăng ký và gọi nhập ngũ',
        paragraphs: [
          'Nghĩa vụ quân sự là nghĩa vụ vẻ vang của công dân phục vụ trong Quân đội nhân dân. Thực hiện NVQS bao gồm phục vụ tại ngũ và phục vụ trong ngạch dự bị.'
        ],
        table: {
          headers: ['Nội dung quy định', 'Độ tuổi / Thời gian theo Luật NVQS 2015'],
          rows: [
            ['Đăng ký NVQS lần đầu', 'Công dân nam đủ 17 tuổi trong năm'],
            ['Độ tuổi gọi nhập ngũ thông thường', 'Từ đủ 18 tuổi đến hết 25 tuổi'],
            ['Độ tuổi kéo dài (đào tạo ĐH, CĐ)', 'Đến hết 27 tuổi đối với công dân được tạm hoãn học đại học, cao đẳng chính quy'],
            ['Thời hạn phục vụ tại ngũ thời bình', '24 tháng (có thể kéo dài không quá 6 tháng trong trường hợp đặc biệt)']
          ]
        }
      },
      {
        title: 'II. Tạm hoãn và Miễn gọi nhập ngũ thời bình',
        bullets: [
          'Tạm hoãn gọi nhập ngũ: Chưa đủ sức khỏe; là lao động duy nhất trực tiếp nuôi dưỡng thân nhân không còn khả năng lao động; có anh/chị/em ruột đang tại ngũ; đang học tại cơ sở giáo dục phổ thông, đại học, cao đẳng chính quy.',
          'Miễn gọi nhập ngũ: Con của liệt sĩ, con của thương binh hạng một; một anh hoặc một em của liệt sĩ; một con của thương binh hạng hai; người mắc bệnh hiểm nghèo theo danh mục quy định.'
        ]
      },
      {
        title: 'III. Chế tài xử lý vi phạm nghĩa vụ quân sự',
        paragraphs: [
          'Hành vi trốn tránh khám sức khỏe, gian dối kết quả, không chấp hành lệnh gọi nhập ngũ sẽ bị phạt tiền rất nặng (từ hàng chục triệu đồng) và có thể bị truy cứu trách nhiệm hình sự theo Điều 332 Bộ luật Hình sự (phạt tù từ 3 tháng đến 5 năm).'
        ]
      }
    ],
    keyTakeaways: [
      'Đăng ký NVQS lần đầu: Nam công dân đủ 17 tuổi.',
      'Độ tuổi gọi nhập ngũ: Từ đủ 18 đến hết 25 tuổi (đến hết 27 tuổi nếu học ĐH/CĐ).',
      'Thời hạn phục vụ tại ngũ trong thời bình là 24 tháng.'
    ],
    practicalApplication: [
      'Tự giác chấp hành lệnh đăng ký NVQS tuổi 17 tại Ban chỉ huy quân sự phường/xã đúng hạn.',
      'Không nghe theo các chiêu trò lừa đảo "chạy" hoãn nghĩa vụ quân sự vi phạm pháp luật.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Theo Luật Nghĩa vụ quân sự năm 2015, công dân nam được đào tạo trình độ đại học, cao đẳng đã được tạm hoãn thì độ tuổi gọi nhập ngũ kéo dài đến hết bao nhiêu tuổi?',
        options: ['Đến hết 27 tuổi', 'Đến hết 25 tuổi', 'Đến hết 30 tuổi', 'Đến hết 26 tuổi'],
        correctAnswer: 0,
        explanation: 'Luật NVQS quy định công dân học ĐH, CĐ chính quy được kéo dài độ tuổi gọi nhập ngũ đến hết 27 tuổi.'
      }
    ]
  },
  {
    id: '11_3',
    order: 'Bài 3',
    title: 'Phòng chống tệ nạn xã hội ở Việt Nam trong thời kì hội nhập',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được đặc điểm các loại tệ nạn xã hội nguy hiểm: cờ bạc, mại dâm, mê tín dị đoan, cá độ bóng đá.',
        'Nhận diện các hình thức tội phạm sử dụng công nghệ cao (Deepfake giả mạo khuôn mặt, lừa đảo app tài chính, bẫy việc làm qua mạng).',
        'Nắm vững chính sách, biện pháp phòng chống tệ nạn xã hội của Đảng và Nhà nước.'
      ],
      skills: [
        'Nhận diện các thủ đoạn lừa đảo tinh vi trên không gian mạng.',
        'Kỹ năng tự vệ tâm lý, không bị cám dỗ bởi "việc nhẹ lương cao".'
      ],
      attitudes: [
        'Lên án các tệ nạn xã hội, tích cực bảo vệ môi trường văn hóa lành mạnh.'
      ]
    },
    sections: [
      {
        title: 'I. Tệ nạn xã hội và tác hại',
        paragraphs: [
          'Tệ nạn xã hội là hiện tượng xã hội tiêu cực, có tính phổ biến, biểu hiện bằng những hành vi sai lệch chuẩn mực xã hội, vi phạm đạo đức và pháp luật, gây hậu quả nghiêm trọng cho cá nhân, gia đình và xã hội.'
        ],
        bullets: [
          'Tệ nạn cờ bạc, cá độ: Làm tan nát kinh tế gia đình, dẫn đến trộm cắp, cướp giật, "tín dụng đen".',
          'Mê tín dị đoan: Lợi dụng niềm tin tâm linh để trục lợi, gây hoang mang, làm mất thời gian, tiền bạc.'
        ]
      },
      {
        title: 'II. Tội phạm sử dụng công nghệ cao trong thời kỳ hội nhập',
        paragraphs: [
          'Trong kỷ nguyên số, các đường dây tội phạm có tổ chức triệt để lợi dụng công nghệ cao để lừa đảo xuyên biên giới:'
        ],
        bullets: [
          'Công nghệ Deepfake: Giả mạo giọng nói, video khuôn mặt của người thân gọi điện cầu cứu chuyển tiền gấp.',
          'Bẫy "Việc nhẹ lương cao": Lừa đảo làm nhiệm vụ online, like video TikTok nhận hoa hồng, rồi ép nạp tiền giữ vốn.',
          'Lừa đảo thông báo trúng thưởng, giả danh cơ quan Công an, Viện kiểm sát yêu cầu chuyển tiền vào tài khoản "an toàn" để điều tra.'
        ],
        tipBox: {
          title: 'Khuyến cáo của Cục An ninh mạng Bộ Công an',
          content: 'Cơ quan Công an, Viện kiểm sát, Tòa án KHÔNG BAO GIỜ làm việc hoặc yêu cầu chuyển tiền qua điện thoại và mạng xã hội!'
        }
      }
    ],
    keyTakeaways: [
      'Tệ nạn xã hội là mầm mống phát sinh tội phạm hình sự nguy hiểm.',
      'Cảnh giác tuyệt đối với thủ đoạn giả mạo cán bộ cơ quan tư pháp và công nghệ Deepfake.',
      'Không tin vào lời hứa hẹn "việc nhẹ lương cao" trên mạng xã hội.'
    ],
    practicalApplication: [
      'Khi nhận cuộc gọi video của người thân hỏi mượn tiền, luôn gọi lại bằng số điện thoại di động trực tiếp để xác minh.',
      'Tuyên truyền cho ông bà, bố mẹ cách nhận biết cuộc gọi lừa đảo mạo danh công an.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Khi nhận được cuộc gọi từ người tự xưng là cán bộ Công an thông báo bạn liên quan đến đường dây tội phạm và yêu cầu chuyển tiền vào "tài khoản tạm giữ" để chứng minh, bạn phải làm gì?',
        options: [
          'Tuyệt đối không làm theo, cúp máy và báo ngay cho cơ quan Công an gần nhất',
          'Vội vàng ra ngân hàng chuyển tiền ngay vì sợ hãi',
          'Cung cấp toàn bộ mã OTP và mật khẩu ngân hàng',
          'Vay mượn bạn bè để nộp phạt trực tuyến'
        ],
        correctAnswer: 0,
        explanation: 'Cơ quan Công an không bao giờ làm việc hay yêu cầu chuyển tiền qua điện thoại. Đó là 100% lừa đảo.'
      }
    ]
  },
  {
    id: '11_4',
    order: 'Bài 4',
    title: 'Một số vấn đề về vi phạm pháp luật bảo vệ môi trường',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được thực trạng môi trường hiện nay và các vấn đề an ninh môi trường, biến đổi khí hậu toàn cầu.',
        'Nắm vững nội dung cơ bản của Luật Bảo vệ môi trường năm 2020.',
        'Nhận biết các hành vi vi phạm pháp luật và tội phạm về môi trường.'
      ],
      skills: [
        'Thực hành phân loại rác thải tại nguồn, sử dụng tiết kiệm năng lượng.'
      ],
      attitudes: [
        'Hình thành ý thức bảo vệ môi trường sống xanh, sạch, đẹp.'
      ]
    },
    sections: [
      {
        title: 'I. An ninh môi trường và thực trạng',
        paragraphs: [
          'An ninh môi trường là trạng thái hệ thống các yếu tố cấu thành môi trường được bảo đảm an toàn, không bị suy thoái, ô nhiễm nghiêm trọng, bảo đảm sự tồn tại và phát triển của con người và sinh vật.',
          'Các thách thức lớn: Biến đổi khí hậu, nước biển dâng, hạn mặn ở đồng bằng sông Cửu Long, ô nhiễm không khí bụi mịn PM2.5 ở các đô thị lớn, rác thải nhựa đại dương.'
        ]
      },
      {
        title: 'II. Các hành vi bị nghiêm cấm trong Luật Bảo vệ môi trường 2020',
        bullets: [
          'Xả chất thải nguy hại, nước thải công nghiệp chưa xử lý đạt quy chuẩn ra môi trường tự nhiên.',
          'Hủy hoại rừng tự nhiên, khai thác khoáng sản trái phép gây sạt lở, xói mòn đất.',
          'Săn bắt, buôn bán, tiêu thụ động vật hoang dã nguy cấp, quý hiếm.',
          'Nhập khẩu phế liệu, máy móc lạc hậu gây ô nhiễm môi trường vào Việt Nam.'
        ]
      }
    ],
    keyTakeaways: [
      'An ninh môi trường gắn liền trực tiếp với an ninh quốc gia và sự phát triển bền vững.',
      'Xả thải trái phép hủy hoại môi trường có thể bị xử lý hình sự (tù đến 15 năm).',
      'Hành động nhỏ: phân loại rác, từ chối túi nilon, tiết kiệm điện nước.'
    ],
    practicalApplication: [
      'Không vứt rác bừa bãi tại trường học và khu du lịch.',
      'Sử dụng bình nước cá nhân, túi vải thân thiện môi trường thay thế đồ nhựa dùng một lần.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Hành vi nào sau đây bị nghiêm cấm trong Luật Bảo vệ môi trường?',
        options: [
          'Xả nước thải chưa qua xử lý đạt chuẩn ra sông ngòi, môi trường',
          'Trồng cây gây rừng, phủ xanh đất trống đồi trọc',
          'Phân loại rác thải hữu cơ và vô cơ tại nguồn',
          'Sử dụng năng lượng mặt trời và năng lượng gió'
        ],
        correctAnswer: 0,
        explanation: 'Xả nước thải chưa xử lý đạt quy chuẩn kỹ thuật ra môi trường là hành vi vi phạm pháp luật môi trường.'
      }
    ]
  },
  {
    id: '11_5',
    order: 'Bài 5',
    title: 'Kiến thức phổ thông về phòng không nhân dân',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nắm vững phương thức, thủ đoạn tiến công đường không của địch bằng vũ khí công nghệ cao (tên lửa hành trình, UAV, máy bay tàng hình).',
        'Nêu được mục đích, nguyên tắc tổ chức hoạt động phòng không nhân dân.',
        'Nắm vững các biện pháp phòng tránh, sơ tán, đánh trả và khắc phục hậu quả.'
      ],
      skills: [
        'Biết cách ẩn nấp an toàn khi nghe còi báo động phòng không.'
      ],
      attitudes: [
        'Nêu cao ý thức sẵn sàng chiến đấu, kiên cường, dũng cảm.'
      ]
    },
    sections: [
      {
        title: 'I. Thủ đoạn tiến công đường không của địch',
        paragraphs: [
          'Trong chiến tranh hiện đại, địch thường mở màn bằng chiến dịch tiến công hỏa lực đường không ồ ạt, kết hợp tác chiến điện tử làm tê liệt hệ thống radar và chỉ huy phòng không của ta.',
          'Vũ khí chủ yếu: Bom thông minh (JDAM), tên lửa hành trình Tomahawk, máy bay không người lái (UAV) tấn công tự sát, tên lửa chống bức xạ radar.'
        ]
      },
      {
        title: 'II. Biện pháp phòng tránh, sơ tán của phòng không nhân dân',
        bullets: [
          'Trinh sát, quan sát, phát hiện địch và phát tín hiệu báo động (còi rú liên tục, kẻng báo động).',
          'Tổ chức sơ tán, phân tán người và tài sản khỏi các mục tiêu trọng điểm (trung tâm chính trị, đầu mối giao thông, nhà máy, kho tàng).',
          'Xây dựng hệ thống công sự hầm, hào trú ẩn ngụy trang kiên cố.',
          'Ngụy trang, giữ bí mật ánh sáng ban đêm (đèn phòng không).'
        ]
      },
      {
        title: 'III. Khắc phục hậu quả',
        paragraphs: [
          'Cứu sập, cứu hỏa, cấp cứu người bị thương, rà phá bom mìn chưa nổ, tiêu tẩy chất độc hóa học (nếu có) và nhanh chóng khôi phục đời sống.'
        ]
      }
    ],
    keyTakeaways: [
      'Tiến công đường không hiện đại sử dụng vũ khí chính xác cao, tầm xa và tàng hình.',
      'Công tác phòng không nhân dân lấy phòng tránh, sơ tán là biện pháp cơ bản bảo toàn lực lượng.',
      'Hầm hào công sự và tín hiệu báo động kịp thời giúp giảm thiểu tối đa thương vong.'
    ],
    practicalApplication: [
      'Nắm chắc vị trí các hầm trú ẩn hoặc gầm cầu thang kiên cố tại địa phương khi có diễn tập phòng thủ dân sự.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Trong hoạt động phòng không nhân dân, biện pháp cơ bản hàng đầu để hạn chế tổn thất về người và tài sản khi địch tiến công hỏa lực đường không là gì?',
        options: [
          'Tổ chức sơ tán, phân tán và làm hầm hào phòng tránh',
          'Đứng trên nóc nhà cao tầng để quan sát máy bay địch',
          'Tập trung đông người tại quảng trường trung tâm',
          'Bật sáng toàn bộ hệ thống đèn chiếu sáng ban đêm'
        ],
        correctAnswer: 0,
        explanation: 'Sơ tán, phân tán kịp thời và ẩn nấp hầm hào kiên cố là biện pháp cốt lõi để bảo toàn sinh mạng nhân dân.'
      }
    ]
  },
  {
    id: '11_6',
    order: 'Bài 6',
    title: 'Giới thiệu súng bộ binh, thuốc nổ, vật cản và vũ khí tự tạo',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết lý thuyết & thực hành',
    objectives: {
      knowledge: [
        'Nắm vững tính năng, tác dụng, số liệu kỹ chiến thuật và cấu tạo 11 bộ phận chính của súng tiểu liên AK.',
        'Nắm được quy tắc tháo lắp thông thường ban ngày của súng AK.',
        'Hiểu rõ tính năng một số loại thuốc nổ chính (TNT, C4) và các loại vật cản nổ, không nổ.'
      ],
      skills: [
        'Thực hành thành thạo các bước tháo và lắp súng tiểu liên AK đúng thứ tự, bảo đảm an toàn.'
      ],
      attitudes: [
        'Ý thức giữ gìn, bảo quản vũ khí trang bị, chấp hành nghiêm quy tắc an toàn.'
      ]
    },
    sections: [
      {
        title: 'I. Súng tiểu liên AK (Avtomat Kalashnikova)',
        subsections: [
          {
            subtitle: '1. Tính năng, tác dụng và số liệu kỹ thuật',
            paragraphs: [
              'Súng tiểu liên AK do Mikhail Kalashnikov (Liên Xô) thiết kế. Súng trang bị cho từng người, dùng hỏa lực để tiêu diệt sinh lực địch; có lê để đánh giáp lá cà.'
            ],
            bullets: [
              'Cỡ đạn: 7,62 mm (dùng đạn cỡ 7,62 x 39 mm kiểu 1943).',
              'Tầm bắn ghi trên thước ngắm: Đến 800m (AK-47), đến 1000m (AKM). Tầm bắn hiệu quả: 400m; bắn máy bay, quân nhảy dù: 500m.',
              'Hộp tiếp đạn: Chứa 30 viên đạn.',
              'Sơ tốc đầu đạn: 710 m/s (AK-47), 715 m/s (AKM).',
              'Tốc độ bắn: Lý thuyết 600 phát/phút; thực tế bắn phát một: 40 phát/phút; bắn liên thanh: 100 phát/phút.',
              'Khối lượng súng: 4,3 kg (AK-47 khi không đạn), lắp hộp tiếp đạn đủ 30 viên nặng 4,8 kg.'
            ]
          },
          {
            subtitle: '2. Cấu tạo 11 bộ phận chính của súng AK',
            bullets: [
              '1. Nòng súng và bộ phận ngắm (đầu ngắm, thước ngắm).',
              '2. Hộp khóa nòng và nắp hộp khóa nòng.',
              '3. Bệ khóa nòng và thoi đẩy.',
              '4. Khóa nòng.',
              '5. Bộ phận đẩy về (lò xo đẩy về và cốt đẩy về).',
              '6. Bộ phận kích phát (búa, cò, khóa an toàn).',
              '7. Ống dẫn thoi và ốp lót tay.',
              '8. Báng súng và tay cầm.',
              '9. Hộp tiếp đạn (chứa 30 viên).',
              '10. Lê (để đánh gần).',
              '11. Phụ tùng và thông nòng.'
            ]
          },
          {
            subtitle: '3. Thứ tự 7 bước tháo súng AK thông thường ban ngày',
            bullets: [
              'Bước 1: Tháo hộp tiếp đạn, kiểm tra súng (khám súng: gạt cần định cách bắn xuống nấc liên thanh hoặc phát một, kéo bệ khóa nòng về sau hết cỡ xem buồng đạn, bóp cò hướng lên trời 45 độ).',
              'Bước 2: Tháo ống đựng phụ tùng.',
              'Bước 3: Tháo thông nòng.',
              'Bước 4: Tháo nắp hộp khóa nòng.',
              'Bước 5: Tháo bộ phận đẩy về.',
              'Bước 6: Tháo bệ khóa nòng và khóa nòng (rồi tách khóa nòng ra khỏi bệ khóa nòng).',
              'Bước 7: Tháo ống dẫn thoi và ốp lót tay trên.'
            ],
            highlight: 'Quy tắc lắp súng: Bộ phận nào tháo ra sau thì lắp vào trước (lắp ngược lại thứ tự tháo).'
          }
        ]
      },
      {
        title: 'II. Thuốc nổ và Vật cản',
        paragraphs: [
          'Thuốc nổ TNT (Trinitrotoluene): Dạng tinh thể màu vàng nhạt, đúc thành bánh 200g, 400g. Cháy ở 300 độ C, khó kích nổ bằng va đập thông thường, nổ mạnh khi có kíp nổ số 8.',
          'Thuốc nổ C4: Màu trắng đục, dạng dẻo có thể nhào nặn như đất sét, dùng phá các khối kim loại có hình dáng phức tạp.'
        ],
        bullets: [
          'Vật cản nổ: Mìn chống bộ binh, mìn chống tăng (gây sát thương hoặc phá hủy phương tiện cơ giới).',
          'Vật cản không nổ: Hàng rào thép gai (bùng nhùng, mái nhà, cũi lợn), chông tre, hầm chông, hào chống tăng.'
        ]
      }
    ],
    keyTakeaways: [
      'Súng tiểu liên AK có cỡ đạn 7,62 mm, hộp tiếp đạn chứa 30 viên, tầm bắn hiệu quả 400m.',
      'Cấu tạo gồm 11 bộ phận chính, tháo thông thường gồm 7 bước, tháo trước lắp sau.',
      'Khi tháo lắp súng phải khám súng kiểm tra an toàn đầu tiên, đặt các bộ phận thứ tự trên bàn sạch.'
    ],
    practicalApplication: [
      'Áp dụng thành thạo thao tác tháo lắp súng trong các hội thao GDQP-AN học sinh cấp trường và cấp tỉnh.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Súng tiểu liên AK cỡ nòng bao nhiêu và hộp tiếp đạn chứa được tối đa bao nhiêu viên đạn?',
        options: [
          'Cỡ đạn 7,62 mm, hộp tiếp đạn 30 viên',
          'Cỡ đạn 5,56 mm, hộp tiếp đạn 20 viên',
          'Cỡ đạn 9 mm, hộp tiếp đạn 30 viên',
          'Cỡ đạn 7,62 mm, hộp tiếp đạn 40 viên'
        ],
        correctAnswer: 0,
        explanation: 'Súng tiểu liên AK dùng cỡ đạn 7,62 x 39 mm kiểu 1943 và hộp tiếp đạn chứa 30 viên.'
      },
      {
        id: 2,
        question: 'Thao tác đầu tiên bắt buộc phải thực hiện trước khi tiến hành tháo các bộ phận của súng tiểu liên AK là gì?',
        options: [
          'Tháo hộp tiếp đạn và khám súng kiểm tra buồng đạn',
          'Tháo nắp hộp khóa nòng',
          'Tháo bệ khóa nòng',
          'Tháo ống đựng phụ tùng'
        ],
        correctAnswer: 0,
        explanation: 'Phải tháo hộp tiếp đạn và khám súng đầu tiên để bảo đảm buồng đạn không còn đạn, an toàn tuyệt đối.'
      }
    ]
  },
  {
    id: '11_7',
    order: 'Bài 7',
    title: 'Pháp luật về quản lí vũ khí, vật liệu nổ, công cụ hỗ trợ',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '2 tiết lý thuyết',
    objectives: {
      knowledge: [
        'Nêu được nguyên tắc quản lý vũ khí, vật liệu nổ và công cụ hỗ trợ theo Luật năm 2017 (sửa đổi 2019, 2024).',
        'Phân biệt vũ khí quân dụng, vũ khí thể thao, súng săn và vũ khí thô sơ.',
        'Nắm vững các hành vi bị nghiêm cấm và chế tài xử lý vi phạm.'
      ],
      skills: [
        'Nhận diện các công cụ nguy hiểm và biết quy trình giao nộp vũ khí cho cơ quan chức năng.'
      ],
      attitudes: [
        'Tuyệt đối không chế tạo pháo nổ, tàng trữ dao kiếm nguy hiểm.'
      ]
    },
    sections: [
      {
        title: 'I. Phân loại vũ khí và nguyên tắc quản lý',
        bullets: [
          'Vũ khí quân dụng: Súng cầm tay, súng hạng nặng, đạn, bom, mìn, lựu đạn trang bị cho lực lượng vũ trang.',
          'Súng săn: Súng kíp, súng hơi dùng để săn bắn.',
          'Vũ khí thô sơ: Dao găm, kiếm, giáo, mác, cung, nỏ, phi tiêu có tính sát thương cao.',
          'Công cụ hỗ trợ: Bình xịt hơi cay, dùi cui điện, dùi cui cao su, khóa số 8, súng bắn đạn cao su.'
        ]
      },
      {
        title: 'II. Các hành vi bị nghiêm cấm',
        bullets: [
          'Nghiêm cấm cá nhân sở hữu vũ khí quân dụng, súng săn, vũ khí thô sơ (trừ vũ khí thô sơ là hiện vật để trưng bày, triển lãm được cấp phép).',
          'Nghiêm cấm nghiên cứu, chế tạo, sản xuất, mua bán, tàng trữ, vận chuyển, sử dụng trái phép vũ khí, vật liệu nổ, pháo nổ.',
          'Nghiêm cấm tự chế pháo nổ qua hướng dẫn trên mạng Internet (hành vi gây chết người và tàn tật nghiêm trọng ở lứa tuổi thanh thiếu niên).'
        ]
      }
    ],
    keyTakeaways: [
      'Cá nhân không được phép sở hữu vũ khí quân dụng dưới bất kỳ hình thức nào.',
      'Tự chế pháo nổ là hành vi vi phạm pháp luật hình sự rất nghiêm trọng.',
      'Khi nhặt được vũ khí, lựu đạn phải lập tức trình báo và bàn giao cho cơ quan Công an/Quân sự.'
    ],
    practicalApplication: [
      'Nói KHÔNG với việc mua bán hóa chất (KCLO3, lưu huỳnh) tự chế pháo nổ dịp Tết Nguyên đán.',
      'Kịp thời tố giác các đối tượng tàng trữ hung khí, dao phóng lợn giải quyết mâu thuẫn học đường.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Công dân có quyền sở hữu vũ khí quân dụng không?',
        options: ['Không, pháp luật nghiêm cấm cá nhân sở hữu vũ khí quân dụng', 'Có, nếu được cơ quan cấp huyện cho phép', 'Có, nếu mua từ nước ngoài', 'Có, nếu chỉ dùng bảo vệ gia đình'],
        correctAnswer: 0,
        explanation: 'Luật quy định nghiêm cấm cá nhân sở hữu vũ khí quân dụng dưới mọi hình thức.'
      }
    ]
  },
  {
    id: '11_8',
    order: 'Bài 8',
    title: 'Lợi dụng địa hình, địa vật',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết thực hành',
    objectives: {
      knowledge: [
        'Phân biệt rõ ràng giữa vật che khuất và vật che đỡ.',
        'Nắm vững yêu cầu và nguyên tắc lợi dụng địa hình địa vật trong quan sát, ẩn nấp và nổ súng tiêu diệt địch.'
      ],
      skills: [
        'Thực hành lợi dụng gốc cây, mô đất, bờ tường, khe rãnh khéo léo, kín đáo.'
      ],
      attitudes: [
        'Rèn luyện tính cẩn trọng, bí mật, linh hoạt, mắt tinh tai thính.'
      ]
    },
    sections: [
      {
        title: 'I. Khái niệm vật che khuất và vật che đỡ',
        paragraphs: [
          'Vật che khuất: Là những vật thể chỉ có tác dụng che giấu hành động của ta khỏi tầm mắt quan sát của địch nhưng không thể chống đỡ được mảnh bom đạn hoặc đạn bắn thẳng của địch (Ví dụ: bụi cây, lùm cỏ, rèm cửa, khói sương).',
          'Vật che đỡ: Là những vật thể vừa có tác dụng che giấu hành động, vừa có khả năng chống đỡ được sức công phá của đạn bắn thẳng, mảnh pháo, mảnh bom (Ví dụ: tảng đá lớn, gốc cây to, bờ tường gạch kiên cố, mô đất dày, giao thông hào).'
        ]
      },
      {
        title: 'II. Yêu cầu và cách lợi dụng',
        bullets: [
          'Hành động phải bí mật, khéo léo, không làm rung động cành lá, biến dạng vật che khuất.',
          'Tránh lợi dụng các vật đột xuất đứng đơn độc giữa bãi trống (vì địch thường tập trung hỏa lực bắn vào đó).',
          'Vị trí lợi dụng: Ban ngày nên lợi dụng ở phía sau, bên cạnh vật; ban đêm hoặc nơi tối nên lợi dụng nơi cao nhìn xuống thấp.',
          'Khi vượt qua bãi địa hình trống trải: Lợi dụng lúc địch sơ hở, khói bụi mờ mịt, vọt tiến nhanh zíc-zắc từ vị trí che đỡ này sang vị trí che đỡ khác.'
        ]
      }
    ],
    keyTakeaways: [
      'Vật che khuất: Giấu mắt địch nhưng KHÔNG chống được đạn.',
      'Vật che đỡ: Vừa giấu mắt địch VỪA chống đỡ được đạn bắn thẳng.',
      'Tuyệt đối tránh các vật đơn độc, nổi bật trên chiến trường.'
    ],
    practicalApplication: [
      'Kỹ năng chọn vị trí ẩn nấp kiên cố (cột bê tông cốt thép) khi xảy ra thảm họa động đất, sập đổ công trình.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Vật thể nào sau đây thuộc loại "Vật che đỡ"?',
        options: ['Bờ tường gạch kiên cố, tảng đá lớn', 'Bụi cây rậm rạp', 'Cánh đồng ngô cao', 'Màn khói mù mịt'],
        correctAnswer: 0,
        explanation: 'Bờ tường gạch kiên cố và tảng đá lớn vừa che giấu được vị trí vừa chống đỡ được đạn bắn thẳng.'
      }
    ]
  },
  {
    id: '11_9',
    order: 'Bài 9',
    title: 'Nhìn, nghe, phát hiện địch, chỉ mục tiêu, truyền tin liên lạc',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết lý thuyết & thực hành',
    objectives: {
      knowledge: [
        'Nắm vững quy luật nhìn, nghe để phát hiện dấu vết địch trong điều kiện ban ngày và ban đêm.',
        'Nắm vững phương pháp chỉ mục tiêu bằng vật chuẩn hoặc cự ly hướng.',
        'Nắm vững các phương thức truyền tin liên lạc bằng lời nói, ám hiệu tay và cờ hiệu.'
      ],
      skills: [
        'Thực hành phát hiện mục tiêu ngụy trang và truyền đạt mệnh lệnh chuẩn xác, bí mật.'
      ],
      attitudes: [
        'Tác phong nhanh nhẹn, bình tĩnh, mưu trí.'
      ]
    },
    sections: [
      {
        title: 'I. Yếu lĩnh Nhìn và Nghe phát hiện địch',
        bullets: [
          'Nhìn ban ngày: Quan sát từ gần đến xa, từ phải sang trái, từ nơi cao xuống nơi thấp; chú ý nơi địa hình rậm rạp, nghi ngờ.',
          'Nhìn ban đêm: Ngồi thấp quan sát lên cao để thấy rõ hình bóng mục tiêu in trên nền trời sáng; không nhìn thẳng vào ánh đèn chói.',
          'Nghe: Đêm tối hoặc sương mù, thính giác là kênh thông tin chủ yếu. Áp tai sát mặt đất, ray tàu hỏa hoặc thân cây để nghe rung động tiếng bước chân, tiếng xích xe tăng từ khoảng cách xa.',
          'Dấu vết nghi ngờ: Cành cây gãy héo bất thường, chim thú hoảng loạn bay vụt lên, bụi bốc lên từ xa, ánh kim loại lấp lánh phản chiếu ánh sáng.'
        ]
      },
      {
        title: 'II. Phương pháp chỉ mục tiêu',
        paragraphs: [
          'Chọn vật chuẩn: Vật chuẩn phải rõ ràng, cố định, dễ nhận biết (cây đa cụt đầu, mái nhà đỏ, ngã ba đường).',
          'Cách chỉ: "Vật chuẩn 1 sang phải 20 mét, cách 300 mét, hỏa điểm đại liên địch - BẮN!"'
        ]
      },
      {
        title: 'III. Truyền tin liên lạc',
        bullets: [
          'Truyền lệnh bằng lời: Ngắn gọn, chuẩn xác, truyền thầm từ người này sang người kia.',
          'Truyền tin bằng ám hiệu: Dùng động tác tay, tiếng kêu chim thú tự tạo, ánh sáng đèn pin che bớt mặt kính.'
        ]
      }
    ],
    keyTakeaways: [
      'Ban ngày nhìn từ cao xuống thấp, ban đêm nhìn từ thấp lên cao.',
      'Áp tai xuống đất giúp phát hiện tiếng động cơ và bước chân cơ động từ xa.',
      'Chỉ mục tiêu phải căn cứ vào vật chuẩn cố định, rõ ràng.'
    ],
    practicalApplication: [
      'Tăng cường khả năng định hướng và phản xạ thính giác khi tham gia cắm trại dã ngoại ban đêm.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Khi quan sát ban đêm trên chiến trường, chiến sĩ nên chọn tư thế như thế nào để phát hiện mục tiêu dễ dàng nhất?',
        options: [
          'Ở vị trí thấp quan sát lên nơi cao để nhìn rõ hình bóng mục tiêu in trên nền trời',
          'Đứng trên nóc nhà cao nhất',
          'Bật đèn pin quét sáng liên tục',
          'Nhìn chăm chú vào ánh lửa địch'
        ],
        correctAnswer: 0,
        explanation: 'Ban đêm ở vị trí thấp quan sát lên cao sẽ tận dụng ánh sáng nền trời để nhận diện hình bóng mục tiêu cử động.'
      }
    ]
  },
  {
    id: '11_10',
    order: 'Bài 10',
    title: 'Kĩ thuật sử dụng lựu đạn',
    grade: 11,
    textbook: 'Sách giáo khoa GDQP&AN 11 (Bộ Kết nối tri thức với cuộc sống)',
    estimatedTime: '4 tiết lý thuyết & thực hành',
    objectives: {
      knowledge: [
        'Nắm vững tính năng, tác dụng, cấu tạo và nguyên lý hoạt động của lựu đạn F-1 và lựu đạn LĐ-01.',
        'Nắm vững các tư thế ném lựu đạn: đứng ném, quỳ ném, nằm ném.',
        'Hiểu và chấp hành tuyệt đối quy tắc an toàn khi ném lựu đạn thật.'
      ],
      skills: [
        'Thực hành động tác đứng ném lựu đạn xa trúng đích, phối hợp sức tay, rướn thân và đạp chân.'
      ],
      attitudes: [
        'Tập trung cao độ, tuân thủ kỷ luật thao trường nghiêm ngặt.'
      ]
    },
    sections: [
      {
        title: 'I. Tính năng kỹ thuật của lựu đạn F-1',
        paragraphs: [
          'Lựu đạn F-1 là loại lựu đạn sát thương phòng ngự, vỏ bằng gang có khía rãnh như múi khế tạo nhiều mảnh vụn khi nổ.'
        ],
        bullets: [
          'Khối lượng toàn bộ: 600 gam.',
          'Thuốc nổ nhồi bên trong: 60 gam thuốc nổ TNT.',
          'Thời gian cháy chậm từ khi rút chốt giật kíp nổ đến khi nổ: 3,2 giây đến 4,2 giây.',
          'Bán kính sát thương mảnh văng: Đến 20 mét (nguy hiểm trong vòng 20m, người ném phải có hầm hào che đỡ an toàn).'
        ]
      },
      {
        title: 'II. Các tư thế ném lựu đạn',
        bullets: [
          'Đứng ném: Vận dụng khi chiến hào có chiều sâu ngang ngực, hoặc phía sau có vật che khuất, che đỡ cao. Đứng ném cho cự ly xa nhất nhờ phát huy tối đa sức rướn của thân và vút cánh tay.',
          'Quỳ ném: Vận dụng khi vật che khuất, che đỡ cao ngang tầm bụng.',
          'Nằm ném: Vận dụng khi sát địch, địa hình trống trải hoặc hỏa lực địch bắn rát.'
        ],
        tipBox: {
          title: 'Quy tắc an toàn tuyệt đối',
          content: 'Chỉ được mở chốt an toàn và ném khi có khẩu lệnh của chỉ huy thao trường. Tuyệt đối không đùa nghịch, không quăng ném sai hướng quy định.'
        }
      }
    ],
    keyTakeaways: [
      'Lựu đạn F-1 chứa 60g thuốc nổ TNT, bán kính sát thương mảnh văng lên tới 20m.',
      'Thời gian cháy chậm của bộ phận điểm hỏa: 3,2 - 4,2 giây.',
      'Đứng ném cho cự ly ném xa nhất nhờ lực đẩy của chân, xoay lườn và vút tay.'
    ],
    practicalApplication: [
      'Rèn luyện thể lực, khớp vai dẻo dai để đạt thành tích ném lựu đạn xa trên 35m đối với học sinh nam.'
    ],
    reviewQuestions: [
      {
        id: 1,
        question: 'Thời gian cháy chậm của ngòi nổ lựu đạn F-1 từ khi kim hỏa đập vào hạt lửa đến khi khối thuốc nổ phát nổ là bao nhiêu giây?',
        options: ['Từ 3,2 đến 4,2 giây', 'Từ 1 đến 2 giây', 'Từ 5 đến 7 giây', 'Nổ tức thì ngay khi thả mỏ vịt'],
        correctAnswer: 0,
        explanation: 'Thời gian cháy chậm của ngòi nổ lựu đạn F-1 là từ 3,2 giây đến 4,2 giây.'
      }
    ]
  }
];
