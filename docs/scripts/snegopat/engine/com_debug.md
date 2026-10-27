## `snegopat/engine/com_debug.as`

- Язык: **AngelScript**, строк: **173**, объявлений: **9**
- Назначение: Реализация работы с отладчиком 1С /
- Состав: class — 5, func — 4

- `class IDebugEvalProp` — Описание свойства результата вычисления отладочного выражения
- `class IDebugEvalResult` — Результат вычисления отладочного выражения

### внутри `IDebugEvalResult`

- `IDebugEvalProp&& prop(int idx)` — Получить свойство

### верхний уровень

- `class IDebugEventReceiver`

### внутри `IDebugEventReceiver`

- `void onEvent(const Guid&in eventID, long val, IUnknown& obj)`
- `void IExternalCalculatorOwner_setExternalCalculatorTrap(IExternalCalculatorOwner& pThis, IUnknown& calc)`

### верхний уровень

- `class IV8Debugger` — Работа с отладчиком 1С

### внутри `IV8Debugger`

- `IDebugEvalResult&& eval(const string& expression)` — Вычислить отладочное вырадение

### верхний уровень

- `class IExternalCalculator : public IUnknown`
