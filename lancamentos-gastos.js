// ============================================================
// lancamentos-gastos.js — Lançamentos individuais de gastos
// Contém: addLancamento(), deleteLancAndSync(),
//         syncLancamentosToCategoria(), renderLancamentos(),
//         renderCatXMesTable(), exportLancCSV()
// ============================================================

// ===================== LANÇAMENTOS =====================
// nextLancId declared in data.js

function getCatById(id){ return state.categorias.find(c=>c.id===id)||{icon:'📦',nome:'Sem categoria'}; }
function getMonthFromDate(dateStr){ return dateStr ? parseInt(dateStr.split('-')[1])-1 : -1; }
function fmtDate(dateStr){
  if(!dateStr) return '—';
  const [y,m,d]=dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function populateLancCatSelects(){
  const opts = state.categorias.map(c=>`<option value="${c.id}">${c.icon} ${c.nome}</option>`).join('');
  const lfCat = document.getElementById('lf-cat');
  if(lfCat) lfCat.innerHTML = opts;

  const filterCat = document.getElementById('lanc-filter-cat');
  if(filterCat){
    filterCat.innerHTML = '<option value="">Todas as categorias</option>' +
      state.categorias.map(c=>`<option value="${c.id}">${c.icon} ${c.nome}</option>`).join('');
  }
  const filterMes = document.getElementById('lanc-filter-mes');
  if(filterMes){
    filterMes.innerHTML = '<option value="">Todos os meses</option>' +
      state.meses.map((m,i)=>`<option value="${i}">${m}</option>`).join('');
  }
}

function addLancamento(){
  const data  = document.getElementById('lf-data').value;
  const desc  = document.getElementById('lf-desc').value.trim();
  const forn  = document.getElementById('lf-fornecedor').value.trim();
  const valor = parseBR(document.getElementById('lf-valor').value);
  const catId = parseInt(document.getElementById('lf-cat').value);
  const nf    = document.getElementById('lf-nf').value.trim();
  if(!data){ toast('⚠ Informe a data'); return; }
  if(valor<=0){ toast('⚠ Informe um valor válido'); return; }
  const lanc = {id:++nextLancId, data, desc:desc||'Sem descrição', fornecedor:forn, catId, valor, nf};
  state.lancamentos.push(lanc);
  // ── SYNC: recalcula os valores das categorias a partir dos lançamentos ──
  syncLancamentosToCategoria(catId);
  clearLancForm();
  persistState();
  renderLancamentos();
  if(document.getElementById('page-gastos').classList.contains('active')) renderGastosPage();
  renderDashboard();
  toast('✓ Lançado e categorias atualizadas!');
}

function deleteLancAndSync(id){
  const lanc = state.lancamentos.find(l=>l.id===id);
  state.lancamentos = state.lancamentos.filter(l=>l.id!==id);
  if(lanc) syncLancamentosToCategoria(lanc.catId);
  persistState();
  renderLancamentos();
  if(document.getElementById('page-gastos').classList.contains('active')) renderGastosPage();
  renderDashboard();
  toast('Lançamento removido e totais recalculados');
}

// Recalcula os valores[12] de uma categoria somando todos os lançamentos dela
function syncLancamentosToCategoria(catId){
  const cat = state.categorias.find(c=>c.id===catId);
  if(!cat) return;
  const novos = Array(12).fill(0);
  state.lancamentos.filter(l=>l.catId===catId).forEach(l=>{
    const m = getMonthFromDate(l.data);
    if(m>=0) novos[m] += l.valor;
  });
  cat.valores = novos;
}

// Recalcula TODAS as categorias (usado no delete em massa / import)
function syncAllCategoriasFromLancamentos(){
  state.categorias.forEach(cat=>{
    const novos = Array(12).fill(0);
    state.lancamentos.filter(l=>l.catId===cat.id).forEach(l=>{
      const m = getMonthFromDate(l.data);
      if(m>=0) novos[m] += l.valor;
    });
    cat.valores = novos;
  });
}

function clearLancForm(){
  document.getElementById('lf-data').value='';
  document.getElementById('lf-desc').value='';
  document.getElementById('lf-fornecedor').value='';
  document.getElementById('lf-valor').value='';
  document.getElementById('lf-nf').value='';
}

function deleteLanc(id){ deleteLancAndSync(id); }

function sortLanc(key){
  if(lancSortKey===key) lancSortDir*=-1;
  else { lancSortKey=key; lancSortDir=-1; }
  renderLancTable();
}

function getFilteredLancs(){
  const q   = (document.getElementById('lanc-search')?.value||'').toLowerCase();
  const cat = document.getElementById('lanc-filter-cat')?.value;
  const mes = document.getElementById('lanc-filter-mes')?.value;
  return state.lancamentos.filter(l=>{
    if(q && !`${l.desc} ${l.fornecedor} ${l.nf}`.toLowerCase().includes(q)) return false;
    if(cat && l.catId!==parseInt(cat)) return false;
    if(mes!=='' && mes!==undefined && getMonthFromDate(l.data)!==parseInt(mes)) return false;
    return true;
  });
}

function renderLancamentos(){
  populateLancCatSelects();
  renderLancKPIs();
  renderLancCharts();
  renderCatXMesTable();
  renderLancTable();
}

function renderLancKPIs(){
  const all = state.lancamentos;
  const total = all.reduce((s,l)=>s+l.valor,0);
  const count = all.length;
  const maior = all.length ? all.reduce((a,b)=>b.valor>a.valor?b:a) : null;

  // month with most spend
  const byMonth = Array(12).fill(0);
  all.forEach(l=>{ const m=getMonthFromDate(l.data); if(m>=0) byMonth[m]+=l.valor; });
  const maxM = byMonth.indexOf(Math.max(...byMonth));

  document.getElementById('lk-total').textContent = fmt(total);
  document.getElementById('lk-total-sub').textContent = count+' lançamentos';
  document.getElementById('lk-count').textContent = count;
  document.getElementById('lk-count-sub').textContent = state.categorias.length+' categorias';
  document.getElementById('lk-maior').textContent = maior ? fmt(maior.valor) : '—';
  document.getElementById('lk-maior-sub').textContent = maior ? getCatById(maior.catId).nome : '—';
  document.getElementById('lk-mesmax').textContent = maxM>=0 ? state.meses[maxM] : '—';
  document.getElementById('lk-mesmax-sub').textContent = maxM>=0 ? fmt(byMonth[maxM]) : '—';
}

function renderLancCharts(){
  // By category bar
  destroyChart('lc-cat-bar');
  const byCat = {};
  state.lancamentos.forEach(l=>{
    const k = l.catId;
    byCat[k] = (byCat[k]||0)+l.valor;
  });
  const catLabels = state.categorias.map(c=>c.icon+' '+c.nome);
  const catVals   = state.categorias.map(c=>byCat[c.id]||0);
  charts['lc-cat-bar'] = new Chart(document.getElementById('lc-cat-bar').getContext('2d'),{
    type:'bar',
    data:{labels:catLabels, datasets:[{label:'Total',data:catVals,backgroundColor:COLORS_CAT,borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
      scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}},
              y:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:8}}}}}
  });

  // Monthly evolution
  destroyChart('lc-mensal');
  const byMonth = Array(12).fill(0);
  state.lancamentos.forEach(l=>{ const m=getMonthFromDate(l.data); if(m>=0) byMonth[m]+=l.valor; });
  charts['lc-mensal'] = new Chart(document.getElementById('lc-mensal').getContext('2d'),{
    type:'bar',
    data:{labels:state.meses, datasets:[{label:'Lançado',data:byMonth,backgroundColor:'rgba(255,107,53,0.7)',borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });

  // Donut by category
  destroyChart('lc-cat-donut');
  charts['lc-cat-donut'] = new Chart(document.getElementById('lc-cat-donut').getContext('2d'),{
    type:'doughnut',
    data:{labels:catLabels, datasets:[{data:catVals,backgroundColor:COLORS_CAT,borderColor:'#111318',borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'right',labels:{color:'#5a6070',font:{family:'DM Mono',size:8},boxWidth:8,padding:5}},
               tooltip:{callbacks:{label:c=>c.label+': '+fmt(c.raw)}}},cutout:'60%'}
  });
}

function renderCatXMesTable(){
  // Build matrix: category × month from lancamentos
  const matrix = {};
  const colTotals = Array(12).fill(0);
  state.categorias.forEach(c=>{ matrix[c.id]=Array(12).fill(0); });
  state.lancamentos.forEach(l=>{
    const m=getMonthFromDate(l.data);
    if(m>=0 && matrix[l.catId]!==undefined){
      matrix[l.catId][m]+=l.valor;
      colTotals[m]+=l.valor;
    }
  });
  let html=`<thead><tr><th>Categoria</th>`;
  state.meses.forEach(m=>html+=`<th>${m}</th>`);
  html+=`<th>Total</th></tr></thead><tbody>`;
  state.categorias.forEach((cat,ci)=>{
    const row=matrix[cat.id]||Array(12).fill(0);
    const rowTotal=row.reduce((a,b)=>a+b,0);
    const color=COLORS_CAT[ci%COLORS_CAT.length];
    html+=`<tr><td><span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;"></span>${cat.icon} ${cat.nome}</span></td>`;
    row.forEach(v=>{
      html+=v>0 ? `<td>${fmt(v)}</td>` : `<td class="val-zero">—</td>`;
    });
    html+=`<td style="color:var(--accent2);font-weight:700">${fmt(rowTotal)}</td></tr>`;
  });
  html+=`</tbody><tfoot><tr><td>TOTAL</td>`;
  colTotals.forEach(v=>html+=`<td>${fmt(v)}</td>`);
  html+=`<td>${fmt(colTotals.reduce((a,b)=>a+b,0))}</td></tr></tfoot>`;
  document.getElementById('catxmes-table').innerHTML=html;
}

function renderLancTable(){
  let list = getFilteredLancs();
  // Sort
  list = [...list].sort((a,b)=>{
    let va=a[lancSortKey]||'', vb=b[lancSortKey]||'';
    if(lancSortKey==='valor'){ va=a.valor; vb=b.valor; }
    if(va<vb) return -lancSortDir;
    if(va>vb) return lancSortDir;
    return 0;
  });

  const tbody = document.getElementById('lanc-tbody');
  const tfoot = document.getElementById('lanc-tfoot');
  if(!list.length){
    tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px;font-family:'DM Mono',monospace;font-size:0.68rem;">Nenhum lançamento encontrado</td></tr>`;
    tfoot.innerHTML='';
    return;
  }

  tbody.innerHTML = list.map(l=>{
    const cat=getCatById(l.catId);
    const color=COLORS_CAT[state.categorias.findIndex(c=>c.id===l.catId)%COLORS_CAT.length]||'#ff6b35';
    return `<tr>
      <td style="color:var(--muted)">${fmtDate(l.data)}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;font-family:'Syne',sans-serif;font-weight:600;font-size:0.7rem;">${l.desc}</td>
      <td style="color:var(--muted)">${l.fornecedor||'—'}</td>
      <td><span class="cat-pill" style="background:${color}22;color:${color}">${cat.icon} ${cat.nome}</span></td>
      <td style="text-align:right;color:var(--accent2);font-weight:700">${fmt(l.valor)}</td>
      <td style="color:var(--muted)">${l.nf||'—'}</td>
      <td style="text-align:center"><button class="row-del-btn" onclick="deleteLanc(${l.id})" title="Remover">✕</button></td>
    </tr>`;
  }).join('');

  const grandTotal = list.reduce((s,l)=>s+l.valor,0);
  tfoot.innerHTML=`<tr>
    <td colspan="4">${list.length} lançamento(s) filtrado(s)</td>
    <td style="text-align:right">${fmt(grandTotal)}</td>
    <td colspan="2"></td>
  </tr>`;
}

function exportLancCSV(){
  let csv='Data,Descrição,Fornecedor,Categoria,Valor,NF/Doc\n';
  state.lancamentos.forEach(l=>{
    const cat=getCatById(l.catId);
    csv+=`"${fmtDate(l.data)}","${l.desc}","${l.fornecedor||''}","${cat.icon} ${cat.nome}","${l.valor.toFixed(2).replace('.',',')}","${l.nf||''}"\n`;
  });
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='lancamentos.csv';a.click();
  toast('CSV de lançamentos exportado!');
}
