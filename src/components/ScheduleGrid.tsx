import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  DoorClosed,
  User,
  Music,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Room, Teacher, Student, Course } from '../types/index.ts';
import { ScheduleSlot, validateScheduleConflict } from '../core/businessRules.ts';
import { NewLessonModal } from './NewLessonModal.tsx';
import { AttendanceModal } from './AttendanceModal.tsx';
import { AttendanceStatus } from '../types/index.ts';

interface ScheduleGridProps {
  slots: ScheduleSlot[];
  onAddSlot: (slot: ScheduleSlot) => void;
  onUpdateAttendance: (slotId: string, status: AttendanceStatus, justification: string) => void;
  rooms: Room[];
  teachers: Teacher[];
  students: Student[];
  courses: Course[];
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  slots,
  onAddSlot,
  onUpdateAttendance,
  rooms,
  teachers,
  students,
  courses,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeAttendanceSlot, setActiveAttendanceSlot] = useState<ScheduleSlot | null>(null);
  const [simulatedConflictAlert, setSimulatedConflictAlert] = useState<string | null>(null);

  // Filtros aplicados
  const filteredSlots = slots.filter((slot) => {
    if (selectedRoomId !== 'ALL' && slot.roomId !== selectedRoomId) return false;
    if (selectedTeacherId !== 'ALL' && slot.teacherId !== selectedTeacherId) return false;
    if (selectedDay !== 'ALL' && slot.dayOfWeek !== selectedDay) return false;
    return true;
  });

  const daysOfWeek = [
    { day: 1, name: 'Segunda-feira', short: 'SEG' },
    { day: 2, name: 'Terça-feira', short: 'TER' },
    { day: 3, name: 'Quarta-feira', short: 'QUA' },
    { day: 4, name: 'Quinta-feira', short: 'QUI' },
    { day: 5, name: 'Sexta-feira', short: 'SEX' },
    { day: 6, name: 'Sábado', short: 'SÁB' },
  ];

  // Teste de colisão de horário simulado em tempo real
  const handleSimulateConflict = () => {
    // Tenta alocar Mariana na Sala 01 na Segunda-feira das 14:15 às 15:15 (horário já ocupado por Lucas)
    const result = validateScheduleConflict(
      {
        dayOfWeek: 1,
        startTime: '14:15',
        endTime: '15:15',
        teacherId: 'prof-mariana',
        roomId: 'room-1',
      },
      slots
    );

    if (result.hasConflict) {
      setSimulatedConflictAlert(result.reason || 'Conflito detectado pelo algoritmo de agendamento!');
    }
  };

  const getStudentCredits = (studentId?: string) => {
    if (!studentId) return 0;
    const student = students.find((s) => s.id === studentId);
    return student?.makeupCredits ?? 0;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Grade de Horários & Agenda Semanal
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Conflito Zero Ativo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Matriz semanal de salas, professores e alunos com detecção de sobreposição e chamada com reposição integrada.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSimulateConflict}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Demonstra como o algoritmo rejeita choques de horário"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Testar Detecção de Conflito</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Aula / Agendamento</span>
          </button>
        </div>
      </div>

      {/* Simulated Conflict Alert Banner */}
      {simulatedConflictAlert && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-100 flex items-center gap-2">
                <span>Motor de Conflitos Bloqueou Agendamento Incompatível!</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  HTTP 409 Conflict
                </span>
              </p>
              <p className="mt-1 text-rose-300/90">{simulatedConflictAlert}</p>
              <p className="mt-1 text-slate-400 text-[11px]">
                Regra técnica: Intervalo [14:15, 15:15] intercepta [14:00, 15:00] na Sala 01 para a mesma docente. O sistema impediu a sobreposição no banco.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSimulatedConflictAlert(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-900 border border-slate-700"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Filter Matrix Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <DoorClosed className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Sala Física:</span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todas as Salas ({rooms.length})</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Docente:</span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todos os Docentes ({teachers.length})</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.instruments[0]})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Dia:</span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Semana Inteira (Seg-Sáb)</option>
            {daysOfWeek.map((d) => (
              <option key={d.day} value={d.day}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {daysOfWeek
          .filter((d) => selectedDay === 'ALL' || selectedDay === d.day)
          .map((dayObj) => {
            const daySlots = filteredSlots
              .filter((s) => s.dayOfWeek === dayObj.day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={dayObj.day}
                className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-3.5 flex flex-col min-h-[460px] shadow-sm"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                      {dayObj.short}
                    </span>
                    <span className="font-bold text-xs text-slate-200">{dayObj.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {daySlots.length} aula{daySlots.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Day Slots */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {daySlots.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-center p-4">
                      <Clock className="w-6 h-6 stroke-[1.5] mb-1.5 text-slate-600" />
                      <p className="text-xs">Nenhuma aula agendada</p>
                      <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="mt-2 text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold"
                      >
                        + Adicionar
                      </button>
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const roomObj = rooms.find((r) => r.id === slot.roomId);
                      const isReposition = slot.courseName.includes('Reposição');

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setActiveAttendanceSlot(slot)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer group hover:scale-[1.01] hover:shadow-md ${
                            isReposition
                              ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-400'
                              : 'bg-slate-950 border-slate-800 hover:border-amber-500/60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                              style={{
                                backgroundColor: `${roomObj?.color || '#3b82f6'}20`,
                                color: roomObj?.color || '#3b82f6',
                                border: `1px solid ${roomObj?.color || '#3b82f6'}40`,
                              }}
                            >
                              {slot.modality === 'INDIVIDUAL' ? 'Indiv.' : slot.modality === 'DUO' ? 'Dupla' : 'Turma'}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                            {slot.studentName || 'Turma em Grupo'}
                          </p>

                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Music className="w-3 h-3 text-slate-500" />
                            {slot.courseName}
                          </p>

                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[90px]">{slot.teacherName.split(' ')[0]}</span>
                            <span className="truncate max-w-[90px] text-slate-500">{slot.roomName.split('-')[0]}</span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-emerald-400/80 font-medium flex items-center gap-1 group-hover:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Fazer Chamada
                            </span>
                            {isReposition && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[9px]">
                                Reposição
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* New Lesson Modal */}
      <NewLessonModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddSlot={onAddSlot}
        existingSlots={slots}
        rooms={rooms}
        teachers={teachers}
        students={students}
        courses={courses}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        slot={activeAttendanceSlot}
        isOpen={Boolean(activeAttendanceSlot)}
        onClose={() => setActiveAttendanceSlot(null)}
        onConfirmAttendance={onUpdateAttendance}
        currentStudentCredits={getStudentCredits(activeAttendanceSlot?.studentId)}
      />
    </div>
  );
};
