// ============================================================================
//  Configurações: cotações (token brapi), metas de alocação, tema, backup.
// ============================================================================
import { store } from '../data/store.js';
import { buscarCotacoes } from '../data/cotacoes.js';
import { CLASSES, ORDEM_CLASSES } from '../core/classes.js';
import { parseNumero } from '../core/money.js';
import { validarBackup } from '../core/validacao.js';
import { esc, info, toast, confirmar, baixarArquivo, hojeISO, lerForm } from '../ui/dom.js';

export function renderConfig(main, ctx) {
  const { config } = ctx.estado;
  const metas = config.metas || {};

  main.innerHTML = `
    <nav class="atalhos" aria-label="Outras páginas">
      <a class="cartao atalho" href="#/ir"><span aria-hidden="true">🧾</span><span><b>Imposto de Renda</b><small>DARF mensal e Bens e Direitos</small></span></a>
      <a class="cartao atalho" href="#/aprender"><span aria-hidden="true">🎓</span><span><b>Aprenda</b><small>Glossário dos conceitos</small></span></a>
    </nav>

    <section class="cartao">
      <h2>Cotações automáticas</h2>
      <p>As cotações vêm da <a href="https://brapi.dev" target="_blank" rel="noopener noreferrer">brapi.dev</a> (dados da B3, com alguns minutos de atraso).
        Sem token, só alguns ativos de teste funcionam. <b>Crie uma conta gratuita</b> na brapi, copie o seu token e cole abaixo.</p>
      <form class="form" data-form="token" novalidate>
        <label class="campo">Token da brapi.dev
          <input name="token" type="password" autocomplete="off" spellcheck="false" value="${esc(config.tokenBrapi)}" placeholder="cole seu token aqui" />
        </label>
        <div class="acoes-form esquerda">
          <button class="btn primario" type="submit">Salvar token</button>
          <button class="btn" type="button" data-testar>Testar conexão</button>
        </div>
        <p class="dica">O token fica salvo só neste navegador e nunca vai para o arquivo de backup. Se uma cotação falhar, você pode informar o preço na página do ativo.</p>
      </form>
    </section>

    <section class="cartao">
      <h2>Metas de alocação ${info('rebalanceamento')}</h2>
      <p>Quanto da carteira você quer em cada classe? O painel mostra se cada uma está acima ou abaixo da meta.</p>
      <form class="form" data-form="metas" novalidate>
        <div class="grade-form quatro">
          ${ORDEM_CLASSES.map((c) => `<label class="campo">${CLASSES[c].nome} (%)
            <input name="${c}" inputmode="decimal" value="${metas[c] ? +(metas[c] * 100).toFixed(2) : ''}" placeholder="0" /></label>`).join('')}
        </div>
        <p class="soma-metas dica"></p>
        <div class="acoes-form esquerda"><button class="btn primario" type="submit">Salvar metas</button></div>
      </form>
    </section>

    <section class="cartao">
      <h2>Aparência</h2>
      <label class="campo curto">Tema
        <select data-tema>
          ${[['auto', 'Automático (do sistema)'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, t]) => `<option value="${v}" ${config.tema === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </label>
    </section>

    <section class="cartao">
      <h2>Backup e dados</h2>
      <p>Seus dados ficam <b>somente neste navegador</b>. Se limpar os dados do navegador ou trocar de aparelho, eles se perdem —
        por isso, <b>baixe um backup</b> de vez em quando. Para usar em outro aparelho, é só importar o arquivo lá.</p>
      <div class="acoes-form esquerda">
        <button class="btn primario" type="button" data-exportar>Baixar backup (.json)</button>
        <label class="btn">Restaurar backup<input type="file" accept="application/json,.json" data-importar hidden /></label>
        <button class="btn" type="button" data-acao="demo">Carregar demonstração</button>
        <button class="btn perigo" type="button" data-apagar>Apagar todos os dados</button>
      </div>
      <p class="dica">${ctx.estado.lancamentos.length} operações · ${ctx.estado.proventos.length} proventos · ${ctx.estado.fotografias.length} registros de histórico.</p>
    </section>

    <section class="cartao">
      <h2>Sobre</h2>
      <p class="dica">Ferramenta pessoal de acompanhamento. Não é recomendação de investimento. Cotações podem ter atraso.
        Os cálculos de preço médio e de imposto seguem as regras gerais da Receita Federal — confira sempre com seus informes oficiais.</p>
    </section>`;

  const fMetas = main.querySelector('[data-form="metas"]');
  const somaMetas = () => {
    const d = lerForm(fMetas);
    const soma = ORDEM_CLASSES.reduce((s, c) => s + (parseNumero(d[c]) || 0), 0);
    const el = main.querySelector('.soma-metas');
    el.textContent = `Soma: ${soma.toLocaleString('pt-BR')}%` + (soma && Math.abs(soma - 100) > 0.01 ? ' — o ideal é somar 100%.' : soma ? ' ✓' : '');
    return soma;
  };
  somaMetas();
  fMetas.addEventListener('input', somaMetas);
  fMetas.addEventListener('submit', (e) => {
    e.preventDefault();
    const soma = somaMetas();
    if (soma && Math.abs(soma - 100) > 0.01) { toast('As metas precisam somar 100% (ou deixe tudo vazio).', 'erro'); return; }
    const d = lerForm(fMetas);
    store.configurar({ metas: Object.fromEntries(ORDEM_CLASSES.map((c) => [c, (parseNumero(d[c]) || 0) / 100])) });
    toast('Metas salvas.');
  });

  main.querySelector('[data-form="token"]').addEventListener('submit', (e) => {
    e.preventDefault();
    store.configurar({ tokenBrapi: e.target.token.value.trim() });
    toast('Token salvo.');
    ctx.atualizarCotacoes();
  });
  main.querySelector('[data-testar]').addEventListener('click', async (e) => {
    const token = main.querySelector('[name="token"]').value.trim();
    e.target.disabled = true;
    try {
      const { cotacoes, falhas } = await buscarCotacoes(['PETR4', 'BBAS3'], token);
      if (falhas.length === 0) toast(`Conexão OK! PETR4 a R$ ${cotacoes.PETR4.preco.toFixed(2).replace('.', ',')}.`);
      else if (cotacoes.PETR4) toast('A API respondeu, mas sem token só alguns ativos funcionam (BBAS3 falhou: ' + falhas[0].motivo + ').', 'aviso', 7000);
      else toast('Falhou: ' + falhas[0].motivo, 'erro');
    } finally { e.target.disabled = false; }
  });

  main.querySelector('[data-tema]').addEventListener('change', (e) => {
    store.configurar({ tema: e.target.value });
    if (e.target.value === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', e.target.value);
  });

  main.querySelector('[data-exportar]').addEventListener('click', () => {
    baixarArquivo(`backup-carteira-${hojeISO()}.json`, JSON.stringify(store.exportar(), null, 2));
    toast('Backup baixado. Guarde em local seguro (ex.: Google Drive).');
  });
  main.querySelector('[data-importar]').addEventListener('change', async (e) => {
    const arq = e.target.files[0];
    if (!arq) return;
    try {
      const obj = JSON.parse(await arq.text());
      const erro = validarBackup(obj);
      if (erro) { toast(erro, 'erro', 6000); return; }
      const ok = await confirmar('Restaurar backup?', `O arquivo tem ${obj.dados.lancamentos.length} operações e ${obj.dados.proventos.length} proventos (exportado em ${new Date(obj.exportadoEm).toLocaleString('pt-BR')}). <b>Os dados atuais serão substituídos.</b>`, 'Restaurar');
      if (ok) { store.importar(obj); toast('Backup restaurado!'); }
    } catch {
      toast('Não foi possível ler o arquivo. Ele é um backup .json deste app?', 'erro');
    } finally { e.target.value = ''; }
  });
  main.querySelector('[data-apagar]').addEventListener('click', async () => {
    const ok = await confirmar('Apagar todos os dados?', 'Todas as operações, proventos e o histórico serão removidos deste navegador. <b>Não dá para desfazer</b> — baixe um backup antes, se quiser.', 'Apagar tudo');
    if (ok) { store.apagarTudo(); toast('Dados apagados.'); }
  });
}
