# Converts a world countries GeoJSON (for example Natural Earth 110m countries) into data/world.js.
# Usage: python3 make_world.py countries.geojson path/to/data/world.js
import json, sys

SRC, OUT = sys.argv[1], sys.argv[2]
ND = 2          # decimals: about 1 km, enough for a world-level view
EPS = 0.03      # simplification tolerance in degrees

def dp(points, eps):
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    L = (dx * dx + dy * dy) ** 0.5
    best, idx = -1.0, 0
    for i in range(1, len(points) - 1):
        x, y = points[i]
        d = (((x - x1) ** 2 + (y - y1) ** 2) ** 0.5) if L == 0 else abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
        if d > best:
            best, idx = d, i
    if best > eps:
        return dp(points[:idx + 1], eps)[:-1] + dp(points[idx:], eps)
    return [points[0], points[-1]]

def clean(ring):
    pts = [(round(x, ND), round(y, ND)) for x, y in ring]
    s = dp(pts, EPS)
    if len(s) < 4:
        return None
    if s[0] != s[-1]:
        s.append(s[0])
    return [[x, y] for x, y in s]

data = json.load(open(SRC, encoding='utf-8'))
rings = []
for f in data['features']:
    name = (f.get('properties') or {}).get('name') or (f.get('properties') or {}).get('NAME') or ''
    if name.lower() == 'antarctica':
        continue  # far south, outside every view on the page
    g = f['geometry']
    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'MultiPolygon' else []
    for poly in polys:
        r = clean(poly[0])  # outer ring only
        if r:
            rings.append(r)

with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write('/* World land outline, [longitude, latitude] rings. Generated from a world countries GeoJSON. */\n')
    fh.write('window.MAP_SHAPES = window.MAP_SHAPES || {};\n')
    fh.write('window.MAP_SHAPES.world = ')
    fh.write(json.dumps(rings, separators=(',', ':'), ensure_ascii=False))
    fh.write(';\n')
print('world rings written:', len(rings))
