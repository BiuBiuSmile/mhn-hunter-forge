'use strict';
const $ = id => document.getElementById(id);
const slots = {weapon:'武器',head:'頭部',chest:'身體',arms:'手部',waist:'腰部',legs:'腿部'};
const types = {swordshield:'單手劍',greatsword:'大劍',longsword:'太刀',dualblades:'雙劍',hammer:'大錘',huntinghorn:'狩獵笛',lance:'長槍',gunlance:'銃槍',switchaxe:'斬擊斧',chargeblade:'充能斧',insectglaive:'操蟲棍',lightbowgun:'輕弩槍',heavybowgun:'重弩槍',bow:'弓'};
const stones = Object.keys(atlas.skills).sort((a,b)=>a.localeCompare(b,'zh-Hant'));
const validGem = s => typeof s==='string' && s.trim().length>0 && s.length<=32 && !/[\x00-\x1f\x7f]/.test(s);
const allSkills = [...new Set([...stones,...catalog.flatMap(i=>Object.keys(i.skills))])].sort();
const byId = new Map(catalog.map(i=>[i.id,i]));
const repo='BiuBiuSmile/mhn-hunter-forge';
const site='https://biubiusmile.github.io/mhn-hunter-forge/';
const empty=()=>({name:'',gear:{},gems:{}});
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const option=(v,t,now)=>'<option value="'+esc(v)+'"'+(v===now?' selected':'')+'>'+esc(t)+'</option>';
function clean(raw){
  if(!raw || typeof raw.gear!=='object' || !raw.gear) throw Error('無效配裝');
  const b=empty(); b.name=String(raw.name||'').slice(0,40);
  for(const slot of Object.keys(slots)){
    const i=byId.get(raw.gear[slot]); if(i?.slot!==slot) continue;
    b.gear[slot]=i.id;
    b.gems[slot]=Array.from({length:i.sockets},(_,j)=>validGem(raw.gems?.[slot]?.[j])?raw.gems[slot][j]:'');
  }
  return b;
}
function link(b){return site+'#build='+encodeURIComponent(JSON.stringify(b))}
function parseLink(hash){return clean(JSON.parse(decodeURIComponent(hash.slice(7))))}
let build=clean({name:'火龍太刀',gear:Object.fromEntries(Object.keys(slots).map(s=>[s,'rathalos_'+(s==='weapon'?'longsword':s)]))});
let library=[], selected=[], editing=null, timer;
function notice(t){$('notice').textContent=t; clearTimeout(timer); timer=setTimeout(()=>$('notice').textContent='',5000)}
try{library=JSON.parse(localStorage.getItem('forge.library.v1')||'[]').map(clean)}catch{notice('無法讀取先前儲存的配裝')}
if(location.hash.startsWith('#build=')){try{build=parseLink(location.hash)}catch{notice('這個配裝連結無效')}}
function totals(b){
  const skills=Object.create(null), items=Object.values(b.gear).map(id=>byId.get(id)).filter(Boolean);
  for(const item of items){
    for(const [s,v] of Object.entries(item.skills)) skills[s]=(skills[s]||0)+v;
    for(const s of b.gems[item.slot]||[]) if(s)skills[s]=(skills[s]||0)+1;
  }
  const weapon=byId.get(b.gear.weapon);
  return {skills,attack:weapon?.attack||0,defense:items.reduce((n,i)=>n+(i.defense||0),0),element:weapon?.element||'—',affinity:weapon?.affinity||'—'};
}
const series = i => i.id.split('_')[0];
const weaponType = i => types[i.id.split('_').pop()];
function thumb(item){
  if(!item)return '<span class="thumb vacant" aria-hidden="true">＋</span>';
  const key=series(item);
  return key==='ore'?'<span class="thumb mineral" aria-hidden="true">◆</span>':'<span class="thumb"><img src="./images/'+key+'.webp" alt=""></span>';
}
function itemInfo(item){
  return [atlas.monsters[series(item)],item.slot==='weapon'?weaponType(item):Object.keys(item.skills).join('、')].filter(Boolean).join(' · ');
}
function draw(){
  $('equipment').innerHTML=Object.entries(slots).map(([slot,title])=>{
    const i=byId.get(build.gear[slot]);
    const gems=Array.from({length:i?.sockets||0},(_,j)=>{
      const gem=build.gems[slot]?.[j];
      return '<button class="socket" id="gem-'+slot+'-'+j+'" data-gem="'+slot+'" data-pos="'+j+'" aria-haspopup="dialog" aria-label="'+title+'漂流技能 '+(j+1)+'：'+esc(gem||'未鑲嵌')+'"><i>◇</i>'+esc(gem||'鑲嵌技能')+'</button>';
    }).join('');
    return '<div class="piece"><button class="gear-pick" id="pick-'+slot+'" data-slot="'+slot+'" aria-haspopup="dialog">'+thumb(i)+'<span class="gear-copy"><small>'+title+(i?' ／ '+esc(atlas.monsters[series(i)]):'')+'</small><strong>'+esc(i?.name||'選擇裝備')+'</strong></span><span class="chevron">⌄</span></button><div class="gear-tools">'+gems+(i?'<a class="guide" href="'+esc(i.source)+'" target="_blank" rel="noopener" aria-label="'+esc(i.name)+'官方圖鑑">圖鑑 ↗</a>':'')+'</div></div>';
  }).join('');
  const weapon=byId.get(build.gear.weapon);
  $('summary-weapon').innerHTML=thumb(weapon)+'<div><small>'+esc(weapon?weaponType(weapon):'武器')+'</small><strong>'+esc(weapon?.name||'尚未選擇武器')+'</strong></div>';
  const t=totals(build);
  $('stats').innerHTML='<div class="statgrid">'+[['武器基礎攻擊',t.attack],['裝備防禦',t.defense],['武器屬性值',t.element],['基礎會心率',t.affinity]].map(([k,v])=>'<div><small>'+k+'</small><b>'+esc(v)+'</b></div>').join('')+'</div>';
  $('skills').innerHTML=Object.entries(t.skills).sort((a,b)=>b[1]-a[1]).map(([s,v])=>'<div class="skill"><span>'+esc(s)+'</span><b>'+v+' 點</b></div>').join('')||'<p>裝備後即會顯示技能點數。</p>';
  $('name').value=build.name;$('count').textContent=library.length;
}
let picking=null;
const dialog=$('picker');
function showPicker(slot,pos){
  picking={slot,pos};
  const gem=pos!==null;
  $('picker-title').textContent=gem?slots[slot]+' · 選擇漂流技能':'選擇'+slots[slot];
  $('query').value='';
  $('query').placeholder=gem?'搜尋技能或輸入自訂名稱':'搜尋魔物、裝備或技能';
  const filters=gem?[...new Set(Object.values(atlas.skills).flat())]:slot==='weapon'?Object.values(types):Object.values(atlas.monsters);
  $('filter').innerHTML=option('',gem?'所有漂流石':slot==='weapon'?'所有武器類型':'所有系列','')+filters.map(v=>option(v,v,'')).join('');
  $('unequip').textContent=gem?'移除鑲嵌':'卸下裝備';
  updateChoices();dialog.showModal();$('query').focus();
}
function updateChoices(){
  const {slot,pos}=picking,gem=pos!==null,q=$('query').value.trim().toLowerCase(),filter=$('filter').value;
  const current=gem?build.gems[slot]?.[pos]:build.gear[slot];
  const options=gem?stones.filter(s=>(!filter||atlas.skills[s]?.includes(filter))&&s.toLowerCase().includes(q)).map(s=>({id:s,title:s,subtitle:(atlas.skills[s]||[]).join('、'),icon:'<span class="crystal">◇</span>'})):
    catalog.filter(i=>i.slot===slot&&(!filter||(slot==='weapon'?weaponType(i):atlas.monsters[series(i)])===filter)&&(i.name+' '+itemInfo(i)+' '+Object.keys(i.skills).join(' ')).toLowerCase().includes(q)).map(i=>({id:i.id,title:i.name,subtitle:itemInfo(i),icon:thumb(i)}));
  const custom=$('query').value.trim();
  if(gem && validGem(custom) && !stones.includes(custom))options.push({id:custom,title:custom,subtitle:'使用自訂技能名稱',icon:'<span class="crystal">＋</span>'});
  $('choices').innerHTML=options.map(v=>'<button class="choice" data-value="'+esc(v.id)+'" aria-pressed="'+(current===v.id)+'">'+v.icon+'<span><strong>'+esc(v.title)+'</strong><small>'+esc(v.subtitle)+'</small></span>'+(current===v.id?'<b>✓</b>':'')+'</button>').join('')||'<p class="empty">沒有符合的選項，試試其他關鍵字。</p>';
  $('results').textContent=options.length+' 個選項';
}
function choose(value){
  const {slot,pos}=picking;
  if(pos===null){
    if(value!==build.gear[slot])delete build.gems[slot];
    if(value)build.gear[slot]=value;else delete build.gear[slot];
  }else{build.gems[slot]||=[];build.gems[slot][pos]=value}
  dialog.close();draw();
  $(pos===null?'pick-'+slot:'gem-'+slot+'-'+pos).focus();
}
$('equipment').onclick=e=>{
  const btn=e.target.closest('button');
  if(btn?.dataset.slot)showPicker(btn.dataset.slot,null);
  if(btn?.dataset.gem)showPicker(btn.dataset.gem,Number(btn.dataset.pos));
};
$('query').oninput=updateChoices;
$('filter').onchange=updateChoices;
$('close-picker').onclick=()=>dialog.close();
$('unequip').onclick=()=>choose('');
$('choices').onclick=e=>{const btn=e.target.closest('[data-value]');if(btn)choose(btn.dataset.value)};
$('name').oninput=e=>build.name=e.target.value;
const goalRows = [0, 1];
function goalRow(index) {
  const title = index === 0 ? '主要技能' : '第二優先技能';
  const points = [1, 2, 3, 4, 5].map(n =>
    `<label><input type="radio" name="points${index}" value="${n}" ${n === 3 ? 'checked' : ''}><span>${n}</span></label>`
  ).join('');
  return `<section class="target" id="target${index}" ${index ? 'hidden' : ''}>
    <div class="target-head"><label for="goal${index}">${title}</label>
    ${index ? '<button id="remove-goal" type="button">移除</button>' : ''}</div>
    <input id="goal${index}" class="skill-search" type="search" autocomplete="off" placeholder="輸入技能關鍵字，例如「火」">
    <div id="matches${index}" class="matches" aria-label="符合的技能"></div>
    <fieldset class="point-control"><legend>${title}目標點數</legend><span aria-hidden="true">目標點數</span>${points}</fieldset>
  </section>`;
}
$('goals').innerHTML = goalRows.map(goalRow).join('') + '<button id="add-goal" type="button">＋ 加入第二個技能</button>';
function renderMatches(index) {
  const query = $('goal'+index).value.trim().toLocaleLowerCase();
  const other = $('target1').hidden ? '' : $('goal'+(1-index)).value.trim();
  const candidates = query ? allSkills.filter(skill => skill.toLocaleLowerCase().includes(query)) : ['攻擊','看破','連擊','弱點特效'];
  const matches = candidates.filter(skill => skill !== other);
  $('matches'+index).innerHTML = matches.length ? matches.map(skill =>
    `<button type="button" data-skill="${esc(skill)}" aria-pressed="${skill === query}">${esc(skill)}</button>`
  ).join('') : '<span role="status">找不到相符技能，請換個關鍵字。</span>';
}
function refreshGoals() {
  for (const index of goalRows) renderMatches(index);
}
for (const index of goalRows) {
  const input = $('goal'+index);
  const results = $('matches'+index);
  function pick(skill) {
    input.value = skill;
    refreshGoals();
    input.focus();
    input.select();
  }
  input.oninput = refreshGoals;
  input.onkeydown = event => {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) return;
    const matches = results.querySelectorAll('button');
    if (matches.length === 1) { event.preventDefault(); pick(matches[0].dataset.skill); }
  };
  results.onclick = event => {
    const button = event.target.closest('[data-skill]');
    if (button) pick(button.dataset.skill);
  };
}
$('add-goal').onclick = () => {
  $('target1').hidden = false;
  $('add-goal').hidden = true;
  refreshGoals();
  $('goal1').focus();
};
$('remove-goal').onclick = () => {
  $('goal1').value = '';
  $('target1').hidden = true;
  $('add-goal').hidden = false;
  refreshGoals();
  $('add-goal').focus();
};
refreshGoals();
function optimize(){
  const goals = [];
  for (const index of goalRows) {
    if ($('target'+index).hidden) continue;
    const input = $('goal'+index);
    const skill = input.value.trim();
    if (!allSkills.includes(skill) || goals.some(goal => goal.s === skill)) {
      notice('請從搜尋結果選擇' + (index ? '另一個技能' : '主要技能'));
      input.focus();
      return;
    }
    goals.push({s:skill, n:Number(document.querySelector('input[name="points'+index+'"]:checked').value)});
  }

  const base=empty();base.name=build.name;if(build.gear.weapon)base.gear.weapon=build.gear.weapon;
  let states=[base];
  const score=b=>{const t=totals(b);return goals.map(g=>Math.min(g.n,t.skills[g.s]||0))};
  for(const slot of Object.keys(slots).slice(1)){
    const next=new Map(),fixed=$('lock').checked&&build.gear[slot];
    for(const b of states)for(const i of (fixed?[byId.get(fixed)]:catalog.filter(x=>x.slot===slot))){
      let gems=[[]];
      if(fixed)gems=[build.gems[slot]||[]];
      else if($('stones').checked)for(let j=0;j<i.sockets;j++)gems=gems.flatMap(g=>['',...goals.map(v=>v.s).filter(s=>stones.includes(s))].map(s=>[...g,s]));
      for(const g of gems){
        const v={...b,gear:{...b.gear,[slot]:i.id},gems:{...b.gems,[slot]:g}};
        const key=score(v).join(','),old=next.get(key);
        if(!old || totals(v).defense>totals(old).defense)next.set(key,v);
      }
    }states=[...next.values()];
  }
  const weight=b=>score(b).reduce((v,n)=>v*6+n,0);
  states.sort((a,b)=>weight(b)-weight(a)||totals(b).defense-totals(a).defense);
  build=states[0];draw();notice(goals.map((g,j)=>g.s+' '+score(build)[j]+'/'+g.n).join('　'));
}
$('opt').onclick=optimize;
function persist(next){try{localStorage.setItem('forge.library.v1',JSON.stringify(next));library=next;return true}catch{notice('瀏覽器無法儲存，請改用分享連結備份');return false}}
$('save').onclick=()=>{
  if(!build.name.trim()){notice('請先輸入配裝名稱');$('name').focus();return}
  const next=[...library],idx=editing??next.length;next[idx]=clean(build);
  if(persist(next)){editing=idx;draw();notice('已儲存「'+build.name+'」')}
};
$('share').onclick=async()=>{try{await navigator.clipboard.writeText(link(build));notice('已複製分享連結')}catch{window.prompt('請複製配裝連結',link(build))}};
$('post').onclick=()=>{window.open('https://github.com/'+repo+'/issues/new?'+new URLSearchParams({title:'[配裝] '+(build.name||'我的配裝'),body:link(build)+'\n\n狩獵心得：\n'}),'_blank','noopener')};
function tab(id){for(const t of ['forge','saved','hall'])$(t).hidden=t!==id;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.tab===id)));if(id==='saved')drawLibrary();if(id==='hall')loadHall()}
document.querySelector('nav').onclick=e=>{const b=e.target.closest('[data-tab]');if(b)tab(b.dataset.tab)};
$('new').onclick=()=>{editing=null;build=empty();draw();tab('forge')};
function drawLibrary(){
  $('library').innerHTML=library.map((b,j)=>'<div class="entry"><input type="checkbox" aria-label="比較 '+esc(b.name)+'" data-compare="'+j+'" '+(selected.includes(j)?'checked':'')+'><span>'+esc(b.name)+'</span><button data-load="'+j+'">編輯</button><button data-del="'+j+'">刪除</button></div>').join('')||'<p>還沒有儲存的配裝。</p>';
  const rows=selected.map(j=>library[j]);$('comparison').innerHTML='';
  if(rows.length!==2)return;
  const summary=rows.map(totals);
  const tr=(label,values)=>'<tr><th>'+esc(label)+'</th>'+values.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>';
  $('comparison').innerHTML='<table class="compare"><caption>配裝比較</caption>'+tr('配裝',rows.map(b=>b.name))+Object.entries(slots).map(([s,t])=>tr(t,rows.map(b=>byId.get(b.gear[s])?.name||'—'))).join('')+tr('基礎攻擊',summary.map(v=>v.attack))+tr('防禦',summary.map(v=>v.defense))+Object.keys({...summary[0].skills,...summary[1].skills}).map(s=>tr(s,summary.map(v=>v.skills[s]||0))).join('')+'</table>';
}
$('library').onclick=e=>{
  const {load,del,compare}=e.target.dataset;
  if(load!==undefined){editing=+load;build=clean(library[editing]);draw();tab('forge')}
  if(del!==undefined&&confirm('刪除這套已儲存的配裝？')&&persist(library.filter((_,j)=>j!==+del))){selected=[];editing=null;draw();drawLibrary()}
  if(compare!==undefined){selected=selected.filter(j=>j!==+compare);if(e.target.checked)selected=[...selected.slice(-1),+compare];drawLibrary()}
};
async function loadHall(){
  $('ranking').textContent='正在讀取公開配裝…';
  try{
    const res=await fetch('https://api.github.com/repos/'+repo+'/issues?state=open&per_page=100');if(!res.ok)throw Error();
    const entries=[];
    for(const issue of await res.json()){
      if(issue.pull_request)continue;
      const url=(issue.body||'').split(/\s+/).find(s=>s.startsWith(site+'#build='));
      if(!url)continue;
      try{entries.push({b:parseLink(new URL(url).hash),votes:issue.reactions?.['+1']||0,id:issue.number})}catch{}
    }
    entries.sort((a,b)=>b.votes-a.votes||b.id-a.id);
    $('ranking').innerHTML=entries.slice(0,20).map((v,j)=>'<div class="entry"><strong>#'+(j+1)+'</strong><span>'+esc(v.b.name||'未命名配裝')+' · 👍 '+v.votes+'</span><a href="https://github.com/'+repo+'/issues/'+Number(v.id)+'">討論</a><button data-rank="'+j+'">套用</button></div>').join('')||'還沒有公開配裝。從配裝摘要點選「發表至集會所」即可分享第一套。';
    $('ranking').onclick=e=>{if(e.target.dataset.rank!==undefined){build=clean(entries[+e.target.dataset.rank].b);editing=null;draw();tab('forge')}};
  }catch{$('ranking').textContent='暫時無法取得排行，可從「全部討論」直接查看。'}
}
draw();tab('forge');
