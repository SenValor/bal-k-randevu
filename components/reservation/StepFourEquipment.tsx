'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EquipmentOptionCard from './EquipmentOptionCard';
import PriceSummaryBox from './PriceSummaryBox';
import StepNavigation from './StepNavigation';

const PRICES = {
  adultWithGear: 1250,
  adultOwnGear: 1000,
  childWithGear: 625, // %50 indirim
  childOwnGear: 500,
};

export default function StepFourEquipment() {
  // localStorage'dan kişi sayılarını al
  const [totalAdults, setTotalAdults] = useState(0);
  const [totalChildren, setTotalChildren] = useState(0);

  const [adultGear, setAdultGear] = useState({ with: 0, own: 0 });
  const [childGear, setChildGear] = useState({ with: 0, own: 0 });
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // localStorage'dan rezervasyon verilerini al
    const reservationData = localStorage.getItem('reservationData');
    if (reservationData) {
      const data = JSON.parse(reservationData);
      const adults = data.adultCount || 0;
      const children = data.childCount || 0;
      
      setTotalAdults(adults);
      setTotalChildren(children);
      
      // Başlangıçta tüm yetişkinleri "Ekipman Dahil" olarak ayarla
      setAdultGear({ with: adults, own: 0 });
      // Başlangıçta tüm çocukları "Ekipman Dahil" olarak ayarla
      setChildGear({ with: children, own: 0 });
    }
  }, []);

  useEffect(() => {
    const total =
      adultGear.with * PRICES.adultWithGear +
      adultGear.own * PRICES.adultOwnGear +
      childGear.with * PRICES.childWithGear +
      childGear.own * PRICES.childOwnGear;
    setTotalPrice(total);
  }, [adultGear, childGear]);

  const handleAdultWithIncrement = () => {
    if (adultGear.with + adultGear.own < totalAdults) {
      setAdultGear({ ...adultGear, with: adultGear.with + 1 });
    }
  };

  const handleAdultWithDecrement = () => {
    if (adultGear.with > 0) {
      setAdultGear({ ...adultGear, with: adultGear.with - 1 });
    }
  };

  const handleAdultOwnIncrement = () => {
    if (adultGear.with + adultGear.own < totalAdults) {
      setAdultGear({ ...adultGear, own: adultGear.own + 1 });
    }
  };

  const handleAdultOwnDecrement = () => {
    if (adultGear.own > 0) {
      setAdultGear({ ...adultGear, own: adultGear.own - 1 });
    }
  };

  const handleChildWithIncrement = () => {
    if (childGear.with + childGear.own < totalChildren) {
      setChildGear({ ...childGear, with: childGear.with + 1 });
    }
  };

  const handleChildWithDecrement = () => {
    if (childGear.with > 0) {
      setChildGear({ ...childGear, with: childGear.with - 1 });
    }
  };

  const handleChildOwnIncrement = () => {
    if (childGear.with + childGear.own < totalChildren) {
      setChildGear({ ...childGear, own: childGear.own + 1 });
    }
  };

  const handleChildOwnDecrement = () => {
    if (childGear.own > 0) {
      setChildGear({ ...childGear, own: childGear.own - 1 });
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleContinue = () => {
    // Olta seçimlerini localStorage'a kaydet
    const equipmentData = {
      adultGear,
      childGear,
      totalPrice,
      breakdown: priceBreakdown
    };
    localStorage.setItem('equipmentSelection', JSON.stringify(equipmentData));
    
    console.log('Olta seçimleri:', equipmentData);
    
    // Rezervasyon özetine geç
    window.location.href = '/rezervasyon/step-four';
  };

  const priceBreakdown = [
    ...(adultGear.with > 0
      ? [{ label: `${adultGear.with} Yetişkin (Ekipman Dahil)`, price: adultGear.with * PRICES.adultWithGear }]
      : []),
    ...(adultGear.own > 0
      ? [{ label: `${adultGear.own} Yetişkin (Kendi Ekipmanı)`, price: adultGear.own * PRICES.adultOwnGear }]
      : []),
    ...(childGear.with > 0
      ? [{ label: `${childGear.with} Çocuk (Ekipman Dahil)`, price: childGear.with * PRICES.childWithGear }]
      : []),
    ...(childGear.own > 0
      ? [{ label: `${childGear.own} Çocuk (Kendi Ekipmanı)`, price: childGear.own * PRICES.childOwnGear }]
      : []),
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D2847] mb-3">
            Olta <span className="text-[#6B9BC3]">Seçimi</span>
          </h1>
          <p className="text-lg text-[#1B3A5C]/70">
            Her kişi için olta durumunu belirleyin
          </p>
        </motion.div>

        {/* Adults Section */}
        {totalAdults > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-[#0D2847] mb-4">
              Yetişkinler ({totalAdults} kişi)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EquipmentOptionCard
                title="Ekipman Dahil"
                price={PRICES.adultWithGear}
                count={adultGear.with}
                onIncrement={handleAdultWithIncrement}
                onDecrement={handleAdultWithDecrement}
                isActive={adultGear.with > 0}
              />
              <EquipmentOptionCard
                title="Kendi Ekipmanı"
                price={PRICES.adultOwnGear}
                count={adultGear.own}
                onIncrement={handleAdultOwnIncrement}
                onDecrement={handleAdultOwnDecrement}
                isActive={adultGear.own > 0}
              />
            </div>
          </motion.section>
        )}

        {/* Children Section */}
        {totalChildren > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-[#0D2847] mb-4">
              Çocuklar ({totalChildren} kişi)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EquipmentOptionCard
                title="Ekipman Dahil"
                price={PRICES.childWithGear}
                count={childGear.with}
                onIncrement={handleChildWithIncrement}
                onDecrement={handleChildWithDecrement}
                isActive={childGear.with > 0}
              />
              <EquipmentOptionCard
                title="Kendi Ekipmanı"
                price={PRICES.childOwnGear}
                count={childGear.own}
                onIncrement={handleChildOwnIncrement}
                onDecrement={handleChildOwnDecrement}
                isActive={childGear.own > 0}
              />
            </div>
          </motion.section>
        )}

        {/* Price Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <PriceSummaryBox breakdown={priceBreakdown} totalPrice={totalPrice} />
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <StepNavigation onBack={handleBack} onContinue={handleContinue} />
        </motion.div>
      </div>
    </main>
  );
}
