
/* ---------------------------- 7. 画布与镜头 ---------------------------- */
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d', { alpha: false });
let W = 1, H = 1, DPR = 1, UX = 1;
let QUALITY = 0;                                    // 自动画质档位：帧率不足时逐级降
const Q_DRAW = [336, 264, 204], Q_DPR = [2, 1.5, 1.2], Q_PIX = [5.4e6, 3.6e6, 2.4e6];
const cam = { pos: -4.4, x: 0, y: CAM_H, f: 576, hy: 300, hy0: 300, cx: 640, cxT: 640, pz: 4.4, Xc: 0, sc: 0, dist: 0, T: 0, pal: 0, sh: 0, shx: 0, shy: 0, bob: 0 };
const targetCx = () => (G.state === 'title' && W / H > 1.1 ? W * 0.66 : W / 2);
function resize() {
  const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
  /* 限制画布总像素：大屏 Retina 下若按 2 倍渲染，填充量过大会掉帧、画面发卡 */
  DPR = Math.max(0.75, Math.min(window.devicePixelRatio || 1, Q_DPR[QUALITY], Math.sqrt(Q_PIX[QUALITY] / (vw * vh))));
  W = Math.max(1, Math.round(vw * DPR)); H = Math.max(1, Math.round(vh * DPR));
  cvs.width = W; cvs.height = H;
  UX = H / 720;
  const a = vw / vh, k = clamp((a - 0.75) / 0.75, 0, 1);
  cam.f = H * lerp(0.45 * a, 0.8, k);                 // 焦距：横屏看得远，竖屏保证三条车道都在画面内
  cam.pz = lerp(3.2, 4.4, k);                         // 小猫在镜头前方的距离
  cam.hy0 = H * lerp(0.72, 0.82, k) - cam.f * CAM_H / cam.pz;
  cam.cxT = targetCx();
  if (Math.abs(cam.cxT - cam.cx) > W) cam.cx = cam.cxT;
}
function updateCamera(dt) {
  const g = segAt(cam.pos), l = cam.pos - g.z1;
  cam.Xc = g.X1 + g.s1 * l + 0.5 * g.kappa * l * l;
  cam.sc = g.s1 + g.kappa * l;
  cam.y = lerp(g.Y1, g.Y2, clamp(l / SEG_LEN, 0, 1)) + CAM_H;
  cam.cx += (cam.cxT - cam.cx) * (1 - Math.exp(-dt * 4));
  const tx = G.state === 'title' ? 0 : G.catX * 0.1;    // 镜头只轻微跟随小猫，跟太多会让整屏横移
  cam.x += (tx - cam.x) * (1 - Math.exp(-dt * 7));
  cam.sh *= Math.exp(-dt * 7);
  cam.shy = (Math.random() - 0.5) * cam.sh * 18 * UX;
  cam.hy = cam.hy0 + cam.bob + cam.shy;
  cam.dist = cam.pos + cam.pz; cam.T = timeAt(cam.dist); cam.pal = palIdAt(cam.dist);
}
/* 赛道中线在 z 处相对镜头轴线的横向偏移（已扣除镜头处的切线方向） */
function Xrel(z) { const g = segAt(z), l = z - g.z1; return g.X1 + g.s1 * l + 0.5 * g.kappa * l * l - cam.Xc - cam.sc * (z - cam.pos); }
/* 统一投影：世界点 (x, y, z) → 屏幕 {x, y, s}；s = 像素/米 */
function pt(x, y, z) {
  const dz = z - cam.pos; if (dz < 0.05) return null;
  const s = cam.f / dz;
  return { x: cam.cx + s * (x - cam.x + Xrel(z)), y: cam.hy + s * (cam.y - y), g: cam.hy + s * cam.y, s, dz };
}
/* 盒体（楼宇 / 箱子 / 汽车）八个角在屏幕上的位置 */
function boxGeo(z, xl, xr, yb, yt, d) {
  let dzN = z - cam.pos; if (dzN < 0.7) dzN = 0.7;
  const sN = cam.f / dzN, sF = cam.f / (dzN + d);
  const xN = Xrel(cam.pos + dzN) - cam.x, xF = Xrel(cam.pos + dzN + d) - cam.x;
  return { dzN, d, sN, sF, xN, xF, l: xl, r: xr, yt,
    LN: cam.cx + sN * (xl + xN), RN: cam.cx + sN * (xr + xN), LF: cam.cx + sF * (xl + xF), RF: cam.cx + sF * (xr + xF),
    ybN: cam.hy + sN * (cam.y - yb), ytN: cam.hy + sN * (cam.y - yt), ybF: cam.hy + sF * (cam.y - yb), ytF: cam.hy + sF * (cam.y - yt) };
}
function sidePt(g, xs, t, y) {
  const dz = g.dzN + t * g.d, s = cam.f / dz, x = g.xN + (g.xF - g.xN) * t;
  return [cam.cx + s * (xs + x), cam.hy + s * (cam.y - y)];
}
function sideQuad(g, xs, t0, t1, y0, y1) {
  const a = sidePt(g, xs, t0, y1), b = sidePt(g, xs, t1, y1), c = sidePt(g, xs, t1, y0), e = sidePt(g, xs, t0, y0);
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
}

/* ---------------------------- 8. 可见切片 ---------------------------- */
const SL = [];
function slicePt(z) {
  const dz = z - cam.pos, s = cam.f / dz, g = segAt(z), t = clamp((z - g.z1) / SEG_LEN, 0, 1);
  return { x: cam.cx + s * (Xrel(z) - cam.x), y: cam.hy + s * (cam.y - lerp(g.Y1, g.Y2, t)), g: cam.hy + s * cam.y, s, dz };
}
/* 近处每 3m 一片，远处逐级合并；近→远投影并标记被坡顶遮挡的切片 */
function buildSlices() {
  SL.length = 0;
  const DD = Q_DRAW[QUALITY];
  let i = clamp(((cam.pos - Z_START) / SEG_LEN) | 0, 0, NSEG - 1), maxy = H * 2;
  while (i < NSEG) {
    const g = SEGS[i], dz1 = g.z1 - cam.pos;
    if (dz1 > DD) break;
    const lvl = dz1 < 72 ? 0 : dz1 < 150 ? 1 : dz1 < 240 ? 2 : 3, step = 1 << lvl;
    const end = Math.min(NSEG - 1, (((i / step) | 0) + 1) * step - 1), e = SEGS[end];
    const zA = Math.max(g.z1, cam.pos + 0.25), A = slicePt(zA), B = slicePt(e.z2);
    const zm = (zA + e.z2) * 0.5, fog = fogAt(zm - cam.pos, DD);
    const hidden = B.y >= A.y || B.y >= maxy;
    if (!hidden) maxy = B.y;
    let pier = 0;
    for (let k = i; k <= end; k++) if (SEGS[k].pier) pier = SEGS[k].pier;
    SL.push({ A, B, z1: g.z1, z2: e.z2, i1: i, i2: end, lvl, fog, hidden, palId: g.palId, zone: zm < RAMP_UP[0] ? 0 : zm < Z_SHOP ? 1 : 2, par: (i >> 1) & 1, single: end === i, pier, zm });
    i = end + 1;
  }
}

/* ---------------------------- 9. 背景：天空 / 日月 / 远景 / 地面底色 ---------------------------- */
const STARS = [], CLOUDS = [], BIRDS = [];
(function () {
  const r = mulberry32(99); for (let i = 0; i < 110; i++) STARS.push({ x: r(), y: r() * 0.9, s: 0.7 + r() * 1.5, p: r() * TAU });
  for (let i = 0; i < 7; i++) CLOUDS.push({ x: r(), y: 0.1 + r() * 0.62, w: 0.07 + r() * 0.09, sp: 0.003 + r() * 0.005, k: 0.75 + r() * 0.6 });
  for (let i = 0; i < 6; i++) BIRDS.push({ x: r(), y: 0.12 + r() * 0.4, sp: 0.012 + r() * 0.014, ph: r() * TAU, s: 0.7 + r() * 0.6 });
})();
const CLOUD_COL = ['#FFFFFF', '#FFC9B4', '#8F74B0', '#2A3162'].map(hex);
const SUN_A = hex('#FFF3B8'), SUN_B = hex('#FF7E4A');
const SKY_INK = hex('#1E2748');
let bgShift = 0, MOON = null;
const COL_H = [];
function drawBackground() {
  const d = cam.dist, Tc = cam.T, P = PALS[cam.pal], hy = cam.hy, f = cam.f;
  const sk = ctx.createLinearGradient(0, 0, 0, Math.max(1, hy));
  sk.addColorStop(0, rgb(P[0])); sk.addColorStop(0.6, rgb(P[1])); sk.addColorStop(1, rgb(P[2]));
  ctx.fillStyle = sk; ctx.fillRect(0, 0, W, hy + 1);
  const na = smooth(0.8, 0.99, Tc);
  if (na > 0.01) {
    ctx.fillStyle = '#FFFBE8';
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i], a = na * (0.3 + 0.7 * Math.abs(Math.sin(T * 1.3 + s.p)));
      if (a < 0.04) continue;
      ctx.globalAlpha = a; ctx.fillRect(s.x * W, s.y * hy, s.s * UX, s.s * UX);
    }
    ctx.globalAlpha = 1;
  }
  /* 太阳：一路向海平线落下 */
  const k = smooth(200, 600, d), sx = cam.cx + f * 0.56 - bgShift * 0.12, sy = hy * lerp(0.2, 1.12, k);
  const glowK = 1 - smooth(560, 790, d);
  if (glowK > 0.01) {
    const R = f * (0.9 + 0.5 * k), sc = mixC(SUN_A, SUN_B, k);
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
    g.addColorStop(0, rgba(sc, 0.5 * glowK)); g.addColorStop(0.25, rgba(sc, 0.18 * glowK)); g.addColorStop(1, rgba(sc, 0));
    ctx.fillStyle = g; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
    if (k < 0.999) {
      ctx.fillStyle = rgb(mixC(sc, [255, 255, 255], 0.25));
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(9, H * 0.04) * lerp(1, 1.3, k), 0, TAU); ctx.fill();
    }
  }
  /* 月亮：预渲染的月牙贴图 */
  const ma = smooth(700, 830, d);
  if (ma > 0.01) {
    const mx = cam.cx - f * 0.52 - bgShift * 0.12, my = hy * 0.2, mr = Math.max(9, H * 0.036);
    if (!MOON) {
      MOON = document.createElement('canvas'); MOON.width = MOON.height = 128;
      const mc = MOON.getContext('2d');
      mc.fillStyle = '#FFF6D8'; mc.beginPath(); mc.arc(64, 64, 44, 0, TAU); mc.fill();
      mc.globalCompositeOperation = 'destination-out'; mc.beginPath(); mc.arc(64 + 21, 64 - 7, 41, 0, TAU); mc.fill();
    }
    const R = mr * 6, g = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, R);
    g.addColorStop(0, 'rgba(255,246,216,' + 0.3 * ma + ')'); g.addColorStop(1, 'rgba(255,246,216,0)');
    ctx.fillStyle = g; ctx.fillRect(mx - R, my - R, R * 2, R * 2);
    ctx.globalAlpha = ma; ctx.drawImage(MOON, mx - mr * 1.45, my - mr * 1.45, mr * 2.9, mr * 2.9); ctx.globalAlpha = 1;
  }
  /* 云 */
  const cc = keys4(CLOUD_COL, Tc), ca = lerp(0.96, 0.5, smooth(0.6, 0.9, Tc));
  ctx.fillStyle = rgb(cc); ctx.globalAlpha = ca;
  const span = W * 1.5, coff = bgShift * 0.12 + T * 7 * UX;
  for (let i = 0; i < CLOUDS.length; i++) {
    const c = CLOUDS[i], x = ((((c.x * span - coff - c.sp * T * W) % span) + span) % span) - W * 0.25, y = c.y * hy, w = c.w * W * c.k;
    const r1 = w * 0.2, r2 = w * 0.32, r3 = w * 0.2, x0 = x - (r1 + r2 + r3);
    ctx.beginPath(); ctx.moveTo(x0, y);
    ctx.arc(x0 + r1, y, r1, Math.PI, 0, false); ctx.arc(x0 + 2 * r1 + r2, y - r2 * 0.18, r2, Math.PI, 0, false); ctx.arc(x0 + 2 * r1 + 2 * r2 + r3, y, r3, Math.PI, 0, false);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
  /* 海鸥（白天才有） */
  const ba = 1 - smooth(0.1, 0.3, Tc);
  if (ba > 0.02) {
    ctx.strokeStyle = rgba(SKY_INK, 0.55 * ba); ctx.lineWidth = 1.6 * UX; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < BIRDS.length; i++) {
      const b = BIRDS[i], x = ((b.x * W + T * b.sp * W - bgShift * 0.2) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1, y = b.y * hy + Math.sin(T * 0.7 + b.ph) * 6 * UX;
      const u = 7 * UX * b.s, fp = Math.sin(T * 7 + b.ph) * 3.4 * UX;
      ctx.moveTo(x - u, y); ctx.quadraticCurveTo(x - u * 0.5, y - 3 * UX - fp, x, y); ctx.quadraticCurveTo(x + u * 0.5, y - 3 * UX - fp, x + u, y);
    }
    ctx.stroke();
  }
  /* 远景两层：山丘 + 城市天际线，随弯道轻微视差 */
  const cityK = smooth(0.05, 0.42, Tc), hillAmp = lerp(1.45, 0.45, cityK);
  const offA = bgShift * 0.2;
  ctx.fillStyle = rgb(mixC(P[2], P[0], 0.3)); ctx.beginPath();
  for (let x = -6; x <= W + 6; x += 6) {
    const wx = (x + offA) / H;
    const h = Math.max(0, 0.035 + 0.03 * Math.sin(wx * 2.3 + 1.3) + 0.018 * Math.sin(wx * 5.1 + 0.4) + 0.008 * Math.sin(wx * 12.7 + 2.1)) * H * hillAmp;
    if (x < 0) ctx.moveTo(x, hy - h); else ctx.lineTo(x, hy - h);
  }
  ctx.lineTo(W + 6, hy + 2); ctx.lineTo(-6, hy + 2); ctx.closePath(); ctx.fill();
  const offB = bgShift * 0.38, bw = Math.max(7, H * 0.02), k0 = Math.floor(offB / bw) - 1, k1 = Math.ceil((offB + W) / bw) + 1, cs = lerp(0.12, 1, cityK);
  ctx.fillStyle = rgb(mixC(P[2], P[0], 0.52)); ctx.beginPath();
  for (let n = k0; n <= k1; n++) {
    const r = hash2(n, 71), r2 = hash2(n, 133), wx = (n * bw - offB) / H;
    const prof = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(wx * 0.9 + 0.7) * Math.cos(wx * 0.37));
    const h = (0.035 + r * r * 0.21) * H * cs * prof, x = n * bw - offB;
    COL_H[n - k0] = h;
    ctx.rect(x, hy - h, bw + 0.6, h + 2);
    if (r2 > 0.72) ctx.rect(x + bw * 0.38, hy - h - H * 0.018, bw * 0.24, H * 0.018);
  }
  ctx.fill();
  const wa = smooth(0.72, 0.92, Tc);
  if (wa > 0.02) {
    ctx.fillStyle = 'rgba(255,214,140,' + 0.75 * wa.toFixed(3) + ')'; ctx.beginPath();
    const dot = Math.max(1, 1.3 * UX);
    for (let n = k0; n <= k1; n++) {
      const h = COL_H[n - k0], cnt = (h / (H * 0.022)) | 0, x = n * bw - offB;
      for (let j = 0; j < cnt; j++) if (hash2(n * 31 + j, 905) < 0.42) ctx.rect(x + bw * (0.15 + 0.7 * hash2(j, n)), hy - h * hash2(n, j * 7 + 1) - dot, dot, dot);
    }
    ctx.fill();
  }
  /* 地面底色：远处融入地平线雾色 */
  const gg = ctx.createLinearGradient(0, hy, 0, H), DD = Q_DRAW[QUALITY], gh = Math.max(0.5, cam.y);
  gg.addColorStop(0, rgb(P[2]));
  for (const dd of [240, 165, 105, 65, 38]) {
    const y = hy + f * gh / dd;
    if (y <= hy + 1 || y >= H) continue;
    gg.addColorStop(clamp((y - hy) / (H - hy), 0, 1), fogged(P[KP.ground], fogAt(dd, DD)));
  }
  gg.addColorStop(1, rgb(P[KP.ground]));
  ctx.fillStyle = gg; ctx.fillRect(0, hy, W, H - hy);
}
