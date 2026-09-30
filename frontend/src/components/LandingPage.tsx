import { useEffect, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Pill,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react';

const navItems = [
  ['Home', 'home'],
  ['System', 'system'],
  ['Modules', 'modules'],
  ['Workflow', 'workflow'],
  ['Benefits', 'benefits'],
] as const;

const modules = [
  { id: '01', title: 'Reception', caption: 'Front desk clarity', icon: Users, color: '#ff9b86', detail: 'Registration, patient information, appointments, and queue handling in one calm workspace.' },
  { id: '02', title: 'Doctor', caption: 'Focused consultations', icon: Stethoscope, color: '#f9c66d', detail: 'Patient context, consultation details, diagnosis, and prescription workflow without distraction.' },
  { id: '03', title: 'Pharmacy', caption: 'Confident dispensing', icon: Pill, color: '#ee8491', detail: 'Prescription handling, medicine management, dispensing, and availability awareness.' },
];

const carePathSteps = [
  {
    step: '01',
    title: 'Patient arrives',
    role: 'Arrival',
    icon: UserRound,
    color: '#fb866e',
    detailLine1: 'The visit enters the clinic journey.',
    detailLine2: 'Patient check-in details and arrival timestamps are registered.',
  },
  {
    step: '02',
    title: 'Reception',
    role: 'Front desk',
    icon: Users,
    color: '#e89c68',
    detailLine1: 'Registration and visit details are organized.',
    detailLine2: 'Patient history, identity verification, and queue placement are completed.',
  },
  {
    step: '03',
    title: 'Consultation',
    role: 'Doctor',
    icon: Stethoscope,
    color: '#d99b4c',
    detailLine1: 'The doctor reviews and records consultation information.',
    detailLine2: 'Vital signs, clinical notes, and active diagnosis are updated in real-time.',
  },
  {
    step: '04',
    title: 'Prescription',
    role: 'Treatment',
    icon: FileText,
    color: '#dc7f78',
    detailLine1: 'Medicine instructions are prepared for the next step.',
    detailLine2: 'Dosage instructions, duration, and safety warnings are securely attached.',
  },
  {
    step: '05',
    title: 'Pharmacy',
    role: 'Dispensing',
    icon: Pill,
    color: '#d67585',
    detailLine1: 'The prescription moves into medicine operations.',
    detailLine2: 'Pharmacist verifies stock, prepares medications, and dispenses with care.',
  },
  {
    step: '06',
    title: 'Visit complete',
    role: 'Connected care',
    icon: ShieldCheck,
    color: '#a77883',
    detailLine1: 'The patient journey reaches a clear close.',
    detailLine2: 'Summary records are safely archived and follow-up guidance is generated.',
  },
];

const card3dVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -24 : 24,
    x: direction > 0 ? 50 : -50,
    scale: 0.94,
  }),
  animate: {
    opacity: 1,
    rotateY: 0,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 24 : -24,
    x: direction > 0 ? -50 : 50,
    scale: 0.94,
    transition: {
      duration: 0.38,
      ease: [0.7, 0, 0.84, 0],
    },
  }),
};

function CareRelayBoard() {
  const [[activeStep, direction], setStepState] = useState([0, 1]);

  const active = carePathSteps[activeStep];
  const ActiveIcon = active.icon;

  const goToStep = (newStep: number, customDir?: number) => {
    const dir = customDir ?? (newStep >= activeStep ? 1 : -1);
    setStepState([newStep, dir]);
  };

  const handleNext = () => {
    setStepState(([current]) => {
      const next = (current + 1) % carePathSteps.length;
      return [next, 1];
    });
  };

  const handlePrev = () => {
    setStepState(([current]) => {
      const prev = current === 0 ? carePathSteps.length - 1 : current - 1;
      return [prev, -1];
    });
  };

  // Continuous auto-flow interval set to 4200ms (4.2s) - resets cleanly on user click
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 4200);
    return () => clearInterval(timer);
  }, [activeStep]);

  return (
    <div className="mt-14">
      <div className="relative overflow-hidden rounded-[36px] border border-[#e8ddd5] bg-[#fffaf6] p-5 shadow-[0_28px_90px_rgba(105,72,56,.11)] sm:p-8 lg:p-10">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#fb866e]/10 blur-3xl" />
        <div className="absolute -bottom-32 left-[30%] h-72 w-72 rounded-full bg-[#f3c985]/10 blur-3xl" />

        {/* Header */}
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#eadfd8] pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d77764]">Live care relay</p>
            <h3 className="mt-1 text-xl font-bold tracking-[-.04em] text-[#202124]">One visit, passed with clarity.</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe9da] bg-[#f0fbf4] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#4f9b6e]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#62c48a]" />
            Auto flow active
          </span>
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[.34fr_1.66fr] lg:items-center">
          {/* Vertical Step Timeline */}
          <div className="relative z-10 flex gap-4 lg:block">
            <div className="absolute bottom-4 left-[15px] top-4 w-px bg-[#ead9d1] lg:bottom-auto lg:left-[15px] lg:top-8 lg:h-[calc(100%-64px)] lg:w-px" />
            <div className="flex w-full justify-between gap-2 lg:block lg:space-y-5">
              {carePathSteps.map((item, index) => {
                const Icon = item.icon;
                const isCurrent = activeStep === index;
                return (
                  <button
                    type="button"
                    key={item.step}
                    onClick={() => goToStep(index)}
                    className={`group relative flex items-center gap-3 text-left transition-all lg:w-full ${isCurrent ? 'text-[#e56f5b]' : 'text-[#a79b95] hover:text-[#746964]'
                      }`}
                  >
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[#fffaf6] text-[10px] font-bold transition-all ${isCurrent
                        ? 'scale-110 bg-[#fb866e] text-[#202124] shadow-[0_0_0_4px_rgba(251,134,110,.15)]'
                        : 'bg-[#ead9d1] text-[#806f67]'
                        }`}
                    >
                      {isCurrent ? <Icon size={13} /> : item.step}
                    </span>
                    <span className="hidden text-xs font-bold lg:block">{item.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smooth 3D Opening Card Area */}
          <div className="relative min-h-[350px] [perspective:1400px] sm:min-h-[380px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={active.step}
                custom={direction}
                variants={card3dVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative h-full min-h-[370px] sm:min-h-[380px] [transform-style:preserve-3d]"
              >
                <div className="absolute inset-x-[6%] bottom-[7%] h-20 rounded-[50%] bg-[#d9b7a8]/25 blur-2xl" />
                <div className="absolute left-[8%] top-[13%] h-[250px] w-[84%] rotate-[-4deg] rounded-[28px] border border-[#eed6cb] bg-[#f8eae3] shadow-[0_24px_45px_rgba(120,76,57,.10)] [transform:rotateX(58deg)_rotateZ(-8deg)] sm:h-[310px]" />

                {/* Main Floating Card */}
                <motion.div
                  animate={{ y: [0, -6, 0], rotateZ: [0, 0.8, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-[13%] top-[18%] z-20 w-[74%] rounded-[28px] border border-white/90 bg-white p-5 shadow-[0_25px_60px_rgba(95,61,47,.15)] sm:p-7 [transform:translateZ(55px)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300"
                        style={{ backgroundColor: `${active.color}25`, color: active.color }}
                      >
                        <ActiveIcon size={23} />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: active.color }}>
                          {active.role}
                        </p>
                        <h4 className="mt-1 text-xl font-bold tracking-[-.04em] text-[#202124] sm:text-2xl">
                          {active.title}
                        </h4>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-[#ddd2cc]">{active.step}</span>
                  </div>

                  {/* 2-Line Content Per Card */}
                  <div className="mt-6 max-w-md space-y-1.5 text-sm leading-relaxed">
                    <p className="font-semibold text-[#2c2421] sm:text-base">
                      {active.detailLine1}
                    </p>
                    <p className="text-xs font-medium text-[#746b67] sm:text-sm">
                      {active.detailLine2}
                    </p>
                  </div>

                  {/* Visual Status Indicator Footer */}
                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[#f0e7e2] pt-4">
                    <div className="rounded-xl bg-[#fff7f3] p-3">
                      <span className="block h-2 w-12 rounded-full bg-[#f4c6ba]" />
                      <span className="mt-2.5 block h-2 w-16 rounded-full bg-[#eee4df]" />
                    </div>
                    <div className="rounded-xl bg-[#fff7f3] p-3">
                      <span className="block h-2 w-8 rounded-full bg-[#f4c6ba]" />
                      <span className="mt-2.5 block h-2 w-12 rounded-full bg-[#eee4df]" />
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-[#fff0eb] text-[#e77661]">
                      <Check size={21} />
                    </div>
                  </div>
                </motion.div>

                <div className="absolute bottom-[11%] left-[9%] z-30 flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-[9px] font-bold uppercase tracking-[.15em] text-[#786b65] shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-[#fb866e]" /> Context passed forward
                </div>
                <div className="absolute bottom-[10%] right-[8%] z-30 rounded-full border border-[#edc2b5] bg-[#fff1eb] px-3 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-[#d67562] shadow-sm">
                  Next: {carePathSteps[(activeStep + 1) % carePathSteps.length].role}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="relative mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#eadfd8] pt-5">
          <div className="flex items-center gap-2">
            {carePathSteps.map((item, index) => (
              <button
                type="button"
                key={item.step}
                aria-label={`Show ${item.title}`}
                onClick={() => goToStep(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeStep === index ? 'w-10 bg-[#fb866e]' : 'w-5 bg-[#e5d7cf] hover:bg-[#d3bcb0]'
                  }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full border border-[#e6d9d2] bg-white px-4 py-2 text-xs font-bold text-[#756a65] transition hover:border-[#fb866e] active:scale-95"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-[#202124] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#3a3b3d] active:scale-95 flex items-center gap-1.5"
            >
              Next step <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const benefits = [
  ['Less waiting between roles', 'Keep the next action visible to the right team.', Activity],
  ['One patient context', 'Move relevant information through the visit with less friction.', UserRound],
  ['A calmer workday', 'Replace scattered handoffs with a consistent clinic rhythm.', HeartPulse],
  ['Built for real operations', 'Keep every workspace focused on its actual responsibility.', ShieldCheck],
];

const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] as const } },
};

const groupReveal: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#home" className="flex items-center gap-3 group" aria-label="ClinicFlow home">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#fb866e] shadow-[0_4px_16px_rgba(251,134,110,.25)] transition-transform group-hover:scale-105">
        <span className="absolute h-5 w-1.5 rounded-full bg-[#141517]" />
        <span className="absolute h-1.5 w-5 rounded-full bg-[#141517]" />
        <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <span>
        <span className={`block text-sm font-bold tracking-[-.03em] ${dark ? 'text-white' : 'text-[#202124]'}`}>
          ClinicFlow
        </span>
        <span className={`block text-[9px] font-semibold uppercase tracking-[.2em] ${dark ? 'text-white/50' : 'text-[#7e7875]'}`}>
          Medical operations
        </span>
      </span>
    </a>
  );
}

function SectionTitle({ kicker, title, text, dark = false }: { kicker: string; title: string; text?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={`mb-4 text-[11px] font-bold uppercase tracking-[.24em] ${dark ? 'text-[#fb866e]' : 'text-[#e87561]'}`}>
        {kicker}
      </p>
      <h2 className={`text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-5xl lg:text-[4.5rem] ${dark ? 'text-white' : 'text-[#1e2023]'}`}>
        {title}
      </h2>
      {text && (
        <p className={`mt-6 max-w-xl text-base leading-7 sm:text-lg ${dark ? 'text-white/55' : 'text-[#787576]'}`}>
          {text}
        </p>
      )}
    </div>
  );
}

function ModuleCard({ module }: { module: typeof modules[number]; index: number }) {
  const Icon = module.icon;
  return (
    <motion.article
      variants={reveal}
      whileHover={{ y: -9 }}
      className="group relative overflow-hidden rounded-[28px] border border-[#ebe5e0] bg-white p-6 shadow-[0_16px_50px_rgba(38,31,28,.05)] transition-shadow hover:shadow-[0_26px_70px_rgba(38,31,28,.12)] sm:p-7"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${module.color}22`, color: module.color }}>
          <Icon size={22} />
        </span>
        <span className="text-sm font-bold text-[#d4cdca]">{module.id}</span>
      </div>
      <p className="mt-7 text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: module.color }}>
        {module.caption}
      </p>
      <h3 className="mt-2 text-2xl font-bold tracking-[-.045em] text-[#202124]">{module.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#7c7775]">{module.detail}</p>
      <div className="mt-7 flex items-center gap-2 border-t border-[#f0ebe8] pt-5 text-xs font-bold text-[#595453]">
        View module flow <ArrowRight size={14} style={{ color: module.color }} className="transition-transform group-hover:translate-x-1" />
      </div>
      <div className="absolute -bottom-20 -right-14 h-44 w-44 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-45" style={{ backgroundColor: module.color }} />
    </motion.article>
  );
}

function SystemWorkflowShowcase() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const steps = [
    {
      id: '01',
      role: 'Reception',
      title: 'Queue & Registration',
      icon: Users,
      color: '#fb866e',
      badge: 'Token #104 Checked-In',
      desc: 'Instant patient onboarding & direct OPD room assignment.',
      image: '/reception_showcase.jpg',
      alt: 'Reception Patient Queue & Check-In Workstation',
    },
    {
      id: '02',
      role: 'Doctor',
      title: 'Consultation & E-Rx',
      icon: Stethoscope,
      color: '#f9c66d',
      badge: 'Vitals 120/80 • Rx Active',
      desc: 'Real-time vitals logging & electronic prescription dispatch.',
      image: '/doctor_showcase.jpg',
      alt: 'Doctor Consultation & Clinical Vitals Interface',
    },
    {
      id: '03',
      role: 'Pharmacy',
      title: 'Stock & Dispensing',
      icon: Pill,
      color: '#d67585',
      badge: 'Stock Batch #B402 Dispensed',
      desc: 'Automated inventory deduction and prescription fulfillment.',
      image: '/pharmacy_showcase.jpg',
      alt: 'Pharmacy Dispensing & Stock Verification Workstation',
    },
  ];

  const current = steps[activeIndex];
  const CurrentIcon = current.icon;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % steps.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-xl">
      {/* Glow Backdrops */}
      <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-[#fb866e]/15 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-[#f3c985]/15 blur-3xl" />

      {/* 3D Perspective Stack Showcase Container */}
      <div className="relative h-[370px] sm:h-[430px] lg:h-[470px] w-full [perspective:1400px]">
        {steps.map((step, idx) => {
          // Calculate 3D position offset relative to activeIndex
          let offset = idx - activeIndex;
          if (offset < -1) offset += steps.length;
          if (offset > 1) offset -= steps.length;

          const isCurrent = offset === 0;
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.id}
              onClick={() => setActiveIndex(idx)}
              animate={{
                scale: isCurrent ? 1 : 0.85,
                x: `${offset * 44}%`,
                rotateY: offset * -12,
                zIndex: isCurrent ? 30 : 20 - Math.abs(offset) * 10,
                opacity: isCurrent ? 1 : 0.6,
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-y-0 left-[20%] w-[60%] cursor-pointer overflow-hidden rounded-[28px] border-[4px] border-white bg-slate-900 shadow-[0_20px_60px_rgba(95,61,47,.20)] transition-shadow hover:shadow-[0_28px_80px_rgba(95,61,47,.28)] [transform-style:preserve-3d]`}
            >
              {/* Background Showcase Image */}
              <img
                src={step.image}
                alt={step.alt}
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141517]/90 via-black/20 to-transparent" />

              {/* Step Card Badge */}
              <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2 rounded-full border border-white/30 bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold text-[#202124]" style={{ backgroundColor: step.color }}>
                  {step.id}
                </span>
                <span className="text-[11px]">{step.role}</span>
              </div>

              {/* Verified Pill Overlay */}
              <div className="absolute right-3.5 top-3.5 z-20 hidden rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#202124] shadow-md backdrop-blur-md sm:block">
                {step.badge}
              </div>

              {/* Bottom Card Summary (on active card) */}
              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-white/40 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-md" style={{ backgroundColor: step.color }}>
                        <StepIcon size={18} />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#202124] sm:text-sm">{step.title}</h4>
                        <p className="text-[11px] text-[#6e6561] hidden sm:block leading-tight">{step.desc}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#fff0ec] px-2.5 py-1 text-[9px] font-bold text-[#e87561] whitespace-nowrap">
                      Active
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export interface LandingPageProps {
  onNavigateLogin?: () => void;
}

export function LandingPage({ onNavigateLogin }: LandingPageProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 14);

      const scrollPos = window.scrollY + 220;
      const sections = navItems.map(([, id]) => document.getElementById(id)).filter(Boolean);
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(navItems[i][1]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const revealProps = reduced ? {} : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.18 } };
  const loginHref = '/login';

  const handleLoginClick = (e: MouseEvent) => {
    if (onNavigateLogin) {
      e.preventDefault();
      onNavigateLogin();
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf8] font-sans text-[#202124] selection:bg-[#fb866e] selection:text-[#17181a]">
      {/* Header with High-Contrast Navbar Links & Active Section Tracking */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled
          ? 'border-b border-[#e8dfd8] bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,.06)] backdrop-blur-md'
          : 'bg-transparent'
          }`}
      >
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand dark={false} />

          {/* Clearly visible dark navigation links with animated underline & active tracking */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map(([label, id]) => {
              const isActive = activeSection === id;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setActiveSection(id)}
                  className={`group relative py-1 text-[13px] font-bold transition-colors ${isActive ? 'text-[#e76e58]' : 'text-[#2d2e30] hover:text-[#e76e58]'
                    }`}
                >
                  {label}
                  {/* Animated underline indicator for hover & active state */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#fb866e] to-[#e76e58] transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={loginHref}
              onClick={handleLoginClick}
              className="hidden rounded-full bg-gradient-to-r from-[#fb866e] to-[#e76e58] px-6 py-2.5 text-xs font-bold text-white shadow-[0_6px_20px_rgba(251,134,110,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(251,134,110,0.45)] hover:brightness-105 sm:inline-flex"
            >
              Login
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0d6ce] bg-white text-[#202124] shadow-sm lg:hidden"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#e8dfd8] bg-white/95 px-5 py-4 shadow-xl backdrop-blur-md lg:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map(([label, id]) => {
                const isActive = activeSection === id;
                return (
                  <a
                    key={id}
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveSection(id);
                    }}
                    href={`#${id}`}
                    className={`rounded-xl px-3 py-3 text-sm font-bold ${isActive ? 'bg-[#fff0ec] text-[#e76e58]' : 'text-[#202124] hover:bg-[#fff0ec] hover:text-[#e76e58]'
                      }`}
                  >
                    {label}
                  </a>
                );
              })}
              <a
                href={loginHref}
                onClick={(e) => {
                  setMenuOpen(false);
                  handleLoginClick(e);
                }}
                className="mt-2 rounded-xl bg-gradient-to-r from-[#fb866e] to-[#e76e58] px-3 py-3 text-center text-sm font-bold text-white"
              >
                Login
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Senior-Dev Designed Hero Section - Perfect Viewport Center Below Navbar */}
        <section id="home" className="relative min-h-[calc(100vh-78px)] mt-[78px] flex flex-col justify-center overflow-hidden bg-[#fffdfb] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,rgba(251,134,110,.28),transparent_38%),linear-gradient(135deg,#ffffff_0%,#fff6f1_55%,#ffebd9_100%)]" />

          {/* Brighter & Striking Circular Background Rings */}
          <div className="absolute -right-28 top-8 h-[520px] w-[520px] rounded-full border-2 border-[#fb866e]/35 shadow-[0_0_40px_rgba(251,134,110,0.12)]" />
          <div className="absolute right-[-5%] top-24 h-[380px] w-[380px] rounded-full border-2 border-dashed border-[#fb866e]/40" />

          <div className="relative mx-auto my-auto grid max-w-7xl w-full items-center gap-8 lg:grid-cols-[.92fr_1.08fr] lg:gap-12">
            {/* Left Column Content */}
            <motion.div
              {...(reduced ? {} : { initial: 'hidden', animate: 'visible', variants: groupReveal })}
              className="relative z-10 max-w-xl"
            >
              <motion.div variants={reveal} className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#fcd5c7] bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-[#c76554] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#fb866e]" /> Connected Clinic Platform
              </motion.div>

              <motion.h1 variants={reveal} className="text-[clamp(2.2rem,4.2vw,4.2rem)] font-semibold leading-[.96] tracking-[-.06em] text-[#202124]">
                Let your team focus on <span className="text-[#e97561]">the patient.</span>
              </motion.h1>

              <motion.p variants={reveal} className="mt-5 max-w-lg text-sm leading-6 text-[#6f6967] sm:text-base">
                ClinicFlow brings reception, consultation, and pharmacy into one beautifully connected system—so every visit feels clearer from the moment it begins.
              </motion.p>

              <motion.div variants={reveal} className="mt-7 flex flex-wrap items-center gap-4">
                <a
                  href={loginHref}
                  onClick={handleLoginClick}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#fb866e] to-[#e76e58] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(251,134,110,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(251,134,110,0.5)] hover:brightness-105"
                >
                  Login to ClinicFlow <ArrowRight size={15} />
                </a>
                <a href="#workflow" className="inline-flex items-center gap-2 text-sm font-bold text-[#5e5856] transition hover:text-[#e76e58]">
                  Follow the patient journey <ChevronRight size={15} />
                </a>
              </motion.div>

              <motion.div variants={reveal} className="mt-8 grid max-w-md grid-cols-3 gap-5 border-t border-[#f0ded5] pt-4">
                <div>
                  <p className="text-lg font-bold tracking-[-.04em] text-[#202124]">01</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.13em] text-[#938883]">Reception</p>
                </div>
                <div>
                  <p className="text-lg font-bold tracking-[-.04em] text-[#202124]">02</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.13em] text-[#938883]">Doctor</p>
                </div>
                <div>
                  <p className="text-lg font-bold tracking-[-.04em] text-[#202124]">03</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.13em] text-[#938883]">Pharmacy</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column Lady Doctor (Clean White Studio Background) Visual Showcase */}
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.94, x: 24 }}
              animate={reduced ? {} : { opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.16 }}
              className="relative mx-auto w-full max-w-[440px] lg:max-w-none"
            >
              {/* Premium Lady Doctor Portrait Frame (White & Warm Orange Clinic Background) */}
              <div className="relative h-[330px] sm:h-[370px] lg:h-[390px] xl:h-[410px] w-full overflow-hidden rounded-[32px] border-[6px] border-white bg-[#ffffff] shadow-[0_25px_60px_rgba(251,134,110,.18)]">
                <img
                  src="/female_doctor_hero.jpg"
                  alt="Professional female physician with clean white and warm orange clinic background"
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/15 via-transparent to-[#fb866e]/05" />
              </div>

              {/* Floating Doctor ID Badge */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-2 top-6 z-20 flex items-center gap-3 rounded-2xl border border-white/90 bg-white/95 p-3 shadow-[0_15px_30px_rgba(251,134,110,.18)] backdrop-blur-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0ec] text-[#e76e58]">
                  <Stethoscope size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#202124]">Dr. Sarah K.</p>
                  <p className="text-[10px] font-semibold text-[#867e7a]">Chief Physician • OPD</p>
                </div>
              </motion.div>

              {/* Floating Minimal Clinic Status Badge */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-3 left-2 z-20 flex items-center gap-3 rounded-2xl border border-white/90 bg-white/95 p-3.5 shadow-[0_18px_40px_rgba(32,33,36,.08)] backdrop-blur-md"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#202124]">Live Clinic Flow</p>
                  <p className="text-[10px] font-semibold text-[#867e7a]">Reception → Doctor → Pharmacy</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced System Model & About Section */}
        <section id="system" className="relative overflow-hidden bg-[#faf7f4] px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#fb866e]/10 blur-3xl" />
          <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#f3c985]/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              {/* Left Column: About & Detailed Explanations */}
              <motion.div {...revealProps} className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#fcd5c7] bg-white px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[.22em] text-[#d77764] shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fb866e]" />
                  About ClinicFlow Platform
                </div>

                <h2 className="text-3xl font-bold tracking-[-.05em] text-[#1e2023] sm:text-4xl lg:text-5xl lg:leading-[1.05]">
                  No disconnected handoffs. Just the <span className="text-[#e87561]">next right step.</span>
                </h2>

                <p className="text-base leading-7 text-[#6d6663] sm:text-lg">
                  ClinicFlow is an enterprise-grade hospital management system engineered to eliminate communication bottlenecks between front-desk registration, doctor consultation, and pharmacy dispensing.
                </p>

                {/* Key Architectural Highlights */}
                <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#eadfd8] pt-6 sm:gap-4">
                  <div className="rounded-2xl border border-[#efe6e0] bg-white p-3.5 shadow-sm">
                    <p className="text-xl font-bold tracking-[-.04em] text-[#e87561]">Real-Time</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#857c78]">Instant role handoffs</p>
                  </div>
                  <div className="rounded-2xl border border-[#efe6e0] bg-white p-3.5 shadow-sm">
                    <p className="text-xl font-bold tracking-[-.04em] text-[#e87561]">Unified</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#857c78]">One patient record</p>
                  </div>
                  <div className="rounded-2xl border border-[#efe6e0] bg-white p-3.5 shadow-sm">
                    <p className="text-xl font-bold tracking-[-.04em] text-[#e87561]">Zero Loss</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#857c78]">Traceable prescription flow</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Senior Designer Interactive Workspace Showcase */}
              <motion.div {...revealProps}>
                <SystemWorkflowShowcase />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modules" className="bg-[#f1ece8] px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps}>
              <SectionTitle
                kicker="Three operating layers"
                title="Every role has a place in the flow."
                text="Purpose-built clinic workspaces that feel like one product, not three separate tools."
              />
            </motion.div>
            <motion.div {...revealProps} variants={groupReveal} className="mt-14 grid gap-5 lg:grid-cols-3">
              {modules.map((module, index) => (
                <ModuleCard key={module.title} module={module} index={index} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Light 3D Care Pathway Section */}
        <section id="workflow" className="relative overflow-hidden bg-[#fbfaf8] px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f4eee9] to-transparent" />
          <div className="relative mx-auto max-w-7xl">
            <motion.div {...revealProps}>
              <SectionTitle
                kicker="The connected patient journey"
                title="A care relay that never loses the thread."
                text="Every clinic role receives the right context at the right moment—from arrival to completion."
              />
            </motion.div>
            <CareRelayBoard />
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="px-5 py-24 sm:px-8 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps}>
              <SectionTitle
                kicker="Why it works"
                title="A better system creates a better rhythm."
                text="Less visual noise for the team. More continuity for the patient."
              />
            </motion.div>
            <motion.div {...revealProps} variants={groupReveal} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(([title, text, Icon]) => (
                <motion.div variants={reveal} key={title as string} className="rounded-[24px] border border-[#ebe5e0] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(38,31,28,.08)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ec] text-[#e76e58]">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-6 text-base font-bold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7c7775]">{text as string}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-5 pb-24 sm:px-8 lg:px-10 lg:pb-36">
          <div className="mx-auto max-w-7xl">
            <motion.div {...revealProps} className="relative overflow-hidden rounded-[34px] bg-[#fb866e] px-7 py-16 text-[#17191b] sm:px-14 lg:px-20">
              <div className="absolute right-[-50px] top-[-90px] h-80 w-80 rounded-full border-[45px] border-[#17191b]/[.08]" />
              <div className="absolute bottom-[-80px] right-[22%] h-52 w-52 rounded-full border-[26px] border-white/10" />
              <div className="relative flex flex-col justify-between gap-10 md:flex-row md:items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#713d37]">Ready for the next step?</p>
                  <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[.95] tracking-[-.065em] sm:text-6xl">
                    Bring the whole clinic into rhythm.
                  </h2>
                </div>
                <a
                  href={loginHref}
                  onClick={handleLoginClick}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#17191b] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#292c2e]"
                >
                  Login to ClinicFlow <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-[#ebe5e0] bg-[#faf7f4] pt-16 pb-10 px-5 sm:px-8 lg:px-10 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#fb866e]/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-[#f3c985]/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          {/* Top Newsletter / Clinic Updates Banner */}
          <div className="mb-16 overflow-hidden rounded-[28px] border border-[#f7d6cd] bg-gradient-to-r from-[#fff5f2] via-[#ffefe9] to-[#fff3ed] p-7 shadow-[0_20px_50px_rgba(251,134,110,0.08)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f8c4b6] bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[.22em] text-[#d76551] shadow-sm">
                  <Sparkles size={12} className="text-[#e76e58]" /> Stay Updated
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-[-.04em] text-[#202124] sm:text-3xl">
                  Stay connected with modern clinic innovations.
                </h3>
                <p className="mt-2 text-sm text-[#736a66] max-w-lg">
                  Subscribe to receive clinic management feature additions, care relay workflow tips, and system update releases.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) {
                    setSubscribed(true);
                    setEmail('');
                    setTimeout(() => setSubscribed(false), 4000);
                  }
                }}
                className="relative flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89d97]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your clinic email address..."
                    className="w-full rounded-full border border-[#ebd5cb] bg-white pl-11 pr-4 py-3 text-sm text-[#202124] placeholder-[#9e938e] outline-none transition focus:border-[#fb866e] focus:ring-2 focus:ring-[#fb866e]/20 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#fb866e] to-[#e76e58] px-6 py-3 text-xs font-bold text-white shadow-[0_6px_20px_rgba(251,134,110,0.3)] transition hover:brightness-105 hover:shadow-[0_8px_25px_rgba(251,134,110,0.4)] active:scale-95"
                >
                  {subscribed ? (
                    <>
                      <CheckCircle2 size={15} /> Subscribed!
                    </>
                  ) : (
                    <>
                      Subscribe <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Main 4-Column Grid */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 pb-12 border-b border-[#e8dfd8]">
            {/* Col 1: Brand & Mission */}
            <div className="lg:col-span-4 space-y-5">
              <Brand dark={false} />
              <p className="text-sm leading-relaxed text-[#6f6865] max-w-sm">
                ClinicFlow is an enterprise clinic management platform connecting reception, doctor consultations, and pharmacy dispensing into one seamless care relay.
              </p>

              {/* Status & Compliance Badges */}
              <div className="space-y-2.5 pt-2">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d8ebe0] bg-[#f0fbf4] px-3.5 py-1.5 text-xs font-semibold text-[#2d774a]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  All Systems Operational • 99.99% Uptime
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#7c7470]">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5dcd5] bg-white px-2.5 py-1">
                    <Shield size={12} className="text-[#fb866e]" /> HIPAA Compliant
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5dcd5] bg-white px-2.5 py-1">
                    <Lock size={12} className="text-[#fb866e]" /> 256-Bit Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* Col 2: Navigation & Platform */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-[.18em] text-[#1e2023]">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                {navItems.map(([label, id]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-[#6d6663] transition hover:text-[#e76e58] hover:translate-x-0.5 inline-block">
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/login" onClick={handleLoginClick} className="font-bold text-[#e76e58] hover:underline inline-block">
                    Portal Login →
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Workspaces & Modules */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-[.18em] text-[#1e2023]">Clinic Workspaces</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#modules" className="group block">
                    <span className="font-bold text-[#2c2725] group-hover:text-[#e76e58] transition">Reception Desk</span>
                    <span className="block text-xs text-[#8c8480]">Patient check-in, registration & queue handling</span>
                  </a>
                </li>
                <li>
                  <a href="#modules" className="group block">
                    <span className="font-bold text-[#2c2725] group-hover:text-[#e76e58] transition">Doctor Consultation</span>
                    <span className="block text-xs text-[#8c8480]">EHR, clinical notes & e-prescription dispatch</span>
                  </a>
                </li>
                <li>
                  <a href="#modules" className="group block">
                    <span className="font-bold text-[#2c2725] group-hover:text-[#e76e58] transition">Pharmacy Dispensing</span>
                    <span className="block text-xs text-[#8c8480]">Stock deduction & medicine fulfillment</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Support & Contact Info */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-[.18em] text-[#1e2023]">Support & Contact</h4>
              <div className="space-y-3 text-sm text-[#6d6663]">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 shrink-0 text-[#e76e58]" />
                  <div>
                    <span className="block font-bold text-[#2c2725]">Operational Support</span>
                    <a href="mailto:support@clinicflow.med" className="text-xs text-[#7c7470] hover:text-[#e76e58]">
                      support@clinicflow.med
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-[#e76e58]" />
                  <div>
                    <span className="block font-bold text-[#2c2725]">Helpdesk Hotline</span>
                    <span className="text-xs text-[#7c7470]">+1 (800) 555-CLINIC (2546)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={16} className="mt-0.5 shrink-0 text-[#e76e58]" />
                  <div>
                    <span className="block font-bold text-[#2c2725]">Clinic Hours</span>
                    <span className="text-xs text-[#7c7470]">Mon – Sat: 8:00 AM – 10:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar / Sub-Footer */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-[#8c8480]">
            <div>
              © {new Date().getFullYear()} ClinicFlow Medical Management System. All rights reserved.
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[#6d6663]">
              <a href="#home" className="hover:text-[#e76e58] transition">Privacy Policy</a>
              <span>·</span>
              <a href="#home" className="hover:text-[#e76e58] transition">Terms of Service</a>
              <span>·</span>
              <a href="#system" className="hover:text-[#e76e58] transition">Security & Compliance</a>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-[#2d774a] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
