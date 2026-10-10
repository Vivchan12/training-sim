let lenisInstance = null;   // set once Lenis is live; null means native scroll
const header = document.getElementById('siteHeader');
const progress = document.getElementById('scrollProgress');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

function onScroll(){
  const y = window.scrollY;
  header?.classList.toggle('scrolled', y > 20);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if(progress) progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

  const context = document.querySelector('.context-section');
  if(context && window.innerWidth > 780){
    const rect = context.getBoundingClientRect();
    const total = context.offsetHeight - window.innerHeight;
    const passed = Math.min(Math.max(-rect.top, 0), total);
    const ratio = total ? passed / total : 0;
    const idx = Math.min(3, Math.floor(ratio * 4));
    document.querySelectorAll('.context-step').forEach((el,i)=>el.classList.toggle('is-active', i <= idx));
  }
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

menu?.addEventListener('click', ()=>{
  const open = nav?.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>{
  nav?.classList.remove('open');
  menu?.setAttribute('aria-expanded','false');
}));

const io = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      if(entry.target.id === 'lensStage') document.getElementById('lensGraphic')?.classList.add('is-aligned');
      if(entry.target.id === 'prototypeTrack') entry.target.classList.add('is-running');
      if(entry.target.id === 'adoptionSystem') entry.target.classList.add('is-active');
    }
  });
},{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Cascade the children of a few rows instead of fading the whole block at
// once. The index drives a transition-delay in CSS, so the stagger costs no
// JavaScript per frame and disappears with the reduced-motion block.
document.querySelectorAll('.stagger').forEach(group => {
  Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
  io.observe(group);
});

// Hero rotating outcome line
const heroOutcome = document.getElementById('heroOutcome');
const heroOutcomePhrases = (window.__I18N__ && window.__I18N__.heroOutcomePhrases) || [
  'real business impact.',
  'meaningful progress.',
  'better ways of working.',
  'decisions backed by evidence.'
];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroOutcomeTimer = null;
let heroOutcomeIndex = 0;

function startHeroRotator(){
  if(!heroOutcome || heroOutcomeTimer) return;
  heroOutcomeTimer = window.setInterval(() => {
    heroOutcome.classList.add('is-changing');

    window.setTimeout(() => {
      heroOutcomeIndex = (heroOutcomeIndex + 1) % heroOutcomePhrases.length;
      heroOutcome.textContent = heroOutcomePhrases[heroOutcomeIndex];

      requestAnimationFrame(() => {
        requestAnimationFrame(() => heroOutcome.classList.remove('is-changing'));
      });
    }, 340);
  }, 3000);
}
function stopHeroRotator(){
  window.clearInterval(heroOutcomeTimer);
  heroOutcomeTimer = null;
  heroOutcome?.classList.remove('is-changing');
}

// The hero's two moving pieces — the background video and the rotating word —
// run on a timer with no natural end, so WCAG 2.2.2 wants a way to stop them.
// One control pauses both. A reduced-motion preference starts them stopped;
// CSS alone cannot do that, because `animation:none` does not pause a <video>.
const MOTION = (k, en) => ((window.__I18N__ && window.__I18N__.__msgs && window.__I18N__.__msgs[k]) || en);
const heroVideo = document.querySelector('.hero-video');
const motionToggle = document.getElementById('motionToggle');

function setMotion(playing){
  if(playing){ startHeroRotator(); heroVideo?.play().catch(()=>{}); }
  else { stopHeroRotator(); heroVideo?.pause(); }
  if(motionToggle){
    motionToggle.setAttribute('aria-pressed', String(!playing));
    const label = motionToggle.querySelector('span');
    const play = MOTION('a11y.play','Play'), pause = MOTION('a11y.pause','Pause');
    if(label) label.textContent = playing ? pause : play;
    motionToggle.setAttribute('aria-label', (playing ? pause : play) + ' background motion');
    motionToggle.querySelector('svg').innerHTML = playing
      ? '<rect x="0" y="0" width="2.6" height="10" rx="1"/><rect x="5.4" y="0" width="2.6" height="10" rx="1"/>'
      : '<path d="M0 0l8 5-8 5z"/>';
  }
}
setMotion(!prefersReducedMotion.matches);
motionToggle?.addEventListener('click', () => setMotion(!heroOutcomeTimer));
prefersReducedMotion.addEventListener?.('change', e => setMotion(!e.matches));

// Interactive questions before the build
const questionData = (window.__I18N__ && window.__I18N__.questionData) || {
  build: {
    kicker: 'TECHNOLOGY',
    main: '“Can we build it?”',
    title: 'Technical feasibility matters, but it is not the whole decision.',
    body: 'A solution can be technically possible and still be the wrong investment, the wrong workflow, or the wrong experience for the organisation.'
  },
  should: {
    kicker: 'INVESTMENT',
    main: '“Should we?”',
    title: 'Does this opportunity deserve more investment?',
    body: 'Before moving further, understand the importance of the problem, the likely value of changing it, the evidence already available, and what would have to be true for the next investment to make sense.'
  },
  problem: {
    kicker: 'BUSINESS',
    main: '“What problem matters?”',
    title: 'Start with something important enough to improve.',
    body: 'AI becomes meaningful when it addresses a real source of friction, missed opportunity, delay, cost, risk, or experience that the organisation genuinely cares about.'
  },
  people: {
    kicker: 'PEOPLE',
    main: '“Who is it for?”',
    title: 'Understand the people who will use, trust, manage, or experience the change.',
    body: 'Different roles see different parts of the problem. Bringing those perspectives together early helps reveal needs and constraints that technology alone cannot show.'
  },
  workflow: {
    kicker: 'WORKFLOW',
    main: '“How should the work change?”',
    title: 'AI rarely creates value simply by being added to an existing process.',
    body: 'The surrounding workflow, handoffs, decisions, responsibilities, and exceptions may also need to change for the technology to become genuinely useful.'
  },
  human: {
    kicker: 'HUMAN ROLE',
    main: '“What remains human?”',
    title: 'Not every part of the work should be handed to AI.',
    body: 'Judgement, accountability, empathy, creativity, context, and exception handling may remain human responsibilities. The important question is how people and AI should work together.'
  },
  adoption: {
    kicker: 'ADOPTION',
    main: '“Will people use it?”',
    title: 'A technically good solution still needs to fit real work.',
    body: 'People need to understand when to use it, why it helps, what they are accountable for, and how it fits the way work actually happens.'
  },
  success: {
    kicker: 'EVIDENCE',
    main: '“What would success look like?”',
    title: 'Define the signals that would tell you the change is genuinely helping.',
    body: 'Success might mean less friction, faster decisions, improved quality, stronger adoption, better experiences, or another meaningful business signal. Evidence gives the organisation a basis for what to do next.'
  }
};
const questionButtons = Array.from(document.querySelectorAll('.q[data-question]'));
const questionMain = document.getElementById('questionMain');
const questionKicker = document.getElementById('questionKicker');
const questionTitle = document.getElementById('questionTitle');
const questionBody = document.getElementById('questionBody');
const questionAnswer = document.querySelector('.question-answer');

function showQuestion(button){
  const data = button && questionData[button.dataset.question];
  if(!data) return;

  questionButtons.forEach(btn => {
    const active = btn === button;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
    btn.setAttribute('tabindex', active ? '0' : '-1');
  });

  if(questionMain) questionMain.textContent = data.main;
  if(questionKicker) questionKicker.textContent = data.kicker;
  if(questionTitle) questionTitle.textContent = data.title;
  if(questionBody) questionBody.textContent = data.body;

  if(questionAnswer){
    questionAnswer.classList.remove('is-changing');
    void questionAnswer.offsetWidth;
    questionAnswer.classList.add('is-changing');
  }
}

// "Before the build" as a scroll sequence. On a screen with room for it, the
// section becomes a long runway with the stage pinned, and the eight questions
// drop in one at a time as you scroll — each one bringing its own headline and
// answer with it. Half a screen of scrolling per question, on purpose: it is
// meant to be read, not watched.
//
// Scroll position is the only source of truth. Clicking a chip, or arrowing to
// it, moves the page to that question's place on the runway rather than
// changing the panel behind the scroll's back, so the two can never disagree.
// On a small screen, a short one, or with reduced motion, none of this engages
// and the section is the plain tab list it always was.
const seqSection = document.getElementById('before-build');
const seqStage = seqSection?.querySelector('.question-stage');
const seqWide = window.matchMedia('(min-width: 900px) and (min-height: 700px)');
const seqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const SEQ_VH_PER_STEP = 50;
let seqOn = false, seqIdx = -2, seqLock = 0;

function seqLayout(){
  if(!seqSection || !seqStage || !questionButtons.length) return;
  const headerH = header ? header.offsetHeight : 0;
  seqSection.style.setProperty('--seq-runway', `${questionButtons.length * SEQ_VH_PER_STEP}vh`);
  seqSection.style.setProperty('--seq-header', `${headerH}px`);
  // Try the pinned layout on, and keep it only if the whole stage fits the
  // screen. The stage is at least a screen tall when pinned, so anything more
  // than that is content that would be cut off.
  seqSection.classList.add('is-sequenced');
  const fits = seqStage.scrollHeight <= window.innerHeight + 1;
  seqOn = seqWide.matches && !seqReduce.matches && fits;
  seqSection.classList.toggle('is-sequenced', seqOn);
  questionButtons.forEach((b, i) => b.style.setProperty('--tilt', `${i % 2 ? 7 : -7}deg`));
  seqIdx = -2;
  if(!seqOn) questionButtons.forEach(b => b.classList.remove('has-landed'));
  seqUpdate();
}

function seqUpdate(){
  if(!seqOn || performance.now() < seqLock) return;
  const rect = seqSection.getBoundingClientRect();
  const total = seqSection.offsetHeight - window.innerHeight;
  let idx = -1;                                   // nothing has fallen yet
  if(rect.top <= window.innerHeight * 0.35){
    const passed = Math.min(Math.max(-rect.top, 0), total);
    idx = Math.min(questionButtons.length - 1, Math.floor(passed / total * questionButtons.length));
  }
  if(idx === seqIdx) return;
  seqIdx = idx;
  questionButtons.forEach((b, i) => b.classList.toggle('has-landed', i <= idx));
  if(idx >= 0) showQuestion(questionButtons[idx]);
}

questionButtons.forEach((button, i) => {
  button.addEventListener('click', () => {
    if(!seqOn){ showQuestion(button); return; }
    // Land everything up to this chip now, then take the page there. The lock
    // stops the panel flickering through every question the scroll passes.
    seqIdx = i;
    questionButtons.forEach((b, n) => b.classList.toggle('has-landed', n <= i));
    showQuestion(button);
    // Arrowing to a chip that had not fallen yet tries to focus it while it is
    // still hidden, which fails silently and strands focus on the previous
    // one. It is visible now, so take focus here.
    button.focus({ preventScroll: true });
    const total = seqSection.offsetHeight - window.innerHeight;
    const top = seqSection.getBoundingClientRect().top + window.scrollY;
    const y = Math.round(top + (i + 0.5) / questionButtons.length * total);
    seqLock = performance.now() + 1500;
    if(lenisInstance) lenisInstance.scrollTo(y, { onComplete: () => { seqLock = 0; } });
    else { window.scrollTo(0, y); seqLock = 0; }
  });
});

window.addEventListener('scroll', seqUpdate, {passive:true});
window.addEventListener('resize', seqLayout, {passive:true});
seqWide.addEventListener?.('change', seqLayout);
seqReduce.addEventListener?.('change', seqLayout);
document.fonts?.ready.then(seqLayout);
seqLayout();

// Four perspectives
const lensData = (window.__I18N__ && window.__I18N__.lensData) || {
  business:{kicker:'BUSINESS',title:'What are we actually trying to make better?',body:'Start with the outcome, friction or opportunity that matters to the organisation. AI is useful when it improves something worth improving.'},
  people:{kicker:'PEOPLE',title:'Who will use, trust or be affected by the change?',body:'A technically possible idea still has to make sense to the people doing the work, making the decisions, serving customers or carrying accountability.'},
  workflow:{kicker:'WORKFLOW',title:'How does the work happen today, and what should change?',body:'AI often creates more value when the surrounding work, handoffs and decisions are redesigned rather than simply adding another tool to the existing process.'},
  technology:{kicker:'TECHNOLOGY',title:'What can AI realistically contribute?',body:'We look at capability, data, constraints and failure modes in context. The goal is not to use the most advanced technology. It is to use the right capability for the work.'}
};
const lensButtons = document.querySelectorAll('.lens-card');
lensButtons.forEach(btn=>btn.addEventListener('click',()=>{
  lensButtons.forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed','true');
  const d = lensData[btn.dataset.lens];
  document.getElementById('lensKicker').textContent=d.kicker;
  document.getElementById('lensTitle').textContent=d.title;
  document.getElementById('lensBody').textContent=d.body;
}));

// Situation based offers
const offers = (window.__I18N__ && window.__I18N__.offers) || {
  clarity:{number:'01',duration:'5 business days',label:'AI CLARITY REVIEW',title:'Understand what is worth exploring before investing further.',body:'We look at the business situation, current work, stakeholder perspectives and important assumptions to create a clearer starting point.',outputs:['A clearer problem definition','Important assumptions and risks','Initial opportunity areas','A recommendation on what deserves further investigation']},
  opportunity:{number:'02',duration:'2 weeks',label:'AI OPPORTUNITY SPRINT',title:'Turn a field of possibilities into a clearer set of priorities.',body:'We bring business, users and technology together to understand the current workflow, identify where AI may genuinely help, and prioritise the opportunities worth deeper exploration.',outputs:['Prioritised opportunity areas','Workflow and user insights','AI use-case concepts','Value hypotheses and success measures']},
  blueprint:{number:'03',duration:'3 to 4 weeks',label:'SOLUTION BLUEPRINT',title:'Make the future way of working tangible enough to understand and test.',body:'We shape the workflow, human and AI responsibilities, experience and key assumptions before full development makes changing direction more difficult.',outputs:['Future workflow','Human and AI role definition','Prototype or experience concept','Validation findings and success criteria']},
  adoption:{number:'04',duration:'4 to 8 weeks initially',label:'ADOPTION & VALUE LOOP',title:'Learn what happens when the technology meets the real organisation.',body:'We help teams understand whether people are adopting the new way of working, where friction remains, what value signals are emerging, and what should change next.',outputs:['Adoption insights','Workflow improvements','Value and feedback signals','A prioritised improvement backlog']}
};
const panel=document.querySelector('.offer-panel');
const tabs=document.querySelectorAll('.situation-tab');
function renderOffer(key){
  panel.classList.add('is-changing');
  setTimeout(()=>{
    const d=offers[key];
    document.getElementById('offerNumber').textContent=d.number;
    document.getElementById('offerDuration').textContent=d.duration;
    document.getElementById('offerLabel').textContent=d.label;
    document.getElementById('offerTitle').textContent=d.title;
    document.getElementById('offerBody').textContent=d.body;
    document.getElementById('offerOutputs').innerHTML=d.outputs.map(x=>`<li>${x}</li>`).join('');
    panel.classList.remove('is-changing');
  },150);
}
tabs.forEach(tab=>tab.addEventListener('click',()=>{
  tabs.forEach(t=>{t.classList.remove('is-active');t.setAttribute('aria-selected','false')});
  tab.classList.add('is-active');tab.setAttribute('aria-selected','true');
  renderOffer(tab.dataset.offer);
}));

// Transformation strategy sequencer
const strategyMap = document.getElementById('strategyMap');
const strategySteps = Array.from(document.querySelectorAll('.strategy-step'));
const strategyRail = strategyMap?.querySelector('.strategy-rail span');
let strategyTimer;
let strategyIndex = 0;
function setStrategyStep(idx){
  strategyIndex = idx;
  strategySteps.forEach((s,i)=>{
    s.classList.toggle('is-active', i===idx);
    if(i===idx) s.setAttribute('aria-current','step'); else s.removeAttribute('aria-current');
  });
  if(strategyRail) strategyRail.style.width = `${idx/(strategySteps.length-1)*100}%`;
}
// Once someone picks a step — by pointer, click or keyboard — the auto-advance
// stops. Without this the timer moved the highlight off whatever a keyboard
// user had just tabbed to, about a second after they got there.
let strategyUserPicked = false;
function chooseStrategyStep(idx){
  strategyUserPicked = true;
  clearInterval(strategyTimer);
  strategyTimer = null;
  setStrategyStep(idx);
}
strategySteps.forEach((step,idx)=>{
  step.addEventListener('mouseenter',()=>chooseStrategyStep(idx));
  step.addEventListener('click',()=>chooseStrategyStep(idx));
  step.addEventListener('focus',()=>chooseStrategyStep(idx));
});
if(strategyMap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const strategyObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      clearInterval(strategyTimer);
      // Scrolling back to the section must not restart the carousel over a
      // choice someone already made.
      if(entry.isIntersecting && !strategyUserPicked){
        strategyTimer=setInterval(()=>setStrategyStep((strategyIndex+1)%strategySteps.length),1500);
      }
    });
  },{threshold:.35});
  strategyObserver.observe(strategyMap);
}

// Adoption learning interaction
const adoptionData = (window.__I18N__ && window.__I18N__.adoptionData) || {
  understanding:{kicker:'UNDERSTANDING',title:'People need to understand why the new way of working matters.',body:'Adoption becomes easier when the reason for the change is clear and connected to the work people already care about.'},
  workflow:{kicker:'USEFUL WORKFLOW',title:'The new capability has to fit the way work actually happens.',body:'If using AI creates more steps, unclear handoffs or extra friction, training alone will not make the behaviour stick.'},
  confidence:{kicker:'CONFIDENCE',title:'People need enough confidence to use judgement around the technology.',body:'Confidence comes from practice, clear boundaries, feedback, and knowing when to trust, verify or escalate.'},
  leadership:{kicker:'LEADERSHIP SUPPORT',title:'Leaders reinforce which behaviours matter.',body:'People watch what leaders prioritise, reward and ask about. Adoption grows when the change is supported in everyday management.'},
  feedback:{kicker:'FEEDBACK',title:'The organisation needs a way to learn from real use.',body:'Feedback shows where the workflow, experience, guidance or technology needs to change after deployment.'},
  capability:{kicker:'CAPABILITY',title:'The organisation needs the capability to sustain the change.',body:'Ownership, governance, skills and operating routines help the new way of working remain useful after the initial launch.'}
};
const adoptionButtons = document.querySelectorAll('.adoption-factor');
adoptionButtons.forEach(btn=>btn.addEventListener('click',()=>{
  adoptionButtons.forEach(b=>b.classList.remove('is-active'));
  btn.classList.add('is-active');
  const d=adoptionData[btn.dataset.adoption];
  document.getElementById('adoptionKicker').textContent=d.kicker;
  document.getElementById('adoptionTitle').textContent=d.title;
  document.getElementById('adoptionBody').textContent=d.body;
}));

// Decision Base interaction
const baseData = (window.__I18N__ && window.__I18N__.baseData) || {evidence:'What did we actually observe?',insights:'What might the evidence mean?',decisions:'What have we agreed to do?',assumptions:'What are we still testing?',requirements:'What needs to be true?',questions:'What still needs resolving?'};
const baseNodes=document.querySelectorAll('.base-row');
baseNodes.forEach(n=>n.addEventListener('click',()=>{
  baseNodes.forEach(x=>x.classList.remove('is-active'));
  n.classList.add('is-active');
  document.getElementById('baseDescription').textContent=baseData[n.dataset.base];
}));

// Progressive form
const continueForm=document.getElementById('continueForm');
const formDetails=document.getElementById('formDetails');
const challengeError=document.getElementById('challengeError');
continueForm?.addEventListener('click',()=>{
  const challenge=document.getElementById('challenge');
  if(!challenge.value.trim()){
    // Colour alone said "this is wrong", and said it silently. Now there is
    // text, the field is marked invalid, and role="alert" announces it.
    challenge.setAttribute('aria-invalid','true');
    challenge.setAttribute('aria-describedby','challengeError');
    if(challengeError) challengeError.textContent=MSG('msg.challengeRequired','Please tell us what you are trying to improve before continuing.');
    challenge.focus();
    return;
  }
  challenge.removeAttribute('aria-invalid');
  challenge.removeAttribute('aria-describedby');
  if(challengeError) challengeError.textContent='';
  formDetails.classList.add('is-open');
  formDetails.setAttribute('aria-hidden','false');
  continueForm.style.display='none';
});
document.getElementById('challenge')?.addEventListener('input',e=>{
  if(e.target.getAttribute('aria-invalid')==='true'){
    e.target.removeAttribute('aria-invalid');e.target.removeAttribute('aria-describedby');
    if(challengeError) challengeError.textContent='';
  }
});

const FORM_ENDPOINT='https://formspree.io/f/mljrovra';
// Form status copy comes from the page's locale bundle; English is the fallback.
const MSG = (k, en) => ((window.__I18N__ && window.__I18N__.__msgs && window.__I18N__.__msgs[k]) || en);

function formMessage(form,text){
  const existing=form.querySelector('.form-message');if(existing) existing.remove();
  const p=document.createElement('p');p.className='form-message';p.setAttribute('role','status');p.textContent=text;formDetails.appendChild(p);
}
function formThankYou(form){
  const box=document.createElement('div');
  box.className='form-success';
  box.setAttribute('role','status');
  box.innerHTML='<span class="tick" aria-hidden="true">\u2713</span>'
    +'<h3>'+MSG('msg.thankTitle','Thank you.')+'</h3>'
    +'<p>'+MSG('msg.thankBody','Your message has reached us. We read every enquiry ourselves and will reply to the email address you gave, usually within a couple of working days.')+'</p>';
  form.replaceChildren(box);
  box.scrollIntoView({behavior:'smooth',block:'center'});
}
document.getElementById('interestForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  if(FORM_ENDPOINT.startsWith('REPLACE_')){formMessage(form,'The prototype is ready for a live form connection. Your message has not been sent yet.');return;}
  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;formMessage(form,MSG('msg.sending','Sending...'));
  try{
    const res=await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json'},body:new FormData(form)});
    if(!res.ok) throw new Error(res.status);
    formThankYou(form);
  }catch(err){
    formMessage(form,MSG('msg.error','Something went wrong and your message was not sent. Please email us at hello@labdelight.co and we will pick it up from there.'));
    submit.disabled=false;
  }
});

const yearEl=document.getElementById('year'); if(yearEl) yearEl.textContent=new Date().getFullYear();

// Language switcher. Marks the active locale, remembers the choice, and keeps
// the current section when moving between languages.
(function(){
  const wrap = document.querySelector('.lang-switch');
  const toggle = document.getElementById('langToggle');
  const menu = document.getElementById('langMenu');
  if(!wrap || !toggle || !menu) return;

  const current = (document.documentElement.getAttribute('data-locale') || 'en');
  menu.querySelectorAll('a').forEach(a => {
    const loc = a.getAttribute('href') === '/' ? 'en' : a.getAttribute('href').replace(/\//g,'');
    if(loc === current){
      a.setAttribute('aria-current','true');
      const label = wrap.querySelector('.lang-current');
      if(label) label.textContent = a.textContent;
    }
    // carry the reader's place across to the same section in the other language
    a.addEventListener('click', () => {
      try { localStorage.setItem('ld-lang', loc); } catch(e){}
      if(location.hash) a.href = a.getAttribute('href') + location.hash;
    });
  });

  const close = () => { wrap.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); };
  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const open = wrap.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
})();

// Declaring role="tab" promises the tab pattern: arrow keys move between tabs,
// Home/End jump to the ends, and only the selected tab is in the tab order, so
// Tab moves past the whole set rather than through every option.
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  if(!tabs.length) return;

  const roving = () => tabs.forEach(t =>
    t.setAttribute('tabindex', t.getAttribute('aria-selected') === 'true' ? '0' : '-1'));
  roving();
  tabs.forEach(t => t.addEventListener('click', () => window.setTimeout(roving, 0)));

  list.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement);
    if(i < 0) return;
    let next = null;
    if(e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
    else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
    else if(e.key === 'Home') next = 0;
    else if(e.key === 'End') next = tabs.length - 1;
    if(next === null) return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
});

// Insight carousel. The cards are real HTML, so with JS off or broken the rail
// is still a scrollable, readable list — the buttons only add a nicer way to
// move through it. No autoplay, so there is nothing for a reader to outrun.
document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const prev = carousel.querySelector('[data-carousel="prev"]');
  const next = carousel.querySelector('[data-carousel="next"]');
  const current = carousel.querySelector('[data-carousel="current"]');
  const total = carousel.querySelector('[data-carousel="total"]');
  if(!track || !slides.length) return;

  if(total) total.textContent = String(slides.length);
  const smooth = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  // Whichever slide's centre is nearest the rail's centre is the one showing.
  const indexOf = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestGap = Infinity;
    slides.forEach((s, i) => {
      const gap = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if(gap < bestGap){ bestGap = gap; best = i; }
    });
    return best;
  };

  const sync = () => {
    const i = indexOf();
    if(current) current.textContent = String(i + 1);
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    if(prev) prev.disabled = atStart;
    if(next) next.disabled = atEnd;
  };

  // The rail is tweened by hand rather than with scrollTo({behavior:'smooth'}).
  // Lenis writes to the window scroll on every frame, and the browser cancels
  // a native smooth scroll on a descendant when that happens — the buttons
  // silently stopped working. Driving scrollLeft ourselves is independent of
  // both Lenis and the browser's smooth-scroll support.
  let tween = null, settle = null;
  const go = i => {
    const slide = slides[Math.max(0, Math.min(slides.length - 1, i))];
    if(!slide) return;
    const to = Math.max(0, Math.min(
      slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      track.scrollWidth - track.clientWidth));
    if(smooth() === 'auto'){ track.scrollLeft = to; return; }
    const from = track.scrollLeft, dist = to - from, t0 = performance.now(), ms = 420;
    if(tween) cancelAnimationFrame(tween);
    clearTimeout(settle);
    const step = now => {
      const p = Math.min((now - t0) / ms, 1);
      track.scrollLeft = from + dist * (1 - Math.pow(1 - p, 3));   // ease-out cubic
      if(p < 1) tween = requestAnimationFrame(step); else tween = null;
    };
    tween = requestAnimationFrame(step);
    // Frames stop being delivered in a background tab, which would otherwise
    // leave the rail parked mid-slide when someone tabs away and back. This
    // lands it on the target card regardless of whether the tween ever ran.
    settle = setTimeout(() => {
      if(tween){ cancelAnimationFrame(tween); tween = null; }
      track.scrollLeft = to;
    }, ms + 90);
  };

  prev?.addEventListener('click', () => go(indexOf() - 1));
  next?.addEventListener('click', () => go(indexOf() + 1));
  track.addEventListener('keydown', e => {
    if(e.key === 'ArrowRight'){ e.preventDefault(); go(indexOf() + 1); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); go(indexOf() - 1); }
    else if(e.key === 'Home'){ e.preventDefault(); go(0); }
    else if(e.key === 'End'){ e.preventDefault(); go(slides.length - 1); }
  });

  let raf;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, {passive:true});
  window.addEventListener('resize', sync, {passive:true});
  sync();
});

// Smooth scroll (Lenis, vendored under /vendor). It wraps the native scroll
// rather than replacing it, so window.scrollY, the scroll event, sticky
// positioning and the IntersectionObservers above all keep working unchanged.
//
// Set up the way the library documents it:
//   - respectReducedMotion is left at its default. Lenis then drops smoothing
//     to 1:1 and makes programmatic scrolls instant, but keeps running, so
//     scroll-linked work stays in sync. Our own parallax and drift are gated
//     on lenis.prefersReducedMotion instead of being torn down by hand, and
//     the preference is picked up live without a reload.
//   - nested scrollers use data-lenis-prevent, which the docs prefer over
//     allowNestedScroll because it does not walk the DOM on every event.
//   - anchors takes ScrollToOptions; offset behaves like scroll-padding-top,
//     so a positive-space value of 72 is written as -72 and lands the section
//     just clear of the 70px header. Verified rather than assumed.
//   - the CSS smooth-scroll is turned off once Lenis is live and left in the
//     stylesheet as the fallback for when Lenis is absent.
(function(){
  if(typeof window.Lenis !== 'function') return;

  document.documentElement.style.scrollBehavior = 'auto';
  const lenis = new window.Lenis({
    duration: 1.05,                 // a little quicker than the 1.2 default
    anchors: { offset: -72 },
  });
  const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);

  // Lenis moves the page without the browser emitting a native scroll event,
  // so everything that listened for one stopped running the moment smooth
  // scroll went live: the reading-progress bar, the header's scrolled state
  // and the context steps. Re-point the same handler at Lenis's own event.
  lenisInstance = lenis;
  lenis.on('scroll', onScroll);
  lenis.on('scroll', seqUpdate);
  onScroll();

  // Our own scroll-linked motion is decoration, so it stays off entirely when
  // reduced motion is asked for — checked per frame, because Lenis tracks the
  // setting live and someone can change it mid-visit.
  const still = () => lenis.prefersReducedMotion;
  const clear = els => els.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });

  parallax(lenis, still, clear);
  drift(lenis, still, clear);

  // Sideways travel as a section crosses the viewport. One subscriber walks a
  // pre-measured list, so there is no layout read per frame — only transform
  // writes. Measurements refresh on resize and when fonts settle.
  function drift(instance, still, clear){
    const items = [...document.querySelectorAll('[data-drift]')].map(el => ({
      el, amount: parseFloat(el.dataset.drift) || 0, top: 0, height: 0,
    }));
    if(!items.length) return;

    const measure = () => items.forEach(it => {
      const r = it.el.getBoundingClientRect();
      it.top = r.top + window.scrollY;
      it.height = r.height;
    });
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure, {passive:true});

    instance.on('scroll', ({ scroll }) => {
      if(still()) { clear(items.map(i => i.el)); return; }
      const vh = window.innerHeight;
      for(const it of items){
        // -1 just below the fold, 0 centred, +1 just above the top
        const p = (scroll + vh - it.top) / (vh + it.height) * 2 - 1;
        if(p < -1.2 || p > 1.2) continue;
        it.el.style.transform = `translate3d(${(-p * it.amount).toFixed(2)}px, 0, 0)`;
      }
    });
  }

  // Scroll-linked depth in the hero. Driven off Lenis's own scroll event, so
  // it updates on the same frame as the scroll instead of fighting it, and
  // only ever writes transform/opacity — no layout, no reflow per frame.
  //
  // The video is hidden below 780px, so on a phone this is just the copy
  // drifting, which is the right amount of movement for a small screen.
  function parallax(instance, still, clear){
    const hero = document.querySelector('.hero');
    if(!hero) return;
    const media = hero.querySelector('.hero-video');
    const copy = hero.querySelector('.hero-copy');
    const wash = hero.querySelector('.hero-wash');
    [media, copy, wash].forEach(el => el && (el.style.willChange = 'transform, opacity'));

    let height = hero.offsetHeight;
    const remeasure = () => { height = hero.offsetHeight; };
    window.addEventListener('resize', remeasure, {passive:true});

    instance.on('scroll', ({ scroll }) => {
      if(still()) { clear([media, wash, copy].filter(Boolean)); return; }
      if(scroll > height) return;                 // past the hero, nothing to do
      const t = Math.min(scroll / height, 1);     // 0 at the top, 1 one screen down
      if(media) media.style.transform = `translate3d(0, ${scroll * 0.18}px, 0) scale(${1 + t * 0.04})`;
      if(wash)  wash.style.transform  = `translate3d(0, ${scroll * 0.08}px, 0)`;
      if(copy){
        copy.style.transform = `translate3d(0, ${scroll * -0.06}px, 0)`;
        // Hold full opacity for the first third, then fade out by the time the
        // hero has left. Fading from the very first pixel made the headline
        // look washed out while it was still the thing being read.
        const fade = Math.min(Math.max((t - 0.34) / 0.52, 0), 1);
        copy.style.opacity = String(1 - fade);
      }
    });
  }

})();
