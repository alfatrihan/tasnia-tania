# Builds window.MAP_SHAPES data from the bangladesh-geojson file.
# Output: rings of [lon, lat] pairs. Shared inner borders are removed so only outlines remain.
import json, sys, math
from collections import defaultdict

SRC = sys.argv[1]
OUT_BD = sys.argv[2]
OUT_BOGURA = sys.argv[3]
ND = 4  # decimals kept (about 10 m)

def rnd(p):
    return (round(p[0], ND), round(p[1], ND))

def polys_of(geom):
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon':
        return geom['coordinates']
    return []

def raw_rings(features):
    # every polygon's outer ring as it is (keeps shared inner borders)
    out = []
    for f in features:
        for poly in polys_of(f['geometry']):
            r = [rnd(p) for p in poly[0]]
            if len(r) > 3:
                out.append(r)
    return out

def outline(features):
    count = defaultdict(int)
    segs = []
    for f in features:
        for poly in polys_of(f['geometry']):
            ring = [rnd(p) for p in poly[0]]  # outer ring only
            for a, b in zip(ring, ring[1:]):
                if a == b:
                    continue
                key = (a, b) if a < b else (b, a)
                count[key] += 1
                segs.append(key)
    # keep edges that belong to exactly one polygon = the true outer border
    edges = [k for k in set(segs) if count[k] == 1]
    adj = defaultdict(list)
    for i, (a, b) in enumerate(edges):
        adj[a].append(i)
        adj[b].append(i)
    used = [False] * len(edges)
    rings = []
    for start in range(len(edges)):
        if used[start]:
            continue
        used[start] = True
        a, b = edges[start]
        ring = [a, b]
        cur = b
        while True:
            nxt = None
            for i in adj[cur]:
                if not used[i]:
                    nxt = i
                    break
            if nxt is None:
                break
            used[nxt] = True
            x, y = edges[nxt]
            cur = y if x == cur else x
            ring.append(cur)
            if cur == ring[0]:
                break
        if len(ring) > 3 and ring[0] == ring[-1]:
            rings.append(ring)
    dropped = len(set(edges)) and sum(1 for i in range(len(edges)) if not used[i])
    print('outline: open edges left unused =', dropped)
    return rings

def dp(points, eps):
    # Douglas-Peucker simplification on an open polyline
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    best, idx = -1.0, 0
    for i in range(1, len(points) - 1):
        x, y = points[i]
        if L == 0:
            d = math.hypot(x - x1, y - y1)
        else:
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
        if d > best:
            best, idx = d, i
    if best > eps:
        left = dp(points[:idx + 1], eps)
        right = dp(points[idx:], eps)
        return left[:-1] + right
    return [points[0], points[-1]]

def simplify_ring(ring, eps):
    s = dp(ring, eps)
    if s[0] != s[-1]:
        s.append(s[0])
    return s

def dump(rings, eps):
    out = []
    for r in rings:
        s = simplify_ring(r, eps)
        if len(s) >= 4:
            out.append([[round(x, ND), round(y, ND)] for x, y in s])
    return out

data = json.load(open(SRC, encoding='utf-8'))
feats = data['features']
bd_rings = outline(feats)
bogura_feats = [f for f in feats if f['properties'].get('district_name') == 'Bogura']
bogura_rings = raw_rings(bogura_feats)

bd = dump(bd_rings, 0.0015)
bog = dump(bogura_rings, 0.0002)

def count_pts(rs):
    return sum(len(r) for r in rs)

print('bangladesh rings', len(bd), 'points', count_pts(bd))
print('bogura features', len(bogura_feats), 'rings', len(bog), 'points', count_pts(bog))
print('bangladesh lon', min(p[0] for r in bd for p in r), max(p[0] for r in bd for p in r))
print('bangladesh lat', min(p[1] for r in bd for p in r), max(p[1] for r in bd for p in r))
print('bogura lon', min(p[0] for r in bog for p in r), max(p[0] for r in bog for p in r))
print('bogura lat', min(p[1] for r in bog for p in r), max(p[1] for r in bog for p in r))

def js(name, rings, path):
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(
            '/* %s outline, [longitude, latitude] rings. Built from bangladesh-geojson (MIT / ODbL data). */\n'
            % name)
        fh.write('window.MAP_SHAPES = window.MAP_SHAPES || {};\n')
        fh.write('window.MAP_SHAPES.%s = ' % name)
        fh.write(json.dumps(rings, separators=(',', ':'), ensure_ascii=False))
        fh.write(';\n')

js('bangladesh', bd, OUT_BD)
js('bogura', bog, OUT_BOGURA)
