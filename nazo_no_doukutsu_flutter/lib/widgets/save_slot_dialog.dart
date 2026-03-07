import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../game/game_state.dart';
import '../game/save_manager.dart';
import '../models/save_data.dart';

/// セーブスロット選択ダイアログを表示
Future<void> showSaveDialog(
  BuildContext context,
  GameState gameState, {
  required bool exitAfter,
}) async {
  await showDialog<void>(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.8),
    builder: (ctx) => _SaveSlotDialog(
      gameState: gameState,
      exitAfter: exitAfter,
    ),
  );
}

/// ロードスロット選択ダイアログを表示
Future<void> showLoadDialog(
  BuildContext context,
  GameState gameState,
) async {
  await showDialog<void>(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.8),
    builder: (ctx) => _LoadSlotDialog(gameState: gameState),
  );
}

// ===========================
// セーブダイアログ
// ===========================
class _SaveSlotDialog extends StatefulWidget {
  final GameState gameState;
  final bool exitAfter;

  const _SaveSlotDialog({required this.gameState, required this.exitAfter});

  @override
  State<_SaveSlotDialog> createState() => _SaveSlotDialogState();
}

class _SaveSlotDialogState extends State<_SaveSlotDialog> {
  List<SaveSlotInfo?> _slots = [null, null, null];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final slots = await SaveManager.getAllSlotInfos();
    if (mounted) setState(() { _slots = slots; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.exitAfter ? '[ セーブして終了 ]' : '[ セーブスロット選択 ]';
    return Dialog(
      backgroundColor: AppColors.background,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.primary),
        borderRadius: BorderRadius.zero,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title,
                style: GoogleFonts.shareTechMono(
                    color: AppColors.primary, fontSize: 13)),
            const SizedBox(height: 12),
            if (_loading)
              const CircularProgressIndicator(color: AppColors.primary)
            else
              ..._slots.asMap().entries.map((e) =>
                _slotCard(e.key + 1, e.value)),
            const SizedBox(height: 8),
            _btn('キャンセル', () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }

  Widget _slotCard(int slot, SaveSlotInfo? info) {
    return GestureDetector(
      onTap: () async {
        await widget.gameState.saveGame(slot);
        if (!mounted) return;
        Navigator.pop(context);
        if (widget.exitAfter) {
          widget.gameState.goToTitle();
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.secondary),
          color: const Color(0xFF001A00),
        ),
        child: Row(
          children: [
            Text('[$slot] ', style: const TextStyle(
                color: AppColors.primary, fontSize: 12)),
            Expanded(
              child: info == null
                  ? const Text('─── 空き ───',
                      style: TextStyle(color: AppColors.textDim, fontSize: 11))
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${info.charName}（${info.jobName}）LV.${info.lv}',
                          style: const TextStyle(
                              color: AppColors.textBright, fontSize: 12),
                        ),
                        Text(info.savedAt,
                            style: const TextStyle(
                                color: AppColors.textDim, fontSize: 10)),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _btn(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.secondary),
        ),
        child: Text(label,
            style: const TextStyle(
                color: AppColors.primary, fontSize: 12)),
      ),
    );
  }
}

// ===========================
// ロードダイアログ
// ===========================
class _LoadSlotDialog extends StatefulWidget {
  final GameState gameState;

  const _LoadSlotDialog({required this.gameState});

  @override
  State<_LoadSlotDialog> createState() => _LoadSlotDialogState();
}

class _LoadSlotDialogState extends State<_LoadSlotDialog> {
  List<SaveSlotInfo?> _slots = [null, null, null];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final slots = await SaveManager.getAllSlotInfos();
    if (mounted) setState(() { _slots = slots; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.background,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.primary),
        borderRadius: BorderRadius.zero,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('[ ロードする ]',
                style: GoogleFonts.shareTechMono(
                    color: AppColors.primary, fontSize: 13)),
            const SizedBox(height: 12),
            if (_loading)
              const CircularProgressIndicator(color: AppColors.primary)
            else
              ..._slots.asMap().entries.map((e) =>
                _slotCard(e.key + 1, e.value)),
            const SizedBox(height: 8),
            _btn('キャンセル', () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }

  Widget _slotCard(int slot, SaveSlotInfo? info) {
    final hasData = info != null;
    return GestureDetector(
      onTap: hasData
          ? () async {
              Navigator.pop(context);
              await widget.gameState.loadGame(slot);
            }
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          border: Border.all(
            color: hasData ? AppColors.secondary : AppColors.textDim),
          color: hasData ? const Color(0xFF001A00) : AppColors.background,
        ),
        child: Row(
          children: [
            Text('[$slot] ', style: TextStyle(
                color: hasData ? AppColors.primary : AppColors.textDim,
                fontSize: 12)),
            Expanded(
              child: info == null
                  ? const Text('─── 空き ───',
                      style: TextStyle(color: AppColors.textDim, fontSize: 11))
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${info.charName}（${info.jobName}）LV.${info.lv}',
                          style: const TextStyle(
                              color: AppColors.textBright, fontSize: 12),
                        ),
                        Text(info.savedAt,
                            style: const TextStyle(
                                color: AppColors.textDim, fontSize: 10)),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _btn(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.secondary),
        ),
        child: Text(label,
            style: const TextStyle(
                color: AppColors.primary, fontSize: 12)),
      ),
    );
  }
}
