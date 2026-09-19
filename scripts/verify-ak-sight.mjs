import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const io=new NodeIO();
const [source,output]=await Promise.all(['akm.glb','ak47_adjustable.glb'].map(f=>io.read(`public/models/${f}`)));
function triangles(doc) {
  const result=[];
  for(const node of doc.getRoot().listNodes()) {
    if(!node.getMesh())continue;
    const matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix());
    const normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
    for(const p of node.getMesh().listPrimitives()) {
      const pos=p.getAttribute('POSITION'), idx=p.getIndices();
      for(let f=0;f<(idx?.getCount()||pos.getCount());f+=3) {
        const vertices=[0,1,2].map(k=>{
          const i=idx?idx.getScalar(f+k):f+k;
          const point=new THREE.Vector3().fromArray(pos.getElement(i,[])).applyMatrix4(matrix);
          const normal=new THREE.Vector3().fromArray(p.getAttribute('NORMAL').getElement(i,[])).applyMatrix3(normalMatrix).normalize();
          const uv=[0,1,2].map(n=>p.getAttribute(`TEXCOORD_${n}`)?.getElement(i,[]));
          return {point,normal,uv};
        });
        result.push({vertices,center:vertices.reduce((v,x)=>v.add(x.point),new THREE.Vector3()).divideScalar(3),material:p.getMaterial().getName()});
      }
    }
  }
  return result;
}
const old=triangles(source), current=triangles(output);
assert.equal(old.length,19604);assert.equal(current.length,old.length);
const grid=new Map(), cell=v=>v.toArray().map(x=>Math.floor(x/.0001));
old.forEach((t,i)=>{const key=cell(t.center).join(',');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);});
const used=new Set();let maxPositionError=0,maxNormalError=0,maxUvError=0;
for(const t of current) {
  const c=cell(t.center);let match;
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const i of grid.get([c[0]+x,c[1]+y,c[2]+z].join(','))||[]) {
    if(used.has(i)||old[i].material!==t.material)continue;
    if(t.vertices.every(v=>old[i].vertices.some(w=>v.point.distanceTo(w.point)<.000002))) {match=i;break;}
  }
  assert.notEqual(match,undefined,'Every output triangle must exist in source');used.add(match);
  for(const v of t.vertices){const w=old[match].vertices.reduce((a,b)=>v.point.distanceTo(a.point)<v.point.distanceTo(b.point)?a:b);
    maxPositionError=Math.max(maxPositionError,v.point.distanceTo(w.point));
    maxNormalError=Math.max(maxNormalError,v.normal.distanceTo(w.normal));
    for(let n=0;n<3;n++){assert.equal(!!v.uv[n],!!w.uv[n]);if(v.uv[n])maxUvError=Math.max(maxUvError,...v.uv[n].map((x,k)=>Math.abs(x-w.uv[n][k])));}
  }
}
assert.equal(used.size,old.length);assert(maxUvError<.000002);assert(maxNormalError<.001);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const images=d=>d.getRoot().listTextures().map(t=>hash(t.getImage())).sort();
assert.deepEqual(images(output),images(source),'Embedded texture bytes must be preserved');
const rear=output.getRoot().listNodes().filter(n=>n.getName()==='RearSight');
assert.equal(rear.length,1);assert(rear[0].getParentNode());
assert.equal(rear[0].listChildren()[0].getMesh().listPrimitives()[0].getIndices().getCount()/3,556);
const report={triangles:current.length,rearSightTriangles:556,textureCount:images(output).length,maxPositionError,maxUvError,maxNormalError,sourceSha256:hash(fs.readFileSync('public/models/akm.glb')),outputSha256:hash(fs.readFileSync('public/models/ak47_adjustable.glb')),result:'PASS'};
fs.writeFileSync('artifacts/ak-sight/verification.json',JSON.stringify(report,null,2));console.log(report);
