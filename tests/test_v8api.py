"""Структурные тесты v8api (.v-файлы) и ссылок движка на слоты.

Запуск: python -m unittest discover -s tests (из корня репозитория).
"""

import os
import re
import sys
import unittest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO, "tests"))

import vparse  # noqa: E402

X64 = os.path.join(REPO, "snegopat-client", "x64")
V8API = os.path.join(X64, "modules", "snegopat", "v8api")
MAIN_API = os.path.join(X64, "modules", "main", "api")
ENGINE = os.path.join(X64, "modules", "snegopat", "engine")

# версии, под которыми модуль обязан собираться (см. test_compile)
SUPPORTED = [(8, 3, 10), (8, 3, 17, 1549), (8, 3, 18), (8, 3, 24),
             (8, 3, 25, 1633), (8, 3, 27, 1989)]
GUARDED = [(8, 3, 28), (8, 5, 1, 1236), (8, 5, 1, 960)]


def load():
    vs = vparse.VSet(V8API)
    vm = vparse.VSet(MAIN_API)
    return vs, vm


class TestParse(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vs, cls.vm = load()

    def test_all_files_parsed(self):
        self.assertGreater(len(self.vs.files), 20, "мало .v файлов в v8api")
        for fn in self.vs.files:
            self.assertTrue(fn.endswith(".v"), fn)

    def test_entities_have_guids(self):
        empty = [e.name for e in self.vs.entities.values()
                 if not e.guid or len(e.guid) != 36]
        self.assertEqual(empty, [], "интерфейсы/службы без GUID: %s" % empty)

    def test_bases_resolve(self):
        missing = []
        for name, ent in self.vs.entities.items():
            if ent.base:
                if ent.base not in self.vs.entities:
                    missing.append("%s -> %s" % (name, ent.base))
                else:
                    try:
                        self.vs.base_chain(name)
                    except vparse.VError:
                        missing.append("цикл: %s" % name)
        self.assertEqual(missing, [], "битые базовые интерфейсы: %s" % missing)

    def test_no_dup_methods_per_interface(self):
        # оверлоады (одно имя, разные сигнатуры) допустимы — но не более двух на интерфейс
        bad = []
        for ent in self.vs.entities.values():
            seen = {}
            for mode, _val, mname, _desc in ent.virt_entries((8, 3, 27, 1989)):
                if mode == "m" and mname:
                    seen[mname] = seen.get(mname, 0) + 1
            for name, cnt in seen.items():
                if cnt > 2:
                    bad.append("%s.%s (%d)" % (ent.name, name, cnt))
        self.assertEqual(bad, [])

    def test_slot_sanity_per_version(self):
        problems = []
        for ver in SUPPORTED:
            for ent in self.vs.entities.values():
                if not ent.active(ver):
                    continue
                try:
                    slots = self.vs.slots_for(ent.name, ver)
                except vparse.VError as e:
                    problems.append("%s@%s: %s" % (ent.name, ver, e))
                    continue
                for meth, slot in slots.items():
                    if slot < 0:
                        problems.append("%s.%s@%s слот %d" % (ent.name, meth, ver, slot))
        self.assertEqual(problems, [], "\n".join(problems[:20]))

    def test_process_guard_rejects_new_versions(self):
        for ver in GUARDED:
            msg = self.vs.guard_message(ver)
            self.assertTrue(msg and "Unsupported" in msg,
                            "нет guard для %s (msg=%r)" % (ver, msg))

    def test_process_guard_allows_supported(self):
        for ver in SUPPORTED:
            msg = self.vs.guard_message(ver)
            self.assertIsNone(msg, "guard сработал для поддерживаемой %s: %r" % (ver, msg))


ENGINE_REF = re.compile(r"\bI[A-Z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+")
TRAP_SUFFIX = ("Trap", "TrapRaw")
# константы, которые подставляет сам Core.As (в репозитории не объявлены)
STDLIB_NAMES = {"IID_IUnknown", "IID_IDispatch", "INVALID_HANDLE_VALUE"}


def _decode(path):
    raw = open(path, "rb").read()
    for enc in ("utf-8-sig", "cp1251"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", "replace")


def engine_defined_names(engine_dir):
    """Идентификаторы, определённые в самом движке: funcdef-ы, функции, члены перечислений."""
    names = set()
    for fn in sorted(os.listdir(engine_dir)):
        if not fn.endswith(".as"):
            continue
        txt = _decode(os.path.join(engine_dir, fn))
        # funcdef:  funcdef uint IUnk_QI(...);
        for m in re.finditer(r"\bfuncdef\s+[\w:<>.,&@+*\[\]\s]+\s+([A-Za-z_]\w*)\s*\(", txt):
            names.add(m.group(1))
        # определение функции с телом:  ret name(args) {
        for m in re.finditer(r"\b([A-Za-z_]\w*)\s*\([^;\n]*\)\s*\{", txt):
            names.add(m.group(1))
        # члены перечислений/константы:  INDIC_MAX = 35,
        for m in re.finditer(r"^\s*([A-Z_][A-Z0-9_]*)\s*=\s*", txt, re.M):
            names.add(m.group(1))
    return names


class TestEngineRefs(unittest.TestCase):
    """Каждая константа-слот из движка должна существовать в v8api/main.api."""

    @classmethod
    def setUpClass(cls):
        vs, vm = load()
        cls.vs, cls.vm = vs, vm
        cls.guids = dict(vs.guids)
        cls.guids.update(vm.guids)
        cls.engine_text = ""
        for fn in sorted(os.listdir(ENGINE)):
            if fn.endswith(".as"):
                cls.engine_text += _decode(os.path.join(ENGINE, fn)) + "\n"
        cls.defined = engine_defined_names(ENGINE)

    def _all_method_names(self, ver=(8, 3, 27, 1989)):
        names = set(self.vs.method_names(ver))
        names.update(self.vm.method_names(ver))
        return names

    def _resolve(self, ref, ver=(8, 3, 27, 1989)):
        """-> True если ссылка разрешима."""
        if ref in STDLIB_NAMES:
            return True
        if ref in self.vs.consts or ref in self.vm.consts:
            return True
        if ref in self.defined or ref.endswith(TRAP_SUFFIX):
            return True
        if ref in self.guids:
            return True
        names = self._all_method_names(ver)
        if ref in names:
            return True
        if ref.startswith("IID_"):
            tail = ref[4:]
            if tail in self.vs.entities or tail in self.vm.entities or tail in self.guids:
                return True
        # имя интерфейса может содержать подчёркивание: ищем самый длинный префикс-сущность
        ents = list(self.vs.entities) + list(self.vm.entities)
        for e in sorted(ents, key=len, reverse=True):
            if ref == e:
                return True
            if ref.startswith(e + "_"):
                method = ref[len(e) + 1:]
                ent = self.vs.entities.get(e) or self.vm.entities.get(e)
                if method in {m for _mode, _v, m, _d in ent.virt_entries(ver) if m}:
                    return True
                return False
        return False

    def test_engine_slot_refs_resolve(self):
        refs = sorted(set(ENGINE_REF.findall(self.engine_text)))
        unresolved = [(r, self._resolve(r)) for r in refs if not self._resolve(r)]
        self.assertEqual(unresolved, [], "нераспознанные константы движка: %s"
                         % [u[0] for u in unresolved])

    def test_every_iface_has_methods(self):
        # Window — условный сервис без методов (заглушка в window.v)
        empty = [e.name for e in self.vs.entities.values()
                 if e.name != "Window" and not e.virt_entries((8, 3, 27, 1989))]
        self.assertEqual(empty, [], "интерфейсы без методов: %s" % empty)


if __name__ == "__main__":
    unittest.main()