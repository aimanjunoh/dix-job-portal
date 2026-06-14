import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, ExternalLink, Loader } from 'lucide-react';

type ActionStatus = 'loading' | 'success' | 'error' | 'login_required';

export default function QuickAction() {
  useEffect(() => { document.title = 'Quick Action — DIX Portal'; }, []);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const [status, setStatus] = useState<ActionStatus>('loading');
  const [message, setMessage] = useState('');
  const [requestInfo, setRequestInfo] = useState<any>(null);

  useEffect(() => {
    processAction();
  }, []);

  const processAction = async () => {
    if (!token || !action) {
      setStatus('error');
      setMessage('Invalid link — missing token or action.');
      return;
    }

    try {
      // Find request by action_token
      const { data: request, error } = await supabase
        .from('requests')
        .select('*')
        .eq('action_token', token)
        .single();

      if (error || !request) {
        setStatus('error');
        setMessage('Invalid or expired link. This request may no longer exist.');
        return;
      }

      setRequestInfo(request);

      if (action === 'view') {
        // Just redirect to login/request detail
        setStatus('login_required');
        setMessage('Please sign in to view this request.');
        return;
      }

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('login_required');
        setMessage('Please sign in to approve or reject this request.');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setStatus('error');
        setMessage('Only admins can approve or reject requests.');
        return;
      }

      // Perform the action
      if (action === 'approve') {
        await supabase
          .from('requests')
          .update({ status: 'In Progress' })
          .eq('id', request.id);

        await supabase.from('activity_logs').insert({
          request_id: request.id,
          action: 'Request Approved',
          performed_by: user.email || 'Admin',
          details: `Approved via email link`,
        });

        setStatus('success');
        setMessage(`Request ${request.request_id} has been approved and set to "In Progress".`);
      } else if (action === 'reject') {
        await supabase
          .from('requests')
          .update({ status: 'Completed', remarks: 'Rejected via email' })
          .eq('id', request.id);

        await supabase.from('activity_logs').insert({
          request_id: request.id,
          action: 'Request Rejected',
          performed_by: user.email || 'Admin',
          details: `Rejected via email link`,
        });

        setStatus('success');
        setMessage(`Request ${request.request_id} has been rejected.`);
      }

      // Invalidate the token after use
      await supabase
        .from('requests')
        .update({ action_token: null })
        .eq('id', request.id);

    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/dix-logo.png" alt="DIX" className="h-20 mx-auto mb-4 drop-shadow-lg" />
          <p className="text-white/50 text-xs tracking-widest uppercase">Quick Action</p>
        </div>

        <div className="glass-dark p-8">
          {status === 'loading' && (
            <div className="text-center py-6">
              <Loader className="animate-spin w-10 h-10 text-primary-500 mx-auto mb-4" />
              <p className="text-gray-600">Processing your request...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Action Completed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              {requestInfo && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-bold text-gray-800">{requestInfo.request_id}</p>
                  <p className="text-sm text-gray-500 mt-2">Title</p>
                  <p className="font-medium text-gray-800">{requestInfo.title}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => navigate('/requests')} className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <ExternalLink size={16} /> View All Requests
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Action Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button onClick={() => navigate('/')} className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                Go to Dashboard
              </button>
            </div>
          )}

          {status === 'login_required' && (
            <div className="text-center py-4">
              <img src="/dix-logo.png" alt="DIX" className="w-16 h-16 object-contain mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              {requestInfo && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-gray-500">Request</p>
                  <p className="font-bold text-gray-800">{requestInfo.request_id} — {requestInfo.title}</p>
                </div>
              )}
              <button onClick={() => navigate(`/login?redirect=/action?token=${token}&action=${action}`)} className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                Sign In to Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
