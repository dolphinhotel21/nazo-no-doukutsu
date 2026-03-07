import 'dart:math';
import 'package:flutter/material.dart';
import '../constants/game_config.dart';
import '../data/enemy_data.dart';
import '../models/enemy.dart';
import '../data/job_data.dart';
import '../map/dungeon_generator.dart';
import '../map/game_map.dart';
import '../map/tile_type.dart';
import '../models/player.dart';
import 'battle_logic.dart';
import 'encounter_logic.dart';
import 'save_manager.dart';

/// メッセージの種類
enum MessageType { normal, success, damage, heal, gold, warning }

/// メッセージログエントリ
class GameMessage {
  final String text;
  final MessageType type;

  const GameMessage(this.text, {this.type = MessageType.normal});
}

/// グローバルゲーム状態（ChangeNotifier）
class GameState extends ChangeNotifier {
  // ===========================
  // 画面管理
  // ===========================
  String screen = 'title'; // title / charCreate / game / ending / gameOver

  // ===========================
  // プレイヤー
  // ===========================
  late Player player;

  // ===========================
  // マップ
  // ===========================
  String currentMap = 'town';
  late Map<String, GameMap> maps;

  // 探索済みタイル（フロアごとのSet<String>、"x,y"形式）
  Map<String, Set<String>> explored = {};

  // ===========================
  // バトル状態
  // ===========================
  BattleState? battleState;

  // ===========================
  // ゲームフラグ
  // ===========================
  bool bossDefeated    = false;
  bool hasTreasure     = false;
  bool bossEncountered = false;

  // ===========================
  // メッセージログ（最新3件）
  // ===========================
  List<GameMessage> messages = [
    const GameMessage(''),
    const GameMessage(''),
    const GameMessage(''),
  ];

  // ===========================
  // 入力有効フラグ
  // ===========================
  bool inputEnabled = true;

  // ===========================
  // ショップ/メニュー表示フラグ
  // ===========================
  bool showShop  = false;
  bool showMenu  = false;
  String shopType = ''; // inn / magic / weapon / armor / item

  // ===========================
  // 全マップ初期化
  // ===========================
  void initMaps() {
    maps = initAllMaps();
    explored = {
      'town':     <String>{},
      'dungeon1': <String>{},
      'dungeon2': <String>{},
      'dungeon3': <String>{},
    };
  }

  // ===========================
  // 新規ゲーム開始
  // ===========================
  void startNewGame(String name, String jobId) {
    final job = JobData.get(jobId);
    player = Player(
      name:      name,
      job:       jobId,
      jobName:   job.name,
      hp:        job.baseHp,
      maxHp:     job.baseHp,
      mp:        job.baseMp,
      maxMp:     job.baseMp,
      baseAtk:   job.baseAtk,
      baseDef:   job.baseDef,
      weaponId:  job.initialWeaponId,
      armorId:   'cloth',
      spells:    List<String>.from(job.initialSpells),
      gold:      100,
    );

    initMaps();
    currentMap = 'town';
    player.x = maps['town']!.startX;
    player.y = maps['town']!.startY;
    bossDefeated    = false;
    hasTreasure     = false;
    bossEncountered = false;

    _markExplored();
    messages = [
      const GameMessage(''),
      const GameMessage(''),
      GameMessage('$nameの冒険が始まった！', type: MessageType.success),
    ];
    screen = 'game';
    inputEnabled = true;
    notifyListeners();
  }

  // ===========================
  // メッセージ追加
  // ===========================
  void addMessage(String msg, {MessageType type = MessageType.normal}) {
    messages = [
      messages[1],
      messages[2],
      GameMessage(msg, type: type),
    ];
    notifyListeners();
  }

  // ===========================
  // プレイヤー移動
  // ===========================
  void movePlayer(int dx, int dy) {
    if (!inputEnabled || screen != 'game') return;

    final nx = player.x + dx;
    final ny = player.y + dy;
    final mapData = maps[currentMap]!;

    if (nx < 0 || ny < 0 || nx >= GameConfig.mapSize || ny >= GameConfig.mapSize) {
      return;
    }

    final cell = mapData.getTile(nx, ny);
    if (cell == TileType.wall) {
      addMessage('壁があって進めない。');
      return;
    }

    player.x = nx;
    player.y = ny;
    _markExplored();
    _handleTileEvent(cell);
  }

  // 視野内を探索済みに登録
  void _markExplored() {
    final exp = explored[currentMap] ??= <String>{};
    final r = GameConfig.fogRadius;
    for (var dy = -r; dy <= r; dy++) {
      for (var dx = -r; dx <= r; dx++) {
        final ax = player.x + dx;
        final ay = player.y + dy;
        if (ax >= 0 && ay >= 0 && ax < GameConfig.mapSize && ay < GameConfig.mapSize) {
          exp.add('$ax,$ay');
        }
      }
    }
  }

  // タイルイベント処理
  void _handleTileEvent(TileType cell) {
    switch (cell) {
      case TileType.house:
        if (currentMap == 'town' && hasTreasure) {
          // ゲームクリア
          inputEnabled = false;
          screen = 'ending';
          notifyListeners();
          return;
        } else if (currentMap == 'town') {
          addMessage('家だ。ゴールを目指して冒険しよう！');
        }

      case TileType.inn:
        openShop('inn');
        return;

      case TileType.magicShop:
        openShop('magic');
        return;

      case TileType.weaponShop:
        openShop('weapon');
        return;

      case TileType.armorShop:
        openShop('armor');
        return;

      case TileType.itemShop:
        openShop('item');
        return;

      case TileType.dungeonEntrance:
        changeMap('dungeon1');
        addMessage('ダンジョンに入った！ 慎重に進め。', type: MessageType.warning);
        return;

      case TileType.stairDown:
        if (currentMap == 'dungeon1') {
          changeMap('dungeon2');
          addMessage('B2Fへ降りた。', type: MessageType.warning);
        } else if (currentMap == 'dungeon2') {
          changeMap('dungeon3');
          addMessage('B3Fへ降りた！ ボスが待ち構えている...', type: MessageType.damage);
        }
        return;

      case TileType.stairUp:
        if (currentMap == 'dungeon1') {
          changeMap('town');
          addMessage('町へ戻った。', type: MessageType.success);
        } else if (currentMap == 'dungeon2') {
          changeMap('dungeon1');
          addMessage('B1Fへ戻った。', type: MessageType.success);
        } else if (currentMap == 'dungeon3') {
          changeMap('dungeon2');
          addMessage('B2Fへ戻った。', type: MessageType.success);
        }
        return;

      case TileType.boss:
        if (!bossEncountered) {
          bossEncountered = true;
          addMessage('暗黒竜ヴォルガン が現れた！', type: MessageType.damage);
          startBattle(isBoss: true);
          return;
        } else if (bossDefeated) {
          addMessage('ボスはすでに倒されている。');
        }

      case TileType.treasure:
        if (!bossDefeated) {
          addMessage('何かに阻まれて宝箱を開けられない...', type: MessageType.warning);
        } else if (!hasTreasure) {
          hasTreasure = true;
          addMessage('伝説の秘宝を手に入れた！！', type: MessageType.gold);
          addMessage('町の家に戻ろう！', type: MessageType.success);
          // 宝箱タイルを床に変更
          maps[currentMap]!.setTile(player.x, player.y, TileType.floor);
        } else {
          addMessage('もうすでに秘宝を持っている。');
        }

      default:
        break;
    }

    // ランダムエンカウント（ダンジョンのみ）
    if (EncounterLogic.checkEncounter(currentMap)) {
      startBattle(isBoss: false);
      return;
    }

    // 毒ダメージ
    if (player.isPoisoned) {
      final dmg = max(1, (player.maxHp * 0.05).floor());
      player.hp = max(1, player.hp - dmg);
      addMessage('毒のダメージ！ $dmgダメージ', type: MessageType.damage);
      if (player.hp <= 0) {
        player.hp = 0;
        _triggerGameOver();
        return;
      }
    }

    notifyListeners();
  }

  // ===========================
  // マップ移動
  // ===========================
  void changeMap(String targetMap) {
    final prevMap = currentMap;
    currentMap = targetMap;
    final mapData = maps[targetMap]!;

    if (targetMap == 'town') {
      if (prevMap != 'town') {
        // ダンジョンから戻った場合はダンジョン入口の前
        player.x = maps['town']!.dungeonEntranceX ?? mapData.startX;
        player.y = maps['town']!.dungeonEntranceY ?? mapData.startY;
      } else {
        player.x = mapData.startX;
        player.y = mapData.startY;
      }
    } else {
      player.x = mapData.startX;
      player.y = mapData.startY;
    }

    _markExplored();
    notifyListeners();
  }

  // ===========================
  // バトル開始
  // ===========================
  void startBattle({required bool isBoss}) {
    inputEnabled = false;

    final EnemyTemplate template;
    if (isBoss) {
      template = EnemyData.boss;
    } else {
      final pool = EnemyData.getPool(currentMap);
      template = pool[Random().nextInt(pool.length)];
    }

    battleState = BattleState(
      enemy: template.toInstance(),
      isBoss: isBoss,
    );

    notifyListeners();
  }

  // ===========================
  // バトル終了
  // ===========================
  void endBattleWin() {
    final state = battleState;
    if (state == null || state.ended) return;
    state.ended = true;

    final e = state.enemy;
    player.exp  += e.exp;
    player.gold += e.gold;

    if (state.isBoss) {
      bossDefeated = true;
      maps[currentMap]!.setTile(player.x, player.y, TileType.floor);
    }

    // レベルアップ
    BattleLogic.checkLevelUp(player, state);

    notifyListeners();
  }

  void endBattleLose() {
    final state = battleState;
    if (state == null || state.ended) return;
    state.ended = true;
    player.hp = 0;
    notifyListeners();
  }

  void endBattleEscape() {
    final state = battleState;
    if (state == null || state.ended) return;
    state.ended = true;
    notifyListeners();
  }

  /// バトルオーバーレイを閉じてゲームに戻る
  void closeBattle() {
    final wasBoss = battleState?.isBoss ?? false;
    final wasWin  = battleState?.ended ?? false;
    final wasLose = (player.hp <= 0);
    battleState = null;
    inputEnabled = true;

    if (wasLose && player.hp <= 0) {
      _triggerGameOver();
      return;
    }

    if (wasBoss && wasWin) {
      addMessage('ボスを倒した！ 宝箱を手に入れよう！', type: MessageType.gold);
    }

    notifyListeners();
  }

  void _triggerGameOver() {
    inputEnabled = false;
    screen = 'gameOver';
    notifyListeners();
  }

  // ===========================
  // ショップ
  // ===========================
  void openShop(String type) {
    inputEnabled = false;
    shopType = type;
    showShop = true;
    notifyListeners();
  }

  void closeShop() {
    showShop = false;
    shopType = '';
    inputEnabled = true;
    notifyListeners();
  }

  // ===========================
  // メニュー
  // ===========================
  void toggleMenu() {
    showMenu = !showMenu;
    inputEnabled = !showMenu;
    notifyListeners();
  }

  // ===========================
  // 装備変更ヘルパー
  // ===========================
  void equipWeapon(String weaponId) {
    player.weaponId = weaponId;
    notifyListeners();
  }

  void equipArmor(String armorId) {
    player.armorId = armorId;
    // 防具MPボーナスを反映
    final newMaxMp = BattleLogic.getMaxMp(player);
    if (player.mp > newMaxMp) player.mp = newMaxMp;
    notifyListeners();
  }

  // ===========================
  // 魔法習得
  // ===========================
  void learnSpell(String spellId) {
    if (!player.spells.contains(spellId)) {
      player.spells.add(spellId);
      notifyListeners();
    }
  }

  // ===========================
  // セーブ・ロード
  // ===========================
  Future<void> saveGame(int slot) async {
    await SaveManager.save(slot, this);
    addMessage('スロット$slotにセーブしました。', type: MessageType.success);
  }

  Future<bool> loadGame(int slot) async {
    initMaps();
    final ok = await SaveManager.load(slot, this);
    if (ok) {
      _markExplored();
      screen = 'game';
      inputEnabled = true;
      notifyListeners();
      addMessage('ゲームをロードした。', type: MessageType.success);
    }
    return ok;
  }

  // ===========================
  // タイトルへ戻る
  // ===========================
  void goToTitle() {
    screen = 'title';
    battleState = null;
    showShop = false;
    showMenu = false;
    inputEnabled = true;
    notifyListeners();
  }

  // ===========================
  // キャラ作成画面へ
  // ===========================
  void goToCharCreate() {
    screen = 'charCreate';
    notifyListeners();
  }
}
