## `snegopat/addins/dvcs/dvcs_fossil.js`

- Язык: **JScript**, строк: **852**, объявлений: **24**
- Назначение: Backend к dvcs fossil
- Состав: func — 24

- `macrosНастрокаFossil()`
- `cmdSnegopatНачалоВыбора(Элемент, СтандартнаяОбработка)`
- `cmdBaseНачалоВыбора(Элемент, СтандартнаяОбработка)`
- `fossil_getRootCatalog(path)`
- `fossil_test(pathToCatalog)`
- `fossil_getStatusForCatalog(pathToCatalog, ValueTablesFiles)`
- `fossil_getFileAtRevision(pathToFile, rev)`
- `fossil_getFilePathToDiff(param1, param2)`
- `fossil_add(pathToFile, param2)`
- `fossil_run(pathToFile)`
- `fossil_getFileStatus(pathToCatalog, pathToFile)`
- `fossil_revert(pathToFile, ver)`
- `fossil_delete(pathToFile)`
- `fossil_commit(pathToFile, message)`
- `fossil_showlog(pathToFile)`
- `fossil_getLog(pathToFile, limit)`
- `fossil_getInfo(pathToFile, ver)`
- `fossil_getListBranch(pathToFile, index)`
- `fossil_swithBranch(pathToFile, branch)`
- `fossil_createBranch(pathToFile, branch, type)`
- `fossil_getMissingFiles(pathToFile)`
- `Backend_fossil(command, param1, param2)`
- `GetBackend()`
- `getDefaultMacros()`
