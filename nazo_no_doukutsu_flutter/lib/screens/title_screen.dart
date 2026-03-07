import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';
import '../game/save_manager.dart';
import '../widgets/save_slot_dialog.dart';

/// タイトル画面
class TitleScreen extends StatefulWidget {
  final GameState gameState;

  const TitleScreen({super.key, required this.gameState});

  @override
  State<TitleScreen> createState() => _TitleScreenState();
}

class _TitleScreenState extends State<TitleScreen> {
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
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // タイトル（グロー効果）
            Text(
              '謎の洞窟',
              style: GoogleFonts.shareTechMono(
                color: AppColors.primary,
                fontSize: 36,
                fontWeight: FontWeight.bold,
                shadows: [
                  const Shadow(
                    color: AppColors.primary,
                    blurRadius: 20,
                  ),
                  const Shadow(
                    color: AppColors.primary,
                    blurRadius: 40,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '〜伝説の秘宝を求めて〜',
              style: GoogleFonts.shareTechMono(
                color: AppColors.secondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 60),
            _menuBtn(
              'はじめから',
              () => widget.gameState.goToCharCreate(),
            ),
            const SizedBox(height: 16),
            _menuBtn(
              'ロードする',
              _hasSave
                  ? () => showLoadDialog(context, widget.gameState)
                  : null,
              disabled: !_hasSave,
            ),
            const SizedBox(height: 60),
            Text(
              '© 2025',
              style: GoogleFonts.shareTechMono(
                color: AppColors.textDim,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _menuBtn(String label, VoidCallback? onTap, {bool disabled = false}) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        width: 200,
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(
            color: disabled ? AppColors.textDim : AppColors.primary,
            width: 1.5,
          ),
          color: disabled ? AppColors.background : const Color(0xFF001A00),
          boxShadow: disabled
              ? null
              : [
                  const BoxShadow(
                    color: AppColors.primary,
                    blurRadius: 4,
                    spreadRadius: 0,
                  ),
                ],
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
