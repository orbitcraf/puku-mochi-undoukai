const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.resolve(path.dirname(process.execPath), '../node_modules/playwright')); }
const root = path.resolve(__dirname, '..');
const label = process.argv[2] || 'after';
const projects = [['mountain','ぷくもち山歩き','departure'],['sea','ぷくもち海歩き','to-the-sea'],['food','ぷくもち食べ歩き','scent'],['sports','ぷくもち運動会','arrival']];
(async()=>{
  const browser = await pw.chromium.launch({headless:true,channel:'msedge'});
  const page = await browser.newPage({reducedMotion:'reduce',isMobile:true,hasTouch:true});
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
  const results=[];
  for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[820,1180],[1440,1000]]) {
    await page.setViewportSize({width,height});
    for(const [name,folder,id] of projects) {
      await page.goto(pathToFileURL(path.resolve(root,'..',folder,'index.html')).href+'#page-'+id);
      await page.locator('.is-active img').evaluate(img=>img.decode());
      const metrics=await page.evaluate(()=>{
        const selectors=['body','.book-stage','.storybook','.book-viewport','.book-page.is-active','.book-controls','.is-active .illustration-leaf','.is-active .illustration-leaf img','.is-active .story-leaf','.is-active h2','#page-next'];
        return {viewport:document.querySelector('meta[name=viewport]').content,innerWidth,scrollWidth:document.documentElement.scrollWidth,visualScale:visualViewport.scale,elements:Object.fromEntries(selectors.map(sel=>{
          const el=document.querySelector(sel),r=el.getBoundingClientRect(),s=getComputedStyle(el);
          return [sel,{x:r.x,width:r.width,height:r.height,maxWidth:s.maxWidth,fontSize:s.fontSize,padding:s.padding,transform:s.transform,zoom:s.zoom,fit:s.objectFit}];
        }))};
      });
      results.push({name,width,height,...metrics});
      if(width===390) await page.screenshot({path:path.join(root,'artifacts',label+'-'+name+'.png')});
    }
  }
  if(label!=='before') {
    for(const sports of results.filter(x=>x.name==='sports' && x.width<=480)) {
      const peers=results.filter(x=>x.width===sports.width && x.name!=='sports');
      for(const peer of peers) {
        assert.equal(sports.visualScale,peer.visualScale);
        for(const selector of ['.storybook','.book-controls']) assert.equal(sports.elements[selector].width,peer.elements[selector].width);
        assert.equal(sports.elements['.is-active h2'].fontSize,peer.elements['.is-active h2'].fontSize);
        assert.equal(sports.elements['#page-next'].height,peer.elements['#page-next'].height);
      }
      assert.equal(sports.scrollWidth,sports.width);
      assert.equal(sports.elements['.is-active .illustration-leaf img'].fit,'cover');
    }
    const baseline=path.join(root,'artifacts/before-comparison.json');
    if(fs.existsSync(baseline)) {
      const previous=JSON.parse(fs.readFileSync(baseline)).find(x=>x.name==='sports'&&x.width===1440);
      assert.deepEqual(results.find(x=>x.name==='sports'&&x.width===1440),previous,'PC dimensions must remain unchanged');
    }
  }
  fs.writeFileSync(path.join(root,'artifacts',label+'-comparison.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.filter(x=>x.width===390).map(x=>({name:x.name,viewport:x.innerWidth,scale:x.visualScale,book:x.elements['.storybook'].width,nav:x.elements['.book-controls'].width,text:x.elements['.is-active .story-leaf'].fontSize,heading:x.elements['.is-active h2'].fontSize,button:x.elements['#page-next'].height,image:x.elements['.is-active .illustration-leaf img']})),null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
