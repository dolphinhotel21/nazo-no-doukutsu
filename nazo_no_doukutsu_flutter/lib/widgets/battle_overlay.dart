import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../data/item_data.dart';
import '../data/spell_data.dart';
import '../game/battle_logic.dart';
import '../game/game_state.dart';
import '../models/enemy.dart';

/// バトルオーバーレイ（マップ上にStack+Positionedでフルスクリーン表示）
class BattleOverlay extends StatefulWidget {
  final GameState gameState;

  const BattleOverlay({super.key, required this.gameState});

  @override
  State<BattleOverlay> createState() => _BattleOverlayState();
}

class _BattleOverlayState extends State<BattleOverlay> {
  GameState get gs => widget.gameState;
  BattleState get bs => gs.battleState!;

  // 遅延タイマー
  Timer? _delayTimer;

  @override
  void dispose() {
    _delayTimer?.cancel();
    super.dispose();
  }

  // バトルログの最新3件を取得
  List<BattleLogEntry> get _recentLogs {
    final log = bs.log;
    if (log.length <= 3) return log;
    return log.sublist(log.length - 3);
  }

  void _rebuild() {
    if (mounted) setState(() {});
  }

  // ===========================
  // コマンド処理
  // ===========================

  void _onAttack() {
    if (bs.phase != BattlePhase.playerCommand) return;
    final (_, killed) = BattleLogic.playerAttack(gs.player, bs);
    if (killed) {
      _winSequence();
    } else {
      _enemyTurnSequence();
    }
    _rebuild();
  }

  void _onMagic() {
    if (bs.phase != BattlePhase.playerCommand) return;
    setState(() => bs.phase = BattlePhase.magicSelect);
  }

  void _onItem() {
    if (bs.phase != BattlePhase.playerCommand) return;
    setState(() => bs.phase = BattlePhase.itemSelect);
  }

  void _onDefend() {
    if (bs.phase != BattlePhase.playerCommand) return;
    BattleLogic.playerDefend(gs.player, bs);
    _enemyTurnSequence();
    _rebuild();
  }

  void _onRun() {
    if (bs.phase != BattlePhase.playerCommand) return;
    if (bs.isBoss) {
      bs.addLog('ボスから逃げることはできない！');
      _rebuild();
      return;
    }
    final escaped = BattleLogic.playerRun(gs.player, bs);
    if (escaped) {
      bs.addLog('うまく逃げ出した！');
      bs.phase = BattlePhase.escapeDelay;
      _rebuild();
      _delayTimer = Timer(const Duration(milliseconds: 800), () {
        gs.endBattleEscape();
        gs.closeBattle();
        gs.addMessage('逃げ出した！');
      });
    } else {
      bs.addLog('しかし逃げられなかった！');
      _enemyTurnSequence();
      _rebuild();
    }
  }

  void _onUseMagic(String spellId) {
    final (text, logType, killed, ended) = BattleLogic.useMagic(gs.player, bs, spellId);
    bs.addLog(text, type: logType);
    bs.phase = BattlePhase.playerCommand;
    if (ended) {
      // スモークで逃走成功
      bs.phase = BattlePhase.escapeDelay;
      _rebuild();
      _delayTimer = Timer(const Duration(milliseconds: 800), () {
        gs.endBattleEscape();
        gs.closeBattle();
        gs.addMessage('逃げ出した！');
      });
      return;
    }
    if (killed) {
      _winSequence();
    } else {
      _enemyTurnSequence();
    }
    _rebuild();
  }

  void _onUseItem(String itemId) {
    final (text, logType, killed) = BattleLogic.useItem(gs.player, bs, itemId);
    bs.addLog(text, type: logType);
    bs.phase = BattlePhase.playerCommand;
    if (killed) {
      _winSequence();
    } else {
      _enemyTurnSequence();
    }
    _rebuild();
  }

  void _enemyTurnSequence() {
    bs.phase = BattlePhase.enemyTurn;
    final (_, playerDied) = BattleLogic.enemyTurn(gs.player, bs);
    if (playerDied) {
      bs.addLog('${gs.player.name}は力尽きた...', type: BattleLogType.damage);
      bs.phase = BattlePhase.loseDelay;
      _delayTimer = Timer(const Duration(milliseconds: 1500), () {
        gs.endBattleLose();
        gs.closeBattle();
      });
    } else {
      bs.phase = BattlePhase.playerCommand;
    }
  }

  void _winSequence() {
    final e = bs.enemy;
    bs.addLog('${e.name}を倒した！', type: BattleLogType.gold);
    bs.addLog('EXP +${e.exp}  ペリカ +${e.gold}', type: BattleLogType.gold);
    gs.endBattleWin();
    bs.phase = BattlePhase.winDelay;
    _delayTimer = Timer(const Duration(milliseconds: 1500), () {
      final wasBoss = bs.isBoss;
      gs.closeBattle();
      if (wasBoss) {
        gs.addMessage('ボスを倒した！ 宝箱を手に入れよう！', type: MessageType.gold);
      } else {
        gs.addMessage(
          '${e.name}を倒した！ EXP+${e.exp} G+${e.gold}',
          type: MessageType.gold,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final e = bs.enemy;
    final p = gs.player;
    final hpRatio = (e.currentHp / e.maxHp).clamp(0.0, 1.0);

    return Container(
      color: Colors.black.withValues(alpha: 0.88),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            // 敵名・HPバー
            Text(
              '[ ${e.name} ]',
              style: GoogleFonts.shareTechMono(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Text('HP:', style: TextStyle(color: AppColors.textDim, fontSize: 11)),
                const SizedBox(width: 4),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(
                      value: hpRatio,
                      backgroundColor: const Color(0xFF222222),
                      valueColor: AlwaysStoppedAnimation(
                        hpRatio > 0.5
                            ? AppColors.primary
                            : hpRatio > 0.25
                                ? const Color(0xFFFFAA00)
                                : AppColors.damage,
                      ),
                      minHeight: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '${e.currentHp}',
                  style: const TextStyle(color: AppColors.textBright, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // 敵グラフィック
            SizedBox(
              height: 64,
              width: 64,
              child: CustomPaint(
                painter: EnemySpritePainter(e),
              ),
            ),
            const SizedBox(height: 8),
            // バトルログ
            Container(
              height: 60,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.secondary),
                color: const Color(0xFF050505),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _recentLogs.map((entry) => Text(
                  entry.text,
                  style: GoogleFonts.shareTechMono(
                    color: _logColor(entry.type),
                    fontSize: 10,
                  ),
                  overflow: TextOverflow.ellipsis,
                )).toList(),
              ),
            ),
            const SizedBox(height: 8),
            // コマンドまたはサブメニュー
            if (bs.phase == BattlePhase.magicSelect)
              _buildMagicMenu(p)
            else if (bs.phase == BattlePhase.itemSelect)
              _buildItemMenu(p)
            else
              _buildMainCommands(p),
          ],
        ),
      ),
    );
  }

  Widget _buildMainCommands(player) {
    final bool isActive = bs.phase == BattlePhase.playerCommand;
    final hasMagic = gs.player.spells.isNotEmpty;
    final hasItem  = gs.player.items.isNotEmpty;

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _cmdBtn('たたかう', isActive ? _onAttack : null)),
            const SizedBox(width: 4),
            Expanded(child: _cmdBtn('まほう',
                isActive && hasMagic ? _onMagic : null,
                disabled: !hasMagic)),
          ],
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(child: _cmdBtn('アイテム',
                isActive && hasItem ? _onItem : null,
                disabled: !hasItem)),
            const SizedBox(width: 4),
            Expanded(child: _cmdBtn('ぼうぎょ', isActive ? _onDefend : null)),
          ],
        ),
        const SizedBox(height: 4),
        _cmdBtn('にげる', isActive && !bs.isBoss ? _onRun : null,
            disabled: bs.isBoss),
      ],
    );
  }

  Widget _buildMagicMenu(player) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('どの魔法を使う？',
            style: TextStyle(color: AppColors.textDim, fontSize: 11)),
        ...gs.player.spells.map((id) {
          final sp = SpellData.get(id);
          final canUse = gs.player.mp >= sp.mp;
          return Padding(
            padding: const EdgeInsets.only(top: 4),
            child: _cmdBtn(
              '${sp.name} (MP:${sp.mp})',
              canUse ? () => _onUseMagic(id) : null,
              disabled: !canUse,
            ),
          );
        }),
        const SizedBox(height: 4),
        _cmdBtn('もどる', () => setState(() => bs.phase = BattlePhase.playerCommand)),
      ],
    );
  }

  Widget _buildItemMenu(player) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('どのアイテムを使う？',
            style: TextStyle(color: AppColors.textDim, fontSize: 11)),
        ...gs.player.items.map((stack) {
          final item = ItemData.get(stack.itemId);
          return Padding(
            padding: const EdgeInsets.only(top: 4),
            child: _cmdBtn(
              '${item.name} x${stack.count}',
              () => _onUseItem(stack.itemId),
            ),
          );
        }),
        const SizedBox(height: 4),
        _cmdBtn('もどる', () => setState(() => bs.phase = BattlePhase.playerCommand)),
      ],
    );
  }

  Widget _cmdBtn(String label, VoidCallback? onTap, {bool disabled = false}) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: disabled
              ? const Color(0xFF111111)
              : (onTap != null ? const Color(0xFF001A00) : const Color(0xFF0A0A0A)),
          border: Border.all(
            color: disabled ? AppColors.textDim : AppColors.secondary,
          ),
          borderRadius: BorderRadius.circular(2),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: disabled ? AppColors.textDim : AppColors.primary,
            fontSize: 12,
            fontFamily: 'monospace',
          ),
        ),
      ),
    );
  }

  Color _logColor(BattleLogType type) {
    switch (type) {
      case BattleLogType.damage:  return AppColors.damage;
      case BattleLogType.heal:    return AppColors.heal;
      case BattleLogType.magic:   return AppColors.magicColor;
      case BattleLogType.boss:    return const Color(0xFFFF4400);
      case BattleLogType.gold:    return AppColors.gold;
      case BattleLogType.levelUp: return AppColors.gold;
      default:                    return AppColors.textBright;
    }
  }
}

/// 敵グラフィック（CustomPainter）game.jsのSVGをDartに移植
class EnemySpritePainter extends CustomPainter {
  final EnemyInstance enemy;

  EnemySpritePainter(this.enemy);

  @override
  void paint(Canvas canvas, Size size) {
    final u = size.width / 16; // 1ドットのサイズ（16x16グリッド）

    void rect(double x, double y, double w, double h, Color color) {
      canvas.drawRect(
        Rect.fromLTWH(x * u, y * u, w * u, h * u),
        Paint()..color = color,
      );
    }

    switch (enemy.type) {
      case 'slime':
        rect(5, 3, 6, 1, const Color(0xFF1133CC));
        rect(4, 4, 8, 6, const Color(0xFF1133CC));
        rect(5, 10, 6, 1, const Color(0xFF1133CC));
        rect(4, 4, 2, 2, const Color(0xFF5566EE));
        rect(5, 6, 2, 2, Colors.white);
        rect(9, 6, 2, 2, Colors.white);
        rect(6, 7, 1, 1, const Color(0xFF111111));
        rect(10, 7, 1, 1, const Color(0xFF111111));
        rect(6, 9, 4, 1, const Color(0xFF0022AA));

      case 'bat':
        rect(1, 5, 5, 1, const Color(0xFF222222));
        rect(1, 6, 4, 3, const Color(0xFF333333));
        rect(2, 9, 3, 1, const Color(0xFF333333));
        rect(10, 5, 5, 1, const Color(0xFF222222));
        rect(11, 6, 4, 3, const Color(0xFF333333));
        rect(11, 9, 3, 1, const Color(0xFF333333));
        rect(5, 4, 6, 3, const Color(0xFF444444));
        rect(6, 7, 4, 3, const Color(0xFF333333));
        rect(6, 5, 1, 1, const Color(0xFFCC2200));
        rect(9, 5, 1, 1, const Color(0xFFCC2200));
        rect(7, 10, 2, 1, const Color(0xFF222222));

      case 'goblin':
        rect(2, 4, 2, 3, const Color(0xFF2D7A1A));
        rect(12, 4, 2, 3, const Color(0xFF2D7A1A));
        rect(4, 2, 8, 5, const Color(0xFF44AA22));
        rect(5, 4, 2, 1, const Color(0xFFCC1100));
        rect(9, 4, 2, 1, const Color(0xFFCC1100));
        rect(6, 6, 4, 1, const Color(0xFF226611));
        rect(4, 7, 8, 4, const Color(0xFF336622));
        rect(3, 8, 2, 3, const Color(0xFF336622));
        rect(11, 8, 2, 3, const Color(0xFF336622));
        rect(5, 11, 3, 4, const Color(0xFF225511));
        rect(8, 11, 3, 4, const Color(0xFF225511));

      case 'snake':
        rect(7, 1, 4, 3, const Color(0xFF33AA22));
        rect(6, 1, 1, 1, const Color(0xFFCC0000));
        rect(11, 1, 1, 1, const Color(0xFFCC0000));
        rect(6, 2, 1, 1, const Color(0xFFFFFF00));
        rect(10, 2, 1, 1, const Color(0xFFFFFF00));
        rect(9, 4, 5, 3, const Color(0xFF33AA22));
        rect(5, 5, 5, 3, const Color(0xFF33AA22));
        rect(3, 7, 4, 3, const Color(0xFF33AA22));
        rect(3, 10, 7, 3, const Color(0xFF33AA22));
        rect(7, 13, 4, 2, const Color(0xFF33AA22));
        rect(6, 4, 4, 2, const Color(0xFF44CC33));

      case 'orc':
        rect(3, 2, 10, 6, const Color(0xFF8B5E3C));
        rect(2, 3, 2, 4, const Color(0xFF7A4E2D));
        rect(12, 3, 2, 4, const Color(0xFF7A4E2D));
        rect(5, 4, 2, 2, const Color(0xFFCC3300));
        rect(9, 4, 2, 2, const Color(0xFFCC3300));
        rect(6, 7, 2, 1, const Color(0xFFEEDD99));
        rect(8, 7, 2, 1, const Color(0xFFEEDD99));
        rect(2, 8, 12, 5, const Color(0xFF7A4E2D));
        rect(1, 9, 2, 4, const Color(0xFF8B5E3C));
        rect(13, 9, 2, 4, const Color(0xFF8B5E3C));
        rect(3, 13, 4, 3, const Color(0xFF5C3D1E));
        rect(9, 13, 4, 3, const Color(0xFF5C3D1E));

      case 'dark':
        rect(5, 0, 6, 2, const Color(0xFF222266));
        rect(4, 2, 8, 4, const Color(0xFF111133));
        rect(5, 3, 2, 1, const Color(0xFFCC2200));
        rect(9, 3, 2, 1, const Color(0xFFCC2200));
        rect(3, 6, 10, 6, const Color(0xFF111133));
        rect(1, 6, 3, 5, const Color(0xFF222244));
        rect(12, 6, 3, 5, const Color(0xFF222244));
        rect(4, 12, 4, 4, const Color(0xFF111122));
        rect(8, 12, 4, 4, const Color(0xFF111122));
        rect(14, 3, 1, 10, const Color(0xFF888888));
        rect(13, 2, 2, 2, const Color(0xFF555555));

      case 'beast': // ケルベロス
        rect(6, 0, 4, 3, const Color(0xFF442222));
        rect(1, 2, 4, 3, const Color(0xFF442222));
        rect(11, 2, 4, 3, const Color(0xFF442222));
        rect(5, 4, 6, 4, const Color(0xFF552222));
        rect(3, 7, 10, 4, const Color(0xFF442222));
        rect(2, 11, 3, 4, const Color(0xFF331111));
        rect(5, 11, 3, 4, const Color(0xFF331111));
        rect(8, 11, 3, 4, const Color(0xFF331111));
        rect(11, 11, 3, 4, const Color(0xFF331111));
        rect(7, 1, 1, 1, const Color(0xFFCC0000));
        rect(9, 1, 1, 1, const Color(0xFFCC0000));
        rect(1, 3, 1, 1, const Color(0xFFCC0000));
        rect(4, 3, 1, 1, const Color(0xFFCC0000));
        rect(11, 3, 1, 1, const Color(0xFFCC0000));
        rect(14, 3, 1, 1, const Color(0xFFCC0000));

      case 'undead':
        if (enemy.name.contains('骸骨')) {
          // 骸骨騎士
          rect(5, 1, 6, 5, const Color(0xFFDDDDDD));
          rect(5, 2, 2, 2, const Color(0xFF222222));
          rect(9, 2, 2, 2, const Color(0xFF222222));
          rect(6, 5, 4, 1, const Color(0xFF222222));
          rect(5, 6, 1, 4, const Color(0xFFDDDDDD));
          rect(7, 6, 2, 4, const Color(0xFFDDDDDD));
          rect(10, 6, 1, 4, const Color(0xFFDDDDDD));
          rect(3, 7, 2, 3, const Color(0xFFDDDDDD));
          rect(11, 7, 2, 3, const Color(0xFFCCCCCC));
          rect(5, 10, 3, 5, const Color(0xFFDDDDDD));
          rect(8, 10, 3, 5, const Color(0xFFDDDDDD));
          rect(13, 3, 2, 9, const Color(0xFFAAAAAA));
          rect(13, 2, 2, 2, const Color(0xFF777777));
        } else {
          // ゾンビ
          rect(5, 1, 6, 5, const Color(0xFF667766));
          rect(6, 3, 1, 1, const Color(0xFF334433));
          rect(9, 3, 1, 1, const Color(0xFF334433));
          rect(6, 5, 4, 1, const Color(0xFF445544));
          rect(4, 6, 8, 5, const Color(0xFF556655));
          rect(1, 7, 3, 2, const Color(0xFF667766));
          rect(12, 5, 3, 2, const Color(0xFF667766));
          rect(5, 11, 3, 4, const Color(0xFF445544));
          rect(8, 11, 3, 4, const Color(0xFF445544));
          rect(4, 6, 1, 2, const Color(0xFF778877));
          rect(11, 6, 1, 2, const Color(0xFF778877));
        }

      case 'boss': // 暗黒竜ヴォルガン
        rect(0, 4, 5, 4, const Color(0xFF880000));
        rect(11, 4, 5, 4, const Color(0xFF880000));
        rect(0, 2, 5, 3, const Color(0xFFAA1100));
        rect(11, 2, 5, 3, const Color(0xFFAA1100));
        rect(1, 0, 4, 3, const Color(0xFFCC2200));
        rect(11, 0, 4, 3, const Color(0xFFCC2200));
        rect(5, 3, 6, 6, const Color(0xFFCC2200));
        rect(4, 5, 8, 3, const Color(0xFFDD3300));
        rect(6, 2, 4, 3, const Color(0xFFCC2200));
        rect(6, 2, 2, 1, const Color(0xFFFFCC00));
        rect(8, 2, 2, 1, const Color(0xFFFFCC00));
        rect(5, 4, 2, 1, const Color(0xFFFF5500));
        rect(9, 4, 2, 1, const Color(0xFFFF5500));
        rect(5, 9, 6, 3, const Color(0xFFCC2200));
        rect(6, 12, 4, 2, const Color(0xFFAA1100));
        rect(5, 14, 3, 2, const Color(0xFF880000));
        rect(8, 14, 3, 2, const Color(0xFF880000));

      default:
        rect(4, 2, 8, 12, const Color(0xFF666666));
        rect(6, 4, 2, 2, const Color(0xFFCC0000));
        rect(8, 4, 2, 2, const Color(0xFFCC0000));
    }
  }

  @override
  bool shouldRepaint(EnemySpritePainter oldDelegate) =>
      oldDelegate.enemy.currentHp != enemy.currentHp;
}
