import { chromium } from 'playwright';
const [,, modo, fpsArg, saida, iniArg, fimArg] = process.argv;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await (await b.newContext({ viewport:{width:1920,height:1080}, ignoreHTTPSErrors:true })).newPage();
await p.goto('file://' + process.cwd() + '/filme.html', { waitUntil:'networkidle' });
await p.evaluate(()=>document.fonts.ready);
const pausar = async (ms)=> p.evaluate((ms)=>{ for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; } }, ms);
if (modo === 'amostra') {
  for (const t of fpsArg.split(',').map(Number)) { await pausar(t*1000); await p.screenshot({ path:`amostra-${t}.png` }); }
} else {
  const fps = Number(fpsArg), total = 82, n = total*fps;
  const ini = Number(iniArg ?? 0), fim = Math.min(n, Number(fimArg ?? n));
  for (let i=ini;i<fim;i++) { await pausar(i*1000/fps); await p.screenshot({ path:`${saida}/f${String(i).padStart(5,'0')}.jpg`, type:'jpeg', quality:92 }); }
}
await b.close(); console.log('ok');
