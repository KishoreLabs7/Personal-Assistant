import React from 'react';
import { Sparkles, Shield, Mail, Calendar, Zap } from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => void;
  onEnterDemo: () => void;
  isLoggingIn: boolean;
}

export default function LoginScreen({ onSignIn, onEnterDemo, isLoggingIn }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#e4e4e7] flex flex-col justify-center items-center px-4 py-16 font-sans">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#121214] rounded-full py-1 px-3 text-xs font-mono font-medium text-zinc-400 border border-[#27272a] mb-4 shadow-sm">
            <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
            <span>PERSONAL EXECUTIVE ASSISTANT</span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-white">
            Personal <span className="font-semibold text-blue-500">Assistant</span>
          </h1>
          <p className="mt-2 text-zinc-400 text-sm">
            Automate inbox triage and coordinate calendar notifications seamlessly.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl shadow-xl p-8 transition-all duration-300">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white tracking-tight">Connect Workspace</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Sign in with your Google Account to authorize the assistant to sync with your primary calendar events and unread inbox.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3.5 bg-[#18181b] rounded-xl p-4 border border-[#27272a] font-sans">
              <div className="flex gap-3 items-start col-span-1 border-l-2 border-blue-500 pl-3">
                <div className="p-1 px-2 mt-0.5 bg-[#121214] rounded border border-[#27272a] text-blue-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Dynamic Calendar Alerts</h4>
                  <p className="text-[11px] text-zinc-400">Real-time meeting tracking, active count-downs, and instant Google Meet launch links.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start col-span-1 border-l-2 border-amber-500 pl-3">
                <div className="p-1 px-2 mt-0.5 bg-[#121214] rounded border border-[#27272a] text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Gemini Email Triage</h4>
                  <p className="text-[11px] text-zinc-400">Intelligent inbox analysis segmenting newsletters from critical questions with direct summaries.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start col-span-1 border-l-2 border-zinc-500 pl-3">
                <div className="p-1 px-2 mt-0.5 bg-[#121214] rounded border border-[#27272a] text-zinc-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Secure Architecture</h4>
                  <p className="text-[11px] text-zinc-400">Workspace data stays purely in your browser; LLM summaries run server-side over secret endpoints.</p>
                </div>
              </div>
            </div>

            {/* Google Sign-in button */}
            <div className="space-y-3 pt-2">
              <button
                id="google-signin-btn"
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="w-full cursor-pointer bg-[#18181b] hover:bg-[#202024] flex items-center justify-center border border-[#27272a] rounded-xl py-3 px-4 font-sans font-medium text-white transition-all hover:border-zinc-500 hover:shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {isLoggingIn ? "Authenticating..." : "Sign in with Google"}
                  </span>
                </div>
              </button>

              <button
                id="demo-mode-btn"
                onClick={onEnterDemo}
                className="w-full text-zinc-400 bg-[#18181b] text-xs font-semibold py-2.5 px-4 border border-[#27272a] rounded-xl hover:bg-[#202024] hover:border-zinc-700 transition-all hover:text-white"
              >
                Launch Offline Sandbox (No OAuth required)
              </button>
            </div>
          </div>
        </div>

        {/* Security / Terms footer */}
        <div className="mt-8 flex justify-center items-center gap-2 text-[11px] text-zinc-500">
          <Shield className="h-3.5 w-3.5" />
          <span>Protected Google API Scopes. No data leaves the direct client memory.</span>
        </div>
      </div>
    </div>
  );
}
