import '../models/item.dart';

/// game.js の CONSUMABLES / ITEM_SHOP_LIST を完全移植
class ItemData {
  ItemData._();

  static const Map<String, ConsumableItem> all = {
    'herb': ConsumableItem(
      id: 'herb',
      name: '薬草',
      effect: 'heal_20',
      desc: 'HPを20回復',
      price: 10,
      sellPrice: 5,
    ),
    'super_herb': ConsumableItem(
      id: 'super_herb',
      name: '上薬草',
      effect: 'heal_50',
      desc: 'HPを50回復',
      price: 30,
      sellPrice: 15,
    ),
    'holy_water': ConsumableItem(
      id: 'holy_water',
      name: '聖水',
      effect: 'holy',
      desc: 'アンデッド系に大ダメージ',
      price: 50,
      sellPrice: 25,
    ),
    'antidote': ConsumableItem(
      id: 'antidote',
      name: '毒消し草',
      effect: 'antidote',
      desc: '毒を治癒',
      price: 15,
      sellPrice: 7,
    ),
    'ether': ConsumableItem(
      id: 'ether',
      name: 'エーテル',
      effect: 'mp_10',
      desc: 'MPを10回復',
      price: 40,
      sellPrice: 20,
    ),
  };

  /// 道具屋の販売リスト
  static const List<String> shopList = [
    'herb',
    'super_herb',
    'holy_water',
    'antidote',
    'ether',
  ];

  static ConsumableItem get(String id) => all[id]!;
}
