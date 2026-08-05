import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { HardDrive, Activity, Mic, Mail, MessageSquare } from 'lucide-react';

export function PlatformUsage() {
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data } = await api.get('/superadmin/platform-usage');
        setUsageData(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  return (
    <div className=" flex-col gap-6" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Platform Usage</h1>
          <p className="text-secondary">Aggregated consumption metrics across all tenant organizations.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-secondary">Loading usage metrics...</div>
      ) : usageData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UsageCard title="Storage Consumed" value={`${usageData.storageUsedGb} GB`} icon={<HardDrive size={24}/>} color="text-blue-400" bg="bg-blue-500/10" percent={65} />
          <UsageCard title="API Requests" value={(usageData.apiRequests / 1000000).toFixed(1) + 'M'} icon={<Activity size={24}/>} color="text-purple-400" bg="bg-purple-500/10" percent={45} />
          <UsageCard title="AI Voice Minutes" value={usageData.aiVoiceMinutes.toLocaleString()} icon={<Mic size={24}/>} color="text-pink-400" bg="bg-pink-500/10" percent={82} warning />
          <UsageCard title="Emails Sent" value={usageData.emailsSent.toLocaleString()} icon={<Mail size={24}/>} color="text-emerald-400" bg="bg-emerald-500/10" percent={20} />
          <UsageCard title="SMS Sent" value={usageData.smsSent.toLocaleString()} icon={<MessageSquare size={24}/>} color="text-amber-400" bg="bg-amber-500/10" percent={15} />
        </div>
      ) : (
        <div className="p-12 text-center text-danger">Failed to load platform usage.</div>
      )}
    </div>
  );
}

function UsageCard({ title, value, icon, color, bg, percent, warning }: any) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
          {icon}
        </div>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{title}</span>
          <span className={`text-sm font-bold ${warning ? 'text-amber-500' : 'text-success'}`}>{percent}% Capacity</span>
        </div>
        <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
          <div className={`h-full ${warning ? 'bg-amber-500' : 'bg-success'}`} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    </div>
  );
}
