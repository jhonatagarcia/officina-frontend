import {
  Building2,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  FileBadge,
  FileText,
  Package,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { landingImages, type LandingImageAsset } from './assets/images';

/* ── Marca ────────────────────────────────────────── */

export const brand = {
  name: 'AutoPro System',
  tagline:
    'Gestão completa para negócios automotivos, funilarias e auto elétricas. Feito para o Brasil.',
  contactEmail: 'contato@autoprosystem.com.br',
  demoHref:
    'mailto:contato@autoprosystem.com.br?subject=Quero receber uma proposta do AutoPro System',
  siteUrl: 'https://autoprosystem.com.br',
};

export const seo = {
  title: 'AutoPro System — Gestão para negócios automotivos',
  description:
    'O ERP do negócio automotivo: ordens de serviço, orçamentos, clientes, estoque e financeiro em uma plataforma feita para negócios automotivos, funilarias e auto elétricas.',
};

/* ── Hero ─────────────────────────────────────────── */

export const hero = {
  badge: 'Oficina Mecânica · Funilarias · Auto elétricas',
  titleLead: 'O ERP que seu',
  titleHighlight: 'negócio automotivo',
  titleTail: 'sempre precisou',
  subtitle:
    'Negócios automotivos, oficina mecânica, funilarias e auto elétricas: do orçamento à ordem de serviço, do estoque ao financeiro — gestão completa em uma plataforma feita para o Brasil.',
  primaryCta: { label: 'Começar gratuitamente', href: '#planos' },
  secondaryCta: { label: 'Ver o sistema', href: '#produto' },
  // TODO(WhatsApp Cloud API): notification: { app: 'AutoPro System · WhatsApp', message: 'Seu Civic está pronto! 🎉' },
  kpi: { label: 'OS abertas hoje', value: '23', delta: '↑ +5 vs ontem' },
};

export interface BrowserTab {
  id: string;
  label: string;
  image: LandingImageAsset;
}

export const heroTabs: BrowserTab[] = [
  { id: 'clientes', label: 'Clientes', image: landingImages.heroClientes },
  {
    id: 'orcamentos',
    label: 'Orçamentos',
    image: landingImages.heroOrcamentos,
  },
  { id: 'ordens', label: 'Ordem de Serviço', image: landingImages.heroOrdens },
  { id: 'veiculos', label: 'Veículos', image: landingImages.heroVeiculos },
];

/* ── Faixa "Ideal para" ───────────────────────────── */

export interface Segment {
  label: string;
  icon: LucideIcon;
}

export const segments: Segment[] = [
  { label: 'Oficinas mecânicas', icon: Wrench },
  { label: 'Funilarias', icon: CarFront },
  { label: 'Auto elétricas', icon: Zap },
  { label: 'Centros automotivos', icon: Building2 },
];

/* ── Estatísticas ─────────────────────────────────── */

export interface Stat {
  target: number;
  suffix: string;
  label: string;
}

export const stats: Stat[] = [
  { target: 3200, suffix: '+', label: 'OS abertas por mês na plataforma' },
  { target: 98, suffix: '%', label: 'Taxa de satisfação dos clientes' },
  { target: 40, suffix: '%', label: 'Redução no tempo de abertura de OS' },
  { target: 5, suffix: ' min', label: 'Para configurar e começar a usar' },
];

/* ── Funcionalidades ──────────────────────────────── */

export interface Feature {
  icon: LucideIcon;
  name: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: Wrench,
    name: 'Ordens de Serviço',
    description:
      'Abra, delegue e acompanhe cada OS com fotos, histórico e checklists do veículo.',
  },
  {
    icon: FileText,
    name: 'Orçamentos Digitais',
    description:
      'Crie orçamentos profissionais, envie para aprovação e converta em OS com um clique.',
  },
  {
    icon: Users,
    name: 'Clientes & Veículos',
    description:
      'Base centralizada com histórico completo de veículos, serviços e documentos.',
  },
  {
    icon: CircleDollarSign,
    name: 'Financeiro Completo',
    description:
      'Entradas, saídas e contas a receber. Saiba onde está cada real do seu negócio.',
  },
  {
    icon: Package,
    name: 'Controle de Estoque',
    description:
      'Gerencie peças e insumos com alertas de mínimo e baixa automática por OS.',
  },
  {
    icon: ClipboardList,
    name: 'Gestão da Equipe',
    description:
      'Atribua serviços, acompanhe a produtividade e analise a performance do time técnico.',
  },
  {
    icon: FileBadge,
    name: 'NFS-e em breve',
    description:
      'Na versão 2, gere notas fiscais de serviço a partir da operação da sua empresa.',
  },
  {
    icon: Zap,
    name: 'Diagnóstico inteligente em breve',
    description:
      'Na versão 2, tenha apoio inteligente para organizar o diagnóstico de veículos.',
  },
];

/*
 * TODO(WhatsApp Cloud API): conteudo comercial preservado, mas pausado para nao ser enviado no bundle.
 *
 * export const whatsapp = {
 *   tag: 'Integração nativa',
 *   title: 'Seus clientes sempre informados no celular',
 *   description:
 *     'Envie notificações automáticas pelo WhatsApp diretamente da plataforma — sem apps extras, sem configuração manual.',
 *   bullets: [
 *     'Aviso automático quando o serviço é iniciado',
 *     'Orçamento enviado com link de aprovação',
 *     'Notificação quando o veículo fica pronto',
 *     'Lembretes automáticos de revisão periódica',
 *     'Mensagens personalizadas com nome e veículo do cliente',
 *   ],
 *   approvalLink: 'autoprosystem.com.br/orc/8821',
 * };
 */

/* ── Showcase ─────────────────────────────────────── */

export const showcase = {
  tag: 'O Sistema',
  title: 'Uma interface feita para quem trabalha no dia a dia',
  subtitle:
    'Navegue pelas principais telas e veja como o AutoPro System simplifica cada parte da operação.',
};

export const showcaseTabs: BrowserTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    image: landingImages.showcaseDashboard,
  },
  { id: 'clientes', label: 'Clientes', image: landingImages.showcaseClientes },
  { id: 'veiculos', label: 'Veículos', image: landingImages.showcaseVeiculos },
  {
    id: 'orcamentos',
    label: 'Orçamentos',
    image: landingImages.showcaseOrcamentos,
  },
  {
    id: 'ordens',
    label: 'Ordem de Serviço',
    image: landingImages.showcaseOrdens,
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    image: landingImages.showcaseFinanceiro,
  },
  { id: 'chamados', label: 'Chamados', image: landingImages.showcaseChamados },
  {
    id: 'meu-negocio',
    label: 'Meu Negócio',
    image: landingImages.showcaseMeuNegocio,
  },
  { id: 'servicos', label: 'Serviços', image: landingImages.showcaseServicos },
  { id: 'estoque', label: 'Estoque', image: landingImages.showcaseEstoque },
  {
    id: 'mecanicos',
    label: 'Mecânicos',
    image: landingImages.showcaseMecanicos,
  },
];

/* ── Seções de detalhe por segmento ───────────────── */

export interface SegmentDetail {
  id: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  image: LandingImageAsset;
  /** Inverte a posição da imagem no grid. */
  reverse: boolean;
  /** Usa a superfície alternada de fundo. */
  alt: boolean;
}

export const segmentDetails: SegmentDetail[] = [
  {
    id: 'negocios',
    tag: 'Negócios automotivos',
    title: 'Gestão completa do processo mecânico',
    description:
      'Do diagnóstico à entrega, cada etapa documentada. Menos papel, mais agilidade no atendimento.',
    bullets: [
      'Abertura rápida de OS com placa do veículo',
      'Catálogo de serviços com valores pré-definidos',
      // TODO(WhatsApp Cloud API): 'Aprovação de orçamento por link via WhatsApp',
      'Acompanhamento digital do orçamento e da ordem de serviço',
      'Histórico completo de manutenções por veículo',
    ],
    image: landingImages.detailNegocios,
    reverse: false,
    alt: false,
  },
  {
    id: 'funilarias',
    tag: 'Funilarias',
    title: 'Controle total do serviço de funilaria e pintura',
    description:
      'Cadastre danos, fotografe o estado do veículo na entrada e acompanhe cada etapa do reparo.',
    bullets: [
      'Registro fotográfico na abertura do serviço',
      'Orçamento detalhado por região de dano',
      'Gestão de insumos de pintura e funilaria',
      'Entrega documentada com histórico completo',
    ],
    image: landingImages.detailFunilarias,
    reverse: true,
    alt: true,
  },
  {
    id: 'auto-eletricas',
    tag: 'Auto elétricas',
    title: 'Organize diagnósticos elétricos e registros técnicos',
    description:
      'Registre na OS os códigos de falha e as leituras obtidas com os equipamentos da sua autoelétrica. O AutoPro organiza essas informações no histórico do veículo — sem papelada.',
    bullets: [
      'Registro na OS das leituras obtidas com os equipamentos da oficina',
      'Controle de baterias, módulos e componentes no estoque',
      'Histórico de injeção eletrônica e intervenções por veículo',
      'Orçamento claro separando diagnóstico, peças e mão de obra',
    ],
    image: landingImages.detailAutoEletricas,
    reverse: false,
    alt: false,
  },
];

/* ── Pricing ──────────────────────────────────────── */

export interface Plan {
  name: string;
  monthly: number;
  annual: number;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted: boolean;
}

export const pricing = {
  tag: 'Planos',
  title: 'Simples, transparente e sem surpresas',
  subtitle: 'Cancele quando quiser. Sem taxas de implantação.',
  saveBadge: '2 meses grátis',
  periodMonthly: 'cobrado mensalmente por estabelecimento',
  periodAnnual: 'cobrado anualmente por estabelecimento',
};

export const plans: Plan[] = [
  {
    name: 'Starter',
    monthly: 89,
    annual: 74,
    description:
      'Para negócios automotivos que estão começando a digitalizar a operação.',
    features: [
      '1 usuário administrador',
      'Clientes e veículos ilimitados',
      'Orçamentos e OS ilimitados',
      'Catálogo de serviços',
      // TODO(WhatsApp Cloud API): 'Notificações WhatsApp',
      'Histórico de serviços por veículo',
      'Suporte via chat',
    ],
    cta: { label: 'Começar gratuitamente', href: brand.demoHref },
    highlighted: false,
  },
  {
    name: 'Pro',
    monthly: 159,
    annual: 132,
    description:
      'Para operações em crescimento que precisam de controle total.',
    features: [
      'Até 5 usuários',
      'Tudo do plano Starter',
      'Controle financeiro completo',
      'Controle de estoque',
      'Gestão da equipe técnica',
      'Relatórios e indicadores',
    ],
    cta: { label: 'Assinar o Pro', href: brand.demoHref },
    highlighted: true,
  },
  {
    name: 'Business',
    monthly: 299,
    annual: 249,
    description: 'Para redes e grandes operações com múltiplas unidades.',
    features: [
      'Usuários ilimitados',
      'Tudo do plano Pro',
      'Múltiplas unidades',
      'API e integrações',
      'Suporte prioritário 24/7',
      'Onboarding personalizado',
    ],
    cta: { label: 'Falar com o comercial', href: brand.demoHref },
    highlighted: false,
  },
];

/* ── Depoimentos (um por segmento) ────────────────── */

export interface Testimonial {
  quote: string;
  initials: string;
  name: string;
  role: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'Antes usávamos caderno e planilha. Com o AutoPro System, abrimos ordens de serviço em segundos e centralizamos toda a operação. Mudou tudo na nossa rotina.',
    initials: 'RC',
    name: 'Ricardo Caldas',
    role: 'Meu Negócio Mecânica Caldas, SP',
  },
  {
    quote:
      'A funilaria sempre foi difícil de controlar. Agora registro os danos com foto na entrada, o orçamento sai na hora e o cliente fica muito mais seguro do serviço.',
    initials: 'FM',
    name: 'Fernanda Melo',
    role: 'Melo Funilaria, RJ',
  },
  {
    quote:
      'Trabalho com injeção e módulos, e diagnóstico elétrico era difícil de cobrar. Hoje registro na OS as leituras obtidas com meus equipamentos e o cliente entende exatamente o que está pagando.',
    initials: 'CA',
    name: 'Carlos Andrade',
    role: 'Andrade Auto Elétrica, PR',
  },
];

/* ── CTA final ────────────────────────────────────── */

export const finalCta = {
  title: 'Pronto para modernizar seu negócio automotivo?',
  subtitle: '14 dias grátis, sem cartão de crédito. Configure em 5 minutos.',
  primaryCta: { label: 'Criar conta gratuita', href: '#planos' },
  secondaryCta: { label: 'Falar com o time', href: brand.demoHref },
};

/* ── Footer ───────────────────────────────────────── */

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Produto',
    links: [
      { label: 'Funcionalidades', href: '#funcionalidades' },
      // TODO(WhatsApp Cloud API): { label: 'WhatsApp', href: '#whatsapp' },
      { label: 'Conheça o sistema', href: '#produto' },
      { label: 'Planos e preços', href: '#planos' },
    ],
  },
  {
    title: 'Segmentos',
    links: [
      { label: 'Negócios automotivos', href: '#negocios' },
      { label: 'Funilarias', href: '#funilarias' },
      { label: 'Auto elétricas', href: '#auto-eletricas' },
    ],
  },
  {
    title: 'Contato',
    links: [
      { label: brand.contactEmail, href: `mailto:${brand.contactEmail}` },
      { label: 'Receber proposta', href: brand.demoHref },
    ],
  },
];

export const footerBottom = {
  copyright: `© ${new Date().getFullYear()} ${brand.name}. Todos os direitos reservados.`,
  madeIn: 'Feito com ♥ no Brasil 🇧🇷',
};
