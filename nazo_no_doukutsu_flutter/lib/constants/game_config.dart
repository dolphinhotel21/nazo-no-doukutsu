/// ゲーム全体の設定定数
class GameConfig {
  GameConfig._();

  static const int mapSize   = 25;   // マップ1辺タイル数
  static const int viewSize  = 13;   // 画面表示タイル数（奇数）
  static const int fogRadius = 3;    // 視野半径

  static const double encRateB1 = 0.15; // B1エンカウント率
  static const double encRateB2 = 0.20; // B2エンカウント率
  static const double encRateB3 = 0.25; // B3エンカウント率

  static const double escapeRateNormal = 0.40; // 通常逃走成功率
  static const double escapeRateThief  = 0.70; // 盗賊逃走成功率

  static const int maxItems  = 20;   // アイテム最大所持数
  static const int maxLevel  = 20;   // レベル上限
  static const int saveSlots = 3;    // セーブスロット数

  static const String saveKeyPrefix = 'nazo_doukutsu_save_'; // セーブキープレフィックス

  /// マップ名の日本語表示
  static const Map<String, String> mapNames = {
    'town':     '町',
    'dungeon1': 'B1F',
    'dungeon2': 'B2F',
    'dungeon3': 'B3F',
  };
}
