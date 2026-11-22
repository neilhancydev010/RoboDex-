/* ==========================================================================
   RoboDex́ — Interactive Exercise Engine (All 7 Exercise Types)
   Types: multiple-choice, fill-blank, select-code, predict-behavior,
          find-error, arrange-steps, write-code
   ========================================================================== */

window.RoboDexExercises = (function () {
  const TYPE_LABELS = {
    'multiple-choice': 'Multiple Choice',
    'fill-blank': 'Fill in the Blanks',
    'select-code': 'Select the Correct Code',
    'predict-behavior': 'Predict Program Behavior',
    'find-error': 'Identify Programming Error',
    'arrange-steps': 'Arrange Instructions',
    'write-code': 'Write a Short Solution'
  };

  function normalize(str) {
    return String(str ?? '').trim().replace(/\s+/g, ' ');
  }

  function renderExercises(container, exercises, context) {
    const { profileId, lessonId, moduleId, exerciseMap, onProgressChange } = context;
    if (!exercises || !exercises.length) {
      container.innerHTML = `<p class="text-muted">No exercises are attached to this lesson.</p>`;
      return;
    }

    container.innerHTML = '';

    exercises.forEach((ex, index) => {
      const prior = exerciseMap.get(ex.id);
      const card = document.createElement('div');
      card.className = `exercise-card${prior && prior.passed ? ' passed' : ''}`;
      card.dataset.exerciseId = ex.id;

      const typeLabel = TYPE_LABELS[ex.type] || 'Exercise';
      let bodyHtml = '';

      if (['multiple-choice', 'select-code', 'predict-behavior', 'find-error'].includes(ex.type)) {
        bodyHtml = `
          ${ex.codeSnippet ? `
            <div class="code-block">
              <div class="code-block-header"><span>Arduino C++ Snippet</span></div>
              <pre><code>${window.RoboDexApp.highlightCpp(ex.codeSnippet)}</code></pre>
            </div>
          ` : ''}
          <div class="exercise-options" role="radiogroup">
            ${ex.options.map((opt, idx) => `
              <label class="exercise-option">
                <input type="radio" name="ex_${ex.id}" value="${idx}">
                <span>${ex.type === 'select-code' ? `<code>${window.RoboDexApp.escapeHtml(opt)}</code>` : window.RoboDexApp.escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
      } else if (ex.type === 'fill-blank') {
        const renderedTemplate = window.RoboDexApp.escapeHtml(ex.template).replace(/___(\d+)___/g, (_, num) => {
          return `<input type="text" class="blank-input" data-blank="${num}" aria-label="Blank ${num}" autocomplete="off">`;
        });
        bodyHtml = `
          <div class="code-block">
            <div class="code-block-header"><span>Complete the missing code</span></div>
            <pre style="white-space:pre-wrap; line-height:2.1;">${renderedTemplate}</pre>
          </div>
        `;
      } else if (ex.type === 'arrange-steps') {
        const initialOrder = ex.shuffledSteps || ex.steps;
        bodyHtml = `
          <p class="text-sm text-muted">Use the Up / Down buttons to place the statements in the correct execution order.</p>
          <ul class="arrange-list" data-arrange-list>
            ${initialOrder.map((step, i) => `
              <li class="arrange-item" data-step-text="${window.RoboDexApp.escapeHtml(step)}">
                <span>${window.RoboDexApp.escapeHtml(step)}</span>
                <span class="flex gap-xs">
                  <button type="button" class="btn btn-secondary btn-sm" data-move="up" aria-label="Move step up">↑</button>
                  <button type="button" class="btn btn-secondary btn-sm" data-move="down" aria-label="Move step down">↓</button>
                </span>
              </li>
            `).join('')}
          </ul>
        `;
      } else if (ex.type === 'write-code') {
        bodyHtml = `
          <textarea class="form-textarea" rows="6" style="font-family:var(--font-mono); font-size:0.88rem;" data-code-answer placeholder="Write your C++ / Arduino solution here...">${window.RoboDexApp.escapeHtml(ex.starter || '')}</textarea>
          <p class="form-help">Your solution is checked against required C++ / Arduino tokens and syntax structure.</p>
        `;
      }

      card.innerHTML = `
        <div class="card-header">
          <div>
            <span class="badge badge-blue">Exercise ${index + 1} · ${typeLabel}</span>
            <h4 class="mt-sm" style="margin-bottom:0.25rem;">${window.RoboDexApp.escapeHtml(ex.prompt)}</h4>
          </div>
          <span class="badge ${prior && prior.passed ? 'badge-success' : ''}" data-status-badge>
            ${prior && prior.passed ? '✓ Passed' : 'Not Checked'}
          </span>
        </div>
        ${bodyHtml}
        <div class="flex flex-wrap gap-sm mt-sm">
          <button type="button" class="btn btn-primary btn-sm" data-action="submit">Submit &amp; Check Answer</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="retry">Try Again</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="show-answer">Show Answer</button>
        </div>
        <div class="exercise-feedback" data-feedback></div>
      `;

      // Arrange steps button handlers
      if (ex.type === 'arrange-steps') {
        const list = card.querySelector('[data-arrange-list]');
        list.addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-move]');
          if (!btn) return;
          const li = btn.closest('li');
          if (btn.dataset.move === 'up' && li.previousElementSibling) {
            list.insertBefore(li, li.previousElementSibling);
          } else if (btn.dataset.move === 'down' && li.nextElementSibling) {
            list.insertBefore(li.nextElementSibling, li);
          }
        });
      }

      const feedbackEl = card.querySelector('[data-feedback]');
      const statusBadge = card.querySelector('[data-status-badge]');

      function evaluate() {
        if (['multiple-choice', 'select-code', 'predict-behavior', 'find-error'].includes(ex.type)) {
          const checked = card.querySelector(`input[name="ex_${ex.id}"]:checked`);
          if (!checked) return { answered: false };
          const val = Number(checked.value);
          return { answered: true, passed: val === ex.correctIndex, userAnswer: val };
        }
        if (ex.type === 'fill-blank') {
          const inputs = Array.from(card.querySelectorAll('.blank-input'));
          const values = inputs.map((inp) => inp.value.trim());
          if (values.some((v) => !v)) return { answered: false };
          const passed = ex.answers.every((expected, idx) => {
            const actual = values[idx];
            if (Array.isArray(expected)) {
              return expected.some((opt) => opt.toLowerCase() === actual.toLowerCase());
            }
            return String(expected).toLowerCase() === actual.toLowerCase();
          });
          return { answered: true, passed, userAnswer: values };
        }
        if (ex.type === 'arrange-steps') {
          const items = Array.from(card.querySelectorAll('[data-arrange-list] li')).map((li) => li.dataset.stepText);
          const passed = ex.correctOrder.every((step, i) => items[i] === step);
          return { answered: true, passed, userAnswer: items };
        }
        if (ex.type === 'write-code') {
          const raw = card.querySelector('[data-code-answer]').value;
          if (!raw.trim()) return { answered: false };
          const norm = normalize(raw);
          const required = ex.requiredTokens || [];
          const passed = required.every((tok) => {
            if (tok.startsWith('regex:')) {
              return new RegExp(tok.slice(6), 'i').test(raw);
            }
            return norm.includes(tok);
          });
          return { answered: true, passed, userAnswer: raw };
        }
        return { answered: false };
      }

      card.querySelector('[data-action="submit"]').addEventListener('click', async () => {
        const res = evaluate();
        if (!res.answered) {
          feedbackEl.className = 'exercise-feedback show incorrect';
          feedbackEl.innerHTML = '<strong>Please enter or select an answer before checking.</strong>';
          return;
        }
        if (profileId) {
          const saved = await window.RoboDexDB.saveExerciseAttempt(profileId, {
            exerciseId: ex.id,
            lessonId,
            moduleId,
            passed: res.passed,
            lastAnswer: res.userAnswer
          });
          exerciseMap.set(ex.id, saved);
        }
        feedbackEl.className = `exercise-feedback show ${res.passed ? 'correct' : 'incorrect'}`;
        feedbackEl.innerHTML = `
          <strong>${res.passed ? '✓ Correct!' : '✗ Not quite yet.'}</strong>
          <p style="margin:0.35rem 0 0;">${window.RoboDexApp.escapeHtml(ex.explanation)}</p>
        `;
        if (res.passed) {
          card.classList.add('passed');
          statusBadge.className = 'badge badge-success';
          statusBadge.textContent = '✓ Passed';
        } else {
          statusBadge.className = 'badge badge-warning';
          statusBadge.textContent = 'Try Again';
        }
        if (typeof onProgressChange === 'function') onProgressChange();
      });

      card.querySelector('[data-action="retry"]').addEventListener('click', () => {
        card.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
        card.querySelectorAll('.blank-input').forEach((inp) => (inp.value = ''));
        const ta = card.querySelector('[data-code-answer]');
        if (ta) ta.value = ex.starter || '';
        feedbackEl.className = 'exercise-feedback';
        feedbackEl.innerHTML = '';
      });

      card.querySelector('[data-action="show-answer"]').addEventListener('click', () => {
        let answerText = '';
        if (['multiple-choice', 'select-code', 'predict-behavior', 'find-error'].includes(ex.type)) {
          answerText = ex.options[ex.correctIndex];
        } else if (ex.type === 'fill-blank') {
          answerText = ex.answers.map((a, i) => `Blank ${i + 1}: ${Array.isArray(a) ? a[0] : a}`).join(' | ');
        } else if (ex.type === 'arrange-steps') {
          answerText = ex.correctOrder.join('\n');
        } else if (ex.type === 'write-code') {
          answerText = ex.sampleSolution || '';
        }
        feedbackEl.className = 'exercise-feedback show correct';
        feedbackEl.innerHTML = `
          <strong>Reference Answer:</strong>
          <pre style="margin:0.45rem 0; padding:0.65rem; background:var(--code-bg); color:var(--code-text); border-radius:6px;"><code>${window.RoboDexApp.escapeHtml(answerText)}</code></pre>
          <p style="margin:0.35rem 0 0;"><strong>Why:</strong> ${window.RoboDexApp.escapeHtml(ex.explanation)}</p>
        `;
      });

      container.appendChild(card);
    });
  }

  return { renderExercises };
})();
