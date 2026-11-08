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

- 町（城・宿屋・各ショップ）と、草原・森・山・川のあるフィールド、入るたびに形が変わる地下5階の洞窟
- 町にいる4人（アレス・リナ・セラ・ジン）から2人まで仲間にでき、3人パーティで冒険（隊列で歩く）
- 敵は最大3体。狙いは「自動／手動」を切り替えられる。サンダーは敵全体、竜のブレスは味方全体
- 左に味方・右に敵が並ぶ戦闘画面。装備で見た目が変わり、HP/MPは青いバー、魔法は手元から飛んでいく
- B3Fの門番ゴーレム、B4Fの伝説の武器、B5Fの暗黒竜と姫の牢。全滅しても城で復活（所持金半分）
- 宝箱・罠（盗賊がいれば解除）・回復の泉、WebAudioのBGM・効果音
- スマホ対応（画面を押し続けて移動、全画面）、3スロットセーブ

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
