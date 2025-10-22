// frontend/src/pages/HomePage.jsx

import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { FaMapMarkedAlt, FaLock, FaBolt } from "react-icons/fa";

function HomePage() {
  return (
    <div 
      className="min-h-screen relative bg-white" 
      // 1. GŁÓWNY KONTENER JEST TERAZ TYLKO CZARNYM TŁEM (POD SPODEM)
      //    Usunęliśmy stąd 'backgroundImage'
    >
      {/* 2. USUNĘLIŚMY STARY "OVERLAY" (gradient) - nie jest potrzebny */}

      {/* --- Animowane Tło (Dwie Połówki Wlatujące) --- */}
      
      {/* Połówka z Prawego Górnego rogu */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/tło.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          // Maska: trójkąt zakrywający lewy-górny róg
          clipPath: 'polygon(0 0, 100% 0, 0 100%)'
        }}
        initial={{ x: '100%', y: '-100%' }} // Zaczyna w PRAWYM GÓRNYM rogu
        animate={{ x: 0, y: 0 }}           // Wlatuje na swoje miejsce
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
      />

      {/* Połówka z Lewego Dolnego rogu */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/tło.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          // Maska: trójkąt zakrywający prawy-dolny róg
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
        }}
        initial={{ x: '-100%', y: '100%' }} // Zaczyna w LEWYM DOLNYM rogu
        animate={{ x: 0, y: 0 }}           // Wlatuje na swoje miejsce
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
      />
      
      {/* --- Koniec Animowanego Tła --- */}

      {/* 5. CAŁA TREŚĆ JEST NADAL NA WARSTWIE z-10 (NA WIERZCHU) */}
      <div className="max-w-7xl px-8 sm:px-10 lg:px-40 pt-20 pb-16 relative z-10">
        <motion.div 
          className="text-left" // <-- Naprawiona literówka (usunięte 'S')
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }} // Dodane opóźnienie, by tekst wjechał PO otwarciu tła
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Znajdź parking <span className="text-parkchain-500">łatwiej!</span>
          </h1>
          <p className="text-xl text-white mb-20 mt-10 max-w-2xl">
            Rezerwuj miejsca parkingowe z wyprzedzeniem i oszczędzaj czas.
            <br />
            Blockchain gwarantuje bezpieczeństwo transakcji.
          </p>
          <div className="flex justify-start gap-4">
            <Link
              to="/map"
              className="bg-parkchain-500 hover:bg-parkchain-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Zobacz mapę
            </Link>
            <button className="bg-transparent hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors border-2 border-white">
              Dowiedz się więcej
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <div className="text-4xl mb-4 text-parkchain-500"><FaMapMarkedAlt /></div>
            <h3 className="text-xl font-bold mb-2 text-white">Interaktywna mapa</h3> {/* Poprawiony kolor tekstu */}
            <p className="text-gray-200"> {/* Poprawiony kolor tekstu */}
              Zobacz wszystkie dostępne miejsca parkingowe w Twojej okolicy
            </p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <div className="text-4xl mb-4 text-parkchain-500"><FaLock /></div>
            <h3 className="text-xl font-bold mb-2 text-white">Bezpieczne płatności</h3> {/* Poprawiony kolor tekstu */}
            <p className="text-gray-200"> {/* Poprawiony kolor tekstu */}
              Blockchain zapewnia transparentność i bezpieczeństwo transakcji
            </p>
          </motion.div>
          <motion.div 
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-white/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <div className="text-4xl mb-4 text-parkchain-500"><FaBolt /></div>
            <h3 className="text-xl font-bold mb-2 text-white">Szybka rezerwacja</h3> {/* Poprawiony kolor tekstu */}
            <p className="text-gray-200"> {/* Poprawiony kolor tekstu */}
              Zarezerwuj miejsce w kilka sekund i zaoszczędź czas
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;