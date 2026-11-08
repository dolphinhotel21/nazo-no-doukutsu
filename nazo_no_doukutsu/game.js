// =============================
// 謎の洞窟 〜 姫と伝説の秘宝 〜
// =============================

// ストレージ（使えない環境ではメモリに退避）
const store = (() => {
  const mem = {};
  return {
    getItem(k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = String(v); } },
    removeItem(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } },
  };
})();

// =============================
// 定数定義
// =============================
const CONFIG = {
  MAP_SIZE: 25,
  VIEW_SIZE: 15,
  FOG_RADIUS: 3,
  ESCAPE_RATE_NORMAL: 0.45,
  ESCAPE_RATE_THIEF: 0.75,
  MAX_ITEMS: 20,
  MAX_LV: 30,
  SAVE_SLOT_KEY: 'nazo_no_doukutsu_v2_slot_',
  SOUND_KEY: 'nazo_no_doukutsu_muted',
  DPAD_KEY: 'nazo_no_doukutsu_dpad',
  SAVE_SLOTS: 3,
};

const TILE = {
  WALL: '#', FLOOR: '.',
  STAIR_DOWN: '>', STAIR_UP: '<',
  HOUSE: 'H', INN: 'I', MAGIC_SHOP: 'M', WEAPON_SHOP: 'W', ARMOR_SHOP: 'A', ITEM_SHOP: 'T',
  CASTLE: 'K', DUNGEON_ENTRANCE: 'D',
  TREE: 'Y', WATER: '~', FLOWER: '*',
  CHEST: 'C', LEGEND_CHEST: 'L', CHEST_OPEN: 'c',
  SPRING: 'F', SPRING_DRY: 'f',
  TRAP: '^', TRAP_SEEN: 'x',
  BOSS: 'B', TREASURE: '$', CELL: 'P',
};
const BLOCKING = new Set([TILE.WALL, TILE.TREE, TILE.WATER]);

const FLOORS = {
  dungeon1: { name: 'B1F', no: 1, enc: 0.10, pool: 'b1', bgm: 'dungeon' },
  dungeon2: { name: 'B2F', no: 2, enc: 0.12, pool: 'b2', bgm: 'dungeon' },
  dungeon3: { name: 'B3F', no: 3, enc: 0.13, pool: 'b3', bgm: 'dungeon' },
  dungeon4: { name: 'B4F', no: 4, enc: 0.14, pool: 'b4', bgm: 'deep' },
  dungeon5: { name: 'B5F', no: 5, enc: 0.15, pool: 'b5', bgm: 'deep' },
};
const MAP_ORDER = ['town', 'dungeon1', 'dungeon2', 'dungeon3', 'dungeon4', 'dungeon5'];
const MAP_NAMES = { town: '町', dungeon1: 'B1F', dungeon2: 'B2F', dungeon3: 'B3F', dungeon4: 'B4F', dungeon5: 'B5F' };

// 職業
const JOBS = {
  warrior: { name: '戦士', base: { hp: 40, mp: 4, atk: 13, def: 9 }, growth: { hp: 8, mp: 1, atk: 3, def: 2 }, spells: [], initialWeapon: 'wooden_sword' },
  mage:    { name: '魔法使い', base: { hp: 22, mp: 24, atk: 6, def: 4 }, growth: { hp: 4, mp: 5, atk: 1, def: 1 }, spells: ['fire', 'heal'], initialWeapon: 'thin_staff' },
  priest:  { name: '僧侶', base: { hp: 30, mp: 18, atk: 8, def: 7 }, growth: { hp: 6, mp: 4, atk: 2, def: 2 }, spells: ['heal', 'protect'], initialWeapon: 'thin_staff' },
  thief:   { name: '盗賊', base: { hp: 32, mp: 8, atk: 11, def: 7 }, growth: { hp: 6, mp: 2, atk: 3, def: 2 }, spells: ['smoke', 'poison'], initialWeapon: 'dagger' },
};

// 魔法（威力はレベルで伸びる）
const SPELLS = {
  fire:     { name: 'ファイア',   type: 'attack', mp: 4,  desc: '炎で攻撃（防御無視）', jobs: ['mage', 'thief'], fx: 'fire' },
  blizzard: { name: 'ブリザード', type: 'attack', mp: 5,  desc: '氷で大ダメージ', jobs: ['mage'], fx: 'ice' },
  thunder:  { name: 'サンダー',   type: 'attack', mp: 8,  desc: '雷で特大ダメージ', jobs: ['mage'], fx: 'thunder' },
  holy:     { name: 'ホーリー',   type: 'attack', mp: 5,  desc: '聖なる光（不死に2倍）', jobs: ['priest'], fx: 'holy' },
  heal:     { name: 'ヒール',     type: 'heal',   mp: 3,  desc: 'HPを回復', jobs: ['priest', 'mage'], fx: 'heal' },
  fullheal: { name: 'フルヒール', type: 'heal',   mp: 8,  desc: 'HPを大回復', jobs: ['priest'], fx: 'heal' },
  protect:  { name: 'プロテクト', type: 'buff',   mp: 4,  desc: '次の被ダメージ半減', jobs: ['priest'], fx: 'buff' },
  poison:   { name: 'ポイズン',   type: 'debuff', mp: 3,  desc: '敵を毒にする', jobs: ['thief', 'mage'], fx: 'poison' },
  smoke:    { name: 'スモーク',   type: 'escape', mp: 2,  desc: '必ず逃げる（ボス不可）', jobs: ['thief'], fx: 'run' },
};
const MAGIC_SHOP_LIST = [
  { id: 'poison', price: 120 }, { id: 'smoke', price: 80 }, { id: 'holy', price: 250 },
  { id: 'blizzard', price: 250 }, { id: 'fullheal', price: 400 }, { id: 'thunder', price: 600 },
];

const WEAPONS = {
  wooden_sword:  { name: '木の剣',       atk: 3,  price: 0,   sell: 0,   jobs: ['warrior', 'thief'], magicBonus: 0, escapeBonus: 0 },
  dagger:        { name: '短剣',         atk: 2,  price: 0,   sell: 0,   jobs: ['warrior', 'mage', 'priest', 'thief'], magicBonus: 0, escapeBonus: 0 },
  thin_staff:    { name: '細身の杖',     atk: 1,  price: 0,   sell: 0,   jobs: ['warrior', 'mage', 'priest', 'thief'], magicBonus: 0, escapeBonus: 0 },
  iron_sword:    { name: '鉄の剣',       atk: 8,  price: 150, sell: 75,  jobs: ['warrior', 'thief'], magicBonus: 0, escapeBonus: 0 },
  mace:          { name: 'メイス',       atk: 7,  price: 180, sell: 90,  jobs: ['priest', 'warrior'], magicBonus: 0, escapeBonus: 0 },
  magic_staff:   { name: '魔法の杖',     atk: 4,  price: 300, sell: 150, jobs: ['mage', 'priest'], magicBonus: 0.3, escapeBonus: 0 },
  ninja_blade:   { name: '忍者刀',       atk: 13, price: 500, sell: 250, jobs: ['thief'], magicBonus: 0, escapeBonus: 0.15 },
  mithril_sword: { name: 'ミスリルの剣', atk: 17, price: 900, sell: 450, jobs: ['warrior'], magicBonus: 0, escapeBonus: 0 },
  // 伝説の武器（B4Fの宝箱から）
  hero_sword:    { name: '勇者の剣',     atk: 28, price: 0, sell: 300, jobs: ['warrior'], magicBonus: 0, escapeBonus: 0, legend: true },
  sage_staff:    { name: '賢者の杖',     atk: 9,  price: 0, sell: 300, jobs: ['mage'], magicBonus: 0.7, escapeBonus: 0, legend: true },
  holy_staff:    { name: '聖者の杖',     atk: 14, price: 0, sell: 300, jobs: ['priest'], magicBonus: 0.6, escapeBonus: 0, legend: true },
  wind_blade:    { name: '風魔の小太刀', atk: 22, price: 0, sell: 300, jobs: ['thief'], magicBonus: 0, escapeBonus: 0.3, legend: true },
};
const LEGEND_WEAPON = { warrior: 'hero_sword', mage: 'sage_staff', priest: 'holy_staff', thief: 'wind_blade' };
const WEAPON_SHOP_LIST = ['iron_sword', 'mace', 'magic_staff', 'ninja_blade', 'mithril_sword'];

const ARMORS = {
  cloth:         { name: '布の服',       def: 1,  price: 0,    sell: 0,   jobs: ['warrior', 'mage', 'priest', 'thief'], mpBonus: 0, escapeBonus: 0 },
  leather_armor: { name: '革の鎧',       def: 4,  price: 100,  sell: 50,  jobs: ['warrior', 'mage', 'priest', 'thief'], mpBonus: 0, escapeBonus: 0 },
  magic_robe:    { name: '魔法のローブ', def: 4,  price: 250,  sell: 125, jobs: ['mage', 'priest'], mpBonus: 10, escapeBonus: 0 },
  iron_armor:    { name: '鉄の鎧',       def: 9,  price: 320,  sell: 160, jobs: ['warrior', 'priest'], mpBonus: 0, escapeBonus: 0 },
  shadow_armor:  { name: '影の装束',     def: 9,  price: 450,  sell: 225, jobs: ['thief'], mpBonus: 0, escapeBonus: 0.10 },
  holy_robe:     { name: '聖なるローブ', def: 10, price: 750,  sell: 375, jobs: ['mage', 'priest'], mpBonus: 15, escapeBonus: 0 },
  mithril_armor: { name: 'ミスリル鎧',   def: 17, price: 1000, sell: 500, jobs: ['warrior'], mpBonus: 0, escapeBonus: 0 },
};
const ARMOR_SHOP_LIST = ['leather_armor', 'magic_robe', 'iron_armor', 'shadow_armor', 'holy_robe', 'mithril_armor'];

const CONSUMABLES = {
  herb:       { name: '薬草',     effect: 'heal',     power: 30,  price: 10,  sell: 5,  desc: 'HPを30回復' },
  super_herb: { name: '上薬草',   effect: 'heal',     power: 70,  price: 35,  sell: 17, desc: 'HPを70回復' },
  mega_herb:  { name: '特薬草',   effect: 'heal',     power: 150, price: 110, sell: 55, desc: 'HPを150回復' },
  ether:      { name: 'エーテル', effect: 'mp',       power: 15,  price: 45,  sell: 22, desc: 'MPを15回復' },
  antidote:   { name: '毒消し草', effect: 'antidote', power: 0,   price: 12,  sell: 6,  desc: '毒を治す' },
  holy_water: { name: '聖水',     effect: 'holy',     power: 0,   price: 60,  sell: 30, desc: '不死の敵に大ダメージ' },
};
const ITEM_SHOP_LIST = ['herb', 'super_herb', 'mega_herb', 'ether', 'antidote', 'holy_water'];

// 敵データ（type は戦闘グラフィックの種類）
const ENEMIES = {
  b1: [
    { name: 'スライム',   hp: 10, atk: 7,  def: 1,  exp: 10, gold: 4,  type: 'slime' },
    { name: 'コウモリ',   hp: 12, atk: 8,  def: 2,  exp: 13, gold: 5,  type: 'bat' },
    { name: 'ゴブリン',   hp: 18, atk: 10, def: 3,  exp: 20, gold: 9,  type: 'goblin' },
  ],
  b2: [
    { name: 'ゾンビ',     hp: 34, atk: 17, def: 5,  exp: 30, gold: 14, type: 'zombie', undead: true },
    { name: '毒ヘビ',     hp: 28, atk: 19, def: 4,  exp: 28, gold: 12, type: 'snake', special: 'poison' },
    { name: 'オーク',     hp: 45, atk: 21, def: 8,  exp: 40, gold: 22, type: 'orc' },
  ],
  b3: [
    { name: '骸骨騎士',   hp: 60, atk: 29, def: 11, exp: 60, gold: 30, type: 'skeleton', undead: true },
    { name: 'ガーゴイル', hp: 56, atk: 31, def: 15, exp: 64, gold: 32, type: 'gargoyle' },
    { name: '闇の魔術師', hp: 46, atk: 27, def: 7,  exp: 68, gold: 42, type: 'darkmage', special: 'spell' },
  ],
  b4: [
    { name: 'ダークナイト', hp: 85,  atk: 41, def: 17, exp: 110, gold: 55, type: 'dark' },
    { name: 'ケルベロス',   hp: 95,  atk: 45, def: 12, exp: 120, gold: 60, type: 'beast' },
    { name: 'ミノタウロス', hp: 110, atk: 48, def: 14, exp: 140, gold: 72, type: 'minotaur' },
  ],
  b5: [
    { name: 'リッチ',     hp: 100, atk: 51, def: 14, exp: 180, gold: 90,  type: 'lich', undead: true, special: 'spell' },
    { name: 'ワイバーン', hp: 120, atk: 55, def: 16, exp: 190, gold: 90,  type: 'wyvern' },
    { name: 'アークデーモン', hp: 140, atk: 59, def: 18, exp: 220, gold: 110, type: 'demon' },
  ],
  golem: { name: '門番ゴーレム', hp: 190, atk: 38, def: 18, exp: 320, gold: 150, type: 'golem' },
  boss:  { name: '暗黒竜ヴォルガン', hp: 340, atk: 56, def: 22, exp: 1200, gold: 600, type: 'boss', special: 'breath' },
};

// =============================
// ゲーム状態
// =============================
let game = newGameState();

function newGameState() {
  return {
    screen: 'title',
    player: null,
    maps: {},
    currentMap: 'town',
    explored: {},
    flags: { golemDefeated: false, bossDefeated: false, hasTreasure: false, princessRescued: false, legendTaken: false },
    stats: { steps: 0, kills: 0 },
    follower: null,          // 姫の位置 {x, y}
    messages: ['', '', ''],
    inputEnabled: true,
  };
}

// =============================
// ユーティリティ
// =============================
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-' + id).classList.add('active');
  game.screen = id;
  if (id === 'game') requestAnimationFrame(() => { fitMap(); renderMap(); });
}

function addMessage(text, color) {
  game.messages.shift();
  game.messages.push(text);
  for (let i = 0; i < 3; i++) {
    const el = $('msg-' + i);
    el.textContent = game.messages[i];
    el.style.color = color && i === 2 ? color : '';
  }
}

function hpColor(current, max) {
  const r = current / max;
  if (r > 0.5) return '#00cc33';
  if (r > 0.25) return '#ffaa00';
  return '#ff3333';
}

// =============================
// プレイヤー
// =============================
function createPlayer(name, jobKey) {
  const job = JOBS[jobKey];
  return {
    name, job: jobKey, lv: 1, exp: 0, expNext: expNeeded(1),
    hp: job.base.hp, maxHp: job.base.hp,
    mp: job.base.mp, maxMp: job.base.mp,
    baseAtk: job.base.atk, baseDef: job.base.def,
    weapon: job.initialWeapon, armor: 'cloth',
    items: [{ id: 'herb', count: 3 }],
    spells: [...job.spells],
    gold: 120, poisoned: false, x: 0, y: 0,
  };
}
function expNeeded(lv) { return 6 * lv * (lv + 3); }
function getAtk(p) { return p.baseAtk + WEAPONS[p.weapon].atk; }
function getDef(p) { return p.baseDef + ARMORS[p.armor].def; }
function getMaxMp(p) { return p.maxMp + ARMORS[p.armor].mpBonus; }
function magicMul(p) { return 1 + WEAPONS[p.weapon].magicBonus; }

// =============================
// マップ生成
// =============================
function createTownMap() {
  const S = CONFIG.MAP_SIZE;
  const g = Array.from({ length: S }, (_, y) =>
    Array.from({ length: S }, (_, x) => (x === 0 || y === 0 || x === S - 1 || y === S - 1) ? TILE.WALL : TILE.FLOOR));
  const put = (x, y, t) => { g[y][x] = t; };

  // 外周の木立
  for (let i = 1; i < S - 1; i++) {
    if (i % 3 !== 0) { put(i, 1, TILE.TREE); put(i, S - 2, TILE.TREE); put(1, i, TILE.TREE); put(S - 2, i, TILE.TREE); }
  }
  // 城と城の前庭
  put(12, 2, TILE.CASTLE);
  [[10, 2], [14, 2], [10, 3], [14, 3]].forEach(([x, y]) => put(x, y, TILE.TREE));
  // 建物
  put(4, 6, TILE.HOUSE);
  put(8, 6, TILE.INN);
  put(17, 6, TILE.MAGIC_SHOP);
  put(5, 12, TILE.WEAPON_SHOP);
  put(12, 12, TILE.ARMOR_SHOP);
  put(19, 12, TILE.ITEM_SHOP);
  // 池
  for (let y = 16; y <= 18; y++) for (let x = 16; x <= 20; x++) put(x, y, TILE.WATER);
  put(16, 16, TILE.FLOOR); put(20, 18, TILE.FLOOR);
  // 木と花
  [[3, 9], [7, 9], [15, 9], [20, 9], [3, 16], [6, 18], [9, 15], [21, 14], [14, 20], [9, 20]].forEach(([x, y]) => put(x, y, TILE.TREE));
  [[6, 4], [18, 4], [11, 8], [13, 8], [4, 14], [10, 17], [15, 14], [21, 20], [3, 20], [18, 21]].forEach(([x, y]) => put(x, y, TILE.FLOWER));
  // 洞窟の入口（南）
  put(12, 22, TILE.DUNGEON_ENTRANCE);
  put(12, 23, TILE.TREE);
  put(11, 22, TILE.TREE); put(13, 22, TILE.TREE);
  put(12, 21, TILE.FLOOR);

  return { grid: g, startX: 4, startY: 7, returnX: 12, returnY: 21, id: 'town' };
}

function createDungeonMap(id) {
  const S = CONFIG.MAP_SIZE;
  const no = FLOORS[id].no;
  const grid = Array.from({ length: S }, () => Array(S).fill(TILE.WALL));

  // 迷路（再帰バックトラッキング）
  const stack = [[1, 1]];
  grid[1][1] = TILE.FLOOR;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]]);
    let moved = false;
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < S - 1 && ny > 0 && ny < S - 1 && grid[ny][nx] === TILE.WALL) {
        grid[y + dy / 2][x + dx / 2] = TILE.FLOOR;
        grid[ny][nx] = TILE.FLOOR;
        stack.push([nx, ny]);
        moved = true;
        break;
      }
    }
    if (!moved) stack.pop();
  }
  // 抜け道を開けて、行き止まりだらけにならないようにする
  for (let k = 0; k < 28; k++) {
    const x = rand(1, S - 2), y = rand(1, S - 2);
    if (grid[y][x] !== TILE.WALL) continue;
    const h = grid[y][x - 1] === TILE.FLOOR && grid[y][x + 1] === TILE.FLOOR;
    const v = grid[y - 1] && grid[y + 1] && grid[y - 1][x] === TILE.FLOOR && grid[y + 1][x] === TILE.FLOOR;
    if (h !== v) grid[y][x] = TILE.FLOOR;
  }

  // 入口からの歩数（通路の距離）を計算
  const startX = 1, startY = 1;
  const dist = Array.from({ length: S }, () => Array(S).fill(-1));
  const q = [[startX, startY]];
  dist[startY][startX] = 0;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (grid[ny][nx] === TILE.FLOOR && dist[ny][nx] < 0) {
        dist[ny][nx] = dist[y][x] + 1;
        q.push([nx, ny]);
      }
    }
  }
  const cells = [];
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) if (dist[y][x] > 0) cells.push({ x, y, d: dist[y][x] });
  cells.sort((a, b) => b.d - a.d);
  const used = new Set([`${startX},${startY}`]);
  const take = (c, t) => { used.add(`${c.x},${c.y}`); grid[c.y][c.x] = t; return c; };
  const farthestFree = () => cells.find(c => !used.has(`${c.x},${c.y}`));
  const randomFree = (minD, maxD) => {
    const pool = cells.filter(c => !used.has(`${c.x},${c.y}`) && c.d >= minD && c.d <= maxD);
    return pool.length ? pool[rand(0, pool.length - 1)] : farthestFree();
  };
  const maxD = cells[0].d;

  grid[startY][startX] = TILE.STAIR_UP;
  let bossPos = null;
  if (no < 5) {
    take(farthestFree(), TILE.STAIR_DOWN);
  } else {
    bossPos = take(farthestFree(), TILE.BOSS);
    take(farthestFree(), TILE.TREASURE);
    take(farthestFree(), TILE.CELL);
  }
  if (no === 4) take(farthestFree(), TILE.LEGEND_CHEST);
  const chestCount = no === 5 ? 2 : 3;
  for (let i = 0; i < chestCount; i++) take(randomFree(6, maxD - 2), TILE.CHEST);
  take(randomFree(Math.floor(maxD * 0.35), Math.floor(maxD * 0.7)), TILE.SPRING);
  for (let i = 0; i < no + 1; i++) take(randomFree(4, maxD - 1), TILE.TRAP);

  return { grid, startX, startY, id, bossPos };
}

function initMaps() {
  game.maps = { town: createTownMap() };
  game.explored = { town: new Set() };
  for (const id of Object.keys(FLOORS)) {
    game.maps[id] = createDungeonMap(id);
    game.explored[id] = new Set();
  }
}

// =============================
// マップ描画
// =============================
let tilePx = 24;
let viewW = CONFIG.VIEW_SIZE, viewH = CONFIG.VIEW_SIZE;
let lastView = { x: 0, y: 0 };
function fitMap() {
  const area = $('map-area');
  if (!area) return;
  const w = area.clientWidth, h = area.clientHeight || w;
  // 横15マスを基準にタイルの大きさを決め、縦は画面の高さに合わせて増やす
  tilePx = clamp(Math.floor(Math.min(w / CONFIG.VIEW_SIZE, h / CONFIG.VIEW_SIZE)), 14, 40);
  viewW = CONFIG.VIEW_SIZE;
  viewH = clamp(Math.floor(h / tilePx), CONFIG.VIEW_SIZE, CONFIG.MAP_SIZE);
  if (viewH % 2 === 0) viewH--;
  document.documentElement.style.setProperty('--tile', tilePx + 'px');
}

function renderMap() {
  if (!game.player || !game.maps[game.currentMap]) return;
  const { grid } = game.maps[game.currentMap];
  const S = CONFIG.MAP_SIZE;
  const p = game.player;
  const viewX = clamp(p.x - Math.floor(viewW / 2), 0, S - viewW);
  const viewY = clamp(p.y - Math.floor(viewH / 2), 0, S - viewH);
  lastView = { x: viewX, y: viewY };
  const container = $('map-container');
  container.style.gridTemplateColumns = `repeat(${viewW}, var(--tile))`;
  const explored = game.explored[game.currentMap];
  const showFollower = game.flags.princessRescued && game.follower;
  const isTown = game.currentMap === 'town';
  const frag = document.createDocumentFragment();

  for (let ry = 0; ry < viewH; ry++) {
    for (let rx = 0; rx < viewW; rx++) {
      const mx = viewX + rx, my = viewY + ry;
      const key = `${mx},${my}`;
      const tile = document.createElement('div');
      tile.className = 'tile';
      const isPlayer = mx === p.x && my === p.y;
      const inSight = isTown || Math.abs(mx - p.x) + Math.abs(my - p.y) <= CONFIG.FOG_RADIUS;
      if (!inSight && !explored.has(key)) {
        tile.classList.add('fog-hidden');
        frag.appendChild(tile);
        continue;
      }
      const look = Art.cellLayers(game.currentMap, grid[my][mx]);
      const layers = [...look.layers];
      if (showFollower && game.follower.x === mx && game.follower.y === my && !isPlayer) layers.unshift(Art.princessSprite());
      if (isPlayer) layers.unshift(Art.playerSprite(p.job));
      tile.style.backgroundImage = layers.join(',');
      if (look.label && !isPlayer) {
        const lb = document.createElement('span');
        lb.className = 'tile-label';
        lb.textContent = look.label;
        tile.appendChild(lb);
      }
      if (!inSight) tile.classList.add('fog-explored');
      frag.appendChild(tile);
    }
  }
  container.replaceChildren(frag);
}

// =============================
// ステータス表示
// =============================
function updateStatusPanel() {
  const p = game.player;
  if (!p) return;
  $('st-name').textContent = p.name;
  $('st-job').textContent = JOBS[p.job].name;
  $('st-lv').textContent = `LV ${p.lv}`;
  $('st-exp').textContent = `EXP ${p.exp}/${p.expNext}`;
  const hpEl = $('st-hp');
  hpEl.textContent = `HP ${p.hp}/${p.maxHp}`;
  hpEl.style.color = hpColor(p.hp, p.maxHp);
  $('st-mp').textContent = `MP ${p.mp}/${getMaxMp(p)}`;
  $('st-atk').textContent = `攻 ${getAtk(p)}`;
  $('st-def').textContent = `防 ${getDef(p)}`;
  $('st-weapon').textContent = `武: ${WEAPONS[p.weapon].name}`;
  $('st-armor').textContent = `防: ${ARMORS[p.armor].name}`;
  $('st-gold').textContent = `${p.gold} ペリカ`;
  let loc = MAP_NAMES[game.currentMap] || '─';
  if (p.poisoned) loc += ' [毒]';
  if (game.flags.princessRescued) loc += ' ♥姫';
  $('st-location').textContent = loc;

  const itemsEl = $('st-items');
  itemsEl.replaceChildren();
  if (!p.items.length) {
    const d = document.createElement('div');
    d.textContent = 'なし';
    itemsEl.appendChild(d);
  } else {
    for (const it of p.items) {
      const d = document.createElement('div');
      d.textContent = `${CONSUMABLES[it.id].name} x${it.count}`;
      itemsEl.appendChild(d);
    }
  }
}

// =============================
// 移動
// =============================
const MOVE_MAP = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};

function tryMove(dx, dy) {
  if (!game.inputEnabled || game.screen !== 'game') return;
  const p = game.player;
  const nx = p.x + dx, ny = p.y + dy;
  const { grid } = game.maps[game.currentMap];
  if (nx < 0 || ny < 0 || nx >= CONFIG.MAP_SIZE || ny >= CONFIG.MAP_SIZE) return;
  const cell = grid[ny][nx];
  if (BLOCKING.has(cell)) {
    if (cell === TILE.WATER) addMessage('池だ。泳いで渡るのはやめておこう。');
    return;
  }
  const px = p.x, py = p.y;
  p.x = nx; p.y = ny;
  if (game.flags.princessRescued) game.follower = { x: px, y: py };
  game.stats.steps++;
  markExplored();
  handleTileEvent(cell);
}

function markExplored() {
  const p = game.player;
  const ex = game.explored[game.currentMap];
  const R = CONFIG.FOG_RADIUS, S = CONFIG.MAP_SIZE;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const ax = p.x + dx, ay = p.y + dy;
    if (ax >= 0 && ay >= 0 && ax < S && ay < S && Math.abs(dx) + Math.abs(dy) <= R) ex.add(`${ax},${ay}`);
  }
}

function setCell(t) {
  const p = game.player;
  game.maps[game.currentMap].grid[p.y][p.x] = t;
}

function handleTileEvent(cell) {
  const p = game.player;
  const floor = FLOORS[game.currentMap];

  switch (cell) {
    case TILE.HOUSE:
      openDialog('[ 自宅 ]', game.flags.princessRescued
        ? '母「まあ、お姫様！ 早くお城へお連れしなさい」'
        : '母「洞窟の奥は危ないわ。疲れたら宿屋で休むのよ。<br>セーブはメニューからできるからね」');
      return;
    case TILE.CASTLE: openCastle(); return;
    case TILE.INN: openInn(); return;
    case TILE.MAGIC_SHOP: openMagicShop(); return;
    case TILE.WEAPON_SHOP: openEquipShop('weapon'); return;
    case TILE.ARMOR_SHOP: openEquipShop('armor'); return;
    case TILE.ITEM_SHOP: openItemShop(); return;
    case TILE.DUNGEON_ENTRANCE:
      Sound.sfx('stairs');
      changeMap('dungeon1');
      addMessage('謎の洞窟に足を踏み入れた…', '#ffaa00');
      return;
    case TILE.STAIR_DOWN:
      if (game.currentMap === 'dungeon3' && !game.flags.golemDefeated) {
        addMessage('階段の前に、巨大な石の門番が立ちはだかった！', '#ff6666');
        startBattle('golem');
        return;
      }
      Sound.sfx('stairs');
      changeMap(MAP_ORDER[MAP_ORDER.indexOf(game.currentMap) + 1]);
      addMessage(game.currentMap === 'dungeon5'
        ? 'B5Fへ降りた。竜の唸り声が聞こえる…' : `${MAP_NAMES[game.currentMap]}へ降りた。`, game.currentMap === 'dungeon5' ? '#ff6666' : '#ffaa00');
      return;
    case TILE.STAIR_UP: {
      Sound.sfx('stairsUp');
      const prev = MAP_ORDER[MAP_ORDER.indexOf(game.currentMap) - 1];
      changeMap(prev);
      addMessage(prev === 'town' ? '町へ戻った。' : `${MAP_NAMES[prev]}へ戻った。`, '#00ff41');
      return;
    }
    case TILE.CHEST: openChest(floor.no); break;
    case TILE.LEGEND_CHEST: openLegendChest(); break;
    case TILE.SPRING:
      p.hp = p.maxHp; p.mp = getMaxMp(p); p.poisoned = false;
      setCell(TILE.SPRING_DRY);
      Sound.sfx('heal');
      flashScreen('heal');
      addMessage('不思議な泉の水を飲んだ。HP・MPが全回復した！', '#66ccff');
      renderAll();
      return;
    case TILE.SPRING_DRY:
      addMessage('泉はもう枯れている。');
      break;
    case TILE.TRAP: triggerTrap(floor.no); if (game.screen !== 'game') return; break;
    case TILE.BOSS:
      if (!game.flags.bossDefeated) {
        addMessage('暗黒竜ヴォルガンが目を覚ました！', '#ff3333');
        startBattle('boss');
        return;
      }
      break;
    case TILE.TREASURE:
      if (!game.flags.bossDefeated) {
        addMessage('竜の魔力に阻まれて、秘宝に近づけない…', '#888');
      } else {
        game.flags.hasTreasure = true;
        setCell(TILE.FLOOR);
        Sound.sfx('chest');
        flashScreen('gold');
        addMessage('伝説の秘宝「竜の瞳」を手に入れた！', '#ffd700');
      }
      renderAll();
      return;
    case TILE.CELL:
      if (!game.flags.bossDefeated) {
        addMessage('牢の中に誰かいる…。竜の魔力で扉が開かない。', '#888');
      } else {
        game.flags.princessRescued = true;
        game.follower = null;
        setCell(TILE.FLOOR);
        Sound.sfx('door');
        openDialog('[ 姫を救い出した！ ]',
          '姫「助けに来てくださったのですね…！<br>さあ、一緒に城へ帰りましょう」<br><br><span style="color:#0af">姫が仲間に加わった。町の城へ連れて帰ろう。</span>');
        renderAll();
        return;
      }
      renderAll();
      return;
  }

  if (game.screen !== 'game') return;
  if (game.inputEnabled) checkEncounter();

  if (p.poisoned && game.screen === 'game') {
    if (Math.random() < 0.06) {
      p.poisoned = false;
      addMessage('毒が抜けた。', '#66ccff');
    } else {
      const dmg = Math.max(1, Math.floor(p.maxHp * 0.04));
      p.hp = Math.max(1, p.hp - dmg);
      addMessage(`毒が体をむしばむ… ${dmg}ダメージ`, '#ff66ff');
    }
  }
  renderAll();
}

function renderAll() { renderMap(); updateStatusPanel(); }

function changeMap(target) {
  const prev = game.currentMap;
  game.currentMap = target;
  const m = game.maps[target];
  if (target === 'town') {
    if (prev && prev !== 'town') { game.player.x = m.returnX; game.player.y = m.returnY; }
    else { game.player.x = m.startX; game.player.y = m.startY; }
  } else if (MAP_ORDER.indexOf(prev) > MAP_ORDER.indexOf(target)) {
    // 下の階から戻ってきた：下り階段の位置に立つ
    const g = m.grid;
    let found = null;
    for (let y = 0; y < g.length && !found; y++) for (let x = 0; x < g.length; x++) if (g[y][x] === TILE.STAIR_DOWN) { found = { x, y }; break; }
    game.player.x = found ? found.x : m.startX;
    game.player.y = found ? found.y : m.startY;
  } else {
    game.player.x = m.startX; game.player.y = m.startY;
  }
  game.follower = null;
  markExplored();
  playMapBgm();
  renderAll();
}

function playMapBgm() {
  if (game.currentMap === 'town') Sound.bgm('town');
  else Sound.bgm(FLOORS[game.currentMap].bgm);
}

function checkEncounter() {
  const f = FLOORS[game.currentMap];
  if (!f) return;
  if (Math.random() < f.enc) startBattle('normal');
}

// ---------- 宝箱・罠 ----------
function openChest(no) {
  const p = game.player;
  setCell(TILE.CHEST_OPEN);
  Sound.sfx('chest');
  if (Math.random() < 0.4) {
    const g = rand(20, 40) * no;
    p.gold += g;
    addMessage(`宝箱を開けた！ ${g}ペリカ手に入れた！`, '#ffd700');
    return;
  }
  const table = no <= 1 ? ['herb', 'herb', 'antidote', 'super_herb']
    : no === 2 ? ['herb', 'super_herb', 'antidote', 'ether']
    : no === 3 ? ['super_herb', 'ether', 'holy_water', 'super_herb']
    : ['super_herb', 'mega_herb', 'ether', 'holy_water'];
  const id = table[rand(0, table.length - 1)];
  const cnt = rand(1, 2);
  if (addItem(p, id, cnt)) addMessage(`宝箱を開けた！ ${CONSUMABLES[id].name}を${cnt}個手に入れた！`, '#ffd700');
  else { p.gold += 50; addMessage('持ち物がいっぱいだ。代わりに50ペリカ拾った。', '#ffd700'); }
}

function openLegendChest() {
  const p = game.player;
  setCell(TILE.CHEST_OPEN);
  const id = LEGEND_WEAPON[p.job];
  p.weapon = id;
  game.flags.legendTaken = true;
  Sound.sfx('levelup');
  flashScreen('gold');
  openDialog('[ 伝説の武器 ]', `古びた宝箱の中に、<span style="color:#ffd700">${WEAPONS[id].name}</span>が眠っていた！<br>手に取ると、力がみなぎってくる…<br><br>${WEAPONS[id].name}を装備した。（攻撃力 +${WEAPONS[id].atk}）`);
}

function triggerTrap(no) {
  const p = game.player;
  setCell(TILE.TRAP_SEEN);
  if (p.job === 'thief') {
    Sound.sfx('select');
    addMessage('罠を見破って、難なく解除した。', '#66ccff');
    return;
  }
  Sound.sfx('trap');
  flashScreen('damage');
  if (Math.random() < 0.4 && !p.poisoned) {
    p.poisoned = true;
    addMessage('毒針の罠だ！ 毒を受けた！', '#ff66ff');
  } else {
    const dmg = Math.floor(p.maxHp * 0.08) + no * 3;
    p.hp = Math.max(1, p.hp - dmg);
    addMessage(`落とし穴の罠だ！ ${dmg}ダメージ！`, '#ff6666');
  }
}

// =============================
// 演出
// =============================
function flashScreen(kind) {
  const el = $('fx-flash');
  el.className = '';
  void el.offsetWidth;
  el.className = 'fx-' + kind;
}

function popNumber(text, cls, anchorId) {
  const anchor = $(anchorId);
  if (!anchor) return;
  const s = document.createElement('div');
  s.className = 'pop-num ' + cls;
  s.textContent = text;
  anchor.appendChild(s);
  setTimeout(() => s.remove(), 900);
}

function shake(id) {
  const el = $(id);
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

// =============================
// カーソル（キーボード選択）
// =============================
let cursor = { context: null, index: 0 };
function getCursorButtons() {
  switch (cursor.context) {
    case 'battle_main': return [...document.querySelectorAll('#battle-main-cmd .battle-btn')];
    case 'battle_sub': return [...document.querySelectorAll('#sub-cmd-list .battle-btn'), $('btn-sub-back')].filter(Boolean);
    case 'shop': return [...document.querySelectorAll('#shop-content .shop-btn'), $('btn-shop-close')].filter(Boolean);
    case 'menu': return [...document.querySelectorAll('#menu-window .btn')].filter(b => b.offsetParent !== null);
    default: return [];
  }
}
function renderCursor() {
  getCursorButtons().forEach((b, i) => b.classList.toggle('cursor-selected', i === cursor.index));
}
function setCursorContext(ctx, index) { cursor.context = ctx; cursor.index = index || 0; renderCursor(); }
function moveCursor(d) {
  const b = getCursorButtons();
  if (!b.length) return;
  cursor.index = (cursor.index + d + b.length) % b.length;
  renderCursor();
}
function executeCursor() {
  const b = getCursorButtons()[cursor.index];
  if (b && !b.disabled) b.click();
}
function handleCursorEscape() {
  if (cursor.context === 'battle_sub') showBattleMainCmd();
  else if (cursor.context === 'shop') closeShop();
  else if (cursor.context === 'menu') toggleMenu();
}

// =============================
// バトル
// =============================
let battleState = null;

function startBattle(kind) {
  let tmpl;
  if (kind === 'boss') tmpl = ENEMIES.boss;
  else if (kind === 'golem') tmpl = ENEMIES.golem;
  else {
    const pool = ENEMIES[FLOORS[game.currentMap].pool];
    tmpl = pool[rand(0, pool.length - 1)];
  }
  const enemy = JSON.parse(JSON.stringify(tmpl));
  enemy.maxHp = enemy.hp;

  battleState = {
    enemy, kind, boss: kind !== 'normal',
    playerDefending: false, enemyPoisoned: false, protectActive: false,
    turn: 0, ended: false, busy: false,
  };
  game.inputEnabled = false;

  const ov = $('battle-overlay');
  ov.classList.remove('hidden');
  ov.dataset.floor = game.currentMap;
  $('battle-window').classList.toggle('boss', battleState.boss);
  $('battle-header').textContent = kind === 'boss' ? `[ ${enemy.name} ]` : `[ ${enemy.name} が あらわれた！ ]`;
  const sprite = $('battle-enemy-sprite');
  sprite.innerHTML = Art.enemySVG(enemy.type, battleState.boss ? 128 : 96);
  sprite.classList.remove('dead');
  $('battle-enemy-name').textContent = enemy.name;
  updateBattleEnemyHp();
  updateBattlePlayerBar();
  $('battle-turn-msg').textContent = 'コマンド？';
  $('battle-log').replaceChildren();
  Sound.bgm(battleState.boss ? 'boss' : 'battle');
  if (kind === 'boss') addBattleLog('「愚かな人間め…。姫は渡さぬ！」', '#ff6666');
  if (kind === 'golem') addBattleLog('「ココ ヨリ サキ ニハ トオサヌ」', '#ff9966');
  showBattleMainCmd();
}

function updateBattleEnemyHp() {
  const e = battleState.enemy;
  const r = Math.max(0, e.hp / e.maxHp);
  const fill = $('battle-hp-fill');
  fill.style.width = `${r * 100}%`;
  fill.style.background = hpColor(e.hp, e.maxHp);
  $('battle-enemy-hp-num').textContent = `${Math.max(0, e.hp)}/${e.maxHp}`;
  $('battle-status-msg').textContent = battleState.enemyPoisoned ? '[毒]' : '';
}

function updateBattlePlayerBar() {
  const p = game.player;
  const el = $('battle-player-bar');
  el.innerHTML = `<span>${esc(p.name)}</span><span style="color:${hpColor(p.hp, p.maxHp)}">HP ${p.hp}/${p.maxHp}</span><span style="color:#8af">MP ${p.mp}/${getMaxMp(p)}</span>${p.poisoned ? '<span style="color:#f6f">毒</span>' : ''}${battleState && battleState.protectActive ? '<span style="color:#0af">守</span>' : ''}`;
}

function showBattleMainCmd() {
  $('battle-main-cmd').classList.remove('hidden');
  $('battle-sub-cmd').classList.add('hidden');
  document.querySelector('[data-cmd="magic"]').disabled = game.player.spells.length === 0;
  document.querySelector('[data-cmd="item"]').disabled = game.player.items.length === 0;
  document.querySelector('[data-cmd="run"]').disabled = !!(battleState && battleState.boss);
  setCursorContext('battle_main');
}

function addBattleLog(text, color) {
  const log = $('battle-log');
  const line = document.createElement('div');
  line.textContent = text;
  if (color) line.style.color = color;
  log.appendChild(line);
  while (log.children.length > 6) log.firstChild.remove();
  log.scrollTop = log.scrollHeight;
}

function onBattleCommand(cmd) {
  if (!battleState || battleState.ended || battleState.busy) return;
  Sound.sfx('select');
  if (cmd === 'attack') playerAttack();
  else if (cmd === 'magic') openMagicSubMenu();
  else if (cmd === 'item') openItemSubMenu();
  else if (cmd === 'defend') playerDefend();
  else if (cmd === 'run') playerRun();
}

function physDamage(atk, def) {
  return Math.max(1, Math.round((atk - def / 2) * (0.85 + Math.random() * 0.3)));
}

function damageEnemy(dmg, color, sfx) {
  const e = battleState.enemy;
  e.hp -= dmg;
  Sound.sfx(sfx || 'hit');
  shake('battle-enemy-sprite');
  popNumber(dmg, color || 'pop-enemy', 'battle-enemy-area');
  updateBattleEnemyHp();
  if (e.hp <= 0) { e.hp = 0; endBattleWin(); return true; }
  return false;
}

function playerAttack() {
  const p = game.player;
  const e = battleState.enemy;
  const crit = Math.random() < 1 / 16;
  let dmg = physDamage(getAtk(p), e.def);
  if (crit) dmg = Math.round(dmg * 1.8);
  addBattleLog(crit ? `会心の一撃！ ${e.name}に ${dmg}ダメージ！` : `${p.name}の攻撃！ ${e.name}に ${dmg}ダメージ！`, crit ? '#ffd700' : '#fff');
  if (damageEnemy(dmg, crit ? 'pop-crit' : 'pop-enemy', crit ? 'crit' : 'hit')) return;
  enemyTurnLater();
}

function openMagicSubMenu() {
  const p = game.player;
  $('battle-main-cmd').classList.add('hidden');
  $('battle-sub-cmd').classList.remove('hidden');
  $('sub-cmd-title').textContent = 'どの魔法を使う？';
  const list = $('sub-cmd-list');
  list.replaceChildren();
  for (const sid of p.spells) {
    const sp = SPELLS[sid];
    const b = document.createElement('button');
    b.className = 'battle-btn';
    b.textContent = `${sp.name} (MP${sp.mp}) ${sp.desc}`;
    b.disabled = p.mp < sp.mp;
    b.addEventListener('click', () => useMagic(sid));
    list.appendChild(b);
  }
  setCursorContext('battle_sub');
}

function openItemSubMenu() {
  const p = game.player;
  $('battle-main-cmd').classList.add('hidden');
  $('battle-sub-cmd').classList.remove('hidden');
  $('sub-cmd-title').textContent = 'どの道具を使う？';
  const list = $('sub-cmd-list');
  list.replaceChildren();
  for (const it of p.items) {
    const c = CONSUMABLES[it.id];
    const b = document.createElement('button');
    b.className = 'battle-btn';
    b.textContent = `${c.name} x${it.count}  ${c.desc}`;
    b.addEventListener('click', () => useItemInBattle(it.id));
    list.appendChild(b);
  }
  setCursorContext('battle_sub');
}

function spellPower(sid, p) {
  const lv = p.lv;
  switch (sid) {
    case 'fire': return Math.round((16 + lv * 3 + rand(0, 8)) * magicMul(p));
    case 'blizzard': return Math.round((22 + lv * 4 + rand(0, 8)) * magicMul(p));
    case 'thunder': return Math.round((32 + lv * 5 + rand(0, 10)) * magicMul(p));
    case 'holy': return Math.round((18 + lv * 3 + rand(0, 6)) * magicMul(p));
    case 'heal': return 22 + lv * 4 + rand(0, 6);
    case 'fullheal': return 60 + lv * 8 + rand(0, 10);
    default: return 0;
  }
}

function useMagic(sid) {
  const p = game.player;
  const e = battleState.enemy;
  const sp = SPELLS[sid];
  if (p.mp < sp.mp) return;
  p.mp -= sp.mp;
  showBattleMainCmd();
  updateBattlePlayerBar();

  switch (sp.type) {
    case 'attack': {
      let dmg = spellPower(sid, p);
      if (sid === 'blizzard') dmg = Math.max(1, dmg - Math.floor(e.def / 2));
      if (sid === 'holy' && e.undead) dmg *= 2;
      if (battleState.boss) dmg = Math.round(dmg * 0.65); // 門番と竜は魔法に強い
      flashScreen(sp.fx);
      addBattleLog(`${sp.name}！ ${e.name}に ${dmg}ダメージ！`, '#aaf');
      if (damageEnemy(dmg, 'pop-magic', sp.fx)) return;
      break;
    }
    case 'heal': {
      const amt = Math.min(p.maxHp - p.hp, spellPower(sid, p));
      p.hp += amt;
      Sound.sfx('heal');
      flashScreen('heal');
      popNumber('+' + amt, 'pop-heal', 'battle-player-bar');
      addBattleLog(`${sp.name}！ HPが${amt}回復した！`, '#0f0');
      break;
    }
    case 'buff':
      battleState.protectActive = true;
      Sound.sfx('buff');
      addBattleLog(`${sp.name}！ 光の盾が身を包んだ！`, '#0af');
      break;
    case 'debuff':
      Sound.sfx('poison');
      if (!battleState.enemyPoisoned && e.type !== 'golem') {
        battleState.enemyPoisoned = true;
        addBattleLog(`${sp.name}！ ${e.name}は毒に侵された！`, '#a0f');
      } else addBattleLog(`${sp.name}！ しかし効かなかった…`, '#888');
      updateBattleEnemyHp();
      break;
    case 'escape':
      if (!battleState.boss) {
        Sound.sfx('run');
        addBattleLog('スモーク！ 煙に紛れて逃げ出した！', '#aaa');
        endBattleEscape();
        return;
      }
      addBattleLog('スモーク！ しかし逃げられない！', '#f66');
      break;
  }
  updateBattlePlayerBar();
  updateStatusPanel();
  enemyTurnLater();
}

function applyItemEffect(id, inBattle) {
  const p = game.player;
  const c = CONSUMABLES[id];
  switch (c.effect) {
    case 'heal': {
      const amt = Math.min(p.maxHp - p.hp, c.power);
      p.hp += amt;
      Sound.sfx('heal');
      if (inBattle) popNumber('+' + amt, 'pop-heal', 'battle-player-bar');
      return `${c.name}を使った。HPが${amt}回復した！`;
    }
    case 'mp': {
      const amt = Math.min(getMaxMp(p) - p.mp, c.power);
      p.mp += amt;
      Sound.sfx('heal');
      return `${c.name}を使った。MPが${amt}回復した！`;
    }
    case 'antidote':
      p.poisoned = false;
      Sound.sfx('heal');
      return `${c.name}を使った。毒が消えた！`;
    default: return '';
  }
}

function useItemInBattle(id) {
  const p = game.player;
  const e = battleState.enemy;
  const c = CONSUMABLES[id];
  showBattleMainCmd();
  consumeItem(p, id);
  if (c.effect === 'holy') {
    if (e.undead) {
      const dmg = rand(80, 110);
      flashScreen('holy');
      addBattleLog(`聖水を浴びせた！ ${e.name}に ${dmg}の大ダメージ！`, '#ffd');
      if (damageEnemy(dmg, 'pop-magic', 'holy')) return;
    } else addBattleLog('聖水を浴びせた！ しかし効果がない…', '#888');
  } else {
    addBattleLog(applyItemEffect(id, true), '#0f0');
  }
  updateBattlePlayerBar();
  updateStatusPanel();
  showBattleMainCmd();
  enemyTurnLater();
}

function consumeItem(p, id) {
  const i = p.items.findIndex(x => x.id === id);
  if (i < 0) return;
  p.items[i].count--;
  if (p.items[i].count <= 0) p.items.splice(i, 1);
}

function addItem(p, id, count = 1) {
  const total = p.items.reduce((s, i) => s + i.count, 0);
  if (total + count > CONFIG.MAX_ITEMS) return false;
  const ex = p.items.find(i => i.id === id);
  if (ex) ex.count += count;
  else p.items.push({ id, count });
  return true;
}

function playerDefend() {
  battleState.playerDefending = true;
  addBattleLog(`${game.player.name}は身を守っている。`, '#aaa');
  enemyTurnLater();
}

function playerRun() {
  if (battleState.boss) { addBattleLog('逃げられない！', '#f66'); return; }
  const p = game.player;
  let rate = p.job === 'thief' ? CONFIG.ESCAPE_RATE_THIEF : CONFIG.ESCAPE_RATE_NORMAL;
  rate = clamp(rate + ARMORS[p.armor].escapeBonus + WEAPONS[p.weapon].escapeBonus, 0, 1);
  if (Math.random() < rate) {
    Sound.sfx('run');
    addBattleLog('うまく逃げ出した！', '#aaa');
    endBattleEscape();
  } else {
    addBattleLog('しかし回り込まれた！', '#f66');
    enemyTurnLater();
  }
}

function enemyTurnLater() {
  battleState.busy = true;
  setTimeout(() => { if (battleState && !battleState.ended) enemyTurn(); }, 450);
}

function enemyTurn() {
  const p = game.player;
  const e = battleState.enemy;
  const bs = battleState;
  bs.turn++;

  if (bs.enemyPoisoned) {
    const pd = Math.max(1, Math.floor(e.maxHp * 0.06));
    addBattleLog(`${e.name}は毒で ${pd}ダメージを受けた！`, '#a0f');
    e.hp -= pd;
    popNumber(pd, 'pop-poison', 'battle-enemy-area');
    updateBattleEnemyHp();
    if (e.hp <= 0) { e.hp = 0; endBattleWin(); return; }
  }

  let dmg;
  if (e.special === 'breath' && bs.turn % 3 === 0) {
    dmg = rand(50, 72);
    flashScreen('fire');
    Sound.sfx('fire');
    addBattleLog(`ヴォルガンは灼熱の炎を吐いた！`, '#ff4400');
  } else if (e.special === 'spell' && Math.random() < 0.35) {
    dmg = Math.round(e.atk * (0.7 + Math.random() * 0.3));
    flashScreen('thunder');
    Sound.sfx('thunder');
    addBattleLog(`${e.name}は呪文を唱えた！`, '#f8f');
  } else if (e.type === 'golem' && bs.turn % 4 === 0) {
    dmg = Math.round(physDamage(e.atk, getDef(p)) * 1.8);
    addBattleLog('ゴーレムは大きく腕を振り下ろした！', '#f96');
  } else {
    dmg = physDamage(e.atk, getDef(p));
    addBattleLog(`${e.name}の攻撃！`, '#f88');
  }
  if (bs.playerDefending) dmg = Math.floor(dmg * 0.5);
  if (bs.protectActive) { dmg = Math.floor(dmg * 0.5); bs.protectActive = false; }
  dmg = Math.max(1, dmg);
  p.hp -= dmg;
  addBattleLog(`${p.name}は ${dmg}のダメージを受けた！`, '#f88');
  Sound.sfx('hurt');
  shake('battle-window');
  flashScreen('damage');
  popNumber(dmg, 'pop-player', 'battle-player-bar');

  if (e.special === 'poison' && !p.poisoned && Math.random() < 0.3) {
    p.poisoned = true;
    addBattleLog(`${p.name}は毒を受けた！`, '#a0f');
  }
  bs.playerDefending = false;

  if (p.hp <= 0) {
    p.hp = 0;
    updateBattlePlayerBar();
    updateStatusPanel();
    endBattleLose();
    return;
  }
  bs.busy = false;
  updateBattlePlayerBar();
  updateStatusPanel();
  $('battle-turn-msg').textContent = 'コマンド？';
  showBattleMainCmd();
}

function endBattleWin() {
  if (battleState.ended) return;
  const bs = battleState;
  bs.ended = true;
  cursor.context = null;
  const e = bs.enemy;
  const p = game.player;
  p.exp += e.exp;
  p.gold += e.gold;
  game.stats.kills++;
  $('battle-enemy-sprite').classList.add('dead');
  Sound.bgm(null);
  Sound.sfx('win');
  addBattleLog(`${e.name}を倒した！`, '#ffd700');
  addBattleLog(`経験値 ${e.exp}  ${e.gold}ペリカ を手に入れた`, '#ffd700');

  if (bs.kind === 'golem') game.flags.golemDefeated = true;
  if (bs.kind === 'boss') {
    game.flags.bossDefeated = true;
    setCell(TILE.FLOOR);
  }
  const leveled = checkLevelUp();
  updateStatusPanel();

  setTimeout(() => {
    $('battle-overlay').classList.add('hidden');
    battleState = null;
    game.inputEnabled = true;
    playMapBgm();
    renderAll();
    if (bs.kind === 'boss') {
      openDialog('[ 竜を討ち倒した！ ]', '暗黒竜ヴォルガンは崩れ落ちた…<br>竜の魔力が消え、牢の扉と秘宝の封印が解けた！<br><br><span style="color:#0af">近くの牢から姫を救い出そう。</span>');
    } else if (bs.kind === 'golem') {
      addMessage('門番を倒した！ もう一度階段を踏むと下へ降りられる。', '#ffd700');
    } else {
      addMessage(`${e.name}を倒した！ EXP+${e.exp} ${e.gold}P`, '#ffd700');
    }
    if (leveled) addMessage(`レベルが ${p.lv} に上がった！`, '#ffd700');
  }, leveled ? 1900 : 1300);
}

function endBattleEscape() {
  battleState.ended = true;
  cursor.context = null;
  setTimeout(() => {
    $('battle-overlay').classList.add('hidden');
    battleState = null;
    game.inputEnabled = true;
    playMapBgm();
    addMessage('うまく逃げ切った。');
    renderAll();
  }, 700);
}

function endBattleLose() {
  battleState.ended = true;
  cursor.context = null;
  addBattleLog(`${game.player.name}は力尽きた…`, '#ff3333');
  document.querySelectorAll('#battle-main-cmd .battle-btn').forEach(b => { b.disabled = true; });
  Sound.bgm(null);
  setTimeout(() => {
    $('battle-overlay').classList.add('hidden');
    battleState = null;
    triggerGameOver();
  }, 1600);
}

function checkLevelUp() {
  const p = game.player;
  let up = false;
  while (p.exp >= p.expNext && p.lv < CONFIG.MAX_LV) {
    p.exp -= p.expNext;
    p.lv++;
    p.expNext = expNeeded(p.lv);
    const g = JOBS[p.job].growth;
    p.maxHp += g.hp + rand(0, 2);
    p.maxMp += g.mp;
    p.baseAtk += g.atk;
    p.baseDef += g.def;
    p.hp = p.maxHp;
    p.mp = getMaxMp(p);
    up = true;
    if (battleState) addBattleLog(`レベルアップ！ LV ${p.lv} になった！`, '#ffd700');
  }
  if (up) {
    setTimeout(() => { Sound.sfx('levelup'); flashScreen('gold'); }, 500);
  }
  return up;
}

// =============================
// 店・会話（共通のウィンドウ）
// =============================
function openShop(title, html) {
  game.inputEnabled = false;
  $('shop-title').textContent = title;
  $('shop-content').innerHTML = html;
  $('shop-overlay').classList.remove('hidden');
  setTimeout(() => setCursorContext('shop'), 0);
}

function closeShop() {
  cursor.context = null;
  $('shop-overlay').classList.add('hidden');
  game.inputEnabled = true;
  updateStatusPanel();
  if (game.pendingEnding) { game.pendingEnding = false; triggerEnding(); }
}

function openDialog(title, html) {
  openShop(title, `<div class="dialog-text">${html}</div>`);
}

function goldLine() { return `<div class="shop-gold-info">所持金: ${game.player.gold} ペリカ</div>`; }

function openCastle() {
  const f = game.flags;
  if (f.princessRescued) {
    Sound.sfx('door');
    game.pendingEnding = true;
    openDialog('[ 城 ]', '王「おお…姫！ よくぞ無事で…！」<br>王の目に、涙が光った。');
    return;
  }
  let text = '王「よく来た、旅の者よ。<br>わが娘ミレーユ姫が、暗黒竜ヴォルガンにさらわれてしまった。<br>竜は南の謎の洞窟、その最深部に棲むという…。<br>どうか姫を救い出してくれ！」';
  if (f.bossDefeated) text = '王「竜を倒したと…!? ならば姫は牢の中じゃ！ 早く連れ帰ってくれ！」';
  else if (f.golemDefeated) text = '王「B3Fの門番を倒したか。竜はさらに奥、B5Fじゃ。<br>B4Fのどこかに、伝説の武器が眠っているとも聞く…」';
  else if (game.player.lv >= 4) text += '<br><br>大臣「B3Fには石の門番がいるとか。十分に鍛えてから挑まれよ」';
  openDialog('[ 城 ]', text);
}

function openInn() {
  const cost = game.player.lv * 8;
  openShop('[ 宿屋 ]', `
    <div class="dialog-text">宿屋へようこそ！ 一泊 ${cost} ペリカ です。</div>
    ${goldLine()}
    <div class="shop-row-btns">
      <button class="shop-btn" id="btn-inn-stay" ${game.player.gold < cost ? 'disabled' : ''}>泊まる (${cost}P)</button>
      <button class="shop-btn" id="btn-inn-cancel">やめる</button>
    </div>`);
  $('btn-inn-stay')?.addEventListener('click', () => {
    const p = game.player;
    p.gold -= cost;
    p.hp = p.maxHp; p.mp = getMaxMp(p); p.poisoned = false;
    Sound.sfx('heal');
    closeShop();
    flashScreen('heal');
    addMessage('ぐっすり眠った。HP・MPが全回復した！', '#00ff41');
  });
  $('btn-inn-cancel').addEventListener('click', closeShop);
}

function openMagicShop() {
  const p = game.player;
  let rows = '<div class="shop-section-title">魔法を習う</div>';
  for (const ent of MAGIC_SHOP_LIST) {
    const sp = SPELLS[ent.id];
    const can = sp.jobs.includes(p.job);
    const owned = p.spells.includes(ent.id);
    const dis = !can || owned || p.gold < ent.price;
    const label = owned ? '習得済' : !can ? '職業×' : `${ent.price}P`;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}">
      <span class="shop-item-name">${sp.name}<small>${sp.desc}</small></span>
      <span class="shop-item-price">${label}</span>
      <button class="shop-btn" data-buy-spell="${ent.id}" ${dis ? 'disabled' : ''}>習う</button></div>`;
  }
  openShop('[ 魔法屋 ]', rows + goldLine());
  document.querySelectorAll('[data-buy-spell]').forEach(b => b.addEventListener('click', () => {
    const sid = b.dataset.buySpell;
    p.gold -= MAGIC_SHOP_LIST.find(e => e.id === sid).price;
    p.spells.push(sid);
    Sound.sfx('coin');
    addMessage(`${SPELLS[sid].name}を習得した！`, '#aaf');
    openMagicShop();
  }));
}

function openEquipShop(type) {
  const p = game.player;
  const catalog = type === 'weapon' ? WEAPONS : ARMORS;
  const list = type === 'weapon' ? WEAPON_SHOP_LIST : ARMOR_SHOP_LIST;
  const cur = type === 'weapon' ? p.weapon : p.armor;
  let rows = `<div class="shop-section-title">買う（いまの装備: ${catalog[cur].name}）</div>`;
  for (const id of list) {
    const it = catalog[id];
    const can = it.jobs.includes(p.job);
    const dis = !can || p.gold < it.price || id === cur;
    const stat = type === 'weapon' ? `攻+${it.atk}${it.magicBonus ? ` 魔力${Math.round(it.magicBonus * 100)}%` : ''}` : `防+${it.def}${it.mpBonus ? ` MP+${it.mpBonus}` : ''}`;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}">
      <span class="shop-item-name">${it.name}<small>${stat}${can ? '' : '（装備できない）'}</small></span>
      <span class="shop-item-price">${id === cur ? '装備中' : it.price + 'P'}</span>
      <button class="shop-btn" data-buy-equip="${id}" ${dis ? 'disabled' : ''}>買う</button></div>`;
  }
  const cItem = catalog[cur];
  rows += `<div class="shop-section-title">売る</div>`;
  rows += cItem.sell
    ? `<div class="shop-item-row"><span class="shop-item-name">${cItem.name}</span><span class="shop-item-price">${cItem.sell}P</span><button class="shop-btn" data-sell-equip="1">売る</button></div>`
    : `<div class="shop-item-row disabled"><span class="shop-item-name">${cItem.name}</span><span>売れない</span></div>`;
  openShop(type === 'weapon' ? '[ 武器屋 ]' : '[ 防具屋 ]', rows + goldLine());

  document.querySelectorAll('[data-buy-equip]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.buyEquip;
    p.gold -= catalog[id].price;
    p[type] = id;
    if (type === 'armor') p.mp = Math.min(p.mp, getMaxMp(p));
    Sound.sfx('coin');
    addMessage(`${catalog[id].name}を買って装備した！`, '#0af');
    openEquipShop(type);
  }));
  document.querySelector('[data-sell-equip]')?.addEventListener('click', () => {
    p.gold += cItem.sell;
    p[type] = type === 'weapon' ? JOBS[p.job].initialWeapon : 'cloth';
    if (type === 'armor') p.mp = Math.min(p.mp, getMaxMp(p));
    Sound.sfx('coin');
    addMessage(`${cItem.name}を売った。+${cItem.sell}P`, '#ffd700');
    openEquipShop(type);
  });
}

function openItemShop() {
  const p = game.player;
  let rows = '<div class="shop-section-title">買う</div>';
  for (const id of ITEM_SHOP_LIST) {
    const c = CONSUMABLES[id];
    const dis = p.gold < c.price;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}">
      <span class="shop-item-name">${c.name}<small>${c.desc}</small></span>
      <span class="shop-item-price">${c.price}P</span>
      <button class="shop-btn" data-buy-item="${id}" ${dis ? 'disabled' : ''}>買う</button></div>`;
  }
  rows += '<div class="shop-section-title">売る</div>';
  if (!p.items.length) rows += '<div class="dim">売れる道具がない</div>';
  for (const it of p.items) {
    const c = CONSUMABLES[it.id];
    rows += `<div class="shop-item-row"><span class="shop-item-name">${c.name} x${it.count}</span>
      <span class="shop-item-price">${c.sell}P</span><button class="shop-btn" data-sell-item="${it.id}">売る</button></div>`;
  }
  openShop('[ 道具屋 ]', rows + goldLine());
  document.querySelectorAll('[data-buy-item]').forEach(b => b.addEventListener('click', () => {
    const c = CONSUMABLES[b.dataset.buyItem];
    if (!addItem(p, b.dataset.buyItem)) { Sound.sfx('error'); addMessage('これ以上持てない！'); return; }
    p.gold -= c.price;
    Sound.sfx('coin');
    addMessage(`${c.name}を買った。`, '#0af');
    openItemShop();
  }));
  document.querySelectorAll('[data-sell-item]').forEach(b => b.addEventListener('click', () => {
    const c = CONSUMABLES[b.dataset.sellItem];
    consumeItem(p, b.dataset.sellItem);
    p.gold += c.sell;
    Sound.sfx('coin');
    addMessage(`${c.name}を売った。+${c.sell}P`, '#ffd700');
    openItemShop();
  }));
}

// ---------- フィールドで道具・魔法を使う ----------
function openFieldItems() {
  const p = game.player;
  let rows = '';
  const usable = p.items.filter(it => CONSUMABLES[it.id].effect !== 'holy');
  if (!usable.length) rows = '<div class="dim">使える道具がない</div>';
  for (const it of usable) {
    const c = CONSUMABLES[it.id];
    rows += `<div class="shop-item-row"><span class="shop-item-name">${c.name} x${it.count}<small>${c.desc}</small></span>
      <button class="shop-btn" data-use-item="${it.id}">使う</button></div>`;
  }
  openShop(`[ 道具 ]  HP ${p.hp}/${p.maxHp}  MP ${p.mp}/${getMaxMp(p)}`, rows);
  document.querySelectorAll('[data-use-item]').forEach(b => b.addEventListener('click', () => {
    const msg = applyItemEffect(b.dataset.useItem, false);
    consumeItem(p, b.dataset.useItem);
    addMessage(msg, '#0f0');
    updateStatusPanel();
    openFieldItems();
  }));
}

function openFieldMagic() {
  const p = game.player;
  const heals = p.spells.filter(s => SPELLS[s].type === 'heal');
  let rows = heals.length ? '' : '<div class="dim">ここで使える魔法がない</div>';
  for (const sid of heals) {
    const sp = SPELLS[sid];
    rows += `<div class="shop-item-row ${p.mp < sp.mp ? 'disabled' : ''}"><span class="shop-item-name">${sp.name}<small>MP${sp.mp} ${sp.desc}</small></span>
      <button class="shop-btn" data-cast="${sid}" ${p.mp < sp.mp ? 'disabled' : ''}>唱える</button></div>`;
  }
  openShop(`[ 魔法 ]  HP ${p.hp}/${p.maxHp}  MP ${p.mp}/${getMaxMp(p)}`, rows);
  document.querySelectorAll('[data-cast]').forEach(b => b.addEventListener('click', () => {
    const sid = b.dataset.cast;
    p.mp -= SPELLS[sid].mp;
    const amt = Math.min(p.maxHp - p.hp, spellPower(sid, p));
    p.hp += amt;
    Sound.sfx('heal');
    addMessage(`${SPELLS[sid].name}！ HPが${amt}回復した。`, '#0f0');
    updateStatusPanel();
    openFieldMagic();
  }));
}

// =============================
// セーブ / ロード
// =============================
function formatNow() {
  const d = new Date();
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

function saveToSlot(slot) {
  const maps = {};
  for (const [id, m] of Object.entries(game.maps)) maps[id] = { ...m, grid: m.grid.map(r => r.join('')) };
  const data = {
    version: 2,
    savedAt: formatNow(),
    charInfo: { name: game.player.name, job: game.player.job, lv: game.player.lv, location: MAP_NAMES[game.currentMap] },
    player: game.player,
    currentMap: game.currentMap,
    maps,
    explored: Object.fromEntries(Object.entries(game.explored).map(([k, v]) => [k, [...v]])),
    flags: game.flags,
    stats: game.stats,
  };
  store.setItem(CONFIG.SAVE_SLOT_KEY + slot, JSON.stringify(data));
  Sound.sfx('chest');
  addMessage(`スロット${slot}にセーブした。`, '#00ff41');
}

function loadFromSlot(slot) {
  const raw = store.getItem(CONFIG.SAVE_SLOT_KEY + slot);
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    const st = newGameState();
    st.player = d.player;
    st.currentMap = d.currentMap;
    st.maps = {};
    for (const [id, m] of Object.entries(d.maps)) st.maps[id] = { ...m, grid: m.grid.map(r => r.split('')) };
    st.explored = Object.fromEntries(Object.entries(d.explored).map(([k, v]) => [k, new Set(v)]));
    st.flags = Object.assign(st.flags, d.flags);
    st.stats = Object.assign(st.stats, d.stats || {});
    game = st;
    return true;
  } catch (e) {
    console.error('ロード失敗:', e);
    return false;
  }
}

function getSaveSlots() {
  const r = {};
  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    const raw = store.getItem(CONFIG.SAVE_SLOT_KEY + i);
    if (raw) { try { r[i] = JSON.parse(raw); } catch (e) {} }
  }
  return r;
}
function hasSaveData() { return Object.keys(getSaveSlots()).length > 0; }
function updateTitleLoadBtn() { const b = $('btn-load-title'); if (b) b.disabled = !hasSaveData(); }

function openSlotOverlay(title, html) {
  $('slot-title').textContent = title;
  $('slot-list').innerHTML = html;
  $('slot-overlay').classList.remove('hidden');
}
function closeSlotOverlay() { $('slot-overlay').classList.add('hidden'); }

function slotLabel(i, s) {
  const ci = s.charInfo;
  return `<span class="slot-char">スロット${i}: ${esc(ci.name)}（${JOBS[ci.job].name}）LV${ci.lv}</span>
    <span class="slot-location">${esc(ci.location)}</span><span class="slot-date">${esc(s.savedAt)}</span>`;
}

function openSaveSlotUI(exitAfter) {
  game.inputEnabled = false;
  const slots = getSaveSlots();
  let html = '';
  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    html += `<div class="slot-card"><div class="slot-info">${slots[i] ? slotLabel(i, slots[i]) : `<span class="slot-char">スロット${i}（空き）</span>`}</div>
      <div class="slot-actions"><button class="slot-btn" data-save-slot="${i}">ここにセーブ</button></div></div>`;
  }
  openSlotOverlay(exitAfter ? '[ セーブして終了 ]' : '[ セーブ ]', html);
  document.querySelectorAll('[data-save-slot]').forEach(b => b.addEventListener('click', () => {
    saveToSlot(parseInt(b.dataset.saveSlot, 10));
    closeSlotOverlay();
    updateTitleLoadBtn();
    if (exitAfter) { showScreen('title'); Sound.bgm('title'); }
    else game.inputEnabled = true;
  }));
}

function openLoadSlotUI() {
  const slots = getSaveSlots();
  let html = '';
  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    html += slots[i]
      ? `<div class="slot-card"><div class="slot-info">${slotLabel(i, slots[i])}</div>
          <div class="slot-actions"><button class="slot-btn" data-load-slot="${i}">ロード</button>
          <button class="slot-btn slot-btn-danger" data-delete-slot="${i}">削除</button></div></div>`
      : `<div class="slot-card slot-empty"><div class="slot-info"><span class="slot-char">スロット${i}（空き）</span></div></div>`;
  }
  openSlotOverlay('[ ロード ]', html);
  document.querySelectorAll('[data-load-slot]').forEach(b => b.addEventListener('click', () => {
    if (loadFromSlot(parseInt(b.dataset.loadSlot, 10))) {
      if (isTouchDevice()) enterFullscreen();
      closeSlotOverlay();
      startGameScreen();
      addMessage('冒険の続きを始めた。');
    }
  }));
  document.querySelectorAll('[data-delete-slot]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.armed !== '1') {
      b.dataset.armed = '1';
      b.textContent = '本当に削除？';
      setTimeout(() => { b.dataset.armed = ''; b.textContent = '削除'; }, 3000);
      return;
    }
    store.removeItem(CONFIG.SAVE_SLOT_KEY + b.dataset.deleteSlot);
    updateTitleLoadBtn();
    openLoadSlotUI();
  }));
}

// =============================
// ゲームオーバー / エンディング
// =============================
function triggerGameOver() {
  game.inputEnabled = false;
  showScreen('gameover');
  Sound.bgm('gameover');
  $('gameover-msg').textContent = `${game.player.name}は力尽きた…`;
  $('btn-go-load').disabled = !hasSaveData();
}

function triggerEnding() {
  game.inputEnabled = false;
  const p = game.player;
  showScreen('ending');
  Sound.bgm('ending');
  $('ending-art').innerHTML = Art.playerInline(p.job, 72) + Art.princessInline(72);
  const treasure = game.flags.hasTreasure
    ? `さらに${esc(p.name)}は、伝説の秘宝「竜の瞳」を王に捧げた。<br>王国は末永く栄えたという。`
    : '…洞窟の奥には、まだ秘宝が眠っているという噂だ。';
  $('ending-msg').innerHTML = `${esc(p.name)}はミレーユ姫を救い出し、<br>王国の英雄となった！<br><br>${treasure}`;
  $('ending-stats').innerHTML = `${JOBS[p.job].name} LV${p.lv}　歩数 ${game.stats.steps}　倒した敵 ${game.stats.kills}`;
}

// =============================
// 物語（オープニング）
// =============================
const STORY = [
  'ここは山あいの小さな王国。',
  'ある嵐の夜、暗黒竜ヴォルガンが城を襲い、<br>ミレーユ姫をさらっていった。',
  '竜は町の南にある「謎の洞窟」の<br>最深部に棲むという。',
  '洞窟には、竜が守る伝説の秘宝が<br>眠っているとも伝えられている。',
  'そして今、一人の若者が立ち上がった——',
];

function showStory(name) {
  showScreen('story');
  Sound.bgm('title');
  const box = $('story-text');
  box.replaceChildren();
  const lines = [...STORY.slice(0, 4), `その名は、${esc(name)}。`];
  lines.forEach((t, i) => {
    const p = document.createElement('p');
    p.innerHTML = t;
    p.style.animationDelay = `${i * 0.9}s`;
    box.appendChild(p);
  });
}

// =============================
// イベント登録
// =============================
function initEvents() {
  // 最初の操作で音を有効化
  // スマホでは「指を離した時」でないと音を出す許可が下りないため、複数の操作で試みる
  const unlockOnce = () => Sound.unlock();
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev =>
    document.addEventListener(ev, unlockOnce, { passive: true }));

  document.addEventListener('keydown', e => {
    if (cursor.context) {
      if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); moveCursor(1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); moveCursor(-1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); executeCursor(); }
      else if (e.key === 'Escape') handleCursorEscape();
      return;
    }
    if (!game.inputEnabled) return;
    if (e.key === 'Escape' && game.screen === 'game') { toggleMenu(); return; }
    const dir = MOVE_MAP[e.key];
    if (dir && game.screen === 'game') { e.preventDefault(); tryMove(dir[0], dir[1]); }
  });

  $('btn-new-game').addEventListener('click', () => { Sound.sfx('select'); showScreen('create'); });
  $('btn-load-title').addEventListener('click', () => { Sound.sfx('select'); openLoadSlotUI(); });

  let selectedJob = null;
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.job-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedJob = card.dataset.job;
      Sound.sfx('select');
      updateStartButton();
    });
  });
  document.querySelectorAll('.job-icon').forEach(el => { el.innerHTML = Art.playerInline(el.dataset.job, 40); });
  $('input-name').addEventListener('input', updateStartButton);
  function updateStartButton() {
    $('btn-start-game').disabled = !$('input-name').value.trim() || !selectedJob;
  }

  $('btn-start-game').addEventListener('click', () => {
    const name = $('input-name').value.trim();
    if (!name || !selectedJob) return;
    game = newGameState();
    initMaps();
    game.player = createPlayer(name, selectedJob);
    game.currentMap = 'town';
    game.player.x = game.maps.town.startX;
    game.player.y = game.maps.town.startY;
    markExplored();
    showStory(name);
  });

  $('btn-story-go').addEventListener('click', () => {
    if (isTouchDevice()) enterFullscreen();
    startGameScreen();
    addMessage(`${game.player.name}の冒険が始まった！ まずは城の王に会おう。`, '#00ff41');
  });

  document.querySelectorAll('.battle-btn[data-cmd]').forEach(b => b.addEventListener('click', () => onBattleCommand(b.dataset.cmd)));
  $('btn-sub-back').addEventListener('click', showBattleMainCmd);
  $('btn-shop-close').addEventListener('click', closeShop);

  $('btn-menu').addEventListener('click', toggleMenu);
  $('btn-menu-close').addEventListener('click', toggleMenu);
  $('btn-field-item').addEventListener('click', () => { toggleMenu(); openFieldItems(); });
  $('btn-field-magic').addEventListener('click', () => { toggleMenu(); openFieldMagic(); });
  $('btn-save').addEventListener('click', () => { toggleMenu(); openSaveSlotUI(false); });
  $('btn-save-exit').addEventListener('click', () => { toggleMenu(); openSaveSlotUI(true); });
  $('btn-slot-close').addEventListener('click', () => {
    closeSlotOverlay();
    if (game.screen === 'game') game.inputEnabled = true;
    updateTitleLoadBtn();
  });

  $('btn-go-load').addEventListener('click', () => { if (hasSaveData()) openLoadSlotUI(); });
  $('btn-go-title').addEventListener('click', () => { showScreen('title'); Sound.bgm('title'); updateTitleLoadBtn(); });
  $('btn-ending-title').addEventListener('click', () => { showScreen('title'); Sound.bgm('title'); updateTitleLoadBtn(); });

  // 音のON/OFF
  const applySoundLabel = () => document.querySelectorAll('.btn-sound').forEach(b => { b.textContent = Sound.isMuted() ? '♪ OFF' : '♪ ON'; });
  document.querySelectorAll('.btn-sound').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    Sound.unlock();
    Sound.setMuted(!Sound.isMuted());
    store.setItem(CONFIG.SOUND_KEY, Sound.isMuted() ? '1' : '0');
    applySoundLabel();
  }));
  applySoundLabel();

  // 十字キー（押しっぱなしで連続移動）
  const dirs = { 'dpad-up': [0, -1], 'dpad-down': [0, 1], 'dpad-left': [-1, 0], 'dpad-right': [1, 0] };
  let repeat = null;
  const stop = () => { clearInterval(repeat); repeat = null; };
  Object.entries(dirs).forEach(([id, d]) => {
    const b = $(id);
    const go = () => { if (game.screen === 'game' && game.inputEnabled && !cursor.context) tryMove(d[0], d[1]); };
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      go();
      stop();
      repeat = setInterval(go, 170);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
  });
  window.addEventListener('blur', stop);

  window.addEventListener('resize', () => { if (game.screen === 'game') { fitMap(); renderMap(); } });

  initTouchMove();
  initFullscreen();
  $('btn-toggle-dpad').addEventListener('click', () => {
    store.setItem(CONFIG.DPAD_KEY, store.getItem(CONFIG.DPAD_KEY) === 'off' ? 'on' : 'off');
    applyDpadSetting();
  });
  applyDpadSetting();
}

// =============================
// 画面を押して移動（押している方向へ歩き続ける）
// =============================
const touchMove = { active: false, x: 0, y: 0, timer: null };

function stepTowardTouch() {
  if (!touchMove.active || !game.inputEnabled || game.screen !== 'game' || cursor.context) return;
  const rect = $('map-container').getBoundingClientRect();
  const p = game.player;
  const tx = Math.floor((touchMove.x - rect.left) / tilePx) + lastView.x;
  const ty = Math.floor((touchMove.y - rect.top) / tilePx) + lastView.y;
  const dx = tx - p.x, dy = ty - p.y;
  if (!dx && !dy) return;
  const g = game.maps[game.currentMap].grid;
  const blocked = (x, y) => !g[y] || g[y][x] === undefined || BLOCKING.has(g[y][x]);
  const horiz = Math.abs(dx) >= Math.abs(dy);
  const primary = horiz ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
  const secondary = horiz ? (dy ? [0, Math.sign(dy)] : null) : (dx ? [Math.sign(dx), 0] : null);
  let d = primary;
  // 正面が壁なら、もう一方の向きに回り込む
  if (blocked(p.x + d[0], p.y + d[1]) && secondary && !blocked(p.x + secondary[0], p.y + secondary[1])) d = secondary;
  tryMove(d[0], d[1]);
}

function initTouchMove() {
  const area = $('map-area');
  const stopT = () => { touchMove.active = false; clearInterval(touchMove.timer); touchMove.timer = null; };
  area.addEventListener('pointerdown', e => {
    if (game.screen !== 'game' || !game.inputEnabled) return;
    e.preventDefault();
    try { area.setPointerCapture(e.pointerId); } catch (err) {}
    touchMove.active = true;
    touchMove.x = e.clientX; touchMove.y = e.clientY;
    stepTowardTouch();
    clearInterval(touchMove.timer);
    touchMove.timer = setInterval(stepTowardTouch, 170);
  });
  area.addEventListener('pointermove', e => {
    if (!touchMove.active) return;
    touchMove.x = e.clientX; touchMove.y = e.clientY;
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => area.addEventListener(ev, stopT));
  window.addEventListener('blur', stopT);
}

// =============================
// 全画面表示
// =============================
function fsSupported() {
  return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function enterFullscreen() {
  if (!fsSupported() || isFullscreen()) return;
  const el = document.documentElement;
  try {
    const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
}
function toggleFullscreen() {
  if (isFullscreen()) {
    try {
      const r = (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      if (r && r.catch) r.catch(() => {});
    } catch (e) {}
  } else enterFullscreen();
}
function isTouchDevice() {
  return window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}
function initFullscreen() {
  const btns = document.querySelectorAll('.btn-fs');
  if (!fsSupported()) { btns.forEach(b => { b.style.display = 'none'; }); return; }
  const label = () => btns.forEach(b => { b.textContent = isFullscreen() ? '⛶ 戻す' : '⛶ 全画面'; });
  btns.forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleFullscreen(); }));
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => {
    label();
    setTimeout(() => { if (game.screen === 'game') { fitMap(); renderMap(); } }, 120);
  }));
  label();
}

// 十字キーの表示切替
function applyDpadSetting() {
  const hide = store.getItem(CONFIG.DPAD_KEY) === 'off';
  document.body.classList.toggle('no-dpad', hide);
  const b = $('btn-toggle-dpad');
  if (b) b.textContent = hide ? '十字キー：非表示' : '十字キー：表示中';
  if (game.screen === 'game') setTimeout(() => { fitMap(); renderMap(); }, 50);
}

function toggleMenu() {
  const ov = $('menu-overlay');
  if (ov.classList.contains('hidden')) {
    ov.classList.remove('hidden');
    game.inputEnabled = false;
    $('btn-field-magic').disabled = !game.player.spells.some(s => SPELLS[s].type === 'heal');
    setCursorContext('menu');
  } else {
    cursor.context = null;
    ov.classList.add('hidden');
    game.inputEnabled = true;
  }
}

function startGameScreen() {
  showScreen('game');
  game.inputEnabled = true;
  markExplored();
  playMapBgm();
  fitMap();
  renderAll();
  updateTitleLoadBtn();
}

// =============================
// 初期化
// =============================
function init() {
  Sound.setMuted(store.getItem(CONFIG.SOUND_KEY) === '1');
  updateTitleLoadBtn();
  initEvents();
  showScreen('title');
  Sound.bgm('title');
}

init();
