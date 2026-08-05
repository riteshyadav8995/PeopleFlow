import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function EmployeeAttendance() {
  const { user } = useAuthStore();
  const orgId = user?.organizationId || user?.tenantId || '';
  const queryClient = useQueryClient();

  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [geoError, setGeoError] = useState('');

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', orgId, month, year],
    queryFn: () => attendanceService.getMyAttendance(orgId, month, year)
  });

  const todayRecord = records?.find((r: any) => {
    const recordDate = new Date(r.date);
    return recordDate.toDateString() === today.toDateString();
  });

  const isClockedIn = todayRecord && !todayRecord.clockOutTime;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeoError('Location access denied. You must enable GPS to clock in.')
      );
    } else {
      setGeoError('Geolocation is not supported by this browser.');
    }
  }, []);

  const clockInMutation = useMutation({
    mutationFn: () => attendanceService.clockIn({ 
      organizationId: orgId, 
      latitude: location?.lat, 
      longitude: location?.lng 
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clock in')
  });

  const clockOutMutation = useMutation({
    mutationFn: () => attendanceService.clockOut({ 
      latitude: location?.lat, 
      longitude: location?.lng 
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to clock out')
  });

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          My Attendance
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your daily clock-ins and view timesheets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col items-center justify-center text-center p-8 border-t-4 border-t-indigo-600">
          <h2 className="text-lg font-semibold mb-2">Today's Status</h2>
          
          {geoError && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-2 rounded w-full justify-center">
              <AlertCircle className="w-4 h-4" />
              {geoError}
            </div>
          )}

          {!geoError && location && (
            <div className="flex items-center gap-1 text-green-600 text-xs mb-4">
              <MapPin className="w-3 h-3" /> Location acquired
            </div>
          )}

          <div className="text-4xl font-bold text-gray-900 mb-6">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {!todayRecord ? (
            <button 
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending || !!geoError}
              className="w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
            </button>
          ) : isClockedIn ? (
            <button 
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending || !!geoError}
              className="w-full bg-orange-500 text-white py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-600 py-3 rounded-md font-semibold">
              Clocked Out
            </div>
          )}

          {todayRecord && (
            <div className="mt-6 text-sm text-gray-600 space-y-2">
              <div className="flex justify-between w-full border-b pb-1">
                <span>Clock In</span>
                <span className="font-medium text-gray-900">{new Date(todayRecord.clockInTime).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between w-full">
                <span>Clock Out</span>
                <span className="font-medium text-gray-900">{todayRecord.clockOutTime ? new Date(todayRecord.clockOutTime).toLocaleTimeString() : '--:--'}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">This Month's Timesheet</h3>
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Clock In</th>
                    <th className="px-4 py-3">Clock Out</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {records?.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No attendance records found.</td></tr>
                  ) : (
                    records?.map((record: any) => {
                      let displayStatus = record.status.toUpperCase();
                      let statusClass = record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

                      if (record.status === 'absent' && record.clockInTime && !record.clockOutTime) {
                        displayStatus = 'SINGLE PUNCH';
                        statusClass = 'bg-red-100 text-red-700';
                      }

                      return (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{new Date(record.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3">{record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{record.totalHours ? record.totalHours.toFixed(2) + 'h' : '-'}</td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
