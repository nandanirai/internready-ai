import { useState, FormEvent } from 'react';
import { Search, Globe, Sparkles, Loader2, Plus, Check, ChevronRight, HelpCircle, AlertCircle } from 'lucide-react';
import { Internship } from '../types';

interface ScannerProps {
  onTrack: (internship: Internship) => void;
  trackedIds: string[];
  onScanResults: (internships: Internship[]) => void;
}

const PRESETS = [
  { label: "KAUST Foundation Models VSRP", keyword: "Fine-Tuning of Foundation Models via Low-Rank Adaptation and Beyond", url: "https://admissions.kaust.edu.sa/internship/search/project/fine-tuning-of-foundation-models-via-low-rank-adaptation-and-beyond" }
];

const AGENT_LOGS_PRESET = [
  "Initializing deep URL layout analyzer...",
  "Executing DOM schema structure mapping...",
  "Extracting candidate eligibility constraints...",
  "Extracting required credentials and proof-of-work checklist...",
  "Formatting structured internship JSON array...",
  "Finalizing response curation..."
];

export default function Scanner({ onTrack, trackedIds, onScanResults }: ScannerProps) {
  const [keyword, setKeyword] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<Internship[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);

  const renderVerifiedField = (val: string | undefined) => {
    if (!val || val.trim().toLowerCase() === "not currently verified") {
      return (
        <span className="inline-flex items-center text-amber-600 bg-amber-50/50 px-1.5 py-0.2 rounded text-[10px] font-extrabold border border-amber-200/50">
          Not Currently Verified
        </span>
      );
    }
    return val;
  };

  const runScanningSimulator = async (searchKeyword: string, url: string) => {
    setLoading(true);
    setResults([]);
    setError(null);
    setLogs([]);
    setPresetMessage(null);

    // Staggered logs simulator for agentic feel
    const addLogWithDelay = (index: number) => {
      if (index >= AGENT_LOGS_PRESET.length) return;
      setLogs((prev) => [...prev, AGENT_LOGS_PRESET[index]]);
      setTimeout(() => addLogWithDelay(index + 1), 600);
    };
    addLogWithDelay(0);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: searchKeyword, url }),
      });

      const resData = await response.json();
      if (resData.success) {
        const scannedData = Array.isArray(resData.data) ? resData.data : [];

        setResults(scannedData);
        onScanResults(scannedData);

        if (scannedData.length === 0) {
          setError("No verified internship results were returned by the scanner.");
        }
      } else {
        setError(resData.error || "Failed to scan. Check your Gemini API Key configuration.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to communicate with full-stack backend service.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: { label: string; keyword: string; url?: string }) => {
    setKeyword(preset.keyword);
    setSourceUrl(preset.url || '');
    setPresetMessage(null);
    setResults([]);
    setError(null);
    runScanningSimulator(preset.keyword, preset.url || '');
  };

  const handleSearchSubmit = (e: FormEvent) => {
  e.preventDefault();

  alert("Scanner button clicked!");
  console.log("Scanner button clicked!");

  setPresetMessage(null);

  if (!keyword.trim() && !sourceUrl.trim()) {
    alert("No keyword or URL entered.");
    return;
  }

  runScanningSimulator(keyword, sourceUrl);
};

  const handleStartScanClick = () => {
    alert("Scan button clicked");
    console.log("Scan button clicked", { keyword, sourceUrl });

    if (!keyword.trim() && !sourceUrl.trim()) {
      setError("Please enter a keyword or source URL before scanning.");
      return;
    }

    runScanningSimulator(keyword, sourceUrl);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Scanner Control Panel Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-sans text-base font-bold uppercase tracking-wider text-indigo-600">AI Deep Opportunity Scanner</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Search keywords or input any official portal URL. The copilot crawls, extracts, schedules, and delivers structured checklist parameters.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Keyword Field */}
            <div className="relative">
              <label className="block text-2xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Keyword Search</label>
              <div className="relative">
                <Search className="absolute top-3.5 left-3.5 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. SRIP, SURGE, Google Internship..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/30 py-3 pl-11 pr-4 text-sm font-medium text-gray-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* URL Field */}
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Source Web Portal (Optional)</label>
              <div className="relative">
                <Globe className="absolute top-3.5 left-3.5 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="url"
                  placeholder="e.g. https://srip.iitgn.ac.in/portal"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/30 py-3 pl-11 pr-4 text-sm font-medium text-gray-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {presetMessage && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-2xs text-blue-800 font-bold flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span>{presetMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleStartScanClick}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition disabled:bg-indigo-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running AI Scanner...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Start Agentic Scan
                </>
              )}
            </button>
          </div>
        </form>

         {/* Clickable Preset Terms */}
         <div className="mt-6 border-t border-gray-50 pt-4">
           <p className="text-2xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Quick-Scan Official Templates</p>
           <div className="flex flex-wrap gap-2">
             {PRESETS.map((preset) => (
               <button
                 key={preset.label}
                 onClick={() => handlePresetClick(preset)}
                 disabled={loading}
                 className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 transition disabled:opacity-50"
               >
                 {preset.label}
               </button>
             ))}
           </div>
         </div>
      </div>

      {/* Loading Logs & Progress Screen */}
      {loading && (
        <div className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-6 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <h3 className="font-sans text-sm font-bold text-indigo-900">AI agent compiling digital assets...</h3>
          </div>
          <div className="mt-4 space-y-2 rounded-xl bg-gray-950 p-4 font-mono text-xs text-green-400">
            <div className="flex justify-between text-gray-500 border-b border-gray-800 pb-1.5 mb-2">
              <span>COPILOT CRAWLER v2.5</span>
              <span>LIVE FEED</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold mt-2">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              Parsing Gemini AI response vectors...
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Scan Execution Failed</p>
              <p className="mt-1 text-xs text-red-700">{error}</p>
              <p className="mt-2 text-2xs text-gray-500">
                Please enter a keyword such as KAUST, foundation models, or machine learning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (() => {
        const hasAnyVerified = results.some(item => item.isVerified && item.name !== "No active opportunity found.");
        return (
          <div className="space-y-4">
            <h3 className="font-sans text-base font-bold text-gray-900">
              Scanner Outputs ({results.filter(item => item.isVerified).length} verified listings)
            </h3>

            {!hasAnyVerified && results[0].name !== "No active opportunity found." && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-600 mx-auto animate-bounce" />
                <h4 className="text-sm font-extrabold text-amber-950">No verified active opportunity found.</h4>
                <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                  We scanned the webpage but could not extract an active, officially verified opportunity with high confidence. Below are the unverified details for your reference. Unverified listings cannot be tracked.
                </p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((internship) => {
                const isTracked = trackedIds.includes(internship.id);
                const isVerifiedOpportunity = internship.isVerified === true;

                // 1. Handle "No active opportunity found." state
                if (internship.name === "No active opportunity found." || internship.organization === "Not Currently Verified" && internship.eligibility === "No active opportunity found.") {
                  return (
                    <div key={internship.id} className="col-span-full rounded-2xl border border-dashed border-amber-200 bg-amber-50/20 p-8 text-center space-y-3.5">
                      <HelpCircle className="h-10 w-10 text-amber-500 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-amber-950">No Active Opportunity Found</h4>
                        <p className="text-xs text-amber-800/80 max-w-md mx-auto leading-relaxed">
                          The AI scanner analyzed the webpage but could not locate any verified, active opportunities on official sources matching this criteria.
                          Please try a different webpage URL with active announcement listings.
                        </p>
                      </div>
                      <div className="text-3xs font-mono text-gray-400">
                        Last Checked: {internship.lastVerified || new Date().toISOString().split('T')[0]}
                      </div>
                    </div>
                  );
                }
                
                // Deadline categorization color badges
                const today = new Date();
                const deadlineValue = internship.deadline || "";
                const isRolling =
                  deadlineValue.toLowerCase().includes("rolling") ||
                  deadlineValue.toLowerCase().includes("year-round");
                
                let deadlineText = "Track for Later";
                let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";

                if (isRolling) {
                  deadlineText = "Open / Rolling Admission";
                  badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold";
                } else {
                  const deadlineDate = new Date(deadlineValue);
                  const diffTime = deadlineDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (isNaN(diffDays) || diffDays < 0 || deadlineValue === "Not Currently Verified" || !deadlineValue) {
                    deadlineText = deadlineValue === "Not Currently Verified" ? "TBD / Unverified" : "Deadline Missed";
                    badgeColor = "bg-gray-100 text-gray-600 border-gray-200";
                  } else if (diffDays <= 3) {
                    deadlineText = "Apply Immediately";
                    badgeColor = "bg-red-50 text-red-700 border-red-100 animate-pulse";
                  } else if (diffDays <= 7) {
                    deadlineText = "Prepare Documents Now";
                    badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                  }
                }

                const cardBg = isVerifiedOpportunity 
                  ? "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md" 
                  : "bg-amber-50/10 border-amber-150 shadow-none hover:border-amber-200";

                return (
                  <div key={internship.id} className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition ${cardBg}`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider ${badgeColor}`}>
                          {deadlineText}
                        </span>
                        <span className="text-2xs font-bold font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                          {internship.mode}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-sans text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition truncate" title={internship.name}>
                          {internship.name}
                        </h4>
                        <p className="text-xs font-medium text-gray-500">{internship.organization}</p>
                      </div>

                      {/* Trust and verification indicator bar inside card */}
                      <div className="flex items-center justify-between text-[10px] font-bold py-1 px-1.5 rounded bg-gray-50 border border-gray-100/60">
                        <div className="flex items-center gap-1">
                          {isVerifiedOpportunity ? (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-amber-600 font-extrabold flex items-center gap-0.5">
                              Unverified
                            </span>
                          )}
                          <span className="text-gray-300 font-normal">|</span>
                          <span className="text-gray-500 text-[9px]">{internship.lastVerified || "Not Checked"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <span className="text-gray-400 font-semibold text-[9px]">Trust:</span>
                          <span className={`font-black ${
                            (internship.confidenceScore ?? 0) >= 90 ? 'text-emerald-600' :
                            (internship.confidenceScore ?? 0) >= 50 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {internship.confidenceScore ?? 0}%
                          </span>
                        </div>
                      </div>

                      {!isVerifiedOpportunity && (
                        <div className="rounded-xl bg-amber-50 border border-amber-250 p-2.5 text-[10px] text-amber-900 font-semibold leading-relaxed flex items-start gap-1.5">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>UNVERIFIED OR CLOSED: This opportunity has not been verified as active from an official source.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-y-2 border-t border-gray-50 pt-2.5 text-2xs font-semibold text-gray-600">
                        <div>
                          <p className="text-gray-400 text-3xs uppercase tracking-wider">Stipend</p>
                          <p className="text-gray-800">{renderVerifiedField(internship.stipend)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-3xs uppercase tracking-wider">Deadline</p>
                          <p className="text-gray-800">{renderVerifiedField(internship.deadline)}</p>
                          {internship.deadlineSource && internship.deadlineSource !== "Not Currently Verified" && (
                            <span className="text-[9px] text-gray-400 font-medium block leading-tight mt-0.5 truncate" title={internship.deadlineSource}>
                              via: <span className="text-gray-500 font-semibold">{internship.deadlineSource}</span>
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-400 text-3xs uppercase tracking-wider">Duration</p>
                          <p className="text-gray-800">{renderVerifiedField(internship.duration)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-3xs uppercase tracking-wider">Eligibility</p>
                          <p className="text-gray-800 truncate" title={internship.eligibility}>{renderVerifiedField(internship.eligibility)}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-50 pt-2.5">
                        <p className="text-gray-400 text-3xs uppercase tracking-wider mb-1">Required Credentials</p>
                        <div className="flex flex-wrap gap-1">
                          {internship.requiredDocuments.map((docName, i) => (
                            <span key={i} className="rounded bg-gray-50 px-1.5 py-0.5 text-3xs text-gray-500 font-medium border border-gray-100">
                              {docName}
                            </span>
                          ))}
                        </div>
                      </div>

                      {internship.navigationGuideline && (
                        <div className="rounded-xl bg-amber-50/50 p-3 border border-amber-100/40 text-3xs text-amber-900 leading-normal">
                          <div className="flex gap-1.5 items-start">
                            <HelpCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-bold text-amber-950">Official Site Navigation:</strong> {internship.navigationGuideline}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-gray-50 pt-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-1 text-3xs font-bold text-gray-500">
                        <a
                          href={internship.officialAdvertisementUrl || internship.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-indigo-600 transition"
                        >
                          <Globe className="h-3 w-3 text-gray-400" />
                          View Official Advertisement Notice
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 border-t border-gray-50/50 pt-2">
                        <a
                          href={internship.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-3xs font-bold text-indigo-600 hover:text-indigo-800 underline uppercase tracking-wider"
                        >
                          Direct Portal Link
                        </a>

                        {isVerifiedOpportunity ? (
                          <button
                            onClick={() => onTrack(internship)}
                            disabled={isTracked}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                              isTracked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                          >
                            {isTracked ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Tracked
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Track Application
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded">
                            Tracking Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
