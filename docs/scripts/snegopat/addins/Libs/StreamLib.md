## `snegopat/addins/Libs/StreamLib.js`

- Язык: **JScript**, строк: **339**, объявлений: **22**
- Состав: func — 4, method — 18

- `_StreamParser()` — { StreamParser
- `_StreamParser.setStream(stream)`
- `_StreamParser.getStream()`
- `_StreamParser.readStreamFromFile(filepath)`
- `_StreamParser.parse()`
- `_StreamParser._parse()` — Реализация парсера StreamParser. {
- `_StreamParser.readArray()`
- `_StreamParser.readNumber()`
- `_StreamParser.readString()`
- `_StreamParser.atEnd()`
- `_StreamParser.next()`
- `_StreamParser.charAt(index)`
- `_StreamParser.isEquals(ch)`
- `_StreamParser.isSpace()`
- `_StreamParser.isNumber()`
- `_StreamParserSyntaxErrorException(description, errorPos, methodId)` — Обработка ошибок алгоритма парсинга в StreamParser. {
- `_StreamParserUnexpectedEndOfStreamExeption(description, methodId)`
- `_StreamParser.errorSyntaxError(methodId)`
- `_StreamParser.errorUnexpectedEndOfStream(methodId)`
- `_StreamParser._getErrorContext()` — выделенный дополнительно пробелами слева и справа (по одному пробелу). */ этой строки. Перед позицией, в которой обнаружена ошибка будет добавлен маркер '<!>', Возвращает контекст ошибки: строку, в которой произошла ошибки и строки выше и ниже
- `_StreamParser._methodIdRepr(methodId)`
- `_logError(message)`
