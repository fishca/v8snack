"""Сравнение двух наборов дампов `*.vtable` (рабочая и целевая платформа): куда сдвинулись объявленные в .v методы.

Дампы снимает режим `-coreas-tracefunctions 1` (v8run.py --extra …) — по одному файлу на интерфейс. Скрипт для каждого интерфейса,
который есть в обоих наборах, берёт код функций из DLL обеих платформ (функции предполагаются в том же модуле, что и vtable;
переходники `sub rcx,N; jmp` разворачиваются), выравнивает последовательности функций по «отпечаткам» (difflib) и печатает:
  - соответствие слотов «объявленный метод 17 → слот 27» (если слот попал в блок совпадения), либо «?»;
  - число слотов, найденных в блоках совпадения, и модуль vtable в каждой версии (смена модуля = реализация переехала).

    python vtcmp.py --old research/dump17 --new research/dump27 --old-bin "C:/Program Files/1cv8/8.3.17.1549/bin" \\
        --new-bin research/dll/8.3.27.1859 [--agent <агент> --new-remote "C:/Program Files/1cv8/8.3.27.1859/bin"] [--only IFileSystem …]

DLL новой версии берутся из --new-bin; если файла нет и указан --agent, он скачивается с клиента (sys.read).
"""
import argparse
import base64
import difflib
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v8re  # noqa: E402
import vtalign  # noqa: E402


def parse(path):
    t = open(path, encoding="utf-8", errors="replace").read()
    mod = re.search(r"Vtable in (\S+)", t)
    fs = [(int(a), b.strip(), int(c, 16)) for a, b, c in
          re.findall(r"Function (\d+)([^\n]*)\n\s+address is 0x[0-9A-Fa-f]+ - offset is 0x([0-9A-Fa-f]+)", t)]
    return (mod.group(1) if mod else "?"), fs


class Images:
    def __init__(self, folder, remote_folder=None, hub=None, agent=None):
        self.folder, self.remote, self.hub, self.agent = folder, remote_folder, hub, agent
        self.cache = {}

    def get(self, module):
        if module in self.cache:
            return self.cache[module]
        if module in ("?", "", None):
            self.cache[module] = None
            return None
        p = os.path.join(self.folder, module)
        if not os.path.exists(p) and self.hub and self.remote:
            os.makedirs(self.folder, exist_ok=True)
            try:
                r = self.hub.call(self.agent, "sys.read", {"path": self.remote.rstrip("/") + "/" + module, "b64": True, "max": 128 << 20}, timeout=900)
                open(p, "wb").write(base64.b64decode(r["b64"]))
            except SystemExit:
                pass
        self.cache[module] = v8re.Image(p) if os.path.exists(p) else None
        return self.cache[module]


def fingerprints(im, fs):
    res = []
    for _, _, off in fs:
        try:
            res.append(vtalign.fingerprint(im, off))
        except Exception:
            res.append("?")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--old", required=True)
    ap.add_argument("--new", required=True)
    ap.add_argument("--old-bin", required=True)
    ap.add_argument("--new-bin", required=True)
    ap.add_argument("--agent")
    ap.add_argument("--new-remote")
    ap.add_argument("--only", nargs="*", default=[])
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    hub = None
    if a.agent:
        try:
            import remote
        except ImportError:
            sys.exit("--agent есть только в полной версии проекта; здесь положите DLL платформы в папку --new-bin")
        real = remote.Hub()

        class H:  # обёртка вызова агента
            def call(self, agent, op, args, timeout=60):
                return real.call(agent, op, args, timeout=timeout)
        hub = H()
    old_imgs, new_imgs = Images(a.old_bin), Images(a.new_bin, a.new_remote, hub, a.agent)
    names = sorted(n[:-7] for n in os.listdir(a.old) if n.endswith(".vtable") and os.path.exists(os.path.join(a.new, n)))
    if a.only:
        names = [n for n in names if n in a.only]
    print("интерфейсов в обоих наборах: %d" % len(names))
    for n in names:
        m17, f17 = parse(os.path.join(a.old, n + ".vtable"))
        m27, f27 = parse(os.path.join(a.new, n + ".vtable"))
        i17, i27 = old_imgs.get(m17), new_imgs.get(m27)
        head = "%-24s 17:%s(%d сл.) → 27:%s(%d сл.)" % (n, m17, len(f17), m27, len(f27))
        if i17 is None or i27 is None:
            print(head + "   [нет DLL для разбора]")
            continue
        fp1, fp2 = fingerprints(i17, f17), fingerprints(i27, f27)
        sm = difflib.SequenceMatcher(None, fp1, fp2, autojunk=False)
        blocks = [(i1, i2, j1, j2) for tg, i1, i2, j1, j2 in sm.get_opcodes() if tg == "equal"]
        matched = sum(i2 - i1 for i1, i2, _, _ in blocks)
        print("\n" + head + "   совпало слотов: %d" % matched + ("   !! МОДУЛЬ ИЗМЕНИЛСЯ" if m17.lower() != m27.lower() else ""))
        for num, desc, _ in f17:
            if not desc or num < 3:
                continue
            hit = [(i1, j1) for i1, i2, j1, j2 in blocks if i1 <= num < i2]
            if hit:
                new = hit[0][1] + num - hit[0][0]
                print("   17[%2d] %-50s → 27[%d]%s" % (num, desc[:50], new, "" if new == num else "  (сдвиг %+d)" % (new - num)))
            else:
                print("   17[%2d] %-50s → ? (не в блоке совпадения)" % (num, desc[:50]))


if __name__ == "__main__":
    main()
