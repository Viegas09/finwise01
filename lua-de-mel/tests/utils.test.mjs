// Rodar com: node --test lua-de-mel/tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as U from "../js/utils.js";
import {DEFAULT_DAYS, DEFAULT_CHECKLIST, DEFAULT_BUDGET} from "../js/data.js";

test("mins entende os formatos de horário", () => {
  assert.equal(U.mins("9h"), 540);
  assert.equal(U.mins("14h30"), 870);
  assert.equal(U.mins("14:30"), 870);
  assert.equal(U.mins(" 7 "), 420);
  assert.equal(U.mins("Manhã"), 540);
  assert.equal(U.mins("tarde"), 840);
  assert.equal(U.mins("Noite"), 1200);
  assert.equal(U.mins(""), null);
  assert.equal(U.mins("25h"), null);
  assert.equal(U.mins("depois"), null);
});

test("insertByTime coloca a atividade na posição do horário", () => {
  const items = [{h:"9h"},{h:"12h"},{h:""},{h:"Noite"}];
  U.insertByTime(items, {h:"10h30", t:"novo"});
  assert.deepEqual(items.map(i => i.h), ["9h","10h30","12h","","Noite"]);
  U.insertByTime(items, {h:"", t:"sem hora"});
  assert.equal(items.at(-1).t, "sem hora");
});

test("sortByTime é estável e mantém itens sem horário junto do anterior", () => {
  const out = U.sortByTime([{h:"22h"},{h:"9h"},{h:""},{h:"Tarde"}]);
  assert.deepEqual(out.map(i => i.h), ["9h","","Tarde","22h"]);
});

test("safeUrl completa https e recusa esquemas perigosos", () => {
  assert.equal(U.safeUrl("louvre.fr"), "https://louvre.fr/");
  assert.equal(U.safeUrl("http://a.com/x"), "http://a.com/x");
  assert.equal(U.safeUrl("javascript:alert(1)"), "");
  assert.equal(U.safeUrl("data:text/html,oi"), "");
  assert.equal(U.safeUrl("  "), "");
});

test("esc e rich escapam HTML", () => {
  assert.equal(U.esc(`<a href="x">'&`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
  assert.match(U.rich("veja https://x.com\nok"), /<a href="https:\/\/x\.com"[^>]*>https:\/\/x\.com<\/a><br>ok/);
  assert.ok(!U.rich("<script>").includes("<script>"));
});

test("normItem converte o formato antigo e completa campos", () => {
  const it = U.normItem(["9h","Louvre",{p:"Musée du Louvre",links:[["Site","https://louvre.fr"]]}]);
  assert.equal(it.h, "9h"); assert.equal(it.t, "Louvre"); assert.equal(it.p, "Musée du Louvre");
  assert.deepEqual(it.links, [{l:"Site",u:"https://louvre.fr"}]);
  assert.ok(it.id);
  const same = U.normItem(it);
  assert.equal(same.id, it.id);
});

test("routeOf monta a rota do dia sem repetir lugares seguidos", () => {
  assert.equal(U.routeOf([]), "");
  assert.match(U.routeOf(["A"]), /maps\/search/);
  const r = U.routeOf(["A","A","B",""]);
  assert.equal(r, "https://www.google.com/maps/dir/A/B/");
});

test("nextItemId acha a próxima atividade não feita de hoje", () => {
  const now = new Date(2026, 9, 24, 11, 0);
  const day = {date:"2026-10-24", items:[{id:"a",h:"9h"},{id:"b",h:"12h",done:true},{id:"c",h:"13h"}]};
  assert.equal(U.nextItemId(day, now), "c");
  assert.equal(U.nextItemId({...day, date:"2026-10-25"}, now), null);
});

test("parseMoney entende reais e euros digitados", () => {
  assert.equal(U.parseMoney("R$ 3.875,23"), 3875.23);
  assert.equal(U.parseMoney("6,5"), 6.5);
  assert.equal(U.parseMoney("12.5"), 12.5);
  assert.equal(U.parseMoney("20.000"), 20000);
  assert.equal(U.parseMoney("1.234.567"), 1234567);
  assert.equal(U.parseMoney("6.50"), 6.5);
  assert.equal(U.parseMoney(""), 0);
  assert.equal(U.parseMoney(7), 7);
});

test("sumBy soma gastos em reais por chave", () => {
  const ex = [{cat:"a",day:"d1",valor:10,moeda:"EUR"},{cat:"a",day:"d2",valor:20,moeda:"BRL"},{cat:"b",valor:1,moeda:"EUR"}];
  assert.deepEqual(U.sumBy(ex,"cat",6), {a:80,b:6});
  assert.deepEqual(U.sumBy(ex,"day",6), {d1:60,d2:20,"":6});
});

test("convite de sincronização vai e volta", () => {
  const inv = {cfg:{apiKey:"k",projectId:"p"}, code:"abc123"};
  const s = U.encodeInvite(inv);
  assert.match(s, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(U.decodeInvite(s), inv);
  assert.equal(U.decodeInvite("lixo"), null);
});

test("parseFirebaseConfig aceita o trecho do console", () => {
  const txt = `// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaXYZ",
  authDomain: "lua.firebaseapp.com",
  projectId: 'lua-de-mel',
  appId: "1:2:web:3",
};`;
  assert.deepEqual(U.parseFirebaseConfig(txt), {apiKey:"AIzaXYZ",authDomain:"lua.firebaseapp.com",projectId:"lua-de-mel",appId:"1:2:web:3"});
  assert.equal(U.parseFirebaseConfig("nada"), null);
  assert.equal(U.parseFirebaseConfig("{}"), null);
});

test("código da viagem é longo e sem caracteres ambíguos", () => {
  const c = U.newTripCode();
  assert.equal(c.length, 24);
  assert.match(c, /^[a-km-np-z2-9]+$/);
});

test("weatherKind classifica os códigos do Open-Meteo", () => {
  assert.equal(U.weatherKind(0)[1], "sun");
  assert.equal(U.weatherKind(2)[1], "partly");
  assert.equal(U.weatherKind(61)[1], "rain");
  assert.equal(U.weatherKind(81)[1], "rain");
  assert.equal(U.weatherKind(95)[1], "storm");
});

test("dados padrão são consistentes", () => {
  const ids = new Set();
  for (const d of DEFAULT_DAYS) {
    assert.match(d.date, /^2026-10-\d\d$/);
    assert.ok(!ids.has(d.id)); ids.add(d.id);
    const n = U.normDay(structuredClone(d));
    n.items.forEach(i => i.links.forEach(l => assert.equal(U.safeUrl(l.u), new URL(l.u).href)));
  }
  const checkIds = DEFAULT_CHECKLIST.flatMap(g => g.items.map(i => i.id));
  assert.equal(new Set(checkIds).size, checkIds.length);
  assert.deepEqual(DEFAULT_BUDGET.plan.map(p => p.id).sort(),
    ["atracoes","comida","compras","disney","disneyfood","imprevistos","transporte"]);
});
