const SYSTEM_PROMPT = `You are MohakGPT — a smart, friendly AI assistant created by Mohak Choubey. You help users with:
1. Basic and advanced Maths, Science, and general education topics
2. Everything about the website Toolify by Mohak

STRICT RULES:
- Keep ALL responses SHORT (max 3-4 lines or bullet points). No long paragraphs.
- If user asks something too broad, ask them to be more specific.
- Be friendly and slightly fun. Use simple language.
- Refuse long essay requests politely. Say "Short mein pooch bhai!" or similar.
- You can use Hinglish casually.

TOOLIFY WEBSITE KNOWLEDGE:
- Website: https://mohakdev1220.github.io/toolify/
- Tagline: "The futuristic workspace for digital creators"
- Developed by: Mohak Choubey (@2026) with love
- YouTube: https://www.youtube.com/@MOHAKCHOUBEY
- Tools: Activities Tracker, Alarm, Calculator, Paragraph Editor, Weather, QR Maker, Colors, Clock, Timer, Speech, Calendar, PDF Maker, Stopwatch, Password Generator
- Pages: Privacy Policy, Terms & Conditions, Feedback, Other Sites by Mohak`;

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
          model: "llama3-8b-8192",
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
    av.textContent = '🧠';
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
    <div class="avatar">🧠</div>
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
