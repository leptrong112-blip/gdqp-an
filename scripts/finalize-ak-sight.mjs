// Lossless packaging after Blender separation: keep every original attribute/image byte.
// Blender establishes the separate object and pivot; its exporter may rewrite normals.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core';
import { createHash } from 'node:crypto';
const source=fs.readFileSync('public/models/akm.glb');
const selection=JSON.parse(fs.readFileSync('artifacts/ak-sight/selection.json'));
assert.equal(createHash('sha256').update(source).digest('hex'),selection.sourceSha256);
const blender=await new NodeIO().read('public/models/ak47_adjustable.glb');
const separated=blender.getRoot().listNodes().find(n=>n.getName()==='RearSight');
assert(separated?.getMesh(),'Blender must have successfully separated the real mesh first');
const primitive=separated.getMesh().listPrimitives()[0];
assert.equal(primitive.getIndices().getCount(),556*3);
const transform=new THREE.Matrix4().fromArray(separated.getWorldMatrix());
const position=primitive.getAttribute('POSITION');
for(let i=0;i<primitive.getIndices().getCount();i+=3) {
  const vertices=[0,1,2].map(k=>new THREE.Vector3().fromArray(position.getElement(primitive.getIndices().getScalar(i+k),[])).applyMatrix4(transform));
  assert(selection.triangles.some(t=>vertices.every(v=>t.some(w=>v.distanceTo(new THREE.Vector3(...w))<.000002))),'Exported RearSight must contain only reviewed source triangles');
}
const len=source.readUInt32LE(12),doc=JSON.parse(source.toString('utf8',20,20+len));
const originalBin=source.subarray(28+len);
const inspection=JSON.parse(fs.readFileSync('artifacts/ak-sight/source-inspection.json'));
const inspectedBody=inspection.nodes.find(n=>n.name==='AKM_body_M_AKM_body_0');
const body=doc.nodes[inspectedBody.id], original=doc.meshes[body.mesh].primitives[0];
const a=doc.accessors[original.indices],v=doc.bufferViews[a.bufferView];
const size={5123:2,5125:4}[a.componentType],reader=size===2?'readUInt16LE':'readUInt32LE';
const selected=new Set(inspectedBody.primitives[0].islands.filter(i=>[4,5,6,7].includes(i.id)).flatMap(i=>i.faces));
const stay=[],move=[];
for(let i=0;i<a.count;i++)(selected.has(Math.floor(i/3))?move:stay).push(originalBin[reader]((v.byteOffset||0)+(a.byteOffset||0)+i*size));
let chunks=[originalBin],length=originalBin.length;
function addIndices(indices) {
  const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
  const data=Buffer.alloc(indices.length*4);indices.forEach((x,i)=>data.writeUInt32LE(x,i*4));
  const bufferView=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.length,target:34963});chunks.push(data);length+=data.length;
  const id=doc.accessors.length;doc.accessors.push({bufferView,componentType:5125,count:indices.length,type:'SCALAR',min:[Math.min(...indices)],max:[Math.max(...indices)]});return id;
}
original.indices=addIndices(stay);
const rearMesh=doc.meshes.length;doc.meshes.push({name:'RearSightGeometry',primitives:[{...original,attributes:{...original.attributes},indices:addIndices(move)}]});
const parentId=doc.nodes.findIndex(n=>n.children?.includes(inspectedBody.id));
const parentWorld=new THREE.Matrix4().fromArray(inspection.nodes.find(n=>n.id===parentId).world);
const pivot=new THREE.Vector3().setFromMatrixPosition(transform).applyMatrix4(parentWorld.invert());
const rearId=doc.nodes.length;
doc.nodes.push({name:'RearSight',translation:pivot.toArray(),children:[rearId+1],extras:{role:'rear-sight-visual',sourceTriangles:556}}, {name:'RearSightGeometry',translation:pivot.clone().negate().toArray(),mesh:rearMesh});
doc.nodes[parentId].children.push(rearId);
doc.buffers[0].byteLength=length;
let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
let bin=Buffer.concat(chunks);bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);
const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
fs.writeFileSync('public/models/ak47_adjustable.glb',Buffer.concat([header,json,bh,bin]));
console.log('Lossless GLB packed: 556 original triangles separated; original attribute/image buffers retained.');
