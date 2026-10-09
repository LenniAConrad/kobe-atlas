import {getLanguage} from './language.js?v=20261009p';

// This painted map is illustrative. Its bounds locate Awaji for the introduction;
// they are not a surveyed historical coastline or an archaeological reconstruction.
const ART_BOUNDS=[[34.12,134.59],[34.665,135.095]];
const cloud=`<svg viewBox="0 0 640 820" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="cloud-wash" x2="1" y2="1"><stop stop-color="#eee3c8"/><stop offset="1" stop-color="#d7c49c"/></linearGradient><clipPath id="cloud-edge"><path d="M0 0H530C620 20 660 90 580 145C660 200 640 265 540 285C650 340 655 415 570 460C655 500 655 575 545 600C660 640 675 710 575 755C610 775 615 810 540 820H0Z"/></clipPath></defs><g clip-path="url(#cloud-edge)"><path fill="url(#cloud-wash)" stroke="#a28b5f" stroke-width="2" d="M0 0H640V820H0Z"/><g fill="#eee5cf" stroke="#b09a6b" stroke-width="2"><path d="M-90 170C-70 106 42 91 83 145C114 65 239 68 260 138C338 84 428 132 420 192C509 127 627 163 666 231L690 281H-90Z"/><path d="M-80 427C-38 350 62 350 107 407C165 305 297 330 301 402C358 343 470 344 491 433C555 366 653 385 710 465L711 511H-80Z"/><path d="M-90 687C-35 603 69 635 88 672C154 590 273 591 290 676C374 618 466 657 459 709C549 642 652 670 700 738L702 787H-90Z"/></g><g fill="none" stroke="#b39d70" stroke-width="2" opacity=".7"><path d="M0 214C81 182 178 232 258 207S417 179 502 217S616 218 680 196M-20 260C112 238 195 272 301 245S494 253 652 243M-20 461C90 439 157 479 252 451S441 445 522 475S624 451 680 463M-20 506C139 478 238 520 338 493S544 512 663 488M-20 727C113 703 192 743 284 718S440 699 531 738S630 721 682 731"/></g></g></svg>`;

export class AwajiIntroduction {
  constructor(map){
    this.map=map;
    const pane=map.createPane('awaji-painting');pane.style.zIndex='425';pane.style.pointerEvents='none';
    this.pane=pane;
    const paper=map.createPane('awaji-paper');paper.style.zIndex='424';paper.style.pointerEvents='none';
    this.sea=document.createElement('div');this.sea.className='awaji-painted-sea';paper.append(this.sea);this.sea.hidden=true;
    this.art=window.L.imageOverlay('art/awaji-kuniumi.webp',ART_BOUNDS,{pane:'awaji-painting',interactive:false,alt:'Awaji Island, imagined as a traditional Japanese painted map'});
    this.clouds=document.createElement('div');this.clouds.className='awaji-clouds';this.clouds.setAttribute('aria-hidden','true');
    this.clouds.innerHTML=`<div class="awaji-cloud awaji-cloud-left">${cloud}</div><div class="awaji-cloud awaji-cloud-right">${cloud.replaceAll('cloud-wash','cloud-wash-right').replaceAll('cloud-edge','cloud-edge-right')}</div>`;
    this.label=document.createElement('div');this.label.className='awaji-art-label';
    map.getContainer().append(this.clouds,this.label);this.clouds.hidden=true;this.label.hidden=true;
  }
  enter(chapter,duration,reduced){
    this.cancel();
    if(chapter?.id!=='traditions')return;
    // Artwork visibility comes exclusively from render(), so a manual layer
    // override also applies when this entrance runs.
    if(!this.map.hasLayer(this.art))return;
    if(reduced)return;
    this.clouds.hidden=false;this.clouds.classList.remove('parting');
    this.clouds.style.setProperty('--cloud-duration',`${duration}s`);
    void this.clouds.offsetWidth;this.clouds.classList.add('parting');
    this.timer=setTimeout(()=>{this.clouds.hidden=true;},duration*1000+150);
  }
  render(playback,page='home',baseOpacity=1){
    const next=playback.phase==='fade'?playback.chapters[playback.nextIndex]:null;
    const alpha=page==='home'?((playback.chapter.id==='traditions'?1-playback.mix:0)+(next?.id==='traditions'?playback.mix:0))*baseOpacity:0;
    this.pane.style.opacity=String(alpha);this.sea.hidden=alpha<=0;this.sea.style.opacity=String(alpha);
    if(alpha>0){if(!this.map.hasLayer(this.art))this.art.addTo(this.map);}
    if(this.art.getElement())this.art.getElement().classList.add('awaji-painted-map');
    if(alpha<=0) {if(this.map.hasLayer(this.art))this.map.removeLayer(this.art);this.cancel();}
    this.label.hidden=alpha<=0;this.label.style.opacity=String(alpha);
    this.label.textContent=getLanguage()==='JP'?'淡路島 · 神話を描くイメージ図':getLanguage()==='CN'?'淡路岛 · 神话主题示意图':'Awaji · Myth-inspired illustration';
  }
  cancel(){clearTimeout(this.timer);this.clouds.hidden=true;this.clouds.classList.remove('parting');}
}
