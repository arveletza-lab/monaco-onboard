// Garage preview: the three vehicles on slowly turning platforms, studio lights, dark background.
// Prototype of the vehicle selection screen. window.garage.view(name, angle) frames one vehicle for captures.
import {build as buildFormula} from '../../js/vehicles/formula.js';
import {build as buildTractor} from '../../js/vehicles/tractor.js';
import {build as buildNight} from '../../js/vehicles/nightcar.js';

const W=()=>innerWidth,H=()=>innerHeight;
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.setSize(W(),H());
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene=new THREE.Scene();const BG=new THREE.Color(0x070a0f).convertSRGBToLinear();scene.background=BG;scene.fog=new THREE.Fog(BG,30,70);
const camera=new THREE.PerspectiveCamera(32,W()/H(),.1,200);

// studio lights: soft ambient, key light with shadows, cool rim light from behind, warm fill
scene.add(new THREE.HemisphereLight(0x9aa8bd,0x0b0d10,.35));
// studio environment for reflections: dark room with a few soft boxes (only in the garage)
{const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#2a3140');gr.addColorStop(.5,'#0c0f14');gr.addColorStop(1,'#050608');g.fillStyle=gr;g.fillRect(0,0,512,256);
 g.fillStyle='#e8eef8';g.fillRect(40,40,120,26);g.fillRect(300,30,160,20);g.fillStyle='#8fa8ff';g.fillRect(210,90,60,10);g.fillStyle='#ffd8a8';g.fillRect(430,100,50,14);
 const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(t).texture;pm.dispose();}
const key=new THREE.DirectionalLight(0xfff4e6,1.9);key.position.set(-8,16,-10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-16,right:16,top:10,bottom:-10,near:1,far:50});key.shadow.bias=-.0004;key.shadow.normalBias=.02;scene.add(key);
const rim=new THREE.DirectionalLight(0x6f8fff,.9);rim.position.set(6,8,14);scene.add(rim);
const fill=new THREE.DirectionalLight(0xffd2a0,.35);fill.position.set(14,5,-2);scene.add(fill);

// floor with a soft spot under each platform
const floorC=document.createElement('canvas');floorC.width=floorC.height=256;{const g=floorC.getContext('2d');const gr=g.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,'#1a2029');gr.addColorStop(1,'#070a0f');g.fillStyle=gr;g.fillRect(0,0,256,256);}
const floorT=new THREE.CanvasTexture(floorC);floorT.encoding=THREE.sRGBEncoding;
const floor=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({map:floorT,color:0x4a4a4a,roughness:.95,metalness:0,envMapIntensity:.2}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

const VEH=[{id:'formula',name:'Fórmula',accent:0xe2202c,build:buildFormula},{id:'tractor',name:'Tractor',accent:0xffc53d,build:buildTractor},{id:'nightcar',name:'Bólido nocturno',accent:0x2a6cff,build:buildNight}];
const SP=7.6;
VEH.forEach((v,k)=>{v.x=(k-1)*SP;
 const base=new THREE.Group();base.position.set(v.x,0,0);scene.add(base);v.base=base;
 const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.5,.14,64),new THREE.MeshStandardMaterial({color:new THREE.Color(0x1a1f27).convertSRGBToLinear(),roughness:.5,metalness:.5}));disc.position.y=.07;disc.receiveShadow=true;base.add(disc);
 const top=new THREE.Mesh(new THREE.CircleGeometry(3.32,64),new THREE.MeshStandardMaterial({color:new THREE.Color(0x232a34).convertSRGBToLinear(),roughness:.85,metalness:.1}));top.rotation.x=-Math.PI/2;top.position.y=.141;top.receiveShadow=true;base.add(top);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.45,.025,6,96),new THREE.MeshBasicMaterial({color:v.accent,toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.y=.12;base.add(ring);
 const turn=new THREE.Group();turn.position.y=.142;base.add(turn);v.turn=turn;
 const car=new THREE.Group();turn.add(car);v.car=car;v.parts=v.build(car);
 {const bb=new THREE.Box3().setFromObject(car);car.position.z=-(bb.min.z+bb.max.z)/2;car.position.x=-(bb.min.x+bb.max.x)/2;} // centre on the turntable
 let tris=0;car.traverse(o=>{if(o.isMesh){const g=o.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3;}});v.tris=Math.round(tris);
 // turntable marks so the rotation is visible
 for(let i=0;i<24;i++){const t=new THREE.Mesh(new THREE.BoxGeometry(.03,.004,.25),new THREE.MeshBasicMaterial({color:new THREE.Color(0x3a4350).convertSRGBToLinear()}));const a=i/24*Math.PI*2;t.position.set(Math.sin(a)*3.1,.002,Math.cos(a)*3.1);t.rotation.y=a;turn.add(t);}
 const el=document.createElement('div');el.className='lbl';el.innerHTML=`<i style="background:#${v.accent.toString(16).padStart(6,'0')}"></i>${v.name}`;document.body.appendChild(el);v.el=el;});

// cameras: 'todos' shows the three from ~38° above; single vehicles: iso, frente, lado, arriba
const state={spin:true,mode:'todos',angle:'iso'};
function frame(){const tgt=new THREE.Vector3();camera.up.set(0,1,0);
 if(state.mode==='todos'){camera.fov=32;camera.position.set(0,15,-19.5);tgt.set(0,.2,-1.0);}
 else{const v=VEH.find(v=>v.id===state.mode);const x=v.x,L=v.parts.length;const d=L*1.95+3;camera.fov=30;
  if(state.angle==='frente'){camera.position.set(x,d*.42,-d);tgt.set(x,.7,0);}
  else if(state.angle==='lado'){camera.position.set(x+d,d*.28,0);tgt.set(x,.8,0);}
  else if(state.angle==='atras'){camera.position.set(x+d*.35,d*.38,d*.9);tgt.set(x,.7,0);}
  else if(state.angle==='arriba'){camera.position.set(x,d*1.25,.001);tgt.set(x,0,0);camera.up.set(1,0,0);}
  else{camera.position.set(x-d*.62,d*.68,-d*.68);tgt.set(x,.7,0);}}
 camera.aspect=W()/H();camera.updateProjectionMatrix();camera.lookAt(tgt);
 for(const v of VEH){const on=state.mode==='todos'||state.mode===v.id;v.base.visible=on;v.el.style.display=on&&state.mode==='todos'?'':'none';}}
function labels(){for(const v of VEH){if(v.el.style.display==='none')continue;const p=new THREE.Vector3(v.x,0,-3.6).project(camera);v.el.style.left=((p.x+1)/2*W())+'px';v.el.style.top=((1-p.y)/2*H()+8)+'px';}}
addEventListener('resize',()=>{renderer.setSize(W(),H());frame();});
frame();

let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;
 if(state.spin)for(const v of VEH)v.turn.rotation.y+=dt*.28;
 for(const v of VEH)for(const w of v.parts.wheels)w.spin.rotation.x=0;
 labels();renderer.render(scene,camera);requestAnimationFrame(loop);}
requestAnimationFrame(loop);

window.garage={ready:true,
 view(mode='todos',angle='iso'){state.mode=mode;state.angle=angle;frame();},
 spin(on,rot){state.spin=!!on;if(rot!=null)for(const v of VEH)v.turn.rotation.y=rot;},
 stats(){return VEH.map(v=>({id:v.id,triangles:v.tris,length:v.parts.length,width:v.parts.width,eye:v.parts.eye,leds:v.parts.leds.length,screen:!!v.parts.screen,mirror:!!v.parts.mirrorMat,wheels:v.parts.wheels.length}));},
 parts:id=>VEH.find(v=>v.id===id).parts};
