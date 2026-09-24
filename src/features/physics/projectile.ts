export type Vec3 = [number, number, number];

export interface TrajectorySnapshot {
  readonly engine: PhysicsEngine['kind'];
  readonly samples: Float32Array; // Flattened [time, x, y, z, ...]
  readonly sampleCount: number;
  readonly stride: number;
  readonly duration: number;
  readonly start: Vec3;
  readonly end: Vec3;
  readonly lift: number;
}

export interface PhysicsEngine {
  readonly kind: 'wasm' | 'javascript';
  positionAxis(position: number, velocity: number, acceleration: number, time: number): number;
  groundTime(height: number, velocity: number, gravity: number): number;
  sampleArcadeTrajectory(
    start: Vec3,
    end: Vec3,
    duration: number,
    lift?: number,
    count?: number
  ): TrajectorySnapshot;
}

// Identical fallback for devices that cannot load or execute WebAssembly.
export const javascriptPhysics: PhysicsEngine = {
  kind: 'javascript',
  positionAxis: (p, v, a, t) => p + v * t + 0.5 * a * t * t,
  groundTime: (h, v, g) => {
    if (h <= 0 && v <= 0) return 0;
    const root = Math.sqrt(v * v + 2 * g * h);
    return v < 0 ? (2 * h) / (root - v) : (v + root) / g;
  },
  sampleArcadeTrajectory: (start, end, duration, lift = 0.15, count = 64) => {
    finite(...start, ...end, duration, lift, count);
    if (duration <= 0 || lift < 0 || count < 2) {
      throw new RangeError('Invalid arcade trajectory inputs');
    }
    const cap = 128;
    const stride = 4;
    const actualCount = Math.min(Math.max(2, Math.floor(count)), cap);
    const samples = new Float32Array(actualCount * stride);
    const ay = (-8 * lift) / (duration * duration);
    const vx = (end[0] - start[0]) / duration;
    const vy = (end[1] - start[1]) / duration - 0.5 * ay * duration;
    const vz = (end[2] - start[2]) / duration;
    const countMinusOne = actualCount - 1;

    for (let k = 0; k < actualCount; k++) {
      const t = (k / countMinusOne) * duration;
      let x = start[0] + vx * t;
      let y = start[1] + vy * t + 0.5 * ay * t * t;
      let z = start[2] + vz * t;
      if (k === 0) {
        x = start[0];
        y = start[1];
        z = start[2];
      } else if (k === actualCount - 1) {
        x = end[0];
        y = end[1];
        z = end[2];
      }
      const idx = k * stride;
      samples[idx + 0] = t;
      samples[idx + 1] = x;
      samples[idx + 2] = y;
      samples[idx + 3] = z;
    }
    return {
      engine: 'javascript',
      samples,
      sampleCount: actualCount,
      stride,
      duration,
      start: [start[0], start[1], start[2]],
      end: [end[0], end[1], end[2]],
      lift,
    };
  },
};

export function physicsFromInstance(instance: WebAssembly.Instance): PhysicsEngine {
  const e = instance.exports;
  const version = typeof e.abi_version === 'function' ? (e.abi_version() as number) : 0;
  if (version !== 1 && version !== 2) {
    throw new Error('Unsupported physics WASM ABI');
  }
  if (typeof e.position_axis !== 'function' || typeof e.ground_time !== 'function') {
    throw new Error('Unsupported physics WASM ABI');
  }

  return {
    kind: 'wasm',
    positionAxis: e.position_axis as PhysicsEngine['positionAxis'],
    groundTime: e.ground_time as PhysicsEngine['groundTime'],
    sampleArcadeTrajectory: (start, end, duration, lift = 0.15, count = 64) => {
      finite(...start, ...end, duration, lift, count);
      if (duration <= 0 || lift < 0 || count < 2) {
        throw new RangeError('Invalid arcade trajectory inputs');
      }
      const cap = typeof e.trajectory_buffer_capacity === 'function'
        ? (e.trajectory_buffer_capacity() as number)
        : 128;
      const stride = typeof e.trajectory_buffer_stride === 'function'
        ? (e.trajectory_buffer_stride() as number)
        : 4;
      const actualCount = Math.min(Math.max(2, Math.floor(count)), cap);

      const memory = e.memory as WebAssembly.Memory | undefined;
      if (memory && typeof e.sample_arcade_trajectory === 'function' && typeof e.trajectory_buffer_offset === 'function') {
        const written = (e.sample_arcade_trajectory as (
          sx: number, sy: number, sz: number,
          ex: number, ey: number, ez: number,
          dur: number, lft: number, cnt: number
        ) => number)(
          start[0], start[1], start[2],
          end[0], end[1], end[2],
          duration, lift, actualCount
        );
        if (written <= 0) {
          throw new RangeError('Failed to generate native trajectory');
        }
        const offset = (e.trajectory_buffer_offset as () => number)();
        // One-time snapshot copy from WebAssembly linear memory.
        // Do NOT keep a long-lived view to prevent accidental overwrite by future shots.
        const wasmView = new Float32Array(memory.buffer, offset, written * stride);
        const snapshotSamples = new Float32Array(wasmView);
        return {
          engine: 'wasm',
          samples: snapshotSamples,
          sampleCount: written,
          stride,
          duration,
          start: [start[0], start[1], start[2]],
          end: [end[0], end[1], end[2]],
          lift,
        };
      }

      // Fallback if instance ABI v1 lacks batch trajectory export
      return javascriptPhysics.sampleArcadeTrajectory(start, end, duration, lift, count);
    },
  };
}

/** Interpolates 3D position [x, y, z] from a TrajectorySnapshot at time t. */
export function sampleTrajectoryPosition(snapshot: TrajectorySnapshot, time: number, output: Vec3): Vec3 {
  finite(time);
  const { samples, sampleCount, stride, duration } = snapshot;
  if (sampleCount <= 1 || duration <= 0) {
    output[0] = snapshot.start[0];
    output[1] = snapshot.start[1];
    output[2] = snapshot.start[2];
    return output;
  }
  const tClamped = Math.max(0, Math.min(duration, time));
  const u = (tClamped / duration) * (sampleCount - 1);
  const k0 = Math.floor(u);
  const k1 = Math.min(sampleCount - 1, k0 + 1);
  const f = u - k0;

  const idx0 = k0 * stride;
  const idx1 = k1 * stride;

  output[0] = samples[idx0 + 1] * (1 - f) + samples[idx1 + 1] * f;
  output[1] = samples[idx0 + 2] * (1 - f) + samples[idx1 + 2] * f;
  output[2] = samples[idx0 + 3] * (1 - f) + samples[idx1 + 3] * f;
  return output;
}

export interface Flight {
  readonly duration: number;
  readonly snapshot?: TrajectorySnapshot;
  /** Clamped, absolute-time sampling; frame rate does not change the path. */
  sample(time: number, output: Vec3): Vec3;
}

function finite(...values: number[]) {
  if (!values.every(Number.isFinite)) throw new RangeError('Physics inputs must be finite');
}

function flight(engine: PhysicsEngine, position: Vec3, velocity: Vec3, acceleration: Vec3, duration: number, snapshot?: TrajectorySnapshot): Flight {
  finite(...position, ...velocity, ...acceleration, duration);
  if (duration < 0) throw new RangeError('Negative flight duration');
  // Own launch data: caller mutations must not alter an in-flight animation.
  const p = [...position], v = [...velocity], a = [...acceleration];
  return {
    duration,
    snapshot,
    sample(time, output) {
      finite(time);
      const t = Math.max(0, Math.min(duration, time));
      for (let i = 0; i < 3; i++) output[i] = engine.positionAxis(p[i], v[i], a[i], t);
      return output;
    },
  };
}

export function createGroundFlight(engine: PhysicsEngine, position: Vec3, velocity: Vec3, ground: number, gravity: number): Flight {
  finite(...position, ...velocity, ground, gravity);
  if (gravity <= 0 || position[1] < ground) throw new RangeError('Invalid ground flight');
  const duration = engine.groundTime(position[1] - ground, velocity[1], gravity);
  const result = flight(engine, position, velocity, [0, -gravity, 0], duration);
  return {
    duration,
    sample(time, output) {
      result.sample(time, output);
      output[1] = time >= duration ? ground : Math.max(ground, output[1]);
      return output;
    },
  };
}

/** Stylized arcade curve. Its endpoint and timing are game design, not ballistics. */
export function createArcadeFlight(engine: PhysicsEngine, start: Vec3, end: Vec3, duration: number, lift = 0.15): Flight {
  finite(...start, ...end, duration, lift);
  if (duration <= 0 || lift < 0) throw new RangeError('Invalid arcade flight');
  const snapshot = engine.sampleArcadeTrajectory(start, end, duration, lift, 64);
  const acceleration: Vec3 = [0, (-8 * lift) / (duration * duration), 0];
  const velocity = start.map((p, i) => (end[i] - p) / duration - 0.5 * acceleration[i] * duration) as Vec3;
  return flight(engine, start, velocity, acceleration, duration, snapshot);
}
