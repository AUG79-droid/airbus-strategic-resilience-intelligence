interface SystemMapProps {
  label: string;
  caption: string;
}

export function SystemMap({ label, caption }: SystemMapProps) {
  return (
    <div className="system-map" aria-label={caption}>
      <div className="system-map__top">
        <span>{label}</span>
        <span>ALPHA—01</span>
      </div>
      <svg className="system-map__graphic" viewBox="0 0 560 180" role="img" aria-label={caption}>
        <defs>
          <pattern id="grid" width="70" height="34" patternUnits="userSpaceOnUse">
            <path d="M 70 0 L 0 0 0 34" fill="none" stroke="#779084" strokeWidth="0.6" opacity="0.28" />
          </pattern>
          <marker id="map-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8" fill="none" stroke="#c3ef76" strokeWidth="1.2" />
          </marker>
        </defs>
        <rect x="0" y="0" width="560" height="180" fill="url(#grid)" />
        <path
          d="M48 88 H510"
          fill="none"
          stroke="#c3ef76"
          strokeDasharray="4 8"
          strokeWidth="1.5"
          markerEnd="url(#map-arrow)"
        />
        {[64, 150, 236, 322, 408, 494].map((x, index) => (
          <g key={x}>
            <circle
              cx={x}
              cy="88"
              r={index === 3 ? 24 : 18}
              fill={index === 3 ? '#2d483e' : '#26352f'}
              stroke={index === 3 ? '#c3ef76' : '#b8c8bc'}
              strokeWidth={index === 3 ? 2 : 1.2}
            />
            <circle cx={x} cy="88" r={index === 3 ? 7 : 4} fill="#c3ef76" />
            <text x={x} y="128" textAnchor="middle" fill="#c3cec6" fontSize="8" fontWeight="700">
              {String(index + 1).padStart(2, '0')}
            </text>
          </g>
        ))}
      </svg>
      <div className="system-map__bottom">
        <span>{caption}</span>
        <strong>01—06</strong>
      </div>
      <span className="system-map__letter" aria-hidden="true">R</span>
    </div>
  );
}
