# Модули `main` (базовый API Core.As) и `starter` (стартер, IPC)

## Модуль `main` — `snegopat-client/x64/modules/main/`

Базовый модуль самого движка Core.As (без собственного `module.info` — подключается ядром). Даёт скриптам низкоуровневый API: WinAPI, COM, SQLite, сеть. Исходники — `src/`, описания интерфейсов — `api/`.

### api/winapi.v (414 строк) — интерфейс к WinAPI

Описания импортируемых функций WinAPI для вызова из AngelScript: typedef-ы (`HWND`, `HANDLE`, `HDC`, `COLORREF`, `HICON`, `HMENU`, `UINT`, `BOOL`, `BYTE`, `DWORD`, `HFONT`, `HGDIOBJ`, `HMONITOR`, `WPARAM`, `LPARAM`, `LRESULT`, `LONG` и др.) и объявления функций (`FindWindow`, `CreateWindowEx`, `SendMessage`, `SetWindowPos`, `VirtualAlloc`, `GetCaretPos`, `CreateDirectory` и т.д. — всё, что используется движком). Именно typedef-ы из этого файла ломаются при CRLF (см. [00-overview.md](00-overview.md) §1).

### api/com.v (67 строк) — COM-поддержка

`IConnectionPointContainer` (GUID `{B196B284-BAB4-101A-B69C-00AA00341D07}`, слот `FindConnectionPoint` со сдвигом +1), структуры `TYPEATTR`/`FUNCDESC`-семейства и вспомогательные типы для работы с `IDispatch`/`ITypeInfo` из скриптов (создание диспетчер-обёрток `createDispatchFromAS` опирается на этот API).

### api/sqlite.v (120 строк) — SQLite

`:enum s3const` с кодами результатов (`SQLITE_OK`, `SQLITE_ERROR`, `SQLITE_BUSY`, `SQLITE_LOCKED`, `SQLITE_NOMEM`, …) и объявления функций sqlite3; поверх них `engine/com_sqlite.as` строит класс-обёртку (см. [03-com-windows-metadata.md](03-com-windows-metadata.md)). Используется, например, хранилищем настроек и кэшами.

### src/winapi.as (142 строки) — константы WinAPI

- `enum WinApiConst` (строки 6-102): `KEYEVENTF_*`, `MAPVK_*`, `SW_*` (показ окна), `WS_*`/`ES_*`/`WS_EX_*` (стили окон; `WS_POPUP = int(0x80000000)` — с явным кастом, т.к. не влезает в int), `SWP_*` (SetWindowPos), `HWND_TOP/BOTTOM/TOPMOST/NOTOPMOST`, `LOGPIXELSX/Y`, `MONITOR_DEFAULTTO*`, `SM_CXSCREEN/CYSCREEN`, `PAGE_EXECUTE_READWRITE`, `LOAD_LIBRARY_*`/`DONT_RESOLVE_DLL_REFERENCES` (флаги LoadLibraryEx для dllloader.as), `GWL_STYLE/EXSTYLE`, `WMSZ_*` (стороны ресайза в WM_SIZING — использует mlist.as).
- `enum CodePages` (104-112): `CP_ACP`, `CP_OEMCP`, `CP_MACCP`, `CP_THREAD_ACP`, `CP_SYMBOL`, `CP_UTF7`, `CP_UTF8`.
- `int_ptr INVALID_HANDLE_VALUE = int_ptr(-1)` (114); `const uint GENERIC_READ/WRITE/EXECUTE/ALL` (116-119); `enum FileConstants` (121-130): `FILE_SHARE_READ/WRITE/DELETE`, `CREATE_NEW/ALWAYS`, `OPEN_EXISTING/ALWAYS`, `TRUNCATE_EXISTING`.
- `class WinApi` (133-140): обёртки `getFocus()` → `GetFocus()`, `sendMessage(hWnd, msg, w, l)` → `SendMessage` — экземпляр доступен скриптам как глобальный объект.
- `const uint badStrIdx = uint(-1)` (142) — маркер «строка не найдена» для строковых функций движка.

### src/network.as (198 строк) — константы libwebsockets

Константы для встроенного HTTP/WS-сервера Core.As (использовались web-фичами, напр. `www/` модуля snegopat):

- `LWS_SERVER_OPTION_*` (строки 9-68) — битовые опции сервера libwebsockets: `REQUIRE_VALID_OPENSSL_CLIENT_CERT`, `SKIP_SERVER_CANONICAL_NAME`, `ALLOW_NON_SSL_ON_SSL_PORT`, `DISABLE_IPV6`, `PEER_CERT_NOT_REQUIRED`, `VALIDATE_UTF8`, `SSL_ECDH`, `DO_SSL_GLOBAL_INIT`, `STS`, `ONLY_RAW`, `IGNORE_MISSING_CERT`, `HTTP_HEADERS_SECURITY_BEST_PRACTICES_ENFORCE`.
- `LWSMPRO_*` (70-76) — типы mount-точек: `HTTP`, `HTTPS`, `FILE`, `REDIR_HTTP`, `REDIR_HTTPS`, `CALLBACK`.
- `enum HttpVerbs` (78-87): `httpGet, httpPost, httpOptions, httpPut, httpPatch, httpDelete, httpConnect, httpHead`.
- `enum HttpHeaders` (89-187) — индексы заголовков libwebsockets (`WSI_TOKEN_GET_URI`, `WSI_TOKEN_HOST`, `WSI_TOKEN_HTTP_CONTENT_TYPE`, клиентские `_WSI_TOKEN_CLIENT_*`, `WSI_TOKEN_COUNT`).
- `void getUriArgs(const HttpRequest& hc, NoCaseMap<string>& res)` (189-198) — парсинг query-string: разбивает `hc.header(WSI_TOKEN_HTTP_URI_ARGS)` по `&`, каждый элемент по `=` на ключ/значение с `urlDecode()`, ключ без `=` → пустое значение.

## Модуль `starter` — `snegopat-client/x64/modules/starter/`

Скриптовый модуль x86-процесса `starter.exe` (загрузчика). Собирается с `lib = .\|starter.exe`.

### src/main.as (23 строки) — точка входа стартера

- `int main(array<string>&& args)` (12-23): создаёт глобальный `StarterInterProcess&& stipc = StarterInterProcess("Starter", function(const string& data) {})` — подключается к окну стартера как клиент с именем «Starter» и пустым колбэком.
- Уведомление «Запущен стартер Core.As» через `stipc.showNotify(...)` отключено по просьбе пользователей (комментарий 15-17, код оставлен для возврата).
- `Print(...)` с приветствием также закомментирован.

### src/ipc/ipc.as (88 строк) — IPC через WM_SETTEXT (общий код)

Файл включён **и** в модуль `starter` (в его процессе), **и** в модуль `snegopat` (в процесс Конфигуратора) — это и есть транспорт между ними (`module.info` снегопата: `src = engine, .\|modules\starter\src\ipc`).

- Механизм: стартер при запуске создаёт окно класса **`Core.As.Starter`** (`const string StarterWindowClassName`, строка 15). Взаимодействие — посылка `WM_SETTEXT` в это окно; строка сообщения = `"<тип> <данные>"`.
- `enum StarterMessages` (18-27): `smInject` (inject.dll при загрузке передаёт описатель потока), `smLoadModule`, `smConnect` (регистрирует модуль для обратных сообщений), `smDisconnect`, `smShowNotify` (показать уведомление), `smStopInject`/`smResumeInject` (пауза/возобновление внедрения), `smBrodcast` (разослать всем модулям).
- `funcdef void StarterNotify(const string& data)` (29).
- `class StarterInterProcess` (31-88):
  - Конструктор `(const string& instanceName, StarterNotify&& callback)` — запоминает callback и подключается.
  - `connectToStarter(instanceName)` (64-73): `FindWindow("Core.As.Starter")` — при неудаче `Print("No find starter wnd")`; создаёт своё скрытое окно-приёмник `CreateWindowEx(0, "EDIT", …)` и вешает на него обработчик `attachWndToFunction(hMyWnd, WndFunc(this.wndFunc), array<uint> = { WM_SETTEXT })` (нативная подписка AngelScript-функтора на оконные сообщения); шлёт `smConnect` с данными `"<instanceName>\xB<hMyWnd>"` (разделитель `\xB` — вертикальная табуляция).
  - `sendMessageToStarter(type, data)` (57-62): если стартер жив (`isConnected()` = `IsWindow(hStarterWnd)`), `SendMessage(hStarterWnd, WM_SETTEXT, 0, ("<тип> " + data).cstr)`.
  - Публичные методы: `showNotify(title, message)` → `smShowNotify` с `title + "\xB" + message`; `setInjectStatus(bool)` → `smStopInject`/`smResumeInject`; `sendBroadcast(source, data)` → `smBrodcast` с `source + "\xB" + hMyWnd + "\xB" + data`.
  - `wndFunc(msg, w, l)` (75-82): на `WM_SETTEXT` вызывает `callback_(stringFromAddress(l))` — строка приходит как указатель из lParam; иначе `myWnd.doDefault()` (передача дефолтной обработке оконной процедуры).
  - Деструктор (36-39): при активном соединении шлёт `smDisconnect` с `"" + hMyWnd`.
- Значение: позволяет скриптам внутри Конфигуратора общаться со стартером (уведомления, broadcast между запущенными Конфигураторами, управление внедрением), не имея своего UI-потока.

## Связи

- `main` — фундамент: всё остальное опирается на его константы (`WinApiConst` используется всеми оконными подсистемами, `CodePages` — файловыми, `GENERIC_*`/`FileConstants` — com_files, `LWS_*` — network) и на импорты из `api/*.v`.
- `starter/src/ipc/ipc.as` — единственный файл, компилируемый в оба процесса; `StarterInterProcess` используется в стартере (`src/main.as`) и доступен движку Снегопата для уведомлений/broadcast.
- Направление сообщений: модуль → стартер через `WM_SETTEXT` в окно `Core.As.Starter`; стартер → модуль — `WM_SETTEXT` в окно-приёмник, зарегистрированное при `smConnect`.
