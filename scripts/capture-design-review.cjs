// Public-only, fresh isolated guest contexts. Never visits a hosted origin or logs user records.
const {chromium}=require('playwright-core');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 await fs.mkdir('design-review',{recursive:true});const manifest=[];
 for(const width of [390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(20000);
  for(const [name,path]of [['home','/'],['explore','/explore'],['notebook','/notes'],['comparison','/compare/light-and-edges']]){
   await page.goto('http://127.0.0.1:3000'+path);await page.evaluate(()=>document.fonts.ready);
   await page.locator('main').waitFor();await page.evaluate(async()=>{await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{})));});
   const metrics=await page.evaluate(()=>({viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelector('h1')?.textContent,headerBottom:document.querySelector('body header')?.getBoundingClientRect().bottom}));
   if(metrics.overflow)throw Error('Horizontal overflow '+name+' '+width);
   const file=`${name}-${width}.png`;await page.screenshot({path:'design-review/'+file,fullPage:true,animations:'disabled'});manifest.push({file,path,width,...metrics});
  }
  await context.close();
 }
 await fs.writeFile('design-review/manifest.json',JSON.stringify({scope:'Public guest screens only; Linux Chromium, not physical devices; visual review required',screens:manifest},null,2));
 console.log('PASS captured twelve public screenshots at 390, 768, 1280 CSS pixels');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
