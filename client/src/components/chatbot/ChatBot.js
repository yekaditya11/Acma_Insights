/**
 * Modern ChatBot Component
 * KPI-based conversational AI with graph generation capabilities
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SmartToy as BotIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  VolumeUp as SpeakerIcon,
  VolumeOff as MuteIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAnimations, staggerContainer, staggerItem } from '../../utils/animations';

import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatLoadingIndicator from './ChatLoadingIndicator';
import ApiService from '../../services/api';
// Removed legacy CSS import to reduce global styles

const ChatBot = ({ moduleContext = null }) => {
  console.log('🤖 ChatBot component initialized with moduleContext:', moduleContext);

  const [isOpen, setIsOpen] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Add a simple test to ensure component is working
  useEffect(() => {
    console.log('🤖 ChatBot component mounted successfully');
    console.log('🤖 Current state - isOpen:', isOpen);

    // Test if we can access the DOM
    if (typeof document !== 'undefined') {
      console.log('🤖 Document is available, portal should work');
    }

    return () => {
      console.log('🤖 ChatBot component unmounting');
    };
  }, []);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    // Only scroll if chat is open and container exists
    if (isOpen && chatContainerRef.current) {
      // Add a small delay to ensure the container is fully rendered
      setTimeout(() => {
        if (chatContainerRef.current) {
          // Scroll within the chat container only, not the entire page
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    // Only scroll when messages change and chat is open
    if (isOpen && messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, scrollToBottom, isOpen]);

  // Ensure chat starts from top when first opened
  useEffect(() => {
    if (isOpen && chatContainerRef.current && messages.length === 0) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, messages.length]);

  // Initialize conversation when chatbot opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      console.log('🤖 Initializing conversation...');
      initializeConversation();
    }
  }, [isOpen, sessionId]);

  // Listen for AI panel toggle events to adjust chatbot positioning
  useEffect(() => {
    const handleAIPanelToggle = (event) => {
      const { insightsPanelOpen } = event.detail || {};
      console.log('🤖 AI Panel toggle detected:', insightsPanelOpen);
      setAiPanelOpen(insightsPanelOpen);
    };

    // Listen for both new and legacy events
    window.addEventListener('ai-panel-toggle', handleAIPanelToggle);
    window.addEventListener('chatbot-toggle', handleAIPanelToggle);

    return () => {
      window.removeEventListener('ai-panel-toggle', handleAIPanelToggle);
      window.removeEventListener('chatbot-toggle', handleAIPanelToggle);
    };
  }, []);

  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing conversation...');
      const response = await ApiService.startConversation();
      console.log('Start conversation response:', response);

      // Note: axios interceptor returns response.data, so response is already the data object
      if (response && response.success) {
        setSessionId(response.session_id);
        console.log('Session ID set:', response.session_id);

        // Add welcome message
        const welcomeMessage = {
          id: Date.now(),
          role: 'assistant',
          content: "Hello! I'm your AI assistant. How can I assist you?",
          timestamp: new Date(),
          data_context: response.data_context,
          chart_data: response.chart_data
        };

        setMessages([welcomeMessage]);
      } else {
        console.error('Invalid start conversation response:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      // Add fallback welcome message
      const fallbackMessage = {
        id: Date.now(),
        role: 'assistant',
        content: "Hello! I'm your AI assistant. How can I assist you?",
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setSessionId('fallback-session-' + Date.now());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    console.log('🚀 handleSendMessage called with:', messageText);
    console.log('🚀 Current isLoading state:', isLoading);

    if (!messageText.trim() || isLoading) {
      console.log('🚀 Message blocked - empty message or loading:', { messageText: messageText.trim(), isLoading });
      return;
    }

    console.log('🚀 Processing message...');

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    console.log('🚀 Adding user message to state:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);
    setProgressSteps([]);

    try {
      console.log('🚀 Sending chat message with streaming:', messageText);
      let streamedAnswer = '';
      let streamedSql = null;
      let streamedChart = null;

      const stream = ApiService.startChatStream(
        messageText,
        (evt) => {
          // evt: { type: 'node_update' | 'final', data, timestamp }
          if (evt?.type === 'node_update') {
            // Optional: show typing indicator updates based on node name
            setIsTyping(true);
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
            streamedAnswer = data.final_answer || '';
            streamedSql = data.sql_query || null;
            streamedChart = data.visualization_data || null;
            // Push final message to chat
            const aiMessage = {
              id: Date.now() + 1,
              role: 'assistant',
              content: streamedAnswer || 'No response message',
              timestamp: new Date(),
              data_context: data.query_result || null,
              chart_data: ApiService.sanitizeChartData ? ApiService.sanitizeChartData(streamedChart) : streamedChart,
              // sql_query removed from UI per requirement
            };
            setMessages(prev => [...prev, aiMessage]);

            if (speechEnabled && streamedAnswer) {
              setTimeout(() => speakText(streamedAnswer), 500);
            }
            if (!isOpen) setHasNewMessage(true);
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

      // In future, you can store 'stream' to cancel if needed: stream.cancel()
    } catch (error) {
      console.error('🚀 Error starting stream:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleToggleChat = () => {
    console.log('🤖 Chat toggle clicked, current isOpen:', isOpen);

    const newIsOpen = !isOpen;

    // Simple toggle without scroll interference
    setIsOpen(newIsOpen);
    setIsFullscreen(false);

    if (hasNewMessage) {
      setHasNewMessage(false);
    }

    // Dispatch custom event to notify charts about layout change
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('chatbot-toggle'));
    }, 50);

    console.log('🤖 Chat state will be:', newIsOpen);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);

    // Dispatch custom event to notify charts about layout change
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('chatbot-toggle'));
    }, 50);
  };

  const handleClearChat = async () => {
    try {
      if (sessionId) {
        await ApiService.clearConversation(sessionId);
      }
      setMessages([]);
      setSessionId(null);
      // Reinitialize conversation
      await initializeConversation();
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  

  // Text-to-Speech functionality
  const speakText = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean text for speech (remove markdown, emojis, etc.)
    const cleanText = text
      .replace(/[👋🤖📊⚠️✅❌]/g, '') // Remove emojis
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
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

  // Removed add-to-dashboard functionality and legacy chart manager usage



  console.log('🤖 ChatBot render - isOpen:', isOpen, 'isFullscreen:', isFullscreen);

  // Check if document.body is available for portal
  if (typeof document === 'undefined' || !document.body) {
    console.log('🤖 Document.body not available, rendering fallback');
    return (
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: 'red',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        Portal Error - Check Console
      </div>
    );
  }

  // Render chatbot using React Portal to ensure it's completely isolated from parent containers
  try {
    return createPortal(
    <>
      {/* Enhanced Chat Window with Beautiful Animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...chatAnimations.chatWindow}
            style={{
              position: 'fixed',
              bottom: isFullscreen ? 0 : '100px',
              right: isFullscreen ? 0 : aiPanelOpen ? '420px' : '24px', // Adjust for AI panel
              left: isFullscreen ? 0 : 'auto',
              top: isFullscreen ? 0 : 'auto',
              width: isFullscreen ? '100vw' : '500px',
              height: isFullscreen ? '100vh' : '650px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition for all properties
            }}
          >
            <Paper
              elevation={isFullscreen ? 0 : 24}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: isFullscreen ? 0 : '24px',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: isFullscreen
                  ? 'none'
                  : '0 25px 80px rgba(0, 0, 0, 0.15), 0 10px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transitions
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 100%)',
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                }
              }}
            >
              {/* Enhanced Header with Animations */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <Box
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #092f57 0%, #1e40af 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: isFullscreen ? 0 : '24px 24px 0 0',
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
                      borderRadius: 'inherit',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}>
                    <motion.div
                      animate={{
                        rotate: isLoading ? 360 : 0,
                        scale: isLoading ? [1, 1.1, 1] : 1
                      }}
                      transition={{
                        duration: isLoading ? 2 : 0.3,
                        repeat: isLoading ? Infinity : 0,
                        ease: isLoading ? "linear" : "easeInOut"
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                      >
                        <BotIcon sx={{ fontSize: 18, color: 'white' }} />
                      </Avatar>
                    </motion.div>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>
                        AI
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                        {isLoading ? 'Thinking...' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, zIndex: 1 }}>
                    {/* Speech Toggle Button */}
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
                          },
                          ...(isSpeaking && {
                            animation: 'pulse-speak 1s infinite',
                            '@keyframes pulse-speak': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.7 },
                              '100%': { opacity: 1 },
                            },
                          }),
                        }}
                      >
                        {speechEnabled ? <SpeakerIcon fontSize="small" /> : <MuteIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>



                    {/* Fullscreen Button */}
                    <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                      <IconButton
                        onClick={handleFullscreen}
                        size="small"
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                      >
                        {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    {/* Clear Chat Button */}
                    <Tooltip title="Clear Chat">
                      <IconButton
                        onClick={handleClearChat}
                        size="small"
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Close Button */}
                    <Tooltip title="Close Chat">
                      <IconButton
                        onClick={handleToggleChat}
                        size="small"
                        sx={{
                          color: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </motion.div>

              {/* Messages Area - Adjusted Height for Quick Questions */}
              <Box
                  ref={chatContainerRef}
                  sx={{
                    // Adjust height based on whether suggestions are open
                    height: isFullscreen
                      ? 'calc(100vh - 160px)'
                      : suggestionsOpen
                        ? '380px'  // Reduced height when suggestions are open
                        : '480px', // Full height when suggestions are closed
                    overflow: 'auto',
                    p: 1.5, // Reduced padding
                    pt: 1,
                    pb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5, // Reduced gap between messages
                    background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)',
                    // Ensure scrolling starts from top
                    scrollBehavior: 'smooth',
                    transition: 'height 0.3s ease', // Smooth height transition
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
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          textAlign: 'center',
                        }}
                      >
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
                          Welcome to AI Assistant! 👋
                        </Typography>
                      
                      </Paper>
                    </motion.div>
                  )}

                  {/* Messages with Staggered Animations */}
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id || index}
                        variants={staggerItem}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ChatMessage
                          message={message}
                          isSpeaking={isSpeaking}
                          isFullscreen={isFullscreen}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Enhanced Loading Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <ChatLoadingIndicator message={isTyping ? 'Working...' : 'Connecting...'} steps={progressSteps} />
                    </motion.div>
                  )}

                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </Box>

              {/* Chat Input Section - Always at Bottom */}
                <Box>
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isLoading}
                  />
                </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Chat Toggle Button with Advanced Animations */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: aiPanelOpen ? 420 : 24, // Adjust for AI panel
              zIndex: 9999,
              transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
            }}
          >
            <Tooltip
              title="Chat with AI"
              placement="left"
              arrow
              sx={{
                '& .MuiTooltip-tooltip': {
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                },
                '& .MuiTooltip-arrow': {
                  color: 'rgba(0, 0, 0, 0.8)',
                },
              }}
            >
              <Badge
                badgeContent={hasNewMessage ? "!" : 0}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    minWidth: '20px',
                    height: '20px',
                    fontWeight: 600,
                    animation: hasNewMessage ? 'pulse-glow 2s infinite' : 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                    '@keyframes pulse-glow': {
                      '0%': {
                        opacity: 1,
                        transform: 'scale(1)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                      },
                      '50%': {
                        opacity: 0.8,
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.6)'
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'scale(1)',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                      },
                    },
                  },
                }}
              >
                <motion.div
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                  }}
                  whileTap={{
                    scale: 0.95,
                    transition: { duration: 0.1 }
                  }}
                  animate={{
                    y: [0, -3, 0],
                    transition: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <Box
                    onClick={(e) => {
                      console.log('🤖 Toggle button clicked!', e);
                      handleToggleChat();
                    }}
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #092f57 0%, #1e40af 50%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 10px 40px rgba(9, 47, 87, 0.4), 0 4px 16px rgba(9, 47, 87, 0.2)',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        boxShadow: '0 16px 60px rgba(9, 47, 87, 0.5), 0 8px 24px rgba(9, 47, 87, 0.3)',
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      },
                      '&:active': {
                        boxShadow: '0 8px 32px rgba(9, 47, 87, 0.4)',
                        transform: 'translateY(1px)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)',
                        pointerEvents: 'none',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        right: '60%',
                        bottom: '60%',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.3)',
                        filter: 'blur(4px)',
                        pointerEvents: 'none',
                      }
                    }}
                  >
                    <motion.div
                      animate={isLoading ? {
                        rotate: 360,
                        scale: [1, 1.15, 1]
                      } : {
                        rotate: 0,
                        scale: 1
                      }}
                      transition={{
                        duration: isLoading ? 1.5 : 0.3,
                        repeat: isLoading ? Infinity : 0,
                        ease: isLoading ? "linear" : "easeInOut"
                      }}
                      style={{ zIndex: 1 }}
                    >
                      <BotIcon sx={{
                        fontSize: 36,
                        color: 'white',
                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
                        zIndex: 1,
                      }} />
                    </motion.div>
                  </Box>
                </motion.div>
              </Badge>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body // Render directly to body to avoid any parent container interference
  );
  } catch (error) {
    console.error('🤖 Portal render error:', error);
    return (
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: 'orange',
        color: 'white',
        padding: '10px',
        borderRadius: '5px'
      }}>
        Portal Error: {error.message}
      </div>
    );
  }
};

export default ChatBot;
