// Every texture of the game, painted on canvases at load time (no image files).

import {R,TAU,canvas,pick,rr} from './util.js';

// ---------------------------------------------------------------- textures
let MAXANI=1;
function setMaxAnisotropy(n){MAXANI=n;}
function tex(c,rep){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=MAXANI;if(rep)t.repeat.set(rep[0],rep[1]);return t;}
function asphaltTex(lines){const c=canvas(512,512),g=c.getContext('2d');g.fillStyle='#646669';g.fillRect(0,0,512,512);
 for(let i=0;i<90000;i++){const v=88+Math.random()*28|0;g.fillStyle=`rgba(${v},${v},${v+2},.55)`;g.fillRect(Math.random()*512,Math.random()*512,1,1);}
 for(let i=0;i<10;i++){g.fillStyle=`rgba(40,40,42,${0.04+Math.random()*.05})`;g.beginPath();g.ellipse(Math.random()*512,Math.random()*512,30+Math.random()*90,60+Math.random()*180,Math.random()*3,0,TAU);g.fill();}
 g.strokeStyle='rgba(30,30,30,.22)';g.lineWidth=1.5;for(let i=0;i<4;i++){g.beginPath();let x=Math.random()*512;g.moveTo(x,0);for(let y=0;y<=512;y+=32){x+=(Math.random()-.5)*10;g.lineTo(x,y);}g.stroke();}
 const gr=g.createLinearGradient(0,0,512,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.3,'rgba(20,20,20,.12)');gr.addColorStop(.42,'rgba(20,20,20,.2)');gr.addColorStop(.58,'rgba(20,20,20,.2)');gr.addColorStop(.7,'rgba(20,20,20,.12)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,512,512);
 if(lines){g.fillStyle='#e6e6e2';g.fillRect(8,0,10,512);g.fillRect(494,0,10,512);g.fillStyle='rgba(232,232,226,.9)';g.fillRect(252,0,8,154);}
 return tex(c);}
function kerbTex(){const c=canvas(64,128),g=c.getContext('2d');g.fillStyle='#d4202a';g.fillRect(0,0,64,64);g.fillStyle='#f4f4f0';g.fillRect(0,64,64,64);for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(Math.random()*64,Math.random()*128,2,2);}return tex(c);}
const BOARD={green:[['#10803f','#e7cf6e','MONACO'],['#10803f','#e7cf6e','MONTE-CARLO'],['#10803f','#e7cf6e','PRINCIPAUTÉ'],['#10803f','#e7cf6e','1929']],
 bluegreen:[['#1b6fc4','#ffffff','MONACO'],['#14935a','#ffffff','PRINCIPAUTÉ'],['#1b6fc4','#ffffff','MONTE-CARLO'],['#14935a','#ffffff','BEAU RIVAGE']],
 navy:[['#161d3b','#9cc3ff','MONTE-CARLO'],['#161d3b','#9cc3ff','MONACO'],['#161d3b','#ffffff','PRINCIPAUTÉ'],['#161d3b','#9cc3ff','MASSENET']],
 black:[['#111215','#e6c77a','CASINO SQUARE'],['#111215','#e6c77a','MONTE-CARLO'],['#111215','#ffffff','MONACO'],['#111215','#e6c77a','1929']],
 maroon:[['#7d1d48','#ffffff','PRINCIPAUTÉ'],['#7d1d48','#ffffff','MONACO'],['#7d1d48','#ffffff','MIRABEAU'],['#7d1d48','#ffffff','MONTE-CARLO']],
 blackw:[['#15171a','#ffffff','MONTE-CARLO'],['#15171a','#ffffff','MONACO'],['#15171a','#ffffff','1929'],['#15171a','#ffffff','PRINCIPAUTÉ']],
 white:[['#efefec','#c8102e','PRINCIPAUTÉ'],['#efefec','#1c2c63','PORTIER'],['#efefec','#c8102e','MONACO'],['#efefec','#1c2c63','MONTE-CARLO']],
 darkgreen:[['#0f4d2e','#ffffff','PORT HERCULE'],['#1c2f63','#ffffff','MONACO'],['#0f4d2e','#ffffff','PRINCIPAUTÉ'],['#1c2f63','#ffffff','MONTE-CARLO']],
 purple:[['#2d2a78','#ffffff','PISCINE'],['#2d2a78','#ffffff','MONACO'],['#2d2a78','#ffffff','PRINCIPAUTÉ'],['#2d2a78','#ffffff','MONTE-CARLO']],
 chicane:[['#f3dc00','#d8231f','MONACO'],['#f3dc00','#d8231f','NOUVELLE CHICANE'],['#f3dc00','#d8231f','PRINCIPAUTÉ'],['#f3dc00','#d8231f','1929']],
 yellow:[['#f3dc00','#d8231f','LA RASCASSE'],['#f3dc00','#d8231f','MONACO'],['#f3dc00','#d8231f','PRINCIPAUTÉ'],['#f3dc00','#d8231f','1929']]};
function wallTex(scheme){const ads=BOARD[scheme||'green'];const c=canvas(1024,128),g=c.getContext('2d');
 // armco: three pressed waves with highlights, bolts and posts (texture spans 16 m)
 g.fillStyle='#8d9296';g.fillRect(0,0,1024,128);
 for(let w=0;w<3;w++){const y0=6+w*36;const gr=g.createLinearGradient(0,y0,0,y0+34);gr.addColorStop(0,'#6f7479');gr.addColorStop(.25,'#d9dde0');gr.addColorStop(.5,'#aeb3b7');gr.addColorStop(.8,'#7b8085');gr.addColorStop(1,'#5b6065');g.fillStyle=gr;g.fillRect(0,y0,1024,34);}
 for(let x=0;x<1024;x+=128){g.fillStyle='#50555a';g.fillRect(x,0,6,128);g.fillStyle='#3f4347';for(let w=0;w<3;w++){g.fillRect(x+14,20+w*36,4,4);g.fillRect(x+110,20+w*36,4,4);}}
 g.fillStyle='rgba(60,50,40,.35)';g.fillRect(0,114,1024,14);
 for(let i=0;i<2500;i++){g.fillStyle=`rgba(${Math.random()<.5?'40,30,20':'255,255,255'},${Math.random()*.07})`;g.fillRect(Math.random()*1024,Math.random()*128,2,1);}
 // sponsor-style boards mounted on some sections only
 ads.forEach((a,k)=>{if(k%2===1&&scheme!=='yellow'&&scheme!=='green')return;const x=k*256+10,w=236;g.fillStyle=a[0];g.fillRect(x,8,w,100);g.fillStyle=a[1];let fs=54;g.font=`800 ${fs}px "Arial Narrow",Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';while(g.measureText(a[2]).width>w-24&&fs>18){fs-=2;g.font=`800 ${fs}px "Arial Narrow",Arial,sans-serif`;}g.fillText(a[2],x+w/2,60);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x,104,w,4);});
 return tex(c);}
function stoneTex(){const c=canvas(256,256),g=c.getContext('2d');g.fillStyle='#8f8676';g.fillRect(0,0,256,256);for(let y=0;y<256;y+=rr(14,22)|0){let x=-rr(0,20);const h=rr(14,22);while(x<256){const w=rr(18,42);const v=110+rr(-30,40)|0;g.fillStyle=`rgb(${v+18},${v+10},${v-4})`;g.beginPath();g.ellipse(x+w/2,y+h/2,w/2-1.5,h/2-1.5,rr(-.2,.2),0,TAU);g.fill();x+=w;}}
 for(let i=0;i<3000;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(Math.random()*256,Math.random()*256,2,2);}const t=tex(c);return t;}
function balTex(){const c=canvas(128,64),g=c.getContext('2d');g.clearRect(0,0,128,64);g.fillStyle='#ece6d8';g.fillRect(0,0,128,9);g.fillRect(0,56,128,8);for(let x=6;x<128;x+=16){g.beginPath();g.moveTo(x,9);g.quadraticCurveTo(x-5,24,x+1,32);g.quadraticCurveTo(x-6,46,x,56);g.lineTo(x+8,56);g.quadraticCurveTo(x+14,46,x+7,32);g.quadraticCurveTo(x+13,24,x+8,9);g.fill();}g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,7,128,2);return tex(c);}
function tunnelTileTex(){const c=canvas(128,128),g=c.getContext('2d');g.fillStyle='#c9b88f';g.fillRect(0,0,128,128);for(let y=0;y<128;y+=16)for(let x=(y/16)%2?-16:0;x<128;x+=32){const v=rr(-12,12);g.fillStyle=`rgb(${201+v},${184+v},${143+v})`;g.fillRect(x+1,y+1,30,14);}return tex(c);}
function kerbTexB(){const c=canvas(64,192),g=c.getContext('2d');g.fillStyle='#d4202a';g.fillRect(0,0,64,64);g.fillStyle='#f4f4f0';g.fillRect(0,64,64,64);g.fillStyle='#2d6fd0';g.fillRect(0,128,64,64);for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.12})`;g.fillRect(Math.random()*64,Math.random()*192,2,2);}return tex(c);}
function fenceTex(){const c=canvas(64,64),g=c.getContext('2d');g.strokeStyle='rgba(78,82,86,.75)';g.lineWidth=2.4;g.beginPath();g.moveTo(0,0);g.lineTo(64,64);g.moveTo(64,0);g.lineTo(0,64);g.stroke();const t=tex(c);t.encoding=THREE.sRGBEncoding;return t;}
// grandstand crowd: 8 bands, each one row of seated spectators upright on a transparent background (12 m of stand across);
// dense and mostly light, warm summer clothes, caps and a few flags, as in the onboard footage
function crowdTex(){const W=1024,H=512,RH=H/8,c=canvas(W,H),g=c.getContext('2d');g.clearRect(0,0,W,H);
 const wpick=a=>{let s=0;for(const x of a)s+=x[1];let r=Math.random()*s;for(const x of a){r-=x[1];if(r<=0)return x[0];}return a[0][0];};
 const shirts=[['#f1efe9',22],['#e2ddd2',8],['#cfd6de',6],['#c8261e',10],['#e05a2a',5],['#f08a1c',5],['#1d2433',9],['#2a2b2e',7],['#3c5a8a',6],['#8fb4d8',5],['#f2d34a',3],['#e79ab0',3],['#4f8a5a',2],['#b9a27c',4],['#7a2230',3]];
 const skins=[['#f0c9a8',4],['#e2b08a',5],['#c98f68',3],['#a86f4c',2],['#7c4f35',1]];
 const hairs=[['#2b211b',5],['#4a3324',4],['#7a5a3a',2],['#c9a46a',2],['#8d8d8d',1]];
 const caps=['#c8261e','#f4f4f2','#1b1b1b','#f08a1c','#1f3c8a'];
 for(let r=7;r>=0;r--){const y0=r*RH;
  for(let x=-10;x<W+10;x+=46+Math.random()*10){if(Math.random()<.06)continue;const px=x+Math.random()*8,sw=36+Math.random()*12,top=y0+20+Math.random()*6;
   const sh=wpick(shirts);g.fillStyle=sh;g.beginPath();g.moveTo(px-sw/2,y0+RH);g.lineTo(px-sw/2+3,top+8);g.quadraticCurveTo(px,top,px+sw/2-3,top+8);g.lineTo(px+sw/2,y0+RH);g.fill();
   g.fillStyle='rgba(0,0,0,.12)';g.fillRect(px-sw/2,top+20,sw,3);
   const sk=wpick(skins);if(Math.random()<.08){g.strokeStyle=sk;g.lineWidth=7;g.beginPath();g.moveTo(px+sw/2-6,top+10);g.lineTo(px+sw/2+4,top-22);g.stroke();}
   const hr=10+Math.random()*2,hy=top-6;g.fillStyle=sk;g.beginPath();g.arc(px,hy,hr,0,TAU);g.fill();
   const cap=Math.random()<.22;g.fillStyle=cap?caps[Math.floor(Math.random()*caps.length)]:wpick(hairs);g.beginPath();g.arc(px,hy-2,hr+1,Math.PI*1.05,Math.PI*1.95);g.fill();if(cap)g.fillRect(px-hr,hy-4,hr*2+5,4);
   if(Math.random()<.12){g.fillStyle='#151515';g.fillRect(px-hr+3,hy-2,hr*2-6,4);}
   if(Math.random()<.025){const fx=px+8,fy=top-40,red=Math.random()<.6;g.fillStyle='#ddd';g.fillRect(fx,fy,2,46);g.fillStyle=red?'#d51b2b':'#f08a1c';g.fillRect(fx+2,fy,28,10);g.fillStyle=red?'#f6f6f4':'#f08a1c';g.fillRect(fx+2,fy+10,28,10);}}}
 const t=tex(c);return t;}
function waterNormal(){const n=256,c=canvas(n,n),g=c.getContext('2d'),img=g.createImageData(n,n);const waves=[];for(let k=0;k<9;k++)waves.push([Math.floor(rr(1,7))*(R()<.5?-1:1),Math.floor(rr(1,7)),rr(0,TAU),rr(.4,1)]);
 const H=(x,y)=>{let h=0;for(const w of waves)h+=w[3]*Math.sin(TAU*(w[0]*x+w[1]*y)/n+w[2]);return h;};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=H(x+1,y)-H(x-1,y),dy=H(x,y+1)-H(x,y-1);let nx=-dx*1.6,ny=-dy*1.6,nz=1;const l=Math.hypot(nx,ny,nz);const k=(y*n+x)*4;img.data[k]=(nx/l*.5+.5)*255;img.data[k+1]=(ny/l*.5+.5)*255;img.data[k+2]=(nz/l*.5+.5)*255;img.data[k+3]=255;}
 g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
function glass(g,x,y,w,h){const gr=g.createLinearGradient(x,y,x+w*.35,y+h);gr.addColorStop(0,'#8a98a4');gr.addColorStop(.35,'#46525d');gr.addColorStop(1,'#232a31');g.fillStyle=gr;g.fillRect(x,y,w,h);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x,y,w,h*.12);}
function recess(g,x,y,w,h,d){g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x-d,y-d,w+2*d,d);g.fillRect(x-d,y,d,h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x-d,y+h,w+2*d,d*.8);}
function facadeTex(type){const S2=512,c=canvas(S2,S2),g=c.getContext('2d');g.fillStyle='#efede8';g.fillRect(0,0,S2,S2);
 for(let i=0;i<9000;i++){const a=Math.random()*.06;g.fillStyle=Math.random()<.5?`rgba(70,55,40,${a})`:`rgba(255,255,255,${a})`;g.fillRect(Math.random()*S2,Math.random()*S2,3,3);}
 const grd=g.createLinearGradient(0,0,0,S2);grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(1,'rgba(60,45,30,.06)');g.fillStyle=grd;g.fillRect(0,0,S2,S2);
 const cw=S2/3,rh=S2/3;
 for(let r=0;r<3;r++){const y0=r*rh;
  if(type<=2){g.fillStyle='rgba(255,255,255,.6)';g.fillRect(0,y0+rh-14,S2,6);g.fillStyle='rgba(0,0,0,.16)';g.fillRect(0,y0+rh-8,S2,4);}
  if(type===3){g.fillStyle='#f3f2ee';g.fillRect(0,y0+rh*.78,S2,rh*.22);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y0+rh*.78-6,S2,6);for(let k=0;k<6;k++){const x=k*S2/6+10;glass(g,x,y0+rh*.08,S2/6-20,rh*.64);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x,y0+rh*.08,S2/6-20,5);}g.fillStyle='rgba(40,45,50,.55)';for(let x=0;x<S2;x+=7)g.fillRect(x,y0+rh*.56,2,rh*.22);g.fillRect(0,y0+rh*.56,S2,3);continue;}
  if(type===4){g.fillStyle='#2a2f35';g.fillRect(0,y0+rh*.06,S2,rh*.7);for(let k=0;k<4;k++){const x=k*S2/4+8;glass(g,x,y0+rh*.1,S2/4-16,rh*.6);g.fillStyle='#cfd3d6';g.fillRect(x+S2/8-8,y0+rh*.1,3,rh*.6);}g.fillStyle='#f5f4f0';g.fillRect(0,y0+rh*.74,S2,rh*.14);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(0,y0+rh*.88,S2,6);g.fillStyle='rgba(180,205,220,.45)';g.fillRect(0,y0+rh*.5,S2,rh*.24);g.fillStyle='rgba(255,255,255,.7)';g.fillRect(0,y0+rh*.5,S2,3);continue;}
  if(type===5){for(let k=0;k<5;k++){glass(g,k*S2/5+3,y0+3,S2/5-6,rh-6);g.fillStyle=`rgba(150,175,195,${Math.random()*.18})`;g.fillRect(k*S2/5+3,y0+3,S2/5-6,rh-6);}g.fillStyle='#c4c9cd';for(let k=0;k<=5;k++)g.fillRect(k*S2/5-3,y0,6,rh);g.fillRect(0,y0,S2,6);continue;}
  for(let k=0;k<3;k++){const x0=k*cw;
   if(type===0){const w=cw*.32,h=rh*.56,x=x0+(cw-w)/2,y=y0+rh*.16;recess(g,x,y,w,h,5);glass(g,x,y,w,h);g.fillStyle='#f4f2ec';g.fillRect(x+w/2-2,y,4,h);g.fillRect(x,y+h*.42,w,3);g.fillStyle='#6d7568';for(const sx of[x-w*.52,x+w*1.02]){g.fillRect(sx,y,w*.5,h);g.fillStyle='rgba(0,0,0,.25)';for(let j=5;j<h;j+=6)g.fillRect(sx,y+j,w*.5,1.5);g.fillStyle='#6d7568';}g.fillStyle='#f7f5f0';g.fillRect(x-8,y+h,w+16,7);g.fillRect(x-6,y-10,w+12,6);}
   if(type===1){const w=cw*.34,h=rh*.7,x=x0+(cw-w)/2,y=y0+rh*.1;recess(g,x,y,w,h,5);glass(g,x,y,w,h);g.fillStyle='#f2efe8';g.fillRect(x+w/2-2,y,4,h);g.fillStyle='#8a7560';g.fillRect(x-w*.42,y,w*.4,h);g.fillRect(x+w*1.02,y,w*.4,h);g.fillStyle='#ebe6dc';g.fillRect(x0+8,y+h-2,cw-16,9);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x0+8,y+h+7,cw-16,4);g.strokeStyle='#26282b';g.lineWidth=2;g.beginPath();g.moveTo(x0+8,y+h-28);g.lineTo(x0+cw-8,y+h-28);for(let j=x0+11;j<x0+cw-8;j+=7){g.moveTo(j,y+h-28);g.lineTo(j,y+h-2);}g.stroke();}
   if(type===2){const w=cw*.38,h=rh*.6,x=x0+(cw-w)/2,y=y0+rh*.18;g.fillStyle='rgba(255,255,255,.45)';g.fillRect(x0,y0,10,rh);g.fillRect(x0+cw-10,y0,10,rh);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(x0+10,y0,3,rh);g.fillStyle='#faf8f3';g.beginPath();g.moveTo(x-7,y+h);g.lineTo(x-7,y+w/2);g.arc(x+w/2,y+w/2,w/2+7,Math.PI,0);g.lineTo(x+w+7,y+h);g.fill();const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,'#7c8b98');gr.addColorStop(1,'#20262d');g.fillStyle=gr;g.beginPath();g.moveTo(x,y+h);g.lineTo(x,y+w/2);g.arc(x+w/2,y+w/2,w/2,Math.PI,0);g.lineTo(x+w,y+h);g.fill();g.fillStyle='#f4f1ea';g.fillRect(x+w/2-2,y,4,h);g.fillStyle='#ece7dc';for(let j=x0+10;j<x0+cw-10;j+=11)g.fillRect(j,y+h+3,5,16);g.fillRect(x0+6,y+h,cw-12,4);g.fillRect(x0+6,y+h+19,cw-12,5);}
  }
 }
 return tex(c);}
function shopTex(){const W=512,H=256,c=canvas(W,H),g=c.getContext('2d');g.fillStyle='#e4ddd0';g.fillRect(0,0,W,H);
 for(let y=0;y<H;y+=22){g.fillStyle='rgba(0,0,0,.09)';g.fillRect(0,y,W,2);}
 for(let i=0;i<5000;i++){g.fillStyle=`rgba(60,45,30,${Math.random()*.06})`;g.fillRect(Math.random()*W,Math.random()*H,3,3);}
 const aw=['#6b2230','#2d4a3a','#1f2d4d','#7a6a52','#3b3b3b'];
 for(let k=0;k<3;k++){const x=k*W/3+18,w=W/3-36,top=60;g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x-4,top-4,w+8,H-top);const gr=g.createLinearGradient(0,top,0,H);gr.addColorStop(0,'#3c444c');gr.addColorStop(1,'#15181c');g.fillStyle=gr;g.fillRect(x,top,w,H-top-12);g.fillStyle='rgba(255,240,210,.12)';g.fillRect(x+8,top+30,w-16,70);g.fillStyle='#d8d2c6';g.fillRect(x+w/2-3,top,6,H-top-12);
  if(Math.random()<.6){g.fillStyle=aw[Math.floor(Math.random()*aw.length)];g.beginPath();g.moveTo(x-8,top-6);g.lineTo(x+w+8,top-6);g.lineTo(x+w+18,top+34);g.lineTo(x-18,top+34);g.fill();g.fillStyle='rgba(255,255,255,.15)';for(let j=x-10;j<x+w+10;j+=24)g.fillRect(j,top-4,10,36);}}
 g.fillStyle='#cfc7b8';g.fillRect(0,H-12,W,12);g.fillStyle='#f1ede6';g.fillRect(0,0,W,16);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,16,W,4);
 return tex(c);}
function leafTex(){const c=canvas(256,256),g=c.getContext('2d');g.clearRect(0,0,256,256);const cs=['#2f4a22','#3a5a28','#46692f','#557a37','#2a3f1e','#5f8540'];
 for(let i=0;i<2600;i++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*108;const x=128+Math.cos(a)*r,y=130+Math.sin(a)*r*.92;const shade=(y-40)/200;g.fillStyle=cs[Math.min(5,Math.floor(Math.random()*4+(1-shade)*2))];g.globalAlpha=.9;g.beginPath();g.ellipse(x,y,rr(3,7),rr(2,4),rr(0,3),0,TAU);g.fill();}
 g.globalAlpha=1;const t=tex(c);return t;}
function frondTex(){const c=canvas(64,256),g=c.getContext('2d');g.clearRect(0,0,64,256);g.strokeStyle='#5a6b34';g.lineWidth=3;g.beginPath();g.moveTo(32,0);g.lineTo(32,256);g.stroke();
 for(let y=6;y<250;y+=5){const L=26*Math.sin(Math.PI*y/256)+4;g.strokeStyle=pick(['#3f6128','#4b7030','#36561f','#58793a']);g.lineWidth=2.4;g.beginPath();g.moveTo(32,y);g.lineTo(32-L,y+10);g.moveTo(32,y);g.lineTo(32+L,y+10);g.stroke();}return tex(c);}
function sdBoardTex(){const c=canvas(1024,128),g=c.getContext('2d');const segs=[['#15171b','#ffffff','1929'],['#1d5fc4','#ffffff','MONACO'],['#15171b','#ffffff','1929'],['#16a3a0','#ffffff','MONTE-CARLO']];
 segs.forEach((a,k)=>{const x=k*256;g.fillStyle=a[0];g.fillRect(x,0,256,128);g.fillStyle=a[1];g.font='italic 800 50px "Arial Narrow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(a[2],x+128,66);});g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,1024,6);return tex(c);}
function stuccoTex(){const c=canvas(256,256),g=c.getContext('2d');g.fillStyle='#e3d3b4';g.fillRect(0,0,256,256);for(let i=0;i<6000;i++){g.fillStyle=`rgba(${Math.random()<.5?'90,70,40':'255,255,255'},${Math.random()*.08})`;g.fillRect(Math.random()*256,Math.random()*256,3,3);}
 for(let y=0;y<256;y+=64){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y,256,2);}g.fillStyle='rgba(80,60,40,.18)';g.fillRect(0,224,256,32);return tex(c);}
function numTex(n){const c=canvas(64,128),g=c.getContext('2d');g.fillStyle='#16181b';g.fillRect(0,0,64,128);g.strokeStyle='#e8e8e8';g.lineWidth=3;g.strokeRect(3,3,58,122);g.fillStyle='#f4f4f4';g.font='800 30px Arial';g.textAlign='center';g.textBaseline='middle';const d=n.split('');d.forEach((ch,k)=>g.fillText(ch,32,22+k*(84/(d.length))+ (d.length===2?14:0)));const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
function bannerTex(bg,fg,txt){const c=canvas(1024,128),g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,1024,128);g.fillStyle=fg;g.font='800 64px "Arial Narrow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,512,66);g.fillStyle='rgba(0,0,0,.15)';g.fillRect(0,120,1024,8);return tex(c);}
function bridgeTex(){const c=canvas(1024,128),g=c.getContext('2d');g.fillStyle='#10803f';g.fillRect(0,0,1024,128);g.fillStyle='#e7cf6e';g.fillRect(0,0,1024,6);g.fillRect(0,122,1024,6);g.font='800 70px "Arial Narrow",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('MONTE-CARLO  ·  MONACO',512,66);return tex(c);}
function ironTex(){const c=canvas(128,64),g=c.getContext('2d');g.clearRect(0,0,128,64);g.fillStyle='#1d1f22';g.fillRect(0,0,128,5);g.fillRect(0,58,128,6);g.fillRect(0,40,128,3);
 for(let x=2;x<128;x+=7)g.fillRect(x,5,2.4,53);g.strokeStyle='#1d1f22';g.lineWidth=2;for(let x=0;x<128;x+=14){g.beginPath();g.arc(x+7,46,5,Math.PI,0);g.stroke();}return tex(c);}
function boardTex(scheme){const ads=BOARD[scheme];const c=canvas(1024,128),g=c.getContext('2d');
 ads.forEach((a,k)=>{const x=k*256;g.fillStyle=a[0];g.fillRect(x,0,256,128);g.fillStyle=a[1];let fs=66;g.font=`800 ${fs}px "Arial Narrow",Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';while(g.measureText(a[2]).width>232&&fs>18){fs-=2;g.font=`800 ${fs}px "Arial Narrow",Arial,sans-serif`;}g.fillText(a[2],x+128,66);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x+254,0,2,128);});
 for(let i=0;i<1500;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.05})`;g.fillRect(Math.random()*1024,Math.random()*128,2,2);}return tex(c);}
function armcoTex(){const c=canvas(256,64),g=c.getContext('2d');g.fillStyle='#cfd2d5';g.fillRect(0,0,256,64);
 for(let i=0;i<1800;i++){g.fillStyle=`rgba(${Math.random()<.6?'60,55,50':'255,255,255'},${Math.random()*.09})`;g.fillRect(Math.random()*256,Math.random()*64,rr(2,12),1);}
 for(let i=0;i<14;i++){g.fillStyle=`rgba(40,30,25,${rr(.05,.14)})`;g.fillRect(rr(0,256),rr(30,64),rr(2,5),rr(4,30));}
 for(let x=0;x<256;x+=64){g.fillStyle='rgba(40,40,40,.35)';g.fillRect(x,0,2,64);g.fillStyle='#8c9196';for(const y of[10,26,42,56])g.fillRect(x+6,y,3,3);}
 g.fillStyle='rgba(70,45,30,.25)';g.fillRect(0,58,256,6);const t=tex(c);t.encoding=THREE.sRGBEncoding;return t;}
function concreteTex(){const c=canvas(256,64),g=c.getContext('2d');g.fillStyle='#e4e2dc';g.fillRect(0,0,256,64);for(let i=0;i<2500;i++){g.fillStyle=`rgba(80,75,65,${Math.random()*.08})`;g.fillRect(Math.random()*256,Math.random()*64,2,2);}
 for(let x=0;x<256;x+=128){g.fillStyle='rgba(60,60,60,.25)';g.fillRect(x,0,2,64);}g.fillStyle='rgba(90,70,50,.22)';g.fillRect(0,52,256,12);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(0,0,256,4);return tex(c);}
function carbonTex(){const c=canvas(64,64),g=c.getContext('2d');for(let y=0;y<64;y+=4)for(let x=0;x<64;x+=4){const on=((x+y)/4)%4<2;g.fillStyle=on?'#2a2d31':'#15171a';g.fillRect(x,y,4,4);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x,y,4,1);}return tex(c,[6,6]);}

export {BOARD,armcoTex,asphaltTex,balTex,bannerTex,boardTex,bridgeTex,carbonTex,concreteTex,crowdTex,facadeTex,fenceTex,frondTex,ironTex,kerbTex,kerbTexB,leafTex,numTex,sdBoardTex,setMaxAnisotropy,shopTex,stoneTex,stuccoTex,tunnelTileTex,waterNormal};
