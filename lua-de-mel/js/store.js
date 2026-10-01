/* Estado do app, salvamento local, sincronização pelo Firebase e anexos (IndexedDB). */
import {clone, normDay, uid} from "./utils.js?v=6";
import {DEFAULT_DAYS, DEFAULT_BOOKINGS, DEFAULT_CHECKLIST, DEFAULT_BUDGET} from "./data.js?v=6";

const LS_KEY = "ldm-paris-v1";
const LS_SYNC = "ldm-sync";
const FB_VER = "10.12.2";
export const MAX_SYNC_FILE = 600*1024; // limite de um documento do Firestore, com folga

export const state = {
  v:2, days:null, notes:{}, checks:{}, checklist:null, bookings:null, budget:null, expenses:[], wishes:[]
};

/* ---------- Leitura com valores padrão ---------- */
export function getDays(){
  if(!state.days) state.days=clone(DEFAULT_DAYS);
  state.days.forEach(normDay);
  state.days.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  return state.days;
}
export const getChecklist = () => state.checklist || (state.checklist=clone(DEFAULT_CHECKLIST));
export const getBookings  = () => state.bookings  || (state.bookings=clone(DEFAULT_BOOKINGS));
export function getBudget(){
  if(!state.budget) state.budget=clone(DEFAULT_BUDGET);
  const b=state.budget; b.paid=b.paid||[]; b.plan=b.plan||[]; if(!(b.rate>0)) b.rate=6.5; if(!(b.ceiling>=0)) b.ceiling=0;
  b.plan.forEach(p=>{ if(p.value==null){ p.value=+p.eur||0; p.cur=p.cur||"EUR" } if(p.cur!=="BRL") p.cur="EUR"; delete p.eur; p.note=p.note||""; p.name=p.name||"" });
  return b;
}

/* ---------- Local ---------- */
export function loadLocal(){
  try{
    const s=JSON.parse(localStorage.getItem(LS_KEY)||"null");
    if(!s) return;
    if(!s.v){ // versão 1: câmbio solto no estado
      if(s.rate>0){ s.budget=clone(DEFAULT_BUDGET); s.budget.rate=s.rate }
      delete s.rate; s.v=2;
    }
    Object.assign(state,s);
  }catch(e){}
}
export function saveLocal(){ try{localStorage.setItem(LS_KEY,JSON.stringify(state))}catch(e){} }

/* ---------- Eventos para a interface ---------- */
const listeners=new Set();
export const onChange = fn => listeners.add(fn);
const emit = key => listeners.forEach(fn=>{try{fn(key)}catch(e){console.error(e)}});

/* ---------- Sincronização ---------- */
export const sync = {mode:"local", status:"local", message:"", code:"", cfg:null};
let fb=null;        // {fs, mod}
let base="";        // viagens/{código}
const unsubs=[];

export function getSyncConfig(){ try{return JSON.parse(localStorage.getItem(LS_SYNC)||"null")}catch(e){return null} }
function setSyncConfig(v){ try{v?localStorage.setItem(LS_SYNC,JSON.stringify(v)):localStorage.removeItem(LS_SYNC)}catch(e){} }

function setStatus(status,message=""){ sync.status=status; sync.message=message; emit("sync") }

async function loadFirebase(cfg){
  const url=`https://www.gstatic.com/firebasejs/${FB_VER}/`;
  const [appMod,mod]=await Promise.all([import(url+"firebase-app.js"),import(url+"firebase-firestore.js")]);
  const name="ldm-"+cfg.projectId;
  const app=appMod.getApps().find(a=>a.name===name)||appMod.initializeApp(cfg,name);
  let fs;
  try{ fs=mod.initializeFirestore(app,{localCache:mod.persistentLocalCache({tabManager:mod.persistentMultipleTabManager()})}) }
  catch(e){ fs=mod.getFirestore(app) }
  return {fs,mod};
}
const ref = p => fb.mod.doc(fb.fs, base+"/"+p);
const col = p => fb.mod.collection(fb.fs, base+"/"+p);
const J = v => ({v:JSON.stringify(v)});
const P = d => {try{return JSON.parse(d.v)}catch(e){return null}};

function fail(e){
  console.error(e);
  const denied=e&&(e.code==="permission-denied"||/permission/i.test(e.message||""));
  setStatus("error", denied?"O Firestore recusou o acesso. Confira as regras do Firestore (passo 3 do guia de sincronização).":"Não foi possível sincronizar agora. As mudanças continuam salvas neste aparelho.");
}
function write(promise){ if(promise) promise.catch(fail) }

/* Envia tudo deste aparelho (primeira vez que a viagem é criada). */
async function pushAll(){
  const {mod}=fb, b=mod.writeBatch(fb.fs);
  getDays().forEach(d=>b.set(ref("dias/"+d.id),J(d)));
  Object.entries(state.notes).forEach(([k,v])=>b.set(ref("notas/"+k),{texto:v}));
  b.set(ref("estado/checks"),{itens:state.checks});
  b.set(ref("estado/checklist"),J(getChecklist()));
  b.set(ref("estado/bookings"),J(getBookings()));
  b.set(ref("estado/budget"),J(getBudget()));
  b.set(ref("estado/wishes"),J(state.wishes));
  state.expenses.forEach(e=>b.set(ref("gastos/"+e.id),e));
  b.set(ref("estado/meta"),{criadoEm:Date.now()});
  await b.commit();
  for(const f of files.values()) await uploadFile(f.id).catch(()=>{});
}

function subscribe(){
  const {mod}=fb;
  const on=(q,fn)=>unsubs.push(mod.onSnapshot(q,{includeMetadataChanges:false},fn,fail));
  on(col("dias"),s=>{
    let ch=false;
    s.docChanges().forEach(c=>{
      if(c.type==="removed") return;
      const d=P(c.doc.data()); if(!d||!d.id) return;
      const days=getDays(), k=days.findIndex(x=>x.id===d.id);
      k<0?days.push(normDay(d)):(days[k]=normDay(d)); ch=true;
    });
    if(ch){ saveLocal(); emit("days") }
  });
  on(col("notas"),s=>{ s.docs.forEach(d=>{state.notes[d.id]=(d.data()||{}).texto||""}); saveLocal(); emit("notes") });
  on(col("estado"),s=>{
    s.docChanges().forEach(c=>{
      if(c.type==="removed") return;
      const id=c.doc.id, data=c.doc.data()||{};
      if(id==="checks") state.checks={...(data.itens||{})};
      else if(["checklist","bookings","budget","wishes"].includes(id)){ const v=P(data); if(v!=null) state[id]=v }
      else return;
      emit(id);
    });
    saveLocal();
  });
  on(col("gastos"),s=>{ state.expenses=s.docs.map(d=>({...d.data(),id:d.id})); saveLocal(); emit("expenses") });
  on(col("anexos"),async s=>{
    for(const c of s.docChanges()){
      const id=c.doc.id;
      if(c.type==="removed"){ if(files.has(id)){ await idb("delete",id); files.delete(id) } continue }
      if(files.has(id)) continue;
      const d=c.doc.data(); if(!d||!d.data) continue;
      const blob=b64ToBlob(d.data,d.type);
      const rec={id,owner:d.owner,name:d.name,type:d.type,size:blob.size,criadoEm:d.criadoEm||Date.now(),synced:true,blob};
      await idb("put",rec); files.set(id,meta(rec));
    }
    emit("files");
  });
}

export async function connect(){
  const c=getSyncConfig();
  if(!c||!c.cfg||!c.code){ sync.mode="local"; setStatus("local"); return }
  sync.mode="firebase"; sync.cfg=c.cfg; sync.code=c.code; base="viagens/"+c.code;
  setStatus("connecting");
  try{
    fb=await loadFirebase(c.cfg);
    const meta=await fb.mod.getDoc(ref("estado/meta"));
    if(!meta.exists()) await pushAll();
    subscribe();
    setStatus(navigator.onLine===false?"offline":"online");
  }catch(e){ fail(e) }
}
addEventListener("online",()=>{ if(sync.mode==="firebase"&&sync.status!=="error") setStatus("online") });
addEventListener("offline",()=>{ if(sync.mode==="firebase") setStatus("offline") });

export async function enableSync(cfg,code){
  disconnect(); setSyncConfig({cfg,code}); await connect();
}
export function disableSync(){ disconnect(); setSyncConfig(null); sync.mode="local"; setStatus("local") }
function disconnect(){ while(unsubs.length) try{unsubs.pop()()}catch(e){} fb=null }

/* ---------- Gravação: sempre local; na nuvem quando houver ---------- */
const online = () => sync.mode==="firebase"&&fb;
export function commitDay(id){
  saveLocal(); emit("stats");
  const d=getDays().find(x=>x.id===id);
  if(online()&&d) write(fb.mod.setDoc(ref("dias/"+id),J(d)));
}
export function commitNote(day){ saveLocal(); if(online()) write(fb.mod.setDoc(ref("notas/"+day),{texto:state.notes[day]||""})) }
export function commitCheck(id){ saveLocal(); emit("stats"); if(online()) write(fb.mod.setDoc(ref("estado/checks"),{itens:{[id]:!!state.checks[id]}},{merge:true})) }
export function commitDoc(key){ saveLocal(); emit("stats"); if(online()) write(fb.mod.setDoc(ref("estado/"+key),J(state[key]))) }
export function addExpense(e){
  e.id=e.id||uid(); state.expenses.push(e); saveLocal(); emit("expenses");
  if(online()) write(fb.mod.setDoc(ref("gastos/"+e.id),e));
}
export function removeExpense(id){
  state.expenses=state.expenses.filter(e=>e.id!==id); saveLocal(); emit("expenses");
  if(online()) write(fb.mod.deleteDoc(ref("gastos/"+id)));
}
export function replaceAll(s){
  for(const k of ["days","notes","checks","checklist","bookings","budget","expenses","wishes"]) if(k in s) state[k]=s[k];
  saveLocal();
  if(online()) pushAll().catch(fail);
  emit("all");
}

/* ---------- Anexos (ingressos, QR codes, comprovantes) ---------- */
export const files=new Map(); // id → {id, owner, name, type, size, criadoEm, synced}
const meta = r => ({id:r.id,owner:r.owner,name:r.name,type:r.type,size:r.size,criadoEm:r.criadoEm,synced:!!r.synced});
let dbp=null;
function idbOpen(){
  if(dbp) return dbp;
  dbp=new Promise((res,rej)=>{
    const r=indexedDB.open("ldm-files",1);
    r.onupgradeneeded=()=>r.result.createObjectStore("files",{keyPath:"id"});
    r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
  });
  return dbp;
}
async function idb(op,arg){
  const db=await idbOpen();
  return new Promise((res,rej)=>{
    const tx=db.transaction("files",op==="get"||op==="getAll"?"readonly":"readwrite");
    const st=tx.objectStore("files"), r=st[op](arg);
    r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
  });
}
export async function loadFiles(){
  try{ (await idb("getAll")).forEach(r=>files.set(r.id,meta(r))) }catch(e){}
  emit("files");
}
export const filesOf = owner => [...files.values()].filter(f=>f.owner===owner).sort((a,b)=>a.criadoEm-b.criadoEm);

async function compressImage(file){
  if(!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type)||typeof createImageBitmap!=="function") return file;
  try{
    const bmp=await createImageBitmap(file);
    const k=Math.min(1,1800/Math.max(bmp.width,bmp.height));
    const c=document.createElement("canvas"); c.width=Math.round(bmp.width*k); c.height=Math.round(bmp.height*k);
    c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",.85));
    return blob&&blob.size<file.size?new File([blob],file.name.replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"}):file;
  }catch(e){return file}
}
const blobToB64 = b => new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(b)});
function b64ToBlob(b64,type){ const bin=atob(b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new Blob([u],{type}) }

async function uploadFile(id){
  if(!online()) return false;
  const r=await idb("get",id);
  if(!r||r.blob.size>MAX_SYNC_FILE) return false;
  await fb.mod.setDoc(ref("anexos/"+id),{owner:r.owner,name:r.name,type:r.type,size:r.blob.size,criadoEm:r.criadoEm,data:await blobToB64(r.blob)});
  r.synced=true; await idb("put",r); files.set(id,meta(r));
  return true;
}
export async function addFile(owner,file){
  const f=await compressImage(file);
  const rec={id:uid(),owner,name:f.name||"anexo",type:f.type||"application/octet-stream",size:f.size,criadoEm:Date.now(),synced:false,blob:f};
  await idb("put",rec); files.set(rec.id,meta(rec)); emit("files");
  uploadFile(rec.id).then(ok=>ok&&emit("files")).catch(fail);
  return files.get(rec.id);
}
export async function removeFile(id){
  await idb("delete",id); files.delete(id); emit("files");
  if(online()) write(fb.mod.deleteDoc(ref("anexos/"+id)));
}
export async function fileBlob(id){ const r=await idb("get",id); return r&&r.blob }

/* ---------- Backup ---------- */
export async function exportData(){
  const out={app:"lua-de-mel-paris",versao:2,exportadoEm:new Date().toISOString(),dados:clone(state),anexos:[]};
  try{ for(const r of await idb("getAll")) out.anexos.push({...meta(r),data:await blobToB64(r.blob)}) }catch(e){}
  return out;
}
export async function importData(j){
  if(!j||j.app!=="lua-de-mel-paris"||!j.dados) throw new Error("formato");
  const s=j.dados;
  if(!s.v&&s.rate>0){ s.budget=clone(DEFAULT_BUDGET); s.budget.rate=s.rate }
  for(const a of j.anexos||[]){
    const blob=b64ToBlob(a.data,a.type);
    const rec={id:a.id,owner:a.owner,name:a.name,type:a.type,size:blob.size,criadoEm:a.criadoEm||Date.now(),synced:false,blob};
    await idb("put",rec); files.set(rec.id,meta(rec));
  }
  replaceAll({days:s.days||null,notes:s.notes||{},checks:s.checks||{},checklist:s.checklist||null,bookings:s.bookings||null,
    budget:s.budget||null,expenses:Array.isArray(s.expenses)?s.expenses:[],wishes:Array.isArray(s.wishes)?s.wishes:[]});
  emit("files");
}
