import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';

/// エンディング画面（1文字ずつ表示アニメーション）
class EndingScreen extends StatefulWidget {
  final GameState gameState;

  const EndingScreen({super.key, required this.gameState});

  @override
  State<EndingScreen> createState() => _EndingScreenState();
}

class _EndingScreenState extends State<EndingScreen> {
  String _displayText = '';
  int _charIndex = 0;
  Timer? _timer;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _buildText();
  }

  void _buildText() {
    final name = widget.gameState.player.name;
    final fullText =
        '$nameは謎の洞窟から\n伝説の秘宝を持ち帰り、\n英雄となった！\n\nCONGRATULATIONS!';
    _startAnimation(fullText);
  }

  void _startAnimation(String text) {
    _timer = Timer.periodic(const Duration(milliseconds: 60), (timer) {
      if (_charIndex >= text.length) {
        timer.cancel();
        setState(() => _done = true);
        return;
      }
      setState(() {
        _displayText = text.substring(0, _charIndex + 1);
        _charIndex++;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _displayText,
                style: GoogleFonts.shareTechMono(
                  color: AppColors.primary,
                  fontSize: 18,
                  height: 1.8,
                  shadows: [
                    const Shadow(
                      color: AppColors.primary,
                      blurRadius: 10,
                    ),
                  ],
                ),
                textAlign: TextAlign.center,
              ),
              if (_done) ...[
                const SizedBox(height: 48),
                _btn('タイトルへ戻る', widget.gameState.goToTitle),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _btn(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.primary),
          color: const Color(0xFF001A00),
        ),
        child: Text(label,
            style: GoogleFonts.shareTechMono(
                color: AppColors.primary, fontSize: 14)),
      ),
    );
  }
}
