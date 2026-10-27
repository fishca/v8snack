## `snegopat/engine/exitApp.as`

- Язык: **AngelScript**, строк: **50**, объявлений: **8**
- Назначение: Тут обработчики завершения приложения /
- Состав: class — 3, func — 3, funcdef — 2

- `funcdef void PVV();`
- `funcdef void PCancelExitApp(ExitAppCancel&&);`
- `bool initExitApp()`
- `class ExitAppNotifier`

### внутри `ExitAppNotifier`

- `void onEvent(const Guid&in eventID, long val, IUnknown& obj)`

### верхний уровень

- `class BeforeExitAppNotifier`

### внутри `BeforeExitAppNotifier`

- `void onEvent(const Guid&in eventID, long val, IUnknown& obj)`

### верхний уровень

- `class ExitAppCancel`
