import type { CanonicalPoseFrame, Vec3 } from '../../../../src/features/pose-analysis/types';

export function attachSaluteHand(frame: CanonicalPoseFrame) {
  const world: Vec3[] = Array.from({length:21}, () => ({x:0,y:0,z:0}));
  [[-.02,-.01],[-.03,-.025],[-.038,-.04],[-.038,-.06]].forEach(([x,y],i) => world[i+1]={x,y,z:0});
  for (const [i,x] of [[5,-.027],[9,-.009],[13,.009],[17,.027]]) {
    for (let j=0;j<4;j++) world[i+j]={x,y:-.04-j*.021,z:0};
  }
  const wrist=frame.landmarks.rightWrist!.image, elbow=frame.landmarks.rightElbow!.image;
  const dx=(wrist.x-elbow.x)*frame.aspectRatio, dy=wrist.y-elbow.y, len=Math.hypot(dx,dy);
  const image=world.map(p=>({x:wrist.x+(-dy/len*p.x-dx/len*p.y)*.65/frame.aspectRatio,
    y:wrist.y+(dx/len*p.x-dy/len*p.y)*.65,z:0}));
  frame.saluteHand={timestampMs:frame.timestampMs,image,world,sourceWidth:960,sourceHeight:720};
  frame.handStatus='observed';
  return frame;
}
