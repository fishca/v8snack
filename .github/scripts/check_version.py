"""Сверка тега релиза с версией сборки (snegopat-client/x64/version.json, поле ours).

Запускается в CI на push тега: python .github/scripts/check_version.py v1.6.40
выход 0 — тег совпадает с version.json, иначе 1.
"""

import json
import re
import sys


def main():
    # консоль раннера может быть cp1252 — кириллица в stdout упадёт
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    tag = sys.argv[1] if len(sys.argv) > 1 else ""
    m = re.fullmatch(r"v(\d+\.\d+\.\d+)", tag, re.I)
    if not m:
        print("тег %r не похож на v<версия> (например v1.6.40)" % tag)
        sys.exit(1)
    with open("snegopat-client/x64/version.json", encoding="utf-8") as f:
        ours = str(json.load(f).get("ours", ""))
    if ours != m.group(1):
        print("тег %r не совпадает с version.json (ours=%r)" % (tag, ours))
        sys.exit(1)
    print("OK: тег %s совпадает с version.json (%s)" % (tag, ours))


if __name__ == "__main__":
    main()