import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/game_config.dart';
import '../models/player.dart';
import '../models/save_data.dart';
import 'game_state.dart';

/// セーブ/ロード管理（SharedPreferencesを使用）
class SaveManager {
  SaveManager._();

  /// 指定スロットにセーブする
  static Future<void> save(int slot, GameState state) async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now();
    final savedAt =
        '${now.year}/${_pad(now.month)}/${_pad(now.day)} ${_pad(now.hour)}:${_pad(now.minute)}';
    final mapName = GameConfig.mapNames[state.currentMap] ?? '─';

    final data = {
      'savedAt': savedAt,
      'charInfo': {
        'name':     state.player.name,
        'job':      state.player.job,
        'jobName':  state.player.jobName,
        'lv':       state.player.lv,
        'location': mapName,
      },
      'player':     state.player.toJson(),
      'currentMap': state.currentMap,
      'explored': {
        for (final entry in state.explored.entries)
          entry.key: entry.value.toList(),
      },
      'flags': {
        'bossDefeated':    state.bossDefeated,
        'hasTreasure':     state.hasTreasure,
        'bossEncountered': state.bossEncountered,
      },
    };

    await prefs.setString('${GameConfig.saveKeyPrefix}$slot', jsonEncode(data));
  }

  /// 指定スロットからロードする（成功したらtrue）
  static Future<bool> load(int slot, GameState state) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('${GameConfig.saveKeyPrefix}$slot');
    if (raw == null) return false;

    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final playerJson = data['player'] as Map<String, dynamic>;
      state.player = Player.fromJson(playerJson);
      state.currentMap = data['currentMap'] as String;

      // explored を Set<String> に変換
      final exploredRaw = data['explored'] as Map<String, dynamic>;
      state.explored = {
        for (final entry in exploredRaw.entries)
          entry.key: Set<String>.from(entry.value as List),
      };

      final flags = data['flags'] as Map<String, dynamic>;
      state.bossDefeated    = flags['bossDefeated'] as bool? ?? false;
      state.hasTreasure     = flags['hasTreasure'] as bool? ?? false;
      state.bossEncountered = flags['bossEncountered'] as bool? ?? false;

      return true;
    } catch (e) {
      return false;
    }
  }

  /// 指定スロットのセーブ情報を取得（スロット選択UI用）
  static Future<SaveSlotInfo?> getSlotInfo(int slot) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('${GameConfig.saveKeyPrefix}$slot');
    if (raw == null) return null;

    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final ci = data['charInfo'] as Map<String, dynamic>;
      return SaveSlotInfo(
        slot:     slot,
        charName: ci['name'] as String,
        jobName:  ci['jobName'] as String,
        lv:       ci['lv'] as int,
        location: ci['location'] as String,
        savedAt:  data['savedAt'] as String,
      );
    } catch (e) {
      return null;
    }
  }

  /// いずれかのスロットにデータがあるか
  static Future<bool> hasSaveData() async {
    final prefs = await SharedPreferences.getInstance();
    for (var i = 1; i <= GameConfig.saveSlots; i++) {
      if (prefs.containsKey('${GameConfig.saveKeyPrefix}$i')) return true;
    }
    return false;
  }

  /// 全スロットの情報リストを返す（空きはnull）
  static Future<List<SaveSlotInfo?>> getAllSlotInfos() async {
    return Future.wait(
      List.generate(GameConfig.saveSlots, (i) => getSlotInfo(i + 1)),
    );
  }

  static String _pad(int n) => n.toString().padLeft(2, '0');
}
