
/* ---------------------------- 15. 金币 ---------------------------- */
const GOLD = [255, 200, 61], GOLD_D = [196, 128, 22], GOLD_L = [255, 236, 150], COIN_INK = [150, 96, 16];
function drawCoin(it, fg) {
  const bob = Math.sin(T * 3 + it.ph) * 0.06, p = pt(it.x, roadY(it.z) + it.y + bob, it.z); if (!p) return;
  const r = p.s * 0.4, sp = Math.cos(T * 4.2 + it.ph), rx = r * Math.max(0.14, Math.abs(sp));
  /* 路面上的落影：让金币看起来贴在地面附近 */
  if (r > 3.5) {
    const q = pt(it.x, roadY(it.z), it.z), rx0 = q.s * 0.42 * (1 - it.y * 0.1);
    ctx.fillStyle = 'rgba(20,24,48,' + (0.24 * (1 - fg)).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(q.x, q.y, rx0, Math.max(0.8, rx0 * clamp((cam.y - roadY(it.z)) / q.dz, 0, 0.8)), 0, 0, TAU); ctx.fill();
  }
  if (r < 1.8) { ctx.fillStyle = fogged(GOLD, fg); ctx.fillRect(p.x - rx, p.y - r, rx * 2, r * 2); return; }
  /* 白天路面偏亮，光晕太强会发灰，随天色变暗再加强 */
  if (r > 7) drawGlow(GOLD_L, p.x, p.y, r * 2.6, 0.42 * (1 - fg) * smooth(0.35, 0.62, cam.T));
  ctx.fillStyle = fogged(GOLD_D, fg); ctx.beginPath(); ctx.ellipse(p.x + rx * 0.24 * (sp < 0 ? -1 : 1), p.y, rx, r, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fogged(GOLD, fg); ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, r, 0, 0, TAU); ctx.fill();
  if (rx > r * 0.5 && r > 12) {
    ctx.strokeStyle = fogged(COIN_INK, fg); ctx.lineWidth = Math.max(1, r * 0.14);
    ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * 0.68, r * 0.68, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = fogged(COIN_INK, fg);
    ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.18, rx * 0.26, r * 0.2, 0, 0, TAU); ctx.fill();
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(p.x + i * rx * 0.3, p.y - r * 0.2 + Math.abs(i) * r * 0.08, rx * 0.11, r * 0.13, 0, 0, TAU); ctx.fill(); }
  }
}

/* ---------------------------- 16. 障碍物 ---------------------------- */
const CONE_C = [255, 112, 40], CONE_W = [255, 255, 255], CONE_BASE = [40, 44, 58];
function drawCone(it, fg) {
  const z = it.z, ry = roadY(z), p = pt(it.x, ry, z); if (!p) return;
  const s = p.s, k = clamp((cam.y - ry) / p.dz, 0, 0.9), x = p.x, y = p.y;
  const F = c => fogged(c, fg);
  const b0 = pt(it.x - 0.31, ry, z - 0.31), b1 = pt(it.x + 0.31, ry, z - 0.31), b2 = pt(it.x + 0.31, ry, z + 0.31), b3 = pt(it.x - 0.31, ry, z + 0.31);
  if (b0 && b1 && b2 && b3) poly([[b0.x, b0.y], [b1.x, b1.y], [b2.x, b2.y], [b3.x, b3.y]], F(CONE_BASE));
  const rb = s * 0.24, rtp = s * 0.045, h = s * 0.7, ryb = Math.max(0.5, rb * k * 0.9);
  ctx.fillStyle = F(CONE_C); ctx.beginPath();
  ctx.moveTo(x - rb, y - s * 0.04); ctx.lineTo(x - rtp, y - h); ctx.lineTo(x + rtp, y - h); ctx.lineTo(x + rb, y - s * 0.04);
  ctx.ellipse(x, y - s * 0.04, rb, ryb, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  const r1 = lerp(rb, rtp, 0.34 / 0.7) * 1.04, r2 = lerp(rb, rtp, 0.48 / 0.7) * 1.04;
  ctx.fillStyle = F(CONE_W); ctx.beginPath();
  ctx.moveTo(x - r1, y - s * 0.34); ctx.lineTo(x - r2, y - s * 0.48); ctx.lineTo(x + r2, y - s * 0.48); ctx.lineTo(x + r1, y - s * 0.34);
  ctx.ellipse(x, y - s * 0.34, r1, Math.max(0.4, r1 * k * 0.9), 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  if (s > 30) {
    ctx.fillStyle = 'rgba(40,20,10,0.22)'; ctx.beginPath(); ctx.moveTo(x + rb, y - s * 0.04); ctx.lineTo(x + rtp, y - h); ctx.lineTo(x + rtp * 0.2, y - h); ctx.lineTo(x + rb * 0.2, y - s * 0.04); ctx.ellipse(x, y - s * 0.04, rb, ryb, 0, 0, Math.PI * 0.5); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = F(CONE_C); ctx.beginPath(); ctx.ellipse(x, y - h, rtp, Math.max(0.4, rtp * k * 0.6), 0, 0, TAU); ctx.fill();
}
const CRATE_SKIN = {
  cooler: { f: [244, 246, 248], lid: [46, 134, 222], trim: [208, 216, 226], ink: [30, 84, 160] },
  toolbox: { f: [232, 65, 46], lid: [190, 48, 34], trim: [60, 62, 72], ink: [250, 200, 60] },
  bin: { f: [62, 122, 94], lid: [44, 94, 70], trim: [38, 78, 58], ink: [230, 236, 230] },
};
function drawCrate(it, fg) {
  const sk = CRATE_SKIN[it.kind], ry = roadY(it.z), F = c => fogged(c, fg);
  const g = boxGeo(it.z, it.x - it.w / 2, it.x + it.w / 2, ry, ry + it.h, it.d), s = g.sN;
  boxDraw(g, F(sk.f), F(shC(sk.f, 0.78)), F(sk.lid));
  const fw = g.RN - g.LN, fh = g.ybN - g.ytN; if (fw < 12) return;
  if (it.kind === 'cooler') {
    ctx.fillStyle = F(sk.lid); ctx.fillRect(g.LN, g.ytN, fw, s * 0.2);
    ctx.fillStyle = F(sk.trim); rr(g.LN + fw * 0.3, g.ytN + s * 0.27, fw * 0.4, s * 0.1, s * 0.04); ctx.fill();
    ctx.strokeStyle = F(sk.ink); ctx.lineWidth = Math.max(1, s * 0.05); rr(g.LN + fw * 0.34, g.ytN + s * 0.3, fw * 0.32, s * 0.2, s * 0.06); ctx.stroke();
    ctx.fillStyle = F(sk.ink); ctx.beginPath(); ctx.ellipse(g.LN + fw * 0.5, g.ybN - s * 0.32, s * 0.17, s * 0.09, 0, 0, TAU); ctx.fill();
    poly([[g.LN + fw * 0.5 + s * 0.14, g.ybN - s * 0.32], [g.LN + fw * 0.5 + s * 0.3, g.ybN - s * 0.43], [g.LN + fw * 0.5 + s * 0.3, g.ybN - s * 0.21]], F(sk.ink));
  } else if (it.kind === 'toolbox') {
    ctx.fillStyle = F(sk.trim);
    ctx.fillRect(g.LN + fw * 0.14, g.ytN + s * 0.3, s * 0.12, s * 0.14); ctx.fillRect(g.RN - fw * 0.14 - s * 0.12, g.ytN + s * 0.3, s * 0.12, s * 0.14);
    ctx.fillRect(g.LN, g.ytN + s * 0.46, fw, s * 0.06);
    ctx.strokeStyle = F(sk.trim); ctx.lineWidth = Math.max(1, s * 0.06); rr(g.LN + fw * 0.32, g.ytN + s * 0.3, fw * 0.36, s * 0.18, s * 0.05); ctx.stroke();
    ctx.fillStyle = F(sk.ink); ctx.fillRect(g.LN + fw * 0.2, g.ybN - s * 0.3, fw * 0.6, s * 0.12);
  } else {
    ctx.fillStyle = F(sk.lid); ctx.fillRect(g.LN - s * 0.04, g.ytN, fw + s * 0.08, s * 0.16);
    ctx.fillStyle = F(sk.trim);
    for (let i = 1; i < 4; i++) ctx.fillRect(g.LN + fw * i * 0.25 - s * 0.03, g.ytN + s * 0.24, Math.max(1, s * 0.06), Math.max(1, fh - s * 0.34));
    ctx.fillStyle = F(sk.ink); ctx.beginPath(); ctx.ellipse(g.LN + fw * 0.5, g.ytN + s * 0.08, s * 0.1, s * 0.04, 0, 0, TAU); ctx.fill();
  }
}
const CARS = {
  icecream: { kind: 'van', body: [255, 178, 204], accent: [255, 240, 232], sign: '冰淇淋' },
  buggy: { kind: 'sedan', body: [255, 200, 61] },
  taxi: { kind: 'sedan', body: [255, 197, 49], taxi: 1 },
  sedan: { kind: 'sedan', body: [232, 71, 75] },
  teal: { kind: 'sedan', body: [43, 179, 163] },
  white: { kind: 'sedan', body: [240, 243, 246] },
  neonvan: { kind: 'van', body: [58, 42, 110], neon: [255, 79, 168] },
  black: { kind: 'sedan', body: [44, 48, 62] },
};
const GLASS = [36, 52, 88], TIRE = [28, 30, 38], LIGHT_R = [255, 64, 56], PLATE = [40, 84, 190];
function carLights(g, s, F, x1, x2, y, alpha) {
  ctx.fillStyle = F(LIGHT_R);
  rr(x1, y, s * 0.36, s * 0.16, s * 0.05); ctx.fill(); rr(x2 - s * 0.36, y, s * 0.36, s * 0.16, s * 0.05); ctx.fill();
  if (alpha > 0.03) { drawGlowE(LIGHT_R, x1 + s * 0.18, y + s * 0.08, s * 1.1, s * 0.5, alpha); drawGlowE(LIGHT_R, x2 - s * 0.18, y + s * 0.08, s * 1.1, s * 0.5, alpha); }
}
function drawCar(it, fg) {
  const sk = CARS[it.kind], x = it.x, z = it.z, ry = roadY(z), F = c => fogged(c, fg);
  const body = sk.body, sideC = shC(body, 0.74), topC = mixC(body, [255, 255, 255], 0.16);
  const nightK = smooth(0.5, 0.8, cam.T), blink = Math.sin(T * 7 + it.ph) > -0.2 ? 1 : 0.25;
  const wq = pt(x, ry, z); if (!wq) return;
  const ws = wq.s;
  ctx.fillStyle = F(TIRE);
  for (let sd = -1; sd <= 1; sd += 2) { rr(wq.x + sd * ws * 0.84 - ws * 0.2, wq.y - ws * 0.66, ws * 0.4, ws * 0.7, ws * 0.14); ctx.fill(); }
  if (sk.kind === 'van') {
    const g = boxGeo(z, x - 0.95, x + 0.95, ry, ry + 2.0, it.d), s = g.sN;
    const sd = boxDraw(g, F(body), F(sideC), F(mixC(sk.accent || body, [255, 255, 255], 0.3)));
    const fw = g.RN - g.LN;
    if (fw > 14) {
      ctx.fillStyle = F(GLASS);
      rr(g.LN + s * 0.2, g.ytN + s * 0.22, s * 0.52, s * 0.62, s * 0.08); ctx.fill(); rr(g.RN - s * 0.72, g.ytN + s * 0.22, s * 0.52, s * 0.62, s * 0.08); ctx.fill();
      ctx.fillStyle = F(shC(body, 0.82)); ctx.fillRect(g.LN + fw * 0.5 - s * 0.02, g.ytN + s * 0.18, Math.max(1, s * 0.04), s * 1.4);
      ctx.fillStyle = F(shC(body, 0.7)); ctx.fillRect(g.LN + s * 0.05, g.ybN - s * 0.44, fw - s * 0.1, s * 0.2);
      ctx.fillStyle = F(PLATE); ctx.fillRect(g.LN + fw * 0.5 - s * 0.23, g.ybN - s * 0.7, s * 0.46, s * 0.14);
      carLights(g, s, F, g.LN + s * 0.08, g.RN - s * 0.08, g.ybN - s * 1.05, 0.6 * nightK * blink * (1 - fg));
      if (sk.neon) { drawGlow(sk.neon, (g.LN + g.RN) / 2, g.ytN + s * 1.05, fw * 0.8, 0.45 * nightK * (1 - fg)); }
      if (sk.sign && s > 22) {
        const pw2 = s * 1.5, ph2 = s * 0.56, px = (g.LN + g.RN) / 2 - pw2 / 2, py = g.ybN - s * 1.62;
        rr(px, py, pw2, ph2, s * 0.1); ctx.fillStyle = F([255, 250, 236]); ctx.fill();
        ctx.lineWidth = Math.max(1, s * 0.05); ctx.strokeStyle = F(sk.accent || body); ctx.stroke();
        ctx.fillStyle = F([214, 84, 150]); ctx.font = Math.round(ph2 * 0.62) + 'px ' + DISP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sk.sign, (g.LN + g.RN) / 2, py + ph2 * 0.54);
      }
    }
    if (sd && s > 9) {
      const xw = sd > 0 ? g.l : g.r;
      ctx.fillStyle = F(sk.accent || [255, 240, 232]); ctx.beginPath(); sideQuad(g, xw, 0.08, 0.92, 0.9, 1.25); ctx.fill();
      ctx.fillStyle = F(GLASS); ctx.beginPath(); sideQuad(g, xw, 0.62, 0.9, 1.3, 1.85); ctx.fill();
      for (const t of [0.08, 0.78]) { const a = sidePt(g, xw, t + 0.09, 0.33), r = s * 0.36; ctx.fillStyle = F(TIRE); ctx.beginPath(); ctx.ellipse(a[0], a[1], r, r, 0, 0, TAU); ctx.fill(); }
    }
    return;
  }
  const gb = boxGeo(z, x - 0.92, x + 0.92, ry + 0.26, ry + 1.0, it.d), sb = gb.sN;
  const sd = boxDraw(gb, F(body), F(sideC), F(topC));
  const gc = boxGeo(z + 0.95, x - 0.78, x + 0.78, ry + 1.0, ry + 1.5, it.d - 2.1), sc = gc.sN;
  const sd2 = boxDraw(gc, F(body), F(sideC), F(sk.taxi ? [255, 255, 255] : topC));
  const cw = gc.RN - gc.LN;
  if (cw > 10) {
    ctx.fillStyle = F(GLASS); rr(gc.LN + sc * 0.12, gc.ytN + sc * 0.1, cw - sc * 0.24, sc * 0.34, sc * 0.08); ctx.fill();
    ctx.strokeStyle = F(shC(body, 0.8)); ctx.lineWidth = Math.max(1, sc * 0.03); ctx.beginPath(); ctx.moveTo(gc.LN + cw * 0.5, gc.ytN + sc * 0.1); ctx.lineTo(gc.LN + cw * 0.5, gc.ytN + sc * 0.44); ctx.stroke();
    if (sk.taxi) {
      const tw = sc * 0.62, th = sc * 0.2, tx = (gc.LN + gc.RN) / 2 - tw / 2, ty = gc.ytN - th - sc * 0.02;
      ctx.fillStyle = F([255, 255, 255]); rr(tx, ty, tw, th, sc * 0.04); ctx.fill();
      ctx.strokeStyle = rgb([30, 39, 72]); ctx.lineWidth = Math.max(1, sc * 0.02); ctx.stroke();
      if (th > 7) { ctx.fillStyle = rgb([30, 39, 72]); ctx.font = '800 ' + (th * 0.82).toFixed(1) + 'px ' + CJK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('的士', tx + tw / 2, ty + th / 2 + th * 0.04); }
    }
    const bw = gb.RN - gb.LN;
    if (bw > 14) {
      ctx.fillStyle = F(shC(body, 0.72)); ctx.fillRect(gb.LN + sb * 0.04, gb.ybN - sb * 0.22, bw - sb * 0.08, sb * 0.16);
      ctx.fillStyle = F(PLATE); ctx.fillRect(gb.LN + bw * 0.5 - sb * 0.23, gb.ybN - sb * 0.5, sb * 0.46, sb * 0.14);
      carLights(gb, sb, F, gb.LN + sb * 0.08, gb.RN - sb * 0.08, gb.ybN - sb * 0.78, 0.6 * nightK * blink * (1 - fg));
    }
  }
  if (sd && sb > 9) {
    const xw = sd > 0 ? gb.l : gb.r;
    ctx.fillStyle = F(GLASS);
    if (sd2) { const xw2 = sd2 > 0 ? gc.l : gc.r; ctx.beginPath(); sideQuad(gc, xw2, 0.1, 0.86, 1.08, 1.4); ctx.fill(); }
    for (const t of [0.02, 0.72]) { const a = sidePt(gb, xw, t + 0.08, 0.34), r = sb * 0.34; ctx.fillStyle = F(TIRE); ctx.beginPath(); ctx.ellipse(a[0], a[1], r, r, 0, 0, TAU); ctx.fill(); }
    if (sk.taxi && sb > 26) { ctx.beginPath(); sideQuad(gb, xw, 0.04, 0.96, 0.6, 0.76); ctx.fillStyle = F([30, 39, 72]); ctx.fill(); }
  }
}
function drawItem(it, fg) {
  it.fg = fg;
  switch (it.kind) {
    case 'coin': drawCoin(it, fg); break;
    case 'cone': drawCone(it, fg); break;
    case 'cooler': case 'toolbox': case 'bin': drawCrate(it, fg); break;
    default: drawCar(it, fg);
  }
}
