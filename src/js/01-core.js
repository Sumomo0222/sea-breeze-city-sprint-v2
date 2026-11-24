'use strict';
/* ======================================================================
   海风城市冲刺 · 单文件伪 3D 跑酷
   坐标约定（单位：米）
     z  沿赛道前进方向；x  横向（右为正，0 = 路面中线）；y  高度（0 = 地面）
   路面、护栏、金币、障碍、楼宇全部经过同一个投影函数：
     screenX = cx + f/dz * (x + 弯道偏移 - 镜头横向偏移)
     screenY = hy + f/dz * (镜头高度 - y)
   护栏取路缘外侧固定横向偏移，所以永远贴着道路边缘收敛到消失点。
   ====================================================================== */

/* ---------------------------- 1. 工具 ---------------------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(a, b) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + 0x9E3779B9) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = c => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shC = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
function keys4(arr, t) { const x = clamp(t, 0, 1) * 3, i = Math.min(2, x | 0); return mixC(arr[i], arr[i + 1], x - i); }
const fmtTime = t => { const m = (t / 60) | 0, s = t - m * 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };

/* ---------------------------- 2. 常量 ---------------------------- */
const SEG_LEN = 3, LANE_W = 2.7, ROAD_HALF = 4.05;
const RAIL_X = ROAD_HALF + 0.42, LEDGE_OUT = ROAD_HALF + 1.32, WALL_X = LEDGE_OUT + 0.04;
const LANE_X = [-LANE_W, 0, LANE_W];
const CAM_H = 2.3, CAT_H = 1.3, CAT_W = 0.8;
const Z_START = -45, Z_END = 1420, FINISH_Z = 1000;
const RAMP_UP = [312, 392], RAMP_DN = [650, 752], VH = 14;        // 上 / 下高架匝道
const Z_QUAY = 256, Z_CITY = 288, Z_EMB = 352, Z_SHOP = 696;      // 场景分区
const BIG = 900;                                                   // 地面条带向外的延伸
const STAGES = [
  { z: 0, n: '海边公路', en: 'SEASIDE HIGHWAY' },
  { z: 330, n: '城市高架', en: 'CITY VIADUCT' },
  { z: 696, n: '灯牌街区', en: 'NEON DISTRICT' },
];
const STREETS = [[-6, 6], [-14, -5.8], [5.8, 14], [-20, -14.5], [14.5, 20], [-39, -33], [33, 39], [-63, -57], [57, 63], [-94, -87], [87, 94], [-132, -125], [125, 132]];

/* ---------------------------- 3. 调色板与雾 ---------------------------- */
/* 四个关键帧：白天 → 日落 → 暮色 → 夜晚；T 由里程决定 */
const TKEYS = [[-80, 0], [230, 0.03], [320, 0.2], [440, 0.36], [560, 0.5], [640, 0.64], [720, 0.84], [800, 1]];
function timeAt(z) {
  const K = TKEYS;
  if (z <= K[0][0]) return K[0][1];
  for (let k = 0; k < K.length - 1; k++) if (z <= K[k + 1][0]) return lerp(K[k][1], K[k + 1][1], smooth(K[k][0], K[k + 1][0], z));
  return 1;
}
const PAL_DEF = {
  skyTop: ['#2B93E8', '#5A6AC4', '#272C6E', '#070B25'],
  skyMid: ['#7ECBF6', '#E8798E', '#46388C', '#141A4C'],
  haze: ['#DDF2FB', '#FFCB92', '#C8769F', '#6E3F93'],
  road: ['#6E7583', '#656582', '#404363', '#272B42'],
  lane: ['#FFFFFF', '#FFF2D9', '#ECE3F8', '#E2F6FF'],
  curbA: ['#FBFBF6', '#FFF0D8', '#D9D1EB', '#D4F1F6'],
  curbB: ['#2F9BE0', '#FF8A5C', '#B48CE0', '#FF5FB0'],
  plinth: ['#D6D1C5', '#C4A5A0', '#6A6488', '#363B5A'],
  railA: ['#FFFFFF', '#FFE9D0', '#C8C1E1', '#E8F3FF'],
  railB: ['#CFD5DC', '#BFA2AC', '#8580A8', '#96A2C4'],
  post: ['#98A2AD', '#86768E', '#524D76', '#48527D'],
  ledge: ['#E3DDCF', '#C2A2A6', '#5C5784', '#2C3156'],
  wallA: ['#CBC5B8', '#B49EB0', '#6A6390', '#383D62'],
  wallB: ['#B2AB9C', '#92809C', '#4E4978', '#25294A'],
  walk: ['#EBE5D7', '#D6B4A6', '#746C90', '#3A4062'],
  land: ['#BDD98E', '#B2A28C', '#595583', '#222648'],
  sand: ['#F8E7BA', '#F0C59E', '#84769A', '#383A60'],
  sea: ['#27A3DC', '#5872BA', '#2E3C7C', '#141C48'],
  ground: ['#A2BA8C', '#4C4872', '#313262', '#121636'],
  street: ['#8EA67D', '#403C66', '#282A54', '#191D43'],
  pier: ['#C6C1B7', '#AC98AC', '#635C8A', '#33385B'],
};
const PAL_KEYS = Object.keys(PAL_DEF), KP = {};
PAL_KEYS.forEach((k, i) => { KP[k] = i; PAL_DEF[k] = PAL_DEF[k].map(hex); });
const NPAL = 97, PALS = [];
for (let p = 0; p < NPAL; p++) PALS.push(PAL_KEYS.map(k => keys4(PAL_DEF[k], p / (NPAL - 1))));
const palIdAt = z => Math.round(timeAt(z) * (NPAL - 1));

/* 雾：全帧共用一个地平线雾色，远处物体融入背景 */
const NFOG = 32;
let HAZE = PALS[0][KP.haze], hazePal = -1;
const FOGLUT = new Map();
function setHaze(palId) {
  if (palId === hazePal) return;
  hazePal = palId; HAZE = PALS[palId][KP.haze]; FOGLUT.clear();
}
function fogged(c, fg) {
  let fq = (fg * NFOG) | 0; if (fq >= NFOG) fq = NFOG - 1;
  const r = c[0] >> 3, g = c[1] >> 3, b = c[2] >> 3;
  const key = ((r << 10) | (g << 5) | b) * NFOG + fq;
  let v = FOGLUT.get(key);
  if (v === undefined) {
    v = fq === NFOG - 1 ? rgb(HAZE) : rgb(mixC([r << 3, g << 3, b << 3], HAZE, (fq + 0.5) / NFOG));
    FOGLUT.set(key, v);
  }
  return v;
}
const fogAt = (d, DD) => (d > DD * 0.9 ? 1 : 1 - Math.exp(-Math.pow(d / (DD * 0.62), 3)));
const fogArr = (c, fg) => mixC(c, HAZE, clamp(fg, 0, 1));

/* ---------------------------- 4. 赛道几何 ---------------------------- */
/* 弯道以 [起点, 终点, 强度] 描述，强度单位：米 / 段² */
const CURVES = [[44, 132, 0.017], [156, 236, -0.019], [410, 520, -0.018], [546, 636, 0.02], [766, 846, 0.016], [868, 942, -0.017]];
function curveAt(z) {
  let c = 0;
  for (let i = 0; i < CURVES.length; i++) { const k = CURVES[i]; c += k[2] * (smooth(k[0], k[0] + 24, z) - smooth(k[1] - 24, k[1], z)); }
  return c / (SEG_LEN * SEG_LEN);
}
const elevAt = z => VH * smooth(RAMP_UP[0], RAMP_UP[1], z) - VH * smooth(RAMP_DN[0], RAMP_DN[1], z);

const SEGS = [];
(function buildTrack() {
  const n = Math.ceil((Z_END - Z_START) / SEG_LEN);
  let X = 0, s = 0;
  for (let i = 0; i < n; i++) {
    const z1 = Z_START + i * SEG_LEN, kappa = curveAt(z1 + 1.5);
    const g = { i, z1, z2: z1 + SEG_LEN, kappa, X1: X, s1: s, Y1: elevAt(z1), Y2: elevAt(z1 + SEG_LEN), palId: palIdAt(z1 + 1.5), ground: [], deco: [], items: [], wave: null };
    s += kappa * SEG_LEN;
    X += g.s1 * SEG_LEN + 0.5 * kappa * SEG_LEN * SEG_LEN;
    g.X2 = X; g.s2 = s;
    SEGS.push(g);
  }
})();
const NSEG = SEGS.length;
const segAt = z => SEGS[clamp(((z - Z_START) / SEG_LEN) | 0, 0, NSEG - 1)];
function roadX(z) { const g = segAt(z), l = z - g.z1; return g.X1 + g.s1 * l + 0.5 * g.kappa * l * l; }
function roadY(z) { const g = segAt(z), t = clamp((z - g.z1) / SEG_LEN, 0, 1); return lerp(g.Y1, g.Y2, t); }
const PIER_Z = [];
for (let z = 354; z < RAMP_DN[1] - 16; z += 30) PIER_Z.push(z);

/* ---------------------------- 5. 障碍尺寸 ---------------------------- */
const OB = {
  cone: { w: 0.5, d: 0.46, h: 0.75, jump: 1 },
  cooler: { w: 0.88, d: 0.72, h: 0.88, jump: 1 },
  toolbox: { w: 0.92, d: 0.5, h: 0.82, jump: 1 },
  bin: { w: 0.8, d: 0.74, h: 1.02, jump: 1 },
  icecream: { w: 1.9, d: 4.7, h: 2.05 },
  buggy: { w: 1.84, d: 4.0, h: 1.6 },
  taxi: { w: 1.84, d: 4.3, h: 1.52 },
  sedan: { w: 1.8, d: 4.3, h: 1.46 },
  teal: { w: 1.8, d: 4.2, h: 1.46 },
  white: { w: 1.82, d: 4.4, h: 1.5 },
  neonvan: { w: 1.9, d: 4.8, h: 2.0 },
  black: { w: 1.84, d: 4.5, h: 1.42 },
};
const TOTAL_COINS = { n: 0 };

/* ---------------------------- 6. 关卡生成（固定种子，每次赛道相同） ---------------------------- */
const ITEMS = [];
function genCourse() {
  const rnd = mulberry32(20261124), pk = a => a[(rnd() * a.length) | 0], rr = (a, b) => a + rnd() * (b - a);
  const others = l => [0, 1, 2].filter(k => k !== l);
  const jumpKind = z => (rnd() < 0.58 ? 'cone' : z < 330 ? 'cooler' : z < Z_SHOP ? 'toolbox' : 'bin');
  const carKind = z => (z < 330 ? pk(['icecream', 'buggy', 'icecream']) : z < Z_SHOP ? pk(['taxi', 'sedan', 'teal', 'taxi', 'white']) : pk(['taxi', 'neonvan', 'black', 'sedan', 'teal']));
  const obst = (kind, lane, z) => {
    const d = OB[kind], o = { kind, x: LANE_X[lane], z, w: d.w, d: d.d, h: d.h, jump: !!d.jump, dead: false, passed: false, ph: rnd() * 6, fg: 0 };
    ITEMS.push(o); segAt(z).items.push(o);
  };
  const coin = (lane, z, y = 0.78) => {
    const o = { kind: 'coin', x: LANE_X[lane], z, y, w: 0, d: 0, dead: false, ph: rnd() * TAU, fg: 0 };
    ITEMS.push(o); segAt(z).items.push(o);
  };
  const line = (lane, z, n, step = 2.1) => { for (let k = 0; k < n; k++) coin(lane, z + k * step); };
  const arc = (lane, z) => { const off = [-4.8, -2.4, 0, 2.4, 4.8], hh = [0.8, 1.4, 1.85, 1.4, 0.8]; for (let k = 0; k < 5; k++) coin(lane, z + off[k], hh[k]); };
  let z = 42, free = 1;
  line(1, 14, 5);
  while (z < 950) {
    const p = z / 1000;
    let adv = 0;
    const table = p < 0.3 ? [['jl', 3], ['ja', 3], ['car', 2], ['zig', 2]]
      : p < 0.66 ? [['jl', 2], ['ja', 2], ['car', 3], ['cc', 3], ['two', 1], ['zig', 1], ['sla', 1]]
      : [['ja', 2], ['car', 3], ['cc', 3], ['two', 3], ['tri', 2], ['sla', 2], ['zig', 1]];
    let sum = 0; for (let i = 0; i < table.length; i++) sum += table[i][1];
    let r = rnd() * sum, kind = 'car';
    for (let i = 0; i < table.length; i++) { r -= table[i][1]; if (r <= 0) { kind = table[i][0]; break; } }
    switch (kind) {
      case 'jl': { const l = (rnd() * 3) | 0; obst(jumpKind(z), l, z); line(pk(others(l)), z - 3, 4); break; }
      case 'ja': { const l = (rnd() * 3) | 0; obst(jumpKind(z), l, z); arc(l, z); break; }
      case 'car': { const l = (rnd() * 3) | 0; obst(carKind(z), l, z); free = pk(others(l)); line(free, z + 0.5, 5, 2.0); break; }
      case 'cc': {
        const c = (rnd() * 3) | 0; free = pk(others(c).filter(k => Math.abs(k - free) <= 1).concat(others(c)));
        obst(carKind(z), c, z); obst(jumpKind(z + 2), 3 - c - free, z + 2); line(free, z - 1, 5, 2.0); break;
      }
      case 'two': {
        const f = pk([0, 1, 2].filter(k => Math.abs(k - free) <= 1)); free = f;
        for (const k of [0, 1, 2]) if (k !== f) obst(carKind(z), k, z + (rnd() < 0.5 ? 0 : 3.2));
        line(f, z - 2, 6, 2.0); break;
      }
      case 'tri': { for (const k of [0, 1, 2]) obst('cone', k, z + (k === 1 ? 0 : 1.2)); arc(1, z); break; }
      case 'sla': {
        let l = (rnd() * 3) | 0;
        for (let k = 0; k < 3; k++) { obst(jumpKind(z + k * 8), l, z + k * 8); l = clamp(l + (rnd() < 0.5 ? -1 : 1), 0, 2); }
        adv = 16; break;
      }
      case 'zig': {
        let l = (rnd() * 3) | 0;
        for (let k = 0; k < 8; k++) { coin(l, z + k * 2.4); if (k % 2 === 1) l = clamp(l + (l === 0 ? 1 : l === 2 ? -1 : (rnd() < 0.5 ? -1 : 1)), 0, 2); }
        adv = 8; break;
      }
    }
    z += lerp(27, 16.5, smooth(0.05, 0.9, p)) * rr(0.92, 1.18) + adv;
  }
  ITEMS.sort((a, b) => a.z - b.z);
  TOTAL_COINS.n = ITEMS.reduce((n, o) => n + (o.kind === 'coin' ? 1 : 0), 0);
}
