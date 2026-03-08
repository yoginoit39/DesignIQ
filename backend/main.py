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

Current system design being discussed:
{diagram_context}
"""


class DesignRequest(BaseModel):
    prompt: str


class ChatRequest(BaseModel):
    message: str
    diagram_context: str
    history: list


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


@app.get("/health")
async def health():
    return {"status": "ok"}
