/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TinTucSection from './components/TinTucSection';
import GiaPhaTree from './components/GiaPhaTree';
import PhaKySection from './components/PhaKySection';
import TocUocSection from './components/TocUocSection';
import LichGioSection from './components/LichGioSection';
import LichAmSection from './components/LichAmSection';
import AdminDashboardSection from './components/AdminDashboardSection';
import Footer from './components/Footer';
import { getAppSettings, applyConfigToStyles } from './utils/configManager';
import { Sparkles, Bot, MessageSquare, X, Send, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<string>('pha-ky'); // default according to mockup landing which shows Phả ký & Tộc ước
  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [aiMessage, setAiMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Kính chào hiền nhân họ Cao. Thư phòng dòng tộc sẵn sàng hỗ trợ tra tuyển Phả cổ, giải nghĩa Tộc ước và trích lục phả hệ ngũ chi. Tôi giúp gì được cho quý vị trong ngày hôm nay?' }
  ]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Apply visual configurations reactive styling dynamically
  React.useEffect(() => {
    applyConfigToStyles(getAppSettings());

    const handleConfigTrigger = () => {
      applyConfigToStyles(getAppSettings());
    };

    window.addEventListener("caogia_settings_updated", handleConfigTrigger);
    return () => {
      window.removeEventListener("caogia_settings_updated", handleConfigTrigger);
    };
  }, []);

  // Simulated AI response generator based on historical facts defined in lineageData
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim() || isGenerating) return;

    const userText = aiMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setAiMessage('');
    setIsGenerating(true);

    // Simulate thinking delay then provide a traditional style answers matching lineage data
    setTimeout(() => {
      let assistantText = 'Cảm ơn ông bà đã hỏi thăm. Dữ liệu tàng bạt cho biết phả chi họ Cao Phú Mỹ khởi nguồn từ cụ tổ Cao Đại Lang gốc Thanh Hóa thiên cư vào thế kỷ 17. Cháu có thể tra cứu chi tiết trong phần "Phả ký" hoặc "Gia phả" ở thanh công cụ!';
      
      const lowerText = userText.toLowerCase();
      if (lowerText.includes('sáng lập') || lowerText.includes('thủy tổ') || lowerText.includes('nguồn gốc') || lowerText.includes('hôm nào') || lowerText.includes('ở đâu')) {
        assistantText = 'Cụ Thủy tổ Cao Đại Lang di thiên từ Thanh Hóa mở đất lập nghiệp tại Phú Mỹ vào triều Lê Trung Hưng khoảng năm 1630-1640. Kỵ nhật của cụ vào ngày 10 tháng 03 Âm lịch hàng năm tổ bái tại Từ đường chính Phú Mỹ.';
      } else if (lowerText.includes('tiệp') || lowerText.includes('khắc tiệp')) {
        assistantText = 'Đệ nhị thế tổ cụ Cao Khắc Tiệp (Đời thứ 2, trưởng chi) là người tinh thông học vấn, mở trường học thi cử đầu tiên giúp rạng danh gia đạo. Giỗ cụ vào rằm tháng Tám Âm lịch.';
      } else if (lowerText.includes('tộc ước') || lowerText.includes('quy tắc') || lowerText.includes('đạo hiếu')) {
        assistantText = 'Tộc ước cổ tri tri họ Cao Gia gồm có 4 điều răn gốc: Đạo hiếu tổ tiên lấy đầu, Khuyến học bồi dưỡng nhân hiền, Tương thân tương ái bao dung chi tộc, và Gìn giữ gia phong phép nước nếp nhà.';
      } else if (lowerText.includes('văn minh') || lowerText.includes('trưởng tộc')) {
        assistantText = 'Cụ Cao Văn Minh là đại diện Trưởng tộc Đệ ngũ thế hệ kế nhiệm, hiện là người phê duyệt toàn văn ban Hiến chương Tộc ước dòng họ đầu năm.';
      }

      setChatHistory(prev => [...prev, { role: 'assistant', text: assistantText }]);
      setIsGenerating(false);
    }, 1000);
  };

  // Render proper tab screen
  const renderContent = () => {
    switch (activeTab) {
      case 'tin-tuc':
        return <TinTucSection />;
      case 'gia-pha':
        return <GiaPhaTree />;
      case 'pha-ky':
        return <PhaKySection />;
      case 'toc-uoc':
        return <TocUocSection />;
      case 'lich-gio':
        return <LichGioSection />;
      case 'lich-am':
        return <LichAmSection />;
      case 'admin-dashboard':
        return <AdminDashboardSection />;
      default:
        return <PhaKySection />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-silk-paper text-ink-charcoal scroll-smooth select-text" id="app-root-frame">
      {/* Dynamic Header Nav */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-1 w-full max-w-7xl mx-auto" id="app-main-layout">
        {/* Left Side Slim Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content canvas with editorial padding & asymmetrical flow */}
        <main className="flex-1 px-4 sm:px-6 lg:px-12 py-8 overflow-hidden" id="app-main-view">
          {renderContent()}
        </main>
      </div>

      {/* Styled Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Luxury AI Assistant floating bubble - representing high premium class */}
      <div className="fixed bottom-6 right-6 z-40" id="ai-floating-bubble-hub">
        {!isAiOpen ? (
          <button
            onClick={() => setIsAiOpen(true)}
            className="w-12 h-12 bg-primary hover:bg-primary-hover text-silk-paper rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center animate-bounce cursor-pointer border border-secondary/20 group relative"
            id="ai-helper-dock-btn"
          >
            <Bot className="w-5.5 h-5.5" />
            <span className="absolute top-[-4px] right-[-2px] flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
            </span>
          </button>
        ) : (
          <div 
            className="w-[340px] h-[450px] bg-silk-paper border border-secondary/30 rounded-sm shadow-2xl flex flex-col overflow-hidden animate-slide-up"
            id="ai-chat-board"
          >
            {/* Header chat boards */}
            <div className="bg-primary p-4 text-silk-paper flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-silk-paper/10 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold">Thư Thư Cao Gia AI</h4>
                  <span className="block text-[9px] font-mono tracking-wider text-silk-paper/60 uppercase">Dòng dõi Văn võ song toàn</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                className="text-silk-paper/70 hover:text-silk-paper transition-colors"
                id="close-ai-chat-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat list views */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin bg-white/50" id="chat-messages-container">
              {chatHistory.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  id={`chat-bubble-${idx}`}
                >
                  <div className={`p-3 max-w-[85%] rounded-sm text-xs leading-relaxed ${
                    chat.role === 'user'
                      ? 'bg-secondary text-silk-paper font-medium font-sans rounded-br-none shadow-sm'
                      : 'bg-silk-paper border border-ink-charcoal/10 text-ink-charcoal font-sans rounded-bl-none shadow-sm'
                  }`}>
                    {chat.role === 'assistant' && (
                      <span className="block text-[8px] font-mono text-secondary uppercase font-bold mb-1 tracking-wider">Trợ Lý Thư Phòng</span>
                    )}
                    {chat.text}
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-silk-paper border border-ink-charcoal/10 p-2 text-xs text-ink-charcoal/50 rounded-sm italic">
                    Hội đồng thư phòng đang sao tra gia sử...
                  </div>
                </div>
              )}
            </div>

            {/* Form messaging input fields */}
            <form onSubmit={handleSendAiMessage} className="p-3 border-t border-ink-charcoal/5 bg-silk-paper flex gap-2" id="ai-chat-input-form">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="Hỏi cụ tổ, phả ký, tộc ước..."
                className="flex-1 bg-white border border-ink-charcoal/10 rounded-sm py-1.5 px-3 text-xs focus:outline-none focus:border-primary text-ink-charcoal placeholder-ink-charcoal/40"
                id="ai-user-query"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-silk-paper py-1.5 px-3 rounded-sm flex items-center justify-center shadow-sm"
                id="ai-send-btn"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
