import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { Bar, Line, Pie } from 'react-chartjs-2';
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

const Dashboard = () => {
  // Mock data for charts
  const revenueData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        label: 'Выручка',
        data: [12000, 19000, 15000, 18000, 22000, 28000, 25000],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const ordersData = {
    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    datasets: [
      {
        label: 'Заказы',
        data: [15, 23, 18, 22, 27, 35, 31],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const popularProductsData = {
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
    { title: 'Заказов сегодня', value: 150, icon: '📦' },
    { title: 'Выручка сегодня', value: '75,000₽', icon: '💰' },
    { title: 'Новые клиенты', value: 12, icon: '👥' },
    { title: 'Наполнение', value: '45%', icon: '📊' },
  ];

  const recentOrders = [
    { id: '001234', customer: 'Иван И.', amount: '1,250₽', type: 'Доставка' },
    { id: '001233', customer: 'Анна С.', amount: '850₽', type: 'Самовывоз' },
    { id: '001232', customer: 'Петр К.', amount: '2,100₽', type: 'Доставка' },
  ];

  const popularProducts = [
    { name: 'Пицца Маргарита', sales: 45 },
    { name: 'Бургер Чизбургер', sales: 38 },
    { name: 'Кофе Латте', sales: 52 },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h2">{stat.icon}</Typography>
              <Typography variant="h6">{stat.title}</Typography>
              <Typography variant="h4" color="primary">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Выручка за неделю
            </Typography>
            <Bar data={revenueData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Заказы за неделю
            </Typography>
            <Line data={ordersData} />
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Orders and Popular Products */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Последние заказы
            </Typography>
            <Box>
              {recentOrders.map((order, index) => (
                <Box key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography>
                    #{order.id} • {order.amount} • {order.type}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Популярные товары
            </Typography>
            <Box>
              {popularProducts.map((product, index) => (
                <Box key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography>
                    {index + 1}. {product.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Создать заказ</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Добавить товар</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Создать рассылку</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;