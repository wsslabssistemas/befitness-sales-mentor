import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';

export default function NotificationProvider() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = base44.entities.Customer.subscribe((event) => {
      if (event.type === 'create') {
        const customer = event.data;
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, name: customer.name, phone: customer.phone }]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 6000);
      }
    });
    return unsubscribe;
  }, []);

  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-xl border border-orange-100 shadow-xl p-4 flex items-start gap-3 pointer-events-auto"
          >
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Novo cliente na base!</p>
              <p className="text-sm text-gray-500 truncate">{n.name}{n.phone ? ` • ${n.phone}` : ''}</p>
            </div>
            <button onClick={() => dismiss(n.id)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}