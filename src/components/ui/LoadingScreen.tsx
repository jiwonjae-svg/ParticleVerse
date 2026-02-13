'use client';

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div className="text-center">
        {/* Logo animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative w-24 h-24 mx-auto">
            {/* Particle effect */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary-500"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((i * 30 * Math.PI) / 180) * 40,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 40,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* Center circle */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold text-white mb-2"
        >
          ParticleVerse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-dark-400 text-sm"
        >
          Preparing 3D environment...
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '200px' }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mx-auto mt-6 h-1 bg-dark-800 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
