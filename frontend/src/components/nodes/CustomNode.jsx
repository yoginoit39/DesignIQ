import { useState } from 'react'
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
  border: '2px solid #0a0a0f',
  borderRadius: '50%',
})

export default function CustomNode({ data, selected }) {
  const [hovered, setHovered] = useState(false)
  const config = NODE_TYPES[data.componentType] || NODE_TYPES.service
  const { Icon, color, label } = config

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover tooltip */}
      {hovered && (
        <div className="node-tooltip">
          <div style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 600, marginBottom: 4 }}>
            {data.label}
          </div>
          <div style={{ fontSize: 11, color: '#8892b0', lineHeight: 1.5 }}>
            {data.description}
          </div>
          <div style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10.5,
            color: '#3d4466',
          }}>
            Click to see interview tips ↓
          </div>
        </div>
      )}

      <div
        style={{
          width: 200,
          background: 'rgba(15,15,26,0.97)',
          border: selected
            ? `1px solid ${color}66`
            : hovered
              ? '1px solid rgba(0,212,255,0.3)'
              : '1px solid rgba(255,255,255,0.07)',
          borderLeft: `3px solid ${color}`,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: selected
            ? `0 0 0 1px ${color}33, 0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${color}18`
            : hovered
              ? '0 4px 24px rgba(0,0,0,0.5), 0 0 16px rgba(0,212,255,0.08)'
              : '0 4px 24px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Handle type="target" position={Position.Left} style={handleStyle(color)} />

        <div style={{ padding: '10px 12px' }}>
          {/* Top row: icon badge left, type label right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              background: `${color}14`,
              border: `1px solid ${color}28`,
              borderRadius: 7,
            }}>
              <Icon size={12} color={color} strokeWidth={2.5} />
            </div>
            <span style={{
              color: '#3d4466',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {label}
            </span>
          </div>

          {/* Label */}
          <div style={{
            color: '#f0f4ff',
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
            color: '#3d4466',
            fontSize: 10.5,
            lineHeight: 1.5,
          }}>
            {data.description}
          </div>
        </div>

        <Handle type="source" position={Position.Right} style={handleStyle(color)} />
      </div>
    </div>
  )
}
