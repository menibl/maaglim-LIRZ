import { School, Student, Activity, Registration, Placement } from "../types";

// Custom generated high-appeal activity images tailored for kids 6-12
import aiGamingImg from "../assets/images/ai_gaming_kids_1787480999188.jpg";
import youngPastryImg from "../assets/images/young_pastry_baking_1787481014546.jpg";
import legoEngineeringImg from "../assets/images/lego_engineering_1787481027867.jpg";
import galaxyGuardiansImg from "../assets/images/galaxy_guardians_1787481047118.jpg";
import scienceMagicImg from "../assets/images/science_magic_kids_1787481061203.jpg";
import kidsWoodworkingPinocchioImg from "../assets/images/kids_woodworking_pinocchio_1787481429983.jpg";
import kidsInteriorArchitectsImg from "../assets/images/kids_interior_architects_1787481443031.jpg";
import kidsSchoolTheaterStageImg from "../assets/images/kids_school_theater_stage_1787481456894.jpg";

export interface SchoolData {
  school: School;
  students: Student[];
  activities: Activity[];
  registrations: Registration[];
  placements: Placement[];
}

// ==========================================
// רשימת החוגים הרשמית המלאה על פי קטלוג "ביה"ס של העתיד 2026-2027"
// החברה לחינוך, תרבות ופנאי בחבל מודיעין
// ==========================================

interface ActivityMasterDef {
  code: string;
  name: string;
  category:
    "arts" | "technology" | "culinary" | "sciences" | "sports" | "enrichment";
  allowedGrades: ("א" | "ב" | "ג" | "ד" | "ה")[];
  schools: ("ben-shemen" | "yitzhak-navon" | "lapid")[];
  description: string;
  imageUrl: string;
  instructor: string;
  instructorPhone: string;
  extraFee?: number; // תוספת תשלום אם קיימת (למשל קונדיטוריה 200 ש"ח)
  notes?: string;
}

export const OFFICIAL_MASTER_ACTIVITIES: ActivityMasterDef[] = [
  // 1. אמנות רב־תחומית
  {
    code: "ARTS-MULTI",
    name: "אמנות רב־תחומית",
    category: "arts",
    allowedGrades: ["א", "ב", "ג", "ד", "ה"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    description:
      "חוג עשיר ומגוון המזמין את הילדים לצאת למסע יצירתי בעולם האמנות והעיצוב. במהלך השנה נתנסה במגוון רחב של טכניקות וחומרי יצירה, ביניהם בטון פולימרי, תחבושות גבס, עיסת נייר, תפירה, פלסטלינה, חומרים ממוחזרים ועוד. נשלב ציור, פיסול, עיצוב ויצירה שימושית, וניצור עבודות מקוריות ומרהיבות שהילדים ייקחו הביתה בגאווה. החוג מעודד יצירתיות, דמיון, חשיבה עצמאית וביטוי אישי, תוך היכרות עם תהליכי העבודה של אמנים ומעצבים ופיתוח מיומנויות של תכנון, התמדה ופתרון בעיות. חוויה מהנה, צבעונית ומעשירה לכל ילד וילדה שאוהבים ליצור בידיים ולתת לדמיון להוביל.",
    imageUrl: kidsInteriorArchitectsImg,
    instructor: "ענת שמיר (אמנית ויוצרת)",
    instructorPhone: "050-6655443",
  },
  // 2. תכשיטנות
  {
    code: "JEWELRY",
    name: "תכשיטנות",
    category: "arts",
    allowedGrades: ["א", "ב", "ג", "ד"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    description:
      "הילדים הופכים למעצבים צעירים, כשהם יוצרים תכשיטים מהממים בקו אישי ומקורי. כל שיעור הוא הרפתקה של יצירתיות, דיוק ודמיון, והתוצאה? תכשיטים שילדים יכולים לענוד בגאווה או להעניק במתנה. זה חוג שמפתח חוש אסתטי, מוטוריקה עדינה, ביטוי עצמי וביטחון. מתאים במיוחד לילדים שאוהבים לשלב בין יצירה לאופנה – וגם להבריק במשהו שאף אחד אחר לא עושה! עיצוב אישי, צבעים, חרוזים וניצוץ של יצירה – חוג שבו הילדים יוצרים תכשיטים ייחודיים משלהם ולומדים על סבלנות, אסתטיקה וסטייל.",
    imageUrl:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80",
    instructor: "שירה לב-ארי (מעצבת אופנה ותכשיטים)",
    instructorPhone: "050-1239876",
  },
  // 3. אומנויות הבמה
  {
    code: "PERFORMING-ARTS",
    name: "אומנויות הבמה",
    category: "arts",
    allowedGrades: ["א", "ב", "ג", "ד", "ה"],
    schools: ["yitzhak-navon", "lapid"],
    description:
      "המקום לגלות את הקול והביטחון שבפנים דרך משחקי תיאטרון, אלתור, תנועה, דמויות וסיפורים, הילדים יוצאים למסע יצירתי ומעצים המפתח ביטחון עצמי, יכולת ביטוי, דמיון וחשיבה יצירתית. במפגשים הם לומדים להקשיב, לשתף פעולה, לעמוד מול קהל ולהעז להביא את עצמם לידי ביטוי באווירה בטוחה, מהנה ומלאת השראה. התכנים מותאמים לגיל המשתתפים ומשלבים חוויה, יצירה וצמיחה אישית, על הבמה ומחוצה לה.",
    imageUrl: kidsSchoolTheaterStageImg,
    instructor: "נעמה שפירא (שחקנית ובימאית תיאטרון)",
    instructorPhone: "052-1133557",
  },
  // 4. נגרות / ארץ חוץ
  {
    code: "WOODWORK",
    name: "נגרות / ארץ חוץ",
    category: "enrichment",
    allowedGrades: ["ב", "ג", "ד", "ה"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    description:
      "איך רעיון הופך למוצר אמיתי – הצטרפו אלינו לחוג נגרות! במהלך החוג ילמדו הילדים להשתמש בכלי עבודה מותאמים ובטוחים, יתנסו בניסור, הברגה, שיוף, הרכבה וצביעה, ויבנו במו ידיהם מגוון פרויקטים מעץ- תיבה, מנורה ועוד. העבודה המעשית מחזקת סבלנות, דיוק, חשיבה יצירתית וביטחון עצמי, לצד תחושת הצלחה וגאווה בכל יצירה שמושלמת. החוג מעניק שילוב ייחודי של למידה, הנאה ועשייה ומאפשר לילדים לגלות את חדוות היצירה דרך עולם העץ המרתק.",
    imageUrl: kidsWoodworkingPinocchioImg,
    instructor: "גיל ארבל (חרש עץ מוסמך)",
    instructorPhone: "050-8899776",
  },
  // 5. קונדיטוריה לצעירים
  {
    code: "PASTRY-YOUNG",
    name: "קונדיטוריה לצעירים",
    category: "culinary",
    allowedGrades: ["א", "ב", "ג", "ד", "ה"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    extraFee: 200,
    description:
      'ברוכים הבאים לעולם שבו סיפורים מתעוררים לחיים דרך הריח המתוק של המאפים! בכל מפגש ייצאו הילדים למסע קסום המשלב בין סיפור מרתק, דמיון יצירתי ועשייה במטבח. הילדים יהפכו לקונדיטורים צעירים, יאפו, יקשטו ויכינו מגוון קינוחים ומאפים טעימים וצבעוניים בהנחיית קונדיטורית מקצועית. תוך כדי העבודה ילמדו טכניקות אפייה בסיסיות, יפתחו דיוק, סבלנות ויצירתיות, ובעיקר ייהנו מחוויה מתוקה במיוחד. החוג מעניק שילוב ייחודי של למידה, הנאה ויצירה, ומאפשר לכל ילד וילדה לצאת בכל שבוע עם תוצר טעים, חיוך גדול וגאווה בהצלחה שלהם (תוספת חד פעמית: 200 ש"ח).',
    imageUrl: youngPastryImg,
    instructor: "קונדיטורית רותם פרידמן",
    instructorPhone: "054-3322110",
  },
  // 6. בינה מלאכותית דרך עולם המשחקים
  {
    code: "AI-GAMING",
    name: "בינה מלאכותית דרך עולם המשחקים",
    category: "technology",
    allowedGrades: ["ב", "ג", "ד", "ה"],
    schools: ["yitzhak-navon"],
    description:
      "בחוג החדש שלנו, הילדים לא רק משחקים – הם הופכים את זמן המסך למקפצה לעולם ההייטק. אנחנו לוקחים את העולמות שהם הכי אוהבים – מיינקראפט ו-Scratch – והופכים אותם לסביבת למידה חכמה ומרתקת שסובבת כולה סביב עולם הבינה המלאכותית (AI). דרך המשחק, הילדים כותבים קוד בצורה ידידותית ובסיסית, מפתחים לוגיקה חכמה ומבינים הלכה למעשה איך טכנולוגיות העתיד עובדות. זו הדרך החכמה, העדכנית והמהנה ביותר לפתח חשיבה טכנולוגית ולהעניק להם כלים אמיתיים להצלחה – והכל תוך כדי חוויה שהם פשוט לא ירצו להפסיק.",
    imageUrl: aiGamingImg,
    instructor: "תומר אריאלי (מומחה טכנולוגיות וקוד)",
    instructorPhone: "053-1122334",
  },
  // 7. הדפסת תלת מימד / דרך השכל
  {
    code: "3D-PRINTING",
    name: "הדפסת תלת מימד / דרך השכל",
    category: "technology",
    allowedGrades: ["ג", "ד", "ה"],
    schools: ["yitzhak-navon"],
    description:
      "האם אפשר להפוך רעיון שבראש לחפץ מוחשי ביד? זה בדיוק מה שקורה בחוג הדפסת תלת־ממד! הילדים לומדים לעצב מודלים בתוכנה מקצועית, ולאחר מכן מדפיסים את היצירות במדפסת אמיתית. החוג מחבר בין יצירתיות לטכנולוגיה, ומקנה הבנה עמוקה על תהליכים, פתרון בעיות, ודיוק. מתאים במיוחד לילדים טכנולוגיים או כאלה שאוהבים לבנות ולראות תוצאות.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    instructor: "אופיר מילר (מומחה הדפסה ומידול תלת-ממד)",
    instructorPhone: "052-5544332",
  },
  // 8. שומרי הגלקסיה
  {
    code: "GALAXY-GUARDIANS",
    name: "שומרי הגלקסיה",
    category: "sciences",
    allowedGrades: ["ג", "ד", "ה"],
    schools: ["yitzhak-navon", "lapid"],
    description:
      "מוכנים לצאת למשימה הכי מטורפת ביקום? הצטרפו אלינו למסע חללי בין כוכבים, גלקסיות וחורים שחורים, שבו תגלו את כל הסודות הכי כמוסים של החלל. נטיס חלליות, נחקור כוכבי לכת מסתוריים ונבין איך הטכנולוגיה הכי מתקדמת בעולם עובדת מקרוב. אם תמיד חלמתם לחקור עולמות חדשים ולהיות האסטרונאוטים של המחר – המקום שלכם איתנו!",
    imageUrl: galaxyGuardiansImg,
    instructor: 'ד"ר דורון כץ (חוקר חלל ואסטרופיזיקה)',
    instructorPhone: "054-6677889",
  },
  // 9. אנימציה
  {
    code: "ANIMATION",
    name: "אנימציה",
    category: "arts",
    allowedGrades: ["ג", "ד", "ה"],
    schools: ["yitzhak-navon", "lapid"],
    description:
      "תמיד רציתם לדעת איך מפיחים חיים בדמויות אהובות ויוצרים את הסרטים הכי שווים? בחוג האנימציה שלנו אתם הופכים לבימאים, ליוצרים ולמעצבים של העולמות שלכם! נלמד לייצר סרטונים מדהימים, להפעיל אפקטים מיוחדים ולהביא את כל הרעיונות שלכם ישר לתוך המסך. בואו להראות לכולם מה הדמיון שלכם מסוגל לעשות!",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    instructor: "מאיה אלון (אנימטורית ויוצרת מדיה)",
    instructorPhone: "050-9876123",
  },
  // 10. קסמי המדע
  {
    code: "SCIENCE-MAGIC",
    name: "קסמי המדע",
    category: "sciences",
    allowedGrades: ["א", "ב", "ג", "ד"],
    schools: ["yitzhak-navon"], // בית ספר יצחק נבון בלבד
    description:
      'חולמים לייצר תגובות כימיות מטורפות ולגלות איך העולם באמת עובד? בואו להיכנס למעבדה האמיתית שלנו ולהפוך לחוקרים ליום אחד! ניקח חלק בניסויים מעשיים, נגלה תופעות מדהימות וניצור תהליכים מרהיבים שפשוט יגרמו לכם להגיד "וואו". תכינו את חלוקי המעבדה – ההרפתקה המדעית שלכם מתחילה עכשיו!',
    imageUrl: scienceMagicImg,
    instructor: 'ד"ר דורון כץ (כימאי ומחנך מדעי)',
    instructorPhone: "054-6677889",
  },
  // 11. בישול מולקולרי
  {
    code: "MOLECULAR-COOKING",
    name: "בישול מולקולרי",
    category: "culinary",
    allowedGrades: ["א", "ב", "ג", "ד"],
    schools: ["yitzhak-navon"], // בית ספר יצחק נבון בלבד
    description:
      "מוכנים לגלות את הסודות הקולינריים ולהפוך לשפים מיומנים? בחוג הבישול והאפייה שלנו נלמד להכין מגוון מנות עשירות ומגוונות מאפס, נכיר חומרי גלם איכותיים, ונרכוש טכניקות עבודה מקצועיות בדיוק כמו הגדולים! בכל מפגש נבשל, נאפה, נעצב בסטייל – וכמובן נהנה לטעום את היצירות המופלאות שנכין במו ידינו. תכינו את הסינרים והסקרנות, כי מצפה לנו חוויה טעימה ומעשירה במיוחד! (מתקיים שעתיים רצופות בשעה השניה והשלישית).",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    instructor: "שף רן ברקוביץ'",
    instructorPhone: "054-3322110",
  },
  // 12. לגו הנדסי
  {
    code: "ENGINEERING-LEGO",
    name: "לגו הנדסי",
    category: "technology",
    allowedGrades: ["א", "ב", "ג", "ד"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    description:
      "חוג מרתק המשלב בנייה, הנדסה וחשיבה יצירתית באמצעות לגו טכני ומודלים מתקדמים. במהלך השנה יבנו הילדים מכוניות, מטוסים, טנקים, רובוטים ומבנים הנדסיים מגוונים, תוך היכרות עם עקרונות של מכניקה, תנועה ותכנון. באמצעות בנייה מעשית, פתרון אתגרים ושילוב מנועים ומנגנונים, יפתחו המשתתפים חשיבה לוגית, יכולת תכנון, דיוק, התמדה ועבודת צוות. החוג מעודד סקרנות טכנולוגית, יצירתיות וחשיבה הנדסית בדרך חווייתית ומהנה, ומעניק לילדים כלים חשובים לעולם החדשנות והטכנולוגיה.",
    imageUrl: legoEngineeringImg,
    instructor: "איתמר גלבוע (מהנדס ומדריך רובוטיקה)",
    instructorPhone: "052-7788990",
  },
  // 13. קרב מגע
  {
    code: "KRAV-MAGA",
    name: "קרב מגע",
    category: "sports",
    allowedGrades: ["א", "ב", "ג", "ד"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    description:
      "חוג חווייתי המשלב תנועה, כושר והגנה עצמית, תוך פיתוח יכולות גופניות ומנטליות כאחד. במהלך הפעילות יתרגלו הילדים מיומנויות של קואורדינציה, זריזות, שיווי משקל ושליטה בתנועה, לצד חיזוק הביטחון העצמי והיכולת להתמודד עם אתגרים. באמצעות משחקים, תרגילים ופעילויות קבוצתיות ילמדו המשתתפים עקרונות בסיסיים של הגנה עצמית, חשיבה מהירה, קבלת החלטות ועבודת צוות – באווירה מהנה, תומכת ומעצימה.",
    imageUrl:
      "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
    instructor: "מאסטר ליאור דביר (חגורה שחורה ומוסמך וינגייט)",
    instructorPhone: "052-4433221",
  },
  // 14. כדורגל
  {
    code: "SOCCER",
    name: "כדורגל",
    category: "sports",
    allowedGrades: ["א", "ב", "ג", "ד"],
    schools: ["ben-shemen", "yitzhak-navon", "lapid"],
    description:
      "יותר מרק כדורגל – אימון המשלב תנועה, חשיבה ופיתוח מיומנויות אישיות. באמצעות משחקונים, תרגילי כדור ואתגרים מותאמים, הילדים ישפרו את השליטה בכדור, הדיוק, הזריזות והקואורדינציה, לצד פיתוח חשיבה מהירה וקבלת החלטות בזמן אמת. החוג מעודד עבודת צוות, התמדה, אחריות אישית והצבת מטרות, תוך חיזוק הביטחון העצמי וההנאה מהמשחק. שילוב ייחודי של ספורט וחשיבה שהופך כל אימון לחוויה מאתגרת, מלמדת ומהנה.",
    imageUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    instructor: "מאמן גיא אלון (מאמן כדורגל מוסמך וינגייט)",
    instructorPhone: "053-9988776",
  },
];

// ==========================================
// יצירת חוגי יום שישי לכל בית ספר
// כל חוג רץ על פני 3 שעות (שעה ראשונה, שעה שניה, שעה שלישית)
// בבית ספר יצחק נבון: חוג בישול מולקולרי מתקיים שעתיים רצופות בשעה השניה והשלישית
// ==========================================
export const createSchoolFridayActivities = (
  schoolKey: "ben-shemen" | "yitzhak-navon" | "lapid",
  schoolPrefix: string,
  schoolLocationName: string,
): Activity[] => {
  const allowedMasters = OFFICIAL_MASTER_ACTIVITIES.filter((act) =>
    act.schools.includes(schoolKey),
  );
  const slots: {
    slotNumber: 1 | 2 | 3;
    startTime: string;
    endTime: string;
    label: string;
  }[] = [
    {
      slotNumber: 1,
      startTime: "שעה ראשונה",
      endTime: "",
      label: "שעה ראשונה",
    },
    { slotNumber: 2, startTime: "שעה שניה", endTime: "", label: "שעה שניה" },
    {
      slotNumber: 3,
      startTime: "שעה שלישית",
      endTime: "",
      label: "שעה שלישית",
    },
  ];

  const result: Activity[] = [];

  allowedMasters.forEach((master) => {
    // מיוחד: בישול מולקולרי ביצחק נבון רץ שעתיים רצוף בשעה השניה והשלישית
    if (master.code === "MOLECULAR-COOKING" && schoolKey === "yitzhak-navon") {
      // מופע שעה שניה (חלק א')
      result.push({
        id: `${schoolPrefix}-ACT-${master.code}-S2`,
        name: "בישול מולקולרי (שעתיים רצופות: שעה שניה ושלישית)",
        category: master.category,
        allowedGrades: master.allowedGrades,
        day: "שישי",
        slotNumber: 2,
        startTime: "שעה שניה ושלישית",
        endTime: "",
        location: `${schoolLocationName}`,
        instructor: master.instructor,
        instructorPhone: master.instructorPhone,
        maxCapacity: 20,
        minCapacity: 8,
        description: master.description,
        imageUrl: master.imageUrl,
        status: "active",
      });
      // מופע שעה שלישית (המשך ישיר)
      result.push({
        id: `${schoolPrefix}-ACT-${master.code}-S3`,
        name: "בישול מולקולרי (המשך רצוף משעה שניה)",
        category: master.category,
        allowedGrades: master.allowedGrades,
        day: "שישי",
        slotNumber: 3,
        startTime: "שעה שלישית",
        endTime: "",
        location: `${schoolLocationName}`,
        instructor: master.instructor,
        instructorPhone: master.instructorPhone,
        maxCapacity: 20,
        minCapacity: 8,
        description: master.description,
        imageUrl: master.imageUrl,
        status: "active",
      });
      return;
    }

    // שאר החוגים הרגילים רצים בכל אחת מ-3 השעות
    slots.forEach((slot) => {
      const actId = `${schoolPrefix}-ACT-${master.code}-S${slot.slotNumber}`;
      result.push({
        id: actId,
        name: `${master.name}`,
        category: master.category,
        allowedGrades: master.allowedGrades,
        day: "שישי",
        slotNumber: slot.slotNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: `${schoolLocationName}`,
        instructor: master.instructor,
        instructorPhone: master.instructorPhone,
        maxCapacity: 20,
        minCapacity: 8,
        description: master.description,
        imageUrl: master.imageUrl,
        status: "active",
      });
    });
  });

  return result;
};

export const getOfficialActivitiesForSchool = (
  schoolId: string,
): Activity[] => {
  const s = schoolId.toLowerCase();
  if (s.includes("navon")) {
    return createSchoolFridayActivities(
      "yitzhak-navon",
      "YN",
      'ביה"ס יצחק נבון',
    );
  }
  if (s.includes("lapid")) {
    return createSchoolFridayActivities("lapid", "LP", 'ביה"ס לפיד המ"ד');
  }
  return createSchoolFridayActivities("ben-shemen", "BS", 'ביה"ס בן שמן');
};

// ==========================================
// הגדרת 3 בתי הספר: בן שמן, יצחק נבון, לפיד המ"ד
// ==========================================
export const INITIAL_SCHOOLS: Record<string, SchoolData> = {
  // 1. בית ספר בן שמן (7 חוגים × 3 שעות = 21 קבוצות)
  "sch-ben-shemen": {
    school: {
      id: "sch-ben-shemen",
      name: "בית ספר בן שמן",
      city: "חבל מודיעין - בן שמן",
      symbol: "341290",
      academicYear: 'ביה"ס של העתיד 2026-2027 (תשפ"ז)',
      registrationDeadline: "2026-10-15",
      isOpenForRegistration: true,
      maxCapacityPerActivity: 20,
      fixedProgramCost: 450,
      adminPasswordHash: "1234",
      fridaySlots: [
        {
          id: "slot-1",
          slotNumber: 1,
          label: "שעה ראשונה",
          startTime: "שעה ראשונה",
          endTime: "",
        },
        {
          id: "slot-2",
          slotNumber: 2,
          label: "שעה שניה",
          startTime: "שעה שניה",
          endTime: "",
        },
        {
          id: "slot-3",
          slotNumber: 3,
          label: "שעה שלישית",
          startTime: "שעה שלישית",
          endTime: "",
        },
      ],
      announcement:
        'ברוכים הבאים לתוכנית "ביה"ס של העתיד 2026-2027" בבית ספר בן שמן בהובלת החברה לחינוך, תרבות ופנאי בחבל מודיעין! החוגים יתקיימו החל מ-16.10. כל תלמיד בוחר 3 חוגי יום שישי (חוג אחד לכל שעה: שעה ראשונה, שעה שניה ושעה שלישית). כל חוג פועל על פני 3 קבוצות שונות (שעה לכל קבוצה, עד 20 משתתפים).',
      coordinator: {
        name: "מיכל אהרוני",
        role: "רכזת חוגי שישי - בית ספר בן שמן",
        phone: "050-6646699",
        email: "benshemen.hugim@maagalim.org.il",
        receptionHours: "ימים א'-ה' 08:30 – 15:30, ימי שישי 08:00 – 13:00",
        whatsapp: "972506646699",
        location: 'מזכירות ביה"ס בן שמן / מרכז מעגלים (טל: 03-9722888)',
        notes: "החוגים יתקיימו בבית הספר החל מ-16.10",
      },
    },
    students: [],
    activities: createSchoolFridayActivities(
      "ben-shemen",
      "BS",
      'ביה"ס בן שמן',
    ),
    registrations: [],
    placements: [],
  },

  // 2. בית ספר יצחק נבון (14 חוגים ייחודיים)
  "sch-yitzhak-navon": {
    school: {
      id: "sch-yitzhak-navon",
      name: "בית ספר יצחק נבון",
      city: "חבל מודיעין - יצחק נבון",
      symbol: "519283",
      academicYear: 'ביה"ס של העתיד 2026-2027 (תשפ"ז)',
      registrationDeadline: "2026-10-15",
      isOpenForRegistration: true,
      maxCapacityPerActivity: 20,
      fixedProgramCost: 450,
      adminPasswordHash: "1234",
      fridaySlots: [
        {
          id: "slot-1",
          slotNumber: 1,
          label: "שעה ראשונה",
          startTime: "שעה ראשונה",
          endTime: "",
        },
        {
          id: "slot-2",
          slotNumber: 2,
          label: "שעה שניה",
          startTime: "שעה שניה",
          endTime: "",
        },
        {
          id: "slot-3",
          slotNumber: 3,
          label: "שעה שלישית",
          startTime: "שעה שלישית",
          endTime: "",
        },
      ],
      announcement:
        'ברוכים הבאים לתוכנית "ביה"ס של העתיד 2026-2027" בבית ספר יצחק נבון בהובלת החברה לחינוך, תרבות ופנאי בחבל מודיעין! החוגים יתקיימו החל מ-16.10. מגוון עשיר של 14 חוגים ייחודיים הפועלים ב-3 משבצות יום שישי (שעה ראשונה, שעה שניה ושעה שלישית. חוג בישול מולקולרי מתקיים שעתיים רצופות בשעה השניה והשלישית).',
      coordinator: {
        name: "רונית שמעוני",
        role: "רכזת חוגי שישי - בית ספר יצחק נבון",
        phone: "050-6646699",
        email: "navon.hugim@maagalim.org.il",
        receptionHours: "ימים א'-ה' 08:30 – 15:30, ימי שישי 08:00 – 13:00",
        whatsapp: "972506646699",
        location: 'מזכירות ביה"ס יצחק נבון / מרכז מעגלים (טל: 03-9722888)',
        notes: "החוגים יתקיימו בבית הספר החל מ-16.10",
      },
    },
    students: [],
    activities: createSchoolFridayActivities(
      "yitzhak-navon",
      "YN",
      'ביה"ס יצחק נבון',
    ),
    registrations: [],
    placements: [],
  },

  // 3. בית ספר לפיד המ"ד (12 חוגים × 3 שעות = 36 קבוצות)
  "sch-lapid-hmd": {
    school: {
      id: "sch-lapid-hmd",
      name: 'בית ספר לפיד המ"ד',
      city: "חבל מודיעין - לפיד",
      symbol: "620194",
      academicYear: 'ביה"ס של העתיד 2026-2027 (תשפ"ז)',
      registrationDeadline: "2026-10-15",
      isOpenForRegistration: true,
      maxCapacityPerActivity: 20,
      fixedProgramCost: 450,
      adminPasswordHash: "1234",
      fridaySlots: [
        {
          id: "slot-1",
          slotNumber: 1,
          label: "שעה ראשונה",
          startTime: "שעה ראשונה",
          endTime: "",
        },
        {
          id: "slot-2",
          slotNumber: 2,
          label: "שעה שניה",
          startTime: "שעה שניה",
          endTime: "",
        },
        {
          id: "slot-3",
          slotNumber: 3,
          label: "שעה שלישית",
          startTime: "שעה שלישית",
          endTime: "",
        },
      ],
      announcement:
        'ברוכים הבאים לתוכנית "ביה"ס של העתיד 2026-2027" בבית ספר לפיד המ"ד בהובלת החברה לחינוך, תרבות ופנאי בחבל מודיעין! החוגים יתקיימו החל מ-16.10. 12 חוגים מובילים הפועלים על פני 3 משבצות יום שישי (שעה ראשונה, שעה שניה ושעה שלישית).',
      coordinator: {
        name: "אורית שחר",
        role: 'רכזת חוגי שישי - בית ספר לפיד המ"ד',
        phone: "050-6646699",
        email: "lapid.hugim@maagalim.org.il",
        receptionHours: "ימים א'-ה' 08:30 – 15:30, ימי שישי 08:00 – 13:00",
        whatsapp: "972506646699",
        location: 'מזכירות ביה"ס לפיד המ"ד / מרכז מעגלים (טל: 03-9722888)',
        notes: "החוגים יתקיימו בבית הספר החל מ-16.10",
      },
    },
    students: [],
    activities: createSchoolFridayActivities("lapid", "LPD", 'ביה"ס לפיד המ"ד'),
    registrations: [],
    placements: [],
  },
};
