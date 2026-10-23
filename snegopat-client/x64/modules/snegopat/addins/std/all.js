//engine: JScript

var allAddins={
 "scripts": {
  "my_macros": {
   "filePath": "addins\\custom\\my_macros.js",
   "tags": {
    "uname": "my_macros",
    "dname": "Мои макросы",
    "descr": "Мои макросы",
    "author": "vladnet",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\custom\\my_macros.js",
   "helpPath": "",
   "name": "Мои макросы",
   "autoLevel": 0
  },
  "AnalizeEventSubscript": {
   "filePath": "addins\\AnalizeEventSubscript.js",
   "tags": {
    "uname": "AnalizeEventSubscript",
    "dname": "Анализ подписок на события",
    "descr": "Скрипт, показывающий отчет по подпискам на события объектов метаданных",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\AnalizeEventSubscript.js",
   "helpPath": "help\\addins_AnalizeEventSubscript.js0.html",
   "name": "Анализ подписок на события",
   "autoLevel": 0
  },
  "author": {
   "filePath": "addins\\author.js",
   "tags": {
    "uname": "author",
    "dname": "Авторский комментарий",
    "descr": "Быстрая вставка авторских комментариев об изменениях кода",
    "author": "Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/forum/viewtopic.php?t=111",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\author.js",
   "helpPath": "help\\addins_author.js0.html",
   "name": "Авторский комментарий",
   "autoLevel": 0
  },
  "Autosave": {
   "filePath": "addins\\Autosave.js",
   "tags": {
    "uname": "Autosave",
    "dname": "Автосохранение",
    "descr": "При изменении текста модуля, сохраняет текст в файл и позволяет восстанавливить этот текст в случае падения платформы.",
    "author": "Синиченко Александр <sinichenko@yandex.ru>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\Autosave.js",
   "helpPath": "help\\addins_Autosave.js0.html",
   "name": "Автосохранение",
   "autoLevel": 0
  },
  "auto_module_pwd": {
   "filePath": "addins\\auto_module_pwd.js",
   "tags": {
    "uname": "auto_module_pwd",
    "dname": "Авто-ввод паролей на модуль",
    "descr": "",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\auto_module_pwd.js",
   "helpPath": "help\\addins_auto_module_pwd.js0.html",
   "name": "Авто-ввод паролей на модуль",
   "autoLevel": 0
  },
  "bookmarkers": {
   "filePath": "addins\\BookMarkers.js",
   "tags": {
    "uname": "bookmarkers",
    "dname": "Закладки",
    "descr": "Скрипт получает список меток(определеннного формата) из модуля, чтобы быстро переходить к отмеченным местам в коде",
    "author": "",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\BookMarkers.js",
   "helpPath": "help\\addins_BookMarkers.js0.html",
   "name": "Закладки",
   "autoLevel": 0
  },
  "bsl_analyze": {
   "filePath": "addins\\bsl_analyze.js",
   "tags": {
    "uname": "bsl_analyze",
    "dname": "Расширенный анализ модулей",
    "descr": "Скрипт для взаимодействия с bsl language server",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "Редактирование\\Качество кода",
    "autoload": "1"
   },
   "load": "script:addins\\bsl_analyze.js",
   "helpPath": "help\\addins_bsl_analyze.js0.html",
   "name": "Расширенный анализ модулей",
   "autoLevel": 1
  },
  "CfgStore": {
   "filePath": "addins\\CfgStore.js",
   "tags": {
    "uname": "CfgStore",
    "dname": "Хранилище",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\CfgStore.js",
   "helpPath": "",
   "name": "Хранилище",
   "autoLevel": 0
  },
  "choiceHelpTopic": {
   "filePath": "addins\\choiceHelpTopic.js",
   "tags": {
    "uname": "choiceHelpTopic",
    "dname": "Выбрать главу справки",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\choiceHelpTopic.js",
   "helpPath": "",
   "name": "Выбрать главу справки",
   "autoLevel": 0
  },
  "choiseSubSystem": {
   "filePath": "addins\\choiceSubSystem.js",
   "tags": {
    "uname": "choiseSubSystem",
    "dname": "Выбрать подсистему",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\choiceSubSystem.js",
   "helpPath": "",
   "name": "Выбрать подсистему",
   "autoLevel": 0
  },
  "configCaption": {
   "filePath": "addins\\configCaption.js",
   "tags": {
    "uname": "configCaption",
    "dname": "Заголовок окна Конфигуратора",
    "descr": "Изменение заголовка окна Конфигуратора на более полезное",
    "author": "orefkov, artbear",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=configCaption.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\configCaption.js",
   "helpPath": "help\\addins_configCaption.js0.html",
   "name": "Заголовок окна Конфигуратора",
   "autoLevel": 0
  },
  "debugHelpers": {
   "filePath": "addins\\debugHelpers.js",
   "tags": {
    "uname": "debugHelpers",
    "dname": "Отладчик:Вспомогательные команды",
    "descr": "",
    "author": "Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\debugHelpers.js",
   "helpPath": "",
   "name": "Отладчик:Вспомогательные команды",
   "autoLevel": 0
  },
  "DebugInstruments": {
   "filePath": "addins\\DebugInstruments.js",
   "tags": {
    "uname": "DebugInstruments",
    "dname": "Отладка с Инструментами разработчика",
    "descr": "",
    "author": "Сосна Евгений <shenja@sosna.zp.ua>, Старых С.А.",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\DebugInstruments.js",
   "helpPath": "",
   "name": "Отладка с Инструментами разработчика",
   "autoLevel": 0
  },
  "editor_colors": {
   "filePath": "addins\\editor_colors.js",
   "tags": {
    "uname": "editor_colors",
    "dname": "Настройка профилей цветов редактора",
    "descr": "Быстрая настройка цветовых профилей редактора модулей",
    "author": "Сосна Евгений <shenja@sosna.zp.ua>, orefkov",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=Editor_colors.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\editor_colors.js",
   "helpPath": "help\\addins_editor_colors.js0.html",
   "name": "Настройка профилей цветов редактора",
   "autoLevel": 0
  },
  "extfiles": {
   "filePath": "addins\\extfiles.js",
   "tags": {
    "uname": "extfiles",
    "dname": "Внешние файлы",
    "descr": "Добавляет окно из которого можно открывать внешние файлы.",
    "author": "Пушин Владимир <vladnet@gmail.com>, Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog, Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "1.40",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=extfiles.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\extfiles.js",
   "helpPath": "help\\addins_extfiles.js0.html",
   "name": "Внешние файлы",
   "autoLevel": 0
  },
  "ExtendedSearch": {
   "filePath": "addins\\extSearchReplace.js",
   "tags": {
    "uname": "ExtendedSearch",
    "dname": "Расширенный поиск и замена",
    "descr": "Реализация удобного и мощного поиска и замены по модулям.",
    "author": "Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=extSearch.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\extSearchReplace.js",
   "helpPath": "help\\addins_extSearchReplace.js0.html",
   "name": "Расширенный поиск и замена",
   "autoLevel": 0
  },
  "format_script": {
   "filePath": "addins\\format.js",
   "tags": {
    "uname": "format_script",
    "dname": "Форматирование модуля",
    "descr": "Несколько полезных при редактировании модулей макросов",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/video/format",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\format.js",
   "helpPath": "help\\addins_format.js0.html",
   "name": "Форматирование модуля",
   "autoLevel": 0
  },
  "funcprocpanel": {
   "filePath": "addins\\FuncProcPanel.js",
   "tags": {
    "uname": "funcprocpanel",
    "dname": "Панель функ/проц с группировкой по контексту компиляции",
    "descr": "Скрипт для показа \"списка процедур\"",
    "author": "Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=FuncProcPanel.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\FuncProcPanel.js",
   "helpPath": "help\\addins_FuncProcPanel.js0.html",
   "name": "Панель функ/проц с группировкой по контексту компиляции",
   "autoLevel": 0
  },
  "git_blame": {
   "filePath": "addins\\git_blame.js",
   "tags": {
    "uname": "git_blame",
    "dname": "Показ git blame",
    "descr": "Скрипт показывает git blame для текущего окна",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\git_blame.js",
   "helpPath": "help\\addins_git_blame.js0.html",
   "name": "Показ git blame",
   "autoLevel": 0
  },
  "git_common": {
   "filePath": "addins\\git_common.js",
   "tags": {
    "uname": "git_common",
    "dname": "Общий функционал для работы с git",
    "descr": "Скрипт содержит общий функционал для работы с git",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\git_common.js",
   "helpPath": "help\\addins_git_common.js0.html",
   "name": "Общий функционал для работы с git",
   "autoLevel": 0
  },
  "jump2refs": {
   "filePath": "addins\\jump2refs.js",
   "tags": {
    "uname": "jump2refs",
    "dname": "Переход к ссылкам метаданных",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\jump2refs.js",
   "helpPath": "",
   "name": "Переход к ссылкам метаданных",
   "autoLevel": 0
  },
  "mdNavigator": {
   "filePath": "addins\\mdNavigator.js",
   "tags": {
    "uname": "mdNavigator",
    "dname": "Навигатор по метаданным",
    "descr": "Скрипт для быстрого поиска метаданных.",
    "author": "Евгений JohnyDeath Мартыненков, orefkov, Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\mdNavigator.js",
   "helpPath": "help\\addins_mdNavigator.js0.html",
   "name": "Навигатор по метаданным",
   "autoLevel": 0
  },
  "qs": {
   "filePath": "addins\\qs.js",
   "tags": {
    "uname": "qs",
    "dname": "Быстрый поиск",
    "descr": "Быстрый поиск по модулям конфигурации в предварительно сделанной поисковой базе",
    "author": "",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\qs.js",
   "helpPath": "help\\addins_qs.js0.html",
   "name": "Быстрый поиск",
   "autoLevel": 0
  },
  "queryParamsExtractor": {
   "filePath": "addins\\queryParamsExtractor.js",
   "tags": {
    "uname": "queryParamsExtractor",
    "dname": "Извлечение параметров запроса",
    "descr": "Выделяет параметры из текста запроса",
    "author": "Василий Фролов aka Палыч, palytsh@mail.ru",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\queryParamsExtractor.js",
   "helpPath": "help\\addins_queryParamsExtractor.js0.html",
   "name": "Извлечение параметров запроса",
   "autoLevel": 0
  },
  "query_colors": {
   "filePath": "addins\\query_colors.js",
   "tags": {
    "uname": "query_colors",
    "dname": "Настройка цветов редактора запросов",
    "descr": "Скрипт позволяет настраивать цвета редактора запросов",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=query_colors.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\query_colors.js",
   "helpPath": "help\\addins_query_colors.js0.html",
   "name": "Настройка цветов редактора запросов",
   "autoLevel": 0
  },
  "Refactoring": {
   "filePath": "addins\\refactoring.js",
   "tags": {
    "uname": "Refactoring",
    "dname": "Рефакторинг",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\refactoring.js",
   "helpPath": "",
   "name": "Рефакторинг",
   "autoLevel": 0
  },
  "_RegExpEditor": {
   "filePath": "addins\\RegExpEditor.js",
   "tags": {
    "uname": "_RegExpEditor",
    "dname": "Редактор регулярных выражений",
    "descr": "Скрипт для редактирования и проверки регулярных выражений",
    "author": "Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=RegExpEditor.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\RegExpEditor.js",
   "helpPath": "help\\addins_RegExpEditor.js0.html",
   "name": "Редактор регулярных выражений",
   "autoLevel": 0
  },
  "RunEnterprise": {
   "filePath": "addins\\RunEnterprise.js",
   "tags": {
    "uname": "RunEnterprise",
    "dname": "Запуск 1С",
    "descr": "выполняет запуск альтернативного режима работы",
    "author": "Артур Аюханов aka artbear <aartbear@gmail.com>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\RunEnterprise.js",
   "helpPath": "help\\addins_RunEnterprise.js0.html",
   "name": "Запуск 1С",
   "autoLevel": 0
  },
  "syntax_check_clear": {
   "filePath": "addins\\sc_clear.js",
   "tags": {
    "uname": "syntax_check_clear",
    "dname": "Очистка перед проверкой",
    "descr": "Очистка окна сообщений перед запуском синтакс-проверки",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\sc_clear.js",
   "helpPath": "help\\addins_sc_clear.js0.html",
   "name": "Очистка перед проверкой",
   "autoLevel": 0
  },
  "selectColumn": {
   "filePath": "addins\\selectColumn.js",
   "tags": {
    "uname": "selectColumn",
    "dname": "Выбор колонки табличного поля",
    "descr": "Быстрый ввод названий колонок табличных полей из обычной формы",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\selectColumn.js",
   "helpPath": "help\\addins_selectColumn.js0.html",
   "name": "Выбор колонки табличного поля",
   "autoLevel": 0
  },
  "SessionManager": {
   "filePath": "addins\\SessionManager.js",
   "tags": {
    "uname": "SessionManager",
    "dname": "Менеджер сессии",
    "descr": "",
    "author": "Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\SessionManager.js",
   "helpPath": "help\\addins_SessionManager.js0.html",
   "name": "Менеджер сессии",
   "autoLevel": 0
  },
  "silence": {
   "filePath": "addins\\silence.js",
   "tags": {
    "uname": "silence",
    "dname": "Тишина в отсеках",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\silence.js",
   "helpPath": "",
   "name": "Тишина в отсеках",
   "autoLevel": 0
  },
  "snippets": {
   "filePath": "addins\\snippets.js",
   "tags": {
    "uname": "snippets",
    "dname": "Шаблоны кода",
    "descr": "Расширение возможностей механизма шаблонов кода 1С:Предприятия 8.",
    "author": "Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=snippets.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\snippets.js",
   "helpPath": "help\\addins_snippets.js0.html",
   "name": "Шаблоны кода",
   "autoLevel": 0
  },
  "SpellChecker": {
   "filePath": "addins\\SpellChecker.js",
   "tags": {
    "uname": "SpellChecker",
    "dname": "Класс SpellChecker",
    "descr": "Орфографическая проверка текстов",
    "author": "Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\SpellChecker.js",
   "helpPath": "help\\addins_SpellChecker.js0.html",
   "name": "Класс SpellChecker",
   "autoLevel": 0
  },
  "StackTraceView": {
   "filePath": "addins\\StackTraceView.js",
   "tags": {
    "uname": "StackTraceView",
    "dname": "Просмотр снимка стека",
    "descr": "",
    "author": "Starykh Sergey (tormozit) tormozit@mail.ru",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\StackTraceView.js",
   "helpPath": "help\\addins_StackTraceView.js0.html",
   "name": "Просмотр снимка стека",
   "autoLevel": 0
  },
  "stg_autoconnect": {
   "filePath": "addins\\stg_autoconnect.js",
   "tags": {
    "uname": "stg_autoconnect",
    "dname": "Авто-подключение к хранилищу",
    "descr": "",
    "author": "Александр Орефков orefkov at gmail.com",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=stg_autoconnect.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\stg_autoconnect.js",
   "helpPath": "help\\addins_stg_autoconnect.js0.html",
   "name": "Авто-подключение к хранилищу",
   "autoLevel": 0
  },
  "textEditorExt": {
   "filePath": "addins\\textEditorExt.js",
   "tags": {
    "uname": "textEditorExt",
    "dname": "Расширение редактора текстов",
    "descr": "Несколько макросов, полезных при редактировании текстов",
    "author": "Василий Фролов aka Палыч, palytsh@mail.ru",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\textEditorExt.js",
   "helpPath": "help\\addins_textEditorExt.js0.html",
   "name": "Расширение редактора текстов",
   "autoLevel": 0
  },
  "ToDoList": {
   "filePath": "addins\\ToDoList.js",
   "tags": {
    "uname": "ToDoList",
    "dname": "Список задач",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\ToDoList.js",
   "helpPath": "",
   "name": "Список задач",
   "autoLevel": 0
  },
  "type_finder": {
   "filePath": "addins\\type_finder.js",
   "tags": {
    "uname": "type_finder",
    "dname": "Быстрый поиск типа",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\type_finder.js",
   "helpPath": "",
   "name": "Быстрый поиск типа",
   "autoLevel": 0
  },
  "VimComplete": {
   "filePath": "addins\\VimComplete.js",
   "tags": {
    "uname": "VimComplete",
    "dname": "Автодополнение в стиле Vim",
    "descr": "Автодополнение слов в стиле редактора Vim",
    "author": "Александр Кунташов",
    "version": "1.4",
    "help": "inplace",
    "www": "https://snegopat.ru/scripts/wiki?name=VimComplete.js",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\VimComplete.js",
   "helpPath": "help\\addins_VimComplete.js0.html",
   "name": "Автодополнение в стиле Vim",
   "autoLevel": 0
  },
  "vtcreator": {
   "filePath": "addins\\vtcreator.js",
   "tags": {
    "uname": "vtcreator",
    "dname": "Конструктор ТЗ",
    "descr": "Конструктор ТЗ",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\vtcreator.js",
   "helpPath": "help\\addins_vtcreator.js0.html",
   "name": "Конструктор ТЗ",
   "autoLevel": 0
  },
  "wndpanel": {
   "filePath": "addins\\wndpanel.js",
   "tags": {
    "uname": "wndpanel",
    "dname": "Панель окон",
    "descr": "",
    "author": "Александр Орефков, Пушин Владимир <vladnet@gmail.com>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "",
    "autoload": ""
   },
   "load": "script:addins\\wndpanel.js",
   "helpPath": "help\\addins_wndpanel.js0.html",
   "name": "Панель окон",
   "autoLevel": 0
  },
  "codegen_create_doc": {
   "filePath": "addins\\\\code_gen\\create_doc.js",
   "tags": {
    "uname": "codegen_create_doc",
    "dname": "Генератор Документов",
    "descr": "",
    "author": "Александр Орефков orefkov@gmail.com",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "\\code_gen",
    "autoload": ""
   },
   "load": "script:addins\\\\code_gen\\create_doc.js",
   "helpPath": "help\\addins__code_gen_create_doc.js0.html",
   "name": "Генератор Документов",
   "autoLevel": 0
  },
  "codegen_create_refs": {
   "filePath": "addins\\\\code_gen\\create_refs.js",
   "tags": {
    "uname": "codegen_create_refs",
    "dname": "Генератор Справочников",
    "descr": "",
    "author": "Александр Орефков orefkov@gmail.com, Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "\\code_gen",
    "autoload": ""
   },
   "load": "script:addins\\\\code_gen\\create_refs.js",
   "helpPath": "help\\addins__code_gen_create_refs.js0.html",
   "name": "Генератор Справочников",
   "autoLevel": 0
  },
  "codegen_create_type": {
   "filePath": "addins\\\\code_gen\\create_type.js",
   "tags": {
    "uname": "codegen_create_type",
    "dname": "Генератор Описания типов...",
    "descr": "",
    "author": "Александр Орефков orefkov@gmail.com, Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "https://www.youtube.com/watch?v=ybQkiLsfCCw",
    "category": "\\code_gen",
    "autoload": ""
   },
   "load": "script:addins\\\\code_gen\\create_type.js",
   "helpPath": "help\\addins__code_gen_create_type.js0.html",
   "name": "Генератор Описания типов...",
   "autoLevel": 0
  },
  "diff_v8Reader": {
   "filePath": "addins\\\\dvcs\\diff-v8Reader.js",
   "tags": {
    "uname": "diff_v8Reader",
    "dname": "Backend к diff просмотру (ssf, cf)",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\diff-v8Reader.js",
   "helpPath": "",
   "name": "Backend к diff просмотру (ssf, cf)",
   "autoLevel": 0
  },
  "diff_1C": {
   "filePath": "addins\\\\dvcs\\diff_1C.js",
   "tags": {
    "uname": "diff_1C",
    "dname": "Backend к diff, типовое сравнение от 1С (mxl,txt,js,vbs)",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\diff_1C.js",
   "helpPath": "",
   "name": "Backend к diff, типовое сравнение от 1С (mxl,txt,js,vbs)",
   "autoLevel": 0
  },
  "diff_doc_file": {
   "filePath": "addins\\\\dvcs\\diff_doc.js",
   "tags": {
    "uname": "diff_doc_file",
    "dname": "Backend к diff просмотру (doc,docx)",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\diff_doc.js",
   "helpPath": "",
   "name": "Backend к diff просмотру (doc,docx)",
   "autoLevel": 0
  },
  "dvcs_bzr": {
   "filePath": "addins\\\\dvcs\\dvcs_bzr.js",
   "tags": {
    "uname": "dvcs_bzr",
    "dname": "Backend dvcs к bzr",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\dvcs_bzr.js",
   "helpPath": "",
   "name": "Backend dvcs к bzr",
   "autoLevel": 0
  },
  "dvcs_fossil": {
   "filePath": "addins\\\\dvcs\\dvcs_fossil.js",
   "tags": {
    "uname": "dvcs_fossil",
    "dname": "Backend к dvcs fossil",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\dvcs_fossil.js",
   "helpPath": "",
   "name": "Backend к dvcs fossil",
   "autoLevel": 0
  },
  "dvcs_git": {
   "filePath": "addins\\\\dvcs\\dvcs_git.js",
   "tags": {
    "uname": "dvcs_git",
    "dname": "Backend dvcs к git",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\dvcs_git.js",
   "helpPath": "",
   "name": "Backend dvcs к git",
   "autoLevel": 0
  },
  "FavoriteCommands": {
   "filePath": "addins\\\\FavCommands\\FavoriteCommands.js",
   "tags": {
    "uname": "FavoriteCommands",
    "dname": "Избранные команды",
    "descr": "",
    "author": "alonehobo",
    "version": "",
    "help": "inplace",
    "www": "https://snegopat.ru/forum/viewtopic.php?f=3&t=651",
    "category": "\\FavCommands",
    "autoload": ""
   },
   "load": "script:addins\\\\FavCommands\\FavoriteCommands.js",
   "helpPath": "help\\addins__FavCommands_FavoriteCommands.js0.html",
   "name": "Избранные команды",
   "autoLevel": 0
  },
  "codegen_manager": {
   "filePath": "addins\\\\code_gen\\gen_mgr.js",
   "tags": {
    "uname": "codegen_manager",
    "dname": "Менеджер генераторов кода",
    "descr": "",
    "author": "Александр Орефков orefkov@gmail.com, Сосна Евгений <shenja@sosna.zp.ua>",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "\\code_gen",
    "autoload": ""
   },
   "load": "script:addins\\\\code_gen\\gen_mgr.js",
   "helpPath": "help\\addins__code_gen_gen_mgr.js0.html",
   "name": "Менеджер генераторов кода",
   "autoLevel": 0
  },
  "immediate": {
   "filePath": "addins\\\\DevTools\\immediate.js",
   "tags": {
    "uname": "immediate",
    "dname": "Немедленное выполнение кода",
    "descr": "Скрипт-консоль для выполнения кода на JScript",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "\\DevTools",
    "autoload": ""
   },
   "load": "script:addins\\\\DevTools\\immediate.js",
   "helpPath": "help\\addins__DevTools_immediate.js0.html",
   "name": "Немедленное выполнение кода",
   "autoLevel": 0
  },
  "logview": {
   "filePath": "addins\\\\dvcs\\logview.js",
   "tags": {
    "uname": "logview",
    "dname": "Просмотр истории изменений",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\logview.js",
   "helpPath": "",
   "name": "Просмотр истории изменений",
   "autoLevel": 0
  },
  "pflview": {
   "filePath": "addins\\\\DevTools\\pflview.js",
   "tags": {
    "uname": "pflview",
    "dname": "Просмотр профайла 1С",
    "descr": "Скрипт для просмотра дерева сохранённых настроек 1С",
    "author": "orefkov",
    "version": "",
    "help": "inplace",
    "www": "",
    "category": "\\DevTools",
    "autoload": ""
   },
   "load": "script:addins\\\\DevTools\\pflview.js",
   "helpPath": "help\\addins__DevTools_pflview.js0.html",
   "name": "Просмотр профайла 1С",
   "autoLevel": 0
  },
  "PreCommitHookRedmine": {
   "filePath": "addins\\\\dvcs\\preCommitHookRedmine.js",
   "tags": {
    "uname": "PreCommitHookRedmine",
    "dname": "Хук перед помещением в хранилище",
    "descr": "",
    "author": "",
    "version": "",
    "help": "",
    "www": "",
    "category": "\\dvcs",
    "autoload": ""
   },
   "load": "script:addins\\\\dvcs\\preCommitHookRedmine.js",
   "helpPath": "",
   "name": "Хук перед помещением в хранилище",
   "autoLevel": 0
  }
 },
 "categories": {
  "name": "",
  "childs": [
   {
    "name": "code_gen",
    "childs": [],
    "scripts": [
     "codegen_create_doc",
     "codegen_create_type",
     "codegen_create_refs",
     "codegen_manager"
    ]
   },
   {
    "name": "DevTools",
    "childs": [],
    "scripts": [
     "immediate",
     "pflview"
    ]
   },
   {
    "name": "dvcs",
    "childs": [],
    "scripts": [
     "dvcs_bzr",
     "dvcs_git",
     "diff_doc_file",
     "diff_v8Reader",
     "diff_1C",
     "dvcs_fossil",
     "logview",
     "PreCommitHookRedmine"
    ]
   },
   {
    "name": "FavCommands",
    "childs": [],
    "scripts": [
     "FavoriteCommands"
    ]
   },
   {
    "name": "Редактирование",
    "childs": [
     {
      "name": "Качество кода",
      "childs": [],
      "scripts": [
       "bsl_analyze"
      ]
     }
    ],
    "scripts": []
   }
  ],
  "scripts": [
   "my_macros",
   "auto_module_pwd",
   "VimComplete",
   "stg_autoconnect",
   "author",
   "Autosave",
   "AnalizeEventSubscript",
   "qs",
   "type_finder",
   "extfiles",
   "selectColumn",
   "choiceHelpTopic",
   "choiseSubSystem",
   "configCaption",
   "bookmarkers",
   "RunEnterprise",
   "queryParamsExtractor",
   "SpellChecker",
   "vtcreator",
   "SessionManager",
   "mdNavigator",
   "editor_colors",
   "query_colors",
   "git_common",
   "DebugInstruments",
   "debugHelpers",
   "syntax_check_clear",
   "wndpanel",
   "funcprocpanel",
   "jump2refs",
   "git_blame",
   "StackTraceView",
   "textEditorExt",
   "ExtendedSearch",
   "_RegExpEditor",
   "Refactoring",
   "ToDoList",
   "silence",
   "format_script",
   "CfgStore",
   "snippets"
  ]
 },
 "help": {
  "name": "",
  "childs": [
   {
    "name": "Справка Снегопата",
    "childs": [
     {
      "name": "Начало работы со Снегопатом",
      "childs": [
       {
        "name": "Вкладка Настройка",
        "childs": [],
        "helpId": 2,
        "path": "help\\docs_firststep.md1.html"
       },
       {
        "name": "Справочная система снегопата",
        "childs": [],
        "helpId": 3,
        "path": "help\\docs_firststep.md2.html"
       }
      ],
      "helpId": 1,
      "path": "help\\docs_firststep.md0.html"
     },
     {
      "name": "Организация работы нескольких пользователей",
      "childs": [
       {
        "name": "Порядок развертывания снегопата в компании",
        "childs": [],
        "helpId": 5,
        "path": "help\\docs_multiuser.md1.html"
       },
       {
        "name": "Установка центрального репозитария",
        "childs": [],
        "helpId": 6,
        "path": "help\\docs_multiuser.md2.html"
       },
       {
        "name": "Установка Снегопата для разработчика",
        "childs": [],
        "helpId": 7,
        "path": "help\\docs_multiuser.md3.html"
       }
      ],
      "helpId": 4,
      "path": "help\\docs_multiuser.md0.html"
     },
     {
      "name": "Разработка скриптов на TypeScript",
      "childs": [
       {
        "name": "Первичная настройка",
        "childs": [],
        "helpId": 9,
        "path": "help\\docs_develop-start.md1.html"
       },
       {
        "name": "Создание собственных скриптов",
        "childs": [],
        "helpId": 10,
        "path": "help\\docs_develop-start.md2.html"
       },
       {
        "name": "Подсказки по TypeScript",
        "childs": [],
        "helpId": 11,
        "path": "help\\docs_develop-start.md3.html"
       },
       {
        "name": "Отладка скриптов",
        "childs": [],
        "helpId": 12,
        "path": "help\\docs_develop-start.md4.html"
       }
      ],
      "helpId": 8,
      "path": "help\\docs_develop-start.md0.html"
     },
     {
      "name": "Объектная модель Снегопата Reborn",
      "childs": [
       {
        "name": "Просмотр SnegAPI в исходниках",
        "childs": [],
        "helpId": 14,
        "path": "help\\docs_snegapi.md1.html"
       },
       {
        "name": "Объект Designer",
        "childs": [
         {
          "name": "Свойство addins",
          "childs": [],
          "helpId": 16,
          "path": "help\\docs_snegapi.md3.html"
         },
         {
          "name": "Метод v8New",
          "childs": [],
          "helpId": 17,
          "path": "help\\docs_snegapi.md4.html"
         },
         {
          "name": "Метод Message",
          "childs": [],
          "helpId": 18,
          "path": "help\\docs_snegapi.md5.html"
         },
         {
          "name": "Метод MessageBox",
          "childs": [],
          "helpId": 19,
          "path": "help\\docs_snegapi.md6.html"
         },
         {
          "name": "Свойство profileRoot",
          "childs": [],
          "helpId": 20,
          "path": "help\\docs_snegapi.md7.html"
         },
         {
          "name": "Метод designInternalForm",
          "childs": [],
          "helpId": 21,
          "path": "help\\docs_snegapi.md8.html"
         },
         {
          "name": "Метод designScriptForm",
          "childs": [],
          "helpId": 22,
          "path": "help\\docs_snegapi.md9.html"
         },
         {
          "name": "Метод loadScriptForm",
          "childs": [],
          "helpId": 23,
          "path": "help\\docs_snegapi.md10.html"
         },
         {
          "name": "Свойство hotkeys",
          "childs": [],
          "helpId": 24,
          "path": "help\\docs_snegapi.md11.html"
         },
         {
          "name": "Метод globalContext",
          "childs": [],
          "helpId": 25,
          "path": "help\\docs_snegapi.md12.html"
         },
         {
          "name": "Метод listGlobalContextes",
          "childs": [],
          "helpId": 26,
          "path": "help\\docs_snegapi.md13.html"
         },
         {
          "name": "Метод getCmdState",
          "childs": [],
          "helpId": 27,
          "path": "help\\docs_snegapi.md14.html"
         },
         {
          "name": "Метод sendCommand",
          "childs": [],
          "helpId": 28,
          "path": "help\\docs_snegapi.md15.html"
         },
         {
          "name": "Свойство cmdTrace",
          "childs": [],
          "helpId": 29,
          "path": "help\\docs_snegapi.md16.html"
         },
         {
          "name": "Свойство sVersion",
          "childs": [],
          "helpId": 30,
          "path": "help\\docs_snegapi.md17.html"
         },
         {
          "name": "Свойство v8Version",
          "childs": [],
          "helpId": 31,
          "path": "help\\docs_snegapi.md18.html"
         },
         {
          "name": "Свойство v8ver",
          "childs": [],
          "helpId": 32,
          "path": "help\\docs_snegapi.md19.html"
         },
         {
          "name": "Свойство snMainFolder",
          "childs": [],
          "helpId": 33,
          "path": "help\\docs_snegapi.md20.html"
         },
         {
          "name": "Свойство snegopat",
          "childs": [],
          "helpId": 34,
          "path": "help\\docs_snegapi.md21.html"
         },
         {
          "name": "Метод saveProfile",
          "childs": [],
          "helpId": 35,
          "path": "help\\docs_snegapi.md22.html"
         },
         {
          "name": "Свойсто events",
          "childs": [],
          "helpId": 36,
          "path": "help\\docs_snegapi.md23.html"
         },
         {
          "name": "Метод createTimer",
          "childs": [],
          "helpId": 37,
          "path": "help\\docs_snegapi.md24.html"
         },
         {
          "name": "Метод killTimer",
          "childs": [],
          "helpId": 38,
          "path": "help\\docs_snegapi.md25.html"
         },
         {
          "name": "Метод toV8Value",
          "childs": [],
          "helpId": 39,
          "path": "help\\docs_snegapi.md26.html"
         },
         {
          "name": "Свойство windows",
          "childs": [],
          "helpId": 40,
          "path": "help\\docs_snegapi.md27.html"
         },
         {
          "name": "Свойство metadata",
          "childs": [],
          "helpId": 41,
          "path": "help\\docs_snegapi.md28.html"
         },
         {
          "name": "Свойство v8files",
          "childs": [],
          "helpId": 42,
          "path": "help\\docs_snegapi.md29.html"
         },
         {
          "name": "Метод loadResourceString",
          "childs": [],
          "helpId": 43,
          "path": "help\\docs_snegapi.md30.html"
         },
         {
          "name": "Свойство ownerName",
          "childs": [],
          "helpId": 44,
          "path": "help\\docs_snegapi.md31.html"
         },
         {
          "name": "Свойство v8debug",
          "childs": [],
          "helpId": 45,
          "path": "help\\docs_snegapi.md32.html"
         },
         {
          "name": "Событие onMessage",
          "childs": [],
          "helpId": 46,
          "path": "help\\docs_snegapi.md33.html"
         },
         {
          "name": "Событие beforeExitApp",
          "childs": [],
          "helpId": 47,
          "path": "help\\docs_snegapi.md34.html"
         },
         {
          "name": "Событие onExitApp",
          "childs": [],
          "helpId": 48,
          "path": "help\\docs_snegapi.md35.html"
         },
         {
          "name": "Событие onLoadAddin",
          "childs": [],
          "helpId": 49,
          "path": "help\\docs_snegapi.md36.html"
         },
         {
          "name": "Событие onUnLoadAddin",
          "childs": [],
          "helpId": 50,
          "path": "help\\docs_snegapi.md37.html"
         },
         {
          "name": "Событие onIdle",
          "childs": [],
          "helpId": 51,
          "path": "help\\docs_snegapi.md38.html"
         },
         {
          "name": "Событие onSelectFile",
          "childs": [],
          "helpId": 52,
          "path": "help\\docs_snegapi.md39.html"
         },
         {
          "name": "Событие createTextWindow",
          "childs": [],
          "helpId": 53,
          "path": "help\\docs_snegapi.md40.html"
         }
        ],
        "helpId": 15,
        "path": "help\\docs_snegapi.md2.html"
       },
       {
        "name": "Объект IEventConnector",
        "childs": [
         {
          "name": "Метод connect",
          "childs": [],
          "helpId": 55,
          "path": "help\\docs_snegapi.md42.html"
         },
         {
          "name": "Метод disconnect",
          "childs": [],
          "helpId": 56,
          "path": "help\\docs_snegapi.md43.html"
         },
         {
          "name": "Метод disconnectNode",
          "childs": [],
          "helpId": 57,
          "path": "help\\docs_snegapi.md44.html"
         },
         {
          "name": "Метод fireEvent",
          "childs": [],
          "helpId": 58,
          "path": "help\\docs_snegapi.md45.html"
         },
         {
          "name": "Метод removeMyListeners",
          "childs": [],
          "helpId": 59,
          "path": "help\\docs_snegapi.md46.html"
         },
         {
          "name": "Метод addCommandHandler",
          "childs": [],
          "helpId": 60,
          "path": "help\\docs_snegapi.md47.html"
         },
         {
          "name": "Метод delCommandHandler",
          "childs": [],
          "helpId": 61,
          "path": "help\\docs_snegapi.md48.html"
         }
        ],
        "helpId": 54,
        "path": "help\\docs_snegapi.md41.html"
       },
       {
        "name": "Объект ICmdHandlerParam",
        "childs": [
         {
          "name": "Свойство groupID",
          "childs": [],
          "helpId": 63,
          "path": "help\\docs_snegapi.md50.html"
         },
         {
          "name": "Свойство cmdNumber",
          "childs": [],
          "helpId": 64,
          "path": "help\\docs_snegapi.md51.html"
         },
         {
          "name": "Свойство cmdParam",
          "childs": [],
          "helpId": 65,
          "path": "help\\docs_snegapi.md52.html"
         },
         {
          "name": "Свойство isBefore",
          "childs": [],
          "helpId": 66,
          "path": "help\\docs_snegapi.md53.html"
         },
         {
          "name": "Свойство cancel",
          "childs": [],
          "helpId": 67,
          "path": "help\\docs_snegapi.md54.html"
         }
        ],
        "helpId": 62,
        "path": "help\\docs_snegapi.md49.html"
       },
       {
        "name": "Объект ISelectFileData",
        "childs": [
         {
          "name": "Свойство mode",
          "childs": [],
          "helpId": 69,
          "path": "help\\docs_snegapi.md56.html"
         },
         {
          "name": "Свойство flags",
          "childs": [],
          "helpId": 70,
          "path": "help\\docs_snegapi.md57.html"
         },
         {
          "name": "Свойство filtersCount",
          "childs": [],
          "helpId": 71,
          "path": "help\\docs_snegapi.md58.html"
         },
         {
          "name": "Метод filterDescr",
          "childs": [],
          "helpId": 72,
          "path": "help\\docs_snegapi.md59.html"
         },
         {
          "name": "Метод filterVal",
          "childs": [],
          "helpId": 73,
          "path": "help\\docs_snegapi.md60.html"
         },
         {
          "name": "Свойство filter",
          "childs": [],
          "helpId": 74,
          "path": "help\\docs_snegapi.md61.html"
         },
         {
          "name": "Свойство defExt",
          "childs": [],
          "helpId": 75,
          "path": "help\\docs_snegapi.md62.html"
         },
         {
          "name": "Свойство initialFileName",
          "childs": [],
          "helpId": 76,
          "path": "help\\docs_snegapi.md63.html"
         },
         {
          "name": "Свойство folder",
          "childs": [],
          "helpId": 77,
          "path": "help\\docs_snegapi.md64.html"
         },
         {
          "name": "Свойство title",
          "childs": [],
          "helpId": 78,
          "path": "help\\docs_snegapi.md65.html"
         },
         {
          "name": "Свойство filesCount",
          "childs": [],
          "helpId": 79,
          "path": "help\\docs_snegapi.md66.html"
         },
         {
          "name": "Метод selectedFile",
          "childs": [],
          "helpId": 80,
          "path": "help\\docs_snegapi.md67.html"
         },
         {
          "name": "Метод addSelectedFile",
          "childs": [],
          "helpId": 81,
          "path": "help\\docs_snegapi.md68.html"
         },
         {
          "name": "Свойство result",
          "childs": [],
          "helpId": 82,
          "path": "help\\docs_snegapi.md69.html"
         }
        ],
        "helpId": 68,
        "path": "help\\docs_snegapi.md55.html"
       },
       {
        "name": "Работа с метаданными",
        "childs": [],
        "helpId": 83,
        "path": "help\\docs_snegapi.md70.html"
       },
       {
        "name": "Объект IV8MetaData",
        "childs": [
         {
          "name": "Свойство ib",
          "childs": [],
          "helpId": 85,
          "path": "help\\docs_snegapi.md72.html"
         },
         {
          "name": "Свойство current",
          "childs": [],
          "helpId": 86,
          "path": "help\\docs_snegapi.md73.html"
         },
         {
          "name": "Метод mdClass",
          "childs": [],
          "helpId": 87,
          "path": "help\\docs_snegapi.md74.html"
         },
         {
          "name": "Метод mdProp",
          "childs": [],
          "helpId": 88,
          "path": "help\\docs_snegapi.md75.html"
         },
         {
          "name": "Свойство openedCount",
          "childs": [],
          "helpId": 89,
          "path": "help\\docs_snegapi.md76.html"
         },
         {
          "name": "Метод getContainer",
          "childs": [],
          "helpId": 90,
          "path": "help\\docs_snegapi.md77.html"
         },
         {
          "name": "Событие MetaDataEvent",
          "childs": [],
          "helpId": 91,
          "path": "help\\docs_snegapi.md78.html"
         }
        ],
        "helpId": 84,
        "path": "help\\docs_snegapi.md71.html"
       },
       {
        "name": "Объект IV8MetaDataEvent",
        "childs": [
         {
          "name": "Свойство kind",
          "childs": [],
          "helpId": 93,
          "path": "help\\docs_snegapi.md80.html"
         },
         {
          "name": "Свойство request",
          "childs": [],
          "helpId": 94,
          "path": "help\\docs_snegapi.md81.html"
         },
         {
          "name": "Свойство result",
          "childs": [],
          "helpId": 95,
          "path": "help\\docs_snegapi.md82.html"
         },
         {
          "name": "Свойство container",
          "childs": [],
          "helpId": 96,
          "path": "help\\docs_snegapi.md83.html"
         },
         {
          "name": "Свойство obj",
          "childs": [],
          "helpId": 97,
          "path": "help\\docs_snegapi.md84.html"
         },
         {
          "name": "Свойство parentObj",
          "childs": [],
          "helpId": 98,
          "path": "help\\docs_snegapi.md85.html"
         },
         {
          "name": "Свойство prop",
          "childs": [],
          "helpId": 99,
          "path": "help\\docs_snegapi.md86.html"
         }
        ],
        "helpId": 92,
        "path": "help\\docs_snegapi.md79.html"
       },
       {
        "name": "Объект IV8MDContainer",
        "childs": [
         {
          "name": "Свойство rootObject",
          "childs": [],
          "helpId": 101,
          "path": "help\\docs_snegapi.md88.html"
         },
         {
          "name": "Метод typeList",
          "childs": [],
          "helpId": 102,
          "path": "help\\docs_snegapi.md89.html"
         },
         {
          "name": "Свойство masterContainer",
          "childs": [],
          "helpId": 103,
          "path": "help\\docs_snegapi.md90.html"
         },
         {
          "name": "Свойство isModified",
          "childs": [],
          "helpId": 104,
          "path": "help\\docs_snegapi.md91.html"
         },
         {
          "name": "Свойство treeVisible",
          "childs": [],
          "helpId": 105,
          "path": "help\\docs_snegapi.md92.html"
         },
         {
          "name": "Метод findByUUID",
          "childs": [],
          "helpId": 106,
          "path": "help\\docs_snegapi.md93.html"
         },
         {
          "name": "Метод findByTypeUUID",
          "childs": [],
          "helpId": 107,
          "path": "help\\docs_snegapi.md94.html"
         },
         {
          "name": "Свойство identifier",
          "childs": [],
          "helpId": 108,
          "path": "help\\docs_snegapi.md95.html"
         }
        ],
        "helpId": 100,
        "path": "help\\docs_snegapi.md87.html"
       },
       {
        "name": "Объект IV8TypeInfo",
        "childs": [
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 110,
          "path": "help\\docs_snegapi.md97.html"
         },
         {
          "name": "Свойство clsid",
          "childs": [],
          "helpId": 111,
          "path": "help\\docs_snegapi.md98.html"
         },
         {
          "name": "Свойство order1",
          "childs": [],
          "helpId": 112,
          "path": "help\\docs_snegapi.md99.html"
         },
         {
          "name": "Свойство order2",
          "childs": [],
          "helpId": 113,
          "path": "help\\docs_snegapi.md100.html"
         },
         {
          "name": "Свойство picture",
          "childs": [],
          "helpId": 114,
          "path": "help\\docs_snegapi.md101.html"
         }
        ],
        "helpId": 109,
        "path": "help\\docs_snegapi.md96.html"
       },
       {
        "name": "Объект IV8MDObject",
        "childs": [
         {
          "name": "Свойство id",
          "childs": [],
          "helpId": 116,
          "path": "help\\docs_snegapi.md103.html"
         },
         {
          "name": "Свойство mdclass",
          "childs": [],
          "helpId": 117,
          "path": "help\\docs_snegapi.md104.html"
         },
         {
          "name": "Свойство parent",
          "childs": [],
          "helpId": 118,
          "path": "help\\docs_snegapi.md105.html"
         },
         {
          "name": "Метод isSame",
          "childs": [],
          "helpId": 119,
          "path": "help\\docs_snegapi.md106.html"
         },
         {
          "name": "Метод property",
          "childs": [],
          "helpId": 120,
          "path": "help\\docs_snegapi.md107.html"
         },
         {
          "name": "Метод setProperty",
          "childs": [],
          "helpId": 121,
          "path": "help\\docs_snegapi.md108.html"
         },
         {
          "name": "Метод childObjectsCount",
          "childs": [],
          "helpId": 122,
          "path": "help\\docs_snegapi.md109.html"
         },
         {
          "name": "Метод childObject",
          "childs": [],
          "helpId": 123,
          "path": "help\\docs_snegapi.md110.html"
         },
         {
          "name": "Свойство container",
          "childs": [],
          "helpId": 124,
          "path": "help\\docs_snegapi.md111.html"
         },
         {
          "name": "Метод activateInTree",
          "childs": [],
          "helpId": 125,
          "path": "help\\docs_snegapi.md112.html"
         },
         {
          "name": "Метод editProperty",
          "childs": [],
          "helpId": 126,
          "path": "help\\docs_snegapi.md113.html"
         },
         {
          "name": "Метод openEditor",
          "childs": [],
          "helpId": 127,
          "path": "help\\docs_snegapi.md114.html"
         },
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 128,
          "path": "help\\docs_snegapi.md115.html"
         },
         {
          "name": "Метод types",
          "childs": [],
          "helpId": 129,
          "path": "help\\docs_snegapi.md116.html"
         },
         {
          "name": "Метод synonym",
          "childs": [],
          "helpId": 130,
          "path": "help\\docs_snegapi.md117.html"
         },
         {
          "name": "Свойство comment",
          "childs": [],
          "helpId": 131,
          "path": "help\\docs_snegapi.md118.html"
         },
         {
          "name": "Метод isPropModule",
          "childs": [],
          "helpId": 132,
          "path": "help\\docs_snegapi.md119.html"
         },
         {
          "name": "Метод getModuleText",
          "childs": [],
          "helpId": 133,
          "path": "help\\docs_snegapi.md120.html"
         },
         {
          "name": "Метод setModuleText",
          "childs": [],
          "helpId": 134,
          "path": "help\\docs_snegapi.md121.html"
         },
         {
          "name": "Метод openModule",
          "childs": [],
          "helpId": 135,
          "path": "help\\docs_snegapi.md122.html"
         },
         {
          "name": "Метод extPropUUID",
          "childs": [],
          "helpId": 136,
          "path": "help\\docs_snegapi.md123.html"
         },
         {
          "name": "Метод getExtProp",
          "childs": [],
          "helpId": 137,
          "path": "help\\docs_snegapi.md124.html"
         },
         {
          "name": "Метод saveToFile",
          "childs": [],
          "helpId": 138,
          "path": "help\\docs_snegapi.md125.html"
         },
         {
          "name": "Метод loadFromFile",
          "childs": [],
          "helpId": 139,
          "path": "help\\docs_snegapi.md126.html"
         },
         {
          "name": "Свойство picture",
          "childs": [],
          "helpId": 140,
          "path": "help\\docs_snegapi.md127.html"
         },
         {
          "name": "Свойство props",
          "childs": [],
          "helpId": 141,
          "path": "help\\docs_snegapi.md128.html"
         }
        ],
        "helpId": 115,
        "path": "help\\docs_snegapi.md102.html"
       },
       {
        "name": "Объект IV8MDClass",
        "childs": [
         {
          "name": "Свойство id",
          "childs": [],
          "helpId": 143,
          "path": "help\\docs_snegapi.md130.html"
         },
         {
          "name": "Метод name",
          "childs": [],
          "helpId": 144,
          "path": "help\\docs_snegapi.md131.html"
         },
         {
          "name": "Метод presentation",
          "childs": [],
          "helpId": 145,
          "path": "help\\docs_snegapi.md132.html"
         },
         {
          "name": "Свойство propertiesCount",
          "childs": [],
          "helpId": 146,
          "path": "help\\docs_snegapi.md133.html"
         },
         {
          "name": "Метод propertyAt",
          "childs": [],
          "helpId": 147,
          "path": "help\\docs_snegapi.md134.html"
         },
         {
          "name": "Свойство childsClassesCount",
          "childs": [],
          "helpId": 148,
          "path": "help\\docs_snegapi.md135.html"
         },
         {
          "name": "Метод childClassAt",
          "childs": [],
          "helpId": 149,
          "path": "help\\docs_snegapi.md136.html"
         }
        ],
        "helpId": 142,
        "path": "help\\docs_snegapi.md129.html"
       },
       {
        "name": "Объект IV8MDProperty",
        "childs": [
         {
          "name": "Свойство id",
          "childs": [],
          "helpId": 151,
          "path": "help\\docs_snegapi.md138.html"
         },
         {
          "name": "Метод name",
          "childs": [],
          "helpId": 152,
          "path": "help\\docs_snegapi.md139.html"
         },
         {
          "name": "Свойство description",
          "childs": [],
          "helpId": 153,
          "path": "help\\docs_snegapi.md140.html"
         },
         {
          "name": "Свойство category",
          "childs": [],
          "helpId": 154,
          "path": "help\\docs_snegapi.md141.html"
         }
        ],
        "helpId": 150,
        "path": "help\\docs_snegapi.md137.html"
       },
       {
        "name": "Объект IV8ExtProp",
        "childs": [
         {
          "name": "Свойство idData",
          "childs": [],
          "helpId": 156,
          "path": "help\\docs_snegapi.md143.html"
         },
         {
          "name": "Свойство idEditor",
          "childs": [],
          "helpId": 157,
          "path": "help\\docs_snegapi.md144.html"
         },
         {
          "name": "Свойство url",
          "childs": [],
          "helpId": 158,
          "path": "help\\docs_snegapi.md145.html"
         },
         {
          "name": "Свойство title",
          "childs": [],
          "helpId": 159,
          "path": "help\\docs_snegapi.md146.html"
         },
         {
          "name": "Свойство isReadOnly",
          "childs": [],
          "helpId": 160,
          "path": "help\\docs_snegapi.md147.html"
         },
         {
          "name": "Метод saveToFile",
          "childs": [],
          "helpId": 161,
          "path": "help\\docs_snegapi.md148.html"
         },
         {
          "name": "Метод loadFromFile",
          "childs": [],
          "helpId": 162,
          "path": "help\\docs_snegapi.md149.html"
         },
         {
          "name": "Метод getForm",
          "childs": [],
          "helpId": 163,
          "path": "help\\docs_snegapi.md150.html"
         }
        ],
        "helpId": 155,
        "path": "help\\docs_snegapi.md142.html"
       },
       {
        "name": "Объект ISnegopat",
        "childs": [
         {
          "name": "Метод activeTextWindow",
          "childs": [],
          "helpId": 165,
          "path": "help\\docs_snegapi.md152.html"
         },
         {
          "name": "Метод parseTemplateString",
          "childs": [],
          "helpId": 166,
          "path": "help\\docs_snegapi.md153.html"
         },
         {
          "name": "Метод showMethodsList",
          "childs": [],
          "helpId": 167,
          "path": "help\\docs_snegapi.md154.html"
         },
         {
          "name": "Метод showSmartBox",
          "childs": [],
          "helpId": 168,
          "path": "help\\docs_snegapi.md155.html"
         },
         {
          "name": "Метод showParams",
          "childs": [],
          "helpId": 169,
          "path": "help\\docs_snegapi.md156.html"
         },
         {
          "name": "Метод nextParams",
          "childs": [],
          "helpId": 170,
          "path": "help\\docs_snegapi.md157.html"
         },
         {
          "name": "Метод prevParams",
          "childs": [],
          "helpId": 171,
          "path": "help\\docs_snegapi.md158.html"
         },
         {
          "name": "Метод paramsTypes",
          "childs": [],
          "helpId": 172,
          "path": "help\\docs_snegapi.md159.html"
         },
         {
          "name": "Метод paramsPosition",
          "childs": [],
          "helpId": 173,
          "path": "help\\docs_snegapi.md160.html"
         },
         {
          "name": "Метод setParamType",
          "childs": [],
          "helpId": 174,
          "path": "help\\docs_snegapi.md161.html"
         },
         {
          "name": "Метод getHotWords",
          "childs": [],
          "helpId": 175,
          "path": "help\\docs_snegapi.md162.html"
         },
         {
          "name": "Метод setHotWords",
          "childs": [],
          "helpId": 176,
          "path": "help\\docs_snegapi.md163.html"
         },
         {
          "name": "Метод parseSources",
          "childs": [],
          "helpId": 177,
          "path": "help\\docs_snegapi.md164.html"
         },
         {
          "name": "Свойство v8types",
          "childs": [],
          "helpId": 178,
          "path": "help\\docs_snegapi.md165.html"
         },
         {
          "name": "Метод readTypeFile",
          "childs": [],
          "helpId": 179,
          "path": "help\\docs_snegapi.md166.html"
         },
         {
          "name": "Событие onChangeTextManager",
          "childs": [],
          "helpId": 180,
          "path": "help\\docs_snegapi.md167.html"
         },
         {
          "name": "Событие onProcessTemplate",
          "childs": [],
          "helpId": 181,
          "path": "help\\docs_snegapi.md168.html"
         },
         {
          "name": "Событие onShowParams",
          "childs": [],
          "helpId": 182,
          "path": "help\\docs_snegapi.md169.html"
         },
         {
          "name": "Событие onProcessInsert",
          "childs": [],
          "helpId": 183,
          "path": "help\\docs_snegapi.md170.html"
         }
        ],
        "helpId": 164,
        "path": "help\\docs_snegapi.md151.html"
       },
       {
        "name": "Объект IProcessTemplateParam",
        "childs": [
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 185,
          "path": "help\\docs_snegapi.md172.html"
         },
         {
          "name": "Свойство indent",
          "childs": [],
          "helpId": 186,
          "path": "help\\docs_snegapi.md173.html"
         },
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 187,
          "path": "help\\docs_snegapi.md174.html"
         },
         {
          "name": "Свойство cancel",
          "childs": [],
          "helpId": 188,
          "path": "help\\docs_snegapi.md175.html"
         }
        ],
        "helpId": 184,
        "path": "help\\docs_snegapi.md171.html"
       },
       {
        "name": "Объект IShowParamsData",
        "childs": [
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 190,
          "path": "help\\docs_snegapi.md177.html"
         },
         {
          "name": "Свойство src",
          "childs": [],
          "helpId": 191,
          "path": "help\\docs_snegapi.md178.html"
         },
         {
          "name": "Свойство typesCount",
          "childs": [],
          "helpId": 192,
          "path": "help\\docs_snegapi.md179.html"
         },
         {
          "name": "Метод typeName",
          "childs": [],
          "helpId": 193,
          "path": "help\\docs_snegapi.md180.html"
         },
         {
          "name": "Метод typeIsModule",
          "childs": [],
          "helpId": 194,
          "path": "help\\docs_snegapi.md181.html"
         },
         {
          "name": "Метод move",
          "childs": [],
          "helpId": 195,
          "path": "help\\docs_snegapi.md182.html"
         },
         {
          "name": "Метод remove",
          "childs": [],
          "helpId": 196,
          "path": "help\\docs_snegapi.md183.html"
         },
         {
          "name": "Метод insert",
          "childs": [],
          "helpId": 197,
          "path": "help\\docs_snegapi.md184.html"
         },
         {
          "name": "Метод addParamDescr",
          "childs": [],
          "helpId": 198,
          "path": "help\\docs_snegapi.md185.html"
         }
        ],
        "helpId": 189,
        "path": "help\\docs_snegapi.md176.html"
       },
       {
        "name": "Объект IGetInsertText",
        "childs": [
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 200,
          "path": "help\\docs_snegapi.md187.html"
         },
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 201,
          "path": "help\\docs_snegapi.md188.html"
         },
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 202,
          "path": "help\\docs_snegapi.md189.html"
         }
        ],
        "helpId": 199,
        "path": "help\\docs_snegapi.md186.html"
       },
       {
        "name": "Объект ITextWindow",
        "childs": [
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 204,
          "path": "help\\docs_snegapi.md191.html"
         },
         {
          "name": "Метод getSelection",
          "childs": [],
          "helpId": 205,
          "path": "help\\docs_snegapi.md192.html"
         },
         {
          "name": "Метод setSelection",
          "childs": [],
          "helpId": 206,
          "path": "help\\docs_snegapi.md193.html"
         },
         {
          "name": "Свойство selectedText",
          "childs": [],
          "helpId": 207,
          "path": "help\\docs_snegapi.md194.html"
         },
         {
          "name": "Метод getCaretPos",
          "childs": [],
          "helpId": 208,
          "path": "help\\docs_snegapi.md195.html"
         },
         {
          "name": "Метод setCaretPos",
          "childs": [],
          "helpId": 209,
          "path": "help\\docs_snegapi.md196.html"
         },
         {
          "name": "Свойство linesCount",
          "childs": [],
          "helpId": 210,
          "path": "help\\docs_snegapi.md197.html"
         },
         {
          "name": "Метод line",
          "childs": [],
          "helpId": 211,
          "path": "help\\docs_snegapi.md198.html"
         },
         {
          "name": "Свойство readOnly",
          "childs": [],
          "helpId": 212,
          "path": "help\\docs_snegapi.md199.html"
         },
         {
          "name": "Свойство extName",
          "childs": [],
          "helpId": 213,
          "path": "help\\docs_snegapi.md200.html"
         },
         {
          "name": "Свойство hwnd",
          "childs": [],
          "helpId": 214,
          "path": "help\\docs_snegapi.md201.html"
         },
         {
          "name": "Свойство mdCont",
          "childs": [],
          "helpId": 215,
          "path": "help\\docs_snegapi.md202.html"
         },
         {
          "name": "Свойство mdObj",
          "childs": [],
          "helpId": 216,
          "path": "help\\docs_snegapi.md203.html"
         },
         {
          "name": "Свойство mdProp",
          "childs": [],
          "helpId": 217,
          "path": "help\\docs_snegapi.md204.html"
         },
         {
          "name": "Свойство multyEdit",
          "childs": [],
          "helpId": 218,
          "path": "help\\docs_snegapi.md205.html"
         },
         {
          "name": "Свойство textMgr",
          "childs": [],
          "helpId": 219,
          "path": "help\\docs_snegapi.md206.html"
         },
         {
          "name": "Свойство extObject",
          "childs": [],
          "helpId": 220,
          "path": "help\\docs_snegapi.md207.html"
         },
         {
          "name": "Свойство textDocument",
          "childs": [],
          "helpId": 221,
          "path": "help\\docs_snegapi.md208.html"
         },
         {
          "name": "Свойство isAlive",
          "childs": [],
          "helpId": 222,
          "path": "help\\docs_snegapi.md209.html"
         },
         {
          "name": "Событие TextWindowClosed",
          "childs": [],
          "helpId": 223,
          "path": "help\\docs_snegapi.md210.html"
         }
        ],
        "helpId": 203,
        "path": "help\\docs_snegapi.md190.html"
       },
       {
        "name": "Объект ISelection",
        "childs": [],
        "helpId": 224,
        "path": "help\\docs_snegapi.md211.html"
       },
       {
        "name": "Объект IAddinMgr",
        "childs": [
         {
          "name": "Свойство count",
          "childs": [],
          "helpId": 226,
          "path": "help\\docs_snegapi.md213.html"
         },
         {
          "name": "Метод byUniqueName",
          "childs": [],
          "helpId": 227,
          "path": "help\\docs_snegapi.md214.html"
         },
         {
          "name": "Метод byFullPath",
          "childs": [],
          "helpId": 228,
          "path": "help\\docs_snegapi.md215.html"
         },
         {
          "name": "Метод byIdx",
          "childs": [],
          "helpId": 229,
          "path": "help\\docs_snegapi.md216.html"
         },
         {
          "name": "Свойство root",
          "childs": [],
          "helpId": 230,
          "path": "help\\docs_snegapi.md217.html"
         },
         {
          "name": "Метод loadAddin",
          "childs": [],
          "helpId": 231,
          "path": "help\\docs_snegapi.md218.html"
         },
         {
          "name": "Метод unloadAddin",
          "childs": [],
          "helpId": 232,
          "path": "help\\docs_snegapi.md219.html"
         },
         {
          "name": "Метод registerLoader",
          "childs": [],
          "helpId": 233,
          "path": "help\\docs_snegapi.md220.html"
         },
         {
          "name": "Метод getLoaderCommands",
          "childs": [],
          "helpId": 234,
          "path": "help\\docs_snegapi.md221.html"
         },
         {
          "name": "Метод selectAndLoad",
          "childs": [],
          "helpId": 235,
          "path": "help\\docs_snegapi.md222.html"
         },
         {
          "name": "Метод isAddinUnloadable",
          "childs": [],
          "helpId": 236,
          "path": "help\\docs_snegapi.md223.html"
         }
        ],
        "helpId": 225,
        "path": "help\\docs_snegapi.md212.html"
       },
       {
        "name": "Объект IAddin",
        "childs": [
         {
          "name": "Свойство displayName",
          "childs": [],
          "helpId": 238,
          "path": "help\\docs_snegapi.md225.html"
         },
         {
          "name": "Свойство uniqueName",
          "childs": [],
          "helpId": 239,
          "path": "help\\docs_snegapi.md226.html"
         },
         {
          "name": "Свойство fullPath",
          "childs": [],
          "helpId": 240,
          "path": "help\\docs_snegapi.md227.html"
         },
         {
          "name": "Свойство object",
          "childs": [],
          "helpId": 241,
          "path": "help\\docs_snegapi.md228.html"
         },
         {
          "name": "Метод macroses",
          "childs": [],
          "helpId": 242,
          "path": "help\\docs_snegapi.md229.html"
         },
         {
          "name": "Метод invokeMacros",
          "childs": [],
          "helpId": 243,
          "path": "help\\docs_snegapi.md230.html"
         },
         {
          "name": "Свойство group",
          "childs": [],
          "helpId": 244,
          "path": "help\\docs_snegapi.md231.html"
         }
        ],
        "helpId": 237,
        "path": "help\\docs_snegapi.md224.html"
       },
       {
        "name": "Объект IAddinGroup",
        "childs": [
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 246,
          "path": "help\\docs_snegapi.md233.html"
         },
         {
          "name": "Свойство parent",
          "childs": [],
          "helpId": 247,
          "path": "help\\docs_snegapi.md234.html"
         },
         {
          "name": "Свойство child",
          "childs": [],
          "helpId": 248,
          "path": "help\\docs_snegapi.md235.html"
         },
         {
          "name": "Свойство next",
          "childs": [],
          "helpId": 249,
          "path": "help\\docs_snegapi.md236.html"
         },
         {
          "name": "Свойство addinsCount",
          "childs": [],
          "helpId": 250,
          "path": "help\\docs_snegapi.md237.html"
         },
         {
          "name": "Метод addin",
          "childs": [],
          "helpId": 251,
          "path": "help\\docs_snegapi.md238.html"
         },
         {
          "name": "Метод addGroup",
          "childs": [],
          "helpId": 252,
          "path": "help\\docs_snegapi.md239.html"
         }
        ],
        "helpId": 245,
        "path": "help\\docs_snegapi.md232.html"
       },
       {
        "name": "Объект IProfileStore",
        "childs": [
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 254,
          "path": "help\\docs_snegapi.md241.html"
         },
         {
          "name": "Метод createValue",
          "childs": [],
          "helpId": 255,
          "path": "help\\docs_snegapi.md242.html"
         },
         {
          "name": "Метод getValue",
          "childs": [],
          "helpId": 256,
          "path": "help\\docs_snegapi.md243.html"
         },
         {
          "name": "Метод setValue",
          "childs": [],
          "helpId": 257,
          "path": "help\\docs_snegapi.md244.html"
         },
         {
          "name": "Свойство valuesCount",
          "childs": [],
          "helpId": 258,
          "path": "help\\docs_snegapi.md245.html"
         },
         {
          "name": "Метод valueName",
          "childs": [],
          "helpId": 259,
          "path": "help\\docs_snegapi.md246.html"
         },
         {
          "name": "Метод getValueAt",
          "childs": [],
          "helpId": 260,
          "path": "help\\docs_snegapi.md247.html"
         },
         {
          "name": "Метод setValueAt",
          "childs": [],
          "helpId": 261,
          "path": "help\\docs_snegapi.md248.html"
         },
         {
          "name": "Метод deleteValue",
          "childs": [],
          "helpId": 262,
          "path": "help\\docs_snegapi.md249.html"
         },
         {
          "name": "Метод deleteValueAt",
          "childs": [],
          "helpId": 263,
          "path": "help\\docs_snegapi.md250.html"
         },
         {
          "name": "Метод createFolder",
          "childs": [],
          "helpId": 264,
          "path": "help\\docs_snegapi.md251.html"
         },
         {
          "name": "Свойство foldersCount",
          "childs": [],
          "helpId": 265,
          "path": "help\\docs_snegapi.md252.html"
         },
         {
          "name": "Метод getFolder",
          "childs": [],
          "helpId": 266,
          "path": "help\\docs_snegapi.md253.html"
         },
         {
          "name": "Метод getFolderAt",
          "childs": [],
          "helpId": 267,
          "path": "help\\docs_snegapi.md254.html"
         },
         {
          "name": "Метод deleteFolder",
          "childs": [],
          "helpId": 268,
          "path": "help\\docs_snegapi.md255.html"
         },
         {
          "name": "Метод deleteFolderAt",
          "childs": [],
          "helpId": 269,
          "path": "help\\docs_snegapi.md256.html"
         }
        ],
        "helpId": 253,
        "path": "help\\docs_snegapi.md240.html"
       },
       {
        "name": "Объект ISelfScript",
        "childs": [
         {
          "name": "Свойство uniqueName",
          "childs": [],
          "helpId": 271,
          "path": "help\\docs_snegapi.md258.html"
         },
         {
          "name": "Свойство displayName",
          "childs": [],
          "helpId": 272,
          "path": "help\\docs_snegapi.md259.html"
         },
         {
          "name": "Свойство fullPath",
          "childs": [],
          "helpId": 273,
          "path": "help\\docs_snegapi.md260.html"
         },
         {
          "name": "Метод addNamedItem",
          "childs": [],
          "helpId": 274,
          "path": "help\\docs_snegapi.md261.html"
         },
         {
          "name": "Свойство self",
          "childs": [],
          "helpId": 275,
          "path": "help\\docs_snegapi.md262.html"
         }
        ],
        "helpId": 270,
        "path": "help\\docs_snegapi.md257.html"
       },
       {
        "name": "Объект IHotKeys",
        "childs": [
         {
          "name": "Метод item",
          "childs": [],
          "helpId": 277,
          "path": "help\\docs_snegapi.md264.html"
         },
         {
          "name": "Свойство count",
          "childs": [],
          "helpId": 278,
          "path": "help\\docs_snegapi.md265.html"
         },
         {
          "name": "Метод remove",
          "childs": [],
          "helpId": 279,
          "path": "help\\docs_snegapi.md266.html"
         },
         {
          "name": "Метод add",
          "childs": [],
          "helpId": 280,
          "path": "help\\docs_snegapi.md267.html"
         },
         {
          "name": "Метод clearAll",
          "childs": [],
          "helpId": 281,
          "path": "help\\docs_snegapi.md268.html"
         },
         {
          "name": "Метод addTemp",
          "childs": [],
          "helpId": 282,
          "path": "help\\docs_snegapi.md269.html"
         },
         {
          "name": "Метод addTempFunction",
          "childs": [],
          "helpId": 283,
          "path": "help\\docs_snegapi.md270.html"
         },
         {
          "name": "Метод removeTemp",
          "childs": [],
          "helpId": 284,
          "path": "help\\docs_snegapi.md271.html"
         }
        ],
        "helpId": 276,
        "path": "help\\docs_snegapi.md263.html"
       },
       {
        "name": "Объект IHotKey",
        "childs": [
         {
          "name": "Свойство presentation",
          "childs": [],
          "helpId": 286,
          "path": "help\\docs_snegapi.md273.html"
         },
         {
          "name": "Свойство addin",
          "childs": [],
          "helpId": 287,
          "path": "help\\docs_snegapi.md274.html"
         },
         {
          "name": "Свойство macros",
          "childs": [],
          "helpId": 288,
          "path": "help\\docs_snegapi.md275.html"
         },
         {
          "name": "Свойство key",
          "childs": [],
          "helpId": 289,
          "path": "help\\docs_snegapi.md276.html"
         },
         {
          "name": "Метод setCommand",
          "childs": [],
          "helpId": 290,
          "path": "help\\docs_snegapi.md277.html"
         }
        ],
        "helpId": 285,
        "path": "help\\docs_snegapi.md272.html"
       },
       {
        "name": "Объект ICmdUpdateResult",
        "childs": [
         {
          "name": "Свойство enabled",
          "childs": [],
          "helpId": 292,
          "path": "help\\docs_snegapi.md279.html"
         },
         {
          "name": "Свойство checked",
          "childs": [],
          "helpId": 293,
          "path": "help\\docs_snegapi.md280.html"
         },
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 294,
          "path": "help\\docs_snegapi.md281.html"
         },
         {
          "name": "Свойство description",
          "childs": [],
          "helpId": 295,
          "path": "help\\docs_snegapi.md282.html"
         },
         {
          "name": "Свойство tooltip",
          "childs": [],
          "helpId": 296,
          "path": "help\\docs_snegapi.md283.html"
         },
         {
          "name": "Свойство subCommands",
          "childs": [],
          "helpId": 297,
          "path": "help\\docs_snegapi.md284.html"
         }
        ],
        "helpId": 291,
        "path": "help\\docs_snegapi.md278.html"
       },
       {
        "name": "Объект IV8Files",
        "childs": [
         {
          "name": "Метод open",
          "childs": [],
          "helpId": 299,
          "path": "help\\docs_snegapi.md286.html"
         },
         {
          "name": "Метод createMemoryFile",
          "childs": [],
          "helpId": 300,
          "path": "help\\docs_snegapi.md287.html"
         },
         {
          "name": "Метод createTempFile",
          "childs": [],
          "helpId": 301,
          "path": "help\\docs_snegapi.md288.html"
         },
         {
          "name": "Метод attachStorage",
          "childs": [],
          "helpId": 302,
          "path": "help\\docs_snegapi.md289.html"
         },
         {
          "name": "Метод newMemoryBuffer",
          "childs": [],
          "helpId": 303,
          "path": "help\\docs_snegapi.md290.html"
         }
        ],
        "helpId": 298,
        "path": "help\\docs_snegapi.md285.html"
       },
       {
        "name": "Объект IV8DataFile",
        "childs": [
         {
          "name": "Метод read",
          "childs": [],
          "helpId": 305,
          "path": "help\\docs_snegapi.md292.html"
         },
         {
          "name": "Метод write",
          "childs": [],
          "helpId": 306,
          "path": "help\\docs_snegapi.md293.html"
         },
         {
          "name": "Метод seek",
          "childs": [],
          "helpId": 307,
          "path": "help\\docs_snegapi.md294.html"
         },
         {
          "name": "Метод getString",
          "childs": [],
          "helpId": 308,
          "path": "help\\docs_snegapi.md295.html"
         },
         {
          "name": "Метод putString",
          "childs": [],
          "helpId": 309,
          "path": "help\\docs_snegapi.md296.html"
         },
         {
          "name": "Метод flush",
          "childs": [],
          "helpId": 310,
          "path": "help\\docs_snegapi.md297.html"
         },
         {
          "name": "Метод setEOF",
          "childs": [],
          "helpId": 311,
          "path": "help\\docs_snegapi.md298.html"
         },
         {
          "name": "Свойство url",
          "childs": [],
          "helpId": 312,
          "path": "help\\docs_snegapi.md299.html"
         },
         {
          "name": "Метод close",
          "childs": [],
          "helpId": 313,
          "path": "help\\docs_snegapi.md300.html"
         }
        ],
        "helpId": 304,
        "path": "help\\docs_snegapi.md291.html"
       },
       {
        "name": "Объект IV8StorageFile",
        "childs": [
         {
          "name": "Метод files",
          "childs": [],
          "helpId": 315,
          "path": "help\\docs_snegapi.md302.html"
         },
         {
          "name": "Метод open",
          "childs": [],
          "helpId": 316,
          "path": "help\\docs_snegapi.md303.html"
         },
         {
          "name": "Метод rename",
          "childs": [],
          "helpId": 317,
          "path": "help\\docs_snegapi.md304.html"
         },
         {
          "name": "Метод remove",
          "childs": [],
          "helpId": 318,
          "path": "help\\docs_snegapi.md305.html"
         }
        ],
        "helpId": 314,
        "path": "help\\docs_snegapi.md301.html"
       },
       {
        "name": "Объект IV8Lexer",
        "childs": [
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 320,
          "path": "help\\docs_snegapi.md307.html"
         },
         {
          "name": "Свойство reStream",
          "childs": [],
          "helpId": 321,
          "path": "help\\docs_snegapi.md308.html"
         },
         {
          "name": "Свойство lexemCount",
          "childs": [],
          "helpId": 322,
          "path": "help\\docs_snegapi.md309.html"
         },
         {
          "name": "Метод lexem",
          "childs": [],
          "helpId": 323,
          "path": "help\\docs_snegapi.md310.html"
         },
         {
          "name": "Свойство namesCount",
          "childs": [],
          "helpId": 324,
          "path": "help\\docs_snegapi.md311.html"
         },
         {
          "name": "Метод name",
          "childs": [],
          "helpId": 325,
          "path": "help\\docs_snegapi.md312.html"
         },
         {
          "name": "Метод idxOfName",
          "childs": [],
          "helpId": 326,
          "path": "help\\docs_snegapi.md313.html"
         },
         {
          "name": "Метод posToLexem",
          "childs": [],
          "helpId": 327,
          "path": "help\\docs_snegapi.md314.html"
         },
         {
          "name": "Метод strNameIdx",
          "childs": [],
          "helpId": 328,
          "path": "help\\docs_snegapi.md315.html"
         }
        ],
        "helpId": 319,
        "path": "help\\docs_snegapi.md306.html"
       },
       {
        "name": "Объект ILexem",
        "childs": [
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 330,
          "path": "help\\docs_snegapi.md317.html"
         },
         {
          "name": "Свойство start",
          "childs": [],
          "helpId": 331,
          "path": "help\\docs_snegapi.md318.html"
         },
         {
          "name": "Свойство length",
          "childs": [],
          "helpId": 332,
          "path": "help\\docs_snegapi.md319.html"
         },
         {
          "name": "Свойство line",
          "childs": [],
          "helpId": 333,
          "path": "help\\docs_snegapi.md320.html"
         },
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 334,
          "path": "help\\docs_snegapi.md321.html"
         }
        ],
        "helpId": 329,
        "path": "help\\docs_snegapi.md316.html"
       },
       {
        "name": "Объект IV8Windows",
        "childs": [
         {
          "name": "Свойство mainView",
          "childs": [],
          "helpId": 336,
          "path": "help\\docs_snegapi.md323.html"
         },
         {
          "name": "Свойство mdiView",
          "childs": [],
          "helpId": 337,
          "path": "help\\docs_snegapi.md324.html"
         },
         {
          "name": "Свойство modalMode",
          "childs": [],
          "helpId": 338,
          "path": "help\\docs_snegapi.md325.html"
         },
         {
          "name": "Свойство caption",
          "childs": [],
          "helpId": 339,
          "path": "help\\docs_snegapi.md326.html"
         },
         {
          "name": "Свойство mainTitle",
          "childs": [],
          "helpId": 340,
          "path": "help\\docs_snegapi.md327.html"
         },
         {
          "name": "Свойство additionalTitle",
          "childs": [],
          "helpId": 341,
          "path": "help\\docs_snegapi.md328.html"
         },
         {
          "name": "Свойство propsVisible",
          "childs": [],
          "helpId": 342,
          "path": "help\\docs_snegapi.md329.html"
         },
         {
          "name": "Метод getActiveView",
          "childs": [],
          "helpId": 343,
          "path": "help\\docs_snegapi.md330.html"
         },
         {
          "name": "Метод getFocusedView",
          "childs": [],
          "helpId": 344,
          "path": "help\\docs_snegapi.md331.html"
         },
         {
          "name": "Событие onDoModal",
          "childs": [],
          "helpId": 345,
          "path": "help\\docs_snegapi.md332.html"
         },
         {
          "name": "Событие onMessageBox",
          "childs": [],
          "helpId": 346,
          "path": "help\\docs_snegapi.md333.html"
         },
         {
          "name": "Событие onChangeTitles",
          "childs": [],
          "helpId": 347,
          "path": "help\\docs_snegapi.md334.html"
         }
        ],
        "helpId": 335,
        "path": "help\\docs_snegapi.md322.html"
       },
       {
        "name": "Объект IMsgBoxHook",
        "childs": [
         {
          "name": "Свойство caption",
          "childs": [],
          "helpId": 349,
          "path": "help\\docs_snegapi.md336.html"
         },
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 350,
          "path": "help\\docs_snegapi.md337.html"
         },
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 351,
          "path": "help\\docs_snegapi.md338.html"
         },
         {
          "name": "Свойство timeout",
          "childs": [],
          "helpId": 352,
          "path": "help\\docs_snegapi.md339.html"
         },
         {
          "name": "Свойство cancel",
          "childs": [],
          "helpId": 353,
          "path": "help\\docs_snegapi.md340.html"
         },
         {
          "name": "Свойство result",
          "childs": [],
          "helpId": 354,
          "path": "help\\docs_snegapi.md341.html"
         }
        ],
        "helpId": 348,
        "path": "help\\docs_snegapi.md335.html"
       },
       {
        "name": "Объект ISetMainTitleHook",
        "childs": [
         {
          "name": "Свойство mainTitle",
          "childs": [],
          "helpId": 356,
          "path": "help\\docs_snegapi.md343.html"
         },
         {
          "name": "Свойство additionalTitle",
          "childs": [],
          "helpId": 357,
          "path": "help\\docs_snegapi.md344.html"
         },
         {
          "name": "Свойство cancel",
          "childs": [],
          "helpId": 358,
          "path": "help\\docs_snegapi.md345.html"
         }
        ],
        "helpId": 355,
        "path": "help\\docs_snegapi.md342.html"
       },
       {
        "name": "Объект IDoModalHook",
        "childs": [
         {
          "name": "Свойство caption",
          "childs": [],
          "helpId": 360,
          "path": "help\\docs_snegapi.md347.html"
         },
         {
          "name": "Свойство form",
          "childs": [],
          "helpId": 361,
          "path": "help\\docs_snegapi.md348.html"
         },
         {
          "name": "Свойство cancel",
          "childs": [],
          "helpId": 362,
          "path": "help\\docs_snegapi.md349.html"
         },
         {
          "name": "Свойство result",
          "childs": [],
          "helpId": 363,
          "path": "help\\docs_snegapi.md350.html"
         },
         {
          "name": "Свойство stage",
          "childs": [],
          "helpId": 364,
          "path": "help\\docs_snegapi.md351.html"
         }
        ],
        "helpId": 359,
        "path": "help\\docs_snegapi.md346.html"
       },
       {
        "name": "Объект IV8View",
        "childs": [
         {
          "name": "Свойство id",
          "childs": [],
          "helpId": 366,
          "path": "help\\docs_snegapi.md353.html"
         },
         {
          "name": "Свойство title",
          "childs": [],
          "helpId": 367,
          "path": "help\\docs_snegapi.md354.html"
         },
         {
          "name": "Свойство hwnd",
          "childs": [],
          "helpId": 368,
          "path": "help\\docs_snegapi.md355.html"
         },
         {
          "name": "Метод position",
          "childs": [],
          "helpId": 369,
          "path": "help\\docs_snegapi.md356.html"
         },
         {
          "name": "Свойство parent",
          "childs": [],
          "helpId": 370,
          "path": "help\\docs_snegapi.md357.html"
         },
         {
          "name": "Метод enumChilds",
          "childs": [],
          "helpId": 371,
          "path": "help\\docs_snegapi.md358.html"
         },
         {
          "name": "Метод merge",
          "childs": [],
          "helpId": 372,
          "path": "help\\docs_snegapi.md359.html"
         },
         {
          "name": "Свойство isContainer",
          "childs": [],
          "helpId": 373,
          "path": "help\\docs_snegapi.md360.html"
         },
         {
          "name": "Свойство wndClass",
          "childs": [],
          "helpId": 374,
          "path": "help\\docs_snegapi.md361.html"
         },
         {
          "name": "Свойство visible",
          "childs": [],
          "helpId": 375,
          "path": "help\\docs_snegapi.md362.html"
         },
         {
          "name": "Свойство activeChild",
          "childs": [],
          "helpId": 376,
          "path": "help\\docs_snegapi.md363.html"
         },
         {
          "name": "Метод activate",
          "childs": [],
          "helpId": 377,
          "path": "help\\docs_snegapi.md364.html"
         },
         {
          "name": "Метод close",
          "childs": [],
          "helpId": 378,
          "path": "help\\docs_snegapi.md365.html"
         },
         {
          "name": "Метод getCmdState",
          "childs": [],
          "helpId": 379,
          "path": "help\\docs_snegapi.md366.html"
         },
         {
          "name": "Метод sendCommand",
          "childs": [],
          "helpId": 380,
          "path": "help\\docs_snegapi.md367.html"
         },
         {
          "name": "Метод getDocument",
          "childs": [],
          "helpId": 381,
          "path": "help\\docs_snegapi.md368.html"
         },
         {
          "name": "Метод getObject",
          "childs": [],
          "helpId": 382,
          "path": "help\\docs_snegapi.md369.html"
         },
         {
          "name": "Метод getInternalForm",
          "childs": [],
          "helpId": 383,
          "path": "help\\docs_snegapi.md370.html"
         },
         {
          "name": "Свойство mdObj",
          "childs": [],
          "helpId": 384,
          "path": "help\\docs_snegapi.md371.html"
         },
         {
          "name": "Свойство mdProp",
          "childs": [],
          "helpId": 385,
          "path": "help\\docs_snegapi.md372.html"
         },
         {
          "name": "Свойство icon",
          "childs": [],
          "helpId": 386,
          "path": "help\\docs_snegapi.md373.html"
         }
        ],
        "helpId": 365,
        "path": "help\\docs_snegapi.md352.html"
       },
       {
        "name": "Перечисление ViewPlacements",
        "childs": [],
        "helpId": 387,
        "path": "help\\docs_snegapi.md374.html"
       },
       {
        "name": "Объект IV8ViewPosition",
        "childs": [
         {
          "name": "Свойство state",
          "childs": [],
          "helpId": 389,
          "path": "help\\docs_snegapi.md376.html"
         },
         {
          "name": "Свойство placement",
          "childs": [],
          "helpId": 390,
          "path": "help\\docs_snegapi.md377.html"
         },
         {
          "name": "Свойство dockRow",
          "childs": [],
          "helpId": 391,
          "path": "help\\docs_snegapi.md378.html"
         },
         {
          "name": "Свойство dockRowPos",
          "childs": [],
          "helpId": 392,
          "path": "help\\docs_snegapi.md379.html"
         },
         {
          "name": "Свойство dockWidth",
          "childs": [],
          "helpId": 393,
          "path": "help\\docs_snegapi.md380.html"
         },
         {
          "name": "Свойство dockHeight",
          "childs": [],
          "helpId": 394,
          "path": "help\\docs_snegapi.md381.html"
         },
         {
          "name": "Свойство isMergeable",
          "childs": [],
          "helpId": 395,
          "path": "help\\docs_snegapi.md382.html"
         },
         {
          "name": "Свойство floatLeft",
          "childs": [],
          "helpId": 396,
          "path": "help\\docs_snegapi.md383.html"
         },
         {
          "name": "Свойство floatTop",
          "childs": [],
          "helpId": 397,
          "path": "help\\docs_snegapi.md384.html"
         },
         {
          "name": "Свойство floatRight",
          "childs": [],
          "helpId": 398,
          "path": "help\\docs_snegapi.md385.html"
         },
         {
          "name": "Свойство floatBottom",
          "childs": [],
          "helpId": 399,
          "path": "help\\docs_snegapi.md386.html"
         },
         {
          "name": "Свойство mdiLeft",
          "childs": [],
          "helpId": 400,
          "path": "help\\docs_snegapi.md387.html"
         },
         {
          "name": "Свойство mdiRight",
          "childs": [],
          "helpId": 401,
          "path": "help\\docs_snegapi.md388.html"
         },
         {
          "name": "Свойство mdiBottom",
          "childs": [],
          "helpId": 402,
          "path": "help\\docs_snegapi.md389.html"
         },
         {
          "name": "Свойство mdiLeft",
          "childs": [],
          "helpId": 403,
          "path": "help\\docs_snegapi.md390.html"
         },
         {
          "name": "Свойство mdiMax",
          "childs": [],
          "helpId": 404,
          "path": "help\\docs_snegapi.md391.html"
         },
         {
          "name": "Свойство hiddenWidth",
          "childs": [],
          "helpId": 405,
          "path": "help\\docs_snegapi.md392.html"
         },
         {
          "name": "Свойство hiddenHeight",
          "childs": [],
          "helpId": 406,
          "path": "help\\docs_snegapi.md393.html"
         },
         {
          "name": "Свойство possibleStates",
          "childs": [],
          "helpId": 407,
          "path": "help\\docs_snegapi.md394.html"
         },
         {
          "name": "Свойство possiblePlacements",
          "childs": [],
          "helpId": 408,
          "path": "help\\docs_snegapi.md395.html"
         },
         {
          "name": "Свойство isDockable",
          "childs": [],
          "helpId": 409,
          "path": "help\\docs_snegapi.md396.html"
         }
        ],
        "helpId": 388,
        "path": "help\\docs_snegapi.md375.html"
       },
       {
        "name": "Объект IV8ViewList",
        "childs": [
         {
          "name": "Свойство count",
          "childs": [],
          "helpId": 411,
          "path": "help\\docs_snegapi.md398.html"
         },
         {
          "name": "Метод item",
          "childs": [],
          "helpId": 412,
          "path": "help\\docs_snegapi.md399.html"
         }
        ],
        "helpId": 410,
        "path": "help\\docs_snegapi.md397.html"
       },
       {
        "name": "Объект IViewDocument",
        "childs": [
         {
          "name": "Свойство path",
          "childs": [],
          "helpId": 414,
          "path": "help\\docs_snegapi.md401.html"
         },
         {
          "name": "Свойство isReadOnly",
          "childs": [],
          "helpId": 415,
          "path": "help\\docs_snegapi.md402.html"
         },
         {
          "name": "Свойство isModified",
          "childs": [],
          "helpId": 416,
          "path": "help\\docs_snegapi.md403.html"
         },
         {
          "name": "Свойство isConfigMode",
          "childs": [],
          "helpId": 417,
          "path": "help\\docs_snegapi.md404.html"
         },
         {
          "name": "Свойство title",
          "childs": [],
          "helpId": 418,
          "path": "help\\docs_snegapi.md405.html"
         },
         {
          "name": "Свойство key",
          "childs": [],
          "helpId": 419,
          "path": "help\\docs_snegapi.md406.html"
         },
         {
          "name": "Свойство kind",
          "childs": [],
          "helpId": 420,
          "path": "help\\docs_snegapi.md407.html"
         },
         {
          "name": "Метод enumViews",
          "childs": [],
          "helpId": 421,
          "path": "help\\docs_snegapi.md408.html"
         }
        ],
        "helpId": 413,
        "path": "help\\docs_snegapi.md400.html"
       },
       {
        "name": "Объект IV8Debugger",
        "childs": [
         {
          "name": "Метод eval",
          "childs": [],
          "helpId": 423,
          "path": "help\\docs_snegapi.md410.html"
         }
        ],
        "helpId": 422,
        "path": "help\\docs_snegapi.md409.html"
       },
       {
        "name": "Объект IDebugEvalResult",
        "childs": [
         {
          "name": "Свойство sucessed",
          "childs": [],
          "helpId": 425,
          "path": "help\\docs_snegapi.md412.html"
         },
         {
          "name": "Свойство value",
          "childs": [],
          "helpId": 426,
          "path": "help\\docs_snegapi.md413.html"
         },
         {
          "name": "Свойство typeCode",
          "childs": [],
          "helpId": 427,
          "path": "help\\docs_snegapi.md414.html"
         },
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 428,
          "path": "help\\docs_snegapi.md415.html"
         },
         {
          "name": "Свойство propCount",
          "childs": [],
          "helpId": 429,
          "path": "help\\docs_snegapi.md416.html"
         },
         {
          "name": "Метод prop",
          "childs": [],
          "helpId": 430,
          "path": "help\\docs_snegapi.md417.html"
         }
        ],
        "helpId": 424,
        "path": "help\\docs_snegapi.md411.html"
       },
       {
        "name": "Объект IDebugEvalProp",
        "childs": [
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 432,
          "path": "help\\docs_snegapi.md419.html"
         },
         {
          "name": "Свойство value",
          "childs": [],
          "helpId": 433,
          "path": "help\\docs_snegapi.md420.html"
         },
         {
          "name": "Свойство typeCode",
          "childs": [],
          "helpId": 434,
          "path": "help\\docs_snegapi.md421.html"
         },
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 435,
          "path": "help\\docs_snegapi.md422.html"
         },
         {
          "name": "Свойство expandable",
          "childs": [],
          "helpId": 436,
          "path": "help\\docs_snegapi.md423.html"
         }
        ],
        "helpId": 431,
        "path": "help\\docs_snegapi.md418.html"
       },
       {
        "name": "Объект IV8Form",
        "childs": [
         {
          "name": "Свойство controlsCount",
          "childs": [],
          "helpId": 438,
          "path": "help\\docs_snegapi.md425.html"
         },
         {
          "name": "Метод getControl",
          "childs": [],
          "helpId": 439,
          "path": "help\\docs_snegapi.md426.html"
         },
         {
          "name": "Свойство trapDialogEvents",
          "childs": [],
          "helpId": 440,
          "path": "help\\docs_snegapi.md427.html"
         },
         {
          "name": "Метод sendEvent",
          "childs": [],
          "helpId": 441,
          "path": "help\\docs_snegapi.md428.html"
         },
         {
          "name": "Метод getCmdState",
          "childs": [],
          "helpId": 442,
          "path": "help\\docs_snegapi.md429.html"
         },
         {
          "name": "Метод sendCommand",
          "childs": [],
          "helpId": 443,
          "path": "help\\docs_snegapi.md430.html"
         },
         {
          "name": "Метод getCtrlCmdState",
          "childs": [],
          "helpId": 444,
          "path": "help\\docs_snegapi.md431.html"
         },
         {
          "name": "Метод sendCtrlCommand",
          "childs": [],
          "helpId": 445,
          "path": "help\\docs_snegapi.md432.html"
         },
         {
          "name": "Свойство activeControl",
          "childs": [],
          "helpId": 446,
          "path": "help\\docs_snegapi.md433.html"
         }
        ],
        "helpId": 437,
        "path": "help\\docs_snegapi.md424.html"
       },
       {
        "name": "Объект IV8Control",
        "childs": [
         {
          "name": "Свойство value",
          "childs": [],
          "helpId": 448,
          "path": "help\\docs_snegapi.md435.html"
         },
         {
          "name": "Свойство id",
          "childs": [],
          "helpId": 449,
          "path": "help\\docs_snegapi.md436.html"
         },
         {
          "name": "Свойство name",
          "childs": [],
          "helpId": 450,
          "path": "help\\docs_snegapi.md437.html"
         },
         {
          "name": "Свойство hwnd",
          "childs": [],
          "helpId": 451,
          "path": "help\\docs_snegapi.md438.html"
         },
         {
          "name": "Свойство extInterface",
          "childs": [],
          "helpId": 452,
          "path": "help\\docs_snegapi.md439.html"
         },
         {
          "name": "Свойство props",
          "childs": [],
          "helpId": 453,
          "path": "help\\docs_snegapi.md440.html"
         }
        ],
        "helpId": 447,
        "path": "help\\docs_snegapi.md434.html"
       },
       {
        "name": "Объект IGridCtrl",
        "childs": [
         {
          "name": "Свойство dataSource",
          "childs": [],
          "helpId": 455,
          "path": "help\\docs_snegapi.md442.html"
         },
         {
          "name": "Свойство columnCount",
          "childs": [],
          "helpId": 456,
          "path": "help\\docs_snegapi.md443.html"
         },
         {
          "name": "Свойство currentRow",
          "childs": [],
          "helpId": 457,
          "path": "help\\docs_snegapi.md444.html"
         },
         {
          "name": "Свойство currentColID",
          "childs": [],
          "helpId": 458,
          "path": "help\\docs_snegapi.md445.html"
         },
         {
          "name": "Метод isExpanded",
          "childs": [],
          "helpId": 459,
          "path": "help\\docs_snegapi.md446.html"
         },
         {
          "name": "Метод expand",
          "childs": [],
          "helpId": 460,
          "path": "help\\docs_snegapi.md447.html"
         },
         {
          "name": "Метод isCellChecked",
          "childs": [],
          "helpId": 461,
          "path": "help\\docs_snegapi.md448.html"
         },
         {
          "name": "Метод checkCell",
          "childs": [],
          "helpId": 462,
          "path": "help\\docs_snegapi.md449.html"
         }
        ],
        "helpId": 454,
        "path": "help\\docs_snegapi.md441.html"
       },
       {
        "name": "Объект ITabPanel",
        "childs": [
         {
          "name": "Свойство pages",
          "childs": [],
          "helpId": 464,
          "path": "help\\docs_snegapi.md451.html"
         },
         {
          "name": "Свойство activePage",
          "childs": [],
          "helpId": 465,
          "path": "help\\docs_snegapi.md452.html"
         }
        ],
        "helpId": 463,
        "path": "help\\docs_snegapi.md450.html"
       },
       {
        "name": "Объект IDataSource",
        "childs": [
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 467,
          "path": "help\\docs_snegapi.md454.html"
         },
         {
          "name": "Свойство hasCellAppearance",
          "childs": [],
          "helpId": 468,
          "path": "help\\docs_snegapi.md455.html"
         },
         {
          "name": "Свойство root",
          "childs": [],
          "helpId": 469,
          "path": "help\\docs_snegapi.md456.html"
         }
        ],
        "helpId": 466,
        "path": "help\\docs_snegapi.md453.html"
       },
       {
        "name": "Объект IDataRow",
        "childs": [
         {
          "name": "Свойство owner",
          "childs": [],
          "helpId": 471,
          "path": "help\\docs_snegapi.md458.html"
         },
         {
          "name": "Свойство parent",
          "childs": [],
          "helpId": 472,
          "path": "help\\docs_snegapi.md459.html"
         },
         {
          "name": "Свойство firstChild",
          "childs": [],
          "helpId": 473,
          "path": "help\\docs_snegapi.md460.html"
         },
         {
          "name": "Свойство lastChild",
          "childs": [],
          "helpId": 474,
          "path": "help\\docs_snegapi.md461.html"
         },
         {
          "name": "Свойство next",
          "childs": [],
          "helpId": 475,
          "path": "help\\docs_snegapi.md462.html"
         },
         {
          "name": "Свойство prev",
          "childs": [],
          "helpId": 476,
          "path": "help\\docs_snegapi.md463.html"
         },
         {
          "name": "Метод getCellValue",
          "childs": [],
          "helpId": 477,
          "path": "help\\docs_snegapi.md464.html"
         },
         {
          "name": "Метод getCellAppearance",
          "childs": [],
          "helpId": 478,
          "path": "help\\docs_snegapi.md465.html"
         }
        ],
        "helpId": 470,
        "path": "help\\docs_snegapi.md457.html"
       },
       {
        "name": "Объект ICellAppearance",
        "childs": [
         {
          "name": "Свойство text",
          "childs": [],
          "helpId": 480,
          "path": "help\\docs_snegapi.md467.html"
         },
         {
          "name": "Свойство checked",
          "childs": [],
          "helpId": 481,
          "path": "help\\docs_snegapi.md468.html"
         },
         {
          "name": "Свойство picture",
          "childs": [],
          "helpId": 482,
          "path": "help\\docs_snegapi.md469.html"
         },
         {
          "name": "Свойство addPicture",
          "childs": [],
          "helpId": 483,
          "path": "help\\docs_snegapi.md470.html"
         },
         {
          "name": "Свойство value",
          "childs": [],
          "helpId": 484,
          "path": "help\\docs_snegapi.md471.html"
         }
        ],
        "helpId": 479,
        "path": "help\\docs_snegapi.md466.html"
       },
       {
        "name": "Объект IObjectProperties",
        "childs": [
         {
          "name": "Свойство count",
          "childs": [],
          "helpId": 486,
          "path": "help\\docs_snegapi.md473.html"
         },
         {
          "name": "Метод propName",
          "childs": [],
          "helpId": 487,
          "path": "help\\docs_snegapi.md474.html"
         },
         {
          "name": "Метод getValue",
          "childs": [],
          "helpId": 488,
          "path": "help\\docs_snegapi.md475.html"
         },
         {
          "name": "Метод setValue",
          "childs": [],
          "helpId": 489,
          "path": "help\\docs_snegapi.md476.html"
         },
         {
          "name": "Метод activateProperty",
          "childs": [],
          "helpId": 490,
          "path": "help\\docs_snegapi.md477.html"
         }
        ],
        "helpId": 485,
        "path": "help\\docs_snegapi.md472.html"
       },
       {
        "name": "Объект IDescriptionArray",
        "childs": [
         {
          "name": "Свойство count",
          "childs": [],
          "helpId": 492,
          "path": "help\\docs_snegapi.md479.html"
         },
         {
          "name": "Метод item",
          "childs": [],
          "helpId": 493,
          "path": "help\\docs_snegapi.md480.html"
         }
        ],
        "helpId": 491,
        "path": "help\\docs_snegapi.md478.html"
       },
       {
        "name": "Объект IDescription",
        "childs": [
         {
          "name": "Метод name",
          "childs": [],
          "helpId": 495,
          "path": "help\\docs_snegapi.md482.html"
         },
         {
          "name": "Метод descr",
          "childs": [],
          "helpId": 496,
          "path": "help\\docs_snegapi.md483.html"
         }
        ],
        "helpId": 494,
        "path": "help\\docs_snegapi.md481.html"
       },
       {
        "name": "Объект ITypeDescription",
        "childs": [
         {
          "name": "Свойство access",
          "childs": [],
          "helpId": 498,
          "path": "help\\docs_snegapi.md485.html"
         },
         {
          "name": "Свойство uuid",
          "childs": [],
          "helpId": 499,
          "path": "help\\docs_snegapi.md486.html"
         },
         {
          "name": "Свойство ctors",
          "childs": [],
          "helpId": 500,
          "path": "help\\docs_snegapi.md487.html"
         },
         {
          "name": "Свойство meths",
          "childs": [],
          "helpId": 501,
          "path": "help\\docs_snegapi.md488.html"
         },
         {
          "name": "Свойство events",
          "childs": [],
          "helpId": 502,
          "path": "help\\docs_snegapi.md489.html"
         },
         {
          "name": "Свойство props",
          "childs": [],
          "helpId": 503,
          "path": "help\\docs_snegapi.md490.html"
         },
         {
          "name": "Свойство collection",
          "childs": [],
          "helpId": 504,
          "path": "help\\docs_snegapi.md491.html"
         }
        ],
        "helpId": 497,
        "path": "help\\docs_snegapi.md484.html"
       },
       {
        "name": "Объект IMethDescription",
        "childs": [
         {
          "name": "Свойство memberOf",
          "childs": [],
          "helpId": 506,
          "path": "help\\docs_snegapi.md493.html"
         },
         {
          "name": "Свойство rettype",
          "childs": [],
          "helpId": 507,
          "path": "help\\docs_snegapi.md494.html"
         },
         {
          "name": "Свойство access",
          "childs": [],
          "helpId": 508,
          "path": "help\\docs_snegapi.md495.html"
         },
         {
          "name": "Свойство syntaxes",
          "childs": [],
          "helpId": 509,
          "path": "help\\docs_snegapi.md496.html"
         }
        ],
        "helpId": 505,
        "path": "help\\docs_snegapi.md492.html"
       },
       {
        "name": "Объект IMethSyntaxDescription",
        "childs": [
         {
          "name": "Свойство params",
          "childs": [],
          "helpId": 511,
          "path": "help\\docs_snegapi.md498.html"
         }
        ],
        "helpId": 510,
        "path": "help\\docs_snegapi.md497.html"
       },
       {
        "name": "Объект IParamDescription",
        "childs": [
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 513,
          "path": "help\\docs_snegapi.md500.html"
         }
        ],
        "helpId": 512,
        "path": "help\\docs_snegapi.md499.html"
       },
       {
        "name": "Объект IPropDescription",
        "childs": [
         {
          "name": "Свойство memberOf",
          "childs": [],
          "helpId": 515,
          "path": "help\\docs_snegapi.md502.html"
         },
         {
          "name": "Свойство type",
          "childs": [],
          "helpId": 516,
          "path": "help\\docs_snegapi.md503.html"
         },
         {
          "name": "Свойство access",
          "childs": [],
          "helpId": 517,
          "path": "help\\docs_snegapi.md504.html"
         },
         {
          "name": "Свойство ro",
          "childs": [],
          "helpId": 518,
          "path": "help\\docs_snegapi.md505.html"
         }
        ],
        "helpId": 514,
        "path": "help\\docs_snegapi.md501.html"
       },
       {
        "name": "Объект IV8Value",
        "childs": [
         {
          "name": "Метод typeName",
          "childs": [],
          "helpId": 520,
          "path": "help\\docs_snegapi.md507.html"
         },
         {
          "name": "Метод presentation",
          "childs": [],
          "helpId": 521,
          "path": "help\\docs_snegapi.md508.html"
         },
         {
          "name": "Метод isObject",
          "childs": [],
          "helpId": 522,
          "path": "help\\docs_snegapi.md509.html"
         },
         {
          "name": "Метод contextInfo",
          "childs": [],
          "helpId": 523,
          "path": "help\\docs_snegapi.md510.html"
         },
         {
          "name": "Метод toStringInternal",
          "childs": [],
          "helpId": 524,
          "path": "help\\docs_snegapi.md511.html"
         },
         {
          "name": "Свойство typeUUID",
          "childs": [],
          "helpId": 525,
          "path": "help\\docs_snegapi.md512.html"
         }
        ],
        "helpId": 519,
        "path": "help\\docs_snegapi.md506.html"
       }
      ],
      "helpId": 13,
      "path": "help\\docs_snegapi.md0.html"
     }
    ]
   },
   {
    "name": "Справка по скриптам",
    "childs": [
     {
      "name": "code_gen",
      "childs": [
       {
        "name": "Генератор Документов",
        "childs": [],
        "helpId": 526,
        "path": "help\\addins__code_gen_create_doc.js0.html"
       },
       {
        "name": "Генератор Описания типов...",
        "childs": [],
        "helpId": 527,
        "path": "help\\addins__code_gen_create_type.js0.html"
       },
       {
        "name": "Генератор Справочников",
        "childs": [],
        "helpId": 528,
        "path": "help\\addins__code_gen_create_refs.js0.html"
       },
       {
        "name": "Менеджер генераторов кода",
        "childs": [],
        "helpId": 529,
        "path": "help\\addins__code_gen_gen_mgr.js0.html"
       }
      ]
     },
     {
      "name": "DevTools",
      "childs": [
       {
        "name": "Немедленное выполнение кода",
        "childs": [],
        "helpId": 530,
        "path": "help\\addins__DevTools_immediate.js0.html"
       },
       {
        "name": "Просмотр профайла 1С",
        "childs": [],
        "helpId": 531,
        "path": "help\\addins__DevTools_pflview.js0.html"
       }
      ]
     },
     {
      "name": "FavCommands",
      "childs": [
       {
        "name": "Избранные команды",
        "childs": [],
        "helpId": 532,
        "path": "help\\addins__FavCommands_FavoriteCommands.js0.html"
       }
      ]
     },
     {
      "name": "Редактирование",
      "childs": [
       {
        "name": "Качество кода",
        "childs": [
         {
          "name": "Расширенный анализ модулей",
          "childs": [],
          "helpId": 533,
          "path": "help\\addins_bsl_analyze.js0.html"
         }
        ]
       }
      ]
     },
     {
      "name": "Авто-ввод паролей на модуль",
      "childs": [],
      "helpId": 534,
      "path": "help\\addins_auto_module_pwd.js0.html"
     },
     {
      "name": "Автодополнение в стиле Vim",
      "childs": [],
      "helpId": 535,
      "path": "help\\addins_VimComplete.js0.html"
     },
     {
      "name": "Авто-подключение к хранилищу",
      "childs": [],
      "helpId": 536,
      "path": "help\\addins_stg_autoconnect.js0.html"
     },
     {
      "name": "Авторский комментарий",
      "childs": [],
      "helpId": 537,
      "path": "help\\addins_author.js0.html"
     },
     {
      "name": "Автосохранение",
      "childs": [],
      "helpId": 538,
      "path": "help\\addins_Autosave.js0.html"
     },
     {
      "name": "Анализ подписок на события",
      "childs": [],
      "helpId": 539,
      "path": "help\\addins_AnalizeEventSubscript.js0.html"
     },
     {
      "name": "Быстрый поиск",
      "childs": [],
      "helpId": 540,
      "path": "help\\addins_qs.js0.html"
     },
     {
      "name": "Внешние файлы",
      "childs": [],
      "helpId": 541,
      "path": "help\\addins_extfiles.js0.html"
     },
     {
      "name": "Выбор колонки табличного поля",
      "childs": [],
      "helpId": 542,
      "path": "help\\addins_selectColumn.js0.html"
     },
     {
      "name": "Заголовок окна Конфигуратора",
      "childs": [
       {
        "name": "Макрос Настройка",
        "childs": [],
        "helpId": 544,
        "path": "help\\addins_configCaption.js1.html"
       }
      ],
      "helpId": 543,
      "path": "help\\addins_configCaption.js0.html"
     },
     {
      "name": "Закладки",
      "childs": [],
      "helpId": 545,
      "path": "help\\addins_BookMarkers.js0.html"
     },
     {
      "name": "Запуск 1С",
      "childs": [],
      "helpId": 546,
      "path": "help\\addins_RunEnterprise.js0.html"
     },
     {
      "name": "Извлечение параметров запроса",
      "childs": [],
      "helpId": 547,
      "path": "help\\addins_queryParamsExtractor.js0.html"
     },
     {
      "name": "Класс SpellChecker",
      "childs": [],
      "helpId": 548,
      "path": "help\\addins_SpellChecker.js0.html"
     },
     {
      "name": "Конструктор ТЗ",
      "childs": [],
      "helpId": 549,
      "path": "help\\addins_vtcreator.js0.html"
     },
     {
      "name": "Менеджер сессии",
      "childs": [],
      "helpId": 550,
      "path": "help\\addins_SessionManager.js0.html"
     },
     {
      "name": "Навигатор по метаданным",
      "childs": [],
      "helpId": 551,
      "path": "help\\addins_mdNavigator.js0.html"
     },
     {
      "name": "Настройка профилей цветов редактора",
      "childs": [],
      "helpId": 552,
      "path": "help\\addins_editor_colors.js0.html"
     },
     {
      "name": "Настройка цветов редактора запросов",
      "childs": [],
      "helpId": 553,
      "path": "help\\addins_query_colors.js0.html"
     },
     {
      "name": "Общий функционал для работы с git",
      "childs": [],
      "helpId": 554,
      "path": "help\\addins_git_common.js0.html"
     },
     {
      "name": "Очистка перед проверкой",
      "childs": [],
      "helpId": 555,
      "path": "help\\addins_sc_clear.js0.html"
     },
     {
      "name": "Панель окон",
      "childs": [],
      "helpId": 556,
      "path": "help\\addins_wndpanel.js0.html"
     },
     {
      "name": "Панель функ/проц с группировкой по контексту компиляции",
      "childs": [],
      "helpId": 557,
      "path": "help\\addins_FuncProcPanel.js0.html"
     },
     {
      "name": "Показ git blame",
      "childs": [],
      "helpId": 558,
      "path": "help\\addins_git_blame.js0.html"
     },
     {
      "name": "Просмотр снимка стека",
      "childs": [],
      "helpId": 559,
      "path": "help\\addins_StackTraceView.js0.html"
     },
     {
      "name": "Расширение редактора текстов",
      "childs": [],
      "helpId": 560,
      "path": "help\\addins_textEditorExt.js0.html"
     },
     {
      "name": "Расширенный поиск и замена",
      "childs": [],
      "helpId": 561,
      "path": "help\\addins_extSearchReplace.js0.html"
     },
     {
      "name": "Редактор регулярных выражений",
      "childs": [],
      "helpId": 562,
      "path": "help\\addins_RegExpEditor.js0.html"
     },
     {
      "name": "Форматирование модуля",
      "childs": [
       {
        "name": "Макрос ВыровнятьЗнакиРавно",
        "childs": [],
        "helpId": 564,
        "path": "help\\addins_format.js1.html"
       },
       {
        "name": "Макрос СдвинутьБлокВлевоНаПробел",
        "childs": [],
        "helpId": 565,
        "path": "help\\addins_format.js2.html"
       },
       {
        "name": "Макрос СдвинутьБлокВправоНаПробел",
        "childs": [],
        "helpId": 566,
        "path": "help\\addins_format.js3.html"
       },
       {
        "name": "Макрос СдвинутьБлокВлевоНаТаб",
        "childs": [],
        "helpId": 567,
        "path": "help\\addins_format.js4.html"
       },
       {
        "name": "Макрос СдвинутьБлокВправоНаТаб",
        "childs": [],
        "helpId": 568,
        "path": "help\\addins_format.js5.html"
       },
       {
        "name": "Макрос УдалитьКонцевыеПробелы",
        "childs": [],
        "helpId": 569,
        "path": "help\\addins_format.js6.html"
       },
       {
        "name": "Макрос ВыровнятьПоПервойЗапятой",
        "childs": [],
        "helpId": 570,
        "path": "help\\addins_format.js7.html"
       },
       {
        "name": "Макрос ВыровнятьПоПоследнейЗапятой",
        "childs": [],
        "helpId": 571,
        "path": "help\\addins_format.js8.html"
       },
       {
        "name": "Макрос ВыровнятьКомментарии",
        "childs": [],
        "helpId": 572,
        "path": "help\\addins_format.js9.html"
       }
      ],
      "helpId": 563,
      "path": "help\\addins_format.js0.html"
     },
     {
      "name": "Шаблоны кода",
      "childs": [],
      "helpId": 573,
      "path": "help\\addins_snippets.js0.html"
     }
    ]
   }
  ]
 }
}
