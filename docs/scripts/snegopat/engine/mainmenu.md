## `snegopat/engine/mainmenu.as`

- Язык: **AngelScript**, строк: **440**, объявлений: **23**
- Назначение: Пункт верхнего уровня «Снегопат» в главном меню Конфигуратора (между «Конфигурация» и «Отладка»). Меню рисует платформа из «панелей» (bands): панель — это CommandID {группа, номер}, её содержимое — список пунктов (CommandID + вес типа double, порядок по весу). Главное меню — панель {B78F2E80-EC68-11D4-9DCF-0050BAE2BC79, 1}, пункт верхнего
- Состав: func — 21, funcdef — 2

- `funcdef int_ptr MMCall4(int_ptr, int_ptr, int_ptr, int_ptr);`
- `funcdef size_t MMUpdTrap(size_t, size_t);`
- `int_ptr mmCall(int_ptr fn, int_ptr a1, int_ptr a2 = 0, int_ptr a3 = 0, int_ptr a4 = 0)`
- `int_ptr mmAlloc(uint size)`
- `uint64 mmHex(const string& s, uint start, uint len)`
- `void mmPutGuid(int_ptr dst, const string& g)` — GUID вида {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX} в 16 байт памяти (раскладка Windows GUID)
- `int_ptr mmNewCid(const string& g, uint num)`
- `int_ptr mmNewAnsi(const string& s)`
- `void mmSetShort(int_ptr dst, const string& s)` — Запись коротких (до 10 символов) строк v8string прямо в описание команды (хранилище SSO: буфер 22 байта, слово 11 - длина)
- `int_ptr mmBand(int_ptr manager, int_ptr cid)` — Панель {номер группы} -> адрес определения (0, если не найдена)
- `int_ptr mmTemplate(int_ptr manager, const string& group, uint num)` — Первый пункт панели как образец (байты копируются, потом правятся id и вес)
- `int_ptr mmItem(int_ptr tmpl, const string& group, uint num, uint64 weight)`
- `int_ptr mmVector(int_ptr items, uint count)`
- `int_ptr mmCmdEntry(const string& group, uint num, const string& category, const string& idName, int_ptr bundle)`
- `void mmSetCommandText(const string& group, uint num, const string& text)` — Описание команды: подставляем текст (дальше платформа не лезет в ресурсы, флаг разрешения строк = 1)
- `bool mmIsOurs(int_ptr cidPtr)`
- `size_t mmUpdateTrap(size_t pThis, size_t pState)` — ICommandState: id() — слот 3, enable(bool) — слот 6
- `size_t mmHasTrap(size_t pThis, size_t pCid)`
- `void openSnegopatSettingsWnd()` — Открыть окно Снегопата тем же макросом, что «Открыть окно Снегопата» (std/snegopat.js)
- `bool mainMenuOnCommand(const Command& cmd)` — Вызывается из transmitCommandTrap (com_events.as): наша команда выполняется на простое и не уходит в платформу
- `bool initMainMenu()`
- `void mmScheduleRefresh()` — Сигнал готовности: пока меню не перерисовано с нашим пунктом, перестраиваем панели часто; платформа отбрасывает перестройку, пока не достроено меню, видимого сигнала готовности у неё нет, но запрос updateState нашего popup приходит только от нарисованного пункта
- `bool mmBuild()`
