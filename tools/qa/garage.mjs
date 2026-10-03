// Capturas de la vista previa del garage (tools/qa/garage.html): los tres vehículos y cada uno de frente, de lado y desde arriba.
// Uso: node garage.mjs   (con el servidor levantado: bash tools/qa/serve.sh). Las capturas van a qa-out/.
import {chromium} from 'playwright';
import {outPath} from './lib.mjs';

const BASE=(process.env.QA_URL||'http://localhost:8000/').replace(/\/?$/,'/');
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',r=>errors.push('no se pudo cargar '+r.url()));
try{await page.goto(BASE+'tools/qa/garage.html');}catch(e){await browser.close();console.error('No responde '+BASE+'. Levantá el servidor con: bash tools/qa/serve.sh');process.exit(2);}
try{await page.waitForFunction(()=>window.garage&&window.garage.ready,null,{timeout:60000});}
catch(e){console.error('La página no terminó de cargar.\n'+errors.join('\n'));await browser.close();process.exit(1);}

const frames=n=>page.evaluate(n=>new Promise(r=>{let k=0;const f=()=>++k>=n?r():requestAnimationFrame(f);requestAnimationFrame(f);}),n);
async function shot(name,mode,angle,rot){await page.evaluate(([m,a,r])=>{window.garage.spin(false,r);window.garage.view(m,a);},[mode,angle,rot]);await frames(3);const f=outPath(name);await page.screenshot({path:f});console.log(f);}

await shot('garage_todos.png','todos','iso',-0.55);
for(const id of['formula','tractor','nightcar']){
 await shot(`garage_${id}_frente.png`,id,'frente',0);
 await shot(`garage_${id}_lado.png`,id,'lado',0);
 await shot(`garage_${id}_arriba.png`,id,'arriba',0);
 await shot(`garage_${id}_iso.png`,id,'iso',0);
 await shot(`garage_${id}_atras.png`,id,'atras',0);}

const st=await page.evaluate(()=>window.garage.stats());
for(const s of st)console.log(`${s.id}: ${s.triangles.toLocaleString('es')} triángulos, ${s.length} m x ${s.width} m, ojo cockpit ${s.eye.cockpit.join(', ')}, onboard ${s.eye.onboard.join(', ')}, leds ${s.leds}, pantalla ${s.screen?'sí':'no'}, espejo ${s.mirror?'sí':'no'}`);
console.log(errors.length?'Errores de consola:\n  '+errors.join('\n  '):'Errores de consola: ninguno');
await browser.close();
process.exit(errors.length?1:0);
