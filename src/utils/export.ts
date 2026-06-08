import * as XLSX from 'xlsx';

// --- CSV Export ---
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// --- Excel Export ---
export function exportToExcel(
  sheets: Array<{ name: string; data: Record<string, any>[] }>,
  filename: string
): void {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    if (data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); // Excel sheet name limit
    }
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// --- PDF Export (via browser print) ---
export function exportToPDF(): void {
  window.print();
}

// --- Helper ---
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Data prep helpers for export ---
export function prepRequestsForExport(requests: any[]): Record<string, any>[] {
  return requests.map(r => ({
    'Request ID': r.request_id,
    'Title': r.title,
    'Department': r.department,
    'Category': r.category,
    'Urgency': r.urgency,
    'Status': r.status,
    'Assigned To': r.assigned_name || 'Unassigned',
    'SLA Status': r.sla_status,
    'Created': r.created_at?.split('T')[0],
  }));
}

export function prepProjectsForExport(projects: any[]): Record<string, any>[] {
  return projects.map(p => ({
    'Project ID': p.project_id,
    'Title': p.title,
    'Status': p.status,
    'Owner': p.owner_name || 'Unassigned',
    'Progress': `${p.progress}%`,
    'Health': p.health,
    'Start Date': p.start_date,
    'Due Date': p.due_date,
  }));
}

export function prepTeamForExport(team: any[]): Record<string, any>[] {
  return team.map(t => ({
    'Name': t.name,
    'Assigned': t.assigned,
    'Completed': t.completed,
    'Overdue': t.overdue,
    'Active Projects': t.activeProjects,
    'SLA Compliance': `${t.slaCompliancePercent}%`,
    'Workload Score': t.workloadScore,
  }));
}
