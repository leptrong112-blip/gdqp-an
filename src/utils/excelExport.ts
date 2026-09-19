import * as XLSX from 'xlsx';
import { 
  type SurveyResponse, 
  type SurveyRole, 
  surveyQuestions, 
  phaseLabel, 
  pairedResponses 
} from '../data/survey';
import { type ExamResultRecord } from '../types/exam';

/**
 * Trình xuất dữ liệu ra file Excel (.xlsx) chuẩn Microsoft Excel
 * Hỗ trợ nhiều Sheet, định dạng độ rộng cột (!cols), thống kê và Unicode tiếng Việt
 */

// Helper: Lưu file Excel trong trình duyệt
function downloadExcelFile(workbook: XLSX.WorkBook, fileName: string) {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Helper: Tính trung bình mảng số
function calculateAverage(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  return Number((numbers.reduce((acc, val) => acc + val, 0) / numbers.length).toFixed(2));
}

// ============================================================================
// 1. XUẤT BÁO CÁO KHẢO SÁT THỰC NGHIỆM (SURVEY REPORT EXPORTER)
// ============================================================================
export interface SurveyExportOptions {
  role?: SurveyRole;
  mode?: 'paired' | 'all';
  grade?: string;
  reportTitle?: string;
}

export function exportSurveyReportToExcel(
  responses: SurveyResponse[],
  options?: SurveyExportOptions
) {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().slice(0, 10);
  const formattedDateTime = new Date().toLocaleString('vi-VN');

  // Lọc dữ liệu theo tùy chọn (nếu có)
  let filtered = [...responses];
  if (options?.grade && options.grade !== 'all') {
    filtered = filtered.filter(r => 
      r.className?.includes(options.grade!) || r.code?.includes(options.grade!)
    );
  }

  const studentRows = filtered.filter(r => r.role === 'student');
  const teacherRows = filtered.filter(r => r.role === 'teacher');

  const studentPairs = pairedResponses(studentRows);
  const teacherPairs = pairedResponses(teacherRows);

  const studentBefore = studentRows.filter(r => r.phase === 'before');
  const studentAfter = studentRows.filter(r => r.phase === 'after');

  const teacherBefore = teacherRows.filter(r => r.phase === 'before');
  const teacherAfter = teacherRows.filter(r => r.phase === 'after');

  // Hàm trích điểm Likert 1-5
  const getLikertScore = (r: SurveyResponse, qId: string): number | null => {
    const val = r.answers[qId]?.[0];
    return val !== undefined ? val + 1 : null;
  };

  // Tính điểm TB Likert theo câu hỏi
  const getMeanScore = (list: SurveyResponse[], qId: string): number => {
    const scores = list.map(r => getLikertScore(r, qId)).filter((v): v is number => v !== null);
    return calculateAverage(scores);
  };

  // Điểm TB 4 tiêu chí của Học sinh
  const sC1Before = getMeanScore(studentBefore, 'understanding');
  const sC1After = getMeanScore(studentAfter, 'understanding');

  const sC2Before = getMeanScore(studentBefore, 'visualization');
  const sC2After = getMeanScore(studentAfter, 'visualization');

  const sC3Before = getMeanScore(studentBefore, 'interest');
  const sC3After = getMeanScore(studentAfter, 'interest');

  const sC4Before = getMeanScore(studentBefore, 'review');
  const sC4After = getMeanScore(studentAfter, 'review');

  const sBeforeAvg = calculateAverage([sC1Before, sC2Before, sC3Before, sC4Before].filter(v => v > 0));
  const sAfterAvg = calculateAverage([sC1After, sC2After, sC3After, sC4After].filter(v => v > 0));
  const sGrowth = sBeforeAvg > 0 ? Number((((sAfterAvg - sBeforeAvg) / sBeforeAvg) * 100).toFixed(1)) : 0;

  // Tỷ lệ đánh giá tích cực học sinh
  const sEffectList = studentAfter.map(r => r.answers['effectiveness']?.[0]).filter(v => v !== undefined);
  const sPositiveCount = sEffectList.filter(v => v >= 3).length;
  const sPositiveRate = sEffectList.length ? Math.round((sPositiveCount / sEffectList.length) * 100) : 0;

  // Tỷ lệ học sinh muốn tiếp tục dùng
  const sIntentionList = studentAfter.map(r => r.answers['intention']?.[0]).filter(v => v !== undefined);
  const sIntentionCount = sIntentionList.filter(v => v >= 3).length;
  const sIntentionRate = sIntentionList.length ? Math.round((sIntentionCount / sIntentionList.length) * 100) : 0;

  // Điểm TB 4 tiêu chí của Giáo viên
  const tC1Before = getMeanScore(teacherBefore, 'understanding');
  const tC1After = getMeanScore(teacherAfter, 'understanding');

  const tC2Before = getMeanScore(teacherBefore, 'visualization');
  const tC2After = getMeanScore(teacherAfter, 'visualization');

  const tC3Before = getMeanScore(teacherBefore, 'interest');
  const tC3After = getMeanScore(teacherAfter, 'interest');

  const tC4Before = getMeanScore(teacherBefore, 'review');
  const tC4After = getMeanScore(teacherAfter, 'review');

  const tBeforeAvg = calculateAverage([tC1Before, tC2Before, tC3Before, tC4Before].filter(v => v > 0));
  const tAfterAvg = calculateAverage([tC1After, tC2After, tC3After, tC4After].filter(v => v > 0));
  const tGrowth = tBeforeAvg > 0 ? Number((((tAfterAvg - tBeforeAvg) / tBeforeAvg) * 100).toFixed(1)) : 0;

  // Tỷ lệ GV đánh giá hỗ trợ tốt / rất tốt
  const tEffectList = teacherAfter.map(r => r.answers['effectiveness']?.[0]).filter(v => v !== undefined);
  const tSupportCount = tEffectList.filter(v => v >= 3).length;
  const tSupportRate = tEffectList.length ? Math.round((tSupportCount / tEffectList.length) * 100) : 0;

  // Tỷ lệ GV sẵn sàng ứng dụng lâu dài
  const tIntentionList = teacherAfter.map(r => r.answers['intention']?.[0]).filter(v => v !== undefined);
  const tReadyCount = tIntentionList.filter(v => v >= 3).length;
  const tReadyRate = tIntentionList.length ? Math.round((tReadyCount / tIntentionList.length) * 100) : 0;

  // --------------------------------------------------------------------------
  // SHEET 1: TỔNG HỢP BÁO CÁO (Tong_Hop_Bao_Cao)
  // --------------------------------------------------------------------------
  const summaryAoa: (string | number | null)[][] = [
    ['BỘ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG THPT'],
    ['BÁO CÁO KẾT QUẢ KHẢO SÁT THỰC NGHIỆM ỨNG DỤNG 3D & WEBAR TRONG DẠY HỌC GDQP-AN'],
    [`Thời gian xuất báo cáo: ${formattedDateTime} | Người tạo: Quản trị viên hệ thống`],
    [],
    ['I. THỐNG KÊ MẪU KHẢO SÁT THỰC NGHIỆM'],
    ['Đối tượng khảo sát', 'Trước trải nghiệm', 'Sau trải nghiệm', 'Ghép cặp cùng người', 'Tổng số phiếu'],
    ['Học sinh (Khối 10, 11, 12)', studentBefore.length, studentAfter.length, studentPairs.length, studentRows.length],
    ['Giáo viên bộ môn GDQP-AN', teacherBefore.length, teacherAfter.length, teacherPairs.length, teacherRows.length],
    ['Tổng toàn trường', studentBefore.length + teacherBefore.length, studentAfter.length + teacherAfter.length, studentPairs.length + teacherPairs.length, filtered.length],
    [],
    ['II. SO SÁNH NĂNG LỰC HỌC TẬP CỦA HỌC SINH (THANG ĐIỂM LIKERT 1 - 5)'],
    ['STT', 'Tiêu chí đánh giá', 'Trước khi áp dụng 3D', 'Sau khi áp dụng 3D', 'Chênh lệch (+/-)', 'Tỷ lệ tăng trưởng (%)', 'Đánh giá mức độ'],
    [
      1, 
      'Mức độ hiểu và ghi nhớ nội dung thực hành GDQP-AN', 
      sC1Before, 
      sC1After, 
      Number((sC1After - sC1Before).toFixed(2)), 
      sC1Before > 0 ? `+${(((sC1After - sC1Before) / sC1Before) * 100).toFixed(1)}%` : '—',
      sC1After >= 4.0 ? 'Rất tốt (Đạt chuẩn)' : 'Khá'
    ],
    [
      2, 
      'Khả năng trực quan hóa và hình dung rõ động tác, tư thế', 
      sC2Before, 
      sC2After, 
      Number((sC2After - sC2Before).toFixed(2)), 
      sC2Before > 0 ? `+${(((sC2After - sC2Before) / sC2Before) * 100).toFixed(1)}%` : '—',
      sC2After >= 4.0 ? 'Rất rõ ràng & Trực quan' : 'Khá'
    ],
    [
      3, 
      'Mức độ hứng thú và yêu thích môn học GDQP-AN', 
      sC3Before, 
      sC3After, 
      Number((sC3After - sC3Before).toFixed(2)), 
      sC3Before > 0 ? `+${(((sC3After - sC3Before) / sC3Before) * 100).toFixed(1)}%` : '—',
      sC3After >= 4.0 ? 'Hào hứng, say mê' : 'Tích cực'
    ],
    [
      4, 
      'Khả năng tự học và tự ôn tập nội dung thực hành ngoài giờ', 
      sC4Before, 
      sC4After, 
      Number((sC4After - sC4Before).toFixed(2)), 
      sC4Before > 0 ? `+${(((sC4After - sC4Before) / sC4Before) * 100).toFixed(1)}%` : '—',
      sC4After >= 4.0 ? 'Chủ động, dễ ôn tập' : 'Khá'
    ],
    [
      '★', 
      'ĐIỂM TRUNG BÌNH TỔNG HỢP NĂNG LỰC HỌC SINH', 
      sBeforeAvg, 
      sAfterAvg, 
      Number((sAfterAvg - sBeforeAvg).toFixed(2)), 
      `+${sGrowth}%`, 
      'Tiến bộ vượt bậc'
    ],
    [],
    ['Chỉ số trải nghiệm bổ sung của Học sinh', 'Giá trị đạt được', 'Tỷ lệ %', 'Mô tả ý nghĩa'],
    ['Đánh giá hiệu quả 3D tốt hơn truyền thống', `${sPositiveCount}/${sEffectList.length} học sinh`, `${sPositiveRate}%`, 'Phần lớn học sinh khẳng định mô phỏng trực quan hơn hẳn đọc sách thông thường'],
    ['Nguyện vọng tiếp tục sử dụng ứng dụng để học tập', `${sIntentionCount}/${sIntentionList.length} học sinh`, `${sIntentionRate}%`, 'Nhu cầu cao đối với việc số hóa tài liệu giáo dục quốc phòng'],
    [],
    ['III. ĐÁNH GIÁ SƯ PHẠM CỦA GIÁO VIÊN BỘ MÔN GDQP-AN'],
    ['STT', 'Tiêu chí sư phạm chuyên môn', 'Trước khi áp dụng 3D', 'Sau khi áp dụng 3D', 'Chênh lệch (+/-)', 'Tỷ lệ tăng trưởng (%)', 'Nhận định chuyên môn'],
    [
      1, 
      'Mức độ học sinh hiểu và nắm bắt động tác thực hành', 
      tC1Before, 
      tC1After, 
      Number((tC1After - tC1Before).toFixed(2)), 
      tC1Before > 0 ? `+${(((tC1After - tC1Before) / tC1Before) * 100).toFixed(1)}%` : '—',
      'Tiếp thu bài nhanh'
    ],
    [
      2, 
      'Khả năng minh họa rõ ràng các động tác kỹ chiến thuật khó', 
      tC2Before, 
      tC2After, 
      Number((tC2After - tC2Before).toFixed(2)), 
      tC2Before > 0 ? `+${(((tC2After - tC2Before) / tC2Before) * 100).toFixed(1)}%` : '—',
      'Khắc phục hạn chế sân bãi'
    ],
    [
      3, 
      'Mức độ học sinh hào hứng và tập trung trong tiết học', 
      tC3Before, 
      tC3After, 
      Number((tC3After - tC3Before).toFixed(2)), 
      tC3Before > 0 ? `+${(((tC3After - tC3Before) / tC3Before) * 100).toFixed(1)}%` : '—',
      'Tập trung cao độ'
    ],
    [
      4, 
      'Khả năng hỗ trợ học sinh tự rèn luyện và ôn thi ngoài giờ', 
      tC4Before, 
      tC4After, 
      Number((tC4After - tC4Before).toFixed(2)), 
      tC4Before > 0 ? `+${(((tC4After - tC4Before) / tC4Before) * 100).toFixed(1)}%` : '—',
      'Hỗ trợ đắc lực'
    ],
    [
      '★', 
      'ĐIỂM TRUNG BÌNH SƯ PHẠM CHUYÊN MÔN', 
      tBeforeAvg, 
      tAfterAvg, 
      Number((tAfterAvg - tBeforeAvg).toFixed(2)), 
      `+${tGrowth}%`, 
      'Hiệu quả sư phạm cao'
    ],
    [],
    ['Chỉ số ứng dụng sư phạm của Giáo viên', 'Giá trị đạt được', 'Tỷ lệ %', 'Mô tả ý nghĩa'],
    ['Đánh giá khả năng hỗ trợ dạy học Tốt / Rất tốt', `${tSupportCount}/${tEffectList.length} giáo viên`, `${tSupportRate}%`, 'Phần mềm đáp ứng tốt yêu cầu đổi mới phương pháp dạy học số'],
    ['Sẵn sàng giới thiệu và sử dụng lâu dài', `${tReadyCount}/${tIntentionList.length} giáo viên`, `${tReadyRate}%`, 'Sự đồng thuận cao trong việc nhân rộng mô hình tại các trường THPT'],
    [],
    ['IV. KẾT LUẬN & KHUYẾN NGHỊ SƯ PHẠM'],
    ['1. Kết luận thực nghiệm:', 'Ứng dụng mô phỏng 3D & WebAR trong môn GDQP-AN giúp nâng cao toàn diện cả 4 chỉ số nhận thức của học sinh, giải quyết triệt để vấn đề trừu tượng và thiếu thốn học cụ thực tế.'],
    ['2. Khuyến nghị:', 'Cần tiếp tục hoàn thiện thêm các tư thế chiến thuật mới và nhân rộng cho các tổ bộ môn trong nhà trường sử dụng trong các tiết giảng dạy lý thuyết lẫn thực hành.']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [
    { wch: 6 },   // STT
    { wch: 52 },  // Tiêu chí
    { wch: 22 },  // Trước
    { wch: 22 },  // Sau
    { wch: 18 },  // Chênh lệch
    { wch: 24 },  // Tỷ lệ tăng
    { wch: 32 },  // Đánh giá
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Hop_Bao_Cao');

  // --------------------------------------------------------------------------
  // SHEET 2: KHẢO SÁT HỌC SINH (Khao_Sat_Hoc_Sinh)
  // --------------------------------------------------------------------------
  const studentHeaders = [
    'STT',
    'Mã phản hồi',
    'Mã học sinh',
    'Họ và tên',
    'Lớp',
    'Trường',
    'Giai đoạn',
    'Thời gian gửi',
    'Hiểu & Ghi nhớ (1-5)',
    'Hình dung động tác (1-5)',
    'Hứng thú học tập (1-5)',
    'Tự ôn tập ngoài giờ (1-5)',
    'Khó khăn học tập (Trước 3D)',
    'Khó khăn kỹ thuật (Sau 3D)',
    'Đánh giá hiệu quả 3D',
    'Mức độ hỗ trợ của 3D',
    'Muốn tiếp tục sử dụng',
    'Ý kiến đóng góp & Đề xuất'
  ];

  const studentDataRows = studentRows.map((r, idx) => {
    const questions = surveyQuestions(r.role, r.phase);
    const getAnswerText = (qId: string) => {
      const q = questions.find(item => item.id === qId);
      if (!q || !r.answers[qId]) return '';
      return r.answers[qId].map(i => q.options[i]).filter(Boolean).join('; ');
    };

    const c1 = getLikertScore(r, 'understanding');
    const c2 = getLikertScore(r, 'visualization');
    const c3 = getLikertScore(r, 'interest');
    const c4 = getLikertScore(r, 'review');

    return [
      idx + 1,
      r.id,
      r.code,
      r.name || r.username || 'Học sinh',
      r.className || 'Chưa phân lớp',
      r.school || 'THPT',
      phaseLabel[r.phase],
      r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '',
      c1 ?? '—',
      c2 ?? '—',
      c3 ?? '—',
      c4 ?? '—',
      r.phase === 'before' ? getAnswerText('barriers') : '—',
      r.phase === 'after' ? getAnswerText('technical') : '—',
      r.phase === 'after' ? getAnswerText('effectiveness') : '—',
      r.phase === 'after' ? getAnswerText('support') : '—',
      r.phase === 'after' ? getAnswerText('intention') : '—',
      r.feedback || ''
    ];
  });

  const wsStudent = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentDataRows]);
  wsStudent['!cols'] = [
    { wch: 6 },   // STT
    { wch: 14 },  // Mã phản hồi
    { wch: 14 },  // Mã HS
    { wch: 24 },  // Họ tên
    { wch: 12 },  // Lớp
    { wch: 22 },  // Trường
    { wch: 18 },  // Giai đoạn
    { wch: 20 },  // Thời gian
    { wch: 18 },  // C1
    { wch: 18 },  // C2
    { wch: 18 },  // C3
    { wch: 18 },  // C4
    { wch: 30 },  // Khó khăn
    { wch: 30 },  // Kỹ thuật
    { wch: 28 },  // Hiệu quả
    { wch: 25 },  // Hỗ trợ
    { wch: 24 },  // Muốn tiếp tục
    { wch: 35 },  // Góp ý
  ];
  XLSX.utils.book_append_sheet(wb, wsStudent, 'Khao_Sat_Hoc_Sinh');

  // --------------------------------------------------------------------------
  // SHEET 3: KHẢO SÁT GIÁO VIÊN (Khao_Sat_Giao_Vien)
  // --------------------------------------------------------------------------
  const teacherHeaders = [
    'STT',
    'Mã phản hồi',
    'Mã giáo viên',
    'Họ và tên Thầy/Cô',
    'Bộ môn / Vị trí',
    'Trường',
    'Giai đoạn',
    'Thời gian gửi',
    'Đánh giá HS Hiểu bài (1-5)',
    'Khả năng Minh họa động tác (1-5)',
    'Đánh giá HS Hứng thú (1-5)',
    'Hỗ trợ HS Tự ôn tập (1-5)',
    'Đánh giá Hỗ trợ sư phạm của 3D (1-5)',
    'Khó khăn dạy học (Trước 3D)',
    'Khó khăn kỹ thuật (Sau 3D)',
    'Giải quyết khó khăn thực tế',
    'Sẵn sàng giới thiệu & Ứng dụng',
    'Ý kiến đóng góp chuyên môn & Đề xuất'
  ];

  const teacherDataRows = teacherRows.map((r, idx) => {
    const questions = surveyQuestions(r.role, r.phase);
    const getAnswerText = (qId: string) => {
      const q = questions.find(item => item.id === qId);
      if (!q || !r.answers[qId]) return '';
      return r.answers[qId].map(i => q.options[i]).filter(Boolean).join('; ');
    };

    const c1 = getLikertScore(r, 'understanding');
    const c2 = getLikertScore(r, 'visualization');
    const c3 = getLikertScore(r, 'interest');
    const c4 = getLikertScore(r, 'review');
    const c5 = getLikertScore(r, 'effectiveness');

    return [
      idx + 1,
      r.id,
      r.code,
      r.name || r.username || 'Giáo viên',
      r.position || 'Giáo viên GDQP-AN',
      r.school || 'THPT',
      phaseLabel[r.phase],
      r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '',
      c1 ?? '—',
      c2 ?? '—',
      c3 ?? '—',
      c4 ?? '—',
      c5 ?? '—',
      r.phase === 'before' ? getAnswerText('barriers') : '—',
      r.phase === 'after' ? getAnswerText('technical') : '—',
      r.phase === 'after' ? getAnswerText('support') : '—',
      r.phase === 'after' ? getAnswerText('intention') : '—',
      r.feedback || ''
    ];
  });

  const wsTeacher = XLSX.utils.aoa_to_sheet([teacherHeaders, ...teacherDataRows]);
  wsTeacher['!cols'] = [
    { wch: 6 },   // STT
    { wch: 14 },  // Mã
    { wch: 14 },  // Mã GV
    { wch: 24 },  // Họ tên
    { wch: 22 },  // Vị trí
    { wch: 22 },  // Trường
    { wch: 18 },  // Giai đoạn
    { wch: 20 },  // Thời gian
    { wch: 22 },  // C1
    { wch: 22 },  // C2
    { wch: 22 },  // C3
    { wch: 22 },  // C4
    { wch: 24 },  // C5
    { wch: 30 },  // Khó khăn dạy
    { wch: 30 },  // Kỹ thuật
    { wch: 30 },  // Giải quyết
    { wch: 25 },  // Sẵn sàng
    { wch: 35 },  // Góp ý
  ];
  XLSX.utils.book_append_sheet(wb, wsTeacher, 'Khao_Sat_Giao_Vien');

  // --------------------------------------------------------------------------
  // SHEET 4: SO SÁNH GHÉP CẶP HỌC SINH (So_Sanh_Ghep_Cap)
  // --------------------------------------------------------------------------
  if (studentPairs.length > 0) {
    const pairHeaders = [
      'STT',
      'Mã học sinh',
      'Họ và tên',
      'Lớp',
      'Hiểu bài (Trước)',
      'Hiểu bài (Sau)',
      'Tăng C1',
      'Hình dung (Trước)',
      'Hình dung (Sau)',
      'Tăng C2',
      'Hứng thú (Trước)',
      'Hứng thú (Sau)',
      'Tăng C3',
      'Tự ôn (Trước)',
      'Tự ôn (Sau)',
      'Tăng C4',
      'Điểm TB Trước',
      'Điểm TB Sau',
      'Mức tăng (Điểm)',
      'Tăng trưởng (%)'
    ];

    const pairRows = studentPairs.map((p, idx) => {
      const b1 = getLikertScore(p.before, 'understanding') ?? 0;
      const a1 = getLikertScore(p.after, 'understanding') ?? 0;

      const b2 = getLikertScore(p.before, 'visualization') ?? 0;
      const a2 = getLikertScore(p.after, 'visualization') ?? 0;

      const b3 = getLikertScore(p.before, 'interest') ?? 0;
      const a3 = getLikertScore(p.after, 'interest') ?? 0;

      const b4 = getLikertScore(p.before, 'review') ?? 0;
      const a4 = getLikertScore(p.after, 'review') ?? 0;

      const bAvg = calculateAverage([b1, b2, b3, b4].filter(v => v > 0));
      const aAvg = calculateAverage([a1, a2, a3, a4].filter(v => v > 0));
      const diff = Number((aAvg - bAvg).toFixed(2));
      const pct = bAvg > 0 ? `${diff >= 0 ? '+' : ''}${(((aAvg - bAvg) / bAvg) * 100).toFixed(1)}%` : '—';

      return [
        idx + 1,
        p.before.code,
        p.before.name || p.before.username || 'Học sinh',
        p.before.className || 'Chưa phân lớp',
        b1 || '—',
        a1 || '—',
        a1 >= b1 ? `+${a1 - b1}` : `${a1 - b1}`,
        b2 || '—',
        a2 || '—',
        a2 >= b2 ? `+${a2 - b2}` : `${a2 - b2}`,
        b3 || '—',
        a3 || '—',
        a3 >= b3 ? `+${a3 - b3}` : `${a3 - b3}`,
        b4 || '—',
        a4 || '—',
        a4 >= b4 ? `+${a4 - b4}` : `${a4 - b4}`,
        bAvg,
        aAvg,
        diff >= 0 ? `+${diff}` : `${diff}`,
        pct
      ];
    });

    const wsPairs = XLSX.utils.aoa_to_sheet([pairHeaders, ...pairRows]);
    wsPairs['!cols'] = [
      { wch: 6 },   // STT
      { wch: 14 },  // Mã
      { wch: 24 },  // Tên
      { wch: 12 },  // Lớp
      { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPairs, 'So_Sanh_Ghep_Cap');
  }

  // Tên file xuất ra
  const roleSuffix = options?.role ? `_${options.role}` : '';
  const fileName = `Bao_Cao_Khao_Sat_GDQP_3D${roleSuffix}_${timestamp}.xlsx`;

  downloadExcelFile(wb, fileName);
}


// ============================================================================
// 2. XUẤT BẢNG ĐIỂM KIỂM TRA ĐÁNH GIÁ (EXAM RESULTS EXPORTER)
// ============================================================================
export function exportExamResultsToExcel(
  records: ExamResultRecord[],
  examTitle: string = 'Kiểm tra GDQP-AN'
) {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().slice(0, 10);
  const formattedDateTime = new Date().toLocaleString('vi-VN');

  // Tính các thông số thống kê
  const totalCount = records.length;
  const scores = records.map(r => r.score);
  const avgScore = calculateAverage(scores);
  const highestScore = scores.length ? Math.max(...scores) : 0;
  const lowestScore = scores.length ? Math.min(...scores) : 0;

  // Phân loại học tập
  const excellentCount = records.filter(r => r.score >= 8.0).length;
  const goodCount = records.filter(r => r.score >= 6.5 && r.score < 8.0).length;
  const averageCount = records.filter(r => r.score >= 5.0 && r.score < 6.5).length;
  const belowAverageCount = records.filter(r => r.score < 5.0).length;

  const passCount = records.filter(r => r.score >= 5.0).length;
  const passRate = totalCount ? Number(((passCount / totalCount) * 100).toFixed(1)) : 0;

  // --------------------------------------------------------------------------
  // SHEET 1: BẢNG ĐIỂM CHI TIẾT (Bang_Diem_Chi_Tiet)
  // --------------------------------------------------------------------------
  const examSheetData: (string | number)[][] = [
    ['BỘ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG THPT'],
    ['BẢNG TỔNG HỢP KẾT QUẢ ĐIỂM KIỂM TRA MÔN GIÁO DỤC QUỐC PHÒNG VÀ AN NINH (TRỰC TUYẾN)'],
    [`Tên bài kiểm tra: ${examTitle} | Thời gian xuất: ${formattedDateTime}`],
    [`Tổng số bài nộp: ${totalCount} | Điểm trung bình: ${avgScore}/10 | Điểm cao nhất: ${highestScore} | Tỷ lệ Đạt (>=5.0): ${passRate}%`],
    [],
    [
      'STT',
      'Mã học sinh / ID',
      'Họ và tên học sinh',
      'Lớp',
      'Khối lớp',
      'Tên bài thi',
      'Thời gian làm bài',
      'Điểm tổng kết (thang 10)',
      'Xếp loại',
      'Độ chính xác (%)',
      'Điểm Trắc nghiệm (MCQ)',
      'Điểm Đúng/Sai',
      'Điểm Tự luận',
      'Số câu đúng',
      'Tổng số câu',
      'Thời gian nộp bài'
    ]
  ];

  records.forEach((r, idx) => {
    const minutesSpent = Math.floor(r.durationSpentSeconds / 60);
    const secondsSpent = r.durationSpentSeconds % 60;
    const durationText = `${minutesSpent} phút ${secondsSpent.toString().padStart(2, '0')} giây`;

    const gradeText = r.mode === 'all' ? 'Tổng hợp THPT' : `Khối ${r.mode.replace('grade_', '')}`;
    const rankText = r.score >= 8.0 ? 'Giỏi' : r.score >= 6.5 ? 'Khá' : r.score >= 5.0 ? 'Trung bình' : 'Chưa đạt';

    examSheetData.push([
      idx + 1,
      r.studentUsername || r.studentId || r.sessionId.slice(0, 8),
      r.studentName || 'Học sinh',
      r.studentClass || 'Chưa phân lớp',
      gradeText,
      r.examTypeTitle || examTitle,
      durationText,
      r.score,
      rankText,
      `${r.accuracyPercent}%`,
      r.mcqScore,
      r.tfScore,
      r.essayScore ?? 0,
      r.correctCount,
      r.totalQuestions,
      new Date(r.submittedAt).toLocaleString('vi-VN')
    ]);
  });

  const wsExam = XLSX.utils.aoa_to_sheet(examSheetData);
  wsExam['!cols'] = [
    { wch: 6 },   // STT
    { wch: 16 },  // Mã HS
    { wch: 24 },  // Họ tên
    { wch: 12 },  // Lớp
    { wch: 15 },  // Khối
    { wch: 28 },  // Tên đề
    { wch: 18 },  // Thời gian
    { wch: 22 },  // Điểm số
    { wch: 14 },  // Xếp loại
    { wch: 16 },  // Độ chính xác
    { wch: 20 },  // Điểm MCQ
    { wch: 16 },  // Điểm TF
    { wch: 16 },  // Điểm TL
    { wch: 14 },  // Số câu đúng
    { wch: 14 },  // Tổng câu
    { wch: 20 },  // Ngày nộp
  ];
  XLSX.utils.book_append_sheet(wb, wsExam, 'Bang_Diem_Chi_Tiet');

  // --------------------------------------------------------------------------
  // SHEET 2: THỐNG KÊ PHỔ ĐIỂM & THEO LỚP (Thong_Ke_Pho_Diem)
  // --------------------------------------------------------------------------
  const classStatsMap: Record<string, { scores: number[]; passCount: number; goodCount: number }> = {};
  records.forEach(r => {
    const cls = r.studentClass || 'Chưa phân lớp';
    if (!classStatsMap[cls]) {
      classStatsMap[cls] = { scores: [], passCount: 0, goodCount: 0 };
    }
    classStatsMap[cls].scores.push(r.score);
    if (r.score >= 5.0) classStatsMap[cls].passCount++;
    if (r.score >= 6.5) classStatsMap[cls].goodCount++;
  });

  const classRows = Object.entries(classStatsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cls, stat], idx) => {
      const clsAvg = calculateAverage(stat.scores);
      const clsMax = Math.max(...stat.scores);
      const clsMin = Math.min(...stat.scores);
      const clsPassRate = stat.scores.length ? Number(((stat.passCount / stat.scores.length) * 100).toFixed(1)) : 0;
      const clsGoodRate = stat.scores.length ? Number(((stat.goodCount / stat.scores.length) * 100).toFixed(1)) : 0;

      return [
        idx + 1,
        cls,
        stat.scores.length,
        clsMax,
        clsMin,
        clsAvg,
        `${clsPassRate}%`,
        `${clsGoodRate}%`
      ];
    });

  const statsSheetData: (string | number)[][] = [
    ['BỘ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG THPT'],
    ['BÁO CÁO PHÂN TÍCH PHỔ ĐIỂM & CHẤT LƯỢNG HỌC TẬP GDQP-AN'],
    [`Tên bài kiểm tra: ${examTitle} | Ngày phân tích: ${formattedDateTime}`],
    [],
    ['I. THỐNG KÊ PHỔ ĐIỂM TOÀN TRƯỜNG'],
    ['Xếp loại', 'Khung điểm', 'Số lượng bài thi', 'Tỷ lệ phần trăm (%)', 'Ghi chú đánh giá'],
    ['Giỏi', 'Từ 8.0 đến 10.0 điểm', excellentCount, totalCount ? `${((excellentCount / totalCount) * 100).toFixed(1)}%` : '0%', 'Nắm vững toàn diện lý thuyết & thực hành'],
    ['Khá', 'Từ 6.5 đến cận 8.0 điểm', goodCount, totalCount ? `${((goodCount / totalCount) * 100).toFixed(1)}%` : '0%', 'Hiểu bài tốt, thao tác chuẩn xác'],
    ['Trung bình', 'Từ 5.0 đến cận 6.5 điểm', averageCount, totalCount ? `${((averageCount / totalCount) * 100).toFixed(1)}%` : '0%', 'Đạt yêu cầu cơ bản môn học'],
    ['Chưa đạt', 'Dưới 5.0 điểm', belowAverageCount, totalCount ? `${((belowAverageCount / totalCount) * 100).toFixed(1)}%` : '0%', 'Cần bổ sung rèn luyện thêm'],
    ['TỔNG CỘNG', 'Thang 10 điểm', totalCount, '100.0%', `Tỷ lệ Đạt: ${passRate}%`],
    [],
    ['II. THỐNG KÊ KẾT QUẢ THEO TỪNG LỚP HỌC'],
    ['STT', 'Tên Lớp', 'Sĩ số nộp bài', 'Điểm cao nhất', 'Điểm thấp nhất', 'Điểm trung bình', 'Tỷ lệ Đạt (>=5.0)', 'Tỷ lệ Khá Giỏi (>=6.5)'],
    ...classRows
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsSheetData);
  wsStats['!cols'] = [
    { wch: 6 },   // STT
    { wch: 18 },  // Xếp loại / Tên Lớp
    { wch: 24 },  // Khung điểm / Sĩ số
    { wch: 20 },  // Số lượng / Max
    { wch: 20 },  // Tỷ lệ / Min
    { wch: 20 },  // Ghi chú / TB
    { wch: 22 },  // Tỷ lệ Đạt
    { wch: 24 },  // Tỷ lệ Khá Giỏi
  ];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Thong_Ke_Pho_Diem');

  // Lưu file Excel bảng điểm
  const fileName = `Bang_Diem_Kiem_Tra_GDQP_AN_${timestamp}.xlsx`;
  downloadExcelFile(wb, fileName);
}
