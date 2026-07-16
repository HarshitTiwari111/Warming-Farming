const LoadingSkeleton = ({ rows = 5, type = 'table' }) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 bg-gray-200 rounded" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded" />
      ))}
    </div>
  )
}

export default LoadingSkeleton
