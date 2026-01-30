import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { restaurantsAPI } from '../services/api';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  contact_phone: string;
  is_active: boolean;
  verification_status: 'verified' | 'pending' | 'rejected';
}

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    contact_phone: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Используем useCallback для стабильной функции
  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);

      // Создаем параметры запроса
      const params: any = {
        page: page + 1,
        page_size: rowsPerPage,
      };

      // Фильтрация по статусу - упрощаем логику
      if (currentTab === 1) { // Активные
        params.is_active = true;
        params.verification_status = 'verified'; // Добавляем фильтр верификации
      } else if (currentTab === 2) { // Неактивные
        params.is_active = false;
      } else if (currentTab === 3) { // На верификации
        params.verification_status = 'pending';
        params.is_active = true; // Может быть активным, но на верификации
      }

      console.log('Fetching restaurants with params:', params);
      const response = await restaurantsAPI.getAll(params);
      console.log('API Response:', response);

      if (response.data) {
        // Проверяем формат ответа
        if (response.data.results) {
          setRestaurants(response.data.results);
          setTotalCount(response.data.count || 0);
        } else if (Array.isArray(response.data)) {
          // Если API возвращает просто массив
          setRestaurants(response.data);
          setTotalCount(response.data.length);
        } else {
          // Если API возвращает объект с данными
          setRestaurants([response.data]);
          setTotalCount(1);
        }
      } else {
        setRestaurants([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, currentTab]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddRestaurant = () => {
    setOpenDialog(true);
    setErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      address: '',
      description: '',
      contact_phone: '',
      status: 'active',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Адрес обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const restaurantData = {
        name: formData.name,
        address: formData.address,
        description: formData.description || '',
        contact_phone: formData.contact_phone || '',
        is_active: formData.status === 'active',
        verification_status: formData.status === 'pending' ? 'pending' : 'verified',
      };

      console.log('Sending data:', restaurantData);
      await restaurantsAPI.create(restaurantData);

      // Обновляем список и сбрасываем страницу
      fetchRestaurants();
      setPage(0);
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      let errorMessage = 'Ошибка при создании ресторана';

      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (typeof errorData === 'object') {
          const newErrors: Record<string, string> = {};

          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              newErrors[key] = errorData[key].join(', ');
            } else {
              newErrors[key] = errorData[key];
            }
          });

          setErrors(newErrors);
          return;
        }

        errorMessage += `: ${errorData}`;
      }

      alert(errorMessage);
    }
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Активен' : 'Неактивен';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Управление ресторанами
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => {
            setCurrentTab(newValue);
            setPage(0);
          }}>
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

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Название</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Адрес</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Контактный номер</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Описание</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Статус</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography>Загрузка...</Typography>
                  </TableCell>
                </TableRow>
              ) : restaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography>Нет данных</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                restaurants.map((restaurant) => (
                  <TableRow key={restaurant.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{restaurant.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxHeight: 100, overflow: 'auto', py: 1 }}>
                        {restaurant.address || 'Не указан'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {restaurant.contact_phone || 'Не указан'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxHeight: 100, overflow: 'auto', py: 1 }}>
                        {restaurant.description ? (
                          restaurant.description.length > 100 ? (
                            <>
                              {restaurant.description.substring(0, 100)}...
                              <Tooltip title={restaurant.description}>
                                <Button size="small" sx={{ ml: 1 }}>Подробнее</Button>
                              </Tooltip>
                            </>
                          ) : (
                            restaurant.description
                          )
                        ) : (
                          'Нет описания'
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(restaurant.is_active)}
                        color={getStatusColor(restaurant.is_active)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Просмотреть">
                          <IconButton size="small" color="primary">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" color="secondary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && restaurants.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
          />
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить ресторан</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Название *"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ''});
              }}
              error={!!errors.name}
              helperText={errors.name}
            />

            <TextField
              label="Адрес *"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.address}
              onChange={(e) => {
                setFormData({...formData, address: e.target.value});
                if (errors.address) setErrors({...errors, address: ''});
              }}
              placeholder="Полный адрес ресторана"
              error={!!errors.address}
              helperText={errors.address}
            />

            <TextField
              label="Описание"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Описание ресторана"
            />

            <TextField
              label="Контактный телефон"
              fullWidth
              variant="outlined"
              value={formData.contact_phone}
              onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
              placeholder="+7 (XXX) XXX-XX-XX"
            />

            <FormControl fullWidth>
              <InputLabel>Статус *</InputLabel>
              <Select
                label="Статус *"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'pending'})}
              >
                <MenuItem value="active">Активный</MenuItem>
                <MenuItem value="inactive">Неактивный</MenuItem>
                <MenuItem value="pending">Ожидает верификации</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Restaurants;