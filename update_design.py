import re

with open('g:\\Meu Drive\\MÚSICAS\\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_styles = """    <style>
        :root {
            --primary: #6366f1;
            --primary-600: #4f46e5;
            --primary-700: #4338ca;
            --bg-color: #f8fafc;
            --surface: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --accent: #e0e7ff;
            --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            --card-shadow-hover: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --pill-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
            --sidebar-width: 280px;
            
            --font-base: 15px;
            --fw-regular: 400;
            --fw-medium: 500;
            --fw-semibold: 600;
            --fw-bold: 700;
            --fw-xbold: 800;
            
            --chord-color: #ec4899;
        }

        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background-color: var(--bg-color); 
            margin: 0; 
            color: var(--text-main); 
            font-size: var(--font-base); 
            -webkit-font-smoothing: antialiased;
        }
        
        /* Typography */
        h1, h2, h3 { color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
        
        /* Buttons */
        .btn { 
            background: var(--primary); 
            color: white; 
            border: none; 
            padding: 10px 18px; 
            border-radius: 10px; 
            cursor: pointer; 
            font-weight: var(--fw-semibold); 
            display: inline-flex; 
            align-items: center; 
            justify-content: center;
            gap: 8px; 
            transition: all 0.2s ease; 
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
        }
        .btn:hover { 
            background: var(--primary-600); 
            transform: translateY(-1px); 
            box-shadow: var(--pill-shadow); 
        }
        .btn:active { transform: translateY(0); }
        .btn-secondary { 
            background-color: #ffffff; 
            color: var(--text-main); 
            border: 1px solid var(--border); 
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-secondary:hover { 
            background-color: #f1f5f9; 
            border-color: #cbd5e1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            color: var(--text-main);
        }
        .btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary-600)); }

        /* Layout */
        .sidebar { 
            position: fixed; left: 0; top: 0; bottom: 0; 
            width: var(--sidebar-width); 
            background: #0f172a; 
            color: #f8fafc; 
            padding: 32px 20px; 
            z-index: 90; 
            display: flex; flex-direction: column; 
            border-right: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar .sidebar-top { padding: 0 12px 32px 12px; }
        .sidebar .logo { 
            font-weight: var(--fw-xbold); font-size: 22px; 
            display: flex; align-items: center; gap: 14px; 
            letter-spacing: -0.02em;
        }
        .sidebar .logo i {
            background: linear-gradient(135deg, var(--primary), var(--chord-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 24px;
        }
        .sidebar .logo .subtitle { 
            display: block; font-size: 12px; font-weight: var(--fw-medium); 
            color: #94a3b8; margin-top: 4px; letter-spacing: 0; text-transform: uppercase;
        }
        .sidebar-nav { display: flex; flex-direction: column; gap: 8px; }
        .nav-item { 
            background: transparent; border: none; color: #cbd5e1; 
            text-align: left; padding: 12px 16px; border-radius: 12px; 
            display: flex; gap: 14px; align-items: center; 
            cursor: pointer; font-weight: var(--fw-medium); 
            transition: all 0.2s ease; font-size: 15px;
        }
        .nav-item i { width: 20px; text-align: center; font-size: 18px; opacity: 0.7; }
        .nav-item:hover { 
            background: rgba(255,255,255,0.05); 
            color: #ffffff; 
        }
        .nav-item:hover i { opacity: 1; }
        .nav-active { 
            background: rgba(99, 102, 241, 0.15); 
            color: #ffffff; 
            font-weight: var(--fw-semibold);
            border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .nav-active i { opacity: 1; color: #818cf8; }

        .topbar { 
            margin-left: var(--sidebar-width); height: 72px; 
            display: flex; align-items: center; justify-content: space-between; 
            padding: 0 40px; background: rgba(255, 255, 255, 0.8); 
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            position: sticky; top: 0; z-index: 80;
        }
        .container { margin-left: var(--sidebar-width); padding: 0; }
        .main-area { 
            padding: 40px; 
            max-width: 1200px; margin: 0 auto; 
            min-height: calc(100vh - 72px);
        }

        /* Tabs */
        .tabs { 
            display: flex; gap: 8px; margin-bottom: 32px; 
            background: #e2e8f0; padding: 4px; border-radius: 12px;
            display: inline-flex;
        }
        .tab-btn { 
            background: transparent; border: none; 
            font-size: 14px; font-weight: var(--fw-medium); 
            color: var(--text-muted); cursor: pointer; 
            padding: 8px 16px; border-radius: 8px;
            transition: all 0.2s ease;
        }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.ativo { 
            background: var(--surface); color: var(--primary-700); 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
            font-weight: var(--fw-semibold);
        }

        /* Cards and Lists */
        .acervo-list { 
            display: grid; gap: 20px; 
            grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
        }
        @media (max-width: 800px) {
            .acervo-list { grid-template-columns: 1fr; }
        }

        .acervo-card { 
            background: var(--surface); border: 1px solid var(--border); 
            border-radius: 16px; padding: 20px; 
            box-shadow: var(--card-shadow); 
            display: flex; align-items: center; justify-content: space-between;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
            position: relative; overflow: hidden;
        }
        .acervo-card:hover { 
            transform: translateY(-4px); 
            box-shadow: var(--card-shadow-hover);
            border-color: #cbd5e1;
        }
        .acervo-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
        .card-icon { 
            width: 52px; height: 52px; border-radius: 14px; 
            display: flex; align-items: center; justify-content: center; 
            background: linear-gradient(135deg, #e0e7ff, #ede9fe); color: var(--primary-600); 
            font-size: 20px; flex-shrink: 0;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.5);
        }
        .acervo-meta { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .acervo-titulo { 
            font-size: 17px; color: var(--text-main); font-weight: var(--fw-bold); 
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
            letter-spacing: -0.01em;
        }
        .acervo-sub { color: var(--text-muted); font-size: 13px; font-weight: var(--fw-medium); display: flex; align-items: center; gap: 8px;}
        .tag-pill { 
            background: #f1f5f9; color: #475569; padding: 4px 10px; 
            border-radius: 8px; font-weight: var(--fw-semibold); font-size: 11px; 
            text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e2e8f0;
        }
        .acervo-right { display: flex; align-items: center; gap: 10px; }
        
        .action-circle { 
            width: 40px; height: 40px; border-radius: 50%; 
            background: #f1f5f9; color: var(--text-muted); 
            display: flex; align-items: center; justify-content: center; 
            border: none; cursor: pointer; transition: all 0.2s ease; font-size: 15px;
        }
        .action-circle:hover { background: #e2e8f0; color: var(--text-main); }
        .action-circle.play { 
            background: var(--primary); color: white; 
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }
        .action-circle.play:hover { 
            background: var(--primary-600); transform: scale(1.05);
        }
        .action-more { 
            width: 36px; height: 36px; border-radius: 8px; 
            background: transparent; color: var(--text-muted); border: none; 
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; transition: all 0.2s; font-size: 18px;
        }
        .action-more:hover { background: #f1f5f9; color: var(--text-main); }

        /* Dropdown */
        .dropdown-menu { 
            position: absolute; right: 20px; top: 60px; 
            background: var(--surface); border: 1px solid var(--border); 
            border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
            min-width: 180px; display: none; z-index: 120; padding: 8px;
            animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-menu.show { display: block; }
        .dropdown-menu .menu-item { 
            padding: 10px 12px; font-size: 14px; font-weight: var(--fw-medium);
            color: var(--text-main); display: flex; gap: 12px; align-items: center; 
            cursor: pointer; border-radius: 8px; transition: all 0.15s;
        }
        .dropdown-menu .menu-item:hover { background: #f8fafc; color: var(--primary-600); }
        .dropdown-menu .menu-item i { width: 16px; text-align: center; color: var(--text-muted); }
        .dropdown-menu .menu-item:hover i { color: var(--primary-600); }
        .dropdown-menu .menu-item.danger:hover { background: #fef2f2; color: #ef4444; }
        .dropdown-menu .menu-item.danger:hover i { color: #ef4444; }

        /* Tables */
        .card-table { 
            background: var(--surface); border-radius: 16px; 
            box-shadow: var(--card-shadow); overflow: hidden; border: 1px solid var(--border);
        }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th, td { padding: 16px 24px; border-bottom: 1px solid var(--border); }
        th { 
            background-color: #f8fafc; color: var(--text-muted); 
            font-weight: var(--fw-semibold); font-size: 12px; 
            text-transform: uppercase; letter-spacing: 0.05em; 
        }
        td { font-size: 14px; color: var(--text-main); font-weight: var(--fw-medium); }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background-color: #f8fafc; }

        /* Modals */
        .modal-overlay { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); 
            display: none; justify-content: center; align-items: center; z-index: 1000; 
        }
        .modal-content { 
            background: var(--surface); padding: 32px; border-radius: 20px; 
            width: 100%; max-width: 600px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
            max-height: 90vh; overflow-y: auto;
            animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-header h2 { margin: 0; font-size: 20px; font-weight: var(--fw-bold); }
        .close-btn { 
            background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; cursor: pointer; color: var(--text-muted); 
            transition: all 0.2s;
        }
        .close-btn:hover { background: #e2e8f0; color: var(--text-main); }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full-width { grid-column: span 2; }
        label { font-size: 13px; font-weight: var(--fw-semibold); color: var(--text-main); }
        input, select, textarea { 
            padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; 
            font-family: inherit; font-size: 14px; background: #f8fafc;
            transition: all 0.2s; color: var(--text-main);
        }
        input:focus, select:focus, textarea:focus {
            outline: none; border-color: var(--primary); background: #fff;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        textarea { height: 160px; resize: vertical; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }

        /* Visor */
        #tela-visor { display: none; }
        .visor-header { 
            display: flex; justify-content: space-between; align-items: center; 
            background: var(--surface); padding: 20px 24px; border-radius: 16px; 
            margin-bottom: 24px; box-shadow: var(--card-shadow); border: 1px solid var(--border);
            flex-wrap: wrap; gap: 16px;
        }
        .visor-header h2 { font-size: 24px; font-weight: var(--fw-bold); margin:0; }
        .visor-ferramentas { display: flex; gap: 8px; align-items: center; }
        .btn-ferramenta { 
            background-color: #f1f5f9; color: var(--text-main); border: 1px solid transparent; 
            padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: var(--fw-semibold); 
            font-size: 14px; transition: all 0.2s;
        }
        .btn-ferramenta:hover { background-color: #e2e8f0; }
        .btn-ferramenta.ativo { background-color: var(--text-main); color: white; }
        
        .controles-tom { 
            display: flex; align-items: center; gap: 16px; 
            background: #f1f5f9; padding: 6px 16px; border-radius: 12px; 
        }
        .btn-tom { 
            background: white; color: var(--text-main); border: 1px solid var(--border); 
            width: 32px; height: 32px; border-radius: 8px; font-weight: bold; 
            cursor: pointer; font-size: 16px; transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .btn-tom:hover { border-color: var(--primary); color: var(--primary); }
        
        #render-cifra { 
            background: var(--surface); padding: 48px; border-radius: 16px; 
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; 
            font-size: 18px; white-space: pre; overflow-x: auto; line-height: 1.5; 
            box-shadow: var(--card-shadow); border: 1px solid var(--border);
        }
        .layout-colunas { column-count: 2; column-gap: 60px; column-rule: 1px solid var(--border); }
        .estrofe { break-inside: avoid; margin-bottom: 24px; }
        .linha-letra { color: var(--text-main); margin-bottom: 8px; }
        .linha-acorde { font-weight: bold; color: var(--primary-700); }
        .acorde-clicavel { 
            color: var(--chord-color); cursor: pointer; 
            border-bottom: 2px solid transparent; transition: 0.2s; 
            font-weight: bold;
        }
        .acorde-clicavel:hover { border-bottom-color: var(--chord-color); }
        
        /* Floating Action Button */
        .fab { 
            position: fixed; right: 40px; bottom: 40px; 
            width: 60px; height: 60px; border-radius: 30px; 
            background: linear-gradient(135deg, var(--primary), var(--primary-600)); 
            color: #fff; display: flex; align-items: center; justify-content: center; 
            font-size: 24px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); 
            cursor: pointer; z-index: 80; transition: all 0.2s;
            border: none;
        }
        .fab:hover { transform: scale(1.05) translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.5); }

        /* Others */
        .braco-container { width: 300px; margin: 0 auto; user-select: none; }
        .cordas-header { display: grid; grid-template-columns: repeat(6, 1fr); text-align: center; font-weight: var(--fw-semibold); color: var(--text-muted); font-size: 13px; margin-bottom: 8px; }
        .braco-grid { 
            display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(5, 60px); 
            background: #ffffff; border: 1px solid var(--border); border-top: none; 
            position: relative; border-radius: 0 0 12px 12px; overflow: hidden;
        }
        .celula-casa { border-bottom: 2px solid #e2e8f0; display: flex; justify-content: center; align-items: center; cursor: pointer; position: relative; z-index: 2; }
        .cordas-linhas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: grid; grid-template-columns: repeat(6, 1fr); pointer-events: none; z-index: 1; }
        .cordas-linhas > div { display: flex; justify-content: center; }
        .cordas-linhas > div::after { content: ''; width: 4px; background: #cbd5e1; height: 100%; border-radius: 2px; }
        .dedo-press { 
            width: 24px; height: 24px; background: var(--primary); 
            border-radius: 50%; position: absolute; z-index: 3; 
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3); 
            display: flex; align-items: center; justify-content: center; 
            color: #fff; font-weight: var(--fw-bold); font-size: 12px; 
        }
        .pestana { height: 12px; background: #94a3b8; border-radius: 8px 8px 0 0; }
        #tooltip-acorde { 
            position: absolute; background: var(--surface); border: 1px solid var(--border); 
            border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); 
            padding: 16px; display: none; z-index: 2000; 
        }
        .lista-selecao-musicas { border: 1px solid var(--border); border-radius: 10px; max-height: 250px; overflow-y: auto; padding: 12px; background: #fff; }
        .item-selecao { display: flex; align-items: center; gap: 12px; padding: 10px; border-bottom: 1px solid var(--border); transition: 0.2s;}
        .item-selecao:hover { background: #f8fafc; }
        .item-selecao:last-child { border-bottom: none; }
        .item-selecao input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary); }

        /* Search input */
        #acervo-busca {
            padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border); 
            width: 320px; background: #fff; font-size: 14px; color: var(--text-main);
            transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        #acervo-busca:focus {
            outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        #tela-acervo, #tela-repertorios, #tela-dicionario { display: none; }
        
        .header-title-area h2 { color: var(--text-main); font-size: 28px; letter-spacing: -0.02em; font-weight: var(--fw-xbold); margin-bottom: 4px; }
        .header-title-area p { color: var(--text-muted); margin: 0; font-size: 15px; }
        
        .status-header { display: grid; grid-template-columns: repeat(6, 1fr); text-align: center; margin-bottom: 6px; }
        .status-item { cursor: pointer; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: var(--fw-bold); font-size: 15px; transition: 0.18s; color: var(--text-main); }
        .status-item:hover { background: #e2e8f0; border-radius: 4px; }

        /* Buttons on header alignment */
        .botoes-header { display: flex; gap: 10px; }
    </style>"""

content = re.sub(r'<style>.*?</style>', new_styles, content, flags=re.DOTALL)

# HTML replacements to clean up inline styles and use the new classes
content = content.replace(
'''<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px;">
                    <div>
                        <h2 style="color:#0b1220; margin:6px 0 6px; font-size:26px;">Seu Acervo</h2>
                        <div style="color:var(--text-muted);">Organize e acesse seus acordes com rapidez.</div>
                    </div>''',
'''<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom: 24px;">
                    <div class="header-title-area">
                        <h2>Seu Acervo</h2>
                        <p>Organize e acesse seus acordes com rapidez.</p>
                    </div>'''
)

content = content.replace(
'''<div style="display:flex; gap:12px; align-items:center;">
                        <input id="acervo-busca" placeholder="Buscar acordes..." style="padding:10px 12px; border-radius:10px; border:1px solid var(--border); width:280px; background:#fff;" />
                        <button class="btn btn-secondary" style="padding:8px 12px; border-radius:10px;">Filtros <i class="fa-solid fa-filter" style="margin-left:8px;color:var(--text-muted);"></i></button>
                    </div>''',
'''<div style="display:flex; gap:12px; align-items:center;">
                        <input id="acervo-busca" placeholder="Buscar acordes..." />
                        <button class="btn btn-secondary">Filtros <i class="fa-solid fa-filter" style="margin-left:8px;color:var(--text-muted);"></i></button>
                    </div>'''
)

content = content.replace(
'''<div style="height:18px"></div>''',
''
)
content = content.replace(
'''<div style="height:36px"></div>''',
'''<div style="height:40px"></div>'''
)


with open('g:\\Meu Drive\\MÚSICAS\\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
