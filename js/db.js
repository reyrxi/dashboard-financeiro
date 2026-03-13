// ============================================================
// db.js — Integração com Supabase (banco de dados na nuvem)
// Salva e carrega o estado completo automaticamente.
// Todas as alterações são propagadas em tempo real para
// todos os usuários conectados.
// ============================================================

// ── Credenciais (preenchidas pelo usuário em ⚙️ Configurações) ──
let SUPABASE_URL = localStorage.getItem('sb_url') || '';
let SUPABASE_KEY = localStorage.getItem('sb_key') || '';

const DB_TABLE   = 'financeiro_state';
const DB_ROW_ID  = 'escola_principal'; // ID fixo — todos compartilham o mesmo registro

// ── Estado da conexão ──
let dbConnected  = false;
let dbSyncing    = false;
let realtimeSub  = null;
let supabaseClient = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================
async function dbInit() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    dbSetStatus('not_configured');
    return false;
  }

  try {
    // Carrega o cliente Supabase (CDN já incluído no index.html)
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Garante que a tabela e o registro existem
    await dbEnsureTable();

    // Carrega dados do banco
    const data = await dbLoad();
    if (data) {
      applyRemoteState(data);
    }

    // Ativa sync em tempo real
    dbSubscribeRealtime();

    dbConnected = true;
    dbSetStatus('connected');
    return true;

  } catch(e) {
    console.error('Supabase init error:', e);
    dbSetStatus('error', e.message);
    return false;
  }
}

// ============================================================
// GARANTIR TABELA E REGISTRO
// ============================================================
async function dbEnsureTable() {
  // Tenta inserir o registro padrão — ignora se já existe (upsert)
  const payload = buildPayload();
  const { error } = await supabaseClient
    .from(DB_TABLE)
    .upsert({ id: DB_ROW_ID, ...payload }, { onConflict: 'id', ignoreDuplicates: true });

  if (error && error.code !== '23505') { // 23505 = unique violation (já existe, tudo bem)
    throw new Error('Erro ao verificar tabela: ' + error.message);
  }
}

// ============================================================
// SALVAR (chamado após cada mutação do state)
// ============================================================
let _dbSaveTimer = null;

function dbSave() {
  if (!dbConnected || !supabaseClient) {
    // fallback: localStorage enquanto não configurado
    persistLocalStorage();
    return;
  }
  clearTimeout(_dbSaveTimer);
  _dbSaveTimer = setTimeout(async () => {
    dbSetSyncing(true);
    try {
      const { error } = await supabaseClient
        .from(DB_TABLE)
        .upsert({ id: DB_ROW_ID, ...buildPayload(), updated_at: new Date().toISOString() });

      if (error) throw error;
      dbSetStatus('connected');
    } catch(e) {
      console.error('dbSave error:', e);
      dbSetStatus('error', 'Erro ao salvar: ' + e.message);
    } finally {
      dbSetSyncing(false);
    }
  }, 600); // debounce 600ms
}

// ============================================================
// CARREGAR
// ============================================================
async function dbLoad() {
  const { data, error } = await supabaseClient
    .from(DB_TABLE)
    .select('*')
    .eq('id', DB_ROW_ID)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // não encontrado — primeira vez
    throw error;
  }
  return data;
}

// ============================================================
// TEMPO REAL — recebe atualizações de outros usuários
// ============================================================
function dbSubscribeRealtime() {
  if (realtimeSub) supabaseClient.removeChannel(realtimeSub);

  realtimeSub = supabaseClient
    .channel('financeiro-realtime')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: DB_TABLE,
      filter: `id=eq.${DB_ROW_ID}`
    }, (payload) => {
      if (dbSyncing) return; // ignora próprias atualizações
      applyRemoteState(payload.new);
      refreshAllVisiblePages();
      toast('🔄 Dados atualizados por outro usuário');
    })
    .subscribe();
}

// ============================================================
// APLICAR DADOS REMOTOS NO STATE LOCAL
// ============================================================
function applyRemoteState(row) {
  if (!row) return;
  try {
    if (row.turmas)          state.turmas          = row.turmas;
    if (row.receitas)        state.receitas         = row.receitas;
    if (row.categorias)      state.categorias       = row.categorias;
    if (row.lancamentos)     state.lancamentos      = row.lancamentos;
    if (row.rec_lancamentos) state.recLancamentos   = row.rec_lancamentos;
    if (row.meses)           state.meses            = row.meses;
    if (row.active_months)   state.activeMonths     = row.active_months;
    if (row.school)          state.school           = row.school;
    if (row.year)            state.year             = row.year;
    // recalcula IDs máximos para evitar colisões
    nextCatId = Math.max(100, ...state.categorias.map(c => c.id)) + 1;
    nextLancId = Math.max(200, ...state.lancamentos.map(l => l.id)) + 1;
    nextRecLancId = Math.max(500, ...(state.recLancamentos.map(l => l.id)||[0])) + 1;
  } catch(e) {
    console.error('applyRemoteState error:', e);
  }
}

// ============================================================
// MONTA PAYLOAD PARA SALVAR
// ============================================================
function buildPayload() {
  return {
    turmas:           state.turmas,
    receitas:         state.receitas,
    categorias:       state.categorias,
    lancamentos:      state.lancamentos,
    rec_lancamentos:  state.recLancamentos,
    meses:            state.meses,
    active_months:    state.activeMonths,
    school:           state.school,
    year:             state.year,
  };
}

// ============================================================
// FALLBACK: localStorage quando Supabase não configurado
// ============================================================
function persistLocalStorage() {
  try {
    localStorage.setItem('escola_financeiro_v1', JSON.stringify({
      turmas: state.turmas, receitas: state.receitas,
      categorias: state.categorias, lancamentos: state.lancamentos,
      recLancamentos: state.recLancamentos, meses: state.meses,
      activeMonths: state.activeMonths, school: state.school, year: state.year
    }));
  } catch(e) {}
}

function loadLocalStorage() {
  try {
    const s = localStorage.getItem('escola_financeiro_v1');
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}

// ============================================================
// UI — indicadores de status
// ============================================================
function dbSetStatus(status, msg) {
  const el = document.getElementById('db-status');
  if (!el) return;
  const configs = {
    not_configured: { icon: '⚠️', text: 'Banco não configurado — dados salvos localmente',  color: 'var(--gold)' },
    connected:      { icon: '🟢', text: 'Conectado ao banco · salvamento automático ativo',  color: 'var(--green)' },
    syncing:        { icon: '🔄', text: 'Salvando...',                                        color: 'var(--accent)' },
    error:          { icon: '🔴', text: 'Erro: ' + (msg||'verifique as credenciais'),         color: 'var(--red)' },
  };
  const c = configs[status] || configs.not_configured;
  el.innerHTML = `<span style="color:${c.color}">${c.icon} ${c.text}</span>`;
}

function dbSetSyncing(on) {
  dbSyncing = on;
  dbSetStatus(on ? 'syncing' : 'connected');
}

// ============================================================
// SALVAR CREDENCIAIS E RECONECTAR
// ============================================================
async function dbSaveCredentials() {
  const url = document.getElementById('cfg-sb-url')?.value.trim();
  const key = document.getElementById('cfg-sb-key')?.value.trim();
  if (!url || !key) { toast('⚠ Preencha URL e chave'); return; }

  SUPABASE_URL = url;
  SUPABASE_KEY = key;
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);

  dbConnected = false;
  supabaseClient = null;
  dbSetStatus('syncing');
  toast('Conectando ao banco...');

  const ok = await dbInit();
  if (ok) {
    toast('✅ Banco conectado! Dados carregados.');
    renderDashboard();
  }
}

// ============================================================
// RECARREGAR DADOS DO BANCO MANUALMENTE
// ============================================================
async function dbReload() {
  if (!supabaseClient) { toast('⚠ Banco não configurado'); return; }
  dbSetSyncing(true);
  try {
    const data = await dbLoad();
    if (data) {
      applyRemoteState(data);
      refreshAllVisiblePages();
      toast('✅ Dados recarregados do banco!');
    }
  } catch(e) {
    toast('Erro ao recarregar: ' + e.message);
  } finally {
    dbSetSyncing(false);
  }
}

// ============================================================
// REFRESH GERAL (chamado pelo realtime e pelo reload)
// ============================================================
function refreshAllVisiblePages() {
  renderDashboard();
  const activePage = document.querySelector('.page.active');
  if (activePage?.id === 'page-lucratividade') renderLucratividade();
  if (activePage?.id === 'page-gastos')         renderGastosPage();
  if (activePage?.id === 'page-receitas')       renderReceitaTable();
  if (activePage?.id === 'page-lancamentos')    renderLancamentos();
  if (activePage?.id === 'page-reclancamentos') renderRecLancamentos();
}

// ============================================================
// FUNÇÃO PÚBLICA: chamada em todo lugar que muta o state
// ============================================================
function persistState() {
  if (typeof saveUnitState === "function") saveUnitState(); // salva por unidade
  if (dbConnected) {
    dbSave();
  } else {
    persistLocalStorage();
  }
}
