import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  TrendingUp,
  Plus,
  ChevronLeft,
  BarChart3,
  Sparkles,
  Palette,
  Mic,
  Wand2,
} from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

const EchoLogo = ({ className = '', size = 36 }) => (
  <svg
    className={`echo-logo ${className}`.trim()}
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient id="echoCore" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#b88bff" />
        <stop offset="55%" stopColor="#9b5cff" />
        <stop offset="100%" stopColor="#ff5fb8" />
      </radialGradient>
      <linearGradient id="echoRing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
      <filter id="echoGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.8" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"
        />
      </filter>
    </defs>

    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#echoRing)" strokeWidth="2.2" opacity="0.45" filter="url(#echoGlow)" />
    <circle cx="60" cy="60" r="36" fill="none" stroke="url(#echoRing)" strokeWidth="2.4" opacity="0.65" filter="url(#echoGlow)" />
    <circle cx="60" cy="60" r="22" fill="url(#echoCore)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

    <text
      x="60"
      y="68"
      textAnchor="middle"
      fontSize="26"
      fontFamily="'Manrope', 'Segoe UI', sans-serif"
      fontWeight="600"
      fill="#ffffff"
    >
      E.
    </text>
  </svg>
);

const EMOTIONS_COLORS = {
  joie: ['#FFD700', '#FFA500'],
  tristesse: ['#4169E1', '#6A5ACD'],
  'colère': ['#DC143C', '#FF4500'],
  peur: ['#2F4F4F', '#000000'],
  'sérénité': ['#98FB98', '#87CEEB'],
  surprise: ['#FFFF00', '#FF69B4'],
  nostalgie: ['#DDA0DD', '#9370DB'],
  'anxiété': ['#A9A9A9', '#696969'],
  espoir: ['#87CEEB', '#FFD700'],
  frustration: ['#FF8C00', '#CD5C5C'],
};

const THEMES = [
  {
    id: 'linen',
    name: 'Linen',
    description: 'Doux, éditorial, chaleureux',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Vif, lumineux, onirique',
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    description: 'Dense, introspectif, élégant',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    description: 'Artisanat moderne, texturé',
  },
];

const App = () => {
  const [view, setView] = useState('mosaic'); // welcome, login, mosaic, create, detail, stats
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [theme, setTheme] = useState('linen');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);
  const textRef = useRef('');

  useEffect(() => {
    loadEntries();
    const storedTheme = localStorage.getItem('echo:theme');
    if (storedTheme) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('echo:theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const baseText = textRef.current || '';
      const combined = `${baseText} ${finalTranscript}`.replace(/\s+/g, ' ').trim();
      textRef.current = combined;
      setText(combined);
      setCharCount(combined.length);

      if (interimTranscript) {
        setSpeechError(`Dictée en cours… ${interimTranscript}`);
      } else {
        setSpeechError('');
      }
    };

    recognition.onerror = (event) => {
      setSpeechError(`Dictée: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const storage = useMemo(() => {
    return {
      list: async () => {
        const response = await fetch(`${API_BASE}/api/entries`);
        if (!response.ok) throw new Error('Erreur chargement entrées');
        const entries = await response.json();
        return { entries };
      },
      get: async (id) => {
        const response = await fetch(`${API_BASE}/api/entries/${id}`);
        if (!response.ok) throw new Error('Erreur chargement entrée');
        return await response.json();
      },
      set: async (entry) => {
        const response = await fetch(`${API_BASE}/api/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        if (!response.ok) throw new Error('Erreur sauvegarde entrée');
        return await response.json();
      },
    };
  }, []);

  const loadEntries = async () => {
    try {
      const result = await storage.list();
      if (result && result.entries) {
        setEntries(
          result.entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      }
    } catch (error) {
      console.log('Première utilisation, aucune entrée trouvée');
    }
  };

  const analyzeEmotion = async (inputText) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error || !data.dominantEmotion) {
        throw new Error(data.error || 'Analyse invalide');
      }
      return data;
    } catch (error) {
      console.error('Erreur analyse:', error);
      return {
        emotions: [
          { name: 'joie', score: 5 },
          { name: 'tristesse', score: 3 },
          { name: 'sérénité', score: 4 },
        ],
        dominantEmotion: 'joie',
        intensity: 5,
        valence: 'positive',
        keywords: ['émotion', 'ressenti'],
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateVisualization = (emotion, intensity) => {
    const colors = EMOTIONS_COLORS[emotion] || EMOTIONS_COLORS.joie;
    const safeIntensity = Number.isFinite(intensity) ? Math.max(0, Math.min(10, intensity)) : 5;
    const alphaHex = (value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, '0');
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 280);
    gradient.addColorStop(0, colors[0] + alphaHex(safeIntensity * 15));
    gradient.addColorStop(1, colors[1] + '40');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);

    const numShapes = Math.floor(3 + safeIntensity);
    for (let i = 0; i < numShapes; i++) {
      ctx.beginPath();
      const x = 100 + Math.random() * 200;
      const y = 100 + Math.random() * 200;
      const size = 20 + Math.random() * (safeIntensity * 10);

      if (safeIntensity > 7) {
        const sides = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < sides; j++) {
          const angle = (j / sides) * Math.PI * 2;
          const px = x + Math.cos(angle) * size;
          const py = y + Math.sin(angle) * size;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(x, y, size, 0, Math.PI * 2);
      }

      ctx.fillStyle = colors[i % 2] + alphaHex(40 + safeIntensity * 10);
      ctx.fill();
    }

    return canvas.toDataURL();
  };

  const handleSubmit = async () => {
    if (text.length < 50 || text.length > 2000) return;

    const analysis = await analyzeEmotion(text);
    const visualization = generateVisualization(analysis.dominantEmotion, analysis.intensity);

    const entry = {
      text,
      createdAt: new Date().toISOString(),
      analysis,
      visualization,
    };

    try {
      await storage.set(entry);
      await loadEntries();
      setText('');
      setCharCount(0);
      setView('mosaic');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const handleTextChange = (event) => {
    const newText = event.target.value;
    textRef.current = newText;
    setText(newText);
    setCharCount(newText.length);
  };

  const handleToggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      setSpeechError('Dictée vocale indisponible dans ce navigateur.');
      return;
    }

    if (!isRecording) {
      setSpeechError('');
      setRecordSeconds(0);
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const recordTime = `${String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:${String(
    recordSeconds % 60
  ).padStart(2, '0')}`;

  const handleShowLogin = () => {
    setShowWelcome(false);
    setView('login');
  };

  const handleShowWelcome = () => {
    setShowWelcome(true);
    setView('mosaic');
  };

  const handleScrollPricing = () => {
    const section = document.getElementById('pricing');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const getStats = () => {
    if (entries.length === 0) return null;

    const emotionCounts = {};
    let totalIntensity = 0;

    entries.forEach((entry) => {
      const emotion = entry.analysis.dominantEmotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      totalIntensity += entry.analysis.intensity;
    });

    const avgIntensity = (totalIntensity / entries.length).toFixed(1);
    const mostFrequent = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

    return { emotionCounts, avgIntensity, mostFrequent };
  };

  if (showWelcome) {
    return (
      <div className="app welcome-shell">
        <header className="welcome-topbar">
          <div className="welcome-topbar-inner">
            <div className="logo-lockup">
              <EchoLogo size={34} />
              <span className="logo small">ECHO.</span>
            </div>
            <div className="welcome-actions">
              <button className="ghost-btn" onClick={handleScrollPricing}>
                Abonnement
              </button>
              <button className="pill-btn" onClick={handleShowLogin}>
                Se connecter
              </button>
            </div>
          </div>
        </header>

        <section className="welcome">
          <div className="welcome-hero">
            <p className="eyebrow pill">Journal émotionnel artistique</p>
            <h1 className="hero-title">
              Vos émotions, sculptées en œuvres visuelles.
            </h1>
            <p className="tagline">
              Un journal émotionnel qui transforme les nuances en une mosaïque
              réellement belle. Simple à utiliser, profond à comprendre.
            </p>
            <div className="hero-actions">
              <button onClick={() => setShowWelcome(false)} className="primary-btn large">
                Commencer gratuitement
              </button>
              <button onClick={handleShowLogin} className="ghost-btn">
                J'ai déjà un compte
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-chip">
                <span className="stat-value">4</span>
                <span className="stat-label">styles visuels</span>
              </div>
              <div className="stat-chip">
                <span className="stat-value">10</span>
                <span className="stat-label">émotions suivies</span>
              </div>
              <div className="stat-chip">
                <span className="stat-value">0</span>
                <span className="stat-label">friction au départ</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card main">
              <div className="visual-header">
                <EchoLogo size={64} />
                <div>
                  <p className="visual-eyebrow">Mosaïque vivante</p>
                  <h3 className="visual-title">ECHO Portrait</h3>
                </div>
              </div>
              <div className="visual-orb" />
              <div className="visual-rings">
                <span className="ring ring-1" />
                <span className="ring ring-2" />
                <span className="ring ring-3" />
              </div>
              <div className="visual-footer">
                <span className="pulse-dot" />
                Analyse en temps réel
              </div>
            </div>

            <div className="visual-stack">
              <div className="mini-card">
                <span>Intensité moyenne</span>
                <strong>7.2 / 10</strong>
              </div>
              <div className="mini-card accent">
                <span>Émotion dominante</span>
                <strong>Sérénité</strong>
              </div>
              <div className="mini-card">
                <span>Mots-clés</span>
                <strong>calme • clarté</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="signal-strip">
          <div className="signal-line" />
          <div className="signal-text">
            Design premium • Expérience émotionnelle • Mosaïque vivante
          </div>
        </section>

        <section className="highlights">
          <div className="highlight-card">
            <div className="feature-icon brand">
              <Wand2 className="icon" />
            </div>
            <h3>Analyse IA émotionnelle</h3>
            <p>L'IA synthétise valence, intensité, et mots-clés sans effort.</p>
          </div>
          <div className="highlight-card">
            <div className="feature-icon variant">
              <Sparkles className="icon" />
            </div>
            <h3>Capture immersive</h3>
            <p>Un rituel simple : écrire, comprendre, visualiser.</p>
          </div>
          <div className="highlight-card">
            <div className="feature-icon alt">
              <TrendingUp className="icon" />
            </div>
            <h3>Évolution visible</h3>
            <p>Votre trajectoire émotionnelle devient une œuvre cohérente.</p>
          </div>
          <div className="highlight-card">
            <div className="feature-icon accent">
              <BarChart3 className="icon" />
            </div>
            <h3>Patterns clairs</h3>
            <p>Repérez les cycles, les équilibres, les déclencheurs.</p>
          </div>
        </section>
        <section className="story">
          <div className="story-copy">
            <p className="eyebrow">Pourquoi ça marche</p>
            <h2 className="section-title">Un rituel qui clarifie l'esprit.</h2>
            <p className="section-subtitle">
              ECHO transforme l'intangible en quelque chose de visible. Vous écrivez, l'IA
              traduit l'émotion, et votre mosaïque raconte votre progression.
            </p>
            <div className="story-actions">
              <button onClick={() => setShowWelcome(false)} className="primary-btn">
                Démarrer l'expérience
              </button>
              <button onClick={handleShowLogin} className="ghost-btn">
                Voir un exemple
              </button>
            </div>
          </div>
          <div className="story-card">
            <p className="story-quote">
              « J'ai arrêté de survoler mes journées. ECHO m'a donné une structure
              visuelle que je comprends en un regard. »
            </p>
            <div className="story-meta">
              <span className="pulse-dot" />
              Journal personnel, usage quotidien
            </div>
          </div>
        </section>
        <section className="pricing" id="pricing">
          <div className="pricing-hero">
            <div>
              <p className="eyebrow pill">Abonnement</p>
              <h2 className="section-title">Une expérience premium, à votre rythme.</h2>
              <p className="section-subtitle">
                Choisissez l’offre qui correspond à votre ambition. Changez quand vous voulez.
              </p>
            </div>
            <div className="pricing-badges">
              <span className="badge-pill">Sans engagement</span>
              <span className="badge-pill">Annulation en 1 clic</span>
              <span className="badge-pill">Données privées</span>
            </div>
          </div>
          <div className="pricing-grid">
            <div className="price-card luxe">
              <div>
                <p className="plan-name">Essentiel</p>
                <p className="plan-price">Gratuit</p>
                <p className="plan-note">Pour découvrir l’expérience ECHO.</p>
              </div>
              <ul className="plan-list">
                <li>Entrées illimitées</li>
                <li>Mosaïque évolutive</li>
                <li>Analyse émotionnelle IA</li>
              </ul>
              <button className="ghost-btn full">Continuer gratuitement</button>
            </div>

            <div className="price-card highlight luxe">
              <span className="plan-ribbon">Choix premium</span>
              <div>
                <p className="plan-name">Premium</p>
                <p className="plan-price">8 € / mois</p>
                <p className="plan-note">Pour un suivi émotionnel approfondi.</p>
              </div>
              <ul className="plan-list">
                <li>Dictée vocale & transcription</li>
                <li>Insights hebdomadaires</li>
                <li>4 styles visuels avancés</li>
              </ul>
              <button className="primary-btn full">Passer en premium</button>
            </div>

            <div className="price-card luxe">
              <div>
                <p className="plan-name">Studio</p>
                <p className="plan-price">24 € / mois</p>
                <p className="plan-note">Pour créer une œuvre personnelle exportable.</p>
              </div>
              <ul className="plan-list">
                <li>Export poster ou livre</li>
                <li>Archivage haute définition</li>
                <li>Assistance prioritaire</li>
              </ul>
              <button className="ghost-btn full">Préparer mon livre</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <EchoLogo size={32} />
            <h1 className="logo small">ECHO.</h1>
            <span className="brand-pill">Journal émotionnel</span>
          </div>

          <div className="nav">
            <button className="ghost-btn" onClick={handleShowWelcome}>
              Accueil
            </button>
            <div className="theme-picker">
              <Palette className="icon muted" />
              <select
                className="theme-select"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                {THEMES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setView('mosaic')}
              className={`pill-btn ${view === 'mosaic' ? 'active' : ''}`}
            >
              Mosaïque
            </button>
            <button
              onClick={() => setView('stats')}
              className={`pill-btn icon-btn ${view === 'stats' ? 'active' : ''}`}
              aria-label="Statistiques"
            >
              <BarChart3 className="icon" />
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        {view === 'login' && (
          <section className="section narrow">
            <button onClick={handleShowWelcome} className="ghost-btn">
              <ChevronLeft className="icon" />
              Retour à l’accueil
            </button>
            <div className="panel login-panel">
              <div>
                <p className="eyebrow">Connexion</p>
                <h2 className="section-title">Retrouvez votre espace ECHO.</h2>
                <p className="section-subtitle">
                  Connectez-vous pour retrouver votre mosaïque émotionnelle.
                </p>
              </div>
              <form className="login-form">
                <label className="field">
                  <span>Email</span>
                  <input className="text-input" type="email" placeholder="vous@email.com" />
                </label>
                <label className="field">
                  <span>Mot de passe</span>
                  <input className="text-input" type="password" placeholder="••••••••" />
                </label>
                <button className="primary-btn full" type="button">
                  Se connecter
                </button>
              </form>
              <div className="login-footer">
                <button className="ghost-btn" type="button">
                  Mot de passe oublié
                </button>
                <button className="ghost-btn" type="button">
                  Créer un compte
                </button>
              </div>
            </div>
          </section>
        )}

        {view === 'mosaic' && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Votre mosaïque</h2>
                <p className="section-subtitle">Chaque tuile incarne une émotion capturée.</p>
              </div>
              <button onClick={() => setView('create')} className="primary-btn">
                <Plus className="icon" />
                Nouvelle entrée
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="empty-state">
                <Calendar className="empty-icon" />
                <p className="empty-title">Aucune entrée pour le moment</p>
                <p className="empty-text">Commencez par capturer votre première émotion.</p>
              </div>
            ) : (
              <div className="mosaic-grid">
                {entries.map((entry, idx) => (
                  <button
                    key={entry._id || entry.id}
                    onClick={() => {
                      setCurrentEntry(entry);
                      setView('detail');
                    }}
                    className="tile"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <img src={entry.visualization} alt={entry.analysis.dominantEmotion} />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'create' && (
          <section className="section narrow">
            <button onClick={() => setView('mosaic')} className="ghost-btn">
              <ChevronLeft className="icon" />
              Retour
            </button>

            <div className="panel">
              <div>
                <h2 className="section-title">Comment vous sentez-vous ?</h2>
                <p className="section-subtitle">
                  Exprimez vos émotions librement, au moins 50 caractères.
                </p>
              </div>

              <div className="field">
                <div className="input-toolbar">
                  <button
                    className={`ghost-btn micro-btn ${isRecording ? 'recording' : ''}`}
                    type="button"
                    onClick={handleToggleRecording}
                    disabled={!speechSupported}
                  >
                    <Mic className="icon" />
                    {isRecording ? 'Arrêter la dictée' : 'Démarrer une dictée'}
                  </button>
                  <span className={`badge ${isRecording ? 'live' : ''}`}>
                    {!speechSupported
                      ? 'Non supporté'
                      : isRecording
                      ? 'Enregistrement en cours'
                      : 'Dictée vocale'}
                  </span>
                  <div className="record-meta">
                    <span className="record-time">{recordTime}</span>
                    <span className={`record-dot ${isRecording ? 'live' : ''}`} />
                  </div>
                </div>
                {speechError && <div className="speech-error">{speechError}</div>}
                <div className={`waveform ${isRecording ? 'live' : ''}`}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <textarea
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Aujourd'hui, je me sens..."
                  className="text-area"
                  disabled={isAnalyzing}
                />
                <div className="assistant-tip">
                  <Wand2 className="icon" />
                  L’IA synthétise vos émotions en une visualisation unique.
                </div>
                <div
                  className={`char-count ${
                    charCount < 50 ? 'warn' : charCount > 2000 ? 'error' : 'ok'
                  }`}
                >
                  {charCount} / 2000 caractères
                  {charCount < 50 && ` (minimum 50)`}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={charCount < 50 || charCount > 2000 || isAnalyzing}
                className="primary-btn full"
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="icon" />
                    Créer ma tuile
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {view === 'detail' && currentEntry && (
          <section className="section">
            <button onClick={() => setView('mosaic')} className="ghost-btn">
              <ChevronLeft className="icon" />
              Retour à la mosaïque
            </button>

            <div className="detail">
              <div className="detail-media">
                <img src={currentEntry.visualization} alt="Visualisation" />
                <div className="detail-date">
                  <Calendar className="icon" />
                  {new Date(currentEntry.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="detail-info">
                <div>
                  <h3 className="detail-label">Texte original</h3>
                  <p className="detail-text">{currentEntry.text}</p>
                </div>

                <div className="detail-card">
                  <h3 className="detail-label">Analyse émotionnelle</h3>
                  <div className="detail-row">
                    <span className="detail-strong">{currentEntry.analysis.dominantEmotion}</span>
                    <span className="tag">Dominant</span>
                  </div>
                  <div className="detail-row">
                    <span>Intensité</span>
                    <span className="detail-strong">{currentEntry.analysis.intensity}/10</span>
                  </div>
                  <div className="detail-row">
                    <span>Valence</span>
                    <span className="detail-strong capitalize">{currentEntry.analysis.valence}</span>
                  </div>
                </div>

                {currentEntry.analysis.keywords && currentEntry.analysis.keywords.length > 0 && (
                  <div>
                    <h3 className="detail-label">Mots-clés</h3>
                    <div className="keyword-row">
                      {currentEntry.analysis.keywords.map((kw, i) => (
                        <span key={i} className="tag soft">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {view === 'stats' &&
          (() => {
            const stats = getStats();
            return (
              <section className="section">
                <h2 className="section-title">Vos statistiques</h2>

                {!stats ? (
                  <div className="panel center">
                    <BarChart3 className="empty-icon" />
                    <p className="empty-text">Créez des entrées pour voir vos statistiques.</p>
                  </div>
                ) : (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <p className="stat-label">Total d'entrées</p>
                      <p className="stat-value">{entries.length}</p>
                    </div>

                    <div className="stat-card">
                      <p className="stat-label">Intensité moyenne</p>
                      <p className="stat-value">{stats.avgIntensity}/10</p>
                    </div>

                    <div className="stat-card">
                      <p className="stat-label">Émotion dominante</p>
                      <p className="stat-value small capitalize">{stats.mostFrequent[0]}</p>
                      <p className="stat-meta">{stats.mostFrequent[1]} fois</p>
                    </div>

                    <div className="panel">
                      <h3 className="detail-label">Répartition des émotions</h3>
                      <div className="chart">
                        {Object.entries(stats.emotionCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, count]) => (
                            <div key={emotion} className="chart-row">
                              <div className="chart-label">
                                <span className="capitalize">{emotion}</span>
                                <span className="chart-count">{count}</span>
                              </div>
                              <div className="chart-bar">
                                <div
                                  className="chart-fill"
                                  style={{
                                    width: `${(count / entries.length) * 100}%`,
                                    backgroundColor:
                                      EMOTIONS_COLORS[emotion]?.[0] || '#94a3b8',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="export-card">
                      <div>
                        <p className="stat-label">Version premium</p>
                        <h3 className="export-title">Exporter votre mosaïque</h3>
                        <p className="export-text">
                          Générer un poster ou un livre personnel à partir de vos tuiles.
                        </p>
                      </div>
                      <button className="primary-btn">
                        <Wand2 className="icon" />
                        Préparer mon export
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })()}
      </main>
    </div>
  );
};

export default App;




