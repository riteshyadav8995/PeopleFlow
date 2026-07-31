import { Card } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import { Spinner } from '@/components/ui/Spinner';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCircle, Briefcase, Calendar, Mail, Phone, MapPin } from 'lucide-react';

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployeeById(id as string),
    enabled: !!id
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!employee) {
    return <div className="text-center py-12 text-gray-500">Employee not found.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/employees" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
          <p className="text-sm text-gray-500 mt-1">{employee.employeeCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Personal Info */}
        <Card className="md:col-span-1 border-t-4 border-t-indigo-600">
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-3xl mb-4">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h2>
            <p className="text-gray-500">{employee.designation?.title || 'No Designation'}</p>
            <span className={`mt-3 px-3 py-1 text-xs font-medium rounded-full ${
                          employee.status === 'active' ? 'bg-green-100 text-green-700' :
                          employee.status === 'probation' ? 'bg-blue-100 text-blue-700' :
                          employee.status === 'terminated' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
            </span>
          </div>

          <div className="pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact Information</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${employee.email}`} className="hover:text-indigo-600">{employee.email}</a>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{employee.branch?.name || 'No Branch Assigned'}</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Work Info & Documents */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Employment Details
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Department</p>
                <p className="font-medium text-gray-900">{employee.department?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Reporting Manager</p>
                <p className="font-medium text-gray-900">
                  {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Join Date
                </p>
                <p className="font-medium text-gray-900">{new Date(employee.joinDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Employment Type</p>
                <p className="font-medium text-gray-900 capitalize">{employee.employmentType.replace('_', ' ')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Upload New</button>
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500">
              <UserCircle className="w-8 h-8 mb-2 text-gray-400" />
              <p className="text-sm">No documents uploaded yet.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
