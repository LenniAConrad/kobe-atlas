export function revealPosition(feature,chapter){
  if(Number.isFinite(feature.year)&&Number.isFinite(chapter.startYear)&&Number.isFinite(chapter.endYear)&&chapter.endYear>chapter.startYear) return Math.max(0,Math.min(1,(feature.year-chapter.startYear)/(chapter.endYear-chapter.startYear)));
  return Math.max(0,Math.min(1,feature.revealAt??0));
}
export class Playback{
  constructor(chapters,startId,duration=null){this.duration=duration;this.chapters=chapters;this.index=Math.max(0,chapters.findIndex(c=>c.id===startId));this.progress=0;this.direction=1;this.playing=false;this.phase='play';this.elapsed=0;this.listeners=[];}
  on(fn){this.listeners.push(fn);return()=>this.listeners=this.listeners.filter(f=>f!==fn);}
  get chapter(){return this.chapters[this.index];}
  get nextIndex(){const n=this.index+this.direction;return n>=0&&n<this.chapters.length?n:null;}
  get mix(){return this.phase==='fade'?Math.min(1,this.elapsed/this.chapter.fade):0;}
  notify(){this.listeners.forEach(f=>f(this));}
  toggle(){this.playing=!this.playing;this.notify();}
  play(direction=this.direction){if(direction!==this.direction){this.phase='play';this.elapsed=0;}this.direction=direction;this.playing=true;this.notify();}
  navigate(direction){if(this.playing){this.play(direction);return;}const index=this.index+direction;if(index<0||index>=this.chapters.length)return;this.direction=direction;this.seek(index,0);}
  pause(){this.playing=false;this.notify();}
  seek(index,progress=0){this.index=Math.max(0,Math.min(this.chapters.length-1,index));this.progress=Math.max(0,Math.min(1,progress));this.phase='play';this.elapsed=0;this.notify();}
  tick(seconds){
    if(!this.playing)return;
    let left=seconds,guard=0;
    while(left>0&&this.playing&&guard++<100){
      const c=this.chapter,duration=this.duration??c.duration;
      if(this.phase==='play'){
        const remaining=(this.direction===1?1-this.progress:this.progress)*duration;
        const used=Math.min(left,remaining);this.progress=Math.max(0,Math.min(1,this.progress+this.direction*used/duration));left-=used;
        if(remaining-used<1e-8){this.phase='hold';this.elapsed=0;}
      }else if(this.phase==='hold'){
        const used=Math.min(left,Math.max(0,c.hold-this.elapsed));this.elapsed+=used;left-=used;
        if(this.elapsed>=c.hold){if(this.nextIndex===null){this.playing=false;break;}this.phase='fade';this.elapsed=0;}
      }else{
        const used=Math.min(left,Math.max(0,c.fade-this.elapsed));this.elapsed+=used;left-=used;
        if(this.elapsed>=c.fade){this.index=this.nextIndex;this.progress=this.direction===1?0:1;this.phase='play';this.elapsed=0;}
      }
    }
    this.notify();
  }
}
