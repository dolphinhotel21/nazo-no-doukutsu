import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../constants/game_config.dart';
import '../data/equipment_data.dart';
import '../data/item_data.dart';
import '../game/battle_logic.dart';
import '../game/game_state.dart';
import '../models/player.dart';

/// 右側ステータスパネル
class StatusPanel extends StatelessWidget {
  final GameState state;

  const StatusPanel({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final p = state.player;
    final weapon = EquipmentData.getWeapon(p.weaponId);
    final armor  = EquipmentData.getArmor(p.armorId);
    final realMaxMp = BattleLogic.getMaxMp(p);
    final mapName = GameConfig.mapNames[state.currentMap] ?? '─';
    final locationText = p.isPoisoned ? '$mapName [毒]' : mapName;

    final hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 0.0;
    final hpColor = hpRatio > 0.5
        ? AppColors.primary
        : hpRatio > 0.25
            ? const Color(0xFFFFAA00)
            : AppColors.damage;

    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.all(6),
      child: DefaultTextStyle(
        style: GoogleFonts.shareTechMono(
          color: AppColors.textBright,
          fontSize: 11,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _line('名: ${p.name}'),
              _line('職: ${p.jobName}'),
              _line('LV: ${p.lv}'),
              _line('EXP: ${p.exp}/${p.expNext}'),
              const SizedBox(height: 4),
              _hpLine(p, hpColor),
              _line('MP: ${p.mp}/$realMaxMp',
                  color: AppColors.magicColor),
              _line('ATK: ${BattleLogic.getAtk(p)}'),
              _line('DEF: ${BattleLogic.getDef(p)}'),
              const SizedBox(height: 4),
              _line('─装備─', color: AppColors.textDim),
              _line('武: ${weapon.name}'),
              _line('防: ${armor.name}'),
              const SizedBox(height: 4),
              _line('金: ${p.gold}P', color: AppColors.gold),
              _line('場所: $locationText',
                  color: p.isPoisoned ? AppColors.poisonColor : AppColors.textDim),
              const SizedBox(height: 4),
              _line('─アイテム─', color: AppColors.textDim),
              if (p.items.isEmpty)
                _line('なし', color: AppColors.textDim)
              else
                ...p.items.map((stack) {
                  final item = ItemData.get(stack.itemId);
                  return _line('${item.name} x${stack.count}');
                }),
              const SizedBox(height: 8),
              _menuButton(context, state),
            ],
          ),
        ),
      ),
    );
  }

  Widget _line(String text, {Color? color}) {
    return Text(
      text,
      style: TextStyle(
        color: color ?? AppColors.textBright,
        fontSize: 11,
        fontFamily: 'monospace',
      ),
    );
  }

  Widget _hpLine(Player p, Color hpColor) {
    return Text(
      'HP: ${p.hp}/${p.maxHp}',
      style: TextStyle(
        color: hpColor,
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _menuButton(BuildContext context, GameState state) {
    return GestureDetector(
      onTap: state.toggleMenu,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.secondary),
        ),
        child: const Text(
          '[メニュー]',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 11,
          ),
        ),
      ),
    );
  }
}
