/**
 * KORP BI — Módulo de Processamento de Dados
 */
const KorpData = (() => {

  const MESES      = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const REGIOES_MAP = {
    Sul:           ['PR','SC','RS'],
    Sudeste:       ['SP','RJ','MG','ES'],
    'Centro-Oeste':['MT','MS','GO','DF'],
    Norte:         ['AM','PA','RO','RR','AC','AP','TO'],
    Nordeste:      ['BA','SE','AL','PE','PB','RN','CE','PI','MA'],
  };

  // ── FORMATADORES ────────────────────────────────────────────────────
  function fmt(v) {
    if (v == null || isNaN(v)) return '—';
    if (v >= 1e6) return 'R$ ' + (v / 1e6).toFixed(2).replace('.', ',') + 'M';
    if (v >= 1e3) return 'R$ ' + (v / 1e3).toFixed(1).replace('.', ',') + 'K';
    return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  }

  function fmtFull(v) {
    if (v == null || isNaN(v)) return '—';
    return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  }

  function fmtPct(v, digits = 1) {
    if (v == null || isNaN(v)) return '—';
    return (v >= 0 ? '+' : '') + v.toFixed(digits).replace('.', ',') + '%';
  }

  // ── PROCESSADORES ───────────────────────────────────────────────────

  /** Agrupa receita por mês (retorna array[12]) */
  function processReceitaMensal(rawData) {
    const rows   = rawData?.cube || [];
    const byMes  = {};
    const byCusto = {};
    rows.forEach(r => {
      const m = parseInt(r.DataEmissao?.mes);
      if (m >= 1 && m <= 12) {
        byMes[m]   = (byMes[m]   || 0) + (parseFloat(r.FatoFaturamentoNotaFiscal?.valorTotalSum)     || 0);
        byCusto[m] = (byCusto[m] || 0) + (parseFloat(r.FatoFaturamentoNotaFiscal?.valorCustoMedioSum) || 0);
      }
    });
    return {
      receita: MESES.map((_, i) => byMes[i + 1]   || 0),
      custo:   MESES.map((_, i) => byCusto[i + 1] || 0),
    };
  }

  /** Agrupa receita por conta gerencial → calcula MRR / RCI / RSD / RLDU */
  function processKPIs(rawData, mesIdx) {
    const rows  = rawData?.cube || [];
    const contas = KORP_CONFIG.contas;
    const totals = { MRR: 0, RCI: 0, RSD: 0, RLDU: 0, OUTROS: 0 };

    rows.forEach(r => {
      const desc = (r.FinanceiroContaGerencial?.descricao || '').toUpperCase();
      const val  = parseFloat(r.FatoFaturamentoNotaFiscal?.valorTotalSum) || 0;

      if (contas.MRR  && desc.includes(contas.MRR.toUpperCase()))  totals.MRR  += val;
      else if (contas.RCI  && desc.includes(contas.RCI.toUpperCase()))  totals.RCI  += val;
      else if (contas.RSD  && desc.includes(contas.RSD.toUpperCase()))  totals.RSD  += val;
      else if (contas.RLDU && desc.includes(contas.RLDU.toUpperCase())) totals.RLDU += val;
      else totals.OUTROS += val;
    });

    // Se contas não configuradas → estima por proporção típica SaaS
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const semConfig = !contas.MRR && !contas.RCI && !contas.RSD && !contas.RLDU;
    if (semConfig && total > 0) {
      totals.MRR   = total * 0.673;
      totals.RCI   = total * 0.154;
      totals.RSD   = total * 0.063;
      totals.RLDU  = total * 0.110;
      totals.OUTROS = 0;
      totals._estimado = true;
    }

    totals.NR    = total;
    totals.total = total;
    return totals;
  }

  /** Pareto de clientes */
  function processPareto(rawData) {
    const rows = rawData?.cube || [];
    const map  = {};

    rows.forEach(r => {
      const nome = r.VendaCliente?.razaoSocial || 'Não identificado';
      const val  = parseFloat(r.FatoFaturamentoNotaFiscal?.valorTotalSum) || 0;
      if (!map[nome]) {
        map[nome] = {
          nome,
          cidade: r.VendaCliente?.descricaoCidade || '—',
          uf:     r.VendaCliente?.codigoEstado    || '—',
          receita: 0,
        };
      }
      map[nome].receita += val;
    });

    return Object.values(map)
      .filter(c => c.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, KORP_CONFIG.display.paretoTopN)
      .map((c, i) => ({ ...c, rank: i + 1 }));
  }

  /** Receita por estado */
  function processPorEstado(rawData) {
    const rows = rawData?.cube || [];
    const map  = {};

    rows.forEach(r => {
      const uf   = r.VendaCliente?.codigoEstado    || '??';
      const nome = r.VendaCliente?.descricaoEstado || uf;
      const val  = parseFloat(r.FatoFaturamentoProduto?.valorTotalSum) || 0;
      if (!map[uf]) map[uf] = { uf, nome, receita: 0 };
      map[uf].receita += val;
    });

    return Object.values(map)
      .filter(e => e.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }

  /** Receita por cidade */
  function processPorCidade(rawData) {
    const rows = rawData?.cube || [];
    const map  = {};

    rows.forEach(r => {
      const cidade = r.VendaCliente?.descricaoCidade  || '—';
      const uf     = r.VendaCliente?.codigoEstado     || '';
      const key    = cidade + '|' + uf;
      const val    = parseFloat(r.FatoFaturamentoProduto?.valorTotalSum) || 0;
      if (!map[key]) map[key] = { nome: cidade + (uf ? ` / ${uf}` : ''), receita: 0 };
      map[key].receita += val;
    });

    return Object.values(map)
      .filter(c => c.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }

  /** Agrupa estados em regiões */
  function groupByRegiao(estados) {
    const regioes = {};
    estados.forEach(e => {
      for (const [reg, ufs] of Object.entries(REGIOES_MAP)) {
        if (ufs.includes(e.uf)) {
          regioes[reg] = (regioes[reg] || 0) + e.receita;
          break;
        }
      }
    });
    const ordem = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
    return {
      labels: ordem.filter(r => regioes[r]),
      data:   ordem.filter(r => regioes[r]).map(r => regioes[r]),
    };
  }

  /** Calcula variação % entre dois períodos */
  function variacao(atual, anterior) {
    if (!anterior || anterior === 0) return null;
    return ((atual - anterior) / anterior) * 100;
  }

  return {
    MESES, MESES_FULL,
    fmt, fmtFull, fmtPct,
    processReceitaMensal,
    processKPIs,
    processPareto,
    processPorEstado,
    processPorCidade,
    groupByRegiao,
    variacao,
  };
})();
