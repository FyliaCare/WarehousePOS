/**
 * QuickAddFAB - Mobile Floating Action Button for Quick Product Addition
 * 
 * A beautiful FAB that:
 * 1. Appears on mobile/tablet for quick product add
 * 2. Opens a slide-up modal with SmartProductForm in quick mode
 * 3. Supports Ghana/Nigeria theming
 * 4. Has smooth animations
 */

import { useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category, Currency } from '@warehousepos/types';
import SmartProductForm from './SmartProductForm';

interface QuickAddFABProps {
  categories: Category[];
  currency: Currency;
  onProductAdded: () => void;
  brandColor?: string;
  brandTextColor?: string;
}

export function QuickAddFAB({
  categories,
  currency,
  onProductAdded,
  brandColor = '#008751',
  brandTextColor = '#FFFFFF',
}: QuickAddFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    onProductAdded();
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center lg:hidden"
            style={{ backgroundColor: brandColor }}
          >
            <Plus className="w-6 h-6" style={{ color: brandTextColor }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden lg:hidden"
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <Zap className="w-5 h-5" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Quick Add</h2>
                    <p className="text-xs text-gray-500">Add a new product</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form Container */}
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-100px)]">
                <SmartProductForm
                  categories={categories}
                  currency={currency}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                  initialMode="quick"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default QuickAddFAB;
