/* Previsão do tempo por dia (Open-Meteo: gratuito, sem chave). Guarda o resultado para usar offline. */
import {WEATHER_PLACES} from "./data.js";
import {addDays, isoToday} from "./utils.js";

const LS = "ldm-weather";
const MAX_AGE = 3*3600e3;      // atualiza a cada 3 h
export const FORECAST_DAYS = 16; // alcance da previsão

let cache = {};
try{ cache=JSON.parse(localStorage.getItem(LS)||"{}") }catch(e){}

/* Onde buscar a previsão de cada dia do roteiro. */
export function placeFor(day){
  if(day.phase==="disney") return "disney";
  if(/são paulo|guarulhos/i.test(day.base)&&!/paris/i.test(day.base)) return "sp";
  return "paris";
}
export function forecast(day){
  const c=cache[placeFor(day)];
  return c&&c.days?c.days[day.date]||null:null;
}
/* Data a partir da qual a previsão do dia aparece. */
export const availableFrom = iso => addDays(iso,-(FORECAST_DAYS-1));

async function fetchPlace(key){
  const p=WEATHER_PLACES[key];
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}`+
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`+
    `&timezone=${encodeURIComponent(p.tz)}&forecast_days=${FORECAST_DAYS}`;
  const r=await fetch(url); if(!r.ok) throw new Error(r.status);
  const j=await r.json(), d=j.daily, days={};
  d.time.forEach((t,i)=>{ days[t]={code:d.weather_code[i],max:d.temperature_2m_max[i],min:d.temperature_2m_min[i],rain:d.precipitation_probability_max[i]} });
  cache[key]={at:Date.now(),days};
}

/* Busca só o necessário: locais com algum dia dentro do alcance e cache velho. */
export async function refresh(days){
  const today=isoToday(), last=addDays(today,FORECAST_DAYS-1);
  const need=new Set(days.filter(d=>d.date>=today&&d.date<=last).map(placeFor));
  const stale=[...need].filter(k=>!cache[k]||Date.now()-cache[k].at>MAX_AGE);
  if(!stale.length) return false;
  const res=await Promise.allSettled(stale.map(fetchPlace));
  try{ localStorage.setItem(LS,JSON.stringify(cache)) }catch(e){}
  return res.some(r=>r.status==="fulfilled");
}
