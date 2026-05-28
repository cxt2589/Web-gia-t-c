/**
 * Configuration Manager for GiaPha NinhBinh
 * Manages custom appearance, sizes, button names, APIs, and Google Sheets connectors.
 */

export interface AppConfig {
  // General details
  homeTitle: string;
  homeSubtitle: string;
  footerText: string;

  // Colors & Visual themes
  backgroundImageUrl: string;
  backgroundBlendMode: string;
  primaryColor: string; // Hex for primary button/borders e.g. #8b1c1c
  backgroundColorTint: string; // Solid background tint e.g. #fafaf5
  accentColor: string; // Secondary/Highlights e.g. #7b5800
  textColor: string; // Main text color e.g. #271900

  // Dimensions & Spacing
  treeNodeWidth: number; // e.g., 170
  treeLineThickness: number; // e.g., 2
  treeLineColor: string; // e.g., #7b5800
  treeSpacingX: number; // e.g., 185
  nodeBorderRadius: string; // 'rounded-none' | 'rounded-sm' | 'rounded-md' | 'rounded-full'

  // Button labels & Navigation tabs
  tabTintucLabel: string;
  tabGiaphaLabel: string;
  tabPhakyLabel: string;
  tabTocuocLabel: string;
  tabLichgioLabel: string;
  tabLichamLabel: string;
  tabDashboardLabel: string;

  // Custom branding icon
  brandChar: string; // The character '高' or custom branding logo SVG/URL
  brandLogoUrl: string; // URL for custom branding image if any

  // API Configs
  geminiApiKey: string;
  geminiModelName: string;
  zaloWebhookUrl: string;

  // Google Sheet integration
  googleSheetId: string;
  googleSheetSyncEnabled: boolean;
  googleSheetLastSynced: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  homeTitle: "Họ Cao Ninh Bình",
  homeSubtitle: "Phú Mỹ, Ninh Bình",
  footerText: "Ban liên lạc họ Cao Phú Mỹ, Ninh Bình",

  backgroundImageUrl: "", // Revert to solid, elegant silk-paper background as requested by user
  backgroundBlendMode: "multiply", // multiply / normal / overlay / luminosity
  primaryColor: "#8b1c1c", // traditional red
  backgroundColorTint: "#fafaf5", // pure paper rice
  accentColor: "#7b5800", // brass gold
  textColor: "#271900", // dark ink charcoal

  treeNodeWidth: 170,
  treeLineThickness: 2,
  treeLineColor: "#7b5800",
  treeSpacingX: 185,
  nodeBorderRadius: "rounded-md",

  tabTintucLabel: "Tin tức",
  tabGiaphaLabel: "Gia phả",
  tabPhakyLabel: "Phả ký",
  tabTocuocLabel: "Tộc ước",
  tabLichgioLabel: "Lịch giỗ",
  tabLichamLabel: "Đổi lịch âm",
  tabDashboardLabel: "Quản trị",

  brandChar: "高",
  brandLogoUrl: "",

  geminiApiKey: "",
  geminiModelName: "gemini-2.5-flash",
  zaloWebhookUrl: "",

  googleSheetId: "",
  googleSheetSyncEnabled: false,
  googleSheetLastSynced: ""
};

const LOCAL_STORAGE_KEY = "caogia_app_settings_cfg";

export const getAppSettings = (): AppConfig => {
  try {
    const savedString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedString) return DEFAULT_CONFIG;
    const parsed = JSON.parse(savedString);
    const merged = { ...DEFAULT_CONFIG, ...parsed };
    // Clear old unrequested background image URLs from cached states
    if (merged.backgroundImageUrl === "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=1000") {
      merged.backgroundImageUrl = "";
    }
    return merged;
  } catch (err) {
    console.error("Failed to load settings from localStorage, using defaults:", err);
    return DEFAULT_CONFIG;
  }
};

export const saveAppSettings = (settings: AppConfig): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    // Dispatch a custom event so other components know configs updated
    window.dispatchEvent(new Event("caogia_settings_updated"));
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
  }
};

export const resetAppSettings = (): AppConfig => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
    window.dispatchEvent(new Event("caogia_settings_updated"));
    return DEFAULT_CONFIG;
  } catch (err) {
    console.error("Failed to reset settings:", err);
    return DEFAULT_CONFIG;
  }
};

/**
 * Utility to inject styles on-the-fly dynamically into document head
 */
export const applyConfigToStyles = (config: AppConfig) => {
  const cssId = "caogia-custom-styles-injected";
  let styleEl = document.getElementById(cssId) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = cssId;
    document.head.appendChild(styleEl);
  }

  // Generate dynamic overrides for brand colors and background
  styleEl.innerHTML = `
    :root {
      --primary-color: ${config.primaryColor};
      --bg-tint-color: ${config.backgroundColorTint};
      --accent-color: ${config.accentColor};
      --text-ink-color: ${config.textColor};
    }
    
    /* Override primary background tint */
    #app-root-frame {
      background-color: ${config.backgroundColorTint} !important;
      color: ${config.textColor} !important;
    }
    
    #app-root-frame::before {
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
      opacity: 0.08;
      ${config.backgroundImageUrl ? `background-image: url('${config.backgroundImageUrl}');` : 'display: none !important;'}
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      mix-blend-mode: ${config.backgroundBlendMode};
    }
    
    /* Buttons and text colors */
    .bg-primary {
      background-color: ${config.primaryColor} !important;
    }
    .hover\\:bg-primary-hover:hover {
      background-color: ${config.primaryColor}dd !important;
    }
    .text-primary {
      color: ${config.primaryColor} !important;
    }
    .text-secondary {
      color: ${config.accentColor} !important;
    }
    .bg-secondary {
      background-color: ${config.accentColor} !important;
    }
    .border-primary {
      border-color: ${config.primaryColor} !important;
    }
    .text-ink-charcoal {
      color: ${config.textColor} !important;
    }
  `;
};

// --- Linage tree local persistence ---
const TREE_DATA_STORAGE_KEY = "caogia_persisted_tree_database_v2";

/**
 * Fetch Custom Tree Data from localStorage or fallback to standard system file
 */
export const getPersistedTreeData = (fallbackTree: any): any => {
  try {
    const saved = localStorage.getItem(TREE_DATA_STORAGE_KEY);
    if (!saved) return fallbackTree;
    return JSON.parse(saved);
  } catch (err) {
    console.error("Failed to load persisted family tree data:", err);
    return fallbackTree;
  }
};

/**
 * Persist Custom Tree Data to localStorage
 */
export const savePersistedTreeData = (treeData: any): void => {
  try {
    localStorage.setItem(TREE_DATA_STORAGE_KEY, JSON.stringify(treeData));
    window.dispatchEvent(new Event("caogia_tree_data_updated"));
  } catch (err) {
    console.error("Failed to persist family tree data:", err);
  }
};

/**
 * Hard Reset Tree back to Vietnamese Default lineage file
 */
export const resetPersistedTreeData = (): void => {
  try {
    localStorage.removeItem(TREE_DATA_STORAGE_KEY);
    window.dispatchEvent(new Event("caogia_tree_data_updated"));
  } catch (err) {
    console.error("Failed to reset tree data:", err);
  }
};

export const normalizeName = (name: string): string => {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ");
};

/**
 * Super robust name normalizer for strict family tree matching.
 * Removes accents, capitalizations, trailing spaces, parentheses (e.g. (Thường gọi)),
 * and common Vietnamese honorific titles like "Cụ", "Ông", "Bà", "Trưởng chi"...
 */
export const cleanNameForMatching = (name: string): string => {
  if (!name) return "";
  let clean = name.trim().toLowerCase();
  
  // Remove content in brackets / parentheses
  clean = clean.replace(/\([^)]*\)/g, "");
  
  // Replace dashes/slashes with space
  clean = clean.replace(/[-–—/]/g, " ");
  
  // Normalize accents
  clean = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  
  // Remove titles & honorific prefixes as they can differ between records
  const prefixRegex = /\b(ong|ba|cu|co|ong cu|ba cu|bien nien|co nhan|tien khoi|truong chi|truong toc|phu nhân|ba ca|ba hai|ba ba)\b/g;
  clean = clean.replace(prefixRegex, " ");
  
  // Clean double spaces
  clean = clean.replace(/\s+/g, " ").trim();
  
  return clean;
};

/**
 * Measure similarity between two Vietnamese names (0 to 1).
 * Excellent for suggesting potential parent matches in the spreadsheet setup!
 */
export function getNameSimilarity(name1: string, name2: string): number {
  const n1 = cleanNameForMatching(name1);
  const n2 = cleanNameForMatching(name2);
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;
  if (n1.includes(n2) || n2.includes(n1)) return 0.85;
  
  const words1 = n1.split(" ");
  const words2 = n2.split(" ");
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let intersection = 0;
  for (const w of set1) {
    if (set2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

export function buildTreeFromFlatList(flatList: any[], existingTreeToMerge?: any): any {
  if (flatList.length === 0) return null;

  // Track raw diagnostics
  let totalParsed = 0;
  let virtualChildrenCount = 0;
  const duplicateNameSet = new Set<string>();
  const seenNames = new Map<string, number>();

  // Extract columns based on sequence regions (to handle duplicate "Nơi ở" / "Số điện thoại" correctly)
  const mapVietnameseKeys = (rowObj: Record<string, any>, index: number) => {
    // Already a processed tree node, return it
    if (rowObj.id && rowObj.children && rowObj.generation !== undefined && "gender" in rowObj) {
      return rowObj;
    }

    const getVal = (keys: string[]) => {
      // 1st pass: exact match (after cleaning colons/whitespace and lowercasing)
      for (const k of Object.keys(rowObj)) {
        const cleanK = k.replace(/[:：?()]/g, '').trim().toLowerCase();
        if (keys.includes(cleanK)) {
          return rowObj[k];
        }
      }
      // 2nd pass: substring/containment match with smart guard against matching relative columns
      for (const k of Object.keys(rowObj)) {
        const cleanK = k.replace(/[:：?()]/g, '').trim().toLowerCase();
        if (keys.some(key => cleanK.includes(key))) {
          // Guard: if checking main member attributes, avoid matching relative columns (like "cha", "mẹ", "vợ", "chồng", "con")
          const checkingMain = !keys.some(key => key.includes("cha") || key.includes("mẹ") || key.includes("me") || key.includes("vợ") || key.includes("chồng") || key.includes("con") || key.includes("phối ngẫu"));
          if (checkingMain) {
            const hasRelativeWord = cleanK.includes("cha") || cleanK.includes("mẹ") || cleanK.includes("me") || cleanK.includes("vợ") || cleanK.includes("chồng") || cleanK.includes("con") || cleanK.includes("phối ngẫu");
            if (hasRelativeWord) continue; // Skip to avoid mis-attributing parents' data as child's
          }
          return rowObj[k];
        }
      }
      return "";
    };

    // Helper to query columns inside a specified index boundary in the row headers
    const getValInBounds = (keys: string[], start: number, end: number) => {
      if (!rowObj._headers || !rowObj._rawValues) {
        return getVal(keys); // fallback
      }
      // Exact match bounds first
      for (let i = start; i < end; i++) {
        if (i >= rowObj._headers.length) break;
        const cleanH = rowObj._headers[i].replace(/[:：?()]/g, '').trim().toLowerCase();
        if (keys.includes(cleanH)) {
          return String(rowObj._rawValues[i] || "").trim();
        }
      }
      // Substring match bounds with smart guard
      for (let i = start; i < end; i++) {
        if (i >= rowObj._headers.length) break;
        const cleanH = rowObj._headers[i].replace(/[:：?()]/g, '').trim().toLowerCase();
        if (keys.some(key => cleanH.includes(key))) {
          const checkingMain = !keys.some(key => key.includes("cha") || key.includes("mẹ") || key.includes("me") || key.includes("vợ") || key.includes("chồng") || key.includes("con") || key.includes("phối ngẫu"));
          if (checkingMain) {
            const hasRelativeWord = cleanH.includes("cha") || cleanH.includes("mẹ") || cleanH.includes("me") || cleanH.includes("vợ") || cleanH.includes("chồng") || cleanH.includes("con") || cleanH.includes("phối ngẫu");
            if (hasRelativeWord) continue;
          }
          return String(rowObj._rawValues[i] || "").trim();
        }
      }
      return "";
    };

    const nameVal = getVal(["họ và tên đầy đủ", "họ tên", "tên đầy đủ", "name", "họ và tên"]);
    if (!nameVal || !nameVal.trim()) return null; // Skip empty rows

    totalParsed++;

    // Track duplicates
    const cleanN = cleanNameForMatching(nameVal);
    if (seenNames.has(cleanN)) {
      seenNames.set(cleanN, (seenNames.get(cleanN) || 0) + 1);
      duplicateNameSet.add(nameVal.trim());
    } else {
      seenNames.set(cleanN, 1);
    }

    // Determine boundaries for duplicated headers like "Nơi ở", "Số điện thoại", "Tình trạng"
    let fatherIdx = -1;
    let motherIdx = -1;
    let spouseIdx = -1;
    let child1Idx = -1;

    if (rowObj._headers) {
      for (let i = 0; i < rowObj._headers.length; i++) {
        const cleanH = rowObj._headers[i].trim().toLowerCase();
        if (cleanH.includes("cha ruột") || cleanH === "cha") {
          fatherIdx = i;
        } else if (cleanH.includes("mẹ ruột") || cleanH === "mẹ") {
          motherIdx = i;
        } else if (cleanH.includes("vợ/chồng") || cleanH === "vợ chồng" || cleanH === "vợ" || cleanH === "chồng" || cleanH === "phối ngẫu") {
          spouseIdx = i;
        } else if (cleanH.includes("con ruột 1") || cleanH.startsWith("con 1") || cleanH.includes("con thứ 1")) {
          child1Idx = i;
        }
      }
    }

    // If limits aren't found in succession, default boundaries to full width
    const totalHeaders = rowObj._headers ? rowObj._headers.length : 100;
    const fLimit = fatherIdx !== -1 ? fatherIdx : totalHeaders;
    const mLimit = motherIdx !== -1 ? motherIdx : totalHeaders;
    const sLimit = spouseIdx !== -1 ? spouseIdx : totalHeaders;
    const cLimit = child1Idx !== -1 ? child1Idx : totalHeaders;

    // A. Parse properties of main member
    const genRaw = getVal(["đời thứ mấy", "đời", "thế hệ", "generation", "đời thứ"]);
    let genNum: number | undefined = undefined;
    const genMatch = String(genRaw).match(/\d+/);
    if (genMatch) {
      genNum = parseInt(genMatch[0]);
    } else {
      const num = parseInt(genRaw);
      if (!isNaN(num)) genNum = num;
    }

    // Tình trạng & Status
    const statusVal = getValInBounds(["tình trạng", "status", "con song", "con song/da mat", "mất", "sống/mất"], 0, fLimit);
    let isLiving = true;
    if (statusVal) {
      const lowerStatus = String(statusVal).toLowerCase();
      if (lowerStatus.includes("mất") || lowerStatus.includes("đã mất") || lowerStatus.includes("qua đời") || lowerStatus.includes("khuất") || lowerStatus.includes("tử") || lowerStatus.includes("tạ thế") || lowerStatus.includes("qua doi")) {
        isLiving = false;
      }
    }

    // Years & Birth Date
    const birthYearRaw = getValInBounds(["ngày sinh", "ngày sinh (trên giấy tờ)", "năm sinh", "birthyear", "birth", "ngay sinh", "nam sinh"], 0, fLimit);
    const deathYearRaw = getValInBounds(["ngày tháng năm mất", "năm mất", "ngày mất", "deathyear", "death", "ngày tháng năm mất (dương lịch)", "qua đời ngày"], 0, fLimit);
    
    const solarBirthDate = birthYearRaw ? birthYearRaw.trim() : undefined;
    const solarDeathDate = deathYearRaw ? deathYearRaw.trim() : undefined;

    let birthYear = undefined;
    if (birthYearRaw) {
      const yearMatch = String(birthYearRaw).match(/\b\d{4}\b/);
      birthYear = yearMatch ? yearMatch[0] : birthYearRaw.trim();
    }
    let deathYear = undefined;
    if (deathYearRaw) {
      const yearMatch = String(deathYearRaw).match(/\b\d{4}\b/);
      deathYear = yearMatch ? yearMatch[0] : deathYearRaw.trim();
    }

    if (deathYear && deathYear.trim().length > 0 && deathYear.trim() !== "undefined") {
      isLiving = false;
    }

    const genderRaw = String(getValInBounds(["giới tính", "gender"], 0, fLimit)).toLowerCase();
    const gender = (genderRaw.includes("nữ") || genderRaw.includes("nu") || genderRaw === "female") ? "nữ" : "nam";

    // Standard properties
    const phone1 = getValInBounds(["số điện thoại", "sđt", "phone", "so dien thoai"], 0, fLimit) || undefined;
    const phone2 = getValInBounds(["số điện thoại phụ", "sđt phụ", "sđt 2", "phone 2", "phone2"], 0, fLimit) || undefined;
    const residence = getValInBounds(["nơi ở", "địa chỉ", "residence", "noi o", "dia chi"], 0, fLimit) || undefined;
    const email = getValInBounds(["email"], 0, fLimit) || undefined;
    const burialPlace = getValInBounds(["nơi an táng", "an táng", "burialplace", "mo phan", "mộ phần"], 0, fLimit) || undefined;
    const title = getValInBounds(["tên thường gọi / bí danh / tên tự (nếu có)", "bí danh", "tên thường gọi", "bi danh", "tên tự", "title"], 0, fLimit) || undefined;

    // B. Parse relative family member names
    const fatherName = fatherIdx !== -1 ? getValInBounds(["họ và tên cha ruột", "cha", "father"], fatherIdx, mLimit) || undefined : undefined;
    const motherName = motherIdx !== -1 ? getValInBounds(["họ và tên mẹ ruột", "mẹ", "mother"], motherIdx, sLimit) || undefined : undefined;
    const spouseName = spouseIdx !== -1 ? getValInBounds(["họ và tên vợ/chồng", "vợ/chồng", "vợ", "chồng", "spouse"], spouseIdx, cLimit) || undefined : undefined;

    // Additional relative details parsed directly from child's row
    let _fatherDetails = undefined;
    if (fatherName && fatherName.trim() && fatherIdx !== -1) {
      const fatherResidence = getValInBounds(["nơi ở", "địa chỉ"], fatherIdx, mLimit);
      const fatherPhone = getValInBounds(["số điện thoại", "sđt", "điện thoại"], fatherIdx, mLimit);
      const fatherStatus = getValInBounds(["tình trạng", "trạng thái"], fatherIdx, mLimit);
      const fatherBirth = getValInBounds(["ngày sinh", "năm sinh"], fatherIdx, mLimit);
      const fatherDeath = getValInBounds(["ngày tháng năm mất", "năm mất", "ngày mất"], fatherIdx, mLimit);
      const fatherBurial = getValInBounds(["nơi an táng", "an táng"], fatherIdx, mLimit);

      let fatherIsLiving = true;
      if (fatherStatus) {
        const lowerS = fatherStatus.toLowerCase();
        if (lowerS.includes("mất") || lowerS.includes("đã mất") || lowerS.includes("qua đời") || lowerS.includes("khuất") || lowerS.includes("tử")) {
          fatherIsLiving = false;
        }
      }
      if (fatherDeath && fatherDeath.trim()) {
        fatherIsLiving = false;
      }

      let fatherBirthYear = undefined;
      if (fatherBirth) {
        const yMatch = String(fatherBirth).match(/\b\d{4}\b/);
        fatherBirthYear = yMatch ? yMatch[0] : fatherBirth.trim();
      }
      let fatherDeathYear = undefined;
      if (fatherDeath) {
        const yMatch = String(fatherDeath).match(/\b\d{4}\b/);
        fatherDeathYear = yMatch ? yMatch[0] : fatherDeath.trim();
      }

      _fatherDetails = {
        name: fatherName.trim(),
        birthYear: fatherBirthYear || undefined,
        solarBirthDate: fatherBirth || undefined,
        isLiving: fatherIsLiving,
        deathYear: fatherDeathYear || undefined,
        solarDeathDate: fatherDeath || undefined,
        burialPlace: fatherBurial || undefined,
        deathPlace: fatherBurial || undefined,
        residence: fatherResidence || undefined,
        phone1: fatherPhone || undefined
      };
    }

    let _motherDetails = undefined;
    if (motherName && motherName.trim() && motherIdx !== -1) {
      const motherResidence = getValInBounds(["nơi ở", "địa chỉ"], motherIdx, sLimit);
      const motherPhone = getValInBounds(["số điện thoại", "sđt", "điện thoại"], motherIdx, sLimit);
      const motherStatus = getValInBounds(["tình trạng", "trạng thái"], motherIdx, sLimit);
      const motherBirth = getValInBounds(["ngày sinh", "năm sinh"], motherIdx, sLimit);
      const motherDeath = getValInBounds(["ngày tháng năm mất", "năm mất", "ngày mất"], motherIdx, sLimit);
      const motherBurial = getValInBounds(["nơi an táng", "an táng"], motherIdx, sLimit);

      let motherIsLiving = true;
      if (motherStatus) {
        const lowerS = motherStatus.toLowerCase();
        if (lowerS.includes("mất") || lowerS.includes("đã mất") || lowerS.includes("qua đời") || lowerS.includes("khuất") || lowerS.includes("tử")) {
          motherIsLiving = false;
        }
      }
      if (motherDeath && motherDeath.trim()) {
        motherIsLiving = false;
      }

      let motherBirthYear = undefined;
      if (motherBirth) {
        const yMatch = String(motherBirth).match(/\b\d{4}\b/);
        motherBirthYear = yMatch ? yMatch[0] : motherBirth.trim();
      }
      let motherDeathYear = undefined;
      if (motherDeath) {
        const yMatch = String(motherDeath).match(/\b\d{4}\b/);
        motherDeathYear = yMatch ? yMatch[0] : motherDeath.trim();
      }

      _motherDetails = {
        name: motherName.trim(),
        birthYear: motherBirthYear || undefined,
        solarBirthDate: motherBirth || undefined,
        isLiving: motherIsLiving,
        deathYear: motherDeathYear || undefined,
        solarDeathDate: motherDeath || undefined,
        burialPlace: motherBurial || undefined,
        deathPlace: motherBurial || undefined,
        residence: motherResidence || undefined,
        phone1: motherPhone || undefined
      };
    }

    // C. Process spouse details
    let spouseDetails: any[] = [];
    if (spouseName && spouseName.trim()) {
      const spouseResidence = spouseIdx !== -1 ? getValInBounds(["nơi ở", "địa chỉ"], spouseIdx, cLimit) : "";
      const spousePhone = spouseIdx !== -1 ? getValInBounds(["số điện thoại", "sđt"], spouseIdx, cLimit) : "";
      const spouseStatus = spouseIdx !== -1 ? getValInBounds(["tình trạng", "trạng thái"], spouseIdx, cLimit) : "";
      const spouseBirth = spouseIdx !== -1 ? getValInBounds(["ngày sinh", "năm sinh"], spouseIdx, cLimit) : "";
      const spouseDeath = spouseIdx !== -1 ? getValInBounds(["ngày tháng năm mất", "năm mất", "ngày mất"], spouseIdx, cLimit) : "";
      const spouseBurial = spouseIdx !== -1 ? getValInBounds(["nơi an táng", "an táng"], spouseIdx, cLimit) : "";
      
      let spouseIsLiving = true;
      if (spouseStatus) {
        const lowerStatus = spouseStatus.toLowerCase();
        if (lowerStatus.includes("mất") || lowerStatus.includes("đã mất") || lowerStatus.includes("qua đời") || lowerStatus.includes("khuất")) {
          spouseIsLiving = false;
        }
      }
      if (spouseDeath && spouseDeath.trim()) {
        spouseIsLiving = false;
      }

      let spouseBirthYr = undefined;
      if (spouseBirth) {
        const yMatch = String(spouseBirth).match(/\b\d{4}\b/);
        spouseBirthYr = yMatch ? yMatch[0] : spouseBirth.trim();
      }
      let spouseDeathYr = undefined;
      if (spouseDeath) {
        const yMatch = String(spouseDeath).match(/\b\d{4}\b/);
        spouseDeathYr = yMatch ? yMatch[0] : spouseDeath.trim();
      }

      spouseDetails.push({
        name: spouseName.trim(),
        residence: spouseResidence || undefined,
        phone1: spousePhone || undefined,
        birthYear: spouseBirthYr || undefined,
        solarBirthDate: spouseBirth || undefined,
        isLiving: spouseIsLiving,
        deathYear: spouseDeathYr || undefined,
        solarDeathDate: spouseDeath || undefined,
        burialPlace: spouseBurial || undefined,
        deathPlace: spouseBurial || undefined
      });
    }

    // D. Parse explicit linking IDs
    const explicitIdVal = getVal(["mã số", "id", "mã thành viên", "mã", "ma ma", "ma so", "mã định danh cá nhân", "mã số định danh", "ma dinh danh", "mã số định danh cá nhân", "ma so dinh dan ca nhan"]);
    const id = (explicitIdVal && explicitIdVal !== "undefined" && explicitIdVal.trim().length > 0) 
      ? String(explicitIdVal).trim() 
      : (rowObj.id ? String(rowObj.id).trim() : `tv-${index + 1}`);

    const explicitParentVal = getVal(["mã cha", "mã số cha", "mã cha ruột", "mã người giám hộ", "parent id", "mã số cha ruột", "ma so cha", "ma cha", "parentid", "mã mẹ", "ma me", "ma so cha ruot"]);
    const parentId = (explicitParentVal && explicitParentVal !== "undefined" && explicitParentVal.trim().length > 0)
      ? String(explicitParentVal).trim()
      : (rowObj.parentId ? String(rowObj.parentId).trim() : undefined);

    return {
      id,
      name: nameVal.trim(),
      generation: genNum, // might be undefined initially, resolved topologically!
      _explicitGeneration: genNum, // Explicitly keep parsed generation for topological safety
      gender,
      birthYear: (birthYear && birthYear !== "undefined") ? birthYear : undefined,
      deathYear: (deathYear && deathYear !== "undefined") ? deathYear : undefined,
      solarBirthDate,
      solarDeathDate,
      isLiving,
      title,
      spouse: spouseName,
      spouseDetails,
      phone1,
      phone2,
      email,
      residence,
      burialPlace,
      parentId,
      fatherName,
      motherName,
      children: [],
      _fatherDetails,
      _motherDetails,
      _headers: rowObj._headers,
      _rawValues: rowObj._rawValues
    };
  };

  let normalizedNodes: any[] = [];
  flatList.forEach((r, idx) => {
    const node = mapVietnameseKeys(r, idx);
    if (node) {
      normalizedNodes.push(node);
    }
  });

  if (existingTreeToMerge) {
    const existingFlat = flattenTreeToList(existingTreeToMerge);
    normalizedNodes = mergeFlatLists(existingFlat, normalizedNodes);
  }

  const nodeMap: Record<string, any> = {};
  normalizedNodes.forEach((node) => {
    nodeMap[node.id] = node;
  });

  // Extract nested children from standard "Họ và tên con ruột X" columns
  normalizedNodes.forEach((node) => {
    if (!node._headers || !node._rawValues) return;
    
    node._headers.forEach((h: string, colIdx: number) => {
      const cleanHeader = h.trim().toLowerCase();
      // Inspect columns for "Họ và tên con ruột X" or "Con ruột X"
      if (cleanHeader.includes("con ruột") || cleanHeader.startsWith("con ")) {
        const childName = (node._rawValues[colIdx] || "").trim();
        // Skip placeholders
        if (childName && childName !== "undefined" && !childName.toLowerCase().includes("con ruột") && !childName.includes("Họ và tên")) {
          // Find next column's value if it's "giới tính" or "gender"
          let childGender = "nam";
          if (colIdx + 1 < node._headers.length) {
            const nextHeader = node._headers[colIdx + 1].trim().toLowerCase();
            if (nextHeader.includes("giới tính") || nextHeader === "gender") {
              const genderVal = (node._rawValues[colIdx + 1] || "").trim().toLowerCase();
              if (genderVal.includes("nữ") || genderVal.includes("nu") || genderVal === "female") {
                childGender = "nữ";
              }
            }
          }

          // Check if this child already has their OWN row in the database
          const alreadyHasOwnRow = normalizedNodes.some(n => 
            cleanNameForMatching(n.name) === cleanNameForMatching(childName) &&
            (n.generation === undefined || Math.abs(n.generation - ((node.generation || 1) + 1)) <= 1)
          );

          if (!alreadyHasOwnRow) {
            const virtualChildId = `virtual-${node.id}-child-${colIdx}`;
            
            // Check to avoid duplicate virtual child nodes
            if (!nodeMap[virtualChildId]) {
              const virtualChildNode = {
                id: virtualChildId,
                name: childName,
                generation: node.generation ? node.generation + 1 : undefined,
                gender: childGender,
                parentId: node.id,
                isLiving: true,
                children: []
              };
              
              nodeMap[virtualChildId] = virtualChildNode;
              normalizedNodes.push(virtualChildNode);
              virtualChildrenCount++;
            }
          }
        }
      }
    });
  });

  // Resolve parentId using fatherName or motherName if parentId is absent
  normalizedNodes.forEach((node) => {
    if (!node.parentId) {
      const father = node.fatherName ? String(node.fatherName).trim() : "";
      const mother = node.motherName ? String(node.motherName).trim() : "";

      if (father) {
        // Find father candidate with best name match of previous generation (or closest)
        let parentCandidate = normalizedNodes.find(p => 
          cleanNameForMatching(p.name) === cleanNameForMatching(father) && 
          p.generation !== undefined && node.generation !== undefined && p.generation === node.generation - 1
        );
        if (!parentCandidate) {
          parentCandidate = normalizedNodes.find(p => 
            cleanNameForMatching(p.name) === cleanNameForMatching(father)
          );
        }
        if (parentCandidate) {
          node.parentId = parentCandidate.id;
        }
      } else if (mother) {
        let parentCandidate = normalizedNodes.find(p => 
          cleanNameForMatching(p.name) === cleanNameForMatching(mother) && 
          p.generation !== undefined && node.generation !== undefined && p.generation === node.generation - 1
        );
        if (!parentCandidate) {
          parentCandidate = normalizedNodes.find(p => 
            cleanNameForMatching(p.name) === cleanNameForMatching(mother)
          );
        }
        if (parentCandidate) {
          node.parentId = parentCandidate.id;
        }
      }
    }
  });

  // Post-processing: Merge parent & spouse details from child rows to parent nodes
  normalizedNodes.forEach((node) => {
    const parentId = node.parentId;
    if (parentId && nodeMap[parentId]) {
      const fatherNode = nodeMap[parentId];

      // 1. Merge Father details parsed from child row
      if (node._fatherDetails && node._fatherDetails.name) {
        const fd = node._fatherDetails;
        if (!fatherNode.birthYear && fd.birthYear) {
          fatherNode.birthYear = fd.birthYear;
        }
        if (!fatherNode.solarBirthDate && fd.solarBirthDate) {
          fatherNode.solarBirthDate = fd.solarBirthDate;
        }
        if (fatherNode.isLiving === true && fd.isLiving === false) {
          fatherNode.isLiving = false;
        }
        if (!fatherNode.deathYear && fd.deathYear) {
          fatherNode.deathYear = fd.deathYear;
        }
        if (!fatherNode.solarDeathDate && fd.solarDeathDate) {
          fatherNode.solarDeathDate = fd.solarDeathDate;
        }
        if (!fatherNode.burialPlace && fd.burialPlace) {
          fatherNode.burialPlace = fd.burialPlace;
        }
        if (!fatherNode.residence && fd.residence) {
          fatherNode.residence = fd.residence;
        }
        if (!fatherNode.phone1 && fd.phone1) {
          fatherNode.phone1 = fd.phone1;
        }
      }

      // 2. Merge Mother details parsed from child row into father's spouseDetails
      if (node._motherDetails && node._motherDetails.name) {
        const md = node._motherDetails;
        if (!fatherNode.spouseDetails) {
          fatherNode.spouseDetails = [];
        }

        const cleanMName = md.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
        let existingSpouse = fatherNode.spouseDetails.find((s: any) => {
          const sName = s.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
          return sName === cleanMName || sName.includes(cleanMName) || cleanMName.includes(sName);
        });

        if (existingSpouse) {
          if (!existingSpouse.birthYear && md.birthYear) {
            existingSpouse.birthYear = md.birthYear;
          }
          if (!existingSpouse.solarBirthDate && md.solarBirthDate) {
            existingSpouse.solarBirthDate = md.solarBirthDate;
          }
          if (existingSpouse.isLiving !== false && md.isLiving === false) {
            existingSpouse.isLiving = false;
          }
          if (!existingSpouse.deathYear && md.deathYear) {
            existingSpouse.deathYear = md.deathYear;
          }
          if (!existingSpouse.solarDeathDate && md.solarDeathDate) {
            existingSpouse.solarDeathDate = md.solarDeathDate;
          }
          if (!existingSpouse.burialPlace && md.burialPlace) {
            existingSpouse.burialPlace = md.burialPlace;
            existingSpouse.deathPlace = md.burialPlace;
          }
          if (!existingSpouse.residence && md.residence) {
            existingSpouse.residence = md.residence;
          }
          if (!existingSpouse.phone1 && md.phone1) {
            existingSpouse.phone1 = md.phone1;
          }
        } else {
          fatherNode.spouseDetails.push({
            name: md.name,
            birthYear: md.birthYear,
            solarBirthDate: md.solarBirthDate,
            isLiving: md.isLiving,
            deathYear: md.deathYear,
            solarDeathDate: md.solarDeathDate,
            burialPlace: md.burialPlace,
            deathPlace: md.burialPlace,
            residence: md.residence,
            phone1: md.phone1
          });

          if (!fatherNode.spouse) {
            fatherNode.spouse = md.name;
          } else {
            const spousesList = fatherNode.spouse.split(/[,\/;\-\+]+/).map((s: string) => s.trim()).filter(Boolean);
            if (!spousesList.some((s: string) => s.toLowerCase() === md.name.toLowerCase())) {
              fatherNode.spouse = `${fatherNode.spouse}, ${md.name}`;
            }
          }
        }
      }
    }
  });

  // Clear existing children lists to rebuild clean hierarchical connections
  normalizedNodes.forEach(node => {
    node.children = [];
  });

  // Build parent-child tree hierarchy
  const leavesTrack = new Set<string>(); // Tracks nodes that are children of someone
  
  normalizedNodes.forEach((node) => {
    const parentId = node.parentId;
    if (parentId && nodeMap[parentId]) {
      // Ensure child list elements are fully unique
      const exists = nodeMap[parentId].children.some((c: any) => c.id === node.id || cleanNameForMatching(c.name) === cleanNameForMatching(node.name));
      if (!exists) {
        nodeMap[parentId].children.push(node);
      }
      leavesTrack.add(node.id);
    }
  });

  // Helper: Is a node listed as a spouse of another node in the flat array?
  const isSpouseOfSomeone = (candidate: any) => {
    return normalizedNodes.some(n => 
      n.id !== candidate.id && 
      (cleanNameForMatching(n.spouse || "") === cleanNameForMatching(candidate.name) ||
       (n.spouseDetails && n.spouseDetails.some((s: any) => cleanNameForMatching(s.name) === cleanNameForMatching(candidate.name))))
    );
  };

  // Find absolute roots: nodes that have no parents and are NOT spouses of someone else
  const absoluteRoots = normalizedNodes.filter(node => 
    (!node.parentId || !nodeMap[node.parentId]) && 
    !isSpouseOfSomeone(node)
  );

  // Topological Generation propagation: Automatically compute missing generations
  const visitedNodes = new Set<string>();
  const propagateGeneration = (node: any, currentGen: number) => {
    if (!node || visitedNodes.has(node.id)) return;
    visitedNodes.add(node.id);
    
    // Prioritize explicit generation from sheet if present and valid
    if (node._explicitGeneration !== undefined && node._explicitGeneration > 0) {
      node.generation = node._explicitGeneration;
    } else if (node.generation !== undefined && node.generation > 0) {
      // already set
    } else {
      node.generation = currentGen;
    }
    
    const nextGen = (node.generation || 1) + 1;
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        const childStartGen = (child._explicitGeneration && child._explicitGeneration > 0)
          ? child._explicitGeneration
          : nextGen;
        propagateGeneration(child, childStartGen);
      });
    }
  };

  // Propagate generations starting from our absolute roots
  absoluteRoots.forEach((rootNode) => {
    const parentParsedGen = rootNode._explicitGeneration || rootNode.generation;
    const startGen = (parentParsedGen && parentParsedGen > 0) ? parentParsedGen : 1;
    propagateGeneration(rootNode, startGen);
  });

  // Re-verify that all nodes have a generation assigned (topological fallback for any orphans)
  normalizedNodes.forEach((node) => {
    if (node.generation === undefined) {
      node.generation = (node._explicitGeneration && node._explicitGeneration > 0) ? node._explicitGeneration : 1;
    }
  });

  // Select a singular finalRoot
  let finalRoot: any = null;
  if (absoluteRoots.length > 1) {
    // Elegant Multi-branch support! Create a virtual Ancestral root to link disconnected branches.
    const virtualGrandRoot = {
      id: "virtual-grand-root",
      name: "Khởi Tổ / Đồng Tông",
      generation: 1,
      gender: "nam",
      title: "HỘI ĐỒNG GIA TỘC DÒNG HỌ",
      isLiving: false,
      children: absoluteRoots,
      _isVirtualRoot: true
    };
    
    // Intelligent shift: do NOT collapse G9 roots down to G2! 
    const shiftedVisited = new Set<string>();
    const shiftGen = (n: any, parentGen: number) => {
      if (!n || shiftedVisited.has(n.id)) return;
      shiftedVisited.add(n.id);
      
      // If node already has a valid explicit/computed generation that is greater than parentGen, protect it!
      if (n.generation === undefined || n.generation <= parentGen) {
        n.generation = parentGen + 1;
      }
      
      if (n.children) {
        n.children.forEach((c: any) => shiftGen(c, n.generation));
      }
    };
    absoluteRoots.forEach((rootNode) => {
      shiftGen(rootNode, 1); // virtualGrandRoot is generation 1, so roots should be at least generation 2
    });
    
    finalRoot = virtualGrandRoot;
  } else {
    finalRoot = absoluteRoots[0] || normalizedNodes[0];
  }

  // E. DIAGNOSTICS GENERATOR (Linked to raw original data validation)
  const unlinkedNodes: any[] = [];
  normalizedNodes.forEach(node => {
    // If the node is not the root, and not linked as a child, and not the virtual root itself
    if (node.id !== finalRoot.id && !leavesTrack.has(node.id) && !node.id.startsWith("virtual-") && !isSpouseOfSomeone(node)) {
      const potentialParents = normalizedNodes
        .filter(p => p.generation === node.generation - 1)
        .map(p => ({
          id: p.id,
          name: p.name,
          similarity: getNameSimilarity(p.name, node.fatherName || node.motherName || "")
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      unlinkedNodes.push({
        id: node.id,
        name: node.name,
        generation: node.generation,
        fatherName: node.fatherName,
        motherName: node.motherName,
        potentialParents: potentialParents.filter(p => p.similarity > 0.1 || potentialParents.indexOf(p) === 0)
      });
    }
  });

  finalRoot._diagnostics = {
    totalParsed,
    virtualChildrenCount,
    duplicateNames: Array.from(duplicateNameSet),
    unlinkedNodes
  };

  return finalRoot;
}

/**
 * Custom Simple CSV Row parser supporting commas, tabs, semicolons, and quotes
 */
export function parseCSVToObjects(csvText: string): any[] {
  // Strip UTF-8 Byte Order Mark (BOM) if present from Excel files
  if (csvText.startsWith("\ufeff")) {
    csvText = csvText.slice(1);
  }

  const lines: string[] = [];
  let isInsideQuote = false;
  let currentLine = "";

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      isInsideQuote = !isInsideQuote;
    } else if ((char === '\n' || char === '\r') && !isInsideQuote) {
      if (char === '\r' && csvText[i+1] === '\n') {
        i++; // skip LF
      }
      lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length < 2) return [];

  // Determine actual delimiter dynamically based on header frequency
  let delimiter = ",";
  const firstLine = lines[0];
  if (firstLine.includes("\t") && firstLine.split("\t").length > firstLine.split(",").length) {
    delimiter = "\t";
  } else if (firstLine.includes(";") && firstLine.split(";").length > firstLine.split(",").length) {
    delimiter = ";";
  }

  // Parse row cells taking care of quotes and custom delimiter
  const parseRowCells = (lineStr: string): string[] => {
    const cells: string[] = [];
    let cell = "";
    let insideQuote = false;
    for (let c = 0; c < lineStr.length; c++) {
      const char = lineStr[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        cells.push(cell.replace(/^["']|["']$/g, '').trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell.replace(/^["']|["']$/g, '').trim());
    return cells;
  };

  const headers = parseRowCells(lines[0]);

  const results: any[] = [];
  for (let l = 1; l < lines.length; l++) {
    const line = lines[l].trim();
    if (!line) continue;

    const values = parseRowCells(line);

    // Map columns to raw string map object
    const rowObj: Record<string, any> = {};
    headers.forEach((header, index) => {
      const val = values[index] || "";
      rowObj[header] = val;
    });

    // Store raw headers and values for index-safe querying
    rowObj._headers = headers;
    rowObj._rawValues = values;

    results.push(rowObj);
  }

  return results;
}

/**
 * Traverses a hierarchical family tree and flattens it back into an array of member node objects.
 */
export function flattenTreeToList(root: any): any[] {
  if (!root) return [];
  const list: any[] = [];
  const visited = new Set<string>();

  const traverse = (node: any) => {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);

    // Create a flat representation of this node, excluding visual and recursive structures
    const { children, _diagnostics, ...rest } = node;
    
    // Skip virtual root node from entering the database
    if (node.id !== "virtual-grand-root") {
      list.push(rest);
    }

    if (children && Array.isArray(children)) {
      children.forEach((c: any) => traverse(c));
    }
  };

  traverse(root);
  return list;
}

/**
 * Intelligent list-merging algorithm: merges newly fetched Google Sheet / CSV rows
 * with existing ones. It updates existing members (identified by ID or name) and appends new ones.
 */
export function mergeFlatLists(existingList: any[], newList: any[]): any[] {
  const mergedList = [...existingList];

  newList.forEach((newNode) => {
    if (!newNode || !newNode.name) return;

    // Find index of matching existing node
    const matchIdx = mergedList.findIndex((oldNode) => {
      // Prioritize explicit ID match if available and not virtual
      if (newNode.id && oldNode.id && !newNode.id.startsWith("virtual-") && !oldNode.id.startsWith("virtual-") && newNode.id === oldNode.id) {
        return true;
      }
      // Fallback: match by normalized names
      return cleanNameForMatching(oldNode.name) === cleanNameForMatching(newNode.name);
    });

    if (matchIdx !== -1) {
      // Merge values into the existing entry
      const oldNode = mergedList[matchIdx];
      const mergedObj = { ...oldNode };

      Object.keys(newNode).forEach((key) => {
        const newVal = newNode[key];
        
        // Skip properties that are undefined or blank strings
        if (newVal !== undefined && newVal !== null && String(newVal).trim() !== "" && newVal !== "undefined") {
          // Special merge logic for spouseDetails arrays
          if (key === "spouseDetails" && Array.isArray(newVal) && newVal.length > 0) {
            const currentSpouses = mergedObj.spouseDetails ? [...mergedObj.spouseDetails] : [];
            newVal.forEach((ns) => {
              const sMatchIdx = currentSpouses.findIndex(os => cleanNameForMatching(os.name) === cleanNameForMatching(ns.name));
              if (sMatchIdx !== -1) {
                // Merge spouse properties
                currentSpouses[sMatchIdx] = { ...currentSpouses[sMatchIdx], ...ns };
              } else {
                currentSpouses.push(ns);
              }
            });
            mergedObj.spouseDetails = currentSpouses;
          } else {
            mergedObj[key] = newVal;
          }
        }
      });

      mergedList[matchIdx] = mergedObj;
    } else {
      // Append if no match was found
      mergedList.push(newNode);
    }
  });

  return mergedList;
}

