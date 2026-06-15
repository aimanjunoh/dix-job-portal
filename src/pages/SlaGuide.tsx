import { useEffect } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle2, Pause } from 'lucide-react';

export default function SlaGuide() {
  useEffect(() => { document.title = 'SLA Guide — DIX Portal'; }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          SLA Guide
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Service Level Agreement reference for DIX Unit request handling.
        </p>
      </div>

      {/* Priority Levels */}
      <div className="glass p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={15} className="text-primary-500" /> Priority Levels
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700/50">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SLA Target</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="px-3 py-3">
                  <span className="inline-flex items-center h-[24px] px-2.5 rounded-full text-[11px] font-semibold urgency-normal">Normal</span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">3 Working Days</td>
                <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">Routine website updates, content changes, image updates, PDF uploads, and general maintenance.</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="px-3 py-3">
                  <span className="inline-flex items-center h-[24px] px-2.5 rounded-full text-[11px] font-semibold urgency-urgent">Urgent</span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">1 Working Day</td>
                <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">Time-sensitive requests requiring immediate attention. <span className="text-amber-600 dark:text-amber-400 font-medium">Justification required.</span></td>
              </tr>
              <tr>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center h-[24px] px-2.5 rounded-full text-[11px] font-semibold urgency-critical">Critical</span>
                </td>
                <td className="px-3 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">Same Working Day</td>
                <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">Website outage, major functional issue, security incident, or business-critical disruption. <span className="text-red-600 dark:text-red-400 font-medium">Justification required.</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Definitions */}
      <div className="glass p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-500" /> Priority Definitions
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">Normal Priority</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Standard requests that follow the regular workflow. Includes routine website updates, content changes, image replacements, PDF uploads, and general maintenance tasks. No urgency justification required.
            </p>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">Urgent Priority</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Time-sensitive requests that require expedited handling due to operational impact or external deadlines. Must include a justification explaining the urgency. Examples: upcoming event pages, regulatory compliance updates, stakeholder-driven deadlines.
            </p>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">Critical Priority</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Emergency requests involving system failures or business-critical disruptions. Must include a justification describing the impact. Examples: website outage, security vulnerability, broken critical functionality preventing business operations.
            </p>
          </div>
        </div>
      </div>

      {/* Office Hours */}
      <div className="glass p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock size={15} className="text-primary-500" /> Office Hours
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-gray-800/50">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-40 flex-shrink-0">Monday – Thursday</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">8:30 AM – 5:00 PM</span>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-gray-800/50">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-40 flex-shrink-0">Friday</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">8:30 AM – 12:30 PM</span>
          </div>
          <div className="flex items-center gap-4 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-40 flex-shrink-0">Weekends & Holidays</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Closed</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
          <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
            <span className="font-semibold">Note:</span> Requests submitted outside office hours (including weekends and public holidays) are treated as received on the next working day. SLA countdown begins from that point.
          </p>
        </div>
      </div>

      {/* SLA Rules */}
      <div className="glass p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-500" /> SLA Rules
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">SLA is calculated using <span className="font-medium text-gray-800 dark:text-gray-200">working days only</span>. Weekends and public holidays are excluded.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Requests submitted outside office hours are considered received on the <span className="font-medium text-gray-800 dark:text-gray-200">next working day</span>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">SLA countdown <span className="font-medium text-gray-800 dark:text-gray-200">pauses</span> when a request enters any of these statuses: <span className="inline-flex items-center gap-1 flex-wrap"><span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Pending Info</span><span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Pending Content</span><span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Pending Approval</span><span className="text-[11px] px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium">Pending Vendor</span></span></span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">When a request exits a pending status, the SLA <span className="font-medium text-gray-800 dark:text-gray-200">resumes from the remaining balance</span> — paused working days are added back to the due date.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Completed requests are always marked as <span className="text-green-600 dark:text-green-400 font-medium">"Within SLA"</span>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">DIX Unit may review and adjust priority levels when necessary.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
