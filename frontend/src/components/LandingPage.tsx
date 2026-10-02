import { useEffect, useState, useRef, type MouseEvent } from 'react';
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

  const isNavClickScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 14);

      if (isNavClickScrollingRef.current) return;

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

  const handleNavClick = (e: MouseEvent, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    setActiveSection(id);

    isNavClickScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const target = document.getElementById(id);
    if (target) {
      const headerOffset = 104;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isNavClickScrollingRef.current = false;
    }, 800);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf8] font-sans text-[#202124] selection:bg-[#fb866e] selection:text-[#17181a]">
      {/* Fixed header with rich frosted blur background on scroll */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled
          ? 'border-[#e8dfd8] bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,.07)] backdrop-blur-xl py-2 px-4 sm:px-6 lg:px-8'
          : 'border-transparent bg-transparent pt-4 px-4 sm:px-6 lg:px-8'
          }`}
      >
        <div
          className={`mx-auto max-w-7xl transition-all duration-300 ${scrolled
            ? 'rounded-none border border-transparent bg-transparent shadow-none'
            : 'rounded-[22px] border border-white/70 bg-white/70 shadow-[0_12px_38px_rgba(50,33,26,.07)] backdrop-blur-lg'
            }`}
        >
          <div className="flex h-[64px] items-center justify-between px-3 sm:px-5">
            <Brand dark={false} />

            <nav className="hidden items-center gap-1 rounded-full border border-[#eadfd8]/80 bg-[#fffaf7]/70 p-1 lg:flex">
              {navItems.map(([label, id]) => {
                const isActive = activeSection === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => handleNavClick(e, id)}
                    className={`relative rounded-full px-4 py-2 text-[11px] font-bold transition-colors duration-200 z-10 ${isActive ? 'text-white' : 'text-[#68605c] hover:text-[#e76e58]'
                      }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeNavPill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#fb866e] to-[#e87561] shadow-[0_5px_14px_rgba(232,117,97,.3)]"
                      />
                    )}
                    {label}
                  </a>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-full border border-[#d9eadf] bg-[#f3fbf5] px-3 py-2 text-[10px] font-bold text-[#4e956a] xl:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#62c48a] opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#62c48a]" />
                </span>
                Systems online
              </div>
              <a
                href={loginHref}
                onClick={handleLoginClick}
                className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-[#fb866e] to-[#e87561] px-5 py-2.5 text-xs font-bold text-white shadow-[0_7px_18px_rgba(232,117,97,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(232,117,97,.34)] sm:inline-flex"
              >
                Login workspace <ArrowRight size={13} />
              </a>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0d6ce] bg-white/80 text-[#202124] shadow-sm lg:hidden"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="border-t border-[#eadfd8] px-4 pb-4 pt-3 lg:hidden">
              <nav className="grid gap-1 sm:grid-cols-2">
                {navItems.map(([label, id]) => {
                  const isActive = activeSection === id;
                  return (
                    <a
                      key={id}
                      onClick={(e) => handleNavClick(e, id)}
                      href={`#${id}`}
                      className={`rounded-xl px-3 py-3 text-sm font-bold ${isActive ? 'bg-[#fff0ec] text-[#e76e58]' : 'text-[#202124] hover:bg-[#fff0ec] hover:text-[#e76e58]'}`}
                    >
                      {label}
                    </a>
                  );
                })}
              </nav>
              <a
                href={loginHref}
                onClick={(e) => {
                  setMenuOpen(false);
                  handleLoginClick(e);
                }}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fb866e] to-[#e87561] px-3 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(232,117,97,.22)]"
              >
                Open workspace <ArrowRight size={15} />
              </a>
            </div>
          )}
        </div>
      </header>
      <main>
        {/* Editorial hero / live clinic command center */}
        <section id="home" className="relative mt-0 min-h-[760px] overflow-hidden bg-[#f7f1ec] px-5 pb-16 pt-32 sm:px-8 lg:flex lg:min-h-[100svh] lg:h-[100svh] lg:items-center lg:px-10 lg:pb-10 lg:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(251,134,110,.25),transparent_27%),radial-gradient(circle_at_8%_92%,rgba(244,201,133,.22),transparent_28%),linear-gradient(125deg,#fbf7f3_0%,#f7eee8_52%,#f6e4d8_100%)]" />
          <div className="absolute -right-44 top-28 h-[620px] w-[620px] rounded-full border border-[#e9a18d]/50" />
          <div className="absolute -right-16 top-48 h-[420px] w-[420px] rounded-full border border-dashed border-[#e9a18d]/45" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
            <motion.div
              {...(reduced ? {} : { initial: 'hidden', animate: 'visible', variants: groupReveal })}
              className="relative z-10 max-w-2xl"
            >
              <motion.div variants={reveal} className="mb-7 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#f2c6b7] bg-white/75 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#c76554] shadow-sm backdrop-blur">
                  <Sparkles size={12} /> Clinic OS / 01
                </span>
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#82736d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#62c48a]" /> Built for busy care teams
                </span>
              </motion.div>

              <motion.h1 variants={reveal} className="max-w-xl text-[clamp(2.1rem,4.0vw,4.2rem)] font-semibold leading-[.94] tracking-[-.06em] text-[#202124]">
                The clinic,
                <span className="relative block text-[#e87561]">
                  in sync.
                  <svg className="absolute -bottom-2 left-0 w-32 sm:w-44" viewBox="0 0 240 18" fill="none" aria-hidden="true">
                    <path d="M3 12.5C58 3 148 2 237 8" stroke="#e87561" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p variants={reveal} className="mt-5 max-w-lg text-sm leading-6 text-[#675e5a] sm:text-base">
                ClinicFlow turns every handoff into momentum—connecting reception, consultation, and pharmacy around one clear patient story.
              </motion.p>

              <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href={loginHref}
                  onClick={handleLoginClick}
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#fb866e] to-[#e87561] px-6 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(232,117,97,.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(232,117,97,.38)]"
                >
                  Enter the workspace
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition group-hover:translate-x-0.5"><ArrowRight size={14} /></span>
                </a>
                <a href="#workflow" className="group inline-flex items-center gap-2 text-sm font-bold text-[#5e5856] transition hover:text-[#e76e58]">
                  See how it flows <span className="transition group-hover:translate-x-1"><ChevronRight size={16} /></span>
                </a>
              </motion.div>

              <motion.div variants={reveal} className="mt-6 flex max-w-lg items-center gap-5 border-t border-[#e6d3ca] pt-5">
                <div className="flex -space-x-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7eee8] bg-[#f4c9ba] text-[9px] font-bold text-[#744a42]">R</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7eee8] bg-[#f2d48e] text-[9px] font-bold text-[#765a24]">D</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7eee8] bg-[#d99ca1] text-[9px] font-bold text-[#70424a]">P</span>
                </div>
                <p className="text-[11px] font-semibold leading-4 text-[#80736d]">One connected team<br /><span className="text-[#292729]">three focused workspaces</span></p>
                <span className="ml-auto hidden text-[10px] font-bold uppercase tracking-[.16em] text-[#9a8880] sm:block">Scroll to explore ↓</span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 28, scale: .96 }}
              animate={reduced ? {} : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: .9, delay: .15, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
            >
              <div className="relative aspect-[.92] overflow-visible lg:aspect-auto lg:h-[min(68svh,590px)]">
                <div className="absolute inset-[8%] rounded-[42%] bg-[#f7c7b5]/45 blur-3xl" />
                <div className="absolute inset-x-[9%] bottom-[3%] h-[48%] rounded-[50%] bg-[#bd8070]/20 blur-2xl" />
                <div className="absolute inset-[7%] rotate-[-5deg] rounded-[38px] border border-white/80 bg-white/35 shadow-[0_30px_80px_rgba(113,69,52,.14)] backdrop-blur-sm" />
                <div className="absolute inset-[11%] overflow-hidden rounded-[32px] border-[7px] border-white bg-[#eee0d9] shadow-[0_25px_70px_rgba(113,69,52,.2)]">
                  <img src="/female_doctor_hero.jpg" alt="Professional female physician in a modern clinic" className="h-full w-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/40 via-transparent to-[#fb866e]/10" />
                </div>

                <motion.div animate={reduced ? {} : { y: [0, -7, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-1 top-[12%] z-20 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_18px_35px_rgba(65,39,31,.14)] backdrop-blur-xl sm:-right-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0ec] text-[#e76e58]"><Stethoscope size={18} /></span>
                  <div><p className="text-xs font-bold text-[#202124]">Dr. Sarah K.</p><p className="mt-0.5 text-[10px] font-semibold text-[#867e7a]">Consultation room 04</p></div>
                  <span className="h-2 w-2 rounded-full bg-[#62c48a]" />
                </motion.div>

                <motion.div animate={reduced ? {} : { y: [0, 6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-2 left-0 z-20 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_18px_40px_rgba(32,33,36,.1)] backdrop-blur-xl sm:-left-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f8e9] text-[#6d9e55]"><CheckCircle2 size={18} /></span>
                  <div><p className="text-xs font-bold text-[#202124]">Context passed forward</p><p className="mt-0.5 text-[10px] font-semibold text-[#867e7a]">Reception → Doctor → Pharmacy</p></div>
                </motion.div>
              </div>
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
