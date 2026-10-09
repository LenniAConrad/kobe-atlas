// Interface language only. Research text and source names retain their authored language.
const labels = {
  EN: {shareQr:'Share this atlas · QR code',qrAlt:'QR code for Thor’s Kobe Spatial Atlas',openAtlas:'Open the atlas',downloadPng:'Download PNG',downloadSvg:'Download SVG',creator:'Created by',language:'Language',home:'Timeline',transport:'Transport',water:'Water systems',layers:'Layers',viewOptions:'View options',allLayers:'All layers',follow:'Follow chapter',defaults:'Page defaults',offline:'Downloaded maps only',localStatus:'Local tiles; missing detail uses an overview.',onlineStatus:'Source detail loads as needed.',missing:'Not in the overview download',edit:'Edit atlas',sources:'Sources & versions',play:'Play',pause:'Pause',previous:'Previous chapter',next:'Next chapter',backward:'Play backward',forward:'Play forward',info:'Chapter information',closeInfo:'Close chapter information',zoomIn:'Zoom in',zoomOut:'Zoom out',reset:'Return to Kobe overview',menu:'Expand navigation',working:'Working edition',visitor:'Visitor edition',subject:'Explore a subject',scrub:'Position within current chapter',choose:'Choose a chapter'},
  JP: {shareQr:'アトラスを共有・QRコード',qrAlt:'Thorの神戸 空間アトラスのQRコード',openAtlas:'アトラスを開く',downloadPng:'PNGを保存',downloadSvg:'SVGを保存',creator:'制作',language:'言語',home:'タイムライン',transport:'交通',water:'水系',layers:'レイヤー',viewOptions:'表示設定',allLayers:'すべてのレイヤー',follow:'時代に合わせる',defaults:'初期表示',offline:'ダウンロード済みの地図のみ',localStatus:'ローカル地図。詳細がない場所は広域図を表示します。',onlineStatus:'必要に応じて地図を読み込みます。',missing:'オフライン地図に未収録',edit:'アトラスを編集',sources:'出典とバージョン',play:'再生',pause:'一時停止',previous:'前の時代',next:'次の時代',backward:'逆方向に再生',forward:'順方向に再生',info:'時代の解説',closeInfo:'解説を閉じる',zoomIn:'拡大',zoomOut:'縮小',reset:'神戸の全体図に戻る',menu:'メニューを開く',working:'編集中',visitor:'公開版',subject:'テーマを探る',scrub:'この時代の再生位置',choose:'時代を選択'},
  CN: {shareQr:'分享图集 · 二维码',qrAlt:'Thor的神户空间图集二维码',openAtlas:'打开图集',downloadPng:'下载PNG',downloadSvg:'下载SVG',creator:'制作',language:'语言',home:'时间轴',transport:'交通',water:'水系统',layers:'图层',viewOptions:'显示选项',allLayers:'所有图层',follow:'跟随时段',defaults:'默认图层',offline:'仅使用已下载的地图',localStatus:'本地地图；缺少细节时显示概览。',onlineStatus:'根据需要加载地图细节。',missing:'未包含在离线地图中',edit:'编辑地图集',sources:'来源与版本',play:'播放',pause:'暂停',previous:'上一时段',next:'下一时段',backward:'反向播放',forward:'正向播放',info:'时段介绍',closeInfo:'关闭介绍',zoomIn:'放大',zoomOut:'缩小',reset:'返回神户概览',menu:'展开菜单',working:'编辑版',visitor:'发布版',subject:'探索主题',scrub:'当前时段内的播放位置',choose:'选择时段'}
};
let language='EN';
try { const saved=localStorage.getItem('atlas-language');if(labels[saved])language=saved; } catch {}
export const t=key=>labels[language][key]||labels.EN[key]||key;
export const pageName=page=>localize(page).name;
export function applyLanguage(){
  document.documentElement.lang={EN:'en',JP:'ja',CN:'zh-CN'}[language];
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  const names={'info-toggle':'info','info-close':'closeInfo','zoom-in':'zoomIn','zoom-out':'zoomOut','reset-view':'reset','menu-toggle':'menu','chapter-progress':'scrub','chapter-track':'choose','edit-button':'edit','sources-button':'sources'};
  for(const [id,key] of Object.entries(names)){const el=document.getElementById(id);el.setAttribute('aria-label',t(key));el.title=t(key);}
  const current=document.getElementById('language-current');current.textContent=language;current.setAttribute('aria-label',t('language')+': '+language);current.title=t('language');
  document.getElementById('language-options').setAttribute('aria-label',t('language'));
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
}
export function bindLanguage(onChange){
  document.getElementById('language-current').onclick=()=>{const side=document.getElementById('sidebar');side.classList.remove('suppress-hover');side.classList.add('expanded');document.getElementById('menu-toggle').setAttribute('aria-expanded','true');document.querySelector(`[data-language="${language}"]`).focus();};
  document.querySelectorAll('[data-language]').forEach(button=>button.onclick=()=>{language=button.dataset.language;try{localStorage.setItem('atlas-language',language);}catch{}onChange();applyLanguage();document.getElementById('language-current').focus({preventScroll:true});document.getElementById('sidebar').scrollLeft=0;});
  applyLanguage();
}

let phrases=new Map();
const originals=new WeakMap();
export const getLanguage=()=>language;
export const contentFields={chapters:['title','label','heading','body','sourceNote'],features:['title','body','source','dateLabel','location','locationNote','imageCaption'],layers:['name','group','credit'],pages:['name','description','body'],settings:['title','subtitle']};
export async function initTranslations(){
  const response=await fetch('data/translations.json',{cache:'no-cache'});if(!response.ok)throw Error('Translation catalog could not be loaded.');
  phrases=new Map((await response.json()).map(([en,ja,zh])=>[en,{JP:ja,CN:zh}]));
  for(const key of Object.keys(labels.EN))phrases.set(labels.EN[key],{JP:labels.JP[key],CN:labels.CN[key]});
  new MutationObserver(changes=>{for(const change of changes){if(change.type==='characterData')translateDOM(change.target);else for(const node of change.addedNodes)translateDOM(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
}
export function translateText(value,locale=language){
  if(typeof value!=='string'||locale==='EN')return value;
  const direct=phrases.get(value)?.[locale];if(direct)return direct;
  const trimmed=value.trim();if(trimmed!==value){const translated=translateText(trimmed,locale);return value.replace(trimmed,translated);}
  if(value.includes('\n'))return value.split('\n').map(line=>translateText(line,locale)).join('\n');
  let match;
  if(match=value.match(/^Historical map · (.+)$/))return (locale==='JP'?'歴史地図・':'历史地图 · ')+match[1];
  if(match=value.match(/^Aerial · (.+)$/))return (locale==='JP'?'航空写真・':'航空影像 · ')+match[1];
  if(match=value.match(/^Draft revision (\d+)$/))return (locale==='JP'?'下書き版 ':'草稿版本 ')+match[1];
  if(match=value.match(/^(.+) opacity$/))return translateText(match[1],locale)+(locale==='JP'?'の不透明度':'不透明度');
  if(match=value.match(/^(Line|Operator|Category|Source code): (.+)$/))return translateText(match[1],locale)+': '+translateText(match[2],locale);
  if(match=value.match(/^Railway sections: (.+) · Stations: (.+) in the study context\.$/))return locale==='JP'?`対象地域の鉄道区間：${match[1]}・駅：${match[2]}`:`研究范围内的铁路区段：${match[1]} · 车站：${match[2]}`;
  if(match=value.match(/^Delete (.+) from this draft\?$/))return locale==='JP'?`「${match[1]}」を下書きから削除しますか？`:`从草稿中删除“${match[1]}”吗？`;
  if(match=value.match(/^Published visitor copy exported to: (.+)$/))return (locale==='JP'?'閲覧版の出力先：':'浏览版已导出至：')+match[1];
  if(match=value.match(/^Please check the coordinates in (.+)\.$/))return locale==='JP'?`${match[1]}の座標を確認してください。`:`请检查${match[1]}中的坐标。`;
  if(match=value.match(/^Imported feature (\d+)$/))return (locale==='JP'?'読み込んだ地物 ':'导入的要素 ')+match[1];
  return value;
}
export function localize(record,locale=language){
  if(!record)return {};
  const result={...record};for(const [key,value] of Object.entries(record))if(['title','label','heading','body','sourceNote','name','group','credit','description','source','subtitle','dateLabel','location','locationNote','imageCaption'].includes(key)&&typeof value==='string')result[key]=record.translations?.[locale]?.[key]??translateText(value,locale);
  return result;
}
export function translateDOM(root){
  const translate=node=>{
    if(node.nodeType===Node.TEXT_NODE){
      if(node.parentElement?.closest('script,style,textarea,svg,[data-no-translate]'))return;
      let saved=originals.get(node);if(!saved||node.nodeValue!==saved.last)saved={base:node.nodeValue,last:node.nodeValue};
      const next=translateText(saved.base);if(node.nodeValue!==next)node.nodeValue=next;saved.last=next;originals.set(node,saved);
    }else if(node.nodeType===Node.ELEMENT_NODE){
      for(const attr of ['title','aria-label'])if(node.hasAttribute(attr)){
        const key='translationOriginal'+attr.replace('-','');const current=node.getAttribute(attr);
        let saved=node[key];if(!saved||current!==saved.last)saved={base:current,last:current};
        const next=translateText(saved.base);if(current!==next)node.setAttribute(attr,next);saved.last=next;node[key]=saved;
      }
    }
  };
  translate(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walker.nextNode())translate(walker.currentNode);
}
