import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'PropOwl - Smart Rental Property Accounting'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Main content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {/* Owl mascot */}
          <div
            style={{
              fontSize: '120px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
            }}
          >
            🦉
          </div>

          {/* PropOwl title */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '20px',
              textShadow: '0 4px 8px rgba(0,0,0,0.5)',
            }}
          >
            PropOwl
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '32px',
              color: '#e2e8f0',
              marginBottom: '30px',
              maxWidth: '800px',
              lineHeight: '1.3',
            }}
          >
            Smart Rental Property Accounting
          </div>

          {/* Feature highlights */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#cbd5e1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>📊</span>
              <span>Schedule E Reports</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🏠</span>
              <span>Property Management</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>💰</span>
              <span>Tax Ready</span>
            </div>
          </div>

          {/* Subtle bottom accent */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: '8px',
              background: 'linear-gradient(90deg, #f59e0b, #d97706, #b45309)',
            }}
          />
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}