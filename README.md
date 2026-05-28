# Tele-prompter.app

Teleprompter web — roteiro com rolagem automática, webcam de fundo e gravação em MP4, tudo no navegador. Sem instalar nada, sem enviar nada para servidor: o texto e o vídeo ficam na sua máquina.

🔗 **Produção:** [tele-prompter.app](https://tele-prompter.app)

---

## Funcionalidades

- **Rolagem automática** suave (requestAnimationFrame) com velocidade ajustável (10–400 px/s).
- **Contagem regressiva** configurável antes de começar, com **beep** opcional (toggle na barra).
- **Controles de apresentação:** tamanho de fonte (24–140), altura de linha, margem lateral, cor do texto e cor de fundo, **espelhamento** (para vidro/beam splitter) e **tela cheia**.
- **Linha de leitura** de referência no centro do palco.
- **Roteiro:** edição inline, **carregar `.txt`** (botão ou arrastar-e-soltar) e **exportar `.txt`**.
- **Webcam de fundo** atrás do texto, com **palco redimensionável** e seleção de **câmera e microfone**.
- **Gravação em MP4** (com áudio) — grava a *câmera limpa*, sem o texto sobreposto — com **preview antes de baixar**. Cai para WebM automaticamente em navegadores que não suportam gravar MP4 (ex.: Firefox).

> ⚠️ **HTTPS é obrigatório para câmera/microfone.** A API `getUserMedia` só funciona em *secure context* (HTTPS ou `localhost`). Em produção, a webcam e a gravação dependem do SSL estar ativo.

---

## Atalhos de teclado

| Tecla | Ação |
|-------|------|
| `Espaço` | Iniciar (com contagem) / pausar |
| `↑` / `↓` | Aumentar / diminuir velocidade |
| `+` / `−` | Aumentar / diminuir fonte |
| `R` | Reiniciar do topo |
| `E` | Editar o roteiro |
| `M` | Espelhar |
| `F` | Tela cheia |
| `G` | Iniciar / parar gravação |

`Esc` sai do modo de edição.

---

## Stack

- **React 18** + **Vite 6** — SPA, sem backend.
- APIs do navegador: `getUserMedia`, `MediaRecorder`, Web Audio (beep), Container Query Units (CSS).

---

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # gera dist/
npm run preview  # serve o build localmente
```

---

## Deploy

A aplicação é um SPA estático: o Vite gera `dist/` e o Nginx serve os arquivos.

### Docker

```bash
docker compose build
docker compose up -d
```

O `Dockerfile` é multi-stage: builda com `node:22-slim` e serve o `dist/` com `nginx:alpine` (config SPA em [`nginx.conf`](nginx.conf), com fallback `try_files → /index.html`).

### CI/CD

Push em `main` dispara o GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)), que faz SSH no VPS e roda `/opt/deploy-teleprompter.sh` (pull + build + up). O proxy reverso e o SSL (Let's Encrypt) são gerenciados pelo Nginx Proxy Manager.

---

## Licença

Uso pessoal.
