# Pixel diff for parity.js: writes <name>-diff.png (red = changed) and <name>-side.png (before | after | diff), prints JSON.
import sys, json
from PIL import Image, ImageChops
out, names = sys.argv[1], sys.argv[2:]
res = []
for n in names:
    a = Image.open(f'{out}/{n}-before.png').convert('RGB'); b = Image.open(f'{out}/{n}-after.png').convert('RGB')
    if a.size != b.size: res.append({'name': n, 'diff': -1, 'total': 0, 'max': 0}); continue
    d = ImageChops.difference(a, b); g = d.convert('L'); mask = g.point(lambda v: 255 if v > 0 else 0)
    cnt = mask.histogram()[255]; mx = max(e[1] for e in d.getextrema())
    dimg = Image.blend(a.convert('L').convert('RGB'), Image.new('RGB', a.size, (0, 0, 0)), 0.6); dimg.paste((255, 0, 0), mask=mask)
    side = Image.new('RGB', (a.width * 3 + 20, a.height), (40, 40, 40)); side.paste(a, (0, 0)); side.paste(b, (a.width + 10, 0)); side.paste(dimg, (2 * a.width + 20, 0))
    s = 1400 / side.width if side.width > 1400 else 1
    side.resize((int(side.width * s), int(side.height * s))).save(f'{out}/{n}-side.png')
    res.append({'name': n, 'diff': cnt, 'total': a.width * a.height, 'max': mx})
print(json.dumps(res))
