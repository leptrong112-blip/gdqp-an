import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../artifacts/report_docx/unzipped2/word/document.xml', import.meta.url);
let xml = await readFile(path, 'utf8');

const decode = value => value
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'").replaceAll('&amp;', '&');
const encode = value => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const textOf = paragraph => decode([...paragraph.matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs)].map(match => match[1]).join(''));
const replaceText = (paragraph, text) => {
  const open = paragraph.match(/^<w:p(?:\s[^>]*)?>/)?.[0] || '<w:p>';
  const pPr = paragraph.match(/<w:pPr>.*?<\/w:pPr>/s)?.[0] || '';
  return `${open}${pPr}<w:r><w:t xml:space="preserve">${encode(text)}</w:t></w:r></w:p>`;
};

const updates = [
  {
    match: text => text.startsWith('Mô hình AI:'),
    text: 'Mô hình AI: bản công khai cấu hình gemini-2.5-flash để phân tích góp ý khảo sát qua @google/genai; tên model và khả dụng có thể thay đổi theo dịch vụ Google [13].',
  },
  {
    match: text => text.includes('Các chỉ số tiến độ trên trang chủ là dữ liệu cục bộ của trình duyệt; chưa có tài khoản hoặc đồng bộ nhiều thiết bị.'),
    text: 'Người học đi từ trang chủ tới bài học theo khối lớp. Hệ thống đã có tài khoản phân vai và lưu khảo sát trên D1; các chỉ số tiến độ học tập trên trang chủ vẫn là dữ liệu cục bộ của trình duyệt và chưa đồng bộ nhiều thiết bị.',
  },
  {
    match: text => text.startsWith('Ưu tiên 3:'),
    text: 'Ưu tiên 3: hoàn thiện quản trị lớp học, quy trình đặt lại mật khẩu, nhật ký truy cập, sao lưu D1 và đồng bộ tiến độ học tập giữa các thiết bị.',
  },
];

const counts = new Array(updates.length).fill(0);
xml = xml.replace(/<w:p(?:\s[^>]*)?>.*?<\/w:p>/gs, paragraph => {
  const text = textOf(paragraph).trim();
  const index = updates.findIndex(item => item.match(text));
  if (index < 0) return paragraph;
  counts[index] += 1;
  return replaceText(paragraph, updates[index].text);
});

if (counts.some(count => count !== 1)) throw new Error(`Số vị trí cập nhật không hợp lệ: ${counts.join(', ')}`);
await writeFile(path, xml, 'utf8');
console.log(JSON.stringify({ counts }));
