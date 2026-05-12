/**
 * KORP BI — Módulo de API (GraphQL / OAuth)
 */
const KorpAPI = (() => {

  let _token     = null;
  let _tokenExp  = 0;

  // ── AUTENTICAÇÃO ────────────────────────────────────────────────────
  async function getToken() {
    if (_token && Date.now() < _tokenExp - 60000) return _token;

    const { authUrl, clientId, clientSecret, grantType } = KORP_CONFIG.api;
    const body = new URLSearchParams({
      grant_type:    grantType,
      client_id:     clientId,
      client_secret: clientSecret,
    });

    const resp = await fetch(authUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Auth falhou (HTTP ${resp.status}): ${txt}`);
    }

    const data  = await resp.json();
    _token      = data.access_token;
    _tokenExp   = Date.now() + (data.expires_in || 3600) * 1000;
    return _token;
  }

  // ── EXECUTOR GraphQL ────────────────────────────────────────────────
  async function query(gqlQuery) {
    const token = await getToken();
    const resp  = await fetch(KORP_CONFIG.api.graphqlUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ query: gqlQuery }),
    });

    if (!resp.ok) throw new Error(`GraphQL HTTP ${resp.status}`);
    const json = await resp.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
    return json.data;
  }

  // ── HELPERS DE FILTRO ───────────────────────────────────────────────
  function buildFilters(mes, ano) {
    const f = [];
    if (ano && ano !== '0') f.push(`{ member: "DataEmissao.ano",  operator: equals, values: ["${ano}"] }`);
    if (mes && mes !== '0') f.push(`{ member: "DataEmissao.mes",  operator: equals, values: ["${mes}"] }`);
    return f.length ? `filters: [${f.join(',')}]` : '';
  }

  function contaFilter(conta) {
    if (!conta) return '';
    return `, { member: "FinanceiroContaGerencial.descricao", operator: equals, values: ["${conta}"] }`;
  }

  // ── QUERIES ─────────────────────────────────────────────────────────

  /** Receita mensal agrupada (12 meses do ano) */
  async function fetchReceitaMensal(ano) {
    const data = await query(`{
      cube(
        limit: 500
        filters: [{ member: "DataEmissao.ano", operator: equals, values: ["${ano}"] }]
        orderBy: { DataEmissao: { mes: asc } }
      ) {
        FatoFaturamentoNotaFiscal { valorTotalSum valorDescontoSum valorCustoMedioSum }
        DataEmissao { mes ano }
      }
    }`);
    return data;
  }

  /** Top clientes (Pareto) */
  async function fetchParetoClientes(mes, ano) {
    const data = await query(`{
      cube(
        limit: 100
        ${buildFilters(mes, ano)}
        orderBy: { FatoFaturamentoNotaFiscal: { valorTotalSum: desc } }
      ) {
        FatoFaturamentoNotaFiscal { valorTotalSum }
        VendaCliente {
          razaoSocial
          codigoEstado
          descricaoEstado
          codigoCidade
          descricaoCidade
        }
      }
    }`);
    return data;
  }

  /** Receita por estado */
  async function fetchPorEstado(mes, ano) {
    const data = await query(`{
      cube(
        limit: 50
        ${buildFilters(mes, ano)}
        orderBy: { FatoFaturamentoProduto: { valorTotalSum: desc } }
      ) {
        FatoFaturamentoProduto { valorTotalSum }
        VendaCliente { codigoEstado descricaoEstado }
      }
    }`);
    return data;
  }

  /** Receita por cidade */
  async function fetchPorCidade(mes, ano) {
    const data = await query(`{
      cube(
        limit: 50
        ${buildFilters(mes, ano)}
        orderBy: { FatoFaturamentoProduto: { valorTotalSum: desc } }
      ) {
        FatoFaturamentoProduto { valorTotalSum }
        VendaCliente { descricaoCidade codigoEstado descricaoEstado }
      }
    }`);
    return data;
  }

  /** Receita por conta gerencial (MRR, RCI, RSD, RLDU) */
  async function fetchPorContaGerencial(mes, ano) {
    const data = await query(`{
      cube(
        limit: 500
        ${buildFilters(mes, ano)}
      ) {
        FatoFaturamentoNotaFiscal { valorTotalSum }
        FinanceiroContaGerencial { descricao codigo }
      }
    }`);
    return data;
  }

  /** Lista todas as contas gerenciais disponíveis */
  async function fetchContasGerenciais() {
    const data = await query(`{
      cube(limit: 200) {
        FinanceiroContaGerencial { codigo descricao }
      }
    }`);
    return data;
  }

  /** Teste mínimo de conexão */
  async function testConnection() {
    await getToken();
    const data = await query('{ __typename }');
    return !!data;
  }

  return {
    getToken,
    query,
    fetchReceitaMensal,
    fetchParetoClientes,
    fetchPorEstado,
    fetchPorCidade,
    fetchPorContaGerencial,
    fetchContasGerenciais,
    testConnection,
  };
})();
