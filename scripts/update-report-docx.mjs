import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../artifacts/report_docx/unzipped2/', import.meta.url);
const documentPath = new URL('word/document.xml', root);
const relationshipsPath = new URL('word/_rels/document.xml.rels', root);

const escapeXml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const decodeXml = value => value
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'")
  .replaceAll('&amp;', '&');

const paragraphText = paragraph => decodeXml(
  [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs)]
    .map(match => match[1])
    .join('')
);

function paragraphWithText(original, text, options = {}) {
  const pOpen = original.match(/^<w:p(?:\s[^>]*)?>/)?.[0] || '<w:p>';
  const pPr = original.match(/<w:pPr>.*?<\/w:pPr>/s)?.[0] || '';
  const properties = [
    options.bold ? '<w:b/>' : '',
    options.italic ? '<w:i/>' : '',
    options.color ? `<w:color w:val="${options.color}"/>` : '',
    options.size ? `<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>` : '',
  ].join('');
  const rPr = properties ? `<w:rPr>${properties}</w:rPr>` : '';
  return `${pOpen}${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function drawingRun({ rid, id, name, description, cx, cy }) {
  return `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="${name}" descr="${escapeXml(description)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}" descr="${escapeXml(description)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

function imageParagraph(original, runs) {
  const pOpen = original.match(/^<w:p(?:\s[^>]*)?>/)?.[0] || '<w:p>';
  const pPr = original.match(/<w:pPr>.*?<\/w:pPr>/s)?.[0] || '<w:pPr><w:jc w:val="center"/></w:pPr>';
  return `${pOpen}${pPr}${runs.join('')}</w:p>`;
}

let documentXml = await readFile(documentPath, 'utf8');
let relationshipsXml = await readFile(relationshipsPath, 'utf8');

// The source document declares DrawingML prefixes only on its original image
// nodes. New image nodes share root-level declarations so the package remains
// valid XML after the replacement.
documentXml = documentXml.replace(
  '<w:document ',
  '<w:document xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" '
);

documentXml = documentXml.replaceAll('https://gdqp-3d.netlify.app/', 'https://gdqp-an.gdqp-3d.workers.dev/');
relationshipsXml = relationshipsXml.replaceAll('https://gdqp-3d.netlify.app/', 'https://gdqp-an.gdqp-3d.workers.dev/');

const replacements = [
  {
    starts: 'Bản triển khai công khai hoạt động qua HTTPS tại',
    text: 'Bản triển khai công khai hoạt động qua HTTPS tại gdqp-an.gdqp-3d.workers.dev và cung cấp các lối vào chính cho học tập, mô phỏng 3D, khảo sát theo vai trò, đánh giá và trợ lý AI.',
  },
  {
    starts: 'Rà soát chức năng ghi nhận',
    text: 'Bản thử nghiệm hiện tích hợp cổng học tập, mô phỏng 3D/WebAR, trường bắn, chấm tư thế AI, tài khoản phân vai và khảo sát trước–sau. Trạng thái chức năng được đối chiếu bằng giao diện, mã nguồn và bản triển khai; chưa đồng nghĩa đã kiểm thử trên mọi thiết bị hoặc được thẩm định chuyên môn toàn diện.',
  },
  {
    starts: 'Sản phẩm được tổ chức theo kiến trúc nhiều lớp.',
    text: 'Sản phẩm được tổ chức theo kiến trúc nhiều lớp. React chia giao diện thành các component độc lập [3]; Vite phục vụ phát triển và đóng gói ứng dụng web [4]. Lớp 3D sử dụng Three.js, React Three Fiber và Drei để tải GLB, phát hoạt ảnh và xử lý điều khiển [6]–[8]. Bản công khai dùng Cloudflare Worker cho API, D1 cho tài khoản, phiên đăng nhập và phản hồi khảo sát; localStorage chỉ lưu trạng thái học tập cục bộ.',
  },
  {
    starts: 'Lớp dịch vụ và dữ liệu:',
    text: 'Lớp dịch vụ và dữ liệu: Cloudflare Worker, D1, Gemini và localStorage đảm nhiệm xác thực, khảo sát, phân tích góp ý, lưu trạng thái cục bộ và tích hợp nội dung ngoài.',
  },
  {
    starts: 'Người học chọn khối lớp và nội dung.',
    text: 'Người học chọn khối lớp và nội dung. Ứng dụng nạp dữ liệu tương ứng, hiển thị lý thuyết hoặc cảnh 3D, ghi nhận lựa chọn và phản hồi tức thời. Tài khoản, phiên đăng nhập và kết quả khảo sát được lưu trong D1; tiến độ, điểm cao và lịch sử học tập vẫn được lưu cục bộ theo trình duyệt [12].',
  },
  {
    starts: 'Backend và AI:',
    text: 'Backend và AI: bản công khai dùng Cloudflare Worker và D1 cho xác thực, phân quyền và khảo sát; Gemini 2.5 Flash hỗ trợ phân tích góp ý khảo sát. Máy chủ Node.js/Express vẫn được dùng trong môi trường phát triển cục bộ.',
  },
  {
    starts: 'Trong phiên bản hiện tại, nội dung đáp án nằm phía client',
    text: 'Trong phiên bản hiện tại, nội dung đáp án thi thử nằm phía client nên phù hợp ôn tập, không phù hợp kỳ thi cần bảo mật. Tài khoản và phản hồi khảo sát được lưu phía máy chủ trong D1; tiến độ học tập trong localStorage vẫn có thể mất khi người dùng xóa dữ liệu trình duyệt hoặc đổi thiết bị [12].',
  },
  {
    starts: '[VỊ TRÍ ẢNH MINH CHỨNG NÊN BỔ SUNG TRƯỚC KHI NỘP:',
    text: 'Khảo sát điện tử tách riêng biểu mẫu học sinh và giáo viên; tài khoản quản trị chỉ dùng để tổng hợp phản hồi, so sánh trước–sau và xuất báo cáo.',
  },
  {
    starts: '[ẢNH 3D CẦN CHỤP BỔ SUNG BẰNG THIẾT BỊ THẬT:',
    text: 'Ba màn hình trong Hình 6 minh chứng trực tiếp các nội dung đứng nghiêm, bò cao và bước 3 tháo nắp hộp khóa nòng trên bản triển khai công khai.',
  },
  {
    starts: '[VỊ TRÍ ẢNH MINH CHỨNG NÊN BỔ SUNG:',
    text: 'Hình 7 minh họa giao diện trợ giảng AI. Nội dung trả lời cần được giáo viên GDQP-AN kiểm chứng trước khi sử dụng làm tài liệu học tập hoặc bằng chứng chuyên môn.',
  },
  {
    starts: 'Xây dựng tài khoản người dùng',
    text: 'Hoàn thiện quản trị lớp học, quy trình đặt lại mật khẩu, nhật ký truy cập và cơ chế sao lưu dữ liệu D1; đồng thời đồng bộ tiến độ học tập giữa các thiết bị.',
  },
];

const captionTexts = new Map([
  ['Hình 4.', 'Hình 4. Giao diện trang chủ bản triển khai công khai với nút Tài khoản và lối vào khảo sát.'],
  ['Hình 5.', 'Hình 5. Biểu mẫu khảo sát điện tử tách riêng học sinh và giáo viên, gồm 5 câu trước trải nghiệm và 8 câu sau trải nghiệm.'],
  ['Hình 6.', 'Hình 6. Minh chứng mô hình 3D: đứng nghiêm, bò cao và bước 3 tháo nắp hộp khóa nòng súng AK.'],
]);

const seen = new Map();
documentXml = documentXml.replace(/<w:p(?:\s[^>]*)?>.*?<\/w:p>/gs, paragraph => {
  const text = paragraphText(paragraph).trim();

  if (paragraph.includes('r:embed="rId13"')) {
    seen.set('image-home', 1);
    return imageParagraph(paragraph, [drawingRun({ rid: 'rId36', id: 36, name: 'Trang chủ hiện tại', description: 'Trang chủ Học QPAN 3D với mục tài khoản và khảo sát', cx: 4250000, cy: 2390000 })]);
  }
  if (paragraph.includes('r:embed="rId14"')) {
    seen.set('image-survey', 1);
    return imageParagraph(paragraph, [drawingRun({ rid: 'rId37', id: 37, name: 'Khảo sát theo vai trò', description: 'Biểu mẫu khảo sát dành cho học sinh và giáo viên', cx: 4250000, cy: 2390000 })]);
  }
  if (paragraph.includes('r:embed="rId15"')) {
    seen.set('image-3d', 1);
    return imageParagraph(paragraph, [
      drawingRun({ rid: 'rId38', id: 38, name: 'Đứng nghiêm', description: 'Mô hình 3D động tác đứng nghiêm', cx: 1750000, cy: 1600000 }),
      drawingRun({ rid: 'rId39', id: 39, name: 'Bò cao', description: 'Mô hình 3D động tác bò cao', cx: 1750000, cy: 1600000 }),
      drawingRun({ rid: 'rId40', id: 40, name: 'Tháo súng AK bước 3', description: 'Mô hình 3D bước 3 tháo nắp hộp khóa nòng', cx: 1750000, cy: 1600000 }),
    ]);
  }

  for (const [prefix, replacement] of captionTexts) {
    if (text.startsWith(prefix)) {
      seen.set(`caption-${prefix}`, 1);
      return paragraphWithText(paragraph, replacement, { bold: true, italic: true, color: '17365D' });
    }
  }

  for (const item of replacements) {
    if (text.startsWith(item.starts)) {
      seen.set(item.starts, (seen.get(item.starts) || 0) + 1);
      return paragraphWithText(paragraph, item.text);
    }
  }
  return paragraph;
});

const imageRelationships = [
  ['rId36', 'media/image10.png'],
  ['rId37', 'media/image11.png'],
  ['rId38', 'media/image12.png'],
  ['rId39', 'media/image13.png'],
  ['rId40', 'media/image14.png'],
].map(([id, target]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/>`).join('');

relationshipsXml = relationshipsXml.replace('</Relationships>', `${imageRelationships}</Relationships>`);

const required = [
  'image-home', 'image-survey', 'image-3d',
  'caption-Hình 4.', 'caption-Hình 5.', 'caption-Hình 6.',
  ...replacements.slice(0, 10).map(item => item.starts),
];
const missing = required.filter(key => !seen.has(key));
if (missing.length) throw new Error(`Không tìm thấy vị trí cần cập nhật: ${missing.join(' | ')}`);

await writeFile(documentPath, documentXml, 'utf8');
await writeFile(relationshipsPath, relationshipsXml, 'utf8');
console.log(JSON.stringify({ updated: [...seen.keys()], documentBytes: documentXml.length }, null, 2));
