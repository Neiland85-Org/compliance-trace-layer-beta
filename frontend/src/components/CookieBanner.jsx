import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CookieBanner = ({ onAccept, onReject, onCustomize }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar el banner después de un breve delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept && onAccept();
  };

  const handleReject = () => {
    setIsVisible(false);
    onReject && onReject();
  };

  const handleCustomize = () => {
    onCustomize && onCustomize();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-2xl z-50"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🍪</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Cookies & Privacy
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                We use cookies to enhance your experience, analyze traffic, and personalize content.
                You can manage your preferences or accept all cookies.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Accept All
                </button>
                <button
                  onClick={handleCustomize}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Customize
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Reject All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;