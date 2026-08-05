import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { Spinner } from '@/components/ui/Spinner';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, Mail, Phone, MapPin, Building2, User, FileText } from 'lucide-react';
import './EmployeeProfile.css';

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployeeById(id as string),
    enabled: !!id
  });

  if (isLoading) {
    return <div className="ep-loading"><Spinner /></div>;
  }

  if (!employee) {
    return (
      <div className="ep-not-found">
        <User size={48} />
        <p>Employee not found.</p>
        <Link to="/organization/employees" className="ep-back-link">← Back to Employees</Link>
      </div>
    );
  }

  const initials = `${employee.firstName?.charAt(0) || ''}${employee.lastName?.charAt(0) || ''}`;
  const statusClass = employee.status === 'active' ? 'active' : employee.status === 'probation' ? 'probation' : employee.status === 'terminated' ? 'terminated' : 'default';

  return (
    <div className="ep-container">

      {/* Header */}
      <div className="ep-header">
        <Link to="/organization/employees" className="ep-back-btn">
          <ArrowLeft size={18} />
        </Link>
        <span className="ep-header-label">Back to Employees</span>
      </div>

      {/* Banner */}
      <div className="ep-banner">
        <div className="ep-banner-info">
          <h2 className="ep-name">{employee.firstName} {employee.lastName}</h2>
          <p className="ep-designation">
            {employee.designation?.title || 'No Designation'}
            {employee.department?.name ? ` · ${employee.department.name}` : ''}
          </p>
        </div>
        <div className="ep-banner-right">
          <span className="ep-id-pill">{employee.employeeCode}</span>
          <span className={`ep-status-badge ${statusClass}`}>
            {(employee.status || 'active').charAt(0).toUpperCase() + (employee.status || 'active').slice(1)}
          </span>
        </div>
      </div>

      {/* Three Equal Cards */}
      <div className="eprof-cards-row">

        {/* Card 1 — Contact */}
        <div className="eprof-card">
          <div className="eprof-card-header">
            <div className="eprof-card-icon-wrap ep-icon-blue"><Mail size={15} /></div>
            <h3 className="eprof-card-title">Contact Info</h3>
          </div>
          <div className="ep-contact-list">
            <div className="ep-contact-item">
              <Mail size={14} className="ep-contact-icon" />
              <a href={`mailto:${employee.email}`} className="ep-contact-link">{employee.email}</a>
            </div>
            {employee.phone && (
              <div className="ep-contact-item">
                <Phone size={14} className="ep-contact-icon" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="ep-contact-item">
              <MapPin size={14} className="ep-contact-icon" />
              <span>{employee.branch?.name || 'No Branch Assigned'}</span>
            </div>
            <div className="ep-contact-item">
              <User size={14} className="ep-contact-icon" />
              <span>{employee.role || '—'}</span>
            </div>
          </div>
        </div>

        {/* Card 2 — Employment */}
        <div className="eprof-card">
          <div className="eprof-card-header">
            <div className="eprof-card-icon-wrap ep-icon-purple"><Briefcase size={15} /></div>
            <h3 className="eprof-card-title">Employment Details</h3>
          </div>
          <div className="ep-detail-list">
            <div className="ep-detail-row">
              <span className="ep-dl-label"><Building2 size={12} /> Department</span>
              <span className="ep-dl-value">{employee.department?.name || '—'}</span>
            </div>
            <div className="ep-detail-row">
              <span className="ep-dl-label"><User size={12} /> Manager</span>
              <span className="ep-dl-value">
                {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—'}
              </span>
            </div>
            <div className="ep-detail-row">
              <span className="ep-dl-label"><Calendar size={12} /> Join Date</span>
              <span className="ep-dl-value">
                {new Date(employee.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="ep-detail-row">
              <span className="ep-dl-label"><Briefcase size={12} /> Type</span>
              <span className="ep-type-badge">{employee.employmentType?.replace('_', ' ') || '—'}</span>
            </div>
          </div>
        </div>

        {/* Card 3 — Documents */}
        <div className="eprof-card">
          <div className="eprof-card-header">
            <div className="eprof-card-icon-wrap ep-icon-green"><FileText size={15} /></div>
            <h3 className="eprof-card-title">Documents</h3>
          </div>
          <div className="ep-docs-empty">
            <FileText size={32} className="ep-docs-icon" />
            <p className="ep-docs-text">No documents yet.</p>
            <p className="ep-docs-hint">Contact HR to upload documents.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
