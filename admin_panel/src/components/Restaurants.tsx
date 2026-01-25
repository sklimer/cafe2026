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
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { restaurantsAPI } from '../services/api';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_url: string;
  contact_phone: string;
  is_active: boolean;
  verification_status: 'verified' | 'pending' | 'rejected';
  branches_count: number;
}

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    description: '',
    contact_phone: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Using API service to fetch real data
        const response = await restaurantsAPI.getAll();
        console.log('API Response:', response);

        // Исправлено: берем данные из results, а не из всего response.data
        if (response.data && response.data.results) {
          setRestaurants(response.data.results);
        } else {
          // Если API не использует пагинацию, то берем response.data напрямую
          setRestaurants(response.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Название', width: 200 },
    { field: 'slug', headerName: 'Slug', width: 150 },
    {
      field: 'is_active',
      headerName: 'Статус',
      width: 120,
      renderCell: (params) => {
        const isActive = params.value as boolean;
        const status = isActive ? 'active' : 'inactive';
        let color = 'default';
        if (isActive) color = 'success';
        else color = 'error';

        return <Chip label={status} color={color as any} />;
      }
    },
    {
      field: 'verification_status',
      headerName: 'Верификация',
      width: 150,
      renderCell: (params) => {
        const status = params.value as string;
        let color = 'default';
        if (status === 'verified') color = 'success';
        if (status === 'rejected') color = 'error';
        if (status === 'pending') color = 'warning';

        return <Chip label={status} color={color as any} />;
      }
    },
    { field: 'branches_count', headerName: 'Филиалы', width: 100 },
    { field: 'contact_phone', headerName: 'Телефон', width: 150 },
  ];

  const handleAddRestaurant = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      // Convert status to is_active and verification_status
      const restaurantData = {
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: formData.description || '',
        contact_phone: formData.contact_phone || '',
        is_active: formData.status === 'active',
        verification_status: formData.status === 'pending' ? 'pending' : 'verified',
      };

      await restaurantsAPI.create(restaurantData);

      // Refresh the list
      const response = await restaurantsAPI.getAll();

      // Исправлено: берем данные из results, а не из всего response.data
      if (response.data && response.data.results) {
        setRestaurants(response.data.results);
      } else {
        setRestaurants(response.data);
      }

      setOpenDialog(false);
      setFormData({
        name: '',
        city: '',
        description: '',
        contact_phone: '',
        status: 'active' as 'active' | 'inactive' | 'pending',
      });
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      let errorMessage = 'Ошибка при создании ресторана';
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          errorMessage += ': ';
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              errorMessage += `${key}: ${errorData[key].join(', ')}. `;
            } else {
              errorMessage += `${key}: ${errorData[key]}. `;
            }
          });
        }
      }
      alert(errorMessage);
    }
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Загрузка...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={restaurants}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            checkboxSelection
            loading={loading}
          />
        )}
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
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Город"
              fullWidth
              variant="outlined"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Описание"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Контактный телефон"
              fullWidth
              variant="outlined"
              value={formData.contact_phone}
              onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                label="Статус"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'pending'})}
              >
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