import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';

export default function TestResult() {
  const { id } = useParams();
  const { result, answers } = useSelector(state => state.tests);
  const [activeTab, setActiveTab] = useState('summary');

  const questions = result?.questions || result?.test?.questions || [];

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'review', label: 'Question Review', count: questions.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8" />

      {activeTab === 'summary' && <TestResultSummary result={result} />}

      {activeTab === 'review' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <p>Question review not available</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <QuestionReview
                key={q._id || i}
                question={q}
                index={i}
                userAnswer={answers[q._id || q.id || i]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
