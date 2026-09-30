import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ReceptionPortal } from './components/reception/ReceptionPortal';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { Lock } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [currentUserRole, setCurrentUserRole] = useState<'reception' | 'doctor' | 'pharmacy' | 'admin' | null>(() => {
    return (localStorage.getItem('auracms_auth_role') as any) || null;
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role: 'reception' | 'doctor' | 'pharmacy' | 'admin', doctorId?: string) => {
    setCurrentUserRole(role);
    localStorage.setItem('auracms_auth_role', role);
    if (doctorId) {
      localStorage.setItem('auracms_doctor_id', doctorId);
    }
    if (role === 'doctor') {
      navigateTo('/doctor/dashboard');
    } else {
      navigateTo('/reception/dashboard');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUserRole(null);
    navigateTo('/');
  };

  // If user navigated to /login, render the login portal screen
  if (currentPath === '/login') {
    return (
      <LoginPage 
        onBackToLanding={() => navigateTo('/')} 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Doctor Portal Protected Routing (/doctor/*)
  if (currentPath.startsWith('/doctor')) {
    if (!currentUserRole || currentUserRole !== 'doctor') {
      return (
        <div className="min-h-screen bg-[#FFF9F7] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-[#F1E4E1] max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#18212F]">Physician Login Required</h2>
              <p className="text-xs text-[#667085] mt-1">
                The Doctor Workstation requires authenticated physician credentials. Please sign in with your doctor account (e.g. doctor1@gmail.com, doctor2@gmail.com).
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleLoginSuccess('doctor', 'doc-1')}
                className="w-full py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-[#F76762]/20 hover:opacity-95"
              >
                Instant Enter as Dr. Sarah K. (Demo)
              </button>
              <button
                onClick={() => navigateTo('/login')}
                className="w-full py-2.5 bg-white border border-[#F1E4E1] text-[#18212F] rounded-xl text-xs font-semibold cursor-pointer hover:bg-[#FFF9F7]"
              >
                Go to Staff Login Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <DoctorPortal
        currentPath={currentPath}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
    );
  }

  // Reception Portal Protected Routing (/reception/*)
  if (currentPath.startsWith('/reception')) {
    if (!currentUserRole) {
      return (
        <div className="min-h-screen bg-[#FFF9F7] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-[#F1E4E1] max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#18212F]">Staff Login Required</h2>
              <p className="text-xs text-[#667085] mt-1">
                Please sign in with your clinic staff credentials to access the clinic workspace.
              </p>
            </div>
            <button
              onClick={() => navigateTo('/login')}
              className="w-full py-2.5 bg-gradient-to-r from-[#F76762] to-[#FB866E] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Sign In to Clinic Portal
            </button>
          </div>
        </div>
      );
    }

    return (
      <ReceptionPortal
        currentPath={currentPath}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
    );
  }

  // Single Consolidated Landing Page (/)
  return (
    <LandingPage onNavigateLogin={() => navigateTo('/login')} />
  );
}
