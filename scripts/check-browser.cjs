const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let pw;
try { pw = require('playwright'); }
catch { pw = require(path.resolve(path.dirname(process.execPath), '../node_modules/playwright')); }
const ids = ['cover','arrival','warmup','race','ball-toss','obstacles','lunch','teamwork','goal','awards','ending'];
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/';
(async()=>{
  fs.mkdirSync('artifacts',{recursive:true});
  const browser = await pw.chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'msedge'});
  const page = await browser.newPage({reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const sizes=[[320,568],[375,667],[390,844],[430,932],[820,1180],[821,1180],[1440,1000],[1280,720],[390,600],[800,500]];
  let inspected=0;
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});
    for(const id of ids){
      await page.goto(base+'#page-'+id);
      await page.locator('.is-active img').evaluate(img=>img.decode());
      const result=await page.evaluate(()=>{
        const p=document.querySelector('.page.is-active'), r=p.getBoundingClientRect();
        const text=p.querySelector('.story-leaf');
        const issues=[];
        if(document.documentElement.scrollWidth>innerWidth) issues.push('horizontal overflow');
        if(innerWidth<=480){
          for(const selector of ['.book-stage','.storybook','.book-viewport','.book-controls']) {
            const box=document.querySelector(selector).getBoundingClientRect();
            if(Math.abs(box.width-innerWidth)>1 || Math.abs(box.left)>1) issues.push('mobile width '+selector);
          }
          const image=p.querySelector('.illustration-leaf img');
          if(image && (getComputedStyle(image).objectFit!=='cover' || getComputedStyle(image).transform!=='none')) issues.push('mobile image scale');
        }
        if(text && [...text.children].some(el=>el.scrollWidth>el.clientWidth+1)) issues.push('text horizontal overflow');
        if(text && getComputedStyle(text).overflowY!=='auto'){
          const t=text.getBoundingClientRect();
          if([...text.children].some(el=>{const c=el.getBoundingClientRect();return c.top<t.top-1||c.bottom>t.bottom+1;})) issues.push('text vertical clipping');
        }
        for(const el of p.querySelectorAll('h1,h2,button')){
          const b=el.getBoundingClientRect();
          if(b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1) issues.push('clipped '+el.tagName);
        }
        return {issues,active:document.querySelectorAll('.page.is-active').length,loaded:p.querySelector('img').naturalWidth>0};
      });
      assert.deepEqual(result.issues,[],width+'x'+height+' '+id+': '+result.issues);
      assert.equal(result.active,1); assert.ok(result.loaded);
      if((width===390 && height===844) || width===1440) await page.screenshot({path:'artifacts/'+width+'-'+id+'.png'});
      inspected++;
    }
    await page.locator('#open-memories').click();
    assert.equal(await page.locator('.memory-card').count(),6);
    await page.screenshot({path:'artifacts/'+width+'-memories.png'});
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#memories-dialog').isHidden());
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(base);
  await page.locator('[data-go-next]').click();
  await page.waitForFunction(()=>location.hash==='#page-arrival');
  await page.keyboard.press('End');
  await page.locator('#open-memories').click();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.memoryPage),'goal');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'close-memories');
  for(const id of ids.slice(3,9)){
    await page.keyboard.press('Escape');
    await page.keyboard.press('End');
    await page.locator('#open-memories').click();
    await page.locator('[data-memory-page="'+id+'"]').click();
    await page.waitForFunction(id=>location.hash==='#page-'+id,id);
    assert.ok(await page.locator('#memories-dialog').isHidden());
  }
  await page.keyboard.press('End');
  await page.locator('[data-go-page="cover"]').click();
  await page.waitForFunction(()=>location.hash==='#page-cover');
  assert.ok(await page.locator('#page-prev').isDisabled());
  await page.locator('#page-dots button').nth(4).click();
  await page.waitForFunction(()=>location.hash==='#page-ball-toss');
  await page.goBack();
  await page.waitForFunction(()=>location.hash==='#page-cover');
  await page.goForward();
  await page.waitForFunction(()=>location.hash==='#page-ball-toss');
  await page.locator('#book-viewport').dispatchEvent('pointerdown',{isPrimary:true,button:0,pointerId:1,clientX:300,clientY:180});
  await page.locator('#book-viewport').dispatchEvent('pointerup',{isPrimary:true,button:0,pointerId:1,clientX:100,clientY:180});
  await page.waitForFunction(()=>location.hash==='#page-obstacles');
  await page.locator('#book-viewport').dispatchEvent('pointerdown',{isPrimary:true,button:0,pointerId:2,clientX:150,clientY:100});
  await page.locator('#book-viewport').dispatchEvent('pointerup',{isPrimary:true,button:0,pointerId:2,clientX:160,clientY:260});
  assert.equal(await page.evaluate(()=>location.hash),'#page-obstacles');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{for(let i=0;i<5;i++)document.querySelector('#page-next').click();});
  await page.waitForTimeout(600);
  assert.equal(await page.locator('.is-active').count(),1);
  assert.equal(await page.locator('[class*="is-leaving"],[class*="is-entering"]').count(),0);
  await page.locator('#open-memories').click();
  await page.locator('#memories-dialog').click({position:{x:2,y:2}});
  assert.ok(await page.locator('#memories-dialog').isHidden());
  await page.goto(base+'#page-%E0%A4%A');
  assert.ok(await page.locator('[data-page-id="cover"]').isVisible());
  assert.deepEqual(errors,[]);
  console.log('OK: '+inspected+' page/viewport checks, memories, keyboard, focus, dots, history, swipe and rapid navigation. Chromium/Edge only; physical iPhone unverified.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});


