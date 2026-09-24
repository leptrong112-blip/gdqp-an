// `tsx` uses os.userInfo() to name its temporary directory on Windows. Some
// restricted Windows hosts expose that API but make it fail before tests load.
// Supplying the Unix-style identifier makes `tsx` use the OS temp directory
// without changing application runtime behavior.
if (process.platform === 'win32' && typeof process.geteuid !== 'function') {
  Object.defineProperty(process, 'geteuid', {
    configurable: true,
    value: () => 0,
  });
}
