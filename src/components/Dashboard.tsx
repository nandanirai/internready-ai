import { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, DollarSign, Briefcase, HelpCircle, AlertCircle, 
  ChevronRight, Plus, Check, Bookmark, BookmarkCheck, FileText, Sparkles, 
  Lightbulb, PenTool, X, ExternalLink, Loader2, Globe 
} from 'lucide-react';
import { Internship, TrackedInternship } from '../types';
import ActionPlanner from './ActionPlanner';
import { trackInternship, untrackInternship, updateTrackedDetails } from '../lib/firebaseService';

interface DashboardProps {
  userId: string;
  availableDocuments: { [key: string]: boolean };
  allInternships: Internship[];
  trackedList: TrackedInternship[];
  onRefreshTracked: () => void;
  onNavigateToDocs: () => void;
}

export default function Dashboard({ 
  userId, 
  availableDocuments, 
  allInternships, 
  trackedList, 
  onRefreshTracked,
  onNavigateToDocs 
}: DashboardProps) {
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');
  const [stipendFilter, setStipendFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [orgFilter, setOrgFilter] = useState('All');
  const [viewTab, setViewTab] = useState<'all' | 'tracked'>('all');
  
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [isNotesSaving, setIsNotesSaving] = useState(false);
  const [copilotTips, setCopilotTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  const renderVerifiedField = (val: string | undefined, isDeadline: boolean = false) => {
    if (!val || val.trim().toLowerCase() === "not currently verified") {
      return (
        <span className="inline-flex items-center text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded text-4xs font-bold border border-amber-200/50">
          Not Currently Verified
        </span>
      );
    }
    return <span className={isDeadline ? "text-indigo-600 font-extrabold" : "text-gray-800"}>{val}</span>;
  };

  // Load General Copilot Tips on mount or document change
  useEffect(() => {
    const fetchTips = async () => {
      if (trackedList.length === 0) {
        setCopilotTips([
          "Start by searching for target internships like 'SRIP' or 'Google' in the AI Scanner.",
          "Check off prepared academic credentials on the 'Document Readiness' tab to enable automatic gap analysis."
        ]);
        return;
      }
      setTipsLoading(true);
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            trackedInternships: trackedList.map(t => {
              const matched = allInternships.find(i => i.id === t.internshipId);
              return matched ? { name: matched.name, deadline: matched.deadline, isApplied: t.isApplied } : null;
            }).filter(Boolean), 
            availableDocuments 
          })
        });
        const resData = await response.json();
        if (resData.success) {
          setCopilotTips(resData.data.recommendations || []);
        }
      } catch (err) {
        console.error("Error loading copilot recommendations:", err);
      } finally {
        setTipsLoading(false);
      }
    };

    fetchTips();
  }, [trackedList, availableDocuments, allInternships]);

  // Sync Notes state when selected internship changes
  useEffect(() => {
    if (selectedInternship) {
      const match = trackedList.find(t => t.internshipId === selectedInternship.id);
      setCustomNotes(match?.notes || '');
    } else {
      setCustomNotes('');
    }
  }, [selectedInternship, trackedList]);

  // Filter logic
  const filteredInternships = allInternships.filter(intern => {
    // Search
    const matchesSearch = 
      intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.areaRequired.toLowerCase().includes(searchTerm.toLowerCase());

    // Mode
    const matchesMode = modeFilter === 'All' || intern.mode.toLowerCase() === modeFilter.toLowerCase();

    // Stipend (Paid / Unpaid)
    let matchesStipend = true;
    if (stipendFilter === 'Paid') {
      matchesStipend = !intern.stipend.toLowerCase().includes('unpaid');
    } else if (stipendFilter === 'Unpaid') {
      matchesStipend = intern.stipend.toLowerCase().includes('unpaid');
    }

    // Urgency priority calculation
    const deadlineStr = intern.deadline || "";
    const isRolling = deadlineStr.toLowerCase().includes("rolling") || deadlineStr.toLowerCase().includes("year-round");

    let urgencyGroup = 'Track for Later';
    if (isRolling) {
      urgencyGroup = 'Track for Later';
    } else {
      const today = new Date();
      const deadlineDate = new Date(deadlineStr);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (isNaN(diffDays) || diffDays < 0) {
        urgencyGroup = 'Closed';
      } else if (diffDays <= 3) {
        urgencyGroup = 'Apply Immediately';
      } else if (diffDays <= 7) {
        urgencyGroup = 'Prepare Documents';
      }
    }

    const matchesUrgency = urgencyFilter === 'All' || urgencyGroup === urgencyFilter;

    // Org type
    let matchesOrg = true;
    if (orgFilter === 'Research') {
      matchesOrg = intern.name.toLowerCase().includes('research') || intern.name.toLowerCase().includes('fellowship') || intern.organization.toLowerCase().includes('iit') || intern.organization.toLowerCase().includes('vsrp') || intern.organization.toLowerCase().includes('srip');
    } else if (orgFilter === 'Corporate') {
      matchesOrg = intern.organization.toLowerCase().includes('google') || intern.organization.toLowerCase().includes('microsoft') || intern.organization.toLowerCase().includes('corporate');
    } else if (orgFilter === 'Government') {
      matchesOrg = intern.name.toLowerCase().includes('digital india') || intern.organization.toLowerCase().includes('aicte') || intern.organization.toLowerCase().includes('drdo') || intern.name.toLowerCase().includes('pm');
    }

    // Tab View Filter
    const isTracked = trackedList.some(t => t.internshipId === intern.id);
    const matchesTab = viewTab === 'all' || isTracked;

    return matchesSearch && matchesMode && matchesStipend && matchesUrgency && matchesOrg && matchesTab;
  });

  // Track / Untrack actions
  const handleToggleTrack = async (internship: Internship) => {
    const isTracked = trackedList.some(t => t.internshipId === internship.id);
    if (isTracked) {
      await untrackInternship(userId, internship.id);
    } else {
      await trackInternship(userId, internship.id);
    }
    onRefreshTracked();
  };

  const handleToggleApplied = async (internshipId: string, currentApplied: boolean) => {
    await updateTrackedDetails(userId, internshipId, { isApplied: !currentApplied });
    onRefreshTracked();
  };

  const handleSaveNotes = async () => {
    if (!selectedInternship) return;
    setIsNotesSaving(true);
    await updateTrackedDetails(userId, selectedInternship.id, { notes: customNotes });
    onRefreshTracked();
    setIsNotesSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* AI Recommendations Alert Box */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 space-y-3">
        <div className="flex items-center gap-2 text-indigo-700">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-sans text-sm font-extrabold uppercase tracking-wider">Copilot Priority Recommendations</h3>
        </div>
        
        {tipsLoading ? (
          <div className="flex items-center gap-2 text-xs text-indigo-500 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Synthesizing latest application statistics...
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {copilotTips.map((tip, i) => (
              <div key={i} className="flex gap-2.5 rounded-xl bg-white p-3 border border-indigo-50 text-xs font-semibold text-gray-700">
                <Lightbulb className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Dashboard layout */}
      <div className="space-y-6">
        
        {/* Toggle view tabs & search filter block */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl bg-gray-100 p-1 self-start">
            <button
              onClick={() => setViewTab('all')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                viewTab === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Opportunities
            </button>
            <button
              onClick={() => setViewTab('tracked')}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                viewTab === 'tracked' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              My Tracked List
              <span className="rounded-full bg-indigo-50 px-1.5 py-0.2 text-3xs font-bold text-indigo-600">
                {trackedList.length}
              </span>
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name, agency, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-gray-800 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Filters Select boxes row */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
          {/* Mode */}
          <div className="space-y-1">
            <label className="block text-4xs font-extrabold uppercase tracking-wider text-gray-400">Mode</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="All">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Stipend */}
          <div className="space-y-1">
            <label className="block text-4xs font-extrabold uppercase tracking-wider text-gray-400">Stipend</label>
            <select
              value={stipendFilter}
              onChange={(e) => setStipendFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="All">All Stipends</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Urgency */}
          <div className="space-y-1">
            <label className="block text-4xs font-extrabold uppercase tracking-wider text-gray-400">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="All">All Urgency</option>
              <option value="Apply Immediately">Apply Immediately</option>
              <option value="Prepare Documents">Prepare Documents Now</option>
              <option value="Track for Later">Track for Later</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Organization Type */}
          <div className="space-y-1">
            <label className="block text-4xs font-extrabold uppercase tracking-wider text-gray-400">Agency Type</label>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="All">All Agencies</option>
              <option value="Research">Research Academics</option>
              <option value="Corporate">Top Tech Corporate</option>
              <option value="Government">Government / Public Scheme</option>
            </select>
          </div>
        </div>

        {/* Grid cards display list */}
        {filteredInternships.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredInternships.map((internship) => {
              const matchedTracked = trackedList.find(t => t.internshipId === internship.id);
              const isTracked = !!matchedTracked;
              const isApplied = matchedTracked?.isApplied || false;

              // Deadline calculations
              const today = new Date();
              const deadlineStr = internship.deadline || "";
              const isRolling = deadlineStr.toLowerCase().includes("rolling") || deadlineStr.toLowerCase().includes("year-round");

              let deadlineLabel = "Track for Later";
              let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";

              if (isRolling) {
                deadlineLabel = "Open / Rolling Admission";
                badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold";
              } else {
                const deadlineDate = new Date(deadlineStr);
                const diffTime = deadlineDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (isNaN(diffDays) || diffDays < 0 || deadlineStr === "Not Currently Verified") {
                  deadlineLabel = deadlineStr === "Not Currently Verified" ? "TBD / Unverified" : "Deadline Missed";
                  badgeColor = "bg-gray-100 text-gray-600 border-gray-200";
                } else if (diffDays <= 3) {
                  deadlineLabel = "Apply Immediately";
                  badgeColor = "bg-red-50 text-red-700 border-red-100 animate-pulse";
                } else if (diffDays <= 7) {
                  deadlineLabel = "Prepare Documents Now";
                  badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                }
              }

              return (
                <div 
                  key={internship.id} 
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-indigo-100 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    {/* Header badge markers */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-3xs font-bold uppercase tracking-wider ${badgeColor}`}>
                        {deadlineLabel}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-2xs font-extrabold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {internship.mode}
                        </span>
                        {isApplied && (
                          <span className="text-2xs font-extrabold bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-md">
                            Applied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 
                        onClick={() => setSelectedInternship(internship)}
                        className="font-sans text-sm font-extrabold text-gray-900 group-hover:text-indigo-600 transition cursor-pointer truncate"
                        title={internship.name}
                      >
                        {internship.name}
                      </h4>
                      <p className="text-xs font-semibold text-gray-500">{internship.organization}</p>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-y-2.5 border-t border-gray-50 pt-3 text-2xs font-bold text-gray-600">
                      <div>
                        <p className="text-gray-400 text-3xs uppercase tracking-wider">Stipend</p>
                        <p className="text-gray-800">{internship.stipend}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-3xs uppercase tracking-wider font-sans">Deadline</p>
                        <p className="text-gray-800">{internship.deadline}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-3xs uppercase tracking-wider">Duration</p>
                        <p className="text-gray-800">{internship.duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-3xs uppercase tracking-wider">Eligibility</p>
                        <p className="text-gray-800 truncate" title={internship.eligibility}>{internship.eligibility}</p>
                      </div>
                    </div>

                    {/* Required Documents checklist visual */}
                    <div className="border-t border-gray-50 pt-3">
                      <p className="text-gray-400 text-3xs uppercase tracking-wider mb-1.5">Required Credentials</p>
                      <div className="flex flex-wrap gap-1">
                        {internship.requiredDocuments.map((docName, i) => {
                          const hasDoc = !!availableDocuments[docName];
                          return (
                            <span 
                              key={i} 
                              className={`rounded px-1.5 py-0.5 text-3xs font-semibold border transition ${
                                hasDoc 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}
                            >
                              {docName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 border-t border-gray-50 pt-3.5 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedInternship(internship)}
                      className="inline-flex items-center gap-1 text-2xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Analyze Copilot
                      <ChevronRight className="h-3 w-3" />
                    </button>

                    <div className="flex items-center gap-2">
                      {isTracked && (
                        <button
                          onClick={() => handleToggleApplied(internship.id, isApplied)}
                          className={`rounded-lg border px-2.5 py-1.5 text-3xs font-bold transition ${
                            isApplied 
                              ? 'bg-green-50 text-green-700 border-green-100' 
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {isApplied ? "Applied!" : "Mark Applied"}
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleTrack(internship)}
                        className={`rounded-lg p-1.5 transition ${
                          isTracked 
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                            : 'bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-100'
                        }`}
                        title={isTracked ? "Untrack this internship" : "Track this internship"}
                      >
                        {isTracked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-4">
            <HelpCircle className="h-10 w-10 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-gray-700">No Internships Found</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                We couldn't locate internships matching those parameters. Visit the **AI Scanner** tab to crawl additional opportunities.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Slide-over / Modal popup overlay */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Modal header details */}
            <div className="sticky top-0 z-10 flex items-start justify-between bg-white px-6 py-5 border-b border-gray-50">
              <div className="space-y-1 max-w-[85%]">
                <p className="text-3xs font-extrabold uppercase tracking-wider text-indigo-500">
                  {selectedInternship.organization}
                </p>
                <h3 className="font-sans text-base font-extrabold text-gray-900 leading-tight">
                  {selectedInternship.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInternship(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body tabs layout */}
            <div className="p-6 grid gap-6 md:grid-cols-5 overflow-y-auto">
              {/* Left Column stats details & personal notes */}
              <div className="md:col-span-2 space-y-5">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-3.5 text-xs font-semibold">
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-400">Specifications</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 text-3xs uppercase tracking-wider">Stipend</p>
                      <p className="text-gray-800">{renderVerifiedField(selectedInternship.stipend)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-3xs uppercase tracking-wider">Deadline</p>
                      <p className="text-gray-800">{renderVerifiedField(selectedInternship.deadline, true)}</p>
                      {selectedInternship.deadlineSource && selectedInternship.deadlineSource !== "Not Currently Verified" && (
                        <p className="text-4xs font-semibold text-gray-400 mt-0.5 leading-snug">
                          via: <span className="text-gray-500 font-bold">{selectedInternship.deadlineSource}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-400 text-3xs uppercase tracking-wider">Mode</p>
                      <p className="text-gray-800">{renderVerifiedField(selectedInternship.mode)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-3xs uppercase tracking-wider">Duration</p>
                      <p className="text-gray-800">{renderVerifiedField(selectedInternship.duration)}</p>
                    </div>
                    <div className="col-span-2 border-t border-gray-200/50 pt-2">
                      <p className="text-gray-400 text-3xs uppercase tracking-wider">Required Areas</p>
                      <p className="text-gray-800">{renderVerifiedField(selectedInternship.areaRequired)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400 text-3xs uppercase tracking-wider">Eligibility</p>
                      <p className="text-gray-800 leading-relaxed text-2xs">{renderVerifiedField(selectedInternship.eligibility)}</p>
                    </div>
                  </div>
                </div>

                {/* Data Verification & Trust Panel */}
                <div className="rounded-xl border border-gray-100 p-4 space-y-3 bg-gray-50/25">
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                    <span>Data Verification & Trust</span>
                    {selectedInternship.isVerified ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-sans uppercase border border-emerald-100">Verified</span>
                    ) : (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-sans uppercase border border-amber-100">Unverified</span>
                    )}
                  </p>

                  <div className="space-y-2 text-3xs">
                    <div className="flex justify-between items-center py-1 border-b border-gray-100/50">
                      <span className="text-gray-400 font-semibold">Confidence Score</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (selectedInternship.confidenceScore ?? 0) >= 90 ? 'bg-emerald-500' :
                              (selectedInternship.confidenceScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${selectedInternship.confidenceScore ?? 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-700">{selectedInternship.confidenceScore ?? 0}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start py-1 border-b border-gray-100/50">
                      <span className="text-gray-400 font-semibold">Source URL</span>
                      <a 
                        href={selectedInternship.officialAdvertisementUrl || selectedInternship.sourceUrl || selectedInternship.applyLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-600 hover:underline font-bold truncate max-w-[150px] text-right"
                      >
                        {selectedInternship.officialAdvertisementUrl || selectedInternship.sourceUrl || "Not Currently Verified"}
                      </a>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 font-semibold">Last Verified</span>
                      <span className="text-gray-600 font-bold">{selectedInternship.lastVerified || "Not Currently Verified"}</span>
                    </div>
                  </div>
                </div>

                {selectedInternship.navigationGuideline && (
                  <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-100/40 text-2xs text-amber-900 leading-normal space-y-1">
                    <div className="flex gap-2 items-start">
                      <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-950 block">Official Site Navigation Guide</strong>
                        <p className="mt-0.5 text-amber-800 text-3xs font-semibold leading-relaxed">{selectedInternship.navigationGuideline}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gaps checklist for this internship */}
                <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                  <p className="text-2xs font-bold uppercase tracking-wider text-gray-400">Application Credential Gaps</p>
                  <div className="space-y-1.5">
                    {selectedInternship.requiredDocuments.map((docName, idx) => {
                      const present = !!availableDocuments[docName];
                      return (
                        <div key={idx} className="flex items-center justify-between text-2xs font-bold">
                          <span className="text-gray-600">{docName}</span>
                          {present ? (
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-sans uppercase text-3xs">Ready</span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-sans uppercase text-3xs">Missing</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInternship(null);
                      onNavigateToDocs();
                    }}
                    className="w-full text-center text-3xs font-bold text-indigo-600 hover:underline pt-2"
                  >
                    Manage Credentials Checklist →
                  </button>
                </div>

                {/* Editable Personal Notes */}
                {trackedList.some(t => t.internshipId === selectedInternship.id) ? (
                  <div className="space-y-2">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-gray-400">Personal Notes & Checklist</label>
                    <textarea
                      placeholder="Add draft checklists, professors to ping, key portal deadlines..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/20 p-3 text-xs font-semibold text-gray-800 min-h-[100px] outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isNotesSaving}
                        className="rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 text-2xs font-bold hover:bg-indigo-100 transition flex items-center gap-1"
                      >
                        {isNotesSaving ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <PenTool className="h-3 w-3" />
                            Save Notes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                    <p className="text-2xs text-gray-400">Track this internship to enable custom research notes and draft portals.</p>
                    <button
                      onClick={() => handleToggleTrack(selectedInternship)}
                      className="mt-2 text-2xs font-extrabold text-indigo-600 hover:underline"
                    >
                      + Track Application Now
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column Action Plan */}
              <div className="md:col-span-3 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                  <h4 className="font-sans text-sm font-bold text-indigo-900">AI Application Copilot Action Plan</h4>
                </div>
                
                <ActionPlanner 
                  userId={userId} 
                  internship={selectedInternship} 
                  availableDocuments={availableDocuments} 
                />
              </div>
            </div>

            {/* Modal footer apply controls */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => handleToggleTrack(selectedInternship)}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  trackedList.some(t => t.internshipId === selectedInternship.id)
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {trackedList.some(t => t.internshipId === selectedInternship.id) ? "✓ Tracking This" : "+ Add to Tracking"}
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={selectedInternship.officialAdvertisementUrl || selectedInternship.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  View Official Advertisement
                </a>

                <a
                  href={selectedInternship.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
                >
                  Launch Official Apply Portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
