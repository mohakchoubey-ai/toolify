/* ════════════════════════════════════════════════════════════════════════════
   TOOLIFY CHATBOT — Rules-Based Assistant JavaScript
   Knowledge Base • Pattern Matching • Chat Management
═════════════════════════════════════════════════════════════════════════════ */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KNOWLEDGE BASE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const KNOWLEDGE_BASE = {
  // GREETING & WELCOME
  greetings: {
    patterns: ['hello', 'hi', 'hey', 'greetings', 'hiya', 'what\'s up', 'howdy'],
    response: (userName) => `Hello${userName ? ', ' + userName : ''}! 👋 I'm the Toolify Assistant, your rules-based helper. How can I assist you today? Feel free to ask about our tools, features, or anything related to Toolify!`
  },

  // TOOLS & FEATURES
  tools: {
    patterns: ['tools', 'what tools', 'available tools', 'features', 'what can i do', 'capabilities', 'what\'s available'],
    response: `Toolify has 15+ powerful tools available:

📊 **Productivity:**
• Calculator - Advanced calculations
• Calendar - Schedule management
• Clock & Timer - Time management
• Stopwatch - Task timing
• Alarm - Set reminders

🎨 **Creative:**
• QR Maker - Generate QR codes
• Color Picker - Explore colors
• PDF Maker - Create PDFs
• Grammar Checker - Text correction
• Speech Text-to-Speech - Audio conversion

🌍 **Information:**
• Weather - Real-time weather data
• Activities Tracker - Track your activities (external)
• AI Chatbot - Advanced AI conversations
• Games - Fun gaming experiences

All tools are FREE and available 24/7. Login to access them!`
  },

  // ALARM FEATURE
  alarm: {
    patterns: ['alarm', 'how to use alarm', 'set alarm', 'alarm feature', 'wake up', 'reminder'],
    response: `🔔 **Using the Alarm Feature:**

1. **Access:** Go to Time → Alarm section
2. **Set Time:** Enter the time you want the alarm
3. **Label:** (Optional) Add a label for your alarm
4. **Confirm:** Click "Set Alarm"
5. **Alert:** The alarm will notify you at the set time with a sound

**Tips:**
• You can set multiple alarms
• Alarms work even if you close the tab (browser notifications enabled)
• Sound will play when the time is reached
• Perfect for reminders, wake-up calls, and important events

Try it now in the Time section of your dashboard!`
  },

  // CALCULATOR
  calculator: {
    patterns: ['calculator', 'math', 'calculate', 'arithmetic', 'numbers', 'calculation'],
    response: `🧮 **Calculator Tool:**

Our advanced calculator allows you to:
• Basic arithmetic (+ − × ÷)
• Percentage calculations
• Power functions
• Square roots
• Trigonometric functions
• Logarithms
• History tracking

**How to use:**
1. Click the Calculator card on dashboard
2. Enter your numbers and operations
3. Press = to calculate
4. Results display immediately

Perfect for quick math, conversions, and complex calculations!`
  },

  // WEATHER
  weather: {
    patterns: ['weather', 'temperature', 'forecast', 'climate', 'rain', 'wind', 'sunny'],
    response: `☀️ **Weather Tool:**

Get real-time weather information:
• Current temperature and conditions
• Humidity levels
• Wind speed
• UV index
• 5-day forecast
• Location-based data
• Precipitation chances

**How to use:**
1. Open the Weather tool
2. Allow location access (or enter city)
3. View current conditions
4. Check forecast for planning

Updated in real-time with accurate data!`
  },

  // QR MAKER
  qr: {
    patterns: ['qr', 'qr code', 'qr maker', 'code generator', 'barcode'],
    response: `🔍 **QR Code Maker:**

Create custom QR codes instantly:
• Generate from text, URLs, or data
• Customize colors and size
• Download as image
• Share easily
• Track-friendly codes
• Multiple format options

**How to use:**
1. Go to QR Maker
2. Enter text or URL
3. Customize appearance (optional)
4. Click "Generate"
5. Download or copy

Perfect for marketing, sharing links, and contactless information!`
  },

  // PDF MAKER
  pdf: {
    patterns: ['pdf', 'pdf maker', 'document', 'create pdf', 'convert pdf', 'export'],
    response: `📄 **PDF Maker:**

Create professional PDFs easily:
• Convert text to PDF
• Upload documents
• Customize formatting
• Add headers and footers
• Multiple page layouts
• High-quality output
• Download instantly

**How to use:**
1. Open PDF Maker
2. Enter your content
3. Choose formatting options
4. Preview your PDF
5. Download with one click

Great for reports, invoices, documentation, and sharing!`
  },

  // GRAMMAR CHECKER
  grammar: {
    patterns: ['grammar', 'spelling', 'grammar checker', 'check text', 'editor', 'writing', 'paragraph'],
    response: `✍️ **Grammar Checker & Paragraph Editor:**

Improve your writing with advanced checking:
• Grammar correction
• Spelling verification
• Tone analysis
• Readability scoring
• Suggestions for improvement
• Real-time feedback
• Multiple language support

**How to use:**
1. Go to Paragraph Editor
2. Paste or type your text
3. View suggestions
4. Make corrections
5. Export or copy corrected text

Perfect for essays, articles, emails, and professional documents!`
  },

  // SPEECH & AUDIO
  speech: {
    patterns: ['speech', 'text to speech', 'audio', 'voice', 'listening', 'speaker'],
    response: `🗣️ **Speech & Text-to-Speech:**

Convert text to natural-sounding audio:
• Clear voice output
• Multiple languages
• Adjustable speed
• Pause and resume
• Download audio files
• Natural pronunciation

**How to use:**
1. Go to Speech tool
2. Enter or paste text
3. Select language/voice
4. Click "Speak"
5. Adjust speed if needed
6. Download audio if desired

Great for accessibility, learning, and audio content creation!`
  },

  // GAMES
  games: {
    patterns: ['games', 'gaming', 'play', 'entertainment', 'game', 'fun'],
    response: `🎮 **Games Section:**

Enjoy our collection of fun games:
• Flappy Bird - Classic flying game
• 2048 - Number puzzle game
• Neon District - Adventure game
• More games coming soon!

**Available Games:**
1. **Neon District** - Immersive adventure with amazing graphics
2. **Flappy Bird** - Test your reflexes
3. **2048** - Addictive number game

**How to play:**
1. Go to Games on dashboard
2. Select a game
3. Click to start
4. Follow the game instructions
5. Have fun!

Perfect for breaks and entertainment!`
  },

  // COLOR PICKER
  color: {
    patterns: ['color', 'colors', 'color picker', 'palette', 'hex', 'rgb'],
    response: `🎨 **Color Picker & Palette:**

Explore and generate colors:
• Color picker interface
• Hex code generation
• RGB/HSL values
• Color palettes
• Contrast checker
• Accessibility colors
• Palette suggestions

**How to use:**
1. Open Colors tool
2. Click or drag to pick color
3. View hex/RGB codes
4. Copy color code
5. Generate palettes

Essential for designers, developers, and anyone working with colors!`
  },

  // CALENDAR
  calendar: {
    patterns: ['calendar', 'dates', 'schedule', 'events', 'appointments'],
    response: `📅 **Calendar:**

Manage your schedule and events:
• View monthly calendar
• Add events and reminders
• Set recurring events
• Event notifications
• Color-coded categories
• Export options
• Multiple calendar views

**How to use:**
1. Open Calendar
2. Click date to add event
3. Enter event details
4. Set time and reminders
5. Save event

Perfect for planning, organization, and never missing important dates!`
  },

  // ACTIVITIES TRACKER
  activities: {
    patterns: ['activities', 'tracker', 'track activities', 'exercise', 'fitness', 'gatividhiya'],
    response: `🚴 **Activities Tracker (External):**

Track your daily activities and fitness:
• Activity logging
• Fitness tracking
• Distance measurement
• Calories burned
• Progress charts
• Weekly/monthly stats

This is our external Activities Tracker available at: https://mohakdev1220.github.io/gatividhiya/

**Features:**
• Track various activities
• Monitor progress
• Set fitness goals
• View detailed statistics

Visit the link to get started with activity tracking!`
  },

  // AUTHENTICATION & LOGIN
  auth: {
    patterns: ['login', 'sign in', 'account', 'authentication', 'password', 'sign up', 'register'],
    response: `🔐 **Authentication & Login:**

Secure access to Toolify:
• Google Sign-In integration
• Secure authentication
• One-click login
• Firebase security
• Account protection
• Session management
• Auto-logout for security

**How to sign in:**
1. Go to the login page
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions
5. Redirect to dashboard automatically

Your data is secure with enterprise-grade Firebase authentication!`
  },

  // PRIVACY POLICY
  privacy: {
    patterns: ['privacy', 'privacy policy', 'data', 'information', 'personal data', 'gdpr'],
    response: `🔒 **Privacy Policy Summary:**

At Toolify, we take your privacy seriously:

**Data Collection:**
• Only necessary user data (name, email)
• No third-party data sharing
• Secure Firebase storage
• HTTPS encryption for all data

**Your Rights:**
• Request your data anytime
• Delete your account
• Opt-out of communications
• Privacy controls

**Security:**
• End-to-end encryption
• Secure servers
• Regular security audits
• No malware or tracking

**Full Policy:**
Visit our detailed Privacy Policy page for complete information.

We comply with GDPR, CCPA, and international privacy standards. Your trust is our priority!`
  },

  // TERMS & CONDITIONS
  terms: {
    patterns: ['terms', 'terms and conditions', 'terms of service', 'tos', 'rules', 'agreements', 'legal'],
    response: `⚖️ **Terms & Conditions Summary:**

Please review our terms:

**User Responsibilities:**
• Use tools only for legal purposes
• Don't share credentials
• Follow community guidelines
• Report security issues
• Respect intellectual property

**Service Availability:**
• Best effort availability
• Scheduled maintenance allowed
• No guarantee for 24/7 uptime
• Feature updates may change functionality

**Limitations:**
• No commercial use without permission
• No unauthorized data scraping
• No malicious activity
• Single user per account

**Liability:**
• Use at your own risk
• Limited liability
• No responsibility for data loss
• User error consequences

**Full Terms:**
Visit our Terms & Conditions page for complete legal terms.

By using Toolify, you agree to these terms!`
  },

  // ABOUT MOHAK
  about: {
    patterns: ['mohak', 'developer', 'creator', 'who created', 'who made', 'about the creator'],
    response: `👨‍💻 **About Mohak (Creator):**

Mohak Choubey is a talented developer and creator:

**Toolify Creator:**
• Built Toolify from scratch
• Designed all tools and features
• Continuous improvement
• User-focused development

**Other Projects by Mohak:**
1. **Gatividhiya** - Activities and fitness tracking
   Link: https://mohakdev1220.github.io/gatividhiya/

2. **Other Websites** - Multiple projects in development
   Check out more at: https://mohakdev1220.github.io/websites_link/

**Skills:**
• Full-stack web development
• UI/UX design
• Mobile-responsive development
• Database management
• Cloud solutions

**Connect:**
• YouTube: @MOHAKCHOUBEY
• GitHub: mohakdev1220
• Always creating new tools!

Support Mohak by using Toolify and sharing it with others!`
  },

  // OTHER WEBSITES
  websites: {
    patterns: ['other websites', 'other projects', 'mohak projects', 'more websites', 'other tools'],
    response: `🌐 **Other Websites by Mohak:**

Explore more amazing projects:

**1. Gatividhiya** - Activities Tracker
   • Track fitness and activities
   • Monitor progress
   • Set goals
   Link: https://mohakdev1220.github.io/gatividhiya/

**2. Portfolio & Projects**
   Link: https://mohakdev1220.github.io/websites_link/

**3. YouTube Channel**
   Subscribe for updates and tutorials
   Link: https://www.youtube.com/@MOHAKCHOUBEY

Mohak is constantly creating new tools and platforms. Check back often for new projects!`
  },

  // FEEDBACK & SUPPORT
  feedback: {
    patterns: ['feedback', 'issue', 'bug', 'suggest', 'suggestion', 'report', 'support', 'help'],
    response: `💬 **Feedback & Support:**

We value your feedback!

**How to Submit Feedback:**
1. Click "Feedback" in the dashboard footer
2. Fill out the feedback form
3. Describe your issue or suggestion
4. Include your contact info (optional)
5. Submit

**Report Issues:**
• Use the feedback form
• Describe the problem clearly
• Include screenshots if possible
• Mention which tool has the issue

**Get Help:**
• Chat with this assistant
• Read tool documentation
• Visit FAQ section
• Contact support through feedback

Your feedback helps us improve Toolify every day!`
  },

  // FEATURES
  features: {
    patterns: ['features', 'what can i do', 'capabilities', 'functionality', 'options'],
    response: `✨ **Toolify Features:**

Experience powerful features:

**Dashboard:**
• Overview of all tools
• Quick access to favorites
• Session management
• Theme switching (dark/light)

**Tools:**
• 15+ dedicated tools
• No ads or distractions
• One-click access
• Offline-ready for some

**Security:**
• Google authentication
• Firebase security
• Data encryption
• Privacy controls

**Personalization:**
• User profiles
• Saved preferences
• Chat history
• Custom themes

**Accessibility:**
• Mobile responsive
• Dark/light mode
• Keyboard shortcuts
• Screen reader friendly

**Performance:**
• Lightning-fast loading
• Optimized database
• Minimal latency
• Cache optimization

Toolify is constantly evolving with new features!`
  },

  // TECHNICAL DETAILS
  technical: {
    patterns: ['tech', 'technology', 'built with', 'stack', 'how it works', 'technical', 'architecture'],
    response: `⚙️ **Technical Stack:**

Toolify is built with modern technology:

**Frontend:**
• HTML5 & CSS3
• Vanilla JavaScript
• Responsive design
• Real-time updates

**Backend:**
• Firebase (Google Cloud)
• Cloud Firestore
• Cloud Functions
• Realtime Database

**Authentication:**
• Firebase Authentication
• Google OAuth
• Secure token management
• Session handling

**Hosting:**
• GitHub Pages / Firebase Hosting
• Content Delivery Network (CDN)
• Global distribution
• High availability

**Additional Services:**
• Google API integration
• Weather API
• QR code generation
• PDF generation

Built for speed, security, and reliability!`
  },

  // UPDATES & NEWS
  updates: {
    patterns: ['update', 'new', 'news', 'release', 'version', 'changelog', 'what\'s new'],
    response: `📢 **Latest Updates:**

Recent improvements to Toolify:

**Latest Features:**
✨ Rules-based Chatbot (You're using it!)
🎮 Games Section
📱 Enhanced Mobile Experience
🌓 Dark/Light Mode Toggle

**Upcoming:**
🔜 More games
🔜 Advanced analytics
🔜 API access
🔜 Browser extensions
🔜 Mobile apps

**Bug Fixes:**
• CSS corruption fixed
• Dashboard redirect improved
• Performance optimizations
• UI enhancements

Follow our YouTube for announcements: @MOHAKCHOUBEY`
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHATBOT CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ToolifyAssistant {
  constructor() {
    this.currentChat = this.generateSessionId();
    this.messages = [];
    this.userName = '';
    this.loadUserInfo();
    this.loadChatHistory();
    this.initializeUI();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  loadUserInfo() {
    if (window.currentUser) {
      this.userName = window.currentUser.displayName?.split(' ')[0] || 'Friend';
    }
  }

  initializeUI() {
    this.setupEventListeners();
    this.setupTheme();
    this.updateURLWithSessionId();
  }

  setupEventListeners() {
    // Message sending
    document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // New chat
    document.getElementById('newChatBtn').addEventListener('click', () => this.newChat());

    // Info popup
    document.getElementById('notAiBtn').addEventListener('click', () => this.showInfoPopup());
    document.getElementById('popupClose').addEventListener('click', () => this.closeInfoPopup());
    document.getElementById('popupCloseBtn').addEventListener('click', () => this.closeInfoPopup());
    document.getElementById('popupOverlay').addEventListener('click', () => this.closeInfoPopup());

    // Quick prompts
    document.querySelectorAll('.quick-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        document.getElementById('messageInput').value = prompt;
        this.sendMessage();
      });
    });

    // Sidebar
    document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());

    // Clear history
    document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

    // Sign out
    document.getElementById('signOutBtn').addEventListener('click', () => this.signOut());
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('toolify-theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      this.updateThemeIcon(true);
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('toolify-theme', isDark ? 'dark' : 'light');
    this.updateThemeIcon(isDark);
  }

  updateThemeIcon(isDark) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (isDark) {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Show loading
    this.showLoading();

    // Simulate thinking delay
    setTimeout(() => {
      const response = this.generateResponse(message);
      this.addMessage(response, 'assistant');
      this.hideLoading();
      this.saveChat();
    }, 500 + Math.random() * 500);
  }

  addMessage(text, sender) {
    const container = document.getElementById('messagesContainer');

    // Remove empty state
    const emptyState = document.getElementById('chatEmpty');
    if (emptyState && emptyState.style.display !== 'none') {
      emptyState.style.display = 'none';
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? 'M' : '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = this.sanitizeHTML(text);

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageEl.appendChild(avatar);
    messageEl.appendChild(content);
    messageEl.appendChild(time);

    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;

    // Store message
    this.messages.push({
      text,
      sender,
      timestamp: new Date().toISOString()
    });
  }

  generateResponse(userMessage) {
    const input = userMessage.toLowerCase().trim();

    // Check knowledge base patterns
    for (const [key, item] of Object.entries(KNOWLEDGE_BASE)) {
      if (item.patterns.some(pattern => input.includes(pattern))) {
        if (typeof item.response === 'function') {
          return item.response(this.userName);
        }
        return item.response;
      }
    }

    // Default response for unknown queries
    return `I appreciate your question, but I don't have specific information about that in my knowledge base. I'm a rules-based assistant that knows about:
• Toolify tools and features
• How to use specific features
• Privacy policy and terms
• About Mohak and other projects
• General information about the platform

Feel free to ask about any of these topics, or visit the corresponding pages in Toolify for more detailed information!`;
  }

  sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<em>$1</em>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  }

  showLoading() {
    const loader = document.getElementById('loadingIndicator');
    loader.style.display = 'flex';
  }

  hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    loader.style.display = 'none';
  }

  showInfoPopup() {
    document.getElementById('infoPopup').style.display = 'flex';
  }

  closeInfoPopup() {
    document.getElementById('infoPopup').style.display = 'none';
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.chatbot-sidebar');
    sidebar.classList.toggle('open');
  }

  newChat() {
    this.currentChat = this.generateSessionId();
    this.messages = [];
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('chatEmpty').style.display = 'flex';
    document.getElementById('messageInput').focus();
    this.updateURLWithSessionId();
    this.saveChat();
    this.updateChatHistory();
  }

  updateURLWithSessionId() {
    const url = `${window.location.pathname}?chat=${this.currentChat}`;
    window.history.pushState({ chat: this.currentChat }, '', url);
  }

  saveChat() {
    const chats = JSON.parse(localStorage.getItem('toolify-chats') || '{}');
    const preview = this.messages[0]?.text?.substring(0, 50) || 'New Chat';
    chats[this.currentChat] = {
      preview,
      messages: this.messages,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('toolify-chats', JSON.stringify(chats));
  }

  loadChatHistory() {
    const historyEl = document.getElementById('chatHistory');
    const chats = JSON.parse(localStorage.getItem('toolify-chats') || '{}');

    Object.entries(chats).forEach(([id, chat]) => {
      const item = document.createElement('button');
      item.className = 'chat-history-item';
      if (id === this.currentChat) item.classList.add('active');
      item.textContent = chat.preview;
      item.addEventListener('click', () => this.loadChat(id));
      historyEl.appendChild(item);
    });
  }

  updateChatHistory() {
    const historyEl = document.getElementById('chatHistory');
    historyEl.innerHTML = '';
    this.loadChatHistory();
  }

  loadChat(chatId) {
    const chats = JSON.parse(localStorage.getItem('toolify-chats') || '{}');
    const chat = chats[chatId];

    if (chat) {
      this.currentChat = chatId;
      this.messages = chat.messages || [];

      const container = document.getElementById('messagesContainer');
      container.innerHTML = '';

      this.messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = msg.sender === 'user' ? 'M' : '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.sanitizeHTML(msg.text);

        messageEl.appendChild(avatar);
        messageEl.appendChild(content);
        container.appendChild(messageEl);
      });

      document.getElementById('chatEmpty').style.display = 'none';
      container.scrollTop = container.scrollHeight;
      this.updateURLWithSessionId();
      this.updateChatHistory();
    }
  }

  clearHistory() {
    if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
      localStorage.removeItem('toolify-chats');
      this.newChat();
      this.updateChatHistory();
      alert('Chat history cleared!');
    }
  }

  signOut() {
    if (confirm('Are you sure you want to sign out?')) {
      window.signOutUser().then(() => {
        window.location.href = 'login.html';
      });
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INITIALIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let assistant;

function initChatbot() {
  assistant = new ToolifyAssistant();
}
