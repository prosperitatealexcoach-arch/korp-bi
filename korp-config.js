/**
 * KORP BI — Configuração Central
 * Edite este arquivo para ajustar credenciais, metas e mapeamentos.
 * ATENÇÃO: Em produção, use um proxy para esconder o clientSecret.
 */
const KORP_CONFIG = {

  // ── API ────────────────────────────────────────────────────────────
  api: {
    authUrl:      'https://api.korp.com.br/oauth/connect/token',
    graphqlUrl:   'https://api.korp.com.br/bi/v/graphql',
    clientId:     'BAAFE--D-E-FFDE',
    clientSecret: 'wMXoUkwMmEYphznsTWjOVOQym',
    grantType:    'client_credentials',
  },

  // ── MAPEAMENTO DE CONTAS GERENCIAIS ────────────────────────────────
  // Preencha com os valores exatos do seu ERP (FinanceiroContaGerencial.descricao)
  contas: {
    MRR:  '',   // Ex: 'RECEITA RECORRENTE MENSAL'
    RCI:  '',   // Ex: 'RECEITA CONSULTORIA IMPLANTACAO'
    RSD:  '',   // Ex: 'RECEITA SERVICOS DESENVOLVIMENTO'
    RLDU: '',   // Ex: 'RECEITA LICENCA USO'
  },

  // ── METAS 2026 ─────────────────────────────────────────────────────
  metas: {
    MRR:  { crescimento: 20, valorAnual: 0 },   // +20% vs 2025
    RCI:  { crescimento: 20, valorAnual: 0 },   // +20% vs 2025
    RSD:  { crescimento:  0, valorAnual: 0 },   // 0%   vs 2025
    RLDU: { crescimento: 10, valorAnual: 0 },   // +10% vs 2025
    NR:   { crescimento: 15, valorAnual: 0 },   // +15% vs 2025
  },

  // ── EXIBIÇÃO ───────────────────────────────────────────────────────
  display: {
    paretoTopN:       10,       // Quantos clientes no Pareto
    autoRefresh:      false,    // Atualização automática
    refreshMinutes:   10,       // Intervalo em minutos
    showMetas:        true,     // Exibir % de atingimento
    showVariacao:     true,     // Badge variação vs mês anterior
    pareto80line:     true,     // Linha 80% no Pareto
  },

  // ── ROLES E PERMISSÕES ─────────────────────────────────────────────
  roles: {
    diretoria: {
      label: 'Diretoria',
      perms: ['receita','rci','rsd','rldu','nr','custos','margem','ebitda','pareto','geo','exportar','config'],
    },
    gerencia: {
      label: 'Gerência',
      perms: ['receita','rci','rsd','rldu','pareto','geo'],
    },
    analista: {
      label: 'Analista',
      perms: ['receita','pareto','geo'],
    },
  },

  // ── IDENTIDADE VISUAL ──────────────────────────────────────────────
  brand: {
    name:    'KORP',
    tagline: 'Business Intelligence',
    colors: {
      primary:   '#CC0000',
      dark:      '#111111',
      white:     '#FFFFFF',
    },
  },
};
