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
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        boxShadow: '0 0 40px rgba(99,102,241,0.35)',
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
                ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                : i < step ? '#34d399' : 'rgba(255,255,255,0.15)',
              flexShrink: 0,
              animation: i === step ? 'pulse-dot 1s ease-in-out infinite' : 'none',
              transition: 'background 0.3s',
            }} />
            <span style={{
              fontSize: 13,
              color: i === step ? '#a5b4fc' : i < step ? '#34d399' : '#383c56',
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
          0%, 100% { box-shadow: 0 0 30px rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 50px rgba(99,102,241,0.55); }
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
          color: '#eef0ff',
          letterSpacing: '-0.03em',
          marginBottom: 6,
        }}>
          Your diagram will appear here
        </h2>
        <p style={{ fontSize: 13, color: '#383c56', maxWidth: 300, lineHeight: 1.6 }}>
          Type a system design prompt above and click Generate to visualize the architecture.
        </p>
      </div>
    </div>
  )
}

function FlowCanvas({ design, loading }) {
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
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.2)' },
      style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 },
      labelStyle: { fill: '#4a5070', fontSize: 10 },
      labelBgStyle: { fill: '#0c0c1d', fillOpacity: 1 },
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
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.componentType] || '#818cf8'}
          maskColor="rgba(7,7,15,0.8)"
          style={{ background: '#0c0c1d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
        />
      </ReactFlow>
    </div>
  )
}

export default function DiagramPanel({ design, loading }) {
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
            background: 'rgba(12,12,29,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#eef0ff', letterSpacing: '-0.01em', marginBottom: 3 }}>
              {design.title}
            </div>
            <div style={{ fontSize: 11.5, color: '#4a5070', lineHeight: 1.55 }}>
              {design.description}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactFlowProvider>
          <FlowCanvas design={design} loading={loading} />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
