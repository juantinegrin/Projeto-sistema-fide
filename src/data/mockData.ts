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

export const initialStudents: Student[] = [];

export const initialSchedules: ScheduleSlot[] = [];

export const initialLessonNotes: LessonNote[] = [];

export const initialInvoices: Invoice[] = [];

export const initialCashflow: CashflowTransaction[] = [];
