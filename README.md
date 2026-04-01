# 🚀 AI AutoWorker

### Autonomous AI Employee for Task Planning & Execution

<p align="center">
  <b>Plan. Execute. Learn. Repeat.</b><br/>
  An agentic AI system that transforms natural language into real-world actions.
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white"/>
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
</p>

---

## 🧠 Overview

**AI AutoWorker** is a full-stack **agentic AI platform** that simulates a real software engineer.

It can:

* Understand tasks from natural language
* Break them into structured execution steps
* Perform actions (code generation / automation)
* Track progress in real-time
* Learn from previous executions

> 💡 This project represents the future of how developers will interact with AI.

---

## ⚡ Live Demo

🚧 Coming Soon
*(Deploy on Vercel + Railway and add your link here)*

---

## 🎥 Demo Preview

> Add a GIF here showing:
>
> * Task input
> * Execution flow
> * Dashboard updates

---

## 🏗️ System Architecture

```text
User Input
   ↓
Frontend (Next.js)
   ↓
Backend API (Node.js)
   ↓
AI Planner (OpenAI)
   ↓
Execution Engine
   ↓
Database (PostgreSQL)
   ↓
Dashboard (Real-time Updates)
```

---

## 🧩 Core Features

### 🧠 AI Task Understanding

Convert natural language into structured execution plans.

### ⚙️ Execution Engine

Simulate or execute real commands dynamically.

### 📊 Real-time Dashboard

Track logs, progress, and outputs live.

### 🗂️ Memory System

Store tasks, results, and errors for learning.

### 🔁 Adaptive Learning

Improve future responses using historical data.

---

## 🧪 Example Workflow

**Input:**

```text
"Create a REST API using Node.js"
```

**AI Output:**

```json
{
  "steps": [
    "Initialize project",
    "Install dependencies",
    "Create server",
    "Define routes",
    "Connect database"
  ]
}
```

---

## 🔌 API Endpoints

### ➤ Create Task

POST `/api/task`

```json
{
  "task": "Build authentication system"
}
```

---

### ➤ Get Task Status

GET `/api/task/:id`

---

### ➤ Get All Tasks

GET `/api/tasks`

---

## 🗄️ Database Schema

### Tasks

* id
* input
* plan (JSONB)
* status
* created_at

### Logs

* id
* task_id
* message
* timestamp

---

## 🛠️ Tech Stack

| Layer      | Technology            |
| ---------- | --------------------- |
| Frontend   | Next.js, Tailwind CSS |
| Backend    | Node.js, Express.js   |
| Database   | PostgreSQL            |
| AI Engine  | OpenAI API            |
| Deployment | Vercel, Railway / AWS |

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/your-username/ai-autoworker.git
cd ai-autoworker
```

### Install Dependencies

```bash
npm install
```

### Setup Environment

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_db_url
```

### Run Development Server

```bash
npm run dev
```

---

## 🔥 Future Enhancements

* 🤖 Multi-agent architecture (Planner + Executor separation)
* 🧠 Self-improving AI models
* 🧪 Secure code execution sandbox
* 📦 Auto GitHub repository generation
* 🎙️ Voice-controlled tasks
* 💬 Slack / WhatsApp integration

---

## 📸 Screenshots

> Add:
>
> * Dashboard UI
> * Task execution logs
> * AI response preview

---

## 📈 Why This Project Matters

Most projects demonstrate CRUD operations.

**AI AutoWorker demonstrates:**

* System design thinking
* AI-powered automation
* Real-world engineering workflows
* Future-ready development skills

---

## 👨‍💻 Author

**Jeyapragash**
Undergraduate | Software Developer

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## ⭐ Support

If you found this project useful, give it a ⭐ and share it!

---

## 📜 License

MIT License
