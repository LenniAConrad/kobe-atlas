import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const root=new URL('../',import.meta.url);
const doc=JSON.parse(await readFile(new URL('data/content.json',root),'utf8'));
const layers=doc.layers.filter(l=>l.pages.includes('nushima'));
const tile=await readFile(new URL('tests/fixtures/tile.png',root));
let browser,server;
const origin='http://127.0.0.1:18765';
before(async()=>{
  server=spawn('python3',['-m','http.server','18765','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
  for(let i=0;i<50;i++){
    try{if((await fetch(origin)).ok)break;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
});
after(async()=>{await browser?.close();server?.kill();});
async function open(width=1440,height=960,hash=''){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',route=>route.fulfill({contentType:'image/png',body:tile}));
  await page.goto(origin+'/'+hash);
  await page.waitForFunction(()=>window.atlasApp);
  return {page,errors};
}

test('catalogue has real local features, bounded native zooms and source provenance',async()=>{
  assert.equal(new Set(doc.layers.map(l=>l.id)).size,doc.layers.length);
  assert.ok(layers.length>=50);
  const page=doc.pages.find(p=>p.id==='nushima');
  assert.equal(doc.settings.startPage,'nushima');
  for(const id of page.defaultLayers)assert.ok(layers.some(l=>l.id===id));
  for(const l of layers){
    assert.ok(l.sources.length&&l.credit&&l.coverage&&l.license,l.id);
    if(l.type==='raster'){
      assert.ok(l.maxNativeZoom>=l.minNativeZoom&&l.maxNativeZoom<=18);
      assert.ok(l.detailBounds[0][0]<34.16&&l.detailBounds[1][0]>34.18);
    }else{
      const data=JSON.parse(await readFile(new URL(l.url,root),'utf8'));
      const features=data.features.filter(f=>!l.filterField||String(f.properties[l.filterField])===String(l.filterValue));
      assert.ok(features.length>0,l.id+' must not be an empty switch');
    }
  }
  const audit=JSON.parse(await readFile(new URL('data/nushima-sources.json',root),'utf8'));
  assert.equal(audit.layerCount,layers.length);
  assert.ok(audit.mlitCatalog.every(s=>s.selectedDownload));
});

test('starts on Nushima and every layer independently mounts, changes opacity and unmounts',async()=>{
  const {page,errors}=await open();
  assert.equal(await page.locator('#layer-list input[type=checkbox]').count(),layers.length);
  const center=await page.evaluate(()=>atlasApp.atlas.map.getCenter());
  assert.ok(Math.abs(center.lat-34.167)<.003&&Math.abs(center.lng-134.823)<.003);
  for(const layer of layers){
    await page.evaluate(id=>{atlasApp.overrides.nushima={[id]:true};atlasApp.render();},layer.id);
    await page.waitForFunction(id=>{const a=atlasApp.atlas;const l=a.instances.get(id);return l&&a.map.hasLayer(l)&&(l.getLayers?l.getLayers().length>0:true);},layer.id);
    const enabled=await page.locator('#layer-list input[type=checkbox]:checked').count();
    assert.equal(enabled,1,layer.id);
    const slider=page.locator(`[data-layer="${layer.id}"] .layer-opacity`);
    await slider.fill('37');await slider.dispatchEvent('input');
    assert.equal(await page.evaluate(id=>atlasApp.atlas.map.getPane('atlas-'+id).style.opacity,layer.id),'0.37');
    await page.locator(`[data-layer="${layer.id}"] input[type=checkbox]`).uncheck();
    assert.equal(await page.evaluate(id=>atlasApp.atlas.map.hasLayer(atlasApp.atlas.instances.get(id)),layer.id),false);
  }
  await page.locator('#all-layers').check();
  assert.equal(await page.locator('#layer-list input[type=checkbox]:checked').count(),layers.length);
  await page.locator('#all-layers').uncheck();
  assert.equal(await page.locator('#layer-list input[type=checkbox]:checked').count(),0);
  assert.deepEqual(errors,[]);await page.close();
});

test('high zoom requests native z18 imagery on Nushima, overzooms at 20, and resets locally',async()=>{
  const {page,errors}=await open();const requests=[];
  page.on('request',r=>{if(r.url().includes('/seamlessphoto/'))requests.push(r.url());});
  await page.evaluate(()=>atlasApp.atlas.map.setView([34.167,134.823],18,{animate:false}));
  await page.waitForFunction(()=>!atlasApp.atlas.instances.get('nushima-seamlessphoto').isLoading());
  assert.ok(requests.some(u=>u.includes('/seamlessphoto/18/')),requests.join('\n'));
  await page.evaluate(()=>atlasApp.atlas.map.setZoom(20,{animate:false}));
  await page.waitForFunction(()=>!atlasApp.atlas.instances.get('nushima-seamlessphoto').isLoading());
  assert.ok(!requests.some(u=>/seamlessphoto\/(19|20)\//.test(u)));
  await page.locator('#zoom-out').click();await page.waitForFunction(()=>atlasApp.atlas.map.getZoom()===19);
  await page.locator('#reset-view').click();
  await page.waitForFunction(()=>atlasApp.atlas.map.getBounds().contains(atlasApp.doc.pages.find(p=>p.id==='nushima').overviewBounds));
  await page.locator('#layers-collapse').click();
  const center=await page.evaluate(()=>atlasApp.atlas.map.getCenter());
  assert.ok(Math.abs(center.lat-34.167)<.003&&Math.abs(center.lng-134.823)<.003);
  assert.deepEqual(errors,[]);await page.close();
});

test('page navigation restores Kobe bounds, permits return, and supports direct links',async()=>{
  const {page,errors}=await open();
  await page.locator('[data-page="home"]').click();
  assert.ok(await page.evaluate(()=>atlasApp.atlas.map.getCenter().lat>34.5));
  await page.locator('[data-page="general"]').click();
  assert.equal(await page.evaluate(()=>atlasApp.atlas.map.getMinZoom()),9);
  await page.locator('[data-page="nushima"]').click();
  assert.ok(await page.evaluate(()=>atlasApp.atlas.map.getCenter().lat<34.2));
  await page.reload();await page.waitForFunction(()=>window.atlasApp);
  assert.equal(await page.evaluate(()=>atlasApp.page),'nushima');
  await page.goto(origin+'/#home');await page.waitForFunction(()=>window.atlasApp);
  assert.equal(await page.evaluate(()=>atlasApp.page),'home');
  assert.deepEqual(errors,[]);await page.close();
});

test('phone panels collapse and reopen, map controls stay usable, popups close',async()=>{
  const {page,errors}=await open(390,844);
  assert.equal(await page.locator('#layer-body').isVisible(),false);
  assert.equal(await page.locator('#subject-panel').getAttribute('open'),null);
  await page.locator('#layers-collapse').click();assert.ok(await page.locator('#layer-body').isVisible());
  await page.locator('#layers-collapse').click();assert.equal(await page.locator('#layer-body').isVisible(),false);
  await page.locator('#subject-title').click();assert.ok(await page.locator('#subject-body').isVisible());
  await page.locator('#subject-title').click();assert.equal(await page.locator('#subject-body').isVisible(),false);
  await page.locator('#zoom-in').click();
  await page.locator('#reset-view').click();
  await page.evaluate(()=>{atlasApp.manual()['nushima-skhb05']=true;atlasApp.render();});
  await page.waitForFunction(()=>atlasApp.atlas.instances.get('nushima-skhb05')?.getLayers?.().length===1);
  await page.evaluate(()=>atlasApp.atlas.instances.get('nushima-skhb05').getLayers()[0].openPopup());
  assert.ok(await page.locator('.leaflet-popup').isVisible());
  assert.match(await page.locator('.leaflet-popup').innerText(),/2階以上/);
  await page.locator('.leaflet-popup-close-button').click();
  await page.locator('.leaflet-popup').waitFor({state:'detached'});
  assert.deepEqual(errors,[]);await page.close();
});

test('unavailable imagery is reported and remains switchable',async()=>{
  const {page,errors}=await open();
  await page.route('**/gazo1/**',route=>route.fulfill({status:404,body:''}));
  await page.locator('[data-layer="nushima-gazo1"] input[type=checkbox]').check();
  await page.waitForFunction(()=>document.querySelector('[data-status-for="nushima-gazo1"]').textContent.includes('unavailable'));
  await page.locator('[data-layer="nushima-gazo1"] input[type=checkbox]').uncheck();
  assert.ok(await page.locator('[data-layer="nushima-seamlessphoto"] input[type=checkbox]').isChecked());
  assert.deepEqual(errors,[]);await page.close();
});


test('MAFF communities retain official identities and each shape supports hover, focus and tap',async()=>{
  const data=JSON.parse(await readFile(new URL('data/nushima/maff-fishing-communities-2023.geojson',root),'utf8'));
  assert.equal(data.features.length,5);
  assert.deepEqual(data.features.filter(f=>f.properties.GCOM!=='999').map(f=>f.properties.KEY).sort(),['28224261001','28224261002','28224261003','28224261004']);
  assert.ok(data.features.every(f=>f.properties.GAREA_NAME==='沼島'&&f.properties.censusYear===2023));
  const {page,errors}=await open();
  await page.locator('[data-layer="nushima-maff-fishing-communities"] input[type=checkbox]').check();
  await page.waitForFunction(()=>document.querySelectorAll('[data-community]').length===5);
  await page.locator('#nushima-layer-search').fill('MAFF');
  assert.equal(await page.locator('#layer-list .layer-row:visible').count(),1);
  await page.locator('#nushima-layer-search').fill('');
  const interior={ '001':[134.8227667,34.1694399], '002':[134.8209898,34.1696457], '003':[134.8208075,34.1682735], '004':[134.8207989,34.1654151], '999':[134.8274280,34.1679045] };
  for(const feature of data.features){
    const p=feature.properties;
    const polygon=page.locator(`[data-community="${p.KEY}"]`);
    // Use an interior point: the multipart other-area bounding box contains holes.
    const point=await page.evaluate(([lon,lat])=>{const m=atlasApp.atlas.map;const r=m.getContainer().getBoundingClientRect();const p=m.latLngToContainerPoint([lat,lon]);return {x:p.x+r.left,y:p.y+r.top};},interior[p.GCOM]);
    await page.mouse.move(point.x,point.y);
    const tooltip=page.locator('.fishing-community-tooltip');
    await tooltip.waitFor({state:'visible'});
    assert.match(await tooltip.innerText(),new RegExp(p.GCOM_NAME));
    assert.match(await tooltip.innerText(),new RegExp(p.KEY));
    assert.match(await tooltip.innerText(),/2023/);
    assert.match(await tooltip.innerText(),/南あわじ市/);
    assert.equal(await polygon.getAttribute('stroke-width'),'4');
    await page.mouse.move(80,30);
    assert.equal(await polygon.getAttribute('stroke-width'),'2');
    await polygon.focus();
    assert.ok(await tooltip.isVisible());
    await polygon.press('Enter');
    assert.match(await page.locator('.leaflet-popup').innerText(),new RegExp(p.KEY));
    await polygon.press('Escape');
    await page.locator('.leaflet-popup').waitFor({state:'detached'});
  }
  assert.deepEqual(errors,[]);await page.close();
  const {page:phone}=await open(390,844);
  await phone.locator('#layers-collapse').click();
  await phone.locator('[data-layer="nushima-maff-fishing-communities"] input[type=checkbox]').check();
  await phone.waitForFunction(()=>document.querySelectorAll('[data-community]').length===5);
  await phone.locator('#layers-collapse').click();
  await phone.locator('[data-community="28224261003"]').click();
  assert.match(await phone.locator('.leaflet-popup').innerText(),/28224261003/);
  await phone.close();
});


test('changing interface language preserves the island camera and reset label',async()=>{
  const {page,errors}=await open();
  await page.evaluate(()=>atlasApp.atlas.map.setView([34.168,134.821],17,{animate:false}));
  await page.locator('#menu-toggle').click();
  await page.locator('[data-language="JP"]').click();
  const state=await page.evaluate(()=>({center:atlasApp.atlas.map.getCenter(),zoom:atlasApp.atlas.map.getZoom()}));
  assert.ok(Math.abs(state.center.lat-34.168)<.001&&Math.abs(state.center.lng-134.821)<.001);
  assert.equal(state.zoom,17);
  assert.equal(await page.locator('#reset-view').getAttribute('aria-label'),'沼島全体を表示');
  assert.deepEqual(errors,[]);await page.close();
});
