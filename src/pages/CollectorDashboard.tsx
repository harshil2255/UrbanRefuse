import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Save, CheckCircle, Hand, MapPin, Camera, X, Clock, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500"><h1 className="font-bold text-xl">Crash!</h1><pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre><pre className="whitespace-pre-wrap text-xs">{this.state.error?.stack}</pre></div>;
    }
    return this.props.children;
  }
}

export default function CollectorDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'available'>('my_tasks');
  const [sortMyTasks, setSortMyTasks] = useState<'newest' | 'oldest' | 'upvotes'>('newest');
  const [sortAvailable, setSortAvailable] = useState<'upvotes' | 'newest' | 'oldest'>('upvotes');

  useEffect(() => {
    if (user) {
      fetchMyTasks();
      fetchAvailableTasks();
    }
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles!complaints_creator_id_fkey(full_name, phone), complaint_upvotes(user_id)')
        .eq('assigned_collector_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        upvotes_count: item.complaint_upvotes?.length || 0,
      }));
      setTasks(formattedData);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles!complaints_creator_id_fkey(full_name, phone), complaint_upvotes(user_id)')
        .is('assigned_collector_id', null)
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        upvotes_count: item.complaint_upvotes?.length || 0,
      }));

      setAvailableTasks(formattedData);
    } catch (error) {
      console.error('Error fetching available tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ assigned_collector_id: user?.id, status: 'In Progress' })
        .eq('id', taskId);
        
      if (error) throw error;
      fetchMyTasks();
      fetchAvailableTasks();
      setActiveTab('my_tasks');
    } catch (error) {
      console.error('Error claiming task:', error);
      alert('Failed to claim task.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const displayedMyTasks = [...tasks].sort((a, b) => {
    const timeA = new Date(a.created_at || Date.now()).getTime();
    const timeB = new Date(b.created_at || Date.now()).getTime();
    if (sortMyTasks === 'upvotes') {
      return (b.upvotes_count || 0) - (a.upvotes_count || 0) || timeB - timeA;
    } else if (sortMyTasks === 'newest') {
      return timeB - timeA;
    } else {
      return timeA - timeB;
    }
  });

  const displayedAvailableTasks = [...availableTasks].sort((a, b) => {
    const timeA = new Date(a.created_at || Date.now()).getTime();
    const timeB = new Date(b.created_at || Date.now()).getTime();
    if (sortAvailable === 'upvotes') {
      return (b.upvotes_count || 0) - (a.upvotes_count || 0) || timeB - timeA;
    } else if (sortAvailable === 'newest') {
      return timeB - timeA;
    } else {
      return timeA - timeB;
    }
  });

  return (
    <ErrorBoundary>
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in font-['Outfit']">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <ClipboardList size={32} className="text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collector Hub</h1>
        </div>
        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full font-semibold text-sm shadow-sm">
          {tasks.filter(t => t.status === 'Resolved').length} / {tasks.length} Resolved
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-slate-700 mb-6 gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('my_tasks')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'my_tasks' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            My Assigned Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'available' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Available Task Pool ({availableTasks.length})
          </button>
        </div>
        
        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-1.5 shadow-sm mb-2 sm:mb-0">
          <ArrowUpDown size={16} className="text-gray-400 mr-2" />
          <select
            value={activeTab === 'my_tasks' ? sortMyTasks : sortAvailable}
            onChange={(e) => activeTab === 'my_tasks' ? setSortMyTasks(e.target.value as any) : setSortAvailable(e.target.value as any)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="upvotes" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Most Rated</option>
            <option value="newest" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Newest First</option>
            <option value="oldest" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'my_tasks' && (
            <motion.div 
              key="my_tasks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div key={sortMyTasks}>
            {displayedMyTasks.map((task) => (
              <div key={task.id} className="mb-6">
                <TaskCard task={task} onUpdateComplete={fetchMyTasks} />
              </div>
            ))}
            {displayedMyTasks.length === 0 && (
              <EmptyState message="You have no assigned tasks. Check the Available Pool!" />
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'available' && (
          <motion.div 
            key="available"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-6"
          >
            {displayedAvailableTasks.map((task) => (
              <AvailableTaskCard key={task.id} task={task} onClaim={() => handleClaim(task.id)} />
            ))}
            {displayedAvailableTasks.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState message="No pending issues available to claim right now." />
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
    </ErrorBoundary>
  );
}

function AvailableTaskCard({ task, onClaim }: { task: any, onClaim: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex flex-col transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <Link to={`/complaint/${task.id}`} className="font-bold text-lg text-gray-900 dark:text-white hover:text-emerald-600 transition-colors">
          {task.category}
        </Link>
        <span className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-bold">
          ⭐ {task.upvotes_count} Upvotes
        </span>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-1.5">
        <div className="flex items-center">
          <strong className="text-gray-700 dark:text-gray-300 mr-1.5">Reported by:</strong> 
          {task.profiles?.full_name || 'Citizen'}
        </div>
        <div className="flex items-center">
          <Clock size={14} className="mr-1.5" />
          {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
        </div>
        <div className="flex items-center">
          <MapPin size={14} className="mr-1.5" />
          {task.location_lat?.toFixed(4) || 0}, {task.location_lng?.toFixed(4) || 0}
        </div>
        {task.profiles?.phone && (
          <div className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg mt-1">
            📞 {task.profiles.phone}
          </div>
        )}
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{task.description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {task.image_url ? (
          <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-100 dark:border-slate-700">
            <img src={task.image_url} alt="Issue" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-48 w-full rounded-lg border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-center text-gray-400 text-sm">
            No photo provided
          </div>
        )}

        <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 relative z-0">
          <MapContainer 
            center={[task.location_lat, task.location_lng]} 
            zoom={15} 
            className="h-full w-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[task.location_lat, task.location_lng]} />
          </MapContainer>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={onClaim}
          className="w-full flex items-center justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          <Hand size={18} className="mr-2" />
          Claim High Priority Task
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onUpdateComplete }: { task: any, onUpdateComplete: () => void }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(task.status);
  const [notes, setNotes] = useState(task.resolution_notes || '');
  const [loading, setLoading] = useState(false);
  
  // Resolution Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resImageFile, setResImageFile] = useState<File | null>(null);
  const [resImagePreview, setResImagePreview] = useState<string | null>(task.resolution_image_url);

  const hasChanged = status !== task.status || notes !== (task.resolution_notes || '') || resImageFile !== null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setResImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!resImageFile) return null;
    const fileExt = resImageFile.name.split('.').pop();
    const fileName = `res_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('complaint_images').upload(filePath, resImageFile);
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('complaint_images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let finalResUrl = task.resolution_image_url;
      if (resImageFile) {
        finalResUrl = await uploadImage();
      }

      const { error } = await supabase
        .from('complaints')
        .update({ status: status, resolution_notes: notes, resolution_image_url: finalResUrl })
        .eq('id', task.id);
        
      if (error) throw error;
      onUpdateComplete();
      setResImageFile(null); // Reset file state since it's now uploaded
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 transition-all ${task.status === 'Resolved' ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-slate-700'}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left Info & Image */}
        <div className="w-full md:w-1/3 shrink-0">
          <div className="mb-3">
            <Link to={`/complaint/${task.id}`} className="font-bold text-lg text-gray-900 dark:text-white hover:text-emerald-600 transition-colors">
              {task.category}
            </Link>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex flex-col space-y-1.5">
              <div className="flex items-center">
                <strong className="text-gray-700 dark:text-gray-300 mr-1.5">Reported by:</strong> 
                {task.profiles?.full_name || 'Citizen'}
              </div>
              <div className="flex items-center">
                <Clock size={14} className="mr-1.5" />
                {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
              </div>
              <div className="flex items-center">
                <MapPin size={14} className="mr-1" />
                {task.location_lat?.toFixed(4) || 0}, {task.location_lng?.toFixed(4) || 0}
              </div>
            </div>
            {task.profiles?.phone && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg inline-flex items-center">
                📞 {task.profiles.phone}
              </div>
            )}
          </div>
          {task.image_url ? (
             <div className="h-40 w-full rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm mb-4">
               <img src={task.image_url} alt="Issue" className="w-full h-full object-cover hover:scale-105 transition-transform" />
             </div>
          ) : (
            <div className="h-40 w-full rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-center text-gray-400 text-sm mb-4">
              No photo provided
            </div>
          )}

          {/* Small Interactive Map */}
          <div className="h-40 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 relative z-0 mb-4">
            <MapContainer 
              center={[task.location_lat, task.location_lng]} 
              zoom={15} 
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[task.location_lat, task.location_lng]} />
            </MapContainer>
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-1 flex flex-col h-full">
          <div className="mb-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-slate-700">
            <span className="font-semibold text-gray-900 dark:text-white block mb-1">Citizen Description:</span>
            {task.description}
          </div>
          
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Cleared the overflowing bin and sanitized the area..."
                className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 min-h-[80px] bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Resolution Photo Upload */}
            {status === 'Resolved' && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Proof of Resolution Photo</label>
                {resImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 h-32 w-48 inline-block">
                    <img src={resImagePreview} alt="Resolution" className="w-full h-full object-cover" />
                    {resImageFile && (
                      <button 
                        type="button"
                        onClick={() => { setResImageFile(null); setResImagePreview(task.resolution_image_url); }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg py-4 px-6 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-emerald-600 dark:text-emerald-400 text-sm font-medium w-max"
                  >
                    <Camera size={20} className="mr-2" /> Take / Upload Proof
                  </button>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-end">
            <button
              onClick={handleUpdate}
              disabled={!hasChanged || loading}
              className={`flex items-center px-6 py-2.5 rounded-xl font-medium transition-all ${
                hasChanged 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12 text-center transition-colors">
      <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2">{message}</p>
    </div>
  );
}
