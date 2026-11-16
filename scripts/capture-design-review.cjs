// Public-only, fresh isolated guest contexts. Never visits a hosted origin or logs user records.
const {chromium}=require('playwright-core');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 await fs.mkdir('design-review',{recursive:true});const manifest=[];
 for(const width of [390,640,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(20000);
  for(const [name,path]of [['home','/'],['explore','/explore'],['notebook','/notes'],['comparison','/compare/light-and-edges']]){
   await page.goto('http://127.0.0.1:3000'+path);await page.evaluate(()=>document.fonts.ready);
   await page.locator('main').waitFor();await page.evaluate(async()=>{const images=Array.from(document.images);for(const img of images)img.loading='eager';await Promise.race([Promise.all(images.map(img=>img.decode().catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,10000))]);});
   const metrics=await page.evaluate(()=>({viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,images:Array.from(document.images).map(img=>({loaded:img.complete&&img.naturalWidth>0,alt:img.alt})),h1:document.querySelector('h1')?.textContent,headerBottom:document.querySelector('body header')?.getBoundingClientRect().bottom}));
   if(metrics.overflow)throw Error('Horizontal overflow '+name+' '+width);
   if(name==='notebook'){const disclosure=page.locator('[data-study-path-disclosure]');if(await disclosure.evaluate(el=>el.open))throw Error('Study paths must start compact');await disclosure.locator('summary').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-study-path-disclosure]')?.open===true);await disclosure.locator('summary').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-study-path-disclosure]')?.open===false);await page.evaluate(()=>scrollTo(0,0));}
   const file=`${name}-${width}.png`;await page.screenshot({path:'design-review/'+file,fullPage:true,animations:'disabled'});manifest.push({file,path,width,...metrics});
  }
  await context.close();
 }
 await fs.writeFile('design-review/manifest.json',JSON.stringify({scope:'Public guest screens only; Linux Chromium, not physical devices; visual review required',screens:manifest},null,2));
 console.log('PASS captured sixteen public screenshots at 390, 640, 768, 1280 CSS pixels');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
