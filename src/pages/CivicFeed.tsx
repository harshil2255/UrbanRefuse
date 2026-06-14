import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Clock, MessageSquare, ThumbsUp, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReportIssueModal from '../components/ReportIssueModal';
import { Link } from 'react-router-dom';

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  image_url: string | null;
  creator_id: string;
  profiles: { full_name: string };
  upvotes_count: number;
  comments_count: number;
}

export default function CivicFeed() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine' | 'unresolved'>('all');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest' | 'oldest'>('upvotes');
  const { user } = useAuth();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          id,
          category,
          description,
          status,
          created_at,
          image_url,
          creator_id,
          profiles!complaints_creator_id_fkey (full_name),
          complaint_upvotes(user_id),
          comments(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate counts, but don't sort here, we'll sort dynamically
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        upvotes_count: item.complaint_upvotes?.length || 0,
        comments_count: item.comments?.length || 0,
      }));

      setComplaints(formattedData);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Apply filters and sorting dynamically
  const displayedComplaints = complaints
    .filter(c => {
      if (filter === 'mine') return c.creator_id === user?.id;
      if (filter === 'unresolved') return c.status !== 'Resolved';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'upvotes') {
        return b.upvotes_count - a.upvotes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else { // oldest
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Feed</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* View Filter */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-1 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === 'mine' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              My Reports
            </button>
            <button
              onClick={() => setFilter('unresolved')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === 'unresolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Unresolved
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-1.5 shadow-sm">
            <ArrowUpDown size={16} className="text-gray-400 mr-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="upvotes" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Most Liked</option>
              <option value="newest" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Newest First</option>
              <option value="oldest" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-800 h-32 rounded-2xl border border-gray-100 dark:border-slate-700"></div>
          ))}
        </div>
      ) : displayedComplaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All clear!</h3>
          <p className="text-gray-500 dark:text-gray-400">No issues have been reported in your area yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedComplaints.map((complaint) => (
            <Link 
              key={complaint.id} 
              to={`/complaint/${complaint.id}`}
              className="block bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {complaint.profiles?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{complaint.category}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {formatDate(complaint.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold mb-2 flex items-center border ${
                    complaint.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                    complaint.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      complaint.status === 'Resolved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                      complaint.status === 'In Progress' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' :
                      'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    }`}></span>
                    {complaint.status}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm leading-relaxed line-clamp-2">
                {complaint.description}
              </p>

              {complaint.image_url && (
                <div className="mt-4 rounded-[12px] overflow-hidden border border-gray-200/50 dark:border-white/10 aspect-video bg-gray-50 dark:bg-slate-900 relative">
                  <img src={complaint.image_url} alt="Issue evidence" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center space-x-3 text-sm font-medium">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                  <ThumbsUp size={16} className="mr-1.5" /> {complaint.upvotes_count} Upvotes
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors">
                  <MessageSquare size={16} className="mr-1.5" /> {complaint.comments_count} Comments
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-emerald-500 text-white p-4 rounded-full shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all z-40 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <ReportIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchComplaints}
      />
    </div>
  );
}
