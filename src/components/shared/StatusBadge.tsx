interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusClasses: Record<string, string> = {
  'New': 'status-new',
  'In Progress': 'status-in-progress',
  'Pending Info': 'status-pending-info',
  'Completed': 'status-completed',
  'Escalated': 'status-escalated',
  'Overdue': 'status-overdue',
  'Assigned': 'status-assigned',
  'Unassigned': 'status-unassigned',
  'Active': 'status-active',
  'Planning': 'status-planning',
  'On Track': 'status-on-track',
  'Delayed': 'status-delayed',
  'On Hold': 'status-on-hold',
  'Cancelled': 'status-cancelled',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const classes = statusClasses[status] || 'status-default';
  return (
    <span className={`inline-flex items-center justify-center h-[24px] px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap leading-none ${classes} ${className}`}>
      {status}
    </span>
  );
}
