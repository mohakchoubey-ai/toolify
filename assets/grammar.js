
    const textInput = document.getElementById('textInput');
    const wordCountEl = document.getElementById('wordCount');
    const charWithSpacesEl = document.getElementById('charWithSpaces');
    const charWithoutSpacesEl = document.getElementById('charWithoutSpaces');
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    const toast = document.getElementById('toast');
    const themeToggle = document.getElementById('themeToggle');

    const saveHistoryBtn = document.getElementById('saveHistoryBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fillSampleBtn = document.getElementById('fillSampleBtn');

    const STORAGE_KEYS = {
      history: 'textUtilityHistory_v1',
      theme: 'textUtilityTheme_v1'
    };

    let history = loadHistory();

    function loadHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.history);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.error('Failed to load history:', err);
        return [];
      }
    }

    function saveHistory() {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
    }

    function setTheme(theme) {
      const dark = theme === 'dark';
      document.body.classList.toggle('dark', dark);
      themeToggle.textContent = dark ? '☀ Light Mode' : '🌙 Dark Mode';
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    }

    function getTheme() {
      return localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    }

    function formatTimestamp(ms) {
      const d = new Date(ms);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function cleanText(text) {
      return text.replace(/\s+/g, ' ').trim();
    }

    function countWords(text) {
      const trimmed = text.trim();
      if (!trimmed) return 0;
      return trimmed.split(/\s+/).filter(Boolean).length;
    }

    function updateStats() {
      const text = textInput.value;
      wordCountEl.textContent = countWords(text);
      charWithSpacesEl.textContent = text.length;
      charWithoutSpacesEl.textContent = text.replace(/\s/g, '').length;
    }

    function showToast(message = 'Copied!') {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(() => toast.classList.remove('show'), 1200);
    }

    function transformText(type) {
      let text = textInput.value;

      if (!text.trim()) return;

      switch (type) {
        case 'uppercase':
          textInput.value = text.toUpperCase();
          break;

        case 'lowercase':
          textInput.value = text.toLowerCase();
          break;

        case 'capitalized':
          textInput.value = text
            .toLowerCase()
            .replace(/\b\w/g, ch => ch.toUpperCase());
          break;

        case 'sentence':
          textInput.value = text
            .toLowerCase()
            .replace(/(^\s*\w|[.!?]\s*\w)/g, match => match.toUpperCase());
          break;
      }

      updateStats();
      textInput.focus();
      textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }

    function renderHistory() {
      historyCount.textContent = `${history.length} saved`;
      historyList.innerHTML = '';

      if (!history.length) {
        historyList.innerHTML = `
          <div class="empty-state">
            No saved snippets yet. Add text and press “Save to History”.
          </div>
        `;
        return;
      }

      history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-item';
        card.innerHTML = `
          <div class="history-meta">
            <strong>Saved Snippet</strong>
            <span class="history-time">${formatTimestamp(item.timestamp)}</span>
          </div>
          <div class="history-snippet">${escapeHtml(snippet(item.text))}</div>
          <div class="history-actions">
            <button class="mini-btn edit" type="button" data-edit="${item.id}">Edit</button>
            <button class="mini-btn copy" type="button" data-copy="${item.id}">Copy</button>
            <button class="mini-btn delete" type="button" data-delete="${item.id}">Delete</button>
          </div>
        `;
        historyList.appendChild(card);
      });
    }

    function snippet(text) {
      const compact = cleanText(text);
      if (compact.length <= 120) return compact;
      return compact.slice(0, 120) + '…';
    }

    function escapeHtml(str) {
      return str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function saveCurrentTextToHistory() {
      const text = textInput.value.trim();
      if (!text) {
        showToast('Nothing to save');
        return;
      }

      const item = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        text: textInput.value,
        timestamp: Date.now()
      };

      history.unshift(item);
      if (history.length > 50) history = history.slice(0, 50);

      saveHistory();
      renderHistory();
      showToast('Saved to history');
    }

    async function copyText(text) {
      const value = text ?? textInput.value;

      if (!value.trim()) {
        showToast('Nothing to copy');
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        showToast('Copied!');
      } catch (err) {
        const temp = document.createElement('textarea');
        temp.value = value;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
        showToast('Copied!');
      }
    }

    function clearAll() {
      textInput.value = '';
      updateStats();
      textInput.focus();
      showToast('Cleared');
    }

    function loadSampleText() {
      textInput.value = 'Text Utility & Analyzer helps you transform, measure, and manage your writing quickly.';
      updateStats();
      showToast('Sample loaded');
    }

    function editHistoryItem(id) {
      const item = history.find(h => h.id === id);
      if (!item) return;
      textInput.value = item.text;
      updateStats();
      textInput.focus();
      showToast('Loaded into editor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteHistoryItem(id) {
      history = history.filter(h => h.id !== id);
      saveHistory();
      renderHistory();
      showToast('Deleted');
    }

    textInput.addEventListener('input', updateStats);

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => transformText(btn.dataset.action));
    });

    saveHistoryBtn.addEventListener('click', saveCurrentTextToHistory);
    copyBtn.addEventListener('click', () => copyText(textInput.value));
    clearBtn.addEventListener('click', clearAll);
    fillSampleBtn.addEventListener('click', loadSampleText);

    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
      setTheme(nextTheme);
    });

    historyList.addEventListener('click', async (e) => {
      const editId = e.target.getAttribute('data-edit');
      const deleteId = e.target.getAttribute('data-delete');
      const copyId = e.target.getAttribute('data-copy');

      if (editId) editHistoryItem(editId);
      if (deleteId) deleteHistoryItem(deleteId);
      if (copyId) {
        const item = history.find(h => h.id === copyId);
        if (item) await copyText(item.text);
      }
    });

    // Initial boot
    setTheme(getTheme());
    renderHistory();
    updateStats();
  
