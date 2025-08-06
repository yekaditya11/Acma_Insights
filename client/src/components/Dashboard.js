import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  People,
  Security,
  LocalShipping,
  DirectionsCar,
  Compare,
  Assessment,
  Timeline,
  Business,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  Legend,
} from "recharts";
import { useAppContext } from "../context/AppContext";
import api from "../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const { darkMode } = useAppContext();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [comparisonMode, setComparisonMode] = useState("radar");
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [showSupplierAnalysis, setShowSupplierAnalysis] = useState(false);

  // Color palette for charts
  const colors = {
    primary: darkMode ? "#4ade80" : "#10a37f",
    secondary: darkMode ? "#60a5fa" : "#4285F4",
    warning: darkMode ? "#fbbf24" : "#FBBC05",
    error: darkMode ? "#f87171" : "#EA4335",
    success: darkMode ? "#4ade80" : "#10a37f",
    neutral: darkMode ? "#9ca3af" : "#6b7280",
  };

  const comparisonColors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1",
    "#d084d0", "#ff8042", "#0088fe", "#00c49f", "#ffbb28"
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDashboardData();
      const dashboardData = response.data?.data || response.data || response;
      console.log("Dashboard data received:", dashboardData);
      setDashboardData(dashboardData);
      
      // Extract available suppliers for comparison
      if (dashboardData.rankings) {
        const suppliers = Object.keys(dashboardData.rankings).length > 0 
          ? dashboardData.rankings[Object.keys(dashboardData.rankings)[0]]?.map(item => item.supplier) || []
          : [];
        setAvailableSuppliers(suppliers);
        // Auto-select first 3 suppliers for comparison
        setSelectedSuppliers(suppliers.slice(0, 3));
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value;
  };

  const getTrendIcon = (trend) => {
    if (trend === "increasing") return <TrendingUp color="success" />;
    if (trend === "decreasing") return <TrendingDown color="error" />;
    return null;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "low":
        return colors.success;
      case "medium":
        return colors.warning;
      case "high":
        return colors.error;
      default:
        return colors.neutral;
    }
  };

  // Prepare comparison data for selected suppliers
  const getComparisonData = () => {
    if (!dashboardData?.rankings || selectedSuppliers.length === 0) return [];

    const kpiNames = Object.keys(dashboardData.rankings);
    const comparisonData = [];

    selectedSuppliers.forEach((supplier, index) => {
      const supplierData = {
        supplier,
        color: comparisonColors[index % comparisonColors.length]
      };

      kpiNames.forEach(kpi => {
        const kpiData = dashboardData.rankings[kpi]?.find(item => item.supplier === supplier);
        if (kpiData) {
          supplierData[kpi] = kpiData.average || kpiData.score || 0;
        }
      });

      comparisonData.push(supplierData);
    });

    return comparisonData;
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!dashboardData?.rankings || selectedSuppliers.length === 0) return [];

    const kpiNames = Object.keys(dashboardData.rankings);
    const radarData = [];

    selectedSuppliers.forEach((supplier, index) => {
      const supplierData = {
        supplier,
        color: comparisonColors[index % comparisonColors.length]
      };

      kpiNames.forEach(kpi => {
        const kpiData = dashboardData.rankings[kpi]?.find(item => item.supplier === supplier);
        if (kpiData) {
          // Normalize values for radar chart (0-100 scale)
          const value = kpiData.average || kpiData.score || 0;
          const normalizedValue = Math.min(100, Math.max(0, (value / 100) * 100));
          supplierData[kpi] = normalizedValue;
        }
      });

      radarData.push(supplierData);
    });

    return radarData;
  };

  // Prepare performance matrix data
  const getPerformanceMatrix = () => {
    if (!dashboardData?.performanceMatrix?.matrixData) return [];

    return dashboardData.performanceMatrix.matrixData
      .filter(row => selectedSuppliers.includes(row.supplier))
      .map((row, index) => ({
        ...row,
        color: comparisonColors[index % comparisonColors.length]
      }));
  };

  // Prepare efficiency metrics data (unfiltered - shows all suppliers)
  const getEfficiencyMetricsData = () => {
    if (!dashboardData?.performanceMatrix?.matrixData) return [];

    return dashboardData.performanceMatrix.matrixData
      .map((row, index) => ({
        ...row,
        color: comparisonColors[index % comparisonColors.length]
      }));
  };

  // Prepare trend comparison data
  const getTrendComparisonData = () => {
    if (!dashboardData?.timeSeries || selectedSuppliers.length === 0) return [];

    const months = Object.keys(dashboardData.timeSeries.quantityShipped?.monthlyData || {});
    const trendData = [];

    months.forEach(month => {
      const monthData = { month };
      
      selectedSuppliers.forEach((supplier, index) => {
        // Get quantity shipped for this supplier and month
        const supplierData = dashboardData.rankings?.quantityShipped?.find(item => item.supplier === supplier);
        if (supplierData?.monthlyData?.[month] !== undefined) {
          monthData[supplier] = supplierData.monthlyData[month];
        }
      });

      trendData.push(monthData);
    });

    return trendData;
  };

  // Handle supplier selection change
  const handleSupplierSelection = (event) => {
    const selected = event.target.value;
    
    // If "All Suppliers" is being selected, select all suppliers
    if (selected.includes("All Suppliers")) {
      setSelectedSuppliers(availableSuppliers);
    } 
    // If individual suppliers are being selected, remove "All Suppliers" and use selected suppliers
    else {
      setSelectedSuppliers(selected);
    }
  };

  // Check if all suppliers are selected (for UI display)
  const isAllSuppliersSelected = () => {
    return selectedSuppliers.length === availableSuppliers.length && 
           availableSuppliers.every(supplier => selectedSuppliers.includes(supplier));
  };

  // Get the display value for the dropdown
  const getDropdownValue = () => {
    if (isAllSuppliersSelected()) {
      return ["All Suppliers"];
    }
    return selectedSuppliers;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <CircularProgress size={60} sx={{ color: colors.primary }} />
        <Typography variant="h6" color="text.secondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchDashboardData} size="small">
            <Refresh />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData || !dashboardData.timeSeries) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No dashboard data available. Please upload an Excel file first to view the dashboard.
        </Typography>
      </Box>
    );
  }

  const { 
    timeSeries: kpiData, 
    performanceMatrix, 
    operationalInsights, 
    suppliers,
    summary
  } = dashboardData || {};

  console.log("Dashboard data:", dashboardData);
  console.log("Extracted data:", { kpiData, performanceMatrix, operationalInsights, suppliers, summary });

  // Prepare chart data with null checks
  const monthlyChartData = kpiData && kpiData.quantityShipped && kpiData.quantityShipped.monthlyData 
    ? Object.keys(kpiData.quantityShipped.monthlyData)
        .filter(month => kpiData.quantityShipped.monthlyData[month] !== null)
        .map(month => ({
          month,
          quantity: kpiData.quantityShipped.monthlyData[month],
          trips: kpiData.trips?.monthlyData?.[month] || 0,
          partsPerTrip: kpiData.partsPerTrip?.monthlyData?.[month] || 0,
          vehicleTAT: kpiData.vehicleTAT?.monthlyData?.[month] || 0,
          machineDowntime: kpiData.machineDowntimeHrs?.monthlyData?.[month] || 0,
          machineBreakdowns: kpiData.machineBreakdowns?.monthlyData?.[month] || 0,
        }))
    : [];

  const reliabilityData = operationalInsights?.reliabilityMetrics 
    ? Object.entries(operationalInsights.reliabilityMetrics)
        .map(([supplier, data]) => ({
          supplier,
          score: data.overallScore,
          riskLevel: data.riskLevel,
        }))
        .sort((a, b) => b.score - a.score)
    : [];

  const riskData = operationalInsights?.riskAssessment
    ? Object.entries(operationalInsights.riskAssessment)
        .map(([supplier, data]) => ({
          supplier,
          score: data.riskScore,
          level: data.riskLevel,
        }))
        .sort((a, b) => a.score - b.score)
    : [];

  const comparisonData = getComparisonData();
  const radarData = getRadarData();
  const performanceMatrixData = getPerformanceMatrix();
  const trendComparisonData = getTrendComparisonData();

  return (
    <Box sx={{ 
      width: "100%", 
      minHeight: "100vh", 
      overflow: "auto", 
      p: 2, 
      bgcolor: "background.default"
    }}>
      
      {/* Summary Cards and Analysis Button */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        {/* Summary Cards */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
          <Card sx={{ bgcolor: "background.paper", minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <People sx={{ color: colors.primary, mr: 1, fontSize: 20 }} />
                <Typography color="text.secondary">
                  Total Suppliers
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: colors.primary }}>
                {suppliers.length}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "background.paper", minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Security sx={{ color: colors.success, mr: 1, fontSize: 20 }} />
                <Typography color="text.secondary">
                  Safety Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: colors.success }}>
                {summary?.safety?.safetyRate?.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "background.paper", minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <LocalShipping sx={{ color: colors.secondary, mr: 1, fontSize: 20 }} />
                <Typography color="text.secondary">
                  Avg Delivery Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: colors.secondary }}>
                {summary?.delivery?.averageDeliveryRate?.toFixed(1) || 0}%
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "background.paper", minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <DirectionsCar sx={{ color: colors.warning, mr: 1, fontSize: 20 }} />
                <Typography color="text.secondary">
                  Total Trips
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: colors.warning }}>
                {summary?.production?.totalTrips?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Supplier Analysis Toggle Button */}
        <Button
          variant={showSupplierAnalysis ? "contained" : "outlined"}
          size="medium"
          onClick={() => setShowSupplierAnalysis(!showSupplierAnalysis)}
          startIcon={<Business />}
          sx={{
            minWidth: 160,
            py: 1,
            px: 2,
            fontSize: "0.9rem",
            fontWeight: "bold",
            borderRadius: 2,
            boxShadow: showSupplierAnalysis ? 2 : 1,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: showSupplierAnalysis ? 3 : 2,
            }
          }}
        >
          {showSupplierAnalysis ? "Hide Supplier Analysis" : "Show Supplier Analysis"}
        </Button>
      </Box>



      {/* Supplier Analysis Section */}
      {showSupplierAnalysis && (
        <>
          {/* Supplier Comparison Controls */}
          <Card sx={{ bgcolor: "background.paper", mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Compare sx={{ color: colors.primary, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Supplier Comparison Analysis
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <FormControl sx={{ minWidth: 200, maxWidth: 200 }}>
                  <InputLabel>Select Suppliers</InputLabel>
                  <Select
                    multiple
                    value={getDropdownValue()}
                    onChange={handleSupplierSelection}
                    label="Select Suppliers"
                    size="small"
                    renderValue={(selected) => {
                      if (selected.includes("All Suppliers")) {
                        return "All Suppliers";
                      }
                      return selected.length > 0 ? `${selected.length} selected` : "Select Suppliers";
                    }}
                  >
                    <MenuItem value="All Suppliers">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span>All Suppliers</span>
                        {isAllSuppliersSelected() && <Box component="span" sx={{ color: "primary.main" }}>✓</Box>}
                      </Box>
                    </MenuItem>
                    {availableSuppliers.map((supplier) => (
                      <MenuItem key={supplier} value={supplier}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span>{supplier}</span>
                          {selectedSuppliers.includes(supplier) && <Box component="span" sx={{ color: "primary.main" }}>✓</Box>}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (isAllSuppliersSelected()) {
                      setSelectedSuppliers([]);
                    } else {
                      setSelectedSuppliers(availableSuppliers);
                    }
                  }}
                  sx={{ minWidth: 120 }}
                >
                  {isAllSuppliersSelected() ? "Deselect All" : "Select All"}
                </Button>

                <ToggleButtonGroup
                  value={comparisonMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setComparisonMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="radar">
                    <Assessment sx={{ mr: 1 }} />
                    Radar Chart
                  </ToggleButton>
                  <ToggleButton value="bar">
                    <BarChart sx={{ mr: 1 }} />
                    Bar Chart
                  </ToggleButton>
                  <ToggleButton value="trend">
                    <Timeline sx={{ mr: 1 }} />
                    Trend Comparison
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </CardContent>
          </Card>

          {/* Comparison Charts */}
          {selectedSuppliers.length > 0 && (
            <Box sx={{ mb: 3 }}>
                        {comparisonMode === "radar" && (
            <Card sx={{ bgcolor: "background.paper", height: 600 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Multi-Dimensional Supplier Comparison (Radar Chart)
                </Typography>
                <ResponsiveContainer width="100%" height={500}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="supplier" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        {Object.keys(dashboardData?.rankings || {}).map((kpi, index) => (
                          <Radar
                            key={kpi}
                            name={kpi}
                            dataKey={kpi}
                            stroke={comparisonColors[index % comparisonColors.length]}
                            fill={comparisonColors[index % comparisonColors.length]}
                            fillOpacity={0.3}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {comparisonMode === "bar" && (
                <Box sx={{ display: "flex", gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Card sx={{ bgcolor: "background.paper", height: 500 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                          KPI Performance Comparison
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <ComposedChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="supplier"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            {Object.keys(dashboardData?.rankings || {}).map((kpi, index) => (
                              <Bar
                                key={kpi}
                                dataKey={kpi}
                                fill={colors.secondary}
                                radius={[4, 4, 0, 0]}
                              />
                            ))}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Card sx={{ bgcolor: "background.paper", height: 500 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                          Delivery Performance Comparison
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={performanceMatrixData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="supplier" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar 
                              dataKey="okDeliveryPercent" 
                              fill={colors.secondary}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}

              {comparisonMode === "trend" && (
                <Card sx={{ bgcolor: "background.paper", height: 500 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                      Monthly Trend Comparison
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={trendComparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        {selectedSuppliers.map((supplier, index) => (
                          <Line
                            key={supplier}
                            type="monotone"
                            dataKey={supplier}
                            stroke={comparisonColors[index % comparisonColors.length]}
                            strokeWidth={2}
                            name={supplier}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </>
      )}

      {/* Regular Charts Section - Only show when supplier analysis is NOT active */}
      {!showSupplierAnalysis && (
        <>
          {/* Charts Section */}
          <Box sx={{ mb: 3, display: "flex", gap: 3 }}>
            {/* Monthly Performance Chart */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ bgcolor: "background.paper", height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Monthly Performance Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line 
                        type="monotone" 
                        dataKey="quantity" 
                        stroke={colors.primary} 
                        strokeWidth={2}
                        name="Quantity Shipped"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="trips" 
                        stroke={colors.secondary} 
                        strokeWidth={2}
                        name="Trips"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Efficiency Metrics Chart */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ bgcolor: "background.paper", height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Efficiency Metrics Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getEfficiencyMetricsData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="supplier" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar 
                        dataKey="partsPerTrip" 
                        fill="#ff4444"
                        radius={[4, 4, 0, 0]}
                        name="Parts per Trip"
                      />
                      <Bar 
                        dataKey="vehicleTAT" 
                        fill="#4285F4"
                        radius={[4, 4, 0, 0]}
                        name="Vehicle TAT"
                      />
                      <Bar 
                        dataKey="machineDowntimeHrs" 
                        fill="#FBBC05"
                        radius={[4, 4, 0, 0]}
                        name="Machine Downtime"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* KPI Performance Charts */}
          <Box sx={{ mb: 3, display: "flex", gap: 3 }}>
            {/* Parts Per Trip */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ bgcolor: "background.paper", height: 350 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Parts Per Trip Efficiency Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area 
                        type="monotone"
                        dataKey="partsPerTrip" 
                        stroke={colors.secondary}
                        fill={colors.secondary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Machine Downtime */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ bgcolor: "background.paper", height: 350 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Machine Downtime Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line 
                        type="monotone"
                        dataKey="machineDowntime" 
                        stroke={colors.error}
                        strokeWidth={3}
                        dot={{ fill: colors.error, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Supplier Performance Matrix */}
          <Card sx={{ bgcolor: "background.paper", mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Supplier Performance Matrix
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Supplier</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Accidents</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Delivery %</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Trips</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Parts/Trip</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Vehicle TAT</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>Risk Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceMatrix?.matrixData?.slice(0, 10).map((row) => (
                      <TableRow key={row.supplier} hover>
                        <TableCell sx={{ fontWeight: "medium" }}>
                          {row.supplier}
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(row.accidents)} 
                            size="small"
                            color={row.accidents > 0 ? "error" : "success"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${formatNumber(row.okDeliveryPercent)}%`}
                            size="small"
                            color={row.okDeliveryPercent >= 90 ? "success" : "warning"}
                          />
                        </TableCell>
                        <TableCell align="right">{formatNumber(row.trips)}</TableCell>
                        <TableCell align="right">{formatNumber(row.quantityShipped)}</TableCell>
                        <TableCell align="right">{formatNumber(row.partsPerTrip)}</TableCell>
                        <TableCell align="right">{formatNumber(row.vehicleTAT)}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={operationalInsights?.riskAssessment?.[row.supplier]?.riskLevel || "N/A"}
                            size="small"
                            sx={{ 
                              bgcolor: getRiskColor(operationalInsights?.riskAssessment?.[row.supplier]?.riskLevel),
                              color: "white"
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}



    </Box>
  );
};

export default Dashboard; 