import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, Quaternion, Vector3 } from 'three';
import { bindRearSight } from '../../src/components/rearSightTransform.ts';
import { getSightPreset } from '../../src/components/rangeSightPresets.ts';

test('reviewed sight uses original local transform, returns exactly, and never moves siblings', () => {
  const weapon=new Group(), sight=new Group(), body=new Mesh();
  sight.name='RearSight';sight.userData.role='rear-sight-visual';
  sight.position.set(.1,.25,.125);sight.rotation.set(.2,.3,.4);sight.scale.set(1,2,3);
  weapon.rotation.set(.6,.1,.4);weapon.scale.setScalar(.01);weapon.add(sight,body);
  const position=sight.position.clone(),rotation=sight.quaternion.clone(),scale=sight.scale.clone();
  const binding=bindRearSight(weapon)!;
  for(let repeat=0;repeat<5;repeat++)for(const id of ['preset_b','preset_c','preset_d','preset_a']) {
    const preset=getSightPreset(id);
    for(let frame=0;frame<120;frame++)binding.update(preset,1/60);
    const expected=rotation.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),preset.localPitchRad));
    assert.deepEqual(sight.position.toArray(),position.toArray());
    assert.deepEqual(sight.quaternion.toArray(),expected.toArray());
    assert.deepEqual(sight.scale.toArray(),scale.toArray());assert.equal(sight.parent,weapon);
    assert.deepEqual(body.position.toArray(),[0,0,0]);
  }
  binding.update(getSightPreset('preset_d'),.016);binding.restore();
  assert.deepEqual(sight.quaternion.toArray(),rotation.toArray());
});
test('unsupported asset and ambiguous name do not enable presets',()=>{
  const weapon=new Group(),candidate=new Group();candidate.name='front_sight';weapon.add(candidate);
  assert.equal(bindRearSight(weapon),null);
  candidate.name='RearSight';assert.equal(bindRearSight(weapon),null);
});
