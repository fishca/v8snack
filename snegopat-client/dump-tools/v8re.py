"""Реверс-помощник по core83.dll (x64): классы по RTTI, их виртуальные таблицы, функции по .pdata.

Нужен, чтобы увидеть, как сдвинулись виртуальные методы между версиями платформы
(Снегопат вызывает их по номеру слота — см. `:virt +N` в v8api/*.v).

    python v8re.py classes <dll> [подстрока]        # классы с vtable: имя, число слотов
    python v8re.py vt <dll> <класс> [n]             # слоты vtable: RVA функции и первые байты/вызовы
    python v8re.py guid <dll> <GUID>                # где в коде используется GUID (функция, класс)
"""
import os
import re
import struct
import sys

import capstone
import pefile


class Image:
    def __init__(self, path):
        self.path = path
        self.pe = pefile.PE(path, fast_load=True)
        self.base = self.pe.OPTIONAL_HEADER.ImageBase
        self.data = open(path, "rb").read()
        self.secs = [(s.Name.rstrip(b"\0").decode(), s.VirtualAddress, max(s.Misc_VirtualSize, s.SizeOfRawData),
                      s.PointerToRawData, s.SizeOfRawData, s.Characteristics) for s in self.pe.sections]
        self._funcs = None
        self._cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
        self._cs.detail = False

    # ── адреса ──
    def off(self, rva):
        for _, va, vsz, raw, rsz, _ in self.secs:
            if va <= rva < va + vsz:
                o = rva - va
                return raw + o if o < rsz else None
        return None

    def read(self, rva, n):
        o = self.off(rva)
        return self.data[o:o + n] if o is not None else b""

    def u64(self, rva):
        b = self.read(rva, 8)
        return struct.unpack("<Q", b)[0] if len(b) == 8 else None

    def sec(self, name):
        for s in self.secs:
            if s[0] == name:
                return s
        return None

    def is_code(self, rva):
        for n, va, vsz, raw, rsz, ch in self.secs:
            if va <= rva < va + vsz:
                return bool(ch & 0x20000000)
        return False

    # ── функции по .pdata ──
    @property
    def funcs(self):
        if self._funcs is None:
            d = self.pe.OPTIONAL_HEADER.DATA_DIRECTORY[3]
            raw = self.read(d.VirtualAddress, d.Size)
            self._funcs = {}
            for i in range(0, len(raw) - 11, 12):
                b, e, _u = struct.unpack_from("<III", raw, i)
                if b:
                    self._funcs[b] = e
        return self._funcs

    def func_start(self, rva):
        """Начало функции, в которую попадает rva (бинарный поиск по .pdata)."""
        if not hasattr(self, "_fs"):
            self._fs = sorted(self.funcs)
        import bisect
        i = bisect.bisect_right(self._fs, rva) - 1
        if i >= 0:
            b = self._fs[i]
            if rva < self.funcs[b]:
                return b
        return None

    def disasm(self, rva, size=64):
        return list(self._cs.disasm(self.read(rva, size), self.base + rva))

    # ── RTTI: классы и vtable ──
    def classes(self):
        """[(имя, смещение_this, vt_rva, [rva функций])] по всем COL, на которые указывает vtable[-1]."""
        if hasattr(self, "_classes"):
            return self._classes
        rd = [s for s in self.secs if s[0] in (".rdata", ".data")]
        # 1. все COL: {rva: (name, offset)}
        cols = {}
        for n, va, vsz, raw, rsz, ch in rd:
            blob = self.data[raw:raw + rsz]
            for m in re.finditer(rb"\x01\x00\x00\x00", blob):
                p = m.start()
                if p % 4 or p + 24 > len(blob):
                    continue
                sig, off, cd, td, cdesc, self_rva = struct.unpack_from("<IIIiii", blob, p)
                col_rva = va + p
                if sig != 1 or self_rva != col_rva or not (0 < td < 0x10000000):
                    continue
                nm = self.read(td + 16, 160).split(b"\0")[0]
                if nm.startswith(b".?A"):
                    cols[col_rva] = (nm.decode("ascii", "replace"), off)
        # 2. vtable: qword == VA(COL), следом — указатели на код
        res = []
        colva = {self.base + r: v for r, v in cols.items()}
        for n, va, vsz, raw, rsz, ch in rd:
            blob = self.data[raw:raw + rsz]
            for p in range(0, len(blob) - 15, 8):
                q = struct.unpack_from("<Q", blob, p)[0]
                if q in colva:
                    vt = va + p + 8
                    fns = []
                    k = 0
                    while True:
                        f = self.u64(vt + 8 * k)
                        if f is None or not (self.base <= f < self.base + 0x20000000) or not self.is_code(f - self.base):
                            break
                        fns.append(f - self.base)
                        k += 1
                    name, off = colva[q]
                    res.append((name, off, vt, fns))
        self._classes = res
        return res


def _runs(self, minlen=2):
    """Массивы подряд идущих указателей в код (кандидаты в vtable): [(rva начала, [rva слотов])].
    Слот — любой адрес внутри .text (маленькие функции-геттеры не имеют записи в .pdata, поэтому «начало функции» не требуем)."""
    if hasattr(self, "_runs_c"):
        return self._runs_c
    import numpy as np
    tx = self.sec(".text")
    lo, hi = self.base + tx[1], self.base + tx[1] + tx[2]
    res = []
    for n, va, vsz, raw, rsz, ch in self.secs:
        if n not in (".rdata", ".data"):
            continue
        arr = np.frombuffer(self.data[raw:raw + rsz - (rsz % 8)], dtype="<u8")
        ok = (arr >= lo) & (arr < hi)
        i, n_ = 0, len(arr)
        while i < n_:
            if ok[i]:
                j = i
                while j < n_ and ok[j]:
                    j += 1
                if j - i >= minlen:
                    res.append((va + i * 8, [int(q - self.base) for q in arr[i:j]]))
                i = j
            else:
                i += 1
    self._runs_c = res
    return res


Image.runs = _runs


def _coderefs(self, lo, hi):
    """RIP-относительные обращения из .text к адресам [lo, hi): [(rva команды-приблизительно, цель)].
    Длина команды после disp32 неизвестна (0/1/2/4 байта imm), перебираем и фильтруем по ModRM (mod=00, rm=101)."""
    import numpy as np
    tx = self.sec(".text")
    base_rva, raw, size = tx[1], tx[3], tx[4]
    blob = self.data[raw:raw + size]
    n = len(blob) - 3
    disp = np.ndarray(shape=(n,), dtype="<i4", buffer=blob, strides=(1,)).astype(np.int64)
    idx = np.arange(n, dtype=np.int64)
    modrm = np.frombuffer(blob, dtype=np.uint8)
    res = []
    for imm in (0, 1, 2, 4):
        t = base_rva + idx + 4 + imm + disp
        hit = np.nonzero((t >= lo) & (t < hi))[0]
        for p in hit:
            if p >= 1 and (modrm[p - 1] & 0xC7) == 0x05:
                res.append((int(base_rva + p - 2), int(t[p])))
    return sorted(set(res))


Image.coderefs = _coderefs


def demangle(n):
    return n[4:].replace("@@", "").split("@") if n.startswith(".?A") else [n]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__)
        return
    cmd, img = a[0], Image(a[1])
    if cmd == "classes":
        flt = a[2].lower() if len(a) > 2 else ""
        cl = img.classes()
        print("классов с vtable:", len(cl))
        for name, off, vt, fns in sorted(cl, key=lambda c: c[0]):
            if flt in name.lower():
                print("%-70s this+%-3d vt=0x%X слотов=%d" % (name, off, vt, len(fns)))
    elif cmd == "vt":
        want, lim = a[2], int(a[3]) if len(a) > 3 else 80
        for name, off, vt, fns in img.classes():
            if name == want or want in name:
                print("== %s this+%d vt=0x%X слотов=%d" % (name, off, vt, len(fns)))
                for i, f in enumerate(fns[:lim]):
                    size = img.funcs.get(f, f) - f
                    ins = img.disasm(f, 24)[:3]
                    print("  [%2d] 0x%X  size=%-5d %s" % (i, f, size, "; ".join("%s %s" % (x.mnemonic, x.op_str) for x in ins)))
    elif cmd == "guid":
        g = a[2].strip("{}").upper()
        d1, d2, d3, d4, d5 = g.split("-")
        pat = struct.pack("<IHH", int(d1, 16), int(d2, 16), int(d3, 16)) + bytes.fromhex(d4 + d5)
        for n, va, vsz, raw, rsz, ch in img.secs:
            i = img.data.find(pat, raw, raw + rsz)
            while i != -1:
                rva = va + (i - raw)
                print("GUID в %s rva=0x%X" % (n, rva))
                # любые RIP-относительные обращения к 16 байтам GUID
                seen = set()
                for at, tgt in img.coderefs(rva, rva + 16):
                    fs = img.func_start(at)
                    if fs in seen:
                        continue
                    seen.add(fs)
                    print("   обращение 0x%X (+%d), функция 0x%X размер %d" % (at, tgt - rva, fs or 0, (img.funcs.get(fs, 0) - fs) if fs else 0))
                    if fs:
                        for st, fns in img.runs():
                            if fs in fns:
                                print("      слот %d в массиве функций 0x%X (длина %d)" % (fns.index(fs), st, len(fns)))
                i = img.data.find(pat, i + 1, raw + rsz)


if __name__ == "__main__":
    main()
