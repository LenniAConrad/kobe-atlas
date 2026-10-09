import {esc} from './ui.js?v=20261009l';
import {getLanguage,localize} from './language.js?v=20261009l';
export const densityClasses=[[4000,'#ffffb2','0–3,999'],[8000,'#fecc5c','4,000–7,999'],[12000,'#fd8d3c','8,000–11,999'],[16000,'#f03b20','12,000–15,999'],[Infinity,'#bd0026','16,000+']];
export function populationLayer(data,layer,pane){
 const lang=getLanguage(),w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
 return L.geoJSON(data,{pane,style:f=>({color:'#67432f',weight:.7,fillColor:f.properties.density===null?'#999':densityClasses.find(c=>f.properties.density<c[0])[1],fillOpacity:.68}),onEachFeature:(f,l)=>{
 const p=f.properties,d=p.density===null?'—':Math.round(p.density).toLocaleString();
 l.bindTooltip(`${esc(p.A16_003)} · ${p.year}<br>${d} ${w('people/km²','人/km²','人/km²')}`);
 l.bindPopup(`<div class="feature-popup"><h3>${esc(p.A16_003)} · ${p.year}</h3><p>${w('DID average density','人口集中地区の平均密度','人口集中地区平均密度')}: <strong>${d} ${w('people/km²','人/km²','人/km²')}</strong></p><p>${w('Population','人口','人口')}: ${p.population.toLocaleString()}<br>${w('Source district area','原典の地区面積','原始地区面积')}: ${p.areaKm2} km²</p><p>${w('Density = census population ÷ published DID area. Boundaries differ across years. Blank areas are not zero population.','密度＝国勢調査人口÷公表DID面積。区域は年次により異なります。無着色は人口ゼロではありません。','密度＝普查人口÷公布的DID面积。边界随年份变化，空白不代表零人口。')}</p><a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A16-2020.html" target="_blank" rel="noopener">MLIT A16 · ${p.year}</a></div>`,{autoPan:false});
 }});
}
export function renderPopulation(app){
 document.querySelector('#population-switcher')?.remove();if(app.page!=='population')return;
 const lang=getLanguage(),w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
 const panel=document.createElement('div');panel.id='population-switcher';panel.className='map-switcher population-switcher';panel.setAttribute('role','group');panel.setAttribute('aria-label',w('Census year','国勢調査年','普查年份'));
 for(let year=1960;year<=2020;year+=5){const b=document.createElement('button');b.textContent=year;b.dataset.year=year;b.setAttribute('aria-pressed',String(app.populationYear===year));b.onclick=()=>{app.populationYear=year;app.renderStructure();app.render();};panel.append(b);}
 document.querySelector('#atlas').append(panel);
 const legend=document.createElement('div');legend.className='density-legend';legend.innerHTML=`<p><strong>${app.populationYear} · ${w('DID average · people/km²','DID平均・人/km²','DID平均·人/km²')}</strong></p>`+densityClasses.map(c=>`<span><i style="background:${c[1]}"></i>${c[2]}</span>`).join('');
 document.querySelector('#subject-body').prepend(legend);
 const authored=app.doc.pages.find(p=>p.id==='population')?.trivia;
 if(authored&&app.populationYear>=(authored.fromYear??0)){
  const trivia=localize(authored),details=document.createElement('details');details.className='context-trivia';
  const summary=document.createElement('summary');summary.textContent=trivia.title;details.append(summary);
  const body=document.createElement('p');body.textContent=trivia.body;details.append(body);
  for(const source of trivia.sources||[])if(/^https:\/\//.test(source.url)){const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=source.title;details.append(a);}
  document.querySelector('#subject-body').append(details);
 }

}
