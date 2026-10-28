/**
 * Tipos e interfaces de domínio do Sonata ERP
 */

export type StudentStatus = 'ACTIVE' | 'LOCKED' | 'DROPOUT' | 'DEFAULTING';
export type EnrollmentModality = 'INDIVIDUAL' | 'DUO' | 'ENSEMBLE';
export type AttendanceStatus = 'PRESENT' | 'JUSTIFIED_ABSENCE' | 'UNJUSTIFIED_ABSENCE' | 'CANCELLED';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type TeacherContractModel = 'HOURLY' | 'PERCENTAGE' | 'FIXED';

export interface Guardian {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  relationship: string; // Pai, Mãe, Responsável Legal, Próprio Aluno
}

export interface Student {
  id: string;
  name: string;
  cpf?: string;
  birthDate: string;
  email: string;
  phone: string;
  status: StudentStatus;
  guardian: Guardian;
  makeupCredits: number; // Saldo de créditos de reposição ativos
  enrolledCourses: string[]; // IDs dos cursos
  avatarUrl?: string;
  joinedAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  instruments: string[];
  contractModel: TeacherContractModel;
  hourlyRate: number; // ex: R$ 70
  commissionPercentage: number; // ex: 40%
  fixedSalary: number; // ex: R$ 3500
  paysOnStudentJustifiedAbsence: boolean;
  avatarUrl?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  availableInstruments: string[];
  color: string;
}

export interface Course {
  id: string;
  name: string;
  category: 'INSTRUMENT' | 'VOCAL' | 'THEORY' | 'PRACTICE';
  defaultDurationMinutes: number;
  monthlyFee: number;
  description: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  modality: EnrollmentModality;
  dayOfWeek: number; // 1 = Seg, 2 = Ter, etc.
  startTime: string; // "14:00"
  durationMinutes: number;
  startDate: string;
  monthlyFee: number;
  paymentDueDay: number; // dia de vencimento (ex: 10)
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

export interface LessonNote {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseName: string;
  date: string;
  contentCovered: string; // Conteúdo aplicado na aula
  technicalDrills: {
    name: string; // ex: "Escala Maior de Ré (2 oitavas)"
    targetBpm: number;
    achievedBpm: number;
    notes: string;
  }[];
  repertoire: {
    songTitle: string;
    composer: string;
    section: string; // "Compassos 1 ao 16"
    status: 'IN_PROGRESS' | 'POLISHING' | 'MASTERED';
  }[];
  homework: string; // Tarefa para a próxima aula
  attachments: {
    id: string;
    title: string;
    type: 'SHEET_MUSIC_PDF' | 'AUDIO_PLAYBACK' | 'VIDEO_DEMO' | 'EXTERNAL_LINK';
    url: string;
    durationOrPages?: string;
  }[];
  evaluation?: {
    rhythmScore: number; // 1 a 10
    tuningPitchScore: number; // 1 a 10
    techniqueScore: number; // 1 a 10
    interpretationScore: number; // 1 a 10
    teacherComments: string;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  courseName: string;
  referenceMonth: string; // "2026-10"
  dueDate: string; // "2026-10-10"
  amount: number;
  fineAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paidAt?: string;
  paymentMethod?: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  pixCode: string;
}

export interface CashflowTransaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'TUITION' | 'ENROLLMENT' | 'MATERIALS' | 'PAYROLL' | 'RENT' | 'INSTRUMENT_MAINTENANCE' | 'UTILITIES' | 'MARKETING';
  description: string;
  amount: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING';
}

export interface MakeupCreditRecord {
  id: string;
  studentId: string;
  studentName: string;
  originalLessonDate: string;
  reason: string;
  issueDate: string;
  expirationDate: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  usedAtLessonDate?: string;
}
