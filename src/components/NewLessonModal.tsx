import React, { useState, useId } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, Calendar, DoorClosed, User, Music } from 'lucide-react';
import { Room, Teacher, Student, Course, EnrollmentModality } from '../types/index.ts';
import { ScheduleSlot, validateScheduleConflict } from '../core/businessRules.ts';

interface NewLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlot: (slot: ScheduleSlot) => void;
  existingSlots: ScheduleSlot[];
  rooms: Room[];
  teachers: Teacher[];
  students: Student[];
  courses: Course[];
}

export const NewLessonModal: React.FC<NewLessonModalProps> = ({
  isOpen,
  onClose,
  onAddSlot,
  existingSlots,
  rooms,
  teachers,
  students,
  courses,
}) => {
  const daySelectId = useId();
  const startTimeId = useId();
  const endTimeId = useId();
  const courseSelectId = useId();
  const modalitySelectId = useId();
  const teacherSelectId = useId();
  const roomSelectId = useId();
  const studentSelectId = useId();
  const scheduleTypeId = useId();

  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // 1 = Segunda
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('15:00');
  const [teacherId, setTeacherId] = useState<string>(teachers[0]?.id || '');
  const [roomId, setRoomId] = useState<string>(rooms[0]?.id || '');
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [courseId, setCourseId] = useState<string>(courses[0]?.id || '');
  const [modality, setModality] = useState<EnrollmentModality>('INDIVIDUAL');
  const [scheduleType, setScheduleType] = useState<string>('REGULAR_LESSON');

  if (!isOpen) return null;

  // Validação em tempo real
  const conflictCheck = validateScheduleConflict(
    {
      dayOfWeek,
      startTime,
      endTime,
      teacherId,
      roomId,
    },
    existingSlots
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictCheck.hasConflict) {
      return;
    }

    const selectedTeacher = teachers.find((t) => t.id === teacherId);
    const selectedRoom = rooms.find((r) => r.id === roomId);
    const selectedStudent = students.find((s) => s.id === studentId);
    const selectedCourse = courses.find((c) => c.id === courseId);

    const newSlot: ScheduleSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek,
      startTime,
      endTime,
      teacherId,
      teacherName: selectedTeacher?.name || 'Professor',
      roomId,
      roomName: selectedRoom?.name || 'Sala',
      studentId,
      studentName: selectedStudent?.name || 'Aluno',
      courseName: selectedCourse?.name || 'Música',
      modality,
      status: 'SCHEDULED',
    };

    onAddSlot(newSlot);
    onClose();
  };

  const daysLabels = [
    { val: 0, label: 'Domingo' },
    { val: 1, label: 'Segunda-feira' },
    { val: 2, label: 'Terça-feira' },
    { val: 3, label: 'Quarta-feira' },
    { val: 4, label: 'Quinta-feira' },
    { val: 5, label: 'Sexta-feira' },
    { val: 6, label: 'Sábado' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Agendar Nova Aula / Horário</h2>
            <p className="text-xs text-slate-400">
              O motor de agendamento valida automaticamente choques de sala e professor.
            </p>
          </div>
        </div>

        {/* Live Conflict Warning Box */}
        {conflictCheck.hasConflict ? (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Choque de Horário Detectado!</p>
              <p className="mt-0.5 text-rose-300/90">{conflictCheck.reason}</p>
              <p className="mt-1 text-[11px] text-rose-400">
                Altere o horário, dia, sala ou professor para liberar o agendamento.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Horário, professor e sala disponíveis sem nenhum conflito.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={daySelectId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Dia da Semana
              </label>
              <select
                id={daySelectId}
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {daysLabels.map((d) => (
                  <option key={d.val} value={d.val}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={scheduleTypeId} className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Agendamento
              </label>
              <select
                id={scheduleTypeId}
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="REGULAR_LESSON">Aula Regular Recorrente</option>
                <option value="MAKEUP_LESSON">Aula de Reposição (Crédito)</option>
                <option value="PLACEMENT_TEST">Teste de Nivelamento</option>
                <option value="EVENT">Ensaio / Recital</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={startTimeId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Horário Início
              </label>
              <input
                id={startTimeId}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label htmlFor={endTimeId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Horário Término
              </label>
              <input
                id={endTimeId}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={courseSelectId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-slate-400" />
                Curso / Instrumento
              </label>
              <select
                id={courseSelectId}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (R$ {c.monthlyFee}/mês)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={modalitySelectId} className="block text-xs font-semibold text-slate-300 mb-1">
                Modalidade
              </label>
              <select
                id={modalitySelectId}
                value={modality}
                onChange={(e) => setModality(e.target.value as EnrollmentModality)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="INDIVIDUAL">Individual (1 Aluno)</option>
                <option value="DUO">Dupla (2 Alunos)</option>
                <option value="ENSEMBLE">Prática de Conjunto / Turma</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={teacherSelectId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Professor(a)
              </label>
              <select
                id={teacherSelectId}
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.instruments.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={roomSelectId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                Sala Física
              </label>
              <select
                id={roomSelectId}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Capacidade: {r.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={studentSelectId} className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Aluno Principal
            </label>
            <select
              id={studentSelectId}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status === 'ACTIVE' ? 'Ativo' : s.status} - Resp: {s.guardian.name})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={conflictCheck.hasConflict}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                conflictCheck.hasConflict
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Agendamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
