## `snegopat/engine/diag.as`

- Язык: **AngelScript**, строк: **542**, объявлений: **39**
- Назначение: Единая диагностика движка (tools/ADAPT.md, tools/DISABLED-27.md). Настройки — файл logs/diag.ini (строки «ключ=значение», «;» — комментарий), перечитывается не чаще раза в 2 с, перезапуск 1С не нужен: trace=on (или log=on) подробный журнал (то, что раньше включал файл logs/vt.on): аргументы перехватчиков, клавиши, потоки, дампы vtable
- Состав: class — 1, func — 38

- `class DiagState`

### внутри `DiagState`

- `string diagLower(const string& s)`
- `string diagDir()`
- `bool diagFileExists(const string& path)`
- `void diagReload()` — Прочитать logs/diag.ini в словарь (не чаще раза в 2 секунды)
- `string diagGet(const string& key)`
- `bool diagIniIs(const string& key)`
- `int diagHookMode(const string& name)` — Режим перехвата <name>: 0 — по умолчанию, 1 — принудительно включён, 2 — принудительно выключен
- `bool diagHook(const string& name, bool defaultOn)` — Включён ли перехват: defaultOn — решение по умолчанию для этой версии платформы; результат логируется один раз за вызов установки
- `bool hookDisabled(const string& name)` — Совместимость со старыми вызовами
- `bool hookForced(const string& name)`
- `bool diagTraceOn(const string& cat = "")` — Включена ли подробная трассировка (категория cat — необязательно)
- `bool dbgOn()`
- `bool diagIsMainThread(const string& where = "")` — Вызов из главного потока? Чужой поток логируется (категория thread) и должен обойтись без входа в скрипты.
- `string diagStamp()`
- `int diagDayNumber(int y, int m, int d)` — Дни от 1970-01-01 по гражданской дате
- `string diagPad2(int v)`
- `string diagDayName(int dn)` — Дата «ГГГГ-ММ-ДД» по числу дней от 1970
- `int diagToday()`
- `int diagFileDay(const string& path)` — День последней записи в файл (местное время); 0 — файла нет или он пуст
- `bool diagArchiveLog(int day)` — Унести текущий script-log.txt в архив script-log-<день>[-N].txt
- `void diagCleanOld(int today)` — Удалить журналы старше diagKeepDays суток: архивы script-log-*.txt, старый script-log.1.txt и per-process журналы Core.As (*.log и *.trace)
- `void diagRotateDaily()` — Суточная ротация: при смене дня (и на старте процесса) вчерашний script-log.txt уходит в архив, старое чистится
- `bool diagIsUnc()`
- `void diagWriteRaw(const string& data)` — Запись данных (строки уже с переводом строки) в файл журнала: ротация по размеру, открытие на дозапись
- `void diagFlush()` — Сбросить накопленное на диск (безопасно вызывать в любой момент)
- `void diagWrite(const string& line, bool deferred = false)`
- `void diagAlways(const string& cat, const string& text)` — Запись всегда (важные события)
- `void diag(const string& cat, const string& text)` — Запись при включённой трассировке (категория cat)
- `void dbgLog(const string& text)` — Старый интерфейс
- `string diagTail(uint n = 60)` — Последние n строк журнала (в порядке записи)
- `void diagSet(const string& key, const string& value)` — Записать значение в diag.ini (ключ=значение; пустое значение удаляет ключ)
- `string diagState()` — Текущее состояние диагностики для отчёта
- `int_ptr dbgSafeQword(int_ptr addr)` — Безопасное чтение 8 байт по произвольному адресу (0 — нельзя прочитать): для диагностики значений аргументов перехватчиков
- `string dbgHex(int_ptr v)`
- `void dbgDumpVT(int_ptr obj, int tag)` — Сброс в logs/vt-dump.bin начала vtable объекта (при трассировке, категория vt). Запись: [tag, адрес объекта, адрес vtable, маркер] + 130 слотов.
- `void diagBanner()` — Заголовок сеанса: версия платформы, потоки, настройки диагностики (вызывается из main.as после инициализации)
- `string diagReadHex(int_ptr addr, uint len)` — Прочитать len байт (кратно 8) по адресу как строку из 16-значных hex-слов через пробел; недоступная память — пустая строка. Для реверса структур платформы (tools/dumpvt.py, tools/objscan.py).
- `uint64 diagParseHex(const string& s)` — Разбор шестнадцатеричной строки (с префиксом 0x или без) в число
