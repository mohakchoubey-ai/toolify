

    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');
    const progressBar = document.getElementById('progressBar');
    const clearBtn = document.getElementById('clearBtn');
    const playBtn = document.getElementById('playBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    const voiceStatus = document.getElementById('voiceStatus');
    const statusEl = document.getElementById('status');

    const MAX_CHARS = 1000;

    let allVoices = [];
    let isSpeaking = false;

    function setStatus(message, tone = 'normal') {
      statusEl.textContent = message;
      statusEl.className = 'text-sm ' + (
        tone === 'error' ? 'text-red-300' :
        tone === 'success' ? 'text-emerald-300' :
        tone === 'warn' ? 'text-amber-300' :
        'text-slate-300'
      );
    }

    function updateUI() {
      const value = textInput.value.slice(0, MAX_CHARS);
      if (textInput.value !== value) textInput.value = value;

      const len = value.length;
      charCount.textContent = len;
      progressBar.style.width = `${(len / MAX_CHARS) * 100}%`;

      // Clear button appears only when there is content.
      clearBtn.classList.toggle('hidden', len === 0);
    }

    function normalize(v) {
      return String(v || '').trim().toLowerCase();
    }

    function isHindiVoice(voice) {
      const lang = normalize(voice.lang);
      return lang === 'hi-in' || lang.startsWith('hi-');
    }

    function isEnglishVoice(voice) {
      const lang = normalize(voice.lang);
      return lang === 'en-us' || lang === 'en-gb' || lang.startsWith('en-');
    }

    function genderMatches(voice, wantFemale) {
      const name = normalize(voice.name);

      const femaleHints = [
        'female', 'woman', 'girl', 'zira', 'susan', 'samantha', 'karen',
        'tessa', 'linda', 'rani', 'neural2-f', 'wavenet-f'
      ];

      const maleHints = [
        'male', 'man', 'boy', 'david', 'daniel', 'james', 'alex',
        'mark', 'michael', 'liam', 'ravi', 'neural2-m', 'wavenet-m'
      ];

      const hints = wantFemale ? femaleHints : maleHints;
      return hints.some(h => name.includes(h));
    }

    // Strict voice mapping:
    // 1) Filter by language first.
    // 2) Then try to match gender-ish voice names.
    // 3) If that fails, fall back to the first available voice of the SAME language.
    // 4) Never jump from Hindi to English or vice versa.
    function getStrictVoice(option) {
      const wantHindi = option.startsWith('hi');
      const wantEnglish = option.startsWith('en');
      const wantFemale = option.endsWith('female');

      const languageFiltered = allVoices.filter(v => {
        if (wantHindi) return isHindiVoice(v);
        if (wantEnglish) return isEnglishVoice(v);
        return false;
      });

      if (!languageFiltered.length) {
        return null;
      }

      const genderMatched = languageFiltered.find(v => genderMatches(v, wantFemale));
      if (genderMatched) return genderMatched;

      return languageFiltered[0];
    }

    function refreshVoiceHint() {
      if (!('speechSynthesis' in window)) {
        voiceStatus.textContent = 'Speech synthesis is not supported in this browser.';
        setStatus('This browser does not support speech synthesis.', 'error');
        playBtn.disabled = true;
        playBtn.classList.add('opacity-60', 'cursor-not-allowed');
        return;
      }

      allVoices = speechSynthesis.getVoices() || [];

      const selected = getStrictVoice(voiceSelect.value);
      if (selected) {
        voiceStatus.textContent = `Mapped voice: ${selected.name} • ${selected.lang}`;
        setStatus('Voice mapping is ready.', 'success');
      } else {
        const langLabel = voiceSelect.value.startsWith('hi') ? 'Hindi' : 'English';
        voiceStatus.textContent = `${langLabel} voice not found on this device.`;
        setStatus(`No ${langLabel} voice was found. Install or enable a ${langLabel} voice in your system/browser.`, 'warn');
      }
    }

    function stopSpeech() {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      isSpeaking = false;
      playBtn.classList.remove('speaking');
      playBtn.disabled = false;
    }

    function buildUtterance(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      const selected = getStrictVoice(voiceSelect.value);

      // Force language from selection. This is the part that prevents the English fallback bug.
      if (voiceSelect.value.startsWith('hi')) {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }

      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang || utterance.lang;
      }

      // Small tuning for cleaner playback.
      if (voiceSelect.value.endsWith('female')) {
        utterance.pitch = 1.08;
        utterance.rate = 1.0;
      } else {
        utterance.pitch = 0.98;
        utterance.rate = 0.98;
      }

      utterance.volume = 1;
      return utterance;
    }

    function speakText() {
      if (!('speechSynthesis' in window)) {
        setStatus('Speech synthesis is not supported in this browser.', 'error');
        return;
      }

      const text = textInput.value.trim();
      if (!text) {
        setStatus('Type some text first.', 'warn');
        return;
      }

      const selectedVoice = getStrictVoice(voiceSelect.value);
      if (!selectedVoice) {
        const langLabel = voiceSelect.value.startsWith('hi') ? 'Hindi' : 'English';
        setStatus(`No ${langLabel} voice found. Try enabling more system voices.`, 'error');
        return;
      }

      stopSpeech();
      isSpeaking = true;
      playBtn.disabled = true;
      playBtn.classList.add('speaking');
      setStatus('Speaking...', 'success');

      const utterance = buildUtterance(text);

      utterance.onend = () => {
        isSpeaking = false;
        playBtn.classList.remove('speaking');
        playBtn.disabled = false;
        setStatus('Playback finished.', 'success');
      };

      utterance.onerror = (e) => {
        isSpeaking = false;
        playBtn.classList.remove('speaking');
        playBtn.disabled = false;
        setStatus(`Playback error: ${e.error || 'unknown error'}`, 'error');
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }

    textInput.addEventListener('input', updateUI);

    clearBtn.addEventListener('click', () => {
      textInput.value = '';
      updateUI();
      textInput.focus();
      setStatus('Text cleared.', 'success');
    });

    playBtn.addEventListener('click', speakText);
    voiceSelect.addEventListener('change', () => {
      refreshVoiceHint();
      if (isSpeaking) {
        stopSpeech();
      }
    });

    if ('speechSynthesis' in window) {
      refreshVoiceHint();
      speechSynthesis.onvoiceschanged = refreshVoiceHint;
    }

    updateUI();

    // Starter text
    textInput.value = 'Hello! Select a voice and press play.';
    updateUI();
    refreshVoiceHint();

    window.addEventListener('beforeunload', () => {
      try { speechSynthesis.cancel(); } catch {}
    });
  
