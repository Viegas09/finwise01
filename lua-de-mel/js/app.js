import {esc, rich, brl, eur, uid, clone, dateParts, isoToday, mins, insertByTime, sortByTime, safeUrl, hostOf,
  gmap, gdir, gembed, routeOf, normItem, normDay, nextItemId, parseMoney, sumBy, weatherKind,
  encodeInvite, decodeInvite, parseFirebaseConfig, newTripCode} from "./utils.js";
import {DEFAULT_DAYS, PHASES, FLAG_KINDS, TRIP, BOOKING_KINDS, WISH_KINDS, EMERGENCY, PHRASES} from "./data.js";
import * as S from "./store.js";
import * as W from "./weather.js";

const {state}=S;
const $ = id => document.getElementById(id);
const REPO_GUIDE = "https://github.com/Viegas09/finwise01/blob/main/lua-de-mel/README.md#sincroniza%C3%A7%C3%A3o-entre-os-dois-celulares";

/* ---------- Ícones ---------- */
const svg = (d,w=2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  up:svg('<path d="M6 15l6-6 6 6"/>',2.2), down:svg('<path d="M6 9l6 6 6-6"/>',2.2),
  del:svg('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',2.2), plus:svg('<path d="M12 5v14M5 12h14"/>',2.4),
  edit:svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'), check:svg('<path d="M5 12l5 5 9-10"/>',2.4),
  pin:svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  route:svg('<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14M8 20l2-4M16 20l-2-4"/>'),
  walk:svg('<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M9 12l2-4 3 2 3 1M11 8l-1 5"/>'),
  map:svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  link:svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  ext:svg('<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>'),
  note:svg('<path d="M5 4h14v12l-4 4H5z"/><path d="M9 9h6M9 13h4"/>'),
  clock:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  clip:svg('<path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>'),
  phone:svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  cal:svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  cloudsync:svg('<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8z"/>'),
  sun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  partly:svg('<path d="M8 4v1M3.5 6.5l.7.7M2 11h1M12.5 6.5l-.7.7"/><path d="M5.5 11a3.5 3.5 0 0 1 6.6-1.6"/><path d="M8 20a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.5A3.3 3.3 0 0 1 17 20z"/>'),
  cloud:svg('<path d="M7 19a5 5 0 1 1 1-9.9A6 6 0 0 1 19 11a4 4 0 0 1 0 8z"/>'),
  rain:svg('<path d="M7 15a5 5 0 1 1 1-9.9A6 6 0 0 1 19 7a4 4 0 0 1 0 8z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>'),
  snow:svg('<path d="M7 15a5 5 0 1 1 1-9.9A6 6 0 0 1 19 7a4 4 0 0 1 0 8z"/><path d="M8 19h.01M12 21h.01M16 19h.01"/>',3),
  storm:svg('<path d="M7 15a5 5 0 1 1 1-9.9A6 6 0 0 1 19 7a4 4 0 0 1 0 8z"/><path d="M13 14l-3 4h4l-3 4"/>')
};

/* ---------- Utilidades de interface ---------- */
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2400)}
const typing = el => el.contains(document.activeElement)&&document.activeElement.matches("input,textarea,select");
/* Não redesenha uma área enquanto alguém digita nela; redesenha ao sair do campo. */
const pending=new Map();
function guarded(elId,fn,force){
  const el=$(elId);
  if(!force&&el&&typing(el)){pending.set(elId,fn);return}
  pending.delete(elId); fn();
}
document.addEventListener("focusout",()=>setTimeout(()=>{for(const [id,fn] of [...pending]) if(!typing($(id))){pending.delete(id);fn()}},0));
const opt = (v,label,sel) => `<option value="${esc(v)}"${sel?" selected":""}>${esc(label)}</option>`;
const dayLabel = d => {const p=dateParts(d.date);return `${p.wd}, ${p.dd} ${p.mm} · ${d.title}`};
const tripDayToday = () => S.getDays().find(d=>d.date===isoToday());

/* ---------- Anexos (componente usado em atividades e reservas) ---------- */
function filesBlock(owner){
  const list=S.filesOf(owner);
  return `<div class="files"><b>${I.clip}Ingressos e anexos</b>
    ${list.length?`<div class="btns">${list.map(f=>`<button type="button" class="btn sm file" data-act="open-file" data-file="${f.id}">${I.clip}${esc(f.name)}${S.sync.mode==="firebase"&&!f.synced?` <small>(só neste celular)</small>`:""}</button>`).join("")}</div>`:`<p class="hint">Foto ou PDF do ingresso, QR code, comprovante. Fica guardado para abrir sem internet.</p>`}
    <label class="btn sm add-line">${I.plus}Adicionar anexo<input type="file" class="sr" data-owner="${esc(owner)}" accept="image/*,application/pdf"></label>
  </div>`;
}
document.addEventListener("change",async e=>{
  const inp=e.target; if(!inp.matches('input[type=file][data-owner]')) return;
  const f=inp.files[0]; inp.value=""; if(!f) return;
  if(f.size>25*1024*1024){ toast("Arquivo grande demais (máx. 25 MB)"); return }
  toast("Salvando anexo…");
  const m=await S.addFile(inp.dataset.owner,f);
  toast(S.sync.mode==="firebase"&&m.size>S.MAX_SYNC_FILE?"Anexo salvo. Grande demais para sincronizar: fica só neste celular":"Anexo salvo");
});
async function openFile(id){
  const f=S.files.get(id), blob=await S.fileBlob(id); if(!f||!blob) return;
  const url=URL.createObjectURL(blob), dlg=$("viewer");
  $("viewer-title").textContent=f.name;
  $("viewer-body").innerHTML=f.type.startsWith("image/")?`<img src="${url}" alt="${esc(f.name)}">`
    :f.type==="application/pdf"?`<iframe src="${url}" title="${esc(f.name)}"></iframe>`:`<p class="hint">Pré-visualização indisponível. Use “Baixar”.</p>`;
  $("viewer-dl").href=url; $("viewer-dl").download=f.name;
  $("viewer-del").onclick=async()=>{ if(!confirm(`Excluir “${f.name}”?`)) return; await S.removeFile(id); dlg.close(); toast("Anexo excluído") };
  dlg.onclose=()=>setTimeout(()=>URL.revokeObjectURL(url),500);
  dlg.showModal();
}
document.addEventListener("click",e=>{const b=e.target.closest('[data-act="open-file"]'); if(b) openFile(b.dataset.file)});

/* ======================================================================
   CABEÇALHO
   ====================================================================== */
function renderCountdown(){
  const dep=new Date(TRIP.depart), back=new Date(TRIP.back), now=new Date(), el=$("countdown");
  if(now<dep){const d=Math.ceil((dep-now)/864e5);el.innerHTML=`<strong>${d}</strong><span>${d===1?"dia":"dias"} para o embarque</span>`}
  else if(now<back){el.innerHTML=`<strong>Bon voyage</strong><span>a viagem está acontecendo</span>`}
  else{el.innerHTML=`<strong>Voltaram</strong><span>que lua de mel</span>`}
}
function updateStats(){
  const all=S.getChecklist().flatMap(g=>g.items), done=all.filter(i=>state.checks[i.id]).length;
  const acts=S.getDays().reduce((s,d)=>s+d.items.length,0);
  const spent=Object.values(sumBy(state.expenses,"cat",S.getBudget().rate)).reduce((a,b)=>a+b,0);
  $("stats").innerHTML=`<div class="stat"><span>Atividades</span><b>${acts}</b></div><div class="stat"><span>Checklist</span><b>${done}/${all.length}</b></div><div class="stat"><span>Gasto na viagem</span><b>${brl(spent)}</b></div>`;
}
function renderSyncBadge(){
  const st=S.sync.status, txt={local:"Só neste celular",connecting:"Conectando…",online:"Sincronizado",offline:"Sem internet",error:"Erro ao sincronizar"}[st];
  $("sync-badge").className="sync-badge "+st; $("sync-badge").innerHTML=`${I.cloudsync}<span>${txt}</span>`;
}

/* ======================================================================
   ROTEIRO
   ====================================================================== */
const openDays=new Set(), editDays=new Set(), openItems=new Set(), mapItems=new Set();
let editItem=null;
const dayById = id => S.getDays().find(d=>d.id===id);
const itemById = (d,iid) => d.items.find(x=>x.id===iid);
const openOnly = (d,iid) => { d.items.forEach(x=>openItems.delete(x.id)); if(iid) openItems.add(iid) };

function wxMini(d){
  const f=W.forecast(d); if(!f) return "";
  const [label,ic]=weatherKind(f.code);
  return `<span class="wx" title="${esc(label)}">${I[ic]}${Math.round(f.max)}°/${Math.round(f.min)}°${f.rain!=null?` · ${f.rain}%`:""}</span>`;
}
function wxLine(d){
  const f=W.forecast(d), today=isoToday();
  if(d.date<today) return "";
  if(!f){ const from=W.availableFrom(d.date), p=dateParts(from);
    return `<p class="wxline muted">${I.cloud}Previsão do tempo a partir de ${p.dd} ${p.mm}. Média de outubro em Paris: 8 a 15 °C, chuva frequente.</p>` }
  const [label,ic]=weatherKind(f.code);
  return `<p class="wxline">${I[ic]}<span><b>${esc(label)}</b>, ${Math.round(f.min)} a ${Math.round(f.max)} °C${f.rain!=null?`, ${f.rain}% de chance de chuva`:""}</span></p>`;
}
function renderStrip(){
  const t=isoToday();
  $("strip").innerHTML=S.getDays().map(d=>{const p=dateParts(d.date);return `<button type="button" class="chip${d.date===t?" today":""}" data-go="${d.id}" style="--c:${(PHASES[d.phase]||PHASES.paris)[1]}" aria-label="${p.wd} ${p.dd}: ${esc(d.title)}"><small>${p.wd}</small><b>${p.dd}</b><i></i></button>`}).join("");
}
function itemMeta(it){
  const parts=[], nf=S.filesOf(it.id).length;
  if(it.p) parts.push(`<span>${I.pin}${esc(it.p.split(",")[0])}</span>`);
  if(it.how) parts.push(`<span>${I.route}Como chegar</span>`);
  if(it.links.length) parts.push(`<span>${I.link}${it.links.length} ${it.links.length===1?"link":"links"}</span>`);
  if(nf) parts.push(`<span>${I.clip}${nf} ${nf===1?"anexo":"anexos"}</span>`);
  if(it.obs) parts.push(`<span>${I.note}Obs.</span>`);
  return parts.length?`<span class="act-meta">${parts.join("")}</span>`:"";
}
function placeButtons(place,key,mapOpen){
  return `<div class="btns">
      <a class="btn sm primary" target="_blank" rel="noopener" href="${gdir(place,"transit")}">${I.route}Rota de transporte</a>
      <a class="btn sm" target="_blank" rel="noopener" href="${gdir(place,"walking")}">${I.walk}A pé</a>
      <a class="btn sm" target="_blank" rel="noopener" href="${gmap(place)}">${I.pin}Abrir no Maps</a>
      ${key?`<button type="button" class="btn sm" data-act="map-item" data-key="${key}" aria-expanded="${mapOpen}">${I.map}${mapOpen?"Esconder mapa":"Ver mapa aqui"}</button>`:""}
    </div>
    ${mapOpen?`<div class="mapbox"><iframe loading="lazy" src="${gembed(place)}" title="Mapa: ${esc(place)}" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`:""}`;
}
function itemDetail(d,it){
  const mapOpen=mapItems.has(it.id), empty=!it.p&&!it.how&&!it.links.length&&!it.obs;
  return `<div class="detail">
    ${it.how?`<div class="how"><b>${I.route}Como chegar</b><p>${rich(it.how)}</p></div>`:""}
    ${it.p?`<div class="place"><b>${I.pin}${esc(it.p)}</b>${placeButtons(it.p,it.id,mapOpen)}</div>`:""}
    ${it.links.length?`<div class="links"><b>${I.link}Links</b><div class="btns">${it.links.map(l=>`<a class="btn sm" target="_blank" rel="noopener" href="${esc(l.u)}">${I.ext}${esc(l.l||hostOf(l.u))}</a>`).join("")}</div></div>`:""}
    ${it.obs?`<div class="obs"><b>${I.note}Observações</b><p>${rich(it.obs)}</p></div>`:""}
    ${filesBlock(it.id)}
    ${empty?`<p class="hint">Acrescente o local (para rota e mapa), como chegar e links úteis, como ingressos e reservas.</p>`:""}
    <div class="btns"><button type="button" class="btn sm" data-act="edit-item" data-day="${d.id}" data-item="${it.id}">${I.edit}${empty?"Adicionar detalhes":"Editar atividade"}</button></div>
  </div>`;
}
function linkRow(l,u){
  return `<div class="lrow"><input name="ll" value="${esc(l||"")}" placeholder="Nome (ex.: Ingressos)" aria-label="Nome do link"><input name="lu" value="${esc(u||"")}" placeholder="https://…" inputmode="url" autocapitalize="off" aria-label="Endereço do link"><button type="button" class="ib del" data-act="del-link-row" aria-label="Remover link">${I.del}</button></div>`;
}
function itemForm(d,it){
  const k=d.id+"-"+it.id;
  return `<form class="iform" data-item-form data-day="${d.id}" data-item="${it.id}">
    <div class="fgrid">
      <div class="fl"><label for="h-${k}">Horário</label><input id="h-${k}" name="h" value="${esc(it.h)}" placeholder="ex.: 14h30"></div>
      <div class="fl"><label for="done-${k}">Situação</label><select id="done-${k}" name="done">${opt("0","A fazer",!it.done)}${opt("1","Feito",it.done)}</select></div>
      <div class="fl wide"><label for="t-${k}">Atividade</label><input id="t-${k}" name="t" value="${esc(it.t)}" required></div>
      <div class="fl wide"><label for="p-${k}">Local para o mapa</label><input id="p-${k}" name="p" value="${esc(it.p)}" placeholder="Nome do lugar ou endereço (ex.: Musée du Louvre, Paris)"></div>
      <div class="fl wide"><label for="how-${k}">Como chegar</label><textarea id="how-${k}" name="how" rows="3" placeholder="Linha de metrô, estação, trem, tempo de trajeto…">${esc(it.how)}</textarea></div>
      <div class="fl wide"><label for="obs-${k}">Observações</label><textarea id="obs-${k}" name="obs" rows="2" placeholder="Código da reserva, o que levar, dica…">${esc(it.obs)}</textarea></div>
    </div>
    <h4>Links</h4>
    <div class="lrows">${it.links.map(l=>linkRow(l.l,l.u)).join("")}</div>
    <button type="button" class="btn sm add-line" data-act="add-link-row">${I.plus}Adicionar link</button>
    <div class="day-actions">
      <button type="submit" class="btn primary">${I.check}Salvar</button>
      <button type="button" class="btn" data-act="cancel-item" data-day="${d.id}">Cancelar</button>
      <button type="button" class="btn ghost danger" data-act="del-item" data-day="${d.id}" data-item="${it.id}">${I.del}Excluir</button>
    </div>
  </form>`;
}
function viewBody(d){
  const route=routeOf(d.items.map(i=>i.p)), nx=nextItemId(d);
  const spent=sumBy(state.expenses,"day",S.getBudget().rate)[d.id];
  const top=`${wxLine(d)}${route?`<div class="btns day-tools"><a class="btn sm" target="_blank" rel="noopener" href="${route}">${I.map}Ver o dia no mapa</a></div>`:""}`;
  const flags=d.flags.length?`<div class="flags">${d.flags.map(f=>`<span class="flag ${esc(f[0])}">${esc(f[1])}</span>`).join("")}</div>`:"";
  const items=d.items.length
    ? `<ul class="acts">${d.items.map(it=>{const open=openItems.has(it.id);return `<li class="act${it.done?" done":""}${it.id===nx?" next":""}${open?" open":""}">
        <div class="act-row">
          <span class="time${it.h?"":" empty"}">${esc(it.h||"—")}</span>
          <button type="button" class="act-main" data-act="item" data-day="${d.id}" data-item="${it.id}" aria-expanded="${open}">
            ${it.id===nx?`<span class="badge">Próximo</span>`:""}<span class="txt">${esc(it.t)}</span>${itemMeta(it)}
          </button>
          <button type="button" class="tick" data-act="done-item" data-day="${d.id}" data-item="${it.id}" aria-pressed="${!!it.done}" aria-label="${it.done?"Desmarcar":"Marcar como feito"}: ${esc(it.t)}">${I.check}</button>
        </div>
        ${open?`<div class="act-detail">${editItem===it.id?itemForm(d,it):itemDetail(d,it)}</div>`:""}
      </li>`}).join("")}</ul>`
    : `<p class="tl-empty">Nada planejado ainda.</p>`;
  return `${top}${flags}${items}
    <form class="quick" data-quick="${d.id}">
      <input name="h" placeholder="Hora" aria-label="Horário" autocomplete="off">
      <input name="t" placeholder="Acrescentar atividade…" aria-label="Nova atividade" autocomplete="off" required>
      <button type="submit" aria-label="Adicionar atividade">${I.plus}<span>Add</span></button>
    </form>
    ${d.cost||spent?`<p class="cost">${d.cost?`<span>Custo previsto</span>${esc(d.cost)}`:""}${spent?`<span class="spent">Gasto: ${brl(spent)}</span>`:""}</p>`:""}
    <label class="note-label" for="n-${d.id}">Anotações do dia</label>
    <textarea class="note" id="n-${d.id}" data-day="${d.id}" placeholder="Restaurante que alguém indicou, horário de um show, o que levar…"></textarea>
    <div class="day-actions"><button type="button" class="btn" data-act="edit" data-day="${d.id}">${I.edit}Editar dia</button></div>`;
}
function editBody(d){
  const n=d.items.length, fl=d.flags, hasDefault=DEFAULT_DAYS.some(x=>x.id===d.id);
  return `<div class="edit">
    <h4>Informações</h4>
    <div class="fgrid">
      <div class="fl wide"><label for="e-title-${d.id}">Título</label><input id="e-title-${d.id}" data-f="title" data-day="${d.id}" value="${esc(d.title)}"></div>
      <div class="fl"><label for="e-base-${d.id}">Local</label><input id="e-base-${d.id}" data-f="base" data-day="${d.id}" value="${esc(d.base)}"></div>
      <div class="fl"><label for="e-phase-${d.id}">Tipo</label><select id="e-phase-${d.id}" data-f="phase" data-day="${d.id}">${Object.entries(PHASES).map(([k,v])=>opt(k,v[0],d.phase===k)).join("")}</select></div>
      <div class="fl wide"><label for="e-cost-${d.id}">Custo previsto do dia</label><input id="e-cost-${d.id}" data-f="cost" data-day="${d.id}" value="${esc(d.cost||"")}" placeholder="ex.: cerca de €100"></div>
    </div>
    <h4>Atividades</h4>
    <p class="hint" style="margin-top:0">Local, rota, links e anexos de cada atividade: toque nela fora do modo de edição.</p>
    ${d.items.map((it,i)=>`<div class="row">
      <input data-f="ih" data-day="${d.id}" data-i="${i}" value="${esc(it.h)}" placeholder="Hora" aria-label="Horário da atividade ${i+1}">
      <input data-f="it" data-day="${d.id}" data-i="${i}" value="${esc(it.t)}" placeholder="Atividade" aria-label="Atividade ${i+1}">
      <span class="tools">
        <button type="button" class="ib" data-act="up" data-day="${d.id}" data-i="${i}" aria-label="Subir"${i===0?" disabled":""}>${I.up}</button>
        <button type="button" class="ib" data-act="down" data-day="${d.id}" data-i="${i}" aria-label="Descer"${i===n-1?" disabled":""}>${I.down}</button>
        <button type="button" class="ib del" data-act="del" data-day="${d.id}" data-i="${i}" aria-label="Remover atividade">${I.del}</button>
      </span></div>`).join("")||`<p class="tl-empty">Nenhuma atividade.</p>`}
    <div class="btns">
      <button type="button" class="btn add-line" data-act="add-item" data-day="${d.id}">${I.plus}Adicionar atividade</button>
      ${n>1?`<button type="button" class="btn add-line" data-act="sort" data-day="${d.id}">${I.clock}Ordenar por horário</button>`:""}
    </div>
    <h4>Avisos</h4>
    ${fl.map((f,i)=>`<div class="row flagrow">
      <select data-f="fk" data-day="${d.id}" data-i="${i}" aria-label="Tipo do aviso">${Object.entries(FLAG_KINDS).map(([k,v])=>opt(k,v,f[0]===k)).join("")}</select>
      <input data-f="ft" data-day="${d.id}" data-i="${i}" value="${esc(f[1])}" placeholder="Texto do aviso" aria-label="Texto do aviso">
      <span class="tools"><button type="button" class="ib del" data-act="del-flag" data-day="${d.id}" data-i="${i}" aria-label="Remover aviso">${I.del}</button></span></div>`).join("")||`<p class="tl-empty">Nenhum aviso.</p>`}
    <button type="button" class="btn add-line" data-act="add-flag" data-day="${d.id}">${I.plus}Adicionar aviso</button>
    <div class="day-actions">
      <button type="button" class="btn primary" data-act="done" data-day="${d.id}">${I.check}Concluir</button>
      ${hasDefault?`<button type="button" class="btn ghost danger" data-act="reset" data-day="${d.id}">Restaurar original</button>`:""}
    </div>
  </div>`;
}
function dayHTML(d){
  const t=isoToday(), open=openDays.has(d.id), edit=editDays.has(d.id), p=dateParts(d.date), ph=PHASES[d.phase]||PHASES.paris;
  const doneN=d.items.filter(x=>x.done).length;
  return `<article class="day${d.date===t?" today":""}" id="day-${d.id}" style="--c:${ph[1]};--soft:${ph[2]}">
    <button type="button" class="day-head" data-act="toggle" data-day="${d.id}" aria-expanded="${open}" aria-controls="body-${d.id}">
      <span class="date"><b>${p.dd}</b><small>${p.wd}</small></span>
      <span class="ttl"><span class="dtitle">${esc(d.title)}</span><span class="meta"><span>${esc(d.base)}</span><span class="count">${doneN?`${doneN}/`:""}${d.items.length} ${d.items.length===1?"atividade":"atividades"}</span>${wxMini(d)}${state.notes[d.id]?`<span>${I.note}</span>`:""}</span></span>
      <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="day-body" id="body-${d.id}"${open?"":" hidden"}>${open?(edit?editBody(d):viewBody(d)):""}</div>
  </article>`;
}
function renderDays(force){
  guarded("line",()=>{
    if(editItem&&!force) return;
    renderStrip(); $("line").innerHTML=S.getDays().map(dayHTML).join(""); fillNotes();
  },force);
}
function renderDay(id){
  const d=dayById(id), el=$("day-"+id); if(!d||!el) return;
  el.outerHTML=dayHTML(d); fillNotes(); renderStrip();
}
function fillNotes(){
  document.querySelectorAll("textarea.note").forEach(t=>{ if(document.activeElement!==t) t.value=state.notes[t.dataset.day]||"" });
}
function setupDays(){
  const line=$("line"), save=id=>S.commitDay(id);
  line.addEventListener("click",e=>{
    const b=e.target.closest("[data-act]"); if(!b) return;
    const act=b.dataset.act;
    if(act==="add-link-row"){ b.previousElementSibling.insertAdjacentHTML("beforeend",linkRow()); b.previousElementSibling.lastElementChild.querySelector("input").focus(); return }
    if(act==="del-link-row"){ b.closest(".lrow").remove(); return }
    if(act==="map-item"){ const k=b.dataset.key; mapItems.has(k)?mapItems.delete(k):mapItems.add(k); renderDay(b.closest(".day").id.slice(4)); return }
    const id=b.dataset.day, d=dayById(id); if(!d) return;
    const i=+b.dataset.i, it=b.dataset.item?itemById(d,b.dataset.item):null;
    switch(act){
      case "toggle": openDays.has(id)?openDays.delete(id):openDays.add(id); if(!openDays.has(id)) editDays.delete(id); renderDay(id); return;
      case "item": { const was=openItems.has(it.id); openOnly(d,was?null:it.id); if(editItem===it.id) editItem=null; renderDay(id); return }
      case "edit-item": editItem=it.id; renderDay(id); focusIn(id,'[data-item-form] input[name="t"]'); return;
      case "cancel-item": editItem=null; renderDay(id); return;
      case "del-item": if(!confirm(`Excluir “${it.t}”?`)) return; d.items=d.items.filter(x=>x!==it); editItem=null; save(id); renderDay(id); toast("Atividade excluída"); return;
      case "done-item": it.done=!it.done; save(id); renderDay(id); return;
      case "edit": editDays.add(id); renderDay(id); focusIn(id,"#e-title-"+id); return;
      case "done": editDays.delete(id); renderDay(id); toast("Dia atualizado"); return;
      case "up": if(i>0) [d.items[i-1],d.items[i]]=[d.items[i],d.items[i-1]]; break;
      case "down": if(i<d.items.length-1) [d.items[i+1],d.items[i]]=[d.items[i],d.items[i+1]]; break;
      case "del": d.items.splice(i,1); break;
      case "sort": d.items=sortByTime(d.items); toast("Atividades ordenadas por horário"); break;
      case "add-item": d.items.push(normItem(["",""])); save(id); renderDay(id); focusIn(id,`[data-f="ih"][data-i="${d.items.length-1}"]`); return;
      case "del-flag": d.flags.splice(i,1); break;
      case "add-flag": d.flags.push(["info",""]); save(id); renderDay(id); focusIn(id,`[data-f="ft"][data-i="${d.flags.length-1}"]`); return;
      case "reset": {
        if(!confirm("Voltar este dia ao roteiro original? As mudanças feitas nele serão perdidas.")) return;
        const orig=normDay(clone(DEFAULT_DAYS.find(x=>x.id===id))); Object.keys(d).forEach(k=>delete d[k]); Object.assign(d,orig);
        editDays.delete(id); toast("Dia restaurado"); break;
      }
      default: return;
    }
    save(id); renderDay(id);
  });
  line.addEventListener("change",e=>{
    const el=e.target, f=el.dataset.f; if(!f) return;
    const d=dayById(el.dataset.day), i=+el.dataset.i, v=el.value.trim();
    if(f==="title") d.title=v||"Sem título";
    else if(f==="base") d.base=v;
    else if(f==="cost") d.cost=v;
    else if(f==="phase"){ d.phase=el.value; save(d.id); renderDay(d.id); return }
    else if(f==="ih") d.items[i].h=v;
    else if(f==="it") d.items[i].t=v;
    else if(f==="fk") d.flags[i][0]=el.value;
    else if(f==="ft") d.flags[i][1]=v;
    save(d.id);
    if(f==="title"||f==="base"){ const el2=$("day-"+d.id); el2.querySelector(".dtitle").textContent=d.title; el2.querySelector(".meta span").textContent=d.base; renderStrip() }
  });
  line.addEventListener("submit",e=>{
    e.preventDefault();
    const f=e.target;
    if(f.matches("[data-item-form]")){
      const d=dayById(f.dataset.day), it=itemById(d,f.dataset.item); if(!it) return;
      const oldH=it.h;
      it.h=f.h.value.trim(); it.t=f.t.value.trim()||it.t; it.p=f.p.value.trim(); it.how=f.how.value.trim(); it.obs=f.obs.value.trim(); it.done=f.done.value==="1";
      it.links=[...f.querySelectorAll(".lrow")].map(r=>{const u=safeUrl(r.querySelector('[name="lu"]').value);return u?{l:r.querySelector('[name="ll"]').value.trim()||hostOf(u),u}:null}).filter(Boolean);
      if(it.h!==oldH&&mins(it.h)!=null){ d.items=d.items.filter(x=>x!==it); insertByTime(d.items,it) }
      editItem=null; save(d.id); renderDay(d.id); toast("Atividade salva");
    } else if(f.matches("form[data-quick]")){
      const id=f.dataset.quick, h=f.h.value.trim(), t=f.t.value.trim(); if(!t) return;
      const d=dayById(id), it=normItem([h,t]);
      insertByTime(d.items,it); openOnly(d,it.id); editItem=null; save(id); renderDay(id);
      focusIn(id,'form[data-quick] input[name="h"]'); toast("Adicionada. Toque nela para pôr local, rota e links");
    }
  });
  line.addEventListener("focusout",e=>{
    const t=e.target; if(!t.matches("textarea.note")) return;
    if((state.notes[t.dataset.day]||"")===t.value) return;
    state.notes[t.dataset.day]=t.value; S.commitNote(t.dataset.day);
  });
  $("strip").addEventListener("click",e=>{
    const b=e.target.closest("[data-go]"); if(!b) return;
    const id=b.dataset.go; openDays.add(id); renderDay(id);
    $("day-"+id).scrollIntoView({behavior:"smooth",block:"start"});
  });
  setInterval(()=>{ if(tripDayToday()) renderDays() },60000);
}
function focusIn(id,sel){ const el=$("day-"+id)?.querySelector(sel); if(el) el.focus() }

/* ======================================================================
   IDEIAS (lista de desejos)
   ====================================================================== */
let editWish=null, scheduleWish=null;
function wishForm(w){
  const k=w?w.id:"new";
  return `<form class="iform" data-wish-form="${k}">
    <div class="fgrid">
      <div class="fl wide"><label for="w-t-${k}">O quê</label><input id="w-t-${k}" name="t" value="${esc(w?w.t:"")}" placeholder="ex.: Café de Flore, Shakespeare and Company" required></div>
      <div class="fl"><label for="w-k-${k}">Tipo</label><select id="w-k-${k}" name="kind">${Object.entries(WISH_KINDS).map(([v,l])=>opt(v,l,w&&w.kind===v)).join("")}</select></div>
      <div class="fl"><label for="w-l-${k}">Link</label><input id="w-l-${k}" name="link" value="${esc(w?w.link:"")}" placeholder="https://…" inputmode="url" autocapitalize="off"></div>
      <div class="fl wide"><label for="w-p-${k}">Local para o mapa</label><input id="w-p-${k}" name="p" value="${esc(w?w.p:"")}" placeholder="Nome do lugar ou endereço"></div>
      <div class="fl wide"><label for="w-o-${k}">Observações</label><textarea id="w-o-${k}" name="obs" rows="2" placeholder="Quem indicou, o que pedir, horário…">${esc(w?w.obs:"")}</textarea></div>
    </div>
    <div class="day-actions"><button type="submit" class="btn primary">${I.check}${w?"Salvar":"Adicionar à lista"}</button>${w?`<button type="button" class="btn" data-wact="cancel">Cancelar</button>`:""}</div>
  </form>`;
}
function renderWishes(force){
  guarded("wishes",()=>{
    const list=state.wishes;
    $("wishes").innerHTML=`<div class="card">${wishForm(null)}</div>`+
      (list.length?list.map(w=>editWish===w.id?`<div class="card">${wishForm(w)}</div>`:`<div class="card wish">
        <div class="kind">${esc(WISH_KINDS[w.kind]||"Outro")}</div><h3>${esc(w.t)}</h3>
        ${w.obs?`<p>${rich(w.obs)}</p>`:""}
        ${w.p?`<p class="muted">${I.pin} ${esc(w.p)}</p>${placeButtons(w.p,null,false)}`:""}
        ${w.link?`<div class="btns"><a class="btn sm" target="_blank" rel="noopener" href="${esc(w.link)}">${I.ext}${esc(hostOf(w.link))}</a></div>`:""}
        ${scheduleWish===w.id?`<form class="sched" data-sched="${w.id}">
            <select name="day" aria-label="Dia">${S.getDays().map(d=>opt(d.id,dayLabel(d),tripDayToday()===d)).join("")}</select>
            <input name="h" placeholder="Hora" aria-label="Horário">
            <button type="submit" class="btn sm primary">${I.check}Pôr no roteiro</button>
            <button type="button" class="btn sm" data-wact="unsched">Cancelar</button>
          </form>`:""}
        <div class="btns">
          ${scheduleWish===w.id?"":`<button type="button" class="btn sm primary" data-wact="sched" data-id="${w.id}">${I.cal}Pôr no roteiro</button>`}
          <button type="button" class="btn sm" data-wact="edit" data-id="${w.id}">${I.edit}Editar</button>
          <button type="button" class="btn sm ghost danger" data-wact="del" data-id="${w.id}">${I.del}Excluir</button>
        </div></div>`).join(""):`<p class="empty">Nada na lista ainda. Anotem aqui lugares indicados e coloquem no roteiro quando sobrar tempo.</p>`);
  },force);
}
function setupWishes(){
  const el=$("wishes");
  el.addEventListener("submit",e=>{
    e.preventDefault(); const f=e.target;
    if(f.dataset.wishForm){
      const k=f.dataset.wishForm, data={t:f.t.value.trim(),kind:f.kind.value,link:safeUrl(f.link.value),p:f.p.value.trim(),obs:f.obs.value.trim()};
      if(!data.t) return;
      if(k==="new"){ state.wishes.unshift({id:uid(),...data,criadoEm:Date.now()}); toast("Ideia adicionada") }
      else { Object.assign(state.wishes.find(w=>w.id===k),data); editWish=null; toast("Ideia salva") }
      S.commitDoc("wishes"); renderWishes();
    } else if(f.dataset.sched){
      const w=state.wishes.find(x=>x.id===f.dataset.sched), d=dayById(f.day.value);
      const it=normItem({h:f.h.value.trim(),t:w.t,p:w.p,obs:w.obs,links:w.link?[{l:hostOf(w.link),u:w.link}]:[]});
      insertByTime(d.items,it); S.commitDay(d.id);
      state.wishes=state.wishes.filter(x=>x!==w); scheduleWish=null; S.commitDoc("wishes");
      renderWishes(); renderDays(true); toast(`Colocado em ${dayLabel(d)}`);
    }
  });
  el.addEventListener("click",e=>{
    const b=e.target.closest("[data-wact]"); if(!b) return;
    const a=b.dataset.wact, id=b.dataset.id;
    if(a==="edit"){editWish=id;scheduleWish=null}
    else if(a==="cancel") editWish=null;
    else if(a==="sched"){scheduleWish=id;editWish=null}
    else if(a==="unsched") scheduleWish=null;
    else if(a==="del"){ const w=state.wishes.find(x=>x.id===id); if(!confirm(`Excluir “${w.t}”?`)) return; state.wishes=state.wishes.filter(x=>x!==w); S.commitDoc("wishes") }
    renderWishes(true);
  });
}

/* ======================================================================
   RESERVAS
   ====================================================================== */
let editBooking=null;
function bookingForm(b){
  const k=b?b.id:"new", v=f=>esc(b?b[f]||"":"");
  return `<form class="iform" data-booking-form="${k}">
    <div class="fgrid">
      <div class="fl"><label for="bk-${k}">Tipo</label><select id="bk-${k}" name="kind">${BOOKING_KINDS.map(x=>opt(x,x,b&&b.kind===x)).join("")}</select></div>
      <div class="fl"><label for="bt-${k}">Nome</label><input id="bt-${k}" name="title" value="${v("title")}" placeholder="ex.: Jantar no Le Train Bleu" required></div>
      <div class="fl wide"><label for="bw-${k}">Data e horário</label><input id="bw-${k}" name="when" value="${v("when")}" placeholder="ex.: 26 out, 20h"></div>
      <div class="fl"><label for="bf-${k}">Saída (voo/trem)</label><input id="bf-${k}" name="from" value="${v("from")}" placeholder="GRU"></div>
      <div class="fl"><label for="bfw-${k}">Quando sai</label><input id="bfw-${k}" name="fromWhen" value="${v("fromWhen")}" placeholder="19 out, 18h00"></div>
      <div class="fl"><label for="bto-${k}">Chegada</label><input id="bto-${k}" name="to" value="${v("to")}" placeholder="CDG"></div>
      <div class="fl"><label for="btw-${k}">Quando chega</label><input id="btw-${k}" name="toWhen" value="${v("toWhen")}" placeholder="20 out, 10h15"></div>
      <div class="fl"><label for="bc-${k}">Código / localizador</label><input id="bc-${k}" name="code" value="${v("code")}" autocapitalize="characters"></div>
      <div class="fl"><label for="bv-${k}">Valor</label><input id="bv-${k}" name="value" value="${v("value")}" placeholder="R$ 0,00"></div>
      <div class="fl wide"><label for="bp-${k}">Local para o mapa</label><input id="bp-${k}" name="place" value="${v("place")}" placeholder="Nome do lugar ou endereço"></div>
      <div class="fl wide"><label for="bl-${k}">Link</label><input id="bl-${k}" name="link" value="${v("link")}" placeholder="https://…" inputmode="url" autocapitalize="off"></div>
      <div class="fl wide"><label for="bn-${k}">Observações</label><textarea id="bn-${k}" name="notes" rows="2">${v("notes")}</textarea></div>
    </div>
    <div class="day-actions"><button type="submit" class="btn primary">${I.check}Salvar</button><button type="button" class="btn" data-bact="cancel">Cancelar</button>
      ${b?`<button type="button" class="btn ghost danger" data-bact="del" data-id="${b.id}">${I.del}Excluir</button>`:""}</div>
  </form>`;
}
function renderBookings(force){
  guarded("bookings",()=>{
    const list=S.getBookings();
    $("bookings").innerHTML=(editBooking==="new"?`<div class="card">${bookingForm(null)}</div>`:`<button type="button" class="btn primary add-top" data-bact="new">${I.plus}Adicionar reserva</button>`)+
      list.map(b=>editBooking===b.id?`<div class="card">${bookingForm(b)}</div>`:`<div class="card booking">
        <div class="kind">${esc(b.kind)}</div><h3>${esc(b.title)}</h3>
        ${b.from&&b.to?`<div class="route"><span>${esc(b.from)}<small>${esc(b.fromWhen)}</small></span><span class="arrow" aria-hidden="true"></span><span>${esc(b.to)}<small>${esc(b.toWhen)}</small></span></div>`:""}
        <dl>${[["Quando",b.when],["Código",b.code],["Valor",b.value]].filter(r=>r[1]).map(r=>`<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>
        ${b.notes?`<p>${rich(b.notes)}</p>`:""}
        ${b.place?placeButtons(b.place,null,false):""}
        ${b.link?`<div class="btns"><a class="btn sm" target="_blank" rel="noopener" href="${esc(b.link)}">${I.ext}${esc(hostOf(b.link))}</a></div>`:""}
        ${filesBlock("bk:"+b.id)}
        <div class="btns"><button type="button" class="btn sm" data-bact="edit" data-id="${b.id}">${I.edit}Editar</button></div>
      </div>`).join("");
  },force);
}
function setupBookings(){
  const el=$("bookings");
  el.addEventListener("click",e=>{
    const b=e.target.closest("[data-bact]"); if(!b) return;
    const a=b.dataset.bact;
    if(a==="new") editBooking="new";
    else if(a==="edit") editBooking=b.dataset.id;
    else if(a==="cancel") editBooking=null;
    else if(a==="del"){ const x=S.getBookings().find(y=>y.id===b.dataset.id); if(!confirm(`Excluir a reserva “${x.title}”?`)) return;
      state.bookings=S.getBookings().filter(y=>y!==x); editBooking=null; S.commitDoc("bookings"); toast("Reserva excluída") }
    renderBookings(true);
    if(a==="new") el.querySelector('[name="title"]')?.focus();
  });
  el.addEventListener("submit",e=>{
    e.preventDefault(); const f=e.target, k=f.dataset.bookingForm; if(!k) return;
    const data={}; for(const n of ["kind","title","when","from","fromWhen","to","toWhen","code","value","place","notes"]) data[n]=f[n].value.trim();
    data.link=safeUrl(f.link.value);
    if(k==="new") S.getBookings().push({id:uid(),...data}); else Object.assign(S.getBookings().find(x=>x.id===k),data);
    editBooking=null; S.commitDoc("bookings"); renderBookings(true); toast("Reserva salva");
  });
}

/* ======================================================================
   A FAZER (checklist editável)
   ====================================================================== */
let editChecklist=false;
function renderChecklist(force){
  guarded("checklist",()=>{
    const groups=S.getChecklist(), all=groups.flatMap(g=>g.items), done=all.filter(i=>state.checks[i.id]).length;
    $("prog-bar").style.width=(all.length?done/all.length*100:0)+"%";
    $("prog-text").textContent=`${done} de ${all.length} feitos`;
    $("cl-edit").textContent=editChecklist?"Concluir edição":"Editar lista";
    $("cl-edit").classList.toggle("primary",editChecklist);
    $("checklist").innerHTML=groups.map(g=>`
     <div class="card group" data-group="${g.id}">
      ${editChecklist?`<div class="grow"><input data-cf="gname" data-g="${g.id}" value="${esc(g.name)}" aria-label="Nome do grupo"><button type="button" class="ib del" data-cact="del-group" data-g="${g.id}" aria-label="Excluir grupo">${I.del}</button></div>`:`<h3>${esc(g.name)}</h3>`}
      ${g.items.map(i=>editChecklist
        ?`<div class="crow"><input data-cf="item" data-g="${g.id}" data-id="${i.id}" value="${esc(i.t)}" aria-label="Item"><button type="button" class="ib del" data-cact="del-item" data-g="${g.id}" data-id="${i.id}" aria-label="Excluir item">${I.del}</button></div>`
        :`<label class="check${state.checks[i.id]?" done":""}"><input type="checkbox" data-check="${i.id}"${state.checks[i.id]?" checked":""}><span>${esc(i.t)}</span></label>`).join("")}
      <form class="quick slim" data-cadd="${g.id}"><input name="t" placeholder="Acrescentar item…" aria-label="Novo item em ${esc(g.name)}" required><button type="submit" aria-label="Adicionar item">${I.plus}</button></form>
     </div>`).join("")+(editChecklist?`<form class="quick" data-cgroup><input name="t" placeholder="Novo grupo (ex.: Na mala)" aria-label="Novo grupo" required><button type="submit">${I.plus}<span>Grupo</span></button></form>`:"");
  },force);
}
function setupChecklist(){
  const el=$("checklist"), commit=()=>S.commitDoc("checklist"), groupOf=id=>S.getChecklist().find(g=>g.id===id);
  $("cl-edit").addEventListener("click",()=>{editChecklist=!editChecklist;renderChecklist(true)});
  el.addEventListener("change",e=>{
    const t=e.target;
    if(t.dataset.check){ state.checks[t.dataset.check]=t.checked; S.commitCheck(t.dataset.check); renderChecklist(true); return }
    if(t.dataset.cf==="gname"){ groupOf(t.dataset.g).name=t.value.trim()||"Sem nome"; commit() }
    if(t.dataset.cf==="item"){ const it=groupOf(t.dataset.g).items.find(i=>i.id===t.dataset.id); it.t=t.value.trim()||it.t; commit() }
  });
  el.addEventListener("click",e=>{
    const b=e.target.closest("[data-cact]"); if(!b) return;
    const g=groupOf(b.dataset.g);
    if(b.dataset.cact==="del-item"){ g.items=g.items.filter(i=>i.id!==b.dataset.id); delete state.checks[b.dataset.id] }
    else { if(!confirm(`Excluir o grupo “${g.name}” e seus itens?`)) return; state.checklist=S.getChecklist().filter(x=>x!==g) }
    commit(); renderChecklist(true);
  });
  el.addEventListener("submit",e=>{
    e.preventDefault(); const f=e.target, t=f.t.value.trim(); if(!t) return;
    if(f.dataset.cadd){ groupOf(f.dataset.cadd).items.push({id:uid(),t}); toast("Item adicionado") }
    else if(f.matches("[data-cgroup]")) S.getChecklist().push({id:uid(),name:t,items:[]});
    commit(); renderChecklist(true);
    el.querySelector(`form[data-cadd="${f.dataset.cadd}"] input`)?.focus();
  });
}

/* ======================================================================
   ORÇAMENTO
   ====================================================================== */
let editBudget=false;
const toBRL = (e,r) => e.moeda==="BRL"?+e.valor:+e.valor*r;
function renderBudget(force){
  guarded("orcamento",()=>{
    const B=S.getBudget(), r=B.rate;
    if(document.activeElement!==$("rate")) $("rate").value=r;
    const paid=B.paid.reduce((s,p)=>s+(+p.value||0),0);
    const planE=B.plan.reduce((s,p)=>s+(+p.eur||0),0), planB=planE*r;
    const byCat=sumBy(state.expenses,"cat",r), byDay=sumBy(state.expenses,"day",r);
    const spentB=Object.values(byCat).reduce((a,b)=>a+b,0), total=paid+planB;
    $("totals").innerHTML=`
      <div class="tot"><span>Teto</span><strong>${brl(B.ceiling)}</strong></div>
      <div class="tot"><span>Já pago</span><strong>${brl(paid)}</strong></div>
      <div class="tot"><span>Previsto em solo</span><strong>${brl(planB)}</strong></div>
      <div class="tot"><span>Gasto na viagem</span><strong>${brl(spentB)}</strong></div>`;
    const max=Math.max(total,B.ceiling,paid+spentB)||1;
    $("stack").innerHTML=`<b style="width:${paid/max*100}%;background:var(--ink)"></b><b style="width:${planB/max*100}%;background:var(--seine)"></b>${B.ceiling?`<i style="left:${Math.min(100,B.ceiling/max*100)}%" title="Teto"></i>`:""}`;
    $("stack-legend").innerHTML=`<span><i style="background:var(--ink)"></i>Pago</span><span><i style="background:var(--seine)"></i>Previsto em solo</span><span><i class="tick-legend"></i>Teto</span><span>Total previsto: ${brl(total)}</span>`;
    $("budget-warn").innerHTML=B.ceiling&&total>B.ceiling?`<p class="warn">O total previsto passa o teto em ${brl(total-B.ceiling)}. Revejam o previsto em solo (por exemplo, Disney em 1 dia ou menos refeições fora) ou ajustem o teto.</p>`:"";

    const today=tripDayToday();
    $("g-cat").innerHTML=B.plan.map(p=>opt(p.id,p.name)).join("")+opt("","Outros");
    if(!typing($("add-form"))) $("g-day").innerHTML=opt("","Sem dia")+S.getDays().map(d=>opt(d.id,dayLabel(d),today===d)).join("");

    const catName=id=>(B.plan.find(p=>p.id===id)||{name:"Outros"}).name;
    const dayName=id=>{const d=dayById(id);if(!d)return "";const p=dateParts(d.date);return `${p.wd} ${p.dd}`};
    const list=[...state.expenses].sort((a,b)=>(b.criadoEm||0)-(a.criadoEm||0));
    $("spent").innerHTML=list.length
      ? `<thead><tr><th>Gasto</th><th class="num">Valor</th><th class="num">Em R$</th><th><span class="sr">Apagar</span></th></tr></thead>
         <tbody>${list.map(e=>`<tr><td>${esc(e.desc)}<br><small class="muted">${esc(catName(e.cat))}${e.day?` · ${esc(dayName(e.day))}`:""}</small></td><td class="num">${e.moeda==="BRL"?brl(e.valor):eur(e.valor)}</td><td class="num">${brl(toBRL(e,r))}</td><td><button class="x" data-del="${esc(e.id)}" aria-label="Apagar ${esc(e.desc)}">×</button></td></tr>`).join("")}</tbody>`
      : `<tbody><tr><td class="empty">Nenhum gasto ainda. Registrem cada gasto durante a viagem para comparar com o previsto.</td></tr></tbody>`;

    const dayRows=S.getDays().filter(d=>byDay[d.id]), maxDay=Math.max(...dayRows.map(d=>byDay[d.id]),1);
    $("by-day").innerHTML=dayRows.length?dayRows.map(d=>`<div class="bar-row"><span>${esc(dayName(d.id))}</span><div class="bar"><b style="width:${byDay[d.id]/maxDay*100}%"></b></div><strong>${brl(byDay[d.id])}</strong></div>`).join("")
      +(byDay[""]?`<p class="hint" style="margin-top:8px">Sem dia: ${brl(byDay[""])}</p>`:""):`<p class="empty">Escolham o dia ao registrar um gasto para ver aqui quanto foi gasto em cada dia.</p>`;

    $("plan").innerHTML=editBudget?budgetEditor(B):`
      <thead><tr><th>Item</th><th class="num">Previsto</th><th class="num">Gasto</th></tr></thead>
      <tbody>${B.plan.map(p=>`<tr><td>${esc(p.name)}<br><small class="muted">${esc(p.note)}</small></td><td class="num">${eur(p.eur)}<br><small class="muted">${brl(p.eur*r)}</small></td><td class="num${byCat[p.id]>p.eur*r?" over":""}">${byCat[p.id]?brl(byCat[p.id]):"—"}</td></tr>`).join("")}
      ${byCat[""]?`<tr><td>Outros</td><td class="num">—</td><td class="num">${brl(byCat[""])}</td></tr>`:""}</tbody>
      <tfoot><tr><td>Total</td><td class="num">${eur(planE)}<br><small class="muted">${brl(planB)}</small></td><td class="num">${brl(spentB)}</td></tr></tfoot>`;
    $("budget-edit").textContent=editBudget?"Concluir":"Editar orçamento";
    $("budget-edit").classList.toggle("primary",editBudget);
    renderConv();
  },force);
}
function budgetEditor(B){
  return `<tbody><tr><td colspan="3" class="beditor">
    <div class="fgrid">
      <div class="fl"><label for="b-ceil">Teto da viagem (R$)</label><input id="b-ceil" data-bf="ceiling" inputmode="decimal" value="${B.ceiling}"></div>
    </div>
    <h4>Já pago (R$)</h4>
    ${B.paid.map(p=>`<div class="erow"><input data-bf="paid-name" data-id="${p.id}" value="${esc(p.name)}" aria-label="Item pago"><input data-bf="paid-value" data-id="${p.id}" value="${p.value}" inputmode="decimal" aria-label="Valor em reais"><button type="button" class="ib del" data-bdel="paid" data-id="${p.id}" aria-label="Remover">${I.del}</button></div>`).join("")}
    <button type="button" class="btn sm add-line" data-badd="paid">${I.plus}Adicionar pagamento</button>
    <h4>Previsto em solo (€)</h4>
    ${B.plan.map(p=>`<div class="erow three"><input data-bf="plan-name" data-id="${p.id}" value="${esc(p.name)}" aria-label="Categoria"><input data-bf="plan-eur" data-id="${p.id}" value="${p.eur}" inputmode="decimal" aria-label="Previsto em euros"><button type="button" class="ib del" data-bdel="plan" data-id="${p.id}" aria-label="Remover">${I.del}</button><input class="note-in" data-bf="plan-note" data-id="${p.id}" value="${esc(p.note)}" placeholder="Observação" aria-label="Observação"></div>`).join("")}
    <button type="button" class="btn sm add-line" data-badd="plan">${I.plus}Adicionar categoria</button>
  </td></tr></tbody>`;
}
function setupBudget(){
  const B=()=>S.getBudget(), commit=()=>{S.commitDoc("budget");renderBudget(true)};
  $("budget-edit").addEventListener("click",()=>{editBudget=!editBudget;renderBudget(true)});
  $("plan").addEventListener("change",e=>{
    const t=e.target, f=t.dataset.bf; if(!f) return;
    const b=B(), find=(arr)=>arr.find(x=>x.id===t.dataset.id);
    if(f==="ceiling") b.ceiling=parseMoney(t.value);
    else if(f==="paid-name") find(b.paid).name=t.value.trim();
    else if(f==="paid-value") find(b.paid).value=parseMoney(t.value);
    else if(f==="plan-name") find(b.plan).name=t.value.trim();
    else if(f==="plan-eur") find(b.plan).eur=parseMoney(t.value);
    else if(f==="plan-note") find(b.plan).note=t.value.trim();
    S.commitDoc("budget"); renderBudget();
  });
  $("plan").addEventListener("click",e=>{
    const a=e.target.closest("[data-badd],[data-bdel]"); if(!a) return;
    const b=B();
    if(a.dataset.badd==="paid") b.paid.push({id:uid(),name:"",value:0});
    else if(a.dataset.badd==="plan") b.plan.push({id:uid(),name:"",note:"",eur:0});
    else { const k=a.dataset.bdel; b[k]=b[k].filter(x=>x.id!==a.dataset.id) }
    commit();
  });
  $("add-form").addEventListener("submit",ev=>{
    ev.preventDefault();
    const desc=$("g-desc").value.trim(), valor=parseMoney($("g-val").value);
    if(!desc||!(valor>=0)) return;
    S.addExpense({desc,valor,moeda:$("g-cur").value,cat:$("g-cat").value,day:$("g-day").value,criadoEm:Date.now()});
    $("g-desc").value=""; $("g-val").value=""; $("g-desc").blur(); $("g-val").blur();
    toast("Gasto registrado");
  });
  $("spent").addEventListener("click",e=>{const b=e.target.closest("[data-del]"); if(b&&confirm("Apagar este gasto?")) S.removeExpense(b.dataset.del)});
  let t; $("rate").addEventListener("input",()=>{
    const v=parseMoney($("rate").value); if(!(v>0)) return;
    clearTimeout(t); t=setTimeout(()=>{ if(v===B().rate) return; B().rate=v; S.commitDoc("budget"); renderBudget(true) },600);
  });
  $("conv-in").addEventListener("input",renderConv);
}
function renderConv(){
  const r=S.getBudget().rate, v=parseMoney($("conv-in").value);
  $("conv-out").textContent=`${brl(v*r)} (a R$ ${r.toLocaleString("pt-BR")})`;
}

/* ======================================================================
   GUIA: emergência, frases, sincronização e backup
   ====================================================================== */
function renderGuideStatic(){
  $("emergency").innerHTML=`<div class="btns">${EMERGENCY.map(e=>`<a class="btn${e[0]==="112"?" primary":""}" href="tel:${e[0]}">${I.phone}<b>${e[0]}</b> ${esc(e[1])}</a>`).join("")}</div>
    <p class="hint">${esc(EMERGENCY[0][2])}</p>
    <div class="btns">
      <a class="btn sm" target="_blank" rel="noopener" href="${gmap("Ambassade du Brésil, Paris")}">${I.pin}Embaixada do Brasil</a>
      <a class="btn sm" target="_blank" rel="noopener" href="${gmap("Consulat général du Brésil à Paris")}">${I.pin}Consulado-Geral do Brasil</a>
      <a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/pharmacie">${I.pin}Farmácias perto de mim</a>
    </div>
    <p class="hint">Antes de viajar, salvem no celular o telefone de plantão do consulado (está no site do Itamaraty) e o número do seguro viagem. Farmácias têm uma cruz verde na fachada.</p>`;
  $("phrases").innerHTML=`<table><thead><tr><th>Português</th><th>Francês</th><th>Como falar</th></tr></thead><tbody>${PHRASES.map(p=>`<tr><td>${esc(p[0])}</td><td lang="fr"><b>${esc(p[1])}</b></td><td class="muted">${esc(p[2])}</td></tr>`).join("")}</tbody></table>`;
}
function inviteLink(){ return location.href.split("#")[0]+"#convite="+encodeInvite({cfg:S.sync.cfg,code:S.sync.code}) }
function renderSync(force){
  guarded("sync-card",()=>{
    const s=S.sync, el=$("sync-body");
    if(s.mode==="firebase"){
      el.innerHTML=`<p class="sync-state ${s.status}">${I.cloudsync}<span>${{connecting:"Conectando…",online:"Sincronizado. Tudo que um de vocês muda aparece no celular do outro.",offline:"Sem internet. As mudanças ficam salvas e são enviadas quando a conexão voltar.",error:esc(s.message)}[s.status]||""}</span></p>
        <p>Para o outro celular entrar na mesma viagem, mande este convite e abra o link nele:</p>
        <div class="btns">
          <button type="button" class="btn primary" data-sact="share">${I.link}Compartilhar convite</button>
          <button type="button" class="btn" data-sact="copy">Copiar link</button>
        </div>
        <p class="hint">O convite dá acesso à viagem: mande só para a Marcela.</p>
        <details class="more"><summary>Opções</summary>
          <p class="hint">Projeto: ${esc(s.cfg.projectId)} · código da viagem: ${esc(s.code.slice(0,4))}…</p>
          <button type="button" class="btn ghost danger" data-sact="off">Desligar a sincronização neste celular</button>
        </details>`;
    } else {
      el.innerHTML=`<p>Hoje cada celular guarda os próprios dados. Com a sincronização, roteiro, anotações, checklist, reservas, gastos e anexos pequenos ficam iguais nos dois celulares, e continuam funcionando sem internet.</p>
        <p><b>Já recebeu um convite?</b> Basta abrir o link do convite neste celular.</p>
        <details class="more"${s.status==="error"?" open":""}><summary>Configurar pela primeira vez</summary>
          <ol class="steps">
            <li>Crie um projeto gratuito no Firebase e um banco Firestore. O passo a passo está no <a href="${REPO_GUIDE}" target="_blank" rel="noopener">guia de sincronização</a> (uns 10 minutos).</li>
            <li>Cole aqui a configuração do app da Web (o trecho <code>const firebaseConfig = {…}</code>):</li>
          </ol>
          <textarea id="fb-config" rows="6" placeholder="const firebaseConfig = {&#10;  apiKey: &quot;…&quot;,&#10;  authDomain: &quot;…&quot;,&#10;  projectId: &quot;…&quot;,&#10;  …&#10;};"></textarea>
          ${s.status==="error"?`<p class="warn">${esc(s.message)}</p>`:""}
          <div class="btns"><button type="button" class="btn primary" data-sact="create">${I.cloudsync}Criar viagem compartilhada</button></div>
          <p class="hint">Os dados deste celular serão enviados para a nuvem e viram a base da viagem.</p>
        </details>`;
    }
  },force);
}
function setupSync(){
  $("sync-body").addEventListener("click",async e=>{
    const b=e.target.closest("[data-sact]"); if(!b) return;
    const a=b.dataset.sact;
    if(a==="create"){
      const cfg=parseFirebaseConfig($("fb-config").value);
      if(!cfg){ toast("Não reconheci a configuração. Cole o trecho inteiro com apiKey e projectId."); return }
      toast("Conectando…"); await S.enableSync(cfg,newTripCode());
      if(S.sync.status!=="error") toast("Viagem criada. Agora compartilhe o convite");
    } else if(a==="share"){
      const url=inviteLink();
      if(navigator.share){ try{ await navigator.share({title:"Lua de mel em Paris",text:"Abra para sincronizar o roteiro da viagem:",url}) }catch(err){} }
      else { await copy(url) }
    } else if(a==="copy") await copy(inviteLink());
    else if(a==="off"){ if(!confirm("Desligar a sincronização neste celular? Os dados ficam salvos aqui, mas deixam de ser atualizados.")) return; S.disableSync(); toast("Sincronização desligada") }
  });
}
async function copy(t){ try{ await navigator.clipboard.writeText(t); toast("Link copiado") }catch(e){ prompt("Copie o link:",t) } }
async function handleInvite(){
  const m=location.hash.match(/^#convite=(.+)$/); if(!m) return false;
  history.replaceState(null,"",location.pathname+location.search);
  const inv=decodeInvite(m[1]);
  if(!inv){ toast("Convite inválido"); return false }
  const cur=S.getSyncConfig();
  if(cur&&cur.code===inv.code) return false;
  if(!confirm("Entrar na viagem compartilhada? O roteiro, as anotações, o checklist, as reservas e os gastos deste celular serão substituídos pelos da viagem.")) return false;
  await S.enableSync(inv.cfg,inv.code);
  toast(S.sync.status==="error"?"Não foi possível entrar na viagem":"Pronto! Este celular está sincronizado");
  return true;
}
function setupBackup(){
  $("export-btn").addEventListener("click",async()=>{
    const data=await S.exportData(), a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"}));
    a.download=`lua-de-mel-backup-${isoToday()}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  });
  $("import-file").addEventListener("change",e=>{
    const f=e.target.files[0]; e.target.value=""; if(!f) return;
    const r=new FileReader();
    r.onload=async()=>{
      try{
        const j=JSON.parse(r.result);
        if(!confirm("Substituir os dados deste celular pelos do backup?")) return;
        await S.importData(j); toast("Backup importado");
      }catch(err){ toast("Esse arquivo não é um backup deste app") }
    };
    r.readAsText(f);
  });
}

/* ======================================================================
   ABAS E INÍCIO
   ====================================================================== */
function setupTabs(){
  const tabs=[...document.querySelectorAll('[role="tab"]')];
  const select=t=>{
    tabs.forEach(x=>{x.setAttribute("aria-selected",String(x===t));x.tabIndex=x===t?0:-1});
    document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===t.getAttribute("aria-controls")));
    const top=$("main").getBoundingClientRect().top+scrollY-70; if(scrollY>top) scrollTo({top:Math.max(0,top)});
  };
  tabs.forEach((t,i)=>{
    t.addEventListener("click",()=>select(t));
    t.addEventListener("keydown",e=>{ if(e.key==="ArrowRight"||e.key==="ArrowLeft"){const n=tabs[(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length];n.focus();select(n)} });
  });
  $("sync-badge").addEventListener("click",()=>{ select($("t-guia")); $("sync-card").scrollIntoView({behavior:"smooth"}) });
  tabs.forEach(x=>x.tabIndex=x.getAttribute("aria-selected")==="true"?0:-1);
}
function renderAll(){ renderDays(true); renderWishes(); renderBookings(); renderChecklist(); renderBudget(); renderSync(); renderSyncBadge(); updateStats() }

S.onChange(key=>{
  switch(key){
    case "days": case "notes": renderDays(); break;
    case "checks": case "checklist": renderChecklist(); break;
    case "bookings": renderBookings(); break;
    case "budget": case "expenses": renderBudget(); renderDays(); break;
    case "wishes": renderWishes(); break;
    case "files": renderDays(); renderBookings(); break;
    case "sync": renderSync(); renderSyncBadge(); break;
    case "all": renderAll(); return;
  }
  updateStats();
});

async function start(){
  document.documentElement.classList.remove("no-js");
  S.loadLocal();
  const t=isoToday(), today=DEFAULT_DAYS.find(x=>x.date===t); if(today) openDays.add(today.id);
  renderCountdown(); renderGuideStatic();
  setupTabs(); setupDays(); setupWishes(); setupBookings(); setupChecklist(); setupBudget(); setupSync(); setupBackup();
  renderAll();
  S.loadFiles();
  if(!(await handleInvite())) S.connect();
  addEventListener("hashchange",()=>handleInvite());
  W.refresh(S.getDays()).then(ok=>ok&&renderDays()).catch(()=>{});
  if("serviceWorker" in navigator&&location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
}
start();
