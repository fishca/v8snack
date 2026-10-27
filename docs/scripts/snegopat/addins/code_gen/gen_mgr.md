## `snegopat/addins/code_gen/gen_mgr.js`

- Язык: **JScript**, строк: **317**, объявлений: **7**
- Назначение: Менеджер генераторов кода
- Состав: func — 6, method — 1

- `registerCodeGen(description, caller)` — Регистрация функции кодогенератора.
- `TypeFinder(mdCont)` — Класс для получения названий типов объекта матаданных, т.к. штатный объект ОписаниеТипов в режиме Конфигуратора не выдает типы, основанные на метаданных.
- `TypeFinder.getTypeString(mdObj)`
- `formatAssign(lines)` — Функция, обрабатывает переданный массив строк, выравнивая в них знаки "="
- `formatAssignInplace(lines, startIdx)`
- `fillLine(symbol, count)` — Получить строку одинаковых символов указанной длины
- `selectMetaKind(mdCont, mdKinds, title)`
