# Ядро движка: инфраструктура, настройки, диагностика, аддины

Документ описывает 12 файлов группы «ядро» движка Снегопата (папка `snegopat-client/x64/modules/snegopat/engine/`):
`pathes.as`, `options.as`, `settings_store.as`, `diag.as`, `dllloader.as`, `scriptLoader.as`, `addins.as`, `exitApp.as`, `tests.as`, `develop.as`, `probe_ifaces.as`, `templates.as`.

Общая модель запуска: нативный `snegopat.dll` ловит создание окна заставки 1С и вызывает `run()` из `main.as`; тот инициализирует пути (`initPathes`), перехват открытия профиля платформы (`initSnegopatProfile`), и внутри хука `IProfileService_openTrap` (main.as:68) вызывает `initAllOption()` и `initPackets(piOnMainEnter)`. Дальше пакеты стартуют по уровням `piOnMainEnter` → `piOnMainWindow` → `piOnFirstIdle` → `piOnDesignerInit` (см. packets.as). Файлы этой группы содержат пакеты: `pktTemplates` (piOnMainEnter), `ScriptInit` и `exitApp` (piOnMainWindow), `pkAddinMgr` (piOnFirstIdle).

Все файлы начинаются строками `#pragma once` + `#include "../all.h"` — `all.h` собирается препроцессором из всех `.as` движка (в репозитории его нет), поэтому «свободные функции» из любого файла движка видны всем остальным без явных объявлений.

---

## pathes.as (45 строк)
**Назначение.** Установка путей к папкам Снегопата в едином глобальном объекте `pathes`. Хранит: `main` — корень Снегопата, `core` — папка движка, `addins` — официальный репозиторий аддинов, `tools` — вспомогательные инструменты, `data` — папка данных, `help` — сформированные файлы справки, `tmp` — временные файлы. По комментарию в шапке путь `main` всегда указывает на каталог Снегопата, `tmp` — всегда на папку временных файлов.

**Инициализация.**
- Свободная функция `void initPathes()` (pathes.as:20) — выполняет `&&pathes = Pathes();`, то есть создаёт глобальный объект настроек путей. Вызывается из `run()` в main.as:35, то есть до инициализации любых пакетов (в момент окна заставки).
- Глобальные переменные (pathes.as:24-25): `Pathes&& pathes` — главный объект; `string cmdLine` — объявлена, но в этой группе файлов нигде не заполняется и не читается (остаток старой функциональности командной строки).
- Сайд-эффектов конструкторов-пакетов нет: инициализация только через явный вызов `initPathes()`.
- `OptionsEntry` в файле нет.

**Типы.**
### `class Pathes` (pathes.as:27)
Простой контейнер строк, наследования нет.
Поля (все приватные по смыслу, читаются напрямую как `pathes._xxx` из других файлов — в AngelScript `string _main;` это просто поле):
- `string _main` — корневая папка Снегопата (`myFolder`, т.е. `env.moduleDir`, заполненный в main.as:25);
- `string _core` — папка движка (тоже `myFolder` — движок лежит в корне);
- `string _addins` — `myFolder + "addins\\"`;
- `string _tools` — `myFolder + "tools\\"`;
- `string _data` — `env.dataDir` (папка данных 1С);
- `string _help` — `myFolder + "help\\"`;
- `string _tmp` — `env.tempDir`.

Конструктор `Pathes()` (pathes.as:36-44) заполняет все поля перечисленным образом. Методов нет.

**Функции файла.**
- `void initPathes()` — см. выше. Единственная функция файла.

**Перехваты.** Нет.

**Используемые API.** `env.moduleDir`, `env.dataDir`, `env.tempDir` (переменные окружения, предоставляемые нативным хостом). Ссылка `myFolder` — глобальная строка из main.as:16, заполненная в `run()`.

**Взаимодействия.**
- Предоставляет: глобальные `pathes` и `cmdLine`.
- Потребители: практически весь движок — `settings_store.as` (`pathes._data` в `settingsDir()`/`settingsDefaultsDir()`), `addins.as` (`pathes._addins` в `initAddins()`, `pathes._core`/`pathes._addins` в `AddinMgr::loadAddin`), `dllloader.as`/`scriptLoader.as` (через `findFullPath` и `<addins>`/`<core>`-подстановки), `com_snegopat.as`, `develop.as` и др.

**Версионные ветки.** Отсутствуют.

**Особенности.** `_core` дублирует `_main` (движок живёт в корне); `_data` и `_tmp` берутся из окружения платформы, остальные вычисляются от папки модуля. Небезопасное поведение отсутствует; файл тривиален, но от него зависит вся файловая инфраструктура.

---

## options.as (68 строк)
**Назначение.** Механизм настроек движка: система глобальных опций — каждая опция регистрируется глобальным объектом `OptionsEntry` с тремя функторами (значение по умолчанию, инициализация текущим значением, применение нового). Значения хранятся в файловом хранилище настроек (settings_store.as) в разделе ключей `Snegopat/Settings/<имя>`. При запуске все опции читаются/инициализируются за один проход.

**Инициализация.**
- Пакетов нет.
- Глобальные переменные: `OptionsEntry&& optionList` (options.as:38) — голова односвязного списка всех зарегистрированных опций; заполняется конструкторами `OptionsEntry` (сайд-эффект конструктора — вталкивание объекта в голову списка, options.as:33-34). Поэтому список при обходе идёт в обратном порядке регистрации.
- Функтор-типы (options.as:10-11): `funcdef bool OnApplyOption(const Value& newVal)` и `funcdef void OptionDefVal(Value& val)`.
- Файл-комментарий (options.as:40) прямо говорит: настройки движка лежат в своих файлах (settings_store.as), раздел `Snegopat/Settings`.
- Вызов `initAllOption()` выполняется из main.as:72 внутри хука `IProfileService_openTrap` — сразу после открытия профиля платформы и до `initPackets(piOnMainEnter)`.
- Пользователи `OptionsEntry` в движке: `oeEnableTextWork` (main.as:79), пять опций intellisite.as:56-73 (`UseLangs`, `ListWidth`, `AllowFilterInSmartList`, `InsertTextOnDot`, `CamelSearchOnUpperOnly`), четыре опции ModuleTextProcessor.as:12-27 (`Autoreplace`, `EnableSmartEnter`, `EnableSmartList`, `QuickActivateCharsCount`). Список экспортируется в COM: `com_snegopat.as:233` — `OptionsEntry&& _optionEntries = optionList;`.

**Типы.**
### `class OptionsEntry` (options.as:13)
Наследования нет. Представляет одну опцию движка.
Поля:
- `OptionsEntry&& _next` — следующий элемент списка опций;
- `string _name` — имя опции;
- `string _profile` — ключ хранилища, всегда `"Snegopat/Settings/" + n` (options.as:29);
- `private OptionDefVal&& defval` — функтор вычисления значения по умолчанию (записывает значение в переданный `Value`);
- `private OptionDefVal&& init` — функтор инициализации (принимает прочитанное/дефолтное значение, обычно кладёт его в глобальную переменную-состояние);
- `private OnApplyOption&& apply` — функтор применения; возвращает `bool` (у `oeEnableTextWork` возвращает `false`, чтобы отменить применение опции в диалоге — main.as:79-81).

Методы:
- `bool doApply(Variant& newVal)` (options.as:17-22) — применяется при изменении опции (вызывается через COM-объект настроек из аддинов): конвертирует `Variant` в `Value` (`var2val`), пишет значение в хранилище (`optionWrite(_profile, val)`), затем вызывает `apply(val)` и возвращает её результат.
- Конструктор `OptionsEntry(const string& n, OptionDefVal&& dv, OptionDefVal&& i, OnApplyOption&& ap)` (options.as:27-35) — запоминает имя, формирует `_profile`, сохраняет функторы, вталкивает `this` в голову `optionList`.

**Функции файла.**
- `void optionWrite(const string& key, const Value& val)` (options.as:41-46) — сериализует `Value` во «внутреннюю строку» 1С (`val.toString(text)` в `v8string`, затем `string`) и сохраняет через `settingsPut(key, internalText)`. Вызывается из `OptionsEntry::doApply` и `initAllOption`.
- `bool optionRead(const string& key, Value& val)` (options.as:48-55) — читает внутреннюю строку через `settingsGetInternal`, разбирает её `valueFromString(vs, val)`; `false`, если ключа нет.
- `void initAllOption()` (options.as:57-68) — обход списка опций от головы: для каждой опции читает `_profile` через `optionRead`; если значения нет — вызывает `ptr.defval(val)` и сразу `optionWrite(ptr._profile, val)` (первый запуск — значение уходит на диск); затем всегда вызывает `ptr.init(val)`. Вызывается один раз из main.as:72.

**Перехваты.** Нет.

**Используемые API.** `var2val` (Variant→Value), `Value.toString`, `valueFromString` (внутренняя строка 1С → Value) — нативные функции; `settingsPut`/`settingsGetInternal` из settings_store.as.

**Взаимодействия.**
- Зависит от settings_store.as (хранение) и main.as (момент вызова `initAllOption`).
- Предоставляет другим файлам движка: класс `OptionsEntry`, глобальный `optionList`, функции `optionRead`/`optionWrite`/`initAllOption`. Список опций доступен COM-скриптам через `snegopat._optionEntries` (com_snegopat.as:233).

**Версионные ветки.** Отсутствуют.

**Особенности.** Регистрация опций выполняется конструкторами глобальных объектов — до всякого `initAllOption`; поэтому функторы не должны зависеть от ещё не созданных объектов (только от глобальных переменных). Профиль платформы для настроек движка не используется — опции живут только в `data\Snegopat\settings\snegopat_settings...`-разделе хранилища (файл определяется первым сегментом ключа, т.е. `Snegopat.set`).

---

## settings_store.as (390 строк)
**Назначение.** Файловый механизм настроек Снегопата — единственное хранилище `pflSnegopat`; прежний файл `data\Snegopat\snegopat.pfl` полностью вырезан (с версии 1.6.0). Настройки лежат в небольших файлах `data\Snegopat\settings\<верхняя папка>.set` — по одному на «раздел» (`Snegopat`, `ExtFiles`, `BookMarkers`, …). Запись атомарная (временный файл + замена), перед записью файл перечитывается и накладываются только наши изменённые ключи (слияние с изменениями других Конфигураторов). Чужие изменения подхватываются опросом файла-метки `_version` раз в ~1,5 с. Платформенный профиль не участвует, поэтому не вызывает остановок «на сохранение». Начальные настройки («семя» владельца) лежат в `data\Snegopat\defaults\<раздел>.set` и добавляются для ключей, которых в разделе ещё нет; семя собирает `tools/pfl2set.py` из мастер-профиля. Значения — «внутренние строки» 1С (`ЗначениеВСтрокуВнутр`): `{"B",1}`, `{"N",5}`, `{"S","текст"}`, `{"#",…}` (таблицы). Формат `.set` — UTF-8, строки «ключ<TAB>значение», в значении экранируются `\`, `\n`, `\r`, `\t`.

**Инициализация.** Пакетов нет; весь файл — набор глобальных функций, вызываемых по мере обращения к настройкам (из options.as, com_profile.as, com_snegopat.as, errorlog.js). Глобальные переменные-состояние (settings_store.as:18-26):
- `string settingsVersionSeen` — последний прочитанный токен `_version`;
- `string settingsVersionMine` — токен, записанный нами (чтобы не перечитывать свои же изменения);
- `uint settingsDirtySince = 0` — время (GetTickCount) первого несохранённого изменения, 0 — изменений нет;
- `uint settingsLastPoll = 0` — время последнего опроса метки;
- `uint settingsExternalChanges = 0` — сколько раз подхвачены изменения других Конфигураторов;
- `uint settingsWrites = 0` — счётчик записей на диск;
- `uint settingsSeeded = 0` — сколько ключей добавлено из начальных настроек;
- `bool settingsExitHooked = false` — подвешен ли `settingsFlush` на выход из приложения;
- `bool settingsDirReady = false` — создан ли каталог `settings/`.
- `array<SettingsFile&&> settingsFileList` (settings_store.as:238) — все открытые разделы.

**Типы.**
### `class SettingsFile` (settings_store.as:97)
Кеш одного раздела (одного `.set`-файла). Наследования нет.
Поля:
- `string name` — имя раздела (имя файла без `.set`);
- `array<string> keys` — ключи как задавались (путь через `/`);
- `array<string> lkeys` — те же ключи в нижнем регистре (поиск без учёта регистра);
- `array<string> vals` — значения (внутренние строки 1С), параллельно `keys`;
- `array<string> pendKeys` / `pendOrig` / `pendVals` / `array<bool> pendDel` — локальные несохранённые изменения: ключ в нижнем регистре / ключ как задан / новое значение (пусто при удалении) / признак удаления.

Конструктор `SettingsFile(const string& nm)` (settings_store.as:107-110) — запоминает имя и сразу `load()` с диска.

Методы:
- `string path()` (112) — `settingsDir() + name + ".set"`.
- `int find(const string& lk)` (116-121) — линейный поиск индекса по `lkeys`, `-1` если нет.
- `void rawSet(const string& key, const string& lk, const string& val)` (123-132) — заменить значение существующего ключа или добавить новый в конец трёх массивов.
- `void rawDel(const string& lk)` (134-141) — удалить ключ (и его значение) из трёх массивов.
- `void load()` (144-168) — очистить `keys/lkeys/vals`, прочитать `readUtf8File(path())`, разбить по `\n`, обрезать `\r`, пропустить пустые строки и строки без TAB; для каждой строки `rawSet(k, diagLower(k), settingsUnesc(...))`. После чтения диска заново наложить все pending-изменения (`rawDel`/`rawSet` по pend-массивам) — так и обеспечивается слияние «чужое с диска + наше несохранённое».
- `uint seed()` (172-193) — прочитать `data\Snegopat\defaults\<name>.set`; для каждого ключа, которого нет в разделе (`find(lk) < 0`), выполнить `setLocal(k, lk, значение, false)`; вернуть число добавленных ключей. Существующие ключи семя не трогает. Добавленное уйдёт на диск первой же записью.
- `void setLocal(const string& key, const string& lk, const string& val, bool del)` (195-211) — применить изменение к кешу (`rawDel`/`rawSet`) и запомнить его в pend-массивах с дедупликацией: если тот же ключ уже есть в pending — обновить `pendVals[p]`/`pendDel[p]`, иначе добавить.
- `bool hasPending()` (213-215) — есть ли несохранённые изменения.
- `bool save()` (218-235) — при первом вызове создать каталог `settingsDir()` (`CreateDirectory`, `settingsDirReady=true`); `load()` (перечитать диск и наложить наши pending); сериализовать все ключи в «ключ\tзначение\n» с `settingsEsc`; записать атомарно `settingsWriteFile(path(), text)`; при успехе — очистить pend-массивы, `settingsWrites++`, вернуть `true`.

**Функции файла.**
- `string settingsDir()` (28-30) — `pathes._data + "settings/"`.
- `string settingsDefaultsDir()` (32-34) — `pathes._data + "defaults/"`.
- `string settingsEsc(const string& s)` (36-43) — экранирование `\` → `\\`, `\n` → `\n` (двухсимвольная последовательность), `\r`, `\t`.
- `string settingsUnesc(const string& s)` (45-64) — обратное преобразование посимвольно (`c == 92` — обратный слэш, далее `d == 110` → `\n`, `d == 114` → `\r`, `d == 116` → TAB; коды сравниваются числами, не литералами).
- `string settingsFileName(const string& key)` (67-78) — имя файла по первому сегменту ключа: всё до первого `/`; ключ без слэша → `_root`; символы `\ / : * ? " < > |` (коды 92, 47, 58, 42, 63, 34, 60, 62, 124) заменяются на `_`; результат в нижнем регистре (`diagLower`).
- `bool settingsWriteFile(const string& path, const string& text)` (80-95) — атомарная запись: `CreateFile(path + ".tmp", 0x40000000 (GENERIC_WRITE), 0, 0, 2 (CREATE_ALWAYS), 0x80 (FILE_ATTRIBUTE_NORMAL), 0)`; конвертация в UTF-8 `WideCharToMultiByteNull(65001, ...)` (два прохода: размер + заполнение буфера `malloc(len+4)`); `fileWriteBytes`; `CloseHandle`; `MoveFileEx(tmp, path, 1 /* MOVEFILE_REPLACE_EXISTING */)`; при неудаче — `DeleteFile(path)` и обычный `MoveFile`.
- `void settingsMarkDirty()` (240-247) — если это первое изменение, запомнить `GetTickCount()`; однократно (`settingsExitHooked`) подвесить `settingsFlush` на выход приложения: `exitAppHandlers.insertLast(PVV(settingsFlush))` (settings_store.as:245, функтор-обёртка PVV определена в exitApp.as:12).
- `SettingsFile&& settingsFileByName(const string& nm)` (249-262) — найти раздел в `settingsFileList` по имени; если нет — создать (`SettingsFile(nm)` = чтение файла), добавить в список, выполнить `seed()`; при добавлении ключей — `settingsSeeded += added`, `diagAlways("settings", ...)` и `settingsMarkDirty()` (чтобы семя ушло на диск).
- `SettingsFile&& settingsFileFor(const string& key)` (264-266) — `settingsFileByName(settingsFileName(key))`.
- `bool settingsHas(const string& key)` (268-270) — есть ли ключ (поиск по `diagLower(key)`).
- `bool settingsGetInternal(const string& key, string& result)` (272-279) — получить значение-внутреннюю-строку ключа; `false`, если нет.
- `void settingsPut(const string& key, const string& internal)` (281-284) — `setLocal(..., false)` + `settingsMarkDirty()`.
- `void settingsRemove(const string& key)` (286-289) — `setLocal(..., "", true)` (отложенное удаление) + `settingsMarkDirty()`.
- `void settingsChildren(const string& prefix, array<string>& values, array<string>& folders)` (292-335) — перечисление: прямые значения (leaf) и вложенные папки внутри `prefix` (`""` — корень). Для корня перебираются все `*.set` каталога `settings` (через `diagListDir(settingsDir() + "*.set", false)`) плюс разделы, которых ещё нет на диске, но есть в `defaults`; для непустого префикса — один файл `settingsFileName(prefix + "/x")`. По каждому файлу перебираются ключи, у подходящих (начинающихся с `prefix + "/"`, без учёта регистра) отрезается префикс; ключ без `/` — в `values`, с `/` — первый сегмент в `folders` (с дедупликацией без учёта регистра). Используется com_profile.as (строки 150, 171, 251, 268) для эмуляции перечисления ключей платформенного профиля.
- `void settingsFlush()` (338-357) — запись накопленных изменений: если `settingsDirtySince == 0` — выход; для каждого файла с `hasPending()` вызвать `save()`; при полном успехе `settingsDirtySince = 0`, иначе оставить (повтор через паузу); если хоть одна запись удалась — сформировать новый токен `settingsVersionMine = "<GetTickCount>-<ThreadId>-<settingsWrites>"`, запомнить его как `settingsVersionSeen` и записать в файл-метку `settingsDir() + "_version"` через `settingsWriteFile`.
- `void settingsPoll()` (360-375) — опрос метки: не чаще раза в 1500 мс (`settingsLastPoll`); прочитать `readUtf8File(_version)` и обрезать пробелы; если токен совпал с увиденным — выход; если совпал с нашим собственным — только обновить `settingsVersionSeen`; иначе — чужая запись: `load()` всех открытых файлов (наши pending накладываются поверх) и `settingsExternalChanges++` с записью в журнал `diagAlways("settings", ...)` (settings_store.as:374).
- `void settingsTick()` (378-382) — вызывается скриптом по таймеру (аддин `errorlog.js` раз в ~0,4 с через `snegopat.settingsTick()`, com_snegopat.as:185): если есть изменения старше 500 мс — `settingsFlush()`; затем `settingsPoll()`.
- `string settingsInfo()` (384-390) — строка состояния для отчётов: `mode=file; dir=...; files=N; keys=N; writes=N; seeded=N; external=N; dirty=yes/no`. Отдаётся через `snegopat.settingsInfo()` (com_snegopat.as:191).

**Перехваты.** Нет (перехват `IProfileService_open` в main.as служит лишь точкой запуска `initAllOption`, к самому хранилищу настроек платформа не подключается).

**Используемые API.** WinAPI через нативные обёртки: `CreateFile`, `CloseHandle`, `MoveFileEx`, `MoveFile`, `DeleteFile`, `CreateDirectory`, `GetTickCount`, `GetCurrentThreadId`; `WideCharToMultiByteNull` (UTF-8, кодовая страница 65001); `malloc`/`free`; `readUtf8File`; `fileWriteBytes`; `diagLower`, `diagListDir`, `diagAlways` (из diag.as); `pathes` (pathes.as); `exitAppHandlers`/`PVV` (exitApp.as); `GetTickCount`-арифметика на `uint`.

**Взаимодействия.**
- Зависит от: `pathes.as` (каталог данных), `diag.as` (`diagLower`, `diagListDir`, `diagAlways`), `exitApp.as` (обработчики выхода).
- Предоставляет: полный API настроек — `settingsHas`, `settingsGetInternal`, `settingsPut`, `settingsRemove`, `settingsChildren`, `settingsFlush`, `settingsTick`, `settingsInfo` — потребителям: `options.as` (раздел `Snegopat/Settings`), `com_profile.as` (эмуляция профиля `pflSnegopat`: чтение/запись/удаление/перечисление), `com_snegopat.as` (экспорт `settingsTick`/`settingsFlush`/`settingsInfo` в JS-аддины), `errorlog.js` (таймер).

**Версионные ветки.** Отсутствуют (переход на файловый режим зафиксирован в комментарии шапки: «с 1.6.0»).

**Особенности.**
- Атомарность записи через `.tmp` + `MoveFileEx(MOVEFILE_REPLACE_EXISTING)` с fallback на `DeleteFile`+`MoveFile` (settings_store.as:91-94) — устойчивость к «файл занят» на сетевых папках.
- Слияние при сохранении: файл всегда перечитывается, поверх — только наши изменённые ключи; параллельные Конфигураторы не затирают друг друга полностью.
- Кросс-процессное оповещение через файл-метку `_version` с токеном «tick-threadId-writes» — дешёвая альтернатива блокировкам.
- Поиск ключей без учёта регистра — двумя параллельными массивами (`keys`/`lkeys`).
- Задержка записи (≥500 мс с первого изменения) объединяет серии изменений в одну запись; запись на выходе приложения гарантирована хуком `exitAppHandlers`.
- `settingsFileName` осознанно возвращает `_root` для ключей без `/` (используется в `settingsChildren` с комментарием, что у «ZZTest» без слэша это не `_root` — settings_store.as:309).
- Риски: линейный поиск ключей и файлов (масштабы небольшие); `GetTickCount()` переполняется через ~49 дней (сравнения вычитанием, обычно безопасно); `settingsUnesc` не обрабатывает неизвестные escape (копирует как есть, теряя обратный слэш).

---

## diag.as (542 строки)
**Назначение.** Единая диагностика движка: журнал `logs/script-log.txt` (UTF-16), конфигурация через `logs/diag.ini` (перечитывается не чаще раза в 2 с, перезапуск 1С не нужен), суточная ротация журналов (хранятся 3 суток), кольцевой буфер последних 300 строк в памяти (`diagTail`) для аварийных отчётов, набор низкоуровневых отладочных функций для реверса платформы (безопасное чтение памяти, дампы vtable, hex-разбор). Управление перехватами платформы: ключи `hook.<имя>` включают/выключают перехваты, `cat.<категория>` — категории журнала, `trace=on` (или `log=on`) — подробный журнал. Старые флаг-файлы `logs/vt.on`, `logs/nohook-<имя>.on`, `logs/hook-<имя>.on` продолжают работать. Ссылки в шапке: `tools/ADAPT.md`, `tools/DISABLED-27.md`.

**Инициализация.** Пакетов нет. Глобальные объекты:
- `DiagState diagSt` (diag.as:31) — глобальный экземпляр состояния; конструктор по умолчанию фиксирует `startTick = GetTickCount()` (диаг.с:27) — от него считаются «секунды от старта» в метках журнала.
- `uint mainThreadId = GetCurrentThreadId();` (diag.as:149) — поток, в котором загружен движок (главный поток 1С); инициализируется при загрузке модуля.
- `string diagCtx` (diag.as:36) — «что делал движок перед открытием окна»; заполняется другими файлами (com_metadata.as:480,491 — `editProperty`/`openEditor`), попадает в записи «до оригинала» хуков `createWindow` (main.as:191,205).
- `diagBanner()` вызывается из `run()` (main.as:33) — первая строка журнала на каждый запуск.

**Типы.**
### `class DiagState` (diag.as:18-30)
Поля:
- `uint lastRead = 0` — время последнего чтения diag.ini;
- `bool loaded = false` — был ли diag.ini прочитан;
- `bool trace = false` — включена ли подробная трассировка;
- `array<string> keys, vals` — словарь ini-файла (ключи в нижнем регистре);
- `array<string> ring` — кольцевой буфер последних строк журнала;
- `uint ringPos = 0` — позиция записи в кольце;
- `uint seq = 0` — счётчик строк (номер записи);
- `uint startTick` — время старта процесса;
- `bool bannerDone = false` — заголовок сеанса уже записан;
- `int day = 0` — текущий день (дней от 1970 по местному времени) для суточной ротации.

Методов нет.

**Функции файла.**
Базовые:
- `string diagLower(const string& s)` (38-42) — копия строки в нижнем регистре (`makeLower`). Используется по всему движку как штатное приведение регистра.
- `string diagDir()` (44-46) — `myFolder + "../../logs/"` (папка logs рядом с x64).
- `bool diagFileExists(const string& path)` (48-54) — открытие `CreateFile(..., 0x80000000 (GENERIC_READ), 3, 0, 3 (OPEN_EXISTING), 0x80, 0)` + `CloseHandle`.
- `void diagReload()` (57-78) — прочитать `logs/diag.ini` в `diagSt.keys/vals` (не чаще раза в 2 с): строки «ключ=значение», комментарии `;` и `#`, пустые игнорируются, ключ и значение в нижнем регистре. Затем `diagSt.trace = diagIniIs("trace") || diagIniIs("log") || diagFileExists(diagDir() + "vt.on")`.
- `string diagGet(const string& key)` (80-85) — значение ключа ini или `""`.
- `bool diagIniIs(const string& key)` (87-90) — значение равно `on`/`1`/`true`/`yes`.
- `int diagHookMode(const string& name)` (93-107) — режим перехвата `<name>`: `0` — по умолчанию, `1` — принудительно включён, `2` — принудительно выключен. Приоритет: ключ `hook.<имя>` в diag.ini (`on`/`1` или `off`/`0`), затем файлы `nohook-<имя>.on` (→2) и `hook-<имя>.on` (→1).
- `bool diagHook(const string& name, bool defaultOn)` (110-115) — итоговое решение по перехвату (diagHookMode + `defaultOn` как умолчание); результат логируется `diagAlways("hook", ...)` один раз при установке перехвата. Используется mainmenu.as:304 (`"mainmenu"`), sqlcolors.as:162,195,244 (`"colors"`, `"linebg"`), StockListInterceptor.as:52,58 (`"list"`, `"liststale"`).
- `bool hookDisabled(const string& name)` / `bool hookForced(const string& name)` (118-123) — совместимость со старыми вызовами (`diagHookMode == 2` / `== 1`).
- `bool diagTraceOn(const string& cat = "")` (126-143) — включена ли подробная трассировка для категории: ключ `cat.<cat>` имеет приоритет (`off/0` → false, `on/1` → true); категории `vt`, `mdi`, `lex`, `key` без явного `cat.*=on` всегда `false` (тяжёлые дампы vtable падают внутри Core.As; опрос MDI-окон давал 90% мусора; `lex`/`key` — строка на каждый вызов разбора лексем/набранную букву, на сетевой папке журнал «замирал» на 3–5 с — комментарий diag.as:137-139); иначе `diagSt.trace`.
- `bool dbgOn()` (144-146) — `diagTraceOn()` без категории (старое имя).
- `bool diagIsMainThread(const string& where = "")` (152-159) — сравнение `GetCurrentThreadId()` с `mainThreadId`; чужой поток логируется (категория `thread`) — вызовы перехватчиков из других потоков Core.As обслужить не может.
- `string diagStamp()` (161-167) — метка строки журнала: «`секунды.мс pPID tПОТОК #номер`» (секунды от `startTick`, миллисекунды с ведущими нулями, `++diagSt.seq`).

Ротация журналов:
- `const int diagKeepDays = 3` (170) — хранить 3 суток; `const uint diagMaxPart = 33554432` (171) — 32 МБ на часть.
- `int diagDayNumber(int y, int m, int d)` (174-182) — дни от 1970-01-01 по гражданской дате (алгоритм Гиннанта-Полсона: `era*146097 + doe - 719468`).
- `string diagPad2(int v)` (184-186) — «07»-форматирование.
- `string diagDayName(int dn)` (189-202) — обратное преобразование дней от 1970 в «ГГГГ-ММ-ДД».
- `int diagToday()` (204-210) — текущий день: `GetLocalTime` в 16-байтный буфер `malloc(16)`, поля читаются `mem::word[st]` (год), `mem::word[st+2]` (месяц), `mem::word[st+6]` (день).
- `int diagFileDay(const string& path)` (213-229) — день последней записи файла: `FindFirstFile` в буфер `malloc(600)` (WIN32_FIND_DATA), время записи `fd+20` (ftLastWriteTime) → `FileTimeToLocalFileTime` → 64-битные тики через `uint64(mem::dword[lft+4]) << 32 | dword[lft]`, деление на 864000000000 (тиков в сутки) минус 134774 (смещение 1970 от 1601); 0 — файла нет или пуст.
- `array<string> diagListDir(const string& pattern, bool dirs)` (232-253) — имена в каталоге по маске: `FindFirstFile`/`FindNextFile`, имя читается из WIN32_FIND_DATA (смещение 44 = cFileName, посимвольно через `mem::word` до нуля, не более 260), `.` и `..` пропускаются, фильтр по признаку каталога (`mem::dword[fd] & 0x10` — FILE_ATTRIBUTE_DIRECTORY). Используется также settings_store.as (`settingsChildren`) и внутри diag.as.
- `bool diagArchiveLog(int day)` (256-265) — переименовать текущий `script-log.txt` в `script-log-<день>[-N].txt` (первые 10 свободных имён; все заняты — `DeleteFile`).
- `void diagCleanOld(int today)` (268-295) — удалить старое: `script-log.1.txt`; архивы `script-log-<день>[,-N].txt` от `today - diagKeepDays` до `today - 60`; журналы Core.As в `logs/Snegopat/<процесс>/<версия>/<разрядность>/` — файлы `*.log` и `*.trace`, у которых первые 10 символов имени (дата) меньше `cutoff = diagDayName(today - diagKeepDays + 1)` (трассы по 5–10 МБ на каждый запуск).
- `void diagRotateDaily()` (298-307) — при смене дня (и на старте процесса, когда `diagSt.day == 0`): день файла `script-log.txt` (`diagFileDay`) не совпадает с сегодняшним → `diagArchiveLog`, затем `diagCleanOld(today)`; если архив не удался (файл занят другим процессом) — повтор на следующей записи.

Запись журнала:
- `const uint diagFlushMs = 250`, `const uint diagFlushLines = 400` (315-316); `string diagBuf`, `uint diagBufLines`, `uint diagLastFlush` (317-319) — буфер отложенной записи; `int diagUncState = -1` (320) — журнал на сетевой папке (путь с двух слэшей): -1 не определено, 0 нет, 1 да.
- `bool diagIsUnc()` (322-328) — определение UNC-пути `diagDir()` по первым двум символам (коды 92/47).
- `void diagWriteRaw(const string& data)` (331-346) — запись готовых строк (уже с переводами строки): `diagRotateDaily()`, `CreateFile(path, 4 (GENERIC_READ|WRITE), 3 (SHARE_RW), 0, 4 (OPEN_ALWAYS), 0x80, 0)`; если `GetFileSize > diagMaxPart` — закрыть, архивировать (`diagArchiveLog(diagSt.day)`), открыть заново; `fileWriteBytes(h, data.cstr, data.length * 2)` (UTF-16LE), `CloseHandle`. Каждая запись = «открыть — дописать — закрыть» (~18 мс на сетевой папке — комментарий diag.as:309).
- `void diagFlush()` (349-357) — сбросить `diagBuf` на диск одним `diagWriteRaw`, обнулить счётчики, запомнить время. Безопасно вызывать в любой момент (пустой буфер — выход).
- `void diagWrite(const string& line, bool deferred = false)` (359-376) — строка попадает в кольцо `diagSt.ring` (последние `diagRingSize = 300`, diag.as:33, строк), затем: быстрый путь — если не `deferred` и буфер пуст, строка сразу на диск (`diagWriteRaw`); иначе в `diagBuf`, сброс при `diagBufLines >= diagFlushLines` или по времени `diagFlushMs` (для немедленных строк тоже — вместе со всем накопленным, порядок сохраняется).
- `void diagAlways(const string& cat, const string& text)` (379-381) — запись всегда (важные события: запуск, состояние перехватов, чужие потоки, настройки). Немедленная.
- `void diag(const string& cat, const string& text)` (384-390) — запись при включённой трассировке категории; отложенная, если категория `key`/`lex` или журнал на UNC, и в тексте нет слова «оригинал» (строки про вызов в платформу пишутся немедленно — если платформа упадёт, всё до вызова уже на диске).
- `void dbgLog(const string& text)` (393-395) — старый интерфейс, категория `dbg`.
- `string diagTail(uint n = 60)` (398-407) — последние `n` строк кольца в порядке записи; отдаётся через `snegopat.diagTail()` для диагностики и `tools/crashinfo.py` (комментарии diag.as:13, 314).

Настройки и низкоуровневая отладка:
- `void diagSet(const string& key, const string& value)` (410-436) — правка diag.ini: перечитать файл, выкинуть строки с таким ключом, дописать `ключ=значение` (пустое значение — просто удалить ключ), записать UTF-8 (`WideCharToMultiByteNull` + `fileWriteBytes`, `CreateFile` с `CREATE_ALWAYS=2`, share 3), сбросить `diagSt.loaded` (чтобы следующий `diagReload` перечитал).
- `string diagState()` (439-445) — строка отчёта: `trace=...; mainThread=...; ver=<sv8ver>; ini: ключ=значение ...`.
- `int_ptr dbgSafeQword(int_ptr addr)` (448-460) — безопасное чтение 8 байт по произвольному адресу: адреса `< 0x10000` → 0; `ReadProcessMemory(int_ptr(-1) /* текущий процесс */, addr, buf, 8, nread)`; вернуть прочитанное или 0. Для диагностики значений аргументов перехватчиков (StockListInterceptor.as:228-229).
- `string dbgHex(int_ptr v)` (462-464) — `formatInt(v, "0x", 16)`.
- `void dbgDumpVT(int_ptr obj, int tag)` (467-493) — дамп начала vtable объекта в `logs/vt-dump.bin` (только при `cat.vt=on`; комментарий: штатный `dumpVtable` падает внутри Core.As на этой платформе): `ReadProcessMemory(GetCurrentProcess(), ...)` — адрес объекта (`buf+16`), vtable (`buf+32`, 130 слотов); запись `[tag, адрес объекта, адрес vtable, маркер 0x4242424242424242]` + 130 слотов. Используется com_metadata.as:841,854,868 (теги 1,2,3) и com_windows.as:312 (тег 41).
- `void diagBanner()` (496-501) — однократный заголовок сеанса: `diagAlways("start", "Снегопат запущен, платформа <sv8ver>, главный поток <mainThreadId>, <diagState()>")`; вызывается из main.as:33.
- `string diagReadHex(int_ptr addr, uint len)` (505-523) — прочитать `len` байт (кратно 8, до 65536) по адресу через `ReadProcessMemory`, вернуть строку из 16-значных hex-слов через пробел; недоступная память — пустая строка. Для реверса структур платформы (`tools/dumpvt.py`, `tools/objscan.py`).
- `uint64 diagParseHex(const string& s)` (526-542) — разбор hex-строки (с `0x` или без; не-hex символы пропускаются) в `uint64`. Используется mainmenu.as:125 (разбор адресов из журналов).

**Перехваты.** Сам файл перехватов не ставит; он — инфраструктура решений о перехватах (`diagHook`, `hookDisabled`, `hookForced`) и их отладки (`dbgDumpVT`, `dbgSafeQword`, `diagCtx`).

**Используемые API.** WinAPI: `CreateFile`, `CloseHandle`, `GetFileAttributes`, `MoveFile`, `DeleteFile`, `FindFirstFile`/`FindNextFile`/`FindClose`, `FileTimeToLocalFileTime`, `GetLocalTime`, `GetFileSize`, `GetTickCount`, `GetCurrentProcessId`, `GetCurrentThreadId`, `GetCurrentProcess`, `ReadProcessMemory`, `WideCharToMultiByteNull`, `GetTickCount`; `mem::word`, `mem::dword`, `mem::int_ptr` (прямой доступ к памяти); `malloc`/`free`; `readUtf8File`, `fileWriteBytes`, `formatInt`; глобальные `myFolder` (main.as), `sv8ver` (main.as:15).

**Взаимодействия.**
- Зависит от: `main.as` (`myFolder`, `sv8ver`, вызов `diagBanner`).
- Предоставляет всем файлам движка: `diag`, `diagAlways`, `diagWrite`, `diagFlush`, `diagTail`, `dbgLog`, `dbgOn`, `diagTraceOn`, `diagHook`, `diagHookMode`, `hookDisabled`, `hookForced`, `diagIsMainThread`, `mainThreadId`, `diagCtx`, `diagLower`, `diagFileExists`, `diagListDir`, `diagDir`, `diagStamp`, `diagSet`, `diagState`, `diagBanner`, `dbgHex`, `dbgSafeQword`, `dbgDumpVT`, `diagReadHex`, `diagParseHex`, а также `settings_store.as` — `diagLower`/`diagListDir`.
- Экспорт в JS/COM: `snegopat.diagFlush()` (com_snegopat.as:181), `snegopat.diagLog(cat, text)` → `diagAlways` (com_snegopat.as:196-198); `diagTail` упомянут как `snegopat.diagTail()` для `tools/crashinfo.py`.
- Потребители-перехватчики: mainmenu.as, sqlcolors.as, StockListInterceptor.as (`diagHook`); почти все — `dbgOn`/`diagAlways`.

**Версионные ветки.** Отсутствуют.

**Особенности.**
- Три уровня «срочности» записи: немедленная (diagAlways, строки со словом «оригинал», быстрый путь при пустом буфере), отложенная (категории `key`/`lex` и весь UNC-журнал — буфер, сброс раз в 250 мс или 400 строк) и кольцо в памяти (300 строк, доступно после падения через `diagTail`).
- Многочисленные эвристики производительности вынесены в комментарии с конкретными инцидентами (Лонмади 2026-10-13: подсказка замирала на 3–5 с из-за ~18 мс на запись строки на сетевой папке; разбор падения frntend.dll+0x7f4adf 2026-10-03 — логирование «до/после оригинала»).
- Ручная арифметика дат (дни от 1970) — без CRT, через `GetLocalTime` и байты WIN32_FIND_DATA; чтение структур WinAPI напрямую через `mem::word`/`mem::dword` — хрупко при смене разрядности/смещений, но код рассчитан на x64.
- Ротация устойчива к конкуренции процессов: занятый файл просто не архивируется до следующей записи.
- `diagSet` перезаписывает весь ini, теряя комментарии.
- `diagHook` логирует своё решение при каждом вызове — перехват устанавливается один раз, поэтому «один раз за вызов установки» (diag.as:109).

---

## dllloader.as (145 строк)
**Назначение.** Загрузчик аддинов-длл: подключение нативных DLL, экспортирующих согласованный набор функций (`addinInfo`, `initAddin`, `getMacroses`, `invokeMacros`, `getObject`), и представление их в менеджере аддинов как обычных аддинов (макросы, объект-Dispatch).

**Инициализация.** Пакетов нет. Глобальный объект `DllLoader oneDllLoader;` (dllloader.as:145) — сайд-эффект конструктора `AddinLoader` (addins.as:53-56): вталкивает себя в глобальный список `loadersList`, откуда `AddinMgr` при создании регистрирует его по протоколу `dll`. Таким образом загрузчик активен с момента загрузки модуля, до всяких пакетов. `OptionsEntry` нет.

**Типы.**
### функдефы контракта DLL-аддина (dllloader.as:10-14)
- `funcdef int_ptr GetAddinInfo(int_ptr&, int_ptr&)` — заполнить два BSTR (уникальное имя, отображаемое имя);
- `funcdef void InitAddin(IDispatch&&)` — инициализация, получает корень SnegAPI;
- `funcdef int_ptr GetMacroses()` — вернуть BSTR со списком макросов через `\n`;
- `funcdef void InvokeMacros(int_ptr, Variant&)` — выполнить макрос по имени (BSTR) с результатом;
- `funcdef void GetObject(IUnknown&&&)` — вернуть COM-объект аддина.

### `class AddinDll : Addin` (dllloader.as:17)
Наследник базового аддина, представляющий загруженную DLL.
Поля: `protected uint module` (HMODULE), `protected GetMacroses&& getMacroses`, `protected InvokeMacros&& invMacros`, `protected GetObject&& getObject` (функторы, привязанные к адресам экспортов), унаследованные `uName/dName/fPath/__loader/group`.
Конструктор `AddinDll(uint m, const string& u, const string& d, const string& f, AddinLoader&& l)` (dllloader.as:22-37): сохраняет `module`, имена, `fPath = "dll:" + f`; тремя `GetProcAddress(module, "<имя>".toUtf8().ptr)` ищет экспорты `getMacroses`, `invokeMacros`, `getObject` и через `initFuncDefFromAddress(ptr, &&функтор)` привязывает (отсутствующие остаются `null`).
Методы:
- `bool init()` (38-46) — экспорт-фаза «запуск»: `GetProcAddress("initAddin")`, создание `InitAddin&& ia` через `initFuncDefFromAddress` и вызов `ia(oneDesigner._me())` — DLL получает корень SnegAPI. Всегда возвращает `true` (даже если экспорта нет).
- `array<string>&& macroses()` (48-58) — если `getMacroses` есть: вызвать, `res > 0` → `stringFromAddress(res)` (BSTR → string), `SysFreeString(res)`, вернуть `m.split("\n")`; иначе `null`.
- `Variant invokeMacros(const string& macros)` (60-65) — если `invMacros` есть: `invMacros(macros.cstr, result)`; вернуть `Variant` (пустой, если функтора нет).
- `IUnknown&& object()` (67-72) — `getObject(unk)`; вернуть `IUnknown&&` (null, если функтора нет).

### `class DllLoader : AddinLoader` (dllloader.as:76)
Наследник загрузчика; конструктор только вызывает `super()` (т.е. регистрацию в `loadersList`).
Методы:
- `string proto()` → `"dll"` (80).
- `bool canUnload(Addin&& addin)` → `false` (81) — DLL не выгружается никогда.
- `Addin&& load(const string& uri)` (82-114): `findFullPath(uri)` (поиск по путям Снегопата; ошибка → `oneAddinMgr._lastAddinError = "Не удалось найти файл " + uri`); `LoadLibraryEx(fullPath.cstr, 0, LOAD_WITH_ALTERED_SEARCH_PATH)` (неудача → `_lastAddinError = "Не удалось загрузить файл " + fullPath`); `GetProcAddress(module, "addinInfo")` → `GetAddinInfo&& getAddinInfo` через `initFuncDefFromAddress` → вызов `getAddinInfo(bun, bdn)`, оба BSTR конвертируются `stringFromAddress` и освобождаются `SysFreeString`; пустые имена заменяются: уникальное — из имени файла (`fullPath.extract(extractFileNameRex)`, regexp из lexer.as:160), отображаемое = уникальному. Возвращает `AddinDll(module, un, dn, fullPath, this)`.
- `bool run(Addin&& addin)` (115-118) — `cast<AddinDll>(addin)` и `ad.init()`.
- `bool unload(Addin&& addin)` → `false` (119-121).
- `string nameOfLoadCommand()` → `"Загрузить dll|dll"` (122) — текст для меню; после `|` — имя протокола.
- `string selectLoadURI()` (123-143) — штатный 1С-диалог выбора файла: `oneDesigner._createValue("ПеречислениеРежимДиалогаВыбораФайла")`, выбор значения `Открытие` через `getPropVal(findProp(...))` в `ValueParamsVector args(1)`; `oneDesigner._createValue("ДиалогВыбораФайла", args)`; свойства `Заголовок` = «Выберите файл dll», `ПредварительныйПросмотр` = false, `Фильтр` = «Файлы dll (*.dll)|*.dll|Все файлы|*»; вызов метода `Выбрать` (`selDlg.callMeth(def.findMethod("Выбрать"), retVal, Vector())`); при успехе читается `ПолноеИмяФайла` (через `retVal.getString(path)` в `v8string`); возвращается `"dll:" + path` или пустая строка.

**Функции файла.** Свободных функций нет (только глобальный объект `oneDllLoader`).

**Перехваты.** Нет.

**Используемые API.** WinAPI: `LoadLibraryEx` (флаг `LOAD_WITH_ALTERED_SEARCH_PATH`), `GetProcAddress`, `SysFreeString`; нативные: `initFuncDefFromAddress` (привязка funcdef к адресу функции), `stringFromAddress` (BSTR → string), `findFullPath`, `extractFileNameRex`; 1С-значения: `IContext`, `IContextDef`, `Value`, `ValueParamsVector`, `oneDesigner._createValue`/`_me()`.

**Взаимодействия.**
- Зависит от `addins.as` (базовые `Addin`/`AddinLoader`, список `loadersList`, `oneAddinMgr._lastAddinError`), `pathes.as`/`forms.as`-инфраструктуры (`findFullPath`), `lexer.as` (`extractFileNameRex`).
- Предоставляет: классы `AddinDll`, `DllLoader`, глобальный `oneDllLoader`. Регистрация DLL-аддинов идёт через `AddinMgr::loadAddin("dll:путь", группа)` (addins.as:172) и `selectAndLoad("dll", группа)`.

**Версионные ветки.** Отсутствуют.

**Особенности.** Экспорты DLL ищутся по одному и опционально: минимальный аддин может не иметь ни одного из `getMacroses`/`invokeMacros`/`getObject`/`initAddin`/`addinInfo`. Контракт обмена — BSTR (`int_ptr`), освобождение через `SysFreeString` обязательно (иначе утечка). Выгрузка невозможна по дизайну (`canUnload=false`): FreeLibrary не вызывается никогда. Имя файла аддина в `fPath` получает префикс `dll:`.

---

## scriptLoader.as (271 строк)
**Назначение.** Пакет инициализации подсистемы активных скриптов и загрузчик аддинов-скриптов (JScript/VBScript и другие движки Windows Script, а также всё, что знает `getEngineNameByFileExt`). Подключает скриптам именованные объекты `Enums`, `Designer`, `SelfScript`, поддерживает теги в шапке скрипта (`#engine:`, `$uname`, `#addin:`, `#nodebug`), очередь ошибок выполнения скриптов и отложенную выгрузку.

**Инициализация.**
- `Packet ScriptInit("ScriptInit", initScripts, piOnMainWindow);` (scriptLoader.as:10) — пакет инициализируется при создании главного окна; зависимостей нет.
- Глобальные объекты: `ScriptLoader oneScriptLoader;` (scriptLoader.as:251) — конструктор регистрирует загрузчик в `loadersList` (протокол `script`); `bool unloadIdleHandlerSet = false;` (scriptLoader.as:252) — флаг однократной установки idle-обработчика отложенной выгрузки; `array<string> scriptErrorQueue;` (scriptLoader.as:90) — тексты ошибок, ожидающие вывода.
- `OptionsEntry` в файле нет.

**Типы.**
### `class AddinScript : Addin, ScriptSite` (scriptLoader.as:22)
Скриптовый аддин; одновременно реализует интерфейс `ScriptSite`, через который нативный `snegopat.dll` уведомляет о жизни скрипта.
Поля: `protected ActiveScript script` — объект активного скрипта; `protected SelfScript selfScript`; `private uint errorsCount = 0`.
Конструктор `AddinScript(const string& u, const string& d, const string& f)` (26-31): имена аддина, `fPath = "script:" + f`, `selfScript._fullPath = f`.
Методы:
- `void _connectSelf()` (32-40) — вызывается после успешного `prepare()`: `selfScript.__addin = this`; `script.addNamedItem("Enums", getEnumsDispatch(), true)` (глобальный объект с перечислениями AngelScript); `script.addNamedItem("Designer", oneDesigner._me(), true)` (корень SnegAPI как глобальный `Designer`); `script.addNamedItem("SelfScript", createDispatchFromAS(&&selfScript), false)` (рефлексия, неглобальный).
- `ActiveScript&& _script()` (41) — доступ к скрипту (используется загрузчиком и `SelfScript::addNamedItem`).
- `array<string>&& macroses()` (43-45) — `script.extractMacroses()`.
- `Variant invokeMacros(const string& macros)` (47-51) — `script.invokeMacros(macros, result)`.
- `IUnknown&& object()` (53-55) — `script.getObject()`.
- `bool onScriptError(const ScriptError& err)` (57-72) — вызывается из snegopat.dll при ошибке в скрипте: `errorsCount++`, запись в журнал `dbgLog(...)`, при `errorsCount > 5` — `Message("Скрипт <uName> совершил пять ошибок и будет прерван", mInfo)` и `script.abort()` (возврат `false`); иначе текст ошибки кладётся в `scriptErrorQueue` (scriptLoader.as:69-70) — комментарий объясняет: ошибка выводится в окно сообщений, а не модальным окном (модальное блокирует Конфигуратор и внешнее управление, отладчик не предлагается), а `Message()` прямо из обработчика ошибки роняет процесс на 8.3.27 — очередь разбирает `errorlog.js` по таймеру (`Designer.takeScriptError`), выводит в окно сообщений и дописывает в `logs\script-errors.txt`. Всегда возвращает `false`.
- `void enter()` (74-76) / `void leave()` (78-80) — вход/выход в выполнение скрипта: `oneAddinMgr.enterInAddinRun(this)` / `leaveAddinRun(this)` (поддержка стека активных аддинов, addins.as:274-282).
- `void _unload()` (82-86) — `selfScript.__addin = null`; `script.stop()`; `uName.makeEmpty()` (пустое уникальное имя — признак выгруженности, его проверяет `AddinMgr::unloadAddin`).

### `class SelfScript` (scriptLoader.as:92)
Объект, экспортируемый в скрипт как `SelfScript` (рефлексия скрипта). Наследования нет.
Поля: `AddinScript&& __addin`; `string _fullPath`.
Методы (свойства с префиксом `get_`):
- `string get_uniqueName()` — имя аддина или пустая строка после выгрузки;
- `string get_displayName()` — отображаемое имя;
- `IUnknown&& get_self()` — COM-объект самого скрипта (`__addin.object()`);
- `void addNamedItem(const string& name, IDispatch&& unk, bool global = false)` (98-101) — прокси для подключения скриптом дополнительных COM-объектов через `__addin._script().addNamedItem(...)`.

### `class ScriptLoader : AddinLoader` (scriptLoader.as:105)
Поля: `NoCaseMap<string> mapEngineNames` — кеш «расширение → имя движка», в конструкторе (107-111) предзаполнен: `"js" → "JScript"`, `"vbs" → "VBScript"`.
Методы:
- `string proto()` → `"script"`; `bool canUnload(Addin&&)` → `true`.
- `Addin&& load(const string& uri)` (114-210): `findFullPath(uri)` (не найден → `_lastAddinError = "Не удалось найти файл " + uri`); `readTextFile(source, fullPath)` (пусто → ошибка «Не удалось получить текст файла»); `extractTags(tags, source, firstLine)` — разбор тегов шапки с удалением их из исходника; базовое `uName` — имя файла (`extractFileNameRex`); разбор тегов (136-169): `engine` — имя скриптового движка, `uname`/`dname` — имена, `nodebug` или `debug no` → `attachDebuger = false`, `addin` — подключение других аддинов: список `имя [алиас [global]]` (разбивается `whiteSpaceRex`), аддин ищется `oneAddinMgr.byUniqueName(tail[0])`, у него берётся `object()`; тройка `(IUnknown, имя, global)` копится в `connectedAddins`; ошибки («Аддин X не найден», «не содержит объекта») через `_lastAddinError` и `null`. Если `engine` не задан тегом — по расширению файла (`fullPath.match(extractFileExtRex)`), сначала кеш `mapEngineNames`, иначе `getEngineNameByFileExt(fileExt)` с занесением в кеш; не удалось — ошибка и `null`. `dName` по умолчанию = `uName`. Создаётся `AddinScript ads(uName, dName, fullPath)`, `&&ads.__loader = this`. Спец-обработка JScript при `firstLine > 0` (189-194): из исходника удаляется фрагмент `"(this && this.__extends) ||"` (артефакт компиляции TypeScript), в начало вставляется `var exports=SelfScript.self;var require=function(s){return builtin_require(s);};\n` (Node-совместимость: `exports` и `require`; `require` объявлен переменной, потому что в stdlib его потом подменяют), `firstLine--` (компенсация вставленной строки для соответствия номеров строк при отладке). `script.prepare(engine, source, firstLine, uName, /*attachDebuger*/true, ads)` != 0 → `null` (обратите внимание: отладчик подключается всегда, параметр `attachDebuger` при этом вызове фактически проигнорирован — передан литерал `true`). `ads._connectSelf()`; подключение запрошенных тегами `addin` объектов через `script.addNamedItem(name, obj, global)` (199-208). Возврат аддина.
- `bool run(Addin&& addin)` (211-219) — `cast<AddinScript>(addin)._script().run()`; код > 0 → `Message("не удалось запустить скрипт " + uniqueName)` и `_lastAddinError`.
- `bool unload(Addin&& addin)` (220-227) — `cast<AddinScript>(addin)._unload()`; однократно (`unloadIdleHandlerSet`) подвесить `unloadDelayedScripts` в `idleHandlers` (обработчик определён за пределами этого файла — освобождение отложенных объектов скриптов в простое).
- `string nameOfLoadCommand()` → `"Загрузить скрипт|script"`.
- `string selectLoadURI()` (229-249) — тот же механизм 1С-диалога, что в DllLoader, фильтр «Файлы скриптов (*.js;*.vbs)|*.js;*.vbs|Все файлы|*», возвращает `"script:" + path`.

**Функции файла.**
- `bool initScripts()` (12-19) — init-пакет `ScriptInit`: `string nameOfInstance = getDefaultInfoBase().connectString()` (строка подключения текущей базы — она различает скриптовые подсистемы разных баз); `IWindow&& win = mainFrame.unk; hRealMainWnd = win.hwnd()` (хэндл главного окна, глобальная из textwnd.as:377); `initActiveScriptSubsystem(hRealMainWnd, nameOfInstance)` — инициализация нативной подсистемы активных скриптов. Возвращает `true`.
- `void extractTags(array<array<string>&&>& tags, string& sources, uint& firstLineIdx)` (254-271) — разбор тегов шапки скрипта: если исходник начинается с `"use strict";\n` (14 символов) — пропустить (`startPos = 14`); в цикле `scriptTagsRex.match(sources, 1, startPos)` (regexp из lexer.as:164: `^(?://(\w+)\:|\$(\w+))[ \t]*(.*?)\s*?\n` — теги вида `//ключ: значение` или `$ключ значение`) — совпадение обязано начинаться ровно с `startPos`, иначе конец; на каждый тег `firstLineIdx++`, в `tags` добавляется пара `[ключ (группа 1 или 2), значение (группа 3)]`, `startPos` сдвигается; в конце теги вырезаются из исходника (`sources.remove(0, startPos)`), чтобы в скрипте номера строк соответствовали позициям после шапки.

**Перехваты.** Нет (COM-платформенных хуков нет; связка с snegopat.dll — через интерфейс `ScriptSite`).

**Используемые API.** Нативные: `getDefaultInfoBase().connectString()`, `initActiveScriptSubsystem`, класс `ActiveScript` (`prepare`, `run`, `stop`, `addNamedItem`, `extractMacroses`, `invokeMacros`, `getObject`, `abort`), `getEnumsDispatch`, `createDispatchFromAS`, `getEngineNameByFileExt`, `readTextFile`, `findFullPath`; regexp-константы `scriptTagsRex`, `extractFileNameRex`, `extractFileExtRex`, `whiteSpaceRex` (lexer.as:160-164); 1С-диалоги (`IContext`, `IContextDef`, `Value`, `ValueParamsVector`); `mainFrame.unk`/`IWindow.hwnd()`; `oneAddinMgr` (addins.as).

**Взаимодействия.**
- Зависит от: `addins.as` (базовые классы, `oneAddinMgr`, `loadersList`), `mainframe.as` (`mainFrame`), `textwnd.as` (`hRealMainWnd`), `lexer.as` (регулярки), `com_designer.as` (`oneDesigner._me()`, `takeScriptError` — обработка `scriptErrorQueue`), idle-инфраструктуры (`idleHandlers`, `unloadDelayedScripts`), `errorlog.js` (разбор очереди ошибок).
- Предоставляет: пакет `ScriptInit`, классы `AddinScript`, `SelfScript`, `ScriptLoader`, глобальные `oneScriptLoader`, `scriptErrorQueue`, `unloadIdleHandlerSet`, функцию `extractTags`. Через `SelfScript` и `Designer`-named item скрипты-аддины получают доступ ко всему SnegAPI.

**Версионные ветки.** Отсутствуют (поведение 8.3.27 — падение `Message()` из обработчика ошибки — учтено комментарием, но не `#if`).

**Особенности.**
- Ошибки скриптов буферизуются в `scriptErrorQueue` и выводятся асинхронно — обход двух проблем платформы (блокировка модальным окном и падение процесса на 8.3.27).
- Автоподключение отладчика при `prepare(..., true, ...)` — фактически всегда, несмотря на тег `nodebug` (возможное расхождение с намерением тега).
- JScript-скрипты получают Node-подобное окружение (`exports`, `require` → `builtin_require`) и исправление TypeScript-артефакта `__extends`.
- `firstLineIdx` нужен, чтобы ошибки скрипта указывали на правильные строки исходника.
- Счётчик `errorsCount`: 5 ошибок — принудительный `script.abort()`.
- Выгрузка скрипта отложена до простоя (`idleHandlers`) — COM-объекты скрипта могут быть живы в момент вызова выгрузки.

---

## addins.as (311 строк)
**Назначение.** Центральная подсистема аддинов: базовые классы `Addin`/`AddinLoader`, дерево групп аддинов `AddinGroup`, менеджер `AddinMgr` (реестр загруженных аддинов и загрузчиков, загрузка/выгрузка, стек активных аддинов), механизм встроенных аддинов `BuiltinAddin`, и пакет `AddinManager`, который создаёт корень SnegAPI (`Designer`) и загружает штатный системный аддин `std\main.js`.

**Инициализация.**
- `Packet pkAddinMgr("AddinManager", initAddins, piOnFirstIdle);` (addins.as:9) — запускается при первом простое после создания главного окна; зависимостей нет.
- Глобальные переменные с сайд-эффектами конструкторов:
  - `AddinMgr&& oneAddinMgr;` (addins.as:11) — заполняется в конструкторе `AddinMgr` (`&&oneAddinMgr = this`, addins.as:133);
  - `AddinLoader oneBuiltinLoader;` (addins.as:13) — глобальный экземпляр базового загрузчика (протокол `snegopat`); его конструктор вталкивает его в `loadersList`;
  - `BuiltinAddin&& builtinAddinsList;` (addins.as:15) — голова списка встроенных аддинов; каждый `BuiltinAddin` добавляет себя в конструкторе (сортировка по `order`);
  - `AddinLoader&& loadersList;` (addins.as:17) — голова списка загрузчиков; каждый загрузчик (`oneBuiltinLoader`, `oneScriptLoader`, `oneDllLoader`) регистрируется в конструкторе.
- `bool initAddins()` (addins.as:19-27): если `oneDesigner` уже создан — сразу `true`; иначе `Designer();` — конструктор корня SnegAPI (com_designer.as), который в свою очередь создаёт `AddinMgr`; затем `oneAddinMgr.loadAddin("script:" + pathes._addins + "std\\main.js", oneAddinMgr._root.childs[0])` — загрузка штатного JS-аддина «система» в первую дочернюю группу корня; при неудаче — `Message(oneAddinMgr._lastAddinError)`.
- `OptionsEntry` в файле нет.

**Типы.**
### `class Addin` (addins.as:31)
Базовый класс загруженного аддина; загрузчики обязаны возвращать его наследников.
Поля: `protected string uName, dName, fPath` (уникальное имя, отображаемое имя, полный путь), `AddinLoader&& __loader` (загрузчик, управляющий аддином), `AddinGroup&& group` (группа в дереве).
Методы:
- Свойства `const string& get_uniqueName()`, `get_displayName()`, `get_fullPath()` (35-37);
- `array<string>&& macroses()` → `null` (39) — имена макросов;
- `Variant invokeMacros(const string& macros)` → `Variant()` (41) — выполнить макрос;
- `array<string>&& menu()` → `null` (43) — имена команд меню аддина;
- `void invokeMenu(uint idx)` (45) — выполнить команду меню (пустая реализация);
- `IUnknown&& object()` → `null` (47) — COM-объект аддина.

### `class AddinLoader` (addins.as:51)
Базовый интерфейс загрузчика аддинов.
Поля: `AddinLoader&& next` — связный список.
Конструктор (53-56): вталкивает `this` в `loadersList`.
Методы (умолчания): `string proto()` → `"snegopat"`; `Addin&& load(const string& uri)` → `null`; `bool run(Addin&&)` → `true`; `bool canUnload(Addin&&)` → `false`; `bool unload(Addin&&)` → `false`; `string nameOfLoadCommand()` → `""`; `string selectLoadURI()` → `""`.

### `class AddinGroup` (addins.as:66)
Узел дерева групп аддинов (отображается в окне менеджера аддинов).
Поля: `string name`; `AddinGroup&& parent, child, next` (связи «первый ребёнок» и «следующий брат»); `array<AddinGroup&&> childs`; `array<Addin&&> addins`.
Конструкторы: `AddinGroup()` (74-76, корень, `parent = null`); `AddinGroup(AddinGroup&& p, const string& n)` (77-85) — имя, родитель, вставка последним ребёнком (`p.child` при пустом списке, иначе связывание `p.childs[last].next = this`), добавление в `p.childs`.
Методы:
- `AddinGroup&& addGroup(const string& nameOfChild)` (86-93) — найти ребёнка по имени без учёта регистра (`compareNoCase`) или создать нового (возвращает `AddinGroup&&` нового);
- `void addAddin(Addin&& addin)` (94-97) — `addin.group = this` и добавление в `addins`;
- `uint get_addinsCount()` (98-100); `Addin&& addin(uint idx)` (101-103, с проверкой диапазона);
- `void removeGroup(AddinGroup&& g)` (105-115) — удалить группу из дерева: `childs.findByRef(&&g)`, починить `child`/`next`-связи, `g.parent = null`, `removeAt`.

### `class AddinMgr` (addins.as:118)
Менеджер аддинов.
Поля: `private NoCaseMap<AddinLoader&&> loaders` (реестр по протоколу); `private array<Addin&&> addins` (все аддины по порядку); `private NoCaseMap<Addin&&> mapUniqueName`, `mapFullPath` (индексы); `private array<Addin&&> runnedAddins` (стек исполняющихся аддинов); публичные `AddinGroup _root` (корень дерева), `AddinGroup&& _libs`, `_users`, `_sys` (см. ниже), `string _lastAddinError` (описание последней ошибки — читают загрузчики, com-объекты, `initAddins`).
Конструктор (132-155): `&&oneAddinMgr = this`; все загрузчики из `loadersList` заносятся в `loaders` по `proto()`; создаются группы корня: `&&_sys = _root.addGroup("Служебные аддины")`, `&&_libs = _root.addGroup("Подгружаемые библиотеки")`, `&&_users = _root.addGroup("Пользовательские аддины")`; все `BuiltinAddin` из `builtinAddinsList` регистрируются: `ptr.__loader = oneBuiltinLoader`, `mapUniqueName.insert`, `mapFullPath.insert`, `addins.insertLast`, `_sys.addAddin(ptr)`.
Методы:
- `uint get_count()` (157); `Addin&& byUniqueName(const string& name)` (158-162); `Addin&& byFullPath(const string& fullPath)` (163-167); `Addin&& byIdx(uint idx)` (168-171, без проверки диапазона).
- `Addin&& loadAddin(const string& uri, AddinGroup&& group)` (172-220) — главный метод загрузки: разбор `uri` на протокол до первого `:` (нет → ошибка «Не задан тип загрузчика»); поиск загрузчика (`"Не найден загрузчик '<proto>'"`); относительный путь (не `\` и не `X:`) дополняется `pathes._core`; подстановки `<addins>` → `pathes._addins`, `<core>` → `pathes._core` (подстановка `<custom>` закомментирована — addins.as:186); `fndLdr.value.load(path)`; проверки: аддин не null, `uniqueName` не пуст («Не задано уникальное имя аддина»), не дубликат (`mapUniqueName.contains` → `doLog("Аддин с уникальным именем ... уже загружен")` и возврат уже загруженного), `fullPath` не пуст, не дубликат пути; `group.addAddin(addin)` (в момент запуска аддин уже должен видеть себя в менеджере — комментарий addins.as:208), вставка в карты и `addins`; запуск `fndLdr.value.run(addin)` — при неудаче `remove(addin, un)` и `null`; при успехе `oneDesigner._fireAddinChanges(addin, true)` (уведомление подписчиков SnegAPI).
- `private void remove(Addin&& addin, const string& uniqueName)` (221-226) — удаление из карт и обоих массивов (через `removeAddinFromArray`).
- `bool unloadAddin(Addin&& addin)` (227-244) — проверки: аддин не null, `uniqueName` не пуст («Аддин уже выгружен»), `addin.__loader.canUnload(addin)` («Аддин не может быть выгружен»); `addin.__loader.unload(addin)`; `remove`; `oneDesigner._fireAddinChanges(addin, false)`.
- `array<string>&& getLoaderCommands()` (246-254) — команды меню загрузки всех загрузчиков вида `"Загрузить скрипт|script"`.
- `Addin&& selectAndLoad(const string& loaderCommand, AddinGroup&& group)` (256-265) — по части после `|` найти загрузчик, получить `uri` через `selectLoadURI()` и загрузить; ошибка «Не найден загузчик для X» (опечатка в исходнике сохранена).
- `bool isAddinUnloadable(Addin&& addin)` (267-273).
- `void enterInAddinRun(Addin&& addin)` (274-277) / `void leaveAddinRun(Addin&& addin)` (278-282) — стек исполняющихся аддинов: push/снимок верхнего стека в глобальную `activeAddin` (main.as:19); используется для диагностики («кто сейчас исполняется»).

### `class BuiltinAddin : Addin` (addins.as:285)
Встроенный аддин (компилирован в движок, как `oneDesigner`, `oneSnegopatMenu` и т.п. — создаются в других файлах движка).
Поля: `BuiltinAddin&& next`; `uint order` — позиция в списке.
Конструктор `BuiltinAddin(const string& un, const string& dn, uint ord = 0)` (288-301): `uName = fPath = un`, `dName = dn`; вставка в `builtinAddinsList` по возрастанию `order` (в начало, либо после последнего элемента с `order` не больше своего).

**Функции файла.**
- `void removeAddinFromArray(array<Addin&&>&& arr, Addin&& a)` (304-311) — удалить первое вхождение `a` (сравнение идентичности `is`) из массива.

**Перехваты.** Нет.

**Используемые API.** `doLog` (журнал платформы/движка), `oneDesigner._fireAddinChanges(addin, включён)` (события SnegAPI), `NoCaseMap`/`NoCaseSet` (нативные контейнеры), `pathes._core`/`pathes._addins`.

**Взаимодействия.**
- Зависит от: `main.as` (`activeAddin`), `com_designer.as` (конструктор `Designer()` создаёт `AddinMgr`; `_fireAddinChanges`; `_root.childs[0]` как группа для `main.js`), `pathes.as`.
- Предоставляет: классы `Addin`, `AddinLoader`, `AddinGroup`, `AddinMgr`, `BuiltinAddin`; глобальные `oneAddinMgr`, `oneBuiltinLoader`, `builtinAddinsList`, `loadersList`; функцию `removeAddinFromArray`. Через SnegAPI (`Designer`) менеджер аддинов доступен JS-аддинам. Файлы-потребители: `scriptLoader.as` (`byUniqueName`, `_lastAddinError`, `enterInAddinRun`/`leaveAddinRun`, `runnedAddins`-стек), `dllloader.as` (`_lastAddinError`), `com_designer.as:72-73` (регистрация обработчиков выхода через `exitAppHandlers`), все `BuiltinAddin`-наследники движка.

**Версионные ветки.** Отсутствуют.

**Особенности.**
- Саморегистрация через конструкторы глобальных объектов (загрузчики и встроенные аддины) — классический для движка приём «статической инициализации»: к моменту `initPackets` все участники уже в списках.
- Порядок вставки в `loadersList` — обратный порядку объявления (LIFO), что влияет на порядок команд `getLoaderCommands()`.
- Повторная загрузка дубликата не считается ошибкой — `loadAddin` возвращает уже загруженный аддин с записью в `doLog`.
- Встроенные аддины всегда попадают в группу «Служебные аддины» и не могут быть выгружены (`oneBuiltinLoader.canUnload` = false по умолчанию).
- Циклическая зависимость `AddinMgr ↔ Designer` разрывается тем, что `initAddins` просто вызывает `Designer()` и проверяет `oneDesigner !is null` при повторном входе.

---

## exitApp.as (50 строк)
**Назначение.** Обработчики завершения приложения: подписка на платформенные события «перед выходом» и «выход», диспетчеризация на списки AngelScript-функторов, и страховочный хак с принудительным завершением процесса, если 1С «зависла в процессах» после выхода.

**Инициализация.**
- `Packet exitApp("exitApp", initExitApp, piOnMainWindow);` (exitApp.as:10) — пакет уровня «главное окно создано», зависимостей нет.
- Глобальные списки (exitApp.as:12-15):
  - `funcdef void PVV();` — функтор «без параметров и результата» (Procedure With Void);
  - `funcdef void PCancelExitApp(ExitAppCancel&&);` — функтор «перед выходом» с объектом-флагом отмены;
  - `array<PVV&&> exitAppHandlers;` — обработчики выхода;
  - `array<PCancelExitApp&&> beforeExitAppHandlers;` — обработчики «перед выходом» (могут отменить выход).
- `OptionsEntry` нет.

**Типы.**
### `class ExitAppNotifier` (exitApp.as:24)
Получатель события `eventExitApp`. Метод `void onEvent(const Guid&in eventID, long val, IUnknown& obj)` (25-32): по очереди вызывает все `exitAppHandlers[i]()`; затем «временный хак» (комментарий «1С висит в процессах после выхода»): `setTimer(5000, function(int_ptr timerId) { TerminateProcess(GetCurrentProcess(), 0); });` — через 5 секунд процесс убивается принудительно.

### `class BeforeExitAppNotifier` (exitApp.as:35)
Получатель события `eventBeforeExitApp`. Метод `onEvent` (36-45): создаёт `ExitAppCancel cancel`; вызывает все `beforeExitAppHandlers[i](cancel)`; если `cancel.val` установлен — приводит `obj` к `IAppExitCancel&&` и вызывает `iCancel.cancelExit(false)` — выход отменяется.

### `class ExitAppCancel` (exitApp.as:48)
Контейнер-флаг: `bool val = false;`. Обработчики устанавливают `val = true`, чтобы отменить выход.

**Функции файла.**
- `bool initExitApp()` (17-22) — init-пакет: `IEventService&& es = getEventService();` и две подписки: `es.subscribe(eventExitApp, AStoIUnknown(ExitAppNotifier(), IID_IEventRecipient))` и `es.subscribe(eventBeforeExitApp, AStoIUnknown(BeforeExitAppNotifier(), IID_IEventRecipient))` — AngelScript-объекты оборачиваются в COM `IEventRecipient` утилитой `AStoIUnknown`. Всегда `true`.

**Перехваты.** Прямых `TrapVirtualStdCall` нет; подписка на платформенные события через `IEventService` — штатный механизм уведомлений платформы.

**Используемые API.** `getEventService`, константы событий `eventExitApp`/`eventBeforeExitApp`, `IID_IEventRecipient`, `AStoIUnknown`, `setTimer`, `TerminateProcess`, `GetCurrentProcess`, интерфейс `IAppExitCancel`.

**Взаимодействия.**
- Предоставляет: типы `PVV`, `PCancelExitApp`, `ExitAppCancel`, списки `exitAppHandlers` и `beforeExitAppHandlers`.
- Потребители: `com_designer.as:72-73` (обработчики объекта Designer, и com_designer.as:410 — отключение COM-экспортного перехвата `trComExportCount` на выходе), `forms.as:479` (отключение `trFileOpenUrl`), `intellisite.as:118` (`saveHotOrder` — сохранение порядка списков при выходе), `settings_store.as:245` (`settingsFlush` — гарантированная запись настроек).

**Версионные ветки.** Отсутствуют.

**Особенности.**
- `TerminateProcess` через 5 секунд после события выхода — грубый, но эффективный фикс «1С висит в процессах»; он выполняется всегда, даже если приложение уже завершилось (таймер не сработает в мёртвом процессе — тогда хак просто не нужен).
- Отмена выхода доступна только на этапе `beforeExitApp` и только через `IAppExitCancel`, полученный из параметра события.
- Списки обработчиков — простые массивы функторов; порядок вызова = порядок регистрации.

---

## tests.as (48 строк)
**Назначение.** Мелкие вручную запускаемые тесты движка (заглушки/смоуки во время разработки). Файл неактивен: единственный пакет закомментирован.

**Инициализация.**
- `//Packet TestTestTest("TestTestTest", initTestTestTest, piOnMainEnter);` (tests.as:10) — пакет закомментирован, ничего не инициализируется. Если раскомментировать, пакет добавил бы горячую клавишу Ctrl+Alt+T.
- `OptionsEntry` нет.

**Типы.** Классов нет.

**Функции файла.**
- `void testReadTextFile()` (12-13) — пустая заглушка.
- `void testValueToString()` (15-20) — `Value val = 0.234;` → `val.toString(tt)` → `Message("res=" + tt)`: проверка сериализации числа.
- `void testScriptObject()` (22-30) — `join(oneAddinMgr.byIdx(0).macroses(), "\n")` (список макросов первого аддина), `invokeMacros("DesignScriptForm")`, конвертация результата `var2val` → `getString` → `Message`: проверка макросов скриптового аддина.
- `void testViewParent()` (32-34) — `oneDesigner._snegopat.activeTextWindow()`: проверка получения активного текстового окна.
- `bool runTest()` (36-43) — диспетчер: раскомментирован только `testViewParent()` + `Message("Test")`.
- `bool initTestTestTest()` (45-48) — (неактивен) `addHotKey('T' | hkCtrl | hkAlt, runTest)`.

**Перехваты.** Нет.
**Используемые API.** `Message`, `join`, `Value.toString`, `var2val`, `addHotKey` (константы `hkCtrl`, `hkAlt`), `oneAddinMgr`, `oneDesigner._snegopat`.
**Взаимодействия.** Потребитель `addins.as` (`oneAddinMgr`), `com_designer/com_snegopat` (`oneDesigner._snegopat`). Ничего не предоставляет.
**Версионные ветки.** Отсутствуют.
**Особенности.** Мусорная корзина для быстрых проверок; код остаётся в сборке (вырезается только при неиспользовании), но не активируется, пока пакет закомментирован.

---

## develop.as (262 строки)
**Назначение.** Инструменты для разработчиков и исследователей движка: генерация TypeScript-описаний (.d.ts) API платформы 1С (`v8.d.ts`) и API Снегопата (`snegopat.d.ts`) для IntelliSense во внешних редакторах, и разбор имён символов C++ (undecorate).

**Инициализация.** Пакетов нет; класс `Develop` инстанцируется в `com_designer.as:61` (`&&_develop = Develop();`) как свойство объекта `Designer` (доступно скриптам как `develop`). `OptionsEntry` нет.

**Типы.**
### `class Develop` (develop.as:29)
Поля: `bool cmdTrace = false`.
Методы:
- `void dumpV8typesToDts()` (32-34) — вызывает `_dumpV8Api()`.
- `void dumpSnegApiToDts()` (35-37) — вызывает `_dumpSnegApi()`.
- `string undecorate(const string& mangled)` (39-43) — разбор «изуродованного» (mangled) имени C++-символа: буфер `res.setLength(2000)`, `UnDecorateSymbolName(mangled.cstr, buf, 2000, 0)`, длина результата устанавливается обратно `res.setLength(...)`. Полезно при анализе адресов из журналов падений.

### `class V8Dumper` (develop.as:46)
Генератор `v8.d.ts`.
Поля: `NoCaseMap<string> typeGuidToNames` (GUID типа → имя TS); `NoCaseSet allNames` (дедупликация имён); `array<string> newNames` (имена типов, создаваемых через `v8New`); `IFile&& file` (открытый файл дампа).
Методы:
- `void write(const string& content)` (52-55) — `content.toUtf8()` и `file.write(str.ptr, str.length)`.
- `void dump(const string& path)` (57-86): открыть файл через `URL url("file://" + path)`, `getFSService()`, и `fs.openURL(file, url, fomOut | fomTruncate | fomShareRead)` — под `ExceptionCatcher catcher` + `CppCatch c("class core::Exception", ExceptionHandler(catcher.handle))` (перехват C++-исключений платформы; неудача → `Print("Do not open file ...")` и выход). Пишется шапка `interface V8Global{ connectGlobals(obj);}\ndeclare var global: V8Global;\n`. Затем обход всех подключённых глобальных контекстов `oneDesigner.__globalContextes` (по CLSID из ключа карты создаётся `currentProcess().createByClsid(Guid(it.key), IID_IContext, ctx)`) и `dumpContextDef(ctx.staticContextDef(), "", "")` (пустые имена → объявления `declare var/function`). Далее `proc.getCategoryClasses(vec, IID_IType)` — все зарегистрированные типы платформы, для каждого GUID `getGuidTypeName(ptr.ref)`. В конце `dumpV8New()`.
- `void dumpContextDef(IContextDef&& ctx, const string& name0, const string& name1)` (87-155) — генерация TS-интерфейса контекста: дедупликация имён через `allNames` (`name0`/`name1` — русское и английское имя типа); если `name0` пуст — объявления на верхнем уровне с префиксами `declare var ` / `declare function `, иначе тело `interface <name0> { ... }` с табуляцией. Получение расширенного описания: `IContextDefExt&& extCtx = cast<IUnknown>(ctx)`; если не вышел — через `IContext.staticContextDef()`. Свойства: `ctx.propsCount()`, `ctx.propName(idx, 0)` и `(idx, 1)` (два языка), для каждого — `extCtx.propInfo(idx, cvi)` с `ContextValueInfo cvi.init()/done()` и типом через `getTypeName(cvi.typeDomainPattern, typeName)`; строка `prop0 + typeName + ";"`. Методы: `ctx.methsCount()`, `ctx.methName(idx, 0/1)`, пропуск совпадающих с именами свойств (`propNames`), наличие возврата `ctx.hasRetVal(idx)` → тип из `extCtx.methRetInfo(idx, cvi)` или `": void"`, параметры обобщены как `(... params)`; строки `meth0 + "(" + ... + ")" + typeName + ";"`. Закрытие `}`, затем при разных `name0`/`name1` — `declare type <name1> = <name0>;`. Всё пишется одним `write(join(lines, "\n", true))`.
- `void dumpV8New()` (157-161) — для накопленных `newNames` — специализации фабрики: `declare function v8New(name:"<T>",... params): <T>;`.
- `void getTypeName(TypeDomainPattern& types, string& typeName)` (162-183) — `types.types(tt)` (Vector GUID'ов); для каждого GUID `getGuidTypeName`; непустые имена объединяются через ` | `, пустые (неизвестные) дают флаг `hasAny` → добавляется ` | any`; префикс `: `.
- `string getGuidTypeName(const Guid& guid)` (184-261) — имя типа по GUID с кешем `typeGuidToNames`; `currentProcess().createByClsid(guid, IID_IType, type)`; `type.getTypeKind()`: `tkBoolean → boolean`, `tkNumeric → number`, `tkString → string`, `tkDate → Date`, `tkObject` — сложная ветка: имена `type.getTypeString(0)` (рус.) и `(1)` (англ.); «чёрный список» падающих типов (develop.as:211-213: `ConfigurationMetadataObject`, `UnknownObject`, `CommandGroup`, `CommonModule`, `Action`, `DataCompositionAppearanceTemplateLib`, `MainServerAccess`, `GraphicalSchemaItemSwitchCases`, `MngSrvDataCompositionAreaTemplateField` — комментарий «На этих типах падает», возвращается `""`); переименования: `Array → ArrayV8`, `Promise → PromiseV8` (конфликт с JS-типами), `FormItems → name1 += "Упр"`; получение `IContextDef` типа: прямой `cast`, иначе через `type.createValue(val)` и `cast` к `IContext`/`IContextDef` (`staticContextDef()`); второй чёрный список типов (develop.as:237-239 — те же + `Action`), для которых контекст обнуляется; проверка «создаваем ли тип»: `type.hasCtor(k)` для `k` 0..9 → `creatable`; создаваемые добавляются в `newNames` (оба имени), иначе `name1.makeEmpty()` (английский псевдоним не объявляется); `dumpContextDef(ctx, name0, name1)`; имя кешируется и возвращается.

**Функции файла.**
- `void _dumpSnegApi()` (12-19) — путь `env.dataDir + "snegopat.d.ts"`, `dbgLog` на каждом шаге («старт», «записан», «сообщение выведено» — отладка зависаний), нативный вызов `dumpSnegApi(path)`, `Message("SnegAPI сохранён в " + path)`.
- `void _dumpV8Api()` (21-27) — путь `env.dataDir + "v8.d.ts"`, `V8Dumper d; d.dump(path);`, `Message("1C API сохранён в " + path)`, затем `_dumpSnegApi()` (оба файла за один прогон).

**Перехваты.** Нет.

**Используемые API.** `UnDecorateSymbolName` (DbgHelp), `dumpSnegApi` (нативный дампер SnegAPI), сервисы платформы: `getFSService()`, `IFileSystem.openURL` (флаги `fomOut | fomTruncate | fomShareRead`), `currentProcess().createByClsid`, `getCategoryClasses(vec, IID_IType)`, `IContextDef`/`IContextDefExt`/`ContextValueInfo`/`TypeDomainPattern`/`IType` (`getTypeKind`, `getTypeString`, `hasCtor`, `createValue`), `ExceptionCatcher`/`CppCatch` (перехват C++-исключений), `oneDesigner.__globalContextes`, `URL`, `join`, `NoCaseMap`/`NoCaseSet`.

**Взаимодействия.**
- Зависит от: `com_designer.as` (`oneDesigner`, `__globalContextes`), `diag.as` (`dbgLog`), `main.as` (`env.dataDir` через глобальный `env`).
- Предоставляет: классы `Develop` (свойство `develop` объекта Designer — вызывается из JS-аддинов/консоли) и `V8Dumper`; свободные `_dumpSnegApi`/`_dumpV8Api`. В add_global.as:56 вызов `oneDesigner._develop.dumpV8typesToDts()` закомментирован.
- Результат (`v8.d.ts`, `snegopat.d.ts`) используется вне движка — во внешних редакторах для IntelliSense при написании аддинов.

**Версионные ветки.** Отсутствуют.

**Особенности.**
- Реверс-инженерия типов: обходит внутренние реестры типов платформы, чёрные списки подобраны эмпирически по падениям («На этих типах падает»).
- Двойные имена (рус/англ) с `declare type X = Y;`-алиасами; специальная ручная унификация имён (`ArrayV8`, `PromiseV8`, `FormItemsУпр`).
- Перехват C++-исключений платформы (`CppCatch`) — редкий для AngelScript-кода приём, обязателен при вызове нестабильных платформенных API.
- Результат зависит от набора глобальных контекстов, подключённых на момент вызова (макрос выполняется в живом Конфигураторе).
- `undecorate` — 2000-байтовый буфер без проверки кода возврата.

---

## probe_ifaces.as (142 строки)
**Назначение.** Диагностическая утилита (ссылки в шапке: `tools/ADAPT.md`, форма): определить, какие из описанных в `v8api/*.v` интерфейсов платформы поддерживает произвольный COM-объект, то есть фактически выполнить серию `QueryInterface`. Файл сгенерирован из `v8api/*.v`.

**Инициализация.** Пакетов и глобальных объектов нет. `OptionsEntry` нет.

**Типы.** Классов нет.

**Функции файла.**
- `string probeIfaces(IUnknown&& o)` (probe_ifaces.as:5-142) — для `null` возвращает строку `"null"`. Далее ~130 однообразных блоков вида:
  `{ IAppExitCancel&& p = o.unk; if (p !is null) r += "IAppExitCancel "; }`
  — каждый блок это QueryInterface к `o` на соответствующий IID (приведение `IUnknown&&` к интерфейсной обёртке), успешные имена накапливаются через пробел. Проверяются интерфейсы (полный список в файле, probe_ifaces.as:9-140): `IAppExitCancel`, `IAssistList`, `IAssistListInfo`, `IAssistantData`, `ICalcValueCreator`, `IClientSite`, `ICmdDescription`, `ICmdStateImpl`, `ICommandReceiver`, `ICommandState`, `ICommandTarget`, `IConfigMngr`, `IConfigMngrUI`, `IConfigMngrUIOwner`, `IContainedObject`, `IContainer`, `IContext`, `IContextDef`, `IContextDefExt`, `IControlContext`, `IControlDesign`, `ICopyHelperCreator`, `ICtx2Disp`, `ICustomForm`, `ICustomFormDesigner`, `ICustomFormLoader`, `IDataControl`, `IDataControlEx`, `IDataProviderInfo`, `IDebugger`, `IDocument`, `IDocumentFactory`, `IDocumentSink`, `IDocumentView`, `IEdit`, `IEnumValCreator`, `IEventRecipient`, `IExecutionStateMediumInStream`, `IExternalCalculatorDebugger`, `IExternalCalculatorOwner`, `IFile`, `IFileEx`, `IFileSystem`, `IFldEdit`, `IForm`, `IFormCtrl`, `IFormDialog`, `IFormViewCore`, `IFramedView`, `IFramedViewSite`, `IGlobalContext`, `IGlobalContextInit`, `IGlyph`, `IGrid`, `IGridUISource`, `IIdleHandler`, `IIdleService`, `IImage`, `IInPersistenceStorage`, `IIndexedCollectionFS`, `IIndexedCollectionRO`, `IInfoBase`, `ILangSettings`, `IListCmdState`, `ILocalString`, `IMDBaseObj`, `IMDClass`, `IMDContainer`, `IMDEditHelper`, `IMDEditModuleHelper`, `IMDExtObj`, `IMDIClient`, `IMDObject`, `IMDParentLink`, `IMDTypedObj`, `IModuleEdit`, `IOutPersistenceStorage`, `IOutlineCoords`, `IPersistableDocument`, `IPersistableObject`, `IProfileFolder`, `IProfileSource`, `IRuntimeModule`, `ISettingsConsumer`, `ISourceLexer`, `IStorageRW`, `IStreamPersistenceStorage`, `ITEIntelliSence`, `ITabbedLayouter`, `ITempFile`, `ITemplateProcessor`, `ITextEditor`, `ITextExtBackColors`, `ITextExtColors`, `ITextExtention`, `ITextManager`, `ITextManager_Operations`, `ITextParserCache`, `ITopLevelFrame`, `ITopLevelFrameCore`, `ITxtEdtExtender`, `ITxtEdtOptions`, `IType`, `ITypeContextInfo`, `ITypeNameInfo`, `ITypesInfoProvider`, `IUnpackFile`, `IV8Bookmark`, `IV8Color`, `IV8DataSource`, `IV8Picture`, `IV8PictureValue`, `IVTColumn`, `IVTColumnRO`, `IVTRow`, `IVTRowRO`, `IValue`, `IValueArray`, `IValueStructure`, `IValueSubTree`, `IValueTable`, `IValueTableBase`, `IValueTableBaseRO`, `IValueTableColumns`, `IValueTree`, `IValueTreeRow`, `IView`, `IViewContext`, `IViewLayouter`, `IViewSplitter`, `IWindow`, `IWindowView`. Возвращает строку имён.

**Перехваты.** Нет.
**Используемые API.** Только приведения интерфейсных обёрток (`I<Имя>&& p = o.unk`) — оператор `unk` выполняет QueryInterface.
**Взаимодействия.** Потребитель: `com_windows.as:305-311` — отладочный дамп открытых окон (`dbgHex(v.self) + " " + probeIfaces(v.unk)`, для документа дополнительно `dbgDumpVT(doc.self, 41)`). Предоставляет остальным файлам (и исследователям через консоль) функцию `probeIfaces`.
**Версионные ветки.** Отсутствуют.
**Особенности.** Полностью сгенерированный код; объём QI-вызовов большой, поэтому функция — только для диагностики, не для «горячих» путей. Отсутствие интерфейса в списке не означает его отсутствие у объекта.

---

## templates.as (97 строк)
**Назначение.** Автоподключение файла шаблонов текста 1С, поставляемого со Снегопатом (`x64/templates/ТсРазработкаШаблоны1с8.st`), в список шаблонов Конфигуратора (профиль 1С, раздел `TxtEdt`, ключ `AutoPlacementFilesRU1`). При первом подключении заодно выставляются сопутствующие настройки: отключаются стандартные шаблоны платформы (`TxtEdt/AutoSearchTemplateFiles = Ложь`) и включается автозамена «Включить с подсказкой» (`ModuleTextEditor/AutoPlacement = 2`).

**Инициализация.**
- `Packet pktTemplates("RegisterTemplates", registerTemplateFile, piOnMainEnter);` (templates.as:16) — пакет самого раннего уровня (окно заставки), зависимостей нет: файл шаблонов регистрируется как можно раньше, чтобы подхватился при первом открытии настроек редактора.
- Константы (templates.as:13-14): `const string tplFileName = "ТсРазработкаШаблоны1с8.st";`, `const string tplProfileKeyDefault = "TxtEdt/AutoPlacementFilesRU1";`.
- `OptionsEntry` нет.

**Типы.** Классов нет.

**Функции файла.**
- `string tplRootDir()` (19-31) — корень Снегопата: `myFolder` (…\x64\modules\snegopat\) переводится на прямые слэши, затем дважды отрезается последний сегмент (цикл «срезать завершающие `/`», «срезать имя»), в конце убирается завершающий слэш. Итог: `<корень>` без `/`.
- `void tplSetPlatformValue(IProfileFolder&& pf, const string& key, const Value& val)` (34-37) — запись в профиль платформы: если `pf.setValue(key, val)` не удалась (ключа нет) — `pf.createAndSetValue(key, gpflBase, val)` (создать в базовом хранилище).
- `void tplApplyPlatformOptions(IProfileFolder&& pf)` (40-48) — сопутствующие настройки: `TxtEdt/AutoSearchTemplateFiles = false` (отключить стандартные шаблоны), `ModuleTextEditor/AutoPlacement = 2` (автозамена «Включить с подсказкой»; значения 0–3 описаны в шапке); запись через `tplSetPlatformValue`; лог `diagAlways("templates", ...)` (templates.as:47).
- `bool registerTemplateFile()` (50-97) — init-пакет `RegisterTemplates`:
  1. Вычислить `path = root + "/templates/" + tplFileName`; файла нет (`diagFileExists`) → `diag("templates", "файл шаблонов не найден: ...")` и `true` (не блокирует загрузку).
  2. `diagReload()` и переопределение ключа профиля для отладки: `diagGet("templates.key")` (в diag.ini можно написать, например, `templates.key=TxtEdt/AutoPlacementFilesRU9` — проверка без порчи рабочих настроек), иначе `tplProfileKeyDefault`.
  3. `IProfileFolder&& pf = getProfileService();` — `pf.getString(tplProfileKey, cur)`; текущий список в `text`; если `diagLower(text)` содержит имя файла — шаблон уже подключён (файл с тем же именем из другого места считается подключённым, шаблоны не дублируются) → `diagAlways` и `true`.
  4. Разбор списка 1С формата `{N,элементы}`: новый элемент `entry = "{\"file://" + path + "\",0}"`; из начала после `{` читается десятичное число записей `n`; если список неразобрываем (пустой/битый — проверка `t.length < 3 || t[0] != '{' || i == 1 || t[i] != ',' || t[t.length-1] != '}'`, templates.as:81) — список пересоздаётся как `{1,\n<entry>\n}`; иначе `n+1` и элементы склеиваются: `"{" + (n + 1) + body + ",\n" + entry + "\n}"`.
  5. Запись: `pf.setValue(tplProfileKey, Value(v8string(res)))`, при неудаче `pf.createAndSetValue(tplProfileKey, gpflBase, ...)`. `flush` и уведомление об изменении настроек сознательно не вызываются: комментарий templates.as:91-92 — на старте (piOnMainEnter) это подвешивало загрузку Конфигуратора; значение сохраняется платформой при выходе, шаблоны подхватываются при ближайшем чтении настроек.
  6. Лог `diagAlways("templates", "файл шаблонов подключён в 1С: ... (было записей: n)")`; если не режим проверки (`templates.key` пуст) — `tplApplyPlatformOptions(pf)`. Возврат `true`.

**Перехваты.** Нет.
**Используемые API.** `getProfileService()` → `IProfileFolder` (`getString`, `setValue`, `createAndSetValue`, константа `gpflBase`), `diagFileExists`, `diagReload`, `diagGet`, `diagLower`, `diag`/`diagAlways`, `myFolder`, строковые операции `trim`/`rtrim`/`find`/`substr`.
**Взаимодействия.** Зависит от `pathes.as`/`main.as` (`myFolder`), `diag.as`. Для остальных файлов движка ничего не предоставляет; результат работы — записи в профиле 1С, читаемые платформенным текстовым редактором.
**Версионные ветки.** Отсутствуют.
**Особенности.**
- Ручной разбор/склейка сериализованного списка 1С (`{N,...}`) строковыми операциями — без полноценного парсера; битый список пересоздаётся с одной записью (пользовательские правки списка при этом теряются — риск).
- «Тихая» запись в профиль без flush — обход зависания загрузки Конфигуратора при `piOnMainEnter`.
- Режим тестирования через `templates.key` в diag.ini позволяет проверить логику, не трогая рабочие настройки (в этом режиме `tplApplyPlatformOptions` тоже не выполняется).
- Настройки автозамены применяются однократно — ровно в момент первого подключения файла шаблонов (дальше «настройки остаются за пользователем», templates.as:6-8).

---

## Связи внутри группы

Текстовая схема зависимостей (стрелка «A → B» = A использует B):

```
нативный snegopat.dll
        │  run() (окно заставки)
        ▼
    main.as ──► pathes.as (initPathes: глобальный pathes)
        │   └──► diag.as (diagBanner)
        │   └──► initSnegopatProfile: trap IProfileService_open
        │            └─► options.as: initAllOption()
        │            └─► packets.as: initPackets(piOnMainEnter) ──► templates.as (pktTemplates)
        ▼ (далее по уровням пакетов)
  piOnMainWindow: scriptLoader.as (Packet ScriptInit → initScripts: mainFrame, textwnd.hRealMainWnd,
                                    нативная initActiveScriptSubsystem)
                  exitApp.as (Packet exitApp → подписки IEventService на eventExitApp/eventBeforeExitApp)
  piOnFirstIdle:  addins.as (Packet AddinManager → initAddins: Designer() из com_designer.as,
                                    loadAddin("script:<addins>std\main.js") через scriptLoader.as)

Ядро взаимодействия:

  pathes.as ──► settings_store.as (settingsDir/settingsDefaultsDir: pathes._data)
            ──► addins.as (pathes._addins, pathes._core в initAddins/loadAddin)
            ──► diag.as (diagDir строится от myFolder напрямую)

  diag.as ───► ВСЕ файлы группы (diag, diagAlways, dbgLog, dbgOn, diagLower, diagFileExists,
              diagListDir, diagHook, diagStamp, dbgHex, dbgDumpVT, diagTail)
       ◄────  main.as (diagCtx заполняют хуки createWindow; com_metadata.as — diagCtx editProperty/openEditor)
       ◄────  com_snegopat.as: snegopat.diagFlush/diagLog (таймер errorlog.js)

  options.as ──► settings_store.as (optionWrite → settingsPut; optionRead ← settingsGetInternal)
           ◄─── main.as (момент вызова initAllOption; oeEnableTextWork)
           ◄─── intellisite.as, ModuleTextProcessor.as (объекты OptionsEntry)
           ───► com_snegopat.as (_optionEntries = optionList)

  settings_store.as ──► exitApp.as (exitAppHandlers: settingsFlush на выход)
                    ──► diag.as (diagLower, diagListDir, diagAlways)
                    ───► com_profile.as (эмуляция pflSnegopat: Has/Put/GetInternal/Remove/Children)
                    ───► com_snegopat.as (settingsTick/settingsFlush/settingsInfo; таймер errorlog.js)

  addins.as (ядро аддинов):
       ◄─── scriptLoader.as и dllloader.as — наследники AddinLoader, саморегистрация в loadersList,
            AddinScript/AddinDll — наследники Addin; oneAddinMgr.byUniqueName/_lastAddinError/
            enterInAddinRun/leaveAddinRun
       ◄─── все BuiltinAddin движка (саморегистрация в builtinAddinsList)
       ───► com_designer.as (Designer() создаёт AddinMgr; _fireAddinChanges; SnegAPI наружу)

  exitApp.as ───► com_designer.as:72-73,410; forms.as:479; intellisite.as:118; settings_store.as:245
              (единая точка «что делать при выходе»)

  develop.as ◄─── com_designer.as (_develop = Develop(); свойство develop объекта Designer)
             ───► diag.as (dbgLog), env.dataDir; использует нативные dumpSnegApi и сервисы типов 1С

  probe_ifaces.as ───► com_windows.as:305-312 (диагностика окон: probeIfaces + dbgDumpVT)

  tests.as ──► addins.as (oneAddinMgr), com_snegopat/com_designer (oneDesigner._snegopat); неактивен

Цикл жизни настроек движка:
  OptionsEntry(конструктор) → optionList
  IProfileService_openTrap (main.as) → initAllOption → optionRead/optionWrite → settings_store
  errorlog.js (таймер ~0,4 c) → snegopat.settingsTick → settingsFlush (≥500 мс после изменения)
      + settingsPoll (метка _version, чужие изменения) → SettingsFile.load (слияние)
  exitAppHandlers → settingsFlush (финальная запись)

Цикл загрузки аддинов:
  oneScriptLoader / oneDllLoader / oneBuiltinLoader (список loadersList)
      → AddinMgr(конструктор) → loaders (по протоколу)
      → loadAddin("script:..."/"dll:...") → ScriptLoader.load / DllLoader.load
      → AddinScript(+SelfScript, Enums, Designer, #addin-зависимости) / AddinDll(экспорты addinInfo/initAddin/...)
      → run → oneDesigner._fireAddinChanges → доступно JS-аддинам через SnegAPI
```

Ключевые «стыки» группы с остальным движком: `main.as` (точка запуска и хук профиля), `com_designer.as` (SnegAPI: `oneDesigner`, менеджер аддинов, свойство `develop`, обработчики выхода), `com_profile.as` (единственный потребитель файлового хранилища настроек как «профиля»), `com_snegopat.as` (COM-экспорт diag/settings/options наружу для JS-аддинов), `lexer.as` (регулярные выражения для загрузчиков), `textwnd.as`/`mainframe.as` (хэндл главного окна для подсистемы скриптов), JS-аддин `errorlog.js` (таймер сброса журнала и настроек).
