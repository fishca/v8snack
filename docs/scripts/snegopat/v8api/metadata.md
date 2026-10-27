## `snegopat/v8api/metadata.v`

- Язык: **v8api (.v)**, строк: **594**, объявлений: **193**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 3, iface — 16, method — 59, meths — 4, prop — 31, props — 5, slot-skip — 51, struct — 5, virt — 19

- `:virt`
- `uint getEditHelper(IMDEditHelper@&, IMDObject&object)`
- `void openConfig(IConfigMngrUI& mngr, IMDContainer& container)`
- `uint getConfigMngrUI(IConfigMngrUI@&, IMDObject@+)`
- `uint getTemplatesMainConfigMngrUI(IConfigMngrUI@&)`
- `:virt`
- `пропуск слотов: +1`
- `uint connectConfig(IConfigMngr@& res, IFile@ file, int mode)`
- `uint connectConfig(IConfigMngr@& res, IFile@ file, int mode, int t=0)`
- `uint connectConfig(IConfigMngr@& res, IFile@ file, int mode, int t=0, int m=0)`
- `uint getDefault(IInfoBase@&)`
- `:virt`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `:iface IConfigMngrUI {B725F668-13C8-4BFF-90B9-33E19AA42E06}`

### внутри `IConfigMngrUI`

- `:virt`
- `void mdTreeShow(bool show, bool activate = true)`
- `bool mdTreeIsVisible()`
- `пропуск слотов: +1`
- `uint getPictureCol(IUnknown@&)`
- `пропуск слотов: +1`
- `uint getLangSettings(ILangSettings@&)`
- `uint getStyleCol(IUnknown@&)`
- `uint getTypesInfoProvider(ITypesInfoProvider@&)`
- `пропуск слотов: +4`
- `bool isModified()`
- `пропуск слотов: +4`
- `v8string identifier()`
- `пропуск слотов: +3`
- `void activateObjInTree(const Guid& uuid, const Guid& propId, bool wndActivate)`

### верхний уровень

- `:iface ITypesInfoProvider {936EFFDE-1F59-4498-816F-8D495E205838}`

### внутри `ITypesInfoProvider`

- `:virt`
- `void typesInfo(const Guid& category, int alias, Vector& typesInfo)`
- `пропуск слотов: +3`
- `uint dataProviderInfo(IDataProviderInfo@&, const Guid& type, int k = 0)`

### верхний уровень

- `:iface IDataProviderInfo {174FD971-DF4E-4B5E-9EC6-A05527338A45}`

### внутри `IDataProviderInfo`

- `:virt`
- `uint fieldsCount()`
- `uint fieldId(CompositeID&out, uint idx)`
- `uint defaultField(CompositeID&out)` — идентификатор поля по умолчанию
- `bool fieldInfo(const CompositeID& id, FieldInfo& info)` — информация о поле по идентификатору

### верхний уровень

- `:iface IMDObject {12BFDDD0-36CC-11D4-940F-008048DA11F9}`

### внутри `IMDObject`

- `:virt`
- `пропуск слотов: +1`
- `void set_id(const Guid& id)`
- `void set_mdParentLink(IMDParentLink@+ site)`
- `пропуск слотов: +3`
- `int mdPropVal(const Guid& mdPropId, Value& value)`
- `bool setMdPropVal(const Guid& mdPropId, const Value& value)`
- `bool validateMDPropValue(const Guid& mdPropId, Value& value, v8string& errString, bool)`
- `int mdPropVal(uint id, Value& value)`
- `bool setMdPropVal(uint id, const Value& value)`
- `bool validateMdPropVal(uint id, Value& value, v8string& errString, bool)`
- `пропуск слотов: +1`
- `uint childCount(const Guid& childMdKind)`
- `пропуск слотов: +9`
- `пропуск слотов: +1`
- `пропуск слотов: +2`
- `пропуск слотов: +1`
- `bool isModified()`
- `void setModified(bool modified)`
- `пропуск слотов: +5`

### верхний уровень

- `:iface IMDContainer {12BFDDD2-36CC-11D4-940F-008048DA11F9}`

### внутри `IMDObject`

- `:base IMDObject`
- `:virt`
- `пропуск слотов: +2`
- `пропуск слотов: +6`
- `пропуск слотов: +7`
- `пропуск слотов: +7`
- `пропуск слотов: +7`
- `пропуск слотов: +8`
- `пропуск слотов: +4`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IMDParentLink {6F00D0F0-4DAD-11D4-9415-008048DA11F9}`

### внутри `IMDParentLink`

- `:virt`

### верхний уровень

- `:iface IMDClass {12BFDDD1-36CC-11D4-940F-008048DA11F9}`

### внутри `IMDClass`

- `:virt`
- `пропуск слотов: +1`
- `uint propCount()`
- `пропуск слотов: +4`
- `пропуск слотов: +2`
- `пропуск слотов: +1`
- `uint childClassesCount()`

### верхний уровень

- `:iface IConfigMngr {DE9DE45C-5440-403A-840F-48AD6D581E35}`

### внутри `IConfigMngr`

- `:virt`
- `void extractConfig(IConfigMngr& target)`

### верхний уровень

- `:iface IConfigMngrUIOwner {FE226A57-F6F0-455f-9CDC-F916AC901CC2}`

### внутри `IConfigMngrUIOwner`

- `:virt`

### верхний уровень

- `:iface IInfoBase {D1344594-BE0C-4135-BF15-753C1C75D554}`

### внутри `IInfoBase`

- `:virt`
- `пропуск слотов: +2`
- `v8string connectString()`

### верхний уровень

- `:iface IMDEditHelper {888744F9-B616-11D4-9436-004095E12FC7}`

### внутри `IMDEditHelper`

- `:virt`
- `void getTreeItemInfo(const Guid& id, MDTreeItemInfo& info, int k = 0)`
- `пропуск слотов: +4`
- `void openEditor()`
- `пропуск слотов: +4`
- `bool changeProperty(const Guid& propId, const Value& value)`
- `void editProperty(const Guid& propUuid)`
- `пропуск слотов: +3`
- `uint extPropEditor(IUnknown@&, const Guid& propUuid)`
- `uint extProp(IUnknown@&, const Guid& propUuid, bool noCached = false)`
- `uint extPropEditor(IUnknown@&, const Guid& propUuid)`
- `uint extProp(IUnknown@&, const Guid& propUuid, bool noCached = false)`
- `void getTreeItemInfo(const Guid& id, MDTreeItemInfo& info, int k = 0)`
- `пропуск слотов: +4`
- `void openEditor()`
- `пропуск слотов: +4`
- `пропуск слотов: +6`
- `bool changeProperty(const Guid& propId, const Value& value)`
- `void editProperty(const Guid& propUuid)`

### верхний уровень

- `:iface IMDBaseObj {D3624077-1010-45F0-A596-77ADD399D777}`

### внутри `IMDObject`

- `:base IMDObject`
- `:virt`
- `пропуск слотов: +4`
- `пропуск слотов: +1`
- `v8string getSynonym(const v8string&in lc)`
- `пропуск слотов: +1`
- `пропуск слотов: +5`

### верхний уровень

- `:iface ILocalString {FD68C620-4B24-11D4-9415-008048DA11F9}`

### внутри `ILocalString`

- `:virt`
- `пропуск слотов: +1`

### верхний уровень

- `:iface IMDEditModuleHelper {963CE56B-FCF9-4E6D-8EBC-374721B63ABA}`

### внутри `IMDEditModuleHelper`

- `:virt`
- `bool hasModule(const Guid& propId, Vector&)`
- `пропуск слотов: +1`
- `bool textOfModule(const Guid& propId, bool s, v8string&out result)`
- `пропуск слотов: +2`
- `пропуск слотов: +1`
- `пропуск слотов: +1`
- `uint openModule(ITextManager@&, const Guid& propId, bool s, bool open, ITextEditor@& editor)`
- `uint openModule(ITextManager@&, const Guid& propId, uint32& open, ITextEditor@& editor)`

### верхний уровень

- `:iface IMDTypedObj {752BB41D-05DA-4FD1-A680-78DFB6C6EB1C}`

### внутри `IMDBaseObj`

- `:base IMDBaseObj`
- `:virt`
- `пропуск слотов: +5`

### верхний уровень

- `:iface IMDExtObj {E80EA0D4-FE4C-446F-9567-9833A72DD396}`

### внутри `IMDExtObj`

- `:virt`
- `пропуск слотов: +11`
- `uint url(URL&)`

### верхний уровень

- `:struct MDProperty`

### внутри `MDProperty`

- `:props`
- `int vt`
- `int refs`
- `Guid id`
- `int_ptr nameEng`
- `int_ptr nameRus`
- `size_t i1`
- `size_t i2`
- `int_ptr resMod1`
- `int_ptr resID`
- `int_ptr resMod2`
- `int_ptr resCatID`

### верхний уровень

- `:struct FieldInfo`

### внутри `FieldInfo`

- `:props`
- `v8string name1`
- `v8string name2`
- `v8string description`
- `TypeDomainPattern typeDomain`
- `bool readOnly`
- `:meths`
- `void init()`

### верхний уровень

- `:struct MDEventInfo`

### внутри `MDEventInfo`

- `:props`
- `bool request`
- `bool result`
- `EventMetaDataKind kind`
- `Guid id`
- `Guid changedPropId`

### верхний уровень

- `:struct TypeInfo`

### внутри `TypeInfo`

- `:props`
- `Guid typeId`
- `v8string name`
- `int priority`
- `int order`
- `uint i1`
- `bool compaundType`
- `bool unMergeable`
- `v8string str`
- `пропуск слотов: +4`
- `:meths`
- `void dtor()`

### верхний уровень

- `:struct MDTreeItemInfo`

### внутри `MDTreeItemInfo`

- `:props`
- `Guid id`
- `v8string text`
- `пропуск слотов: +40`
- `:meths`
- `void init()`
- `:meths`
