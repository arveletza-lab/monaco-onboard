// Driving model: steering, throttle and brakes, braking/steering aids, walls, kerbs and the gearbox.

import {clamp,lerp,wrapA} from './util.js';
import {ALLOW,DS,ESC_W,EXA,HW,K,PSI,RXa,RZa,SX,SY,SZ,TXa,TZa,escAt,mod} from './track.js';
import {car} from './car.js';
import {race} from './race.js';
import {opt} from './main.js';

function placeCar(i,d){car.i=i;car.d=d;car.x=SX[i]+RXa[i]*d;car.z=SZ[i]+RZa[i]*d;car.y=SY[i];car.yaw=PSI[i];car.v=0;car.steer=0;car.esc=false;}
function resetCar(){const i=car.i;placeCar(i,clamp(car.d,-HW+1.5,HW-1.5));}
function project(){let best=1e18,bi=car.i;for(let k=-20;k<=30;k++){const i=mod(car.i+k);const dx=car.x-SX[i],dz=car.z-SZ[i];const d2=dx*dx+dz*dz;if(d2<best){best=d2;bi=i;}}
 car.i=bi;const dx=car.x-SX[bi],dz=car.z-SZ[bi];const f=dx*TXa[bi]+dz*TZa[bi];car.d=dx*RXa[bi]+dz*RZa[bi];const j=f>=0?mod(bi+1):mod(bi-1);car.y=lerp(SY[bi],SY[j],clamp(Math.abs(f)/DS,0,1));car.f=f;}
const GEARS=[0,23,32,41,50,59,68,77,88];
let scrapeV=0,kerbV=0;
function physics(dt,inp){
 let thr=inp.thr,brk=inp.brk;
 const target=inp.st;const rate=Math.abs(target)>Math.abs(car.steer)||Math.sign(target)!==Math.sign(car.steer)?5.5:8;car.steer+=clamp(target-car.steer,-rate*dt,rate*dt);
 if(race.finished){thr=0;brk=Math.max(brk,.55);}
 if(!race.go){car.rpm=lerp(car.rpm,4200+thr*8000,Math.min(1,dt*6));car.lon=0;car.lat=0;return;}
 // assisted braking: stays under the safe cornering speed ahead
 let auto=0;if(opt.brake&&car.v>4&&!car.esc){const lim=ALLOW[mod(car.i+3)];if(car.v>lim+.6){auto=clamp((car.v-lim)/5,0,1);brk=Math.max(brk,auto);thr=Math.min(thr,1-auto);}}
 race.autoBrake=auto;
 let a=0;const VMAX=86;
 if(car.v>=0){if(thr>0)a+=thr*14.5*(1-Math.pow(clamp(car.v/VMAX,0,1),2.3));if(brk>0&&car.v>0.2)a-=brk*(24+car.v*.25);a-=.00042*car.v*car.v+.5;}
 // reverse when stopped and brake held
 if(car.v<=.3&&brk>.5&&thr===0){car.rev+=dt;if(car.rev>.45){car.v=Math.max(-6,car.v-5*dt);}}else{car.rev=0;if(car.v<0){car.v=Math.min(0,car.v+(thr>0?9:4)*dt);}}
 if(car.v>=0)car.v=Math.max(0,car.v+a*dt);
 car.lon=lerp(car.lon,a/9.81,Math.min(1,dt*5));
 const L=3.6,AMX=32,vv=Math.max(Math.abs(car.v),1);const rMin=Math.max(L/Math.tan(.42),vv*vv/AMX);const dMax=Math.atan(L/rMin);
 const yawRate=car.v*Math.tan(car.steer*dMax)/L;car.yaw-=yawRate*dt;
 car.lat=lerp(car.lat,car.v*yawRate/9.81,Math.min(1,dt*6));
 if(opt.steer&&car.v>3&&Math.abs(car.d)<HW){const diff=wrapA(PSI[car.i]-car.yaw);if(Math.abs(diff)<1.3)car.yaw+=diff*Math.min(1,dt*1.5)*(1-Math.abs(car.steer)*.85);}
 car.x+=-Math.sin(car.yaw)*car.v*dt;car.z+=-Math.cos(car.yaw)*car.v*dt;
 project();
 // walls (beyond the track edge, the Nouvelle Chicane escape road is open too)
 scrapeV*=Math.exp(-dt*8);const lim=HW-1.0+(car.d<0?EXA[0][car.i]:EXA[1][car.i]);
 const esc=escAt(car.x,car.z),eLim=ESC_W/2-1.0;
 if(Math.abs(car.d)>lim&&esc.d>eLim&&car.esc){const nx=(car.x-esc.x)/esc.d,nz=(car.z-esc.z)/esc.d;car.x=esc.x+nx*eLim;car.z=esc.z+nz*eLim;
  const head=Math.atan2(-esc.dx,-esc.dz),rel=wrapA(car.yaw-head);
  if((-Math.sin(car.yaw)*nx-Math.cos(car.yaw)*nz)*car.v>0){const imp=Math.abs(Math.sin(rel));car.v*=Math.max(.3,1-imp*1.2)*(1-dt*.8);if(Math.abs(rel)<Math.PI/2)car.yaw=head+rel*.3;car.shake=Math.max(car.shake,imp*1.5+.15);scrapeV=Math.min(1,.3+imp*2)*clamp(Math.abs(car.v)/20,0,1);}
  project();}
 else if(Math.abs(car.d)>lim&&esc.d>eLim){const side=Math.sign(car.d),push=Math.abs(car.d)-lim;car.x-=RXa[car.i]*side*push;car.z-=RZa[car.i]*side*push;car.d=side*lim;
  const rel=wrapA(car.yaw-PSI[car.i]);const latV=-car.v*Math.sin(rel);
  if(latV*side>0){const imp=Math.abs(Math.sin(rel));car.v*=Math.max(.3,1-imp*1.2)*(1-dt*.8);if(Math.abs(rel)<Math.PI/2)car.yaw=PSI[car.i]+rel*.3;car.shake=Math.max(car.shake,imp*1.5+.15);scrapeV=Math.min(1,.3+imp*2)*clamp(Math.abs(car.v)/20,0,1);}}
 car.esc=Math.abs(car.d)>HW&&escAt(car.x,car.z).d<=eLim+.01;if(car.esc)car.y=escAt(car.x,car.z).y;
 // kerbs rumble
 kerbV=0;const kSide=K[car.i]>1/85?-1:K[car.i]<-1/85?1:0;if(kSide&&Math.abs(car.v)>5&&car.d*kSide+0.95>HW-1.2){kerbV=clamp(car.v/40,0,1);car.shake=Math.max(car.shake,.12*kerbV);}
 // gearbox
 const g=car.gear;if(car.v>GEARS[g]*.97&&g<8){car.gear++;race.shiftCut=.06;}else if(g>1&&car.v<GEARS[g-1]*.7)car.gear--;
 const ratio=clamp(Math.abs(car.v)/GEARS[car.gear],0,1.05);car.rpm=lerp(car.rpm,clamp(4200+ratio*(12500-4200)+(car.v<2?thr*3000:0),4000,12600),Math.min(1,dt*10));
 race.shiftCut-=dt;
 car.wheelSpin+=car.v*dt/.36;
 // wrong way
 const rel2=Math.cos(car.yaw-PSI[car.i]);car.wrong=(rel2<-.3&&car.v>4)?car.wrong+dt:0;}

export {kerbV,physics,placeCar,resetCar,scrapeV};
