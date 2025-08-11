import React from 'react';
import {
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const FloatingAIAssistant = ({ 
  isActive, 
  onToggle
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleClick = () => {
    onToggle();
  };

  return (
    <div
      className="floating-ai-assistant"
      style={{
        position: 'relative',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: isMobile ? 70 : 80,
        height: isMobile ? 70 : 80,
      }}
      onClick={handleClick}
      title={isActive ? "Close AI Assistant" : "Open AI Assistant"}
    >
      {/* Lottie animation replacing GIF */}
      <DotLottieReact
        src="https://lottie.host/e076e2db-8fe0-4c21-8734-cf72ccd1ac1c/w7rRQgiFP7.lottie"
        loop
        autoplay
        style={{
          width: isMobile ? 70 : 80,
          height: isMobile ? 70 : 80,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default FloatingAIAssistant;
