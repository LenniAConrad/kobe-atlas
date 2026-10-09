import {esc} from './ui.js?v=20261009o';
import {getLanguage} from './language.js?v=20261009o';
export function faultLayer(data,layer,pane){
 const lang=getLanguage(),w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
 return L.geoJSON(data,{pane,style:f=>({color:layer.color,weight:3,dashArray:f.properties.Legend_E?.includes('concealed')?'6 5':null}),onEachFeature:(f,l)=>{
 const p=f.properties,name=lang==='JP'&&p.Legend_J?p.Legend_J:p.name;
 l.bindTooltip(esc(name));l.bindPopup(`<div class="feature-popup"><h3>${esc(name)}</h3><p>${esc(p.source)}</p><p>${w('Generalized trace; not a parcel-scale location or a shaking forecast. Geological faults are not necessarily inactive.','概略位置です。敷地単位の位置や揺れの予測ではありません。地質図の断層が非活断層とは限りません。','概略位置，不代表地块级精度或震动预测。地质断层并不一定是不活动断层。')}</p><a href="${esc(p.url)}" target="_blank" rel="noopener">${w('Official source','公式出典','官方来源')}</a></div>`,{autoPan:false});
 }});
}
