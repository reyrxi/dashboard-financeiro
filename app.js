// ============================================================
// app.js — Configurações, exportação e inicialização
// Contém: renderSettings(), saveAndRefresh(), exportCSV(),
//         exportJSONToEditor(), importJSON(), inicialização
// ============================================================

// ===================== SETTINGS =====================
function renderSettings(){
  document.getElementById('cfg-year').value=state.year;
  document.getElementById('cfg-school').value=state.school;
  let html='';
  state.meses.forEach((m,i)=>{
    const active=state.activeMonths.includes(i);
    html+=`<button class="filter-btn ${active?'active':''}" onclick="toggleMonth(${i},this)">${m}</button>`;
  });
  document.getElementById('month-toggles').innerHTML=html;
  let html2='';
  state.meses.forEach((m,i)=>{
    html2+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
      <span style="font-family:'DM Mono',monospace;font-size:0.6rem;color:var(--muted);width:16px">${i+1}</span>
      <input class="setting-input" style="width:72px" value="${m}" onchange="renameMonth(${i},this.value)">
    </div>`;
  });
  document.getElementById('month-names-editor').innerHTML=html2;
}
function applySettings(){
  state.year=document.getElementById('cfg-year').value;
  state.school=document.getElementById('cfg-school').value;
  document.getElementById('footer-year').textContent=state.year;
}
function toggleMonth(i,btn){
  const idx=state.activeMonths.indexOf(i);
  if(idx>=0){if(state.activeMonths.length>1)state.activeMonths.splice(idx,1);else return;}
  else state.activeMonths.push(i);
  state.activeMonths.sort((a,b)=>a-b);
  btn.classList.toggle('active');
}
function renameMonth(i,val){state.meses[i]=val.toUpperCase().substring(0,3)||state.meses[i];}

// ===================== SAVE / EXPORT =====================
function saveAndRefresh(){
  persistState();
  renderDashboard();
  const activePage=document.querySelector('.page.active');
  if(activePage?.id==='page-lucratividade') renderLucratividade();
  if(activePage?.id==='page-gastos') renderGastosPage();
  if(activePage?.id==='page-lancamentos') renderLancamentos();
  if(activePage?.id==='page-reclancamentos') renderRecLancamentos();
  toast('✓ Salvo e atualizado!');
}
function exportCSV(){
  const months=[0,1,2,3,4,5,6,7,8,9,10,11];
  const n=state.turmas.length||1;
  let csv='=== RECEITAS ===\nTurma,'+state.meses.join(',')+'Total\n';
  state.turmas.forEach((t,ti)=>{
    const row=state.receitas[ti]||Array(12).fill(0);
    csv+=`"${t}",`+row.map(v=>v.toFixed(2).replace('.',',')).join(',')+','+row.reduce((a,b)=>a+b,0).toFixed(2).replace('.',',')+'\n';
  });
  csv+='\n=== GASTOS POR CATEGORIA ===\nCategoria,'+state.meses.join(',')+',Total\n';
  state.categorias.forEach(cat=>{
    csv+=`"${cat.icon} ${cat.nome}",`+cat.valores.map(v=>v.toFixed(2).replace('.',',')).join(',')+','+cat.valores.reduce((a,b)=>a+b,0).toFixed(2).replace('.',',')+'\n';
  });
  csv+='\n=== LUCRATIVIDADE ===\nTurma,Receita Anual,Gasto Rateado,Lucro,Margem%\n';
  const totalGasAno=state.categorias.reduce((s,cat)=>s+cat.valores.reduce((a,b)=>a+b,0),0);
  const gastoPorTurmaAno=totalGasAno/n;
  state.turmas.forEach((t,ti)=>{
    const rec=(state.receitas[ti]||[]).reduce((a,b)=>a+b,0);
    const luc=rec-gastoPorTurmaAno;
    const m=rec>0?(luc/rec*100):0;
    csv+=`"${t}",${rec.toFixed(2).replace('.',',')},${gastoPorTurmaAno.toFixed(2).replace('.',',')},${luc.toFixed(2).replace('.',',')},${m.toFixed(1)}\n`;
  });
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='financeiro-escolar.csv';a.click();
  toast('CSV exportado!');
}
function exportJSONToEditor(){
  document.getElementById('json-editor').value=JSON.stringify({turmas:state.turmas,receitas:state.receitas,categorias:state.categorias,lancamentos:state.lancamentos,recLancamentos:state.recLancamentos,meses:state.meses},null,2);
}
function importJSON(){
  try{
    const p=JSON.parse(document.getElementById('json-editor').value);
    if(p.turmas)state.turmas=p.turmas;
    if(p.receitas)state.receitas=p.receitas;
    if(p.categorias)state.categorias=p.categorias;
    if(p.lancamentos)state.lancamentos=p.lancamentos;
    if(p.recLancamentos)state.recLancamentos=p.recLancamentos;
    if(p.meses)state.meses=p.meses;
    syncAllCategoriasFromLancamentos();
    persistState();
    renderDashboard();toast('✓ Importado e salvo!');
  }catch(e){toast('JSON inválido: '+e.message);}
}

// ===================== FILTERS =====================
document.querySelectorAll('.filter-btn[data-month]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn[data-month]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');selectedMonth=btn.dataset.month;renderDashboard();
  });
});
document.querySelectorAll('.filter-btn[data-lmonth]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn[data-lmonth]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');selectedLMonth=btn.dataset.lmonth;renderLucratividade();
  });
});

// ===================== INIT =====================
(async function init() {
  // Preenche campos de credencial se já salvos
  const savedUrl = localStorage.getItem('sb_url');
  const savedKey = localStorage.getItem('sb_key');
  if (savedUrl) { const el = document.getElementById('cfg-sb-url'); if(el) el.value = savedUrl; }
  if (savedKey) { const el = document.getElementById('cfg-sb-key'); if(el) el.value = savedKey; }

  // Inicia dashboard com dados locais imediatamente
  renderDashboard();

  // Tenta conectar ao Supabase (se configurado)
  await dbInit();

  // Se conectou, re-renderiza com dados do banco
  if (dbConnected) renderDashboard();
})();
