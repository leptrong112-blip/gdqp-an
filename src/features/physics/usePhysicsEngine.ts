import { useEffect, useState } from 'react';
import wasmUrl from './projectile.wasm?url';
import { javascriptPhysics, physicsFromInstance, type PhysicsEngine } from './projectile';

export type PhysicsEngineLoadStatus = 'loading' | 'wasm' | 'fallback';
export interface PhysicsEngineState {
  engine: PhysicsEngine;
  status: PhysicsEngineLoadStatus;
}

let pending: Promise<PhysicsEngine> | undefined;
export function loadPhysicsEngine(): Promise<PhysicsEngine> {
  if (!pending) {
    pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(wasmUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Physics WASM HTTP ${response.status}`);
        // Buffer instantiation also works on hosts without application/wasm MIME.
        const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
        return physicsFromInstance(instance);
      } finally {
        clearTimeout(timeout);
      }
    })().catch(error => {
      pending = undefined; // A later mount can retry after a transient failure.
      console.warn('Physics WASM unavailable; using JavaScript fallback.', error);
      return javascriptPhysics;
    });
  }
  return pending;
}

export function usePhysicsEngine(): PhysicsEngine {
  return usePhysicsEngineState().engine;
}

export function usePhysicsEngineState(): PhysicsEngineState {
  const [state, setState] = useState<PhysicsEngineState>({ engine: javascriptPhysics, status: 'loading' });
  useEffect(() => {
    let active = true;
    void loadPhysicsEngine().then(engine => {
      if (active) setState({ engine, status: engine.kind === 'wasm' ? 'wasm' : 'fallback' });
    });
    return () => { active = false; };
  }, []);
  return state;
}
