import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAuth, makeAccount, saveAccounts } from '../../server/auth';

test('A3: Auth - Admin reset does not require oldPassword, User self-change strictly enforces oldPassword', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'gdqp-auth-test-'));
  const adminPass = 'admin-secure-password';
  const studentPass = 'student-secure-password';
  const accounts = [
    makeAccount('admin', 'Admin User', 'admin', adminPass),
    makeAccount('student_01', 'Student 01', 'student', studentPass),
  ];

  const app = express();
  const auth = createAuth(directory);
  app.use(express.json());
  app.use('/api/survey', auth.router);

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  const request = (route: string, method = 'GET', cookie = '', body?: unknown) =>
    fetch(`${base}/api/survey/${route}`, {
      method,
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  try {
    await saveAccounts(directory, accounts);

    // 1. Log in as admin and student
    const adminLoginRes = await request('login', 'POST', '', { username: 'admin', password: adminPass });
    assert.equal(adminLoginRes.status, 200);
    const adminCookie = adminLoginRes.headers.get('set-cookie')!.split(';')[0];

    const studentLoginRes = await request('login', 'POST', '', { username: 'student_01', password: studentPass });
    assert.equal(studentLoginRes.status, 200);
    const studentCookie = studentLoginRes.headers.get('set-cookie')!.split(';')[0];

    // 2. Student attempts to change another user's password -> 403 Forbidden
    const studentHackingAdmin = await request('change-password', 'POST', studentCookie, {
      targetUsername: 'admin',
      newPassword: 'new-admin-password-123',
    });
    assert.equal(studentHackingAdmin.status, 403);

    // 3. Student changes own password without oldPassword -> 400 Bad Request
    const studentMissingOld = await request('change-password', 'POST', studentCookie, {
      username: 'student_01',
      newPassword: 'new-student-password-123',
    });
    assert.equal(studentMissingOld.status, 400);
    const missingOldBody = await studentMissingOld.json() as { error: string };
    assert.match(missingOldBody.error, /mật khẩu hiện tại/i);

    // 4. Student changes own password with wrong oldPassword -> 401 Unauthorized
    const studentWrongOld = await request('change-password', 'POST', studentCookie, {
      username: 'student_01',
      oldPassword: 'wrong-old-password',
      newPassword: 'new-student-password-123',
    });
    assert.equal(studentWrongOld.status, 401);
    const wrongOldBody = await studentWrongOld.json() as { error: string };
    assert.match(wrongOldBody.error, /không đúng/i);

    // 5. Student changes own password with correct oldPassword -> 200 OK
    const studentSuccess = await request('change-password', 'POST', studentCookie, {
      username: 'student_01',
      oldPassword: studentPass,
      newPassword: 'new-student-password-123',
    });
    assert.equal(studentSuccess.status, 200);

    // Verify student can now log in with new password
    const studentNewLogin = await request('login', 'POST', '', {
      username: 'student_01',
      password: 'new-student-password-123',
    });
    assert.equal(studentNewLogin.status, 200);

    // 6. Admin resets student password WITHOUT providing oldPassword -> 200 OK (A3 core fix!)
    const adminResetStudent = await request('change-password', 'POST', adminCookie, {
      targetUsername: 'student_01',
      newPassword: 'admin-reset-password-456',
    });
    assert.equal(adminResetStudent.status, 200);
    const resetBody = await adminResetStudent.json() as { ok: boolean; message: string };
    assert.equal(resetBody.ok, true);

    // Verify student can log in with the admin-reset password
    const studentAfterResetLogin = await request('login', 'POST', '', {
      username: 'student_01',
      password: 'admin-reset-password-456',
    });
    assert.equal(studentAfterResetLogin.status, 200);

    // 7. Admin changing THEIR OWN password without oldPassword -> still requires oldPassword (400)
    const adminMissingSelfOld = await request('change-password', 'POST', adminCookie, {
      username: 'admin',
      newPassword: 'brand-new-admin-pass-789',
    });
    assert.equal(adminMissingSelfOld.status, 400);

  } finally {
    server.close();
  }
});

test('A4: WebAR - Camera lifecycle guarantees cleanup on unmount and prevents stale async setState', async () => {
  const sourcePath = path.resolve(process.cwd(), 'src/components/WebARSection.tsx');
  const source = await readFile(sourcePath, 'utf8');

  // Verify that isMountedRef and cameraRequestIdRef exist
  assert.ok(source.includes('const isMountedRef = useRef(true);'), 'Must define isMountedRef');
  assert.ok(source.includes('const cameraRequestIdRef = useRef(0);'), 'Must define cameraRequestIdRef');

  // Verify that cleanup useEffect stops camera on unmount
  assert.ok(
    source.includes('isMountedRef.current = false;') && source.includes('stopCamera();'),
    'Cleanup useEffect must set isMountedRef to false and call stopCamera()'
  );

  // Verify that getUserMedia checks isMountedRef before setting stream or active state
  assert.ok(
    source.includes('if (!isMountedRef.current || cameraRequestIdRef.current !== requestId)'),
    'Must check isMountedRef and requestId before accepting new stream'
  );

  // Verify that unmounted stream tracks are stopped
  assert.ok(
    source.includes('stream.getTracks().forEach((track) => track.stop());'),
    'Must stop tracks if unmounted during getUserMedia'
  );
});

test('A5: ShootingRangeSection - Removes 60 FPS sway re-bind and stabilizes keydown listener', async () => {
  const sourcePath = path.resolve(process.cwd(), 'src/components/ShootingRangeSection.tsx');
  const source = await readFile(sourcePath, 'utf8');

  // Verify that swayOffset is NOT in handleFire dependency array
  assert.ok(
    !source.includes('swayOffset.x,\n      swayOffset.y,\n      currentTarget,'),
    'handleFire dependencies must not include swayOffset.x or swayOffset.y'
  );

  // Verify that handleKeyDown uses fireInputRef.current
  assert.ok(
    source.includes('fireInputRef.current?.();'),
    'handleKeyDown must invoke fireInputRef.current?.() instead of binding directly to handleFire'
  );

  // Verify that keydown useEffect does NOT re-bind on handleFire or swayOffset
  assert.ok(
    source.includes('}, [activeTab, hasStarted, playCockSound, controls.panel]);'),
    'keydown listener effect must only depend on activeTab, hasStarted, playCockSound, controls.panel'
  );
});
