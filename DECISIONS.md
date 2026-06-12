# Decisões de Arquitetura

## ADR 001 — Estilização da Landing Page: CSS escopado com custom properties (não Tailwind)

**Data:** 2026-06-12 · **Status:** Aceita

### Contexto

A reformulação da landing (referência `Landing Page.html`, design dark-first em CSS vanilla
com design tokens em `:root`) precisava decidir entre migrar para Tailwind — usado pelo
restante do app — ou manter CSS com custom properties.

### Análise do estado atual

- O app usa **Tailwind 3 + tokens HSL em CSS variables** (`globals.css`, padrão shadcn),
  com tema dark/light via classes `.dark`/`.light` no `<html>` (`theme-store.ts` + boot em
  `main.tsx`).
- A landing existente **já era CSS vanilla escopado** em `.landing-root`
  (`src/styles/landing.css`, comentário original: "isolated from app Tailwind styles") —
  uma decisão intencional anterior do projeto.

### Decisão

Manter a abordagem de **CSS escopado em `.landing-root` com custom properties**,
reescrevendo `landing.css` com os tokens do HTML de referência:

1. **Consistência com o que já existe na landing** — não introduz uma segunda forma de
   estilização: a landing já era CSS escopado e convive bem com o Tailwind do app (o
   modal de login, que reusa componentes do app, continua estilizado com Tailwind).
2. **Tokens isolados** — os tokens da landing usam prefixo `--lp-*` para não colidir com
   as variáveis HSL globais do Tailwind (ex.: redefinir `--border` como `rgba(...)` dentro
   de `.landing-root` quebraria `hsl(var(--border))` nos componentes do app usados no
   modal de login).
3. **Migrar para Tailwind exigiria** poluir o `tailwind.config` global com cores/sombras
   exclusivas da landing e reescrever keyframes/gradientes radiais complexos em CSS custom
   de qualquer forma — ganho nulo, risco de regressão no app.
4. **Tema dark/light** — o design é dark-first; as variantes light são overrides de token
   sob `:root.light .landing-root`, plugando no mecanismo de tema existente sem reinventá-lo.

### Consequências

- `landing.css` é o único stylesheet da landing, carregado apenas no chunk lazy da página.
- Imagens são trocadas editando somente `src/features/landing/assets/images.ts`.
- Conteúdo (planos, features, depoimentos, links) vive em `src/features/landing/content.ts`.
