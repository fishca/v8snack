"""Целостность сборки: разрядность PE, module.info, load, defaults, version.json, win11-fix."""

import json
import os
import re
import struct
import unittest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X64 = os.path.join(REPO, "snegopat-client", "x64")
CLIENT = os.path.join(REPO, "snegopat-client")

PE_MACHINE = {0x8664: "x64", 0x14C: "x86"}


def pe_machine(path):
    try:
        with open(path, "rb") as f:
            d = f.read(1024)
        e = struct.unpack_from("<I", d, 0x3C)[0]
        return PE_MACHINE.get(struct.unpack_from("<H", d, e + 4)[0])
    except Exception:
        return None


def read_text(path, encs=("utf-8-sig", "cp1251")):
    with open(path, "rb") as f:
        raw = f.read()
    for enc in encs:
        try:
            return raw.decode(enc).replace("\r\n", "\n")
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", "replace").replace("\r\n", "\n")


class TestPEArch(unittest.TestCase):
    def test_starter_is_x86(self):
        self.assertEqual(pe_machine(os.path.join(X64, "starter.exe")), "x86")

    def test_x64_lib_is_x64(self):
        for fn in os.listdir(os.path.join(X64, "lib", "x64")):
            self.assertEqual(pe_machine(os.path.join(X64, "lib", "x64", fn)), "x64", fn)

    def test_x86_lib_is_x86(self):
        for fn in os.listdir(os.path.join(X64, "lib", "x86")):
            self.assertEqual(pe_machine(os.path.join(X64, "lib", "x86", fn)), "x86", fn)

    def test_module_dlls_are_x64(self):
        for fn in os.listdir(os.path.join(X64, "modules", "snegopat", "lib", "x64")):
            self.assertEqual(pe_machine(os.path.join(X64, "modules", "snegopat", "lib", "x64", fn)), "x64", fn)

    def test_lib_binsets_match(self):
        x64 = sorted(f.lower() for f in os.listdir(os.path.join(X64, "lib", "x64")))
        x86 = sorted(f.lower() for f in os.listdir(os.path.join(X64, "lib", "x86")))
        self.assertEqual(x64, x86, "наборы файлов lib/x64 и lib/x86 должны совпадать")


class TestVersion(unittest.TestCase):
    def test_version_json(self):
        d = json.load(open(os.path.join(X64, "version.json"), encoding="utf-8"))
        self.assertIn("ours", d)
        self.assertIn("core_as", d)
        self.assertIn("released", d)
        self.assertRegex(str(d["ours"]), r"^\d+\.\d+\.\d+$")

    def test_readme_structure(self):
        txt = read_text(os.path.join(CLIENT, "README.txt"))
        # версия намеренно НЕ хардкодится в README — только ссылка на version.json
        self.assertIn("version.json", txt)
        self.assertIn("starter.exe", txt)


class TestModuleInfo(unittest.TestCase):
    def test_module_info_resolves(self):
        for mod in ("snegopat", "starter"):
            d = os.path.join(X64, "modules", mod)
            txt = read_text(os.path.join(d, "module.info"))
            m = re.search(r"^src\s*=\s*(.+)$", txt, re.M)
            self.assertTrue(m, "%s: нет src в module.info" % mod)
            for part in m.group(1).split(","):
                part = part.strip()
                if part.startswith(".|"):
                    p = os.path.join(X64, *part[2:].split("\\"))
                else:
                    p = os.path.join(d, *part.split("\\"))
                self.assertTrue(os.path.isdir(p) or os.path.isfile(p),
                                "%s: путь src не существует: %s" % (mod, part))

    def test_snegopat_module_info_parts(self):
        txt = read_text(os.path.join(X64, "modules", "snegopat", "module.info"))
        self.assertRegex(txt, re.compile(r"^api\s*=\s*v8api$", re.M))
        self.assertRegex(txt, re.compile(r"^lib\s*=\s*snegopat\.dll$", re.M))
        self.assertTrue(os.path.isdir(os.path.join(X64, "modules", "snegopat", "v8api")))
        lib = os.path.join(X64, "modules", "snegopat", "lib", "x64", "snegopat.dll")
        self.assertTrue(os.path.isfile(lib), "нет snegopat.dll в lib/x64 модуля")


class TestLoadAndDefaults(unittest.TestCase):
    def test_load_snegopat_txt(self):
        txt = read_text(os.path.join(X64, "load", "snegopat.txt"))
        self.assertRegex(txt, re.compile(r"^modul\s*=\s*Snegopat$", re.M | re.I))
        self.assertRegex(txt, re.compile(r"^proc\s*=\s*1cv8\.exe$", re.M | re.I))
        # modul из load-файла существует (регистр букв в имени модуля не важен)
        m = re.search(r"^modul\s*=\s*([A-Za-z_]\w*)$", txt, re.M | re.I)
        target = os.path.join(X64, "modules", m.group(1))
        if not os.path.isdir(target):
            lc = [d for d in os.listdir(os.path.join(X64, "modules"))
                  if d.lower() == m.group(1).lower()]
            target = os.path.join(X64, "modules", lc[0]) if lc else target
        self.assertTrue(os.path.isdir(target), target)

    def test_defaults_nonempty(self):
        dd = os.path.join(X64, "data", "Snegopat", "defaults")
        files = [f for f in os.listdir(dd) if f.endswith(".set")]
        self.assertGreater(len(files), 20, "слишком мало настроек по умолчанию")
        empty = [f for f in files if os.path.getsize(os.path.join(dd, f)) == 0]
        self.assertEqual(empty, [], "пустые .set: %s" % empty)

    def test_settings_target_valid(self):
        # settings создаётся при первом запуске; здесь важен существующий родитель
        parent = os.path.join(X64, "data", "Snegopat")
        self.assertTrue(os.path.isdir(parent), parent)
        s = os.path.join(parent, "settings")
        self.assertTrue(os.path.isdir(s) or not os.path.exists(s))

    def test_options_ini(self):
        txt = read_text(os.path.join(X64, "options.ini"))
        self.assertIn("[options]", txt)
        self.assertIn("LogLevel", txt)


class TestWin11Fix(unittest.TestCase):
    def test_reg_files(self):
        fix = os.path.join(CLIENT, "win11-fix", "JScript_Win11_24H2_Fix.reg")
        undo = os.path.join(CLIENT, "win11-fix", "JScript_Win11_24H2_Undo.reg")
        for p in (fix, undo):
            self.assertTrue(os.path.isfile(p), p)
            self.assertIn("JScriptReplacement", read_text(p))


if __name__ == "__main__":
    unittest.main()