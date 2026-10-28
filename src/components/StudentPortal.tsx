import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Award,
  DollarSign,
  Download,
  Eye,
  QrCode,
  Copy,
  Check,
  Music,
  Play,
  Volume2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ListTodo,
} from 'lucide-react';
import { Student, LessonNote, Invoice, Room } from '../types/index.ts';
import { ScheduleSlot } from '../core/businessRules.ts';
import { audioSynth } from '../utils/audioSynthesizer.ts';

interface StudentPortalProps {
  student: Student;
  allStudents: Student[];
  onSelectStudent: (studentId: string) => void;
  schedules: ScheduleSlot[];
  lessonNotes: LessonNote[];
  invoices: Invoice[];
  rooms: Room[];
  onRequestMakeup: (studentId: string, slotId: string) => void;
  onPayInvoicePix: (invoiceId: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  allStudents,
  onSelectStudent,
  schedules,
  lessonNotes,
  invoices,
  rooms,
  onRequestMakeup,
  onPayInvoicePix,
}) => {
  const [copiedPix, setCopiedPix] = useState(false);
  const [activePixModal, setActivePixModal] = useState<Invoice | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [selectedMakeupSlotId, setSelectedMakeupSlotId] = useState<string>('');

  // Aulas do aluno
  const studentSlots = schedules.filter((s) => s.studentId === student.id);
  // Diário mais recente
  const studentNote = lessonNotes.find((n) => n.studentId === student.id);
  // Faturas do aluno
  const studentInvoices = invoices.filter((inv) => inv.studentId === student.id);

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const playPlaybackTrack = () => {
    setIsAudioPlaying(true);
    audioSynth.playChordProgression();
    setTimeout(() => setIsAudioPlaying(false), 5000);
  };

  const handleConfirmMakeup = () => {
    if (selectedMakeupSlotId) {
      onRequestMakeup(student.id, selectedMakeupSlotId);
      setIsMakeupModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Switcher Top Bar for easy testing */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-slate-300">Alternar Aluno para Demonstração:</span>
          <select
            value={student.id}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
          >
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status === 'ACTIVE' ? 'Ativo' : s.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Responsável Legal:</span>
          <span className="font-semibold text-slate-200">{student.guardian.name}</span>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 rounded-3xl border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Portal do Aluno & Família
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              Olá, {student.name}!
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Acompanhe sua grade de aulas, o diário de bordo com as tarefas de estudo, seu banco de créditos de reposição e suas mensalidades via Pix.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 shrink-0">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Banco de Reposições</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {student.makeupCredits} Crédito{student.makeupCredits !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-slate-400">Validade padrão: 90 dias</p>
            </div>
            {student.makeupCredits > 0 && (
              <button
                onClick={() => setIsMakeupModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all whitespace-nowrap"
              >
                Agendar Reposição
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Próximas Aulas & Diário de Bordo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Minhas Aulas na Semana */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            Minha Grade de Aulas
          </h2>

          <div className="space-y-3">
            {studentSlots.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Nenhuma aula ativa na grade no momento.
              </p>
            ) : (
              studentSlots.map((slot) => {
                const room = rooms.find((r) => r.id === slot.roomId);
                const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

                return (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {dayNames[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300">
                        {slot.modality}
                      </span>
                    </div>

                    <p className="font-bold text-slate-100 text-sm">{slot.courseName}</p>
                    <p className="text-[11px] text-slate-400">Docente: {slot.teacherName}</p>
                    <p className="text-[10px] text-slate-500">{slot.roomName}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Col 2 & 3: Diário de Bordo & Tarefas do Professor */}
        <div className="lg:col-span-2 space-y-6">
          {studentNote ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-bold text-slate-100">
                    Última Lição de Casa & Diário de Bordo ({studentNote.date})
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  Prof(a). {studentNote.teacherName}
                </span>
              </div>

              {/* Conteúdo & Lição */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <ListTodo className="w-4 h-4" />
                  Tarefa Obrigatória para a Próxima Aula
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {studentNote.homework}
                </p>
              </div>

              {/* Exercício com BPM & Metrônomo */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-slate-200">Exercício Técnico do Professor:</p>
                {studentNote.technicalDrills.map((drill, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-300">
                    <span>{drill.name}</span>
                    <span className="font-mono text-amber-400 font-bold">
                      Meta: {drill.targetBpm} BPM
                    </span>
                  </div>
                ))}
              </div>

              {/* Material Didático / Partitura e Áudio */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-300">Material de Apoio do Aluno:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studentNote.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {att.type === 'AUDIO_PLAYBACK' ? (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-rose-400" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-200 truncate max-w-[150px]">{att.title}</p>
                          <p className="text-[10px] text-slate-500">{att.durationOrPages}</p>
                        </div>
                      </div>

                      {att.type === 'AUDIO_PLAYBACK' ? (
                        <button
                          onClick={playPlaybackTrack}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isAudioPlaying
                              ? 'bg-emerald-500 text-slate-950 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                          }`}
                        >
                          {isAudioPlaying ? 'Tocando...' : 'Ouvir Faixa'}
                        </button>
                      ) : (
                        <a
                          href="#download"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Download de ${att.title} iniciado!`);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Baixar PDF</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center text-slate-500">
              <p className="text-xs">Aguardando anotações do professor para esta semana.</p>
            </div>
          )}

          {/* Minhas Mensalidades & Pagamento Pix */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Minhas Mensalidades & Pagamento Pix
            </h2>

            <div className="space-y-3">
              {studentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">
                        Mensalidade {inv.referenceMonth}
                      </span>
                      {inv.status === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          Pago
                        </span>
                      ) : inv.status === 'OVERDUE' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                          Atrasada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                          A Vencer
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Vencimento: {inv.dueDate} • Fatura Nº {inv.invoiceNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-100 font-mono">
                        R$ {inv.totalAmount.toFixed(2)}
                      </p>
                      {inv.status === 'OVERDUE' && (
                        <p className="text-[10px] text-rose-400 font-semibold">
                          Inclui multa de 2% + juros
                        </p>
                      )}
                    </div>

                    {inv.status !== 'PAID' && (
                      <button
                        onClick={() => setActivePixModal(inv)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Pagar com Pix</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pix do Aluno */}
      {activePixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center">
            <h2 className="text-base font-bold text-slate-100 mb-1">Pagamento Instantâneo Pix</h2>
            <p className="text-xs text-slate-400 mb-4">
              Mensalidade {activePixModal.referenceMonth} • Valor: R$ {activePixModal.totalAmount.toFixed(2)}
            </p>

            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
              <div className="w-36 h-36 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-2">
                <QrCode className="w-20 h-20 text-amber-400" />
                <span className="text-[8px] font-mono tracking-widest text-slate-300">BANCO CENTRAL</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-left mb-4">
              <span className="block text-[10px] text-slate-400 mb-1 font-semibold">
                Código Copia e Cola:
              </span>
              <p className="font-mono text-[9px] text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                {activePixModal.pixCode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyPix(activePixModal.pixCode)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Copiado com Sucesso!' : 'Copiar Código Pix'}</span>
              </button>
              <button
                onClick={() => {
                  onPayInvoicePix(activePixModal.id);
                  setActivePixModal(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento de Reposição */}
      {isMakeupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-slate-100 mb-1">
              Agendar Aula de Reposição
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Você possui {student.makeupCredits} crédito(s) com validade de 90 dias.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <label className="block text-slate-300 font-semibold">Selecione o Horário Disponível:</label>
              <select
                value={selectedMakeupSlotId}
                onChange={(e) => setSelectedMakeupSlotId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">Escolha um horário vago...</option>
                <option value="slot-make-1">Quarta-feira, 14:00 - 15:00 (Sala 01 - Profa. Mariana)</option>
                <option value="slot-make-2">Sexta-feira, 17:00 - 18:00 (Sala 01 - Profa. Mariana)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsMakeupModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMakeup}
                disabled={!selectedMakeupSlotId}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
              >
                Confirmar Reposição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
