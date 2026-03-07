import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';

/// 下部メッセージログ（最新3行）
class MessageLog extends StatelessWidget {
  final List<GameMessage> messages;

  const MessageLog({super.key, required this.messages});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      color: const Color(0xFF0A0A0A),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: messages.map((msg) => _buildLine(msg)).toList(),
      ),
    );
  }

  Widget _buildLine(GameMessage msg) {
    Color color;
    switch (msg.type) {
      case MessageType.damage:   color = AppColors.damage; break;
      case MessageType.heal:     color = AppColors.heal; break;
      case MessageType.success:  color = AppColors.primary; break;
      case MessageType.gold:     color = AppColors.gold; break;
      case MessageType.warning:  color = const Color(0xFFFFAA00); break;
      default:                   color = AppColors.textDim; break;
    }

    return SizedBox(
      height: 20,
      child: Text(
        msg.text,
        style: GoogleFonts.shareTechMono(
          color: color,
          fontSize: 12,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}
