'use client';

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./sidebar";
import { Home, Calendar, Image, Mail, Info, Waves, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Header() {
  const links = [
    {
      label: "Ana Sayfa",
      href: "/",
      icon: <Home className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Rezervasyon",
      href: "/rezervasyon",
      icon: <Calendar className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Galeri",
      href: "/galeri",
      icon: <Image className="h-5 w-5 shrink-0" />,
    },
    {
      label: "İletişim",
      href: "/iletisim",
      icon: <Mail className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Hakkımızda",
      href: "/hakkimizda",
      icon: <Info className="h-5 w-5 shrink-0" />,
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-lg shadow-teal/30">
        <Waves className="w-6 h-6 text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-lg whitespace-pre text-white dark:text-white"
      >
        Balık Sefası
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1"
    >
      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-lg shadow-teal/30">
        <Waves className="w-6 h-6 text-white" />
      </div>
    </a>
  );
};
