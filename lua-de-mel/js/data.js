/* Dados originais da viagem. O que vocês editarem fica salvo à parte e estes valores servem de ponto de partida. */

/* Cada atividade: [horário, texto, {p: lugar para o mapa, how: como chegar, links: [[nome, url]], obs}] */
export const DEFAULT_DAYS = [
 {id:"d19",date:"2026-10-19",title:"Partida",base:"São Paulo",phase:"travel",
  items:[["15h","Chegar em Guarulhos (3 h antes)",{p:"Aeroporto Internacional de Guarulhos, Terminal 3",links:[["LATAM (check-in)","https://www.latamairlines.com/br/pt"]]}],
   ["18h","Voo LATAM para Paris",{obs:"Voo noturno: levar travesseiro de pescoço e casaco na bagagem de mão."}]]},
 {id:"d20",date:"2026-10-20",title:"Chegada e descanso",base:"Montévrain",phase:"travel",
  flags:[["info","Comprar os 2 Navigo Semaine no CDG"]],
  items:[["10h15","Pouso em CDG",{p:"Aéroport Paris-Charles de Gaulle"}],
   ["10h45","Imigração (cadastro biométrico) e malas"],
   ["12h","Trem até Val d'Europe",{p:"Gare de Val d'Europe, Serris",how:"Opção 1: RER B até Châtelet–Les Halles e RER A (sentido Marne-la-Vallée–Chessy) até Val d'Europe, cerca de 1h30, coberto pelo Navigo.\nOpção 2: TGV do CDG até Marne-la-Vallée–Chessy (cerca de 10 min, bilhete à parte) e RER A uma estação de volta até Val d'Europe.",links:[["Île-de-France Mobilités","https://www.iledefrance-mobilites.fr"]]}],
   ["14h","Check-in no Airbnb e descanso",{p:"Montévrain, France"}],
   ["16h","Supermercado; Val d'Europe se houver energia",{p:"Val d'Europe, Serris",how:"Shopping ao lado da estação de RER Val d'Europe."}],
   ["19h","Jantar cedo e dormir (jet lag)"]],cost:"cerca de €60"},
 {id:"d21",date:"2026-10-21",title:"Disneyland Park",base:"Montévrain",phase:"disney",
  items:[["9h","Nos portões antes da abertura (confirmar no app)",{p:"Disneyland Park, Chessy",how:"RER A de Val d'Europe até Marne-la-Vallée–Chessy (1 estação). A entrada fica a poucos minutos a pé.",links:[["Disneyland Paris","https://www.disneylandparis.com"]]}],
   ["Manhã","Peter Pan's Flight, Big Thunder Mountain, Star Wars Hyperspace Mountain"],
   ["12h","Almoço"],
   ["Tarde","Pirates of the Caribbean, Phantom Manor, Indiana Jones, It's a Small World, desfile"],
   ["Noite","Show no castelo e volta",{how:"RER A de Marne-la-Vallée–Chessy até Val d'Europe."}]],cost:"ingressos + cerca de €90 de comida"},
 {id:"d22",date:"2026-10-22",title:"Disney Adventure World",base:"Montévrain",phase:"disney",
  flags:[["pend","Decidir: 2º dia na Disney ou dia livre"]],
  items:[["9h","Direto para World of Frozen (Frozen Ever After)",{p:"Disney Adventure World, Chessy",how:"RER A de Val d'Europe até Marne-la-Vallée–Chessy (1 estação).",links:[["Disneyland Paris","https://www.disneylandparis.com"]]}],
   ["Manhã","Avengers Campus, Ratatouille, Crush's Coaster, Tower of Terror"],
   ["12h","Almoço"],
   ["Tarde","Voltar ao Disneyland Park para repetir favoritos"],
   ["Noite","Show noturno (horário no app)"]],cost:"ingressos + cerca de €90 de comida"},
 {id:"d23",date:"2026-10-23",title:"Mudança para o Marais",base:"Paris",phase:"paris",
  items:[["10h","Check-out em Montévrain"],
   ["11h","RER A até Châtelet–Les Halles, depois metrô",{p:"Châtelet–Les Halles, Paris",how:"RER A de Val d'Europe até Châtelet–Les Halles (cerca de 40 min). De lá, metrô ou táxi até o Airbnb no Marais."}],
   ["12h30","Almoço no Marché des Enfants Rouges",{p:"Marché des Enfants Rouges, 39 Rue de Bretagne, Paris",how:"Metrô 3 até Temple ou metrô 8 até Filles du Calvaire."}],
   ["15h","Check-in no Airbnb e descanso",{p:"Le Marais, Paris"}],
   ["17h","Place des Vosges e Rue des Rosiers a pé",{p:"Place des Vosges, Paris",how:"A pé pelo Marais."}],
   ["20h","Jantar romântico no Marais"]],cost:"cerca de €100"},
 {id:"d24",date:"2026-10-24",title:"Torre Eiffel",base:"Paris",phase:"paris",
  items:[["9h30","Trocadéro para as fotos",{p:"Place du Trocadéro, Paris",how:"Metrô 9 (ou 6) até Trocadéro."}],
   ["10h30","Torre Eiffel, 2º andar, horário reservado",{p:"Tour Eiffel, Paris",how:"Atravessar a Pont d'Iéna a pé a partir do Trocadéro (10 min).",links:[["Site oficial","https://www.toureiffel.paris"]]}],
   ["13h","Almoço ou piquenique no Champ de Mars",{p:"Champ de Mars, Paris"}],
   ["Tarde","Invalides e Pont Alexandre III",{p:"Hôtel des Invalides, Paris",how:"A pé pela margem do Sena ou metrô 8 até Invalides."}],
   ["Noite","Torre cintilando (5 min a cada hora cheia)",{p:"Place du Trocadéro, Paris"}]],cost:"€47 de ingressos + cerca de €100"},
 {id:"d25",date:"2026-10-25",title:"Louvre",base:"Paris",phase:"paris",
  flags:[["info","Relógios atrasam 1 h nesta madrugada"]],
  items:[["9h","Louvre com horário reservado (3 ou 4 alas)",{p:"Musée du Louvre, Paris",how:"Metrô 1 até Palais Royal–Musée du Louvre.",links:[["Site oficial","https://www.louvre.fr"]]}],
   ["13h","Almoço"],
   ["14h30","Jardim das Tuileries",{p:"Jardin des Tuileries, Paris",how:"Saindo do Louvre, a pé pelo Arc du Carrousel."}],
   ["15h30","Orsay, opcional",{p:"Musée d'Orsay, Paris",how:"Atravessar a passarela Léopold-Sédar-Senghor a partir das Tuileries (5 min a pé).",links:[["Site oficial","https://www.musee-orsay.fr"]]}],
   ["Noite","Jantar em Saint-Germain",{p:"Saint-Germain-des-Prés, Paris",how:"Metrô 4 até Saint-Germain-des-Prés, ou a pé a partir do Orsay."}]],cost:"€64 de Louvre (+€32 Orsay) + cerca de €100"},
 {id:"d26",date:"2026-10-26",title:"Montmartre e jantar especial",base:"Paris",phase:"paris",
  flags:[["info","Comprar os Navigo da nova semana"],["rose","Jantar especial"]],
  items:[["10h","Sacré-Cœur e Place du Tertre",{p:"Basilique du Sacré-Cœur, Paris",how:"Metrô 2 até Anvers e funicular de Montmartre (vale com o Navigo)."}],
   ["13h","Almoço em Montmartre",{p:"Place du Tertre, Paris"}],
   ["15h","Galeries Lafayette (terraço) e Ópera",{p:"Galeries Lafayette Haussmann, Paris",how:"Metrô 7 ou 9 até Chaussée d'Antin–La Fayette. O terraço é gratuito."}],
   ["18h","Descanso"],
   ["20h","Jantar especial da lua de mel",{obs:"Colocar aqui o nome e o endereço do restaurante quando reservar."}]],cost:"cerca de €160"},
 {id:"d27",date:"2026-10-27",title:"Versalhes",base:"Paris",phase:"paris",
  items:[["8h30","RER C até Versailles Château Rive Gauche",{p:"Gare de Versailles Château Rive Gauche",how:"RER C (sentido Versailles Château Rive Gauche) até o fim da linha, cerca de 40 min. Coberto pelo Navigo."}],
   ["9h30","Palácio com horário reservado",{p:"Château de Versailles",how:"10 min a pé da estação.",links:[["Site oficial","https://www.chateauversailles.fr"]]}],
   ["12h30","Piquenique nos jardins",{p:"Jardins du Château de Versailles"}],
   ["Tarde","Jardins e Trianon",{p:"Domaine de Trianon, Versailles"}],
   ["17h","Volta; jantar tranquilo no Marais",{how:"RER C de volta até Paris e metrô até o Marais."}]],cost:"€70 de ingressos + cerca de €90"},
 {id:"d28",date:"2026-10-28",title:"Île de la Cité e Sena",base:"Paris",phase:"paris",
  flags:[["pend","Último dia inteiro: arrumar malas à noite"]],
  items:[["10h","Notre-Dame (gratuita) e Sainte-Chapelle, opcional",{p:"Cathédrale Notre-Dame de Paris",how:"Metrô 4 até Cité, ou RER B/C até Saint-Michel Notre-Dame.",links:[["Sainte-Chapelle","https://www.sainte-chapelle.fr"]]}],
   ["13h","Almoço"],
   ["14h30","Museu Picasso ou compras no Marais",{p:"Musée Picasso, Paris",how:"A pé pelo Marais, ou metrô 8 até Saint-Sébastien–Froissart.",links:[["Museu Picasso","https://www.museepicassoparis.fr"]]}],
   ["17h30","Cruzeiro no Sena no pôr do sol",{obs:"Conferir na reserva de qual píer o barco sai e colocar o local aqui."}],
   ["20h","Jantar de despedida"]],cost:"€40 de cruzeiro + cerca de €100"},
 {id:"d29",date:"2026-10-29",title:"Volta",base:"Paris → São Paulo",phase:"travel",
  items:[["7h","Café"],["7h45","Check-out do Airbnb"],
   ["8h","RER B em Châtelet até CDG (cerca de 50 min)",{p:"Aéroport Paris-Charles de Gaulle",how:"RER B de Châtelet–Les Halles até Aéroport CDG 2. O Navigo da semana cobre o trajeto."}],
   ["9h","Check-in e despacho",{links:[["LATAM","https://www.latamairlines.com/br/pt"]]}],
   ["12h05","Voo LATAM de volta"],["19h55","Chegada em Guarulhos"]],cost:"cerca de €20"}
];

export const TRIP = {start:"2026-10-19", end:"2026-10-29",
  depart:"2026-10-19T18:00:00-03:00", back:"2026-10-29T19:55:00-03:00"};

export const PHASES = {travel:["Viagem","var(--grey)","var(--grey-soft)"],disney:["Disney","var(--gold)","var(--gold-soft)"],paris:["Paris","var(--seine)","var(--seine-soft)"]};
export const FLAG_KINDS = {info:"Informação",pend:"Pendência",rose:"Especial"};

/* Locais da previsão do tempo por tipo de dia. */
export const WEATHER_PLACES = {
  paris:{lat:48.8566,lon:2.3522,tz:"Europe/Paris",name:"Paris"},
  disney:{lat:48.8674,lon:2.7836,tz:"Europe/Paris",name:"Disney"},
  sp:{lat:-23.4356,lon:-46.4731,tz:"America/Sao_Paulo",name:"Guarulhos"}
};

export const BOOKING_KINDS = ["Voo","Hospedagem","Ingresso","Restaurante","Passeio","Transporte","Outro"];
export const DEFAULT_BOOKINGS = [
 {id:"b-ida",kind:"Voo",title:"LATAM, ida",from:"GRU",fromWhen:"19 out, 18h00",to:"CDG",toWhen:"20 out, 10h15",when:"",place:"",code:"",value:"R$ 3.875,23",link:"",notes:""},
 {id:"b-hosp1",kind:"Hospedagem",title:"Airbnb em Montévrain",from:"",fromWhen:"",to:"",toWhen:"",when:"20 → 23 out, 3 noites",place:"Montévrain, France",code:"",value:"R$ 1.835,27",link:"",notes:"Região: perto de Val d'Europe"},
 {id:"b-hosp2",kind:"Hospedagem",title:"Airbnb no Marais",from:"",fromWhen:"",to:"",toWhen:"",when:"23 → 29 out, 6 noites",place:"Le Marais, Paris",code:"",value:"R$ 4.329,33",link:"",notes:""},
 {id:"b-volta",kind:"Voo",title:"LATAM, volta",from:"CDG",fromWhen:"29 out, 12h05",to:"GRU",toWhen:"29 out, 19h55",when:"",place:"",code:"",value:"",link:"",notes:"Sair do Marais até 8h"}
];

export const DEFAULT_CHECKLIST = [
 {id:"g1",name:"Esta semana (até 5 out)",items:[
  {id:"disney",t:"Ingressos Disney datados para 21 e 22 out"},
  {id:"eiffel",t:"Torre Eiffel, 2º andar por elevador, 24 out de manhã (site oficial)"},
  {id:"louvre",t:"Louvre, 25 out às 9h"},
  {id:"versalhes",t:"Versalhes, 27 out às 9h30"},
  {id:"etias",t:"Conferir se o ETIAS já é exigido (europa.eu/etias)"}]},
 {id:"g2",name:"Até 10 out",items:[
  {id:"jantar",t:"Reservar o jantar especial de 26 out"},
  {id:"seguro",t:"Seguro viagem com cobertura mínima de €30.000"},
  {id:"anfitrioes",t:"Combinar check-in, check-out e malas com os anfitriões"},
  {id:"decisao",t:"Decidir se a Disney fica com 1 ou 2 dias"}]},
 {id:"g3",name:"Até a véspera",items:[
  {id:"cruzeiro",t:"Cruzeiro no Sena de 28 out"},
  {id:"opcionais",t:"Orsay, Picasso ou Sainte-Chapelle, se forem fazer"},
  {id:"foto",t:"Fotos 3 × 2,5 cm para os cartões Navigo"},
  {id:"banco",t:"Avisar o banco e levar 2 cartões"},
  {id:"checkin-ida",t:"Check-in online do voo de ida (18 out)"}]},
 {id:"g4",name:"Durante a viagem",items:[
  {id:"navigo1",t:"Comprar Navigo Semaine no CDG (20 out)"},
  {id:"checkin-volta",t:"Check-in online do voo de volta (28 out)"},
  {id:"navigo2",t:"Comprar Navigo Semaine da nova semana (26 out)"}]}
];

export const DEFAULT_BUDGET = {
  ceiling:15000, rate:6.5,
  paid:[{id:"p1",name:"Passagens",value:3875.23},{id:"p2",name:"Hospedagens",value:6164.60}],
  plan:[
   {id:"disney",name:"Ingressos Disney",note:"2 dias, 2 parques",value:400,cur:"EUR"},
   {id:"disneyfood",name:"Comida na Disney",note:"2 dias",value:180,cur:"EUR"},
   {id:"atracoes",name:"Atrações em Paris",note:"Torre, Louvre, Versalhes, cruzeiro",value:220,cur:"EUR"},
   {id:"comida",name:"Comida fora da Disney",note:"cerca de €100 por dia",value:740,cur:"EUR"},
   {id:"transporte",name:"Transporte",note:"2 Navigo por pessoa",value:140,cur:"EUR"},
   {id:"compras",name:"Compras e souvenirs",note:"teto",value:150,cur:"EUR"},
   {id:"imprevistos",name:"Imprevistos",note:"reserva",value:150,cur:"EUR"}]
};

export const WISH_KINDS = {food:"Restaurante / café",tour:"Passeio",shop:"Compras",other:"Outro"};

export const EMERGENCY = [
 ["112","Emergência (número europeu)","Funciona de qualquer celular, inclusive sem chip local."],
 ["15","SAMU (ambulância)",""],
 ["17","Polícia",""],
 ["18","Bombeiros",""]
];

export const PHRASES = [
 ["Bom dia / Olá","Bonjour","bon-ZHUR"],
 ["Boa noite","Bonsoir","bon-SUAR"],
 ["Obrigado(a)","Merci","mér-SI"],
 ["Por favor","S'il vous plaît","sil vu PLÉ"],
 ["Com licença / Desculpe","Excusez-moi","ex-kiu-zê-MUÁ"],
 ["Você fala inglês?","Parlez-vous anglais ?","par-lê vu an-GLÉ"],
 ["Uma mesa para dois","Une table pour deux","iún TÁBL pur DÊ"],
 ["A conta, por favor","L'addition, s'il vous plaît","la-di-SIÕ sil vu PLÉ"],
 ["Onde fica o metrô?","Où est le métro ?","u é lê mê-TRÔ"],
 ["Quanto custa?","Combien ça coûte ?","kom-BIÃ sa KUT"],
 ["Estamos em lua de mel","Nous sommes en lune de miel","nu SÓM ã LIÚN dê MIÉL"],
 ["Preciso de um médico","J'ai besoin d'un médecin","zhê bê-ZUÃ dã mêd-SÃ"],
 ["Socorro!","Au secours !","ô sê-KUR"]
];
