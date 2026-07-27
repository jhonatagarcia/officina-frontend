# E2E browser local

Os testes usam somente o Vite local e interceptação Playwright; não usam banco,
credenciais, URLs ou serviços externos.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

No CI, instale o navegador antes de executar `npm run test:e2e`. Os próximos
fluxos devem usar `fixtures/api.ts`: `syntheticSession` para papel/tenant,
`interceptApi` para resposta aderente ao contrato, `interceptApiError` para
erro seguro e `futureFlowFixtures` para listas de clientes, veículos, OS e
financeiro. Não devem depender de backend real.
