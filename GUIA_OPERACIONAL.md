# Guia Operacional — Como Conduzir uma Relotação

> **Para quem é este guia:** Equipe de gestão responsável por conduzir o ciclo de relotação.
> Siga os passos na ordem. Cada etapa depende da anterior.

---

## Antes de começar

Acesse o sistema em **http://localhost:5173**

Você verá o Dashboard. Se ainda não há ciclo ativo, aparecerá um aviso em amarelo.

---

## ETAPA 1 — Configurar as Áreas e Vagas

> **Objetivo:** garantir que as 30 áreas estão cadastradas com os contadores de vagas corretos.

### 1.1 · Verificar se as áreas já estão cadastradas

1. Clique em **Áreas & Vagas** no menu lateral
2. Verifique se as 30 áreas aparecem na lista

Se a lista estiver vazia, importe via planilha (veja **Importação** abaixo) ou cadastre manualmente.

### 1.2 · Cadastrar uma área manualmente (se necessário)

1. Clique no botão **Nova área** (canto superior direito)
2. Preencha:
   - **Código:** ex. `PG-04`
   - **Nome:** ex. `Procuradoria Tributária`
   - **Tipo:** Especializada, Regional ou Gabinete
   - **Vagas:** informe quantas vagas de cada cor a área tem
3. Clique em **Salvar**

### 1.3 · Editar contadores de vagas

1. Na linha da área, clique no ícone de **lápis** (✏️)
2. Altere os números de vagas
3. Clique em **Salvar**

### 1.4 · Verificar o saldo orçamentário

Vá ao **Dashboard** e olhe o card **Saldo Orçamentário**.

- ✅ **Verde (+número):** tudo certo, há folga
- ❌ **Vermelho (−número):** há mais vagas do que procuradores — volte em Áreas & Vagas e reduza o total de vagas

> **Regra:** total de vagas ≤ total de procuradores (300). O sistema bloqueia o encerramento se estiver negativo.

---

## ETAPA 2 — Criar o Ciclo e Gerar as Vagas

> **Objetivo:** abrir o ciclo e instanciar as vagas individuais de cada área.

1. Clique em **Encerrar Ciclo** no menu lateral
2. Preencha:
   - **ID do ciclo:** use o formato `2026.1` (ano + semestre)
   - **Data de abertura:** data de hoje ou a data oficial de início
3. Clique em **Criar ciclo e gerar vagas**

O sistema criará automaticamente todas as vagas com base nos contadores das áreas. Você verá a confirmação no Dashboard — o stepper avançará para a Etapa 1 (✅ Configurar Áreas e Vagas).

---

## ETAPA 3 — Preencher as Nomeações da Gestão (vagas vermelhas)

> **Objetivo:** a direção indica quem ocupa as vagas de livre nomeação.

1. Clique em **Nomeações** no menu lateral
2. Você verá todas as vagas vermelhas agrupadas por área
3. Para cada vaga:
   1. Clique em **Editar**
   2. Selecione o procurador no dropdown `[antiguidade] Nome`
   3. Informe o cargo/rótulo se aplicável (ex: "Chefe", "Secretário de Gestão")
   4. Clique em **Salvar**
4. Repita para todas as áreas

> Filtre por área (canto superior direito) para trabalhar uma área de cada vez.

---

## ETAPA 4 — Preencher as Designações do PG (vagas amarelas)

> **Objetivo:** o Procurador-Geral designa quem ocupa as vagas do Gabinete.

1. Clique em **Designações PG** no menu lateral
2. Aparecerão apenas as vagas amarelas do Gabinete (PG-02)
3. Edite cada vaga da mesma forma que as Nomeações

---

## ETAPA 5 — Registrar as Escolhas dos Chefes (vagas verdes)

> **Objetivo:** cada chefe de área especializida indica seus procuradores de confiança.

1. Clique em **Escolha dos Chefes** no menu lateral
2. Edite cada vaga verde com o procurador indicado pelo chefe da respectiva área

> Dica: filtre por área para trabalhar com o chefe de cada área separadamente.

---

## ETAPA 6 — Importar as Preferências dos Procuradores

> **Objetivo:** alimentar o sistema com o ranking de preferências de cada procurador.

As preferências são coletadas externamente (formulário, planilha) e depois importadas.

### 6.1 · Formato da planilha de preferências

Crie um arquivo `.xlsx` com uma sheet chamada `Preferencias`:

| (vazio) | PG-03 | PG-04 | PG-05 | 1PR-NIT | ... |
|---|---|---|---|---|---|
| **1** | 2 | 1 | | 3 | |
| **2** | 1 | | 2 | | |
| **3** | | 3 | 1 | | |

- **Linha 1 (cabeçalho):** célula A1 vazia, demais células = códigos das áreas
- **Demais linhas:** célula A = **número de antiguidade** do procurador, demais células = **ordem de preferência** (1 = mais querida, deixe vazio se não quer aquela área)

### 6.2 · Importar a planilha

1. Acesse **http://localhost:8000/docs** (Swagger da API)
2. Procure o endpoint **POST /importacao/planilha**
3. Clique em **Try it out**
4. Preencha o campo `ciclo_id` com o ID do ciclo atual (ex: `2026.1`)
5. Clique em **Choose File** e selecione sua planilha
6. Clique em **Execute**
7. O retorno mostrará quantas preferências foram importadas

> A planilha pode conter também as sheets `Procuradores` e `Areas` para atualizar esses dados junto com as preferências.

### 6.3 · Verificar a importação

1. Volte ao **Dashboard**
2. O card **Formulários Respondidos** mostrará `X/300` — quantos procuradores têm preferências cadastradas
3. A seção **Próximas ações** avisará se ainda há procuradores sem preferências

---

## ETAPA 7 — Executar a Alocação de Acervo (vagas azuis)

> **Objetivo:** o sistema distribui automaticamente as vagas azuis por ordem de antiguidade.

1. Clique em **Encerrar Ciclo** no menu lateral
2. Na seção **Passo 1 — Executar alocação de acervo**, clique em **Alocar acervo**
3. Aguarde. O sistema mostrará:
   - ✅ `X procuradores alocados`
   - ⚠️ `Y sem vaga disponível` (procuradores sem preferências ou cujas áreas preferidas já estavam cheias)

**Pode rodar quantas vezes quiser** — o algoritmo é idempotente. Se fizer ajustes manuais nas nomeações e quiser recalcular o acervo, rode novamente.

### O que o algoritmo faz

O sistema percorre os procuradores do mais antigo (antiguidade 1) ao mais novo. Cada um ocupa a **primeira área da sua lista de preferências** que ainda tem vaga azul disponível. Se nenhuma de suas preferências tiver vaga, ele fica `PENDENTE`.

---

## ETAPA 8 — Revisar no Mapa de Relotação

> **Objetivo:** conferir o resultado final e fazer ajustes manuais se necessário.

1. Clique em **Mapa de Relotação** no menu lateral
2. Você verá todas as áreas com seus cards de vagas
3. Cada card mostra: número da vaga, cargo (se houver) e nome do ocupante

### Como interpretar os cards

- **Borda cinza:** vaga PG
- **Borda vermelha:** vaga de nomeação
- **Borda verde:** vaga de escolha
- **Borda amarela:** vaga de designação
- **Borda azul:** vaga de acervo (clicável para editar)
- **"livre":** vaga sem ocupante

### Fazer ajuste manual em vaga azul

1. Clique no card azul que deseja alterar
2. Selecione outro procurador no dropdown
3. Clique em **Salvar**

> A vaga ficará marcada com `● manual` e não será sobrescrita na próxima execução automática.

### Procurador ficou PENDENTE — o que fazer

Se após o acervo algum procurador ficou sem vaga:
1. Vá ao **Mapa de Relotação**
2. Encontre uma vaga azul livre em qualquer área
3. Clique na vaga e aloque o procurador manualmente

Ou volte a **Encerrar Ciclo** → **Alocar acervo** para tentar novamente (se novas vagas foram liberadas).

---

## ETAPA 9 — Encerrar o Ciclo

> **Objetivo:** fechar oficialmente o ciclo e gerar o ato administrativo.

⚠️ **Esta ação é irreversível.** Revise o Mapa antes de prosseguir.

1. Clique em **Encerrar Ciclo** no menu lateral
2. Verifique que o saldo orçamentário está ✅ (verde)
3. Na seção **Passo 2 — Encerrar ciclo**, clique em **Encerrar ciclo**
4. Leia a confirmação e clique em **Confirmar encerramento**

O sistema irá:
- Congelar o estado atual de todas as vagas (snapshot permanente)
- Registrar a lotação de cada procurador no histórico
- Calcular métricas do ciclo (movimentações, permanências, % 1ª preferência)

---

## ETAPA 10 — Gerar o Ato Administrativo e Relatórios

1. Clique em **Relatórios** no menu lateral
2. Localize o ciclo encerrado
3. Baixe os documentos necessários:

| Documento | Uso |
|---|---|
| **Ato administrativo (PDF)** | Publicação oficial / DOU |
| **Mapa de relotação (PDF)** | Arquivo interno |
| **Mapa de relotação (Excel)** | Análises e planilhas |
| **Lista de lotações (Excel)** | Conferência |

---

## Situações especiais

### Procurador entrou em licença durante o ciclo

1. Vá em **Procuradores**
2. Clique no ícone de olho (👁️) para expandir o procurador
3. O status deve ser atualizado via API (`PATCH /procuradores/{id}`) ou reimportação da planilha com status `EM_LICENCA`
4. Execute **Alocar acervo** novamente — a vaga dele voltará ao pool automaticamente

### Preciso desfazer uma alocação manual

1. Vá ao **Mapa de Relotação**
2. Clique na vaga azul
3. Selecione **— Vaga livre —** no dropdown
4. Salvar

### Preciso recomeçar o acervo do zero

1. Vá em **Encerrar Ciclo** → **Passo 1**
2. Clique em **Alocar acervo** novamente

Somente alocações automáticas (origem = AUTOMATICA) são limpas. Edições manuais (origem = MANUAL) são preservadas.

### Cometi um erro e preciso cancelar o ciclo

O ciclo pode ser cancelado via API:
```
POST /ciclos/{id}/cancelar
```
Acesse **http://localhost:8000/docs**, endpoint `POST /ciclos/{id}/cancelar`.

---

## Resumo visual do fluxo

```
INÍCIO
  │
  ▼
[1] Áreas & Vagas ──── Verificar/ajustar 30 áreas e contadores
  │
  ▼
[2] Encerrar Ciclo ─── Criar ciclo "2026.1" + gerar vagas
  │
  ▼
[3] Nomeações ───────── Preencher vagas vermelhas (gestão)
  │
  ▼
[4] Designações PG ──── Preencher vagas amarelas (gabinete)
  │
  ▼
[5] Escolha Chefes ──── Preencher vagas verdes (especializadas)
  │
  ▼
[6] Importar prefs ──── Planilha de preferências dos procuradores
  │
  ▼
[7] Alocar acervo ───── Algoritmo automático preenche vagas azuis
  │
  ▼
[8] Mapa ────────────── Revisar + ajustes manuais se necessário
  │
  ▼
[9] Encerrar Ciclo ──── Confirmar encerramento
  │
  ▼
[10] Relatórios ──────── Baixar ato administrativo (PDF)
  │
  ▼
FIM
```

---

## Dúvidas rápidas

| Dúvida | Resposta |
|---|---|
| Posso rodar o acervo mais de uma vez? | Sim, é seguro. Limpa somente alocações automáticas. |
| O que fazer com procurador sem preferências? | Alocar manualmente no Mapa após rodar o acervo. |
| Posso encerrar com vagas azuis vazias? | Sim, desde que o saldo orçamentário seja ≥ 0. |
| Como saber se alguém foi para sua 1ª preferência? | Dashboard → card "Formulários Respondidos" pós-encerramento mostra o %. |
| Quanto tempo leva o algoritmo de acervo? | Segundos — mesmo com 300 procuradores. |
| Posso importar a planilha várias vezes? | Sim, é um upsert — atualiza sem duplicar. |
