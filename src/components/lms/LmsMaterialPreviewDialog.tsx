'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';

interface LmsMaterialPreviewDialogProps {
  material: any;
  activeQuizIndex: number;
  selectedAnswers: Record<number, number>;
  onSelectAnswer: (index: number, option: number) => void;
  onQuizIndexChange: (index: number) => void;
  onClose: () => void;
}

export default function LmsMaterialPreviewDialog({
  material,
  activeQuizIndex,
  selectedAnswers,
  onSelectAnswer,
  onQuizIndexChange,
  onClose,
}: LmsMaterialPreviewDialogProps) {
  if (!material) return null;

  const questions = material.metadata?.questions || [];
  const currentQuestion = questions[activeQuizIndex] || null;

  return (
    <Dialog
      open={Boolean(material)}
      onClose={onClose}
      title={material.title || 'Pratinjau Materi'}
      description={`Dibuat oleh ${material.author_name || (material.is_global ? 'Super Administrator' : 'Pengajar')} · ${
        material.creator_role || (material.is_global ? 'Pusat' : 'Institusi')
      }`}
      size="lg"
    >
      <div className="space-y-4">
        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          {material.type === 'quiz' ? 'Preview Kuis Interaktif' : 'Bacaan Teks Materi'}
        </span>

        {material.type === 'quiz' && (
          <div className="space-y-4">
            {questions.length > 0 && currentQuestion ? (
              <div>
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Soal {activeQuizIndex + 1} dari {questions.length}
                  </span>
                  {material.metadata?.duration_minutes && (
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <Clock size={12} /> Durasi: {material.metadata.duration_minutes} Menit
                    </span>
                  )}
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold text-slate-900">{currentQuestion.question}</p>

                  <div className="space-y-2">
                    {(currentQuestion.options || []).map((option: string, optionIndex: number) => {
                      const isCorrect = currentQuestion.correctAnswer === optionIndex;
                      const isChosen = selectedAnswers[activeQuizIndex] === optionIndex;
                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          onClick={() => onSelectAnswer(activeQuizIndex, optionIndex)}
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition-colors ${
                            isChosen
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                : 'border-rose-300 bg-rose-50 text-rose-900'
                              : 'border-slate-200 bg-white hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span>{option}</span>
                          </div>
                          {isChosen && isCorrect && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <Check size={14} /> Benar
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswers[activeQuizIndex] !== undefined && currentQuestion.explanation && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <strong>Pembahasan:</strong> {currentQuestion.explanation}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={activeQuizIndex === 0}
                    onClick={() => onQuizIndexChange(Math.max(0, activeQuizIndex - 1))}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
                  >
                    Soal Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={activeQuizIndex >= questions.length - 1}
                    onClick={() => onQuizIndexChange(Math.min(questions.length - 1, activeQuizIndex + 1))}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30"
                  >
                    Soal Berikutnya
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum ada daftar soal pada kuis ini.</p>
            )}
          </div>
        )}

        {material.type === 'text' && (
          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-800">
            {material.metadata?.text_content || 'Belum ada isi teks materi.'}
          </div>
        )}
      </div>
    </Dialog>
  );
}
