// Stylized, inert classroom prop. Exterior only; no functional internals.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
};
const scene = new THREE.Scene();
scene.name = 'F1_Classroom_Exterior';
scene.userData = { purpose: 'Inert exterior teaching illustration', units: 'arbitrary display units', functional: false };
const olive = new THREE.MeshStandardMaterial({ color: '#526438', roughness: .69, metalness: .22 });
const groove = new THREE.MeshStandardMaterial({ color: '#293323', roughness: .85 });
const steel = new THREE.MeshStandardMaterial({ color: '#69736a', metalness: .72, roughness: .34 });
const brass = new THREE.MeshStandardMaterial({ color: '#a99b63', metalness: .65, roughness: .4 });
function part(name) { const group = new THREE.Group(); group.name = name; group.userData.partId = name; scene.add(group); return group; }
function mesh(parent, geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material); object.position.set(...position); parent.add(object); return object;
}
const body = part('body');
mesh(body, new THREE.SphereGeometry(1, 40, 28), groove).scale.set(.64, .92, .64);
// Rounded exterior panels separated by dark grooves, without a cutaway.
for (let row = 0; row < 7; row++) {
  const phi0 = .15 + row * (Math.PI - .3) / 7 + .025;
  const phi1 = .15 + (row + 1) * (Math.PI - .3) / 7 - .025;
  for (let column = 0; column < 12; column++) {
    const tile = new THREE.SphereGeometry(1, 5, 4, column * Math.PI / 6 + .027, Math.PI / 6 - .054, phi0, phi1 - phi0);
    mesh(body, tile, olive).scale.set(.675, .96, .675);
  }
}
mesh(body, new THREE.CylinderGeometry(.25, .29, .08, 32), olive, [0, -.91, 0]);
const crown = part('crown');
mesh(crown, new THREE.CylinderGeometry(.24, .35, .25, 32), olive, [0, .96, 0]);
mesh(crown, new THREE.CylinderGeometry(.16, .22, .2, 32), brass, [0, 1.16, 0]);
mesh(crown, new THREE.CylinderGeometry(.14, .14, .32, 24), steel, [0, 1.4, 0]);
// A solid stylized cap, with no spring, striker, primer or energetic contents.
const lever = part('lever');
const shape = new THREE.Shape();
shape.moveTo(-.16, 1.58); shape.lineTo(.29, 1.58); shape.lineTo(.68, .8);
shape.lineTo(.8, -.52); shape.lineTo(.65, -.59); shape.lineTo(.54, .73);
shape.lineTo(.2, 1.43); shape.lineTo(-.16, 1.43); shape.closePath();
mesh(lever, new THREE.ExtrudeGeometry(shape, { depth: .16, bevelEnabled: true, bevelSize: .025, bevelThickness: .02, bevelSegments: 3, steps: 1 }), steel, [0, 0, -.08]);
const ring = part('ring');
mesh(ring, new THREE.TorusGeometry(.27, .026, 12, 48), brass, [-.37, 1.22, .15]);
mesh(ring, new THREE.SphereGeometry(.052, 16, 12), steel, [-.15, 1.37, .15]);
const destinations = { body: [-.65, -.12, 0], crown: [0, .95, 0], lever: [1.05, .2, .1], ring: [-1, .72, .2] };
const tracks = Object.entries(destinations).map(([name, end]) => {
  const values = [], times = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; const eased = t * t * (3 - 2 * t); times.push(t * 1.6); values.push(...end.map(v => v * eased)); }
  return new THREE.VectorKeyframeTrack(`${name}.position`, times, values);
});
const animation = new THREE.AnimationClip('ExploreExterior', 1.6, tracks);
const buffer = await new GLTFExporter().parseAsync(scene, { binary: true, animations: [animation] });
await mkdir(new URL('../public/models/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/models/f1-classroom.glb', import.meta.url), Buffer.from(buffer));
console.log(`Exported f1-classroom.glb: ${buffer.byteLength} bytes; 4 exterior groups; ExploreExterior animation.`);
