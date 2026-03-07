import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/game_config.dart';
import '../map/game_map.dart';
import '../map/tile_type.dart';
import '../models/player.dart';

/// 霧状態
enum FogState { hidden, explored, visible }

/// マップを CustomPainter で描画するウィジェット
class MapWidget extends StatelessWidget {
  final GameMap mapData;
  final Player player;
  final Set<String> explored;

  const MapWidget({
    super.key,
    required this.mapData,
    required this.player,
    required this.explored,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tileSize = constraints.maxWidth / GameConfig.viewSize;
        return CustomPaint(
          size: Size(constraints.maxWidth, constraints.maxWidth),
          painter: MapPainter(
            mapData: mapData,
            player: player,
            explored: explored,
            tileSize: tileSize,
          ),
        );
      },
    );
  }
}

/// マップ描画 CustomPainter
class MapPainter extends CustomPainter {
  final GameMap mapData;
  final Player player;
  final Set<String> explored;
  final double tileSize;

  MapPainter({
    required this.mapData,
    required this.player,
    required this.explored,
    required this.tileSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final v = GameConfig.viewSize;
    final s = GameConfig.mapSize;
    final px = player.x;
    final py = player.y;

    // ビューポートの左上座標（プレイヤー中心）
    int viewX = px - v ~/ 2;
    int viewY = py - v ~/ 2;
    viewX = viewX.clamp(0, s - v);
    viewY = viewY.clamp(0, s - v);

    // 背景を黒で塗りつぶし
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = AppColors.background,
    );

    for (var ry = 0; ry < v; ry++) {
      for (var rx = 0; rx < v; rx++) {
        final mx = viewX + rx;
        final my = viewY + ry;
        final key = '$mx,$my';

        final dist = (mx - px).abs() + (my - py).abs();
        final isPlayer = (mx == px && my == py);
        final inSight = dist <= GameConfig.fogRadius || isPlayer;
        final wasExplored = explored.contains(key);

        // 未探索かつ視野外
        if (!wasExplored && !inSight) continue;

        final fog = isPlayer || inSight
            ? FogState.visible
            : FogState.explored;

        final rect = Rect.fromLTWH(
          rx * tileSize,
          ry * tileSize,
          tileSize,
          tileSize,
        );

        if (isPlayer) {
          _drawTile(canvas, mapData.getTile(mx, my), rect, FogState.visible);
          _drawPlayer(canvas, rect, player.job);
        } else {
          _drawTile(canvas, mapData.getTile(mx, my), rect, fog);
        }
      }
    }
  }

  void _drawTile(Canvas canvas, TileType type, Rect rect, FogState fog) {
    Color bgColor;
    Color fgColor;
    String symbol;

    switch (type) {
      case TileType.wall:
        bgColor = AppColors.wallColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.textDim;
        symbol = '█';
      case TileType.floor:
        bgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.floorColor;
        fgColor = AppColors.textDim;
        symbol = '·';
      case TileType.stairDown:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.stairColor;
        symbol = '▼';
      case TileType.stairUp:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.stairColor;
        symbol = '▲';
      case TileType.house:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'H';
      case TileType.inn:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'I';
      case TileType.magicShop:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'M';
      case TileType.weaponShop:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'W';
      case TileType.armorShop:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'A';
      case TileType.itemShop:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'T';
      case TileType.dungeonEntrance:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.shopColor;
        symbol = 'D';
      case TileType.boss:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.bossColor;
        symbol = 'B';
      case TileType.treasure:
        bgColor = AppColors.floorColor;
        fgColor = fog == FogState.explored ? AppColors.dimmed : AppColors.treasureColor;
        symbol = '\$';
    }

    // 背景塗りつぶし
    canvas.drawRect(rect, Paint()..color = bgColor);

    // シンボル文字描画
    if (fog != FogState.hidden && symbol.isNotEmpty) {
      final textPainter = TextPainter(
        text: TextSpan(
          text: symbol,
          style: TextStyle(
            color: fgColor,
            fontSize: tileSize * 0.75,
            fontFamily: 'monospace',
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      textPainter.paint(
        canvas,
        Offset(
          rect.left + (rect.width - textPainter.width) / 2,
          rect.top + (rect.height - textPainter.height) / 2,
        ),
      );
    }
  }

  /// プレイヤーをピクセルアート風に描画（職業別カラー）
  void _drawPlayer(Canvas canvas, Rect rect, String job) {
    Color bodyColor;
    Color legColor;
    const skinColor = Color(0xFFD4935E);

    switch (job) {
      case 'warrior':
        bodyColor = const Color(0xFFCC2200);
        legColor  = const Color(0xFF881100);
      case 'mage':
        bodyColor = const Color(0xFF1133BB);
        legColor  = const Color(0xFF0A1E88);
      case 'priest':
        bodyColor = const Color(0xFFDDDDDD);
        legColor  = const Color(0xFF888888);
      case 'thief':
        bodyColor = const Color(0xFF226622);
        legColor  = const Color(0xFF113311);
      default:
        bodyColor = AppColors.playerColor;
        legColor  = AppColors.secondary;
    }

    final u = rect.width / 6; // ドット1個の幅

    void drawDot(double col, double row, Color color) {
      canvas.drawRect(
        Rect.fromLTWH(
          rect.left + col * u,
          rect.top + row * u,
          u,
          u,
        ),
        Paint()..color = color,
      );
    }

    // row 0: 帽子（body色）
    for (final c in [1.0, 2.0, 3.0, 4.0]) {
      drawDot(c, 0, bodyColor);
    }
    // row 1: 顔（肌色）
    for (final c in [1.0, 2.0, 3.0, 4.0]) {
      drawDot(c, 1, skinColor);
    }
    // row 2: 肩（全幅）
    for (final c in [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]) {
      drawDot(c, 2, bodyColor);
    }
    // row 3: 上半身
    for (final c in [1.0, 2.0, 3.0, 4.0]) {
      drawDot(c, 3, bodyColor);
    }
    // row 4: 腕
    for (final c in [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]) {
      drawDot(c, 4, bodyColor);
    }
    // row 5: 下半身
    for (final c in [1.0, 2.0, 3.0, 4.0]) {
      drawDot(c, 5, bodyColor);
    }
    // row 6-7: 足
    for (final c in [1.0, 4.0]) {
      drawDot(c, 6, legColor);
      drawDot(c, 7, legColor);
    }
  }

  @override
  bool shouldRepaint(MapPainter oldDelegate) =>
      oldDelegate.player.x != player.x ||
      oldDelegate.player.y != player.y ||
      oldDelegate.mapData != mapData ||
      oldDelegate.explored.length != explored.length;
}
