// Development-only synthetic fixture; never requests a camera or saves a score.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { loadSequenceEngine } from '../src/features/pose-analysis/runtime/loadSequenceEngine';
import { analyzeTurnSequence, type SequenceReport } from '../src/features/pose-analysis/scoring/sequenceAnalysis';
import { SequenceSummary } from '../src/features/pose-analysis/components/SequenceSummary';
import { turnLeftMovement } from '../src/features/pose-analysis/scoring/turnMovements';
import '../src/index.css';

function Smoke() {
  const [report, setReport] = useState<SequenceReport>();
  const [status, setStatus] = useState('Ready: synthetic frames only; no webcam.');
  async function run(reversal: boolean) {
    setStatus('Loading sequence engine…');
    const engine = await loadSequenceEngine();
    const frames = Array.from({ length: 35 }, (_, i) => ({ timestampMs: i * 100,
      bodyYawDeg: Math.max(0, Math.min(90, (i - 6) * 10)), confidence: 0.95, isReliable: true }));
    if (reversal) [0, 25, 55, 65, 20, 20, 55, 75, 90].forEach((yaw, i) => { frames[i + 7].bodyYawDeg = yaw; });
    const result = analyzeTurnSequence(frames, turnLeftMovement.dynamicConfig!, engine);
    setReport(result);
    setStatus(result.status === 'analyzed' && engine.kind === 'wasm' && (reversal ? result.maxReversalDeg > 15 : result.complete)
      ? `PASS: C++ WASM · ${reversal ? 'intermediate reversal detected' : 'complete sequence detected'}` : 'FAIL: inspect report');
  }
  return <main className="max-w-2xl mx-auto p-8 space-y-5 text-slate-900 bg-white">
    <h1 className="text-xl font-bold">Pose sequence smoke test</h1>
    <p role="status">{status}</p>
    <div className="flex gap-4"><button className="rounded bg-cyan-100 p-3" onClick={() => void run(false)}>Test complete sequence</button><button className="rounded bg-amber-100 p-3" onClick={() => void run(true)}>Test reversal</button></div>
    {report && <SequenceSummary report={report} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Smoke />);
