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

暗黒竜ヴォルガンにさらわれたミレーユ姫を救い出す、ブラウザで動くRPG。

- **遊ぶ**: https://dolphinhotel21.github.io/nazo-no-doukutsu/nazo_no_doukutsu/
- **ローカル起動**: `nazo_no_doukutsu/index.html` をブラウザで開く
- **依存関係**: なし（純粋なHTML/CSS/JavaScript）

### 内容

- 町（城・宿屋・各ショップ）と、入るたびに形が変わる地下5階の洞窟
- B3Fの門番ゴーレム、B4Fの伝説の武器、B5Fの暗黒竜と姫の牢
- 宝箱・罠（盗賊は解除できる）・回復の泉
- ドット絵のマップと敵、ダメージ表示などの戦闘演出
- WebAudioによるBGM・効果音（音声ファイルなし、♪ボタンでON/OFF）
- スマホ対応（十字キー、押しっぱなしで連続移動）、3スロットセーブ

### ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | 画面の構造 |
| `style.css` | 見た目・スマホ対応 |
| `art.js` | ドット絵（SVG）の生成 |
| `audio.js` | BGM・効果音 |
| `game.js` | ゲーム本体 |
| `service-worker.js` | オフライン対応（ネットワーク優先） |

### 操作方法

| 操作 | PC | スマホ |
|------|----|-------|
| 移動 | 矢印キー / WASD | 画面下の十字キー |
| 決定 | Enter / Space | タップ |
| メニュー | Esc | メニューボタン |

---

## Flutter/Android版 (`nazo_no_doukutsu_flutter/`)

HTML/JS版（初期版）をFlutterで移植したAndroidアプリ。姫救出などの追加要素はまだ反映していない。

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
