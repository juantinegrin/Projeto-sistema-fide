import React, { useState } from 'react';
import {
  FileCode2,
  Database,
  Layers,
  Cpu,
  Copy,
  Check,
  CheckCircle,
  AlertTriangle,
  Play,
  Terminal,
  ShieldCheck,
  Globe,
  Sparkles,
  Server,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { postgresSchemaDDL } from '../data/schemaDDL.ts';
import { apiEndpointsDocumentation } from '../data/apiDocs.ts';
import { architectureBlueprint } from '../data/architectureDoc.ts';
import { validateScheduleConflict, calculateTeacherPayout, CompensationModel } from '../core/businessRules.ts';

export const ArchitectureHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DDL' | 'API' | 'RULES_SANDBOX' | 'STACK'>('DDL');
  const [copiedCode, setCopiedCode] = useState(false);

  // Sandbox State for Schedule Conflict Tester
  const [testDay, setTestDay] = useState<number>(1);
  const [testStartTime, setTestStartTime] = useState<string>('14:30');
  const [testEndTime, setTestEndTime] = useState<string>('15:30');
  const [testTeacherId, setTestTeacherId] = useState<string>('prof-mariana');
  const [testRoomId, setTestRoomId] = useState<string>('room-1');
  const [sandboxConflictResult, setSandboxConflictResult] = useState<ReturnType<typeof validateScheduleConflict> | null>(null);

  // Sandbox State for Teacher Payout Tester
  const [payoutModel, setPayoutModel] = useState<CompensationModel>('HOURLY');
  const [payoutHourlyRate, setPayoutHourlyRate] = useState<number>(75);
  const [payoutCommissionPct, setPayoutCommissionPct] = useState<number>(40);
  const [payoutFixedSalary, setPayoutFixedSalary] = useState<number>(3500);
  const [payoutBonus, setPayoutBonus] = useState<number>(100);
  const [payoutDeduction, setPayoutDeduction] = useState<number>(0);

  const handleCopyDDL = () => {
    navigator.clipboard.writeText(postgresSchemaDDL);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunConflictTest = () => {
    const existingSlots = [
      {
        id: 'slot-1',
        dayOfWeek: 1, // Segunda-feira
        startTime: '14:00',
        endTime: '15:00',
        teacherId: 'prof-mariana',
        teacherName: 'Mariana Duarte',
        roomId: 'room-1',
        roomName: 'Sala 01 - Piano Steinway',
        courseName: 'Piano & Teclado',
        modality: 'INDIVIDUAL' as const,
        status: 'SCHEDULED' as const,
      },
      {
        id: 'slot-2',
        dayOfWeek: 1,
        startTime: '15:00',
        endTime: '16:00',
        teacherId: 'prof-thiago',
        teacherName: 'Thiago Alcantara',
        roomId: 'room-3',
        roomName: 'Sala 03 - Cordas',
        courseName: 'Violão & Guitarra',
        modality: 'INDIVIDUAL' as const,
        status: 'SCHEDULED' as const,
      },
    ];

    const result = validateScheduleConflict(
      {
        dayOfWeek: testDay,
        startTime: testStartTime,
        endTime: testEndTime,
        teacherId: testTeacherId,
        roomId: testRoomId,
      },
      existingSlots
    );

    setSandboxConflictResult(result);
  };

  // Executa o cálculo de repasse ao vivo para o sandbox
  const simulatedAttendances = [
    { id: 'att-1', lessonId: 'l-1', teacherId: 'prof-demo', studentId: 'stud-1', date: '2026-10-01', durationMinutes: 60, status: 'PRESENT' as const, monthlyTuitionBRL: 420 },
    { id: 'att-2', lessonId: 'l-2', teacherId: 'prof-demo', studentId: 'stud-2', date: '2026-10-08', durationMinutes: 60, status: 'PRESENT' as const, monthlyTuitionBRL: 420 },
    { id: 'att-3', lessonId: 'l-3', teacherId: 'prof-demo', studentId: 'stud-3', date: '2026-10-15', durationMinutes: 60, status: 'JUSTIFIED_ABSENCE' as const, monthlyTuitionBRL: 390 },
    { id: 'att-4', lessonId: 'l-4', teacherId: 'prof-demo', studentId: 'stud-4', date: '2026-10-22', durationMinutes: 60, status: 'PRESENT' as const, monthlyTuitionBRL: 450 },
  ];

  const simulatedPayoutResult = calculateTeacherPayout(
    {
      teacherId: 'prof-demo',
      teacherName: 'Professor Sandbox',
      model: payoutModel,
      hourlyRate: payoutHourlyRate,
      commissionPercentage: payoutCommissionPct,
      fixedSalary: payoutFixedSalary,
      paysOnStudentJustifiedAbsence: true,
    },
    simulatedAttendances,
    { bonuses: payoutBonus, deductions: payoutDeduction }
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-6 rounded-3xl border border-purple-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Arquitetura de Software & Engenharia
              </span>
              <span className="text-xs text-slate-400">Padrão Emusys Enterprise</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Especificações Técnicas, DDL e Regras de Negócio
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Documentação completa dos 4 entregáveis solicitados: Modelagem Relacional PostgreSQL DDL, Mapeamento REST API, Código TypeScript de Regras Críticas e Stack Tecnológica.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDDL}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all whitespace-nowrap"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'DDL Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 overflow-x-auto mt-6 pt-4 border-t border-purple-500/20 text-xs">
          <button
            onClick={() => setActiveTab('DDL')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'DDL'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Modelagem PostgreSQL (DDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('API')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'API'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>2. Endpoints da API REST</span>
          </button>

          <button
            onClick={() => setActiveTab('RULES_SANDBOX')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'RULES_SANDBOX'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. Regras Críticas & Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('STACK')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'STACK'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Stack & Arquitetura</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MODELAGEM RELACIONAL POSTGRESQL */}
      {activeTab === 'DDL' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-200">
                PostgreSQL DDL: Esquema com PKs UUID, FKs, ENUMs, Índices GIST e Triggers
              </p>
              <p className="text-slate-400 mt-0.5">
                Pronto para ser executado no PostgreSQL 15/16 (Supabase, Neon, AWS RDS ou Docker).
              </p>
            </div>
            <button
              onClick={handleCopyDDL}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar SQL</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 overflow-hidden shadow-2xl relative">
            <pre className="font-mono text-[11px] text-emerald-400/90 leading-relaxed overflow-x-auto max-h-[600px] scrollbar-thin">
              <code>{postgresSchemaDDL}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: ENDPOINTS DA API REST */}
      {activeTab === 'API' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
            <p className="font-bold text-slate-200">
              Contratos OpenAPI 3.1 & Especificações de Payload REST
            </p>
            <p className="text-slate-400 mt-0.5">
              Mapeamento de rotas com códigos HTTP (200 OK, 201 Created, 409 Conflict para sobreposições de agenda e 422 Unprocessable Entity).
            </p>
          </div>

          <div className="space-y-4">
            {apiEndpointsDocumentation.map((endpoint, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                        endpoint.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : endpoint.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-100">{endpoint.path}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {endpoint.tags[0]}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-200">{endpoint.summary}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{endpoint.description}</p>
                </div>

                {endpoint.requestBody && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      Request Body ({endpoint.requestBody.contentType}):
                    </p>
                    <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      <code>{JSON.stringify(endpoint.requestBody.example, null, 2)}</code>
                    </pre>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Respostas Mapeadas:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {endpoint.responses.map((resp, rIdx) => (
                      <div
                        key={rIdx}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              resp.status >= 200 && resp.status < 300
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            HTTP {resp.status}
                          </span>
                          <span className="text-[10px] text-slate-400">{resp.description}</span>
                        </div>
                        <pre className="font-mono text-[10px] text-slate-400 overflow-x-auto pt-1">
                          <code>{JSON.stringify(resp.example, null, 2)}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGRAS CRÍTICAS & PLAYGROUND INTERATIVO */}
      {activeTab === 'RULES_SANDBOX' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
            <p className="font-bold text-slate-200">
              Regras de Negócio Críticas & Playground Executável
            </p>
            <p className="text-slate-400 mt-0.5">
              Teste interativo dos dois algoritmos solicitados: Validação de Conflito de Horário e Cálculo de Repasse Docente.
            </p>
          </div>

          {/* Sandbox 1: Conflito de Horários */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  Playground: Validador de Conflito de Agenda (Sala / Professor)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                validateScheduleConflict()
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Simule a tentativa de agendar uma aula. No banco de referência, a Professora Mariana já possui aula na Sala 01 na Segunda-feira das 14:00 às 15:00.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Dia da Semana</label>
                <select
                  value={testDay}
                  onChange={(e) => setTestDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Início (HH:mm)</label>
                <input
                  type="time"
                  value={testStartTime}
                  onChange={(e) => setTestStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Término (HH:mm)</label>
                <input
                  type="time"
                  value={testEndTime}
                  onChange={(e) => setTestEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Docente</label>
                <select
                  value={testTeacherId}
                  onChange={(e) => setTestTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="prof-mariana">Mariana Duarte</option>
                  <option value="prof-thiago">Thiago Alcantara</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sala</label>
                <select
                  value={testRoomId}
                  onChange={(e) => setTestRoomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="room-1">Sala 01 - Piano</option>
                  <option value="room-3">Sala 03 - Cordas</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunConflictTest}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Executar Algoritmo de Validação</span>
            </button>

            {sandboxConflictResult && (
              <div
                className={`p-4 rounded-xl border text-xs animate-in fade-in ${
                  sandboxConflictResult.hasConflict
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {sandboxConflictResult.hasConflict ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Conflito Detectado: {sandboxConflictResult.conflictType}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Sem Conflito: Horário Livre para Agendamento</span>
                    </>
                  )}
                </div>
                {sandboxConflictResult.reason && (
                  <p className="mt-1 text-slate-300">{sandboxConflictResult.reason}</p>
                )}
              </div>
            )}
          </div>

          {/* Sandbox 2: Cálculo de Repasse Docente */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  Playground: Cálculo de Repasse Docente (Payroll)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                calculateTeacherPayout()
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Modelo de Contrato</label>
                <select
                  value={payoutModel}
                  onChange={(e) => setPayoutModel(e.target.value as CompensationModel)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-bold"
                >
                  <option value="HOURLY">Horista (Hora/Aula)</option>
                  <option value="PERCENTAGE">% Comissão sobre Mensalidade</option>
                  <option value="FIXED">Salário Fixo</option>
                </select>
              </div>

              {payoutModel === 'HOURLY' && (
                <div>
                  <label className="block text-slate-400 mb-1">Valor da Hora/Aula (R$)</label>
                  <input
                    type="number"
                    value={payoutHourlyRate}
                    onChange={(e) => setPayoutHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              )}

              {payoutModel === 'PERCENTAGE' && (
                <div>
                  <label className="block text-slate-400 mb-1">% da Mensalidade</label>
                  <input
                    type="number"
                    value={payoutCommissionPct}
                    onChange={(e) => setPayoutCommissionPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              )}

              {payoutModel === 'FIXED' && (
                <div>
                  <label className="block text-slate-400 mb-1">Salário Fixo Base (R$)</label>
                  <input
                    type="number"
                    value={payoutFixedSalary}
                    onChange={(e) => setPayoutFixedSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Bônus / Premiações (R$)</label>
                <input
                  type="number"
                  value={payoutBonus}
                  onChange={(e) => setPayoutBonus(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Deduções / Faltas (R$)</label>
                <input
                  type="number"
                  value={payoutDeduction}
                  onChange={(e) => setPayoutDeduction(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            {/* Resultado ao vivo */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Carga Apurada no Mês:</span>
                <span className="font-bold text-slate-200">
                  {simulatedPayoutResult.totalLessonsHeld} aulas presenciais + {simulatedPayoutResult.totalJustifiedAbsences} falta justificada abonada
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Bruto Calculado:</span>
                <span className="font-mono text-slate-200">R$ {simulatedPayoutResult.grossAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-800">
                <span className="text-white">Repasse Líquido Final:</span>
                <span className="font-mono text-emerald-400 text-base">
                  R$ {simulatedPayoutResult.netPayout.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STACK TECNOLÓGICA & ARQUITETURA */}
      {activeTab === 'STACK' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              {architectureBlueprint.systemName} — Arquitetura de Produção
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {architectureBlueprint.scalabilitySummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architectureBlueprint.layers.map((layer, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-sm"
              >
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    {layer.layer}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">{layer.technology}</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{layer.rationale}</p>

                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] font-semibold text-amber-400">Boas Práticas de Engenharia:</p>
                  {layer.bestPractices.map((bp, bpIdx) => (
                    <p key={bpIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{bp}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Segurança & Compliance */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Diretrizes de Segurança, LGPD & Integridade Transacional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              {architectureBlueprint.securityMeasures.map((measure, mIdx) => (
                <div key={mIdx} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
