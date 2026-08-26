import { useEffect, useState, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  MessageSquare,
  Send,
  Mail,
  X,
} from 'lucide-react';
import { supportAPI } from '@/services/api';
import { formatDate } from '@/utils';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function SupportTicketsList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTickets = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await supportAPI.getTickets({
          page,
          limit: 15,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        });

        const data = res.data?.data || res.data || {};
        const docs = data.docs || (Array.isArray(data) ? data : []);
        setTickets(docs);
        setPagination({
          page: data.page || page,
          limit: data.limit || 15,
          total: data.total || docs.length,
        });
      } catch (err) {
        toast.error('Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, priorityFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadTickets]);

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      await supportAPI.updateTicket(ticketId, { status });
      toast.success(`Status updated to ${status}`);
      loadTickets(pagination.page);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsReplying(true);
    try {
      await supportAPI.replyTicket(selectedTicket.id, {
        reply: replyText.trim(),
        status: 'resolved',
      });
      toast.success('Reply saved and marked resolved');
      setReplyText('');
      loadTickets(pagination.page);
      setSelectedTicket((prev) =>
        prev
          ? { ...prev, reply: replyText.trim(), status: 'resolved', repliedAt: new Date() }
          : null
      );
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTarget) return;
    try {
      await supportAPI.deleteTicket(deleteTarget);
      toast.success('Ticket deleted');
      setDeleteTarget(null);
      if (selectedTicket?.id === deleteTarget) setSelectedTicket(null);
      loadTickets(pagination.page);
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Support & Student Queries
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Review, answer, and manage student help requests and contact inquiries
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={LifeBuoy}
          title="Total Inquiries"
          value={pagination.total}
          color="primary"
          subtitle="All received tickets"
        />
        <StatsCard
          icon={AlertCircle}
          title="Open Tickets"
          value={openCount}
          color="amber"
          subtitle="Awaiting staff response"
        />
        <StatsCard
          icon={Clock}
          title="In Progress"
          value={inProgressCount}
          color="blue"
          subtitle="Currently investigating"
        />
        <StatsCard
          icon={CheckCircle2}
          title="Resolved"
          value={resolvedCount}
          color="emerald"
          subtitle="Successfully answered"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, subject, or query details..."
            className="input-field !pl-10 !text-xs sm:!text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field !text-xs sm:!text-sm sm:w-44"
        >
          <option value="">All Statuses</option>
          <option value="open">Open (Unanswered)</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field !text-xs sm:!text-sm sm:w-44"
        >
          <option value="">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          {
            key: 'id',
            label: 'Ticket ID',
            render: (val) => (
              <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                #EDU-{val ? String(val).slice(-6).toUpperCase() : 'REQ'}
              </span>
            ),
          },
          {
            key: 'name',
            label: 'Student / User',
            render: (_, row) => (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                  {row.name || 'Student'}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{row.email}</p>
              </div>
            ),
          },
          {
            key: 'subject',
            label: 'Subject & Category',
            render: (_, row) => (
              <div className="max-w-xs">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                    {row.category || 'General'}
                  </span>
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                  {row.subject}
                </p>
                <p className="text-[11px] text-gray-500 line-clamp-1">{row.message}</p>
              </div>
            ),
          },
          {
            key: 'priority',
            label: 'Priority',
            render: (val) => {
              const p = (val || 'medium').toLowerCase();
              const colors = {
                urgent:
                  'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
                high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
                medium:
                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
                low: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
              };
              return (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    colors[p] || colors.medium
                  }`}
                >
                  {p}
                </span>
              );
            },
          },
          {
            key: 'status',
            label: 'Status',
            render: (val, row) => (
              <select
                value={val || 'open'}
                onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className={`text-xs font-semibold py-1 px-2.5 rounded-lg border cursor-pointer ${
                  val === 'resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : val === 'in_progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                      : val === 'closed'
                        ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            ),
          },
          {
            key: 'createdAt',
            label: 'Submitted',
            render: (val) => formatDate(val),
          },
        ]}
        data={tickets}
        loading={loading}
        emptyMessage="No support tickets found"
        emptyIcon={LifeBuoy}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                setSelectedTicket(row);
                setReplyText(row.reply || '');
              }}
              className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40"
              title="View & Reply"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(row.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Delete Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 dark:bg-primary-950/50 text-primary-600 rounded-xl">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                    Ticket #EDU-{String(selectedTicket.id).slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Submitted on {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
              {/* Student Metadata Card */}
              <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-100 dark:border-gray-700/60">
                <div>
                  <span className="text-gray-400 text-[11px] block">Student Name</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedTicket.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Email Address</span>
                  <a
                    href={`mailto:${selectedTicket.email}`}
                    className="font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5 inline" /> {selectedTicket.email}
                  </a>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Category</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedTicket.category}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Current Status</span>
                  <span className="capitalize font-bold text-primary-600">
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                  {selectedTicket.subject}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Existing Staff Reply */}
              {selectedTicket.reply && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Official Staff Resolution / Reply:
                    </span>
                    {selectedTicket.repliedAt && (
                      <span className="text-[11px] text-gray-400">
                        {formatDate(selectedTicket.repliedAt)}
                      </span>
                    )}
                  </div>
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.reply}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <label className="block font-bold text-gray-900 dark:text-white">
                  {selectedTicket.reply ? 'Update Staff Reply:' : 'Write Official Reply:'}
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide detailed instructions, solution, or resolution notes..."
                  className="input-field !text-xs sm:!text-sm resize-none"
                  required
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="btn-secondary !text-xs !py-2"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="btn-primary !text-xs !py-2 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isReplying ? 'Sending...' : 'Send Reply & Resolve'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTicket}
        title="Delete Support Ticket"
        message="Are you sure you want to permanently delete this support ticket?"
        confirmText="Delete"
      />
    </div>
  );
}
