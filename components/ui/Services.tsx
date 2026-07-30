"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Anchor, Fish, Users } from "lucide-react";
import { useRef } from "react";
import Card from "./Card";
import ReservationButton from "./ReservationButton";
import { useLanguage } from "@/context/LanguageContext";

export default function Services() {
  const ref = useRef(null);
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const services = [
    {
      icon: Anchor,
      title: t('services.boatRental'),
      desc: t('services.boatRentalDesc'),
    },
    {
      icon: Fish,
      title: t('services.fishingTour'),
      desc: t('services.fishingTourDesc'),
    },
    {
      icon: Users,
      title: t('services.groupReservation'),
      desc: t('services.groupReservationDesc'),
    },
  ];

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center px-4 md:px-6 bg-gradient-to-b from-[#6596ce] via-[#5B8DB8] to-[#6596ce] py-20"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto w-full"
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            {t('services.title')}
          </h2>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            {t('services.desc')}
          </p>
        </motion.div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                delay: i * 0.15,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card
                icon={service.icon}
                title={service.title}
                description={service.desc}
                onClick={() => console.log(service.title)}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-12"
        >
          <ReservationButton size="md" />
        </motion.div>
      </motion.div>
    </section>
  );
}
