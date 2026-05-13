import { motion } from 'framer-motion';
const stats = [
  { value: '10,00,000+', label: 'Active Students', icon: '👨‍🎓' },
  { value: '500+', label: 'Expert Teachers', icon: '👨‍🏫' },
  { value: '50,000+', label: 'Practice Tests', icon: '📝' },
  { value: '95%', label: 'Success Rate', icon: '🏆' },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-primary-600 dark:bg-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-primary-200">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
