import {getLanguage} from './language.js?v=20261009l';
export function renderRisk(app){
 document.querySelector('#risk-switcher')?.remove();if(app.page!=='disaster')return;
 const lang=getLanguage(),w=(en,jp,cn)=>({EN:en,JP:jp,CN:cn}[lang]);
 const panel=document.createElement('div');panel.id='risk-switcher';panel.className='map-switcher';panel.setAttribute('role','group');panel.setAttribute('aria-label',w('Hazard mode','災害モード','灾害模式'));
 for(const [id,label] of [['earthquake',w('Earthquake','地震','地震')],['landslide',w('Landslide risk','土砂災害','滑坡风险')],['water',w('Water disaster risk','水害','水灾风险')]]){
 const b=document.createElement('button');b.textContent=label;b.dataset.mode=id;b.setAttribute('aria-pressed',String(app.hazardMode===id));b.onclick=()=>{app.hazardMode=id;app.renderStructure();app.render();};panel.append(b);
 }
 document.querySelector('#atlas').append(panel);
 const note=document.createElement('div');note.className='risk-notes';
 note.innerHTML=`<p>${w('Uncoloured areas may be unassessed or unavailable. These layers do not establish safety.','無着色の場所は未調査・未提供の場合があります。安全を示すものではありません。','无颜色区域可能未评估或无数据，并不代表安全。')}</p>`;
 if(app.hazardMode==='earthquake')note.innerHTML+=`<p>${w('Fault traces only; no ground-shaking model. GSJ geology: 2025 edition. AIST active-fault file has internal snapshot label 150219-2.','断層の位置情報のみ。地震動予測ではありません。地質図は2025年版。活断層ファイルの内部版名は150219-2。','仅显示断层，无震动模型。地质图为2025年版；活动断层文件内部版本为150219-2。')}</p>`;
 else {
 note.innerHTML+=`<p>${w('Official MLIT / prefectural hazard layers via GSI; source dates vary. Retrieved 9 October 2026. Use the layer toggles to inspect each hazard separately.','国交省・都道府県の災害情報を地理院経由で表示。原典の時点は異なります。2026年10月9日取得。レイヤーで個別に確認してください。','通过GSI显示国土交通省及各县灾害图层，源数据日期不同。2026年10月9日获取。可逐个切换查看。')}</p>`;
 const files=app.hazardMode==='water'?['shinsui_legend3.png']:['keikai_dosekiryu.png','keikai_kyukeisya.png','keikai_jisuberi.png'];
 note.innerHTML+=`<p>${app.hazardMode==='water'?w('Inundation depth (metres)','浸水深（m）','淹没深度（米）'):w('Yellow: warning area · Red: special warning area','黄：警戒区域・赤：特別警戒区域','黄色：警戒区域 · 红色：特别警戒区域')}</p>`;
 for(const file of files)note.innerHTML+=`<img class="hazard-legend" src="data/hazard-legends/${file}" alt="${w('Official hazard legend','公式凡例','官方图例')}">`;
 }
 note.innerHTML+='<p><a href="https://disaportal.gsi.go.jp/" target="_blank" rel="noopener">GSI Hazard Map Portal</a> · <a href="data/faults-source.json" target="_blank" rel="noopener">GSJ / AIST sources</a></p>';
 const images=[...note.querySelectorAll('.hazard-legend')];if(images.length){const legend=document.createElement('div');legend.className='hazard-legend-strip';for(const img of images)legend.append(img);document.querySelector('#subject-body').prepend(legend);}document.querySelector('#subject-body').append(note);
}
