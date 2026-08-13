'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getAdminInfo, logAdminAction, AdminAction } from '@/lib/adminHelpers';

// Firestore admins koleksiyonu kurulana kadar geçici bootstrap listesi.
// Koleksiyonu Firebase Console'dan oluşturduktan sonra bu listeyi temizleyebilirsiniz.
const BOOTSTRAP_ADMINS: Record<string, string> = {
  'baliksefasi33@admin.com': 'Ana Admin',
  'bukre@akturk.com': 'Bukre',
};

interface AdminContextType {
  adminName: string;
  adminEmail: string;
  isAdminLoading: boolean;
  isAuthorized: boolean;
  logAction: (
    action: AdminAction,
    details?: {
      targetId?: string;
      reservationNumber?: string;
      extra?: Record<string, unknown>;
    }
  ) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [adminName, setAdminName] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setIsAdminLoading(false);
      return;
    }

    setIsAdminLoading(true);
    getAdminInfo(user.email).then((info) => {
      if (info) {
        // Firestore'da bulundu
        setAdminName(info.name);
        setIsAuthorized(true);
      } else if (BOOTSTRAP_ADMINS[user.email!]) {
        // Firestore koleksiyonu henüz kurulmamış, bootstrap listesinden izin ver
        setAdminName(BOOTSTRAP_ADMINS[user.email!]);
        setIsAuthorized(true);
      } else {
        setAdminName('');
        setIsAuthorized(false);
      }
      setIsAdminLoading(false);
    });
  }, [user?.email]);

  const logAction = async (
    action: AdminAction,
    details?: {
      targetId?: string;
      reservationNumber?: string;
      extra?: Record<string, unknown>;
    }
  ) => {
    if (!user?.email) return;
    await logAdminAction(user.email, adminName, action, details);
  };

  return (
    <AdminContext.Provider
      value={{
        adminName,
        adminEmail: user?.email ?? '',
        isAdminLoading,
        isAuthorized,
        logAction,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
