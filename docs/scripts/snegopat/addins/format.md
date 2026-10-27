## `snegopat/addins/format.js`

- Язык: **JScript**, строк: **492**, объявлений: **8**
- Назначение: Форматирование модуля
- Состав: func — 8

- `isEqCombination(inputLine)` — проверяет наличие различных сочитаний со знаком равно в строке. >= <= != итд
- `fillLine(symbol, count)`
- `getEqAdequatePosition(inputLine)` — минимально-необходимое размещение знака РАВНО
- `firstUsefulOnTheLeft(inputLine)` — Найти в левой части присвоения индекс первого символа, который не является пробелом или табом. индексы в строках идут с 0.
- `eqSymbolInLine(inputLine)` — какой символ РАВНО используется в строке. <=, != итд
- `MoveBlock(toLeft, spaceChar)` — / Сдвигает текст вправо/влево вставляя/удаляя при этом заданный символ Макрос для сдвига текста за символом | (для форматирования запросов)
- `AlignByComma(byFirst)`
- `getPredefinedHotkeys(predef)`
