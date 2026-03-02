# DesignIQ — System Design Interview Prep

An AI-powered tool that generates interactive system architecture diagrams from plain English prompts, with a streaming AI coach to help you understand and discuss the design.

**Live Demo:** https://design-iq-b5o4.vercel.app

---

## What it does

Type a prompt like *"Design Instagram's like feature"* and DesignIQ will:

- Generate a full system architecture with the right components (API gateways, caches, queues, databases, etc.)
- Render it as an interactive, zoomable diagram using React Flow
- Open an AI chat panel where you can ask questions about the design — trade-offs, scalability, what interviewers look for

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI + Groq (LLaMA 3.3 70B) |
| Diagram | React Flow + dagre (auto-layout) |
| Frontend | React + Vite + Tailwind CSS |
| Deploy | Render (backend) · Vercel (frontend) |

---

## Running locally

**Backend**
```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

venv/bin/uvicorn main:app --reload --port 8004
```

**Frontend**
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8004 npm run dev -- --port 5176
```

Or run both with:
```bash
./start.sh
```

---

## Example prompts

- Design Instagram's like feature
- Design a URL shortener like Bitly
- Design Twitter's news feed
- Design Uber's ride matching
- Design YouTube's video upload pipeline
