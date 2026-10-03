// The car: driving state, the chosen vehicle model (js/vehicles/*.js) with its mirrors, steering wheel and live display.

import {fmt} from './util.js';
import {mod} from './track.js';
import {build as buildFormula} from './vehicles/formula.js';
import {build as buildTractor} from './vehicles/tractor.js';
import {build as buildNight} from './vehicles/nightcar.js';
import {race} from './race.js';
import {opt} from './main.js';

// ---------------------------------------------------------------- the car
const car={i:mod(-8),x:0,z:0,y:0,d:-2.3,yaw:0,v:0,steer:0,gear:1,rpm:4200,pitch:0,roll:0,lat:0,lon:0,shake:0,wheelSpin:0,armed:false,lap:1,lapT:0,best:null,last:null,refLap:null,trace:[],rev:0,wrong:0};
const carObj=new THREE.Group();
const CARP={};
const mirrorRT=new THREE.WebGLRenderTarget(512,160);const mirrorCam=new THREE.PerspectiveCamera(24,512/160,0.3,1800);
// vehicles: each module fills the group and returns its parts (wheels, sw, helmet, leds, screen, mirrorMat, eye, length, width)
const VEHICLES={formula:buildFormula,tractor:buildTractor,nightcar:buildNight};
// frees the GPU resources of the current model (the mirror render target is shared and stays)
function clearCar(){const geos=new Set(),mats=new Set(),texs=new Set();
 carObj.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const m of[].concat(o.material)){mats.add(m);for(const k in m){const v=m[k];if(v&&v.isTexture&&v!==mirrorRT.texture)texs.add(v);}}});
 geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());texs.forEach(t=>t.dispose());
 while(carObj.children.length)carObj.remove(carObj.children[0]);
 for(const k of Object.keys(CARP))delete CARP[k];}
// builds vehicle 'formula' | 'tractor' | 'nightcar' inside carObj and copies its parts to CARP; returns the id used
function buildCar(tipo){const id=VEHICLES[tipo]?tipo:'formula';clearCar();
 Object.assign(CARP,VEHICLES[id](carObj));CARP.id=id;
 if(!CARP.sw)CARP.sw=new THREE.Group();if(!CARP.helmet)CARP.helmet=new THREE.Group();if(!CARP.leds)CARP.leds=[];if(!CARP.wheels)CARP.wheels=[];
 // the formula's mirrors show the live rear view (main.js switches it off in low quality)
 if(CARP.mirrorMat){CARP.mirrorMat.map=mirrorRT.texture;CARP.mirrorMat.color.setHex(0x9aa0a8);CARP.mirrorMat.needsUpdate=true;}
 // size for the outside cameras
 {const p=carObj.position.clone(),q=carObj.quaternion.clone();carObj.position.set(0,0,0);carObj.quaternion.identity();carObj.updateMatrixWorld(true);
  CARP.height=new THREE.Box3().setFromObject(carObj).max.y;carObj.position.copy(p);carObj.quaternion.copy(q);carObj.updateMatrixWorld(true);}
 carObj.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 return id;}

function drawScreen(){const c=CARP.screen;if(!c||!CARP.screenTex)return;const g=c.getContext('2d');g.fillStyle='#030405';g.fillRect(0,0,256,128);
 const box=(x,y,w,h)=>{g.fillStyle='#14181c';g.fillRect(x,y,w,h);g.strokeStyle='#5b636b';g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2);};
 box(6,8,82,52);box(168,8,82,52);
 g.fillStyle='#fff';g.textBaseline='middle';g.textAlign='left';g.font='700 22px "Arial Narrow",Arial,sans-serif';g.fillText(Math.round(Math.abs(car.v)*3.6)+' KM/H',12,24);
 g.font='600 15px Arial';g.fillText('L'+car.lap,12,46);g.textAlign='right';g.fillText(race.go?'P1':'--',82,46);
 g.textAlign='right';g.font='700 20px "Arial Narrow",Arial,sans-serif';g.fillText(fmt(car.lapT),244,24);g.font='600 13px Arial';g.fillText('100°C 100°C',244,46);
 g.textAlign='center';g.font='800 72px "Arial Narrow",Arial,sans-serif';g.fillText(car.v<-.1?'R':(car.v<.5&&!race.go?'N':String(car.gear)),128,40);
 const dl=race.delta;g.font='700 15px Arial';g.fillStyle=dl==null?'#777':dl<=0?'#35d07f':'#ff4d4d';g.fillText(dl==null?'-.---':(dl>0?'+':'')+dl.toFixed(3),128,82);
 g.fillStyle='#fff';g.font='700 13px Arial';g.fillText('OVERTAKE',128,98);
 g.fillStyle='#f2c400';g.fillRect(24,108,200*Math.min(1,car.rpm/12500),4);g.fillStyle='#2f343a';g.fillRect(24,116,200,4);g.fillStyle='#d8d8d8';g.fillRect(24,116,200*(opt.brake?1:.5),4);
 g.textAlign='left';g.fillStyle='#fff';g.font='700 11px Arial';g.fillText('D',10,118);g.textAlign='right';g.fillText('H',248,118);
 CARP.screenTex.needsUpdate=true;}

export {CARP,VEHICLES,buildCar,car,carObj,drawScreen,mirrorCam,mirrorRT};
