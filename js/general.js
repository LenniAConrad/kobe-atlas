import {esc} from './ui.js?v=20261009p';
import {getLanguage} from './language.js?v=20261009p';

let factsRequest;
const locales={EN:'en-GB',JP:'ja-JP',CN:'zh-CN'};
const field=(record,key,language)=>record?.translations?.[language]?.[key]??record?.[key]??'';
const numeric=value=>typeof value==='number'&&Number.isFinite(value);
const number=(value,language,decimals=0)=>numeric(value)?new Intl.NumberFormat(locales[language],{maximumFractionDigits:decimals}).format(value):'—';
const date=(value,language)=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Intl.DateTimeFormat(locales[language],{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z')):String(value||'');

function loadFacts(){
  if(!factsRequest)factsRequest=fetch('data/general-facts.json',{cache:'no-cache'}).then(response=>{
    if(!response.ok)throw Error('General facts unavailable');
    return response.json();
  }).catch(error=>{factsRequest=null;throw error;});
  return factsRequest;
}

export function generalContent(facts,language=getLanguage()){
  const w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[language]);
  const sources=facts.sources||[];
  const source=id=>{
    const index=sources.findIndex(item=>item.id===id),item=sources[index];
    if(!item||!/^https:\/\//.test(item.url||''))return '';
    return `<a class="general-reference" href="${esc(item.url)}" target="_blank" rel="noopener" aria-label="${esc(w('Source','出典','来源')+': '+field(item,'title',language))}">[${index+1}]</a>`;
  };
  const fact=(label,value,note='',reference='')=>`<div class="general-fact"><dt>${esc(label)} ${reference}</dt><dd>${esc(value)}${note?`<small>${esc(note)}</small>`:''}</dd></div>`;
  const population=facts.population||{},area=facts.area||{},climate=facts.climate||{},zone=facts.timeZone||{};
  const populationDate=date(population.date,language),areaDate=date(area.date,language);
  const zoneName=[zone.name,zone.offset].filter(Boolean).join(' · ');
  const citySummary=field(facts.city,'summary',language);
  let html=citySummary?`<p class="general-city-summary">${esc(citySummary)}</p>`:'';
  html+=`<dl class="general-fact-grid">`;
  html+=fact(w('Population','人口','人口'),number(population.value,language),populationDate,source(population.sourceId));
  html+=fact(w('City area','市域面積','全市面积'),number(area.value,language,2)+' km²',areaDate,source(area.sourceId));
  html+=fact(w('Time zone','標準時','时区'),zoneName,w('Same time all year','年間を通して同じ時刻','全年时间不变'),source(zone.sourceId));
  html+=fact(w('Local government','行政区','行政区'),w('9 wards','9行政区','9个区'),field(facts.city,'region',language));
  if(numeric(facts.households?.value))html+=fact(w('Households','世帯数','户数'),number(facts.households.value,language),date(facts.households.date,language),source(facts.households.sourceId));
  if(numeric(facts.density?.value))html+=fact(w('Citywide density','市域全体の人口密度','全市人口密度'),number(facts.density.value,language)+' '+w('people/km²','人/km²','人/km²'),w('Population ÷ city area','人口÷市域面積','人口÷全市面积'),source(facts.density.sourceId));
  html+=`</dl>`;
  const populationNote=field(population,'note',language);
  if(populationNote)html+=`<p class="general-note">${esc(populationNote)}</p>`;
  const climateSummary=field(climate,'summary',language);
  html+=`<section class="general-climate" aria-labelledby="general-climate-title"><h3 id="general-climate-title">${w('Climate','気候','气候')} ${source(climate.sourceId)}</h3>`;
  if(climateSummary)html+=`<p>${esc(climateSummary)}</p>`;
  html+=`<dl class="general-fact-grid">`;
  if(numeric(climate.meanTemperature))html+=fact(w('Annual mean','年平均気温','年均气温'),number(climate.meanTemperature,language,1)+' °C');
  if(numeric(climate.annualRainfall))html+=fact(w('Annual rainfall','年間降水量','年降水量'),number(climate.annualRainfall,language,1)+' mm');
  if(numeric(climate.januaryTemperature))html+=fact(w('January mean','1月の平均気温','1月平均气温'),number(climate.januaryTemperature,language,1)+' °C');
  if(numeric(climate.augustTemperature))html+=fact(w('August mean','8月の平均気温','8月平均气温'),number(climate.augustTemperature,language,1)+' °C');
  html+=`</dl><p class="general-note">${esc(w('Weather averages','気候の平年値','气候平均值')+' · '+(climate.period||''))}</p></section>`;

  const wards=facts.wards||[];
  if(wards.length){
    html+=`<details class="general-breakdown" id="general-wards"><summary>${w('Area and population by ward','区別の面積と人口','各区面积与人口')}</summary><div class="general-table-wrap"><table><caption>${esc(w('Population','人口','人口'))} · ${esc(populationDate)}<br>${esc(w('Area','面積','面积'))} · ${esc(areaDate)} ${source(area.sourceId)}</caption><thead><tr><th scope="col">${w('Ward','区','区')}</th><th scope="col">km²</th><th scope="col">${w('People','人口','人口')}</th></tr></thead><tbody>`;
    for(const ward of wards)html+=`<tr data-ward="${esc(ward.id)}"><th scope="row">${esc(field(ward,'name',language))}</th><td>${number(ward.area,language,2)}</td><td>${number(ward.population,language)}</td></tr>`;
    html+=`</tbody></table></div>`;
    const wardAreaNote=field(facts,'wardAreaNote',language)||field(area,'note',language);
    if(wardAreaNote)html+=`<p class="general-note">${esc(wardAreaNote)}</p>`;
    html+=`</details>`;
  }
  const reclamation=facts.reclamation||{},islands=reclamation.areas||[];
  if(islands.length){
    html+=`<details class="general-breakdown" id="general-reclamation"><summary>${w('Reclaimed island areas','人工島の面積','填海岛屿面积')}</summary>`;
    const reclamationNote=field(reclamation,'note',language);
    if(reclamationNote)html+=`<p class="general-note">${esc(reclamationNote)}</p>`;
    html+=`<div class="general-table-wrap"><table><caption>${w('Selected reclamation projects','主な埋立事業','部分填海项目')}</caption><thead><tr><th scope="col">${w('Island / phase','人工島・期','岛屿／阶段')}</th><th scope="col">km²</th></tr></thead><tbody>`;
    for(const island of islands)html+=`<tr data-reclamation="${esc(island.id)}"><th scope="row">${esc(field(island,'name',language))} ${source(island.sourceId)}${island.dates?`<small>${esc(field(island,'dates',language))}</small>`:''}</th><td>${number(island.area,language,2)}</td></tr>`;
    if(numeric(reclamation.subtotal))html+=`<tr class="general-subtotal"><th scope="row">${w('Selected projects total','掲載事業の合計','所列项目合计')}</th><td>${number(reclamation.subtotal,language,2)}</td></tr>`;
    html+=`</tbody></table></div>`;
    const subtotalNote=field(reclamation,'subtotalNote',language);
    if(subtotalNote)html+=`<p class="general-note">${esc(subtotalNote)}</p>`;
    const landfill=reclamation.landfill;
    if(landfill&&numeric(landfill.area)){
      html+=`<div class="general-landfill"><h4>${w('Waste disposal landfill','廃棄物の埋立処分場','废弃物填埋场')} ${source(landfill.sourceId)}</h4><p>${esc(field(landfill,'name',language))} · <strong>${number(landfill.area,language,2)} km²</strong></p>`;
      const landfillNote=field(landfill,'note',language);
      if(landfillNote)html+=`<p class="general-note">${esc(landfillNote)}</p>`;
      html+=`</div>`;
    }
    html+=`</details>`;
  }
  html+=`<details class="general-breakdown general-sources"><summary>${w('Sources and dates','出典と日付','来源与日期')}</summary><ol>`;
  for(const item of sources){
    if(!/^https:\/\//.test(item.url||''))continue;
    html+=`<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(field(item,'title',language))}</a></li>`;
  }
  html+=`</ol>`;
  if(numeric(facts.census?.value))html+=`<p class="general-note">${esc(field(facts.census,'label',language))}: ${number(facts.census.value,language)} · ${esc(date(facts.census.date,language))} ${source(facts.census.sourceId)}</p>`;
  html+=`<p class="general-note">${esc(w('Checked','確認日','核查日期')+' · '+date(String(facts.updatedAt||'').slice(0,10),language))}</p></details>`;
  return html;
}

export async function renderGeneral(app){
  document.querySelector('#general-facts')?.remove();
  if(app.page!=='general')return;
  const language=getLanguage(),w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[language]);
  const panel=document.createElement('section');panel.id='general-facts';panel.className='general-facts';panel.setAttribute('data-no-translate','');
  panel.setAttribute('aria-label',w('Kobe facts','神戸の基本情報','神户基本信息'));
  panel.setAttribute('aria-busy','true');
  panel.innerHTML=`<p class="general-note" role="status">${w('Loading city facts…','基本情報を読み込み中…','正在加载城市信息…')}</p>`;
  document.querySelector('#subject-body').append(panel);
  const showOverview=()=>{
    const bounds=app.doc.pages.find(page=>page.id==='general')?.overviewBounds;
    if(!bounds)return;
    const button=document.createElement('button');button.className='button secondary general-overview';button.textContent=w('Show Kobe','神戸全域を表示','显示神户全域');
    button.onclick=()=>{
      const mobile=matchMedia('(max-width:700px)').matches;
      app.atlas.map.fitBounds(bounds,{paddingTopLeft:mobile?[60,65]:[85,100],paddingBottomRight:mobile?[10,230]:[40,240],maxZoom:12});
    };
    panel.prepend(button);
  };
  showOverview();
  try{
    const facts=await loadFacts();
    if(app.page!=='general'||getLanguage()!==language||!panel.isConnected)return;
    panel.innerHTML=generalContent(facts,language);
    showOverview();
  }catch{
    if(app.page!=='general'||getLanguage()!==language||!panel.isConnected)return;
    panel.innerHTML=`<p class="general-note" role="status">${w('City facts could not load.','基本情報を読み込めませんでした。','城市信息加载失败。')}</p>`;
    showOverview();
    const retry=document.createElement('button');retry.className='text-button';retry.textContent=w('Try again','再読み込み','重试');retry.onclick=()=>renderGeneral(app);panel.append(retry);
  }finally{if(panel.isConnected)panel.setAttribute('aria-busy','false');}
}
