import fs from 'node:fs';
import * as THREE from 'three';
import { createHash } from 'node:crypto';
const file = process.argv[2] || 'public/models/akm.glb';
const bytes = fs.readFileSync(file);
const jsonLength = bytes.readUInt32LE(12);
const doc = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
const bin = bytes.subarray(28 + jsonLength);
function read(id) {
  const a = doc.accessors[id], v = doc.bufferViews[a.bufferView];
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const [size, method] = {5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']}[a.componentType];
  return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,k)=>bin[method]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*width)+k*size)));
}
const nodes=[];
function visit(id,parent=new THREE.Matrix4()) {
  const n=doc.nodes[id], local=n.matrix ? new THREE.Matrix4().fromArray(n.matrix) : new THREE.Matrix4().compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1])));
  const world=parent.clone().multiply(local);
  const entry={id,name:n.name,children:n.children||[],local:local.toArray(),world:world.toArray(),primitives:[]};
  if(n.mesh!==undefined) for(const p of doc.meshes[n.mesh].primitives) {
    const pos=read(p.attributes.POSITION).map(x=>new THREE.Vector3(...x).applyMatrix4(world));
    const indices=p.indices!==undefined?read(p.indices).flat():pos.map((_,i)=>i);
    const roots=pos.map((_,i)=>i), same=new Map();
    const find=i=>roots[i]===i?i:(roots[i]=find(roots[i]));
    const union=(a,b)=>{roots[find(a)]=find(b);};
    pos.forEach((v,i)=>{const key=v.toArray().map(x=>Math.round(x*1e6)).join(',');if(same.has(key))union(i,same.get(key));else same.set(key,i);});
    for(let i=0;i<indices.length;i+=3){union(indices[i],indices[i+1]);union(indices[i],indices[i+2]);}
    const groups=new Map();
    for(let i=0;i<indices.length;i+=3){const r=find(indices[i]);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(i/3);}
    const islands=[...groups.values()].map((faces,id)=>{const box=new THREE.Box3();for(const f of faces)for(let k=0;k<3;k++)box.expandByPoint(pos[indices[f*3+k]]);return {id,triangles:faces.length,min:box.min.toArray(),max:box.max.toArray(),faces};});
    if (n.name === 'AKM_body_M_AKM_body_0' && !file.includes('adjustable')) {
      fs.mkdirSync('artifacts/ak-sight',{recursive:true});
      const selected = islands.filter(i=>[4,5,6,7].includes(i.id));
      fs.writeFileSync('artifacts/ak-sight/selection.json', JSON.stringify({sourceSha256:createHash('sha256').update(bytes).digest('hex'), islands:selected.map(({faces,...i})=>i), triangles:selected.flatMap(i=>i.faces.map(f=>[0,1,2].map(k=>pos[indices[f*3+k]].toArray())))},null,2));
    }
    entry.primitives.push({mesh:doc.meshes[n.mesh].name,material:p.material,attributes:p.attributes,vertices:pos.length,triangles:indices.length/3,islands});
  }
  nodes.push(entry);for(const child of n.children||[])visit(child,world);
}
for(const root of doc.scenes[doc.scene||0].nodes)visit(root);
fs.mkdirSync('artifacts/ak-sight',{recursive:true});
fs.writeFileSync(`artifacts/ak-sight/${file.includes('adjustable')?'output':'source'}-inspection.json`,JSON.stringify({file,nodes,materials:doc.materials,animations:doc.animations||[],images:doc.images},null,2));
console.log(JSON.stringify(nodes.filter(n=>n.primitives.length).map(n=>({...n,local:undefined,world:undefined,primitives:n.primitives.map(p=>({...p,islands:p.islands.map(({faces,...i})=>i)}))})),null,2));
