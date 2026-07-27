# E2E browser local

Os testes usam somente o Vite local e interceptação Playwright; não usam banco,
credenciais, URLs ou serviços externos.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

No CI, instale o navegador antes de executar `npm run test:e2e`. Os próximos
fluxos devem usar os mesmos dados sintéticos/interceptação para clientes,
veículos, OS e financeiro; não devem depender de backend real.
