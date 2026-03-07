import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'constants/app_colors.dart';
import 'game/game_state.dart';
import 'screens/char_create_screen.dart';
import 'screens/ending_screen.dart';
import 'screens/game_over_screen.dart';
import 'screens/game_screen.dart';
import 'screens/title_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // 縦向き固定
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  // 全画面（ステータスバー非表示）
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  runApp(
    ChangeNotifierProvider(
      create: (_) => GameState(),
      child: const NazoDungeon(),
    ),
  );
}

class NazoDungeon extends StatelessWidget {
  const NazoDungeon({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '謎の洞窟',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.primary,
          surface: AppColors.background,
        ),
      ),
      home: const _RootNavigator(),
    );
  }
}

/// ゲーム状態に基づいて画面を切り替えるルートウィジェット
class _RootNavigator extends StatelessWidget {
  const _RootNavigator();

  @override
  Widget build(BuildContext context) {
    final gs = context.watch<GameState>();

    switch (gs.screen) {
      case 'charCreate':
        return CharCreateScreen(gameState: gs);
      case 'game':
        return GameScreen(gameState: gs);
      case 'ending':
        return EndingScreen(gameState: gs);
      case 'gameOver':
        return GameOverScreen(gameState: gs);
      default: // 'title'
        return TitleScreen(gameState: gs);
    }
  }
}
