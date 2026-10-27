## `snegopat/engine/main.as`

- Язык: **AngelScript**, строк: **236**, объявлений: **15**
- Назначение: Snegopat Engine main file Основная точка входа. Вызывается в момент, когда snegopat.dll средствами WinAPI отловил создание окна заставки 1С, но она еще не показана. Все 1С-ные дллки загружены.
- Состав: func — 14, funcdef — 1

- `void run()` — Вызывается из snegopat.dll в момент создания окна заставки 1С
- `int main(array<string>&& cmdArgs)` — Вызывается из Core.As в момент загрузки модуля.
- `void initSymbolClassTable()` — Заполняем таблицу, в которой указан класс символа. Таблица используется в snegopat.dll, но для заполнения используются функции V*.
- `void initSnegopatProfile()` — Настройки Снегопата лежат в своих файлах data\Snegopat\settings\*.set (settings_store.as) и к профилю платформы не подключаются. Перехват открытия профиля нужен, чтобы сразу после открытия прочитать настройки движка и запустить пакеты. Папка data должна быть доступна для записи.
- `void IProfileService_openTrap(IProfileService& ps)`
- `OptionsEntry oeEnableTextWork("EnableTextWork", function(v)`
- `bool setTextHooks()` — Установка различных перехватов, связанных с текстовыми окнами/документами
- `int_ptr TxtDoc_createView(IDocument& doc, int_ptr pView)`
- `void disableAllTextTraps()`
- `funcdef bool WV_CreateWindow(IWindowView&, HWND parentWindow);`
- `bool TxtEdtCtrl_createWindow(IWindowView& view, HWND parentWindow)`
- `bool TxtEdtView_createWindow(IWindowView& view, HWND parentWindow)`
- `bool TxtEdtCommand_onExecute(ICommandTarget& tgt, const Command& command)`
- `bool TxtCtrCommand_onExecute(ICommandTarget& tgt, const Command& command)`
- `int TxtMgrOper_setExtender(ITextManager_Operations& to, const Guid& clsid)`
