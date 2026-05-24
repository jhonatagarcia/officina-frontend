# Prompt para backend: status AGUARDANDO_PECA com WhatsApp

Implemente um novo status de Ordem de Serviço chamado `AGUARDANDO_PECA`.

Contexto funcional:
- O status representa uma OS pausada porque a oficina aguarda chegada, separação ou confirmação de peça.
- Ele deve ficar entre `ABERTA` e `EM_ANDAMENTO` no fluxo operacional.
- Ao mudar a OS para `AGUARDANDO_PECA`, o backend deve disparar uma notificação WhatsApp para o cliente informando que o serviço está aguardando peça.

Regras esperadas:
- Atualizar o enum/validação de status de OS para aceitar `AGUARDANDO_PECA`.
- Permitir transições:
  - `ABERTA -> AGUARDANDO_PECA`
  - `AGUARDANDO_PECA -> EM_ANDAMENTO`
  - `AGUARDANDO_PECA -> FINALIZADA` somente se a regra de negócio atual permitir finalizar sem passar por execução.
- Retornar `AGUARDANDO_PECA` em listagens, detalhes, dashboard e filtros.
- Criar/ajustar o template WhatsApp com mensagem em PT-BR.

Sugestão de mensagem:

```text
Olá, {cliente}. A OS {numero_os} do veículo {placa} está aguardando peça para continuidade do serviço. Assim que a peça estiver disponível, retomaremos a execução e avisaremos você.
```

Contrato de resposta:
- Após atualização de status, manter o campo `whatsappNotification` já usado pelo frontend:

```json
{
  "whatsappNotification": {
    "status": "SENT | SKIPPED | FAILED",
    "reason": "string opcional"
  }
}
```

Critérios de aceite:
- Frontend consegue atualizar uma OS para `AGUARDANDO_PECA`.
- Cliente recebe WhatsApp quando houver telefone válido e integração ativa.
- Se o envio falhar, a OS ainda muda de status e o backend retorna `whatsappNotification.status = "FAILED"`.
- Filtros por status conseguem consultar `status=AGUARDANDO_PECA`.
