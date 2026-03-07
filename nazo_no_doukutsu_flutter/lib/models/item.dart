/// 消耗品定義
class ConsumableItem {
  final String id;
  final String name;
  final String effect;  // heal_20 / heal_50 / holy / antidote / mp_10
  final String desc;
  final int price;
  final int sellPrice;

  const ConsumableItem({
    required this.id,
    required this.name,
    required this.effect,
    required this.desc,
    required this.price,
    required this.sellPrice,
  });
}

/// インベントリ内のアイテムスタック
class ItemStack {
  final String itemId;
  int count;

  ItemStack({required this.itemId, required this.count});

  Map<String, dynamic> toJson() => {
    'itemId': itemId,
    'count': count,
  };

  factory ItemStack.fromJson(Map<String, dynamic> json) => ItemStack(
    itemId: json['itemId'] as String,
    count: json['count'] as int,
  );
}
