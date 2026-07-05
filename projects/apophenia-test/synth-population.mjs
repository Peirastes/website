// Synthetic population to exercise analytics.mjs end-to-end (no real data / no IRB).
// Generates realistic contributed payloads across player archetypes, scored and
// classified EXACTLY as the app does (genSeries + Brier + binomial sensitivity),
// then runs the population analyzer. Proves the processing pipeline before launch.
//   node synth-population.mjs [N=250]
import { analyze, formatReport } from "./analytics.mjs";

const VIS = 60, FUT = 12, N = Number(process.argv[2]) || 250;
const PARAMS_HASH = "v0.4.1|synthetic";
const R = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[R(a.length)];

// --- generator (mirrors the app) ---
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function makeGauss(rng){return function(){let u=0,v=0;while(!u)u=rng();while(!v)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};}
const MP={momentum:{sd:.25,obs:.7,subtle:{phi:.82},standard:{phi:.92},sentinel:{phi:.99}},meanrev:{subtle:{k:.04,shock:0},standard:{k:.12,shock:1.5},sentinel:{k:.12,shock:8}},regime:{subtle:{mu:.3,pS:.06},standard:{mu:.45,pS:.04},sentinel:{mu:.9,pS:.01}}};
const CEIL={momentum:{subtle:63,standard:73,sentinel:88},meanrev:{subtle:65,standard:73,sentinel:93},regime:{subtle:66,standard:77,sentinel:94}};
function genSeries(mech,tier,seed){const rng=mulberry32(seed),g=makeGauss(rng),n=VIS+FUT+1,xs=[0];
  if(mech==="noise"){for(let i=1;i<n;i++)xs.push(xs[i-1]+g());}
  else if(mech==="momentum"){const{sd,obs}=MP.momentum,{phi}=MP.momentum[tier];let d=0;for(let i=1;i<n;i++){d=phi*d+sd*g();xs.push(xs[i-1]+d+obs*g());}}
  else if(mech==="meanrev"){const{k,shock}=MP.meanrev[tier];const sh=shock*(rng()<.5?1:-1);for(let i=1;i<n;i++){let dx=-k*xs[i-1]+g();if(shock&&i===VIS-4)dx+=sh;xs.push(xs[i-1]+dx);}}
  else{const{mu,pS}=MP.regime[tier];let s=rng()<.5?1:-1;for(let i=1;i<n;i++){if(rng()<pS)s=-s;xs.push(xs[i-1]+s*mu+g());}}
  return xs;}
const newSeed=()=>Math.floor(Math.random()*4294967296);
function buildDeck(size){const deck=[];const push=(m,t,c)=>{for(let i=0;i<c;i++)deck.push({mech:m,tier:t,seed:newSeed()});};
  if(size==="full"){push("noise","standard",9);["momentum","meanrev","regime"].forEach(m=>{push(m,"sentinel",1);push(m,"standard",2);push(m,"subtle",2);});}
  else{push("noise","standard",5);push("momentum","sentinel",1);push("regime","sentinel",1);push("momentum","standard",1);push("meanrev","standard",1);push("regime","standard",1);push("meanrev","subtle",1);push("momentum","subtle",1);}
  for(let i=deck.length-1;i>0;i--){const j=R(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
const nCk=(n,k)=>{if(k<0||k>n)return 0;k=Math.min(k,n-k);let r=1;for(let i=0;i<k;i++)r=r*(n-i)/(i+1);return r;};
const binomTailP=(x,n)=>{let s=0;for(let k=x;k<=n;k++)s+=nCk(n,k);return s/Math.pow(2,n);};

// --- player archetypes: given a trial, return {dir, conf} ('up'|'down'|'abstain') ---
const confBand=(lo,hi)=>{const steps=[];for(let c=lo;c<=hi;c+=5)steps.push(c);return pick(steps);};
function playerCall(kind, mech, tier, wentUp){
  const noise = mech==="noise";
  const correctDir = wentUp?"up":"down", wrongDir = wentUp?"down":"up";
  // skilled: correct with prob p (structured only); noise has no signal
  const skillHit = (skill)=>{ if(noise) return Math.random()<.5?"up":"down"; const p=0.5+skill*(CEIL[mech][tier]/100-0.5); return Math.random()<p?correctDir:wrongDir; };
  switch(kind){
    case "coin":        return { dir: Math.random()<.5?"up":"down", conf: confBand(55,95) };
    case "apophenic":   return { dir: Math.random()<.5?"up":"down", conf: confBand(80,95) }; // confident everywhere
    case "restrained":  { if(Math.random()<(noise?0.85:0.6)) return {dir:"abstain"}; return {dir:Math.random()<.5?"up":"down",conf:confBand(55,65)}; }
    case "weakDisc":    { if(noise && Math.random()<0.6) return {dir:"abstain"}; return {dir: skillHit(0.45), conf: noise?confBand(55,60):confBand(60,80)}; }
    case "strongDisc":  { if(noise && Math.random()<0.85) return {dir:"abstain"}; return {dir: skillHit(0.85), conf: noise?55:confBand(75,95)}; }
  }
}
const MIX=[["coin",.30],["apophenic",.20],["restrained",.18],["weakDisc",.17],["strongDisc",.15]];
const drawKind=()=>{let x=Math.random(),a=0;for(const[k,w]of MIX){a+=w;if(x<=a)return k;}return "coin";};

function makeSession(pilot){
  const kind=drawKind();
  const size=Math.random()<0.7?"full":"quick";
  const deck=buildDeck(size);
  const trials=[]; deck.forEach((d,i)=>{
    const xs=genSeries(d.mech,d.tier,d.seed); const wentUp=xs[VIS+FUT]>xs[VIS];
    const {dir,conf}=playerCall(kind,d.mech,d.tier,wentUp);
    const usedConf=dir==="abstain"?50:conf;
    const pUp=dir==="up"?usedConf/100:dir==="down"?1-usedConf/100:0.5;
    const brier=+Math.pow(pUp-(wentUp?1:0),2).toFixed(4);
    const correct=dir==="abstain"?null:(pUp>0.5)===wentUp;
    trials.push({trial:i+1,seed:d.seed,mech:d.mech,tier:d.tier,dir,conf:usedConf,wentUp,brier,correct,rtMs:800+R(4000)});
  });
  // summary (mirror app report)
  const noise=trials.filter(t=>t.mech==="noise"),struct=trials.filter(t=>t.mech!=="noise");
  const meanBrier=+(trials.reduce((s,t)=>s+t.brier,0)/trials.length).toFixed(4);
  const calledS=struct.filter(t=>t.correct!==null),structN=calledS.length,structK=calledS.filter(t=>t.correct).length;
  const structAcc=structN?structK/structN:null;
  const calledN=noise.filter(t=>t.correct!==null);
  const noiseAcc=calledN.length?calledN.filter(t=>t.correct).length/calledN.length:null;
  const apopheniaIndex=noise.length?+(noise.reduce((s,t)=>s+(t.conf-50),0)/noise.length).toFixed(2):0;
  const abstainRateNoise=noise.length?+(noise.filter(t=>t.dir==="abstain").length/noise.length).toFixed(3):0;
  const sensitive=structAcc!==null&&structN>=3&&binomTailP(structK,structN)<0.05;
  const restrained=apopheniaIndex<=10||abstainRateNoise>=0.4;
  let quadrant; if(structN<3)quadrant="—";else if(sensitive&&restrained)quadrant="A";else if(!sensitive&&restrained)quadrant="B";else if(sensitive&&!restrained)quadrant="C";else quadrant="D";
  const sent=struct.filter(t=>t.tier==="sentinel"&&t.correct!==null);
  const sentinelHit=sent.length?sent.filter(t=>t.correct).length/sent.length:null;
  return {
    instrument:"apophenia-filter", version:"0.4.1", paramsHash:PARAMS_HASH,
    sessionId:`${Date.now().toString(36)}-${newSeed().toString(36)}`,
    participantId:`p-synth-${newSeed().toString(36)}`, participantPersistent:true, codename:null,
    pilot, sessionSize:size, startedAt:"2026-07-03T00:00:00Z", completedAt:"2026-07-03T00:05:00Z",
    summary:{quadrant,meanBrier,structAcc,structN,noiseAcc,apopheniaIndex,abstainRateNoise,sentinelHit},
    trials, _archetype:kind,
  };
}

const payloads=[];
for(let i=0;i<N;i++) payloads.push(makeSession(false));
for(let i=0;i<8;i++) payloads.push(makeSession(true)); // a few pilot sessions to confirm exclusion

// ground-truth archetype tally (what we generated) for sanity
const truth={}; payloads.filter(p=>!p.pilot).forEach(p=>truth[p._archetype]=(truth[p._archetype]||0)+1);
console.log("generated archetypes (truth):", JSON.stringify(truth), "+ 8 pilot\n");
console.log(formatReport(analyze(payloads)));
