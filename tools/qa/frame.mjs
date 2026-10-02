// Extrae un cuadro de un video de referencia de _videos/ (busca el archivo por nombre, así nadie escribe los nombres largos).
// Uso: node frame.mjs <sim|real> <segundo> <salida.png>
//   sim  = vuelta en el simulador; se recorta la franja superior con la imagen del juego (crop=1280:446:0:0)
//   real = vuelta real con cámara sobre el casco (imagen completa)
//   Un nombre sin carpeta se guarda en qa-out/.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,outPath,args} from './lib.mjs';

const [kind,sec,out]=args;
if(!['sim','real'].includes(kind)||sec===undefined||!out){console.error('Uso: node frame.mjs <sim|real> <segundo> <salida.png>');process.exit(2);}
const dir=path.join(ROOT,'_videos');
const match=kind==='sim'?/Virtual Lap/i:/Pole Lap/i;
const video=fs.existsSync(dir)&&fs.readdirSync(dir).find(f=>match.test(f)&&/\.(mp4|mov|webm|mkv)$/i.test(f));
if(!video){console.error('No encuentro el video "'+kind+'" en _videos/');process.exit(1);}
const file=outPath(out);
const r=spawnSync('ffmpeg',['-v','error','-y','-ss',String(sec),'-i',path.join(dir,video),'-frames:v','1',...(kind==='sim'?['-vf','crop=1280:446:0:0']:[]),file],{stdio:'inherit'});
if(r.error){console.error('No se pudo ejecutar ffmpeg: '+r.error.message);process.exit(1);}
if(r.status!==0||!fs.existsSync(file))process.exit(r.status||1);
console.log(file);
