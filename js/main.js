// Entry point: renderer, sky and lights, cameras, HUD, menu, controls, graphics quality and the main loop.

import {$,CHUNKS,IS_MOBILE,TAU,canvas,clamp,fmt,lerp,scene} from './util.js';
import {CORNERS,CPI,DS,N,PSI,SX,SY,SZ,TUN,TXa,TZa,mod,runs} from './track.js';
import {setMaxAnisotropy} from './textures.js';
import {buildWorld,heightAt,lampMats,world} from './world.js';
import {CARP,buildCar,car,carObj,drawScreen,mirrorCam,mirrorRT} from './car.js';
import {kerbV,physics,placeCar,resetCar,scrapeV} from './physics.js';
import {cleanName,initBoard,race,renderRank,renderSecs,resetSectors,setPlayer,showBanner,startSequence,syncPrevI,timing,updateStart} from './race.js';
import {A,applySound,initAudio,updateAudio} from './audio.js';

// ---------------------------------------------------------------- renderer / scene
const app=$('app');
let SAVED_Q=null;try{const v=localStorage.getItem('mc_quality');if(v!==null&&/^[012]$/.test(v))SAVED_Q=+v;}catch(e){}
const renderer=new THREE.WebGLRenderer({antialias:!IS_MOBILE,logarithmicDepthBuffer:!IS_MOBILE,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=0.95;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());
const HORIZON=0xbcd3e6;
scene.fog=new THREE.Fog(0xc6d0d6,160,2300);
const camera=new THREE.PerspectiveCamera(68,1,IS_MOBILE?.1:.06,3000);

const sunDir=new THREE.Vector3(0.55,0.62,0.56).normalize();
const skyMat=new THREE.ShaderMaterial({uniforms:{sunDir:{value:sunDir}},vertexShader:'varying vec3 vW;void main(){vW=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=p.xyww;}',
 fragmentShader:'uniform vec3 sunDir;varying vec3 vW;void main(){vec3 d=normalize(vW);float h=d.y;vec3 top=vec3(0.36,0.55,0.79);vec3 hor=vec3(0.776,0.816,0.839);vec3 col=mix(hor,top,pow(clamp(h,0.0,1.0),0.6));if(h<0.0)col=hor;if(h>0.02){vec2 q=d.xz/(h+0.12)*1.6;float n=0.0,a=0.5;for(int i=0;i<'+(IS_MOBILE?2:5)+';i++){n+=a*(0.5+0.5*sin(q.x*1.7+sin(q.y*1.3))*sin(q.y*1.9+sin(q.x*1.1)));q=q*2.03+vec2(1.7,9.2);a*=0.5;}float cl=smoothstep(0.42,0.75,n)*smoothstep(0.02,0.25,h)*0.55;col=mix(col,vec3(0.96,0.965,0.97),cl);}float s=max(dot(d,sunDir),0.0);col+=vec3(1.0,0.92,0.75)*(pow(s,900.0)*3.0+pow(s,12.0)*0.18);gl_FragColor=vec4(col,1.0);}',
 side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false});
const sky=new THREE.Mesh(new THREE.SphereGeometry(100,32,16),skyMat);sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
{const faces=[];for(let f=0;f<6;f++){const c=canvas(64,64),g=c.getContext('2d');if(f===2){g.fillStyle='#4f86cf';g.fillRect(0,0,64,64);}else if(f===3){g.fillStyle='#6d685f';g.fillRect(0,0,64,64);}else{const gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#5d8fd0');gr.addColorStop(.48,'#c4d8ea');gr.addColorStop(.52,'#9c9585');gr.addColorStop(1,'#6d685f');g.fillStyle=gr;g.fillRect(0,0,64,64);}faces.push(c);}
 const cube=new THREE.CubeTexture(faces);cube.encoding=THREE.sRGBEncoding;cube.needsUpdate=true;
 try{const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromCubemap(cube).texture;pm.dispose();}catch(e){scene.environment=null;}}

const hemi=new THREE.HemisphereLight(0xe2e9f0,0x9c907d,0.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffecd6,2.15);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:1,far:900});
sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.03;scene.add(sun);scene.add(sun.target);
const tunLight=new THREE.PointLight(0xdde88c,0,60,2);scene.add(tunLight);
scene.add(carObj);
// ---------------------------------------------------------------- options / input
const opt={autoRes:true,brake:true,steer:true,sound:true,start:true,cam:1,q:2};
const keys={};let touchSt={l:0,r:0,g:0,b:0};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat){keys[e.code]=true;return;}keys[e.code]=true;
 if(!started)return;if(e.code==='KeyC')cycleCam();if(e.code==='KeyR')resetCar();if(e.code==='KeyM'){opt.sound=!opt.sound;$('optSound').checked=opt.sound;applySound();}if(e.code==='KeyP'||e.code==='Escape')togglePause();if(e.code==='Backspace'){e.preventDefault();restartRace();}});
addEventListener('keyup',e=>{keys[e.code]=false;});
function readInput(){let thr=(keys.ArrowUp||keys.KeyW)?1:0,brk=(keys.ArrowDown||keys.KeyS||keys.Space)?1:0,st=((keys.ArrowRight||keys.KeyD)?1:0)-((keys.ArrowLeft||keys.KeyA)?1:0);
 thr=Math.max(thr,touchSt.g);brk=Math.max(brk,touchSt.b);st+=touchSt.r-touchSt.l;
 const pads=navigator.getGamepads?navigator.getGamepads():[];for(const p of pads){if(!p)continue;const ax=p.axes[0]||0;if(Math.abs(ax)>.12)st+=Math.sign(ax)*(Math.abs(ax)-.12)/.88;const rt=p.buttons[7]?p.buttons[7].value:0,lt=p.buttons[6]?p.buttons[6].value:0;thr=Math.max(thr,rt,p.buttons[0]&&p.buttons[0].pressed?1:0);brk=Math.max(brk,lt,p.buttons[1]&&p.buttons[1].pressed?1:0);}
 return{thr,brk,st:clamp(st,-1,1)};}
function bindTouch(id,k){const el=$(id);const on=e=>{e.preventDefault();touchSt[k]=1;el.classList.add('on');initAudio();};const off=e=>{e.preventDefault();touchSt[k]=0;el.classList.remove('on');};el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off);}
bindTouch('tL','l');bindTouch('tR','r');bindTouch('tG','g');bindTouch('tB','b');
$('tC').addEventListener('pointerdown',e=>{e.preventDefault();cycleCam();});$('bMenu').onclick=e=>{e.currentTarget.blur();togglePause();};$('bCam').onclick=e=>{e.currentTarget.blur();cycleCam();};$('bRestart').onclick=e=>{e.currentTarget.blur();restartRace();};$('restart').onclick=()=>restartRace();$('tP').addEventListener('pointerdown',e=>{e.preventDefault();togglePause();});
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
let started=false,paused=false;
let DRAW_DIST=2600;function cullChunks(){const cp=camera.position;for(const ch of CHUNKS){const d=Math.hypot(ch.c.x-cp.x,ch.c.z-cp.z)-ch.r;ch.m.visible=d<DRAW_DIST;}}
// ---------------------------------------------------------------- camera
const eye=new THREE.Vector3();const camQ=new THREE.Quaternion();const chasePos=new THREE.Vector3();let chaseInit=false;
function cycleCam(){opt.cam=(opt.cam+1)%4;$('optCam').value=String(opt.cam);chaseInit=false;showCam();}
function updateCamera(dt,t){const sh=car.shake;car.shake*=Math.exp(-dt*6);
 const jitter=(Math.sin(t*61)*.5+Math.sin(t*37.3)*.5)*sh*.012+Math.sin(t*23)*Math.min(1,car.v/86)*.0012;
 CARP.helmet.visible=opt.cam!==0;for(const w of CARP.wheels)if(w.front)w.grp.visible=opt.cam!==0;
 if(opt.cam===3){const fwd=new THREE.Vector3(-Math.sin(car.yaw),0,-Math.cos(car.yaw));const want=new THREE.Vector3(car.x,car.y,car.z).addScaledVector(fwd,-7.8).add(new THREE.Vector3(0,2.5,0));
  if(!chaseInit){chasePos.copy(want);chaseInit=true;}chasePos.lerp(want,Math.min(1,dt*6));const gy=heightAt(chasePos.x,chasePos.z);if(chasePos.y<gy+1)chasePos.y=gy+1;camera.position.copy(chasePos);camera.lookAt(car.x-Math.sin(car.yaw)*4,car.y+1.0,car.z-Math.cos(car.yaw)*4);camera.fov=62;camera.updateProjectionMatrix();return;}
 const lean=clamp(-car.lat*.012,-.05,.05);
 if(opt.cam===0)eye.set(lean,0.79+jitter-Math.abs(car.lon)*.002,0.02+clamp(car.lon*.01,-.03,.03));else if(opt.cam===1)eye.set(lean*.3,1.25+jitter*1.4,0.36+clamp(car.lon*.006,-.02,.02));else eye.set(0,1.32+jitter,0.64);
 carObj.localToWorld(camera.position.copy(eye));
 camQ.setFromEuler(new THREE.Euler(opt.cam===0?-.24:opt.cam===1?-.155:-.075,0,clamp(car.lat*.01,-.04,.04)+jitter*.3,'YXZ'));camera.quaternion.copy(carObj.quaternion).multiply(camQ);
 const fov=(opt.cam===0?53:opt.cam===1?72:66)+Math.min(1,car.v/86)*6;if(Math.abs(camera.fov-fov)>.05){camera.fov=fov;camera.updateProjectionMatrix();}}

// ---------------------------------------------------------------- HUD
const mm=$('minimap'),mg=mm.getContext('2d');let mmBase=null,mmT=null;
function prepMinimap(){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(let i=0;i<N;i++){x0=Math.min(x0,SX[i]);x1=Math.max(x1,SX[i]);z0=Math.min(z0,SZ[i]);z1=Math.max(z1,SZ[i]);}
 const sc=300/Math.max(x1-x0,z1-z0);mmT=(x,z)=>[20+(x-x0)*sc+(300-(x1-x0)*sc)/2,20+(z-z0)*sc+(300-(z1-z0)*sc)/2];
 mmBase=canvas(340,340);const g=mmBase.getContext('2d');g.lineJoin='round';g.lineCap='round';
 const path=()=>{g.beginPath();for(let i=0;i<=N;i++){const p=mmT(SX[i%N],SZ[i%N]);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}};
 path();g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=14;g.stroke();path();g.strokeStyle='#e9ecef';g.lineWidth=7;g.stroke();
 const tr=runs(i=>TUN[i])[0];if(tr){g.beginPath();for(let k=0;k<=tr[1];k++){const p=mmT(SX[mod(tr[0]+k)],SZ[mod(tr[0]+k)]);k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.strokeStyle='#6c7580';g.lineWidth=7;g.stroke();}
 const s=mmT(SX[0],SZ[0]);g.save();g.translate(s[0],s[1]);g.rotate(Math.atan2(TZa[0],TXa[0]));g.fillStyle='#e2202c';g.fillRect(-2,-9,4,18);g.restore();}
function drawMinimap(){mg.clearRect(0,0,340,340);mg.drawImage(mmBase,0,0);const p=mmT(car.x,car.z);mg.beginPath();mg.arc(p[0],p[1],10,0,TAU);mg.fillStyle='#e2202c';mg.fill();mg.lineWidth=3;mg.strokeStyle='#fff';mg.stroke();}
const rpmEl=$('rpm');for(let k=0;k<15;k++)rpmEl.appendChild(document.createElement('i'));const rpmIs=[...rpmEl.children];
let hudT=0,lastCorner=-1,cornerT=0;
function hud(dt){hudT+=dt;
 if(race.banner>0){race.banner-=dt;if(race.banner<=0)$('banner').style.opacity=0;}
 const lit=Math.round(clamp((car.rpm-7000)/5300,0,1)*15);for(let k=0;k<15;k++){const cls=k<lit?(k<5?'g':k<10?'r':'b'):'';if(rpmIs[k].className!==cls)rpmIs[k].className=cls;const col=k<lit?(k<5?0x22ee66:k<10?0xff2222:0x3a8cff):0x151515;if(CARP.leds[k].color.getHex()!==col)CARP.leds[k].color.setHex(col);}
 $('thrBar').style.transform=`scaleX(${lastInp.thr*(race.autoBrake?1-race.autoBrake:1)})`;$('brkBar').style.transform=`scaleX(${Math.max(lastInp.brk,race.autoBrake||0)})`;
 if(hudT<.07)return;hudT=0;if(race.go&&!race.finished)renderSecs();
 $('speed').firstChild.nodeValue=String(Math.round(Math.abs(car.v)*3.6));$('gear').textContent=car.v<-.1?'R':(!race.go&&car.v<.5?'N':String(car.gear));
 $('lapNo').textContent=car.lap;$('lapTime').textContent=fmt(car.lapT);$('lapTime').classList.toggle('invalid',!!car.invalid);$('lastLap').textContent=fmt(car.last);$('bestLap').textContent=fmt(car.best);
 const de=$('delta');if(race.delta==null){de.textContent='—';de.className='v';}else{de.textContent=(race.delta>0?'+':'')+race.delta.toFixed(2);de.className='v '+(race.delta<=0?'good':'bad');}
 let ci;
 {let best=-1,bv=-1;for(let k=0;k<CORNERS.length;k++){const si=CPI[k];if(si<=car.i&&si>bv){bv=si;best=k;}}if(best<0){let mx=-1;for(let k=0;k<CORNERS.length;k++){const si=CPI[k];if(si>mx){mx=si;best=k;}}}ci=best;}
 if(ci!==lastCorner){lastCorner=ci;$('cornerName').textContent=CORNERS[ci][1];$('cornerNo').textContent=CORNERS[ci][2];
  // the corner sign shows for a moment on each new corner, then fades out
  $('corner').style.opacity=1;clearTimeout(cornerT);cornerT=setTimeout(()=>{$('corner').style.opacity=0;},2500);}
 $('wrongway').hidden=!(car.wrong>1);
 drawMinimap();drawScreen();}

// ---------------------------------------------------------------- quality & resize
const PRESET=[{name:'Baja',dpr:1,shadow:0,mirror:0,fogN:90,fogF:620,far:780,dist:700},{name:'Media',dpr:1.25,shadow:1024,mirror:3,fogN:140,fogF:1300,far:1500,dist:1400},{name:'Alta',dpr:2,shadow:2048,mirror:2,fogN:160,fogF:2300,far:3000,dist:2600}];
let renderScale=1;
function applyPixelRatio(){const P=PRESET[opt.q];const dpr=window.devicePixelRatio||1;renderer.setPixelRatio(Math.max(.4,Math.min(dpr,P.dpr)*renderScale));}
function applyQuality(){const q=opt.q,P=PRESET[q];renderScale=1;applyPixelRatio();renderer.shadowMap.enabled=P.shadow>0;sun.castShadow=P.shadow>0;
 if(P.shadow&&sun.shadow.mapSize.x!==P.shadow){sun.shadow.mapSize.set(P.shadow,P.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
 scene.fog.near=P.fogN;scene.fog.far=P.fogF;camera.far=P.far;DRAW_DIST=P.dist;camera.updateProjectionMatrix();cullChunks();
 scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});if(CARP.mirrorMat){CARP.mirrorMat.map=P.mirror?mirrorRT.texture:null;CARP.mirrorMat.color.setHex(P.mirror?0x9aa0a8:0x4a525c);CARP.mirrorMat.needsUpdate=true;}
 try{localStorage.setItem('mc_quality',String(q));}catch(e){}resize();}
// automatic resolution: keeps the frame rate up by rendering fewer pixels when the device struggles
const perf={frames:0,acc:0,fps:60};
function autoResolution(dt){perf.frames++;perf.acc+=dt;if(perf.acc<1)return;perf.fps=perf.frames/perf.acc;perf.frames=0;perf.acc=0;
 if(!opt.autoRes||!started||paused)return;let ns=renderScale;if(perf.fps<42)ns=Math.max(.5,renderScale*.85);else if(perf.fps>56)ns=Math.min(1,renderScale*1.07);if(Math.abs(ns-renderScale)>.01){renderScale=ns;applyPixelRatio();}}
function placeTools(){const r=$('timing').getBoundingClientRect();$('tools').style.top=Math.round(r.bottom+8)+'px';}
function resize(){placeTools();const w=innerWidth,h=innerHeight;renderer.setSize(w,h);applyPixelRatio();camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);

// ---------------------------------------------------------------- main loop
let tunF=0,exposure=1;
let lastT=performance.now(),lastInp={thr:0,brk:0,st:0};const clockStart=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-lastT)/1000);lastT=now;const t=(now-clockStart)/1000;
 const inp=started&&!paused?readInput():{thr:0,brk:0,st:0};lastInp=inp;
 if(started&&!paused){updateStart(dt);const n=2;for(let k=0;k<n;k++)physics(dt/n,inp);timing(dt);}
 // car transform
 const i=car.i,i2=mod(i+2),i0=mod(i-2);const grade=(SY[i2]-SY[i0])/(4*DS);const rel=car.yaw-PSI[i];
 car.pitch=lerp(car.pitch,Math.atan(grade)*Math.cos(rel)-car.lon*.006,.2);car.roll=lerp(car.roll,-car.lat*.004,.2);
 carObj.position.set(car.x,car.y+.005,car.z);carObj.rotation.set(car.pitch,car.yaw,car.roll,'YXZ');
 for(const w of CARP.wheels){w.spin.rotation.x=-car.wheelSpin;if(w.front)w.grp.rotation.y=-car.steer*.35;}
 CARP.sw.rotation.z=-car.steer*1.5;
 carObj.updateMatrixWorld(true);
 // tunnel lighting + eye adaptation
 const inT=TUN[car.i]?1:0;tunF=lerp(tunF,inT,Math.min(1,dt*(inT?3:2.2)));
 hemi.intensity=lerp(.9,.38,tunF);
 tunLight.intensity=tunF*3.2;tunLight.position.set(car.x-Math.sin(car.yaw)*9,car.y+5.5,car.z-Math.cos(car.yaw)*9);
 const targetExp=inT?1.9:.9;exposure=lerp(exposure,targetExp,Math.min(1,dt*(targetExp>exposure?.9:1.1)));renderer.toneMappingExposure=exposure;
 // sun follows the car (snapped to texels)
 const snap=190/sun.shadow.mapSize.x;const cx=Math.round(car.x/snap)*snap,cz=Math.round(car.z/snap)*snap;sun.target.position.set(cx,car.y,cz);sun.position.set(cx+sunDir.x*400,car.y+sunDir.y*400,cz+sunDir.z*400);sun.target.updateMatrixWorld();
 updateCamera(dt,t);sky.position.copy(camera.position);
 if(world.waterTex){world.waterTex.offset.x=t*.004;world.waterTex.offset.y=t*.0025;}
 hud(dt);updateAudio(inp.thr*(race.go?1:.7),tunF,scrapeV,kerbV);
 if((cullN++&7)===0)cullChunks();autoResolution(dt);
 renderer.render(scene,camera);
 if(opt.cam<=1&&PRESET[opt.q].mirror&&(frameN++%PRESET[opt.q].mirror===0)){carObj.visible=false;carObj.localToWorld(mirrorCam.position.set(0,.9,.3));mirrorCam.quaternion.copy(carObj.quaternion).multiply(Q_BACK);sky.position.copy(mirrorCam.position);renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(mirrorRT);renderer.render(scene,mirrorCam);renderer.setRenderTarget(null);renderer.shadowMap.autoUpdate=true;carObj.visible=true;}}
let frameN=0;let cullN=0;const Q_BACK=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.02,Math.PI,0,'YXZ'));

const CAMNAMES=['Cockpit','Onboard TV','T-cam','Exterior'];function showCam(){$('camName').textContent=CAMNAMES[opt.cam];}
function restartRace(){race.finished=false;$('finish').hidden=true;placeCar(mod(-8),-2.3);Object.assign(car,{lap:1,lapT:0,armed:false,invalid:false,trace:[],gear:1,rpm:4200,rev:0,wrong:0,shake:0,lat:0,lon:0});syncPrevI();resetSectors();race.go=false;race.delta=null;race.phase='grid';lampMats.forEach(m=>m.color.setHex(0x220608));document.querySelectorAll('#lights .pod').forEach(p=>p.classList.remove('on'));$('lights').hidden=true;chaseInit=false;if(paused)togglePause();if(opt.start)startSequence();else{race.phase='race';race.go=true;}showBanner('','Vuelta nueva');}
function togglePause(){if(!started)return;paused=!paused;if(paused){const pi=$('perfInfo');pi.hidden=false;pi.textContent='Rendimiento: '+Math.round(perf.fps)+' cuadros por segundo · resolución '+Math.round(renderScale*100)+' % · calidad '+PRESET[opt.q].name;}$('menu').hidden=!paused;$('tools').hidden=paused;$('restart').hidden=!paused;$('go').textContent=paused?'Continuar':'Salir a pista';if(A.ctx){if(paused)A.ctx.suspend();else if(opt.sound)A.ctx.resume();}}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused)togglePause();});

// menu wiring
function syncOpts(){opt.brake=$('optBrake').checked;opt.steer=$('optSteer').checked;opt.start=$('optStart').checked;opt.sound=$('optSound').checked;opt.autoRes=$('optAuto').checked;opt.cam=+$('optCam').value;}
$('optBrake').onchange=e=>opt.brake=e.target.checked;$('optSteer').onchange=e=>opt.steer=e.target.checked;$('optStart').onchange=e=>opt.start=e.target.checked;
$('optAuto').onchange=e=>{opt.autoRes=e.target.checked;if(!opt.autoRes){renderScale=1;applyPixelRatio();}};$('optSound').onchange=e=>{opt.sound=e.target.checked;applySound();};$('optCam').onchange=e=>{opt.cam=+e.target.value;chaseInit=false;showCam();};$('optQ').onchange=e=>{opt.q=+e.target.value;applyQuality();};
$('fAgain').onclick=()=>{restartRace();};
$('fMenu').onclick=()=>{$('finish').hidden=true;restartRace();if(!paused)togglePause();};
$('pname').addEventListener('input',()=>renderRank($('rankMenu'),cleanName($('pname').value)));
$('pname').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('go').disabled)$('go').click();e.stopPropagation();});
try{const n=localStorage.getItem('mc_name');if(n)$('pname').value=n;}catch(e){}
initBoard();resetSectors();
$('go').onclick=()=>{syncOpts();const nm=cleanName($('pname').value);if(!nm){$('pname').focus();$('pname').placeholder='Escribí tu nombre';return;}setPlayer(nm);try{localStorage.setItem('mc_name',nm);}catch(e){}if(opt.sound)initAudio();applySound();if(!started){started=true;$('menu').hidden=true;if(isTouch)document.documentElement.classList.add('touch');$('tools').hidden=false;placeTools();showCam();if(isTouch)$('touch').hidden=false;if(opt.start)startSequence();else{race.phase='race';race.go=true;}}else togglePause();};

// ---------------------------------------------------------------- boot
opt.q=SAVED_Q!=null?SAVED_Q:(IS_MOBILE?0:(innerWidth<760?1:2));$('optQ').value=String(opt.q);
resize();
setTimeout(()=>{try{buildWorld();buildCar();prepMinimap();placeCar(mod(-8),-2.3);syncPrevI();applyQuality();$('loading').textContent='';$('go').disabled=false;$('go').focus();requestAnimationFrame(frame);}
 catch(err){$('loading').textContent='No se pudo construir la escena 3D: '+err.message;console.error(err);}},30);

export {opt,paused};
