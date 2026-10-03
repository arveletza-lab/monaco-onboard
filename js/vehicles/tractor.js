// Old farm tractor (1950s–60s style, no brand): faded green paint with rust, faded yellow rims, big lugged rear
// wheels, narrow twin front wheels, long hood with grille, bent vertical exhaust, pan seat on a leaf spring.
// build(group) fills the group and returns the parts the game drives (same shape as CARP in js/car.js).
// Coordinates: x right, y up, z backwards (front at negative z), tyres resting on y=0. Length ~3.3 m.

import {COL,TAU,canvas,fbm,mulberry} from '../util.js';

// ---------------------------------------------------------------- textures (painted once, local to this vehicle)
function tex(c,srgb){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
const hex=h=>[(h>>16)&255,(h>>8)&255,h&255];
// worn paint: mottled base, rust patches with dark rims, chips, drips and scratches; also returns a bump map
function wornPaint(base,rust,seed,S){S=S||256;const rnd=mulberry(seed);const c=canvas(S,S),g=c.getContext('2d');const b=canvas(S,S),gb=b.getContext('2d');
 const img=g.createImageData(S,S),bi=gb.createImageData(S,S);const B=hex(base),Ru=[122,58,24],Rd=[70,34,16];const ox=rnd()*100,oy=rnd()*100;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=(y*S+x)*4;const m=fbm(x/38+ox,y/38+oy,4),f=fbm(x/9+oy,y/9+ox,3);
  let col=B.map(v=>v*(.78+.42*m+.12*(f-.5)));let h=150;
  const r=fbm(x/26-ox,y/26+oy,5)+.25*(f-.5);const t=1-rust;
  if(r>t){const q=Math.min(1,(r-t)*9);const rc=Ru.map((v,i)=>Rd[i]+(v-Rd[i])*(f*1.4));col=col.map((v,i)=>v+(rc[i]-v)*q);h=150+70*q*f;}
  else if(r>t-.035){col=col.map(v=>v*.62);h=135;}
  img.data[k]=col[0];img.data[k+1]=col[1];img.data[k+2]=col[2];img.data[k+3]=255;bi.data[k]=bi.data[k+1]=bi.data[k+2]=h;bi.data[k+3]=255;}
 g.putImageData(img,0,0);gb.putImageData(bi,0,0);
 for(let i=0;i<S*.35;i++){const x=rnd()*S,y=rnd()*S,s=1+rnd()*3;g.fillStyle=rnd()<.5?'rgba(150,150,140,.55)':'rgba(96,46,20,.7)';g.fillRect(x,y,s,s*(.6+rnd()));}
 for(let i=0;i<S*.06;i++){const x=rnd()*S,y=rnd()*S,l=8+rnd()*40;const gr=g.createLinearGradient(x,y,x,y+l);gr.addColorStop(0,'rgba(110,52,20,.45)');gr.addColorStop(1,'rgba(110,52,20,0)');g.fillStyle=gr;g.fillRect(x,y,1+rnd()*2,l);}
 g.strokeStyle='rgba(30,30,25,.35)';g.lineWidth=1;for(let i=0;i<S*.08;i++){const x=rnd()*S,y=rnd()*S;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rnd()-.5)*40,y+(rnd()-.5)*12);g.stroke();}
 return {map:tex(c),bump:tex(b,false)};}
function rubberTex(){const c=canvas(128,128),g=c.getContext('2d');g.fillStyle='#262522';g.fillRect(0,0,128,128);const rnd=mulberry(31);
 for(let i=0;i<2500;i++){const v=25+rnd()*30|0;g.fillStyle=`rgb(${v},${v},${v-2})`;g.fillRect(rnd()*128,rnd()*128,1,1);}
 g.strokeStyle='rgba(70,62,50,.5)';for(let i=0;i<60;i++){const x=rnd()*128,y=rnd()*128;g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd()*6,y+(rnd()-.5)*2);g.stroke();}
 g.fillStyle='rgba(95,78,55,.35)';for(let i=0;i<30;i++)g.fillRect(rnd()*128,rnd()*128,3+rnd()*8,2+rnd()*5); // dried mud
 return tex(c);}
function grilleTex(){const c=canvas(64,64),g=c.getContext('2d');g.fillStyle='#10120e';g.fillRect(0,0,64,64);g.fillStyle='#3a3c33';for(let x=0;x<64;x+=4)g.fillRect(x,0,1,64);g.fillStyle='rgba(120,60,25,.5)';for(let i=0;i<40;i++)g.fillRect(Math.random()*64,Math.random()*64,2,3);const t=tex(c);t.repeat.set(4,3);return t;}
function plateTex(){const c=canvas(64,64),g=c.getContext('2d');g.fillStyle='#4a3a2c';g.fillRect(0,0,64,64);g.fillStyle='#6a4a30';for(let y=0;y<64;y+=8)for(let x=(y/8%2)*4;x<64;x+=8){g.save();g.translate(x+2,y+2);g.rotate(.7);g.fillRect(-3,-1,6,2);g.restore();}const t=tex(c);t.repeat.set(5,3);return t;}

// ---------------------------------------------------------------- geometry helpers
function loft(secs,cx,M){M=M||28;const pos=[],idx=[];for(const [z,w,top,bot,e] of secs){const mid=(top+bot)/2,hh=(top-bot)/2,hw=w/2;for(let k=0;k<M;k++){const a=k/M*TAU,c=Math.cos(a),s=Math.sin(a);pos.push((cx||0)+hw*Math.sign(c)*Math.pow(Math.abs(c),2/e),mid+hh*Math.sign(s)*Math.pow(Math.abs(s),2/e),z);}}
 for(let r=0;r<secs.length-1;r++)for(let k=0;k<M;k++){const a=r*M+k,b=r*M+(k+1)%M,c=a+M,d=b+M;idx.push(a,b,c,b,d,c);}
 const n=secs.length;const f0=pos.length/3;pos.push(cx||0,(secs[0][2]+secs[0][3])/2,secs[0][0]);const f1=f0+1;pos.push(cx||0,(secs[n-1][2]+secs[n-1][3])/2,secs[n-1][0]);
 for(let k=0;k<M;k++){idx.push(f0,(k+1)%M,k);idx.push(f1,(n-1)*M+k,(n-1)*M+(k+1)%M);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
 const uv=[];for(let i=0;i<pos.length/3;i++)uv.push(pos[i*3+2]*.6,pos[i*3+1]*.6+pos[i*3]*.3);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
const M4=()=>new THREE.Matrix4();
const T=(x,y,z)=>M4().makeTranslation(x,y,z);
const E=(x,y,z,rx,ry,rz,s)=>M4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'XYZ')),new THREE.Vector3(...(s||[1,1,1])));
// a cylinder from a to b
function rodM(a,b){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());return {len:A.distanceTo(B),m:M4().compose(A.clone().add(B).multiplyScalar(.5),q,new THREE.Vector3(1,1,1))};}
// push vertices inwards around dent centres: [x,y,z,radius,depth,dirX,dirY,dirZ]
function dent(g,list){const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);for(const [cx,cy,cz,r,d,dx,dy,dz] of list){const q=((x-cx)**2+(y-cy)**2+(z-cz)**2)/(r*r);if(q<4){const f=d*Math.exp(-q*1.6);x+=dx*f;y+=dy*f;z+=dz*f;}}p.setXYZ(i,x,y,z);}g.computeVertexNormals();return g;}
// merges geometries per material: one mesh per material and parent
class Kit{constructor(){this.m=new Map();}
 put(mat,geo,m){const g=geo.index?geo.toNonIndexed():geo.clone();if(m)g.applyMatrix4(m);if(!g.attributes.normal)g.computeVertexNormals();let a=this.m.get(mat);if(!a){a=[];this.m.set(mat,a);}a.push(g);}
 flush(parent){for(const [mat,gs] of this.m){let n=0;for(const g of gs)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;
   for(const g of gs){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);o+=c;}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));geo.computeBoundingSphere();
   const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);}
  this.m.clear();}}

// ---------------------------------------------------------------- the tractor
export function build(group){const P={};
 const std=(c,r,m,o)=>new THREE.MeshStandardMaterial(Object.assign({color:COL(c),roughness:r,metalness:m||0},o||{}));
 const gp=wornPaint(0x4c6534,.36,7),gd=wornPaint(0x34412a,.4,11),yp=wornPaint(0xb89a4a,.26,23,128),rs=wornPaint(0x6e3a1c,.95,41,128);
 const M={
  green:std(0xffffff,.78,.12,{map:gp.map,bumpMap:gp.bump,bumpScale:.012}),
  greenD:std(0xffffff,.85,.15,{map:gd.map,bumpMap:gd.bump,bumpScale:.01}),
  yellow:std(0xffffff,.7,.15,{map:yp.map,bumpMap:yp.bump,bumpScale:.01}),
  rust:std(0xffffff,.95,.25,{map:rs.map,bumpMap:rs.bump,bumpScale:.02}),
  tyre:std(0xffffff,.96,0,{map:rubberTex()}),
  iron:std(0x2e2f2b,.7,.55),
  grille:std(0xffffff,.8,.4,{map:grilleTex()}),
  plate:std(0xffffff,.9,.35,{map:plateTex()}),
  glass:std(0xe8e2c0,.15,.1,{emissive:COL(0x2a2412)}),
  glassBroken:std(0x14161a,.2,.3),
  chromeOld:std(0x8a8a82,.45,.75),
  shirt:std(0x56728c,.95,0),pants:std(0x3b3d48,.95,0),skin:std(0xc08a66,.8,0),straw:std(0xcdb27a,.9,0),band:std(0x5a2a1e,.9,0),boot:std(0x2e2117,.85,0),
  gauge:std(0xe9e3d0,.5,0),hole:std(0x16120e,.95,0)};
 P.M=M;
 const K=new Kit();const box=(mat,w,h,d,m)=>K.put(mat,new THREE.BoxGeometry(w,h,d),m);const cyl=(mat,rt,rb,h,seg,m,open)=>K.put(mat,new THREE.CylinderGeometry(rt,rb,h,seg,1,!!open),m);
 const rod=(mat,a,b,r,seg)=>{const {len,m}=rodM(a,b);K.put(mat,new THREE.CylinderGeometry(r,r,len,seg||8),m);};
 const X=Math.PI/2;

 // --- chassis: frame rails, engine block, transmission case and rear axle housings
 for(const s of[-1,1])box(M.greenD,.07,.12,2.0,T(s*.17,.56,-.75));
 box(M.greenD,.34,.42,1.55,T(0,.78,-.85));                       // engine block
 box(M.iron,.3,.1,1.2,T(0,.52,-.85));                             // oil pan
 box(M.greenD,.6,.56,.78,T(0,.74,.6));                            // transmission / differential
 box(M.greenD,.42,.2,.5,T(0,1.06,.5));                            // top cover
 for(const s of[-1,1]){const {len,m}=rodM([s*.28,.7,.75],[s*.66,.7,.75]);K.put(M.greenD,new THREE.CylinderGeometry(.11,.085,len,14),m);}
 // front pedestal (narrow tricycle front)
 cyl(M.greenD,.07,.09,.36,12,T(0,.5,-1.47));
 box(M.greenD,.38,.08,.1,T(0,.33,-1.47));
 rod(M.iron,[0,.62,-1.5],[0,.62,-1.3],.08,12);

 // --- hood: rounded lid, side panels (left complete, right one hanging, one missing), grille and radiator
 const lid=loft([[-1.76,.5,1.27,1.08,3.6],[-1.4,.52,1.29,1.08,3.6],[-.6,.53,1.3,1.08,3.6],[0,.54,1.31,1.08,3.6]],0,32);
 dent(lid,[[.12,1.3,-.9,.12,-.025,0,1,0],[-.15,1.28,-.35,.09,-.02,.4,1,0]]);K.put(M.green,lid);
 const panel=(w,h,dents)=>{const g=new THREE.PlaneGeometry(w,h,12,6);if(dents)dent(g,dents);return g;};
 const mSide=new THREE.MeshStandardMaterial().copy(M.green);mSide.side=THREE.DoubleSide;
 // left front and rear panels (the rear one dented)
 K.put(mSide,panel(.86,.3),E(-.262,.95,-1.3,0,-X,0));
 K.put(mSide,panel(.86,.3,[[.1,-.02,0,.09,.035,0,0,1],[-.2,.08,0,.06,.02,0,0,1]]),E(-.262,.95,-.43,0,-X,0));
 // right front panel hanging from its front hinge, swung out
 {const hp=new THREE.Group();hp.position.set(.262,1.09,-1.72);hp.rotation.set(.05,.55,-.25);const g=panel(.86,.3,[[0,-.05,0,.12,.03,0,0,1]]);g.applyMatrix4(E(0,-.15,.43,0,X,0));hp.updateMatrix();K.put(mSide,g,hp.matrix);}
 // louvres on the complete side
 for(let k=0;k<5;k++)box(M.green,.02,.025,.12,T(-.272,1.02-k*.035,-1.42));
 // exposed engine on the right rear: cylinder head, spark plugs and wires, manifold
 box(M.iron,.1,.22,.62,T(.2,.98,-.45));
 for(let k=0;k<2;k++){cyl(M.chromeOld,.012,.012,.08,6,E(.27,1.02,-.62+k*.34,0,0,X));rod(M.iron,[.31,1.02,-.62+k*.34],[.3,1.1,-.85+k*.2],.006,4);}
 {const {len,m}=rodM([.24,.86,-.75],[.24,.86,-.15]);K.put(M.rust,new THREE.CylinderGeometry(.045,.045,len,10),m);}
 box(M.rust,.08,.08,.1,T(.24,.86,-.8));
 // grille: frame, bars (one bent) and radiator core
 box(M.green,.54,.06,.06,T(0,1.25,-1.77));box(M.green,.54,.06,.06,T(0,.8,-1.77));for(const s of[-1,1])box(M.green,.06,.5,.06,T(s*.24,1.02,-1.77));
 box(M.grille,.44,.42,.02,T(0,1.02,-1.74));
 for(let k=0;k<8;k++){const y=.86+k*.048;const bent=k===3;box(M.iron,.44,.012,.02,bent?E(.02,y-.012,-1.795,.25,0,.06):T(0,y,-1.785));}
 cyl(M.chromeOld,.035,.04,.05,12,T(0,1.33,-1.62));                  // radiator cap
 // exhaust (bent, rusty, with rain flap) and the air intake stack
 {const c=new THREE.CatmullRomCurve3([[.11,1.22,-1.12],[.11,1.5,-1.12],[.125,1.68,-1.105],[.17,1.84,-1.07],[.24,1.95,-1.03]].map(a=>new THREE.Vector3(...a)));K.put(M.rust,new THREE.TubeGeometry(c,16,.042,10,false));
  K.put(M.rust,new THREE.TorusGeometry(.042,.008,6,12),E(.24,1.95,-1.03,X,0,-.6));cyl(M.iron,.05,.05,.008,12,E(.28,2.0,-1.02,0,0,.9));}
 cyl(M.greenD,.03,.03,.2,10,T(-.1,1.38,-1.42));cyl(M.green,.075,.06,.1,14,T(-.1,1.5,-1.42));cyl(M.green,.085,.085,.02,14,T(-.1,1.56,-1.42));
 // steering shaft along the hood top to the gear box at the cowl
 rod(M.iron,[0,1.335,-1.66],[0,1.37,.3],.018,8);box(M.greenD,.12,.1,.12,T(0,1.33,-1.66));

 // --- cowl / fuel tank, gauge and levers
 K.put(M.green,loft([[-.02,.58,1.4,.8,3.4],[.3,.6,1.42,.8,3.4]],0,24));
 cyl(M.chromeOld,.035,.035,.04,8,T(.18,1.47,.12));
 box(M.greenD,.14,.14,.16,T(0,1.34,.38));
 K.put(M.iron,new THREE.CylinderGeometry(.045,.045,.02,16),E(-.14,1.18,.31,X,0,0));K.put(M.gauge,new THREE.CircleGeometry(.036,16),E(-.14,1.18,.322,0,0,0));
 rod(M.iron,[.24,1.0,.7],[.36,1.48,.98],.012,6);K.put(M.iron,new THREE.SphereGeometry(.025,8,6),T(.36,1.48,.98));
 rod(M.iron,[-.22,1.36,.32],[-.3,1.5,.48],.01,6);

 // --- platform, seat on its leaf spring, drawbar
 box(M.plate,.9,.03,.5,T(0,.6,1.18));for(const s of[-1,1])rod(M.iron,[s*.4,.6,.98],[s*.3,.7,.85],.02,6);
 {const leaf=new THREE.CatmullRomCurve3([[0,1.0,.85],[0,1.06,1.0],[0,1.1,1.15],[0,1.12,1.26]].map(a=>new THREE.Vector3(...a)));const g=new THREE.TubeGeometry(leaf,10,.03,6,false);g.scale(1.8,.55,1);g.translate(0,.48,0);K.put(M.rust,g);}
 {const pts=[];for(let k=0;k<=8;k++){const t=k/8;pts.push(new THREE.Vector2(.02+.23*Math.sin(t*X),.09*(1-Math.cos(t*X))*(t<.85?1:1.2)));}pts.push(new THREE.Vector2(.25,.11));
  const pan=new THREE.LatheGeometry(pts,20);pan.scale(1,1,.92);const mPan=new THREE.MeshStandardMaterial().copy(M.yellow);mPan.side=THREE.DoubleSide;mPan.color=COL(0x8a8a74);K.put(mPan,pan,E(0,1.1,1.27,-.12,0,0));}
 box(M.iron,.1,.06,.42,T(0,.36,1.25));K.put(M.iron,new THREE.TorusGeometry(.05,.012,6,12),E(0,.36,1.48,X,0,0));

 // --- rear fenders: left one dented, right one with its rear part torn off
 const fender=(s,t0,tl,dents)=>{const g=new THREE.CylinderGeometry(.8,.8,.38,30,4,true,t0,tl);g.rotateZ(X);g.translate(s*.78,.7,.75);if(dents)dent(g,dents);
  const mF=new THREE.MeshStandardMaterial().copy(M.green);mF.side=THREE.DoubleSide;K.put(mF,g);
  for(const e of[-1,1]){const l=new THREE.TorusGeometry(.8,.014,5,30,tl);l.rotateZ(Math.PI-t0-tl);l.rotateY(X);l.translate(s*.78+e*.19,.7,.75);if(dents)dent(l,dents);K.put(M.green,l);}};
 fender(-1,.2,2.45,[[-.95,1.42,.6,.16,-.09,0,1,.2],[-.68,1.3,1.32,.1,-.05,0,.6,.8]]);
 fender(1,.78,1.87,[[.78,1.5,.55,.12,-.03,0,1,0]]);
 {const flap=new THREE.PlaneGeometry(.34,.16,4,2);dent(flap,[[0,0,0,.1,.03,0,0,1]]);const mF=new THREE.MeshStandardMaterial().copy(M.rust);mF.side=THREE.DoubleSide;K.put(mF,flap,E(.86,1.24,1.36,.6,X+.4,.15));}
 for(const s of[-1,1])rod(M.greenD,[s*.6,.75,.35],[s*.62,1.0,.1],.02,6);

 // --- headlights: left intact, right broken and hanging
 for(const s of[-1,1]){const broken=s>0;const hx=s*.36,hy=broken?1.06:1.13,hz=-1.52;
  rod(M.iron,[s*.26,1.05,-1.45],[hx,hy-.03,hz+.04],.012,6);
  const rot=broken?E(hx,hy,hz,-.55,s*.25,.2):E(hx,hy,hz,0,0,0);
  K.put(M.green,new THREE.CylinderGeometry(.085,.06,.11,16,1,false).rotateX(X),rot);
  K.put(M.chromeOld,new THREE.TorusGeometry(.082,.01,6,16).translate(0,0,-.056),rot);
  if(!broken)K.put(M.glass,new THREE.CircleGeometry(.078,16).rotateY(Math.PI).translate(0,0,-.06),rot);
  else{K.put(M.glassBroken,new THREE.CircleGeometry(.078,16).rotateY(Math.PI).translate(0,0,-.03),rot);
   const sh=new THREE.BufferGeometry();const v=[];for(const a of[.3,1.6,2.9,4.4]){const r1=.078,r2=.02+.03*Math.abs(Math.sin(a*3));v.push(Math.cos(a)*r1,Math.sin(a)*r1,-.058,Math.cos(a+.45)*r1,Math.sin(a+.45)*r1,-.058,Math.cos(a+.2)*r2,Math.sin(a+.2)*r2,-.058);}
   sh.setAttribute('position',new THREE.Float32BufferAttribute(v,3));sh.computeVertexNormals();const mG=std(0xc8c8b8,.1,.2,{transparent:true,opacity:.6,side:THREE.DoubleSide});K.put(mG,sh,rot);}}

 // --- wheels
 const tyreGeo=(r,rin,w,ribs)=>{const pts=[];const hw=w/2,c=Math.min(.06,(r-rin)*.4);pts.push(new THREE.Vector2(rin,-hw*.92));pts.push(new THREE.Vector2(rin+.02,-hw));
  for(let k=0;k<=6;k++){const a=k/6*X;pts.push(new THREE.Vector2(r-c+Math.sin(a)*c,-hw+c-Math.cos(a)*c));}
  if(ribs){for(let k=1;k<ribs;k++){const y=-hw+c+(w-2*c)*k/ribs;pts.push(new THREE.Vector2(r-.012,y-.012),new THREE.Vector2(r,y-.004),new THREE.Vector2(r,y+.004),new THREE.Vector2(r-.012,y+.012));}}
  for(let k=0;k<=6;k++){const a=k/6*X;pts.push(new THREE.Vector2(r-c+Math.cos(a)*c,hw-c+Math.sin(a)*c));}
  pts.push(new THREE.Vector2(rin+.02,hw));pts.push(new THREE.Vector2(rin,hw*.92));
  const g=new THREE.LatheGeometry(pts,r>.5?40:28);g.rotateZ(X);return g;};
 const wheel=(r,rin,w,rear,flip)=>{const grp=new THREE.Group(),spin=new THREE.Group();grp.add(spin);const W=new Kit();
  W.put(M.tyre,tyreGeo(rear?r-.055:r,rin,w,rear?0:3));
  if(rear){const N=22,h=mulberry(r*1000|0);for(let k=0;k<N;k++)for(const s of[-1,1]){const a=k/N*TAU+(s>0?Math.PI/N:0);const wear=.55+.45*h();
    const m=M4().makeRotationX(a).multiply(T(s*.085,r-.055+.03*wear,0)).multiply(M4().makeRotationY(s*.55)).multiply(M4().makeScale(1,wear,1));W.put(M.tyre,new THREE.BoxGeometry(.2,.065,.075),m);}}
  // rim: dished disc, flanges, ribs, hub and bolts (faded yellow with rust)
  const sd=flip?-1:1;const mRim=new THREE.MeshStandardMaterial().copy(M.yellow);mRim.side=THREE.DoubleSide;
  W.put(mRim,new THREE.CylinderGeometry(rin,rin,w*.86,28,1,true).rotateZ(X));
  for(const e of[-1,1])W.put(M.yellow,new THREE.TorusGeometry(rin,.018,6,28).rotateY(X).translate(e*w*.43,0,0));
  W.put(M.yellow,new THREE.CylinderGeometry(rin*.97,rin*.97,.025,28).rotateZ(X).translate(sd*w*.12,0,0));
  const nr=rear?8:5;for(let k=0;k<nr;k++){const a=k/nr*TAU;W.put(M.yellow,new THREE.BoxGeometry(.03,rin*.55,.05),M4().makeRotationX(a).multiply(T(sd*(w*.12+.02),rin*.55,0)));
   W.put(M.hole,new THREE.CylinderGeometry(rin*.12,rin*.12,.03,10).rotateZ(X),M4().makeRotationX(a+Math.PI/nr).multiply(T(sd*(w*.12+.01),rin*.62,0)));}
  W.put(M.yellow,new THREE.CylinderGeometry(rin*.3,rin*.34,w*.6,16).rotateZ(X).translate(sd*w*.15,0,0));
  for(let k=0;k<6;k++){const a=k/6*TAU;W.put(M.iron,new THREE.CylinderGeometry(.012,.012,.03,6).rotateZ(X),M4().makeRotationX(a).multiply(T(sd*(w*.45),rin*.2,0)));}
  W.put(M.rust,new THREE.CylinderGeometry(rin*.15,rin*.15,.04,12).rotateZ(X).translate(sd*w*.47,0,0));
  W.flush(spin);return{grp,spin};};
 P.wheels=[];
 for(const [x,z,r,rin,w,rear] of[[-.15,-1.47,.33,.19,.13,0],[.15,-1.47,.33,.19,.13,0],[-.78,.75,.7,.48,.34,1],[.78,.75,.7,.48,.34,1]]){const wh=wheel(r,rin,w,rear,x<0);wh.grp.position.set(x,r,z);group.add(wh.grp);P.wheels.push({...wh,front:!rear});}

 // --- steering wheel: big, almost flat, three thin spokes; the farmer's hands on it
 rod(M.iron,[0,1.34,.4],[0,1.6,.62],.02,8);
 const mount=new THREE.Group();mount.position.set(0,1.61,.63);mount.rotation.x=-1.1;group.add(mount);const spinW=new THREE.Group();mount.add(spinW);P.sw=spinW;
 {const S=new Kit();S.put(M.iron,new THREE.TorusGeometry(.22,.014,8,36));for(let k=0;k<3;k++){const a=k/3*TAU+X;S.put(M.iron,new THREE.BoxGeometry(.21,.012,.008),M4().makeRotationZ(a).multiply(T(.105,0,-.01)));}
  S.put(M.iron,new THREE.CylinderGeometry(.035,.035,.04,12).rotateX(X));S.put(M.rust,new THREE.CylinderGeometry(.02,.02,.045,10).rotateX(X));
  for(const s of[-1,1]){S.put(M.skin,new THREE.SphereGeometry(.04,10,8),E(s*.2,-.06,.02,0,0,0,[1,1.3,.9]));S.put(M.skin,new THREE.SphereGeometry(.016,8,6),E(s*.18,-.02,.03,0,0,0,[1.6,1,1]));}
  S.flush(spinW);}

 // --- the farmer (hidden in the cockpit camera): straw hat, faded work shirt, arms to the wheel
 P.helmet=new THREE.Group();group.add(P.helmet);
 {const D=new Kit();
  D.put(M.shirt,new THREE.CylinderGeometry(.17,.15,.5,12),E(0,1.47,1.2,-.22,0,0,[1,1,.75]));
  D.put(M.shirt,new THREE.SphereGeometry(.17,12,8),E(0,1.7,1.15,0,0,0,[1.15,.5,.8]));
  D.put(M.skin,new THREE.CylinderGeometry(.045,.05,.08,8),T(0,1.79,1.13));
  D.put(M.skin,new THREE.SphereGeometry(.1,16,12),E(0,1.9,1.12,0,0,0,[.9,1.08,1]));
  D.put(M.skin,new THREE.SphereGeometry(.025,6,6),E(0,1.88,1.02,0,0,0));
  D.put(M.straw,new THREE.CylinderGeometry(.21,.21,.012,24),E(0,1.97,1.12,-.08,0,0));
  D.put(M.straw,new THREE.CylinderGeometry(.095,.11,.1,16),E(0,2.03,1.125,-.08,0,0));
  D.put(M.band,new THREE.CylinderGeometry(.112,.112,.025,16),E(0,1.99,1.125,-.08,0,0));
  for(const s of[-1,1]){const sh=[s*.17,1.68,1.13],el=[s*.24,1.5,.92],hd=[s*.2,1.56,.64];
   let r=rodM(sh,el);D.put(M.shirt,new THREE.CylinderGeometry(.05,.045,r.len,8),r.m);r=rodM(el,hd);D.put(M.shirt,new THREE.CylinderGeometry(.042,.035,r.len,8),r.m);
   const hip=[s*.1,1.22,1.18],kn=[s*.15,1.25,.82],ft=[s*.2,.72,.72];r=rodM(hip,kn);D.put(M.pants,new THREE.CylinderGeometry(.07,.06,r.len,8),r.m);r=rodM(kn,ft);D.put(M.pants,new THREE.CylinderGeometry(.055,.05,r.len,8),r.m);
   D.put(M.boot,new THREE.BoxGeometry(.1,.08,.24),T(s*.2,.68,.66));}
  D.flush(P.helmet);}

 // no dashboard LEDs: 15 materials in a hidden group so the game can still drive them
 const ledG=new THREE.Group();ledG.visible=false;group.add(ledG);P.leds=[];for(let k=0;k<15;k++){const m=new THREE.MeshBasicMaterial({color:0x151515,toneMapped:false});ledG.add(new THREE.Mesh(new THREE.BoxGeometry(.01,.01,.01),m));P.leds.push(m);}
 P.screen=null;P.screenTex=null;P.mirrorMat=null;

 K.flush(group);
 group.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 P.eye={cockpit:[0,1.9,1.04],onboard:[0,2.32,1.36]};P.length=3.3;P.width=1.9;P.name='tractor';
 return P;}
