import { useEffect } from 'react'
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

const edgeDefaults = {
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
  style: { stroke: '#475569', strokeWidth: 1.5 },
  labelStyle: { fill: '#64748b', fontSize: 10, fontWeight: 500 },
  labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95 },
  labelBgPadding: [5, 3],
  labelBgBorderRadius: 4,
}

const NODE_COLOR_MAP = {
  client: '#60a5fa',
  'api-gateway': '#a78bfa',
  'load-balancer': '#fb923c',
  service: '#818cf8',
  database: '#34d399',
  cache: '#f87171',
  queue: '#fbbf24',
  cdn: '#22d3ee',
  storage: '#94a3b8',
  notification: '#f472b6',
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
      data: {
        label: n.label,
        description: n.description,
        componentType: n.type,
      },
      position: { x: 0, y: 0 },
    }))

    const rawEdges = design.edges.map((e) => ({
      ...edgeDefaults,
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
    }))

    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(rawNodes, rawEdges)
    setNodes(lNodes)
    setEdges(lEdges)

    setTimeout(() => fitView({ padding: 0.15, duration: 600 }), 80)
  }, [design])

  if (!design && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="text-6xl mb-5">🏗️</div>
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Ready to Design</h2>
        <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
          Type a system design prompt above and hit Generate. Your interactive architecture diagram will appear here.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs w-full">
          {['Caching layers', 'Message queues', 'Load balancers', 'Microservices'].map((t) => (
            <div key={t} className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-500 text-center">
              {t}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <svg className="animate-spin w-10 h-10 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-slate-400 text-sm animate-pulse">Designing your architecture...</p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.25}
      maxZoom={1.8}
      attributionPosition="bottom-left"
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1e293b" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => NODE_COLOR_MAP[n.data?.componentType] || '#818cf8'}
        maskColor="rgba(15,23,42,0.75)"
        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
      />
    </ReactFlow>
  )
}

export default function DiagramPanel({ design, loading }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
      {design && !loading && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none max-w-sm">
          <div className="bg-slate-900/85 backdrop-blur border border-slate-700/50 rounded-xl px-4 py-3 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">{design.title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{design.description}</p>
          </div>
        </div>
      )}

      <div style={{ width: '100%', height: '100%', flex: 1 }}>
        <ReactFlowProvider>
          <FlowCanvas design={design} loading={loading} />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
