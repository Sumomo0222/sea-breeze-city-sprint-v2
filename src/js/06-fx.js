
/* ---------------------------- 18. 特效 ---------------------------- */
const PARTS = [], TEXTS = [], CONF = [], LINES = [];
for (let i = 0; i < 18; i++) LINES.push({ a: Math.random() * TAU, r: Math.random(), len: 0.05 + Math.random() * 0.12, sp: 0.6 + Math.random() * 0.8, w: 1 + Math.random() * 1.6 });
let fxDt = 0.016, VIG = null, FLASH = null;
/* 系统开了「减少动态效果」时，关闭速度线并去掉受击抖动 */
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function makeVignettes() {
  VIG = document.createElement('canvas'); VIG.width = Math.max(2, W >> 1); VIG.height = Math.max(2, H >> 1);
  FLASH = document.createElement('canvas'); FLASH.width = VIG.width; FLASH.height = VIG.height;
  const w = VIG.width, h = VIG.height, R = Math.hypot(w, h) * 0.62;
  let g = VIG.getContext('2d'), gr = g.createRadialGradient(w / 2, h / 2, R * 0.45, w / 2, h / 2, R);
  gr.addColorStop(0, 'rgba(10,14,36,0)'); gr.addColorStop(1, 'rgba(10,14,36,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g = FLASH.getContext('2d'); gr = g.createRadialGradient(w / 2, h / 2, R * 0.3, w / 2, h / 2, R);
  gr.addColorStop(0, 'rgba(255,70,56,0)'); gr.addColorStop(0.6, 'rgba(255,70,56,0.18)'); gr.addColorStop(1, 'rgba(255,70,56,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
function addPart(x, y, vx, vy, life, r, col, g) {
  if (PARTS.length > 280) PARTS.shift();
  PARTS.push({ x, y, vx, vy, life, max: life, r, col, g: g || 0 });
}
function addText(x, y, txt, col, size, key) {
  if (TEXTS.length > 12) TEXTS.shift();
  const t = { x, y, txt, col, life: 0.95, max: 0.95, size, n: 0, key };
  TEXTS.push(t);
  return t;
}
/* 连续吃金币时分数在同一个飘字上累加，避免小猫头顶叠出一摞 +10 */
function coinText(x, y) {
  const t = TEXTS.find(o => o.key === 'coin' && o.life > 0.45);
  if (t) { t.n += 10; t.txt = '+' + t.n; t.life = t.max; t.size = Math.min(34, t.size + 0.6); t.x = x; return; }
  const nt = addText(x, y - 18 * UX, '+10', '#FFE680', 24, 'coin');
  nt.n = 10;
}
function burst(x, y, n, col, sp) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = sp * (0.35 + Math.random() * 0.8) * UX;
    addPart(x, y, Math.cos(a) * v, Math.sin(a) * v - sp * 0.35 * UX, 0.32 + Math.random() * 0.3, (1.6 + Math.random() * 2.6) * UX, col, 520 * UX);
  }
}
function dust(n) {
  const cz = cam.pos + cam.pz, gp = pt(G.catX, roadY(cz), cz); if (!gp) return;
  const k = clamp(gp.s / 130, 0.4, 1.6);
  for (let i = 0; i < n; i++) addPart(gp.x + (Math.random() - 0.5) * 26 * k * UX, gp.y - 2 * UX, (Math.random() - 0.5) * 110 * UX, (-15 - Math.random() * 55) * UX, 0.3 + Math.random() * 0.25, (2.5 + Math.random() * 3.5) * k * UX, [236, 232, 220], -30 * UX);
}
const CONF_COLS = [[255, 106, 77], [255, 200, 61], [31, 168, 224], [47, 209, 160], [255, 79, 168], [255, 248, 232]];
function confetti() {
  for (let i = 0; i < 150; i++) CONF.push({ x: W * (0.15 + Math.random() * 0.7), y: -20 * UX - Math.random() * H * 0.35, vx: (Math.random() - 0.5) * 190 * UX, vy: (60 + Math.random() * 280) * UX, w: (6 + Math.random() * 6) * UX, h: (4 + Math.random() * 5) * UX, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, col: CONF_COLS[i % CONF_COLS.length], ph: Math.random() * TAU });
}
function updateFX(dt) {
  fxDt = dt;
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i]; p.life -= dt;
    if (p.life <= 0) { PARTS[i] = PARTS[PARTS.length - 1]; PARTS.pop(); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = TEXTS.length - 1; i >= 0; i--) { const t = TEXTS[i]; t.life -= dt; t.y -= 64 * UX * dt; if (t.life <= 0) TEXTS.splice(i, 1); }
  for (let i = CONF.length - 1; i >= 0; i--) {
    const c = CONF[i]; c.vy += 300 * UX * dt; c.vy *= Math.exp(-dt * 0.9); c.x += (c.vx + Math.sin(T * 5 + c.ph) * 60 * UX) * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
    if (c.y > H + 30) CONF.splice(i, 1);
  }
}
function drawFX() {
  const sa = !REDUCED && G.state === 'run' ? smooth(20, 23, G.speed) * 0.12 : 0;
  if (sa > 0.02) {
    const cx = cam.cx, cy = cam.hy, R = Math.hypot(W, H) * 0.62;
    ctx.lineCap = 'round';
    for (let i = 0; i < LINES.length; i++) {
      const l = LINES[i];
      l.r += l.sp * fxDt * 1.2; if (l.r > 1) { l.r = 0.34 + Math.random() * 0.22; l.a = Math.random() * TAU; }
      const r0 = l.r * R, r1 = r0 + l.len * R, ca = Math.cos(l.a), si = Math.sin(l.a);
      ctx.strokeStyle = 'rgba(255,255,255,' + (sa * clamp((l.r - 0.34) * 2.4, 0, 1)).toFixed(3) + ')'; ctx.lineWidth = l.w * UX;
      ctx.beginPath(); ctx.moveTo(cx + ca * r0, cy + si * r0 * 0.85); ctx.lineTo(cx + ca * r1, cy + si * r1 * 0.85); ctx.stroke();
    }
  }
  if (PARTS.length) for (let i = 0; i < PARTS.length; i++) {
    const p = PARTS[i], k = p.life / p.max;
    ctx.fillStyle = 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',' + (0.75 * k).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r * (0.5 + k * 0.5)), 0, TAU); ctx.fill();
  }
  if (CONF.length) {
    for (let i = 0; i < CONF.length; i++) {
      const c = CONF[i];
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.fillStyle = rgb(c.col); ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * (0.35 + 0.65 * Math.abs(Math.sin(T * 6 + c.ph)))); ctx.restore();
    }
  }
  if (TEXTS.length) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (let i = 0; i < TEXTS.length; i++) {
      const t = TEXTS[i], k = t.life / t.max, sc = 1 + (1 - k) * 0.12;
      ctx.font = (t.size * sc).toFixed(1) + 'px ' + DISP; ctx.globalAlpha = clamp(k * 2.2, 0, 1);
      ctx.strokeStyle = 'rgba(30,39,72,0.9)'; ctx.lineWidth = 4.5 * UX; ctx.strokeText(t.txt, t.x, t.y);
      ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
  if (VIG) { ctx.globalAlpha = 0.6; ctx.drawImage(VIG, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (FLASH && G.flash > 0.02) { ctx.globalAlpha = G.flash; ctx.drawImage(FLASH, 0, 0, W, H); ctx.globalAlpha = 1; }
}

/* ---------------------------- 19. 游戏状态与规则 ---------------------------- */
const G = { state: 'title', speed: 0, lane: 1, catX: 0, y: 0, vy: 0, air: false, fast: false, jumpBuf: 0, lives: 3, coins: 0, score: 0, hits: 0,
  time: 0, dist: 0, inv: 0, squash: 0, ph: 0, lean: 0, stage: 0, first: 0, flash: 0, ft: 0, cheer: false, crouch: false, blinkOff: false,
  ear: 0, earT: 2.5, shown: false, practice: false, stars: 0, bonus: 0 };
let T = 0, paused = false, practiceFrom = 0;

function goLane(d) {
  if (G.state !== 'run') return;
  const nl = clamp(G.lane + d, 0, 2);
  if (nl !== G.lane) { G.lane = nl; SFX.woosh(); }
}
function doJump() {
  if (G.state !== 'run') return;
  if (!G.air) { G.air = true; G.fast = false; G.vy = 8.5; G.jumpBuf = 0; SFX.jump(); dust(3); }
  else G.jumpBuf = 0.15;
}
function doFall() { if (G.state === 'run' && G.air) G.fast = true; }
function coinScreen(it) {
  const p = pt(it.x, roadY(it.z) + it.y, it.z);
  return p ? [p.x, p.y] : [cam.cx, cam.hy0 + cam.f * CAM_H / cam.pz];
}
function collect(it) {
  it.dead = true; G.coins++; G.score += 10; SFX.coin();
  const q = coinScreen(it);
  burst(q[0], q[1], 6, [255, 228, 120], 250);
  coinText(q[0], q[1]);
  el.coinbox.classList.remove('bump'); void el.coinbox.offsetWidth; el.coinbox.classList.add('bump');
}
function hit(it) {
  G.lives--; G.hits++; G.inv = 1.5; G.speed *= 0.5; cam.sh = REDUCED ? 0 : 0.45; G.flash = 1; SFX.hit();
  const p = pt(it.x, roadY(it.z) + it.h * 0.6, it.z);
  if (p) { burst(p.x, p.y, 12, [255, 255, 255], 300); addText(p.x, p.y - 20 * UX, '哎呀！', '#FFFFFF', 26); }
  if (it.jump) it.dead = true;
  renderHearts();
  if (G.lives <= 0) { G.state = 'over'; G.ft = 0; G.shown = false; Music.stop(); SFX.over(); }
}
function collide(cz) {
  while (G.first < ITEMS.length && ITEMS[G.first].z + ITEMS[G.first].d < cz - 4) G.first++;
  for (let k = G.first; k < ITEMS.length; k++) {
    const it = ITEMS[k]; if (it.z > cz + 5) break; if (it.dead) continue;
    const dx = it.x - G.catX;
    if (it.kind === 'coin') {
      if (Math.abs(dx) < 0.9 && Math.abs(it.z - cz) < 1.25 && Math.abs(it.y - (G.y + 0.62)) < 0.9) collect(it);
      continue;
    }
    const half = (it.w + CAT_W) / 2 - 0.12;
    if (cz > it.z - 0.3 && cz < it.z + it.d + 0.3) {
      if (Math.abs(dx) < half) {
        if (G.y < it.h - 0.06) { if (G.inv <= 0) hit(it); }
        else if (!it.passed && cz > it.z + it.d * 0.5) {
          it.passed = true; G.score += 15; SFX.clear();
          const q = coinScreen(it); addText(q[0], q[1] - 34 * UX, '跃过 +15', '#BFF7FF', 21);
        }
      }
    } else if (!it.passed && cz > it.z + it.d + 0.3) it.passed = true;
  }
}
function finish() {
  G.state = 'finish'; G.ft = 0; G.shown = false;
  G.bonus = 500 + Math.max(0, Math.round((70 - G.time) * 15)); G.score += G.bonus;
  G.stars = G.hits === 0 ? 3 : G.hits === 1 ? 2 : 1;
  Music.stop(); SFX.finish(); confetti();
}
function earUpdate(dt) {
  G.earT -= dt;
  if (G.earT < -0.3) G.earT = 2 + Math.random() * 4;
  G.ear = G.earT < 0 ? Math.sin(G.earT * 42) * 0.32 : 0;
}
function update(dt) {
  T += dt; updateFX(dt);
  const st = G.state;
  if (st === 'title' || st === 'ready') { G.ph += dt * 1.4; earUpdate(dt); updateCamera(dt); return; }
  if (st === 'run') {
    G.time += dt;
    const target = lerp(13, 21.5, smooth(0, 880, G.dist));
    G.speed += clamp(target - G.speed, -99, 5.5 * dt);
  } else {
    G.speed = Math.max(0, G.speed - (st === 'over' ? 24 : 7.5) * dt);
    G.ft += dt;
    if (!G.shown) { if (st === 'finish' && G.ft > 1.7) showResult(); else if (st === 'over' && G.ft > 1.0) showOver(); }
  }
  cam.pos += G.speed * dt;
  const cz = cam.pos + cam.pz; G.dist = clamp(cz, 0, FINISH_Z);
  const tx = LANE_X[G.lane];
  G.catX += (tx - G.catX) * (1 - Math.exp(-dt * 14));
  G.lean += (clamp((tx - G.catX) * 0.2, -0.26, 0.26) - G.lean) * (1 - Math.exp(-dt * 16));
  if (G.air) {
    G.vy -= 26.6 * (G.fast ? 3.4 : 1) * dt; G.y += G.vy * dt;
    if (G.y <= 0) { G.y = 0; G.air = false; G.squash = 1; SFX.land(); dust(6); if (G.jumpBuf > 0) doJump(); }
  }
  G.jumpBuf = Math.max(0, G.jumpBuf - dt);
  G.squash *= Math.exp(-dt * 10); G.flash *= Math.exp(-dt * 3.2); G.inv = Math.max(0, G.inv - dt);
  G.blinkOff = G.inv > 0 && ((T * 14) | 0) % 2 === 0;
  const moving = G.speed > 0.6 && st !== 'over';
  if (moving && !G.air) {
    const f0 = Math.sin(G.ph);
    G.ph += dt * G.speed / 4.6 * TAU;
    if (st === 'run' && f0 >= 0 && Math.sin(G.ph) < 0) dust(1);
  }
  /* 镜头不做随步频的整屏起伏：那种 6~9Hz 的全画面晃动最容易让人晕 */
  G.cheer = st === 'finish'; G.crouch = st === 'ready' || st === 'over';
  earUpdate(dt);
  if (st === 'run') {
    collide(cz);
    const s = G.dist >= STAGES[2].z ? 2 : G.dist >= STAGES[1].z ? 1 : 0;
    if (s !== G.stage) { G.stage = s; showBanner(s); SFX.stage(); Music.setStage(s); }
    if (cz >= FINISH_Z) finish();
  }
  updateCamera(dt); updateHUD();
  if (dt > 0.027 && st === 'run' && T > 2) { if (++slowFrames > 50 && QUALITY < 2) { slowFrames = 0; QUALITY++; resize(); makeVignettes(); } }
  else slowFrames = Math.max(0, slowFrames - 2);
}
let slowFrames = 0;
