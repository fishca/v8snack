// Native boundary for editor worker callbacks. x86 retains its existing path.
#if x86 = 0
:global
#if ver >= 8.5
// 8.5: нативная часть резолвит аллокатор по имени модуля; в 8.5 это nuke85.dll,
// а в snegopat_colors.dll имя зашито как nuke83.dll. Для 8.5 — копия с исправленной строкой.
:dlls snegopat_colors85.dll
#else
:dlls snegopat_colors.dll
#endif
    int_ptr installColorsGate(ITextExtColors& object, uint slot, int_ptr script, uint owner, uint kind)|colorsGateInstall
    int_ptr installBackColorsGate(ITextExtBackColors& object, uint slot, int_ptr script, uint owner, uint kind)|colorsGateInstall
#if ver >= 8.3.27 & ver < 8.3.28
    // 8.3.27: фон всей строки (до правого края): свой объект интерфейса {193EB880-...} через перехват QueryInterface расширения
    int colorsLineBgInstall(ITextExtention& ext, uint owner)|colorsLineBgInstall
    int colorsLineBgEnable(int enabled)|colorsLineBgEnable
    int64 colorsLineBgCount()|colorsLineBgCount
#endif
    int colorsGateEnable(uint kind, int enabled)|colorsGateEnable
    int64 colorsGateCount(uint kind, int script)|colorsGateCount
    int_ptr colorsGateAddress(uint kind, uint field)|colorsGateAddress
    int colorsWorkerProbe(ITextExtColors& object, const v8string& line, Vector& output)|colorsWorkerProbe
    int colorsNativeConfigure(ITextExtColors& sql, uint modern, uint tokenSize, uint colorOffset, uint blockOffset, uint lexOffset, uint flags, uint background, uint pipe, uint infosOffset)|colorsNativeConfigure
    int colorsNativeSwitch(int enabled)|colorsNativeSwitch
    int colorsWorkerStress(ITextExtColors& object, const v8string& line, uint workers, uint iterations)|colorsWorkerStress
    int nativeBackgroundProbe(ITextExtBackColors& object, Vector& items, Vector& output, uint worker)|colorsBackgroundProbe
#endif
