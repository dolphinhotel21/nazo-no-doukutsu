import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../data/equipment_data.dart';
import '../data/item_data.dart';
import '../data/job_data.dart';
import '../data/spell_data.dart';
import '../game/battle_logic.dart';
import '../game/game_state.dart';

/// ショップオーバーレイ（宿屋・魔法・武器・防具・道具屋）
class ShopOverlay extends StatefulWidget {
  final GameState gameState;

  const ShopOverlay({super.key, required this.gameState});

  @override
  State<ShopOverlay> createState() => _ShopOverlayState();
}

class _ShopOverlayState extends State<ShopOverlay> {
  GameState get gs => widget.gameState;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.92),
      child: Column(
        children: [
          // タイトル
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            width: double.infinity,
            color: AppColors.wallColor,
            child: Text(
              _shopTitle(),
              textAlign: TextAlign.center,
              style: GoogleFonts.shareTechMono(
                color: AppColors.primary,
                fontSize: 14,
              ),
            ),
          ),
          // コンテンツ
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: _buildContent(),
            ),
          ),
          // 閉じるボタン
          Padding(
            padding: const EdgeInsets.all(8),
            child: _shopBtn('とじる', gs.closeShop),
          ),
        ],
      ),
    );
  }

  String _shopTitle() {
    switch (gs.shopType) {
      case 'inn':    return '[ 宿屋 ]';
      case 'magic':  return '[ 魔法ショップ ]';
      case 'weapon': return '[ 武器屋 ]';
      case 'armor':  return '[ 防具屋 ]';
      case 'item':   return '[ 道具屋 ]';
      default:       return '[ ショップ ]';
    }
  }

  Widget _buildContent() {
    switch (gs.shopType) {
      case 'inn':    return _buildInn();
      case 'magic':  return _buildMagicShop();
      case 'weapon': return _buildWeaponShop();
      case 'armor':  return _buildArmorShop();
      case 'item':   return _buildItemShop();
      default:       return const SizedBox();
    }
  }

  // ===========================
  // 宿屋
  // ===========================
  Widget _buildInn() {
    final p = gs.player;
    final cost = p.lv * 10;
    final canAfford = p.gold >= cost;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionText('宿屋へようこそ！ 一泊 $cost ペリカ'),
        _goldText(p.gold),
        const SizedBox(height: 12),
        _shopBtn(
          '泊まる (${cost}P)',
          canAfford
              ? () {
                  setState(() {
                    p.gold -= cost;
                    p.hp = p.maxHp;
                    p.mp = BattleLogic.getMaxMp(p);
                    p.isPoisoned = false;
                  });
                  gs.closeShop();
                  gs.addMessage('ゆっくりと休んだ。HP・MPが全回復した！',
                      type: MessageType.heal);
                }
              : null,
          disabled: !canAfford,
        ),
      ],
    );
  }

  // ===========================
  // 魔法ショップ
  // ===========================
  Widget _buildMagicShop() {
    final p = gs.player;
    final items = <Widget>[_sectionText('習得可能な魔法')];

    for (final entry in SpellData.shopList) {
      final sp = SpellData.get(entry.spellId);
      final owned = p.spells.contains(entry.spellId);
      final canAfford = p.gold >= entry.price;
      final disabled = owned || !canAfford;

      items.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(sp.name,
                      style: TextStyle(
                          color: disabled ? AppColors.textDim : AppColors.textBright,
                          fontSize: 12)),
                  Text(sp.desc,
                      style: const TextStyle(
                          color: AppColors.textDim, fontSize: 10)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              owned ? '習得済' : '${entry.price}P',
              style: TextStyle(
                  color: owned ? AppColors.textDim : AppColors.gold,
                  fontSize: 11),
            ),
            const SizedBox(width: 4),
            _shopBtn(
              '購入',
              disabled
                  ? null
                  : () {
                      setState(() {
                        p.gold -= entry.price;
                        p.spells.add(entry.spellId);
                      });
                      gs.addMessage('${sp.name}を習得した！',
                          type: MessageType.success);
                    },
              disabled: disabled,
              small: true,
            ),
          ],
        ),
      ));
    }

    items.add(const SizedBox(height: 8));
    items.add(_goldText(p.gold));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: items);
  }

  // ===========================
  // 武器屋
  // ===========================
  Widget _buildWeaponShop() {
    final p = gs.player;
    final items = <Widget>[_sectionText('購入')];

    for (final id in EquipmentData.weaponShopList) {
      final eq = EquipmentData.getWeapon(id);
      final canEquip  = eq.canEquip(p.job);
      final canAfford = p.gold >= eq.price;
      final disabled  = !canEquip || !canAfford;

      items.add(_equipRow(
        name: eq.name,
        stat: 'ATK+${eq.atkBonus}',
        price: eq.price,
        disabled: disabled,
        onBuy: () {
          setState(() {
            p.gold -= eq.price;
            p.weaponId = id;
          });
          gs.addMessage('${eq.name}を購入・装備した！', type: MessageType.success);
        },
      ));
    }

    // 売却
    items.add(const SizedBox(height: 8));
    items.add(_sectionText('売却'));
    final curWeapon = EquipmentData.getWeapon(p.weaponId);
    if (curWeapon.sellPrice == 0) {
      items.add(_dimText('${curWeapon.name}は売れない'));
    } else {
      items.add(_sellRow(
        name: curWeapon.name,
        price: curWeapon.sellPrice,
        onSell: () {
          setState(() {
            p.gold += curWeapon.sellPrice;
            // 初期装備に戻す
            p.weaponId = JobData.get(p.job).initialWeaponId;
          });
          gs.addMessage('${curWeapon.name}を売った！ +${curWeapon.sellPrice}P',
              type: MessageType.gold);
        },
      ));
    }

    items.add(const SizedBox(height: 8));
    items.add(_goldText(p.gold));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: items);
  }

  // ===========================
  // 防具屋
  // ===========================
  Widget _buildArmorShop() {
    final p = gs.player;
    final items = <Widget>[_sectionText('購入')];

    for (final id in EquipmentData.armorShopList) {
      final eq = EquipmentData.getArmor(id);
      final canEquip  = eq.canEquip(p.job);
      final canAfford = p.gold >= eq.price;
      final disabled  = !canEquip || !canAfford;

      items.add(_equipRow(
        name: eq.name,
        stat: 'DEF+${eq.defBonus}${eq.mpBonus > 0 ? " MP+${eq.mpBonus}" : ""}',
        price: eq.price,
        disabled: disabled,
        onBuy: () {
          setState(() {
            p.gold -= eq.price;
            p.armorId = id;
            // MPボーナスを更新
            final newMaxMp = BattleLogic.getMaxMp(p);
            if (p.mp > newMaxMp) p.mp = newMaxMp;
          });
          gs.addMessage('${eq.name}を購入・装備した！', type: MessageType.success);
        },
      ));
    }

    // 売却
    items.add(const SizedBox(height: 8));
    items.add(_sectionText('売却'));
    final curArmor = EquipmentData.getArmor(p.armorId);
    if (curArmor.sellPrice == 0) {
      items.add(_dimText('${curArmor.name}は売れない'));
    } else {
      items.add(_sellRow(
        name: curArmor.name,
        price: curArmor.sellPrice,
        onSell: () {
          setState(() {
            p.gold += curArmor.sellPrice;
            p.armorId = 'cloth';
          });
          gs.addMessage('${curArmor.name}を売った！ +${curArmor.sellPrice}P',
              type: MessageType.gold);
        },
      ));
    }

    items.add(const SizedBox(height: 8));
    items.add(_goldText(p.gold));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: items);
  }

  // ===========================
  // 道具屋
  // ===========================
  Widget _buildItemShop() {
    final p = gs.player;
    final items = <Widget>[_sectionText('購入')];

    for (final id in ItemData.shopList) {
      final cons = ItemData.get(id);
      final canAfford = p.gold >= cons.price;

      items.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(cons.name,
                      style: TextStyle(
                          color: canAfford
                              ? AppColors.textBright
                              : AppColors.textDim,
                          fontSize: 12)),
                  Text(cons.desc,
                      style: const TextStyle(
                          color: AppColors.textDim, fontSize: 10)),
                ],
              ),
            ),
            Text('${cons.price}P',
                style: TextStyle(
                    color: canAfford ? AppColors.gold : AppColors.textDim,
                    fontSize: 11)),
            const SizedBox(width: 4),
            _shopBtn(
              '購入',
              canAfford
                  ? () {
                      final ok = BattleLogic.addItem(p, id);
                      if (!ok) {
                        gs.addMessage('アイテムがいっぱいだ！', type: MessageType.warning);
                        return;
                      }
                      setState(() => p.gold -= cons.price);
                      gs.addMessage('${cons.name}を購入した！', type: MessageType.success);
                    }
                  : null,
              disabled: !canAfford,
              small: true,
            ),
          ],
        ),
      ));
    }

    // 売却
    items.add(const SizedBox(height: 8));
    items.add(_sectionText('売却'));
    if (p.items.isEmpty) {
      items.add(_dimText('売れるアイテムがない'));
    } else {
      for (final stack in p.items) {
        final cons = ItemData.get(stack.itemId);
        items.add(Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(
            children: [
              Expanded(
                child: Text('${cons.name} x${stack.count}',
                    style: const TextStyle(
                        color: AppColors.textBright, fontSize: 12)),
              ),
              Text('${cons.sellPrice}P/個',
                  style: const TextStyle(
                      color: AppColors.gold, fontSize: 11)),
              const SizedBox(width: 4),
              _shopBtn('売る', () {
                setState(() {
                  // 1個売却
                  stack.count--;
                  if (stack.count <= 0) {
                    p.items.remove(stack);
                  }
                  p.gold += cons.sellPrice;
                });
                gs.addMessage('${cons.name}を売った！ +${cons.sellPrice}P',
                    type: MessageType.gold);
              }, small: true),
            ],
          ),
        ));
      }
    }

    items.add(const SizedBox(height: 8));
    items.add(_goldText(p.gold));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: items);
  }

  // ===========================
  // 共通UIヘルパー
  // ===========================
  Widget _sectionText(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Text(text,
        style: const TextStyle(color: AppColors.textDim, fontSize: 11)),
  );

  Widget _goldText(int gold) => Text(
    '所持金: ${gold}P',
    style: const TextStyle(color: AppColors.gold, fontSize: 12),
  );

  Widget _dimText(String text) => Text(
    text,
    style: const TextStyle(color: AppColors.textDim, fontSize: 11),
  );

  Widget _equipRow({
    required String name,
    required String stat,
    required int price,
    required bool disabled,
    required VoidCallback onBuy,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: TextStyle(
                        color: disabled
                            ? AppColors.textDim
                            : AppColors.textBright,
                        fontSize: 12)),
                Text(stat,
                    style: const TextStyle(
                        color: AppColors.textDim, fontSize: 10)),
              ],
            ),
          ),
          Text('${price}P',
              style: TextStyle(
                  color: disabled ? AppColors.textDim : AppColors.gold,
                  fontSize: 11)),
          const SizedBox(width: 4),
          _shopBtn('購入', disabled ? null : onBuy,
              disabled: disabled, small: true),
        ],
      ),
    );
  }

  Widget _sellRow({
    required String name,
    required int price,
    required VoidCallback onSell,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(name,
                style: const TextStyle(
                    color: AppColors.textBright, fontSize: 12)),
          ),
          Text('${price}P',
              style: const TextStyle(color: AppColors.gold, fontSize: 11)),
          const SizedBox(width: 4),
          _shopBtn('売る', onSell, small: true),
        ],
      ),
    );
  }

  Widget _shopBtn(String label, VoidCallback? onTap,
      {bool disabled = false, bool small = false}) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: small ? 4 : 8,
          horizontal: small ? 6 : 12,
        ),
        decoration: BoxDecoration(
          color: disabled ? const Color(0xFF111111) : const Color(0xFF001A00),
          border: Border.all(
            color: disabled ? AppColors.textDim : AppColors.secondary,
          ),
          borderRadius: BorderRadius.circular(2),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: disabled ? AppColors.textDim : AppColors.primary,
            fontSize: small ? 10 : 12,
          ),
        ),
      ),
    );
  }
}
