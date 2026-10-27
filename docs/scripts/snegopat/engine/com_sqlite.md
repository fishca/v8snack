## `snegopat/engine/com_sqlite.as`

- Язык: **AngelScript**, строк: **372**, объявлений: **41**
- Назначение: Работа с sqlite базами /
- Состав: class — 6, func — 34, interface — 1

- `bool processOneQuery(int_ptr pStmt, Value& result, QueryResultProcessor& qp)` — Обработка одного запроса
- `bool processOneQueryAndReset(int_ptr pStmt, Value& result, QueryResultProcessor& qp)`
- `interface QueryResultProcessor` — Интерфейс приёмника результата запроса
- `class EmptyQueryResultProcessor : QueryResultProcessor` — Пустой обработчик результата запроса

### внутри `EmptyQueryResultProcessor`

- `bool needColumns()`
- `void setColumns(array<string>& colNames)`
- `AddResultRowAnswers addResultRow()`
- `void setResultValue(uint col, const Value& val)`
- `void setAnswer(Value& val, int_ptr db)`

### верхний уровень

- `class ValueTableQueryResultProcessor : QueryResultProcessor` — Обработчик, укладывающий результат в таблицу значений

### внутри `ValueTableQueryResultProcessor`

- `bool needColumns()`
- `void setColumns(array<string>& colNames)`
- `AddResultRowAnswers addResultRow()`
- `void setResultValue(uint col, const Value& val)`
- `void setAnswer(Value& val, int_ptr db)`

### верхний уровень

- `class OneRowQueryResultProcessor : QueryResultProcessor` — Обработчик, который укладывает первую строку результата запроса в объект Структура Названия полей результата запроса становятся названиями свойств структуры Недопустимые символы заменяются на '_'

### внутри `OneRowQueryResultProcessor`

- `bool needColumns()`
- `void setColumns(array<string>& colNames)`
- `AddResultRowAnswers addResultRow()`
- `void setResultValue(uint col, const Value& val)`
- `void setAnswer(Value& val, int_ptr db)`

### верхний уровень

- `class OneValueQueryResultProcessor : QueryResultProcessor` — Обработчик, который возвращает как результат первое поле первой строки запроса

### внутри `OneValueQueryResultProcessor`

- `bool needColumns()`
- `void setColumns(array<string>& colNames)`
- `AddResultRowAnswers addResultRow()`
- `void setResultValue(uint col, const Value& val)`
- `void setAnswer(Value& val, int_ptr db)`

### верхний уровень

- `class SqliteBase` — Класс обёртка для работы с базой данных sqlite

### внутри `SqliteBase`

- `Variant exec(const string& strQuery, bool answerIsID = false, Variant resArray = 0)` — Выполнить один запрос или несколько запросов, разделённых ';' Возвращает результат выполнения последнего из запросов. Если третьим параметром передан Массив, то добавляет к нему результат выполнения каждого из запросов Результатом выполнения запроса считается: - для select запросов: ТаблицаЗначений, в которую укладываются полученные строки Колонки ТЗ соответствуют полям запроса. В идентификаторах колонок все недопустимые символы заменяются на '_', а заголовки колонок совпадают с названиями полей запроса - для остальных запросов: если answerIsID false, то количество обработанных строк, иначе lastInsertRowID
- `string get_lastError()` — Получить описание ошибки
- `void close()` — Закрыть базу данных
- `SqliteQuery&& prepare(const string& strQuery)` — Подготовить один запрос
- `uint changes()` — Возвращает количество строк, обработанных непосредственно последним запросом
- `uint totalChanges()` — Возвращает общее количество строк, обработанных при выполнении последнего запроса, учитывая различные триггеры
- `uint64 lastInsertedID()` — Возвращает rowid последней добавленной строки

### верхний уровень

- `class SqliteQuery` — Класс для выполнения подготовленного запроса

### внутри `SqliteQuery`

- `SqliteQuery&& bind(Variant idx, Variant val)` — Установить параметр по имени или номеру
- `Variant exec(bool isAnswerID = false)` — Выполнить запрос. Возвращаемое значение, как в SqliteBase::exec
- `Variant queryRow()` — Выполняет запрос и возвращает первую строку результата в виде объекта Структура
- `Variant queryValue()` — Выполняет запрос и возвращает первое поле первой строки результата запроса
- `void close()`
