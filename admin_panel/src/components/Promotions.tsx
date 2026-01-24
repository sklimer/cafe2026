import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Promotion {
  id: number;
  name: string;
  type: 'discount' | 'gift' | 'combo' | 'free_delivery';
  discountType: 'fixed' | 'percent';
  discountValue: number;
  startDate: string;
  endDate: string;
  minAmount?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
}

const Promotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 1,
      name: 'Скидка 20% на первый заказ',
      type: 'discount',
      discountType: 'percent',
      discountValue: 20,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      minAmount: 500,
      maxUses: 1000,
      usedCount: 450,
      isActive: true
    },
    {
      id: 2,
      name: 'Бесплатная доставка',
      type: 'free_delivery',
      discountType: 'fixed',
      discountValue: 0,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      minAmount: 1000,
      usedCount: 120,
      isActive: true
    },
    {
      id: 3,
      name: 'Комбо-предложение',
      type: 'combo',
      discountType: 'fixed',
      discountValue: 150,
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      usedCount: 30,
      isActive: false
    },
  ]);

  const [selectedPromotions, setSelectedPromotions] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const promotionTypes = [
    { value: 'discount', label: 'Скидка' },
    { value: 'gift', label: 'Подарок' },
    { value: 'combo', label: 'Комбо' },
    { value: 'free_delivery', label: 'Бесплатная доставка' },
  ];

  const columns: GridColDef[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedPromotions.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedPromotions([...selectedPromotions, params.row.id]);
            } else {
              setSelectedPromotions(selectedPromotions.filter(id => id !== params.row.id));
            }
          }}
        />
      )
    },
    { field: 'name', headerName: 'Название', width: 200 },
    {
      field: 'type',
      headerName: 'Тип',
      width: 150,
      renderCell: (params) => {
        const type = promotionTypes.find(t => t.value === params.value);
        return <Chip label={type?.label || params.value} size="small" />;
      }
    },
    {
      field: 'discountValue',
      headerName: 'Скидка',
      width: 120,
      renderCell: (params) => {
        const row = params.row as Promotion;
        return (
          <span>
            {row.discountType === 'percent' ? `${row.discountValue}%` : `${row.discountValue}₽`}
          </span>
        );
      }
    },
    { field: 'startDate', headerName: 'Начало', width: 120 },
    { field: 'endDate', headerName: 'Конец', width: 120 },
    { field: 'usedCount', headerName: 'Использовано', width: 130 },
    {
      field: 'isActive',
      headerName: 'Активен',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Да' : 'Нет'} 
          color={params.value ? 'success' : 'default'} 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => console.log('Edit', params.row.id)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => console.log('Delete', params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      )
    },
  ];

  const handleAddPromotion = () => {
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
        Управление акциями и промокодами
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Поиск по названию акции"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Акции" />
            <Tab label="Промокоды" />
            <Tab label="Бонусная система" />
            <Tab label="Рассылки" />
          </Tabs>
          <Button variant="contained" onClick={handleAddPromotion}>
            <AddIcon sx={{ mr: 1 }} /> Создать
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={promotions}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Создать акцию</DialogTitle>
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Тип акции</InputLabel>
              <Select label="Тип акции">
                {promotionTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Тип скидки</FormLabel>
              <RadioGroup defaultValue="percent" sx={{ flexDirection: 'row' }}>
                <FormControlLabel value="percent" control={<Radio />} label="Процент" />
                <FormControlLabel value="fixed" control={<Radio />} label="Фиксированная" />
              </RadioGroup>
            </FormControl>
            
            <TextField
              margin="dense"
              label="Значение скидки"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Дата начала"
              fullWidth
              variant="outlined"
              type="date"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Дата окончания"
              fullWidth
              variant="outlined"
              type="date"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Минимальная сумма заказа"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Максимальное количество использований"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={<Switch />}
              label="Активен"
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

export default Promotions;