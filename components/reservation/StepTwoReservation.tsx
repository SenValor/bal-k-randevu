'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarSection from './CalendarSection';
import TourSlotSection from './TourSlotSection';
import PeopleSection from './PeopleSection';
import SeatSelectionModal from './SeatSelectionModal';

export default function StepTwoReservation() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTour, setSelectedTour] = useState<{ id: number; time: string; title: string; availableSeats?: number } | null>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [babyCount, setBabyCount] = useState(0);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  // Refs for auto-scroll
  const tourSectionRef = useRef<HTMLDivElement>(null);
  const peopleSectionRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTour(null); // Reset tour when date changes
    
    // Tarih seçildiğinde saat seçimine scroll yap
    setTimeout(() => {
      tourSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  };

  const handleTourSelect = (tour: { id: number; time: string; title: string }) => {
    setSelectedTour(tour);
    
    // Saat seçildiğinde kişi sayısına scroll yap
    setTimeout(() => {
      peopleSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  };

  const handlePeopleConfirm = () => {
    setIsSeatModalOpen(true);
  };

  const totalPeople = adultCount + childCount;

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
          <h1 className="text-4xl md:text-5xl font-bold text-[#0D2847] mb-3">
            Rezervasyon <span className="text-[#6B9BC3]">Detayları</span>
          </h1>
          <p className="text-[#1B3A5C]/70 text-lg">
            Tarih, saat ve kişi sayısını seçin
          </p>
        </motion.div>

        {/* Step 1: Calendar */}
        <CalendarSection
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Step 2: Tour & Time Slots - Only show when date is selected */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              ref={tourSectionRef}
              key="tour-section"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            >
              <TourSlotSection
                selectedDate={selectedDate}
                selectedTour={selectedTour}
                onTourSelect={handleTourSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: People Count - Only show when tour is selected */}
        <AnimatePresence mode="wait">
          {selectedTour && (
            <motion.div
              ref={peopleSectionRef}
              key="people-section"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.1 }}
            >
              <PeopleSection
                adultCount={adultCount}
                setAdultCount={setAdultCount}
                childCount={childCount}
                setChildCount={setChildCount}
                babyCount={babyCount}
                setBabyCount={setBabyCount}
                onConfirm={handlePeopleConfirm}
                maxCapacity={selectedTour?.availableSeats}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Seat Selection Modal */}
        <SeatSelectionModal
          isOpen={isSeatModalOpen}
          onClose={() => setIsSeatModalOpen(false)}
          peopleCount={totalPeople}
          selectedDate={selectedDate}
          selectedTour={selectedTour}
          adultCount={adultCount}
          childCount={childCount}
          babyCount={babyCount}
        />
      </div>
    </main>
  );
}
