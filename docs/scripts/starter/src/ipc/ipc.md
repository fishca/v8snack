## `starter/src/ipc/ipc.as`

- Язык: **AngelScript**, строк: **88**, объявлений: **9**
- Назначение: Реализация общего для других модулей кода по взаимодействию со стартером /
- Состав: class — 1, func — 7, funcdef — 1

- `funcdef void StarterNotify(const string& data);`
- `class StarterInterProcess`

### внутри `StarterInterProcess`

- `bool isConnected()`
- `void showNotify(const string& title, const string& message)`
- `void setInjectStatus(bool inject)`
- `void sendBroadcast(const string& source, const string& data)`
- `void sendMessageToStarter(StarterMessages type, const string& data)`
- `void connectToStarter(const string& instanceName)`
- `LRESULT wndFunc(uint msg, WPARAM w, LPARAM l)`
