import { useEffect, useState } from 'react';
import { sendToAI, getAIModels } from './services/ai';
import {
  Menu, Plus, Search, MessageSquare, Settings,
  GraduationCap, FilePlus, Code,  Send,
  Paperclip, Sparkles,  User, Copy,
   X, Languages
} from "lucide-react";
import './App.css';

const initialChats = [];

const suggestions = [
  { icon: GraduationCap, title: 'المساعد الجامعي', desc: 'اشرح لي محاضرة أو حل مسألة' },
  { icon: Search, title: 'البحث الذكي', desc: 'ابحث عن موضوع واجمع مصادره' },
  { icon: FilePlus, title: 'إنشاء الملفات', desc: 'جهز تقريراً أو مستنداً' },
  { icon: Code, title: 'مساعد البرمجة', desc: 'اكتب أو صحح الأكواد' }
];

function App() {
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState(initialChats);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [language, setLanguage] = useState('ar');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [models, setModels] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadModels() {
      try {
        const available = await getAIModels();
        if (active) setModels(available);
      } catch {
        if (active) setModels([]);
      } finally {
        if (active) setModelsLoaded(true);
      }
    }

    loadModels();
    return () => { active = false; };
  }, []);

  const isArabic = language === 'ar';

  const onlineModels = models.filter(model => model.online);
  const modelStatus = onlineModels.length
    ? (isArabic ? `${onlineModels.length} نموذج متصل` : `${onlineModels.length} model(s) online`)
    : (modelsLoaded
        ? (isArabic ? 'النماذج غير متصلة' : 'Models offline')
        : (isArabic ? 'جارٍ التحقق...' : 'Checking models...'));

  function openSection(section) {
    setActiveSection(section);
    setSidebar(false);
  }

  function newChat() {
    setMessages([]);
    setActiveSection('chat');
    setSidebar(false);
  }

  async function sendMessage(value = input) {
    const question = value.trim();
    if (!question || loading) return;

    const history = [
      ...messages,
      { role: 'user', content: question }
    ];

    setInput('');
    setMessages(history);
    setChats(prev => [
      { title: question.slice(0, 35), id: Date.now() },
      ...prev
    ]);
    setLoading(true);

    try {
      const answer = await sendToAI(history, selectedModel);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: answer }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: isArabic
            ? `تعذر الاتصال بالنموذج المحلي: ${error.message}
تأكد من أن خادم الذكاء الاصطناعي يعمل.`
            : `Could not connect to the local AI: ${error.message}
Make sure the local AI server is running.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copyText(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  }

  return (
    <div className="app" dir={isArabic ? 'rtl' : 'ltr'}>
      {sidebar && <div className="overlay" onClick={() => setSidebar(false)} />}

      <aside className={`sidebar ${sidebar ? 'show' : ''}`}>
        <div className="brand">
          <div className="brand-icon"><Sparkles size={23}/></div>
          <div>
            <strong>Nexa AI</strong>
            <span>INTELLIGENCE STUDIO</span>
          </div>
          <button className="icon-btn close-sidebar" onClick={() => setSidebar(false)}>
            <X size={19}/>
          </button>
        </div>

        <button className="new-chat" onClick={newChat}>
          <Plus size={19}/> {isArabic ? 'محادثة جديدة' : 'New chat'}
        </button>

        <div className="side-label">{isArabic ? 'مساحة العمل' : 'WORKSPACE'}</div>

        <button className={`nav-item ${activeSection === 'chat' ? 'active' : ''}`} onClick={newChat}>
          <MessageSquare size={18}/> {isArabic ? 'المحادثة الذكية' : 'AI Chat'}
        </button>
        <button className={`nav-item ${activeSection === 'research' ? 'active' : ''}`} onClick={() => openSection('research')}>
          <Search size={18}/> {isArabic ? 'البحث الذكي' : 'Research'}
        </button>
        <button className={`nav-item ${activeSection === 'files' ? 'active' : ''}`} onClick={() => openSection('files')}>
          <FilePlus size={18}/> {isArabic ? 'صناعة الملفات' : 'File Creator'}
        </button>
        <button className={`nav-item ${activeSection === 'study' ? 'active' : ''}`} onClick={() => openSection('study')}>
          <GraduationCap size={18}/> {isArabic ? 'المساعد الجامعي' : 'Study Assistant'}
        </button>
        <button className={`nav-item ${activeSection === 'coding' ? 'active' : ''}`} onClick={() => openSection('coding')}>
          <Code size={18}/> {isArabic ? 'البرمجة' : 'Coding'}
        </button>

        <div className="side-label history-label">
          {isArabic ? 'المحادثات الأخيرة' : 'RECENT CHATS'}
        </div>
        <div className="history">
          {chats.map(chat => (
            <button className="history-item" key={chat.id} onClick={newChat}>
              <MessageSquare size={15}/>
              <span>{chat.title}</span>
            </button>
          ))}
          {chats.length === 0 && (
            <p className="empty-history">
              {isArabic ? 'ستظهر محادثاتك هنا' : 'Your chats will appear here'}
            </p>
          )}
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setLanguage(isArabic ? 'en' : 'ar')}>
            <Languages size={18}/>
            {isArabic ? 'English' : 'العربية'}
          </button>
          <button className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => openSection('settings')}>
            <Settings size={18}/> {isArabic ? 'الإعدادات' : 'Settings'}
          </button>
          <div className="profile">
            <div className="avatar">N</div>
            <div><strong>Nexa AI</strong><span>{isArabic ? 'نسخة تجريبية · Beta' : 'Beta version'}</span></div>
            <Sparkles size={17} className="profile-spark"/>
          </div>
          <p className="creator-credit">
            {isArabic ? 'مُعدّ من قبل الطالب حيدر أحمد' : 'Prepared by student Haider Ahmed'}
          </p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn menu-btn" onClick={() => setSidebar(true)}>
              <Menu size={21}/>
            </button>
            <div className="mobile-brand">
              <Sparkles size={18}/> Nexa AI
            </div>
            <div className="top-tools">
            <span className="model-label">
              <span className={`online-dot ${onlineModels.length ? '' : 'offline-dot'}`}/>
              {modelStatus}
            </span>
            <select
              className="model-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              aria-label={isArabic ? 'اختيار نموذج الذكاء الاصطناعي' : 'Choose AI model'}
            >
              <option value="auto">{isArabic ? 'تلقائي' : 'Auto'}</option>
              <option value="qwen">Qwen</option>
              <option value="gemma">Gemma 3</option>
            </select>
          </div>
          </div>
          <button className="icon-btn" onClick={newChat} title="New chat">
            <Plus size={20}/>
          </button>
        </header>

        <section className="content">
          {activeSection !== 'chat' ? (
            <div className="welcome section-page">
              <div className="welcome-icon">
                {activeSection === 'research' ? <Search size={30}/> :
                 activeSection === 'files' ? <FilePlus size={30}/> :
                 activeSection === 'study' ? <GraduationCap size={30}/> :
                 activeSection === 'coding' ? <Code size={30}/> : <Settings size={30}/>}
              </div>
              <h1>
                {activeSection === 'research' ? (isArabic ? 'البحث الذكي' : 'Smart Research') :
                 activeSection === 'files' ? (isArabic ? 'صناعة الملفات' : 'File Creator') :
                 activeSection === 'study' ? (isArabic ? 'المساعد الجامعي' : 'Study Assistant') :
                 activeSection === 'coding' ? (isArabic ? 'مساعد البرمجة' : 'Coding Assistant') :
                 (isArabic ? 'الإعدادات' : 'Settings')}
              </h1>
              <p>
                {activeSection === 'research' ? (isArabic ? 'اطلب بحثاً منظماً أو شرحاً لموضوع مع توضيح المعلومات التي تحتاج إلى مصادر.' : 'Ask for structured research and explanations.') :
                 activeSection === 'files' ? (isArabic ? 'أنشئ مسودات التقارير والملخصات والمستندات بمساعدة Gemini.' : 'Create report and document drafts with Gemini.') :
                 activeSection === 'study' ? (isArabic ? 'اشرح محاضراتك، افهم المفاهيم، وتدرّب على المسائل.' : 'Understand lectures and practice concepts.') :
                 activeSection === 'coding' ? (isArabic ? 'اكتب الأكواد واطلب شرحها أو تصحيح الأخطاء.' : 'Write, explain and debug code.') :
                 (isArabic ? 'غيّر لغة التطبيق وتحقق من حالة اتصال النموذج.' : 'Change language and check model connection.')}
              </p>
              {activeSection === 'settings' ? (
                <div className="suggestions">
                  <button className="suggestion" onClick={() => setLanguage(isArabic ? 'en' : 'ar')}>
                    <div className="suggestion-icon"><Languages size={21}/></div>
                    <div><strong>{isArabic ? 'تغيير اللغة' : 'Change language'}</strong><span>{isArabic ? 'English' : 'العربية'}</span></div>
                  </button>
                  <div className="suggestion">
                    <div className="suggestion-icon"><Sparkles size={21}/></div>
                    <div><strong>Gemini</strong><span>{modelStatus}</span></div>
                  </div>
                </div>
              ) : (
                <div className="suggestions">
                  <button className="suggestion" onClick={() => { setActiveSection('chat'); sendMessage(
                    activeSection === 'research' ? (isArabic ? 'ساعدني في إعداد بحث منظم عن موضوع: ' : 'Help me research this topic: ') :
                    activeSection === 'files' ? (isArabic ? 'ساعدني في إعداد تقرير عن موضوع: ' : 'Help me draft a report about: ') :
                    activeSection === 'study' ? (isArabic ? 'أريد شرحاً جامعياً مبسطاً عن: ' : 'Explain this university topic: ') :
                    (isArabic ? 'ساعدني في البرمجة. أريد شرح أو كتابة كود عن: ' : 'Help me with programming: ')
                  ); }}>
                    <div className="suggestion-icon"><Send size={21}/></div>
                    <div><strong>{isArabic ? 'ابدأ الآن' : 'Start now'}</strong><span>{isArabic ? 'انتقل إلى المحادثة مع المساعد' : 'Continue in AI chat'}</span></div>
                  </button>
                </div>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">
                <Sparkles size={32}/>
              </div>
              <div className="welcome-tag">
                <span className={`online-dot ${onlineModels.length ? '' : 'offline-dot'}`}/>
                {isArabic ? 'مساحة عملك الذكية · BETA' : 'YOUR AI WORKSPACE · BETA'}
              </div>
              <h1>
                {isArabic ? <>مرحباً بك في <span>Nexa AI</span></> :
                  <>Welcome to <span>Nexa AI</span></>}
              </h1>
              <p>
                {isArabic
                  ? 'مساحتك الذكية للتعلم والبحث والإبداع وإنجاز المهام.'
                  : 'Your intelligent space for learning, research, creativity and productivity.'}
              </p>

              <div className="suggestions">
                {suggestions.map(({icon: Icon, title, desc}) => (
                  <button className="suggestion" key={title}
                    onClick={() => sendMessage(isArabic ? title : desc)}>
                    <div className="suggestion-icon"><Icon size={21}/></div>
                    <div><strong>{isArabic ? title : desc}</strong>
                      <span>{isArabic ? desc : title}</span></div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, i) => (
                <div className={`message ${msg.role}`} key={i}>
                  <div className="message-avatar">
                    {msg.role === 'assistant' ? <Sparkles size={18}/> : <User size={18}/>}
                  </div>
                  <div className="message-body">
                    <strong>{msg.role === 'assistant' ? 'Nexa AI' : (isArabic ? 'أنت' : 'You')}</strong>
                    <p>{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button className="copy-btn" onClick={() => copyText(msg.content)}>
                        <Copy size={14}/> {isArabic ? 'نسخ' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="typing"><span/><span/><span/></div>}
            </div>
          )}
        </section>

        <footer className="composer-area">
          <div className="composer">
            <button className="attach-btn" title="Attach file">
              <Paperclip size={19}/>
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isArabic ? 'اسأل Nexa AI عن أي شيء...' : 'Ask Nexa AI anything...'}
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <Send size={19}/>
            </button>
          </div>
          <p className="disclaimer">
            {isArabic
              ? 'Nexa AI · قيد التطوير · Beta — قد تتغير بعض الميزات أو لا تكون متاحة.'
              : 'Nexa AI · In development · Beta — Some features may change or be unavailable.'}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
