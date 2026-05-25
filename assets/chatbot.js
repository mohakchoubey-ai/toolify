const SYSTEM_PROMPT = `You are MohakGPT — a smart, friendly AI assistant created by Mohak Choubey.

YOUR PRIMARY JOB is to answer ANY question the user asks — Maths, Science, History, Geography, Technology, Sports, Coding, General Knowledge, and more. ALWAYS answer the question directly first.

STRICT RULES:
- Keep ALL responses SHORT (max 3-4 lines or bullet points). No long essays.
- ALWAYS directly answer what the user asked. Never ignore the question.
- Be friendly, slightly fun. Use simple language.
- You can use Hinglish casually when appropriate.
- ONLY mention Toolify or Mohak if the user asks about them directly. Never bring them up randomly.
- Do NOT make up facts. If unsure, say "I'm not 100% sure, please verify this."

MOHAK'S WEBSITES (mention ONLY if asked):
- Toolify: https://mohakdev1220.github.io/toolify/ — futuristic workspace for digital creators. Tools: Calculator, Alarm, Weather, QR Maker, PDF Maker, Password Generator, Clock, Timer, Stopwatch, Calendar, Speech, Colors, Paragraph Editor, Activities Tracker
- Chrome Portal: https://mohakdev1220.github.io/chromeportal/
- Facts: https://mohakdev1220.github.io/facts/
- Gatividhiya: https://mohakdev1220.github.io/gatividhiya/ — activities tracker
- YouTube: https://www.youtube.com/@MOHAKCHOUBEY — IMPORTANT: You do NOT know what videos Mohak has made. Never suggest or assume any specific video. Just share the link.
- All by Mohak Choubey (@2026)`;

const SEARCH_SYSTEM = `You are a search decision engine. Given a user question, decide if it needs a live Google search.
Reply ONLY with JSON: {"search": true/false, "query": "search query or empty"}
Search needed for: current events, news, recent facts, prices, scores, live data, anything after 2024.
No search needed for: maths, basic science, coding help, general knowledge, Toolify website info.`;

const EXPIRY_MS = 15 * 24 * 60 * 60 * 1000;
let chats = [];
let activeChatId = null;
let loading = false;

// ===== INIT =====
window.onload = function() {
  loadTheme();
  initChats();
};

function initChats() {
  try {
    const raw = localStorage.getItem('mohakgpt_chats');
    if (raw) {
      chats = JSON.parse(raw);
      const now = Date.now();
      chats = chats.filter(c => now - c.created < EXPIRY_MS);
    }
  } catch(e) { chats = []; }

  const activeId = localStorage.getItem('mohakgpt_active');
  const found = chats.find(c => c.id === activeId);

  if (found) {
    activeChatId = found.id;
  } else if (chats.length > 0) {
    activeChatId = chats[0].id;
  } else {
    createNewChat();
    return;
  }

  saveChats();
  renderSidebar();
  renderChat(activeChatId);
}

function createNewChat() {
  const id = 'chat_' + Date.now();
  chats.unshift({ id, name: 'New Chat', created: Date.now(), messages: [] });
  activeChatId = id;
  saveChats();
  renderSidebar();
  renderChat(id);
  if (window.innerWidth < 768) closeSidebar();
}

function saveChats() {
  try {
    localStorage.setItem('mohakgpt_chats', JSON.stringify(chats));
    localStorage.setItem('mohakgpt_active', activeChatId);
  } catch(e) {}
}

function getActiveChat() {
  return chats.find(c => c.id === activeChatId);
}

// ===== RENDER =====
function renderChat(id) {
  const chat = chats.find(c => c.id === id);
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';

  if (!chat || chat.messages.length === 0) {
    appendWelcome();
    document.getElementById('suggestions').style.display = 'flex';
  } else {
    document.getElementById('suggestions').style.display = 'none';
    chat.messages.forEach((m, i) => appendMsgUI(m.role === 'user' ? 'user' : 'bot', m.content, i));
  }
  msgs.scrollTop = msgs.scrollHeight;
}

function renderSidebar() {
  const list = document.getElementById('chatList');
  if (chats.length === 0) {
    list.innerHTML = '<div class="chat-list-empty">No chats yet</div>';
    return;
  }
  list.innerHTML = '';
  chats.forEach(chat => {
    const div = document.createElement('div');
    div.className = 'chat-item' + (chat.id === activeChatId ? ' active' : '');
    div.innerHTML = `
      <span class="chat-item-name" onclick="switchChat('${chat.id}')">${escHtml(chat.name)}</span>
      <div class="chat-item-actions">
        <button title="Rename" onclick="renameChat('${chat.id}')">✏️</button>
        <button title="Delete" onclick="deleteChat('${chat.id}')">🗑️</button>
      </div>`;
    list.appendChild(div);
  });
}

function switchChat(id) {
  activeChatId = id;
  saveChats();
  renderSidebar();
  renderChat(id);
  if (window.innerWidth < 768) closeSidebar();
}

function deleteChat(id) {
  if (!confirm('Delete this chat?')) return;
  chats = chats.filter(c => c.id !== id);
  if (activeChatId === id) {
    if (chats.length > 0) activeChatId = chats[0].id;
    else { createNewChat(); return; }
  }
  saveChats();
  renderSidebar();
  renderChat(activeChatId);
}

function renameChat(id) {
  const chat = chats.find(c => c.id === id);
  if (!chat) return;
  const name = prompt('Rename chat:', chat.name);
  if (name && name.trim()) {
    chat.name = name.trim();
    saveChats();
    renderSidebar();
  }
}

// ===== MESSAGING =====
async function sendMsg(text) {
  const box = document.getElementById('inputBox');
  const msg = (text || box.value).trim();
  if (!msg || loading) return;

  const chat = getActiveChat();
  if (!chat) return;

  document.getElementById('suggestions').style.display = 'none';

  if (chat.messages.length === 0) {
    chat.name = msg.length > 32 ? msg.substring(0, 32) + '…' : msg;
    renderSidebar();
  }

  const idx = chat.messages.length;
  chat.messages.push({ role: 'user', content: msg, ts: Date.now() });
  saveChats();
  appendMsgUI('user', msg, idx);
  box.value = '';
  box.style.height = 'auto';

  loading = true;
  document.getElementById('sendBtn').disabled = true;
  const typingEl = showTyping();

  try {
    // Step 1: Decide if search is needed
    let searchContext = '';
    const decisionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SEARCH_SYSTEM },
          { role: 'user', content: msg }
        ],
        max_tokens: 60
      })
    });
    const decisionData = await decisionRes.json();
    const decisionText = decisionData.choices?.[0]?.message?.content || '{"search":false}';

    let decision = { search: false, query: '' };
    try { decision = JSON.parse(decisionText.replace(/```json|```/g, '').trim()); } catch(e) {}

    // Step 2: If search needed, fetch from SerpAPI
    if (decision.search && decision.query) {
      const serpRes = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(decision.query)}&api_key=${SERP_KEY}&num=3&hl=en`
      );
      const serpData = await serpRes.json();
      const results = serpData.organic_results?.slice(0, 3)
        .map(r => `${r.title}: ${r.snippet}`)
        .join('\n') || '';
      if (results) searchContext = `\n\nWeb search results for "${decision.query}":\n${results}\n\nUse these results to answer accurately.`;
    }

    // Step 3: Final answer with Groq
    const history = chat.messages.map(m => ({ role: m.role, content: m.content }));
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + searchContext },
          ...history
        ],
        max_tokens: 400
      })
    });
    const data = await res.json();
    typingEl.remove();

    const reply = data.error
      ? `⚠️ Error: ${data.error.message}`
      : (data.choices?.[0]?.message?.content || 'Kuch gadbad ho gayi! Phir try kar. 😅');

    chat.messages.push({ role: 'assistant', content: reply, ts: Date.now() });
    saveChats();
    appendMsgUI('bot', reply, chat.messages.length - 1);

  } catch(e) {
    typingEl.remove();
    const err = 'Connection issue: ' + e.message;
    chat.messages.push({ role: 'assistant', content: err, ts: Date.now() });
    saveChats();
    appendMsgUI('bot', err, chat.messages.length - 1);
  }

  loading = false;
  document.getElementById('sendBtn').disabled = false;
}

function appendWelcome() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg-wrapper bot';
  div.innerHTML = `
    <div class="avatar">⚡</div>
    <div class="bubble-wrap">
      <div class="bubble bot">Namaste! 🙏 Main hoon <strong>MohakGPT</strong> — tumhara smart AI dost!<br>Maths, Science ya kuch bhi pooch. Main hoon na! ⚡</div>
    </div>`;
  msgs.appendChild(div);
}

function appendMsgUI(type, text, index) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg-wrapper ${type}`;
  div.dataset.index = index;

  const html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  if (type === 'bot') {
    div.innerHTML = `
      <div class="avatar">⚡</div>
      <div class="bubble-wrap">
        <div class="bubble bot">${html}</div>
        <div class="msg-actions">
          <button onclick="copyMsg(this)">📋 Copy</button>
        </div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="bubble-wrap user">
        <div class="bubble user">${html}</div>
        <div class="msg-actions user">
          <button onclick="copyMsg(this)">📋 Copy</button>
          <button onclick="editMsg(this)">✏️ Edit</button>
        </div>
      </div>`;
  }

  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function copyMsg(btn) {
  const bubble = btn.closest('.bubble-wrap').querySelector('.bubble');
  navigator.clipboard.writeText(bubble.innerText).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function editMsg(btn) {
  const wrapper = btn.closest('.msg-wrapper');
  const index = parseInt(wrapper.dataset.index);
  const chat = getActiveChat();
  if (!chat) return;
  const text = chat.messages[index].content;
  chat.messages = chat.messages.slice(0, index);
  saveChats();
  renderChat(activeChatId);
  const box = document.getElementById('inputBox');
  box.value = text;
  box.style.height = 'auto';
  box.style.height = box.scrollHeight + 'px';
  box.focus();
}

function showTyping() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg-wrapper bot';
  div.innerHTML = `
    <div class="avatar">⚡</div>
    <div class="bubble-wrap">
      <div class="bubble bot">
        <div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      </div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ===== THEME =====
function setTheme(theme) {
  document.body.className = 'theme-' + theme;
  localStorage.setItem('mohakgpt_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
}

function loadTheme() {
  setTheme(localStorage.getItem('mohakgpt_theme') || 'light');
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ===== UTILS =====
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
