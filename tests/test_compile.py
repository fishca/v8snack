"""Компиляция модуля snegopat под версии платформы (coreas_runner_c check).

ВАЖНО: команда запускается из корня Core.As (папка x64) БЕЗ параметра /f —
с /f загрузчик модуля не находит main и падает (проверено на практике).

Поддерживаемые версии обязаны собираться (exit 0, без ошибок),
запрещённые guard'ом process.v (< 8.2.19, 8.3.1-8.3.3) — обязаны отклоняться.
8.3.28+ и 8.5.x компилируются с 2026-10-26 (адаптация v8api: core85/wbase85/nuke85,
сигнатуры Rect/calcShadowRect/calcWindowTopRightPos); рантайм 8.5 в работе.
"""

import os
import shutil
import struct
import subprocess
import tempfile
import unittest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X64 = os.path.join(REPO, "snegopat-client", "x64")
RUNNER = os.path.join(X64, "lib", "x64", "coreas_runner_c.exe")

SUPPORTED = ["8.3.10", "8.3.17.1549", "8.3.18", "8.3.24",
             "8.3.25.1633", "8.3.27.1989", "8.3.28",
             "8.5.1.960", "8.5.1.1236", "8.5.1.1529"]
GUARDED = ["8.2.9", "8.3.2"]  # process.v: ver < 8.2.19 | (8.3.0 < ver < 8.3.4)

TIMEOUT = 240


def pe_machine(path):
    with open(path, "rb") as f:
        d = f.read(1024)
    e = struct.unpack_from("<I", d, 0x3C)[0]
    return struct.unpack_from("<H", d, e + 4)[0]


def check_version(sandbox, ver):
    """-> (exitcode, decoded_text)."""
    runner = os.path.join(sandbox, "lib", "x64", "coreas_runner_c.exe")
    cmd = [runner, "check", "snegopat", "/d", "ver=%s" % ver]
    r = subprocess.run(cmd, cwd=sandbox, capture_output=True, timeout=TIMEOUT)
    out = (r.stdout + r.stderr).decode("cp866", errors="replace")
    return r.returncode, out


@unittest.skipUnless(os.path.isfile(RUNNER), "нет coreas_runner_c.exe в сборке")
class TestModuleCompiles(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # рабочую копию делаем один раз: компилятор может писать артефакты
        cls.sandbox = tempfile.mkdtemp(prefix="snegopat-check-")
        shutil.copytree(X64, os.path.join(cls.sandbox, "x64"))
        cls.sbx = os.path.join(cls.sandbox, "x64")

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.sandbox, ignore_errors=True)

    def test_runner_is_x64(self):
        self.assertEqual(pe_machine(os.path.join(self.sbx, "lib", "x64", "coreas_runner_c.exe")), 0x8664)

    def test_supported_versions_compile(self):
        failures = []
        for ver in SUPPORTED:
            ec, out = check_version(self.sbx, ver)
            bad = "error" in out.lower() or "ошибк" in out.lower()
            if ec != 0 or bad:
                failures.append("%s: exit=%d, %s" % (ver, ec, out.strip().splitlines()[:3]))
        self.assertEqual(failures, [], "\n".join(failures))

    def test_guarded_versions_rejected(self):
        failures = []
        for ver in GUARDED:
            ec, out = check_version(self.sbx, ver)
            if ec == 0 or "Unsupported version" not in out:
                failures.append("%s: exit=%d, %r" % (ver, ec, out[:120]))
        self.assertEqual(failures, [], "\n".join(failures))


if __name__ == "__main__":
    unittest.main()