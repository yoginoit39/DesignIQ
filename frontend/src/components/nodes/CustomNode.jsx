import { Handle, Position } from 'reactflow'
import {
  Monitor, GitMerge, Shuffle, Cpu, Database,
  Zap, List, Globe, HardDrive, Bell,
} from 'lucide-react'

const NODE_TYPES = {
  client:          { Icon: Monitor,    color: '#38bdf8', label: 'Client' },
  'api-gateway':   { Icon: GitMerge,  color: '#818cf8', label: 'API Gateway' },
  'load-balancer': { Icon: Shuffle,   color: '#fb923c', label: 'Load Balancer' },
  service:         { Icon: Cpu,       color: '#a78bfa', label: 'Service' },
  database:        { Icon: Database,  color: '#34d399', label: 'Database' },
  cache:           { Icon: Zap,       color: '#facc15', label: 'Cache' },
  queue:           { Icon: List,      color: '#f472b6', label: 'Queue' },
  cdn:             { Icon: Globe,     color: '#22d3ee', label: 'CDN' },
  storage:         { Icon: HardDrive, color: '#94a3b8', label: 'Storage' },
  notification:    { Icon: Bell,      color: '#f87171', label: 'Notification' },
}

const handleStyle = (color) => ({
  width: 8,
  height: 8,
  background: color,
  border: '2px solid #07070f',
  borderRadius: '50%',
})

export default function CustomNode({ data, selected }) {
  const config = NODE_TYPES[data.componentType] || NODE_TYPES.service
  const { Icon, color, label } = config

  return (
    <div
      style={{
        width: 200,
        background: 'rgba(13,13,28,0.95)',
        border: `1px solid ${selected ? color + '55' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: selected
          ? `0 0 0 1px ${color}33, 0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${color}18`
          : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        cursor: 'default',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle(color)} />

      {/* Colored top strip */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />

      <div style={{ padding: '10px 12px' }}>
        {/* Type badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: `${color}14`,
          border: `1px solid ${color}28`,
          borderRadius: 6,
          padding: '2px 7px',
          marginBottom: 8,
        }}>
          <Icon size={9} color={color} strokeWidth={2.5} />
          <span style={{
            color,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {label}
          </span>
        </div>

        {/* Label */}
        <div style={{
          color: '#eef0ff',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 5,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {data.label}
        </div>

        {/* Description */}
        <div style={{
          color: '#4a5070',
          fontSize: 10.5,
          lineHeight: 1.5,
        }}>
          {data.description}
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle(color)} />
    </div>
  )
}
