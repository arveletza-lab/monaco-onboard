// Engine sound synthesised with Web Audio (no audio files), plus tunnel reverb, wind, scrape and kerb noise.

import {car} from './car.js';
import {race} from './race.js';
import {opt,paused} from './main.js';

// ---------------------------------------------------------------- audio
const A={};
function initAudio(){if(A.ctx||!opt.sound)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();A.ctx=ctx;
 const master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);A.master=master;
 const ws=ctx.createWaveShaper();const cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;cv[i]=Math.tanh(x*2.2);}ws.curve=cv;
 const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=3;A.lp=lp;const eg=ctx.createGain();eg.gain.value=0;A.eg=eg;
 A.osc=[['sawtooth',1,.5],['square',.5,.35],['sawtooth',2.01,.18],['triangle',3,.12]].map(([t,m,gv])=>{const o=ctx.createOscillator();o.type=t;const g=ctx.createGain();g.gain.value=gv;o.connect(g);g.connect(ws);o.start();return{o,m};});
 ws.connect(lp);lp.connect(eg);eg.connect(master);
 // tunnel reverb
 const conv=ctx.createConvolver();const len=ctx.sampleRate*1.6;const ir=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4);}conv.buffer=ir;const wet=ctx.createGain();wet.gain.value=0;eg.connect(conv);conv.connect(wet);wet.connect(master);A.wet=wet;
 // wind + scrape noise
 const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 const mk=(type,f,q)=>{const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;const fl=ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ctx.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(master);s.start();return{g,fl};};
 A.wind=mk('bandpass',700,.6);A.scrape=mk('highpass',1800,.7);A.rumble=mk('lowpass',140,1);}
function applySound(){if(!A.ctx){if(opt.sound)initAudio();return;}A.master.gain.setTargetAtTime(opt.sound?.55:0,A.ctx.currentTime,.05);if(opt.sound&&A.ctx.state==='suspended')A.ctx.resume();}
function updateAudio(thr,tun,scr,kerb){if(!A.ctx)return;const t=A.ctx.currentTime;const f=car.rpm/60*1.5;for(const o of A.osc)o.o.frequency.setTargetAtTime(f*o.m,t,.015);
 A.lp.frequency.setTargetAtTime(500+thr*2600+car.rpm/12500*1800,t,.03);A.eg.gain.setTargetAtTime((paused?0:1)*(0.06+thr*.16+car.rpm/12500*.05)*(race.shiftCut>0?.35:1),t,.02);
 A.wet.gain.setTargetAtTime(tun*.7,t,.1);A.wind.g.gain.setTargetAtTime(paused?0:Math.pow(Math.abs(car.v)/86,2)*.35,t,.1);A.scrape.g.gain.setTargetAtTime(paused?0:scr*.5,t,.02);A.rumble.g.gain.setTargetAtTime(paused?0:kerb*.9,t,.02);}

export {A,applySound,initAudio,updateAudio};
