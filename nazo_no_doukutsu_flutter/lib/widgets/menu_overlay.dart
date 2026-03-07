import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';
import 'save_slot_dialog.dart';

/// メニューオーバーレイ（セーブ等）
class MenuOverlay extends StatelessWidget {
  final GameState gameState;

  const MenuOverlay({super.key, required this.gameState});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {}, // 背景タップを無効
      child: Container(
        color: Colors.black.withValues(alpha: 0.88),
        child: Center(
          child: Container(
            width: 240,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              border: Border.all(color: AppColors.primary),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '[ メニュー ]',
                  style: GoogleFonts.shareTechMono(
                    color: AppColors.primary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                _menuBtn(
                  'セーブする',
                  () {
                    gameState.toggleMenu();
                    showSaveDialog(context, gameState, exitAfter: false);
                  },
                ),
                const SizedBox(height: 8),
                _menuBtn(
                  'セーブして終了',
                  () {
                    gameState.toggleMenu();
                    showSaveDialog(context, gameState, exitAfter: true);
                  },
                ),
                const SizedBox(height: 8),
                _menuBtn('もどる', gameState.toggleMenu),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _menuBtn(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.secondary),
          color: const Color(0xFF001A00),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 13,
            fontFamily: 'monospace',
          ),
        ),
      ),
    );
  }
}
