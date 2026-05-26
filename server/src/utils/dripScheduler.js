import { dripQueue } from '../queues/index.js';

/**
 * Schedule drip unlock jobs for all lessons with dripDays > 0.
 * Called once at enrollment time.
 */
export async function scheduleDripContent({ enrollment, course, tenantId }) {
  if (!course.sections?.length) return;

  const jobs = [];
  for (const section of course.sections) {
    for (const lesson of section.lessons) {
      if (!lesson.dripDays || lesson.dripDays <= 0) continue;
      const delayMs = lesson.dripDays * 24 * 60 * 60 * 1000;

      jobs.push(
        dripQueue.add(
          'unlock',
          {
            enrollmentId: enrollment._id.toString(),
            lessonId: lesson._id.toString(),
            sectionId: section._id.toString(),
            lessonTitle: lesson.title,
            courseTitle: course.title,
            tenantId,
          },
          {
            delay: delayMs,
            jobId: `drip_${enrollment._id}_${lesson._id}`,
            removeOnComplete: true,
          }
        )
      );
    }
  }

  await Promise.all(jobs);
}
