# 謎の洞窟 RPG

ランダム生成ダンジョンを探索するターン制RPG。ブラウザで動作するHTML/JS版と、AndroidアプリとしてビルドできるFlutter版の2種類を収録。

---

## プロジェクト構成

```
nazo_no_doukutsu/          # HTML/JS版（ブラウザで即プレイ可能）
nazo_no_doukutsu_flutter/  # Flutter/Android版
```

---

## HTML/JS版 (`nazo_no_doukutsu/`)

ブラウザのみで動作するシングルファイル構成のRPG。

- **起動方法**: `nazo_no_doukutsu/index.html` をブラウザで開く
- **依存関係**: なし（純粋なHTML/CSS/JavaScript）

### 操作方法（ブラウザ版）

| キー | 操作 |
|------|------|
| W / ↑ | 上移動 |
| S / ↓ | 下移動 |
| A / ← | 左移動 |
| D / → | 右移動 |

---

## Flutter/Android版 (`nazo_no_doukutsu_flutter/`)

HTML/JS版をFlutterで移植したAndroidアプリ。

### 使用技術

- Flutter 3.x / Dart
- Provider（状態管理）
- SharedPreferences（セーブデータ）
- Google Fonts
- CustomPainter（マップ描画）

### 主な機能

- 再帰バックトラッキングによる手続き型ダンジョン生成
- 霧の戦争（Fog of War）
- 3スロットセーブ
- フルバトルシステム

### ビルド方法

```bash
cd nazo_no_doukutsu_flutter
flutter pub get
flutter build apk
```

### 操作方法（Android版）

画面上のボタンで移動。バトル中は「攻撃」「逃げる」を選択。

---

## スクリーンショット

*（スクリーンショット準備中）*

---

## ライセンス

MIT License
