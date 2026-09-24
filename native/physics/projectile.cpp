// Generic scene animation in arbitrary units. No real weapon parameters.
// Freestanding C++: no allocator, filesystem, WASI imports or global state.

static constexpr int MAX_TRAJECTORY_SAMPLES = 128;
static constexpr int TRAJECTORY_STRIDE = 4; // [time, x, y, z]

static float trajectory_buffer[MAX_TRAJECTORY_SAMPLES * TRAJECTORY_STRIDE];

extern "C" {
__attribute__((export_name("abi_version")))
int abi_version() { return 2; }

__attribute__((export_name("position_axis")))
double position_axis(double position, double velocity, double acceleration, double time) {
    return position + velocity * time + 0.5 * acceleration * time * time;
}

// First downward contact with a horizontal plane, for positive gravity.
__attribute__((export_name("ground_time")))
double ground_time(double height, double velocity, double gravity) {
    if (height <= 0.0 && velocity <= 0.0) return 0.0;
    const double root = __builtin_sqrt(velocity * velocity + 2.0 * gravity * height);
    // Avoid subtracting nearly equal numbers for a downward initial velocity.
    return velocity < 0.0 ? (2.0 * height) / (root - velocity) : (velocity + root) / gravity;
}

__attribute__((export_name("trajectory_buffer_offset")))
int trajectory_buffer_offset() {
    return (int)(unsigned long)trajectory_buffer;
}

__attribute__((export_name("trajectory_buffer_capacity")))
int trajectory_buffer_capacity() {
    return MAX_TRAJECTORY_SAMPLES;
}

__attribute__((export_name("trajectory_buffer_stride")))
int trajectory_buffer_stride() {
    return TRAJECTORY_STRIDE;
}

// Generates a batch trajectory into the static buffer in WebAssembly linear memory.
// Returns the actual sample count written, or 0 if inputs are invalid.
__attribute__((export_name("sample_arcade_trajectory")))
int sample_arcade_trajectory(
    float startX, float startY, float startZ,
    float endX, float endY, float endZ,
    float duration, float lift, int count
) {
    if (duration <= 0.0f || count < 2) return 0;
    if (lift < 0.0f) lift = 0.0f;
    if (count > MAX_TRAJECTORY_SAMPLES) count = MAX_TRAJECTORY_SAMPLES;

    const float ay = -8.0f * lift / (duration * duration);
    const float vx = (endX - startX) / duration;
    const float vy = (endY - startY) / duration - 0.5f * ay * duration;
    const float vz = (endZ - startZ) / duration;

    const float countMinusOne = (float)(count - 1);
    for (int k = 0; k < count; ++k) {
        const float t = ((float)k / countMinusOne) * duration;
        float x, y, z;
        if (k == 0) {
            x = startX;
            y = startY;
            z = startZ;
        } else if (k == count - 1) {
            x = endX;
            y = endY;
            z = endZ;
        } else {
            x = startX + vx * t;
            y = startY + vy * t + 0.5f * ay * t * t;
            z = startZ + vz * t;
        }
        const int idx = k * TRAJECTORY_STRIDE;
        trajectory_buffer[idx + 0] = t;
        trajectory_buffer[idx + 1] = x;
        trajectory_buffer[idx + 2] = y;
        trajectory_buffer[idx + 3] = z;
    }
    return count;
}
}

