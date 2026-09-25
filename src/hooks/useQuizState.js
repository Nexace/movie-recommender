import { useState, useCallback, useMemo } from 'react';
import { questions } from '../data/questions';

const TOTAL_QUESTIONS = questions.length;

function createInitialState() {
  const answers = {};
  for (const q of questions) {
    if (q.type === 'details') {
      for (const g of q.groups) answers[g.id] = g.default;
    } else {
      answers[q.id] = q.type === 'multi' ? [] : null;
    }
  }
  return answers;
}

export function isAnswered(question, answers) {
  if (question.type === 'details') return true;
  const value = answers[question.id];
  return question.type === 'multi' ? value.length > 0 : value !== null;
}

export function useQuizState() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(createInitialState);
  const [direction, setDirection] = useState(0);

  const currentQuestion = questions[step];
  const isFirst = step === 0;
  const isLast = step === TOTAL_QUESTIONS - 1;
  const progress = ((step + 1) / TOTAL_QUESTIONS) * 100;

  const isCurrentValid = useMemo(
    () => Boolean(currentQuestion) && (currentQuestion.optional || isAnswered(currentQuestion, answers)),
    [currentQuestion, answers]
  );

  const next = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_QUESTIONS - 1));
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const setAnswer = useCallback((id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setAnswers(createInitialState());
    setDirection(0);
  }, []);

  return {
    step,
    direction,
    answers,
    currentQuestion,
    isFirst,
    isLast,
    progress,
    isCurrentValid,
    next,
    prev,
    setAnswer,
    reset,
    totalQuestions: TOTAL_QUESTIONS,
  };
}
