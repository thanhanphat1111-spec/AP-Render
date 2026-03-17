
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { TabButton } from './components/TabButton';
import { ExteriorRenderTab } from './tabs/ExteriorRenderTab';
import { InteriorRenderTab } from './tabs/InteriorRenderTab';
import { FloorplanTo3DTab } from './tabs/FloorplanTo3DTab';
import { ImageEditingTab } from './tabs/ImageEditingTab';
import { UtilitiesTab } from './tabs/UtilitiesTab';
import { ActiveTab, ImageFile } from './types';
import { TABS, FEATURE_DESCRIPTIONS } from './constants';
import { MovieTab } from './tabs/MovieTab';
import { StorageTab } from './tabs/StorageTab';
import { ReMakeTab } from './tabs/ReMakeTab';
import { RenovationTab } from './tabs/RenovationTab';
import { BV2DTab } from './tabs/BV2DTab';
import { MoodboardMainTab } from './tabs/MoodboardMainTab';
import { ChatBot } from './components/ChatBot';
import { FeatureNotification } from './components/FeatureNotification';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Exterior);
  const [imageForEditing, setImageForEditing] = useState<ImageFile | null>(null);
  const [imageForVideo, setImageForVideo] = useState<ImageFile | null>(null);
  
  // Updated state for ReMake tab navigation
  const [remakeData, setRemakeData] = useState<{ image: ImageFile; mode: 'interior' | 'exterior' | 'lighting' } | null>(null);
  
  const [imageForUtility, setImageForUtility] = useState<{ image: ImageFile; utility: string } | null>(null);
  const [imageForMasterplan, setImageForMasterplan] = useState<ImageFile | null>(null);
  const [imageForMaterialChange, setImageForMaterialChange] = useState<ImageFile | null>(null);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleTabChange = (tabId: ActiveTab) => {
      setActiveTab(tabId);
      // Trigger notification logic
      const description = FEATURE_DESCRIPTIONS[tabId];
      if (description) {
          setNotificationMessage(description);
          setShowNotification(true);
          // If chat is already open, it will auto-update context via useEffect in ChatBot
      }
  };

  const handleRequestEdit = useCallback((image: ImageFile) => {
    setImageForEditing(image);
    setActiveTab(ActiveTab.Editing);
  }, []);

  const clearImageForEditing = useCallback(() => {
    setImageForEditing(null);
  }, []);

  const handleRequestVideo = useCallback((image: ImageFile) => {
    setImageForVideo(image);
    setActiveTab(ActiveTab.Movie); 
  }, []);

  const clearImageForVideo = useCallback(() => {
    setImageForVideo(null);
  }, []);

  const handleRequestStyleChange = useCallback((image: ImageFile, type: 'exterior' | 'interior') => {
    const mode = type === 'exterior' ? 'exterior' : 'interior';
    setRemakeData({ image, mode });
    setActiveTab(ActiveTab.ReMake);
  }, []);

  const clearRemakeData = useCallback(() => {
    setRemakeData(null);
  }, []);

  const handleTransferToMasterplan = useCallback((image: ImageFile) => {
    setImageForMasterplan(image);
    setActiveTab(ActiveTab.Floorplan); 
  }, []);

  const clearImageForMasterplan = useCallback(() => {
    setImageForMasterplan(null);
  }, []);

  const handleRequestMaterialChange = useCallback((image: ImageFile) => {
    setImageForMaterialChange(image);
    setActiveTab(ActiveTab.Renovation); // Send to Renovation Tab
  }, []);

  const clearImageForMaterialChange = useCallback(() => {
    setImageForMaterialChange(null);
  }, []);

  const commonActionProps = {
      onEditRequest: handleRequestEdit,
      onVideoRequest: handleRequestVideo,
      onStyleChangeRequest: handleRequestStyleChange,
      onMaterialChangeRequest: handleRequestMaterialChange,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#000000] font-sans text-brand-text relative">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2 md:gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm mx-auto max-w-fit">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ActiveTab)}
              isActive={activeTab === tab.id}
            >
              {tab.label}
            </TabButton>
          ))}
           <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium transition-colors text-brand-text-muted hover:text-white border-l border-white/10 ml-2 pl-4"
            >
              AI Studio
            </a>
        </div>
        
        {/* Persistent Tab Rendering */}
        <div className="tab-content">
            <div style={{ display: activeTab === ActiveTab.Exterior ? 'block' : 'none' }}>
                <ExteriorRenderTab {...commonActionProps} />
            </div>
            <div style={{ display: activeTab === ActiveTab.Interior ? 'block' : 'none' }}>
                <InteriorRenderTab {...commonActionProps} />
            </div>
            <div style={{ display: activeTab === ActiveTab.Floorplan ? 'block' : 'none' }}>
                <FloorplanTo3DTab 
                    {...commonActionProps} 
                    initialMasterplanImage={imageForMasterplan} 
                    onClearMasterplanImage={clearImageForMasterplan} 
                />
            </div>
            <div style={{ display: activeTab === ActiveTab.BV2D ? 'block' : 'none' }}>
                <BV2DTab {...commonActionProps} />
            </div>
            {/* Merged Renovation Tab */}
            <div style={{ display: activeTab === ActiveTab.Renovation ? 'block' : 'none' }}>
                <RenovationTab 
                    {...commonActionProps}
                    initialMaterialImage={imageForMaterialChange}
                    onClearInitialMaterialImage={clearImageForMaterialChange}
                />
            </div>
            <div style={{ display: activeTab === ActiveTab.ReMake ? 'block' : 'none' }}>
                <ReMakeTab 
                    {...commonActionProps}
                    initialData={remakeData}
                    onClearInitialData={clearRemakeData}
                />
            </div>
            <div style={{ display: activeTab === ActiveTab.MoodboardMain ? 'block' : 'none' }}>
                <MoodboardMainTab {...commonActionProps} />
            </div>
            <div style={{ display: activeTab === ActiveTab.Editing ? 'block' : 'none' }}>
                <ImageEditingTab 
                    initialImage={imageForEditing} 
                    onClearInitialImage={clearImageForEditing} 
                    onTransferToMasterplan={handleTransferToMasterplan}
                    {...commonActionProps} 
                />
            </div>
            <div style={{ display: activeTab === ActiveTab.Movie ? 'block' : 'none' }}>
                 <MovieTab 
                    onEditRequest={handleRequestEdit}
                    initialImage={imageForVideo} 
                    onClearInitialImage={clearImageForVideo} 
                 />
            </div>
            {/* Deprecated Tabs - Removed from Render but logic kept in codebase for safety */}
            {/* <div style={{ display: activeTab === ActiveTab.CanvaMix ? 'block' : 'none' }}>...</div> */}
            {/* <div style={{ display: activeTab === ActiveTab.ReUp ? 'block' : 'none' }}>...</div> */}
            
            <div style={{ display: activeTab === ActiveTab.Utilities ? 'block' : 'none' }}>
                <UtilitiesTab 
                    onEditRequest={handleRequestEdit}
                    onVideoRequest={handleRequestVideo}
                    initialUtility={imageForUtility} 
                    onClearInitialUtility={() => setImageForUtility(null)} 
                />
            </div>
            <div style={{ display: activeTab === ActiveTab.Storage ? 'block' : 'none' }}>
                <StorageTab 
                    onEditRequest={handleRequestEdit} 
                    onVideoRequest={handleRequestVideo} 
                />
            </div>
        </div>
      </main>
      
      <footer className="text-center py-6 text-xs text-brand-text-muted/60 border-t border-white/5 mt-12 bg-black/20">
        <p>AP Render - AI Architectural Visualization System</p>
      </footer>

      {/* Chat Bot & Notification Overlay */}
      <FeatureNotification 
        message={notificationMessage}
        visible={showNotification && !isChatOpen}
        onClick={() => { setShowNotification(false); setIsChatOpen(true); }}
        onClose={() => setShowNotification(false)}
      />
      <ChatBot 
        isOpen={isChatOpen} 
        onToggle={() => { setIsChatOpen(!isChatOpen); setShowNotification(false); }}
        activeTab={activeTab}
      />
    </div>
  );
};

export default App;
