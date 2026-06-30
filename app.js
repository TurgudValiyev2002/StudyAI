const STORAGE_KEY = "studyai_state_v1";
const STUDYAI_API_URL = window.STUDYAI_API_URL || "/api/studyai";


const state = loadState();
let currentExam = null;
let timerId = null;
let remainingSeconds = 0;
let assignmentPlan = [];
let visibleAssignmentSteps = 0;
let latestStudySession = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  $("#pageTitle").textContent = {
    dashboard: "Dashboard",
    classes: "Classes",
    materials: "Materials",
    study: "Daily Preparation",
    examBuilder: "Exam Builder",
    examRoom: "Final Exam",
    results: "Results",
    assignments: "Assignments",
    statistics: "Statistics",
    settings: "Settings"
  }[viewName] || "StudyAI";
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
  const response = await fetch(state.settings.aiEndpoint || STUDYAI_API_URL, {
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
  const modelText = model ? `<div class="card-meta"><span>Model: ${escapeHtml(model)}</span><span>Hosted AI</span></div>` : "";
  const fallbackText = fallbackReason ? `<div class="card-meta"><span>Local fallback</span><span>${escapeHtml(fallbackReason)}</span></div>` : "";
  target.insertAdjacentHTML("afterbegin", modelText || fallbackText);
}

function renderAll() {
  document.body.dataset.theme = state.settings.theme;
  hydrateClassSelects();
  renderDashboard();
  renderClasses();
  renderMaterials();
  renderStats();
  $("#settingName").value = state.settings.name;
  $("#settingExplanation").value = state.settings.explanation;
  $("#settingDifficulty").value = state.settings.difficulty;
  if ($("#settingAiEndpoint")) $("#settingAiEndpoint").value = state.settings.aiEndpoint || STUDYAI_API_URL;
}

function renderDashboard() {
  const examsTaken = state.exams.filter((exam) => exam.submitted);
  const average = examsTaken.length ? Math.round(examsTaken.reduce((sum, exam) => sum + exam.score, 0) / examsTaken.length) : 0;
  $("#metricClasses").textContent = state.classes.length;
  $("#metricMaterials").textContent = state.materials.length;
  $("#metricExams").textContent = examsTaken.length;
  $("#metricScore").textContent = `${average}%`;

  const cls = activeClass();
  $("#todayFocus").textContent = cls ? `Continue ${cls.name}` : "Create your first class";
  $("#todayFocusDetail").textContent = cls ? `Goal: ${cls.goal}. Topics: ${cls.topics.slice(0, 3).join(", ") || "not defined"}.` : "Then upload materials or start without material.";

  const recent = state.sessions.slice(-4).reverse();
  $("#recentSessions").innerHTML = recent.length ? recent.map((session) => `
    <article class="session-card">
      <h3>${escapeHtml(session.topic)}</h3>
      <p>${escapeHtml(session.summary)}</p>
      <div class="card-meta"><span>${escapeHtml(session.explanation)}</span><span>${new Date(session.createdAt).toLocaleDateString()}</span></div>
    </article>
  `).join("") : `<div class="empty-state">No sessions yet. Start a daily preparation session.</div>`;

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
        <span>${item.topics.length} topics</span>
        <span>${state.materials.filter((mat) => mat.classId === item.id).length} materials</span>
      </div>
      <button class="secondary" data-activate-class="${item.id}">Open Class</button>
    </article>
  `).join("") || `<div class="empty-state">No classes yet.</div>`;
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
  }).join("") : `<div class="empty-state">No materials yet. Upload slides, books, notes, or assignment sheets.</div>`;
}

function renderStats() {
  const cls = activeClass();
  const exams = state.exams.filter((exam) => exam.classId === cls?.id && exam.submitted);
  const sessions = state.sessions.filter((session) => session.classId === cls?.id);
  const materials = state.materials.filter((item) => item.classId === cls?.id);
  const avg = exams.length ? Math.round(exams.reduce((sum, exam) => sum + exam.score, 0) / exams.length) : 0;
  const weakTopics = findWeakTopics();

  $("#statsGrid").innerHTML = [
    ["Active class", cls?.name || "No class"],
    ["Study sessions", sessions.length],
    ["Uploaded materials", materials.length],
    ["Average score", `${avg}%`],
    ["Weak topic signal", weakTopics[0] || "Not enough exams"],
    ["Question history", state.questionHistory.length]
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
  } catch (error) {
    latestStudySession = {
      id: uid("session"),
      ...payload,
      summary: `${payload.length} local preparation for ${payload.topic}`,
      content: createStudyPlan(payload),
      model: "local heuristic fallback",
      createdAt: new Date().toISOString()
    };
    output.innerHTML = latestStudySession.content;
    markBackendStatus(output, "", error.message);
  }
});

$("#saveStudyBtn").addEventListener("click", () => {
  if (!latestStudySession) return;
  state.sessions.push(latestStudySession);
  latestStudySession = null;
  saveState();
  renderAll();
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
