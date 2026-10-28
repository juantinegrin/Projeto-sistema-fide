import React, { useState, useId } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  GraduationCap,
  ShieldAlert,
  ChevronRight,
  Music,
  X,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookmarkCheck,
  PlusCircle,
} from 'lucide-react';
import { Student, Teacher, Course, Room, StudentStatus, EnrollmentModality } from '../types/index.ts';
import { ScheduleSlot, validateScheduleConflict, timeToMinutes } from '../core/businessRules.ts';

interface PeopleManagementProps {
  students: Student[];
  teachers: Teacher[];
  rooms: Room[];
  courses: Course[];
  schedules?: ScheduleSlot[];
  onAddStudent: (student: Student) => void;
  onEnrollStudent: (enrollment: any) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  onAddRoom?: (room: Room) => void;
  onAddCourse?: (course: Course) => void;
}

// Utilitários de formatação e máscara
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const today = new Date();
  const birth = new Date(birthDateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const PeopleManagement: React.FC<PeopleManagementProps> = ({
  students,
  teachers,
  rooms,
  courses,
  schedules = [],
  onEnrollStudent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'STUDENTS' | 'TEACHERS' | 'GUARDIANS'>('STUDENTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollMode, setEnrollMode] = useState<'NEW_STUDENT' | 'EXISTING_STUDENT'>('NEW_STUDENT');
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<Student | null>(null);

  // Estados para modais extras
const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

// Form Professor
const [tName, setTName] = useState('');
const [tEmail, setTEmail] = useState('');
const [tPhone, setTPhone] = useState('');
const [tInstruments, setTInstruments] = useState('');
const [tModel, setTModel] = useState<'HOURLY' | 'PERCENTAGE' | 'FIXED'>('HOURLY');
const [tRate, setTRate] = useState(60);

// Form Sala
const [rName, setRName] = useState('');
const [rCapacity, setRCapacity] = useState(1);
const [rDescription, setRDescription] = useState('');

// Form Curso
const [cName, setCName] = useState('');
const [cCategory, setCCategory] = useState<'INSTRUMENT' | 'VOCAL' | 'THEORY' | 'PRACTICE'>('INSTRUMENT');
const [cDuration, setCDuration] = useState(60);
const [cMonthlyFee, setCMonthlyFee] = useState(350);

  // Mensagem de feedback interna do modal
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Estados do Novo Aluno (Informações Pessoais)
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBirthDate, setNewStudentBirthDate] = useState('2011-04-18');
  const [newStudentCpf, setNewStudentCpf] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentLevel, setNewStudentLevel] = useState<'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  // Estados do Responsável Financeiro / Legal
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianCpf, setNewGuardianCpf] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newGuardianEmail, setNewGuardianEmail] = useState('');
  const [newGuardianRelationship, setNewGuardianRelationship] = useState('Mãe');

  // Estados do Plano & Matrícula (Preservados para "mesmas configurações")
  const enrollCourseSelectId = useId();
  const enrollModalitySelectId = useId();
  const enrollTeacherSelectId = useId();
  const enrollRoomSelectId = useId();
  const enrollDaySelectId = useId();
  const enrollStartTimeId = useId();
  const enrollEndTimeId = useId();
  const enrollFeeInputId = useId();
  const enrollDueDayInputId = useId();

  const [enrollCourseId, setEnrollCourseId] = useState<string>(courses[0]?.id || '');
  const [enrollTeacherId, setEnrollTeacherId] = useState<string>(teachers[0]?.id || '');
  const [enrollRoomId, setEnrollRoomId] = useState<string>(rooms[0]?.id || '');
  const [enrollModality, setEnrollModality] = useState<EnrollmentModality>('INDIVIDUAL');
  const [enrollDayOfWeek, setEnrollDayOfWeek] = useState<number>(1);
  const [enrollStartTime, setEnrollStartTime] = useState<string>('15:00');
  const [enrollEndTime, setEnrollEndTime] = useState<string>('16:00');
  const [enrollFee, setEnrollFee] = useState<number>(courses[0]?.monthlyFee || 420);
  const [enrollDueDay, setEnrollDueDay] = useState<number>(10);

  // Estatísticas de alunos
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'ACTIVE').length;
  const defaultingStudents = students.filter((s) => s.status === 'DEFAULTING').length;
  const lockedStudents = students.filter((s) => s.status === 'LOCKED').length;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardian.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cpf && s.cpf.includes(searchTerm));
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const studentAge = calculateAge(newStudentBirthDate);

  // Cálculo da duração da aula em minutos
  const lessonDurationMinutes = Math.max(0, timeToMinutes(enrollEndTime) - timeToMinutes(enrollStartTime));

  // Verificação de conflito em tempo real
  const conflictCheck = validateScheduleConflict(
    {
      dayOfWeek: enrollDayOfWeek,
      startTime: enrollStartTime,
      endTime: enrollEndTime,
      teacherId: enrollTeacherId,
      roomId: enrollRoomId,
    },
    schedules
  );

  const selectedTeacherObj = teachers.find((t) => t.id === enrollTeacherId);
  const selectedRoomObj = rooms.find((r) => r.id === enrollRoomId);
  const selectedCourseObj = courses.find((c) => c.id === enrollCourseId);

  // Preencher dados do responsável com os dados do próprio aluno (caso seja maior de idade)
  const handleCopyStudentToGuardian = () => {
    setNewGuardianName(newStudentName);
    setNewGuardianPhone(newStudentPhone);
    setNewGuardianEmail(newStudentEmail);
    if (newStudentCpf) {
      setNewGuardianCpf(newStudentCpf);
    }
    setNewGuardianRelationship('O Próprio Aluno');
  };

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
            Ativo
          </span>
        );
      case 'DEFAULTING':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
            Inadimplente
          </span>
        );
      case 'LOCKED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
            Trancado
          </span>
        );
      case 'DROPOUT':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
            Desistente
          </span>
        );
    }
  };

  // Processa a matrícula e opcionalmente fecha o modal
  const submitEnrollment = (keepModalOpenForNext: boolean) => {
    if (enrollMode === 'NEW_STUDENT') {
      if (!newStudentName.trim() || !newGuardianName.trim() || !newGuardianCpf.trim()) {
        return false;
      }

      const newStudentId = `stud-${Date.now()}`;
      const newStudent: Student = {
        id: newStudentId,
        name: newStudentName.trim(),
        cpf: newStudentCpf.trim() || undefined,
        birthDate: newStudentBirthDate,
        email: newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: newStudentPhone.trim() || newGuardianPhone.trim() || '(11) 99999-8888',
        status: 'ACTIVE',
        guardian: {
          id: `guard-${Date.now()}`,
          name: newGuardianName.trim(),
          cpf: newGuardianCpf.trim(),
          email: newGuardianEmail.trim() || `${newGuardianName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          phone: newGuardianPhone.trim() || '(11) 98888-7777',
          relationship: newGuardianRelationship,
        },
        makeupCredits: 0,
        enrolledCourses: [enrollCourseId],
        joinedAt: new Date().toISOString().slice(0, 10),
      };

      onEnrollStudent({
        studentId: newStudentId,
        courseId: enrollCourseId,
        teacherId: enrollTeacherId,
        roomId: enrollRoomId,
        modality: enrollModality,
        dayOfWeek: enrollDayOfWeek,
        startTime: enrollStartTime,
        endTime: enrollEndTime,
        monthlyFee: enrollFee,
        dueDay: enrollDueDay,
        newStudentData: newStudent,
      });

      // Limpa dados de entrada pessoal MAS MANTÉM AS MESMAS CONFIGURAÇÕES DE PLANO!
      setNewStudentName('');
      setNewStudentCpf('');
      setNewStudentPhone('');
      setNewStudentEmail('');
      setNewStudentNotes('');
      setNewGuardianName('');
      setNewGuardianCpf('');
      setNewGuardianPhone('');
      setNewGuardianEmail('');

      if (keepModalOpenForNext) {
        setModalFeedback(`Aluno(a) "${newStudent.name}" matriculado(a)! Formulário pronto com as MESMAS configurações para o próximo aluno.`);
        setTimeout(() => setModalFeedback(null), 4000);
      } else {
        setIsEnrollModalOpen(false);
      }
      return true;
    } else {
      if (!selectedStudentForEnroll) return false;

      onEnrollStudent({
        studentId: selectedStudentForEnroll.id,
        courseId: enrollCourseId,
        teacherId: enrollTeacherId,
        roomId: enrollRoomId,
        modality: enrollModality,
        dayOfWeek: enrollDayOfWeek,
        startTime: enrollStartTime,
        endTime: enrollEndTime,
        monthlyFee: enrollFee,
        dueDay: enrollDueDay,
      });

      if (keepModalOpenForNext) {
        setModalFeedback(`Matrícula vinculada para ${selectedStudentForEnroll.name}! Configurações de plano mantidas para o próximo.`);
        setTimeout(() => setModalFeedback(null), 4000);
      } else {
        setIsEnrollModalOpen(false);
      }
      return true;
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEnrollment(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Gestão de Pessoas & Matrículas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle integrado de alunos, responsáveis legais, corpo docente com regras contratuais e matrículas em lote.
          </p>
        </div>

        {/* Actions & Sub Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Nova Matrícula com Destaque */}
          <button
            onClick={() => {
              setEnrollMode('NEW_STUDENT');
              if (!selectedStudentForEnroll && students.length > 0) {
                setSelectedStudentForEnroll(students[0]);
              }
              setIsEnrollModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
            title="Cadastrar novo aluno ou matricular aluno existente"
          >
            <div className="flex flex-wrap items-center gap-2">
  {/* Botão Nova Matrícula */}
  <button
    onClick={() => {
      setEnrollMode('NEW_STUDENT');
      setIsEnrollModalOpen(true);
    }}
    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
  >
    <UserPlus className="w-4 h-4" />
    <span>Nova Matrícula</span>
  </button>

  {/* Botão Novo Professor */}
  <button
    onClick={() => setIsTeacherModalOpen(true)}
    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
  >
    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
    <span>+ Professor</span>
  </button>

  {/* Botão Nova Sala */}
  <button
    onClick={() => setIsRoomModalOpen(true)}
    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
  >
    <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
    <span>+ Sala</span>
  </button>

  {/* Botão Novo Curso */}
  <button
    onClick={() => setIsCourseModalOpen(true)}
    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
  >
    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
    <span>+ Curso</span>
  </button>
</div>
            <UserPlus className="w-4 h-4" />
            <span>Nova Matrícula</span>
          </button>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('STUDENTS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'STUDENTS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alunos ({students.length})
            </button>
            <button
              onClick={() => setActiveSubTab('TEACHERS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'TEACHERS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Professores ({teachers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('GUARDIANS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'GUARDIANS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Responsáveis ({students.length})
            </button>
          </div>
        </div>
      </div>

      {/* Subtab 1: ALUNOS */}
      {activeSubTab === 'STUDENTS' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Total de Alunos</p>
                <p className="text-lg font-extrabold text-slate-100">{totalStudents}</p>
              </div>
              <Users className="w-5 h-5 text-amber-400/60" />
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Matrículas Ativas</p>
                <p className="text-lg font-extrabold text-emerald-400">{activeStudents}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400/60" />
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Inadimplentes</p>
                <p className="text-lg font-extrabold text-rose-400">{defaultingStudents}</p>
              </div>
              <ShieldAlert className="w-5 h-5 text-rose-400/60" />
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Trancados / Desistentes</p>
                <p className="text-lg font-extrabold text-amber-400">{lockedStudents}</p>
              </div>
              <Clock className="w-5 h-5 text-amber-400/60" />
            </div>
          </div>

          {/* Search & Status Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, responsável, CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="ALL">Todos os Status ({students.length})</option>
                <option value="ACTIVE">Ativos ({activeStudents})</option>
                <option value="DEFAULTING">Inadimplentes ({defaultingStudents})</option>
                <option value="LOCKED">Trancados ({lockedStudents})</option>
                <option value="DROPOUT">Desistentes</option>
              </select>

              <button
                onClick={() => {
                  setEnrollMode('NEW_STUDENT');
                  setIsEnrollModalOpen(true);
                }}
                className="ml-auto sm:ml-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nova Matrícula</span>
              </button>
            </div>
          </div>

          {/* Students Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const enrolledCourseNames = student.enrolledCourses
                .map((cId) => courses.find((c) => c.id === cId)?.name || 'Música')
                .join(', ');

              return (
                <div
                  key={student.id}
                  className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          {student.name}
                        </h2>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Music className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{enrolledCourseNames || 'Sem cursos ativos'}</span>
                        </p>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>

                    {/* Quick Specs */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300 mb-4">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Responsável Financeiro:</span>
                        <span className="font-semibold text-slate-200">{student.guardian.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Telefone / WhatsApp:</span>
                        <span className="text-slate-300 font-mono">{student.phone}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Créditos de Reposição:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {student.makeupCredits} disponíveis
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">ID: {student.id}</span>
                    <button
                      onClick={() => {
                        setSelectedStudentForEnroll(student);
                        setEnrollMode('EXISTING_STUDENT');
                        setIsEnrollModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer group-hover:border-amber-400/50"
                      title="Matricular este aluno com as configurações salvas de plano"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Nova Matrícula</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 2: PROFESSORES */}
      {activeSubTab === 'TEACHERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">{teacher.name}</h2>
                    <p className="text-xs text-amber-400/90 font-medium">{teacher.instruments.join(', ')}</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Modelo Contratual:</span>
                    <span className="font-bold text-slate-200">
                      {teacher.contractModel === 'HOURLY'
                        ? 'Horista (Hora/Aula)'
                        : teacher.contractModel === 'PERCENTAGE'
                        ? '% Comissão'
                        : 'Salário Fixo'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Valor Acordado:</span>
                    <span className="font-bold text-emerald-400">
                      {teacher.contractModel === 'HOURLY'
                        ? `R$ ${teacher.hourlyRate.toFixed(2)} / hora`
                        : teacher.contractModel === 'PERCENTAGE'
                        ? `${teacher.commissionPercentage}% da mensalidade`
                        : `R$ ${teacher.fixedSalary.toFixed(2)} / mês`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Falta Justificada:</span>
                    <span className="text-slate-300">
                      {teacher.paysOnStudentJustifiedAbsence ? 'Repassa (Abonada)' : 'Não computa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                  {teacher.email}
                </p>
                <p className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                  {teacher.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 3: RESPONSÁVEIS FINANCEIROS */}
      {activeSubTab === 'GUARDIANS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const g = student.guardian;
            return (
              <div
                key={g.id}
                className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h2 className="text-sm font-bold text-slate-100">{g.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {g.relationship}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="flex justify-between">
                    <span className="text-slate-400">CPF Responsável:</span>
                    <span className="font-mono text-slate-200">{g.cpf}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Aluno Tutelado:</span>
                    <span className="font-bold text-amber-400">{student.name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Email Financeiro:</span>
                    <span className="text-slate-300 truncate max-w-[170px]">{g.email}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Telefone / Pix:</span>
                    <span className="font-mono text-slate-200">{g.phone}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Nova Matrícula & Cadastro Completo */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsEnrollModalOpen(false);
                setModalFeedback(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between mb-2 pr-8">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                {enrollMode === 'NEW_STUDENT' ? 'Nova Matrícula: Cadastro Completo' : 'Nova Matrícula: Aluno Existente'}
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                <BookmarkCheck className="w-3 h-3 text-amber-400" />
                Mesmas Configurações Preservadas
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {enrollMode === 'NEW_STUDENT'
                ? 'Cadastre as informações pessoais do aluno, os dados do responsável financeiro e vincule ao plano com as configurações pré-estabelecidas.'
                : 'Selecione qualquer aluno da lista para aplicar as mesmas configurações de curso, sala, professor, dia e valor.'}
            </p>

            {/* Banner de Feedback Interno */}
            {modalFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{modalFeedback}</span>
              </div>
            )}

            {/* Alternador de Modo: Novo Aluno vs Aluno Existente */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5 text-xs">
              <button
                type="button"
                onClick={() => setEnrollMode('NEW_STUDENT')}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  enrollMode === 'NEW_STUDENT'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>1. Cadastrar Novo Aluno</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedStudentForEnroll && students.length > 0) {
                    setSelectedStudentForEnroll(students[0]);
                  }
                  setEnrollMode('EXISTING_STUDENT');
                }}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  enrollMode === 'EXISTING_STUDENT'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2. Matricular Aluno Existente</span>
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              {enrollMode === 'NEW_STUDENT' ? (
                <>
                  {/* SEÇÃO 1: INFORMAÇÕES PESSOAIS DO NOVO ALUNO */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 text-slate-200 font-bold">
                        <GraduationCap className="w-4 h-4 text-amber-400" />
                        <span>1. Informações Pessoais do Aluno</span>
                      </div>
                      {studentAge > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono">
                          {studentAge} anos {studentAge < 18 ? '• Menor de Idade' : '• Maior de Idade'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Nome Completo do Aluno <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Clara Buarque da Silva"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Data de Nascimento <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={newStudentBirthDate}
                          onChange={(e) => setNewStudentBirthDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp</label>
                        <input
                          type="text"
                          placeholder="(11) 98765-4321"
                          value={newStudentPhone}
                          onChange={(e) => setNewStudentPhone(formatPhone(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Email do Aluno</label>
                        <input
                          type="email"
                          placeholder="clara.musica@email.com"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">CPF do Aluno (Opcional)</label>
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          value={newStudentCpf}
                          onChange={(e) => setNewStudentCpf(formatCPF(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Nível Musical de Entrada</label>
                        <select
                          value={newStudentLevel}
                          onChange={(e) => setNewStudentLevel(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Iniciante">Iniciante (Zero absoluto)</option>
                          <option value="Básico">Básico (Já toca de ouvido / noções)</option>
                          <option value="Intermediário">Intermediário (Lê cifras / partitura básica)</option>
                          <option value="Avançado">Avançado (Preparação técnica / repertório)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Observações & Metas</label>
                        <input
                          type="text"
                          placeholder="Ex: Teclado em casa, foco em leitura e clássico..."
                          value={newStudentNotes}
                          onChange={(e) => setNewStudentNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: INFORMAÇÕES DO RESPONSÁVEL FINANCEIRO / LEGAL */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 text-slate-200 font-bold">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>2. Informações do Responsável Financeiro / Legal</span>
                      </div>
                      {studentAge >= 18 && (
                        <button
                          type="button"
                          onClick={handleCopyStudentToGuardian}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Copiar Dados do Aluno (Maior de Idade)</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1">
                          Nome do Responsável <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Mariana Buarque da Silva"
                          value={newGuardianName}
                          onChange={(e) => setNewGuardianName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Grau de Parentesco</label>
                        <select
                          value={newGuardianRelationship}
                          onChange={(e) => setNewGuardianRelationship(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Mãe">Mãe</option>
                          <option value="Pai">Pai</option>
                          <option value="Responsável Legal">Responsável Legal</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="O Próprio Aluno">O Próprio Aluno</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          CPF do Responsável <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          value={newGuardianCpf}
                          onChange={(e) => setNewGuardianCpf(formatCPF(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Telefone / WhatsApp <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="(11) 99876-5432"
                          value={newGuardianPhone}
                          onChange={(e) => setNewGuardianPhone(formatPhone(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Email para Faturas / Pix <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="mariana.financeiro@email.com"
                          value={newGuardianEmail}
                          onChange={(e) => setNewGuardianEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* SEÇÃO: SELEÇÃO DE ALUNO JÁ CADASTRADO */
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="enroll-student-select" className="text-slate-200 font-bold flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>Selecione Qualquer Aluno para Matricular</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Mesmas Configurações de Plano
                    </span>
                  </div>

                  <select
                    id="enroll-student-select"
                    value={selectedStudentForEnroll?.id || ''}
                    onChange={(e) => {
                      const found = students.find((s) => s.id === e.target.value);
                      if (found) setSelectedStudentForEnroll(found);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status === 'ACTIVE' ? 'Ativo' : s.status}) — Resp: {s.guardian.name} — Tel: {s.phone}
                      </option>
                    ))}
                  </select>

                  {selectedStudentForEnroll && (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span>Responsável Legal: <strong className="text-slate-200">{selectedStudentForEnroll.guardian.name}</strong> ({selectedStudentForEnroll.guardian.relationship})</span>
                      <span>CPF: <strong className="text-slate-200 font-mono">{selectedStudentForEnroll.guardian.cpf}</strong></span>
                      <span>Cursos Atuais: <strong className="text-amber-400">{selectedStudentForEnroll.enrolledCourses.length}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* SEÇÃO 3: PLANO CONTRATADO & GRADE DE HORÁRIOS (COM MESMAS CONFIGURAÇÕES) */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>{enrollMode === 'NEW_STUDENT' ? '3. Configurações do Plano & Grade' : '2. Configurações do Plano & Grade'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                      <BookmarkCheck className="w-3 h-3" />
                      Mesmas Configurações
                    </span>
                  </div>
                </div>

                {/* Banner Informativo sobre as Mesmas Configurações */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    As opções de curso, professor, sala, dia e horários ficam memorizadas para você matricular quantos alunos desejar sem redigitar!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={enrollCourseSelectId} className="block text-slate-300 font-semibold mb-1">
                      Curso / Instrumento
                    </label>
                    <select
                      id={enrollCourseSelectId}
                      value={enrollCourseId}
                      onChange={(e) => {
                        setEnrollCourseId(e.target.value);
                        const crs = courses.find((c) => c.id === e.target.value);
                        if (crs) setEnrollFee(crs.monthlyFee);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Padrão: R$ {c.monthlyFee}/mês)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={enrollModalitySelectId} className="block text-slate-300 font-semibold mb-1">
                      Modalidade da Aula
                    </label>
                    <select
                      id={enrollModalitySelectId}
                      value={enrollModality}
                      onChange={(e) => setEnrollModality(e.target.value as EnrollmentModality)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="INDIVIDUAL">Individual (1 Aluno por horário)</option>
                      <option value="DUO">Dupla (2 Alunos no mesmo horário)</option>
                      <option value="ENSEMBLE">Prática de Conjunto (Turma / Grupo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={enrollTeacherSelectId} className="block text-slate-300 font-semibold mb-1">
                      Professor Responsável
                    </label>
                    <select
                      id={enrollTeacherSelectId}
                      value={enrollTeacherId}
                      onChange={(e) => setEnrollTeacherId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.instruments.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={enrollRoomSelectId} className="block text-slate-300 font-semibold mb-1">
                      Sala Física
                    </label>
                    <select
                      id={enrollRoomSelectId}
                      value={enrollRoomId}
                      onChange={(e) => setEnrollRoomId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Capac: {r.capacity} — {r.availableInstruments.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={enrollDaySelectId} className="block text-slate-300 font-semibold mb-1">
                      Dia da Semana
                    </label>
                    <select
                      id={enrollDaySelectId}
                      value={enrollDayOfWeek}
                      onChange={(e) => setEnrollDayOfWeek(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value={1}>Segunda-feira</option>
                      <option value={2}>Terça-feira</option>
                      <option value={3}>Quarta-feira</option>
                      <option value={4}>Quinta-feira</option>
                      <option value={5}>Sexta-feira</option>
                      <option value={6}>Sábado</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor={enrollStartTimeId} className="block text-slate-300 font-semibold mb-1">
                      Início
                    </label>
                    <input
                      id={enrollStartTimeId}
                      type="time"
                      value={enrollStartTime}
                      onChange={(e) => setEnrollStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={enrollEndTimeId} className="block text-slate-300 font-semibold mb-1">
                      Término
                    </label>
                    <input
                      id={enrollEndTimeId}
                      type="time"
                      value={enrollEndTime}
                      onChange={(e) => setEnrollEndTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Duração & Validação de Conflito em Tempo Real */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Duração da Aula: <strong className="text-amber-400">{lessonDurationMinutes} minutos</strong></span>
                  <span>Professor: <strong className="text-slate-200">{selectedTeacherObj?.name}</strong></span>
                  <span>Sala: <strong className="text-slate-200">{selectedRoomObj?.name}</strong></span>
                </div>

                {conflictCheck.hasConflict && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-bold">Aviso de Conflito de Horário Detectado:</p>
                      <p className="text-[11px] text-rose-200/90">{conflictCheck.reason}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Nota: Em modalidades como Prática de Conjunto ou Dupla, o agendamento no mesmo horário é permitido para montar a turma.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label htmlFor={enrollFeeInputId} className="block text-slate-300 font-semibold mb-1">
                      Mensalidade do Plano (R$)
                    </label>
                    <input
                      id={enrollFeeInputId}
                      type="number"
                      value={enrollFee}
                      onChange={(e) => setEnrollFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={enrollDueDayInputId} className="block text-slate-300 font-semibold mb-1">
                      Dia do Vencimento (1 a 28)
                    </label>
                    <input
                      id={enrollDueDayInputId}
                      type="number"
                      min={1}
                      max={28}
                      value={enrollDueDay}
                      onChange={(e) => setEnrollDueDay(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Rodapé */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnrollModalOpen(false);
                    setModalFeedback(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  {/* Botão de Matricular e Continuar com as Mesmas Configurações */}
                  <button
                    type="button"
                    onClick={() => submitEnrollment(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Salva esta matrícula e mantém o modal aberto com o mesmo plano para o próximo aluno"
                  >
                    <BookmarkCheck className="w-4 h-4 text-amber-400" />
                    <span>Salvar & Matricular Próximo (Mesmas Configurações)</span>
                  </button>

                  {/* Botão de Confirmar e Fechar */}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {enrollMode === 'NEW_STUDENT'
                        ? 'Cadastrar Aluno & Gerar Matrícula'
                        : 'Confirmar e Gerar Grade'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CADASTRAR PROFESSOR */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsTeacherModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" /> Cadastrar Novo Professor
            </h2>
            <p className="text-xs text-slate-400 mb-4">Insira os dados do instrutor e modelo de remuneração.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddTeacher?.({
                id: `prof-${Date.now()}`,
                name: tName,
                email: tEmail,
                phone: tPhone,
                instruments: tInstruments.split(',').map((s) => s.trim()).filter(Boolean),
                contractModel: tModel,
                hourlyRate: tModel === 'HOURLY' ? tRate : 0,
                commissionPercentage: tModel === 'PERCENTAGE' ? tRate : 0,
                fixedSalary: tModel === 'FIXED' ? tRate : 0,
                paysOnStudentJustifiedAbsence: true,
              });
              setIsTeacherModalOpen(false);
              setTName(''); setTEmail(''); setTPhone(''); setTInstruments('');
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                <input type="text" value={tName} onChange={(e) => setTName(e.target.value)} required placeholder="Ex: Lucas Silva" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp</label>
                  <input type="text" value={tPhone} onChange={(e) => setTPhone(e.target.value)} placeholder="(62) 99999-9999" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} placeholder="prof@escola.com" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Instrumentos (separados por vírgula)</label>
                <input type="text" value={tInstruments} onChange={(e) => setTInstruments(e.target.value)} required placeholder="Ex: Violão, Guitarra, Bateria" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Modelo de Contrato</label>
                  <select value={tModel} onChange={(e: any) => setTModel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200">
                    <option value="HOURLY">Horista (Hora/Aula)</option>
                    <option value="PERCENTAGE">% da Mensalidade</option>
                    <option value="FIXED">Salário Fixo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {tModel === 'HOURLY' ? 'Valor Hora (R$)' : tModel === 'PERCENTAGE' ? '% Comissão' : 'Salário Fixo (R$)'}
                  </label>
                  <input type="number" value={tRate} onChange={(e) => setTRate(Number(e.target.value))} required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-bold" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsTeacherModalOpen(false)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-amber-500 font-bold text-slate-950">Cadastrar Professor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR SALA */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsRoomModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <DoorClosed className="w-4 h-4 text-blue-400" /> Cadastrar Sala Física
            </h2>
            <p className="text-xs text-slate-400 mb-4">Adicione uma sala à estrutura da escola.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddRoom?.({
                id: `room-${Date.now()}`,
                name: rName,
                capacity: rCapacity,
                description: rDescription,
                availableInstruments: ['Geral'],
                color: '#3b82f6',
              });
              setIsRoomModalOpen(false);
              setRName(''); setRDescription('');
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome da Sala</label>
                <input type="text" value={rName} onChange={(e) => setRName(e.target.value)} required placeholder="Ex: Sala 04 - Bateria & Percussão" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Capacidade de Alunos</label>
                <input type="number" min={1} value={rCapacity} onChange={(e) => setRCapacity(Number(e.target.value))} required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição / Equipamentos</label>
                <input type="text" value={rDescription} onChange={(e) => setRDescription(e.target.value)} placeholder="Ex: Ar-condicionado, bateria eletrónica" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-500 font-bold text-white">Salvar Sala</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR CURSO */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCourseModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" /> Cadastrar Curso / Modalidade
            </h2>
            <p className="text-xs text-slate-400 mb-4">Adicione um novo curso ao catálogo pedagógico.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddCourse?.({
                id: `course-${Date.now()}`,
                name: cName,
                category: cCategory,
                defaultDurationMinutes: cDuration,
                monthlyFee: cMonthlyFee,
                description: `Curso completo de ${cName}`,
              });
              setIsCourseModalOpen(false);
              setCName('');
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Curso</label>
                <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} required placeholder="Ex: Teclado & Prática de Conjunto" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select value={cCategory} onChange={(e: any) => setCCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200">
                    <option value="INSTRUMENT">Instrumento</option>
                    <option value="VOCAL">Vocal / Canto</option>
                    <option value="THEORY">Teoria Musical</option>
                    <option value="PRACTICE">Prática em Grupo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duração Padrão (min)</label>
                  <input type="number" value={cDuration} onChange={(e) => setCDuration(Number(e.target.value))} required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mensalidade Base Sugerida (R$)</label>
                <input type="number" value={cMonthlyFee} onChange={(e) => setCMonthlyFee(Number(e.target.value))} required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-bold" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-500 font-bold text-slate-950">Cadastrar Curso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
