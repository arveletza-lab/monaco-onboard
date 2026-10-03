// Night racer: long, low black superhero-style car (80s/90s look, no emblems): very long nose with a turbine intake,
// dark bubble canopy behind the centre, big scalloped rear fins, glowing rear jet nozzle, dark rims, blue accents.
// build(group) fills the group and returns the parts the game drives (same shape as CARP in js/car.js).
// Coordinates: x right, y up, z backwards (nose at negative z), tyres resting on y=0. Length ~5.9 m, width ~2.2 m.

import {COL,TAU,canvas,mulberry} from '../util.js';

// ---------------------------------------------------------------- textures
function tex(c,srgb){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
// satin black paint with faint panel lines
function bodyTex(){const c=canvas(256,256),g=c.getContext('2d');g.fillStyle='#101114';g.fillRect(0,0,256,256);const rnd=mulberry(77);
 for(let i=0;i<4000;i++){const v=14+rnd()*8|0;g.fillStyle=`rgba(${v},${v},${v+3},.6)`;g.fillRect(rnd()*256,rnd()*256,1,1);}
 g.strokeStyle='rgba(0,0,0,.85)';g.lineWidth=1.5;for(const x of[64,192]){g.beginPath();g.moveTo(x,0);g.lineTo(x,256);g.stroke();}for(const y of[96]){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();}
 return tex(c);}
function ventTex(){const c=canvas(64,64),g=c.getContext('2d');g.fillStyle='#08090b';g.fillRect(0,0,64,64);g.fillStyle='#2c3036';for(let y=2;y<64;y+=6)g.fillRect(0,y,64,2);const t=tex(c);t.repeat.set(1,2);return t;}
function tyreTex(){const c=canvas(128,32),g=c.getContext('2d');g.fillStyle='#141414';g.fillRect(0,0,128,32);g.fillStyle='#0a0a0a';for(let x=0;x<128;x+=8){g.fillRect(x,0,3,32);}g.fillStyle='#1e1e1e';g.fillRect(0,14,128,4);const t=tex(c);t.repeat.set(10,1);return t;}
function glowTex(){const c=canvas(128,128),g=c.getContext('2d');const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,230,170,1)');gr.addColorStop(.25,'rgba(255,140,40,.85)');gr.addColorStop(.6,'rgba(255,80,10,.25)');gr.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return tex(c);}

// ---------------------------------------------------------------- geometry helpers
function loft(secs,cx,M){M=M||28;const pos=[],idx=[];for(const [z,w,top,bot,e] of secs){const mid=(top+bot)/2,hh=(top-bot)/2,hw=w/2;for(let k=0;k<M;k++){const a=k/M*TAU,c=Math.cos(a),s=Math.sin(a);pos.push((cx||0)+hw*Math.sign(c)*Math.pow(Math.abs(c),2/e),mid+hh*Math.sign(s)*Math.pow(Math.abs(s),2/e),z);}}
 for(let r=0;r<secs.length-1;r++)for(let k=0;k<M;k++){const a=r*M+k,b=r*M+(k+1)%M,c=a+M,d=b+M;idx.push(a,b,c,b,d,c);}
 const n=secs.length;const f0=pos.length/3;pos.push(cx||0,(secs[0][2]+secs[0][3])/2,secs[0][0]);const f1=f0+1;pos.push(cx||0,(secs[n-1][2]+secs[n-1][3])/2,secs[n-1][0]);
 for(let k=0;k<M;k++){idx.push(f0,(k+1)%M,k);idx.push(f1,(n-1)*M+k,(n-1)*M+(k+1)%M);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
 const uv=[];for(let i=0;i<pos.length/3;i++)uv.push(pos[i*3+2]*.35,pos[i*3+1]*.35+pos[i*3]*.2);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
// smooth a list of sections: Catmull-Rom between key sections, `sub` steps per span
function smooth(secs,sub){const out=[];const n=secs.length;for(let i=0;i<n-1;i++){const p0=secs[Math.max(0,i-1)],p1=secs[i],p2=secs[i+1],p3=secs[Math.min(n-1,i+2)];
  for(let k=0;k<sub;k++){const t=k/sub,t2=t*t,t3=t2*t;out.push(p1.map((_,j)=>.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)));}}
 out.push(secs[n-1]);return out;}
const M4=()=>new THREE.Matrix4();
const T=(x,y,z)=>M4().makeTranslation(x,y,z);
const E=(x,y,z,rx,ry,rz,s)=>M4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'XYZ')),new THREE.Vector3(...(s||[1,1,1])));
function rodM(a,b){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());return {len:A.distanceTo(B),m:M4().compose(A.clone().add(B).multiplyScalar(.5),q,new THREE.Vector3(1,1,1))};}
class Kit{constructor(){this.m=new Map();}
 put(mat,geo,m){const g=geo.index?geo.toNonIndexed():geo.clone();if(m)g.applyMatrix4(m);if(!g.attributes.normal)g.computeVertexNormals();let a=this.m.get(mat);if(!a){a=[];this.m.set(mat,a);}a.push(g);}
 flush(parent){for(const [mat,gs] of this.m){let n=0;for(const g of gs)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
   for(const g of gs){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);o+=c;}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));geo.computeBoundingSphere();
   const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=!mat.transparent;parent.add(mesh);}
  this.m.clear();}}

// ---------------------------------------------------------------- the night racer
export function build(group){const P={};
 const std=(c,r,m,o)=>new THREE.MeshStandardMaterial(Object.assign({color:COL(c),roughness:r,metalness:m||0},o||{}));
 const M={
  body:std(0xffffff,.32,.55,{map:bodyTex()}),
  gloss:std(0x0c0d10,.18,.7),
  grey:std(0x2a2d33,.45,.7),
  greyL:std(0x4a4f57,.35,.85),
  vent:std(0xffffff,.6,.4,{map:ventTex()}),
  under:std(0x060607,.9,0),
  tyre:std(0xffffff,.88,0,{map:tyreTex()}),
  rim:std(0x16181c,.3,.85),
  rimL:std(0x4a505a,.3,.9),
  canopy:std(0x0a1220,.03,.6,{transparent:true,opacity:.82,side:THREE.FrontSide,depthWrite:false}),
  blue:new THREE.MeshBasicMaterial({color:0x2a6cff,toneMapped:false}),
  blueDim:new THREE.MeshBasicMaterial({color:0x123a8c,toneMapped:false}),
  head:new THREE.MeshBasicMaterial({color:0xcfe0ff,toneMapped:false}),
  tail:new THREE.MeshBasicMaterial({color:0xb01010,toneMapped:false}),
  fire:new THREE.MeshBasicMaterial({color:0xff7a1a,toneMapped:false}),
  fireCore:new THREE.MeshBasicMaterial({color:0xffd9a0,toneMapped:false}),
  seat:std(0x101114,.9,0),suit:std(0x15171c,.85,.1),helm:std(0x0e0f12,.25,.4),visor:std(0x0a1630,.05,.8)};
 P.M=M;
 const K=new Kit();const X=Math.PI/2;
 const box=(mat,w,h,d,m)=>K.put(mat,new THREE.BoxGeometry(w,h,d),m);

 // --- fuselage: long pointed nose, low cockpit tub under the canopy, raised rear deck
 const fus=smooth([[-3.2,.54,.6,.22,2.2],[-2.7,.8,.62,.2,2.6],[-1.8,1.04,.66,.2,3],[-1.0,1.16,.72,.2,3.2],[-.45,1.24,.72,.2,3.2],[.2,1.28,.6,.2,3.2],
  [1.0,1.3,.62,.2,3.2],[1.5,1.3,.84,.22,3.2],[2.2,1.22,.86,.26,3],[2.75,1.0,.8,.3,2.6],[2.95,.86,.76,.32,2.4]],3);
 K.put(M.body,loft(fus,0,36));
 // central spine on the nose and side intakes
 K.put(M.gloss,loft(smooth([[-3.12,.06,.63,.55,2],[-2.0,.1,.7,.6,2],[-1.0,.12,.75,.64,2],[-.5,.1,.75,.68,2]],2),0,8));
 for(const s of[-1,1]){K.put(M.vent,new THREE.PlaneGeometry(.5,.16),E(s*.631,.48,-.95,0,s*X,0));box(M.greyL,.03,.03,.56,T(s*.625,.58,-.95));}

 // --- fender pods: front and rear arches joined by a low sill
 for(const s of[-1,1]){
  K.put(M.body,loft(smooth([[-2.65,.2,.5,.4,2.4],[-2.3,.44,.74,.54,2.8],[-1.78,.52,.86,.64,3],[-1.22,.48,.76,.54,2.8],[-.8,.4,.54,.28,2.6],[.3,.4,.56,.28,2.6],
   [1.15,.5,.84,.6,2.8],[1.75,.56,.98,.72,3],[2.35,.54,.92,.64,3],[2.9,.4,.8,.46,2.6]],3),s*.86,24));
  // headlight slit and blue strip along the sill
  box(M.head,.22,.03,.02,E(s*.86,.62,-2.42,-.5,0,0));
  box(M.blue,.012,.02,1.1,T(s*1.065,.42,-.25));
  box(M.tail,.3,.04,.02,T(s*.86,.62,2.9));
  // vented skirt under the doors
  box(M.grey,.06,.12,1.2,T(s*1.03,.3,-.25));}
 box(M.under,1.2,.06,4.6,T(0,.2,.1));
 // dorsal fairing from the canopy to the tail, between the fins
 K.put(M.gloss,loft(smooth([[1.0,.12,.66,.6,2.2],[1.35,.3,.96,.6,2.4],[2.1,.26,1.0,.7,2.4],[2.75,.14,.9,.7,2.2]],3),0,16));

 // --- turbine intake at the nose tip: lip ring, dark duct, fan blades and spinner
 {const z=-3.21,y=.41;K.put(M.greyL,new THREE.TorusGeometry(.24,.045,10,28),T(0,y,z));
  K.put(M.under,new THREE.CylinderGeometry(.24,.2,.3,24,1,true).rotateX(X),E(0,y,z+.15,0,0,0));
  for(let k=0;k<12;k++){const a=k/12*TAU;K.put(M.grey,new THREE.BoxGeometry(.02,.2,.012),M4().multiply(T(0,y,z+.12)).multiply(M4().makeRotationZ(a)).multiply(T(0,.11,0)).multiply(M4().makeRotationY(.5)));}
  K.put(M.greyL,new THREE.ConeGeometry(.06,.12,16).rotateX(-X),T(0,y,z+.04));
  K.put(M.blueDim,new THREE.TorusGeometry(.205,.006,4,28),T(0,y,z+.02));}

 // --- canopy bubble behind the centre (no centre rib, and only its outer face renders so the cockpit view stays clear), with its frame, dashboard, screen and LEDs inside
 {const cg=new THREE.SphereGeometry(1,32,16,0,TAU,0,X);cg.scale(.5,.56,.92);cg.translate(0,.6,.42);K.put(M.canopy,cg);
  const fr=new THREE.TorusGeometry(1,.02,6,40);fr.rotateX(X);fr.scale(.5,1,.92);fr.translate(0,.61,.42);K.put(M.grey,fr);
}
 box(M.gloss,.86,.14,.3,T(0,.66,-.3));                 // dashboard
 box(M.seat,.5,.42,.12,E(0,.6,.95,-.25,0,0));box(M.seat,.5,.08,.5,T(0,.36,.7));  // seat
 box(M.grey,.06,.36,.06,E(.28,.55,.15,-.4,0,0));        // throttle lever
 const sc=canvas(256,128);P.screen=sc;P.screenTex=new THREE.CanvasTexture(sc);P.screenTex.encoding=THREE.sRGBEncoding;
 {const scr=new THREE.Mesh(new THREE.PlaneGeometry(.26,.13),new THREE.MeshBasicMaterial({map:P.screenTex,toneMapped:false}));scr.position.set(0,.745,-.17);scr.rotation.x=-.75;group.add(scr);
  const g=sc.getContext('2d');g.fillStyle='#020610';g.fillRect(0,0,256,128);g.strokeStyle='#2a6cff';g.lineWidth=3;g.strokeRect(4,4,248,120);P.screenTex.needsUpdate=true;}
 P.leds=[];for(let k=0;k<15;k++){const m=new THREE.MeshBasicMaterial({color:0x151515,toneMapped:false});const l=new THREE.Mesh(new THREE.BoxGeometry(.03,.008,.012),m);l.position.set(-.35+k*.05,.735,-.43);group.add(l);P.leds.push(m);}
 // yoke on its column
 {const {len,m}=rodM([0,.62,-.3],[0,.72,-.08]);K.put(M.grey,new THREE.CylinderGeometry(.018,.018,len,8),m);}
 const mount=new THREE.Group();mount.position.set(0,.74,-.05);mount.rotation.x=-.35;group.add(mount);const spinW=new THREE.Group();mount.add(spinW);P.sw=spinW;
 {const S=new Kit();S.put(M.gloss,new THREE.BoxGeometry(.26,.05,.03));for(const s of[-1,1]){S.put(M.grey,new THREE.CylinderGeometry(.022,.022,.13,10),T(s*.14,-.02,0));S.put(M.suit,new THREE.SphereGeometry(.035,10,8),E(s*.145,-.02,.025,0,0,0,[1,1.6,1]));}
  S.put(M.blue,new THREE.BoxGeometry(.08,.012,.005),T(0,.012,.017));S.flush(spinW);}

 // --- rear fins: big scalloped bat-wing silhouettes rising from the rear pods
 {const sh=new THREE.Shape();sh.moveTo(.95,.86);sh.quadraticCurveTo(2.35,1.0,3.35,1.85);
  const pts=[[3.35,1.85],[3.16,1.48],[3.08,1.16],[2.92,.86]];for(let k=0;k<pts.length-1;k++){const a=pts[k],b=pts[k+1];sh.quadraticCurveTo((a[0]+b[0])/2-.2,(a[1]+b[1])/2+.02,b[0],b[1]);}
  sh.lineTo(2.2,.86);sh.lineTo(.95,.86);
  const fg=new THREE.ExtrudeGeometry(sh,{depth:.07,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:10});fg.translate(0,0,-.025);fg.rotateY(-X);
  for(const s of[-1,1]){K.put(M.gloss,fg,E(s*.88,0,0,0,0,s*-.16));
   // thin blue edge light along the leading edge
   const c=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,.9,1.0),new THREE.Vector3(0,1.03,2.35),new THREE.Vector3(0,1.85,3.33));const tg=new THREE.TubeGeometry(c,20,.008,4,false);K.put(M.blueDim,tg,E(s*.88,0,0,0,0,s*-.16));}}

 // --- rear jet nozzle with orange glow, and the rear valance
 {const z=2.98,y=.55;K.put(M.greyL,new THREE.CylinderGeometry(.24,.3,.32,28,1,true).rotateX(X),T(0,y,z-.05));
  K.put(M.grey,new THREE.TorusGeometry(.24,.035,8,28),T(0,y,z+.11));
  for(let k=0;k<16;k++){const a=k/16*TAU;K.put(M.grey,new THREE.BoxGeometry(.04,.12,.012),M4().multiply(T(0,y,z+.05)).multiply(M4().makeRotationZ(a)).multiply(T(0,.19,0)));}
  K.put(M.fire,new THREE.CircleGeometry(.2,28),T(0,y,z+.02));K.put(M.fireCore,new THREE.CircleGeometry(.09,20),T(0,y,z+.025));
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.0),new THREE.MeshBasicMaterial({map:glowTex(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.position.set(0,y,z+.16);group.add(glow);P.glow=glow;
  box(M.grey,1.4,.12,.06,T(0,.33,2.95));}

 // --- wheels: black tyres, dark turbine-blade rims
 const wheel=(r,w,front,sd)=>{const grp=new THREE.Group(),spin=new THREE.Group();grp.add(spin);const W=new Kit();
  const pts=[];const hw=w/2,c=.05,rin=r*.62;pts.push(new THREE.Vector2(rin,-hw*.9));for(let k=0;k<=6;k++){const a=k/6*X;pts.push(new THREE.Vector2(r-c+Math.sin(a)*c,-hw+c-Math.cos(a)*c));}
  for(let k=0;k<=6;k++){const a=k/6*X;pts.push(new THREE.Vector2(r-c+Math.cos(a)*c,hw-c+Math.sin(a)*c));}pts.push(new THREE.Vector2(rin,hw*.9));
  const tg=new THREE.LatheGeometry(pts,40);tg.rotateZ(X);W.put(M.tyre,tg);
  W.put(M.rim,new THREE.CylinderGeometry(rin,rin,w*.8,32,1,true).rotateZ(X));
  W.put(M.rim,new THREE.CylinderGeometry(rin*.98,rin*.98,.02,32).rotateZ(X).translate(sd*w*.3,0,0));
  for(let k=0;k<10;k++){const a=k/10*TAU;W.put(M.rimL,new THREE.BoxGeometry(.02,rin*.62,.07),M4().makeRotationX(a).multiply(T(sd*(w*.3+.015),rin*.5,0)).multiply(M4().makeRotationY(.6)));}
  W.put(M.rimL,new THREE.TorusGeometry(rin*.96,.014,6,32).rotateY(X).translate(sd*w*.38,0,0));
  W.put(M.gloss,new THREE.CylinderGeometry(rin*.22,rin*.26,.06,16).rotateZ(X).translate(sd*(w*.32+.02),0,0));
  W.put(M.blueDim,new THREE.TorusGeometry(rin*.24,.006,4,16).rotateY(X).translate(sd*(w*.32+.052),0,0));
  W.flush(spin);return{grp,spin};};
 P.wheels=[];
 for(const [x,z,r,w,front] of[[-.88,-1.78,.38,.3,1],[.88,-1.78,.38,.3,1],[-.88,1.75,.42,.36,0],[.88,1.75,.42,.36,0]]){const wh=wheel(r,w,front,Math.sign(x));wh.grp.position.set(x,r,z);group.add(wh.grp);P.wheels.push({...wh,front:!!front});}

 // --- driver (hidden in the cockpit camera): plain dark helmet, no emblems
 P.helmet=new THREE.Group();group.add(P.helmet);
 {const D=new Kit();D.put(M.helm,new THREE.SphereGeometry(.14,24,16),E(0,1.0,.6,0,0,0,[.95,1,1.1]));
  D.put(M.visor,new THREE.SphereGeometry(.143,20,8,-1.1+Math.PI,2.2,1.2,.5),E(0,1.0,.6,0,0,0,[.95,1,1.1]));
  D.put(M.suit,new THREE.CylinderGeometry(.2,.17,.4,12),E(0,.72,.75,-.25,0,0,[1,1,.7]));
  for(const s of[-1,1]){const r=rodM([s*.2,.84,.68],[s*.15,.72,-.04]);D.put(M.suit,new THREE.CylinderGeometry(.045,.04,r.len,8),r.m);}
  D.flush(P.helmet);}

 P.mirrorMat=null;
 K.flush(group);
 P.eye={cockpit:[0,.98,.56],onboard:[0,1.42,.98]};P.length=6.15;P.width=2.25;P.name='nightcar';
 return P;}
