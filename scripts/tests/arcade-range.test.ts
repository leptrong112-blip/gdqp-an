import test from 'node:test';
import assert from 'node:assert/strict';
import { ammoAction, ARCADE_EXERCISES, initialAmmo, arcadeFlightSeconds, arcadeTargetX } from '../../src/components/arcadeRangeLogic.ts';

for (const exercise of ARCADE_EXERCISES) {
  test(`${exercise.id}: exact magazine budget and legal reload transitions`, () => {
    let ammo = initialAmmo(exercise);
    assert.equal(ammoAction(ammo, 'reload', exercise), ammo, 'cannot discard a partial magazine');
    for (let magazine = 1; magazine <= exercise.magazines; magazine++) {
      for (let i = 0; i < exercise.rounds; i++) ammo = ammoAction(ammo, 'fire', exercise);
      assert.equal(ammo.left, 0);
      assert.equal(ammoAction(ammo, 'fire', exercise), ammo, 'empty magazine cannot fire');
      if (magazine < exercise.magazines) {
        ammo = ammoAction(ammo, 'reload', exercise);
        assert.equal(ammoAction(ammo, 'fire', exercise), ammo, 'cannot fire during reload');
        assert.equal(ammoAction(ammo, 'reload', exercise), ammo, 'cannot start duplicate reload');
        ammo = ammoAction(ammo, 'loaded', exercise);
        assert.equal(ammoAction(ammo, 'loaded', exercise), ammo, 'completion is idempotent');
      }
    }
    assert.equal(ammo.fired, exercise.rounds * exercise.magazines);
    assert.equal(ammo.reloads, exercise.magazines - 1);
    assert.equal(ammoAction(ammo, 'reload', exercise), ammo, 'no extra magazines');
    assert.equal(initialAmmo(exercise).fired, 0, 'new round starts cleanly');
  });
}
test('game animation timing grows with distance and stays short', () => {
  const times = [10, 100, 150, 200].map(arcadeFlightSeconds);
  assert.ok(times.every((value, i) => value > 0 && value < 1 && (i === 0 || value > times[i - 1])));
});
test('three moving target lanes stay separated and bounded', () => {
  for (let t = 0; t < 40; t += .1) {
    const x = [0, 1, 2].map(lane => arcadeTargetX(lane, 1, t, true));
    assert.ok(x[1] - x[0] > 1 && x[2] - x[1] > 1);
    assert.ok(x.every(value => Math.abs(value) <= 2.07));
  }
  assert.equal(arcadeTargetX(1, 1, 0, false), arcadeTargetX(1, 1, 8, false));
  assert.notEqual(arcadeTargetX(1, 1, 0, true), arcadeTargetX(1, 1, 8, true));
});
