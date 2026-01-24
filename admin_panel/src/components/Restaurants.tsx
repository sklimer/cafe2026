import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import axios from 'axios';

interface Restaurant {
  id: number;
  name: string;
  city: string;
  status: 'active' | 'inactive' | 'pending';
  branchCount: number;
  orderCount: number;
  totalRevenue: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    fetchRestaurants();
  }, [currentTab]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      // In a real application, this would be an API call
      // const response = await axios.get(`/api/restaurants?status=${getStatusFilter()}`);
      // setRestaurants(response.data);
      
      // For now, we'll simulate loading real data
      setTimeout(() => {
        setRestaurants([
          {
            id: 1,
            name: 'Пиццерия Веселая',
            city: 'Москва',
            status: 'active',
            branchCount: 3,
            orderCount: 1250,
            totalRevenue: 2500000,
            verificationStatus: 'verified'
          },
          {
            id: 2,
            name: 'Бургерная Быстрая',
            city: 'Санкт-Петербург',
            status: 'active',
            branchCount: 2,
            orderCount: 850,
            totalRevenue: 1800000,
            verificationStatus: 'verified'
          },
          {
            id: 3,
            name: 'Суши-бар Япония',
            city: 'Новосибирск',
            status: 'pending',
            branchCount: 1,
            orderCount: 420,
            totalRevenue: 950000,
            verificationStatus: 'pending'
          },
          {
            id: 4,
            name: 'Кафе Уютное',
            city: 'Екатеринбург',
            status: 'inactive',
            branchCount: 1,
            orderCount: 310,
            totalRevenue: 620000,
            verificationStatus: 'verified'
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setLoading(false);
    }
  };

  const getStatusFilter = () => {
    switch(currentTab) {
      case 1: return 'active';
      case 2: return 'inactive';
      case 3: return 'pending';
      default: return 'all';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Название', width: 200 },
    { field: 'city', headerName: 'Город', width: 150 },
    {
      field: 'status',
      headerName: 'Статус',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        let color = 'default';
        if (status === 'active') color = 'success';
        if (status === 'inactive') color = 'error';
        if (status === 'pending') color = 'warning';
        
        return <Chip label={status} color={color as any} />;
      }
    },
    { field: 'branchCount', headerName: 'Филиалы', width: 100 },
    { field: 'orderCount', headerName: 'Заказы', width: 100 },
    { field: 'totalRevenue', headerName: 'Выручка', width: 150 },
    {
      field: 'verificationStatus',
      headerName: 'Верификация',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        let color = 'default';
        if (status === 'verified') color = 'success';
        if (status === 'rejected') color = 'error';
        
        return <Chip label={status} color={color as any} />;
      }
    },
  ];

  const handleAddRestaurant = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = () => {
    // Handle form submission
    setOpenDialog(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Управление ресторанами
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Поиск по названию или городу"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Все" />
            <Tab label="Активные" />
            <Tab label="Неактивные" />
            <Tab label="На верификации" />
          </Tabs>
          <Button variant="contained" onClick={handleAddRestaurant}>
            Добавить ресторан
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={restaurants}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          checkboxSelection
          loading={loading}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить ресторан</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Название"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Город"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Описание"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Статус</InputLabel>
              <Select label="Статус">
                <MenuItem value="active">Активный</MenuItem>
                <MenuItem value="inactive">Неактивный</MenuItem>
                <MenuItem value="pending">Ожидает</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Restaurants;