# Scorpion Bits · Apresentação

Apresentação/portfólio em HTML da Scorpion Bits, estúdio indie de jogos.
Feita com [Vite](https://vite.dev) e [PixiJS](https://pixijs.com) v8.

A cena ao fundo (poeira, escritório do projeto noir com brilho de lâmpada e o
detetive que caminha pelo chão conforme os slides mudam) é desenhada com
PixiJS. O texto é HTML comum, então é acessível, selecionável e indexável.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # gera a pasta dist/ (estática, base relativa)
npm run preview  # serve o build para conferir
```

O conteúdo de `dist/` funciona em qualquer hospedagem estática
(GitHub Pages, Netlify, Cloudflare Pages, o próprio scorpionbits.com).

## Navegação

Setas, `Espaço`, `PageUp/PageDown`, `Home/End`, teclas `1`–`8`, roda do mouse,
deslizar no celular, pontos na barra inferior e o índice (pasta "Anotações").
Cada slide tem um endereço (`#jogos`, `#educacao`, ...).

## Onde editar

| O quê | Onde |
|---|---|
| Textos e slides | `index.html` (uma `<section class="slide">` por slide) |
| Cores, fontes, layout | `src/style.css` (variáveis em `:root`) |
| Navegação e índice | `src/main.js` |
| Cena PixiJS (detetive, escritório, poeira) | `src/stage.js` |
| Imagens | `public/assets/noir/` |

O sprite do detetive (`detetive-sprites.png`) tem células de 111×224 px:
linha 0 = idle (13 quadros), linha 1 = caminhada (7 quadros).
Se trocar o sprite, ajuste as constantes no topo de `src/stage.js`.

Para adicionar um slide, copie uma `<section class="slide">` em `index.html`
com um `id` e um `data-title`; os pontos e o índice são gerados sozinhos.

## Pendências de conteúdo

- Capturas de tela ou GIFs de Tirania, AstroDash, Sitis e Tower Defence
  (os cartões de jogos hoje são só texto).
- Data da roda aberta no SESC Araraquara (hoje o slide só cita o evento).
- Contato (e-mail) do estúdio, se quiserem exibir.

## Prévia do site principal

`public/previa/` é uma cópia da branch `claude/projetos-portfolio` do repositório
`scorpion-bits.github.io`, publicada em `/portifolio/previa/` só para testar o site
novo antes do merge na `main`. As páginas têm `noindex`. É um retrato de um commit
(não acompanha a branch sozinho) e pode ser apagada quando o site novo for ao ar.
