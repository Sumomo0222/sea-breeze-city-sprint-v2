
/* ---------------------------- 11. 场景配色与生成 ---------------------------- */
const CJK = "'PingFang SC','Hiragino Sans GB','Heiti SC','Microsoft YaHei','Noto Sans SC','Source Han Sans SC',sans-serif";
const DISP = "'KuaiLe','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans SC',sans-serif";
const HOUSE_WALLS = ['#FFF7EA', '#FFE7CC', '#FBDCE0', '#DDF2F4', '#FFF2C6', '#E9F6DF'].map(hex);
const HOUSE_ROOFS = ['#E0654A', '#C9503C', '#4E7FB8', '#3F9C8A', '#E59A3B'].map(hex);
const TOWER_WALLS = ['#8D93B8', '#9E97B4', '#7E88AE', '#A8A0B6', '#8A96B8', '#B0A2AE', '#7888B0'];
const SHOP_WALLS = ['#2A3160', '#3A2450', '#1F3F55', '#4A2440', '#23303A', '#3B2E2A', '#20355A', '#2F3A2A'];
const SHOP_LIGHTS = [[255, 205, 130], [170, 225, 255], [255, 214, 232], [255, 236, 190]];
const NEON_COLS = ['#FF4FA8', '#35E6F5', '#FFE14D', '#9DFF5A', '#FF8A3D', '#A66BFF', '#FF5A5A', '#7DF9FF'].map(hex);
const CROWN_COLS = ['#FF4FA8', '#35E6F5', '#FFE14D', '#A66BFF'].map(hex);
const BILL_TEXTS = ['海风市', '猫爪汽水', '海风晚报', 'CITY', '海风大桥', '海盐汽水', '夜航电台'];
const H_SHOPS = ['海风茶餐厅', '猫爪电玩城', '老街理发店', '阿嬷甜品屋', '夜光唱片行', '24h 便利店', '深夜食堂', '巷口烧烤', '灯塔旅社', '小猫洗衣坊', '海盐冰淇淋', '旧港书店', '阿强大排档', '星光电影院', '南风花店', '海风夜市', '老陈钟表行', '叮当药房', '海雾酒吧', '转角咖啡'];
const V_SIGNS = ['拉面', '电玩', '旅社', '夜宵', '药局', '烧烤', '旧书', '理发', '鱼市', '酒吧', '花店', '面馆', '唱片', '茶楼', '冰室', '汤泉', '小吃', '钟表', '武馆', '甜品', '网咖', '澡堂', '当铺', '相馆'];
const UMB_A = ['#FF6A4D', '#1FA8E0', '#FFC83D', '#2FD1A0'].map(hex), UMB_B = [hex('#FFFFFF'), hex('#FFF8E8')];
const VEND_COLS = ['#FF5A5A', '#2E86DE', '#F4F6F8', '#2FD1A0'].map(hex);
const TRUNK = [150, 112, 72], TRUNK_D = [118, 86, 54], LEAF_A = [46, 158, 99], LEAF_B = [66, 190, 122], COCO = [104, 72, 44];
const FROND_A = [-2.8, -2.35, -1.9, -1.35, -0.8, -0.3, 0.2], FROND_D = [0.36, 0.14, 0, 0, 0.04, 0.18, 0.44], FROND_L = [0.85, 0.95, 1, 1, 1, 0.95, 0.85];
const POLE_COL = [92, 104, 132], LAMP_WARM = [255, 214, 150], BILL_BOARD = [20, 22, 48], SHOP_WIN_D = [24, 26, 52];
const WIN_COOL = [176, 222, 255], AWN_CREAM = [255, 240, 214], HOUSE_GLASS = [96, 140, 194];
const TOWER_ROWS = [
  { x: 21, w: [8, 12], d: [12, 16], sp: [32, 42], h: [3, 7] },
  { x: 40, w: [12, 17], d: [14, 18], sp: [26, 31], h: [14, 36] },
  { x: 64, w: [16, 21], d: [16, 22], sp: [34, 40], h: [28, 60] },
  { x: 98, w: [20, 27], d: [20, 26], sp: [44, 52], h: [40, 88] },
];
const addGround = o => segAt(o.z).ground.push(o);
const addDeco = o => segAt(o.z).deco.push(o);
function makeTower(z, xl, xr, d, h, row, v) {
  const t = timeAt(z), nk = smooth(0.62, 0.95, t), r = mulberry32(v);
  const wall = mixC(hex(TOWER_WALLS[v % TOWER_WALLS.length]), [40, 44, 80], nk);
  const lit = lerp(0.05, 0.72, smooth(0.3, 0.92, t));
  const cols = Math.max(1, Math.round((xr - xl) / 2.5)), rows = Math.max(1, Math.round(h / 3.1));
  const win = mixC(wall, [26, 34, 66], 0.5), litW = [255, 208, 120], litC = [176, 222, 255];
  const avg = mixC(win, mixC(litW, litC, 0.3), lit * 0.75), wallFar = mixC(wall, avg, 0.55);
  return { t: 'tower', z, xl, xr, d, h, row, v, cols, rows, cellW: (xr - xl) / cols, floorH: h / rows,
    cWallFar: wallFar, cSideFar: shC(wallFar, 0.74), cWall: wall, cSide: shC(wall, 0.74), cTop: shC(wall, 1.12),
    cWin: win, cLit: litW, cCool: litC, lit, nk,
    bill: h < 30 && r() < 0.22 ? BILL_TEXTS[(v >> 3) % BILL_TEXTS.length] : null,
    crown: r() < 0.5 ? CROWN_COLS[(v >> 5) % CROWN_COLS.length] : null };
}
function genWorld() {
  const rnd = mulberry32(778899), pk = a => a[(rnd() * a.length) | 0], rr = (a, b) => a + rnd() * (b - a);
  for (let i = 0; i < PIER_Z.length; i++) segAt(PIER_Z[i]).pier = PIER_Z[i];
  /* 海面波光：一部分落在夕阳 / 阳光的方向上 */
  for (let i = 0; i < SEGS.length; i++) {
    const g = SEGS[i]; if (g.z1 > RAMP_UP[0] + 30) break;
    const z = g.z1 + rnd() * 3;
    if (rnd() < 0.82) { const x = 0.56 * z * rr(0.9, 1.12); if (x > 21) g.wave = { x, dz: z - g.z1, w: rr(0.9, 2.2), ph: rnd() * TAU, g: 1 }; }
    if (!g.wave && rnd() < 0.6) g.wave = { x: rr(21, 150), dz: rnd() * 3, w: rr(0.8, 1.8), ph: rnd() * TAU, g: 0 };
  }
  /* 棕榈：海滩一侧成排，草坪一侧稀疏，把海面和草坪留开阔 */
  for (let z = -42; z < Z_QUAY + 30; z += rr(9, 13)) addDeco({ t: 'palm', z, x: LEDGE_OUT - 0.35, h: rr(6, 9), lean: rr(-0.9, 0.4), fr: rr(2.6, 3.4), ph: rnd() * TAU });
  for (let z = -36; z < Z_QUAY + 30; z += rr(16, 25)) addDeco({ t: 'palm', z, x: -(LEDGE_OUT - 0.35), h: rr(6.5, 9.5), lean: rr(-0.4, 0.9), fr: rr(2.6, 3.4), ph: rnd() * TAU });
  for (let z = -20; z < Z_QUAY; z += rr(17, 30)) addDeco({ t: 'palm', z, x: ROAD_HALF + rr(6, 9.5), h: rr(5, 7.5), lean: rr(-0.9, 0.9), fr: rr(2.2, 3), ph: rnd() * TAU });
  /* 海边小屋：低密度，退到草坪后面 */
  for (let z = -40; z < Z_CITY + 22; z += rr(27, 38)) {
    const w = rr(8, 11), xr = -(ROAD_HALF + rr(15, 21));
    addGround({ t: 'house', z, xl: xr - w, xr, w, d: rr(9, 12), h: rr(5.6, 7.6), rh: rr(1.8, 2.8), wall: pk(HOUSE_WALLS), roof: pk(HOUSE_ROOFS) });
  }
  for (let z = -16; z < Z_QUAY; z += rr(13, 27)) addGround({ t: 'umbrella', z, x: ROAD_HALF + rr(3.6, 12), a: pk(UMB_A), b: pk(UMB_B) });
  for (let z = 6; z < RAMP_UP[0] + 60; z += rr(30, 62)) addGround({ t: 'boat', z, x: rr(30, 150), h: rr(3.6, 7) });
  for (let r = 0; r < TOWER_ROWS.length; r++) {
    const row = TOWER_ROWS[r], zEnd = r === 0 ? Z_SHOP + 8 : Z_END - 20;
    const z0 = Z_CITY + (r < 2 ? r * 7 : 44 + r * 7);   // 高层再晚一点出现，第一站保持开阔
    for (let side = -1; side <= 1; side += 2) for (let z = z0 + (side > 0 ? 5 : 0); z < zEnd; z += rr(row.sp[0], row.sp[1])) {
      const w = rr(row.w[0], row.w[1]), d = rr(row.d[0], row.d[1]), h = rr(row.h[0], row.h[1]), inner = row.x + rnd() * 3;
      const xl = side < 0 ? -(inner + w) : inner;
      addGround(makeTower(z, xl, xl + w, d, h, r, (rnd() * 1e6) | 0));
    }
  }
  for (let side = -1; side <= 1; side += 2) {
    let z = Z_SHOP;
    while (z < Z_END - 30) {
      const d = rr(10, 18), w = rr(10, 17), h = rr(12, 36), inner = ROAD_HALF + 3.95, xl = side < 0 ? -(inner + w) : inner;
      const wi = (rnd() * SHOP_WALLS.length) | 0;
      addGround({ t: 'shop', z, xl, xr: xl + w, d, h, side, v: (rnd() * 1e6) | 0, wall: hex(SHOP_WALLS[wi]), wallS: shC(hex(SHOP_WALLS[wi]), 0.7),
        light: pk(SHOP_LIGHTS), neon: pk(NEON_COLS), neon2: pk(NEON_COLS), name: pk(H_SHOPS), vname: pk(V_SIGNS), vs2: pk(V_SIGNS), vs3: pk(V_SIGNS), awn: rnd() < 0.5, roof: rnd() < 0.5, roofSign: rnd() < 0.42 });
      z += d + (rnd() < 0.1 ? rr(1.5, 3) : 0);
    }
  }
  for (let z = RAMP_UP[0] + 8; z < Z_SHOP; z += 24) { addDeco({ t: 'lamp', z, x: -(ROAD_HALF + 0.92), h: 7.6 }); addDeco({ t: 'lamp', z: z + 12, x: ROAD_HALF + 0.92, h: 7.6 }); }
  for (let z = Z_SHOP + 6; z < Z_END - 12; z += 18) { addDeco({ t: 'lamp', z, x: -(ROAD_HALF + 1.25), h: 8.2 }); addDeco({ t: 'lamp', z, x: ROAD_HALF + 1.25, h: 8.2 }); }
  for (const lx of [19.3, 36, 60]) for (let side = -1; side <= 1; side += 2) for (let z = Z_CITY - 6 + lx; z < Z_SHOP + 30; z += 30) addGround({ t: 'glamp', z, x: side * lx });
  for (let z = Z_SHOP + 9; z < Z_END - 20; z += rr(22, 36)) { const side = rnd() < 0.5 ? -1 : 1; addGround({ t: 'vending', z, x: side * (ROAD_HALF + 3.05), col: pk(VEND_COLS) }); }
  addDeco({ t: 'gantry', z: RAMP_UP[0] - 7 });
  addDeco({ t: 'gate', z: FINISH_Z });
  addDeco({ t: 'checker', z: FINISH_Z - 0.6, rows: 2 });
  for (let z = 924; z < FINISH_Z - 2; z += 8) addDeco({ t: 'flag', z });
  for (let i = 0; i < SEGS.length; i++) { const g = SEGS[i]; g.ground.sort((a, b) => b.z - a.z); g.deco.sort((a, b) => b.z - a.z); g.items.sort((a, b) => b.z - a.z); }
}

/* ---------------------------- 12. 光晕精灵 ---------------------------- */
const GLOWS = {};
function glowSprite(col) {
  const key = col.join(',');
  let g = GLOWS[key];
  if (!g) {
    g = GLOWS[key] = document.createElement('canvas'); g.width = g.height = 64;
    const c = g.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(col, 0.85)); gr.addColorStop(0.35, rgba(col, 0.32)); gr.addColorStop(1, rgba(col, 0));
    c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  }
  return g;
}
function drawGlowE(col, x, y, rx, ry, a) {
  if (a < 0.01 || rx < 1) return;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glowSprite(col), x - rx, y - ry, rx * 2, ry * 2);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
const drawGlow = (col, x, y, r, a) => drawGlowE(col, x, y, r, r, a);

/* ---------------------------- 13. 楼宇 ---------------------------- */
function boxDraw(g, cF, cS, cT) {
  const sideL = g.l + g.xN > 0, sideR = !sideL && g.r + g.xN < 0;
  ctx.fillStyle = cF; ctx.fillRect(g.LN, g.ytN, g.RN - g.LN, g.ybN - g.ytN);
  if (sideL) poly([[g.LN, g.ytN], [g.LN, g.ybN], [g.LF, g.ybF], [g.LF, g.ytF]], cS);
  else if (sideR) poly([[g.RN, g.ytN], [g.RN, g.ybN], [g.RF, g.ybF], [g.RF, g.ytF]], cS);
  if (cT && g.yt < cam.y) poly([[g.LN, g.ytN], [g.RN, g.ytN], [g.RF, g.ytF], [g.LF, g.ytF]], cT);
  return sideL ? 1 : sideR ? -1 : 0;
}
function drawTower(o, fg) {
  const g = boxGeo(o.z, o.xl, o.xr, 0, o.h, o.d);
  if (g.RF < -4 || g.LF > W + 4) return;
  const sideL = g.l + g.xN > 0, sideR = !sideL && g.r + g.xN < 0, s = g.sN, far = fg > 0.74 || s * o.h < 44;
  ctx.fillStyle = fogged(far ? o.cWallFar : o.cWall, fg); ctx.fillRect(g.LN, g.ytN, g.RN - g.LN, g.ybN - g.ytN);
  const xs = sideL ? g.LN : g.RN, xsF = sideL ? g.LF : g.RF;
  if (sideL || sideR) poly([[xs, g.ytN], [xs, g.ybN], [xsF, g.ybF], [xsF, g.ytF]], fogged(far ? o.cSideFar : o.cSide, fg));
  if (o.h < cam.y) poly([[g.LN, g.ytN], [g.RN, g.ytN], [g.RF, g.ytF], [g.LF, g.ytF]], fogged(o.cTop, fg));
  if (far) return;
  const cw = o.cellW * s, fh = o.floorH * s, ww = cw * 0.56, wh = Math.max(1, fh * 0.5);
  if (cw > 2.6 && fh > 2.6) {
    for (let pass = 0; pass < 3; pass++) {
      ctx.fillStyle = fogged(pass === 0 ? o.cWin : pass === 1 ? o.cLit : o.cCool, fg); ctx.beginPath();
      for (let r = 0; r < o.rows; r++) {
        const y = g.ytN + (0.72 + r * o.floorH) * s; if (y + wh > g.ybN - 1) break;
        for (let c = 0; c < o.cols; c++) {
          const v = hash2(o.v * 13 + r, c * 17 + o.v), type = v < o.lit ? (hash2(c + 3, r + o.v) < 0.72 ? 1 : 2) : 0;
          if (type === pass) ctx.rect(g.LN + (c + 0.22) * o.cellW * s, y, ww, wh);
        }
      }
      ctx.fill();
    }
  }
  if ((sideL || sideR) && s * o.d > 30) {
    const xw = sideL ? g.l : g.r, nC = Math.max(1, Math.floor((o.d - 1.4) / 3.1)), y0 = 0.72 + 0.25 * o.floorH, y1 = 0.72 + 0.75 * o.floorH;
    for (let pass = 0; pass < 3; pass++) {
      ctx.fillStyle = fogged(pass === 0 ? o.cWin : pass === 1 ? o.cLit : o.cCool, fg); ctx.beginPath();
      for (let r = 0; r < o.rows; r++) for (let k = 0; k < nC; k++) {
        const v = hash2(o.v * 7 + r, k * 23 + 5 + o.v), type = v < o.lit ? (hash2(k, r + 3) < 0.72 ? 1 : 2) : 0;
        if (type !== pass) continue;
        const t0 = (0.7 + k * 3.1) / o.d;
        sideQuad(g, xw, t0, t0 + 1.7 / o.d, y0 + r * o.floorH, y1 + r * o.floorH);
      }
      ctx.fill();
    }
  }
  if (o.h < cam.y && s > 9) {
    const t = 0.45, L = lerp(g.LN, g.LF, t), R = lerp(g.RN, g.RF, t), y = lerp(g.ytN, g.ytF, t), bw = (R - L) * 0.34, bh = s * 2.4;
    ctx.fillStyle = fogged(o.cSide, fg); ctx.fillRect(L + (R - L) * 0.12, y - bh, bw, bh);
    ctx.fillStyle = fogged(o.cTop, fg); ctx.fillRect(L + (R - L) * 0.12, y - bh, bw, Math.max(1, bh * 0.14));
    ctx.fillStyle = fogged(o.cSide, fg); ctx.fillRect(R - (R - L) * 0.32, y - bh * 0.7, bw * 0.7, bh * 0.7);
  }
  if (o.crown && o.nk > 0.25) {
    ctx.strokeStyle = rgba(o.crown, 0.9 * o.nk); ctx.lineWidth = Math.max(1.2, s * 0.16); ctx.beginPath();
    ctx.moveTo(g.LN, g.ytN); ctx.lineTo(g.RN, g.ytN);
    if (sideL) { ctx.moveTo(g.LN, g.ytN); ctx.lineTo(g.LF, g.ytF); } else if (sideR) { ctx.moveTo(g.RN, g.ytN); ctx.lineTo(g.RF, g.ytF); }
    ctx.stroke();
  }
  if (o.bill) {
    const tw = g.RN - g.LN, bw = tw * 0.66, bh = Math.min(s * 5, tw * 0.5), bx = g.LN + (tw - bw) / 2, by = g.ytN - bh - s * 0.6, bc = o.crown || [255, 214, 120];
    ctx.fillStyle = fogged(o.cSide, fg);
    ctx.fillRect(g.LN + tw * 0.2 - s * 0.1, by + bh * 0.6, s * 0.2, s * 0.7); ctx.fillRect(g.RN - tw * 0.2 - s * 0.1, by + bh * 0.6, s * 0.2, s * 0.7);
    rr(bx, by, bw, bh, s * 0.25); ctx.fillStyle = fogged(BILL_BOARD, fg); ctx.fill();
    ctx.lineWidth = Math.max(1, s * 0.1); ctx.strokeStyle = rgba(fogArr(bc, fg), 0.5 + 0.5 * o.nk); ctx.stroke();
    if (bh > 14) {
      const px = Math.min(bh * 0.5, bw / (o.bill.length * 1.12));
      ctx.font = '800 ' + px.toFixed(1) + 'px ' + CJK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(fogArr(mixC(bc, [255, 255, 255], 0.5), fg), 0.95); ctx.fillText(o.bill, bx + bw / 2, by + bh / 2 + px * 0.04);
    }
  }
}
/* 霓虹字预渲染：同样的文字 + 颜色只栅格化一次，之后按尺寸贴图 */
const TSPR = new Map();
function textSprite(txt, col, vert) {
  const key = txt + '|' + col.join(',') + (vert ? 'v' : 'h');
  let s = TSPR.get(key);
  if (s) return s;
  const F = 64, M = 22, cv = document.createElement('canvas'), n = txt.length;
  let c = cv.getContext('2d');
  c.font = '800 ' + F + 'px ' + CJK;
  cv.width = Math.ceil(vert ? F * 1.6 : c.measureText(txt).width + F * 0.3) + M * 2;
  cv.height = Math.ceil(vert ? n * F * 1.14 : F * 1.25) + M * 2;
  c = cv.getContext('2d');
  c.font = '800 ' + F + 'px ' + CJK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.strokeStyle = rgba(col, 0.5); c.lineWidth = F * 0.26; c.fillStyle = rgba(mixC(col, [255, 255, 255], 0.62), 1);
  if (vert) for (let i = 0; i < n; i++) { const cy = M + F * 1.14 * (i + 0.5); c.strokeText(txt[i], cv.width / 2, cy); c.fillText(txt[i], cv.width / 2, cy); }
  else { c.strokeText(txt, cv.width / 2, M + F * 0.625); c.fillText(txt, cv.width / 2, M + F * 0.625); }
  s = { cv, cw: cv.width, ch: cv.height, M, F, n }; TSPR.set(key, s); return s;
}
const drawTextSprite = (txt, col, cx, px, cy, vert) => {
  const s = textSprite(txt, col, vert), ky = vert ? px / s.F / 1.14 : px / s.F, kx = px / s.F;
  ctx.drawImage(s.cv, cx - s.cw * kx / 2, cy - s.ch * ky / 2, s.cw * kx, s.ch * ky);
};
/* 竖向霓虹招牌：正面朝向镜头的矩形板 + 竖排文字 + 光晕 */
function vSign(x, y, w, h, txt, col, fg, glowA, s) {
  const FA = c => fogArr(c, fg), F = c => rgb(FA(c));
  if (glowA > 0.02 && w + h > 46) drawGlow(col, x + w / 2, y + h / 2, (w + h) * 0.6, glowA);
  rr(x, y, w, h, Math.max(1, Math.min(w * 0.14, s * 0.14))); ctx.fillStyle = F(BILL_BOARD); ctx.fill();
  ctx.lineWidth = Math.max(1, s * 0.07); ctx.strokeStyle = rgba(FA(col), 0.95); ctx.stroke();
  const n = txt.length, pitch = h / n;
  if (h > 20) drawTextSprite(txt, col, x + w / 2, Math.min(w * 0.74, pitch * 0.9), y + h / 2, true);
  else for (let i = 0; i < n; i++) { ctx.fillStyle = rgba(FA(col), 0.8); ctx.fillRect(x + w * 0.3, y + pitch * (i + 0.32), w * 0.4, pitch * 0.36); }
}
/* 从临街墙面挑出的招牌：位于 z = zp 的正对镜头的平面 */
function sideSign(o, zp, xw, txt, col, hMax, fg, glowA) {
  const n = txt.length, top = Math.min(hMax, 4.4 + 1.0 + n * 1.02), h = top - 4.4;
  if (h < 1.2) return;
  const dir = xw < 0 ? -1 : 1, xl = xw < 0 ? xw - 1.1 : xw, xr = xw < 0 ? xw : xw + 1.1;
  const gb = boxGeo(zp, xl, xr, 4.4, top, 0.16);
  if (gb.RF < -4 || gb.LF > W + 4) return;
  boxDraw(gb, fogged(BILL_BOARD, fg), fogged([12, 13, 32], fg), fogged([12, 13, 32], fg));
  if (gb.sN * h < 16 || fg > 0.7) return;
  vSign(gb.LN, gb.ytN, gb.RN - gb.LN, gb.ybN - gb.ytN, txt, col, fg, glowA, gb.sN);
}
function drawShop(o, fg) {
  const g = boxGeo(o.z, o.xl, o.xr, 0, o.h, o.d);
  if (g.RF < -4 || g.LF > W + 4) return;
  const sideL = g.l + g.xN > 0, sideR = !sideL && g.r + g.xN < 0, s = g.sN, nightK = smooth(0.74, 0.96, cam.T);
  ctx.fillStyle = fogged(o.wall, fg); ctx.fillRect(g.LN, g.ytN, g.RN - g.LN, g.ybN - g.ytN);
  const xs = sideL ? g.LN : g.RN, xsF = sideL ? g.LF : g.RF, xw = sideL ? g.l : g.r, hasSide = sideL || sideR;
  if (hasSide) poly([[xs, g.ytN], [xs, g.ybN], [xsF, g.ybF], [xsF, g.ytF]], fogged(o.wallS, fg));
  const fw = g.RN - g.LN, wu = o.xr - o.xl;
  if (fw <= 8 || o.h * s <= 12) return;
  const far = fg > 0.7 || o.h * s < 60;
  const FA = c => fogArr(c, fg), F = c => rgb(FA(c));
  const nF = Math.max(1, Math.floor((o.h - 4.4) / 3.2)), cols = Math.max(1, Math.round(wu / 2.9)), cw = wu / cols, lit = 0.5 + 0.4 * nightK;
  const winType = (r, k, salt) => { const v = hash2(o.v * 3 + r, k * 9 + salt), type = v < lit ? (hash2(k + 7, r + salt) < 0.78 ? 1 : 2) : 0; return far ? 1 : type; };
  /* 正面窗：先铺深色窗框，再点亮部分窗 */
  if (!far) {
    ctx.fillStyle = F(SHOP_WIN_D); ctx.beginPath();
    for (let r = 0; r < nF; r++) { const y = g.ybN - (7.55 + r * 3.2) * s; if (y < g.ytN + 1) break; for (let c = 0; c < cols; c++) ctx.rect(g.LN + (c + 0.25) * cw * s, y, cw * 0.5 * s, 1.65 * s); }
    ctx.fill();
  }
  for (let pass = (far ? 1 : 1); pass < 3; pass++) {
    ctx.fillStyle = fogged(pass === 1 ? o.light : WIN_COOL, fg);
    if (far) ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let r = 0; r < nF; r++) {
      const y = g.ybN - (7.45 + r * 3.2) * s; if (y < g.ytN + 1) break;
      for (let c = 0; c < cols; c++) if (winType(r, c, 2) === pass) ctx.rect(g.LN + (c + 0.31) * cw * s, y, (far ? 0.38 : 0.38) * cw * s, 1.45 * s);
    }
    ctx.fill(); ctx.globalAlpha = 1;
  }
  /* 临街立面：窗格 + 楼层线 + 一层店面 */
  if (hasSide) {
    const nC = Math.max(1, Math.floor((o.d - 1.0) / 3.0));
    if (!far) {
      ctx.fillStyle = F(SHOP_WIN_D); ctx.beginPath();
      for (let r = 0; r < nF; r++) for (let k = 0; k < nC; k++) { const t0 = (0.6 + k * 3.0) / o.d; sideQuad(g, xw, t0, t0 + 1.75 / o.d, 5.65 + r * 3.2, 7.5 + r * 3.2); }
      ctx.fill();
    }
    for (let pass = 1; pass < 3; pass++) {
      ctx.fillStyle = fogged(pass === 1 ? o.light : WIN_COOL, fg);
      if (far) ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (let r = 0; r < nF; r++) for (let k = 0; k < nC; k++) {
        if (winType(r, k, 5) !== pass) continue;
        const t0 = (0.74 + k * 3.0) / o.d;
        sideQuad(g, xw, t0, t0 + 1.47 / o.d, 5.85 + r * 3.2, 7.3 + r * 3.2);
      }
      ctx.fill(); ctx.globalAlpha = 1;
    }
    if (!far) {
      ctx.beginPath(); sideQuad(g, xw, 0.04, 0.96, 0.35, 2.95); ctx.fillStyle = rgba(fogArr(o.light, fg), 0.92); ctx.fill();
      ctx.beginPath(); sideQuad(g, xw, 0.42, 0.58, 0.6, 2.5); ctx.fillStyle = rgba(fogArr(o.neon2, fg), 0.55); ctx.fill();
      ctx.beginPath();
      for (let k = 1; k <= nC; k++) { const t = (0.3 + k * 3.0) / o.d; if (t > 0.96) break; sideQuad(g, xw, t - 0.05 / o.d, t + 0.05 / o.d, 0.2, 3.1); }
      ctx.fillStyle = F(SHOP_WIN_D); ctx.fill();
      ctx.strokeStyle = rgba(FA(shC(o.wall, 1.6)), 0.55); ctx.lineWidth = Math.max(1, s * 0.04); ctx.beginPath();
      for (let r = 1; r <= nF; r++) { const y = 5.1 + r * 3.2, a = sidePt(g, xw, 0.02, y), b = sidePt(g, xw, 0.98, y); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.stroke();
    }
    if (o.roof) { ctx.strokeStyle = rgba(FA(o.neon), 0.15 + 0.85 * nightK); ctx.lineWidth = Math.max(1, s * 0.07); ctx.beginPath(); ctx.moveTo(xs, g.ytN); ctx.lineTo(xsF, g.ytF); ctx.stroke(); }
    /* 立面上再挑出 1~2 块招牌，沿街排成一列 */
    if (!far && o.d > 10) {
      const ga = 0.5 * nightK * (1 - fg);
      sideSign(o, o.z + o.d * 0.62, xw, o.vs2, o.neon2, o.h - 0.6, fg, ga);
      if (o.d > 15) sideSign(o, o.z + o.d * 0.28, xw, o.vs3, o.neon, o.h - 0.6, fg, ga);
    }
  }
  if (o.roofSign) {
    const bw = fw * 0.72, bh = Math.min(s * 4.8, fw * 0.6), bx = g.LN + (fw - bw) / 2, by = g.ytN - bh - s * 0.7;
    if (bh > 6 && bw > 10) {
      ctx.fillStyle = F(o.wallS); ctx.fillRect(bx + bw * 0.16, g.ytN - s * 0.8, Math.max(1, s * 0.14), s * 0.8); ctx.fillRect(bx + bw * 0.84 - s * 0.14, g.ytN - s * 0.8, Math.max(1, s * 0.14), s * 0.8);
      rr(bx, by, bw, bh, s * 0.2); ctx.fillStyle = F(BILL_BOARD); ctx.fill();
      ctx.lineWidth = Math.max(1, s * 0.08); ctx.strokeStyle = rgba(FA(o.neon), 0.95); ctx.stroke();
      const glow = 0.4 * nightK * (1 - fg);
      if (glow > 0.03) drawGlow(o.neon, bx + bw / 2, by + bh / 2, bw * 0.75, glow);
      if (bh > 18) drawTextSprite(o.name, o.neon2, bx + bw / 2, Math.min(bh * 0.5, bw / (o.name.length * 1.12)), by + bh / 2, false);
      else if (bw > 10) { ctx.fillStyle = rgba(FA(o.neon2), 0.85); ctx.fillRect(bx + bw * 0.2, by + bh * 0.38, bw * 0.6, bh * 0.26); }
    }
  }
  if (far) return;
  /* 转角霓虹灯管：从地面一直亮到楼顶，强化纵深 */
  if (hasSide && o.roof) {
    ctx.strokeStyle = rgba(FA(o.neon2), 0.2 + 0.8 * nightK); ctx.lineWidth = Math.max(1.2, s * 0.1);
    ctx.beginPath(); ctx.moveTo(xs, g.ybN); ctx.lineTo(xs, g.ytN); ctx.stroke();
  }
  /* 一层店面 */
  const gx = g.LN + 0.4 * s, gw = fw - 0.8 * s, gy = g.ybN - 3.05 * s, gh = 2.8 * s;
  ctx.fillStyle = rgba(fogArr(o.light, fg), 0.94); ctx.fillRect(gx, gy, gw, gh);
  ctx.fillStyle = F(SHOP_WIN_D);
  ctx.fillRect(gx + gw * 0.62, g.ybN - 2.2 * s, Math.min(1.0 * s, gw * 0.2), 2.2 * s);
  ctx.fillRect(gx + gw * 0.3, gy, 0.1 * s, gh); ctx.fillRect(gx + gw * 0.5, gy, 0.1 * s, gh);
  if (o.awn) {
    const ay = gy - 0.5 * s, n = Math.max(4, Math.round(wu / 0.8)), sw = fw / n;
    ctx.beginPath(); for (let i = 0; i < n; i += 2) ctx.rect(g.LN + i * sw, ay, sw + 0.5, 0.5 * s); ctx.fillStyle = F(AWN_CREAM); ctx.fill();
    ctx.beginPath(); for (let i = 1; i < n; i += 2) ctx.rect(g.LN + i * sw, ay, sw + 0.5, 0.5 * s); ctx.fillStyle = F(o.neon2); ctx.fill();
  }
  /* 横向招牌 */
  const sy = g.ybN - 4.95 * s, sh = 1.7 * s, sx = g.LN + 0.3 * s, sw2 = fw - 0.6 * s;
  if (sy > g.ytN) {
    rr(sx, sy, sw2, sh, s * 0.14); ctx.fillStyle = F(BILL_BOARD); ctx.fill();
    ctx.lineWidth = Math.max(1, s * 0.06); ctx.strokeStyle = rgba(FA(o.neon), 0.95); ctx.stroke();
    if (sh > 13) drawTextSprite(o.name, o.neon2, sx + sw2 / 2, Math.min(sh * 0.56, sw2 / (o.name.length * 1.12)), sy + sh / 2, false);
    else { ctx.fillStyle = rgba(FA(o.neon2), 0.85); ctx.fillRect(sx + sw2 * 0.2, sy + sh * 0.36, sw2 * 0.6, sh * 0.28); }
  }
  /* 转角处的竖向霓虹招牌 */
  const n = o.vname.length, vh = (1.0 + n * 1.02) * s;
  const vTop = Math.max(g.ytN + 0.5 * s, g.ybN - (6.3 + n * 1.02) * s), vBot = Math.min(g.ybN - 5.3 * s, vTop + vh), vp = 1.15 * s;
  if (vBot - vTop > 6) vSign(o.side < 0 ? g.RN - vp : g.LN, vTop, vp, vBot - vTop, o.vname, o.neon, fg, 0.5 * nightK * (1 - fg), s);
  if (o.roof) {
    ctx.strokeStyle = rgba(FA(o.neon2), 0.55 + 0.45 * nightK); ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.beginPath(); ctx.moveTo(g.LN, g.ytN); ctx.lineTo(g.RN, g.ytN); ctx.stroke();
  }
}
function drawHouse(o, fg) {
  const g = boxGeo(o.z, o.xl, o.xr, 0, o.h, o.d);
  if (g.RF < -4 || g.LF > W + 4) return;
  const sideL = g.l + g.xN > 0, sideR = !sideL && g.r + g.xN < 0, s = g.sN;
  const xs = sideL ? g.LN : g.RN, xsF = sideL ? g.LF : g.RF, xw = sideL ? g.l : g.r;
  ctx.fillStyle = fogged(o.wall, fg); ctx.fillRect(g.LN, g.ytN, g.RN - g.LN, g.ybN - g.ytN);
  if (sideL || sideR) poly([[xs, g.ytN], [xs, g.ybN], [xsF, g.ybF], [xsF, g.ytF]], fogged(shC(o.wall, 0.82), fg));
  const ov = 0.4 * s, ovF = 0.4 * g.sF, rh = o.rh * s, rhF = o.rh * g.sF, inw = o.w * 0.3 * s, inwF = o.w * 0.3 * g.sF, roofS = fogged(shC(o.roof, 0.78), fg);
  if (sideL) poly([[g.LN - ov, g.ytN], [g.LF - ovF, g.ytF], [g.LF - ovF + inwF, g.ytF - rhF], [g.LN - ov + inw, g.ytN - rh]], roofS);
  else if (sideR) poly([[g.RN + ov, g.ytN], [g.RF + ovF, g.ytF], [g.RF + ovF - inwF, g.ytF - rhF], [g.RN + ov - inw, g.ytN - rh]], roofS);
  poly([[g.LN - ov, g.ytN], [g.RN + ov, g.ytN], [g.RN + ov - inw, g.ytN - rh], [g.LN - ov + inw, g.ytN - rh]], fogged(o.roof, fg));
  if (s * o.w > 60) {
    const glass = fogged(HOUSE_GLASS, fg), frame = fogged([255, 255, 255], fg), twoF = o.h > 5.8;
    ctx.fillStyle = frame; ctx.beginPath();
    for (let i = 0; i < (twoF ? 4 : 2); i++) { const xm = i & 1 ? o.w - 2.8 : 1.0, ym = i > 1 ? 4.3 : 1.6; ctx.rect(g.LN + (xm - 0.1) * s, g.ybN - (ym + 1.45) * s, 1.9 * s, 1.55 * s); }
    ctx.fill(); ctx.fillStyle = glass; ctx.beginPath();
    for (let i = 0; i < (twoF ? 4 : 2); i++) { const xm = i & 1 ? o.w - 2.8 : 1.0, ym = i > 1 ? 4.3 : 1.6; ctx.rect(g.LN + xm * s, g.ybN - (ym + 1.35) * s, 1.7 * s, 1.35 * s); }
    ctx.fill();
    ctx.fillStyle = fogged([138, 90, 60], fg); ctx.fillRect(g.LN + (o.w / 2 - 0.55) * s, g.ybN - 2.2 * s, 1.1 * s, 2.2 * s);
    ctx.fillStyle = fogged(shC(o.roof, 1.1), fg);
    for (let i = 0; i < 2; i++) { const xm = i & 1 ? o.w - 2.8 : 1.0; ctx.fillRect(g.LN + (xm - 0.25) * s, g.ybN - 3.3 * s, 2.2 * s, 0.3 * s); }
    if (twoF) { ctx.fillStyle = fogged(shC(o.wall, 0.86), fg); ctx.fillRect(g.LN, g.ybN - 3.5 * s, g.RN - g.LN, Math.max(1, 0.07 * s)); }
    if (sideL || sideR) {
      ctx.fillStyle = glass; ctx.beginPath();
      for (const t of [0.28, 0.68]) for (const ym of (twoF ? [1.6, 4.3] : [1.6])) sideQuad(g, xw, t - 0.1, t + 0.1, ym, ym + 1.35);
      ctx.fill();
    }
  }
}

/* ---------------------------- 14. 道具 ---------------------------- */
function drawPalm(o, fg) {
  const p = pt(o.x, 0, o.z); if (!p) return;
  const s = p.s, h = o.h, sw = Math.sin(T * 1.5 + o.ph), lean = o.lean;
  const tx = p.x + s * (lean * 1.6 + sw * 0.35), ty = p.y - s * h;
  if (s * h < 84) {
    ctx.strokeStyle = fogged(TRUNK, fg); ctx.lineWidth = Math.max(1, s * 0.28); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = fogged(LEAF_A, fg); ctx.beginPath();
    if (s * h > 30) {
      ctx.ellipse(tx - s * 1.3, ty + s * 0.25, s * 1.9, s * 0.52, 0.3, 0, TAU); ctx.ellipse(tx + s * 1.3, ty + s * 0.2, s * 1.9, s * 0.52, -0.25, 0, TAU);
    }
    ctx.ellipse(tx, ty - s * 0.35, s * 1.5, s * 0.75, 0, 0, TAU); ctx.fill();
    if (s * h > 30) { ctx.fillStyle = fogged(LEAF_B, fg); ctx.beginPath(); ctx.ellipse(tx - s * 0.2, ty - s * 0.6, s * 1.15, s * 0.5, -0.2, 0, TAU); ctx.fill(); }
    return;
  }
  const w0 = s * 0.36, w1 = s * 0.2, mx = (p.x + tx) / 2 + s * lean * 0.9, my = (p.y + ty) / 2;
  ctx.fillStyle = fogged(TRUNK, fg); ctx.beginPath(); ctx.moveTo(p.x - w0 / 2, p.y + 1);
  ctx.quadraticCurveTo(mx - w0 / 2, my, tx - w1 / 2, ty); ctx.lineTo(tx + w1 / 2, ty);
  ctx.quadraticCurveTo(mx + w1 / 2, my, p.x + w0 / 2, p.y + 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = fogged(TRUNK_D, fg); ctx.beginPath(); ctx.moveTo(p.x + w0 * 0.1, p.y + 1);
  ctx.quadraticCurveTo(mx + w0 * 0.1, my, tx + w1 * 0.05, ty); ctx.lineTo(tx + w1 / 2, ty);
  ctx.quadraticCurveTo(mx + w1 / 2, my, p.x + w0 / 2, p.y + 1); ctx.closePath(); ctx.fill();
  const L = s * o.fr;
  for (let i = 0; i < 7; i++) {
    const a = FROND_A[i] + sw * 0.07, dr = FROND_D[i], len = L * FROND_L[i];
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.8 + dr * L;
    ctx.fillStyle = fogged(i & 1 ? LEAF_A : LEAF_B, fg); ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a - 0.32) * L * 0.55, ty + Math.sin(a - 0.32) * L * 0.55, ex, ey);
    ctx.quadraticCurveTo(tx + Math.cos(a + 0.26) * L * 0.5, ty + Math.sin(a + 0.26) * L * 0.5 + dr * L * 0.7, tx, ty);
    ctx.fill();
  }
  ctx.fillStyle = fogged(COCO, fg);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(tx + (i - 1) * s * 0.22, ty + s * 0.14, s * 0.14, 0, TAU); ctx.fill(); }
}
function drawLamp(o, fg) {
  const p = pt(o.x, roadY(o.z), o.z); if (!p) return;
  const s = p.s, dir = -Math.sign(o.x), top = p.y - s * o.h, ax = p.x + dir * s * 1.7, pw = Math.max(1.2, s * 0.16), pole = fogged(POLE_COL, fg);
  ctx.fillStyle = pole; ctx.fillRect(p.x - pw / 2, top, pw, s * o.h);
  ctx.strokeStyle = pole; ctx.lineWidth = Math.max(1, s * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, top + s * 0.1); ctx.lineTo(ax, top); ctx.stroke();
  rr(ax - s * 0.42, top - s * 0.1, s * 0.84, s * 0.22, s * 0.1); ctx.fillStyle = pole; ctx.fill();
  const k = smooth(0.36, 0.62, cam.T);
  ctx.fillStyle = k > 0.05 ? 'rgb(255,232,170)' : fogged([235, 238, 240], fg);
  rr(ax - s * 0.32, top + s * 0.1, s * 0.64, s * 0.08, s * 0.04); ctx.fill();
  if (k > 0.05 && fg < 0.6) {
    drawGlow(LAMP_WARM, ax, top + s * 0.14, s * 2.6, 0.55 * k * (1 - fg));
    const q = pt(o.x + dir * 1.5, roadY(o.z), o.z);
    if (q) { const rx = 3.8 * q.s; drawGlowE(LAMP_WARM, q.x, q.y, rx, rx * (cam.y - roadY(o.z)) / q.dz * 0.72, 0.3 * k * (1 - fg)); }
  }
}
function drawGantry(o, fg) {
  const z = o.z, ry = roadY(z), pl = pt(-(ROAD_HALF + 1.0), ry, z); if (!pl) return;
  const pr = pt(ROAD_HALF + 1.0, ry, z), s = pl.s, pw = Math.max(2, s * 0.36), top = pl.y - s * 7.4, post = fogged([176, 182, 192], fg);
  ctx.fillStyle = post; ctx.fillRect(pl.x - pw / 2, top, pw, s * 7.4); ctx.fillRect(pr.x - pw / 2, top, pw, s * 7.4);
  ctx.fillStyle = fogged([128, 136, 150], fg); ctx.fillRect(pl.x + pw * 0.2, top, pw * 0.3, s * 7.4); ctx.fillRect(pr.x + pw * 0.2, top, pw * 0.3, s * 7.4);
  ctx.fillStyle = fogged([204, 210, 218], fg); ctx.fillRect(pl.x - pw / 2, top, pr.x - pl.x + pw, s * 0.6);
  const bw = Math.min(pr.x - pl.x + pw, s * 8.2), bh = s * 2.3, bx = (pl.x + pr.x) / 2 - bw / 2, by = pl.y - s * 6.2;
  rr(bx, by, bw, bh, s * 0.18); ctx.fillStyle = fogged([24, 132, 84], fg); ctx.fill();
  ctx.lineWidth = Math.max(1, s * 0.09); ctx.strokeStyle = fogged([255, 255, 255], fg); ctx.stroke();
  if (bh > 18) {
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = Math.round(s * 0.92) + 'px ' + DISP; ctx.fillText('城市高架', bx + bw / 2, by + bh * 0.36);
    ctx.font = '800 ' + Math.round(s * 0.46) + 'px ' + CJK; ctx.fillText('City Viaduct  ↑', bx + bw / 2, by + bh * 0.74);
  }
}
function drawGate(o, fg) {
  const z = o.z, ry = roadY(z), pl = pt(-(ROAD_HALF + 0.75), ry, z); if (!pl) return;
  const pr = pt(ROAD_HALF + 0.75, ry, z), s = pl.s, pw = Math.max(2, s * 0.5), top = pl.y - s * 7.6;
  ctx.fillStyle = fogged([236, 240, 246], fg); ctx.fillRect(pl.x - pw / 2, top, pw, s * 7.6); ctx.fillRect(pr.x - pw / 2, top, pw, s * 7.6);
  ctx.fillStyle = fogged([190, 198, 212], fg); ctx.fillRect(pl.x + pw * 0.2, top, pw * 0.3, s * 7.6); ctx.fillRect(pr.x + pw * 0.2, top, pw * 0.3, s * 7.6);
  const bx = pl.x - pw / 2, bw = pr.x - pl.x + pw, cell = s * 0.5, n = Math.ceil(bw / cell);
  ctx.fillStyle = fogged([30, 39, 72], fg); ctx.fillRect(bx, top, bw, cell * 3);
  ctx.fillStyle = fogged([255, 255, 255], fg); ctx.beginPath();
  for (let i = 0; i < n; i++) if (!(i & 1)) { const x0 = bx + i * cell; ctx.rect(x0, top, Math.min(cell, bx + bw - x0), cell); if (x0 + cell < bx + bw) ctx.rect(x0 + cell, top + cell, Math.min(cell, bx + bw - x0 - cell), cell); }
  ctx.fill();
  const bh = s * 1.5, by = top + cell * 2, ins = s * 0.3;
  ctx.fillStyle = fogged([255, 200, 61], fg); ctx.fillRect(bx + ins, by, bw - ins * 2, bh);
  if (bh > 12) {
    ctx.fillStyle = fogged([30, 39, 72], fg); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = Math.round(Math.min(bh * 0.72, (bw - ins * 2) / 7)) + 'px ' + DISP; ctx.fillText('终点 FINISH 1000m', bx + bw / 2, by + bh / 2 + bh * 0.04);
  }
}
function drawChecker(o) {
  const cell = 0.6, n = Math.ceil(ROAD_HALF * 2 / cell), w = ROAD_HALF * 2 / n, paths = [new Path2D(), new Path2D()];
  for (let j = 0; j < o.rows; j++) {
    const z0 = o.z + j * cell, A = pt(-ROAD_HALF, roadY(z0), z0), B = pt(ROAD_HALF, roadY(z0 + cell), z0 + cell); if (!A || !B) continue;
    for (let i = 0; i < n; i++) {
      const path = paths[(i + j) & 1], xa = -ROAD_HALF + i * w, xb = xa + w;
      path.moveTo(A.x + A.s * xa, A.y); path.lineTo(A.x + A.s * xb, A.y); path.lineTo(B.x + B.s * xb, B.y); path.lineTo(B.x + B.s * xa, B.y); path.closePath();
    }
  }
  ctx.fillStyle = '#1E2748'; ctx.fill(paths[0]); ctx.fillStyle = '#FFF8E8'; ctx.fill(paths[1]);
}
const FLAG_COLS = [[255, 106, 77], [255, 200, 61], [31, 168, 224]];
function drawFlag(o, fg) {
  const ry = roadY(o.z), c = FLAG_COLS[((o.z / 8) | 0) % 3];
  for (let side = -1; side <= 1; side += 2) {
    const p = pt(side * RAIL_X, ry, o.z); if (!p) continue;
    const s = p.s, x = p.x, y = p.y - s * 0.9;
    ctx.fillStyle = fogged([230, 234, 240], fg); ctx.fillRect(x - s * 0.035, y - s * 1.1, Math.max(1, s * 0.07), s * 1.1);
    ctx.fillStyle = fogged(c, fg); ctx.beginPath(); ctx.moveTo(x, y - s * 1.1); ctx.lineTo(x - side * s * 0.8, y - s * 0.93); ctx.lineTo(x, y - s * 0.74); ctx.closePath(); ctx.fill();
  }
}
function drawUmbrella(o, fg) {
  const p = pt(o.x, 0, o.z); if (!p) return;
  const s = p.s, r = s * 1.5, y = p.y - s * 2.3;
  ctx.fillStyle = fogged([230, 230, 226], fg); ctx.fillRect(p.x - s * 0.05, y, Math.max(1, s * 0.1), s * 2.3);
  ctx.save(); ctx.beginPath(); ctx.ellipse(p.x, y, r, r * 0.48, 0, Math.PI, TAU); ctx.closePath(); ctx.clip();
  ctx.fillStyle = fogged(o.a, fg); ctx.fillRect(p.x - r, y - r, r * 2, r);
  ctx.fillStyle = fogged(o.b, fg); ctx.fillRect(p.x - r * 0.62, y - r, r * 0.28, r); ctx.fillRect(p.x + r * 0.34, y - r, r * 0.28, r);
  ctx.restore();
}
function drawBoat(o, fg) {
  const p = pt(o.x, 0, o.z); if (!p) return;
  const s = p.s, h = o.h * s, x = p.x, y = p.y, k = Math.sin(T * 1.2 + o.z) * s * 0.12;
  ctx.fillStyle = fogged([255, 255, 255], fg); ctx.beginPath(); ctx.moveTo(x - s * 1.7, y - s * 0.5 + k); ctx.lineTo(x + s * 1.7, y - s * 0.5 + k); ctx.lineTo(x + s * 1.1, y + k); ctx.lineTo(x - s * 1.1, y + k); ctx.closePath(); ctx.fill();
  ctx.fillStyle = fogged([226, 74, 64], fg); ctx.fillRect(x - s * 1.5, y - s * 0.36 + k, s * 3, s * 0.14);
  ctx.strokeStyle = fogged([120, 100, 84], fg); ctx.lineWidth = Math.max(1, s * 0.06); ctx.beginPath(); ctx.moveTo(x, y - s * 0.5 + k); ctx.lineTo(x, y - s * 0.5 - h + k); ctx.stroke();
  ctx.fillStyle = fogged([255, 251, 240], fg); ctx.beginPath(); ctx.moveTo(x + s * 0.08, y - s * 0.6 + k); ctx.lineTo(x + s * 0.08, y - s * 0.5 - h + k); ctx.lineTo(x + s * 1.5, y - s * 0.7 + k); ctx.closePath(); ctx.fill();
  ctx.fillStyle = fogged([255, 236, 200], fg); ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.6 + k); ctx.lineTo(x - s * 0.08, y - s * 0.5 - h * 0.86 + k); ctx.lineTo(x - s * 1.1, y - s * 0.7 + k); ctx.closePath(); ctx.fill();
}
function drawVending(o, fg) {
  const g = boxGeo(o.z, o.x - 0.5, o.x + 0.5, 0, 1.9, 0.75);
  const side = boxDraw(g, fogged(shC(o.col, 0.55), fg), rgba(fogArr(o.col, fg), 0.96), fogged(shC(o.col, 0.5), fg));
  if (side && g.sN > 10) {
    const xw = side > 0 ? g.l : g.r;
    ctx.fillStyle = fogged([255, 255, 255], fg); ctx.beginPath(); sideQuad(g, xw, 0.12, 0.88, 1.42, 1.66); ctx.fill();
    ctx.fillStyle = 'rgba(30,39,72,0.55)'; ctx.beginPath(); sideQuad(g, xw, 0.12, 0.88, 0.5, 0.72); ctx.fill();
  }
  if (fg < 0.5) drawGlow(o.col, (g.LN + g.RN) / 2, g.ybN - g.sN * 1.1, g.sN * 2.2, 0.3 * smooth(0.74, 0.96, cam.T) * (1 - fg));
}
/* 地面街道上的路灯：从高架俯视时是一排排小灯柱，用来交代高度 */
function drawGLamp(o, fg) {
  const p = pt(o.x, 0, o.z); if (!p) return;
  const s = p.s, w = Math.max(1, s * 0.16), k = smooth(0.36, 0.62, cam.T);
  ctx.fillStyle = fogged([70, 76, 100], fg); ctx.fillRect(p.x - w / 2, p.y - s * 7, w, s * 7);
  if (k > 0.04 && fg < 0.6) {
    drawGlow(LAMP_WARM, p.x, p.y - s * 7, s * 3.2, 0.6 * k * (1 - fg));
    if (s > 14) drawGlowE(LAMP_WARM, p.x, p.y, s * 5, s * 2.6, 0.3 * k * (1 - fg));
  }
  ctx.fillStyle = k > 0.04 ? 'rgb(255,232,170)' : fogged([225, 228, 232], fg); ctx.fillRect(p.x - s * 0.3, p.y - s * 7.1, s * 0.6, Math.max(1, s * 0.14));
}
function drawGround(o, fg) {
  switch (o.t) {
    case 'glamp': drawGLamp(o, fg); break;
    case 'tower': drawTower(o, fg); break;
    case 'shop': drawShop(o, fg); break;
    case 'house': drawHouse(o, fg); break;
    case 'umbrella': drawUmbrella(o, fg); break;
    case 'boat': drawBoat(o, fg); break;
    case 'vending': drawVending(o, fg); break;
  }
}
function drawDeco(o, fg) {
  switch (o.t) {
    case 'palm': drawPalm(o, fg); break;
    case 'lamp': drawLamp(o, fg); break;
    case 'gantry': drawGantry(o, fg); break;
    case 'gate': drawGate(o, fg); break;
    case 'checker': drawChecker(o); break;
    case 'flag': drawFlag(o, fg); break;
  }
}
