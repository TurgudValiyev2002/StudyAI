const STORAGE_KEY = "studyai_state_v1";
const DEPLOYED_STUDYAI_API_URL = window.STUDYAI_API_URL || "";
const IS_LOCAL_HOST = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const STUDYAI_API_URL = DEPLOYED_STUDYAI_API_URL || (IS_LOCAL_HOST ? "/api/studyai" : "");


const state = loadState();
normalizeState();
let currentExam = null;
let timerId = null;
let remainingSeconds = 0;
let assignmentPlan = [];
let visibleAssignmentSteps = 0;
let latestStudySession = null;
let chatMessages = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const LANGUAGES = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  tr: "Türkçe"
};

const TRANSLATIONS = {
  en: {
    languageEyebrow: "Before StudyAI opens",
    languageTitle: "The tiny study coach is warming up.",
    languageFunny: "This animal has read zero pages today, but somehow still looks confident.",
    languagePrompt: "Select your language for learning.",
    enterApp: "Open StudyAI",
    languageButton: "Language",
    brandSubtitle: "Adaptive study workspace",
    currentClass: "Current class",
    newClass: "New Class",
    startStudySession: "Start Study Session",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    navDashboard: "Dashboard",
    navClasses: "Classes",
    navMaterials: "Materials",
    navStudy: "Daily Prep",
    navExamBuilder: "Exam Builder",
    navAssignments: "Assignments",
    navStatistics: "Statistics",
    navAbout: "About",
    navContact: "Contact",
    navSettings: "Settings",
    appEyebrow: "Personal AI study, exam, and assignment tutor",
    heroEyebrow: "Dear Turgud, build target",
    heroTitle: "StudyAI remembers each class, learns from materials, creates exams, and teaches assignments step by step.",
    heroText: "The first version below is a functional prototype. It uses local persistence now, and its structure is ready for Firebase Auth, Firestore, Storage, and a RAG backend.",
    todayFocusLabel: "Today focus",
    createFirstClass: "Create your first class",
    uploadOrStart: "Then upload materials or start without material.",
    continueClass: "Continue {name}",
    goalTopics: "Goal: {goal}. Topics: {topics}.",
    notDefined: "not defined",
    metricClasses: "Classes",
    metricMaterials: "Materials",
    metricExams: "Exams Taken",
    metricScore: "Average Score",
    continueLearning: "Continue Learning",
    openPrep: "Open Prep",
    aiRecommendations: "AI Recommendations",
    refresh: "Refresh",
    noSessions: "No sessions yet. Start a daily preparation session.",
    courseMemory: "Course memory",
    addClass: "Add Class",
    ragLibrary: "RAG-ready library",
    classLabel: "Class",
    materialType: "Material type",
    lectureSlides: "Lecture slides",
    bookChapter: "Book chapter",
    assignmentSheet: "Assignment sheet",
    pastExam: "Past exam",
    notes: "Notes",
    uploadFiles: "Upload files",
    materialNotesPlaceholder: "Optional: chapter, lecture number, important topics...",
    saveMaterials: "Save Materials",
    noMaterials: "No materials yet. Upload slides, books, notes, or assignment sheets.",
    dailyClassPreparation: "Daily Class Preparation",
    tutorMode: "Tutor Mode",
    topic: "Topic",
    topicPlaceholder: "Example: CNNs, backpropagation, database indexing",
    materialMode: "Material mode",
    withMaterials: "With materials",
    withoutMaterials: "Without materials",
    knowledgeLevel: "Knowledge level",
    startFromScratch: "Start from scratch",
    knowBasics: "I know basics",
    advancedLearner: "Advanced learner",
    explanation: "Explanation",
    simpleLanguage: "Simple language",
    mediumLevel: "Medium level",
    academicLevel: "Academic level",
    sessionLength: "Session length",
    minutes15: "15 minutes",
    minutes30: "30 minutes",
    minutes60: "60 minutes",
    generatePreparation: "Generate Preparation",
    preparationPlan: "Preparation Plan",
    save: "Save",
    startAiChatbot: "Start AI Chatbot",
    studyOutputEmpty: "Choose a class and topic. StudyAI will build a compact lesson, examples, mistakes, and practice questions.",
    preparationChatbot: "Preparation chatbot",
    askFollowUp: "Ask follow-up questions",
    chatPlaceholder: "Ask about this preparation plan...",
    send: "Send",
    examConfiguration: "Exam Configuration",
    adaptive: "Adaptive",
    topics: "Topics",
    topicsPlaceholder: "Comma separated topics",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    veryHard: "Very hard",
    durationMinutes: "Duration minutes",
    singleChoice: "Single choice",
    multipleChoice: "Multiple choice",
    openTheory: "Open theory",
    codingPractical: "Coding/practical",
    extraRules: "Extra teacher rules",
    extraRulesPlaceholder: "Example: focus on definitions, include calculation, no code, use uploaded slides only...",
    createExamSheet: "Create Exam Sheet",
    generatedExam: "Generated Exam",
    startExam: "Start Exam",
    noExamYet: "No exam generated yet.",
    practicalExamMode: "Practical exam mode",
    submitExam: "Submit Exam",
    afterSubmission: "After submission",
    resultsRecovery: "Results and Recovery Plan",
    assignmentSession: "Assignment Session",
    guided: "Guided",
    assignmentTitle: "Assignment title",
    assignmentTitlePlaceholder: "Example: Implement CNN classifier",
    courseDetails: "Course details",
    courseDetailsPlaceholder: "Paste requirements, rules, expected output, language, deadline...",
    mode: "Mode",
    guidedSolution: "Guided solution",
    hintMode: "Hint mode",
    debugCode: "Debug my code",
    finalReview: "Final review",
    createStepPlan: "Create Step Plan",
    stepWorkspace: "Step-by-Step Workspace",
    nextStep: "Next Step",
    assignmentStepsEmpty: "Create an assignment plan. StudyAI will reveal one useful part at a time, with explanation beside the code or answer.",
    learningAnalytics: "Learning analytics",
    aiStudyProject: "AI study project",
    aboutTitle: "About this website",
    aboutText: "StudyAI is a personal AI learning workspace for preparing daily classes, final exams, and assignments in a more organized way. It lets users create classes, add study materials, choose whether they want to study with or without materials, select simple, medium, or academic explanations, generate preparation plans, practice exams, and step-by-step assignment sessions. The goal is not only to get answers, but to understand the topic, test knowledge, discover weak areas, and recover them with clear recommendations. I am Turgud Valiyev, and I created this website as an AI education project to support structured learning, exam preparation, and practical coding study.",
    prepare: "Prepare",
    prepareText: "Create class-based study sessions with the right explanation level and prerequisite support.",
    practice: "Practice",
    practiceText: "Generate timed exams with different question styles, difficulty levels, and result feedback.",
    improve: "Improve",
    improveText: "Use statistics, weak-topic signals, and guided assignment steps to learn more deeply.",
    contactTitle: "Contact Turgud Valiyev",
    contactText: "For questions, research discussion, collaboration, or feedback about StudyAI, use the contact channels below.",
    mail: "Mail",
    phone: "Phone",
    localPrototype: "Local prototype",
    yourName: "Your name",
    defaultExplanation: "Default explanation level",
    defaultDifficulty: "Default exam difficulty",
    aiBackendEndpoint: "AI backend endpoint",
    saveSettings: "Save Settings",
    className: "Class name",
    level: "Level",
    bachelor: "Bachelor",
    master: "Master",
    phd: "PhD",
    professional: "Professional",
    mainGoal: "Main goal",
    finalExamPreparation: "Final exam preparation",
    assignmentsCoding: "Assignments and coding",
    researchReading: "Research reading",
    mainTopics: "Main topics",
    mainTopicsPlaceholder: "Comma separated: CNN, RNN, transformers...",
    createClass: "Create Class",
    submitExamQuestion: "Submit exam?",
    submitExamWarning: "The exam will end and no modifications can be made anymore.",
    cancel: "Cancel",
    submit: "Submit",
    openClass: "Open Class",
    noClasses: "No classes yet.",
    classMetaTopics: "{count} topics",
    classMetaMaterials: "{count} materials",
    activeClass: "Active class",
    studySessions: "Study sessions",
    uploadedMaterials: "Uploaded materials",
    averageScore: "Average score",
    weakTopicSignal: "Weak topic signal",
    questionHistory: "Question history",
    noClass: "No class",
    notEnoughExams: "Not enough exams"
  }
};

TRANSLATIONS.de = {
  ...TRANSLATIONS.en,
  languageEyebrow: "Bevor StudyAI startet",
  languageTitle: "Der kleine Lerncoach macht sich bereit.",
  languageFunny: "Dieses Tier hat heute null Seiten gelesen, sieht aber trotzdem sehr selbstbewusst aus.",
  languagePrompt: "Wähle deine Lernsprache.",
  enterApp: "StudyAI öffnen",
  languageButton: "Sprache",
  brandSubtitle: "Adaptiver Lernarbeitsplatz",
  currentClass: "Aktuelle Klasse",
  newClass: "Neue Klasse",
  startStudySession: "Lerneinheit starten",
  darkMode: "Dunkelmodus",
  lightMode: "Hellmodus",
  navDashboard: "Dashboard",
  navClasses: "Klassen",
  navMaterials: "Materialien",
  navStudy: "Tagesvorbereitung",
  navExamBuilder: "Prüfung erstellen",
  navAssignments: "Aufgaben",
  navStatistics: "Statistik",
  navAbout: "Über",
  navContact: "Kontakt",
  navSettings: "Einstellungen",
  appEyebrow: "Persönlicher KI-Tutor für Lernen, Prüfungen und Aufgaben",
  heroTitle: "StudyAI merkt sich jede Klasse, lernt aus Materialien, erstellt Prüfungen und führt Aufgaben Schritt für Schritt.",
  heroText: "Diese Version ist ein funktionaler Prototyp. Sie nutzt lokale Speicherung und ist bereit für Firebase Auth, Firestore, Storage und ein RAG-Backend.",
  todayFocusLabel: "Heutiger Fokus",
  createFirstClass: "Erstelle deine erste Klasse",
  uploadOrStart: "Lade danach Materialien hoch oder starte ohne Material.",
  continueClass: "{name} fortsetzen",
  goalTopics: "Ziel: {goal}. Themen: {topics}.",
  metricMaterials: "Materialien",
  metricExams: "Prüfungen",
  metricScore: "Durchschnitt",
  continueLearning: "Weiterlernen",
  openPrep: "Vorbereitung öffnen",
  aiRecommendations: "KI-Empfehlungen",
  refresh: "Aktualisieren",
  noSessions: "Noch keine Sitzungen. Starte eine Tagesvorbereitung.",
  addClass: "Klasse hinzufügen",
  ragLibrary: "RAG-bereite Bibliothek",
  classLabel: "Klasse",
  materialType: "Materialtyp",
  lectureSlides: "Vorlesungsfolien",
  bookChapter: "Buchkapitel",
  assignmentSheet: "Aufgabenblatt",
  pastExam: "Alte Prüfung",
  notes: "Notizen",
  uploadFiles: "Dateien hochladen",
  saveMaterials: "Materialien speichern",
  noMaterials: "Noch keine Materialien. Lade Folien, Bücher, Notizen oder Aufgabenblätter hoch.",
  dailyClassPreparation: "Tagesvorbereitung",
  tutorMode: "Tutor-Modus",
  topic: "Thema",
  materialMode: "Materialmodus",
  withMaterials: "Mit Materialien",
  withoutMaterials: "Ohne Materialien",
  knowledgeLevel: "Vorwissen",
  startFromScratch: "Von Grund auf starten",
  knowBasics: "Ich kenne die Grundlagen",
  advancedLearner: "Fortgeschritten",
  explanation: "Erklärung",
  simpleLanguage: "Einfache Sprache",
  mediumLevel: "Mittleres Niveau",
  academicLevel: "Akademisches Niveau",
  sessionLength: "Sitzungslänge",
  generatePreparation: "Vorbereitung erstellen",
  preparationPlan: "Vorbereitungsplan",
  save: "Speichern",
  startAiChatbot: "KI-Chatbot starten",
  send: "Senden",
  examConfiguration: "Prüfungskonfiguration",
  adaptive: "Adaptiv",
  topics: "Themen",
  difficulty: "Schwierigkeit",
  easy: "Einfach",
  medium: "Mittel",
  hard: "Schwer",
  veryHard: "Sehr schwer",
  durationMinutes: "Dauer in Minuten",
  singleChoice: "Einzelauswahl",
  multipleChoice: "Mehrfachauswahl",
  openTheory: "Offene Theorie",
  codingPractical: "Coding/Praxis",
  createExamSheet: "Prüfungsblatt erstellen",
  generatedExam: "Erstellte Prüfung",
  startExam: "Prüfung starten",
  noExamYet: "Noch keine Prüfung erstellt.",
  submitExam: "Prüfung abgeben",
  assignmentSession: "Aufgabensitzung",
  guided: "Geführt",
  createStepPlan: "Schrittplan erstellen",
  stepWorkspace: "Schritt-für-Schritt-Arbeitsbereich",
  nextStep: "Nächster Schritt",
  learningAnalytics: "Lernanalyse",
  aboutTitle: "Über diese Website",
  prepare: "Vorbereiten",
  practice: "Üben",
  improve: "Verbessern",
  contactTitle: "Kontakt zu Turgud Valiyev",
  contactText: "Für Fragen, Forschungsgespräche, Zusammenarbeit oder Feedback zu StudyAI nutze die folgenden Kontaktkanäle.",
  phone: "Telefon",
  saveSettings: "Einstellungen speichern",
  createClass: "Klasse erstellen",
  openClass: "Klasse öffnen",
  noClasses: "Noch keine Klassen."
};

TRANSLATIONS.ru = {
  ...TRANSLATIONS.en,
  languageEyebrow: "Перед запуском StudyAI",
  languageTitle: "Маленький учебный тренер разогревается.",
  languageFunny: "Это животное сегодня не прочитало ни одной страницы, но выглядит очень уверенно.",
  languagePrompt: "Выберите язык для обучения.",
  enterApp: "Открыть StudyAI",
  languageButton: "Язык",
  brandSubtitle: "Адаптивное учебное пространство",
  currentClass: "Текущий класс",
  newClass: "Новый класс",
  startStudySession: "Начать обучение",
  darkMode: "Темная тема",
  lightMode: "Светлая тема",
  navDashboard: "Панель",
  navClasses: "Классы",
  navMaterials: "Материалы",
  navStudy: "Подготовка",
  navExamBuilder: "Экзамен",
  navAssignments: "Задания",
  navStatistics: "Статистика",
  navAbout: "О проекте",
  navContact: "Контакты",
  navSettings: "Настройки",
  appEyebrow: "Персональный AI tutor для учебы, экзаменов и заданий",
  heroTitle: "StudyAI запоминает каждый класс, использует материалы, создает экзамены и ведет задания пошагово.",
  heroText: "Это функциональный прототип. Сейчас он использует локальное хранение и готов к Firebase Auth, Firestore, Storage и RAG backend.",
  todayFocusLabel: "Фокус сегодня",
  createFirstClass: "Создайте первый класс",
  uploadOrStart: "Затем загрузите материалы или начните без них.",
  metricMaterials: "Материалы",
  metricExams: "Экзамены",
  metricScore: "Средний балл",
  continueLearning: "Продолжить обучение",
  openPrep: "Открыть подготовку",
  aiRecommendations: "AI-рекомендации",
  refresh: "Обновить",
  noSessions: "Сессий пока нет. Начните подготовку.",
  addClass: "Добавить класс",
  classLabel: "Класс",
  materialType: "Тип материала",
  lectureSlides: "Слайды лекции",
  bookChapter: "Глава книги",
  assignmentSheet: "Лист задания",
  pastExam: "Прошлый экзамен",
  notes: "Заметки",
  uploadFiles: "Загрузить файлы",
  saveMaterials: "Сохранить материалы",
  dailyClassPreparation: "Подготовка к занятию",
  tutorMode: "Режим tutor",
  topic: "Тема",
  materialMode: "Режим материалов",
  withMaterials: "С материалами",
  withoutMaterials: "Без материалов",
  knowledgeLevel: "Уровень знаний",
  startFromScratch: "Начать с нуля",
  knowBasics: "Я знаю основы",
  advancedLearner: "Продвинутый уровень",
  explanation: "Объяснение",
  simpleLanguage: "Простой язык",
  mediumLevel: "Средний уровень",
  academicLevel: "Академический уровень",
  generatePreparation: "Создать подготовку",
  preparationPlan: "План подготовки",
  save: "Сохранить",
  startAiChatbot: "Запустить AI чат",
  send: "Отправить",
  examConfiguration: "Настройка экзамена",
  difficulty: "Сложность",
  easy: "Легко",
  medium: "Средне",
  hard: "Сложно",
  veryHard: "Очень сложно",
  createExamSheet: "Создать экзамен",
  generatedExam: "Созданный экзамен",
  startExam: "Начать экзамен",
  submitExam: "Сдать экзамен",
  assignmentSession: "Сессия задания",
  createStepPlan: "Создать план шагов",
  stepWorkspace: "Пошаговая работа",
  nextStep: "Следующий шаг",
  learningAnalytics: "Аналитика обучения",
  aboutTitle: "Об этом сайте",
  prepare: "Готовиться",
  practice: "Практиковаться",
  improve: "Улучшаться",
  contactTitle: "Связаться с Turgud Valiyev",
  phone: "Телефон",
  saveSettings: "Сохранить настройки",
  createClass: "Создать класс",
  openClass: "Открыть класс",
  noClasses: "Классов пока нет."
};

TRANSLATIONS.tr = {
  ...TRANSLATIONS.en,
  languageEyebrow: "StudyAI açılmadan önce",
  languageTitle: "Küçük çalışma koçu hazırlanıyor.",
  languageFunny: "Bu hayvan bugün sıfır sayfa okudu ama yine de çok özgüvenli görünüyor.",
  languagePrompt: "Öğrenme dilini seç.",
  enterApp: "StudyAI'ı Aç",
  languageButton: "Dil",
  brandSubtitle: "Uyarlanabilir çalışma alanı",
  currentClass: "Aktif ders",
  newClass: "Yeni Ders",
  startStudySession: "Çalışma Başlat",
  darkMode: "Karanlık mod",
  lightMode: "Aydınlık mod",
  navDashboard: "Panel",
  navClasses: "Dersler",
  navMaterials: "Materyaller",
  navStudy: "Günlük Hazırlık",
  navExamBuilder: "Sınav Oluştur",
  navAssignments: "Ödevler",
  navStatistics: "İstatistik",
  navAbout: "Hakkında",
  navContact: "İletişim",
  navSettings: "Ayarlar",
  appEyebrow: "Kişisel AI çalışma, sınav ve ödev asistanı",
  heroTitle: "StudyAI her dersi hatırlar, materyallerden öğrenir, sınav oluşturur ve ödevleri adım adım öğretir.",
  heroText: "Bu ilk sürüm çalışan bir prototiptir. Şimdilik local storage kullanır ve Firebase Auth, Firestore, Storage ve RAG backend için hazırdır.",
  todayFocusLabel: "Bugünkü odak",
  createFirstClass: "İlk dersini oluştur",
  uploadOrStart: "Sonra materyal yükle veya materyalsiz başla.",
  metricMaterials: "Materyaller",
  metricExams: "Sınavlar",
  metricScore: "Ortalama skor",
  continueLearning: "Öğrenmeye Devam Et",
  openPrep: "Hazırlığı Aç",
  aiRecommendations: "AI Önerileri",
  refresh: "Yenile",
  noSessions: "Henüz oturum yok. Günlük hazırlık başlat.",
  addClass: "Ders Ekle",
  courseMemory: "Ders hafızası",
  ragLibrary: "RAG hazır kütüphane",
  classLabel: "Ders",
  materialType: "Materyal türü",
  lectureSlides: "Ders slaytları",
  bookChapter: "Kitap bölümü",
  assignmentSheet: "Ödev kağıdı",
  pastExam: "Geçmiş sınav",
  notes: "Notlar",
  uploadFiles: "Dosya yükle",
  saveMaterials: "Materyalleri Kaydet",
  noMaterials: "Henüz materyal yok. Slayt, kitap, not veya ödev kağıdı yükle.",
  dailyClassPreparation: "Günlük Ders Hazırlığı",
  tutorMode: "Tutor Modu",
  topic: "Konu",
  materialMode: "Materyal modu",
  withMaterials: "Materyallerle",
  withoutMaterials: "Materyalsiz",
  knowledgeLevel: "Bilgi seviyesi",
  startFromScratch: "Sıfırdan başla",
  knowBasics: "Temelleri biliyorum",
  advancedLearner: "İleri seviye",
  explanation: "Açıklama",
  simpleLanguage: "Basit dil",
  mediumLevel: "Orta seviye",
  academicLevel: "Akademik seviye",
  sessionLength: "Oturum süresi",
  generatePreparation: "Hazırlık Oluştur",
  preparationPlan: "Hazırlık Planı",
  save: "Kaydet",
  startAiChatbot: "AI Chatbot Başlat",
  send: "Gönder",
  examConfiguration: "Sınav Ayarları",
  adaptive: "Uyarlanabilir",
  topics: "Konular",
  difficulty: "Zorluk",
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
  veryHard: "Çok zor",
  durationMinutes: "Süre dakika",
  singleChoice: "Tek seçim",
  multipleChoice: "Çoklu seçim",
  openTheory: "Açık teori",
  codingPractical: "Kodlama/pratik",
  createExamSheet: "Sınav Kağıdı Oluştur",
  generatedExam: "Oluşturulan Sınav",
  startExam: "Sınavı Başlat",
  noExamYet: "Henüz sınav oluşturulmadı.",
  submitExam: "Sınavı Gönder",
  assignmentSession: "Ödev Oturumu",
  guided: "Rehberli",
  assignmentTitle: "Ödev başlığı",
  courseDetails: "Ders detayları",
  mode: "Mod",
  guidedSolution: "Rehberli çözüm",
  hintMode: "İpucu modu",
  debugCode: "Kodumu debug et",
  finalReview: "Final kontrol",
  createStepPlan: "Adım Planı Oluştur",
  stepWorkspace: "Adım Adım Çalışma Alanı",
  nextStep: "Sonraki Adım",
  learningAnalytics: "Öğrenme analitiği",
  aboutTitle: "Bu web sitesi hakkında",
  prepare: "Hazırlan",
  practice: "Pratik yap",
  improve: "Geliştir",
  contactTitle: "Turgud Valiyev ile iletişim",
  phone: "Telefon",
  saveSettings: "Ayarları Kaydet",
  createClass: "Ders Oluştur",
  openClass: "Dersi Aç",
  noClasses: "Henüz ders yok."
};

const topicBank = {
  ai: ["machine learning", "deep learning", "neural networks", "computer vision", "llms", "rag", "federated learning", "edge ai"],
  cs: ["algorithms", "databases", "operating systems", "distributed systems", "software engineering", "security"],
  math: ["linear algebra", "probability", "optimization", "calculus", "statistics"]
};

const templates = {
  single: [
    "Which statement best describes {topic}?",
    "What is the main purpose of {topic} in a real system?",
    "Which option is the strongest assumption behind {topic}?"
  ],
  multiple: [
    "Select all true statements about {topic}.",
    "Which components are usually important when applying {topic}?",
    "Which mistakes can damage a {topic} solution?"
  ],
  open: [
    "Explain {topic} using a clear example.",
    "Compare {topic} with a related method and discuss limitations.",
    "Why can {topic} fail in practice, and how would you diagnose the failure?"
  ],
  coding: [
    "Design a small implementation plan for a project using {topic}.",
    "Write pseudocode for the core steps of {topic}.",
    "Given noisy data, describe how you would build and evaluate a {topic} pipeline."
  ]
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  return {
    settings: {
      name: "Dear Turgud",
      explanation: "Medium level",
      difficulty: "Medium",
      theme: "light",
      aiEndpoint: STUDYAI_API_URL
    },
    activeClassId: "class-ml",
    classes: [
      {
        id: "class-ml",
        name: "Machine Learning",
        level: "PhD",
        goal: "Final exam preparation",
        topics: ["supervised learning", "regularization", "neural networks", "evaluation"],
        createdAt: new Date().toISOString()
      }
    ],
    materials: [],
    sessions: [],
    exams: [],
    questionHistory: [],
    assignments: []
  };
}

function normalizeState() {
  state.settings ||= {};
  if (!state.settings.language) state.settings.language = "en";
  if (!IS_LOCAL_HOST && state.settings.aiEndpoint === "/api/studyai") {
    state.settings.aiEndpoint = STUDYAI_API_URL;
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentLanguage() {
  return TRANSLATIONS[state.settings.language] ? state.settings.language : "en";
}

function t(key, replacements = {}) {
  const dictionary = TRANSLATIONS[currentLanguage()] || TRANSLATIONS.en;
  let value = dictionary[key] || TRANSLATIONS.en[key] || key;
  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, replacement);
  });
  return value;
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage();
  $$("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  $$("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });

  const languageSelect = $("#languageSelect");
  if (languageSelect) languageSelect.value = currentLanguage();
  const languageButton = $("#languageButton");
  if (languageButton) languageButton.textContent = `${t("languageButton")}: ${LANGUAGES[currentLanguage()]}`;
}

function showLanguageGate() {
  applyTranslations();
  $("#languageGate")?.classList.remove("closing", "hidden");
  document.body.classList.add("language-open");
}

function closeLanguageGate() {
  const gate = $("#languageGate");
  if (!gate) return;
  gate.classList.add("closing");
  document.body.classList.remove("language-open");
  document.body.classList.add("language-restarting");
  setTimeout(() => {
    gate.classList.add("hidden");
    gate.classList.remove("closing");
    document.body.classList.remove("language-restarting");
  }, 720);
}

function chooseLanguage(language) {
  state.settings.language = TRANSLATIONS[language] ? language : "en";
  state.settings.languageSelected = true;
  latestStudySession = null;
  chatMessages = [];
  saveState();
  renderAll();
  setView("dashboard");
  closeLanguageGate();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function activeClass() {
  return state.classes.find((item) => item.id === state.activeClassId) || state.classes[0];
}

function setView(viewName) {
  $$(".view").forEach((view) => view.classList.remove("active"));
  $(`#${viewName}View`)?.classList.add("active");

  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  const titleKey = {
    dashboard: "navDashboard",
    classes: "navClasses",
    materials: "navMaterials",
    study: "navStudy",
    examBuilder: "navExamBuilder",
    examRoom: "navExamBuilder",
    results: "resultsRecovery",
    assignments: "navAssignments",
    statistics: "navStatistics",
    about: "navAbout",
    contact: "navContact",
    settings: "navSettings"
  }[viewName] || "StudyAI";
  $("#pageTitle").textContent = titleKey === "StudyAI" ? "StudyAI" : t(titleKey);
}

function hydrateClassSelects() {
  const options = state.classes.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  ["#activeClassSelect", "#materialClass", "#studyClass", "#examClass", "#assignmentClass"].forEach((selector) => {
    const select = $(selector);
    if (!select) return;
    select.innerHTML = options || "<option>No classes yet</option>";
    select.value = state.activeClassId;
  });
}


function studyContext(extra = {}) {
  const cls = activeClass();
  const classMaterials = state.materials.filter((item) => item.classId === cls?.id);
  return {
    user: state.settings.name,
    activeClass: cls,
    materials: classMaterials,
    recentSessions: state.sessions.filter((item) => item.classId === cls?.id).slice(-6),
    recentExams: state.exams.filter((item) => item.classId === cls?.id).slice(-5),
    questionHistory: state.questionHistory.slice(-40),
    weakTopics: findWeakTopics().slice(0, 8),
    note: "This frontend stores material metadata locally. True RAG requires backend document parsing, embeddings, and vector retrieval.",
    ...extra
  };
}

async function callStudyAI(task, context) {
  const endpoint = String(state.settings.aiEndpoint || STUDYAI_API_URL || "").trim();
  if (!endpoint) {
    throw new Error("Hosted AI backend is not connected yet. Deploy StudyAI on Vercel, then paste the /api/studyai URL in Settings.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, context })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.reason || data.error || `StudyAI backend failed with ${response.status}`);
  }
  return data;
}

function renderAIText(text) {
  const escaped = escapeHtml(text || "");
  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^[-*] /m.test(trimmed)) {
        const items = trimmed.split("\n").map((line) => line.replace(/^[-*] /, "").trim()).filter(Boolean);
        return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
      }
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

function normalizeAIExam(config, aiExam) {
  if (!aiExam?.questions?.length) return null;
  return {
    id: uid("exam"),
    classId: config.classId,
    topics: config.topics.length ? config.topics : activeClass()?.topics || ["general course topic"],
    difficulty: config.difficulty,
    duration: config.duration,
    rules: config.rules,
    createdAt: new Date().toISOString(),
    submitted: false,
    score: 0,
    aiGenerated: true,
    questions: aiExam.questions.map((question) => ({
      id: uid("q"),
      type: ["single", "multiple", "open", "coding"].includes(question.type) ? question.type : "open",
      topic: String(question.topic || "course topic"),
      difficulty: String(question.difficulty || config.difficulty),
      text: String(question.text || "Explain the selected topic."),
      options: Array.isArray(question.options) ? question.options.map(String).slice(0, 6) : [],
      correct: Array.isArray(question.correct) ? question.correct.map(Number) : Number(question.correct || 0),
      rubric: String(question.rubric || "Answer should be clear, correct, and connected to the course context.")
    }))
  };
}

function normalizeAIAssignment(payload, aiAssignment) {
  if (!aiAssignment?.steps?.length) return null;
  return aiAssignment.steps.slice(0, 8).map((step) => ({
    title: String(step.title || payload.title || "Assignment step"),
    code: String(step.code || ""),
    explain: String(step.explain || "Study this step carefully before moving forward.")
  }));
}

function markBackendStatus(target, model, fallbackReason = "") {
  const modelText = model ? `<div class="ai-status"><strong>Hosted AI response</strong><span>Model: ${escapeHtml(model)}</span></div>` : "";
  const previewText = fallbackReason ? `<div class="ai-status"><strong>Preview mode</strong><span>${escapeHtml(fallbackReason)}</span></div>` : "";
  target.insertAdjacentHTML("afterbegin", modelText || previewText);
}

function appendChatMessage(role, text) {
  chatMessages.push({ role, text, createdAt: new Date().toISOString() });
  const messages = $("#chatMessages");
  messages.insertAdjacentHTML("beforeend", `<div class="chat-message ${role}">${renderAIText(text)}</div>`);
  messages.scrollTop = messages.scrollHeight;
}

function openPreparationChat() {
  if (!latestStudySession) return;
  $("#studyChatPanel").hidden = false;
  $("#chatTopicLabel").textContent = latestStudySession.topic;
  $("#chatModelLabel").textContent = latestStudySession.model && latestStudySession.model !== "preview mode" ? latestStudySession.model : "AI tutor";

  if (!chatMessages.length) {
    appendChatMessage("ai", "I am ready. Ask me anything about this preparation plan, and I will explain it step by step.");
  }
  $("#chatInput").focus();
}

function renderAll() {
  document.body.dataset.theme = state.settings.theme;
  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    const nextTheme = state.settings.theme === "dark" ? t("lightMode") : t("darkMode");
    themeToggle.textContent = nextTheme;
    themeToggle.title = `Switch to ${nextTheme}`;
  }
  hydrateClassSelects();
  renderDashboard();
  renderClasses();
  renderMaterials();
  renderStats();
  $("#settingName").value = state.settings.name;
  $("#settingExplanation").value = state.settings.explanation;
  $("#settingDifficulty").value = state.settings.difficulty;
  if ($("#settingAiEndpoint")) $("#settingAiEndpoint").value = state.settings.aiEndpoint || STUDYAI_API_URL;
  applyTranslations();
}

function renderDashboard() {
  const examsTaken = state.exams.filter((exam) => exam.submitted);
  const average = examsTaken.length ? Math.round(examsTaken.reduce((sum, exam) => sum + exam.score, 0) / examsTaken.length) : 0;
  $("#metricClasses").textContent = state.classes.length;
  $("#metricMaterials").textContent = state.materials.length;
  $("#metricExams").textContent = examsTaken.length;
  $("#metricScore").textContent = `${average}%`;

  const cls = activeClass();
  $("#todayFocus").textContent = cls ? t("continueClass", { name: cls.name }) : t("createFirstClass");
  $("#todayFocusDetail").textContent = cls
    ? t("goalTopics", { goal: cls.goal, topics: cls.topics.slice(0, 3).join(", ") || t("notDefined") })
    : t("uploadOrStart");

  const recent = state.sessions.slice(-4).reverse();
  $("#recentSessions").innerHTML = recent.length ? recent.map((session) => `
    <article class="session-card">
      <h3>${escapeHtml(session.topic)}</h3>
      <p>${escapeHtml(session.summary)}</p>
      <div class="card-meta"><span>${escapeHtml(session.explanation)}</span><span>${new Date(session.createdAt).toLocaleDateString()}</span></div>
    </article>
  `).join("") : `<div class="empty-state">${escapeHtml(t("noSessions"))}</div>`;

  renderRecommendations();
}

function renderRecommendations() {
  const weakTopics = findWeakTopics();
  const cls = activeClass();
  const materials = state.materials.filter((item) => item.classId === cls?.id);
  const advice = [
    weakTopics.length
      ? `Recover weak topics first: ${weakTopics.slice(0, 3).join(", ")}.`
      : "Take one medium exam to create your first diagnostic baseline.",
    materials.length
      ? `You have ${materials.length} material item(s). Use material-based study before hard exams.`
      : "Upload at least lecture slides or notes so future answers can become RAG-grounded.",
    "For assignments, use guided mode first. It protects learning better than asking for a full final answer."
  ];

  $("#recommendations").innerHTML = advice.map((item) => `<article class="session-card">${escapeHtml(item)}</article>`).join("");
}

function renderClasses() {
  $("#classGrid").innerHTML = state.classes.map((item) => `
    <article class="class-card">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.goal)}</p>
      </div>
      <div class="card-meta">
        <span>${escapeHtml(item.level)}</span>
        <span>${escapeHtml(t("classMetaTopics", { count: String(item.topics.length) }))}</span>
        <span>${escapeHtml(t("classMetaMaterials", { count: String(state.materials.filter((mat) => mat.classId === item.id).length) }))}</span>
      </div>
      <button class="secondary" data-activate-class="${item.id}">${escapeHtml(t("openClass"))}</button>
    </article>
  `).join("") || `<div class="empty-state">${escapeHtml(t("noClasses"))}</div>`;
}

function renderMaterials() {
  const list = state.materials.slice().reverse();
  $("#materialsList").innerHTML = list.length ? list.map((item) => {
    const cls = state.classes.find((course) => course.id === item.classId);
    return `
      <article class="material-card">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.notes || "No extra notes.")}</p>
        <div class="card-meta">
          <span>${escapeHtml(cls?.name || "Unknown class")}</span>
          <span>${escapeHtml(item.type)}</span>
          <span>${escapeHtml(item.status)}</span>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">${escapeHtml(t("noMaterials"))}</div>`;
}

function renderStats() {
  const cls = activeClass();
  const exams = state.exams.filter((exam) => exam.classId === cls?.id && exam.submitted);
  const sessions = state.sessions.filter((session) => session.classId === cls?.id);
  const materials = state.materials.filter((item) => item.classId === cls?.id);
  const avg = exams.length ? Math.round(exams.reduce((sum, exam) => sum + exam.score, 0) / exams.length) : 0;
  const weakTopics = findWeakTopics();

  $("#statsGrid").innerHTML = [
    [t("activeClass"), cls?.name || t("noClass")],
    [t("studySessions"), sessions.length],
    [t("uploadedMaterials"), materials.length],
    [t("averageScore"), `${avg}%`],
    [t("weakTopicSignal"), weakTopics[0] || t("notEnoughExams")],
    [t("questionHistory"), state.questionHistory.length]
  ].map(([label, value]) => `
    <article class="stat-card">
      <span class="label">${escapeHtml(label)}</span>
      <h2>${escapeHtml(String(value))}</h2>
    </article>
  `).join("");
}

function createStudyPlan(payload) {
  const fromScratch = payload.knowledge === "Start from scratch";
  const materialLine = payload.materialMode === "With materials"
    ? "Use uploaded class materials first. In the backend version, this will retrieve exact chunks and citations from the vector database."
    : "Use general knowledge and clearly mark that the answer is not grounded in uploaded material.";

  const tone = {
    "Simple language": "Use everyday words, short sentences, and intuitive examples.",
    "Medium level": "Use correct technical vocabulary, but explain every important term.",
    "Academic level": "Use formal definitions, assumptions, limitations, and research-style reasoning."
  }[payload.explanation];

  return `
    <h3>1. Preparation Strategy</h3>
    <p><strong>Topic:</strong> ${escapeHtml(payload.topic)}. <strong>Mode:</strong> ${escapeHtml(payload.materialMode)}. ${escapeHtml(materialLine)}</p>
    <p><strong>Explanation rule:</strong> ${escapeHtml(tone)}</p>
    ${fromScratch ? `<h3>2. Compact Prerequisite Layer</h3><p>Before the lecture material, learn the minimum background: key vocabulary, why the problem exists, one simple example, and the common misconception students usually have.</p>` : ""}
    <h3>${fromScratch ? "3" : "2"}. Core Concept</h3>
    <p>${escapeHtml(payload.topic)} should be studied in three layers: intuition, formal mechanism, and practical failure cases. First ask what problem it solves. Then study the algorithm or structure. Finally test it on examples where it can fail.</p>
    <h3>${fromScratch ? "4" : "3"}. Example</h3>
    <p>Take one small real scenario from your class. Identify inputs, outputs, assumptions, and evaluation criteria. This forces the topic to become concrete instead of only memorized.</p>
    <h3>${fromScratch ? "5" : "4"}. Common Mistakes</h3>
    <ul>
      <li>Memorizing definitions without knowing when they fail.</li>
      <li>Ignoring assumptions behind the method.</li>
      <li>Not connecting formulas or code to the actual learning objective.</li>
    </ul>
    <h3>${fromScratch ? "6" : "5"}. Mini Practice</h3>
    <ol>
      <li>Explain ${escapeHtml(payload.topic)} in 5 sentences.</li>
      <li>Give one practical example and one limitation.</li>
      <li>Create one exam question that would test real understanding.</li>
    </ol>
  `;
}

function generateExam(config) {
  const topics = config.topics.length ? config.topics : activeClass()?.topics || ["general course topic"];
  const counts = {
    single: config.single,
    multiple: config.multiple,
    open: config.open,
    coding: config.coding
  };

  const questions = [];
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i += 1) {
      const topic = topics[(questions.length + i) % topics.length].trim() || "course topic";
      const text = uniqueQuestion(type, topic, config.difficulty);
      questions.push({
        id: uid("q"),
        type,
        topic,
        difficulty: config.difficulty,
        text,
        options: type === "single" || type === "multiple" ? buildOptions(topic) : [],
        correct: type === "multiple" ? [0, 2] : 0,
        rubric: buildRubric(type, topic)
      });
    }
  });

  if (!questions.length) {
    const topic = topics[0] || "course topic";
    questions.push({
      id: uid("q"),
      type: "open",
      topic,
      difficulty: config.difficulty,
      text: uniqueQuestion("open", topic, config.difficulty),
      options: [],
      correct: 0,
      rubric: buildRubric("open", topic)
    });
  }

  return {
    id: uid("exam"),
    classId: config.classId,
    topics,
    difficulty: config.difficulty,
    duration: config.duration,
    rules: config.rules,
    questions,
    createdAt: new Date().toISOString(),
    submitted: false,
    score: 0
  };
}

function uniqueQuestion(type, topic, difficulty) {
  const pool = templates[type];
  let attempt = 0;
  let text = "";
  do {
    const template = pool[(state.questionHistory.length + attempt) % pool.length];
    const variant = ["conceptual", "applied", "critical", "diagnostic"][attempt % 4];
    text = `${template.replace("{topic}", topic)} Use a ${difficulty.toLowerCase()} ${variant} style.`;
    attempt += 1;
  } while (state.questionHistory.some((old) => similarity(old.text, text) > 0.72) && attempt < 8);
  return text;
}

function buildOptions(topic) {
  return [
    `It solves a clear problem with assumptions that must be checked in ${topic}.`,
    `It is always correct regardless of data, context, or evaluation.`,
    `It can fail when assumptions, data quality, or objective functions are wrong.`,
    `It removes the need for validation or critical thinking.`
  ];
}

function buildRubric(type, topic) {
  if (type === "single") return `Correct answer should reject absolute claims and identify the main purpose of ${topic}.`;
  if (type === "multiple") return `Correct answer should select useful and failure-aware statements about ${topic}.`;
  if (type === "coding") return `Strong answer includes inputs, steps, edge cases, evaluation, and readable pseudocode.`;
  return `Strong answer defines ${topic}, gives an example, states limitations, and explains assumptions.`;
}

function similarity(a, b) {
  const left = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const right = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...left].filter((word) => right.has(word)).length;
  return intersection / Math.max(1, Math.min(left.size, right.size));
}

function renderExamPreview() {
  if (!currentExam) return;
  $("#startExamBtn").disabled = false;
  $("#examPreview").classList.remove("empty-state");
  $("#examPreview").innerHTML = `
    <div class="card-meta">
      <span>${currentExam.questions.length} questions</span>
      <span>${currentExam.duration} minutes</span>
      <span>${escapeHtml(currentExam.difficulty)}</span>
    </div>
    ${currentExam.questions.map((question, index) => `
      <article class="question-card">
        <strong>Q${index + 1}. ${escapeHtml(question.type.toUpperCase())}</strong>
        <p>${escapeHtml(question.text)}</p>
      </article>
    `).join("")}
  `;
}

function startExam() {
  if (!currentExam) return;
  setView("examRoom");
  $("#examRoomTitle").textContent = `${activeClass()?.name || "Class"} Practice Exam`;
  remainingSeconds = currentExam.duration * 60;
  renderExamRoom();
  tickTimer();
  timerId = setInterval(tickTimer, 1000);
}

function renderExamRoom() {
  $("#examAnswerForm").innerHTML = currentExam.questions.map((question, index) => `
    <article class="question-card">
      <h3>Question ${index + 1}</h3>
      <p>${escapeHtml(question.text)}</p>
      ${renderAnswerInput(question)}
    </article>
  `).join("");
}

function renderAnswerInput(question) {
  if (question.type === "single") {
    return `<div class="question-options">${question.options.map((option, index) => `
      <label><input type="radio" name="${question.id}" value="${index}">${escapeHtml(option)}</label>
    `).join("")}</div>`;
  }
  if (question.type === "multiple") {
    return `<div class="question-options">${question.options.map((option, index) => `
      <label><input type="checkbox" name="${question.id}" value="${index}">${escapeHtml(option)}</label>
    `).join("")}</div>`;
  }
  return `<textarea name="${question.id}" placeholder="Write your answer here..."></textarea>`;
}

function tickTimer() {
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  $("#examTimer").textContent = `${minutes}:${seconds}`;
  if (remainingSeconds <= 0) {
    submitExam(true);
    return;
  }
  remainingSeconds -= 1;
}

function submitExam(autoSubmitted = false) {
  if (!currentExam || currentExam.submitted) return;
  clearInterval(timerId);

  const formData = new FormData($("#examAnswerForm"));
  let earned = 0;
  const details = currentExam.questions.map((question) => {
    let correct = false;
    let answer = "";

    if (question.type === "single") {
      answer = formData.get(question.id);
      correct = answer !== null && Number(answer) === question.correct;
    } else if (question.type === "multiple") {
      answer = formData.getAll(question.id).map(Number);
      correct = arraysEqual(answer.sort(), question.correct.slice().sort());
    } else {
      answer = formData.get(question.id) || "";
      correct = gradeOpenAnswer(answer, question.topic);
    }

    if (correct) earned += 1;
    return { question, answer, correct };
  });

  currentExam.submitted = true;
  currentExam.autoSubmitted = autoSubmitted;
  currentExam.score = Math.round((earned / currentExam.questions.length) * 100);
  currentExam.details = details;
  state.exams.push(currentExam);
  state.questionHistory.push(...currentExam.questions.map((question) => ({
    text: question.text,
    topic: question.topic,
    type: question.type,
    createdAt: new Date().toISOString()
  })));
  saveState();
  renderResults(currentExam);
  renderAll();
  setView("results");
}

function gradeOpenAnswer(answer, topic) {
  const words = answer.toLowerCase();
  return answer.trim().length > 80 && (words.includes(topic.toLowerCase().split(" ")[0]) || words.includes("example") || words.includes("assumption"));
}

function renderResults(exam) {
  const weak = exam.details.filter((item) => !item.correct).map((item) => item.question.topic);
  const uniqueWeak = [...new Set(weak)];
  $("#resultOutput").innerHTML = `
    <section class="panel result-score">
      <div class="score-circle" style="--score:${exam.score}%">${exam.score}%</div>
      <div>
        <h2>${exam.autoSubmitted ? "Auto-submitted" : "Submitted"} Exam</h2>
        <p>${exam.score >= 80 ? "Strong performance. Now test harder variations." : "Good diagnostic. The recovery plan matters more than the number."}</p>
        <div class="card-meta"><span>${exam.questions.length} questions</span><span>${exam.duration} minutes</span><span>${escapeHtml(exam.difficulty)}</span></div>
      </div>
    </section>
    <section class="panel">
      <h2>AI Recovery Recommendation</h2>
      <p>${uniqueWeak.length ? `Recover these topics first: ${uniqueWeak.join(", ")}. Re-study the related slides, then create a smaller exam with only these topics.` : "No weak topic detected. Move to a harder exam or include more open questions."}</p>
    </section>
    ${exam.details.map((item, index) => `
      <article class="result-card">
        <h3>Question ${index + 1}: ${item.correct ? "Correct" : "Needs recovery"}</h3>
        <p>${escapeHtml(item.question.text)}</p>
        <p><strong>Rubric:</strong> ${escapeHtml(item.question.rubric)}</p>
      </article>
    `).join("")}
  `;
}

function buildAssignmentPlan(payload) {
  const title = payload.title || "Assignment";
  return [
    {
      title: "Understand the task",
      code: `# ${title}\n# First, rewrite the assignment in your own words.\n# Identify inputs, outputs, constraints, and grading criteria.`,
      explain: "Before coding, we must know what the teacher is actually testing. This prevents solving the wrong problem beautifully."
    },
    {
      title: "Design the solution structure",
      code: `def main():\n    data = load_data()\n    prepared = preprocess(data)\n    result = solve(prepared)\n    evaluate(result)\n\nif __name__ == "__main__":\n    main()`,
      explain: "This creates a clean skeleton. Each function has one responsibility, so debugging and explanation become easier."
    },
    {
      title: "Implement the first core part",
      code: `def preprocess(data):\n    \"\"\"Clean and validate data before the main solution.\"\"\"\n    cleaned = []\n    for item in data:\n        if item is None:\n            continue\n        cleaned.append(item)\n    return cleaned`,
      explain: "Most assignment bugs come from messy inputs. Preprocessing first gives the later algorithm stable assumptions."
    },
    {
      title: "Add evaluation and reflection",
      code: `def evaluate(result):\n    print("Result:", result)\n    # Add checks that match the assignment rubric.\n    # Explain limitations in the report or comments.`,
      explain: "A strong student does not only produce output. They verify it and explain what could fail."
    }
  ];
}

function renderAssignmentSteps() {
  const visible = assignmentPlan.slice(0, visibleAssignmentSteps);
  $("#assignmentSteps").classList.remove("empty-state");
  $("#assignmentSteps").innerHTML = visible.map((step, index) => `
    <article class="step-card">
      <h3>Step ${index + 1}: ${escapeHtml(step.title)}</h3>
      <div class="step-grid">
        <div>
          <pre><code>${escapeHtml(step.code)}</code></pre>
          <button class="secondary copy-btn" data-copy="${index}">Copy</button>
        </div>
        <p>${escapeHtml(step.explain)}</p>
      </div>
    </article>
  `).join("");
  $("#nextStepBtn").disabled = visibleAssignmentSteps >= assignmentPlan.length;
}

function findWeakTopics() {
  const counts = {};
  state.exams.forEach((exam) => {
    (exam.details || []).forEach((detail) => {
      if (!detail.correct) counts[detail.question.topic] = (counts[detail.question.topic] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([topic]) => topic);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) setView(nav.dataset.view);

  const jump = event.target.closest("[data-view-jump]");
  if (jump) setView(jump.dataset.viewJump);

  const activate = event.target.closest("[data-activate-class]");
  if (activate) {
    state.activeClassId = activate.dataset.activateClass;
    saveState();
    renderAll();
    setView("study");
  }

  const copy = event.target.closest("[data-copy]");
  if (copy) {
    navigator.clipboard.writeText(assignmentPlan[Number(copy.dataset.copy)].code);
    copy.textContent = "Copied";
    setTimeout(() => { copy.textContent = "Copy"; }, 900);
  }
});

$("#activeClassSelect").addEventListener("change", (event) => {
  state.activeClassId = event.target.value;
  saveState();
  renderAll();
});

$("#quickClassBtn").addEventListener("click", () => $("#classDialog").showModal());
$("#addClassBtn").addEventListener("click", () => $("#classDialog").showModal());
$("#newStudyBtn").addEventListener("click", () => setView("study"));

$("#themeToggle").addEventListener("click", () => {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  saveState();
  renderAll();
});

$("#languageButton").addEventListener("click", () => {
  showLanguageGate();
});

$("#languageSelect").addEventListener("change", (event) => {
  state.settings.language = event.target.value;
  saveState();
  applyTranslations();
});

$("#enterAppBtn").addEventListener("click", () => {
  chooseLanguage($("#languageSelect").value);
});

$("#classForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const item = {
    id: uid("class"),
    name: $("#className").value.trim(),
    level: $("#classLevel").value,
    goal: $("#classGoal").value,
    topics: $("#classTopics").value.split(",").map((topic) => topic.trim()).filter(Boolean),
    createdAt: new Date().toISOString()
  };
  if (!item.name) return;
  state.classes.push(item);
  state.activeClassId = item.id;
  saveState();
  $("#classDialog").close();
  event.target.reset();
  renderAll();
});

$("#materialForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const files = Array.from($("#materialFiles").files);
  const fallback = files.length ? files : [{ name: "Manual material note" }];
  fallback.forEach((file) => {
    state.materials.push({
      id: uid("material"),
      classId: $("#materialClass").value,
      name: file.name,
      type: $("#materialType").value,
      notes: $("#materialNotes").value.trim(),
      status: "Stored locally, ready for backend parsing",
      createdAt: new Date().toISOString()
    });
  });
  saveState();
  event.target.reset();
  renderAll();
});

$("#studyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#startChatBtn").disabled = true;
  $("#studyChatPanel").hidden = true;
  chatMessages = [];
  const payload = {
    classId: $("#studyClass").value,
    topic: $("#studyTopic").value.trim() || "selected course topic",
    materialMode: $("#studyMaterialMode").value,
    knowledge: $("#studyKnowledge").value,
    explanation: $("#studyExplanation").value,
    length: $("#studyLength").value
  };

  const output = $("#studyOutput");
  output.classList.remove("empty-state");
  output.innerHTML = "Preparing hosted AI lesson...";

  try {
    const result = await callStudyAI("study", studyContext({ payload }));
    latestStudySession = {
      id: uid("session"),
      ...payload,
      summary: `${payload.length} AI preparation for ${payload.topic}`,
      content: renderAIText(result.answer),
      model: result.model || "hosted AI",
      createdAt: new Date().toISOString()
    };
    output.innerHTML = latestStudySession.content;
    markBackendStatus(output, latestStudySession.model);
    $("#startChatBtn").disabled = false;
  } catch (error) {
    latestStudySession = {
      id: uid("session"),
      ...payload,
      summary: `${payload.length} preview preparation for ${payload.topic}`,
      content: createStudyPlan(payload),
      model: "preview mode",
      createdAt: new Date().toISOString()
    };
    output.innerHTML = latestStudySession.content;
    markBackendStatus(output, "", error.message);
    $("#startChatBtn").disabled = false;
  }
});

$("#saveStudyBtn").addEventListener("click", () => {
  if (!latestStudySession) return;
  state.sessions.push(latestStudySession);
  latestStudySession = null;
  saveState();
  renderAll();
});

$("#startChatBtn").addEventListener("click", openPreparationChat);

$("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  const question = input.value.trim();
  if (!question || !latestStudySession) return;

  input.value = "";
  appendChatMessage("user", question);
  appendChatMessage("ai", "Thinking...");
  const thinkingNode = $("#chatMessages").lastElementChild;

  try {
    const result = await callStudyAI("study_chat", studyContext({
      activePreparation: {
        topic: latestStudySession.topic,
        summary: latestStudySession.summary,
        content: latestStudySession.content.replace(/<[^>]+>/g, " ")
      },
      chatMessages: chatMessages.slice(-10),
      question
    }));
    thinkingNode.innerHTML = renderAIText(result.answer);
    $("#chatModelLabel").textContent = result.model || "Hosted AI";
  } catch (error) {
    thinkingNode.innerHTML = renderAIText(`The hosted AI backend is not connected yet, so I cannot answer as a real chatbot from GitHub Pages. Connect the Vercel endpoint in Settings, then ask again. Technical reason: ${error.message}`);
  }
});

$("#examForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const config = {
    classId: $("#examClass").value,
    topics: $("#examTopics").value.split(",").map((topic) => topic.trim()).filter(Boolean),
    difficulty: $("#examDifficulty").value,
    duration: Math.max(5, Number($("#examDuration").value) || 30),
    single: Number($("#singleCount").value) || 0,
    multiple: Number($("#multipleCount").value) || 0,
    open: Number($("#openCount").value) || 0,
    coding: Number($("#codingCount").value) || 0,
    rules: $("#examRules").value.trim()
  };

  const preview = $("#examPreview");
  preview.classList.remove("empty-state");
  preview.innerHTML = "Generating hosted AI exam...";

  try {
    const result = await callStudyAI("exam", studyContext({ config }));
    currentExam = normalizeAIExam(config, result.exam) || generateExam(config);
    currentExam.model = result.model || "hosted AI";
  } catch (error) {
    currentExam = generateExam(config);
    currentExam.model = "local heuristic fallback";
    currentExam.fallbackReason = error.message;
  }

  renderExamPreview();
  if (currentExam.model) markBackendStatus($("#examPreview"), currentExam.model === "local heuristic fallback" ? "" : currentExam.model, currentExam.fallbackReason || "");
});

$("#startExamBtn").addEventListener("click", startExam);

$("#submitExamBtn").addEventListener("click", (event) => {
  event.preventDefault();
  $("#confirmDialog").showModal();
});

$("#confirmDialog").addEventListener("close", () => {
  if ($("#confirmDialog").returnValue === "confirm") submitExam(false);
});

$("#assignmentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    classId: $("#assignmentClass").value,
    title: $("#assignmentTitle").value.trim(),
    details: $("#assignmentDetails").value.trim(),
    mode: $("#assignmentMode").value
  };

  const steps = $("#assignmentSteps");
  steps.classList.remove("empty-state");
  steps.innerHTML = "Preparing hosted AI step plan...";

  let model = "local heuristic fallback";
  try {
    const result = await callStudyAI("assignment", studyContext({ payload }));
    assignmentPlan = normalizeAIAssignment(payload, result.assignment) || buildAssignmentPlan(payload);
    model = result.model || "hosted AI";
  } catch (error) {
    assignmentPlan = buildAssignmentPlan(payload);
    model = `local heuristic fallback: ${error.message}`;
  }

  visibleAssignmentSteps = 1;
  state.assignments.push({ id: uid("assignment"), ...payload, model, createdAt: new Date().toISOString() });
  saveState();
  renderAssignmentSteps();
});

$("#nextStepBtn").addEventListener("click", () => {
  visibleAssignmentSteps += 1;
  renderAssignmentSteps();
});

$("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings.name = $("#settingName").value.trim() || "Dear Turgud";
  state.settings.explanation = $("#settingExplanation").value;
  state.settings.difficulty = $("#settingDifficulty").value;
  state.settings.aiEndpoint = $("#settingAiEndpoint")?.value.trim() || STUDYAI_API_URL;
  saveState();
  renderAll();
});

$("#refreshAdviceBtn").addEventListener("click", renderRecommendations);

renderAll();
if (!state.settings.languageSelected) {
  showLanguageGate();
} else {
  $("#languageGate")?.classList.add("hidden");
}
