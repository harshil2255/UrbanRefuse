import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, Loader2 } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Profile creation is now automatically handled by the Supabase SQL trigger!
        
        navigate('/');
      }
    } catch (err: any) {
      // Improve error message readability
      if (err.message.includes("Failed to fetch")) {
        setError("Network error: Could not connect to the database. Please ensure your Supabase URL and Anon Key in the .env file are correct.");
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-['Outfit']">
      {/* Left Side - Visual Showcase */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-300 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Leaf size={32} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CivicSense</span>
        </div>
        
        <div className="relative z-10 max-w-lg animate-fade-in">
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Keep your city clean & vibrant.
          </h1>
          <p className="text-lg text-emerald-50 leading-relaxed opacity-90">
            Join thousands of active citizens tracking urban refuse, reporting issues, and working together for a more sustainable future.
          </p>
        </div>
        
        <div className="relative z-10 text-sm opacity-75">
          &copy; {new Date().getFullYear()} CivicSense Platform. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        
        <div className="w-full max-w-md px-8 py-10 relative z-10 animate-fade-in">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center space-x-3 mb-10 justify-center">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-600/30">
              <Leaf size={28} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-800 tracking-tight">CivicSense</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Sign up to start reporting issues in your area.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="group">
                <label className="block text-sm font-medium text-slate-700 mb-1.5 transition-colors group-focus-within:text-emerald-600">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
            )}
            
            <div className="group">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 transition-colors group-focus-within:text-emerald-600">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 transition-colors group-focus-within:text-emerald-600">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start animate-fade-in">
                <div className="shrink-0 mr-3">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
