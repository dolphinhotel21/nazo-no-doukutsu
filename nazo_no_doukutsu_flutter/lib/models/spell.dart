/// 魔法データクラス
class Spell {
  final String id;
  final String name;
  final String type;   // attack / heal / buff / debuff / escape
  final int mp;
  final String desc;
  final List<String> jobs; // 初期習得職業（魔法ショップ購入は別管理）

  const Spell({
    required this.id,
    required this.name,
    required this.type,
    required this.mp,
    required this.desc,
    required this.jobs,
  });
}

/// 魔法ショップで購入できるエントリ
class MagicShopEntry {
  final String spellId;
  final int price;

  const MagicShopEntry({required this.spellId, required this.price});
}
