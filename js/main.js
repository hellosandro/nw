/* ── SCROLL REVEAL ── */
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
  var facesEl = document.getElementById('faces');
  var cur = 0, autoT = null;
  function startAuto() { if (autoT) return; autoT = setInterval(autoAdvance, 5000); }
  function stopAuto()  { if (autoT) { clearInterval(autoT); autoT = null; } }
  function autoAdvance() { goTo((cur + 1) % slides.length); }
  function goTo(idx) {
    if (idx >= slides.length) {
      stopAuto();
      var next = facesEl ? facesEl.nextElementSibling : null;
      if (next) navScrollTo(next);
      return;
    }
    slides[cur].classList.remove('active'); dots[cur].classList.remove('active');
    cur = (idx + slides.length) % slides.length;
    slides[cur].classList.add('active'); dots[cur].classList.add('active');
    stopAuto(); startAuto();
  }
  document.getElementById('faces-prev').addEventListener('click', () => goTo(cur - 1));
  document.getElementById('faces-next').addEventListener('click', () => goTo(cur + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.idx)));
  var ss = document.getElementById('faces-slideshow'), sx = 0;
  ss.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  ss.addEventListener('touchend',   e => { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) goTo(dx < 0 ? cur+1 : cur-1); }, { passive: true });
  if (facesEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) startAuto(); else stopAuto(); });
    }, { threshold: 0.3 }).observe(facesEl);
  } else {
    startAuto();
  }
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

function setupDots(scrollEl, dotsEl, counterEl, controlsEl) {
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
  var total = pp.length;
  function syncControls(idx) {
    if (counterEl) counterEl.textContent = (idx+1) + ' / ' + total;
    if (controlsEl) {
      var panel = pp[idx];
      controlsEl.style.backgroundColor = getComputedStyle(panel).backgroundColor;
      controlsEl.classList.toggle('on-dark', panel.id === 'credo');
      controlsEl.classList.toggle('on-last', idx === total - 1);
    }
  }
  syncControls(0);
  var rafPending = false;
  scrollEl.addEventListener('scroll', function() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function() {
      rafPending = false;
      var idx = getIdx(scrollEl);
      dots.forEach((d,i) => d.classList.toggle('active', i===idx));
      syncControls(idx);
    });
  });
}

var mScroll   = document.getElementById('manifesto-scroll');
var mDots     = document.getElementById('manifesto-dots');
var mCounter  = document.getElementById('manifesto-counter');
var mControls = document.querySelector('.manifesto-controls');
var wScroll   = document.getElementById('wines-scroll');
var wDots     = document.getElementById('wines-dots');
if (mScroll && mDots) setupDots(mScroll, mDots, mCounter, mControls);
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
    var arrowsHost = id === 'manifesto-scroll' ? document.getElementById('manifesto-arrows') : wrapper;
    arrowsHost.appendChild(lArr);
    arrowsHost.appendChild(rArr);
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

/* Nav theme: white text/hamburger when a dark section sits under the bar */
(function() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var darkZones = document.querySelectorAll('#hero, #faces');
  if (!darkZones.length) return;
  function update() {
    var navH = nav.getBoundingClientRect().height;
    var onDark = false;
    darkZones.forEach(function(el) {
      var r = el.getBoundingClientRect();
      if (r.top < navH && r.bottom > 0) { onDark = true; }
    });
    nav.classList.toggle('on-dark', onDark);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

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

/* CMS — config (Sheet1) + wines — served via Vercel Edge Function (no CORS) */
const SHEET_CONFIG = '/api/cms?sheet=config';
const SHEET_WINES  = '/api/cms?sheet=wines';
function driveUrl(u){if(!u)return'';var m=u.match(/\/d\/([a-zA-Z0-9_-]+)/)||u.match(/[?&]id=([a-zA-Z0-9_-]+)/);return m?'https://lh3.googleusercontent.com/d/'+m[1]+'=s1600':u;}
function joinCSVLines(t){var r=[],c='',q=false;for(var i=0;i<t.length;i++){var ch=t[i];if(ch==='"'){q=!q;c+=ch;}else if((ch==='\n'||(ch==='\r'&&t[i+1]==='\n'))&&q){c+=' ';if(ch==='\r')i++;}else if(ch==='\r'){}else if(ch==='\n'){r.push(c);c='';}else c+=ch;}if(c)r.push(c);return r;}
function splitRow(row){var r=[],c='',q=false;for(var i=0;i<row.length;i++){var ch=row[i];if(ch==='"'){if(q&&row[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){r.push(c);c='';}else c+=ch;}r.push(c);return r;}
function parseCSV(text){var rows=[],lines=joinCSVLines(text.trim()),hi=-1;for(var i=0;i<lines.length;i++){if(splitRow(lines[i])[0].replace(/^"|"$/g,'').trim().toLowerCase()==='id'){hi=i;break;}}if(hi===-1)return rows;var headers=splitRow(lines[hi]).map(h=>h.replace(/^"|"$/g,'').trim().split('\n')[0].replace(/\s*\(.*$/,'').trim().toLowerCase());for(var i=hi+1;i<lines.length;i++){var vals=splitRow(lines[i]);if(vals.every(v=>!v.trim()))continue;var fv=vals[0].replace(/^"|"$/g,'').trim();if(!fv||fv.charCodeAt(0)===0x25b8)continue;var obj={};headers.forEach((h,idx)=>{obj[h]=(vals[idx]||'').replace(/^"|"$/g,'').trim();});rows.push(obj);}return rows;}
async function fetchSheet(url){
  if(!url)return null;
  var ctrl=new AbortController();
  var tid=setTimeout(()=>ctrl.abort(),10000);
  var r=await fetch(url,{signal:ctrl.signal});
  clearTimeout(tid);
  if(!r.ok)throw new Error('fetchSheet: '+r.status);
  return r.text();
}

function parseConfig(text){
  var cfg={}, lines=joinCSVLines(text.trim());
  lines.forEach(function(line){
    var row=splitRow(line);
    var key=(row[0]||'').replace(/^"|"$/g,'').trim();
    var val=(row[1]||'').replace(/^"|"$/g,'').trim();
    if(!key||key.charCodeAt(0)===0x25b8)return;
    cfg[key]=val;
  });
  return cfg;
}

// No silent failures: loadConfig and loadCMS let exceptions propagate so
// broken sheets / network / DOM surface immediately in the devtools console.
async function loadConfig(){
  var cfg = parseConfig(await fetchSheet(SHEET_CONFIG));
  if(!Object.keys(cfg).length) throw new Error('[CMS] config sheet returned no rows');
  document.querySelectorAll('[data-cms]').forEach(function(el){
    var key = el.dataset.cms;
    if(cfg[key] !== undefined && cfg[key] !== ''){
      if(el.dataset.cms.endsWith('_sub') && cfg[key].indexOf('\\n') > -1){
        el.innerHTML = cfg[key].replace(/\\n/g,'<br>');
      } else {
        el.textContent = cfg[key];
      }
    }
  });
  document.querySelectorAll('[data-cms-email]').forEach(function(el){
    var key = el.dataset.cmsEmail;
    if(cfg[key]) el.href = 'mailto:'+cfg[key];
  });
}

// ── Wine card v3 rendering (single source of truth: the CMS sheet) ──
// Required CMS columns per wine:
//   id, collection, name, type, body, img_bottle,
//   variety, appellation, origin, altitude, soil, vinification,
//   production, alcohol, volume
// Shape:
//   body    → exactly 3 non-empty parts separated by "||"
//             (Story || Winemaking || Tasting Notes)
//   details → one labeled row per field (variety..production)
//   footer  → "{volume}  alc.{alcohol}% by vol."
//   slug    → derived from `collection` (lowercased, accents stripped)
function slugify(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').trim();
}
function escAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function requireField(w, field){
  var v = (w[field] || '').trim();
  if(!v) throw new Error('[CMS] wine "'+(w.id || '?')+'" missing required field: '+field);
  return v;
}
var WINE_DETAIL_FIELDS = [
  ['variety',      'Variety'],
  ['appellation',  'Appellation'],
  ['origin',       'Origin'],
  ['altitude',     'Altitude'],
  ['soil',         'Soil'],
  ['vinification', 'Vinification'],
  ['production',   'Production']
];
function renderWineV3(w){
  var id       = requireField(w, 'id');
  var coll     = requireField(w, 'collection');
  var name     = requireField(w, 'name');
  var type     = requireField(w, 'type');
  var bodyRaw  = requireField(w, 'body');
  var imgRaw   = requireField(w, 'img_bottle');
  var alcohol  = requireField(w, 'alcohol');
  var volume   = requireField(w, 'volume');

  var slug = slugify(coll);

  var body = bodyRaw.split('||').map(function(s){ return s.trim(); });
  if(body.length !== 3 || !body[0] || !body[1] || !body[2]){
    throw new Error('[CMS] wine "'+id+'" body must split into exactly 3 non-empty parts on "||" (got '+body.length+')');
  }

  var detailsHtml = WINE_DETAIL_FIELDS.map(function(f){
    var val = requireField(w, f[0]);
    return ''
      + '<div class="wine-detail-row">'
        + '<span class="wine-detail-label">'+f[1]+'</span>'
        + '<span class="wine-detail-value">'+val+'</span>'
      + '</div>';
  }).join('');

  var imgSrc = driveUrl(imgRaw);
  var plainName = name.replace(/<[^>]+>/g, '');

  return ''
    + '<article class="wine-card wine-card-v3 reveal" id="'+escAttr(id)+'" data-collection="'+escAttr(slug)+'">'
      + '<div class="wine-col-main">'
        + '<span class="wine-collection">'+coll+' Collection</span>'
        + '<div class="wine-name">'+name+'</div>'
        + '<p class="wine-type">'+type+'</p>'
        + '<div class="wine-col-texts">'
          + '<div><p class="wine-body-label">Story</p><p class="wine-body-text">'+body[0]+'</p></div>'
          + '<div><p class="wine-body-label">Winemaking</p><p class="wine-body-text">'+body[1]+'</p></div>'
          + '<div><p class="wine-body-label">Tasting Notes</p><p class="wine-body-text">'+body[2]+'</p></div>'
        + '</div>'
      + '</div>'
      + '<div class="wine-col-details">'
        + detailsHtml
        + '<div class="wine-detail-footer">'+volume+'&nbsp;&nbsp;alc.'+alcohol+'% by vol.</div>'
      + '</div>'
      + '<div class="wine-col-bottle">'
        + '<img src="'+escAttr(imgSrc)+'" alt="'+escAttr(plainName)+' bottle" loading="lazy">'
      + '</div>'
    + '</article>';
}

async function loadCMS(){
  var container = document.getElementById('wines-container');
  if(!container) throw new Error('[CMS] #wines-container not found in DOM');

  var wines = parseCSV(await fetchSheet(SHEET_WINES));
  var valid = wines.filter(function(w){ return w.name && w.name.trim(); });
  if(!valid.length) throw new Error('[CMS] wines sheet returned no rows with a name');

  container.innerHTML = valid.map(renderWineV3).join('');
  container.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
  if(wScroll && wDots) setupDots(wScroll, wDots);
}

loadConfig();
loadCMS();
