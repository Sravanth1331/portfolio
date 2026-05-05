/* ─── Direction A: Refined HUD ─── */
(() => {

// ═══ CLOCK ═══
const clockEl = document.getElementById('clock');
function tickClock(){ const d=new Date(); clockEl.textContent = d.toLocaleTimeString('en-US',{hour12:false}); }
setInterval(tickClock,1000); tickClock();

// ═══ THEME ACCENT ═══
const THEME_ACCENT = (typeof window.__THEME_ACCENT_HEX === 'number') ? window.__THEME_ACCENT_HEX : 0x5fe3ff;

// ═══ THREE.JS BACKDROP ═══
let scene, camera, renderer, points, sphere, mat, wmat;
function initBg(){
  const canvas = document.getElementById('bg3d');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, .1, 200);
  camera.position.z = 30;
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));

  // particle field
  const geo = new THREE.BufferGeometry();
  const cnt = 1800;
  const pos = new Float32Array(cnt*3);
  for(let i=0;i<cnt*3;i++) pos[i] = (Math.random()-.5)*100;
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  mat = new THREE.PointsMaterial({color:THEME_ACCENT, size:.06, transparent:true, opacity:.5});
  points = new THREE.Points(geo, mat);
  scene.add(points);

  // wireframe icosahedron
  const igeo = new THREE.IcosahedronGeometry(9, 1);
  wmat = new THREE.LineBasicMaterial({color:THEME_ACCENT, transparent:true, opacity:.06});
  const edges = new THREE.EdgesGeometry(igeo);
  sphere = new THREE.LineSegments(edges, wmat);
  scene.add(sphere);

  addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  let mx=0, my=0;
  addEventListener('mousemove', e=>{ mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2; });
  function loop(){
    requestAnimationFrame(loop);
    points.rotation.y += .0004;
    points.rotation.x += .0001;
    sphere.rotation.y += .0015;
    sphere.rotation.x += .0007;
    const sp = scrollY/(document.documentElement.scrollHeight-innerHeight || 1);
    camera.position.z = 30 - sp*12;
    camera.position.x += (mx*2 - camera.position.x)*.025;
    camera.position.y += (-my*2 - camera.position.y)*.025;
    camera.lookAt(scene.position);
    mat.opacity = .5 - .25*sp;
    wmat.opacity = .06 + .04*sp;
    renderer.render(scene, camera);
  }
  loop();
}
initBg();

// ═══ BOOT ═══
const boot = document.getElementById('boot');
const bootLog = document.getElementById('bootLog');
const bootSkip = document.getElementById('bootSkip');
const bootLines = ['> initializing systems…','> loading neural arch…','> handshake complete.'];
let bootDone = false;
bootLines.forEach((m,i)=>setTimeout(()=>{ if(!bootDone) bootLog.textContent = m; }, i*330));
function endBoot(){
  if(bootDone) return; bootDone = true;
  boot.classList.add('gone');
  setTimeout(()=>{ boot.style.display='none'; showInvite(); }, 500);
}
setTimeout(endBoot, 1300);
bootSkip.onclick = endBoot;

// ═══ INVITE → JARVIS PANEL ═══
const invite = document.getElementById('invite');
const jarvis = document.getElementById('jarvis');
const jarvisTxt = document.getElementById('jarvisTxt');
const wave = document.getElementById('wave');
function showInvite(){ setTimeout(()=>invite.classList.add('show'), 700); }
let jarvisMode = false;
document.getElementById('inviteYes').onclick = ()=>{
  invite.classList.remove('show');
  jarvisMode = true;
  jarvis.classList.add('on');
  beep();
  setTimeout(()=>jarvisSpeak('hero'), 400);
};
document.getElementById('inviteNo').onclick = ()=>{
  invite.classList.remove('show');
  // still show jarvis panel as ambient companion (text only, no speech)
  jarvis.classList.add('on');
  jarvisTxt.innerHTML = "Manual mode. Scroll at your own pace.";
};
document.getElementById('closeJarvis').onclick = ()=>{ jarvis.classList.remove('on'); stopSpeak(); };

// ═══ AUDIO (subtle cues) ═══
let audioCtx;
function getAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended') audioCtx.resume(); return audioCtx; }
function tone(f,d,v){ try{ const a=getAudio(); const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(v||.025, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime+d); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+d); }catch(e){} }
function beep(){ tone(880,.05,.02); setTimeout(()=>tone(1320,.05,.015),60); }
function tick(){ tone(1500,.02,.008); }
function confirm2(){ tone(440,.04,.012); setTimeout(()=>tone(880,.07,.01),80); }

// ═══ JARVIS VOICE ═══
const synth = window.speechSynthesis;
let bestVoice = null;
function pickVoice(){
  if(!synth) return;
  const v = synth.getVoices(); if(!v.length) return;
  const tries = [
    x=>/Microsoft Ryan/.test(x.name),
    x=>/Google UK English Male/.test(x.name),
    x=>x.name==='Daniel',
    x=>x.lang==='en-GB' && !/female/i.test(x.name),
    x=>/^en/.test(x.lang) && !/female/i.test(x.name)
  ];
  for(const f of tries){ const r=v.find(f); if(r){ bestVoice=r; break; } }
  if(!bestVoice) bestVoice = v.find(x=>/^en/.test(x.lang)) || v[0];
}
if(synth){ synth.onvoiceschanged = pickVoice; pickVoice(); }

const NAR = {
  hero:    { d:"Welcome. I'll guide you through Sravanth's <span class='hl'>AI systems</span>.", p:["Welcome.","I'll guide you through Sravanth's portfolio.","He builds production AI systems.","Serving real enterprise clients."] },
  about:   { d:"<span class='hl'>4+ years</span>. LLM microservices. RAG. Voice agents.", p:["System profile loaded.","Four years of production experience.","LLM microservices.","Multi-tenant architecture."] },
  rag:     { d:"<span class='hl'>Live RAG demo.</span> Type a question. Watch retrieval.", p:["Live retrieval-augmented-generation demo.","Type a question.","Watch each step of the pipeline.","Real production timings."] },
  featured:{ d:"Primary system: <span class='hl'>multi-channel AI</span>. 10+ enterprise clients.", p:["Featured system.","Multi-channel AI for property management.","Voice, email, S-M-S, WhatsApp, and chat.","Ten plus enterprise clients."] },
  arch:    { d:"<span class='hl'>Live topology.</span> Drag to orbit the architecture.", p:["System architecture.","Drag to rotate.","Click any node to inspect.","Twelve services across five regions."] },
  exp:     { d:"Every deployment ships <span class='hl'>hard metrics</span>.", p:["Mission log.","Every role shipped measurable outcomes.","Forty percent call reduction.","Two million in annual savings."] },
  research:{ d:"<span class='hl'>3.31x cuSPARSE.</span> Healthcare AI. Multimodal models.", p:["Research database.","GPU acceleration for hypergraph neural nets.","Healthcare and multimodal models."] },
  ama:     { d:"<span class='hl'>Ask me anything.</span> Powered by Claude.", p:["Ask anything you want.","About projects, hiring, or research.","Powered by Claude."] },
  contact: { d:"Available for <span class='hl'>AI Engineer</span> roles.", p:["Review complete.","Available for AI Engineer roles.","Recommend connecting."] },
};

let speaking = false, voiceOn = true, currentSpeechKey = null;
function stopSpeak(){ if(synth) synth.cancel(); speaking=false; wave.classList.remove('on'); jarvis.classList.remove('speaking'); }

function jarvisSpeak(key){
  if(!jarvisMode) return;
  const n = NAR[key]; if(!n) return;
  if(currentSpeechKey === key && speaking) return;
  currentSpeechKey = key;
  jarvisTxt.innerHTML = n.d;
  if(!voiceOn) return;
  if(!synth) return;
  stopSpeak();
  beep();
  setTimeout(()=>{
    let i = 0;
    speaking = true;
    function nx(){
      if(i >= n.p.length || !voiceOn || currentSpeechKey !== key){
        speaking = false; wave.classList.remove('on'); jarvis.classList.remove('speaking');
        if(currentSpeechKey === key) confirm2();
        return;
      }
      wave.classList.add('on'); jarvis.classList.add('speaking');
      const u = new SpeechSynthesisUtterance(n.p[i]);
      u.rate = 1.06; u.pitch = .65; u.volume = .9;
      if(bestVoice) u.voice = bestVoice;
      u.onend = ()=>{ wave.classList.remove('on'); tick(); i++; setTimeout(nx, 220); };
      u.onerror = ()=>{ i++; nx(); };
      synth.speak(u);
    }
    nx();
  }, 220);
}

document.getElementById('muteBtn').onclick = function(){
  voiceOn = !voiceOn;
  this.textContent = voiceOn ? '🔊' : '🔇';
  if(!voiceOn) stopSpeak();
};

// ═══ SCROLL OBSERVERS ═══
const sections = ['hero','about','rag','featured','arch','exp','research','ama','contact'];
const sectionToNarKey = {hero:'hero',about:'about',rag:'rag',featured:'featured',arch:'arch',exp:'exp',research:'research',ama:'ama',contact:'contact'};
const secNum = document.getElementById('secNum');
const secNav = document.getElementById('secNav');
sections.forEach((id,i)=>{
  const d = document.createElement('div');
  d.className = 'd';
  d.onclick = ()=>{ document.getElementById('s-'+id).scrollIntoView({behavior:'smooth'}); };
  secNav.appendChild(d);
});
const dots = secNav.querySelectorAll('.d');

const obs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const id = e.target.id.replace('s-','');
      const idx = sections.indexOf(id);
      if(idx >= 0){
        secNum.textContent = String(idx+1).padStart(2,'0');
        dots.forEach((d,i)=>d.classList.toggle('on', i===idx));
        const key = sectionToNarKey[id];
        if(key && jarvisMode){ jarvisSpeak(key); }
        else if(key && NAR[key] && jarvis.classList.contains('on') && !jarvisMode){
          jarvisTxt.innerHTML = NAR[key].d;
        }
      }
    }
  });
}, {threshold:.4});
sections.forEach(id=>{ const el=document.getElementById('s-'+id); if(el) obs.observe(el); });

// ═══ REVEAL ANIMATIONS ═══
const revealObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); revealObs.unobserve(e.target); } });
}, {threshold:.15});
document.querySelectorAll('.reveal, .reveal-l').forEach(el=>revealObs.observe(el));

// ═══ PROGRESS BAR ═══
addEventListener('scroll', ()=>{
  const sp = scrollY/(document.documentElement.scrollHeight-innerHeight || 1);
  document.getElementById('progressBar').style.width = (sp*100)+'%';
});

// ═══ EMAIL POPUP ═══
const emailPop = document.getElementById('emailPop');
document.querySelectorAll('.email-trigger').forEach(a=>{
  a.addEventListener('click', e=>{ e.preventDefault(); emailPop.classList.add('show'); beep(); });
});
document.getElementById('emailCopy').onclick = ()=>{
  navigator.clipboard.writeText('sravanththatavarthi@gmail.com').then(()=>{
    document.getElementById('copied').classList.add('show');
    setTimeout(()=>document.getElementById('copied').classList.remove('show'), 2000);
  });
};
document.getElementById('emailOpen').onclick = ()=>{ window.location.href = 'mailto:sravanththatavarthi@gmail.com'; };
document.getElementById('emailClose').onclick = ()=>emailPop.classList.remove('show');
emailPop.addEventListener('click', e=>{ if(e.target===emailPop) emailPop.classList.remove('show'); });

// ═══ TIMELINE EXPAND ═══
document.querySelectorAll('.tl-item').forEach(item=>{
  item.addEventListener('click', e=>{
    item.classList.toggle('expanded');
    const t = item.querySelector('.tl-toggle');
    if(t) t.firstChild.nodeValue = item.classList.contains('expanded') ? 'COLLAPSE ' : 'EXPAND ';
    tick();
  });
});

// ═══ METRICS COUNTER ═══
const metricVals = [['m1',40,1500,''],['m2',30,1200,''],['m3',60,1800,''],['m4',10,1000,''],['m5',3,800,''],['m6',85,2000,'']];
let metricsAnim = false;
const metricObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting && !metricsAnim){
    metricsAnim = true;
    metricVals.forEach(([id,target,dur])=>{
      const el = document.getElementById(id); if(!el) return;
      const t0 = performance.now();
      function step(){
        const p = Math.min((performance.now()-t0)/dur, 1);
        const e = 1 - Math.pow(1-p, 3);
        el.textContent = Math.floor(target*e);
        if(p<1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    });
    metricObs.disconnect();
  } });
}, {threshold:.4});
const metricsEl = document.getElementById('metrics');
if(metricsEl) metricObs.observe(metricsEl);

// ═══════════════════════════════════════════════
// RAG DEMO
// ═══════════════════════════════════════════════
const ragInput = document.getElementById('ragInput');
const ragGo = document.getElementById('ragGo');
const ragResult = document.getElementById('ragResult');
const ragResultBody = document.getElementById('ragResultBody');
const ragSteps = [1,2,3,4,5,6].map(i=>document.getElementById('step-'+i));

document.querySelectorAll('.rag-prompts .p').forEach(b=>{
  b.onclick = ()=>{ ragInput.value = b.dataset.q; ragInput.focus(); };
});

const ragAnswers = {
  default: { intent:'leasing', answer:`Based on the property handbook, the leasing office is open <em>Saturdays from 10:00 AM to 4:00 PM</em>. For after-hours assistance you can reach the on-call team at extension 8.` },
  saturday:{ intent:'leasing', answer:`The leasing office is open <em>Saturdays 10 AM – 4 PM</em>. Sundays are closed. After-hours: dial extension 8 for the on-call team.` },
  garbage: { intent:'maintenance', answer:`If your garbage disposal is humming but not grinding, it's likely jammed. <em>Turn it off at the wall switch</em>, then use the hex key on the underside to free the impellers. If that doesn't resolve it, I can open a maintenance ticket — would you like me to?` },
  rent:    { intent:'billing', answer:`Rent is due on the <em>1st of each month</em>. There's a 5-day grace period; after that, a <em>$50 late fee</em> applies. You can pay through the resident portal or set up autopay.` }
};
function pickAnswer(q){
  q = (q||'').toLowerCase();
  if(/garbage|disposal|maintenance|repair/.test(q)) return ragAnswers.garbage;
  if(/rent|late|fee|payment|bill/.test(q)) return ragAnswers.rent;
  if(/saturday|hour|open|leasing|office/.test(q)) return ragAnswers.saturday;
  return ragAnswers.default;
}

let ragRunning = false;
async function runRag(){
  if(ragRunning) return;
  const q = ragInput.value.trim() || 'What time does the leasing office open on Saturdays?';
  ragRunning = true;
  ragGo.disabled = true;
  ragGo.textContent = 'RUNNING…';
  ragResult.classList.remove('show');
  ragResultBody.innerHTML = '';
  ragSteps.forEach(s=>{ s.classList.remove('active','done'); s.querySelector('.ic').classList.remove('spin'); });

  const stepDurations = [380, 420, 380, 600, 1100, 320];
  const stepUpdates = [
    s=>{ const a=pickAnswer(q).intent; s.querySelector('.meta').innerHTML = `Classified as <span class="mk">${a.toUpperCase()}</span> · 12ms`; },
    null,
    s=>{ s.querySelector('.meta').innerHTML = `Qdrant · top-20 from <span class="mk">5,247 docs</span> · 24ms`; },
    s=>{ s.querySelector('.meta').innerHTML = `BGE-reranker · top-4 selected · 89ms`; },
    s=>{ s.querySelector('.meta').innerHTML = `GPT-4o-mini · streaming response · 1.4s`; },
    null
  ];

  for(let i=0;i<ragSteps.length;i++){
    const s = ragSteps[i];
    s.classList.add('active');
    s.querySelector('.ic').classList.add('spin');
    if(stepUpdates[i]) stepUpdates[i](s);
    tick();
    await new Promise(r=>setTimeout(r, stepDurations[i]));
    s.classList.remove('active');
    s.querySelector('.ic').classList.add('spin'); // no-op cleanup
    s.querySelector('.ic').classList.remove('spin');
    s.classList.add('done');
  }

  // reveal answer
  const ans = pickAnswer(q);
  confirm2();
  ragResult.classList.add('show');
  // type out
  ragResultBody.innerHTML = '';
  const html = ans.answer;
  let i = 0;
  function typer(){
    if(i >= html.length) return;
    // skip html tags as a chunk
    if(html[i] === '<'){ const end = html.indexOf('>', i)+1; ragResultBody.innerHTML += html.slice(i,end); i = end; }
    else { ragResultBody.innerHTML += html[i]; i++; }
    setTimeout(typer, 8);
  }
  typer();

  ragGo.disabled = false;
  ragGo.textContent = 'RUN PIPELINE →';
  ragRunning = false;
}
ragGo.onclick = runRag;
ragInput.addEventListener('keydown', e=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); runRag(); } });

// ═══════════════════════════════════════════════
// PIPELINE INTERACTIVE
// ═══════════════════════════════════════════════
const pipelineDetails = {
  query:    { ttl:'QUERY · INPUT LAYER', desc:'Tenant input arrives via voice (Twilio), webhook (SMS/WhatsApp), inbound email (IMAP), or live chat. <span class="mk">Normalized into a unified message envelope</span> with tenant ID, channel, conversation context, and timestamp.' },
  router:   { ttl:'ROUTER · INTENT CLASSIFIER', desc:'Lightweight fine-tuned classifier sorts traffic into <span class="mk">leasing, maintenance, billing, or smalltalk</span>. Misroutes drop below 2% in production. Output picks which agent + tools get loaded.' },
  rag:      { ttl:'RAG · RETRIEVAL', desc:'Embedding via <span class="mk">text-embedding-3-small</span> → Qdrant vector search across 5,247 docs → BGE reranker top-4. Per-tenant filtering enforced at the index level for multi-tenant safety.' },
  agent:    { ttl:'AGENT · LLM + TOOLS', desc:'LangGraph agent with tools: <span class="mk">create_ticket, lookup_lease, escalate_human, schedule_callback</span>. GPT-4o-mini for general traffic, GPT-4o for billing escalations.' },
  voice:    { ttl:'TTS · POLLY + SSML', desc:'Hand-tuned <span class="mk">SSML prosody</span> for natural pauses and emphasis. Voice cloning per-client brand. 89ms median synthesis latency, streamed to caller.' },
  delivery: { ttl:'DELIVERY · MULTI-CHANNEL', desc:'Outbound through Twilio (voice/SMS), WhatsApp Business API, SendGrid (email), and the in-app chat socket. <span class="mk">Same message envelope</span> across all channels for full audit trail.' }
};
const pdetail = document.getElementById('pdetail');
document.querySelectorAll('.pnode').forEach(n=>{
  n.onclick = ()=>{
    document.querySelectorAll('.pnode').forEach(x=>x.classList.remove('active'));
    n.classList.add('active');
    const id = n.dataset.id;
    const d = pipelineDetails[id];
    if(d){
      pdetail.innerHTML = `<div class="ttl">${d.ttl}</div><div class="desc">${d.desc}</div>`;
      tick();
    }
  };
});
document.querySelectorAll('.pch').forEach(c=>{
  c.onclick = ()=>{ c.classList.toggle('on'); tick(); };
});

// ═══════════════════════════════════════════════
// 3D ARCHITECTURE (orbit)
// ═══════════════════════════════════════════════
function initArch3D(){
  const canvas = document.getElementById('arch3d');
  const aScene = new THREE.Scene();
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  const aCam = new THREE.PerspectiveCamera(50, w/h, .1, 200);
  aCam.position.set(0, 4, 22);
  const aRen = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  aRen.setSize(w,h); aRen.setPixelRatio(Math.min(devicePixelRatio,2));

  // light
  aScene.add(new THREE.AmbientLight(0xffffff, .55));
  const dl = new THREE.DirectionalLight(THEME_ACCENT, .8); dl.position.set(5,10,5); aScene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffffff, .3); dl2.position.set(-5,-3,8); aScene.add(dl2);

  // services
  const services = [
    {n:'Voice',  c:0x7dd3fc, p:[-7, 3, 0],  type:'channel'},
    {n:'SMS',    c:0x7dd3fc, p:[-6, 0,-5],  type:'channel'},
    {n:'Email',  c:0x7dd3fc, p:[-7,-3, 0],  type:'channel'},
    {n:'WhatsApp', c:0x7dd3fc, p:[-6, 0, 5],type:'channel'},
    {n:'Chat',   c:0x7dd3fc, p:[-7, 0, 2],  type:'channel'},

    {n:'Router', c:THEME_ACCENT, p:[-2, 0, 0],  type:'core'},
    {n:'RAG',    c:THEME_ACCENT, p:[ 1, 2, 0],  type:'core'},
    {n:'Agent',  c:THEME_ACCENT, p:[ 1,-2, 0],  type:'core'},
    {n:'TTS',    c:THEME_ACCENT, p:[ 4, 0,-2],  type:'core'},

    {n:'Qdrant', c:0xfbbf24, p:[ 6, 4, 2],  type:'data'},
    {n:'Postgres',c:0xfbbf24,p:[ 6, 4,-2],  type:'data'},
    {n:'RAGAS',  c:0xa78bfa, p:[ 6,-4, 0],  type:'eval'},
  ];

  const nodeMeshes = [];
  services.forEach(s=>{
    const geo = new THREE.IcosahedronGeometry(.5, 0);
    const mat = new THREE.MeshPhongMaterial({color:s.c, emissive:s.c, emissiveIntensity:.35, flatShading:true, shininess:60});
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...s.p);
    m.userData = s;
    aScene.add(m);
    // wireframe outer
    const wf = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.7,0)), new THREE.LineBasicMaterial({color:s.c, transparent:true, opacity:.5}));
    wf.position.copy(m.position);
    aScene.add(wf);
    nodeMeshes.push({m, wf, base:[...s.p]});
  });

  // connections
  const conns = [
    [0,5],[1,5],[2,5],[3,5],[4,5], // channels → router
    [5,6],[5,7],                    // router → rag, agent
    [6,9],[6,10],                   // rag → qdrant, postgres
    [7,8],                          // agent → tts
    [7,11],[6,11]                   // → ragas
  ];
  const lineMat = new THREE.LineBasicMaterial({color:THEME_ACCENT, transparent:true, opacity:.18});
  conns.forEach(([a,b])=>{
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...services[a].p), new THREE.Vector3(...services[b].p)]);
    aScene.add(new THREE.Line(g, lineMat));
  });

  // controls — manual orbit
  let isDown=false, lx=0, ly=0, rotY=0, rotX=.1, rotYTarget=0, rotXTarget=.1, dist=22, distTarget=22;
  canvas.addEventListener('mousedown', e=>{ isDown=true; lx=e.clientX; ly=e.clientY; });
  addEventListener('mouseup', ()=>isDown=false);
  addEventListener('mousemove', e=>{
    if(!isDown) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    rotYTarget += dx*.008;
    rotXTarget = Math.max(-1, Math.min(1, rotXTarget + dy*.008));
    lx = e.clientX; ly = e.clientY;
  });
  canvas.addEventListener('wheel', e=>{ e.preventDefault(); distTarget = Math.max(12, Math.min(36, distTarget + e.deltaY*.02)); }, {passive:false});

  // touch
  canvas.addEventListener('touchstart', e=>{ if(e.touches.length===1){ isDown=true; lx=e.touches[0].clientX; ly=e.touches[0].clientY; } });
  canvas.addEventListener('touchmove', e=>{
    if(!isDown || e.touches.length!==1) return;
    const dx = e.touches[0].clientX - lx, dy = e.touches[0].clientY - ly;
    rotYTarget += dx*.008; rotXTarget = Math.max(-1, Math.min(1, rotXTarget + dy*.008));
    lx = e.touches[0].clientX; ly = e.touches[0].clientY;
    e.preventDefault();
  }, {passive:false});
  canvas.addEventListener('touchend', ()=>isDown=false);

  // click → inspect
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  canvas.addEventListener('click', e=>{
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left)/r.width)*2 - 1;
    ndc.y = -((e.clientY - r.top)/r.height)*2 + 1;
    ray.setFromCamera(ndc, aCam);
    const hits = ray.intersectObjects(nodeMeshes.map(n=>n.m));
    if(hits[0]){
      const s = hits[0].object.userData;
      document.getElementById('archStat').textContent = `INSPECTING · ${s.n.toUpperCase()} · ${s.type.toUpperCase()}`;
      tick();
    }
  });

  function loop(){
    requestAnimationFrame(loop);
    rotY += (rotYTarget - rotY)*.08;
    rotX += (rotXTarget - rotX)*.08;
    dist += (distTarget - dist)*.08;
    rotYTarget += .002; // slow auto-spin
    aCam.position.x = Math.sin(rotY)*Math.cos(rotX)*dist;
    aCam.position.y = Math.sin(rotX)*dist;
    aCam.position.z = Math.cos(rotY)*Math.cos(rotX)*dist;
    aCam.lookAt(0,0,0);
    nodeMeshes.forEach(({m,wf,base},i)=>{
      m.rotation.x += .005; m.rotation.y += .003;
      wf.rotation.x = m.rotation.x; wf.rotation.y = m.rotation.y;
      const t = performance.now()*.001;
      m.position.y = base[1] + Math.sin(t + i)*.1;
      wf.position.y = m.position.y;
    });
    aRen.render(aScene, aCam);
  }
  loop();

  // handle resize
  const ro = new ResizeObserver(()=>{
    const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
    aCam.aspect = w/h; aCam.updateProjectionMatrix();
    aRen.setSize(w,h);
  });
  ro.observe(canvas.parentElement);
}
// initialize on first scroll-into-view
const archIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting){ initArch3D(); archIO.disconnect(); } });
}, {threshold:.2});
const archShell = document.querySelector('.arch3d-shell');
if(archShell) archIO.observe(archShell);

// ═══════════════════════════════════════════════
// ASK ME ANYTHING (chatbot)
// ═══════════════════════════════════════════════
const amaMsgs = document.getElementById('amaMsgs');
const amaInput = document.getElementById('amaInput');
const amaSend = document.getElementById('amaSend');

const SRAVANTH_CONTEXT = `
You are Sravanth.bot, an AI assistant trained on Sravanth Thatavarthi's professional background.
Sravanth is an AI Engineer with 4+ years of production experience. Currently a Generative AI Engineer at LetQuickly (Illinois, since Oct 2025), where he architected a multi-channel AI platform (voice, SMS, email, WhatsApp, web chat) serving 10+ enterprise clients with 99.5% uptime.

Key achievements:
- Voice agent with AWS Polly + SSML reduced inbound calls by 40%
- RAG over 5,000+ documents cut tenant lookup from 4 hours to 30 seconds
- LLM email triage automated 60% of support replies
- SMS/WhatsApp campaigns hit 3x email open rates
- RAG faithfulness >85% on RAGAS evals

Stack: Python, FastAPI, LangChain, LangGraph, Qdrant, FAISS, OpenAI (GPT-4o, GPT-4o-mini), text-embedding-3-small, BGE rerankers, AWS, Docker, Postgres.

Prior roles:
- AI/ML Engineer at KGS Technology Group (Sep 2024 - Aug 2025): fraud model +35% accuracy, -28% false positives over 1.2M+ transactions/month, uncovered $500K+ in hidden fraud, $2M annual savings
- Teaching Assistant at Clemson University (Aug-Dec 2023): mentored 120+ students
- ML Engineer at Medico Healthcare (Aug 2020 - Oct 2021): 1M+ records, 98% data quality, HIPAA-compliant, 10+ diabetes-risk predictors
- Data Analyst at Techimax (May 2019 - Jun 2020): NLP chatbot 95% accuracy

Education: M.S. Computer Science, Clemson University (2023-2024). Coursework: Advanced ML, NLP, Deep Learning, GPU & HPC.
Certifications: AWS Solutions Architect, Google Data Analytics, IBM Data Science.

Research: HyperGEF (3.31x cuSPARSE on hypergraph NNs), brain MRI hearing prediction (CNN+RNN+SVM), multimodal sentiment (82.3% arousal / 89% valence on AffWild), cardiovascular disease prediction (XGBoost).

Located in Greater Chicago Area. Open to AI Engineer roles starting Q1 2026.
Contact: sravanththatavarthi@gmail.com, +1-864-765-6899, linkedin.com/in/sravanth13, letquickly.ai

When answering: be concise (2-4 sentences usually), warm but not sycophantic, technically specific, and refer to him as "Sravanth" or "he/him". If asked something off-topic, gently redirect to his work. Never invent facts not in this context — if you don't know, say so.
`;

let conversation = [];

function addMsg(role, text){
  const el = document.createElement('div');
  el.className = 'ama-msg ' + role;
  el.textContent = text;
  amaMsgs.appendChild(el);
  amaMsgs.scrollTop = amaMsgs.scrollHeight;
  return el;
}
function addTyping(){
  const el = document.createElement('div');
  el.className = 'ama-msg bot';
  el.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  amaMsgs.appendChild(el);
  amaMsgs.scrollTop = amaMsgs.scrollHeight;
  return el;
}

// Offline fallback — keyword-routed canned answers grounded in the same context
function offlineAnswer(q){
  const s = q.toLowerCase();
  if(/hire|why.*you|fit|candidate|recruit/.test(s))
    return "Three reasons: I've shipped real production AI (LetQuickly serves 10+ enterprise clients at 99.5% uptime, not a side project), every role has hard metrics behind it (40% call reduction, $2M annual savings, 3× open rates), and I care about the unglamorous parts — eval pipelines, observability, fallbacks. I'd rather be measured by what I ship than what I prompt.";
  if(/rag|retrieval|hallucin|ground/.test(s))
    return "The LetQuickly RAG stack: text-embedding-3-small → Qdrant (top-20) → BGE-reranker-v2 (top-4) → GPT-4o-mini with a strict grounded prompt. Hallucination control is layered — per-tenant index filtering, reranker confidence thresholds, an 'I don't know' fallback path, and async RAGAS evals on every response (>85% faithfulness avg). When the model can't ground a claim it routes to a human.";
  if(/eval|metric|test|monitor|observ/.test(s))
    return "Every response runs through async RAGAS scoring (faithfulness, relevance, groundedness) and gets logged with full retrieval traces. We sample 5% for human review weekly. For prompt changes we A/B against a held-out eval set of ~400 real tenant questions before promoting. Drift on any metric below threshold pages on call.";
  if(/letquickly|production|company/.test(s))
    return "LetQuickly is a multi-channel AI platform for property management — voice, SMS, email, WhatsApp, and chat all running through one pipeline. I architected the backend: intent router, RAG over 5,000+ docs, LangGraph agents with real tools (create_ticket, lookup_lease, schedule_callback). 10+ enterprise clients live, 99.5% uptime, multi-tenant from day one.";
  if(/voice|polly|tts|ssml/.test(s))
    return "Voice agent uses AWS Polly with hand-tuned SSML for prosody — natural pauses, emphasis, brand-specific voice cloning. 89ms median synthesis latency, streamed to the caller. Cut inbound calls by 40% in the first month of deployment.";
  if(/stack|tech|tool|language/.test(s))
    return "Python + FastAPI for services, LangChain/LangGraph for orchestration, Qdrant for vectors, Postgres for state, OpenAI for LLM (GPT-4o-mini default, GPT-4o for billing escalations), AWS for everything else. Docker + K8s deploys, GitHub Actions CI. RAGAS for eval, custom dashboards on top.";
  if(/research|paper|publish|hypergef/.test(s))
    return "Most cited: HyperGEF — a GPU framework for hypergraph neural nets I worked on at Clemson. Edge-split partitioning + workload-aware sparse formats, hit 3.31× over cuSPARSE and 3.99× over DGL on hypergraph convolutions. Also worked on multimodal sentiment (82.3% arousal on AffWild) and brain MRI hearing prediction.";
  if(/clemson|education|degree|school/.test(s))
    return "M.S. Computer Science at Clemson University, 2023–2024. Coursework focused on Advanced ML, NLP, Deep Learning, and GPU/HPC. Was a TA for the systems class — mentored 120+ students. AWS Solutions Architect, Google Data Analytics, and IBM Data Science certified on top.";
  if(/contact|reach|email|hiring|available/.test(s))
    return "Email is fastest: sravanththatavarthi@gmail.com — or +1-864-765-6899. LinkedIn: linkedin.com/in/sravanth13. Available Q1 2026 for AI Engineer roles, open to remote or Greater Chicago. Use the TRANSMIT button at the bottom of the page.";
  if(/fraud|kgs|finance/.test(s))
    return "At KGS Technology Group I built fraud detection on 1.2M+ transactions/month — model hit +35% accuracy and -28% false positives over the legacy rules engine, surfaced $500K+ in previously-hidden fraud, and the dashboards I shipped cut analyst turnaround from 5 days to 8 hours. ~$2M in annual operational savings.";
  if(/healthcare|medico|hipaa|medical/.test(s))
    return "At Medico Healthcare I built HIPAA-compliant pipelines over 1M+ records at 98% data quality, plus 10+ diabetes risk predictors trained on 500K records. The brain-MRI hearing-impairment work was a separate research thread at Clemson.";
  return "Good question. Sravanth's full background is on this page — scroll up for the production AI work at LetQuickly, the RAG demo, and the experience timeline. For anything specific, email him at sravanththatavarthi@gmail.com.";
}

async function askAma(q){
  if(!q || !q.trim()) return;
  amaSend.disabled = true;
  amaInput.disabled = true;
  addMsg('user', q);
  amaInput.value = '';
  conversation.push({role:'user', content:q});
  const typing = addTyping();
  tick();

  // Try Claude in either own window or top window (when site embedded in iframe host)
  let claudeApi = null;
  try { if(window.claude && typeof window.claude.complete === 'function') claudeApi = window.claude; } catch(e){}
  try { if(!claudeApi && window.parent && window.parent !== window && window.parent.claude && typeof window.parent.claude.complete === 'function') claudeApi = window.parent.claude; } catch(e){}
  try { if(!claudeApi && window.top && window.top !== window && window.top.claude && typeof window.top.claude.complete === 'function') claudeApi = window.top.claude; } catch(e){}

  let reply = null;
  if(claudeApi){
    try {
      const prompt = `${SRAVANTH_CONTEXT}\n\n---\n\nUser asks: ${q}\n\nReply as Sravanth.bot — 2-4 sentences, warm, technically specific. Never invent facts not in the context above.`;
      const resp = await Promise.race([
        claudeApi.complete(prompt),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), 12000))
      ]);
      reply = (typeof resp === 'string') ? resp : (resp && (resp.text || resp.message || resp.completion)) || null;
    } catch(err){ reply = null; }
  }

  if(!reply || !reply.trim()) reply = offlineAnswer(q);

  typing.remove();
  // type out for that "AI typing" feel
  const msgEl = addMsg('bot', '');
  let i = 0;
  await new Promise(done=>{
    function step(){
      if(i >= reply.length){ done(); return; }
      msgEl.textContent += reply[i++];
      amaMsgs.scrollTop = amaMsgs.scrollHeight;
      setTimeout(step, 12);
    }
    step();
  });
  conversation.push({role:'assistant', content:reply});
  confirm2();
  amaSend.disabled = false;
  amaInput.disabled = false;
  amaInput.focus();
}

amaSend.onclick = ()=>askAma(amaInput.value);
amaInput.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); askAma(amaInput.value); } });
document.querySelectorAll('.ama-suggest .s').forEach(b=>{
  b.onclick = ()=>askAma(b.dataset.q);
});

// ═══ smooth anchors ═══
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const h = a.getAttribute('href');
    if(h.length>1){ const el = document.querySelector(h); if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); } }
  });
});

})();
