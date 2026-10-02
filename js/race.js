// Race: start lights, lap and sector timing, end of lap and the lap ranking.

import {$,fmt,rr} from './util.js';
import {HW,N,cpIdx} from './track.js';
import {lampMats} from './world.js';
import {car} from './car.js';
import {opt} from './main.js';

// ---------------------------------------------------------------- race state
const race={go:false,phase:'grid',t:0,lightsOn:0,outAt:0,delta:null,shiftCut:0,banner:0};
// lap timing
let prevI=0;
function syncPrevI(){prevI=car.i;}
// sectors as in the official timing: S1 Sainte Dévote → Casino, S2 Mirabeau → Tabac, S3 Piscine → line
let SECB=null;const SEC={t:[null,null,null],cls:['','',''],cur:0,start:0};
function fmtS(t){return t>=60?fmt(t):t.toFixed(3);}
function secBench(k){const all=LB.rows.filter(r=>Array.isArray(r.s)&&typeof r.s[k]==='number');const me=all.filter(r=>String(r.name).toUpperCase()===(player||'').toUpperCase());
 return{overall:all.length?Math.min(...all.map(r=>r.s[k])):null,personal:me.length?Math.min(...me.map(r=>r.s[k])):null};}
function secClass(k,v){const b=secBench(k);const ms=Math.round(v*1000);if(b.overall==null||ms<=b.overall)return'purple';if(b.personal==null||ms<b.personal)return'green';return'yellow';}
function closeSector(k,v){SEC.t[k]=v;SEC.cls[k]=secClass(k,v);const b=secBench(k);const ref=b.personal!=null?b.personal:b.overall;
 $('spN').textContent='S'+(k+1);$('spT').textContent=fmtS(v);$('spD').textContent=ref==null?'':((v*1000-ref)>0?'+':'−')+(Math.abs(v*1000-ref)/1000).toFixed(3);
 $('split').className='hud '+SEC.cls[k];$('split').style.opacity=1;clearTimeout(SEC.h);SEC.h=setTimeout(()=>{$('split').style.opacity=0;},3500);renderSecs();}
function resetSectors(){SEC.t=[null,null,null];SEC.cls=['','',''];SEC.cur=0;SEC.start=0;renderSecs();}
function renderSecInto(el,live){el.textContent='';for(let k=0;k<3;k++){const d=document.createElement('div');d.className='sec '+(SEC.cls[k]||(live&&k===SEC.cur&&race.go&&!race.finished?'live':''));
  const lab=document.createElement('div');lab.className='lab';lab.textContent='S'+(k+1);const bar=document.createElement('div');bar.className='bar';const tm=document.createElement('div');tm.className='tm';
  tm.textContent=SEC.t[k]!=null?fmtS(SEC.t[k]):(live&&k===SEC.cur&&race.go&&!race.finished?fmtS(Math.max(0,car.lapT-SEC.start)):'—');d.append(lab,bar,tm);el.appendChild(d);}}
function renderSecs(){renderSecInto($('secHud'),true);}
function timing(dt){if(!race.go||race.finished)return;car.lapT+=dt;car.trace.push([car.i,car.lapT]);
 // track limits: all four wheels beyond the edge of the track (kerbs count as track) cancel the lap
 if(!car.invalid&&Math.abs(car.d)>HW+.2+1.0){car.invalid=true;showBanner('Límites de pista','Vuelta anulada');}
 if(car.i>N*.4&&car.i<N*.6)car.armed=true;
 if(!SECB)SECB=[cpIdx(3),cpIdx(66)];
 if(SEC.cur<2){const b=SECB[SEC.cur];if(prevI<b&&car.i>=b&&car.i-prevI<40){const v=car.lapT-SEC.start;SEC.start=car.lapT;closeSector(SEC.cur,v);SEC.cur++;}}
 if(prevI>N-60&&car.i<60&&car.armed){const t=car.lapT;car.last=t;const newBest=!car.invalid&&(car.best==null||t<car.best);if(newBest){car.best=t;car.refLap=car.trace.slice();}car.armed=false;if(SEC.cur===2){closeSector(2,t-SEC.start);SEC.cur=3;}finishRace(t);}
 prevI=car.i;
 if(car.refLap&&car.refLap.length){let lo=0,hi=car.refLap.length-1;while(lo<hi){const m=(lo+hi)>>1;if(car.refLap[m][0]<car.i)lo=m+1;else hi=m;}race.delta=car.lapT-car.refLap[lo][1];}else race.delta=null;}
function showBanner(a,b,purple){$('b1').textContent=a;$('b2').textContent=b;$('b2').className='t2'+(purple?' purple':'');$('banner').style.opacity=1;race.banner=3.2;}

// start sequence
function startSequence(){race.phase='lights';race.t=0;race.lightsOn=0;race.outAt=5+rr(.4,2.2);$('lights').hidden=false;}
function updateStart(dt){if(race.phase!=='lights')return;race.t+=dt;const n=Math.min(5,Math.floor(race.t));const on=race.t<race.outAt?n:0;
 if(on!==race.lightsOn){race.lightsOn=on;lampMats.forEach((m,k)=>m.color.setHex(k<on?0xff1a1a:0x220608));document.querySelectorAll('#lights .pod').forEach((p,k)=>p.classList.toggle('on',k<on));}
 if(race.t>=race.outAt){race.phase='race';race.go=true;showBanner('','¡Vamos!');setTimeout(()=>{$('lights').hidden=true;},900);}}
// ---------------------------------------------------------------- player and lap ranking (this browser only)
let player='';const LB={rows:[]};
function setPlayer(n){player=n;}
function cleanName(v){return String(v||'').replace(/[^\p{L}\p{N} ._-]/gu,'').trim().slice(0,16);}
// Storage of the laps. Everything else goes through these two, so a shared ranking only has to replace them:
// loadLaps() resolves to every saved lap; saveLap(row) stores one ({name, ms, s:[ms,ms,ms], assist, at}).
async function loadLaps(){try{const v=JSON.parse(localStorage.getItem('mc_laps')||'[]');return Array.isArray(v)?v:[];}catch(e){return[];}}
async function saveLap(row){const r=await loadLaps();r.push(row);r.sort((a,b)=>a.ms-b.ms);try{localStorage.setItem('mc_laps',JSON.stringify(r.slice(0,200)));}catch(e){}}
const sameName=(r,name)=>String(r.name).toUpperCase()===String(name||'').toUpperCase();
function bestPerName(rows){const m=new Map();for(const r of rows){if(typeof r.ms!=='number'||!r.name)continue;const k=String(r.name).toUpperCase();const o=m.get(k);if(!o||r.ms<o.ms)m.set(k,r);}return[...m.values()].sort((a,b)=>a.ms-b.ms);}
// laps of one name, fastest first, each with its lap number (order in which they were driven)
function lapsOf(rows,name){const mine=rows.filter(r=>typeof r.ms==='number'&&r.name&&sameName(r,name));
 const no=new Map(mine.slice().sort((a,b)=>String(a.at).localeCompare(String(b.at))).map((r,k)=>[r,k+1]));
 return mine.sort((a,b)=>a.ms-b.ms).map(r=>({r,no:no.get(r)}));}
function shortDate(iso){const d=new Date(iso);return isNaN(d)?'':d.toLocaleDateString('es',{day:'2-digit',month:'2-digit',year:'2-digit'});}
function renderRank(el,name){const laps=name?lapsOf(LB.rows,name):[];el.textContent='';if(!laps.length){const tr=document.createElement('tr');const td=document.createElement('td');td.className='empty';td.colSpan=4;td.textContent='Todavía no tenés vueltas con este nombre.';tr.appendChild(td);el.appendChild(tr);return;}
 laps.slice(0,10).forEach(({r,no},k)=>{const tr=document.createElement('tr');if(k===0)tr.className='top';
  for(const [c,v] of[['p','V'+no],['n',shortDate(r.at)],['a',r.assist?'A':''],['t',fmt(r.ms/1000)]]){const td=document.createElement('td');td.className=c;td.textContent=v;if(c==='p')td.title='Vuelta '+no;if(c==='a'&&r.assist)td.title='con ayudas de manejo';tr.appendChild(td);}el.appendChild(tr);});}
function renderBoards(){renderRank($('rankMenu'),cleanName($('pname').value));renderRank($('rankFinish'),player);}
async function initBoard(){LB.rows=await loadLaps();renderBoards();}
async function finishRace(t){race.finished=true;const ms=Math.round(t*1000);
 if(car.invalid){renderSecInto($('secFin'),false);$('fWho').textContent=(player||'Piloto')+' · vuelta anulada';$('fTime').textContent=fmt(t);$('fTime').style.color='var(--muted)';
  $('fPos').textContent='Saliste de los límites de pista con las cuatro ruedas, así que la vuelta no vale.';$('saveNote').textContent='El tiempo no se guarda.';renderBoards();setTimeout(()=>{$('finish').hidden=false;$('fAgain').focus();},1200);return;}const row={name:player||'PILOTO',ms,assist:!!(opt.brake||opt.steer),at:new Date().toISOString()};if(SEC.t.every(v=>v!=null))row.s=SEC.t.map(v=>Math.round(v*1000));renderSecInto($('secFin'),false);
 const prev=bestPerName(LB.rows).find(r=>sameName(r,row.name));const overPrev=bestPerName(LB.rows)[0];
 $('fWho').textContent=(player||'Piloto')+' · bandera a cuadros';$('fTime').textContent=fmt(t);$('fTime').style.color=(!overPrev||ms<=overPrev.ms)?'var(--sec-purple)':(!prev||ms<prev.ms)?'var(--sec-green)':'var(--sec-yellow)';$('saveNote').textContent='';
 let note='Tiempo guardado en este dispositivo.';
 try{await saveLap(row);LB.rows=await loadLaps();}catch(e){note='No se pudo guardar el tiempo.';LB.rows=LB.rows.concat([row]);}
 const mine=lapsOf(LB.rows,row.name);const pos=mine.findIndex(x=>x.r.at===row.at&&x.r.ms===row.ms);
 $('fPos').textContent=(prev&&prev.ms<=ms?'Tu mejor marca sigue siendo '+fmt(prev.ms/1000)+'. ':'¡Nueva mejor marca personal! ')+(pos>=0?'Posición '+(pos+1)+' de '+mine.length+' entre tus vueltas.':'');
 $('saveNote').textContent=note;renderBoards();setTimeout(()=>{$('finish').hidden=false;$('fAgain').focus();},1200);}

export {SEC,cleanName,initBoard,race,renderRank,renderSecs,resetSectors,setPlayer,showBanner,startSequence,syncPrevI,timing,updateStart};
