"""Упаковка сборки в snegopat-client.zip для релиза (без внешних инструментов).

    python .github/scripts/package.py [snegopat-client] [snegopat-client.zip]

Исключает __pycache__/*.pyc. Внутри zip корень — snegopat-client/.
"""

import os
import sys
import zipfile

SKIP_DIRS = {"__pycache__", ".git", ".venv", ".venv-tests"}
SKIP_SUFFIXES = (".pyc", ".pyo")


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "snegopat-client"
    dst = sys.argv[2] if len(sys.argv) > 2 else "snegopat-client.zip"
    n = 0
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, dirs, files in os.walk(src):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for fn in files:
                if fn.lower().endswith(SKIP_SUFFIXES):
                    continue
                p = os.path.join(dirpath, fn)
                z.write(p, p.replace(os.sep, "/"))
                n += 1
    print("packed %d files -> %s (%d bytes)" % (n, dst, os.path.getsize(dst)))


if __name__ == "__main__":
    main()