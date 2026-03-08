import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

DESIGN_SYSTEM_PROMPT = """You are a world-class system design expert helping candidates prepare for technical interviews at top companies like Google, Meta, Amazon, and Netflix.

When given a system design prompt, return ONLY a valid JSON object. No markdown, no code blocks, no explanation — just raw JSON.

Use this exact structure:
{
  "title": "descriptive title of the design",
  "description": "2-3 sentence overview explaining the key design decisions and approach",
  "nodes": [
    {
      "id": "unique-kebab-case-id",
      "type": "one of: client, api-gateway, load-balancer, service, database, cache, queue, cdn, storage, notification",
      "label": "Component Name",
      "description": "What this component does in one clear sentence"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "protocol or what flows here"
    }
  ]
}

Rules:
- Always start with a client node (type: "client") representing the mobile/web app
- Include 7-12 nodes for a comprehensive but readable diagram
- Use realistic, interview-appropriate components
- Edge labels should be brief: "HTTP/REST", "gRPC", "reads", "publishes", "caches", "queries"
- Design should reflect real-world best practices: caching layers, async processing, scalability
- Ensure ALL edge source and target IDs exactly match actual node IDs
- Order nodes logically: client → gateway → services → data stores
"""

REFINE_SYSTEM_PROMPT = """You are a world-class system design expert. You are given an existing system design JSON and a modification request. Update the design to incorporate the requested changes.

Return ONLY a valid JSON object with the exact same structure. No markdown, no code blocks, no explanation — just raw JSON.

Use this exact structure:
{
  "title": "descriptive title of the design",
  "description": "2-3 sentence overview explaining the key design decisions and approach",
  "nodes": [
    {
      "id": "unique-kebab-case-id",
      "type": "one of: client, api-gateway, load-balancer, service, database, cache, queue, cdn, storage, notification",
      "label": "Component Name",
      "description": "What this component does in one clear sentence"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "protocol or what flows here"
    }
  ]
}

Rules:
- Keep all existing components that are still relevant
- Add new components required by the modification request
- Update titles, descriptions, and labels to reflect the changes
- Ensure ALL edge source/target IDs exactly match actual node IDs
- Use the same node type vocabulary: client, api-gateway, load-balancer, service, database, cache, queue, cdn, storage, notification
- Aim for 7-14 nodes for a comprehensive but readable diagram
"""

CHAT_SYSTEM_PROMPT = """You are a senior staff engineer and system design interview coach at a top tech company. You are helping a candidate understand and learn from a system design that was just generated.

Your goals:
1. Explain design decisions clearly and conversationally
2. Help them understand trade-offs and alternatives
3. Teach interview techniques — how to talk through designs, what to mention first
4. Answer questions about scalability, reliability, consistency, and architecture
5. Point out what interviewers specifically look for and how to impress them

Be encouraging, educational, and conversational. Keep answers focused — 3-5 paragraphs max.
Use bullet points for lists. Use technical terms but explain them clearly.

IMPORTANT: NEVER draw ASCII diagrams, text-based diagrams, box-and-arrow art, or any text representation of a diagram. If the user asks to "draw" or "update" or "modify" the diagram, the visual diagram on the left canvas is already being updated automatically — just acknowledge that and describe the changes conversationally in plain text.

CONCEPT CHIPS: When you mention a system design concept that a candidate should study deeply (e.g., CAP theorem, cache-aside, sharding, eventual consistency, idempotency), wrap it in double brackets like [[CAP theorem]] or [[cache-aside pattern]]. Only wrap the first mention per concept per response. This renders as a clickable learning chip in the UI.

Current system design being discussed:
{diagram_context}
"""

DRILL_SYSTEM_PROMPT = """You are a senior staff engineer at a top tech company conducting a live system design interview. The candidate has generated a design and you are drilling them on their choices.

Rules:
- Ask ONE specific, pointed question per turn about a concrete component in the design
- Focus on: WHY they chose it, HOW they'd configure it, WHAT trade-offs they considered
- If the answer is surface-level, push back directly: "Okay, but what eviction policy, and why? What happens on a cache miss under high load?"
- If the answer shows genuine depth, acknowledge briefly then advance: "Good. Now let's talk about [next component] — ..."
- Never give away the answer — only probe and guide
- Be direct but encouraging — senior mentor, not a judge
- For the first message (empty), pick the most architecturally interesting component and open with a tough question about it

Current system design being drilled:
{diagram_context}
"""

CONCEPT_SYSTEM_PROMPT = """You are a system design interview coach explaining a technical concept concisely.

Explain the concept the user provides in exactly these 3 sections with these exact headers:

## What it is
Clear definition with one concrete example. 2-3 sentences max.

## When to use it
Trade-offs, alternatives, and decision signals. What tells you to reach for this? What are the downsides? 3-4 sentences.

## How to talk about it in an interview
What to say, what depth to show, what FAANG interviewers look for. Include one sample phrase a candidate could use. 3-4 sentences.

{context_section}
No fluff. Candidates are in interview prep mode."""


class DesignRequest(BaseModel):
    prompt: str


class ChatRequest(BaseModel):
    message: str
    diagram_context: str
    history: list


class DrillRequest(BaseModel):
    message: str
    diagram_context: str
    history: list


class ConceptRequest(BaseModel):
    concept: str
    diagram_context: str = ""


class RefineRequest(BaseModel):
    current_design: dict
    modification: str


@app.post("/generate-design")
async def generate_design(request: DesignRequest):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": DESIGN_SYSTEM_PROMPT},
                {"role": "user", "content": f"Design: {request.prompt}"},
            ],
            temperature=0.3,
            max_tokens=2500,
        )

        raw = completion.choices[0].message.content.strip()

        # Strip markdown code blocks if AI wraps in them
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1])

        design = json.loads(raw)
        return design

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse design JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/refine-design")
async def refine_design(request: RefineRequest):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": REFINE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Current design:\n{json.dumps(request.current_design)}\n\nModification request: {request.modification}"},
            ],
            temperature=0.3,
            max_tokens=2500,
        )

        raw = completion.choices[0].message.content.strip()

        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1])

        design = json.loads(raw)
        return design

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse design JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = CHAT_SYSTEM_PROMPT.format(
        diagram_context=request.diagram_context
    )

    messages = [{"role": "system", "content": system_prompt}]

    for msg in request.history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": request.message})

    def stream():
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            stream=True,
        )
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    return StreamingResponse(
        stream(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )


@app.post("/drill")
async def drill(request: DrillRequest):
    system_prompt = DRILL_SYSTEM_PROMPT.format(
        diagram_context=request.diagram_context
    )

    messages = [{"role": "system", "content": system_prompt}]

    for msg in request.history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    if request.message:
        messages.append({"role": "user", "content": request.message})

    def stream():
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.6,
            max_tokens=600,
            stream=True,
        )
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    return StreamingResponse(
        stream(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )


@app.post("/concept")
async def concept(request: ConceptRequest):
    context_section = ""
    if request.diagram_context.strip():
        context_section = f"Context: Relate this concept to the candidate's current design where relevant: {request.diagram_context}"

    system_prompt = CONCEPT_SYSTEM_PROMPT.format(
        context_section=context_section,
    )

    def stream():
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Explain: {request.concept}"},
            ],
            temperature=0.4,
            max_tokens=500,
            stream=True,
        )
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    return StreamingResponse(
        stream(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
