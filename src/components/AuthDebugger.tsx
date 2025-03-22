import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase, refreshSession } from "@/integrations/supabase/client";

export const AuthDebugger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('session');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isOpen) {
      // Initial check
      checkSession();
      
      // Set up interval to check every 2 seconds
      interval = setInterval(checkSession, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const localStorageKeys = Object.keys(localStorage).filter(
        key => key.includes('supabase')
      );
      
      const storageItems: Record<string, string> = {};
      localStorageKeys.forEach(key => {
        try {
          storageItems[key] = localStorage.getItem(key) || '';
        } catch (e) {
          storageItems[key] = 'Error reading value';
        }
      });
      
      setSessionInfo({
        session: data.session,
        storage: storageItems
      });
    } catch (error) {
      console.error("Error checking session:", error);
    }
  };

  const handleRefreshSession = async () => {
    try {
      const result = await refreshSession();
      console.log("Session refresh result:", result);
      checkSession();
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      checkSession();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
        >
          Auth Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-white border border-gray-200 shadow-lg rounded-tl-lg z-50 overflow-hidden flex flex-col">
      <div className="bg-gray-100 p-2 flex justify-between items-center border-b">
        <h3 className="font-medium">Auth Debugger</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </div>
      
      <div className="flex gap-1 p-1 bg-gray-50 border-b">
        <Button 
          size="sm" 
          variant={activeTab === 'session' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('session')}
        >
          Session
        </Button>
        <Button 
          size="sm" 
          variant={activeTab === 'storage' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </Button>
      </div>
      
      <div className="flex gap-1 p-1 bg-gray-50 border-b">
        <Button size="sm" variant="outline" onClick={handleRefreshSession}>
          Refresh Session
        </Button>
        <Button size="sm" variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-2 text-xs font-mono bg-gray-50">
        {activeTab === 'session' && (
          <div>
            <h4 className="font-bold mb-1">Current Session:</h4>
            <pre className="whitespace-pre-wrap">
              {sessionInfo?.session 
                ? JSON.stringify(sessionInfo.session, null, 2) 
                : "No active session"}
            </pre>
          </div>
        )}
        
        {activeTab === 'storage' && (
          <div>
            <h4 className="font-bold mb-1">localStorage Items:</h4>
            {sessionInfo?.storage && Object.entries(sessionInfo.storage).map(([key, value]) => (
              <div key={key} className="mb-2">
                <div className="font-bold">{key}:</div>
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : String(value)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 