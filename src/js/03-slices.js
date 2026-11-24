
/* ---------------------------- 10. 路面切片渲染 ---------------------------- */
let catDrawn = false;
/* 每片向更远的一片多画 0.6px 并叠在上面，避免部分浏览器抗锯齿在切片间露出接缝 */
const SEAM = 0.6;
function bandPath(A, B, xa, xb, ya, yb) {
  ctx.moveTo(A.x + A.s * xa, ya); ctx.lineTo(A.x + A.s * xb, ya);
  ctx.lineTo(B.x + B.s * xb, yb - SEAM); ctx.lineTo(B.x + B.s * xa, yb - SEAM); ctx.closePath();
}
const band = (A, B, xa, xb, col) => { ctx.fillStyle = col; ctx.beginPath(); bandPath(A, B, xa, xb, A.y, B.y); ctx.fill(); };
const bandG = (A, B, xa, xb, col) => { ctx.fillStyle = col; ctx.beginPath(); bandPath(A, B, xa, xb, A.g, B.g); ctx.fill(); };
/* 竖直面：位于横向 x 处，近端高度 a0..a1、远端 b0..b1（相对路面，向上为正） */
function vbandPath(A, B, x, a0, a1, b0, b1) {
  ctx.moveTo(A.x + A.s * x, A.y - A.s * a1); ctx.lineTo(A.x + A.s * x, A.y - A.s * a0);
  ctx.lineTo(B.x + B.s * x, B.y - B.s * b0 - SEAM); ctx.lineTo(B.x + B.s * x, B.y - B.s * b1 - SEAM); ctx.closePath();
}
const vband = (A, B, x, a0, a1, b0, b1, col) => { ctx.fillStyle = col; ctx.beginPath(); vbandPath(A, B, x, a0, a1, b0, b1); ctx.fill(); };
function poly(pts, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fill();
}
function rr(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

const QUAY = hex('#CFC8B8');
function drawWaves(sl) {
  for (let i = sl.i2; i >= sl.i1; i--) {
    const g = SEGS[i], w = g.wave; if (!w) continue;
    const p = pt(w.x, 0, g.z1 + w.dz); if (!p) continue;
    const lw = w.w * p.s; if (lw < 0.8) continue;
    const a = Math.max(0, Math.sin(T * 1.7 + w.ph)); if (a < 0.12) continue;
    ctx.fillStyle = 'rgba(255,' + (w.g ? '241,205,' : '255,255,') + ((w.g ? 0.8 : 0.34) * a).toFixed(3) + ')';
    ctx.fillRect(p.x - lw / 2, p.y - 0.6 * UX, lw, Math.max(1, lw * 0.09));
  }
}
function drawPier(z, col, dark, fg) {
  const ry = roadY(z), p = pt(0, 0, z); if (!p) return;
  const s = p.s, capB = p.g - s * (ry - 3.4), capT = p.g - s * (ry - 2.3);
  ctx.fillStyle = dark;
  ctx.fillRect(p.x - s * 2.7, capB, s * 0.9, p.g - capB); ctx.fillRect(p.x + s * 1.8, capB, s * 0.9, p.g - capB);
  ctx.fillStyle = col;
  ctx.fillRect(p.x - s * 2.7, capB, s * 1.8, p.g - capB); ctx.fillRect(p.x + s * 0.9, capB, s * 1.8, p.g - capB);
  ctx.fillRect(p.x - s * 3.6, capB, s * 7.2, capT - capB);
  ctx.fillStyle = dark; ctx.fillRect(p.x + s * 2.4, capB, s * 1.2, capT - capB);
}

function drawSlice(sl) {
  const A = sl.A, B = sl.B, fg = sl.fog, P = PALS[sl.palId], lvl = sl.lvl;
  const elev = A.g - A.y > 0.75, zm = sl.zm;
  /* ---- 地面条带：全部贴在 y=0 的地面上，随道路一起弯曲 ---- */
  if (sl.zone === 0) {
    band(A, B, -BIG, -LEDGE_OUT, fogged(P[KP.land], fg));
    const walk = fogged(P[KP.walk], fg);
    ctx.beginPath(); bandPath(A, B, -LEDGE_OUT, -(ROAD_HALF + 0.25), A.y, B.y); bandPath(A, B, ROAD_HALF + 0.25, LEDGE_OUT, A.y, B.y);
    ctx.fillStyle = walk; ctx.fill();
    band(A, B, LEDGE_OUT, 19, fogged(mixC(P[KP.sand], QUAY, smooth(Z_QUAY, RAMP_UP[0] - 8, zm)), fg));
    band(A, B, 19, BIG, fogged(P[KP.sea], fg));
    drawWaves(sl);
  } else if (sl.zone === 1) {
    ctx.beginPath();
    for (let i = 0; i < STREETS.length; i++) bandPath(A, B, STREETS[i][0], STREETS[i][1], A.g, B.g);
    ctx.fillStyle = fogged(P[KP.street], fg); ctx.fill();
    if (!elev) { const walk = fogged(P[KP.walk], fg); bandG(A, B, -LEDGE_OUT, -(ROAD_HALF + 0.25), walk); bandG(A, B, ROAD_HALF + 0.25, LEDGE_OUT, walk); }
  } else {
    const walk = fogged(P[KP.walk], fg);
    bandG(A, B, -(ROAD_HALF + 3.95), -(ROAD_HALF + 0.25), walk);
    bandG(A, B, ROAD_HALF + 0.25, ROAD_HALF + 3.95, walk);
  }
  /* ---- 地面上的楼宇（远 → 近） ---- */
  for (let i = sl.i2; i >= sl.i1; i--) { const arr = SEGS[i].ground; for (let j = 0; j < arr.length; j++) drawGround(arr[j], fg); }
  if (sl.pier) drawPier(sl.pier, fogged(P[KP.pier], fg), fogged(shC(P[KP.pier], 0.72), fg), fg);
  /* ---- 桥体侧面：检修台 + 桥腹 / 路堤挡墙 ---- */
  if (!sl.hidden && elev) {
    const e = smooth(Z_EMB, Z_EMB + 22, zm), rA = roadY(Math.max(sl.z1, cam.pos)), rB = roadY(sl.z2);
    const ledge = fogged(P[KP.ledge], fg);
    band(A, B, ROAD_HALF + 0.25, LEDGE_OUT, ledge); band(A, B, -LEDGE_OUT, -(ROAD_HALF + 0.25), ledge);
    const bA = -(rA * (1 - e) + 2.4 * e), bB = -(rB * (1 - e) + 2.4 * e);
    for (let side = -1; side <= 1; side += 2) {
      const x = side * WALL_X;
      if (lvl <= 1) {
        vband(A, B, x, -0.18, 0, -0.18, 0, fogged(P[KP.wallB], fg));
        vband(A, B, x, bA * 0.55, -0.18, bB * 0.55, -0.18, fogged(P[KP.wallA], fg));
        vband(A, B, x, bA, bA * 0.55, bB, bB * 0.55, fogged(P[KP.wallB], fg));
      } else vband(A, B, x, bA, 0, bB, 0, fogged(P[KP.wallA], fg));
    }
  }
  /* ---- 路面、标线、护栏 ---- */
  if (!sl.hidden) {
    band(A, B, -ROAD_HALF, ROAD_HALF, fogged(P[KP.road], fg));
    /* 路缘色带用单色：不做交替色块，避免画面边缘高频闪烁 */
    ctx.beginPath(); bandPath(A, B, ROAD_HALF, ROAD_HALF + 0.25, A.y, B.y); bandPath(A, B, -ROAD_HALF - 0.25, -ROAD_HALF, A.y, B.y);
    ctx.fillStyle = fogged(P[KP.curbB], fg); ctx.fill();
    /* 边线与车道线全部是实线 */
    if (lvl <= 2) {
      ctx.beginPath();
      bandPath(A, B, ROAD_HALF - 0.34, ROAD_HALF - 0.18, A.y, B.y); bandPath(A, B, -(ROAD_HALF - 0.18), -(ROAD_HALF - 0.34), A.y, B.y);
      bandPath(A, B, -1.41, -1.29, A.y, B.y); bandPath(A, B, 1.29, 1.41, A.y, B.y);
      ctx.fillStyle = fogged(P[KP.lane], fg); ctx.fill();
    }
    /* 护栏：基座 + 立柱 + 上下两道横梁，中间夹一条随阶段变色的饰线。
       横梁是贴着路缘外侧的竖直面，近粗远细，和车道线一起收敛到同一个消失点 */
    ctx.beginPath();
    for (let side = -1; side <= 1; side += 2) vbandPath(A, B, side * RAIL_X, 0, 0.18, 0, 0.18);
    ctx.fillStyle = fogged(P[KP.plinth], fg); ctx.fill();
    if (lvl <= 1) {
      ctx.beginPath();
      for (let side = -1; side <= 1; side += 2) vbandPath(A, B, side * RAIL_X, 0.35, 0.4, 0.35, 0.4);
      ctx.fillStyle = fogged(P[KP.railB], fg); ctx.fill();
    }
    ctx.beginPath();
    for (let side = -1; side <= 1; side += 2) { vbandPath(A, B, side * RAIL_X, 0.4, 0.58, 0.4, 0.58); vbandPath(A, B, side * RAIL_X, 0.65, 0.86, 0.65, 0.86); }
    ctx.fillStyle = fogged(P[KP.railA], fg); ctx.fill();
    if (lvl <= 2) {
      ctx.beginPath();
      for (let side = -1; side <= 1; side += 2) vbandPath(A, B, side * RAIL_X, 0.58, 0.65, 0.58, 0.65);
      ctx.fillStyle = fogged(P[KP.curbB], fg); ctx.fill();
    }
    if (lvl === 0 && (sl.i1 & 1) === 0) {
      ctx.beginPath();
      for (let side = -1; side <= 1; side += 2) ctx.rect(A.x + A.s * (side * RAIL_X - 0.08), A.y - A.s * 0.94, A.s * 0.16, A.s * 0.96);
      ctx.fillStyle = fogged(P[KP.post], fg); ctx.fill();
    }
  }
  /* ---- 路边装饰、金币与障碍（远 → 近）；比小猫更近的物体画在小猫之后 ---- */
  for (let i = sl.i2; i >= sl.i1; i--) { const arr = SEGS[i].deco; for (let j = 0; j < arr.length; j++) drawDeco(arr[j], fg); }
  for (let i = sl.i2; i >= sl.i1; i--) {
    const arr = SEGS[i].items;
    for (let j = 0; j < arr.length; j++) {
      const it = arr[j], dz = it.z - cam.pos;
      if (it.dead || dz < 0.6 || dz + it.d < 1.0) continue;            // 已经贴到镜头上的物体不再绘制
      if (dz < cam.pz) ensureCat(); drawItem(it, fg);
    }
  }
}

function render() {
  setHaze(cam.pal);
  bgShift = cam.f * cam.sc;
  drawBackground();
  buildSlices();
  catDrawn = false;
  for (let k = SL.length - 1; k >= 0; k--) drawSlice(SL[k]);
  ensureCat();
  drawFX();
}
