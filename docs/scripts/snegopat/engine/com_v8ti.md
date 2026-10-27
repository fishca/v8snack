## `snegopat/engine/com_v8ti.as`

- Язык: **AngelScript**, строк: **137**, объявлений: **25**
- Назначение: Реализуем ITypeInfo для объектов 1С, преобразованных в IDispatch. Это позволит нормально их просматривать при отладке скриптов /
- Состав: class — 1, func — 22, funcdef — 2

- `bool initV8TypeInfo()` — Создадим объект 1С, преобразуем его в IDispatch, и перехватим у него два метода: GetTypeInfo и GetTypeInfoCount
- `funcdef int FTrap_GetTypeInfoCount(IDispatch&, uint&);`
- `int Trap_GetTypeInfoCount(IDispatch& pDisp, uint& res)`
- `funcdef int FTrap_GetTypeInfo(IDispatch&, uint, uint, IUnknown&&&);`
- `int Trap_GetTypeInfo(IDispatch& pDisp, uint iTInfo, uint lcid, IUnknown&&& ppTInfo)`
- `class IV8TypeInfo` — Порядок функций НЕ МЕНЯТЬ!!! Реализация интерфейса Параметры-указатели — int_ptr: на x64 uint обрезал адреса COM-клиента до 32 бит

### внутри `IV8TypeInfo`

- `int GetTypeAttr(int_ptr ppTypeAttr)`
- `int GetTypeComp(uint)`
- `int GetFuncDesc(uint idx, int_ptr pRet)`
- `int GetVarDesc(uint, uint)`
- `int GetNames(int memid, int_ptr rgBstrNames, uint cMaxNames, int_ptr pcNames)`
- `int GetRefTypeOfImplType(uint, uint)`
- `int GetImplTypeFlags(uint, uint)`
- `int GetIDsOfNames(uint, uint, uint)`
- `int Invoke(uint, uint, uint, uint, uint, uint, uint)`
- `int GetDocumentation(uint, uint, uint, uint, uint)`
- `int GetDllEntry(uint, uint, uint, uint, uint)`
- `int GetRefTypeInfo(uint, uint)`
- `int AddressOfMember(uint, uint, uint)`
- `int CreateInstance(uint, uint, uint)`
- `int GetMops(uint, uint)`
- `int GetContainingTypeLib(uint, uint)`
- `void ReleaseTypeAttr(int_ptr pTypeAttr)`
- `void ReleaseFuncDesc(int_ptr pFuncDesc)`
- `void ReleaseVarDesc(int_ptr pVarDesc)`
