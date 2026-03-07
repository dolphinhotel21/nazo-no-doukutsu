import 'dart:math';
import '../constants/game_config.dart';
import '../data/equipment_data.dart';
import '../data/item_data.dart';
import '../data/job_data.dart';
import '../data/spell_data.dart';
import '../models/enemy.dart';
import '../models/item.dart';
import '../models/player.dart';

/// バトルログエントリ
class BattleLogEntry {
  final String text;
  final BattleLogType type;

  const BattleLogEntry(this.text, {this.type = BattleLogType.normal});
}

enum BattleLogType { normal, damage, heal, magic, boss, gold, levelUp }

/// バトル状態
class BattleState {
  final EnemyInstance enemy;
  final bool isBoss;
  bool ended = false;
  bool playerDefending = false;
  bool protectActive = false;
  bool smokeUsed = false;
  int bossTurnCount = 0;
  final List<BattleLogEntry> log = [];
  // バトル中サブメニュー管理
  BattlePhase phase = BattlePhase.playerCommand;

  BattleState({required this.enemy, required this.isBoss});

  void addLog(String text, {BattleLogType type = BattleLogType.normal}) {
    log.add(BattleLogEntry(text, type: type));
  }
}

enum BattlePhase {
  playerCommand,
  magicSelect,
  itemSelect,
  enemyTurn,
  winDelay,
  loseDelay,
  escapeDelay,
}

enum BattleResult { win, lose, escape }

/// バトル計算ロジック（game.jsのバトル処理を完全移植）
class BattleLogic {
  static final _rng = Random();

  static int _rand(int min, int max) =>
      min + _rng.nextInt(max - min + 1);

  /// プレイヤーの実ATK（装備込み）
  static int getAtk(Player p) {
    final w = EquipmentData.getWeapon(p.weaponId);
    return p.baseAtk + w.atkBonus;
  }

  /// プレイヤーの実DEF（装備込み）
  static int getDef(Player p) {
    final a = EquipmentData.getArmor(p.armorId);
    return p.baseDef + a.defBonus;
  }

  /// プレイヤーの最大MP（防具MPボーナス込み）
  static int getMaxMp(Player p) {
    final a = EquipmentData.getArmor(p.armorId);
    return p.maxMp + a.mpBonus;
  }

  /// 通常攻撃（プレイヤー → 敵）
  /// 戻り値: [ダメージ値, 敵が死亡したか]
  static (int dmg, bool killed) playerAttack(Player p, BattleState state) {
    final e = state.enemy;
    final atk = getAtk(p);
    final base = max(1, atk - e.def);
    final dmg = max(1, (base * (0.8 + _rng.nextDouble() * 0.4)).round());
    e.currentHp -= dmg;
    if (e.currentHp < 0) e.currentHp = 0;
    state.addLog('${p.name} の攻撃！ ${e.name}に $dmgダメージ！');
    return (dmg, e.isDead);
  }

  /// 魔法使用（プレイヤー → 敵 or 自分）
  /// 戻り値: (ログテキスト, ログタイプ, 敵が死亡したか, バトル終了か)
  static (String text, BattleLogType logType, bool killed, bool ended)
  useMagic(Player p, BattleState state, String spellId) {
    final sp = SpellData.get(spellId);
    final e = state.enemy;
    final w = EquipmentData.getWeapon(p.weaponId);
    final magicMult = 1.0 + w.magicBonus;

    p.mp -= sp.mp;
    if (p.mp < 0) p.mp = 0;

    switch (sp.type) {
      case 'attack':
        int dmg;
        if (spellId == 'fire') {
          // DEF無視
          dmg = ((25 + _rand(0, 10)) * magicMult).round();
        } else if (spellId == 'blizzard') {
          dmg = max(1, ((20 + _rand(0, 10) - e.def) * magicMult).round());
        } else if (spellId == 'thunder') {
          dmg = ((35 + _rand(0, 15)) * magicMult).round();
        } else {
          dmg = 20;
        }
        e.currentHp -= dmg;
        if (e.currentHp < 0) e.currentHp = 0;
        state.addLog('${sp.name}！ ${e.name}に $dmgダメージ！',
            type: BattleLogType.magic);
        return ('${sp.name}！ ${e.name}に $dmgダメージ！',
            BattleLogType.magic, e.isDead, false);

      case 'heal':
        int amount;
        if (spellId == 'heal') {
          amount = _rand(20, 30);
        } else if (spellId == 'fullheal') {
          amount = _rand(60, 80);
        } else {
          amount = 20;
        }
        p.hp = min(p.maxHp, p.hp + amount);
        return ('${sp.name}！ HPが $amount回復した！',
            BattleLogType.heal, false, false);

      case 'buff':
        if (spellId == 'protect') {
          state.protectActive = true;
          return ('${sp.name}！ 次の攻撃への防御が強化された！',
              BattleLogType.magic, false, false);
        }
        return ('${sp.name}！', BattleLogType.magic, false, false);

      case 'debuff':
        if (spellId == 'poison' && !e.isPoisoned) {
          e.isPoisoned = true;
          return ('${sp.name}！ ${e.name}は毒状態になった！',
              BattleLogType.magic, false, false);
        }
        return ('${sp.name}！ しかし効果がなかった...', BattleLogType.normal, false, false);

      case 'escape':
        if (spellId == 'smoke' && !state.isBoss) {
          return ('スモーク！ 煙に紛れて逃げ出した！',
              BattleLogType.normal, false, true);
        }
        return ('スモーク！ しかしボスには効かなかった！',
            BattleLogType.normal, false, false);

      default:
        return ('${sp.name}！', BattleLogType.magic, false, false);
    }
  }

  /// アイテム使用（バトル中）
  static (String text, BattleLogType logType, bool killed)
  useItem(Player p, BattleState state, String itemId) {
    final cons = ItemData.get(itemId);
    final e = state.enemy;

    _consumeItem(p, itemId);

    switch (cons.effect) {
      case 'heal_20':
        p.hp = min(p.maxHp, p.hp + 20);
        return ('薬草を使った！ HPが20回復した！', BattleLogType.heal, false);

      case 'heal_50':
        p.hp = min(p.maxHp, p.hp + 50);
        return ('上薬草を使った！ HPが50回復した！', BattleLogType.heal, false);

      case 'holy':
        if (e.template.type == 'undead') {
          final dmg = _rand(60, 80);
          e.currentHp -= dmg;
          if (e.currentHp < 0) e.currentHp = 0;
          return ('聖水！ ${e.name}に $dmgの大ダメージ！',
              BattleLogType.damage, e.isDead);
        }
        return ('聖水を使った！ しかし効果がなかった...', BattleLogType.normal, false);

      case 'antidote':
        p.isPoisoned = false;
        return ('毒消し草を使った！ 毒が治った！', BattleLogType.heal, false);

      case 'mp_10':
        p.mp = min(getMaxMp(p), p.mp + 10);
        return ('エーテルを使った！ MPが10回復した！', BattleLogType.magic, false);

      default:
        return ('${cons.name}を使った！', BattleLogType.normal, false);
    }
  }

  /// ぼうぎょコマンド
  static void playerDefend(Player p, BattleState state) {
    state.playerDefending = true;
    state.addLog('${p.name} はぼうぎょ態勢に入った！');
  }

  /// 逃走コマンド
  /// 戻り値: 逃走成功したか
  static bool playerRun(Player p, BattleState state) {
    if (state.isBoss) return false;

    final job = JobData.get(p.job);
    final armor = EquipmentData.getArmor(p.armorId);
    final weapon = EquipmentData.getWeapon(p.weaponId);
    final baseRate = p.job == 'thief'
        ? GameConfig.escapeRateThief
        : GameConfig.escapeRateNormal;
    final rate = (baseRate + job.escapeBonus + armor.escapeBonus + weapon.escapeBonus)
        .clamp(0.0, 1.0);

    return _rng.nextDouble() < rate;
  }

  /// 敵のターン処理
  /// 戻り値: (ダメージ量, プレイヤーが死亡したか)
  static (int dmg, bool playerDied) enemyTurn(Player p, BattleState state) {
    final e = state.enemy;
    state.bossTurnCount++;

    // 敵の毒ダメージ
    if (e.isPoisoned) {
      final poisonDmg = max(1, (e.maxHp * 0.05).floor());
      e.currentHp -= poisonDmg;
      if (e.currentHp < 0) e.currentHp = 0;
      state.addLog('${e.name}は毒のダメージを受けた！ $poisonDmgダメージ',
          type: BattleLogType.magic);
      if (e.isDead) return (0, false);
    }

    int dmg;
    // ボス特殊攻撃（3ターンに1回）
    if (state.isBoss && state.bossTurnCount % 3 == 0) {
      final base = _rand(40, 60);
      dmg = state.playerDefending ? (base * 0.5).floor() : base;
      if (state.protectActive) {
        dmg = (dmg * 0.5).floor();
        state.protectActive = false;
      }
      state.addLog('ヴォルガンの炎ブレス！！ $dmgの大ダメージ！',
          type: BattleLogType.boss);
    } else {
      // 通常攻撃
      final base = max(1, e.atk - getDef(p));
      final raw = max(1, (base * (0.8 + _rng.nextDouble() * 0.4)).round());
      dmg = state.playerDefending ? (raw * 0.5).floor() : raw;
      if (state.protectActive) {
        dmg = (dmg * 0.5).floor();
        state.protectActive = false;
      }
      state.addLog('${e.name}の攻撃！ ${p.name}に $dmgダメージ！',
          type: BattleLogType.damage);
    }

    // 毒ヘビ特殊：30%の確率でプレイヤーを毒に
    if (e.special == 'poison' && !p.isPoisoned && _rng.nextDouble() < 0.3) {
      p.isPoisoned = true;
      state.addLog('${p.name}は毒を受けた！', type: BattleLogType.magic);
    }

    state.playerDefending = false;
    p.hp -= dmg;
    if (p.hp < 0) p.hp = 0;

    return (dmg, p.hp <= 0);
  }

  /// レベルアップ処理（game.jsのcheckLevelUp()を移植）
  /// 戻り値: レベルアップしたレベルのリスト
  static List<int> checkLevelUp(Player p, BattleState state) {
    final levelUps = <int>[];
    final job = JobData.get(p.job);

    while (p.exp >= p.expNext && p.lv < GameConfig.maxLevel) {
      p.exp -= p.expNext;
      p.lv++;
      p.expNext = p.lv * 100;

      p.maxHp   += job.growth.hp;
      p.maxMp   += job.growth.mp;
      p.baseAtk += job.growth.atk;
      p.baseDef += job.growth.def;

      // レベルアップでHP/MP全回復
      p.hp = p.maxHp;
      p.mp = getMaxMp(p);

      levelUps.add(p.lv);
      state.addLog('レベルアップ！ LV ${p.lv} になった！',
          type: BattleLogType.levelUp);
    }
    return levelUps;
  }

  // アイテムを1個消費する
  static void _consumeItem(Player p, String itemId) {
    final idx = p.items.indexWhere((i) => i.itemId == itemId);
    if (idx == -1) return;
    p.items[idx].count--;
    if (p.items[idx].count <= 0) {
      p.items.removeAt(idx);
    }
  }

  /// アイテムをインベントリに追加
  /// 戻り値: 追加できたか（満杯の場合false）
  static bool addItem(Player p, String itemId, {int count = 1}) {
    final existing = p.items.where((i) => i.itemId == itemId).firstOrNull;
    if (existing != null) {
      existing.count += count;
      return true;
    }
    final total = p.items.fold(0, (s, i) => s + i.count);
    if (total >= GameConfig.maxItems) return false;
    p.items.add(ItemStack(itemId: itemId, count: count));
    return true;
  }
}
