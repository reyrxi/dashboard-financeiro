// ============================================================
// units.js — Gerenciamento de múltiplas unidades
// Controla qual unidade está ativa e renderiza a tela inicial
// ============================================================

// ── Estado das unidades ──
let units = [
  { id: 'unidade_1', name: 'Unidade 1', color: '#38bdf8', emoji: '🏫' },
  { id: 'unidade_2', name: 'Unidade 2', color: '#34d399', emoji: '🏫' },
];
let activeUnitId = null; // null = tela inicial

// Carrega unidades salvas
(function loadUnits() {
  try {
    const saved = localStorage.getItem('escola_units');
    if (saved) units = JSON.parse(saved);
  } catch(e) {}
})();

function saveUnits() {
  localStorage.setItem('escola_units', JSON.stringify(units));
}

// ============================================================
// TELA INICIAL — seletor de unidades
// ============================================================
function renderUnitsHome() {
  activeUnitId = null;
  document.getElementById('units-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';

  const grid = document.getElementById('units-grid');
  grid.innerHTML = units.map(u => {
    // Carrega KPIs do localStorage desta unidade
    let kpiHtml = '';
    try {
      const saved = localStorage.getItem(`escola_financeiro_${u.id}`);
      if (saved) {
        const s = JSON.parse(saved);
        const totalRec = (s.receitas || []).reduce((sum, r) => sum + (r || []).reduce((a, b) => a + b, 0), 0);
        const totalGas = (s.categorias || []).reduce((sum, c) => sum + (c.valores || []).reduce((a, b) => a + b, 0), 0);
        const lucro = totalRec - totalGas;
        kpiHtml = `<div class="unit-kpis">
          <div class="unit-kpi"><span>Receita</span><strong style="color:#34d399">R$${fmtK(totalRec)}</strong></div>
          <div class="unit-kpi"><span>Gastos</span><strong style="color:#f87171">R$${fmtK(totalGas)}</strong></div>
          <div class="unit-kpi"><span>Lucro</span><strong style="color:${lucro >= 0 ? '#38bdf8' : '#f87171'}">R$${fmtK(lucro)}</strong></div>
        </div>`;
      } else {
        kpiHtml = `<div class="unit-kpis"><div class="unit-kpi-empty">Sem dados ainda</div></div>`;
      }
    } catch(e) {}

    return `<div class="unit-card" onclick="enterUnit('${u.id}')">
      <div class="unit-card-glow" style="background:radial-gradient(ellipse at top,${u.color}15,transparent 70%)"></div>
      <div class="unit-card-border" style="border-color:${u.color}25"></div>
      <div class="unit-emoji">${u.emoji}</div>
      <div class="unit-name">${u.name}</div>
      ${kpiHtml}
      <div class="unit-footer">
        <span class="unit-enter">Entrar →</span>
        <button class="unit-edit-btn" onclick="event.stopPropagation();editUnit('${u.id}')">✏️</button>
      </div>
    </div>`;
  }).join('') + `
    <div class="unit-card unit-card-add" onclick="addUnit()">
      <div style="font-size:2.2rem;color:var(--muted);line-height:1">+</div>
      <div style="font-size:0.78rem;color:var(--muted);margin-top:10px;font-weight:500">Nova unidade</div>
    </div>`;
}

function fmtK(v) {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(0) + 'k';
  return sign + abs.toFixed(0);
}

// ============================================================
// ENTRAR EM UMA UNIDADE
// ============================================================
function enterUnit(unitId) {
  const unit = units.find(u => u.id === unitId);
  if (!unit) return;

  activeUnitId = unitId;
  loadUnitState(unitId);

  // Troca a row do Supabase para esta unidade
  window.CURRENT_DB_ROW_ID = unitId;

  // Mostra o app, esconde tela inicial
  document.getElementById('units-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';

  // Atualiza logo com botão de voltar
  const logo = document.querySelector('.tab-logo');
  if (logo) {
    logo.innerHTML = `<span style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="renderUnitsHome()">
      <span style="opacity:0.4;font-size:0.7rem">←</span>
      <span style="font-size:0.9rem">${unit.emoji}</span>
      <span>${unit.name}</span>
    </span>`;
  }

  // Reseta filtros e renderiza
  selectedMonth = 'all';
  selectedLMonth = 'all';
  document.querySelectorAll('.filter-btn[data-month]').forEach((b, i) => b.classList.toggle('active', i === 0));
  renderDashboard();

  // Reconecta realtime do Supabase para esta unidade
  if (typeof dbConnected !== 'undefined' && dbConnected) {
    dbSubscribeRealtime();
  }
}

// ============================================================
// STATE POR UNIDADE
// ============================================================
function loadUnitState(unitId) {
  const key = `escola_financeiro_${unitId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const p = JSON.parse(saved);
      ['turmas','receitas','categorias','lancamentos','recLancamentos','meses','activeMonths','school','year']
        .forEach(k => { if (p[k] !== undefined) state[k] = p[k]; });
    } else {
      // Primeira vez: defaults limpos para esta unidade
      const def = JSON.parse(JSON.stringify(STATE_DEFAULT));
      Object.assign(state, def);
      state.school = units.find(u => u.id === unitId)?.name || 'Escola';
    }
  } catch(e) {}
  nextCatId     = Math.max(100, ...state.categorias.map(c => c.id)) + 1;
  nextLancId    = Math.max(200, ...state.lancamentos.map(l => l.id)) + 1;
  nextRecLancId = Math.max(500, ...(state.recLancamentos.length ? state.recLancamentos.map(l => l.id) : [500])) + 1;
}

function saveUnitState() {
  if (!activeUnitId) return;
  try {
    localStorage.setItem(`escola_financeiro_${activeUnitId}`, JSON.stringify({
      turmas: state.turmas, receitas: state.receitas,
      categorias: state.categorias, lancamentos: state.lancamentos,
      recLancamentos: state.recLancamentos, meses: state.meses,
      activeMonths: state.activeMonths, school: state.school, year: state.year
    }));
  } catch(e) {}
}

// ============================================================
// ADICIONAR / EDITAR UNIDADE
// ============================================================
function addUnit() {
  const name = prompt('Nome da nova unidade:');
  if (!name?.trim()) return;
  const palette = ['#38bdf8','#34d399','#a78bfa','#fbbf24','#f87171','#fb923c'];
  const color = palette[units.length % palette.length];
  units.push({ id: 'unidade_' + Date.now(), name: name.trim(), color, emoji: '🏫' });
  saveUnits();
  renderUnitsHome();
  toast(`✓ "${name.trim()}" adicionada!`);
}

function editUnit(unitId) {
  const unit = units.find(u => u.id === unitId);
  if (!unit) return;
  const name = prompt('Novo nome:', unit.name);
  if (!name?.trim() || name.trim() === unit.name) return;
  unit.name = name.trim();
  saveUnits();
  renderUnitsHome();
  toast('✓ Nome atualizado!');
}
