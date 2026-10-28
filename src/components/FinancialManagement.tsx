import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  QrCode,
  Copy,
  Check,
  Building,
  UserCheck,
  Percent,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react';
import { Invoice, CashflowTransaction, Teacher } from '../types/index.ts';
import { calculateTeacherPayout, LessonAttendanceRecord } from '../core/businessRules.ts';

interface FinancialManagementProps {
  invoices: Invoice[];
  cashflow: CashflowTransaction[];
  teachers: Teacher[];
  onMarkInvoiceAsPaid: (invoiceId: string, paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD') => void;
  onGenerateRecurringInvoices: () => void;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({
  invoices,
  cashflow,
  teachers,
  onMarkInvoiceAsPaid,
  onGenerateRecurringInvoices,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'INVOICES' | 'PAYOUTS' | 'CASHFLOW'>('INVOICES');
  const [activePixModal, setActivePixModal] = useState<Invoice | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');

  // Dados sintéticos de presença do mês corrente para cálculo do payroll docente
  const mockMonthlyAttendances: LessonAttendanceRecord[] = [
    { id: 'att-1', lessonId: 'l-1', teacherId: 'prof-mariana', studentId: 'stud-lucas', date: '2026-10-06', durationMinutes: 60, status: 'PRESENT' },
    { id: 'att-2', lessonId: 'l-2', teacherId: 'prof-mariana', studentId: 'stud-lucas', date: '2026-10-13', durationMinutes: 60, status: 'PRESENT' },
    { id: 'att-3', lessonId: 'l-3', teacherId: 'prof-mariana', studentId: 'stud-lucas', date: '2026-10-20', durationMinutes: 60, status: 'JUSTIFIED_ABSENCE' },
    { id: 'att-4', lessonId: 'l-4', teacherId: 'prof-thiago', studentId: 'stud-beatriz', date: '2026-10-08', durationMinutes: 60, status: 'PRESENT', monthlyTuitionBRL: 390 },
    { id: 'att-5', lessonId: 'l-5', teacherId: 'prof-thiago', studentId: 'stud-beatriz', date: '2026-10-15', durationMinutes: 60, status: 'PRESENT', monthlyTuitionBRL: 390 },
    { id: 'att-6', lessonId: 'l-6', teacherId: 'prof-rodrigo', studentId: 'stud-gabriel', date: '2026-10-07', durationMinutes: 60, status: 'PRESENT' },
    { id: 'att-7', lessonId: 'l-7', teacherId: 'prof-elena', studentId: 'stud-sofia', date: '2026-10-09', durationMinutes: 50, status: 'PRESENT' },
  ];

  // Métricas do Fluxo de Caixa
  const totalIncome = cashflow
    .filter((tx) => tx.type === 'INCOME' && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = cashflow
    .filter((tx) => tx.type === 'EXPENSE' && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netOperatingProfit = totalIncome - totalExpense;
  const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter === 'ALL') return true;
    return inv.status === invoiceStatusFilter;
  });

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Gestão Financeira & Repasses Docentes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle de mensalidades recorrentes, multas por atraso, liquidação Pix, folha de pagamento de professores e DRE.
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('INVOICES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'INVOICES'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mensalidades & Faturas
          </button>
          <button
            onClick={() => setActiveSubTab('PAYOUTS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'PAYOUTS'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Repasse Docente (Payroll)
          </button>
          <button
            onClick={() => setActiveSubTab('CASHFLOW')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'CASHFLOW'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fluxo de Caixa (DRE)
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Receitas do Mês</p>
            <p className="text-lg font-black text-emerald-400 font-mono mt-1">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Despesas Operacionais</p>
            <p className="text-lg font-black text-rose-400 font-mono mt-1">
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Saldo Operacional</p>
            <p className="text-lg font-black text-amber-400 font-mono mt-1">
              R$ {netOperatingProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Inadimplência</p>
            <p className="text-lg font-black text-rose-400 font-mono mt-1">
              {overdueCount} {overdueCount === 1 ? 'fatura vencida' : 'faturas vencidas'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Subtab 1: MENSALIDADES & FATURAS */}
      {activeSubTab === 'INVOICES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Filtrar Status:</span>
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="ALL">Todas as Faturas ({invoices.length})</option>
                <option value="PENDING">Pendentes</option>
                <option value="OVERDUE">Atrasadas / Vencidas</option>
                <option value="PAID">Pagas</option>
              </select>
            </div>

            <button
              onClick={onGenerateRecurringInvoices}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Recorrência Automática (Próximo Mês)</span>
            </button>
          </div>

          {/* Invoices Table */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fatura Nº</th>
                    <th className="py-3 px-4">Aluno / Responsável</th>
                    <th className="py-3 px-4">Curso</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-right">Valor Base</th>
                    <th className="py-3 px-4 text-right">Encargos (Multa/Juros)</th>
                    <th className="py-3 px-4 text-right">Total Devido</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-100">{inv.studentName}</p>
                        <p className="text-[10px] text-slate-500">Resp: {inv.guardianName}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{inv.courseName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{inv.dueDate}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        R$ {inv.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {inv.status === 'OVERDUE' ? (
                          <span className="text-rose-400 font-semibold">
                            +R$ {(inv.fineAmount + inv.interestAmount).toFixed(2)} (2% + juros)
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        R$ {inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            Pago ({inv.paymentMethod})
                          </span>
                        ) : inv.status === 'OVERDUE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold animate-pulse">
                            Atrasada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== 'PAID' && (
                            <>
                              <button
                                onClick={() => setActivePixModal(inv)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] flex items-center gap-1"
                                title="Ver código Pix Copia e Cola"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Pix</span>
                              </button>
                              <button
                                onClick={() => onMarkInvoiceAsPaid(inv.id, 'PIX')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                                title="Dar baixa manual"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Baixar</span>
                              </button>
                            </>
                          )}
                          {inv.status === 'PAID' && (
                            <span className="text-[11px] text-slate-500">Liquidado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: REPASSE DOCENTE (PAYROLL ENGINE) */}
      {activeSubTab === 'PAYOUTS' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-200">
                Motor de Repasse Docente Automatizado (Outubro / 2026)
              </p>
              <p className="text-slate-400 mt-0.5">
                Calcula a folha baseando-se estritamente nas presenças confirmadas e regras contratuais (Horista, % de Mensalidade ou Salário Fixo).
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
              Regra Ativa: CLT/PJ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((teacher) => {
              const teacherPayout = calculateTeacherPayout(
                {
                  teacherId: teacher.id,
                  teacherName: teacher.name,
                  model: teacher.contractModel,
                  hourlyRate: teacher.hourlyRate,
                  commissionPercentage: teacher.commissionPercentage,
                  fixedSalary: teacher.fixedSalary,
                  paysOnStudentJustifiedAbsence: teacher.paysOnStudentJustifiedAbsence,
                },
                mockMonthlyAttendances,
                { bonuses: 0, deductions: 0 }
              );

              return (
                <div
                  key={teacher.id}
                  className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">{teacher.name}</h2>
                      <p className="text-xs text-amber-400">{teacher.instruments.join(', ')}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {teacher.contractModel === 'HOURLY'
                        ? 'Contrato Horista'
                        : teacher.contractModel === 'PERCENTAGE'
                        ? '% da Mensalidade'
                        : 'Salário Fixo'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Aulas Efetivamente Ministradas:</span>
                      <span className="font-bold text-slate-200">{teacherPayout.totalLessonsHeld} aulas</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Faltas Justificadas Abonadas:</span>
                      <span className="text-slate-300">{teacherPayout.totalJustifiedAbsences} aulas</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Horas Totais Computadas:</span>
                      <span className="font-mono text-slate-200">{teacherPayout.billableHours.toFixed(1)} h</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                      <span className="font-bold text-slate-200">Repasse Líquido Calculado:</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        R$ {teacherPayout.netPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Discriminativo das Aulas */}
                  <div className="space-y-1 text-[11px] text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                    <p className="font-semibold text-slate-300 mb-1">Demonstrativo Detalhado:</p>
                    {teacherPayout.breakdown.map((item, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-400" />
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: FLUXO DE CAIXA (DRE) */}
      {activeSubTab === 'CASHFLOW' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
            <h2 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              Demonstrativo de Resultados do Exercício (DRE Operacional)
            </h2>

            <div className="space-y-3">
              {cashflow.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{tx.description}</p>
                      <p className="text-[10px] text-slate-500">
                        {tx.date} • Categoria: {tx.category} • Forma: {tx.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-sm ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pix Copia e Cola / QR Code */}
      {activePixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
              <QrCode className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-slate-100">
              Cobrança Pix: {activePixModal.studentName}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Fatura {activePixModal.invoiceNumber} • Vencimento: {activePixModal.dueDate}
            </p>

            {/* Simulação de QR Code Pix */}
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
              <div className="w-40 h-40 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-3 space-y-2">
                <QrCode className="w-24 h-24 text-amber-400" />
                <span className="text-[9px] font-mono tracking-widest text-slate-300">BANCO CENTRAL DO BRASIL</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-left mb-4">
              <span className="block text-[10px] text-slate-400 mb-1 font-semibold">
                Código Pix Copia e Cola:
              </span>
              <p className="font-mono text-[10px] text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                {activePixModal.pixCode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyPix(activePixModal.pixCode)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPix ? 'Copiado para Área de Transferência!' : 'Copiar Código Pix'}</span>
              </button>
              <button
                onClick={() => setActivePixModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
