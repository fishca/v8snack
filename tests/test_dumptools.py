"""Юнит-тесты dump-tools (vtcmp.py, vtalign.py, v8re.py).

Требуются capstone, pefile, numpy — без них тесты пропускаются.
Венв: python -m venv .venv-tests && .venv-tests/Scripts/pip install capstone pefile numpy
"""

import os
import struct
import sys
import unittest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUMPTOOLS = os.path.join(REPO, "snegopat-client", "dump-tools")
sys.path.insert(0, DUMPTOOLS)

try:
    import capstone  # noqa: F401
    import pefile    # noqa: F401
    HAVE_DEPS = True
except ImportError:
    HAVE_DEPS = False


def make_records_blob(records_, nslots=130, mark=0x4242424242424242):
    """Серийный vt-dump.bin: 32 байта заголовка + nslots указателей на запись."""
    out = b""
    for tag, obj, vt, slots in records_:
        out += struct.pack("<4Q", tag, obj, vt, mark)
        if vt:
            s = list(slots) + [0] * (nslots - len(slots))
            out += struct.pack("<%dQ" % nslots, *s)
    return out


VTABLE_TEXT = """IFileSystem {B105A780-0000-0000-0000-000000000000}
Vtable in backend.dll
Function 3 GetFileName() const
 address is 0x14004A120 - offset is 0x4A120
Function 4 OpenURL(const wchar_t* url)
 address is 0x14005B390 - offset is 0x5B390
Function 7 DeleteFile(const wchar_t* path)
 address is 0x14006C8F0 - offset is 0x6C8F0
"""


@unittest.skipUnless(HAVE_DEPS, "нужны capstone/pefile/numpy (см. README в tests/)")
class TestVtalign(unittest.TestCase):
    def test_records_ok(self):
        import vtalign
        blob = make_records_blob([(7, 0x2000, 0x4000, [0x8000] * 130)])
        recs = vtalign.records(blob)
        self.assertEqual(len(recs), 1)
        tag, obj, vt, slots = recs[0]
        self.assertEqual((tag, obj, vt), (7, 0x2000, 0x4000))
        self.assertEqual(len(slots), 130)
        self.assertEqual(slots[0], 0x8000)

    def test_records_stops_on_bad_marker(self):
        import vtalign
        blob = make_records_blob([(1, 2, 3, [4] * 130)])
        blob += b"\x00" * 32  # «мусор» с неверным маркером
        recs = vtalign.records(blob)
        self.assertEqual(len(recs), 1)

    def test_records_no_vt(self):
        import vtalign
        blob = make_records_blob([(9, 0x1000, 0, None)])
        tag, obj, vt, slots = vtalign.records(blob)[0]
        self.assertEqual((tag, obj, vt, slots), (9, 0x1000, 0, None))


class FakeImage:
    """Минимальный образ для resolve_thunk/fingerprint (капстоун + read)."""

    def __init__(self, blob, base=0x140000000):
        self._cs = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
        self._cs.detail = False
        self.blob = blob
        self.base = base

    def read(self, rva, n):
        return self.blob[rva:rva + n]


@unittest.skipUnless(HAVE_DEPS, "нужны capstone/pefile/numpy")
class TestVtalignDisasm(unittest.TestCase):
    def test_resolve_thunk(self):
        import vtalign
        # sub rcx, 0x20 ; jmp rel32 с disp=0 -> цель = rva 4+5+0 = 9
        blob = bytes.fromhex("48 83 e9 20") + b"\xe9" + struct.pack("<i", 0)
        im = FakeImage(blob + b"\xcc" * 64)
        rva = vtalign.resolve_thunk(im, 0)
        self.assertEqual(rva, 9)

    def test_resolve_thunk_real_jump(self):
        import vtalign
        # sub rcx,0x8 (48 83 e9 08) на rva 0; jmp rel32 на rva 4; disp = 0x60-4-5 = 0x57
        blob = bytes.fromhex("48 83 e9 08") + b"\xe9" + struct.pack("<i", 0x57)
        blob += b"\x90" * (0x60 - 9) + b"\xcc" * 16
        im = FakeImage(blob)
        rva = vtalign.resolve_thunk(im, 0)
        self.assertEqual(rva, 0x60)

    def test_fingerprint_stops_at_ret(self):
        import vtalign
        # push rbp; mov rbp,rsp; mov eax,1; pop rbp; ret  (короткая функция)
        blob = bytes.fromhex("55 48 89 e5 b8 01 00 00 00 5d c3") + b"\x90" * 64
        im = FakeImage(blob)
        fp = vtalign.fingerprint(im, 0)
        self.assertRegex(fp, r"^[0-9a-f]{8}$")
        self.assertEqual(len(fp), 8)


@unittest.skipUnless(HAVE_DEPS, "нужны capstone/pefile/numpy")
class TestVtcmp(unittest.TestCase):
    def test_parse_vtable_text(self):
        import vtcmp
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".vtable", delete=False, encoding="utf-8") as f:
            f.write(VTABLE_TEXT)
            p = f.name
        try:
            mod, fs = vtcmp.parse(p)
        finally:
            os.unlink(p)
        self.assertEqual(mod, "backend.dll")
        self.assertEqual(len(fs), 3)
        self.assertEqual(fs[0], (3, "GetFileName() const", 0x4A120))
        self.assertEqual(fs[2], (7, "DeleteFile(const wchar_t* path)", 0x6C8F0))


@unittest.skipUnless(HAVE_DEPS, "нужны capstone/pefile/numpy")
class TestV8re(unittest.TestCase):
    def test_demangle(self):
        import v8re
        # RTTI: .?A<класс>Имя@@ (пример: .?AVSnegopat@@)
        self.assertEqual(v8re.demangle(".?AVSnegopat@@"), ["Snegopat"])
        self.assertEqual(v8re.demangle("plain"), ["plain"])


if __name__ == "__main__":
    unittest.main()