import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { dashboardService } from '@/services/dashboard.service';
import { DocumentWidget } from '@/components/dashboard/DocumentWidget';
import { FileText, Download, Eye } from 'lucide-react';

const Skeleton = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export function EmployeeDocuments() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || '';

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['employeeDashboard', orgId],
    queryFn: () => dashboardService.getEmployeeDashboard(orgId),
    enabled: !!orgId
  });

  if (isLoading) return <div className="p-8 space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="skeleton-text-lg" style={{ height: '4rem' }} />)}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="mb-6">My Documents</h1>
      <div className="h-auto min-h-[400px]">
        <DocumentWidget documents={dashboardData?.documents || []} />
      </div>
    </div>
  );
}
