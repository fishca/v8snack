## `snegopat/v8api/form.v`

- Язык: **v8api (.v)**, строк: **130**, объявлений: **76**
- Назначение: Описание интерфейсов 1С.
- Состав: iface — 10, method — 53, slot-skip — 3, virt — 10

- `:iface IDocumentFactory {EA26B900-A5D1-11D4-942A-008048DA11F9}` — (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com Описание интерфейсов 1С.

### внутри `IDocumentFactory`

- `:virt`
- `int_ptr createDocument(IDocument@&, const v8string&in initData, int_ptr observer=0)`
- `uint createDocument(IDocument@&, const v8string&in initData)`

### верхний уровень

- `:iface ILangSettings {3B095890-1DDE-47E8-A225-FD77D7B31310}`

### внутри `ILangSettings`

- `:virt`
- `v8string currentLanguage()`
- `v8string defaultLanguage()`
- `int mainLang()`
- `void languages(Vector& langs)`

### верхний уровень

- `:iface ICustomFormDesigner {525A1AA8-51E4-4185-989B-11740ABA7221}`

### внутри `ICustomFormDesigner`

- `:virt`
- `void init()`
- `void setFormSettings(IUnknown& settings, const Guid& iid)`
- `void prepare()`
- `uint getForm(IUnknown@&)`
- `uint getModule(IDocument@&)`
- `пропуск слотов: +1`
- `void setModuleWizardCLSID(const Guid& id)`

### верхний уровень

- `:iface ICopyHelperCreator {3BAE0A18-CE8B-4126-ABD6-AA387D917832}`

### внутри `ICopyHelperCreator`

- `:virt`
- `void setIids(const Guid& guid, const Vector& iids)`

### верхний уровень

- `:iface ICustomForm {D7F21E7F-C920-417B-948B-D884ECCA5F40}`

### внутри `ICustomForm`

- `:virt`
- `uint getFormController(IUnknown@&, CompositeID&)`
- `void setRuntimeModule(IUnknown& runtimeModule)`

### верхний уровень

- `:iface ICustomFormLoader {5DD393EE-FFAE-4CA7-BECD-805B7C2FF928}`

### внутри `ICustomFormLoader`

- `:virt`
- `void loadCustomForm(IFile& file, ICustomForm& form)`

### верхний уровень

- `:iface IRuntimeModule {59A65E28-FAE2-446D-9EE7-53712452A615}`

### внутри `IRuntimeModule`

- `:virt`
- `void init(IContext& context)`
- `int findProp(const v8string& name)`
- `void setPropVal(int prop, const Value& value)`
- `void getPropVal(int prop, Value& value)`
- `int findMeth(const v8string& name)`
- `int getParamsCount(int meth)`
- `bool call(int meth, Value& ret, Vector& params, bool)`
- `uint context(IContext@&)`

### верхний уровень

- `:iface IForm {63E6DC41-7D8E-11D4-9423-008048DA11F9}`

### внутри `IForm`

- `:virt`
- `void prepareForm()`
- `bool setLayouter(const Guid& guid)`
- `пропуск слотов: +2`
- `uint getControlID(uint index)`
- `uint controlsCount()`
- `uint getControl(IUnknown@&out res, uint controlId, const Guid& iid)`
- `uint getActiveControlId()`
- `пропуск слотов: +4`
- `bool activateControl(uint controlId)`

### верхний уровень

- `:iface IFormCtrl {1E7F6215-C9DF-11D4-943C-004095E12FC7}`

### внутри `IFormCtrl`

- `:virt`
- `bool setCode(const v8string& code)`
- `void setTabPos(uint tabPos)`
- `uint getTabPos()`
- `bool getDefaultButton()`
- `void setDefaultButton(bool defaultButton)`
- `void setCommandSourceID(uint id)`
- `uint getCommandSourceID()`
- `void setModifyData(bool modifyData)`
- `bool getModifyData()`
- `void setSkipOnInput(bool skipOnInput)`
- `bool getSkipOnInput()`
- `void setFirstInGroup(bool flag)`
- `bool getFirstInGroup()`

### верхний уровень

- `:iface IFormDialog {9CD510C0-ABFC-11D4-9434-004095E12FC7}`

### внутри `IFormDialog`

- `:virt`
- `bool requestChangeData(uint controlId)`
- `bool processEvents(uint controlId, uint eventId, Vector& params)`
- `bool processChangeData(uint controlId)`
- `bool onExecuteCommand(const Command& command)`
- `bool onQueryCommandStatus(ICommandState& state)`
- `bool requestCommand(const CommandID& id)`
- `bool onExecuteControlCommand(const uint& controlID, const Command& command)`
- `bool onQueryControlCommandStatus(const uint& controlID, ICommandState& state)`
- `bool requestControlCommand(const uint& controlID, const CommandID& id)`
