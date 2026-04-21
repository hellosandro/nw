/* ── SCROLL REVEAL ── */
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
document.querySelectorAll('#m1 .reveal').forEach((el, i) => {
  setTimeout(() => el.classList.add('on'), 150 + i * 120);
});

/* ── FACES GALLERY WALL (free horizontal scroll + arrows/dots + lightbox) ── */
// Called once, AFTER loadFaces() has (possibly) replaced the hardcoded
// fallback figures with CMS-driven ones — so querySelectorAll sees the
// final set of items.
function initFaces() {
  var wall = document.getElementById('faces-wall');
  if (!wall) return;
  if (wall.dataset.initialized === '1') return;
  wall.dataset.initialized = '1';

  var items = wall.querySelectorAll('.faces-item');

  // Mouse drag-to-scroll. Track whether a real drag happened so we can
  // suppress the synthesised click that would otherwise open the lightbox.
  var dragging = false, dragged = false, startX = 0, startScroll = 0;
  wall.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    dragging = true; dragged = false;
    startX = e.pageX;
    startScroll = wall.scrollLeft;
    wall.classList.add('dragging');
  });
  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    if (Math.abs(e.pageX - startX) > 5) dragged = true;
    wall.scrollLeft = startScroll - (e.pageX - startX);
  });
  window.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    wall.classList.remove('dragging');
  });

  // Vertical wheel → horizontal scroll (only when the wall actually overflows)
  wall.addEventListener('wheel', function(e) {
    if (wall.scrollWidth <= wall.clientWidth + 2) return;
    var absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
    if (absY <= absX) return;
    var canRight = wall.scrollLeft < wall.scrollWidth - wall.clientWidth - 1;
    var canLeft  = wall.scrollLeft > 0;
    if ((e.deltaY > 0 && canRight) || (e.deltaY < 0 && canLeft)) {
      e.preventDefault();
      wall.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // ── Arrows + dots ──
  var arrowsHost = document.getElementById('faces-arrows');
  var dotsEl    = document.getElementById('faces-dots');
  if (arrowsHost && dotsEl && items.length) {
    // Build dots
    dotsEl.innerHTML = '';
    items.forEach(function(_, i) {
      var d = document.createElement('span');
      d.className = 'dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', function() { scrollToItem(i); });
      dotsEl.appendChild(d);
    });
    var dots = dotsEl.querySelectorAll('.dot');

    // Build arrows
    var lArr = document.createElement('div');
    lArr.className = 'scroll-chevron scroll-chevron-left';
    lArr.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
    var rArr = document.createElement('div');
    rArr.className = 'scroll-chevron scroll-chevron-right';
    rArr.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>';
    arrowsHost.insertBefore(lArr, dotsEl);
    arrowsHost.appendChild(rArr);

    function currentIdx() {
      var center = wall.scrollLeft + wall.clientWidth / 2;
      var best = 0, bd = Infinity;
      items.forEach(function(it, i) {
        var c = it.offsetLeft + it.offsetWidth / 2;
        var d = Math.abs(c - center);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }
    function scrollToItem(i) {
      var item = items[Math.max(0, Math.min(i, items.length - 1))];
      var target = item.offsetLeft + item.offsetWidth / 2 - wall.clientWidth / 2;
      target = Math.max(0, Math.min(target, wall.scrollWidth - wall.clientWidth));
      smoothTo(wall, target, 420);
    }
    lArr.addEventListener('click', function() { scrollToItem(currentIdx() - 1); });
    rArr.addEventListener('click', function() { scrollToItem(currentIdx() + 1); });

    function syncNav() {
      var idx = currentIdx();
      dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
      lArr.classList.toggle('is-disabled', wall.scrollLeft < 4);
      rArr.classList.toggle('is-disabled', wall.scrollLeft > wall.scrollWidth - wall.clientWidth - 4);
    }
    var rafPending = false;
    wall.addEventListener('scroll', function() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function() { rafPending = false; syncNav(); });
    });
    syncNav();
  }

  // ── Lightbox ──
  var lb       = document.getElementById('faces-lightbox');
  var lbImg    = document.getElementById('faces-lightbox-img');
  var lbClose  = document.getElementById('faces-lightbox-close');
  var lbPrev   = document.getElementById('faces-lightbox-prev');
  var lbNext   = document.getElementById('faces-lightbox-next');
  if (lb && lbImg && items.length) {
    var photos = Array.prototype.map.call(items, function(it) {
      var img = it.querySelector('img');
      return {
        src: img ? (img.getAttribute('data-full-src') || img.getAttribute('src')) : '',
        alt: img ? img.getAttribute('alt') : ''
      };
    });
    var lbIdx = 0;
    function showPhoto(i) {
      lbIdx = (i + photos.length) % photos.length;
      var p = photos[lbIdx];
      lbImg.src = p.src;
      lbImg.alt = p.alt || '';
    }
    function openLb(i) {
      showPhoto(i);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeLb() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    // Event delegation: the click might land on the wall instead of the item
    // if a CSS rule toggles pointer-events during the drag cycle. Listening on
    // the wall catches both cases and then maps back to the matching item.
    wall.addEventListener('click', function(e) {
      if (dragged) return;
      var it = e.target && e.target.closest ? e.target.closest('.faces-item') : null;
      if (!it) return;
      var i = Array.prototype.indexOf.call(items, it);
      if (i >= 0) openLb(i);
    });
    lbClose.addEventListener('click', closeLb);
    lbPrev.addEventListener('click', function() { showPhoto(lbIdx - 1); });
    lbNext.addEventListener('click', function() { showPhoto(lbIdx + 1); });
    lb.addEventListener('click', function(e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function(e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape')    closeLb();
      if (e.key === 'ArrowLeft') showPhoto(lbIdx - 1);
      if (e.key === 'ArrowRight') showPhoto(lbIdx + 1);
    });
  }
}

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

function setupDots(scrollEl, dotsEl, controlsEl) {
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
    if (controlsEl) {
      var panel = pp[idx];
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
var mControls = document.querySelector('.manifesto-controls');
var wScroll   = document.getElementById('wines-scroll');
var wDots     = document.getElementById('wines-dots');
if (mScroll && mDots) setupDots(mScroll, mDots, mControls);
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
    // Let the current panel consume vertical scroll before hijacking horizontally.
    // Only applies to vertical-intent wheels; horizontal trackpad swipes keep hijacking immediately.
    if (!isH && isD) {
      var panel = pp[idx];
      if (panel) {
        var canDown = panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1;
        var canUp   = panel.scrollTop > 0;
        if ((delta>0 && canDown) || (delta<0 && canUp)) { accum=0; return; }
      }
    }
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
    var arrowsHost = document.getElementById(id === 'manifesto-scroll' ? 'manifesto-arrows' : 'wines-arrows');
    // Left arrow before the dots, right arrow after — so row is [L | dots | R]
    arrowsHost.insertBefore(lArr, arrowsHost.firstChild);
    arrowsHost.appendChild(rArr);
    var isManifesto = id === 'manifesto-scroll';
    function upd() {
      var pp=scrollEl.querySelectorAll('.page,.wine-card'), idx=getIdx(scrollEl);
      // Keep arrow slots in place; toggle visibility only so positions never shift.
      lArr.style.visibility = idx<=0 ? 'hidden' : 'visible';
      if (idx >= pp.length-1) {
        if (isManifesto) {
          // Manifesto: hide right arrow but preserve its slot (no shift)
          rArr.style.visibility = 'hidden';
          rArr.onclick = null;
        } else {
          // Wines: right arrow stays (absolutely positioned) and jumps to next section
          rArr.style.visibility = 'visible';
          rArr.style.opacity = '0.4';
          rArr.onclick = function() {
            var nextSection = wrapper.nextElementSibling;
            while (nextSection && nextSection.classList.contains('hscroll-dots')) nextSection = nextSection.nextElementSibling;
            if (nextSection) navScrollTo(nextSection);
          };
        }
      } else {
        rArr.style.visibility = 'visible';
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
  var darkZones = document.querySelectorAll('#hero');
  if (!darkZones.length) return;
  function update() {
    var navH = nav.getBoundingClientRect().height;
    var onDark = false;
    darkZones.forEach(function(el) {
      var r = el.getBoundingClientRect();
      if (r.top < navH && r.bottom > navH) { onDark = true; }
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

/* CMS — config + wines + faces — served via Netlify redirects (no CORS) */
const SHEET_CONFIG = '/api/cms?sheet=config';
const SHEET_WINES  = '/api/cms?sheet=wines';
const SHEET_FACES  = '/api/cms?sheet=faces';
function driveUrl(u){if(!u)return'';var m=u.match(/\/d\/([a-zA-Z0-9_-]+)/)||u.match(/[?&]id=([a-zA-Z0-9_-]+)/);return m?'https://lh3.googleusercontent.com/d/'+m[1]+'=s1600':u;}
function joinCSVLines(t){var r=[],c='',q=false;for(var i=0;i<t.length;i++){var ch=t[i];if(ch==='"'){q=!q;c+=ch;}else if((ch==='\n'||(ch==='\r'&&t[i+1]==='\n'))&&q){c+=' ';if(ch==='\r')i++;}else if(ch==='\r'){}else if(ch==='\n'){r.push(c);c='';}else c+=ch;}if(c)r.push(c);return r;}
function splitRow(row){var r=[],c='',q=false;for(var i=0;i<row.length;i++){var ch=row[i];if(ch==='"'){if(q&&row[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){r.push(c);c='';}else c+=ch;}r.push(c);return r;}
function parseCSV(text,headerFirstCell){var key=(headerFirstCell||'id').toLowerCase();var rows=[],lines=joinCSVLines(text.trim()),hi=-1;for(var i=0;i<lines.length;i++){if(splitRow(lines[i])[0].replace(/^"|"$/g,'').trim().toLowerCase()===key){hi=i;break;}}if(hi===-1)return rows;var headers=splitRow(lines[hi]).map(h=>h.replace(/^"|"$/g,'').trim().split('\n')[0].replace(/\s*\(.*$/,'').trim().toLowerCase());for(var i=hi+1;i<lines.length;i++){var vals=splitRow(lines[i]);if(vals.every(v=>!v.trim()))continue;var fv=vals[0].replace(/^"|"$/g,'').trim();if(!fv||fv.charCodeAt(0)===0x25b8)continue;var obj={};headers.forEach((h,idx)=>{obj[h]=(vals[idx]||'').replace(/^"|"$/g,'').trim();});rows.push(obj);}return rows;}
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
//   id, collection, name, subtitle, body, img_bottle,
//   vintages, type, variety, appellation, origin, altitude, soil,
//   vinification, production, alcohol, volume
// Shape:
//   subtitle → single line rendered under the wine name
//   body    → exactly 3 non-empty parts separated by "||"
//             (Story || Winemaking || Tasting Notes)
//   details → one labeled row per field (vintages, type, variety..production)
//   footer  → "{volume}  alc.{alcohol}% by vol."
//   slug    → derived from `collection` (lowercased, accents stripped)
function slugify(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').trim();
}
function escAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
// Read collection blurbs from the "Three Philosophies" slide so wine cards
// and that slide share a single source of truth. Populated in loadCMS().
var COLLECTION_DESCRIPTIONS = {};
function readCollectionDescriptions(){
  var map = {};
  document.querySelectorAll('.collection-item-v2').forEach(function(item){
    var nameEl = item.querySelector('.collection-name-v2');
    var descEl = item.querySelector('.collection-desc-v2');
    if(!nameEl || !descEl) return;
    var name = (nameEl.textContent || '').trim();
    var desc = (descEl.textContent || '').trim();
    if(name && desc) map[slugify(name)] = desc;
  });
  return map;
}
function requireField(w, field){
  var v = (w[field] || '').trim();
  if(!v) throw new Error('[CMS] wine "'+(w.id || '?')+'" missing required field: '+field);
  return v;
}
var WINE_DETAIL_FIELDS = [
  ['vintages',     'Vintages'],
  ['type',         'Type'],
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
  var subtitle = requireField(w, 'subtitle');
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
        + '<div class="big sm">'+name+'</div>'
        + '<p class="wine-type wine-subtitle">'+subtitle+'</p>'
        + '<div class="wine-col-texts">'
          + '<div><p class="wine-body-label">Story</p><p class="wine-body-text">'+body[0]+'</p></div>'
          + '<div><p class="wine-body-label">Winemaking</p><p class="wine-body-text">'+body[1]+'</p></div>'
          + '<div><p class="wine-body-label">Tasting Notes</p><p class="wine-body-text">'+body[2]+'</p></div>'
        + '</div>'
      + '</div>'
      + '<div class="wine-col-details">'
        + '<span class="wine-collection">'+coll+' Collection</span>'
        + (COLLECTION_DESCRIPTIONS[slug] ? '<p class="wine-collection-desc">'+escAttr(COLLECTION_DESCRIPTIONS[slug])+'</p>' : '')
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

  COLLECTION_DESCRIPTIONS = readCollectionDescriptions();
  container.innerHTML = valid.map(renderWineV3).join('');
  container.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
  if(wScroll && wDots) setupDots(wScroll, wDots);
}

// ── Faces & Places rendering ──────────────────────────────────────────────
// CMS columns (faces tab): oredr, img_url, label, text
// - img_url: Google Drive share link; converted to lh3.googleusercontent.com
//   and routed through Netlify Image CDN for AVIF/WebP + CDN caching.
// - Polaroid uses w=800, lightbox uses w=1600 (via data-full-src).
// Fallback: on CMS failure or zero rows, the hardcoded <figure>s in
// sections/faces.html stay on screen. initFaces() wires scroll/lightbox
// against whatever figures exist at call time.
function driveIdFromUrl(u){
  if(!u) return '';
  var m = u.match(/\/d\/([a-zA-Z0-9_-]+)/) || u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}
function cdnImage(rawUrl, width){
  var id = driveIdFromUrl(rawUrl);
  var src = id ? 'https://lh3.googleusercontent.com/d/' + id : rawUrl;
  return '/.netlify/images?url=' + encodeURIComponent(src) + '&w=' + width;
}
function renderFace(row){
  var raw = (row.img_url || '').trim();
  if(!raw) return '';
  var label = (row.label || '').trim();
  var text  = (row.text  || '').trim();
  var thumb = cdnImage(raw, 800);
  var full  = cdnImage(raw, 1600);
  var alt   = label || 'Nisyros Wines photo';
  return ''
    + '<figure class="faces-item">'
      + '<div class="faces-polaroid">'
        + '<img src="'+escAttr(thumb)+'" data-full-src="'+escAttr(full)+'" alt="'+escAttr(alt)+'" loading="lazy" draggable="false">'
      + '</div>'
      + (label || text
        ? '<figcaption class="faces-caption">'
          + (label ? '<p class="faces-label">'+escAttr(label)+'</p>' : '')
          + (text  ? '<p class="faces-text">'+escAttr(text)+'</p>'   : '')
        + '</figcaption>'
        : '')
    + '</figure>';
}
async function loadFaces(){
  var wall = document.getElementById('faces-wall');
  if(!wall) return;
  try {
    var rows = parseCSV(await fetchSheet(SHEET_FACES), 'oredr');
    var valid = rows.filter(function(r){ return r.img_url && r.img_url.trim(); });
    if(!valid.length){
      console.warn('[CMS] faces sheet returned 0 rows with img_url — keeping hardcoded fallback');
      return;
    }
    var header = wall.querySelector('.faces-wall-header');
    wall.querySelectorAll('.faces-item').forEach(function(el){ el.remove(); });
    wall.insertAdjacentHTML('beforeend', valid.map(renderFace).join(''));
    if(header && header !== wall.firstElementChild) wall.insertBefore(header, wall.firstElementChild);
  } catch (e) {
    console.warn('[CMS] faces load failed, using fallback:', e);
  }
}

loadConfig();
loadCMS();
loadFaces().then(initFaces);
