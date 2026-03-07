import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';
import '../game/save_manager.dart';
import '../widgets/save_slot_dialog.dart';

/// ゲームオーバー画面
class GameOverScreen extends StatefulWidget {
  final GameState gameState;

  const GameOverScreen({super.key, required this.gameState});

  @override
  State<GameOverScreen> createState() => _GameOverScreenState();
}

class _GameOverScreenState extends State<GameOverScreen> {
  bool _hasSave = false;

  @override
  void initState() {
    super.initState();
    _checkSave();
  }

  Future<void> _checkSave() async {
    final has = await SaveManager.hasSaveData();
    if (mounted) setState(() => _hasSave = has);
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.gameState.player.name;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'G A M E  O V E R',
              style: GoogleFonts.shareTechMono(
                color: AppColors.damage,
                fontSize: 28,
                fontWeight: FontWeight.bold,
                shadows: [
                  const Shadow(
                    color: AppColors.damage,
                    blurRadius: 20,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '$nameは力尽きた...',
              style: GoogleFonts.shareTechMono(
                color: AppColors.textDim,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 48),
            _btn(
              'ロードする',
              _hasSave
                  ? () => showLoadDialog(context, widget.gameState)
                  : null,
              disabled: !_hasSave,
            ),
            const SizedBox(height: 16),
            _btn('タイトルへ', widget.gameState.goToTitle),
          ],
        ),
      ),
    );
  }

  Widget _btn(String label, VoidCallback? onTap, {bool disabled = false}) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        width: 200,
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(
              color: disabled ? AppColors.textDim : AppColors.primary),
          color: disabled ? AppColors.background : const Color(0xFF001A00),
        ),
        child: Text(
          label,
          style: GoogleFonts.shareTechMono(
            color: disabled ? AppColors.textDim : AppColors.primary,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
