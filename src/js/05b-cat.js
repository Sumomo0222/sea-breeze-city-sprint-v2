
/* ---------------------------- 17. 小猫（背面视角，100 单位 = 猫高 1.3m） ---------------------------- */
const FUR = [246, 169, 75], FUR_D = [214, 122, 38], CREAM = [255, 243, 224], PINK = [255, 172, 186], CINK = [58, 32, 22], SCARF = [255, 77, 94], SCARF_D = [214, 52, 72];
function bez(p0, p1, p2, p3, t) {
  const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}
function drawCat(x, y, u, o) {
  const c = ctx, t = o.t, ph = o.ph, run = o.run, air = o.air, cheer = !!o.cheer;
  const liftL = !air && run ? Math.max(0, Math.sin(ph)) : 0, liftR = !air && run ? Math.max(0, Math.sin(ph + Math.PI)) : 0;
  const fur = rgb(FUR), ink = rgb(CINK), cream = rgb(CREAM), LW = 1.5;
  c.save();
  c.translate(x, y); c.rotate(o.lean || 0);
  c.scale(u * (1 + o.squash * 0.16), u * (1 - o.squash * 0.2));
  c.translate(0, -o.jy);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const limb = (x0, y0, x1, y1, w, col, cap) => {
    c.lineCap = cap || 'round';
    c.strokeStyle = ink; c.lineWidth = w + LW * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  };
  const hy = (o.crouch ? 10 : 0) + (run && !air ? -Math.abs(Math.sin(ph)) * 1.8 : 0) + (!run && !air && !cheer ? Math.sin(t * 2.2) * 1.1 : 0);
  /* 手臂：跑步时前后摆动，背视表现为两只手交替上下 */
  const sw = run && !air ? Math.sin(ph) * 7.5 : 0;
  const hL = air ? [-25, -61] : cheer ? [-27 + Math.sin(t * 11) * 2.4, -79] : [-24.5, -29 - sw];
  const hR = air ? [25, -61] : cheer ? [27 + Math.cos(t * 11) * 2.4, -79] : [24.5, -29 + sw];
  limb(-15, -44 + hy, hL[0], hL[1] + hy, 9.5, fur); limb(15, -44 + hy, hR[0], hR[1] + hy, 9.5, fur);
  c.fillStyle = cream; c.strokeStyle = ink; c.lineWidth = LW;
  for (const h of [hL, hR]) { c.beginPath(); c.arc(h[0], h[1] + hy, 5.3, 0, TAU); c.fill(); c.stroke(); }
  /* 腿和后脚掌 */
  const fL = air ? [-13, -15] : [-10.5 - liftL * 1.2, -5 - liftL * 10], fR = air ? [13, -15] : [10.5 + liftR * 1.2, -5 - liftR * 10];
  limb(-10, -17 + hy, fL[0], fL[1], 12.5, fur); limb(10, -17 + hy, fR[0], fR[1], 12.5, fur);
  c.fillStyle = cream;
  for (const f of [fL, fR]) { c.beginPath(); c.ellipse(f[0], f[1] + 1.5, 7, 5.6, 0, 0, TAU); c.fill(); c.stroke(); }
  /* 身体 */
  c.fillStyle = fur; c.lineWidth = LW;
  c.beginPath(); c.moveTo(-16, -48 + hy);
  c.bezierCurveTo(-22, -40 + hy, -22.5, -20 + hy, -14, -12 + hy);
  c.quadraticCurveTo(0, -7 + hy, 14, -12 + hy);
  c.bezierCurveTo(22.5, -20 + hy, 22, -40 + hy, 16, -48 + hy);
  c.quadraticCurveTo(0, -53 + hy, -16, -48 + hy);
  c.closePath(); c.fill(); c.stroke();
  /* 号码布 + 爪印 */
  rr(-9, -39.5 + hy, 18, 15, 4); c.fillStyle = rgb([255, 253, 245]); c.fill(); c.strokeStyle = rgb(SCARF_D); c.lineWidth = LW * 0.9; c.stroke();
  c.fillStyle = rgb(SCARF);
  c.beginPath(); c.ellipse(0, -32 + hy, 3.8, 3, 0, 0, TAU); c.fill();
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * 4, -36.8 + hy + Math.abs(i) * 0.8, 1.45, 1.75, 0, 0, TAU); c.fill(); }
  /* 尾巴：竖起的问号形，随奔跑左右摆 */
  const tw = Math.sin(t * (run ? 3.4 : 2.2));
  const p0 = [12, -11 + hy], p1 = [41, -6 + hy], p2 = [55, -46 + hy], p3 = [35 + tw * 6, -87 + hy - tw * 3];
  const tail = (t0, t1, w, col, cap) => {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.beginPath();
    let q = bez(p0, p1, p2, p3, t0); c.moveTo(q[0], q[1]);
    for (let k = 1; k <= 10; k++) { q = bez(p0, p1, p2, p3, t0 + (t1 - t0) * k / 10); c.lineTo(q[0], q[1]); }
    c.stroke();
  };
  tail(0, 1.1, 8 + LW * 2, ink, 'butt'); tail(0, 1, 8, fur, 'round');
  tail(0.46, 0.55, 8, rgb(FUR_D), 'butt'); tail(0.66, 0.75, 8, rgb(FUR_D), 'butt'); tail(0.86, 1, 8, rgb(FUR_D), 'round');
  /* 围巾：围脖 + 两条飘向左后方的巾尾 */
  const fl = run ? 1 : 0.35;
  limb(-4, -49 + hy, -17 + Math.sin(t * 9) * 3 * fl, -37 + Math.sin(t * 9 + 1) * 2, 5, rgb(SCARF));
  limb(-5, -48 + hy, -21 + Math.sin(t * 9 + 2) * 2.6 * fl, -29 + Math.cos(t * 9 + 1) * 2, 4.5, rgb(SCARF_D));
  limb(-12.5, -50 + hy, 12.5, -50 + hy, 7.5, rgb(SCARF));
  /* 耳朵：立在头顶的大三角耳。底边藏在头后面，外缘顺着头的轮廓向上收到耳尖 */
  c.translate(run && !air ? Math.sin(ph) * 1.2 : 0, 0);
  const earT = o.ear || 0;
  const ear = (sx, rot) => {
    c.save(); c.translate(sx * 13, -87 + hy); c.rotate(-sx * rot);
    c.fillStyle = fur; c.strokeStyle = ink; c.lineWidth = LW;
    c.beginPath(); c.moveTo(sx * 7, 6); c.lineTo(sx * 13, -23); c.lineTo(-sx * 4, -4); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = rgb(PINK); c.beginPath(); c.moveTo(sx * 6.5, -4); c.lineTo(sx * 9.4, -17.5); c.lineTo(-sx * 2.2, -6.5); c.closePath(); c.fill();
    c.restore();
  };
  ear(-1, earT); ear(1, earT * 0.4);
  /* 头 */
  c.fillStyle = fur; c.strokeStyle = ink; c.lineWidth = LW;
  c.beginPath(); c.ellipse(0, -72 + hy, 23.5, 21.5, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = rgb(FUR_D);
  c.beginPath(); c.moveTo(-3.2, -93 + hy); c.lineTo(3.2, -93 + hy); c.lineTo(0, -84.6 + hy); c.closePath(); c.fill();
  for (let sx = -1; sx <= 1; sx += 2) { c.beginPath(); c.moveTo(sx * 7, -91.8 + hy); c.lineTo(sx * 12.2, -89.4 + hy); c.lineTo(sx * 7.8, -84.2 + hy); c.closePath(); c.fill(); }
  /* 胡须：从脸两侧探出来，呈扇形 */
  c.strokeStyle = cream; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath();
  for (let sx = -1; sx <= 1; sx += 2) for (let k = 0; k < 3; k++) c.moveTo(sx * 19, -69 + k * 4.6 + hy), c.lineTo(sx * (33 + k * 1.2), -73 + k * 8.2 + hy);
  c.stroke();
  c.restore();
}
function ensureCat() {
  if (catDrawn) return;
  catDrawn = true;
  const cz = cam.pos + cam.pz, ry = roadY(cz), gp = pt(G.catX, ry, cz); if (!gp) return;
  const jn = G.y / CAT_H, sr = 0.5 * gp.s * (1 - jn * 0.3);
  ctx.fillStyle = 'rgba(20,24,48,' + (0.34 * (1 - jn * 0.55)).toFixed(3) + ')';
  ctx.beginPath(); ctx.ellipse(gp.x, gp.y, sr, Math.max(1.5, sr * (cam.y - ry) / gp.dz * 0.9), 0, 0, TAU); ctx.fill();
  if (G.blinkOff) return;
  drawCat(gp.x, gp.y, gp.s * CAT_H / 100, { t: T, ph: G.ph, run: G.speed > 1.5 && G.state !== 'over', air: G.air, jy: jn * 100, squash: G.squash, lean: G.lean, cheer: G.cheer, crouch: G.crouch, ear: G.ear });
}
