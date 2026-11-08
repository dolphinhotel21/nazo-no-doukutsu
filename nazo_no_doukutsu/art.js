// =============================
// ドット絵（SVG）生成
// 文字列の1文字 = 1ドット。パレットにない文字は透明。
// =============================
const Art = (() => {
  const cache = {};

  function toSVG(rows, pal) {
    const h = rows.length;
    const w = rows[0].length;
    let rects = '';
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        const ch = rows[y][x];
        const col = pal[ch];
        if (!col) { x++; continue; }
        // 同じ色が横に続く部分は1つの矩形にまとめる
        let run = 1;
        while (x + run < w && rows[y][x + run] === ch) run++;
        rects += `<rect x="${x}" y="${y}" width="${run}" height="1.05" fill="${col}"/>`;
        x += run;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  }

  function url(key, rows, pal) {
    if (!cache[key]) {
      cache[key] = `url("data:image/svg+xml,${encodeURIComponent(toSVG(rows, pal))}")`;
    }
    return cache[key];
  }

  function inlineSVG(rows, pal, px) {
    return toSVG(rows, pal).replace('<svg ', `<svg width="${px}" height="${px}" `);
  }

  // ---------- 階層ごとの色テーマ ----------
  const THEMES = {
    town:     { d: '#3f7d30', e: '#357028', a: '#8a8a8a', b: '#4a4a4a', c: '#6a6a6a' },
    dungeon1: { d: '#2b2119', e: '#3a2d22', a: '#8f6c49', b: '#3a2a1a', c: '#70533a' },
    dungeon2: { d: '#1b2420', e: '#26322b', a: '#607c67', b: '#24322a', c: '#4b6453' },
    dungeon3: { d: '#171b29', e: '#222839', a: '#5b6b98', b: '#212944', c: '#47557c' },
    dungeon4: { d: '#21172a', e: '#2d2137', a: '#7c5b98', b: '#2d2140', c: '#62497a' },
    dungeon5: { d: '#2a1313', e: '#3a1b1b', a: '#9c4b3b', b: '#3a1512', c: '#7b3a2d' },
  };

  const WALL = [
    'aaabaaab',
    'cccbcccb',
    'bbbbbbbb',
    'abaaabaa',
    'cbcccbcc',
    'bbbbbbbb',
    'aaabaaab',
    'cccbcccb',
  ];
  const FLOOR = [
    'dddddddd',
    'ddeddddd',
    'dddddded',
    'dddddddd',
    'dedddddd',
    'ddddeddd',
    'dddddddd',
    'dddedddd',
  ];
  const GRASS = [
    'gggggggg',
    'gghggggg',
    'gggggghg',
    'gggggggg',
    'ghgggggg',
    'gggghggg',
    'gggggggg',
    'ggggggHg',
  ];
  const TREE = [
    '..ffff..',
    '.ffjfff.',
    'ffjffjff',
    'ffffffff',
    '.ffffff.',
    '...tt...',
    '...tt...',
    '........',
  ];
  const WATER = [
    'wwwwwwww',
    'wcwwwwww',
    'wwwwwcww',
    'wwwwwwww',
    'wwcwwwww',
    'wwwwwwcw',
    'wwwwwwww',
    'wcwwwwww',
  ];
  const FLOWER = [
    '........',
    '.r......',
    'rkr...y.',
    '.r...yky',
    '......y.',
    '..p.....',
    '.pkp....',
    '..p.....',
  ];
  const BUILDING = [
    '..RRRR..',
    '.RRRRRR.',
    'RRRRRRRR',
    '.pppppp.',
    '.pwwwwp.',
    '.pwwwwp.',
    '.ppddpp.',
    '.ppddpp.',
  ];
  const CASTLE = [
    'a.a..a.a',
    'aaa.raaa',
    'aaa.raaa',
    'aaaaaaaa',
    'awwwwwwa',
    'awwwwwwa',
    'aaakkaaa',
    'aaakkaaa',
  ];
  const CAVE = [
    '..mmmm..',
    '.mmnmmm.',
    'mmmkkmmm',
    'mmkkkkmm',
    'mkkkkkkm',
    'nkkkkkkm',
    'mkkkkkkn',
    '........',
  ];
  const STAIR_DOWN = [
    'yyyyyyyy',
    'ykkkkkky',
    'ykyyyyky',
    'ykkkkkky',
    'ykkyykky',
    'ykkkkkky',
    'ykkkkkky',
    'yyyyyyyy',
  ];
  const STAIR_UP = [
    '......yy',
    '......yo',
    '....yyyy',
    '....yooo',
    '..yyyyyy',
    '..yooooo',
    'yyyyyyyy',
    'yooooooo',
  ];
  const CHEST = [
    '........',
    '.oooooo.',
    'obbbbbbo',
    'oyyyyyyo',
    'obbyybbo',
    'obbbbbbo',
    '.oooooo.',
    '........',
  ];
  const CHEST_OPEN = [
    '.oooooo.',
    'obbbbbbo',
    'okkkkkko',
    'obbbbbbo',
    'obbyybbo',
    'obbbbbbo',
    '.oooooo.',
    '........',
  ];
  const SPRING = [
    '..gggg..',
    '.gwwwwg.',
    'gwcwwcwg',
    'gwwwwwwg',
    'gwwcwwwg',
    '.gwwwwg.',
    '..gggg..',
    '........',
  ];
  const TRAP = [
    '........',
    '.m...m..',
    '.m...m..',
    'mmm.mmm.',
    '........',
    '...m...m',
    '...m...m',
    '..mmm.mm',
  ];
  const CELL = [
    'aaaaaaaa',
    'akayyaka',
    'akassaka',
    'akappaka',
    'akappaka',
    'akappaka',
    'akakakak',
    'aaaaaaaa',
  ];
  const BOSS = [
    'r......r',
    'rr.rr.rr',
    '.rrrrrr.',
    '.ryrryr.',
    '.rrrrrr.',
    '..rwwr..',
    '..rrrr..',
    '.r.rr.r.',
  ];
  const TREASURE = [
    '...yy...',
    '..ywwy..',
    '.yyyyyy.',
    'yybyybyy',
    '.yyyyyy.',
    '..yyyy..',
    '...yy...',
    '........',
  ];

  const MOUNTAIN = [
    '...ww...',
    '..wwab..',
    '..aabb..',
    '.aaabbb.',
    '.abaabb.',
    'aaaaabbb',
    'aaaabbbb',
    '........',
  ];
  const FOREST = [
    '.ff...ff',
    'fjff.fjf',
    'ffff.fff',
    '.tt...t.',
    '...ff...',
    '..fjff..',
    '..ffff..',
    '...tt...',
  ];
  const TOWN_ICON = [
    '.rr..bb.',
    'rrrrbbbb',
    '.ww..ww.',
    '.wd..wd.',
    '........',
    '..rrrr..',
    '.rrrrrr.',
    '..wwdw..',
  ];
  const BRIDGE = [
    'pppppppp',
    'oooooooo',
    'pppppppp',
    'oooooooo',
    'pppppppp',
    'oooooooo',
    'pppppppp',
    'oooooooo',
  ];
  const PATH = [
    'dddddddd',
    'ddeddddd',
    'dddddded',
    'dddddddd',
    'dedddddd',
    'ddddeddd',
    'dddddddd',
    'dddeddde',
  ];

  const PLAYER = [
    '..hhhh..',
    '.hhhhhh.',
    '..ssss..',
    '..sese..',
    '.bbbbbb.',
    's.bbbb.s',
    '..bbbb..',
    '..l..l..',
  ];
  const PRINCESS = [
    '...yy...',
    '..kyyk..',
    '..ssss..',
    '..sese..',
    '..pppp..',
    '.pppppp.',
    '.pppppp.',
    'pppppppp',
  ];

  const JOB_COLORS = {
    warrior: { h: '#9a9aa8', b: '#c0281a', l: '#6a1408' },
    mage:    { h: '#2a2a7a', b: '#2244cc', l: '#14226a' },
    priest:  { h: '#e8e8e8', b: '#d8d8d8', l: '#8a8a8a' },
    thief:   { h: '#3a2a1a', b: '#2a7a2a', l: '#143814' },
  };

  function themeOf(mapId) { return THEMES[mapId] || THEMES.dungeon1; }

  function floorTile(mapId) {
    if (mapId === 'town' || mapId === 'field') return url('grass', GRASS, { g: '#3f7d30', h: '#346b28', H: '#4f9440' });
    const t = themeOf(mapId);
    return url('floor-' + mapId, FLOOR, { d: t.d, e: t.e });
  }

  function wallTile(mapId) {
    const t = themeOf(mapId);
    return url('wall-' + mapId, WALL, { a: t.a, b: t.b, c: t.c });
  }

  const ROOF = { H: '#b83a2a', I: '#2a6ab8', M: '#7a3ab8', W: '#7a7a7a', A: '#2a8a6a', T: '#c08a2a' };
  const LABEL = { H: '家', I: '宿', M: '魔', W: '武', A: '防', T: '道', K: '城', D: '洞' };

  // セルの見た目：{ layers: [上から順の背景], label }
  function cellLayers(mapId, cell) {
    const fl = floorTile(mapId);
    switch (cell) {
      case '#': return { layers: [wallTile(mapId)] };
      case 'Y': return { layers: [url('tree', TREE, { f: '#1e5a1e', j: '#2e7a2e', t: '#6a4a2a' }), fl] };
      case '~': return { layers: [url('water', WATER, { w: '#2a5aa8', c: '#5a8ad8' })] };
      case '*': return { layers: [url('flower', FLOWER, { r: '#e04a6a', y: '#f0d040', p: '#9a6ae0', k: '#fff' }), fl] };
      case 'H': case 'I': case 'M': case 'W': case 'A': case 'T':
        return {
          layers: [url('bld-' + cell, BUILDING, { R: ROOF[cell], p: '#e8d8b0', w: '#fff8e0', d: '#6a4422' }), fl],
          label: LABEL[cell],
        };
      case 'K': return { layers: [url('castle', CASTLE, { a: '#b0b0b8', r: '#e03030', w: '#d8d8e0', k: '#3a2a1a' }), fl], label: LABEL.K };
      case 'D': return { layers: [url('cave', CAVE, { m: '#7a6a5a', n: '#5a4a3a', k: '#0a0806' }), fl], label: LABEL.D };
      case '>': return { layers: [url('down', STAIR_DOWN, { y: '#d8b040', k: '#050505' })] };
      case '<': return { layers: [url('up', STAIR_UP, { y: '#e8d070', o: '#8a7030' }), fl] };
      case 'C': case 'L': return { layers: [url('chest-' + cell, CHEST, { o: '#1a0e04', b: cell === 'L' ? '#5a2a8a' : '#8a5a22', y: '#f0c840' }), fl] };
      case 'c': return { layers: [url('chest-open', CHEST_OPEN, { o: '#1a0e04', b: '#6a4a22', y: '#a08838', k: '#050505' }), fl] };
      case 'F': return { layers: [url('spring', SPRING, { g: '#8a8a9a', w: '#2a7ad8', c: '#9ad8ff' }), fl] };
      case 'f': return { layers: [url('spring-dry', SPRING, { g: '#6a6a7a', w: '#2a2a30', c: '#3a3a40' }), fl] };
      case 'x': return { layers: [url('trap', TRAP, { m: '#9a9aa8' }), fl] };
      case 'P': return { layers: [url('cell', CELL, { a: '#8a8a98', k: '#0a0a10', y: '#f0d040', s: '#f0c8a0', p: '#f070b0' }), fl] };
      case 'n': return { layers: [url('mountain', MOUNTAIN, { a: '#8a7a5a', b: '#5e4e38', w: '#f0f0f0' }), fl] };
      case 'q': return { layers: [url('forest', FOREST, { f: '#1e5a1e', j: '#2e7a2e', t: '#5a3a1a' }), url('grass-dark', GRASS, { g: '#2f6a24', h: '#285a1e', H: '#3a7a2e' })] };
      case 'O': return { layers: [url('townicon', TOWN_ICON, { r: '#c03a2a', b: '#2a5ab8', w: '#f0e0c0', d: '#5a3a1a' }), fl], label: '町' };
      case 'V': return { layers: [url('cave', CAVE, { m: '#7a6a5a', n: '#5a4a3a', k: '#0a0806' }), fl], label: '洞' };
      case '=': return { layers: [url('bridge', BRIDGE, { p: '#a0703a', o: '#6a4422' })] };
      case 'E': return { layers: [url('path', PATH, { d: '#b8995a', e: '#9a7a40' })], label: '出' };
      case 'B': return { layers: [url('boss', BOSS, { r: '#d02a1a', y: '#ffd800', w: '#ffffff' }), fl] };
      case '$': return { layers: [url('treasure', TREASURE, { y: '#ffd700', w: '#ffffff', b: '#e03030' }), fl] };
      default:  return { layers: [fl] }; // 床・隠れた罠など
    }
  }

  function playerSprite(job) {
    const c = JOB_COLORS[job] || JOB_COLORS.warrior;
    return url('player-' + job, PLAYER, { h: c.h, b: c.b, l: c.l, s: '#e8a878', e: '#101010' });
  }

  function princessSprite() {
    return url('princess', PRINCESS, { y: '#ffd800', k: '#f0d878', s: '#f0c8a0', e: '#101010', p: '#f070b0' });
  }

  function playerInline(job, px) {
    const c = JOB_COLORS[job] || JOB_COLORS.warrior;
    return inlineSVG(PLAYER, { h: c.h, b: c.b, l: c.l, s: '#e8a878', e: '#101010' }, px);
  }

  function princessInline(px) {
    return inlineSVG(PRINCESS, { y: '#ffd800', k: '#f0d878', s: '#f0c8a0', e: '#101010', p: '#f070b0' }, px);
  }

  // ---------- 敵（戦闘画面用・12×12） ----------
  const ENEMY_ART = {
    slime: [[
      '............',
      '.....aa.....',
      '....aaaa....',
      '...aaaaaa...',
      '..abaaaaaa..',
      '..awwaawwa..',
      '.aawkaawka..',
      '.aaaaaaaaaa.',
      '.aaaccccaaa.',
      'aaaaaaaaaaaa',
      '.aaaaaaaaaa.',
      '............',
    ], { a: '#2a4ad8', b: '#8aa8ff', w: '#fff', k: '#111', c: '#1a2a90' }],
    bat: [[
      '............',
      'a..........a',
      'aa...bb...aa',
      'aaa.bbbb.aaa',
      'aaaabrrbaaaa',
      '.aaabbbbaaa.',
      '..aa.ww.aa..',
      '...a.bb.a...',
      '......b.....',
      '............',
      '............',
      '............',
    ], { a: '#3a2a4a', b: '#5a4a6a', r: '#ff2a2a', w: '#fff' }],
    goblin: [[
      '............',
      '...aaaaaa...',
      'aa.aaaaaa.aa',
      '.aaarraarra.',
      '...aaaaaa...',
      '....awwa....',
      '...bbbbbb...',
      '..abbbbbba..',
      '..a.bbbb.a..',
      '....c..c....',
      '...cc..cc...',
      '............',
    ], { a: '#4aaa2a', r: '#e01a0a', w: '#fff', b: '#6a4a22', c: '#3a2a12' }],
    zombie: [[
      '....aaaa....',
      '...aaaaaa...',
      '...akaaka...',
      '...aaaaaa...',
      '....acca....',
      '.bbbbbbbbbb.',
      'aa.bbbbbb.aa',
      '...bbbbbb...',
      '...bb..bb...',
      '...bb..bb...',
      '..aaa..aaa..',
      '............',
    ], { a: '#7a9a7a', k: '#200', c: '#3a4a3a', b: '#4a4a6a' }],
    skeleton: [[
      '....aaaa..s.',
      '...aaaaaa.s.',
      '...akaaka.s.',
      '...aaaaaa.s.',
      '....akka..s.',
      '..a.aaaa.as.',
      '.a..a..a..h.',
      '....aaaa....',
      '....a..a....',
      '...aa..aa...',
      '...a....a...',
      '............',
    ], { a: '#e8e8e0', k: '#111', s: '#aab', h: '#864' }],
    snake: [[
      '.......aaa..',
      '......akaar.',
      '......aaaa..',
      '.......aa...',
      '...aaaaaa...',
      '..aabbbbb...',
      '..aa........',
      '..aaaaaaa...',
      '.....bbbaa..',
      '..aaaaaaaa..',
      '.aaabbbbb...',
      '............',
    ], { a: '#3aaa2a', b: '#8ae05a', k: '#ff0', r: '#e00' }],
    orc: [[
      '...aaaaaa...',
      '..aaaaaaaa..',
      '.baarraarrb.',
      '..aaaaaaaa..',
      '..awaaaawa..',
      '.cccccccccc.',
      'aacccccccc.a',
      'a.cccccccc.a',
      '..cc....cc..',
      '..dd....dd..',
      '.ddd....ddd.',
      '............',
    ], { a: '#8b5e3c', b: '#6a4428', r: '#e02a00', w: '#eedd99', c: '#5a3a22', d: '#3a2412' }],
    gargoyle: [[
      'a.........a.',
      'aa..bbbb..aa',
      'aaa.brrb.aaa',
      'aaaabbbbaaaa',
      '.aaabwwbaaa.',
      '..abbbbbba..',
      '...bbbbbb...',
      '...bb..bb...',
      '..bbb..bbb..',
      '............',
      '............',
      '............',
    ], { a: '#5a5a6a', b: '#7a7a8a', r: '#ff3a00', w: '#ddd' }],
    darkmage: [[
      '.....a......',
      '....aaa.....',
      '...aaaaa..y.',
      '..aaaaaaa.s.',
      '...arkra..s.',
      '...aaaaa..s.',
      '..aaaaaaaas.',
      '.aaaaaaaa.s.',
      '.aaaaaaaa.s.',
      '.aaaaaaaa.s.',
      'aaaaaaaaaa..',
      '............',
    ], { a: '#3a1a5a', r: '#ff3aff', k: '#000', y: '#ffd800', s: '#8a6a3a' }],
    golem: [[
      '...aaaaaa...',
      '..abbbbbba..',
      '..abrbbrba..',
      '..abbbbbba..',
      'aaaaaaaaaaaa',
      'abbbbbbbbbba',
      'abbbbccbbbba',
      'aa.abbbba.aa',
      '...abbbba...',
      '..aaa..aaa..',
      '.abba..abba.',
      '............',
    ], { a: '#5a5048', b: '#8a7a68', r: '#3af0ff', c: '#3af0ff' }],
    dark: [[
      '....aaaa..s.',
      '...abbbba.s.',
      '...arbbra.s.',
      '...abbbba.s.',
      '..aaaaaaaas.',
      '.abbbbbbbbh.',
      '.ab.bbbb.b..',
      '....bbbb....',
      '....b..b....',
      '...bb..bb...',
      '...a....a...',
      '............',
    ], { a: '#222244', b: '#11112a', r: '#e01a00', s: '#9aa', h: '#664' }],
    beast: [[
      '.a...a...a..',
      'aaa.aaa.aaa.',
      'rar.rar.rar.',
      'aaa.aaa.aaa.',
      '.aaaaaaaaa..',
      '..aaaaaaaaa.',
      '..aaaaaaaaa.',
      '..aa.aa.aa..',
      '..aa.aa.aa..',
      '.bbb.bb.bbb.',
      '............',
      '............',
    ], { a: '#552222', r: '#ff2a00', b: '#331111' }],
    minotaur: [[
      'w..........w',
      'ww.aaaaaa.ww',
      '.wwaaaaaaww.',
      '...arraara..',
      '...aaaaaa...',
      '....anna....',
      '.bbbbbbbbbb.',
      'aabbbbbbbbaa',
      'a..cccccc..a',
      '...aa..aa...',
      '..aaa..aaa..',
      '............',
    ], { a: '#7a4a2a', w: '#eee8d0', r: '#e01a00', n: '#3a2010', b: '#5a3a22', c: '#3a2a6a' }],
    lich: [[
      '..y.y.y.y...',
      '..yyyyyyy...',
      '...aaaaa....',
      '...akaka....',
      '...aaaaa....',
      '..bbbbbbb...',
      '.bbbbbbbbb..',
      'abbbbbbbbba.',
      '.bbbbbbbbb..',
      '.bbbbbbbbb..',
      'bbbbbbbbbbb.',
      '............',
    ], { y: '#ffd800', a: '#e0e0d0', k: '#3af0ff', b: '#2a1a3a' }],
    wyvern: [[
      'a.........aa',
      'aa..bbb..aaa',
      'aaa.bkbb.aa.',
      '.aaabbbbaa..',
      '..abbbbbbw..',
      '...bbbbbb...',
      '...bbbbbb...',
      '....bbbbb...',
      '....b..bbb..',
      '...bb....bb.',
      '...........b',
      '............',
    ], { a: '#2a6a5a', b: '#3a9a7a', k: '#ff0', w: '#fff' }],
    demon: [[
      'w..........w',
      '.w.aaaaaa.w.',
      '..aaaaaaaa..',
      '..ayyaayya..',
      '..aaaaaaaa..',
      '...awwwwa...',
      'bb.aaaaaa.bb',
      'bbbaaaaaabbb',
      'bb.aaaaaa.bb',
      '...aa..aa...',
      '..aaa..aaa..',
      '............',
    ], { a: '#9a1a2a', w: '#eee', y: '#ffd800', b: '#3a0a12' }],
    boss: [[
      'aa........aa',
      'aab.bbbb.baa',
      'aaabbbbbbaaa',
      '.aabyybyybaa',
      '..abbbbbbba.',
      '..bbwwwwbbb.',
      '..bbbbbbbbb.',
      '.bbccccccbb.',
      '.bbccccccbb.',
      '..bbb..bbb..',
      '.bbb....bbb.',
      '............',
    ], { a: '#7a0a00', b: '#cc2200', y: '#ffcc00', w: '#ffffff', c: '#ff8a3a' }],
  };

  function enemySVG(type, px) {
    const art = ENEMY_ART[type] || ENEMY_ART.slime;
    return inlineSVG(art[0], art[1], px);
  }

  // ---------- 主人公（戦闘・ステータス用 16×16、右向き） ----------
  // 職業ごとの頭、防具ごとの胴と脚、武器ごとの手持ちを重ねて描く
  const HERO_BASE = [
    '................',
    '......hhhh......',
    '.....hhhhhh.....',
    '.....hhssse.....',
    '.....hsssss.....',
    '......ssss......',
    '.....TTTTTT.....',
    '....TTTTTTTT....',
    '....sTTTTTTs....',
    '....sTTTTTTs....',
    '.....tttttt.....',
    '.....LLLLLL.....',
    '.....LL..LL.....',
    '.....LL..LL.....',
    '.....bb..bb.....',
    '....bbb..bbb....',
  ];

  const HEADS = {
    warrior: { pal: { h: '#9a9aa8', H: '#c8c8d8', r: '#d02a1a' }, px: [[7, 0, 'r'], [8, 0, 'r'], [6, 1, 'H'], [5, 3, 'h']] },
    mage:    { pal: { h: '#2a2a8a', H: '#ffd800' }, px: [[8, 0, 'h'], [7, 0, 'h'], [4, 2, 'h'], [11, 2, 'h'], [8, 1, 'H']] },
    priest:  { pal: { h: '#e8e8e8', H: '#ffd800' }, px: [[5, 4, 'h'], [5, 5, 'h'], [10, 5, 'h'], [7, 1, 'H']] },
    thief:   { pal: { h: '#2a7a2a', H: '#4a2a12' }, px: [[4, 2, 'h'], [4, 3, 'h'], [5, 3, 'H'], [5, 4, 'H']] },
  };

  const ARMOR_LOOK = {
    cloth:         { T: null, t: null, L: '#4a3a2a' },
    leather_armor: { T: '#8a5a2a', t: '#4a2a12', L: '#5a4030' },
    iron_armor:    { T: '#9a9aa8', t: '#5a5a68', L: '#6a6a78', pads: '#c8c8d8' },
    mithril_armor: { T: '#a8d8f8', t: '#4a7ab8', L: '#6a9ac8', pads: '#e8f8ff', shine: true },
    magic_robe:    { T: '#3a3ab8', t: '#ffd800', L: '#3a3ab8', robe: true },
    holy_robe:     { T: '#f4f4f4', t: '#ffd800', L: '#f4f4f4', robe: true, shine: true },
    shadow_armor:  { T: '#22222e', t: '#b0202a', L: '#22222e', mask: true },
  };

  const JOB_BODY = {
    warrior: { T: '#c0281a', t: '#6a1408' },
    mage:    { T: '#2244cc', t: '#14226a' },
    priest:  { T: '#d8d8d8', t: '#8a8a8a' },
    thief:   { T: '#2a7a2a', t: '#143814' },
  };

  // 武器: 手（11,8）に持つ。[x, y, 色記号]
  function swordPx(len, guard) {
    const px = [[12, 8, 'g'], [12, 9, 'g'], [11, 7, guard], [12, 7, guard], [13, 7, guard]];
    for (let i = 1; i <= len; i++) px.push([12, 7 - i, i === len ? 'W' : 'w']);
    for (let i = 2; i < len; i++) px.push([13, 7 - i, 'W']);
    return px;
  }
  function staffPx(top) {
    const px = [];
    for (let y = top; y <= 13; y++) px.push([12, y, 'g']);
    return px;
  }
  const WEAPON_LOOK = {
    wooden_sword:  { pal: { w: '#a0703a', W: '#c89858', g: '#5a3a1a', G: '#5a3a1a' }, px: swordPx(3, 'G') },
    dagger:        { pal: { w: '#b8b8c8', W: '#e8e8f8', g: '#5a3a1a', G: '#8a8a9a' }, px: swordPx(2, 'G') },
    iron_sword:    { pal: { w: '#9a9aa8', W: '#d8d8e8', g: '#5a3a1a', G: '#8a6a2a' }, px: swordPx(5, 'G') },
    mithril_sword: { pal: { w: '#7ab8e8', W: '#d8f0ff', g: '#3a3a6a', G: '#c0c0d0' }, px: swordPx(6, 'G') },
    hero_sword:    { pal: { w: '#ffd84a', W: '#fff8c0', g: '#7a2a8a', G: '#ffd800', x: '#fff' }, px: [...swordPx(6, 'G'), [14, 1, 'x'], [11, 2, 'x']] },
    ninja_blade:   { pal: { w: '#4a4a58', W: '#c8c8d8', g: '#1a1a1a', G: '#1a1a1a' }, px: swordPx(5, 'G') },
    wind_blade:    { pal: { w: '#5ad88a', W: '#c8ffd8', g: '#1a3a2a', G: '#2a8a5a', x: '#c8ffd8' }, px: [...swordPx(5, 'G'), [14, 2, 'x'], [10, 3, 'x']] },
    mace:          { pal: { g: '#5a3a1a', m: '#8a8a9a', M: '#c8c8d8' }, px: [[12, 9, 'g'], [12, 8, 'g'], [12, 7, 'g'], [12, 6, 'g'], [11, 4, 'm'], [12, 4, 'M'], [13, 4, 'm'], [11, 5, 'm'], [12, 5, 'm'], [13, 5, 'm'], [12, 3, 'm'], [10, 4, 'm'], [14, 4, 'm']] },
    thin_staff:    { pal: { g: '#8a5a2a' }, px: staffPx(3) },
    magic_staff:   { pal: { g: '#8a5a2a', o: '#3a8aff', O: '#bfe0ff' }, px: [...staffPx(3), [12, 1, 'o'], [13, 1, 'o'], [12, 2, 'O'], [13, 2, 'o']] },
    sage_staff:    { pal: { g: '#5a2a6a', o: '#c03aff', O: '#f0c0ff', y: '#ffd800' }, px: [...staffPx(3), [11, 1, 'y'], [14, 1, 'y'], [12, 0, 'o'], [13, 0, 'O'], [12, 1, 'o'], [13, 1, 'o'], [12, 2, 'o'], [13, 2, 'o']] },
    holy_staff:    { pal: { g: '#c8a040', y: '#ffd800', Y: '#fff8c0' }, px: [...staffPx(3), [12, 0, 'Y'], [12, 1, 'y'], [11, 1, 'y'], [13, 1, 'y'], [12, 2, 'y']] },
  };

  function heroGrid(job, weapon, armor) {
    const g = HERO_BASE.map(r => r.split(''));
    const pal = { s: '#e8a878', e: '#101010', b: '#3a2a1a' };
    const put = (x, y, c) => { if (g[y] && x >= 0 && x < 16) g[y][x] = c; };

    const head = HEADS[job] || HEADS.warrior;
    Object.assign(pal, head.pal);
    head.px.forEach(([x, y, c]) => put(x, y, c));

    const body = JOB_BODY[job] || JOB_BODY.warrior;
    const a = ARMOR_LOOK[armor] || ARMOR_LOOK.cloth;
    pal.T = a.T || body.T;
    pal.t = a.t || body.t;
    pal.L = a.L;
    if (a.pads) { pal.p = a.pads; put(4, 6, 'p'); put(11, 6, 'p'); put(4, 7, 'p'); put(11, 7, 'p'); }
    if (a.robe) {
      for (let y = 11; y <= 13; y++) for (let x = 5; x <= 10; x++) put(x, y, 'T');
      put(4, 13, 'T'); put(11, 13, 'T');
      for (let y = 6; y <= 13; y++) put(7, y, 't');
    }
    if (a.mask) { put(6, 5, 't'); put(7, 5, 't'); put(8, 5, 't'); put(9, 5, 't'); }
    if (a.shine) { pal.Z = '#ffffff'; put(6, 7, 'Z'); }

    const w = WEAPON_LOOK[weapon];
    if (w) {
      // 武器の色記号が体の色と重ならないよう、別名に置き換える
      const map = {};
      for (const [k, v] of Object.entries(w.pal)) { const nk = 'w_' + k; map[k] = nk; pal[nk] = v; }
      w.px.forEach(([x, y, c]) => put(x, y, map[c]));
    }
    return { rows: g, pal };
  }

  // 複数文字の色記号に対応した描画（配列のグリッド用）
  function gridSVG(rows, pal, px) {
    let rects = '';
    rows.forEach((row, y) => row.forEach((c, x) => {
      const col = pal[c];
      if (col) rects += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${col}"/>`;
    }));
    const size = px ? ` width="${px}" height="${px}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg"${size} viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges">${rects}</svg>`;
  }

  function heroInline(job, weapon, armor, px) {
    const { rows, pal } = heroGrid(job, weapon, armor);
    return gridSVG(rows, pal, px);
  }

  return {
    cellLayers, floorTile, playerSprite, princessSprite,
    playerInline, princessInline, enemySVG, heroInline,
  };
})();
