"use client";

import Dock from "./Dock";
import { Home, Calendar, Ship, User, Settings, CalendarCheck, Anchor } from 'lucide-react';

export default function DockWrapper() {
  const items = [
    {
      icon: <Home size={20} />,
      label: "Ana Sayfa",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      },
    },
    {
      icon: <Calendar size={20} />,
      label: "Rezervasyon Yap",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/rezervasyon";
        }
      },
    },
    {
      icon: <CalendarCheck size={20} />,
      label: "Randevularım",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/my-reservations";
        }
      },
    },
    {
      icon: <User size={20} />,
      label: "Profil",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/profile";
        }
      },
    },
    {
      icon: <Settings size={20} />,
      label: "Ayarlar",
      onClick: () => {
        if (typeof window !== "undefined") {
          alert("Ayarlar sayfası yakında!");
        }
      },
    },
  ];

  return (
    <Dock
      items={items}
      panelHeight={68}
      baseItemSize={50}
      magnification={70}
      distance={140}
      spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
    />
  );
}
