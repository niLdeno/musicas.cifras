import re

with open('g:\\Meu Drive\\MÚSICAS\\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove overflow: hidden; from .acervo-card to fix the dropdown
content = content.replace('overflow: hidden;}', '}')

# 2. Add .acervo-actions CSS to align buttons horizontally
if '.acervo-actions' not in content:
    content = content.replace('/* Search input */',
'''.acervo-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        /* Search input */''')

# 3. Change tagHtml for the "momento" to look delicate (no pill)
old_tagHtml = "const tagHtml = m.momento_missa ? `<div class=\"tag-pill\">${m.momento_missa}</div>` : '';"
new_tagHtml = "const tagHtml = m.momento_missa ? `&nbsp; &bull; &nbsp; <span style=\"font-size: 11px; font-weight: 600; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.9;\">${m.momento_missa}</span>` : '';"

content = content.replace(old_tagHtml, new_tagHtml)

# 4. Put the moment in the same line as author and tom
old_meta_row = '''                            <div class="acervo-meta-row">
                                <div class="acervo-sub">${m.autor || '-'} &nbsp; • &nbsp; Tom: <strong>${m.tom_original || '-'}</strong></div>
                                ${tagHtml}
                            </div>'''

new_meta_row = '''                            <div class="acervo-meta-row">
                                <div class="acervo-sub">${m.autor || '-'} &nbsp; &bull; &nbsp; Tom: <strong>${m.tom_original || '-'}</strong>${tagHtml}</div>
                            </div>'''

content = content.replace(old_meta_row, new_meta_row)

with open('g:\\Meu Drive\\MÚSICAS\\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
