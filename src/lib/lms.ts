export interface LmsQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface LmsMetadataInput {
  summary: string;
  scheduleDate: string;
  durationMinutes: number | string;
  type: 'video' | 'quiz' | 'audio' | 'text' | 'live_meet';
  textContent: string;
  questions: LmsQuizQuestion[];
}

export function validateQuizQuestions(questions: LmsQuizQuestion[]) {
  for (let i = 0; i < questions.length; i++) {
    if (!questions[i].question.trim()) {
      throw new Error(`Pertanyaan nomor ${i + 1} belum diisi.`);
    }
    for (let j = 0; j < 4; j++) {
      if (!questions[i].options[j]?.trim()) {
        throw new Error(`Pilihan jawaban ${String.fromCharCode(65 + j)} pada soal nomor ${i + 1} belum diisi.`);
      }
    }
  }
}

export function buildLmsMetadataPayload({
  summary,
  scheduleDate,
  durationMinutes,
  type,
  textContent,
  questions,
}: LmsMetadataInput) {
  return {
    summary: summary.trim(),
    schedule_date: scheduleDate || null,
    duration_minutes: durationMinutes ? Number(durationMinutes) : null,
    text_content: type === 'text' ? textContent.trim() : null,
    questions: type === 'quiz' ? questions : null,
  };
}
