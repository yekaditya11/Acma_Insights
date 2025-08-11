/**
 * Enhanced Chat Loading Indicator
 * Beautiful loading animations for the SafetyConnect chatbot
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ChatLoadingIndicator = ({ message = "AI is analyzing...", steps = [] }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, py: 1, pl: 1 }}>
      {/* Left: bot icon */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BotIcon sx={{ fontSize: 20, color: '#1976d2', opacity: 0.8 }} />
      </motion.div>

      {/* Right: vertical stepper */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* Optional message shown only when there are no steps yet */}
        {(!steps || steps.length === 0) && (
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {message}
          </Typography>
        )}

        {Array.isArray(steps) && steps.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {steps.map((label, idx) => {
              const isCurrent = idx === steps.length - 1;
              return (
                <Box key={`${label}-${idx}`} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  {/* Rail + Node */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: isCurrent ? '#1e40af' : '#cbd5e1',
                        boxShadow: isCurrent ? '0 0 0 3px #bfdbfe' : 'none',
                        mt: 0.25,
                      }}
                    />
                    {idx < steps.length - 1 && (
                      <Box sx={{ width: 2, flex: 1, bgcolor: '#e2e8f0', mt: 0.5, mb: -0.5 }} />
                    )}
                  </Box>
                  {/* Label */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: isCurrent ? '#1e40af' : '#64748b',
                      fontWeight: isCurrent ? 600 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatLoadingIndicator;
