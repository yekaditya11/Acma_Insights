/**
 * Simple AI Analysis Page
 * Clean, minimal page showing AI insights as simple bullet points
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import SafetyConnectLayout from '../components/layout/SafetyConnectLayout';
import ApiService from '../services/api';

const SimpleAIAnalysisPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);

  // Get parameters from URL
  const module = searchParams.get('module') || 'incident-investigation';
  const days = parseInt(searchParams.get('days')) || 30;

  // Module display names
  const moduleNames = {
    'incident-investigation': 'Incident Investigation',
    'risk-assessment': 'Risk Assessment',
    'action-tracking': 'Action Tracking',
    'driver-safety': 'Driver Safety Checklists',
    'observation-tracker': 'Observation Tracker',
    'equipment-asset': 'Equipment Asset Management',
    'employee-training': 'Employee Training & Fitness',
  };

  // Fetch AI analysis data
  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;
        
        switch (module) {
          case 'incident-investigation':
            response = await ApiService.getIncidentInvestigationAIAnalysis(null, days, true);
            break;
          case 'risk-assessment':
            response = await ApiService.getRiskAssessmentAIAnalysis(null, days, true);
            break;
          case 'action-tracking':
            response = await ApiService.getActionTrackingAIAnalysis(null, days, true);
            break;
          case 'driver-safety':
            response = await ApiService.getDriverSafetyAIAnalysis(null, days, true);
            break;
          case 'observation-tracker':
            response = await ApiService.getObservationTrackerAIAnalysis(null, days, true);
            break;
          case 'equipment-asset':
            response = await ApiService.getEquipmentAssetAIAnalysis(null, days, true);
            break;
          case 'employee-training':
            response = await ApiService.getEmployeeTrainingAIAnalysis(null, days, true);
            break;
          default:
            throw new Error(`Unknown module: ${module}`);
        }

        if (response && response.success && response.ai_analysis) {
          setAnalysisData(response.ai_analysis);
        } else {
          setError('No AI analysis data available');
        }
      } catch (err) {
        console.error('Error fetching AI analysis:', err);
        setError('Failed to load AI analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [module, days]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <SafetyConnectLayout>
      <Box sx={{ px: 3, py: 2 }}>
        {/* Simple Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 3 }}>
            <Button
              onClick={handleBack}
              startIcon={<BackIcon />}
              sx={{
                mb: 2,
                color: '#6b7280',
                fontSize: '14px',
                '&:hover': { color: '#092f57' }
              }}
            >
              Back to Dashboard
            </Button>

            <Typography variant="h5" sx={{
              fontWeight: 600,
              color: '#092f57',
              mb: 1
            }}>
              {moduleNames[module] || module}
            </Typography>
          </Box>
        </motion.div>

        {/* Simple Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                py: 8
              }}>
                {/* Animated Bot */}
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    y: [0, -5, 5, 0],
                    scale: [1, 1.1, 0.9, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <BotIcon sx={{ fontSize: 32, color: '#6b7280' }} />
                </motion.div>

                <Typography sx={{
                  fontSize: '16px',
                  color: '#6b7280'
                }}>
                  Analyzing...
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Box sx={{
              p: 3,
              bgcolor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 2,
              color: '#dc2626'
            }}>
              ⚠️ {error}
            </Box>
          </motion.div>
        )}

        {/* Clean Insights Display */}
        <AnimatePresence>
          {analysisData && analysisData.insights && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box sx={{
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                {/* Clean Bullet Points */}
                <Box sx={{ p: 4 }}>
                  <Box component="ul" sx={{
                    m: 0,
                    p: 0,
                    pl: 0,
                    listStyle: 'none',
                  }}>
                    {analysisData.insights.map((insight, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                          marginBottom: '18px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#10b981',
                          mt: 1,
                          flexShrink: 0
                        }} />
                        <Typography sx={{
                          fontSize: '15px',
                          lineHeight: 1.6,
                          color: '#374151',
                          flex: 1
                        }}>
                          {insight.replace(/^[•\-\*]\s*/, '')}
                        </Typography>
                      </motion.li>
                    ))}
                  </Box>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </SafetyConnectLayout>
  );
};

export default SimpleAIAnalysisPage;
