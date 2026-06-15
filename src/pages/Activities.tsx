import { useState, useEffect } from 'react';
import { api } from '../api';
import { Activity, Clock, User } from 'lucide-react';
import { formatRelativeTime } from '../utils/timeFormat';

export default function Activities() {
  useEffect(() => { document.title = 'Activity Logs — DIX Portal'; }, []);
  const [activities, setActivities] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => { loadActivities(); }, [page]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.activities.list({ page, limit });
      setActivities(data.activities);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getActionColor = (action: string) => {
    if (action.includes('Created')) return 'bg-green-400';
    if (action.includes('Updated')) return 'bg-primary-400';
    if (action.includes('Deleted')) return 'bg-red-400';
    if (action.includes('Assigned')) return 'bg-purple-400';
    if (action.includes('Status')) return 'bg-yellow-400';
    return 'bg-gray-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total activities</p>
      </div>

      <div className="glass p-5">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No activities recorded</div>
        ) : (
          <div className="space-y-4">
            {activities.map((act: any) => (
              <div key={act.id} className="flex gap-4 items-start pb-4 border-b border-gray-50 dark:border-gray-800/30 last:border-0 last:pb-0">
                <div className={`w-2.5 h-2.5 ${getActionColor(act.action)} rounded-full mt-1.5 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{act.action}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock size={12} />
                      {formatRelativeTime(act.timestamp)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{act.details}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                    <User size={12} />
                    {act.performed_by}
                    {act.request_id && <span>· Request #{act.request_id}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/60 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700/80">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/60 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700/80">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
