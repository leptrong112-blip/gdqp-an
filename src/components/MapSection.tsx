import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, X, BookOpen, ChevronRight, Star, Shield, RefreshCw,
  Crosshair, Layers, Compass, Maximize2, ExternalLink, Eye, Sparkles
} from "lucide-react";
import { useGamification } from "../context/GamificationContext";

interface SiteQuiz { q: string; a: string; }
interface Site {
  id: number; name: string; lat: number; lng: number;
  category: string; color: string; image: string;
  wikiLang: string; wikiTitle: string;
  description: string; significance: string;
  address: string; openHours: string;
  quizzes: SiteQuiz[];
  viewName360?: string;
  hasStreetView?: boolean;
  searchQuery?: string;
  note360?: string;
  streetViewUrl?: string;
  vrTour360Url?: string;
}

const HCMC_SITES: Site[] = [
  {
    id: 1, name: "Dinh Độc Lập", lat: 10.7772, lng: 106.6960,
    category: "Di tích Quốc gia đặc biệt", color: "#dc2626", image: "🏛️",
    viewName360: "Cổng chính & Mặt tiền Dinh Độc Lập (Đường Nam Kỳ Khởi Nghĩa)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.7772!2d106.6960!3f230!4f5!5f1",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_dinhdoclap_viewflycam1_2",
    searchQuery: "Dinh Độc Lập, Quận 1, TP. Hồ Chí Minh",
    wikiLang: "en", wikiTitle: "Independence Palace",
    description: "Dinh Độc Lập (nay là Hội trường Thống Nhất) là biểu tượng lịch sử của ngày thống nhất đất nước 30/4/1975. Đây là nơi xe tăng quân Giải phóng húc đổ cổng, kết thúc 21 năm chia cắt đất nước.",
    significance: "Ngày 30/4/1975, xe tăng số hiệu 843 và 390 húc đổ cổng Dinh. Đại úy Phạm Xuân Thệ dẫn Dương Văn Minh lên đài phát thanh tuyên bố đầu hàng vô điều kiện — thống nhất đất nước.",
    address: "135 Nam Kỳ Khởi Nghĩa, P. Bến Thành, Quận 1, TP.HCM", openHours: "7:30–11:30 | 13:00–16:00 (nghỉ thứ Hai)",
    quizzes: [
      { q: "Xe tăng mang số hiệu nào đã húc đổ cổng Dinh Độc Lập ngày 30/4/1975?", a: "Xe tăng số hiệu 843 (Type 59) và 390 (T-54) của Quân đoàn 2 — trong đó xe 390 húc đổ cánh cổng phụ, xe 843 húc đổ cổng chính và tiến vào sân Dinh trước." },
      { q: "Ai là người đã ra lệnh cho Tổng thống Dương Văn Minh tuyên bố đầu hàng vô điều kiện?", a: "Đại úy Phạm Xuân Thệ (sau này là Trung tướng) đã dẫn Dương Văn Minh từ Dinh Độc Lập đến Đài phát thanh Sài Gòn và yêu cầu tuyên bố đầu hàng lúc 13:30 ngày 30/4/1975." },
      { q: "Dinh Độc Lập được xây dựng lại vào năm nào và do kiến trúc sư nào thiết kế?", a: "Xây dựng lại từ 1962, hoàn thành 1966, do kiến trúc sư Ngô Viết Thụ — người Việt Nam đầu tiên đoạt giải Prix de Rome — thiết kế theo phong cách hiện đại kết hợp văn hóa Á Đông." },
      { q: "Hiện nay Dinh Độc Lập được sử dụng với tên gọi chính thức là gì?", a: "Hiện gọi là Hội trường Thống Nhất, xếp hạng Di tích Quốc gia đặc biệt — vừa là bảo tàng mở cửa đón khách, vừa là nơi tổ chức sự kiện chính trị quan trọng của TP.HCM." },
    ],
  },
  {
    id: 2, name: "Bảo tàng Chứng tích Chiến tranh", lat: 10.7791, lng: 106.6921,
    category: "Bảo tàng Lịch sử Quân sự", color: "#b45309", image: "🎖️",
    viewName360: "Cổng chính & Khuôn viên ngoài trời Bảo tàng (Đường Võ Văn Tần)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.7791!2d106.6921!3f320!4f5!5f1",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_btctct_view_1",
    searchQuery: "Bảo tàng Chứng tích Chiến tranh, Võ Văn Tần, Quận 3, TP. Hồ Chí Minh",
    wikiLang: "en", wikiTitle: "War Remnants Museum",
    description: "Bảo tàng lưu giữ hơn 20.000 tài liệu, hình ảnh và hiện vật phản ánh tội ác chiến tranh của đế quốc Mỹ tại Việt Nam. Địa chỉ giáo dục lịch sử hàng đầu tại TP.HCM, thu hút hơn 500.000 lượt khách quốc tế mỗi năm.",
    significance: "Trưng bày thực tế: máy bay, xe tăng, pháo bị thu giữ; ảnh tư liệu chiến tranh do phóng viên phương Tây chụp; mô hình Chuồng Cọp Côn Đảo; tài liệu về chất độc da cam/Dioxin.",
    address: "28 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM", openHours: "7:30–18:00 hàng ngày",
    quizzes: [
      { q: "Bảo tàng Chứng tích Chiến tranh lưu giữ bao nhiêu tài liệu, hình ảnh và hiện vật?", a: "Hơn 20.000 tài liệu, hình ảnh và hiện vật chiến tranh, trong đó có bức ảnh 'Em bé napalm' của Nick Ut (1972) — một trong những ảnh báo chí nổi tiếng nhất thế kỷ 20." },
      { q: "Loại vũ khí hóa học nào được Mỹ sử dụng và được trưng bày tại bảo tàng?", a: "Chất độc da cam (Agent Orange) chứa Dioxin — rải xuống hơn 3 triệu ha rừng Việt Nam, gây hậu quả với hơn 4 triệu nạn nhân bị phơi nhiễm, di chứng qua nhiều thế hệ." },
      { q: "'Chuồng Cọp' là gì và tại sao được tái hiện tại Bảo tàng?", a: "Chuồng Cọp là phòng giam biệt lập tại nhà tù Côn Đảo — nơi tra tấn tù nhân chính trị. Mô hình tái hiện để tố cáo tội ác chiến tranh và giáo dục thế hệ trẻ về sự tàn khốc của chế độ thực dân." },
      { q: "Bảo tàng Chứng tích Chiến tranh có ý nghĩa giáo dục QPAN như thế nào?", a: "Là 'trường học lịch sử' trực quan, giúp học sinh thấy tận mắt hậu quả chiến tranh qua hiện vật thật — bồi đắp lòng yêu nước, ý thức bảo vệ hòa bình và quyết tâm giữ vững độc lập chủ quyền." },
    ],
  },
  {
    id: 3, name: "Địa đạo Củ Chi", lat: 11.0543, lng: 106.5186,
    category: "Di tích Lịch sử Chiến tranh", color: "#065f46", image: "⚔️",
    viewName360: "Sa bàn Vệ tinh 3D & Khu Di tích Lịch sử Địa đạo Củ Chi (Bến Đình)",
    hasStreetView: false,
    searchQuery: "Khu di tích lịch sử Địa đạo Củ Chi, Củ Chi, TP. Hồ Chí Minh",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_1_1_2_dia-dao-cu-chi_(1)",
    note360: "Khu vực địa đạo ngầm dưới lòng đất và rừng bảo tồn không có xe Google Street View. Hệ thống hiển thị Sa bàn Vệ tinh Quân sự 3D và hỗ trợ xem Trực tiếp VR Tour 360 Củ Chi bên dưới.",
    wikiLang: "en", wikiTitle: "Củ Chi tunnels",
    description: "Hệ thống địa đạo dài hơn 250km được đào trong lòng đất, biểu tượng tinh thần kiên cường của quân và dân Củ Chi trong kháng chiến chống Mỹ. Được mệnh danh là 'Đất Thép Thành Đồng'.",
    significance: "Địa đạo 3 tầng sâu 3–8m, rộng 0.8m, chứa: ban chỉ huy, bếp Hoàng Cầm (không khói), bệnh viện dã chiến, kho đạn, phòng hội họp. Toàn bộ đào thủ công bằng cuốc xẻng.",
    address: "Ấp Bến Đình, Xã Nhuận Đức, Huyện Củ Chi, TP.HCM", openHours: "7:00–17:00 hàng ngày",
    quizzes: [
      { q: "Địa đạo Củ Chi có tổng chiều dài bao nhiêu km và được đào trong bao lâu?", a: "Hơn 250km, đào trong 27 năm (1948–1975) hoàn toàn bằng sức người với cuốc và xẻng thủ công qua hai cuộc kháng chiến." },
      { q: "Bếp Hoàng Cầm có đặc điểm gì đặc biệt về mặt quân sự?", a: "Bếp Hoàng Cầm dẫn khói qua đường hầm ngoằn ngoèo và tán cây, khiến khói tản ra mặt đất thay vì bốc lên cao — giúp bộ đội nấu ăn mà máy bay trinh thám địch không phát hiện được." },
      { q: "Mỹ đã dùng chiến thuật gì để đối phó với địa đạo Củ Chi?", a: "Mỹ dùng nhiều chiến thuật: bơm nước, thả khí độc, lính đặc nhiệm nhỏ bé (Tunnel Rats), B-52 rải thảm, dùng chó săn — nhưng tất cả đều thất bại do địa đạo kiên cố và quân dân ta dũng cảm, mưu trí." },
      { q: "Củ Chi được phong tặng danh hiệu gì và ý nghĩa quân sự là gì?", a: "'Đất Thép Thành Đồng' — Anh hùng Lực lượng vũ trang nhân dân. Địa đạo là minh chứng nghệ thuật chiến tranh nhân dân: lấy ít địch nhiều, lấy yếu thắng mạnh bằng trí tuệ và tinh thần bất khuất." },
    ],
  },
  {
    id: 4, name: "Bến Nhà Rồng", lat: 10.7684, lng: 106.7066,
    category: "Di tích Quốc gia đặc biệt", color: "#1d4ed8", image: "🚢",
    viewName360: "Mặt tiền Bến Nhà Rồng & Bảo tàng Hồ Chí Minh (Đường Nguyễn Tất Thành)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.7684!2d106.7066!3f60!4f5!5f1",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_bnr_view1",
    searchQuery: "Bến Nhà Rồng, Số 1 Nguyễn Tất Thành, Quận 4, TP. Hồ Chí Minh",
    wikiLang: "vi", wikiTitle: "Bến Nhà Rồng",
    description: "Bến cảng lịch sử nơi người thanh niên Nguyễn Tất Thành xuống tàu Latouche-Tréville ra đi tìm đường cứu nước ngày 5/6/1911 — mở ra trang mới cho cách mạng Việt Nam.",
    significance: "Từ đây, Nguyễn Tất Thành bắt đầu hành trình 30 năm bôn ba qua hơn 30 quốc gia, tìm con đường giải phóng dân tộc theo chủ nghĩa Marx-Lenin.",
    address: "Số 1 Nguyễn Tất Thành, Phường 12, Quận 4, TP.HCM", openHours: "7:30–11:30 | 13:30–17:00 (nghỉ thứ Hai)",
    quizzes: [
      { q: "Ngày 5/6/1911, Nguyễn Tất Thành ra đi trên con tàu mang tên gì?", a: "Tàu Latouche-Tréville (tàu hơi nước Pháp) rời Bến Nhà Rồng đến Marseille — bắt đầu hành trình 30 năm bôn ba tìm đường cứu nước qua nhiều châu lục." },
      { q: "Tên 'Nhà Rồng' của bến cảng này xuất phát từ đâu?", a: "Từ hai con rồng bằng sứ gắn trên nóc tòa nhà trụ sở hãng tàu Messageries Maritimes (Pháp) xây năm 1862–1863 — công trình mang phong cách kiến trúc Á Đông kết hợp Pháp." },
      { q: "Hiện nay Bến Nhà Rồng là gì và lưu giữ những gì?", a: "Là Bảo tàng Hồ Chí Minh — Chi nhánh TP.HCM, lưu giữ hơn 11.000 tài liệu, hình ảnh và hiện vật về cuộc đời Chủ tịch Hồ Chí Minh; đặc biệt có chiếc vali và đồ dùng của Người khi đi tìm đường cứu nước." },
      { q: "Năm 1920, Nguyễn Tất Thành đọc tài liệu nào và nhận ra con đường cứu nước đúng đắn?", a: "Năm 1920 tại Paris, Người đọc 'Luận cương về vấn đề dân tộc và thuộc địa' của Lenin — nhận ra chủ nghĩa Marx-Lenin là con đường duy nhất đúng đắn để giải phóng dân tộc Việt Nam." },
    ],
  },
  {
    id: 5, name: "Nghĩa trang Liệt sĩ TP.HCM", lat: 10.8732, lng: 106.8085,
    category: "Nghĩa trang Liệt sĩ Quốc gia", color: "#7c3aed", image: "🕊️",
    viewName360: "Cổng hành lễ & Tượng đài Nghĩa trang Liệt sĩ TP.HCM (Xa lộ Hà Nội, TP. Thủ Đức)",
    hasStreetView: true,
    streetViewUrl: "https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d10.8732!2d106.8085!3f95!4f0!5f1",
    vrTour360Url: "https://www.google.com/maps/search/?api=1&query=Nghĩa+trang+Liệt+sĩ+Thành+phố+Hồ+Chí+Minh",
    searchQuery: "Nghĩa trang Liệt sĩ Thành phố Hồ Chí Minh, Xa lộ Hà Nội, Thủ Đức, TP. Hồ Chí Minh",
    wikiLang: "vi", wikiTitle: "Nghĩa trang liệt sĩ Thành phố Hồ Chí Minh",
    description: "Nơi an nghỉ vĩnh hằng của gần 15.000 liệt sĩ hy sinh vì sự nghiệp giải phóng miền Nam, thống nhất đất nước. Địa chỉ giáo dục truyền thống cách mạng và tri ân anh hùng liệt sĩ lớn nhất thành phố.",
    significance: "Biểu tượng của đạo lý 'uống nước nhớ nguồn'. Nơi tổ chức các nghi lễ cấp Quốc gia và thành phố tri ân các anh hùng liệt sĩ; địa điểm giáo dục lý tưởng cách mạng cho tuổi trẻ.",
    address: "Xa lộ Hà Nội, Khu phố Giãn Dân, Phường Long Bình, TP. Thủ Đức, TP.HCM", openHours: "Mở cửa hàng ngày (cả ngày lễ, Tết)",
    quizzes: [
      { q: "Nghĩa trang Liệt sĩ TP.HCM hiện nay tọa lạc tại vị trí nào?", a: "Tọa lạc trên trục Xa lộ Hà Nội, Khu phố Giãn Dân, Phường Long Bình, TP. Thủ Đức (gần Công viên Lịch sử Văn hóa Dân tộc và Suối Tiên) — nơi an nghỉ của gần 15.000 liệt sĩ." },
      { q: "Tại sao tổ chức tham quan Nghĩa trang Liệt sĩ là hoạt động giáo dục QPAN quan trọng?", a: "Giúp học sinh cảm nhận trực tiếp sự hy sinh cao cả của các anh hùng — bồi đắp lòng biết ơn, tự hào dân tộc và ý thức trách nhiệm bảo vệ thành quả cách mạng." },
      { q: "Phong trào 'Đền ơn đáp nghĩa' của học sinh THPT có những hoạt động cụ thể nào?", a: "Thăm và chăm sóc mộ liệt sĩ (nhổ cỏ, quét dọn, trồng hoa); thăm hỏi tặng quà gia đình thương binh liệt sĩ; tham gia văn nghệ tri ân; đóng góp quỹ Đền ơn đáp nghĩa." },
      { q: "Ngày Thương binh Liệt sĩ 27/7 có ý nghĩa gì và được quy định từ bao giờ?", a: "Ngày 27/7/1947, Chủ tịch Hồ Chí Minh ký Sắc lệnh chọn là Ngày Thương binh toàn quốc — dịp toàn dân tri ân những người đã cống hiến xương máu bảo vệ Tổ quốc." },
    ],
  },
  {
    id: 6, name: "Đền tưởng niệm Bến Dược", lat: 11.14638, lng: 106.45844,
    category: "Di tích Lịch sử Cách mạng", color: "#0f766e", image: "🏯",
    viewName360: "Sa bàn Vệ tinh 3D & Quần thể Đền Tưởng niệm Liệt sĩ Bến Dược - Củ Chi",
    hasStreetView: false,
    searchQuery: "Đền tưởng niệm Bến Dược - Củ Chi",
    vrTour360Url: "https://map3d.visithcmc.vn/?startscene=scene_1_1_2_dia-dao-cu-chi_(1)",
    note360: "Khuôn viên Đền tưởng niệm là khu vực trang nghiêm và rừng cây không có xe Street View di chuyển. Hệ thống hiển thị Sa bàn Vệ tinh Không ảnh 3D và hỗ trợ xem Trực tiếp VR Tour 360 Củ Chi bên dưới.",
    wikiLang: "vi", wikiTitle: "Đền Bến Dược",
    description: "Khu di tích lịch sử tiêu biểu của vùng đất Củ Chi anh hùng. Đền khắc tên hơn 44.000 liệt sĩ hy sinh trên vùng đất 'Đất Thép Thành Đồng'.",
    significance: "Ngọn lửa thiêng cháy vĩnh cửu trong đền là biểu tượng bất diệt của tinh thần anh hùng cách mạng Củ Chi — nơi linh thiêng thể hiện đạo lý 'uống nước nhớ nguồn'.",
    address: "Ấp Bến Dược, Xã Phú Mỹ Hưng, Huyện Củ Chi, TP.HCM", openHours: "7:00–17:00 hàng ngày",
    quizzes: [
      { q: "Đền tưởng niệm Bến Dược khắc tên bao nhiêu liệt sĩ và ý nghĩa công trình là gì?", a: "Hơn 44.000 liệt sĩ hy sinh trên vùng đất Củ Chi qua hai cuộc kháng chiến. Công trình là biểu tượng tri ân, giáo dục lòng biết ơn và tinh thần yêu nước cho các thế hệ Việt Nam." },
      { q: "Ngọn lửa thiêng trong đền Bến Dược mang ý nghĩa biểu tượng gì?", a: "Tượng trưng cho tinh thần bất diệt của các anh hùng liệt sĩ, ý chí kiên cường của quân và dân Củ Chi không bao giờ tắt — như ngọn đuốc soi đường cho các thế hệ mai sau." },
      { q: "Khu di tích Bến Dược gắn với địa đạo Củ Chi như thế nào?", a: "Bến Dược là nơi đặt Ban Chỉ huy Quân sự khu Sài Gòn–Gia Định trong kháng chiến — địa điểm diễn ra nhiều hội nghị bí mật và là đầu mối liên lạc quan trọng trong chiến dịch Mậu Thân 1968." },
      { q: "Tại sao Củ Chi được chọn là nơi xây Đền tưởng niệm liệt sĩ lớn như vậy?", a: "Củ Chi là nơi chịu bom đạn nặng nề nhất (B-52 rải thảm liên tục), chiến đấu ác liệt nhất với tỷ lệ hy sinh cao nhất. Được phong 'Đất Thép Thành Đồng', xứng đáng là nơi tưởng niệm liệt sĩ của toàn dân tộc." },
    ],
  },
];

export type ViewMode360 = "streetview" | "satellite" | "map";

export function getSiteEmbedUrl(site: Site, mode: ViewMode360): string {
  const q = site.searchQuery || `${site.name}, TP. Hồ Chí Minh`;
  if (mode === "satellite") {
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=k&z=17&output=embed`;
  }
  if (mode === "map") {
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=m&z=16&output=embed`;
  }
  // Mode: streetview
  if (site.hasStreetView === false) {
    // For sites with no street car in tunnels/forest (Cu Chi, Ben Duoc), fallback directly to 3D satellite with verified query
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

export type MapLayerId = "streets" | "satellite" | "voyager" | "dark";

export interface MapLayerConfig {
  id: MapLayerId;
  name: string;
  icon: string;
  url: string;
  subdomains?: string[] | string;
  attribution: string;
  maxZoom: number;
}

const MAP_LAYERS: Record<MapLayerId, MapLayerConfig> = {
  streets: {
    id: "streets",
    name: "Đường phố",
    icon: "🗺️",
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    attribution: "© Google Maps",
    maxZoom: 20,
  },
  satellite: {
    id: "satellite",
    name: "Vệ tinh",
    icon: "🛰️",
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    attribution: "© Google Maps Imagery",
    maxZoom: 20,
  },
  voyager: {
    id: "voyager",
    name: "Chiến thuật",
    icon: "🧭",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "© OpenStreetMap contributors © CARTO",
    maxZoom: 19,
  },
  dark: {
    id: "dark",
    name: "Tác chiến đêm",
    icon: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "© OpenStreetMap contributors © CARTO",
    maxZoom: 19,
  },
};

export default function MapSection() {
  const { recordMapAnswer, fireXPToast } = useGamification();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerId>("streets");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isImgLoading, setIsImgLoading] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<SiteQuiz | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [leafletReady, setLeafletReady] = useState<boolean>(false);

  // 360 Street View & Virtual Tour state
  const [is360ModalOpen, setIs360ModalOpen] = useState<boolean>(false);
  const [siteFor360, setSiteFor360] = useState<Site | null>(null);
  const [viewMode360, setViewMode360] = useState<ViewMode360>("streetview");
  const [activeDetailTab, setActiveDetailTab] = useState<"info" | "360">("info");

  const open360Modal = useCallback((site: Site) => {
    setSiteFor360(site);
    setViewMode360(site.hasStreetView === false ? "satellite" : "streetview");
    setIs360ModalOpen(true);
  }, []);

  const open360ModalRef = useRef(open360Modal);
  open360ModalRef.current = open360Modal;

  const pickSiteRef = useRef<(site: Site) => void>(() => {});

  const shuffleQuiz = useCallback(() => {
    if (!selectedSite || !selectedSite.quizzes.length) return;
    const idx = Math.floor(Math.random() * selectedSite.quizzes.length);
    setActiveQuiz(selectedSite.quizzes[idx]);
    setShowAnswer(false);
  }, [selectedSite]);

  const pickSite = useCallback((site: Site) => {
    setSelectedSite(site);
    setActiveDetailTab("info");
    const idx = Math.floor(Math.random() * site.quizzes.length);
    setActiveQuiz(site.quizzes[idx]);
    setShowAnswer(false);

    setIsImgLoading(true);
    setImgUrl(null);
    fetchWikiImg(site.wikiLang, site.wikiTitle).then((url) => {
      setImgUrl(url);
      setIsImgLoading(false);
    });
  }, []);

  pickSiteRef.current = pickSite;

  const applyLayer = useCallback((layerId: MapLayerId) => {
    setActiveLayer(layerId);
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    const cfg = MAP_LAYERS[layerId];
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch (_) {}
    }

    const newLayer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains || "abc",
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, []);

  const fitAllBounds = useCallback(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;
    const bounds = L.latLngBounds(HCMC_SITES.map((s) => [s.lat, s.lng]));
    map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapRef.current) return;

      setLeafletReady(true);
      const map = L.map(mapContainerRef.current, {
        center: [10.8231, 106.6297],
        zoom: 11,
        zoomControl: true,
      });
      mapRef.current = map;

      const cfg = MAP_LAYERS[activeLayer];
      const initialLayer = L.tileLayer(cfg.url, {
        subdomains: cfg.subdomains || "abc",
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
      });
      initialLayer.addTo(map);
      tileLayerRef.current = initialLayer;

      // Fit all historical sites comfortably on screen
      const bounds = L.latLngBounds(HCMC_SITES.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });

      // Trigger redraw to eliminate any grey tile glitch
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      HCMC_SITES.forEach((site) => {
        const iconHtml = `
          <div style="
            background:${site.color};
            color:#fff;
            width:36px;height:36px;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
            border:3px solid #fff;
            box-shadow:0 3px 10px rgba(0,0,0,0.35);
            cursor:pointer;
            transition:transform 0.15s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            ${site.image}
          </div>
        `;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18],
        });

        const popupContent = `
          <div style="font-family:system-ui, -apple-system, sans-serif; min-width:190px; text-align:center; padding:2px;">
            <div style="font-size:26px; margin-bottom:4px;">${site.image}</div>
            <div style="font-weight:800; font-size:13px; color:#111; margin-bottom:2px;">${site.name}</div>
            <div style="font-size:10px; color:${site.color}; font-weight:700; text-transform:uppercase; margin-bottom:8px;">${site.category}</div>
            
            <div style="display:flex; flex-direction:column; gap:5px;">
              <button id="map-360-btn-${site.id}" style="
                background: linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff;
                border:none; padding:7px 10px; border-radius:8px;
                font-size:11px; font-weight:800; cursor:pointer; width:100%;
                display:flex; align-items:center; justify-content:center; gap:5px;
                box-shadow: 0 2px 6px rgba(37,99,235,0.35);
              ">🧭 Không gian 360° VR</button>
              
              <button id="map-btn-${site.id}" style="
                background:#f1f5f9; color:#334155;
                border:1px solid #cbd5e1; padding:5px 10px; border-radius:8px;
                font-size:11px; font-weight:700; cursor:pointer; width:100%;
              ">📜 Xem tư liệu & đố vui →</button>
            </div>
          </div>
        `;

        const marker = L.marker([site.lat, site.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent);

        // Clicking the marker also opens the detail panel directly
        marker.on("click", () => {
          pickSiteRef.current(site);
        });

        marker.on("popupopen", () => {
          const btn360 = document.getElementById(`map-360-btn-${site.id}`);
          if (btn360) {
            btn360.onclick = () => {
              pickSiteRef.current(site);
              open360ModalRef.current(site);
            };
          }
          const btn = document.getElementById(`map-btn-${site.id}`);
          if (btn) {
            btn.onclick = () => pickSiteRef.current(site);
          }
        });

        markersRef.current.push(marker);
      });
    };

    if (!(window as any).L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pickSite]);

  // ResizeObserver guarantees map tiles resize cleanly with 0 grey canvas
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 180);

    const ro = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    ro.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [selectedSite, leafletReady]);

  // Listen for Escape key to close 360 modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && is360ModalOpen) {
        setIs360ModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [is360ModalOpen]);

  return (
    <div className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">
      
      {/* HEADER BẢN ĐỒ */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-[10px] font-extrabold uppercase tracking-wider">
              Bản Đồ Di Tích QPAN
            </span>
            <span className="text-[10px] text-slate-400 font-mono">TP. Hồ Chí Minh</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
            Di Tích Lịch Sử & Quốc Phòng An Ninh
          </h2>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => open360Modal(selectedSite || HCMC_SITES[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer mr-1"
            title="Trải nghiệm tham quan thực tế ảo 360° các địa điểm di tích"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Toàn Cảnh 360° VR</span>
          </button>

          {HCMC_SITES.map((s) => (
            <button key={s.id}
              onClick={() => { pickSite(s); if (mapRef.current) mapRef.current.flyTo([s.lat, s.lng], 14, { duration: 1 }); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all hover:shadow-sm cursor-pointer"
              style={{ borderColor: s.color, color: s.color, background: `${s.color}12` }}>
              <span>{s.image}</span>
              <span className="hidden lg:inline">{s.name.split(" ").slice(-2).join(" ")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAP + PANEL */}
      <div className="flex flex-col lg:flex-row h-[500px] lg:h-[620px]">

        {/* MAP */}
        <div className="flex-1 relative h-full min-h-[360px]">
          {!leafletReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10 gap-3">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-mono">Đang tải bản đồ di tích...</p>
            </div>
          )}

          {/* FLOATING MAP LAYER SWITCHER & CONTROLS */}
          <div className="absolute top-3 right-3 z-[400] flex items-center gap-1 p-1 sm:p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 shadow-2xl">
            {(Object.keys(MAP_LAYERS) as MapLayerId[]).map((key) => {
              const cfg = MAP_LAYERS[key];
              const isActive = activeLayer === key;
              return (
                <button
                  key={key}
                  onClick={() => applyLayer(key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/40"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                  title={`Chuyển sang bản đồ ${cfg.name}`}
                >
                  <span>{cfg.icon}</span>
                  <span className="hidden sm:inline">{cfg.name}</span>
                </button>
              );
            })}

            <div className="w-[1px] h-5 bg-white/20 mx-0.5 hidden sm:block" />

            <button
              onClick={fitAllBounds}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Xem toàn cảnh tất cả di tích TP.HCM"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Toàn cảnh</span>
            </button>
          </div>

          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* DETAIL PANEL */}
        {selectedSite && (
          <div key={selectedSite.id} className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#111827] h-full transition-colors">

            {/* IMAGE */}
            <div className="relative w-full h-44 overflow-hidden shrink-0" style={{ background: `${selectedSite.color}18` }}>
              {isImgLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${selectedSite.color}60`, borderTopColor: "transparent" }} />
                  <span className="text-xs text-slate-400">Đang tải ảnh...</span>
                </div>
              ) : imgUrl ? (
                <img src={imgUrl} alt={selectedSite.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-5xl">{selectedSite.image}</span>
                  <span className="text-xs text-slate-400 font-mono">{selectedSite.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white backdrop-blur-sm" style={{ background: `${selectedSite.color}dd` }}>
                {selectedSite.category}
              </div>
              <button onClick={() => setSelectedSite(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer backdrop-blur-sm transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-12">
                <div className="text-white font-extrabold text-lg leading-tight drop-shadow-lg">
                  {selectedSite.image} {selectedSite.name}
                </div>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: selectedSite.color }} />
              <span className="flex-1 truncate">{selectedSite.address}</span>
              <span className="shrink-0 text-[9px] bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded font-mono">🕐 {selectedSite.openHours}</span>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <button
                onClick={() => setActiveDetailTab("info")}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeDetailTab === "info"
                    ? "border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800/80"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tư Liệu & Đố Vui</span>
              </button>
              <button
                onClick={() => setActiveDetailTab("360")}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeDetailTab === "360"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800/80"
                    : "border-transparent text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Không Gian 360°</span>
                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-[9px] font-black rounded-full uppercase">VR</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeDetailTab === "360" ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                    <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{selectedSite.viewName360}</span>
                  </div>
                  <button
                    onClick={() => open360Modal(selectedSite)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0 ml-2"
                    title="Mở toàn màn hình"
                  >
                    <Maximize2 className="w-3 h-3" /> Toàn cảnh
                  </button>
                </div>

                {/* NOTE FOR SITES WITHOUT CAR STREETVIEW */}
                {selectedSite.note360 && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm shrink-0">🛡️</span>
                      <span>{selectedSite.note360}</span>
                    </div>
                    <a
                      href={selectedSite.vrTour360Url || "https://map3d.visithcmc.vn"}
                      target="_blank"
                      rel="noreferrer"
                      className="self-start px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{selectedSite.vrTour360Url?.includes("scene_1_1_2") ? "Mở Trực Tiếp VR Tour 360 Củ Chi" : "Mở VR Tour 360"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* IFRAME 360 PREVIEW */}
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-inner group">
                  <iframe
                    src={getSiteEmbedUrl(selectedSite, selectedSite.hasStreetView ? "streetview" : "satellite")}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`360 Street View ${selectedSite.name}`}
                  />

                  <button
                    onClick={() => open360Modal(selectedSite)}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-black text-white text-[11px] font-bold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Bật Toàn Màn Hình</span>
                  </button>
                </div>

                {/* TIPS & GOOGLE MAPS LINK */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Hướng dẫn tương tác:
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li>Kéo chuột hoặc vuốt để xoay quan sát toàn cảnh 360° xung quanh di tích.</li>
                    <li>Lăn con chuột hoặc nhúm ngón tay để phóng to/thu nhỏ chi tiết trận địa.</li>
                    <li>Bấm &quot;Vào VR Tour&quot; để mở chế độ tham quan toàn màn hình độ phân giải cao.</li>
                  </ul>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={getGoogleMapsExternalUrl(selectedSite)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" /> Mở trên Google Maps
                    </a>
                    <button
                      onClick={() => open360Modal(selectedSite)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-sm shadow-blue-600/30"
                    >
                      <Compass className="w-3.5 h-3.5" /> Vào VR Tour
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* 360 STREET VIEW QUICK PROMO BANNER */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/50 flex flex-col gap-2 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                        <Compass className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-blue-950 dark:text-blue-200">
                          {selectedSite.hasStreetView ? "Thực tế ảo 360° Street View" : "Sa bàn Vệ tinh Quân sự 3D"}
                        </div>
                        <div className="text-[10px] text-blue-700/80 dark:text-blue-300/80 truncate">
                          {selectedSite.viewName360 || "Quan sát góc nhìn toàn cảnh di tích"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveDetailTab("360")}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{selectedSite.hasStreetView ? "Xem thử 360°" : "Xem Sa bàn 3D"}</span>
                    </button>
                    <button
                      onClick={() => open360Modal(selectedSite)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Mở toàn cảnh</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Giới thiệu
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">{selectedSite.description}</p>
                </div>

                <div className="p-4 rounded-2xl border" style={{ background: `${selectedSite.color}08`, borderColor: `${selectedSite.color}25` }}>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: selectedSite.color }}>
                    <Shield className="w-3.5 h-3.5" /> Ý nghĩa Lịch sử & QPAN
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">{selectedSite.significance}</p>
                </div>

                {activeQuiz && (
                  <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-slate-900/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-widest">
                        <Star className="w-3.5 h-3.5 fill-current" /> Câu hỏi ôn tập ngẫu nhiên
                      </span>
                      <button onClick={shuffleQuiz} className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-800 font-bold cursor-pointer transition-colors">
                        <RefreshCw className="w-3 h-3" /> Đổi câu
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-white font-semibold leading-relaxed">❓ {activeQuiz.q}</p>
                    {!showAnswer ? (
                      <button onClick={() => {
                        setShowAnswer(true);
                        const { xpGained } = recordMapAnswer(selectedSite.id);
                        if (xpGained > 0) fireXPToast(xpGained, "Xem đáp án bản đồ");
                      }} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer" style={{ background: selectedSite.color }}>
                        Xem Đáp Án <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">✅ Đáp án tham khảo:</div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans">{activeQuiz.a}</p>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => { if (mapRef.current) mapRef.current.flyTo([selectedSite.lat, selectedSite.lng], 15, { duration: 1.5 }); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer hover:shadow-sm transition-all"
                  style={{ borderColor: selectedSite.color, color: selectedSite.color, background: `${selectedSite.color}08` }}>
                  <MapPin className="w-4 h-4" /> Phóng to vị trí trên bản đồ
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span>🗺️ Bản đồ số Di tích & Địa danh Lịch sử Quân sự · Dữ liệu chuẩn Quốc gia</span>
        <span className="font-bold text-red-600 dark:text-red-400">{HCMC_SITES.length} địa điểm · TP.HCM</span>
      </div>

      {/* FULLSCREEN 360 MODAL / VIRTUAL TOUR */}
      {is360ModalOpen && siteFor360 && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col animate-fadeIn">
          {/* TOP BAR */}
          <div className="px-4 py-3 bg-slate-950/90 border-b border-white/15 flex items-center justify-between gap-3 text-white flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md" style={{ background: siteFor360.color }}>
                {siteFor360.image}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold truncate text-white">
                    {siteFor360.name}
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                    {siteFor360.category}
                  </span>
                </div>
                <p className="text-[11px] text-blue-300 truncate font-mono">
                  🧭 {siteFor360.viewName360 || "Góc nhìn thực tế ảo"}
                </p>
              </div>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {/* VIEW MODE TOGGLE */}
              <div className="bg-white/10 p-0.5 rounded-xl flex items-center border border-white/15">
                {siteFor360.hasStreetView !== false ? (
                  <button
                    onClick={() => setViewMode360("streetview")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode360 === "streetview"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                    title="Xem toàn cảnh 360 độ từ mặt đất"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">360° Street View</span>
                  </button>
                ) : (
                  <div
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-500/20 flex items-center gap-1 cursor-default"
                    title="Khu vực hầm ngầm không có xe Street View"
                  >
                    <span>🛡️ Hầm ngầm</span>
                  </div>
                )}
                
                <button
                  onClick={() => setViewMode360("satellite")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode360 === "satellite"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Xem không ảnh vệ tinh 3D từ trên cao"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vệ tinh 3D</span>
                </button>

                <button
                  onClick={() => setViewMode360("map")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode360 === "map"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Xem bản đồ địa danh chuẩn Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bản đồ POI</span>
                </button>
              </div>

              {/* VR 360 TOUR LINK */}
              <a
                href={siteFor360.vrTour360Url || "https://map3d.visithcmc.vn"}
                target="_blank"
                rel="noreferrer"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all"
                title={siteFor360.vrTour360Url?.includes("scene_1_1_2") ? "Mở trực tiếp VR Tour 360 Củ Chi (Sở Du lịch TP.HCM)" : "Mở Bản đồ 3D / 360 Tour chính thức của Sở Du lịch TP.HCM"}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{siteFor360.vrTour360Url?.includes("scene_1_1_2") ? "VR 360 Củ Chi (Trực tiếp)" : "VR 360 TP.HCM"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* OPEN IN EXTERNAL GOOGLE MAPS */}
              <a
                href={getGoogleMapsExternalUrl(siteFor360)}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-colors"
                title="Mở toàn cảnh này trong ứng dụng Google Maps mới nhất"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setIs360ModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Đóng chế độ tham quan (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN IFRAME VIEWER */}
          <div className="flex-1 relative w-full h-full bg-black">
            <iframe
              key={`${siteFor360.id}-${viewMode360}`}
              src={getSiteEmbedUrl(siteFor360, viewMode360)}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Tham quan 360 ${siteFor360.name}`}
            />

            {/* NOTICE BANNER FOR SITES WITHOUT STREET VIEW */}
            {siteFor360.note360 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-slate-900/95 border border-amber-500/50 text-amber-200 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-[94vw]">
                <span className="text-base shrink-0">🛡️</span>
                <span className="text-[11px] leading-relaxed line-clamp-2">{siteFor360.note360}</span>
                <a
                  href={siteFor360.vrTour360Url || "https://map3d.visithcmc.vn"}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{siteFor360.vrTour360Url?.includes("scene_1_1_2") ? "Mở Trực Tiếp VR Tour 360 Củ Chi" : "Mở VR Tour 360"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* FLOATING HINT OVERLAY */}
            {!siteFor360.note360 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[11px] text-slate-200 shadow-xl hidden md:flex items-center gap-2">
                <span>
                  {viewMode360 === "streetview" && "💡 Kéo chuột để xoay 360° · Lăn chuột để zoom · Click mũi tên dưới đất để di chuyển"}
                  {viewMode360 === "satellite" && "🛰️ Sa bàn Vệ tinh Không ảnh 3D · Lăn chuột để zoom cận cảnh trận địa quân sự"}
                  {viewMode360 === "map" && "🗺️ Bản đồ Địa danh Chuẩn Google Maps · Xem thông tin chi tiết và định vị"}
                </span>
              </div>
            )}
          </div>

          {/* BOTTOM SITE SWITCHER DOCK (TELEPORT BETWEEN HISTORICAL SITES) */}
          <div className="p-3 bg-slate-950/95 border-t border-white/15 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            <div className="text-[11px] font-bold text-slate-400 shrink-0 hidden lg:flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Chuyển địa điểm:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1 w-full lg:w-auto">
              {HCMC_SITES.map((s) => {
                const isCurrent = s.id === siteFor360.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSiteFor360(s);
                      pickSite(s);
                      if (s.hasStreetView === false && viewMode360 === "streetview") {
                        setViewMode360("satellite");
                      } else if (s.hasStreetView && viewMode360 === "satellite") {
                        setViewMode360("streetview");
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/40 scale-105"
                        : "bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{s.image}</span>
                    <span>{s.name}</span>
                    {!s.hasStreetView && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">3D</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIs360ModalOpen(false)}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer shrink-0"
            >
              Đóng (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
