import { Handle, Position } from 'reactflow'

const NODE_CONFIGS = {
  client:          { color: '#60a5fa', bg: '#0d2137', icon: '🧑‍💻', badge: 'Client' },
  'api-gateway':   { color: '#a78bfa', bg: '#1a0e3d', icon: '🔀', badge: 'API Gateway' },
  'load-balancer': { color: '#fb923c', bg: '#2a1200', icon: '⚖️', badge: 'Load Balancer' },
  service:         { color: '#818cf8', bg: '#12133a', icon: '⚙️', badge: 'Service' },
  database:        { color: '#34d399', bg: '#022c1e', icon: '🗄️', badge: 'Database' },
  cache:           { color: '#f87171', bg: '#2a0808', icon: '⚡', badge: 'Cache' },
  queue:           { color: '#fbbf24', bg: '#281a00', icon: '📨', badge: 'Queue' },
  cdn:             { color: '#22d3ee', bg: '#021c24', icon: '🌐', badge: 'CDN' },
  storage:         { color: '#94a3b8', bg: '#131c2e', icon: '📦', badge: 'Storage' },
  notification:    { color: '#f472b6', bg: '#280a1e', icon: '🔔', badge: 'Notification' },
}

export default function CustomNode({ data, selected }) {
  const config = NODE_CONFIGS[data.componentType] || NODE_CONFIGS.service

  return (
    <div
      style={{
        background: config.bg,
        border: `2px solid ${selected ? config.color : config.color + '88'}`,
        borderRadius: '12px',
        padding: '12px 14px',
        width: '200px',
        boxShadow: selected
          ? `0 0 0 3px ${config.color}33, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.15s ease',
        cursor: 'default',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: config.color,
          width: 10,
          height: 10,
          border: `2px solid ${config.bg}`,
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: 'inline-block',
          background: config.color + '22',
          color: config.color,
          fontSize: '9px',
          fontWeight: '600',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '2px 7px',
          borderRadius: '99px',
          marginBottom: '8px',
          border: `1px solid ${config.color}44`,
        }}
      >
        {config.badge}
      </div>

      {/* Label with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{config.icon}</span>
        <span
          style={{
            color: '#f1f5f9',
            fontWeight: '600',
            fontSize: '13px',
            lineHeight: 1.2,
          }}
        >
          {data.label}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          color: '#64748b',
          fontSize: '11px',
          margin: 0,
          lineHeight: '1.5',
        }}
      >
        {data.description}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: config.color,
          width: 10,
          height: 10,
          border: `2px solid ${config.bg}`,
        }}
      />
    </div>
  )
}
