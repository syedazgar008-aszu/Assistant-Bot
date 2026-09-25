(()=>{"use strict";

// ======= PERFORMANCE: DOM QUERIES CACHED =======
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const root=document.documentElement;
const body=document.body;
const nav=$("#nav"),menu=$("#menuToggle"),theme=$("#themeToggle");
const progress=$("#progress"),header=$("#header"),glow=$("#cursorGlow");
const cursorDot=$("#cursorDot"),profileCard=$("#profileCard"),heroVisual=$(".hero-visual");
const sections=$$("main section[id]"),links=$$(".nav a");
const reveals=$$(".reveal"),skills=$$(".skill"),projects=$$(".project");

// ======= PERFORMANCE: FEATURE DETECTION =======
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer=matchMedia("(pointer:fine)").matches;
const darkMode=matchMedia("(prefers-color-scheme: dark)").matches;
const hasIO="IntersectionObserver" in window;

// ======= THEME MANAGEMENT =======
const metaTheme=$('meta[name="theme-color"]');
function setTheme(v,save=true){
  root.dataset.theme=v;
  theme?.setAttribute("aria-label",v==="light"?"Switch to dark mode":"Switch to light mode");
  theme&&(theme.textContent=v==="light"?"☾":"☀");
  metaTheme?.setAttribute("content",v==="light"?"#f8f9fd":"#0a0e27");
  if(save)localStorage.setItem("aszu-theme",v);
}

const saved=localStorage.getItem("aszu-theme");
setTheme(saved||(darkMode?"dark":"light"),false);
theme?.addEventListener("click",()=>setTheme(root.dataset.theme==="light"?"dark":"light"));

// ======= MOBILE MENU =======
function closeMenu(){
  nav?.classList.remove("open");
  menu?.classList.remove("open");
  menu?.setAttribute("aria-expanded","false");
}

menu?.addEventListener("click",()=>{
  const isOpen=nav.classList.toggle("open");
  menu.classList.toggle("open",isOpen);
  menu.setAttribute("aria-expanded",String(isOpen));
});

$$(".nav a").forEach(a=>a.addEventListener("click",closeMenu));
addEventListener("keydown",e=>{e.key==="Escape"&&closeMenu()});

// ======= PERFORMANCE: SCROLL UI THROTTLED =======
let ticking=false;
function scrollUI(){
  const h=document.documentElement.scrollHeight-innerHeight;
  if(progress)progress.style.width=`${h>0?(scrollY/h)*100:0}%`;
  header?.classList.toggle("scrolled",scrollY>30);
  ticking=false;
}

addEventListener("scroll",()=>{
  !ticking&&(requestAnimationFrame(scrollUI),ticking=true);
},{passive:true});
scrollUI();

// ======= ACTIVE NAV LINK =======
if(hasIO){
  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      entry.isIntersecting&&links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")===`#${entry.target.id}`));
    });
  },{rootMargin:"-42% 0px -52% 0px"});
  sections.forEach(s=>sectionObserver.observe(s));
}

// ======= REVEAL ANIMATIONS =======
if(!reduce&&hasIO){
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },{threshold:0.12,rootMargin:"0px 0px -30px"});
  
  reveals.forEach((el,i)=>{
    el.style.transitionDelay=`${Math.min(i%4,3)*70}ms`;
    revealObserver.observe(el);
  });
}else{
  reveals.forEach(el=>el.classList.add("visible"));
}

// ======= SKILL BARS ANIMATION =======
if(!reduce&&hasIO){
  const skillObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      entry.isIntersecting&&entry.target.classList.add("in-view");
    });
  },{threshold:0.35});
  skills.forEach(el=>skillObserver.observe(el));
}else{
  skills.forEach(el=>el.classList.add("in-view"));
}

// ======= TYPING ANIMATION =======
const words=["Web Developer","Full Stack Learner","Creative Builder","Tech Explorer","Problem Solver"];
const typing=$("#typing");
let typeInterval=null;

if(typing&&!reduce){
  let wi=0,ci=0,deleting=false;
  const type=()=>{
    const word=words[wi];
    ci=deleting?ci-1:ci+1;
    typing.textContent=word.slice(0,ci);
    if(!deleting&&ci===word.length){
      deleting=true;
      typeInterval=setTimeout(type,1400);
      return;
    }
    if(deleting&&ci===0){
      deleting=false;
      wi=(wi+1)%words.length;
    }
    typeInterval=setTimeout(type,deleting?45:65);
  };
  type();
}else if(typing){
  typing.textContent=words[0];
}

// ======= 3D TILT EFFECT =======
if(profileCard&&heroVisual&&!reduce&&finePointer){
  let raf=0;
  heroVisual.addEventListener("pointermove",e=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      const r=profileCard.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-0.5;
      const y=(e.clientY-r.top)/r.height-0.5;
      profileCard.style.transform=`perspective(1000px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.02)`;
      raf=0;
    });
  },{passive:true});
  heroVisual.addEventListener("pointerleave",()=>{
    profileCard.style.transform="";
  });
}

// ======= CURSOR GLOW & DOT =======
if(finePointer&&!reduce){
  let glowRaf=0;
  addEventListener("pointermove",e=>{
    glow&&(glow.style.opacity="0.85");
    cursorDot&&(cursorDot.style.opacity="0.8");
    
    if(glowRaf)return;
    glowRaf=requestAnimationFrame(()=>{
      glow&&(glow.style.left=`${e.clientX}px`,glow.style.top=`${e.clientY}px`);
      cursorDot&&(cursorDot.style.left=`${e.clientX}px`,cursorDot.style.top=`${e.clientY}px`);
      glowRaf=0;
    });
  },{passive:true});
  
  addEventListener("pointerleave",()=>{
    glow&&(glow.style.opacity="0");
    cursorDot&&(cursorDot.style.opacity="0");
  },{passive:true});
}

// ======= MAGNETIC BUTTONS =======
if(!reduce&&finePointer){
  $$(".magnetic").forEach(btn=>{
    btn.addEventListener("pointermove",e=>{
      const r=btn.getBoundingClientRect();
      const x=e.clientX-r.left-r.width/2;
      const y=e.clientY-r.top-r.height/2;
      btn.style.transform=`translate(${x*.12}px,${y*.12}px) translateY(-3px)`;
    });
    btn.addEventListener("pointerleave",()=>{
      btn.style.transform="";
    });
  });
}

// ======= PERFORMANCE: LAZY LOAD IMAGES =======
if("IntersectionObserver" in window){
  const imgObserver=new IntersectionObserver((entries,observer)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const img=entry.target;
        img.src=img.dataset.src||img.src;
        img.classList.add("loaded");
        observer.unobserve(img);
      }
    });
  },{rootMargin:"50px"});
  
  $$("img[data-src]").forEach(img=>imgObserver.observe(img));
}

// ======= PREFETCH LINKS =======
if("requestIdleCallback" in window){
  requestIdleCallback(()=>{
    $$("a[href^='#']").forEach(link=>{
      link.addEventListener("mouseenter",()=>{
        const href=link.getAttribute("href");
        const target=$(href);
        if(target)target.style.willChange="transform";
      });
    });
  });
}

// ======= SMOOTH PAGE LOAD =======
addEventListener("DOMContentLoaded",()=>{
  body.style.opacity="1";
});

// ======= ACCESSIBILITY: FOCUS STYLES =======
addEventListener("keydown",e=>{
  if(e.key==="Tab"){
    body.classList.add("focus-visible");
  }
});

addEventListener("mousedown",()=>{
  body.classList.remove("focus-visible");
});

// ======= PERFORMANCE: CLEANUP ON UNLOAD =======
addEventListener("beforeunload",()=>{
  typeInterval&&clearTimeout(typeInterval);
});

})();