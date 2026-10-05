export function getAppsScriptCode(): string {
  return `/**
 * מערכת שיבוץ חוגים אוטומטית - Google Apps Script
 * מתאים לקובץ Google Sheets עם 4 הטאבים:
 * 1. Eligible_Students
 * 2. Activities
 * 3. Registrations
 * 4. Placements
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎯 שיבוץ חוגים בית-ספרי')
    .addItem('🚀 הפעל שיבוץ אוטומטי מלא', 'runMatchingEngine')
    .addItem('🧹 נקה תוצאות שיבוץ קודמות', 'clearPlacements')
    .addItem('📊 הפק דוח סטטיסטיקות', 'generateStatsReport')
    .addToUi();
}

function runMatchingEngine() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eligibleSheet = ss.getSheetByName('Eligible_Students');
  const activitiesSheet = ss.getSheetByName('Activities');
  const registrationsSheet = ss.getSheetByName('Registrations');
  let placementsSheet = ss.getSheetByName('Placements');

  if (!placementsSheet) {
    placementsSheet = ss.insertSheet('Placements');
  }

  // 1. קריאת זכאים
  const eligibleData = eligibleSheet.getDataRange().getValues();
  const eligibleMap = new Map();
  for (let i = 1; i < eligibleData.length; i++) {
    const id = String(eligibleData[i][0]).trim();
    const isAuth = String(eligibleData[i][4]).trim() === 'מאושר' || eligibleData[i][4] === true;
    eligibleMap.set(id, {
      name: eligibleData[i][1] + ' ' + eligibleData[i][2],
      grade: eligibleData[i][3],
      isAuthorized: isAuth
    });
  }

  // 2. קריאת חוגים
  const actData = activitiesSheet.getDataRange().getValues();
  const activities = new Map();
  const capacityLeft = new Map();
  for (let i = 1; i < actData.length; i++) {
    const actId = String(actData[i][0]).trim();
    const actName = String(actData[i][1]).trim();
    const maxCap = Number(actData[i][6]) || 15;
    const minCap = Number(actData[i][7]) || 6;
    activities.set(actId, { id: actId, name: actName, maxCap, minCap });
    capacityLeft.set(actId, maxCap);
  }

  // 3. קריאת רישומים
  const regData = registrationsSheet.getDataRange().getValues();
  const registrations = [];
  for (let i = 1; i < regData.length; i++) {
    const studentId = String(regData[i][1]).trim();
    registrations.push({
      timestamp: new Date(regData[i][0]),
      studentId: studentId,
      parentName: regData[i][2],
      phone: regData[i][3],
      p1: String(regData[i][4]).trim(),
      p2: String(regData[i][5]).trim(),
      p3: String(regData[i][6]).trim()
    });
  }

  // סדר לפי זמן (כל הקודם זוכה)
  registrations.sort((a, b) => a.timestamp - b.timestamp);

  const placements = [];
  const assignedStudents = new Set();
  const waitlists = {};

  // סבב עדיפות 1
  for (const reg of registrations) {
    const student = eligibleMap.get(reg.studentId);
    if (!student || !student.isAuthorized) {
      placements.push([reg.studentId, student ? student.name : 'לא ידוע', student ? student.grade : '', 'נדחה', 'לא שובץ', 'אי זכאות במערכת']);
      assignedStudents.add(reg.studentId);
      continue;
    }

    if (capacityLeft.has(reg.p1) && capacityLeft.get(reg.p1) > 0) {
      capacityLeft.set(reg.p1, capacityLeft.get(reg.p1) - 1);
      assignedStudents.add(reg.studentId);
      const act = activities.get(reg.p1);
      placements.push([reg.studentId, student.name, student.grade, act ? act.name : reg.p1, 'שובץ בהצלחה', 'עדיפות 1']);
    }
  }

  // סבב עדיפות 2
  for (const reg of registrations) {
    if (assignedStudents.has(reg.studentId)) continue;
    const student = eligibleMap.get(reg.studentId);

    if (capacityLeft.has(reg.p2) && capacityLeft.get(reg.p2) > 0) {
      capacityLeft.set(reg.p2, capacityLeft.get(reg.p2) - 1);
      assignedStudents.add(reg.studentId);
      const act = activities.get(reg.p2);
      placements.push([reg.studentId, student.name, student.grade, act ? act.name : reg.p2, 'שובץ בהצלחה', 'עדיפות 2']);
    }
  }

  // סבב עדיפות 3
  for (const reg of registrations) {
    if (assignedStudents.has(reg.studentId)) continue;
    const student = eligibleMap.get(reg.studentId);

    if (reg.p3 && capacityLeft.has(reg.p3) && capacityLeft.get(reg.p3) > 0) {
      capacityLeft.set(reg.p3, capacityLeft.get(reg.p3) - 1);
      assignedStudents.add(reg.studentId);
      const act = activities.get(reg.p3);
      placements.push([reg.studentId, student.name, student.grade, act ? act.name : reg.p3, 'שובץ בהצלחה', 'עדיפות 3']);
    }
  }

  // רשימות המתנה לנותרים
  for (const reg of registrations) {
    if (assignedStudents.has(reg.studentId)) continue;
    const student = eligibleMap.get(reg.studentId);
    const p1Act = activities.get(reg.p1);
    placements.push([reg.studentId, student.name, student.grade, p1Act ? p1Act.name : reg.p1, 'רשימת המתנה', 'ממתין למקום פנוי']);
  }

  // כתיבה לגיליון Placements
  placementsSheet.clear();
  placementsSheet.appendRow(['תעודת זהות תלמיד', 'שם מלא', 'כיתה', 'חוג משובץ', 'סטטוס', 'הערות שיבוץ']);
  
  if (placements.length > 0) {
    placementsSheet.getRange(2, 1, placements.length, 6).setValues(placements);
  }

  // עיצוב כותרת
  placementsSheet.getRange('A1:F1').setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
  placementsSheet.autoResizeColumns(1, 6);

  SpreadsheetApp.getUi().alert('השיבוץ האוטומטי הושלם בהצלחה! התוצאות נשמרו בטאב Placements.');
}

function clearPlacements() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Placements');
  if (sheet) {
    sheet.clear();
    sheet.appendRow(['תעודת זהות תלמיד', 'שם מלא', 'כיתה', 'חוג משובץ', 'סטטוס', 'הערות שיבוץ']);
  }
}
`;
}
