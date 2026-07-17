const statusStyles = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warming: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  skipped: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  ready: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  )
}

export default StatusBadge
