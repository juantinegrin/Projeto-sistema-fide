import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Music,
  Play,
  Square,
  Volume2,
  Download,
  Eye,
  Award,
  Sparkles,
  Plus,
  X,
  Target,
  ListTodo,
} from 'lucide-react';
import { Student, Teacher, LessonNote } from '../types/index.ts';
import { audioSynth } from '../utils/audioSynthesizer.ts';

interface PedagogicalJournalProps {
  students: Student[];
  teachers: Teacher[];
  lessonNotes: LessonNote[];
  onAddLessonNote: (note: LessonNote) => void;
}

export const PedagogicalJournal: React.FC<PedagogicalJournalProps> = ({
  students,
  teachers,
  lessonNotes,
  onAddLessonNote,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [activeBpm, setActiveBpm] = useState<number>(92);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeScoreModal, setActiveScoreModal] = useState<string | null>(null);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);

  // Formulário de Nova Nota Pedagógica
  const [formContentCovered, setFormContentCovered] = useState('');
  const [formHomework, setFormHomework] = useState('');
  const [formDrillName, setFormDrillName] = useState('Escala Maior com Metrônomo');
  const [formTargetBpm, setFormTargetBpm] = useState(90);
  const [formAchievedBpm, setFormAchievedBpm] = useState(84);
  const [formSongTitle, setFormSongTitle] = useState('Noturno em Mi Bemol Maior');
  const [formComposer, setFormComposer] = useState('F. Chopin');
  const [formRhythmScore, setFormRhythmScore] = useState(8.5);
  const [formTuningScore, setFormTuningScore] = useState(9.0);
  const [formTechniqueScore, setFormTechniqueScore] = useState(8.0);
  const [formInterpretationScore, setFormInterpretationScore] = useState(8.5);
  const [formFeedback, setFormFeedback] = useState('Ótima dedicação no relaxamento dos pulsos.');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentNotes = lessonNotes.filter((n) => n.studentId === selectedStudentId);

  const toggleMetronome = (bpm: number) => {
    if (isMetronomeActive) {
      audioSynth.stopMetronome();
      setIsMetronomeActive(false);
    } else {
      setActiveBpm(bpm);
      audioSynth.startMetronome(bpm, (beat) => setCurrentBeat(beat));
      setIsMetronomeActive(true);
    }
  };

  const playPlaybackTrack = () => {
    setIsAudioPlaying(true);
    audioSynth.playChordProgression();
    setTimeout(() => setIsAudioPlaying(false), 5000);
  };

  useEffect(() => {
    return () => {
      audioSynth.stopMetronome();
    };
  }, []);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      teacherId: teachers[0]?.id || 'prof-mariana',
      teacherName: teachers[0]?.name || 'Mariana Duarte',
      courseName: 'Piano & Teclado',
      date: new Date().toISOString().slice(0, 10),
      contentCovered: formContentCovered,
      technicalDrills: [
        {
          name: formDrillName,
          targetBpm: formTargetBpm,
          achievedBpm: formAchievedBpm,
          notes: 'Prática de independência motora com metrônomo.',
        },
      ],
      repertoire: [
        {
          songTitle: formSongTitle,
          composer: formComposer,
          section: 'Compassos 1 ao 24',
          status: 'IN_PROGRESS',
        },
      ],
      homework: formHomework,
      attachments: [
        {
          id: `att-${Date.now()}`,
          title: `${formSongTitle.replace(/\s+/g, '_')}_Partitura.pdf`,
          type: 'SHEET_MUSIC_PDF',
          url: 'https://example.com/scores/demo.pdf',
          durationOrPages: '2 páginas anotadas',
        },
        {
          id: `att-aud-${Date.now()}`,
          title: 'Faixa_de_Apoio_Playback_BPM.mp3',
          type: 'AUDIO_PLAYBACK',
          url: 'https://example.com/audio/playback.mp3',
          durationOrPages: '02:10',
        },
      ],
      evaluation: {
        rhythmScore: formRhythmScore,
        tuningPitchScore: formTuningScore,
        techniqueScore: formTechniqueScore,
        interpretationScore: formInterpretationScore,
        teacherComments: formFeedback,
      },
    };

    onAddLessonNote(newNote);
    setIsNewNoteModalOpen(false);
    setFormContentCovered('');
    setFormHomework('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Módulo Pedagógico & Diário de Classe
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro detalhado de exercícios técnicos com metrônomo, repertório, tarefas e avaliação periódica por competência.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                Aluno(a): {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsNewNoteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro de Aula</span>
          </button>
        </div>
      </div>

      {/* Main Student Timeline & Logs */}
      {studentNotes.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
          <h2 className="text-sm font-bold text-slate-300">Nenhum diário registrado para este aluno ainda.</h2>
          <p className="text-xs max-w-md mx-auto">
            Clique no botão &quot;Novo Registro de Aula&quot; para registrar o conteúdo ministrado, exercícios técnicos, partituras e avaliação.
          </p>
          <button
            onClick={() => setIsNewNoteModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            + Criar Primeiro Diário
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {studentNotes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-sm space-y-6 hover:border-slate-700 transition-all"
            >
              {/* Header of Note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-100">{note.courseName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {note.date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Docente Responsável: <span className="text-slate-200 font-semibold">{note.teacherName}</span>
                    </p>
                  </div>
                </div>

                {note.evaluation && (
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-300">Média de Desempenho:</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {(
                        (note.evaluation.rhythmScore +
                          note.evaluation.tuningPitchScore +
                          note.evaluation.techniqueScore +
                          note.evaluation.interpretationScore) /
                        4
                      ).toFixed(1)}{' '}
                      / 10
                    </span>
                  </div>
                )}
              </div>

              {/* Conteúdo Aplicado */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Conteúdo Aplicado na Aula
                </h2>
                <p className="text-xs text-slate-200 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  {note.contentCovered}
                </p>
              </div>

              {/* Grid 2 Cols: Exercícios Técnicos & Repertório */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exercícios Técnicos & Metrônomo */}
                <div className="bg-slate-950/70 rounded-xl border border-slate-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      Exercícios Técnicos & Rudimentos
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium">BPM / Metrônomo</span>
                  </div>

                  {note.technicalDrills.map((drill, idx) => (
                    <div key={idx} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-100">{drill.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {drill.achievedBpm} / {drill.targetBpm} BPM
                          </span>
                          <button
                            onClick={() => toggleMetronome(drill.targetBpm)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isMetronomeActive && activeBpm === drill.targetBpm
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                            }`}
                            title="Ligar metrônomo no BPM alvo"
                          >
                            {isMetronomeActive && activeBpm === drill.targetBpm ? (
                              <>
                                <Square className="w-3 h-3" />
                                <span>Tempo {currentBeat}/4</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Metrônomo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">{drill.notes}</p>
                    </div>
                  ))}
                </div>

                {/* Repertório & Músicas em Estudo */}
                <div className="bg-slate-950/70 rounded-xl border border-slate-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      Repertório & Peças Musicais
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium">Status de Estudo</span>
                  </div>

                  {note.repertoire.map((piece, idx) => (
                    <div key={idx} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-100">{piece.songTitle}</p>
                          <p className="text-[10px] text-slate-400">{piece.composer}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            piece.status === 'MASTERED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : piece.status === 'POLISHING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {piece.status === 'MASTERED'
                            ? 'Concluída'
                            : piece.status === 'POLISHING'
                            ? 'Polimento / Dinâmica'
                            : 'Em Leitura'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/60">
                        Trecho trabalhado: <span className="text-amber-400/90">{piece.section}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lição de Casa / Tarefa para Próxima Aula */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                <h2 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5" />
                  Lição de Casa & Metas de Estudo para a Próxima Semana
                </h2>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {note.homework}
                </p>
              </div>

              {/* Anexos Didáticos & Playback Player */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Material de Apoio (Partituras, Tabs & Playbacks)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {note.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                          {att.type === 'SHEET_MUSIC_PDF' ? (
                            <FileText className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200 truncate max-w-[180px]">{att.title}</p>
                          <p className="text-[10px] text-slate-400">{att.durationOrPages}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {att.type === 'AUDIO_PLAYBACK' ? (
                          <button
                            onClick={playPlaybackTrack}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isAudioPlaying
                                ? 'bg-emerald-500 text-slate-950 animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>{isAudioPlaying ? 'Tocando...' : 'Ouvir Faixa'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveScoreModal(att.title)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avaliação por Competências (Ritmo, Afinação, Técnica, Interpretação) */}
              {note.evaluation && (
                <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-4">
                  <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Rubrica de Avaliação Pedagógica por Competência
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">Ritmo & Precisão</p>
                      <p className="text-lg font-black text-amber-400 font-mono mt-1">
                        {note.evaluation.rhythmScore.toFixed(1)}
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${note.evaluation.rhythmScore * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">Afinação & Escuta</p>
                      <p className="text-lg font-black text-emerald-400 font-mono mt-1">
                        {note.evaluation.tuningPitchScore.toFixed(1)}
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${note.evaluation.tuningPitchScore * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">Técnica & Postura</p>
                      <p className="text-lg font-black text-blue-400 font-mono mt-1">
                        {note.evaluation.techniqueScore.toFixed(1)}
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-blue-400 h-full rounded-full"
                          style={{ width: `${note.evaluation.techniqueScore * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">Interpretação & Expressão</p>
                      <p className="text-lg font-black text-purple-400 font-mono mt-1">
                        {note.evaluation.interpretationScore.toFixed(1)}
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-purple-400 h-full rounded-full"
                          style={{ width: `${note.evaluation.interpretationScore * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                    &quot;{note.evaluation.teacherComments}&quot;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Visualizador de Partitura Simulado */}
      {activeScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveScoreModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100">{activeScoreModal}</h2>
            </div>

            {/* Simulação gráfica de pauta musical */}
            <div className="bg-white p-6 rounded-xl text-slate-900 space-y-4 font-serif text-left shadow-inner">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-lg">Minueto em Sol Maior (BWV Anh. 114)</span>
                <span className="text-xs text-slate-600">J.S. Bach (1685 - 1750)</span>
              </div>
              <p className="text-xs text-slate-500">Andante grazioso • Compasso 3/4 • Armadura: 1 Sustenido (Fá#)</p>
              {/* Pauta Musical Ilustrativa */}
              <div className="py-4 space-y-2 border-y border-slate-300">
                <div className="h-0.5 bg-slate-800 w-full" />
                <div className="h-0.5 bg-slate-800 w-full" />
                <div className="h-0.5 bg-slate-800 w-full" />
                <div className="h-0.5 bg-slate-800 w-full" />
                <div className="h-0.5 bg-slate-800 w-full" />
              </div>
              <p className="text-[11px] text-slate-600 italic">
                * Anotações pedagógicas do docente: &quot;Atenção à digitação 1-3-5 no arpejo inicial e peso no tempo 1.&quot;
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setActiveScoreModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Registro Pedagógico */}
      {isNewNoteModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewNoteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-100 mb-1">
              Lançar Diário de Classe: {selectedStudent.name}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Preencha o conteúdo, técnica, repertório e notas por competência.
            </p>

            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Conteúdo Ministrado na Aula</label>
                <textarea
                  value={formContentCovered}
                  onChange={(e) => setFormContentCovered(e.target.value)}
                  placeholder="Ex: Introdução à cadência perfeita, arpejos de mãos alternadas e dinâmicas pianíssimo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-300 font-semibold mb-1">Exercício Técnico</label>
                  <input
                    type="text"
                    value={formDrillName}
                    onChange={(e) => setFormDrillName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">BPM Alvo</label>
                  <input
                    type="number"
                    value={formTargetBpm}
                    onChange={(e) => setFormTargetBpm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">BPM Atingido</label>
                  <input
                    type="number"
                    value={formAchievedBpm}
                    onChange={(e) => setFormAchievedBpm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Música / Repertório</label>
                  <input
                    type="text"
                    value={formSongTitle}
                    onChange={(e) => setFormSongTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Compositor / Artista</label>
                  <input
                    type="text"
                    value={formComposer}
                    onChange={(e) => setFormComposer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lição de Casa & Tarefas</label>
                <textarea
                  value={formHomework}
                  onChange={(e) => setFormHomework(e.target.value)}
                  placeholder="Ex: Praticar Hanon 15 minutos ao dia a 84 BPM..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 h-16"
                  required
                />
              </div>

              {/* Notas de Avaliação */}
              <div className="pt-2 border-t border-slate-800">
                <span className="block text-slate-300 font-semibold mb-2">Avaliação de Competências (0 a 10)</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Ritmo</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formRhythmScore}
                      onChange={(e) => setFormRhythmScore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Afinação</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formTuningScore}
                      onChange={(e) => setFormTuningScore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Técnica</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formTechniqueScore}
                      onChange={(e) => setFormTechniqueScore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Expressão</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formInterpretationScore}
                      onChange={(e) => setFormInterpretationScore(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Feedback do Docente</label>
                <input
                  type="text"
                  value={formFeedback}
                  onChange={(e) => setFormFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewNoteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Salvar no Diário de Bordo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
