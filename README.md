# Korp BI Dashboard

Dashboard financeiro integrado ao ERP Korp via GraphQL/Cube.js.
Desenvolvido em HTML puro — zero dependências de build, roda direto no GitHub Pages.

---

## 📁 Estrutura do projeto

```
korp-bi/
├── index.html              ← Dashboard principal
├── config/
│   └── korp-config.js      ← ⚙️ Edite aqui: credenciais, metas, permissões
├── modules/
│   ├── api.js              ← Autenticação OAuth + queries GraphQL
│   ├── data.js             ← Processamento e formatação de dados
│   └── charts.js           ← Renderização dos gráficos (Chart.js)
└── README.md
```

---

## 🚀 Como hospedar no GitHub Pages (passo a passo)

### PASSO 1 — Criar conta no GitHub
Acesse https://github.com e crie sua conta se ainda não tiver.

### PASSO 2 — Criar o repositório
1. Clique no botão **"+"** no canto superior direito → **"New repository"**
2. Preencha:
   - **Repository name:** `korp-bi`
   - **Description:** `Dashboard financeiro Korp BI`
   - Marque **Public** (necessário para GitHub Pages gratuito)
   - Deixe desmarcado "Add a README file"
3. Clique **"Create repository"**

### PASSO 3 — Fazer upload dos arquivos
Na página do repositório recém-criado:
1. Clique em **"uploading an existing file"**
2. Arraste a pasta `korp-bi` inteira para a área de upload
   - OU clique em **"choose your files"** e selecione todos os arquivos
3. Na caixa "Commit changes" escreva: `feat: dashboard financeiro inicial`
4. Clique **"Commit changes"**

> ⚠️ **Mantenha a estrutura de pastas** — o `config/` e `modules/` precisam existir.

### PASSO 4 — Ativar o GitHub Pages
1. No repositório, clique em **"Settings"** (aba no topo)
2. No menu lateral esquerdo, clique em **"Pages"**
3. Em **"Source"**, selecione **"Deploy from a branch"**
4. Em **"Branch"**, selecione **"main"** e pasta **"/ (root)"**
5. Clique **"Save"**
6. Aguarde ~2 minutos

### PASSO 5 — Acessar o dashboard
Seu dashboard estará disponível em:
```
https://SEU-USUARIO.github.io/korp-bi/
```

---

## ⚙️ Configuração pós-deploy

### Configurar contas gerenciais (MRR / RCI / RSD / RLDU)
Edite o arquivo `config/korp-config.js`:

```js
contas: {
  MRR:  'RECEITA RECORRENTE MENSAL',    // nome exato no ERP
  RCI:  'RECEITA CONSULTORIA',
  RSD:  'RECEITA SERVICOS DESENVOLVIMENTO',
  RLDU: 'RECEITA LICENCA USO',
},
```

### Configurar metas 2026
```js
metas: {
  MRR:  { crescimento: 20, valorAnual: 5000000 },
  RCI:  { crescimento: 20, valorAnual: 1200000 },
  RSD:  { crescimento:  0, valorAnual:  450000 },
  RLDU: { crescimento: 10, valorAnual:  600000 },
  NR:   { crescimento: 15, valorAnual: 8000000 },
},
```

---

## 🔒 Segurança das credenciais

> **Repositório público:** o `clientSecret` ficará visível.
> Use uma das opções abaixo para protegê-lo:

### Opção A — Repositório Privado (mais simples)
Mude o repositório para **Private** em Settings → General → Danger Zone.
O GitHub Pages continua funcionando normalmente.

### Opção B — Proxy Cloudflare Workers (gratuito)
Crie um Worker que recebe as queries do frontend, faz a autenticação server-side
e devolve apenas os dados. Peça ao Claude: *"Crie um proxy Cloudflare Worker para a API Korp"*.

---

## 📦 Dependências (carregadas via CDN)

| Biblioteca | Versão | Uso |
|---|---|---|
| Chart.js | 4.4.1 | Todos os gráficos |
| IBM Plex Sans | — | Tipografia |

Nenhuma dependência local. Funciona offline após primeiro carregamento via cache.

---

## 🗺️ Mapeamento GraphQL / Cube.js

| Indicador | Entidade | Campo |
|---|---|---|
| Receita mensal | `FatoFaturamentoNotaFiscal` | `valorTotalSum` |
| Pareto clientes | `FatoFaturamentoNotaFiscal` × `VendaCliente` | `valorTotalSum` |
| Por estado/cidade | `FatoFaturamentoProduto` × `VendaCliente` | `valorTotalSum` |
| Por conta gerencial | `FinanceiroContaGerencial` | `descricao` |
| Período | `DataEmissao` | `mes`, `ano` |

---

## 🛣️ Roadmap de módulos

- [x] Financeiro — Receita & Faturamento
- [ ] Financeiro — Custos
- [ ] Financeiro — Margem & EBITDA
- [ ] Financeiro — Churn & Retenção
- [ ] RH
- [ ] Implantação
- [ ] Suporte
- [ ] Comercial
