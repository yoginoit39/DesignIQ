import { useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow'
import CustomNode from './nodes/CustomNode'
import { getLayoutedElements } from '../utils/layout'

const nodeTypes = { custom: CustomNode }

const LOADING_STEPS = [
  'Analyzing your prompt',
  'Planning the architecture',
  'Selecting components',
  'Optimizing the layout',
]

const NODE_COLORS = {
  client: '#38bdf8', 'api-gateway': '#818cf8', 'load-balancer': '#fb923c',
  service: '#a78bfa', database: '#34d399', cache: '#facc15',
  queue: '#f472b6', cdn: '#22d3ee', storage: '#94a3b8', notification: '#f87171',
}

function NodeExplanationPane({ node, onClose }) {
  if (!node) return null

  const NODE_INTERVIEW_TIPS = {
    client:          'Discuss user-facing clients: web, mobile, desktop. Talk about latency sensitivity and client-side caching.',
    'api-gateway':   'API Gateway centralizes auth, rate limiting, routing. Good point to discuss token validation and DDoS protection.',
    'load-balancer': 'Explain round-robin vs least-connections. Discuss session affinity (sticky sessions) and health checks.',
    service:         'Discuss horizontal scaling, statelessness, and service discovery. Great place to mention 12-factor app principles.',
    database:        'Cover CAP theorem, ACID vs BASE, read replicas, and sharding strategies. Interviewers love schema discussion.',
    cache:           'Explain cache-aside vs write-through vs write-back. Discuss eviction policies (LRU) and cache stampede.',
    queue:           'Talk about async decoupling, fan-out patterns, at-least-once delivery, and idempotency requirements.',
    cdn:             'Discuss cache invalidation, edge locations, and which assets to serve from CDN vs origin.',
    storage:         'Blob vs object storage. Discuss S3 consistency model, lifecycle policies, and pre-signed URLs.',
    notification:    'Cover push vs pull, WebSockets vs SSE vs long polling, and fan-out at scale.',
  }

  const tip = NODE_INTERVIEW_TIPS[node.data.componentType] || 'Discuss this component\'s role, scaling properties, and failure modes.'

  return (
    <div className="explanation-pane">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#00d4ff',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            Interview Tips — {node.data.componentType}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 8 }}>
            {node.data.label}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#8892b0',
            cursor: 'pointer',
            padding: '3px 8px',
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: '#8892b0', lineHeight: 1.65, flex: 1, overflowY: 'auto' }}>
        {tip}
      </div>
      <div style={{
        fontSize: 11,
        color: '#3d4466',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 8,
      }}>
        💡 Ask your AI Coach about this component for a deeper explanation
      </div>
    </div>
  )
}

function LoadingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 1100)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 28,
    }}>
      {/* Animated logo mark */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #0099cc, #00d4ff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        boxShadow: '0 0 40px rgba(0,212,255,0.35)',
        animation: 'pulse-glow 2s ease-in-out infinite',
      }}>
        ⬡
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
        {LOADING_STEPS.map((s, i) => (
          <div key={s} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: i <= step ? 1 : 0.25,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: i === step
                ? 'linear-gradient(135deg, #0099cc, #00d4ff)'
                : i < step ? '#34d399' : 'rgba(255,255,255,0.15)',
              flexShrink: 0,
              animation: i === step ? 'pulse-dot 1s ease-in-out infinite' : 'none',
              transition: 'background 0.3s',
            }} />
            <span style={{
              fontSize: 13,
              color: i === step ? '#00d4ff' : i < step ? '#34d399' : '#3d4466',
              fontWeight: i === step ? 500 : 400,
              transition: 'color 0.3s',
            }}>
              {i < step ? '✓ ' : ''}{s}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(0,212,255,0.3); }
          50% { box-shadow: 0 0 50px rgba(0,212,255,0.55); }
        }
      `}</style>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 16,
      userSelect: 'none',
    }}>
      {/* Mini diagram preview */}
      <div style={{
        position: 'relative',
        width: 280,
        height: 130,
        opacity: 0.25,
      }}>
        {[
          { x: 0,   y: 45, w: 72, label: 'Client', color: '#38bdf8' },
          { x: 104, y: 20, w: 72, label: 'API GW',  color: '#818cf8' },
          { x: 104, y: 70, w: 72, label: 'Cache',   color: '#facc15' },
          { x: 208, y: 45, w: 72, label: 'Service', color: '#a78bfa' },
        ].map((n) => (
          <div key={n.label} style={{
            position: 'absolute',
            left: n.x,
            top: n.y,
            width: n.w,
            height: 32,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${n.color}44`,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: n.color,
            fontWeight: 600,
          }}>
            {n.label}
          </div>
        ))}
        {/* Connector lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <line x1="72" y1="61" x2="104" y2="36" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#arr)" />
          <line x1="72" y1="61" x2="104" y2="86" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="176" y1="36" x2="208" y2="61" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="176" y1="86" x2="208" y2="61" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#f0f4ff',
          letterSpacing: '-0.03em',
          marginBottom: 6,
        }}>
          Your diagram will appear here
        </h2>
        <p style={{ fontSize: 13, color: '#3d4466', maxWidth: 300, lineHeight: 1.6 }}>
          Type a system design prompt above and click Generate to visualize the architecture.
        </p>
      </div>
    </div>
  )
}

function FlowCanvas({ design, loading, onNodeClick, onPaneClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!design) return

    const rawNodes = design.nodes.map((n) => ({
      id: n.id,
      type: 'custom',
      data: { label: n.label, description: n.description, componentType: n.type },
      position: { x: 0, y: 0 },
    }))

    const rawEdges = design.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(0,212,255,0.3)' },
      style: { stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1.5 },
      labelStyle: { fill: '#3d4466', fontSize: 10 },
      labelBgStyle: { fill: '#0f0f1a', fillOpacity: 1 },
      labelBgPadding: [5, 3],
      labelBgBorderRadius: 4,
    }))

    const { nodes: ln, edges: le } = getLayoutedElements(rawNodes, rawEdges)
    setNodes(ln)
    setEdges(le)

    setTimeout(() => fitView({ padding: 0.18, duration: 600 }), 80)
  }, [design])

  if (!design && !loading) return <EmptyState />
  if (loading) return <LoadingState />

  return (
    <div style={{ width: '100%', height: '100%', animation: 'fadeIn 0.5s ease' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
        onNodeClick={(_, node) => onNodeClick(node)}
        onPaneClick={onPaneClick}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.componentType] || '#818cf8'}
          maskColor="rgba(10,10,15,0.8)"
          style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
        />
      </ReactFlow>
    </div>
  )
}

export default function DiagramPanel({ design, loading, selectedNode, onNodeClick, onPaneClick }) {
  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Design title overlay */}
      {design && !loading && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          pointerEvents: 'none',
          maxWidth: 380,
          animation: 'fadeUp 0.4s ease',
        }}>
          <div style={{
            background: 'rgba(15,15,26,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 3 }}>
              {design.title}
            </div>
            <div style={{ fontSize: 11.5, color: '#3d4466', lineHeight: 1.55 }}>
              {design.description}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactFlowProvider>
          <FlowCanvas
            design={design}
            loading={loading}
            onNodeClick={onNodeClick || (() => {})}
            onPaneClick={onPaneClick || (() => {})}
          />
        </ReactFlowProvider>
      </div>

      <NodeExplanationPane
        node={selectedNode}
        onClose={() => onNodeClick && onNodeClick(null)}
      />
    </div>
  )
}
