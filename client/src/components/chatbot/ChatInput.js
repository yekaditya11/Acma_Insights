/**
 * ChatInput Component
 * Input field for sending messages to the chatbot
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon } from '@mui/icons-material';
// animations not used here

const ChatInput = ({ onSendMessage, disabled, placeholder }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);



  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setIsRecording(true);
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };



  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (disabled) return;

    if (isListening) {
      // Stop recording
      recognition.stop();
    } else {
      // Start recording
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
        setIsListening(false);
      }
    }
  };

  return (
    <Box
      sx={{
        background: 'white',
        position: 'relative', // Ensure stable positioning
        minHeight: '70px', // Fixed minimum height to prevent layout shifts
      }}
    >
      {/* Separator Line */}
      <Box
        sx={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%)',
          mx: 2,
        }}
      />

      {/* Recording Indicator - Fixed height to prevent layout shift */}
      <Box
        sx={{
          height: isRecording ? '28px' : '0px', // Fixed height transition
          overflow: 'hidden',
          transition: 'height 0.2s ease',
        }}
      >
        {isRecording && (
          <Box
            sx={{
              mx: 1.5,
              mt: 0.5,
              mb: 0.5,
              p: 0.5,
              bgcolor: '#fee2e2',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              height: '18px',
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: '#dc2626',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#dc2626',
                fontSize: '0.7rem',
              }}
            >
              {isListening ? 'Listening...' : 'Recording...'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Input Section - Fixed at bottom */}
      <Box sx={{ p: 1.5 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* Input Box */}
          <TextField
            ref={inputRef}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '36px',
                borderRadius: '18px',
                background: 'white',
                '& fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: '1px',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                  borderWidth: '1px',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.85rem',
                padding: '8px 14px',
                height: '20px',
              },
            }}
          />
          {/* Audio Button */}
          <IconButton
            onClick={handleVoiceInput}
            disabled={disabled || !recognition}
            size="small"
            sx={{
              width: 32,
              height: 32,
              background: isRecording
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #092f57 0%, #1e40af 100%)',
              color: 'white',
              borderRadius: '50%',
              flexShrink: 0, // Prevent button from shrinking
              '&.Mui-disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
              },
            }}
          >
            <MicIcon sx={{ fontSize: 16 }} />
          </IconButton>

          {/* Send Button */}
          <IconButton
            type="submit"
            disabled={disabled || !message.trim()}
            size="small"
            sx={{
              width: 32,
              height: 32,
              bgcolor: message.trim() ? '#1976d2' : '#f1f5f9',
              color: message.trim() ? 'white' : '#94a3b8',
              borderRadius: '50%',
              flexShrink: 0, // Prevent button from shrinking
              '&.Mui-disabled': {
                bgcolor: '#f1f5f9',
                color: '#cbd5e1',
              },
            }}
          >
            <SendIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInput;
