> Sistema de gestão financeira construído por um empreendedor para resolver um problema real da própria escola — do zero, sem equipe de TI.

**[🔗 Ver demo ao vivo →](https://reyrxi.github.io/dashboard-financeiro/)**

---

## 🧠 O problema que resolvi

Gerenciar as finanças de uma escola com múltiplas turmas em planilhas separadas é caótico: receitas misturadas, gastos sem categorização, impossível saber a lucratividade real por turma.

Precisava de um painel que mostrasse, em tempo real:
- Qual turma dá mais lucro?
- Quais categorias de gasto estão pesando mais?
- Como está o fluxo do mês comparado ao histórico?

Não encontrei uma solução acessível. Então **construí uma**.

---

## 🎯 O que o sistema faz

| Módulo | Funcionalidade |
|--------|---------------|
| **Dashboard** | KPIs em tempo real · gráfico receita vs gastos vs lucro · heatmap por turma |
| **Lucratividade** | Margem e lucro líquido por turma · ranking automático · gráficos comparativos |
| **Gastos** | 8 categorias editáveis mês a mês · rateio proporcional entre turmas |
| **Receitas** | Tabela editável célula a célula · totais ao vivo |
| **Lançamentos de Gastos** | Registro com data, fornecedor, NF · sincroniza categorias automaticamente |
| **Lançamentos de Receitas** | Registro por aluno/turma · sincroniza tabela de receitas automaticamente |
| **Configurações** | Banco de dados na nuvem · backup JSON · personalização completa |

---

## ⚙️ Stack técnica

Escolhi tecnologias sem dependência de servidor para o sistema funcionar em qualquer lugar, incluindo offline — ideal para uma escola com infraestrutura limitada.

```
Frontend     → HTML5 + CSS3 + JavaScript puro (ES6+)
Gráficos     → Chart.js 4.4
Banco        → Supabase (PostgreSQL na nuvem, gratuito)
Tempo real   → Supabase Realtime (WebSocket)
Tipografia   → Syne + DM Mono (Google Fonts)
Hospedagem   → GitHub Pages / Cloudflare Pages
```

**Sem frameworks, sem build tools, sem dependências de npm** — qualquer pessoa consegue abrir e rodar.

---

## 🏗️ Arquitetura

O sistema é organizado em módulos com responsabilidades claras:

```
dashboard-financeiro/
├── index.html              ← Estrutura e layout das 7 abas
├── style.css               ← Design system completo (tema escuro, variáveis CSS)
│
├── js/
│   ├── data.js             ← Estado global único (state)
│   ├── db.js               ← Integração Supabase: save, load, realtime sync
│   ├── utils.js            ← Funções puras: formatação, navegação, cálculos
│   ├── dashboard.js        ← KPIs e 4 gráficos principais
│   ├── lucratividade.js    ← Análise de margem e lucro por turma
│   ├── gastos.js           ← CRUD de categorias + tabela de receitas
│   ├── lancamentos-gastos.js   ← Lançamentos individuais com sync automático
│   ├── lancamentos-receitas.js ← Lançamentos por aluno com sync automático
│   └── app.js              ← Inicialização, configurações, exportação
│
└── docs/
    ├── COMO-CONFIGURAR-BANCO.html  ← Guia Supabase passo a passo
    └── COMO-HOSPEDAR.html          ← Guia hospedagem com acesso privado
```

### Decisão de design: sync bidirecional

A parte mais desafiadora foi a sincronização entre lançamentos e totais. Ao registrar uma fatura de luz em Janeiro, o sistema recalcula automaticamente a categoria "Conta de Luz" e atualiza o dashboard — sem o usuário precisar fazer nada.

```js
// Recalcula valores[12] de uma categoria somando todos os lançamentos dela
function syncLancamentosToCategoria(catId) { ... }

// Versão completa — usada no import de backup
function syncAllCategoriasFromLancamentos() { ... }
```

---

## 🚀 Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/reyrxi/dashboard-financeiro.git
cd dashboard-financeiro

# Abra no navegador (sem servidor necessário)
open index.html   # macOS
start index.html  # Windows
```

> ⚠️ Use Chrome ou Edge. Firefox tem restrições de CORS para arquivos locais.

---

## 🗄️ Configurar banco de dados (opcional)

O sistema funciona offline com localStorage. Para salvar na nuvem e compartilhar com a equipe:

1. Crie conta gratuita em [supabase.com](https://supabase.com)
2. Execute o SQL de criação da tabela (veja `COMO-CONFIGURAR-BANCO.html`)
3. Cole as credenciais em **⚙️ Configurações → Banco de Dados**
4. Pronto — dados sincronizados em tempo real para todos os usuários

---

## 💡 Aprendizados

Construir esse sistema me ensinou na prática:

- **Gestão de estado sem framework** — manter um `state` global consistente entre 7 módulos exige disciplina e convenções claras
- **Sync em tempo real** — WebSockets com Supabase Realtime para propagar alterações entre usuários sem reload
- **UX para usuários não técnicos** — cada decisão de interface foi testada com a equipe da escola (secretaria, coordenação)
- **Debounce de salvamento** — evitar chamadas excessivas ao banco com um timer de 600ms

---

## 🔮 Próximos passos

- [ ] Autenticação por e-mail (Supabase Auth)
- [ ] Relatório em PDF exportável
- [ ] Comparativo entre anos letivos
- [ ] App mobile via PWA

---

## 👤 Sobre

Construído por um empreendedor do setor educacional que acredita que **gestores de escola deveriam ter as mesmas ferramentas de análise que empresas de tecnologia** — sem pagar R$ 500/mês por um ERP complicado.

**[LinkedIn →](https://linkedin.com/in/reyrxi)** · **[Ver demo →](https://reyrxi.github.io/dashboard-financeiro/)**