import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory simple database to store children records and appointments
interface ChildCase {
  id: string;
  name: string;
  age: number;
  caseType: string;
  commLevel: string;
  behaviorNotes: string;
  selectedSymptoms: string[];
  createdAt: string;
  plan?: any; // The generated treatment plan
}

interface Appointment {
  id: string;
  parentName: string;
  childName: string;
  phone: string;
  date: string;
  timeSlot: string;
  caseType: string;
  status: "pending" | "confirmed";
  createdAt: string;
}

const casesDb: ChildCase[] = [
  {
    id: "case_1",
    name: "سليم أحمد",
    age: 4,
    caseType: "speech_delay",
    commLevel: "medium",
    behaviorNotes: "يتشتت بسرعة ولكنه يستجيب للتعزيز البصري والمجسمات الكبيرة.",
    selectedSymptoms: ["articulation", "attention", "vocabulary"],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    plan: {
      diagnosis: "تأخر لغوي نمائي بسيط مع صعوبة في مخارج بعض الحروف ونقص في الحصيلة اللغوية اللفظية.",
      shortTermGoals: [
        "زيادة الحصيلة اللغوية التعبيرية بمقدار 20 كلمة مألوفة خلال شهر.",
        "نطق صوت حرف /ر/ وحرف /س/ بشكل سليم في مقاطع صوتية منفردة.",
        "الاستجابة للأوامر المكونة من خطوتين متتاليتين بنسبة نجاح 80%."
      ],
      longTermGoals: [
        "التعبير التلقائي عن احتياجاته اليومية باستخدام جمل تامة من 3 كلمات.",
        "تطوير المهارات الاجتماعية واللعب التعاوني والتواصل البصري المستمر مع الأقران."
      ],
      recommendedActivities: [
        "تسمية الكروت المصورة لحيوانات وخضروات ومطابقتها مع مجسمات حقيقية.",
        "استخدام تمارين النفخ (فقاعات الصابون، المزامير الورقية) لتقوية عضلات النطق.",
        "سرد قصص مصورة قصيرة جداً والطلب منه الإشارة للصور وسؤال 'ما هذا؟'."
      ],
      receptiveStrategies: [
        "تحدث مع الطفل بعبارات واضحة وقصيرة ومباشرة تصف ما تفعله معه.",
        "تجنب لغة التدليل الزائد واستخدام المسميات الصحيحة للأشياء دائماً."
      ],
      expressiveStrategies: [
        "امنح الطفل وقتاً كافياً (من 5 إلى 10 ثوانٍ) للاستجابة والتعبير قبل المساعدة.",
        "كرر كلام الطفل بشكل موسع؛ إذا قال 'سيارة'، قل 'نعم، سيارة حمراء جميلة تسير'."
      ],
      behavioralTips: [
        "استخدام جدول مكافآت بصري يومي (ملصقات نجوم) عند إتمام التمارين.",
        "تقليل وقت استخدام الشاشات والأجهزة اللوحية واستبدالها بالتفاعل البشري المباشر."
      ],
      suggestedSessionFrequency: "جلستان أسبوعياً بمعدل 40 دقيقة للجلسة لمدة 3 أشهر."
    }
  }
];

const appointmentsDb: Appointment[] = [
  {
    id: "appt_1",
    parentName: "أبو سليم أحمد",
    childName: "سليم أحمد",
    phone: "0501234567",
    date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    timeSlot: "المساء (4:00 - 8:00)",
    caseType: "speech_delay",
    status: "confirmed",
    createdAt: new Date().toISOString()
  }
];

// Helper to translate case values for the AI
const caseNames: Record<string, string> = {
  speech_delay: "تأخر لغوي (Speech Delay)",
  autism: "طيف توحد (Autism Spectrum)",
  adhd: "فرط حركة وتشتت انتباه (ADHD)",
  learning_disabilities: "صعوبات تعلم (Learning Disabilities)"
};

const commLevelNames: Record<string, string> = {
  low: "منخفض - غير لفظي (Low - Non-verbal)",
  medium: "متوسط - كلمات مفردة (Medium - Single words)",
  high: "جيد - جمل بسيطة ومتقطعة (Good - Simple sentences)"
};

const symptomNames: Record<string, string> = {
  articulation: "النطق ومخارج الحروف",
  attention: "الانتباه والتركيز البصري",
  receptive: "فهم واستيعاب التعليمات",
  social: "التفاعل والتواصل الاجتماعي",
  phonology: "الوعي الفونولوجي والأصوات"
};

// --- API ENDPOINTS ---

// 1. Get Cases List
app.get("/api/cases", (req, res) => {
  res.json(casesDb);
});

// 2. Add Child Case with optional pre-generated plan
app.post("/api/cases", (req, res) => {
  const { name, age, caseType, commLevel, behaviorNotes, selectedSymptoms, plan } = req.body;
  if (!name || !age) {
    return res.status(400).json({ error: "الاسم والعمر حقول مطلوبة" });
  }

  const newCase: ChildCase = {
    id: `case_${Date.now()}`,
    name,
    age: Number(age),
    caseType,
    commLevel,
    behaviorNotes: behaviorNotes || "",
    selectedSymptoms: selectedSymptoms || [],
    createdAt: new Date().toISOString(),
    plan
  };

  casesDb.unshift(newCase);
  res.status(201).json(newCase);
});

// 3. Delete Case
app.delete("/api/cases/:id", (req, res) => {
  const { id } = req.params;
  const index = casesDb.findIndex(c => c.id === id);
  if (index !== -1) {
    casesDb.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "الحالة غير موجودة" });
  }
});

// 4. Get Appointments
app.get("/api/appointments", (req, res) => {
  res.json(appointmentsDb);
});

// 5. Book Appointment
app.post("/api/appointments", (req, res) => {
  const { parentName, childName, phone, date, timeSlot, caseType } = req.body;
  if (!parentName || !childName || !phone || !date) {
    return res.status(400).json({ error: "جميع الحقول الأساسية مطلوبة للحجز" });
  }

  const newAppt: Appointment = {
    id: `appt_${Date.now()}`,
    parentName,
    childName,
    phone,
    date,
    timeSlot: timeSlot || "الصباح (9:00 - 12:00)",
    caseType: caseType || "speech_delay",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  appointmentsDb.unshift(newAppt);
  res.status(201).json(newAppt);
});

// 6. Update Appointment Status
app.patch("/api/appointments/:id/confirm", (req, res) => {
  const { id } = req.params;
  const appt = appointmentsDb.find(a => a.id === id);
  if (appt) {
    appt.status = "confirmed";
    res.json(appt);
  } else {
    res.status(404).json({ error: "الحجز غير موجود" });
  }
});

// 7. Delete Appointment
app.delete("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const index = appointmentsDb.findIndex(a => a.id === id);
  if (index !== -1) {
    appointmentsDb.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "الحجز غير موجود" });
  }
});

// 8. Generate Treatment Plan using Gemini (or smart local fallback)
app.post("/api/generate-plan", async (req, res) => {
  const { childName, childAge, caseType, commLevel, behaviorNotes, selectedSymptoms } = req.body;

  if (!childName || !childAge) {
    return res.status(400).json({ error: "اسم الطفل وعمره مطلوبان لتوليد الخطة" });
  }

  const symptomsList = (selectedSymptoms || []).map((s: string) => symptomNames[s] || s).join("، ");
  const caseTypeName = caseNames[caseType] || caseType;
  const commLevelName = commLevelNames[commLevel] || commLevel;

  // Check if GEMINI_API_KEY is available
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `أنت أخصائي تخاطب وتربية خاصة خبير ومستشار متميز في تأهيل الأطفال وتنمية مهارات التواصل لديهم.
قم بتحليل حالة الطفل التالي وصياغة تقرير تشخيصي مبدئي وخطة علاجية وتأهيلية مفصلة باللغة العربية الفصحى.

بيانات الطفل المريض:
- الاسم: ${childName}
- العمر: ${childAge} سنوات
- نوع الحالة الرئيسي: ${caseTypeName}
- مستوى التواصل الحالي: ${commLevelName}
- الأعراض والصعوبات الملاحظة: ${symptomsList || "لم تحدد أعراض إضافية"}
- ملاحظات سلوكية وبيئية: ${behaviorNotes || "لا توجد ملاحظات سلوكية مضافة"}

قم بتوليد خطة علاجية مخصصة دقيقة ومتكاملة تحتوي على الأقسام التالية:
1. التشخيص المبدئي والتحليل السريري للحالة.
2. أهداف قصيرة المدى (SMART goals) قابلة للقياس والتحقيق في غضون شهر إلى 3 أشهر (من 3 إلى 5 أهداف).
3. أهداف طويلة المدى للتنمية المستدامة (من 2 إلى 3 أهداف).
4. تمارين وأنشطة منزلية وعيادية مقترحة ومفصلة للتطبيق اليومي والأسبوعي (من 3 إلى 5 تمارين).
5. استراتيجيات بناء وتطوير الفهم والاستيعاب اللغوي (Receptive language strategies).
6. استراتيجيات بناء وتحفيز التعبير والإنتاج اللفظي أو البديل (Expressive language strategies).
7. نصائح سلوكية لضبط الانتباه والتركيز والحد من التشتت أو المشكلات السلوكية المصاحبة للحالة.
8. التوصية بعدد ومدة الجلسات المناسبة أسبوعياً.

تأكد تماماً من كتابة التقرير بلغة عربية دقيقة، وموجهة للوالدين والأخصائي على حد سواء بأسلوب مشجع وعلمي رصين.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: {
                type: Type.STRING,
                description: "Detailed professional clinical diagnosis and communication analysis in Arabic.",
              },
              shortTermGoals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 targeted, highly descriptive, and measurable short-term goals in Arabic.",
              },
              longTermGoals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 developmental and communicative long-term goals in Arabic.",
              },
              recommendedActivities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 practical everyday training exercises or games for parents/therapists in Arabic.",
              },
              receptiveStrategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 4 clinical strategies to enhance understanding and receptive language in Arabic.",
              },
              expressiveStrategies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 4 scientific methods to expand expressing, speaking, and speech production in Arabic.",
              },
              behavioralTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 4 tailored behavioural modification or therapeutic reinforcement tips in Arabic.",
              },
              suggestedSessionFrequency: {
                type: Type.STRING,
                description: "A professional recommendation for weekly session count and single session duration in Arabic.",
              }
            },
            required: [
              "diagnosis",
              "shortTermGoals",
              "longTermGoals",
              "recommendedActivities",
              "receptiveStrategies",
              "expressiveStrategies",
              "behavioralTips",
              "suggestedSessionFrequency"
            ]
          }
        }
      });

      const planText = response.text;
      if (planText) {
        const parsedPlan = JSON.parse(planText.trim());
        return res.json({ success: true, plan: parsedPlan, isAi: true });
      } else {
        throw new Error("Empty response from Gemini model");
      }
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      // Fallback to rules-engine below if Gemini fails
    }
  }

  // --- COMPREHENSIVE LOCAL RULE-BASED FALLBACK ENGINE ---
  // If API Key is missing or an error occurred during API fetch, we provide a rich, detailed,
  // custom clinical plan based on selected state, ensuring a robust, non-crashing, responsive experience.
  let diagnosis = "";
  let shortTermGoals: string[] = [];
  let longTermGoals: string[] = [];
  let recommendedActivities: string[] = [];
  let receptiveStrategies: string[] = [];
  let expressiveStrategies: string[] = [];
  let behavioralTips: string[] = [];
  let suggestedSessionFrequency = "جلستان أسبوعياً بمعدل 45 دقيقة للجلسة.";

  if (caseType === "speech_delay") {
    diagnosis = `تأخر لغوي تعبيري واستقبالي يعود لعوامل نمائية أو بيئية، حيث يظهر الطفل ${childName} (عمره ${childAge} سنوات) فجوة لغوية ملحوظة بين مستوى فهمه للأصوات والكلمات ومستوى إنتاجه للتواصل اللفظي بـ ${commLevelName === "low" ? "تواصل منعدم تقريباً" : "حصيلة مقتصرة ومحدودة"}.`;
    
    shortTermGoals = [
      "نطق واستخدام 15 كلمة وظيفية مألوفة من بيئة الطفل (طعام، ماء، ألعاب) بشكل مستمر.",
      "تطوير القدرة على مطابقة الأشياء المألوفة مع مسمياتها بالصورة الحقيقية بنسبة نجاح 80%.",
      "الاستجابة للأوامر البسيطة ذات الخطوة الواحدة (مثل: 'هات الكرة'، 'تعال هنا') دون مساعدة جسدية."
    ];
    longTermGoals = [
      "بناء جمل بسيطة ثنائية الكلمات للتعبير عن احتياجاته اليومية تلقائياً.",
      "رفع كفاءة التواصل اللغوي والتبادل الحواري المشترك مع الكبار والأقران."
    ];
    recommendedActivities = [
      "تمرين نفخ الشموع وفقاعات الماء لتقوية أعضاء النطق وتهيئة مخارج الأصوات.",
      "تسمية الأشياء باسمها الحقيقي أثناء اللعب الحر وتجنب الإشارات البديلة بدون صوت.",
      "لعبة التخزين الصوتي: نطق الأصوات وتكرارها بنغمات مختلفة لتشجيع التقليد الصوتي."
    ];
    receptiveStrategies = [
      "تحدث بجمل قصيرة وواضحة جداً تتناسب مع عمره اللغوي الحالي.",
      "استخدم الإشارة المصاحبة للكلمات لربط اللفظ بالمعنى وتسهيل الفهم والاسترجاع."
    ];
    expressiveStrategies = [
      "تأخير تلبية رغبات الطفل فوراً عند الإشارة، وتشجيعه على محاولة إصدار أي صوت أو كلمة أولاً.",
      "استخدام استراتيجية التكرار الصوتي والنمذجة اللغوية البسيطة للأفعال اليومية."
    ];
    behavioralTips = [
      "استخدام جداول التعزيز الفوري (ألعاب، مديح لفظي، لمس لطيف) عند نطق الكلمات.",
      "تحديد أوقات ثابتة ومنظمة للأنشطة والمهام وتجنب العشوائية لتقليل التوتر والإحباط."
    ];
    suggestedSessionFrequency = "من جلستين إلى 3 جلسات أسبوعياً، بمعدل 45 دقيقة للجلسة الفردية.";
  } else if (caseType === "autism") {
    diagnosis = `صعوبات تواصلية وتفاعلية تقع ضمن طيف التوحد البسيط إلى المتوسط، تبرز في ضعف التواصل البصري المستمر، ومحدودية المهارات الاجتماعية اللفظية، بالإضافة إلى وجود بعض المظاهر السلوكية النمطية الملاحظة في: "${behaviorNotes || "الانشغال الذاتي وتشتت الانتباه"}".`;
    
    shortTermGoals = [
      "زيادة التواصل البصري المستمر أثناء المحادثة أو الطلب ليتراوح بين 3 إلى 5 ثوانٍ.",
      "الاستجابة الفورية عند مناداته باسمه بالتفات الرأس بنسبة نجاح لا تقل عن 75%.",
      "استخدام الإشارة الوظيفية أو الصور المصورة (PECS) للتعبير عن رغبة عاجلة دون بكاء."
    ];
    longTermGoals = [
      "تطوير اللعب التفاعلي المشترك والمشاركة البسيطة مع طفل آخر دون تراجع.",
      "بناء أساس متين للتواصل اللفظي أو التبادلي للتعبير المباشر عن الرغبات والرفض بلين."
    ];
    recommendedActivities = [
      "الاستعانة بالجداول البصرية اليومية المصورة لتنظيم يوم الطفل وتهيئة التحولات والروتين.",
      "لعب الأدوار بالدمى والمطابقة البصرية وتدريبات الإشارة لتعزيز الإدراك المشترك.",
      "تطبيق تمارين دمج حسية خفيفة مثل اللعب بالمعجون، المياه الملونة أو كرات الجل."
    ];
    receptiveStrategies = [
      "استخدام تعليمات قصيرة ومباشرة جداً خالية من المجاز والتفاصيل الزائدة.",
      "النزول لمستوى عيني الطفل جسدياً لضمان لفت انتباهه قبل توجيه أي أمر أو إرشاد."
    ];
    expressiveStrategies = [
      "تفعيل نظام بيكس (PECS) لتبادل الصور كوسيلة تواصل بديلة موازية ومحفزة للنطق اللفظي.",
      "تعزيز أي نطق أو محاولة تواصل لفظية أو جسدية بشكل فوري ومبالغ فيه لجعل التفاعل محفزاً."
    ];
    behavioralTips = [
      "استخدام أسلوب الإطفاء السلوكي وتجاهل السلوكيات غير المرغوبة غير المؤذية مع تعزيز السلوك البديل.",
      "تحضير الطفل مسبقاً لأي تغيير في جدول الأنشطة اليومية لتفادي نوبات الغضب الصاخبة."
    ];
    suggestedSessionFrequency = "3 جلسات أسبوعياً، بمعدل 45 دقيقة للجلسة المركزة في بيئة هادئة.";
  } else if (caseType === "adhd") {
    diagnosis = `تأثر لغوي ناتج عن فرط الحركة وتشتت الانتباه وصعوبة معالجة المثيرات، حيث يملك الطفل مهارات لغوية كامنة جيدة لكن تسرعه واندفاعه وضعف تركيزه يقللان من قدرته على التعبير المنظم واتباع التوجيهات الطويلة.`;
    
    shortTermGoals = [
      "إتمام نشاط تخاطبي فردي جالس لمدة 7 دقائق متواصلة دون مغادرة الكرسي.",
      "الاستماع لقصة قصيرة جداً (3 جمل) والإجابة عن سؤالين بسيطين حولها.",
      "الانتظار لمدة 5 ثوانٍ قبل الإجابة عن سؤال موجه لتدريب التمكث والحد من الاندفاع."
    ];
    longTermGoals = [
      "تنظيم سرد القصص والأحداث اليومية بتسلسل زمني منطقي متصل.",
      "اكتساب مهارات الاستماع الفعال وتبادل الأدوار الكلامية في الحوارات الثنائية."
    ];
    recommendedActivities = [
      "ألعاب التصنيف والمطابقة السريعة التي تتطلب التنسيق البصري الحركي لشد الانتباه.",
      "تمرين الصمت والاسترخاء مع استخدام الموسيقى الهادئة لتدريبه على الهدوء الذاتي.",
      "تمارين البناء والتركيب مثل الفك والتركيب للمكعبات مع التوجيه اللفظي للمسميات."
    ];
    receptiveStrategies = [
      "تقسيم الأوامر المركبة إلى خطوات مفردة بسيطة يسهل استيعابها وتنفيذها واحدة تلو الأخرى.",
      "إلغاء المشتتات البصرية والسمعية تماماً من الغرفة التدريبية لزيادة كفاءة الفهم الاستقبالي."
    ];
    expressiveStrategies = [
      "استخدام الأسئلة الاختيارية المحددة ('هل تريد تفاحاً أم مووزاً؟') بدلاً من الأسئلة المفتوحة.",
      "تشجيع الطفل على إعادة صياغة الطلب بهدوء وصوت معتدل قبل منحه ما يريد."
    ];
    behavioralTips = [
      "تطبيق نظام 'لوحة المهام والنجوم اليومية' ومقايضة النجوم بجوائز عينية يحبها.",
      "إتاحة فترات راحة حركية قصيرة ومقننة (دقيقة واحدة حركية) بين التمارين اللغوية للتنفيس."
    ];
    suggestedSessionFrequency = "جلستان أسبوعياً بمعدل 30 إلى 40 دقيقة، مع التركيز التام على البيئة المنظمة.";
  } else {
    // learning_disabilities
    diagnosis = `صعوبات لغوية وإدراكية تظهر في صعوبة الوعي الفونولوجي ومطابقة الأصوات بالحروف وتذكر المتواليات السمعية، مما يؤثر على نمو مهارات ما قبل القراءة والكتابة وعسر القراءة اللفظي البسيط.`;
    
    shortTermGoals = [
      "التعرف على أصوات الحروف الأبجدية وتوليد كلمات تبدأ بصوت محدد بنسبة نجاح 80%.",
      "ترديد متوالية سمعية من 3 كلمات أو أرقام صحيحة بنفس الترتيب لتقوية الذاكرة العاملة.",
      "التمييز البصري والسمعي بين الكلمات ذات الأصوات المتقاربة (مثل: تين وطين، كلب وقلب)."
    ];
    longTermGoals = [
      "دمج الأصوات والمقاطع لتكوين وقراءة كلمات ثلاثية بسيطة.",
      "تطوير الطلاقة التعبيرية والقدرة على شرح المفاهيم المجردة وفهم العلاقات اللغوية الدقيقة."
    ];
    recommendedActivities = [
      "لعبة صيد الأصوات بالبطاقات والحروف المغناطيسية لتثبيت الوعي الصوتي البصري.",
      "تدريبات التقطيع الصوتي للكلمات بالتصفيق (مثلاً: كـ - تـ - ا - بـ).",
      "تمارين الذاكرة السمعية والبصرية من خلال تذكر الأشياء المختفية أو تكرار النغمات."
    ];
    receptiveStrategies = [
      "استخدام الوسائل البصرية واللمسية (مجسمات الحروف، المعجون) بجانب الكلام لتأكيد الفهم.",
      "إعطاء الطفل وقتاً كافياً ومريحاً لمعالجة الكلمات وتخزينها دون ضغط زمني."
    ];
    expressiveStrategies = [
      "تعويد الطفل على التفكير والتخطيط للكلام واستخدام التلميح اللفظي لمساعدته على الاسترجاع.",
      "تنظيم جلسات حوارية لمناقشة مواضيع يحبها الطفل واستخدام الخرائط الذهنية المبسطة للكلمات."
    ];
    behavioralTips = [
      "زيادة الثقة بالنفس وتجنب نقد أخطاء النطق بطريقة مباشرة بل إعادة صياغتها بشكل صحيح.",
      "تقسيم الواجبات التدريبية الطويلة إلى مهام صغيرة محددة للوقاية من الإحباط وفقدان الشغف."
    ];
    suggestedSessionFrequency = "جلستان أسبوعياً بمعدل 45 دقيقة، بالتكامل مع خطة المدرسة والتربية الخاصة.";
  }

  // Append selected symptoms custom goals if any
  if (selectedSymptoms && selectedSymptoms.length > 0) {
    selectedSymptoms.forEach((sym: string) => {
      if (sym === "articulation") {
        shortTermGoals.push("تحسين مخارج الحروف الشائعة وتدريب عضلات اللسان والشفاه.");
        recommendedActivities.push("تمرين مرآة مخارج الحروف: جعل الطفل يرى فم الأخصائي وفمه أثناء محاكاة مخارج الحروف الصعبة.");
      } else if (sym === "attention") {
        shortTermGoals.push("تحسين الانتباه والتركيز البصري المشترك والمثابرة على أداء نشاط تخاطبي لـ 5 دقائق.");
        behavioralTips.push("إبعاد أي ألعاب تطلق أضواءً أو أصواتاً مشتتة أثناء أوقات التدريب والتركيز.");
      } else if (sym === "receptive") {
        shortTermGoals.push("زيادة استيعاب وفهم الجمل والأفعال الحركية في البيئة المحيطة.");
        receptiveStrategies.push("تجنب إعطاء توجيهات متعددة في نفس الوقت، بل انتظر انتهاء المهمة الأولى قبل طلب الثانية.");
      }
    });
  }

  res.json({
    success: true,
    plan: {
      diagnosis,
      shortTermGoals: shortTermGoals.slice(0, 4), // limit to 4 for clean spacing
      longTermGoals,
      recommendedActivities,
      receptiveStrategies,
      expressiveStrategies,
      behavioralTips,
      suggestedSessionFrequency
    },
    isAi: false
  });
});

// Serve static assets in production, otherwise Vite middleware handles it in dev
const distPath = path.join(process.cwd(), "dist");

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

start();
