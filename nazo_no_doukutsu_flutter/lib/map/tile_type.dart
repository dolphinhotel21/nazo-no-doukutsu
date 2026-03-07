/// マップのタイル種別
enum TileType {
  wall,            // 壁
  floor,           // 床
  stairDown,       // 下り階段
  stairUp,         // 上り階段
  house,           // 家（ゴール）
  inn,             // 宿屋
  magicShop,       // 魔法ショップ
  weaponShop,      // 武器屋
  armorShop,       // 防具屋
  itemShop,        // 道具屋
  dungeonEntrance, // ダンジョン入口
  boss,            // ボス
  treasure,        // 宝箱
}

/// game.jsのタイル文字からTileTypeへの変換
TileType tileTypeFromChar(String ch) {
  switch (ch) {
    case '#': return TileType.wall;
    case '>': return TileType.stairDown;
    case '<': return TileType.stairUp;
    case 'H': return TileType.house;
    case 'I': return TileType.inn;
    case 'M': return TileType.magicShop;
    case 'W': return TileType.weaponShop;
    case 'A': return TileType.armorShop;
    case 'T': return TileType.itemShop;
    case 'D': return TileType.dungeonEntrance;
    case 'B': return TileType.boss;
    case '\$': return TileType.treasure;
    default:  return TileType.floor;
  }
}
