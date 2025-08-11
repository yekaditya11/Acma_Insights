/**
 * Animation Utilities
 * Beautiful animation configurations for the ACMA dashboard
 */

// Framer Motion animation variants
export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

export const moduleTransitions = {
  initial: { opacity: 0, x: 30, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -30, scale: 0.95 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

export const cardAnimations = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

export const hoverScale = {
  whileHover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  whileTap: { scale: 0.98 }
};

// Dashboard-safe version without hover effects for main containers
export const dashboardCardStatic = {
  // No hover effects for dashboard containers
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Individual metric hover (for KPI cards, charts, etc.)
export const metricHover = {
  whileHover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  whileTap: { scale: 0.98 }
};

export const buttonHover = {
  whileHover: { 
    scale: 1.05, 
    y: -1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  whileTap: { scale: 0.95 }
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

// Loading animation for modules
export const moduleLoadingAnimation = {
  animate: {
    rotate: [0, 10, -10, 0],
    y: [0, -5, 5, 0],
    scale: [1, 1.1, 0.9, 1]
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Chart animation configurations
export const chartAnimations = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5, staggerChildren: 0.1 }
  },
  item: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }
};

// Enhanced Chat animations with improved visual effects
export const chatAnimations = {
  // Enhanced message entrance with staggered effect
  message: {
    initial: { opacity: 0, y: 15, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },

  // User message with slide from right
  userMessage: {
    initial: { opacity: 0, x: 20, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
      type: "spring",
      stiffness: 350,
      damping: 30
    }
  },

  // AI message with slide from left
  aiMessage: {
    initial: { opacity: 0, x: -20, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
      type: "spring",
      stiffness: 350,
      damping: 30
    }
  },

  // Enhanced typing indicator with multiple dots
  typing: {
    animate: {
      scale: [1, 1.15, 1],
      opacity: [0.6, 1, 0.6]
    },
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Typing dots animation
  typingDots: {
    animate: {
      y: [0, -8, 0],
      opacity: [0.4, 1, 0.4]
    },
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  // Chat window entrance - no transforms that break fixed positioning
  chatWindow: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
      type: "tween"
    }
  },

  // Quick questions/suggestions
  quickQuestion: {
    initial: { opacity: 0, y: 10, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    whileHover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
    },
    whileTap: { scale: 0.98 },
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },

  // Chart loading animation
  chartLoading: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  },

  // Chart entrance with bounce
  chartEntrance: {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  }
};

// Utility function to create staggered animations
export const createStaggeredAnimation = (delay = 0.1) => ({
  container: {
    animate: {
      transition: {
        staggerChildren: delay,
        delayChildren: delay
      }
    }
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  }
});

// Utility function for hover animations (for individual metrics only)
export const createHoverAnimation = (scale = 1.02, y = -2) => ({
  whileHover: {
    scale,
    y,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  whileTap: { scale: 0.98 }
});

// Utility function for dashboard containers (NO hover effects)
export const createDashboardAnimation = () => ({
  // Only basic transitions, no hover effects
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
});

// Spring animation configurations
export const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

export const gentleSpring = {
  type: "spring",
  stiffness: 200,
  damping: 25
};

export const bouncySpring = {
  type: "spring",
  stiffness: 400,
  damping: 20
};
