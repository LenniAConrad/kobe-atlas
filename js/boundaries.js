import {getLanguage} from './language.js?v=20261009l';
import {esc} from './ui.js?v=20261009l';
export function boundaryLayer(data,layer,pane) {
  const L=window.L,group=L.layerGroup(),language={EN:'en',JP:'ja',CN:'zh-CN'}[getLanguage()];
  const style=f=>({pane,color:layer.color||'#6d3db0',weight:f.properties.kind==='city'?3.5:1.8,fill:false,opacity:1});
  L.geoJSON(data,{pane,interactive:false,style:f=>({...style(f),color:'#fff',weight:f.properties.kind==='city'?6.5:4.5,className:'kobe-boundary-halo'})}).addTo(group);
  L.geoJSON(data,{pane,style,onEachFeature:(f,l)=>{
    const p=f.properties,city=p.kind==='city';
    const name=language==='en'?p.name:city?(language==='ja'?'神戸市界':'神户市界'):p.N03_005;
    const note=language==='ja'?'2025年1月1日現在の行政界（歴史的境界ではありません）':language==='zh-CN'?'2025年1月1日行政边界（并非历史边界）':'Administrative boundaries as of 1 January 2025; modern reference, not historical boundaries.';
    l.bindPopup(`<strong>${esc(name)}</strong><p>${esc(note)}</p><p>MLIT N03 · CC BY 4.0</p>`,{autoPan:false});
    if(!city)L.tooltip({permanent:true,direction:'center',className:'ward-label',pane,interactive:false}).setLatLng(p.label).setContent(esc(name)).addTo(group);
  }}).addTo(group);
  return group;
}
