"""Validate the generated public HTML before publishing: python3 scripts/audit-static-site.py."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'dist'
ORIGIN = 'https://sueldospublicos.cl'
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(); self.links=[]; self.ids=set(); self.canonical=[]; self.robots=''; self.h1=0; self.json=False; self.buffer=''; self.data=[]; self.ad_scripts=[]
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag=='script' and 'adsbygoogle.js' in a.get('src',''): self.ad_scripts.append(a['src'])
        if tag=='a' and a.get('href'): self.links.append(a['href'])
        if tag=='h1': self.h1+=1
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href'))
        if tag=='meta' and a.get('name')=='robots': self.robots=a.get('content','')
        if tag=='script' and a.get('type')=='application/ld+json': self.json=True; self.buffer=''
    def handle_data(self, data):
        if self.json: self.buffer+=data
    def handle_endtag(self, tag):
        if tag=='script' and self.json: self.data.append(json.loads(self.buffer)); self.json=False

pages={'/'+str(p.relative_to(ROOT)).removesuffix('index.html'):Page(p) for p in ROOT.rglob('index.html')}
errors=[]
locs=ET.parse(ROOT/'sitemap.xml').findall('.//{*}loc')
for loc in locs:
    path=urlsplit(loc.text).path
    if path not in pages: errors.append(f'Sitemap missing page: {path}'); continue
    page=pages[path]
    expected_ads = 1 if path in ['/calculadoras/docentes/', '/calculadoras/tecnicos-parvulos/', '/calculadoras/administrativos-municipales/', '/calculadoras/tramos-docentes/'] else 0
    if len(page.ad_scripts) != expected_ads: errors.append(f'AdSense script scope: {path}')
    if any('client=ca-pub-5034305532752206' not in src for src in page.ad_scripts): errors.append(f'AdSense publisher: {path}')
    if page.canonical != [ORIGIN+path]: errors.append(f'Canonical: {path}')
    if 'noindex' in page.robots or page.h1 != 1: errors.append(f'Indexability or H1: {path}')
    if not page.data: errors.append(f'Missing structured data: {path}')
for path,page in pages.items():
    for href in page.links:
        url=urlsplit(urljoin(ORIGIN+path,href))
        if url.netloc != 'sueldospublicos.cl': continue
        target=unquote(url.path)
        if target in pages:
            if url.fragment and unquote(url.fragment) not in pages[target].ids: errors.append(f'{path} -> missing fragment {href}')
        elif not (ROOT/target.lstrip('/')).is_file(): errors.append(f'{path} -> missing target {href}')
for slug in ['tecnicos-parvulos','administrativos-municipales','tramos-docentes']:
    if 'caso-explicado' not in pages[f'/calculadoras/{slug}/'].ids: errors.append(f'Missing static example: {slug}')
assert 'Disallow: /' not in (ROOT/'robots.txt').read_text()
assert 'pub-5034305532752206, DIRECT' in (ROOT/'ads.txt').read_text()
if errors: raise SystemExit('\n'.join(errors))
print(f'OK: {len(locs)} sitemap pages; internal links, fragments, canonical, H1, JSON-LD, static examples, robots and ads.txt.')
