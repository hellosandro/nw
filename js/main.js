/* ── SCROLL REVEAL ── */
document.body.classList.add('js-ready');
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
document.querySelectorAll('#m1 .reveal').forEach((el, i) => {
  setTimeout(() => el.classList.add('on'), 150 + i * 120);
});

/* ── FACES SLIDESHOW ── */
(function() {
  var slides = document.querySelectorAll('.faces-slide');
  var dots   = document.querySelectorAll('.faces-dot');
  var cur = 0, autoT;
  function goTo(idx) {
    if (idx >= slides.length) {
      clearInterval(autoT);
      var facesEl = document.getElementById('faces');
      var next = facesEl ? facesEl.nextElementSibling : null;
      if (next) navScrollTo(next);
      return;
    }
    slides[cur].classList.remove('active'); dots[cur].classList.remove('active');
    cur = (idx + slides.length) % slides.length;
    slides[cur].classList.add('active'); dots[cur].classList.add('active');
    clearInterval(autoT); autoT = setInterval(() => goTo(cur + 1), 5000);
  }
  document.getElementById('faces-prev').addEventListener('click', () => goTo(cur - 1));
  document.getElementById('faces-next').addEventListener('click', () => goTo(cur + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.idx)));
  var ss = document.getElementById('faces-slideshow'), sx = 0;
  ss.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  ss.addEventListener('touchend',   e => { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) goTo(dx < 0 ? cur+1 : cur-1); }, { passive: true });
  autoT = setInterval(() => goTo(cur + 1), 5000);
})();

/* ── HORIZONTAL SCROLL ENGINE ── */
function smoothTo(el, target, dur) {
  dur = dur || 480;
  var s = el.scrollLeft, d = target - s, t0 = null;
  function ease(t) { return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
  function step(ts) { if (!t0) t0=ts; var p=Math.min((ts-t0)/dur,1); el.scrollLeft=s+d*ease(p); if(p<1) requestAnimationFrame(step); }
  if (Math.abs(d) > 1) requestAnimationFrame(step);
}
function getIdx(el) {
  var pp = el.querySelectorAll('.page,.wine-card'), best=0, bd=Infinity;
  pp.forEach((p,i) => { var d=Math.abs(p.offsetLeft-el.scrollLeft); if(d<bd){bd=d;best=i;} });
  return best;
}
function goPanel(el, idx) {
  var pp = el.querySelectorAll('.page,.wine-card');
  idx = Math.max(0, Math.min(idx, pp.length-1));
  smoothTo(el, pp[idx].offsetLeft, 480);
}

function setupDots(scrollEl, dotsEl) {
  var pp = scrollEl.querySelectorAll('.page,.wine-card');
  if (!pp.length) return;
  dotsEl.innerHTML = '';
  pp.forEach((_, i) => {
    var d = document.createElement('span');
    d.className = 'dot' + (i===0?' active':'');
    d.addEventListener('click', () => goPanel(scrollEl, i));
    dotsEl.appendChild(d);
  });
  var dots = dotsEl.querySelectorAll('.dot');
  scrollEl.addEventListener('scroll', function() {
    clearTimeout(scrollEl._dt);
    scrollEl._dt = setTimeout(() => {
      var idx = getIdx(scrollEl);
      dots.forEach((d,i) => d.classList.toggle('active', i===idx));
    }, 50);
  });
}

var mScroll = document.getElementById('manifesto-scroll');
var mDots   = document.getElementById('manifesto-dots');
var wScroll = document.getElementById('wines-scroll');
var wDots   = document.getElementById('wines-dots');
if (mScroll && mDots) setupDots(mScroll, mDots);
if (wScroll && wDots) setupDots(wScroll, wDots);

/* Reveal inside panels */
[mScroll, wScroll].forEach(sc => {
  if (!sc) return;
  var po = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.reveal').forEach((el,i) => setTimeout(() => el.classList.add('on'), 100+i*100));
        po.unobserve(e.target);
      }
    });
  }, { root: sc, threshold: 0.3 });
  sc.querySelectorAll('.page,.wine-card').forEach(p => po.observe(p));
});

/* Mouse wheel */
[mScroll, wScroll].forEach(el => {
  if (!el) return;
  var accum=0, locked=false, rt;
  el.addEventListener('wheel', function(e) {
    var absX=Math.abs(e.deltaX), absY=Math.abs(e.deltaY);
    var isH = absX>absY*8 && absX>10, isD = e.deltaMode===1||(absX===0&&absY>=40);
    if (!isH&&!isD) return;
    var delta = isH?e.deltaX:e.deltaY;
    var pp=el.querySelectorAll('.page,.wine-card'), idx=getIdx(el);
    if (delta>0&&idx>=pp.length-1){accum=0;var wr=el.closest('.hscroll-wrapper'),nx=wr?wr.nextElementSibling:null;if(nx)navScrollTo(nx);return;}
    if (delta<0&&idx<=0){accum=0;return;}
    e.preventDefault();
    if (locked) return;
    accum+=delta; clearTimeout(rt); rt=setTimeout(()=>accum=0,150);
    if (Math.abs(accum)<80) return;
    locked=true; goPanel(el,idx+(accum>0?1:-1)); accum=0;
    setTimeout(()=>{locked=false;},1200);
  }, { passive:false });
});

/* Touch swipe on hscroll */
[mScroll, wScroll].forEach(el => {
  if (!el) return;
  var sx=0, sy=0, tr=false;
  el.addEventListener('touchstart', e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;tr=true;},{passive:true});
  el.addEventListener('touchmove',  e=>{if(!tr)return;var dx=e.touches[0].clientX-sx,dy=e.touches[0].clientY-sy;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>10)e.preventDefault();},{passive:false});
  el.addEventListener('touchend',   e=>{if(!tr)return;tr=false;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){var idx=getIdx(el),pp=el.querySelectorAll('.page,.wine-card');if(dx<0&&idx>=pp.length-1){var wr=el.closest('.hscroll-wrapper'),nx=wr?wr.nextElementSibling:null;if(nx)navScrollTo(nx);}else{goPanel(el,idx+(dx<0?1:-1));}}},{passive:true});
});

/* Chevron arrows — first right chevron on manifesto gets bounce class */
(function() {
  var isFirst = true;
  ['manifesto-scroll','wines-scroll'].forEach(id => {
    var scrollEl = document.getElementById(id);
    if (!scrollEl) return;
    var wrapper = scrollEl.closest('.hscroll-wrapper');
    if (!wrapper) return;
    var lArr = document.createElement('div');
    lArr.className = 'scroll-chevron scroll-chevron-left';
    lArr.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
    var rArr = document.createElement('div');
    rArr.className = 'scroll-chevron scroll-chevron-right';
    rArr.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>';
    // Only first right chevron (manifesto) gets bounce
    if (isFirst) { rArr.classList.add('first-bounce'); isFirst = false; }
    wrapper.appendChild(lArr);
    wrapper.appendChild(rArr);
    function upd() {
      var pp=scrollEl.querySelectorAll('.page,.wine-card'), idx=getIdx(scrollEl);
      lArr.style.display = idx<=0?'none':'';
      // Last panel: right arrow navigates to next vertical section instead of disappearing
      if (idx >= pp.length-1) {
        rArr.style.display = '';
        rArr.style.opacity = '0.4';
        rArr.onclick = function() {
          var nextSection = wrapper.nextElementSibling;
          // skip dots containers
          while (nextSection && nextSection.classList.contains('hscroll-dots')) nextSection = nextSection.nextElementSibling;
          if (nextSection) navScrollTo(nextSection);
        };
      } else {
        rArr.style.opacity = '';
        rArr.onclick = () => goPanel(scrollEl, getIdx(scrollEl)+1);
      }
    }
    lArr.addEventListener('click', () => goPanel(scrollEl, getIdx(scrollEl)-1));
    scrollEl.addEventListener('scroll', () => requestAnimationFrame(upd));
    setTimeout(upd, 500);
  });
})();

/* Nav scroll */
var snapTimer = null;
function navScrollTo(target) {
  if (snapTimer) clearTimeout(snapTimer);
  document.documentElement.style.scrollSnapType = 'none';
  target.scrollIntoView({ behavior: 'smooth' });
  snapTimer = setTimeout(() => { document.documentElement.style.scrollSnapType = ''; snapTimer=null; }, 1200);
}

/* Hamburger */
var hamburgerBtn = document.getElementById('hamburger-btn');
var navOverlay   = document.getElementById('nav-overlay');
function toggleMenu() {
  hamburgerBtn.classList.toggle('open');
  navOverlay.classList.toggle('open');
  document.body.style.overflow = navOverlay.classList.contains('open') ? 'hidden' : '';
}
hamburgerBtn.addEventListener('click', toggleMenu);
document.querySelectorAll('#nav-links-list a, #nav .nav-logo').forEach(link => {
  link.addEventListener('click', function(e) {
    if (navOverlay.classList.contains('open')) toggleMenu();
    var href = this.getAttribute('href');
    if (!href || href[0]!=='#') return;
    var target = document.getElementById(href.substring(1));
    if (!target) return;
    e.preventDefault(); navScrollTo(target);
  });
});
document.querySelectorAll('.scroll-hint-down').forEach(el => {
  el.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    var t = document.getElementById(el.dataset.target);
    if (t) navScrollTo(t);
  });
});

/* Active nav */
var navLinks = document.querySelectorAll('#nav-links-list a');
var navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('active',
        a.getAttribute('href') === '#'+e.target.id ||
        (e.target.id==='m1' && a.getAttribute('href')==='#manifesto') ||
        (e.target.id==='wines-wrapper' && a.getAttribute('href')==='#wines-wrapper')
      ));
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('#m1,#hero,#wines-wrapper,#faces,#contact').forEach(el => navObs.observe(el));

/* CMS — wines only (faces managed via HTML for now) */
const SHEET_WINES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGec_ewoWxtdcEXP05iJm4v2LHOoyW5sZc2bSBRVMzX7vlJIX8duf1JD--qMhpihBVgHMnHJxrgwkL/pub?gid=1993474932&single=true&output=csv';
function driveUrl(u){if(!u)return'';var m=u.match(/\/d\/([a-zA-Z0-9_-]+)/)||u.match(/[?&]id=([a-zA-Z0-9_-]+)/);return m?'https://lh3.googleusercontent.com/d/'+m[1]+'=s1600':u;}
function joinCSVLines(t){var r=[],c='',q=false;for(var i=0;i<t.length;i++){var ch=t[i];if(ch==='"'){q=!q;c+=ch;}else if((ch==='\n'||(ch==='\r'&&t[i+1]==='\n'))&&q){c+=' ';if(ch==='\r')i++;}else if(ch==='\r'){}else if(ch==='\n'){r.push(c);c='';}else c+=ch;}if(c)r.push(c);return r;}
function splitRow(row){var r=[],c='',q=false;for(var i=0;i<row.length;i++){var ch=row[i];if(ch==='"'){if(q&&row[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){r.push(c);c='';}else c+=ch;}r.push(c);return r;}
function parseCSV(text){var rows=[],lines=joinCSVLines(text.trim()),hi=-1;for(var i=0;i<lines.length;i++){if(splitRow(lines[i])[0].replace(/^"|"$/g,'').trim().toLowerCase()==='id'){hi=i;break;}}if(hi===-1)return rows;var headers=splitRow(lines[hi]).map(h=>h.replace(/^"|"$/g,'').trim().split('\n')[0].replace(/\s*\(.*$/,'').trim().toLowerCase());for(var i=hi+1;i<lines.length;i++){var vals=splitRow(lines[i]);if(vals.every(v=>!v.trim()))continue;var fv=vals[0].replace(/^"|"$/g,'').trim();if(!fv||fv.charCodeAt(0)===0x25b8)continue;var obj={};headers.forEach((h,idx)=>{obj[h]=(vals[idx]||'').replace(/^"|"$/g,'').trim();});rows.push(obj);}return rows;}
async function fetchSheet(url){if(!url)return null;try{var r=await fetch(url);if(r.ok)return r.text();}catch(e){}var r2=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(url));if(!r2.ok)throw new Error('HTTP '+r2.status);return r2.text();}

function renderWineBody(body){var labels=['Story','Winemaking','Tasting Notes'],parts=body.split('|||').map(s=>s.trim()).filter(Boolean);if(parts.length>=3)return'<div class="wine-body">'+parts.slice(0,3).map((p,i)=>'<div class="wine-body-section"><p class="wine-body-label">'+labels[i]+'</p><p class="wine-body-text">'+p+'</p></div>').join('')+'</div>';return'<div class="wine-body"><p class="wine-body-text">'+body+'</p></div>';}

async function loadCMS(){
  try {
    var wines = parseCSV(await fetchSheet(SHEET_WINES));
    var vw = wines.filter(w=>w.name&&w.name.trim());
    if (!vw.length) return;
    var container = document.getElementById('wines-container');
    container.innerHTML = vw.map((w,i)=>{
      var specs=(w.specs||'').split('|').map(s=>s.trim()).filter(Boolean);
      var bSrc=driveUrl(w.img_bottle), bHtml=bSrc?'<div class="wine-bottle-area"><img src="'+bSrc+'" alt="'+w.name+' bottle" loading="lazy"></div>':'';
      var cSlug=(w.collection||'').toLowerCase().trim(), cBadge=w.collection?'<span class="wine-collection">'+w.collection+'</span>':'';
      var vRaw=w.vintages||'2024 | 2025 coming soon';
      var vHtml=vRaw.split('|').map((v,vi)=>{v=v.trim();var s=vi<vRaw.split('|').length-1?'<span class="wine-vintage-sep"></span>':'';return v.toLowerCase().includes('coming soon')?'<span class="wine-vintage-soon">'+v+'</span>'+s:'<span class="wine-vintage-year">'+v+'</span>'+s;}).join('');
      return'<article class="wine-card reveal" id="'+(w.id||'w'+i)+'" data-collection="'+cSlug+'"><div class="wine-card-inner"><p class="wine-number">'+(w.number||'')+' '+cBadge+'</p><div class="wine-name">'+(w.name||'')+'</div><div class="wine-vintages">'+vHtml+'</div><p class="wine-type">'+(w.type||'')+'</p><hr class="wine-slash">'+renderWineBody(w.body||'')+'<div class="wine-specs wine-specs-row1">'+specs.slice(0,3).map(s=>'<div class="wine-spec">'+s+'</div>').join('')+'</div><div class="wine-specs wine-specs-row2">'+specs.slice(3).map(s=>'<div class="wine-spec">'+s+'</div>').join('')+'</div></div>'+bHtml+'</article>';
    }).join('');
    container.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
    if (wScroll && wDots) setupDots(wScroll, wDots);
  } catch(e) { console.warn('[CMS] wines', e); }
}
loadCMS();
