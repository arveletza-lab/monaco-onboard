// Comparación lado a lado: referencia a la izquierda, render a la derecha, 640 px de ancho cada una.
// Uso: node compare.mjs <ref.png> <render.png> <salida.png>
//   Las entradas se buscan primero tal cual y si no, en qa-out/. Un nombre de salida sin carpeta se guarda en qa-out/.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {OUT,outPath,args} from './lib.mjs';

const [ref,render,out]=args;
if(!ref||!render||!out){console.error('Uso: node compare.mjs <ref.png> <render.png> <salida.png>');process.exit(2);}
const input=p=>fs.existsSync(p)?p:path.join(OUT,p);
for(const p of[ref,render])if(!fs.existsSync(input(p))){console.error('No existe '+p);process.exit(1);}
const file=outPath(out);
const r=spawnSync('ffmpeg',['-v','error','-y','-i',input(ref),'-i',input(render),'-filter_complex','[0]scale=640:-2[a];[1]scale=640:-2[b];[a][b]xstack=inputs=2:layout=0_0|w0_0:fill=black',file],{stdio:'inherit'});
if(r.error){console.error('No se pudo ejecutar ffmpeg: '+r.error.message);process.exit(1);}
if(r.status!==0)process.exit(r.status);
console.log(file);
