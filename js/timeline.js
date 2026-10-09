// Interruptible chapter selection motion and pointer scrolling, independent of map navigation.
export class Timeline {
  constructor(track){
    this.track=track;this.active=null;this.drag=null;this.suppressClick=false;
    track.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('input'))return;
      this.cancelScroll();this.drag={id:e.pointerId,x:e.clientX,left:track.scrollLeft,moved:false};
    });
    track.addEventListener('pointermove',e=>{
      const d=this.drag;if(!d||e.pointerId!==d.id)return;
      if(Math.abs(e.clientX-d.x)>5&&!d.moved){d.moved=true;track.setPointerCapture(e.pointerId);track.classList.add('dragging');}
      if(d.moved){track.scrollLeft=d.left-(e.clientX-d.x);e.preventDefault();}
    });
    const finish=e=>{if(!this.drag||e.pointerId!==this.drag.id)return;this.suppressClick=this.drag.moved;this.drag=null;track.classList.remove('dragging');if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);setTimeout(()=>this.suppressClick=false,0);};
    track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);
    track.addEventListener('click',e=>{if(this.suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
    track.addEventListener('wheel',()=>this.cancelScroll(),{passive:true});
    track.addEventListener('scroll',()=>this.edges(),{passive:true});
    this.resize=new ResizeObserver(()=>{this.position(false);this.edges();});this.resize.observe(track);
  }
  reduced(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
  cancelScroll(){cancelAnimationFrame(this.frame);}
  edges(){this.track.style.setProperty('--edge-left',this.track.scrollLeft>2?'22px':'0px');this.track.style.setProperty('--edge-right',this.track.scrollLeft+this.track.clientWidth<this.track.scrollWidth-2?'22px':'0px');}
  select(index){
    const next=this.track.querySelector(`[data-chapter="${index}"]`);if(!next)return;
    if(this.active===next)return;
    const previous=this.track.querySelector('.chapter-highlight');
    const old=previous?.getBoundingClientRect();
    if(!this.highlight){this.highlight=document.createElement('span');this.highlight.className='chapter-highlight';this.highlight.setAttribute('aria-hidden','true');}
    next.prepend(this.highlight);this.active=next;
    this.highlight.getAnimations().forEach(a=>a.cancel());
    if(old&&!this.reduced()){
      const rect=this.highlight.getBoundingClientRect();
      this.highlight.animate([{transform:`translate(${old.x-rect.x}px,${old.y-rect.y}px) scaleX(${old.width/rect.width})`},{transform:'translate(0,0) scaleX(1)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    this.position(!!old);this.edges();
  }
  position(animate){
    if(!this.active||this.drag)return;
    const t=this.track,start=t.scrollLeft,target=Math.max(0,Math.min(t.scrollWidth-t.clientWidth,this.active.offsetLeft+this.active.offsetWidth/2-t.clientWidth/2));
    this.cancelScroll();
    if(!animate||this.reduced()){t.scrollLeft=target;return;}
    const begun=performance.now();const frame=now=>{const p=Math.min(1,(now-begun)/420);t.scrollLeft=start+(target-start)*(1-Math.pow(1-p,4));if(p<1)this.frame=requestAnimationFrame(frame);};this.frame=requestAnimationFrame(frame);
  }
}
