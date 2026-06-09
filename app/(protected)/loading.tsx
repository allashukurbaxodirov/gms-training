export default function Loading() {
  return (
    <div className="pt-14 lg:pl-56 min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="p-5 max-w-7xl space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-60 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
