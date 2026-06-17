import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, Download, FileSpreadsheet, FileText, Loader2
} from 'lucide-react';
import type { EnrichedRequest, EnrichedProject, UserRecord } from '../types/insights';
import {
  computeRequestStats, groupByMonth, groupByField, groupByAssignedStaff,
  computeSlaStats, computeSlaTrend, computeResolutionTrend,
  computeProjectStats, computeProjectCompletionTrend, computeProjectDurationAnalysis,
  computeTeamWorkload, computeManagementSummary
} from '../utils/insights';
import { exportToCSV, exportToExcel, exportToPDF, prepRequestsForExport, prepProjectsForExport, prepTeamForExport } from '../utils/export';
import RequestInsights from '../components/Insights/RequestInsights';
import SlaInsights from '../components/Insights/SlaInsights';
import ProjectInsights from '../components/Insights/ProjectInsights';
import TeamWorkload from '../components/Insights/TeamWorkload';
import ManagementSummary from '../components/Insights/ManagementSummary';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'sla', label: 'SLA' },
  { key: 'projects', label: 'Projects' },
  { key: 'team', label: 'Team' },
  { key: 'summary', label: 'Summary' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function Insights() {
  useEffect(() => { document.title = 'Insights — DIX Portal'; }, []);
  const { isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [projectMembers, setProjectMembers] = useState<{ project_id: number; user_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.insights.fetchAll();
      setRequests(data.requests);
      setProjects(data.projects);
      setUsers(data.users);
      setProjectMembers(data.projectMembers || []);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Section 1: Request Insights ---
  const requestStats = useMemo(() => computeRequestStats(requests), [requests]);
  const requestMonthlyTrend = useMemo(() => groupByMonth(requests), [requests]);
  const requestByCategory = useMemo(() => groupByField(requests, 'category'), [requests]);
  const requestByDepartment = useMemo(() => groupByField(requests, 'department'), [requests]);
  const requestByStaff = useMemo(() => groupByAssignedStaff(requests), [requests]);
  const requestStatusDist = useMemo(() => groupByField(requests, 'status'), [requests]);
  const requestByUrgency = useMemo(() => groupByField(requests, 'urgency'), [requests]);

  // --- Section 2: SLA Insights ---
  const slaStats = useMemo(() => computeSlaStats(requests), [requests]);
  const slaTrend = useMemo(() => computeSlaTrend(requests), [requests]);
  const overdueTrend = useMemo(() => computeSlaTrend(requests), [requests]); // same data, displayed differently
  const resolutionTrend = useMemo(() => computeResolutionTrend(requests), [requests]);

  // --- Section 3: Project Insights ---
  const projectStats = useMemo(() => computeProjectStats(projects), [projects]);
  const projectCompletionTrend = useMemo(() => computeProjectCompletionTrend(projects), [projects]);
  const projectDurationAnalysis = useMemo(() => computeProjectDurationAnalysis(projects), [projects]);

  // --- Section 4: Team Workload ---
  const teamWorkload = useMemo(() => computeTeamWorkload(requests, projects, users, projectMembers), [requests, projects, users, projectMembers]);

  // --- Section 5: Management Summary ---
  const managementSummary = useMemo(() => computeManagementSummary(requests, projects, users), [requests, projects, users]);

  // --- Export handlers ---
  const handleExportCSV = () => {
    switch (activeTab) {
      case 'requests':
      case 'sla':
        exportToCSV(prepRequestsForExport(requests), `insights-requests-${Date.now()}`);
        break;
      case 'projects':
        exportToCSV(prepProjectsForExport(projects), `insights-projects-${Date.now()}`);
        break;
      case 'team':
        exportToCSV(prepTeamForExport(teamWorkload), `insights-team-${Date.now()}`);
        break;
      case 'summary':
        exportToCSV(prepRequestsForExport(requests), `insights-summary-${Date.now()}`);
        break;
    }
  };

  const handleExportExcel = () => {
    const sheets = [
      { name: 'Requests', data: prepRequestsForExport(requests) },
      { name: 'Projects', data: prepProjectsForExport(projects) },
      { name: 'Team', data: prepTeamForExport(teamWorkload) },
    ];
    exportToExcel(sheets, `insights-report-${Date.now()}`);
  };

  const handleExportPDF = () => {
    exportToPDF();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="glass p-8 text-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Loading insights data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-50 dark:bg-primary-500/15 rounded-xl flex items-center justify-center">
              <BarChart3 size={18} className="sm:hidden text-primary-600 dark:text-primary-400" />
              <BarChart3 size={20} className="hidden sm:block text-primary-600 dark:text-primary-400" />
            </div>
            Insights
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm ml-[38px] sm:ml-[46px]">Analytics, trends and management reporting</p>
        </div>

        {/* Export buttons (hidden for guests) */}
        {!isGuest && (
          <div className="flex gap-1.5 sm:gap-2 print:hidden overflow-x-auto scrollbar-hide">
            <button onClick={handleExportCSV}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors whitespace-nowrap">
              <Download size={13} /> CSV
            </button>
            <button onClick={handleExportExcel}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors whitespace-nowrap">
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors whitespace-nowrap">
              <FileText size={13} /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-100 dark:bg-gray-800/50 p-1 sm:p-1.5 flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide rounded-lg sm:rounded-xl print:hidden">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-[13px] sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div id="insights-content">
        {activeTab === 'requests' && (
          <RequestInsights
            stats={requestStats}
            monthlyTrend={requestMonthlyTrend}
            byCategory={requestByCategory}
            byDepartment={requestByDepartment}
            byStaff={requestByStaff}
            statusDistribution={requestStatusDist}
            byUrgency={requestByUrgency}
          />
        )}
        {activeTab === 'sla' && (
          <SlaInsights
            stats={slaStats}
            slaTrend={slaTrend}
            overdueTrend={overdueTrend}
            resolutionTrend={resolutionTrend}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectInsights
            stats={projectStats}
            completionTrend={projectCompletionTrend}
            durationAnalysis={projectDurationAnalysis}
          />
        )}
        {activeTab === 'team' && (
          <TeamWorkload team={teamWorkload} />
        )}
        {activeTab === 'summary' && (
          <ManagementSummary summary={managementSummary} />
        )}
      </div>
    </div>
  );
}
