import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Copy, Play, Pause, ShieldCheck, AlertTriangle, Info, Calendar } from "lucide-react";
import "./App.css";

const API_URL = "https://guihymgvemtg42ow4dreja5l5y0vxibp.lambda-url.ap-south-1.on.aws/";

const T = {
  hi: {
    hero_eyebrow: "हर हफ्ते लाखों भारतीयों को ऐसे कॉल आते हैं",
    hero_headline: "\"आपके आधार पर केस है, अभी पैसे भेजो।\"",
    hero_subtext: "Raksha संदिग्ध संदेशों और कॉलों का तुरंत विश्लेषण करता है, हिंदी में जोखिमों को स्पष्ट करता है, और आपको सुरक्षित रहने के उपाय बताता है।",
    input_placeholder: "संदेश या कॉल का विवरण यहाँ पेस्ट करें...",
    ex1: "आपके आधार पर केस है...",
    ex1_full: "सीबीआई अधिकारी रवि बोल रहा हूँ। आपके आधार पर केस है। अभी पैसे भेजो वरना गिरफ्तारी होगी।",
    ex2: "फेडएक्स पार्सल सीज हो गया...",
    ex2_full: "आपका फेडएक्स पार्सल कस्टम द्वारा सीज कर लिया गया है क्योंकि उसमें अवैध सामान है।",
    ex3: "यूपीआई पिन डालें...",
    ex3_full: "आपका रिफंड अप्रूव हो गया है। पैसे प्राप्त करने के लिए कृपया अपना यूपीआई पिन डालें।",
    btn_analyze: "जाँच करें",
    btn_analyzing: "जाँच हो रही है...",
    chip_patterns: "12+ स्कैम पैटर्न",
    chip_hindi: "हिंदी में जवाब",
    chip_availability: "24/7 उपलब्ध",
    verdict_scam: "यह कॉल फ्रॉड है",
    verdict_suspicious: "यह संदिग्ध है",
    verdict_legit: "यह सुरक्षित लगता है",
    title_why: "क्यों",
    title_next: "अभी क्या करें",
    title_process: "प्रक्रिया",
    title_draft: "शिकायत का मसौदा (हमेशा हिंदी में)",
    btn_copy_draft: "मसौदा कॉपी करें",
    err_network: "सर्वर से कनेक्ट नहीं हो सका। अपना कनेक्शन जांचें और पुनः प्रयास करें।",
    audio_caption: "व्याख्या हिंदी में है",
    btn_upload_audio: "ऑडियो अपलोड करें",
    btn_upload_image: "स्क्रीनशॉट अपलोड करें",
    uploading: "अपलोड हो रहा है..."
  },
  en: {
    hero_eyebrow: "Millions of Indians receive calls like this every week",
    hero_headline: "\"There's a case on your Aadhaar, send money now.\"",
    hero_subtext: "Raksha instantly analyzes suspicious messages and calls, clearly explaining risks in English and preparing steps to protect yourself.",
    input_placeholder: "Paste the message or call details here...",
    ex1: "Case on your Aadhaar...",
    ex1_full: "This is CBI officer Ravi. There is a case on your Aadhaar. Send money now or you will be arrested.",
    ex2: "FedEx parcel seized...",
    ex2_full: "Your FedEx parcel has been seized by customs because it contains illegal items.",
    ex3: "Enter UPI PIN...",
    ex3_full: "Your refund has been approved. Please enter your UPI PIN to receive the money.",
    btn_analyze: "Analyze this message",
    btn_analyzing: "Analyzing...",
    chip_patterns: "12+ Scam patterns",
    chip_hindi: "Answers in English",
    chip_availability: "24/7 Available",
    verdict_scam: "This is a Scam",
    verdict_suspicious: "This is Suspicious",
    verdict_legit: "This appears Safe",
    title_why: "Why",
    title_next: "Next steps",
    title_process: "Process",
    title_draft: "Complaint Draft (always in Hindi)",
    btn_copy_draft: "Copy draft",
    err_network: "Couldn't reach the server. Check your connection and try again.",
    audio_caption: "Explanation audio is in Hindi",
    btn_upload_audio: "Upload Audio",
    btn_upload_image: "Upload Screenshot",
    uploading: "Uploading..."
  }
};

function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
    const onEnded = () => setIsPlaying(false);
    
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-player-custom">
      <audio ref={audioRef} src={src} hidden />
      <button className="play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="audio-progress-bar">
        <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState("hi");

  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const texts = T[lang];

  const VERDICT_CONFIG = {
    scam: { text: texts.verdict_scam, icon: AlertTriangle, colorClass: "scam-theme", bgClass: "scam-bg" },
    suspicious: { text: texts.verdict_suspicious, icon: Info, colorClass: "suspicious-theme", bgClass: "suspicious-bg" },
    legit: { text: texts.verdict_legit, icon: ShieldCheck, colorClass: "legit-theme", bgClass: "legit-bg" },
  };

  useEffect(() => {
    console.log("Mounted with API_URL:", API_URL);
  }, []);

  async function handleAnalyse() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const requestBody = { text: input };
      console.log("Calling:", API_URL, requestBody);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e) {
      console.error("Fetch failed:", e);
      setError(texts.err_network);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e, fileType) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    try {
      // 1. Get presigned URL
      const urlRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_upload_url",
          file_type: fileType,
          file_name: file.name
        }),
      });
      const urlData = await urlRes.json();
      if (urlData.error) throw new Error(urlData.error);
      
      const { upload_url, key } = urlData;
      
      // 2. PUT file to S3
      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file
      });
      if (!putRes.ok) throw new Error("File upload to S3 failed");
      
      setUploading(false);
      
      // 3. Call analyse with the s3 key
      setLoading(true);
      const reqBody = fileType === "audio" 
        ? { audio_s3_key: key } 
        : { image_s3_key: key };
        
      const analyseRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      const data = await analyseRes.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError(texts.err_network);
    } finally {
      setUploading(false);
      setLoading(false);
      // Reset input value so same file can be selected again
      if (e.target) e.target.value = '';
    }
  }

  function copyComplaint() {
    if (result?.complaint_draft) {
      navigator.clipboard.writeText(result.complaint_draft);
    }
  }

  const vConfig = result ? VERDICT_CONFIG[result.verdict] : null;
  const VerdictIcon = vConfig?.icon;

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <nav className="navbar">
        <div className="nav-left">
          <span className="wordmark">Raksha</span>
        </div>
        <div className="nav-right">
          <button 
            className={`lang-btn ${lang === 'hi' ? 'active' : 'inactive'}`} 
            onClick={() => setLang('hi')}
          >
            हिंदी
          </button>
          <span className="lang-sep">|</span>
          <button 
            className={`lang-btn ${lang === 'en' ? 'active' : 'inactive'}`} 
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              className="hero-layout"
              key="hero"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="hero-text">
                <div>
                  <div className="hero-eyebrow">{texts.hero_eyebrow}</div>
                  <h1 className="hero-headline">{texts.hero_headline}</h1>
                </div>
                <p className="hero-subtext">{texts.hero_subtext}</p>
                
                <div className="input-card">
                  <textarea
                    className="text-input"
                    placeholder={texts.input_placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <div className="example-chips">
                    <button className="example-chip" onClick={() => setInput(texts.ex1_full)}>{texts.ex1}</button>
                    <button className="example-chip" onClick={() => setInput(texts.ex2_full)}>{texts.ex2}</button>
                    <button className="example-chip" onClick={() => setInput(texts.ex3_full)}>{texts.ex3}</button>
                  </div>
                  <button
                    className="analyse-btn"
                    onClick={handleAnalyse}
                    disabled={loading || uploading || !input.trim()}
                  >
                    {loading ? texts.btn_analyzing : texts.btn_analyze} <ArrowRight size={18} />
                  </button>
                  
                  <div className="upload-actions">
                    <input 
                      type="file" 
                      accept="audio/*" 
                      ref={audioInputRef} 
                      onChange={(e) => handleFileUpload(e, "audio")} 
                      hidden 
                    />
                    <button 
                      className="upload-btn" 
                      onClick={() => audioInputRef.current?.click()}
                      disabled={loading || uploading}
                    >
                      {uploading ? texts.uploading : texts.btn_upload_audio}
                    </button>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={imageInputRef} 
                      onChange={(e) => handleFileUpload(e, "image")} 
                      hidden 
                    />
                    <button 
                      className="upload-btn" 
                      onClick={() => imageInputRef.current?.click()}
                      disabled={loading || uploading}
                    >
                      {uploading ? texts.uploading : texts.btn_upload_image}
                    </button>
                  </div>
                </div>
                
                {error && <div className="error-box">{error}</div>}
              </div>

              <div className="hero-ill">
                <svg width="322" height="322" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="70" y="40" width="140" height="200" rx="24" stroke="var(--ink)" strokeWidth="4"/>
                  <path d="M120 40H160" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="140" cy="200" r="16" stroke="var(--ink)" strokeWidth="4"/>
                  <path d="M100 80H180" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 110H160" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 140H170" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="210" cy="70" r="24" fill="var(--alarm)" />
                  <path d="M210 58V74M210 82H210.01" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                <div className="floating-chip chip-1">{texts.chip_patterns}</div>
                <div className="floating-chip chip-2">{texts.chip_hindi}</div>
                <div className="floating-chip chip-3">{texts.chip_availability}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="results-layout"
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="results-left">
                <div className="card">
                  <h2 className="card-title">VERDICT</h2>
                  <div className="verdict-header">
                    <div className={`verdict-icon ${vConfig.bgClass}`}>
                      <VerdictIcon size={24} />
                    </div>
                    <h3 className={`verdict-title ${vConfig.colorClass}`}>{vConfig.text}</h3>
                  </div>
                  {result.audio_url && (
                    <>
                      <AudioPlayer src={result.audio_url} />
                      <div className="audio-caption">{texts.audio_caption}</div>
                    </>
                  )}
                </div>

                <div className="card">
                  <h2 className="card-title">{texts.title_why}</h2>
                  {console.log("Rendering Rule Scores:", result.rule_scores)}
                  {Object.entries(result.rule_scores || {})
                    .filter(([k]) => k !== "total")
                    .map(([key, val]) => (
                      <div className="score-row" key={key}>
                        <span className="score-label">{key.replace('_', ' ')}</span>
                        <div className="score-track">
                          <motion.div
                            className={`score-fill ${vConfig.bgClass}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(val, 1) * 100}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                  ))}
                  <p className="reasoning" style={{ marginTop: 24 }}>
                    {lang === 'en' ? result.reasoning_en : (result.explanation_hi || result.reasoning_en)}
                  </p>
                </div>

                <div className="card">
                  <h2 className="card-title">{texts.title_next}</h2>
                  <ul className="steps-list">
                    {(result.next_steps || []).map((step, i) => (
                      <li key={i} className="step-item">
                        <div className="step-number">{i + 1}</div>
                        <div className="step-text">{step}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="results-right">
                {result.trace && (
                  <div className="card" style={{ position: 'sticky', top: 84 }}>
                    <h2 className="card-title">{texts.title_process}</h2>
                    <div className="trace-timeline">
                      <div className="trace-line" />
                      {result.trace.map((step, i) => (
                        <div key={i} className="trace-item">
                          <div className="trace-dot" />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.complaint_draft && (
                  <div className="card" style={{ position: 'sticky', top: result.trace ? 400 : 84 }}>
                    <div className="complaint-header">
                      <h2 className="card-title" style={{ margin: 0 }}>{texts.title_draft}</h2>
                      <div className="date-chip">
                        <Calendar size={12} />
                        {today}
                      </div>
                    </div>
                    <div className="draft-box">
                      {lang === 'en' && result.reasoning_en ? result.complaint_draft : (result.explanation_hi ? result.explanation_hi : result.complaint_draft)}
                    </div>
                    <button className="icon-btn" onClick={copyComplaint} aria-label={texts.btn_copy_draft}>
                      <Copy size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
