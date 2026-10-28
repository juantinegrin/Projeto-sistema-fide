import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateScheduleConflict,
  calculateTeacherPayout,
  calculateInvoiceCharges,
  issueMakeupCredit,
  type ScheduleSlot,
  type TeacherCompensationConfig,
  type LessonAttendanceRecord,
} from './businessRules.ts';

test('validateScheduleConflict: detects when teacher is booked in another room at same time', () => {
  const existingSlots: ScheduleSlot[] = [
    {
      id: 'slot-1',
      dayOfWeek: 2, // Terça-feira
      startTime: '14:00',
      endTime: '15:00',
      teacherId: 'prof-chopin',
      teacherName: 'Frédéric Chopin',
      roomId: 'room-101',
      roomName: 'Sala de Piano 1',
      courseName: 'Piano Erudito',
      modality: 'INDIVIDUAL',
      status: 'SCHEDULED',
    },
  ];

  // Tentativa de marcar o mesmo professor em outra sala (room-102) das 14:30 às 15:30 (sobreposição de 30 min)
  const result = validateScheduleConflict(
    {
      dayOfWeek: 2,
      startTime: '14:30',
      endTime: '15:30',
      teacherId: 'prof-chopin',
      roomId: 'room-102',
    },
    existingSlots
  );

  assert.equal(result.hasConflict, true);
  assert.equal(result.conflictType, 'TEACHER_OVERLAP');
  assert.match(result.reason || '', /Conflito de Docente/);
});

test('validateScheduleConflict: detects when room is occupied by another teacher', () => {
  const existingSlots: ScheduleSlot[] = [
    {
      id: 'slot-1',
      dayOfWeek: 3, // Quarta-feira
      startTime: '10:00',
      endTime: '11:00',
      teacherId: 'prof-chopin',
      teacherName: 'Frédéric Chopin',
      roomId: 'room-auditorio',
      roomName: 'Auditório Master',
      courseName: 'Masterclass',
      modality: 'ENSEMBLE',
      status: 'SCHEDULED',
    },
  ];

  // Tentativa de outro professor usar o mesmo auditório no mesmo horário
  const result = validateScheduleConflict(
    {
      dayOfWeek: 3,
      startTime: '10:30',
      endTime: '11:30',
      teacherId: 'prof-bach',
      roomId: 'room-auditorio',
    },
    existingSlots
  );

  assert.equal(result.hasConflict, true);
  assert.equal(result.conflictType, 'ROOM_OVERLAP');
  assert.match(result.reason || '', /Conflito de Sala/);
});

test('validateScheduleConflict: allows non-overlapping slots on same day and same room', () => {
  const existingSlots: ScheduleSlot[] = [
    {
      id: 'slot-1',
      dayOfWeek: 4,
      startTime: '14:00',
      endTime: '15:00',
      teacherId: 'prof-chopin',
      teacherName: 'Frédéric Chopin',
      roomId: 'room-101',
      roomName: 'Sala 101',
      courseName: 'Piano',
      modality: 'INDIVIDUAL',
      status: 'SCHEDULED',
    },
  ];

  // Próxima aula logo em seguida das 15:00 às 16:00
  const result = validateScheduleConflict(
    {
      dayOfWeek: 4,
      startTime: '15:00',
      endTime: '16:00',
      teacherId: 'prof-bach',
      roomId: 'room-101',
    },
    existingSlots
  );

  assert.equal(result.hasConflict, false);
  assert.equal(result.conflictType, 'NONE');
});

test('calculateTeacherPayout: accurately computes hourly rate including student justified absences if contracted', () => {
  const teacherConfig: TeacherCompensationConfig = {
    teacherId: 'prof-clara',
    teacherName: 'Clara Schumann',
    model: 'HOURLY',
    hourlyRate: 70, // R$ 70/hora
    paysOnStudentJustifiedAbsence: true,
  };

  const attendances: LessonAttendanceRecord[] = [
    {
      id: 'att-1',
      lessonId: 'l-1',
      teacherId: 'prof-clara',
      studentId: 'stud-1',
      date: '2026-10-01',
      durationMinutes: 60,
      status: 'PRESENT',
    },
    {
      id: 'att-2',
      lessonId: 'l-2',
      teacherId: 'prof-clara',
      studentId: 'stud-2',
      date: '2026-10-08',
      durationMinutes: 60,
      status: 'JUSTIFIED_ABSENCE',
    },
    {
      id: 'att-3',
      lessonId: 'l-3',
      teacherId: 'prof-clara',
      studentId: 'stud-3',
      date: '2026-10-15',
      durationMinutes: 60,
      status: 'UNJUSTIFIED_ABSENCE', // Não deve computar
    },
  ];

  const payout = calculateTeacherPayout(teacherConfig, attendances, { bonuses: 50, deductions: 20 });

  // 1 presente + 1 falta justificada = 2 horas faturáveis x R$ 70 = R$ 140
  // Net = 140 + 50 (bônus) - 20 (desconto) = 170
  assert.equal(payout.billableHours, 2);
  assert.equal(payout.totalLessonsHeld, 1);
  assert.equal(payout.totalJustifiedAbsences, 1);
  assert.equal(payout.grossAmount, 140);
  assert.equal(payout.netPayout, 170);
});

test('calculateTeacherPayout: percentage model calculates accurate commission from student tuitions', () => {
  const teacherConfig: TeacherCompensationConfig = {
    teacherId: 'prof-liszt',
    teacherName: 'Franz Liszt',
    model: 'PERCENTAGE',
    commissionPercentage: 40, // 40% da mensalidade
    paysOnStudentJustifiedAbsence: false,
  };

  const attendances: LessonAttendanceRecord[] = [
    {
      id: 'att-10',
      lessonId: 'l-10',
      teacherId: 'prof-liszt',
      studentId: 'stud-a',
      date: '2026-10-02',
      durationMinutes: 60,
      status: 'PRESENT',
      monthlyTuitionBRL: 450,
    },
    {
      id: 'att-11',
      lessonId: 'l-11',
      teacherId: 'prof-liszt',
      studentId: 'stud-b',
      date: '2026-10-03',
      durationMinutes: 60,
      status: 'PRESENT',
      monthlyTuitionBRL: 550,
    },
  ];

  const payout = calculateTeacherPayout(teacherConfig, attendances);
  // Base total = 450 + 550 = 1000. 40% de 1000 = 400.
  assert.equal(payout.grossAmount, 400);
  assert.equal(payout.netPayout, 400);
});

test('calculateInvoiceCharges: calculates 2% fine and 1% monthly interest for overdue invoices', () => {
  const principal = 400;
  const dueDate = '2026-10-01';
  const payDate = '2026-10-11'; // 10 dias de atraso

  const charges = calculateInvoiceCharges(principal, dueDate, payDate);

  assert.equal(charges.isOverdue, true);
  assert.equal(charges.daysOverdue, 10);
  // Multa de 2% sobre 400 = 8.00
  assert.equal(charges.fine, 8);
  // Juros: 400 * (0.01 / 30) * 10 = 1.33
  assert.equal(charges.interest, 1.33);
  // Total = 400 + 8 + 1.33 = 409.33
  assert.equal(charges.totalDue, 409.33);
});

test('issueMakeupCredit: creates credit with exactly 90 days validity', () => {
  const credit = issueMakeupCredit('student-99', '2026-10-15', 90);
  assert.equal(credit.studentId, 'student-99');
  assert.equal(credit.status, 'AVAILABLE');
  assert.equal(credit.issueDate, '2026-10-15');
  assert.equal(credit.expirationDate, '2027-01-13');
});
