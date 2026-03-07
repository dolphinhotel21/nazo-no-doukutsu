import 'package:flutter/material.dart';

/// アプリ全体で使用するカラーパレット
class AppColors {
  AppColors._();

  static const background    = Color(0xFF000000); // 黒背景
  static const primary       = Color(0xFF00FF41); // メイングリーン
  static const secondary     = Color(0xFF00AA2B); // 暗めグリーン
  static const dimmed        = Color(0xFF003311); // 霧(探索済み)
  static const textBright    = Color(0xFF00FF41); // 明るいテキスト
  static const textDim       = Color(0xFF007722); // 暗いテキスト
  static const damage        = Color(0xFFFF3333); // ダメージ赤
  static const heal          = Color(0xFF33FF88); // 回復緑
  static const gold          = Color(0xFFFFD700); // ゴールド（ペリカ）
  static const highlight     = Color(0xFF00FF41); // カーソル選択
  static const wallColor     = Color(0xFF1A1A1A); // 壁タイル
  static const floorColor    = Color(0xFF0D0D0D); // 床タイル
  static const stairColor    = Color(0xFFFFFF00); // 階段
  static const shopColor     = Color(0xFF00FFFF); // 施設タイル
  static const bossColor     = Color(0xFFFF0000); // ボスタイル
  static const treasureColor = Color(0xFFFFD700); // 宝箱タイル
  static const playerColor   = Color(0xFF00FF41); // プレイヤー
  static const poisonColor   = Color(0xFFAA00FF); // 毒
  static const magicColor    = Color(0xFFAABBFF); // 魔法
}
