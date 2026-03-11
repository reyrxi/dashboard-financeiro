-e // ============================================================
// dashboard.js — Aba principal com KPIs e gráficos gerais
// Contém: renderDashboard(), updateKPIs(), updateLineChart(),
//         updateCatDonut(), updateBarChart(), updateHeatmap()
// ============================================================

// ===================== DASHBOARD =====================
function renderDashboard(){
  updateKPIs(); updateLineChart(); updateCatDonut(); updateBarChart(); updateHeatmap();
}

function updateKPIs(){
  const months=getMonthList(selectedMonth);
  const totalRec=state.turmas.reduce((_,__,ti)=>_+months.reduce((s,m)=>s+(state.receitas[ti]?.[m]||0),0),0);
  const totalGas=getTotalGastosMeses(months);
  const lucro=totalRec-totalGas;
  const margin=totalRec>0?(lucro/totalRec*100):0;
  const turmaTotais=state.turmas.map((_,ti)=>months.reduce((s,m)=>s+(state.receitas[ti]?.[m]||0),0));
  const topIdx=turmaTotais.indexOf(Math.max(...turmaTotais));

  document.getElementById('k-rec').textContent=fmt(totalRec);
  document.getElementById('k-rec-sub').textContent=months.length+' mês(es) · '+state.turmas.length+' turmas';
  document.getElementById('k-gas').textContent=fmt(totalGas);
  document.getElementById('k-gas-sub').textContent=state.categorias.length+' categorias';
  const lEl=document.getElementById('k-luc');
  lEl.textContent=fmt(lucro);lEl.style.color=lucro>=0?'var(--green)':'var(--red)';
  document.getElementById('k-luc-sub').textContent=lucro>=0?'Positivo ✓':'⚠ Prejuízo';
  document.getElementById('k-top').textContent=state.turmas[topIdx]||'—';
  document.getElementById('k-top-sub').textContent=fmt(turmaTotais[topIdx]||0);
  const mEl=document.getElementById('k-margin');
  mEl.textContent=margin.toFixed(1)+'%';
  mEl.style.color=margin>30?'var(--green)':margin>10?'var(--gold)':'var(--red)';
  document.getElementById('k-margin-sub').textContent=margin>30?'Ótima':margin>10?'Razoável':'Atenção';
  document.getElementById('footer-year').textContent=state.year;
}

function destroyChart(id){if(charts[id]){charts[id].destroy();charts[id]=null;}}

function updateLineChart(){
  destroyChart('line');
  const months=state.activeMonths;
  const labels=months.map(m=>state.meses[m]);
  const recs=months.map(m=>state.turmas.reduce((_,__,ti)=>_+(state.receitas[ti]?.[m]||0),0));
  const gas=months.map(m=>state.categorias.reduce((s,cat)=>s+(cat.valores[m]||0),0));
  const lucros=recs.map((r,i)=>r-gas[i]);
  const ctx=document.getElementById('lineChart').getContext('2d');
  charts['line']=new Chart(ctx,{type:'line',
    data:{labels,datasets:[
      {label:'Receita',data:recs,borderColor:'#00e5c8',backgroundColor:'rgba(0,229,200,0.07)',borderWidth:2.5,pointRadius:4,tension:0.4,fill:true},
      {label:'Gastos',data:gas,borderColor:'#ff6b35',backgroundColor:'rgba(255,107,53,0.07)',borderWidth:2,pointRadius:3,tension:0.4,fill:true},
      {label:'Lucro',data:lucros,borderColor:'#22c55e',borderWidth:1.5,borderDash:[4,3],pointRadius:3,tension:0.4,fill:false},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#5a6070',font:{family:'DM Mono',size:9},boxWidth:10,padding:12}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmt(c.raw)}}},
      scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });
}

function updateCatDonut(){
  destroyChart('catDonut');
  const months=getMonthList(selectedMonth);
  const vals=state.categorias.map(cat=>months.reduce((s,m)=>s+(cat.valores[m]||0),0));
  const labels=state.categorias.map(cat=>cat.icon+' '+cat.nome);
  const ctx=document.getElementById('catDonutChart').getContext('2d');
  charts['catDonut']=new Chart(ctx,{type:'doughnut',
    data:{labels,datasets:[{data:vals,backgroundColor:COLORS_CAT,borderColor:'#111318',borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'right',labels:{color:'#5a6070',font:{family:'DM Mono',size:8},boxWidth:10,padding:6}},
               tooltip:{callbacks:{label:c=>c.label+': '+fmt(c.raw)}}},cutout:'62%'}
  });
}

function updateBarChart(){
  destroyChart('bar');
  const months=getMonthList(selectedMonth);
  const vals=state.turmas.map((_,ti)=>months.reduce((s,m)=>s+(state.receitas[ti]?.[m]||0),0));
  const ctx=document.getElementById('barChart').getContext('2d');
  charts['bar']=new Chart(ctx,{type:'bar',
    data:{labels:state.turmas,datasets:[{label:'Receita',data:vals,backgroundColor:COLORS_TURMAS,borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:8}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });
}

function updateHeatmap(){
  const allVals=state.receitas.flat().filter(v=>v>0);
  const minV=Math.min(...allVals),maxV=Math.max(...allVals);
  const norm=v=>(v-minV)/(maxV-minV||1);
  const color=r=>`rgba(${Math.round(10+r*20)},${Math.round(40+r*189)},${Math.round(40+r*160)},${0.3+r*0.7})`;
  const selM=selectedMonth==='all'?null:parseInt(selectedMonth);
  let html='<table><thead><tr><th></th>';
  state.activeMonths.forEach(m=>{const hl=selM===m?'color:#00e5c8;font-weight:700':'';html+=`<th style="${hl}">${state.meses[m]}</th>`;});
  html+='</tr></thead><tbody>';
  state.turmas.forEach((t,ti)=>{
    html+=`<tr><td>${t}</td>`;
    state.activeMonths.forEach(mi=>{
      const v=state.receitas[ti]?.[mi]||0;
      const dim=(selM!==null&&selM!==mi)?'opacity:0.15':'';
      html+=`<td title="${fmt(v)}" style="background:${color(norm(v))};${dim}"></td>`;
    });
    html+='</tr>';
  });
  html+='</tbody></table>';
  document.getElementById('heatmap').innerHTML=html;
}
