import React from 'react';
import { Solar, Lunar } from 'lunar-javascript';
import { Calendar, RefreshCw, Sun, Moon, Info, Compass, HelpCircle, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Vietnamese translators for Lunar data computed natively from Pinyin/Zhi keys to minimize Chinese transliteration patterns
const GAN_MAP: Record<string, string> = {
  'jia': 'Giáp', 'yi': 'Ất', 'bing': 'Bính', 'ding': 'Đinh', 'wu': 'Mậu',
  'ji': 'Kỷ', 'geng': 'Canh', 'xin': 'Tân', 'ren': 'Nhâm', 'gui': 'Quý'
};

const ZHI_MAP: Record<string, string> = {
  'zi': 'Tý', 'chou': 'Sửu', 'yin': 'Dần', 'mao': 'Mão', 'chen': 'Thìn', 'si': 'Tị',
  'wu': 'Ngọ', 'wei': 'Mùi', 'shen': 'Thân', 'you': 'Dậu', 'xu': 'Tuất', 'hai': 'Hợi'
};

const toVietnameseGanChi = (gan: string, zhi: string): string => {
  const g = GAN_MAP[gan.toLowerCase()] || '';
  const z = ZHI_MAP[zhi.toLowerCase()] || '';
  return g && z ? `${g} ${z}` : (g || z || '');
};

const getZodiacAnimal = (zhi: string): string => {
  const ANIMAL_MAP: Record<string, string> = {
    'zi': 'Chuột', 'chou': 'Trâu', 'yin': 'Hổ', 'mao': 'Mèo', 'chen': 'Rồng', 'si': 'Rắn',
    'wu': 'Ngựa', 'wei': 'Dê', 'shen': 'Khỉ', 'you': 'Gà', 'xu': 'Chó', 'hai': 'Heo'
  };
  return ANIMAL_MAP[zhi.toLowerCase()] || zhi;
};

const getHyThanDirection = (dayGan: string): string => {
  const gan = dayGan.toLowerCase();
  if (['jia', 'ji'].includes(gan)) return 'Đông Bắc';
  if (['yi', 'geng'].includes(gan)) return 'Tây Bắc';
  if (['bing', 'xin'].includes(gan)) return 'Tây Nam';
  if (['ding', 'ren'].includes(gan)) return 'Chính Nam';
  if (['wu', 'gui'].includes(gan)) return 'Đông Nam';
  return 'Đông Nam';
};

const getTaiThanDirection = (dayGan: string): string => {
  const gan = dayGan.toLowerCase();
  if (['jia', 'yi'].includes(gan)) return 'Đông Nam';
  if (['bing', 'ding'].includes(gan)) return 'Chính Đông';
  if (gan === 'wu') return 'Chính Bắc';
  if (gan === 'ji') return 'Chính Nam';
  if (['geng', 'xin'].includes(gan)) return 'Chính Tây';
  if (gan === 'ren') return 'Tây Bắc';
  if (gan === 'gui') return 'Chính Nam';
  return 'Chính Nam';
};

const translateJieQi = (str: string): string => {
  if (!str || str === 'Không có') return 'Không có';
  const map: Record<string, string> = {
    '立春': 'Lập Xuân', '雨水': 'Vũ Thủy', '惊蛰': 'Kinh Trập', '春分': 'Xuân Phân',
    '清明': 'Thanh Minh', '谷雨': 'Cốc Vũ', '立夏': 'Lập Hạ', '小满': 'Tiểu Mãn',
    '芒种': 'Mang Chủng', '夏至': 'Hạ Chí', '小暑': 'Tiểu Thử', '大暑': 'Đại Thử',
    '立秋': 'Lập Thu', '处暑': 'Xử Thử', '白露': 'Bạch Lộ', '秋分': 'Thu Phân',
    '寒露': 'Hàn Lộ', '霜降': 'Sương Giáng', '立冬': 'Lập Đông', '小雪': 'Tiểu Tuyết',
    '大雪': 'Đại Tuyết', '冬至': 'Đông Chí', '小寒': 'Tiểu Hàn', '大寒': 'Đại Hàn'
  };
  return map[str] || str;
};

export default function LichAmSection() {
  const [direction, setDirection] = React.useState<'solar2lunar' | 'lunar2solar'>('solar2lunar');

  // Input States
  const today = new Date();
  const [sDay, setSDay] = React.useState<number>(today.getDate());
  const [sMonth, setSMonth] = React.useState<number>(today.getMonth() + 1);
  const [sYear, setSYear] = React.useState<number>(today.getFullYear());

  const [lDay, setLDay] = React.useState<number>(15);
  const [lMonth, setLMonth] = React.useState<number>(8);
  const [lYear, setLYear] = React.useState<number>(today.getFullYear());
  const [lIsLeap, setLIsLeap] = React.useState<boolean>(false);

  // Results
  const [conversionResult, setConversionResult] = React.useState<any>(null);

  // Generate Year, Month, Day array sequences for drop downs
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 151 }, (_, i) => 1900 + i); // 1900 to 2050

  const handleConvert = React.useCallback(() => {
    try {
      if (direction === 'solar2lunar') {
        const now = new Date();
        const solar = Solar.fromYmdHms(sYear, sMonth, sDay, now.getHours(), now.getMinutes(), now.getSeconds());
        const lunar = solar.getLunar();

        // Parse details in native Vietnamese and compute directions programmatically
        const yearLabel = toVietnameseGanChi(lunar.getYearGan(), lunar.getYearZhi());
        const monthLabel = toVietnameseGanChi(lunar.getMonthGan(), lunar.getMonthZhi());
        const dayLabel = toVietnameseGanChi(lunar.getDayGan(), lunar.getDayZhi());
        const hourLabel = toVietnameseGanChi(lunar.getTimeGan(), lunar.getTimeZhi());

        // Auspicious directions
        const positionXi = getHyThanDirection(lunar.getDayGan()); // Compass directions
        const positionCai = getTaiThanDirection(lunar.getDayGan());

        // Solar term
        const jieQi = translateJieQi(lunar.getJieQi() || "Không có");

        // Zodiac hours computed statically by day branch for maximum offline reliability
        const dayZhi = lunar.getDayZhi();
        let zioHours: string[] = [];
        if (['zi', 'wu', '子', '午'].includes(dayZhi)) {
          zioHours = ["Tý (23h-1h)", "Sửu (1h-3h)", "Mão (5h-7h)", "Ngọ (11h-13h)", "Thân (15h-17h)", "Dậu (17h-19h)"];
        } else if (['chou', 'wei', '丑', '未'].includes(dayZhi)) {
          zioHours = ["Dần (3h-5h)", "Mão (5h-7h)", "Tị (9h-11h)", "Thân (15h-17h)", "Tuất (19h-21h)", "Hợi (21h-23h)"];
        } else if (['yin', 'shen', '寅', '申'].includes(dayZhi)) {
          zioHours = ["Tý (23h-1h)", "Sửu (1h-3h)", "Thìn (7h-9h)", "Tị (9h-11h)", "Mùi (13h-15h)", "Tuất (19h-21h)"];
        } else if (['mao', 'you', '卯', '酉'].includes(dayZhi)) {
          zioHours = ["Tý (23h-1h)", "Dần (3h-5h)", "Mão (5h-7h)", "Ngọ (11h-13h)", "Mùi (13h-15h)", "Dậu (17h-19h)"];
        } else if (['chen', 'xu', '辰', '戌'].includes(dayZhi)) {
          zioHours = ["Dần (3h-5h)", "Thìn (7h-9h)", "Tị (9h-11h)", "Thân (15h-17h)", "Dậu (17h-19h)", "Hợi (21h-23h)"];
        } else { // si, hai, 巳, 亥
          zioHours = ["Sửu (1h-3h)", "Thìn (7h-9h)", "Ngọ (11h-13h)", "Mùi (13h-15h)", "Tuất (19h-21h)", "Hợi (21h-23h)"];
        }

        setConversionResult({
          source: `Dương lịch: Ngày ${sDay}/${sMonth}/${sYear}`,
          targetType: 'Lunar',
          day: lunar.getDay(),
          month: Math.abs(lunar.getMonth()),
          isLeap: lunar.getMonth() < 0,
          year: lunar.getYear(),
          canChiYear: yearLabel,
          canChiMonth: monthLabel,
          canChiDay: dayLabel,
          currentHourCanChi: hourLabel,
          directions: { xi: positionXi, cai: positionCai },
          term: jieQi,
          zodiacHours: zioHours,
          solarObject: solar,
          lunarObject: lunar
        });
      } else {
        // Lunar to Solar
        const lunarObj = Lunar.fromYmd(lYear, lMonth, lDay);
        const solarObj = lunarObj.getSolar();

        const yearLabel = toVietnameseGanChi(lunarObj.getYearGan(), lunarObj.getYearZhi());
        const monthLabel = toVietnameseGanChi(lunarObj.getMonthGan(), lunarObj.getMonthZhi());
        const dayLabel = toVietnameseGanChi(lunarObj.getDayGan(), lunarObj.getDayZhi());

        setConversionResult({
          source: `Âm lịch: Ngày ${lDay}/${lMonth}/${lYear} ${lIsLeap ? '(Nhuận)' : ''}`,
          targetType: 'Solar',
          day: solarObj.getDay(),
          month: solarObj.getMonth(),
          year: solarObj.getYear(),
          canChiYear: yearLabel,
          canChiMonth: monthLabel,
          canChiDay: dayLabel,
          term: translateJieQi(lunarObj.getJieQi() || "Không có"),
          zodiacHours: [],
          directions: { xi: getHyThanDirection(lunarObj.getDayGan()), cai: getTaiThanDirection(lunarObj.getDayGan()) },
          solarObject: solarObj,
          lunarObject: lunarObj
        });
      }
    } catch (err) {
      console.error(err);
      alert("Phát hiện ngày không hợp lệ. Vui lòng kiểm tra lại số ngày trong tháng!");
    }
  }, [direction, sDay, sMonth, sYear, lDay, lMonth, lYear, lIsLeap]);

  // Run on mount
  React.useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  return (
    <div className="space-y-8 animate-fade-in" id="lunar-calendar-converter-root">
      
      {/* Editorial Title Banner */}
      <div className="text-center md:text-left space-y-2 border-b border-[#8c716e]/15 pb-6">
        <span className="text-xs font-mono tracking-widest text-secondary uppercase font-bold">Thần cơ dị toán</span>
        <h2 className="font-serif text-3xl font-extrabold text-primary tracking-tight">
          Bộ Quy Đổi Lịch m - Dương
        </h2>
        <p className="text-xs md:text-sm text-ink-charcoal/70 leading-relaxed font-sans max-w-2xl">
          Công cụ dịch chuyển cổ lịch Việt Nam phục vụ việc định chế giỗ chạp, lễ nghi, hiếu hỉ, tra cứu phong thủy và thời thần hằng ngày thuận tiện nhất cho dòng họ và khách viếng.
        </p>
      </div>

      {/* Grid: Inputs left, detailed results right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input form card */}
        <div className="lg:col-span-5 bg-white border border-[#8c716e]/15 rounded p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Convert Direction Switcher Button */}
            <div className="flex bg-silk-paper p-1 rounded-sm border border-[#8c716e]/10">
              <button
                onClick={() => {
                  setDirection('solar2lunar');
                  setConversionResult(null);
                }}
                className={`flex-1 py-2 text-xs font-sans font-bold rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                  direction === 'solar2lunar' 
                    ? 'bg-primary text-silk-paper shadow' 
                    : 'text-ink-charcoal hover:text-primary hover:bg-white/50'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Dương lịch ➜ m lịch</span>
              </button>
              
              <button
                onClick={() => {
                  setDirection('lunar2solar');
                  setConversionResult(null);
                }}
                className={`flex-1 py-2 text-xs font-sans font-bold rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                  direction === 'lunar2solar' 
                    ? 'bg-primary text-silk-paper shadow' 
                    : 'text-ink-charcoal hover:text-primary hover:bg-white/50'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>m lịch ➜ Dương lịch</span>
              </button>
            </div>

            {/* Input Selection Block */}
            {direction === 'solar2lunar' ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-primary font-serif font-bold text-sm">
                  <Sun className="w-4 h-4 text-amber-600 animate-spin-slow" />
                  <span>Cập nhật ngày Dương lịch cần quy đổi</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Ngày</label>
                    <select
                      value={sDay}
                      onChange={(e) => setSDay(parseInt(e.target.value))}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    >
                      {days.map(d => <option key={d} value={d}>Ngày {d}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Tháng</label>
                    <select
                      value={sMonth}
                      onChange={(e) => setSMonth(parseInt(e.target.value))}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    >
                      {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Năm</label>
                    <select
                      value={sYear}
                      onChange={(e) => setSYear(parseInt(e.target.value))}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    >
                      {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-primary font-serif font-bold text-sm">
                  <Moon className="w-4 h-4 text-indigo-700" />
                  <span>Cập nhật ngày m lịch cần quy đổi</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Ngày âm</label>
                    <select
                      value={lDay}
                      onChange={(e) => setLDay(parseInt(e.target.value))}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>Ngày {d}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Tháng âm</label>
                    <select
                      value={lMonth}
                      onChange={(e) => setLMonth(parseInt(e.target.value))}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    >
                      {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Năm âm</label>
                    <select
                      value={lYear}
                      onChange={(e) => setLYear(parseInt(e.target.value))}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    >
                      {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-silk-paper p-2.5 rounded border border-[#8c716e]/10 mt-1">
                  <input
                    type="checkbox"
                    id="lIsLeapCheckbox"
                    checked={lIsLeap}
                    onChange={(e) => setLIsLeap(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary border-[#8c716e]/30 cursor-pointer"
                  />
                  <label htmlFor="lIsLeapCheckbox" className="text-xs font-sans text-ink-charcoal/80 cursor-pointer select-none">
                    Tháng này là <strong>tháng Nhuận</strong> (Leap Month)
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-[#8c716e]/10 space-y-3">
            <button
              onClick={handleConvert}
              className="w-full py-2.5 bg-[#8b1c1c] hover:bg-[#a02222] text-silk-paper rounded font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
              <span>BẮT ĐẦU QUY ĐỔI CHI TIẾT</span>
            </button>
            
            <button
              onClick={() => {
                const now = new Date();
                setSDay(now.getDate());
                setSMonth(now.getMonth() + 1);
                setSYear(now.getFullYear());
                setDirection('solar2lunar');
                setTimeout(handleConvert, 50);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-ink-charcoal border border-slate-300 rounded font-sans font-medium text-xs transition-all flex items-center justify-center"
            >
              Chọn ngày hôm nay
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Results display card */}
        <div className="lg:col-span-7 space-y-6">
          {conversionResult ? (
            <div className="bg-white border border-primary/25 rounded-md p-6 shadow-md shadow-primary/5 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

              {/* Conversion Big Card */}
              <div className="border-b border-[#8c716e]/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono tracking-wider font-extrabold text-[#7b5800] uppercase block">
                    {conversionResult.source}
                  </span>
                  <h3 className="font-serif text-xl font-black text-primary mt-1">
                    {conversionResult.targetType === 'Lunar' ? (
                      <span>
                        Kết quả m Lịch: <strong className="text-primary text-2xl">Ngày {conversionResult.day}</strong> tháng {conversionResult.month} {conversionResult.isLeap ? '(Nhuận)' : ''}
                      </span>
                    ) : (
                      <span>
                        Kết quả Dương Lịch: <strong className="text-primary text-2xl">Ngày {conversionResult.day}/{conversionResult.month}/{conversionResult.year}</strong>
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="bg-amber-100 text-[#7b5800] border border-amber-300/40 py-1.5 px-3 rounded text-center shrink-0">
                  <span className="text-[9px] font-mono font-bold uppercase block tracking-wide">Năm m Lịch</span>
                  <span className="text-xs font-serif font-bold text-[#5c4000]">{conversionResult.canChiYear} (Tuổi {getZodiacAnimal(conversionResult.lunarObject.getYearZhi())})</span>
                </div>
              </div>

              {/* Grid detail blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Traditional Can Chi values */}
                <div className="bg-silk-paper/60 border border-[#8c716e]/10 rounded p-4 space-y-2.5">
                  <span className="text-xs font-serif font-extrabold text-[#8b1c1c] border-b border-[#8c716e]/10 pb-1 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>Lục Thập Hoa Giáp</span>
                  </span>
                  
                  <div className="text-xs font-sans space-y-1.5 text-ink-charcoal/85">
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Giờ hiện tại:</span>
                      <strong className="font-serif">{conversionResult.currentHourCanChi || 'Không rõ'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Ngày Can Chi:</span>
                      <strong className="font-serif">{conversionResult.canChiDay}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Tháng Can Chi:</span>
                      <strong className="font-serif">{conversionResult.canChiMonth}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Năm Can Chi:</span>
                      <strong className="font-serif">{conversionResult.canChiYear}</strong>
                    </p>
                  </div>
                </div>

                {/* Weather & Feng Shui */}
                <div className="bg-silk-paper/60 border border-[#8c716e]/10 rounded p-4 space-y-2.5">
                  <span className="text-xs font-serif font-extrabold text-[#8b1c1c] border-b border-[#8c716e]/10 pb-1 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Tiết Khí & Cát Hướng</span>
                  </span>
                  
                  <div className="text-xs font-sans space-y-1.5 text-ink-charcoal/85">
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Tiết khí hiện thời:</span>
                      <strong className="text-emerald-800">{conversionResult.term}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Hướng Hỷ Thần:</span>
                      <strong className="text-indigo-800">{conversionResult.directions?.xi || 'Đông Nam'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Hướng Tài Thần:</span>
                      <strong className="text-amber-800">{conversionResult.directions?.cai || 'Chính Nam'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-charcoal/60">Thú linh cai quản:</span>
                      <strong>Tuổi {getZodiacAnimal(conversionResult.lunarObject.getYearZhi())}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Zodiac hours block */}
              {conversionResult.zodiacHours && conversionResult.zodiacHours.length > 0 && (
                <div className="bg-amber-50/40 border border-amber-300/25 rounded p-4 space-y-2">
                  <span className="text-xs font-serif font-bold text-[#7b5800] block">
                    ⏰ Khung giờ Hoàng Đạo cát lành trong ngày ({conversionResult.canChiDay}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {conversionResult.zodiacHours.map((zh: string, idx: number) => (
                      <span 
                        key={idx}
                        className="text-[11px] font-sans font-semibold bg-white border border-amber-300/40 px-2.5 py-1 text-amber-900 rounded-sm shadow-sm"
                      >
                        {zh}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanatory notes */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 flex gap-3 text-slate-800">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold">Văn hóa phong tục học họ Cao:</p>
                  <p className="text-slate-600 mt-0.5">
                    Theo quy tắc phong tục dòng họ xứ Ninh Bình, lễ bái hoặc chuẩn bị việc giỗ chạp chi phái nên tiến hành ưu tiên vào các khung giờ Hoàng Đạo trên để gia phả đượm phúc đức, gia tộc hưng vượng.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#8c716e]/10 rounded-md p-10 text-center text-ink-charcoal/55 italic">
              Vui lòng cập nhật các bộ chọn ngày và nhấn nút "Bắt đầu quy đổi" để xem kết quả phong tục học.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
