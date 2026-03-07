import 'tile_type.dart';

/// マップデータ構造
class GameMap {
  final String id;
  final List<List<TileType>> grid; // grid[y][x]
  final int startX;
  final int startY;
  /// ダンジョン入口のX座標（町マップ用）
  final int? dungeonEntranceX;
  final int? dungeonEntranceY;

  GameMap({
    required this.id,
    required this.grid,
    required this.startX,
    required this.startY,
    this.dungeonEntranceX,
    this.dungeonEntranceY,
  });

  int get size => grid.length;

  TileType getTile(int x, int y) {
    if (x < 0 || y < 0 || x >= size || y >= size) return TileType.wall;
    return grid[y][x];
  }

  void setTile(int x, int y, TileType type) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    grid[y][x] = type;
  }
}
