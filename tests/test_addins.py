"""Аддины: пары .js/.epf и синтаксис JavaScript (node --check)."""

import os
import shutil
import subprocess
import unittest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADDINS = os.path.join(REPO, "snegopat-client", "x64", "modules", "snegopat", "addins")

# .js без .epf — библиотеки/самостоятельные скрипты; .epf обязан иметь .js,
# кроме готовых форм под std/forms (sn_forms.epf — форма без кода)
STANDALONE_JS = {
    "Libs", "std", "list", "custom", "code_gen", "jshint.js", "marked.js",
    "log4js.js", "winapi.js", "jsUnitCore.js", "SynEdit", "dvcs",
}
EPF_WITHOUT_JS = {"std\\forms\\sn_forms.epf"}


def js_files(root):
    out = []
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            if fn.lower().endswith(".js"):
                out.append(os.path.join(dirpath, fn))
    return out


def epf_files(root):
    out = []
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            if fn.lower().endswith(".epf"):
                out.append(os.path.join(dirpath, fn))
    return out


class TestPairing(unittest.TestCase):
    def test_every_epf_has_js(self):
        missing = []
        for epf in epf_files(ADDINS):
            rel = os.path.relpath(epf, ADDINS)
            if rel in {e.replace("/", os.sep) for e in EPF_WITHOUT_JS}:
                continue
            js = os.path.splitext(epf)[0] + ".js"
            if not os.path.isfile(js):
                missing.append(rel)
        self.assertEqual(missing, [], ".epf без .js: %s" % missing)

    def test_count_sanity(self):
        js = js_files(ADDINS)
        self.assertGreater(len(js), 40, "слишком мало .js аддинов")


class TestJSyntax(unittest.TestCase):
    """node --check по каждому .js (JScript-аддины пишутся на JS-совместимом синтаксисе)."""

    @classmethod
    def setUpClass(cls):
        cls.node = shutil.which("node")

    def test_all_js_parse(self):
        if not self.node:
            self.skipTest("node не найден")
        bad = []
        for js in js_files(ADDINS):
            first = open(js, "rb").read(64).decode("utf-8", "replace")
            if "$engine" in first:      # JScript-директива хоста — не JS, пропускаем
                continue
            r = subprocess.run([self.node, "--check", js], capture_output=True, text=True)
            if r.returncode != 0:
                bad.append((os.path.relpath(js, ADDINS), (r.stderr or r.stdout).strip()[:200]))
        self.assertEqual(bad, [], "синтаксические ошибки в аддинах:\n" +
                         "\n".join("%s: %s" % b for b in bad))


if __name__ == "__main__":
    unittest.main()