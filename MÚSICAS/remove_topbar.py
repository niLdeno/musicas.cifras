import re

file_path = 'g:\\Meu Drive\\MÚSICAS\\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the entire <header class="topbar">...</header>
content = re.sub(r'<header class="topbar">.*?</header>', '', content, flags=re.DOTALL)

# 2. Add IDs to the sidebar navigation items
content = content.replace(
    '''<button class="nav-item nav-active" onclick="mudarAmbiente('acervo')">''',
    '''<button id="nav-acervo" class="nav-item nav-active" onclick="mudarAmbiente('acervo')">'''
)
content = content.replace(
    '''<button class="nav-item" onclick="mudarAmbiente('repertorios')">''',
    '''<button id="nav-repertorios" class="nav-item" onclick="mudarAmbiente('repertorios')">'''
)
content = content.replace(
    '''<button class="nav-item" onclick="mudarAmbiente('dicionario')">''',
    '''<button id="nav-dicionario" class="nav-item" onclick="mudarAmbiente('dicionario')">'''
)

# 3. Replace mudarAmbiente function
old_mudar_ambiente = '''        function mudarAmbiente(ambiente) {
            ambienteAtual = ambiente;
            document.getElementById('tab-acervo').classList.remove('ativo');
            document.getElementById('tab-repertorios').classList.remove('ativo');
            document.getElementById('tab-dicionario').classList.remove('ativo');
            document.getElementById(`tab-${ambiente}`).classList.add('ativo');

            document.getElementById('tela-acervo').style.display = ambiente === 'acervo' ? 'block' : 'none';
            document.getElementById('tela-repertorios').style.display = ambiente === 'repertorios' ? 'block' : 'none';
            document.getElementById('tela-dicionario').style.display = ambiente === 'dicionario' ? 'block' : 'none';
            document.getElementById('tela-visor').style.display = 'none';
            document.getElementById('tabs-navegacao').style.display = 'flex';

            const btn = document.getElementById('btn-acao-principal');
            if (ambiente === 'acervo') { btn.innerHTML = '<i class="fa-solid fa-plus"></i> Nova Música'; btn.onclick = abrirModalCadastroMusica; }
            else if (ambiente === 'repertorios') { btn.innerHTML = '<i class="fa-solid fa-list-check"></i> Novo Repertório'; btn.onclick = abrirModalCadastroRepertorio; }
            else { btn.innerHTML = '<i class="fa-solid fa-book-open"></i> Novo Acorde'; btn.onclick = abrirModalCadastroAcorde; }
        }'''

new_mudar_ambiente = '''        function mudarAmbiente(ambiente) {
            ambienteAtual = ambiente;
            
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('nav-active'));
            const activeNav = document.getElementById(`nav-${ambiente}`);
            if(activeNav) activeNav.classList.add('nav-active');

            document.getElementById('tela-acervo').style.display = ambiente === 'acervo' ? 'block' : 'none';
            document.getElementById('tela-repertorios').style.display = ambiente === 'repertorios' ? 'block' : 'none';
            document.getElementById('tela-dicionario').style.display = ambiente === 'dicionario' ? 'block' : 'none';
            document.getElementById('tela-visor').style.display = 'none';
            
            const fab = document.querySelector('.fab');
            if(fab) {
                if (ambiente === 'acervo') { fab.title = 'Nova Música'; fab.onclick = abrirModalCadastroMusica; }
                else if (ambiente === 'repertorios') { fab.title = 'Novo Repertório'; fab.onclick = abrirModalCadastroRepertorio; }
                else { fab.title = 'Novo Acorde'; fab.onclick = abrirModalCadastroAcorde; }
            }
        }'''

content = content.replace(old_mudar_ambiente, new_mudar_ambiente)

# 4. Remove references to tabs-navegacao from iniciarVisor and fecharVisor
content = content.replace("document.getElementById('tabs-navegacao').style.display = 'none'; ", "")
content = content.replace("document.getElementById('tabs-navegacao').style.display = 'flex'; ", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
