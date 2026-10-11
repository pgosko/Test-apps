#!/usr/bin/env python3
"""Generate src/core/paint-library.js from research/mixura-oil-raw.json + the table below.
Run: python3 research/build-library.py   (no deps). See research/oil-paints.md for methodology."""
import json, math, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = json.load(open(os.path.join(HERE, 'mixura-oil-raw.json')))
# Artist-grade oil lines only (student / water-mixable lines excluded).
ARTIST = {("Gamblin", "Artist's Oil Colors"), ("Winsor & Newton", "Artists' Oil Colour"), ("Michael Harding", "Artists Oil Colours"),
          ("Old Holland", "Classic Oil Colors"), ("Williamsburg", "Handmade Oil Colors"), ("Holbein", "Artists' Oil Color"),
          ("Royal Talens", "Rembrandt Oil Colors"), ("Schmincke", "Mussini Oil Colors"), ("Sennelier", "Artists' Oil Colors"),
          ("M. Graham", "Artists' Oil Colors"), ("Lukas", "1862 Artists' Oil"), ("Maimeri", "Puro"), ("Daler-Rowney", "Georgian Oil Colors")}

def lab2rgb(L, a, b):
    fy = (L + 16) / 116; fx = fy + a / 500; fz = fy - b / 200
    f = lambda t: t ** 3 if t ** 3 > 216 / 24389 else (116 * t - 16) / (24389 / 27)
    X, Y, Z = 0.95047 * f(fx), 1.0 * f(fy), 1.08883 * f(fz)
    r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z; g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z; bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
    enc = lambda v: max(0, min(255, round(255 * (12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055))))
    return '#%02x%02x%02x' % (enc(r), enc(g), enc(bb))

def agg(slug, codes=None):
    rows = [r for r in RAW.get(slug, []) if (r[0], r[1]) in ARTIST]
    if codes: rows = [r for r in rows if any(c in r[5].replace(' ', '') for c in codes)] or rows
    uniq = {}
    for r in rows: uniq.setdefault(r[4], r)          # identical published values counted once
    labs = [tuple(map(float, k.split(','))) for k in uniq]
    if not labs: return None
    m = tuple(sum(x[i] for x in labs) / len(labs) for i in range(3))
    spread = max(math.dist(m, x) for x in labs)
    ops = [r[6] for r in rows]; op = max(set(ops), key=ops.count)
    brands = sorted({r[0] for r in rows})
    return dict(lab=[round(v, 1) for v in m], hex=lab2rgb(*m), n=len(brands), brands=brands, spread=round(spread, 1), op=op)

OPA = {'Opaque': 'O', 'Semi-Opaque': 'SO', 'Semi-Transparent': 'ST', 'Transparent': 'T'}
# id, name, family, codes, mixura slug (or None), approx hex (when no published data), opacity (approx), tinting strength (approx),
# masstone (approx thick-film colour, dark transparents only), aliases, note
P = [
 ('titanium-white','Titanium White','whites','PW6','titanium-white',None,None,1.0,None,'white,titanium',''),
 ('zinc-white','Zinc White','whites','PW4','zinc-white',None,None,0.45,None,'mixing white',''),
 ('flake-white','Flake White (Lead)','whites','PW1',None,'#f4efe3','O',0.6,None,'lead white,cremnitz,flake white hue','Warm lead white; hues use PW6/PW4.'),
 ('ivory-black','Ivory Black','blacks','PBk9','ivory-black',None,None,1.5,None,'bone black',''),
 ('mars-black','Mars Black','blacks','PBk11','mars-black',None,None,2.5,None,'iron oxide black',''),
 ('lamp-black','Lamp Black','blacks','PBk6/PBk7','lamp-black',None,None,2.2,None,'carbon black',''),
 ('paynes-gray','Payne\u2019s Gray','blacks','PB29+PBk9','paynes-gray',None,None,2.0,None,'paynes grey,payne grey',''),
 ('yellow-ochre','Yellow Ochre','earths','PY43/PY42','yellow-ochre',None,None,1.0,None,'ochre,gold ochre',''),
 ('raw-sienna','Raw Sienna','earths','PBr7','raw-sienna',None,None,0.9,None,'sienna',''),
 ('burnt-sienna','Burnt Sienna','earths','PBr7/PR101','burnt-sienna',None,None,1.1,None,'sienna',''),
 ('raw-umber','Raw Umber','earths','PBr7','raw-umber',None,None,1.3,None,'umber',''),
 ('burnt-umber','Burnt Umber','earths','PBr7','burnt-umber',None,None,1.3,None,'umber',''),
 ('vandyke-brown','Van Dyke Brown','earths','PBr7+PBk9','vandyke-brown',None,None,1.4,None,'vandyke',''),
 ('venetian-red','Venetian Red','earths','PR101','venetian-red',None,None,1.8,None,'red oxide,light red',''),
 ('indian-red','Indian Red','earths','PR101','indian-red',None,None,2.0,None,'red oxide',''),
 ('english-red','English Red','earths','PR101',None,'#a7452e','O',1.8,None,'english red light,light red','Lighter, more orange PR101 than Indian Red.'),
 ('transparent-red-oxide','Transparent Red Oxide','earths','PR101 (transparent)',None,'#8e3b1f','T',1.6,'#4a1d10','transparent oxide red,transparent earth red','Transparent synthetic iron oxide; glazing substitute for Burnt Sienna.'),
 ('transparent-yellow-oxide','Transparent Yellow Oxide','earths','PY42 (transparent)',None,'#b9782c','T',1.3,'#6a3f15','transparent oxide yellow,transparent earth yellow','Transparent synthetic iron oxide.'),
 ('naples-yellow','Naples Yellow','yellows','PY41 / PW+PY42+PR101 (hue)','naples-yellow',None,None,0.8,None,'naples yellow hue,naples',''),
 ('cadmium-lemon','Cadmium Lemon','yellows','PY35',None,'#fff000','O',1.4,None,'cadmium yellow lemon','Greenish cadmium; value interpolated from Cadmium Yellow Light.'),
 ('cadmium-yellow-light','Cadmium Yellow Light','yellows','PY35/PY37','cadmium-yellow-light',None,None,1.5,None,'cad yellow light',''),
 ('cadmium-yellow-medium','Cadmium Yellow Medium','yellows','PY35/PY37','cadmium-yellow-medium',None,None,1.5,None,'cad yellow medium,cadmium yellow',''),
 ('cadmium-yellow-deep','Cadmium Yellow Deep','yellows','PY37/PO20','cadmium-yellow-deep',None,None,1.5,None,'cad yellow deep',''),
 ('lemon-yellow','Hansa Yellow Light (Lemon)','yellows','PY3','lemon-yellow',None,None,1.4,None,'lemon yellow,hansa yellow light,hansa lemon',''),
 ('hansa-yellow','Hansa Yellow Medium','yellows','PY74/PY97','primary-yellow',None,None,1.5,None,'hansa yellow,primary yellow,azo yellow',''),
 ('indian-yellow','Indian Yellow','yellows','PY83/PY153','indian-yellow',None,None,1.3,None,'',''),
 ('cadmium-orange','Cadmium Orange','oranges','PO20','cadmium-orange',None,None,1.5,None,'cad orange',''),
 ('transparent-orange','Transparent Pyrrole Orange','oranges','PO71','transparent-orange',None,None,1.8,None,'transparent orange,pyrrole orange',''),
 ('cadmium-red-light','Cadmium Red Light','reds','PR108','cadmium-red-light',None,None,1.5,None,'cad red light,cadmium scarlet',''),
 ('cadmium-red-medium','Cadmium Red Medium','reds','PR108','cadmium-red-medium',None,None,1.5,None,'cad red,cadmium red',''),
 ('cadmium-red-deep','Cadmium Red Deep','reds','PR108','cadmium-red-deep',None,None,1.5,None,'cad red deep',''),
 ('pyrrole-red','Pyrrole Red','reds','PR254','pyrrole-red',None,None,2.0,None,'napthol,winsor red,permanent red',''),
 ('alizarin-crimson','Alizarin Crimson','reds','PR83',None,'#9a2236','T',2.0,'#3e1018','alizarin,rose madder genuine','Fugitive PR83; average of brand-chart colours, approximate.'),
 ('permanent-alizarin','Permanent Alizarin Crimson','reds','PR177/PV19 (varies)',None,'#9c2238','T',2.0,'#401119','alizarin permanent,alizarin hue,anthraquinone red','Lightfast substitute; formulas vary by brand.'),
 ('quinacridone-red','Quinacridone Red','reds','PV19','quinacridone-red',None,None,2.0,None,'quin red,permanent rose',''),
 ('quinacridone-rose','Quinacridone Rose','reds','PV19 (gamma)',None,'#d1365f','T',2.0,None,'quin rose,permanent rose','Bluish PV19; between Quin Red and Quin Magenta.'),
 ('quinacridone-magenta','Quinacridone Magenta','reds','PR122','quinacridone-magenta',None,None,2.0,'#52122b','quin magenta,magenta',''),
 ('quinacridone-violet','Quinacridone Violet','violets','PV19','quinacridone-violet',None,None,2.0,'#35121f','quin violet',''),
 ('dioxazine-purple','Dioxazine Purple','violets','PV23','dioxazine-purple',None,None,3.5,'#1c0f26','dioxazine violet,carbazole violet,winsor violet',''),
 ('ultramarine-violet','Ultramarine Violet','violets','PV15','ultramarine-violet',None,None,0.7,None,'',''),
 ('cobalt-violet','Cobalt Violet','violets','PV14/PV49',None,'#8b4f9f','ST',0.5,None,'cobalt violet hue','Weak, expensive pigment; hues common.'),
 ('ultramarine-blue','Ultramarine Blue','blues','PB29','ultramarine-blue',None,None,1.2,'#1a1f5a','french ultramarine,ultramarine',''),
 ('cobalt-blue','Cobalt Blue','blues','PB28','cobalt-blue',None,None,0.7,None,'cobalt',''),
 ('cerulean-blue','Cerulean Blue','blues','PB35/PB36','cerulean-blue',None,None,0.8,None,'cerulean',''),
 ('prussian-blue','Prussian Blue','blues','PB27','prussian-blue',None,None,3.5,'#0e1626','paris blue,berlin blue,milori',''),
 ('phthalo-blue-gs','Phthalo Blue (Green Shade)','blues','PB15:3','phthalo-blue',None,None,4.0,'#0b1838','phthalo blue,phthalocyanine blue,winsor blue green shade',''),
 ('phthalo-blue-rs','Phthalo Blue (Red Shade)','blues','PB15:1/PB15:6',None,'#16318f','T',4.0,'#0d1440','phthalo blue,winsor blue red shade','Redder PB15; shifted from the PB15:3 data toward Ultramarine.'),
 ('indigo','Indigo','blues','PB15+PBk/PV mixes','indigo',None,None,2.5,None,'indigo hue',''),
 ('cobalt-turquoise','Cobalt Turquoise','blues','PB36','cobalt-turquoise',None,None,0.8,None,'cobalt teal',''),
 ('manganese-blue-hue','Manganese Blue Hue','blues','PB15+PG7(+PW6)',None,'#1d97c3','T',2.5,None,'manganese blue','Original PB33 discontinued; phthalo-based hue.'),
 ('phthalo-green-bs','Phthalo Green (Blue Shade)','greens','PG7','phthalo-green',None,None,4.0,'#0b221d','phthalo green,winsor green,phthalocyanine green',''),
 ('phthalo-green-ys','Phthalo Green (Yellow Shade)','greens','PG36',None,'#00785a','T',3.5,'#0f2a1c','phthalo green,winsor green yellow shade','PG36; yellower than PG7.'),
 ('viridian','Viridian','greens','PG18','viridian',None,None,0.8,'#0f2f28','',''),
 ('chromium-oxide-green','Chromium Oxide Green','greens','PG17','chromium-oxide-green',None,None,1.2,None,'oxide of chromium,chrome oxide green',''),
 ('cobalt-green','Cobalt Green','greens','PG50/PG26','cobalt-green',None,None,0.6,None,'',''),
 ('permanent-green-light','Permanent Green Light','greens','PG36+PY3','permanent-green-light',None,None,2.0,None,'permanent green',''),
 ('sap-green','Sap Green','greens','mixed (PG7/36 + yellows/browns)','sap-green',None,None,1.5,'#26301a','sap green permanent',''),
 ('green-gold','Green Gold','greens','PY129','green-gold',None,None,1.2,None,'',''),
 ('olive-green','Olive Green','greens','mixed','olive-green',None,None,1.4,None,'',''),
 ('terre-verte','Terre Verte','greens','PG23',None,'#717c5d','ST',0.3,None,'green earth,verona green earth','Very weak tinter; brand hues vary widely.'),
]

lib = []
for (pid, name, fam, codes, slug, hx, op, ts, mass, alias, note) in P:
    a = agg(slug) if slug else None
    e = dict(id=pid, n=name, f=fam, code=codes)
    if a:
        e.update(c=a['hex'], lab=a['lab'], op=OPA.get(op or a['op'], 'ST'), ts=ts, src='ref', k=a['n'], dE=a['spread'])
    else:
        e.update(c=hx, op=op, ts=ts, src='approx')
    if mass: e['mass'] = mass
    if alias: e['al'] = alias
    if note: e['note'] = note
    lib.append(e)
n_ref = sum(e['src'] == 'ref' for e in lib)
hdr = f"""/* core/paint-library.js — Standard artist oil paints for the Limited Palette picker. GENERATED by research/build-library.py — edit that, not this.
   Fields: id, n name, f family, code Colour Index pigment(s), c reference sRGB (used for swatch + mixing), lab CIE L*a*b* (D65) when published,
   op opacity (O / SO / ST / T), ts relative tinting strength (approximate, used by the mixing model), mass approximate thick-film masstone
   for dark transparent paints (display only), src 'ref' = average of published per-brand L*a*b* values for artist-grade oils (k brands,
   dE = largest ΔE76 of a brand from that average; source mixura.app, method undisclosed — see research/oil-paints.md) or 'approx' = estimate.
   {n_ref} ref / {len(lib) - n_ref} approx of {len(lib)} paints. */
"""
js = hdr + "const PAINT_FAMILIES=[['whites','Whites'],['blacks','Blacks & grays'],['earths','Earths'],['yellows','Yellows'],['oranges','Oranges'],['reds','Reds'],['violets','Violets'],['blues','Blues'],['greens','Greens']];\n"
js += "const PAINTS=[\n" + ",\n".join(json.dumps(e, ensure_ascii=False, separators=(',', ':')) for e in lib) + "\n];\n"
js += "const PAINT_BY_ID=Object.fromEntries(PAINTS.map(p=>[p.id,p]));\n"
open(os.path.join(HERE, '..', 'src', 'core', 'paint-library.js'), 'w').write(js)
json.dump(lib, open(os.path.join(HERE, 'paint-library.json'), 'w'), indent=1, ensure_ascii=False)
print(len(lib), 'paints;', n_ref, 'ref;', len(lib) - n_ref, 'approx')
for e in lib: print(f"{e['id']:26} {e['c']} {e['src']:6} {e.get('k','')} dE{e.get('dE','')} {e['op']} {e.get('lab','')}")
