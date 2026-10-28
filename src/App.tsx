import React, { useState } from 'react';
import { Header, ActiveTab, UserViewRole } from './components/Header.tsx';
import { ScheduleGrid } from './components/ScheduleGrid.tsx';
import { PeopleManagement } from './components/PeopleManagement.tsx';
import { PedagogicalJournal } from './components/PedagogicalJournal.tsx';
import { FinancialManagement } from './components/FinancialManagement.tsx';
import { StudentPortal } from './components/StudentPortal.tsx';
import { ArchitectureHub } from './components/ArchitectureHub.tsx';
import {
  initialRooms,
  initialCourses,
  initialTeachers,
  initialStudents,
  initialSchedules,
  initialLessonNotes,
  initialInvoices,
  initialCashflow,
} from './data/mockData.ts';
import { ScheduleSlot, issueMakeupCredit } from './core/businessRules.ts';
import { Student, LessonNote, Invoice, CashflowTransaction, AttendanceStatus } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('SCHEDULE');
  const [userRole, setUserRole] = useState<UserViewRole>('ADMIN');

  // Application Domain State
  const [rooms] = useState(initialRooms);
  const [courses] = useState(initialCourses);
  const [teachers] = useState(initialTeachers);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(initialSchedules);
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>(initialLessonNotes);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [cashflow, setCashflow] = useState<CashflowTransaction[]>(initialCashflow);

  // Selected student for student portal
  const [activeStudentId, setActiveStudentId] = useState<string>(initialStudents[0].id || '');
  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Adicionar novo slot na grade de horários
  const handleAddSlot = (newSlot: ScheduleSlot) => {
    setSchedules((prev) => [...prev, newSlot]);
    showToast(`Aula de ${newSlot.courseName} com ${newSlot.teacherName} agendada com sucesso!`);
  };

  // 2. Registro de Chamada e emissão automática de crédito de reposição
  const handleUpdateAttendance = (slotId: string, status: AttendanceStatus, justification: string) => {
    const slot = schedules.find((s) => s.id === slotId);
    if (!slot) return;

    if (status === 'JUSTIFIED_ABSENCE') {
      // Regra de Negócio: Falta Justificada gera crédito no banco de reposições do aluno com validade de 90 dias
      const credit = issueMakeupCredit(slot.studentId || 'unknown', new Date().toISOString().slice(0, 10), 90);

      setStudents((prev) =>
        prev.map((stud) => {
          if (stud.id === slot.studentId) {
            return {
              ...stud,
              makeupCredits: stud.makeupCredits + 1,
            };
          }
          return stud;
        })
      );

      showToast(
        `Falta justificada registrada para ${slot.studentName}. Crédito ${credit.creditId} gerado com validade de 90 dias!`
      );
    } else if (status === 'PRESENT') {
      showToast(`Presença confirmada para ${slot.studentName}! Horas computadas para repasse docente.`);
    } else if (status === 'UNJUSTIFIED_ABSENCE') {
      showToast(`Falta injustificada registrada para ${slot.studentName}. Sem emissão de crédito.`);
    } else {
      showToast(`Aula cancelada.`);
    }
  };

  // 3. Nova Matrícula de Aluno (Novo cadastro ou aluno existente)
  const handleEnrollStudent = (enrollment: {
    studentId: string;
    courseId: string;
    teacherId: string;
    roomId: string;
    modality: 'INDIVIDUAL' | 'DUO' | 'ENSEMBLE';
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    monthlyFee: number;
    dueDay: number;
    newStudentData?: Student;
  }) => {
    const course = courses.find((c) => c.id === enrollment.courseId);
    const teacher = teachers.find((t) => t.id === enrollment.teacherId);
    const room = rooms.find((r) => r.id === enrollment.roomId);
    const student = enrollment.newStudentData || students.find((s) => s.id === enrollment.studentId);

    // Se for novo aluno, adiciona à lista com o curso; senão atualiza os cursos do aluno existente
    if (enrollment.newStudentData) {
      setStudents((prev) => [
        {
          ...enrollment.newStudentData!,
          enrolledCourses: [enrollment.courseId],
        },
        ...prev,
      ]);
    } else {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === enrollment.studentId) {
            const updatedCourses = s.enrolledCourses.includes(enrollment.courseId)
              ? s.enrolledCourses
              : [...s.enrolledCourses, enrollment.courseId];
            return { ...s, enrolledCourses: updatedCourses };
          }
          return s;
        })
      );
    }

    // Injeta na grade semanal
    const newSlot: ScheduleSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: enrollment.dayOfWeek,
      startTime: enrollment.startTime,
      endTime: enrollment.endTime,
      teacherId: enrollment.teacherId,
      teacherName: teacher?.name || 'Professor',
      roomId: enrollment.roomId,
      roomName: room?.name || 'Sala',
      studentId: student?.id || enrollment.studentId,
      studentName: student?.name || 'Aluno',
      courseName: course?.name || 'Música',
      modality: enrollment.modality,
      status: 'SCHEDULED',
    };

    setSchedules((prev) => [...prev, newSlot]);

    // Cria a primeira fatura mensal
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FAT-202611-${Math.floor(Math.random() * 900 + 100)}`,
      studentId: student?.id || '',
      studentName: student?.name || '',
      guardianName: student?.guardian.name || '',
      courseName: course?.name || 'Música',
      referenceMonth: '2026-11',
      dueDate: `2026-11-${String(enrollment.dueDay).padStart(2, '0')}`,
      amount: enrollment.monthlyFee,
      fineAmount: 0,
      interestAmount: 0,
      totalAmount: enrollment.monthlyFee,
      status: 'PENDING',
      pixCode: `00020126580014br.gov.bcb.pix0136matricula-${student?.id}@villa-lobos.edu.br5204000053039865406${enrollment.monthlyFee.toFixed(2)}5802BR5925VILLA LOBOS6009SAO PAULO62070503***6304ABCD`,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    showToast(`Matrícula de ${student?.name} concluída com sucesso! Grade e Fatura geradas.`);
  };

  // 4. Salvar Diário de Classe
  const handleAddLessonNote = (note: LessonNote) => {
    setLessonNotes((prev) => [note, ...prev]);
    showToast(`Diário pedagógico e tarefas salvas no Portal do Aluno com sucesso!`);
  };

  // 5. Baixa de Fatura (Pix / Boleto)
  const handleMarkInvoiceAsPaid = (invoiceId: string, paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD') => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'PAID',
            paidAt: new Date().toISOString().slice(0, 10),
            paymentMethod,
          };
        }
        return inv;
      })
    );

    // Registra entrada no fluxo de caixa
    const newTx: CashflowTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'INCOME',
      category: 'TUITION',
      description: `Mensalidade ${invoice.referenceMonth} - Aluno: ${invoice.studentName}`,
      amount: invoice.totalAmount,
      paymentMethod,
      status: 'COMPLETED',
    };

    setCashflow((prev) => [newTx, ...prev]);
    showToast(`Fatura ${invoice.invoiceNumber} liquidada via ${paymentMethod}! Entrada computada no fluxo de caixa.`);
  };

  // 6. Gerar recorrência de faturas
  const handleGenerateRecurringInvoices = () => {
    showToast(`Processamento em lote concluído: faturas do próximo mês geradas para todos os alunos ativos!`);
  };

  // 7. Aluno solicita aula de reposição
  const handleRequestMakeup = (studentId: string, slotId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || student.makeupCredits <= 0) return;

    // Deduz 1 crédito
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return { ...s, makeupCredits: Math.max(0, s.makeupCredits - 1) };
        }
        return s;
      })
    );

    // Injeta a aula de reposição na grade
    const makeupSlot: ScheduleSlot = {
      id: `slot-reposition-${Date.now()}`,
      dayOfWeek: 3, // Quarta
      startTime: '14:00',
      endTime: '15:00',
      teacherId: 'prof-mariana',
      teacherName: 'Mariana Duarte',
      roomId: 'room-1',
      roomName: 'Sala 01 - Piano Steinway',
      studentId: student.id,
      studentName: `${student.name} (Reposição)`,
      courseName: 'Piano & Teclado (Aula Reposição)',
      modality: 'INDIVIDUAL',
      status: 'SCHEDULED',
    };

    setSchedules((prev) => [...prev, makeupSlot]);
    showToast(`Reposição agendada com sucesso! 1 crédito debitado do saldo.`);
  };

  const overdueInvoicesCount = invoices.filter((i) => i.status === 'OVERDUE').length;
  const activeStudent = students.find((s) => s.id === activeStudentId) || students[0] || null;
  const totalAvailableCredits = students.reduce((sum, s) => sum + s.makeupCredits, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 border border-amber-400">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        overdueInvoicesCount={overdueInvoicesCount}
        availableCreditsCount={totalAvailableCredits}
      />

      {/* Main Application Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'SCHEDULE' && (
          <ScheduleGrid
            slots={schedules}
            onAddSlot={handleAddSlot}
            onUpdateAttendance={handleUpdateAttendance}
            rooms={rooms}
            teachers={teachers}
            students={students}
            courses={courses}
          />
        )}

        {activeTab === 'PEOPLE' && (
          <PeopleManagement
            students={students}
            teachers={teachers}
            rooms={rooms}
            courses={courses}
            schedules={schedules}
            onAddStudent={(newStudent) => setStudents((prev) => [...prev, newStudent])}
            onEnrollStudent={handleEnrollStudent}
          />
        )}

        {activeTab === 'PEDAGOGICAL' && (
          <PedagogicalJournal
            students={students}
            teachers={teachers}
            lessonNotes={lessonNotes}
            onAddLessonNote={handleAddLessonNote}
          />
        )}

        {activeTab === 'FINANCIAL' && (
          <FinancialManagement
            invoices={invoices}
            cashflow={cashflow}
            teachers={teachers}
            onMarkInvoiceAsPaid={handleMarkInvoiceAsPaid}
            onGenerateRecurringInvoices={handleGenerateRecurringInvoices}
          />
        )}

        {activeTab === 'STUDENT_PORTAL' && (
          <StudentPortal
            student={activeStudent}
            allStudents={students}
            onSelectStudent={setActiveStudentId}
            schedules={schedules}
            lessonNotes={lessonNotes}
            invoices={invoices}
            rooms={rooms}
            onRequestMakeup={handleRequestMakeup}
            onPayInvoicePix={(invId) => handleMarkInvoiceAsPaid(invId, 'PIX')}
          />
        )}

        {activeTab === 'ARCHITECTURE' && <ArchitectureHub />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>Sonata ERP • Sistema Integrado de Gestão para Escolas de Música & Conservatórios (Padrão Emusys)</p>
      </footer>
    </div>
  );
}
