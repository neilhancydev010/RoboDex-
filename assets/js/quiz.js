/* ==========================================================================
   RoboDex́ — Module Quiz Engine
   Configurable passing threshold (default 70%), automatic scoring, retake,
   explanations, and immediate IndexedDB persistence.
   ========================================================================== */

window.RoboDexQuiz = (function () {
  function renderQuiz(container, quizData, context) {
    const { profileId, moduleId, priorAttempt, onQuizComplete } = context;
    const passScore = Number(window.RoboDexPrefs.get('quizPassScore')) || 70;

    if (!quizData || !quizData.questions || !quizData.questions.length) {
      container.innerHTML = `<div class="callout callout-warning">Quiz questions for this module could not be loaded.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="lesson-article">
        <div class="flex flex-wrap items-center justify-between gap-sm mb-md">
          <div>
            <span class="badge badge-cyan">Module Assessment</span>
            <h1 class="mt-sm">${window.RoboDexApp.escapeHtml(quizData.title)}</h1>
            <p>${window.RoboDexApp.escapeHtml(quizData.description)}</p>
          </div>
          <div class="stat-card" style="min-width:190px;">
            <div class="stat-label">Passing Score</div>
            <div class="stat-value">${passScore}%</div>
            ${priorAttempt ? `<div class="text-xs text-muted mt-sm">Best saved score: <strong>${priorAttempt.bestScore}%</strong> (${priorAttempt.passed ? 'Passed' : 'Not passed yet'})</div>` : '<div class="text-xs text-muted mt-sm">No attempts saved yet</div>'}
          </div>
        </div>

        <form id="module-quiz-form">
          ${quizData.questions.map((q, idx) => `
            <div class="quiz-question" data-q-index="${idx}">
              <div class="flex items-center justify-between gap-sm mb-sm">
                <span class="badge badge-blue">Question ${idx + 1} of ${quizData.questions.length} · ${window.RoboDexApp.escapeHtml(q.category || 'Logic')}</span>
              </div>
              <h3 style="margin-bottom:0.55rem;">${window.RoboDexApp.escapeHtml(q.prompt)}</h3>
              ${q.code ? `
                <div class="code-block">
                  <div class="code-block-header"><span>Arduino C++</span></div>
                  <pre><code>${window.RoboDexApp.highlightCpp(q.code)}</code></pre>
                </div>
              ` : ''}
              <div class="exercise-options" role="radiogroup">
                ${q.options.map((opt, oIdx) => `
                  <label class="exercise-option">
                    <input type="radio" name="q_${idx}" value="${oIdx}">
                    <span>${window.RoboDexApp.escapeHtml(opt)}</span>
                  </label>
                `).join('')}
              </div>
              <div class="exercise-feedback" data-q-feedback></div>
            </div>
          `).join('')}

          <div class="flex flex-wrap gap-sm mt-md">
            <button type="submit" class="btn btn-primary btn-lg">Submit Quiz &amp; Score</button>
            <button type="button" id="retake-quiz-btn" class="btn btn-secondary btn-lg">Retake Quiz</button>
          </div>
        </form>

        <div id="quiz-summary" class="mt-lg"></div>
      </div>
    `;

    const form = container.querySelector('#module-quiz-form');
    const summaryEl = container.querySelector('#quiz-summary');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let correctCount = 0;
      let unanswered = 0;

      quizData.questions.forEach((q, idx) => {
        const chosen = form.querySelector(`input[name="q_${idx}"]:checked`);
        if (!chosen) unanswered++;
      });

      if (unanswered > 0) {
        summaryEl.innerHTML = `<div class="callout callout-warning">Please answer all ${quizData.questions.length} questions before submitting (${unanswered} remaining).</div>`;
        return;
      }

      quizData.questions.forEach((q, idx) => {
        const chosenVal = Number(form.querySelector(`input[name="q_${idx}"]:checked`).value);
        const isCorrect = chosenVal === q.correctIndex;
        if (isCorrect) correctCount++;
        const fb = form.querySelector(`[data-q-index="${idx}"] [data-q-feedback]`);
        fb.className = `exercise-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
        fb.innerHTML = `
          <strong>${isCorrect ? '✓ Correct' : `✗ Incorrect — Correct answer: ${window.RoboDexApp.escapeHtml(q.options[q.correctIndex])}`}</strong>
          <p style="margin:0.35rem 0 0;">${window.RoboDexApp.escapeHtml(q.explanation)}</p>
        `;
      });

      const scorePercent = Math.round((correctCount / quizData.questions.length) * 100);
      const passed = scorePercent >= passScore;

      if (profileId) {
        await window.RoboDexDB.saveQuizAttempt(profileId, {
          moduleId,
          scorePercent,
          correctCount,
          totalQuestions: quizData.questions.length,
          passed
        });
      }

      summaryEl.innerHTML = `
        <div class="callout ${passed ? 'callout-success' : 'callout-danger'}">
          <div class="callout-title">${passed ? '🎉 Module Quiz Passed!' : 'Keep Practicing — Score Below Passing Threshold'}</div>
          <p style="margin-bottom:0.4rem;">
            You scored <strong>${scorePercent}%</strong> (${correctCount} / ${quizData.questions.length} correct). Passing score is ${passScore}%.
          </p>
          <p class="text-sm text-muted" style="margin:0;">Your result has been saved immediately to your local profile in IndexedDB.</p>
        </div>
      `;

      window.RoboDexApp.showToast(`Quiz scored: ${scorePercent}% (${passed ? 'Passed' : 'Retry available'})`);
      if (typeof onQuizComplete === 'function') onQuizComplete();
    });

    container.querySelector('#retake-quiz-btn').addEventListener('click', () => {
      form.reset();
      form.querySelectorAll('[data-q-feedback]').forEach((fb) => {
        fb.className = 'exercise-feedback';
        fb.innerHTML = '';
      });
      summaryEl.innerHTML = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return { renderQuiz };
})();
