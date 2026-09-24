export type SurveyRole = 'student' | 'teacher';
export type SurveyPhase = 'before' | 'after';
export type SurveyQuestion = { id: string; text: string; options: string[]; multiple?: boolean; exclusiveLast?: boolean };
export type SurveyResponse = {
  id: string;
  code: string;
  username?: string;
  name?: string;
  school?: string;
  className?: string;
  position?: string;
  role: SurveyRole;
  phase: SurveyPhase;
  createdAt: string;
  answers: Record<string, number[]>;
  feedback?: string;
};
const levels = ['Rất thấp', 'Thấp', 'Trung bình', 'Cao', 'Rất cao'];
export function surveyQuestions(role: SurveyRole, phase: SurveyPhase): SurveyQuestion[] {
  const student = role === 'student';
  const common: SurveyQuestion[] = [
    { 
      id: 'understanding', 
      text: student 
        ? (phase === 'before' ? 'Em hiểu và ghi nhớ nội dung thực hành GDQP-AN khi học theo phương pháp truyền thống ở mức nào?' : 'Sau khi học với mô phỏng 3D, em hiểu và ghi nhớ nội dung thực hành ở mức nào?') 
        : (phase === 'before' ? 'Thầy/Cô đánh giá mức độ học sinh hiểu và ghi nhớ nội dung thực hành trước đây như thế nào?' : 'Thầy/Cô đánh giá mức độ học sinh hiểu và ghi nhớ khi có mô phỏng 3D hỗ trợ như thế nào?'), 
      options: levels 
    },
    { 
      id: 'visualization', 
      text: student 
        ? (phase === 'before' ? 'Em hình dung rõ các động tác và tình huống thực hành khi nghe giảng/xem tranh ảnh ở mức nào?' : 'Mô phỏng 3D và WebAR giúp em hình dung rõ các động tác thực hành ở mức nào?') 
        : (phase === 'before' ? 'Thầy/Cô có thể minh họa rõ các động tác và tình huống thực hành trước đây ở mức nào?' : 'Khả năng minh họa trực quan các động tác với mô phỏng 3D & WebAR ở mức nào?'), 
      options: levels 
    },
    { 
      id: 'interest', 
      text: student 
        ? (phase === 'before' ? 'Mức độ hứng thú của em với việc học thực hành GDQP-AN trước khi dùng ứng dụng?' : 'Mức độ hứng thú của em với việc học GDQP-AN sau khi trải nghiệm ứng dụng 3D?') 
        : (phase === 'before' ? 'Thầy/Cô đánh giá mức độ hứng thú của học sinh với việc học thực hành trước đây?' : 'Thầy/Cô đánh giá mức độ hứng thú của học sinh sau khi trải nghiệm ứng dụng như thế nào?'), 
      options: levels 
    },
    { 
      id: 'review', 
      text: student 
        ? (phase === 'before' ? 'Khả năng tự ôn tập nội dung thực hành ngoài giờ học của em trước đây ở mức nào?' : 'Khả năng tự ôn tập nội dung thực hành ngoài giờ của em khi có ứng dụng 3D hỗ trợ ở mức nào?') 
        : (phase === 'before' ? 'Khả năng hỗ trợ học sinh ôn tập thực hành ngoài giờ của Thầy/Cô trước đây ở mức nào?' : 'Khả năng hỗ trợ học sinh tự ôn tập thực hành ngoài giờ khi có ứng dụng ở mức nào?'), 
      options: levels 
    },
  ];
  if (phase === 'before') {
    return [
      ...common,
      {
        id: 'barriers',
        text: student ? 'Em đang gặp những khó khăn nào khi học thực hành? (Chọn nhiều)' : 'Thầy/Cô đang gặp những khó khăn nào khi dạy thực hành? (Chọn nhiều)',
        multiple: true,
        exclusiveLast: true,
        options: ['Thiếu sân bãi / dụng cụ', 'Khó hình dung / minh họa động tác', 'Thiếu hứng thú', 'Khó ôn tập ngoài giờ', 'Khó khăn khác', 'Không gặp khó khăn']
      }
    ];
  }
  if (student) {
    return [
      ...common,
      { id: 'effectiveness', text: 'So với nghe giảng và xem tranh ảnh/video, em đánh giá hiệu quả học tập với ứng dụng như thế nào?', options: ['Kém hơn nhiều', 'Kém hơn', 'Ngang bằng', 'Tốt hơn', 'Tốt hơn nhiều'] },
      { id: 'support', text: 'Mô phỏng 3D / WebAR giúp em hình dung động tác và tình huống thực tế ở mức nào?', options: ['Không giúp gì', 'Giúp ít', 'Bình thường', 'Giúp khá nhiều', 'Giúp rất nhiều'] },
      { id: 'intention', text: 'Em có muốn tiếp tục sử dụng ứng dụng để học và ôn tập GDQP-AN không?', options: ['Chắc chắn không', 'Không', 'Phân vân', 'Có', 'Chắc chắn có'] },
      { id: 'technical', text: 'Khi sử dụng 3D / WebAR, bạn gặp khó khăn nào? (Chọn nhiều)', multiple: true, exclusiveLast: true, options: ['Lag / tải chậm', 'Khó thao tác', 'Không tương thích thiết bị', 'Khó khăn khác', 'Không gặp khó khăn'] },
    ];
  }
  // Giáo viên - Sau trải nghiệm: Khớp 100% Phiếu khảo sát của Thầy (Câu 6, 7, 8)
  return [
    ...common,
    {
      id: 'technical',
      text: 'Khi sử dụng hoặc cho học sinh trải nghiệm 3D / WebAR, Thầy/Cô gặp khó khăn nào? (Chọn nhiều)',
      multiple: true,
      exclusiveLast: true,
      options: ['Lag / tải chậm', 'Khó thao tác', 'Không tương thích thiết bị', 'Khó khăn khác', 'Không gặp khó khăn']
    },
    {
      id: 'effectiveness',
      text: 'Thầy/Cô đánh giá khả năng hỗ trợ giảng dạy phần thực hành GDQP của ứng dụng này ở mức nào?',
      options: levels
    },
    {
      id: 'support',
      text: 'Ứng dụng có thể góp phần giải quyết những khó khăn nào trong dạy học thực hành GDQP hiện nay? (Có thể chọn nhiều)',
      multiple: true,
      exclusiveLast: false,
      options: ['Thiếu sân bãi / dụng cụ', 'Khó minh họa động tác', 'Học sinh thiếu hứng thú', 'Khó ôn tập ngoài giờ', 'Khác: ...']
    },
    {
      id: 'intention',
      text: 'Thầy/Cô có sẵn sàng giới thiệu hoặc sử dụng ứng dụng này hỗ trợ dạy học nếu được hoàn thiện hơn không?',
      options: ['Chắc chắn không', 'Không', 'Phân vân', 'Có', 'Chắc chắn có']
    },
  ];
}
export const roleLabel = { student: 'Học sinh', teacher: 'Giáo viên' };
export const phaseLabel = { before: 'Trước trải nghiệm', after: 'Sau trải nghiệm' };
export function pairedResponses(rows: SurveyResponse[]) {
  return rows.filter(r => r.phase === 'before').flatMap(before => {
    const after = rows.find(r => 
      r.phase === 'after' && 
      r.role === before.role && 
      (r.code === before.code || (Boolean(r.name && before.name) && r.name!.trim().toLowerCase() === before.name!.trim().toLowerCase() && (r.className || r.position || '') === (before.className || before.position || '')))
    );
    return after ? [{ before, after }] : [];
  });
}
