import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Ban, Clock, Award, FileText } from 'lucide-react';
import { AttendanceStatus } from '../types/index.ts';
import { ScheduleSlot } from '../core/businessRules.ts';

interface AttendanceModalProps {
  slot: ScheduleSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAttendance: (slotId: string, status: AttendanceStatus, justification: string) => void;
  currentStudentCredits: number;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  slot,
  isOpen,
  onClose,
  onConfirmAttendance,
  currentStudentCredits,
}) => {
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [justification, setJustification] = useState<string>('');

  if (!isOpen || !slot) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAttendance(slot.id, status, justification);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Chamada & Frequência de Aula</h2>
            <p className="text-xs text-slate-400">
              Registro no diário oficial com emissão de créditos de reposição.
            </p>
          </div>
        </div>

        {/* Slot Info Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Aluno:</span>
            <span className="font-bold text-slate-200 text-sm">{slot.studentName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Curso & Instrumento:</span>
            <span className="font-medium text-amber-400">{slot.courseName} ({slot.modality})</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Docente & Sala:</span>
            <span className="text-slate-300">{slot.teacherName} • {slot.roomName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Horário:</span>
            <span className="text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {slot.startTime} às {slot.endTime}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Saldo Atual de Reposições:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
              <Award className="w-3 h-3" />
              {currentStudentCredits} créditos ativos (90 dias)
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Selecione o Status da Chamada
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStatus('PRESENT')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  status === 'PRESENT'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Presente</p>
                  <p className="text-[10px] text-slate-400">Aula realizada normalmente</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('JUSTIFIED_ABSENCE')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  status === 'JUSTIFIED_ABSENCE'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">Falta Justificada</p>
                  <p className="text-[10px] text-slate-400">+1 Crédito de Reposição</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('UNJUSTIFIED_ABSENCE')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  status === 'UNJUSTIFIED_ABSENCE'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <p className="font-bold">Falta Injustificada</p>
                  <p className="text-[10px] text-slate-400">Sem direito a reposição</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('CANCELLED')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  status === 'CANCELLED'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Ban className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="font-bold">Cancelada p/ Escola</p>
                  <p className="text-[10px] text-slate-400">Professor/Estrutura</p>
                </div>
              </button>
            </div>
          </div>

          {/* Justification Box (se falta justificada) */}
          {status === 'JUSTIFIED_ABSENCE' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1.5">
                <FileText className="w-4 h-4" />
                <span>Regra Automática de Reposição</span>
              </div>
              <p className="text-slate-300 mb-2 text-[11px]">
                Ao confirmar, o sistema gerará um código de crédito no banco de reposições do aluno válido por 90 dias a contar de hoje.
              </p>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Motivo / Justificativa da Ausência
              </label>
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Atestado médico odontológico ou viagem avisada 24h antes"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          )}

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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Salvar Frequência</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
