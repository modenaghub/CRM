# Como rodar o CRM no seu computador (Windows)

Este pacote contém o código-fonte completo do CRM (backend + frontend). Siga os passos abaixo para colocá-lo no ar na sua máquina e navegar de verdade, com o mouse, no seu próprio navegador.

Tempo estimado: 15–20 minutos na primeira vez.

---

## 1. Pré-requisitos (instalar uma vez)

1. **Node.js 20 ou superior** — baixe em https://nodejs.org (escolha a versão "LTS") e instale normalmente (Next, Next, Finish).
2. **PostgreSQL 16** — baixe em https://www.postgresql.org/download/windows/ e instale. Durante a instalação:
   - Anote a senha que você definir para o usuário `postgres`.
   - Pode deixar a porta padrão `5432`.
   - Não precisa instalar o pgAdmin se não quiser, mas pode deixar marcado.
3. **pnpm** — depois de instalar o Node.js, abra o **PowerShell** ou **Prompt de Comando** e rode:
   ```
   corepack enable
   corepack prepare pnpm@10 --activate
   ```

---

## 2. Extraia o pacote

Extraia o `.zip` em uma pasta simples, por exemplo `C:\crm-platform`.

Abra o PowerShell **dentro dessa pasta** (clique com o botão direito na pasta → "Abrir no Terminal", ou navegue com `cd C:\crm-platform`).

---

## 3. Crie o banco de dados

Abra o **pgAdmin** (ou use o `psql` pelo menu iniciar, procurando por "SQL Shell (psql)") e rode:

```sql
CREATE USER crm WITH PASSWORD 'crm_dev_pw';
CREATE DATABASE crm_dev OWNER crm;
```

Se estiver usando o "SQL Shell (psql)": aperte Enter em cada pergunta até chegar na senha (a que você definiu na instalação do Postgres), depois cole os dois comandos acima.

---

## 4. Configure o backend

Dentro da pasta `apps\api`, já existe um arquivo `.env` pronto com os valores padrão (usuário/senha `crm` / `crm_dev_pw`, banco `crm_dev`). Se você usou um usuário/senha diferentes no passo 3, edite `apps\api\.env` e ajuste a linha `DATABASE_URL`.

---

## 5. Instale as dependências e prepare o banco

No PowerShell, na raiz do projeto (`C:\crm-platform`):

```powershell
pnpm install
pnpm db:migrate
pnpm db:seed
```

Isso instala tudo, cria as 48 tabelas e popula o banco com uma empresa de demonstração (VPJ Alimentos Ltda) já com clientes, prospects, produtos, oportunidades e tarefas de exemplo.

---

## 6. Suba o backend e o frontend

Abra **dois** terminais PowerShell na raiz do projeto (`C:\crm-platform`) e rode um comando em cada um (deixe os dois abertos):

**Terminal 1 — backend:**
```powershell
pnpm dev:api
```
Espere aparecer algo como `Nest application successfully started`.

**Terminal 2 — frontend:**
```powershell
pnpm dev:web
```
Espere aparecer `Local: http://localhost:5173/`.

---

## 7. Navegue!

Abra o navegador (Chrome, Edge etc.) em:

```
http://localhost:5173
```

Faça login com:

- **E-mail:** `admin@vpjalimentos.com.br`
- **Senha:** `Demo@123`

A partir daqui é só clicar à vontade: Dashboard, Clientes, Prospects, Oportunidades (arraste os cards entre as colunas do Kanban), Fornecedores, Produtos, Tarefas e Objetos personalizados.

Quer testar o motor de verticais (a parte mais importante da arquitetura)? Saia da conta (botão "Sair") e clique em "Criar organização" na tela de login, escolhendo o segmento **Oficina** — você vai ver um menu, um pipeline e um objeto "Veículo" completamente diferentes, criados automaticamente, sem nenhuma linha de código nova.

---

## Se algo der errado

- **"porta 5432 já em uso" ou erro de conexão com o banco**: confirme que o serviço do PostgreSQL está rodando (Painel de Controle → Serviços → "postgresql-x64-16" → Iniciar).
- **`pnpm` não é reconhecido**: feche e reabra o PowerShell depois do `corepack enable`, ou reinicie o computador.
- **Erro ao rodar `pnpm db:migrate`**: confira se `DATABASE_URL` em `apps\api\.env` bate com o usuário/senha/banco que você criou no passo 3.
