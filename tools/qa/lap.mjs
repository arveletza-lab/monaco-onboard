// Vuelta completa con el piloto automático de window.__debug, más rendimiento en 5 puntos del circuito.
// Uso: node lap.mjs [--media | --alta] [--vehiculo=<formula|tractor|nightcar>]
//   Por defecto mide en calidad Baja, que es la del límite de 450.000 triángulos visibles.
import {openGame,flag} from './lib.mjs';

const q=flag('alta')?2:flag('media')?1:0,QN=['Baja','Media','Alta'][q],LIMIT=450000;
const fmt=t=>t==null?'—':Math.floor(t/60)+':'+(t%60).toFixed(3).padStart(6,'0');

const {browser,page,errors}=await openGame();
const veh=(process.argv.find(a=>a.startsWith('--vehiculo='))||'').split('=')[1];
if(veh)console.log('Vehículo: '+JSON.stringify(await page.evaluate(v=>window.__debug.vehicle(v),veh)));
await page.evaluate(q=>{const s=document.getElementById('optQ');s.value=String(q);s.dispatchEvent(new Event('change'));},q);

// from the grid, 5 simulated seconds at a time, until the lap ends (at most 5 minutes)
await page.evaluate(()=>window.__debug.place(119,-2.3,0,-8));
let st;
for(let k=0;k<60;k++){st=await page.evaluate(()=>window.__debug.sim(5,true));if(st.finished)break;}
console.log(st.finished?`Vuelta completa: ${fmt(st.lapT)}${st.invalid?' (ANULADA por límites de pista)':''}`:`VUELTA INCOMPLETA: el auto quedó en cp ${st.cp_cercano} a los ${fmt(st.lapT)}`);
console.log('Sectores: '+st.sectores.map((t,k)=>'S'+(k+1)+' '+(t==null?'—':t.toFixed(3))).join('  '));
console.log('Toques de muro: '+st.wallHits);

console.log(`Rendimiento (calidad ${QN}, cámara cockpit):`);
let over=false;
for(const cp of[137,5,40,78,119]){
 await page.evaluate(cp=>window.__debug.place(cp,0,0),cp);
 // the renderer is slow in headless mode: read only after 12 new frames (chunk culling runs every 8 frames)
 const f0=await page.evaluate(()=>window.__debug.stats().frame);
 await page.waitForFunction(f0=>window.__debug.stats().frame>=f0+12,f0,{timeout:120000,polling:200});
 const s=await page.evaluate(()=>window.__debug.stats());
 const bad=q===0&&s.triangles>LIMIT;over=over||bad;
 console.log(`  cp ${String(cp).padStart(3)}: ${s.triangles.toLocaleString('es')} triángulos, ${s.drawCalls} draw calls, ${s.fps} fps${bad?'  << SUPERA 450.000':''}`);}
if(over)console.log('ATENCIÓN: hay puntos por encima del límite de 450.000 triángulos en calidad Baja.');

console.log(errors.length?'Errores de consola:\n  '+errors.join('\n  '):'Errores de consola: ninguno');
await browser.close();
process.exit(st.finished&&!errors.length?0:1);
