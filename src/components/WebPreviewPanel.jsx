import React, { useMemo, useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react';
import { RotateCcw } from 'lucide-react';

const getSandpackTemplate = (language) => {
  if (language === 'react') return 'react';
  if (language === 'node-web') return 'node';
  if (language === 'vanilla-web') return 'vanilla';
  return 'vanilla';
};

const WebPreviewPanel = ({ files, language }) => {
  const [sandpackKey, setSandpackKey] = useState(0);

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

  return (
    <div className="flex flex-col h-full bg-[#181825] border-l border-white/10 w-full overflow-hidden">
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
          <div className="flex-[2] flex flex-col border-b border-white/10 overflow-hidden relative min-h-0">
            <div className="px-3 py-1.5 bg-[#1e1e2e] border-b border-white/5 text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center justify-between shrink-0">
               <span>Live Web Preview</span>
               <button 
                 onClick={() => setSandpackKey(k => k + 1)}
                 className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded border border-white/10"
                 title="Restart Sandbox Container"
               >
                 <RotateCcw size={10} />
                 Restart Server
               </button>
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
          
          {/* Console Section */}
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
        </SandpackLayout>
      </SandpackProvider>

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
  );
};

export default WebPreviewPanel;
