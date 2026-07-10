/**
 * Manifest centralizado das imagens da landing.
 *
 * Para trocar qualquer imagem da página, edite APENAS este arquivo.
 * `src: null` exibe um placeholder elegante (ImagePlaceholder) até a
 * imagem definitiva ser adicionada em /public.
 */

export interface LandingImageAsset {
  id: string;
  /** Caminho público da imagem ou null para exibir placeholder. */
  src: string | null;
  alt: string;
  /** URL fictícia exibida na barra de endereço dos mockups de navegador. */
  url?: string;
}

export const landingImages = {
  /* Tabs do mockup de navegador do hero */
  heroClientes: {
    id: 'heroClientes',
    src: '/screenshots/clientes.png',
    alt: 'Tela de clientes do AutoPro System com lista de cadastros e busca',
    url: 'app.autoprosystem.com.br/clientes',
  },
  heroOrcamentos: {
    id: 'heroOrcamentos',
    src: '/screenshots/orcamento.png',
    alt: 'Tela de orçamentos do AutoPro System com serviços, peças e valores',
    url: 'app.autoprosystem.com.br/orcamentos',
  },
  heroOrdens: {
    id: 'heroOrdens',
    src: '/screenshots/ordem-servico.png',
    alt: 'Tela de ordem de serviço do AutoPro System com status e responsável',
    url: 'app.autoprosystem.com.br/ordens',
  },
  heroVeiculos: {
    id: 'heroVeiculos',
    src: '/screenshots/veiculos.png',
    alt: 'Tela de veículos do AutoPro System com placa, modelo e histórico',
    url: 'app.autoprosystem.com.br/veiculos',
  },

  /* Tabs do showcase de produto */
  showcaseDashboard: {
    id: 'showcaseDashboard',
    src: '/screenshots/dashboard.png',
    alt: 'Dashboard do AutoPro System com indicadores da operação',
    url: 'app.autoprosystem.com.br/dashboard',
  },
  showcaseClientes: {
    id: 'showcaseClientes',
    src: '/screenshots/clientes.png',
    alt: 'Cadastro de clientes do AutoPro System',
    url: 'app.autoprosystem.com.br/clientes',
  },
  showcaseOrcamentos: {
    id: 'showcaseOrcamentos',
    src: '/screenshots/orcamento.png',
    alt: 'Orçamento detalhado no AutoPro System',
    url: 'app.autoprosystem.com.br/orcamentos',
  },
  showcaseOrdens: {
    id: 'showcaseOrdens',
    src: '/screenshots/ordem-servico.png',
    alt: 'Ordem de serviço em andamento no AutoPro System',
    url: 'app.autoprosystem.com.br/ordens',
  },
  showcaseFinanceiro: {
    id: 'showcaseFinanceiro',
    src: '/screenshots/financeiro.png',
    alt: 'Controle financeiro do AutoPro System com entradas e saídas',
    url: 'app.autoprosystem.com.br/financeiro',
  },

  /* Seções de detalhe por segmento */
  detailNegocios: {
    id: 'detailNegocios',
    src: '/screenshots/ordem-servico.png',
    alt: 'Ordem de serviço de negócio automotivo no AutoPro System',
  },
  detailFunilarias: {
    id: 'detailFunilarias',
    src: '/screenshots/orcamento.png',
    alt: 'Orçamento de funilaria e pintura no AutoPro System',
  },
  detailAutoEletricas: {
    id: 'detailAutoEletricas',
    src: '/screenshots/veiculos.png',
    alt: 'Histórico do veículo com intervenções elétricas no AutoPro System',
  },
} satisfies Record<string, LandingImageAsset>;

export type LandingImageId = keyof typeof landingImages;
