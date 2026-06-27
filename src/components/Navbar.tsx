import { useState, useEffect } from 'react';
import { User, LogOut, Compass, FileCheck, Sparkles, LogIn } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'dashboard' | 'scanner' | 'documents';
  setActiveTab: (tab: 'dashboard' | 'scanner' | 'documents') => void;
  trackedCount: number;
  appliedCount: number;
}

export default function Navbar({ activeTab, setActiveTab, trackedCount, appliedCount }: NavbarProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Authentication Error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Sign Out Error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-sans text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              InternReady <span className="text-indigo-600">AI</span>
            </h1>
            <p className="hidden text-2xs font-medium text-gray-400 sm:block">Agentic Internship Copilot</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Compass className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'scanner'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Scanner
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            Document Readiness
          </button>
        </nav>

        {/* User Auth & Stats Section */}
        <div className="flex items-center gap-4">
          {/* Quick Statistics Stats */}
          <div className="hidden items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-1 px-3 sm:flex">
            <div className="text-center">
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Tracking</p>
              <p className="font-mono text-sm font-bold text-gray-800">{trackedCount}</p>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Applied</p>
              <p className="font-mono text-sm font-bold text-green-600">{appliedCount}</p>
            </div>
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-100 p-1 pr-3 hover:bg-gray-50 transition"
              >
                {user.photoURL ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={user.photoURL}
                    alt={user.displayName || "User Profile"}
                    className="h-8 w-8 rounded-full border border-indigo-100 shadow-sm"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <span className="hidden max-w-[100px] truncate text-xs font-semibold text-gray-700 md:block">
                  {user.displayName?.split(' ')[0] || "Student"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-gray-50">
                    <p className="text-2xs font-bold uppercase tracking-wider text-gray-400">Signed In As</p>
                    <p className="truncate text-xs font-medium text-gray-800">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <LogIn className="h-4 w-4" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex border-t border-gray-50 bg-white px-2 py-1.5 md:hidden justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-2xs font-medium ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <Compass className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-2xs font-medium ${
            activeTab === 'scanner' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Scanner
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-2xs font-medium ${
            activeTab === 'documents' ? 'text-indigo-600' : 'text-gray-500'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Documents
        </button>
      </div>
    </header>
  );
}
