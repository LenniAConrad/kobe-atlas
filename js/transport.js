import {localize,getLanguage} from './language.js?v=20261009p';
import {esc,prose} from './ui.js?v=20261009p';
export function transportLayer(data,layer,pane) {
  const L=window.L,lang=getLanguage(),word=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
  const filtered={...data,features:data.features.filter(f=>!layer.filterField||String(f.properties[layer.filterField])===String(layer.filterValue))};
  const result=L.geoJSON(filtered,{pane,
    style:()=>({color:layer.color,weight:layer.weight??4,dashArray:layer.id==='bay-shuttle'?'10 8':null,opacity:1}),
    pointToLayer:(f,ll)=>{
      const p=localize(f.properties),airport=p.kind==='airport';
      const svg=airport?'<path d="m3 13 7-2V4l2-2 2 2v7l7 2v2l-7-1v5l3 2H7l3-2v-5l-7 1Z"/>':'<path d="M8 8V4h8v4M4 10l8-3 8 3-3 8H7ZM2 21q3-3 5 0 3-3 5 0 3-3 5 0 3-3 5 0"/>';
      return L.marker(ll,{pane,keyboard:true,title:p.name,alt:p.name,icon:L.divIcon({className:'transport-pin '+(airport?'airport-pin':'ferry-pin'),html:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${svg}</svg>`,iconSize:[32,32],iconAnchor:[16,16]})});
    },
    onEachFeature:(f,l)=>{
      const p=localize(f.properties),highway=!!p.N06_007,title=highway?p.N06_007:p.name;
      const body=highway?word('Highway snapshot: 31 December 2025.','高速道路：2025年12月31日時点。','高速公路：2025年12月31日快照。'):p.body;
      l.bindTooltip(`<strong>${esc(title)}</strong><br>${esc(body)}`,{className:'transport-tooltip',sticky:highway});
      const url=highway?'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N06-2025.html':p.sourceUrl;
      const link=/^https:\/\//.test(url||'')?`<p><a href="${esc(url)}" target="_blank" rel="noopener">${word('Official source / routes','公式情報・航路','官方来源／航线')}</a></p>`:'';
      const detail=highway?`<p>${word('Source ID','原典ID','来源ID')}: ${esc(p.N06_004)} · ${word('Use code','供用コード','使用代码')}: ${esc(p.N06_009)}</p>`:`<p class="source-note">${word('Selected routes · reviewed 9 October 2026. Check operator schedules. Locations: © OpenStreetMap contributors (ODbL).','主な航路・2026年10月9日確認。時刻は運航会社で確認。位置：© OpenStreetMap contributors (ODbL)。','部分航线 · 2026年10月9日核查。时刻请向运营商确认。位置：© OpenStreetMap contributors (ODbL)。')}</p>`;
      l.bindPopup(`<div class="feature-popup"><h3>${esc(title)}</h3>${prose(body)}${detail}${link}</div>`,{autoPan:false,maxWidth:320});
      if(l instanceof L.Marker)l.on('add',()=>{const el=l.getElement();el?.addEventListener('focus',()=>l.openTooltip());el?.addEventListener('blur',()=>l.closeTooltip());});
    }
  });
  return result;
}
