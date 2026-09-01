'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import EquipmentOptionCard from '@/components/reservation/EquipmentOptionCard';
import PriceSummaryBox from '@/components/reservation/PriceSummaryBox';
import StepNavigation from '@/components/reservation/StepNavigation';
import ReservationNewYearDecor from '@/components/seasonal/ReservationNewYearDecor';

export default function StepEquipment() {
  const [totalAdults, setTotalAdults] = useState(0);
  const [totalChildren, setTotalChildren] = useState(0);
  const [tourCategory, setTourCategory] = useState<string>('');

  const [prices, setPrices] = useState({
    adultWithGear: 0,
    adultOwnGear: 0,
    childWithGear: 0,
    childOwnGear: 0,
  });
  // priceOwnGear admin tarafından açıkça girildi mi?
  const [hasOwnGearPrice, setHasOwnGearPrice] = useState(false);

  const [adultGear, setAdultGear] = useState({ with: 0, own: 0 });
  const [childGear, setChildGear] = useState({ with: 0, own: 0 });
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const applyTourPrices = (tour: any) => {
      const adultWith = tour.price || 0;
      // priceOwnGear admin tarafından girilmişse ve farklıysa kullan
      const ownGearSet = tour.priceOwnGear > 0 && tour.priceOwnGear !== adultWith;
      const adultOwn  = ownGearSet ? tour.priceOwnGear : adultWith;
      const childWith = tour.childPrice > 0 ? tour.childPrice : Math.round(adultWith * 0.5);
      const childOwn  = tour.childPriceOwnGear > 0 ? tour.childPriceOwnGear : Math.round(adultOwn * 0.5);

      setHasOwnGearPrice(ownGearSet);
      setPrices({ adultWithGear: adultWith, adultOwnGear: adultOwn, childWithGear: childWith, childOwnGear: childOwn });
      setTourCategory(tour.category || '');
    };

    const tourData = localStorage.getItem('selectedTourType');
    if (tourData) {
      const cached = JSON.parse(tourData);
      applyTourPrices(cached);

      if (cached.id) {
        getDoc(doc(db, 'tours', cached.id)).then((snap) => {
          if (snap.exists()) {
            const fresh = snap.data();
            const updated = { ...cached, ...fresh, id: cached.id };
            applyTourPrices(updated);
            localStorage.setItem('selectedTourType', JSON.stringify(updated));
          }
        }).catch(() => {});
      }
    }

    const reservationData = localStorage.getItem('reservationData');
    if (reservationData) {
      const data = JSON.parse(reservationData);
      const adults   = data.adultCount   || 0;
      const children = data.childCount   || 0;
      setTotalAdults(adults);
      setTotalChildren(children);
      setAdultGear({ with: adults, own: 0 });
      setChildGear({ with: children, own: 0 });
    }
  }, []);

  // EKİPMANSIZ TUR veya ekipman seçimi gereksizse otomatik geç
  useEffect(() => {
    if (!tourCategory) return;
    if (tourCategory !== 'normal-with-equipment') {
      // Tüm kişiler "kendi ekipmanı" olarak işaretle, sayfayı atla
      const tourData = localStorage.getItem('selectedTourType');
      const reservationData = localStorage.getItem('reservationData');
      if (!tourData || !reservationData) return;

      const tour = JSON.parse(tourData);
      const data = JSON.parse(reservationData);
      const adults   = data.adultCount   || 0;
      const children = data.childCount   || 0;
      const price    = tour.price || 0;
      const childPr  = tour.childPrice > 0 ? tour.childPrice : Math.round(price * 0.5);
      const total    = adults * price + children * childPr;

      const equipmentData = {
        adultGear:  { with: 0, own: adults },
        childGear:  { with: 0, own: children },
        totalPrice: total,
        breakdown: [
          ...(adults   > 0 ? [{ label: `${adults} Yetişkin`, price: adults * price }]     : []),
          ...(children > 0 ? [{ label: `${children} Çocuk`,  price: children * childPr }] : []),
        ],
      };
      localStorage.setItem('equipmentSelection', JSON.stringify(equipmentData));
      window.location.replace('/rezervasyon/step-four');
    }
  }, [tourCategory]);

  useEffect(() => {
    const total =
      adultGear.with * prices.adultWithGear +
      adultGear.own * prices.adultOwnGear +
      childGear.with * prices.childWithGear +
      childGear.own * prices.childOwnGear;
    setTotalPrice(total);
  }, [adultGear, childGear, prices]);

  const handleAdultWithIncrement = () => {
    if (adultGear.with + adultGear.own < totalAdults) {
      setAdultGear({ ...adultGear, with: adultGear.with + 1 });
    }
  };
  const handleAdultWithDecrement = () => {
    if (adultGear.with > 0) setAdultGear({ ...adultGear, with: adultGear.with - 1 });
  };
  const handleAdultOwnIncrement = () => {
    if (adultGear.with + adultGear.own < totalAdults) {
      setAdultGear({ ...adultGear, own: adultGear.own + 1 });
    }
  };
  const handleAdultOwnDecrement = () => {
    if (adultGear.own > 0) setAdultGear({ ...adultGear, own: adultGear.own - 1 });
  };
  const handleChildWithIncrement = () => {
    if (childGear.with + childGear.own < totalChildren) {
      setChildGear({ ...childGear, with: childGear.with + 1 });
    }
  };
  const handleChildWithDecrement = () => {
    if (childGear.with > 0) setChildGear({ ...childGear, with: childGear.with - 1 });
  };
  const handleChildOwnIncrement = () => {
    if (childGear.with + childGear.own < totalChildren) {
      setChildGear({ ...childGear, own: childGear.own + 1 });
    }
  };
  const handleChildOwnDecrement = () => {
    if (childGear.own > 0) setChildGear({ ...childGear, own: childGear.own - 1 });
  };

  const handleBack = () => { window.history.back(); };

  const priceBreakdown = [
    ...(adultGear.with > 0 ? [{ label: `${adultGear.with} Yetişkin (Ekipman Dahil)`, price: adultGear.with * prices.adultWithGear }] : []),
    ...(adultGear.own > 0  ? [{ label: `${adultGear.own} Yetişkin (Kendi Ekipmanı)`,  price: adultGear.own * prices.adultOwnGear }]  : []),
    ...(childGear.with > 0 ? [{ label: `${childGear.with} Çocuk (Ekipman Dahil)`,    price: childGear.with * prices.childWithGear }] : []),
    ...(childGear.own > 0  ? [{ label: `${childGear.own} Çocuk (Kendi Ekipmanı)`,     price: childGear.own * prices.childOwnGear }]  : []),
  ];

  const handleContinue = () => {
    localStorage.setItem('equipmentSelection', JSON.stringify({ adultGear, childGear, totalPrice, breakdown: priceBreakdown }));
    window.location.href = '/rezervasyon/step-four';
  };

  // EKİPMANSIZ / özel tur → otomatik yönlendirme yapılıyor, boş sayfa gösterme
  if (tourCategory && tourCategory !== 'normal-with-equipment') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6B9BC3] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-32 px-4">
      <ReservationNewYearDecor />

      <div className="max-w-4xl mx-auto">
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
            <div className={`grid grid-cols-1 ${hasOwnGearPrice ? 'md:grid-cols-2' : ''} gap-4`}>
              <EquipmentOptionCard
                title="Ekipman Dahil"
                price={prices.adultWithGear}
                count={adultGear.with}
                onIncrement={handleAdultWithIncrement}
                onDecrement={handleAdultWithDecrement}
                isActive={adultGear.with > 0}
              />
              {hasOwnGearPrice && (
                <EquipmentOptionCard
                  title="Kendi Ekipmanı"
                  price={prices.adultOwnGear}
                  count={adultGear.own}
                  onIncrement={handleAdultOwnIncrement}
                  onDecrement={handleAdultOwnDecrement}
                  isActive={adultGear.own > 0}
                />
              )}
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
            <div className={`grid grid-cols-1 ${hasOwnGearPrice ? 'md:grid-cols-2' : ''} gap-4`}>
              <EquipmentOptionCard
                title="Ekipman Dahil"
                price={prices.childWithGear}
                count={childGear.with}
                onIncrement={handleChildWithIncrement}
                onDecrement={handleChildWithDecrement}
                isActive={childGear.with > 0}
              />
              {hasOwnGearPrice && (
                <EquipmentOptionCard
                  title="Kendi Ekipmanı"
                  price={prices.childOwnGear}
                  count={childGear.own}
                  onIncrement={handleChildOwnIncrement}
                  onDecrement={handleChildOwnDecrement}
                  isActive={childGear.own > 0}
                />
              )}
            </div>
          </motion.section>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <PriceSummaryBox breakdown={priceBreakdown} totalPrice={totalPrice} />
        </motion.div>

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
