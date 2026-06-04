interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusClasses: Record<string, string> = {
  'New': 'status-new',
  'In Progress': 'status-in-progress',
  'Pending Info': 'status-pending-info',
  'Completed': 'status-completed',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const classes = statusClasses[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}>
      {status}
    </span>
  );
}
