# Тесты Снегопата (v8snack)

Проверяют функциональность сборки без запуска 1С: компиляцию движка под версии
платформы, структуру v8api, целостность сборки, синтаксис аддинов и dump-tools.

## Запуск

Из корня репозитория:

```bash
python -m unittest discover -s tests -v
```

Без зависимостей пройдут все тесты, кроме `test_dumptools` (нужны
capstone/pefile/numpy) — они пропустятся. Для полного прогона:

```bash
python -m venv .venv-tests
.venv-tests/Scripts/pip install capstone pefile numpy
.venv-tests/Scripts/python -m unittest discover -s tests -v
```

## Что покрыто

| Файл | Проверка |
|---|---|
| `test_compile.py` | Компиляция модуля `snegopat` (`coreas_runner_c check`) под каждую поддерживаемую версию платформы; запрещённые guard'ом версии (>= 8.3.28, 8.5.x) обязаны отклоняться с «Unsupported version» |
| `test_v8api.py` | Структура `.v`: интерфейсы имеют GUID, базы разрешимы, нет дубликатов методов, слоты неотрицательны; guard process.v; каждая константа-слот, используемая в движке (`I<Интерфейс>_<метод>`), существует в v8api |
| `test_integrity.py` | Разрядность PE каждого бинаря (starter = x86, lib/x64 = x64…), наборы lib/x64 и lib/x86 совпадают, module.info ссылается на существующие пути, load/snegopat.txt, defaults не пусты, options.ini, version.json согласован с README, win11-fix `.reg` |
| `test_addins.py` | Каждый `.epf` имеет одноимённый `.js`; `node --check` по всем `.js` |
| `test_dumptools.py` | `vtcmp.parse` (текстовые дампы `.vtable`), `vtalign.records` (бинарь vt-dump.bin), `resolve_thunk`/`fingerprint` (дизассемблирование), `v8re.demangle` |

## Важные особенности (обнаружены при разработке)

- `coreas_runner_c check snegopat` нужно запускать **из корня Core.As (папка `x64`)** и
  **без `/f`**: параметр `/f` с папкой модуля ломает загрузку («не удалось найти
  функцию int main»), дефолтный поиск `<корень>/modules/<имя>` работает.
- Вывод компилятора в кодировке cp866 — тесты декодируют сами.
- Модуль `snegopat` скомпилирован (check), только если в `engine/*.as` нет ссылок на
  отсутствующие для данной версии символы: это поймало баг `colorsLineBgCount`
  (8.3.25 и старше) — см. `ANALYSIS.md`.
- **Файлы модуля обязаны быть в LF.** При CRLF core_as.dll регистрирует типы дважды
  (ошибка `RegisterTypedef 'COLORREF'/'uint32'`, `main/api/winapi.v`), и валидная
  сборка не компилируется. Гарантию даёт `.gitattributes` (`* text=auto eol=lf`)
  и в CI checkout с `core.autocrlf: false`. Это находил сам тест: падал именно
  compile-прогон на Windows-раннере (CRLF-чек-аут), локально (LF) проходил.
- 8.5.1 и 8.3.28+ не поддерживаются: `v8api/process.v` отклоняет их guard'ом.
- Семантика `:virt` в парсере (`tests/vparse.py`): `+N` — пропуск слотов,
  голое число — абсолютный слот следующего метода, перегрузки (одно имя, разные
  сигнатуры) занимают свои слоты и допустимы, `#else` — отдельная ветка.
- `Window` в window.v — служба-заглушка без методов; `IID_IUnknown`/`IID_IDispatch`/
  `INVALID_HANDLE_VALUE` — константы stdlib Core.As, `INDIC_*`/`INVOKE_*` — члены
  перечислений в движке/`main/api/com.v`; резолвер теста это учитывает.