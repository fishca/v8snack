## `snegopat/addins/mdNavigator.js`

- Язык: **JScript**, строк: **1142**, объявлений: **21**
- Назначение: Навигатор по метаданным
- Состав: func — 18, macro — 3

- `walkMdObjs(mdObj, parentName, parentID)`
- `readMDtoVT()` — } end of TextWindowsWatcher class
- `fillTableProcedur(filter)`
- `fillTable(newFilter)` — Функция заполнения списка объектов метаданных Если есть строка фильтра, выводит объекты, удовлетворяющие фильтру, иначе выводит список последних выбранных объектов
- `checkCurrentMetadata()`
- `findMdObj(uuid)`
- `withSelected(func)`
- `doAction(func)` — Единый метод обработки выбора пользователя. Параметром передается функтор, который непосредственно выполняет действие.
- `addToHistory(query)`
- `updateCommands()` — Функция настройки команд для текущего выбранного объекта
- `macrosОткрыть объект метаданных()`
- `SelectMdUUID()`
- `macrosВыбрать контейнер метаданных для поиска()`
- `fillSubSystemUUIDRecursive(row)`
- `openProperty(Кнопка)` — Команда открытия свойств
- `startTextWindowWather(line)`
- `parseSubSystems(mdObj, row)`
- `walkSubSystems()`
- `macrosНастройка фильтра для подсистем()`
- `getDefaultMacros()` — дважды щелкает мышью по названию скрипта в окне Снегопата. */ Возвращает название макроса по умолчанию - вызывается, когда пользователь
- `beforeExitApp()`
