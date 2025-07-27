import { useState, useEffect } from 'react';
import { isOnline } from '../services/api';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function checkStatus() {
      const status = await isOnline();
      if (mounted) setOnline(status);
    }
    
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    
    return () => { 
      mounted = false; 
      clearInterval(interval); 
    };
  }, []);

  return { online, setOnline };
} 