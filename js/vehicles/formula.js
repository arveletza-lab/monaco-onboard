// Formula car (the original model of js/car.js, as a self-contained vehicle builder).
// build(group) fills the group and returns the parts the game drives (same shape as CARP in js/car.js).
// Coordinates: x right, y up, z backwards (nose at negative z), tyres resting on y=0.

import {COL,TAU,canvas} from '../util.js';
import {carbonTex} from '../textures.js';

function loft(secs,cx,M){M=M||28;const pos=[],idx=[];for(const [z,w,top,bot,e] of secs){const mid=(top+bot)/2,hh=(top-bot)/2,hw=w/2;for(let k=0;k<M;k++){const a=k/M*TAU,c=Math.cos(a),s=Math.sin(a);pos.push((cx||0)+hw*Math.sign(c)*Math.pow(Math.abs(c),2/e),mid+hh*Math.sign(s)*Math.pow(Math.abs(s),2/e),z);}}
 for(let r=0;r<secs.length-1;r++)for(let k=0;k<M;k++){const a=r*M+k,b=r*M+(k+1)%M,c=a+M,d=b+M;idx.push(a,b,c,b,d,c);}
 const n=secs.length;const f0=pos.length/3;pos.push(cx||0,(secs[0][2]+secs[0][3])/2,secs[0][0]);const f1=f0+1;pos.push(cx||0,(secs[n-1][2]+secs[n-1][3])/2,secs[n-1][0]);
 for(let k=0;k<M;k++){idx.push(f0,(k+1)%M,k);idx.push(f1,(n-1)*M+k,(n-1)*M+(k+1)%M);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}

export function build(group){const P={};
const std=(c,r,m,map)=>new THREE.MeshStandardMaterial({color:COL(c),roughness:r,metalness:m,map:map||null});const cf=carbonTex();
 const M={white:std(0x1a2246,.38,.25),red:std(0xc41a2c,.35,.15),carbon:std(0xffffff,.42,.35,cf),tyre:std(0x1b1b1c,.9,0),rim:std(0x24272c,.3,.8),halo:std(0x3a3d42,.25,.85),black:std(0x0a0b0c,.75,0),alcantara:std(0x141516,.95,0),yellow:std(0xf2c400,.5,0),glove:std(0x0f1428,.9,0),cuff:std(0xc8102e,.8,0),rubber:std(0x2a2b2e,.9,0)};
 P.M=M;
 const add=(geo,mat,x,y,z,parent)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);(parent||group).add(m);m.castShadow=true;return m;};
 // monocoque, nose and bodywork (smooth lofted sections)
 add(loft([[-3.8,.12,.3,.21,2.2],[-3.6,.2,.35,.2,2.3],[-3.2,.28,.42,.2,2.5],[-2.7,.36,.5,.21,2.6],[-2.2,.44,.56,.22,2.8],[-1.75,.52,.61,.22,3]]),M.white);
 add(loft([[-3.2,.06,.425,.4,2],[-2.2,.12,.565,.54,2],[-1.8,.14,.615,.6,2]]),M.red);
 add(loft([[-1.76,.52,.61,.12,3],[-1.2,.64,.665,.1,3.4],[-.62,.74,.7,.1,3.6]]),M.white);
 add(new THREE.BoxGeometry(.5,.14,.02),M.carbon,0,.62,-.61);
 const navyD=std(0x111734,.55,.15);for(const s of[-1,1]){add(loft([[-.62,.14,.63,.1,6],[-.2,.14,.61,.1,6]],s*.36),navyD);add(loft([[-.2,.14,.56,.1,6],[.42,.16,.6,.1,6]],s*.36),navyD);
  
  add(loft([[-.62,.52,.6,.12,3.2],[-.3,.6,.62,.12,3],[.4,.56,.58,.12,3],[1.0,.42,.46,.12,2.8],[1.5,.24,.34,.12,2.5]],s*.66),M.white);
  add(loft([[-.64,.42,.55,.2,3],[-.61,.42,.55,.2,3]],s*.66),M.black);}
 add(loft([[-.6,.5,.4,.12,3],[.3,.5,.4,.12,3]]),M.black);
 add(loft([[.26,.5,.74,.45,3],[.4,.46,.72,.45,3]]),M.alcantara);
 add(loft([[.36,.6,.97,.1,3],[.55,.52,1.14,.1,2.6],[.85,.44,1.1,.1,2.6],[1.4,.34,.85,.1,2.5],[2.0,.24,.62,.1,2.4],[2.4,.14,.5,.1,2.2]]),M.white);
 add(loft([[.34,.2,1.12,.97,2],[.37,.2,1.12,.97,2]]),M.black);
 add(new THREE.BoxGeometry(.012,.3,1.2),M.white,0,.95,1.5);
 add(new THREE.BoxGeometry(1.5,.04,3.3),M.carbon,0,.06,.35);
 add(new THREE.BoxGeometry(.12,.08,.12),M.black,0,1.18,.66);
 // front wing: flat centre section, stepped outer flaps, endplates
 add(new THREE.BoxGeometry(1.98,.03,.46),M.carbon,0,.1,-3.76);
 for(const s of[-1,1]){const f2=add(new THREE.BoxGeometry(.72,.022,.28),M.carbon,s*.62,.16,-3.52);f2.rotation.x=.28;const f3=add(new THREE.BoxGeometry(.7,.022,.24),M.red,s*.63,.22,-3.36);f3.rotation.x=.5;const f4=add(new THREE.BoxGeometry(.66,.02,.18),M.carbon,s*.64,.28,-3.24);f4.rotation.x=.7;
  add(loft([[-3.98,.022,.34,.05,2],[-3.2,.022,.36,.05,2]],s*.985),M.red);}
 // rear wing + beam wing
 add(new THREE.BoxGeometry(1.0,.035,.42),M.carbon,0,.84,2.55);const rw=add(new THREE.BoxGeometry(1.0,.03,.28),M.red,0,.97,2.62);rw.rotation.x=-.35;
 for(const s of[-1,1])add(loft([[2.28,.025,1.02,.45,2],[2.84,.025,1.04,.5,2]],s*.51),M.white);
 add(new THREE.BoxGeometry(.9,.03,.3),M.carbon,0,.45,2.42);add(new THREE.BoxGeometry(.06,.5,.2),M.carbon,0,.62,2.45);
 add(new THREE.BoxGeometry(.12,.05,.02),new THREE.MeshBasicMaterial({color:0xff2020}),0,.52,2.48);
 // wheels: 18" rims with covers, medium-compound yellow band
 const wheel=(r,w,front)=>{const grp=new THREE.Group();const spin=new THREE.Group();grp.add(spin);
  const ty=new THREE.CylinderGeometry(r,r,w,40);ty.rotateZ(Math.PI/2);spin.add(new THREE.Mesh(ty,M.tyre));
  const sw=new THREE.TorusGeometry(r-.035,.035,8,40);for(const sd of[-1,1]){const t=new THREE.Mesh(sw,M.tyre);t.rotation.y=Math.PI/2;t.position.x=sd*(w/2-.01);spin.add(t);}
  const cover=new THREE.CylinderGeometry(r*.62,r*.62,w+.01,28);cover.rotateZ(Math.PI/2);spin.add(new THREE.Mesh(cover,M.rim));
  for(const sd of[-1,1]){for(let k=0;k<3;k++){const a=new THREE.Mesh(new THREE.TorusGeometry(r*.8,.011,4,16,Math.PI/2.1),M.yellow);a.rotation.y=Math.PI/2;a.rotation.x=k*TAU/3;a.position.x=sd*(w/2+.004);spin.add(a);}
   for(let k=0;k<6;k++){const sp=new THREE.Mesh(new THREE.BoxGeometry(.006,.02,r*1.1),M.black);sp.position.x=sd*(w/2+.008);sp.rotation.x=k*TAU/6;spin.add(sp);}}
  if(front){const dfl=new THREE.Mesh(new THREE.BoxGeometry(w*.8,.012,.22),M.carbon);dfl.position.set(0,r+.07,.02);dfl.rotation.x=-.2;grp.add(dfl);}
  return{grp,spin};};
 P.wheels=[];
 for(const [x,z,r,w,front] of[[-.8,-2.05,.36,.37,1],[.8,-2.05,.36,.37,1],[-.77,1.62,.36,.44,0],[.77,1.62,.36,.44,0]]){const wh=wheel(r,w,front);wh.grp.position.set(x,r,z);group.add(wh.grp);P.wheels.push({...wh,front});}
 const rod=(a,b,r,mat)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const len=A.distanceTo(B);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,6),mat);m.scale.set(1,1,.45);m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());group.add(m);return m;};
 for(const s of[-1,1]){rod([s*.26,.52,-1.85],[s*.64,.47,-2.05],.022,M.carbon);rod([s*.26,.52,-2.3],[s*.64,.47,-2.05],.022,M.carbon);rod([s*.24,.24,-1.8],[s*.64,.25,-2.05],.022,M.carbon);rod([s*.24,.24,-2.35],[s*.64,.25,-2.05],.022,M.carbon);rod([s*.22,.28,-2.0],[s*.62,.5,-2.08],.014,M.carbon);
  rod([s*.36,.45,1.4],[s*.64,.42,1.62],.02,M.carbon);rod([s*.36,.2,1.3],[s*.64,.24,1.62],.02,M.carbon);}
 // mirrors on sidepod stalks: live rear view
 const mMat=new THREE.MeshBasicMaterial({color:0x4a525c});P.mirrorMat=mMat;
 for(const s of[-1,1]){rod([s*.36,.56,-.56],[s*.39,.66,-.66],.014,M.white);rod([s*.42,.5,-.5],[s*.46,.66,-.68],.012,M.white);
  add(loft([[-.75,.27,.755,.645,3.4],[-.7,.29,.76,.64,3.4],[-.645,.29,.76,.64,3.4]],s*.40),M.white);
  add(new THREE.BoxGeometry(.03,.016,.06),M.red,s*.27,.75,-.69);
  const g=new THREE.PlaneGeometry(.255,.088);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++){const u=uv.getX(k);uv.setX(k,s<0?1-u*.5:.5-u*.5);}const mp=new THREE.Mesh(g,mMat);mp.position.set(s*.40,.70,-.643);group.add(mp);}
 // halo: titanium hoop only (centre pillar removed for visibility)
 const hp=new THREE.CatmullRomCurve3([[-.31,.68,.4],[-.34,.87,.14],[-.29,.905,-.14],[-.16,.89,-.34],[0,.88,-.42],[.16,.89,-.34],[.29,.905,-.14],[.34,.87,.14],[.31,.68,.4]].map(a=>new THREE.Vector3(...a)));
 const hg=add(new THREE.TubeGeometry(hp,64,.037,12,false),std(0x0b0c0f,.6,.2));
 add(new THREE.BoxGeometry(.07,.06,.13),M.black,0,.655,-.9);
 add(new THREE.BoxGeometry(.46,.42,.02),M.black,0,.36,-.62);
 {const ant=add(new THREE.CylinderGeometry(.005,.005,.17,6),M.black,.17,.62,-1.5);}
 // helmet (only seen from outside)
 P.helmet=new THREE.Group();group.add(P.helmet);{const hm=new THREE.Mesh(new THREE.SphereGeometry(.15,28,18),std(0xf06a1a,.25,.2));hm.scale.set(.95,1,1.12);hm.position.set(0,.88,.06);P.helmet.add(hm);const top=new THREE.Mesh(new THREE.SphereGeometry(.152,28,10,0,TAU,0,.75),std(0x13235a,.25,.2));top.scale.set(.95,1,1.12);top.position.set(0,.88,.06);P.helmet.add(top);const vis=new THREE.Mesh(new THREE.SphereGeometry(.153,24,8,-1.1,2.2,1.25,.42),std(0x0c0e12,.05,.6));vis.rotation.y=Math.PI;vis.scale.set(.95,1,1.12);vis.position.set(0,.88,.06);P.helmet.add(vis);const hans=new THREE.Mesh(new THREE.BoxGeometry(.34,.06,.16),M.black);hans.position.set(0,.71,.12);P.helmet.add(hans);const spoiler=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,.06),M.black);spoiler.position.set(0,1.02,.18);P.helmet.add(spoiler);}
 // steering wheel: carbon body, grips, paddles, display, shift lights, rotaries
 add(new THREE.CylinderGeometry(.018,.018,.2,10),M.carbon,0,.59,-.66).rotation.x=Math.PI/2-.35;
 const mount=new THREE.Group();mount.position.set(0,.648,-.56);mount.rotation.x=-.42;group.add(mount);const spinW=new THREE.Group();spinW.scale.setScalar(.9);mount.add(spinW);P.sw=spinW;
 const sh=new THREE.Shape();sh.moveTo(-.1,.078);sh.lineTo(.1,.078);sh.quadraticCurveTo(.13,.078,.134,.05);sh.lineTo(.14,-.05);sh.quadraticCurveTo(.14,-.1,.09,-.108);sh.lineTo(-.09,-.108);sh.quadraticCurveTo(-.14,-.1,-.14,-.05);sh.lineTo(-.134,.05);sh.quadraticCurveTo(-.13,.078,-.1,.078);
 const bodyG=new THREE.ExtrudeGeometry(sh,{depth:.022,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2,curveSegments:6});bodyG.translate(0,0,-.011);const cfw=cf.clone();cfw.needsUpdate=true;cfw.repeat.set(20,20);
 spinW.add(new THREE.Mesh(bodyG,new THREE.MeshStandardMaterial({map:cfw,color:0x3a3a3a,roughness:.5,metalness:.2})));
 for(const s of[-1,1]){const grip=new THREE.Mesh(new THREE.CylinderGeometry(.024,.022,.12,12),M.rubber);grip.position.set(s*.142,-.012,.004);grip.rotation.z=s*.12;spinW.add(grip);
  const gl=new THREE.Mesh(new THREE.SphereGeometry(.036,16,12),M.glove);gl.scale.set(1.05,1.7,1.15);gl.position.set(s*.15,-.01,.02);spinW.add(gl);const th=new THREE.Mesh(new THREE.SphereGeometry(.016,10,8),M.glove);th.scale.set(1.6,1,1);th.position.set(s*.118,.03,.03);spinW.add(th);
  const pad=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.006),M.carbon);pad.position.set(s*.075,.01,-.03);spinW.add(pad);
  for(let k=0;k<2;k++){const kn=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.01,14),new THREE.MeshStandardMaterial({color:0x8e939a,metalness:.8,roughness:.3}));kn.rotation.x=Math.PI/2;kn.position.set(s*(.05+k*.035),-.058,.017);spinW.add(kn);}
  const btn=(r,col,x,y)=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.012,16),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(.55)}));b.rotation.x=Math.PI/2;b.position.set(x,y,.018);spinW.add(b);};
  if(s<0){btn(.0115,0x17b84a,-.085,.03);btn(.007,0x37c0d8,-.067,.004);btn(.0065,0xd42020,-.09,-.014);btn(.006,0x39d36a,-.062,.042);}else{btn(.0115,0xd42020,.085,.03);btn(.007,0x37c0d8,.067,.004);btn(.0065,0xe07a10,.09,-.014);btn(.006,0xd42020,.1,.045);}
  const rg=new THREE.Group();rg.position.set(s*.05,-.075,.017);spinW.add(rg);const ringCols=s<0?[0xf2c400,0x3ec24a,0xd42020,0x2a7de0,0xb040d0]:[0xd42020,0xd42020,0x333333];ringCols.forEach((c,k)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(.016,.0035,6,18,TAU/ringCols.length),new THREE.MeshBasicMaterial({color:c}));t.rotation.z=k*TAU/ringCols.length;rg.add(t);});}
 const sc=canvas(256,128);P.screen=sc;P.screenTex=new THREE.CanvasTexture(sc);P.screenTex.encoding=THREE.sRGBEncoding;
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(.104,.064),new THREE.MeshBasicMaterial({map:P.screenTex,toneMapped:false}));scr.position.set(0,.006,.0175);spinW.add(scr);
 P.leds=[];for(let k=0;k<15;k++){const m=new THREE.MeshBasicMaterial({color:0x151515,toneMapped:false});const l=new THREE.Mesh(new THREE.BoxGeometry(.008,.006,.004),m);l.position.set(-.07+k*.01,.064,.0175);spinW.add(l);P.leds.push(m);}
 
 group.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 P.eye={cockpit:[0,.79,.02],onboard:[0,1.25,.36]};P.length=5.6;P.width=2.0;P.name='formula';
 return P;}
