import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Shield, MessageSquare, Search, Filter, LifeBuoy } from 'lucide-react';

export function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await api.get('/superadmin/support/tickets');
        setTickets(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleImpersonate = async (ticket: any) => {
    const reason = prompt(`Reason for accessing organization via Ticket #${ticket.id.substring(0,6)}:`);
    if (!reason) return;

    try {
      await api.post('/superadmin/support/impersonation/start', {
        ticketId: ticket.id,
        organizationId: ticket.organizationId,
        reason
      });
      alert(`Impersonation session established for Organization ${ticket.organizationId}. Note: This action has been audited.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Support Tickets</h1>
          <p className="text-secondary">Resolve platform issues and provide audited support sessions.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-lg border border-white/5 flex-1 max-w-sm">
          <Search size={18} className="text-secondary" />
          <input type="text" placeholder="Search tickets..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
        <Button variant="secondary" leftIcon={<Filter size={18} />}>Filters</Button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="p-12 text-center text-secondary">Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
               <LifeBuoy className="text-secondary" size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">No Open Tickets</h3>
             <p className="text-secondary">There are no open support requests at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/20 text-sm font-medium text-secondary">
                  <th className="p-4 pl-6">Ticket</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold">{ticket.subject}</div>
                      <div className="text-xs text-secondary truncate max-w-xs">{ticket.description}</div>
                    </td>
                    <td className="p-4 text-sm">{ticket.organizationId}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        ticket.status === 'open' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        ticket.status === 'resolved' ? 'bg-success/10 text-success border-success/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {ticket.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-secondary/10 text-secondary border-secondary/20'
                      }`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 pr-6">
                      <div className="flex gap-2">
                        <Button variant="secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          <MessageSquare size={14} className="mr-1.5"/> Reply
                        </Button>
                        <Button 
                          variant="primary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none' }}
                          onClick={() => handleImpersonate(ticket)}
                        >
                          <Shield size={14} className="mr-1.5" />
                          Impersonate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
