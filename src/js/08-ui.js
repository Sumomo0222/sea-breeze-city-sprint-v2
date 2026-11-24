
/* ---------------------------- 21. 界面 ---------------------------- */
const $ = id => document.getElementById(id);
const el = {};
'hud,hearts,progFill,progCat,distNow,practiceTag,coins,coinbox,time,speed,btnMute,btnPause,banner,bcard,bNum,bName,bEn,countdown,title,btnStart,best,result,stars,newBest,rTime,rCoins,rHits,rScore,rBest,btnAgain,btnShare,over,oDist,oDist2,oCoins,oTime,btnRetry,btnHome,pause,btnResume,btnRestart,btnSound,btnHome2,toast,touch,btnLeft,btnJump,btnRight'
  .split(',').forEach(id => { el[id] = $(id); });
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21.2C7.6 18.1 2.4 13.9 2.4 9.3 2.4 6.2 4.8 4 7.5 4c1.8 0 3.4.9 4.5 2.4C13.1 4.9 14.7 4 16.5 4c2.7 0 5.1 2.2 5.1 5.3 0 4.6-5.2 8.8-9.6 11.9z"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const M_ON = 'M4 9v6h4l5 4V5L8 9H4zm12.3-1.9-1.3 1.6A5 5 0 0 1 17 12a5 5 0 0 1-2 3.3l1.3 1.6A7 7 0 0 0 19 12a7 7 0 0 0-2.7-4.9z';
const M_OFF = 'M4 9v6h4l5 4V5L8 9H4zm11.5 1.1-1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4-1.4-1.4 1.4z';
let muted = false, isTouch = false, hudCoins = -1, hudDist = -1, hudTime = '', hudSp = -1, toastT = 0;

function renderHearts() {
  el.hearts.innerHTML = HEART + HEART + HEART;
  const svgs = el.hearts.children;
  for (let i = 0; i < 3; i++) if (i >= G.lives) svgs[i].classList.add('off');
}
function updateHUD(force) {
  const d = Math.round(G.dist);
  if (d !== hudDist) { hudDist = d; el.distNow.textContent = d; }
  const p = (G.dist / FINISH_Z).toFixed(4);
  el.progFill.style.transform = 'scaleX(' + p + ')'; el.progCat.style.setProperty('--p', p);
  const t = fmtTime(G.time); if (t !== hudTime) { hudTime = t; el.time.textContent = t; }
  const sp = Math.round(G.speed * 3.6); if (sp !== hudSp) { hudSp = sp; el.speed.textContent = sp + ' km/h'; }
  if (force || G.coins !== hudCoins) { hudCoins = G.coins; el.coins.textContent = G.coins; }
}
function showBanner(i) {
  const s = STAGES[i];
  el.bNum.textContent = '0' + (i + 1); el.bName.textContent = s.n; el.bEn.textContent = s.en;
  el.bcard.className = 'bcard s' + i;
  el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show');
}
function toast(msg) {
  el.toast.textContent = msg; el.toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.toast.classList.remove('show'), 2600);
}
function countUp(node, to, dur, fmt) {
  const t0 = performance.now();
  const step = now => {
    const k = clamp((now - t0) / dur, 0, 1), v = to * (1 - Math.pow(1 - k, 3));
    node.innerHTML = fmt(k < 1 ? Math.round(v) : to);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function loadBest() { try { return JSON.parse(localStorage.getItem('sbcs2-best') || 'null'); } catch (e) { return null; } }
function saveBest(r) { try { localStorage.setItem('sbcs2-best', JSON.stringify(r)); } catch (e) { /* 隐私模式下忽略 */ } }
function updateBestLabel() {
  const b = loadBest();
  el.best.innerHTML = b ? '历史最佳 <b>' + b.score + ' 分</b><br>最快 ' + fmtTime(b.time) + ' · ' + '★'.repeat(b.stars) : '三条车道，三段风景<br>躲车 · 跳障 · 吃金币';
}
function resetRun(from) {
  for (let i = 0; i < ITEMS.length; i++) { ITEMS[i].dead = false; ITEMS[i].passed = false; }
  Object.assign(G, { speed: 0, lane: 1, catX: 0, y: 0, vy: 0, air: false, fast: false, jumpBuf: 0, lives: 3, coins: 0, score: 0, hits: 0,
    time: 0, inv: 0, squash: 0, ph: 0, lean: 0, stage: from >= STAGES[2].z ? 2 : from >= STAGES[1].z ? 1 : 0, first: 0, flash: 0, ft: 0,
    cheer: false, crouch: false, blinkOff: false, shown: false, practice: from > 0, stars: 0, bonus: 0 });
  G.dist = from; cam.pos = from - cam.pz; cam.x = 0; cam.sh = 0; cam.bob = 0;
  let k = 0; while (k < ITEMS.length && ITEMS[k].z < from - 8) k++;
  G.first = k;
  PARTS.length = TEXTS.length = CONF.length = 0;
  el.countdown.innerHTML = ''; el.banner.classList.remove('show');
  el.practiceTag.classList.toggle('show', from > 0);
  hudCoins = -1; renderHearts(); updateHUD(true);
}
function countdown(cb) {
  const seq = ['3', '2', '1', '冲！']; let i = 0;
  const next = () => {
    if (G.state !== 'ready') { el.countdown.innerHTML = ''; return; }
    el.countdown.classList.toggle('go', i === 3); el.countdown.innerHTML = '<span>' + seq[i] + '</span>'; SFX.tick(i === 3);
    if (i === 3) cb();
    if (++i < seq.length) setTimeout(next, 640); else setTimeout(() => { if (G.state !== 'ready') el.countdown.innerHTML = ''; }, 900);
  };
  next();
}
function startGame(from) {
  from = Math.max(0, Math.min(990, Math.round(+from) || 0));   // 起点只接受 0~990 的整数里程
  SFX.init(); SFX.click();
  paused = false; resetRun(from);
  el.title.classList.add('hidden'); el.result.classList.add('hidden'); el.over.classList.add('hidden'); el.pause.classList.add('hidden');
  el.hud.classList.remove('hidden'); el.touch.classList.toggle('hidden', !isTouch);
  G.state = 'ready'; cam.cxT = targetCx();
  countdown(() => {
    G.state = 'run';
    if (from > 0) Music.start(G.stage); else { G.stage = 0; Music.start(0); setTimeout(() => { if (G.state === 'run' && G.stage === 0 && G.dist < 60) showBanner(0); }, 800); }
  });
}
function toTitle() {
  SFX.click(); paused = false; Music.stop();
  resetRun(practiceFrom); G.state = 'title';
  el.result.classList.add('hidden'); el.over.classList.add('hidden'); el.pause.classList.add('hidden'); el.touch.classList.add('hidden');
  el.title.classList.remove('hidden'); el.hud.classList.add('hidden');
  cam.cxT = targetCx(); updateBestLabel();
}
function setPaused(v) {
  if (G.state !== 'run' || paused === v) return;
  paused = v; SFX.click();
  el.pause.classList.toggle('hidden', !v); el.touch.classList.toggle('hidden', v || !isTouch);
}
function setMuted(m) {
  muted = m; SFX.init(); SFX.setMuted(m);
  try { localStorage.setItem('sbcs2-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
  el.btnMute.querySelector('path').setAttribute('d', m ? M_OFF : M_ON);
  el.btnSound.textContent = '声音：' + (m ? '关' : '开');
}
function share() {
  SFX.click();
  const url = location.href.split(/[?#]/)[0];
  const text = '我在《海风城市冲刺》带小猫冲过 1000m 终点：' + fmtTime(G.time) + ' · ' + G.coins + ' 枚金币 · ' + '★'.repeat(G.stars) + ' · ' + G.score + ' 分。来挑战我！';
  if (isTouch && navigator.share) navigator.share({ title: '海风城市冲刺', text, url }).catch(() => {});
  else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text + ' ' + url).then(() => toast('成绩已复制，粘贴给朋友即可分享'), () => toast('复制失败，请手动复制地址栏链接'));
  else toast('分享链接：' + url);
}
function showResult() {
  G.shown = true;
  el.stars.innerHTML = STAR + STAR + STAR;
  el.newBest.classList.remove('show');
  const rec = loadBest(); let isBest = false;
  if (!G.practice) { isBest = !rec || G.score > rec.score; if (isBest) saveBest({ score: G.score, time: G.time, stars: G.stars, coins: G.coins }); }
  countUp(el.rTime, G.time, 700, v => v.toFixed(1) + '<small>s</small>');
  countUp(el.rCoins, G.coins, 700, v => v + '<small>/ ' + TOTAL_COINS.n + '</small>');
  el.rHits.innerHTML = G.hits + '<small>次</small>';
  countUp(el.rScore, G.score, 1100, v => v.toLocaleString('en-US'));
  const b = loadBest();
  el.rBest.innerHTML = G.practice ? '练习起跑不计入纪录' : (b ? '历史最佳 <b>' + b.score + ' 分</b> · 最快 ' + fmtTime(b.time) : '第一条完赛纪录已保存');
  el.result.classList.remove('hidden'); el.touch.classList.add('hidden');
  const svgs = el.stars.children;
  for (let i = 0; i < 3; i++) if (i < G.stars) setTimeout(() => { if (G.state === 'finish') { svgs[i].classList.add('on'); SFX.star(); } }, 650 + i * 330);
  if (isBest) el.newBest.classList.add('show');
}
function showOver() {
  G.shown = true;
  el.oDist.textContent = Math.round(G.dist) + ' m';
  countUp(el.oDist2, Math.round(G.dist), 700, v => v + '<small>m</small>');
  countUp(el.oCoins, G.coins, 700, v => v);
  el.oTime.innerHTML = fmtTime(G.time);
  el.over.classList.remove('hidden'); el.touch.classList.add('hidden');
}

/* ---------------------------- 22. 输入与主循环 ---------------------------- */
function init() {
  genCourse(); genWorld();
  if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');
  isTouch = document.body.classList.contains('touch');
  resize(); makeVignettes();
  const q = parseFloat(new URLSearchParams(location.search).get('from'));
  practiceFrom = isFinite(q) && q > 0 && q < 990 ? Math.round(q) : 0;
  try { muted = localStorage.getItem('sbcs2-muted') === '1'; } catch (e) { /* ignore */ }
  SFX.muted = muted;
  el.btnMute.querySelector('path').setAttribute('d', muted ? M_OFF : M_ON);
  el.btnSound.textContent = '声音：' + (muted ? '关' : '开');
  resetRun(practiceFrom); G.state = 'title'; updateBestLabel();

  el.btnStart.addEventListener('click', () => startGame(practiceFrom));
  el.btnAgain.addEventListener('click', () => startGame(practiceFrom));
  el.btnRetry.addEventListener('click', () => startGame(practiceFrom));
  el.btnHome.addEventListener('click', toTitle); el.btnHome2.addEventListener('click', toTitle);
  el.btnShare.addEventListener('click', share);
  el.btnResume.addEventListener('click', () => setPaused(false));
  el.btnRestart.addEventListener('click', () => { if (paused) { paused = false; el.pause.classList.add('hidden'); } startGame(practiceFrom); });
  el.btnSound.addEventListener('click', () => setMuted(!muted));
  el.btnMute.addEventListener('click', () => setMuted(!muted));
  el.btnPause.addEventListener('click', () => setPaused(!paused));
  for (const [id, fn] of [['btnLeft', () => goLane(-1)], ['btnRight', () => goLane(1)], ['btnJump', doJump]]) {
    const b = el[id];
    b.addEventListener('pointerdown', e => { e.preventDefault(); SFX.init(); fn(); });
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  window.addEventListener('keydown', e => {
    const k = e.code;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Space') e.preventDefault();
    if (e.repeat) return;
    if (k === 'ArrowLeft' || k === 'KeyA') goLane(-1);
    else if (k === 'ArrowRight' || k === 'KeyD') goLane(1);
    else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space') { if (G.state === 'title') startGame(practiceFrom); else doJump(); }
    else if (k === 'ArrowDown' || k === 'KeyS') doFall();
    else if (k === 'KeyP' || k === 'Escape') setPaused(!paused);
    else if (k === 'KeyM') setMuted(!muted);
    else if (k === 'Enter') { if (G.state === 'title') startGame(practiceFrom); else if (paused) setPaused(false); }
  });
  let tS = null;
  window.addEventListener('touchstart', e => {
    if (e.target.closest('button, .panel')) return;
    const t = e.changedTouches[0]; tS = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener('touchend', e => {
    if (!tS) return;
    const t = e.changedTouches[0], dx = t.clientX - tS.x, dy = t.clientY - tS.y; tS = null;
    if (G.state !== 'run') return;
    if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) goLane(dx > 0 ? 1 : -1);
    else if (dy < -26) doJump();
    else if (dy > 26) doFall();
    else if (Math.hypot(dx, dy) < 12) doJump();
  }, { passive: true });
  window.addEventListener('touchmove', e => { if (!e.target.closest('.panel')) e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', () => { resize(); makeVignettes(); });
  window.addEventListener('orientationchange', () => setTimeout(() => { resize(); makeVignettes(); }, 250));
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
  document.addEventListener('contextmenu', e => { if (e.target === cvs) e.preventDefault(); });

  requestAnimationFrame(frame);
}
let last = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  let dt = (ts - last) / 1000; last = ts;
  if (!(dt > 0) || dt > 0.05) dt = 0.016;
  if (!paused) update(dt);
  render();
}
/* 调试 / 预览入口：SPRINT.start(700) 直接从灯牌街区起跑 */
window.SPRINT = { start: startGame, G };
init();
