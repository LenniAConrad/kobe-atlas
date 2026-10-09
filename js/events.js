import {getLanguage,localize} from './language.js?v=20261009o';
import {esc,prose} from './ui.js?v=20261009o';

const word=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[getLanguage()]);
const safeLink=url=>/^https:\/\//.test(url||'')?url:null;
export function eventPopup(original){
  const f=localize(original),el=document.createElement('article');el.className='feature-popup event-popup';
  el.innerHTML=`<span class="eyebrow">${esc(f.dateLabel||String(f.year))}</span><h3>${esc(f.title)}</h3>${prose(f.body)}<p class="event-location">${esc(f.location||'')}</p>${f.locationNote?`<p class="source-note">${esc(f.locationNote)}</p>`:''}`;
  const media=f.media;
  if(media&&/^data\/event-media\/[a-z0-9_-]+\.(jpg|png|webp)$/.test(media.path)){
    const figure=document.createElement('figure');const img=document.createElement('img');img.src=media.path;img.alt=f.imageCaption||media.caption;img.loading='lazy';img.decoding='async';figure.append(img);
    const caption=document.createElement('figcaption');caption.textContent=f.imageCaption||media.caption;figure.append(caption);
    const credit=document.createElement('p');credit.className='source-note';credit.textContent=media.artist+' · '+media.license+' · ';
    for(const [label,url] of [[media.sourceName||word('Commons file','コモンズの画像','Commons图片'),media.page], [word('License','ライセンス','许可'),media.licenseUrl]])if(safeLink(url)){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent=label;credit.append(a,document.createTextNode(' '));}
    figure.append(credit);el.append(figure);
  }
  const sources=document.createElement('p');sources.className='source-note';sources.textContent=word('Sources: ','出典：','来源：');
  for(const source of f.sources||[])if(safeLink(source.url)){const a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noopener';sources.append(a,document.createTextNode(' · '));}
  el.append(sources);return el;
}
export function eventTooltip(original){const f=localize(original),el=document.createElement('div');el.className='event-preview';el.innerHTML=`<strong>${esc(f.dateLabel)} · ${esc(f.title)}</strong><div>${esc(f.body.split('\n')[0])}</div>`;return el;}
export function focusEvent(app,id){
  const f=app.doc.features.find(f=>f.id===id);if(!f)return;
  const layer=app.atlas.featureInstances.get(id);if(!layer)return;
  app.atlas.map.fitBounds(layer.getBounds(),{paddingTopLeft:[85,135],paddingBottomRight:[30,260],maxZoom:f.geometry.type==='Point'?16:13});
  layer.eachLayer(item=>item.openPopup());
}
export function renderEvents(app){
  if(app.page!=='events')return;
  const root=document.querySelector('#subject-body'),events=app.doc.features.filter(f=>f.event).sort((a,b)=>a.year-b.year);
  const input=document.createElement('input');input.type='search';input.className='event-search';input.placeholder=word('Find an event or place','出来事・場所を検索','搜索事件或地点');input.setAttribute('aria-label',input.placeholder);
  const count=document.createElement('p');count.className='event-count';count.setAttribute('aria-live','polite');
  const list=document.createElement('div');list.className='event-list';
  function fill(){const q=input.value.trim().toLocaleLowerCase();const found=events.filter(original=>{const f=localize(original);return [f.title,f.location,f.dateLabel,f.body].join(' ').toLocaleLowerCase().includes(q);});count.textContent=word(`${found.length} events`,`${found.length}件の出来事`,`${found.length}个事件`);list.replaceChildren();for(const original of found){const f=localize(original),button=document.createElement('button');button.className='event-list-item';button.dataset.eventId=f.id;button.innerHTML=`<span>${esc(f.dateLabel)}</span><strong>${esc(f.title)}</strong><small>${esc(f.location)}</small>`;button.onclick=()=>focusEvent(app,f.id);list.append(button);}}
  const overview=document.createElement('button');overview.className='button secondary';overview.textContent=word('Show all events','すべての出来事を表示','显示全部事件');overview.onclick=()=>{const bounds=window.L.latLngBounds([]);for(const f of events){const layer=app.atlas.featureInstances.get(f.id);if(layer)bounds.extend(layer.getBounds());}if(bounds.isValid())app.atlas.map.fitBounds(bounds,{paddingTopLeft:[85,100],paddingBottomRight:[40,240],maxZoom:12});};
  input.oninput=fill;root.append(overview,input,count,list);fill();
}
export function chapterEvents(doc,chapterId){
  const events=doc.features.filter(f=>f.event&&f.chapterId===chapterId).sort((a,b)=>a.year-b.year);
  if(!events.length)return '';
  return `<details class="chapter-events"><summary>${esc(word(`Events in this period (${events.length})`,`この時期の出来事（${events.length}件）`,`本时段事件（${events.length}个）`))}</summary><ul>${events.map(original=>{const f=localize(original);return `<li><strong>${esc(f.dateLabel)}</strong> ${esc(f.title)}</li>`;}).join('')}</ul></details>`;
}
