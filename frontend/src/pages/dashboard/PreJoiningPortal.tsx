import { useState } from 'react';
import { Waves, CheckCircle, FileText, Upload, Clock, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '../../services/onboarding.service';
import { Spinner } from '@/components/ui/Spinner';

export function PreJoiningPortal() {
  const { user } = useAuthStore();
  
  const queryClient = useQueryClient();

  const { data: realTasks, isLoading } = useQuery({
    queryKey: ['myOnboardingTasks'],
    queryFn: () => onboardingService.getMyTasks()
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => onboardingService.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOnboardingTasks'] });
    }
  });

  const tasks = realTasks || [];
  const completedCount = tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand-600">
            <Waves size={28} />
            <span className="text-xl font-bold text-gray-900">Pre-joining Portal</span>
          </div>
          <div className="text-sm font-medium text-gray-600">
            Welcome, {user?.firstName || 'New Joiner'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-8">
        
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Welcome aboard, {user?.firstName}!</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We are thrilled to have you join the team. To get you set up for your first day on Oct 15, please complete the onboarding tasks below.
          </p>
        </div>

        {/* Progress Card */}
        <div className="card p-6 bg-white shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Progress</h2>
            <span className="text-brand-600 font-bold">{progress}% Completed</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="card bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Required Tasks</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Spinner />
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No onboarding tasks assigned yet.</div>
            ) : tasks.map((task: any) => (
              <div key={task.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {task.status === 'COMPLETED' ? <CheckCircle size={18} /> : <Clock size={18} />}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-semibold text-base ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  {task.status === 'PENDING' && (
                    <div className="mt-4">
                      {task.title.toLowerCase().includes('upload') ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                          <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                          <p className="text-sm text-gray-500 mb-4">Drag and drop your document here, or click to browse.</p>
                          <Button variant="secondary" className="px-3 py-1 text-sm">Browse Files</Button>
                        </div>
                      ) : (
                        <Button 
                          className="px-3 py-1 text-sm"
                          onClick={() => completeTaskMutation.mutate(task.id)}
                          isLoading={completeTaskMutation.isPending && completeTaskMutation.variables === task.id}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
