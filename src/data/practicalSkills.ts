export interface PracticalQuiz {
  id: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export interface PracticalStep {
  id: string;
  title: string;
  objective: string;
  keyKnowledge: string;
  commonMistakes: string[];
  mediaPlaceholderText: string;
  videoSrc?: string;      // Đường dẫn tới file video (đặt trong /public/videos/)
  has3DModel?: boolean;
  model3DSrc?: string;    // Đường dẫn tới file .glb 3D model (đặt trong /public/models/)
  checklist: string[];
  quizzes: PracticalQuiz[];
}

export interface PracticalSkill {
  id: string;
  name: string;
  desc: string;
  iconName: string; // 'Move', 'Target', 'Accessibility', 'HeartPulse', 'Flame'
  steps: PracticalStep[];
}

export const PRACTICAL_SKILLS: PracticalSkill[] = [
  {
    id: "crawl",
    name: "Kỹ năng Trườn, Bò",
    desc: "Mô phỏng các tư thế vận động trên chiến trường",
    iconName: "Move",
    steps: [
      {
        id: "crawl-step-1",
        title: "Tư thế vận động chiến đấu",
        objective: "Nắm vững các tư thế lê, bò, trườn thấp, trườn cao ứng dụng linh hoạt khi vận động qua địa hình bằng phẳng, trống trải. Hạ thấp tối đa trọng tâm cơ thể, phối hợp nhịp nhàng giữa tay và chân.",
        keyKnowledge: "Các tư thế lê, bò, trườn thấp, trườn cao ứng dụng linh hoạt khi vận động qua địa hình bằng phẳng, trống trải hoặc gần sát tầm quan sát của địch. Đòi hỏi người chiến sĩ phải hạ thấp tối đa trọng tâm cơ thể, phối hợp nhịp nhàng giữa tay và chân để di chuyển bí mật, nhanh chóng tiếp cận trận địa.",
        commonMistakes: [
          "Nâng cao trọng tâm cơ thể, dễ làm lộ mục tiêu.",
          "Phối hợp tay chân không nhịp nhàng dẫn đến di chuyển chậm."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Chiến sĩ thực hiện động tác bò trườn trên thao trường]",
        videoSrc: "https://www.youtube.com/embed/Zk7wsf9Y3dU?si=bPdyKE4PSsKH3ofk",
        has3DModel: true,
        checklist: [
          "Hạ thấp trọng tâm, bám sát mặt đất.",
          "Tay trái và chân phải phối hợp nhịp nhàng (và ngược lại).",
          "Di chuyển tiến lên một cách dứt khoát, giữ bí mật."
        ],
        quizzes: [
          {
            id: "q-crawl-1",
            question: "Mục đích chính của động tác trườn, bò trên chiến trường là gì?",
            options: [
              "Để di chuyển nhanh hơn chạy",
              "Để tránh đạn và giữ bí mật khi tiếp cận trận địa",
              "Để tiết kiệm sức lực",
              "Để quan sát địch rõ hơn"
            ],
            correctIdx: 1,
            explanation: "Động tác này giúp hạ thấp trọng tâm tối đa, tránh đạn thẳng của địch và giữ bí mật."
          }
        ]
      }
    ]
  },
  {
    id: "grenade",
    name: "Tư thế Ném Lựu Đạn",
    desc: "Đứng, quỳ, nằm ném đúng kỹ thuật an toàn",
    iconName: "Target",
    steps: [
      {
        id: "grenade-step-1",
        title: "Kỹ thuật ném lựu đạn",
        objective: "Nắm vững các tư thế đứng, quỳ, nằm ném lựu đạn. Đảm bảo an toàn tuyệt đối khi rút chốt và ném.",
        keyKnowledge: "Động tác ném lựu đạn cần sự phối hợp lực của toàn thân, sức vung của cánh tay và độ rướn của cơ thể. Tùy thuộc vào địa hình, vật cản và khoảng cách đến mục tiêu mà chiến sĩ áp dụng tư thế đứng ném, quỳ ném hoặc nằm ném để đảm bảo vừa tiêu diệt được địch, vừa bảo vệ an toàn cho bản thân.",
        commonMistakes: [
          "Không rút chốt an toàn trước khi ném.",
          "Vung tay sai kỹ thuật, ném không đủ lực.",
          "Không tìm chỗ nấp an toàn sau khi ném."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Chiến sĩ thực hiện động tác vung tay ném lựu đạn]",
        videoSrc: "https://www.youtube.com/embed/ikJWmyaz7_4?si=TlCvzmv5eE7a02Zs",
        has3DModel: true,
        checklist: [
          "Cầm lựu đạn đúng cách, tay kia móc vào vòng chốt.",
          "Lấy đà, vung tay và ném lựu đạn về phía mục tiêu.",
          "Nhanh chóng thu mình hoặc tìm chỗ nấp sau khi ném."
        ],
        quizzes: [
          {
            id: "q-grenade-1",
            question: "Khi thực hiện động tác ném lựu đạn, lực ném chủ yếu đến từ đâu?",
            options: [
              "Chỉ từ sức vung của cánh tay",
              "Từ lực đẩy của chân",
              "Từ sự phối hợp lực của toàn thân, cánh tay và độ rướn",
              "Từ lực xoay của cổ tay"
            ],
            correctIdx: 2,
            explanation: "Cần phối hợp lực toàn thân để ném lựu đạn đi xa và chính xác."
          }
        ]
      }
    ]
  },
  {
    id: "posture",
    name: "Tư thế Cầm Súng / Bắn",
    desc: "Nắm vững các tư thế khám súng, mang súng và bắn",
    iconName: "Accessibility",
    steps: [
      {
        id: "posture-step-1",
        title: "Kỹ thuật ngắm bắn",
        objective: "Nắm vững các tư thế bắn cơ bản: Đứng, quỳ, nằm. Biết cách ốp báng súng vào vai và giữ thăng bằng.",
        keyKnowledge: "Đứng bắn áp dụng khi địa hình có vật che khuất, che đỡ cao ngang tầm ngực hoặc khi mục tiêu xuất hiện bất ngờ đòi hỏi di chuyển linh hoạt. Chú ý tỳ báng súng chắc chắn vào hõm vai, hai chân dang rộng bằng vai để giữ thăng bằng tối đa.",
        commonMistakes: [
          "Không tỳ chặt báng súng vào hõm vai dẫn đến giật mạnh.",
          "Đứng sai tư thế chân, dễ bị mất thăng bằng.",
          "Ngắm sai đường ngắm cơ bản."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Chiến sĩ thực hiện động tác đứng ngắm bắn súng AK]",
        videoSrc: "https://www.youtube.com/embed/YVXzZUHyDA4?si=ZRGKStS7w6h-fIBF",
        has3DModel: true,
        checklist: [
          "Mở rộng hai chân bằng vai, thân người hơi ngả về trước.",
          "Tỳ chặt báng súng vào hõm vai.",
          "Nín thở, bóp cò nhẹ nhàng."
        ],
        quizzes: [
          {
            id: "q-posture-1",
            question: "Khi đứng bắn súng AK, báng súng cần được đặt ở đâu?",
            options: [
              "Tỳ lên cánh tay",
              "Tỳ chặt vào hõm vai",
              "Kẹp nách",
              "Để hờ trước ngực"
            ],
            correctIdx: 1,
            explanation: "Tỳ báng súng vào hõm vai giúp giảm độ giật của súng khi bắn."
          }
        ]
      }
    ]
  },
  {
    id: "first-aid",
    name: "Sơ Cứu Ban Đầu",
    desc: "Kỹ năng sơ cứu ngừng tuần hoàn (ép tim, thổi ngạt)",
    iconName: "HeartPulse",
    steps: [
      {
        id: "step-1",
        title: "Đánh giá hiện trường & Gọi cấp cứu",
        objective: "Đảm bảo an toàn cho bản thân và nạn nhân, gọi hỗ trợ kịp thời.",
        keyKnowledge: "Nguyên tắc DRABC: D (Danger - Nguy hiểm), R (Response - Phản ứng). Luôn gọi 115 trước khi tiến hành sơ cứu nếu ở một mình.",
        commonMistakes: [
          "Lao vào cứu ngay mà không quan sát nguồn điện/khí độc.",
          "Quên gọi cấp cứu 115."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Học sinh quan sát xung quanh và bấm điện thoại gọi 115]",
        videoSrc: "https://www.youtube.com/embed/d4jGzz6nV3Y?si=WSII4l2SDpXLw6AM",
        checklist: [
          "Đã quan sát đánh giá an toàn hiện trường.",
          "Đã gọi số cấp cứu 115.",
          "Đã lay gọi, hỏi to để kiểm tra phản ứng của nạn nhân."
        ],
        quizzes: [
          {
            id: "q1",
            question: "Nguyên tắc đầu tiên khi tiếp cận nạn nhân là gì?",
            options: ["Lao vào sơ cứu ngay lập tức", "Đánh giá an toàn hiện trường", "Gọi điện cho người thân nạn nhân"],
            correctIdx: 1,
            explanation: "Luôn phải đánh giá an toàn hiện trường để tránh việc bản thân cũng trở thành nạn nhân."
          }
        ]
      },
      {
        id: "step-2",
        title: "Kiểm tra đường thở & Nhịp thở",
        objective: "Xác định nạn nhân còn thở hay không.",
        keyKnowledge: "Áp dụng kỹ thuật: Ngửa đầu - Nâng cằm (Head tilt - Chin lift). Ghé sát tai vào mũi miệng nạn nhân, mắt nhìn lồng ngực (Nghe - Cảm nhận - Nhìn) trong 5-10 giây.",
        commonMistakes: [
          "Gập cổ nạn nhân khiến đường thở bị nghẽn.",
          "Kiểm tra nhịp thở quá nhanh (dưới 5s)."
        ],
        mediaPlaceholderText: "[Áp tai vào mũi nạn nhân, mắt nhìn lồng ngực]",
        videoSrc: "https://www.youtube.com/embed/d4jGzz6nV3Y?si=WSII4l2SDpXLw6AM",
        checklist: [
          "Thực hiện kỹ thuật Ngửa đầu - Nâng cằm.",
          "Nghe tiếng thở bằng tai.",
          "Quan sát lồng ngực di chuyển."
        ],
        quizzes: [
          {
            id: "q2",
            question: "Thời gian kiểm tra nhịp thở chuẩn là bao lâu?",
            options: ["Dưới 5 giây", "Từ 5 đến 10 giây", "Trên 15 giây"],
            correctIdx: 1,
            explanation: "Kiểm tra từ 5-10 giây là đủ để xác định nhịp thở, không làm mất thời gian vàng ép tim."
          }
        ]
      },
      {
        id: "step-3",
        title: "Ép tim ngoài lồng ngực (CPR)",
        objective: "Duy trì tuần hoàn máu não khi tim ngừng đập.",
        keyKnowledge: "Vị trí: Nửa dưới xương ức. Tốc độ: 100-120 lần/phút. Độ sâu: 5-6 cm. Tỷ lệ: 30 lần ép tim / 2 lần thổi ngạt.",
        commonMistakes: [
          "Ép quá nông hoặc quá chậm.",
          "Co gập khuỷu tay khi ép (phải giữ thẳng tay)."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Tư thế ép tim thẳng tay, vuông góc với lồng ngực]",
        videoSrc: "https://www.youtube.com/embed/d4jGzz6nV3Y?si=WSII4l2SDpXLw6AM",
        checklist: [
          "Xác định đúng vị trí nửa dưới xương ức.",
          "Hai bàn tay đan vào nhau, giữ thẳng khuỷu tay.",
          "Ép tim liên tục 30 nhịp, độ sâu 5-6cm."
        ],
        quizzes: [
          {
            id: "q3",
            question: "Tỷ lệ chuẩn giữa Ép tim và Thổi ngạt (đối với người lớn) là bao nhiêu?",
            options: ["15 lần ép tim / 2 lần thổi ngạt", "30 lần ép tim / 2 lần thổi ngạt", "Ép tim liên tục, không thổi ngạt"],
            correctIdx: 1,
            explanation: "Theo chuẩn AHA, tỷ lệ là 30:2."
          }
        ]
      }
    ]
  },
  {
    id: "fire-safety",
    name: "Phòng Cháy Chữa Cháy",
    desc: "Sử dụng bình chữa cháy xách tay và thoát hiểm",
    iconName: "Flame",
    steps: [
      {
        id: "fs-1",
        title: "Xử lý ban đầu khi có cháy",
        objective: "Kịp thời báo động và cắt nguồn nhiệt.",
        keyKnowledge: "Hô hoán thật to 'Cháy! Cháy! Cháy!'. Bấm chuông báo cháy và cúp cầu dao điện khu vực bị cháy.",
        commonMistakes: [
          "Hoảng loạn chạy thoát thân mà không báo động cho người khác.",
          "Quên cúp cầu dao điện mà dùng nước dập lửa (nguy cơ điện giật)."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Bấm chuông báo cháy, ngắt cầu dao điện]",
        videoSrc: "https://www.youtube.com/embed/jt3Y-xyQz6M?si=1Jyu8_SXv39F7iqt",
        checklist: [
          "Hô hoán báo động.",
          "Bấm chuông báo cháy.",
          "Cúp cầu dao điện."
        ],
        quizzes: [
          {
            id: "fq1",
            question: "Việc ĐẦU TIÊN cần làm khi phát hiện đám cháy là gì?",
            options: ["Gọi 114", "Hô hoán báo động cho mọi người xung quanh", "Lấy điện thoại quay phim"],
            correctIdx: 1,
            explanation: "Phải hô hoán báo động đầu tiên để mọi người kịp thoát nạn và hỗ trợ dập lửa."
          }
        ]
      },
      {
        id: "fs-2",
        title: "Sử dụng bình chữa cháy",
        objective: "Sử dụng thành thạo bình chữa cháy bột/khí để dập tắt đám cháy nhỏ.",
        keyKnowledge: "Quy tắc PASS: Pull (Rút chốt) -> Aim (Chĩa vòi vào GỐC lửa) -> Squeeze (Bóp van) -> Sweep (Quét qua lại).",
        commonMistakes: [
          "Phun vào ngọn lửa thay vì phun vào GỐC lửa.",
          "Đứng ngược chiều gió khi phun (ở ngoài trời)."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Thao tác rút chốt và tư thế xịt bình chữa cháy]",
        videoSrc: "https://www.youtube.com/embed/jt3Y-xyQz6M?si=1Jyu8_SXv39F7iqt",
        checklist: [
          "Xách bình tới cách đám cháy khoảng 1.5m.",
          "Rút chốt an toàn.",
          "Chĩa vòi phun vào gốc lửa và bóp van."
        ],
        quizzes: [
          {
            id: "fq2",
            question: "Khi sử dụng bình chữa cháy, bạn phải phun hóa chất vào đâu?",
            options: ["Phun vào phần ngọn lửa đang cháy to nhất", "Phun vào gốc ngọn lửa (nơi xuất phát cháy)", "Phun bao trùm xung quanh đám cháy"],
            correctIdx: 1,
            explanation: "Chỉ khi phun vào gốc lửa thì mới cắt được nguồn duy trì sự cháy."
          }
        ]
      }
    ]
  },
  {
    id: "military-drill",
    name: "Điều lệnh đội ngũ",
    desc: "Động tác đứng nghiêm, đứng nghỉ, quay tại chỗ",
    iconName: "Accessibility",
    steps: [
      {
        id: "dl-1",
        title: "Động tác Đứng Nghiêm",
        objective: "Rèn luyện tác phong quân nhân, kỷ luật và sự tập trung.",
        keyKnowledge: "Gót chân chạm nhau, hai mũi chân mở ra một góc 45 độ. Đầu gối thẳng, ngực nở, bụng thót lại. Hai tay để thẳng tự nhiên, ngón tay khép kín, ngón cái ép sát đốt thứ hai của ngón trỏ. Mắt nhìn thẳng.",
        commonMistakes: [
          "Bàn chân mở quá rộng hoặc song song.",
          "Lưng gù, mắt nhìn xuống đất.",
          "Ngón tay không khép kín."
        ],
        mediaPlaceholderText: "[CHÈN ẢNH/VIDEO: Tư thế đứng nghiêm chuẩn từ phía trước và nhìn nghiêng]",
        videoSrc: "https://www.youtube.com/embed/MfVua57GFhc?si=cnHlXfwsReRplgRt",
        checklist: [
          "Gót chân chạm nhau, mũi chân mở 45 độ.",
          "Lưng thẳng, ngực nở, bụng thót lại.",
          "Hai tay khép kín sát thân người.",
          "Mắt nhìn thẳng."
        ],
        quizzes: [
          {
            id: "dq1",
            question: "Trong tư thế đứng nghiêm, hai mũi chân mở ra một góc bao nhiêu độ?",
            options: ["30 độ", "45 độ", "60 độ"],
            correctIdx: 1,
            explanation: "Hai gót chân chạm nhau, hai mũi chân mở ra góc 45 độ."
          }
        ]
      }
    ]
  },
  {
    id: "first-aid-bandage",
    name: "Kỹ Thuật Băng Vết Thương",
    desc: "Băng bó vết thương đầu, cẳng tay, cẳng chân, cổ chân và bàn tay theo chuẩn SGK GDQP 10 (Bài 12)",
    iconName: "Stethoscope",
    steps: [
      {
        id: "bandage-step-1",
        title: "Băng vết thương đầu (Băng chỏm đầu / trán)",
        objective: "Thực hiện đúng kỹ thuật băng vùng đầu, trán bằng băng cuộn. Đảm bảo băng chắc, không tuột, không gây đau đớm hay cản trở tuần hoàn cho nạn nhân.",
        keyKnowledge: "Băng đầu dùng kỹ thuật băng chỏm đầu (mũ băng). Bắt đầu bằng 2–3 vòng cơ sở (vòng tròn) quanh trán ngang mày. Sau đó dẫn băng lên đỉnh đầu, phủ kín vết thương theo kiểu nan quạt (mỗi dải băng cách nhau khoảng 1 cm, xen kẽ nhau). Cuối cùng dùng 2 vòng tròn cố định vành đầu và băng chắc.",
        commonMistakes: [
          "Băng quá chặt gây đau đầu, tê bì và cản trở tuần hoàn não.",
          "Không cố định đầu băng bằng khóa băng hoặc kẹp, dẫn đến tuột băng.",
          "Không phủ kín hoàn toàn vết thương khi dẫn băng theo kiểu nan quạt."
        ],
        mediaPlaceholderText: "[VIDEO: Băng chỏm đầu cho nạn nhân có vết thương vùng đầu]",
        videoSrc: "https://www.youtube.com/embed/7FLN-4iJ1t0?si=mRtrRxUZt0sz8zWz",
        checklist: [
          "Kiểm tra dụng cụ: băng cuộn 10 cm, kỹo, kẹp băng hoặc keo y tế.",
          "Thực hiện 2–3 vòng cơ sở quanh trán ngang lông mày để cố định đầu băng.",
          "Dẫn băng lên đỉnh đầu, phủ kín vết thương theo kiểu nan quạt (xếp xen kẽ).",
          "Kết thúc bằng 2 vòng tròn cố định vành đầu và khóa đầu băng chắc chắn."
        ],
        quizzes: [
          {
            id: "q-bandage-head-1",
            question: "Kỹ thuật băng đầu đúng chuẩn bắt đầu bằng ?",
            options: [
              "Băng thẳng lên đỉnh đầu ngay",
              "2–3 vòng cơ sở (vòng tròn) quanh trán để cố định",
              "Băng từ sau gáy ra trước",
              "Băng chéo từ tai này sang tai kia"
            ],
            correctIdx: 1,
            explanation: "Phải bắt đầu bằng 2–3 vòng cơ sở quanh trán (vòng tròn) để cố định băng trước, sau đó mới dẫn lên đỉnh đầu theo kiểu nan quạt."
          }
        ]
      },
      {
        id: "bandage-step-2",
        title: "Băng vết thương cẳng tay (Băng vòng xoắn)",
        objective: "Thực hiện đúng kỹ thuật băng vòng xoắn cho vùng cẳng tay. Đảm bảo cầm máu hiệu quả và cố định vết thương chắc chắn.",
        keyKnowledge: "Băng vòng xoắn (Spiral bandage) áp dụng cho các đoạn chi có đường kính đều (cánh tay, cẳng tay, ngón tay). Mỗi vòng băng phải che phủ được 2/3 chiều rộng của vòng băng trước. Góc nghiêng của băng khoảng 30 độ so với trục của chi. Băng từ dưới lên trên (từ phín xa tim về phía tim).",
        commonMistakes: [
          "Mỗi vòng băng không che phủ 2/3 vòng trước khiến băng bị hở và lỏng lẻ.",
          "Băng quá chặt gây tê liệt tuần hoàn, ngón tay tím tái.",
          "Băng từ trên xuống dưới (sai chiều, dễ gây xuất huyết)."
        ],
        mediaPlaceholderText: "[VIDEO: Băng vòng xoắn cho cẳng tay]",
        videoSrc: "https://www.youtube.com/embed/i3ZrcBYpTd4?si=YkK325ZdMnkB6BIC",
        checklist: [
          "Bắt đầu bằng 2 vòng tròn cố định ở đầu dưới của vết thương (phín xa tim).",
          "Mỗi vòng băng tiếp theo che phủ 2/3 vòng trước, nghiêng 30° theo trục chi.",
          "Kết thúc bằng 2 vòng tròn cố định phía trên vết thương.",
          "Kiểm tra màu sắc và cảm giác của ngón tay (phải hồng hào, không tê bì)."
        ],
        quizzes: [
          {
            id: "q-bandage-arm-1",
            question: "Trong kỹ thuật băng vòng xoắn, mỗi vòng băng phải che phủ bao nhiêu chiều rộng vòng băng trước?",
            options: [
              "1/3 chiều rộng",
              "1/2 chiều rộng",
              "2/3 chiều rộng",
              "Toàn bộ chiều rộng"
            ],
            correctIdx: 2,
            explanation: "Mỗi vòng băng phải che phủ đúng 2/3 vòng băng trước mới đảm bảo băng chắc và không bị hở."
          }
        ]
      },
      {
        id: "bandage-step-3",
        title: "Băng vết thương cẳng chân / gối (Băng số 8)",
        objective: "Thực hiện đúng kỹ thuật băng số 8 cho vùng khớp gối hoặc cổ chân. Đảm bảo cố định vững chắc và bảo vệ khớp hiệu quả.",
        keyKnowledge: "Băng số 8 (Figure-8 bandage) áp dụng cho các khớp có hình thon (gối, cổ chân, khuỷu tay). Đường băng đan xen nhau tạo thành hình số 8. Mỗi vòng băng che phủ 2/3 vòng băng trước. Khi băng gối, để khớp gối gấp nhẹ 15–20 độ để đường băng không bị căng khi bệnh nhân cự động nhẹ.",
        commonMistakes: [
          "Để khớp ở tư thế thẳng hoàn toàn khi băng, gây căng và tuột băng khi cự động.",
          "Vòng băng số 8 không đúng tâm, lệch về một phía dẫn đến cố định không đồng đều.",
          "Băng quá chặt gây phù nề phía dưới khớp và đau nhức."
        ],
        mediaPlaceholderText: "[VIDEO: Băng số 8 cho cẳng chân / gối]",
        videoSrc: "https://www.youtube.com/embed/qkLEAJs_LCo?si=H8dYqXvfK4kJFwsN",
        checklist: [
          "Đặt khớp ở tư thế trung gian: khớp gối gấp nhẹ 15–20°, cổ chân vuông góc 90°.",
          "Bắt đầu bằng 2 vòng tròn cố định phía dưới khớp (phía xa tim).",
          "Thực hiện các vòng số 8 qua khớp, mỗi vòng che phủ 2/3 vòng trước (3–5 lần).",
          "Kết thúc và cố định băng phía trên khớp.",
          "Kiểm tra tuần hoàn chi phía dưới (ngón chân phải hồng hào, không tê lạnh)."
        ],
        quizzes: [
          {
            id: "q-bandage-leg-1",
            question: "Khi băng số 8 cho khớp gối, nên để khớp gối ở tư thế nào?",
            options: [
              "Thẳng hoàn toàn (0°) để băng dễ hơn",
              "Gấp 15–20° (tư thế trung gian)",
              "Gấp 90° (vuông góc)",
              "Tùy theo cảm giác thoải mái của nạn nhân"
            ],
            correctIdx: 1,
            explanation: "Khớp gối gấp nhẹ 15–20° giúp băng không bị căng quá khi bệnh nhân cự động, đồng thời giữ cố định hiệu quả."
          }
        ]
      },
      {
        id: "bandage-step-4",
        title: "Băng vết thương cổ chân (Băng số 8 cổ chân)",
        objective: "Thực hiện đúng kỹ thuật băng số 8 cố định khớp cổ chân. Giúp bất động khớp, hạn chế sưng đau và đề phòng tái chấn thương hiệu quả.",
        keyKnowledge: "Băng số 8 cổ chân (Ankle Figure-8) giúp cố định khớp trong các trường hợp bóng gân, trẻ́o cổ chân. Bắt đầu bằng 2 vòng tròn quanh bàn chân ở đốt ngón chân. Dẫn băng lên cổ chân theo hình số 8, vòng băng giao nhau ở mu bàn chân. Cổ chân giữ vuong góc 90° (trung lập) trong suốt quá trình băng.",
        commonMistakes: [
          "Không giữ cổ chân vuong góc 90°, gây băng bị vẹo và mất tác dụng cố định.",
          "Vòng băng qua mu bàn chân không đúng tâm, dẫn đến sóng dạng chất lỏng không đều.",
          "Băng quá chặt gây chèn ép gân, tê liệt ngón chân."
        ],
        mediaPlaceholderText: "[VIDEO: Băng số 8 cố định cổ chân]",
        videoSrc: "https://www.youtube.com/embed/Ag7xc-XUJ7U?si=2kObIPtLxh5sRH4U",
        checklist: [
          "Giữ cổ chân vuong góc 90° (tư thế trung lập).",
          "Bắt đầu bằng 2 vòng tròn cố định quanh bàn chân (ở đốt gốc ngón chân).",
          "Dẫn băng lên cổ chân và vòng theo hình số 8 qua mu bàn chân (3–5 vòng).",
          "Kết thúc cố định băng ở phía trên cổ chân.",
          "Kiểm tra ngón chân: hồng hào, nhúnh nhịch được, không tê cứng."
        ],
        quizzes: [
          {
            id: "q-bandage-ankle-1",
            question: "Khi băng cố chân theo kỹ thuật số 8, cổ chân cần được giữ ở tư thế nào?",
            options: [
              "Ngã dưới hướng xuống (50–60°)",
              "Trung lập, vuông góc 90° với cẳng chân",
              "Để thoải mái theo ý nạn nhân",
              "Ngã lên trên (duyuễn tối đa)"
            ],
            correctIdx: 1,
            explanation: "Cổ chân phải ở tư thế trung lập (90°) để băng giữ đúng hình dạng số 8 và cố định khớp hiệu quả."
          }
        ]
      },
      {
        id: "bandage-step-5",
        title: "Băng vết thương bàn tay (Băng bao tay / Băng chạc ba ngón cái)",
        objective: "Thực hiện đúng kỹ thuật băng phủ kín bàn tay, bảo vệ vết thương vùng lòng bàn tay, mu bàn tay và ngón cái. Đảm bảo băng chắc, kín, không cản trở tuần hoàn.",
        keyKnowledge: "Băng bàn tay (Glove bandage) áp dụng cho vết thương rộng vung lòng/mu bàn tay hoặc nhiều ngón tay cùng lúc. Bắt đầu bằng 2 vòng cố định quanh cổ tay. Sau đó dẫn băng chéo xuống bù lòng bàn tay theo kiểu cạnh tán, phủ kín vết thương. Ngón cái được băng riêng bằng kỹ thuật chạc ba nếu có thương tích.",
        commonMistakes: [
          "Băng quá chặt gây tê và ứ máu ở đầu ngón tay.",
          "Bỏ lộ vết thương, không phủ kín toàn bộ vung tổn thương.",
          "Không cố định 2 vòng đầu tiên quanh cổ tay, dẫn đến tuột băng."
        ],
        mediaPlaceholderText: "[VIDEO: Băng phủ kín bàn tay cho nạn nhân]",
        videoSrc: "https://www.youtube.com/embed/_vBrDGxmIBM?si=kqZDhWSI7QqIduGr",
        checklist: [
          "Bắt đầu bằng 2 vòng tròn cố định chắc quanh cổ tay.",
          "Dẫn băng chéo xuống bàn tay, phủ kín vết thương theo kiểu cạnh tán.",
          "Băng ngón cái riêng bằng kỹ thuật chạc ba nếu có tổn thương.",
          "Kết thúc bằng 2 vòng cố định lại quanh cổ tay và khóa băng.",
          "Kiểm tra: đầu ngón tay hồng hào, nhúnh nhịch được, không tê buốt."
        ],
        quizzes: [
          {
            id: "q-bandage-hand-1",
            question: "Kỹ thuật băng bàn tay đúng chuẩn bắt đầu từ đâu?",
            options: [
              "Từ đầu ngón tay để phủ dần lên",
              "Từ cổ tay bằng 2 vòng cố định rồi dẫn xuống bàn tay",
              "Từ giữa lòng bàn tay",
              "Từ ngón cái ra ngoài"
            ],
            correctIdx: 1,
            explanation: "Phải cố định băng trước ở cổ tay bằng 2 vòng tròn, sau đó mới dẫn xuống bủ kín bàn tay."
          }
        ]
      }
    ]
  }
];
