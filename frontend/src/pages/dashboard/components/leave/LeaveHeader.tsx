import { Calendar, Download, Settings, Plus } from 'lucide-react';

export function LeaveHeader({ 
  onExport, 
  onOpenCalendar, 
  onOpenPolicyForm 
}: { 
  onExport?: () => void; 
  onOpenCalendar?: () => void; 
  onOpenPolicyForm?: () => void; 
}) {
  return (
    <div className="leave-header">
      <div className="leave-header-title">
        <h1>Leave Management</h1>
        <p>Manage organization-wide leave requests, approvals, balances and policies.</p>
      </div>
      <div className="leave-header-actions">
        <button className="btn btn-secondary" onClick={onOpenCalendar}>
          <Calendar size={16} />
          Leave Calendar
        </button>
        <button className="btn btn-secondary" onClick={onExport}>
          <Download size={16} />
          Export Report
        </button>
        <button className="btn btn-secondary">
          <Settings size={16} />
          Settings
        </button>
        <button className="btn btn-primary" onClick={onOpenPolicyForm}>
          <Plus size={16} />
          Create Leave Policy
        </button>
      </div>
    </div>
  );
}
