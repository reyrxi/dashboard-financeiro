-e // ============================================================
// data.js — Estado global da aplicação
// Contém: state (turmas, receitas, categorias, lançamentos)
// ============================================================

const COLORS_TURMAS=['#00e5c8','#ff6b35','#a78bfa','#f5c842','#38bdf8','#fb7185','#4ade80','#fb923c','#c084fc','#e879f9'];
const COLORS_CAT=['#ff6b35','#f5c842','#a78bfa','#38bdf8','#fb7185','#4ade80','#fb923c','#c084fc','#e879f9','#22d3ee','#a3e635','#fbbf24'];

let state = {
  year:'2025', school:'Escola',
  meses:['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'],
  activeMonths:[0,1,2,3,4,5,6,7,8,9,10,11],
  turmas:['MATERNAL II','PRÉ I','PRÉ II','1º ANO','2º ANO','3º ANO','4º ANO','5º ANO','6º ANO'],
  receitas:[
    [2540.92,3263.40,3263.40,3263.40,3263.40,3263.40,3263.40,3263.40,3263.40,3263.40,3263.40,3263.40],
    [1721.15,2804.92,2804.92,2804.92,2804.92,2804.92,2804.92,2804.92,2804.92,2804.92,2804.92,2804.92],
    [3111.43,4912.59,4912.59,4912.59,4912.59,4912.59,4912.59,4912.59,4912.59,4912.59,4912.59,4912.59],
    [2982.81,3817.96,3817.96,3817.96,3817.96,3817.96,3817.96,3817.96,3817.96,3817.96,3817.96,3817.96],
    [4534.13,6312.39,6278.06,6278.06,6278.06,6278.06,6278.06,6278.06,6278.06,6278.06,6278.06,6278.06],
    [4502.26,6284.36,6912.21,6912.21,6912.21,6912.21,6912.21,6912.21,6912.21,6912.21,6912.21,6912.21],
    [3220.75,4974.68,4974.68,4974.68,4974.68,4974.68,4974.68,4974.68,4974.68,4974.68,4974.68,4974.68],
    [2133.84,4013.90,4013.90,4013.90,4013.90,4013.90,4013.90,4013.90,4013.90,4013.90,4013.90,4013.90],
    [3691.63,6319.23,6319.23,6319.23,6319.23,6319.23,6319.23,6319.23,6319.23,6319.23,6319.23,6319.23],
  ],
  // Categorias de gastos: cada categoria tem nome, icone e valores[12]
  categorias:[
    {id:1, icon:'⚡', nome:'Conta de Luz',     valores:[2800,3100,2900,2700,2600,3000,3200,3100,2800,2700,2900,3300]},
    {id:2, icon:'💧', nome:'Água',              valores:[600,600,600,600,600,600,600,600,600,600,600,600]},
    {id:3, icon:'🌐', nome:'Internet',          valores:[400,400,400,400,400,400,400,400,400,400,400,400]},
    {id:4, icon:'👨‍🏫',nome:'Salários',          valores:[18000,18000,18000,18000,18000,18000,18000,18000,18000,18000,18000,22000]},
    {id:5, icon:'📚', nome:'Material Didático', valores:[1200,500,800,400,400,400,400,400,400,400,800,200]},
    {id:6, icon:'🧹', nome:'Manutenção/Limpeza',valores:[900,900,900,900,900,900,900,900,900,900,900,900]},
    {id:7, icon:'🍽️', nome:'Alimentação/Cantina',valores:[2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000,2000]},
    {id:8, icon:'📣', nome:'Marketing',         valores:[500,500,1000,0,0,0,500,0,0,500,1000,500]},
  ],
  lancamentos:[
    {id:1, data:'2025-01-05', desc:'Conta de energia elétrica', fornecedor:'CEMIG', catId:1, valor:2800, nf:'NF-000101'},
    {id:2, data:'2025-01-08', desc:'Conta de água', fornecedor:'COPASA', catId:2, valor:600, nf:'NF-000102'},
    {id:3, data:'2025-01-10', desc:'Plano de internet', fornecedor:'Claro', catId:3, valor:400, nf:'NF-000103'},
    {id:4, data:'2025-01-15', desc:'Folha de pagamento janeiro', fornecedor:'RH Interno', catId:4, valor:18000, nf:'FP-JAN-25'},
    {id:5, data:'2025-01-20', desc:'Material didático - apostilas', fornecedor:'Gráfica Central', catId:5, valor:1200, nf:'NF-000201'},
    {id:6, data:'2025-01-22', desc:'Serviço de limpeza', fornecedor:'LimpMax', catId:6, valor:900, nf:'NF-000301'},
    {id:7, data:'2025-01-25', desc:'Insumos cantina', fornecedor:'Distribuidora Alves', catId:7, valor:2000, nf:'NF-000401'},
    {id:8, data:'2025-01-28', desc:'Impulsionamento redes sociais', fornecedor:'Meta Ads', catId:8, valor:500, nf:'RECIBO-001'},
    {id:9, data:'2025-02-05', desc:'Conta de energia elétrica', fornecedor:'CEMIG', catId:1, valor:3100, nf:'NF-000105'},
    {id:10, data:'2025-02-08', desc:'Conta de água', fornecedor:'COPASA', catId:2, valor:600, nf:'NF-000106'},
    {id:11, data:'2025-02-14', desc:'Folha de pagamento fevereiro', fornecedor:'RH Interno', catId:4, valor:18000, nf:'FP-FEV-25'},
    {id:12, data:'2025-02-18', desc:'Material didático - livros', fornecedor:'Livraria Saraiva', catId:5, valor:500, nf:'NF-000205'},
    {id:13, data:'2025-03-05', desc:'Conta de energia elétrica', fornecedor:'CEMIG', catId:1, valor:2900, nf:'NF-000110'},
    {id:14, data:'2025-03-12', desc:'Folha de pagamento março', fornecedor:'RH Interno', catId:4, valor:18000, nf:'FP-MAR-25'},
    {id:15, data:'2025-03-20', desc:'Campanha matrícula', fornecedor:'Agência Criativa', catId:8, valor:1000, nf:'NF-000502'},
  ],
  recLancamentos:[] // lançamentos de receita por turma
};

let selectedMonth='all', selectedLMonth='all';
let charts={};
let nextCatId=100;
let lancSortKey='data', lancSortDir=-1;
