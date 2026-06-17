import React, { useMemo, useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react';
import { RotateCcw, Maximize2, Minimize2, X } from 'lucide-react';

const getSandpackTemplate = (language) => {
  if (language === 'react') return 'react';
  if (language === 'node-web') return 'node';
  if (language === 'vanilla-web') return 'vanilla';
  return 'vanilla';
};

const WebPreviewPanel = ({ files, language }) => {
  const [sandpackKey, setSandpackKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert CodeSync files to Sandpack format
  const sandpackFiles = useMemo(() => {
    const formatted = {};
    if (!files || files.length === 0) return formatted;
    
    files.forEach(f => {
      // Ensure path starts with a slash for Sandpack
      const path = f.path ? (f.path.startsWith('/') ? f.path : `/${f.path}`) : `/${f.name}`;
      formatted[path] = { code: f.content || '' };
    });
    return formatted;
  }, [files]);

  const sandpackContent = (
    <SandpackProvider 
      key={sandpackKey}
      template={getSandpackTemplate(language)}
      theme="dark"
      files={Object.keys(sandpackFiles).length > 0 ? sandpackFiles : undefined}
      options={{
        classes: {
          "sp-wrapper": "custom-wrapper",
          "sp-layout": "custom-layout",
        }
      }}
    >
      <SandpackLayout className="flex-1 flex flex-col h-full overflow-hidden" style={{ height: '100%', '--sp-layout-height': '100%', background: 'transparent' }}>
        {/* Browser Preview Section */}
        <div className={`flex flex-col border-b border-white/10 overflow-hidden relative min-h-0 ${isFullscreen ? 'flex-[6]' : 'flex-[2]'}`}>
          <div className="px-3 py-1.5 bg-[#1e1e2e] border-b border-white/5 text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-between shrink-0">
             <span>Live Web Preview</span>
             <div className="flex items-center gap-1">
               <button 
                 onClick={() => setSandpackKey(k => k + 1)}
                 className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded border border-white/10"
                 title="Restart Sandbox Container"
               >
                 <RotateCcw size={10} />
                 Restart Server
               </button>
               <button
                 onClick={() => setIsFullscreen(v => !v)}
                 className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded border border-white/10"
                 title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
               >
                 {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                 {isFullscreen ? 'Exit' : 'Fullscreen'}
               </button>
             </div>
          </div>
          <div className="flex-1 relative min-h-0 h-full overflow-hidden bg-white">
            <SandpackPreview 
              showNavigator={true} 
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
              className="absolute inset-0 h-full w-full"
              style={{ height: '100%' }}
            />
          </div>
        </div>
        
        {/* Console Section — hidden in fullscreen to maximise preview space */}
        {!isFullscreen && (
          <div className="flex-1 flex flex-col overflow-hidden relative min-h-0 bg-[#151515]">
            <div className="px-3 py-1.5 bg-[#1e1e2e] border-b border-white/5 text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center shrink-0">
               Console Output
            </div>
            <div className="flex-1 relative min-h-0 overflow-auto">
              <SandpackConsole 
                standalone 
                className="absolute inset-0 h-full w-full custom-console" 
              />
            </div>
          </div>
        )}
      </SandpackLayout>
    </SandpackProvider>
  );

  return (
    <>
      {/* Normal panel */}
      <div className="flex flex-col h-full bg-[#181825] border-l border-white/10 w-full overflow-hidden">
        {sandpackContent}

        <style>{`
          .custom-wrapper {
            height: 100%;
          }
          .custom-layout {
            height: 100%;
            background: transparent;
          }
          .custom-console {
            height: 100%;
            background: #151515 !important;
          }
        `}</style>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-[#181825]"
          style={{ animation: 'fadeIn 0.15s ease' }}
        >
          {/* Fullscreen top bar */}
          <div
            id="preview-fullscreen-bar"
            className="px-4 py-2 bg-[#1e1e2e] border-b border-white/10 flex items-center justify-between shrink-0"
            style={{ height: '40px' }}
          >
            <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">
              Live Web Preview — Fullscreen
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSandpackKey(k => k + 1)}
                className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-lg border border-white/10 text-xs"
                title="Restart Sandbox"
              >
                <RotateCcw size={12} />
                Restart
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30 text-xs"
                title="Exit Fullscreen"
              >
                <X size={12} />
                Exit Fullscreen
              </button>
            </div>
          </div>

          {/* Full preview area — explicit height so Sandpack fills it */}
          <div style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <SandpackProvider
              key={`fs-${sandpackKey}`}
              template={getSandpackTemplate(language)}
              theme="dark"
              files={Object.keys(sandpackFiles).length > 0 ? sandpackFiles : undefined}
            >
              <SandpackLayout style={{ height: 'calc(100vh - 40px)', '--sp-layout-height': 'calc(100vh - 40px)', background: '#fff', flex: 1 }}>
                <SandpackPreview
                  showNavigator={true}
                  showOpenInCodeSandbox={false}
                  showRefreshButton={true}
                  style={{ height: 'calc(100vh - 40px)', width: '100%' }}
                />
              </SandpackLayout>
            </SandpackProvider>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default WebPreviewPanel;
