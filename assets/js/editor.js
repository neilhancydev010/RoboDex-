/* ==========================================================================
   RoboDex́ — Try It Yourself Arduino C++ Editor
   Uses Ace Editor (loaded dynamically if online) with an instant offline-safe
   syntax-highlighted fallback editor. Never fabricates compilation results.
   ========================================================================== */

window.RoboDexEditor = (function () {
  let aceLoadAttempted = false;
  let aceReadyPromise = null;

  function ensureAceLoaded() {
    if (window.ace) return Promise.resolve(true);
    if (aceLoadAttempted) return aceReadyPromise;
    aceLoadAttempted = true;
    aceReadyPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/ace.min.js';
      script.async = true;
      script.onload = () => resolve(Boolean(window.ace));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
      setTimeout(() => resolve(Boolean(window.ace)), 2500);
    });
    return aceReadyPromise;
  }

  function mount(container, config) {
    const {
      title = 'sketch_example.ino',
      starterCode = '',
      expectedBehavior = '',
      challengePrompt = ''
    } = config;

    const safeTitle = window.RoboDexApp.escapeHtml(title);
    const uid = 'ed_' + Math.random().toString(36).slice(2, 9);

    container.innerHTML = `
      <div class="try-editor" id="${uid}">
        <div class="try-editor-toolbar">
          <span class="try-editor-title">⚡ ${safeTitle}</span>
          <div class="try-editor-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-action="copy">Copy Code</button>
            <button type="button" class="btn btn-secondary btn-sm" data-action="reset">Reset</button>
            <button type="button" class="btn btn-accent btn-sm" data-action="download">Download .ino</button>
          </div>
        </div>
        ${challengePrompt ? `
          <div style="padding:0.72rem 1rem; background:var(--code-surface); color:var(--code-text); border-bottom:1px solid var(--code-border); font-size:0.86rem;">
            <strong style="color:var(--bloom-300);">Practice Task:</strong> ${window.RoboDexApp.escapeHtml(challengePrompt)}
          </div>
        ` : ''}
        <div class="try-editor-stage" data-stage></div>
        <div class="try-editor-behavior">
          <div><strong>Expected Hardware Behavior:</strong> ${window.RoboDexApp.escapeHtml(expectedBehavior)}</div>
          <div class="try-editor-notice">
            <strong>Important:</strong> This browser editor is for reading, editing, and exporting Arduino C++ sketches — it is <em>not</em> an Arduino compiler or hardware simulator. To compile and upload to a physical board, click <strong>Download .ino</strong> and open it in the official <strong>Arduino IDE</strong>.
          </div>
        </div>
      </div>
    `;

    const stage = container.querySelector('[data-stage]');
    let getCode = () => starterCode;
    let setCode = () => {};

    // Render offline-safe syntax-highlighted editor immediately
    function renderFallback(initialText) {
      stage.innerHTML = `
        <div class="fallback-editor-wrap">
          <pre class="fallback-highlight" aria-hidden="true"></pre>
          <textarea class="fallback-textarea" spellcheck="false" aria-label="Arduino C++ code editor"></textarea>
        </div>
      `;
      const pre = stage.querySelector('.fallback-highlight');
      const ta = stage.querySelector('.fallback-textarea');
      const sync = () => {
        pre.innerHTML = window.RoboDexApp.highlightCpp(ta.value) + '\n';
        pre.scrollTop = ta.scrollTop;
        pre.scrollLeft = ta.scrollLeft;
      };
      ta.value = initialText;
      sync();
      ta.addEventListener('input', sync);
      ta.addEventListener('scroll', () => {
        pre.scrollTop = ta.scrollTop;
        pre.scrollLeft = ta.scrollLeft;
      });
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(end);
          ta.selectionStart = ta.selectionEnd = start + 2;
          sync();
        }
      });
      getCode = () => ta.value;
      setCode = (val) => {
        ta.value = val;
        sync();
      };
    }

    renderFallback(starterCode);

    // Upgrade smoothly to Ace Editor if CDN is reachable
    ensureAceLoaded().then((ok) => {
      if (!ok || !window.ace || !document.body.contains(stage)) return;
      const currentValue = getCode();
      stage.innerHTML = `<div class="ace-host" id="${uid}_ace"></div>`;
      const aceEd = window.ace.edit(`${uid}_ace`);
      aceEd.setTheme('ace/theme/tomorrow_night');
      aceEd.session.setMode('ace/mode/c_cpp');
      aceEd.setOptions({
        fontSize: '14px',
        showPrintMargin: false,
        tabSize: 2,
        useSoftTabs: true,
        wrap: false
      });
      aceEd.setValue(currentValue, -1);
      getCode = () => aceEd.getValue();
      setCode = (val) => aceEd.setValue(val, -1);
    });

    container.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      const text = getCode();
      try {
        await navigator.clipboard.writeText(text);
        window.RoboDexApp.showToast('Sketch copied to clipboard.');
      } catch {
        const tmp = document.createElement('textarea');
        tmp.value = text;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
        window.RoboDexApp.showToast('Sketch copied to clipboard.');
      }
    });

    container.querySelector('[data-action="reset"]').addEventListener('click', () => {
      setCode(starterCode);
      window.RoboDexApp.showToast('Code reset to original lesson example.');
    });

    container.querySelector('[data-action="download"]').addEventListener('click', () => {
      const fname = title.endsWith('.ino') ? title : `${title}.ino`;
      window.RoboDexApp.downloadFile(fname, getCode(), 'text/plain;charset=utf-8');
      window.RoboDexApp.showToast(`Downloaded ${fname} for Arduino IDE.`);
    });
  }

  return { mount };
})();
