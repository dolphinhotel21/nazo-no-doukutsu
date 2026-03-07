import '../models/spell.dart';

/// game.js の SPELLS / MAGIC_SHOP_LIST を完全移植
class SpellData {
  SpellData._();

  static const Map<String, Spell> all = {
    'fire': Spell(
      id: 'fire',
      name: 'ファイア',
      type: 'attack',
      mp: 4,
      desc: '敵1体に中ダメージ（DEF無視）',
      jobs: ['mage', 'thief'],
    ),
    'blizzard': Spell(
      id: 'blizzard',
      name: 'ブリザード',
      type: 'attack',
      mp: 4,
      desc: '敵1体に中ダメージ',
      jobs: ['mage'],
    ),
    'thunder': Spell(
      id: 'thunder',
      name: 'サンダー',
      type: 'attack',
      mp: 6,
      desc: '敵1体に高ダメージ',
      jobs: ['mage'],
    ),
    'heal': Spell(
      id: 'heal',
      name: 'ヒール',
      type: 'heal',
      mp: 3,
      desc: 'HPを小回復（+20〜30）',
      jobs: ['priest', 'mage'],
    ),
    'fullheal': Spell(
      id: 'fullheal',
      name: 'フルヒール',
      type: 'heal',
      mp: 8,
      desc: 'HPを大回復（+60〜80）',
      jobs: ['priest'],
    ),
    'protect': Spell(
      id: 'protect',
      name: 'プロテクト',
      type: 'buff',
      mp: 4,
      desc: '次の被ダメージを50%軽減',
      jobs: ['priest'],
    ),
    'poison': Spell(
      id: 'poison',
      name: 'ポイズン',
      type: 'debuff',
      mp: 3,
      desc: '敵に毒を与える（毎ターンダメージ）',
      jobs: ['thief', 'mage'],
    ),
    'smoke': Spell(
      id: 'smoke',
      name: 'スモーク',
      type: 'escape',
      mp: 2,
      desc: '逃走成功率100%',
      jobs: ['thief'],
    ),
  };

  /// 魔法ショップ販売リスト（game.js の MAGIC_SHOP_LIST に準拠）
  static const List<MagicShopEntry> shopList = [
    MagicShopEntry(spellId: 'blizzard', price: 200),
    MagicShopEntry(spellId: 'thunder',  price: 400),
    MagicShopEntry(spellId: 'fullheal', price: 350),
    MagicShopEntry(spellId: 'poison',   price: 150),
    MagicShopEntry(spellId: 'smoke',    price: 100),
  ];

  static Spell get(String id) => all[id]!;
}
