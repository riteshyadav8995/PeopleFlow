import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';

export function AttendanceWidget({ 
  attendanceToday, 
  clockInMutation, 
  clockOutMutation 
}: { 
  attendanceToday: any; 
  clockInMutation: any; 
  clockOutMutation: any; 
}) {
  const isPunchedIn = !!attendanceToday?.clockInTime && !attendanceToday?.clockOutTime;
  const isPunchedOut = !!attendanceToday?.clockOutTime;

  return (
    <Card className="h-full flex flex-col relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-brand-50 rounded-lg">
          <Clock className="w-5 h-5 text-brand-600" />
        </div>
        <h3 className="font-semibold text-heading">Attendance</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10">
        {!attendanceToday ? (
          <div className="mb-6">
            <p className="text-subtle mb-2">You haven't clocked in today.</p>
            <p className="text-sm text-subtle">Ready to start your day?</p>
          </div>
        ) : (
          <div className="mb-6 w-full px-4">
            <div className="flex justify-between items-center widget-box mb-3">
              <span className="text-subtle text-sm">Clock In</span>
              <span className="text-body font-medium">{format(new Date(attendanceToday.clockInTime), 'hh:mm a')}</span>
            </div>
            {attendanceToday.clockOutTime && (
              <div className="flex justify-between items-center widget-box">
                <span className="text-subtle text-sm">Clock Out</span>
                <span className="text-body font-medium">{format(new Date(attendanceToday.clockOutTime), 'hh:mm a')}</span>
              </div>
            )}
          </div>
        )}

        <div className="w-full mt-auto">
          {isPunchedOut ? (
            <Button className="w-full" disabled variant="secondary">
              Day Completed
            </Button>
          ) : isPunchedIn ? (
            <Button 
              className="w-full"
              variant="danger"
              onClick={() => clockOutMutation.mutate()}
              isLoading={clockOutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Clock Out
            </Button>
          ) : (
            <Button 
              className="w-full"
              variant="primary"
              onClick={() => clockInMutation.mutate()}
              isLoading={clockInMutation.isPending}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Clock In
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
