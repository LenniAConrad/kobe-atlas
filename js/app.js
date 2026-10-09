import {renderPopulation} from './population.js?v=20261009l';
import {renderEvents,chapterEvents} from './events.js?v=20261009l';
import {renderRisk} from './risk.js?v=20261009l';
import {Timeline} from './timeline.js?v=20261009l';
import {t,pageName,applyLanguage,bindLanguage,initTranslations,localize,translateText,translateDOM} from './language.js?v=20261009l';
import {$,esc,icon,prose,toast,applyTheme} from './ui.js?v=20261009l';
import {Repository} from './api.js?v=20261009l';
import {Playback} from './playback.js?v=20261009l';
import {AtlasMap} from './map.js?v=20261009l';
import {Editor} from './editor.js?v=20261009l';
import {registerAgentTools} from './agent-tools.js?v=20261009l';

class App{
  async start(){await initTranslations();this.timeline=new Timeline($('#chapter-track'));this.repo=new Repository();this.doc=await this.repo.init();this.page='home';this.hazardMode='earthquake';this.populationYear=2020;this.overrides={};this.infoOpen=true;this.layerCollapsed=false;this.atlas=new AtlasMap(this.doc,this.repo,toast);this.editor=new Editor(this);this.createPlayback();this.bind();this.renderStructure();this.render();let last=performance.now();const loop=now=>{const dt=Math.min((now-last)/1000,.25);last=now;this.playback.tick(dt);requestAnimationFrame(loop);};requestAnimationFrame(loop);window.atlasApp=this;registerAgentTools(this);}
  createPlayback(old){this.playback=new Playback(this.doc.chapters,old?.chapter.id||this.doc.settings.startChapter,this.doc.settings.playbackDuration??15);if(old){this.playback.progress=old.progress;this.playback.direction=old.direction;}this.playback.on(()=>this.render());}
  replaceDocument(doc){const old=this.playback;this.doc=doc;if(!doc.pages.some(p=>p.id===this.page))this.page='home';this.atlas.update(doc);this.createPlayback(old);this.overrides={};this.renderStructure();this.render();}
  viewKey(){return this.page==='disaster'?'disaster-'+this.hazardMode:this.page==='population'?'population-'+this.populationYear:this.page;}
  visibleLayers(){return this.doc.layers.filter(l=>(l.pages||[]).includes(this.page)&&(!l.hazardMode||l.hazardMode===this.hazardMode)&&(!l.censusYear||l.censusYear===this.populationYear));}
  visibility(){const page=this.doc.pages.find(p=>p.id===this.page),over=this.overrides[this.viewKey()];const f=layer=>{
      if(!(layer.pages||[]).includes(this.page)||(layer.hazardMode&&layer.hazardMode!==this.hazardMode)||(layer.censusYear&&layer.censusYear!==this.populationYear))return 0;
      if(over)return over[layer.id]?1:0;
      if(this.page==='home')return layer.type==='chapter'||layer.id===this.playback.chapter.layerId?1:0;
      return (page.defaultLayers||[]).includes(layer.id)?1:0;
    };f.auto=this.page==='home'&&!over;return f;
  }
  manual(){if(!this.overrides[this.viewKey()]){const visibility=this.visibility();this.overrides[this.viewKey()]=Object.fromEntries(this.visibleLayers().map(l=>[l.id,!!visibility(l)]));}return this.overrides[this.viewKey()];}
  setPage(id){if(this.page===id){this.collapseNav();return;}if(id!=='home')this.playback.pause();this.page=id;this.atlas.pageContext(id);this.collapseNav();this.renderStructure();this.render();}
  collapseNav(){const side=$('#sidebar');side.classList.remove('expanded');side.classList.add('suppress-hover');side.scrollLeft=0;$('#menu-toggle').setAttribute('aria-expanded','false');}
  bind(){
    const controls={'back-play':'back','forward-play':'forward','play-pause':'play','info-toggle':'info','info-close':'close','layers-collapse':'chevron','zoom-in':'plus','zoom-out':'minus','reset-view':'focus'};for(const[id,name]of Object.entries(controls))$('#'+id).innerHTML=icon(name);
    $('#edit-button').innerHTML=icon('edit')+'<span class="nav-text" data-i18n="edit">Edit atlas</span>';$('#sources-button').innerHTML=icon('source')+'<span class="nav-text" data-i18n="sources">Sources & versions</span>';
    bindLanguage(()=>{this.atlas.update(this.doc);this.renderStructure();this.render();this.collapseNav();translateDOM(document.body);});
    $('#back-play').onclick=()=>this.playback.navigate(-1);$('#forward-play').onclick=()=>this.playback.navigate(1);$('#play-pause').onclick=()=>this.playback.toggle();
    $('#info-toggle').onclick=()=>{this.infoOpen=!this.infoOpen;this.render();};$('#info-close').onclick=()=>{this.infoOpen=false;this.render();};
    $('#chapter-progress').oninput=e=>this.playback.seek(this.playback.index,+e.target.value/1000);
    $('#zoom-in').onclick=()=>this.atlas.map.zoomIn();$('#zoom-out').onclick=()=>this.atlas.map.zoomOut();$('#reset-view').onclick=()=>this.atlas.chapterCamera.reset(this.doc.settings);
    $('#menu-toggle').onclick=()=>{const side=$('#sidebar');side.classList.remove('suppress-hover');side.classList.toggle('expanded');$('#menu-toggle').setAttribute('aria-expanded',String(side.classList.contains('expanded')));};
    $('#sidebar').onmouseleave=()=>{if(matchMedia('(hover: hover)').matches)$('#sidebar').classList.remove('suppress-hover','expanded');};
    $('#all-layers').onchange=e=>{const on=e.target.checked;this.overrides[this.viewKey()]=Object.fromEntries(this.visibleLayers().map(l=>[l.id,on]));this.render();};
    $('#follow-chapter').onclick=()=>{delete this.overrides[this.viewKey()];this.render();};
    $('#layers-collapse').onclick=()=>{this.layerCollapsed=!this.layerCollapsed;$('#layer-body').hidden=this.layerCollapsed;$('#layers-collapse').setAttribute('aria-expanded',String(!this.layerCollapsed));$('#layer-panel').classList.toggle('collapsed',this.layerCollapsed);};
    $('#offline-toggle').onchange=e=>{this.atlas.setOffline(e.target.checked);this.updateCacheNotes();};
    $('#edit-button').onclick=()=>this.editor.open();$('#sources-button').onclick=()=>this.sources();
    document.addEventListener('keydown',e=>{if(e.code==='Space'&&this.page==='home'&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();this.playback.toggle();}});
    window.addEventListener('beforeunload',e=>{if(this.editor.dirty){e.preventDefault();e.returnValue='';}});

  }
  renderStructure(){this.atlas.pageContext(this.page);applyTheme(this.doc.settings);$('#atlas-title').innerHTML=esc(localize(this.doc.settings).title)+`<span> / ${esc(localize(this.doc.settings).subtitle)}</span>`;document.title=this.doc.settings.title+' · '+this.doc.settings.subtitle;
    $('#edition-label').textContent=this.repo.local&&!this.repo.published?t('working'):t('visitor');$('#edit-button').hidden=!this.repo.local||this.repo.published;
    $('#view-label').textContent=pageName(this.doc.pages.find(p=>p.id===this.page));$('#atlas').classList.toggle('subject-view',this.page!=='home');
    $('#page-nav').innerHTML=this.doc.pages.filter(p=>!p.hidden).map(p=>`<button class="nav-item ${p.id===this.page?'selected':''}" data-page="${esc(p.id)}" aria-label="${esc(pageName(p))}" ${p.id===this.page?'aria-current="page"':''} title="${esc(pageName(p))}">${icon(p.icon)}<span class="nav-text">${esc(pageName(p))}</span></button>`).join('');$('#page-nav').querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>this.setPage(b.dataset.page));
    const progress=$('#chapter-progress');this.timeline.active=null;
    $('#chapter-track').innerHTML=this.doc.chapters.map((original,i)=>{const c=localize(original);return `<div class="chapter-stop ${i<this.doc.chapters.findIndex(x=>x.id===this.doc.settings.startChapter)?'context-chapter':''}" data-chapter="${i}"><button class="chapter-select" title="${esc(c.title+' / '+c.label)}"><span class="chapter-title">${esc(c.title)}</span><span class="chapter-date">${esc(c.label)}</span></button></div>`;}).join('');
    $('#chapter-track').querySelectorAll('[data-chapter]').forEach(b=>b.querySelector('button').onclick=()=>{const same=this.playback.index===+b.dataset.chapter;this.playback.seek(+b.dataset.chapter);if(same)this.atlas.chapterCamera.enter(this.playback.chapter,true);});
    $('#chapter-track').children[this.playback.index].append(progress);
    const page=localize(this.doc.pages.find(p=>p.id===this.page));$('#subject-title').textContent=page.description||page.name;$('#subject-body').innerHTML=prose(page.body||'Add a description in the editor.');
    if(this.page==='transport'){
      const b=document.createElement('button');b.className='button secondary';b.textContent=translateText('Show airports & Bay Shuttle');
      b.onclick=()=>{this.atlas.pageContext('transport');this.atlas.map.fitBounds([[34.42,135.18],[34.8,135.46]],{paddingTopLeft:[60,150],paddingBottomRight:[20,220],maxZoom:11});};$('#subject-body').append(b);
    }
    if(page.sources?.length){const links=document.createElement('p');links.className='source-note';for(const source of page.sources)if(/^https:\/\//.test(source.url)){const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=source.title;links.append(a,document.createTextNode(' · '));}$('#subject-body').append(links);}
    renderRisk(this);renderPopulation(this);renderEvents(this);$('#atlas').classList.toggle('has-switcher',['disaster','population'].includes(this.page));
    let group='';$('#layer-list').innerHTML=this.visibleLayers().map(l=>{let heading='';if(l.group!==group){group=l.group;heading=`<div class="layer-group">${esc(translateText(group||'Layers'))}</div>`;}return heading+`<div class="layer-row" data-layer="${esc(l.id)}"><label><input type="checkbox" value="${esc(l.id)}"><span class="layer-swatch" style="background:${/^#[\da-f]{6}$/i.test(l.color)?l.color:'#698895'}"></span><span>${esc(localize(l).name)}</span></label><input class="layer-opacity" type="range" min="0" max="100" value="${(l.opacity??1)*100}" aria-label="${esc(localize(l).name)} opacity" title="Layer opacity"></div>`;}).join('');
    $('#layer-list').querySelectorAll('input[type=checkbox]').forEach(el=>el.onchange=()=>{this.manual()[el.value]=el.checked;this.render();});
    $('#layer-list').querySelectorAll('.layer-opacity').forEach(el=>el.oninput=()=>{const l=this.doc.layers.find(l=>l.id===el.closest('[data-layer]').dataset.layer);l.opacity=+el.value/100;this.render();});
    $('#offline-toggle').checked=this.atlas.offline;this.updateCacheNotes();this.infoSignature='';applyLanguage();translateDOM(document.body);
  }
  updateCacheNotes(){
    $('#layer-status').textContent=t(this.atlas.offline?'localStatus':'onlineStatus');
    $('#layer-list').querySelectorAll('.cache-note').forEach(n=>n.remove());
    if(this.atlas.offline)for(const l of this.visibleLayers())if(l.type==='raster'&&!this.repo.cache[l.id]?.count){const row=$(`[data-layer="${l.id}"]`);if(row){const note=document.createElement('span');note.className='cache-note';note.textContent=t('missing');row.append(note);}}
  }
  render(){if(!this.playback)return;const p=this.playback,c=localize(p.chapter),home=this.page==='home';$('#timeline-panel').hidden=!home;$('#info-panel').hidden=!home||!this.infoOpen;$('#subject-panel').hidden=home;
    $('#info-toggle').classList.toggle('active',this.infoOpen);$('#info-toggle').setAttribute('aria-pressed',String(this.infoOpen));const playButton=$('#play-pause'),playState=p.playing?'pause':'play';if(playButton.dataset.state!==playState){playButton.innerHTML=icon(playState);playButton.dataset.state=playState;}playButton.setAttribute('aria-label',t(playState));playButton.title=t(playState);$('#back-play').classList.toggle('direction-active',p.playing&&p.direction===-1);$('#forward-play').classList.toggle('direction-active',p.playing&&p.direction===1);
    for(const [id,direction] of [['back-play',-1],['forward-play',1]]){const button=$('#'+id);const label=p.playing?t(direction===-1?'backward':'forward'):t(direction===-1?'previous':'next');button.setAttribute('aria-label',label);button.title=label;button.disabled=!p.playing&&(p.index+direction<0||p.index+direction>=p.chapters.length);}
    $('#chapter-progress').value=Math.round(p.progress*1000);$('#chapter-progress').style.setProperty('--progress',p.progress*100+'%');
    $('#chapter-track').querySelectorAll('[data-chapter]').forEach(b=>{const active=+b.dataset.chapter===p.index;b.classList.toggle('active',active);b.querySelector('button').setAttribute('aria-pressed',String(active));if(active&&$('#chapter-progress').parentElement!==b)b.append($('#chapter-progress'));});
    this.timeline.select(p.index);
    if(this.infoSignature!==c.id){this.infoSignature=c.id;$('#info-date').textContent=c.label;$('#info-heading').textContent=c.heading||c.title;$('#info-body').innerHTML=prose(c.body)+chapterEvents(this.doc,c.id);$('#info-source').textContent=c.sourceNote||'';$('.info-scroll').scrollTop=0;translateDOM($('#info-panel'));}
    const visible=this.visibility();const listed=this.visibleLayers();const n=listed.filter(l=>visible(l)).length;$('#all-layers').checked=n===listed.length&&n>0;$('#all-layers').indeterminate=n>0&&n<listed.length;$('#follow-chapter').textContent=t(home?'follow':'defaults');$('#follow-chapter').classList.toggle('is-default',!this.overrides[this.viewKey()]);
    $('#layer-list').querySelectorAll('input[type=checkbox]').forEach(el=>{const l=this.doc.layers.find(l=>l.id===el.value);el.checked=!!visible(l);el.closest('.layer-row').classList.toggle('enabled',el.checked);});
    this.atlas.render(this.page,p,visible);this.atlas.chapterCamera.enter(home?p.chapter:null);
  }
  async sources(){const dialog=$('#sources-dialog');let summary;try{summary=await(await fetch('data/source-summary.json')).json();}catch{summary={datasets:[]};}
    dialog.innerHTML=`<div class="editor-header"><div><span class="eyebrow">ATLAS NOTES</span><h2 id="sources-title">Sources & versions</h2></div><button class="icon-button" id="sources-close" aria-label="Close sources">${icon('close')}</button></div><div class="sources-content"><p>Map dates and data dates are kept with each layer. Event dates distinguish tradition, approximate periods and documented dates. Shaded event areas are illustrative, not surveyed historical boundaries.</p>${summary.datasets.map(d=>`<h3>${esc(d.name)}</h3><p>Railway sections: ${d.counts.RailroadSection.retained.toLocaleString()} · Stations: ${d.counts.Station.retained.toLocaleString()} in the study context.</p><dl>${Object.entries(d.codes).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`).join('')}<h3>Kobe city and ward boundaries</h3><p>Modern administrative boundaries dated 1 January 2025. Nine wards, with a dissolved city outline; not historical boundaries. Processed from MLIT N03, CC BY 4.0.</p><p><a href="data/kobe-boundaries-source.json" target="_blank" rel="noopener">Boundary provenance and processing record</a> · <a href="source-docs/N03-2025.html" target="_blank" rel="noopener">Archived boundary definitions</a></p><h3>Historical events and artwork</h3><p><a href="data/events-source.json" target="_blank" rel="noopener">Event research and photograph credits</a> · <a href="data/awaji-artwork-source.json" target="_blank" rel="noopener">Awaji illustration and Kuniumi sources</a></p><h3>Subject-map source records</h3><p><a href="data/geology-source.json" target="_blank" rel="noopener">Mountains &amp; bay: geological history sources</a></p><p><a href="data/timeline-source.json" target="_blank" rel="noopener">Timeline periods, imagery dates & Ikuta sources</a></p><div class="source-links"><a href="data/transport-source.json" target="_blank" rel="noopener">Airports, terminals & ferry</a><a href="data/highways-source.json" target="_blank" rel="noopener">Highways · 2025</a><a href="data/zoning-source.json" target="_blank" rel="noopener">Zoning · FY2024</a><a href="data/faults-source.json" target="_blank" rel="noopener">Faults · GSJ / AIST</a><a href="data/hazards-source.json" target="_blank" rel="noopener">Flood, tsunami & landslides</a><a href="data/population-source.json" target="_blank" rel="noopener">Census density · 1960–2020</a><a href="data/water-source.json" target="_blank" rel="noopener">Water systems & dated supply areas</a></div><h3>Local reference documents</h3><div class="source-links"><a href="source-docs/N02-2025.html" target="_blank" rel="noopener">Railway attribute definitions</a><a href="source-docs/InstitutionTypeCd.html" target="_blank" rel="noopener">Railway operator codes</a><a href="source-docs/RailwayClassCd.html" target="_blank" rel="noopener">Railway type codes</a></div><p class="muted">The originals and full source catalog are retained in the project’s sources folder.</p>${this.repo.local&&!this.repo.published?`<h3>Local visitor edition</h3><p>Publishing from the editor saves a separate visitor version on this computer.</p><a class="button" href="?published=1" target="_blank" rel="noopener">Open visitor edition</a><h3>Restore a draft</h3><p>Every save keeps a backup. Restoring one creates a new draft revision.</p><select id="backup-list" aria-label="Choose backup"><option value="">Choose a saved backup</option></select><button id="restore-backup" class="button secondary">Restore selected backup</button>`:''}</div>`;
    $('#sources-close',dialog).onclick=()=>dialog.close();dialog.showModal();translateDOM(dialog);
    if(this.repo.local&&!this.repo.published){const r=await fetch('api/backups');const list=await r.json();$('#backup-list',dialog).innerHTML='<option value="">Choose a saved backup</option>'+list.map(n=>`<option>${esc(n)}</option>`).join('');$('#restore-backup',dialog).onclick=async()=>{const name=$('#backup-list',dialog).value;if(!name)return;if(!confirm('Restore this backup into the draft? The current draft will be backed up first.'))return;try{const doc=await this.repo.action('restore',{name});this.replaceDocument(doc);dialog.close();toast('Draft restored.');}catch(e){toast(e.message);}};}
  }
}
const app=new App();app.start().catch(e=>{console.error(e);$('#startup-error').hidden=false;$('#startup-error').textContent=e.message;});
