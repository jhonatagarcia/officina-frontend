import { describe, expect, it } from 'vitest';
import { getSidebarRoutes } from '@/routes/route-manifest';

describe('getSidebarRoutes', () => {
  it('retorna rotas de sidebar do admin na ordem definida', () => {
    expect(getSidebarRoutes('ADMIN').map((route) => route.key)).toEqual([
      'dashboard',
      'clientes-list',
      'veiculos-list',
      'orcamentos-list',
      'ordens-servico-list',
      'financeiro-list',
      'chamados',
      'oficina-profile',
      'servicos-list',
      'estoque-list',
      'mecanicos-list',
      'usuarios-list',
      'comissoes-list',
    ]);
  });

  it('limita rotas do atendente ao escopo operacional', () => {
    expect(getSidebarRoutes('ATENDENTE').map((route) => route.key)).toEqual([
      'dashboard',
      'clientes-list',
      'veiculos-list',
      'orcamentos-list',
      'ordens-servico-list',
      'chamados',
      'servicos-list',
      'estoque-list',
    ]);
  });

  it('limita rotas do mecanico e financeiro aos seus escopos principais', () => {
    expect(getSidebarRoutes('MECANICO').map((route) => route.key)).toEqual([
      'ordens-servico-list',
      'chamados',
      'comissoes-list',
    ]);
    expect(getSidebarRoutes('FINANCEIRO').map((route) => route.key)).toEqual([
      'dashboard',
      'financeiro-list',
      'chamados',
    ]);
  });

  it('nao retorna rotas quando nao ha perfil carregado', () => {
    expect(getSidebarRoutes()).toEqual([]);
  });
});
