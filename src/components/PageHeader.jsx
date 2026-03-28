import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({ title, onBack, rightAction }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 border-b border-[#2c2c2c]"
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-[#2c2c2c] transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft size={24} className="text-white" />
          </motion.button>
        )}
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>
      {rightAction && (
        <div>{rightAction}</div>
      )}
    </motion.div>
  );
}
