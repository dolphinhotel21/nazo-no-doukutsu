// =============================
// 定数定義
// =============================
const CONFIG = {
  MAP_SIZE: 25,           // マップの1辺タイル数
  VIEW_SIZE: 15,          // 画面表示タイル数
  TILE_SIZE: 24,          // タイルのピクセルサイズ
  FOG_RADIUS: 3,          // 視野半径
  ENC_RATE_B1: 0.15,      // B1エンカウント率
  ENC_RATE_B2: 0.20,      // B2エンカウント率
  ENC_RATE_B3: 0.25,      // B3エンカウント率
  ESCAPE_RATE_NORMAL: 0.40, // 通常逃走成功率
  ESCAPE_RATE_THIEF: 0.70,  // 盗賊逃走成功率
  MAX_ITEMS: 20,          // アイテム最大所持数
  MAX_LV: 20,             // レベル上限
  SAVE_KEY: 'nazo_no_doukutsu_save',      // 旧互換キー（移行用）
  SAVE_SLOT_KEY: 'nazo_no_doukutsu_slot_', // スロットキーのプレフィックス
  SAVE_SLOTS: 3,                           // セーブスロット数
};

// タイル種別
const TILE = {
  WALL: '#', FLOOR: '.', PLAYER: '@',
  STAIR_DOWN: '>', STAIR_UP: '<',
  HOUSE: 'H', INN: 'I', MAGIC_SHOP: 'M',
  WEAPON_SHOP: 'W', ARMOR_SHOP: 'A', ITEM_SHOP: 'T',
  DUNGEON_ENTRANCE: 'D', BOSS: 'B', TREASURE: '$',
};

// 職業定義
const JOBS = {
  warrior: {
    name: '戦士', label: 'warrior',
    base: { hp: 40, mp: 5, atk: 12, def: 8 },
    growth: { hp: 8, mp: 1, atk: 3, def: 2 },
    spells: [],
    initialWeapon: 'wooden_sword',
    escapeBonus: 0,
  },
  mage: {
    name: '魔法使い', label: 'mage',
    base: { hp: 20, mp: 25, atk: 6, def: 3 },
    growth: { hp: 4, mp: 5, atk: 1, def: 1 },
    spells: ['fire', 'heal'],
    initialWeapon: 'thin_staff',
    escapeBonus: 0,
  },
  priest: {
    name: '僧侶', label: 'priest',
    base: { hp: 28, mp: 18, atk: 7, def: 6 },
    growth: { hp: 6, mp: 4, atk: 1, def: 2 },
    spells: ['heal', 'protect'],
    initialWeapon: 'thin_staff',
    escapeBonus: 0,
  },
  thief: {
    name: '盗賊', label: 'thief',
    base: { hp: 30, mp: 8, atk: 10, def: 6 },
    growth: { hp: 6, mp: 2, atk: 2, def: 2 },
    spells: ['smoke', 'poison'],
    initialWeapon: 'dagger',
    escapeBonus: 0.30,
  },
};

// 魔法定義
const SPELLS = {
  fire:      { name: 'ファイア',   type: 'attack',  mp: 4,  desc: '敵1体に中ダメージ（DEF無視）', jobs: ['mage', 'thief'] },
  blizzard:  { name: 'ブリザード', type: 'attack',  mp: 4,  desc: '敵1体に中ダメージ', jobs: ['mage'] },
  thunder:   { name: 'サンダー',   type: 'attack',  mp: 6,  desc: '敵1体に高ダメージ', jobs: ['mage'] },
  heal:      { name: 'ヒール',     type: 'heal',    mp: 3,  desc: 'HPを小回復（+20〜30）', jobs: ['priest', 'mage'] },
  fullheal:  { name: 'フルヒール', type: 'heal',    mp: 8,  desc: 'HPを大回復（+60〜80）', jobs: ['priest'] },
  protect:   { name: 'プロテクト', type: 'buff',    mp: 4,  desc: '次の被ダメージを50%軽減', jobs: ['priest'] },
  poison:    { name: 'ポイズン',   type: 'debuff',  mp: 3,  desc: '敵に毒を与える（毎ターンダメージ）', jobs: ['thief', 'mage'] },
  smoke:     { name: 'スモーク',   type: 'escape',  mp: 2,  desc: '逃走成功率100%', jobs: ['thief'] },
};

// 魔法ショップ販売リスト
const MAGIC_SHOP_LIST = [
  { id: 'blizzard', price: 200 },
  { id: 'thunder',  price: 400 },
  { id: 'fullheal', price: 350 },
  { id: 'poison',   price: 150 },
  { id: 'smoke',    price: 100 },
];

// 武器定義
const WEAPONS = {
  wooden_sword: { name: '木の剣',       atk: 3,  price: 0,   sell: 0,   jobs: ['warrior','thief'],               magicBonus: 0, escapeBonus: 0 },
  dagger:       { name: '短剣',         atk: 2,  price: 0,   sell: 0,   jobs: ['warrior','mage','priest','thief'], magicBonus: 0, escapeBonus: 0 },
  thin_staff:   { name: '細身の杖',     atk: 1,  price: 0,   sell: 0,   jobs: ['warrior','mage','priest','thief'], magicBonus: 0, escapeBonus: 0 },
  iron_sword:   { name: '鉄の剣',       atk: 7,  price: 150, sell: 75,  jobs: ['warrior','thief'],               magicBonus: 0, escapeBonus: 0 },
  magic_staff:  { name: '魔法の杖',     atk: 4,  price: 300, sell: 150, jobs: ['mage','priest'],                  magicBonus: 0.30, escapeBonus: 0 },
  mithril_sword:{ name: 'ミスリルの剣', atk: 15, price: 800, sell: 400, jobs: ['warrior'],                       magicBonus: 0, escapeBonus: 0 },
  ninja_blade:  { name: '忍者刀',       atk: 10, price: 500, sell: 250, jobs: ['thief'],                         magicBonus: 0, escapeBonus: 0.20 },
};

// 武器屋販売リスト
const WEAPON_SHOP_LIST = ['iron_sword', 'magic_staff', 'mithril_sword', 'ninja_blade'];

// 防具定義
const ARMORS = {
  cloth:          { name: '布の服',       def: 1,  price: 0,    sell: 0,   jobs: ['warrior','mage','priest','thief'], mpBonus: 0, escapeBonus: 0 },
  leather_armor:  { name: '革の鎧',       def: 4,  price: 100,  sell: 50,  jobs: ['warrior','mage','priest','thief'], mpBonus: 0, escapeBonus: 0 },
  iron_armor:     { name: '鉄の鎧',       def: 8,  price: 300,  sell: 150, jobs: ['warrior'],                       mpBonus: 0, escapeBonus: 0 },
  magic_robe:     { name: '魔法のローブ', def: 3,  price: 250,  sell: 125, jobs: ['mage','priest'],                  mpBonus: 10, escapeBonus: 0 },
  mithril_armor:  { name: 'ミスリル鎧',   def: 16, price: 1000, sell: 500, jobs: ['warrior'],                       mpBonus: 0, escapeBonus: 0 },
  shadow_armor:   { name: 'シャドウアーマー', def: 8, price: 450, sell: 225, jobs: ['thief'],                      mpBonus: 0, escapeBonus: 0.10 },
};

// 防具屋販売リスト
const ARMOR_SHOP_LIST = ['leather_armor', 'iron_armor', 'magic_robe', 'mithril_armor', 'shadow_armor'];

// 消耗品定義
const CONSUMABLES = {
  herb:         { name: '薬草',     effect: 'heal_20',   price: 10,  sell: 5,  desc: 'HPを20回復' },
  super_herb:   { name: '上薬草',   effect: 'heal_50',   price: 30,  sell: 15, desc: 'HPを50回復' },
  holy_water:   { name: '聖水',     effect: 'holy',      price: 50,  sell: 25, desc: 'アンデッド系に大ダメージ' },
  antidote:     { name: '毒消し草', effect: 'antidote',  price: 15,  sell: 7,  desc: '毒を治癒' },
  ether:        { name: 'エーテル', effect: 'mp_10',     price: 40,  sell: 20, desc: 'MPを10回復' },
};

// 道具屋販売リスト
const ITEM_SHOP_LIST = ['herb', 'super_herb', 'holy_water', 'antidote', 'ether'];

// 敵データ
const ENEMIES = {
  b1: [
    { name: 'スライム',   hp: 8,  atk: 4,  def: 1,  exp: 5,  gold: 3,  type: 'slime',    special: null },
    { name: 'コウモリ',   hp: 10, atk: 5,  def: 2,  exp: 7,  gold: 5,  type: 'bat',      special: null },
    { name: 'ゴブリン',   hp: 15, atk: 7,  def: 3,  exp: 12, gold: 8,  type: 'goblin',   special: null },
  ],
  b2: [
    { name: 'ゾンビ',     hp: 25, atk: 10, def: 4,  exp: 20, gold: 15, type: 'undead',   special: null },
    { name: '毒ヘビ',     hp: 20, atk: 12, def: 3,  exp: 18, gold: 12, type: 'snake',    special: 'poison' },
    { name: 'オーク',     hp: 35, atk: 14, def: 6,  exp: 30, gold: 20, type: 'orc',      special: null },
  ],
  b3: [
    { name: 'ダークウォリアー', hp: 50, atk: 18, def: 10, exp: 50, gold: 40, type: 'dark',  special: null },
    { name: '骸骨騎士',   hp: 45, atk: 20, def: 8,  exp: 45, gold: 35, type: 'undead',   special: null },
    { name: 'ケルベロス', hp: 60, atk: 22, def: 8,  exp: 60, gold: 50, type: 'beast',    special: null },
  ],
  boss: { name: '暗黒竜ヴォルガン', hp: 200, atk: 30, def: 15, exp: 500, gold: 300, type: 'boss', special: 'breath' },
};

// =============================
// ゲーム状態
// =============================
let game = {
  screen: 'title',       // 現在の画面
  player: null,          // プレイヤーデータ
  maps: {},              // マップデータ
  currentMap: 'town',    // 現在のマップID
  explored: {},          // 探索済みマス { mapId: Set<"x,y"> }
  flags: {
    bossDefeated: false,
    hasTreasure: false,
    bossEncountered: false,
  },
  messages: ['', '', ''],   // メッセージログ（最新3件）
  inputEnabled: true,    // キー入力受け付け
  battle: null,          // バトル状態
};

// =============================
// ユーティリティ
// =============================
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  game.screen = id;
}

// メッセージ追加
function addMessage(text, color) {
  game.messages.shift();
  game.messages.push(text);
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById('msg-' + i);
    el.textContent = game.messages[i];
    el.style.color = color && i === 2 ? color : '';
  }
}

// HPバーの色を更新
function hpColor(current, max) {
  const ratio = current / max;
  if (ratio > 0.5) return '#00cc33';
  if (ratio > 0.25) return '#ffaa00';
  return '#ff3333';
}

// =============================
// プレイヤー作成
// =============================
function createPlayer(name, jobKey) {
  const job = JOBS[jobKey];
  const weaponKey = job.initialWeapon;
  const weapon = WEAPONS[weaponKey];
  const armor = ARMORS['cloth'];

  return {
    name,
    job: jobKey,
    lv: 1,
    exp: 0,
    expNext: 100,
    hp: job.base.hp,
    maxHp: job.base.hp,
    mp: job.base.mp,
    maxMp: job.base.mp,
    baseAtk: job.base.atk,
    baseDef: job.base.def,
    weapon: weaponKey,
    armor: 'cloth',
    items: [],          // { id, count }
    spells: [...job.spells],
    gold: 100,
    poisoned: false,    // 毒状態
    x: 0,
    y: 0,
  };
}

// 実際のATK（装備込み）
function getAtk(player) {
  const w = WEAPONS[player.weapon];
  return player.baseAtk + w.atk;
}

// 実際のDEF（装備込み）
function getDef(player) {
  const a = ARMORS[player.armor];
  return player.baseDef + a.def;
}

// 実際のMaxMP（防具ボーナス込み）
function getMaxMp(player) {
  const a = ARMORS[player.armor];
  return player.maxMp + a.mpBonus;
}

// =============================
// マップ生成
// =============================

// 手動定義: 町マップ (25×25)
function createTownMap() {
  const S = CONFIG.MAP_SIZE;
  // 全部壁で初期化
  const grid = Array.from({ length: S }, () => Array(S).fill(TILE.WALL));

  // 道を開ける（外壁を残して内部を床に）
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      grid[y][x] = TILE.FLOOR;
    }
  }

  // 建物配置
  // 家（スタート付近）
  grid[3][3] = TILE.HOUSE;
  // 宿屋
  grid[3][10] = TILE.INN;
  // 魔法ショップ
  grid[3][18] = TILE.MAGIC_SHOP;
  // 武器屋
  grid[10][5] = TILE.WEAPON_SHOP;
  // 防具屋
  grid[10][12] = TILE.ARMOR_SHOP;
  // 道具屋
  grid[10][19] = TILE.ITEM_SHOP;
  // ダンジョン入口（端に配置）
  grid[22][12] = TILE.DUNGEON_ENTRANCE;

  // プレイヤースタート位置を記録
  const startX = 4;
  const startY = 3;

  return { grid, startX, startY, dungeonEntranceX: 12, dungeonEntranceY: 21, id: 'town' };
}

// プロシージャル迷路生成（再帰バックトラッキング）
function createDungeonMap(id, hasStairUp, hasStairDown, hasBoss, hasTreasureCell) {
  const S = CONFIG.MAP_SIZE;
  const grid = Array.from({ length: S }, () => Array(S).fill(TILE.WALL));

  // 迷路生成（奇数座標を起点に）
  function carve(x, y) {
    const dirs = shuffle([[0,-2],[0,2],[-2,0],[2,0]]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < S - 1 && ny > 0 && ny < S - 1 && grid[ny][nx] === TILE.WALL) {
        grid[ny - dy/2][nx - dx/2] = TILE.FLOOR;
        grid[ny][nx] = TILE.FLOOR;
        carve(nx, ny);
      }
    }
  }

  grid[1][1] = TILE.FLOOR;
  carve(1, 1);

  // 床タイル一覧を取得
  const floors = [];
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      if (grid[y][x] === TILE.FLOOR) floors.push({ x, y });
    }
  }

  // スタート位置（入口付近）
  const startCell = floors[0];
  const startX = startCell.x;
  const startY = startCell.y;

  // 遠い位置を取得（ボス・宝箱・階段用）
  function farFrom(fx, fy, n) {
    const sorted = [...floors].sort((a, b) => {
      const da = Math.abs(a.x - fx) + Math.abs(a.y - fy);
      const db = Math.abs(b.x - fx) + Math.abs(b.y - fy);
      return db - da;
    });
    return sorted.slice(0, n);
  }

  let used = new Set([`${startX},${startY}`]);

  function placeFar(fx, fy) {
    const candidates = farFrom(fx, fy, 20);
    for (const c of candidates) {
      const key = `${c.x},${c.y}`;
      if (!used.has(key)) {
        used.add(key);
        return c;
      }
    }
    return candidates[0];
  }

  // 上り階段（前フロアへ戻る）
  if (hasStairUp) {
    grid[startY][startX] = TILE.STAIR_UP;
  }

  // 下り階段
  let stairDownPos = null;
  if (hasStairDown) {
    stairDownPos = placeFar(startX, startY);
    grid[stairDownPos.y][stairDownPos.x] = TILE.STAIR_DOWN;
  }

  // ボス（B3最奥）
  let bossPos = null;
  if (hasBoss) {
    const ref = stairDownPos || startCell;
    bossPos = placeFar(startX, startY);
    grid[bossPos.y][bossPos.x] = TILE.BOSS;
  }

  // 宝箱（ボスより奥）
  let treasurePos = null;
  if (hasTreasureCell) {
    const ref = bossPos || startCell;
    treasurePos = placeFar(startX, startY);
    grid[treasurePos.y][treasurePos.x] = TILE.TREASURE;
  }

  return { grid, startX, startY, id, bossPos, treasurePos };
}

// 配列をシャッフル
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 全マップ初期化
function initMaps() {
  game.maps = {
    town:    createTownMap(),
    dungeon1: createDungeonMap('dungeon1', true,  true,  false, false),
    dungeon2: createDungeonMap('dungeon2', true,  true,  false, false),
    dungeon3: createDungeonMap('dungeon3', true,  false, true,  true),
  };
  game.explored = {
    town: new Set(),
    dungeon1: new Set(),
    dungeon2: new Set(),
    dungeon3: new Set(),
  };
}

// =============================
// プレイヤーCSSピクセルアート
// =============================
// 6列×8行のドット絵（2px/ドット）をbox-shadowで描画
// タイル24pxに対して left:6px, top:4px でセンタリング（12x16px）
function getPlayerBoxShadow(jobKey) {
  const skin = '#d4935e';
  const cfgs = {
    warrior: { body: '#cc2200', leg: '#881100' }, // 赤マント・戦士
    mage:    { body: '#1133bb', leg: '#0a1e88' }, // 青ローブ・魔法使い
    priest:  { body: '#dddddd', leg: '#888888' }, // 白ローブ・僧侶
    thief:   { body: '#226622', leg: '#113311' }, // 緑の服・盗賊
  };
  const { body, leg } = cfgs[jobKey] || cfgs.warrior;
  const px = (c, r, col) => `${c * 2}px ${r * 2}px 0 0 ${col}`;
  const s = [];

  // row 0: 帽子/ヘルメット（body色）
  [1,2,3,4].forEach(c => s.push(px(c, 0, body)));
  // row 1: 顔（肌色）
  [1,2,3,4].forEach(c => s.push(px(c, 1, skin)));
  // row 2: 肩（body色、全幅）
  [0,1,2,3,4,5].forEach(c => s.push(px(c, 2, body)));
  // row 3: 上半身
  [1,2,3,4].forEach(c => s.push(px(c, 3, body)));
  // row 4: 腕（全幅）
  [0,1,2,3,4,5].forEach(c => s.push(px(c, 4, body)));
  // row 5: 下半身
  [1,2,3,4].forEach(c => s.push(px(c, 5, body)));
  // row 6-7: 足
  [1,4].forEach(c => { s.push(px(c, 6, leg)); s.push(px(c, 7, leg)); });

  return s.join(', ');
}

// =============================
// マップ描画
// =============================
function renderMap() {
  const mapData = game.maps[game.currentMap];
  const { grid } = mapData;
  const S = CONFIG.MAP_SIZE;
  const V = CONFIG.VIEW_SIZE;
  const px = game.player.x;
  const py = game.player.y;

  // ビューポートの左上座標
  let viewX = px - Math.floor(V / 2);
  let viewY = py - Math.floor(V / 2);
  viewX = clamp(viewX, 0, S - V);
  viewY = clamp(viewY, 0, S - V);

  const container = document.getElementById('map-container');
  container.style.gridTemplateColumns = `repeat(${V}, ${CONFIG.TILE_SIZE}px)`;
  container.innerHTML = '';

  const explored = game.explored[game.currentMap];

  for (let ry = 0; ry < V; ry++) {
    for (let rx = 0; rx < V; rx++) {
      const mx = viewX + rx;
      const my = viewY + ry;
      const key = `${mx},${my}`;

      const tile = document.createElement('div');
      tile.className = 'tile';

      // 視野判定
      const dist = Math.abs(mx - px) + Math.abs(my - py);
      const isPlayer = (mx === px && my === py);
      const inSight = dist <= CONFIG.FOG_RADIUS || isPlayer;
      const wasExplored = explored.has(key);

      if (!wasExplored && !inSight) {
        // 未探索・視野外
        tile.classList.add('fog-hidden');
        container.appendChild(tile);
        continue;
      }

      // タイル表示
      const cell = grid[my][mx];
      renderTile(tile, cell, isPlayer);

      if (!inSight && wasExplored) {
        tile.classList.add('fog-explored');
      } else {
        tile.classList.add('fog-visible');
      }

      container.appendChild(tile);
    }
  }
}

function renderTile(tile, cell, isPlayer) {
  if (isPlayer) {
    tile.classList.add('tile-player');
    // CSSピクセルアートキャラクターを描画
    const sprite = document.createElement('div');
    sprite.className = 'player-sprite';
    sprite.style.boxShadow = getPlayerBoxShadow(game.player.job);
    tile.appendChild(sprite);
    return;
  }
  switch (cell) {
    case TILE.WALL:
      tile.textContent = '█';
      tile.classList.add('tile-wall');
      break;
    case TILE.FLOOR:
      tile.textContent = '·';
      tile.classList.add('tile-floor');
      break;
    case TILE.STAIR_DOWN:
      tile.textContent = '▼';
      tile.classList.add('tile-stair-down');
      break;
    case TILE.STAIR_UP:
      tile.textContent = '▲';
      tile.classList.add('tile-stair-up');
      break;
    case TILE.HOUSE:
      tile.textContent = 'H';
      tile.classList.add('tile-building');
      break;
    case TILE.INN:
      tile.textContent = 'I';
      tile.classList.add('tile-building');
      break;
    case TILE.MAGIC_SHOP:
      tile.textContent = 'M';
      tile.classList.add('tile-building');
      break;
    case TILE.WEAPON_SHOP:
      tile.textContent = 'W';
      tile.classList.add('tile-building');
      break;
    case TILE.ARMOR_SHOP:
      tile.textContent = 'A';
      tile.classList.add('tile-building');
      break;
    case TILE.ITEM_SHOP:
      tile.textContent = 'T';
      tile.classList.add('tile-building');
      break;
    case TILE.DUNGEON_ENTRANCE:
      tile.textContent = 'D';
      tile.classList.add('tile-building');
      break;
    case TILE.BOSS:
      tile.textContent = 'B';
      tile.classList.add('tile-boss');
      break;
    case TILE.TREASURE:
      tile.textContent = '$';
      tile.classList.add('tile-treasure');
      break;
    default:
      tile.textContent = ' ';
      tile.classList.add('tile-floor');
  }
}

// =============================
// ステータス表示更新
// =============================
function updateStatusPanel() {
  const p = game.player;
  const job = JOBS[p.job];
  const w = WEAPONS[p.weapon];
  const a = ARMORS[p.armor];
  const realMaxMp = getMaxMp(p);

  document.getElementById('st-name').textContent = `名: ${p.name}`;
  document.getElementById('st-job').textContent = `職: ${job.name}`;
  document.getElementById('st-lv').textContent = `LV: ${p.lv}`;
  document.getElementById('st-exp').textContent = `EXP: ${p.exp}/${p.expNext}`;

  const hpEl = document.getElementById('st-hp');
  hpEl.textContent = `HP: ${p.hp}/${p.maxHp}`;
  hpEl.style.color = hpColor(p.hp, p.maxHp);

  const mpEl = document.getElementById('st-mp');
  mpEl.textContent = `MP: ${p.mp}/${realMaxMp}`;

  document.getElementById('st-atk').textContent = `ATK: ${getAtk(p)}`;
  document.getElementById('st-def').textContent = `DEF: ${getDef(p)}`;
  document.getElementById('st-weapon').textContent = `武: ${w.name}`;
  document.getElementById('st-armor').textContent = `防: ${a.name}`;
  document.getElementById('st-gold').textContent = `金: ${p.gold}P`;

  // マップ名
  const mapNames = { town: '町', dungeon1: 'B1F', dungeon2: 'B2F', dungeon3: 'B3F' };
  let loc = mapNames[game.currentMap] || '─';
  if (p.poisoned) loc += ' [毒]';
  document.getElementById('st-location').textContent = `場所: ${loc}`;

  // アイテムリスト
  const itemsEl = document.getElementById('st-items');
  itemsEl.innerHTML = '';
  if (p.items.length === 0) {
    const d = document.createElement('div');
    d.textContent = 'なし';
    itemsEl.appendChild(d);
  } else {
    for (const item of p.items) {
      const d = document.createElement('div');
      d.textContent = `${CONSUMABLES[item.id].name} x${item.count}`;
      itemsEl.appendChild(d);
    }
  }
}

// =============================
// 移動処理
// =============================
const MOVE_MAP = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};

function tryMove(dx, dy) {
  if (!game.inputEnabled || game.screen !== 'game') return;

  const p = game.player;
  const nx = p.x + dx;
  const ny = p.y + dy;
  const mapData = game.maps[game.currentMap];
  const { grid } = mapData;

  if (nx < 0 || ny < 0 || nx >= CONFIG.MAP_SIZE || ny >= CONFIG.MAP_SIZE) return;

  const cell = grid[ny][nx];
  if (cell === TILE.WALL) {
    addMessage('壁があって進めない。');
    return;
  }

  // 移動実行
  p.x = nx;
  p.y = ny;

  // 探索済みに追加（現在位置周辺）
  markExplored();

  // タイルイベント処理
  handleTileEvent(cell);
}

// 視野内を探索済みに登録
function markExplored() {
  const p = game.player;
  const explored = game.explored[game.currentMap];
  const S = CONFIG.MAP_SIZE;
  const R = CONFIG.FOG_RADIUS;

  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const ax = p.x + dx;
      const ay = p.y + dy;
      if (ax >= 0 && ay >= 0 && ax < S && ay < S) {
        explored.add(`${ax},${ay}`);
      }
    }
  }
}

// タイルイベント
function handleTileEvent(cell) {
  const p = game.player;
  const mapData = game.maps[game.currentMap];

  switch (cell) {
    case TILE.HOUSE:
      if (game.currentMap === 'town' && game.flags.hasTreasure) {
        // ゲームクリア
        triggerEnding();
        return;
      } else if (game.currentMap === 'town') {
        addMessage('家だ。ゴールを目指して冒険しよう！');
      }
      break;

    case TILE.INN:
      openInn();
      return;

    case TILE.MAGIC_SHOP:
      openMagicShop();
      return;

    case TILE.WEAPON_SHOP:
      openWeaponShop();
      return;

    case TILE.ARMOR_SHOP:
      openArmorShop();
      return;

    case TILE.ITEM_SHOP:
      openItemShop();
      return;

    case TILE.DUNGEON_ENTRANCE:
      // 町→ダンジョンB1
      changeMap('dungeon1');
      addMessage('ダンジョンに入った！ 慎重に進め。', '#ffaa00');
      return;

    case TILE.STAIR_DOWN:
      // 下の階へ
      if (game.currentMap === 'dungeon1') {
        changeMap('dungeon2');
        addMessage('B2Fへ降りた。', '#ffaa00');
      } else if (game.currentMap === 'dungeon2') {
        changeMap('dungeon3');
        addMessage('B3Fへ降りた！ ボスが待ち構えている...', '#ff6666');
      }
      return;

    case TILE.STAIR_UP:
      // 上の階へ
      if (game.currentMap === 'dungeon1') {
        changeMap('town');
        addMessage('町へ戻った。', '#00ff41');
      } else if (game.currentMap === 'dungeon2') {
        changeMap('dungeon1');
        addMessage('B1Fへ戻った。', '#00ff41');
      } else if (game.currentMap === 'dungeon3') {
        changeMap('dungeon2');
        addMessage('B2Fへ戻った。', '#00ff41');
      }
      return;

    case TILE.BOSS:
      if (!game.flags.bossEncountered) {
        game.flags.bossEncountered = true;
        addMessage('暗黒竜ヴォルガン が現れた！', '#ff3333');
        startBattle(true);
        return;
      } else if (game.flags.bossDefeated) {
        addMessage('ボスはすでに倒されている。');
      }
      break;

    case TILE.TREASURE:
      if (!game.flags.bossDefeated) {
        addMessage('何かに阻まれて宝箱を開けられない...', '#888');
      } else if (!game.flags.hasTreasure) {
        game.flags.hasTreasure = true;
        addMessage('伝説の秘宝を手に入れた！！', '#ffd700');
        addMessage('町の家に戻ろう！', '#00ff41');
        // 宝箱タイルを床に変更
        mapData.grid[p.y][p.x] = TILE.FLOOR;
      } else {
        addMessage('もうすでに秘宝を持っている。');
      }
      break;
  }

  // ランダムエンカウント（ダンジョンのみ）
  checkEncounter();

  // 毒ダメージ
  if (p.poisoned) {
    const poisonDmg = Math.max(1, Math.floor(p.maxHp * 0.05));
    p.hp = Math.max(1, p.hp - poisonDmg);
    addMessage(`毒のダメージ！ ${poisonDmg}ダメージ`, '#ff66ff');
    if (p.hp <= 0) {
      p.hp = 0;
      triggerGameOver();
      return;
    }
  }

  renderMap();
  updateStatusPanel();
}

// マップ移動
function changeMap(targetMap) {
  const prevMap = game.currentMap;
  game.currentMap = targetMap;
  const mapData = game.maps[targetMap];

  if (targetMap === 'town') {
    if (prevMap && prevMap !== 'town') {
      // ダンジョンから戻った場合はダンジョン入口（D）の手前に立つ
      game.player.x = game.maps.town.dungeonEntranceX;
      game.player.y = game.maps.town.dungeonEntranceY;
    } else {
      // ゲーム開始時は固定スタート位置
      game.player.x = game.maps.town.startX;
      game.player.y = game.maps.town.startY;
    }
  } else {
    // ダンジョンはスタート位置
    game.player.x = mapData.startX;
    game.player.y = mapData.startY;
  }

  markExplored();
  renderMap();
  updateStatusPanel();
}

// ランダムエンカウント判定
function checkEncounter() {
  const rateMap = { dungeon1: CONFIG.ENC_RATE_B1, dungeon2: CONFIG.ENC_RATE_B2, dungeon3: CONFIG.ENC_RATE_B3 };
  const rate = rateMap[game.currentMap];
  if (!rate) return; // 町はエンカウントなし

  if (Math.random() < rate) {
    startBattle(false);
  }
}

// =============================
// 敵SVGグラフィック（ブラックオニキス/ウィザードリィ風）
// =============================
function makeSVGBase(content) {
  return `<svg width="64" height="64" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

function makeSVGSlime() {
  return makeSVGBase(`
    <rect x="5" y="3" width="6" height="1" fill="#1133cc"/>
    <rect x="4" y="4" width="8" height="6" fill="#1133cc"/>
    <rect x="5" y="10" width="6" height="1" fill="#1133cc"/>
    <rect x="4" y="4" width="2" height="2" fill="#5566ee"/>
    <rect x="5" y="6" width="2" height="2" fill="white"/>
    <rect x="9" y="6" width="2" height="2" fill="white"/>
    <rect x="6" y="7" width="1" height="1" fill="#111"/>
    <rect x="10" y="7" width="1" height="1" fill="#111"/>
    <rect x="6" y="9" width="4" height="1" fill="#0022aa"/>
  `);
}

function makeSVGBat() {
  return makeSVGBase(`
    <rect x="1" y="5" width="5" height="1" fill="#222"/>
    <rect x="1" y="6" width="4" height="3" fill="#333"/>
    <rect x="2" y="9" width="3" height="1" fill="#333"/>
    <rect x="10" y="5" width="5" height="1" fill="#222"/>
    <rect x="11" y="6" width="4" height="3" fill="#333"/>
    <rect x="11" y="9" width="3" height="1" fill="#333"/>
    <rect x="5" y="4" width="6" height="3" fill="#444"/>
    <rect x="6" y="7" width="4" height="3" fill="#333"/>
    <rect x="6" y="5" width="1" height="1" fill="#cc2200"/>
    <rect x="9" y="5" width="1" height="1" fill="#cc2200"/>
    <rect x="7" y="10" width="2" height="1" fill="#222"/>
  `);
}

function makeSVGGoblin() {
  return makeSVGBase(`
    <rect x="2" y="4" width="2" height="3" fill="#2d7a1a"/>
    <rect x="12" y="4" width="2" height="3" fill="#2d7a1a"/>
    <rect x="4" y="2" width="8" height="5" fill="#44aa22"/>
    <rect x="5" y="4" width="2" height="1" fill="#cc1100"/>
    <rect x="9" y="4" width="2" height="1" fill="#cc1100"/>
    <rect x="6" y="6" width="4" height="1" fill="#226611"/>
    <rect x="4" y="7" width="8" height="4" fill="#336622"/>
    <rect x="3" y="8" width="2" height="3" fill="#336622"/>
    <rect x="11" y="8" width="2" height="3" fill="#336622"/>
    <rect x="5" y="11" width="3" height="4" fill="#225511"/>
    <rect x="8" y="11" width="3" height="4" fill="#225511"/>
  `);
}

function makeSVGZombie() {
  return makeSVGBase(`
    <rect x="5" y="1" width="6" height="5" fill="#667766"/>
    <rect x="6" y="3" width="1" height="1" fill="#334433"/>
    <rect x="9" y="3" width="1" height="1" fill="#334433"/>
    <rect x="6" y="5" width="4" height="1" fill="#445544"/>
    <rect x="4" y="6" width="8" height="5" fill="#556655"/>
    <rect x="1" y="7" width="3" height="2" fill="#667766"/>
    <rect x="12" y="5" width="3" height="2" fill="#667766"/>
    <rect x="5" y="11" width="3" height="4" fill="#445544"/>
    <rect x="8" y="11" width="3" height="4" fill="#445544"/>
    <rect x="4" y="6" width="1" height="2" fill="#778877"/>
    <rect x="11" y="6" width="1" height="2" fill="#778877"/>
  `);
}

function makeSVGSkeleton() {
  return makeSVGBase(`
    <rect x="5" y="1" width="6" height="5" fill="#dddddd"/>
    <rect x="5" y="2" width="2" height="2" fill="#222"/>
    <rect x="9" y="2" width="2" height="2" fill="#222"/>
    <rect x="6" y="5" width="4" height="1" fill="#222"/>
    <rect x="5" y="6" width="1" height="4" fill="#dddddd"/>
    <rect x="7" y="6" width="2" height="4" fill="#dddddd"/>
    <rect x="10" y="6" width="1" height="4" fill="#dddddd"/>
    <rect x="3" y="7" width="2" height="3" fill="#dddddd"/>
    <rect x="11" y="7" width="2" height="3" fill="#cccccc"/>
    <rect x="5" y="10" width="3" height="5" fill="#dddddd"/>
    <rect x="8" y="10" width="3" height="5" fill="#dddddd"/>
    <rect x="13" y="3" width="2" height="9" fill="#aaaaaa"/>
    <rect x="13" y="2" width="2" height="2" fill="#777"/>
  `);
}

function makeSVGSnake() {
  return makeSVGBase(`
    <rect x="7" y="1" width="4" height="3" fill="#33aa22"/>
    <rect x="6" y="1" width="1" height="1" fill="#cc0000"/>
    <rect x="11" y="1" width="1" height="1" fill="#cc0000"/>
    <rect x="6" y="2" width="1" height="1" fill="#ffff00"/>
    <rect x="10" y="2" width="1" height="1" fill="#ffff00"/>
    <rect x="9" y="4" width="5" height="3" fill="#33aa22"/>
    <rect x="5" y="5" width="5" height="3" fill="#33aa22"/>
    <rect x="3" y="7" width="4" height="3" fill="#33aa22"/>
    <rect x="3" y="10" width="7" height="3" fill="#33aa22"/>
    <rect x="7" y="13" width="4" height="2" fill="#33aa22"/>
    <rect x="6" y="4" width="4" height="2" fill="#44cc33"/>
  `);
}

function makeSVGOrc() {
  return makeSVGBase(`
    <rect x="3" y="2" width="10" height="6" fill="#8b5e3c"/>
    <rect x="2" y="3" width="2" height="4" fill="#7a4e2d"/>
    <rect x="12" y="3" width="2" height="4" fill="#7a4e2d"/>
    <rect x="5" y="4" width="2" height="2" fill="#cc3300"/>
    <rect x="9" y="4" width="2" height="2" fill="#cc3300"/>
    <rect x="6" y="7" width="2" height="1" fill="#eedd99"/>
    <rect x="8" y="7" width="2" height="1" fill="#eedd99"/>
    <rect x="2" y="8" width="12" height="5" fill="#7a4e2d"/>
    <rect x="1" y="9" width="2" height="4" fill="#8b5e3c"/>
    <rect x="13" y="9" width="2" height="4" fill="#8b5e3c"/>
    <rect x="3" y="13" width="4" height="3" fill="#5c3d1e"/>
    <rect x="9" y="13" width="4" height="3" fill="#5c3d1e"/>
  `);
}

function makeSVGDarkWarrior() {
  return makeSVGBase(`
    <rect x="5" y="0" width="6" height="2" fill="#222266"/>
    <rect x="4" y="2" width="8" height="4" fill="#111133"/>
    <rect x="5" y="3" width="2" height="1" fill="#cc2200"/>
    <rect x="9" y="3" width="2" height="1" fill="#cc2200"/>
    <rect x="3" y="6" width="10" height="6" fill="#111133"/>
    <rect x="1" y="6" width="3" height="5" fill="#222244"/>
    <rect x="12" y="6" width="3" height="5" fill="#222244"/>
    <rect x="4" y="12" width="4" height="4" fill="#111122"/>
    <rect x="8" y="12" width="4" height="4" fill="#111122"/>
    <rect x="14" y="3" width="1" height="10" fill="#888"/>
    <rect x="13" y="2" width="2" height="2" fill="#555"/>
  `);
}

function makeSVGCerberus() {
  return makeSVGBase(`
    <rect x="6" y="0" width="4" height="3" fill="#442222"/>
    <rect x="1" y="2" width="4" height="3" fill="#442222"/>
    <rect x="11" y="2" width="4" height="3" fill="#442222"/>
    <rect x="5" y="4" width="6" height="4" fill="#552222"/>
    <rect x="3" y="7" width="10" height="4" fill="#442222"/>
    <rect x="2" y="11" width="3" height="4" fill="#331111"/>
    <rect x="5" y="11" width="3" height="4" fill="#331111"/>
    <rect x="8" y="11" width="3" height="4" fill="#331111"/>
    <rect x="11" y="11" width="3" height="4" fill="#331111"/>
    <rect x="7" y="1" width="1" height="1" fill="#cc0000"/>
    <rect x="9" y="1" width="1" height="1" fill="#cc0000"/>
    <rect x="1" y="3" width="1" height="1" fill="#cc0000"/>
    <rect x="4" y="3" width="1" height="1" fill="#cc0000"/>
    <rect x="11" y="3" width="1" height="1" fill="#cc0000"/>
    <rect x="14" y="3" width="1" height="1" fill="#cc0000"/>
  `);
}

function makeSVGDragon() {
  return makeSVGBase(`
    <rect x="0" y="4" width="5" height="4" fill="#880000"/>
    <rect x="11" y="4" width="5" height="4" fill="#880000"/>
    <rect x="0" y="2" width="5" height="3" fill="#aa1100"/>
    <rect x="11" y="2" width="5" height="3" fill="#aa1100"/>
    <rect x="1" y="0" width="4" height="3" fill="#cc2200"/>
    <rect x="11" y="0" width="4" height="3" fill="#cc2200"/>
    <rect x="5" y="3" width="6" height="6" fill="#cc2200"/>
    <rect x="4" y="5" width="8" height="3" fill="#dd3300"/>
    <rect x="6" y="2" width="4" height="3" fill="#cc2200"/>
    <rect x="6" y="2" width="2" height="1" fill="#ffcc00"/>
    <rect x="8" y="2" width="2" height="1" fill="#ffcc00"/>
    <rect x="5" y="4" width="2" height="1" fill="#ff5500"/>
    <rect x="9" y="4" width="2" height="1" fill="#ff5500"/>
    <rect x="5" y="9" width="6" height="3" fill="#cc2200"/>
    <rect x="6" y="12" width="4" height="2" fill="#aa1100"/>
    <rect x="5" y="14" width="3" height="2" fill="#880000"/>
    <rect x="8" y="14" width="3" height="2" fill="#880000"/>
  `);
}

function makeSVGDefault() {
  return makeSVGBase(`
    <rect x="4" y="2" width="8" height="12" fill="#666"/>
    <rect x="6" y="4" width="2" height="2" fill="#cc0000"/>
    <rect x="8" y="4" width="2" height="2" fill="#cc0000"/>
  `);
}

// 敵の種別からSVGを返す
function getEnemySpriteSVG(enemy) {
  const { type, name } = enemy;
  if (type === 'boss')   return makeSVGDragon();
  if (type === 'slime')  return makeSVGSlime();
  if (type === 'bat')    return makeSVGBat();
  if (type === 'goblin') return makeSVGGoblin();
  if (type === 'snake')  return makeSVGSnake();
  if (type === 'orc')    return makeSVGOrc();
  if (type === 'dark')   return makeSVGDarkWarrior();
  if (type === 'beast')  return makeSVGCerberus();
  if (type === 'undead') return name.includes('骸骨') ? makeSVGSkeleton() : makeSVGZombie();
  return makeSVGDefault();
}

// =============================
// バトルシステム
// =============================
let battleState = null;

// =============================
// カーソル管理（キーボード選択）
// =============================
let cursor = { context: null, index: 0 };

// コンテキスト別のボタン一覧を取得
function getCursorButtons() {
  switch (cursor.context) {
    case 'battle_main':
      return [...document.querySelectorAll('#battle-main-cmd .battle-btn')];
    case 'battle_sub':
      return [
        ...document.querySelectorAll('#sub-cmd-list .battle-btn'),
        document.getElementById('btn-sub-back'),
      ].filter(Boolean);
    case 'shop':
      return [
        ...document.querySelectorAll('#shop-content .shop-btn'),
        document.getElementById('btn-shop-close'),
      ].filter(Boolean);
    case 'menu':
      return [
        document.getElementById('btn-save'),
        document.getElementById('btn-save-exit'),
        document.getElementById('btn-menu-close'),
      ].filter(Boolean);
    default:
      return [];
  }
}

// カーソルのレンダリング（選択中ボタンをハイライト）
function renderCursor() {
  const btns = getCursorButtons();
  btns.forEach((btn, i) => {
    if (i === cursor.index) {
      btn.classList.add('cursor-selected');
    } else {
      btn.classList.remove('cursor-selected');
    }
  });
}

// カーソルコンテキストを設定してレンダリング
function setCursorContext(context, index) {
  cursor.context = context;
  cursor.index = index !== undefined ? index : 0;
  renderCursor();
}

// カーソルを移動（+1 or -1、ラップアラウンド）
function moveCursor(delta) {
  const btns = getCursorButtons();
  if (!btns.length) return;
  cursor.index = (cursor.index + delta + btns.length) % btns.length;
  renderCursor();
}

// 選択中のボタンを実行
function executeCursor() {
  const btns = getCursorButtons();
  const btn = btns[cursor.index];
  if (btn && !btn.disabled) btn.click();
}

// Escapeキーの処理（コンテキスト別）
function handleCursorEscape() {
  switch (cursor.context) {
    case 'battle_sub':
      showBattleMainCmd();
      break;
    case 'shop':
      closeShop();
      break;
    case 'menu':
      toggleMenu();
      break;
  }
}

function startBattle(isBoss) {
  const floorKey = game.currentMap; // dungeon1/2/3
  let enemy;
  if (isBoss) {
    enemy = JSON.parse(JSON.stringify(ENEMIES.boss));
  } else {
    const pool = ENEMIES[floorKey] || ENEMIES.b1;
    const tmpl = pool[rand(0, pool.length - 1)];
    enemy = JSON.parse(JSON.stringify(tmpl));
  }

  battleState = {
    enemy,
    isBoss,
    playerDefending: false,
    enemyPoisoned: false,
    enemyPoisonTurn: 0,
    smokeUsed: false,
    protectActive: false,
    bossTurnCount: 0,
    playerTurn: true,
    ended: false,
  };

  game.inputEnabled = false;

  // バトルUI表示
  document.getElementById('battle-overlay').classList.remove('hidden');
  document.getElementById('battle-header').textContent =
    `[ ${enemy.name} が あらわれた！ ]`;
  document.getElementById('battle-enemy-sprite').innerHTML = getEnemySpriteSVG(enemy);
  document.getElementById('battle-enemy-name').textContent = enemy.name;
  updateBattleEnemyHp();
  document.getElementById('battle-status-msg').textContent = '';
  document.getElementById('battle-turn-msg').textContent = 'あなたのターン';
  document.getElementById('battle-log').innerHTML = '';

  showBattleMainCmd();
}

function updateBattleEnemyHp() {
  const e = battleState.enemy;
  const maxHp = ENEMIES.boss && battleState.isBoss ? ENEMIES.boss.hp : e.maxHp || e.hp;
  const ratio = e.hp / (e.maxHp || e.hp);
  document.getElementById('battle-hp-fill').style.width = `${Math.max(0, ratio * 100)}%`;
  document.getElementById('battle-hp-fill').style.background = hpColor(e.hp, e.maxHp || e.hp);
  document.getElementById('battle-enemy-hp-num').textContent = e.hp;
}

function showBattleMainCmd() {
  document.getElementById('battle-main-cmd').classList.remove('hidden');
  document.getElementById('battle-sub-cmd').classList.add('hidden');
  // まほうボタンの有効/無効
  const hasMagic = game.player.spells.length > 0;
  document.querySelector('[data-cmd="magic"]').disabled = !hasMagic;
  // アイテムボタンの有効/無効
  const hasItem = game.player.items.length > 0;
  document.querySelector('[data-cmd="item"]').disabled = !hasItem;
  // カーソルをバトルメインに設定
  setCursorContext('battle_main');
}

function addBattleLog(text, color) {
  const logEl = document.getElementById('battle-log');
  const line = document.createElement('div');
  line.textContent = text;
  if (color) line.style.color = color;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

// バトルコマンドハンドラ
function onBattleCommand(cmd) {
  if (!battleState || battleState.ended || !battleState.playerTurn) return;

  switch (cmd) {
    case 'attack':  playerAttack();  break;
    case 'magic':   openMagicSubMenu(); break;
    case 'item':    openItemSubMenu();  break;
    case 'defend':  playerDefend();  break;
    case 'run':     playerRun();     break;
  }
}

// 通常攻撃
function playerAttack() {
  const p = game.player;
  const e = battleState.enemy;
  const atk = getAtk(p);
  const def = e.def;
  const base = Math.max(1, atk - def);
  const dmg = Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)));

  e.hp -= dmg;
  addBattleLog(`${p.name} の攻撃！ ${e.name}に ${dmg}ダメージ！`, '#fff');
  updateBattleEnemyHp();

  if (e.hp <= 0) {
    e.hp = 0;
    endBattleWin();
    return;
  }
  enemyTurn();
}

// 魔法サブメニュー
function openMagicSubMenu() {
  const p = game.player;
  document.getElementById('battle-main-cmd').classList.add('hidden');
  document.getElementById('battle-sub-cmd').classList.remove('hidden');
  document.getElementById('sub-cmd-title').textContent = 'どの魔法を使う？';

  const list = document.getElementById('sub-cmd-list');
  list.innerHTML = '';
  for (const sid of p.spells) {
    const sp = SPELLS[sid];
    const btn = document.createElement('button');
    btn.className = 'battle-btn';
    btn.textContent = `${sp.name} (MP:${sp.mp}) - ${sp.desc}`;
    btn.disabled = p.mp < sp.mp;
    btn.addEventListener('click', () => useMagic(sid));
    list.appendChild(btn);
  }
  // カーソルをサブメニューに設定
  setCursorContext('battle_sub');
}

// アイテムサブメニュー
function openItemSubMenu() {
  const p = game.player;
  document.getElementById('battle-main-cmd').classList.add('hidden');
  document.getElementById('battle-sub-cmd').classList.remove('hidden');
  document.getElementById('sub-cmd-title').textContent = 'どのアイテムを使う？';

  const list = document.getElementById('sub-cmd-list');
  list.innerHTML = '';
  for (const item of p.items) {
    const cons = CONSUMABLES[item.id];
    const btn = document.createElement('button');
    btn.className = 'battle-btn';
    btn.textContent = `${cons.name} x${item.count} - ${cons.desc}`;
    btn.addEventListener('click', () => useItem(item.id));
    list.appendChild(btn);
  }
  // カーソルをサブメニューに設定
  setCursorContext('battle_sub');
}

// 魔法使用
function useMagic(spellId) {
  const p = game.player;
  const e = battleState.enemy;
  const sp = SPELLS[spellId];

  p.mp -= sp.mp;
  showBattleMainCmd();

  let logText = '';
  let logColor = '#aaf';

  switch (sp.type) {
    case 'attack': {
      let dmg;
      if (spellId === 'fire') {
        // DEF無視
        const base = 25 + rand(0, 10);
        const magicBonus = 1 + WEAPONS[p.weapon].magicBonus;
        dmg = Math.round(base * magicBonus);
      } else if (spellId === 'blizzard') {
        const base = Math.max(1, 20 + rand(0, 10) - e.def);
        const magicBonus = 1 + WEAPONS[p.weapon].magicBonus;
        dmg = Math.round(base * magicBonus);
      } else if (spellId === 'thunder') {
        const base = 35 + rand(0, 15);
        const magicBonus = 1 + WEAPONS[p.weapon].magicBonus;
        dmg = Math.round(base * magicBonus);
      } else {
        dmg = 20;
      }
      e.hp -= dmg;
      logText = `${sp.name}！ ${e.name}に ${dmg}ダメージ！`;
      updateBattleEnemyHp();
      if (e.hp <= 0) { e.hp = 0; endBattleWin(); return; }
      break;
    }
    case 'heal': {
      let amount;
      if (spellId === 'heal') {
        amount = rand(20, 30);
      } else if (spellId === 'fullheal') {
        amount = rand(60, 80);
      } else {
        amount = 20;
      }
      p.hp = Math.min(p.maxHp, p.hp + amount);
      logText = `${sp.name}！ HPが ${amount}回復した！`;
      logColor = '#0f0';
      updateStatusPanel();
      break;
    }
    case 'buff': {
      if (spellId === 'protect') {
        battleState.protectActive = true;
        logText = `${sp.name}！ 次の攻撃への防御が強化された！`;
        logColor = '#0af';
      }
      break;
    }
    case 'debuff': {
      if (spellId === 'poison' && !battleState.enemyPoisoned) {
        battleState.enemyPoisoned = true;
        logText = `${sp.name}！ ${e.name}は毒状態になった！`;
        logColor = '#a0f';
      } else {
        logText = `${sp.name}！ しかし効果がなかった...`;
      }
      break;
    }
    case 'escape': {
      if (spellId === 'smoke') {
        if (!battleState.isBoss) {
          addBattleLog('スモーク！ 煙に紛れて逃げ出した！', '#aaa');
          endBattleEscape();
          return;
        } else {
          logText = 'スモーク！ しかしボスには効かなかった！';
        }
      }
      break;
    }
  }

  addBattleLog(logText, logColor);
  enemyTurn();
}

// アイテム使用（バトル中）
function useItem(itemId) {
  const p = game.player;
  const e = battleState.enemy;
  const cons = CONSUMABLES[itemId];

  showBattleMainCmd();
  consumeItem(p, itemId);

  let logText = '';
  let logColor = '#0f0';

  switch (cons.effect) {
    case 'heal_20':
      p.hp = Math.min(p.maxHp, p.hp + 20);
      logText = `薬草を使った！ HPが20回復した！`;
      break;
    case 'heal_50':
      p.hp = Math.min(p.maxHp, p.hp + 50);
      logText = `上薬草を使った！ HPが50回復した！`;
      break;
    case 'holy':
      if (e.type === 'undead') {
        const dmg = rand(60, 80);
        e.hp -= dmg;
        logText = `聖水！ ${e.name}に ${dmg}の大ダメージ！`;
        updateBattleEnemyHp();
        if (e.hp <= 0) { e.hp = 0; endBattleWin(); return; }
      } else {
        logText = '聖水を使った！ しかし効果がなかった...';
        logColor = '#888';
      }
      break;
    case 'antidote':
      p.poisoned = false;
      logText = '毒消し草を使った！ 毒が治った！';
      break;
    case 'mp_10':
      p.mp = Math.min(getMaxMp(p), p.mp + 10);
      logText = 'エーテルを使った！ MPが10回復した！';
      logColor = '#aaf';
      break;
  }

  addBattleLog(logText, logColor);
  updateStatusPanel();
  enemyTurn();
}

// アイテムを消費
function consumeItem(player, itemId) {
  const idx = player.items.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  player.items[idx].count--;
  if (player.items[idx].count <= 0) {
    player.items.splice(idx, 1);
  }
}

// アイテムを追加
function addItem(player, itemId, count = 1) {
  const existing = player.items.find(i => i.id === itemId);
  if (existing) {
    existing.count += count;
  } else {
    const total = player.items.reduce((s, i) => s + i.count, 0);
    if (total < CONFIG.MAX_ITEMS) {
      player.items.push({ id: itemId, count });
    } else {
      return false; // 満杯
    }
  }
  return true;
}

// ぼうぎょ
function playerDefend() {
  battleState.playerDefending = true;
  if (battleState.protectActive) {
    battleState.protectActive = false;
  }
  addBattleLog(`${game.player.name} はぼうぎょ態勢に入った！`, '#aaa');
  enemyTurn();
}

// 逃走
function playerRun() {
  if (battleState.isBoss) {
    addBattleLog('ボスから逃げることはできない！', '#f66');
    return;
  }

  const p = game.player;
  const armorEscapeBonus = ARMORS[p.armor].escapeBonus;
  const weaponEscapeBonus = WEAPONS[p.weapon].escapeBonus;
  let rate = JOBS[p.job].label === 'thief'
    ? CONFIG.ESCAPE_RATE_THIEF
    : CONFIG.ESCAPE_RATE_NORMAL;
  rate += armorEscapeBonus + weaponEscapeBonus;
  rate = clamp(rate, 0, 1);

  if (Math.random() < rate) {
    addBattleLog('うまく逃げ出した！', '#aaa');
    endBattleEscape();
  } else {
    addBattleLog('しかし逃げられなかった！', '#f66');
    enemyTurn();
  }
}

// 敵のターン
function enemyTurn() {
  if (!battleState || battleState.ended) return;

  const p = game.player;
  const e = battleState.enemy;
  battleState.bossTurnCount++;

  // 毒ダメージ（敵）
  if (battleState.enemyPoisoned) {
    const poisonDmg = Math.max(1, Math.floor((e.maxHp || e.hp) * 0.05));
    e.hp -= poisonDmg;
    addBattleLog(`${e.name}は毒のダメージを受けた！ ${poisonDmg}ダメージ`, '#a0f');
    updateBattleEnemyHp();
    if (e.hp <= 0) {
      e.hp = 0;
      endBattleWin();
      return;
    }
  }

  // ボス特殊攻撃（3ターンに1回）
  let dmg;
  if (battleState.isBoss && battleState.bossTurnCount % 3 === 0) {
    const base = rand(40, 60);
    dmg = battleState.playerDefending ? Math.floor(base * 0.5) : base;
    if (battleState.protectActive) { dmg = Math.floor(dmg * 0.5); battleState.protectActive = false; }
    addBattleLog(`ヴォルガンの炎ブレス！！ ${dmg}の大ダメージ！`, '#ff4400');
  } else {
    // 通常攻撃
    const base = Math.max(1, e.atk - getDef(p));
    const raw = Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)));
    dmg = battleState.playerDefending ? Math.floor(raw * 0.5) : raw;
    if (battleState.protectActive) { dmg = Math.floor(dmg * 0.5); battleState.protectActive = false; }
    addBattleLog(`${e.name}の攻撃！ ${p.name}に ${dmg}ダメージ！`, '#f88');
  }

  // 毒ヘビ特殊：毒状態にする
  if (e.special === 'poison' && !p.poisoned && Math.random() < 0.3) {
    p.poisoned = true;
    addBattleLog(`${p.name}は毒を受けた！`, '#a0f');
  }

  p.hp -= dmg;
  battleState.playerDefending = false;

  if (p.hp <= 0) {
    p.hp = 0;
    updateStatusPanel();
    endBattleLose();
    return;
  }

  updateStatusPanel();

  // プレイヤーのターンに戻す
  document.getElementById('battle-turn-msg').textContent = 'あなたのターン';
  showBattleMainCmd();

  // マップをフラッシュ
  const mapArea = document.getElementById('map-area');
  mapArea.classList.add('flash-damage');
  setTimeout(() => mapArea.classList.remove('flash-damage'), 300);
}

// 勝利
function endBattleWin() {
  if (battleState.ended) return;
  battleState.ended = true;
  cursor.context = null;
  const e = battleState.enemy;
  const p = game.player;
  const isBoss = battleState.isBoss;

  p.exp += e.exp;
  p.gold += e.gold;

  addBattleLog(`${e.name}を倒した！`, '#ffd700');
  addBattleLog(`EXP +${e.exp}  ペリカ +${e.gold}`, '#ffd700');

  if (isBoss) {
    game.flags.bossDefeated = true;
    // ボスタイルを床に変更
    const mapData = game.maps[game.currentMap];
    mapData.grid[p.y][p.x] = TILE.FLOOR;
    addBattleLog('暗黒竜ヴォルガンを倒した！ 宝箱が現れた！', '#ff0');
  }

  // レベルアップ確認
  checkLevelUp();
  updateStatusPanel();

  setTimeout(() => {
    document.getElementById('battle-overlay').classList.add('hidden');
    game.inputEnabled = true;
    battleState = null;
    renderMap();
    updateStatusPanel();
    if (isBoss) {
      addMessage('ボスを倒した！ 宝箱を手に入れよう！', '#ffd700');
    } else {
      addMessage(`${e.name}を倒した！ EXP+${e.exp} G+${e.gold}`, '#ffd700');
    }
  }, 1500);
}

// 逃走成功
function endBattleEscape() {
  if (battleState.ended) return;
  battleState.ended = true;
  cursor.context = null;
  setTimeout(() => {
    document.getElementById('battle-overlay').classList.add('hidden');
    game.inputEnabled = true;
    battleState = null;
    addMessage('逃げ出した！');
    renderMap();
  }, 800);
}

// 敗北
function endBattleLose() {
  if (battleState.ended) return;
  battleState.ended = true;
  cursor.context = null;
  addBattleLog(`${game.player.name}は力尽きた...`, '#ff3333');
  document.querySelector('[data-cmd="attack"]').disabled = true;
  document.querySelector('[data-cmd="magic"]').disabled = true;
  document.querySelector('[data-cmd="item"]').disabled = true;
  document.querySelector('[data-cmd="defend"]').disabled = true;
  document.querySelector('[data-cmd="run"]').disabled = true;

  setTimeout(() => {
    document.getElementById('battle-overlay').classList.add('hidden');
    battleState = null;
    triggerGameOver();
  }, 1500);
}

// =============================
// レベルアップ
// =============================
function checkLevelUp() {
  const p = game.player;
  while (p.exp >= p.expNext && p.lv < CONFIG.MAX_LV) {
    p.exp -= p.expNext;
    p.lv++;
    p.expNext = p.lv * 100;

    const growth = JOBS[p.job].growth;
    p.maxHp += growth.hp;
    p.maxMp += growth.mp;
    p.baseAtk += growth.atk;
    p.baseDef += growth.def;
    p.hp = p.maxHp; // レベルアップでHP全回復
    p.mp = getMaxMp(p);

    addBattleLog(`レベルアップ！ LV ${p.lv} になった！`, '#ffd700');
    addMessage(`LV UP！ ${p.lv}になった！`, '#ffd700');
  }
}

// =============================
// ショップシステム
// =============================
function openShop(titleText, contentHtml) {
  game.inputEnabled = false;
  document.getElementById('shop-title').textContent = titleText;
  document.getElementById('shop-content').innerHTML = contentHtml;
  document.getElementById('shop-overlay').classList.remove('hidden');
  // カーソルをショップに設定（DOMが確定後に反映）
  setTimeout(() => setCursorContext('shop'), 0);
}

function closeShop() {
  cursor.context = null;
  document.getElementById('shop-overlay').classList.add('hidden');
  game.inputEnabled = true;
  updateStatusPanel();
}

// 宿屋
function openInn() {
  const cost = game.player.lv * 10;
  const content = `
    <div style="color:#ccc; margin-bottom:12px;">宿屋へようこそ！ 一泊 ${cost} ペリカ です。</div>
    <div class="shop-gold-info">所持金: ${game.player.gold} ペリカ</div>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <button class="shop-btn" id="btn-inn-stay" ${game.player.gold < cost ? 'disabled' : ''}>泊まる (${cost}P)</button>
      <button class="shop-btn" id="btn-inn-cancel">やめる</button>
    </div>
  `;
  openShop('[ 宿屋 ]', content);

  document.getElementById('btn-inn-stay')?.addEventListener('click', () => {
    game.player.gold -= cost;
    game.player.hp = game.player.maxHp;
    game.player.mp = getMaxMp(game.player);
    game.player.poisoned = false;
    closeShop();
    addMessage('ゆっくりと休んだ。HP・MPが全回復した！', '#00ff41');
  });
  document.getElementById('btn-inn-cancel').addEventListener('click', closeShop);
}

// 魔法ショップ
function openMagicShop() {
  const p = game.player;
  let rows = '<div class="shop-section-title">習得可能な魔法</div>';
  let any = false;

  for (const entry of MAGIC_SHOP_LIST) {
    const sp = SPELLS[entry.id];
    const owned = p.spells.includes(entry.id);
    const canAfford = p.gold >= entry.price;
    const disabled = owned || !canAfford;
    const label = owned ? '習得済み' : `${entry.price}P`;
    rows += `
      <div class="shop-item-row ${disabled ? 'disabled' : ''}">
        <span class="shop-item-name">${sp.name}</span>
        <span class="shop-item-desc">${sp.desc}</span>
        <span class="shop-item-price">${label}</span>
        <button class="shop-btn" data-buy-spell="${entry.id}" ${disabled ? 'disabled' : ''}>購入</button>
      </div>`;
    if (!owned) any = true;
  }
  if (!any) rows += '<div style="color:#666; margin-top:8px;">購入できる魔法がありません。</div>';

  rows += `<div class="shop-gold-info" style="margin-top:8px;">所持金: ${p.gold} ペリカ</div>`;
  openShop('[ 魔法ショップ ]', rows);

  document.querySelectorAll('[data-buy-spell]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.buySpell;
      const price = MAGIC_SHOP_LIST.find(e => e.id === sid).price;
      p.gold -= price;
      p.spells.push(sid);
      addMessage(`${SPELLS[sid].name}を習得した！`, '#aaf');
      openMagicShop(); // 更新
    });
  });
}

// 武器屋
function openWeaponShop() {
  const p = game.player;
  let rows = buildEquipRows(WEAPON_SHOP_LIST, WEAPONS, 'weapon');
  rows += buildSellRows(p, 'weapon');
  rows += `<div class="shop-gold-info" style="margin-top:8px;">所持金: ${p.gold} ペリカ</div>`;
  openShop('[ 武器屋 ]', rows);
  bindEquipShopEvents(WEAPON_SHOP_LIST, WEAPONS, 'weapon', openWeaponShop);
}

// 防具屋
function openArmorShop() {
  const p = game.player;
  let rows = buildEquipRows(ARMOR_SHOP_LIST, ARMORS, 'armor');
  rows += buildSellRows(p, 'armor');
  rows += `<div class="shop-gold-info" style="margin-top:8px;">所持金: ${p.gold} ペリカ</div>`;
  openShop('[ 防具屋 ]', rows);
  bindEquipShopEvents(ARMOR_SHOP_LIST, ARMORS, 'armor', openArmorShop);
}

function buildEquipRows(list, catalog, type) {
  const p = game.player;
  let rows = `<div class="shop-section-title">購入</div>`;
  for (const id of list) {
    const item = catalog[id];
    const canEquip = item.jobs.includes(p.job);
    const canAfford = p.gold >= item.price;
    const disabled = !canEquip || !canAfford;
    const stat = type === 'weapon' ? `ATK+${item.atk}` : `DEF+${item.def}`;
    rows += `
      <div class="shop-item-row ${disabled ? 'disabled' : ''}">
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-desc">${stat}</span>
        <span class="shop-item-price">${item.price}P</span>
        <button class="shop-btn" data-buy-equip="${id}" data-equip-type="${type}" ${disabled ? 'disabled' : ''}>購入</button>
      </div>`;
  }
  return rows;
}

function buildSellRows(p, type) {
  let rows = `<div class="shop-section-title">売却</div>`;
  const catalog = type === 'weapon' ? WEAPONS : ARMORS;
  const currentKey = type === 'weapon' ? p.weapon : p.armor;
  const item = catalog[currentKey];
  const sellPrice = item.sell;
  if (sellPrice === 0) {
    rows += `<div class="shop-item-row disabled"><span class="shop-item-name">${item.name}</span><span style="color:#666">売れない</span></div>`;
  } else {
    rows += `
      <div class="shop-item-row">
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-price">${sellPrice}P</span>
        <button class="shop-btn" data-sell-equip="${currentKey}" data-equip-type="${type}">売る</button>
      </div>`;
  }
  return rows;
}

function bindEquipShopEvents(list, catalog, type, reopenFn) {
  document.querySelectorAll('[data-buy-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.buyEquip;
      const item = catalog[id];
      game.player.gold -= item.price;
      game.player[type] = id;
      addMessage(`${item.name}を購入・装備した！`, '#0af');
      reopenFn();
    });
  });
  document.querySelectorAll('[data-sell-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.sellEquip;
      const item = catalog[id];
      game.player.gold += item.sell;
      // 初期装備に戻す
      if (type === 'weapon') game.player.weapon = JOBS[game.player.job].initialWeapon;
      if (type === 'armor') game.player.armor = 'cloth';
      addMessage(`${item.name}を売った！ +${item.sell}P`, '#ffd700');
      reopenFn();
    });
  });
}

// 道具屋
function openItemShop() {
  const p = game.player;
  let rows = `<div class="shop-section-title">購入</div>`;
  for (const id of ITEM_SHOP_LIST) {
    const cons = CONSUMABLES[id];
    const canAfford = p.gold >= cons.price;
    rows += `
      <div class="shop-item-row ${!canAfford ? 'disabled' : ''}">
        <span class="shop-item-name">${cons.name}</span>
        <span class="shop-item-desc">${cons.desc}</span>
        <span class="shop-item-price">${cons.price}P</span>
        <button class="shop-btn" data-buy-item="${id}" ${!canAfford ? 'disabled' : ''}>購入</button>
      </div>`;
  }

  rows += `<div class="shop-section-title">売却</div>`;
  if (p.items.length === 0) {
    rows += `<div style="color:#666">売れるアイテムがない</div>`;
  } else {
    for (const inv of p.items) {
      const cons = CONSUMABLES[inv.id];
      rows += `
        <div class="shop-item-row">
          <span class="shop-item-name">${cons.name} x${inv.count}</span>
          <span class="shop-item-price">${cons.sell}P/個</span>
          <button class="shop-btn" data-sell-item="${inv.id}">売る</button>
        </div>`;
    }
  }

  rows += `<div class="shop-gold-info" style="margin-top:8px;">所持金: ${p.gold} ペリカ</div>`;
  openShop('[ 道具屋 ]', rows);

  document.querySelectorAll('[data-buy-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.buyItem;
      const cons = CONSUMABLES[id];
      if (p.gold < cons.price) return;
      if (!addItem(p, id)) {
        addMessage('アイテムがいっぱいだ！');
        return;
      }
      p.gold -= cons.price;
      addMessage(`${cons.name}を購入した！`, '#0af');
      openItemShop();
    });
  });

  document.querySelectorAll('[data-sell-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.sellItem;
      const cons = CONSUMABLES[id];
      consumeItem(p, id);
      p.gold += cons.sell;
      addMessage(`${cons.name}を売った！ +${cons.sell}P`, '#ffd700');
      openItemShop();
    });
  });
}

// =============================
// セーブ/ロード（スロット制）
// =============================
const MAP_NAMES = { town: '町', dungeon1: 'B1F', dungeon2: 'B2F', dungeon3: 'B3F' };

// 現在時刻を「YYYY/MM/DD HH:MM」形式で返す
function formatNow() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 指定スロットにセーブ
function saveToSlot(slot) {
  const saveData = {
    savedAt: formatNow(),
    charInfo: {
      name: game.player.name,
      job: game.player.job,
      lv: game.player.lv,
      location: MAP_NAMES[game.currentMap] || '─',
    },
    player: game.player,
    currentMap: game.currentMap,
    explored: Object.fromEntries(
      Object.entries(game.explored).map(([k, v]) => [k, [...v]])
    ),
    flags: game.flags,
  };
  localStorage.setItem(CONFIG.SAVE_SLOT_KEY + slot, JSON.stringify(saveData));
  addMessage(`スロット${slot}にセーブしました。`, '#00ff41');
}

// 指定スロットからロード
function loadFromSlot(slot) {
  const raw = localStorage.getItem(CONFIG.SAVE_SLOT_KEY + slot);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    game.player = data.player;
    game.currentMap = data.currentMap;
    game.explored = Object.fromEntries(
      Object.entries(data.explored).map(([k, v]) => [k, new Set(v)])
    );
    game.flags = data.flags;
    return true;
  } catch (e) {
    console.error('ロード失敗:', e);
    return false;
  }
}

// 指定スロットを削除
function deleteSlot(slot) {
  localStorage.removeItem(CONFIG.SAVE_SLOT_KEY + slot);
}

// 全スロット情報を { 1: data, 2: data, ... } 形式で返す
function getSaveSlots() {
  const result = {};
  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    const raw = localStorage.getItem(CONFIG.SAVE_SLOT_KEY + i);
    if (raw) {
      try { result[i] = JSON.parse(raw); } catch (e) {}
    }
  }
  return result;
}

// いずれかのスロットにデータがあるか
function hasSaveData() {
  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    if (localStorage.getItem(CONFIG.SAVE_SLOT_KEY + i)) return true;
  }
  return false;
}

// タイトル画面の「ロードする」ボタンを更新
function updateTitleLoadBtn() {
  const btn = document.getElementById('btn-load-title');
  if (btn) btn.disabled = !hasSaveData();
}

// スロット選択オーバーレイを開く（共通）
function openSlotOverlay(title, listHtml) {
  document.getElementById('slot-title').textContent = title;
  document.getElementById('slot-list').innerHTML = listHtml;
  document.getElementById('slot-overlay').classList.remove('hidden');
}

// スロット選択オーバーレイを閉じる
function closeSlotOverlay() {
  document.getElementById('slot-overlay').classList.add('hidden');
}

// セーブスロット選択UIを開く
// exitAfter=true の場合、セーブ後にタイトルへ戻る
function openSaveSlotUI(exitAfter) {
  const slots = getSaveSlots();
  let html = '';

  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    const slot = slots[i];
    if (slot) {
      const ci = slot.charInfo;
      html += `
        <div class="slot-card">
          <div class="slot-info">
            <span class="slot-char">スロット${i}: ${ci.name}（${JOBS[ci.job].name}）LV${ci.lv}</span>
            <span class="slot-location">${ci.location}</span>
            <span class="slot-date">${slot.savedAt}</span>
          </div>
          <div class="slot-actions">
            <button class="slot-btn" data-save-slot="${i}">ここにセーブ</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="slot-card">
          <div class="slot-info">
            <span class="slot-char">スロット${i}（空き）</span>
          </div>
          <div class="slot-actions">
            <button class="slot-btn" data-save-slot="${i}">ここにセーブ</button>
          </div>
        </div>`;
    }
  }

  const title = exitAfter ? '[ セーブして終了 ]' : '[ セーブスロット選択 ]';
  openSlotOverlay(title, html);

  document.querySelectorAll('[data-save-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = parseInt(btn.dataset.saveSlot);
      saveToSlot(slot);
      closeSlotOverlay();
      updateTitleLoadBtn();
      if (exitAfter) {
        cursor.context = null;
        document.getElementById('menu-overlay').classList.add('hidden');
        showScreen('title');
        updateTitleLoadBtn();
      } else {
        toggleMenu();
      }
    });
  });
}

// ロードスロット選択UIを開く
function openLoadSlotUI() {
  const slots = getSaveSlots();
  let html = '';
  let hasAny = false;

  for (let i = 1; i <= CONFIG.SAVE_SLOTS; i++) {
    const slot = slots[i];
    if (slot) {
      hasAny = true;
      const ci = slot.charInfo;
      html += `
        <div class="slot-card">
          <div class="slot-info">
            <span class="slot-char">スロット${i}: ${ci.name}（${JOBS[ci.job].name}）LV${ci.lv}</span>
            <span class="slot-location">${ci.location}</span>
            <span class="slot-date">${slot.savedAt}</span>
          </div>
          <div class="slot-actions">
            <button class="slot-btn" data-load-slot="${i}">ロード</button>
            <button class="slot-btn slot-btn-danger" data-delete-slot="${i}">削除</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="slot-card slot-empty">
          <div class="slot-info">
            <span class="slot-char">スロット${i}（空き）</span>
          </div>
        </div>`;
    }
  }

  if (!hasAny) {
    html = '<div style="color:#666;text-align:center;padding:20px;">セーブデータがありません</div>';
  }

  openSlotOverlay('[ ロードする ]', html);

  document.querySelectorAll('[data-load-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = parseInt(btn.dataset.loadSlot);
      closeSlotOverlay();
      initMaps();
      if (loadFromSlot(slot)) {
        startGameScreen();
        addMessage('ゲームをロードした。');
      }
    });
  });

  document.querySelectorAll('[data-delete-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(`スロット${btn.dataset.deleteSlot}のデータを削除しますか？`)) return;
      deleteSlot(parseInt(btn.dataset.deleteSlot));
      updateTitleLoadBtn();
      openLoadSlotUI(); // 再描画
    });
  });
}

// =============================
// ゲームオーバー / エンディング
// =============================
function triggerGameOver() {
  game.inputEnabled = false;
  showScreen('gameover');
  document.getElementById('gameover-msg').textContent =
    `${game.player.name}は力尽きた...`;
  document.getElementById('btn-go-load').disabled = !hasSaveData();
}

function triggerEnding() {
  game.inputEnabled = false;
  showScreen('ending');
  document.getElementById('ending-msg').textContent =
    `おめでとう！\n${game.player.name}は謎の洞窟から伝説の秘宝を持ち帰り、英雄となった！`;
}

// =============================
// イベント登録
// =============================
function initEvents() {
  // キーボード入力
  document.addEventListener('keydown', e => {
    // カーソルコンテキストが有効な場合はTab/Enter/Escapeを優先
    if (cursor.context) {
      if (e.key === 'Tab') {
        e.preventDefault();
        moveCursor(e.shiftKey ? -1 : 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        executeCursor();
      } else if (e.key === 'Escape') {
        handleCursorEscape();
      }
      // 矢印キー・WASDはここでreturnして移動処理に渡さない
      return;
    }
    // 通常のゲーム入力
    if (!game.inputEnabled) return;
    // ESCでメニュー
    if (e.key === 'Escape' && game.screen === 'game') {
      toggleMenu();
      return;
    }
    const dir = MOVE_MAP[e.key];
    if (dir && game.screen === 'game') {
      e.preventDefault();
      tryMove(dir[0], dir[1]);
    }
  });

  // タイトル画面
  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('create');
  });

  document.getElementById('btn-load-title').addEventListener('click', () => {
    openLoadSlotUI();
  });

  // キャラクター作成
  let selectedJob = null;

  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.job-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedJob = card.dataset.job;
      updateStartButton();
    });
  });

  document.getElementById('input-name').addEventListener('input', updateStartButton);

  function updateStartButton() {
    const name = document.getElementById('input-name').value.trim();
    document.getElementById('btn-start-game').disabled = !name || !selectedJob;
  }

  document.getElementById('btn-start-game').addEventListener('click', () => {
    const name = document.getElementById('input-name').value.trim();
    if (!name || !selectedJob) return;

    initMaps();
    game.player = createPlayer(name, selectedJob);
    game.currentMap = 'town';
    game.player.x = game.maps.town.startX;
    game.player.y = game.maps.town.startY;
    game.flags = { bossDefeated: false, hasTreasure: false, bossEncountered: false };
    game.explored = { town: new Set(), dungeon1: new Set(), dungeon2: new Set(), dungeon3: new Set() };

    markExplored();
    startGameScreen();
    addMessage(`${name}の冒険が始まった！`, '#00ff41');
  });

  // バトルコマンド
  document.querySelectorAll('.battle-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => onBattleCommand(btn.dataset.cmd));
  });

  document.getElementById('btn-sub-back').addEventListener('click', showBattleMainCmd);

  // ショップ閉じる
  document.getElementById('btn-shop-close').addEventListener('click', closeShop);

  // メニュー
  document.getElementById('btn-menu').addEventListener('click', toggleMenu);
  document.getElementById('btn-menu-close').addEventListener('click', toggleMenu);
  document.getElementById('btn-save').addEventListener('click', () => {
    toggleMenu(); // メニューを閉じてからスロット選択を開く
    openSaveSlotUI(false);
  });
  document.getElementById('btn-save-exit').addEventListener('click', () => {
    toggleMenu();
    openSaveSlotUI(true);
  });
  document.getElementById('btn-slot-close').addEventListener('click', () => {
    closeSlotOverlay();
    // スロット画面からゲームに戻る場合はinputEnabledを復元
    if (game.screen === 'game') game.inputEnabled = true;
    updateTitleLoadBtn();
  });

  // ゲームオーバー
  document.getElementById('btn-go-load').addEventListener('click', () => {
    if (!hasSaveData()) return;
    openLoadSlotUI();
  });

  document.getElementById('btn-go-title').addEventListener('click', () => {
    showScreen('title');
    updateTitleLoadBtn();
  });

  // エンディング
  document.getElementById('btn-ending-title').addEventListener('click', () => {
    showScreen('title');
    updateTitleLoadBtn();
  });

  // 仮想Dパッド（タッチ操作）
  const dpadMap = {
    'dpad-up':    [0, -1],
    'dpad-down':  [0,  1],
    'dpad-left':  [-1, 0],
    'dpad-right': [1,  0],
  };
  Object.entries(dpadMap).forEach(([id, dir]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      if (game.screen === 'game' && game.inputEnabled && !cursor.context) {
        tryMove(dir[0], dir[1]);
      }
    }, { passive: false });
    // マウスでもテスト可能にする（click）
    btn.addEventListener('click', () => {
      if (game.screen === 'game' && game.inputEnabled && !cursor.context) {
        tryMove(dir[0], dir[1]);
      }
    });
  });
}

function toggleMenu() {
  const overlay = document.getElementById('menu-overlay');
  if (overlay.classList.contains('hidden')) {
    overlay.classList.remove('hidden');
    game.inputEnabled = false;
    setCursorContext('menu');
  } else {
    cursor.context = null;
    overlay.classList.add('hidden');
    game.inputEnabled = true;
  }
}

// ゲーム画面を表示してレンダリング
function startGameScreen() {
  showScreen('game');
  game.inputEnabled = true;
  markExplored();
  renderMap();
  updateStatusPanel();
  updateTitleLoadBtn();
}

// =============================
// 初期化
// =============================
function init() {
  // 旧バージョン（v1）のセーブデータをスロット1に移行
  const oldSave = localStorage.getItem(CONFIG.SAVE_KEY);
  if (oldSave && !localStorage.getItem(CONFIG.SAVE_SLOT_KEY + '1')) {
    try {
      const oldData = JSON.parse(oldSave);
      const migrated = {
        savedAt: '（移行済み）',
        charInfo: {
          name: oldData.player?.name || '？',
          job: oldData.player?.job || 'warrior',
          lv: oldData.player?.lv || 1,
          location: MAP_NAMES[oldData.currentMap] || '─',
        },
        ...oldData,
      };
      localStorage.setItem(CONFIG.SAVE_SLOT_KEY + '1', JSON.stringify(migrated));
      localStorage.removeItem(CONFIG.SAVE_KEY);
    } catch (e) {}
  }

  updateTitleLoadBtn();
  initEvents();
  showScreen('title');
}

// スクリプト読み込み後に初期化
init();
