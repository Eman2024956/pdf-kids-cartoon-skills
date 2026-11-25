# Pull the text and page pictures out of a PDF so the lesson can be planned from it.
# usage: python3 extract_pdf.py <file.pdf> <out-dir> [--max-pages 40]
# writes: out-dir/text.md (text per page), out-dir/pages/page-XX.png (80 dpi, readable), out-dir/summary.json
# Arabic PDFs often extract with broken letter order or missing hamzas (في -> يف): when text.md
# reads oddly, trust the page images over the text.
import json, os, subprocess, sys, unicodedata
pdf, out = sys.argv[1], sys.argv[2]
maxp = int(sys.argv[sys.argv.index('--max-pages') + 1]) if '--max-pages' in sys.argv else 40
os.makedirs(os.path.join(out, 'pages'), exist_ok=True)
info = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
pages = int(next((l.split(':')[1] for l in info.splitlines() if l.startswith('Pages:')), '0') or 0)
n = min(pages, maxp); rows = []; md = []
for p in range(1, n + 1):
    txt = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), '-layout', '-enc', 'UTF-8', pdf, '-'], capture_output=True, text=True).stdout.strip()
    txt = unicodedata.normalize('NFKC', txt).replace('\u202b', '').replace('\u202a', '').replace('\u202c', '')
    ar = sum(1 for c in txt if '؀' <= c <= 'ۿ'); lat = sum(1 for c in txt if c.isascii() and c.isalpha())
    rows.append({'page': p, 'chars': len(txt), 'arabic_chars': ar, 'latin_chars': lat, 'needs_look': len(txt) < 80})
    md.append(f'\n\n## Page {p}\n\n{txt if txt else "(no text layer — look at pages/page-%02d.png)" % p}')
subprocess.run(['pdftoppm', '-f', '1', '-l', str(n), '-r', '80', '-png', pdf, os.path.join(out, 'pages', 'page')], check=False)
# normalise names to page-XX.png
for f in os.listdir(os.path.join(out, 'pages')):
    num = ''.join(ch for ch in f if ch.isdigit())
    if num: os.rename(os.path.join(out, 'pages', f), os.path.join(out, 'pages', 'page-%02d.png' % int(num)))
open(os.path.join(out, 'text.md'), 'w').write(f'# {os.path.basename(pdf)}\n' + ''.join(md))
ar = sum(r['arabic_chars'] for r in rows); lat = sum(r['latin_chars'] for r in rows)
summary = {'file': pdf, 'pages': pages, 'read_pages': n, 'total_chars': sum(r['chars'] for r in rows),
           'language_guess': 'ar' if ar > lat else ('en' if lat else 'unknown'), 'scanned_pages': [r['page'] for r in rows if r['needs_look']], 'per_page': rows}
json.dump(summary, open(os.path.join(out, 'summary.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in summary.items() if k != 'per_page'}, ensure_ascii=False))
if summary['scanned_pages']: print(f"pages with little or no text (view their PNGs): {summary['scanned_pages']}")
