## `snegopat/addins/Libs/winapi.js`

- Язык: **JScript**, строк: **180**, объявлений: **18**
- Состав: func — 18

- `GetWindowRect(hwnd)`
- `GetClientRect(hwnd)`
- `SetFocus(hwnd)`
- `GetFocus()`
- `GetParentWindow(hwnd)`
- `IsChild(hParent, hWnd)`
- `SendMessage(hwnd, msg, wParam, lParam)`
- `CreateApiFontFromV8Font(font, hdc)` — Метод позволяет создать WinAPI шрифт по данным 1Сного объекта Шрифт, но 1Сный шрифт должен быть абсолютным. Ведется общий список созданных шрифтов, т.е. если шрифт с такими параметрами уже создавался, то вернет уже созданный шрифт.
- `DrawText(hdc, text, rect, format)`
- `GetDC(hwnd)`
- `ReleaseDC(hwnd, hdc)`
- `GetDesktopWindow()`
- `SelectObject(hdc, obj)`
- `DeleteObject(obj)`
- `GetDeviceCaps(hdc, idx)`
- `GetWindow(hwnd, cmd)`
- `IsWindowVisible(hwnd)`
- `GetWindowLong(hwnd, idx)`
