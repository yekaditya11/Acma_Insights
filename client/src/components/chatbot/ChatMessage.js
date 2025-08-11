/**
 * ChatMessage Component
 * Displays individual chat messages with support for charts and suggested actions
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Avatar, IconButton, Collapse } from '@mui/material';
import { Person as UserIcon, SmartToy as BotIcon, ExpandMore as ExpandIcon, ExpandLess as CollapseIcon, BarChart as ChartIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

import EChartsChart from './EChartsChart';
import { chatAnimations } from '../../utils/animations';

const ChatMessage = ({ message, isSpeaking, isFullscreen = false, onAddChartToDashboard }) => {
  const [showChart, setShowChart] = useState(true); // Show charts by default for better UX
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Removed add-to-dashboard state

  const isUser = message.role === 'user';
  const isError = message.isError;

  // Ensure content is always a string
  const safeContent = typeof message.content === 'string' 
    ? message.content 
    : typeof message.content === 'object' 
      ? JSON.stringify(message.content, null, 2)
      : String(message.content || '');

  // Removed add-to-dashboard action; dashboard feature deprecated

  // Line-by-line typing effect for AI responses
  useEffect(() => {
    if (isUser) {
      setDisplayedText(safeContent);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');

    const lines = safeContent.split('\n');
    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let accumulatedText = '';

    const typeNextCharacter = () => {
      if (currentLineIndex >= lines.length) {
        setIsTyping(false);
        return;
      }

      const currentLine = lines[currentLineIndex];

      if (currentCharIndex < currentLine.length) {
        // Type character by character
        accumulatedText += currentLine[currentCharIndex];
        setDisplayedText(accumulatedText);
        currentCharIndex++;
        setTimeout(typeNextCharacter, 30); // 30ms per character
      } else {
        // Move to next line
        accumulatedText += '\n';
        setDisplayedText(accumulatedText);
        currentLineIndex++;
        currentCharIndex = 0;
        setTimeout(typeNextCharacter, 200); // 200ms pause between lines
      }
    };

    const startTyping = setTimeout(typeNextCharacter, 300); // Initial delay

    return () => {
      clearTimeout(startTyping);
      setDisplayedText(safeContent);
      setIsTyping(false);
    };
  }, [safeContent, isUser]);
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasChart = message.chart_data && Object.keys(message.chart_data).length > 0;
  
  // Debug logging for chart data
  useEffect(() => {
    if (hasChart) {
      console.log('ChatMessage: Chart data received:', message.chart_data);
      console.log('ChatMessage: Chart data type:', typeof message.chart_data);
      console.log('ChatMessage: Chart data keys:', Object.keys(message.chart_data));
    }
  }, [message.chart_data, hasChart]);

  // Suggested actions disabled

  // Debug logging for chart data
  if (!isUser && message.chart_data) {
    console.log('Chart data received:', message.chart_data);
    console.log('Has chart:', hasChart);
  }

  return (
    <motion.div
      {...(isUser ? chatAnimations.userMessage : chatAnimations.aiMessage)}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 0.25, // Reduced gap between avatar and message for tighter spacing
          mb: 0.8, // Reduced bottom margin
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: isUser ? '#1976d2' : isError ? '#d32f2f' : '#092f57',
            fontSize: '0.75rem',
          }}
        >
          {isUser ? <UserIcon fontSize="small" /> : <BotIcon fontSize="small" />}
        </Avatar>

        {/* Message Content */}
        <Box
          sx={{
            maxWidth: isUser ? '65%' : '75%', // Chatbot-like widths for better conversation flow
            // Removed flex: 1 and width: '100%' to prevent stretching and eliminate extra space
          }}
        >
          {/* Enhanced Message Bubble */}
          <motion.div
            {...chatAnimations.message}
          >
            <Paper
              elevation={isUser ? 3 : 1}
              sx={{
                p: isUser ? 1.2 : 1.5, // Reduced padding
                borderRadius: '18px !important', // Force rounded corners with !important
                background: isUser
                  ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important' // Force blue gradient for user with !important
                  : isError
                    ? '#ffebee !important'
                    : 'rgba(255, 255, 255, 0.95) !important',
                color: isUser ? 'white !important' : '#1e293b !important', // Force text colors
                border: isError
                  ? '1px solid #ffcdd2'
                  : isUser
                    ? '2px solid rgba(255, 255, 255, 0.3) !important' // Stronger white border for better visibility
                    : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isUser
                  ? '0 6px 25px rgba(25, 118, 210, 0.4) !important' // Stronger shadow for user messages
                  : '0 2px 12px rgba(0, 0, 0, 0.08)',
                backdropFilter: !isUser ? 'blur(10px)' : 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
                // Override any global styles that might interfere
                '& *': {
                  color: isUser ? 'white !important' : 'inherit',
                },
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: isUser
                    ? '0 8px 30px rgba(25, 118, 210, 0.5)'
                    : '0 4px 16px rgba(0, 0, 0, 0.12)',
                },
              }}
            >
            <Box sx={{ position: 'relative' }}>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.25, // Further reduced line spacing
                  fontSize: '0.9rem', // Slightly smaller font
                  color: isUser ? 'white !important' : '#1e293b !important', // Force text color
                }}
              >
                {displayedText}
                {/* Enhanced Typing Cursor with Dots */}
                {isTyping && !isUser && (
                  <motion.span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginLeft: '4px',
                      gap: '2px'
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        {...chatAnimations.typingDots}
                        transition={{
                          ...chatAnimations.typingDots.transition,
                          delay: i * 0.2
                        }}
                        style={{
                          display: 'inline-block',
                          width: '3px',
                          height: '3px',
                          backgroundColor: '#1976d2',
                          borderRadius: '50%',
                        }}
                      />
                    ))}
                  </motion.span>
                )}
              </Typography>
            </Box>

            {/* Timestamp and Speaking Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.3, gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.7,
                  fontSize: '0.75rem',
                  color: isUser ? 'rgba(255, 255, 255, 0.8) !important' : 'rgba(30, 41, 59, 0.7) !important',
                }}
              >
                {formatTimestamp(message.timestamp)}
              </Typography>

              {/* Speaking Indicator */}
              {isSpeaking && !isUser && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    bgcolor: '#e0f2fe',
                    borderRadius: 1,
                    border: '1px solid #81d4fa',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 3,
                          height: 3,
                          bgcolor: '#0277bd',
                          borderRadius: '50%',
                          animation: 'speaking-wave 1s infinite ease-in-out',
                          animationDelay: `${i * 0.1}s`,
                          '@keyframes speaking-wave': {
                            '0%, 60%, 100%': { transform: 'scaleY(1)' },
                            '30%': { transform: 'scaleY(2)' },
                          },
                        }}
                      />
                    ))}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: '#0277bd',
                      fontWeight: 500,
                    }}
                  >
                    Speaking
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
          </motion.div>

          {/* Chart Section */}
          {hasChart && (
            <Box sx={{ mt: 0.8, width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setShowChart(!showChart)}
                    sx={{
                      bgcolor: '#e3f2fd',
                      color: '#1976d2',
                      '&:hover': { bgcolor: '#bbdefb' },
                    }}
                  >
                    <ChartIcon fontSize="small" />
                  </IconButton>

                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {showChart ? 'Hide Chart' : 'Show Chart'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Add-to-dashboard removed */}

                  {/* Collapse/Expand Button */}
                  <IconButton
                    size="small"
                    onClick={() => setShowChart(!showChart)}
                    sx={{ color: '#64748b' }}
                  >
                    {showChart ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={showChart}>
                <motion.div
                  {...chatAnimations.chartEntrance}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      bgcolor: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{
                      width: '100%',
                      minHeight: isFullscreen ? '500px' : '350px',
                      maxHeight: isFullscreen ? '70vh' : '400px',
                      position: 'relative',
                      overflow: 'visible'
                    }}>
                      <EChartsChart
                        chartData={message.chart_data}
                        isFullscreen={isFullscreen}
                      />
                    </Box>
                  </Paper>
                </motion.div>
              </Collapse>
            </Box>
          )}

          {/* SQL query hidden per requirement */}

          {/* Suggested actions removed */}


        </Box>
      </Box>
    </motion.div>
  );
};

export default ChatMessage;
