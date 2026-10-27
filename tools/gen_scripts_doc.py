#!/usr/bin/env python3
"""Генератор подробной документации по скриптам Снегопата.

Проходит по modules/snegopat (engine/*.as, v8api/*.v, addins/**/*.js),
modules/main, modules/starter и создаёт docs/scripts/<категория>/<файл>.md
плюс индекс docs/scripts/README.md.

Для каждого файла: назначение (заголовок), статистика, объявления
(классы/функции/методы/интерфейсы) с сигнатурами и комментариями,
внутренние зависимости (кто вызывает / что вызывает).

Запуск: python tools/gen_scripts_doc.py
"""
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'snegopat-client', 'x64', 'modules')
OUT = os.path.join(ROOT, 'docs', 'scripts')

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:  # pragma: no cover - старые сборки
    pass

KEYWORDS = {'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'do', 'new', 'delete'}

DECL_AS = re.compile(r'^(class|interface|funcdef|namespace)\s+([A-Za-z_]\w*)')
FUNC_AS = re.compile(
    r'^(?:(?:const|constexpr|static|virtual|override|external|private|protected)\s+)*'
    r'([A-Za-z_]\w*(?:\s*&&|\s*&)?)\s+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*(?:const)?\s*\{')
MODE_V = re.compile(r'^:(props|meths|virt|base|struct|iface|class)\b\s*([A-Za-z_]\w*)?')
SLOT_SKIP_V = re.compile(r'^\+\d+$')
PROP_V = re.compile(r'^(?:const\s+)?([A-Za-z_]\w*(?:[\s&@]+[A-Za-z_]\w*)?)\s+([A-Za-z_]\w*)\s*$')
METH_V = re.compile(r'^(?:save\s+)?([A-Za-z_]\w*(?:[\s&@]+[A-Za-z_]\w*)?)\s+([A-Za-z_]\w*)\s*\((.*)\)\s*(?:\{|$)')
JS_FUNC = re.compile(r'^\s*function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)')
JS_PROTO = re.compile(r'^\s*([A-Za-z_$][\w$]*)\.prototype\.([A-Za-z_$][\w$]*)\s*=\s*function\s*\(([^)]*)\)')
JS_MACRO = re.compile(r"SelfScript\.self\['([^']+)'\]\s*=\s*function\s*\(([^)]*)\)")
JS_ASSIGN = re.compile(r'^\s*(?:var\s+)?([A-Za-z_$][\w$]*)\s*=\s*function\s*\(([^)]*)\)')


def read(path):
    try:
        with open(path, encoding='utf-8-sig', errors='replace') as f:
            return f.read()
    except OSError:
        return ''


def header(lines):
    """Заголовочный комментарий файла: строки комментариев до первого кода."""
    out, started = [], False
    for l in lines[:24]:
        s = l.strip().lstrip('\ufeff')
        if not s:
            if started:
                break
            continue
        if s.startswith('/*'):
            s = s[2:].strip()
        elif s.startswith('*'):
            s = s[1:].strip()
        elif s.startswith('//'):
            s = s[2:].strip()
        else:
            break
        started = True
        if s.startswith('dname:'):
            out = [s[6:].strip()]
            break
        if not s or s.startswith('(c)') or s.startswith('#pragma') or s.startswith('#include') \
                or s.startswith('engine:') or s.startswith('ES5') or s.startswith('@') \
                or s.startswith(('uname:', 'author:', 'version:', 'descr:', 'category:', 'autoload:', 'help:', 'www:')):
            continue
        out.append(s)
        if len(out) >= 3:
            break
    text = ' '.join(out)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:400]


def comment_before(lines, idx):
    """Комментарий непосредственно перед строкой idx (// или /* */)."""
    out = []
    i = idx - 1
    while i >= 0:
        s = lines[i].strip()
        if s.startswith('//'):
            out.append(s.lstrip('/ ').strip())
            i -= 1
        elif s.endswith('*/'):
            block = []
            j = i
            while j >= 0 and '/*' not in lines[j]:
                block.append(lines[j].strip().lstrip('* ').strip())
                j -= 1
            if j >= 0:
                block.append(lines[j].strip().replace('/*', '').strip())
            out.extend(reversed([b for b in block if b]))
            break
        elif not s:
            i -= 1
            if out:
                break
        else:
            break
    return ' '.join(reversed(out)).strip()


def parse_as(text):
    lines = text.splitlines()
    items = []
    scope = None
    for i, l in enumerate(lines):
        s = l.strip()
        if not s or s.startswith('//') or s.startswith('*') or s.startswith('/*'):
            continue
        m = DECL_AS.match(s)
        if m:
            kind, name = m.group(1), m.group(2)
            if kind in ('class', 'interface', 'namespace'):
                scope = name
                items.append({'kind': kind, 'name': name, 'sig': s.rstrip('{').strip(),
                              'comment': comment_before(lines, i), 'scope': None})
            else:
                items.append({'kind': 'funcdef', 'name': name, 'sig': s.rstrip('{').strip(),
                              'comment': comment_before(lines, i), 'scope': scope})
            continue
        fm = FUNC_AS.match(s)
        if fm:
            ret, name, args = fm.group(1).strip(), fm.group(2), fm.group(3)
            if name in KEYWORDS or ret.split()[-1] in KEYWORDS:
                continue
            items.append({'kind': 'func', 'name': name,
                          'sig': '%s %s(%s)' % (ret, name, ' '.join(args.split())),
                          'comment': comment_before(lines, i), 'scope': scope})
            continue
    return items


def parse_v(text):
    lines = text.splitlines()
    items, scope, mode = [], None, None
    for i, l in enumerate(lines):
        s = l.strip()
        if not s or s.startswith(('//', ';')):
            continue
        m = MODE_V.match(s)
        if m:
            mode = m.group(1)
            if m.group(2):
                scope = m.group(2)
            items.append({'kind': mode if mode != 'virt' else 'virt',
                          'name': m.group(2) or s,
                          'sig': s, 'comment': comment_before(lines, i),
                          'scope': None if mode in ('iface', 'struct', 'class') else scope})
            continue
        if SLOT_SKIP_V.match(s):
            items.append({'kind': 'slot-skip', 'name': s, 'sig': 'пропуск слотов: ' + s,
                          'comment': comment_before(lines, i), 'scope': scope})
            continue
        if mode == 'props':
            pm = PROP_V.match(s)
            if pm:
                items.append({'kind': 'prop', 'name': pm.group(2),
                              'sig': '%s %s' % (pm.group(1), pm.group(2)),
                              'comment': comment_before(lines, i), 'scope': scope})
            continue
        if mode in ('meths', 'virt'):
            mm = METH_V.match(s)
            if mm:
                items.append({'kind': 'method', 'name': mm.group(2),
                              'sig': '%s %s(%s)' % (mm.group(1), mm.group(2), ' '.join(mm.group(3).split())),
                              'comment': comment_before(lines, i), 'scope': scope})
            continue
    return items


def parse_js(text):
    lines = text.splitlines()
    items = []
    for i, l in enumerate(lines):
        s = l.strip()
        if not s or s.startswith('//') or s.startswith('*'):
            continue
        for rx, kind in ((JS_MACRO, 'macro'), (JS_PROTO, 'method'), (JS_FUNC, 'func'), (JS_ASSIGN, 'func')):
            m = rx.match(s)
            if m:
                groups = m.groups()
                if kind == 'macro':
                    name = groups[0]
                    args = groups[1]
                elif kind == 'method':
                    name = groups[0] + '.' + groups[1]
                    args = groups[2]
                else:
                    name = groups[0]
                    args = groups[1]
                items.append({'kind': kind, 'name': name,
                              'sig': '%s(%s)' % (name, ' '.join(args.split())),
                              'comment': comment_before(lines, i), 'scope': None})
                break
    return items


def deps(name, text):
    """Грубая оценка: сколько раз имя встречается в файле (для внешних ссылок)."""
    return text.count(name)


def main():
    files = []
    for sub in ('snegopat', 'main', 'starter'):
        base = os.path.join(SRC, sub)
        for root, _, names in os.walk(base):
            for n in sorted(names):
                if n.endswith(('.as', '.v', '.js')):
                    files.append(os.path.join(root, n))
    files.sort()

    index = defaultdict(list)
    total_items = 0
    for path in files:
        rel = os.path.relpath(path, SRC).replace('\\', '/')
        text = read(path)
        lines = text.splitlines()
        if rel.endswith('.as'):
            items, lang = parse_as(text), 'AngelScript'
        elif rel.endswith('.v'):
            items, lang = parse_v(text), 'v8api (.v)'
        else:
            items, lang = parse_js(text), 'JScript'
        parts = rel.split('/')
        cat = '/'.join(parts[:-1]) or 'root'
        base = os.path.splitext(parts[-1])[0]
        outdir = os.path.join(OUT, cat)
        os.makedirs(outdir, exist_ok=True)
        outpath = os.path.join(outdir, base + '.md')

        kinds = defaultdict(int)
        for it in items:
            kinds[it['kind']] += 1
        total_items += len(items)

        with open(outpath, 'w', encoding='utf-8', newline='\n') as f:
            f.write('## `%s`\n\n' % rel)
            f.write('- Язык: **%s**, строк: **%d**, объявлений: **%d**\n' % (lang, len(lines), len(items)))
            h = header(lines)
            if h:
                f.write('- Назначение: %s\n' % h)
            if kinds:
                f.write('- Состав: %s\n' % ', '.join('%s — %d' % (k, v) for k, v in sorted(kinds.items())))
            f.write('\n')
            if not items:
                if base == 'all' and 'allAddins' in text:
                    f.write('_Манифест аддинов (JSON-объект `allAddins`): реестр скриптов с путями, '
                            'именами и тегами. Не исполняется сам, используется загрузчиком._\n')
                else:
                    f.write('_Объявлений верхнего уровня не найдено (библиотека или файл данных)._\n')
            cur_scope = None
            for it in items:
                sc = it.get('scope')
                if sc != cur_scope:
                    cur_scope = sc
                    if sc:
                        f.write('\n### внутри `%s`\n\n' % sc)
                    else:
                        f.write('\n### верхний уровень\n\n')
                c = (' — ' + it['comment']) if it['comment'] else ''
                f.write('- `%s`%s\n' % (it['sig'], c))
        index[cat].append((base, rel, len(lines), len(items)))

    with open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# Справочник по скриптам Снегопата\n\n')
        f.write('Сгенерировано `tools/gen_scripts_doc.py` из исходников '
                '(`snegopat-client/x64/modules`).\n\n')
        f.write('Файлов: **%d**, объявлений: **%d**.\n\n' % (len(files), total_items))
        f.write('Обзор архитектуры — `docs/SCRIPTS.md`; проблемы — `docs/ISSUES.md`.\n\n')
        for cat in sorted(index):
            f.write('## %s\n\n' % cat)
            f.write('| Файл | Исходник | Строк | Объявлений |\n|---|---|---:|---:|\n')
            for base, rel, nlines, nitems in sorted(index[cat]):
                f.write('| [%s](%s/%s.md) | `%s` | %d | %d |\n' % (base, cat, base, rel, nlines, nitems))
            f.write('\n')
    print('файлов: %d, объявлений: %d' % (len(files), total_items))
    print('индекс:', os.path.join(OUT, 'README.md'))


if __name__ == '__main__':
    main()
