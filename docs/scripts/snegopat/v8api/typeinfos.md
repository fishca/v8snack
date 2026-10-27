## `snegopat/v8api/typeinfos.v`

- Язык: **v8api (.v)**, строк: **250**, объявлений: **133**
- Назначение: Описание интерфейсов 1С.
- Состав: base — 1, iface — 9, method — 36, meths — 3, prop — 59, props — 5, slot-skip — 7, struct — 4, virt — 9

- `:struct list_node`

### внутри `list_node`

- `:props`
- `int_ptr p1`
- `int_ptr p2`
- `int_ptr p3`
- `uint16 f`

### верхний уровень

- `:struct TypeContextInfoItem`

### внутри `TypeContextInfoItem`

- `:meths`
- `void init()`
- `:props`
- `v8string name`
- `bool isMethod`
- `bool haveRetVal`
- `uint params`
- `int from`
- `TypeDomainPattern typeDomain`
- `int_ptr lst_0` — Какой-то список или хэшмап
- `int_ptr lst_4`
- `int_ptr lst_8`
- `int_ptr lst_12`
- `int_ptr lst_16`
- `uint unk1`
- `uint flag1`
- `int_ptr ip1`
- `int_ptr textPos_vt`
- `uint flag0_1`
- `uint flag0_2`
- `Guid objectId`
- `Guid mdPropId`
- `bool isTypeSource`
- `TypeDomainPattern providedTypeDomain`
- `v8string str1`
- `v8string str2`
- `bool byte_0`
- `Vector someVector`
- `пропуск слотов: +100`
- `:meths` — если меньше 8.3.4
- `void init()`
- `:props`
- `v8string name`
- `bool isMethod`
- `bool haveRetVal`
- `uint params`
- `int from`
- `TypeDomainPattern typeDomain`
- `uint buf1_0`
- `uint buf1_1`
- `uint buf1_2`
- `uint buf1_3`
- `uint zero1`
- `uint zero2`
- `uint flag1`
- `v8string sourceString`
- `Guid objectId`
- `Guid mdPropId`
- `bool isTypeSource`
- `TypeDomainPattern providedTypeDomain`
- `v8string tooltip`

### верхний уровень

- `:iface ITypeContextInfo {CAF67C02-2EB2-453D-B2CE-7EDFA5FD2033}`

### внутри `ITypeContextInfo`

- `:virt`
- `uint count()` — Количество элементов.
- `void info(uint index, TypeContextInfoItem& item, int lang)`

### верхний уровень

- `:struct TypeNameInfo`

### внутри `TypeNameInfo`

- `:props`
- `v8string name`
- `Guid uuid`

### верхний уровень

- `:iface ITypeNameInfo {AEF5BA31-D1CF-4C2C-988B-70F314A29761}`

### внутри `ITypeNameInfo`

- `:virt`
- `uint count()`
- `void info(uint idx, TypeNameInfo& item, int lang)`

### верхний уровень

- `:iface ISettingsConsumer {3D66048F-819E-4BD0-B50B-F963E0F0B668}`

### внутри `ISettingsConsumer`

- `:virt`
- `void setSettings(IUnknown@+ value, const Guid& kind)`

### верхний уровень

- `:iface IContextDef {FD7B6CC1-DC8E-11D2-B8D0-008048DA0335}`

### внутри `IContextDef`

- `:virt`
- `int propsCount()`
- `bool isPropReadable(int prop)`
- `bool isPropWritable(int prop)`
- `int findProp(const v8string&in pszPropName)`
- `int methsCount()`
- `int paramsCount(int meth)`
- `bool isParamIn(int meth, int param)`
- `bool isParamOut(int meth, int param)`
- `bool getParamDefValue(int meth, int param, Value& defVal)`
- `bool hasRetVal(int meth)`
- `int findMethod(const v8string&in methName)`

### верхний уровень

- `:iface IContext {FD7B6CC2-DC8E-11D2-B8D0-008048DA0335}`

### внутри `IContextDef`

- `:base IContextDef`
- `:virt`
- `bool getPropVal(int prop, Value& value)`
- `bool setPropVal(int prop, const Value& value)`
- `bool callMeth(int meth, Value& pRetVal, Vector& params)`

### верхний уровень

- `:iface IAssistantData {171BFE39-267E-4690-BD45-4C4B5F5EF973}`

### внутри `IAssistantData`

- `:virt`
- `пропуск слотов: +3`
- `uint object(IUnknown@&)`
- `пропуск слотов: +1`
- `пропуск слотов: +1`

### верхний уровень

- `:struct ContextValueInfo` — Хвост структуры заполняет 1С; на x64 поля могут быть указателями (8 байт). int_ptr на x86 = uint, на x64 — запас: заниженный размер позволял 1С писать за границу структуры

### внутри `ContextValueInfo`

- `:props`
- `v8string nameEng`
- `v8string nameRus`
- `TypeDomainPattern typeDomainPattern`
- `bool isMutable`
- `int_ptr zero1`
- `int_ptr zero2`
- `int_ptr pZero1`
- `int_ptr pZero2`
- `int_ptr zero3`
- `:meths`
- `void init()`
- `void done()`

### верхний уровень

- `:iface IContextDefExt {D74E91C1-6F7C-4D4F-A8C8-6C109BDAA941}`

### внутри `IContextDefExt`

- `:virt`
- `bool isCollection()`
- `void getCollectionItemInfo(ContextValueInfo& valueInfo)`
- `bool notIndexable(int nPropPos)`
- `void propInfo(int prop, ContextValueInfo& valueInfo)`
- `void methRetInfo(int meth, ContextValueInfo& valueInfo)`

### верхний уровень

- `:iface IAssistListInfo {DEE6D279-28B7-4782-82BB-39A6C02E5A81}` — uint propContext(IUnknown@&, int prop) uint methRetContext(IUnknown@&, int meth) bool propIsTypeProvider(int prop, TypeDomainPattern& typeDomainPattern) bool methIsTypeProvider(int meth, TypeDomainPattern& typeDomainPattern)

### внутри `IAssistListInfo`

- `:virt`
- `uint realIndex(uint idx, uint&out realIdx, uint&out p1=void)`
- `пропуск слотов: +2`
- `uint indexFromBkmk(IV8Bookmark& pBkmk)`

### верхний уровень

- `:iface IAssistList {E185016F-CD2C-422b-8D77-F9D5F5234BAE}`

### внутри `IAssistList`

- `:virt`
- `пропуск слотов: +1`
- `uint getDataSource(IV8DataSource@&, ITextEditor& ted, IV8Bookmark@& pBkmk, uint& itemsCount,int i1,int i2,int i3)`
- `uint getDataSource(IV8DataSource@&, ITextEditor& ted, IV8Bookmark@& pBkmk, uint& itemsCount,int i1,int i2,int i3,int i4,int i5,int i6,int i7,int i8,int i9)`
- `uint getDataSource(IV8DataSource@&, ITextEditor& ted, size_t i10, IV8Bookmark@& pBkmk, uint& itemsCount,size_t i1,size_t i2,size_t i3,size_t i4,size_t i5,size_t i6,size_t i7,size_t i8,size_t i9)` — i1..i9 — стековые аргументы (среди них указатель на bool): на x64 должны быть размером с указатель, иначе в 8.3.27 (адреса стека выше 4 ГБ) указатель усекается
- `пропуск слотов: +1`
- `void textByBookmark(IV8DataSource& ds, IV8Bookmark& bkmk, v8string& text, TextPosition& tpBegin, uint&out caretPos)`
- `void textByBookmark(IV8DataSource& ds, IV8Bookmark& bkmk, v8string& text, TextPosition& tpBegin, uint&out caretPos, bool&out=void)`
