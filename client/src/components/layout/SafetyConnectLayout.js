/**
 * ACMALayout Component
 * Clean, professional layout for ACMA dashboard
 * Header-only layout with no sidebar
 */

import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Divider, Breadcrumbs } from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

const SafetyConnectLayout = ({ 
  children, 
  title, 
  subtitle, 
  headerActions, 
  headerRightActions,
  breadcrumbs = [] 
}) => {
  // layout-level hooks not needed currently
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Clean Header - No rounded corners */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#092f57',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 0,
          color: 'white',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
          {/* Left side - Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Header Logo */}
            <Box
              component="img"
              src="/acmalogo.png"
              alt="ACMA"
              sx={{
                height: 48,
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                transform: 'scale(1.3)',
                transformOrigin: 'left center',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                const textElement = document.createElement('span');
                textElement.textContent = 'ACMA';
                textElement.style.color = 'white';
                textElement.style.fontWeight = '600';
                textElement.style.fontSize = '3rem';
                textElement.style.lineHeight = '1';
                textElement.style.display = 'inline-block';
                textElement.style.transform = 'scale(1.2)';
                textElement.style.transformOrigin = 'left center';
                e.target.parentNode.appendChild(textElement);
              }}
            />
          </Box>

          {/* Center - Header Actions */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {headerActions}
          </Box>

          {/* Right side - Upload Button and User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Header Right Actions (like upload button) */}
            {headerRightActions}

            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <AccountIcon sx={{ fontSize: 24, color: 'white' }} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  border: '1px solid #e5e7eb',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleClose}>
                <AccountIcon sx={{ mr: 2, color: '#092f57' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Typography>Profile</Typography>
                 
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClose}>
                <LogoutIcon sx={{ mr: 2, color: '#092f57' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area - Full Width */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          bgcolor: '#f8fafc',
          minHeight: 'calc(100vh - 64px)',
          mt: 8,
        }}
      >
        {/* Page Header with Breadcrumbs */}
        {(title || breadcrumbs.length > 0) && (
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: 'white',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {breadcrumbs.length > 0 && (
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                sx={{ mb: 1 }}
              >
                {breadcrumbs.map((crumb, index) => {
                  const IconComponent = crumb.icon;
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: index === breadcrumbs.length - 1 ? '#092f57' : '#64748b',
                        fontSize: '0.875rem',
                        fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                      }}
                    >
                      {IconComponent && <IconComponent sx={{ fontSize: 16 }} />}
                      {crumb.label}
                    </Box>
                  );
                })}
              </Breadcrumbs>
            )}
            
            {title && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                  {/* Accent bar */}
                  <Box
                    sx={{
                      width: 6,
                      height: 36,
                      borderRadius: 2,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    }}
                  />
                  {/* Gradient title */}
                  <Typography
                    component="h1"
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.6rem', md: '3.2rem' },
                      fontWeight: 800,
                      letterSpacing: 0.4,
                      lineHeight: 1.05,
                      m: 0,
                      background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 60%, #1d4ed8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    {title}
                  </Typography>
                </Box>
                {subtitle && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      fontWeight: 400,
                      ml: 1.75,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
            
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontWeight: 400,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {/* Page Content */}
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default SafetyConnectLayout;
