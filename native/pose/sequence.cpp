// Bounded scalar Dynamic Time Warping for normalized pose sequences.
// Inputs are copied by the JS adapter; no images or persistent session history.
static constexpr int capacity = 128;
static double observed[capacity];
static double reference[capacity];
static double absolute(double x) { return x < 0 ? -x : x; }
static double minimum(double a, double b) { return a < b ? a : b; }

extern "C" {
__attribute__((export_name("sequence_abi"))) int sequence_abi() { return 1; }
__attribute__((export_name("sequence_capacity"))) int sequence_capacity() { return capacity; }
__attribute__((export_name("observed_ptr"))) double* observed_ptr() { return observed; }
__attribute__((export_name("reference_ptr"))) double* reference_ptr() { return reference; }
__attribute__((export_name("sequence_distance")))
double sequence_distance(int count, int window) {
    if (count < 2 || count > capacity || window < 0 || window >= count) return -1;
    double previous[capacity + 1], current[capacity + 1];
    constexpr double infinity = 1e100;
    for (int j = 0; j <= count; ++j) previous[j] = infinity;
    previous[0] = 0;
    for (int i = 1; i <= count; ++i) {
        for (int j = 0; j <= count; ++j) current[j] = infinity;
        const int begin = i - window > 1 ? i - window : 1;
        const int end = i + window < count ? i + window : count;
        for (int j = begin; j <= end; ++j) {
            current[j] = absolute(observed[i - 1] - reference[j - 1])
                + minimum(previous[j - 1], minimum(previous[j], current[j - 1]));
        }
        for (int j = 0; j <= count; ++j) previous[j] = current[j];
    }
    // Do not retain the user's samples in the shared scratch buffers.
    const double result = previous[count] / count;
    for (int i = 0; i < count; ++i) observed[i] = reference[i] = 0;
    return result;
}
}
