import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center gap-3 m-2 mb-0 bg-white dark:bg-[#13131f] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            {sidebarOpen ? <X size={20} className="text-gray-600 dark:text-gray-400" /> : <Menu size={20} className="text-gray-600 dark:text-gray-400" />}
          </button>
          <img src="/dix-logo.svg" alt="DIX" className="h-7 object-contain" />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-4 lg:px-6 py-3 text-center border-t border-gray-100 dark:border-gray-800/40">
          <p className="text-[11px] text-gray-400 dark:text-gray-600">
            &copy; {new Date().getFullYear()} Digital Innovation &amp; Experience Unit. Developed by Group Digital Services. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
