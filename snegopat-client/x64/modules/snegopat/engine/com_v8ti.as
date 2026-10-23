/*
 * (c) проект "Snegopat.Module", Александр Орефков orefkov@gmail.com
 * Реализуем ITypeInfo для объектов 1С, преобразованных в IDispatch.
 * Это позволит нормально их просматривать при отладке скриптов
 */

// Данные строки нужны только для среды разработки и вырезаются препроцессором
#pragma once
#include "../all.h"


//Packet v8TypeInfo("v8TypeInfo", initV8TypeInfo, piOnDesignerInit);
TrapVirtualStdCall trGetTypeInfoCount;
TrapVirtualStdCall trGetTypeInfo;

// Создадим объект 1С, преобразуем его в IDispatch, и перехватим у него два метода:
// GetTypeInfo и GetTypeInfoCount
bool initV8TypeInfo() {
    Variant var;
    Value val;
    currentProcess().createByClsid(CLSID_TxtEdtDoc, IID_IValue, val.pValue);
    val2var(val, var);
    IDispatch&& pDisp = var.getDispatch();
    trGetTypeInfoCount.setTrap(pDisp, 3, Trap_GetTypeInfoCount);
    trGetTypeInfo.setTrap(pDisp, 4, Trap_GetTypeInfo);
    return true;
}

funcdef int FTrap_GetTypeInfoCount(IDispatch&, uint&);
int Trap_GetTypeInfoCount(IDispatch& pDisp, uint& res) {
    return 1;
    /*
    FTrap_GetTypeInfoCount&& original;
    trGetTypeInfoCount.getOriginal(&&original);
    if (0 != original(pDisp, res) || res == 0)
        res = 1;
    return 0;*/
}

funcdef int FTrap_GetTypeInfo(IDispatch&, uint, uint, IUnknown&&&);
int Trap_GetTypeInfo(IDispatch& pDisp, uint iTInfo, uint lcid, IUnknown&&& ppTInfo) {
    /*FTrap_GetTypeInfo&& original;
    trGetTypeInfo.getOriginal(&&original);
    if (0 == original(pDisp, iTInfo, lcid, ppTInfo) && ppTInfo !is null) // У объекта свой ITypeInfo
        return 0;*/
    ICtx2Disp&& iface = cast<IUnknown>(pDisp);
    IContext&& ctx = iface.getContext();
    //Print("meths=" + ctx.staticContextDef().methsCount() + " " + string(ctx.staticContextDef().methName(0, 1)));
    &&ppTInfo = AStoIUnknown(IV8TypeInfo(ctx), IID_ITypeInfo);
    ppTInfo.AddRef();
    return 0;
}

enum ComConst {
    E_NOTIMPL   = int(0x80004001),
    E_FAIL      = int(0x80004005),
    maxMethCount = 100001,
};

// Порядок функций НЕ МЕНЯТЬ!!! Реализация интерфейса
// Параметры-указатели — int_ptr: на x64 uint обрезал адреса COM-клиента до 32 бит
class IV8TypeInfo {
    IV8TypeInfo(IContext&& c) {
        &&ctx = c;
    }
    IContext&& ctx;
    int GetTypeAttr(int_ptr ppTypeAttr) {
        IContextDef&& def = ctx;
        TYPEATTRRef&& ta = toTYPEATTR(malloc(TYPEATTR_size));
        mem::memset(ta.self, 0, TYPEATTR_size);
        ta.ref.guid = IID_IDispatch;
        ta.ref.memidConstructor = -1;
        ta.ref.memidDestructor = -1;
        ta.ref.typekind = TKIND_DISPATCH;
        ta.ref.cFuncs = def.methsCount() + def.propsCount();
        ta.ref.cImplTypes = 1;
        mem::int_ptr[ppTypeAttr] = ta.self;
        return 0;
    }
    int GetTypeComp(uint) { return E_NOTIMPL; }
    int GetFuncDesc(uint idx, int_ptr pRet) {
        IContextDef&& def = ctx;
        uint metCount = uint(def.methsCount());
        bool isFunc = idx < metCount;
        FUNCDESCRef&& fd = toFUNCDESC(malloc(FUNCDESC_size));
        mem::memset(fd.self, 0, FUNCDESC_size);
        fd.ref.memid = isFunc ? idx : maxMethCount + idx - metCount;
        fd.ref.funckind = FUNC_DISPATCH;
        fd.ref.invkind = isFunc ? INVOKE_FUNC : INVOKE_PROPERTYGET;
        mem::int_ptr[pRet] = fd.self;
        return 0;
    }
    int GetVarDesc(uint, uint) { return E_NOTIMPL; }
    int GetNames(int memid, int_ptr rgBstrNames, uint cMaxNames, int_ptr pcNames) {
        if (cMaxNames > 0) {
            int_ptr res = 0;
            IContextDef&& def = ctx;
            if (memid < maxMethCount) {
                if (memid < def.methsCount())
                    res = SysAllocString(def.methName(memid, 1));
                else
                    return E_FAIL;
            }
            else {
                uint propIdx = memid - maxMethCount;
                if (propIdx < uint(def.propsCount()))
                    res = SysAllocString(def.propName(propIdx, 1));
                else
                    return E_FAIL;
            }
            mem::int_ptr[rgBstrNames] = res;
            mem::dword[pcNames] = 1;
            return 0;
        }
        return E_FAIL;
    }
    int GetRefTypeOfImplType(uint, uint)                   { return E_NOTIMPL; }
    int GetImplTypeFlags(uint, uint)                       { return E_NOTIMPL; }
    int GetIDsOfNames(uint, uint, uint)                    { return E_NOTIMPL; }
    int Invoke(uint, uint, uint, uint, uint, uint, uint)   { return E_NOTIMPL; }
    int GetDocumentation(uint, uint, uint, uint, uint)     { return E_NOTIMPL; }
    int GetDllEntry(uint, uint, uint, uint, uint)          { return E_NOTIMPL; }
    int GetRefTypeInfo(uint, uint)                         { return E_NOTIMPL; }
    int AddressOfMember(uint, uint, uint)                  { return E_NOTIMPL; }
    int CreateInstance(uint, uint, uint)                   { return E_NOTIMPL; }
    int GetMops(uint, uint)                                { return E_NOTIMPL; }
    int GetContainingTypeLib(uint, uint)                   { return E_NOTIMPL; }
    void ReleaseTypeAttr(int_ptr pTypeAttr) {
        free(pTypeAttr);
    }
    void ReleaseFuncDesc(int_ptr pFuncDesc) {
        free(pFuncDesc);
    }
    void ReleaseVarDesc(int_ptr pVarDesc) {
        free(pVarDesc);
    }
};
