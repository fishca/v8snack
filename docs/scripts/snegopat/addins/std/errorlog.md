## `snegopat/addins/std/errorlog.js`

- Язык: **JScript**, строк: **271**, объявлений: **16**
- Назначение: Журнал ошибок Снегопата
- Состав: func — 16

- `readUtf8(path)`
- `logFiles()` — Файлы логов за последние сутки (по всем подпапкам logs\)
- `parseLogErrors(text)` — Разбор записей лога Core.As: запись начинается строкой с |!!!| и продолжается строками « |  .|»
- `field(name)`
- `add(source, text, detail)`
- `flushRepeats()`
- `scanLogs(first, minAge)` — Обход дерева logs\ — дорогой на сетевой папке (~1 с главного потока), поэтому не чаще раза в WALK_PERIOD (или minAge); между обходами на каждом проходе проверяем только размер уже известных файлов (одно обращение на файл).
- `saveScriptError(text)`
- `drainScriptErrors()`
- `emit()`
- `recent(n)` — ── API для скриптов ──
- `since(afterSeq)`
- `lastSeq()`
- `macrosПоказатьНедавниеОшибки()`
- `macrosОткрытьПапкуЖурналов()`
- `getDefaultMacros()`
