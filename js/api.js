export class Repository{
  constructor(){this.local=false;this.token='';this.cache={};this.published=new URLSearchParams(location.search).has('published');}
  async init(){try{if(document.querySelector('meta[name=atlas-mode]')?.content==='static')throw Error('Static edition');const r=await fetch('api/status');if(r.ok){const s=await r.json();this.local=s.editor;this.token=s.token;this.cache=s.cache||{};}}catch{} if(!this.local){try{this.cache=await(await fetch('data/cache-status.json')).json();}catch{}}return this.load();}
  async load(){const r=await fetch(this.local?`api/document?mode=${this.published?'published':'draft'}`:'data/content.json');if(!r.ok)throw Error('The atlas data could not be loaded. Start it with python server.py.');return r.json();}
  async action(name,data={}){const r=await fetch(`api/${name}`,{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Token':this.token},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save.');return d;}
}
