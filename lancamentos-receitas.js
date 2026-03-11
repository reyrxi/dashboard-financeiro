-e // ============================================================
// lancamentos-receitas.js — Lançamentos individuais de receita
// Contém: addRecLancamento(), deleteRecLanc(),
//         renderRecLancamentos(), renderRecLancCharts(),
//         renderRecLancTable(), exportRecLancCSV()
// ============================================================

// ===================== RECEITAS LANÇAMENTOS =====================
let nextRecLancId = 500;
let recLancSortKey = 'data', recLancSortDir = -1;

function populateRecLancSelects(){
  const opts = state.turmas.map((t,i)=>`<option value="${i}">${t}</option>`).join('');
  const sel = document.getElementById('rl-turma');
  if(sel) sel.innerHTML = opts;

  const fTurma = document.getElementById('rl-filter-turma');
  if(fTurma) fTurma.innerHTML = '<option value="">Todas as turmas</option>' + opts;

  const fMes = document.getElementById('rl-filter-mes');
  if(fMes) fMes.innerHTML = '<option value="">Todos os meses</option>' +
    state.meses.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
}

function addRecLancamento(){
  const data     = document.getElementById('rl-data').value;
  const desc     = document.getElementById('rl-desc').value.trim();
  const aluno    = document.getElementById('rl-aluno').value.trim();
  const valor    = parseBR(document.getElementById('rl-valor').value);
  const turmaIdx = parseInt(document.getElementById('rl-turma').value);
  const recibo   = document.getElementById('rl-recibo').value.trim();
  if(!data){ toast('⚠ Informe a data'); return; }
  if(valor<=0){ toast('⚠ Informe um valor válido'); return; }
  if(isNaN(turmaIdx)){ toast('⚠ Selecione uma turma'); return; }

  const lanc = {id:++nextRecLancId, data, desc:desc||'Receita', aluno, valor, turmaIdx, recibo};
  state.recLancamentos.push(lanc);

  // ── SYNC: soma ao array de receitas da turma ──
  const mi = getMonthFromDate(data);
  if(mi>=0){
    if(!state.receitas[turmaIdx]) state.receitas[turmaIdx]=Array(12).fill(0);
    state.receitas[turmaIdx][mi] += valor;
  }

  clearRecLancForm();
  renderRecLancamentos();
  // atualiza aba receitas e dashboard
  if(document.getElementById('page-receitas').classList.contains('active')) renderReceitaTable();
  renderDashboard();
  toast(`✓ Receita lançada para ${state.turmas[turmaIdx]}!`);
}

function deleteRecLanc(id){
  const lanc = state.recLancamentos.find(l=>l.id===id);
  if(!lanc) return;
  // ── SYNC: subtrai do array de receitas ──
  const mi = getMonthFromDate(lanc.data);
  if(mi>=0 && state.receitas[lanc.turmaIdx]){
    state.receitas[lanc.turmaIdx][mi] = Math.max(0, (state.receitas[lanc.turmaIdx][mi]||0) - lanc.valor);
  }
  state.recLancamentos = state.recLancamentos.filter(l=>l.id!==id);
  renderRecLancamentos();
  if(document.getElementById('page-receitas').classList.contains('active')) renderReceitaTable();
  renderDashboard();
  toast('Lançamento removido e receita atualizada');
}

function clearRecLancForm(){
  ['rl-data','rl-desc','rl-aluno','rl-valor','rl-recibo'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
}

function sortRecLanc(key){
  if(recLancSortKey===key) recLancSortDir*=-1;
  else { recLancSortKey=key; recLancSortDir=-1; }
  renderRecLancTable();
}

function getFilteredRecLancs(){
  const q  = (document.getElementById('rl-search')?.value||'').toLowerCase();
  const ti = document.getElementById('rl-filter-turma')?.value;
  const mi = document.getElementById('rl-filter-mes')?.value;
  return state.recLancamentos.filter(l=>{
    if(q && !`${l.desc} ${l.aluno} ${l.recibo}`.toLowerCase().includes(q)) return false;
    if(ti!==''&&ti!==undefined && l.turmaIdx!==parseInt(ti)) return false;
    if(mi!==''&&mi!==undefined && getMonthFromDate(l.data)!==parseInt(mi)) return false;
    return true;
  });
}

function renderRecLancamentos(){
  populateRecLancSelects();
  renderRecLancKPIs();
  renderRecLancCharts();
  renderRecLancTable();
}

function renderRecLancKPIs(){
  const all = state.recLancamentos;
  const total = all.reduce((s,l)=>s+l.valor,0);
  const count = all.length;

  const byTurma = Array(state.turmas.length).fill(0);
  const byMonth = Array(12).fill(0);
  all.forEach(l=>{
    if(l.turmaIdx>=0) byTurma[l.turmaIdx]+=l.valor;
    const m=getMonthFromDate(l.data); if(m>=0) byMonth[m]+=l.valor;
  });
  const topTi = byTurma.indexOf(Math.max(...byTurma));
  const topMi = byMonth.indexOf(Math.max(...byMonth));

  document.getElementById('rlk-total').textContent = fmt(total);
  document.getElementById('rlk-total-sub').textContent = count+' lançamentos';
  document.getElementById('rlk-count').textContent = count;
  document.getElementById('rlk-count-sub').textContent = state.turmas.length+' turmas';
  document.getElementById('rlk-top').textContent = state.turmas[topTi]||'—';
  document.getElementById('rlk-top-sub').textContent = fmt(byTurma[topTi]||0);
  document.getElementById('rlk-mes').textContent = topMi>=0 ? state.meses[topMi] : '—';
  document.getElementById('rlk-mes-sub').textContent = fmt(byMonth[topMi]||0);
}

function renderRecLancCharts(){
  // Por turma
  destroyChart('rl-turma-bar');
  const byTurma = Array(state.turmas.length).fill(0);
  state.recLancamentos.forEach(l=>{ if(l.turmaIdx>=0) byTurma[l.turmaIdx]+=l.valor; });
  charts['rl-turma-bar'] = new Chart(document.getElementById('rl-turma-bar').getContext('2d'),{
    type:'bar',
    data:{labels:state.turmas, datasets:[{label:'Receita',data:byTurma,backgroundColor:COLORS_TURMAS,borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:8}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });

  // Por mês
  destroyChart('rl-mensal-bar');
  const byMonth = Array(12).fill(0);
  state.recLancamentos.forEach(l=>{ const m=getMonthFromDate(l.data); if(m>=0) byMonth[m]+=l.valor; });
  charts['rl-mensal-bar'] = new Chart(document.getElementById('rl-mensal-bar').getContext('2d'),{
    type:'bar',
    data:{labels:state.meses, datasets:[{label:'Recebido',data:byMonth,backgroundColor:'rgba(0,229,200,0.7)',borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });
}

function renderRecLancTable(){
  let list = getFilteredRecLancs();
  list = [...list].sort((a,b)=>{
    let va=a[recLancSortKey]||'', vb=b[recLancSortKey]||'';
    if(recLancSortKey==='valor'){ va=a.valor; vb=b.valor; }
    if(va<vb) return -recLancSortDir; if(va>vb) return recLancSortDir; return 0;
  });

  const tbody = document.getElementById('rl-tbody');
  const tfoot = document.getElementById('rl-tfoot');
  if(!list.length){
    tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px;font-family:'DM Mono',monospace;font-size:0.68rem;">Nenhum lançamento encontrado</td></tr>`;
    tfoot.innerHTML='';
    return;
  }
  tbody.innerHTML = list.map(l=>{
    const turma = state.turmas[l.turmaIdx]||'—';
    const tColor = COLORS_TURMAS[l.turmaIdx%COLORS_TURMAS.length];
    return `<tr>
      <td style="color:var(--muted)">${fmtDate(l.data)}</td>
      <td style="font-family:'Syne',sans-serif;font-weight:600;font-size:0.7rem;max-width:200px;overflow:hidden;text-overflow:ellipsis">${l.desc}</td>
      <td style="color:var(--muted)">${l.aluno||'—'}</td>
      <td><span class="cat-pill" style="background:${tColor}22;color:${tColor}">${turma}</span></td>
      <td style="text-align:right;color:var(--accent);font-weight:700">${fmt(l.valor)}</td>
      <td style="color:var(--muted)">${l.recibo||'—'}</td>
      <td style="text-align:center"><button class="row-del-btn" onclick="deleteRecLanc(${l.id})" title="Remover">✕</button></td>
    </tr>`;
  }).join('');
  const grandTotal = list.reduce((s,l)=>s+l.valor,0);
  tfoot.innerHTML=`<tr>
    <td colspan="4">${list.length} lançamento(s)</td>
    <td style="text-align:right">${fmt(grandTotal)}</td>
    <td colspan="2"></td>
  </tr>`;
}

function exportRecLancCSV(){
  let csv='Data,Descrição,Aluno/Responsável,Turma,Valor,Recibo/Doc\n';
  state.recLancamentos.forEach(l=>{
    const t=state.turmas[l.turmaIdx]||'—';
    csv+=`"${fmtDate(l.data)}","${l.desc}","${l.aluno||''}","${t}","${l.valor.toFixed(2).replace('.',',')}","${l.recibo||''}"\n`;
  });
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='receitas-lancamentos.csv';a.click();
  toast('CSV exportado!');
}
