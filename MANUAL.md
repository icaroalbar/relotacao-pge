# Manual do Sistema de Relotação — PGE-RJ

## O que é

Sistema web para automatizar a **relotação periódica** dos ~300 procuradores da PGE-RJ. A cada ciclo, o sistema distribui procuradores entre as 30 áreas respeitando:

- Nomeações da gestão (vagas vermelhas — livre escolha da direção)
- Escolha dos chefes de área (vagas verdes)
- Designações do PG (vagas amarelas — gabinete)
- **Acervo automático** (vagas azuis — algoritmo por antiguidade + preferências)

---

## Tipos de vaga (código de cores)

| Cor | Tipo | Quem decide |
|---|---|---|
| 🔲 Cinza | PG | Cargo único — Procurador-Geral |
| 🔴 Vermelho | Nomeação | Gestão (livre nomeação) |
| 🟢 Verde | Escolha do Chefe | Chefe da área indica |
| 🟡 Amarelo | Designação PG | PG designa (só gabinete) |
| 🔵 Azul | Acervo | **Sistema preenche automaticamente** |

---

## Fluxo de um ciclo completo

```
1. Configurar Áreas & Vagas
2. Criar o ciclo + gerar vagas
3. Preencher Nomeações (vermelho)
4. Preencher Designações PG (amarelo)
5. Registrar Escolhas dos Chefes (verde)
6. Importar preferências dos procuradores
7. Executar alocação de acervo (azul — automático)
8. Revisar no Mapa de Relotação
9. Encerrar ciclo
```

---

## Telas passo a passo

### 1 · Dashboard

Página inicial. Mostra:

- **Banner do ciclo** com data de abertura
- **Stepper de 5 etapas** — indica em qual fase do ciclo você está
- **Cards de métricas**: total de procuradores, áreas, formulários respondidos, saldo orçamentário
- **Composição das vagas**: barra mostrando quantas vagas de cada tipo existem
- **Próximas ações**: atalhos contextuais para o que falta fazer

> **Saldo orçamentário** = total de procuradores − total de vagas. Deve ser ≥ 0. Se negativo, há mais vagas do que procuradores — ajuste as áreas antes de encerrar.

---

### 2 · Áreas & Vagas

Cadastro e edição das 30 áreas com seus contadores de vagas.

**Criar área:**
1. Clique em **Nova área**
2. Preencha: código (ex: `PG-04`), nome, tipo (Especializada / Regional / Gabinete)
3. Defina quantas vagas de cada tipo
4. Salvar

**Editar área** (lápis) — altera contadores de vagas inline.

**Regra de orçamento (R4):** Σ vagas de todas as áreas ≤ total de procuradores. O Dashboard avisa se estiver excedido.

> **Atenção:** Vagas do tipo Designação existem **apenas** no Gabinete (PG-02). Vagas do tipo Escolha existem **apenas** em áreas Especializadas. Vagas PG existem **apenas** no Gabinete.

---

### 3 · Procuradores

Lista todos os procuradores ordenados por antiguidade.

**Colunas:**
- **Antiguidade** — posição no ranking (1 = mais antigo, escolhe primeiro)
- **Lotação Original** — onde estava antes do ciclo atual
- **Situação Atual** — permanência ou movimentação calculada
- **Nova Lotação** — área que o sistema atribuiu no ciclo corrente

**Filtros:** status (Lotado / Pendente / Em licença / Vacância) e busca por nome.

**Expandir** (ícone olho) → mostra histórico completo de lotações.

**Status dos procuradores:**
| Status | Significado |
|---|---|
| LOTADO | Tem vaga no ciclo atual |
| PENDENTE | Ainda sem vaga |
| EM_LICENCA | Inativo — não participa da alocação, vaga vai ao pool |
| VACANCIA | Aposentadoria/falecimento — igual à licença |

---

### 4 · Nomeações da Gestão

Preenchimento das **vagas vermelhas** (livre nomeação da direção).

1. Filtre por área se necessário
2. Clique em **Editar** na linha da vaga
3. Selecione o procurador no dropdown
4. Informe o cargo/rótulo se aplicável (ex: "Chefe", "Assessor")
5. Salvar

---

### 5 · Escolha dos Chefes

Preenchimento das **vagas verdes** — cada chefe de área indica quem ocupa suas vagas de escolha.

Funciona igual às Nomeações, mas exibindo apenas vagas do tipo ESCOLHA.

---

### 6 · Designações PG

Preenchimento das **vagas amarelas** do Gabinete (PG-02).

Só aparece vagas do tipo DESIGNAÇÃO. Fluxo igual às Nomeações.

---

### 7 · Mapa de Relotação ⭐

Visão geral de **todas as vagas**, agrupadas por área. É aqui que se revisa e ajusta manualmente.

**Como ler o mapa:**
- Cada card = uma vaga
- O **número** = posição da vaga na área
- A **borda colorida** = tipo da vaga
- O **nome** dentro = procurador alocado (ou "livre")
- "●manual" = vaga azul editada manualmente

**Editar uma vaga azul (acervo):**
1. Clique no card azul desejado
2. Selecione outro procurador no dropdown (ou deixe vazio para liberar)
3. Salvar

> Ao editar manualmente uma vaga azul, ela recebe `origem = MANUAL` e não será sobrescrita na próxima execução automática de acervo.

**Filtro por área** — útil para focar em uma área específica.

---

### 8 · Encerrar Ciclo

Gerencia o ciclo ativo. Dividido em etapas:

#### Criar ciclo
1. Informe o ID (ex: `2026.1`) e a data de abertura
2. Clique em **Criar ciclo e gerar vagas**
   - O sistema cria automaticamente todas as instâncias de vaga com base nos contadores das áreas

#### Executar alocação de acervo (Passo 1)
Clique em **Alocar acervo** para rodar o algoritmo R2:

```
Para cada procurador em ordem de antiguidade (mais antigo primeiro):
  → Percorre suas preferências em ordem
  → Ocupa a primeira área que ainda tem vaga azul disponível
  → Se nenhuma preferência satisfeita: fica sem vaga (PENDENTE)
```

**É idempotente** — pode rodar quantas vezes quiser. Limpa alocações automáticas anteriores e recalcula.

O resultado mostra:
- Quantos procuradores foram alocados
- Quantos ficaram sem vaga (sem preferências cadastradas ou todas as áreas preferidas já cheias)

#### Encerrar ciclo (Passo 2)
Só disponível com saldo orçamentário ≥ 0.

Ao encerrar:
- Congela um **snapshot** das vagas (preservado para sempre)
- Cria registros históricos de **Lotação** para cada procurador
- Calcula métricas: movimentações, permanências, % de 1ª preferência satisfeita
- Status do ciclo → **ENCERRADO**

> **Irreversível.** Confirme antes de prosseguir.

---

### 9 · Histórico de Ciclos

Lista todos os ciclos já executados. Clique em um ciclo para expandir e ver:
- Total de procuradores e vagas
- Número de movimentações e permanências
- Percentual de procuradores que ficaram na 1ª preferência

---

### 10 · Relatórios

Exportações disponíveis para ciclos **encerrados**:

| Arquivo | Conteúdo |
|---|---|
| `mapa_{ciclo}.xlsx` | Todas as vagas com ocupantes, colorido por tipo |
| `mapa_{ciclo}.pdf` | Mapa formatado em PDF para impressão/arquivo |
| `lotacoes_{ciclo}.xlsx` | Histórico de lotações do ciclo |
| `ato_{ciclo}.pdf` | **Ato administrativo formal** para publicação |
| `procuradores.xlsx` | Lista geral de procuradores |
| `areas.xlsx` | Estrutura de vagas por área |

---

## Importação via planilha Excel

`POST /importacao/planilha` (via API) ou use o endpoint no Swagger (`/docs`).

A planilha deve ter as seguintes **sheets**:

### Sheet: `Procuradores`
| Nome | Antiguidade | Status | LotacaoAtual |
|---|---|---|---|
| Dr. Carlos Mendes | 1 | LOTADO | PG-04 |
| Dra. Maria Silva | 2 | PENDENTE | |

Status aceitos: `LOTADO`, `PENDENTE`, `EM_LICENCA`, `VACANCIA`

### Sheet: `Areas`
| Codigo | Nome | Tipo | VagasPG | VagasNomeacao | VagasEscolha | VagasDesignacao | VagasAcervo |
|---|---|---|---|---|---|---|---|
| PG-04 | Proc. Tributária | ESPECIALIZADA | 0 | 4 | 3 | 0 | 31 |
| PG-02 | Gabinete da PG | GABINETE | 1 | 3 | 0 | 15 | 3 |

Tipo aceitos: `ESPECIALIZADA`, `REGIONAL`, `GABINETE`

### Sheet: `Preferencias`
Matriz onde a **linha 1** é o cabeçalho (células 1..N = códigos de área), e cada linha subsequente representa um procurador:

|  | PG-03 | PG-04 | 1PR-NIT | ... |
|---|---|---|---|---|
| 1 | 2 | 1 | 3 | |
| 2 | 1 | | 2 | |
| 3 | | 3 | 1 | |

- Coluna 0 = **antiguidade** do procurador
- Demais células = **ordem de preferência** (1 = mais querida, vazio = não quer)

### Sheet: `Nomeacoes` (opcional)
| AreaCodigo | Numero | Tipo | Cargo | ProcuradorAntig |
|---|---|---|---|---|
| PG-04 | 1 | NOMEACAO | Chefe | 5 |
| PG-02 | 6 | DESIGNACAO | Subprocurador | 12 |

---

## Algoritmo de Acervo — como funciona (R2)

O algoritmo é chamado **Serial Dictatorship**: procuradores escolhem em ordem de antiguidade, sem negociação.

**Regras:**
1. Procuradores com `ativo = false` (licença ou vacância) **não participam**. Suas vagas entram no pool.
2. Quem tem antiguidade 1 escolhe primeiro — pega sua área preferida se houver vaga azul disponível.
3. Se a 1ª preferência está cheia, tenta a 2ª, 3ª, etc.
4. Se nenhuma preferência tem vaga disponível: procurador fica `PENDENTE`.
5. Após o algoritmo, vagas azuis ainda livres permanecem sem ocupante.

**Garantia:** dois procuradores nunca disputam a mesma vaga — o mais antigo sempre ganhou antes.

---

## Regras de negócio importantes

| Regra | O que faz |
|---|---|
| R1 | Ordem de preenchimento: vermelho → amarelo → verde → azul |
| R2 | Acervo automático por Serial Dictatorship (antiguidade) |
| R3 | Gestão pode editar qualquer vaga a qualquer momento |
| R4 | Σ vagas ≤ total de procuradores (orçamento) |
| R5 | Licença libera vaga para o pool de acervo |
| R6 | Vacância libera vaga igualmente |
| R7 | Encerramento gera snapshot + histórico + ato |

---

## Perguntas frequentes

**Q: Posso rodar o acervo várias vezes?**
Sim. É idempotente — apaga as alocações automáticas anteriores e recalcula. Nomeações manuais (origem = MANUAL) não são tocadas.

**Q: O que acontece se um procurador não cadastrou preferências?**
Ele fica `PENDENTE` após o acervo. A gestão pode alocá-lo manualmente no Mapa.

**Q: Posso alterar uma vaga azul manualmente?**
Sim. No Mapa de Relotação, clique na vaga azul e selecione outro procurador. A vaga fica marcada como `manual` e não é sobrescrita pelo algoritmo.

**Q: Posso ter dois ciclos ativos?**
Não. Só um ciclo `EM_CURSO` por vez. Encerre ou cancele o atual para criar outro.

**Q: Como adicionar um procurador em licença?**
Edite o status para `EM_LICENCA` na tela de Procuradores. Ele não participará do próximo acervo, e sua vaga atual entrará no pool.

---

## Acesso rápido

| O que fazer | Onde ir |
|---|---|
| Ver situação geral do ciclo | Dashboard |
| Adicionar/editar área | Áreas & Vagas |
| Ver histórico de um procurador | Procuradores → ícone olho |
| Preencher vagas da gestão | Nomeações |
| Ver/editar qualquer vaga | Mapa de Relotação |
| Rodar o algoritmo | Encerrar Ciclo → Passo 1 |
| Gerar ato administrativo | Relatórios → `ato_{ciclo}.pdf` |
| Importar planilha | API `/docs` → POST /importacao/planilha |

---

## Stack técnica (para o time de TI)

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2 |
| Banco | PostgreSQL 16 |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Infra dev | Docker Compose |

**Subir o sistema:**
```bash
docker compose --profile app up -d
# Frontend: http://localhost:5173
# API + Swagger: http://localhost:8000/docs
```

**Rodar testes:**
```bash
make test
```
