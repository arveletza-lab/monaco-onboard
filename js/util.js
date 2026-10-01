// Utilities shared by every module: seeded random, noise, colours, canvases, the scene and the merged-geometry Batch.
// THREE is the global loaded from vendor/three.min.js before the modules.

// ---------------------------------------------------------------- utils
const $=id=>document.getElementById(id);
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=mulberry(20260929);
const rr=(a,b)=>a+(b-a)*R();
const pick=a=>a[Math.floor(R()*a.length)];
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const TAU=Math.PI*2;
const wrapA=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
function hash2(x,y){let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295;}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return lerp(lerp(hash2(xi,yi),hash2(xi+1,yi),u),lerp(hash2(xi,yi+1),hash2(xi+1,yi+1),u),v);}
function fbm(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||4);i++){s+=a*vnoise(x*f+i*17.3,y*f-i*9.1);f*=2;a*=.5;}return s;}
function lin(hex){const c=new THREE.Color(hex);c.convertSRGBToLinear();return [c.r,c.g,c.b];}
function pip(poly,x,y){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins;}return ins;}
const COL=h=>new THREE.Color(h).convertSRGBToLinear();
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const IS_MOBILE=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||((('ontouchstart' in window)||navigator.maxTouchPoints>0)&&Math.min(screen.width,screen.height)<900);
// the one scene every builder adds its meshes to (renderer, camera and lights live in main.js)
const scene=new THREE.Scene();
// ---------------------------------------------------------------- Batch: merged geometry builder
const V3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
class Batch{constructor(){this.p=[];this.n=[];this.u=[];this.c=[];}
 quad(A,B,C,D,n,uv,col){const e1=V3(B,A),e2=V3(C,A);const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  if(n){if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0){const t=B;B=D;D=t;uv=[uv[0],uv[3],uv[2],uv[1]];}}else{const l=Math.hypot(cr[0],cr[1],cr[2])||1;n=[cr[0]/l,cr[1]/l,cr[2]/l];}
  const vs=[A,B,C,A,C,D],us=[uv[0],uv[1],uv[2],uv[0],uv[2],uv[3]];
  for(let k=0;k<6;k++){const v=vs[k];this.p.push(v[0],v[1],v[2]);this.n.push(n[0],n[1],n[2]);this.u.push(us[k][0],us[k][1]);this.c.push(col[0],col[1],col[2]);}}
 tri(A,B,C,n,col){const e1=V3(B,A),e2=V3(C,A);const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0){const t=B;B=C;C=t;}for(const v of[A,B,C]){this.p.push(v[0],v[1],v[2]);this.n.push(n[0],n[1],n[2]);this.u.push(v[0]/9,v[2]/9);this.c.push(col[0],col[1],col[2]);}}
 box(cx,cz,y0,y1,hx,hz,th,col,uw,uh,roof,roofCol){uw=uw||9;uh=uh||9;const c=Math.cos(th),s=Math.sin(th);const ex=[c,0,-s],ez=[s,0,c];
  const cor=(sx,sz,y)=>[cx+ex[0]*hx*sx+ez[0]*hz*sz,y,cz+ex[2]*hx*sx+ez[2]*hz*sz];const H=(y1-y0)/uh;
  const faces=[[[1,-1],[1,1],ex,hz*2],[[-1,1],[-1,-1],[-ex[0],0,-ex[2]],hz*2],[[1,1],[-1,1],ez,hx*2],[[-1,-1],[1,-1],[-ez[0],0,-ez[2]],hx*2]];
  for(const f of faces){const a=cor(f[0][0],f[0][1],y0),b=cor(f[1][0],f[1][1],y0);const W=f[3]/uw;this.quad(a,b,[b[0],y1,b[2]],[a[0],y1,a[2]],f[2],[[0,0],[W,0],[W,H],[0,H]],col);}
  (roof||this).quad(cor(-1,-1,y1),cor(1,-1,y1),cor(1,1,y1),cor(-1,1,y1),[0,1,0],[[0,0],[1,0],[1,1],[0,1]],roofCol||col);}
 geom(g,m,col){const gg=g.index?g.toNonIndexed():g.clone();gg.applyMatrix4(m);const p=gg.attributes.position,n=gg.attributes.normal,u=gg.attributes.uv;for(let k=0;k<p.count;k++){this.p.push(p.getX(k),p.getY(k),p.getZ(k));this.n.push(n.getX(k),n.getY(k),n.getZ(k));this.u.push(u?u.getX(k):0,u?u.getY(k):0);this.c.push(col[0],col[1],col[2]);}}
 mesh(mat,shadow){const triN=this.p.length/9;
  if(triN>6000){const T=320,tiles=new Map();for(let t=0;t<triN;t++){const o=t*9;const cx=(this.p[o]+this.p[o+3]+this.p[o+6])/3,cz=(this.p[o+2]+this.p[o+5]+this.p[o+8])/3;const key=Math.floor(cx/T)+','+Math.floor(cz/T);let a=tiles.get(key);if(!a){a=[];tiles.set(key,a);}a.push(t);}
   const out=[];for(const ts of tiles.values()){const P=new Float32Array(ts.length*9),Nn=new Float32Array(ts.length*9),U=new Float32Array(ts.length*6),C=new Float32Array(ts.length*9);
    ts.forEach((t,k)=>{for(let q=0;q<9;q++){P[k*9+q]=this.p[t*9+q];Nn[k*9+q]=this.n[t*9+q];C[k*9+q]=this.c[t*9+q];}for(let q=0;q<6;q++)U[k*6+q]=this.u[t*6+q];});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(Nn,3));g.setAttribute('uv',new THREE.BufferAttribute(U,2));g.setAttribute('color',new THREE.BufferAttribute(C,3));g.computeBoundingSphere();
    const m=new THREE.Mesh(g,mat);if(shadow!==false){m.castShadow=true;m.receiveShadow=true;}scene.add(m);registerChunk(m);out.push(m);}
   return meshSet(out);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);if(shadow!==false){m.castShadow=true;m.receiveShadow=true;}scene.add(m);return m;}}
const CHUNKS=[];function registerChunk(m){m.geometry.computeBoundingSphere();const bs=m.geometry.boundingSphere;CHUNKS.push({m,c:bs.center.clone(),r:bs.radius});}
function meshSet(arr){return{arr,set castShadow(v){arr.forEach(m=>m.castShadow=v);},set receiveShadow(v){arr.forEach(m=>m.receiveShadow=v);},set customDepthMaterial(v){arr.forEach(m=>m.customDepthMaterial=v);}};}
function instTiled(geo,mat,items,setM,opts){const T=320,tiles=new Map();for(const it of items){const key=Math.floor(it[0]/T)+','+Math.floor(it[2]/T);let a=tiles.get(key);if(!a){a=[];tiles.set(key,a);}a.push(it);}
 const o=new THREE.Object3D();const out=[];for(const arr of tiles.values()){const im=new THREE.InstancedMesh(geo,mat,arr.length);let cx=0,cy=0,cz=0;arr.forEach((it,k)=>{setM(o,it);o.updateMatrix();im.setMatrixAt(k,o.matrix);cx+=it[0];cy+=it[1];cz+=it[2];});
  cx/=arr.length;cy/=arr.length;cz/=arr.length;let r=0;for(const it of arr)r=Math.max(r,Math.hypot(it[0]-cx,it[2]-cz));im.frustumCulled=false;
  if(opts&&opts.shadow!==false){im.castShadow=true;im.receiveShadow=true;}if(opts&&opts.depth)im.customDepthMaterial=opts.depth;scene.add(im);CHUNKS.push({m:im,c:new THREE.Vector3(cx,cy,cz),r:r+8});out.push(im);}return out;}
const mtx=(x,y,z,ry,rx,rz,sx,sy,sz)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0,'YXZ')),new THREE.Vector3(sx||1,sy||1,sz||1));
function fmt(t){if(t==null)return'—';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(3);}

export {$,Batch,CHUNKS,COL,IS_MOBILE,R,TAU,canvas,clamp,fbm,fmt,hash2,instTiled,lerp,lin,mtx,pick,pip,registerChunk,rr,scene,sstep,wrapA};
