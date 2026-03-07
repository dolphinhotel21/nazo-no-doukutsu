import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// A/Bアクションボタン
class ActionButtons extends StatelessWidget {
  final VoidCallback? onActionA; // 決定
  final VoidCallback? onActionB; // キャンセル/メニュー

  const ActionButtons({
    super.key,
    this.onActionA,
    this.onActionB,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _ActionBtn(label: 'A', onTap: onActionA),
        const SizedBox(height: 8),
        _ActionBtn(label: 'B', onTap: onActionB),
      ],
    );
  }
}

class _ActionBtn extends StatefulWidget {
  final String label;
  final VoidCallback? onTap;

  const _ActionBtn({required this.label, this.onTap});

  @override
  State<_ActionBtn> createState() => _ActionBtnState();
}

class _ActionBtnState extends State<_ActionBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap?.call();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: _pressed ? AppColors.secondary : AppColors.wallColor,
          border: Border.all(color: AppColors.secondary, width: 2),
        ),
        alignment: Alignment.center,
        child: Text(
          widget.label,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
