// ============================================================
// lucratividade.js — Aba de análise de lucro por turma
// Contém: renderLucratividade(), gráficos de lucro/margem,
//         tabela de ranking de turmas
// ============================================================

// ===================== LUCRATIVIDADE =====================
function renderLucratividade(){
  const months=getMonthList(selectedLMonth);
  const n=state.turmas.length||1;
  const gastoPorTurma=getTotalGastosMeses(months)/n;

  const dados=state.turmas.map((t,ti)=>{
    const rec=months.reduce((s,m)=>s+(state.receitas[ti]?.[m]||0),0);
    const gas=gastoPorTurma;
    const luc=rec-gas;
    const margin=rec>0?(luc/rec*100):0;
    return{t,ti,rec,gas,luc,margin};
  }).sort((a,b)=>b.luc-a.luc);

  document.getElementById('luc-nturmas').textContent=n;

  const labels=dados.map(d=>d.t);
  const lucros=dados.map(d=>d.luc);
  const margens=dados.map(d=>d.margin);

  destroyChart('lucroBar');
  charts['lucroBar']=new Chart(document.getElementById('lucroBarChart').getContext('2d'),{type:'bar',
    data:{labels,datasets:[{label:'Lucro',data:lucros,backgroundColor:lucros.map(v=>v>=0?'rgba(34,197,94,0.8)':'rgba(255,69,96,0.8)'),borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.raw)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:8}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });

  destroyChart('margem');
  charts['margem']=new Chart(document.getElementById('margemChart').getContext('2d'),{type:'bar',
    data:{labels,datasets:[{label:'Margem',data:margens,backgroundColor:margens.map(m=>m>30?'rgba(34,197,94,0.8)':m>10?'rgba(245,200,66,0.8)':'rgba(255,69,96,0.8)'),borderRadius:3,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw.toFixed(1)+'%'}}},
      scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>v+'%'}},
              y:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:8}}}}}
  });

  destroyChart('recGas');
  charts['recGas']=new Chart(document.getElementById('recGasChart').getContext('2d'),{type:'bar',
    data:{labels,datasets:[
      {label:'Receita',data:dados.map(d=>d.rec),backgroundColor:'rgba(0,229,200,0.7)',borderRadius:3},
      {label:'Gasto rateado',data:dados.map(d=>d.gas),backgroundColor:'rgba(255,107,53,0.7)',borderRadius:3},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#5a6070',font:{family:'DM Mono',size:9},boxWidth:10}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmt(c.raw)}}},
      scales:{x:{grid:{display:false},ticks:{color:'#5a6070',font:{family:'DM Mono',size:8}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#5a6070',font:{family:'DM Mono',size:9},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}
  });

  const totalRec=dados.reduce((s,d)=>s+d.rec,0);
  const totalGas=getTotalGastosMeses(months);
  const totalLuc=totalRec-totalGas;
  const totalMargin=totalRec>0?(totalLuc/totalRec*100):0;
  const maxRec=Math.max(...dados.map(d=>d.rec));

  let html=`<thead><tr>
    <th style="text-align:center">#</th>
    <th style="text-align:left">Turma</th>
    <th>Receita</th>
    <th>Gasto rateado</th>
    <th>Lucro</th>
    <th>Margem</th>
    <th>Status</th>
  </tr></thead><tbody>`;

  dados.forEach((d,rank)=>{
    const badge=d.margin>30?`<span class="badge badge-green">✓ Ótima</span>`:d.margin>10?`<span class="badge badge-warn">~ Razoável</span>`:`<span class="badge badge-red">✗ Atenção</span>`;
    const lc=d.luc>=0?'color:var(--green)':'color:var(--red)';
    const bw=Math.round((d.rec/maxRec)*90);
    html+=`<tr>
      <td style="text-align:center;color:var(--muted);font-size:0.65rem">${rank+1}</td>
      <td><div style="margin-bottom:3px">${d.t}</div><div style="background:rgba(0,229,200,0.12);height:3px;border-radius:2px;width:${bw}%"></div></td>
      <td style="color:var(--accent)">${fmt(d.rec)}</td>
      <td style="color:var(--accent2)">${fmt(d.gas)}</td>
      <td style="${lc};font-weight:700">${fmt(d.luc)}</td>
      <td style="${lc}">${d.margin.toFixed(1)}%</td>
      <td>${badge}</td>
    </tr>`;
  });

  html+=`</tbody><tfoot><tr>
    <td></td><td>TOTAL ESCOLA</td>
    <td>${fmt(totalRec)}</td>
    <td style="color:var(--accent2)">${fmt(totalGas)}</td>
    <td style="${totalLuc>=0?'color:var(--green)':'color:var(--red)'};font-weight:800">${fmt(totalLuc)}</td>
    <td style="${totalMargin>=0?'color:var(--green)':'color:var(--red)'}">${totalMargin.toFixed(1)}%</td>
    <td></td>
  </tr></tfoot>`;
  document.getElementById('lucro-table').innerHTML=html;
}
