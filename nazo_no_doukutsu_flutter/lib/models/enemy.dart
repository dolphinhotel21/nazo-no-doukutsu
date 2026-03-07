/// 敵データクラス
class EnemyTemplate {
  final String name;
  final int hp;
  final int atk;
  final int def;
  final int exp;
  final int gold;
  final String type;     // slime / bat / goblin / undead / snake / orc / dark / beast / boss
  final String? special; // null / 'poison' / 'breath'

  const EnemyTemplate({
    required this.name,
    required this.hp,
    required this.atk,
    required this.def,
    required this.exp,
    required this.gold,
    required this.type,
    this.special,
  });

  /// バトル用にコピーを生成（HPを独立させる）
  EnemyInstance toInstance() => EnemyInstance(template: this, currentHp: hp);
}

/// バトル中の敵インスタンス（HPが変化する）
class EnemyInstance {
  final EnemyTemplate template;
  int currentHp;
  bool isPoisoned = false;

  EnemyInstance({required this.template, required this.currentHp});

  String get name => template.name;
  int get maxHp   => template.hp;
  int get atk     => template.atk;
  int get def     => template.def;
  int get exp     => template.exp;
  int get gold    => template.gold;
  String get type => template.type;
  String? get special => template.special;

  bool get isDead => currentHp <= 0;
}
