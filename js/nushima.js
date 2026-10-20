import {esc} from './ui.js?v=20261009p';
import {getLanguage} from './language.js?v=20261009p';

const words=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[getLanguage()]||en);
const isIsland=layer=>(layer.pages||[]).includes('nushima');

export function layerDetails(layer){
  if(!isIsland(layer))return '';
  const links=(layer.sources||[]).filter(s=>/^https:\/\//.test(s.url));
  return `<div class="nushima-layer-status" data-status-for="${esc(layer.id)}"></div>
    <details class="nushima-layer-details"><summary>${words('Details & legend','詳細・凡例','详情与图例')}</summary>
    <p>${esc(layer.description||'')}</p>
    <p>${esc(layer.coverage||'')}${layer.maxNativeZoom?` · Native zoom ${layer.minNativeZoom}–${layer.maxNativeZoom}; closer views enlarge these tiles.`:''}</p>
    ${layer.legend?`<img src="${esc(layer.legend)}" alt="${esc(layer.name)} legend" loading="lazy">`:''}
    ${layer.legendItems?`<ul class="nushima-legend">${layer.legendItems.map(i=>`<li><i style="background:${esc(i.color)}"></i>${esc(i.label)}</li>`).join('')}</ul>`:''}
    <p>${links.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join(' · ')}</p>
    <p>${esc(layer.credit||'')} · ${esc(layer.license||'See source terms')}</p></details>`;
}

export function resizeNushima(app){
  const center=app.atlas.map.getCenter();
  const atlas=document.querySelector('#atlas');
  atlas.classList.toggle('nushima-view',app.page==='nushima');
  atlas.classList.toggle('layers-hidden',app.layerCollapsed);
  app.atlas.map.invalidateSize({pan:false});
  app.atlas.map.setView(center,app.atlas.map.getZoom(),{animate:false});
}

export function fitNushima(app){
  if(app.page!=='nushima')return;
  if(app.mapZooming){
    if(!app.nushimaResetQueued){
      app.nushimaResetQueued=true;
      app.atlas.map.once('zoomend',()=>{app.nushimaResetQueued=false;fitNushima(app);});
    }
    return;
  }
  app.atlas.chapterCamera.interrupt();
  app.atlas.map.stop();
  app.atlas.chapterCamera.extendedCamera=null;
  app.atlas.pageContext('nushima');
  resizeNushima(app);
  const page=app.doc.pages.find(p=>p.id==='nushima');
  const mobile=matchMedia('(max-width:700px)').matches;
  app.atlas.map.fitBounds(page.overviewBounds,{paddingTopLeft:mobile?[12,90]:[24,70],paddingBottomRight:mobile?[12,100]:[55,75],maxZoom:16,animate:false});
}

export function bindNushima(app){
  app.nushimaTiles=new Map();
  const search=document.createElement('input');
  search.id='nushima-layer-search';search.type='search';search.hidden=true;
  document.querySelector('#layer-list').before(search);
  search.oninput=()=>{
    const query=search.value.trim().toLocaleLowerCase();
    document.querySelectorAll('#layer-list .layer-row').forEach(row=>{
      const layer=app.doc.layers.find(l=>l.id===row.dataset.layer);
      row.hidden=!!query&&!`${layer.name} ${layer.group} ${layer.description||''}`.toLocaleLowerCase().includes(query);
    });
    document.querySelectorAll('#layer-list .layer-group').forEach(heading=>{
      let row=heading.nextElementSibling,visible=false;
      while(row&&!row.classList.contains('layer-group')){if(!row.hidden)visible=true;row=row.nextElementSibling;}
      heading.hidden=!visible;
    });
  };
  app.atlas.map.on('zoomstart',()=>{app.mapZooming=true;});
  app.atlas.map.on('zoomend',()=>{app.mapZooming=false;});
  app.updateNushimaStatus=()=>{
    if(app.page!=='nushima')return;
    const reset=document.querySelector('#reset-view');
    reset.title=words('Frame Nushima','沼島全体を表示','显示沼岛全貌');reset.setAttribute('aria-label',reset.title);
    const zoom=app.atlas.map.getZoom();
    document.querySelectorAll('[data-status-for]').forEach(el=>{
      const layer=app.doc.layers.find(l=>l.id===el.dataset.statusFor);
      const state=app.nushimaTiles.get(layer.id);
      el.textContent=layer.type!=='raster'?'':zoom<layer.minNativeZoom
        ?words(`Zoom to ${layer.minNativeZoom}+ to see this layer`,`${layer.minNativeZoom}以上に拡大すると表示`, `放大至 ${layer.minNativeZoom} 级以上显示`)
        :state?.missing
          ?words('Some tiles unavailable / outside coverage','一部のタイルは未配信・対象外','部分瓦片不可用或超出覆盖范围')
          :'';
    });
    const label=document.querySelector('#nushima-zoom');
    if(label)label.textContent=words(`Zoom ${zoom}`,`ズーム ${zoom}`,`缩放 ${zoom}`);
  };
  app.atlas.map.on('atlas-tile-status',e=>{
    if(!e.layerId.startsWith('nushima-'))return;
    const state=app.nushimaTiles.get(e.layerId)||{missing:false};
    if(!e.loaded)state.missing=true;
    app.nushimaTiles.set(e.layerId,state);app.updateNushimaStatus();
  });
  app.atlas.map.on('zoomend',()=>app.updateNushimaStatus());
  window.addEventListener('resize',()=>resizeNushima(app));
  window.addEventListener('hashchange',()=>{
    const id=location.hash.slice(1);
    if(app.doc.pages.some(p=>p.id===id))app.setPage(id);
  });
}

export function renderNushima(app){
  const island=app.page==='nushima';
  const search=document.querySelector('#nushima-layer-search');
  search.hidden=!island;search.value='';
  search.placeholder=words('Find a layer or provider…','レイヤー・提供元を検索…','搜索图层或提供机构…');
  search.setAttribute('aria-label',words('Find a layer or provider','レイヤー・提供元を検索','搜索图层或提供机构'));
  document.querySelector('#nushima-toolbar')?.remove();
  if(app.lastSubjectPage!==app.page){
    document.querySelector('#subject-panel').open=!island;
    document.querySelector('.map-heading').open=!island;
    if(island){
      app.layerCollapsed=matchMedia('(max-width:700px)').matches;
      document.querySelector('#layer-body').hidden=app.layerCollapsed;
      document.querySelector('#layer-panel').classList.toggle('collapsed',app.layerCollapsed);
      document.querySelector('#layers-collapse').setAttribute('aria-expanded',String(!app.layerCollapsed));
    }
    app.lastSubjectPage=app.page;
  }
  const reset=document.querySelector('#reset-view');
  reset.title=reset.ariaLabel=island?words('Frame Nushima','沼島全体を表示','显示沼岛全貌'):words('Return to Kobe overview','神戸全域を表示','返回神户概览');
  document.querySelector('#map').setAttribute('aria-label',island?'Interactive map of Nushima Island':'Interactive map of Kobe');
  resizeNushima(app);
  if(!island)return;
  const toolbar=document.createElement('div');toolbar.id='nushima-toolbar';toolbar.className='nushima-toolbar';
  toolbar.innerHTML=`<button class="button secondary" id="nushima-home">${words('Frame Nushima','沼島全体','沼岛全貌')}</button><span id="nushima-zoom"></span>`;
  document.querySelector('#subject-body').prepend(toolbar);
  toolbar.querySelector('button').onclick=()=>fitNushima(app);
  const notes=document.createElement('div');notes.className='nushima-notes';
  notes.innerHTML=`<p>${words('Each layer has its own switch and opacity slider. Upper rows draw first; later layers sit above them. Open Details & legend for dates, coverage and source links.','各レイヤーの表示と透明度を個別に変更できます。下の行のレイヤーが上に重なります。詳細・凡例には資料の年代・範囲・出典があります。','各图层可独立开关并调节透明度。列表中靠后的图层叠加在前面的图层上。展开详情与图例查看日期、覆盖范围和来源。')}</p>
    <p>${words('Blank hazard areas can mean missing coverage, not safety. These are published scenarios, not live warnings.','災害図の空白は安全を意味せず、未整備の場合があります。公表された想定であり、リアルタイムの警報ではありません。','灾害图空白可能表示缺少数据，并不代表安全。这些是公布的模拟情景，并非实时预警。')}</p>
    <p><a href="data/nushima-sources.json" target="_blank" rel="noopener">${words('Full source & coverage audit','出典・範囲の確認記録','完整来源与覆盖核查记录')}</a></p>`;
  document.querySelector('#subject-body').append(notes);
}

export function nushimaLayer(data,layer,pane){
  const L=window.L;
  const fishing=layer.interaction==='fishing-community';
  const style=feature=>({color:feature.properties.color||layer.color,weight:layer.weight??2,fillOpacity:layer.fillOpacity??.15});
  return L.geoJSON(data,{
    pane,
    filter:feature=>!layer.filterField||String(feature.properties[layer.filterField])===String(layer.filterValue),
    style,
    pointToLayer:(feature,ll)=>L.circleMarker(ll,{pane,radius:6,weight:2,color:'#fff',fillColor:layer.color,fillOpacity:1}),
    onEachFeature:(feature,item)=>{
      const p=feature.properties||{};
      const title=p.name||layer.name;
      const el=document.createElement('div');el.className='feature-popup';
      el.innerHTML=`${fishing?fishingCommunityInfo(p):`<h3>${esc(title)}</h3>`}${p.category&&!fishing?`<p>${esc(p.category)}</p>`:''}${p.address?`<p>${esc(p.address)}</p>`:''}${p.remarks?`<p><strong>${esc(p.remarks)}</strong></p>`:''}<p>${esc(layer.name)}</p>
        <details><summary>${words('Source attributes','元データの属性','原始数据属性')}</summary><dl>${Object.entries(p).filter(([k])=>!['name','category','color'].includes(k)).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>
        <p class="source-note">${esc(layer.credit)}<br>${esc(layer.description||'')}</p>`;
      item.bindTooltip(()=>{
        const content=document.createElement('div');
        if(fishing)content.innerHTML=fishingCommunityInfo(p);
        else content.textContent=title;
        return content;
      },fishing?{sticky:true,direction:'auto',className:'fishing-community-tooltip'}:{});
      item.bindPopup(el,{autoPan:false,maxWidth:320,maxHeight:300,closeButton:true});
      if(fishing){
        const highlight=()=>item.setStyle({weight:4,fillOpacity:.48});
        const restore=()=>item.setStyle(style(feature));
        item.on({mouseover:highlight,mouseout:restore});
        item.on('add',()=>{
          restore();
          const path=item.getElement();
          path.setAttribute('tabindex','0');path.setAttribute('role','button');
          path.setAttribute('data-community',p.KEY);
          path.setAttribute('aria-label',`${p.GCOM_NAME} · ${p.GAREA_NAME} · ${p.CITY_NAME} · MAFF ${p.censusYear} · ${p.KEY}`);
          path.onfocus=()=>{highlight();item.openTooltip();};
          path.onblur=()=>{restore();item.closeTooltip();};
          path.onkeydown=event=>{
            if(event.key==='Enter'||event.key===' '){event.preventDefault();item.openPopup();}
            if(event.key==='Escape'){item.closeTooltip();item.closePopup();restore();}
          };
        });
      }
    }
  });
}

function fishingCommunityInfo(p){
  const rows=[
    [words('Municipality','市町村','市町村'),`${p.CITY_NAME} · ${p.PREF_NAME}`],
    [words('Fishing district','漁業地区','渔业地区'),`${p.GAREA_NAME} (${p.GAREA})`],
    [words('Community code','漁業集落コード','社区代码'),p.GCOM],
    [words('Census key','センサスキー','普查代码'),p.KEY],
    [words('Census year','センサス年','普查年份'),p.censusYear]
  ];
  return `<div class="fishing-community-info"><strong>${esc(p.GCOM_NAME)}</strong>
    ${p.GCOM==='999'?`<small>${words('Other area · not a named fishing community','その他地域（漁業集落以外）','其他地区（非具名渔业社区）')}</small>`:''}
    <dl>${rows.map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>
    <small>MAFF · ${words('Fisheries Census','漁業センサス','渔业普查')}</small></div>`;
}
