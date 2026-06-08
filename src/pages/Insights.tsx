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
  const { isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
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
  const teamWorkload = useMemo(() => computeTeamWorkload(requests, projects, users), [requests, projects, users]);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 size={28} /> Insights
          </h1>
          <p className="text-white/70 text-sm">Analytics, trends and management reporting</p>
        </div>

        {/* Export buttons (hidden for guests) */}
        {!isGuest && (
          <div className="flex gap-2 print:hidden">
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-medium text-gray-700 transition-all shadow-sm">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-medium text-gray-700 transition-all shadow-sm">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white rounded-xl text-sm font-medium text-gray-700 transition-all shadow-sm">
              <FileText size={14} /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="glass-dark p-1.5 flex gap-1 overflow-x-auto print:hidden">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
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
