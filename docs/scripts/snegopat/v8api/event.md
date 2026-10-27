## `snegopat/v8api/event.v`

- Язык: **v8api (.v)**, строк: **83**, объявлений: **28**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 4, method — 14, meths — 3, slot-skip — 2, virt — 5

- `:iface IEventRecipient {D15F2BB0-BD08-11d3-B950-008048DA0334}` — Описание интерфейсов работы с событиями

### внутри `IEventRecipient`

- `:virt`
- `void onEvent(const Guid&in eventID, long val, IUnknown& obj)`
- `:virt`
- `void notify(const Guid&in eventID, long val=0, IUnknown@ obj=null)` — Рассылка уведомления о событии
- `void subscribe(const Guid&in eventID, IEventRecipient@ pRecipient)`
- `void _subscribe(const Guid&in eventID, IEventRecipient@ pRecipient, int_ptr srcName, int srcFlag)` — 8.3.24+: метод принимает ещё имя источника (const char*) и число; с NULL в имени платформа падает (strlen). Родная сигнатура под именем _subscribe, прежняя — обёрткой ниже (в 8.3.24-27 найдено по core83.dll, не по документации)
- `void unsubscribe(const Guid&in eventID, IEventRecipient@ pRecipient)` — Отписка от события
- `:meths`
- `void subscribe(const Guid&in eventID, IEventRecipient@ pRecipient)`
- `:meths`

### верхний уровень

- `:iface IIdleService {6B1FFDD4-36BE-11D4-9859-008048DA1252}` — Сервис позволяющий подписаться на получение уведомлений о простое программы

### внутри `IIdleService`

- `:virt`
- `пропуск слотов: +2`
- `void addIdleHandler(IIdleHandler@ handler)`
- `void removeIdleHandler(IIdleHandler@ handler)`
- `void addIdleHandler(IIdleHandler@& handler)`
- `void removeIdleHandler(IIdleHandler@& handler)`
- `пропуск слотов: +1`
- `void postEvent(const Guid& id, int val = 0, IUnknown@+ obj=null)`
- `:meths`

### верхний уровень

- `:iface IIdleHandler {6B1FFDD6-36BE-11D4-9859-008048DA1252}` — Подписчик на получение уведомлений о простое должен реализовать этот интерфейс. unknown должно возвращать 7

### внутри `IIdleHandler`

- `:virt`
- `bool onIdle(int count)`
- `int unknown()`

### верхний уровень

- `:iface IAppExitCancel {85097440-4AD8-11D6-B231-0050BAE2BC79}` — Интерфейс позволяет отменить закрытие приложения, с возможностью его спрятать Приходит в onEvent как obj в событии eventBeforeExitApp

### внутри `IAppExitCancel`

- `:virt`
- `void cancelExit(bool hide=false)`
