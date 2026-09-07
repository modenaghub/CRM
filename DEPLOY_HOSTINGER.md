# Deploy no VPS da Hostinger (Docker Compose)

Este guia sobe o CRM completo (Postgres + API + Frontend) no seu VPS usando
Docker, acessível pelo IP do servidor (sem domínio/HTTPS por enquanto).

Tempo estimado: 20–30 minutos na primeira vez.

---

## 1. Acesse o VPS via SSH

No hPanel da Hostinger, a página do seu VPS mostra o **IP**, o usuário
(geralmente `root`) e a senha (ou você já configurou uma chave SSH).

No Windows, use o **PowerShell** (já vem pronto, não precisa instalar nada):

```powershell
ssh root@SEU_IP_DO_VPS
```

Digite a senha quando pedir (ela não aparece na tela enquanto você digita,
isso é normal).

---

## 2. Instale o Docker no VPS

Já dentro do VPS (via SSH), rode:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version
docker compose version
```

Se aparecer a versão do Docker e do Compose, está pronto.

---

## 3. Envie os arquivos do projeto para o VPS

A forma mais simples: use o mesmo `.zip` que já te enviei. No seu computador
(Windows), abra **outro** PowerShell (deixe o SSH aberto em um, use um novo
para isso) e rode, a partir da pasta onde você salvou o `.zip`:

```powershell
scp crm-platform-para-testar.zip root@SEU_IP_DO_VPS:/root/
```

Volte ao terminal SSH (conectado no VPS) e extraia:

```bash
cd /root
apt-get update && apt-get install -y unzip
unzip crm-platform-para-testar.zip
cd crm-platform
```

---

## 4. (Opcional, mas recomendado) Troque as senhas padrão

```bash
cp .env.example .env
nano .env
```

Troque os três valores por strings aleatórias suas (qualquer coisa longa e
única serve), salve com `Ctrl+O`, `Enter`, e saia com `Ctrl+X`. Se pular
esse passo, o sistema sobe com senhas padrão de desenvolvimento — funciona,
mas não é seguro deixar assim por muito tempo num servidor exposto na
internet.

---

## 5. Suba os containers

Ainda dentro de `/root/crm-platform`:

```bash
docker compose up -d --build
```

Isso vai baixar as imagens base, compilar a API e o frontend, e subir os
três serviços (banco, API, frontend). A primeira vez demora alguns minutos
(compilando tudo); depois disso, reiniciar é rápido.

Acompanhe os logs se quiser ver o progresso:

```bash
docker compose logs -f
```

(saia com `Ctrl+C` — isso não para os containers, só para de exibir logs)

---

## 6. Popule os dados de demonstração (só na primeira vez)

```bash
docker compose exec api node dist/src/db/seed.js
```

Isso cria a organização de demonstração "Alvorecer Dourado Ltda" com clientes,
prospects, produtos, oportunidades e tarefas de exemplo já prontos.

⚠️ Rode esse comando **apenas uma vez** — rodar de novo tentará criar os
mesmos registros duas vezes e vai dar erro de duplicidade. Se precisar
"zerar" os dados depois, veja a seção "Resetar os dados" no fim deste guia.

---

## 7. Libere a porta 80

No **hPanel da Hostinger**, procure a seção de **Firewall** do VPS e libere
a porta **80/tcp** (HTTP) se ela não estiver liberada por padrão.

Se o Ubuntu do VPS também tiver o `ufw` ativo, libere por lá também:

```bash
ufw allow 80/tcp
```

---

## 8. Acesse!

No navegador, abra:

```
http://SEU_IP_DO_VPS
```

Faça login com:

- **E-mail:** `admin@alvorecerdourado.com.br`
- **Senha:** `Demo@123`

Como não há domínio/HTTPS configurado ainda, o navegador pode mostrar um
aviso de "conexão não segura" — é esperado, o site funciona normalmente por
HTTP simples. Isso é suficiente para teste; para algo voltado a clientes
reais, o próximo passo natural é apontar um domínio para o IP e configurar
HTTPS gratuito (posso te ajudar com isso quando chegar a hora).

---

## Comandos úteis do dia a dia

```bash
# Ver status dos containers
docker compose ps

# Ver logs de um serviço específico
docker compose logs -f api
docker compose logs -f web

# Reiniciar tudo
docker compose restart

# Parar tudo (sem apagar dados)
docker compose down

# Parar tudo E apagar os dados do banco (cuidado!)
docker compose down -v

# Aplicar uma atualização de código: suba os arquivos novos e rode
docker compose up -d --build
```

## Resetar os dados de demonstração

```bash
docker compose down -v      # apaga o volume do Postgres
docker compose up -d --build
docker compose exec api node dist/src/db/seed.js
```
