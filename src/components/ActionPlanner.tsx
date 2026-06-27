import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Calendar, CheckCircle2, Circle, AlertCircle, Download, Check } from 'lucide-react';
import { Internship, ActionPlan, ActionPlanStep } from '../types';
import { getActionPlan, saveActionPlan } from '../lib/firebaseService';

interface ActionPlannerProps {
  userId: string;
  internship: Internship;
  availableDocuments: { [key: string]: boolean };
}

export default function ActionPlanner({ userId, internship, availableDocuments }: ActionPlannerProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing action plan on load or select
  useEffect(() => {
    if (!internship.isVerified || (internship.confidenceScore ?? 0) < 70) {
      return;
    }
    let active = true;
    const fetchPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await getActionPlan(userId, internship.id);
        if (existing && active) {
          setPlan(existing);
          setLoading(false);
        } else {
          // Generate new plan via backend REST API
          const response = await fetch('/api/action-planner', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ internship, availableDocuments })
          });
          const resData = await response.json();
          if (resData.success && active) {
            const newPlan: ActionPlan = {
              internshipId: internship.id,
              userId,
              steps: resData.data.steps.map((s: any) => ({ ...s, status: 'pending' })),
              recommendation: resData.data.recommendation,
              createdAt: new Date().toISOString()
            };
            await saveActionPlan(newPlan);
            setPlan(newPlan);
          } else if (active) {
            setError(resData.error || "Failed to generate AI action plan. Check Gemini credentials.");
          }
        }
      } catch (err: any) {
        console.error(err);
        if (active) setError("Could not establish connection to plan generator.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPlan();

    return () => {
      active = false;
    };
  }, [userId, internship.id]);

  const toggleStep = async (stepIndex: number) => {
    if (!plan) return;
    const updatedSteps = [...plan.steps];
    updatedSteps[stepIndex].status = updatedSteps[stepIndex].status === 'completed' ? 'pending' : 'completed';
    const updatedPlan = { ...plan, steps: updatedSteps };
    setPlan(updatedPlan);
    await saveActionPlan(updatedPlan);
  };

  const handleDownloadICS = () => {
    if (!plan) return;
    try {
      // Create ics parameters
      const title = `Submit Application - ${internship.name}`;
      const description = `AI Recommended Prep Timeline:\\n` + plan.steps.map(s => `- ${s.day}: ${s.title}`).join('\\n') + `\\n\\nApply link: ${internship.applyLink}`;
      
      // Target deadline date formatting for ICS format (YYYYMMDD)
      let dateStr = "";
      if (internship.deadline.toLowerCase().includes("rolling") || internship.deadline.toLowerCase().includes("year-round")) {
        const placeholderDate = new Date();
        placeholderDate.setDate(placeholderDate.getDate() + 14);
        const y = placeholderDate.getFullYear();
        const m = String(placeholderDate.getMonth() + 1).padStart(2, '0');
        const d = String(placeholderDate.getDate()).padStart(2, '0');
        dateStr = `${y}${m}${d}`;
      } else {
        const dateParts = internship.deadline.split('-');
        if (dateParts.length !== 3) return;
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        dateStr = `${year}${month}${day}`;
      }

      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//InternReady AI//Agentic Copilot//EN",
        "BEGIN:VEVENT",
        `UID:internready-${internship.id}-${Date.now()}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", `InternReady_${internship.organization.replace(/\s+/g, '_')}_Deadline.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error creating Calendar reminder ICS", e);
    }
  };

  if (!internship.isVerified || (internship.confidenceScore ?? 0) < 70) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 text-center space-y-2">
        <AlertCircle className="h-7 w-7 text-amber-600 mx-auto" />
        <h4 className="text-xs font-bold text-amber-950">Action Plan Unavailable</h4>
        <p className="text-2xs text-amber-800 leading-relaxed max-w-sm mx-auto">
          Personalized daily preparation roadmaps and checklists can only be compiled for officially verified, active internship opportunities.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 min-h-[250px]">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-700">Synthesizing personalized timeline...</p>
          <p className="text-2xs text-gray-400">Gemini is parsing missing documents and target deadline milestones.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-50 bg-red-50/50 p-4 text-xs text-red-800 space-y-2">
        <div className="flex gap-2 items-center">
          <AlertCircle className="h-4.5 w-4.5 text-red-600" />
          <span className="font-bold">Plan Synthesis Halted</span>
        </div>
        <p className="text-red-700 font-medium">{error}</p>
        <p className="text-2xs text-gray-400">Please verify your GEMINI_API_KEY environment variable.</p>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Copilot Recommendation Statement */}
      <div className="rounded-xl border border-indigo-50 bg-indigo-50/10 p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-indigo-600">
          <Sparkles className="h-4 w-4" />
          <h4 className="text-2xs font-extrabold uppercase tracking-wider">Copilot Strategy Verdict</h4>
        </div>
        <p className="text-xs text-indigo-950 font-medium leading-relaxed font-sans">
          "{plan.recommendation}"
        </p>
      </div>

      {/* Stepper Steps List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-2xs font-bold uppercase tracking-wider text-gray-400">Daily Milestone Planner</p>
          <button
            onClick={handleDownloadICS}
            className="inline-flex items-center gap-1 text-2xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition"
          >
            <Download className="h-3 w-3" />
            Add to Calendar (.ics)
          </button>
        </div>

        <div className="relative border-l border-gray-100 pl-4 ml-2.5 space-y-5">
          {plan.steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            return (
              <div key={idx} className="relative">
                {/* Visual node bullet */}
                <button
                  onClick={() => toggleStep(idx)}
                  className="absolute -left-7.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white transition outline-none"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5.5 w-5.5 text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle className="h-5.5 w-5.5 text-gray-300 hover:text-indigo-500 bg-white" />
                  )}
                </button>

                <div className="space-y-1 group">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {step.day}
                    </span>
                    <button
                      onClick={() => toggleStep(idx)}
                      className="text-3xs font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition hover:text-indigo-600"
                    >
                      {isCompleted ? "Mark Uncomplete" : "Mark Complete"}
                    </button>
                  </div>
                  
                  <h5 className={`text-xs font-bold transition ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {step.title}
                  </h5>
                  <p className={`text-2xs font-medium leading-relaxed transition ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
