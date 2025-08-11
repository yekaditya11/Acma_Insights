/**
 * Supplier Performance Dashboard Only
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Alert, CircularProgress, IconButton, Tooltip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import BusinessIcon from '@mui/icons-material/Business';
import UploadIcon from '@mui/icons-material/CloudUpload';
import { motion } from 'framer-motion';

import ErrorBoundary from '../components/common/ErrorBoundary';
import SafetyConnectLayout from '../components/layout/SafetyConnectLayout';
import SupplierDashboardCharts from '../components/charts/SupplierDashboardCharts';
import FloatingAIAssistant from '../components/common/FloatingAIAssistant';
import UnifiedInsightsPanel from '../components/insights/UnifiedInsightsPanel';
import ApiService from '../services/api';

const UnifiedSafetyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [insightFeedback, setInsightFeedback] = useState({});
  const [loadingMoreInsights, setLoadingMoreInsights] = useState(false);
  const [showSupplierAnalysis, setShowSupplierAnalysis] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await ApiService.getSupplierDashboardAnalytics();
      setData(resp);
    } catch (e) {
      setError(e?.message || 'Failed to load supplier dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchSupplierInsights = async (refresh = false) => {
    try {
      setAiLoading(true);
      setAiError(null);
      const resp = await ApiService.getSupplierGeneralInsights(refresh);
      const insights = resp?.general_insights || [];
      setAiAnalysis({ insights });
    } catch (e) {
      setAiError(e?.message || 'Failed to load insights');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIToggle = async (enabled) => {
    setAiEnabled(enabled);
    if (enabled) {
      await fetchSupplierInsights(false);
    }
  };

  const handleInsightFeedback = (index, feedbackType) => {
    setInsightFeedback((prev) => ({ ...prev, [index]: feedbackType }));
  };

  const handleGenerateMoreInsights = async () => {
    if (loadingMoreInsights) return;
    try {
      setLoadingMoreInsights(true);
      const resp = await ApiService.generateSupplierAdditionalInsights();
      const additional = resp?.additional_insights || [];
      setAiAnalysis((prev) => ({ insights: [...(prev?.insights || []), ...additional] }));
    } catch (e) {
      setAiError(e?.message || 'Failed to generate more insights');
    } finally {
      setLoadingMoreInsights(false);
    }
  };

  const handleRemoveInsight = (indexToRemove) => {
    setAiAnalysis((prev) => {
      if (!prev || !Array.isArray(prev.insights)) return prev;
      const newInsights = prev.insights.filter((_, idx) => idx !== indexToRemove);
      return { ...prev, insights: newInsights };
    });

    // Reindex feedback mapping so it stays aligned with insight indices
    setInsightFeedback((prev) => {
      if (!prev || typeof prev !== 'object') return {};
      const updated = {};
      Object.keys(prev).forEach((k) => {
        const idx = Number(k);
        if (Number.isNaN(idx)) return;
        if (idx < indexToRemove) {
          updated[idx] = prev[idx];
        } else if (idx > indexToRemove) {
          updated[idx - 1] = prev[idx];
        }
      });
      return updated;
    });
  };

  const headerRightActions = (
    <Button
      variant="contained"
      size="small"
      startIcon={<UploadIcon />}
      onClick={() => navigate('/upload')}
      sx={{ textTransform: 'none', fontWeight: 600 }}
    >
      Upload
    </Button>
  );

  return (
    <ErrorBoundary>
      <SafetyConnectLayout headerRightActions={headerRightActions}>
        <Box sx={{ px: 1.5, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, py: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#092f57' }}>
              Performance Dashboard
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Tooltip title={showSupplierAnalysis ? 'Hide Supplier Analysis' : 'Show Supplier Analysis'}>
                <span>
                  <Button
                    variant={showSupplierAnalysis ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<BusinessIcon />}
                    onClick={() => setShowSupplierAnalysis((v) => !v)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {showSupplierAnalysis ? 'Supplier Analysis' : 'Supplier Analysis'}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Refresh Data">
                <span>
                  <IconButton onClick={loadData} disabled={loading} sx={{ bgcolor: 'white', border: '1px solid #e5e7eb', borderRadius: 1.5, p: 1.5 }}>
                    <RefreshIcon sx={{ fontSize: 20, color: loading ? '#94a3b8' : '#092f57' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <FloatingAIAssistant isActive={aiEnabled} onToggle={() => handleAIToggle(!aiEnabled)} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, minHeight: 600 }}>
            <Box sx={{ flex: aiEnabled ? '1 1 60%' : '1 1 100%', transition: 'flex 0.3s ease', minWidth: 0 }}>
              <Card sx={{ minHeight: 600, bgcolor: 'white', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  {loading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                        <CircularProgress size={48} sx={{ color: '#092f57' }} />
                        <Typography sx={{ color: '#6b7280' }}>Loading Supplier Dashboard...</Typography>
                      </Box>
                    </motion.div>
                  ) : (
                    <SupplierDashboardCharts data={data} showSupplierAnalysis={showSupplierAnalysis} />
                  )}
                </CardContent>
              </Card>
            </Box>

            {aiEnabled && (
              <motion.div
                initial={{ opacity: 0, x: 300, width: 0 }}
                animate={{ opacity: 1, x: 0, width: '40%' }}
                exit={{ opacity: 0, x: 300, width: 0 }}
                transition={{ duration: 0.4 }}
                style={{ flex: '0 0 40%', minWidth: 380 }}
              >
                <UnifiedInsightsPanel
                  aiAnalysis={aiAnalysis}
                  aiLoading={aiLoading}
                  aiError={aiError}
                  insightFeedback={insightFeedback}
                  loadingMoreInsights={loadingMoreInsights}
                  selectedModule={'supplier-dashboard'}
                  onClose={() => setAiEnabled(false)}
                  onFeedback={handleInsightFeedback}
                  onGenerateMore={handleGenerateMoreInsights}
                  onRemoveInsight={handleRemoveInsight}
                />
              </motion.div>
            )}
          </Box>
        </Box>
      </SafetyConnectLayout>
    </ErrorBoundary>
  );
};

export default UnifiedSafetyDashboard;
