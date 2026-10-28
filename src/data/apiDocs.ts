/**
 * Sonata ERP - Especificação Técnica de Endpoints REST / JSON
 * Padrão OpenAPI 3.1 & Padrão de Resposta Padronizado
 */

export interface ApiEndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  requestBody?: {
    contentType: string;
    example: Record<string, unknown>;
  };
  responses: {
    status: number;
    description: string;
    example: Record<string, unknown>;
  }[];
}

export const apiEndpointsDocumentation: ApiEndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/schedules',
    tags: ['Grade & Agenda'],
    summary: 'Listar grade de horários com filtros dinâmicos',
    description: 'Retorna a grade semanal de aulas e eventos com filtros opcionais por sala, professor, instrumento, dia da semana ou data específica.',
    responses: [
      {
        status: 200,
        description: 'Lista de slots de agendamento retornada com sucesso',
        example: {
          success: true,
          data: [
            {
              id: 'd9b1c784-2e9b-4e89-8d76-e17f763f0001',
              courseName: 'Piano & Teclado',
              teacher: { id: 'prof-mariana', name: 'Mariana Duarte' },
              room: { id: 'room-1', name: 'Sala 01 - Piano Steinway' },
              student: { id: 'stud-lucas', name: 'Lucas Fernandes' },
              dayOfWeek: 1,
              startTime: '14:00',
              endTime: '15:00',
              modality: 'INDIVIDUAL',
              status: 'SCHEDULED',
            },
          ],
          meta: { total: 42, activeFilters: { dayOfWeek: 1 } },
        },
      },
    ],
  },
  {
    method: 'POST',
    path: '/api/schedules',
    tags: ['Grade & Agenda'],
    summary: 'Agendar nova aula ou evento com validação estrita de conflitos',
    description: 'Valida se o professor já possui aula alocada ou se a sala física requisitada já está ocupada. Retorna HTTP 409 Conflict se houver choque de horário.',
    requestBody: {
      contentType: 'application/json',
      example: {
        courseId: 'course-piano',
        teacherId: 'prof-mariana',
        roomId: 'room-1',
        studentId: 'stud-lucas',
        scheduleType: 'REGULAR_LESSON',
        dayOfWeek: 2,
        startTime: '15:00',
        endTime: '16:00',
        modality: 'INDIVIDUAL',
      },
    },
    responses: [
      {
        status: 201,
        description: 'Horário reservado com sucesso',
        example: {
          success: true,
          message: 'Horário agendado com sucesso sem nenhum conflito.',
          data: {
            id: 'f87a32d1-93bf-4780-b2cc-278cf842f111',
            status: 'SCHEDULED',
          },
        },
      },
      {
        status: 409,
        description: 'Conflito de horário detectado para o Professor ou Sala',
        example: {
          success: false,
          errorCode: 'SCHEDULE_CONFLICT',
          conflictType: 'ROOM_OVERLAP',
          message: 'A Sala 01 - Piano Steinway já está reservada das 14:30 às 15:30 para aula de Canto.',
          conflictingSlotId: 'slot-4',
        },
      },
    ],
  },
  {
    method: 'POST',
    path: '/api/attendance',
    tags: ['Presença & Reposição'],
    summary: 'Registrar frequência de aula e emitir crédito de reposição',
    description: 'Atualiza a presença do aluno. Se o status for JUSTIFIED_ABSENCE, o sistema gera automaticamente um crédito de reposição com validade de 90 dias.',
    requestBody: {
      contentType: 'application/json',
      example: {
        scheduleId: 'slot-1',
        studentId: 'stud-lucas',
        lessonDate: '2026-10-15',
        status: 'JUSTIFIED_ABSENCE',
        justification: 'Atestado médico de consulta odontológica anexado.',
      },
    },
    responses: [
      {
        status: 200,
        description: 'Frequência registrada com crédito emitido',
        example: {
          success: true,
          attendanceId: 'att-55c3a',
          status: 'JUSTIFIED_ABSENCE',
          makeupCreditIssued: {
            creditCode: 'CRD-94AB22',
            expirationDate: '2027-01-13',
            validityDays: 90,
            status: 'AVAILABLE',
          },
          studentNewBalance: 2,
        },
      },
    ],
  },
  {
    method: 'POST',
    path: '/api/pedagogical/notes',
    tags: ['Módulo Pedagógico'],
    summary: 'Lançar diário de classe, repertório, tarefas e avaliação',
    description: 'Salva o diário de bordo da aula ministrada com exercícios técnicos (BPM atingido), repertório, lição de casa, anexos e notas por competência musical.',
    requestBody: {
      contentType: 'application/json',
      example: {
        scheduleId: 'slot-1',
        studentId: 'stud-lucas',
        teacherId: 'prof-mariana',
        lessonDate: '2026-10-15',
        contentCovered: 'Estudo de escala maior e articulação de dedos.',
        technicalDrills: [
          { drillName: 'Hanon Ex. 1', targetBpm: 92, achievedBpm: 88, notes: 'Relaxamento dos punhos' },
        ],
        repertoire: [
          { songTitle: 'Minueto em Sol', composer: 'J.S. Bach', section: 'Parte A', status: 'POLISHING' },
        ],
        homework: 'Praticar com metrônomo 4x por semana.',
        attachments: [
          { title: 'Partitura_Bach_Anotada.pdf', type: 'SHEET_MUSIC_PDF', url: 'https://cdn.escola.com/scores/123.pdf' },
        ],
        competencyEvaluation: {
          rhythmScore: 8.5,
          tuningPitchScore: 9.0,
          techniqueScore: 8.0,
          interpretationScore: 8.5,
          feedbackNotes: 'Excelente dedicação e sonoridade expressiva.',
        },
      },
    },
    responses: [
      {
        status: 201,
        description: 'Diário de classe registrado e disponibilizado no Portal do Aluno',
        example: {
          success: true,
          lessonNoteId: 'note-998822',
          notifiedStudent: true,
        },
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/financial/invoices',
    tags: ['Financeiro'],
    summary: 'Listar faturas e mensalidades com cálculo de encargos',
    description: 'Recupera lista de mensalidades. Injeta automaticamente multas (2%) e juros de mora (1% a.m.) caso a fatura esteja vencida.',
    responses: [
      {
        status: 200,
        description: 'Lista de faturas retornada com sucesso',
        example: {
          success: true,
          invoices: [
            {
              id: 'inv-101',
              invoiceNumber: 'FAT-202610-001',
              studentName: 'Lucas Fernandes',
              baseAmount: 420.0,
              fineAmount: 8.4,
              interestAmount: 0.7,
              totalAmount: 429.1,
              status: 'OVERDUE',
              daysOverdue: 5,
              pixCopiaECola: '00020126580014br.gov.bcb.pix...',
            },
          ],
        },
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/financial/cashflow',
    tags: ['Financeiro'],
    summary: 'Relatório de fluxo de caixa e DRE consolidado',
    description: 'Gera o demonstrativo de receitas (mensalidades, matrículas) e despesas (folha docente, aluguel, manutenção de instrumentos) com lucro operacional.',
    responses: [
      {
        status: 200,
        description: 'Dados financeiros consolidados do mês',
        example: {
          success: true,
          referenceMonth: '2026-10',
          totalIncome: 15720.0,
          totalExpense: 11850.0,
          operatingProfit: 3870.0,
          profitMarginPercent: 24.6,
          defaultRatePercent: 4.8,
        },
      },
    ],
  },
  {
    method: 'POST',
    path: '/api/financial/teacher-payouts/calculate',
    tags: ['Financeiro & Docentes'],
    summary: 'Calcular folha de pagamento docente com regras de repasse',
    description: 'Executa o cálculo de repasse por professor baseado no modelo contratual (Horista, % de Mensalidade ou Salário Fixo) com base nas presenças computadas.',
    requestBody: {
      contentType: 'application/json',
      example: {
        teacherId: 'prof-mariana',
        referenceMonth: '2026-10',
        bonuses: 150.0,
        deductions: 0.0,
      },
    },
    responses: [
      {
        status: 200,
        description: 'Demonstrativo detalhado de repasse calculado',
        example: {
          success: true,
          teacherId: 'prof-mariana',
          teacherName: 'Mariana Duarte',
          model: 'HOURLY',
          hourlyRate: 75.0,
          billableHours: 28.0,
          grossAmount: 2100.0,
          bonus: 150.0,
          netPayout: 2250.0,
          breakdown: [
            '28h aula ministradas a R$ 75.00/h = R$ 2.100,00',
            'Bônus de recital de primavera = R$ 150,00',
          ],
        },
      },
    ],
  },
];
