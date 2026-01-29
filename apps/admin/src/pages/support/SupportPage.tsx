import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, Plus, Search, Clock, 
  CheckCircle, AlertCircle, Send, Megaphone,
  Trash2, Edit
} from 'lucide-react';
import { Card, Badge, Button, Input, Select, Skeleton, Modal } from '@warehousepos/ui';
import { formatDate } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Type helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface SupportTicket {
  id: string;
  tenant_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution: string;
  created_at: string;
  tenant: {
    business_name: string;
    country: string;
  };
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender_type: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  target_countries: string[];
  is_dismissible: boolean;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export function SupportPage() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'announcements'>('tickets');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const [announcementType, setAnnouncementType] = useState('info');
  
  const queryClient = useQueryClient();

  // Tickets Query
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter],
    queryFn: async () => {
      let query = db
        .from('support_tickets')
        .select('*, tenant:tenants(business_name, country)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;
      return data as SupportTicket[];
    },
  });

  // Single ticket with messages
  const { data: ticketDetail } = useQuery({
    queryKey: ['ticket-detail', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return null;
      
      const [ticketRes, messagesRes] = await Promise.all([
        db.from('support_tickets').select('*, tenant:tenants(business_name, country)').eq('id', selectedTicket.id).single(),
        db.from('support_ticket_messages').select('*').eq('ticket_id', selectedTicket.id).order('created_at'),
      ]);

      return {
        ...(ticketRes.data || {} as any),
        messages: messagesRes.data || [],
      } as SupportTicket;
    },
    enabled: !!selectedTicket?.id,
  });

  // Announcements Query
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await db
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      return data as Announcement[];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const [open, inProgress, resolved] = await Promise.all([
        db.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'open'),
        db.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'in_progress'),
        db.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'resolved'),
      ]);
      return {
        open: open.count || 0,
        inProgress: inProgress.count || 0,
        resolved: resolved.count || 0,
      };
    },
  });

  // Update ticket status
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<SupportTicket> }) => {
      const { error } = await db
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ticket updated');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-detail'] });
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  // Send reply
  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message, isInternal }: { ticketId: string; message: string; isInternal: boolean }) => {
      const { error } = await db
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          message,
          is_internal: isInternal,
        });
      if (error) throw error;

      // Update ticket status to in_progress if open
      if (selectedTicket?.status === 'open') {
        await db
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', ticketId);
      }
    },
    onSuccess: () => {
      toast.success('Reply sent');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['ticket-detail'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: () => toast.error('Failed to send reply'),
  });

  // Create/update announcement
  const announcementMutation = useMutation({
    mutationFn: async (announcement: Partial<Announcement>) => {
      if (editAnnouncement?.id) {
        const { error } = await db
          .from('announcements')
          .update(announcement)
          .eq('id', editAnnouncement.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('announcements')
          .insert(announcement);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editAnnouncement ? 'Announcement updated' : 'Announcement created');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowAnnouncementModal(false);
      setEditAnnouncement(null);
    },
    onError: () => toast.error('Failed to save announcement'),
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Announcement deleted');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => toast.error('Failed to delete announcement'),
  });

  const filteredTickets = tickets?.filter(t =>
    t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.tenant?.business_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" /> Open</Badge>;
      case 'in_progress':
        return <Badge variant="info"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support</h1>
          <p className="text-muted-foreground">Manage tickets and announcements</p>
        </div>
        {activeTab === 'announcements' && (
          <Button onClick={() => { setEditAnnouncement(null); setShowAnnouncementModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Open Tickets</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.open || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'tickets' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('tickets')}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Support Tickets
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'announcements' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Megaphone className="w-4 h-4 inline mr-2" />
          Announcements
        </button>
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="sm:max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>

          {ticketsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </Card>
              ))}
            </div>
          ) : filteredTickets && filteredTickets.length > 0 ? (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        ticket.status === 'open' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        ticket.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <MessageSquare className={`w-6 h-6 ${
                          ticket.status === 'open' ? 'text-yellow-600' :
                          ticket.status === 'in_progress' ? 'text-blue-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono text-muted-foreground">
                            {ticket.ticket_number}
                          </span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.tenant?.business_name} • {formatDate(ticket.created_at, 'short')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">No tickets found</p>
              <p className="text-sm text-muted-foreground">Support tickets will appear here</p>
            </Card>
          )}
        </>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <>
          {announcementsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        announcement.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        announcement.type === 'maintenance' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <Megaphone className={`w-5 h-5 ${
                          announcement.type === 'warning' ? 'text-yellow-600' :
                          announcement.type === 'maintenance' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                          <Badge variant={announcement.is_active ? 'success' : 'secondary'}>
                            {announcement.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{announcement.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            Target: {(announcement.target_countries as string[])?.map(c => c === 'GH' ? '🇬🇭' : '🇳🇬').join(' ')}
                          </span>
                          <span>Created {formatDate(announcement.created_at, 'short')}</span>
                          {announcement.ends_at && (
                            <span>Ends {formatDate(announcement.ends_at, 'short')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setEditAnnouncement(announcement); setShowAnnouncementModal(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this announcement?')) {
                            deleteAnnouncementMutation.mutate(announcement.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Megaphone className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">No announcements</p>
              <p className="text-sm text-muted-foreground">Create announcements to broadcast to tenants</p>
            </Card>
          )}
        </>
      )}

      {/* Ticket Detail Modal */}
      <Modal
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        title={`Ticket ${selectedTicket?.ticket_number}`}
      >
        {ticketDetail && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(ticketDetail.status)}
              {getPriorityBadge(ticketDetail.priority)}
              <Badge variant="outline" className="capitalize">{ticketDetail.category}</Badge>
            </div>

            <div>
              <h3 className="font-semibold text-lg">{ticketDetail.subject}</h3>
              <p className="text-sm text-muted-foreground">
                From: {ticketDetail.tenant?.business_name} • {formatDate(ticketDetail.created_at, 'full')}
              </p>
            </div>

            <Card className="p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{ticketDetail.description}</p>
            </Card>

            {/* Messages */}
            {ticketDetail.messages && ticketDetail.messages.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Messages</h4>
                {ticketDetail.messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender_type === 'admin' 
                        ? 'bg-primary/10 ml-8' 
                        : 'bg-muted/50 mr-8'
                    } ${msg.is_internal ? 'border-l-4 border-yellow-500' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {msg.sender_type === 'admin' ? 'Support Team' : 'Customer'}
                      </span>
                      {msg.is_internal && <Badge variant="warning" className="text-xs">Internal</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(msg.created_at, 'short')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Select
                value={ticketDetail.status}
                onValueChange={(value) => updateTicketMutation.mutate({ 
                  ticketId: ticketDetail.id, 
                  updates: { status: value, ...(value === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) }
                })}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'waiting_customer', label: 'Waiting Customer' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
              <Select
                value={ticketDetail.priority}
                onValueChange={(value) => updateTicketMutation.mutate({ 
                  ticketId: ticketDetail.id, 
                  updates: { priority: value }
                })}
                options={[
                  { value: 'low', label: 'Low Priority' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
            </div>

            {/* Reply Box */}
            <div className="border-t pt-4">
              <textarea
                className="w-full p-3 border rounded-lg"
                placeholder="Type your reply..."
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-between items-center mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" id="internalNote" className="rounded" />
                  <span className="text-muted-foreground">Internal note (customer won't see)</span>
                </label>
                <Button 
                  onClick={() => {
                    const isInternal = (document.getElementById('internalNote') as HTMLInputElement)?.checked;
                    sendReplyMutation.mutate({ 
                      ticketId: ticketDetail.id, 
                      message: replyText, 
                      isInternal 
                    });
                  }}
                  disabled={!replyText.trim() || sendReplyMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Announcement Modal */}
      <Modal
        open={showAnnouncementModal}
        onOpenChange={(open) => { if (!open) { setShowAnnouncementModal(false); setEditAnnouncement(null); } else { setAnnouncementType(editAnnouncement?.type || 'info'); }}}
        title={editAnnouncement ? 'Edit Announcement' : 'New Announcement'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const countries = formData.getAll('countries') as string[];
            const endsAt = formData.get('ends_at') as string;
            
            announcementMutation.mutate({
              title: formData.get('title') as string,
              message: formData.get('message') as string,
              type: announcementType,
              target_countries: countries.length > 0 ? countries : ['GH', 'NG'],
              is_dismissible: formData.get('is_dismissible') === 'on',
              is_active: formData.get('is_active') === 'on',
              starts_at: formData.get('starts_at') as string || new Date().toISOString(),
              ends_at: endsAt || undefined,
            });
          }}
        >
          <Input
            label="Title"
            name="title"
            defaultValue={editAnnouncement?.title}
            required
          />

          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              name="message"
              className="w-full mt-1 p-3 border rounded-lg"
              rows={4}
              defaultValue={editAnnouncement?.message}
              required
            />
          </div>

          <Select
            label="Type"
            value={announcementType}
            onValueChange={setAnnouncementType}
            options={[
              { value: 'info', label: 'Information' },
              { value: 'warning', label: 'Warning' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'feature', label: 'New Feature' },
            ]}
          />

          <div>
            <label className="text-sm font-medium block mb-2">Target Countries</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="countries"
                  value="GH"
                  defaultChecked={(editAnnouncement?.target_countries as string[])?.includes('GH') ?? true}
                  className="rounded"
                />
                <span>🇬🇭 Ghana</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="countries"
                  value="NG"
                  defaultChecked={(editAnnouncement?.target_countries as string[])?.includes('NG') ?? true}
                  className="rounded"
                />
                <span>🇳🇬 Nigeria</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="starts_at"
              type="datetime-local"
              defaultValue={editAnnouncement?.starts_at?.slice(0, 16)}
            />
            <Input
              label="End Date (optional)"
              name="ends_at"
              type="datetime-local"
              defaultValue={editAnnouncement?.ends_at?.slice(0, 16)}
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editAnnouncement?.is_active ?? true}
                className="rounded"
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_dismissible"
                defaultChecked={editAnnouncement?.is_dismissible ?? true}
                className="rounded"
              />
              <span className="text-sm">Dismissible</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAnnouncementModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={announcementMutation.isPending}>
              {announcementMutation.isPending ? 'Saving...' : editAnnouncement ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

