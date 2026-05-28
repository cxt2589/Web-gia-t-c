import React from 'react';
import { 
  Folder, FolderOpen, Save, RefreshCw, FileText, Image, Sliders, Palette, Link, 
  HelpCircle, CheckCircle, AlertTriangle, Play, HelpCircle as QuestionIcon, Plus, Eye, Key, Send
} from 'lucide-react';
import { 
  AppConfig, getAppSettings, saveAppSettings, resetAppSettings, 
  getPersistedTreeData, savePersistedTreeData, resetPersistedTreeData,
  parseCSVToObjects, buildTreeFromFlatList, flattenTreeToList, mergeFlatLists, DEFAULT_CONFIG
} from '../utils/configManager';
import { ANCESTRAL_TREE } from '../data/lineageData';

export default function AdminDashboardSection() {
  // Admin Login gate state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState<boolean>(() => {
    return localStorage.getItem("caogia_admin_authorized") === "true";
  });
  const [passwordInput, setPasswordInput] = React.useState("");
  const [loginError, setLoginError] = React.useState("");

  // App Settings States
  const [settings, setSettings] = React.useState<AppConfig>(getAppSettings());
  const [isSaved, setIsSaved] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{type: 'success'|'error'|'idle', msg: string}>({type: 'idle', msg: ''});
  const [syncMode, setSyncMode] = React.useState<'overwrite' | 'merge'>('overwrite');

  // Flat JSON file backup input
  const [rawLineageInput, setRawLineageInput] = React.useState("");
  const [treeImportMsg, setTreeImportMsg] = React.useState("");

  // Synchronizer diagnostics state
  const [diagnostics, setDiagnostics] = React.useState<any>(() => {
    const currentTree = getPersistedTreeData(ANCESTRAL_TREE);
    return currentTree?._diagnostics || null;
  });

  // Collapsible Categories (Folder structure)
  // Initially we open the first folder, others closed
  const [openFolders, setOpenFolders] = React.useState<Record<string, boolean>>({
    'sheettree': true,
    'appearance': false,
    'buttons': false,
    'apis': false
  });

  const toggleFolder = (key: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin" || passwordInput === "123456" || passwordInput === "caogia2026") {
      setIsAdminLoggedIn(true);
      localStorage.setItem("caogia_admin_authorized", "true");
      setLoginError("");
    } else {
      setLoginError("Mật khẩu Quản trị không chính xác! Thử lại '123456'.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem("caogia_admin_authorized");
  };

  const handleSaveSettings = () => {
    saveAppSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetSettings = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại tất cả màu sắc, hình ảnh và cài đặt giao diện về ban đầu?")) {
      const def = resetAppSettings();
      setSettings(def);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  // Google Sheet Synchronize function via direct CSV download endpoint
  const handleSyncGoogleSheet = async () => {
    if (!settings.googleSheetId.trim()) {
      setSyncStatus({type: 'error', msg: 'Vui lòng nhập ID Google Sheet hợp lệ!'});
      return;
    }

    setIsSyncing(true);
    setSyncStatus({type: 'idle', msg: 'Đang kết nối cổng Google Sheets API...'});

    try {
      // Step A: Format CSV direct-download URL based on sheet ID
      const sheetIdClean = settings.googleSheetId.trim();
      // Supports standard sheet ID extraction from full link
      let finalId = sheetIdClean;
      if (sheetIdClean.includes("docs.google.com/spreadsheets")) {
        const matches = sheetIdClean.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
          finalId = matches[1];
        }
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${finalId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("Không thể truy xuất dữ liệu Sheet. Đảm bảo Sheet đã được đặt quyền Chia sẻ ở chế độ 'Bất kỳ ai có liên kết đều xem được' (Anyone with link can view).");
      }

      const csvText = await response.text();
      const rows = parseCSVToObjects(csvText);

      if (rows.length === 0) {
        throw new Error("Tập tin CSV rỗng hoặc không đúng định dạng cột tiêu đề!");
      }

      // Convert flat rows to structured hierarchy
      const existingTreeToMerge = syncMode === 'merge' ? getPersistedTreeData(ANCESTRAL_TREE) : undefined;
      const newTreeData = buildTreeFromFlatList(rows, existingTreeToMerge);
      if (!newTreeData || !newTreeData.id) {
        throw new Error("Thuật toán dựng cây thất bại. Đảm bảo có dòng với thế hệ (generation) là 1 hoặc chỉ định parentId chính xác.");
      }

      // Save sync tree data to storage
      savePersistedTreeData(newTreeData);

      // Save settings state
      const updatedSettings = {
        ...settings,
        googleSheetId: finalId,
        googleSheetSyncEnabled: true,
        googleSheetLastSynced: new Date().toLocaleString('vi-VN')
      };
      setSettings(updatedSettings);
      saveAppSettings(updatedSettings);

      // Save diagnostics to state
      if (newTreeData._diagnostics) {
        setDiagnostics(newTreeData._diagnostics);
      }

      setSyncStatus({
        type: 'success', 
        msg: `Đồng bộ thành công! Tìm thấy ${rows.length} thành viên chi dòng họ trong Sheet. Cây phả hệ đã tự động cập nhật.`
      });
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        type: 'error', 
        msg: err.message || 'Lỗi bất định khi phân giải dữ liệu bảng tính.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetTreeDatabase = () => {
    if (window.confirm("Đặt lại phả hệ về bộ dữ liệu gốc Ninh Bình mặc định ban đầu?")) {
      resetPersistedTreeData();
      setRawLineageInput("");
      const freshTree = getPersistedTreeData(ANCESTRAL_TREE);
      setDiagnostics(freshTree?._diagnostics || null);
      setSyncStatus({type: 'success', msg: 'Khôi phục phả hệ gốc thành công!'});
      setTimeout(() => setSyncStatus({type: 'idle', msg: ''}), 3000);
    }
  };

  const handleClearAllTreeData = () => {
    if (window.confirm("🔴 CẢNH BÁO QUAN TRỌNG: Quý vị có chắc chắn muốn XÓA SẠCH HOÀN TOÀN toàn bộ phả hệ hiện tại để nhập lại từ đầu không? Hành động này sẽ xóa hết tất cả thành viên cũ (bao gồm cả dữ liệu mẫu) và không thể hoàn tác.")) {
      const emptyTree = {
        id: "empty-root",
        name: "Người Sáng Lập Dòng Họ (Nhập từ đầu)",
        generation: 1,
        gender: "nam",
        title: "Sáng Lập Tổ",
        isLiving: false,
        children: []
      };
      savePersistedTreeData(emptyTree);
      setRawLineageInput("");
      setDiagnostics(null);
      setSyncStatus({type: 'success', msg: 'Đã xóa trắng toàn bộ dữ liệu thành công! Hãy dán liên kết Google Sheet mới của quý vị để đồng bộ sạch sẽ.'});
      setTimeout(() => setSyncStatus({type: 'idle', msg: ''}), 5000);
    }
  };

  const handleExportTreeJson = () => {
    const currentTree = getPersistedTreeData(ANCESTRAL_TREE);
    setRawLineageInput(JSON.stringify(currentTree, null, 2));
    setTreeImportMsg("Sao chép chuỗi JSON bên dưới để sao lưu.");
  };

  const handleImportTreeJson = () => {
    try {
      const parsed = JSON.parse(rawLineageInput);
      if (!parsed || !parsed.id || !parsed.name) {
        throw new Error("Chuỗi dữ liệu bị thiếu trường id hoặc name chính!");
      }
      savePersistedTreeData(parsed);
      setTreeImportMsg("Nhập phả hệ thủ công thành công! Hệ thống đã tải dữ liệu mới.");
    } catch (err: any) {
      setTreeImportMsg("Lỗi phân giải JSON: " + err.message);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-[#8c716e]/15 shadow-2xl rounded p-8 space-y-6" id="admin-login-view-hub">
        <div className="text-center space-y-2">
          <span className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Sliders className="w-6 h-6" />
          </span>
          <h2 className="font-serif text-2xl font-bold text-primary">Đăng Nhập Quản Trị</h2>
          <p className="text-xs text-ink-charcoal/60 leading-relaxed font-sans">
            Bảng cấu hình dành riêng cho Ban liên lạc dòng họ để hiệu chỉnh màu sắc giao diện, nút bấm, sơ đồ cây và cổng API.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-sans font-bold text-ink-charcoal/70 uppercase">Mật khẩu admin</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu quản quản trị..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full text-sm p-2.5 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal placeholder-ink-charcoal/30"
              required
            />
            <p className="text-[10px] text-primary/75 italic">
              *Mật khẩu dùng thử nhanh: <strong>123456</strong> hoặc <strong>admin</strong>
            </p>
          </div>

          {loginError && (
            <div className="text-xs text-primary font-medium bg-primary/5 p-2 rounded border border-primary/25">
              ⚠️ {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#8b1c1c] hover:bg-[#a02222] text-silk-paper rounded font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>KÍCH HOẠT HỆ THỐNG</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="admin-dashboard-full-view">
      
      {/* Editorial Title Header Banner */}
      <div className="text-center md:text-left space-y-2 border-b border-[#8c716e]/15 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#7b5800] uppercase font-bold">Trang quan chức dòng tộc</span>
          <h2 className="font-serif text-3xl font-extrabold text-primary tracking-tight">
            Nội Phủ Tông tộc Dashboard 📜
          </h2>
          <p className="text-xs md:text-sm text-ink-charcoal/70 leading-relaxed font-sans max-w-2xl">
            Cơ sở quản trị chuyên sâu. Mọi cập nhật sẽ thay đổi cấu trúc thẩm mỹ, màu sắc, chế độ hòa trộn hình ảnh, kích thước của cây phả hệ, tên thanh nút bấm, liên kết với Google Sheets và các API thông minh.
          </p>
        </div>

        <button
          onClick={handleAdminLogout}
          className="px-3.5 py-1.5 self-center bg-slate-800 hover:bg-slate-700 text-silk-paper rounded font-sans font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 border border-slate-700"
        >
          Đăng xuất Admin 🔐
        </button>
      </div>

      {/* Main Configurations container formatted as clean folder categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Folders list */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* FOLDER 1: Sheets tree data sync */}
          <div className="border border-[#8c716e]/15 rounded bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => toggleFolder('sheettree')}
              className="w-full p-4 bg-slate-50 flex items-center justify-between border-b border-[#8c716e]/10 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3 text-primary font-serif font-bold text-sm md:text-base">
                {openFolders['sheettree'] ? (
                  <FolderOpen className="w-5.5 h-5.5 text-[#7b5800]" />
                ) : (
                  <Folder className="w-5.5 h-5.5 text-[#7b5800]" />
                )}
                <span>1. 📁 Quản trị Phả hệ & Đồng bộ Google Sheets</span>
              </div>
              <span className="text-[10px] font-mono text-ink-charcoal/40 font-bold uppercase">
                {openFolders['sheettree'] ? 'Thu gọn ▲' : 'Mở rộng ▼'}
              </span>
            </button>

            {openFolders['sheettree'] && (
              <div className="p-5 space-y-6 animate-fade-in bg-white">
                
                {/* Sheets Synchronizer Card Block */}
                <div className="bg-emerald-50/50 border border-emerald-300 rounded p-4 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-950 font-serif font-black text-sm">
                    <Link className="w-4 h-4 text-emerald-800" />
                    <span>Nguồn dữ liệu Phả hệ trực tiếp</span>
                  </div>

                  <p className="text-[11px] text-emerald-900/80 leading-relaxed font-sans space-y-1">
                    <span>Hệ thống hỗ trợ nạp dữ liệu gia phả trực tiếp từ một trang <strong>Google Sheets</strong> trực tuyến. Để đồng bộ, hãy đặt chế độ chia sẻ Google Sheet là <strong>"Bất kỳ ai có liên kết đều có thể xem"</strong> rồi dán ID hoặc nguyên liên kết của trang đó vào ô dưới đây.</span>
                    <br />
                    <span className="block mt-1 text-[10px] text-emerald-850 bg-emerald-100/50 p-2 rounded border border-emerald-200/45">
                      💡 <strong>Mẹo nhỏ cực kỳ quan trọng:</strong> 
                      <br />- Google Sheets sẽ luôn xuất dữ liệu từ <strong>trang bảng tính (tab) đầu tiên bên trái ngoài cùng</strong>. Hãy chắc chắn di chuyển tab chứa bảng gia phả của bạn về vị trí số 1.
                      <br />- Hệ thống đã tự động lọc các ký tự Byte Order Mark (BOM) sinh ra khi lưu file từ Excel tiếng Việt, đồng thời tự vẽ phả hệ và tự cân chỉnh thế hệ (Đời) một cách thông minh bằng thuật toán tự liên kết Cha - Con, giúp cây thẳng hàng ngay cả khi Sheet bị thiếu thông tin thế hệ.
                    </span>
                  </p>

                  {/* Select Sync / Import Mode */}
                  <div className="space-y-2 border-t border-b border-emerald-200/50 py-3">
                    <label className="text-[10px] font-mono font-bold text-emerald-950/70 uppercase block mb-1">
                      Chế độ nhập dữ liệu dòng tộc
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Overwrite mode card */}
                      <button
                        type="button"
                        onClick={() => setSyncMode('overwrite')}
                        className={`text-left p-3 rounded border transition-all flex flex-col justify-between ${
                          syncMode === 'overwrite'
                            ? 'bg-[#ffebee]/65 border-red-400 shadow-sm ring-1 ring-red-400/10'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="sync_mode"
                            id="sync_mode_overwrite"
                            checked={syncMode === 'overwrite'}
                            onChange={() => setSyncMode('overwrite')}
                            className="bg-white border-slate-300 text-red-600 focus:ring-red-400 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className={`text-xs font-bold font-sans ${syncMode === 'overwrite' ? 'text-red-950' : 'text-slate-700'}`}>
                            🗑️ GHI ĐÈ & NHẬP LẠI (Xóa sạch cũ)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 lines-normal font-sans">
                          Hệ thống sẽ hoàn toàn xóa sạch tất cả thành viên trong phả hệ cũ và vẽ lại thành lập từ đầu dựa theo dữ liệu Sheet chuẩn hiện tại.
                        </span>
                      </button>

                      {/* Merge/Append mode card */}
                      <button
                        type="button"
                        onClick={() => setSyncMode('merge')}
                        className={`text-left p-3 rounded border transition-all flex flex-col justify-between ${
                          syncMode === 'merge'
                            ? 'bg-[#e3f2fd]/65 border-blue-400 shadow-sm ring-1 ring-blue-400/10'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="sync_mode"
                            id="sync_mode_merge"
                            checked={syncMode === 'merge'}
                            onChange={() => setSyncMode('merge')}
                            className="bg-white border-slate-300 text-blue-600 focus:ring-blue-400 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className={`text-xs font-bold font-sans ${syncMode === 'merge' ? 'text-blue-950' : 'text-slate-700'}`}>
                            📝 SỬA & BỔ SUNG (Gộp thông tin)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 lines-normal font-sans">
                          Giữ lại toàn bộ dữ liệu đang có, cập nhật thêm thành viên mới dán vào hoặc hoàn thiện thuộc tính/tiểu sử của người đang có nếu dán trùng.
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-emerald-950/70 uppercase">Google Sheet ID hoặc Đường dẫn đường truyền</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Dán ID Sheet (ví dụ: 1aBcDeFgHiJkLmNoP...)"
                        value={settings.googleSheetId}
                        onChange={(e) => setSettings({...settings, googleSheetId: e.target.value})}
                        className="flex-1 text-xs font-sans p-2 bg-white border border-emerald-300 rounded focus:outline-none focus:border-emerald-700 text-ink-charcoal"
                      />
                      <button
                        onClick={handleSyncGoogleSheet}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded text-xs font-sans font-bold flex items-center gap-1 shadow-sm shrink-0 transition-colors"
                      >
                        {isSyncing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>ĐỒNG BỘ NGAY</span>
                      </button>
                    </div>
                  </div>

                  {settings.googleSheetLastSynced && (
                    <p className="text-[10px] font-mono text-emerald-800/70">
                      📅 Lần đồng bộ cuối: <strong>{settings.googleSheetLastSynced}</strong>
                    </p>
                  )}

                  {syncStatus.msg && (
                    <div className={`p-3 rounded text-xs border ${
                      syncStatus.type === 'success' 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-950' 
                        : syncStatus.type === 'error'
                          ? 'bg-red-50 border-red-200 text-red-950'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                    }`}>
                      {syncStatus.type === 'success' ? '✓' : '⚠️'} {syncStatus.msg}
                    </div>
                  )}
                </div>

                {/* Instructions Accordion details on headers layout */}
                <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 text-ink-charcoal/80 text-xs shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                    <span className="font-serif font-bold text-primary flex items-center gap-1.5 text-xs">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>Hướng dẫn thiết lập các cột tương thích trên Google Sheet</span>
                    </span>
                    <a
                      href="/mau-excel-gia-pha-chuan.csv"
                      download="mau-excel-gia-pha-chuan.csv"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10.5px] font-sans font-extrabold shadow-sm hover:shadow transition-all shrink-0 cursor-pointer text-center"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>📥 TẢI FILE MẪU EXCEL CHUẨN (.CSV)</span>
                    </a>
                  </div>
                  
                  <div className="space-y-1.5 leading-relaxed font-sans text-slate-700 text-[11px]">
                    <p className="font-semibold text-slate-800 text-xs bg-amber-50 rounded border border-amber-100 p-2 text-[11px] leading-relaxed">
                      💡 <strong>Lời khuyên hữu ích:</strong> Quý vị hãy tải file mẫu chuẩn của chúng tôi bằng nút phía trên, mở bằng Microsoft Excel hoặc Google Sheets để điền thông tin đúng cột mẫu. Hệ thống tự động nhận diện các cột không phụ thuộc thứ tự sắp xếp!
                    </p>
                    <p>Để nhận diện chuẩn từng nhánh, hãy lập các cột tại dòng đầu tiên của bảng tính (Sheet1) theo đúng tên bên dưới (chữ thường hoặc chữ hoa):</p>
                    <div className="bg-white border rounded p-2.5 font-mono text-[10px] grid grid-cols-2 md:grid-cols-4 gap-1.5 text-slate-800">
                      <div>• id <span className="text-slate-400 font-sans">(Mã tự đặt, duy nhất)</span></div>
                      <div>• name <span className="text-slate-400 font-sans">(Họ và tên đầy đủ)</span></div>
                      <div>• generation <span className="text-slate-400 font-sans">(Số đời: 1, 2, 3...)</span></div>
                      <div>• parentId <span className="text-slate-400 font-sans">(Mã id của cha mẹ)</span></div>
                      <div>• gender <span className="text-slate-400 font-sans">(nam / nữ)</span></div>
                      <div>• birthYear <span className="text-slate-400 font-sans">(Năm sinh)</span></div>
                      <div>• deathYear <span className="text-slate-400 font-sans">(Năm mất)</span></div>
                      <div>• spouse <span className="text-slate-400 font-sans">(Tên Vợ/Chồng)</span></div>
                      <div>• rankRole <span className="text-slate-400 font-sans">(Danh xưng phả cổ)</span></div>
                      <div>• description <span className="text-slate-400 font-sans">(Ghi chú lịch sử)</span></div>
                      <div>• phone1 <span className="text-slate-400 font-sans">(Số điện thoại)</span></div>
                      <div>• isLiving <span className="text-slate-400 font-sans">(true / false)</span></div>
                    </div>
                    <p className="text-slate-400 italic">Ví dụ: id 'gen1-1' tên 'Cao Đại Lang' có parentId là để trống. Hậu duệ đời 2 sẽ có id 'gen2-1' và parentId là 'gen1-1'.</p>
                  </div>
                </div>

                {/* ADVANCED LINKAGE DIAGNOSTICS & SYNC ANALYTICS */}
                {diagnostics && (
                  <div className="border border-[#8c716e]/20 rounded-lg overflow-hidden bg-slate-50 p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-[#8c716e]/10 pb-3">
                      <div>
                        <h4 className="font-serif font-black text-xs md:text-sm text-primary uppercase">
                          📊 Công Cụ Báo Cáo Liên Kết & Phân Tích Phả Hệ
                        </h4>
                        <p className="text-[10px] text-ink-charcoal/60">
                          Bản tin kiểm soát chất lượng dữ liệu Google Sheet của dòng họ
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase bg-emerald-100 text-emerald-800">
                        Hệ thống tự động khớp
                      </span>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 border border-slate-200 rounded text-center">
                        <div className="text-[10px] font-mono text-ink-charcoal/50 uppercase">Thành viên nạp</div>
                        <div className="text-xl font-bold text-slate-800">{diagnostics.totalParsed || 0}</div>
                      </div>
                      <div className="bg-white p-3 border border-slate-200 rounded text-center">
                        <div className="text-[10px] font-mono text-ink-charcoal/50 uppercase">Con tự động tạo</div>
                        <div className="text-xl font-bold text-amber-600">{diagnostics.virtualChildrenCount || 0}</div>
                      </div>
                      <div className="bg-white p-3 border border-slate-200 rounded text-center">
                        <div className="text-[10px] font-mono text-ink-charcoal/50 uppercase">Mồ côi (Chưa khớp)</div>
                        <div className={`text-xl font-bold ${diagnostics.unlinkedNodes?.length > 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                          {diagnostics.unlinkedNodes?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* FATHER-CHILD LINKAGE MATCHING METHODOLOGY EXPLAINER */}
                    <div className="bg-amber-50 border border-amber-200 rounded p-4.5 space-y-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-serif font-black text-amber-950">
                        <HelpCircle className="w-4 h-4 text-amber-700" />
                        <span>💡 HƯỚNG DẪN GHÉP BỐ MẸ VÀ CON DỄ DÀNG NHẤT</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed font-sans">
                        Hệ thống phả hệ hỗ trợ hai phương pháp kết nối để quý vị có thể linh hoạt điền thông tin và dễ dàng khớp các dòng trong bảng tính Google Sheet nhất:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                        <div className="bg-white p-3 border border-amber-200/50 rounded space-y-1.5 font-sans">
                          <div className="font-bold text-emerald-800 flex items-center gap-1">
                            <span className="w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-mono font-bold">1</span>
                            <span>Cách 1: Khớp Tự Động theo Tên (Fuzzy Name)</span>
                          </div>
                          <p className="text-slate-600 text-[10px] leading-relaxed">
                            Quý vị chỉ cần điền cột <strong>"Họ và tên Cha ruột"</strong> hoặc <strong>"Họ và tên Mẹ ruột"</strong>. Thuật toán thông minh của chúng tôi sẽ tự động chuẩn hóa chữ cái, <strong>bỏ dấu tiếng Việt, bỏ danh xưng tôn kính (như Cụ, Ông, Bà, Cô)</strong> để ghép nối chính xác tuyệt đối mà không sợ viết sai chính tả hay thừa thiếu khoảng trắng.
                          </p>
                        </div>

                        <div className="bg-white p-3 border border-amber-200/50 rounded space-y-1.5 font-sans">
                          <div className="font-bold text-indigo-800 flex items-center gap-1">
                            <span className="w-4 h-4 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-[9px] font-mono font-bold">2</span>
                            <span>Cách 2: Khớp Theo Mã số ID (Tuyệt đối 100%)</span>
                          </div>
                          <p className="text-slate-600 text-[10px] leading-relaxed">
                            Với các tên trùng lặp trong họ, quý vị điền cột <strong>"Mã số"</strong> (id) cho mỗi người tùy ý (ví dụ: <code>1</code>, <code>2</code> hoặc <code>A</code>, <code>B</code>) rồi điền cột <strong>"Mã cha"</strong> (parentId) của con bằng mã số tương ứng của bố/mẹ. Đây là cách chắc chắn nhất bảo đảm sơ đồ không bao giờ nhầm nhánh.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DUPLICATE NAME WARNINGS */}
                    {diagnostics.duplicateNames && diagnostics.duplicateNames.length > 0 && (
                      <div className="bg-amber-100/70 border border-amber-300 p-3 rounded space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950 font-sans">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cảnh báo tên trùng lặp trong phả hệ</span>
                        </div>
                        <p className="text-[10px] text-amber-900 leading-relaxed font-sans">
                          Phát hiện tên trùng lặp: <strong className="font-mono text-amber-950">{diagnostics.duplicateNames.join(", ")}</strong>. 
                          Để tránh hệ thống khớp sai bố con khi nhập tự động, Ban liên lạc nên khai báo cột <strong>"Mã số"</strong> và <strong>"Mã cha"</strong> cho các dòng này để chỉ định chính xác cây phả hệ.
                        </p>
                      </div>
                    )}

                    {/* UNLINKED NODES ORPHAN LIST & AUTOPILOT SMART PREDICTOR SUGGESTIONS */}
                    {diagnostics.unlinkedNodes && diagnostics.unlinkedNodes.length > 0 ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-serif font-black text-rose-950 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                            <span>Danh sách chưa liên kết vào sơ đồ cây ({diagnostics.unlinkedNodes.length})</span>
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-ink-charcoal/60 leading-normal font-sans">
                          Sau đây là danh sách những thành viên có ghi danh ở trang tính nhưng hệ thống <strong>chưa tìm thấy cha mẹ tương ứng</strong> để đưa lên cây. Vui lòng kiểm tra kỹ gợi ý ghép nối ở cột bên phải bên dưới để cập nhật lại trên Google Sheet của dòng họ:
                        </p>

                        <div className="max-h-64 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50 bg-white shadow-inner">
                          {diagnostics.unlinkedNodes.map((node: any) => (
                            <div key={node.id} className="p-3 hover:bg-slate-50 transition-colors text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.2 bg-red-100 text-red-900 rounded font-mono font-bold text-[9px]">
                                    Đời {node.generation}
                                  </span>
                                  <span className="font-bold text-slate-800">{node.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400">ID: {node.id}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-sans">
                                  {node.fatherName && <span>Cha khai báo: <strong className="text-slate-700">{node.fatherName}</strong></span>}
                                  {node.fatherName && node.motherName && <span className="mx-2">|</span>}
                                  {node.motherName && <span>Mẹ khai báo: <strong className="text-slate-700">{node.motherName}</strong></span>}
                                </div>
                              </div>

                              {/* Autopilot suggestion engine output */}
                              <div className="shrink-0 font-sans md:text-right">
                                {node.potentialParents && node.potentialParents.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="text-[10px] text-slate-400 font-mono">🔍 GỢI Ý MÃ CHA ĐỂ DÁN VÀO SHEET:</div>
                                    <div className="flex flex-wrap gap-1 md:justify-end">
                                      {node.potentialParents.map((parent: any) => (
                                        <div key={parent.id} className="px-2 py-1 border border-emerald-300 bg-emerald-50 text-emerald-950 rounded text-[10px] flex items-center gap-1 font-sans">
                                          <span>Dán <strong>{parent.id}</strong></span>
                                          <span className="text-emerald-500 text-[9px] font-mono font-bold">(Bố: {parent.name})</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] italic text-slate-400">
                                    Không thấy ứng viên đời {node.generation - 1} phù hợp
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded flex items-center gap-2 text-xs text-emerald-950 font-sans">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tuyệt vời! Tất cả các thành viên đã được liên kết thông suốt vào hệ thống cây phả hệ dòng họ mà không có bất kỳ dòng mồ côi nào.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Local JSON manual imports and exports */}
                <div className="space-y-3.5 border-t border-[#8c716e]/10 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-extrabold text-primary flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#7b5800]" />
                      <span>Sao lưu & Nhập xuất Cây Phả hệ trực tiếp (JSON Format)</span>
                    </span>
                  </div>

                  <p className="text-[10px] text-ink-charcoal/60 leading-normal">
                    Nếu không dùng Google Sheet, quý vị có thể tải lên/tải xuống cấu trúc JSON của gia hệ để sao lưu dự phòng phòng khi trình duyệt bị xóa dữ liệu cục bộ.
                  </p>

                  <textarea
                    rows={4}
                    placeholder="Dán chuỗi dữ liệu JSON xuất phả hệ ở đây..."
                    value={rawLineageInput}
                    onChange={(e) => setRawLineageInput(e.target.value)}
                    className="w-full text-[10px] font-mono p-2.5 bg-silk-paper border border-[#8c716e]/20 rounded placeholder-ink-charcoal/30 text-ink-charcoal focus:outline-none focus:border-primary"
                  />

                  {treeImportMsg && (
                    <div className="text-[11px] text-amber-900 bg-amber-50 p-2 border border-amber-200 rounded">
                      {treeImportMsg}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportTreeJson}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded text-xs font-sans font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xuất File JSON Hiện Tại</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleImportTreeJson}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-sans font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nhập & Ghi Đè Bản Gốc</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetTreeDatabase}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 rounded text-xs font-sans font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Khôi phục Cây Phả hệ Cao Gia gốc Ninh Bình ⚠️</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllTreeData}
                      className="px-3.5 py-1.5 bg-[#8b1c1c] hover:bg-[#a02222] text-white rounded text-xs font-sans font-bold flex items-center gap-1 transition-all"
                    >
                      <span>🗑️ Xóa Sạch Hoàn Toàn & Nhập Mới</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* FOLDER 2: Theme graphics & dimensions customization */}
          <div className="border border-[#8c716e]/15 rounded bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => toggleFolder('appearance')}
              className="w-full p-4 bg-slate-50 flex items-center justify-between border-b border-[#8c716e]/10 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3 text-primary font-serif font-bold text-sm md:text-base">
                {openFolders['appearance'] ? (
                  <FolderOpen className="w-5.5 h-5.5 text-[#7b5800]" />
                ) : (
                  <Folder className="w-5.5 h-5.5 text-[#7b5800]" />
                )}
                <span>2. 📁 Cấu hình Thẩm mỹ, Giao diện & Chế độ hòa trộn</span>
              </div>
              <span className="text-[10px] font-mono text-ink-charcoal/40 font-bold uppercase">
                {openFolders['appearance'] ? 'Thu gọn ▲' : 'Mở rộng ▼'}
              </span>
            </button>

            {openFolders['appearance'] && (
              <div className="p-5 space-y-6 animate-fade-in bg-white">
                
                {/* Background image rules with blending modes selection */}
                <div className="space-y-4">
                  <span className="text-xs font-serif font-extrabold text-primary flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-[#7b5800]" />
                    <span>Hình ảnh phông nền & Phương thức hòa trộn CSS (Blend Mode)</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Đường dẫn Hình ảnh Phông nền (Unsplash/Imgur/URL)</label>
                      <input
                        type="text"
                        value={settings.backgroundImageUrl}
                        onChange={(e) => setSettings({...settings, backgroundImageUrl: e.target.value})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Phương thức hòa trộn phông nền (Mix Blend Mode)</label>
                      <select
                        value={settings.backgroundBlendMode}
                        onChange={(e) => setSettings({...settings, backgroundBlendMode: e.target.value})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      >
                        <option value="multiply">Multiply (Ưu tiên cho giấy sần antique)</option>
                        <option value="normal">Normal (Bản gốc nguyên trạng)</option>
                        <option value="overlay">Overlay (Phác đè sáng mờ)</option>
                        <option value="luminosity">Luminosity (Hòa trộn sắc xám đen phong sương)</option>
                        <option value="screen">Screen (Cường lăng sáng phản)</option>
                        <option value="darken">Darken (Hòa sắc tối sâu)</option>
                        <option value="lighten">Lighten (Sáng dịu tôn)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Color presets customize palette */}
                <div className="space-y-4 border-t border-[#8c716e]/10 pt-5">
                  <span className="text-xs font-serif font-extrabold text-primary flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#7b5800]" />
                    <span>Hệ sắc màu Vương Gia (Theme Master Keys)</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 uppercase block">Màu Chủ Đạo (Primary Red)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                          className="w-8 h-8 rounded border cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                          className="w-full px-2 text-xs font-mono border rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 uppercase block">Gương Nền (Background Tint)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.backgroundColorTint}
                          onChange={(e) => setSettings({...settings, backgroundColorTint: e.target.value})}
                          className="w-8 h-8 rounded border cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={settings.backgroundColorTint}
                          onChange={(e) => setSettings({...settings, backgroundColorTint: e.target.value})}
                          className="w-full px-2 text-xs font-mono border rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 uppercase block">Nút Điểm Nhấn (Accent Brass)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.accentColor}
                          onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                          className="w-8 h-8 rounded border cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={settings.accentColor}
                          onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                          className="w-full px-2 text-xs font-mono border rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 uppercase block">Sắc Chữ (Text Ink)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.textColor}
                          onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                          className="w-8 h-8 rounded border cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={settings.textColor}
                          onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                          className="w-full px-2 text-xs font-mono border rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sizing & spacing tree dimensions */}
                <div className="space-y-4 border-t border-[#8c716e]/10 pt-5">
                  <span className="text-xs font-serif font-extrabold text-primary flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#7b5800]" />
                    <span>Hiệu chỉnh Kích cỡ & Trục tọa độ Cây Gia Phả</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Độ rộng Node Hộp thành viên (Node Width, px)</label>
                      <input
                        type="number"
                        value={settings.treeNodeWidth}
                        onChange={(e) => setSettings({...settings, treeNodeWidth: parseInt(e.target.value) || 170})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Độ dày dây liên kết nhánh (Line Thickness, px)</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={settings.treeLineThickness}
                        onChange={(e) => setSettings({...settings, treeLineThickness: parseInt(e.target.value) || 2})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Khoảng cách gián cách ngang (Spacing X, px)</label>
                      <input
                        type="number"
                        value={settings.treeSpacingX}
                        onChange={(e) => setSettings({...settings, treeSpacingX: parseInt(e.target.value) || 185})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Bo góc hộp phả hệ (Border Radius)</label>
                      <select
                        value={settings.nodeBorderRadius}
                        onChange={(e) => setSettings({...settings, nodeBorderRadius: e.target.value})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      >
                        <option value="rounded-none">Chữ nhật vuông góc (rounded-none)</option>
                        <option value="rounded-sm">Vát nhẹ tự nhiên (rounded-sm)</option>
                        <option value="rounded-md">Mượt mà chuẩn mực (rounded-md)</option>
                        <option value="rounded-full">Tròn thầu kính (rounded-full)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase block">Màu sọc dây nối gia chi</label>
                    <div className="flex gap-2 max-w-xs">
                      <input
                        type="color"
                        value={settings.treeLineColor}
                        onChange={(e) => setSettings({...settings, treeLineColor: e.target.value})}
                        className="w-8 h-8 rounded border cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={settings.treeLineColor}
                        onChange={(e) => setSettings({...settings, treeLineColor: e.target.value})}
                        className="w-full px-2 text-xs font-mono border rounded focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* FOLDER 3: Tabs Labels and titles */}
          <div className="border border-[#8c716e]/15 rounded bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => toggleFolder('buttons')}
              className="w-full p-4 bg-slate-50 flex items-center justify-between border-b border-[#8c716e]/10 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3 text-primary font-serif font-bold text-sm md:text-base">
                {openFolders['buttons'] ? (
                  <FolderOpen className="w-5.5 h-5.5 text-[#7b5800]" />
                ) : (
                  <Folder className="w-5.5 h-5.5 text-[#7b5800]" />
                )}
                <span>3. 📁 Đại quản danh xưng nút bấm, Tiêu đề & Logo nhãn tự</span>
              </div>
              <span className="text-[10px] font-mono text-ink-charcoal/40 font-bold uppercase">
                {openFolders['buttons'] ? 'Thu gọn ▲' : 'Mở rộng ▼'}
              </span>
            </button>

            {openFolders['buttons'] && (
              <div className="p-5 space-y-6 animate-fade-in bg-white">
                
                {/* Branding custom characters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Ký tự chữ triện Thượng thủ (Brand Logo Character)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={settings.brandChar}
                      onChange={(e) => setSettings({...settings, brandChar: e.target.value})}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal text-center font-bold"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Tiêu đề Dòng họ (Home Title Flag)</label>
                    <input
                      type="text"
                      value={settings.homeTitle}
                      onChange={(e) => setSettings({...settings, homeTitle: e.target.value})}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal font-bold"
                    />
                  </div>
                </div>

                {/* Header Title subtitles details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#8c716e]/10 pt-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Địa bàn / Chú thích dòng họ (Home Subtitle)</label>
                    <input
                      type="text"
                      value={settings.homeSubtitle}
                      onChange={(e) => setSettings({...settings, homeSubtitle: e.target.value})}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Dòng chữ Chân trang (Footer Text Ban liên lạc)</label>
                    <input
                      type="text"
                      value={settings.footerText}
                      onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                    />
                  </div>
                </div>

                {/* Navigation Button override titles */}
                <div className="space-y-4 border-t border-[#8c716e]/10 pt-5">
                  <span className="text-xs font-serif font-extrabold text-primary flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#7b5800]" />
                    <span>Hiệu chỉnh hiển thị TỰ TRÊN CÁC NÚT TAB THƯ MỤC</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Tin tức</label>
                      <input
                        type="text"
                        value={settings.tabTintucLabel}
                        onChange={(e) => setSettings({...settings, tabTintucLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Gia phả</label>
                      <input
                        type="text"
                        value={settings.tabGiaphaLabel}
                        onChange={(e) => setSettings({...settings, tabGiaphaLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Phả ký</label>
                      <input
                        type="text"
                        value={settings.tabPhakyLabel}
                        onChange={(e) => setSettings({...settings, tabPhakyLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Tộc ước</label>
                      <input
                        type="text"
                        value={settings.tabTocuocLabel}
                        onChange={(e) => setSettings({...settings, tabTocuocLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Lịch giỗ</label>
                      <input
                        type="text"
                        value={settings.tabLichgioLabel}
                        onChange={(e) => setSettings({...settings, tabLichgioLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Đổi lịch âm</label>
                      <input
                        type="text"
                        value={settings.tabLichamLabel}
                        onChange={(e) => setSettings({...settings, tabLichamLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-ink-charcoal/50 block">Tab Quản trị</label>
                      <input
                        type="text"
                        value={settings.tabDashboardLabel}
                        onChange={(e) => setSettings({...settings, tabDashboardLabel: e.target.value})}
                        className="w-full text-xs font-sans p-2 border rounded text-ink-charcoal"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* FOLDER 4: External Webhooks and Keys */}
          <div className="border border-[#8c716e]/15 rounded bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => toggleFolder('apis')}
              className="w-full p-4 bg-slate-50 flex items-center justify-between border-b border-[#8c716e]/10 text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3 text-primary font-serif font-bold text-sm md:text-base">
                {openFolders['apis'] ? (
                  <FolderOpen className="w-5.5 h-5.5 text-[#7b5800]" />
                ) : (
                  <Folder className="w-5.5 h-5.5 text-[#7b5800]" />
                )}
                <span>4. 📁 Kết nối Dịch vụ ngoại vi & APIs (Gemini & Zalo)</span>
              </div>
              <span className="text-[10px] font-mono text-ink-charcoal/40 font-bold uppercase">
                {openFolders['apis'] ? 'Thu gọn ▲' : 'Mở rộng ▼'}
              </span>
            </button>

            {openFolders['apis'] && (
              <div className="p-5 space-y-6 animate-fade-in bg-white">
                
                {/* Gemini Config keys */}
                <div className="space-y-4">
                  <span className="text-xs font-serif font-extrabold text-primary flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#7b5800]" />
                    <span>Trí tuệ nhân tạo Gemini AI Client</span>
                  </span>

                  <p className="text-[10px] text-ink-charcoal/60 leading-normal">
                    Thiết lập API Key của Google Gemini giúp Trợ lý Thư phòng có thể hỗ trợ giải nghĩa cổ luật phả hề chuyên sâu, trực tiếp bằng dữ liệu thức thời.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Gemini Developer API Key</label>
                      <input
                        type="password"
                        placeholder="Dán mã API Key của Google Cloud (AI Studio)..."
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Mã Phân bản Gemini (Model Version)</label>
                      <select
                        value={settings.geminiModelName}
                        onChange={(e) => setSettings({...settings, geminiModelName: e.target.value})}
                        className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-primary text-ink-charcoal"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh và tối ưu)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Siêu ngoại suy phả hệ)</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Bản cũ ổn định)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Zalo Social APIs webhook */}
                <div className="space-y-4 border-t border-[#8c716e]/10 pt-5 animate-fade-in">
                  <span className="text-xs font-serif font-extrabold text-[#0068ff] flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                    <span>Zalo Official Account & Chia sẻ Webhook</span>
                  </span>

                  <p className="text-[10px] text-ink-charcoal/60 leading-normal">
                    Khai báo webhook cho phép liên thông đẩy các thông báo giỗ Tổ dòng họ chép từ "Lịch Giỗ" trực tiếp tới tài khoản Zalo OA của bà con cô bác dòng tộc thuận tiện.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-ink-charcoal/50 uppercase">Zalo Webhook/Sharing API Endpoint URL</label>
                    <input
                      type="text"
                      placeholder="https://api.zalo.me/v2.0/oa/message/transaction..."
                      value={settings.zaloWebhookUrl}
                      onChange={(e) => setSettings({...settings, zaloWebhookUrl: e.target.value})}
                      className="w-full text-xs font-sans p-2 bg-silk-paper border border-[#8c716e]/20 rounded focus:outline-none focus:border-[#0068ff] text-ink-charcoal"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Realtime Live parameters panel status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-2 border-primary rounded p-5 space-y-5 shadow-lg">
            <h4 className="font-serif text-sm font-bold text-primary border-b pb-2">
              Bộ giám sát Đồng bộ
            </h4>

            <div className="text-xs font-sans space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded">
                <span className="text-ink-charcoal/65">Thành viên phả hệ:</span>
                <span className="font-mono font-bold text-primary">Tự dãn động</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded">
                <span className="text-ink-charcoal/65">Sắc tông chủ thể:</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                  <span 
                    className="w-3.5 h-3.5 rounded border border-gray-300 block" 
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                  {settings.primaryColor}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded">
                <span className="text-ink-charcoal/65">Sọc nối chi phái:</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                  <span 
                    className="w-3.5 h-3.5 rounded border border-gray-300 block" 
                    style={{ backgroundColor: settings.treeLineColor }}
                  />
                  {settings.treeLineColor}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded">
                <span className="text-ink-charcoal/65">Hòa trộn nền:</span>
                <span className="font-mono font-bold capitalize">{settings.backgroundBlendMode}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded">
                <span className="text-ink-charcoal/65">Trục ngang dãn:</span>
                <span className="font-mono font-bold">{settings.treeSpacingX} px</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 border rounded text-emerald-900 bg-emerald-50/50 border-emerald-300">
                <span>Google Sheet Sync:</span>
                <span className="font-mono font-bold">
                  {settings.googleSheetSyncEnabled ? "Bật 📜" : "Chưa bật ⚙️"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>ÁP DỤNG & LƯU THAY ĐỔI</span>
              </button>

              <button
                onClick={handleResetSettings}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-ink-charcoal rounded font-sans font-semibold text-xs border border-slate-300 transition-all flex items-center justify-center"
              >
                Đặt lại cài đặt ban đầu
              </button>
            </div>

            {isSaved && (
              <div className="text-center text-xs text-emerald-800 font-sans font-medium animate-pulse">
                ✓ Thiết lập đã được cập nhật thành công!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
