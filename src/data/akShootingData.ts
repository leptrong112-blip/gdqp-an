/**
 * Dữ liệu chuẩn Sách giáo khoa GDQP-AN THPT & Giáo trình Huấn luyện Bắn súng Quân đội:
 * Hệ thống Bia, Cự ly, Bài bắn số 1, 2, 3 và Quy tắc ngắm bắn Súng tiểu liên AK.
 */

export type TargetId = "dong_tien" | "bia_4" | "bia_6" | "bia_8";
export type ShootingPosture = "nam" | "quy" | "dung";
export type ExerciseId = "tap_dong_tien" | "bai_1" | "bai_2" | "bai_3";

export interface TargetInfo {
  id: TargetId;
  name: string;
  subName: string;
  posture: ShootingPosture;
  postureLabel: string;
  standardDistance: number; // mét
  distanceLabel: string;
  dimensions: {
    widthCm: number;
    heightCm: number;
    description: string;
  };
  color: string;
  bgHex: string;
  purpose: string;
  aimingPointThước3: string;
  aimingPointThướcTươngỨng: string;
  rings: {
    ring: number;
    diameterCm: number;
    points: number;
    description: string;
  }[];
  pedagogicalNotes: string;
}

export interface ExerciseInfo {
  id: ExerciseId;
  title: string;
  subtitle: string;
  posture: string;
  distance: string;
  targetUsed: string;
  ammoCount: number;
  firingMode: string;
  timeLimit: string;
  scoringCriteria: {
    grade: "Xuất sắc" | "Giỏi" | "Khá" | "Đạt" | "Không đạt";
    minScore: number;
    maxScore: number;
    badgeName: string;
    description: string;
  }[];
  procedureSteps: string[];
  safetyRules: string[];
}

export interface AimingErrorCase {
  id: string;
  name: string;
  sightCondition: string;
  impactResult: string;
  deviationDirection: { x: number; y: number }; // vector lệch trên bia (-1..1)
  explanation: string;
  correction: string;
}

// ═════════════════════ 1. HỆ THỐNG BIA CHUẨN CỦA SÚNG TIỂU LIÊN AK ═════════════════════
export const AK_TARGETS: TargetInfo[] = [
  {
    id: "dong_tien",
    name: "Bia Đồng Tiền (10m)",
    subName: "Bia kiểm tra ngắm trúng, ngắm chụm ban đầu",
    posture: "nam",
    postureLabel: "Nằm bắn có bệ tỳ",
    standardDistance: 10,
    distanceLabel: "10 mét",
    dimensions: {
      widthCm: 20,
      heightCm: 20,
      description: "Tấm bia vuông 20x20 cm màu trắng, tâm bia có vòng 10 đường kính 2,5 cm (bằng đúng đồng tiền xu)",
    },
    color: "amber",
    bgHex: "#d97706",
    purpose: "Huấn luyện căn bản cho học sinh THPT làm quen với súng, kiểm tra độ ổn định của đường ngắm cơ bản, rèn luyện kỹ thuật giữ súng thăng bằng, nín thở và bóp cò êm ái trước khi bắn đạn thật cự ly xa.",
    aimingPointThước3: "Ngắm chính giữa tâm điểm chấm đen vòng 10 (thước ngắm 1 hoặc thước ngắm tương ứng cự ly 10m).",
    aimingPointThướcTươngỨng: "Dọi đỉnh đầu ngắm chính xác vào tâm đồng tiền xu ở giữa bia.",
    rings: [
      { ring: 10, diameterCm: 2.5, points: 10, description: "Vòng đồng tiền vàng (Đường kính 2.5 cm - Tuyệt đối)" },
      { ring: 9, diameterCm: 5.0, points: 9, description: "Vòng 9 điểm (Đường kính 5 cm)" },
      { ring: 8, diameterCm: 7.5, points: 8, description: "Vòng 8 điểm (Đường kính 7.5 cm)" },
      { ring: 7, diameterCm: 10.0, points: 7, description: "Vòng 7 điểm (Đường kính 10 cm)" },
      { ring: 6, diameterCm: 15.0, points: 6, description: "Vòng 6 điểm (Đường kính 15 cm)" },
    ],
    pedagogicalNotes: "Độ ngắm chụm đạt yêu cầu khi 3 phát bắn nằm gọn trong một vòng tròn có đường kính không quá 3 cm.",
  },
  {
    id: "bia_4",
    name: "Bia Số 4 (Bia ngực thu nhỏ)",
    subName: "Bia mục tiêu cố định ban ngày có vòng tính điểm",
    posture: "nam",
    postureLabel: "Nằm bắn có bệ tỳ",
    standardDistance: 100,
    distanceLabel: "100 mét",
    dimensions: {
      widthCm: 50,
      heightCm: 50,
      description: "Hình bán thân người ngực nở, nền màu xanh lục sẫm, in các vòng tròn đồng tâm tính điểm từ 10 đến 5 bằng nét chỉ trắng",
    },
    color: "emerald",
    bgHex: "#059669",
    purpose: "Mục tiêu chuẩn quốc gia dùng cho Bài bắn số 1 của học sinh THPT, sinh viên đại học và chiến sĩ mới. Mô phỏng tên địch đang nằm bắn nấp sau ụ đất hoặc công sự.",
    aimingPointThước3: "Với Thước ngắm 3 (tầm 300m): Điểm ngắm chuẩn là CHÍNH GIỮA MÉP DƯỚI mục tiêu. Khi bắn ở 100m, đường đạn bay cao hơn đường ngắm 28cm sẽ rơi trúng chính tâm vòng 10!",
    aimingPointThướcTươngỨng: "Với Thước ngắm 1 (100m): Điểm ngắm chuẩn là CHÍNH GIỮA TÂM BIA (vòng 10).",
    rings: [
      { ring: 10, diameterCm: 10, points: 10, description: "Vòng 10 (Đường kính 10 cm - Tâm bia)" },
      { ring: 9, diameterCm: 20, points: 9, description: "Vòng 9 (Đường kính 20 cm)" },
      { ring: 8, diameterCm: 30, points: 8, description: "Vòng 8 (Đường kính 30 cm)" },
      { ring: 7, diameterCm: 40, points: 7, description: "Vòng 7 (Đường kính 40 cm)" },
      { ring: 6, diameterCm: 50, points: 6, description: "Vòng 6 (Đường kính 50 cm)" },
      { ring: 5, diameterCm: 60, points: 5, description: "Trúng diện tích ngoài mép bia (5 điểm)" },
    ],
    pedagogicalNotes: "Học sinh THPT cần ghi nhớ: Thước 3 ngắm chính giữa mép dưới bia số 4; Thước 1 ngắm chính giữa tâm vòng 10.",
  },
  {
    id: "bia_6",
    name: "Bia Số 6 (Bia người quỳ)",
    subName: "Bia mục tiêu ẩn hiện tầm trung",
    posture: "quy",
    postureLabel: "Quỳ bắn (hoặc đứng bắn có tỳ)",
    standardDistance: 150,
    distanceLabel: "150 mét",
    dimensions: {
      widthCm: 50,
      heightCm: 75,
      description: "Hình dáng chiến sĩ đối phương đang ở tư thế quỳ bắn, kích thước cao 75cm, rộng 50cm, sơn màu cỏ úa hoặc xanh rêu",
    },
    color: "blue",
    bgHex: "#2563eb",
    purpose: "Dùng cho Bài bắn số 2. Mô phỏng tên địch quỳ sau mô đất, gốc cây hoặc gờ hào ẩn hiện bắn trả quân ta.",
    aimingPointThước3: "Với thước ngắm 3 ở cự ly 150m: Điểm ngắm chuẩn là chính giữa mép dưới mục tiêu hoặc ngang thắt lưng bia.",
    aimingPointThướcTươngỨng: "Với thước ngắm tương ứng (thước 2 hoặc 3): Ngắm chính giữa thân ngực bia.",
    rings: [
      { ring: 10, diameterCm: 15, points: 10, description: "Vùng hiểm yếu ngực tim (10 điểm)" },
      { ring: 9, diameterCm: 28, points: 9, description: "Vùng thân trên (9 điểm)" },
      { ring: 8, diameterCm: 42, points: 8, description: "Vùng bụng thắt lưng (8 điểm)" },
      { ring: 7, diameterCm: 55, points: 7, description: "Vùng vai đùi (7 điểm)" },
      { ring: 6, diameterCm: 70, points: 6, description: "Vùng rìa ngoài bia quỳ (6 điểm)" },
    ],
    pedagogicalNotes: "Khi quỳ bắn, cẳng tay trái phải tỳ vững lên đầu gối chân trái tạo thành góc tam giác chịu lực vững chãi.",
  },
  {
    id: "bia_8",
    name: "Bia Số 8 (Bia người đứng / người chạy)",
    subName: "Bia mục tiêu vận động cự ly xa",
    posture: "dung",
    postureLabel: "Đứng bắn",
    standardDistance: 200,
    distanceLabel: "200 mét",
    dimensions: {
      widthCm: 50,
      heightCm: 150,
      description: "Hình dáng toàn thân người đứng hoặc chạy khom tiến công, chiều cao 1,5m, chiều rộng 0,5m",
    },
    color: "red",
    bgHex: "#dc2626",
    purpose: "Dùng cho Bài bắn số 2 và Bài bắn số 3. Mô phỏng bộ binh đối phương đang bật dậy xung phong hoặc vận động chuyển làn công sự.",
    aimingPointThước3: "Với thước ngắm 3 ở cự ly 200m: Điểm ngắm chuẩn là chính giữa rốn (thắt lưng) của mục tiêu.",
    aimingPointThướcTươngỨng: "Với thước ngắm tương ứng (thước 2 hoặc thước П): Ngắm chính giữa thân người.",
    rings: [
      { ring: 10, diameterCm: 20, points: 10, description: "Vùng ngực tim hiểm yếu (10 điểm)" },
      { ring: 9, diameterCm: 35, points: 9, description: "Vùng ngực bụng thân giữa (9 điểm)" },
      { ring: 8, diameterCm: 50, points: 8, description: "Vùng đùi bả vai (8 điểm)" },
      { ring: 7, diameterCm: 90, points: 7, description: "Vùng chân cẳng và cánh tay (7 điểm)" },
      { ring: 6, diameterCm: 130, points: 6, description: "Rìa thân người vận động (6 điểm)" },
    ],
    pedagogicalNotes: "Đứng bắn là tư thế khó nhất do trọng tâm cao và không có bệ tỳ, đòi hỏi hai chân mở rộng bằng vai, ghìm chắc súng vào hõm vai.",
  },
];

// ═════════════════════ 2. BẢNG CÁC BÀI BẮN CHÍNH QUY SÚNG TIỂU LIÊN AK ═════════════════════
export const AK_EXERCISES: ExerciseInfo[] = [
  {
    id: "tap_dong_tien",
    title: "Bài Tập: Bắn Bia Đồng Tiền Cự Ly 10m",
    subtitle: "Rèn luyện đường ngắm cơ bản & độ chụm bắn cho học sinh THPT",
    posture: "Nằm bắn có bệ tỳ (hoặc ngồi bàn ngắm)",
    distance: "10 mét",
    targetUsed: "Bia Đồng Tiền (Vòng 10 đường kính 2.5cm)",
    ammoCount: 5,
    firingMode: "Bắn phát một",
    timeLimit: "Không khống chế thời gian (hoặc 3 phút)",
    scoringCriteria: [
      { grade: "Xuất sắc", minScore: 48, maxScore: 50, badgeName: "Xạ Thủ Đồng Tiền Vàng", description: "Độ chụm hoàn hảo, cả 5 phát găm trúng vòng 10 đồng xu" },
      { grade: "Giỏi", minScore: 45, maxScore: 47, badgeName: "Tay Súng Cừ Khôi", description: "Các lỗ đạn chụm đều bán kính dưới 3cm quanh tâm bia" },
      { grade: "Khá", minScore: 40, maxScore: 44, badgeName: "Xạ Thủ Khá", description: "Đường ngắm chuẩn xác, giữ súng thăng bằng tốt" },
      { grade: "Đạt", minScore: 30, maxScore: 39, badgeName: "Đạt Yêu Cầu", description: "Trúng vào các vòng điểm từ 6 đến 8" },
      { grade: "Không đạt", minScore: 0, maxScore: 29, badgeName: "Cần Rèn Luyện Thêm", description: "Đạn lệch ra ngoài, ngắm sai đường ngắm cơ bản" },
    ],
    procedureSteps: [
      "1. Lấy đường ngắm cơ bản: Gióng mắt qua chính giữa mép trên khe ngắm đến đỉnh đầu ngắm.",
      "2. Gióng đường ngắm đúng: Đưa đỉnh đầu ngắm đặt chính tâm vòng tròn đồng tiền xu.",
      "3. Giữ mặt súng thăng bằng tuyệt đối, không nghiêng sang trái hoặc sang phải.",
      "4. Tỳ chắc báng súng vào hõm vai, nín thở tự nhiên ở cuối thì thở ra.",
      "5. Dùng đốt thứ nhất ngón trỏ tay phải bóp cò êm, đều, thẳng trục nòng súng về phía sau.",
    ],
    safetyRules: [
      "Chỉ được hướng nòng súng vào bia theo khẩu lệnh người chỉ huy.",
      "Tuyệt đối không đùa nghịch, hướng nòng súng vào người khác dù không có đạn.",
      "Khi nghe khẩu lệnh 'Thôi bắn' phải ngừng ngay, khóa an toàn và khám súng.",
    ],
  },
  {
    id: "bai_1",
    title: "Bài Bắn Số 1: Bắn Mục Tiêu Cố Định Ban Ngày",
    subtitle: "Bài bắn tiêu chuẩn kỳ thi GDQP-AN THPT & Chiến sĩ mới",
    posture: "Nằm bắn có bệ tỳ",
    distance: "100 mét",
    targetUsed: "Bia số 4 (Bia ngực thu nhỏ có vòng tròn tính điểm)",
    ammoCount: 3,
    firingMode: "Bắn phát một (3 viên)",
    timeLimit: "5 phút (từ khi vào tuyến bắn đến khi bắn xong)",
    scoringCriteria: [
      { grade: "Giỏi", minScore: 25, maxScore: 30, badgeName: "Xạ Thủ Giỏi Bài 1", description: "Đạt từ 25 đến 30 điểm (trung bình >= 8.3 điểm/viên)" },
      { grade: "Khá", minScore: 20, maxScore: 24, badgeName: "Xạ Thủ Khá Bài 1", description: "Đạt từ 20 đến 24 điểm" },
      { grade: "Đạt", minScore: 15, maxScore: 19, badgeName: "Đạt Chuẩn Bài 1", description: "Đạt từ 15 đến 19 điểm (trung bình >= 5 điểm/viên)" },
      { grade: "Không đạt", minScore: 0, maxScore: 14, badgeName: "Chưa Đạt", description: "Dưới 15 điểm hoặc có viên bắn trượt ra ngoài bia" },
    ],
    procedureSteps: [
      "Bước 1: Nghe khẩu lệnh 'Tiến vào tuyến bắn' -> Mang súng vận động vào vị trí bệ tỳ.",
      "Bước 2: Nằm xuống, đặt súng lên bệ tỳ, nạp đạn vào súng (hộp tiếp đạn 3 viên).",
      "Bước 3: Lấy thước ngắm 3 (ngắm mép dưới) hoặc thước ngắm 1 (ngắm tâm vòng 10).",
      "Bước 4: Lấy đường ngắm cơ bản -> Đưa đường ngắm vào điểm ngắm trên bia.",
      "Bước 5: Nín thở, tăng dần lực bóp cò cho đến khi súng phát hỏa (bắn lần lượt 3 viên).",
      "Bước 6: Bắn xong khám súng, gạt cần định cách bắn về KHÓA AN TOÀN và báo cáo.",
    ],
    safetyRules: [
      "Khám súng cẩn thận trước và sau khi bắn.",
      "Chỉ lắp hộp tiếp đạn và lên đạn khi có lệnh của chỉ huy bắn.",
      "Nếu súng hóc đạn, giữ nguyên mũi súng hướng vào bia và giơ tay báo cáo giáo viên.",
    ],
  },
  {
    id: "bai_2",
    title: "Bài Bắn Số 2: Quỳ Bắn Mục Tiêu Ẩn Hiện (Bia Số 6 - 150m)",
    subtitle: "Bài bắn mục tiêu ẩn hiện cự ly trung bình 150m",
    posture: "Quỳ bắn (hoặc phối hợp)",
    distance: "150 mét",
    targetUsed: "Bia số 6 (Người quỳ 150m)",
    ammoCount: 5,
    firingMode: "Bắn phát một và bắn điểm xạ (2-3 viên)",
    timeLimit: "Theo thời gian ẩn hiện của từng bia (15 - 30 giây/mục tiêu)",
    scoringCriteria: [
      { grade: "Giỏi", minScore: 45, maxScore: 50, badgeName: "Tay Súng Thiện Xạ", description: "Bắn trúng vòng hiểm yếu của mục tiêu cự ly 150m" },
      { grade: "Khá", minScore: 38, maxScore: 44, badgeName: "Xạ Thủ Khá", description: "Bắn trúng thân người quỳ" },
      { grade: "Đạt", minScore: 30, maxScore: 37, badgeName: "Đạt Yêu Cầu Tác Chiến", description: "Trúng mép ngoài mục tiêu" },
      { grade: "Không đạt", minScore: 0, maxScore: 29, badgeName: "Chưa Đạt Yêu Cầu", description: "Bắn trượt do chưa tính đúng độ rơi đạn ở 150m" },
    ],
    procedureSteps: [
      "Bước 1: Lấy tư thế quỳ bắn vững chắc, cẳng tay trái tỳ lên đầu gối chân trái.",
      "Bước 2: Sử dụng thước ngắm tương ứng (Thước 3 ngắm chính giữa mép dưới bia số 6).",
      "Bước 3: Gióng đường ngắm chuẩn xác, nín thở và bóp cò êm ái.",
    ],
    safetyRules: [
      "Chuyển tư thế bắn phải ghìm chặt nòng súng hướng về phía mục tiêu, ngón tay rút khỏi cò súng.",
    ],
  },
  {
    id: "bai_3",
    title: "Bài Bắn Số 3: Đứng Bắn Mục Tiêu Cự Ly 200m (Bia Số 8)",
    subtitle: "Bắn mục tiêu người đứng / người chạy vận động cự ly xa 200m",
    posture: "Đứng bắn (hoặc quỳ bắn)",
    distance: "200 mét",
    targetUsed: "Bia số 8 (Người đứng/chạy 200m)",
    ammoCount: 6,
    firingMode: "Bắn phát một",
    timeLimit: "Theo thời gian xuất hiện của mục tiêu",
    scoringCriteria: [
      { grade: "Giỏi", minScore: 50, maxScore: 60, badgeName: "Thiện Xạ Cự Ly Xa", description: "Khóa chặt mục tiêu 200m, đạn găm chính xác vào vòng ngực tim" },
      { grade: "Khá", minScore: 40, maxScore: 49, badgeName: "Chiến Sĩ Tinh Nhuệ", description: "Tiêu diệt mục tiêu hiệu quả ở cự ly 200m" },
      { grade: "Đạt", minScore: 30, maxScore: 39, badgeName: "Đạt Chuẩn Cự Ly Xa", description: "Bắn trúng mục tiêu" },
      { grade: "Không đạt", minScore: 0, maxScore: 29, badgeName: "Chưa Đạt", description: "Bắn trượt do súng rung hoặc sai điểm ngắm ở cự ly 200m" },
    ],
    procedureSteps: [
      "1. Quan sát phán đoán vị trí chớp lửa nòng súng của địch trong đêm.",
      "2. Dùng vạch dạ quang trên đầu ngắm và thước ngắm súng AK.",
      "3. Lấy đường ngắm đón dưới chân ánh sáng chớp nháy.",
      "4. Bóp cò dứt khoát tiêu diệt hỏa điểm.",
    ],
    safetyRules: [
      "Tuyệt đối tuân thủ kỷ luật ánh sáng và tiếng động trên thao trường đêm.",
    ],
  },
];

// ═════════════════════ 3. QUY TẮC & PHÂN TÍCH SAI SỐ ĐƯỜNG NGẮM GDQP-AN ═════════════════════
export const AIMING_ERROR_CASES: AimingErrorCase[] = [
  {
    id: "chuan",
    name: "Đường Ngắm Chuẩn (Đúng Tuyệt Đối)",
    sightCondition: "Đỉnh đầu ngắm ngang bằng mép trên khe ngắm, nằm chính giữa khe ngắm, gióng đúng vào tâm điểm ngắm.",
    impactResult: "Đạn trúng chính xác vào vòng 10 (tâm bia).",
    deviationDirection: { x: 0, y: 0 },
    explanation: "Đường ngắm cơ bản đúng và điểm ngắm đúng kết hợp mặt súng thăng bằng, triệt tiêu mọi sai số góc lệch.",
    correction: "Duy trì ổn định nhịp thở và bóp cò êm ái.",
  },
  {
    id: "dau_ngam_cao",
    name: "Đầu Ngắm Nhô Cao Hơn Khe Ngắm",
    sightCondition: "Đỉnh đầu ngắm nhô cao hơn mép trên khe thước ngắm (nhưng vẫn nằm ở giữa).",
    impactResult: "Điểm trúng trên bia bị CAO HƠN điểm ngắm chuẩn.",
    deviationDirection: { x: 0, y: 0.65 },
    explanation: "Góc bắn thực tế bị nâng lên cao. Cứ đỉnh đầu ngắm cao hơn 1mm ở cự ly 100m, đạn sẽ bay vọt lên cao khoảng 26-28cm!",
    correction: "Hạ thấp cọc đầu ngắm sao cho đỉnh cọc vừa bằng phẳng ngang hàng với mép trên của khe thước ngắm hình chữ U.",
  },
  {
    id: "dau_ngam_thap",
    name: "Đầu Ngắm Bị Dìm Thấp Xuống",
    sightCondition: "Đỉnh đầu ngắm chìm xuống dưới mép trên khe thước ngắm.",
    impactResult: "Điểm trúng trên bia bị THẤP HƠN điểm ngắm chuẩn (thậm chí cắm đất trước bia).",
    deviationDirection: { x: 0, y: -0.65 },
    explanation: "Góc nâng nòng súng bị hạ thấp so với góc bắn tính toán.",
    correction: "Nâng nhẹ mũi súng lên sao cho đỉnh cọc đầu ngắm nhô lên vừa bằng mép trên khe thước ngắm.",
  },
  {
    id: "dau_ngam_lech_trai",
    name: "Đầu Ngắm Bị Lệch Sang Trái",
    sightCondition: "Khoảng cách từ cọc đầu ngắm đến mép trái khe ngắm hẹp hơn bên phải.",
    impactResult: "Điểm trúng trên bia bị LỆCH SANG TRÁI.",
    deviationDirection: { x: -0.65, y: 0 },
    explanation: "Trục nòng súng lệch góc sang trái so với trục ngắm của mắt.",
    correction: "Căn chỉnh sao cho khe hở ánh sáng ở hai bên cọc đầu ngắm cân bằng đều nhau.",
  },
  {
    id: "dau_ngam_lech_phai",
    name: "Đầu Ngắm Bị Lệch Sang Phải",
    sightCondition: "Khoảng cách từ cọc đầu ngắm đến mép phải khe ngắm hẹp hơn bên trái.",
    impactResult: "Điểm trúng trên bia bị LỆCH SANG PHẢI.",
    deviationDirection: { x: 0.65, y: 0 },
    explanation: "Trục nòng súng lệch góc sang phải.",
    correction: "Giữ mắt nhìn thẳng, điều chỉnh đầu ngắm vào chính giữa tâm khe chữ U.",
  },
  {
    id: "nghieng_sung_trai",
    name: "Mặt Súng Bị Nghiêng Sang Trái",
    sightCondition: "Đường ngắm cơ bản đúng nhưng súng bị nghiêng trục sang bên trái.",
    impactResult: "Điểm trúng bị LỆCH SANG TRÁI VÀ THẤP XUỐNG.",
    deviationDirection: { x: -0.55, y: -0.45 },
    explanation: "Khi nghiêng súng, lực giật và góc nâng nòng súng bị phân rã, làm đường đạn vừa lệch theo chiều nghiêng vừa bị sụt giảm độ cao.",
    correction: "Luôn giữ mặt súng thăng bằng vuông góc với mặt đất, ốp chặt báng súng vào hõm vai.",
  },
];
