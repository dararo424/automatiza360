export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full" role="status" aria-label="Cargando">
      <svg className="h-12 w-12" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="19" stroke="#dcd9cd" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r="19"
          stroke="#2c7229"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="90 120"
          className="origin-center animate-spin"
        />
        <circle cx="24" cy="24" r="5" fill="#c9f24b" className="animate-pulse" />
      </svg>
    </div>
  );
}
