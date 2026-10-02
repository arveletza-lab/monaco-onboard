// The Principality: terrain, buildings, barriers and boards, grandstands, tunnel, vegetation, harbour and the start gantry.
// Built once by buildWorld(); the call order matters because R() is a seeded sequence shared by all builders.

import {Batch,CHUNKS,COL,IS_MOBILE,R,TAU,clamp,fbm,hash2,instTiled,lerp,lin,mtx,mulberry,pick,pip,registerChunk,rr,scene,sstep} from './util.js';
import {CHI,DATA,DS,ESC,ESC_W,EXA,EXMAX,GREEN,HW,K,MARETERRA_PARK,N,P,PIT,PSI,RXa,RZa,SDZ,STR,SX,SY,SZ,TUN,TXa,TZa,cpIdx,escAt,isWaterXZ,maskAt,mod,nearest,rangeIdx,roadCap,roadMin,runs} from './track.js';
import {BOARD,armcoTex,asphaltTex,balTex,bannerTex,boardTex,bridgeTex,concreteTex,crowdTex,facadeTex,fenceTex,frondTex,ironTex,kerbTex,kerbTexB,leafTex,numTex,sdBoardTex,shopTex,stoneTex,stuccoTex,tunnelTileTex,waterNormal} from './textures.js';

// strip helper along the track
function strip(i0,count,fn,vScale,mat,shadow,swap){const pos=[],uv=[],idx=[];for(let k=0;k<=count;k++){const i=mod(i0+k);const ab=fn(i);pos.push(...ab[0],...ab[1]);const v=k*DS/vScale;if(swap)uv.push(v*swap,0,v*swap,1);else uv.push(0,v,1,v);}
 for(let k=0;k<count;k++){const a=2*k;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.receiveShadow=true;if(shadow)m.castShadow=true;scene.add(m);return m;}
// ---------------------------------------------------------------- terrain (hand-fitted relief of the Principality + circuit altitudes + OSM coastline)
const TX0=-1400,TX1=1600,TZ0=-2400,TZ1=1400,TC=8;
const TNX=Math.round((TX1-TX0)/TC)+1,TNZ=Math.round((TZ1-TZ0)/TC)+1;
const TH=new Float32Array(TNX*TNZ),TW=new Uint8Array(TNX*TNZ),TD=new Float32Array(TNX*TNZ);
// relief control points (local x east, y north, metres above sea)
const RELIEF=[[-150,-200,3],[-100,20,3],[0,40,3.5],[120,60,6],[250,120,8],[-420,-180,7],[-450,-420,5],[-620,-760,3],[-800,-1000,3],[-380,-40,9],[-470,60,22],[-520,200,40],[-420,300,55],[-300,210,32],[-220,330,58],[-120,260,42],[0,210,36],[80,260,44],[140,330,46],[240,320,43],[300,380,34],[360,440,22],[330,560,40],[230,470,52],[120,470,60],[20,420,62],[-100,470,72],[-300,470,85],[-560,420,95],[-800,300,130],[-1000,0,120],[-900,-400,70],[-700,-300,45],[-600,-100,30],[100,620,70],[250,640,62],[420,650,30],[560,760,12],[700,950,14],[850,1150,22],[600,1000,60],[400,850,80],[200,850,100],[0,800,110],[-250,750,140],[-500,700,150],[-800,700,200],[-1100,500,230],[0,1100,190],[250,1100,150],[500,1200,110],[800,1350,70],[1100,1500,60],[-300,1100,240],[-700,1100,300],[0,1500,320],[400,1600,260],[900,1800,200],[-500,1600,420],[-200,2000,480],[400,2100,450],[1200,2100,380],[-900,1900,520],[-1300,1400,420],[-1300,800,300],[1500,1900,300],[1500,1200,90],
 // Mareterra: low platform a few metres above the sea
 [440,470,5],[500,500,4.5],[580,500,4],[650,560,4],[620,650,4.5],[530,630,5],
 [-260,-620,60],[-120,-640,57],[-20,-700,52],[-360,-600,55],[-420,-560,48],[80,-760,35],[-200,-540,40],[-60,-560,35]];
function landH(X,Z){const x=X,y=-Z;let sw=0,sh=0;for(const c of RELIEF){const d2=(c[0]-x)**2+(c[1]-y)**2;const w=1/Math.pow(d2+900,1.6);sw+=w;sh+=w*c[2];}
 let h=sh/sw;h+=(fbm(X*0.006,Z*0.006,3)-0.5)*(4+Math.max(0,y-600)*0.05);return Math.max(h,2.4);}
function heightAt(X,Z){const fx=(X-TX0)/TC,fz=(Z-TZ0)/TC;const i=clamp(Math.floor(fx),0,TNX-2),j=clamp(Math.floor(fz),0,TNZ-2);const u=clamp(fx-i,0,1),v=clamp(fz-j,0,1);const a=TH[j*TNX+i],b=TH[j*TNX+i+1],c=TH[(j+1)*TNX+i],d=TH[(j+1)*TNX+i+1];return lerp(lerp(a,b,u),lerp(c,d,u),v);}
function waterAt(X,Z){return isWaterXZ(X,Z);}
function buildTerrain(){
 const base=new Float32Array(TNX*TNZ);
 for(let j=0;j<TNZ;j++)for(let i=0;i<TNX;i++){const X=TX0+i*TC,Z=TZ0+j*TC,k=j*TNX+i;const w=isWaterXZ(X,Z);TW[k]=w?1:0;base[k]=w?-7:landH(X,Z);}
 {const t=base.slice();for(let j=1;j<TNZ-1;j++)for(let i=1;i<TNX-1;i++){const k=j*TNX+i;if(TW[k])continue;const m=Math.min(t[k-1],t[k+1],t[k-TNX],t[k+TNX]);if(m<0)base[k]=Math.max(1.2,t[k]*0.6);}}
 for(let j=0;j<TNZ;j++)for(let i=0;i<TNX;i++){const X=TX0+i*TC,Z=TZ0+j*TC,k=j*TNX+i;let h=base[k];const nr=nearest(X,Z,95);TD[k]=nr?nr.d:999;
  if(nr){const hs=SY[nr.i]-0.35,fx=EXMAX(nr.i);if(nr.d<HW+3.5+fx)h=hs;else{const t=TW[k]?sstep(HW+3.5+fx,HW+12+fx,nr.d):sstep(HW+3.5,HW+70,nr.d);h=lerp(hs,base[k],t);}
   h=Math.min(h,roadCap(X,Z,40));}
  {const e=escAt(X,Z);if(e.d<ESC_W/2+14){const he=e.y-.35;h=e.d<ESC_W/2+2?he:lerp(he,h,sstep(ESC_W/2+2,ESC_W/2+14,e.d));}}
  TH[k]=h;}
 const pos=new Float32Array(TNX*TNZ*3),col=new Float32Array(TNX*TNZ*3);
 const cUrban=lin('#b0a795'),cUrban2=lin('#a09887'),cPark=lin('#5c7d3c'),cGreen=lin('#58703e'),cDry=lin('#8a875c'),cRock=lin('#9a9182'),cSea=lin('#28505d');
 for(let j=0;j<TNZ;j++)for(let i=0;i<TNX;i++){const k=j*TNX+i,X=TX0+i*TC,Z=TZ0+j*TC;pos[k*3]=X;pos[k*3+1]=TH[k];pos[k*3+2]=Z;
  let c;const y=-Z;const nz=fbm(X*.012,Z*.012,3);
  const bank=TD[k]<60&&TH[k]-roadMin(X,Z,60)>1.2;
  if(TH[k]<0.2)c=cSea;else if(bank)c=nz>.5?lin('#45582f'):lin('#55693a');else if(maskAt(GREEN,X,Z))c=nz>.5?cPark:cGreen;else{const urban=Math.abs(X)<1200&&y<1300&&y>-1200;
   if(urban)c=nz>.62?cGreen:(nz>.48?cUrban2:cUrban);else c=TH[k]>380&&nz<.55?cRock:(nz>.52?cGreen:cDry);}
  col[k*3]=c[0];col[k*3+1]=c[1];col[k*3+2]=c[2];}
 const idx=[];for(let j=0;j<TNZ-1;j++)for(let i=0;i<TNX-1;i++){const a=j*TNX+i,b=a+1,c=a+TNX,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
 {const nm=g.attributes.normal;const cR=lin('#5f6d3c'),cS=lin('#4f6233');for(let k=0;k<TNX*TNZ;k++){const ny=nm.getY(k);if(TH[k]>1&&ny<.85&&TD[k]>HW+6){const t=clamp((.85-ny)/.2,0,1);const c=fbm(pos[k*3]*.02,pos[k*3+2]*.02,2)>.38?cS:cR;for(let q=0;q<3;q++)col[k*3+q]=lerp(col[k*3+q],c[q],t);}}}
 const tm=new THREE.MeshLambertMaterial({vertexColors:true});const TT=40;
 for(let j0=0;j0<TNZ-1;j0+=TT)for(let i0=0;i0<TNX-1;i0+=TT){const id=[];for(let j=j0;j<Math.min(j0+TT,TNZ-1);j++)for(let i=i0;i<Math.min(i0+TT,TNX-1);i++){const a=j*TNX+i,b=a+1,c=a+TNX,d=c+1;id.push(a,c,b,b,c,d);}
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',g.attributes.position);tg.setAttribute('normal',g.attributes.normal);tg.setAttribute('color',g.attributes.color);tg.setIndex(id);
  const cx=TX0+(i0+TT/2)*TC,cz=TZ0+(j0+TT/2)*TC;let hy=0;for(let q=0;q<4;q++)hy=Math.max(hy,TH[Math.min(TNZ-1,j0+(q>>1)*TT)*TNX+Math.min(TNX-1,i0+(q&1)*TT)]);
  tg.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,hy/2,cz),TT*TC*.75+Math.abs(hy));const m=new THREE.Mesh(tg,tm);m.receiveShadow=true;scene.add(m);CHUNKS.push({m,c:tg.boundingSphere.center.clone(),r:tg.boundingSphere.radius});}}

// ---------------------------------------------------------------- occupancy grid (keeps objects off the road, water and each other)
const OC=4,ONX=Math.ceil((TX1-TX0)/OC),ONZ=Math.ceil((TZ1-TZ0)/OC);const OCC=new Uint8Array(ONX*ONZ);
function occI(x,z){const i=Math.floor((x-TX0)/OC),j=Math.floor((z-TZ0)/OC);if(i<0||j<0||i>=ONX||j>=ONZ)return -1;return j*ONX+i;}
function markDisc(x,z,r){const r2=r*r;for(let a=Math.floor((x-r-TX0)/OC);a<=Math.floor((x+r-TX0)/OC);a++)for(let b=Math.floor((z-r-TZ0)/OC);b<=Math.floor((z+r-TZ0)/OC);b++){if(a<0||b<0||a>=ONX||b>=ONZ)continue;const px=TX0+(a+.5)*OC,pz=TZ0+(b+.5)*OC;if((px-x)**2+(pz-z)**2<=r2)OCC[b*ONX+a]=1;}}
function rectCells(cx,cz,hx,hz,th,cb){const c=Math.cos(th),s=Math.sin(th);const rad=Math.hypot(hx,hz);for(let a=Math.floor((cx-rad-TX0)/OC);a<=Math.floor((cx+rad-TX0)/OC);a++)for(let b=Math.floor((cz-rad-TZ0)/OC);b<=Math.floor((cz+rad-TZ0)/OC);b++){const px=TX0+(a+.5)*OC,pz=TZ0+(b+.5)*OC;const dx=px-cx,dz=pz-cz;const lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)<=hx+1&&Math.abs(lz)<=hz+1){if(a<0||b<0||a>=ONX||b>=ONZ)cb(-1,px,pz);else cb(b*ONX+a,px,pz);}}}
function tryRect(cx,cz,hx,hz,th,force){let ok=true;if(!force)rectCells(cx,cz,hx,hz,th,(k,px,pz)=>{if(!ok)return;if(k<0||OCC[k]||waterAt(px,pz))ok=false;});if(ok)rectCells(cx,cz,hx,hz,th,k=>{if(k>=0)OCC[k]=2;});return ok;}
function polyCells(pts,cb){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of pts){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);}
 for(let a=Math.floor((x0-TX0)/OC);a<=Math.floor((x1-TX0)/OC);a++)for(let b=Math.floor((z0-TZ0)/OC);b<=Math.floor((z1-TZ0)/OC);b++){if(a<0||b<0||a>=ONX||b>=ONZ)continue;const px=TX0+(a+.5)*OC,pz=TZ0+(b+.5)*OC;if(pip(pts,px,pz))cb(b*ONX+a);}}

// ---------------------------------------------------------------- city from OpenStreetMap footprints
let FAC=null;
const facBatches=[0,1,2,3,4,5].map(()=>new Batch());
const roofB=new Batch(),whiteB=new Batch(),metalB=new Batch(),concB=new Batch(),greenB=new Batch(),trunkB=new Batch(),yachtB=new Batch(),crowdB=new Batch(),flagB=new Batch(),teamB=new Batch(),poolB=new Batch();
const CLASSIC=['#e8dfd0','#e6d6c2','#e2cfbb','#ebe3d6','#dccbb4','#d8cbb9','#e9ddd0','#e0c9bb','#e4d8c4','#d6c4ad','#e7d2c8','#efe8dc','#d9d1c4','#e3cfc0','#dcc4a6','#e8d5cf'].map(lin);
const MODERN=['#eeeeec','#e4e5e4','#d9dbdc','#ecebe7','#e0ddd6','#d2d4d6'].map(lin);
const ROOFS=['#9c6a55','#a57864','#8c8983','#a09c95','#7f7d78','#b3aea6'].map(lin);
function FAC_B(t){return facBatches[t];}
const shopB=new Batch(),cornB=new Batch();
const BALC=[],PILS=[],slabB=new Batch(),glassB=new Batch(),parB=new Batch();
function facadeDetail(a,b,u0m,nx,nz,yf,y1,type,tint){const ex=b[0]-a[0],ez=b[1]-a[1],L=Math.hypot(ex,ez);if(L<2.6)return;const dx=ex/L,dz=ez/L;
 const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;const nr=nearest(mx,mz,60);if(!nr)return;if((SX[nr.i]-mx)*nx+(SZ[nr.i]-mz)*nz<=0)return;
 const rot=Math.atan2(nx,nz);const floors=Math.floor((y1-.8-yf)/3);
 const at=(sAlong,out,y)=>[a[0]+dx*sAlong+nx*out,y,a[1]+dz*sAlong+nz*out];
 if(type<=2){const spec=[[1.6,.55,.78],[1.75,.62,.56],[1.5,.5,.62]][type];const w=spec[0],d=spec[1];
  for(let j=0;j<floors;j++){if(type===0&&j%2===0)continue;const yb=yf+3*j+spec[2];
   let s0=((1.5-u0m)%3+3)%3;for(let sa=s0;sa<L;sa+=3){if(sa-w/2<.25||sa+w/2>L-.25)continue;BALC.push([...at(sa,d/2,yb),rot,w,d]);}}
  // ground-floor pilasters between the shop bays
  if(yf-1>0){let s0=((3-u0m)%3+3)%3;for(let sa=s0;sa<=L;sa+=3){if(sa<.3||sa>L-.3)continue;PILS.push([...at(sa,.11,0),rot,yf]);}}
  // string course over the shops
  const sc=at(L/2,.14,0);slabB.box(sc[0],sc[2],yf-.32,yf,.16,L/2,Math.atan2(dx,dz),tint.map(v=>v*1.02));
 }else if(type===3||type===4){const off=type===3?0:.3;
  for(let j=0;j<floors;j++){const yb=yf+3*j+off;const c=at(L/2,.6,0);const th=Math.atan2(dx,dz);slabB.box(c[0],c[2],yb-.2,yb,.6,L/2,th,lin('#f2f1ed'));
   const g0=at(0,1.18,yb),g1=at(L,1.18,yb);glassB.quad([g0[0],yb,g0[2]],[g1[0],yb,g1[2]],[g1[0],yb+1.05,g1[2]],[g0[0],yb+1.05,g0[2]],[nx,0,nz],[[0,0],[1,0],[1,1],[0,1]],[1,1,1]);
   const tr=at(L/2,1.18,0);slabB.box(tr[0],tr[2],yb+1.02,yb+1.1,.04,L/2,th,lin('#e8e8e4'));}}
 // parapet with balusters on the roof line of the classic buildings
 if(type<=2&&y1-yf<26){const p0=at(0,.1,0),p1=at(L,.1,0);parB.quad([p0[0],y1,p0[2]],[p1[0],y1,p1[2]],[p1[0],y1+.95,p1[2]],[p0[0],y1+.95,p0[2]],[nx,0,nz],[[0,0],[L/2.4,0],[L/2.4,1],[0,1]],tint);}}
function buildFacadeDetail(){
 const n=BALC.length;if(n){const slab=new THREE.BoxGeometry(1,.12,1);slab.translate(0,-.06,0);const sm={material:new THREE.MeshLambertMaterial({color:COL(0xeeebe4)})};
  const rg=new THREE.BufferGeometry();{const P3=[],U=[],I=[];const quad=(A,B,C,D,u0,u1)=>{const k=P3.length/3;P3.push(...A,...B,...C,...D);U.push(u0,0,u1,0,u1,1,u0,1);I.push(k,k+1,k+2,k,k+2,k+3);};
   quad([-.5,0,.5],[.5,0,.5],[.5,1,.5],[-.5,1,.5],0,1.8);quad([-.5,0,-.5],[-.5,0,.5],[-.5,1,.5],[-.5,1,-.5],0,.6);quad([.5,0,.5],[.5,0,-.5],[.5,1,-.5],[.5,1,.5],0,.6);
   rg.setAttribute('position',new THREE.Float32BufferAttribute(P3,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));rg.setIndex(I);rg.computeVertexNormals();}
  const it=ironTex();const rm={material:new THREE.MeshLambertMaterial({map:it,alphaTest:.5,side:THREE.DoubleSide})};rm.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:it,alphaTest:.5});
  instTiled(slab,sm.material,BALC,(o,q)=>{o.position.set(q[0],q[1],q[2]);o.rotation.set(0,q[3],0);o.scale.set(q[4],1,q[5]);});
  instTiled(rg,rm.material,BALC,(o,q)=>{o.position.set(q[0],q[1],q[2]);o.rotation.set(0,q[3],0);o.scale.set(q[4],.95,q[5]);},{depth:rm.customDepthMaterial});}
 if(PILS.length){const pg=new THREE.BoxGeometry(.48,1,.22);pg.translate(0,.5,0);instTiled(pg,new THREE.MeshLambertMaterial({color:COL(0xe9e4da)}),PILS,(o,q)=>{const y=heightAt(q[0],q[2])-1;o.position.set(q[0],y,q[2]);o.rotation.set(0,q[3],0);o.scale.set(1,q[4]-y,1);});}
 if(slabB.p.length)slabB.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));
 if(glassB.p.length){const m=glassB.mesh(new THREE.MeshStandardMaterial({color:0x9fb6c4,transparent:true,opacity:.42,roughness:.1,metalness:.2,side:THREE.DoubleSide,depthWrite:false}),false);m.castShadow=false;}
 if(parB.p.length){const bt=balTex();const m=parB.mesh(new THREE.MeshLambertMaterial({map:bt,vertexColors:true,alphaTest:.4,side:THREE.DoubleSide}));m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:bt,alphaTest:.4});}
 console.info('facade detail: balconies '+BALC.length+', pilasters '+PILS.length);}
function extrude(pts,y0,y1,type,tint,roofCol,yg,detail){ // pts: world [X,Z] ring; yg = top of the shop-front ground floor (or null)
 let ar=0,cx=0,cz=0;for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length];ar+=a[0]*b[1]-b[0]*a[1];cx+=a[0];cz+=a[1];}cx/=pts.length;cz/=pts.length;
 const B=facBatches[type];let u=0;const yf=yg!=null&&yg<y1-4?yg:y0;const H=(y1-yf)/9;const sh=tint.map(v=>v*.93);
 for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length];const ex=b[0]-a[0],ez=b[1]-a[1];const L=Math.hypot(ex,ez);if(L<0.05)continue;
  let nx=ez/L,nz=-ex/L;if(ar<0){nx=-nx;nz=-nz;}const u1=u+L/9;
  B.quad([a[0],yf,a[1]],[b[0],yf,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],[nx,0,nz],[[u,0],[u1,0],[u1,H],[u,H]],tint);
  if(detail)facadeDetail(a,b,u*9,nx,nz,yf,y1,type,tint);
  if(yf>y0){const hs=(yf-y0)/5,v0=1-hs;shopB.quad([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],yf,b[1]],[a[0],yf,a[1]],[nx,0,nz],[[u,v0],[u1,v0],[u1,1],[u,1]],sh);}
  if(y1-yf>6){const f=.45,ax=a[0]+nx*f,az=a[1]+nz*f,bx=b[0]+nx*f,bz=b[1]+nz*f;const yc=y1-.25;
   cornB.quad([ax,yc-.55,az],[bx,yc-.55,bz],[bx,yc,bz],[ax,yc,az],[nx,0,nz],[[0,0],[1,0],[1,1],[0,1]],sh);cornB.quad([a[0],yc-.55,a[1]],[b[0],yc-.55,b[1]],[bx,yc-.55,bz],[ax,yc-.55,az],[0,-1,0],[[0,0],[1,0],[1,1],[0,1]],sh.map(v=>v*.6));cornB.quad([a[0],yc,a[1]],[b[0],yc,b[1]],[bx,yc,bz],[ax,yc,az],[0,1,0],[[0,0],[1,0],[1,1],[0,1]],sh);}
  u=u1;}
 const v2=pts.map(p=>new THREE.Vector2(p[0],p[1]));let tris;try{tris=THREE.ShapeUtils.triangulateShape(v2,[]);}catch(e){tris=[];}
 for(const t of tris){const A=pts[t[0]],Bp=pts[t[1]],C=pts[t[2]];roofB.tri([A[0],y1,A[1]],[Bp[0],y1,Bp[1]],[C[0],y1,C[1]],[0,1,0],roofCol);}}
function frontRing(i0,i1,side,dA,dB){const idx=rangeIdx(i0,i1);const a=[],b=[];for(let k=0;k<idx.length;k+=2){const i=idx[k];const p=P(i,side*dA),q=P(i,side*dB);a.push([p[0],p[2]]);b.push([q[0],q[2]]);}const last=idx[idx.length-1];const p=P(last,side*dA),q=P(last,side*dB);a.push([p[0],p[2]]);b.push([q[0],q[2]]);return a.concat(b.reverse());}
function albertFrontage(){const L=-1;const ci=k=>cpIdx(k);
 const block=(i0,i1,dA,dB,h,type,tint,detail,yg)=>{const ring=frontRing(i0,i1,L,dA,dB);let mn=1e9,mx=-1e9;for(const p of ring){const y=heightAt(p[0],p[1]);mn=Math.min(mn,y);mx=Math.max(mx,y);}mn=Math.min(mn,SY[i0],SY[i1]);
  polyCells(ring,k=>{OCC[k]=2;});extrude(ring,mn-2,mx+h,type,tint,lin('#8f8a82'),yg===undefined?null:(yg===true?mn+4.8:yg),detail);return mn;};
 // 1. after Noghès: grey modern block whose overhang covers the grandstand
 block(ci(107),ci(112),HW+15.5,HW+30,19,3,lin('#a7a9ab'),true);
 // 2. long two-storey pink building with a ground-floor arcade
 {const i0=ci(112),i1=ci(117);const pink=lin('#d7a59c'),pink2=lin('#c99288');const mn=block(i0,i1,HW+10.5,HW+24,8.6,2,pink,false);
  const front=frontRing(i0,i1,L,HW+7.4,HW+10.6);let y0=1e9;for(const p of front)y0=Math.min(y0,heightAt(p[0],p[1]));
  extrude(front,mn+4.3,mn+8.6,2,pink,lin('#8f8a82'),null,false);
  const idx=rangeIdx(i0,i1);for(let k=0;k<idx.length;k+=2){const i=idx[k];const c=P(i,L*(HW+7.9));whiteB.box(c[0],c[2],mn-1,mn+4.3,.32,.32,PSI[i],lin('#eadcd6'));}
  const rail=new THREE.MeshLambertMaterial({map:balTex(),transparent:true,alphaTest:.4,side:THREE.DoubleSide});strip(i0,(i1-i0+N)%N,i=>[P(i,L*(HW+7.45),mn+8.6-SY[i]),P(i,L*(HW+7.45),mn+9.5-SY[i])],2.4,rail,true,1);}
 // 3. grey low block (race control side)
 block(ci(117),ci(120),HW+9,HW+24,10.5,4,lin('#9a9da0'),false);
 // 4. tall apartment buildings with balconies behind the last grandstand
 block(ci(120),ci(124),HW+17,HW+32,24,1,lin('#cdb3a6'),true,true);
 block(ci(124),ci(128),HW+17,HW+32,27,0,lin('#e0cfbd'),true,true);}
function buildCity(){
 for(let i=0;i<N;i++)markDisc(SX[i],SZ[i],HW+3.6+EXMAX(i)+(CHI[i]?10:0));
 for(const p of ESC)markDisc(p[0],p[1],ESC_W/2+2);
 albertFrontage();
 const pitSet=new Set();for(let i=0;i<N;i++)if(PIT[i])pitSet.add(i);
 let cas=null;
 for(const b of DATA.b){const pts=b.p.map(p=>[p[0],-p[1]]);let cx=0,cz=0;for(const p of pts){cx+=p[0];cz+=p[1];}cx/=pts.length;cz/=pts.length;
  const nr=nearest(cx,cz,40);
  if(nr&&PIT[nr.i]){const d=(cx-SX[nr.i])*RXa[nr.i]+(cz-SZ[nr.i])*RZa[nr.i];if(d>0&&d<34)continue;}
  let clash=0,tot=0;polyCells(pts,k=>{tot++;if(OCC[k]===2)clash++;});if(b.k==='std'&&tot&&clash/tot>.3)continue;
  let mn=1e9,mx=-1e9;for(const p of pts){const h=heightAt(p[0],p[1]);mn=Math.min(mn,h);mx=Math.max(mx,h);}const hc=heightAt(cx,cz);mn=Math.min(mn,hc);mx=Math.max(mx,hc);
  let y0=mn-2,y1=mx+b.h;
  const r1=hash2(Math.round(cx),Math.round(cz)),r2=hash2(Math.round(cz),Math.round(cx)+7);
  let type,tint;
  if(b.k==='casino'){type=2;tint=lin('#efdfbd');cas={pts,cx,cz,y1};}
  else if(b.k==='classic'){type=2;tint=lin('#f3e6cc');}
  else if(b.k==='palace'){type=0;tint=lin('#ecc98f');}
  else if(b.k==='church'){type=2;tint=lin('#f4efe6');if(Math.hypot(cx+376,cz+117)<40){tint=lin('#e8c79a');const y=heightAt(cx,cz);const tx=cx+4,tz=cz-4;FAC_B(2).box(tx,tz,y-1,y+19,2.4,2.4,0,lin('#e8c79a'),9,9,roofB,lin('#a95f45'));whiteB.geom(new THREE.ConeGeometry(2.3,3.5,4),mtx(tx,y+20.7,tz,Math.PI/4),lin('#a95f45'));}}
  else if(b.k==='fairmont'){type=4;tint=lin('#f1efe9');const t=nearest(cx,cz,80);if(t){y0=SY[t.i]+6.9;y1=Math.max(y1,y0+22);}}
  else if(b.h>44){type=[3,4,5][Math.floor(r1*3)];tint=MODERN[Math.floor(r2*MODERN.length)];}
  else if(b.z==='fontvieille'||b.z==='larvotto'){type=r1<.7?[3,4][Math.floor(r2*2)]:1;tint=type===1?CLASSIC[Math.floor(r2*CLASSIC.length)]:MODERN[Math.floor(r2*MODERN.length)];}
  else if(b.z==='rock'){type=r1<.6?0:1;tint=CLASSIC[Math.floor(r2*CLASSIC.length)];}
  else{type=r1<.82?[0,1,2,0,1][Math.floor(r2*5)]:[3,4][Math.floor(r2*2)];tint=type<=2?CLASSIC[Math.floor(r2*CLASSIC.length)]:MODERN[Math.floor(r2*MODERN.length)];}
  const roofCol=b.z==='rock'||type<=2?ROOFS[Math.floor(r1*3)]:ROOFS[3+Math.floor(r2*3)];
  const front=nr&&nr.d<48&&b.h>7&&b.k!=='casino'&&b.k!=='church';
  extrude(pts,y0,y1,type,tint,roofCol,(b.h>8&&b.a>90&&b.k!=='fairmont'&&b.k!=='church')?mn+4.8:null,front);
  if(b.h>14&&b.a>150&&r1<.5){const px=cx+(r2-.5)*4,pz=cz+(r1-.5)*4;roofB.box(px,pz,y1,y1+rr(1.5,3),rr(1.5,3),rr(1.5,3),rr(0,3),lin('#c9c4ba'));}
  polyCells(pts,k=>{OCC[k]=1;});}
 // Fairmont Monte-Carlo: the big hotel built over the tunnel between Portier and the sea (missing from the map extract)
 {let mxRoad=0;for(let i=0;i<N;i++)if(TUN[i])mxRoad=Math.max(mxRoad,SY[i]);const yTop=mxRoad+30;const W=lin('#f1efe9');
  const roadAt=yy=>{let best=null,bd=1e9;for(let i=0;i<N;i++){if(!TUN[i])continue;const d=Math.abs(-SZ[i]-yy);if(d<bd){bd=d;best=i;}}return best;};
  for(let y=330;y<468;y+=10){const i=roadAt(y+5);const tx=SX[i];const base=SY[i]+7.1;const wE=tx-HW-2.2,eE=tx+HW+2.2;
   const piece=(x0,x1,b0)=>{if(x1-x0<2)return;const ring=[[x0,y],[x1,y],[x1,y+10],[x0,y+10]].map(p=>[p[0],-p[1]]);extrude(ring,b0,yTop,4,W,lin('#8f8a82'),null,x1>tx);polyCells(ring,k=>{OCC[k]=1;});};
   piece(Math.min(362,wE-1),wE,heightAt(wE-3,-y-5)-2);piece(wE,eE,base);piece(eE,418,base);
   // columns on the sea side carrying the hotel over the open arcade
   for(const cy of[y+2.5,y+7.5]){const cx=eE+3;whiteB.box(cx,-cy,SY[i]-2,base,.45,.45,0,lin('#e4e0d8'));}}
  const ring2=[[372,460],[412,460],[416,350],[372,350]].map(p=>[p[0],-p[1]]);extrude(ring2,yTop,yTop+6,3,lin('#ecebe6'),lin('#7f7d78'),null,false);}
 // fill gaps where the map extract has no buildings: a frontage block on every free plot facing the circuit
 {let added=0;for(const side of[-1,1]){const sd=side>0?1:0;let i=0;while(i<N){if(TUN[i]||(side>0&&PIT[i])||EXA[sd][i]>.5){i+=4;continue;}
   const w=rr(14,24),dep=rr(12,19),im=mod(i+Math.round(w/2/DS));const off=HW+8.5+dep/2;const c=P(im,side*off);const th=PSI[im];
   let ok=true;rectCells(c[0],c[2],dep/2,w/2,th,(k,px,pz)=>{if(!ok)return;if(k<0||OCC[k]||waterAt(px,pz)||maskAt(GREEN,px,pz))ok=false;});
   if(ok){const cs=Math.cos(th),sn=Math.sin(th);const ring=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[c[0]+cs*dep/2*a+sn*w/2*b,c[2]-sn*dep/2*a+cs*w/2*b]);
    let mn=1e9,mx=-1e9;for(const p of ring){const h=heightAt(p[0],p[1]);mn=Math.min(mn,h);mx=Math.max(mx,h);}mn=Math.min(mn,SY[im]);
    const y=-c[2];const fl=y>300?5+Math.floor(R()*6):4+Math.floor(R()*5);const h=fl*3.1+1.5;const r1=R();const type=r1<.8?[0,1,2,0,1][Math.floor(R()*5)]:[3,4][Math.floor(R()*2)];
    const tint=type<=2?pick(CLASSIC):pick(MODERN);extrude(ring,mn-2,mx+h,type,tint,type<=2?ROOFS[Math.floor(R()*3)]:ROOFS[3+Math.floor(R()*3)],mn+4.8,true);
    polyCells(ring,k=>{OCC[k]=1;});added++;i+=Math.max(2,Math.round((w+rr(.5,2))/DS));}else i+=3;}}
  console.info('filler buildings '+added);}
 // Mareterra: the two curved residential buildings, a row of villas and the park with its trees
 {const W=lin('#f3f2ee');const blocks=[[[465,468],[560,452],[566,474],[472,492]],[[585,505],[655,548],[644,566],[575,524]]];
  const villas=[];for(let k=0;k<5;k++)villas.push([[505+k*20,612],[519+k*20,610],[521+k*20,624],[507+k*20,626]]);for(let k=0;k<4;k++)villas.push([[480+k*20,575],[494+k*20,573],[496+k*20,587],[482+k*20,589]]);
  for(const [ring,h,type] of [...blocks.map(b=>[b,24,3]),...villas.map(v=>[v,9,4])]){const pts=ring.map(p=>[p[0],-p[1]]);let mn=1e9,mx=-1e9;for(const p of pts){const y=heightAt(p[0],p[1]);mn=Math.min(mn,y);mx=Math.max(mx,y);}
   extrude(pts,mn-2,mx+h,type,W,lin('#a09c95'),null,false);polyCells(pts,k=>{OCC[k]=1;});}
  for(let k=0;k<90;k++){const x=560+hash2(k,3)*140,y=450+hash2(7,k)*240;if(!pip(MARETERRA_PARK,x,y))continue;const o=occI(x,-y);if(o<0||OCC[o])continue;MT.push([x,-y]);OCC[o]=1;}}
 // Casino de Monte-Carlo: twin towers and copper dome facing the square
 if(cas){let fi=0,fd=1e9;cas.pts.forEach((p,k)=>{const n=nearest(p[0],p[1],120);if(n&&n.d<fd){fd=n.d;fi=k;}});const f=cas.pts[fi];const dx=cas.cx-f[0],dz=cas.cz-f[1],dl=Math.hypot(dx,dz)||1;const ax=-dz/dl,az=dx/dl;const verd=lin('#6f9384'),cream=lin('#efdfbd');
  const fc=[f[0]+dx/dl*9,f[1]+dz/dl*9];const th=Math.atan2(dx,dz);
  for(const s of[-1,1]){const p=[fc[0]+ax*s*17,fc[1]+az*s*17];const y=heightAt(p[0],p[1]);FAC_B(2).box(p[0],p[1],y-2,y+30,4.5,4.5,th,cream,9,9,roofB,verd);whiteB.geom(new THREE.ConeGeometry(4.2,6.5,4),mtx(p[0],y+33.2,p[1],th+Math.PI/4),verd);}
  const y=heightAt(fc[0],fc[1]);FAC_B(2).box(fc[0],fc[1],y-2,y+24,8,6,th,cream,9,9,roofB,verd);whiteB.geom(new THREE.SphereGeometry(6,22,10,0,TAU,0,Math.PI/2),mtx(fc[0],y+24,fc[1],0),verd);}
 // swimming pools of the Stade Nautique Rainier III (the Piscine section)
 for(const pl of DATA.pools){const pts=pl.map(p=>[p[0],-p[1]]);let cx=0,cz=0;pts.forEach(p=>{cx+=p[0];cz+=p[1];});cx/=pts.length;cz/=pts.length;const y=heightAt(cx,cz)+0.25;
  const v2=pts.map(p=>new THREE.Vector2(p[0],p[1]));let tris=[];try{tris=THREE.ShapeUtils.triangulateShape(v2,[]);}catch(e){}for(const t of tris){const A=pts[t[0]],Bp=pts[t[1]],C=pts[t[2]];poolB.tri([A[0],y,A[1]],[Bp[0],y,Bp[1]],[C[0],y,C[1]],[0,1,0],[1,1,1]);}
  polyCells(pts,k=>{OCC[k]=1;});}
 buildFacadeDetail();
 const mats=FAC.map(t=>new THREE.MeshLambertMaterial({map:t,vertexColors:true}));shopB.mesh(new THREE.MeshLambertMaterial({map:shopTex(),vertexColors:true}));cornB.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));
 facBatches.forEach((b,i)=>b.mesh(mats[i]));roofB.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));
 poolB.mesh(new THREE.MeshStandardMaterial({color:COL(0x2ab4d4),roughness:.08,metalness:0,emissive:COL(0x06343f)}),false);}

const leafB=new Batch(),frondB=new Batch();
function palm(x,z,h){if(escAt(x,z).d<ESC_W/2+1.5)return;const y=heightAt(x,z);const lean=rr(-.1,.1);trunkB.geom(new THREE.CylinderGeometry(.17,.28,h,7),mtx(x,y+h/2,z,0,lean,0),lin('#8d7a63'));
 const tz=z+Math.sin(lean)*h/2;const leaf=new THREE.PlaneGeometry(1.3,4.6,1,5);const lp=leaf.attributes.position;for(let k=0;k<lp.count;k++){const yy=lp.getY(k)+2.3;lp.setZ(k,-yy*yy*0.085);}leaf.translate(0,2.3,0);leaf.computeVertexNormals();
 const cg=[lin('#e7eed8'),lin('#dfe9cf'),lin('#cfdcbc')];const n=11;for(let k=0;k<n;k++){const a=k/n*TAU+rr(0,.3);frondB.geom(leaf,mtx(x,y+h,tz,a,-.95+rr(-.25,.25),0),pick(cg));}
 trunkB.geom(new THREE.SphereGeometry(.45,6,5),mtx(x,y+h-.1,tz,0),lin('#6f6344'));}
function cypress(x,z,h){if(escAt(x,z).d<ESC_W/2+1.5)return;const y=heightAt(x,z);trunkB.geom(new THREE.CylinderGeometry(.12,.18,1.4,5),mtx(x,y+.7,z,0),lin('#5f5042'));greenB.geom(new THREE.ConeGeometry(.9,h,7),mtx(x,y+1.2+h/2,z,rr(0,3)),pick([lin('#2f4a24'),lin('#35522a'),lin('#2a4221')]));}
function tree(x,z,s){if(escAt(x,z).d<ESC_W/2+1.5)return;const y=heightAt(x,z);const pine=R()<.3;const W=pine?8.5*s:6.2*s,Hh=pine?3.4*s:6*s,cy=pine?y+6.4*s:y+4.6*s;
 trunkB.geom(new THREE.CylinderGeometry(.15*s,.26*s,pine?6*s:3.6*s,6),mtx(x,y+(pine?3*s:1.8*s),z,0),lin('#5f5042'));
 const pl=new THREE.PlaneGeometry(W,Hh);const tint=pick([lin('#ffffff'),lin('#e8efe0'),lin('#d9e3cf'),lin('#f3f6ea')]);const r0=rr(0,Math.PI);
 for(let k=0;k<3;k++)leafB.geom(pl,mtx(x,cy,z,r0+k*Math.PI/3),tint);
 const hp=new THREE.PlaneGeometry(W*.92,W*.92);hp.rotateX(-Math.PI/2);leafB.geom(hp,mtx(x,cy+Hh*.18,z,r0),tint.map(v=>v*1.05));}
// ---------------------------------------------------------------- barriers: 3D double W-beam armco, posts, concrete walls and boards hung on the fence
const WPROF=(()=>{const one=IS_MOBILE?[[0,0],[.07,.078],[.155,.022],[.24,.078],[.31,0]]:[[0,0],[.03,.05],[.07,.078],[.11,.05],[.155,.022],[.2,.05],[.24,.078],[.28,.05],[.31,0]];const out=[];for(const base of[.32,.66])for(const [h,b] of one)out.push([base+h,b]);return out;})();
function buildBarriers(SCH){
 const D0=HW+.32;
 // which barrier stands on each edge: armco by default, concrete along the pit wall and the start-straight boulevard
 const conc=[new Uint8Array(N),new Uint8Array(N)];
 for(let i=0;i<N;i++)if(PIT[i])conc[1][i]=1;
 const open=[new Uint8Array(N),new Uint8Array(N)];for(let i=0;i<N;i++)for(const sd of[0,1]){const q=P(i,(sd?1:-1)*D0);if(EXA[sd][i]>.5||escAt(q[0],q[2]).d<ESC_W/2+.5)open[sd][i]=1;}
 rangeIdx(cpIdx(112),cpIdx(126)).forEach(i=>conc[0][i]=1);
 const am=new THREE.MeshStandardMaterial({map:armcoTex(),color:0xffffff,metalness:.62,roughness:.34,envMapIntensity:1.25,side:THREE.DoubleSide});
 const cm=new THREE.MeshLambertMaterial({map:concreteTex()});
 for(const sd of[0,1]){const side=sd?1:-1;
  const segs=[];for(const r0 of runs(i=>!conc[sd][i]&&!open[sd][i])){for(let o=0;o<=r0[1];o+=110)segs.push([mod(r0[0]+o),Math.min(110,r0[1]+1-o)]);}
  for(const r of segs){const cnt=r[1],M=WPROF.length,half=M/2;const pos=[],uv=[],idx=[];
   for(let k=0;k<=cnt;k++){const i=mod(r[0]+k);const v=k*DS/4;for(let q=0;q<M;q++){const [h,b]=WPROF[q];const p=P(i,side*(D0+EXA[sd][i]-b),h);pos.push(p[0],p[1],p[2]);uv.push(v,q/(M-1));}}
   for(let k=0;k<cnt;k++)for(let q=0;q<M-1;q++){if(q===half-1)continue;const a=k*M+q,b2=a+M;idx.push(a,b2,a+1,a+1,b2,b2+1);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
   const m=new THREE.Mesh(g,am);m.castShadow=true;m.receiveShadow=true;scene.add(m);registerChunk(m);}
  for(const r of runs(i=>conc[sd][i])){const WH=sd===1?1.5:1.15;strip(r[0],r[1]+1,i=>[P(i,side*(D0-.05),0),P(i,side*(D0-.05),WH)],4,cm,true,1);strip(r[0],r[1]+1,i=>[P(i,side*(D0-.05),WH),P(i,side*(D0+.25),WH)],4,cm,false,1);}}
 // posts with spacer blocks every 2 m behind the rails
 const postG=new THREE.BoxGeometry(.08,1.0,.12),blkG=new THREE.BoxGeometry(.1,.26,.14);const pm=new THREE.MeshStandardMaterial({color:0x9ea3a8,metalness:.5,roughness:.5});
 const posts=[],blks=[];const stepP=IS_MOBILE?4:2;for(const sd of[0,1])for(let i=0;i<N;i+=stepP){if(conc[sd][i]||open[sd][i])continue;const side=sd?1:-1;const p=P(i,side*(D0+.08),.5);posts.push([p[0],p[1],p[2],PSI[i]]);
  if(!IS_MOBILE)for(const h of[.47,.81]){const q=P(i,side*(D0+.03),h);blks.push([q[0],q[1],q[2],PSI[i]]);}}
 const setR=(o,it)=>{o.position.set(it[0],it[1],it[2]);o.rotation.set(0,it[3],0);o.scale.set(1,1,1);};
 instTiled(postG,pm,posts,setR);if(blks.length)instTiled(blkG,pm,blks,setR);
 // sponsor-style boards hung on the catch fence above the rails, in alternating runs, colour by sector
 const bb={};for(const n of Object.keys(BOARD))bb[n]=new Batch();
 for(const sd of[0,1]){const side=sd?1:-1;let u=0;
  for(let i=0;i<N;i++){const blk=Math.floor((i+sd*7)/11);if(TUN[i]||blk%3===2||open[sd][i])continue;const j=mod(i+1);if(SCH[i]!==SCH[j])continue;const B=bb[SCH[i]];
   if(sd===0&&STR[i])continue;const onWall=conc[sd][i];const lo=onWall?.12:1.0,hi=onWall?1.02:lo+.92;const bo=onWall?D0-.1:D0+.12;const a=P(i,side*bo,lo),b=P(j,side*bo,lo);const u0=(sd?-i:i)*DS/16,u1=(sd?-(i+1):(i+1))*DS/16;
   B.quad([a[0],a[1],a[2]],[b[0],b[1],b[2]],[b[0],b[1]-lo+hi,b[2]],[a[0],a[1]-lo+hi,a[2]],[-RXa[i]*side,0,-RZa[i]*side],[[u0,0],[u1,0],[u1,1],[u0,1]],[1,1,1]);}}
 // run-off asphalt and polystyrene/TecPro blocks where the chicane is open
 const sdWall=[];
 {const ro=new THREE.MeshStandardMaterial({map:asphaltTex(false),roughness:.9,envMapIntensity:.3});const RED=lin('#d42020'),WHT=lin('#f2f2ee'),BLU=lin('#1d4fb8');
  for(const sd of[0,1]){const side=sd?1:-1;for(const r of runs(i=>open[sd][i])){strip(r[0],r[1]+1,i=>side<0?[P(i,-(HW+EXA[0][i]+.4),.015),P(i,-HW,.015)]:[P(i,HW,.015),P(i,HW+EXA[1][i]+.4,.015)],10,ro);
    for(let k=0;k<=r[1];k++){const i=mod(r[0]+k);if(EXA[sd][i]<(SDZ[i]?3:6))continue;const p=P(i,side*(HW+EXA[sd][i]+.5));
     if(SDZ[i]){sdWall.push([i,side]);const q=P(i,side*(HW+EXA[sd][i]-.3));teamB.box(q[0],q[2],q[1],q[1]+1.0,.45,DS*.5,PSI[i],k%2?lin('#1c3f8f'):lin('#121418'));}
     else if(escAt(p[0],p[2]).d>ESC_W/2+1){teamB.box(p[0],p[2],p[1],p[1]+.9,.25,DS*.5,PSI[i],lin('#f2c400'));teamB.box(p[0],p[2],p[1]+.9,p[1]+1.0,.27,DS*.5,PSI[i],WHT);}}}}}
 // Nouvelle Chicane escape road: high-grip surface straight on past turn 10, and the marshal's traffic light where it rejoins
 {const m=new THREE.MeshStandardMaterial({map:asphaltTex(false),color:COL(0xe2d6cf),roughness:.95,envMapIntensity:.3,side:THREE.DoubleSide});const pos=[],uv=[],idx=[];let v=0;
  for(let k=0;k<ESC.length;k++){const p=ESC[k],q=ESC[Math.min(k+1,ESC.length-1)],o=ESC[Math.max(k-1,0)];let dx=q[0]-o[0],dz=q[1]-o[1];const l=Math.hypot(dx,dz);dx/=l;dz/=l;
   if(k)v+=Math.hypot(p[0]-ESC[k-1][0],p[1]-ESC[k-1][1])/10;pos.push(p[0]+dz*ESC_W/2,p[2],p[1]-dx*ESC_W/2,p[0]-dz*ESC_W/2,p[2],p[1]+dx*ESC_W/2);uv.push(0,v,1,v);}
  for(let k=0;k<ESC.length-1;k++){const a=2*k;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const em=new THREE.Mesh(g,m);em.receiveShadow=true;scene.add(em);registerChunk(em);
  const n=ESC.length-4,p=ESC[n],q=ESC[n+1];const l=Math.hypot(q[0]-p[0],q[1]-p[1]),dx=(q[0]-p[0])/l,dz=(q[1]-p[1])/l;const rx=-dz,rz=dx;
  const lx=p[0]+rx*(ESC_W/2+1),lz=p[1]+rz*(ESC_W/2+1),ly=heightAt(lx,lz);const th=Math.atan2(-dx,-dz);
  metalB.box(lx,lz,ly,ly+3.2,.06,.06,th,lin('#2a2c30'));metalB.box(lx,lz,ly+2.4,ly+3.5,.2,.14,th,lin('#16181b'));
  // the barrier between the chicane and the escape road: red and orange blocks, a taller nose facing the cars, red and white ones at the exit
  {const bar=[];let acc=0;for(let k=0;k<ESC.length-1;k++){const A=ESC[k],B=ESC[k+1];const l=Math.hypot(B[0]-A[0],B[1]-A[1]),dx=(B[0]-A[0])/l,dz=(B[1]-A[1])/l;
    for(;acc<l;acc+=1.05){const x=A[0]+dx*acc+dz*(ESC_W/2+.25),z=A[1]+dz*acc-dx*(ESC_W/2+.25);const n=nearest(x,z,30);if(!n)continue;const lat=(x-SX[n.i])*RXa[n.i]+(z-SZ[n.i])*RZa[n.i];if(lat<HW+.4)continue;bar.push([x,z,Math.atan2(dx,dz),lerp(A[2],B[2],acc/l)+.03]);}acc-=l;}
   bar.forEach(([x,z,th,y],k)=>{const nose=k<2,exit=k>=bar.length-6;const c=exit?(k%2?lin('#f2f2ee'):lin('#d4202a')):(k%2?lin('#f07a12'):lin('#c8261e'));
    teamB.box(x,z,y,y+(nose?1.5:1.15),.25,.5,th,c);teamB.box(x,z,y+(nose?1.5:1.15),y+(nose?1.58:1.2),.26,.5,th,lin('#f2f2ee'));});}
  for(const [h,c] of [[3.25,0x22ff66],[2.7,0x3a0b0b]]){const lamp=new THREE.Mesh(new THREE.CircleGeometry(.09,12),new THREE.MeshBasicMaterial({color:c,toneMapped:false,side:THREE.DoubleSide}));lamp.position.set(lx+dx*.15,ly+h,lz+dz*.15);lamp.rotation.y=th;scene.add(lamp);}}
 // Sainte Dévote: wall of dark boards at the end of the run-off, as seen from the start straight
 if(sdWall.length){const wb=new Batch();for(const [i,side] of sdWall){const j=mod(i+1);if(!SDZ[j])continue;const sd=side>0?1:0;const a=P(i,side*(HW+EXA[sd][i]+.55)),b=P(j,side*(HW+EXA[sd][j]+.55));const u0=i*DS/28,u1=(i+1)*DS/28;
   wb.quad([a[0],a[1],a[2]],[b[0],b[1],b[2]],[b[0],b[1]+2.4,b[2]],[a[0],a[1]+2.4,a[2]],[-RXa[i]*side,0,-RZa[i]*side],[[u0,0],[u1,0],[u1,1],[u0,1]],[1,1,1]);}
  wb.mesh(new THREE.MeshLambertMaterial({map:sdBoardTex(),side:THREE.DoubleSide}));}
 for(const n of Object.keys(bb))if(bb[n].p.length){const m=bb[n].mesh(new THREE.MeshLambertMaterial({map:boardTex(n),vertexColors:true,side:THREE.DoubleSide}));}}
function buildTrack(){
 const asphalt=new THREE.MeshStandardMaterial({map:asphaltTex(true),roughness:.88,metalness:0,envMapIntensity:.4});
 strip(0,N,i=>[P(i,-HW,.02),P(i,HW,.02)],10,asphalt);
 // kerbs on the inside of every real corner
 const kt=kerbTex();const kmat=new THREE.MeshStandardMaterial({map:kt,roughness:.7,envMapIntensity:.4});
 const kmatB=new THREE.MeshStandardMaterial({map:kerbTexB(),roughness:.7,envMapIntensity:.4});const blueAt=[cpIdx(129),cpIdx(107)];
 for(const side of[-1,1]){const pred=i=>{for(let k=-5;k<=5;k++){const kk=K[mod(i+k)];if(side<0?kk>1/85:kk<-1/85)return true;}return false;};
  for(const r of runs(pred)){const mid=mod(r[0]+(r[1]>>1));const bl=blueAt.some(c=>Math.min(mod(mid-c),mod(c-mid))<30);strip(r[0],r[1],i=>side<0?[P(i,-HW-.2,.045),P(i,-HW+1.1,.045)]:[P(i,HW-1.1,.045),P(i,HW+.2,.045)],bl?3:2,bl?kmatB:kmat);}}
 // barriers with ad boards
 const SCH=new Array(N).fill('green');
 for(const [a,b,n] of[[104,131,'green'],[131,145,'bluegreen'],[145,155,'navy'],[155,5,'black'],[5,19,'maroon'],[19,33,'black'],[33,39,'white'],[39,46,'navy'],[46,52,'blackw'],[52,58,'chicane'],[58,62,'darkgreen'],[62,68,'navy'],[68,92,'purple'],[92,98,'blackw'],[98,104,'yellow']])rangeIdx(cpIdx(a),cpIdx(b)).forEach(i=>SCH[i]=n);
 buildBarriers(SCH);
 // foam tyre barriers (hairpin, chicane escape, Sainte Dévote) and striped bollards at Tabac
 const OR=lin('#f07a12'),YE=lin('#f2c200');
 for(const [a,b] of[[20,25]]){const r=rangeIdx(cpIdx(a),cpIdx(b));for(let k=0;k<r.length;k++){const i=r[k];const out=K[i]>0?1:-1;const p=P(i,out*(HW+.75+EXA[out>0?1:0][i]));for(let l=0;l<2;l++)teamB.box(p[0],p[2],p[1]+l*.5,p[1]+l*.5+.48,.45,DS*.5,PSI[i],(k+l)%2?OR:YE);}}
 {const r=rangeIdx(cpIdx(64),cpIdx(67));for(let k=0;k<r.length;k++){const i=r[k];const p=P(i,HW-.1);teamB.box(p[0],p[2],p[1],p[1]+1.1,.12,DS*.5,PSI[i],k%2?lin('#d4202a'):lin('#f4f4f0'));}}
 // catch fencing (not inside the tunnel)
 const fmat=new THREE.MeshLambertMaterial({map:fenceTex(),transparent:true,alphaTest:.2,side:THREE.DoubleSide,depthWrite:false});fmat.map.repeat.set(1,11);
 const postG=new THREE.CylinderGeometry(.045,.045,1,6);const LEAN=.5;
 for(const side of[-1,1])for(const r of runs(i=>{if(TUN[i])return false;const q=P(i,side*(HW+.45+EXA[side>0?1:0][i]));return escAt(q[0],q[2]).d>ESC_W/2+.5;})){const EXs=i=>EXA[side>0?1:0][i];strip(r[0],r[1],i=>[P(i,side*(HW+.35+EXs(i)),1.05),P(i,side*(HW+.45+EXs(i)),3.7)],.3,fmat,false,true);strip(r[0],r[1],i=>[P(i,side*(HW+.45+EXs(i)),3.7),P(i,side*(HW+.45+EXs(i)-Math.sin(LEAN)*1.3),3.7+Math.cos(LEAN)*1.3)],.3,fmat,false,true);
  for(let k=0;k<=r[1];k+=3){const i=mod(r[0]+k);const ex=EXA[side>0?1:0][i];const p=P(i,side*(HW+.45+ex),0);metalB.geom(postG,mtx(p[0],p[1]+1.85,p[2],PSI[i],0,0,1,3.7,1),lin('#6d7176'));const q=P(i,side*(HW+.45+ex-Math.sin(LEAN)*.65),3.7+Math.cos(LEAN)*.65);metalB.geom(postG,mtx(q[0],q[1],q[2],PSI[i],0,side*LEAN,1,1.3,1),lin('#6d7176'));}}
 // double lanterns along Beau Rivage, Massenet, Casino and the descent to Mirabeau
 {const blk=lin('#16181b'),glow=lin('#fff6d8');const zone=new Uint8Array(N);rangeIdx(cpIdx(131),cpIdx(30)).forEach(i=>zone[i]=1);
  const poleG=new THREE.CylinderGeometry(.07,.11,1,8),lampG=new THREE.CylinderGeometry(.16,.1,.42,6),globe=new THREE.SphereGeometry(.12,8,6);let n=0;
  for(let i=0;i<N;i+=14){if(!zone[i]||TUN[i])continue;const side=(n++%2)?1:-1;const p=P(i,side*(HW+3.7));const y=p[1]+.15;metalB.geom(poleG,mtx(p[0],y+2.3,p[2],0,0,0,1,4.6,1),blk);
   const ax=RXa[i]*side*.45,az=RZa[i]*side*.45;metalB.box(p[0],p[2],y+4.5,y+4.58,.05,.5,PSI[i]+Math.PI/2,blk);
   for(const t of[-1,1]){const lx=p[0]+TXa[i]*.45*t,lz=p[2]+TZa[i]*.45*t;metalB.geom(lampG,mtx(lx,y+4.25,lz,0),blk);whiteB.geom(globe,mtx(lx,y+4.2,lz,0),glow);}}}
 // TV / marshal cranes (red and yellow) beside the track
 for(const [cp,d,col] of[[130,-(HW+22),'#c8261e'],[10,HW+22,'#e8b400'],[62,HW+20,'#c8261e'],[97,-(HW+20),'#e8b400'],[34,-(HW+16),'#c8261e']]){const i=cpIdx(cp);let dd=d;let q=P(i,dd);if(waterAt(q[0],q[2])){dd=-d;q=P(i,dd);}const y=heightAt(q[0],q[2]);const cc=lin(col);
  metalB.box(q[0],q[2],y,y+2.6,1.4,5,PSI[i],lin('#e8e6e0'));metalB.box(q[0],q[2],y+2.6,y+4,1.2,1.5,PSI[i],cc);
  const ang=Math.PI/2-.95,L=32;const dir=-Math.sign(dd);const bx=q[0]+RXa[i]*dir*Math.sin(ang)*L/2,bz=q[2]+RZa[i]*dir*Math.sin(ang)*L/2;metalB.geom(new THREE.BoxGeometry(.9,L,.9),mtx(bx,y+4+Math.cos(ang)*L/2,bz,PSI[i],0,dir*ang),cc);}
 // marshals in orange overalls at the posts behind the barrier, on the outside of the corners
 {const OR=lin('#f07a12'),DK=lin('#1d2026'),SK=lin('#d9a882'),head=new THREE.SphereGeometry(.12,8,6);
  for(const cp of[129,135,146,156,8,17,24,33,38,52,57,62,72,81,92,98,104,114]){const i=cpIdx(cp);const sides=K[i]>0?[1,-1]:[-1,1];
   for(const side of sides){const sd=side>0?1:0;if(STANDSIDE[sd][i]||(side>0&&PIT[i])||TUN[i])continue;const off=HW+1.3+EXA[sd][i];const q=P(i,side*off);if(waterAt(q[0],q[2])||escAt(q[0],q[2]).d<ESC_W/2+1)continue;
    for(const along of[-.6,.6]){const x=q[0]+TXa[i]*along,z=q[2]+TZa[i]*along,y=q[1]+1.0,th=PSI[i]+(side>0?-1:1)*Math.PI/2;
     // they stand on the marshal post platform, so they can see over the barrier and boards
     if(along<0)concB.box(q[0],q[2],q[1],y,.5,1.3,PSI[i],lin('#8e9196'));
     teamB.box(x,z,y,y+.8,.1,.16,th,DK);teamB.box(x,z,y+.8,y+1.42,.13,.2,th,OR);teamB.box(x,z,y+1.0,y+1.06,.135,.205,th,lin('#e8e8e0'));whiteB.geom(head,mtx(x,y+1.58,z,0),SK);}
    break;}}}
 // stone retaining wall on the inside of Mirabeau Bas and Portier
 // stone balustrade along the harbour side of Beau Rivage
 {const bm=new THREE.MeshLambertMaterial({map:balTex(),transparent:true,alphaTest:.4,side:THREE.DoubleSide});const r=rangeIdx(cpIdx(133),cpIdx(145));strip(r[0],r.length-1,i=>[P(i,HW+4.2,.15),P(i,HW+4.2,1.25)],2.4,bm,true,1);}
 // sidewalks + quay skirts
 const swm=new THREE.MeshLambertMaterial({color:COL(0xcbc3b3)});const skm=new THREE.MeshLambertMaterial({color:COL(0x9f978a),side:THREE.DoubleSide});
 // where another stretch of the circuit runs alongside at a different level (the approach to the hairpin above Mirabeau Bas),
 // the pavement stops short of it (SWO = pavement width) and the higher road's edge drops down to the lower one (SWB = bottom of the face)
 const SWO=[new Float32Array(N).fill(4.3),new Float32Array(N).fill(4.3)],SWB=[new Float32Array(N).fill(-6),new Float32Array(N).fill(-6)];
 {const near=[];for(let i=0;i<N;i++){const a=[];for(let j=0;j<N;j++){if(Math.min(mod(j-i),mod(i-j))<40||Math.abs(SY[j]-SY[i])<1)continue;if((SX[j]-SX[i])**2+(SZ[j]-SZ[i])**2<40*40)a.push(j);}near.push(a);}
  for(const side of[-1,1]){const sd=side>0?1:0;for(let i=0;i<N;i++){if(!near[i].length)continue;
   for(let e=.3;e<=4.3;e+=.25){const p=P(i,side*(HW+e+EXA[sd][i]));let hit=-1,hd=HW+.9;for(const j of near[i]){const d=Math.hypot(SX[j]-p[0],SZ[j]-p[2]);if(d<hd){hd=d;hit=j;}}
    if(hit>=0){SWO[sd][i]=Math.max(.3,e-.25);if(SY[hit]<SY[i])SWB[sd][i]=Math.min(-1,SY[hit]-SY[i]-.6);break;}}}}}
 for(const side of[-1,1]){const sd=side>0?1:0;const O=i=>HW+SWO[sd][i]+EXA[sd][i];for(const r of runs(i=>{if(side>0&&PIT[i]||TUN[i])return false;const q=P(i,side*(HW+2.3+EXA[sd][i]));return escAt(q[0],q[2]).d>ESC_W/2+1;})){const X2=i=>EXA[sd][i];strip(r[0],r[1],i=>side<0?[P(i,-O(i),.15),P(i,-HW-.3-X2(i),.15)]:[P(i,HW+.3+X2(i),.15),P(i,O(i),.15)],5,swm);
   strip(r[0],r[1],i=>[P(i,side*O(i),Math.min(-6,SWB[sd][i])),P(i,side*O(i),.15)],5,skm);}}
 const STUC=[new Uint8Array(N),new Uint8Array(N)];
 {const r=rangeIdx(mod(cpIdx(46)+4),mod(cpIdx(52)-8));let wl=0,wr=0;for(const i of r){const a=P(i,-30),b=P(i,30);if(waterAt(a[0],a[2]))wl++;if(waterAt(b[0],b[2]))wr++;}const land=wl>wr?1:-1;
  const st=new THREE.MeshLambertMaterial({map:stuccoTex(),side:THREE.DoubleSide});const sd=land>0?1:0;r.forEach(i=>STUC[sd][i]=1);
  strip(r[0],r.length-1,i=>[P(i,land*(HW+4.45),-.4),P(i,land*(HW+4.45),5.2)],6,st,true,1);
  const bm=new THREE.MeshLambertMaterial({map:balTex(),transparent:true,alphaTest:.4,side:THREE.DoubleSide});strip(r[0],r.length-1,i=>[P(i,land*(HW+4.45),5.2),P(i,land*(HW+4.45),6.2)],2.4,bm,true,1);
  const c52=cpIdx(52);for(const m of[150,100,50]){const i=mod(c52-Math.round(m/DS)-6);const p=P(i,land*(HW+.9));metalB.box(p[0],p[2],p[1],p[1]+1.7,.05,.05,PSI[i],lin('#2a2c30'));const q=P(i,land*(HW+.9),1.7);
   const g=new THREE.PlaneGeometry(.55,1.0);const m2=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:numTex(String(m)),side:THREE.DoubleSide}));m2.position.set(q[0],q[1]+.5,q[2]);m2.rotation.y=PSI[i];scene.add(m2);}}
 // retaining walls: wherever the ground behind the pavement rises above the street, a stone wall holds it (Mirabeau, hairpin, Portier, Beau Rivage...)
 {const sm=new THREE.MeshLambertMaterial({map:stoneTex(),side:THREE.DoubleSide});sm.map.repeat.set(1,1);
  // stone face of a road built above another stretch of the circuit, down to the lower road
  for(const side of[-1,1]){const sd=side>0?1:0;for(const r of runs(i=>SWB[sd][i]>-6&&SWB[sd][i]<-.9||SWB[sd][i]<-6.01&&!TUN[i])){const O=i=>side*(HW+SWO[sd][i]+EXA[sd][i]+.02);
   const pos=[],uv=[],idx=[];for(let k=0;k<=r[1]+1;k++){const i=mod(r[0]+k);const a=P(i,O(i),SWB[sd][i]),b=P(i,O(i),.15);const v=k*DS/5;pos.push(...a,...b);uv.push(v,0,v,(.15-SWB[sd][i])/3);}
   for(let k=0;k<=r[1];k++){const a=2*k;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,sm);m.castShadow=m.receiveShadow=true;scene.add(m);registerChunk(m);}}
  for(const side of[-1,1]){const sd=side>0?1:0;const hw=new Float32Array(N);for(let i=0;i<N;i++){if(TUN[i]||(side>0&&PIT[i])||CHI[i]||STUC[sd][i])continue;const q=P(i,side*(HW+16+EXA[sd][i]));if(waterAt(q[0],q[2]))continue;hw[i]=clamp(heightAt(q[0],q[2])-SY[i]+.4,0,2.6);}
   const sm2=hw.slice();for(let i=0;i<N;i++){let a=0;for(let k=-3;k<=3;k++)a+=hw[mod(i+k)];sm2[i]=Math.max(hw[i],a/7);}
   for(const r of runs(i=>sm2[i]>1.0)){const pos=[],uv=[],idx=[];for(let k=0;k<=r[1]+1;k++){const i=mod(r[0]+k);const ex=EXA[sd][i];const a=P(i,side*(HW+4.45+ex),-.4),b=P(i,side*(HW+4.45+ex),sm2[i]);const v=k*DS/5;pos.push(...a,...b);uv.push(v,0,v,(sm2[i]+.4)/3);}
    for(let k=0;k<=r[1];k++){const a=2*k;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,sm);m.castShadow=m.receiveShadow=true;scene.add(m);registerChunk(m);
    // coping stone on top
    strip(r[0],r[1]+1,i=>[P(i,side*(HW+4.3+EXA[sd][i]),sm2[i]),P(i,side*(HW+4.9+EXA[sd][i]),sm2[i])],4,new THREE.MeshLambertMaterial({color:COL(0xd9d2c2)}));}}}
 // start line + grid slots
 const w=lin('#f4f4f0');
 whiteB.box(SX[0],SZ[0],SY[0]+.02,SY[0]+.05,HW,.3,PSI[0],w);
 for(let g=0;g<6;g++){const i=mod(-8-g*4);const d=(g%2?1:-1)*2.3;const p=P(i,d);whiteB.box(p[0],p[2],p[1]+.02,p[1]+.05,1.1,.12,PSI[i],w);for(const e of[-1,1]){const q=P(i,d+e*1.05);whiteB.box(q[0]+TXa[i]*0.6,q[2]+TZa[i]*0.6,q[1]+.02,q[1]+.05,.08,.6,PSI[i],w);}}
 // pit lane, garages and paddock building
 const pitAs=new THREE.MeshStandardMaterial({map:asphaltTex(true),roughness:.9,envMapIntensity:.3});
 const pr=runs(i=>PIT[i])[0];if(pr){strip(pr[0],pr[1],i=>[P(i,HW+.3,.03),P(i,HW+10.2,.03)],10,pitAs);
  const TEAM=['#c8102e','#0a2a5c','#00a19b','#ff8000','#1e5bc6','#2d826d','#b6babd','#ffffff','#e6002b','#6cd3bf'].map(lin);
  let t=0;for(let k=8;k<pr[1]-8;k+=4){const i=mod(pr[0]+k);const th=PSI[i];const tc=TEAM[Math.floor(t/2)%TEAM.length];t++;const cin=P(i,HW+15.5);const L=4*DS/2;
   tryRect(cin[0],cin[2],6,L,th,true);
   const b=P(i,HW+20.7);concB.box(b[0],b[2],b[1]-1,b[1]+4.6,.3,L,th,lin('#d9d6cf'));
   const fl=P(i,HW+15.5);concB.box(fl[0],fl[2],fl[1]-1,fl[1]+.06,5.3,L,th,lin('#7c7f84'));
   concB.box(fl[0],fl[2],fl[1]+4.2,fl[1]+4.7,5.4,L,th,lin('#d9d6cf'));
   const dv=[fl[0]+TXa[i]*L,fl[2]+TZa[i]*L];concB.box(dv[0],dv[1],fl[1],fl[1]+4.2,5.3,.15,th,lin('#e7e4de'));
   const hd=P(i,HW+10.4);teamB.box(hd[0],hd[2],hd[1]+3.3,hd[1]+4.2,.15,L,th,tc);
   const bk=P(i,HW+20.35);teamB.box(bk[0],bk[2],bk[1]+.5,bk[1]+3.5,.06,L*0.9,th,tc);
   if(k%12===8){const u=P(mod(i+4),HW+16);FAC_B(3).box(u[0],u[2],u[1]+4.7,u[1]+10.5,6.2,12.2,th,lin('#f2f2f0'),9,9,roofB,lin('#8f8a82'));}}}
 // tunnel
 const tuns=runs(i=>TUN[i])[0];if(tuns){const tw=lin('#cdbf9c'),tw2=lin('#bfae86'),ceil=lin('#8a8780'),pil=lin('#d9d2c1');const lamps=[];
  // which side faces the sea
  let seaL=0,seaR=0;for(let k=0;k<tuns[1];k+=10){const i=mod(tuns[0]+k);const l=P(i,-(HW+30)),r=P(i,HW+30);if(isWaterXZ(l[0],l[2]))seaL++;if(isWaterXZ(r[0],r[2]))seaR++;}const seaSide=seaL>=seaR?-1:1;
  const tileM=new THREE.MeshLambertMaterial({map:tunnelTileTex()});
  for(let k=0;k<tuns[1];k++){const i=mod(tuns[0]+k),j=mod(i+1);
   for(const side of[-1,1]){const a=P(i,side*(HW+1.3)),b=P(j,side*(HW+1.3));const nrm=[-RXa[i]*side,0,-RZa[i]*side];
    if(side!==seaSide){concB.quad([a[0],a[1],a[2]],[b[0],b[1],b[2]],[b[0],b[1]+6.6,b[2]],[a[0],a[1]+6.6,a[2]],nrm,[[0,0],[1,0],[1,1],[0,1]],tw);}
    else{concB.quad([a[0],a[1],a[2]],[b[0],b[1],b[2]],[b[0],b[1]+1.25,b[2]],[a[0],a[1]+1.25,a[2]],nrm,[[0,0],[1,0],[1,1],[0,1]],tw2);
     concB.quad([a[0],a[1]+5.7,a[2]],[b[0],b[1]+5.7,b[2]],[b[0],b[1]+6.6,b[2]],[a[0],a[1]+6.6,a[2]],nrm,[[0,0],[1,0],[1,1],[0,1]],tw2);
     if(k%3===0){const c=P(i,side*(HW+1.7));whiteB.box(c[0],c[2],c[1]+1.2,c[1]+5.75,.4,.7,PSI[i],pil);}}
    const f1=P(i,side*(HW+.3)),f2=P(j,side*(HW+.3)),g1=P(i,side*(HW+1.3)),g2=P(j,side*(HW+1.3));concB.quad([f1[0],f1[1]+.12,f1[2]],[f2[0],f2[1]+.12,f2[2]],[g2[0],g2[1]+.12,g2[2]],[g1[0],g1[1]+.12,g1[2]],[0,1,0],[[0,0],[1,0],[1,1],[0,1]],lin('#8b877f'));}
   const l=P(i,-(HW+2.2)),r=P(i,HW+2.2),l2=P(j,-(HW+2.2)),r2=P(j,HW+2.2);concB.quad([l[0],l[1]+6.6,l[2]],[r[0],r[1]+6.6,r[2]],[r2[0],r2[1]+6.6,r2[2]],[l2[0],l2[1]+6.6,l2[2]],[0,-1,0],[[0,0],[1,0],[1,1],[0,1]],ceil);
   concB.quad([l[0],l[1]+6.8,l[2]],[r[0],r[1]+6.8,r[2]],[r2[0],r2[1]+6.8,r2[2]],[l2[0],l2[1]+6.8,l2[2]],[0,1,0],[[0,0],[1,0],[1,1],[0,1]],ceil);
   if(k%4===0){const c=P(i,0);concB.box(c[0],c[2],c[1]+6.25,c[1]+6.6,HW+1.4,.25,PSI[i],lin('#77746d'));}
   if(k%2===0){for(const d of[-(HW+.7),HW+.7]){const p=P(i,d);lamps.push([p[0],p[1]+6.2,p[2],PSI[i]]);}const p=P(i,-seaSide*(HW+1.22));lamps.push([p[0],p[1]+4.2,p[2],PSI[i],1]);}}
  const lg=new THREE.BoxGeometry(.5,.12,1.5);const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.6,1.25),toneMapped:false});const im=new THREE.InstancedMesh(lg,lm,lamps.length);const d=new THREE.Object3D();
  lamps.forEach((l,k)=>{d.position.set(l[0],l[1],l[2]);d.rotation.set(0,l[3],0);d.scale.set(l[4]?0.2:1,l[4]?1.6:1,l[4]?1:1);d.updateMatrix();im.setMatrixAt(k,d.matrix);});scene.add(im);
  // floor glow under each lamp row (cheap fake lighting)
  const gm=new THREE.MeshBasicMaterial({color:0xfff6d0,transparent:true,opacity:.07,depthWrite:false});strip(tuns[0],tuns[1],i=>[P(i,-HW+.4,.03),P(i,HW-.4,.03)],10,gm);
  // portals
  for(const e of[tuns[0],mod(tuns[0]+tuns[1])]){const p=P(e,0);concB.box(p[0],p[2],p[1]+6.6,p[1]+8.2,HW+2.4,.6,PSI[e],lin('#e5e0d6'));}}
 // footbridges with banners
 const btex=new THREE.MeshLambertMaterial({map:bridgeTex()});const bb=new Batch();
 {const bi=cpIdx(38)+10;const p=P(mod(bi),0);concB.box(p[0],p[2],p[1]+6.2,p[1]+8.4,HW+9,7,PSI[mod(bi)],lin('#d9d3c3'));for(const s2 of[-1,1]){const q=P(mod(bi),s2*(HW+3));concB.box(q[0],q[2],q[1]-1,q[1]+6.2,.6,5,PSI[mod(bi)],lin('#cfc8b6'));}}
 {const wb=new Batch();for(const bi of[cpIdx(125)]){const p=P(bi,0);const th=PSI[bi];wb.box(p[0],p[2],p[1]+6.2,p[1]+8,HW+5,1.2,th,[1,1,1],2*HW+10,1.8);for(const s of[-1,1]){const q=P(bi,s*(HW+4.6));metalB.box(q[0],q[2],q[1]-1,q[1]+6.2,.25,.25,th,lin('#d8d8d4'));}}wb.mesh(new THREE.MeshLambertMaterial({map:bannerTex('#f4f4f2','#c8102e','PRINCIPAUTÉ DE MONACO · 1929')}));}
 for(const bi of[cpIdx(115)]){const p=P(bi,0);const th=PSI[bi];bb.box(p[0],p[2],p[1]+5.6,p[1]+7.2,HW+6,1.4,th,[1,1,1],2*HW+12,1.6);
  for(const s of[-1,1]){const q=P(bi,s*(HW+5.2));metalB.box(q[0],q[2],q[1]-1,q[1]+5.6,.35,.35,th,lin('#5d6166'));}}
 bb.mesh(btex);
 // Monaco flags along the boulevard
 for(let k=10;k<N;k+=26){if(TUN[k])continue;const side=k%52<26?-1:1;if(side>0&&PIT[k])continue;const p=P(k,side*(HW+3.4));metalB.box(p[0],p[2],p[1],p[1]+8,.05,.05,0,lin('#cfd2d6'));
  const th=PSI[k]+Math.PI/2;const c=Math.cos(th),s=Math.sin(th);const a=[p[0],p[1]+7.9,p[2]],b=[p[0]+c*1.6,p[1]+7.9,p[2]-s*1.6];
  flagB.quad([a[0],a[1]-.55,a[2]],[b[0],b[1]-.55,b[2]],b,a,null,[[0,0],[1,0],[1,1],[0,1]],lin('#d51b2b'));flagB.quad([a[0],a[1]-1.1,a[2]],[b[0],b[1]-1.1,b[2]],[b[0],b[1]-.55,b[2]],[a[0],a[1]-.55,a[2]],null,[[0,0],[1,0],[1,1],[0,1]],lin('#f6f6f4'));}}

const MT=[]; // Mareterra park trees, planted after the city
const STANDSIDE=[new Uint8Array(N),new Uint8Array(N)];
const segScale=12; // metres of stand covered by one crowd texture width (about 20 people per row)
function grandstand(i0,i1,side,off,rows,roof){const idx=rangeIdx(i0,i1);for(let q=-8;q<idx.length+8;q++){const ii=mod(i0+q);STANDSIDE[side>0?1:0][ii]=1;const c=P(ii,side*(HW+9));markDisc(c[0],c[2],9);}const step=2;const depth=rows*.95+1;
 for(let k=0;k+step<idx.length;k+=step){const ia=idx[k],ib=idx[k+step],im=idx[k+1];const th=PSI[im];const segL=DS*step/2+.05;const baseY=SY[im];
  const cc=P(im,side*(off+depth/2));tryRect(cc[0],cc[2],depth/2,segL,th,true);
  const B0=baseY+2.2;const pc=P(im,side*(off+depth/2));concB.box(pc[0],pc[2],Math.min(baseY,heightAt(pc[0],pc[2]))-2,B0-.45,depth/2,segL,th,lin('#d8d4cb'));
  for(let r=0;r<rows;r++){const c=P(im,side*(off+.5+r*.95));concB.box(c[0],c[2],B0-.45+r*.55,B0+r*.55,.475,segL,th,lin('#9aa2ab'));}
  // the seated crowd: one upright strip of people per step, facing the track, plus the front rail
  {const tn=[-side*RXa[im],0,-side*RZa[im]];const u0=k*DS/segScale,u1=(k+step)*DS/segScale;
   for(let r=0;r<rows;r++){const d=side*(off+.42+r*.95),ys=B0-.45+r*.55+.02,A=P(ia,d),Bq=P(ib,d),band=((r*3+k)%8);const v0=1-(band+1)/8,v1=1-band/8;
    crowdB.quad([A[0],ys,A[2]],[Bq[0],ys,Bq[2]],[Bq[0],ys+.95,Bq[2]],[A[0],ys+.95,A[2]],tn,[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],[1,1,1]);}
   const rl=P(im,side*(off-.05));metalB.box(rl[0],rl[2],B0+.55,B0+.6,.03,segL,th,lin('#b8bdc2'));if(k%2===0){const q=P(ia,side*(off-.05));metalB.box(q[0],q[2],B0-.45,B0+.6,.03,.03,th,lin('#b8bdc2'));}}
  const top=B0+rows*.55+3;if(roof==='canopy'){const rc=P(im,side*(off+depth/2+2));concB.box(rc[0],rc[2],B0+rows*.55+2.4,B0+rows*.55+3.1,depth/2+2.5,segL,th,lin('#9c9d9e'));}
  else if(roof==='scaffold'){const tube=lin('#9aa1a8'),tarp=lin('#24408a');
   if(k%3===0){for(const f of[0,.5,1]){const q=P(ia,side*(off+f*depth));metalB.box(q[0],q[2],Math.min(baseY,heightAt(q[0],q[2]))-1,B0+f*rows*.55+.9,.06,.06,th,tube);}}
   const bk=P(im,side*(off+depth+.1));concB.box(bk[0],bk[2],B0-.5,B0+rows*.55+1,.04,segL,th,tarp);
   const rl=P(im,side*(off+depth-.05));metalB.box(rl[0],rl[2],B0+rows*.55+.95,B0+rows*.55+1.0,.03,segL,th,tube);}
  else if(roof!==false){const rc=P(im,side*(off+depth/2));concB.box(rc[0],rc[2],top,top+.3,depth/2+.5,segL,th,lin('#e8e8e4'));}
  if(k%8===0)for(const f of[0,1]){const q=P(ia,side*(off+f*depth));if(roof!=='scaffold'&&roof!=='canopy')metalB.box(q[0],q[2],Math.min(baseY,heightAt(q[0],q[2]))-1,roof!==false?top:B0+rows*.55,.12,.12,th,lin('#aeb2b6'));}}}

function harborAndSea(){
 const wn=waterNormal();wn.repeat.set(160,160);
 const wm=new THREE.MeshStandardMaterial({color:COL(0x0b3d52),roughness:.06,metalness:.05,normalMap:wn,normalScale:new THREE.Vector2(.45,.45),envMapIntensity:1.2});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),wm);water.rotation.x=-Math.PI/2;water.position.y=0.25;water.receiveShadow=true;scene.add(water);
 world.waterTex=wn;
 const white=lin('#f6f6f3'),navy=lin('#1b2a44'),glassC=lin('#1c2530'),teak=lin('#b08a5c');let placed=[];
 // hull (bow towards local +z, i.e. heading th) and stacked decks with a band of tinted windows; returns hull height and top of the upper deck
 const yachtAt=(X,Z,th,L,W,hullCol,decks,deckH=1.9)=>{const c=Math.cos(th),s=Math.sin(th);
  const hullH=L*.09+.8;const sh=new THREE.Shape();sh.moveTo(-W/2,L/2);sh.lineTo(W/2,L/2);sh.lineTo(W/2,-L*.15);sh.quadraticCurveTo(W/2,-L*.42,0,-L/2);sh.quadraticCurveTo(-W/2,-L*.42,-W/2,-L*.15);sh.lineTo(-W/2,L/2);
  const hg=new THREE.ExtrudeGeometry(sh,{depth:hullH,bevelEnabled:false,curveSegments:5});hg.rotateX(-Math.PI/2);
  yachtB.geom(hg,mtx(X,-hullH*.35,Z,th),hullCol);
  let y=hullH*.65,dl=L*.55,dw=W*.8;for(let d=0;d<decks;d++){const oz=L*.06;const cx=X+s*oz,cz=Z+c*oz;yachtB.box(cx,cz,y,y+deckH,dw/2,dl/2,th,white);yachtB.box(cx,cz,y+deckH*.37,y+deckH*.79,dw/2+.03,dl/2+.03,th,glassC);y+=deckH;dl*=.72;dw*=.9;}
  return {hullH,top:y};};
 // superyachts moored stern-to along the quay from the Nouvelle Chicane to the Piscine, just behind the barrier (seen on every onboard lap);
 // own seeded generator so the rest of the world keeps its layout
 {const Q=mulberry(1929),qr=(a,b)=>a+(b-a)*Q();const r=rangeIdx(cpIdx(53),cpIdx(85));let k=0;
  while(k<r.length){const i=r[k];let dq=0;for(let d=HW+3;d<=HW+12;d+=.5){const p=P(i,-d);if(isWaterXZ(p[0],p[2])){dq=d;break;}}
   const L=qr(28,56),W=L*.21;
   if(dq){const th=Math.atan2(-RXa[i],-RZa[i]);const off=Math.max(dq,HW+4.3)+1.6+L/2;const p=P(i,-off);const X=p[0],Z=p[2];const c=Math.cos(th),s=Math.sin(th);let ok=true;
    for(const q of[[0,L/2+1],[0,-L/2],[W/2+1,0],[-W/2-1,0],[W/2+1,L/3],[-W/2-1,L/3],[W/2+1,-L/3],[-W/2-1,-L/3]]){const x=X+c*q[0]+s*q[1],z=Z-s*q[0]+c*q[1];if(!isWaterXZ(x,z)){ok=false;break;}}
    if(ok){placed.push([X,Z,L]);const {hullH,top}=yachtAt(X,Z,th,L,W,Q()<.15?navy:white,L>44?4:3,2.7);
     const ak=[X-s*L*.38,Z-c*L*.38];yachtB.box(ak[0],ak[1],hullH*.64,hullH*.66,W*.42,L*.1,th,teak);
     // radar arch and mast on the sun deck
     const ma=[X+s*L*.02,Z+c*L*.02];metalB.box(ma[0],ma[1],top,top+1.4,W*.3,.25,th,lin('#e9e9e6'));metalB.box(ma[0],ma[1],top+1.4,top+3.6,.07,.07,th,lin('#dcdcdc'));
     k+=Math.max(2,Math.round((W+qr(2.5,5))/DS));continue;}}
   k+=2;}}
 // a large yacht at anchor offshore, broadside to the view from the exit of Portier
 {const i=cpIdx(33);for(let f=380;f<=600;f+=20){const X=SX[i]+TXa[i]*f+RXa[i]*60,Z=SZ[i]+TZa[i]*f+RZa[i]*60;const L=120,W=L*.15,th=Math.atan2(RXa[i],RZa[i]),c=Math.cos(th),s=Math.sin(th);let ok=true;
   for(const q of[[0,L/2+10],[0,-L/2-10],[W/2+10,0],[-W/2-10,0]])if(!isWaterXZ(X+c*q[0]+s*q[1],Z-s*q[0]+c*q[1])){ok=false;break;}
   if(ok){const {top}=yachtAt(X,Z,th,L,W,white,5,3);metalB.box(X,Z,top,top+5,.4,.4,th,lin('#e4e4e0'));placed.push([X,Z,L]);break;}}}
 // yachts moored in Port Hercule (and a few in Fontvieille)
 const zones=[[-270,150,-470,60,0.62],[-760,-560,-980,-760,0.4]];
 for(const [xa,xb,ya,yb,pr] of zones)for(let bx=xa;bx<xb;bx+=10)for(let by=ya;by<yb;by+=8){if(R()>pr)continue;const L=rr(14,50),W=L*.24;const th=(R()<.5?Math.PI/2:0)+(R()<.5?0:Math.PI)+rr(-.06,.06);
  const X=bx+rr(-3,3),Z=-by+rr(-3,3);const c=Math.cos(th),s=Math.sin(th);let ok=true;
  for(const q of[[0,L/2+3],[0,-L/2-3],[W/2+3,0],[-W/2-3,0],[0,0]]){const x=X+c*q[0]+s*q[1],z=Z-s*q[0]+c*q[1];if(!isWaterXZ(x,z)){ok=false;break;}const nr=nearest(x,z,24);if(nr&&nr.d<HW+14){ok=false;break;}const o=occI(x,z);if(o>=0&&OCC[o]===2){ok=false;break;}}
  if(!ok)continue;for(const p of placed)if(Math.hypot(p[0]-X,p[1]-Z)<(p[2]+L)/2+1.5){ok=false;break;}if(!ok)continue;placed.push([X,Z,L]);
  const {hullH}=yachtAt(X,Z,th,L,W,R()<.18?navy:white,L>30?3:L>20?2:1);
  const ak=[X-s*L*.38,Z-c*L*.38];yachtB.box(ak[0],ak[1],hullH*.64,hullH*.66,W*.42,L*.1,th,teak);
  if(L<24&&R()<.4)metalB.box(X,Z,hullH*.6,hullH*.6+L*.9,.08,.08,th,lin('#dcdcdc'));}
 yachtB.mesh(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,metalness:.05}));}

// official grandstands (ACM plan): [first centreline pt, last pt, side (-1 left / +1 right), rows, covered]
const STANDS=[
 ['Piscine (lado puerto)',70,80,-1,12,false],
 ['Entre la Piscine y La Rascasse',84,92,1,10,true],
 ['La Rascasse',92,99,-1,9,true],
 ['Recta de boxes (salida de Noghès)',108,112,-1,8,'canopy'],
 ['Recta de boxes (antes de Sainte Dévote)',121,127,-1,7,'scaffold']];
const world={};
function buildWorld(){
 FAC=[0,1,2,3,4,5].map(facadeTex);
 buildTerrain();
 buildTrack();
 for(const s of STANDS)grandstand(cpIdx(s[1]),cpIdx(s[2]),s[3],s[5]==='scaffold'?HW+6.5:HW+4.5,s[4],s[5]);
 buildCity();
 // palms along the harbour and boulevards
 for(let i=0;i<N;i+=8){if(TUN[i]||CHI[i])continue;for(const side of[-1,1]){if(side>0&&PIT[i])continue;if(STANDSIDE[side>0?1:0][i])continue;const p=P(i,side*(HW+2.6));const o=occI(p[0],p[2]);const out=P(i,side*(HW+12));
  if(waterAt(out[0],out[2])&&R()<.75)palm(p[0],p[2],rr(6,9.5));else if(maskAt(GREEN,out[0],out[2])&&R()<.6)palm(p[0],p[2],rr(6,10));else if(R()<.06)palm(p[0],p[2],rr(6,10));}}
 // leafy street trees on the pavements (the reference laps are lined with them)
 for(let i=3;i<N;i+=6){if(TUN[i]||CHI[mod(i)])continue;for(const side of[-1,1]){if(side>0&&PIT[i])continue;if(STANDSIDE[side>0?1:0][i])continue;if(R()>.42)continue;const p=P(i,side*(HW+3.3));const st=P(i,side*(HW+5.5));const o=occI(st[0],st[2]);if(o>=0&&OCC[o]===2)continue;const out=P(i,side*(HW+10));if(waterAt(out[0],out[2]))continue;tree(p[0],p[2],rr(.85,1.2));}}
 // vegetation on the banks above the retaining walls (the slopes are planted in Monaco)
 for(let i=0;i<N;i+=3){if(TUN[i]||CHI[i])continue;for(const side of[-1,1]){if(STANDSIDE[side>0?1:0][i])continue;for(let d=HW+9;d<HW+40;d+=5.5){const q=P(i,side*(d+rr(-1.5,1.5)));if(waterAt(q[0],q[2]))break;const o=occI(q[0],q[2]);if(o<0||OCC[o])continue;
   const h=heightAt(q[0],q[2]);if(h-SY[i]<2.5||R()>.55)continue;if(R()<.25)palm(q[0],q[2],rr(6,10));else tree(q[0],q[2],rr(.9,1.5));OCC[o]=1;}}}
 // gardens next to the circuit (Casino gardens at Massenet, Sainte Dévote, Rascasse) are densely planted
 for(let k=0;k<N;k+=2){for(const side of[-1,1]){if(STANDSIDE[side>0?1:0][k])continue;for(let d=HW+7;d<HW+90;d+=rr(5,8)){const q=P(k,side*d);const x=q[0]+rr(-2,2),z=q[2]+rr(-2,2);if(!maskAt(GREEN,x,z))continue;const o=occI(x,z);if(o<0||OCC[o])continue;if(R()>.5)continue;
   const r=R();if(r<.22)palm(x,z,rr(7,12));else if(r<.36)cypress(x,z,rr(8,13));else tree(x,z,rr(1,1.6));OCC[o]=1;}}}
 // plane trees lining Boulevard Albert 1er along the start straight
 for(let i=0;i<N;i+=5){if(!STR[i])continue;for(const side of[-1,1]){const sd=side>0?1:0;if(STANDSIDE[sd][i]||(side>0&&PIT[i]))continue;if(side<0&&R()>.3)continue;const q=P(i,side*(HW+rr(5.5,7.5)));if(waterAt(q[0],q[2]))continue;const o=occI(q[0],q[2]);if(o<0||OCC[o]===2)continue;tree(q[0],q[2],rr(1.7,2.2));OCC[o]=1;}}
 for(const [x,z] of MT)tree(x,z,.9+hash2(Math.round(x),Math.round(z))*.6);
 // trees in the real parks and gardens
 for(const t of DATA.trees){const x=t[0],z=-t[1];const o=occI(x,z);if(o<0||OCC[o])continue;if(maskAt(GREEN,x,z)&&Math.hypot(x,z)<700&&R()<.18)palm(x,z,rr(6,11));else tree(x,z,rr(.9,1.5));}
 harborAndSea();
 whiteB.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));metalB.mesh(new THREE.MeshStandardMaterial({vertexColors:true,metalness:.6,roughness:.4}));
 concB.mesh(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));teamB.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));
 greenB.mesh(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));trunkB.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));
 {const lt=leafTex(),ft=frondTex();const lm=leafB.mesh(new THREE.MeshLambertMaterial({map:lt,vertexColors:true,alphaTest:.45,side:THREE.DoubleSide}));lm.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:lt,alphaTest:.45});
  const fm=frondB.mesh(new THREE.MeshLambertMaterial({map:ft,vertexColors:true,alphaTest:.4,side:THREE.DoubleSide}));fm.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:ft,alphaTest:.4});}
 flagB.mesh(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),false);
 {const ct=crowdTex();const m=crowdB.mesh(new THREE.MeshLambertMaterial({map:ct,vertexColors:true,alphaTest:.5,side:THREE.DoubleSide}));m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:ct,alphaTest:.5});}
 buildGantry();}

// ---------------------------------------------------------------- start gantry
const lampMats=[];
function buildGantry(){const i=mod(2);const g=new THREE.Group();const p=P(i,0);g.position.set(p[0],p[1],p[2]);g.rotation.y=PSI[i];scene.add(g);
 const dark=new THREE.MeshStandardMaterial({color:COL(0x1b1d21),roughness:.5,metalness:.4});
 for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,8,.5),dark);m.position.set(s*(HW+1.6),4,0);m.castShadow=true;g.add(m);}
 const beam=new THREE.Mesh(new THREE.BoxGeometry(2*HW+3.7,.6,.6),dark);beam.position.set(0,7.6,0);g.add(beam);
 const panel=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.5,.4),dark);panel.position.set(0,6.6,0);g.add(panel);
 for(let c=0;c<5;c++){const m=new THREE.MeshBasicMaterial({color:0x220608});lampMats.push(m);for(let r=0;r<2;r++){const l=new THREE.Mesh(new THREE.CircleGeometry(.22,16),m);l.position.set(-1.8+c*.9,6.95-r*.6,.21);g.add(l);}}}

export {buildWorld,heightAt,lampMats,world};
