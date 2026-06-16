import re

with open('g:\\Meu Drive\\MÚSICAS\\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update .sidebar-nav CSS to fill available space
content = re.sub(
    r'(\.sidebar-nav\s*\{[^}]*?gap:\s*8px;)',
    r'\1\n            flex: 1;',
    content
)

# 2. Update Configurações button to push it to the bottom
content = re.sub(
    r'<button class="nav-item" onclick="abrirModalConfig\(\)">\s*<i\s*class="fa-solid fa-gear"></i>\s*<span>Configurações</span>\s*</button>',
    r'<button class="nav-item" style="margin-top: auto;" onclick="abrirModalConfig()"><i class="fa-solid fa-gear"></i><span>Configurações</span></button>',
    content
)

# 3. Replace topbar and tabs
header_pattern = r'<header class="topbar">.*?</header>'
tabs_pattern = r'<div class="tabs" id="tabs-navegacao">.*?</div>'

tabs_match = re.search(tabs_pattern, content, flags=re.DOTALL)
if tabs_match:
    tabs_html = tabs_match.group(0).replace('<div class="tabs" id="tabs-navegacao">', '<div class="tabs" id="tabs-navegacao" style="margin-bottom: 0;">')
    
    new_header = f'''<header class="topbar">
        {tabs_html}
        <div style="display:flex; align-items:center; gap:12px;"><button class="btn btn-primary" id="btn-acao-principal"
                onclick="abrirModalCadastroMusica()"><i class="fa-solid fa-plus"></i> Novo Acorde</button></div>
    </header>'''
    
    # Remove old tabs
    content = re.sub(tabs_pattern, '', content, flags=re.DOTALL)
    
    # Replace header
    content = re.sub(header_pattern, new_header, content, flags=re.DOTALL)

with open('g:\\Meu Drive\\MÚSICAS\\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
