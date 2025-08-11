/**
 * Supplier Performance Dashboard Charts
 * Uses server /dashboard analytics to render KPIs and comparisons
 * Styling/theme aligned with other dashboards (cards, subtle radius, colors)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Alert, alpha, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import {
  Groups as SuppliersIcon,
  HealthAndSafety as SafetyIcon,
  LocalShipping as TripsIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  ScatterPlot as RadarIcon
} from '@mui/icons-material';

const colors = {
  primary: '#1e40af',
  secondary: '#059669',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  purple: '#7c3aed',
  gray: '#6b7280'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  }
};

const chartVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
  }
};

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }}>
    <Card sx={{
      height: 120,
      bgcolor: alpha(colors[color], 0.05),
      borderRadius: 2,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      borderLeft: `4px solid ${colors[color]}`,
      '&:hover': { bgcolor: alpha(colors[color], 0.08), boxShadow: `0 8px 32px ${alpha(colors[color], 0.12)}` }
    }}>
      <CardContent sx={{ height: '100%', p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          {React.cloneElement(icon, { sx: { fontSize: 20, color: colors[color], mr: 1.25 } })}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: colors[color], fontSize: '1.85rem', lineHeight: 1.2 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
);

const ChartCard = ({ title, icon, children, height = 400 }) => (
  <motion.div variants={chartVariants}>
    <Card sx={{
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': { borderColor: 'primary.main', boxShadow: (t) => `0 4px 20px ${alpha(t.palette.primary.main, 0.08)}` },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && React.cloneElement(icon, { sx: { fontSize: 20, color: colors.gray, mr: 1 } })}
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.125rem' }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ height }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentMonthIndex = new Date().getMonth();
const monthsUpToNow = months.slice(0, currentMonthIndex + 1);

const percent = (n) => `${(Number(n || 0)).toFixed(1)}%`;

const toSeriesFromMonthlyObj = (monthlyObj) => months.map(m => monthlyObj?.[m] ?? null);

const SupplierDashboardCharts = ({ data, showSupplierAnalysis = false }) => {
  // API returns { message, data, totalSuppliers, totalKPIs }
  const analytics = data?.data || data;
  const isLoading = !analytics || !analytics.summary || !analytics.timeSeries;

  const totalSuppliers = analytics?.metadata?.totalSuppliers ?? analytics?.summary?.totalSuppliers ?? 0;
  const safetyRate = analytics?.summary?.safety?.safetyRate ?? 0;
  const avgDelivery = analytics?.summary?.delivery?.averageDeliveryRate ?? 0;
  const totalTrips = analytics?.summary?.production?.totalTrips ?? 0;

  // Pre-compute series
  const qtyMonthly = toSeriesFromMonthlyObj(analytics?.timeSeries?.quantityShipped?.monthlyData || {}).slice(0, monthsUpToNow.length);
  const tripsMonthly = toSeriesFromMonthlyObj(analytics?.timeSeries?.trips?.monthlyData || {}).slice(0, monthsUpToNow.length);
  const partsPerTripMonthly = toSeriesFromMonthlyObj(analytics?.timeSeries?.partsPerTrip?.monthlyData || {}).slice(0, monthsUpToNow.length);
  const downtimeMonthly = toSeriesFromMonthlyObj(analytics?.timeSeries?.machineDowntimeHrs?.monthlyData || {}).slice(0, monthsUpToNow.length);

  // Rankings per supplier for bar/radar/table
  const rankings = analytics?.rankings || {};

  // Helper to build supplier bar data for a KPI from rankings (average)
  const buildSupplierBar = (kpiName, topN = 12) => {
    const rows = (rankings[kpiName] || []).slice(0, topN);
    return {
      labels: rows.map(r => r.supplier),
      values: rows.map(r => Number(r.average?.toFixed ? r.average.toFixed(2) : r.average) || 0)
    };
  };

  const qtyBySupplier = buildSupplierBar('quantityShipped');
  const partsPerTripBySupplier = buildSupplierBar('partsPerTrip');
  const tatBySupplier = buildSupplierBar('vehicleTAT');
  const downtimeBySupplier = buildSupplierBar('machineDowntimeHrs');
  // const accidentsBySupplier = buildSupplierBar('accidents');
  const okDeliveryBySupplier = buildSupplierBar('okDeliveryPercent');
  const breakdownsBySupplier = buildSupplierBar('machineBreakdowns');

  // Radar KPIs: normalize to 0-100 scale via simple min-max on available values
  const radarKpis = [
    { key: 'okDeliveryPercent', label: 'Delivery %', higherBetter: true },
    { key: 'partsPerTrip', label: 'Parts/Trip', higherBetter: true },
    { key: 'vehicleTAT', label: 'Vehicle TAT', higherBetter: false },
    { key: 'machineDowntimeHrs', label: 'Downtime', higherBetter: false },
    { key: 'accidents', label: 'Accidents', higherBetter: false },
  ];

  // Supplier Analysis state (replicates old client behavior)
  const allSuppliers = useMemo(() => {
    const set = new Set();
    Object.values(rankings || {}).forEach(list => (list || []).forEach(r => set.add(r.supplier)));
    return Array.from(set);
  }, [rankings]);

  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [comparisonMode, setComparisonMode] = useState('radar'); // 'radar' | 'bar' | 'trend'

  useEffect(() => {
    if (allSuppliers.length && selectedSuppliers.length === 0) {
      setSelectedSuppliers(allSuppliers.slice(0, 3));
    }
  }, [allSuppliers, selectedSuppliers.length]);

  const isAllSelected = selectedSuppliers.length === allSuppliers.length && allSuppliers.every(s => selectedSuppliers.includes(s));

  const handleSupplierSelection = (event) => {
    const value = event.target.value;
    if (value.includes('__ALL__')) {
      setSelectedSuppliers(allSuppliers);
    } else {
      setSelectedSuppliers(value);
    }
  };

  const dropdownValue = isAllSelected ? ['__ALL__'] : selectedSuppliers;

  const radarData = useMemo(() => {
    const supplierSet = new Set();
    radarKpis.forEach(k => (rankings[k.key] || []).forEach(r => supplierSet.add(r.supplier)));
    const defaultSuppliers = Array.from(supplierSet).slice(0, 5);
    const suppliers = (selectedSuppliers && selectedSuppliers.length > 0) ? selectedSuppliers.slice(0, 8) : defaultSuppliers;

    const indicator = radarKpis.map(k => ({ name: k.label, max: 100 }));

    const series = suppliers.map(supplier => {
      const raw = radarKpis.map(k => {
        const row = (rankings[k.key] || []).find(r => r.supplier === supplier);
        return row?.average ?? 0;
      });
      // normalize each KPI column independently
      const columns = radarKpis.map((k, idx) => ({
        kpi: k, values: (rankings[k.key] || []).map(r => r.average)
      }));
      const normalized = columns.map((col, idx) => {
        // Compute normalized value for the specific supplier's metric
        const vals = col.values;
        const higher = col.kpi.higherBetter;
        // Normalize entire column
        const nums = vals.filter(v => typeof v === 'number');
        const min = nums.length ? Math.min(...nums) : 0;
        const max = nums.length ? Math.max(...nums) : 1;
        const range = max - min || 1;
        const val = typeof raw[idx] === 'number' ? ((raw[idx] - min) / range) * 100 : 0;
        return higher ? val : 100 - val;
      });
      return { name: supplier, value: normalized };
    });

    return { indicator, series };
  }, [rankings, radarKpis, selectedSuppliers]);

  // Chart options
  const monthlyPerformanceOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#111827' } },
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderWidth: 0,
      textStyle: { color: '#f8fafc' }
    },
    legend: { data: ['Quantity Shipped', 'Trips'], top: 0, icon: 'circle', textStyle: { color: '#334155' } },
    grid: { left: 40, right: 20, bottom: 30, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthsUpToNow,
      boundaryGap: false,
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#e5e7eb' } }
    },
    series: [
      {
        name: 'Quantity Shipped',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: qtyMonthly,
        lineStyle: { width: 3, color: '#2563eb' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37,99,235,0.25)' },
            { offset: 1, color: 'rgba(37,99,235,0.02)' }
          ])
        },
        emphasis: { focus: 'series' }
      },
      {
        name: 'Trips',
        type: 'scatter',
        symbol: 'circle',
        symbolSize: 8,
        data: tripsMonthly,
        itemStyle: { color: '#14b8a6', shadowColor: 'rgba(20,184,166,0.3)', shadowBlur: 6 },
        emphasis: { scale: 1.2 }
      }
    ]
  };

  const downtimeTrendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderWidth: 0,
      textStyle: { color: '#f8fafc' }
    },
    grid: { left: 40, right: 20, bottom: 30, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthsUpToNow,
      boundaryGap: false,
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#e5e7eb' } }
    },
    series: [
      {
        name: 'Downtime (hrs)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: downtimeMonthly,
        lineStyle: { width: 3, color: '#f97316' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(249,115,22,0.45)' },
            { offset: 1, color: 'rgba(249,115,22,0.02)' }
          ])
        },
        itemStyle: { color: '#f97316' }
      }
    ]
  };

  const partsPerTripOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderWidth: 0,
      textStyle: { color: '#f8fafc' }
    },
    grid: { left: 40, right: 20, bottom: 30, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: monthsUpToNow,
      boundaryGap: false,
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#e5e7eb' } }
    },
    series: [
      {
        name: 'Parts/Trip',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: partsPerTripMonthly,
        lineStyle: { width: 3, color: '#f97316' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(249,115,22,0.25)' },
            { offset: 1, color: 'rgba(249,115,22,0.02)' }
          ])
        },
        itemStyle: { color: '#f97316' }
      }
    ]
  };

  const supplierEfficiencyOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: partsPerTripBySupplier.labels, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      { name: 'Parts/Trip', type: 'bar', data: partsPerTripBySupplier.values, itemStyle: { color: colors.primary } },
      { name: 'Vehicle TAT', type: 'bar', data: tatBySupplier.values, itemStyle: { color: colors.info } },
      { name: 'Downtime (hrs)', type: 'bar', data: downtimeBySupplier.values, itemStyle: { color: colors.warning } },
    ]
  };

  const deliveryPerformanceOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(17,24,39,0.9)',
      borderWidth: 0,
      textStyle: { color: '#f8fafc' }
    },
    grid: { left: 40, right: 20, bottom: 30, top: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: okDeliveryBySupplier.labels,
      axisLabel: { rotate: 30, color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisPointer: { type: 'shadow' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#e5e7eb' } }
    },
    series: [
      {
        name: 'OK Delivery %',
        type: 'bar',
        data: okDeliveryBySupplier.values,
        barWidth: 28,
        barCategoryGap: '20%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#06b6d4' },
            { offset: 1, color: '#67e8f9' }
          ]),
          borderRadius: [6, 6, 0, 0],
          shadowColor: 'rgba(2,6,23,0.08)',
          shadowBlur: 6
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(2,6,23,0.18)',
            shadowBlur: 10
          }
        }
      }
    ]
  };

  const kpiComposedOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: qtyBySupplier.labels, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      { name: 'Quantity', type: 'bar', data: qtyBySupplier.values, itemStyle: { color: colors.primary } },
      { name: 'Trips', type: 'bar', data: (buildSupplierBar('trips').values), itemStyle: { color: colors.info } },
      { name: 'Breakdowns', type: 'bar', data: breakdownsBySupplier.values, itemStyle: { color: colors.error } },
    ]
  };

  const radarOption = {
    tooltip: {},
    legend: { bottom: 0, data: radarData.series.map(s => s.name) },
    radar: { indicator: radarData.indicator },
    series: [{ type: 'radar', data: radarData.series }]
  };

  // KPI comparison (bar) across selected suppliers for a subset of KPIs
  const comparisonKpis = ['okDeliveryPercent', 'partsPerTrip', 'vehicleTAT', 'machineDowntimeHrs', 'accidents'];
  const kpiLabels = {
    okDeliveryPercent: 'Delivery %',
    partsPerTrip: 'Parts/Trip',
    vehicleTAT: 'Vehicle TAT',
    machineDowntimeHrs: 'Downtime (hrs)',
    accidents: 'Accidents'
  };

  const kpiComparisonOption = useMemo(() => {
    const suppliers = (selectedSuppliers && selectedSuppliers.length) ? selectedSuppliers : allSuppliers.slice(0, 5);
    const series = comparisonKpis.map((k, idx) => {
      const values = suppliers.map(supplier => {
        const row = (rankings[k] || []).find(r => r.supplier === supplier);
        // use average; for counts like accidents we used average in matrix. Keep consistent with rankings average
        return typeof row?.average === 'number' ? Number(row.average.toFixed ? row.average.toFixed(2) : row.average) : 0;
      });
      return { name: kpiLabels[k] || k, type: 'bar', data: values };
    });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: suppliers, axisLabel: { rotate: 20 } },
      yAxis: { type: 'value' },
      series
    };
  }, [selectedSuppliers, allSuppliers, rankings]);

  // Multi-supplier monthly trend comparison (Quantity Shipped)
  const supplierTrendOption = useMemo(() => {
    const suppliers = (selectedSuppliers && selectedSuppliers.length) ? selectedSuppliers.slice(0, 8) : allSuppliers.slice(0, 5);
    const series = suppliers.map((supplier) => {
      const row = (rankings['quantityShipped'] || []).find(r => r.supplier === supplier);
      const monthly = monthsUpToNow.map(m => row?.monthlyData?.[m] ?? null);
      return { name: supplier, type: 'line', smooth: true, data: monthly };
    });
    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: suppliers },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: monthsUpToNow },
      yAxis: { type: 'value' },
      series
    };
  }, [selectedSuppliers, allSuppliers, rankings]);

  // Supplier Performance Table rows
  const matrixRows = analytics?.performanceMatrix?.matrixData || [];

  if (isLoading) {
    return <Alert severity="info">Loading supplier dashboard...</Alert>;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Box sx={{ p: 2 }}>

        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Suppliers" value={totalSuppliers} icon={<SuppliersIcon />} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Safety Rate" value={percent(safetyRate)} icon={<SafetyIcon />} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Avg Delivery %" value={percent(avgDelivery)} icon={<AssessmentIcon />} color="secondary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Trips" value={totalTrips} icon={<TripsIcon />} color="info" />
          </Grid>
        </Grid>

        {/* Supplier Comparison Controls (only when analysis is enabled) */}
        {showSupplierAnalysis && (
          <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 220 }} size="small">
                  <InputLabel id="supplier-select-label">Select Suppliers</InputLabel>
                  <Select
                    labelId="supplier-select-label"
                    multiple
                    value={dropdownValue}
                    label="Select Suppliers"
                    onChange={handleSupplierSelection}
                    renderValue={(selected) => {
                      if (selected.includes('__ALL__')) return 'All Suppliers';
                      return selected.length ? `${selected.length} selected` : 'Select Suppliers';
                    }}
                  >
                    <MenuItem value="__ALL__">All Suppliers {isAllSelected ? '✓' : ''}</MenuItem>
                    {allSuppliers.map(s => (
                      <MenuItem key={s} value={s}>{s}{selectedSuppliers.includes(s) ? ' ✓' : ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSelectedSuppliers(isAllSelected ? [] : allSuppliers)}
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Button>

                <Box sx={{ ml: 'auto' }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="chart-type-label">Chart</InputLabel>
                    <Select
                      labelId="chart-type-label"
                      value={comparisonMode}
                      label="Chart"
                      onChange={(e) => setComparisonMode(e.target.value)}
                    >
                      <MenuItem value="radar">Radar</MenuItem>
                      <MenuItem value="bar">Bar</MenuItem>
                      <MenuItem value="trend">Trend</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Supplier Comparison Charts */}
        {showSupplierAnalysis && selectedSuppliers.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 1 }}>
            {comparisonMode === 'radar' && (
              <Grid item xs={12}>
                <ChartCard title="Multi-Dimensional Supplier Comparison (Radar)" icon={<RadarIcon />} height={420}>
                  <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
                </ChartCard>
              </Grid>
            )}
            {comparisonMode === 'bar' && (
              <Grid item xs={12}>
                <ChartCard title="KPI Performance Comparison" icon={<BarChartIcon />} height={420}>
                  <ReactECharts option={kpiComparisonOption} style={{ height: '100%', width: '100%' }} />
                </ChartCard>
              </Grid>
            )}
            {comparisonMode === 'trend' && (
              <Grid item xs={12}>
                <ChartCard title="Monthly Trend Comparison (Quantity Shipped)" icon={<LineChartIcon />} height={420}>
                  <ReactECharts option={supplierTrendOption} style={{ height: '100%', width: '100%' }} />
                </ChartCard>
              </Grid>
            )}
          </Grid>
        )}

        {/* Trends - hidden when supplier analysis is active */}
        {!showSupplierAnalysis && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <ChartCard title="Monthly Performance: Quantity vs Trips" icon={<LineChartIcon />} height={380}>
                <ReactECharts option={monthlyPerformanceOption} style={{ height: '100%', width: '100%' }} />
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard title="Machine Downtime Trend" icon={<LineChartIcon />} height={380}>
                <ReactECharts option={downtimeTrendOption} style={{ height: '100%', width: '100%' }} />
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard title="Parts per Trip (Trend)" icon={<LineChartIcon />} height={380}>
                <ReactECharts option={partsPerTripOption} style={{ height: '100%', width: '100%' }} />
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard title="Delivery Performance by Supplier" icon={<BarChartIcon />} height={380}>
                <ReactECharts option={deliveryPerformanceOption} style={{ height: '100%', width: '100%' }} />
              </ChartCard>
            </Grid>
          </Grid>
        )}

        {/* Matrix Table */}
        <Box sx={{ mt: 3 }}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Supplier Performance </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Supplier</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Accidents</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>OK Delivery %</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Trips</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Quantity</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Parts/Trip</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Vehicle TAT</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Downtime (hrs)</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Breakdowns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.supplier}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.accidents ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.okDeliveryPercent ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.trips ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.quantityShipped ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.partsPerTrip ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.vehicleTAT ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.machineDowntimeHrs ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{row.machineBreakdowns ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </motion.div>
  );
};

export default SupplierDashboardCharts;


