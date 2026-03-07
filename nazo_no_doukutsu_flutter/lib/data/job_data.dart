/// 職業定義データ（game.js の JOBS を完全移植）
class JobGrowth {
  final int hp;
  final int mp;
  final int atk;
  final int def;

  const JobGrowth({
    required this.hp,
    required this.mp,
    required this.atk,
    required this.def,
  });
}

class JobDefinition {
  final String id;
  final String name;
  final int baseHp;
  final int baseMp;
  final int baseAtk;
  final int baseDef;
  final JobGrowth growth;
  final List<String> initialSpells;
  final String initialWeaponId;
  final double escapeBonus;
  final String description;

  const JobDefinition({
    required this.id,
    required this.name,
    required this.baseHp,
    required this.baseMp,
    required this.baseAtk,
    required this.baseDef,
    required this.growth,
    required this.initialSpells,
    required this.initialWeaponId,
    required this.escapeBonus,
    required this.description,
  });
}

class JobData {
  JobData._();

  static const Map<String, JobDefinition> all = {
    'warrior': JobDefinition(
      id: 'warrior',
      name: '戦士',
      baseHp: 40, baseMp: 5, baseAtk: 12, baseDef: 8,
      growth: JobGrowth(hp: 8, mp: 1, atk: 3, def: 2),
      initialSpells: [],
      initialWeaponId: 'wooden_sword',
      escapeBonus: 0.0,
      description: 'HP高・ATK高・魔法少',
    ),
    'mage': JobDefinition(
      id: 'mage',
      name: '魔法使い',
      baseHp: 20, baseMp: 25, baseAtk: 6, baseDef: 3,
      growth: JobGrowth(hp: 4, mp: 5, atk: 1, def: 1),
      initialSpells: ['fire', 'heal'],
      initialWeaponId: 'thin_staff',
      escapeBonus: 0.0,
      description: 'MP高・攻撃魔法強力',
    ),
    'priest': JobDefinition(
      id: 'priest',
      name: '僧侶',
      baseHp: 28, baseMp: 18, baseAtk: 7, baseDef: 6,
      growth: JobGrowth(hp: 6, mp: 4, atk: 1, def: 2),
      initialSpells: ['heal', 'protect'],
      initialWeaponId: 'thin_staff',
      escapeBonus: 0.0,
      description: '回復・補助魔法専門',
    ),
    'thief': JobDefinition(
      id: 'thief',
      name: '盗賊',
      baseHp: 30, baseMp: 8, baseAtk: 10, baseDef: 6,
      growth: JobGrowth(hp: 6, mp: 2, atk: 2, def: 2),
      initialSpells: ['smoke', 'poison'],
      initialWeaponId: 'dagger',
      escapeBonus: 0.30,
      description: '逃げやすい・罠解除',
    ),
  };

  static JobDefinition get(String id) => all[id]!;
}
