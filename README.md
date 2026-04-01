# 🚀 AI AutoWorker

### Your Autonomous AI Employee

An AI-powered system that understands tasks, generates execution plans, and performs real-time actions like a junior developer.

---

## 🧠 What is this?

AI AutoWorker is a full-stack **agentic AI system** that converts natural language tasks into structured workflows, executes them, and learns from past results.

👉 Think of it as:

> “A mini AI employee that can plan, execute, and improve.”

---

## ⚡ Key Features

* 🧠 AI Task Understanding (Natural Language → Structured Plan)
* ⚙️ Execution Engine (Simulated / Real Commands)
* 📊 Real-time Dashboard (Logs, Status, Outputs)
* 🗂️ Memory System (Stores past tasks & results)
* 🔁 Learning Capability (Improves over time)
* 🌐 Full-stack Architecture

---

## 🏗️ Tech Stack

### Frontend

* Next.js
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### AI Integration

* OpenAI API

### Deployment

* Vercel (Frontend)
* Railway / AWS (Backend + DB)

---

## 🧩 System Architecture

User → Frontend → Backend → AI Planner → Execution Engine → Database → Dashboard

---

## 📸 Screenshots

> Add your UI screenshots here (Dashboard, Task Execution, Logs)

---

## 🔌 API Endpoints

### Create Task

POST /api/task

```json
{
  "task": "Create a REST API using Node.js"
}
```

---

### Get Task Status

GET /api/task/:id

---

### Get All Tasks

GET /api/tasks

---

## 🗄️ Database Design

### Tasks Table

* id
* input
* plan (JSON)
* status
* created_at

### Logs Table

* id
* task_id
* message
* timestamp

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ai-autoworker.git
cd ai-autoworker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_db_url
```

### 4. Run the app

```bash
npm run dev
```

---

## 🧠 How It Works

1. User submits a task
2. AI converts it into structured steps
3. Execution engine processes steps
4. Results & logs are stored
5. Dashboard displays real-time progress

---

## 🔥 Future Improvements

* Multi-agent system (Planner + Executor separation)
* Code execution sandbox
* GitHub repo auto-generation
* Voice-based task input
* Slack / WhatsApp integration

---

## 👨‍💻 Author

Jeyapragash
Undergraduate | Software Developer

---

## ⭐ Why This Project Stands Out

This is not a simple CRUD app.

It demonstrates:

* AI integration
* System design thinking
* Full-stack engineering
* Real-world automation

👉 Built to simulate how future developers will work with AI.

---

## 📜 License

MIT License
