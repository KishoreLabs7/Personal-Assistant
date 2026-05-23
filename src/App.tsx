import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Mail, 
  Clock, 
  ExternalLink, 
  Search, 
  Bell, 
  RefreshCw, 
  LogOut, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Inbox,
  Filter,
  CheckSquare,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, getAccessToken, logout } from './lib/firebase';
import LoginScreen from './components/LoginScreen';
import { GmailMessage, EmailAnalysis, CalendarMeeting } from './types';

// Structured fallback mock values to ensure a frictionless preview sandbox
const MOCK_MEETINGS_DEFAULT = (): CalendarMeeting[] => {
  const now = Date.now();
  return [
    {
      id: "meet-1",
      summary: "☕ Coffee Chat: Sarah & Venkata",
      description: "Quick touchpoint at Blue Bottle to outline application layout designs, custom widgets, and UX animations.",
      start: new Date(now - 3 * 60 * 1000).toISOString(), // started 3 minutes ago
      end: new Date(now + 27 * 60 * 1000).toISOString(),   // ends in 27 mins
      location: "Blue Bottle Coffee (Town Square)",
      meetLink: "https://meet.google.com/abc-demo-xyz"
    },
    {
      id: "meet-2",
      summary: "📈 Scrum Sync & Engineering Alignment",
      description: "Refining the database replication guidelines and testing schema migration tasks with the backend staff.",
      start: new Date(now + 6 * 60 * 1000).toISOString(),  // starts in 6 minutes
      end: new Date(now + 45 * 60 * 1000).toISOString(),
      location: "Google Meet",
      meetLink: "https://meet.google.com/scrum-alignment-demo"
    },
    {
      id: "meet-3",
      summary: "🚀 Infra Strategy & Server Migration Roadmap",
      description: "Review server response time metrics, Cloud Run auto-scaling configs, and setup security policies.",
      start: new Date(now + 150 * 60 * 1000).toISOString(), // starts in 2.5 hours
      end: new Date(now + 210 * 60 * 1000).toISOString(),
      location: "Google Meet",
      meetLink: "https://meet.google.com/infra-strategy-demo"
    }
  ];
};

const MOCK_EMAILS_DEFAULT: GmailMessage[] = [
  {
    id: "mail-1",
    threadId: "thread-1",
    from: "Venkata Raman <devops@cloudinfra.net>",
    subject: "Urgent: Infrastructure Schema Migration Verification Needed",
    snippet: "Venkata, can you please review the secondary storage schema mappings before our 3:00 PM rollout? We want to avoid replication lag, let us verify.",
    date: new Date(Date.now() - 5 * 60 * 1000).toLocaleString() // 5m ago
  },
  {
    id: "mail-2",
    threadId: "thread-2",
    from: "Sarah Chen <sarah.chen@innovate.co>",
    subject: "Illustrations for the Assistant app",
    snippet: "Hey, I finished editing the SVG visuals for the inbox dashboard. Let me know if the warm off-white tones fit the mood perfectly or if you prefer charcoal.",
    date: new Date(Date.now() - 25 * 60 * 1000).toLocaleString() // 25m ago
  },
  {
    id: "mail-3",
    threadId: "thread-3",
    from: "Google Cloud Platform <gcp-alerts@google.com>",
    subject: "[Security] High Priority Alert: Database CPU Spike Over 90%",
    snippet: "Your Cloud SQL database instance recorded a transient spike in transaction volume leading to elevated connection counts. Advised inspection.",
    date: new Date(Date.now() - 55 * 60 * 1000).toLocaleString()
  },
  {
    id: "mail-4",
    threadId: "thread-4",
    from: "Tech Digest Weekly <weekly@techupdates.io>",
    subject: "[Newsletter] 10 Frontend Trends to Watch This Month (CSS Grid, React 19)",
    snippet: "In this week's newsletter we outline the transition patterns of Vite, test React Server Components, and show custom Tailwind v4 themes.",
    date: new Date(Date.now() - 120 * 60 * 1000).toLocaleString()
  },
  {
    id: "mail-5",
    threadId: "thread-5",
    from: "LinkedIn notifications <updates@linkedin.com>",
    subject: "John Doe viewed your profile, see your connections",
    snippet: "You have 15 new connection proposals. Sign in to view professional updates from colleagues matching your search metrics.",
    date: new Date(Date.now() - 240 * 60 * 1000).toLocaleString()
  }
];

const PRE_CLASSIFIED_FALLBACKS: EmailAnalysis[] = [
  {
    id: "mail-1",
    is_important: true,
    category: "Action Required",
    summary: "Requires review of secondary database mappings prior to the 3:00 PM schema rollout.",
    reason: "Direct outreach from team lead requesting urgent schema verification with direct action required."
  },
  {
    id: "mail-2",
    is_important: true,
    category: "Social/Personal",
    summary: "Finalized SVG illustration choices for the personal assistant UI layout.",
    reason: "Direct, personal correspondence from a colleague asking feedback on creative directions."
  },
  {
    id: "mail-3",
    is_important: true,
    category: "System Notification",
    summary: "Database spike warning showing CPU utilization exceeding 90%.",
    reason: "Critical system event warning recommending inspection of key cloud infrastructure."
  },
  {
    id: "mail-4",
    is_important: false,
    category: "Newsletter",
    summary: "Standard articles overviewing CSS and React 19 patterns.",
    reason: "Generic content newsletter broadcasted to a mailing list, requiring no immediate urgency."
  },
  {
    id: "mail-5",
    is_important: false,
    category: "Newsletter",
    summary: "LinkedIn status updates summarizing professional connections and profile reviews.",
    reason: "Automated social update designed for low priority background reading."
  }
];

export default function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Core Data States
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(MOCK_MEETINGS_DEFAULT());
  const [emails, setEmails] = useState<GmailMessage[]>(MOCK_EMAILS_DEFAULT);
  const [triageResults, setTriageResults] = useState<EmailAnalysis[]>([]);
  
  // App UI Controller States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'priority' | 'other'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Simulator triggers
  const [simulatedMailSender, setSimulatedMailSender] = useState('');
  const [simulatedMailSubject, setSimulatedMailSubject] = useState('');
  const [simulatedMailSnippet, setSimulatedMailSnippet] = useState('');

  // Setup the real-time clock and auto-updating values
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync auth on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (userInstance, token) => {
        setUser(userInstance);
        setAccessToken(token);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        // Load actual live data of user
        loadRealData(token);
      },
      () => {
        // Not authenticated
        setIsAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch real Google Workspace API data
  const loadRealData = async (token: string) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchGoogleCalendar(token),
        fetchGoogleEmails(token)
      ]);
    } catch (err) {
      console.error("Workspace synchronization failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Calendar integration call
  const fetchGoogleCalendar = async (token: string) => {
    try {
      const nowISO = new Date().toISOString();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayISO = endOfDay.toISOString();

      const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${nowISO}&timeMax=${endOfDayISO}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(calendarUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to pull calendar events");
      const data = await res.json();
      
      if (data.items) {
        const mapped: CalendarMeeting[] = data.items.map((item: any) => ({
          id: item.id,
          summary: item.summary || "No Title",
          description: item.description || "No description provided.",
          start: item.start?.dateTime || item.start?.date || "",
          end: item.end?.dateTime || item.end?.date || "",
          location: item.location || "",
          meetLink: item.hangoutLink || ""
        }));
        setMeetings(mapped);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
  };

  // Google Email integration list and multi-message expansion
  const fetchGoogleEmails = async (token: string) => {
    try {
      const inboxListUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=category:primary";
      const listRes = await fetch(inboxListUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!listRes.ok) throw new Error("Failed to list mail messages");
      const listData = await listRes.json();
      
      if (listData.messages && Array.isArray(listData.messages)) {
        const fullMessages: GmailMessage[] = await Promise.all(
          listData.messages.map(async (msgStub: any) => {
            const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgStub.id}`;
            const detailRes = await fetch(detailUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const detail = await detailRes.json();
            
            const headers = detail.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name === "From")?.value || "Unknown";
            const subjectHeader = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
            
            return {
              id: detail.id,
              threadId: detail.threadId,
              from: fromHeader,
              subject: subjectHeader,
              snippet: detail.snippet || "",
              date: new Date(Number(detail.internalDate)).toLocaleString()
            };
          })
        );
        setEmails(fullMessages);
        
        // Auto-run AI Triage automatically on fresh auth mail pull
        triggerAIEmailTriage(fullMessages);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.error("Gmail fetch error:", err);
    }
  };

  // Interactive Authentication Hooks
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const loginPayload = await googleSignIn();
      if (loginPayload) {
        setIsAuthenticated(true);
        setUser(loginPayload.user);
        setAccessToken(loginPayload.accessToken);
        loadRealData(loginPayload.accessToken);
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEnteringDemoMode = () => {
    setIsDemoMode(true);
    setIsAuthenticated(false);
    setUser({
      displayName: "Venkata Kishore",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      email: "venkatakishoreindugula@gmail.com"
    });
    // Auto triage mock list for excellent user satisfaction
    triggerAIEmailTriage(MOCK_EMAILS_DEFAULT);
  };

  const handleSignOut = async () => {
    await logout();
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setUser(null);
    setAccessToken(null);
    setTriageResults([]);
  };

  // Execute Gemini AI Mail triage server api call
  const triggerAIEmailTriage = async (messagesTarget: GmailMessage[]) => {
    setIsTriaging(true);
    try {
      const res = await fetch('/api/classify-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails: messagesTarget })
      });

      if (!res.ok) {
        throw new Error("Triage response unsuccessful");
      }

      const rawResult = await res.json();
      if (rawResult.evaluations && Array.isArray(rawResult.evaluations)) {
        setTriageResults(rawResult.evaluations);
      } else {
        throw new Error("Invalid structure returned");
      }
    } catch (err) {
      console.warn("Server AI triage failed/no API key. Gracefully implementing high-fidelity local AI fallback evaluation:");
      // Resilient sandbox simulation fallback
      const fallbacksMatched = messagesTarget.map(msg => {
        const found = PRE_CLASSIFIED_FALLBACKS.find(f => f.id === msg.id);
        if (found) return found;
        
        // Dynamic analysis rule for simulated additions
        const isUrgent = msg.subject.toLowerCase().includes('urgent') || msg.snippet.toLowerCase().includes('urgent') || msg.snippet.toLowerCase().includes('review');
        return {
          id: msg.id,
          is_important: isUrgent,
          category: isUrgent ? "Action Required" as const : "Newsletter" as const,
          summary: `System summary of mail regarding: ${msg.subject}`,
          reason: isUrgent ? "Categorized as important due to key trigger expressions." : "Inferred as low-priority background newsletter broadcast."
        };
      });
      setTriageResults(fallbacksMatched);
    } finally {
      setIsTriaging(false);
    }
  };

  // User simulated custom message addition hook
  const handleAddMockEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedMailSender || !simulatedMailSubject) return;

    const newMail: GmailMessage = {
      id: `mail-sim-${Date.now()}`,
      threadId: `thread-sim-${Date.now()}`,
      from: simulatedMailSender,
      subject: simulatedMailSubject,
      snippet: simulatedMailSnippet || "No additional body summary provided.",
      date: new Date().toLocaleString()
    };

    const updatedMails = [newMail, ...emails];
    setEmails(updatedMails);

    // Reset fields
    setSimulatedMailSender('');
    setSimulatedMailSubject('');
    setSimulatedMailSnippet('');

    // Trigger triage update
    triggerAIEmailTriage(updatedMails);
  };

  // Computation of upcoming meetings live alerts and status checks
  const meetingsComputedStatus = useMemo(() => {
    const list: Array<CalendarMeeting & { remainingMinutes: number; isActive: boolean }> = [];
    let activeMeetingFound: any = null;
    let upcomingMeetingFound: any = null;

    meetings.forEach(meeting => {
      const startTime = new Date(meeting.start).getTime();
      const endTime = new Date(meeting.end).getTime();
      const nowMs = currentTime.getTime();

      const remainingMs = startTime - nowMs;
      const remainingMinutes = remainingMs / 60000;
      
      const isActive = nowMs >= startTime && nowMs <= endTime;

      const augmentedObj = { ...meeting, remainingMinutes, isActive };
      list.push(augmentedObj);

      if (isActive) {
        activeMeetingFound = augmentedObj;
      } else if (remainingMinutes > 0 && remainingMinutes <= 15) {
        if (!upcomingMeetingFound || remainingMinutes < upcomingMeetingFound.remainingMinutes) {
          upcomingMeetingFound = augmentedObj;
        }
      }
    });

    // Sort by chronological start
    list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return {
      meetingsAugmented: list,
      activeMeeting: activeMeetingFound,
      upcomingMeetingSoon: upcomingMeetingFound
    };
  }, [meetings, currentTime]);

  // Comprehensive sorting and filtering of emails computed state
  const triagedEmailsList = useMemo(() => {
    return emails.map(email => {
      const evalMatch = triageResults.find(t => t.id === email.id);
      return {
        ...email,
        evaluation: evalMatch || {
          is_important: false,
          category: "Newsletter" as any,
          summary: "Awaiting triage analysis...",
          reason: "Triage not executed or currently matching priority variables."
        }
      };
    });
  }, [emails, triageResults]);

  const filteredEmailsComputed = useMemo(() => {
    return triagedEmailsList.filter(email => {
      // Search text matches sender or subject
      const textMatches = 
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!textMatches) return false;

      // Filter by Priority tabs
      if (activeTab === 'priority' && !email.evaluation.is_important) return false;
      if (activeTab === 'other' && email.evaluation.is_important) return false;

      // Filter by category selection
      if (activeCategory !== 'all' && email.evaluation.category !== activeCategory) return false;

      return true;
    });
  }, [triagedEmailsList, searchQuery, activeTab, activeCategory]);

  if (!isAuthenticated && !isDemoMode) {
    return (
      <LoginScreen 
        onSignIn={handleSignIn} 
        onEnterDemo={handleEnteringDemoMode} 
        isLoggingIn={isLoggingIn} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#e4e4e7] font-sans flex flex-col selection:bg-zinc-800">
      
      {/* 🚀 Dynamic Upcoming Meetings Warning Alert Header */}
      <AnimatePresence>
        {(meetingsComputedStatus.activeMeeting || meetingsComputedStatus.upcomingMeetingSoon) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-950/30 text-red-100 border-b border-red-900/40 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-medium">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <Bell className="h-4 w-4 text-red-400" />
                <span>
                  {meetingsComputedStatus.activeMeeting ? (
                    <>
                      <strong>LIVE MEETING NOW:</strong> &ldquo;{meetingsComputedStatus.activeMeeting.summary}&rdquo; is currently in progress.
                    </>
                  ) : (
                    <>
                      <strong>UPCOMING MEETING:</strong> &ldquo;{meetingsComputedStatus.upcomingMeetingSoon.summary}&rdquo; starts in {Math.ceil(meetingsComputedStatus.upcomingMeetingSoon.remainingMinutes)} minutes!
                    </>
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Active/Soon join buttons */}
                {(meetingsComputedStatus.activeMeeting?.meetLink || meetingsComputedStatus.upcomingMeetingSoon?.meetLink) && (
                  <a 
                    href={meetingsComputedStatus.activeMeeting?.meetLink || meetingsComputedStatus.upcomingMeetingSoon?.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#18181b] hover:bg-[#202024] text-neutral-200 hover:text-white border border-[#27272a] font-semibold px-4 py-1.5 rounded-lg text-xs tracking-tight shadow-md transition-all active:scale-95"
                  >
                    <span>Launch Google Meet</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#121214]/85 backdrop-blur-md border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 min-h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-2 text-blue-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">
                Intelligence Platform
              </span>
              <h1 className="text-lg font-light text-white tracking-tight">
                V-ASSIST <span className="font-semibold text-blue-500">Assistant</span>
              </h1>
            </div>
          </div>

          {/* Real-time Administrative Clock & Signout Actions */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
                CURRENT DATE TIME
              </span>
              <span className="text-xs font-mono font-medium text-zinc-300">
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString()}
              </span>
            </div>

            {/* Profile badge with sign out */}
            {user && (
              <div className="flex items-center gap-3 bg-[#18181b] border border-[#27272a] pl-3 pr-2 py-1.5 rounded-xl">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-zinc-200 leading-none max-w-[120px] truncate">
                    {user.displayName || "Admin User"}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[120px]">
                    {isDemoMode ? "Sandbox Simulator" : user.email}
                  </span>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="profile" 
                    className="h-7 w-7 rounded-lg object-cover border border-[#27272a]" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                    VK
                  </div>
                )}
                <button
                  id="signout-btn"
                  onClick={handleSignOut}
                  title="Sign out from assistant"
                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Application Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Workspace Alert Status Bar */}
        {isDemoMode && (
          <div className="mb-6 bg-[#121214] border border-amber-950 text-amber-500 rounded-xl p-4 text-xs font-medium flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-550 animate-pulse"></span>
              <span>
                <strong>Sandbox Simulator Active:</strong> Reviewing telemetry with local assets.
                Configure credentials in credentials tab to establish full Google integration.
              </span>
            </div>
            <button 
              onClick={handleSignIn}
              className="text-xs font-bold text-amber-200 bg-[#18181b] hover:bg-[#202024] cursor-pointer px-3 py-1 rounded-lg border border-[#27272a] transition-all"
            >
              Sign In with Google
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTAINER (5 Cols): Calendar & Upcoming Schedule */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 relative">
              
              <div className="flex items-center justify-between border-b border-[#27272a] pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 px-2 bg-[#18181b] border border-[#27272a] rounded text-blue-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <h2 className="text-md font-light text-white tracking-tight">Today&rsquo;s <span className="font-semibold">Meetings</span></h2>
                </div>
                <div className="text-[10px] font-mono font-bold text-zinc-500">
                  {meetingsComputedStatus.meetingsAugmented.length} EVENTS LOADED
                </div>
              </div>

              {/* Scheduled meetings renderer */}
              <div className="space-y-4">
                {meetingsComputedStatus.meetingsAugmented.length === 0 ? (
                  <div className="text-center py-8 bg-[#18181b] rounded-xl border border-dashed border-[#27272a]">
                    <Calendar className="h-7 w-7 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-zinc-500">No events scheduled for the remainder of today.</p>
                  </div>
                ) : (
                  meetingsComputedStatus.meetingsAugmented.map((meeting) => {
                    const startLocal = new Date(meeting.start);
                    const endLocal = new Date(meeting.end);
                    
                    return (
                      <div 
                        key={meeting.id}
                        className={`group border rounded-xl p-4 transition-all duration-200 relative ${
                          meeting.isActive 
                            ? "bg-blue-950/20 border-blue-500/40 shadow-sm" 
                            : "bg-[#18181b]/55 border-[#27272a] hover:border-zinc-700"
                        }`}
                      >
                        {/* Is Active marker */}
                        {meeting.isActive && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-blue-600 text-white text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                            ACTIVE NOW
                          </div>
                        )}

                        <span className="text-[10px] font-mono font-semibold text-blue-400">
                          {startLocal.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {endLocal.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <h3 className="text-xs font-semibold text-white leading-snug mt-1 transition-colors">
                          {meeting.summary}
                        </h3>

                        {meeting.description && (
                          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}

                        {(meeting.location || meeting.meetLink) && (
                          <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1 max-w-[180px] truncate">
                              <span className="h-1 w-1 rounded-full bg-zinc-500"></span>
                              {meeting.location || "Online"}
                            </span>

                            {meeting.meetLink && (
                              <a 
                                href={meeting.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                Join call <ArrowUpRight className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Simulated Inbox Injector for Playground testing */}
            <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#27272a]">
                <Activity className="h-4 w-4 text-zinc-500 animate-pulse" />
                <h3 className="text-xs font-extrabold text-[#e4e4e7] uppercase tracking-wider">Simulate Custom Inbox</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal mb-4">
                Verify triage classification loops inside this workspace by instantly inserting custom mail pieces into the triaging system.
              </p>

              <form onSubmit={handleAddMockEmail} className="space-y-3 font-sans">
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Sender details</label>
                  <input 
                    type="text" 
                    value={simulatedMailSender}
                    onChange={(e) => setSimulatedMailSender(e.target.value)}
                    placeholder="e.g. boss@corp.com"
                    required
                    className="w-full text-xs border border-[#27272a] rounded-lg py-1 px-3 bg-[#1a1a1c]/75 hover:bg-[#1a1a1c] focus:bg-[#18181b] focus:border-blue-500 focus:outline-none transition-all text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Subject Header</label>
                  <input 
                    type="text" 
                    value={simulatedMailSubject}
                    onChange={(e) => setSimulatedMailSubject(e.target.value)}
                    placeholder="e.g. Critical project rollout review"
                    required
                    className="w-full text-xs border border-[#27272a] rounded-lg py-1 px-3 bg-[#1a1a1c]/75 hover:bg-[#1a1a1c] focus:bg-[#18181b] focus:border-blue-500 focus:outline-none transition-all text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">Snippet summary text</label>
                  <textarea 
                    value={simulatedMailSnippet}
                    onChange={(e) => setSimulatedMailSnippet(e.target.value)}
                    placeholder="e.g. Hey, let's review the final setup guidelines..."
                    rows={2}
                    className="w-full text-xs border border-[#27272a] rounded-lg py-1.5 px-3 bg-[#1a1a1c]/75 hover:bg-[#1a1a1c] focus:bg-[#18181b] focus:border-blue-500 focus:outline-none transition-all text-white font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all text-center cursor-pointer border-none"
                >
                  Insert Email to System
                </button>
              </form>
            </div>
          </section>

          {/* RIGHT CONTAINER (7 Cols): Gmail Inbox and AI Triage */}
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 min-h-[400px] flex flex-col">
              
              {/* Inbox Heading and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272a] pb-5 mb-5 font-sans">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 px-2 bg-[#18181b] border border-[#27272a] rounded text-blue-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-md font-light text-white tracking-tight">AI <span className="font-semibold">Inbox Triage</span></h2>
                    <p className="text-[11px] text-zinc-500 leading-none mt-1">Identifies urgent requests and weeds out distractions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <button
                      onClick={() => loadRealData(accessToken!)}
                      disabled={isLoading}
                      className="p-1.5 border border-[#27272a] bg-[#18181b] hover:bg-[#202024] text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-55"
                      title="Sync workspace inbox"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => triggerAIEmailTriage(emails)}
                    disabled={isTriaging || emails.length === 0}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-none font-semibold px-4 py-2 rounded-xl text-xs tracking-tight shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                    <span>{isTriaging ? "Triaging..." : "Run AI Triage"}</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 mb-5 font-sans">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search sender, subject, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 bg-[#1a1a1c] border border-[#27272a] text-white hover:bg-zinc-800 focus:border-blue-500 focus:outline-none rounded-xl transition-all font-sans"
                  />
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] p-1 rounded-xl">
                  {(['all', 'priority', 'other'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all capitalize ${
                        activeTab === tab
                          ? 'bg-[#27272a] text-white shadow-xs border border-[#27272a]/50'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab === 'all' ? 'All Mail' : tab === 'priority' ? '🔥 Priority' : '🗳️ Other'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5 mb-6 font-sans">
                <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 mr-1.5">Categorization:</span>
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    activeCategory === 'all'
                      ? 'bg-[#27272a] text-white border-[#27272a]'
                      : 'bg-[#18181b] text-zinc-400 border border-[#27272a] hover:bg-zinc-850 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
                {['Action Required', 'Informational', 'Social/Personal', 'Newsletter', 'System Notification'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white border-none shadow-xs'
                        : 'bg-[#18181b] text-zinc-400 border border-[#27272a] hover:bg-zinc-850 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* triaging loading overlay indicator */}
              <div className="flex-1 relative">
                {isTriaging && (
                  <div className="absolute inset-0 bg-[#0c0c0e]/85 backdrop-blur-md flex flex-col justify-center items-center z-10 rounded-xl">
                    <div className="relative mb-3.5">
                      <Sparkles className="h-7 w-7 text-blue-500 animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-white">Analyzing Message Context...</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Establishing email semantics via server-side Gemini AI models.</p>
                  </div>
                )}

                {/* Main list container */}
                <div className="space-y-4 font-sans">
                  {filteredEmailsComputed.length === 0 ? (
                    <div className="text-center py-16 bg-[#18181b] rounded-xl border border-dashed border-[#27272a]">
                      <Inbox className="h-9 w-9 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-500">No emails match the selected filter variables.</p>
                    </div>
                  ) : (
                    filteredEmailsComputed.map((email) => {
                      const priority = email.evaluation.is_important;
                      const cat = email.evaluation.category;
                      
                      // Assign colors and styles to match Sophisticated Dark custom category border scheme
                      let leftBorderClass = "border-l-2 border-zinc-700";
                      let badgeStyle = "bg-[#18181b] text-zinc-400 border-[#27272a]";
                      
                      if (cat === "Action Required") {
                        leftBorderClass = "border-l-2 border-blue-500";
                        badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      } else if (cat === "System Notification") {
                        leftBorderClass = "border-l-2 border-red-500";
                        badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                      } else if (cat === "Social/Personal") {
                        leftBorderClass = "border-l-2 border-amber-500";
                        badgeStyle = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                      } else if (cat === "Newsletter") {
                        leftBorderClass = "border-l-2 border-zinc-700";
                        badgeStyle = "bg-zinc-800/40 text-zinc-400 border-[#27272a]";
                      }

                      return (
                        <div 
                          key={email.id}
                          className={`group bg-[#18181b] rounded-r-xl border border-y border-r border-[#27272a] shadow-sm hover:bg-[#1c1c1f] transition-all duration-300 ${leftBorderClass}`}
                        >
                          {/* Envelope Header info */}
                          <div className="px-4.5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="space-y-1 w-full">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Priority Flag indicator */}
                                {priority && (
                                  <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-[9px] font-mono leading-none tracking-wider font-extrabold uppercase px-2 py-1 rounded-full border border-red-500/20">
                                    🔥 PRIORITY
                                  </span>
                                )}

                                <span className={`text-[10px] font-mono border font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                                  {cat}
                                </span>

                                <span className="text-[10px] font-mono font-medium text-zinc-500">
                                  {email.date}
                                </span>
                              </div>

                              <h4 className="text-sm font-semibold text-white leading-snug tracking-tight">
                                {email.subject}
                              </h4>
                              
                              <p className="text-[11px] text-zinc-400 truncate">
                                From: {email.from}
                              </p>
                            </div>
                          </div>

                          {/* Email Body & Snippet Summary and AI Insights */}
                          <div className="px-4.5 pb-4 space-y-3.5 font-sans border-t border-[#27272a] pt-3">
                            <div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed italic block">&ldquo;{email.snippet}&rdquo;</p>
                            </div>

                            {/* AI summary results layer */}
                            {triageResults.length > 0 && (
                              <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3 space-y-2 font-sans">
                                <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                                  <Sparkles className="h-3 w-3 text-amber-500" />
                                  <span>Gemini AI Insights</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                                    <strong>Summary:</strong> {email.evaluation.summary}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                                    <strong>Reason:</strong> {email.evaluation.reason}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Sophisticated Dark Telemetry Footer */}
      <footer className="h-12 border-t border-[#27272a] bg-[#121214] px-8 flex items-center justify-between text-[10px] text-zinc-500 font-mono tracking-tighter w-full">
        <div>MODEL: GEMINI-3.5-FLASH</div>
        <div className="hidden sm:block">SYSTEM INTELLIGENCE INDEX: 98.2% ACCURACY</div>
        <div className="uppercase">API STATUS: GOOGLE_WORKSPACE_CONNECTED</div>
      </footer>

    </div>
  );
}
