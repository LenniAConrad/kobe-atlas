import {getLanguage} from './language.js?v=20261009p';
import {esc} from './ui.js?v=20261009p';
export function zoningLayer(data,layer,pane){
 const lang=getLanguage(),word=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
 return window.L.geoJSON(data,{pane,filter:f=>String(f.properties.YoutoCode)===String(layer.filterValue),style:{color:layer.color,weight:.7,fillColor:layer.color,fillOpacity:.48},onEachFeature:(f,l)=>{
  const p=f.properties,title=layer.name;
  l.bindTooltip(`${esc(title)}<br>${esc(p.YoutoName)}`);
  const value=v=>v===null||v===undefined||v===''?word('Not supplied','記載なし','未提供'):esc(v)+'%';
  l.bindPopup(`<div class="feature-popup"><h3>${esc(title)}</h3><p>${esc(p.YoutoName)}</p><dl><dt>${word('Floor-area ratio','容積率','容积率')}</dt><dd>${value(p.FAR)}</dd><dt>${word('Building coverage','建ぺい率','建筑覆盖率')}</dt><dd>${value(p.BCR)}</dd></dl><p>${word('MLIT A55 · FY2024 edition. Individual decision date not supplied. Reference map; consult Kobe City for current zoning.','国土数値情報A55・2024年度版。個別の決定日は記載なし。参考図です。最新の用途地域は神戸市で確認してください。','MLIT A55 · 2024年度版。未提供各地块决定日期。仅供参考，当前规划请查询神户市。')}</p><p><a href="https://www.city.kobe.lg.jp/a35466/business/kaihatsu/plan/search.html" target="_blank" rel="noopener">${word('Kobe official planning map','神戸市の都市計画情報','神户官方规划地图')}</a></p><p class="source-note">MLIT A55 / Kobe City · CC BY 4.0 · ${esc(f.id)}</p></div>`,{autoPan:false,maxWidth:320});
 }});
}
