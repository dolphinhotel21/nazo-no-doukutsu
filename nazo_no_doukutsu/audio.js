// =============================
// サウンド（WebAudioで鳴らすチップチューン。音声ファイルは使わない）
// =============================
const Sound = (() => {
  let ctx = null;
  let master = null;
  let muted = false;
  let current = null;     // 再生中のBGM名
  let bgmGain = null;     // 再生中BGMの音量ノード
  let loopTimer = null;

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(note) {
    const m = /^([A-G])(#?)(\d)$/.exec(note);
    if (!m) return 0;
    const n = SEMI[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  // ユーザー操作の中で呼ぶ（ブラウザの自動再生制限のため）
  function unlock() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.5;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') {
        // 再開できた時点でBGMを鳴らし直す（再開前に予約した音は鳴らないことがある）
        ctx.resume().then(() => {
          if (current && !muted) { stopLoop(); startLoop(current); }
        }).catch(() => {});
        return;
      }
      if (current && !bgmGain) startLoop(current);
    } catch (e) { ctx = null; }
  }

  function tone(dest, f, t, dur, type, vol, slideTo) {
    if (!f) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function noise(dest, t, dur, vol, hp) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const g = ctx.createGain();
    const fl = ctx.createBiquadFilter();
    fl.type = 'highpass';
    fl.frequency.value = hp || 800;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t); s.stop(t + dur + 0.02);
  }

  // ---------- 効果音 ----------
  function arp(notes, step, type, vol) {
    const t = ctx.currentTime;
    notes.forEach((n, i) => tone(master, freq(n), t + i * step, step * 1.6, type || 'square', vol || 0.18));
  }

  const SFX = {
    select() { tone(master, 880, ctx.currentTime, 0.05, 'square', 0.12); },
    hit() {
      const t = ctx.currentTime;
      noise(master, t, 0.08, 0.35, 1200);
      tone(master, 420, t, 0.12, 'square', 0.18, 120);
    },
    crit() {
      const t = ctx.currentTime;
      noise(master, t, 0.15, 0.45, 600);
      tone(master, 900, t, 0.2, 'sawtooth', 0.2, 100);
    },
    hurt() {
      const t = ctx.currentTime;
      noise(master, t, 0.12, 0.3, 300);
      tone(master, 220, t, 0.2, 'square', 0.2, 70);
    },
    fire() {
      const t = ctx.currentTime;
      noise(master, t, 0.45, 0.35, 400);
      tone(master, 200, t, 0.4, 'sawtooth', 0.15, 600);
    },
    ice() { arp(['E6', 'B6', 'G6', 'E7', 'B6'], 0.05, 'triangle', 0.2); },
    thunder() {
      const t = ctx.currentTime;
      noise(master, t, 0.5, 0.55, 150);
      noise(master, t + 0.12, 0.3, 0.4, 2000);
    },
    holy() { arp(['C6', 'G6', 'E6', 'C7', 'G7'], 0.06, 'triangle', 0.2); },
    heal() { arp(['C5', 'E5', 'G5', 'C6'], 0.07, 'triangle', 0.22); },
    buff() { arp(['G4', 'B4', 'D5', 'G5'], 0.06, 'square', 0.12); },
    poison() { arp(['E4', 'D#4', 'D4', 'C#4'], 0.07, 'sawtooth', 0.12); },
    levelup() { arp(['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.07, 'square', 0.16); },
    stairs() { arp(['G5', 'E5', 'C5', 'G4'], 0.08, 'square', 0.14); },
    stairsUp() { arp(['G4', 'C5', 'E5', 'G5'], 0.08, 'square', 0.14); },
    chest() { arp(['G5', 'C6', 'E6', 'G6'], 0.07, 'square', 0.15); },
    coin() { arp(['B5', 'E6'], 0.06, 'square', 0.15); },
    trap() {
      const t = ctx.currentTime;
      tone(master, 120, t, 0.35, 'sawtooth', 0.22, 60);
      noise(master, t, 0.2, 0.3, 200);
    },
    run() { arp(['C5', 'G4', 'E4'], 0.05, 'square', 0.12); },
    win() { arp(['G5', 'G5', 'G5', 'C6'], 0.1, 'square', 0.16); },
    gameover() { arp(['E4', 'D4', 'C4', 'B3', 'A3'], 0.22, 'triangle', 0.22); },
    door() { arp(['C5', 'C6'], 0.09, 'square', 0.14); },
    error() { tone(master, 150, ctx.currentTime, 0.12, 'square', 0.15); },
  };

  function sfx(name) {
    if (!ctx || muted || !SFX[name]) return;
    try { SFX[name](); } catch (e) {}
  }

  // ---------- BGM ----------
  // [音名, 拍数]。'R' は休符。
  const TRACKS = {
    title: {
      bpm: 92, leadType: 'triangle', bassType: 'triangle',
      lead: [['A4',2],['C5',1],['E5',1],['A5',3],['G5',1],['F5',2],['E5',1],['D5',1],['E5',4],
             ['A4',2],['C5',1],['E5',1],['G5',3],['F5',1],['E5',2],['D5',1],['B4',1],['A4',4]],
      bass: [['A2',4],['F2',4],['D3',4],['E2',4],['A2',4],['C3',4],['G2',4],['A2',4]],
    },
    town: {
      bpm: 120, leadType: 'square', bassType: 'triangle',
      lead: [['E5',1],['G5',1],['C6',2],['B5',1],['G5',1],['A5',2],['G5',1],['E5',1],['F5',1],['D5',1],['E5',2],['R',2],
             ['C5',1],['E5',1],['G5',2],['F5',1],['A5',1],['G5',2],['E5',1],['D5',1],['C5',1],['D5',1],['C5',3],['R',1]],
      bass: [['C3',2],['G3',2],['F3',2],['C3',2],['G3',2],['D3',2],['C3',2],['G2',2],
             ['C3',2],['G3',2],['F3',2],['A2',2],['G2',2],['B2',2],['C3',2],['G2',2]],
    },
    field: {
      bpm: 132, leadType: 'square', bassType: 'triangle',
      lead: [['G4',1],['C5',1],['E5',1],['G5',2],['E5',1],['F5',1],['D5',1],
             ['E5',1],['C5',1],['D5',1],['B4',1],['C5',4],
             ['A4',1],['C5',1],['F5',1],['A5',2],['G5',1],['F5',1],['E5',1],
             ['D5',1],['E5',1],['F5',1],['D5',1],['G5',4]],
      bass: [['C3',2],['G2',2],['C3',2],['G2',2],['G2',2],['D3',2],['C3',2],['G2',2],
             ['F2',2],['C3',2],['F2',2],['C3',2],['G2',2],['D3',2],['G2',2],['B2',2]],
    },
    dungeon: {
      bpm: 84, leadType: 'triangle', bassType: 'triangle',
      lead: [['A4',2],['C5',1],['E5',1],['D5',2],['C5',2],['B4',2],['G4',1],['B4',1],['A4',4],
             ['E5',2],['F5',1],['E5',1],['D5',2],['B4',2],['C5',2],['A4',1],['B4',1],['G#4',4]],
      bass: [['A2',2],['E3',2],['F2',2],['C3',2],['G2',2],['D3',2],['A2',2],['E3',2],
             ['C3',2],['G3',2],['D3',2],['A2',2],['A2',2],['E3',2],['E2',2],['B2',2]],
    },
    deep: {
      bpm: 76, leadType: 'triangle', bassType: 'sawtooth',
      lead: [['D5',3],['C5',1],['A#4',2],['A4',2],['G4',3],['A4',1],['A#4',2],['A4',2],
             ['F5',3],['E5',1],['D5',2],['C#5',2],['D5',6],['R',2]],
      bass: [['D2',4],['A#1',4],['C2',4],['A1',4],['D2',4],['G1',4],['A1',4],['D2',4]],
    },
    battle: {
      bpm: 160, leadType: 'square', bassType: 'triangle',
      lead: [['E5',0.5],['E5',0.5],['R',0.5],['E5',0.5],['G5',1],['E5',1],['D5',0.5],['D5',0.5],['R',0.5],['D5',0.5],['F5',1],['D5',1],
             ['C5',0.5],['C5',0.5],['R',0.5],['C5',0.5],['E5',1],['C5',1],['B4',0.5],['C5',0.5],['D5',0.5],['E5',0.5],['F#5',1],['G#5',1]],
      bass: [['E2',0.5],['E3',0.5],['E2',0.5],['E3',0.5],['E2',0.5],['E3',0.5],['E2',0.5],['E3',0.5],
             ['D2',0.5],['D3',0.5],['D2',0.5],['D3',0.5],['D2',0.5],['D3',0.5],['D2',0.5],['D3',0.5],
             ['C2',0.5],['C3',0.5],['C2',0.5],['C3',0.5],['C2',0.5],['C3',0.5],['C2',0.5],['C3',0.5],
             ['B1',0.5],['B2',0.5],['B1',0.5],['B2',0.5],['E2',0.5],['E3',0.5],['E2',0.5],['E3',0.5]],
    },
    boss: {
      bpm: 144, leadType: 'sawtooth', bassType: 'square',
      lead: [['A4',0.5],['C5',0.5],['E5',0.5],['A5',0.5],['G#5',1],['E5',1],
             ['F5',0.5],['E5',0.5],['D5',0.5],['C5',0.5],['B4',2],
             ['A4',0.5],['C5',0.5],['E5',0.5],['A5',0.5],['B5',1],['C6',1],
             ['B5',0.5],['A5',0.5],['G#5',0.5],['E5',0.5],['A5',2]],
      bass: [['A1',0.5],['A2',0.5],['A1',0.5],['A2',0.5],['A1',0.5],['A2',0.5],['A1',0.5],['A2',0.5],
             ['F1',0.5],['F2',0.5],['F1',0.5],['F2',0.5],['E1',0.5],['E2',0.5],['E1',0.5],['E2',0.5],
             ['A1',0.5],['A2',0.5],['A1',0.5],['A2',0.5],['G1',0.5],['G2',0.5],['G1',0.5],['G2',0.5],
             ['E1',0.5],['E2',0.5],['E1',0.5],['E2',0.5],['A1',0.5],['A2',0.5],['A1',0.5],['A2',0.5]],
    },
    ending: {
      bpm: 100, leadType: 'square', bassType: 'triangle',
      lead: [['C5',1],['E5',1],['G5',1],['C6',3],['A5',1],['F5',1],['A5',1],['C6',3],
             ['B5',1],['A5',1],['G5',1],['F5',1],['E5',1],['D5',1],['C5',6],['R',2]],
      bass: [['C3',3],['G2',3],['F2',3],['A2',3],['G2',3],['G2',3],['C3',4],['C2',4]],
    },
    abyss: {
      bpm: 66, leadType: 'triangle', bassType: 'sawtooth',
      lead: [['E5',2],['F5',2],['E5',1],['D#5',1],['E5',2],['B4',4],['C5',2],['B4',2],
             ['A4',2],['G#4',2],['A4',1],['B4',1],['C5',2],['B4',6],['R',2]],
      bass: [['E2',4],['F2',4],['E2',4],['B1',4],['A1',4],['F1',4],['E1',8]],
    },
    // 階が深くなるほど、同じ曲を低く・重く・速くした変奏にする
    dungeon2: { base: 'dungeon', transpose: -3, bpm: 78, leadType: 'triangle', bassType: 'square' },
    deep4:    { base: 'deep', transpose: -2, bpm: 70, leadType: 'sawtooth', bassType: 'sawtooth' },
    battle2:  { base: 'battle', transpose: -3, bpm: 166, leadType: 'square', bassType: 'square' },
    battle3:  { base: 'battle', transpose: -5, bpm: 172, leadType: 'sawtooth', bassType: 'square' },
    battle4:  { base: 'battle', transpose: -6, bpm: 178, leadType: 'sawtooth', bassType: 'sawtooth' },
    battle5:  { base: 'boss', transpose: -5, bpm: 150, leadType: 'square', bassType: 'sawtooth' },
    midboss:  { base: 'boss', transpose: -2, bpm: 136, leadType: 'square', bassType: 'square' },
    gameover: {
      bpm: 70, leadType: 'triangle', bassType: 'triangle', once: true,
      lead: [['E5',2],['D5',1],['C5',1],['B4',2],['A4',4],['R',4]],
      bass: [['A2',4],['E2',4],['A2',6]],
    },
  };

  function resolve(name) {
    const tr = TRACKS[name];
    if (!tr.base) return { ...tr, shift: 1 };
    const b = TRACKS[tr.base];
    return { ...b, ...tr, lead: b.lead, bass: b.bass, shift: Math.pow(2, (tr.transpose || 0) / 12) };
  }

  function scheduleTrack(name, t0) {
    const tr = resolve(name);
    const beat = 60 / tr.bpm;
    let t = t0;
    for (const [n, b] of tr.lead) {
      if (n !== 'R') tone(bgmGain, freq(n) * tr.shift, t, b * beat * 0.92, tr.leadType, tr.leadType === 'sawtooth' ? 0.07 : 0.11);
      t += b * beat;
    }
    let tb = t0;
    for (const [n, b] of tr.bass) {
      if (n !== 'R') tone(bgmGain, freq(n) * tr.shift, tb, b * beat * 0.85, tr.bassType, tr.bassType === 'triangle' ? 0.16 : 0.05);
      tb += b * beat;
    }
    return Math.max(t, tb) - t0;
  }

  function startLoop(name) {
    if (!ctx || muted) return;
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 1;
    bgmGain.connect(master);
    const myGain = bgmGain;
    let t0 = ctx.currentTime + 0.05;
    const loop = () => {
      if (bgmGain !== myGain) return;
      const len = scheduleTrack(name, t0);
      t0 += len;
      if (TRACKS[name].once) return;
      loopTimer = setTimeout(loop, Math.max(50, (t0 - ctx.currentTime - 0.3) * 1000));
    };
    loop();
  }

  function stopLoop() {
    clearTimeout(loopTimer);
    if (bgmGain && ctx) {
      const g = bgmGain;
      try {
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 250);
      } catch (e) {}
    }
    bgmGain = null;
  }

  function bgm(name) {
    if (current === name && bgmGain) return;
    stopLoop();
    current = name;
    if (name) startLoop(name);
  }

  function setMuted(m) {
    muted = m;
    if (master && ctx) master.gain.setValueAtTime(m ? 0 : 0.5, ctx.currentTime);
    if (m) stopLoop();
    else if (current && !bgmGain) startLoop(current);
  }

  return { unlock, sfx, bgm, setMuted, isMuted: () => muted };
})();
