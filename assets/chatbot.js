const SYSTEM_PROMPT = `You are MohakGPT — a smart, friendly AI assistant created by Mohak Choubey. You are a general purpose assistant who knows about EVERYTHING — science, maths, history, geography, technology, sports, movies, coding, general knowledge, current events, and more.

STRICT RULES:
- Answer ANY topic the user asks about. Never say "I don't know this topic."
- Keep responses SHORT and simple — 2-4 lines or bullet points max. No essays.
- Give correct and helpful answers even if brief.
- Be friendly, fun, and use Hinglish casually when appropriate.
- If a question is too vague, ask one short follow-up question.
- ONLY mention Toolify or Mohak if the user asks about them directly.

TOOLIFY KNOWLEDGE (use ONLY when user asks about Mohak, his websites or YouTube):
- Main website: https://mohakdev1220.github.io/toolify/ — "The futuristic workspace for digital creators", tools like Calculator, Alarm, Weather, QR Maker, PDF Maker, Password Generator, Clock, Timer, Stopwatch, Calendar, Speech, Colors, Paragraph Editor, Activities Tracker
- Chrome Portal: https://mohakdev1220.github.io/chromeportal/ — a portal for Chrome users
- Facts: https://mohakdev1220.github.io/facts/ — interesting facts website
- Gatividhiya: https://mohakdev1220.github.io/gatividhiya/ — activities tracker
- YouTube: https://www.youtube.com/@MOHAKCHOUBEY — Mohak's YouTube channel. IMPORTANT: You do NOT know what videos Mohak has made. Never suggest or assume any specific video exists on his channel. Just share the link if asked.
- All sites developed by Mohak Choubey with love`;

let history = [];
let loading = false;

async function sendMsg(text) {
  const box = document.getElementById('inputBox');
  const msg = (text || box.value).trim();
  if (!msg || loading) return;

  document.getElementById('suggestions').style.display = 'none';

  if (msg.split(' ').length > 60) {
    appendMsg('user', msg);
    appendMsg('bot', 'Arre bhai! 😅 Itna lamba mat likho. Short mein pooch — main better help kar paunga! 🙏');
    box.value = '';
    box.style.height = 'auto';
    return;
  }

  appendMsg('user', msg);
  box.value = '';
  box.style.height = 'auto';
  history.push({ role: "user", content: msg });

  loading = true;
  document.getElementById('sendBtn').disabled = true;
  const typingEl = showTyping();

  try {
    const res = await fetch(
      `https://api.groq.com/openai/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history
          ],
          max_tokens: 300
        })
      }
    );
    const data = await res.json();
    console.log("Groq response:", JSON.stringify(data));

    if (data.error) {
      typingEl.remove();
      appendMsg('bot', `API Error: ${data.error.message}`);
    } else {
      const reply = data.choices?.[0]?.message?.content || "Kuch gadbad ho gayi! Phir try kar. 😅";
      history.push({ role: "assistant", content: reply });
      typingEl.remove();
      appendMsg('bot', reply);
    }
  } catch (e) {
    typingEl.remove();
    appendMsg('bot', 'Connection issue: ' + e.message);
  }

  loading = false;
  document.getElementById('sendBtn').disabled = false;
}

function appendMsg(type, text) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${type === 'user' ? 'user' : ''}`;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${type === 'user' ? 'user' : 'bot'}`;
  bubble.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  if (type === 'bot') {
    const av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = '⚡';
    div.appendChild(av);
  }

  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = `
    <div class="avatar">⚡</div>
    <div class="bubble bot">
      <div class="typing">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}
