/**
 * KORP BI — Módulo de Gráficos (Chart.js)
 */
const KorpCharts = (() => {

  const instances = {};

  const C = {
    red:   '#CC0000',
    dark:  '#222222',
    gray:  '#888888',
    light: '#CCCCCC',
    grid:  '#F2F2F2',
    text:  '#888888',
  };

  function destroy(id) {
    if (instances[id]) { instances[id].destroy(); delete instances[id]; }
  }

  // ── RECEITA MENSAL (barras empilhadas) ──────────────────────────────
  function buildReceitaMensal(canvasId, mensal, kpis) {
    destroy(canvasId);
    const ctx   = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    const total = mensal.reduce((s, v) => s + v, 0);
    const MRR   = mensal.map(v => total > 0 ? v * (kpis.MRR  / kpis.total) : 0);
    const RCI   = mensal.map(v => total > 0 ? v * (kpis.RCI  / kpis.total) : 0);
    const RSD   = mensal.map(v => total > 0 ? v * (kpis.RSD  / kpis.total) : 0);
    const RLDU  = mensal.map(v => total > 0 ? v * (kpis.RLDU / kpis.total) : 0);

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: KorpData.MESES,
        datasets: [
          { label:'MRR',  data:MRR,  backgroundColor:C.red,   borderRadius:2, stack:'s' },
          { label:'RCI',  data:RCI,  backgroundColor:C.dark,  borderRadius:2, stack:'s' },
          { label:'RSD',  data:RSD,  backgroundColor:C.gray,  borderRadius:2, stack:'s' },
          { label:'RLDU', data:RLDU, backgroundColor:C.light, borderRadius:2, stack:'s' },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${KorpData.fmtFull(c.raw)}` } },
        },
        scales: {
          x: { grid:{ display:false }, ticks:{ font:{size:10}, color:C.text } },
          y: { grid:{ color:C.grid  }, ticks:{ font:{size:10}, color:C.text, callback: v => KorpData.fmt(v) } },
        },
      },
    });
  }

  // ── DONUT COMPOSIÇÃO ────────────────────────────────────────────────
  function buildDonut(canvasId, kpis) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const vals   = [kpis.MRR, kpis.RCI, kpis.RSD, kpis.RLDU].map(v => Math.max(v || 0, 0));
    const labels = ['MRR','RCI','RSD','RLDU'];
    const colors = [C.red, C.dark, C.gray, C.light];
    const total  = vals.reduce((a, b) => a + b, 0);

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data:vals, backgroundColor:colors, borderWidth:0, hoverOffset:4 }] },
      options: {
        responsive: false, maintainAspectRatio: false, cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => `${c.label}: ${KorpData.fmtFull(c.raw)} (${total > 0 ? (c.raw/total*100).toFixed(1) : 0}%)` } },
        },
      },
    });

    // Legenda lateral
    const legEl = document.getElementById(canvasId + '-legend');
    if (legEl) {
      legEl.innerHTML = labels.map((l, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="display:flex;align-items:center;gap:7px">
            <span style="width:9px;height:9px;border-radius:2px;background:${colors[i]};flex-shrink:0;display:inline-block"></span>
            <span style="font-size:12px">${l}</span>
          </span>
          <span style="font-size:11.5px;font-weight:500;font-variant-numeric:tabular-nums">
            ${total > 0 ? (vals[i]/total*100).toFixed(1) : '0.0'}%
          </span>
        </div>`).join('');
    }
  }

  // ── PARETO ──────────────────────────────────────────────────────────
  function buildPareto(canvasId, clientes) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || !clientes.length) return;

    const total = clientes.reduce((s, c) => s + c.receita, 0);
    let acum    = 0;
    const cumuls = clientes.map(c => {
      acum += total > 0 ? (c.receita / total * 100) : 0;
      return Math.round(acum * 10) / 10;
    });

    const datasets = [
      {
        type: 'bar', label: 'Receita', data: clientes.map(c => c.receita),
        backgroundColor: C.red, borderRadius: 3, yAxisID: 'y',
      },
      {
        type: 'line', label: 'Pareto %', data: cumuls,
        borderColor: '#111', borderWidth: 1.5, pointRadius: 3,
        pointBackgroundColor: '#111', fill: false, tension: 0.35, yAxisID: 'y2',
      },
    ];

    // Linha 80% (plugin inline)
    if (KORP_CONFIG.display.pareto80line) {
      datasets.push({
        type: 'line', label: '80%', data: clientes.map(() => 80),
        borderColor: '#CCCCCC', borderWidth: 1, borderDash: [4, 4],
        pointRadius: 0, fill: false, yAxisID: 'y2',
      });
    }

    instances[canvasId] = new Chart(ctx, {
      data: { labels: clientes.map(c => c.nome.split(' ').slice(0, 2).join(' ')), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: c => c.dataset.label === 'Receita'
              ? `Receita: ${KorpData.fmtFull(c.raw)}`
              : c.dataset.label === '80%' ? null
              : `Acumulado: ${c.raw}%`
          }},
        },
        scales: {
          x:  { grid:{display:false}, ticks:{font:{size:9},color:C.text,maxRotation:30} },
          y:  { position:'left',  grid:{color:C.grid}, ticks:{font:{size:9},color:C.text, callback:v=>KorpData.fmt(v)} },
          y2: { position:'right', min:0, max:100, grid:{display:false}, ticks:{font:{size:9},color:C.text, callback:v=>v+'%'} },
        },
      },
    });
  }

  // ── REGIÕES (barras horizontais) ────────────────────────────────────
  function buildRegioes(canvasId, regioes) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || !regioes.labels.length) return;

    const cores = regioes.labels.map((_, i) => {
      const palette = [C.light, '#AAAAAA', C.gray, '#444444', C.red];
      return palette[Math.min(i, palette.length - 1)];
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: regioes.labels,
        datasets: [{ label:'Receita', data:regioes.data, backgroundColor:cores, borderRadius:4 }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => `Receita: ${KorpData.fmtFull(c.raw)}` } },
        },
        scales: {
          x: { grid:{color:C.grid}, ticks:{font:{size:10},color:C.text, callback:v=>KorpData.fmt(v)} },
          y: { grid:{display:false}, ticks:{font:{size:11},color:'#444'} },
        },
      },
    });
  }

  return { buildReceitaMensal, buildDonut, buildPareto, buildRegioes };
})();
