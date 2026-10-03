// Captura del juego desde un punto del trazado.
// Uso: node shot.mjs <salida.png> <cp> [d] [cam] [offset] [ancho] [alto] [--mobile] [--vehiculo=<formula|tractor|nightcar>]
//   cp: punto del trazado (0-158); d: metros desde el centro (+ derecha); cam: 0 cockpit, 1 onboard TV, 2 T-cam, 3 exterior;
//   offset: muestras (~2 m) que se suman a cpIdx(cp); --mobile: user agent de iPhone y pantalla táctil (usar con 844 390).
//   Un nombre sin carpeta se guarda en qa-out/.
import {openGame,outPath,args,flag} from './lib.mjs';

const [out,cp,d='0',cam='0',offset='0',w='1280',h='720']=args;
if(!out||cp===undefined){console.error('Uso: node shot.mjs <salida.png> <cp> [d] [cam] [offset] [ancho] [alto] [--mobile]');process.exit(2);}
const {browser,page,errors}=await openGame({width:+w,height:+h,mobile:flag('mobile')});
const veh=(process.argv.find(a=>a.startsWith('--vehiculo='))||'').split('=')[1];
if(veh)console.log('Vehículo: '+JSON.stringify(await page.evaluate(v=>window.__debug.vehicle(v),veh)));
await page.evaluate(([cp,d,cam,o])=>window.__debug.place(cp,d,cam,o),[+cp,+d,+cam,+offset]);
await page.waitForTimeout(1500);
const file=outPath(out);
await page.screenshot({path:file});
await browser.close();
console.log(file);
if(errors.length){console.log('Errores de consola:\n'+errors.join('\n'));process.exit(1);}
