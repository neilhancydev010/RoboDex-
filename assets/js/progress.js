/* ==========================================================================
   RoboDex́ — Progress Engine, Weighted Scoring & Multi-Track Readiness
   Programming School weighting: 30% Lessons | 50% Exercises | 20% Quizzes
   Prepares Boards & Application-Based Learning hooks without fake values.
   ========================================================================== */

window.RoboDexProgress = (function () {
  const WEIGHTS = {
    lessons: 0.30,
    exercises: 0.50,
    quizzes: 0.20
  };

  function skillFromRatio(ratio, hasActivity) {
    if (!hasActivity || ratio <= 0) return { label: 'Not Started', cls: 'skill-not-started' };
    if (ratio < 0.30) return { label: 'Learning', cls: 'skill-learning' };
    if (ratio < 0.60) return { label: 'Practicing', cls: 'skill-practicing' };
    if (ratio < 0.85) return { label: 'Competent', cls: 'skill-competent' };
    return { label: 'Mastered', cls: 'skill-mastered' };
  }

  function overallLevel(percent) {
    if (percent === 0) return 'Not Started';
    if (percent < 20) return 'Beginner Foundations';
    if (percent < 45) return 'C++ Apprentice';
    if (percent < 70) return 'Arduino Builder';
    if (percent < 90) return 'Embedded Developer';
    return 'Independent Robotics Programmer';
  }

  function buildRecentActivity(snapshot, lessonLookup) {
    const events = [];

    (snapshot.activity || []).forEach((a) => {
      events.push({
        area: a.area || 'Programming School',
        action: a.action,
        label: a.label,
        targetUrl: a.targetUrl || '',
        timestamp: a.timestamp || 0
      });
    });

    // Backfill from V1 records if activityLog was empty (migrated V1 profile)
    if (events.length === 0) {
      (snapshot.lessons || []).forEach((l) => {
        if (l.checkpointCompleted) {
          events.push({
            area: 'Programming School',
            action: 'Completed lesson checkpoint',
            label: lessonLookup.get(l.lessonId) || l.lessonId,
            targetUrl: `./learn.html?lesson=${encodeURIComponent(l.lessonId)}`,
            timestamp: l.completedAt || l.lastVisitedAt || 0
          });
        }
      });
      (snapshot.quizzes || []).forEach((q) => {
        events.push({
          area: 'Programming School',
          action: q.passed ? `Passed module quiz (${q.bestScore}%)` : `Attempted module quiz (${q.bestScore}%)`,
          label: q.moduleId.toUpperCase(),
          targetUrl: `./learn.html?quiz=${encodeURIComponent(q.moduleId)}`,
          timestamp: q.updatedAt || 0
        });
      });
    }

    return events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 8);
  }

  function computeMetrics(curriculum, snapshot) {
    const lessonsList = [];
    const lessonLookup = new Map();
    curriculum.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        lessonsList.push({ ...l, moduleId: m.id });
        lessonLookup.set(l.id, l.title);
      });
    });

    const completedLessonSet = new Set(
      (snapshot.lessons || []).filter((r) => r.checkpointCompleted).map((r) => r.lessonId)
    );
    const visitedLessonSet = new Set(
      (snapshot.lessons || []).filter((r) => r.visited).map((r) => r.lessonId)
    );

    const exerciseMap = new Map((snapshot.exercises || []).map((r) => [r.exerciseId, r]));
    const quizMap = new Map((snapshot.quizzes || []).map((r) => [r.moduleId, r]));

    const totalLessons = lessonsList.length;
    const completedLessons = lessonsList.filter((l) => completedLessonSet.has(l.id)).length;

    const totalExercises = curriculum.modules.reduce((acc, m) => acc + (m.exerciseCount || 0), 0);
    const exercisesAttempted = (snapshot.exercises || []).length;
    const exercisesPassed = (snapshot.exercises || []).filter((e) => e.passed).length;

    const totalQuizzes = curriculum.modules.length;
    const quizzesPassed = curriculum.modules.filter((m) => {
      const q = quizMap.get(m.id);
      return q && q.passed;
    }).length;

    const lessonRatio = totalLessons ? completedLessons / totalLessons : 0;
    const exerciseRatio = totalExercises ? Math.min(1, exercisesPassed / totalExercises) : 0;
    const quizRatio = totalQuizzes ? quizzesPassed / totalQuizzes : 0;

    const programmingPercent = Math.round(
      (lessonRatio * WEIGHTS.lessons + exerciseRatio * WEIGHTS.exercises + quizRatio * WEIGHTS.quizzes) * 100
    );

    // Future-ready Boards & Application-Based Learning summaries (strictly from real records)
    const boardRecords = snapshot.boards || [];
    const boardsCompleted = boardRecords.filter((b) => b.completed).length;

    const projectRecords = snapshot.projects || [];
    const activeProjectsCount = projectRecords.filter((p) => (p.completedSteps || []).length > 0).length;

    const moduleStats = curriculum.modules.map((m) => {
      const mTotalLessons = m.lessons.length;
      const mDoneLessons = m.lessons.filter((l) => completedLessonSet.has(l.id)).length;
      const mExPassed = (snapshot.exercises || []).filter((e) => e.moduleId === m.id && e.passed).length;
      const mExAttempted = (snapshot.exercises || []).filter((e) => e.moduleId === m.id).length;
      const mExTotal = m.exerciseCount || 1;
      const mQuiz = quizMap.get(m.id) || null;
      const mQuizRatio = mQuiz && mQuiz.passed ? 1 : mQuiz ? (mQuiz.bestScore / 100) * 0.5 : 0;

      const scoreRatio =
        (mTotalLessons ? mDoneLessons / mTotalLessons : 0) * WEIGHTS.lessons +
        Math.min(1, mExPassed / mExTotal) * WEIGHTS.exercises +
        mQuizRatio * WEIGHTS.quizzes;

      const hasActivity =
        mDoneLessons > 0 ||
        mExAttempted > 0 ||
        Boolean(mQuiz) ||
        m.lessons.some((l) => visitedLessonSet.has(l.id));

      return {
        moduleId: m.id,
        shortTitle: m.shortTitle,
        title: m.title,
        track: m.track,
        description: m.description,
        skillName: m.skillName || m.title,
        totalLessons: mTotalLessons,
        completedLessons: mDoneLessons,
        exercisesPassed: mExPassed,
        exercisesTotal: mExTotal,
        quiz: mQuiz,
        percent: Math.round(scoreRatio * 100),
        skill: skillFromRatio(scoreRatio, hasActivity),
        completed: mDoneLessons === mTotalLessons && Boolean(mQuiz && mQuiz.passed)
      };
    });

    const nextLesson = lessonsList.find((l) => !completedLessonSet.has(l.id)) || lessonsList[lessonsList.length - 1];
    const recentActivity = buildRecentActivity(snapshot, lessonLookup);

    return {
      overallPercent: programmingPercent,
      programmingPercent,
      level: overallLevel(programmingPercent),
      totalLessons,
      completedLessons,
      totalExercises,
      exercisesAttempted,
      exercisesPassed,
      totalQuizzes,
      quizzesPassed,
      boardRecordsCount: boardRecords.length,
      boardsCompleted,
      projectRecords,
      activeProjectsCount,
      completedLessonSet,
      visitedLessonSet,
      exerciseMap,
      quizMap,
      moduleStats,
      nextLesson,
      recentActivity
    };
  }

  function isLessonUnlocked(curriculum, completedLessonSet, lessonId, lockProgression) {
    if (!lockProgression) return true;
    const flat = [];
    curriculum.modules.forEach((m) => m.lessons.forEach((l) => flat.push(l.id)));
    const idx = flat.indexOf(lessonId);
    if (idx <= 0) return true;
    return completedLessonSet.has(lessonId) || completedLessonSet.has(flat[idx - 1]);
  }

  return {
    WEIGHTS,
    computeMetrics,
    isLessonUnlocked,
    skillFromRatio,
    overallLevel
  };
})();
