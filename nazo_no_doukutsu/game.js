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
  VIEW_SIZE: 15,
  FOG_RADIUS: 3,
  ESCAPE_RATE: 0.5,
  ESCAPE_RATE_THIEF: 0.75,
  MAX_ITEMS: 24,
  MAX_LV: 30,
  PARTY_MAX: 3,
  SAVE_SLOT_KEY: 'nazo_no_doukutsu_v3_slot_',
  SOUND_KEY: 'nazo_no_doukutsu_muted',
  DPAD_KEY: 'nazo_no_doukutsu_dpad',
  TARGET_KEY: 'nazo_no_doukutsu_target',
  AUTO_KEY: 'nazo_no_doukutsu_autobattle',
  SAVE_SLOTS: 3,
};

const TILE = {
  WALL: '#', FLOOR: '.',
  STAIR_DOWN: '>', STAIR_UP: '<',
  HOUSE: 'H', INN: 'I', MAGIC_SHOP: 'M', WEAPON_SHOP: 'W', ARMOR_SHOP: 'A', ITEM_SHOP: 'T',
  CASTLE: 'K', TOWN_EXIT: 'E', ONSEN: 'S', FOOD: 'G',
  TREE: 'Y', WATER: '~', FLOWER: '*',
  MOUNTAIN: 'n', FOREST: 'q', BRIDGE: '=', TOWN_ICON: 'O', CAVE_ICON: 'V',
  CHEST: 'C', LEGEND_CHEST: 'L', CHEST_OPEN: 'c',
  SPRING: 'F', SPRING_DRY: 'f',
  TRAP: '^', TRAP_SEEN: 'x',
  BOSS: 'B', TREASURE: '$', CELL: 'P',
};
const BLOCKING = new Set([TILE.WALL, TILE.TREE, TILE.WATER, TILE.MOUNTAIN]);

const AREAS = {
  field:    { name: 'フィールド', no: 0, enc: 0.06, pool: 'field', bgm: 'field', battleBgm: 'battle', open: true },
  dungeon1: { name: 'B1F', no: 1, enc: 0.10, pool: 'b1', bgm: 'dungeon', battleBgm: 'battle' },
  dungeon2: { name: 'B2F', no: 2, enc: 0.12, pool: 'b2', bgm: 'dungeon2', battleBgm: 'battle2' },
  dungeon3: { name: 'B3F', no: 3, enc: 0.13, pool: 'b3', bgm: 'deep', battleBgm: 'battle3' },
  dungeon4: { name: 'B4F', no: 4, enc: 0.14, pool: 'b4', bgm: 'deep4', battleBgm: 'battle4' },
  dungeon5: { name: 'B5F', no: 5, enc: 0.15, pool: 'b5', bgm: 'abyss', battleBgm: 'battle5' },
};
const DUNGEONS = ['dungeon1', 'dungeon2', 'dungeon3', 'dungeon4', 'dungeon5'];
const MAP_NAMES = { town: '町', field: 'フィールド', dungeon1: 'B1F', dungeon2: 'B2F', dungeon3: 'B3F', dungeon4: 'B4F', dungeon5: 'B5F' };

// 職業
const JOBS = {
  warrior: { name: '戦士', base: { hp: 40, mp: 4, atk: 13, def: 9 }, growth: { hp: 8, mp: 1, atk: 3, def: 2 }, spells: [], weapon: 'wooden_sword' },
  mage:    { name: '魔法使い', base: { hp: 22, mp: 24, atk: 6, def: 4 }, growth: { hp: 4, mp: 5, atk: 1, def: 1 }, spells: ['fire', 'heal'], weapon: 'thin_staff' },
  priest:  { name: '僧侶', base: { hp: 30, mp: 18, atk: 8, def: 7 }, growth: { hp: 6, mp: 4, atk: 2, def: 2 }, spells: ['heal', 'cure', 'protect'], weapon: 'thin_staff' },
  thief:   { name: '盗賊', base: { hp: 32, mp: 8, atk: 11, def: 7 }, growth: { hp: 6, mp: 2, atk: 3, def: 2 }, spells: ['smoke', 'poison'], weapon: 'dagger' },
};

// 仲間・姫・主人公の設定（ゲーム中に書き換えられる。AI会話はこれを見て答える）
const DEFAULT_PROFILES = {
  hero: { gender: '秘密', age: '', personality: '', memories: [] },
  ares: { name: 'アレス', gender: '男性', age: 19,
    personality: '熱血で真っ直ぐ。一人称は「俺」。主人公を「相棒」と呼ぶ。ミレーユ姫を心から慕い、守れなかったことを悔やんでいる。言葉は短く力強い。',
    memories: ['城の兵士として姫の護衛についていたが、竜の襲撃を止められなかった'] },
  rina: { name: 'リナ', gender: '女性', age: 16,
    personality: '勝ち気で自信家。一人称は「あたし」。「〜じゃない」「〜でしょ」「ふふん」が口癖。素直になれないが仲間思い。炎の魔法と甘い物が好き。',
    memories: ['魔法屋の看板娘。父に一人前と認めてほしいと思っている'] },
  sera: { name: 'セラ', gender: '女性', age: 22,
    personality: '穏やかで慈愛深い。一人称は「私」。丁寧語で話し、仲間の体を気づかう。芯は強く、闇の魔物には毅然とする。温泉が好き。',
    memories: ['町の小さな教会で、孤児たちの世話をしてきた'] },
  jin: { name: 'ジン', gender: '男性', age: 27,
    personality: '皮肉屋で飄々としている。一人称は「俺」。軽口が多く金にうるさいが、根は情に厚い。語尾は「〜だぜ」「〜だな」。食べ歩きが趣味。',
    memories: ['各地を渡り歩いてきた流れ者。昔、仲間に裏切られたことがある'] },
  princess: { name: 'ミレーユ', gender: '女性', age: 17,
    personality: '気品があり芯が強い王女。一人称は「わたくし」。助けてくれた一行に深く感謝している。',
    memories: ['嵐の夜、暗黒竜に城からさらわれた', '洞窟の牢で、助けが来ることを信じて待ち続けた'] },
};
const MEMORY_MAX = 50;

// 登場人物の紹介文
const INTROS = {
  ares: '王国の若き兵士。姫の護衛でありながら竜の襲撃を止められず、自分を責め続けている。剣の腕は確かで、仲間思いの熱血漢。',
  rina: '町の魔法屋の看板娘。炎の魔法が自慢の勝ち気な少女で、口では強がるが根は優しい。甘い物に目がない。',
  sera: '町の教会の修道女。孤児たちを育ててきた慈愛と、闇の魔物に屈しない芯の強さをあわせ持つ。温泉が好き。',
  jin: '各地を渡り歩く流れ者の盗賊。皮肉屋で金にうるさいが、情には厚い。罠の解除と鍵開けの名人で、食べ歩きが趣味。',
  princess: '王国の王女。気品があり芯の強い17歳。嵐の夜、暗黒竜ヴォルガンにさらわれ、洞窟の最深部に囚われている。',
};
function introCard(id, pr, opts = {}) {
  const job = id === 'princess' ? '姫' : JOBS[COMPANIONS[id].job].name;
  const face = id === 'princess' ? Art.princessInline(44)
    : Art.heroInline(defaultLook(COMPANIONS[id].job, pr.gender === '女性'), 44);
  const name = id === 'princess' ? `${pr.name}姫` : pr.name;
  const custom = pr.personality !== DEFAULT_PROFILES[id].personality;
  return `<div class="intro-card">
    <div class="ic-face">${face}</div>
    <div class="ic-info">
      <div class="ic-name">${esc(name)}<span>${job}・${esc(pr.gender)}${pr.age !== '' ? `・${esc(pr.age)}歳` : ''}</span></div>
      <div class="ic-text">${esc(custom ? pr.personality : INTROS[id])}</div>
      ${opts.where ? `<div class="ic-where">${opts.where}</div>` : ''}
    </div>
  </div>`;
}

// タイトル画面の「登場人物」
function openCharacterList() {
  const pr = game.profiles || DEFAULT_PROFILES;
  const where = { ares: '町の城の門の前にいる', rina: '町の魔法屋の隣にいる', sera: '町の宿屋の近くにいる', jin: '町の道具屋の近くにいる', princess: '謎の洞窟の最深部に囚われている' };
  const ids = ['ares', 'rina', 'sera', 'jin', 'princess'];
  openShop('[ 登場人物 ]', `<div class="dim2" style="margin-bottom:4px">町の4人から2人まで仲間にでき、3人で冒険します。性別・年齢・性格・記憶は、ゲーム中に「なかま」→「設定」で変えられます。</div>`
    + ids.map(id => introCard(id, pr[id] || DEFAULT_PROFILES[id], { where: where[id] })).join(''));
}
const GENDERS = ['男性', '女性', 'その他', '秘密'];

// 記憶を書き足す（古いものから消える）
function addMemory(id, text) {
  const pr = game.profiles && game.profiles[id];
  if (!pr) return;
  text = String(text).slice(0, 60);
  if (pr.memories[pr.memories.length - 1] === text) return;   // 同じ出来事は続けて書かない
  pr.memories.push(text);
  while (pr.memories.length > MEMORY_MAX) pr.memories.shift();
}
// 仲間ひとりの記憶に残す（主人公は対象外）
function addMemoryOf(m, text) { if (m && m.companion) addMemory(m.companion, text); }
// 同じ種類の古い記憶を置き換える（レベルなど）
function replaceMemory(id, pattern, text) {
  const pr = game.profiles && game.profiles[id];
  if (!pr) return;
  pr.memories = pr.memories.filter(x => !pattern.test(x));
  addMemory(id, text);
}
// いま一緒にいる仲間（と姫）全員の記憶に残す
function addMemoryAll(text) {
  game.party.forEach(m => { if (m.companion) addMemory(m.companion, text); });
  if (game.flags.princessRescued) addMemory('princess', text);
}

// 町で仲間になる人たち
const COMPANIONS = {
  ares: { name: 'アレス', job: 'warrior', home: [14, 4], who: '城の兵士アレス',
    hello: '「姫様を救いに行くのか！ 俺も連れて行ってくれ。この剣は姫様のためにある！」' },
  rina: { name: 'リナ', job: 'mage', home: [18, 7], who: '魔法屋の娘リナ',
    hello: '「竜退治？ ふふん、あたしの炎の魔法、見せてあげるわ！」' },
  sera: { name: 'セラ', job: 'priest', home: [9, 8], who: '修道女セラ',
    hello: '「傷ついた方を癒すのが私の務め。どうか、お供させてください」' },
  jin:  { name: 'ジン', job: 'thief', home: [20, 14], who: '流れ者ジン',
    hello: '「洞窟の罠なら任せな。…分け前は弾んでくれよ？」' },
};

// 魔法（威力はレベルで伸びる）。target: enemy / all / ally / self / none
const SPELLS = {
  fire:     { name: 'ファイア',   type: 'attack', target: 'enemy', mp: 4, desc: '敵1体を炎で攻撃', jobs: ['mage', 'thief'], fx: 'fire' },
  blizzard: { name: 'ブリザード', type: 'attack', target: 'enemy', mp: 5, desc: '敵1体に氷の大ダメージ', jobs: ['mage'], fx: 'ice' },
  thunder:  { name: 'サンダー',   type: 'attack', target: 'all',   mp: 9, desc: '敵全体に雷', jobs: ['mage'], fx: 'thunder' },
  holy:     { name: 'ホーリー',   type: 'attack', target: 'enemy', mp: 5, desc: '聖なる光（不死に2倍）', jobs: ['priest'], fx: 'holy' },
  heal:     { name: 'ヒール',     type: 'heal',   target: 'ally',  mp: 3, desc: '味方1人のHPを回復', jobs: ['priest', 'mage'], fx: 'heal' },
  fullheal: { name: 'フルヒール', type: 'heal',   target: 'ally',  mp: 8, desc: '味方1人のHPを大回復', jobs: ['priest'], fx: 'heal' },
  healall:  { name: 'ヒールオール', type: 'heal', target: 'party', mp: 10, desc: '味方全員のHPを回復', jobs: ['priest'], fx: 'heal' },
  cure:     { name: 'キュア',     type: 'cure',   target: 'ally',  mp: 2, desc: '味方1人の毒を治す', jobs: ['priest', 'mage'], fx: 'heal' },
  revive:   { name: 'リザレク',   type: 'revive', target: 'dead',  mp: 12, desc: '倒れた仲間を復活', jobs: ['priest'], fx: 'holy' },
  protect:  { name: 'プロテクト', type: 'buff',   target: 'ally',  mp: 4, desc: '味方1人の被ダメージ半減', jobs: ['priest'], fx: 'buff' },
  poison:   { name: 'ポイズン',   type: 'debuff', target: 'enemy', mp: 3, desc: '敵1体を毒にする', jobs: ['thief', 'mage'], fx: 'poison' },
  smoke:    { name: 'スモーク',   type: 'escape', target: 'none',  mp: 2, desc: '必ず逃げる（ボス不可）', jobs: ['thief'], fx: 'run' },
  exit:     { name: 'エスケプ',   type: 'exit',   target: 'none',  mp: 6, desc: '洞窟から一瞬で外へ出る（移動中のみ）', jobs: ['mage', 'priest', 'thief'], fx: 'run' },
  guide:    { name: 'ミチビキ',   type: 'guide',  target: 'none',  mp: 3, desc: '出口や階段までの最短の道を照らす（移動中のみ）', jobs: ['mage', 'priest', 'thief'], fx: 'holy' },
  warp:     { name: 'テレポ',     type: 'warp',   target: 'none',  mp: 10, desc: '町か、行ったことのある階へ飛ぶ（移動中のみ）', jobs: ['mage', 'priest'], fx: 'holy' },
};
const MAGIC_SHOP_LIST = [
  { id: 'cure', price: 50 }, { id: 'guide', price: 100 }, { id: 'exit', price: 150 }, { id: 'warp', price: 400 },
  { id: 'poison', price: 120 }, { id: 'smoke', price: 80 }, { id: 'holy', price: 250 },
  { id: 'blizzard', price: 250 }, { id: 'fullheal', price: 400 }, { id: 'revive', price: 500 },
  { id: 'thunder', price: 650 }, { id: 'healall', price: 700 },
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
  hero_sword:    { name: '勇者の剣',     atk: 28, price: 0, sell: 300, jobs: ['warrior'], magicBonus: 0, escapeBonus: 0, legend: true },
  sage_staff:    { name: '賢者の杖',     atk: 9,  price: 0, sell: 300, jobs: ['mage'], magicBonus: 0.7, escapeBonus: 0, legend: true },
  holy_staff:    { name: '聖者の杖',     atk: 14, price: 0, sell: 300, jobs: ['priest'], magicBonus: 0.6, escapeBonus: 0, legend: true },
  wind_blade:    { name: '風魔の小太刀', atk: 22, price: 0, sell: 300, jobs: ['thief'], magicBonus: 0, escapeBonus: 0.3, legend: true },
};
const LEGEND_WEAPON = { warrior: 'hero_sword', mage: 'sage_staff', priest: 'holy_staff', thief: 'wind_blade' };
const WEAPON_SHOP_LIST = ['iron_sword', 'mace', 'magic_staff', 'ninja_blade', 'mithril_sword'];

const ARMORS = {
  leather_armor: { name: '革の鎧',       def: 4,  price: 100,  sell: 50,  jobs: ['warrior', 'mage', 'priest', 'thief'], mpBonus: 0, escapeBonus: 0 },
  magic_robe:    { name: '魔法のローブ', def: 4,  price: 250,  sell: 125, jobs: ['mage', 'priest'], mpBonus: 10, escapeBonus: 0 },
  iron_armor:    { name: '鉄の鎧',       def: 9,  price: 320,  sell: 160, jobs: ['warrior', 'priest'], mpBonus: 0, escapeBonus: 0 },
  shadow_armor:  { name: '影の装束',     def: 9,  price: 450,  sell: 225, jobs: ['thief'], mpBonus: 0, escapeBonus: 0.10 },
  holy_robe:     { name: '聖なるローブ', def: 10, price: 750,  sell: 375, jobs: ['mage', 'priest'], mpBonus: 15, escapeBonus: 0 },
  mithril_armor: { name: 'ミスリル鎧',   def: 17, price: 1000, sell: 500, jobs: ['warrior'], mpBonus: 0, escapeBonus: 0 },
};
const ARMOR_SHOP_LIST = ['leather_armor', 'magic_robe', 'iron_armor', 'shadow_armor', 'holy_robe', 'mithril_armor'];

const ALL_JOBS = ['warrior', 'mage', 'priest', 'thief'];
// 下地の服（必ず何か着ている）
const CLOTHES = {
  cloth:       { name: '布の服',           def: 1, mp: 0, price: 0,   sell: 0,   jobs: ALL_JOBS },
  traveler:    { name: '旅人の服',         def: 2, mp: 0, price: 60,  sell: 30,  jobs: ALL_JOBS },
  onepiece:    { name: 'ワンピース',       def: 2, mp: 3, price: 90,  sell: 45,  jobs: ALL_JOBS },
  dougi:       { name: '武道着',           def: 4, mp: 0, price: 140, sell: 70,  jobs: ['warrior', 'thief'] },
  frill_dress: { name: 'フリルのドレス',   def: 3, mp: 6, price: 220, sell: 110, jobs: ALL_JOBS },
  apron_dress: { name: 'エプロンドレス',   def: 4, mp: 4, price: 300, sell: 150, jobs: ALL_JOBS },
};
const CLOTHES_SHOP_LIST = ['traveler', 'onepiece', 'dougi', 'frill_dress', 'apron_dress'];
// アクセサリー（1つまで）
const ACCESSORIES = {
  ribbon:        { name: '星のリボン',       atk: 0, def: 1, mp: 5,  magic: 0,   escape: 0,    price: 150, sell: 75,  desc: '防+1 MP+5' },
  guard_ring:    { name: '守りの指輪',       atk: 0, def: 4, mp: 0,  magic: 0,   escape: 0,    price: 300, sell: 150, desc: '防+4' },
  power_ring:    { name: '力の指輪',         atk: 4, def: 0, mp: 0,  magic: 0,   escape: 0,    price: 300, sell: 150, desc: '攻+4' },
  wind_boots:    { name: '疾風のブーツ',     atk: 0, def: 1, mp: 0,  magic: 0,   escape: 0.2,  price: 250, sell: 125, desc: '防+1 逃げやすさ+20%' },
  magic_pendant: { name: '魔力のペンダント', atk: 0, def: 0, mp: 15, magic: 0.1, escape: 0,    price: 420, sell: 210, desc: 'MP+15 魔力+10%' },
  red_cape:      { name: '勇者のマント',     atk: 3, def: 3, mp: 0,  magic: 0,   escape: 0,    price: 550, sell: 275, desc: '攻+3 防+3' },
};
const ACC_SHOP_LIST = ['ribbon', 'guard_ring', 'power_ring', 'wind_boots', 'magic_pendant', 'red_cape'];
const SLOTS = { weapon: WEAPONS, clothes: CLOTHES, armor: ARMORS, accessory: ACCESSORIES };
const SLOT_NAMES = { weapon: '武器', clothes: '服', armor: '鎧・ローブ', accessory: 'アクセサリー' };
const BARE = { name: '素手', atk: 0, magicBonus: 0, escapeBonus: 0 };
function slotOf(id) { return Object.keys(SLOTS).find(k => SLOTS[k][id]) || null; }
function gearName(id) { const k = slotOf(id); return k ? SLOTS[k][id].name : '？'; }
function canWear(m, id) { const k = slotOf(id); return !!k && (k === 'accessory' || SLOTS[k][id].jobs.includes(m.job)); }
const weaponOf = m => WEAPONS[m.weapon] || BARE;
const clothesOf = m => CLOTHES[m.clothes] || CLOTHES.cloth;
const armorOf = m => (m.armor && ARMORS[m.armor]) || null;
const accOf = m => (m.accessory && ACCESSORIES[m.accessory]) || null;

const CONSUMABLES = {
  herb:       { name: '薬草',     effect: 'heal',     power: 30,  price: 10,  sell: 5,  desc: 'HPを30回復' },
  super_herb: { name: '上薬草',   effect: 'heal',     power: 70,  price: 35,  sell: 17, desc: 'HPを70回復' },
  mega_herb:  { name: '特薬草',   effect: 'heal',     power: 150, price: 110, sell: 55, desc: 'HPを150回復' },
  ether:      { name: 'エーテル', effect: 'mp',       power: 15,  price: 45,  sell: 22, desc: 'MPを15回復' },
  antidote:   { name: '毒消し草', effect: 'antidote', power: 0,   price: 12,  sell: 6,  desc: '毒を治す' },
  leaf:       { name: '復活の葉', effect: 'revive',   power: 0,   price: 180, sell: 90, desc: '倒れた仲間を復活' },
  holy_water: { name: '聖水',     effect: 'holy',     power: 0,   price: 60,  sell: 30, desc: '不死の敵に大ダメージ' },
  lantern:    { name: '導きの灯', effect: 'guide',    power: 0,   price: 30,  sell: 15, desc: '出口や階段までの最短の道を照らす（移動中のみ）' },
  thread:     { name: '帰還の糸', effect: 'exit',     power: 0,   price: 35,  sell: 17, desc: '洞窟から外へ出る（移動中のみ）' },
  warpstone:  { name: '転移の石', effect: 'warp',     power: 0,   price: 160, sell: 80, desc: '町か、行ったことのある階へ飛ぶ（移動中のみ）' },
};
const ITEM_SHOP_LIST = ['herb', 'super_herb', 'mega_herb', 'ether', 'antidote', 'leaf', 'holy_water', 'lantern', 'thread', 'warpstone'];
const FIELD_SPELL_TYPES = ['heal', 'cure', 'revive', 'exit', 'warp', 'guide'];
const FIELD_ONLY = ['exit', 'warp', 'guide'];

// 敵データ（type は戦闘グラフィックの種類）
const ENEMIES = {
  field: [
    { name: 'スライム',   hp: 8,  atk: 6, def: 1, exp: 6, gold: 3, type: 'slime' },
    { name: 'コウモリ',   hp: 10, atk: 7, def: 1, exp: 8, gold: 4, type: 'bat' },
  ],
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
    party: [],             // [0] が主人公
    gold: 120,
    items: [{ id: 'herb', count: 4 }],
    bag: [],               // しまってある装備（ID の配列）
    pos: { x: 0, y: 0 },
    maps: {},
    currentMap: 'town',
    explored: {},
    flags: { golemDefeated: false, bossDefeated: false, hasTreasure: false, princessRescued: false, legendTaken: false, deepest: 0 },
    stats: { steps: 0, kills: 0 },
    trail: [],             // 隊列（直前の位置）
    guide: null,           // 照らした道 { map, cells:Set, target, label }
    profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
    messages: ['', '', ''],
    inputEnabled: true,
  };
}
const hero = () => game.party[0];
// 設定の性別が女性なら、女性らしい姿で描く
function isFemale(m) {
  if (!m || !game.profiles) return false;
  const key = m.companion || (m === game.party[0] ? 'hero' : null);
  return !!key && !!game.profiles[key] && game.profiles[key].gender === '女性';
}
const alive = () => game.party.filter(m => m.hp > 0);

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
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

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

// =============================
// キャラクター
// =============================
function createMember(name, jobKey, lv, companionId) {
  const job = JOBS[jobKey];
  const m = {
    name, job: jobKey, companion: companionId || null,
    lv: 1, exp: 0, expNext: expNeeded(1),
    hp: job.base.hp, maxHp: job.base.hp,
    mp: job.base.mp, maxMp: job.base.mp,
    baseAtk: job.base.atk, baseDef: job.base.def,
    weapon: job.weapon, clothes: 'cloth', armor: null, accessory: null,
    spells: [...job.spells], poisoned: false,
  };
  while (m.lv < (lv || 1)) levelUpOnce(m);
  m.hp = m.maxHp; m.mp = getMaxMp(m);
  return m;
}
function levelUpOnce(m) {
  m.lv++;
  m.expNext = expNeeded(m.lv);
  const g = JOBS[m.job].growth;
  m.maxHp += g.hp + rand(0, 2);
  m.maxMp += g.mp;
  m.baseAtk += g.atk;
  m.baseDef += g.def;
}
function expNeeded(lv) { return 6 * lv * (lv + 3); }
function getAtk(m) { return m.baseAtk + weaponOf(m).atk + (accOf(m) ? accOf(m).atk : 0); }
function getDef(m) { return m.baseDef + clothesOf(m).def + (armorOf(m) ? armorOf(m).def : 0) + (accOf(m) ? accOf(m).def : 0); }
function getMaxMp(m) { return m.maxMp + clothesOf(m).mp + (armorOf(m) ? armorOf(m).mpBonus : 0) + (accOf(m) ? accOf(m).mp : 0); }
function magicMul(m) { return 1 + weaponOf(m).magicBonus + (accOf(m) ? accOf(m).magic : 0); }
function escapeBonus(m) { return weaponOf(m).escapeBonus + (armorOf(m) ? armorOf(m).escapeBonus : 0) + (accOf(m) ? accOf(m).escape : 0); }

// 見た目（装備・性別）
function lookOf(m) {
  return { job: m.job, weapon: m.weapon, clothes: m.clothes || 'cloth', armor: m.armor, accessory: m.accessory, female: isFemale(m) };
}
function faceOf(m, px) { return Art.heroInline(lookOf(m), px); }
function spriteOf(m) { return Art.heroURL(lookOf(m)); }
function defaultLook(job, female) { return { job, weapon: JOBS[job].weapon, clothes: 'cloth', armor: null, accessory: null, female }; }

// ---------- 装備袋 ----------
function addGear(id) { game.bag.push(id); }
function takeGear(id) { const i = game.bag.indexOf(id); if (i >= 0) game.bag.splice(i, 1); return i >= 0; }
// 装備を付け替える（外した物は袋へ）
// 布の服はいつでも着られる（袋には入れない）
function equip(m, slot, id) {
  if (id && id !== 'cloth' && !takeGear(id)) return false;
  const old = m[slot];
  if (old && old !== 'cloth') addGear(old);
  m[slot] = id || (slot === 'clothes' ? 'cloth' : null);
  m.mp = Math.min(m.mp, getMaxMp(m));
  if (id && m.companion && game.party[0]) addMemoryOf(m, `${game.party[0].name}から${gearName(id)}を渡されて身に付けた`);
  return true;
}

// =============================
// マップ生成
// =============================
function emptyGrid(S, fill) { return Array.from({ length: S }, () => Array(S).fill(fill)); }

// 町の中
function createTownMap() {
  const S = 25;
  const g = Array.from({ length: S }, (_, y) =>
    Array.from({ length: S }, (_, x) => (x === 0 || y === 0 || x === S - 1 || y === S - 1) ? TILE.WALL : TILE.FLOOR));
  const put = (x, y, t) => { g[y][x] = t; };
  for (let i = 1; i < S - 1; i++) {
    if (i % 3 !== 0) { put(i, 1, TILE.TREE); put(1, i, TILE.TREE); put(S - 2, i, TILE.TREE); }
    put(i, S - 2, TILE.TREE);
  }
  put(12, 2, TILE.CASTLE);
  [[10, 2], [14, 2], [10, 3]].forEach(([x, y]) => put(x, y, TILE.TREE));
  put(4, 6, TILE.HOUSE);
  put(8, 6, TILE.INN);
  put(17, 6, TILE.MAGIC_SHOP);
  put(5, 12, TILE.WEAPON_SHOP);
  put(12, 12, TILE.ARMOR_SHOP);
  put(19, 12, TILE.ITEM_SHOP);
  for (let y = 16; y <= 18; y++) for (let x = 16; x <= 20; x++) put(x, y, TILE.WATER);
  [[3, 9], [7, 9], [15, 9], [21, 9], [3, 16], [6, 18], [9, 15], [21, 21], [14, 20], [8, 21]].forEach(([x, y]) => put(x, y, TILE.TREE));
  [[6, 4], [18, 4], [11, 8], [13, 8], [4, 14], [10, 17], [15, 14], [20, 20], [3, 20], [17, 21]].forEach(([x, y]) => put(x, y, TILE.FLOWER));
  // 娯楽：池のほとりの温泉と、屋台通り
  put(15, 17, TILE.ONSEN);
  put(6, 15, TILE.FOOD); put(7, 15, TILE.FOOD);
  // 南の出口
  for (let x = 11; x <= 13; x++) { put(x, S - 2, TILE.TOWN_EXIT); put(x, S - 1, TILE.WALL); }
  return { grid: g, entryX: 12, entryY: 22, homeX: 4, homeY: 7, id: 'town' };
}

// 町の外のフィールド
function createFieldMap() {
  const S = 30;
  const g = emptyGrid(S, TILE.FLOOR);
  const put = (x, y, t) => { if (x >= 0 && y >= 0 && x < S && y < S) g[y][x] = t; };
  const rect = (x1, y1, x2, y2, t) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, t); };
  // 外周の山脈
  for (let i = 0; i < S; i++) { put(i, 0, TILE.MOUNTAIN); put(i, S - 1, TILE.MOUNTAIN); put(0, i, TILE.MOUNTAIN); put(S - 1, i, TILE.MOUNTAIN); }
  [[1, 1], [2, 1], [1, 2], [27, 1], [28, 1], [28, 2], [1, 27], [1, 28], [2, 28], [28, 27]].forEach(([x, y]) => put(x, y, TILE.MOUNTAIN));
  // 森
  rect(9, 2, 12, 4, TILE.FOREST); rect(3, 9, 6, 12, TILE.FOREST); rect(20, 3, 24, 6, TILE.FOREST);
  rect(14, 8, 16, 10, TILE.FOREST); rect(4, 19, 8, 23, TILE.FOREST); rect(21, 18, 24, 20, TILE.FOREST);
  rect(11, 24, 14, 27, TILE.FOREST);
  // 山
  rect(15, 2, 17, 4, TILE.MOUNTAIN); rect(7, 7, 8, 8, TILE.MOUNTAIN); rect(24, 9, 26, 11, TILE.MOUNTAIN);
  // 川と橋
  for (let x = 1; x < S - 1; x++) put(x, 15, TILE.WATER);
  put(1, 14, TILE.WATER); put(28, 16, TILE.WATER);
  put(9, 15, TILE.BRIDGE);
  // 南東の岩山と、その中の洞窟
  rect(18, 17, 18, 28, TILE.MOUNTAIN);
  put(18, 22, TILE.FLOOR);
  rect(23, 23, 27, 23, TILE.MOUNTAIN); rect(27, 23, 27, 27, TILE.MOUNTAIN); rect(23, 27, 27, 27, TILE.MOUNTAIN);
  rect(23, 23, 23, 27, TILE.MOUNTAIN);
  put(23, 25, TILE.FLOOR);
  rect(24, 24, 26, 26, TILE.FLOOR);
  put(25, 25, TILE.CAVE_ICON);
  // 町
  put(5, 5, TILE.TOWN_ICON);
  return { grid: g, townX: 5, townY: 6, caveX: 24, caveY: 25, id: 'field' };
}

function createDungeonMap(id) {
  const S = 25;
  const no = AREAS[id].no;
  const grid = emptyGrid(S, TILE.WALL);
  const stack = [[1, 1]];
  grid[1][1] = TILE.FLOOR;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    let moved = false;
    for (const [dx, dy] of shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]])) {
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
  for (let k = 0; k < 28; k++) {
    const x = rand(1, S - 2), y = rand(1, S - 2);
    if (grid[y][x] !== TILE.WALL) continue;
    const h = grid[y][x - 1] === TILE.FLOOR && grid[y][x + 1] === TILE.FLOOR;
    const v = grid[y - 1][x] === TILE.FLOOR && grid[y + 1][x] === TILE.FLOOR;
    if (h !== v) grid[y][x] = TILE.FLOOR;
  }
  const startX = 1, startY = 1;
  const dist = emptyGrid(S, -1);
  const q = [[startX, startY]];
  dist[startY][startX] = 0;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (grid[ny][nx] === TILE.FLOOR && dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); }
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
    return pool.length ? pick(pool) : farthestFree();
  };
  const maxD = cells[0].d;
  grid[startY][startX] = TILE.STAIR_UP;
  if (no < 5) take(farthestFree(), TILE.STAIR_DOWN);
  else { take(farthestFree(), TILE.BOSS); take(farthestFree(), TILE.TREASURE); take(farthestFree(), TILE.CELL); }
  if (no === 4) take(farthestFree(), TILE.LEGEND_CHEST);
  for (let i = 0; i < (no === 5 ? 2 : 3); i++) take(randomFree(6, maxD - 2), TILE.CHEST);
  take(randomFree(Math.floor(maxD * 0.35), Math.floor(maxD * 0.7)), TILE.SPRING);
  for (let i = 0; i < no + 1; i++) take(randomFree(4, maxD - 1), TILE.TRAP);
  return { grid, startX, startY, id };
}

function initMaps() {
  game.maps = { town: createTownMap(), field: createFieldMap() };
  game.explored = { town: new Set(), field: new Set() };
  for (const id of DUNGEONS) { game.maps[id] = createDungeonMap(id); game.explored[id] = new Set(); }
}

// 町にいる仲間候補（まだパーティにいない人）
function townNpcAt(x, y) {
  if (game.currentMap !== 'town') return null;
  for (const [id, c] of Object.entries(COMPANIONS)) {
    if (c.home[0] === x && c.home[1] === y && !game.party.some(m => m.companion === id)) return id;
  }
  return null;
}

// =============================
// マップ描画
// =============================
let tilePx = 24;
let viewW = CONFIG.VIEW_SIZE, viewH = CONFIG.VIEW_SIZE;
let lastView = { x: 0, y: 0 };

function mapSize() { return game.maps[game.currentMap].grid.length; }

function fitMap() {
  const area = $('map-area');
  if (!area) return;
  const w = area.clientWidth, h = area.clientHeight || w;
  tilePx = clamp(Math.floor(Math.min(w / CONFIG.VIEW_SIZE, h / CONFIG.VIEW_SIZE)), 14, 40);
  viewW = CONFIG.VIEW_SIZE;
  viewH = clamp(Math.floor(h / tilePx), CONFIG.VIEW_SIZE, 25);
  if (viewH % 2 === 0) viewH--;
  document.documentElement.style.setProperty('--tile', tilePx + 'px');
}

function followerList() {
  const list = game.party.slice(1).map(m => ({ sprite: spriteOf(m), dead: m.hp <= 0 }));
  if (game.flags.princessRescued) list.push({ sprite: Art.princessSprite() });
  return list;
}

function renderMap() {
  if (!game.party.length || !game.maps[game.currentMap]) return;
  const { grid } = game.maps[game.currentMap];
  const S = grid.length;
  const p = game.pos;
  const vw = Math.min(viewW, S), vh = Math.min(viewH, S);
  const viewX = clamp(p.x - Math.floor(vw / 2), 0, S - vw);
  const viewY = clamp(p.y - Math.floor(vh / 2), 0, S - vh);
  lastView = { x: viewX, y: viewY };
  const container = $('map-container');
  container.style.gridTemplateColumns = `repeat(${vw}, var(--tile))`;
  const explored = game.explored[game.currentMap];
  const open = game.currentMap === 'town' || game.currentMap === 'field';
  const guideCells = game.guide && game.guide.map === game.currentMap ? game.guide.cells : null;
  const followers = followerList();
  const followAt = {};
  game.trail.slice(0, followers.length).forEach((t, i) => { const k = `${t.x},${t.y}`; if (!followAt[k]) followAt[k] = followers[i]; });
  const frag = document.createDocumentFragment();

  for (let ry = 0; ry < vh; ry++) {
    for (let rx = 0; rx < vw; rx++) {
      const mx = viewX + rx, my = viewY + ry;
      const key = `${mx},${my}`;
      const tile = document.createElement('div');
      tile.className = 'tile';
      const isPlayer = mx === p.x && my === p.y;
      const inSight = open || Math.abs(mx - p.x) + Math.abs(my - p.y) <= CONFIG.FOG_RADIUS;
      if (!inSight && !explored.has(key)) {
        tile.classList.add('fog-hidden');
        frag.appendChild(tile);
        continue;
      }
      const look = Art.cellLayers(game.currentMap, grid[my][mx]);
      const layers = [...look.layers];
      const npc = townNpcAt(mx, my);
      if (npc) { const j = COMPANIONS[npc].job; layers.unshift(Art.heroURL(defaultLook(j, game.profiles[npc].gender === '女性'))); }
      if (!isPlayer && followAt[key]) layers.unshift(followAt[key].sprite);
      if (isPlayer) { const h = hero(); layers.unshift(spriteOf(h)); }
      tile.style.backgroundImage = layers.join(',');
      if (!isPlayer && followAt[key] && followAt[key].dead) tile.classList.add('ghost');
      if (look.label && !isPlayer) {
        const lb = document.createElement('span');
        lb.className = 'tile-label';
        lb.textContent = look.label;
        tile.appendChild(lb);
      }
      if (npc) {
        const mk = document.createElement('span');
        mk.className = 'npc-mark';
        mk.textContent = '！';
        tile.appendChild(mk);
      }
      if (guideCells && guideCells.has(key) && !isPlayer) tile.classList.add('guide');
      if (!inSight) tile.classList.add('fog-explored');
      frag.appendChild(tile);
    }
  }
  container.replaceChildren(frag);
}

// =============================
// ステータス表示（パーティ全員）
// =============================
function barHTML(id, cls) {
  return `<div class="bar ${cls || ''}" id="${id}"><div class="bar-lag"></div><div class="bar-fill"></div></div>`;
}

function buildStatusPanel() {
  const box = $('party-status');
  box.innerHTML = game.party.map((m, i) => `
    <div class="pm-card" id="pm-card-${i}">
      <div class="pm-face" id="pm-face-${i}"></div>
      <div class="pm-info">
        <div class="pm-name"><span id="pm-name-${i}"></span><span class="pm-lv" id="pm-lv-${i}"></span></div>
        <div class="bar-row"><span class="bar-label">HP</span>${barHTML('sp-hp-' + i)}<span class="bar-num" id="sp-hp-${i}-num"></span></div>
        <div class="bar-row"><span class="bar-label">MP</span>${barHTML('sp-mp-' + i, 'mp')}<span class="bar-num" id="sp-mp-${i}-num"></span></div>
        <div class="pm-equip" id="pm-equip-${i}"></div>
      </div>
    </div>`).join('');
  box.dataset.size = game.party.length;
}

function updateStatusPanel() {
  if (!game.party.length) return;
  if ($('party-status').dataset.size !== String(game.party.length) || !$('pm-card-0')) buildStatusPanel();
  game.party.forEach((m, i) => {
    $('pm-name-' + i).textContent = m.name + (m.poisoned ? ' 毒' : '');
    $('pm-lv-' + i).textContent = `${JOBS[m.job].name} LV${m.lv}`;
    setBar('sp-hp-' + i, m.hp, m.maxHp);
    setBar('sp-mp-' + i, m.mp, getMaxMp(m));
    const face = $('pm-face-' + i);
    const look = JSON.stringify(lookOf(m));
    if (face.dataset.look !== look) {
      face.dataset.look = look;
      face.innerHTML = faceOf(m, 40);
      $('pm-equip-' + i).innerHTML = `<span class="eq-w"><b>武</b>${weaponOf(m).name}</span><span class="eq-a"><b>${armorOf(m) ? '鎧' : '服'}</b>${armorOf(m) ? armorOf(m).name : clothesOf(m).name}</span>${accOf(m) ? `<span class="eq-x"><b>飾</b>${accOf(m).name}</span>` : ''}`;
    }
    $('pm-card-' + i).classList.toggle('dead', m.hp <= 0);
  });
  $('st-gold').textContent = `${game.gold} ペリカ`;
  let loc = MAP_NAMES[game.currentMap] || '─';
  if (game.flags.princessRescued) loc += ' ♥姫';
  $('st-location').textContent = loc;
  const itemsEl = $('st-items');
  itemsEl.textContent = game.items.length ? game.items.map(it => `${CONSUMABLES[it.id].name}×${it.count}`).join('　') : 'なし';
}

// HP・MPの青いバー。減った分はしばらく赤く残ってから縮む
function setBar(id, cur, max) {
  const bar = $(id);
  if (!bar) return;
  const fill = bar.querySelector('.bar-fill');
  const lag = bar.querySelector('.bar-lag');
  const r = clamp(max ? cur / max : 0, 0, 1) * 100;
  const prev = fill.dataset.r === undefined ? r : parseFloat(fill.dataset.r);
  fill.dataset.r = r;
  fill.style.width = r + '%';
  if (r < prev) {
    lag.style.transition = 'none';
    lag.style.width = prev + '%';
    void lag.offsetWidth;
    lag.style.transition = 'width 0.5s ease 0.45s';
    lag.style.width = r + '%';
  } else {
    lag.style.transition = 'none';
    lag.style.width = r + '%';
  }
  bar.classList.toggle('low', r <= 25);
  const num = $(id + '-num');
  if (num) num.textContent = `${Math.max(0, cur)}/${max}`;
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
  const p = game.pos;
  const nx = p.x + dx, ny = p.y + dy;
  const { grid } = game.maps[game.currentMap];
  const S = grid.length;
  if (nx < 0 || ny < 0 || nx >= S || ny >= S) return;
  const npc = townNpcAt(nx, ny);
  if (npc) { talkCompanion(npc); return; }
  const cell = grid[ny][nx];
  if (BLOCKING.has(cell)) {
    if (cell === TILE.WATER) addMessage('水があって進めない。');
    return;
  }
  game.trail.unshift({ x: p.x, y: p.y });
  game.trail.length = Math.min(game.trail.length, 4);
  p.x = nx; p.y = ny;
  game.stats.steps++;
  if (game.guide) {
    game.guide.cells.delete(`${nx},${ny}`);
    if (cell === game.guide.target || !game.guide.cells.size) { game.guide = null; }
  }
  markExplored();
  handleTileEvent(cell);
}

function markExplored() {
  const p = game.pos;
  const ex = game.explored[game.currentMap];
  const R = CONFIG.FOG_RADIUS, S = mapSize();
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const ax = p.x + dx, ay = p.y + dy;
    if (ax >= 0 && ay >= 0 && ax < S && ay < S && Math.abs(dx) + Math.abs(dy) <= R) ex.add(`${ax},${ay}`);
  }
}

function setCell(t) { game.maps[game.currentMap].grid[game.pos.y][game.pos.x] = t; }

function handleTileEvent(cell) {
  const area = AREAS[game.currentMap];

  switch (cell) {
    case TILE.HOUSE:
      openDialog('[ 自宅 ]', game.flags.princessRescued
        ? '母「まあ、お姫様！ 早くお城へお連れしなさい」'
        : '母「町には腕の立つ人が何人かいるわ。話しかけて仲間になってもらいなさい。<br>セーブはメニューからできるからね」');
      return;
    case TILE.CASTLE: openCastle(); return;
    case TILE.INN: openInn(); return;
    case TILE.MAGIC_SHOP: openMagicShop(); return;
    case TILE.WEAPON_SHOP: openEquipShop('weapon'); return;
    case TILE.ARMOR_SHOP: openEquipShop('armor'); return;
    case TILE.ITEM_SHOP: openItemShop(); return;
    case TILE.ONSEN: openOnsen(); return;
    case TILE.FOOD: openFood(); return;
    case TILE.TOWN_EXIT:
      changeMap('field', 'fromTown');
      addMessage('町の外に出た。', '#00ff41');
      return;
    case TILE.TOWN_ICON:
      Sound.sfx('door');
      changeMap('town', 'fromField');
      addMessage('町に入った。', '#00ff41');
      return;
    case TILE.CAVE_ICON:
      Sound.sfx('stairs');
      changeMap('dungeon1', 'down');
      addMessage('謎の洞窟に足を踏み入れた…', '#ffaa00');
      return;
    case TILE.STAIR_DOWN:
      if (game.currentMap === 'dungeon3' && !game.flags.golemDefeated) {
        addMessage('階段の前に、巨大な石の門番が立ちはだかった！', '#ff6666');
        startBattle('golem');
        return;
      }
      Sound.sfx('stairs');
      changeMap(DUNGEONS[DUNGEONS.indexOf(game.currentMap) + 1], 'down');
      addMessage(game.currentMap === 'dungeon5' ? 'B5Fへ降りた。竜の唸り声が聞こえる…' : `${MAP_NAMES[game.currentMap]}へ降りた。`,
        game.currentMap === 'dungeon5' ? '#ff6666' : '#ffaa00');
      return;
    case TILE.STAIR_UP: {
      Sound.sfx('stairsUp');
      const i = DUNGEONS.indexOf(game.currentMap);
      if (i === 0) { changeMap('field', 'fromCave'); addMessage('洞窟の外に出た。', '#00ff41'); }
      else { changeMap(DUNGEONS[i - 1], 'up'); addMessage(`${MAP_NAMES[game.currentMap]}へ戻った。`, '#00ff41'); }
      return;
    }
    case TILE.CHEST: openChest(area.no); break;
    case TILE.LEGEND_CHEST: openLegendChest(); break;
    case TILE.SPRING:
      game.party.forEach(m => { if (m.hp > 0) { m.hp = m.maxHp; m.mp = getMaxMp(m); m.poisoned = false; } });
      setCell(TILE.SPRING_DRY);
      Sound.sfx('heal');
      flashScreen('heal');
      addMessage('不思議な泉の水を飲んだ。全員のHP・MPが回復した！', '#66ccff');
      renderAll();
      return;
    case TILE.SPRING_DRY: addMessage('泉はもう枯れている。'); break;
    case TILE.TRAP: triggerTrap(area.no); break;
    case TILE.BOSS:
      if (!game.flags.bossDefeated) {
        addMessage('暗黒竜ヴォルガンが目を覚ました！', '#ff3333');
        startBattle('boss');
        return;
      }
      break;
    case TILE.TREASURE:
      if (!game.flags.bossDefeated) addMessage('竜の魔力に阻まれて、秘宝に近づけない…', '#888');
      else {
        game.flags.hasTreasure = true;
        setCell(TILE.FLOOR);
        Sound.sfx('chest');
        flashScreen('gold');
        addMessage('伝説の秘宝「竜の瞳」を手に入れた！', '#ffd700');
      }
      renderAll();
      return;
    case TILE.CELL:
      if (!game.flags.bossDefeated) addMessage('牢の中に誰かいる…。竜の魔力で扉が開かない。', '#888');
      else {
        game.flags.princessRescued = true;
        setCell(TILE.FLOOR);
        addMemoryAll(`B5Fの牢から姫を救い出した`);
        addMemory('princess', `${hero().name}たちに牢から救い出された`);
        Sound.sfx('door');
        openDialog('[ 姫を救い出した！ ]',
          '姫「助けに来てくださったのですね…！<br>さあ、一緒に城へ帰りましょう」<br><br><span style="color:#0af">姫が一行に加わった。町の城へ連れて帰ろう。</span>');
      }
      renderAll();
      return;
  }

  if (game.screen !== 'game') return;
  if (game.inputEnabled) checkEncounter(cell);
  if (game.screen === 'game') poisonTick();
  renderAll();
}

function poisonTick() {
  for (const m of game.party) {
    if (!m.poisoned || m.hp <= 0) continue;
    if (Math.random() < 0.06) { m.poisoned = false; addMessage(`${m.name}の毒が抜けた。`, '#66ccff'); continue; }
    m.hp = Math.max(1, m.hp - Math.max(1, Math.floor(m.maxHp * 0.04)));
  }
}

function renderAll() { renderMap(); updateStatusPanel(); }

function changeMap(target, how) {
  const prev = game.currentMap;
  game.currentMap = target;
  const m = game.maps[target];
  const p = game.pos;
  if (target === 'town') { p.x = m.entryX; p.y = m.entryY; }
  else if (target === 'field') {
    if (how === 'fromTown') { p.x = m.townX; p.y = m.townY; }
    else { p.x = m.caveX; p.y = m.caveY; }
  } else if (how === 'up') {
    const g = m.grid;
    let found = null;
    for (let y = 0; y < g.length && !found; y++) for (let x = 0; x < g.length; x++) if (g[y][x] === TILE.STAIR_DOWN) { found = { x, y }; break; }
    p.x = found ? found.x : m.startX; p.y = found ? found.y : m.startY;
  } else { p.x = m.startX; p.y = m.startY; }
  game.trail = [];
  game.guide = null;
  const no = DUNGEONS.indexOf(target) + 1;
  if (no > (game.flags.deepest || 0)) {
    game.flags.deepest = no;
    addMemoryAll(`${hero().name}たちと洞窟の${MAP_NAMES[target]}に初めて足を踏み入れた`);
  }
  markExplored();
  playMapBgm();
  renderAll();
  void prev;
}

function playMapBgm() {
  if (game.currentMap === 'town') Sound.bgm('town');
  else Sound.bgm(AREAS[game.currentMap].bgm);
}

function checkEncounter(cell) {
  const a = AREAS[game.currentMap];
  if (!a) return;
  let rate = a.enc;
  if (game.currentMap === 'field') {
    if (cell === TILE.FOREST) rate = 0.10;
    if (cell === TILE.BRIDGE) rate = 0;
  }
  if (Math.random() < rate) startBattle('normal');
}

// ---------- 宝箱・罠 ----------
function openChest(no) {
  setCell(TILE.CHEST_OPEN);
  Sound.sfx('chest');
  if (no >= 2 && Math.random() < 0.12) {
    const acc = pick(['ribbon', 'guard_ring', 'power_ring', 'wind_boots', no >= 4 ? 'magic_pendant' : 'ribbon']);
    addGear(acc);
    addMessage(`宝箱を開けた！ ${ACCESSORIES[acc].name}を手に入れた！（メニューの「そうび」で身に付けよう）`, '#ffd700');
    return;
  }
  if (Math.random() < 0.4) {
    const g = rand(20, 40) * no;
    game.gold += g;
    addMessage(`宝箱を開けた！ ${g}ペリカ手に入れた！`, '#ffd700');
    return;
  }
  const table = no <= 1 ? ['herb', 'herb', 'antidote', 'super_herb']
    : no === 2 ? ['herb', 'super_herb', 'antidote', 'ether', 'leaf']
    : no === 3 ? ['super_herb', 'ether', 'holy_water', 'leaf']
    : ['super_herb', 'mega_herb', 'ether', 'holy_water', 'leaf'];
  const id = pick(table);
  const cnt = id === 'leaf' ? 1 : rand(1, 2);
  if (addItem(id, cnt)) addMessage(`宝箱を開けた！ ${CONSUMABLES[id].name}を${cnt}個手に入れた！`, '#ffd700');
  else { game.gold += 50; addMessage('持ち物がいっぱいだ。代わりに50ペリカ拾った。', '#ffd700'); }
}

function openLegendChest() {
  setCell(TILE.CHEST_OPEN);
  const h = hero();
  const id = LEGEND_WEAPON[h.job];
  if (h.weapon) addGear(h.weapon);
  h.weapon = id;
  game.flags.legendTaken = true;
  addMemoryAll(`${h.name}がB4Fで伝説の武器「${WEAPONS[id].name}」を手に入れた`);
  Sound.sfx('levelup');
  flashScreen('gold');
  openDialog('[ 伝説の武器 ]', `古びた宝箱の中に、<span style="color:#ffd700">${WEAPONS[id].name}</span>が眠っていた！<br>${esc(h.name)}が手に取ると、力がみなぎってくる…<br><br>${esc(h.name)}は${WEAPONS[id].name}を装備した。（攻撃力 +${WEAPONS[id].atk}）<br><small>もとの武器は装備袋にしまった。</small>`);
}

function triggerTrap(no) {
  setCell(TILE.TRAP_SEEN);
  const thief = alive().find(m => m.job === 'thief');
  if (thief) {
    Sound.sfx('select');
    addMessage(`${thief.name}が罠を見破って、難なく解除した。`, '#66ccff');
    return;
  }
  Sound.sfx('trap');
  flashScreen('damage');
  const victim = pick(alive());
  if (Math.random() < 0.4 && !victim.poisoned) {
    victim.poisoned = true;
    addMessage(`毒針の罠だ！ ${victim.name}は毒を受けた！`, '#ff66ff');
  } else {
    alive().forEach(m => { m.hp = Math.max(1, m.hp - (Math.floor(m.maxHp * 0.08) + no * 3)); });
    addMessage('落とし穴の罠だ！ 全員がダメージを受けた！', '#ff6666');
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

function popNumber(text, cls, anchor) {
  const el = typeof anchor === 'string' ? $(anchor) : anchor;
  if (!el) return;
  const s = document.createElement('div');
  s.className = 'pop-num ' + cls;
  s.textContent = text;
  el.appendChild(s);
  setTimeout(() => s.remove(), 900);
}

function shakeEl(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

// ---------- 戦闘エフェクト（魔法が飛ぶ・踏み込み・斬撃） ----------
const Fx = (() => {
  function centerOf(el) {
    const stage = $('battle-stage').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - stage.left + r.width / 2, y: r.top - stage.top + r.height / 2, w: r.width, h: r.height };
  }
  function spawn(cls, x, y) {
    const el = document.createElement('div');
    el.className = cls;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    $('fx-layer').appendChild(el);
    return el;
  }
  const canAnim = () => typeof Element !== 'undefined' && !!Element.prototype.animate;

  // from の絵から to の絵へ弾を飛ばし、当たった時に onHit を呼ぶ（to は配列でも可）
  function projectile(kind, fromEl, toEls, onHit, fromParty) {
    const targets = Array.isArray(toEls) ? toEls : [toEls];
    if (!canAnim() || !fromEl || !targets[0]) { onHit(); return; }
    const a = centerOf(fromEl);
    const sx = a.x + (fromParty ? a.w * 0.35 : -a.w * 0.3);
    const sy = a.y - a.h * 0.1;
    const dur = kind === 'thunder' ? 230 : kind === 'breath' ? 520 : 400;
    let landed = 0;
    targets.forEach((t, ti) => {
      const b = centerOf(t);
      const dx = b.x - sx, dy = b.y - sy;
      const count = kind === 'breath' ? 3 : kind === 'ice' ? 3 : 1;
      let done = false;
      for (let i = 0; i < count; i++) {
        const el = spawn(`proj proj-${kind}`, sx, sy);
        const jitter = count > 1 ? (i - 1) * 9 : 0;
        const arc = kind === 'poison' ? -36 : 0;
        const anim = el.animate([
          { transform: `translate(-50%, -50%) translate(0px, ${jitter}px) scale(0.6)`, opacity: 0.2 },
          { transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${dy * 0.5 + arc + jitter}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(1.1)`, opacity: 1 },
        ], { duration: dur, delay: i * 60 + ti * 50, easing: kind === 'poison' ? 'ease-in' : 'linear', fill: 'forwards' });
        anim.onfinish = () => {
          el.remove();
          if (done) return;
          done = true;
          impact(kind === 'breath' ? 'fire' : kind, t);
          landed++;
          if (landed === targets.length) onHit();
        };
      }
    });
  }
  function impact(kind, el) {
    if (!el) return;
    const c = centerOf(el);
    const e = spawn(`impact impact-${kind}`, c.x, c.y);
    setTimeout(() => e.remove(), 500);
  }
  function lunge(el, toRight) {
    if (!el || !canAnim()) return;
    const d = toRight ? 28 : -28;
    el.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${d}px)`, offset: 0.4 }, { transform: 'translateX(0)' }],
      { duration: 340, easing: 'ease-out' });
  }
  function cast(el) {
    if (!el) return;
    el.classList.remove('casting');
    void el.offsetWidth;
    el.classList.add('casting');
    setTimeout(() => el.classList.remove('casting'), 400);
  }
  function aura(kind, el) {
    if (!el) return;
    const c = centerOf(el);
    const n = kind === 'level' ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const s = spawn(`spark spark-${kind}`, c.x + rand(-c.w / 2.5, c.w / 2.5), c.y + rand(0, c.h / 2.5));
      s.style.animationDelay = (i * 0.06) + 's';
      setTimeout(() => s.remove(), 1100);
    }
    if (kind === 'buff' || kind === 'guard') {
      const ring = spawn(`impact impact-${kind}`, c.x, c.y);
      setTimeout(() => ring.remove(), 600);
    }
  }
  return { projectile, impact, lunge, cast, aura };
})();

// =============================
// カーソル（キーボード選択）
// =============================
let cursor = { context: null, index: 0 };
function getCursorButtons() {
  switch (cursor.context) {
    case 'battle_main': return [...document.querySelectorAll('#battle-main-cmd .battle-btn')].filter(b => !b.disabled);
    case 'battle_sub': return [...document.querySelectorAll('#sub-cmd-list .battle-btn'), $('btn-sub-back')].filter(b => b && !b.disabled);
    case 'shop': return [...document.querySelectorAll('#shop-content .shop-btn, #shop-content .pick-btn'), $('btn-shop-close')].filter(b => b && !b.disabled);
    case 'menu': return [...document.querySelectorAll('#menu-window .btn')].filter(b => b.offsetParent !== null && !b.disabled);
    default: return [];
  }
}
function renderCursor() {
  getCursorButtons().forEach((b, i) => b.classList.toggle('cursor-selected', i === cursor.index));
}
function clearCursorMarks() { document.querySelectorAll('.cursor-selected').forEach(b => b.classList.remove('cursor-selected')); }
function setCursorContext(ctx, index) { clearCursorMarks(); cursor.context = ctx; cursor.index = index || 0; renderCursor(); }
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
// バトル（最大3人 対 最大3体）
// =============================
let battleState = null;
let autoTarget = true;
let autoBattle = false;   // フルオート（全員の行動をおまかせ）

const pmEl = i => $('bf-pm-' + i);
const enEl = i => $('bf-en-' + i);

function makeEnemy(tmpl, scale) {
  const e = JSON.parse(JSON.stringify(tmpl));
  if (scale) { e.hp = Math.round(e.hp * scale); }
  e.maxHp = e.hp;
  e.poisoned = false;
  return e;
}

function startBattle(kind) {
  const n = game.party.length;
  let enemies;
  if (kind === 'boss') enemies = [makeEnemy(ENEMIES.boss, 0.6 + 0.4 * n)];
  else if (kind === 'golem') enemies = [makeEnemy(ENEMIES.golem, 0.6 + 0.4 * n)];
  else {
    const area = AREAS[game.currentMap];
    const pool = ENEMIES[area.pool];
    const maxN = clamp(n + (area.no >= 3 ? 1 : 0), 1, 3);
    const count = area.no === 0 ? rand(1, Math.min(2, maxN)) : rand(1, maxN);
    enemies = Array.from({ length: count }, () => makeEnemy(pick(pool)));
    // 同じ敵が並んだら A・B・C を付ける
    const seen = {};
    enemies.forEach(e => { seen[e.name] = (seen[e.name] || 0) + 1; });
    const idx = {};
    enemies.forEach(e => { if (seen[e.name] > 1) { idx[e.name] = (idx[e.name] || 0) + 1; e.name += 'ABC'[idx[e.name] - 1]; } });
  }
  battleState = {
    kind, boss: kind !== 'normal', enemies,
    actor: 0, round: 0, ended: false, busy: false,
    defending: new Set(), protect: new Set(),
    pending: null,          // 狙いを選んでいる最中の行動
  };
  game.inputEnabled = false;
  const ov = $('battle-overlay');
  ov.classList.remove('hidden');
  ov.dataset.floor = game.currentMap;
  $('battle-window').classList.toggle('boss', battleState.boss);
  $('battle-header').textContent = kind === 'boss' ? `[ ${enemies[0].name} ]`
    : enemies.length > 1 ? `魔物の群れが あらわれた！` : `${enemies[0].name}が あらわれた！`;
  buildBattleStage();
  $('battle-log').replaceChildren();
  Sound.bgm(kind === 'boss' ? 'boss' : kind === 'golem' ? 'midboss' : (AREAS[game.currentMap].battleBgm || 'battle'));
  if (kind === 'boss') addBattleLog('「愚かな人間どもめ…。姫は渡さぬ！」', '#ff6666');
  if (kind === 'golem') addBattleLog('「ココ ヨリ サキ ニハ トオサヌ」', '#ff9966');
  updateTargetToggle();
  updateAutoToggle();
  battleState.actor = -1;
  const thisBattle = battleState;
  setTimeout(() => { if (battleState === thisBattle && !battleState.ended) nextActor(); }, autoBattle ? 450 : 0);
}

function buildBattleStage() {
  const bs = battleState;
  $('bf-party').innerHTML = game.party.map((m, i) => `
    <div class="bf-row" id="bf-pmrow-${i}" data-idx="${i}">
      <div class="bf-sprite" id="bf-pm-${i}">${faceOf(m, 52)}</div>
      <div class="bf-info">
        <div class="bf-name">${esc(m.name)}<span class="bf-tag" id="bf-pmtag-${i}"></span></div>
        <div class="bar-row"><span class="bar-label">HP</span>${barHTML('bh-hp-' + i)}</div>
        <div class="bar-num" id="bh-hp-${i}-num"></div>
        <div class="bar-row"><span class="bar-label">MP</span>${barHTML('bh-mp-' + i, 'mp')}</div>
        <div class="bar-num" id="bh-mp-${i}-num"></div>
      </div>
    </div>`).join('');
  const big = bs.boss;
  $('bf-enemies').innerHTML = bs.enemies.map((e, i) => `
    <div class="bf-row enemy ${big ? 'big' : ''}" id="bf-enrow-${i}" data-idx="${i}">
      <div class="bf-sprite appear" id="bf-en-${i}">${Art.enemySVG(e.type, big ? 120 : bs.enemies.length > 2 ? 52 : 64)}</div>
      <div class="bf-info">
        <div class="bf-name enemy">${esc(e.name)}<span class="bf-tag" id="bf-entag-${i}"></span></div>
        <div class="bar-row"><span class="bar-label">HP</span>${barHTML('be-hp-' + i, 'enemy')}</div>
        <div class="bar-num" id="be-hp-${i}-num"></div>
      </div>
    </div>`).join('');
  $('bf-enemies').dataset.count = bs.enemies.length;
  bs.enemies.forEach((e, i) => $('bf-enrow-' + i).addEventListener('click', () => chooseTarget('enemy', i)));
  game.party.forEach((m, i) => $('bf-pmrow-' + i).addEventListener('click', () => chooseTarget('ally', i)));
  refreshBattle();
}

function refreshBattle() {
  const bs = battleState;
  if (!bs) return;
  game.party.forEach((m, i) => {
    setBar('bh-hp-' + i, m.hp, m.maxHp);
    setBar('bh-mp-' + i, m.mp, getMaxMp(m));
    const tags = [];
    if (m.poisoned) tags.push('毒');
    if (bs.protect.has(i)) tags.push('守');
    if (bs.defending.has(i)) tags.push('防');
    $('bf-pmtag-' + i).textContent = tags.length ? ' ' + tags.join('') : '';
    $('bf-pmrow-' + i).classList.toggle('dead', m.hp <= 0);
    $('bf-pmrow-' + i).classList.toggle('active', i === bs.actor && !bs.busy);
  });
  bs.enemies.forEach((e, i) => {
    setBar('be-hp-' + i, e.hp, e.maxHp);
    $('bf-entag-' + i).textContent = e.poisoned ? ' 毒' : '';
  });
}

function setBusy(b) {
  if (!battleState) return;
  battleState.busy = b;
  $('battle-commands').classList.toggle('busy', b);
  refreshBattle();
}

function aliveEnemies() { return battleState.enemies.map((e, i) => ({ e, i })).filter(o => o.e.hp > 0); }
function aliveMembers() { return game.party.map((m, i) => ({ m, i })).filter(o => o.m.hp > 0); }

// 次に行動する仲間へ。全員終わったら敵の番
function nextActor() {
  const bs = battleState;
  if (!bs || bs.ended) return;
  let i = bs.actor + 1;
  while (i < game.party.length && game.party[i].hp <= 0) i++;
  if (i >= game.party.length) { enemyPhase(); return; }
  bs.actor = i;
  bs.defending.delete(i);
  const m = game.party[i];
  if (autoBattle) {
    setBusy(true);
    $('battle-turn-msg').textContent = `オート：${m.name}の番`;
    refreshBattle();
    setTimeout(() => {
      if (!battleState || battleState.ended || battleState.actor !== i) return;
      if (!autoBattle) { setBusy(false); $('battle-turn-msg').textContent = `${m.name}は どうする？`; showBattleMainCmd(); return; }
      const plan = autoChoose(i);
      runAction(plan.action, plan.target);
    }, 320);
    return;
  }
  setBusy(false);
  $('battle-turn-msg').textContent = `${m.name}は どうする？`;
  showBattleMainCmd();
}

// ---------- フルオートの判断 ----------
function expectedPhys(m, e) { return Math.max(1, getAtk(m) - e.def / 2); }
function expectedSpell(sid, m, e) {
  const lv = m.lv, mul = magicMul(m);
  let d = { fire: 20 + lv * 3, blizzard: 26 + lv * 4, thunder: 28 + lv * 4, holy: 21 + lv * 3 }[sid] * mul;
  if (sid === 'blizzard') d -= e.def / 2;
  if (sid === 'holy' && e.undead) d *= 2;
  if (battleState.boss) d *= 0.65;
  return Math.max(1, d);
}
function canCast(m, sid) { return m.spells.includes(sid) && m.mp >= SPELLS[sid].mp; }
function hasItem(id) { return game.items.some(it => it.id === id); }

function autoChoose(ai) {
  const bs = battleState;
  const m = game.party[ai];
  const members = aliveMembers();
  const dead = game.party.map((x, i) => ({ x, i })).filter(o => o.x.hp <= 0);
  const foes = aliveEnemies();
  const danger = bs.boss ? 0.5 : 0.38;
  const isHealer = m.spells.some(s => SPELLS[s].type === 'heal');
  // MPに余裕があるか（回復役は回復用のMPを残しておく）
  const reserve = isHealer ? 8 : 0;
  const spare = sid => m.mp - SPELLS[sid].mp >= reserve;

  // 1) 倒れた仲間を起こす
  if (dead.length) {
    if (canCast(m, 'revive')) return { action: { type: 'spell', sid: 'revive' }, target: dead[0].i };
    const reviver = members.some(o => o.i !== ai && canCast(o.m, 'revive'));
    if (!reviver && hasItem('leaf') && (bs.boss || members.length === 1)) return { action: { type: 'item', id: 'leaf' }, target: dead[0].i };
  }

  // 2) 危ない仲間を回復する
  const hurt = members.map(o => ({ ...o, r: o.m.hp / o.m.maxHp })).sort((a, b) => a.r - b.r);
  const worst = hurt[0];
  const lowCount = hurt.filter(o => o.r < 0.5).length;
  if (lowCount >= 2 && canCast(m, 'healall')) return { action: { type: 'spell', sid: 'healall' }, target: -1 };
  if (worst && worst.r < danger) {
    const missing = worst.m.maxHp - worst.m.hp;
    if (canCast(m, 'fullheal') && (missing > spellPower('heal', m) * 1.2 || !canCast(m, 'heal'))) return { action: { type: 'spell', sid: 'fullheal' }, target: worst.i };
    if (canCast(m, 'heal')) return { action: { type: 'spell', sid: 'heal' }, target: worst.i };
    // 回復役が他にいて、まだ動いていなければ任せる
    const healerLater = members.some(o => o.i > ai && (canCast(o.m, 'heal') || canCast(o.m, 'fullheal')));
    if (!healerLater || worst.r < 0.2) {
      const herb = ['mega_herb', 'super_herb', 'herb'].find(id => hasItem(id) && (CONSUMABLES[id].power <= missing * 1.5 || id === 'herb'))
        || ['mega_herb', 'super_herb', 'herb'].find(hasItem);
      if (herb) return { action: { type: 'item', id: herb }, target: worst.i };
    }
  }

  // 2.5) 毒の仲間を治す（危ない仲間がいない時）
  const poisoned = members.find(o => o.m.poisoned);
  if (poisoned && canCast(m, 'cure') && (!worst || worst.r >= danger)) return { action: { type: 'spell', sid: 'cure' }, target: poisoned.i };

  // 3) 竜戦では先頭に光の盾
  if (bs.boss && canCast(m, 'protect') && !bs.protect.has(0) && game.party[0].hp > 0 && m.mp >= getMaxMp(m) * 0.5) {
    return { action: { type: 'spell', sid: 'protect' }, target: 0 };
  }

  // 4) 攻撃：一番よく効く手を選ぶ
  if (foes.length >= 2 && canCast(m, 'thunder') && spare('thunder')) return { action: { type: 'spell', sid: 'thunder' }, target: -1 };
  const boss = foes.find(o => o.e.type === 'boss');
  if (boss && !boss.e.poisoned && canCast(m, 'poison')) return { action: { type: 'spell', sid: 'poison' }, target: boss.i };

  let best = null;
  for (const o of foes) {
    const phys = expectedPhys(m, o.e);
    const options = [{ action: { type: 'attack' }, dmg: phys }];
    for (const sid of ['fire', 'blizzard', 'holy']) {
      if (canCast(m, sid) && spare(sid)) options.push({ action: { type: 'spell', sid }, dmg: expectedSpell(sid, m, o.e) });
    }
    if (o.e.undead && hasItem('holy_water') && phys < 40) options.push({ action: { type: 'item', id: 'holy_water' }, dmg: 95 });
    for (const op of options) {
      // MPを使う手は、物理より3割以上強い時だけ
      const worth = op.action.type === 'attack' ? op.dmg : (op.dmg > phys * 1.3 ? op.dmg : 0);
      const kill = worth >= o.e.hp;
      // 倒せる相手を優先し、その中では手強い相手を、倒せなければ弱っている相手を狙う
      const score = (kill ? 10000 + o.e.atk * 10 - (op.action.type === 'attack' ? 0 : 50) : worth * 2 - o.e.hp * 0.2) ;
      if (!best || score > best.score) best = { score, action: op.action, target: o.i };
    }
  }
  return best || { action: { type: 'attack' }, target: foes[0].i };
}

function showBattleMainCmd() {
  const m = game.party[battleState.actor];
  $('battle-main-cmd').classList.remove('hidden');
  $('battle-sub-cmd').classList.add('hidden');
  $('battle-window').classList.remove('targeting');
  battleState.pending = null;
  document.querySelector('[data-cmd="magic"]').disabled = !m || m.spells.length === 0;
  document.querySelector('[data-cmd="item"]').disabled = game.items.length === 0;
  document.querySelector('[data-cmd="run"]').disabled = battleState.boss;
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

function canAct() { return battleState && !battleState.ended && !battleState.busy; }

function onBattleCommand(cmd) {
  if (!canAct()) return;
  Sound.sfx('select');
  if (cmd === 'attack') requestTarget({ type: 'attack' }, 'enemy');
  else if (cmd === 'magic') openMagicSubMenu();
  else if (cmd === 'item') openItemSubMenu();
  else if (cmd === 'defend') doDefend();
  else if (cmd === 'run') doRun();
}

// ---------- 狙いを決める ----------
function autoPick(kind) {
  if (kind === 'enemy') {
    const list = aliveEnemies();
    list.sort((a, b) => a.e.hp - b.e.hp);
    return list[0] ? list[0].i : 0;
  }
  if (kind === 'poisoned') {
    const p = aliveMembers().find(o => o.m.poisoned);
    return p ? p.i : 0;
  }
  if (kind === 'dead') {
    const d = game.party.map((m, i) => ({ m, i })).filter(o => o.m.hp <= 0);
    return d.length ? d[0].i : -1;
  }
  const list = aliveMembers();
  list.sort((a, b) => a.m.hp / a.m.maxHp - b.m.hp / b.m.maxHp);
  return list[0] ? list[0].i : 0;
}

function requestTarget(action, kind) {
  const bs = battleState;
  const choices = kind === 'enemy' ? aliveEnemies().map(o => o.i)
    : kind === 'dead' ? game.party.map((m, i) => i).filter(i => game.party[i].hp <= 0)
    : kind === 'poisoned' ? aliveMembers().filter(o => o.m.poisoned).map(o => o.i)
    : aliveMembers().map(o => o.i);
  if (!choices.length) { addBattleLog('対象がいない！', '#888'); return; }
  if (autoTarget || choices.length === 1) { runAction(action, choices.length === 1 ? choices[0] : autoPick(kind)); return; }
  // 手動：一覧から選ぶ（絵を直接タップしてもよい）
  bs.pending = { action, kind, choices };
  $('battle-main-cmd').classList.add('hidden');
  $('battle-sub-cmd').classList.remove('hidden');
  $('battle-window').classList.add('targeting');
  $('battle-window').dataset.targetKind = kind === 'enemy' ? 'enemy' : 'ally';
  $('sub-cmd-title').textContent = kind === 'enemy' ? 'どの敵を狙う？（絵をタップでも可）' : '誰に使う？';
  const list = $('sub-cmd-list');
  list.replaceChildren();
  choices.forEach(i => {
    const t = kind === 'enemy' ? bs.enemies[i] : game.party[i];
    const b = document.createElement('button');
    b.className = 'battle-btn';
    b.textContent = `${t.name}  HP ${t.hp}/${t.maxHp}`;
    b.addEventListener('click', () => chooseTarget(kind === 'enemy' ? 'enemy' : 'ally', i));
    list.appendChild(b);
  });
  setCursorContext('battle_sub');
}

function chooseTarget(side, i) {
  const bs = battleState;
  if (!bs || !bs.pending || bs.busy) return;
  const wantEnemy = bs.pending.kind === 'enemy';
  if ((side === 'enemy') !== wantEnemy || !bs.pending.choices.includes(i)) return;
  const action = bs.pending.action;
  bs.pending = null;
  $('battle-window').classList.remove('targeting');
  runAction(action, i);
}

function openMagicSubMenu() {
  const m = game.party[battleState.actor];
  $('battle-main-cmd').classList.add('hidden');
  $('battle-sub-cmd').classList.remove('hidden');
  $('sub-cmd-title').textContent = `${m.name}の魔法`;
  const list = $('sub-cmd-list');
  list.replaceChildren();
  for (const sid of m.spells) {
    const sp = SPELLS[sid];
    const b = document.createElement('button');
    b.className = 'battle-btn';
    b.textContent = `${sp.name} (MP${sp.mp}) ${sp.desc}`;
    b.disabled = m.mp < sp.mp || (sp.target === 'dead' && !game.party.some(x => x.hp <= 0)) || FIELD_ONLY.includes(sp.type)
      || (sp.type === 'cure' && !game.party.some(x => x.hp > 0 && x.poisoned));
    b.addEventListener('click', () => {
      if (!canAct()) return;
      if (sp.target === 'enemy') requestTarget({ type: 'spell', sid }, 'enemy');
      else if (sp.type === 'cure') requestTarget({ type: 'spell', sid }, 'poisoned');
      else if (sp.target === 'ally') requestTarget({ type: 'spell', sid }, 'ally');
      else if (sp.target === 'dead') requestTarget({ type: 'spell', sid }, 'dead');
      else runAction({ type: 'spell', sid }, -1);
    });
    list.appendChild(b);
  }
  setCursorContext('battle_sub');
}

function openItemSubMenu() {
  $('battle-main-cmd').classList.add('hidden');
  $('battle-sub-cmd').classList.remove('hidden');
  $('sub-cmd-title').textContent = 'どの道具を使う？';
  const list = $('sub-cmd-list');
  list.replaceChildren();
  for (const it of game.items) {
    const c = CONSUMABLES[it.id];
    const b = document.createElement('button');
    b.className = 'battle-btn';
    b.textContent = `${c.name} ×${it.count}  ${c.desc}`;
    b.disabled = (c.effect === 'revive' && !game.party.some(x => x.hp <= 0)) || FIELD_ONLY.includes(c.effect);
    b.addEventListener('click', () => {
      if (!canAct()) return;
      const kind = c.effect === 'holy' ? 'enemy' : c.effect === 'revive' ? 'dead' : 'ally';
      requestTarget({ type: 'item', id: it.id }, kind);
    });
    list.appendChild(b);
  }
  setCursorContext('battle_sub');
}

function spellPower(sid, m) {
  const lv = m.lv;
  switch (sid) {
    case 'fire': return Math.round((16 + lv * 3 + rand(0, 8)) * magicMul(m));
    case 'blizzard': return Math.round((22 + lv * 4 + rand(0, 8)) * magicMul(m));
    case 'thunder': return Math.round((24 + lv * 4 + rand(0, 8)) * magicMul(m));
    case 'holy': return Math.round((18 + lv * 3 + rand(0, 6)) * magicMul(m));
    case 'heal': return 22 + lv * 4 + rand(0, 6);
    case 'fullheal': return 60 + lv * 8 + rand(0, 10);
    case 'healall': return 18 + lv * 3 + rand(0, 6);
    default: return 0;
  }
}

function physDamage(atk, def) {
  return Math.max(1, Math.round((atk - def / 2) * (0.85 + Math.random() * 0.3)));
}

// 敵にダメージ。全滅したら true
function hurtEnemy(i, dmg, cls, sfx) {
  const e = battleState.enemies[i];
  if (e.hp <= 0) return false;
  e.hp = Math.max(0, e.hp - dmg);
  Sound.sfx(sfx || 'hit');
  shakeEl(enEl(i));
  popNumber(dmg, cls || 'pop-enemy', 'bf-enrow-' + i);
  if (e.hp <= 0) {
    addBattleLog(`${e.name}を倒した！`, '#ffd700');
    const kind = e.name.replace(/[ABC]$/, '');
    game.flags.slain = game.flags.slain || [];
    if (!battleState.boss && !game.flags.slain.includes(kind)) {
      game.flags.slain.push(kind);
      addMemoryAll(`${hero().name}たちと初めて${kind}を倒した`);
    }
    setTimeout(() => { const el = enEl(i); if (el) el.classList.add('dead'); }, 120);
  }
  refreshBattle();
  if (!aliveEnemies().length) { endBattleWin(); return true; }
  return false;
}

function healMember(i, amt) {
  const m = game.party[i];
  const real = Math.min(m.maxHp - m.hp, amt);
  m.hp += real;
  popNumber('+' + real, 'pop-heal', 'bf-pmrow-' + i);
  Fx.aura('heal', pmEl(i));
  return real;
}

function finishAction() {
  refreshBattle();
  updateStatusPanel();
  if (!battleState || battleState.ended) return;
  setBusy(true);
  setTimeout(() => { if (battleState && !battleState.ended) nextActor(); }, 380);
}

// 選んだ行動を実行する
function runAction(action, target) {
  const bs = battleState;
  const ai = bs.actor;
  const m = game.party[ai];
  showBattleMainCmd();
  setBusy(true);
  $('battle-turn-msg').textContent = '';

  if (action.type === 'attack') {
    const e = bs.enemies[target];
    Fx.lunge(pmEl(ai), true);
    setTimeout(() => {
      const crit = Math.random() < 1 / 16;
      let dmg = physDamage(getAtk(m), e.def);
      if (crit) dmg = Math.round(dmg * 1.8);
      Fx.impact(crit ? 'crit' : 'slash', enEl(target));
      if (crit) flashScreen('gold');
      addBattleLog(crit ? `${m.name}の会心の一撃！ ${e.name}に ${dmg}ダメージ！` : `${m.name}の攻撃！ ${e.name}に ${dmg}ダメージ！`, crit ? '#ffd700' : '#fff');
      if (hurtEnemy(target, dmg, crit ? 'pop-crit' : 'pop-enemy', crit ? 'crit' : 'hit')) return;
      finishAction();
    }, 190);
    return;
  }

  if (action.type === 'spell') {
    const sp = SPELLS[action.sid];
    m.mp -= sp.mp;
    refreshBattle();
    addBattleLog(`${m.name}は${sp.name}を唱えた！`, '#aaf');
    Fx.cast(pmEl(ai));
    const after = fn => setTimeout(fn, 170);
    if (sp.type === 'attack') {
      const targets = sp.target === 'all' ? aliveEnemies().map(o => o.i) : [target];
      after(() => {
        Sound.sfx(sp.fx === 'thunder' ? 'thunder' : sp.fx === 'ice' ? 'ice' : sp.fx === 'holy' ? 'holy' : 'fire');
        Fx.projectile(sp.fx, pmEl(ai), targets.map(enEl), () => {
          flashScreen(sp.fx);
          for (const ti of targets) {
            const e = bs.enemies[ti];
            let dmg = spellPower(action.sid, m);
            if (action.sid === 'blizzard') dmg = Math.max(1, dmg - Math.floor(e.def / 2));
            if (action.sid === 'holy' && e.undead) dmg *= 2;
            if (bs.boss) dmg = Math.round(dmg * 0.65);
            addBattleLog(`${e.name}に ${dmg}ダメージ！`, '#aaf');
            if (hurtEnemy(ti, dmg, 'pop-magic', 'hit')) return;
          }
          finishAction();
        }, true);
      });
      return;
    }
    if (sp.type === 'debuff') {
      after(() => {
        Sound.sfx('poison');
        Fx.projectile('poison', pmEl(ai), enEl(target), () => {
          const e = bs.enemies[target];
          if (!e.poisoned && e.type !== 'golem') { e.poisoned = true; addBattleLog(`${e.name}は毒に侵された！`, '#a0f'); }
          else addBattleLog('しかし効かなかった…', '#888');
          finishAction();
        }, true);
      });
      return;
    }
    if (sp.type === 'heal') {
      Sound.sfx('heal');
      if (sp.target === 'party') {
        aliveMembers().forEach(o => healMember(o.i, spellPower(action.sid, m)));
        addBattleLog('全員のHPが回復した！', '#0f0');
      } else {
        const amt = healMember(target, spellPower(action.sid, m));
        addBattleLog(`${game.party[target].name}のHPが${amt}回復した！`, '#0f0');
      }
      finishAction();
      return;
    }
    if (sp.type === 'cure') {
      const t = game.party[target];
      Sound.sfx('heal');
      Fx.aura('heal', pmEl(target));
      addBattleLog(t.poisoned ? `${t.name}の毒が消えた！` : `${t.name}は毒を受けていなかった。`, '#0f0');
      t.poisoned = false;
      finishAction();
      return;
    }
    if (sp.type === 'revive') {
      const t = game.party[target];
      t.hp = Math.ceil(t.maxHp / 2);
      t.poisoned = false;
      Sound.sfx('holy');
      Fx.aura('level', pmEl(target));
      addBattleLog(`${t.name}が生き返った！`, '#ffd');
      addMemoryOf(t, `倒れたところを${m.name}の${sp.name}で蘇らせてもらった`);
      finishAction();
      return;
    }
    if (sp.type === 'buff') {
      bs.protect.add(target);
      Sound.sfx('buff');
      Fx.aura('buff', pmEl(target));
      addBattleLog(`${game.party[target].name}を光の盾が包んだ！`, '#0af');
      finishAction();
      return;
    }
    if (sp.type === 'escape') {
      if (!bs.boss) {
        Sound.sfx('run');
        Fx.aura('smoke', pmEl(ai));
        addBattleLog('煙に紛れて逃げ出した！', '#aaa');
        endBattleEscape();
        return;
      }
      addBattleLog('しかし逃げられない！', '#f66');
      finishAction();
      return;
    }
  }

  if (action.type === 'item') {
    const c = CONSUMABLES[action.id];
    consumeItem(action.id);
    if (c.effect === 'holy') {
      addBattleLog(`${m.name}は聖水を投げつけた！`, '#ffd');
      Fx.projectile('holy', pmEl(ai), enEl(target), () => {
        const e = bs.enemies[target];
        if (e.undead) {
          const dmg = rand(80, 110);
          flashScreen('holy');
          addBattleLog(`${e.name}に ${dmg}の大ダメージ！`, '#ffd');
          if (hurtEnemy(target, dmg, 'pop-magic', 'holy')) return;
        } else addBattleLog('しかし効果がない…', '#888');
        finishAction();
      }, true);
      return;
    }
    addBattleLog(applyItem(action.id, target, true), '#0f0');
    finishAction();
  }
}

function applyItem(id, ti, inBattle) {
  const c = CONSUMABLES[id];
  const t = game.party[ti];
  switch (c.effect) {
    case 'heal': {
      Sound.sfx('heal');
      if (inBattle) return `${c.name}で${t.name}のHPが${healMember(ti, c.power)}回復した！`;
      const amt = Math.min(t.maxHp - t.hp, c.power);
      t.hp += amt;
      return `${c.name}で${t.name}のHPが${amt}回復した！`;
    }
    case 'mp': {
      const amt = Math.min(getMaxMp(t) - t.mp, c.power);
      t.mp += amt;
      Sound.sfx('heal');
      if (inBattle) Fx.aura('mp', pmEl(ti));
      return `${c.name}で${t.name}のMPが${amt}回復した！`;
    }
    case 'antidote':
      t.poisoned = false;
      Sound.sfx('heal');
      if (inBattle) Fx.aura('heal', pmEl(ti));
      return `${t.name}の毒が消えた！`;
    case 'revive':
      t.hp = Math.ceil(t.maxHp / 2);
      t.poisoned = false;
      Sound.sfx('holy');
      addMemoryOf(t, `倒れたところを${c.name}で蘇らせてもらった`);
      if (inBattle) Fx.aura('level', pmEl(ti));
      return `${t.name}が生き返った！`;
    default: return '';
  }
}

function consumeItem(id) {
  const i = game.items.findIndex(x => x.id === id);
  if (i < 0) return;
  game.items[i].count--;
  if (game.items[i].count <= 0) game.items.splice(i, 1);
}

function addItem(id, count = 1) {
  const total = game.items.reduce((s, i) => s + i.count, 0);
  if (total + count > CONFIG.MAX_ITEMS) return false;
  const ex = game.items.find(i => i.id === id);
  if (ex) ex.count += count;
  else game.items.push({ id, count });
  return true;
}

function doDefend() {
  const ai = battleState.actor;
  setBusy(true);
  battleState.defending.add(ai);
  Fx.aura('guard', pmEl(ai));
  addBattleLog(`${game.party[ai].name}は身を守っている。`, '#aaa');
  finishAction();
}

function doRun() {
  if (battleState.boss) { addBattleLog('逃げられない！', '#f66'); return; }
  setBusy(true);
  const m = game.party[battleState.actor];
  const thief = aliveMembers().some(o => o.m.job === 'thief');
  let rate = thief ? CONFIG.ESCAPE_RATE_THIEF : CONFIG.ESCAPE_RATE;
  rate = clamp(rate + escapeBonus(m), 0, 1);
  if (Math.random() < rate) {
    Sound.sfx('run');
    addBattleLog('うまく逃げ出した！', '#aaa');
    endBattleEscape();
  } else {
    addBattleLog('しかし回り込まれた！', '#f66');
    battleState.actor = game.party.length;   // 逃げ損ねたら敵の番
    setTimeout(() => { if (battleState && !battleState.ended) enemyPhase(); }, 500);
  }
}

// ---------- 敵の番 ----------
function enemyPhase() {
  const bs = battleState;
  if (!bs || bs.ended) return;
  setBusy(true);
  $('battle-turn-msg').textContent = '';
  bs.round++;
  const queue = [];
  aliveEnemies().forEach(o => {
    queue.push(o.i);
    // 3人パーティの時、竜は1ターンに2回動く
    if (o.e.type === 'boss' && game.party.length >= 3) queue.push(o.i);
  });
  let k = 0;
  const step = () => {
    if (!battleState || bs.ended) return;
    if (k >= queue.length) {
      bs.defending.clear();
      bs.actor = -1;
      nextActor();
      return;
    }
    const ei = queue[k++];
    const e = bs.enemies[ei];
    if (e.hp <= 0) { step(); return; }
    enemyAct(ei, k - 1, () => setTimeout(step, 420));
  };
  step();
}

function enemyAct(ei, turnIndex, done) {
  const bs = battleState;
  const e = bs.enemies[ei];
  if (e.poisoned) {
    const pd = Math.max(1, Math.floor(e.maxHp * 0.06));
    addBattleLog(`${e.name}は毒で ${pd}ダメージ！`, '#a0f');
    Fx.impact('poison', enEl(ei));
    if (hurtEnemy(ei, pd, 'pop-poison', 'poison')) return;
    if (e.hp <= 0) { done(); return; }
  }
  const targets = aliveMembers();
  if (!targets.length) return;
  // 先頭（主人公）が少し狙われやすい
  const weighted = [];
  targets.forEach(o => { weighted.push(o.i); if (o.i === 0) weighted.push(0); });
  const ti = pick(weighted);

  let mode = 'melee', mult = 1;
  if (e.special === 'breath' && (bs.round % 3 === 0) && turnIndex % 2 === 0) mode = 'breath';
  else if (e.special === 'spell' && Math.random() < 0.35) mode = 'spell';
  else if (e.type === 'golem' && bs.round % 4 === 0) mult = 1.8;

  const hit = (i, base) => {
    const m = game.party[i];
    if (m.hp <= 0) return;
    let dmg = base;
    if (bs.defending.has(i)) dmg = Math.floor(dmg * 0.5);
    if (bs.protect.has(i)) { dmg = Math.floor(dmg * 0.5); bs.protect.delete(i); }
    dmg = Math.max(1, dmg);
    m.hp = Math.max(0, m.hp - dmg);
    addBattleLog(`${m.name}は ${dmg}のダメージ！`, '#f88');
    shakeEl(pmEl(i));
    popNumber(dmg, 'pop-player', 'bf-pmrow-' + i);
    if (e.special === 'poison' && !m.poisoned && m.hp > 0 && Math.random() < 0.3) {
      m.poisoned = true;
      addBattleLog(`${m.name}は毒を受けた！`, '#a0f');
    }
    if (m.hp <= 0) {
      addBattleLog(`${m.name}は倒れた…`, '#ff5555');
      addMemoryOf(m, `${MAP_NAMES[game.currentMap]}で${e.name.replace(/[ABC]$/, '')}にやられて倒れた`);
    }
  };
  const after = () => {
    Sound.sfx('hurt');
    flashScreen('damage');
    refreshBattle();
    updateStatusPanel();
    if (!aliveMembers().length) { endBattleLose(); return; }
    done();
  };

  if (mode === 'breath') {
    addBattleLog('ヴォルガンは灼熱の炎を吐いた！', '#ff4400');
    Sound.sfx('fire');
    const all = aliveMembers().map(o => o.i);
    Fx.projectile('breath', enEl(ei), all.map(pmEl), () => {
      all.forEach(i => hit(i, rand(40, 58)));
      after();
    }, false);
  } else if (mode === 'spell') {
    addBattleLog(`${e.name}は呪文を唱えた！`, '#f8f');
    Fx.cast(enEl(ei));
    setTimeout(() => {
      Sound.sfx('thunder');
      Fx.projectile('dark', enEl(ei), pmEl(ti), () => { hit(ti, Math.round(e.atk * (0.7 + Math.random() * 0.3))); after(); }, false);
    }, 170);
  } else {
    addBattleLog(mult > 1 ? `${e.name}は大きく腕を振り下ろした！` : `${e.name}の攻撃！`, mult > 1 ? '#f96' : '#f88');
    Fx.lunge(enEl(ei), false);
    setTimeout(() => {
      Fx.impact(mult > 1 ? 'crit' : 'claw', pmEl(ti));
      hit(ti, Math.round(physDamage(e.atk, getDef(game.party[ti])) * mult));
      after();
    }, 190);
  }
}

// ---------- 戦闘の終わり ----------
function endBattleWin() {
  const bs = battleState;
  if (bs.ended) return;
  bs.ended = true;
  cursor.context = null;
  clearCursorMarks();
  const totalExp = bs.enemies.reduce((s, e) => s + e.exp, 0);
  const totalGold = bs.enemies.reduce((s, e) => s + e.gold, 0);
  const share = Math.ceil(totalExp * (game.party.length > 1 ? 0.75 : 1));
  game.gold += totalGold;
  game.stats.kills += bs.enemies.length;
  Sound.bgm(null);
  Sound.sfx('win');
  addBattleLog(`魔物をやっつけた！ 経験値${share}　${totalGold}ペリカ`, '#ffd700');
  if (bs.kind === 'golem') { game.flags.golemDefeated = true; addMemoryAll(`${hero().name}たちとB3Fの門番ゴーレムを倒した`); }
  if (bs.kind === 'boss') { game.flags.bossDefeated = true; setCell(TILE.FLOOR); addMemoryAll(`${hero().name}たちと暗黒竜ヴォルガンを討ち倒した`); }
  let leveled = false;
  aliveMembers().forEach(o => {
    o.m.exp += share;
    if (checkLevelUp(o.m)) { leveled = true; Fx.aura('level', pmEl(o.i)); }
  });
  refreshBattle();
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
    } else addMessage(`魔物をやっつけた！ EXP+${share} ${totalGold}P`, '#ffd700');
  }, leveled ? 2100 : 1400);
}

function endBattleEscape() {
  battleState.ended = true;
  cursor.context = null;
  clearCursorMarks();
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
  clearCursorMarks();
  addBattleLog('一行は全滅してしまった…', '#ff3333');
  Sound.bgm(null);
  setTimeout(() => {
    $('battle-overlay').classList.add('hidden');
    battleState = null;
    triggerGameOver();
  }, 1700);
}

function checkLevelUp(m) {
  let up = false;
  while (m.exp >= m.expNext && m.lv < CONFIG.MAX_LV) {
    m.exp -= m.expNext;
    levelUpOnce(m);
    m.hp = m.maxHp;
    m.mp = getMaxMp(m);
    up = true;
    if (m.companion) replaceMemory(m.companion, /^レベル\d+に上がった/, `レベル${m.lv}に上がった。前より強くなった`);
    if (battleState) addBattleLog(`${m.name}はレベル${m.lv}に上がった！`, '#ffd700');
    else addMessage(`${m.name}はレベル${m.lv}に上がった！`, '#ffd700');
  }
  if (up) setTimeout(() => { Sound.sfx('levelup'); flashScreen('gold'); }, 500);
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
  clearCursorMarks();
  $('shop-overlay').classList.add('hidden');
  game.inputEnabled = true;
  renderAll();
  if (game.pendingEnding) { game.pendingEnding = false; triggerEnding(); }
}

function openDialog(title, html) { openShop(title, `<div class="dialog-text">${html}</div>`); }
function goldLine() { return `<div class="shop-gold-info">所持金: ${game.gold} ペリカ</div>`; }

// 誰のための買い物かを選ぶ
let shopWho = 0;
function memberPicker(onPick) {
  if (shopWho >= game.party.length) shopWho = 0;
  const html = `<div class="member-picker">${game.party.map((m, i) =>
    `<button class="pick-btn ${i === shopWho ? 'on' : ''}" data-pick="${i}">${faceOf(m, 28)}<span>${esc(m.name)}</span></button>`).join('')}</div>`;
  return { html, bind: () => document.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { shopWho = parseInt(b.dataset.pick, 10); Sound.sfx('select'); onPick(); })) };
}

function openCastle() {
  const f = game.flags;
  if (f.princessRescued) {
    Sound.sfx('door');
    game.pendingEnding = true;
    openDialog('[ 城 ]', '王「おお…姫！ よくぞ無事で…！」<br>王の目に、涙が光った。');
    return;
  }
  let text = '王「よく来た、旅の者よ。<br>わが娘ミレーユ姫が、暗黒竜ヴォルガンにさらわれてしまった。<br>竜は町の外、南東の岩山にある謎の洞窟、その最深部に棲むという…。<br>町には腕の立つ者もおる。仲間を集め、どうか姫を救い出してくれ！」';
  if (f.bossDefeated) text = '王「竜を倒したと…!? ならば姫は牢の中じゃ！ 早く連れ帰ってくれ！」';
  else if (f.golemDefeated) text = '王「B3Fの門番を倒したか。竜はさらに奥、B5Fじゃ。<br>B4Fのどこかに、伝説の武器が眠っているとも聞く…」';
  else if ((f.deepest || 0) >= 2) text += '<br><br>大臣「魔法屋のエスケプやテレポ、道具屋の帰還の糸や転移の石を使えば、洞窟の行き来が楽になりますぞ」';
  else if (game.party.length < 3) text += `<br><br>大臣「仲間は最大2人まで連れて行けますぞ。（いま ${game.party.length - 1}人）」`;
  openDialog('[ 城 ]', text);
}

// ---------- 仲間 ----------
function talkCompanion(id) {
  const c = COMPANIONS[id];
  const pname = game.profiles[id].name;
  Sound.sfx('select');
  if (game.party.length >= CONFIG.PARTY_MAX) {
    openDialog(`[ ${esc(pname)} ]`, `${c.who.replace(c.name, esc(pname))}${c.hello}<br><br><span style="color:#f99">仲間がいっぱいだ。メニューの「なかま」から誰かを外せば、連れて行ける。</span>`);
    return;
  }
  openShop(`[ ${pname}（${JOBS[c.job].name}） ]`, `
    ${introCard(id, game.profiles[id])}
    <div class="dialog-text">${c.who.replace(c.name, esc(pname))}${c.hello}</div>
    <div class="shop-row-btns">
      <button class="shop-btn" id="btn-recruit">仲間にする</button>
      <button class="shop-btn" id="btn-recruit-no">やめておく</button>
    </div>`);
  $('btn-recruit').addEventListener('click', () => {
    const lv = Math.max(1, hero().lv - 1);
    game.party.push(createMember(pname, c.job, lv, id));
    addMemory(id, `${hero().name}に誘われ、姫を救う旅の仲間になった`);
    Sound.sfx('chest');
    closeShop();
    addMessage(`${pname}が仲間に加わった！`, '#ffd700');
    buildStatusPanel();
    renderAll();
  });
  $('btn-recruit-no').addEventListener('click', closeShop);
}

function openPartyMenu() {
  const inTown = game.currentMap === 'town';
  let rows = '';
  game.party.forEach((m, i) => {
    rows += `<div class="party-detail ${m.hp <= 0 ? 'dead' : ''}">
      <div class="pd-face">${faceOf(m, 48)}</div>
      <div class="pd-info">
        <div><b>${esc(m.name)}</b>　${JOBS[m.job].name} LV${m.lv}${m.hp <= 0 ? '　<span style="color:#f66">倒れている</span>' : ''}</div>
        <div class="dim2">HP ${m.hp}/${m.maxHp}　MP ${m.mp}/${getMaxMp(m)}　攻${getAtk(m)}　防${getDef(m)}</div>
        <div class="dim2">武器:${weaponOf(m).name}　服:${clothesOf(m).name}　鎧:${armorOf(m) ? armorOf(m).name : 'なし'}　飾り:${accOf(m) ? accOf(m).name : 'なし'}</div>
        <div class="dim2">EXP ${m.exp}/${m.expNext}${m.companion ? `　記憶 ${game.profiles[m.companion].memories.length}件` : ''}</div>
        <div class="dim2">魔法: ${m.spells.length ? m.spells.map(s => SPELLS[s].name).join('・') : 'なし'}</div>
      </div>
      <div class="pd-btns">
        <button class="shop-btn" data-equip-who="${i}">装備</button>
        <button class="shop-btn" data-profile="${i === 0 ? 'hero' : m.companion}">設定</button>
        ${i > 0 && inTown ? `<button class="shop-btn" data-dismiss="${i}">外す</button>` : ''}
      </div>
    </div>`;
  });
  if (game.flags.princessRescued) rows += `<div class="party-detail"><div class="pd-face">${Art.princessInline(48)}</div><div class="pd-info"><div><b>${esc(game.profiles.princess.name)}姫</b>　同行中</div></div><div class="pd-btns"><button class="shop-btn" data-profile="princess">設定</button></div></div>`;
  if (!inTown && game.party.length > 1) rows += '<div class="dim">仲間を外すのは町の中でだけできる。</div>';
  if (game.party.length < 3) rows += '<div class="dim">町の人に話しかけると、仲間になってくれる人がいる。</div>';
  openShop('[ なかま ]', rows);
  document.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => openProfileEditor(b.dataset.profile)));
  document.querySelectorAll('[data-equip-who]').forEach(b => b.addEventListener('click', () => { shopWho = parseInt(b.dataset.equipWho, 10); openEquipMenu(); }));
  document.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', () => {
    const m = game.party[parseInt(b.dataset.dismiss, 10)];
    game.party.splice(parseInt(b.dataset.dismiss, 10), 1);
    addMessage(`${m.name}は仲間から外れ、町に戻った。`);
    buildStatusPanel();
    openPartyMenu();
  }));
}

// ---------- キャラ設定の編集 ----------
function openProfileEditor(id) {
  const pr = game.profiles[id];
  const isHero = id === 'hero';
  const member = isHero ? hero() : game.party.find(m => m.companion === id);
  const fixedName = isHero || id === 'princess';
  const name = isHero ? hero().name : pr.name;
  const face = id === 'princess' ? Art.princessInline(40) : faceOf(member, 40);
  openShop(`[ ${name}の設定 ]`, `
    <div class="profile-form">
      <div class="pf-head">${face}<div class="dim2">${isHero ? 'あなた（主人公）の設定です。仲間はこれを知った上で話します。' : 'ここに書いた内容を見て、AIがこの人物として話します。'}</div></div>
      <label>名前<input id="pf-name" maxlength="8" value="${esc(name)}" ${fixedName ? 'disabled' : ''}></label>
      <div class="pf-row">
        <label>性別<select id="pf-gender">${GENDERS.map(g => `<option ${g === pr.gender ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        <label>年齢<input id="pf-age" type="number" min="0" max="999" value="${esc(pr.age)}"></label>
      </div>
      <label>${isHero ? '人柄・自己紹介' : '性格・口調'}<textarea id="pf-personality" maxlength="200" rows="3" placeholder="${isHero ? '例：無口だが情に厚い。元は羊飼い。' : '例：明るく元気。一人称は「ボク」。'}">${esc(pr.personality)}</textarea></label>
      <label>記憶（1行に1つ。冒険の出来事や会話で自動的に増えます／最大${MEMORY_MAX}件）<textarea id="pf-memories" maxlength="3100" rows="8">${esc(pr.memories.join('\n'))}</textarea></label>
      <div class="shop-row-btns">
        <button class="shop-btn" id="pf-save">保存する</button>
        ${isHero ? '' : '<button class="shop-btn" id="pf-reset">初期設定に戻す</button>'}
      </div>
    </div>`);
  $('pf-save').addEventListener('click', () => {
    if (!fixedName) {
      const nn = $('pf-name').value.trim().slice(0, 8);
      if (nn) { pr.name = nn; if (member) member.name = nn; }
    }
    pr.gender = GENDERS.includes($('pf-gender').value) ? $('pf-gender').value : '秘密';
    const age = parseInt($('pf-age').value, 10);
    pr.age = Number.isFinite(age) ? clamp(age, 0, 999) : '';
    pr.personality = $('pf-personality').value.trim().slice(0, 200);
    pr.memories = $('pf-memories').value.split('\n').map(x => x.trim().slice(0, 60)).filter(Boolean).slice(-MEMORY_MAX);
    Sound.sfx('chest');
    addMessage(`${isHero ? hero().name : pr.name}の設定を保存した。`, '#0af');
    buildStatusPanel();
    openPartyMenu();
  });
  $('pf-reset')?.addEventListener('click', () => {
    game.profiles[id] = JSON.parse(JSON.stringify(DEFAULT_PROFILES[id]));
    if (member) member.name = game.profiles[id].name;
    Sound.sfx('select');
    openProfileEditor(id);
  });
}

// ---------- 町の娯楽：温泉・屋台 ----------
function companionsHere() {
  const list = game.party.filter(m => m.companion && m.hp > 0).map(m => m.companion);
  if (game.flags.princessRescued) list.push('princess');
  return list;
}

function openOnsen() {
  const cost = 10 + game.party.length * 10;
  openShop('[ 温泉「竜の湯」 ]', `
    <div class="dialog-text">番台「いらっしゃい！ 池のほとりの名湯、竜の湯だよ。<br>${game.party.length}名様で ${cost} ペリカ。旅の疲れも毒も、すっかり流れるよ」<br><small class="dim2">HP・MPが回復し、毒が消える（倒れた仲間は宿屋で）</small></div>
    ${goldLine()}
    <div class="shop-row-btns">
      <button class="shop-btn" id="btn-onsen-go" ${game.gold < cost ? 'disabled' : ''}>湯に浸かる (${cost}P)</button>
      <button class="shop-btn" id="btn-onsen-no">やめる</button>
    </div>`);
  $('btn-onsen-go')?.addEventListener('click', () => {
    game.gold -= cost;
    game.party.forEach(m => { if (m.hp > 0) { m.hp = m.maxHp; m.mp = getMaxMp(m); m.poisoned = false; } });
    Sound.sfx('heal');
    flashScreen('heal');
    const who = companionsHere();
    addMemoryAll(`${hero().name}たちと町の温泉「竜の湯」に浸かった`);
    Chat.scene('onsen', who, '湯けむりの中、一行は旅の疲れを癒やした。');
  });
  $('btn-onsen-no').addEventListener('click', closeShop);
}

const FOODS = [
  { id: 'kushi', name: '串焼き', price: 15, desc: '全員のHP+40', hp: 40, mp: 0 },
  { id: 'dango', name: '蜂蜜だんご', price: 20, desc: '全員のMP+12', hp: 0, mp: 12 },
  { id: 'dragon', name: '名物ドラゴン焼き', price: 45, desc: '全員のHP+90・MP+10', hp: 90, mp: 10 },
];

function openFood() {
  let rows = '<div class="dialog-text">屋台のおやじ「らっしゃい！ 町の名物、食べてきな！」</div>';
  for (const f of FOODS) {
    const dis = game.gold < f.price;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}"><span class="shop-item-name">${f.name}<small>${f.desc}</small></span>
      <span class="shop-item-price">${f.price}P</span><button class="shop-btn" data-food="${f.id}" ${dis ? 'disabled' : ''}>食べる</button></div>`;
  }
  openShop('[ 屋台通り ]', rows + goldLine());
  document.querySelectorAll('[data-food]').forEach(b => b.addEventListener('click', () => {
    const f = FOODS.find(x => x.id === b.dataset.food);
    game.gold -= f.price;
    game.party.forEach(m => { if (m.hp > 0) { m.hp = Math.min(m.maxHp, m.hp + f.hp); m.mp = Math.min(getMaxMp(m), m.mp + f.mp); } });
    Sound.sfx('coin');
    addMemoryAll(`${hero().name}たちと屋台通りで${f.name}を食べ歩いた`);
    Chat.scene('food', companionsHere(), `一行は屋台で${f.name}をほおばった。`, f.name);
  }));
}

function openInn() {
  const cost = game.party.reduce((s, m) => s + m.lv * 5, 0);
  openShop('[ 宿屋 ]', `
    <div class="dialog-text">宿屋へようこそ！ ${game.party.length}名様で ${cost} ペリカ です。<br><small class="dim2">倒れた仲間も、ひと晩休めば元気になります。</small></div>
    ${goldLine()}
    <div class="shop-row-btns">
      <button class="shop-btn" id="btn-inn-stay" ${game.gold < cost ? 'disabled' : ''}>泊まる (${cost}P)</button>
      <button class="shop-btn" id="btn-inn-cancel">やめる</button>
    </div>`);
  $('btn-inn-stay')?.addEventListener('click', () => {
    game.gold -= cost;
    game.party.forEach(m => { m.hp = m.maxHp; m.mp = getMaxMp(m); m.poisoned = false; });
    Sound.sfx('heal');
    closeShop();
    flashScreen('heal');
    addMessage('ぐっすり眠った。全員のHP・MPが全回復した！', '#00ff41');
    addMemoryAll('町の宿屋に泊まって、皆で体を休めた');
  });
  $('btn-inn-cancel').addEventListener('click', closeShop);
}

function openMagicShop() {
  const picker = memberPicker(openMagicShop);
  const m = game.party[shopWho];
  let rows = picker.html + `<div class="shop-section-title">${esc(m.name)}（${JOBS[m.job].name}）が習える魔法</div>`;
  for (const ent of MAGIC_SHOP_LIST) {
    const sp = SPELLS[ent.id];
    const can = sp.jobs.includes(m.job);
    const owned = m.spells.includes(ent.id);
    const dis = !can || owned || game.gold < ent.price;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}">
      <span class="shop-item-name">${sp.name}<small>${sp.desc}</small></span>
      <span class="shop-item-price">${owned ? '習得済' : !can ? '職業×' : ent.price + 'P'}</span>
      <button class="shop-btn" data-buy-spell="${ent.id}" ${dis ? 'disabled' : ''}>習う</button></div>`;
  }
  openShop('[ 魔法屋 ]', rows + goldLine());
  picker.bind();
  document.querySelectorAll('[data-buy-spell]').forEach(b => b.addEventListener('click', () => {
    const sid = b.dataset.buySpell;
    game.gold -= MAGIC_SHOP_LIST.find(e => e.id === sid).price;
    m.spells.push(sid);
    Sound.sfx('coin');
    addMessage(`${m.name}は${SPELLS[sid].name}を習得した！`, '#aaf');
    openMagicShop();
  }));
}

// 武器屋（weapon）と防具屋（armor：鎧・服・アクセサリー）
let armorTab = 'armor';
function openEquipShop(type) {
  const reopen = () => openEquipShop(type);
  const picker = memberPicker(reopen);
  const m = game.party[shopWho];
  const slot = type === 'weapon' ? 'weapon' : armorTab;
  const catalog = SLOTS[slot];
  const list = { weapon: WEAPON_SHOP_LIST, armor: ARMOR_SHOP_LIST, clothes: CLOTHES_SHOP_LIST, accessory: ACC_SHOP_LIST }[slot];
  const stat = it => slot === 'weapon' ? `攻+${it.atk}${it.magicBonus ? ` 魔力${Math.round(it.magicBonus * 100)}%` : ''}`
    : slot === 'armor' ? `防+${it.def}${it.mpBonus ? ` MP+${it.mpBonus}` : ''}`
    : slot === 'clothes' ? `防+${it.def}${it.mp ? ` MP+${it.mp}` : ''}` : it.desc;
  const cur = m[slot];
  let rows = picker.html;
  if (type === 'armor') {
    rows += `<div class="tab-row">${['armor', 'clothes', 'accessory'].map(t => `<button class="pick-btn ${t === armorTab ? 'on' : ''}" data-tab="${t}">${SLOT_NAMES[t]}</button>`).join('')}</div>`;
  }
  rows += `<div class="shop-section-title">${esc(m.name)}の${SLOT_NAMES[slot]}: ${cur ? catalog[cur].name : 'なし'}</div>`;
  for (const id of list) {
    const it = catalog[id];
    const can = slot === 'accessory' || it.jobs.includes(m.job);
    const dis = !can || game.gold < it.price || id === cur;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}">
      <span class="shop-item-name">${it.name}<small>${stat(it)}${can ? '' : '（装備できない）'}</small></span>
      <span class="shop-item-price">${id === cur ? '装備中' : it.price + 'P'}</span>
      <button class="shop-btn" data-buy-equip="${id}" ${dis ? 'disabled' : ''}>買う</button></div>`;
  }
  // 売る：袋の中の、この店で扱う種類の装備
  const kinds = type === 'weapon' ? ['weapon'] : ['armor', 'clothes', 'accessory'];
  const sellable = game.bag.filter(id => kinds.includes(slotOf(id)));
  rows += '<div class="shop-section-title">売る（装備袋の中の物）</div>';
  if (!sellable.length) rows += '<div class="dim">売れる物がない（身に付けている物は、外してから売れる）</div>';
  [...new Set(sellable)].forEach(id => {
    const it = SLOTS[slotOf(id)][id];
    const n = sellable.filter(x => x === id).length;
    rows += `<div class="shop-item-row"><span class="shop-item-name">${it.name}${n > 1 ? ` ×${n}` : ''}</span><span class="shop-item-price">${it.sell}P</span><button class="shop-btn" data-sell-gear="${id}" ${it.sell ? '' : 'disabled'}>売る</button></div>`;
  });
  openShop(type === 'weapon' ? '[ 武器屋 ]' : '[ 防具屋 ]', rows + goldLine() + '<div class="dim">買った物はすぐ身に付ける。外した物は装備袋に入り、メニューの「そうび」でいつでも付け替えられる。</div>');
  picker.bind();
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { armorTab = b.dataset.tab; Sound.sfx('select'); reopen(); }));
  document.querySelectorAll('[data-buy-equip]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.buyEquip;
    game.gold -= catalog[id].price;
    addGear(id);
    equip(m, slot, id);
    Sound.sfx('coin');
    addMessage(`${m.name}は${catalog[id].name}を身に付けた！`, '#0af');
    reopen();
  }));
  document.querySelectorAll('[data-sell-gear]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.sellGear;
    if (!takeGear(id)) return;
    const it = SLOTS[slotOf(id)][id];
    game.gold += it.sell;
    Sound.sfx('coin');
    addMessage(`${it.name}を売った。+${it.sell}P`, '#ffd700');
    reopen();
  }));
}

// ---------- そうび（付け替え） ----------
function openEquipMenu(slot) {
  if (shopWho >= game.party.length) shopWho = 0;
  const picker = memberPicker(() => openEquipMenu());
  const m = game.party[shopWho];
  const cur = { weapon: weaponOf(m), clothes: clothesOf(m), armor: armorOf(m), accessory: accOf(m) };
  const statLine = x => `攻${getAtk(x)} 防${getDef(x)} MP上限${getMaxMp(x)}`;
  let rows = picker.html + `<div class="equip-head"><div class="eq-face">${faceOf(m, 64)}</div><div><b>${esc(m.name)}</b>（${JOBS[m.job].name}）<div class="dim2">${statLine(m)}</div></div></div>`;
  if (!slot) {
    for (const k of ['weapon', 'clothes', 'armor', 'accessory']) {
      const it = cur[k];
      rows += `<div class="shop-item-row"><span class="shop-item-name"><small>${SLOT_NAMES[k]}</small>${it ? it.name : 'なし'}</span>
        <button class="shop-btn" data-slot="${k}">変える</button></div>`;
    }
    rows += `<div class="dim">装備袋：${game.bag.length ? [...new Set(game.bag)].map(id => `${gearName(id)}${game.bag.filter(x => x === id).length > 1 ? '×' + game.bag.filter(x => x === id).length : ''}`).join('、') : '空っぽ'}</div>`;
    openShop('[ そうび ]', rows);
    picker.bind();
    document.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => openEquipMenu(b.dataset.slot)));
    return;
  }
  // 選んだ部位の候補：袋の中の、その人が身に付けられる物
  const cands = [...new Set(game.bag.filter(id => slotOf(id) === slot && canWear(m, id)))];
  if (slot === 'clothes' && m.clothes !== 'cloth') cands.unshift('cloth');
  rows += `<div class="shop-section-title">${SLOT_NAMES[slot]}を選ぶ（いま：${cur[slot] ? cur[slot].name : 'なし'}）</div>`;
  const preview = id => {
    const t = { ...m, [slot]: id };
    const d = (a, b2) => (a > b2 ? `<span class="up">+${a - b2}</span>` : a < b2 ? `<span class="down">${a - b2}</span>` : '');
    return `攻${getAtk(t)}${d(getAtk(t), getAtk(m))} 防${getDef(t)}${d(getDef(t), getDef(m))} MP${getMaxMp(t)}${d(getMaxMp(t), getMaxMp(m))}`;
  };
  if (!cands.length) rows += '<div class="dim">身に付けられる物が袋にない。店で買うか、宝箱で見つけよう。</div>';
  cands.forEach(id => {
    rows += `<div class="shop-item-row"><span class="shop-item-name">${SLOTS[slot][id].name}<small>${preview(id)}</small></span>
      <button class="shop-btn" data-wear="${id}">付ける</button></div>`;
  });
  if (cur[slot] && slot !== 'clothes') {
    rows += `<div class="shop-item-row"><span class="shop-item-name">外す<small>${preview(null)}</small></span><button class="shop-btn" data-wear="">外す</button></div>`;
  }
  rows += '<div class="shop-row-btns"><button class="shop-btn" id="btn-equip-back">← もどる</button></div>';
  openShop('[ そうび ]', rows);
  picker.bind();
  document.querySelectorAll('[data-wear]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.wear || null;
    if (equip(m, slot, id)) {
      Sound.sfx('select');
      addMessage(id ? `${m.name}は${gearName(id)}を身に付けた。` : `${m.name}は${SLOT_NAMES[slot]}を外した。`, '#0af');
    }
    openEquipMenu();
  }));
  $('btn-equip-back').addEventListener('click', () => openEquipMenu());
}

function openItemShop() {
  let rows = '<div class="shop-section-title">買う（道具は全員で共有）</div>';
  for (const id of ITEM_SHOP_LIST) {
    const c = CONSUMABLES[id];
    const dis = game.gold < c.price;
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}">
      <span class="shop-item-name">${c.name}<small>${c.desc}</small></span>
      <span class="shop-item-price">${c.price}P</span>
      <button class="shop-btn" data-buy-item="${id}" ${dis ? 'disabled' : ''}>買う</button></div>`;
  }
  rows += '<div class="shop-section-title">売る</div>';
  if (!game.items.length) rows += '<div class="dim">売れる道具がない</div>';
  for (const it of game.items) {
    const c = CONSUMABLES[it.id];
    rows += `<div class="shop-item-row"><span class="shop-item-name">${c.name} ×${it.count}</span>
      <span class="shop-item-price">${c.sell}P</span><button class="shop-btn" data-sell-item="${it.id}">売る</button></div>`;
  }
  openShop('[ 道具屋 ]', rows + goldLine());
  document.querySelectorAll('[data-buy-item]').forEach(b => b.addEventListener('click', () => {
    const c = CONSUMABLES[b.dataset.buyItem];
    if (!addItem(b.dataset.buyItem)) { Sound.sfx('error'); addMessage('これ以上持てない！'); return; }
    game.gold -= c.price;
    Sound.sfx('coin');
    addMessage(`${c.name}を買った。`, '#0af');
    openItemShop();
  }));
  document.querySelectorAll('[data-sell-item]').forEach(b => b.addEventListener('click', () => {
    const c = CONSUMABLES[b.dataset.sellItem];
    consumeItem(b.dataset.sellItem);
    game.gold += c.sell;
    Sound.sfx('coin');
    addMessage(`${c.name}を売った。+${c.sell}P`, '#ffd700');
    openItemShop();
  }));
}

// ---------- 最短ルートを照らす ----------
function findTile(ch) {
  const g = game.maps[game.currentMap].grid;
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g.length; x++) if (g[y][x] === ch) return { x, y };
  return null;
}
function knownCell(pos) {
  return pos && game.explored[game.currentMap].has(`${pos.x},${pos.y}`);
}

// いまの場所で照らせる行き先
function guideTargets() {
  const map = game.currentMap;
  const list = [];
  if (map === 'town') list.push({ ch: TILE.TOWN_EXIT, label: '町の出口', ok: true });
  if (map === 'field') {
    list.push({ ch: TILE.TOWN_ICON, label: '町', ok: true });
    list.push({ ch: TILE.CAVE_ICON, label: '洞窟', ok: true });
  }
  if (DUNGEONS.includes(map)) {
    const no = DUNGEONS.indexOf(map) + 1;
    list.push({ ch: TILE.STAIR_UP, label: no === 1 ? '出口（洞窟の外へ）' : '出口（上り階段）', ok: true });
    // 前に来たことがある階（もっと深くまで行った）か、すでに見つけた場所なら照らせる
    const been = (game.flags.deepest || 0) > no;
    const add = (ch, label) => { const pos = findTile(ch); if (pos) list.push({ ch, label, ok: been || knownCell(pos), why: 'まだ見つけていない' }); };
    add(TILE.STAIR_DOWN, '下り階段');
    if (no === 5) {
      if (!game.flags.bossDefeated) add(TILE.BOSS, '竜の間');
      add(TILE.CELL, '姫の牢');
      add(TILE.TREASURE, '秘宝');
    }
    if (no === 4 && !game.flags.legendTaken) {
      const pos = findTile(TILE.LEGEND_CHEST);
      if (pos) list.push({ ch: TILE.LEGEND_CHEST, label: '伝説の宝箱', ok: knownCell(pos), why: 'まだ見つけていない' });
    }
  }
  return list;
}

// 一番近い目的のマスまでの最短経路（歩けるマスだけを通る）
function shortestPath(ch) {
  const g = game.maps[game.currentMap].grid, S = g.length, p = game.pos;
  const prev = new Map();
  const start = `${p.x},${p.y}`;
  const q = [[p.x, p.y]];
  prev.set(start, null);
  while (q.length) {
    const [x, y] = q.shift();
    if (g[y][x] === ch && !(x === p.x && y === p.y)) {
      const path = [];
      let k = `${x},${y}`;
      while (k && k !== start) { path.unshift(k); k = prev.get(k); }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= S || ny >= S || prev.has(k) || BLOCKING.has(g[ny][nx])) continue;
      prev.set(k, `${x},${y}`);
      q.push([nx, ny]);
    }
  }
  return null;
}

function openGuideMenu(title, onGo) {
  const targets = guideTargets();
  if (!targets.length) { openDialog(title, 'ここでは照らせる道がない。'); return; }
  let rows = '<div class="dialog-text">どこへの道を照らしますか？</div><div class="warp-list">';
  rows += targets.map((t, i) => `<button class="shop-btn warp-btn" data-guide="${i}" ${t.ok ? '' : 'disabled'}>${t.label}${t.ok ? '' : `<small>（${t.why}）</small>`}</button>`).join('');
  rows += '</div><div class="dim">一度行ったことのある階なら、下り階段への道も照らせる。</div>';
  openShop(title, rows);
  document.querySelectorAll('[data-guide]').forEach(b => b.addEventListener('click', () => {
    const t = targets[parseInt(b.dataset.guide, 10)];
    const path = shortestPath(t.ch);
    if (!path || !path.length) { openDialog(title, '道が見つからなかった…。'); return; }
    onGo();
    game.guide = { map: game.currentMap, cells: new Set(path), target: t.ch, label: t.label };
    path.forEach(k => game.explored[game.currentMap].add(k));
    closeShop();
    Sound.sfx('holy');
    flashScreen('holy');
    addMessage(`光の道が${t.label}まで続いている。（${path.length}歩）`, '#ffd700');
    renderAll();
  }));
}

// ---------- 洞窟からの脱出・ワープ ----------
function inDungeon() { return DUNGEONS.includes(game.currentMap); }

function doExit() {
  Sound.sfx('stairsUp');
  flashScreen('holy');
  changeMap('field', 'fromCave');
  addMessage('まばゆい光に包まれ、洞窟の外に出た！', '#ffd700');
}

function warpDestinations() {
  const list = [{ id: 'town', label: '町' }];
  for (let i = 1; i <= (game.flags.deepest || 0); i++) list.push({ id: DUNGEONS[i - 1], label: `洞窟 ${MAP_NAMES[DUNGEONS[i - 1]]}` });
  return list.filter(d => d.id !== game.currentMap);
}

// 行き先を選んで飛ぶ。onGo は飛ぶ直前に呼ぶ（MPや道具を減らす）
function openWarpMenu(title, onGo) {
  const dests = warpDestinations();
  let rows = '<div class="dialog-text">どこへ飛びますか？</div><div class="warp-list">';
  rows += dests.map(d => `<button class="shop-btn warp-btn" data-warp="${d.id}">${d.label}</button>`).join('');
  rows += '</div>';
  if ((game.flags.deepest || 0) < 5) rows += '<div class="dim">まだ行っていない階には飛べない。</div>';
  openShop(title, rows);
  document.querySelectorAll('[data-warp]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.warp;
    onGo();
    closeShop();
    Sound.sfx('holy');
    flashScreen('holy');
    if (id === 'town') changeMap('town', 'fromField');
    else changeMap(id, 'down');
    addMessage(`光に包まれ、${id === 'town' ? '町' : MAP_NAMES[id]}へ飛んだ！`, '#ffd700');
  }));
}

// ---------- フィールドで道具・魔法を使う ----------
function targetButtons(attr, filter) {
  return `<div class="member-picker">${game.party.map((m, i) => filter(m)
    ? `<button class="pick-btn" ${attr}="${i}">${faceOf(m, 28)}<span>${esc(m.name)}<small>${m.hp}/${m.maxHp}</small></span></button>` : '').join('')}</div>`;
}

function openFieldItems(selected) {
  if (selected && CONSUMABLES[selected].effect === 'exit') {
    if (!inDungeon()) { openDialog('[ 帰還の糸 ]', '洞窟の中でしか使えない。'); return; }
    consumeItem(selected);
    closeShop();
    doExit();
    return;
  }
  if (selected && CONSUMABLES[selected].effect === 'guide') {
    openGuideMenu('[ 導きの灯 ]', () => consumeItem(selected));
    return;
  }
  if (selected && CONSUMABLES[selected].effect === 'warp') {
    if (!warpDestinations().length) { openDialog('[ 転移の石 ]', '飛べる場所がない。'); return; }
    openWarpMenu('[ 転移の石 ]', () => consumeItem(selected));
    return;
  }
  if (selected) {
    const c = CONSUMABLES[selected];
    const filter = c.effect === 'revive' ? m => m.hp <= 0 : m => m.hp > 0;
    openShop(`[ ${c.name}を誰に使う？ ]`, targetButtons('data-item-to', filter) + '<div class="dim">（とじるで戻る）</div>');
    document.querySelectorAll('[data-item-to]').forEach(b => b.addEventListener('click', () => {
      addMessage(applyItem(selected, parseInt(b.dataset.itemTo, 10), false), '#0f0');
      consumeItem(selected);
      openFieldItems();
    }));
    return;
  }
  const usable = game.items.filter(it => CONSUMABLES[it.id].effect !== 'holy');
  let rows = usable.length ? '' : '<div class="dim">使える道具がない</div>';
  for (const it of usable) {
    const c = CONSUMABLES[it.id];
    rows += `<div class="shop-item-row"><span class="shop-item-name">${c.name} ×${it.count}<small>${c.desc}</small></span>
      <button class="shop-btn" data-use-item="${it.id}">使う</button></div>`;
  }
  openShop('[ どうぐ ]', rows);
  document.querySelectorAll('[data-use-item]').forEach(b => b.addEventListener('click', () => openFieldItems(b.dataset.useItem)));
}

function openFieldMagic(casterIdx, sid) {
  const casters = game.party.map((m, i) => i).filter(i => game.party[i].hp > 0 && game.party[i].spells.some(s => FIELD_SPELL_TYPES.includes(SPELLS[s].type)));
  if (!casters.length) { openDialog('[ まほう ]', 'ここで使える魔法を覚えている仲間がいない。'); return; }
  if (casterIdx === undefined) casterIdx = casters[0];
  const m = game.party[casterIdx];
  if (sid) {
    const sp = SPELLS[sid];
    if (sp.type === 'exit') {
      m.mp -= sp.mp;
      closeShop();
      addMessage(`${m.name}は${sp.name}を唱えた！`, '#aaf');
      doExit();
      return;
    }
    if (sp.type === 'guide') {
      openGuideMenu(`[ ${m.name}の${sp.name} ]`, () => { m.mp -= sp.mp; });
      return;
    }
    if (sp.type === 'warp') {
      openWarpMenu(`[ ${m.name}の${sp.name} ]`, () => { m.mp -= sp.mp; });
      return;
    }
    if (sp.target === 'party') {
      m.mp -= sp.mp;
      alive().forEach(t => { t.hp = Math.min(t.maxHp, t.hp + spellPower(sid, m)); });
      Sound.sfx('heal');
      addMessage(`${m.name}の${sp.name}！ 全員のHPが回復した。`, '#0f0');
      openFieldMagic(casterIdx);
      return;
    }
    const filter = sp.target === 'dead' ? t => t.hp <= 0 : sp.type === 'cure' ? t => t.hp > 0 && t.poisoned : t => t.hp > 0;
    openShop(`[ ${sp.name}を誰に？ ]`, targetButtons('data-cast-to', filter));
    document.querySelectorAll('[data-cast-to]').forEach(b => b.addEventListener('click', () => {
      const t = game.party[parseInt(b.dataset.castTo, 10)];
      m.mp -= sp.mp;
      if (sp.type === 'revive') { t.hp = Math.ceil(t.maxHp / 2); addMessage(`${t.name}が生き返った！`, '#ffd'); Sound.sfx('holy'); addMemoryOf(t, `倒れたところを${m.name}の${sp.name}で蘇らせてもらった`); }
      else if (sp.type === 'cure') { addMessage(t.poisoned ? `${m.name}の${sp.name}！ ${t.name}の毒が消えた。` : `${t.name}は毒を受けていない。`, '#0f0'); t.poisoned = false; Sound.sfx('heal'); }
      else { const amt = Math.min(t.maxHp - t.hp, spellPower(sid, m)); t.hp += amt; Sound.sfx('heal'); addMessage(`${m.name}の${sp.name}！ ${t.name}のHPが${amt}回復。`, '#0f0'); }
      openFieldMagic(casterIdx);
    }));
    return;
  }
  let rows = `<div class="member-picker">${casters.map(i => {
    const c = game.party[i];
    return `<button class="pick-btn ${i === casterIdx ? 'on' : ''}" data-caster="${i}">${faceOf(c, 28)}<span>${esc(c.name)}<small>MP${c.mp}</small></span></button>`;
  }).join('')}</div>`;
  for (const s of m.spells.filter(s => FIELD_SPELL_TYPES.includes(SPELLS[s].type))) {
    const sp = SPELLS[s];
    const dis = m.mp < sp.mp || (sp.type === 'revive' && !game.party.some(t => t.hp <= 0))
      || (sp.type === 'cure' && !game.party.some(t => t.hp > 0 && t.poisoned))
      || (sp.type === 'exit' && !inDungeon()) || (sp.type === 'warp' && !warpDestinations().length)
      || (sp.type === 'guide' && !guideTargets().some(t => t.ok));
    rows += `<div class="shop-item-row ${dis ? 'disabled' : ''}"><span class="shop-item-name">${sp.name}<small>MP${sp.mp} ${sp.desc}</small></span>
      <button class="shop-btn" data-cast="${s}" ${dis ? 'disabled' : ''}>唱える</button></div>`;
  }
  openShop('[ まほう ]', rows);
  document.querySelectorAll('[data-caster]').forEach(b => b.addEventListener('click', () => openFieldMagic(parseInt(b.dataset.caster, 10))));
  document.querySelectorAll('[data-cast]').forEach(b => b.addEventListener('click', () => openFieldMagic(casterIdx, b.dataset.cast)));
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
  const h = hero();
  const data = {
    version: 3,
    savedAt: formatNow(),
    charInfo: { name: h.name, job: h.job, lv: h.lv, location: MAP_NAMES[game.currentMap], party: game.party.length },
    party: game.party, gold: game.gold, items: game.items, bag: game.bag, pos: game.pos,
    currentMap: game.currentMap, maps,
    explored: Object.fromEntries(Object.entries(game.explored).map(([k, v]) => [k, [...v]])),
    flags: game.flags, stats: game.stats, profiles: game.profiles,
  };
  store.setItem(CONFIG.SAVE_SLOT_KEY + slot, JSON.stringify(data));
  Sound.sfx('chest');
  addMessage(`スロット${slot}にセーブした。`, '#00ff41');
}

function loadFromSlot(slot) {
  const raw = store.getItem(CONFIG.SAVE_SLOT_KEY + slot);
  if (!raw) return false;
  try {
    const d = sanitizeSave(JSON.parse(raw));
    const st = newGameState();
    Object.assign(st, { party: d.party, gold: d.gold, items: d.items, bag: d.bag, pos: d.pos, currentMap: d.currentMap });
    st.maps = {};
    for (const [id, m] of Object.entries(d.maps)) st.maps[id] = { ...m, grid: m.grid.map(r => r.split('')) };
    st.explored = Object.fromEntries(Object.entries(d.explored).map(([k, v]) => [k, new Set(v)]));
    st.flags = Object.assign(st.flags, d.flags);
    st.stats = Object.assign(st.stats, d.stats || {});
    st.profiles = d.profiles;
    game = st;
    return true;
  } catch (e) {
    console.error('ロード失敗:', e);
    return false;
  }
}

// 壊れた・書き換えられたセーブデータでも動くよう、中身を点検して直す
function sanitizeSave(d) {
  const num = (v, def, min, max) => (Number.isFinite(v) ? clamp(Math.floor(v), min, max) : def);
  if (!d || d.version !== 3 || !Array.isArray(d.party) || !d.party.length || !d.maps) throw new Error('invalid save');
  d.party = d.party.slice(0, CONFIG.PARTY_MAX).map(m => {
    const job = JOBS[m.job] ? m.job : 'warrior';
    const base = createMember('?', job, 1);
    const r = {
      ...base,
      name: String(m.name || '？').slice(0, 8),
      companion: COMPANIONS[m.companion] ? m.companion : null,
      lv: num(m.lv, 1, 1, CONFIG.MAX_LV),
      exp: num(m.exp, 0, 0, 1e7),
      maxHp: num(m.maxHp, base.maxHp, 1, 9999),
      maxMp: num(m.maxMp, base.maxMp, 0, 9999),
      baseAtk: num(m.baseAtk, base.baseAtk, 0, 999),
      baseDef: num(m.baseDef, base.baseDef, 0, 999),
      weapon: m.weapon === null ? null : (WEAPONS[m.weapon] ? m.weapon : JOBS[job].weapon),
      clothes: CLOTHES[m.clothes] ? m.clothes : 'cloth',
      armor: ARMORS[m.armor] ? m.armor : null,          // 以前の「布の服」は服として扱う
      accessory: ACCESSORIES[m.accessory] ? m.accessory : null,
      spells: Array.isArray(m.spells) ? m.spells.filter(x => SPELLS[x]) : base.spells,
      poisoned: !!m.poisoned,
    };
    r.expNext = expNeeded(r.lv);
    r.hp = num(m.hp, r.maxHp, 0, r.maxHp);
    r.mp = num(m.mp, 0, 0, getMaxMp(r));
    return r;
  });
  d.gold = num(d.gold, 0, 0, 9999999);
  d.bag = Array.isArray(d.bag) ? d.bag.filter(id => typeof id === 'string' && slotOf(id) && id !== 'cloth').slice(0, 200) : [];
  d.items = Array.isArray(d.items) ? d.items.filter(it => it && CONSUMABLES[it.id]).map(it => ({ id: it.id, count: num(it.count, 1, 1, CONFIG.MAX_ITEMS) })) : [];
  const ids = ['town', 'field', ...DUNGEONS];
  for (const id of ids) {
    const m = d.maps[id];
    if (!m || !Array.isArray(m.grid) || !m.grid.length || m.grid.some(r => typeof r !== 'string' || r.length !== m.grid.length)) throw new Error('invalid map');
  }
  if (!ids.includes(d.currentMap)) d.currentMap = 'town';
  const prof = {};
  for (const [id, def] of Object.entries(DEFAULT_PROFILES)) {
    const src = (d.profiles && d.profiles[id]) || {};
    const age = parseInt(src.age, 10);
    prof[id] = {
      ...JSON.parse(JSON.stringify(def)),
      gender: GENDERS.includes(src.gender) ? src.gender : def.gender,
      age: Number.isFinite(age) ? clamp(age, 0, 999) : def.age,
      personality: typeof src.personality === 'string' ? src.personality.slice(0, 200) : def.personality,
      memories: Array.isArray(src.memories) ? src.memories.filter(x => typeof x === 'string').map(x => x.slice(0, 60)).slice(-MEMORY_MAX) : def.memories,
    };
    if (def.name && id !== 'princess' && typeof src.name === 'string' && src.name.trim()) prof[id].name = src.name.trim().slice(0, 8);
  }
  d.profiles = prof;
  d.party.forEach(m => { if (m.companion && prof[m.companion]) m.name = prof[m.companion].name; });
  const S = d.maps[d.currentMap].grid.length;
  d.pos = { x: num(d.pos && d.pos.x, 1, 0, S - 1), y: num(d.pos && d.pos.y, 1, 0, S - 1) };
  return d;
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
  return `<span class="slot-char">スロット${i}: ${esc(ci.name)}（${JOBS[ci.job].name}）LV${ci.lv}${ci.party > 1 ? ` ほか${ci.party - 1}人` : ''}</span>
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
      buildStatusPanel();
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
// 全滅 / エンディング
// =============================
function triggerGameOver() {
  game.inputEnabled = false;
  showScreen('gameover');
  Sound.bgm('gameover');
  $('gameover-msg').innerHTML = '一行は力尽きた…<br><small>王の祈りで、城で目覚めることができる（所持金は半分になる）</small>';
  $('btn-go-load').disabled = !hasSaveData();
}

function reviveAtCastle() {
  addMemoryAll('洞窟で全滅しかけ、城で王の祈りによって目覚めた');
  game.party.forEach(m => { m.hp = m.maxHp; m.mp = getMaxMp(m); m.poisoned = false; });
  game.gold = Math.floor(game.gold / 2);
  game.currentMap = 'town';
  const t = game.maps.town;
  game.pos = { x: 12, y: 3 };
  game.trail = [];
  void t;
  startGameScreen();
  addMessage('王「おお、死んでしまうとは情けない…。もう一度行くがよい」', '#ffd700');
}

function triggerEnding() {
  game.inputEnabled = false;
  const h = hero();
  showScreen('ending');
  Sound.bgm('ending');
  $('ending-art').innerHTML = game.party.map(m => faceOf(m, 64)).join('') + Art.princessInline(64);
  const names = game.party.map(m => esc(m.name)).join('、');
  const treasure = game.flags.hasTreasure
    ? '一行が持ち帰った伝説の秘宝「竜の瞳」は、王国の宝として末永く守られたという。'
    : '…洞窟の奥には、まだ秘宝が眠っているという噂だ。';
  $('ending-msg').innerHTML = `${names}は<br>ミレーユ姫を救い出し、王国の英雄となった！<br><br>${treasure}`;
  $('ending-stats').innerHTML = `${esc(h.name)}（${JOBS[h.job].name}）LV${h.lv}　歩数 ${game.stats.steps}　倒した魔物 ${game.stats.kills}`;
}

// =============================
// 物語（オープニング）
// =============================
const STORY = [
  'ここは山あいの小さな王国。',
  'ある嵐の夜、暗黒竜ヴォルガンが城を襲い、<br>ミレーユ姫をさらっていった。',
  '竜は町の外、南東の岩山にある<br>「謎の洞窟」の最深部に棲むという。',
  '洞窟には、竜が守る伝説の秘宝が<br>眠っているとも伝えられている。',
];

function showStory(name) {
  showScreen('story');
  Sound.bgm('title');
  const box = $('story-text');
  box.replaceChildren();
  const hp = game.profiles.hero;
  const youth = hp.gender === '女性' ? '一人の娘' : hp.gender === '男性' ? '一人の若者' : '一人の旅人';
  const intro = hp.personality ? `<br><small>${esc(hp.personality)}</small>` : '';
  [...STORY, `そして今、${youth}が立ち上がった——<br>その名は、${esc(name)}。${intro}`].forEach((t, i) => {
    const p = document.createElement('p');
    p.innerHTML = t;
    p.style.animationDelay = `${i * 0.9}s`;
    box.appendChild(p);
  });
}

// =============================
// 画面を押して移動
// =============================
const touchMove = { active: false, x: 0, y: 0, timer: null };

function stepTowardTouch() {
  if (!touchMove.active || !game.inputEnabled || game.screen !== 'game' || cursor.context) return;
  const rect = $('map-container').getBoundingClientRect();
  const p = game.pos;
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
  area.addEventListener('pointermove', e => { if (touchMove.active) { touchMove.x = e.clientX; touchMove.y = e.clientY; } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => area.addEventListener(ev, stopT));
  window.addEventListener('blur', stopT);
}

// =============================
// 全画面表示
// =============================
function fsSupported() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
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
function isTouchDevice() { return window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches; }
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

function applyDpadSetting() {
  const hide = store.getItem(CONFIG.DPAD_KEY) === 'off';
  document.body.classList.toggle('no-dpad', hide);
  const b = $('btn-toggle-dpad');
  if (b) b.textContent = hide ? '十字キー：非表示' : '十字キー：表示中';
  if (game.screen === 'game') setTimeout(() => { fitMap(); renderMap(); }, 50);
}

function updateAutoToggle() {
  const b = $('btn-auto-mode');
  if (!b) return;
  b.textContent = autoBattle ? 'オート：ON' : 'オート：OFF';
  b.classList.toggle('on', autoBattle);
}

function setAutoBattle(on) {
  autoBattle = on;
  store.setItem(CONFIG.AUTO_KEY, on ? 'on' : 'off');
  updateAutoToggle();
  Sound.sfx('select');
  // 自分の番で待っている時にONにしたら、すぐ動き出す
  if (on && battleState && !battleState.busy && !battleState.ended && battleState.actor >= 0) {
    battleState.actor--;
    nextActor();
  }
}

function updateTargetToggle() {
  const b = $('btn-target-mode');
  b.textContent = autoTarget ? '狙い：自動' : '狙い：手動';
  b.classList.toggle('manual', !autoTarget);
}

// =============================
// イベント登録
// =============================
function initEvents() {
  const unlockOnce = () => Sound.unlock();
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev =>
    document.addEventListener(ev, unlockOnce, { passive: true }));

  document.addEventListener('keydown', e => {
    // 文字入力欄では、キー操作をそのまま入力に使う
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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
  $('btn-chars-title').addEventListener('click', () => { Sound.sfx('select'); openCharacterList(); });

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
  let heroGender = '男性';
  const drawJobIcons = () => document.querySelectorAll('.job-icon').forEach(el => {
    el.innerHTML = Art.heroInline(defaultLook(el.dataset.job, heroGender === '女性'), 44);
  });
  document.querySelectorAll('[data-gender]').forEach(b => b.addEventListener('click', () => {
    heroGender = b.dataset.gender;
    document.querySelectorAll('[data-gender]').forEach(x => x.classList.toggle('on', x === b));
    Sound.sfx('select');
    drawJobIcons();
  }));
  drawJobIcons();
  $('input-name').addEventListener('input', updateStartButton);
  function updateStartButton() { $('btn-start-game').disabled = !$('input-name').value.trim() || !selectedJob; }

  $('btn-start-game').addEventListener('click', () => {
    const name = $('input-name').value.trim();
    if (!name || !selectedJob) return;
    game = newGameState();
    initMaps();
    game.party = [createMember(name, selectedJob, 1)];
    game.profiles.hero.gender = heroGender;
    const age = parseInt($('input-age').value, 10);
    game.profiles.hero.age = Number.isFinite(age) ? clamp(age, 0, 999) : '';
    game.profiles.hero.personality = $('input-intro').value.trim().slice(0, 200);
    game.currentMap = 'town';
    game.pos = { x: game.maps.town.homeX, y: game.maps.town.homeY };
    markExplored();
    buildStatusPanel();
    showStory(name);
  });

  $('btn-story-go').addEventListener('click', () => {
    if (isTouchDevice()) enterFullscreen();
    startGameScreen();
    addMessage(`${hero().name}の冒険が始まった！ まずは城の王に会おう。`, '#00ff41');
  });

  document.querySelectorAll('.battle-btn[data-cmd]:not([data-cmd="auto"])').forEach(b => b.addEventListener('click', () => onBattleCommand(b.dataset.cmd)));
  $('btn-sub-back').addEventListener('click', () => { if (canAct()) showBattleMainCmd(); });
  $('btn-target-mode').addEventListener('click', () => {
    autoTarget = !autoTarget;
    store.setItem(CONFIG.TARGET_KEY, autoTarget ? 'auto' : 'manual');
    updateTargetToggle();
    Sound.sfx('select');
  });
  $('btn-auto-mode').addEventListener('click', () => setAutoBattle(!autoBattle));
  document.querySelector('[data-cmd="auto"]').addEventListener('click', () => { if (canAct()) setAutoBattle(true); });
  $('btn-shop-close').addEventListener('click', closeShop);

  $('btn-menu').addEventListener('click', toggleMenu);
  $('btn-menu-close').addEventListener('click', toggleMenu);
  $('btn-field-party').addEventListener('click', () => { toggleMenu(); openPartyMenu(); });
  $('btn-field-equip').addEventListener('click', () => { toggleMenu(); openEquipMenu(); });
  $('btn-field-talk').addEventListener('click', () => { toggleMenu(); Chat.openTalkMenu(); });
  $('btn-ai-settings').addEventListener('click', () => { toggleMenu(); Chat.openSettings(false); });
  $('btn-ai-title').addEventListener('click', () => { Sound.sfx('select'); Chat.openSettings(true); });
  $('btn-field-item').addEventListener('click', () => { toggleMenu(); openFieldItems(); });
  $('btn-field-magic').addEventListener('click', () => { toggleMenu(); openFieldMagic(); });
  $('btn-save').addEventListener('click', () => { toggleMenu(); openSaveSlotUI(false); });
  $('btn-save-exit').addEventListener('click', () => { toggleMenu(); openSaveSlotUI(true); });
  $('btn-slot-close').addEventListener('click', () => {
    closeSlotOverlay();
    if (game.screen === 'game') game.inputEnabled = true;
    updateTitleLoadBtn();
  });

  $('btn-go-revive').addEventListener('click', reviveAtCastle);
  $('btn-go-load').addEventListener('click', () => { if (hasSaveData()) openLoadSlotUI(); });
  $('btn-go-title').addEventListener('click', () => { showScreen('title'); Sound.bgm('title'); updateTitleLoadBtn(); });
  $('btn-ending-title').addEventListener('click', () => { showScreen('title'); Sound.bgm('title'); updateTitleLoadBtn(); });

  const applySoundLabel = () => document.querySelectorAll('.btn-sound').forEach(b => { b.textContent = Sound.isMuted() ? '♪ OFF' : '♪ ON'; });
  document.querySelectorAll('.btn-sound').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    Sound.unlock();
    Sound.setMuted(!Sound.isMuted());
    store.setItem(CONFIG.SOUND_KEY, Sound.isMuted() ? '1' : '0');
    applySoundLabel();
  }));
  applySoundLabel();

  const dirs = { 'dpad-up': [0, -1], 'dpad-down': [0, 1], 'dpad-left': [-1, 0], 'dpad-right': [1, 0] };
  let repeat = null;
  const stop = () => { clearInterval(repeat); repeat = null; };
  Object.entries(dirs).forEach(([id, d]) => {
    const b = $(id);
    const go = () => { if (game.screen === 'game' && game.inputEnabled && !cursor.context) tryMove(d[0], d[1]); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); go(); stop(); repeat = setInterval(go, 170); });
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

function toggleMenu() {
  const ov = $('menu-overlay');
  if (ov.classList.contains('hidden')) {
    ov.classList.remove('hidden');
    game.inputEnabled = false;
    $('btn-field-magic').disabled = !game.party.some(m => m.hp > 0 && m.spells.some(s => FIELD_SPELL_TYPES.includes(SPELLS[s].type)));
    setCursorContext('menu');
  } else {
    cursor.context = null;
    clearCursorMarks();
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
  autoTarget = store.getItem(CONFIG.TARGET_KEY) !== 'manual';
  autoBattle = store.getItem(CONFIG.AUTO_KEY) === 'on';
  updateTitleLoadBtn();
  initEvents();
  showScreen('title');
  Sound.bgm('title');
}

init();

// オフライン対応（使えない環境では何もしない）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try { navigator.serviceWorker.register('./service-worker.js').catch(() => {}); } catch (e) {}
  });
  // 新しい版に切り替わったら、タイトル画面にいる時だけ自動で読み直す（遊んでいる途中は邪魔しない）
  let reloaded = false;
  const hadController = !!navigator.serviceWorker.controller;   // 初めて開いた時は読み直さない
  try {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded || !hadController || game.screen !== 'title') return;
      reloaded = true;
      location.reload();
    });
  } catch (e) {}
}
