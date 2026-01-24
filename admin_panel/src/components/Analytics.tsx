import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { analyticsAPI } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define interfaces for our data
interface Stat {
  title: string;
  value: string;
  change: string;
}

interface TopRestaurant {
  name: string;
  revenue: number;
  orders: number;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [currentTab, setCurrentTab] = useState(0);
  const [revenueData, setRevenueData] = useState<ChartData>({ labels: [], datasets: [] });
  const [ordersData, setOrdersData] = useState<ChartData>({ labels: [], datasets: [] });
  const [topProductsData, setTopProductsData] = useState<ChartData>({ labels: [], datasets: [] });
  const [stats, setStats] = useState<Stat[]>([]);
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Using API service to fetch real data
        const [statsRes, revenueRes, ordersRes, productsRes, restaurantsRes] = await Promise.allSettled([
          analyticsAPI.getStats({ period: timeRange }),
          analyticsAPI.getRevenueData({ period: timeRange }),
          analyticsAPI.getOrdersData({ period: timeRange }),
          analyticsAPI.getTopProducts({ period: timeRange }),
          analyticsAPI.getTopRestaurants({ period: timeRange })
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }

        if (revenueRes.status === 'fulfilled') {
          setRevenueData(revenueRes.value.data);
        }

        if (ordersRes.status === 'fulfilled') {
          setOrdersData(ordersRes.value.data);
        }

        if (productsRes.status === 'fulfilled') {
          setTopProductsData(productsRes.value.data);
        }

        if (restaurantsRes.status === 'fulfilled') {
          setTopRestaurants(restaurantsRes.value.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Аналитика и отчеты
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Обзор" />
            <Tab label="Продажи" />
            <Tab label="Клиенты" />
            <Tab label="Финансы" />
          </Tabs>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Период</InputLabel>
            <Select
              value={timeRange}
              label="Период"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="day">День</MenuItem>
              <MenuItem value="week">Неделя</MenuItem>
              <MenuItem value="month">Месяц</MenuItem>
              <MenuItem value="quarter">Квартал</MenuItem>
              <MenuItem value="year">Год</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="success.main">
                  {stat.change} от предыдущего периода
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Выручка за {timeRange === 'week' ? 'неделю' : 'месяц'}
            </Typography>
            <Bar data={revenueData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Заказы за {timeRange === 'week' ? 'неделю' : 'месяц'}
            </Typography>
            <Line data={ordersData} />
          </Paper>
        </Grid>
      </Grid>

      {/* Top Products and Restaurants */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Популярные товары
            </Typography>
            <Pie data={topProductsData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Топ ресторанов
            </Typography>
            <Box>
              {topRestaurants.map((restaurant, index) => (
                <Box key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle1">{restaurant.name}</Typography>
                  <Typography variant="body2">Выручка: {restaurant.revenue}₽</Typography>
                  <Typography variant="body2">Заказов: {restaurant.orders}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Export Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Экспорт отчета
        </button>
      </Box>
    </Box>
  );
};

export default Analytics;