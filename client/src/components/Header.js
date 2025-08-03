import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useAppContext } from "../context/AppContext";
import "./Header.css";

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    resetState,
    darkMode,
    toggleDarkMode,
    activeTab,
    setActiveTab,
    tables,
  } = useAppContext();

  // Function to handle click on title and redirect to home page
  const handleTitleClick = () => {
    resetState();
    setActiveTab("insights"); // Ensure we go back to insights tab
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      className="app-header"
    >
      <Toolbar className="header-toolbar">
        {/* Logo and Title */}
        <Box className="logo-container">
          <Tooltip title="Go to Home Page">
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h1"
              onClick={handleTitleClick}
              className="app-title fade-in"
            >
              Data Insights
            </Typography>
          </Tooltip>
        </Box>

        {/* Spacer to push navigation to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation buttons - grouped container - only show when data exists */}
        {Object.keys(tables).length > 0 && (
          <Box 
            className="actions-container"
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#F9FAFB", // Light gray background for container
              border: "1px solid #E5E7EB", // Subtle border
              borderRadius: 2,
              p: 0.5, // Small padding around the group
              gap: 0, // No gap between elements
            }}
          >
            {/* Insights Button */}
            <Button
              variant={activeTab === "insights" ? "contained" : "outlined"}
              startIcon={<InsightsIcon />}
              onClick={() => setActiveTab("insights")}
              sx={{
                borderRadius: 1.5,
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                border: "none",
                minWidth: "auto",
                ...(activeTab === "insights" && {
                  bgcolor: "#1F2937", // Darker charcoal gray
                  color: "white",
                  "&:hover": {
                    bgcolor: "#111827",
                  },
                }),
                ...(activeTab !== "insights" && {
                  color: "#1F2937", // Dark charcoal gray text
                  bgcolor: "transparent",
                  "&:hover": {
                    bgcolor: "#F3F4F6",
                  },
                }),
              }}
            >
              Insights
            </Button>

            {/* Dashboard Button */}
            <Button
              variant={activeTab === "dashboard" ? "contained" : "outlined"}
              startIcon={<DashboardIcon />}
              onClick={() => setActiveTab("dashboard")}
              sx={{
                borderRadius: 1.5,
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                border: "none",
                minWidth: "auto",
                ...(activeTab === "dashboard" && {
                  bgcolor: "#1F2937", // Darker charcoal gray
                  color: "white",
                  "&:hover": {
                    bgcolor: "#111827",
                  },
                }),
                ...(activeTab !== "dashboard" && {
                  color: "#1F2937", // Dark charcoal gray text
                  bgcolor: "transparent",
                  "&:hover": {
                    bgcolor: "#F3F4F6",
                  },
                }),
              }}
            >
              Dashboard
            </Button>
          </Box>
        )}

        {/* Theme Toggle - positioned at the most right */}
        <Box sx={{ ml: 2 }}>
          <Tooltip
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <IconButton
              onClick={toggleDarkMode}
              sx={{
                color: "#1F2937", // Dark charcoal gray
                "&:hover": {
                  color: "#111827",
                  bgcolor: "#F3F4F6",
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
