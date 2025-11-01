'use client';

import { Anchor, Fish, Users } from 'lucide-react';
import FadeIn from '@/components/motion/FadeIn';
import SlideUp from '@/components/motion/SlideUp';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * Alternative version with gradient background instead of external image
 * Rename this file to page.tsx if you prefer gradient over image
 */
export default function Home() {
  return (
    <div className="pt-16 pb-24">
      {/* Hero Section with Gradient */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-teal">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-teal rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-navy-light rounded-full filter blur-3xl animate-pulse delay-1000" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <FadeIn delay={0.2}>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              İstanbul Boğazı'nda
              <br />
              <span className="text-teal-light">Unutulmaz Anlar</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Tekne kiralama ve balık avı turlarıyla denizin tadını çıkarın
            </p>
          </FadeIn>

          <FadeIn delay={0.6}>
            <Button variant="primary" size="lg">
              Rezervasyon Yap
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SlideUp delay={0.2}>
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
            Hizmetlerimiz
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Size özel hazırlanmış deneyimlerimizle unutulmaz anılar biriktirin
          </p>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SlideUp delay={0.3}>
            <Card
              icon={Anchor}
              title="Tekne Kiralama"
              description="Lüks teknelerimizle Boğaz'ın eşsiz manzarasının keyfini çıkarın"
              onClick={() => console.log('Tekne Kiralama')}
            />
          </SlideUp>

          <SlideUp delay={0.4}>
            <Card
              icon={Fish}
              title="Balık Avı Turu"
              description="Profesyonel rehberlerimiz eşliğinde balık avı deneyimi yaşayın"
              onClick={() => console.log('Balık Avı')}
            />
          </SlideUp>

          <SlideUp delay={0.5}>
            <Card
              icon={Users}
              title="Grup Rezervasyon"
              description="Özel günleriniz için grup rezervasyonları ve organizasyonlar"
              onClick={() => console.log('Grup Rezervasyon')}
            />
          </SlideUp>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-navy to-navy-light py-20 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <SlideUp delay={0.2}>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Neden Balık Sefası?
            </h2>
          </SlideUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <SlideUp delay={0.3}>
              <div className="text-white">
                <div className="text-5xl font-bold text-teal mb-2">5</div>
                <p className="text-lg">Yıllık Deneyim</p>
              </div>
            </SlideUp>

            <SlideUp delay={0.4}>
              <div className="text-white">
                <div className="text-5xl font-bold text-teal mb-2">10.000+</div>
                <p className="text-lg">Mutlu Müşteri</p>
              </div>
            </SlideUp>

            <SlideUp delay={0.5}>
              <div className="text-white">
                <div className="text-5xl font-bold text-teal mb-2">4+</div>
                <p className="text-lg">Tekne Filosu</p>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>
    </div>
  );
}
