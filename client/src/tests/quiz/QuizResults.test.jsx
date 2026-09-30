import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import QuizResults from '@/features/quiz/components/QuizResults';
import { renderWithProviders } from '../testUtils';

const publicQuiz = {
  title: 'Practice quiz',
  questions: [
    {
      id: 'q1',
      question: 'Which answer is correct?',
      options: [{ text: 'A' }, { text: 'B' }],
    },
  ],
};

describe('QuizResults', () => {
  it('uses the post-submission solution questions for answer keys and explanations', () => {
    renderWithProviders(
      <QuizResults
        quiz={publicQuiz}
        userAnswers={{ q1: 0 }}
        result={{
          score: 0,
          totalQuestions: 1,
          percentage: 0,
          questions: [
            {
              id: 'q1',
              question: 'Which answer is correct?',
              explanation: 'B is correct because it matches the rule.',
              options: [
                { text: 'A', isCorrect: false },
                { text: 'B', isCorrect: true },
              ],
            },
          ],
          answers: [{ questionId: 'q1', selectedOption: 0, isCorrect: false }],
        }}
      />
    );

    expect(screen.getByText('B is correct because it matches the rule.')).toBeInTheDocument();
    expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    expect(screen.getByText('Your Choice')).toBeInTheDocument();
  });

  it('shows solutions for skipped questions without marking them answered', () => {
    renderWithProviders(
      <QuizResults
        quiz={publicQuiz}
        result={{
          score: 0,
          totalQuestions: 1,
          answers: [],
          questions: [
            {
              ...publicQuiz.questions[0],
              explanation: 'Review this skipped question too.',
              options: [
                { text: 'A', isCorrect: false },
                { text: 'B', isCorrect: true },
              ],
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Review this skipped question too.')).toBeInTheDocument();
    expect(screen.getByText('Skipped (0 Marks)')).toBeInTheDocument();
    expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    expect(screen.queryByText('Your Choice')).not.toBeInTheDocument();
  });

  it('does not invent a solution when a submission response has no solution questions', () => {
    renderWithProviders(
      <QuizResults
        quiz={publicQuiz}
        userAnswers={{}}
        result={{ score: 0, totalQuestions: 1, percentage: 0, answers: [] }}
      />
    );

    expect(screen.queryByText('Correct Answer')).not.toBeInTheDocument();
    expect(screen.queryByText(/B is correct because/)).not.toBeInTheDocument();
  });
});
