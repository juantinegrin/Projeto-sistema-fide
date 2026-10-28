import {
  Student,
  Teacher,
  Room,
  Course,
  Enrollment,
  LessonNote,
  Invoice,
  CashflowTransaction,
  MakeupCreditRecord,
} from '../types/index.ts';
import { ScheduleSlot } from '../core/businessRules.ts';

export const initialRooms: Room[] = [];

export const initialCourses: Course[] = [];

export const initialTeachers: Teacher[] = [];

export const initialStudents: Student[] = [
  {
    id: 'stud-1',
    name: 'Aluno Modelo',
    cpf: '000.000.000-00',
    birthDate: '2010-01-01',
    email: 'aluno@escola.com',
    phone: '(62) 99999-9999',
    status: 'ACTIVE',
    guardian: {
      id: 'guard-1',
      name: 'Responsável',
      cpf: '000.000.000-00',
      email: 'responsavel@escola.com',
      phone: '(62) 99999-9999',
      relationship: 'Responsável Legal',
    },
    makeupCredits: 0,
    enrolledCourses: [],
    joinedAt: '2026-10-28',
  },
];


export const initialSchedules: ScheduleSlot[] = [];

export const initialLessonNotes: LessonNote[] = [];

export const initialInvoices: Invoice[] = [];

export const initialCashflow: CashflowTransaction[] = [];
