const P=require('C:/dev/Zite/Art Director/tools/paint.js'),fs=require('fs');
(async()=>{const R='C:/dev/Zite/Art Director/out/',load=async(d,n)=>({J:JSON.parse(fs.readFileSync(R+d+'/'+n+'.json','utf8')),im:await P.loadImage(R+d+'/'+n+'.png')});
const B=await load('hero_classes/archer','body'),W=await load('hero_classes/archer','weapon'),E=await load('effects','effects'),bo=await load('hero_gear','boots'),Fo=await load('creatures/bandit','bandit'),bg=await P.loadImage(R+'meadow_fight/background.jpg'),cl=JSON.parse(fs.readFileSync(R+'hero_gear/clips.json','utf8'));
const part=(g,X,k)=>{const f=X.J.frames[k];if(!f)return;const r=f.frame;g.drawImage(X.im,r.x,r.y,r.w,r.h,-r.w*f.pivot.x,-r.h*f.pivot.y,r.w,r.h)};
const hero=(g,x,y,n,flip=true)=>{g.save();g.translate(x,y);if(flip)g.scale(-1,1);const K='/attack1/'+n;for(const p of['far_back','body'])part(g,B,p+K);part(g,bo,'boots_base'+K);for(const p of['far_front','head','hair','arm'])part(g,B,p+K);part(g,W,'copper_bow'+K);part(g,B,'hand_grip'+K);part(g,B,'hand'+K);g.restore()};
const arrow=(g,x,y,rot)=>{const F=E.J.actions.arrow.frames[0],r=E.J.frames[F.name].frame;g.save();g.translate(x,y);g.rotate(rot);g.drawImage(E.im,r.x,r.y,r.w,r.h,-F.origin.x,-F.origin.y,r.w,r.h);g.restore()};
const c=P.createCanvas(1648,1100),g=c.getContext('2d');g.fillStyle='#2c2a3c';g.fillRect(0,0,1648,1100);
// top: her six shot frames at 2x
cl.attack1.frames.forEach((F,i)=>{hero(g,140+i*270,420,F.n);P.label(g,F.n+' '+F.delay+'ms',140+i*270,30,22,'#fff',{align:'center'})});
// bottom: the phone stage at 2x, the arrow at every 60 fps frame of a 130 ms flight (red) and of a 260 ms flight (white dots)
g.save();g.translate(0,440);g.beginPath();g.rect(0,0,824,660);g.clip();g.drawImage(bg,0,-420);hero(g,130,455,'0004');const fo=Fo.J.actions.stand.frames[0],r=Fo.J.frames[fo.name].frame;g.drawImage(Fo.im,r.x,r.y,r.w,r.h,640-fo.origin.x,455-fo.origin.y,r.w,r.h);
const sx=130,sy=455-150,ex=640,ey=455-150;for(let t=0;t<=130;t+=16.7)arrow(g,sx+(ex-sx)*t/130,sy,0);g.restore();
g.save();g.translate(824,440);g.beginPath();g.rect(0,0,824,660);g.clip();g.drawImage(bg,0,-420);hero(g,130,455,'0004');g.drawImage(Fo.im,r.x,r.y,r.w,r.h,640-fo.origin.x,455-fo.origin.y,r.w,r.h);{const bx=130+114,by=455-166;for(let t=0;t<=200;t+=16.7)arrow(g,bx+(ex-bx)*t/200,by+(ey-by)*t/200,Math.atan2(ey-by,ex-bx));}g.restore();
P.label(g,'Now: from her chest, 130 ms (each arrow is one frame on the phone)',412,1080,22,'#fff',{align:'center'});P.label(g,'Suggested: from the bow, 200 ms',1236,1080,22,'#fff',{align:'center'});
fs.writeFileSync(process.argv[2],c.toBuffer('image/jpeg',88))})();
