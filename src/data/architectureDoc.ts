/**
 * Sonata ERP - Documento de Arquitetura de Software & Stack Recomendada
 * Elaborado pelo Arquiteto Full-Stack para Aplicações de Gestão Escolar Musical
 */

export interface ArchitectureLayer {
  layer: string;
  technology: string;
  rationale: string;
  bestPractices: string[];
}

export const architectureBlueprint = {
  systemName: 'Sonata ERP (Equivalente Emusys)',
  architecturalPattern: 'Modular Monolith com Arquitetura Limpa (Clean Architecture / Hexagonal)',
  scalabilitySummary: 'Capacidade para atender desde escolas de pequeno porte (50 alunos) até redes franqueadas com múltiplos polos (10.000+ alunos) com isolamento Multi-Tenant por schema ou Tenant ID.',
  layers: [
    {
      layer: 'Frontend & Portal Web (SPA / SSR)',
      technology: 'Next.js 15 (App Router) + React 19 + Tailwind CSS + TanStack Query + Motion',
      rationale:
        'Excelente performance de renderização, suporte nativo a SSR/SSG para portais e SEO, tipagem estrita com TypeScript, e biblioteca de componentes reutilizáveis para grids interativas de horários e players de áudio didático.',
      bestPractices: [
        'Separação estrita de camadas entre Container (estado) e Presentational Components.',
        'Otimização de grids semanais pesadas com virtualização de nós DOM (TanStack Virtual).',
        'Cache client-side inteligente com revalidação em background via TanStack Query.',
      ],
    },
    {
      layer: 'Backend API & Microsserviços',
      technology: 'Node.js 22 LTS + Fastify (ou NestJS) com TypeScript',
      rationale:
        'Fastify oferece throughput 3x a 5x superior ao Express tradicional, validação em tempo de execução via JSON Schema/Zod compilado e suporte nativo a Server-Sent Events e WebSockets para atualização da grade em tempo real.',
      bestPractices: [
        'Domain-Driven Design (DDD) estruturado por módulos: Grade/Agendamento, Pedagógico, Financeiro, Pessoas.',
        'Idempotência obrigatória em endpoints de faturamento e geração de mensalidades (UUID idempotency-key).',
        'Middleware unificado de auditoria (quem alterou notas, quem justificou faltas, quem cancelou faturas).',
      ],
    },
    {
      layer: 'Banco de Dados Relacional',
      technology: 'PostgreSQL 16 + Btree_gist Extension + Drizzle ORM (ou Prisma)',
      rationale:
        'Suporte a transações ACID robustas e constraints de exclusão temporal nativas (EXCLUDE USING gist) que impedem que dois agendamentos ocupem a mesma sala ou professor ao mesmo tempo a nível de banco de dados, prevenindo race conditions.',
      bestPractices: [
        'Row Level Security (RLS) para garantir que alunos e responsáveis visualizem unicamente seus próprios dados.',
        'Índices compostos para consultas temporais da grade semanal (room_id, day_of_week, start_time).',
        'Triggers automatizadas para emissão de créditos de reposição em caso de falta justificada.',
      ],
    },
    {
      layer: 'Cache & Filas Assíncronas',
      technology: 'Redis 7 + BullMQ',
      rationale:
        'Gerenciamento de filas assíncronas para tarefas pesadas como emissão em lote de faturas mensais, notificações via WhatsApp/Email, processamento de playbacks e locks distribuídos (Redlock).',
      bestPractices: [
        'Distributed Locking no agendamento de reposições concorrentes.',
        'Agendamento automático de rotinas cron para expiração de créditos de reposição de 90 dias.',
      ],
    },
    {
      layer: 'Armazenamento de Mídia Didática',
      technology: 'Cloudflare R2 ou AWS S3 com URLs Pré-assinadas temporárias',
      rationale:
        'Guarda de partituras em PDF, tablaturas e playbacks de áudio (MP3/WAV) com custo de saída (egress) zero e links de download com tempo de expiração seguro (evitando compartilhamento não autorizado fora da escola).',
      bestPractices: [
        'Pre-signed URLs com validade de 30 minutos para visualização de partituras no Portal do Aluno.',
        'Compressão de áudios didáticos no upload via worker de mídia.',
      ],
    },
    {
      layer: 'Gateway de Pagamentos & Pix',
      technology: 'Asaas / Stark Bank / Mercado Pago API',
      rationale:
        'Geração instantânea de Pix dinâmico com QR Code, Boleto Bancário com registro e cobrança recorrente via Cartão de Crédito. Webhook com conciliação automática em segundos.',
      bestPractices: [
        'Webhooks com validação de assinatura HMAC SHA-256.',
        'Cálculo de juros e multas centralizado na regra de negócio do backend.',
      ],
    },
  ],
  securityMeasures: [
    'Autenticação JWT com Refresh Tokens em HttpOnly Cookies e rotação regular.',
    'Controle de Acesso Baseado em Funções (RBAC): Admin, Secretaria, Professor, Aluno, Responsável Financeiro.',
    'Sanitização contra ataques XSS, CSRF tokens e cabeçalhos de segurança (Helmet).',
    'Conformidade com a LGPD (Lei Geral de Proteção de Dados) para armazenamento de dados de menores e responsáveis.',
  ],
};
