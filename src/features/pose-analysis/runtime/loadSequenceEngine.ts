import wasmUrl from '../scoring/sequence.wasm?url';
import { javascriptSequenceEngine, sequenceEngineFromInstance, type SequenceEngine } from '../scoring/sequenceEngine';

let pending: Promise<SequenceEngine> | undefined;
export function loadSequenceEngine(): Promise<SequenceEngine> {
  return pending ??= (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(wasmUrl, { signal: controller.signal });
      if (!response.ok) throw new Error(`Sequence WASM HTTP ${response.status}`);
      const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
      return sequenceEngineFromInstance(instance);
    } catch (error) {
      pending = undefined;
      console.warn('Pose sequence WASM unavailable; using JavaScript fallback.', error);
      return javascriptSequenceEngine;
    } finally {
      clearTimeout(timeout);
    }
  })();
}
