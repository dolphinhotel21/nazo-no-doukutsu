import 'dart:math';
import '../constants/game_config.dart';

/// ランダムエンカウント判定（game.js の checkEncounter() を移植）
class EncounterLogic {
  EncounterLogic._();

  static final _rng = Random();

  /// 指定マップでエンカウントが発生するか判定
  static bool checkEncounter(String mapId) {
    double rate;
    switch (mapId) {
      case 'dungeon1': rate = GameConfig.encRateB1; break;
      case 'dungeon2': rate = GameConfig.encRateB2; break;
      case 'dungeon3': rate = GameConfig.encRateB3; break;
      default: return false; // 町はエンカウントなし
    }
    return _rng.nextDouble() < rate;
  }
}
