import {waterLayer} from './water.js?v=20261009o';
import {populationLayer} from './population.js?v=20261009o';
import {faultLayer} from './faults.js?v=20261009o';
import {zoningLayer} from './zoning.js?v=20261009o';
import {transportLayer} from './transport.js?v=20261009o';
import {boundaryLayer} from './boundaries.js?v=20261009o';
import {MapContrast} from './contrast.js?v=20261009o';
import {ChapterCamera} from './chapter-camera.js?v=20261009o';
import {localize,translateText,translateDOM} from './language.js?v=20261009o';
import {esc,prose} from './ui.js?v=20261009o';
import {revealPosition} from './playback.js?v=20261009o';
import {eventPopup,eventTooltip} from './events.js?v=20261009o';
const L=window.L;
const datasets=new Map();
const getData=url=>{if(!datasets.has(url))datasets.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Missing data: '+url);return r.json();}).catch(e=>{datasets.delete(url);throw e;}));return datasets.get(url);};
class TileQueue{
  constructor(){this.active=0;this.waiting=[];}
  run(task,signal){return new Promise((resolve,reject)=>{this.waiting.push({task,signal,resolve,reject});this.pump();});}
  pump(){while(this.active<4&&this.waiting.length){const job=this.waiting.shift();if(job.signal?.aborted){job.resolve(null);continue;}this.active++;Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{this.active--;this.pump();});}}
}
function popup(title,body,source=''){const el=document.createElement('div');el.className='feature-popup';el.innerHTML=`<span class="eyebrow">MAP FEATURE</span><h3>${esc(title)}</h3>${prose(body)}${source?`<p class="source-note">${esc(source)}</p>`:''}`;translateDOM(el);return el;}

export class AtlasMap{
  constructor(doc,repo,onError){this.doc=doc;this.repo=repo;this.onError=onError;this.offline=doc.settings.offlineOnly;this.instances=new Map();this.featureInstances=new Map();this.lastState=null;this.generation=0;this.tileQueue=new TileQueue();
    this.map=L.map('map',{zoomControl:false,attributionControl:true,minZoom:doc.settings.minZoom,maxZoom:doc.settings.maxZoom,maxBounds:doc.settings.bounds,maxBoundsViscosity:1,zoomAnimation:true}).setView(doc.settings.center,doc.settings.zoom);
    this.map.attributionControl.setPrefix('Leaflet');L.control.scale({position:'bottomright',imperial:false}).addTo(this.map);
    this.contrast=new MapContrast(this.map);this.applySettings();this.chapterCamera=new ChapterCamera(this.map,doc.settings);
  }
  applySettings(){const s=this.doc.settings,camera=this.chapterCamera?.extendedCamera;this.map.setMinZoom(camera?.minZoom??s.minZoom);this.map.setMaxZoom(s.maxZoom);this.map.setMaxBounds(camera?.navigationBounds??s.bounds);}
  update(doc){this.generation++;for(const layer of this.instances.values())this.map.removeLayer(layer);for(const f of this.featureInstances.values())this.map.removeLayer(f);this.instances.clear();this.featureInstances.clear();this.doc=doc;this.applySettings();}
  pageContext(page){const p=this.doc.pages.find(p=>p.id===page);if(p?.navigationBounds){this.map.setMinZoom(p.minZoom??10);this.map.setMaxBounds(p.navigationBounds);}else this.applySettings();}
  tileBounds(){const bounds=L.latLngBounds(this.doc.settings.bounds);for(const c of this.doc.chapters)if(c.camera?.navigationBounds)bounds.extend(c.camera.navigationBounds);for(const p of this.doc.pages)if(p.navigationBounds)bounds.extend(p.navigationBounds);return bounds;}
  setOffline(value){this.offline=value;for(const l of this.instances.values())if(l.redraw)l.redraw();}
  pane(id,index){let p=this.map.getPane('atlas-'+id);if(!p)p=this.map.createPane('atlas-'+id);p.style.zIndex=String(index);return p;}
  async tileImage(layer,z,x,y,signal){
    if(this.repo.local){
      const r=await fetch(`api/tile/${layer.id}/${z}/${x}/${y}?offline=${this.offline?1:0}&mode=${this.repo.published?'published':'draft'}`,{signal});
      if(!r.ok)return null;
      return {image:await createImageBitmap(await r.blob()),z:Number(r.headers.get('X-Source-Z')??z)};
    }
    // Static visitor edition: bundled tile folder first, then a provider if online.
    if(!(this.repo.cache[layer.id]?.count>0)){
      if(this.offline)return null;
      const url=layer.url.replace('{z}',z).replace('{x}',x).replace('{-y}',2**z-1-y).replace('{y}',y);
      try{const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});return {image,z};}catch{return null;}
    }
    for(let pz=z;pz>=Math.max(0,z-8);pz--){
      const d=z-pz;const r=await fetch(`tiles/${layer.id}/${pz}/${x>>d}/${y>>d}.tile`,{signal});
      if(r.ok&&!(r.headers.get('Content-Type')||'').includes('text/')){try{return {image:await createImageBitmap(await r.blob()),z:pz};}catch{}}
      if(pz===z&&!this.offline){
        const url=layer.url.replace('{z}',z).replace('{x}',x).replace('{-y}',2**z-1-y).replace('{y}',y);
        try{const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});return {image,z};}catch{}
      }
    }
    return null;
  }
  raster(layer,index){const self=this;
    const Tile=L.GridLayer.extend({
      createTile(coords,done){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctrl=new AbortController();canvas._abort=()=>ctrl.abort();
        const center=self.map.unproject([coords.x*256+128,coords.y*256+128],coords.z);const aoi=L.latLngBounds(self.doc.settings.aoi);
        const maxZ=aoi.contains(center)?layer.maxNativeZoom:self.doc.settings.contextMaxZoom;
        const z=Math.min(coords.z,maxZ??18),d=coords.z-z,x=coords.x>>d,y=coords.y>>d;
        self.tileQueue.run(()=>self.tileImage(layer,z,x,y,ctrl.signal),ctrl.signal).then(result=>{
          if(result){const delta=coords.z-result.z;const factor=2**delta;const size=256/factor;const sx=((coords.x%factor)+factor)%factor*size;const sy=((coords.y%factor)+factor)%factor*size;canvas.getContext('2d').drawImage(result.image,sx,sy,size,size,0,0,256,256);if(result.image.close)result.image.close();}
          done(null,canvas);
        }).catch(()=>done(null,canvas));return canvas;
      }
    });
    const grid=new Tile({pane:'atlas-'+layer.id,tileSize:256,noWrap:true,bounds:this.tileBounds(),updateWhenIdle:true,keepBuffer:1,maxZoom:19});
    grid.on('tileunload',e=>e.tile._abort?.());return grid;
  }
  async ensure(layer,index){
    if(this.instances.has(layer.id))return;
    const pane=this.pane(layer.id,layer.renderer==='water'?(layer.id==='supply-areas'?380:layer.id==='dams'||layer.id==='water-plants'?460:410):layer.id.startsWith('rail-')?420:layer.renderer==='population'?390:layer.overlay?350+index:layer.renderer==='faults'?430:layer.renderer==='boundaries'?440:layer.renderer==='transport'?(layer.id==='airports'||layer.id==='ferry-terminals'?470:420):200+index);pane.style.opacity='0';let instance;
    if(layer.type==='raster')instance=this.raster(layer,index);
    else if(layer.type==='image')instance=L.imageOverlay(layer.url,layer.bounds,{pane:'atlas-'+layer.id,interactive:false});
    else if(layer.type==='geojson'){
      const gen=this.generation;this.instances.set(layer.id,L.layerGroup());
      try{
        const data=await getData(layer.url);if(gen!==this.generation)return;
        instance=layer.renderer==='water'?waterLayer(data,layer,'atlas-'+layer.id):layer.renderer==='population'?populationLayer(data,layer,'atlas-'+layer.id):layer.renderer==='faults'?faultLayer(data,layer,'atlas-'+layer.id):layer.renderer==='zoning'?zoningLayer(data,layer,'atlas-'+layer.id):layer.renderer==='transport'?transportLayer(data,layer,'atlas-'+layer.id):layer.renderer==='boundaries'?boundaryLayer(data,layer,'atlas-'+layer.id):L.geoJSON(data,{pane:'atlas-'+layer.id,filter:f=>!layer.filterField||String(f.properties[layer.filterField])===String(layer.filterValue),style:()=>({color:layer.color,weight:layer.weight??3,opacity:1,fillOpacity:.18}),pointToLayer:(f,ll)=>L.circleMarker(ll,{pane:'atlas-'+layer.id,radius:4,color:layer.color,fillColor:layer.color,fillOpacity:.8}),onEachFeature:(f,l)=>{
          const p=f.properties||{};const title=p.N02_005||p.N02_003||p.name||layer.name;
          const pairs=[['Line',p.N02_003],['Operator',p.N02_004],['Category',p.operatorCategory],['Source code',p.N02_002]].filter(([,v])=>v);
          l.bindTooltip(String(title));l.bindPopup(popup(title,pairs.map(([k,v])=>k+': '+v).join('\n'),layer.credit),{autoPan:false,maxWidth:320});
        }});
      }catch(e){this.instances.delete(layer.id);this.onError(e.message);return;}
    }else return;
    this.instances.set(layer.id,instance);instance.addTo(this.map);if(this.lastState)this.render(...this.lastState);
  }
  render(page,playback,visibility){this.lastState=[page,playback,visibility];
    const current=playback.chapter,next=playback.phase==='fade'?playback.chapters[playback.nextIndex]:null,mix=playback.mix;
    const pale=this.doc.layers.find(l=>l.id==='pale');
    this.chapterCamera.render?.(playback,page,(visibility.auto?1:visibility(pale))*(pale.opacity??1));
    const credits=[];
    this.doc.layers.forEach((original,i)=>{const l=localize(original);
      if(l.type==='chapter')return;
      let value=visibility(l);
      if(page==='home'&&visibility.auto&&['raster','image'].includes(l.type))value=(l.id===current.layerId?1-mix:0)+(next&&l.id===next.layerId?mix:0);
      const alpha=Math.min(1,value)*(l.opacity??1);const needed=alpha>0||(page==='home'&&visibility.auto&&next?.layerId===l.id);
      if(needed&&!this.instances.has(l.id))this.ensure(l,i);
      const instance=this.instances.get(l.id);const pane=this.map.getPane('atlas-'+l.id);
      if(pane){pane.style.opacity=String(alpha);pane.style.pointerEvents=alpha>.01?'auto':'none';}
      if(instance){if(needed&&!this.map.hasLayer(instance))instance.addTo(this.map);else if(!needed&&this.map.hasLayer(instance))this.map.removeLayer(instance);}
      if(alpha>.01&&l.credit)credits.push(l.credit);
    });
    const enabled=this.doc.layers.find(l=>l.type==='chapter');const showChapter=enabled?visibility(enabled)>0:true;
    const activeFeatures=new Set();
    for(const original of this.doc.features){const f=localize(original);
      let alpha=0;
      if(page==='home'&&showChapter){
        if(f.chapterId===current.id&&playback.progress+1e-7>=revealPosition(f,current))alpha=1-mix;
        if(next&&f.chapterId===next.id&&(playback.direction===1?0:1)+1e-7>=revealPosition(f,next))alpha=mix;
      }else if(page==='events'&&f.event&&showChapter)alpha=enabled?visibility(enabled):1;
      else if(page!=='home'&&f.pageId===page)alpha=1;
      if(f.event||page==='home')alpha*=enabled?(enabled.opacity??1):1;
      if(alpha<=0)continue;activeFeatures.add(f.id);
      const pane=this.pane('feature-'+f.id,f.geometry.type==='Point'?480:450);
      const existing=this.featureInstances.get(f.id),entering=!existing||!this.map.hasLayer(existing);
      // Only the entrance has a short CSS fade. Crossfade opacity follows the
      // playback mix exactly, so annotations leave with their chapter map.
      pane.style.transition=f.event&&playback.phase!=='fade'&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'opacity 900ms ease-out':'none';
      pane.style.opacity=entering&&f.event?'0':String(alpha);pane.style.pointerEvents=alpha>.1?'auto':'none';
      if(!this.featureInstances.has(f.id)){
        const color=/^#[\da-f]{6}$/i.test(f.color)?f.color:'#b57932';
        const layer=L.geoJSON({type:'Feature',geometry:f.geometry,properties:{}},{pane:'atlas-feature-'+f.id,style:{color,weight:2,fillOpacity:f.event ? .12 : .2,dashArray:f.event&&f.geometry.type==='Polygon'?'5 4':null},pointToLayer:(feature,ll)=>f.event?L.marker(ll,{pane:'atlas-feature-'+f.id,title:f.title,icon:L.divIcon({className:'event-pin',html:`<svg viewBox="0 0 28 36" aria-hidden="true"><path fill="${color}" stroke="white" stroke-width="2" d="M14 35S1 22 1 14a13 13 0 0 1 26 0c0 8-13 21-13 21Z"/><circle cx="14" cy="14" r="4" fill="white"/></svg>`,iconSize:[28,36],iconAnchor:[14,35],popupAnchor:[0,-30]})}):L.circleMarker(ll,{pane:'atlas-feature-'+f.id,radius:8,color:'#fff',weight:3,fillColor:color,fillOpacity:1}),onEachFeature:(feature,l)=>{l.bindTooltip(f.event?eventTooltip(f):f.title,{sticky:true,className:f.event?'event-tooltip':''});l.bindPopup(f.event?eventPopup(f):popup(f.title,f.body,f.source),{autoPan:false,maxWidth:360,maxHeight:440});if(f.event&&l.setStyle){l.on('mouseover',()=>l.setStyle({weight:3,fillOpacity:.26}));l.on('mouseout',()=>l.setStyle({weight:2,fillOpacity:.12}));}}});
        this.featureInstances.set(f.id,layer);
      }
      const l=this.featureInstances.get(f.id);if(!this.map.hasLayer(l))l.addTo(this.map);
      if(entering&&f.event){void pane.offsetWidth;pane.style.opacity=String(alpha);}
    }
    for(const [id,l]of this.featureInstances)if(!activeFeatures.has(id)&&this.map.hasLayer(l)){l.eachLayer(item=>{item.closePopup?.();item.closeTooltip?.();});this.map.removeLayer(l);}
    const text=[...new Set(credits)].join(' · ');if(text!==this.credit){if(this.credit)this.map.attributionControl.removeAttribution(esc(this.credit));if(text)this.map.attributionControl.addAttribution(esc(text));this.credit=text;}
  }
  draw(mode,geometry,onFinish){
    const group=L.featureGroup().addTo(this.map);let tool;
    const finish=()=>{const item=group.getLayers()[0];if(item)onFinish(item.toGeoJSON().geometry);};
    const cleanup=()=>{tool?.disable();this.map.off(L.Draw.Event.CREATED,created);this.map.removeLayer(group);};
    const created=e=>{group.clearLayers();group.addLayer(e.layer);finish();};
    if(mode==='edit'&&geometry){L.geoJSON({type:'Feature',geometry,properties:{}}).eachLayer(l=>group.addLayer(l));tool=new L.EditToolbar.Edit(this.map,{featureGroup:group});tool.enable();}
    else {const type=mode==='point'?L.Draw.Marker:mode==='line'?L.Draw.Polyline:L.Draw.Polygon;tool=new type(this.map,{shapeOptions:{color:this.doc.settings.accent},allowIntersection:false});this.map.on(L.Draw.Event.CREATED,created);tool.enable();}
    return {finish,cancel:cleanup,cleanup};
  }
}
