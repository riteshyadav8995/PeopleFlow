import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Network } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import './OrgChart.css';

const OrgNode = ({ node, level = 0 }: { node: any, level?: number }) => {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className="org-node-wrapper">
      <div className={`org-card ${level === 0 ? 'root' : ''}`}>
        <div className="org-avatar">
          {node.firstName?.charAt(0)}{node.lastName?.charAt(0)}
        </div>
        <h3 className="org-name">{node.firstName} {node.lastName}</h3>
        <p className="org-role">{node.designation?.title || 'No Designation'}</p>
        <p className="org-dept">{node.department?.name || 'No Department'}</p>
      </div>

      {hasChildren && (
        <div className="org-children-container">
          {/* Vertical line from parent to horizontal line */}
          <div className="line-vertical-parent"></div>
          
          <div className="org-children-row">
            {/* Horizontal line connecting children */}
            {node.children.length > 1 && (
              <div 
                className="line-horizontal"
                style={{
                  left: `calc(50% / ${node.children.length} + 1.5rem)`,
                  right: `calc(50% / ${node.children.length} + 1.5rem)`
                }}
              ></div>
            )}
            
            {node.children.map((child: any) => (
              <div key={child.id} className="child-node-container">
                {/* Vertical line from horizontal line down to child */}
                <div className="line-vertical-child"></div>
                <OrgNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function OrgChart() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  const { data: employees, isLoading } = useQuery({
    queryKey: ['orgChart', organizationId],
    queryFn: async () => {
      const res = await api.get('/employee', { 
        params: { organizationId } 
      });
      return res.data.data;
    },
    enabled: !!organizationId
  });

  const orgTree = useMemo(() => {
    if (!employees || employees.length === 0) return null;

    // Create a map of id to employee object
    const empMap = new Map();
    employees.forEach((emp: any) => {
      empMap.set(emp.id, { ...emp, children: [] });
    });

    let rootNodes: any[] = [];

    // Build the tree
    empMap.forEach((emp: any) => {
      if (emp.reportingTo && empMap.has(emp.reportingTo)) {
        empMap.get(emp.reportingTo).children.push(emp);
      } else {
        rootNodes.push(emp);
      }
    });

    return rootNodes;
  }, [employees]);

  return (
    <div className="org-chart-container page-container">
      <div className="org-header">
        <div className="org-title-wrapper">
          <h1 className="org-title">
            <Network className="org-title-icon" size={24} />
            Organization Chart
          </h1>
          <p className="org-subtitle">Visual reporting hierarchy of the organization.</p>
        </div>
      </div>

      <div className="org-canvas">
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spinner />
          </div>
        ) : !orgTree || orgTree.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            No organizational data available.
          </div>
        ) : (
          <div className="org-tree">
            {orgTree.map(root => (
              <OrgNode key={root.id} node={root} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
