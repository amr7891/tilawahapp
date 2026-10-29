"""List every data file the app reads (for "keep everything on this phone"): offline-files.json."""
import os, json
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dirs = ['mushaf', 'data', 'hadith', 'arbooks', 'fonts', 'vendor', 'models/quran-phoneme']
files = []
for d in dirs:
    for base, _, names in os.walk(os.path.join(root, d)):
        for n in sorted(names):
            if n.startswith('.') or n.endswith(('.txt', '.md', '.py')) and d != 'data': continue
            p = os.path.join(base, n); rel = os.path.relpath(p, root).replace(os.sep, '/')
            files.append([rel, os.path.getsize(p)])
json.dump(files, open(os.path.join(root, 'offline-files.json'), 'w'), separators=(',', ':'))
print(len(files), 'files', round(sum(s for _, s in files) / 1e6), 'MB')
