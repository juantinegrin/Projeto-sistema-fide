/**
 * Sonata ERP - Regras de Negócio Críticas
 * Módulos: Agendamento & Conflitos, Repasse Docente, Encargos Financeiros e Banco de Reposições
 */

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  date?: string; // YYYY-MM-DD para aulas avulsas ou reposições
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  studentId?: string;
  studentName?: string;
  courseName: string;
  modality: 'INDIVIDUAL' | 'DUO' | 'ENSEMBLE';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType: 'NONE' | 'TEACHER_OVERLAP' | 'ROOM_OVERLAP' | 'BOTH';
  reason?: string;
  conflictingSlot?: ScheduleSlot;
}

/**
 * Converte horário "HH:mm" para minutos desde o início do dia para comparação numérica precisa
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validação de Conflito de Horário para Sala e Professor
 * Regra: Duas aulas conflitam se ocorrem no mesmo dia (da semana ou data avulsa)
 * e o intervalo [StartA, EndA] se sobrepõe a [StartB, EndB] (StartA < EndB && EndA > StartB)
 */
export function validateScheduleConflict(
  newSlot: {
    dayOfWeek: number;
    date?: string;
    startTime: string;
    endTime: string;
    teacherId: string;
    roomId: string;
    ignoreSlotId?: string;
  },
  existingSlots: ScheduleSlot[]
): ConflictCheckResult {
  const newStart = timeToMinutes(newSlot.startTime);
  const newEnd = timeToMinutes(newSlot.endTime);

  if (newStart >= newEnd) {
    return {
      hasConflict: true,
      conflictType: 'BOTH',
      reason: 'O horário de término deve ser posterior ao horário de início.',
    };
  }

  for (const slot of existingSlots) {
    // Ignora o próprio registro caso seja uma edição
    if (newSlot.ignoreSlotId && slot.id === newSlot.ignoreSlotId) {
      continue;
    }

    // Ignora aulas canceladas
    if (slot.status === 'CANCELLED') {
      continue;
    }

    // Verifica compatibilidade de dia
    const isSameDayOfWeek = slot.dayOfWeek === newSlot.dayOfWeek;
    const isSameSpecificDate = Boolean(newSlot.date && slot.date && newSlot.date === slot.date);

    // Se um dos slots tiver data específica, o conflito só ocorre se as datas coincidirem
    const daysCollide = (newSlot.date || slot.date) ? isSameSpecificDate : isSameDayOfWeek;

    if (!daysCollide) {
      continue;
    }

    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Condição de sobreposição temporal estrita: Max(StartA, StartB) < Min(EndA, EndB)
    const isTimeOverlap = newStart < slotEnd && newEnd > slotStart;

    if (isTimeOverlap) {
      const isTeacherConflict = slot.teacherId === newSlot.teacherId;
      const isRoomConflict = slot.roomId === newSlot.roomId;

      if (isTeacherConflict && isRoomConflict) {
        return {
          hasConflict: true,
          conflictType: 'BOTH',
          reason: `Conflito Duplo: Professor(a) ${slot.teacherName} e a Sala ${slot.roomName} já estão ocupados neste intervalo (${slot.startTime} - ${slot.endTime}) com ${slot.courseName}.`,
          conflictingSlot: slot,
        };
      }

      if (isTeacherConflict) {
        return {
          hasConflict: true,
          conflictType: 'TEACHER_OVERLAP',
          reason: `Conflito de Docente: Professor(a) ${slot.teacherName} já possui aula agendada das ${slot.startTime} às ${slot.endTime} na Sala ${slot.roomName}.`,
          conflictingSlot: slot,
        };
      }

      if (isRoomConflict) {
        return {
          hasConflict: true,
          conflictType: 'ROOM_OVERLAP',
          reason: `Conflito de Sala: A Sala ${slot.roomName} já está reservada das ${slot.startTime} às ${slot.endTime} para aula de ${slot.courseName}.`,
          conflictingSlot: slot,
        };
      }
    }
  }

  return {
    hasConflict: false,
    conflictType: 'NONE',
  };
}

/**
 * Modelos de Contratação e Remuneração de Professores
 */
export type CompensationModel = 'HOURLY' | 'PERCENTAGE' | 'FIXED';

export interface TeacherCompensationConfig {
  teacherId: string;
  teacherName: string;
  model: CompensationModel;
  hourlyRate?: number; // Ex: R$ 65,00 por hora/aula
  commissionPercentage?: number; // Ex: 40% da mensalidade do aluno
  fixedSalary?: number; // Ex: R$ 3.500,00 fixo mensal
  paysOnStudentJustifiedAbsence: boolean; // Se a escola repassa o valor mesmo com falta justificada do aluno
}

export interface LessonAttendanceRecord {
  id: string;
  lessonId: string;
  teacherId: string;
  studentId: string;
  date: string;
  durationMinutes: number;
  status: 'PRESENT' | 'JUSTIFIED_ABSENCE' | 'UNJUSTIFIED_ABSENCE' | 'CANCELLED';
  monthlyTuitionBRL?: number; // Mensalidade paga pelo aluno (relevante para modelo PERCENTAGE)
}

export interface TeacherPayoutSummary {
  teacherId: string;
  teacherName: string;
  model: CompensationModel;
  totalLessonsHeld: number; // Aulas efetivamente dadas
  totalJustifiedAbsences: number;
  billableHours: number;
  grossAmount: number;
  deductions: number;
  bonuses: number;
  netPayout: number;
  breakdown: string[];
}

/**
 * Cálculo de Repasse do Professor
 * Processa a folha de pagamento baseando-se no modelo contratual e presenças registradas
 */
export function calculateTeacherPayout(
  config: TeacherCompensationConfig,
  attendances: LessonAttendanceRecord[],
  options?: { bonuses?: number; deductions?: number }
): TeacherPayoutSummary {
  const teacherLessons = attendances.filter((att) => att.teacherId === config.teacherId);
  const bonuses = options?.bonuses ?? 0;
  const deductions = options?.deductions ?? 0;

  let totalLessonsHeld = 0;
  let totalJustifiedAbsences = 0;
  let billableMinutes = 0;
  let grossAmount = 0;
  const breakdown: string[] = [];

  for (const att of teacherLessons) {
    if (att.status === 'PRESENT') {
      totalLessonsHeld += 1;
      billableMinutes += att.durationMinutes;
    } else if (att.status === 'JUSTIFIED_ABSENCE') {
      totalJustifiedAbsences += 1;
      if (config.paysOnStudentJustifiedAbsence) {
        billableMinutes += att.durationMinutes;
      }
    }
  }

  const billableHours = billableMinutes / 60;

  switch (config.model) {
    case 'HOURLY': {
      const rate = config.hourlyRate || 0;
      grossAmount = billableHours * rate;
      breakdown.push(`${billableHours.toFixed(1)}h computadas a R$ ${rate.toFixed(2)}/h = R$ ${grossAmount.toFixed(2)}`);
      if (config.paysOnStudentJustifiedAbsence && totalJustifiedAbsences > 0) {
        breakdown.push(`Inclui ${totalJustifiedAbsences} falta(s) justificada(s) de alunos cobertas por contrato`);
      }
      break;
    }

    case 'PERCENTAGE': {
      const percentage = (config.commissionPercentage || 0) / 100;
      // Agrupa alunos únicos ativos com aulas no período para repasse percentual da mensalidade
      const studentMap = new Map<string, { lessonsHeld: number; tuition: number }>();
      for (const att of teacherLessons) {
        if (att.status === 'PRESENT' || (config.paysOnStudentJustifiedAbsence && att.status === 'JUSTIFIED_ABSENCE')) {
          const current = studentMap.get(att.studentId) || { lessonsHeld: 0, tuition: att.monthlyTuitionBRL || 0 };
          current.lessonsHeld += 1;
          if (att.monthlyTuitionBRL) current.tuition = att.monthlyTuitionBRL;
          studentMap.set(att.studentId, current);
        }
      }

      let totalTuitionBase = 0;
      studentMap.forEach((val, studentId) => {
        totalTuitionBase += val.tuition;
        const studentPayout = val.tuition * percentage;
        grossAmount += studentPayout;
        breakdown.push(`Aluno ID ${studentId}: Mensalidade R$ ${val.tuition.toFixed(2)} x ${(percentage * 100).toFixed(0)}% = R$ ${studentPayout.toFixed(2)}`);
      });

      breakdown.push(`Total base de mensalidades: R$ ${totalTuitionBase.toFixed(2)}`);
      break;
    }

    case 'FIXED': {
      const baseSalary = config.fixedSalary || 0;
      grossAmount = baseSalary;
      breakdown.push(`Salário fixo acordado em contrato: R$ ${baseSalary.toFixed(2)}`);
      breakdown.push(`Carga ministrada: ${totalLessonsHeld} aulas presenciais.`);
      break;
    }
  }

  const netPayout = Math.max(0, grossAmount + bonuses - deductions);

  return {
    teacherId: config.teacherId,
    teacherName: config.teacherName,
    model: config.model,
    totalLessonsHeld,
    totalJustifiedAbsences,
    billableHours,
    grossAmount: Math.round(grossAmount * 100) / 100,
    deductions,
    bonuses,
    netPayout: Math.round(netPayout * 100) / 100,
    breakdown,
  };
}

/**
 * Cálculo de Encargos Financeiros (Multa de 2% e Juros de 1% a.m. pro-rata die)
 */
export function calculateInvoiceCharges(
  principalAmount: number,
  dueDateStr: string,
  referenceDateStr: string = new Date().toISOString().slice(0, 10)
): { isOverdue: boolean; daysOverdue: number; fine: number; interest: number; totalDue: number } {
  const dueDate = new Date(dueDateStr);
  const refDate = new Date(referenceDateStr);

  const diffTime = refDate.getTime() - dueDate.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  if (daysOverdue <= 0) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      fine: 0,
      interest: 0,
      totalDue: principalAmount,
    };
  }

  // Multa padrão de 2% sobre o principal
  const fine = Math.round(principalAmount * 0.02 * 100) / 100;

  // Juros de mora de 1% ao mês (0.0333% ao dia)
  const dailyInterestRate = 0.01 / 30;
  const interest = Math.round(principalAmount * dailyInterestRate * daysOverdue * 100) / 100;

  const totalDue = Math.round((principalAmount + fine + interest) * 100) / 100;

  return {
    isOverdue: true,
    daysOverdue,
    fine,
    interest,
    totalDue,
  };
}

/**
 * Regra de Emissão de Crédito de Reposição
 * Se o aluno justifica a falta com antecedência mínima de 4 horas,
 * é gerado um crédito com validade padrão de 90 dias.
 */
export function issueMakeupCredit(
  studentId: string,
  lessonDateStr: string,
  validityDays: number = 90
): {
  creditId: string;
  studentId: string;
  issueDate: string;
  expirationDate: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
} {
  const issueDate = new Date(lessonDateStr);
  const expirationDate = new Date(issueDate);
  expirationDate.setDate(expirationDate.getDate() + validityDays);

  return {
    creditId: `CRD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    studentId,
    issueDate: issueDate.toISOString().slice(0, 10),
    expirationDate: expirationDate.toISOString().slice(0, 10),
    status: 'AVAILABLE',
  };
}
