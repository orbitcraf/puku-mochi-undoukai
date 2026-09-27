const path = require('node:path');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.resolve(path.dirname(process.execPath), '../node_modules/playwright')); }
const { chromium } = playwright;
const fs = require('node:fs');
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({headless:true, channel:'msedge'});
  const page = await browser.newPage({viewport:{width:390,height:844}, reducedMotion:'reduce'});
  for (const [width,height] of [[390,844],[1440,1000]]) {
    await page.setViewportSize({width,height});
    for (const id of ['cover','warmup','ball-toss','ending']) {
      await page.goto('http://127.0.0.1:4173/#page-'+id);
      await page.locator('.is-active img').evaluate(img=>img.decode());
      await page.screenshot({path:`artifacts/${width}-${id}.png`});
    }
  }
  for (const width of [390,1440]) {
    const ids=['cover','arrival','warmup','race','ball-toss','obstacles','lunch','teamwork','goal','awards','ending'];
    const tile=width===390?195:320;
    await page.setViewportSize({width:tile*5,height:width===390?900:500});
    await page.setContent('<body style="margin:0;background:#eee"><div style="display:grid;grid-template-columns:repeat(5,1fr)">'+ids.map(id=>'<div><p style="margin:3px;font:14px sans-serif">'+id+'</p><img style="display:block;width:100%" src="data:image/png;base64,'+fs.readFileSync('artifacts/'+width+'-'+id+'.png').toString('base64')+'"></div>').join('')+'</div></body>');
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
    await page.screenshot({path:'artifacts/'+width+'-all-pages.png',fullPage:true});
  }
  await browser.close();
})();

