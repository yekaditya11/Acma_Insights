/**
 * File Upload Page
 * Starting page for the ACMA application with file upload functionality
 * Matches the exact UI design with colored info cards
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Alert, CircularProgress, Paper, Grid, Divider, LinearProgress } from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
// Button unused
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PerformanceIcon from '@mui/icons-material/Speed';
import HighlightIcon from '@mui/icons-material/Highlight';
import { motion, AnimatePresence } from 'framer-motion';
import SafetyConnectLayout from '../components/layout/SafetyConnectLayout';
import { uploadAndAnalyzeFile } from '../services/api';

const FileUploadPage = () => {
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [error, setError] = useState(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Please upload only .xlsx Excel files');
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);
    setError(null);

    try {
      localStorage.removeItem('availableDashboards');
      const result = await uploadAndAnalyzeFile(file);
      navigate('/dashboard', { state: { fileAnalysis: result, availableDashboards: result.available_dashboards } });
    } catch (err) {
      setError(err.message || 'Failed to upload and analyze file');
      setIsUploading(false);
      setUploadedFileName('');
    }
  }, [navigate]);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // moved earlier



  // Header right actions - removed data health button
  const headerRightActions = null;

  return (
    <SafetyConnectLayout headerRightActions={headerRightActions}>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        {/* Header - Exact match to the image */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center" 
            sx={{ 
              mb: 2, 
              color: '#092f57', 
              fontWeight: 'bold',
              fontSize: '2.5rem'
            }}
          >
            Data Insights and Analytics
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Divider sx={{ width: 60, height: 3, bgcolor: '#092f57' }} />
          </Box>
          <Typography 
            variant="h6" 
            component="p" 
            align="center" 
            sx={{ 
              mb: 4, 
              color: '#666', 
              maxWidth: 600, 
              mx: 'auto',
              fontSize: '1.1rem'
            }}
          >
            Advanced safety data analysis and business intelligence
          </Typography>
        </motion.div>

        {/* Four Info Cards - Exact match to the image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Safety Overview */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: 100,
                  borderLeft: '4px solid #092f57',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SecurityIcon sx={{ color: '#092f57', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#092f57' }}>
                      Safety Overview
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Get a concise overview of your data
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Indicators */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: 100,
                  borderLeft: '4px solid #092f57',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PerformanceIcon sx={{ color: '#092f57', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#092f57' }}>
                      Performance Indicators
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Identify important numbers and performance indicators
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Trend Analysis */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: 100,
                  borderLeft: '4px solid #f59e0b',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon sx={{ color: '#f59e0b', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                      Trend Analysis
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Discover patterns across branches and time periods
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Data Highlights */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: 100,
                  borderLeft: '4px solid #ef4444',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HighlightIcon sx={{ color: '#ef4444', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ef4444' }}>
                      Data Highlights
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Identify key data points and important findings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

                 {/* Upload Area - Compact design with loading inside */}
         <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.4 }}
             style={{ width: '100%', maxWidth: '600px' }}
           >
             <Paper
               elevation={0}
               sx={{
                 border: `2px dashed ${isDragOver ? '#092f57' : '#ccc'}`,
                 borderRadius: 2,
                 p: 4,
                 textAlign: 'center',
                 bgcolor: isDragOver ? '#f8fafc' : 'transparent',
                 transition: 'all 0.3s ease',
                 cursor: isUploading ? 'default' : 'pointer',
                 minHeight: 250,
                 display: 'flex',
                 flexDirection: 'column',
                 justifyContent: 'center',
                 alignItems: 'center',
                 position: 'relative',
                 '&:hover': {
                   borderColor: isUploading ? undefined : '#092f57',
                   bgcolor: isUploading ? undefined : '#f8fafc'
                 }
               }}
               onDrop={isUploading ? undefined : handleDrop}
               onDragOver={isUploading ? undefined : handleDragOver}
               onDragLeave={isUploading ? undefined : handleDragLeave}
               onClick={isUploading ? undefined : () => document.getElementById('file-input').click()}
             >
               {!isUploading ? (
                 <>
                   <UploadIcon sx={{ fontSize: 48, color: '#092f57', mb: 2 }} />
                   <Typography variant="h6" gutterBottom sx={{ color: '#092f57', fontWeight: 600 }}>
                     Drag and drop an Excel file here, or click to select
                   </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supported format: .xlsx
                    </Typography>
                 </>
               ) : (
                 /* Loading State Inside Box */
                 <Box sx={{ width: '100%' }}>
                   <CircularProgress 
                     size={40} 
                     sx={{ color: '#092f57', mb: 2 }} 
                   />
                   <Typography 
                     variant="h6" 
                     gutterBottom 
                     sx={{ color: '#092f57', fontWeight: 600, mb: 1 }}
                   >
                     Uploading File
                   </Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                     Your file is being uploaded to the server...
                   </Typography>
                   
                   {uploadedFileName && (
                     <Typography 
                       variant="body2" 
                       sx={{ 
                         color: '#666', 
                         mb: 2,
                         fontWeight: 500,
                         bgcolor: '#f5f5f5',
                         p: 1,
                         borderRadius: 1,
                         display: 'inline-block'
                       }}
                     >
                       {uploadedFileName}
                     </Typography>
                   )}
                   
                   <Box sx={{ width: '100%' }}>
                     <LinearProgress 
                       sx={{ 
                         height: 6, 
                         borderRadius: 3,
                         bgcolor: '#e0e0e0',
                         '& .MuiLinearProgress-bar': {
                           bgcolor: '#092f57'
                         }
                       }} 
                     />
                   </Box>
                 </Box>
               )}
               
                <input
                 id="file-input"
                 type="file"
                  accept=".xlsx"
                 style={{ display: 'none' }}
                 onChange={handleFileInputChange}
               />
             </Paper>

             {/* Error State */}
             <AnimatePresence>
               {error && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                 >
                   <Alert severity="error" sx={{ mt: 3 }}>
                     {error}
                   </Alert>
                 </motion.div>
               )}
             </AnimatePresence>
           </motion.div>
         </Box>


      </Box>
    </SafetyConnectLayout>
  );
};

export default FileUploadPage; 