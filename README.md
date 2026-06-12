# OficinaPro Frontend

Frontend MVP em React + TypeScript para gestão de oficina mecânica, consumindo API REST com autenticação JWT, perfis de acesso e módulos operacionais.

## Arquitetura

O projeto foi organizado por domínio de negócio com uma camada compartilhada para infraestrutura:

- `src/app`: bootstrap global, providers e composição da aplicação.
- `src/components`: layout, componentes compartilhados e primitives no estilo `shadcn/ui`.
- `src/features`: módulos por domínio (`auth`, `dashboard`, `clients`, `vehicles`, `budgets`, `service-orders`, `inventory`, `financial`, `vehicle-history`).
- Cada feature concentra `types`, `services`, `schemas`, `hooks`, `components` e `pages` conforme necessário.
- `src/hooks`: hooks reutilizáveis, incluindo autenticação e parâmetros de listagem.
- `src/lib`: utilitários, envs e helpers genéricos.
- `src/routes`: roteamento, proteção de rotas e guards por perfil.
- `src/services`: cliente HTTP Axios, interceptors e helpers de integração.
- `src/store`: estado global de sessão com Zustand.
- `src/types`: contratos tipados de autenticação, paginação e domínios do negócio.
- `src/test`: setup global para Vitest e Testing Library.

## Fluxo de autenticação

- Login via `POST /auth/login`.
- Sessão persistida em `sessionStorage` com Zustand.
- Leitura de sessão separada dos hooks de rede para reduzir acoplamento.
- Interceptor Axios injeta `Authorization: Bearer <token>`.
- Respostas `401/403` emitem eventos de auth; a camada de UI decide toast e navegação.

## Perfis suportados

- `ADMIN`: acesso total.
- `ATENDENTE`: clientes, veículos, orçamentos, ordens de serviço e estoque.
- `MECANICO`: ordens de serviço e atualização de andamento.
- `FINANCEIRO`: dashboard e financeiro.

## Rotas principais

- `/login`
- `/app/dashboard`
- `/app/clientes`
- `/app/clientes/novo`
- `/app/clientes/:id`
- `/app/clientes/:id/editar`
- `/app/veiculos`
- `/app/veiculos/novo`
- `/app/veiculos/:id`
- `/app/veiculos/:id/editar`
- `/app/veiculos/:id/historico`
- `/app/orcamentos`
- `/app/orcamentos/novo`
- `/app/orcamentos/:id`
- `/app/ordens-servico`
- `/app/ordens-servico/:id`
- `/app/estoque`
- `/app/financeiro`

## Endpoints esperados

O frontend foi preparado para consumir os seguintes recursos REST:

- `POST /auth/login`
- `GET /auth/me`
- `GET /dashboard`
- `GET|POST|PUT /clientes`
- `GET|POST|PUT /veiculos`
- `GET /veiculos/:id/historico`
- `GET|POST /orcamentos`
- `POST /orcamentos/:id/aprovar`
- `POST /orcamentos/:id/reprovar`
- `POST /orcamentos/:id/converter-os`
- `GET|PUT|PATCH /ordens-servico`
- `GET|PUT /estoque`
- `GET /financeiro`
- `POST /financeiro/:id/registrar-pagamento`

Se o backend usar nomes diferentes, ajuste os arquivos em `src/features/**/services`.

## Setup

1. Instale dependências:

```bash
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env
```

3. Atualize `VITE_API_BASE_URL` para a URL real da API.

4. Para expor o Admin Master em `/admin/*`, defina:

```bash
VITE_ADMIN_PANEL_ENABLED=true
```

O backend correspondente tambem precisa de `ADMIN_PANEL_ENABLED=true`, `ADMIN_JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_INITIAL_PASSWORD`.

5. Rode a aplicação:

```bash
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run format`

## Testes

Cobertura inicial do MVP:

- renderização e envio do login;
- proteção de rotas;
- bloqueio por perfil;
- renderização condicional do menu;
- validação do schema de cliente.

## Decisões importantes

- `TanStack Query` para cache, loading e refetch padronizados.
- `React Hook Form + Zod` para formulários tipados e validação consistente.
- `Zustand` para sessão simples, previsível e desacoplada.
- `Axios` centralizado com interceptors para token e tratamento de erro.
- `Tailwind + primitives estilo shadcn/ui` para velocidade com consistência visual.
- Manifesto central de rotas/permissões para derivar guards e sidebar da mesma fonte.
- Reference data isolado em hooks compartilhados para evitar dependência lateral entre features.

## Melhorias futuras

- code-splitting por rota;
- filtros avançados e ordenação server-side;
- drawers/modais para formulários rápidos;
- refresh token;
- máscara de campos com UX mais refinada;
- testes de integração com MSW;
- dashboards com gráficos;
- upload de anexos e fotos da OS;
- auditoria visual de permissões por ação.
