import 'dart:math';
import '../constants/game_config.dart';
import 'game_map.dart';
import 'tile_type.dart';
import 'town_map.dart';

/// game.js の createDungeonMap() を Dart に移植した再帰バックトラッキング迷路生成
GameMap generateDungeon({
  required String id,
  required bool hasStairUp,
  required bool hasStairDown,
  required bool hasBoss,
  required bool hasTreasure,
  Random? random,
}) {
  final rng = random ?? Random();
  final s = GameConfig.mapSize;

  // 全部壁で初期化
  final grid = List.generate(
    s,
    (_) => List.filled(s, TileType.wall),
  );

  // 再帰バックトラッキングで迷路を掘る
  void carve(int x, int y) {
    final dirs = [
      [0, -2], [0, 2], [-2, 0], [2, 0],
    ]..shuffle(rng);

    for (final dir in dirs) {
      final nx = x + dir[0];
      final ny = y + dir[1];
      if (nx > 0 && nx < s - 1 && ny > 0 && ny < s - 1 &&
          grid[ny][nx] == TileType.wall) {
        grid[ny - dir[1] ~/ 2][nx - dir[0] ~/ 2] = TileType.floor;
        grid[ny][nx] = TileType.floor;
        carve(nx, ny);
      }
    }
  }

  grid[1][1] = TileType.floor;
  carve(1, 1);

  // 床タイル一覧を取得
  final floors = <({int x, int y})>[];
  for (var y = 1; y < s - 1; y++) {
    for (var x = 1; x < s - 1; x++) {
      if (grid[y][x] == TileType.floor) {
        floors.add((x: x, y: y));
      }
    }
  }

  final startCell = floors.first;
  final startX = startCell.x;
  final startY = startCell.y;

  // 使用済みセルのSet
  final used = <String>{'$startX,$startY'};

  // スタート位置から遠い位置を取得してタイルを配置
  ({int x, int y}) placeFar(int fromX, int fromY) {
    final sorted = [...floors]
      ..sort((a, b) {
        final da = (a.x - fromX).abs() + (a.y - fromY).abs();
        final db = (b.x - fromX).abs() + (b.y - fromY).abs();
        return db.compareTo(da);
      });
    for (final c in sorted.take(20)) {
      final key = '${c.x},${c.y}';
      if (!used.contains(key)) {
        used.add(key);
        return c;
      }
    }
    return sorted.first;
  }

  // 上り階段
  if (hasStairUp) {
    grid[startY][startX] = TileType.stairUp;
  }

  // 下り階段
  if (hasStairDown) {
    final pos = placeFar(startX, startY);
    grid[pos.y][pos.x] = TileType.stairDown;
  }

  // ボス（B3最奥）
  if (hasBoss) {
    final pos = placeFar(startX, startY);
    grid[pos.y][pos.x] = TileType.boss;
  }

  // 宝箱（ボスより奥）
  if (hasTreasure) {
    final pos = placeFar(startX, startY);
    grid[pos.y][pos.x] = TileType.treasure;
  }

  return GameMap(
    id: id,
    grid: grid,
    startX: startX,
    startY: startY,
  );
}

/// 全マップを一括生成
Map<String, GameMap> initAllMaps({Random? random}) {
  return {
    'town':     createTownMap(),
    'dungeon1': generateDungeon(
      id: 'dungeon1',
      hasStairUp: true,
      hasStairDown: true,
      hasBoss: false,
      hasTreasure: false,
      random: random,
    ),
    'dungeon2': generateDungeon(
      id: 'dungeon2',
      hasStairUp: true,
      hasStairDown: true,
      hasBoss: false,
      hasTreasure: false,
      random: random,
    ),
    'dungeon3': generateDungeon(
      id: 'dungeon3',
      hasStairUp: true,
      hasStairDown: false,
      hasBoss: true,
      hasTreasure: true,
      random: random,
    ),
  };
}
