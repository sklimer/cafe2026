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
  IconButton,
  Checkbox,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import { ordersAPI } from '../services/api';

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  amount: number;
  status: 'new' | 'confirmed' | 'preparing' | 'on_way' | 'delivered' | 'cancelled';
  date: string;
  type: 'delivery' | 'pickup';
  restaurant: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Using API service to fetch real data
        const response = await ordersAPI.getAll();
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const columns: GridColDef[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedOrders.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders([...selectedOrders, params.row.id]);
            } else {
              setSelectedOrders(selectedOrders.filter(id => id !== params.row.id));
            }
          }}
        />
      )
    },
    { field: 'orderNumber', headerName: 'Номер', width: 150 },
    { field: 'customer', headerName: 'Клиент', width: 150 },
    { field: 'amount', headerName: 'Сумма', width: 100, valueFormatter: (params) => `${params.value}₽` },
    {
      field: 'status',
      headerName: 'Статус',
      width: 120,
      renderCell: (params) => {
        const status = params.value as string;
        let color = 'default';
        switch (status) {
          case 'new':
            color = 'info';
            break;
          case 'confirmed':
            color = 'primary';
            break;
          case 'preparing':
            color = 'secondary';
            break;
          case 'on_way':
            color = 'warning';
            break;
          case 'delivered':
            color = 'success';
            break;
          case 'cancelled':
            color = 'error';
            break;
        }

        return <Chip label={status} color={color as any} />;
      }
    },
    { field: 'date', headerName: 'Дата', width: 150 },
    {
      field: 'type',
      headerName: 'Тип',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value === 'delivery' ? 'Доставка' : 'Самовывоз'}
          color={params.value === 'delivery' ? 'primary' : 'default'}
        />
      )
    },
    { field: 'restaurant', headerName: 'Ресторан', width: 150 },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => console.log('Edit', params.row.id)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => console.log('Print', params.row.id)}>
            <PrintIcon />
          </IconButton>
        </>
      )
    },
  ];

  const handleConfirmOrders = () => {
    console.log('Confirm orders:', selectedOrders);
    setSelectedOrders([]);
  };

  const handleCancelOrders = () => {
    console.log('Cancel orders:', selectedOrders);
    setSelectedOrders([]);
  };

  const handleExport = () => {
    console.log('Export orders');
  };

  const handleAddOrder = () => {
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
        Управление заказами
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Поиск по номеру, клиенту, телефону..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Все (1,234)" />
            <Tab label="Ожидают" />
            <Tab label="Готовятся" />
            <Tab label="Доставляются" />
            <Tab label="Завершены" />
          </Tabs>
          <Button variant="contained" onClick={handleAddOrder}>
            Создать заказ
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={orders}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Typography>
          Выделено: {selectedOrders.length} заказов
        </Typography>
        <Box>
          <Button variant="contained" color="primary" onClick={handleConfirmOrders} disabled={selectedOrders.length === 0}>
            Подтвердить
          </Button>
          <Button variant="outlined" color="error" onClick={handleCancelOrders} sx={{ ml: 1 }} disabled={selectedOrders.length === 0}>
            Отменить
          </Button>
          <Button variant="outlined" onClick={handleExport} sx={{ ml: 1 }}>
            Экспорт
          </Button>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Создать заказ</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Номер заказа"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Клиент"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Сумма"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Статус</InputLabel>
              <Select label="Статус">
                <MenuItem value="new">Новый</MenuItem>
                <MenuItem value="confirmed">Подтвержден</MenuItem>
                <MenuItem value="preparing">Готовится</MenuItem>
                <MenuItem value="on_way">Доставляется</MenuItem>
                <MenuItem value="delivered">Доставлен</MenuItem>
                <MenuItem value="cancelled">Отменен</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Тип</InputLabel>
              <Select label="Тип">
                <MenuItem value="delivery">Доставка</MenuItem>
                <MenuItem value="pickup">Самовывоз</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Ресторан"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
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

export default Orders;