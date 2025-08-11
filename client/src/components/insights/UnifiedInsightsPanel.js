/**
 * UnifiedInsightsPanel Component
 * Combines AI Analysis and ChatBot functionality into a single sidebar panel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import jsPDF from 'jspdf';
import {
  Psychology as AIIcon,
  Close as CloseIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SmartToy as BotIcon,
  VolumeUp as SpeakerIcon,
  VolumeOff as MuteIcon,
  Refresh as RefreshIcon,

  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import chatbot components
import ChatMessage from '../chatbot/ChatMessage';
import ChatInput from '../chatbot/ChatInput';
import ChatLoadingIndicator from '../chatbot/ChatLoadingIndicator';
import ApiService from '../../services/api';

const UnifiedInsightsPanel = ({
  aiAnalysis,
  aiLoading,
  aiError,
  insightFeedback,
  loadingMoreInsights,
  selectedModule,
  onClose,
  onFeedback,
  onGenerateMore,
  onRemoveInsight
}) => {

  // Chat state
  const [activeTab, setActiveTab] = useState(0); // 0 = AI Insights, 1 = Chat
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);

  const [isExpanded, setIsExpanded] = useState(false); // New expand state
  

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (activeTab === 1 && chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 1 && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, scrollToBottom, activeTab]);

  // Initialize conversation when chat tab is opened
  useEffect(() => {
    if (activeTab === 1 && !sessionId) {
      initializeConversation();
    }
  }, [activeTab, sessionId]);

  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.startConversation();

      if (response && response.success) {
        setSessionId(response.session_id);

        const welcomeMessage = {
          id: Date.now(),
          role: 'assistant',
          content: response.message || "Hello! I'm your AI Assistant.",
          timestamp: new Date(),
          data_context: response.data_context,
          chart_data: response.chart_data
        };

        setMessages([welcomeMessage]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      const fallbackMessage = {
        id: Date.now(),
        role: 'assistant',
        content: "Hello! I'm your AI Assistant. Ask me about your safety KPIs, incidents, or any other safety-related questions!",
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setSessionId('fallback-session-' + Date.now());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);
    setProgressSteps([]);

    try {
      ApiService.startChatStream(
        messageText,
        (evt) => {
          if (evt?.type === 'node_update') {
            const node = evt?.node || evt?.data?.node;
            if (node) {
              const labelMap = {
                intent_classification: 'Understanding your request',
                greeting: 'Responding',
                text_to_sql: 'Finding the right data',
                execute_sql_query: 'Pulling data',
                summarizer: 'Summarizing insights',
                clarification_agent: 'Need more details',
                visualization: 'Building chart',
              };
              const label = labelMap[node] || node;
              setProgressSteps((prev) => {
                if (prev[prev.length - 1] === label) return prev;
                return [...prev, label];
              });
            }
          } else if (evt?.type === 'final') {
            const data = evt.data || {};
            const finalAnswer = data.final_answer || '';
            const sql = data.sql_query || null;
            const chart = data.visualization_data || null;

            const aiMessage = {
              id: Date.now() + 1,
              role: 'assistant',
              content: finalAnswer || 'No response message',
              timestamp: new Date(),
              data_context: data.query_result || null,
              chart_data: ApiService.sanitizeChartData ? ApiService.sanitizeChartData(chart) : chart,
              // sql_query removed from UI per requirement
            };
            setMessages(prev => [...prev, aiMessage]);

            if (speechEnabled && finalAnswer) {
              setTimeout(() => speakText(finalAnswer), 500);
            }
            setIsTyping(false);
            setIsLoading(false);
            setProgressSteps([]);
          }
        },
        (err) => {
          console.error('SSE stream error:', err);
          const errorMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: 'Sorry, the stream encountered an error. Please try again.',
            timestamp: new Date(),
            isError: true,
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
          setIsLoading(false);
          setProgressSteps([]);
        }
      );
    } catch (error) {
      console.error('Error starting stream:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsLoading(false);
      setProgressSteps([]);
    }
  };

  const handleClearChat = async () => {
    try {
      if (sessionId) {
        await ApiService.clearConversation(sessionId);
      }
      setMessages([]);
      setSessionId(null);
      await initializeConversation();
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };


  // Removed add-to-dashboard functionality and legacy chart manager usage

  

  // Text-to-Speech functionality
  const speakText = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[👋🤖📊⚠️✅❌]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim();

    if (cleanText.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSpeechEnabled(!speechEnabled);
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // Dispatch improved events for layout change
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('ai-panel-toggle', {
        detail: {
          insightsPanelOpen: true,
          insightsPanelExpanded: newExpandedState,
          phase: 'start'
        }
      }));

      // Legacy event for backward compatibility
      window.dispatchEvent(new CustomEvent('chatbot-toggle', {
        detail: {
          insightsPanelOpen: true,
          insightsPanelExpanded: newExpandedState
        }
      }));

      window.dispatchEvent(new Event('resize'));
    });
  };

  // PDF Download functionality
  const downloadInsightsAsPDF = () => {
    if (!aiAnalysis?.insights || aiAnalysis.insights.length === 0) return;

    try {
      // Create PDF document
      const pdf = new jsPDF();
      const moduleTitle = selectedModule ? selectedModule.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Safety Module';
      const timestamp = new Date().toLocaleString();

      // Set up PDF styling
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('ACMA AI Insights Report', margin, yPosition);
      yPosition += 15;

      // Module and timestamp
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Module: ${moduleTitle}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Generated: ${timestamp}`, margin, yPosition);
      yPosition += 15;

      // Separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Insights
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Key Insights:', margin, yPosition);
      yPosition += 12;

      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');

      aiAnalysis.insights.forEach((insight, index) => {
        const insightText = typeof insight === 'string' ? insight : insight.text;
        const cleanText = insightText.replace(/^•\s*/, '');

        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        // Split text into lines that fit the page width
        const lines = pdf.splitTextToSize(`${index + 1}. ${cleanText}`, maxWidth);

        lines.forEach((line) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });

        yPosition += 4; // Extra space between insights
      });

      // Footer
      yPosition += 10;
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text('Report generated by ACMA AI', margin, yPosition);
      yPosition += 6;
      pdf.text(`Total insights: ${aiAnalysis.insights.length}`, margin, yPosition);

      // Download the PDF
      const fileName = `ACMA_Insights_${moduleTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error downloading insights as PDF:', error);
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleExpand}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)'
            }}
          />
        )}
      </AnimatePresence>

      <Card
        sx={{
          height: '100%',
          maxHeight: isExpanded ? '95vh' : '85vh',
          minHeight: isExpanded ? '90vh' : '600px',
          bgcolor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 3, // Increased from 2 to 3 for more rounded corners
          overflow: 'hidden',
          boxShadow: isExpanded
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          position: isExpanded ? 'fixed' : 'relative',
          top: isExpanded ? '2.5vh' : 'auto',
          left: isExpanded ? '2.5vw' : 'auto',
          right: isExpanded ? '2.5vw' : 'auto',
          bottom: isExpanded ? '2.5vh' : 'auto',
          zIndex: isExpanded ? 9999 : 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
      {/* Header with Tabs */}
      <Box sx={{
        background: 'linear-gradient(135deg, #092f57 0%, #1e40af 100%)',
        color: 'white',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
          pointerEvents: 'none',
        }
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 0,
          zIndex: 1,
          position: 'relative'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Insights & Chat
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Speech Toggle (only show when chat tab is active) */}
            {activeTab === 1 && (
              <Tooltip title={speechEnabled ? "Disable speech" : "Enable speech"}>
                <IconButton
                  onClick={toggleSpeech}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: speechEnabled ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: speechEnabled ? '1px solid rgba(76, 175, 80, 0.3)' : 'none',
                    '&:hover': {
                      bgcolor: speechEnabled ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  {speechEnabled ? <SpeakerIcon fontSize="small" /> : <MuteIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}

            

            {/* Download PDF (only show when AI insights tab is active and has insights) */}
            {activeTab === 0 && aiAnalysis?.insights && aiAnalysis.insights.length > 0 && (
              <Tooltip title="Download Insights as PDF">
                <IconButton
                  onClick={downloadInsightsAsPDF}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Clear Chat (only show when chat tab is active) */}
            {activeTab === 1 && (
              <Tooltip title="Clear Chat">
                <IconButton
                  onClick={handleClearChat}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Expand Button */}
            <Tooltip title={isExpanded ? "Exit Fullscreen" : "Expand Fullscreen"}>
              <IconButton
                onClick={toggleExpand}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: isExpanded ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.1)',
                  border: isExpanded ? '1px solid rgba(76, 175, 80, 0.3)' : 'none',
                  '&:hover': {
                    bgcolor: isExpanded ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                {isExpanded ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
              </IconButton>
            </Tooltip>



            {/* Close Button */}
            <Tooltip title="Close Insights">
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              px: 2,
              zIndex: 1,
              position: 'relative',
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
                height: 3,
                borderRadius: '3px 3px 0 0'
              },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                minHeight: 48,
                '&.Mui-selected': {
                  color: 'white'
                }
              }
            }}
          >
            <Tab
              icon={<AIIcon />}
              label="AI Insights"
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={
                <Badge
                  badgeContent={messages.length > 1 ? messages.length - 1 : 0}
                  color="error"
                  max={99}
                >
                  <BotIcon />
                </Badge>
              }
              label="Chat"
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
      </Box>

      {/* Content Area */}
        <CardContent sx={{
          p: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: isExpanded ? 'calc(95vh - 140px)' : 'calc(85vh - 140px)',
          transition: 'height 0.3s ease',
          '&:last-child': {
            paddingBottom: 0
          }
        }}>
          {/* AI Insights Tab */}
          {activeTab === 0 && (
            <Box sx={{
              p: 2.5, // Increased padding to 2.5 for better use of wider space
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              height: '100%'
            }}>
              {aiLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    py: 4
                  }}>
                    <CircularProgress size={32} sx={{ color: '#667eea' }} />
                    <Typography sx={{ color: '#6b7280', textAlign: 'center', fontSize: '0.9rem' }}>
                      AI is analyzing...
                    </Typography>
                  </Box>
                </motion.div>
              ) : aiError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {aiError}
                </Alert>
              ) : aiAnalysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0
                  }}
                >
                  {/* Key Insights */}
                  {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      minHeight: 0,
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle1" sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#1f2937'
                      }}>
                        Key Insights
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        maxHeight: '100%',
                        pr: 1,
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                          borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#c1c1c1',
                          borderRadius: '3px',
                          '&:hover': {
                            background: '#a8a8a8',
                          },
                        },
                      }}>
                        {aiAnalysis.insights.map((insight, index) => {
                          // Enhanced safety check for insight text with sentiment support
                          let insightText = '';
                          let sentiment = 'neutral'; // Default sentiment
                          
                          if (typeof insight === 'string') {
                            // Legacy format - just text
                            insightText = insight;
                            sentiment = 'neutral';
                          } else if (insight && typeof insight === 'object') {
                            // New structured format with sentiment
                            if (typeof insight.text === 'string') {
                              insightText = insight.text;
                              sentiment = insight.sentiment || 'neutral';
                            } else if (insight.text && typeof insight.text === 'object') {
                              // Handle nested objects
                              insightText = JSON.stringify(insight.text);
                              sentiment = insight.sentiment || 'neutral';
                            } else {
                              insightText = JSON.stringify(insight);
                              sentiment = 'neutral';
                            }
                          } else {
                            insightText = String(insight || 'No insight text available');
                            sentiment = 'neutral';
                          }
                          
                          // Validate sentiment value
                          if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
                            sentiment = 'neutral';
                          }

                          const getBulletColor = (sentiment) => {
                            switch (sentiment) {
                              case 'positive': 
                                return '#10b981'; // Green for positive insights
                              case 'negative': 
                                return '#dc2626'; // Red for negative insights
                              case 'neutral':
                              default: 
                                return '#10b981'; // Default to green for neutral insights
                            }
                          };

                          const getSentimentIcon = (sentiment) => {
                            switch (sentiment) {
                              case 'positive': 
                                return '•'; // Green dot for positive
                              case 'negative': 
                                return '•'; // Red dot for negative
                              case 'neutral':
                              default: 
                                return '•'; // Green dot for neutral (defaulting to positive)
                            }
                          };

                          return (
                            <Box key={index} sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1,
                              mb: 0.8,
                              '&:hover .feedback-buttons': {
                                opacity: 1
                              }
                            }}>
                              {/* Sentiment-based bullet point */}
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                minWidth: '16px',
                                mt: 0.1
                              }}>
                                <Typography sx={{
                                  color: getBulletColor(sentiment),
                                  lineHeight: 1.6,
                                  fontSize: '1.2rem',
                                  fontWeight: 'bold',
                                  textShadow: sentiment !== 'neutral' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                  {getSentimentIcon(sentiment)}
                                </Typography>
                              </Box>

                              <Typography sx={{
                                color: '#4b5563',
                                lineHeight: 1.6,
                                fontSize: '0.95rem',
                                py: 0.2,
                                flex: 1,
                                display: 'inline',
                                wordBreak: 'break-word'
                              }}>
                                {typeof insightText === 'string' 
                                  ? insightText.replace(/^[•⚠✓]\s*/, '') // Remove any existing bullet symbols
                                  : String(insightText)}
                                {index === aiAnalysis.insights.length - 1 && (
                                  <Typography
                                    component="span"
                                    onClick={onGenerateMore}
                                    disabled={loadingMoreInsights}
                                    sx={{
                                      color: loadingMoreInsights ? '#9ca3af' : '#667eea',
                                      cursor: loadingMoreInsights ? 'default' : 'pointer',
                                      ml: 1,
                                      fontWeight: 500,
                                      '&:hover': {
                                        color: loadingMoreInsights ? '#9ca3af' : '#4f46e5',
                                        textDecoration: 'underline'
                                      }
                                    }}
                                  >
                                    {loadingMoreInsights ? 'generating...' : '...more'}
                                  </Typography>
                                )}
                                <Box
                                  component="span"
                                  className="feedback-buttons"
                                  sx={{
                                    display: 'inline-flex',
                                    gap: 0.2,
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    alignItems: 'center',
                                    ml: 0.5,
                                    verticalAlign: 'middle'
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={(event) => onFeedback(index, 'positive', event)}
                                    sx={{
                                      p: 0.3,
                                      minWidth: 'auto',
                                      width: 20,
                                      height: 20,
                                      color: insightFeedback[index] === 'positive' ? '#10b981' : '#9ca3af',
                                      '&:hover': {
                                        color: '#10b981',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <ThumbUpIcon sx={{ fontSize: '0.75rem' }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(event) => onFeedback(index, 'negative', event)}
                                    sx={{
                                      p: 0.3,
                                      minWidth: 'auto',
                                      width: 20,
                                      height: 20,
                                      color: insightFeedback[index] === 'negative' ? '#dc2626' : '#9ca3af',
                                      '&:hover': {
                                        color: '#dc2626',
                                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <ThumbDownIcon sx={{ fontSize: '0.75rem' }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (onRemoveInsight) {
                                        onRemoveInsight(index);
                                      }
                                    }}
                                    sx={{
                                      p: 0.3,
                                      minWidth: 'auto',
                                      width: 20,
                                      height: 20,
                                      color: '#9ca3af',
                                      '&:hover': {
                                        color: '#dc2626',
                                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: '0.75rem' }} />
                                  </IconButton>
                                </Box>
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}


                </motion.div>
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  py: 4,
                  color: '#6b7280'
                }}>
                  <AIIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                  <Typography variant="body2">
                    Toggle AI to get insights
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Chat Tab */}
          {activeTab === 1 && (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              position: 'relative'
            }}>
              {/* Messages Area */}
              <Box
                ref={chatContainerRef}
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2, // Increased padding for better use of wider insights panel
                  pt: 1,
                  pb: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)',
                  scrollBehavior: 'smooth',
                  minHeight: 0, // Allow flex shrinking
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                    '&:hover': {
                      background: 'rgba(0,0,0,0.3)',
                    },
                  },
                }}
              >
                {/* Welcome Message */}
                {messages.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Box sx={{
                      p: 1.5,
                      borderRadius: '20px', // Increased from 16px to 20px for more rounded corners
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      textAlign: 'center',
                    }}>
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <BotIcon sx={{ fontSize: 32, color: '#3b82f6', mb: 0.5 }} />
                      </motion.div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e40af', mb: 0.5 }}>
                        Welcome to SafetyConnect AI! 👋
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                        I can help you with ALL safety modules - incidents, risk assessments, actions, driver safety, observations, equipment, and training.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Ask me about any safety topic regardless of which page you're on!
                      </Typography>
                    </Box>
                  </motion.div>
                )}

                {/* Messages */}
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ChatMessage
                      message={message}
                      isSpeaking={isSpeaking}
                      isFullscreen={false}
                    />
                  </motion.div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <ChatLoadingIndicator message={isTyping ? 'Working...' : 'Connecting...'} steps={progressSteps} />
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </Box>

              

              {/* Chat Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </Box>
          )}
        </CardContent>
    </Card>
    </>
  );
};

export default UnifiedInsightsPanel;