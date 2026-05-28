import { Solar, Lunar } from 'lunar-javascript';

/**
 * Converts a Solar Date string (DD/MM/YYYY) into Lunar Date with Can Chi,
 * e.g., "19/04/1990" -> "24/03 Canh Ngọ"
 */
export function convertSolarToLunarText(solarDateStr?: string): string {
  if (!solarDateStr) return '';
  
  // Clean string and split by / or -
  const cleanStr = solarDateStr.trim();
  const parts = cleanStr.includes('/') ? cleanStr.split('/') : cleanStr.split('-');
  
  if (parts.length !== 3) return '';
  
  let day = 0;
  let month = 0;
  let year = 0;
  
  if (cleanStr.includes('/')) {
    // DD/MM/YYYY
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else {
    // YYYY-MM-DD
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
  
  // Basic boundary checks
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000 || year > 2150) {
    return '';
  }
  
  try {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    const lDay = lunar.getDay();
    const lMonth = lunar.getMonth();
    const lYear = lunar.getYear();
    
    // Traditional Vietnamese Heavenly Stems (Thiên can) & Earthly Branches (Địa chi)
    const stems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
    const branches = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    
    // Stem index formula
    const stemIdx = (lYear - 4) % 10;
    const branchIdx = (lYear - 4) % 12;
    
    const stemName = stems[stemIdx >= 0 ? stemIdx : stemIdx + 10];
    const branchName = branches[branchIdx >= 0 ? branchIdx : branchIdx + 12];
    const canChiYear = `${stemName} ${branchName}`;
    
    const dStr = lDay < 10 ? `0${lDay}` : `${lDay}`;
    const mStr = Math.abs(lMonth) < 10 ? `0${Math.abs(lMonth)}` : `${Math.abs(lMonth)}`;
    
    // Leap month check: commonly returned as negative in getMonth() or isMonthLeap()
    const leapSuffix = lunar.getMonth() < 0 ? ' (nhuận)' : '';
    
    return `${dStr}/${mStr}${leapSuffix} ${canChiYear}`;
  } catch (error) {
    console.warn('Lunar conversion failure for:', solarDateStr, error);
    return '';
  }
}

/**
 * Decodes the lunar anniversary string into month and day,
 * then calculates the solar date for the current/next year and counts down.
 */
export interface AnniversaryInfo {
  solarDateStr: string;   // e.g., "15/06/2026"
  dayOfWeek: string;      // e.g., "Thứ Hai"
  daysLeft: number;       // e.g., 18 (positive, or 0, or negative if passed)
  isToday: boolean;
  isPassed: boolean;
  nextSolarDateStr?: string;
  nextDayOfWeek?: string;
  nextDaysLeft?: number;
}

export function parseLunarAnniversary(lunarAnniversaryStr?: string): { day: number; month: number } | null {
  if (!lunarAnniversaryStr) return null;
  const str = lunarAnniversaryStr.trim();
  
  const dayMatch = str.match(/Ngày\s+(\d+)/i);
  const monthMatch = str.match(/tháng\s+([^\s\()]+)/i);
  
  if (!dayMatch) return null;
  const day = parseInt(dayMatch[1], 10);
  
  let month = 1;
  if (monthMatch) {
    const mStr = monthMatch[1].toLowerCase().trim();
    if (mStr.includes('giêng')) {
      month = 1;
    } else if (mStr.includes('chạp')) {
      month = 12;
    } else {
      month = parseInt(mStr, 10);
    }
  } else {
    return null;
  }
  
  if (isNaN(day) || isNaN(month)) return null;
  return { day, month };
}

export function getAnniversaryCountdown(lunarAnniversaryStr?: string): AnniversaryInfo | null {
  const parsed = parseLunarAnniversary(lunarAnniversaryStr);
  if (!parsed) return null;
  
  const { day, month } = parsed;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    
    // Convert current year lunar date
    const lunarThisYear = Lunar.fromYmd(currentYear, month, day);
    const solarThisYear = lunarThisYear.getSolar();
    const solarDateThisYear = new Date(solarThisYear.getYear(), solarThisYear.getMonth() - 1, solarThisYear.getDay());
    solarDateThisYear.setHours(0, 0, 0, 0);
    
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const formattedThisYearStr = `${solarThisYear.getDay() < 10 ? '0' : ''}${solarThisYear.getDay()}/${solarThisYear.getMonth() < 10 ? '0' : ''}${solarThisYear.getMonth()}/${solarThisYear.getYear()}`;
    const dayOfWeekThisYear = daysOfWeek[solarDateThisYear.getDay()];
    
    const diffTimeThisYear = solarDateThisYear.getTime() - today.getTime();
    const diffDaysThisYear = Math.round(diffTimeThisYear / (1000 * 60 * 60 * 24));
    
    const isToday = diffDaysThisYear === 0;
    const isPassed = diffDaysThisYear < 0;
    
    let result: AnniversaryInfo = {
      solarDateStr: formattedThisYearStr,
      dayOfWeek: dayOfWeekThisYear,
      daysLeft: diffDaysThisYear,
      isToday,
      isPassed
    };
    
    if (isPassed) {
      // Find next lunar year's occurrence
      const nextYear = currentYear + 1;
      const lunarNextYear = Lunar.fromYmd(nextYear, month, day);
      const solarNextYear = lunarNextYear.getSolar();
      const solarDateNextYear = new Date(solarNextYear.getYear(), solarNextYear.getMonth() - 1, solarNextYear.getDay());
      solarDateNextYear.setHours(0, 0, 0, 0);
      
      const formattedNextYearStr = `${solarNextYear.getDay() < 10 ? '0' : ''}${solarNextYear.getDay()}/${solarNextYear.getMonth() < 10 ? '0' : ''}${solarNextYear.getMonth()}/${solarNextYear.getYear()}`;
      const dayOfWeekNextYear = daysOfWeek[solarDateNextYear.getDay()];
      
      const diffTimeNextYear = solarDateNextYear.getTime() - today.getTime();
      const diffDaysNextYear = Math.round(diffTimeNextYear / (1000 * 60 * 60 * 24));
      
      result.nextSolarDateStr = formattedNextYearStr;
      result.nextDayOfWeek = dayOfWeekNextYear;
      result.nextDaysLeft = diffDaysNextYear;
    }
    
    return result;
  } catch (err) {
    console.warn("Anniversary countdown failure", lunarAnniversaryStr, err);
    return null;
  }
}
