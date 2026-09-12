import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapPin,
  X,
  BookOpen,
  ChevronRight,
  Star,
  Shield,
  RefreshCw,
  Compass,
  Maximize2,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  Globe2,
  HelpCircle,
  Eye,
  Minimize2
} from "lucide-react";
import { useGamification } from "../context/GamificationContext";

export interface SiteQuiz {
  q: string;
  a: string;
}

export interface Site {
  id: number;
  name: string;
  lat: number;
  lng: number;
  category: string;
  color: string;
  image: string;
  wikiLang: string;
  wikiTitle: string;
  description: string;
  significance: string;
  address: string;
  openHours: string;
  quizzes: SiteQuiz[];
  viewName360?: string;
  hasStreetView?: boolean;
  searchQuery?: string;
  note360?: string;
  streetViewUrl?: string;
  vrTour360Url?: string;
}

export const HCMC_SITES: Site[] = [
  {
    id: 1,
    name: "Dinh Độc Lập",
    lat: 10.7772,
    lng: 106.696,
    category: "Di tích Quốc gia đặc biệt",
    color: "#dc2626",
    image: "🏛️",
    viewName360: "Cổng chính & Mặt tiền Dinh Độc Lập (Đường Nam Kỳ Khởi Nghĩa)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.7772!2d106.6960!3f230!4f5!5f1",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_dinhdoclap_viewflycam1_2",
    searchQuery: "Dinh Độc Lập, Quận 1, TP. Hồ Chí Minh",
    wikiLang: "en",
    wikiTitle: "Independence Palace",
    description: "Dinh Độc Lập (nay là Hội trường Thống Nhất) là biểu tượng lịch sử của ngày thống nhất đất nước 30/4/1975. Đây là nơi xe tăng quân Giải phóng húc đổ cổng, kết thúc 21 năm chia cắt đất nước.",
    significance: "Ngày 30/4/1975, xe tăng số hiệu 843 và 390 húc đổ cổng Dinh. Đại úy Phạm Xuân Thệ dẫn Dương Văn Minh lên đài phát thanh tuyên bố đầu hàng vô điều kiện — thống nhất non sông.",
    address: "135 Nam Kỳ Khởi Nghĩa, P. Bến Thành, Quận 1, TP.HCM",
    openHours: "7:30–11:30 | 13:00–16:00 (nghỉ thứ Hai)",
    quizzes: [
      { q: "Xe tăng mang số hiệu nào đã húc đổ cổng Dinh Độc Lập ngày 30/4/1975?", a: "Xe tăng số hiệu 843 (Type 59) và 390 (T-54) của Quân đoàn 2 — trong đó xe 390 húc đổ cánh cổng phụ, xe 843 húc đổ cổng chính và tiến vào sân Dinh trước." },
      { q: "Ai là người đã ra lệnh cho Tổng thống Dương Văn Minh tuyên bố đầu hàng vô điều kiện?", a: "Đại úy Phạm Xuân Thệ (sau này là Trung tướng) đã dẫn Dương Văn Minh từ Dinh Độc Lập đến Đài phát thanh Sài Gòn và yêu cầu tuyên bố đầu hàng lúc 13:30 ngày 30/4/1975." },
      { q: "Dinh Độc Lập được xây dựng lại vào năm nào và do kiến trúc sư nào thiết kế?", a: "Xây dựng lại từ 1962, hoàn thành 1966, do kiến trúc sư Ngô Viết Thụ — người Việt Nam đầu tiên đoạt giải Prix de Rome — thiết kế theo phong cách hiện đại kết hợp văn hóa Á Đông." },
      { q: "Hiện nay Dinh Độc Lập được sử dụng với tên gọi chính thức là gì?", a: "Hiện gọi là Hội trường Thống Nhất, xếp hạng Di tích Quốc gia đặc biệt — vừa là bảo tàng mở cửa đón khách, vừa là nơi tổ chức sự kiện chính trị quan trọng của TP.HCM." },
    ],
  },
  {
    id: 2,
    name: "Bảo tàng Chứng tích Chiến tranh",
    lat: 10.7791,
    lng: 106.6921,
    category: "Bảo tàng Lịch sử Quân sự",
    color: "#b45309",
    image: "🎖️",
    viewName360: "Cổng chính & Khuôn viên ngoài trời Bảo tàng (Đường Võ Văn Tần)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.7791!2d106.6921!3f320!4f5!5f1",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_btctct_view_1",
    searchQuery: "Bảo tàng Chứng tích Chiến tranh, Võ Văn Tần, Quận 3, TP. Hồ Chí Minh",
    wikiLang: "en",
    wikiTitle: "War Remnants Museum",
    description: "Bảo tàng lưu giữ hơn 20.000 tài liệu, hình ảnh và hiện vật phản ánh tội ác chiến tranh của đế quốc Mỹ tại Việt Nam. Địa chỉ giáo dục lịch sử hàng đầu tại TP.HCM, thu hút hơn 500.000 lượt khách quốc tế mỗi năm.",
    significance: "Trưng bày thực tế: máy bay, xe tăng, pháo bị thu giữ; ảnh tư liệu chiến tranh do phóng viên phương Tây chụp; mô hình Chuồng Cọp Côn Đảo; tài liệu về chất độc da cam/Dioxin.",
    address: "28 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    openHours: "7:30–18:00 hàng ngày",
    quizzes: [
      { q: "Bảo tàng Chứng tích Chiến tranh lưu giữ bao nhiêu tài liệu, hình ảnh và hiện vật?", a: "Hơn 20.000 tài liệu, hình ảnh và hiện vật chiến tranh, trong đó có bức ảnh 'Em bé napalm' của Nick Ut (1972) — một trong những ảnh báo chí nổi tiếng nhất thế kỷ 20." },
      { q: "Loại vũ khí hóa học nào được Mỹ sử dụng và được trưng bày tại bảo tàng?", a: "Chất độc da cam (Agent Orange) chứa Dioxin — rải xuống hơn 3 triệu ha rừng Việt Nam, gây hậu quả với hơn 4 triệu nạn nhân bị phơi nhiễm, di chứng qua nhiều thế hệ." },
      { q: "'Chuồng Cọp' là gì và tại sao được tái hiện tại Bảo tàng?", a: "Chuồng Cọp là phòng giam biệt lập tại nhà tù Côn Đảo — nơi tra tấn tù nhân chính trị. Mô hình tái hiện để tố cáo tội ác chiến tranh và giáo dục thế hệ trẻ về sự tàn khốc của chế độ thực dân." },
      { q: "Bảo tàng Chứng tích Chiến tranh có ý nghĩa giáo dục QPAN như thế nào?", a: "Là 'trường học lịch sử' trực quan, giúp học sinh thấy tận mắt hậu quả chiến tranh qua hiện vật thật — bồi đắp lòng yêu nước, ý thức bảo vệ hòa bình và quyết tâm giữ vững độc lập chủ quyền." },
    ],
  },
  {
    id: 3,
    name: "Địa đạo Củ Chi",
    lat: 11.0543,
    lng: 106.5186,
    category: "Di tích Lịch sử Chiến tranh",
    color: "#065f46",
    image: "⚔️",
    viewName360: "Sa bàn Vệ tinh 3D & VR Tour Thực Tế Ảo Địa Đạo (Bến Đình - Bến Dược)",
    hasStreetView: false,
    searchQuery: "Khu di tích lịch sử Địa đạo Củ Chi, Củ Chi, TP. Hồ Chí Minh",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_1_1_2_dia-dao-cu-chi_(1)",
    note360: "Khu vực địa đạo ngầm dưới lòng đất và rừng bảo tồn không có xe Google Street View. Hệ thống hiển thị Sa bàn Vệ tinh Quân sự 3D và hỗ trợ xem Trực tiếp VR Tour 360 Củ Chi bên dưới.",
    wikiLang: "en",
    wikiTitle: "Củ Chi tunnels",
    description: "Hệ thống địa đạo dài hơn 250km được đào trong lòng đất, biểu tượng tinh thần kiên cường của quân và dân Củ Chi trong kháng chiến chống Mỹ. Được mệnh danh là 'Đất Thép Thành Đồng'.",
    significance: "Địa đạo 3 tầng sâu 3–8m, rộng 0.8m, chứa: ban chỉ huy, bếp Hoàng Cầm (không khói), bệnh viện dã chiến, kho đạn, phòng hội họp. Toàn bộ đào thủ công bằng cuốc xẻng.",
    address: "Ấp Bến Đình, Xã Nhuận Đức, Huyện Củ Chi, TP.HCM",
    openHours: "7:00–17:00 hàng ngày",
    quizzes: [
      { q: "Địa đạo Củ Chi có tổng chiều dài bao nhiêu km và được đào trong bao lâu?", a: "Hơn 250km, đào trong 27 năm (1948–1975) hoàn toàn bằng sức người với cuốc và xẻng thủ công qua hai cuộc kháng chiến." },
      { q: "Bếp Hoàng Cầm có đặc điểm gì đặc biệt về mặt quân sự?", a: "Bếp Hoàng Cầm dẫn khói qua đường hầm ngoằn ngoèo và tán cây, khiến khói tản ra mặt đất thay vì bốc lên cao — giúp bộ đội nấu ăn mà máy bay trinh thám địch không phát hiện được." },
      { q: "Mỹ đã dùng chiến thuật gì để đối phó với địa đạo Củ Chi?", a: "Mỹ dùng nhiều chiến thuật: bơm nước, thả khí độc, lính đặc nhiệm nhỏ bé (Tunnel Rats), B-52 rải thảm, dùng chó săn — nhưng tất cả đều thất bại do địa đạo kiên cố và quân dân ta dũng cảm, mưu trí." },
      { q: "Củ Chi được phong tặng danh hiệu gì và ý nghĩa quân sự là gì?", a: "'Đất Thép Thành Đồng' — Anh hùng Lực lượng vũ trang nhân dân. Địa đạo là minh chứng nghệ thuật chiến tranh nhân dân: lấy ít địch nhiều, lấy yếu thắng mạnh bằng trí tuệ và tinh thần bất khuất." },
    ],
  },
  {
    id: 4,
    name: "Bến Nhà Rồng",
    lat: 10.7684,
    lng: 106.7066,
    category: "Di tích Quốc gia đặc biệt",
    color: "#1d4ed8",
    image: "🚢",
    viewName360: "Mặt tiền Bến Nhà Rồng & Bảo tàng Hồ Chí Minh (Đường Nguyễn Tất Thành)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.7684!2d106.7066!3f60!4f5!5f1",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_bnr_view1",
    searchQuery: "Bến Nhà Rồng, Số 1 Nguyễn Tất Thành, Quận 4, TP. Hồ Chí Minh",
    wikiLang: "vi",
    wikiTitle: "Bến Nhà Rồng",
    description: "Bến cảng lịch sử nơi người thanh niên Nguyễn Tất Thành xuống tàu Latouche-Tréville ra đi tìm đường cứu nước ngày 5/6/1911 — mở ra trang mới cho cách mạng Việt Nam.",
    significance: "Từ đây, Nguyễn Tất Thành bắt đầu hành trình 30 năm bôn ba qua hơn 30 quốc gia, tìm con đường giải phóng dân tộc theo chủ nghĩa Marx-Lenin.",
    address: "Số 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP.HCM",
    openHours: "7:30–11:30 | 13:30–17:00 (nghỉ thứ Hai)",
    quizzes: [
      { q: "Ngày 5/6/1911, Nguyễn Tất Thành ra đi trên con tàu mang tên gì?", a: "Tàu Latouche-Tréville (tàu hơi nước Pháp) rời Bến Nhà Rồng đến Marseille — bắt đầu hành trình 30 năm bôn ba tìm đường cứu nước qua nhiều châu lục." },
      { q: "Tên 'Nhà Rồng' của bến cảng này xuất phát từ đâu?", a: "Từ hai con rồng bằng sứ gắn trên nóc tòa nhà trụ sở hãng tàu Messageries Maritimes (Pháp) xây năm 1862–1863 — công trình mang phong cách kiến trúc Á Đông kết hợp Pháp." },
      { q: "Hiện nay Bến Nhà Rồng là gì và lưu giữ những gì?", a: "Là Bảo tàng Hồ Chí Minh — Chi nhánh TP.HCM, lưu giữ hơn 11.000 tài liệu, hình ảnh và hiện vật về cuộc đời Chủ tịch Hồ Chí Minh; đặc biệt có chiếc vali và đồ dùng của Người khi đi tìm đường cứu nước." },
      { q: "Năm 1920, Nguyễn Tất Thành đọc tài liệu nào và nhận ra con đường cứu nước đúng đắn?", a: "Năm 1920 tại Paris, Người đọc 'Luận cương về vấn đề dân tộc và thuộc địa' của Lenin — nhận ra chủ nghĩa Marx-Lenin là con đường duy nhất đúng đắn để giải phóng dân tộc Việt Nam." },
    ],
  },
  {
    id: 5,
    name: "Nghĩa trang Liệt sĩ TP.HCM",
    lat: 10.8732,
    lng: 106.8085,
    category: "Nghĩa trang Liệt sĩ Quốc gia",
    color: "#7c3aed",
    image: "🕊️",
    viewName360: "Cổng hành lễ & Tượng đài Nghĩa trang Liệt sĩ TP.HCM (Xa lộ Hà Nội, TP. Thủ Đức)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.8732!2d106.8085!3f95!4f0!5f1",
    vrTour360Url: "https://www.google.com/maps/search/?api=1&query=Nghĩa+trang+Liệt+sĩ+Thành+phố+Hồ+Chí+Minh",
    searchQuery: "Nghĩa trang Liệt sĩ Thành phố Hồ Chí Minh, Xa lộ Hà Nội, Thủ Đức, TP. Hồ Chí Minh",
    wikiLang: "vi",
    wikiTitle: "Nghĩa trang liệt sĩ Thành phố Hồ Chí Minh",
    description: "Nơi an nghỉ vĩnh hằng của gần 15.000 liệt sĩ hy sinh vì sự nghiệp giải phóng miền Nam, thống nhất đất nước. Địa chỉ giáo dục truyền thống cách mạng và tri ân anh hùng liệt sĩ lớn nhất thành phố.",
    significance: "Biểu tượng của đạo lý 'uống nước nhớ nguồn'. Nơi tổ chức các nghi lễ cấp Quốc gia và thành phố tri ân các anh hùng liệt sĩ; địa điểm giáo dục lý tưởng cách mạng cho tuổi trẻ.",
    address: "Xa lộ Hà Nội, Khu phố Giãn Dân, Phường Long Bình, TP. Thủ Đức, TP.HCM",
    openHours: "Mở cửa hàng ngày (cả ngày lễ, Tết)",
    quizzes: [
      { q: "Nghĩa trang Liệt sĩ TP.HCM hiện nay tọa lạc tại vị trí nào?", a: "Tọa lạc trên trục Xa lộ Hà Nội, Khu phố Giãn Dân, Phường Long Bình, TP. Thủ Đức (gần Công viên Lịch sử Văn hóa Dân tộc và Suối Tiên) — nơi an nghỉ của gần 15.000 liệt sĩ." },
      { q: "Tại sao tổ chức tham quan Nghĩa trang Liệt sĩ là hoạt động giáo dục QPAN quan trọng?", a: "Giúp học sinh cảm nhận trực tiếp sự hy sinh cao cả của các anh hùng — bồi đắp lòng biết ơn, tự hào dân tộc và ý thức trách nhiệm bảo vệ thành quả cách mạng." },
      { q: "Phong trào 'Đền ơn đáp nghĩa' của học sinh THPT có những hoạt động cụ thể nào?", a: "Thăm và chăm sóc mộ liệt sĩ (nhổ cỏ, quét dọn, trồng hoa); thăm hỏi tặng quà gia đình thương binh liệt sĩ; tham gia văn nghệ tri ân; đóng góp quỹ Đền ơn đáp nghĩa." },
      { q: "Ngày Thương binh Liệt sĩ 27/7 có ý nghĩa gì và được quy định từ bao giờ?", a: "Ngày 27/7/1947, Chủ tịch Hồ Chí Minh ký Sắc lệnh chọn là Ngày Thương binh toàn quốc — dịp toàn dân tri ân những người đã cống hiến xương máu bảo vệ Tổ quốc." },
    ],
  },
  {
    id: 6,
    name: "Đền tưởng niệm Bến Dược",
    lat: 11.14638,
    lng: 106.45844,
    category: "Di tích Lịch sử Cách mạng",
    color: "#0f766e",
    image: "🏯",
    viewName360: "Sa bàn Vệ tinh 3D & Quần thể Đền Tưởng niệm Liệt sĩ Bến Dược - Củ Chi",
    hasStreetView: false,
    searchQuery: "Đền tưởng niệm Bến Dược - Củ Chi",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_1_1_2_dia-dao-cu-chi_(1)",
    note360: "Khuôn viên Đền tưởng niệm là khu vực trang nghiêm và rừng cây không có xe Street View di chuyển. Hệ thống hiển thị Sa bàn Vệ tinh Không ảnh 3D và hỗ trợ xem Trực tiếp VR Tour 360 Củ Chi bên dưới.",
    wikiLang: "vi",
    wikiTitle: "Đền Bến Dược",
    description: "Khu di tích lịch sử tiêu biểu của vùng đất Củ Chi anh hùng. Đền khắc tên hơn 44.000 liệt sĩ hy sinh trên vùng đất 'Đất Thép Thành Đồng'.",
    significance: "Ngọn lửa thiêng cháy vĩnh cửu trong đền là biểu tượng bất diệt của tinh thần anh hùng cách mạng Củ Chi — nơi linh thiêng thể hiện đạo lý 'uống nước nhớ nguồn'.",
    address: "Ấp Bến Dược, Xã Phú Mỹ Hưng, Huyện Củ Chi, TP.HCM",
    openHours: "7:00–17:00 hàng ngày",
    quizzes: [
      { q: "Đền tưởng niệm Bến Dược khắc tên bao nhiêu liệt sĩ và ý nghĩa công trình là gì?", a: "Hơn 44.000 liệt sĩ hy sinh trên vùng đất Củ Chi qua hai cuộc kháng chiến. Công trình là biểu tượng tri ân, giáo dục lòng biết ơn và tinh thần yêu nước cho các thế hệ Việt Nam." },
      { q: "Ngọn lửa thiêng trong đền Bến Dược mang ý nghĩa biểu tượng gì?", a: "Tượng trưng cho tinh thần bất diệt của các anh hùng liệt sĩ, ý chí kiên cường của quân và dân Củ Chi không bao giờ tắt — như ngọn đuốc soi đường cho các thế hệ mai sau." },
      { q: "Khu di tích Bến Dược gắn với địa đạo Củ Chi như thế nào?", a: "Bến Dược là nơi đặt Ban Chỉ huy Quân sự khu Sài Gòn–Gia Định trong kháng chiến — địa điểm diễn ra nhiều hội nghị bí mật và là đầu mối liên lạc quan trọng trong chiến dịch Mậu Thân 1968." },
      { q: "Tại sao Củ Chi được chọn là nơi xây Đền tưởng niệm liệt sĩ lớn như vậy?", a: "Củ Chi là nơi chịu bom đạn nặng nề nhất (B-52 rải thảm liên tục), chiến đấu ác liệt nhất với tỷ lệ hy sinh cao nhất. Được phong 'Đất Thép Thành Đồng', xứng đáng là nơi tưởng niệm liệt sĩ của toàn dân tộc." },
    ],
  },
];

export type ViewMode360 = "streetview" | "satellite" | "vrtour";

export function getSiteEmbedUrl(site: Site, mode: ViewMode360): string {
  const q = site.searchQuery || `${site.name}, TP. Hồ Chí Minh`;

  if (mode === "vrtour") {
    if (site.vrTour360Url) return site.vrTour360Url;
  }

  if (mode === "satellite") {
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=k&z=17&output=embed`;
  }

  // mode === "streetview"
  if (site.hasStreetView === false) {
    // For sites with no streetview car in tunnels/forest (Cu Chi, Ben Duoc), fallback to direct VR tour or satellite
    if (site.vrTour360Url) return site.vrTour360Url;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=k&z=17&output=embed`;
  }

  if (site.streetViewUrl) return site.streetViewUrl;
  return `https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d${site.lat}!2d${site.lng}!4f-0!5f1`;
}

export function getStreetViewUrl(site: Site): string {
  return getSiteEmbedUrl(site, "streetview");
}

export function getGoogleMapsExternalUrl(site: Site): string {
  const query = site.searchQuery || `${site.name}, TP. Hồ Chí Minh`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getGoogleSatelliteEmbedUrl(site: Site): string {
  const q = site.searchQuery || `${site.name}, TP. Hồ Chí Minh`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=k&z=17&output=embed`;
}

async function fetchWikiImg(lang: string, title: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export default function MapSection() {
  const { recordMapAnswer, fireXPToast } = useGamification();

  // Active Selected Historical Site (Default directly into Dinh Độc Lập)
  const [selectedSite, setSelectedSite] = useState<Site>(HCMC_SITES[0]);

  // Active 360 View Mode
  const [viewMode, setViewMode] = useState<ViewMode360>(
    HCMC_SITES[0].hasStreetView === false ? "vrtour" : "streetview"
  );

  // UI state
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Wiki Image & Quiz
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<SiteQuiz | null>(HCMC_SITES[0].quizzes[0]);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  const vrContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectSite = useCallback((site: Site) => {
    setSelectedSite(site);
    setIsIframeLoading(true);
    setViewMode(site.hasStreetView === false ? (site.vrTour360Url ? "vrtour" : "satellite") : "streetview");

    // Shuffle quiz for this site
    const idx = Math.floor(Math.random() * site.quizzes.length);
    setActiveQuiz(site.quizzes[idx]);
    setShowAnswer(false);

    // Fetch site photo
    setImgUrl(null);
    fetchWikiImg(site.wikiLang, site.wikiTitle).then((url) => {
      setImgUrl(url);
    });
  }, []);

  const shuffleQuiz = useCallback(() => {
    if (!selectedSite.quizzes.length) return;
    const idx = Math.floor(Math.random() * selectedSite.quizzes.length);
    setActiveQuiz(selectedSite.quizzes[idx]);
    setShowAnswer(false);
  }, [selectedSite]);

  useEffect(() => {
    // Initial fetch for first site
    fetchWikiImg(selectedSite.wikiLang, selectedSite.wikiTitle).then((url) => {
      setImgUrl(url);
    });
  }, []);

  const toggleFullscreen = () => {
    if (!vrContainerRef.current) return;
    if (!document.fullscreenElement) {
      vrContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const currentEmbedUrl = getSiteEmbedUrl(selectedSite, viewMode);

  return (
    <div className="w-full space-y-4 select-none pb-8 animate-fadeIn">
      {/* ═══════════════════ TOP HEADER & SITE SELECTOR RIBBON ═══════════════════ */}
      <div className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors space-y-4">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 text-lg">
              <Compass className="w-5 h-5 animate-spin [animation-duration:12s]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  KHÔNG GIAN DI TÍCH LỊCH SỬ &amp; QPAN 360° VR
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold uppercase font-mono">
                  Vào Thẳng VR
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khám phá thực tế ảo 360° các địa danh lịch sử kháng chiến tiêu biểu tại TP. Hồ Chí Minh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{HCMC_SITES.length} Địa danh lịch sử</span>
            </span>

            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDrawerOpen
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              }`}
              title={isDrawerOpen ? "Thu gọn bảng tư liệu" : "Mở bảng tư liệu & câu hỏi ôn tập"}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDrawerOpen ? "Ẩn tư liệu & đố vui" : "Hiện tư liệu & đố vui"}</span>
            </button>
          </div>
        </div>

        {/* SITE SELECTION TABS RIBBON */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500" /> Chọn di tích:
          </span>
          {HCMC_SITES.map((site) => {
            const isSelected = selectedSite.id === site.id;
            return (
              <button
                key={site.id}
                onClick={() => handleSelectSite(site)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? "text-white shadow-md scale-102"
                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80"
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: site.color,
                        borderColor: site.color,
                        boxShadow: `0 8px 16px -4px ${site.color}40`,
                      }
                    : {}
                }
              >
                <span className="text-base leading-none">{site.image}</span>
                <span>{site.name}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ MAIN 360 VR STAGE + SIDE PANEL ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* CỘT TRÁI: KHUNG XEM THỰC TẾ ẢO 360° (8 hoặc 12 Cột) */}
        <div
          ref={vrContainerRef}
          className={`${
            isDrawerOpen ? "lg:col-span-8" : "lg:col-span-12"
          } rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col transition-all duration-300 relative ${
            isFullscreen ? "fixed inset-0 z-[99999] rounded-none border-none h-screen w-screen" : "h-[580px] sm:h-[640px] lg:h-[700px]"
          }`}
        >
          {/* VR STAGE TOP CONTROLS BAR */}
          <div className="px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 text-white shrink-0 z-20 flex-wrap">
            {/* Site Info in Bar */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                style={{ backgroundColor: selectedSite.color }}
              >
                {selectedSite.image}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white truncate">
                    {selectedSite.name}
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                    {selectedSite.category}
                  </span>
                </div>
                <p className="text-[10px] text-blue-300 font-mono truncate">
                  🧭 {selectedSite.viewName360 || "Góc nhìn thực tế ảo"}
                </p>
              </div>
            </div>

            {/* View Mode & Fullscreen Controls */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* Mode Switcher Buttons */}
              <div className="bg-slate-800/90 p-0.5 rounded-xl flex items-center border border-slate-700/80">
                {selectedSite.hasStreetView !== false && (
                  <button
                    onClick={() => {
                      setViewMode("streetview");
                      setIsIframeLoading(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "streetview"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                    title="Góc nhìn 360° Street View thực địa"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>360° Thực địa</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setViewMode("satellite");
                    setIsIframeLoading(true);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "satellite"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Sa bàn Vệ tinh 3D Không ảnh Quân sự"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Vệ tinh 3D</span>
                </button>

                {selectedSite.vrTour360Url && (
                  <button
                    onClick={() => {
                      setViewMode("vrtour");
                      setIsIframeLoading(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "vrtour"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                    title="VR Tour 360 Chi Tiết (Sở Du lịch TP.HCM)"
                  >
                    <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>VR Tour 360</span>
                  </button>
                )}
              </div>

              {/* External Direct Links */}
              <a
                href={getGoogleMapsExternalUrl(selectedSite)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Mở vị trí trên Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title={isFullscreen ? "Thoát toàn màn hình" : "Mở toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* IFRAME 360 STAGE */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-black">
            {/* Loading Indicator */}
            {isIframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 gap-3">
                <div
                  className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${selectedSite.color}50`, borderTopColor: selectedSite.color }}
                />
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-white">
                    Đang kết nối không gian thực tế ảo 360°...
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {selectedSite.name} · {viewMode === "vrtour" ? "VR Tour 360" : viewMode === "satellite" ? "Sa bàn Vệ tinh 3D" : "Street View 360°"}
                  </p>
                </div>
              </div>
            )}

            {/* Note banner for underground tunnels (Củ Chi / Bến Dược) */}
            {selectedSite.note360 && viewMode === "streetview" && (
              <div className="absolute top-3 left-3 right-3 z-10 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{selectedSite.note360}</span>
                </div>
                {selectedSite.vrTour360Url && (
                  <button
                    onClick={() => {
                      setViewMode("vrtour");
                      setIsIframeLoading(true);
                    }}
                    className="px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-xl hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
                  >
                    Vào VR Tour Ngay
                  </button>
                )}
              </div>
            )}

            {/* The 360 Viewer Iframe */}
            <iframe
              key={`${selectedSite.id}-${viewMode}`}
              src={currentEmbedUrl}
              title={`360 VR - ${selectedSite.name}`}
              className="w-full h-full border-0"
              loading="eager"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => setIsIframeLoading(false)}
            />

            {/* Floating Interaction Tips Pill */}
            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-slate-300 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin [animation-duration:8s]" />
              <span>Kéo chuột hoặc vuốt tay để xoay 360° quan sát địa hình</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG TƯ LIỆU LỊCH SỬ & ĐỐ VUI (4 Cột) */}
        {isDrawerOpen && (
          <div className="lg:col-span-4 space-y-4">
            {/* THẺ ẢNH & THÔNG TIN ĐỊA DANH */}
            <div className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              {/* Photo Banner */}
              <div
                className="relative w-full h-44 overflow-hidden"
                style={{ backgroundColor: `${selectedSite.color}15` }}
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={selectedSite.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                    <span className="text-5xl">{selectedSite.image}</span>
                    <span className="text-xs font-mono">{selectedSite.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Category Badge */}
                <div
                  className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full text-white backdrop-blur-sm shadow-sm"
                  style={{ backgroundColor: `${selectedSite.color}ee` }}
                >
                  {selectedSite.category}
                </div>

                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                  <div className="font-black text-lg leading-tight drop-shadow-md">
                    {selectedSite.image} {selectedSite.name}
                  </div>
                </div>
              </div>

              {/* Address & Hours */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: selectedSite.color }} />
                  <span className="leading-snug">{selectedSite.address}</span>
                </div>
                <div className="text-[11px] text-slate-400 pl-5">
                  🕒 Giờ mở cửa: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedSite.openHours}</span>
                </div>
              </div>

              {/* Historical Description & Military Significance */}
              <div className="p-4 space-y-3.5 text-xs">
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Giới thiệu di tích
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedSite.description}
                  </p>
                </div>

                <div
                  className="p-3.5 rounded-2xl border"
                  style={{
                    backgroundColor: `${selectedSite.color}0c`,
                    borderColor: `${selectedSite.color}25`,
                  }}
                >
                  <h4
                    className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    style={{ color: selectedSite.color }}
                  >
                    <Shield className="w-3.5 h-3.5" /> Ý nghĩa Lịch sử &amp; QPAN
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs">
                    {selectedSite.significance}
                  </p>
                </div>
              </div>
            </div>

            {/* THẺ ĐỐ VUI TƯƠNG TÁC NHẬN XP */}
            {activeQuiz && (
              <div className="rounded-3xl border border-amber-200 dark:border-amber-800/70 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-amber-950/20 p-4 space-y-3 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">
                    <Star className="w-3.5 h-3.5 fill-current" /> Ôn tập trắc nghiệm nhanh (+15 XP)
                  </span>
                  <button
                    onClick={shuffleQuiz}
                    className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-800 font-bold cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Đổi câu
                  </button>
                </div>

                <p className="text-xs text-slate-900 dark:text-white font-bold leading-relaxed">
                  ❓ {activeQuiz.q}
                </p>

                {!showAnswer ? (
                  <button
                    onClick={() => {
                      setShowAnswer(true);
                      const { xpGained } = recordMapAnswer(selectedSite.id);
                      if (xpGained > 0) fireXPToast(xpGained, "Xem đáp án di tích lịch sử");
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm transition-transform hover:scale-101 active:scale-98 cursor-pointer"
                    style={{ backgroundColor: selectedSite.color }}
                  >
                    <span>Xem Đáp Án &amp; Lời Giải</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="bg-white dark:bg-slate-800/90 border border-amber-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-1 shadow-xs animate-fadeIn">
                    <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <span>✅ Đáp án chuẩn:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                      {activeQuiz.a}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
