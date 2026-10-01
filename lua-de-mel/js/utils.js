/* Funções puras, sem DOM: usadas pelo app e pelos testes (node --test). */

export const WEEK = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

export const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3);
export const clone = o => JSON.parse(JSON.stringify(o));

export const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* Texto com quebras de linha e URLs clicáveis (já escapado). */
export const rich = s => esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,"<br>");

export const brl = v => (+v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export const eur = v => (+v||0).toLocaleString("pt-BR",{style:"currency",currency:"EUR"});

export function dateParts(iso){
  const d=new Date(iso+"T12:00:00");
  return {dd:d.getDate(), wd:WEEK[d.getDay()], mm:MONTHS[d.getMonth()]};
}
export function isoToday(now=new Date()){
  return new Date(now.getTime()-now.getTimezoneOffset()*6e4).toISOString().slice(0,10);
}
export function addDays(iso,n){
  const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n);
  return isoToday(new Date(d.getFullYear(),d.getMonth(),d.getDate(),12));
}

/* Horários livres: "9h", "14h30", "14:30", "9", "Manhã", "Tarde", "Noite". Retorna minutos ou null. */
export function mins(h){
  h=String(h||"").trim().toLowerCase();
  const m=h.match(/^(\d{1,2})(?:\s*(?:h|:)\s*(\d{2})?)?/);
  if(m&&+m[1]<24) return (+m[1])*60+(+(m[2]||0));
  if(/^manh/.test(h)) return 9*60;
  if(/^tarde/.test(h)) return 14*60;
  if(/^noite/.test(h)) return 20*60;
  return null;
}
/* Insere mantendo a ordem por horário; sem horário vai para o fim. */
export function insertByTime(items,it){
  const m=mins(it.h);
  const k=m==null?-1:items.findIndex(x=>{const v=mins(x.h);return v!=null&&v>m});
  if(k<0) items.push(it); else items.splice(k,0,it);
  return items;
}
/* Ordena por horário de forma estável; itens sem horário acompanham o anterior. */
export function sortByTime(items){
  let last=-1;
  return items.map((it,i)=>{const m=mins(it.h);if(m!=null)last=m;return {it,i,k:last}})
    .sort((a,b)=>a.k-b.k||a.i-b.i).map(x=>x.it);
}

/* Links: completa https:// e recusa esquemas que não sejam http(s). */
export function safeUrl(u){
  u=String(u||"").trim(); if(!u) return "";
  if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u="https://"+u.replace(/^\/+/,"");
  try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:""}catch(e){return ""}
}
export const hostOf = u => {try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return "Link"}};

export const gmap = q => "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q);
export const gdir = (q,mode) => "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(q)+"&travelmode="+mode;
export const gembed = q => "https://www.google.com/maps?q="+encodeURIComponent(q)+"&output=embed";
export function routeOf(places){
  const ps=places.filter(Boolean).filter((p,k,a)=>p!==a[k-1]);
  if(!ps.length) return "";
  return ps.length===1?gmap(ps[0]):"https://www.google.com/maps/dir/"+ps.map(encodeURIComponent).join("/")+"/";
}

/* Atividades: aceita o formato antigo [hora, texto, extras] e completa campos. */
export function normItem(i){
  if(Array.isArray(i)){
    const x=i[2]||{};
    i={h:i[0]||"",t:i[1]||"",p:x.p||"",how:x.how||"",obs:x.obs||"",links:(x.links||[]).map(l=>({l:l[0],u:l[1]})),done:false};
  }
  if(!i.id) i.id=uid();
  if(!Array.isArray(i.links)) i.links=[];
  for(const k of ["h","t","p","how","obs"]) if(typeof i[k]!=="string") i[k]=i[k]==null?"":String(i[k]);
  return i;
}
export function normDay(d){ d.items=(d.items||[]).map(normItem); d.flags=d.flags||[]; return d }

/* Próxima atividade não feita a partir de agora (só no dia de hoje). */
export function nextItemId(day,now=new Date()){
  if(day.date!==isoToday(now)) return null;
  const n=now.getHours()*60+now.getMinutes();
  const it=day.items.find(x=>!x.done&&mins(x.h)!=null&&mins(x.h)>=n);
  return it?it.id:null;
}

/* Valores em reais digitados como "R$ 3.875,23" ou "3875.23". */
export function parseMoney(s){
  if(typeof s==="number") return s;
  s=String(s||"").replace(/[^\d,.-]/g,"");
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",",".");
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,""); // "20.000" = vinte mil
  const v=parseFloat(s); return isFinite(v)?v:0;
}

/* Resumo de gastos: total em R$ por chave (categoria ou dia). */
export function sumBy(expenses,key,rate){
  const out={};
  for(const e of expenses){ const k=e[key]||""; out[k]=(out[k]||0)+(e.moeda==="BRL"?+e.valor:+e.valor*rate) }
  return out;
}

/* Código de clima WMO (Open-Meteo) → [rótulo, ícone]. */
export function weatherKind(code){
  if(code==null) return ["—","cloud"];
  if(code===0) return ["Céu limpo","sun"];
  if(code<=2) return ["Poucas nuvens","partly"];
  if(code===3) return ["Nublado","cloud"];
  if(code<=48) return ["Neblina","cloud"];
  if(code<=67||(code>=80&&code<=82)) return ["Chuva","rain"];
  if(code<=77||code===85||code===86) return ["Neve","snow"];
  return ["Tempestade","storm"];
}

/* Convite de sincronização: config do Firebase + código da viagem, em base64 url-safe. */
export function encodeInvite(obj){
  const b=typeof btoa==="function"?btoa(unescape(encodeURIComponent(JSON.stringify(obj)))):Buffer.from(JSON.stringify(obj),"utf8").toString("base64");
  return b.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export function decodeInvite(s){
  try{
    s=String(s).replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="=";
    const txt=typeof atob==="function"?decodeURIComponent(escape(atob(s))):Buffer.from(s,"base64").toString("utf8");
    const o=JSON.parse(txt);
    return o&&o.cfg&&o.code?o:null;
  }catch(e){return null}
}
/* Aceita o trecho copiado do console do Firebase (objeto JS) ou JSON puro. */
export function parseFirebaseConfig(txt){
  txt=String(txt||"");
  const a=txt.indexOf("{"), b=txt.lastIndexOf("}");
  if(a<0||b<a) return null;
  let body=txt.slice(a,b+1)
    .replace(/\/\/[^\n]*/g,"")
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g,'$1"$2":')
    .replace(/'([^']*)'/g,'"$1"')
    .replace(/,\s*}/g,"}");
  try{
    const o=JSON.parse(body);
    return o.apiKey&&o.projectId?o:null;
  }catch(e){return null}
}
export function newTripCode(){
  const a="abcdefghijkmnpqrstuvwxyz23456789"; let s="";
  const r=(typeof crypto!=="undefined"&&crypto.getRandomValues)?crypto.getRandomValues(new Uint8Array(24)):Array.from({length:24},()=>Math.random()*256|0);
  for(const x of r) s+=a[x%a.length];
  return s;
}
