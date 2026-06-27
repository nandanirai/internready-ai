import { CheckSquare, Square, FileText, Sparkles, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Internship } from '../types';

interface DocumentTrackerProps {
  availableDocuments: { [key: string]: boolean };
  onDocChange: (docName: string, value: boolean) => void;
  selectedInternship?: Internship;
}

const DOCUMENT_DEFINITIONS: { [key: string]: { description: string, tips: string } } = {
  "Resume/CV": {
    description: "Your academic and professional record.",
    tips: "Keep it under 1 page, highlight relevant coursework, GPA, and projects. Use Action Verbs."
  },
  "SOP": {
    description: "Statement of Purpose detailing your motivation.",
    tips: "Customize for the organization's research domains. Show why your skills perfectly align."
  },
  "Transcript": {
    description: "Official/Unofficial academic gradesheet.",
    tips: "Combine all previous semesters into a single clean PDF. Highlight relevant high scores."
  },
  "ID proof": {
    description: "Passport, National ID, or Student Identity Card.",
    tips: "Ensure scan is colored, legible, and uncropped. Check validity dates."
  },
  "Certificates": {
    description: "Diplomas, tech certifications, or previous internships.",
    tips: "Provide direct verify links or high-quality PDF scans of formal credentials."
  },
  "Letter of recommendation": {
    description: "Academic or professional endorsement letters.",
    tips: "Request early! Offer to provide a summary of your achievements to make writing easier."
  },
  "Portfolio/GitHub/LinkedIn": {
    description: "Proof-of-work repositories and professional profiles.",
    tips: "Pin your 3 best projects on GitHub. Add detailed READMEs with build instructions."
  }
};

const ALL_DOCUMENTS = Object.keys(DOCUMENT_DEFINITIONS);

export default function DocumentTracker({ availableDocuments, onDocChange, selectedInternship }: DocumentTrackerProps) {
  // Calculate general document readiness stats
  const totalDocs = ALL_DOCUMENTS.length;
  const readyDocs = ALL_DOCUMENTS.filter(doc => availableDocuments[doc]).length;
  const percentReady = Math.round((readyDocs / totalDocs) * 100);

  // Calculate specific gap analysis if internship is selected
  const requiredGaps = selectedInternship ? selectedInternship.requiredDocuments.map(docName => ({
    name: docName,
    available: !!availableDocuments[docName]
  })) : [];

  const missingCount = requiredGaps.filter(g => !g.available).length;

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
      
      {/* Primary Checklist and Gauge */}
      <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600">
            <FileText className="h-5 w-5" />
            <h3 className="font-sans text-base font-bold uppercase tracking-wider text-indigo-600">Credential Locker & Tracker</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Update your current credentials status. This status feeds into our AI Gap Analyzer for all target applications.
          </p>
        </div>

        {/* Readiness Meter */}
        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 flex flex-col sm:flex-row items-center gap-5 justify-between">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-gray-800">Overall Credentials Readiness</h4>
            <p className="text-xs text-gray-500">
              You have prepared <span className="font-bold text-indigo-600">{readyDocs}</span> of <span className="font-bold">{totalDocs}</span> standard academic documents.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Progress Circle Visual */}
            <div className="relative flex items-center justify-center h-16 w-16">
              <svg className="absolute transform -rotate-90 w-full h-full">
                <circle cx="32" cy="32" r="28" strokeWidth="4" stroke="#e5e7eb" fill="transparent" />
                <circle cx="32" cy="32" r="28" strokeWidth="4" stroke="#4f46e5" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentReady / 100)}`}
                />
              </svg>
              <span className="font-mono text-sm font-extrabold text-gray-800">{percentReady}%</span>
            </div>
          </div>
        </div>

        {/* Interactive Checklist list */}
        <div className="divide-y divide-gray-50">
          {ALL_DOCUMENTS.map((docName) => {
            const hasDoc = !!availableDocuments[docName];
            const info = DOCUMENT_DEFINITIONS[docName];

            return (
              <div key={docName} className="py-4 flex items-start gap-4 hover:bg-gray-50/30 px-2 rounded-xl transition">
                <button
                  type="button"
                  onClick={() => onDocChange(docName, !hasDoc)}
                  className="mt-1 flex items-center justify-center text-indigo-600 hover:text-indigo-700 shrink-0"
                >
                  {hasDoc ? (
                    <CheckSquare className="h-5.5 w-5.5" />
                  ) : (
                    <Square className="h-5.5 w-5.5 text-gray-300" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${hasDoc ? 'text-gray-800' : 'text-gray-500'}`}>
                      {docName}
                    </span>
                    {hasDoc ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 text-3xs font-semibold text-emerald-700 uppercase tracking-wider">
                        Ready
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 border border-amber-100 px-1.5 py-0.2 text-3xs font-semibold text-amber-700 uppercase tracking-wider">
                        Missing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{info.description}</p>
                  <p className="text-2xs font-semibold text-indigo-500 font-sans italic">💡 {info.tips}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Gap Analysis Sidebar */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-sans text-base font-bold uppercase tracking-wider text-indigo-600">AI Gap Analyzer</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Select any internship on your dashboard to run real-time document compatibility analysis.
          </p>
        </div>

        {selectedInternship ? (
          <div className="space-y-5">
            {/* Internship minicard */}
            <div className="rounded-xl border border-indigo-50 bg-indigo-50/10 p-4 space-y-1">
              <p className="text-3xs font-bold uppercase tracking-wider text-indigo-500">Analyzing Gaps For</p>
              <h4 className="text-sm font-bold text-gray-900 truncate">{selectedInternship.name}</h4>
              <p className="text-xs text-gray-500">{selectedInternship.organization}</p>
            </div>

            {/* Gap Indicators list */}
            <div className="space-y-3.5">
              <p className="text-2xs font-bold uppercase tracking-wider text-gray-400">Prerequisites Check</p>
              
              <div className="space-y-2.5">
                {requiredGaps.map((gap, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/20 p-3 text-xs font-semibold">
                    <span className="text-gray-700">{gap.name}</span>
                    {gap.available ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckSquare className="h-4 w-4" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Verdict */}
            <div className="rounded-xl border border-dashed border-gray-100 p-4 space-y-2 text-center">
              {missingCount === 0 ? (
                <>
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 inline-block">
                    ✓ 100% Ready to Apply
                  </p>
                  <p className="text-2xs text-gray-500">
                    You meet all credential requirements for this application. Initiate submit workflow now!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-100 inline-block">
                    ⚠ {missingCount} Missing Items
                  </p>
                  <p className="text-2xs text-gray-500">
                    Please prepare the marked missing credentials to prevent application rejection. Refer to AI Action Planner for daily milestones.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center space-y-3">
            <HelpCircle className="h-8 w-8 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-600">No Target App Selected</p>
              <p className="text-2xs text-gray-400">
                Go to the Dashboard, click any internship card, and click "Analyze Gaps" to review specific missing credentials.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
