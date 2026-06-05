import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Clock, MessageSquare, ThumbsUp } from 'lucide-react';
import ReportIssueModal from '../components/ReportIssueModal';
import { Link } from 'react-router-dom';

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  image_url: string | null;
  profiles: { full_name: string };
  upvotes_count: number;
  comments_count: number;
}

export default function CivicFeed() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
          profiles!complaints_creator_id_fkey (full_name),
          complaint_upvotes(user_id),
          comments(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate counts and sort by upvotes
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        upvotes_count: item.complaint_upvotes?.length || 0,
        comments_count: item.comments?.length || 0,
      })).sort((a, b) => b.upvotes_count - a.upvotes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Feed</h1>
        <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-full px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Top Priorities First
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-800 h-32 rounded-2xl border border-gray-100 dark:border-slate-700"></div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All clear!</h3>
          <p className="text-gray-500 dark:text-gray-400">No issues have been reported in your area yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map((complaint) => (
            <Link 
              key={complaint.id} 
              to={`/complaint/${complaint.id}`}
              className="block bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow group"
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                    complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {complaint.status}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm leading-relaxed line-clamp-2">
                {complaint.description}
              </p>

              {complaint.image_url && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 h-48 bg-gray-50 dark:bg-slate-900 relative">
                  <img src={complaint.image_url} alt="Issue evidence" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center space-x-6 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <div className="flex items-center text-emerald-600 dark:text-emerald-500">
                  <ThumbsUp size={16} className="mr-1.5" /> {complaint.upvotes_count} Upvotes
                </div>
                <div className="flex items-center hover:text-emerald-600 transition-colors">
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
        className="fixed bottom-8 right-8 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-1 transition-all z-40 group"
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
