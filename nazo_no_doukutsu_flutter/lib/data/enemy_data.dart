import '../models/enemy.dart';

/// game.js の ENEMIES を完全移植
class EnemyData {
  EnemyData._();

  // B1フロアの敵
  static const List<EnemyTemplate> b1 = [
    EnemyTemplate(name: 'スライム',   hp: 8,  atk: 4,  def: 1, exp: 5,  gold: 3,  type: 'slime'),
    EnemyTemplate(name: 'コウモリ',   hp: 10, atk: 5,  def: 2, exp: 7,  gold: 5,  type: 'bat'),
    EnemyTemplate(name: 'ゴブリン',   hp: 15, atk: 7,  def: 3, exp: 12, gold: 8,  type: 'goblin'),
  ];

  // B2フロアの敵
  static const List<EnemyTemplate> b2 = [
    EnemyTemplate(name: 'ゾンビ',     hp: 25, atk: 10, def: 4, exp: 20, gold: 15, type: 'undead'),
    EnemyTemplate(name: '毒ヘビ',     hp: 20, atk: 12, def: 3, exp: 18, gold: 12, type: 'snake',  special: 'poison'),
    EnemyTemplate(name: 'オーク',     hp: 35, atk: 14, def: 6, exp: 30, gold: 20, type: 'orc'),
  ];

  // B3フロアの敵
  static const List<EnemyTemplate> b3 = [
    EnemyTemplate(name: 'ダークウォリアー', hp: 50, atk: 18, def: 10, exp: 50, gold: 40, type: 'dark'),
    EnemyTemplate(name: '骸骨騎士',         hp: 45, atk: 20, def: 8,  exp: 45, gold: 35, type: 'undead'),
    EnemyTemplate(name: 'ケルベロス',       hp: 60, atk: 22, def: 8,  exp: 60, gold: 50, type: 'beast'),
  ];

  // ボス
  static const EnemyTemplate boss = EnemyTemplate(
    name: '暗黒竜ヴォルガン',
    hp: 200,
    atk: 30,
    def: 15,
    exp: 500,
    gold: 300,
    type: 'boss',
    special: 'breath',
  );

  /// マップIDに対応する敵プールを返す
  static List<EnemyTemplate> getPool(String mapId) {
    switch (mapId) {
      case 'dungeon1': return b1;
      case 'dungeon2': return b2;
      case 'dungeon3': return b3;
      default: return b1;
    }
  }
}
