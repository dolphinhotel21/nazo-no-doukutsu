import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';
import '../widgets/battle_overlay.dart';
import '../widgets/dpad_widget.dart';
import '../widgets/map_widget.dart';
import '../widgets/message_log.dart';
import '../widgets/menu_overlay.dart';
import '../widgets/shop_overlay.dart';
import '../widgets/status_panel.dart';

/// メインゲーム画面
class GameScreen extends StatelessWidget {
  final GameState gameState;

  const GameScreen({super.key, required this.gameState});

  @override
  Widget build(BuildContext context) {
    final gs = gameState;
    final mapData = gs.maps[gs.currentMap]!;
    final explored = gs.explored[gs.currentMap] ?? <String>{};

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            // ===========================
            // メインレイアウト
            // ===========================
            Column(
              children: [
                // タイトルバー
                _TitleBar(currentMap: gs.currentMap),
                // マップ＋ステータスパネル
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // マップエリア（正方形）
                      Expanded(
                        flex: 3,
                        child: MapWidget(
                          mapData: mapData,
                          player: gs.player,
                          explored: explored,
                        ),
                      ),
                      // ステータスパネル（右側）
                      SizedBox(
                        width: 100,
                        child: StatusPanel(state: gs),
                      ),
                    ],
                  ),
                ),
                // メッセージログ
                MessageLog(messages: gs.messages),
                // コントローラーエリア
                _ControllerArea(gameState: gs),
              ],
            ),

            // ===========================
            // オーバーレイ（バトル）
            // ===========================
            if (gs.battleState != null)
              Positioned.fill(
                child: BattleOverlay(gameState: gs),
              ),

            // ===========================
            // オーバーレイ（ショップ）
            // ===========================
            if (gs.showShop)
              Positioned.fill(
                child: ShopOverlay(gameState: gs),
              ),

            // ===========================
            // オーバーレイ（メニュー）
            // ===========================
            if (gs.showMenu)
              Positioned.fill(
                child: MenuOverlay(gameState: gs),
              ),
          ],
        ),
      ),
    );
  }
}

/// タイトルバー
class _TitleBar extends StatelessWidget {
  final String currentMap;

  const _TitleBar({required this.currentMap});

  @override
  Widget build(BuildContext context) {
    final mapNames = {
      'town': '謎の洞窟 - 町',
      'dungeon1': '謎の洞窟 - B1F',
      'dungeon2': '謎の洞窟 - B2F',
      'dungeon3': '謎の洞窟 - B3F',
    };
    return Container(
      height: 40,
      color: AppColors.wallColor,
      alignment: Alignment.center,
      child: Text(
        mapNames[currentMap] ?? '謎の洞窟',
        style: GoogleFonts.shareTechMono(
          color: AppColors.primary,
          fontSize: 14,
        ),
      ),
    );
  }
}

/// コントローラーエリア（Dパッド + アクションボタン）
class _ControllerArea extends StatelessWidget {
  final GameState gameState;

  const _ControllerArea({required this.gameState});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      color: AppColors.background,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Dパッド
          DpadWidget(
            onMove: (dx, dy) => gameState.movePlayer(dx, dy),
          ),
          const Spacer(),
          // Aボタン（現在は移動のみ、決定機能は後続で拡張可能）
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _CircleBtn(
                label: 'A',
                onTap: () {
                  // TODO: 決定アクション（話しかける等）
                },
              ),
              const SizedBox(height: 8),
              _CircleBtn(
                label: 'B',
                onTap: gameState.toggleMenu,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CircleBtn extends StatefulWidget {
  final String label;
  final VoidCallback onTap;

  const _CircleBtn({required this.label, required this.onTap});

  @override
  State<_CircleBtn> createState() => _CircleBtnState();
}

class _CircleBtnState extends State<_CircleBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
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
