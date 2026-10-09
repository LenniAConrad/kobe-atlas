import {getLanguage,localize,contentFields,translateText,translateDOM} from './language.js?v=20261009o';
import {$,esc,icon,toast} from './ui.js?v=20261009o';
const clone=x=>JSON.parse(JSON.stringify(x));
const groups=['chapters','features','layers','pages','settings'];
const titles={chapters:'Chapters',features:'Points & regions',layers:'Layers',pages:'Subject pages',settings:'Appearance & map'};
const id=prefix=>prefix+'-'+Date.now().toString(36);
export class Editor{
  constructor(app){this.app=app;this.dialog=$('#editor-dialog');this.kind='chapters';this.selected=0;this.dirty=false;this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});}
  open(kind='chapters'){this.work=clone(this.app.doc);this.contentLanguage=getLanguage();this.kind=kind;this.selected=0;this.dirty=false;this.render();this.app.playback.pause();this.dialog.showModal();}
  close(){if(this.dirty&&!confirm(translateText('Close without saving these draft changes?')))return;this.dialog.close();}
  options(kind){return this.work[kind].map(v=>({value:v.id,label:localize(v).title||localize(v).name||v.id}));}
  field(name,label,value,type='text',options=[]){
    if(contentFields[this.kind]?.includes(name))value=localize(this.item(),this.contentLanguage)[name];
    const base=`name="${name}" id="field-${name}"`;
    let input;
    if(type==='textarea'||type==='json')input=`<textarea ${base} rows="${type==='json'?4:5}" ${type==='json'?'class="code-input"':''}>${esc(type==='json'?JSON.stringify(value,null,2):value)}</textarea>`;
    else if(type==='select')input=`<select ${base}>${options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select>`;
    else if(type==='multi')input=`<div class="multi-options">${options.map(o=>`<label><input type="checkbox" name="${name}" value="${esc(o.value)}" ${(value||[]).includes(o.value)?'checked':''}>${esc(o.label)}</label>`).join('')}</div>`;
    else if(type==='checkbox')input=`<input ${base} type="checkbox" ${value?'checked':''}>`;
    else input=`<input ${base} type="${type}" value="${esc(value??'')}" ${type==='number'?'step="any"':''}>`;
    return `<div class="field ${['textarea','json','multi'].includes(type)?'wide':''}"><label for="field-${name}">${esc(label)}</label>${input}</div>`;
  }
  item(){return this.kind==='settings'?this.work.settings:this.work[this.kind][this.selected];}
  form(){const v=this.item();if(!v)return '<div class="empty-state">Add the first item to get started.</div>';const f=(...args)=>this.field(...args);let html='';
    if(this.kind==='chapters')html=f('title','Timeline label',v.title)+f('label','Displayed period',v.label)+f('startYear','Start year (blank for undated)',v.startYear,'number')+f('endYear','End year',v.endYear,'number')+f('layerId','Chapter map',v.layerId,'select',this.work.layers.filter(l=>['raster','image'].includes(l.type)).map(l=>({value:l.id,label:l.name})))+f('heading','Information heading',v.heading)+f('body','Information text',v.body,'textarea')+f('hold','Hold seconds',v.hold,'number')+f('fade','Fade seconds',v.fade,'number')+f('sourceNote','Source / date note',v.sourceNote)+f('camera','Chapter entrance camera (optional)',v.camera??null,'json')+f('introAnimation','Introduction animation (planned)',v.introAnimation??null,'json');
    if(this.kind==='features')html=f('title','Feature title',v.title)+f('pageId','Page',v.pageId,'select',this.options('pages'))+f('chapterId','Chapter (for Timeline)',v.chapterId,'select',this.options('chapters'))+f('year','Event year (optional)',v.year,'number')+f('revealAt','Reveal position 0–1 (when undated)',v.revealAt,'number')+f('color','Colour',v.color,'color')+f('body','Feature description',v.body,'textarea')+f('source','Source / evidence',v.source)+`<div class="wide shape-actions"><button type="button" data-draw="point" class="button secondary">Place point</button><button type="button" data-draw="region" class="button secondary">Draw region</button><button type="button" data-draw="line" class="button secondary">Draw line</button><button type="button" data-draw="edit" class="button secondary">Edit shape</button></div>`+f('geometry','Geometry (longitude, latitude)',v.geometry,'json');
    if(this.kind==='layers')html=f('name','Layer name',v.name)+f('type','Layer type',v.type,'select',['raster','image','geojson','chapter'].map(t=>({value:t,label:{raster:'Online map tiles',image:'Local map image',geojson:'Geographic features',chapter:'Chapter annotations'}[t]})))+f('group','Checklist group',v.group)+f('pages','Show in these pages',v.pages,'multi',this.options('pages'))+f('url','Source URL or local data path',v.url)+f('opacity','Default opacity 0–1',v.opacity,'number')+f('color','Feature colour',v.color||'#356b43','color')+f('weight','Line width',v.weight??3,'number')+f('filterField','Filter field (optional)',v.filterField)+f('filterValue','Filter value',v.filterValue)+f('minNativeZoom','Source minimum zoom',v.minNativeZoom??0,'number')+f('maxNativeZoom','Source maximum zoom',v.maxNativeZoom??18,'number')+f('source','Source identifier',v.source)+f('credit','Source credit / date',v.credit)+(v.type==='image'?f('bounds','Image bounds [[south,west],[north,east]]',v.bounds,'json'):'');
    if(this.kind==='pages')html=f('name','Page name',v.name)+f('icon','Sidebar icon',v.icon,'select',['history','train','water','map','land','building','pin','people'].map(i=>({value:i,label:i})))+f('description','Page heading',v.description)+f('body','Page introduction',v.body,'textarea')+f('hidden','Hide from navigation',v.hidden,'checkbox')+f('defaultLayers','Visible layers when opened',v.defaultLayers,'multi',this.options('layers'));
    if(this.kind==='settings')html=f('title','Atlas title',v.title)+f('subtitle','Subtitle',v.subtitle)+f('startChapter','Starting chapter',v.startChapter,'select',this.options('chapters'))+f('playbackDuration','Playback seconds for every chapter',v.playbackDuration??15,'number')+f('accent','Accent colour',v.accent,'color')+f('panelOpacity','Glass solidity 0.5–1',v.panelOpacity,'number')+f('panelRadius','Panel corner radius',v.panelRadius,'number')+f('fontScale','Text scale 0.8–1.5',v.fontScale,'number')+f('offlineOnly','Use downloaded maps by default',v.offlineOnly,'checkbox')+f('zoom','Opening zoom',v.zoom,'number')+f('minZoom','Minimum zoom',v.minZoom,'number')+f('maxZoom','Maximum zoom',v.maxZoom,'number')+f('contextMaxZoom','Detail outside study area',v.contextMaxZoom,'number')+f('center','Opening map centre [latitude,longitude]',v.center,'json')+f('aoi','Detailed study area [[south,west],[north,east]]',v.aoi,'json')+f('bounds','Outer navigation bounds',v.bounds,'json')+'<div class="wide"><button type="button" id="use-current-view" class="button secondary">Use current view as detailed area</button></div>';
    return f('contentLanguage','Content language',this.contentLanguage,'select',[{value:'EN',label:'EN'},{value:'JP',label:'JP'},{value:'CN',label:'CN'}])+html;
  }
  capture(){const item=this.item();if(!item)return;const form=$('#item-form',this.dialog);const fields=new FormData(form);const result={...item};
    for(const el of form.querySelectorAll('input[name],select[name],textarea[name]')){
      const name=el.name;if(name==='contentLanguage')continue;
      if(contentFields[this.kind]?.includes(name)&&this.contentLanguage!=='EN'){result.translations={...(result.translations||{}),[this.contentLanguage]:{...(result.translations?.[this.contentLanguage]||{}),[name]:el.value}};continue;}
      if(el.closest('.multi-options'))result[name]=fields.getAll(name);
      else if(el.type==='checkbox')result[name]=el.checked;
      else if(el.classList.contains('code-input')){try{result[name]=JSON.parse(el.value);}catch{throw Error('Please check the coordinates in '+name+'.');}}
      else if(el.type==='number'){if(el.value==='')result[name]=['year','startYear','endYear'].includes(name)?null:0;else result[name]=Number(el.value);}
      else result[name]=el.value;
    }
    // Empty multi-choice groups have no checked FormData entries.
    for(const box of form.querySelectorAll('.multi-options')){const first=box.querySelector('input');if(first)result[first.name]=fields.getAll(first.name);}
    if(this.kind==='settings')this.work.settings=result;else this.work[this.kind][this.selected]=result;
  }
  error(e){$('#editor-error',this.dialog).textContent=e.message;}
  render(){
    this.dialog.innerHTML=`<div class="editor-header"><div><span class="eyebrow">YOUR WORKSPACE</span><h2 id="editor-title">Edit atlas</h2></div><button id="editor-close" class="icon-button" aria-label="Close editor">${icon('close')}</button></div><div class="editor-tabs" role="tablist">${groups.map(k=>`<button type="button" role="tab" aria-selected="${this.kind===k}" data-kind="${k}">${titles[k]}</button>`).join('')}</div><div class="editor-layout"><aside class="editor-items">${this.kind==='settings'?'<p class="muted">Map limits and visual settings apply across the atlas.</p>':`<div class="item-actions"><button id="add-item" class="button">Add</button><button id="delete-item" class="button secondary">Delete</button></div><div class="record-list">${this.work[this.kind].map((v,i)=>`<button class="record ${i===this.selected?'selected':''}" data-record="${i}">${esc(localize(v).title||localize(v).name||v.id)}<small>${esc(localize(v).label||localize(v).group||v.id)}</small></button>`).join('')}</div><div class="item-actions"><button id="move-up" class="button secondary">Move up</button><button id="move-down" class="button secondary">Move down</button></div>${this.kind==='features'?'<label class="button secondary import-button">Import GeoJSON<input id="import-features" type="file" accept=".json,.geojson" hidden></label>':''}`}</aside><div class="editor-form-wrap"><form id="item-form">${this.form()}</form><div id="editor-error" role="alert"></div></div></div><div class="editor-footer"><span id="save-state">${this.dirty?'Unsaved changes':'Draft revision '+this.work.revision}</span><div><button id="save-draft" class="button">Save draft</button><button id="publish-draft" class="button secondary">Publish locally</button><button id="export-site" class="button secondary">Export visitor copy</button></div></div>`;
    $('#field-contentLanguage',this.dialog).onchange=e=>{try{const next=e.target.value;this.capture();this.contentLanguage=next;this.render();}catch(error){this.error(error);}};
    translateDOM(this.dialog);
    $('#editor-close',this.dialog).onclick=()=>this.close();
    this.dialog.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{try{this.capture();this.kind=b.dataset.kind;this.selected=0;this.render();}catch(e){this.error(e);}});
    this.dialog.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>{try{this.capture();this.selected=+b.dataset.record;this.render();}catch(e){this.error(e);}});
    $('#item-form',this.dialog).onsubmit=e=>e.preventDefault();$('#item-form',this.dialog).oninput=()=>{this.dirty=true;$('#save-state',this.dialog).textContent='Unsaved changes';};
    $('#add-item',this.dialog)?.addEventListener('click',()=>this.add());$('#delete-item',this.dialog)?.addEventListener('click',()=>this.remove());
    $('#move-up',this.dialog)?.addEventListener('click',()=>this.move(-1));$('#move-down',this.dialog)?.addEventListener('click',()=>this.move(1));
    $('#save-draft',this.dialog).onclick=()=>this.save();$('#publish-draft',this.dialog).onclick=()=>this.publish();$('#export-site',this.dialog).onclick=()=>this.export();
    this.dialog.querySelectorAll('[data-draw]').forEach(b=>b.onclick=()=>this.draw(b.dataset.draw));
    $('#use-current-view',this.dialog)?.addEventListener('click',()=>{const b=this.app.atlas.map.getBounds();$('#field-aoi',this.dialog).value=JSON.stringify([[b.getSouth(),b.getWest()],[b.getNorth(),b.getEast()]],null,2);this.dirty=true;});
    $('#import-features',this.dialog)?.addEventListener('change',e=>this.importFeatures(e.target.files[0]));
  }
  add(){try{this.capture();const kind=this.kind;let v;
    if(kind==='chapters')v={id:id('chapter'),title:'New chapter',label:'Date range to set',heading:'New chapter',body:'',startYear:null,endYear:null,layerId:'pale',duration:this.work.settings.playbackDuration??15,hold:2,fade:2,sourceNote:''};
    if(kind==='features'){const center=this.app.atlas.map.getCenter();v={id:id('feature'),title:'New feature',pageId:this.app.page,chapterId:this.app.playback.chapter.id,body:'',source:'',year:null,revealAt:.5,color:'#b57932',geometry:{type:'Point',coordinates:[center.lng,center.lat]}};}
    if(kind==='layers')v={id:id('layer'),name:'New layer',type:'geojson',url:'data/railroadsection.geojson',source:'N02-25',pages:['transport'],opacity:1,color:'#356b43',weight:3,group:'New group',credit:'',defaultVisible:false};
    if(kind==='pages')v={id:id('page'),name:'New subject',icon:'map',description:'New subject',body:'',defaultLayers:['pale'],hidden:false};
    this.work[kind].push(v);this.selected=this.work[kind].length-1;this.dirty=true;this.render();
  }catch(e){this.error(e);}}
  remove(){const v=this.item();if(!v)return;if(this.kind==='pages'&&v.id==='home'){this.error(Error('Home is the permanent timeline page.'));return;}if(this.kind==='chapters'&&this.work.chapters.length===1){this.error(Error('Keep at least one chapter.'));return;}if(!confirm(translateText('Delete '+(localize(v).title||localize(v).name)+' from this draft?')))return;
    const key=v.id;
    if(this.kind==='layers'&&this.work.chapters.some(c=>c.layerId===key)){this.error(Error('Choose another map for the chapters using this layer before deleting it.'));return;}
    this.work[this.kind].splice(this.selected,1);
    if(this.kind==='chapters'){this.work.features=this.work.features.filter(f=>f.chapterId!==key);if(this.work.settings.startChapter===key)this.work.settings.startChapter=this.work.chapters[0].id;}
    if(this.kind==='pages'){this.work.features=this.work.features.filter(f=>f.pageId!==key);this.work.layers.forEach(l=>l.pages=l.pages.filter(p=>p!==key));}
    if(this.kind==='layers')this.work.pages.forEach(p=>p.defaultLayers=p.defaultLayers.filter(l=>l!==key));
    this.selected=Math.max(0,this.selected-1);this.dirty=true;this.render();
  }
  move(direction){try{this.capture();const a=this.work[this.kind],n=this.selected+direction;if(n<0||n>=a.length)return;if(this.kind==='pages'&&(a[this.selected].id==='home'||a[n].id==='home'))return;[a[n],a[this.selected]]=[a[this.selected],a[n]];this.selected=n;this.dirty=true;this.render();}catch(e){this.error(e);}}
  async save(){try{this.capture();this.work=await this.app.repo.action('save',this.work);this.dirty=false;this.app.replaceDocument(clone(this.work));this.render();toast('Draft saved. The map now previews your changes.');return true;}catch(e){this.error(e);return false;}}
  async publish(){if(!await this.save())return;try{await this.app.repo.action('publish');toast('Published locally. Open Visitor edition to view the saved release.');}catch(e){this.error(e);}}
  async export(){try{const result=await this.app.repo.action('export');$('#editor-error',this.dialog).textContent='Published visitor copy exported to: '+result.path;}catch(e){this.error(e);}}
  draw(mode){try{this.capture();const item=this.item();this.dialog.close();const banner=$('#draw-banner');banner.hidden=false;$('#draw-instruction').textContent=mode==='edit'?'Drag the handles, then choose Use shape.':'Click the map to draw. Complete a region by clicking its first point.';$('#draw-finish').hidden=mode!=='edit';
    let drawing;const end=geometry=>{if(geometry){item.geometry=geometry;this.dirty=true;}drawing.cleanup();banner.hidden=true;this.render();this.dialog.showModal();};
    drawing=this.app.atlas.draw(mode,item.geometry,geometry=>end(geometry));$('#draw-finish').onclick=()=>drawing.finish();$('#draw-cancel').onclick=()=>end(null);
  }catch(e){this.error(e);}}
  async importFeatures(file){if(!file)return;try{this.capture();const data=JSON.parse(await file.text());const list=data.type==='FeatureCollection'?data.features:data.type==='Feature'?[data]:[{type:'Feature',geometry:data,properties:{}}];for(const [i,f] of list.entries()){
      if(!['Point','LineString','Polygon'].includes(f.geometry?.type))throw Error('Import supports points, lines and polygons. Split multi-geometries before importing.');
      this.work.features.push({id:id('import')+'-'+i,title:f.properties?.title||f.properties?.name||'Imported feature '+(i+1),body:f.properties?.description||'',source:file.name,pageId:this.app.page,chapterId:this.app.playback.chapter.id,year:null,revealAt:.5,color:'#356b43',geometry:f.geometry});
    }this.dirty=true;this.selected=this.work.features.length-1;this.render();}catch(e){this.error(e);}}
}
