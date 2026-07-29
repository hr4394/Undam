/** 절제된 장식 요소. 모두 pointer-events: none. */

export function ConstellationDecor({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`decoration ${className}`}
      viewBox="0 0 400 200"
      fill="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <g stroke="rgba(184,146,74,0.35)" strokeWidth="0.8">
        <line x1="40" y1="150" x2="90" y2="110" />
        <line x1="90" y1="110" x2="140" y2="130" />
        <line x1="140" y1="130" x2="200" y2="70" />
        <line x1="200" y1="70" x2="270" y2="90" />
        <line x1="270" y1="90" x2="330" y2="50" />
      </g>
      <g fill="rgba(244,241,232,0.9)">
        {[
          [40, 150], [90, 110], [140, 130], [200, 70], [270, 90], [330, 50],
          [120, 40], [310, 150], [60, 60], [360, 110],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.8 : 1.1} />
        ))}
      </g>
    </svg>
  );
}

/** 원형 천문도 패턴 (옅은 금색) */
export function AstrolabeDecor({ size = 220 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="decoration"
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
    >
      <g stroke="rgba(184,146,74,0.25)" strokeWidth="1" fill="none">
        <circle cx="110" cy="110" r="100" />
        <circle cx="110" cy="110" r="78" />
        <circle cx="110" cy="110" r="52" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={110 + Math.cos(a) * 52}
              y1={110 + Math.sin(a) * 52}
              x2={110 + Math.cos(a) * 100}
              y2={110 + Math.sin(a) * 100}
            />
          );
        })}
      </g>
    </svg>
  );
}
