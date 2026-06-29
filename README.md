# StudyAI

StudyAI is a personal AI learning workspace for daily class preparation, final exam practice, assignment guidance, uploaded-material study, and learning analytics.

This first version is a local static prototype. It already includes the main product flows and stores data in `localStorage`. The architecture is intentionally ready for a later backend:

- Firebase Authentication for users.
- Firestore for classes, sessions, exams, assignments, and statistics.
- Firebase Storage for uploaded course materials.
- Vercel serverless API for AI tutoring, exam generation, grading, and assignment guidance.
- Vector database for RAG over books, slides, notes, past exams, and assignment documents.

## Current Prototype Features

- Create and switch between classes.
- Add material records for lectures, books, notes, assignments, and past exams.
- Generate daily class preparation plans.
- Select material-based or non-material study.
- Select knowledge level: start from scratch, basics, or advanced.
- Select explanation level: simple, medium, or academic.
- Build exams with configurable question counts, duration, topics, and difficulty.
- Timed exam room with countdown and submit confirmation.
- Auto-submit when time finishes.
- Result page with score, rubric feedback, weak topics, and recovery plan.
- Assignment/coding session with step-by-step reveal and copy buttons.
- Dashboard metrics, recommendations, statistics, and dark/light theme.
- Local question history to reduce repeated generated questions.

## Suggested Next Engineering Phases

1. Add Firebase login/register and user-specific data.
2. Replace local material records with real file upload to Firebase Storage.
3. Add document parsing for PDF, DOCX, PPTX, TXT, and code files.
4. Add chunking and embeddings.
5. Add vector search with Qdrant, Pinecone, Supabase pgvector, or Firestore vector search.
6. Add Vercel AI endpoints:
   - `/api/study`
   - `/api/exam-generate`
   - `/api/exam-grade`
   - `/api/assignment-guide`
   - `/api/recommendations`
7. Add citations for material-based answers.
8. Add stronger anti-repetition logic using question embeddings.
9. Add PDF export for exam results and study plans.
10. Deploy frontend with GitHub Pages and backend with Vercel.

## Local Usage

Open `index.html` in a browser.

No build step is required for this prototype.
