import 'dart:async';
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// 仮想十字キー（Dパッド）ウィジェット
class DpadWidget extends StatefulWidget {
  final void Function(int dx, int dy) onMove;

  const DpadWidget({super.key, required this.onMove});

  @override
  State<DpadWidget> createState() => _DpadWidgetState();
}

class _DpadWidgetState extends State<DpadWidget> {
  // 長押し用タイマー
  Timer? _repeatTimer;
  // 押下中の方向
  int _dx = 0;
  int _dy = 0;

  void _startMove(int dx, int dy) {
    _dx = dx;
    _dy = dy;
    widget.onMove(dx, dy);
    // 200ms後から100msごとに繰り返し
    _repeatTimer = Timer.periodic(const Duration(milliseconds: 150), (_) {
      widget.onMove(_dx, _dy);
    });
  }

  void _stopMove() {
    _repeatTimer?.cancel();
    _repeatTimer = null;
    _dx = 0;
    _dy = 0;
  }

  @override
  void dispose() {
    _repeatTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      height: 150,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // 上
          Positioned(
            top: 0,
            left: 45,
            child: _DpadButton(
              width: 60,
              height: 50,
              onStart: () => _startMove(0, -1),
              onEnd: _stopMove,
              child: const Icon(Icons.arrow_drop_up, color: AppColors.primary),
            ),
          ),
          // 下
          Positioned(
            bottom: 0,
            left: 45,
            child: _DpadButton(
              width: 60,
              height: 50,
              onStart: () => _startMove(0, 1),
              onEnd: _stopMove,
              child: const Icon(Icons.arrow_drop_down, color: AppColors.primary),
            ),
          ),
          // 左
          Positioned(
            left: 0,
            top: 45,
            child: _DpadButton(
              width: 50,
              height: 60,
              onStart: () => _startMove(-1, 0),
              onEnd: _stopMove,
              child: const Icon(Icons.arrow_left, color: AppColors.primary),
            ),
          ),
          // 右
          Positioned(
            right: 0,
            top: 45,
            child: _DpadButton(
              width: 50,
              height: 60,
              onStart: () => _startMove(1, 0),
              onEnd: _stopMove,
              child: const Icon(Icons.arrow_right, color: AppColors.primary),
            ),
          ),
          // 中央
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.wallColor,
              border: Border.all(color: AppColors.secondary),
            ),
          ),
        ],
      ),
    );
  }
}

/// Dパッドの各ボタン
class _DpadButton extends StatefulWidget {
  final Widget child;
  final double width;
  final double height;
  final VoidCallback onStart;
  final VoidCallback onEnd;

  const _DpadButton({
    required this.child,
    required this.width,
    required this.height,
    required this.onStart,
    required this.onEnd,
  });

  @override
  State<_DpadButton> createState() => _DpadButtonState();
}

class _DpadButtonState extends State<_DpadButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() => _pressed = true);
        widget.onStart();
      },
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onEnd();
      },
      onTapCancel: () {
        setState(() => _pressed = false);
        widget.onEnd();
      },
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: _pressed ? AppColors.secondary : AppColors.wallColor,
          border: Border.all(color: AppColors.secondary),
          borderRadius: BorderRadius.circular(4),
        ),
        child: widget.child,
      ),
    );
  }
}
