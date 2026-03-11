# 📊 Dashboard Financeiro Escolar

Sistema completo de gestão financeira para escolas — receitas por turma, controle de gastos por categoria, lançamentos detalhados com NF e sincronização automática.

---

## 📁 Estrutura do projeto

```
escola-financeiro/
│
├── index.html                 ← Página principal (abre no navegador)
├── style.css                  ← Todo o visual do sistema
│
├── data.js                    ← Estado global: turmas, receitas, lançamentos
├── utils.js                   ← Funções utilitárias + navegação entre abas
├── dashboard.js               ← KPIs e gráficos da aba Dashboard
├── lucratividade.js           ← Análise de lucro e margem por turma
├── gastos.js                  ← Categorias de gastos + tabela de receitas
├── lancamentos-gastos.js      ← Lançamentos individuais de gastos (com NF)
├── lancamentos-receitas.js    ← Lançamentos individuais de receita (por aluno)
└── app.js                     ← Configurações, exportação e inicialização
```

---

## 🚀 Como usar localmente (sem internet)

1. Baixe todos os arquivos para uma pasta no computador
2. Abra o arquivo `index.html` no Google Chrome ou Edge
3. Pronto — o sistema funciona 100% offline

> ⚠️ **Atenção:** No Firefox, pode aparecer erro de CORS ao carregar arquivos locais. Use Chrome ou Edge.

---

## 💾 Salvando seus dados

O sistema **não tem banco de dados** — os dados ficam na memória enquanto a aba estiver aberta.

### Para não perder seus dados:

1. Vá em **⚙️ Configurações → Exportar atual**
2. Copie o JSON gerado e salve num arquivo `.json` no seu computador
3. Na próxima sessão, cole o JSON na mesma área e clique **Importar**

> 💡 **Dica:** Exporte o JSON toda semana como backup. No futuro podemos adicionar salvamento automático via Google Sheets ou banco de dados.

---

## 📋 Funcionalidades

| Aba | O que faz |
|-----|-----------|
| **Dashboard** | KPIs, gráfico receita vs gastos, mapa de calor por turma |
| **💰 Lucratividade** | Lucro e margem por turma, ranking, gráficos comparativos |
| **🔴 Gastos** | Categorias editáveis mês a mês, rateio automático entre turmas |
| **💚 Receitas** | Tabela editável por turma × mês |
| **🧾 Gastos Lanç.** | Lançamento com data, NF, fornecedor → sincroniza categorias |
| **💵 Receitas Lanç.** | Lançamento por aluno/turma → sincroniza tabela de receitas |
| **⚙️ Config** | Nome da escola, ano letivo, meses visíveis, backup JSON |

---

## 🛠️ Como editar os dados iniciais

Abra o arquivo **`data.js`** e edite a variável `state`:

```js
turmas: ['MATERNAL II', 'PRÉ I', ...],   // nomes das turmas
receitas: [[...], [...]],                  // valores por turma × mês
categorias: [{nome:'Luz', valores:[...]}]  // gastos por categoria × mês
```

---

*Desenvolvido com Chart.js · Fontes: Syne + DM Mono*
