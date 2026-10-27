## `snegopat/engine/com_metadata.as`

- Язык: **AngelScript**, строк: **1101**, объявлений: **98**
- Назначение: Работа с метаданными из аддинов. /
- Состав: class — 10, func — 88

- `class IV8MetaData` — Класс для реализации свойства Designer.metadata Предоставляет доступ к открытым в Конфигураторе контейнерам метаданных, а также статической информации, описывающей существующие виды классов и свойств метаданных

### внутри `IV8MetaData`

- `IV8MDContainer&& get_ib()` — [propget, helpstring("Конфигурация ИБ")]
- `IV8MDContainer&& get_current()` — [propget, helpstring("Текущая конфигурация")]
- `IV8MDClass&& mdClass(const string& uuid)` — [helpstring("Получить класс метаданных")]
- `IV8MDProperty&& mdProp(const string& uuid)` — [helpstring("Получить описание свойства объекта метаданных")]
- `uint get_openedCount()` — [propget, helpstring("Количество открытых контейнеров")]
- `IV8MDContainer&& getContainer(uint idx)` — [helpstring("Получить открытый контейнер")]

### верхний уровень

- `class IV8MDContainer` — Класс для работы с контейнером метаданных

### внутри `IV8MDContainer`

- `IMDContainer&& _container()`
- `void _setClosed()`
- `IV8MDObject&& get_rootObject()`
- `IV8MDContainer&& get_masterContainer()`
- `bool get_isModified()`
- `bool get_treeVisible()`
- `void set_treeVisible(bool visible)`
- `IV8MDObject&& findByUUID(const string& uuid)`
- `IV8MDObject&& findByTypeUUID(const string& uuid)`
- `string get_identifier()`
- `bool saveToFile(const string& path)` — metadata.current.saveToFile("e:\\test.cf")
- `IV8MDContainer&& getContainerWrapper(IMDContainer&& container)`

### верхний уровень

- `class V8TypeInfo`
- `class IV8MDClass`

### внутри `IV8MDClass`

- `bool _findPropId(Variant& v, Guid&out id)`
- `bool _findChildId(Variant& v, Guid&out id)`
- `string get_id()`
- `string name(int langAliase, bool pluralForm = false)`
- `string presentation(bool pluralForm = false)`
- `uint get_propertiesCount()`
- `IV8MDProperty&& propertyAt(uint idx)`
- `uint get_childsClassesCount()`
- `IV8MDClass&& childClassAt(uint idx)`
- `IV8MDClass&& getMDClassWrapper(IMDClass&& mdc)`

### верхний уровень

- `class IV8MDProperty`

### внутри `IV8MDProperty`

- `string get_id()`
- `string name(int langAliase)`
- `string get_description()`
- `string get_category()`
- `IV8MDProperty&& getMDPropWrapper(MDPropertyRef&& mdp)`
- `IV8MDObject&& getMDObjectWrapper(IMDObject&& obj)` — Тут я пока в раздумьях - хранить ли где-нибудь соответствие между 1Сным объектом и нашей обёрткой. Ведь тогда придется как-то отслеживать их время жизни. Пока буду каждый раз создавать новую обёртку, и добавлю метод isSame для сравнения на одинаковость объектов.

### верхний уровень

- `class IV8MDObject`

### внутри `IV8MDObject`

- `bool isSame(IV8MDObject&& other)`
- `string get_id()`
- `IV8MDClass&& get_mdclass()`
- `IV8MDObject&& get_parent()`
- `Variant property(Variant propID)`
- `bool setProperty(Variant propID, Variant value)`
- `uint childObjectsCount(Variant childClassID)`
- `IV8MDObject&& childObject(Variant childClassID, Variant idx)`
- `IV8MDContainer&& get_container()`
- `void activateInTree()`
- `void editProperty(Variant propID)`
- `void openEditor()`
- `string get_name()`
- `string synonym(const string& langCode)`
- `string get_comment()`
- `bool isPropModule(Variant propIdx)`
- `string getModuleText(Variant propIdx)`
- `void setModuleText(Variant propIdx, const string& text)`
- `ITextWindow&& openModule(Variant propIdx)`
- `string extPropUUID(Variant propIdx)`
- `IV8ExtProp&& getExtProp(Variant propIdx)`
- `IV8DataFile&& saveToFile(IV8DataFile&& fileIn = null)`
- `bool loadFromFile(IV8DataFile&& file)`
- `Variant get_picture()`
- `IObjectProperties&& get_props()`

### верхний уровень

- `class IV8ExtProp`

### внутри `IV8ExtProp`

- `string get_url()`
- `string probe()` — Диагностика: какие описанные интерфейсы поддерживает значение свойства (object — редактор, raw — IMDExtObj)
- `string get_idData()`
- `string get_idEditor()`
- `string get_title()`
- `bool get_isReadOnly()`
- `IV8DataFile&& saveToFile(IV8DataFile&& file = null)`
- `bool loadFromFile(IV8DataFile&& file)`
- `Variant getForm()`
- `IV8DataFile&& saveObject(IV8DataFile&& file, IUnknown&& obj)`
- `bool loadObject(IV8DataFile&& file, IUnknown&& obj)`

### верхний уровень

- `class IObjectProperties`

### внутри `IObjectProperties`

- `int get_count()`
- `string propName(int idx)`
- `Variant getValue(Variant idx)`
- `void setValue(Variant idx, Variant val)`
- `void activateProperty(Variant idx)`
- `int_ptr variantPtr(const Variant& v)` — Указатель из Variant (BSTR и т.п.): на x64 он 64-битный, dword даёт только младшие 32 бита (падение при чтении строки)
- `IConfigMngr&& getConfigMgrOf(IInfoBase&& ib)` — IInfoBase.getConfigMgr: в 8.3.27 и 8.5.x слот возвращает общий объект, нужный IConfigMngr получаем явным QueryInterface (неявное приведение)
- `IMDContainer&& getIBMDCont()`
- `IMDContainer&& editedMetaDataCont()`
- `string mdObjName(IMDObject&& object)`
- `string mdObjFullName(IMDObject&& object)`
- `string mdPropName(const Guid& mdPropID)`
- `void setTrapOnOpenConfig()`
- `void trapOpenConfig(IMDEditService& pService, IConfigMngrUI& mngr, IMDContainer& container)`

### верхний уровень

- `class IV8MetaDataEvent`
- `class MetaDataEvent`

### внутри `MetaDataEvent`

- `void onEvent(const Guid&in eventID, MDEventInfo& info, IUnknown& obj)`
- `Variant image2pict(IUnknown&& img)`
- `IMDContainer&& getMasterContainer(IMDContainer&& cont)`
- `void walkMD(IV8MDObject&& obj)`
