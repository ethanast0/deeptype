import React, { useState, useEffect } from 'react';
import { getAuthDebugInfo, setAuthDebugEnabled } from '@/utils/authDebug';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Download, XCircle } from 'lucide-react';
import { clearAuthData, refreshSession } from '@/integrations/supabase/client';

const AuthDebugger = () => {
  const [open, setOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugEnabled, setDebugEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState('session');
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const fetchDebugInfo = () => {
      if (open) {
        const info = getAuthDebugInfo();
        setDebugInfo(info);
      }
    };

    fetchDebugInfo();
    
    // Refresh every 2 seconds when open
    const interval = setInterval(() => {
      if (open) {
        fetchDebugInfo();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [open]);
  
  const handleToggleDebug = (enabled: boolean) => {
    setDebugEnabled(enabled);
    setAuthDebugEnabled(enabled);
  };
  
  const handleRefreshSession = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
    } catch (error) {
      console.error('Failed to refresh session:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleClearAuth = async () => {
    setClearing(true);
    try {
      clearAuthData();
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      setClearing(false);
    }
  };
  
  const downloadDebugInfo = () => {
    const dataStr = JSON.stringify(debugInfo, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', dataUri);
    downloadLink.setAttribute('download', 'auth-debug-info.json');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  if (!open) {
    return (
      <Button 
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 bg-slate-800 text-xs"
      >
        Auth Debug
      </Button>
    );
  }
  
  return (
    <Card className="fixed bottom-4 right-4 w-[400px] max-h-[600px] shadow-lg z-50 bg-slate-800 border-slate-700">
      <CardHeader className="py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Authentication Debug</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Switch 
            id="debug-toggle"
            checked={debugEnabled}
            onCheckedChange={handleToggleDebug}
          />
          <Label htmlFor="debug-toggle">
            Debug logging {debugEnabled ? 'enabled' : 'disabled'}
          </Label>
        </CardDescription>
      </CardHeader>
      
      <div className="flex gap-1 px-6 mb-2">
        <Button 
          variant={selectedTab === 'session' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('session')}
          className="text-xs h-8"
        >
          Session
        </Button>
        <Button 
          variant={selectedTab === 'localStorage' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('localStorage')}
          className="text-xs h-8"
        >
          Storage
        </Button>
        <Button 
          variant={selectedTab === 'events' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('events')}
          className="text-xs h-8"
        >
          Events
        </Button>
        <Button 
          variant={selectedTab === 'errors' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('errors')}
          className="text-xs h-8"
        >
          Errors
        </Button>
      </div>
      
      <CardContent className="pb-4 px-4">
        <ScrollArea className="h-[350px] pr-4">
          {!debugInfo ? (
            <p className="text-sm text-slate-400">Loading debug info...</p>
          ) : selectedTab === 'session' ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Session Checks</h3>
                <div className="mt-1 space-y-2">
                  {debugInfo.sessionChecks.length > 0 ? (
                    [...debugInfo.sessionChecks].reverse().map((check: any, index: number) => (
                      <div key={index} className="px-3 py-2 text-xs bg-slate-700/50 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{check.source}</span>
                          <span className="text-slate-400">{check.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={check.hasSession ? "success" : "destructive"}
                            className={`text-xs ${check.hasSession ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
                          >
                            {check.hasSession ? 'Session Found' : 'No Session'}
                          </Badge>
                          {check.hasSession && check.userId && (
                            <span className="truncate text-slate-300" title={check.userId}>
                              {check.userId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No session checks recorded</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-1">
                <Button 
                  size="sm" 
                  className="w-full h-8"
                  onClick={handleRefreshSession}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refresh Session
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="w-full h-8"
                  onClick={handleClearAuth}
                  disabled={clearing}
                >
                  Clear Auth Data
                </Button>
              </div>
            </div>
          ) : selectedTab === 'localStorage' ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">LocalStorage Operations</h3>
                <div className="mt-1">
                  {debugInfo.localStorage.length > 0 ? (
                    <div className="space-y-2">
                      {[...debugInfo.localStorage].reverse().slice(0, 20).map((item: any, index: number) => (
                        <div key={index} className="px-3 py-2 text-xs bg-slate-700/50 rounded-md">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{item.operation}</span>
                            <span className="text-slate-400">{item.timestamp}</span>
                          </div>
                          <p className="truncate" title={item.key}>{item.key}</p>
                        </div>
                      ))}
                      {debugInfo.localStorage.length > 20 && (
                        <p className="text-xs text-center text-slate-400">
                          + {debugInfo.localStorage.length - 20} more items
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No localStorage operations recorded</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Current LocalStorage Keys</h3>
                <div className="mt-1 space-y-2">
                  {debugInfo.currentStorage && Object.keys(debugInfo.currentStorage).length > 0 ? (
                    Object.entries(debugInfo.currentStorage).map(([key, value]: [string, any], index: number) => (
                      <div key={index} className="px-3 py-2 text-xs bg-slate-700/50 rounded-md">
                        <span className="font-medium">{key}</span>
                        <p className="truncate text-slate-400 mt-1">
                          {typeof value === 'string' && value.length > 50 
                            ? value.substring(0, 50) + '...' 
                            : String(value)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No auth-related items in localStorage</p>
                  )}
                </div>
              </div>
            </div>
          ) : selectedTab === 'events' ? (
            <div>
              <h3 className="text-sm font-medium">Auth Events</h3>
              <div className="mt-1 space-y-2">
                {debugInfo.events.length > 0 ? (
                  [...debugInfo.events].reverse().map((event: any, index: number) => (
                    <div key={index} className="px-3 py-2 text-xs bg-slate-700/50 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{event.message}</span>
                        <span className="text-slate-400">{event.timestamp}</span>
                      </div>
                      {event.data && (
                        <pre className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No auth events recorded</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium">Auth Errors</h3>
              <div className="mt-1 space-y-2">
                {debugInfo.errors.length > 0 ? (
                  [...debugInfo.errors].reverse().map((error: any, index: number) => (
                    <div key={index} className="px-3 py-2 text-xs bg-red-900/20 border border-red-900/40 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-red-400">{error.message}</span>
                        <span className="text-slate-400">{error.timestamp}</span>
                      </div>
                      {error.data && (
                        <pre className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">
                          {JSON.stringify(error.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-green-400">No auth errors recorded! 🎉</p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-3 text-right">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-8"
            onClick={downloadDebugInfo}
          >
            <Download className="h-3 w-3 mr-1" />
            Download Debug Info
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugger; 