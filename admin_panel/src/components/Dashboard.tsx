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

import { useEffect, useState } from 'react';
import axios from 'axios';
import { dashboardAPI } from '../services/api';

// Define interfaces for our data
interface Stat {
  title: string;
  value: string | number;
  icon: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: string;
  type: string;
}

interface PopularProduct {
  name: string;
  sales: number;
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

const Dashboard = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData>({ labels: [], datasets: [] });
  const [ordersData, setOrdersData] = useState<ChartData>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Using API service to fetch real data
        const [statsRes, ordersRes, productsRes] = await Promise.allSettled([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentOrders(),
          dashboardAPI.getPopularProducts()
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }

        if (ordersRes.status === 'fulfilled') {
          setRecentOrders(ordersRes.value.data);
        }

        if (productsRes.status === 'fulfilled') {
          setPopularProducts(productsRes.value.data);
        }

        // For chart data, we would normally fetch from the API
        // For now, we'll use placeholder data until API is ready
        const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        setRevenueData({
          labels: labels,
          datasets: [{
            label: 'Выручка',
            data: [12000, 19000, 15000, 18000, 22000, 28000, 25000],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }]
        });

        setOrdersData({
          labels: labels,
          datasets: [{
            label: 'Заказы',
            data: [15, 23, 18, 22, 27, 35, 31],
            fill: false,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          }]
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
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
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, index) => (
                      <Box key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                        <Typography>
                          #{order.id} • {order.amount} • {order.type}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography>Нет данных</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Популярные товары
                </Typography>
                <Box>
                  {popularProducts.length > 0 ? (
                    popularProducts.map((product, index) => (
                      <Box key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                        <Typography>
                          {index + 1}. {product.name}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography>Нет данных</Typography>
                  )}
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
        </>
      )}
    </Box>
  );
};

export default Dashboard;