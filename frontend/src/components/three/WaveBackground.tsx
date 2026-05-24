export function WaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute bottom-0 left-0 w-full h-48"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,160 C360,280 1080,40 1440,160 L1440,320 L0,320 Z"
          fill="rgba(99, 102, 241, 0.03)"
        />
        <path
          d="M0,200 C360,320 1080,80 1440,200 L1440,320 L0,320 Z"
          fill="rgba(99, 102, 241, 0.02)"
        />
      </svg>
    </div>
  )
}

export default WaveBackground
