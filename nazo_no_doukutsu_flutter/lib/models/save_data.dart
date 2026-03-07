/// セーブスロット表示用の情報
class SaveSlotInfo {
  final int slot;
  final String charName;
  final String jobName;
  final int lv;
  final String location;
  final String savedAt; // 'YYYY/MM/DD HH:MM' 形式

  const SaveSlotInfo({
    required this.slot,
    required this.charName,
    required this.jobName,
    required this.lv,
    required this.location,
    required this.savedAt,
  });

  Map<String, dynamic> toJson() => {
    'slot':     slot,
    'charName': charName,
    'jobName':  jobName,
    'lv':       lv,
    'location': location,
    'savedAt':  savedAt,
  };

  factory SaveSlotInfo.fromJson(Map<String, dynamic> json) => SaveSlotInfo(
    slot:     json['slot'] as int,
    charName: json['charName'] as String,
    jobName:  json['jobName'] as String,
    lv:       json['lv'] as int,
    location: json['location'] as String,
    savedAt:  json['savedAt'] as String,
  );
}
