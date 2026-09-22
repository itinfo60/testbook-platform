import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SampleClasses from '@/components/home/v3/SampleClasses';
import LessonContent from '@/features/course/components/learning/LessonContent';
import CourseLearning from '@/features/course/pages/CourseLearning';

const mocks = vi.hoisted(() => ({
  getSamples: vi.fn(),
  requestFullscreen: vi.fn(),
  mount: vi.fn(),
  unmount: vi.fn(),
  completeLesson: vi.fn(),
  updateProgress: vi.fn(),
  dispatch: vi.fn(),
  state: {},
}));

vi.mock('@/services/api', () => ({
  courseAPI: { getSamples: mocks.getSamples },
  enrollmentAPI: { updateProgress: mocks.updateProgress },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector) => selector(mocks.state),
}));

vi.mock('@/features/course/courseSlice', () => ({
  fetchCourseById: (id) => ({ type: 'fetchCourse', payload: id }),
}));

vi.mock('@/features/enrollment/enrollmentSlice', () => ({
  fetchProgress: () => ({ type: 'fetchProgress' }),
  completeLesson: mocks.completeLesson,
  markLessonDone: (payload) => ({ type: 'markLessonDone', payload }),
}));

vi.mock('@/features/note/noteSlice', () => ({
  fetchNotes: () => ({ type: 'fetchNotes' }),
  createNote: (payload) => ({ type: 'createNote', payload }),
  deleteNote: (payload) => ({ type: 'deleteNote', payload }),
}));

vi.mock('@/features/discussion/discussionSlice', () => ({
  fetchDiscussions: () => ({ type: 'fetchDiscussions' }),
  createDiscussion: (payload) => ({ type: 'createDiscussion', payload }),
}));

vi.mock('@/features/course/components/learning/VideoPlayer', async () => {
  const { forwardRef, useEffect, useImperativeHandle } = await import('react');
  return {
    default: forwardRef(function MockPlayer({ url, onProgress, onComplete }, ref) {
      useImperativeHandle(ref, () => ({ requestFullscreen: mocks.requestFullscreen }));
      useEffect(() => {
        mocks.mount(url);
        return () => mocks.unmount(url);
      }, [url]);
      return (
        <div data-testid="custom-player">
          <button
            onClick={() => {
              for (let second = 1; second <= 60; second += 1) {
                onProgress?.({ played: second / 100, playedSeconds: second, loaded: 1 });
              }
            }}
          >
            Report playback
          </button>
          <button
            onClick={() => {
              onComplete?.();
              onComplete?.();
            }}
          >
            Finish playback
          </button>
        </div>
      );
    }),
  };
});

const lesson = {
  id: 'lesson-1',
  title: 'Demo lecture',
  type: 'video',
  videoUrl: 'https://youtu.be/W6NZfCO5SIk',
  isFree: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requestFullscreen.mockResolvedValue(undefined);
  mocks.completeLesson.mockImplementation((payload) => ({ type: 'completeLesson', payload }));
  mocks.dispatch.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  mocks.state = {
    courses: {
      currentCourse: {
        id: 'course-1',
        title: 'Course',
        sections: [{ id: 'section-1', title: 'Section', lessons: [lesson] }],
      },
      currentCourseIsEnrolled: false,
      loading: false,
    },
    enrollments: { currentProgress: { completedLessons: [] } },
    notes: { notes: [] },
    discussions: { discussions: [] },
  };
});

afterEach(cleanup);

describe('custom player integrations', () => {
  it('opens sample fullscreen through the custom player and switches to one active sample', async () => {
    mocks.getSamples.mockResolvedValue({
      data: { data: { samples: [lesson, { ...lesson, id: 'lesson-2', title: 'Second demo' }] } },
    });
    render(
      <MemoryRouter>
        <SampleClasses />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Play Demo lecture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
    expect(mocks.requestFullscreen).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Play Second demo' }));
    expect(screen.getAllByTestId('custom-player')).toHaveLength(1);
    expect(mocks.unmount).toHaveBeenCalledTimes(1);
  });

  it('starts a new player session for a different lesson sharing the same video', () => {
    const { rerender } = render(<LessonContent lesson={lesson} isEnrolled />);
    rerender(<LessonContent lesson={{ ...lesson, id: 'lesson-2' }} isEnrolled />);

    expect(mocks.mount).toHaveBeenCalledTimes(2);
    expect(mocks.unmount).toHaveBeenCalledTimes(1);
  });

  it('does not save enrollment progress or completion for visitors watching a demo', () => {
    render(
      <MemoryRouter initialEntries={['/learn/course-1']}>
        <Routes>
          <Route path="/learn/:id" element={<CourseLearning />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report playback' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish playback' }));

    expect(mocks.updateProgress).not.toHaveBeenCalled();
    expect(mocks.completeLesson).not.toHaveBeenCalled();
  });

  it('saves completion once and never clears it through playback heartbeats', async () => {
    mocks.state.courses.currentCourseIsEnrolled = true;
    render(
      <MemoryRouter initialEntries={['/learn/course-1']}>
        <Routes>
          <Route path="/learn/:id" element={<CourseLearning />} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish playback' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Report playback' }));

    expect(mocks.completeLesson).toHaveBeenCalledExactlyOnceWith({
      courseId: 'course-1',
      lessonId: 'lesson-1',
      sectionId: 'section-1',
      completed: true,
    });
    expect(mocks.updateProgress).not.toHaveBeenCalled();
  });
});
