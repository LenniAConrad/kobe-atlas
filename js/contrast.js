// Sample the displayed raster stack under each floating surface, not the map title.
// A readable tint remains in place for mixed imagery and cross-origin canvases.
export class MapContrast {
  constructor(map) {
    this.map=map;
    this.sample=document.createElement('canvas');this.sample.width=this.sample.height=1;
    this.ctx=this.sample.getContext('2d',{willReadFrequently:true});
    this.refresh=()=>{if(!this.pending)this.pending=setTimeout(()=>{this.pending=null;this.update();},120);};
    map.on('moveend zoomend layeradd layerremove',this.refresh);
    this.timer=setInterval(this.refresh,600);this.update();
  }
  update() {
    if(document.hidden)return;
    const tiles=[...this.map.getContainer().querySelectorAll('canvas.leaflet-tile-loaded, img.leaflet-image-layer')].map(el=>{
      const pane=el.closest('.leaflet-pane'),style=getComputedStyle(pane);
      return {el,rect:el.getBoundingClientRect(),alpha:Number(style.opacity),z:Number(style.zIndex)};
    }).filter(t=>t.alpha>.01&&t.rect.width>0).sort((a,b)=>a.z-b.z);
    const surfaces=document.querySelectorAll('#sidebar,.map-heading,#layer-panel,#info-panel,#subject-panel,.map-switcher,.map-tools,.timeline-main,.playback-controls .control-button,.map-switcher');
    for(const el of surfaces){
      const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
      const values=[];
      for(const fx of [.2,.5,.8])for(const fy of [.2,.5,.8]){
        const x=r.left+r.width*fx,y=r.top+r.height*fy;let rgb=[223,233,232];
        for(const t of tiles){
          if(x<t.rect.left||x>=t.rect.right||y<t.rect.top||y>=t.rect.bottom)continue;
          try{
            const w=t.el.naturalWidth||t.el.width,h=t.el.naturalHeight||t.el.height;
            this.ctx.clearRect(0,0,1,1);this.ctx.drawImage(t.el,Math.floor((x-t.rect.left)/t.rect.width*w),Math.floor((y-t.rect.top)/t.rect.height*h),1,1,0,0,1,1);
            const p=this.ctx.getImageData(0,0,1,1).data,a=t.alpha*p[3]/255;
            rgb=rgb.map((v,i)=>v*(1-a)+p[i]*a);
          }catch{this.sample.width=1;/* Resets a tainted canvas; safe tint still applies. */}
        }
        values.push((rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)/255);
      }
      const mean=values.reduce((a,b)=>a+b,0)/values.length;
      // Hysteresis prevents flashing around a threshold during fades/panning.
      const dark=el.dataset.mapTone==='dark'?mean<.57:mean<.43;
      el.dataset.mapTone=dark?'dark':'light';
    }
  }
}
