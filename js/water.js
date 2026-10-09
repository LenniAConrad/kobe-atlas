import {esc} from './ui.js?v=20261009o';
import {getLanguage} from './language.js?v=20261009o';
export function waterLayer(data,layer,pane){
 const lang=getLanguage(),w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
 const number=v=>v===null||v===undefined||Number(v)<0?w('Not supplied','記載なし','未提供'):Number(v).toLocaleString();
 return L.geoJSON(data,{pane,filter:f=>layer.named===undefined||f.properties.named===layer.named,style:f=>({color:layer.color,weight:f.properties.kind==='rivers'?2.5:1.5,fillColor:layer.color,fillOpacity:f.properties.kind==='supply-areas'?.2:.55}),pointToLayer:(f,ll)=>L.circleMarker(ll,{pane,radius:6,color:'#fff',weight:2,fillColor:layer.color,fillOpacity:1}),onEachFeature:(f,l)=>{
 const p=f.properties;let details='';
 if(p.kind==='rivers')details=`${w('River system code','水系コード','水系代码')}: ${esc(p.W05_001)}<br>${w('River code','河川コード','河流代码')}: ${esc(p.W05_002)}`;
 if(p.kind==='dams')details=`${w('River','河川','河流')}: ${esc(p.W01_004)}<br>${w('Dam height','堤高','坝高')}: ${number(p.W01_007)} m<br>${w('Total storage','総貯水量','总库容')}: ${number(p.W01_010)} × 1,000 m³`;
 if(p.kind==='supply-areas')details=`${w('Operator','事業主体','运营单位')}: ${esc(p.P21A_001)}<br>${w('Served population (source area)','給水人口（原典区域）','供水人口（原始区域）')}: ${number(p.P21A_004)}<br>${w('Maximum daily supply','日最大給水量','最大日供水量')}: ${number(p.P21A_005)} m³<br>${w('2010 service geography; not a reservoir catchment. Missing subarea totals are not zero.','2010年時点の給水区域であり、貯水池の集水域ではありません。部分区域の欠測値はゼロではありません。','2010年供水区域，并非水库集水区。缺失的分区数量不代表零。')}`;
 if(p.kind==='water-plants')details=`${w('Operator','事業主体','运营单位')}: ${esc(p.P21B_001)}<br>${esc(p.P21B_002)}<br>${w('Maximum daily supply','日最大給水量','最大日供水量')}: ${number(p.P21B_004)} m³`;
 l.bindTooltip(`${esc(p.name)}<br>${esc(p.edition)}`);
 l.bindPopup(`<div class="feature-popup"><h3>${esc(p.name)}</h3><p>${details}</p>${p.serviceNote?`<p>${esc(p.serviceNote)}</p><a href="${esc(p.serviceSource)}" target="_blank" rel="noopener">Kobe Waterworks</a>`:''}<p>${w('Source edition','原典の時点','数据版本')}: ${esc(p.edition)}</p><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${p.kind==='reservoirs'?'OpenStreetMap contributors · ODbL':'MLIT · '+esc(f.id)}</a></div>`,{autoPan:false,maxWidth:320});
 }});
}
