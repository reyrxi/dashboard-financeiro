-e // ============================================================
// gastos.js — Aba de categorias de gastos mensais
// Contém: renderGastosPage(), renderCatCards(), updateCatValue(),
//         addCategory(), deleteCat(), renderReceitaTable()
// ============================================================

// ===================== GASTOS PAGE =====================
function renderGastosPage(){
  const n=state.turmas.length||1;
  document.getElementById('callout-nturmas').textContent=n+' turmas';

  // Render gastos mensal stacked bar
  destroyChart('gastosMensal');
  const months=state.activeMonths;
  const labels=months.map(m=>state.meses[m]);
  const datasets=state.categorias.map((cat,ci)=>({
    label:cat.icon+' '+cat.nome,
    data:months.map(m=>cat.valores[m]||0),
    backgroundColor:COLORS_CAT[ci%COLORS_CAT.length],
    borderRadius:2,
  }));
  charts['gastosMensal']=new Chart(document.getElementById('gastosMensalChart').getContext('2d'),{type:'bar',
    data:{labels,datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{color:'#5a6070',font:{family:'DM Mono',size:8},boxWidth:10,padding:8}},
               tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmt(c.raw)}}},
      scales:{x:{stacked:true,grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9}}},
              y:{stacked:true,grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });

  // Render category cards
  renderCatCards();

  // Update callout share
  const totalMesExemplo=state.categorias.reduce((s,cat)=>s+(cat.valores[0]||0),0);
  document.getElementById('callout-share').textContent=fmt(totalMesExemplo/n)+'/mês (Jan)';
}

function renderCatCards(){
  const n=state.turmas.length||1;
  const container=document.getElementById('cat-grid-container');
  let html='';
  state.categorias.forEach((cat,ci)=>{
    const total=cat.valores.reduce((a,b)=>a+b,0);
    html+=`<div class="cat-card" id="cat-card-${cat.id}">
      <div class="cat-header">
        <div style="display:flex;align-items:center;gap:4px;">
          <span class="cat-icon">${cat.icon}</span>
          <input class="cat-name-input" value="${cat.nome}" onchange="renameCat(${cat.id},this.value)" title="Clique para renomear">
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="cat-total-badge" id="cat-total-${cat.id}">${fmt(total)}</span>
          <button class="cat-delete-btn" onclick="deleteCat(${cat.id})" title="Remover categoria">✕</button>
        </div>
      </div>
      <div class="cat-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;">`;

    state.meses.forEach((mes,mi)=>{
      const v=cat.valores[mi]||0;
      const share=v/n;
      html+=`<div class="cat-month-row">
        <span class="cat-month-label">${mes}</span>
        <input class="cat-month-input" type="text" value="${v.toFixed(2).replace('.',',')}"
          onchange="updateCatValue(${cat.id},${mi},this.value)"
          onclick="this.select()" title="${mes}: ${fmt(v)} total · ${fmt(share)} por turma">
        <span class="cat-month-share" id="cat-share-${cat.id}-${mi}" title="Por turma">${fmt(share)}/turma</span>
      </div>`;
    });

    html+=`        </div>
      </div>
    </div>`;
  });
  container.innerHTML=html;
}

function updateCatValue(catId, mi, val){
  const num=parseBR(val);
  const cat=state.categorias.find(c=>c.id===catId);
  if(!cat) return;
  cat.valores[mi]=num;
  const n=state.turmas.length||1;
  // update share display
  const shareEl=document.getElementById(`cat-share-${catId}-${mi}`);
  if(shareEl) shareEl.textContent=fmt(num/n)+'/turma';
  // update total badge
  const total=cat.valores.reduce((a,b)=>a+b,0);
  const totalEl=document.getElementById(`cat-total-${catId}`);
  if(totalEl) totalEl.textContent=fmt(total);
}

function renameCat(catId,val){
  const cat=state.categorias.find(c=>c.id===catId);
  if(cat) cat.nome=val.trim()||cat.nome;
}

function deleteCat(catId){
  const cat=state.categorias.find(c=>c.id===catId);
  if(!cat) return;
  if(!confirm(`Remover categoria "${cat.nome}"?`)) return;
  state.categorias=state.categorias.filter(c=>c.id!==catId);
  renderGastosPage();
  toast('Categoria removida');
}

function addCategory(){
  const name=document.getElementById('new-cat-name').value.trim();
  const icon=document.getElementById('new-cat-icon').value;
  if(!name){toast('Digite o nome da categoria');return;}
  state.categorias.push({id:++nextCatId,icon,nome:name,valores:Array(12).fill(0)});
  document.getElementById('new-cat-name').value='';
  renderGastosPage();
  toast(`"${name}" adicionada!`);
}

function expandAllCats(){
  // cards are always visible — just scroll to top of grid
  document.getElementById('cat-grid-container').scrollIntoView({behavior:'smooth'});
}

// ===================== RECEITA TABLE =====================
function renderReceitaTable(){
  const table=document.getElementById('editor-rec-table');
  let html='<thead><tr><th>Turma</th>';
  state.meses.forEach(m=>html+=`<th>${m}</th>`);
  html+='<th>Total</th><th></th></tr></thead><tbody>';
  state.turmas.forEach((t,ti)=>{
    const total=(state.receitas[ti]||[]).reduce((a,b)=>a+b,0);
    html+=`<tr><td><input class="turma-input" value="${t}" onchange="renameTurma(${ti},this.value)"></td>`;
    for(let m=0;m<12;m++){
      const v=(state.receitas[ti]?.[m]||0).toFixed(2).replace('.',',');
      html+=`<td><input class="cell-input" type="text" value="${v}" onchange="updateRecCell(${ti},${m},this.value)" onclick="this.select()"></td>`;
    }
    html+=`<td class="row-total-rec" id="rec-row-${ti}">${fmt(total)}</td>`;
    html+=`<td><button class="delete-btn" onclick="deleteTurma(${ti})" title="Remover">✕</button></td></tr>`;
  });
  html+='<tr class="col-total-row"><td>TOTAL</td>';
  for(let m=0;m<12;m++){
    const t=state.turmas.reduce((_,__,ti)=>_+(state.receitas[ti]?.[m]||0),0);
    html+=`<td id="rec-col-${m}">${fmt(t)}</td>`;
  }
  const grand=state.receitas.reduce((s,r)=>s+(r||[]).reduce((a,b)=>a+b,0),0);
  html+=`<td id="rec-col-all">${fmt(grand)}</td><td></td></tr></tbody>`;
  table.innerHTML=html;
}

function updateRecCell(ti,mi,val){
  const num=parseBR(val);
  if(!state.receitas[ti]) state.receitas[ti]=Array(12).fill(0);
  state.receitas[ti][mi]=num;
  const rowT=(state.receitas[ti]||[]).reduce((a,b)=>a+b,0);
  const rEl=document.getElementById(`rec-row-${ti}`);if(rEl)rEl.textContent=fmt(rowT);
  const colT=state.turmas.reduce((_,__,i)=>_+(state.receitas[i]?.[mi]||0),0);
  const cEl=document.getElementById(`rec-col-${mi}`);if(cEl)cEl.textContent=fmt(colT);
  const grand=state.receitas.reduce((s,r)=>s+(r||[]).reduce((a,b)=>a+b,0),0);
  const aEl=document.getElementById('rec-col-all');if(aEl)aEl.textContent=fmt(grand);
}

function renameTurma(ti,val){state.turmas[ti]=val.trim()||state.turmas[ti];}
function deleteTurma(ti){
  if(!confirm(`Remover "${state.turmas[ti]}"?`)) return;
  state.turmas.splice(ti,1);state.receitas.splice(ti,1);
  renderReceitaTable();toast('Turma removida');
}
function addTurma(){
  const name=document.getElementById('new-turma-name').value.trim();
  if(!name){toast('Digite o nome');return;}
  state.turmas.push(name.toUpperCase());state.receitas.push(Array(12).fill(0));
  document.getElementById('new-turma-name').value='';
  renderReceitaTable();toast(`"${name.toUpperCase()}" adicionada!`);
}
function fillSameValue(){
  const val=prompt('Preencher zeros com qual valor? Ex: 3000,00');if(!val)return;
  const num=parseBR(val);
  state.receitas.forEach(row=>{for(let m=0;m<12;m++)if(!row[m])row[m]=num;});
  renderReceitaTable();toast('Valores preenchidos');
}
