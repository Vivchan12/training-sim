const header = document.getElementById('siteHeader');
const progress = document.getElementById('scrollProgress');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

function onScroll(){
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 20);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

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
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>{
  nav.classList.remove('open');
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

// Hero rotating outcome line
const heroOutcome = document.getElementById('heroOutcome');
const heroOutcomePhrases = [
  'real business impact.',
  'meaningful progress.',
  'better ways of working.',
  'decisions backed by evidence.'
];

if(heroOutcome && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  let heroOutcomeIndex = 0;

  window.setInterval(() => {
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

// Interactive questions before the build
const questionData = {
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

questionButtons.forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.question;
    const data = questionData[key];
    if(!data) return;

    questionButtons.forEach(btn => {
      const active = btn === button;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
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
  });
});

// Four perspectives
const lensData = {
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
const offers = {
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
  strategySteps.forEach((s,i)=>s.classList.toggle('is-active', i===idx));
  if(strategyRail) strategyRail.style.width = `${idx/(strategySteps.length-1)*100}%`;
}
strategySteps.forEach((step,idx)=>step.addEventListener('mouseenter',()=>setStrategyStep(idx)));
if(strategyMap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const strategyObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      clearInterval(strategyTimer);
      if(entry.isIntersecting){
        strategyTimer=setInterval(()=>setStrategyStep((strategyIndex+1)%strategySteps.length),1500);
      }
    });
  },{threshold:.35});
  strategyObserver.observe(strategyMap);
}

// Adoption learning interaction
const adoptionData = {
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
const baseData={evidence:'What did we actually observe?',insights:'What might the evidence mean?',decisions:'What have we agreed to do?',assumptions:'What are we still testing?',requirements:'What needs to be true?',questions:'What still needs resolving?'};
const baseNodes=document.querySelectorAll('.base-row');
baseNodes.forEach(n=>n.addEventListener('click',()=>{
  baseNodes.forEach(x=>x.classList.remove('is-active'));
  n.classList.add('is-active');
  document.getElementById('baseDescription').textContent=baseData[n.dataset.base];
}));

// Progressive form
const continueForm=document.getElementById('continueForm');
const formDetails=document.getElementById('formDetails');
continueForm?.addEventListener('click',()=>{
  const challenge=document.getElementById('challenge');
  if(!challenge.value.trim()){challenge.focus();challenge.style.borderColor='var(--orange)';return;}
  formDetails.classList.add('is-open');
  formDetails.setAttribute('aria-hidden','false');
  continueForm.style.display='none';
});
const FORM_ENDPOINT='https://formspree.io/f/mljrovra';
function formMessage(form,text){
  const existing=form.querySelector('.form-message');if(existing) existing.remove();
  const p=document.createElement('p');p.className='form-message';p.textContent=text;formDetails.appendChild(p);
}
function formThankYou(form){
  const box=document.createElement('div');
  box.className='form-success';
  box.setAttribute('role','status');
  box.innerHTML='<span class="tick" aria-hidden="true">\u2713</span>'
    +'<h3>Thank you.</h3>'
    +'<p>Your message has reached us. We read every enquiry ourselves and will reply to the email address you gave, usually within a couple of working days.</p>';
  form.replaceChildren(box);
  box.scrollIntoView({behavior:'smooth',block:'center'});
}
document.getElementById('interestForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  if(FORM_ENDPOINT.startsWith('REPLACE_')){formMessage(form,'The prototype is ready for a live form connection. Your message has not been sent yet.');return;}
  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;formMessage(form,'Sending...');
  try{
    const res=await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json'},body:new FormData(form)});
    if(!res.ok) throw new Error(res.status);
    formThankYou(form);
  }catch(err){
    formMessage(form,'Something went wrong and your message was not sent. Please email us at hello@labdelight.co and we will pick it up from there.');
    submit.disabled=false;
  }
});

document.getElementById('year').textContent=new Date().getFullYear();
