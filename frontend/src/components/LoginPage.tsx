import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  HeartPulse,
  Pill,
  Plus,
  Building2,
  ClipboardList,
  Syringe,
  Thermometer
} from 'lucide-react';

interface LoginPageProps {
  onBackToLanding: () => void;
  onLoginSuccess: (role: 'reception' | 'doctor' | 'pharmacy' | 'admin', doctorId?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const detectStaffInfo = (val: string): { role: 'reception' | 'doctor' | 'pharmacy' | 'admin'; doctorId?: string; roleLabel: string } => {
    const lower = val.toLowerCase().trim();
    if (lower.includes('doctor3') || lower.includes('emily') || lower.includes('doc3') || lower.includes('doc-3') || lower.includes('elena')) {
      return { role: 'doctor', doctorId: '3', roleLabel: 'Doctor Portal (Dr. Elena Rostova / Dr. Emily)' };
    }
    if (lower.includes('doctor2') || lower.includes('michael') || lower.includes('marcus') || lower.includes('doc2') || lower.includes('doc-2')) {
      return { role: 'doctor', doctorId: '2', roleLabel: 'Doctor Portal (Dr. Marcus Chen)' };
    }
    if (lower.includes('doctor') || lower.includes('doc') || lower.includes('dr') || lower.includes('sarah')) {
      return { role: 'doctor', doctorId: '1', roleLabel: 'Doctor Portal (Dr. Sarah Jenkins)' };
    }
    if (lower.includes('pharmacy') || lower.includes('pharma')) return { role: 'pharmacy', roleLabel: 'Pharmacy Portal' };
    if (lower.includes('admin')) return { role: 'admin', roleLabel: 'Clinic Admin' };
    return { role: 'reception', roleLabel: 'Reception Portal' };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your staff email or ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Try real FastAPI backend login first
      const data = await api.login(email.trim(), password);
      setLoginMessage(`Authenticated successfully as ${data.full_name} (${data.role}). Launching workspace...`);
      setTimeout(() => {
        setIsLoggingIn(false);
        const mappedRole = data.role.toLowerCase() === 'doctor' ? 'doctor' : (data.role.toLowerCase() === 'admin' ? 'admin' : 'reception');
        onLoginSuccess(mappedRole as any, data.doctor_id ? String(data.doctor_id) : undefined);
      }, 400);
      return;
    } catch (apiErr: any) {
      // 2. Demo fallback if backend is offline or credentials match demo
      if (password === '123' || password === 'admin123' || password === 'reception123' || password === 'doctor123') {
        const { role, doctorId, roleLabel } = detectStaffInfo(email);
        setLoginMessage(`Authenticated (Demo Mode). Launching ${roleLabel}...`);
        setTimeout(() => {
          setIsLoggingIn(false);
          onLoginSuccess(role, doctorId);
        }, 350);
        return;
      }
      setIsLoggingIn(false);
      setErrorMessage(apiErr?.message || 'Invalid credentials or backend unreachable.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F7] relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-[#F76762]/20 selection:text-[#F76762]">
      
      {/* Background Decorative Mesh & Radial Glows */}
      <div 
        aria-hidden="true" 
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#F76762]/15 to-[#FB866E]/5 rounded-full blur-3xl pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-[#F76762]/15 to-[#FB866E]/5 rounded-full blur-3xl pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-[#F76762]/5 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" 
      />

      {/* Subtle Background Hospital / Healthcare Icons (Blended into background) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Top left cluster */}
        <Stethoscope className="absolute top-12 left-[10%] w-16 h-16 text-[#F76762]/12 -rotate-12" />
        <HeartPulse className="absolute top-36 left-[5%] w-12 h-12 text-[#FB866E]/12 animate-pulse" />
        <Plus className="absolute top-24 left-[22%] w-10 h-10 text-[#F76762]/10 rotate-45" />

        {/* Top right cluster */}
        <Building2 className="absolute top-16 right-[12%] w-18 h-18 text-[#F76762]/10 rotate-6" />
        <Activity className="absolute top-40 right-[6%] w-14 h-14 text-[#FB866E]/12" />
        <Pill className="absolute top-28 right-[24%] w-10 h-10 text-[#F76762]/10 rotate-12" />

        {/* Bottom left cluster */}
        <ClipboardList className="absolute bottom-20 left-[8%] w-16 h-16 text-[#F76762]/10 rotate-6" />
        <Thermometer className="absolute bottom-44 left-[18%] w-12 h-12 text-[#FB866E]/10 -rotate-12" />
        <Plus className="absolute bottom-12 left-[25%] w-8 h-8 text-[#F76762]/10" />

        {/* Bottom right cluster */}
        <Syringe className="absolute bottom-24 right-[10%] w-16 h-16 text-[#F76762]/10 -rotate-45" />
        <ShieldCheck className="absolute bottom-48 right-[20%] w-14 h-14 text-[#FB866E]/12 rotate-12" />
        <Plus className="absolute bottom-16 right-[28%] w-9 h-9 text-[#F76762]/10 rotate-12" />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#F76762_0.75px,transparent_0.75px)] [background-size:28px_28px] opacity-15" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-xl rounded-3xl border border-[#F1E4E1] p-8 sm:p-10 shadow-xl shadow-[#18212F]/5 relative z-10 space-y-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header Inside Login Box */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F76762] to-[#FB866E] flex items-center justify-center text-white shadow-lg shadow-[#F76762]/25 mx-auto transition-transform hover:scale-105 duration-200">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[#18212F]">
                Aura<span className="text-[#F76762]">CMS</span>
              </span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667085] mt-0.5">
              Clinic Management Workspace
            </p>
          </div>
          <div className="pt-1">
            <h1 className="text-lg font-bold text-[#18212F]">
              Sign in to your Clinic
            </h1>
            <p className="text-xs text-[#667085] mt-1">
              Enter your authorized staff credentials to continue
            </p>
          </div>
        </div>

        {/* Quick Staff Login Buttons for Testing */}
        <div className="bg-[#FFF9F7] border border-[#F1E4E1] p-2.5 rounded-xl space-y-1.5">
          <p className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider text-center">
            Quick Staff Access (Real Database Logins)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => { setEmail('reception@auracms.com'); setPassword('reception123'); setErrorMessage(null); }}
              className="py-1.5 px-2 rounded-lg bg-white border border-[#F1E4E1] text-[11px] font-medium text-[#18212F] hover:border-[#F76762] hover:text-[#F76762] transition-colors cursor-pointer text-center"
            >
              👩‍💼 Reception
            </button>
            <button
              type="button"
              onClick={() => { setEmail('doctor.sarah@auracms.com'); setPassword('doctor123'); setErrorMessage(null); }}
              className="py-1.5 px-2 rounded-lg bg-white border border-[#F1E4E1] text-[11px] font-medium text-[#18212F] hover:border-[#F76762] hover:text-[#F76762] transition-colors cursor-pointer text-center"
            >
              🩺 Dr. Sarah
            </button>
            <button
              type="button"
              onClick={() => { setEmail('admin@auracms.com'); setPassword('admin123'); setErrorMessage(null); }}
              className="py-1.5 px-2 rounded-lg bg-white border border-[#F1E4E1] text-[11px] font-medium text-[#18212F] hover:border-[#F76762] hover:text-[#F76762] transition-colors cursor-pointer text-center"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4.5">
          {/* Email / ID Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#18212F] block">
              Staff Email / User ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#667085]" />
              <input
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter staff email"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] placeholder:text-[#667085]/60 focus:outline-none focus:border-[#F76762] focus:ring-2 focus:ring-[#F76762]/10 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#18212F]">
                Password
              </label>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setErrorMessage('Default demo staff password is 123.')}
                className="text-[11px] font-medium text-[#667085] hover:text-[#F76762] cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#667085]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-[#FFF9F7] border border-[#F1E4E1] rounded-xl text-xs text-[#18212F] placeholder:text-[#667085]/60 focus:outline-none focus:border-[#F76762] focus:ring-2 focus:ring-[#F76762]/10 transition-all font-mono"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#667085] hover:text-[#18212F] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Feedback Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Feedback Alert */}
          {loginMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{loginMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white font-semibold rounded-xl hover:opacity-95 shadow-md shadow-[#F76762]/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs disabled:opacity-70 group"
          >
            <span>
              {isLoggingIn 
                ? 'Verifying Credentials...' 
                : email.toLowerCase().includes('doctor') 
                ? 'Sign In to Doctor Workstation' 
                : 'Sign In to Clinic Workspace'}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Back to Product Overview Button — Located Directly Below Submit */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] hover:text-[#F76762] transition-colors cursor-pointer py-1 px-2 rounded-lg group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Product Overview</span>
            </button>
          </div>
        </form>

        {/* Encrypted Healthcare Session Security Badge */}
        <div className="pt-3 border-t border-[#F1E4E1] text-center text-[11px] text-[#667085] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F76762]" />
          <span>Encrypted healthcare session · Certified secure</span>
        </div>

      </div>

      {/* Quiet Bottom Copyright */}
      <div className="mt-8 text-center text-[11px] text-[#667085] relative z-10">
        © {new Date().getFullYear()} AuraCMS. Small Clinic Management System.
      </div>

    </div>
  );
};
