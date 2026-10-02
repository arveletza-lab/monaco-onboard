// Shared helpers for the QA scripts: repo paths, output paths, and a headless browser with the game loaded.
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
export const OUT=path.join(ROOT,'qa-out');
export const URL=process.env.QA_URL||'http://localhost:8000/';

// a bare file name goes to qa-out/; a path with a folder is taken relative to the current directory
export function outPath(p){const r=path.isAbsolute(p)?p:(/[\\/]/.test(p)?path.resolve(p):path.join(OUT,p));fs.mkdirSync(path.dirname(r),{recursive:true});return r;}

const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// opens the game and waits until window.__debug.ready resolves (the world is built); collects console errors
export async function openGame({width=1280,height=720,mobile=false}={}){
 const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await browser.newContext(mobile?{viewport:{width,height},deviceScaleFactor:1,userAgent:IPHONE,isMobile:true,hasTouch:true}:{viewport:{width,height},deviceScaleFactor:1});
 const page=await ctx.newPage();const errors=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>errors.push('no se pudo cargar '+r.url()));
 try{await page.goto(URL);}catch(e){await browser.close();throw new Error('No responde '+URL+'. Levantá el servidor con: bash tools/qa/serve.sh');}
 try{await page.waitForFunction(()=>window.__debug,null,{timeout:60000});}
 catch(e){await browser.close();throw new Error('window.__debug no existe: el sitio tiene que abrirse desde localhost o 127.0.0.1');}
 await page.evaluate(()=>window.__debug.ready);
 return {browser,page,errors};}

export const args=process.argv.slice(2).filter(a=>!a.startsWith('--'));
export const flag=n=>process.argv.includes('--'+n);
