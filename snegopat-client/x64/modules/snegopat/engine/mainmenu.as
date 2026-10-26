/*
 * Пункт верхнего уровня «Снегопат» в главном меню Конфигуратора (между «Конфигурация» и «Отладка»).
 * Меню рисует платформа из «панелей» (bands): панель — это CommandID {группа, номер}, её содержимое — список пунктов
 * (CommandID + вес типа double, порядок по весу). Главное меню — панель {B78F2E80-EC68-11D4-9DCF-0050BAE2BC79, 1}, пункт верхнего
 * уровня — «popup-команда», у которой есть одноимённая панель с подпунктами. Модули платформы дополняют меню так же, как делаем мы:
 * создают объект CommandInterface (CLSID F459D5F0-…), кладут в него панели (addBand) и отдают менеджеру панелей (addSource).
 * Подробности реверса и раскладки — tools/MAINMENU.md. Включение: logs/diag.ini, hook.mainmenu=on (по умолчанию включено на 8.3.27, выключить: hook.mainmenu=off).
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"

Packet pkMainMenu("MainMenu", initMainMenu, piOnFirstIdle);

funcdef int_ptr MMCall4(int_ptr, int_ptr, int_ptr, int_ptr);
funcdef size_t MMUpdTrap(size_t, size_t);

const string MM_GROUP = "{A1C0F2E4-5B7D-4E3A-9C62-1F8D3B6E7A90}";   // группа наших команд
const string MM_CAT_POPUP = "{79FC5DE1-99D4-45EE-A887-22970F440CE6}";   // категория «Подменю» платформы
const string MM_CAT_OWN = "{A1C0F2E4-5B7D-4E3A-9C62-1F8D3B6E7A91}";     // категория наших команд (платформе не регистрируется)
const string MM_FRAME = "{B78F2E80-EC68-11D4-9DCF-0050BAE2BC79}";       // группа команд главного окна
const string MM_CLSID_CI = "{F459D5F0-E7C0-11D4-9DCD-0050BAE2BC79}";    // CommandInterface
const string MM_IID_CI = "{7DF15090-7A63-11D4-84A1-008048DA06DF}";
const uint MM_POPUP_NUM = 1;        // popup «Снегопат»
const uint MM_SETTINGS_NUM = 2;     // «Настройки Снегопата»
const uint64 MM_WEIGHT_POPUP = 0x4030333333333333;    // 16.2: после «Конфигурация» (16), до «Отладка» (16.5)
const uint64 MM_WEIGHT_ITEM = 0x3ff0000000000000;     // 1.0

#if (ver >= 8.3.27 & ver < 8.3.28)
const bool MM_SUPPORTED = true;
const uint MM_DELAY_MS = 0;
const int_ptr MM_REBUILD = 1;
const uint MM_REFRESH_MS = 3000;
const bool MM_DESCR_TEXT = true;            // текст пишем прямо в описание команды (SSO v8string)
const uint MM_ENTRY_SIZE = 0x68;            // запись registerCommands
const uint MM_E_INT1 = 0x58;                // int -1
const uint MM_E_INT2 = 0x5C;                // int 1
const uint MM_E_BYTE = 0x60;                // byte 1
const uint MM_E_STR = 0x40;                 // пустая v8string (SSO)
const int_ptr MM_MANAGER_OFF = 0xD0;        // [ICommandService + 0xD0] — менеджер панелей (слот 27 ICommandService)
#elif ver = 8.3.17.1549
const bool MM_SUPPORTED = true;
const uint MM_DELAY_MS = 4000;
const int_ptr MM_REBUILD = 0;
const uint MM_REFRESH_MS = 3000;           // 17: первая отдельная перестройка (не раньше 8 с от старта: на первом простое роняла платформу)
const bool MM_DESCR_TEXT = false;           // v8string stlport (28 байт), описание иной раскладки: текст только через ICommandState.setText
const uint MM_ENTRY_SIZE = 0x60;
const uint MM_E_INT1 = 0x54;
const uint MM_E_INT2 = 0x58;
const uint MM_E_BYTE = 0x5C;
const uint MM_E_STR = 0x38;
const int_ptr MM_MANAGER_OFF = 0xD0;        // так же, как в 27
#elif ver >= 8.5
// 8.5: параметры и раскладка совпали с 8.3.27 (подтверждено live на 8.5.1.1529:
// менеджер [ICommandService+0xD0], шаблоны пунктов, registerCommands/updateState — как в 27)
const bool MM_SUPPORTED = true;
const uint MM_DELAY_MS = 0;
const int_ptr MM_REBUILD = 1;
const uint MM_REFRESH_MS = 3000;
const bool MM_DESCR_TEXT = true;
const uint MM_ENTRY_SIZE = 0x68;
const uint MM_E_INT1 = 0x58;
const uint MM_E_INT2 = 0x5C;
const uint MM_E_BYTE = 0x60;
const uint MM_E_STR = 0x40;
const int_ptr MM_MANAGER_OFF = 0xD0;
#else
const bool MM_SUPPORTED = false;
const uint MM_DELAY_MS = 0;
const int_ptr MM_REBUILD = 0;
const uint MM_REFRESH_MS = 0;
const bool MM_DESCR_TEXT = false;
const uint MM_ENTRY_SIZE = 0x68;
const uint MM_E_INT1 = 0x58;
const uint MM_E_INT2 = 0x5C;
const uint MM_E_BYTE = 0x60;
const uint MM_E_STR = 0x40;
const int_ptr MM_MANAGER_OFF = 0;
#endif
const uint MM_SLOT_REGISTER_COMMANDS = 11;  // ICommandService
const uint MM_SLOT_BANDBYID = 3;            // менеджер: найти панель
const uint MM_SLOT_ADDSOURCE = 10;          // менеджер: добавить источник
const uint MM_SLOT_REBUILD = 13;            // менеджер: перестроить панели
const uint MM_SLOT_ADDBAND = 4;             // источник: addBand(CommandID*, vector<Item>*, bool)
const uint MM_SLOT_FINISH = 13;             // источник: завершить
const uint MM_SLOT_PROC_CREATE = 5;         // SCOM_Process.createByClsid
const uint MM_ITEM_SIZE = 0x70;

array<uint64> mmAddrs;
array<MMCall4&&> mmFns;
bool mmDone = false;
int_ptr mmManager = 0;
bool mmTrapped = false;
int_ptr mmGroupBytes = 0;      // 16 байт GUID нашей группы
TrapVirtualStdCall trMMUpdate;
TrapVirtualStdCall trMMHas;

int_ptr mmCall(int_ptr fn, int_ptr a1, int_ptr a2 = 0, int_ptr a3 = 0, int_ptr a4 = 0) {
    uint64 addr = uint64(fn);
    MMCall4&& f;
    for (uint i = 0; i < mmAddrs.length; i++) {
        if (mmAddrs[i] == addr) {
            &&f = mmFns[i];
            break;
        }
    }
    if (f is null) {
        initFuncDefFromAddress(fn, &&f);
        mmAddrs.insertLast(addr);
        mmFns.insertLast(f);
    }
    return f(a1, a2, a3, a4);
}

int_ptr mmAlloc(uint size) {
    int_ptr p = malloc(size + 16);
    mem::memset(p, 0, size + 16);
    return p;
}

uint64 mmHex(const string& s, uint start, uint len) {
    return diagParseHex(s.substr(start, len));
}

// GUID вида {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX} в 16 байт памяти (раскладка Windows GUID)
void mmPutGuid(int_ptr dst, const string& g) {
    mem::dword[dst] = uint(mmHex(g, 1, 8));
    mem::word[dst + 4] = uint16(mmHex(g, 10, 4));
    mem::word[dst + 6] = uint16(mmHex(g, 15, 4));
    mem::byte[dst + 8] = uint8(mmHex(g, 20, 2));
    mem::byte[dst + 9] = uint8(mmHex(g, 22, 2));
    for (uint i = 0; i < 6; i++)
        mem::byte[dst + 10 + i] = uint8(mmHex(g, 25 + i * 2, 2));
}

int_ptr mmNewCid(const string& g, uint num) {
    int_ptr p = mmAlloc(32);
    mmPutGuid(p, g);
    mem::dword[p + 16] = num;
    return p;
}

int_ptr mmNewAnsi(const string& s) {
    int_ptr p = mmAlloc(s.length + 2);
    for (uint i = 0; i < s.length; i++)
        mem::byte[p + i] = uint8(s[i]);
    return p;
}

// Запись коротких (до 10 символов) строк v8string прямо в описание команды (хранилище SSO: буфер 22 байта, слово 11 - длина)
void mmSetShort(int_ptr dst, const string& s) {
    mem::memset(dst, 0, 24);
    mem::memcpy(dst, s.cstr, s.length * 2);
    mem::word[dst + 0x16] = 11 - s.length;
}

// Панель {номер группы} -> адрес определения (0, если не найдена)
int_ptr mmBand(int_ptr manager, int_ptr cid) {
    int_ptr vt = mem::int_ptr[manager];
    int_ptr outp = mmAlloc(16);
    mmCall(mem::int_ptr[vt + MM_SLOT_BANDBYID * 8], manager, outp, cid);
    return mem::int_ptr[outp];
}

// Первый пункт панели как образец (байты копируются, потом правятся id и вес)
int_ptr mmTemplate(int_ptr manager, const string& group, uint num) {
    int_ptr band = mmBand(manager, mmNewCid(group, num));
    if (band == 0)
        return 0;
    int_ptr beg = mem::int_ptr[band + 0x30];
    int_ptr end = mem::int_ptr[band + 0x38];
    if (beg == 0 || end <= beg)
        return 0;
    return mem::int_ptr[beg];
}

int_ptr mmItem(int_ptr tmpl, const string& group, uint num, uint64 weight) {
    int_ptr it = mmAlloc(MM_ITEM_SIZE);
    mem::memcpy(it, tmpl, MM_ITEM_SIZE);
    mmPutGuid(it, group);
    mem::dword[it + 16] = num;
    for (uint i = 0x14; i < 0x30; i += 4)
        mem::dword[it + i] = 0;
    mem::int_ptr[it + 0x30] = int_ptr(weight);
    mem::dword[it + 0x38] = 0;
    mem::dword[it + 0x3C] = 0;
    return it;
}

int_ptr mmVector(int_ptr items, uint count) {
    int_ptr v = mmAlloc(32);
    mem::int_ptr[v] = items;
    mem::int_ptr[v + 8] = items + count * MM_ITEM_SIZE;
    mem::int_ptr[v + 16] = items + count * MM_ITEM_SIZE;
    return v;
}

int_ptr mmCmdEntry(const string& group, uint num, const string& category, const string& idName, int_ptr bundle) {
    int_ptr e = mmAlloc(MM_ENTRY_SIZE);
    mmPutGuid(e, group);
    mem::dword[e + 16] = num;
    mmPutGuid(e + 0x14, category);
    mem::int_ptr[e + 0x28] = bundle;
    mem::int_ptr[e + 0x30] = mmNewAnsi(idName);
    if (MM_DESCR_TEXT)
        mem::word[e + MM_E_STR + 0x16] = 11;     // пустая SSO-строка (в stlport нулей достаточно)
    mem::dword[e + MM_E_INT1] = 0xFFFFFFFF;
    mem::dword[e + MM_E_INT2] = 1;
    mem::byte[e + MM_E_BYTE] = 1;
    return e;
}

// Описание команды: подставляем текст (дальше платформа не лезет в ресурсы, флаг разрешения строк = 1)
void mmSetCommandText(const string& group, uint num, const string& text) {
    ICommandService&& cs = currentProcess().getService(IID_ICommandService);
    CommandID id(Guid(group), num);
    ICmdDescription&& d;
    cs.commandDescription(d, id);
    if (d is null) {
        diagAlways("mainmenu", "нет описания команды " + group + "/" + num);
        return;
    }
    int_ptr b = d.self - 0x70;
    mem::int_ptr[b + 0x68] = 1;
    mmSetShort(b + 0x08, text);
    mmSetShort(b + 0x20, text);
    mmSetShort(b + 0x38, text);
    mmSetShort(b + 0x50, text);
}

bool mmIsOurs(int_ptr cidPtr) {
    if (cidPtr == 0 || mmGroupBytes == 0)
        return false;
    return mem::int_ptr[cidPtr] == mem::int_ptr[mmGroupBytes] && mem::int_ptr[cidPtr + 8] == mem::int_ptr[mmGroupBytes + 8];
}

// ICommandState: id() — слот 3, enable(bool) — слот 6
size_t mmUpdateTrap(size_t pThis, size_t pState) {
    MMUpdTrap&& orig;
    trMMUpdate.getOriginal(&&orig);
    size_t r = orig(pThis, pState);
    if (pState != 0) {
        int_ptr vt = mem::int_ptr[int_ptr(pState)];
        int_ptr cid = mmCall(mem::int_ptr[vt + 3 * 8], int_ptr(pState));
        if (mmIsOurs(cid)) {
            uint num = mem::dword[cid + 16];
            diag("mainmenu", "updateState: команда " + num);
            if (num == MM_POPUP_NUM && !mmConfirmed) {
                mmConfirmed = true;
                diagAlways("mainmenu", "пункт нарисован: перестроек " + mmRefreshIdx + ", " + (GetTickCount() - mmBuildTick) + " мс после добавления");
            }
            mmCall(mem::int_ptr[vt + 6 * 8], int_ptr(pState), 1);
            // полный текст пункта (в описании команды помещается только короткий: 10 символов)
            if (num == MM_SETTINGS_NUM || !MM_DESCR_TEXT) {
                IUnknown&& u = toIUnknown(int_ptr(pState));
                u.AddRef();         // toIUnknown ссылку не берёт, а дескриптор при выходе сделает Release
                ICommandState&& st = u;
                if (st !is null)
                    st.setText(num == MM_SETTINGS_NUM ? "Настройки Снегопата" : "Снегопат");
            }
        }
    }
    return r;
}

size_t mmHasTrap(size_t pThis, size_t pCid) {
    MMUpdTrap&& orig;
    trMMHas.getOriginal(&&orig);
    if (mmIsOurs(int_ptr(pCid))) {
        diag("mainmenu", "hasHandler: команда " + mem::dword[int_ptr(pCid) + 16]);
        return 1;
    }
    return orig(pThis, pCid);
}

// Открыть окно Снегопата тем же макросом, что «Открыть окно Снегопата» (std/snegopat.js)
void openSnegopatSettingsWnd() {
    Addin&& addin = oneAddinMgr.byUniqueName("SnegopatMainScript");
    if (addin is null) {
        dbgLog("mainmenu: аддин SnegopatMainScript не найден");
        return;
    }
    addin.invokeMacros("Открыть окно Снегопата");
}

// Вызывается из transmitCommandTrap (com_events.as): наша команда выполняется на простое и не уходит в платформу
bool mainMenuOnCommand(const Command& cmd) {
    if (!mmDone)
        return false;
    if (!(cmd.id.group == Guid(MM_GROUP)))
        return false;
    diag("mainmenu", "команда " + cmd.id.num);
    if (cmd.id.num == MM_SETTINGS_NUM) {
        idleHandlersSingle.insertLast(PVV(openSnegopatSettingsWnd));
        wakeIdle();
    }
    return true;
}

bool initMainMenu() {
    if (!diagHook("mainmenu", true))
        return true;
    if (!MM_SUPPORTED) {
        diagAlways("mainmenu", "платформа " + sv8ver + ": раскладка менеджера панелей не проверена, меню не добавлено");
        return true;
    }
    if (MM_DELAY_MS == 0)
        return mmBuild();
    // на 17 перестройка панелей на первом простое роняет платформу (меню ещё не построено до конца): ждём
    setTimer(MM_DELAY_MS, function(int_ptr timerId) {
        removeTimer(timerId);
        mmBuild();
    });
    return true;
}

const uint MM_REFRESH_STEPS = 60;       // предел перестроек: первые 40 через 2 с, остальные через 10 с
uint mmRefreshIdx = 0;
bool mmConfirmed = false;                // платформа запросила состояние нашего popup: пункт реально нарисован
uint mmBuildTick = 0;

// Сигнал готовности: пока меню не перерисовано с нашим пунктом, перестраиваем панели часто; платформа отбрасывает перестройку,
// пока не достроено меню, видимого сигнала готовности у неё нет, но запрос updateState нашего popup приходит только от нарисованного пункта
void mmScheduleRefresh() {
    if (mmConfirmed || mmRefreshIdx >= MM_REFRESH_STEPS)
        return;
    uint gap = mmRefreshIdx == 0 ? MM_REFRESH_MS : (mmRefreshIdx < 40 ? 2000 : 10000);
    setTimer(gap, function(int_ptr timerId) {
        removeTimer(timerId);
        if (mmConfirmed)
            return;
        mmCall(mem::int_ptr[mem::int_ptr[mmManager] + MM_SLOT_REBUILD * 8], mmManager);
        mmRefreshIdx++;
        diag("mainmenu", "панели перестроены, шаг " + mmRefreshIdx);
        mmScheduleRefresh();
    });
}

bool mmBuild() {
    mmBuildTick = GetTickCount();
    ICommandService&& cs = currentProcess().getService(IID_ICommandService);
    if (cs is null) {
        diagAlways("mainmenu", "нет ICommandService");
        return true;
    }
    int_ptr svc = cs.self;
    int_ptr manager = mem::int_ptr[svc + MM_MANAGER_OFF];
    if (manager == 0) {
        diagAlways("mainmenu", "нет менеджера панелей");
        return true;
    }
    // образцы пунктов берём у живых панелей платформы
    int_ptr tmplPopup = mmTemplate(manager, MM_FRAME, 1);
    int_ptr tmplLeaf = mmTemplate(manager, MM_FRAME, 52);
    if (tmplPopup == 0 || tmplLeaf == 0) {
        diagAlways("mainmenu", "не найдены образцы пунктов (" + dbgHex(tmplPopup) + ", " + dbgHex(tmplLeaf) + ")");
        return true;
    }
    // 1. команды
    int_ptr bundle = mmNewAnsi("frame");
    int_ptr entries = mmAlloc(MM_ENTRY_SIZE * 2);
    mem::memcpy(entries, mmCmdEntry(MM_GROUP, MM_POPUP_NUM, MM_CAT_POPUP, "SnegopatPopup", bundle), MM_ENTRY_SIZE);
    mem::memcpy(entries + MM_ENTRY_SIZE, mmCmdEntry(MM_GROUP, MM_SETTINGS_NUM, MM_CAT_OWN, "SnegopatSettings", bundle), MM_ENTRY_SIZE);
    int_ptr svt = mem::int_ptr[svc];
    mmCall(mem::int_ptr[svt + MM_SLOT_REGISTER_COMMANDS * 8], svc, bundle, entries, 2);
    if (MM_DESCR_TEXT) {
        mmSetCommandText(MM_GROUP, MM_POPUP_NUM, "Снегопат");
        mmSetCommandText(MM_GROUP, MM_SETTINGS_NUM, "Настройки");
    }
    // 2. источник панелей: пункт в главном меню и содержимое popup
    int_ptr proc = currentProcess().self;
    int_ptr clsid = mmAlloc(16);
    int_ptr iid = mmAlloc(16);
    mmPutGuid(clsid, MM_CLSID_CI);
    mmPutGuid(iid, MM_IID_CI);
    int_ptr outp = mmAlloc(16);
    mmCall(mem::int_ptr[mem::int_ptr[proc] + MM_SLOT_PROC_CREATE * 8], proc, clsid, iid, outp);
    int_ptr src = mem::int_ptr[outp];
    if (src == 0) {
        diagAlways("mainmenu", "не создан источник панелей");
        return true;
    }
    int_ptr sv = mem::int_ptr[src];
    int_ptr mainItems = mmAlloc(MM_ITEM_SIZE);
    mem::memcpy(mainItems, mmItem(tmplPopup, MM_GROUP, MM_POPUP_NUM, MM_WEIGHT_POPUP), MM_ITEM_SIZE);
    int_ptr popItems = mmAlloc(MM_ITEM_SIZE);
    mem::memcpy(popItems, mmItem(tmplLeaf, MM_GROUP, MM_SETTINGS_NUM, MM_WEIGHT_ITEM), MM_ITEM_SIZE);
    mmCall(mem::int_ptr[sv + MM_SLOT_ADDBAND * 8], src, mmNewCid(MM_FRAME, 1), mmVector(mainItems, 1), 0);
    mmCall(mem::int_ptr[sv + MM_SLOT_ADDBAND * 8], src, mmNewCid(MM_GROUP, MM_POPUP_NUM), mmVector(popItems, 1), 0);
    mmCall(mem::int_ptr[sv + MM_SLOT_FINISH * 8], src);
    // 3. обработка команд: состояние и выполнение
    mmGroupBytes = mmAlloc(32);
    mmPutGuid(mmGroupBytes, MM_GROUP);
    if (coreMainFrame !is null) {
        ICommandReceiver&& rcv = coreMainFrame.unk;
        if (rcv !is null) {
            trMMUpdate.setTrap(&&rcv, ICommandReceiver_updateState, mmUpdateTrap);
            trMMHas.setTrap(&&rcv, ICommandReceiver_hasHandler, mmHasTrap);
            mmTrapped = true;
            diagAlways("mainmenu", "перехваты состояния команд установлены на " + dbgHex(rcv.self));
        }
    }
    mmDone = true;
    // 4. менеджеру: добавить источник и перестроить панели
    mmCall(mem::int_ptr[mem::int_ptr[manager] + MM_SLOT_ADDSOURCE * 8], manager, src, MM_REBUILD);
    diagAlways("mainmenu", "пункт «Снегопат» добавлен в главное меню");
    // Платформа достраивает меню и окна ещё долго после старта (загрузка конфигурации, восстановление окон) и может не перерисовать панель:
    // повторяем перестройку несколько раз; перестройка при видимом окне вызывает перерисовку меню
    mmManager = manager;
    mmRefreshIdx = 0;
    mmScheduleRefresh();
    return true;
}
