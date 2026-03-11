// ============================================================
// utils.js — Funções utilitárias e navegação entre abas
// Contém: fmt(), parseBR(), toast(), showTab(), getMonthList()
// ============================================================

// ===================== UTILS =====================
function fmt(v){return'R$'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function parseBR(s){return parseFloat(String(s).replace(/\./g,'').replace(',','.'))||0;}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
function getMonthList(sel){const a=state.activeMonths;if(sel==='all')return a;const m=parseInt(sel);return a.includes(m)?[m]:a;}

// Total de gastos de todas categorias para um conjunto de meses
function getTotalGastosMeses(months){
  return state.categorias.reduce((sum,cat)=>sum+months.reduce((s,m)=>s+(cat.valores[m]||0),0),0);
}
// Gasto por turma = total / nTurmas
function getGastoPorTurma(months){
  const n=state.turmas.length||1;
  return getTotalGastosMeses(months)/n;
}
// Gasto por turma por mês (para gráfico de linha)
function getGastoMensalTotal(){
  return state.meses.map((_,m)=>state.categorias.reduce((s,cat)=>s+(cat.valores[m]||0),0));
}

// ===================== TABS =====================
function showTab(tab,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  if(btn) btn.classList.add('active');
  if(tab==='gastos') renderGastosPage();
  if(tab==='receitas') renderReceitaTable();
  if(tab==='lucratividade') renderLucratividade();
  if(tab==='lancamentos') renderLancamentos();
  if(tab==='reclancamentos') renderRecLancamentos();
  if(tab==='settings') renderSettings();
}
