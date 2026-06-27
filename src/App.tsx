import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import DocumentTracker from './components/DocumentTracker';
import { SAMPLE_INTERNSHIPS } from './lib/sampleData';
import { Internship, TrackedInternship } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  getUserProfile, 
  saveUserProfile, 
  getTrackedInternships, 
  trackInternship
} from './lib/firebaseService';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'documents'>('dashboard');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // User credentials checklist
  const [availableDocuments, setAvailableDocuments] = useState<{ [key: string]: boolean }>({
    "Resume/CV": false,
    "SOP": false,
    "Transcript": false,
    "ID proof": false,
    "Certificates": false,
    "Letter of recommendation": false,
    "Portfolio/GitHub/LinkedIn": false
  });

  // Internship pools
  const [allInternships, setAllInternships] = useState<Internship[]>(SAMPLE_INTERNSHIPS);
  const [trackedList, setTrackedList] = useState<TrackedInternship[]>([]);

  // 1. Auth Change Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Authenticated: Load Firestore profile & tracked items
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          if (profile.availableDocuments) {
            setAvailableDocuments(profile.availableDocuments);
          }
        } else {
          // Setup initial empty profile in Firestore
          await saveUserProfile(currentUser.uid, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            availableDocuments: availableDocuments
          });
        }
        
        // Load tracked internships
        const tracked = await getTrackedInternships(currentUser.uid);
        setTrackedList(tracked);
      } else {
        // Guest mode: Load from local storage
        const localDocs = localStorage.getItem("internready_docs");
        if (localDocs) {
          setAvailableDocuments(JSON.parse(localDocs));
        } else {
          setAvailableDocuments({
            "Resume/CV": false,
            "SOP": false,
            "Transcript": false,
            "ID proof": false,
            "Certificates": false,
            "Letter of recommendation": false,
            "Portfolio/GitHub/LinkedIn": false
          });
        }

        const localTracked = localStorage.getItem("internready_tracked");
        if (localTracked) {
          setTrackedList(JSON.parse(localTracked));
        } else {
          setTrackedList([]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);



  // Handler: Update document prepared status
  const handleDocChange = async (docName: string, value: boolean) => {
    const updated = { ...availableDocuments, [docName]: value };
    setAvailableDocuments(updated);

    if (user) {
      await saveUserProfile(user.uid, {
        uid: user.uid,
        availableDocuments: updated
      });
    } else {
      localStorage.setItem("internready_docs", JSON.stringify(updated));
    }
  };

  // Handler: Track internship from scanner
  const handleTrackFromScanner = async (internship: Internship) => {
    const uid = user ? user.uid : "guest";

    setAllInternships(prev => {
      const map = new Map(prev.map(i => [i.id, i]));
      map.set(internship.id, internship);
      return Array.from(map.values());
    });

    await trackInternship(uid, internship.id);
    
    // Refresh tracked lists
    await handleRefreshTracked();
    setActiveTab('dashboard');
  };

  const handleScanResults = (internships: Internship[]) => {
    if (!internships || internships.length === 0) return;

    setAllInternships(prev => {
      const map = new Map(prev.map(i => [i.id, i]));
      internships.forEach(i => {
        if (i && i.id) map.set(i.id, i);
      });
      return Array.from(map.values());
    });
  };

  // Handler: Refresh tracked list manually or post-operation
  const handleRefreshTracked = async () => {
    const uid = user ? user.uid : "guest";
    if (user) {
      const tracked = await getTrackedInternships(uid);
      setTrackedList(tracked);
    } else {
      const localTracked = localStorage.getItem("internready_tracked");
      setTrackedList(localTracked ? JSON.parse(localTracked) : []);
    }
  };

  // Statistics summaries
  const trackedCount = trackedList.length;
  const appliedCount = trackedList.filter(t => t.isApplied).length;

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 animate-bounce">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="font-sans text-base font-extrabold text-gray-900">Booting InternReady AI...</h2>
          <p className="text-xs text-gray-400 font-medium">Connecting credentials lockers and loading dynamic schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between">
      
      {/* Top sticky navbar navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        trackedCount={trackedCount} 
        appliedCount={appliedCount} 
      />

      {/* Main Container Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Welcome greeting info card */}
        {activeTab === 'dashboard' && trackedCount === 0 && (
          <div className="mb-8 rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-lg shadow-indigo-100">
            <div className="max-w-2xl space-y-3">
              <span className="rounded-full bg-indigo-500/50 border border-indigo-400 px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider">
                Copilot Setup Complete
              </span>
              <h2 className="font-sans text-xl font-extrabold tracking-tight sm:text-2xl leading-tight">
                Unlock your next research fellowship or top tech opportunity.
              </h2>
              <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                Welcome to InternReady AI! We help you scan internships, perform smart credential gap analysis, map out custom schedules with Gemini, and log applications in real time.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="rounded-xl bg-white px-4.5 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-gray-50 transition"
                >
                  Scan Internships
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="rounded-xl bg-indigo-500/30 border border-indigo-400/50 px-4.5 py-2 text-xs font-bold text-white hover:bg-indigo-500/40 transition"
                >
                  Configure My Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab content routing */}
        <div className="min-h-[60vh]">
          {activeTab === 'dashboard' && (
            <Dashboard 
              userId={user ? user.uid : "guest"} 
              availableDocuments={availableDocuments} 
              allInternships={allInternships} 
              trackedList={trackedList} 
              onRefreshTracked={handleRefreshTracked}
              onNavigateToDocs={() => setActiveTab('documents')}
            />
          )}

          {activeTab === 'scanner' && (
            <Scanner 
              onTrack={handleTrackFromScanner} 
              trackedIds={trackedList.map(t => t.internshipId)} 
              onScanResults={handleScanResults}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentTracker 
              availableDocuments={availableDocuments} 
              onDocChange={handleDocChange} 
              selectedInternship={
                trackedList.length > 0 
                  ? allInternships.find(i => i.id === trackedList[0].internshipId) 
                  : undefined
              }
            />
          )}
        </div>

      </main>

      {/* Humble structured page footer */}
      <footer className="border-t border-gray-100 bg-white py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-2xs font-semibold text-gray-400">
            © 2026 InternReady AI. Developed with Google Cloud Run & Firebase Firestore.
          </p>
          <div className="flex gap-4 text-2xs font-bold text-gray-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition">GitHub</a>
            <span>•</span>
            <a href="https://ai.studio" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition">Google AI Studio</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
