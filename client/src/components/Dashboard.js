import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
} from "@mui/material";

import SpeedIcon from '@mui/icons-material/Speed';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SecurityIcon from '@mui/icons-material/Security';

const Dashboard = () => {
  const [kpiData, setKpiData] = useState(null);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        const response = await fetch('http://localhost:8001/kpi-data');
        if (response.ok) {
          const data = await response.json();
          setKpiData(data);
        } else {
          console.error('Failed to fetch KPI data');
          setKpiData(mockKpiData);
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error);
        setKpiData(mockKpiData);
      }
    };

    fetchKpiData();
  }, []);

  // Mock data for development
  const mockKpiData = {
    suppliers: ["Acute_Wiring", "Ankita_Auto", "CAM", "Daxter", "JJ_Tecnoplast", "Kamal", "Laxmi_SPRINGS", "Makarjyothi", "S_B_Precision_Springs", "Shree_Stamping", "Unique_Systems", "Victor_Engineers_ASAL"],
    metrics: {
      accidents: {
        "Acute_Wiring": { total: 0, trend: "stable" },
        "Ankita_Auto": { total: 0, trend: "stable" },
        "CAM": { total: 0, trend: "stable" },
        "Daxter": { total: 0, trend: "stable" },
        "JJ_Tecnoplast": { total: 0, trend: "stable" },
        "Kamal": { total: 0, trend: "stable" },
        "Laxmi_SPRINGS": { total: 0, trend: "stable" },
        "Makarjyothi": { total: 0, trend: "stable" },
        "S_B_Precision_Springs": { total: 0, trend: "stable" },
        "Shree_Stamping": { total: 0, trend: "stable" },
        "Unique_Systems": { total: 0, trend: "stable" },
        "Victor_Engineers_ASAL": { total: 0, trend: "stable" }
      },
      okDelivery: {
        "Acute_Wiring": { avg: 85.2, trend: "stable" },
        "Ankita_Auto": { avg: 92.1, trend: "stable" },
        "CAM": { avg: 78.5, trend: "stable" },
        "Daxter": { avg: 88.7, trend: "stable" },
        "JJ_Tecnoplast": { avg: 91.3, trend: "stable" },
        "Kamal": { avg: 87.4, trend: "stable" },
        "Laxmi_SPRINGS": { avg: 89.6, trend: "stable" },
        "Makarjyothi": { avg: 84.3, trend: "stable" },
        "S_B_Precision_Springs": { avg: 90.8, trend: "stable" },
        "Shree_Stamping": { avg: 82.1, trend: "stable" },
        "Unique_Systems": { avg: 86.9, trend: "stable" },
        "Victor_Engineers_ASAL": { avg: 93.2, trend: "stable" }
      },
      productionLoss: {
        "Acute_Wiring": { total: 45, trend: "decreasing" },
        "Ankita_Auto": { total: 32, trend: "decreasing" },
        "CAM": { total: 67, trend: "decreasing" },
        "Daxter": { total: 28, trend: "decreasing" },
        "JJ_Tecnoplast": { total: 41, trend: "decreasing" },
        "Kamal": { total: 53, trend: "decreasing" },
        "Laxmi_SPRINGS": { total: 38, trend: "decreasing" },
        "Makarjyothi": { total: 62, trend: "decreasing" },
        "S_B_Precision_Springs": { total: 35, trend: "decreasing" },
        "Shree_Stamping": { total: 71, trend: "decreasing" },
        "Unique_Systems": { total: 44, trend: "decreasing" },
        "Victor_Engineers_ASAL": { total: 29, trend: "decreasing" }
      },
      trips: {
        "Acute_Wiring": { total: 156, avg: 26 },
        "Ankita_Auto": { total: 142, avg: 23.7 },
        "CAM": { total: 178, avg: 29.7 },
        "Daxter": { total: 134, avg: 22.3 },
        "JJ_Tecnoplast": { total: 165, avg: 27.5 },
        "Kamal": { total: 189, avg: 31.5 },
        "Laxmi_SPRINGS": { total: 147, avg: 24.5 },
        "Makarjyothi": { total: 201, avg: 33.5 },
        "S_B_Precision_Springs": { total: 158, avg: 26.3 },
        "Shree_Stamping": { total: 172, avg: 28.7 },
        "Unique_Systems": { total: 163, avg: 27.2 },
        "Victor_Engineers_ASAL": { total: 145, avg: 24.2 }
      },
      quantityShipped: {
        "Acute_Wiring": { total: 12500, avg: 2083 },
        "Ankita_Auto": { total: 11800, avg: 1967 },
        "CAM": { total: 14200, avg: 2367 },
        "Daxter": { total: 10800, avg: 1800 },
        "JJ_Tecnoplast": { total: 13200, avg: 2200 },
        "Kamal": { total: 15800, avg: 2633 },
        "Laxmi_SPRINGS": { total: 12100, avg: 2017 },
        "Makarjyothi": { total: 16800, avg: 2800 },
        "S_B_Precision_Springs": { total: 12900, avg: 2150 },
        "Shree_Stamping": { total: 13800, avg: 2300 },
        "Unique_Systems": { total: 13100, avg: 2183 },
        "Victor_Engineers_ASAL": { total: 11900, avg: 1983 }
      },
      vehicleTAT: {
        "Acute_Wiring": { avg: 2.4, trend: "stable" },
        "Ankita_Auto": { avg: 2.1, trend: "stable" },
        "CAM": { avg: 2.8, trend: "stable" },
        "Daxter": { avg: 1.9, trend: "stable" },
        "JJ_Tecnoplast": { avg: 2.3, trend: "stable" },
        "Kamal": { avg: 2.6, trend: "stable" },
        "Laxmi_SPRINGS": { avg: 2.2, trend: "stable" },
        "Makarjyothi": { avg: 2.9, trend: "stable" },
        "S_B_Precision_Springs": { avg: 2.0, trend: "stable" },
        "Shree_Stamping": { avg: 2.7, trend: "stable" },
        "Unique_Systems": { avg: 2.4, trend: "stable" },
        "Victor_Engineers_ASAL": { avg: 2.1, trend: "stable" }
      },
      machineDowntime: {
        "Acute_Wiring": { total: 12, avg: 2 },
        "Ankita_Auto": { total: 8, avg: 1.3 },
        "CAM": { total: 18, avg: 3 },
        "Daxter": { total: 6, avg: 1 },
        "JJ_Tecnoplast": { total: 14, avg: 2.3 },
        "Kamal": { total: 22, avg: 3.7 },
        "Laxmi_SPRINGS": { total: 10, avg: 1.7 },
        "Makarjyothi": { total: 25, avg: 4.2 },
        "S_B_Precision_Springs": { total: 11, avg: 1.8 },
        "Shree_Stamping": { total: 20, avg: 3.3 },
        "Unique_Systems": { total: 13, avg: 2.2 },
        "Victor_Engineers_ASAL": { total: 9, avg: 1.5 }
      },
      machineBreakdowns: {
        "Acute_Wiring": { total: 3, avg: 0.5 },
        "Ankita_Auto": { total: 2, avg: 0.3 },
        "CAM": { total: 5, avg: 0.8 },
        "Daxter": { total: 1, avg: 0.2 },
        "JJ_Tecnoplast": { total: 4, avg: 0.7 },
        "Kamal": { total: 6, avg: 1 },
        "Laxmi_SPRINGS": { total: 3, avg: 0.5 },
        "Makarjyothi": { total: 7, avg: 1.2 },
        "S_B_Precision_Springs": { total: 2, avg: 0.3 },
        "Shree_Stamping": { total: 5, avg: 0.8 },
        "Unique_Systems": { total: 3, avg: 0.5 },
        "Victor_Engineers_ASAL": { total: 2, avg: 0.3 }
      }
    }
  };

  if (!kpiData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Calculate summary metrics
  const zeroAccidentSuppliers = kpiData.suppliers.filter(supplier => 
    kpiData.metrics.accidents[supplier]?.total === 0
  ).length;

  const avgDeliveryRate = kpiData.suppliers.reduce((sum, supplier) => 
    sum + (kpiData.metrics.okDelivery[supplier]?.avg || 0), 0
  ) / kpiData.suppliers.length;

  const totalProductionLoss = kpiData.suppliers.reduce((sum, supplier) => 
    sum + (kpiData.metrics.productionLoss[supplier]?.total || 0), 0
  );

  const totalTrips = kpiData.suppliers.reduce((sum, supplier) => 
    sum + (kpiData.metrics.trips[supplier]?.total || 0), 0
  );

  const getPerformanceColor = (value, type) => {
    if (type === 'accidents') {
      return value === 0 ? '#10a37f' : '#ef4444';
    }
    if (type === 'delivery') {
      if (value >= 90) return '#10a37f';
      if (value >= 80) return '#f59e0b';
      return '#ef4444';
    }
    if (type === 'loss') {
      if (value <= 30) return '#10a37f';
      if (value <= 60) return '#f59e0b';
      return '#ef4444';
    }
    return '#6b7280';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
        📊 KPI Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #10a37f 0%, #34d399 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <SecurityIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {zeroAccidentSuppliers}
              </Typography>
              <Typography variant="body2">
                Zero Accident Suppliers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <LocalShippingIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {avgDeliveryRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2">
                Average Delivery Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <EngineeringIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {totalProductionLoss}
              </Typography>
              <Typography variant="body2">
                Total Production Loss (hrs)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <SpeedIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {totalTrips}
              </Typography>
              <Typography variant="body2">
                Total Shipment Trips
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Visualizations */}
      <Grid container spacing={3}>
        {/* Safety Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="🛡️ Safety Performance"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<SecurityIcon sx={{ color: '#10a37f' }} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Zero Accidents: {zeroAccidentSuppliers} suppliers
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Safety Issues: {kpiData.suppliers.length - zeroAccidentSuppliers} suppliers
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kpiData.suppliers.map((supplier) => (
                  <Chip
                    key={supplier}
                    label={supplier}
                    size="small"
                    sx={{
                      backgroundColor: kpiData.metrics.accidents[supplier]?.total === 0 
                        ? '#10a37f' 
                        : '#ef4444',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="📦 Delivery Performance"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<LocalShippingIcon sx={{ color: '#3b82f6' }} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Average: {avgDeliveryRate.toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={avgDeliveryRate} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPerformanceColor(avgDeliveryRate, 'delivery')
                    }
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kpiData.suppliers.map((supplier) => (
                  <Chip
                    key={supplier}
                    label={`${supplier}: ${kpiData.metrics.okDelivery[supplier]?.avg.toFixed(1)}%`}
                    size="small"
                    sx={{
                      backgroundColor: getPerformanceColor(kpiData.metrics.okDelivery[supplier]?.avg || 0, 'delivery'),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Production Loss */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="⚙️ Production Loss Analysis"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<EngineeringIcon sx={{ color: '#f59e0b' }} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Loss: {totalProductionLoss} hours
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Average per supplier: {(totalProductionLoss / kpiData.suppliers.length).toFixed(1)} hours
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kpiData.suppliers.map((supplier) => (
                  <Chip
                    key={supplier}
                    label={`${supplier}: ${kpiData.metrics.productionLoss[supplier]?.total || 0}h`}
                    size="small"
                    sx={{
                      backgroundColor: getPerformanceColor(kpiData.metrics.productionLoss[supplier]?.total || 0, 'loss'),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Shipment Trips */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="🚚 Shipment Trips Overview"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<SpeedIcon sx={{ color: '#8b5cf6' }} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Trips: {totalTrips}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Average per supplier: {(totalTrips / kpiData.suppliers.length).toFixed(1)} trips
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kpiData.suppliers.map((supplier) => (
                  <Chip
                    key={supplier}
                    label={`${supplier}: ${kpiData.metrics.trips[supplier]?.total || 0}`}
                    size="small"
                    sx={{
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Machine Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="🔧 Machine Performance"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<EngineeringIcon sx={{ color: '#6b7280' }} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Total Downtime: {kpiData.suppliers.reduce((sum, supplier) => 
                    sum + (kpiData.metrics.machineDowntime[supplier]?.total || 0), 0
                  )} hours
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Breakdowns: {kpiData.suppliers.reduce((sum, supplier) => 
                    sum + (kpiData.metrics.machineBreakdowns[supplier]?.total || 0), 0
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kpiData.suppliers.map((supplier) => (
                  <Chip
                    key={supplier}
                    label={`${supplier}: ${kpiData.metrics.machineDowntime[supplier]?.total || 0}h downtime`}
                    size="small"
                    sx={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle TAT */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="⏱️ Vehicle Turnaround Time"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<SpeedIcon sx={{ color: '#059669' }} />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Average TAT: {(kpiData.suppliers.reduce((sum, supplier) => 
                    sum + (kpiData.metrics.vehicleTAT[supplier]?.avg || 0), 0
                  ) / kpiData.suppliers.length).toFixed(1)} days
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Target: &lt; 3 days
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kpiData.suppliers.map((supplier) => (
                  <Chip
                    key={supplier}
                    label={`${supplier}: ${kpiData.metrics.vehicleTAT[supplier]?.avg.toFixed(1)}d`}
                    size="small"
                    sx={{
                      backgroundColor: (kpiData.metrics.vehicleTAT[supplier]?.avg || 0) < 3 
                        ? '#10a37f' 
                        : '#ef4444',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 