import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../data/job_data.dart';
import '../game/game_state.dart';

/// キャラクター作成画面
class CharCreateScreen extends StatefulWidget {
  final GameState gameState;

  const CharCreateScreen({super.key, required this.gameState});

  @override
  State<CharCreateScreen> createState() => _CharCreateScreenState();
}

class _CharCreateScreenState extends State<CharCreateScreen> {
  final _nameController = TextEditingController();
  String? _selectedJob;
  bool get _canStart =>
      _nameController.text.trim().isNotEmpty && _selectedJob != null;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 戻るボタン
              TextButton(
                onPressed: widget.gameState.goToTitle,
                child: const Text('← タイトルへ',
                    style: TextStyle(color: AppColors.textDim, fontSize: 12)),
              ),
              const SizedBox(height: 8),
              Text(
                'キャラクターの名前を入力:',
                style: GoogleFonts.shareTechMono(
                    color: AppColors.textBright, fontSize: 13),
              ),
              const SizedBox(height: 8),
              // 名前入力
              TextField(
                controller: _nameController,
                maxLength: 8,
                style: GoogleFonts.shareTechMono(
                    color: AppColors.primary, fontSize: 16),
                decoration: InputDecoration(
                  counterStyle: const TextStyle(color: AppColors.textDim),
                  enabledBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: AppColors.secondary),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: AppColors.primary),
                  ),
                  filled: true,
                  fillColor: const Color(0xFF001A00),
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),
              Text(
                '職業を選んでください:',
                style: GoogleFonts.shareTechMono(
                    color: AppColors.textBright, fontSize: 13),
              ),
              const SizedBox(height: 8),
              // 職業選択
              ...JobData.all.entries.map((e) =>
                _jobCard(e.key, e.value)),
              const SizedBox(height: 20),
              // 開始ボタン
              GestureDetector(
                onTap: _canStart
                    ? () {
                        widget.gameState.startNewGame(
                          _nameController.text.trim(),
                          _selectedJob!,
                        );
                      }
                    : null,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: _canStart ? AppColors.primary : AppColors.textDim,
                    ),
                    color: _canStart
                        ? const Color(0xFF001A00)
                        : AppColors.background,
                  ),
                  child: Text(
                    '冒険を開始する',
                    style: GoogleFonts.shareTechMono(
                      color: _canStart
                          ? AppColors.primary
                          : AppColors.textDim,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _jobCard(String jobId, JobDefinition job) {
    final selected = _selectedJob == jobId;
    return GestureDetector(
      onTap: () => setState(() => _selectedJob = jobId),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.secondary,
            width: selected ? 2 : 1,
          ),
          color: selected
              ? const Color(0xFF001A00)
              : AppColors.background,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (selected)
                        const Text('▶ ',
                            style: TextStyle(
                                color: AppColors.primary, fontSize: 14)),
                      Text(
                        job.name,
                        style: GoogleFonts.shareTechMono(
                          color: selected
                              ? AppColors.primary
                              : AppColors.textBright,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    job.description,
                    style: GoogleFonts.shareTechMono(
                      color: AppColors.textDim,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'HP:${job.baseHp} MP:${job.baseMp} ATK:${job.baseAtk} DEF:${job.baseDef}',
                    style: const TextStyle(
                      color: AppColors.textDim,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
