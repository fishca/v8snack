"""Парсер .v-файлов Core.As (описания интерфейсов 1С и их vtable-слотов).

Формат (см. snegopat-client/x64/modules/snegopat/v8api/*.v, main/api/*.v):
    :iface Name {GUID} / :service Name {GUID}  — объявление интерфейса/службы
    :base Name                                  — базовый интерфейс (его методы идут раньше)
    :virt                                       — виртуальные методы интерфейса:
        [+N] имя(сигнатура) [= значение]        — один слот; +N = пропустить N слотов
    :enum Name / :guid Name {GUID} / :global / :meths / :dlls имя.dll
    #if выражение / #elif / #else / #endif      — ветки по версии платформы (внутри :virt и вне)
    #err текст                                  — ошибка препроцессора (guard неподдерживаемых версий)

Слоты нумеруются с 0: сначала методы базового интерфейса (рекурсивно), затем свои.
Движок ссылается на слоты константами I<Интерфейс>_<метод> (например IWindowView_createWindow).

Только стандартная библиотека. Парсер структурный; абсолютная корректность номеров слотов
подтверждается компилятором (coreas_runner_c check) и рантайм-дампами, не этим модулем.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

VER_RE = re.compile(r"^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?$")


class VError(Exception):
    """Ошибка разбора или несоответствия в .v-файлах."""


def parse_version(s: str) -> tuple:
    s = s.strip()
    m = VER_RE.match(s)
    if not m or not m.group(1):
        raise VError("не число версии: %r" % s)
    return tuple(int(x) for x in m.groups() if x is not None)


# ─────────────────────────── условия #if ───────────────────────────
# Грамматика: or := and ('|' and)* ; and := unary ('&' unary)* ;
#             unary := '!' unary | '(' or ')' | 'ver' op версия
_OP_LEX = re.compile(r"//[^\n]*|<=|>=|==|!=|<>|[<>=!&|()]|\bver\b|\d[\d.]*|\S+")
_OPS = {"<": lambda a, b: a < b, ">": lambda a, b: a > b,
        "<=": lambda a, b: a <= b, ">=": lambda a, b: a >= b,
        "=": lambda a, b: a == b, "==": lambda a, b: a == b,
        "!=": lambda a, b: a != b, "<>": lambda a, b: a != b}


def _eval(tokens, pos, ver):
    def peek():
        return tokens[pos[0]] if pos[0] < len(tokens) else None

    def atom():
        t = peek()
        if t == "(":
            pos[0] += 1
            v = parse_or()
            if peek() != ")":
                raise VError("нет закрывающей скобки в условии")
            pos[0] += 1
            return v
        if t == "ver":
            pos[0] += 1
            op = peek()
            if op not in _OPS:
                raise VError("нет операции после ver: %r" % op)
            pos[0] += 1
            val = peek()
            if val is None or val in _OPS or val in "()&|!":
                raise VError("нет версии после операции: %r" % val)
            pos[0] += 1
            return _OPS[op](ver, parse_version(val))
        # идентификатор-дефайн (x86, test и т.п.): считаем ложью (как без определения)
        pos[0] += 1
        return False

    def unary():
        if peek() == "!":
            pos[0] += 1
            return not unary()
        return atom()

    def parse_and():
        v = unary()
        while peek() == "&":
            pos[0] += 1
            r = unary()
            v = v and r
        return v

    def parse_or():
        v = parse_and()
        while peek() == "|":
            pos[0] += 1
            r = parse_and()
            v = v or r
        return v

    return parse_or()


def _expr_true(expr, ver):
    """Вычислить одно выражение #if для версии."""
    tokens = [t for t in _OP_LEX.findall(expr) if t and not t.startswith("//")]
    if not tokens:
        return False
    if tokens[0] in ("&", "|") or tokens[-1] in ("&", "|", "!") or tokens[-1] in _OPS:
        raise VError("битое выражение #if: %r" % expr)
    return bool(_eval(tokens, [0], ver))


def cond_true(tag, ver):
    """Активна ли ветка: tag — кортеж уровней вложенности, уровень — кортеж веток
    (последняя может быть None — ветка #else). Ветка N активна, если ни одна из
    предыдущих веток уровня не выполнена и выполнена сама N."""
    if isinstance(tag, str):                       # одиночное выражение
        return _expr_true(tag, ver)
    if isinstance(tag, (list, tuple)) and tag and isinstance(tag[0], str):
        return all(_expr_true(e, ver) for e in tag)  # старый список выражений
    for level in tag:
        if not level:
            continue
        prev, cur = level[:-1], level[-1]
        if any(_expr_true(e, ver) for e in prev):
            return False
        if cur is not None and not _expr_true(cur, ver):
            return False
    return True


# ─────────────────────────── модель ───────────────────────────

@dataclass
class Entity:
    name: str
    kind: str                       # "iface" | "service"
    guid: str
    base: str | None = None
    cond: tuple = ()                # условие объявления (кортеж строк-выражений)
    virt: list = field(default_factory=list)   # [(conds, [(skip, name, desc), ...]), ...]

    def active(self, ver) -> bool:
        return cond_true(self.cond, ver)

    def virt_entries(self, ver):
        out = []
        for conds, entry in self.virt:
            if conds and not cond_true(conds, ver):
                continue
            out.append(entry)
        return out


_IF_RE = re.compile(r"^#\s*(if|elif|else|endif)\b(.*)$", re.I)
_ERR_RE = re.compile(r"^#\s*err\b(.*)$", re.I)


def read_v(path):
    raw = open(path, "rb").read()
    for enc in ("utf-8-sig", "cp1251"):
        try:
            return raw.decode(enc).splitlines()
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", "replace").splitlines()


def strip_comment(line):
    out, in_str = [], False
    i = 0
    while i < len(line):
        c = line[i]
        if c == '"':
            in_str = not in_str
            out.append(c)
        elif c == "/" and i + 1 < len(line) and line[i + 1] == "/" and not in_str:
            break
        else:
            out.append(c)
        i += 1
    return "".join(out).rstrip()


def parse_virt_line(line):
    """-> (mode, val, name, desc) | None. mode: 's' пропуск +N, 'a' абсолютный слот N, 'm' метод."""
    s = strip_comment(line).strip()
    if not s or s.startswith("//"):
        return None
    m = re.match(r"^\+(\d+)\s*(.*)$", s)
    if m:
        return ("s", int(m.group(1)), "", m.group(2).strip())
    if re.fullmatch(r"\d+", s):
        return ("a", int(s), "", "")
    m2 = re.search(r"([A-Za-z_]\w*)\s*\(", s)
    if m2:
        return ("m", 0, m2.group(1), s)
    raise VError("непонятная строка :virt: %r" % s)


class VSet:
    """Набор .v-файлов (каталог v8api)."""

    def __init__(self, folder):
        self.folder = folder
        self.entities = {}
        self.guids = {}
        self.consts = set()         # имена членов :enum
        self.enums = {}
        self.guards = []            # (cond, message)
        self.files = []
        for fn in sorted(os.listdir(folder)):
            if fn.lower().endswith(".v"):
                self.files.append(fn)
                self._parse_file(os.path.join(folder, fn))

    # ── разбор одного файла ──
    def _parse_file(self, path):
        lines = read_v(path)
        base = os.path.basename(path)
        # стек вложенных #if: каждый фрейм — список уже занятых веток этого уровня
        frames = []                 # [[expr, ...], ...]
        cur = None
        virt_open = False
        in_enum = False

        def conds_here():
            # снимок веток каждого уровня (активная ветка уровня — последняя на момент строки)
            return tuple(tuple(f) for f in frames)

        def flush_virt():
            nonlocal virt_open
            virt_open = False

        for raw in lines:
            s = raw.strip()
            m = _IF_RE.match(s)
            if m:
                kw, rest = m.group(1).lower(), m.group(2).strip()
                if kw == "if":
                    frames.append([rest])
                elif kw == "elif":
                    if not frames:
                        raise VError("%s: #elif без #if" % base)
                    frames[-1].append(rest)
                elif kw == "else":
                    if not frames:
                        raise VError("%s: #else без #if" % base)
                    frames[-1].append(None)     # ветка else
                else:  # endif
                    if frames:
                        frames.pop()
                continue
            m = _ERR_RE.match(s)
            if m:
                self.guards.append((conds_here(), m.group(1).strip()))
                continue
            m = re.match(r"^:(\w+)\s*(.*)$", s)
            if m:
                kind, arg = m.group(1).lower(), m.group(2)
                flush_virt()
                in_enum = False
                if kind in ("iface", "service"):
                    mm = re.match(r"^([A-Za-z_]\w*)\s*\{?([0-9A-Fa-f-]{36})?\}?", arg)
                    if not mm:
                        raise VError("%s: неверное объявление %s: %r" % (base, kind, s))
                    cur = Entity(name=mm.group(1), kind=kind,
                                 guid=(mm.group(2) or "").upper(), cond=conds_here())
                    self.entities[cur.name] = cur
                elif kind == "base":
                    if cur is None:
                        raise VError("%s: :base вне интерфейса" % base)
                    cur.base = arg.strip()
                elif kind == "virt":
                    virt_open = True
                elif kind == "guid":
                    mm = re.match(r"^([A-Za-z_]\w*)\s*\{?([0-9A-Fa-f-]{36})?\}?", arg)
                    if mm:
                        self.guids.setdefault(mm.group(1), (mm.group(2) or "").upper())
                    cur = None
                elif kind == "enum":
                    cur = None
                    in_enum = True
                elif kind in ("global", "meths", "dlls", "const", "types", "objref", "import"):
                    cur = None
                    in_enum = False
                else:
                    cur = None
                    in_enum = False
                continue
            if in_enum:
                mm = re.match(r"^(?:\d+\s+)?([A-Za-z_]\w*)\s*(?:=\s*[^/]*)?$", s)
                if mm and not s.startswith("#") and not s.startswith("//"):
                    self.consts.add(mm.group(1))
                continue
            if virt_open and cur is not None and s and not s.startswith("#"):
                e = parse_virt_line(s)
                if e is not None:
                    cur.virt.append((conds_here(), e))
        flush_virt()

    # ── разрешение слотов ──
    def base_chain(self, name, seen=None):
        seen = seen or []
        ent = self.entities.get(name)
        if ent is None:
            raise VError("нет интерфейса %s" % name)
        if name in seen:
            raise VError("цикл баз: %s" % " -> ".join(seen + [name]))
        if ent.base is None:
            return [name]
        return self.base_chain(ent.base, seen + [name]) + [name]

    def slots_for(self, name, ver):
        """метод -> номер слота для версии (с учётом баз, через версионные ветки).

        Семантика :virt: 'm' метод занимает слот (последовательно, либо абсолютный — если
        перед ним стояло голое число 'a'), 's' +N пропускает N слотов, 'a' N задаёт
        абсолютный номер слота для СЛЕДУЮЩЕГО метода.
        """
        res = {}
        cursor = 0
        pending = None
        for base in self.base_chain(name):
            ent = self.entities[base]
            for mode, val, mname, _desc in ent.virt_entries(ver):
                if mode == "a":
                    pending = val
                elif mode == "s":
                    cursor += val
                else:  # 'm'
                    # оверлоады (одно имя, разные сигнатуры) допустимы: занимают свои слоты
                    slot = pending if pending is not None else cursor
                    pending = None
                    res.setdefault(mname, slot)
                    cursor = slot + 1
        return res

    def method_names(self, ver):
        """Имена «Интерфейс_метод» всех активных интерфейсов/служб для версии."""
        out = set()
        for ent in self.entities.values():
            if not ent.active(ver):
                continue
            for mode, _val, mname, _desc in ent.virt_entries(ver):
                if mode == "m" and mname:
                    out.add(ent.name + "_" + mname)
        return out

    def guard_message(self, ver):
        """Сообщение #err, активного для версии, или None."""
        for cond, msg in self.guards:
            if not cond or cond_true(cond, ver):
                return msg
        return None