## `snegopat/addins/dvcs/dvcs_bzr.js`

- Язык: **JScript**, строк: **434**, объявлений: **17**
- Назначение: Backend dvcs к bzr
- Состав: func — 17

- `bzr_getRootCatalog(path)`
- `bzr_test(pathToCatalog)`
- `bzr_getStatusForCatalog(pathToCatalog, ValueTablesFiles)`
- `bzr_getFileStatus(pathToCatalog, pathToFile)`
- `bzr_add(pathToFile, param2)`
- `bzr_run(pathToFile)`
- `bzr_getFileAtRevision(pathToFile, rev)`
- `bzr_commit(pathToFile, message)`
- `bzr_getFilePathToDiff(param1, param2)`
- `bzr_remove(pathToFile)`
- `bzr_revert(pathToFile, ver)`
- `bzr_getLog(pathToFile, limit)`
- `bzr_getInfo(pathToFile, ver)`
- `bzr_getListBranch(pathToFile, index)`
- `bzr_swithBranch(pathToFile, branch)`
- `Backend_bzr(command, param1, param2)`
- `GetBackend()`
