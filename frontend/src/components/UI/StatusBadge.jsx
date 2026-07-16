const statusStyles = {
  active: 'bg-green-100 text-green-800',
  published: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  warming: 'bg-orange-100 text-orange-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
  paused: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  suspended: 'bg-red-100 text-red-800',
  deleted: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-600',
  ready: 'bg-blue-100 text-blue-800',
}

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

export default StatusBadge
