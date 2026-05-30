/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  email: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAIL' | 'ADMIN_LOGIN' | 'ADMIN_LOGIN_FAIL' | 'OVERRIDE_CONSTANTS' | 'COURSE_UPLOAD' | 'ALERT_BROADCAST' | 'SYSTEM_INITIALIZATION';
  message: string;
  ipAddress: string;
}

// Generate a random Iraqi IP address (Basra, Baghdad, etc.) for high-fidelity realism
const generateIraqiIP = (): string => {
  const subranges = [
    '37.239',   // Zain Iraq
    '109.127',  // Earthlink
    '185.120',  // Asiacell
    '185.136',  // IQ Online
  ];
  const prefix = subranges[Math.floor(Math.random() * subranges.length)];
  const byte3 = Math.floor(Math.random() * 254) + 1;
  const byte4 = Math.floor(Math.random() * 254) + 1;
  return `${prefix}.${byte3}.${byte4}`;
};

export const appendActivityLog = (
  email: string,
  eventType: ActivityLogEntry['eventType'],
  message: string
): void => {
  try {
    const logsStr = localStorage.getItem('chemsim_activity_logs');
    let logs: ActivityLogEntry[] = [];
    
    if (logsStr) {
      logs = JSON.parse(logsStr);
    }

    // Get or cache user's mock IP address to keep it consistent per session
    let userIP = sessionStorage.getItem('chemsim_user_ip');
    if (!userIP) {
      userIP = generateIraqiIP();
      sessionStorage.setItem('chemsim_user_ip', userIP);
    }

    const newEntry: ActivityLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleString('ar-EG'),
      email: email || 'زائر مجهول / Guest',
      eventType,
      message,
      ipAddress: userIP,
    };

    // Insert at start
    logs.unshift(newEntry);

    // Limit to 100 entries to prevent memory bloating
    if (logs.length > 100) {
      logs = logs.slice(0, 100);
    }

    localStorage.setItem('chemsim_activity_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to append activity log:', error);
  }
};

export const getActivityLogs = (): ActivityLogEntry[] => {
  try {
    const logsStr = localStorage.getItem('chemsim_activity_logs');
    if (!logsStr) {
      // Seed initial initialization log
      const initLogs: ActivityLogEntry[] = [
        {
          id: 'log_seed',
          timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString('ar-EG'),
          email: 'System Kernel',
          eventType: 'SYSTEM_INITIALIZATION',
          message: 'بدء تشغيل منظومة المحاكاة وهياكل ترخيص الهيئة العامة بنجاح.',
          ipAddress: '127.0.0.1'
        }
      ];
      localStorage.setItem('chemsim_activity_logs', JSON.stringify(initLogs));
      return initLogs;
    }
    return JSON.parse(logsStr);
  } catch (e) {
    return [];
  }
};

export const clearActivityLogs = (): void => {
  try {
    localStorage.removeItem('chemsim_activity_logs');
  } catch (e) {
    console.error(e);
  }
};
