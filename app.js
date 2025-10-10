(() => {
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const el=(t,a={})=>Object.assign(document.createElement(t),a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  // Tabs
  $$('.tab-btn').forEach(btn => btn.addEventListener('click', ()=>{
    $$('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    $$('.tab').forEach(t=>t.classList.remove('active'));
    $(id)?.classList.add('active');
  }));

  // Timer
  let timerId=null, remainSec=20*60;
  const rd=$('#timer-readout'), minIn=$('#timer-min');
  function renderTimer(){ const m=String(Math.floor(remainSec/60)).padStart(2,'0'); const s=String(remainSec%60).padStart(2,'0'); rd.textContent=`${m}:${s}`; }
  function startTimer(){ if(timerId) return; timerId=setInterval(()=>{ remainSec=Math.max(0,remainSec-1); renderTimer(); if(remainSec===0){pauseTimer();}},1000); }
  function pauseTimer(){ clearInterval(timerId); timerId=null; }
  function resetTimer(){ pauseTimer(); remainSec=clamp(parseInt(minIn.value||'20',10),1,120)*60; renderTimer(); }
  $('#timer-start')?.addEventListener('click', startTimer);
  $('#timer-pause')?.addEventListener('click', pauseTimer);
  $('#timer-reset')?.addEventListener('click', resetTimer);
  renderTimer();

  // Data
  let MOVES=[], POKES=[];

  // Local loaders
  const msg = $('#load-msg');
  $('#btn-load-moves')?.addEventListener('click', ()=>$('#file-moves').click());
  $('#btn-load-pokes')?.addEventListener('click', ()=>$('#file-pokes').click());
  $('#btn-load-oppteam')?.addEventListener('click', ()=>$('#file-oppteam').click());

  function parseCSV(text){
    const lines = text.trim().split(/\r?\n/); if(lines.length<2) return [];
    const header = lines.shift().split(',');
    const idx = {name:header.indexOf('name'), type:header.indexOf('type'), category:header.indexOf('category'), power:header.indexOf('power')};
    return lines.map(line=>{
      const a=line.split(',');
      return {name:(a[idx.name]||'').trim(), type:(a[idx.type]||'').trim(), category:(a[idx.category]||'').trim(), power:Number(a[idx.power]||0)};
    }).filter(x=>x.name);
  }

  $('#file-moves')?.addEventListener('change', e=>{
    const f=e.target.files?.[0]; if(!f) return;
    const fr=new FileReader();
    fr.onload=()=>{ try{
      MOVES=parseCSV(String(fr.result||''));
      $('#dl_moves').innerHTML = MOVES.map(m=>`<option value="${m.name}">`).join('');
      msg.textContent = `技CSV: ${MOVES.length}件`;
    }catch{ msg.textContent='技CSV読込エラー'; } };
    fr.readAsText(f,'utf-8');
  });

  $('#file-pokes')?.addEventListener('change', e=>{
    const f=e.target.files?.[0]; if(!f) return;
    const fr=new FileReader();
    fr.onload=()=>{ try{
      POKES=JSON.parse(String(fr.result||'[]'));
      $('#dl_pokemon').innerHTML = POKES.map(p=>`<option value="${p.名前||p.name}">`).join('');
      msg.textContent = `図鑑JSON: ${POKES.length}件`;
    }catch{ msg.textContent='図鑑JSON読込エラー'; } };
    fr.readAsText(f,'utf-8');
  });

  // Party cards (3+3)
  function partyCard(i){
    const card=el('div',{className:'party-card'});
    card.innerHTML = `
      <label>名前<input class="p-name" list="dl_pokemon" placeholder="ポケモン名"></label>
      <div class="moves">
        <label>技1<input class="p-m1" list="dl_moves"></label>
        <label>技2<input class="p-m2" list="dl_moves"></label>
        <label>技3<input class="p-m3" list="dl_moves"></label>
        <label>技4<input class="p-m4" list="dl_moves"></label>
      </div>
      <div class="nature-line">
        <label>自分補正
          <select class="party-boost">
            <option value="N">等倍</option>
            <option value="A">A↑</option>
            <option value="C">C↑</option>
          </select>
        </label>
      </div>
    `;
    return card;
  }

  const pTop=$('#party-top'), pBot=$('#party-bottom');
  for(let i=0;i<6;i++){ (i<3?pTop:pBot).appendChild(partyCard(i)); }

  // 6x6 rows
  function sixRowSelf(){
    const row=el('div',{className:'six-row self'});
    row.innerHTML = `
      <label>名前<input class="self-name" list="dl_pokemon" placeholder="ポケモン名"></label>
      <label>自分補正
        <select class="self-boost">
          <option value="N">等倍</option>
          <option value="A">A↑</option>
          <option value="C">C↑</option>
        </select>
      </label>
      <label>技1<input class="move1" list="dl_moves"></label>
      <label>技2<input class="move2" list="dl_moves"></label>
      <label>技3<input class="move3" list="dl_moves"></label>
      <label>技4<input class="move4" list="dl_moves"></label>
    `;
    return row;
  }
  function sixRowOpp(){
    const row=el('div',{className:'six-row opp'});
    row.innerHTML = `
      <label>名前<input class="opp-name" list="dl_pokemon" placeholder="ポケモン名"></label>
      <label>耐久
        <select class="opp-def-preset">
          <option value="H0B0">H0/B0</option>
          <option value="HB252">HB252</option>
          <option value="HD252">HD252</option>
        </select>
      </label>
      <label>相手補正
        <select class="opp-boost">
          <option value="N">等倍</option>
          <option value="B">B↑</option>
          <option value="D">D↑</option>
        </select>
      </label>
    `;
    return row;
  }

  const selfList=$('#six-self'), oppList=$('#six-opp');
  for(let i=0;i<6;i++) selfList.appendChild(sixRowSelf());
  for(let i=0;i<6;i++) oppList.appendChild(sixRowOpp());
  $('#six-add-self')?.addEventListener('click', ()=> selfList.appendChild(sixRowSelf()));
  $('#six-add-opp')?.addEventListener('click', ()=> oppList.appendChild(sixRowOpp()));

  // Apply party -> six
  $('#party-apply-to-six')?.addEventListener('click', ()=>{
    const cards = $$('.party-card');
    const rows  = $$('#six-self .six-row.self');
    rows.forEach((r,i)=>{
      const c=cards[i]; if(!c) return;
      $('.self-name',r).value = $('.p-name',c)?.value||'';
      ['.move1','.move2','.move3','.move4'].forEach((s,j)=>{
        const v = $('.p-m'+(j+1),c)?.value||''; $(s,r).value = v;
      });
      const pb = $('.party-boost',c)?.value; if(pb) $('.self-boost',r).value = pb;
    });
  });

  // Type chart
  const TYPES=["ノーマル","ほのお","みず","でんき","くさ","こおり","かくとう","どく","じめん","ひこう","エスパー","むし","いわ","ゴースト","ドラゴン","あく","はがね","フェアリー"];
  const E={}; TYPES.forEach(t=>E[t]={});
  function se(a,d,v){E[a][d]=v;}
  // immunities
  se("ノーマル","ゴースト",0); se("でんき","じめん",0); se("かくとう","ゴースト",0); se("どく","はがね",0);
  se("じめん","ひこう",0); se("エスパー","あく",0); se("ゴースト","ノーマル",0); se("ドラゴン","フェアリー",0);
  // super-effectives
  se("ほのお","くさ",2); se("ほのお","こおり",2); se("ほのお","むし",2); se("ほのお","はがね",2);
  se("みず","ほのお",2); se("みず","じめん",2); se("みず","いわ",2);
  se("でんき","みず",2); se("でんき","ひこう",2);
  se("くさ","みず",2); se("くさ","じめん",2); se("くさ","いわ",2);
  se("こおり","くさ",2); se("こおり","じめん",2); se("こおり","ひこう",2); se("こおり","ドラゴン",2);
  se("かくとう","ノーマル",2); se("かくとう","こおり",2); se("かくとう","いわ",2); se("かくとう","あく",2); se("かくとう","はがね",2);
  se("どく","くさ",2); se("どく","フェアリー",2);
  se("じめん","どく",2); se("じめん","いわ",2); se("じめん","はがね",2); se("じめん","ほのお",2); se("じめん","でんき",2);
  se("ひこう","くさ",2); se("ひこう","かくとう",2); se("ひこう","むし",2);
  se("エスパー","かくとう",2); se("エスパー","どく",2);
  se("むし","くさ",2); se("むし","エスパー",2); se("むし","あく",2);
  se("いわ","ほのお",2); se("いわ","こおり",2); se("いわ","ひこう",2); se("いわ","むし",2);
  se("ゴースト","ゴースト",2); se("ゴースト","エスパー",2);
  se("ドラゴン","ドラゴン",2);
  se("あく","ゴースト",2); se("あく","エスパー",2);
  se("はがね","こおり",2); se("はがね","いわ",2); se("はがね","フェアリー",2);
  se("フェアリー","かくとう",2); se("フェアリー","ドラゴン",2); se("フェアリー","あく",2);
  // halves
  const halves=[["ほのお","ほのお"],["ほのお","みず"],["ほのお","いわ"],["ほのお","ドラゴン"],
    ["みず","みず"],["みず","くさ"],["みず","ドラゴン"],
    ["でんき","でんき"],["でんき","くさ"],["でんき","ドラゴン"],
    ["くさ","ほのお"],["くさ","くさ"],["くさ","どく"],["くさ","ひこう"],["くさ","むし"],["くさ","ドラゴン"],["くさ","はがね"],
    ["こおり","ほのお"],["こおり","みず"],["こおり","はがね"],["こおり","こおり"],
    ["かくとう","どく"],["かくとう","ひこう"],["かくとう","エスパー"],["かくとう","むし"],["かくとう","フェアリー"],
    ["どく","どく"],["どく","じめん"],["どく","いわ"],["どく","ゴースト"],
    ["じめん","くさ"],["じめん","むし"],
    ["ひこう","でんき"],["ひこう","いわ"],["ひこう","はがね"],
    ["エスパー","エスパー"],["エスパー","はがね"],
    ["むし","ほのお"],["むし","かくとう"],["むし","どく"],["むし","ひこう"],["むし","ゴースト"],["むし","はがね"],["むし","フェアリー"],
    ["いわ","じめん"],["いわ","はがね"],
    ["ゴースト","あく"],
    ["ドラゴン","はがね"],
    ["あく","あく"],["あく","フェアリー"],["あく","かくとう"],
    ["はがね","ほのお"],["はがね","みず"],["はがね","でんき"],["はがね","はがね"],
    ["フェアリー","ほのお"],["フェアリー","どく"],["フェアリー","はがね"]];
  halves.forEach(([a,d])=>se(a,d,0.5));

  function typeMul(atk, d1, d2){
    const v1 = (E[atk] && E[atk][d1]) ?? (d1?1:1);
    const v2 = d2 ? ((E[atk] && E[atk][d2]) ?? 1) : 1;
    return v1 * v2;
  }

  function statHP(base, iv, ev, lv=50){ if(base<=1) return 1; return Math.floor(((base*2 + iv + Math.floor(ev/4)) * lv) / 100 + lv + 10); }
  function statOther(base, iv, ev, nature=1.0, lv=50){ const v=Math.floor(((base*2 + iv + Math.floor(ev/4)) * lv) / 100 + 5); return Math.floor(v * nature); }

  function findSpecies(name){ return POKES.find(p=> (p.名前||p.name)===name ); }

  function atkInfoFromRow(row){
    const sel = $('.self-boost',row)?.value || 'N';
    const atkNature = (sel==='A')?1.1:1.0;
    const spaNature = (sel==='C')?1.1:1.0;
    return { level:50, atkNature, spaNature,
      atkEV:252, spaEV:252, atkIV:31, spaIV:31 };
  }

  function defInfoFromRow(row){
    const preset = $('.opp-def-preset',row)?.value || 'H0B0';
    const sel = $('.opp-boost',row)?.value || 'N';
    let evH=0, evB=0, evD=0, natB=1.0, natD=1.0;
    if(preset==='HB252'){ evH=252; evB=252; }
    else if(preset==='HD252'){ evH=252; evD=252; }
    if(sel==='B') natB=1.1;
    if(sel==='D') natD=1.1;
    return {evH, evB, evD, natB, natD};
  }

  function calcDamageRange(att, def, mv, atkI, defI){
    if(!mv) return {min:0,max:0,hp:1};
    const A=findSpecies(att), D=findSpecies(def);
    if(!A||!D) return {min:0,max:0,hp:1};
    const lv=50;
    const isSp = (mv.category||'').includes('特');
    const aBase = isSp? (A['特攻']??A.spa??0) : (A['攻撃']??A.atk??0);
    const dBase = isSp? (D['特防']??D.spd??0) : (D['防御']??D.def??0);
    const atk = isSp? statOther(aBase,31, atkI.spaEV, atkI.spaNature, lv)
                    : statOther(aBase,31, atkI.atkEV, atkI.atkNature, lv);
    const defStat = isSp? statOther(dBase,31, defI.evD, defI.natD, lv)
                    : statOther(dBase,31, defI.evB, defI.natB, lv);
    const hp  = statHP(D['HP']??D.hp??1,31, defI.evH, lv);
    let base = Math.floor(Math.floor(Math.floor((2*lv/5+2) * (mv.power||0) * Math.max(1,atk) / Math.max(1,defStat)) / 50) + 2);
    const aT1=A['タイプ1']??A.type1??'', aT2=A['タイプ2']??A.type2??'';
    const dT1=D['タイプ1']??D.type1??'', dT2=D['タイプ2']??D.type2??'';
    const stab = (mv.type===aT1 || mv.type===aT2) ? 1.5 : 1.0;
    const eff = typeMul(mv.type||'', dT1, dT2);
    const min = Math.floor(base*stab*eff*0.85);
    const max = Math.floor(base*stab*eff*1.00);
    return {min,max,hp};
  }

  function bestMove(attName, defName, mvNames, atkI, defI){
    let best={min:0,max:0,hp:1,mv:''};
    mvNames.forEach(nm=>{
      const mv=MOVES.find(m=>m.name===nm);
      if(!mv) return;
      const r=calcDamageRange(attName,defName,mv,atkI,defI);
      const pct = r.hp? r.max*100/r.hp : 0;
      const bestPct = best.hp? best.max*100/best.hp : 0;
      if(pct>bestPct) best={...r,mv:nm};
    });
    return best;
  }

  function calcMatrix(){
    const selfRows = $$('#six-self .six-row.self');
    let oppRows  = $$('#six-opp .six-row.opp');
    if(oppRows.length===0){ for(let i=0;i<6;i++) $('#six-opp').appendChild(sixRowOpp()); oppRows=$$('#six-opp .six-row.opp'); }

    const table=el('table'); const thead=el('thead'), trh=el('tr');
    trh.appendChild(el('th',{textContent:''}));
    const oppNames = oppRows.map(r=>$('.opp-name',r)?.value||'—');
    oppNames.forEach(n=>trh.appendChild(el('th',{textContent:n})));
    thead.appendChild(trh); table.appendChild(thead);
    const tbody=el('tbody');

    selfRows.forEach(sr=>{
      const sname=$('.self-name',sr)?.value||'';
      const mvNames=['.move1','.move2','.move3','.move4'].map(s=>$(s,sr)?.value||'').filter(Boolean);
      const atkI = { level:50,
        atkNature: ($('.self-boost',sr)?.value==='A')?1.1:1.0,
        spaNature: ($('.self-boost',sr)?.value==='C')?1.1:1.0,
        atkEV:252, spaEV:252, atkIV:31, spaIV:31 };
      const tr=el('tr'); tr.appendChild(el('th',{textContent:sname||'—'}));
      oppRows.forEach(or=>{
        const oname=$('.opp-name',or)?.value||'';
        const defI = defInfoFromRow(or);
        const td=el('td');
        if(!sname || !oname || !mvNames.length){
          td.textContent='0–0%';
        }else{
          const best=bestMove(sname,oname,mvNames,atkI,defI);
          if(best.hp===0){ td.textContent='0–0%'; }
          else{
            const minp=Math.round(best.min*1000/best.hp)/10;
            const maxp=Math.round(best.max*1000/best.hp)/10;
            td.textContent=`${minp}–${maxp}% [${best.min}–${best.max}] (${best.mv||'—'})`;
          }
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    const host=$('#matrix'); host.innerHTML=''; host.appendChild(table);
  }
  $('#matrix-recalc')?.addEventListener('click', calcMatrix);

  // Speed tab
  function statSpeed(base, ev, nature=1.0, stage=0, scarf=false, lv=50){
    const iv=31; const raw=Math.floor(((base*2+iv+Math.floor(ev/4))*lv)/100+5);
    const nat=Math.floor(raw*nature);
    const stageMul=[0.33,0.4,0.5,0.66,1,1.5,2,2.5][stage+4]||1;
    let v=Math.floor(nat*stageMul); if(scarf) v=Math.floor(v*1.5);
    return v;
  }
  function findBaseSpeed(name){ const sp=POKES.find(p=>(p.名前||p.name)===name); return sp?(sp['素早']??sp.spe??sp.speed??0):0; }
  $('#spd-calc')?.addEventListener('click', ()=>{
    const sN=$('#spd-self-name')?.value||'', oN=$('#spd-opp-name')?.value||'';
    const sNat=Number($('#spd-self-nat')?.value||'1.0'), oNat=Number($('#spd-opp-nat')?.value||'1.0');
    const sSt=Number($('#spd-self-stage')?.value||'0'), oSt=Number($('#spd-opp-stage')?.value||'0');
    const sSc=!!$('#spd-self-scarf')?.checked, oSc=!!$('#spd-opp-scarf')?.checked;
    const sBase=findBaseSpeed(sN), oBase=findBaseSpeed(oN);
    const sEV=clamp(parseInt($('#spd-self-ev')?.value||'252',10),0,252);
    const oEV=clamp(parseInt($('#spd-opp-ev')?.value||'252',10),0,252);
    const sVal=statSpeed(sBase,sEV,sNat,sSt,sSc);
    const oVal=statSpeed(oBase,oEV,oNat,oSt,oSc);
    $('#spd-self-val').textContent=String(sVal);
    $('#spd-opp-val').textContent=String(oVal);
    let need=null; for(let ev=0;ev<=252;ev+=4){ if(statSpeed(sBase,ev,sNat,sSt,sSc)>oVal){ need=ev; break; } }
    $('#spd-result').textContent = (need===null)?'EV252でも抜けません':`自分が抜く最小EV：${need}`;
  });
})();