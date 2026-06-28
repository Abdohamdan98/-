import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  Clipboard, 
  FileText, 
  Home, 
  Loader2, 
  BookOpen, 
  Clock, 
  Phone, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Users, 
  AlertCircle, 
  Heart,
  MessageCircle, 
  Star,
  Printer,
  Sparkles,
  Check,
  X,
  Stethoscope,
  ChevronLeft
} from "lucide-react";



import { ChildCase, Appointment, TreatmentPlan, LibraryExercise } from "./types";
import { libraryExercises } from "./data/exercises";
import logo from "./assets/images/logo_1782674060653.jpg";

export default function App() {


  // Navigation & View State
  const [activeTab, setActiveTab] = useState<"home" | "assessment" | "library" | "booking" | "cases">("home");
  const [cases, setCases] = useState<ChildCase[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Loading & Action States
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [isLoadingAppts, setIsLoadingAppts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);
  const [activePlanChildName, setActivePlanChildName] = useState("");
  const [activePlanCaseType, setActivePlanCaseType] = useState("");
  const [activePlanAge, setActivePlanAge] = useState<number>(0);
  
  // Library filters
  const [libraryQuery, setLibraryQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "speech" | "behavior" | "special_ed">("all");
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Notifications State
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states - Case Assessment
  const [caseForm, setCaseForm] = useState({
    name: "",
    age: "",
    caseType: "speech_delay",
    commLevel: "medium",
    behaviorNotes: "",
    selectedSymptoms: [] as string[]
  });

  // Form states - Booking
  const [bookingForm, setBookingForm] = useState({
    parentName: "",
    childName: "",
    phone: "",
    date: "",
    timeSlot: "الصباح (9:00 - 12:00)",
    caseType: "speech_delay"
  });

  // Fetch initial data
  useEffect(() => {
    fetchCases();
    fetchAppointments();
  }, []);

  const triggerNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchCases = async () => {
    setIsLoadingCases(true);
    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      } else {
        console.error("Failed to fetch cases");
      }
    } catch (err) {
      console.error("Error fetching cases", err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoadingAppts(true);
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        console.error("Failed to fetch appointments");
      }
    } catch (err) {
      console.error("Error fetching appointments", err);
    } finally {
      setIsLoadingAppts(false);
    }
  };

  // Symptoms Checkbox Toggle
  const toggleSymptom = (symptomId: string) => {
    setCaseForm(prev => {
      const selected = [...prev.selectedSymptoms];
      if (selected.includes(symptomId)) {
        return { ...prev, selectedSymptoms: selected.filter(s => s !== symptomId) };
      } else {
        return { ...prev, selectedSymptoms: [...selected, symptomId] };
      }
    });
  };

  // Generate treatment plan
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseForm.name || !caseForm.age) {
      triggerNotification("يرجى إدخال اسم الطفل وعمره لبدء التحليل", "error");
      return;
    }

    setIsGenerating(true);
    setProgressStep("جاري فحص البيانات السريرية وتحليل الأعراض المكتوبة...");
    
    // Simulate smart medical step transitions for UX delight
    setTimeout(() => {
      setProgressStep("جاري إرسال البيانات واستشارة نموذج الذكاء الاصطناعي الطبي...");
    }, 1200);

    setTimeout(() => {
      setProgressStep("جاري صياغة الأهداف السلوكية وخطط التدريب الفردية للمخارج...");
    }, 2800);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: caseForm.name,
          childAge: Number(caseForm.age),
          caseType: caseForm.caseType,
          commLevel: caseForm.commLevel,
          behaviorNotes: caseForm.behaviorNotes,
          selectedSymptoms: caseForm.selectedSymptoms
        })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.plan) {
          // Set plan to view
          setActivePlan(result.plan);
          setActivePlanChildName(caseForm.name);
          setActivePlanCaseType(caseForm.caseType);
          setActivePlanAge(Number(caseForm.age));

          // Save the case automatically into database with its plan
          await fetch("/api/cases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: caseForm.name,
              age: Number(caseForm.age),
              caseType: caseForm.caseType,
              commLevel: caseForm.commLevel,
              behaviorNotes: caseForm.behaviorNotes,
              selectedSymptoms: caseForm.selectedSymptoms,
              plan: result.plan
            })
          });

          // Refresh case list
          fetchCases();
          triggerNotification("تم توليد الخطة العلاجية الذكية وحفظ ملف الطفل بنجاح!");
        } else {
          throw new Error("تنسيق الخطة المسترجعة غير صالح");
        }
      } else {
        throw new Error("فشل توليد الخطة من الخادم");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("حدث خطأ أثناء الاتصال بالخادم وتوليد الخطة. يرجى المحاولة لاحقاً.", "error");
    } finally {
      setIsGenerating(false);
      setProgressStep("");
    }
  };

  // Submit appointment booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.parentName || !bookingForm.childName || !bookingForm.phone || !bookingForm.date) {
      triggerNotification("يرجى ملء جميع الحقول المطلوبة لحجز موعد", "error");
      return;
    }

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingForm)
      });

      if (res.ok) {
        triggerNotification("تم إرسال طلب الحجز بنجاح! سيقوم الأخصائي بمراجعته.");
        
        // WhatsApp notification
        const message = `طلب حجز موعد جديد:
        ولي الأمر: ${bookingForm.parentName}
        اسم الطفل: ${bookingForm.childName}
        التاريخ: ${bookingForm.date}
        الوقت: ${bookingForm.timeSlot}`;
        window.open(`https://wa.me/201125663891?text=${encodeURIComponent(message)}`, "_blank");

        setBookingForm({
          parentName: "",
          childName: "",
          phone: "",
          date: "",
          timeSlot: "الصباح (9:00 - 12:00)",
          caseType: "speech_delay"
        });
        fetchAppointments();
        setActiveTab("home"); // Redirect to home to see changes
      } else {
        triggerNotification("حدث خطأ أثناء تسجيل طلب الحجز", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("عذراً، فشل الاتصال بالخادم لحجز موعد", "error");
    }
  };

  // Confirm pending appointment
  const handleConfirmAppt = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/confirm`, {
        method: "PATCH"
      });
      if (res.ok) {
        triggerNotification("تم تأكيد موعد الجلسة وإبلاغ ولي الأمر بنجاح!");
        fetchAppointments();
      } else {
        triggerNotification("فشل تحديث حالة الحجز", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel/Delete appointment
  const handleDeleteAppt = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء وحذف هذا الحجز؟")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerNotification("تم إلغاء وحذف الحجز بنجاح.");
        fetchAppointments();
      } else {
        triggerNotification("فشل إلغاء الحجز", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Child Case
  const handleDeleteCase = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف ملف الطفل (${name}) نهائياً؟`)) return;
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerNotification(`تم حذف ملف الطفل ${name} وجميع تقاريره بنجاح.`);
        // If we deleted the currently active plan case, clear active plan
        if (activePlanChildName === name) {
          setActivePlan(null);
        }
        fetchCases();
      } else {
        triggerNotification("عذراً، فشل حذف ملف الحالة", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select a case to view its generated plan
  const handleViewPlan = (c: ChildCase) => {
    if (c.plan) {
      setActivePlan(c.plan);
      setActivePlanChildName(c.name);
      setActivePlanCaseType(c.caseType);
      setActivePlanAge(c.age);
      setActiveTab("assessment"); // Switch to view report inside assessment
      // Scroll to view result
      setTimeout(() => {
        document.getElementById("report-area")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      // Setup form with child info to generate new
      setCaseForm({
        name: c.name,
        age: c.age.toString(),
        caseType: c.caseType,
        commLevel: c.commLevel,
        behaviorNotes: c.behaviorNotes,
        selectedSymptoms: c.selectedSymptoms
      });
      setActivePlan(null);
      setActiveTab("assessment");
      triggerNotification("هذا الطفل لا يملك خطة توليدية بعد. يمكنك الضغط على 'تحليل البيانات' لتوليدها الآن.");
    }
  };

  // Format Helper for dates
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Filter exercises
  const filteredExercises = libraryExercises.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(libraryQuery.toLowerCase()) || 
                          ex.objective.toLowerCase().includes(libraryQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Case translations
  const caseLabels: Record<string, string> = {
    speech_delay: "تأخر لغوي",
    autism: "طيف توحد",
    adhd: "فرط حركة وتشتت انتباه",
    learning_disabilities: "صعوبات تعلم"
  };

  const commLevelLabels: Record<string, string> = {
    low: "منخفض (غير لفظي)",
    medium: "متوسط (كلمات مفردة)",
    high: "جيد (جمل بسيطة)"
  };

  // Browser print handling for high-quality official Arabic reports
  const handlePrint = () => {
    window.print();
  };




  return (
    <div className="min-h-screen bg-slate-200 p-2 md:p-6" dir="rtl" id="main-container">
      <div className="bg-white min-h-[calc(100vh-16px)] md:min-h-[calc(100vh-48px)] rounded-3xl shadow-2xl border border-slate-300 overflow-hidden">
      {/* Navigation Top Header */}
      <header className="mb-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden max-w-7xl w-full mx-auto mt-4 sticky top-4 z-40" id="app-header">
        <div className="flex items-center justify-between w-full mb-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="الاخصائي عبدالرحمن" className="w-12 h-12 object-contain rounded-xl border border-slate-100 p-0.5" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">الاخصائي عبدالرحمن</h1>
              <p className="text-[11px] text-sky-700 font-semibold mt-0.5">منصة أخصائيي التخاطب الذكية</p>
            </div>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold text-slate-900">د. عبدالرحمن حمدان</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sky-700 font-bold text-xs shadow-sm">
              ع
            </div>
          </div>
        </div>

        {/* Interactive Navigation Menu */}
        <nav className="flex flex-wrap gap-1 text-[13px] font-semibold w-full border-t border-slate-100 pt-3">
          {[
            { id: "home", label: "الرئيسية", icon: Home },
            { id: "assessment", label: "التقييم الذكي", icon: Brain },
            { id: "cases", label: "سجلات الأطفال", icon: Users },
            { id: "library", label: "المكتبة التدريبية", icon: BookOpen },
            { id: "booking", label: "حجز موعد", icon: Calendar },
            { id: "contact", label: "تواصل معنا", icon: MessageCircle, url: "https://wa.me/201125663891" },
          ].map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                if (item.url) {
                  window.open(item.url, "_blank");
                } else {
                  setActiveTab(item.id as any); setActivePlan(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === item.id 
                  ? "bg-slate-900 text-white" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </nav>
      </header>


      {/* Floating Notifications */}
      {notification && (
        <div className="fixed top-6 left-6 right-6 md:left-auto md:w-96 z-50 animate-bounce print:hidden" id="notification-toast">
          <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
            notification.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
              : "bg-rose-50 border-rose-200 text-rose-950"
          }`}>
            <div className="mt-0.5">
              {notification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-relaxed">{notification.text}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:px-0" id="main-content">
        
        {/* ==================== HOME TAB ==================== */}
        {activeTab === "home" && (
          <div className="grid grid-cols-12 gap-6 animate-fade-in" id="home-view">
            {/* Welcome Message */}
            <div className="col-span-12 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">أهلاً بك 👋</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">سعداء برؤيتك مجدداً. اليوم هو فرصة جديدة لإحداث فارق في حياة الأطفال.</p>
              </div>
              <div className="hidden sm:block">
                <span className="text-4xl">🌟</span>
              </div>
            </div>

            {/* Hero banner section */}
            <div className="col-span-12 lg:col-span-8 relative overflow-hidden bg-gradient-to-br from-sky-700 via-sky-600 to-indigo-700 rounded-3xl text-white p-6 md:p-8 shadow-sm border border-slate-200/50 flex flex-col justify-between min-h-[220px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-sky-500/25 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-bold text-sky-100">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" />
                  مدعوم بتقنيات الذكاء الاصطناعي الذكي
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                  شريكك الإكلينيكي في علاج التخاطب وصعوبات التواصل
                </h1>
                <p className="text-slate-100 text-xs md:text-sm max-w-xl font-medium leading-relaxed opacity-90">
                  الاخصائي عبدالرحمن يُمكّن المعالجين، معلمي التربية الخاصة، وأولياء الأمور من إجراء تشخيص مبدئي فوري دقيق، وتوليد خطط رعاية فردية مخصصة بكل يسر وسهولة.
                </p>
              </div>
              <div className="pt-4 flex flex-wrap gap-3 relative z-10">
                <button 
                  onClick={() => setActiveTab("assessment")}
                  className="bg-white text-sky-700 font-extrabold px-5 py-2.5 rounded-xl shadow-md hover:bg-slate-50 active:scale-95 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  ابدأ تقييماً ذكياً الآن
                </button>
                <button 
                  onClick={() => setActiveTab("booking")}
                  className="bg-sky-500/20 hover:bg-sky-500/35 border border-sky-300/40 text-white font-extrabold px-5 py-2.5 rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  حجز موعد جلسة جديدة
                </button>
              </div>
            </div>

            {/* Smart stats dashboard Bento Box */}
            <section className="col-span-12 lg:col-span-4 bg-sky-900 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm border border-sky-950">
              <div className="relative z-10">
                <h3 className="text-sm font-bold opacity-80 mb-4">إحصائيات الشهر والمنصة</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-[10px] opacity-60 font-bold">الحالات المسجلة</p>
                    <span className="text-2xl font-extrabold">{cases.length}</span>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 font-bold">المواعيد المؤكدة</p>
                    <span className="text-2xl font-extrabold">{appointments.filter(a => a.status === "confirmed").length}</span>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 font-bold">موعد قيد المراجعة</p>
                    <span className="text-2xl font-extrabold">{appointments.filter(a => a.status === "pending").length}</span>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 font-bold">التمارين والأنشطة</p>
                    <span className="text-2xl font-extrabold">{libraryExercises.length}</span>
                  </div>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 mb-2">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.max(15, Math.min(100, (cases.length / 10) * 100))}%` }}></div>
                </div>
                <p className="text-[9px] opacity-60">تحديث تلقائي مستمر ونشط</p>
              </div>
              {/* Decorative shape */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            </section>

            {/* Recent Cases list Bento Card */}
            <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold mb-1.5 inline-block italic">حالات قيد التقييم</span>
                    <h2 className="text-lg font-extrabold text-slate-900">سجلات الأطفال والتقارير المكتملة</h2>
                    <p className="text-xs text-slate-400 font-bold">أحدث الحالات التي تم تحليلها وتوليد خطط رعاية ذكية لها</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("cases")}
                    className="text-sky-600 hover:text-sky-800 text-xs font-bold flex items-center gap-1"
                  >
                    عرض الكل
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>

                {isLoadingCases ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-sky-600 animate-spin mb-2" />
                    <p className="text-xs text-slate-500 font-bold">جاري تحميل سجل الحالات...</p>
                  </div>
                ) : cases.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Clipboard className="h-10 w-10 text-slate-300 mb-2" />
                    <h4 className="font-bold text-slate-800 text-sm">لا توجد حالات مسجلة بعد</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 font-bold">ابدأ بملء استبيان التقييم الذكي وسوف تظهر هنا الحالات فور إدخالها.</p>
                    <button 
                      onClick={() => setActiveTab("assessment")}
                      className="mt-4 bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                    >
                      توليد أول خطة الآن
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 3).map((c) => (
                      <div key={c.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="bg-sky-100 text-sky-700 font-extrabold rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                              <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {caseLabels[c.caseType] || c.caseType}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold mt-1">
                              العمر: {c.age} سنوات • مستوى التواصل: {commLevelLabels[c.commLevel] || c.commLevel}
                            </p>
                            {c.plan && (
                              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                الخطة العلاجية جاهزة ومحفوظة
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {c.plan ? (
                            <button
                              onClick={() => handleViewPlan(c)}
                              className="bg-white hover:bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              عرض الخطة
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewPlan(c)}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              توليد الخطة
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCase(c.id, c.name)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="حذف الحالة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cases.length > 0 && (
                <div className="mt-4 flex items-center gap-4 bg-sky-50 p-3 rounded-2xl border border-sky-100">
                  <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                  <p className="text-xs text-sky-900 font-bold"><b>الهدف القادم للأخصائي:</b> التوجيه المكثف للأهل والعمل على تمارين الوعي الصوتي اليومية لتسريع استجابة الأطفال.</p>
                </div>
              )}
            </div>

            {/* Upcoming Appointments (Schedule) Bento Card */}
            <section className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-extrabold text-slate-900">جدول الجلسات اليوم</h3>
                  <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">المواعيد القادمة</span>
                </div>

                {isLoadingAppts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-sky-600 animate-spin" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-bold">لا توجد مواعيد مضافة اليوم</p>
                    <button 
                      onClick={() => setActiveTab("booking")}
                      className="mt-3 text-sky-600 font-bold text-xs cursor-pointer"
                    >
                      إضافة حجز جديد
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {appointments.slice(0, 3).map((a, index) => {
                      // Determine accent borders like the design HTML schedule: border-orange-400, border-sky-400, border-emerald-400, border-slate-300
                      const colors = ["border-orange-400", "border-sky-400", "border-emerald-400"];
                      const borderColor = colors[index % colors.length];
                      return (
                        <div 
                          key={a.id} 
                          className={`flex items-center justify-between p-3 rounded-2xl bg-slate-50 border-r-4 ${borderColor} border-l border-t border-b border-slate-200/50 transition-all`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-700">{a.timeSlot.includes("الصباح") ? "09:30" : "04:30"}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{a.timeSlot.includes("الصباح") ? "ص" : "م"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">{a.childName}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{caseLabels[a.caseType] || a.caseType}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {a.status === "pending" && (
                              <button
                                onClick={() => handleConfirmAppt(a.id)}
                                className="bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg transition-all cursor-pointer"
                              >
                                تأكيد
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppt(a.id)}
                              className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="حذف الحجز"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setActiveTab("booking")} 
                className="w-full mt-4 text-xs text-slate-400 hover:text-sky-600 transition-colors py-2 font-bold text-center border-t border-slate-100"
              >
                حجز وإضافة موعد جديد للجدول ←
              </button>
            </section>

            {/* Therapy Resources Bento Section */}
            <section className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-between shadow-sm min-h-[220px]">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">المكتبة التدريبية وعلاج التخاطب</h3>
                <p className="text-xs text-slate-400 font-bold mb-4">تصفح واطبع بطاقات التمارين اليومية لتمكين الأهل من ممارسة جلسات منزلية فعالة</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div onClick={() => { setSelectedCategory("speech"); setActiveTab("library"); }} className="bg-orange-50 hover:bg-orange-100/70 cursor-pointer rounded-2xl p-4 border border-orange-100 flex flex-col justify-between transition-all duration-300 min-h-[110px]">
                  <div className="text-xl">🧩</div>
                  <div>
                    <p className="text-xs font-extrabold text-orange-950">أدوات الذكاء</p>
                    <p className="text-[9px] text-orange-700 opacity-80 font-bold">12 ملف تدريبي</p>
                  </div>
                </div>
                <div onClick={() => { setSelectedCategory("speech"); setActiveTab("library"); }} className="bg-emerald-50 hover:bg-emerald-100/70 cursor-pointer rounded-2xl p-4 border border-emerald-100 flex flex-col justify-between transition-all duration-300 min-h-[110px]">
                  <div className="text-xl">👄</div>
                  <div>
                    <p className="text-xs font-extrabold text-emerald-950">تمارين النطق</p>
                    <p className="text-[9px] text-emerald-700 opacity-80 font-bold">25 فيديو تعليمي</p>
                  </div>
                </div>
                <div onClick={() => { setSelectedCategory("special_ed"); setActiveTab("library"); }} className="bg-sky-50 hover:bg-sky-100/70 cursor-pointer rounded-2xl p-4 border border-sky-100 flex flex-col justify-between transition-all duration-300 min-h-[110px]">
                  <div className="text-xl">📚</div>
                  <div>
                    <p className="text-xs font-extrabold text-sky-950">قصص اجتماعية</p>
                    <p className="text-[9px] text-sky-700 opacity-80 font-bold">08 عرضاً تفاعلياً</p>
                  </div>
                </div>
                <div onClick={() => { setSelectedCategory("behavior"); setActiveTab("library"); }} className="bg-purple-50 hover:bg-purple-100/70 cursor-pointer rounded-2xl p-4 border border-purple-100 flex flex-col justify-between transition-all duration-300 min-h-[110px]">
                  <div className="text-xl">✍️</div>
                  <div>
                    <p className="text-xs font-extrabold text-purple-950">تعديل السلوك</p>
                    <p className="text-[9px] text-purple-700 opacity-80 font-bold">05 استمارات متابعة</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Assessment Tool Shortcut (مولد الخطط الذكي) */}
            <section 
              onClick={() => setActiveTab("assessment")} 
              className="col-span-12 lg:col-span-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl p-6 flex flex-col justify-between border border-emerald-700 shadow-sm transition-all duration-300 cursor-pointer min-h-[220px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">✨</div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">مولد الخطط الذكي</h4>
                  <p className="text-[10px] text-emerald-100 font-bold mt-0.5">إنشاء خطة علاجية فردية فورية</p>
                </div>
              </div>
              <p className="text-xs text-emerald-50/90 font-medium leading-relaxed">
                استخدم الذكاء الاصطناعي الإكلينيكي لتحليل الأعراض وصياغة الأهداف العلاجية المناسبة للطفل ومشاركتها مع ولي أمره بضغطة زر واحدة.
              </p>
              <div className="flex justify-between items-center border-t border-emerald-500/30 pt-3 mt-3">
                <span className="text-[10px] text-emerald-100 font-bold">انقر لفتح أداة التحليل</span>
                <button className="bg-white text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer">+</button>
              </div>
            </section>
          </div>
        )}

        {/* ==================== ASSESSMENT TAB ==================== */}
        {activeTab === "assessment" && (
          <div className="space-y-8 animate-fade-in" id="assessment-view">
            
            {/* Header info */}
            <div className="text-center max-w-2xl mx-auto print:hidden">
              <span className="text-sky-600 text-xs font-extrabold tracking-wide uppercase">نظام التحليل السريري المتقدم</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">نموذج تقييم حالة الطفل الذكي</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 font-bold">
                أدخل خصائص الطفل والأعراض اللغوية بدقة، وسيقوم محرك الذكاء الاصطناعي ببناء خطة علاج فردية شاملة تحتوي على الأهداف والتمارين المنزلية المخصصة.
              </p>
            </div>

            {/* Intelligent Wizard / Form & Result Panel */}
            <div className="grid lg:grid-cols-5 gap-8 items-start">
              
              {/* Left Column: Form (Takes 2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs p-6 print:hidden">
                <h2 className="text-base font-extrabold text-slate-900 mb-5 pb-2 border-b border-slate-100">
                  بيانات تقييم الحالة الجديدة
                </h2>

                <form onSubmit={handleGeneratePlan} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الطفل الثنائي</label>
                    <input 
                      type="text" 
                      required
                      value={caseForm.name}
                      onChange={(e) => setCaseForm({ ...caseForm, name: e.target.value })}
                      placeholder="مثال: يوسف أحمد"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition-all bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">العمر (بالسنوات)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        max="18"
                        value={caseForm.age}
                        onChange={(e) => setCaseForm({ ...caseForm, age: e.target.value })}
                        placeholder="مثال: 5"
                        className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition-all bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">مستوى التواصل الحالي</label>
                      <select 
                        value={caseForm.commLevel}
                        onChange={(e) => setCaseForm({ ...caseForm, commLevel: e.target.value })}
                        className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition-all bg-slate-50/50"
                      >
                        <option value="low">منخفض (غير لفظي)</option>
                        <option value="medium">متوسط (كلمات مفردة)</option>
                        <option value="high">جيد (جمل بسيطة)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">التشخيص الرئيسي</label>
                    <select 
                      value={caseForm.caseType}
                      onChange={(e) => setCaseForm({ ...caseForm, caseType: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition-all bg-slate-50/50"
                    >
                      <option value="speech_delay">تأخر لغوي ونمائي</option>
                      <option value="autism">طيف التوحد (تواصل وتفاعل)</option>
                      <option value="adhd">فرط الحركة وتشتت الانتباه</option>
                      <option value="learning_disabilities">صعوبات التعلم والأصوات</option>
                    </select>
                  </div>

                  {/* Smart Symptoms Checkbox Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">الصعوبات والأعراض الملاحظة (اختر ما تنطبق)</label>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/60 cursor-pointer text-xs font-bold select-none transition-all">
                        <input 
                          type="checkbox" 
                          checked={caseForm.selectedSymptoms.includes("articulation")}
                          onChange={() => toggleSymptom("articulation")}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                        />
                        <span>النطق ومخارج بعض الحروف (مثال: الثأثأة، اللثغة)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/60 cursor-pointer text-xs font-bold select-none transition-all">
                        <input 
                          type="checkbox" 
                          checked={caseForm.selectedSymptoms.includes("attention")}
                          onChange={() => toggleSymptom("attention")}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                        />
                        <span>ضعف الانتباه والتشتت البصري والسمعي</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/60 cursor-pointer text-xs font-bold select-none transition-all">
                        <input 
                          type="checkbox" 
                          checked={caseForm.selectedSymptoms.includes("receptive")}
                          onChange={() => toggleSymptom("receptive")}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                        />
                        <span>صعوبة فهم واتباع التوجيهات اليومية (لغة استقبالية)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/60 cursor-pointer text-xs font-bold select-none transition-all">
                        <input 
                          type="checkbox" 
                          checked={caseForm.selectedSymptoms.includes("social")}
                          onChange={() => toggleSymptom("social")}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                        />
                        <span>ضعف التفاعل الاجتماعي واللعب التعاوني مع الأقران</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات سلوكية إضافية للطفل</label>
                    <textarea 
                      rows={3}
                      value={caseForm.behaviorNotes}
                      onChange={(e) => setCaseForm({ ...caseForm, behaviorNotes: e.target.value })}
                      placeholder="اكتب أي سلوك متكرر أو بيئة تواصلية أو تعليقات تحفيزية للطفل لمساعدتنا في تخصيص الخطة..."
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition-all bg-slate-50/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white py-3 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        توليد وتجذير الخطة...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        تحليل البيانات وتوليد الخطة بالكامل
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Loading or Result Report (Takes 3 cols) */}
              <div className="lg:col-span-3 min-h-[400px] flex flex-col">
                
                {/* 1. Loading State */}
                {isGenerating && (
                  <div className="bg-white rounded-3xl border border-sky-100 shadow-md p-10 flex flex-col items-center justify-center flex-1 text-center py-20 animate-pulse">
                    <div className="bg-sky-50 p-6 rounded-full text-sky-600 mb-6 relative">
                      <Brain className="h-12 w-12 text-sky-600 animate-bounce" />
                      <div className="absolute top-0 right-0 h-4 w-4 bg-sky-500 rounded-full animate-ping" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">جاري تصميم تقرير التخاطب الذكي</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md font-bold text-sky-700 mt-2 bg-sky-50 px-4 py-2 rounded-xl">
                      {progressStep}
                    </p>
                    <div className="mt-8 flex justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                {/* 2. Empty State */}
                {!isGenerating && !activePlan && (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs p-10 flex flex-col items-center justify-center flex-1 text-center py-24 print:hidden">
                    <Clipboard className="h-16 w-16 text-slate-200 mb-4" />
                    <h3 className="text-lg font-extrabold text-slate-800">التقرير والخطة العلاجية</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1 font-bold">
                      عندما تقوم بتسجيل طفل جديد وتوليد الخطة، ستظهر النتائج والتقرير السريري الشامل هنا مع خيار الحفظ والطباعة المباشرة للأهل.
                    </p>
                    <div className="mt-6 p-4 bg-sky-50 rounded-2xl max-w-md border border-sky-100 text-right">
                      <h4 className="text-xs font-extrabold text-sky-900 flex items-center gap-1 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        مزايا الخطة الذكية المولدة:
                      </h4>
                      <ul className="text-[11px] text-slate-600 font-bold space-y-1">
                        <li>• تحليل إكلينيكي مفصل باللغة العربية الفصحى</li>
                        <li>• أهداف SMART قصيرة المدى قابلة للقياس والتقييم</li>
                        <li>• استراتيجيات تواصلية موجهة للمنزل والعيادة</li>
                        <li>• ألعاب وأنشطة عملية لتصحيح النطق وبناء السلوك</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3. Result Clinical Report (Highly Styled and Printable) */}
                {!isGenerating && activePlan && (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 sm:p-8 flex-1 space-y-8" id="report-area">
                    
                    {/* Header Action menu */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          تقرير مخصص ذكي جاهز
                        </span>
                      </div>
                      <button
                        onClick={handlePrint}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="h-4 w-4" />
                        طباعة التقرير / حفظ PDF
                      </button>
                    </div>

                    {/* Official Report Template Content */}
                    <div className="space-y-6 print:block" id="clinical-report-content">
                      
                      {/* Official Hospital/Clinic Header for printing */}
                      <div className="border-b-4 border-sky-600 pb-5 flex justify-between items-center">
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-slate-900 block">عيادة الاخصائي عبدالرحمن للتأهيل</span>
                          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">قسم التخاطب وصعوبات التواصل</span>
                          <span className="text-[10px] text-slate-500 font-bold block">هاتف: 0501234567 • الرياض، المملكة العربية السعودية</span>
                        </div>
                        <div className="flex items-center gap-2 text-left">
                          <div className="bg-sky-600 p-2 rounded-xl text-white">
                            <Brain className="h-6 w-6" />
                          </div>
                          <span className="text-sm font-extrabold text-slate-900 block">الاخصائي عبدالرحمن</span>
                        </div>
                      </div>

                      {/* Patient metadata card */}
                      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold">اسم الطفل المريض:</span>
                          <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{activePlanChildName}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold">عمر الطفل:</span>
                          <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{activePlanAge} سنوات</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold">نوع التشخيص:</span>
                          <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{caseLabels[activePlanCaseType] || activePlanCaseType}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-extrabold">تاريخ الإصدار:</span>
                          <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{formatDate(new Date().toISOString())}</span>
                        </div>
                      </div>

                      {/* Diagnosis Block */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-extrabold text-sky-800 flex items-center gap-1.5 border-r-4 border-sky-600 pr-2">
                          أولاً: التشخيص والتحليل المبدئي للحالة
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold bg-sky-50/20 p-3 rounded-xl border border-sky-100/50">
                          {activePlan.diagnosis}
                        </p>
                      </div>

                      {/* Goals Split Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="text-sm font-extrabold text-sky-800 flex items-center gap-1.5 border-r-4 border-sky-600 pr-2">
                            ثانياً: الأهداف العلاجية قصيرة المدى (SMART)
                          </h3>
                          <ul className="space-y-2">
                            {activePlan.shortTermGoals.map((g: string, idx: number) => (
                              <li key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2 font-semibold">
                                <span className="bg-sky-100 text-sky-800 font-bold text-[10px] rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                                  {idx + 1}
                                </span>
                                <span>{g}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-sm font-extrabold text-sky-800 flex items-center gap-1.5 border-r-4 border-sky-600 pr-2">
                            ثالثاً: الأهداف طويلة المدى للتنمية اللغوية
                          </h3>
                          <ul className="space-y-2">
                            {activePlan.longTermGoals.map((g: string, idx: number) => (
                              <li key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2 font-semibold">
                                <span className="bg-indigo-50 text-indigo-800 font-bold text-[10px] rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                                  أ-{idx + 1}
                                </span>
                                <span>{g}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Recommended Practical Activities Block */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-extrabold text-sky-800 flex items-center gap-1.5 border-r-4 border-sky-600 pr-2">
                          رابعاً: التمارين والأنشطة اللغوية الموصى بها للأهل في المنزل
                        </h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {activePlan.recommendedActivities.map((act: string, idx: number) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100/80 p-3.5 rounded-2xl text-xs text-slate-700 font-bold shadow-xs relative">
                              <Star className="absolute top-3 left-3 h-4 w-4 text-amber-500 fill-amber-400" />
                              <div className="text-sky-700 font-extrabold text-[10px] uppercase mb-1">النشاط التدريبي {idx + 1}</div>
                              <p className="leading-relaxed mt-1 text-slate-600">{act}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Home Strategies Split Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-extrabold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            استراتيجيات بناء الفهم واللغة الاستقبالية:
                          </h4>
                          <ul className="text-xs text-slate-600 space-y-1.5 pr-2 font-semibold">
                            {activePlan.receptiveStrategies.map((strat: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-indigo-600 font-bold shrink-0">•</span>
                                <span>{strat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-extrabold text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-600" />
                            طرق واستراتيجيات تشجيع التعبير اللفظي:
                          </h4>
                          <ul className="text-xs text-slate-600 space-y-1.5 pr-2 font-semibold">
                            {activePlan.expressiveStrategies.map((strat: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-teal-600 font-bold shrink-0">•</span>
                                <span>{strat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Behaviour Guidance and Schedule */}
                      <div className="grid md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-3 bg-amber-50/20 p-4 rounded-2xl border border-amber-100">
                          <h4 className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                            <Heart className="h-4 w-4 text-amber-600 fill-amber-500" />
                            إرشادات وتوجيهات تعديل السلوك الملازم:
                          </h4>
                          <ul className="text-xs text-slate-600 space-y-1.5 pr-1 font-semibold">
                            {activePlan.behavioralTips.map((tip: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 shrink-0">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-center text-center space-y-2">
                          <span className="text-slate-400 font-bold text-[10px] block uppercase">توصية الأخصائي بخصوص الجلسات</span>
                          <span className="text-base font-extrabold text-slate-900 block leading-relaxed px-2">
                            {activePlan.suggestedSessionFrequency}
                          </span>
                          <p className="text-[10px] text-slate-500 font-bold">يرجى متابعة التمارين المنزلية يومياً للحفاظ على وتيرة التقدم والنجاح.</p>
                        </div>
                      </div>

                      {/* Doctor Official Seal Stamp */}
                      <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-bold block">أخصائي التخاطب المشرف</span>
                          <span className="text-sm font-extrabold text-slate-900 block mt-1">د. عبدالرحمن حمدان</span>
                          <span className="text-[10px] text-slate-400 font-bold block">ترخيص رقم: MH-382901</span>
                        </div>
                        <div className="w-24 h-24 border-4 border-sky-600/30 rounded-full flex flex-col items-center justify-center p-1 relative rotate-6 opacity-85 select-none shrink-0">
                          <div className="border border-dashed border-sky-600/30 rounded-full w-full h-full flex flex-col items-center justify-center p-0.5">
                            <span className="text-[8px] text-sky-600 font-extrabold block">الأخصائي عبدالرحمن</span>
                            <span className="text-[7px] text-slate-500 font-bold block -mt-0.5">طبي معتمد</span>
                            <span className="text-[7px] text-sky-600 font-extrabold block mt-0.5">APPROVED</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Return button */}
                    <button
                      onClick={() => setActivePlan(null)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-xs print:hidden cursor-pointer"
                    >
                      توليد خطة لطفل آخر
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==================== CASES TAB ==================== */}
        {activeTab === "cases" && (
          <div className="space-y-8 animate-fade-in" id="cases-view">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">سجلات الأطفال والحالات المسجلة</h1>
                <p className="text-xs text-slate-500 font-bold">إدارة الملفات السريرية، ومتابعة الخطط المعتمدة وتحديثها</p>
              </div>
              <button 
                onClick={() => setActiveTab("assessment")}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus className="h-4 w-4" />
                إضافة وتقييم طفل جديد
              </button>
            </div>

            {/* Cases Search and Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              {isLoadingCases ? (
                <div className="p-16 text-center">
                  <Loader2 className="h-8 w-8 text-sky-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">جاري تحميل السجلات...</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="p-16 text-center">
                  <Clipboard className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 text-base">قائمة الحالات فارغة</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">يمكنك إضافة الحالات عبر ملء نموذج التقييم الذكي لتتم أرشفتها هنا تلقائياً.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                        <th className="p-4">اسم الطفل</th>
                        <th className="p-4">التشخيص</th>
                        <th className="p-4">العمر</th>
                        <th className="p-4">مستوى التواصل</th>
                        <th className="p-4">تاريخ الإضافة</th>
                        <th className="p-4">التقرير السريري</th>
                        <th className="p-4 text-center">خيارات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {cases.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-sky-50 text-sky-700 font-extrabold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <span className="font-extrabold text-slate-900">{c.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-sky-50 text-sky-700 text-xs px-2.5 py-0.5 rounded-full">
                              {caseLabels[c.caseType] || c.caseType}
                            </span>
                          </td>
                          <td className="p-4">{c.age} سنوات</td>
                          <td className="p-4">{commLevelLabels[c.commLevel] || c.commLevel}</td>
                          <td className="p-4 text-xs text-slate-400">{formatDate(c.createdAt)}</td>
                          <td className="p-4">
                            {c.plan ? (
                              <button
                                onClick={() => handleViewPlan(c)}
                                className="text-sky-600 hover:text-sky-800 text-xs font-bold flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4 text-sky-600" />
                                عرض الخطة الكاملة
                              </button>
                            ) : (
                              <button
                                onClick={() => handleViewPlan(c)}
                                className="text-amber-600 hover:text-amber-800 text-xs font-bold flex items-center gap-1"
                              >
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                توليد الخطة الآن
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteCase(c.id, c.name)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                              title="حذف ملف الطفل"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== LIBRARY TAB ==================== */}
        {activeTab === "library" && (
          <div className="space-y-8 animate-fade-in" id="library-view">
            
            {/* Header intro */}
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-sky-600 text-xs font-extrabold tracking-wide uppercase">المصادر العلاجية المفتوحة</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">مكتبة التمارين وبطاقات الأنشطة</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 font-bold">
                تصفح واطبع بطاقات التمارين المنزلية المعتمدة علمياً لمشاركتها مع أولياء الأمور لضمان استمرار العلاج في المنزل.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setSelectedCategory("speech")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCategory === "speech"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  تمارين النطق والتخاطب
                </button>
                <button
                  onClick={() => setSelectedCategory("behavior")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCategory === "behavior"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  تعديل السلوك والتركيز
                </button>
                <button
                  onClick={() => setSelectedCategory("special_ed")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedCategory === "special_ed"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  التربية خاصة وتواصل PECS
                </button>
              </div>

              {/* Text Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن تمرين أو مادة..."
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  className="w-full border border-slate-200 pr-10 pl-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Exercises Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((ex) => (
                <div 
                  key={ex.id} 
                  className={`bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden ${
                    expandedExerciseId === ex.id ? "ring-2 ring-sky-500" : ""
                  }`}
                >
                  <div className="p-6 space-y-4">
                    {/* Category Label */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                        ex.category === "speech" 
                          ? "bg-sky-50 text-sky-800 border border-sky-100" 
                          : ex.category === "behavior"
                          ? "bg-amber-50 text-amber-800 border border-amber-100"
                          : "bg-indigo-50 text-indigo-800 border border-indigo-100"
                      }`}>
                        {ex.category === "speech" 
                          ? "تمارين نطق وتخاطب" 
                          : ex.category === "behavior"
                          ? "تعديل السلوك والانتباه"
                          : "التربية خاصة وتواصل بديل"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-extrabold">العمر: {ex.targetAge}</span>
                    </div>
                    {ex.imagePath && <img src={ex.imagePath} alt={ex.title} className="w-full h-40 object-cover rounded-2xl" />}

                    {/* Title */}
                    <h3 className="font-extrabold text-slate-900 leading-snug">{ex.title}</h3>

                    {/* Objective */}
                    <p className="text-xs text-slate-500 leading-relaxed font-bold">
                      {ex.objective}
                    </p>

                    {/* Materials */}
                    <div className="flex flex-wrap gap-1">
                      {ex.materials.map((m, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* Steps (Visible if expanded) */}
                    {expandedExerciseId === ex.id && (
                      <div className="border-t border-slate-100 pt-4 mt-4 space-y-3 animate-fade-in text-xs">
                        <span className="font-extrabold text-sky-800 block">طريقة تطبيق التمرين للوالدين:</span>
                        <ul className="space-y-2 pr-1 font-semibold text-slate-600 leading-relaxed">
                          {ex.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-sky-600 font-bold shrink-0">{idx + 1}-</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100/60 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedExerciseId(expandedExerciseId === ex.id ? null : ex.id)}
                      className="text-xs text-sky-600 hover:text-sky-800 font-extrabold"
                    >
                      {expandedExerciseId === ex.id ? "إخفاء الخطوات" : "تفاصيل خطوات التطبيق"}
                    </button>
                    <button
                      onClick={() => {
                        // Print dynamic view of this specific exercise card
                        const printWindow = window.open("", "_blank");
                        if (printWindow) {
                          printWindow.document.write(`
                            <html dir="rtl">
                              <head>
                                <title>${ex.title}</title>
                                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
                                <style>
                                  body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                                  .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 25px; }
                                  h1 { color: #0369a1; margin: 0; font-size: 24px; }
                                  .tag { background: #f0f9ff; color: #0369a1; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; }
                                  .section { margin-bottom: 20px; }
                                  h3 { color: #0ea5e9; font-size: 16px; margin-bottom: 8px; }
                                  ul { padding-right: 20px; }
                                  li { margin-bottom: 10px; }
                                </style>
                              </head>
                              <body onload="window.print()">
                                <div class="header">
                                  <h1>الاخصائي عبدالرحمن | بطاقة تمرين منزلي</h1>
                                  <p>تمارين التخاطب المنزلية بمشاركة الأهل</p>
                                </div>
                                <div class="section">
                                  <span class="tag">${ex.category === "speech" ? "تمارين نطق" : "تعديل سلوك"}</span>
                                  <span class="tag">العمر: ${ex.targetAge}</span>
                                </div>
                                <div class="section">
                                  <h2>تمرين: ${ex.title}</h2>
                                  <h3>الهدف العلاجي:</h3>
                                  <p>${ex.objective}</p>
                                </div>
                                <div class="section">
                                  <h3>الأدوات اللازمة:</h3>
                                  <p>${ex.materials.join(" • ")}</p>
                                </div>
                                <div class="section">
                                  <h3>خطوات التطبيق اليومي:</h3>
                                  <ol>
                                    ${ex.steps.map(s => `<li>${s}</li>`).join("")}
                                  </ol>
                                </div>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                      className="bg-white hover:bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-extrabold px-3 py-1.5 rounded-xl"
                    >
                      طباعة بطاقة الأهل
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================== BOOKING TAB ==================== */}
        {activeTab === "booking" && (
          <div className="space-y-8 animate-fade-in" id="booking-view">
            
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="bg-sky-50 p-3 rounded-2xl text-sky-600 inline-block mb-3">
                  <Calendar className="h-8 w-8" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">حجز موعد جلسة تشخيصية</h1>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  املأ النموذج أدناه لحجز موعد لطلب استشارة أو جلسة تأهيلية جديدة، وسنتصل بك لتأكيد الموعد.
                </p>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-5 text-right">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم ولي الأمر الثلاثي</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.parentName}
                      onChange={(e) => setBookingForm({ ...bookingForm, parentName: e.target.value })}
                      placeholder="مثال: عبد الرحمن بن حسن"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الطفل</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.childName}
                      onChange={(e) => setBookingForm({ ...bookingForm, childName: e.target.value })}
                      placeholder="مثال: يوسف عبد الرحمن"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم هاتف الجوال</label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      placeholder="مثال: 0501234567"
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع صعوبة التواصل</label>
                    <select
                      value={bookingForm.caseType}
                      onChange={(e) => setBookingForm({ ...bookingForm, caseType: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm bg-slate-50/50"
                    >
                      <option value="speech_delay">تأخر لغوي ونمائي</option>
                      <option value="autism">طيف توحد (تواصل وتفاعل)</option>
                      <option value="adhd">فرط حركة وتشتت انتباه</option>
                      <option value="learning_disabilities">صعوبات تعلم وأصوات</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الحجز المفضل</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الفترة المفضلة</label>
                    <select
                      value={bookingForm.timeSlot}
                      onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm bg-slate-50/50"
                    >
                      <option>الصباح (9:00 - 12:00)</option>
                      <option>المساء (4:00 - 8:00)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl transition-all text-sm mt-4 cursor-pointer"
                >
                  إرسال وتأكيد طلب الحجز
                </button>
              </form>
            </div>

          </div>
        )}

      </main>

      {/* Modern Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-16 border-t border-slate-800 print:hidden" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-sky-600 p-2 rounded-xl text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <span className="text-white font-extrabold text-base block leading-none">الاخصائي عبدالرحمن</span>
                <span className="text-[10px] text-slate-500 font-bold mt-1 block">رعاية متخصصة بخطوات ذكية ميسرة</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 text-xs font-bold gap-4">
            <p>© {new Date().getFullYear()} الاخصائي عبدالرحمن. جميع الحقوق محفوظة لخدمات التخاطب والتربية الخاصة.</p>
            <p className="text-slate-600">مصمم لتلبية أعلى معايير الخصوصية والدعم الإكلينيكي للأطفال.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
);
}
