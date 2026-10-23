"""Сопоставление виртуальных таблиц одного интерфейса в двух версиях платформы (по дампам из работающего Снегопата).

Дамп делает код dbgDumpVT (engine/com_metadata.as, включается файлом logs/vt.on): в logs/vt-dump.bin дописывается запись
[tag, адрес объекта, адрес vtable, маркер] + 130 слотов. Дамп снимается и на рабочей версии (локально), и на целевой (у клиента).

    python vtalign.py --tag 2 --slot17 85 --pid17 20688 --pid27 233552 --agent <агент> [--old-skip 85]

Слоты выравниваются difflib по «отпечаткам» функций (последовательность мнемоник). Сдвиг блока вокруг нужного слота даёт
новый слот; число пропуска в .v (`N` перед методом) меняется на ту же величину.
"""
import argparse
import base64
import difflib
import hashlib
import json
import os
import struct
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v8re  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.abspath(os.path.join(HERE, "..", "research"))
NSLOTS = 130


def records(data):
    out, p = [], 0
    while p + 32 <= len(data):
        tag, obj, vt, mark = struct.unpack_from("<4Q", data, p)
        if mark != 0x4242424242424242:
            break
        p += 32
        slots = None
        if vt:
            slots = list(struct.unpack_from("<%dQ" % NSLOTS, data, p))
            p += 8 * NSLOTS
        out.append((tag, obj, vt, slots))
    return out


def modules_local(pid):
    ps = subprocess.run(["powershell", "-NoProfile", "-Command",
                         "(Get-Process -Id %d).Modules | ForEach-Object { $_.ModuleName + '|' + $_.BaseAddress.ToInt64() + '|' + $_.ModuleMemorySize + '|' + $_.FileName }" % pid],
                        capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
    res = []
    for line in ps.splitlines():
        if line.count("|") >= 3:
            n, b, s, f = line.split("|", 3)
            res.append((int(b), int(s), n, f))
    return res


def find_module(mods, addr):
    for b, s, n, f in mods:
        if b <= addr < b + s:
            return b, n, f
    return None, None, None


def resolve_thunk(im, rva, depth=3):
    """Переходник `sub/add rcx, N; jmp цель` (правка this у вторичного базового класса) → адрес настоящей функции."""
    for _ in range(depth):
        ins = list(im._cs.disasm(im.read(rva, 24), im.base + rva))[:2]
        if len(ins) == 2 and ins[0].mnemonic in ("sub", "add") and ins[0].op_str.startswith("rcx,") and ins[1].mnemonic == "jmp"                 and ins[1].op_str.startswith("0x"):
            rva = int(ins[1].op_str, 16) - im.base
        else:
            break
    return rva


def fingerprint(im, rva):
    rva = resolve_thunk(im, rva)
    ins = []
    for i in im._cs.disasm(im.read(rva, 600), im.base + rva):
        ins.append(i.mnemonic)
        if i.mnemonic == "ret" or len(ins) > 220:
            break
        if i.mnemonic == "jmp" and len(ins) < 4:
            break
    return hashlib.md5(" ".join(ins).encode()).hexdigest()[:8]


def show(im, rva, n=3):
    rva = resolve_thunk(im, rva)
    return "; ".join("%s %s" % (i.mnemonic, i.op_str) for i in im._cs.disasm(im.read(rva, 40), 0))[:90]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", type=int, required=True)
    ap.add_argument("--slot17", type=int, nargs="+", required=True)
    ap.add_argument("--pid17", type=int, required=True)
    ap.add_argument("--pid27", type=int, required=True)
    ap.add_argument("--agent", required=True)
    ap.add_argument("--ver27", default="8.3.27.1859")
    ap.add_argument("--old-skip", type=int, help="текущее число пропуска в .v для этого метода (для подсказки)")
    ap.add_argument("--dump17", default=os.path.join(HERE, "..", "x64", "logs", "vt-dump.bin"), help="дамп рабочей версии (локально); у клиента — x64/logs/vt-dump.bin")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    try:
        import remote
    except ImportError:
        sys.exit("vtalign.py как программа работает через агента и есть только в полной версии проекта; fingerprint() из него используется vtcmp.py")
    hub = remote.Hub()

    def call(op, args, t=300):
        r = hub.request("call", timeout=t, agent=a.agent, aop=op, args=args)
        if not r.get("ok"):
            sys.exit("агент: %s" % r.get("error"))
        return r.get("result")

    # 17: локальный дамп и модули
    d17 = [r for r in records(open(a.dump17, "rb").read()) if r[0] == a.tag][-1]
    m17 = modules_local(a.pid17)
    b17, n17, f17 = find_module(m17, d17[2])
    # 27: дамп с клиента и модули
    raw27 = base64.b64decode(call("fs.read", {"path": "x64/logs/vt-dump.bin", "b64": True, "max": 1 << 20})["b64"])
    d27 = [r for r in records(raw27) if r[0] == a.tag][-1]
    m27 = [(int(m["base"], 16), m["size"], m["name"], m["path"]) for m in call("proc.modules", {"pid": a.pid27, "filter": ""})]
    b27, n27, f27 = find_module(m27, d27[2])
    print("17: vtable в %s (RVA 0x%X)   27: vtable в %s (RVA 0x%X)" % (n17, d17[2] - b17, n27, d27[2] - b27))
    if n17.lower() != n27.lower():
        # Реализация интерфейса переехала между DLL (например, backend.dll -> rtrsrvc.dll): отпечатки функций от модуля не зависят,
        # поэтому выравниваем таблицы, беря образ каждой стороны из своего модуля
        print("  модули РАЗНЫЕ (%s -> %s): реализация переехала, сопоставляю по отпечаткам функций" % (n17, n27))
    os.makedirs(os.path.join(RES, "dll", "8.3.17.1549"), exist_ok=True)
    p17 = f17
    p27 = os.path.join(RES, "dll", a.ver27, n27)   # n27 — модуль 27-й стороны (может отличаться от n17)
    if not os.path.exists(p27):
        os.makedirs(os.path.dirname(p27), exist_ok=True)
        r = call("sys.read", {"path": f27, "b64": True, "max": 64 << 20})
        open(p27, "wb").write(base64.b64decode(r["b64"]))
    im17, im27 = v8re.Image(p17), v8re.Image(p27)
    s17 = [x - b17 for x in d17[3]]
    s27 = [x - b27 for x in d27[3]]
    f1 = [fingerprint(im17, x) for x in s17]
    f2 = [fingerprint(im27, x) for x in s27]
    sm = difflib.SequenceMatcher(None, f1, f2, autojunk=False)
    blocks = [(i1, i2, j1, j2) for tg, i1, i2, j1, j2 in sm.get_opcodes() if tg == "equal"]
    print("блоков совпадения: %d (из них слотов %d из %d)" % (len(blocks), sum(i2 - i1 for i1, i2, _, _ in blocks), NSLOTS))
    for s in a.slot17:
        hit = [(i1, i2, j1, j2) for i1, i2, j1, j2 in blocks if i1 <= s < i2]
        if not hit:
            print("\nслот 17[%d] не попал в блок совпадения — нужен ручной разбор" % s)
            continue
        i1, i2, j1, j2 = hit[0]
        s27n = j1 + (s - i1)
        print("\nслот 17[%d] -> 27[%d]  (блок 17[%d:%d] <-> 27[%d:%d], длина %d)" % (s, s27n, i1, i2, j1, j2, i2 - i1))
        print("   17: %s" % show(im17, s17[s]))
        print("   27: %s" % show(im27, s27[s27n]))
        delta = s27n - s
        print("   сдвиг %+d%s" % (delta, ("  => число пропуска в .v: %d -> %d" % (a.old_skip, a.old_skip + delta)) if a.old_skip is not None else ""))
    json.dump({"s17": s17, "s27": s27, "module": n27}, open(os.path.join(RES, "vt-tag%d.json" % a.tag), "w"))


if __name__ == "__main__":
    main()
