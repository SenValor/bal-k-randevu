"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

export default function GallerySection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      text: "Harika bir deneyimdi! Tekne çok lüks ve mürettebat son derece profesyoneldi.",
      rating: 5,
    },
    {
      name: "Zeynep Kaya",
      text: "Balık avı turunda muhteşem bir gün geçirdik. Kesinlikle tekrar geleceğiz!",
      rating: 5,
    },
    {
      name: "Mehmet Demir",
      text: "Boğaz'ın en güzel yerlerini gezdik. Organizasyon mükemmeldi.",
      rating: 5,
    },
  ];

  return (
    <section
      ref={ref}
      className="relative py-32 bg-white overflow-hidden"
    >
      <motion.div style={{ opacity }} className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Binlerce mutlu müşterimizden bazı yorumlar
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              style={{ y: i % 2 === 0 ? y1 : y2 }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg border border-gray-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, idx) => (
                  <Star
                    key={idx}
                    className="w-5 h-5 fill-teal text-teal"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-base mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-navy flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-navy">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">Müşteri</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-navy text-white font-semibold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-shadow duration-300"
          >
            Tüm Yorumları Gör
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Background Decoration */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-teal/5 rounded-full filter blur-3xl" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-navy/5 rounded-full filter blur-3xl" />
    </section>
  );
}
