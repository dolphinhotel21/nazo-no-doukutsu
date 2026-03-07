import '../constants/game_config.dart';
import 'game_map.dart';
import 'tile_type.dart';

/// game.js の createTownMap() を Dart に移植した固定町マップ生成
GameMap createTownMap() {
  final s = GameConfig.mapSize;

  // 全部壁で初期化
  final grid = List.generate(
    s,
    (_) => List.filled(s, TileType.wall),
  );

  // 外壁を残して内部を床に
  for (var y = 1; y < s - 1; y++) {
    for (var x = 1; x < s - 1; x++) {
      grid[y][x] = TileType.floor;
    }
  }

  // 施設配置（game.jsに準拠）
  grid[3][3]   = TileType.house;           // 家
  grid[3][10]  = TileType.inn;             // 宿屋
  grid[3][18]  = TileType.magicShop;       // 魔法ショップ
  grid[10][5]  = TileType.weaponShop;      // 武器屋
  grid[10][12] = TileType.armorShop;       // 防具屋
  grid[10][19] = TileType.itemShop;        // 道具屋
  grid[22][12] = TileType.dungeonEntrance; // ダンジョン入口

  // プレイヤースタート位置（家の右隣）
  const startX = 4;
  const startY = 3;

  return GameMap(
    id: 'town',
    grid: grid,
    startX: startX,
    startY: startY,
    dungeonEntranceX: 12,
    dungeonEntranceY: 22,
  );
}
