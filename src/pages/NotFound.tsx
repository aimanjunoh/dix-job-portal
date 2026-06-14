import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  useEffect(() => { document.title = '404 — DIX Portal'; }, []);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-10 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center">
          <AlertTriangle size={36} className="text-primary-500" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
          <p className="text-gray-500 text-lg">Page not found</p>
        </div>
        <p className="text-sm text-gray-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
        >
          <Home size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
