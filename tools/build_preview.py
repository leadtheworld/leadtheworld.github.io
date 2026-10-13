#!/usr/bin/env python3
"""Render the atlas pages for offline review. Production is still built by Jekyll.

Dependencies: python -m pip install python-liquid PyYAML mistune
Run: python tools/build_preview.py
Open: _preview/index.html
"""
from pathlib import Path
from urllib.parse import urlsplit
from datetime import date, datetime
import json
import posixpath
import shutil
import re
import yaml
import mistune
from liquid import Environment

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_preview'
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(exist_ok=True)

def load_document(path):
    text = path.read_text()
    if text.startswith('---'):
        _, header, body = text.split('---', 2)
        return yaml.safe_load(header) or {}, body
    return {}, text

def output_name(url):
    path = urlsplit(url).path.lstrip('/')
    return path + 'index.html' if not path or path.endswith('/') else path

config = yaml.safe_load((ROOT / '_config.yml').read_text())
data = {path.stem: yaml.safe_load(path.read_text()) for path in (ROOT / '_data').glob('atlas*.yml')}
posts = []
documents = []
for path in sorted((ROOT / '_posts').glob('*.md'), reverse=True):
    meta, body = load_document(path)
    if meta.get('published') is False:
        continue
    meta['url'] = meta.get('permalink') or '/blog/' + path.stem[0:4] + '/' + path.stem[11:] + '/'
    if isinstance(meta.get('date'), str):
        meta['date'] = datetime.fromisoformat(meta['date'])
    posts.append(dict(meta, content=body))
    documents.append((path, meta, body))
for path in sorted((ROOT / '_pages').rglob('*.md')):
    meta, body = load_document(path)
    if not meta.get('layout', '').startswith('atlas') or meta.get('published') is False:
        continue
    meta['url'] = meta['permalink']
    documents.append((path, meta, body))

site = dict(config, data=data, posts=posts)
for path, page, body in documents:
    destination = output_name(page['url'])
    directory = posixpath.dirname(destination) or '.'
    def relative_url(url):
        url = str(url)
        if url.startswith(('https:', 'http:', 'mailto:', '#')):
            return url
        parsed = urlsplit(url)
        result = posixpath.relpath(output_name(parsed.path), directory)
        if parsed.query: result += '?' + parsed.query
        if parsed.fragment: result += '#' + parsed.fragment
        return result
    env = Environment()
    env.add_filter('relative_url', relative_url)
    env.add_filter('markdownify', mistune.html)
    env.add_filter('absolute_url', lambda value: config['url'] + str(value))
    env.add_filter('jsonify', lambda value: json.dumps(value, ensure_ascii=False, default=str))
    context = dict(site=site, page=page)
    content = env.from_string(body).render(**context)
    if path.suffix == '.md':
        content = mistune.html(content)
    layout = page.get('layout')
    while layout:
        layout_meta, template = load_document(ROOT / '_layouts' / (layout + '.liquid'))
        content = env.from_string(template).render(**context, content=content)
        layout = layout_meta.get('layout')
    content = re.sub(r'(href|src)="(/(?!/)[^"]*)"', lambda match: match[1] + '="' + relative_url(match[2]) + '"', content)
    root_path = posixpath.relpath('.', directory)
    root_path = './' if root_path == '.' else root_path + '/'
    content = content.replace('<body ', '<body data-preview-root="' + root_path + '" ', 1)
    target = OUT / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)

for asset in ['assets/css/atlas.css', 'assets/css/atlas-theme.css', 'assets/js/atlas-ui.js', 'assets/js/research-globe.js', 'assets/img/atlas-mark.svg', 'assets/img/nahyunlee.jpg', 'assets/pdf/NahyunLee_CV.pdf']:
    target = OUT / asset
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / asset, target)
for directory in ['assets/fonts/k2d', 'assets/fonts/social', 'assets/img/institutions', 'assets/img/uploads', 'admin']:
    if (ROOT / directory).exists():
        shutil.copytree(ROOT / directory, OUT / directory, dirs_exist_ok=True)
print(f'Rendered {len(documents)} pages to {OUT}')
