export interface SequenceEngine {
  kind: 'wasm' | 'javascript';
  distance(observed: readonly number[], reference: readonly number[], window: number): number;
}

function validate(a: readonly number[], b: readonly number[], window: number) {
  if (a.length !== b.length || a.length < 2 || a.length > 128 ||
      !Number.isInteger(window) || window < 0 || window >= a.length ||
      ![...a, ...b].every(v => Number.isFinite(v) && Math.abs(v) <= 4)) {
    throw new RangeError('Invalid normalized sequence');
  }
}

export const javascriptSequenceEngine: SequenceEngine = {
  kind: 'javascript',
  distance(a, b, window) {
    validate(a, b, window);
    let previous = new Float64Array(a.length + 1).fill(1e100);
    let current = new Float64Array(a.length + 1);
    previous[0] = 0;
    for (let i = 1; i <= a.length; i++) {
      current.fill(1e100);
      for (let j = Math.max(1, i - window); j <= Math.min(a.length, i + window); j++) {
        current[j] = Math.abs(a[i - 1] - b[j - 1]) + Math.min(previous[j - 1], previous[j], current[j - 1]);
      }
      [previous, current] = [current, previous];
    }
    return previous[a.length] / a.length;
  },
};

export function sequenceEngineFromInstance(instance: WebAssembly.Instance): SequenceEngine {
  const e = instance.exports;
  const call = (name: string) => {
    if (typeof e[name] !== 'function') throw new Error(`Missing sequence export: ${name}`);
    return e[name] as (...args: number[]) => number;
  };
  if (call('sequence_abi')() !== 1 || call('sequence_capacity')() !== 128 || !(e.memory instanceof WebAssembly.Memory)) {
    throw new Error('Unsupported sequence WASM ABI');
  }
  const memory = e.memory;
  const observedPtr = call('observed_ptr')(), referencePtr = call('reference_ptr')();
  const nativeDistance = call('sequence_distance');
  // Validate both views once before exposing the adapter.
  new Float64Array(memory.buffer, observedPtr, 128);
  new Float64Array(memory.buffer, referencePtr, 128);
  return {
    kind: 'wasm',
    distance(a, b, window) {
      validate(a, b, window);
      const observed = new Float64Array(memory.buffer, observedPtr, 128);
      const reference = new Float64Array(memory.buffer, referencePtr, 128);
      try {
        observed.set(a); reference.set(b);
        const result = nativeDistance(a.length, window);
        if (!Number.isFinite(result) || result < 0) throw new Error('Invalid native sequence result');
        return result;
      } finally {
        observed.fill(0); reference.fill(0);
      }
    },
  };
}
