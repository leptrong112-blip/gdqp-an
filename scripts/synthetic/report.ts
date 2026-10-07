import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { mean, std } from './audits';
import type { ScenarioResult } from './runner';
import { PROFILES } from './model';

export const DISCLAIMER='Synthetic test results evaluate deterministic software behavior under modeled conditions. They do not establish real-world accuracy on students or real camera performance.';
export function summarize(scenarios:ScenarioResult[]) {
  const byMovement=[...new Set(scenarios.map(s=>s.movement))].map(movement=>{
    const rows=scenarios.filter(s=>s.movement===movement),scores=rows.flatMap(r=>r.actual.score===null?[]:[r.actual.score]);
    const count=(field:'actual'|'expected',status:string)=>rows.filter(r=>r[field].result===status).length;
    return {movement,total:rows.length,match:rows.filter(r=>r.match).length,mismatch:rows.filter(r=>!r.match).length,
      expectedPass:count('expected','PASS'),expectedFail:count('expected','FAIL'),expectedInsufficient:count('expected','INSUFFICIENT_EVIDENCE'),
      actualPass:count('actual','PASS'),actualFail:count('actual','FAIL'),actualInsufficient:count('actual','INSUFFICIENT_EVIDENCE'),
      agreement:rows.filter(r=>r.match).length/rows.length,scoreMean:mean(scores),scoreStd:std(scores)};
  });
  const categories=Object.fromEntries(['FALSE_POSITIVE','FALSE_NEGATIVE','UNEXPECTED_INSUFFICIENT','UNEXPECTED_DECISION','SCORE_OUT_OF_RANGE','STATE_MACHINE_MISMATCH','FINALIZATION_ERROR','CRITERION_MISMATCH'].map(k=>[k,scenarios.filter(s=>s.mismatch.some(m=>m.split(':')[0]===k)).length]));
  return {total:scenarios.length,match:scenarios.filter(s=>s.match).length,mismatch:scenarios.filter(s=>!s.match).length,byMovement,categories,
    lowFpsFailures:scenarios.filter(s=>s.conditions.fps<=8&&!s.match).map(s=>s.testId)};
}
export function scenarioIssues(rows:ScenarioResult[]) {
  return rows.filter(r=>!r.match).map(r=>{
    let cause='Oracle assumption and observed output differ; inspect the bounded trace and re-run with the same seed.',severity='NEEDS_REVIEW';
    if(r.conditions.fps===5&&['attention','atEase','basicDrill'].includes(r.movement)) {severity='HIGH';cause='Static attempt closes after 3000 ms with only 15 samples at 5 FPS, below minimumSamples=18; salute alone waits for minimumSamples. See sessionProcessor.ts and scoringEngine.ts.';}
    else if(r.actual.transitionScored&&r.actual.result==='PASS') cause='Readiness tolerances start atEase scoring before modeled knee motion fully ends. This is not automatically a bug: near-target motion may be inside the allowed stable band. Check score-window overlap using real traces.';
    if(r.scenario==='walking') cause='Modeled root translation during turning was not deducted from torso criterion. Check normalized pivot/root travel and direction-dependent anchors; this model does not simulate ground contact forces.';
    if(['wrong-direction','under-turn','over-turn'].includes(r.scenario)) cause='Observed turn fault coexists with missing final-pose evidence; overall policy reports incomplete. Review FAIL versus INSUFFICIENT precedence without discarding unknown criteria.';
    if(r.scenario.includes('severe')||r.scenario.includes('bad-step')) cause='The 500 ms modeled posture deviation triggers the stability quality gate and ends with insufficient evidence before the wrong posture can be graded. Separating poor acquisition from a genuine wrong hold requires a realistic video replay.';
    if(r.scenario==='tracking-loss-between-steps') cause='No final event by the 90 s virtual budget while waiting for the next precondition. Waiting may be intentional; this is not evidence of duplicate finalization.';
    if(r.scenario==='noise-HIGH') cause='High modeled landmark jitter prevents reliable calibration/readiness. PASS is a stress expectation, not a validated promise for this noise magnitude.';
    return {id:r.testId,severity,categories:r.mismatch,expected:r.expected,actual:r.actual.result,score:r.actual.score,cause,
      reproduce:`npm run test:pose:synthetic -- --testId ${r.testId} --seed ${r.seed}`};
  });
}
export function workbookTables(data:any) {
  const rows:ScenarioResult[]=data.scenarios,summary=data.summary;
  const movementRows=summary.byMovement.map((m:any)=>({movement:m.movement,total:m.total,match:m.match,mismatch:m.mismatch,agreement:m.agreement,
    expected_PASS:m.expectedPass,actual_PASS:m.actualPass,expected_FAIL:m.expectedFail,actual_FAIL:m.actualFail,
    expected_INSUFFICIENT:m.expectedInsufficient,actual_INSUFFICIENT:m.actualInsufficient,score_mean_100:m.scoreMean,score_std_100:m.scoreStd,
    ...Object.fromEntries(Object.keys(summary.categories).map(k=>[k,rows.filter(r=>r.movement===m.movement&&r.mismatch.some(t=>t.split(':')[0]===k)).length]))}));
  const scenarioRows=rows.map(r=>({testId:r.testId,movement:r.movement,scenario:r.scenario,expected:r.expected.result,actual:r.actual.result,match:r.match,
    score_100:r.actual.score,score_10:r.actual.score===null?null:r.actual.score/10,expected_range:JSON.stringify(r.expected.scoreRange??null),
    missing_evidence:r.actual.missingEvidence.join(', '),mismatch:r.mismatch.join(', '),profile:PROFILES[r.conditions.profile].id,seed:r.seed,fps:r.conditions.fps,speed:r.conditions.speed,
    camera:JSON.stringify(r.conditions.camera),noise:r.conditions.noise,occlusion:r.conditions.occlusion,hand:r.conditions.hand,drop:r.conditions.drop,timestamp_anomaly:r.conditions.anomaly,
    expected_criteria:JSON.stringify(r.expected.criteria??{}),actual_required:JSON.stringify(r.actual.requiredCriteria),
    commands:r.commandSequence.map(c=>`${c.command}@${c.timeMs}`).join(' -> '),states:r.stateSequence.map(s=>`${s.movement}:${s.state}@${s.timeMs}`).join(' -> '),
    command_correct:r.actual.commandCorrect,transition_scored:r.actual.transitionScored,finalizations:r.performance.finalizationCount,frozen:r.actual.frozen,
    frames_generated:r.performance.framesGenerated,frames_accepted:r.performance.framesAccepted,frames_rejected:r.performance.framesRejected,frames_dropped:r.performance.framesDropped,
    process_total_ms:r.performance.processorTimeMs,process_median_ms:r.performance.medianMs,process_p90_ms:r.performance.p90Ms,final_frame_cpu_ms:r.performance.finalizationMs,
    final_virtual_ms:r.performance.finalAtMs,hand_samples:JSON.stringify(r.handSamples),corrections:r.actual.corrections.join(' | ')}));
  const criteriaRows=rows.flatMap(r=>r.criteria.flatMap(c=>(c.measurements.length?c.measurements:[{feature:'none',value:null,variability:null}]).map(m=>({
    testId:r.testId,movement:r.movement,criterion:c.id,status:c.statusLevel??'unknown',points_100:c.points,maximum_100:c.maximum,required:!!c.required,
    expected_status:(r.expected.criteria?.[c.id]??[]).join(' / '),feature:m.feature,measurement:m.value,variability:m.variability,feedback:c.specificFeedback??c.feedback}))));
  const perf=rows.map(r=>({group:'scenario',testId:r.testId,movement:r.movement,fps:r.conditions.fps,frames:r.performance.framesAccepted,
    total_ms:r.performance.processorTimeMs,median_ms:r.performance.medianMs,p90_ms:r.performance.p90Ms,final_frame_ms:r.performance.finalizationMs}));
  for(const movement of summary.byMovement.map((m:any)=>m.movement))for(const fps of [5,8,10,12,15,20]) {
    const selected=rows.filter(r=>r.movement===movement&&r.conditions.fps===fps);if(selected.length)perf.push({group:'movement-fps means',testId:`${selected.length} scenarios`,movement,fps,
      frames:mean(selected.map(r=>r.performance.framesAccepted)),total_ms:mean(selected.map(r=>r.performance.processorTimeMs)),median_ms:mean(selected.map(r=>r.performance.medianMs)),
      p90_ms:mean(selected.map(r=>r.performance.p90Ms)),final_frame_ms:mean(selected.flatMap(r=>r.performance.finalizationMs===null?[]:[r.performance.finalizationMs]))});
  }
  return {
    Tong_quan:movementRows,
    Ca_test_synthetic:scenarioRows,
    Chi_tiet_tieu_chi:criteriaRows,
    Performance:[...perf,...data.audits.stress.map((s:any)=>({group:'stress',testId:`${s.frames} frames`,...s}))],
    Run_metadata:[...Object.entries(data.run.metadata).map(([key,value])=>({key,value:typeof value==='string'?value:JSON.stringify(value)})),
      ...data.run.validation.map((v:any)=>({key:v.command,value:`${v.status}: ${v.detail}`})),
      {key:'DISCLAIMER',value:DISCLAIMER},{key:'scoreUnits',value:'Raw scorer points 0–100; display points = raw/10. No rubric change.'},
      {key:'final_frame_cpu_ms',value:'Real performance.now duration of process() producing the final event, includes pipeline overhead. Not isolated finalization or inference.'},
      {key:'counts',value:JSON.stringify({total:summary.total,match:summary.match,mismatch:summary.mismatch})},
      {key:'repeatability',value:JSON.stringify(data.audits.repeatability)},
      {key:'differential',value:'Full 2D/3D rows in normalized JSON audits.differential. Projection divergence is not absolute error.'}],
    Regression_issues:data.issues.map((i:any)=>({id:i.id,severity:i.severity,categories:i.categories.join(', '),expected:JSON.stringify(i.expected),actual:i.actual,score:i.score,cause:i.cause,reproduce:i.reproduce})),
  };
}
export function writeWorkbook(data:any,filename:string) {
  const workbook=XLSX.utils.book_new(),tables=workbookTables(data);
  for(const [name,records] of Object.entries(tables)) {
    const sheet=XLSX.utils.json_to_sheet(records);
    const header=records.length?Object.keys(records.reduce((a:any,b:any)=>({...a,...b}),{})):[];
    sheet['!cols']=header.map(key=>({wch:['cause','value','feedback','commands','states','corrections','reproduce','expected','categories'].includes(key)?65:/testId|scenario|criterion|movement|^id$/.test(key)?35:25}));
    if(sheet['!ref'])sheet['!autofilter']={ref:sheet['!ref']};
    for(const [address,cell] of Object.entries(sheet))if(!address.startsWith('!')&&cell&&typeof cell==='object') {
      if(cell.t==='n')cell.z=Number.isInteger(cell.v)?'0':'0.000';
      if(name==='Tong_quan'&&address.startsWith('E')&&cell.t==='n')cell.z='0.0%';
      // SheetJS CE omits most visual styling. Do not patch XLSX XML or claim frozen panes.
    }
    XLSX.utils.book_append_sheet(workbook,sheet,name);
  }
  XLSX.writeFile(workbook,filename,{compression:true});
  const saved=XLSX.read(fs.readFileSync(filename),{type:'buffer'});
  if(saved.SheetNames.length!==6||XLSX.utils.sheet_to_json(saved.Sheets.Ca_test_synthetic).length!==data.summary.total)throw new Error('Workbook count reconciliation failed');
  return tables;
}
export function markdown(data:any) {
  const s=data.summary,a=data.audits;
  return `# AI Pose synthetic human audit\n\n${DISCLAIMER}\n\n## Kết quả lần chạy\n\n- Tổng scenarios: **${s.total}**; Match: **${s.match}**; Mismatch: **${s.mismatch}**.\n- ${Object.entries(s.categories).map(([k,v])=>`${k}: ${v}`).join('; ')}. Một scenario có thể có nhiều loại mismatch.\n- Đây là độ khớp với oracle mô phỏng, không phải tỷ lệ chính xác trên học sinh.\n- Workbook, JSON và báo cáo được tạo từ cùng object kết quả đã chuẩn hóa; kiểm tra lại workbook sau khi lưu.\n\n| Movement | Scenarios | Match | Mismatch | Actual PASS | Actual FAIL | Actual insufficient |\n|---|---:|---:|---:|---:|---:|---:|\n${s.byMovement.map((m:any)=>`| ${m.movement} | ${m.total} | ${m.match} | ${m.mismatch} | ${m.actualPass} | ${m.actualFail} | ${m.actualInsufficient} |`).join('\n')}\n\n## Kiến trúc và phạm vi\n\n- scripts/synthetic/model.ts sinh landmark 3D theo kích thước thân, góc khớp và thời gian; image là phép chiếu pinhole của chính world skeleton, không chèn trực tiếp feature/điểm.\n- 5 profiles: ${PROFILES.map(p=>p.id).join(', ')}. Đây là biến thể hình học tương đối, không mô hình sinh trắc học đã kiểm định. Chiều dài tay được nội suy khi chào; không mô phỏng lực tiếp xúc hoặc da/quần áo.\n- Lấy bài tập khả dụng từ EXERCISE_CATALOG, MOVEMENTS, commandFlow. aboutFace chưa khả dụng nên không báo là đã test.\n- SessionProcessor thật chạy confidence filter, outlier, quality, smoothing, calibration, feature extraction, thời gian giữ, sequence và scoring. FrameFreshnessGate thật kiểm tra transport. Dùng JavaScript sequence engine của production; không chạy MediaPipe inference/browser camera, GPU hay WASM engine.\n- Virtual clock, không sleep. FPS 5/8/10/12/15/20, tốc độ 450/1400/2800 ms, camera xiên/cao/thấp/xa, mirror chỉ là metadata trình bày.\n- Core suite 160 ca chọn đại diện, không Cartesian. Missing feet/knee/shoulder/wrist, crop, hand missing/blur/low confidence/stale, drop frames có seed, burst và gap.\n- Bàn tay 21 điểm, wrist gắn với cẳng tay, các ngón gập/xòe/ngón cái mở/cổ tay lệch; độ nét/confidence là giá trị mô phỏng, không đo từ ảnh.\n- Oracle nằm trong scenarios.ts, đặt trước khi chạy và không lấy expected từ scorer. Điểm PASS theo policy hiện có >=65/100 khi đủ dữ liệu; một tiêu chí sai không nhất thiết làm tổng FAIL.\n- Chuỗi cơ bản: nghiêm → nghỉ → chào. Có biến thể sai từng bước và mất tracking giữa bước. Những ca bị quality gate chặn không chứng minh đã kiểm thử được bước sau.\n\n## Phát hiện cần ưu tiên\n\n1. **5 FPS:** nghiêm/nghỉ kết thúc cửa sổ 3 s với 15 mẫu nhưng scorer đòi 18. Chào có chờ đủ mẫu; hai bài tĩnh không có cùng điều kiện. Không nới ngưỡng trong task này.\n2. **Sai hướng/góc quay:** điểm tiêu chí giảm nhưng kết luận có thể thành thiếu dữ liệu vì không có tư thế cuối hợp lệ. Cần xem lại ưu tiên FAIL/INSUFFICIENT, không tự nhận thiếu dữ liệu là người dùng làm sai.\n3. **Chuyển sang nghỉ:** cửa sổ chấm có thể bắt đầu khi phần nhỏ chuyển động gối còn tiếp tục. Bộ kiểm tra so với thời điểm mô hình dừng hoàn toàn nghiêm hơn readiness tolerance; đánh dấu NEEDS_REVIEW, không khẳng định tất cả là lỗi.\n4. **Dịch chuyển khi quay:** đối chiếu turnTechnique trong JSON; mô hình dịch thân không chứng nhận đúng/sai kỹ thuật đặt trụ chân ngoài đời.\n5. **Sai tư thế mạnh:** quality/stability có thể từ chối trước khi chấm lỗi. Đã thử chuyển động 500 ms thay vì nhảy landmark tức thời; cần video thật để phân biệt lỗi oracle/mô hình với lỗi sản phẩm.\n6. **Không kết thúc trong budget:** mất tracking giữa bước hoặc jitter cao có thể ở trạng thái chờ. Không coi là duplicate finalize hay tự kết luận memory leak.\n\n## Boundary, repeatability và differential\n\n- ${a.boundaries.length} FeatureRule; ${a.boundaries.filter((r:any)=>!r.rangeValid).length} band không theo thứ tự zeroLo ≤ idealLo ≤ idealHi ≤ zeroHi. Các rule động là metadata và không dùng ruleScore trong route động; không tự sửa threshold.\n- Mỗi rule có ideal/boundaries/midpoint/near-failure/failure; valid bands kiểm tra monotonic hai phía.\n- ${a.repeatability.count} repeats có seed: mean ${a.repeatability.scoreMean.toFixed(3)}/100, std ${a.repeatability.scoreStd.toFixed(5)}. Top criterion variability: ${a.repeatability.criteria.slice(0,5).map((c:any)=>`${c.id} std=${c.std.toFixed(5)}`).join('; ')}.\n- ${a.differential.length} số đo kép trên 3 camera × 4 tư thế. Chênh lệch 2D/3D không phải sai số thực tế và không chứng minh 3D luôn tốt hơn.\n- Reset isolation A→B/B→A: ${a.isolation.filter((r:any)=>r.match).length}/${a.isolation.length}. Snapshot cuối và drill steps được kiểm tra frozen; 5 frame xấu sau kết thúc không làm đổi kết quả.\n\n## Performance\n\n| Active preflight frames | Total CPU wall ms | Median ms | P90 ms | Heap delta bytes |\n|---:|---:|---:|---:|---:|\n${a.stress.map((r:any)=>`| ${r.frames} | ${r.totalMs.toFixed(3)} | ${r.medianMs.toFixed(4)} | ${r.p90Ms.toFixed(4)} | ${r.heapDelta} |`).join('\n')}\n\nfinalizationMs trong JSON là thời gian thật của toàn bộ process() tạo kết quả cuối (upper bound), không phải đồng hồ ảo. Không bao gồm MediaPipe, webcam, transport hoặc UI. Heap delta chịu ảnh hưởng GC, không dùng làm chứng minh leak. Không giữ toàn bộ landmark/frame logs; chỉ bounded trace của ca lệch.\n\n## Tái hiện\n\n\`npm run test:pose:synthetic\` tạo đủ 3 outputs và trả exit 1 nếu có mismatch; đây là lỗi oracle/regression được báo, không giấu bằng đổi expected.\n\n\`npm run test:pose:synthetic -- --testId turnLeft-walking --seed 12345\` chạy đúng một ca, in kết quả và không ghi đè artifacts đầy đủ.\n\nDanh sách issue chi tiết nằm trong JSON issues và sheet Regression_issues. Các kiểm tra phụ nằm trong JSON audits, không cộng vào 160 scenarios.\n\n## Xác minh và giới hạn\n\n${data.run.validation.map((v:any)=>`- ${v.command}: ${v.status}${v.detail?' — '+v.detail:''}`).join('\n')}\n\n**SOFTWARE LOGIC VERIFIED BY SYNTHETIC TESTS:** các đường đi và kết quả thực tế nêu trên; không đồng nghĩa toàn bộ oracle đã khớp.\n\n**MANUAL REAL-WEBCAM VALIDATION REQUIRED:** người thật, ánh sáng, che khuất tự nhiên, nhận diện trái/phải, bàn tay nhỏ trong ảnh, low-end hardware và tính hợp lý sư phạm. Chưa thể chứng nhận độ chính xác này bằng mô phỏng.\n\nKhông ghi synthetic result vào production/student database. Không nhập/xóa/chỉnh dữ liệu Excel học sinh. Không sửa scoring production, không commit/push/deploy. Workbook synthetic dùng xlsx của repo; CE hỗ trợ cột rộng và autofilter, không hứa có styling/freeze panes nâng cao.\n\n## Run metadata\n\n- Git HEAD: ${data.run.metadata.gitHead}\n- Rubric: ${data.run.metadata.rubricVersion}; suite: ${data.run.metadata.suiteVersion}\n- Node: ${data.run.metadata.node}; OS: ${data.run.metadata.os}; CPU: ${data.run.metadata.cpu}\n- Generated: ${data.run.metadata.generatedAt}\n- Source SHA256: ${data.run.metadata.sourceFingerprint}\n- Working tree dirty; SHA256 bao gồm mã nguồn AI Pose, harness và package.json tại lần chạy. Commit HEAD một mình không đủ tái hiện.\n`;
}
export function writeArtifacts(data:any,root=process.cwd()) {
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.mkdirSync(path.join(root,'docs'),{recursive:true});
  fs.writeFileSync(path.join(root,'artifacts/ai-pose-synthetic-results.json'),JSON.stringify(data,null,2)+'\n');
  const normalized=JSON.parse(fs.readFileSync(path.join(root,'artifacts/ai-pose-synthetic-results.json'),'utf8'));
  writeWorkbook(normalized,path.join(root,'artifacts/ai-pose-synthetic-tests.xlsx'));
  const report=markdown(normalized);fs.writeFileSync(path.join(root,'docs/ai-pose-synthetic-human-report.md'),report);
  if(!report.includes(`**${data.summary.total}**; Match: **${data.summary.match}**; Mismatch: **${data.summary.mismatch}**`))throw new Error('Markdown count reconciliation failed');
}
