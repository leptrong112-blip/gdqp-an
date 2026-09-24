// ════════════════════════════════════════════════════════════════════════════════
// DỮ LIỆU CẤU TẠO 11 BỘ PHẬN CHÍNH & QUY TRÌNH THÁO LẮP SÚNG TIỂU LIÊN AK-47
// Chuẩn chương trình Giáo dục Quốc phòng & An ninh THPT (Bộ GD&ĐT)
// ════════════════════════════════════════════════════════════════════════════════

export interface AKPartDetail {
  id: string;
  name: string;
  groupNumber: number; // 1 -> 11 (11 bộ phận chính) hoặc 0 (phụ tùng)
  groupName: string;
  emoji: string;
  meshPrefix: string;
  location: string;
  purpose: string;
  structure: string;
  learningTips: string;
}

export interface AKStep {
  step: number;
  title: string;
  partName: string;
  meshPrefix: string;
  actionDescription: string;
  keyPoints: string;
  targetTime: number; // Giây tương ứng trong tệp 3D
}

// ── 1. DANH SÁCH 11 BỘ PHẬN CHÍNH (SGK GDQP-AN) ─────────────────────────────
export const AK_MAIN_GROUPS = [
  { id: 1,  name: "1. Nòng súng",                          emoji: "▬",  partCount: 1 },
  { id: 2,  name: "2. Bộ phận ngắm",                       emoji: "🎯", partCount: 2 },
  { id: 3,  name: "3. Hộp khóa nòng & Nắp hộp khóa nòng", emoji: "🪬", partCount: 2 },
  { id: 4,  name: "4. Bệ khóa nòng & Thoi đẩy",            emoji: "⚙️", partCount: 2 },
  { id: 5,  name: "5. Khóa nòng",                          emoji: "🔩", partCount: 1 },
  { id: 6,  name: "6. Bộ phận cò",                         emoji: "🔫", partCount: 1 },
  { id: 7,  name: "7. Bộ phận đẩy về",                     emoji: "🔁", partCount: 1 },
  { id: 8,  name: "8. Ống dẫn thoi & Ốp lót tay",          emoji: "🔧", partCount: 2 },
  { id: 9,  name: "9. Báng súng & Tay cầm",                emoji: "🪵", partCount: 2 },
  { id: 10, name: "10. Hộp tiếp đạn",                      emoji: "🔲", partCount: 1 },
  { id: 11, name: "11. Lê (Lưỡi lê)",                      emoji: "🗡️", partCount: 1 },
  { id: 0,  name: "Phụ tùng: Thông nòng súng",             emoji: "📏", partCount: 1 },
];

// ── 2. CẤU TẠO CHI TIẾT TỪNG BỘ PHẬN RIÊNG BIỆT (KHÔNG GỘP CHUNG) ────────────
export const AK_STRUCTURE_PARTS: AKPartDetail[] = [
  // ── NHÓM 1: NÒNG SÚNG ──
  {
    id: "barrel",
    name: "Nòng súng",
    groupNumber: 1,
    groupName: "1. Nòng súng",
    emoji: "▬",
    meshPrefix: "dulo_low",
    location: "Phía trước thân súng, nối liền với hộp khóa nòng",
    purpose: "Định hướng bay cho đầu đạn. Làm cho đầu đạn vừa bay vừa tự xoay quanh trục với vận tốc cực lớn để giữ ổn định hướng bay và tăng tầm bắn hiệu quả.",
    structure: "Làm bằng thép đặc chủng chịu nhiệt và áp lực cao. Gồm: Buồng đạn (chứa viên đạn trước khi bắn); Lòng nòng có 4 rãnh xoắn (khương tuyến) lượn từ trái sang phải; Đầu nòng có ren lắp ống giảm nảy hoặc nắp bảo vệ ren; Khâu truyền khí thuốc trích khí thuốc súng sang thoi đẩy; Mấu gắn lưỡi lê và rãnh giữ thông nòng súng.",
    learningTips: "Ghi nhớ: Nòng súng AK-47 có 4 rãnh xoắn lượn từ TRÁI sang PHẢI, đường kính trong đo giữa hai khương tuyến đối diện là 7,62 mm.",
  },

  // ── NHÓM 2: BỘ PHẬN NGẮM ──
  {
    id: "sight_front",
    name: "Đầu ngắm cơ khí",
    groupNumber: 2,
    groupName: "2. Bộ phận ngắm",
    emoji: "📍",
    meshPrefix: "pricel_low",
    location: "Cố định ở đỉnh đầu nòng súng",
    purpose: "Kết hợp với khe ngắm trên thước ngắm để tạo thành đường ngắm cơ bản ngắm chính xác vào mục tiêu.",
    structure: "Gồm: Thân đầu ngắm đúc liền với khâu nòng; Cọc đầu ngắm hình trụ có ren vặn lên xuống (hiệu chỉnh độ cao/thấp) hoặc xê dịch ngang (hiệu chỉnh dạt trái/phải); Vành bảo vệ đầu ngắm hình vòng cung che chắn cọc ngắm tránh va đập méo mó trong chiến đấu.",
    learningTips: "Khi bắn bị cao thì vặn cọc đầu ngắm LÊN, bắn bị thấp thì vặn cọc đầu ngắm XUỐNG.",
  },
  {
    id: "sight_rear",
    name: "Thước ngắm cơ khí",
    groupNumber: 2,
    groupName: "2. Bộ phận ngắm",
    emoji: "🎯",
    meshPrefix: "dop1_low",
    location: "Nằm phía trên bệ thước ngắm, trước hộp khóa nòng",
    purpose: "Điều chỉnh góc ngắm tương ứng với cự ly thực tế của mục tiêu (từ 100m đến 1000m).",
    structure: "Gồm: Bệ thước ngắm cố định; Thân thước ngắm có khắc vạch số từ 1 đến 10 (tương ứng cự ly 100m - 1000m) và vạch chữ 'П' (tầm bắn thẳng, tương ứng thước ngắm 3); Cữ thước ngắm có lẫy hãm để cài cố định góc thước ngắm; Khe ngắm hình chữ U ở đuôi thước ngắm.",
    learningTips: "Chữ 'П' là viết tắt của 'Постоянный' (tiếng Nga: Cố định / Bắn thẳng), dùng cho mục tiêu cao 0,5m (người nằm bắn) trong cự ly đến 350m.",
  },

  // ── NHÓM 3: HỘP KHÓA NÒNG VÀ NẮP HỘP KHÓA NÒNG ──
  {
    id: "receiver_box",
    name: "Hộp khóa nòng",
    groupNumber: 3,
    groupName: "3. Hộp khóa nòng & Nắp hộp khóa nòng",
    emoji: "🪬",
    meshPrefix: "3_low",
    location: "Bộ phận khung xương trung tâm của súng",
    purpose: "Liên kết tất cả các bộ phận của súng lại với nhau và làm rãnh dẫn hướng cho bệ khóa nòng và khóa nòng chuyển động mượt mà.",
    structure: "Thép tôi dập hoặc phay nguyên khối có độ cứng cao. Gồm: Rãnh trượt dẫn hướng hai bên cho bệ khóa nòng; Mấu đỡ khóa nòng; Cửa sổ tiếp đạn và rãnh chứa hộp tiếp đạn; Mấu hất vỏ đạn cố định bên trái; Các lỗ xuyên trục để lắp cụm bộ phận cò và chốt an toàn.",
    learningTips: "Hộp khóa nòng là 'xương sống' của khẩu súng AK, chứa toàn bộ cụm chuyển động tự động hóa học.",
  },
  {
    id: "cover",
    name: "Nắp hộp khóa nòng",
    groupNumber: 3,
    groupName: "3. Hộp khóa nòng & Nắp hộp khóa nòng",
    emoji: "🛡️",
    meshPrefix: "crishk_low",
    location: "Đậy kín phần trên của hộp khóa nòng",
    purpose: "Bảo vệ các bộ phận chuyển động tinh vi bên trong hộp khóa nòng khỏi đất cát, bùn nước và bụi bẩn trong mọi điều kiện thời tiết dã chiến.",
    structure: "Làm bằng thép mỏng dập gân tăng cứng. Đầu trước có gờ ăn khớp vào bệ thước ngắm; đầu sau khoét lỗ hình chữ nhật để mấu giữ của bộ phận đẩy về lọt qua và khóa chặt nắp vào thân súng.",
    learningTips: "Khi tháo nắp hộp khóa nòng: dùng ngón tay cái ấn mạnh mấu giữ của bộ phận đẩy về lọt vào trong, nhấc đuôi nắp lên kéo lùi ra sau.",
  },

  // ── NHÓM 4: BỆ KHÓA NÒNG VÀ THOI ĐẨY ──
  {
    id: "bolt_carrier",
    name: "Bệ khóa nòng",
    groupNumber: 4,
    groupName: "4. Bệ khóa nòng & Thoi đẩy",
    emoji: "⚙️",
    meshPrefix: "spusk_low",
    location: "Nằm bên trong hộp khóa nòng, trượt trên hai rãnh dẫn hướng",
    purpose: "Mang khóa nòng chuyển động lùi/tiến; nhận lực đẩy của khí thuốc để xoay mở khóa nòng, hất vỏ đạn ra ngoài, nén lò xo đẩy về và giương búa lên chuẩn bị bắn phát tiếp theo.",
    structure: "Khối thép đúc tôi cứng có rãnh xoắn đóng/mở tai khóa nòng; rãnh dẫn hướng hai bên sườn; tay kéo bệ khóa nòng bên phải để lên đạn thủ công; lỗ chứa đuôi khóa nòng và lỗ tiếp xúc với lò xo đẩy về.",
    learningTips: "Bệ khóa nòng là bộ phận nặng nhất trong các chi tiết chuyển động, khối lượng lớn giúp súng hoạt động bền bỉ kể cả khi dính bùn đất.",
  },
  {
    id: "piston",
    name: "Thoi đẩy (Piston khí)",
    groupNumber: 4,
    groupName: "4. Bệ khóa nòng & Thoi đẩy",
    emoji: "🔩",
    meshPrefix: "spusk_low",
    location: "Gắn cố định vào đầu trước bệ khóa nòng, luồn trong ống dẫn thoi",
    purpose: "Tiếp nhận trực tiếp áp lực của luồng khí thuốc súng trích từ nòng súng truyền tới để đẩy toàn bộ cụm bệ khóa nòng lùi về sau.",
    structure: "Thanh thép hình trụ mạ bóng gắn ren cố định vào bệ khóa nòng; đầu thoi có các rãnh tròn khía cản khí thuốc xì ngược ra ngoài.",
    learningTips: "Cơ chế trích khí thuốc phản lực tác động vào thoi đẩy là nguyên lý tự động nạp đạn trứ danh của súng AK.",
  },

  // ── NHÓM 5: KHÓA NÒNG ──
  {
    id: "bolt",
    name: "Khóa nòng",
    groupNumber: 5,
    groupName: "5. Khóa nòng",
    emoji: "🔐",
    meshPrefix: "vtulk_low",
    location: "Lắp bên trong ổ trượt của bệ khóa nòng",
    purpose: "Đẩy viên đạn vào buồng đạn, xoay đóng kín buồng đạn khi bắn; kim hỏa chọc thủng hạt lửa kích nổ viên đạn; móc đạn kéo vỏ đạn ra khỏi buồng đạn sau khi bắn.",
    structure: "Thân hình trụ có 2 tai khóa ăn khớp vào vấu đỡ hộp khóa nòng; mấu dẫn hướng xoay theo rãnh xoắn bệ khóa nòng; lỗ xuyên tâm chứa kim hỏa; móc đạn, lò xo móc đạn và chốt móc đạn ở mặt trước gương khóa nòng.",
    learningTips: "Khóa nòng quay để đóng/mở buồng đạn. Khi tai khóa ăn khớp với vấu hộp khóa nòng, súng mới đủ điều kiện an toàn để phát hỏa.",
  },

  // ── NHÓM 6: BỘ PHẬN CÒ ──
  {
    id: "trigger",
    name: "Bộ phận cò (Bộ phận phát hỏa)",
    groupNumber: 6,
    groupName: "6. Bộ phận cò",
    emoji: "🔫",
    meshPrefix: "d4_low",
    location: "Nằm dưới hộp khóa nòng, phía trước tay cầm",
    purpose: "Giữ búa ở thế giương; giải phóng búa khi bóp cò để đập vào kim hỏa phát hỏa; cho phép bắn phát một, bắn liên thanh và khóa an toàn.",
    structure: "Gồm: Tay bóp cò và lò xo cò; Búa đập và lò xo búa; Lẫy phát một và lẫy liên thanh; Vành bảo vệ cò; Cần định cách bắn kiêm khóa an toàn bên phải thân súng (3 nấc: Khóa an toàn [trên], Bắn liên thanh [giữa], Bắn phát một [dưới]).",
    learningTips: "Thứ tự 3 nấc cần định cách bắn từ trên xuống: 1. Khóa an toàn -> 2. Bắn liên thanh (AV) -> 3. Bắn phát một (OD).",
  },

  // ── NHÓM 7: BỘ PHẬN ĐẨY VỀ ──
  {
    id: "return_spring",
    name: "Bộ phận đẩy về",
    groupNumber: 7,
    groupName: "7. Bộ phận đẩy về",
    emoji: "🔁",
    meshPrefix: "2_low",
    location: "Luồn dọc phía trên hộp khóa nòng, đuôi tỳ vào rãnh đuôi hộp khóa nòng",
    purpose: "Luôn tạo lực đẩy bệ khóa nòng và khóa nòng về phía trước sau khi chu kỳ lùi kết thúc; đồng thời giữ nắp hộp khóa nòng cố định không bị bung ra.",
    structure: "Lò xo đẩy về dạng xoắn bằng thép đàn hồi cao; Cốt dẫn hướng (trục đẩy về) gồm 2 đoạn ống thép lồng vào nhau; Chân đế đẩy về có rãnh trượt cài vào hộp khóa nòng và mấu giữ nhô ra sau cài vào nắp hộp khóa nòng.",
    learningTips: "Không bao giờ để lò xo đẩy về bị gập, méo hoặc biến dạng vì sẽ khiến súng bị kẹt đạn khi chuyển động về trước.",
  },

  // ── NHÓM 8: ỐNG DẪN THOI VÀ ỐP LÓT TAY ──
  {
    id: "gas_tube",
    name: "Ống dẫn thoi",
    groupNumber: 8,
    groupName: "8. Ống dẫn thoi & Ốp lót tay",
    emoji: "🔧",
    meshPrefix: "pd3_low",
    location: "Nằm trên nòng súng, nối khâu truyền khí với bệ thước ngắm",
    purpose: "Định hướng cho thoi đẩy (piston khí) chuyển động thẳng hàng tịnh tiến; có các lỗ thoát khí thừa giúp giảm áp sau chu kỳ đẩy.",
    structure: "Ống thép hình trụ tôi cứng; đầu trước loe ôm khâu truyền khí thuốc; đầu sau có vành khâu khóa cài vào bệ thước ngắm và cố định bằng chốt hãm xoay 90°.",
    learningTips: "Khi tháo: dùng đầu ngón tay hoặc phụ tùng xoay chốt khóa góc 90° lên trên, nhấc đuôi ống dẫn thoi lên và rút ra.",
  },
  {
    id: "handguard",
    name: "Ốp lót tay (trên và dưới)",
    groupNumber: 8,
    groupName: "8. Ống dẫn thoi & Ốp lót tay",
    emoji: "🪵",
    meshPrefix: "prik_low",
    location: "Bọc quanh nòng súng và ống dẫn thoi",
    purpose: "Giúp người bắn cầm nắm súng chắc chắn, giữ hướng bắn ổn định và bảo vệ bàn tay không bị nhiệt độ nòng súng nung nóng làm bỏng khi bắn liên thanh kéo dài.",
    structure: "Làm bằng gỗ dán ép tẩm sấy đặc biệt (hoặc nhựa composite chống cháy). Ốp trên gắn bọc ngoài ống dẫn thoi; Ốp dưới bọc nòng súng phía trước hộp khóa nòng, có rãnh khía lõm ôm vừa các ngón tay.",
    learningTips: "Ốp lót tay dưới là nơi bàn tay không thuận (thường là tay trái) tỳ nắm để ghìm súng chống nảy khi bắn liên thanh.",
  },

  // ── NHÓM 9: BÁNG SÚNG VÀ TAY CẦM ──
  {
    id: "stock",
    name: "Báng súng",
    groupNumber: 9,
    groupName: "9. Báng súng & Tay cầm",
    emoji: "🪵",
    meshPrefix: "prikl_low",
    location: "Gắn cố định vào phía sau hộp khóa nòng",
    purpose: "Tỳ chắc vào hõm vai người bắn để giữ súng ổn định khi ngắm bắn và triệt tiêu truyền lực giật vào vai người bắn.",
    structure: "Làm bằng gỗ phong/bạch dương tẩm dầu sấy ép (hoặc kim loại gập ở biến thể AKS); đuôi báng có đế sắt tỳ vai dập vân chống trượt; trong đế có ổ khoét chứa hộp phụ tùng bảo dưỡng với nắp đậy có lò xo.",
    learningTips: "Báng súng phải được tỳ chắc và sát vào hõm vai phải, tạo thành thế điểm tựa 3 điểm vững chắc khi ngắm bắn.",
  },
  {
    id: "grip",
    name: "Tay cầm (Tay cầm cò)",
    groupNumber: 9,
    groupName: "9. Báng súng & Tay cầm",
    emoji: "✋",
    meshPrefix: "ruch_low",
    location: "Gắn dưới hộp khóa nòng, phía sau vành cò",
    purpose: "Để bàn tay thuận (tay phải) nắm giữ súng chắc chắn, tạo điểm tỳ cơ động để ngón trỏ bóp cò êm ái và chính xác.",
    structure: "Thiết kế dáng tay cầm súng ngắn công thái học bằng gỗ tẩm hoặc nhựa bakelite có vân gân chống trượt mồ hôi; liên kết chặt chẽ với hộp khóa nòng qua vít xuyên tâm dài.",
    learningTips: "Nắm tay cầm chắc nhưng mềm mại, chỉ dùng đốt thứ nhất của ngón trỏ để đặt vào tay bóp cò.",
  },

  // ── NHÓM 10: HỘP TIẾP ĐẠN ──
  {
    id: "mag",
    name: "Hộp tiếp đạn (Băng đạn)",
    groupNumber: 10,
    groupName: "10. Hộp tiếp đạn",
    emoji: "🔲",
    meshPrefix: "mag_low",
    location: "Cài vào cửa tiếp đạn phía dưới hộp khóa nòng",
    purpose: "Chứa đạn và tự động đẩy từng viên đạn lên cửa sổ tiếp đạn để bệ khóa nòng đẩy vào buồng đạn. Sức chứa chuẩn 30 viên đạn cỡ 7,62mm x 39mm.",
    structure: "Thân hộp tiếp đạn cong hình cánh cung bằng thép dập có gân tăng cứng (hoặc nhựa bakelite cam); nắp đáy và tấm lót đáy; lò xo tiếp đạn bằng thép dẹp đàn hồi cao; bàn nâng đạn có mấu giữ đạn so le hai hàng.",
    learningTips: "Khi tháo lắp súng, động tác đầu tiên LUÔN LUÔN là tháo hộp tiếp đạn và khám súng kiểm tra buồng đạn.",
  },

  // ── NHÓM 11: LÊ (LƯỠI LÊ) ──
  {
    id: "bayonet",
    name: "Lê (Lưỡi lê)",
    groupNumber: 11,
    groupName: "11. Lê (Lưỡi lê)",
    emoji: "🗡️",
    meshPrefix: "knife_low",
    location: "Gắn vào mấu đỡ dưới đầu nòng súng",
    purpose: "Dùng để đánh gần, cận chiến giáp lá cà; hoặc tháo rời dùng như một dao găm chiến thuật dã chiến; kết hợp với bao lê cách điện để cắt dây thép gai.",
    structure: "Lưỡi lê bằng thép tôi cứng sắc bén, một bên lưỡi có sống răng cưa cưa gỗ hoặc nhôm máy bay; cán lê có rãnh và chốt hãm bấm khóa vào đầu nòng súng; lỗ ô-van trên lưỡi gài vào mấu của bao lê tạo thành kìm cắt dây thép gai.",
    learningTips: "Lưỡi lê AK-47 là vũ khí đa năng, vừa đâm giáp lá cà, vừa làm dao găm dã ngoại, vừa làm kìm cắt dây thép gai cách điện.",
  },

  // ── PHỤ TÙNG: THÔNG NÒNG SÚNG ──
  {
    id: "rod",
    name: "Thông nòng súng",
    groupNumber: 0,
    groupName: "Phụ tùng: Thông nòng súng",
    emoji: "📏",
    meshPrefix: "shompol_low",
    location: "Nằm luồn dọc dưới nòng súng",
    purpose: "Dùng kết hợp với giẻ lau, bàn chải và dầu mỡ quân sự để vệ sinh, lau chùi sạch muội thuốc súng bên trong lòng nòng và các chi tiết sau khi bắn.",
    structure: "Thanh thép tròn dài có ren ở đầu để vặn bàn chải cọ lòng nòng hoặc đầu luồn giẻ lau; chuôi thông nòng có lỗ để xuyên chốt quay thông nòng.",
    learningTips: "Tháo thông nòng sau khi đã tháo hộp tiếp đạn. Thao tác nhẹ nhàng tránh làm cong thanh thông nòng.",
  },
];

// ── 3. QUY TRÌNH THÁO SÚNG AK-47 (6 BƯỚC CHUẨN QUÂN ĐỘI) ───────────────────
export const AK_STEPS_THAO: AKStep[] = [
  {
    step: 1,
    title: "Bước 1: Tháo hộp tiếp đạn và khám súng",
    partName: "Hộp tiếp đạn",
    meshPrefix: "mag_low",
    actionDescription: "Tay phải nắm cổ tròn báng súng hoặc ốp lót tay, nòng súng hướng lên 45° vào nơi an toàn. Tay trái nắm hộp tiếp đạn, ngón tay cái ấn lẫy giữ hộp tiếp đạn về phía trước, đẩy hộp tiếp đạn xuống dưới và ra phía trước lấy ra. Sau đó kéo bệ khóa nòng về sau hết cỡ để kiểm tra buồng đạn, thả bệ khóa nòng về trước và bóp cò.",
    keyPoints: "Quy tắc an toàn sinh tử: Tuyệt đối không chĩa nòng súng vào người. Luôn kiểm tra buồng đạn trước khi tháo các bộ phận tiếp theo.",
    targetTime: 3.50,
  },
  {
    step: 2,
    title: "Bước 2: Tháo thông nòng súng (và lưỡi lê)",
    partName: "Thông nòng & Lưỡi lê",
    meshPrefix: "shompol_low",
    actionDescription: "Nếu có gắn lưỡi lê, ấn chốt lê lấy lê ra trước. Tiếp tục dùng ngón tay kéo đầu thông nòng sang phải cho bật khỏi ngàm giữ dưới đầu nòng súng, sau đó rút thẳng thông nòng dọc theo nòng súng ra phía trước.",
    keyPoints: "Thao tác thẳng tay, nhẹ nhàng, không bẻ ngang làm cong thanh thông nòng.",
    targetTime: 5.83,
  },
  {
    step: 3,
    title: "Bước 3: Tháo nắp hộp khóa nòng",
    partName: "Nắp hộp khóa nòng",
    meshPrefix: "crishk_low",
    actionDescription: "Tay trái nắm cổ báng súng, ngón tay cái ấn mạnh mấu giữ của bộ phận đẩy về lọt vào trong lỗ nắp hộp khóa nòng. Tay phải nắm đuôi nắp hộp khóa nòng nhấc lên trên và kéo lùi ra phía sau lấy nắp ra.",
    keyPoints: "Ấn dứt khoát mấu giữ lọt hẳn vào trong trước khi nhấc nắp lên.",
    targetTime: 9.17,
  },
  {
    step: 4,
    title: "Bước 4: Tháo bộ phận đẩy về",
    partName: "Bộ phận đẩy về",
    meshPrefix: "2_low",
    actionDescription: "Tay phải nắm chân đế bộ phận đẩy về, đẩy nhẹ về phía trước cho chân đế trượt ra khỏi rãnh đuôi hộp khóa nòng, sau đó nâng chân đế lên trên và kéo lùi toàn bộ bộ phận đẩy về ra ngoài.",
    keyPoints: "Giữ chắc tay vì lò xo đẩy về có lực nén đàn hồi, tránh buông tay đột ngột.",
    targetTime: 11.00,
  },
  {
    step: 5,
    title: "Bước 5: Tháo bệ khóa nòng và khóa nòng",
    partName: "Bệ khóa nòng & Khóa nòng",
    meshPrefix: "spusk_low",
    actionDescription: "Tay phải nắm bệ khóa nòng, kéo bệ khóa nòng về phía sau hết hành trình, nhấc đuôi bệ khóa nòng lên trên và rút thoi đẩy ra khỏi ống dẫn thoi lấy ra ngoài. Sau đó cầm bệ khóa nòng lật ngửa, xoay khóa nòng sang phải rồi đẩy lùi ra sau để tách rời khóa nòng khỏi bệ khóa nòng.",
    keyPoints: "Phải kéo bệ khóa nòng về hết cỡ phía sau thì hai tai trượt mới thoát khỏi rãnh hộp khóa nòng.",
    targetTime: 13.42,
  },
  {
    step: 6,
    title: "Bước 6: Tháo ống dẫn thoi và ốp lót tay trên",
    partName: "Ống dẫn thoi & Ốp lót tay",
    meshPrefix: "pd3_low",
    actionDescription: "Dùng ngón tay hoặc phụ tùng xoay chốt khóa ống dẫn thoi góc 90° lên trên (đến khi chốt thẳng đứng). Tay nắm ốp lót tay trên nhấc đuôi ống dẫn thoi lên và rút xéo ra phía sau lấy ra khỏi khâu truyền khí.",
    keyPoints: "Xoay chốt hãm đúng góc 90°, không dùng kìm búa gõ đập làm gãy chốt hãm.",
    targetTime: 15.42,
  },
];

// ── 4. QUY TRÌNH LẮP SÚNG AK-47 (6 BƯỚC NGƯỢC LẠI) ────────────────────────
export const AK_STEPS_LAP: AKStep[] = [
  {
    step: 1,
    title: "Bước 1: Lắp ống dẫn thoi và ốp lót tay trên",
    partName: "Ống dẫn thoi & Ốp lót tay",
    meshPrefix: "pd3_low",
    actionDescription: "Đưa đầu trước ống dẫn thoi vào khâu truyền khí trên nòng súng, ấn đuôi ống dẫn thoi xuống sát bệ thước ngắm, sau đó gạt chốt khóa ống dẫn thoi quay xuống dưới 90° về vị trí ban đầu.",
    keyPoints: "Kiểm tra chốt hãm đã gạt khít về vị trí khóa chặt đuôi ống dẫn thoi.",
    targetTime: 13.42,
  },
  {
    step: 2,
    title: "Bước 2: Lắp bệ khóa nòng và khóa nòng",
    partName: "Bệ khóa nòng & Khóa nòng",
    meshPrefix: "spusk_low",
    actionDescription: "Lắp khóa nòng vào rãnh xoắn bệ khóa nòng, xoay khóa nòng sang trái cho tai khóa ăn khớp. Đưa đầu thoi đẩy vào ống dẫn thoi, đặt hai tai trượt bệ khóa nòng vào rãnh sau hộp khóa nòng, ấn nhẹ xuống và đẩy bệ khóa nòng về trước hết cỡ.",
    keyPoints: "Khóa nòng phải được đẩy tiến ra phía trước hết cỡ trong bệ khóa nòng trước khi đặt vào rãnh.",
    targetTime: 11.00,
  },
  {
    step: 3,
    title: "Bước 3: Lắp bộ phận đẩy về",
    partName: "Bộ phận đẩy về",
    meshPrefix: "2_low",
    actionDescription: "Cầm chân đế bộ phận đẩy về, luồn đầu trước lò xo vào lỗ khoét đuôi thoi đẩy của bệ khóa nòng, đẩy bộ phận đẩy về tiến về trước rồi ấn chân đế khớp vào rãnh đuôi hộp khóa nòng.",
    keyPoints: "Chân đế phải lọt khít vào rãnh giữ hai bên thành hộp khóa nòng.",
    targetTime: 9.17,
  },
  {
    step: 4,
    title: "Bước 4: Lắp nắp hộp khóa nòng",
    partName: "Nắp hộp khóa nòng",
    meshPrefix: "crishk_low",
    actionDescription: "Đưa gờ trước của nắp hộp khóa nòng cài vào rãnh khuyết bệ thước ngắm. Dùng lòng bàn tay ấn mạnh đuôi nắp xuống dưới cho mấu giữ của bộ phận đẩy về bật lọt qua lỗ khóa đuôi nắp nghe tiếng 'tách'.",
    keyPoints: "Gờ trước phải vào đúng rãnh; mấu giữ phía sau phải bật lồi ra ngoài lỗ nắp hoàn toàn.",
    targetTime: 5.83,
  },
  {
    step: 5,
    title: "Bước 5: Lắp thông nòng súng (và lưỡi lê)",
    partName: "Thông nòng & Lưỡi lê",
    meshPrefix: "shompol_low",
    actionDescription: "Đưa đầu ren của thông nòng luồn qua các lỗ giữ dưới khâu truyền khí và nòng súng, ấn đầu chuôi thông nòng vào ngàm giữ dưới đầu ngắm. Lắp lại lưỡi lê vào mấu nếu có yêu cầu.",
    keyPoints: "Đẩy thông nòng vào hết chiều dài, kiểm tra đầu thông nòng đã gài chắc chắn.",
    targetTime: 3.50,
  },
  {
    step: 6,
    title: "Bước 6: Lắp hộp tiếp đạn và kiểm tra súng",
    partName: "Hộp tiếp đạn",
    meshPrefix: "mag_low",
    actionDescription: "Đưa mấu trước của hộp tiếp đạn cài vào miệng cửa tiếp đạn, kéo hộp tiếp đạn về phía sau cho lẫy giữ ngậm chặt nghe tiếng 'tách'. Sau đó kéo bệ khóa nòng về sau hết cỡ thả về trước, bóp cò hướng nòng súng lên trời kiểm tra búa đập, gạt cần định cách bắn lên vị trí KHÓA AN TOÀN.",
    keyPoints: "Bắt buộc kiểm tra bóp cò và gạt cần an toàn lên nấc trên cùng để kết thúc quy trình an toàn.",
    targetTime: 0.00,
  },
];

// ── 5. QUY TẮC AN TOÀN QUÂN ĐỘI BẮT BUỘC ──────────────────────────────────
export const AK_SAFETY_RULES = [
  { title: "Khám súng đầu tiên", desc: "Luôn tháo hộp tiếp đạn và khám súng kiểm tra buồng đạn trước khi tháo các bộ phận khác." },
  { title: "Hướng nòng an toàn", desc: "Nòng súng luôn hướng chếch lên trời 45° hoặc hướng vào nơi an toàn, tuyệt đối không chĩa vào người." },
  { title: "Thao tác đúng thứ tự", desc: "Thực hiện đúng thứ tự từ bước 1 đến bước 6. Không dùng lực cưỡng bức hoặc búa gõ đập làm biến dạng chi tiết súng." },
  { title: "Bảo quản linh kiện", desc: "Xếp các bộ phận đã tháo theo thứ tự từ phải qua trái trên bàn sạch hoặc bạt dã chiến sạch sẽ." },
];

/**
 * Ánh xạ chính xác tên node/mesh trong file 3D ak47.glb sang ID bộ phận chuẩn
 */
export function getAKPartIdFromMeshName(meshName: string): string | null {
  const n = meshName.toLowerCase();
  if (n.startsWith('mag')) return 'mag';
  if (n.startsWith('crishk')) return 'cover';
  if (n.startsWith('2_low')) return 'return_spring';
  if (n.startsWith('3_low')) return 'receiver_box';
  if (n.startsWith('spusk')) return 'bolt_carrier';
  if (n.startsWith('vtulk')) return 'bolt';
  // Nòng súng: nòng chính (dulo) và khâu truyền khí thuốc gắn trên nòng (pd2)
  if (n.startsWith('dulo') || n.startsWith('pd2')) return 'barrel';
  if (n.startsWith('pricel')) return 'sight_front';
  if (n.startsWith('dop')) return 'sight_rear';
  if (n.startsWith('prikl')) return 'stock'; // Priklad: Báng súng gỗ phía sau
  // Ốp lót tay trên: pd3_low.001_Mat2_0 (phần gỗ ốp bọc ngoài ống dẫn thoi)
  if (n.includes('pd3') && n.includes('mat2')) return 'handguard';
  // Ốp lót tay dưới: prik_low.001 (gồm ốp gỗ dưới và khâu kim loại giữ ốp)
  if (n.startsWith('prik')) return 'handguard';
  // Ống dẫn thoi: pd3 phần ống kim loại (mat1) và cụm ống dẫn khí nối tiếp (pd1)
  if (n.startsWith('pd3') || n.startsWith('pd1')) return 'gas_tube';
  if (n.startsWith('ruch')) return 'grip';
  if (n.startsWith('d4_low') || n.startsWith('per_low')) return 'trigger';
  if (n.startsWith('shompol')) return 'rod';
  if (n.startsWith('knife')) return 'bayonet';
  return null;
}

/**
 * Tìm chi tiết AKPartDetail dựa trên tên mesh 3D được click/hover
 */
export function matchMeshToPart(meshName: string): AKPartDetail | undefined {
  const partId = getAKPartIdFromMeshName(meshName);
  if (!partId) return undefined;
  return AK_STRUCTURE_PARTS.find((p) => p.id === partId);
}
