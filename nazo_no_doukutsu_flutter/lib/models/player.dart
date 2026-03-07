import 'item.dart';

/// プレイヤーデータクラス（game.jsのプレイヤーオブジェクトを完全移植）
class Player {
  String name;
  String job;     // warrior / mage / priest / thief
  String jobName; // 戦士 / 魔法使い / 僧侶 / 盗賊

  int lv;
  int exp;
  int expNext;

  int hp;
  int maxHp;
  int mp;
  int maxMp;

  // 基礎ステータス（装備ボーナスを含まない）
  int baseAtk;
  int baseDef;

  // 装備ID（nullは未装備）
  String weaponId;
  String armorId;

  List<ItemStack> items;
  List<String> spells; // 習得済み魔法IDリスト

  int gold; // ペリカ

  // 状態異常
  bool isPoisoned;

  // マップ座標
  int x;
  int y;

  Player({
    required this.name,
    required this.job,
    required this.jobName,
    this.lv = 1,
    this.exp = 0,
    this.expNext = 100,
    required this.hp,
    required this.maxHp,
    required this.mp,
    required this.maxMp,
    required this.baseAtk,
    required this.baseDef,
    required this.weaponId,
    this.armorId = 'cloth',
    List<ItemStack>? items,
    List<String>? spells,
    this.gold = 100,
    this.isPoisoned = false,
    this.x = 0,
    this.y = 0,
  }) : items = items ?? [],
       spells = spells ?? [];

  // JSONシリアライズ（セーブ用）
  Map<String, dynamic> toJson() => {
    'name':       name,
    'job':        job,
    'jobName':    jobName,
    'lv':         lv,
    'exp':        exp,
    'expNext':    expNext,
    'hp':         hp,
    'maxHp':      maxHp,
    'mp':         mp,
    'maxMp':      maxMp,
    'baseAtk':    baseAtk,
    'baseDef':    baseDef,
    'weaponId':   weaponId,
    'armorId':    armorId,
    'items':      items.map((i) => i.toJson()).toList(),
    'spells':     spells,
    'gold':       gold,
    'isPoisoned': isPoisoned,
    'x':          x,
    'y':          y,
  };

  factory Player.fromJson(Map<String, dynamic> json) => Player(
    name:       json['name'] as String,
    job:        json['job'] as String,
    jobName:    json['jobName'] as String,
    lv:         json['lv'] as int,
    exp:        json['exp'] as int,
    expNext:    json['expNext'] as int,
    hp:         json['hp'] as int,
    maxHp:      json['maxHp'] as int,
    mp:         json['mp'] as int,
    maxMp:      json['maxMp'] as int,
    baseAtk:    json['baseAtk'] as int,
    baseDef:    json['baseDef'] as int,
    weaponId:   json['weaponId'] as String,
    armorId:    json['armorId'] as String,
    items:      (json['items'] as List<dynamic>)
                  .map((e) => ItemStack.fromJson(e as Map<String, dynamic>))
                  .toList(),
    spells:     List<String>.from(json['spells'] as List),
    gold:       json['gold'] as int,
    isPoisoned: json['isPoisoned'] as bool? ?? false,
    x:          json['x'] as int? ?? 0,
    y:          json['y'] as int? ?? 0,
  );
}
