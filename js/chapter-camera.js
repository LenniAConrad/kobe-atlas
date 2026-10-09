import {AwajiIntroduction} from './awaji-intro.js?v=20261009o';
// Opt-in chapter entrances. Ordinary chapters never move the visitor's camera.
export class ChapterCamera {
  constructor(map,settings){
    this.map=map;this.settings=settings;this.active=null;this.flight=false;this.introduction=new AwajiIntroduction(map);
    this.interrupt=()=>{if(this.flight){map.stop();this.flight=false;}clearTimeout(this.flightTimer);this.introduction.cancel();};
    for(const event of ['pointerdown','wheel','keydown'])map.getContainer().addEventListener(event,this.interrupt,{passive:true});
  }
  enter(chapter,force=false){
    const id=chapter?.id??null;if(!force&&id===this.active)return;
    this.interrupt();this.active=id;
    const camera=chapter?.camera;if(!camera?.bounds)return;
    this.map.invalidateSize({pan:false});
    const small=innerWidth<700;
    let options={paddingTopLeft:small?[68,305]:[innerWidth>1100?430:80,60],paddingBottomRight:small?[18,290]:[innerWidth>1100?330:40,140]};
    // Short windows still get usable map space, even if panels overlay part of it.
    if(this.map.getSize().y<740){options.paddingTopLeft=[70,50];options.paddingBottomRight=[20,100];}
    // Use most of the viewport for Awaji, allowing the information panel to
    // overlap the sea. Large panel padding previously forced an excessive zoom-out.
    if(id==='traditions')options={paddingTopLeft:[small?65:80,30],paddingBottomRight:[20,small?220:150]};
    this.extendedCamera=camera;
    this.map.setMaxBounds(camera.navigationBounds||camera.bounds);
    this.map.setMinZoom(camera.minZoom??8);
    this.flight=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration=camera.duration??2.4;
    this.introduction.enter(chapter,duration,reduced);
    if(id==='traditions'){
      const bounds=window.L.latLngBounds(camera.bounds),padding=window.L.point(options.paddingTopLeft).add(options.paddingBottomRight);
      const zoom=Math.min(camera.maxZoom??11,this.map.getBoundsZoom(bounds,false,padding));
      // A regular pan stays at the final framing. flyToBounds intentionally
      // pulls far away during long journeys, which obscures this island reveal.
      this.map.setZoom(zoom,{animate:false});
      const center=bounds.getCenter();if(!small)center.lng-=.11;
      this.map.panTo(center,{animate:!reduced,duration,easeLinearity:.4});
    }else this.map.flyToBounds(camera.bounds,{...options,maxZoom:camera.maxZoom??11,duration,animate:!reduced});
    // A preceding bounds/zoom adjustment can emit moveend while flyTo is still active.
    // Keep interruption armed for the flight instead of trusting that unrelated event.
    this.flightTimer=setTimeout(()=>{this.flight=false;},reduced?0:((camera.duration??2.4)+.2)*1000);
    this.map.getContainer().dispatchEvent(new CustomEvent('chapter-introduction',{detail:{chapterId:id,animation:chapter.introAnimation??null}}));
  }
  render(playback,page,baseOpacity){this.introduction.render(playback,page,baseOpacity);}
  reset(settings=this.settings){this.interrupt();this.extendedCamera=null;this.settings=settings;this.map.setMinZoom(settings.minZoom);this.map.setMaxBounds(settings.bounds);this.map.setView(settings.center,settings.zoom);}
}
