const fs=require('fs'); const path=require('path'); const sharp=require('sharp');
(async()=>{
 const dir=process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
 const files=fs.readdirSync(dir).filter(x=>/^(doc|ppt)_.*\.(png|jpe?g)$|^slide-\d+\.png$/i.test(x));
 const comps=[];const cw=320,ch=220;
 for(let i=0;i<files.length;i++){
  const buf=await sharp(path.join(dir,files[i])).resize(310,185,{fit:'inside'}).png().toBuffer();
  const meta=await sharp(buf).metadata();
  const x=(i%4)*cw,y=Math.floor(i/4)*ch;
  comps.push({input:buf,left:x,top:y+25});
  comps.push({input:Buffer.from(`<svg width="320" height="25"><rect width="320" height="25" fill="white"/><text x="4" y="18" font-size="16">${files[i]}</text></svg>`),left:x,top:y});
 }
 await sharp({create:{width:4*cw,height:Math.ceil(files.length/4)*ch,channels:3,background:'#e8edf2'}}).composite(comps).png().toFile(path.join(dir,'contact.png'));
})();
