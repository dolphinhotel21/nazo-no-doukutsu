/// 装備アイテムデータクラス
class Equipment {
  final String id;
  final String name;
  final int atkBonus;  // 武器のATKボーナス
  final int defBonus;  // 防具のDEFボーナス
  final int mpBonus;   // 防具のMPボーナス
  final int price;
  final int sellPrice;
  final List<String> allowedJobs; // 装備可能な職業IDリスト
  final double magicBonus;  // 魔法攻撃倍率ボーナス（魔法の杖など）
  final double escapeBonus; // 逃走率ボーナス（忍者刀など）
  final String type; // 'weapon' or 'armor'

  const Equipment({
    required this.id,
    required this.name,
    required this.type,
    this.atkBonus = 0,
    this.defBonus = 0,
    this.mpBonus = 0,
    required this.price,
    required this.sellPrice,
    required this.allowedJobs,
    this.magicBonus = 0.0,
    this.escapeBonus = 0.0,
  });

  /// この装備を指定職業が装備できるか
  bool canEquip(String job) => allowedJobs.contains(job);

  Map<String, dynamic> toJson() => {
    'id': id,
  };

  /// IDからEquipmentを復元する（EquipmentData経由で）
  static String idFromJson(Map<String, dynamic> json) => json['id'] as String;
}
