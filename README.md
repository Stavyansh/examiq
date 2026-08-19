# ExamIQ 🎓

> **AI-Powered Exam Preparation Platform**
> 
> Upload study material + syllabus + previous-year question papers → automatically understand the course → create a topic checklist → analyze PYQ trends → rank topics by exam importance → generate study recommendations and adaptive preparation plans.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-Passing-green?logo=jest)](./tests/)

## 📖 Overview

ExamIQ is a complete **exam preparation operating system**, not just a PDF summarizer. It transforms your study materials and previous year questions into actionable insights, helping you focus on what matters most for your exams.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| **📄 Material Ingestion** | Upload PDFs, PPTX, images, and text documents for automatic topic extraction |
| **🧠 AI-Powered Analysis** | Structured topic extraction with hierarchy (Module → Topic → Subtopic) |
| **📝 PYQ Processing** | Upload previous year papers, classify questions by type, difficulty, and topic mapping |
| **📊 Priority Engine** | Deterministic scoring: Frequency (35%) + Marks Weight (25%) + Recency (20%) + Syllabus (10%) + Variation (10%) |
| **✅ Interactive Checklists** | Track progress: Not Started → Learning → Reviewed → Mastered |
| **📈 Study Recommendations** | "Study Next" based on priority + completion + exam relevance |
| **📅 Study Planner** | Generate daily schedules based on exam date, available hours, and topic priorities |
| **🎯 Practice Mode** | AI-generated practice questions with adaptive learning loop |
| **⏱️ Study Timer** | Pomodoro-style timer with break tracking and session analytics |
| **📊 Progress Analytics** | GitHub-style contribution calendar, streak tracking, and visual progress indicators |

## 🏗️ Architecture

### Tech Stack

```
Frontend:     Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
Backend:      Next.js API Routes (Serverless)
Database:     SQLite (dev) → Prisma ORM → PostgreSQL (prod)
AI:           Abstraction layer supporting multiple providers
Auth:         Custom session-based authentication
Testing:      Custom test suites (API, UI components, Navigation)
```

### Project Structure

```
examiq/
├── .claude/                    # Claude Code configuration
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── practice/          # Practice questions
│   │   ├── progress/          # Progress tracking
│   │   ├── pyq-analysis/      # PYQ analysis
│   │   ├── study-plan/        # Study planner
│   │   ├── subjects/          # Subject management
│   │   ├── topics/            # Topic management
│   │   ├── upload/            # File upload
│   │   ├── settings/          # Settings
│   │   ├── globals.css        # Design system
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Dashboard
│   ├── components/            # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── FileUploader.tsx
│   │   ├── Layout.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── StatCard.tsx
│   │   ├── StreakTracker.tsx
│   │   ├── Timer.tsx
│   │   ├── TopicCard.tsx
│   │   ├── TrendCard.tsx
│   │   └── ...
│   ├── context/               # React Context providers
│   ├── lib/
│   │   ├── db.ts              # Database facade
│   │   ├── db.memory.ts       # In-memory database (dev)
│   │   ├── auth.ts            # Authentication
│   │   ├── file-processor.ts  # File processing utilities
│   │   ├── hooks/             # Custom React hooks
│   │   └── services/          # Business logic services
│   └── generated/prisma/      # Prisma Client (generated)
├── tests/                     # Test suites
│   ├── api-tests.js
│   ├── ui-test-scripts.js
│   ├── navigation-tests.js
│   └── run-all-tests.js
├── .env                       # Environment variables (not committed)
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.ts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (recommended: 22 LTS)
- **npm** 10+ or **pnpm** 9+
- **Git** for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/examiq.git
cd examiq

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up the database (development)
npx prisma migrate dev --name init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# AI Provider (optional - uses mock responses if not set)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Auth
JWT_SECRET="your-secure-random-string"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all test suites |
| `npm run test:api` | Run API tests only |
| `npm run test:ui` | Run UI component tests |
| `npm run test:nav` | Run navigation tests |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma migrate dev` | Run database migrations |

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api      # 29 API endpoint tests
npm run test:ui       # 6 UI component manual test procedures
npm run test:nav      # Navigation/page load tests
```

### Test Results Summary (2026-08-12)

- **API Endpoints**: 82.8% pass rate (24/29) - Core GET/POST working, error handling needs improvement
- **Page Loads**: 100% pass rate (10/10 pages)
- **UI Components**: 6 components with detailed manual test procedures
- **Known Issues**: 3 endpoints return 500 instead of 4xx for invalid input (being addressed)

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## 🎨 Design System

ExamIQ follows an **Apple Notes × Linear × Modern Education Dashboard** aesthetic:

### Visual Principles

- **Minimalist light background** with off-white surfaces
- **Dark charcoal text** with subtle gray borders
- **Generous whitespace** and rounded cards
- **Clean typography** using system font stack (SF Pro / -apple-system)
- **Restrained accent colors** (Blue primary, Red/Amber/Green for priorities)
- **Smooth but subtle transitions** (200-300ms)

### Color System

```css
/* Light Theme */
--background: #fafafa;
--foreground: #1d1d1f;
--accent: #0066cc;
--high: #ff3b30;    /* High priority */
--medium: #ff9f0a;  /* Medium priority */
--low: #34c759;     /* Low priority */

/* Dark Theme (planned) */
--background: #1d1d1f;
--foreground: #fafafa;
--accent: #0a84ff;
```

### Typography Scale

```css
.heading-1  { 48px / Light }
.heading-2  { 24px / Medium / Uppercase }
.heading-3  { 18px / Medium }
.heading-4  { 16px / Medium }
.body-lg    { 18px / Normal }
.body-base  { 16px / Normal }
.body-sm    { 14px / Normal }
.body-xs    { 12px / Normal }
```

## 📊 Database Schema

Core models and relationships:

```prisma
User
 └── Exam/Subject
      ├── Material → MaterialChunk
      ├── Module → Topic → Subtopic
      ├── PYQPaper → PYQQuestion
      ├── TopicPriority
      ├── StudySession
      └── Progress
```

See [prisma/schema.prisma](./prisma/schema.prisma) for the complete schema.

## 🔄 Development Workflow

### Phase-Based Development

The project follows a structured 8-phase build plan:

1. **Phase 1** ✅ - Project Foundation + UI Shell
2. **Phase 2** ✅ - Database + Exam/Subject/Material Foundation  
3. **Phase 3** 🔄 - Material Ingestion + Topic Extraction
4. **Phase 4** 🔄 - PYQ Ingestion + Question Classification
5. **Phase 5** 🔄 - PYQ Analytics + Priority Engine
6. **Phase 6** 🔄 - Checklist + Progress + Study Recommendations
7. **Phase 7** 🔄 - Study Planner + Exam Countdown
8. **Phase 8** 🔄 - Practice + Adaptive Learning

See [ExamIQ_Claude_Code_Build_Plan.md](../ExamIQ_Claude_Code_Build_Plan.md) for detailed phase specifications.

### Code Quality Rules

- ✅ TypeScript strict mode
- ✅ ESLint with Next.js config
- ✅ Component-based architecture
- ✅ Service layer separation
- ✅ Centralized AI service
- ✅ Validated inputs at boundaries
- ❌ No hardcoded subjects/courses
- ❌ No AI for deterministic calculations
- ❌ No secrets in frontend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the [development rules](../ExamIQ_Claude_Code_Build_Plan.md#2-critical-development-rules)
4. Run tests: `npm test`
5. Ensure build passes: `npm run build`
6. Submit a Pull Request

### Commit Convention

```
feat: add new feature
fix: bug fix
refactor: code restructuring
docs: documentation updates
test: add/update tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Claude Code](https://claude.ai/code) - AI-assisted development

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/examiq/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/examiq/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/examiq/discussions)

---

<div align="center">
  <sub>Built with ❤️ using <a href="https://claude.ai/code">Claude Code</a></sub>
</div>