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

  // 設定（性別・年齢・性格・記憶）を反映した人物像
  function who(id) {
    const base = PERSONAS[id];
    const pr = (game.profiles && game.profiles[id]) || {};
    return { ...base, name: id === 'princess' ? `${pr.name || 'ミレーユ'}姫` : (pr.name || base.name), profile: pr };
  }
  function profileText(id) {
    const p = who(id), pr = p.profile;
    const mem = (pr.memories || []).map(m => `・${m}`).join('\n') || '・（特になし）';
    return `名前: ${p.name}（${p.title}・${p.job}）\n性別: ${pr.gender || '不明'}　年齢: ${pr.age === '' || pr.age === undefined ? '不明' : pr.age + '歳'}\n性格・口調: ${pr.personality || p.voice}\n記憶:\n${mem}`;
  }
  function heroText() {
    const h = hero(), pr = game.profiles.hero || {};
    return `${h.name}（${JOBS[h.job].name}。性別: ${pr.gender || '秘密'}${pr.age ? `、${pr.age}歳` : ''}${pr.personality ? `。人柄: ${pr.personality}` : ''}）`;
  }

  // 起動時に Claude が使えるか確かめる（使えない環境では何もしない）
  function init() {
    loadCfg();
    updateBadge();
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

  // ---------- AIの接続先（Claude上の仕組み／各社のAPI） ----------
  const PROVIDERS = {
    anthropic: { label: 'Claude（Anthropic API）', model: 'claude-haiku-5-5', keyHint: 'sk-ant-…', site: 'console.anthropic.com' },
    openai:    { label: 'ChatGPT（OpenAI API）', model: 'gpt-5.6-luna', keyHint: 'sk-…', site: 'platform.openai.com' },
    xai:       { label: 'Grok（xAI API）', model: 'grok-4.7', keyHint: 'xai-…', site: 'console.x.ai' },
  };
  const CFG_KEY = 'nazo_no_doukutsu_ai';
  let cfg = { provider: 'auto', keys: {}, models: {}, remember: false };

  function loadCfg() {
    for (const st of [() => sessionStorage, () => localStorage]) {
      try {
        const raw = st().getItem(CFG_KEY);
        if (raw) { cfg = Object.assign(cfg, JSON.parse(raw)); return; }
      } catch (e) { /* 保存先が使えない環境 */ }
    }
  }
  function saveCfg() {
    const data = JSON.stringify(cfg);
    try { sessionStorage.setItem(CFG_KEY, data); } catch (e) {}
    try { if (cfg.remember) localStorage.setItem(CFG_KEY, data); else localStorage.removeItem(CFG_KEY); } catch (e) {}
  }

  // いま実際に使う接続先（使えなければ null）
  function activeProvider() {
    if (cfg.provider === 'off') return null;
    if (cfg.provider === 'auto') return sample && !disabledReason ? 'builtin' : null;
    return cfg.keys[cfg.provider] ? cfg.provider : null;
  }
  function aiReady() { return !!activeProvider(); }
  function providerLabel() {
    const p = activeProvider();
    return p === 'builtin' ? 'Claude' : p ? PROVIDERS[p].label.split('（')[0] : '';
  }

  // AIに尋ねる。onText があれば途中経過も受け取る
  async function askAI(prompt, opts = {}) {
    const p = activeProvider();
    if (!p) throw { code: 'no_ai' };
    if (p === 'builtin') {
      const res = await sample(prompt, { modelTier: 'quick', cache: false, signal: opts.signal, onText: opts.onText });
      return (res && res.text) || '';
    }
    const key = cfg.keys[p];
    const model = (cfg.models[p] || PROVIDERS[p].model).trim();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    if (opts.signal) opts.signal.addEventListener('abort', () => ctrl.abort());
    try {
      let res, data;
      if (p === 'anthropic') {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: ctrl.signal,
          headers: {
            'content-type': 'application/json', 'x-api-key': key,
            'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({ model, max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
        });
        data = await res.json().catch(() => ({}));
        if (!res.ok) throw { code: 'api_error', status: res.status, message: (data.error && data.error.message) || res.statusText };
        return (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
      }
      const url = p === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
      res = await fetch(url, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok) throw { code: 'api_error', status: res.status, message: (data.error && (data.error.message || data.error)) || res.statusText };
      const msg = data.choices && data.choices[0] && data.choices[0].message;
      return (msg && msg.content) || '';
    } catch (e) {
      if (e && e.code) throw e;
      throw { code: 'network', message: e && e.name === 'AbortError' ? '時間切れ' : 'つながらない（ブラウザからの接続が許可されていない可能性）' };
    } finally {
      clearTimeout(timer);
    }
  }

  function errText(e) {
    if (!e) return '不明なエラー';
    if (e.status === 401 || e.status === 403) return 'APIキーが正しくないか、権限がありません';
    if (e.status === 404) return 'モデル名が見つかりません（AI設定でモデル名を確かめてください）';
    if (e.status === 429) return '使いすぎか残高不足です';
    return `${e.status ? e.status + ' ' : ''}${String(e.message || e.code).slice(0, 80)}`;
  }

  function updateBadge() {
    const b = $('chat-mode');
    if (!b) return;
    b.textContent = aiReady() ? `AI：${providerLabel()}` : '会話';
    b.title = aiReady() ? `${providerLabel()} が仲間の言葉を考えます` : 'メニューの「AI設定」でAIにつなげます';
    b.classList.toggle('on', aiReady());
  }

  // ---------- AI設定の画面 ----------
  function openSettings(fromTitle) {
    const inClaude = !!sample;
    const prov = cfg.provider;
    const ext = PROVIDERS[prov];
    const hasKey = ext && cfg.keys[prov];
    const html = `
      <div class="profile-form">
        <label>使うAI
          <select id="ai-provider">
            <option value="auto" ${prov === 'auto' ? 'selected' : ''}>自動（Claude上で開いた時はClaude）</option>
            ${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${prov === k ? 'selected' : ''}>${v.label}</option>`).join('')}
            <option value="off" ${prov === 'off' ? 'selected' : ''}>使わない（決まった台詞）</option>
          </select>
        </label>
        ${ext ? `
        <label>APIキー ${hasKey ? '<span class="ok-mark">設定済み</span>' : ''}
          <input id="ai-key" type="password" autocomplete="off" spellcheck="false" placeholder="${hasKey ? '（変える時だけ入力）' : ext.keyHint}">
        </label>
        <label>モデル名<input id="ai-model" value="${esc(cfg.models[prov] || ext.model)}" spellcheck="false"></label>
        <label class="check"><input id="ai-remember" type="checkbox" ${cfg.remember ? 'checked' : ''}> このブラウザにキーを覚えさせる（外すと、タブを閉じた時に消えます）</label>
        <div class="warn">
          ・キーはこの端末のブラウザにだけ保存し、選んだAI会社（${ext.site}）以外には送りません。<br>
          ・料金はキーの持ち主に請求されます。キーは他人に教えないでください。<br>
          ・共用のパソコンでは「覚えさせる」を付けないでください。<br>
          ${inClaude ? '・Claude上のプレビューでは外部のAPIにつながりません。「自動」を選んでください。<br>' : ''}
          ・つながらない時は、そのAI会社がブラウザからの接続を許していない可能性があります。
        </div>` : `<div class="dim2">${prov === 'auto' ? (inClaude ? 'いまはClaude上で開いているので、Claudeが答えます。' : 'いまはClaude上ではないため、決まった台詞で答えます。各社のAPIキーを持っていれば、上で選んでつなげます。') : '仲間は決まった台詞で答えます。'}</div>`}
        <div class="shop-row-btns">
          <button class="shop-btn" id="ai-save">保存する</button>
          ${ext ? '<button class="shop-btn" id="ai-test">接続テスト</button>' : ''}
          ${hasKey ? '<button class="shop-btn" id="ai-clear">キーを消す</button>' : ''}
        </div>
        <div id="ai-test-result" class="dim2"></div>
      </div>`;
    openShop('[ AI設定 ]', html);
    const apply = () => {
      cfg.provider = $('ai-provider').value;
      if (ext && cfg.provider === prov) {
        const k = $('ai-key').value.trim();
        if (k) cfg.keys[prov] = k.slice(0, 300);
        const m = $('ai-model').value.trim();
        if (m) cfg.models[prov] = m.slice(0, 80);
        cfg.remember = $('ai-remember').checked;
      }
      saveCfg();
      updateBadge();
    };
    $('ai-provider').addEventListener('change', () => { apply(); openSettings(fromTitle); });
    $('ai-save').addEventListener('click', () => { apply(); Sound.sfx('chest'); $('ai-test-result').textContent = '保存しました。'; });
    $('ai-clear')?.addEventListener('click', () => { delete cfg.keys[prov]; saveCfg(); updateBadge(); openSettings(fromTitle); });
    $('ai-test')?.addEventListener('click', async () => {
      apply();
      const out = $('ai-test-result');
      out.textContent = 'つないでいます…';
      try {
        const t = await askAI('「接続できました」とだけ日本語で答えてください。');
        out.textContent = `成功：${String(t).slice(0, 60)}`;
      } catch (e) {
        out.textContent = `失敗：${errText(e)}`;
      }
    });
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
    const rows = `<div class="dim2 talk-note">${aiReady() ? `仲間と自由に会話できます（${providerLabel()} が答えます）` : '仲間と会話できます。<br>メニューの「AI設定」でAIにつなぐと、どんな話題にも自由に答えてくれます。'}</div>
      <div class="member-picker">${ps.map(id => {
        const m = game.party.find(x => x.companion === id);
        const face = id === 'princess' ? Art.princessInline(28) : faceOf(m, 28);
        return `<button class="pick-btn" data-talk="${id}">${face}<span>${esc(who(id).name)}<small>${PERSONAS[id].job}</small></span></button>`;
      }).join('')}</div>`;
    openShop('[ はなす ]', rows);
    document.querySelectorAll('[data-talk]').forEach(b => b.addEventListener('click', () => { closeShop(); open(b.dataset.talk); }));
  }

  function open(id) {
    current = id;
    game.inputEnabled = false;
    const p = who(id);
    const m = game.party.find(x => x.companion === id);
    $('chat-face').innerHTML = id === 'princess' ? Art.princessInline(40) : faceOf(m, 40);
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
    const id = current;
    current = null;
    if (id) rememberTalk(id);
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
    const pr = game.profiles[id];
    if (pr && pr.personality !== DEFAULT_PROFILES[id].personality) return `${h.name}、どうしたの？`;
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
    const party = game.party.map(m => `${m.name}（${JOBS[m.job].name} LV${m.lv} HP${m.hp}/${m.maxHp} MP${m.mp}/${getMaxMp(m)}${m.hp <= 0 ? ' 倒れている' : ''}${m.poisoned ? ' 毒' : ''} 装備:${weaponOf(m).name}・${clothesOf(m).name}${armorOf(m) ? '・' + armorOf(m).name : ''}${accOf(m) ? '・' + accOf(m).name : ''}）`).join('、');
    const progress = f.princessRescued ? '竜を倒し、姫を救出した。あとは町の城へ姫を連れ帰るだけ。'
      : f.bossDefeated ? '暗黒竜ヴォルガンを倒した。B5Fの牢に姫がいる。'
      : f.golemDefeated ? 'B3Fの門番ゴーレムを倒した。竜はB5Fにいる。B4Fには職業ごとの伝説の武器が眠っている。'
      : (f.deepest || 0) > 0 ? `洞窟はB${f.deepest}Fまで進んだ。B3Fには門番ゴーレムがいる。竜はB5F。`
      : 'まだ洞窟に入っていない。洞窟は町の外、南東の岩山の中（橋を渡り、山の切れ目を抜けた先）。';
    const items = game.items.map(it => `${CONSUMABLES[it.id].name}×${it.count}`).join('・') || 'なし';
    return `現在地: ${where}\n一行: ${party}\n所持金: ${game.gold}ペリカ\n道具: ${items}\n進み具合: ${progress}`;
  }

  function buildPrompt(id, userText) {
    const p = who(id);
    const h = hero();
    const past = history[id].slice(-11, -1).map(x => `${x.role === 'user' ? h.name : p.name}: ${x.text}`).join('\n');
    return `あなたはレトロ風RPG「謎の洞窟」に登場する${p.title}の${p.name}（${p.job}）として、主人公と会話します。
【あなたの設定】
${profileText(id)}
【主人公】${heroText()}
【世界】山あいの小さな王国。暗黒竜ヴォルガンが城を襲いミレーユ姫をさらった。竜は町の外の謎の洞窟（地下5階）の最深部に棲む。洞窟には竜が守る秘宝「竜の瞳」もある。通貨はペリカ。町には城・宿屋・魔法屋・武器屋・防具屋・道具屋のほか、池のほとりの温泉「竜の湯」と屋台通りがある。ミチビキ/導きの灯で出口や階段への最短の道を照らせ、エスケプ/帰還の糸で洞窟から出られ、テレポ/転移の石で行ったことのある階へ飛べる。倒れた仲間は宿屋・リザレク・復活の葉で起こせる。
【いまの状況】
${situation()}
【これまでの会話】
${past || '（なし）'}
【ルール】
・${p.name}として、日本語で1〜3文、80字以内で答える。台詞だけを書き、名前や括弧、記号の飾り、マークダウンは付けない。
・設定の性別・年齢・性格・口調を守り、記憶にある出来事は自分の体験として覚えている。記憶にないことを体験したふりはしない。
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
        const t = await askAI(buildPrompt(id, text), {
          signal: abort.signal,
          onText: ({ text: tt }) => { if (current === id) { bubble.classList.remove('thinking'); bubble.textContent = tt; scroll(); } },
        });
        answer = cleanup(t);
      } catch (e) {
        if (e && (e.code === 'api_error' || e.code === 'network')) {
          answer = offlineReply(id, text) + `（AIにつながりませんでした：${errText(e)}）`;
        } else if (e && e.code === 'not_granted') {
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

  // 会話を終えた時、その内容を記憶に一文で残す（Claude を使える時だけ）
  async function rememberTalk(id) {
    const lines = history[id] || [];
    const fresh = lines.slice(lines.lastSummarized || 0);
    if (!aiReady() || fresh.filter(x => x.role === 'user').length < 2) return;
    lines.lastSummarized = lines.length;
    const p = who(id), h = hero();
    const convo = fresh.map(x => `${x.role === 'user' ? h.name : p.name}: ${x.text}`).join('\n');
    try {
      const res = await askAI(`次の会話を、${p.name}の視点から「記憶」として日本語の一文（30字以内、です・ます調にしない、「〜と話した」「〜を知った」などの形）に要約してください。要約だけを書くこと。\n\n${convo}`, {});
      const t = cleanup(res).replace(/[。]$/, '').slice(0, 60);
      if (t) addMemory(id, t);
    } catch (e) { /* 記憶に残せなくても会話には影響しない */ }
  }

  // 温泉・屋台などでの掛け合い
  const SCENE_LINES = {
    onsen: {
      ares: 'ふう…生き返るな。姫様にも、この湯に浸かってもらいたいもんだ。',
      rina: 'ちょ、ちょっと！ こっち見ないでよね！ …でも、いいお湯。',
      sera: '温かい…。旅の疲れが、溶けていくようです。',
      jin: 'へへ、湯上がりの一杯は格別だぜ。',
      princess: '城の湯殿より、ずっと心が安らぎますわ。',
    },
    food: {
      ares: 'うまい！ これ、もう一本頼む！',
      rina: '甘いのはないの？ …あ、これ美味しいじゃない。',
      sera: '皆さんと食べると、何でも美味しく感じますね。',
      jin: 'この屋台は当たりだな。俺の舌に間違いはないぜ。',
      princess: 'こうして町を食べ歩くのは、初めてですわ。',
    },
  };
  const PLACE = { onsen: '町の温泉「竜の湯」（池のほとりの露天風呂。男女は仕切りで分かれている）', food: '町の屋台通り' };

  async function scene(place, ids, narration, foodName) {
    const h = hero();
    const box = () => $('shop-content');
    const title = place === 'onsen' ? '[ 温泉「竜の湯」 ]' : '[ 屋台通り ]';
    if (!ids.length) {
      openShop(title, `<div class="dialog-text">${esc(narration)}<br>${place === 'onsen' ? 'ひとりで静かに湯に浸かった。いい湯だ…。' : 'ひとりで味わった。うまい！'}</div>`);
      return;
    }
    openShop(title, `<div class="dialog-text">${esc(narration)}</div><div class="scene-lines" id="scene-lines"><div class="dim2">${aiReady() ? '…（仲間たちが話している）' : ''}</div></div>`);
    let lines = null;
    if (aiReady()) {
      const cast = ids.map(id => profileText(id)).join('\n\n');
      const names = ids.map(id => who(id).name);
      const prompt = `レトロ風RPG「謎の洞窟」の一場面を書いてください。
【場所】${PLACE[place]}${foodName ? `。名物「${foodName}」を食べている` : ''}
【主人公】${heroText()}（主人公は話さず、聞き役）
【登場する仲間】
${cast}
【いまの状況】
${situation()}
【書き方】
・登場する仲間（${names.join('、')}）だけが話す、4〜6行の和やかな掛け合い。全員が少なくとも1回話す。
・各行は「名前：台詞」の形で、台詞は40字以内。設定の性格・口調・記憶を生かし、互いや主人公に話しかける。
・地の文、説明、マークダウンは書かない。`;
      try {
        const res = await askAI(prompt);
        lines = parseScene(res, ids);
      } catch (e) {
        if (e && e.code === 'not_granted') { disabledReason = 'not_granted'; updateBadge(); }
      }
    }
    if (!lines || !lines.length) {
      // 性格を書き換えた人物には、決まった台詞の代わりに当たり障りのない一言を
      const plain = { onsen: 'いいお湯だね。生き返るよ。', food: 'おいしい！ もう一つ食べたいな。' };
      lines = ids.map(id => ({ id, text: game.profiles[id].personality === DEFAULT_PROFILES[id].personality ? SCENE_LINES[place][id] : plain[place] }));
    }
    const wrap = $('scene-lines');
    if (!wrap) return;
    wrap.replaceChildren();
    lines.forEach((ln, i) => {
      const row = document.createElement('div');
      row.className = 'scene-line';
      row.style.animationDelay = `${i * 0.5}s`;
      const m = game.party.find(x => x.companion === ln.id);
      const face = document.createElement('span');
      face.className = 'scene-face';
      face.innerHTML = ln.id === 'princess' ? Art.princessInline(28) : faceOf(m, 28);
      const name = document.createElement('b');
      name.textContent = who(ln.id).name;
      const text = document.createElement('span');
      text.textContent = ln.text;
      row.append(face, name, text);
      wrap.appendChild(row);
    });
    void box;
  }

  function parseScene(text, ids) {
    if (!text) return null;
    const byName = {};
    ids.forEach(id => { byName[who(id).name] = id; byName[who(id).name.replace(/姫$/, '')] = id; });
    const out = [];
    for (const raw of String(text).split('\n')) {
      const m = raw.replace(/[*#`]/g, '').match(/^\s*([^:：]{1,12})\s*[:：]\s*(.+)$/);
      if (!m) continue;
      const id = byName[m[1].trim()];
      if (id) out.push({ id, text: m[2].trim().slice(0, 60) });
      if (out.length >= 6) break;
    }
    return out.length >= 2 ? out : null;
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

  return { init, bind, openTalkMenu, openSettings, aiReady, close, scene, PERSONAS };
})();

Chat.bind();
Chat.init();
