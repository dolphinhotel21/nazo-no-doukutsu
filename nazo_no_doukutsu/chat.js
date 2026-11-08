// =============================
// AI会話モード（仲間と話す）
// Claude上で開いた時は Claude が答え、それ以外では用意した台詞で答える
// =============================
const Chat = (() => {
  let sample = null;          // Claude に尋ねる関数（使えない時は null）
  let disabledReason = '';
  let current = null;         // 話している相手のID
  let busy = false;
  let abort = null;
  const history = {};         // 相手ごとの会話の記録

  const PERSONAS = {
    ares: { name: 'アレス', job: '戦士', title: '城の兵士',
      voice: '熱血で真っ直ぐな若い兵士。一人称は「俺」。主人公を「相棒」と呼ぶ。ミレーユ姫を心から慕い、守れなかったことを悔やんでいる。言葉は短く力強い。' },
    rina: { name: 'リナ', job: '魔法使い', title: '魔法屋の娘',
      voice: '勝ち気で自信家の魔法使いの少女。一人称は「あたし」。口調は「〜じゃない」「〜でしょ」「ふふん」。素直になれないが仲間思い。炎の魔法が自慢。' },
    sera: { name: 'セラ', job: '僧侶', title: '修道女',
      voice: '穏やかで慈愛深い修道女。一人称は「私」。丁寧語で話し、仲間の体を気づかう。芯は強く、闇の魔物には毅然とした態度をとる。' },
    jin: { name: 'ジン', job: '盗賊', title: '流れ者',
      voice: '皮肉屋で飄々とした流れ者の盗賊。一人称は「俺」。軽口が多く金にうるさいが、根は情に厚い。罠と鍵開けの腕は確か。語尾に「〜だぜ」「〜だな」。' },
    princess: { name: 'ミレーユ姫', job: '姫', title: '王国の姫',
      voice: '気品があり芯の強い王女。一人称は「わたくし」。助けてくれた一行に深く感謝しており、城へ帰る道中を気丈に励ます。' },
  };

  // 起動時に Claude が使えるか確かめる（使えない環境では何もしない）
  function init() {
    let tries = 0;
    const tryUse = () => {
      if (window.claude && typeof window.claude.use === 'function') {
        window.claude.use('sample').then(fn => { sample = fn || null; updateBadge(); }).catch(() => { sample = null; });
        return;
      }
      if (++tries < 15) setTimeout(tryUse, 300);
    };
    tryUse();
  }

  function aiReady() { return !!sample && !disabledReason; }

  function updateBadge() {
    const b = $('chat-mode');
    if (!b) return;
    b.textContent = aiReady() ? 'AI会話' : '会話';
    b.title = aiReady() ? 'Claude が仲間の言葉を考えます' : 'Claude 上で開くと、仲間と自由に会話できます';
    b.classList.toggle('on', aiReady());
  }

  // 話せる相手の一覧
  function partners() {
    const list = game.party.filter(m => m.companion && m.hp > 0).map(m => m.companion);
    if (game.flags.princessRescued) list.push('princess');
    return list;
  }

  function openTalkMenu() {
    const ps = partners();
    if (!ps.length) {
      openDialog('[ はなす ]', game.party.length > 1
        ? '仲間はみな倒れていて、話ができない…。'
        : '話し相手がいない。<br>町には仲間になってくれる人がいる。話しかけてみよう。');
      return;
    }
    const rows = `<div class="dim2" style="margin-bottom:6px">${aiReady() ? '仲間と自由に会話できます（Claude が答えます）' : '仲間と会話できます。<br>Claude 上で開くと、どんな話題にも自由に答えてくれます。'}</div>
      <div class="member-picker">${ps.map(id => {
        const m = game.party.find(x => x.companion === id);
        const face = id === 'princess' ? Art.princessInline(28) : Art.heroInline(m.job, m.weapon, m.armor, 28);
        return `<button class="pick-btn" data-talk="${id}">${face}<span>${PERSONAS[id].name}<small>${PERSONAS[id].job}</small></span></button>`;
      }).join('')}</div>`;
    openShop('[ はなす ]', rows);
    document.querySelectorAll('[data-talk]').forEach(b => b.addEventListener('click', () => { closeShop(); open(b.dataset.talk); }));
  }

  function open(id) {
    current = id;
    game.inputEnabled = false;
    const p = PERSONAS[id];
    const m = game.party.find(x => x.companion === id);
    $('chat-face').innerHTML = id === 'princess' ? Art.princessInline(40) : Art.heroInline(m.job, m.weapon, m.armor, 40);
    $('chat-name').textContent = `${p.name}（${p.job}）`;
    updateBadge();
    const log = $('chat-log');
    log.replaceChildren();
    history[id] = history[id] || [];
    if (!history[id].length) {
      addLine('them', greeting(id));
    } else {
      history[id].slice(-12).forEach(h => addLine(h.role === 'user' ? 'me' : 'them', h.text, true));
    }
    $('chat-overlay').classList.remove('hidden');
    setTimeout(() => $('chat-input').focus(), 50);
  }

  function close() {
    if (abort) { try { abort.abort(); } catch (e) {} }
    abort = null;
    busy = false;
    current = null;
    $('chat-overlay').classList.add('hidden');
    $('chat-input').blur();
    game.inputEnabled = true;
  }

  function addLine(who, text, noStore) {
    const log = $('chat-log');
    const row = document.createElement('div');
    row.className = 'chat-line ' + who;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    if (!noStore && current) history[current].push({ role: who === 'me' ? 'user' : 'assistant', text });
    return bubble;
  }

  function greeting(id) {
    const h = hero();
    const lines = {
      ares: `どうした、相棒？ 何でも言ってくれ。`,
      rina: `なによ、${h.name}。あたしに用？`,
      sera: `${h.name}さん、お疲れではありませんか？`,
      jin: `よう、${h.name}。暇つぶしの話なら付き合うぜ。`,
      princess: `${h.name}様、何かお話しになりたいことが？`,
    };
    return lines[id];
  }

  // いまの冒険の状況を文章にする（Claude に渡す）
  function situation() {
    const f = game.flags;
    const where = MAP_NAMES[game.currentMap];
    const party = game.party.map(m => `${m.name}（${JOBS[m.job].name} LV${m.lv} HP${m.hp}/${m.maxHp} MP${m.mp}/${getMaxMp(m)}${m.hp <= 0 ? ' 倒れている' : ''}${m.poisoned ? ' 毒' : ''} 装備:${WEAPONS[m.weapon].name}・${ARMORS[m.armor].name}）`).join('、');
    const progress = f.princessRescued ? '竜を倒し、姫を救出した。あとは町の城へ姫を連れ帰るだけ。'
      : f.bossDefeated ? '暗黒竜ヴォルガンを倒した。B5Fの牢に姫がいる。'
      : f.golemDefeated ? 'B3Fの門番ゴーレムを倒した。竜はB5Fにいる。B4Fには職業ごとの伝説の武器が眠っている。'
      : (f.deepest || 0) > 0 ? `洞窟はB${f.deepest}Fまで進んだ。B3Fには門番ゴーレムがいる。竜はB5F。`
      : 'まだ洞窟に入っていない。洞窟は町の外、南東の岩山の中（橋を渡り、山の切れ目を抜けた先）。';
    const items = game.items.map(it => `${CONSUMABLES[it.id].name}×${it.count}`).join('・') || 'なし';
    return `現在地: ${where}\n一行: ${party}\n所持金: ${game.gold}ペリカ\n道具: ${items}\n進み具合: ${progress}`;
  }

  function buildPrompt(id, userText) {
    const p = PERSONAS[id];
    const h = hero();
    const past = history[id].slice(-11, -1).map(x => `${x.role === 'user' ? h.name : p.name}: ${x.text}`).join('\n');
    return `あなたはレトロ風RPG「謎の洞窟」に登場する${p.title}の${p.name}（${p.job}）として、主人公${h.name}（${JOBS[h.job].name}）と会話します。
【人物】${p.voice}
【世界】山あいの小さな王国。暗黒竜ヴォルガンが城を襲いミレーユ姫をさらった。竜は町の外の謎の洞窟（地下5階）の最深部に棲む。洞窟には竜が守る秘宝「竜の瞳」もある。通貨はペリカ。町には城・宿屋・魔法屋・武器屋・防具屋・道具屋がある。エスケプ/帰還の糸で洞窟から出られ、テレポ/転移の石で行ったことのある階へ飛べる。倒れた仲間は宿屋・リザレク・復活の葉で起こせる。
【いまの状況】
${situation()}
【これまでの会話】
${past || '（なし）'}
【ルール】
・${p.name}として、日本語で1〜3文、80字以内で答える。台詞だけを書き、名前や括弧、記号の飾り、マークダウンは付けない。
・状況（現在地・仲間の傷・進み具合）を踏まえて自然に話す。傷ついた仲間がいれば気にかける。
・ゲームの攻略を聞かれたら、上の情報の範囲で${p.name}らしくヒントを出す。知らないことは知らないと言う。
・ゲームの外の話題を振られても、この世界の人物として受け答えする。AIであることには触れない。
・乱暴な言葉や不適切な話題には乗らず、${p.name}らしくたしなめる。

${h.name}: ${userText}
${p.name}:`;
  }

  async function send(text) {
    text = String(text || '').trim().slice(0, 120);
    if (!text || busy || !current) return;
    const id = current;
    $('chat-input').value = '';
    addLine('me', text);
    busy = true;
    $('chat-send').disabled = true;
    const bubble = addLine('them', '…', true);
    bubble.classList.add('thinking');
    let answer = '';
    if (aiReady()) {
      abort = new AbortController();
      try {
        const res = await sample(buildPrompt(id, text), {
          modelTier: 'quick', cache: false, signal: abort.signal,
          onText: ({ text: t }) => { if (current === id) { bubble.classList.remove('thinking'); bubble.textContent = t; scroll(); } },
        });
        answer = cleanup(res && res.text);
      } catch (e) {
        if (e && e.code === 'not_granted') {
          disabledReason = 'not_granted';
          updateBadge();
          answer = offlineReply(id, text) + '（AI会話が許可されなかったため、決まった台詞で答えています）';
        } else if (e && e.code === 'rate_limited') {
          answer = '…ちょっと待って、少し休ませて。（しばらくしてから話しかけてください）';
        } else if (current !== id) {
          return;
        } else {
          answer = offlineReply(id, text);
        }
      }
      abort = null;
    } else {
      await new Promise(r => setTimeout(r, 350));
      answer = offlineReply(id, text);
    }
    if (current !== id) { busy = false; return; }
    bubble.classList.remove('thinking');
    bubble.textContent = answer || '……。';
    history[id].push({ role: 'assistant', text: bubble.textContent });
    busy = false;
    $('chat-send').disabled = false;
    scroll();
  }

  function scroll() { const log = $('chat-log'); log.scrollTop = log.scrollHeight; }
  function cleanup(t) {
    return String(t || '').replace(/^[^:：]{1,10}[:：]\s*/, '').replace(/[*#`]/g, '').trim().slice(0, 200);
  }

  // Claude を使えない時の受け答え
  function offlineReply(id, text) {
    const f = game.flags;
    const me = game.party.find(m => m.companion === id);
    const hurt = game.party.filter(m => m !== me && m.hp > 0 && m.hp < m.maxHp * 0.4);
    const down = game.party.filter(m => m.hp <= 0);
    const ask = s => s.some(w => text.includes(w));
    const say = {
      ares:     { hurt: n => `${n}、傷が深いぞ。無理せず回復しよう！`, down: n => `${n}が倒れたままだ…宿屋かリザレクで起こしてやろう。`, hint: hintText(), cheer: '姫様は必ず俺たちが救い出す。行こう、相棒！', thanks: '礼なんていらないさ。仲間だろ？' },
      rina:     { hurt: n => `ちょっと、${n}ボロボロじゃない。回復しなさいよ。`, down: n => `${n}が倒れてるわよ！ 早く起こしてあげて。`, hint: hintText(), cheer: 'ふふん、あたしの魔法があれば竜なんて楽勝よ。', thanks: 'べ、別にあんたのためじゃないんだから。' },
      sera:     { hurt: n => `${n}さんの傷が心配です。少し休みましょう。`, down: n => `${n}さんが倒れています。どうか起こして差し上げて。`, hint: hintText(), cheer: '神のご加護がありますように。きっと大丈夫です。', thanks: 'お役に立てたなら、私も嬉しいです。' },
      jin:      { hurt: n => `おい、${n}がやばいぜ。薬草でも使っときな。`, down: n => `${n}がのびてるぜ。復活の葉、持ってるか？`, hint: hintText(), cheer: '竜の財宝か…分け前、忘れないでくれよ？', thanks: 'へへ、照れるじゃねえか。' },
      princess: { hurt: n => `${n}様、お怪我が…どうかご無理なさらずに。`, down: n => `${n}様が…！ どうか、助けて差し上げて。`, hint: '城はもうすぐですわ。町の北の、お城へ参りましょう。', cheer: '皆様がいてくださって、わたくしは本当に心強いのです。', thanks: '感謝するのはわたくしの方ですわ。' },
    }[id];
    if (down.length && ask(['大丈夫', '調子', '仲間', '倒れ'])) return say.down(down[0].name);
    if (ask(['ありがと', '感謝', 'サンキュー'])) return say.thanks;
    if (ask(['どこ', 'どう', '次', 'ヒント', '作戦', '何を', 'なにを', '攻略', '行'])) return say.hint;
    if (hurt.length && ask(['大丈夫', '調子', '傷', '疲れ', '元気'])) return say.hurt(hurt[0].name);
    if (down.length) return say.down(down[0].name);
    if (hurt.length && Math.random() < 0.5) return say.hurt(hurt[0].name);
    return say.cheer;
  }

  function hintText() {
    const f = game.flags;
    if (f.princessRescued) return '姫を町の城へお連れしよう。エスケプか帰還の糸を使えば早いぞ。';
    if (f.bossDefeated) return 'B5Fの牢に姫がいるはずだ。急ごう。';
    if (f.golemDefeated && !f.legendTaken) return 'B4Fのどこかに伝説の武器があるらしい。竜に挑む前に探そう。';
    if (f.golemDefeated) return '竜はB5Fだ。回復の道具を十分そろえてから行こう。';
    if ((f.deepest || 0) >= 2) return 'B3Fの階段には石の門番がいる。しっかり鍛えてから挑もう。';
    if ((f.deepest || 0) >= 1) return '洞窟の奥へ進もう。宝箱や回復の泉も探しながらな。';
    return '洞窟は町の外、南東の岩山の中だ。橋を渡って、山の切れ目を抜けた先にある。';
  }

  function bind() {
    $('chat-send').addEventListener('click', () => send($('chat-input').value));
    $('chat-input').addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send($('chat-input').value); }
      if (e.key === 'Escape') close();
    });
    $('chat-close').addEventListener('click', close);
    document.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => send(b.dataset.chip)));
  }

  return { init, bind, openTalkMenu, aiReady, close, PERSONAS };
})();

Chat.bind();
Chat.init();
