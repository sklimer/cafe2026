import React, { useState } from 'react';
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

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [currentTab, setCurrentTab] = useState(0);

  // Mock data for charts
  const revenueData = {
    labels: timeRange === 'week' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Выручка',
        data: timeRange === 'week' ? [12000, 19000, 15000, 18000, 22000, 28000, 25000] : [120000, 150000, 180000, 140000, 190000, 210000],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const ordersData = {
    labels: timeRange === 'week' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    datasets: [
      {
        label: 'Заказы',
        data: timeRange === 'week' ? [15, 23, 18, 22, 27, 35, 31] : [150, 180, 210, 170, 190, 220],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const topProductsData = {
    labels: ['Пицца Маргарита', 'Бургер', 'Кофе', 'Паста', 'Салат'],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 205, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const stats = [
    { title: 'Общая выручка', value: '1,250,000₽', change: '+12%' },
    { title: 'Всего заказов', value: '3,240', change: '+8%' },
    { title: 'Средний чек', value: '386₽', change: '+4%' },
    { title: 'Новые клиенты', value: '420', change: '+15%' },
  ];

  const topRestaurants = [
    { name: 'Пиццерия Веселая', revenue: 450000, orders: 850 },
    { name: 'Бургерная Быстрая', revenue: 320000, orders: 620 },
    { name: 'Суши-бар Япония', revenue: 280000, orders: 540 },
    { name: 'Кафе Уютное', revenue: 200000, orders: 410 },
  ];

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