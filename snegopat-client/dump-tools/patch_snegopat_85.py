#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Патч snegopat.dll для запуска на 8.5.x (x64).

Задний план (8.5-адаптация, 2026-10-26):
snegopat.dll ловит создание окна заставки 1С через WH_CBT-хук и сравнивает
класс окна (lpszClass из CREATESTRUCT) с двумя константами:
  V8TopLevelFrameSDI / V8NewLocalFrameBaseWnd  (lstrcmpiW)
С пре-фильтром «lpszClass > 0xFFFF» (атомы отсекаются).
На 8.5 классы окон другие (V8Window0.0/V8Window20808.0 и т.п.) и передаются
не строковым указателем — точное сравнение не срабатывает, run() модуля не
вызывается. При этом API-подготовка Core.As проходит, движок стоит на месте.

Патч (оба изменения в одной функции сравнения, .text):
1) замена UTF-16 строки  V8NewLocalFrameBaseWnd -> V8Window0.0  (.rdata)
   (сама по себе НЕДОСТАТОЧНА: 8.5 передаёт класс не строкой — проверено;
    оставлена для читаемости/семантики у 8.3-пути);
2) форс-матч первой ветки сравнения:  RVA 0x7806  'test eax,eax' (85 C0)
   -> 'xor eax,eax' (31 C0) — сравнение всегда "совпало", run() вызывается
   по первому окну с валидным указателем класса (lpszClass > 0xFFFF).

Проверено: 8.3.27.1989 (модуль грузится полностью, баннер 0.08-0.5с)
и 8.5.1.1529 (баннер 0.3с, аддины/формы грузятся). Скрипт идемпотентен.

Использование:  python patch_snegopat_85.py <snegopat.dll> [--check]
--check: только проверить состояние (ok / already-patched / old).
"""
import os
import sys

OLD_CLASS = u'V8NewLocalFrameBaseWnd'
NEW_CLASS = u'V8Window0.0'
FORCE_MATCH_RVA = 0x7806  # внутри .text, 'test eax,eax' -> 'xor eax,eax'

try:
    import pefile
except ImportError:
    print("нужен pefile: pip install pefile", file=sys.stderr)
    sys.exit(2)


def _file_offset(pe, rva):
    for sec in pe.sections:
        if sec.VirtualAddress <= rva < sec.VirtualAddress + sec.SizeOfRawData:
            return sec.PointerToRawData + (rva - sec.VirtualAddress)
    return None


def _string_rva(pe, s):
    needle = s.encode('utf-16-le') + b'\x00\x00'
    for sec in pe.sections:
        off = sec.get_data().find(needle)
        if off >= 0:
            return sec.VirtualAddress + off
    return None


def state(path):
    data = open(path, 'rb').read()
    pe = pefile.PE(data=data)
    old_b = OLD_CLASS.encode('utf-16-le') + b'\x00\x00'
    fo = _file_offset(pe, FORCE_MATCH_RVA)
    if fo is None:
        return 'bad-rva'
    match_byte = data[fo:fo + 2]
    swap_done = data.find(old_b) < 0 and NEW_CLASS.encode('utf-16-le') in data
    if match_byte == b'\x31\xc0':
        return 'patched' if swap_done else 'patched-no-swap'
    if match_byte != b'\x85\xc0':
        return 'unexpected-bytes:%s' % match_byte.hex()
    return 'old'


def apply(path):
    st = state(path)
    if st in ('patched', 'patched-no-swap'):
        return st
    if st != 'old':
        return st
    data = open(path, 'rb').read()
    pe = pefile.PE(data=data)
    old_b = OLD_CLASS.encode('utf-16-le') + b'\x00\x00'
    new_b = NEW_CLASS.encode('utf-16-le') + b'\x00\x00'
    if data.count(old_b) != 1:
        return 'string-count:%d (патч небезопасен без точного совпадения)' % data.count(old_b)
    data = data.replace(old_b, new_b + b'\x00' * (len(old_b) - len(new_b)))
    data = bytearray(data)
    fo = _file_offset(pe, FORCE_MATCH_RVA)
    data[fo:fo + 2] = b'\x31\xc0'
    tmp = path + '.tmp'
    with open(tmp, 'wb') as f:
        f.write(bytes(data))
    os.replace(tmp, path)
    return 'ok'


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--check']
    check = '--check' in sys.argv
    for p in args:
        st = state(p) if check else apply(p)
        print('%s -> %s' % (os.path.basename(p), st))