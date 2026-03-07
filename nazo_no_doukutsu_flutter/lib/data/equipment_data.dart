import '../models/equipment.dart';

/// game.js の WEAPONS / ARMORS を完全移植
class EquipmentData {
  EquipmentData._();

  /// 武器定義
  static const Map<String, Equipment> weapons = {
    'wooden_sword': Equipment(
      id: 'wooden_sword',
      name: '木の剣',
      type: 'weapon',
      atkBonus: 3,
      price: 0,
      sellPrice: 0,
      allowedJobs: ['warrior', 'thief'],
    ),
    'dagger': Equipment(
      id: 'dagger',
      name: '短剣',
      type: 'weapon',
      atkBonus: 2,
      price: 0,
      sellPrice: 0,
      allowedJobs: ['warrior', 'mage', 'priest', 'thief'],
    ),
    'thin_staff': Equipment(
      id: 'thin_staff',
      name: '細身の杖',
      type: 'weapon',
      atkBonus: 1,
      price: 0,
      sellPrice: 0,
      allowedJobs: ['warrior', 'mage', 'priest', 'thief'],
    ),
    'iron_sword': Equipment(
      id: 'iron_sword',
      name: '鉄の剣',
      type: 'weapon',
      atkBonus: 7,
      price: 150,
      sellPrice: 75,
      allowedJobs: ['warrior', 'thief'],
    ),
    'magic_staff': Equipment(
      id: 'magic_staff',
      name: '魔法の杖',
      type: 'weapon',
      atkBonus: 4,
      price: 300,
      sellPrice: 150,
      allowedJobs: ['mage', 'priest'],
      magicBonus: 0.30,
    ),
    'mithril_sword': Equipment(
      id: 'mithril_sword',
      name: 'ミスリルの剣',
      type: 'weapon',
      atkBonus: 15,
      price: 800,
      sellPrice: 400,
      allowedJobs: ['warrior'],
    ),
    'ninja_blade': Equipment(
      id: 'ninja_blade',
      name: '忍者刀',
      type: 'weapon',
      atkBonus: 10,
      price: 500,
      sellPrice: 250,
      allowedJobs: ['thief'],
      escapeBonus: 0.20,
    ),
  };

  /// 防具定義
  static const Map<String, Equipment> armors = {
    'cloth': Equipment(
      id: 'cloth',
      name: '布の服',
      type: 'armor',
      defBonus: 1,
      price: 0,
      sellPrice: 0,
      allowedJobs: ['warrior', 'mage', 'priest', 'thief'],
    ),
    'leather_armor': Equipment(
      id: 'leather_armor',
      name: '革の鎧',
      type: 'armor',
      defBonus: 4,
      price: 100,
      sellPrice: 50,
      allowedJobs: ['warrior', 'mage', 'priest', 'thief'],
    ),
    'iron_armor': Equipment(
      id: 'iron_armor',
      name: '鉄の鎧',
      type: 'armor',
      defBonus: 8,
      price: 300,
      sellPrice: 150,
      allowedJobs: ['warrior'],
    ),
    'magic_robe': Equipment(
      id: 'magic_robe',
      name: '魔法のローブ',
      type: 'armor',
      defBonus: 3,
      mpBonus: 10,
      price: 250,
      sellPrice: 125,
      allowedJobs: ['mage', 'priest'],
    ),
    'mithril_armor': Equipment(
      id: 'mithril_armor',
      name: 'ミスリル鎧',
      type: 'armor',
      defBonus: 16,
      price: 1000,
      sellPrice: 500,
      allowedJobs: ['warrior'],
    ),
    'shadow_armor': Equipment(
      id: 'shadow_armor',
      name: 'シャドウアーマー',
      type: 'armor',
      defBonus: 8,
      price: 450,
      sellPrice: 225,
      allowedJobs: ['thief'],
      escapeBonus: 0.10,
    ),
  };

  /// 武器屋の販売リスト
  static const List<String> weaponShopList = [
    'iron_sword',
    'magic_staff',
    'mithril_sword',
    'ninja_blade',
  ];

  /// 防具屋の販売リスト
  static const List<String> armorShopList = [
    'leather_armor',
    'iron_armor',
    'magic_robe',
    'mithril_armor',
    'shadow_armor',
  ];

  static Equipment getWeapon(String id) => weapons[id]!;
  static Equipment getArmor(String id)  => armors[id]!;
}
