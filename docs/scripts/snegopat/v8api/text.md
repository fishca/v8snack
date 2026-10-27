## `snegopat/v8api/text.v`

- Язык: **v8api (.v)**, строк: **300**, объявлений: **146**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 17, method — 83, meths — 1, slot-skip — 27, virt — 18

- `:iface IControlDesign {65901BA0-F124-11d3-93F7-008048DA11F9}`

### внутри `IControlDesign`

- `:virt`
- `void setMode(ControlMode mode)`
- `ControlMode getMode()`

### верхний уровень

- `:iface ITextManager {2663F1E1-DB40-11d4-B009-004095E12DE6}`

### внутри `ITextManager`

- `:virt`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `bool isEmpty()`
- `int linesCnt()`
- `uint32 getCheckSum()`
- `bool getSelLine(int nLine, v8string& str, bool bInScreenCoords = true)`
- `bool getLine(int nLine, v8string& str, bool bInScreenCoords = true)`
- `bool replaceLine(int nLine, v8string& str, bool bInScreenCoords = true)`
- `bool insertLine(int nLine, const v8string& str, bool bAfter)`
- `bool replaceLine(int nLine)`
- `bool appendLine(const v8string& str)`
- `void clear()`
- `bool getManagerReadOnly()`
- `void setManagerReadOnly(bool bReadOnly)`
- `void setExtenderCLSID(const CLSID& clsid)`
- `CLSID getExtenderCLSID()`
- `TextPosition getTillPos(bool bDirection)`
- `ITextEditorPtr getActiveTextEditor()`
- `void updateAllViews(UINT updateType, bool bErase, LPVOID pData)`
- `void updateAllViews(UINT updateType, bool bErase, int nLine)`
- `void updateAllViews(UINT updateType, bool bErase, int nLine, int nPosFrom, int nPosTo)`
- `void updateAllViews(UINT updateType, bool bErase, int nLineFrom, int nLineTo)`
- `void setTemplateLangeageCode(const astring& strCode)`
- `astring getTemplateLangeageCode()`

### верхний уровень

- `:iface ITextEditor {E82EFAF1-28B8-11d5-B08A-008048DA0765}`

### внутри `ITextEditor`

- `:virt`
- `uint getITextManager(ITextManager@&out)`
- `void updateView()`
- `пропуск слотов: +1`
- `void updateLine(int nLine, bool bInScreenCoords = false)`
- `bool isELVisible(int nLine)`
- `int getVisibleLines()`
- `int getFirstVisible()`
- `int setFirstVisible(int nLine, bool bInScreenCoords = false)`
- `bool isSelectionEmpty()`
- `void setSelectionNull()`
- `uint getCaretPosition(TextPosition& out, bool bInScreenCoords = false)`
- `void setCaretPosition(const TextPosition&in tp, bool bInScreenCoords = false)`
- `void scrollToCaretPos()`
- `void getSelection(TextPosition&out tpStart, TextPosition&out tpStop,bool bInScreenCoords = false)`
- `void getSelectionText(v8string&out str)`
- `void setSelectionText(const v8string&in str)`
- `void getTextUnderCaretPos(v8string&in str)`
- `void setSelection(const TextPosition&in tpStart, const TextPosition&in tpStop, bool bCaretToStart, bool bInScreenCoords = false)`
- `пропуск слотов: +1`
- `void setSepcialSel(int nLine, bool bInScreenCoords = true)`
- `int getSepcialSel(bool bInScreenCoords = true)`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `void setUseContextMenu(bool bEnable = true)`
- `bool getUseContextMenu()`
- `void setUseProperty(bool bEnable = true)`
- `bool getUseProperty()`
- `void setAutomaticOfficeAreaUpdate(bool bNeedUpdateOfficeArea)`
- `bool getAutomaticOfficeAreaUpdate()`
- `UINT getBookmarkColumnID()`
- `UINT getOutlineColumnID()`
- `HWND getWindowHandle()`

### верхний уровень

- `:iface ITextManager_Operations {FDA50A42-C578-405A-AB09-739B1EFF0AC5}`

### внутри `ITextManager_Operations`

- `:virt`
- `пропуск слотов: +1`
- `int setExtenderCLSID(const Guid&)`
- `int getExtenderCLSID(Guid&out)`
- `пропуск слотов: +5`
- `void updateAllViews(int reason = 1, bool erase=false)`

### верхний уровень

- `:iface ITextParserCache {9FCB75A7-B688-4069-9B25-FC9F7F06358D}`

### внутри `ITextParserCache`

- `:virt`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1` — 7OH end
- `void clearCache()`
- `пропуск слотов: +1`

### верхний уровень

- `:iface ITxtEdtOptions {F7016521-5751-11d5-B0B7-008048DA0765}`

### внутри `ITxtEdtOptions`

- `:virt`
- `void loadDefault()`
- `void getFont(Font&out font)`

### верхний уровень

- `:iface IModuleEdit {6DA9E947-156D-4239-8475-5DED35CEA1F4}`

### внутри `IModuleEdit`

- `:virt`
- `void f()`

### верхний уровень

- `:iface ISourceLexer {8EC5EC11-8D62-4CCC-8C5A-5C8880179C7F}`

### внутри `ISourceLexer`

- `:virt`
- `void splitToLexems(const v8string& source, Vector& lexems)`

### верхний уровень

- `:iface ITxtEdtExtender {6A93A253-50F8-11D5-B0B3-008048DA0765}`

### внутри `ITxtEdtExtender`

- `:virt`
- `v8string getName()`
- `:virt`
- `пропуск слотов: +4`
- `void setTxtDocExtender(ITextManager@+ itm, ITxtEdtExtender@+ tee)`
- `пропуск слотов: +3`
- `bool getExtenderCLSID(const uint& index, Guid& clsid)`
- `thiscall uint getExtender(ITxtEdtExtender@&, ITextManager@+ pITextManager, const Guid& clsid)`
- `пропуск слотов: +1`
- `uint extendersCount()`
- `uint extenderName(int idx)`
- `пропуск слотов: +1`
- `uint getTemplateProcessor(ITemplateProcessor@&)`

### верхний уровень

- `:iface ITemplateProcessor {BE7E8365-EC19-4804-A04B-2CA31436BF21}`

### внутри `ITemplateProcessor`

- `:virt`
- `bool needSubstitute(const v8string&in strSrc, TextManager& tm, v8string&out res)`
- `void processTemplate(const v8string&in templName, const v8string&in templStr, v8string&out result, uint&out nCaretStartOffset, const v8string&in indent)`

### верхний уровень

- `:iface IEdit {103E3E6D-F9C7-4C5C-A82B-857387E59971}`

### внутри `IEdit`

- `:virt`
- `пропуск слотов: +3`
- `bool getText(v8string& str)`

### верхний уровень

- `:iface IDataControl {FCE82550-7907-11D4-9422-008048DA11F9}`

### внутри `IDataControl`

- `:virt`
- `bool setValue(const Value& value)`
- `пропуск слотов: +1`
- `void getValue(Value& value, bool bMake = true)`

### верхний уровень

- `:iface IDataControlEx {4154059F-F2F1-4A3F-96AE-A814BAD3A80A}`

### внутри `IDataControlEx`

- `:virt`
- `void supportedTypes(Vector& types, bool& supportDomain)`
- `void setTypeDomain(const TypeDomainPattern& typeDomain)`
- `void getTypeDomain(TypeDomainPattern& typeDomain)`

### верхний уровень

- `:iface IFldEdit {4F663FCF-8942-4475-9E36-4D2ED7405F40}`

### внутри `IFldEdit`

- `:virt`
- `void test()`

### верхний уровень

- `:iface IControlContext {1CA43100-85F2-11D5-A3BE-0050BAE0A776}`

### внутри `IControlContext`

- `:virt`
- `uint getControlId()`
- `uint getControl(IUnknown@& res, const Guid& iid)`

### верхний уровень

- `:iface IOutlineCoords {668F52B6-8504-44CB-91EE-81BCEC8124F4}`

### внутри `IOutlineCoords`

- `:virt`
- `пропуск слотов: +4`
- `пропуск слотов: +1`
- `bool convertTextPosition(TextPosition& tp, bool bFromScreen)`

### верхний уровень

- `:iface ITEIntelliSence {8291C836-E286-401C-AEEC-E374A8F34879}`

### внутри `ITEIntelliSence`

- `:virt`
- `пропуск слотов: +4`
- `int_ptr getMousePos(Point&)`
- `int_ptr getCaretPosForTooltip(Point&)`
- `int_ptr getMousePosForTooltip(Point&)`
- `void getContextListPos(Point& caretPos, uint& lineHeight)`
- `:meths`
