import React, { useState } from 'react';
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
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';

interface User {
  id: number;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  registrationDate: string;
  orderCount: number;
  totalSpent: number;
  bonusBalance: number;
  isActive: boolean;
  isBlocked: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      telegramId: '123456789',
      username: 'ivanov',
      firstName: 'Иван',
      lastName: 'Иванов',
      phone: '+7 (999) 123-45-67',
      email: 'ivanov@example.com',
      registrationDate: '2023-05-15',
      orderCount: 12,
      totalSpent: 25000,
      bonusBalance: 150,
      isActive: true,
      isBlocked: false
    },
    {
      id: 2,
      telegramId: '987654321',
      username: 'smirnova',
      firstName: 'Анна',
      lastName: 'Смирнова',
      phone: '+7 (999) 987-65-43',
      email: 'smirnova@example.com',
      registrationDate: '2023-06-20',
      orderCount: 8,
      totalSpent: 18000,
      bonusBalance: 80,
      isActive: true,
      isBlocked: false
    },
    {
      id: 3,
      telegramId: '555666777',
      username: 'petrov',
      firstName: 'Петр',
      lastName: 'Петров',
      phone: '+7 (999) 555-66-77',
      email: 'petrov@example.com',
      registrationDate: '2023-07-10',
      orderCount: 5,
      totalSpent: 9500,
      bonusBalance: 50,
      isActive: true,
      isBlocked: false
    },
    {
      id: 4,
      telegramId: '111222333',
      username: 'kozlova',
      firstName: 'Мария',
      lastName: 'Козлова',
      phone: '+7 (999) 111-22-33',
      email: 'kozlova@example.com',
      registrationDate: '2023-08-05',
      orderCount: 15,
      totalSpent: 32000,
      bonusBalance: 200,
      isActive: false,
      isBlocked: false
    },
    {
      id: 5,
      telegramId: '444555666',
      username: 'volkov',
      firstName: 'Алексей',
      lastName: 'Волков',
      phone: '+7 (999) 444-55-66',
      email: 'volkov@example.com',
      registrationDate: '2023-09-12',
      orderCount: 3,
      totalSpent: 6500,
      bonusBalance: 30,
      isActive: true,
      isBlocked: true
    },
  ]);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const columns: GridColDef[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedUsers.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers([...selectedUsers, params.row.id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== params.row.id));
            }
          }}
        />
      )
    },
    {
      field: 'avatar',
      headerName: 'Аватар',
      width: 60,
      renderCell: () => (
        <Avatar>
          <PersonIcon />
        </Avatar>
      )
    },
    { field: 'firstName', headerName: 'Имя', width: 150 },
    { field: 'lastName', headerName: 'Фамилия', width: 150 },
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'phone', headerName: 'Телефон', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'registrationDate', headerName: 'Регистрация', width: 120 },
    { field: 'orderCount', headerName: 'Заказы', width: 100 },
    { field: 'totalSpent', headerName: 'Потрачено', width: 120, valueFormatter: (params) => `${params.value}₽` },
    { field: 'bonusBalance', headerName: 'Бонусы', width: 120, valueFormatter: (params) => `${params.value} баллов` },
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
      field: 'isBlocked',
      headerName: 'Заблокирован',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Да' : 'Нет'} 
          color={params.value ? 'error' : 'default'} 
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
          <IconButton size="small" onClick={() => console.log('Send message', params.row.id)}>
            <SendIcon />
          </IconButton>
        </>
      )
    },
  ];

  const handleSendMessage = () => {
    console.log('Send message to users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleBlockUsers = () => {
    console.log('Block users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleUnblockUsers = () => {
    console.log('Unblock users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleActivateUsers = () => {
    console.log('Activate users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleDeactivateUsers = () => {
    console.log('Deactivate users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleAddUser = () => {
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
        Управление клиентами
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Поиск по имени, телефону, email..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Все" />
            <Tab label="Активные" />
            <Tab label="Заблокированные" />
            <Tab label="Новые" />
          </Tabs>
          <Button variant="contained" onClick={handleAddUser}>
            Добавить клиента
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Typography>
          Выделено: {selectedUsers.length} пользователей
        </Typography>
        <Box>
          <Button variant="outlined" startIcon={<SendIcon />} onClick={handleSendMessage} disabled={selectedUsers.length === 0}>
            Отправить сообщение
          </Button>
          <Button variant="outlined" color="error" onClick={handleBlockUsers} sx={{ ml: 1 }} disabled={selectedUsers.length === 0}>
            Заблокировать
          </Button>
          <Button variant="outlined" color="success" onClick={handleUnblockUsers} sx={{ ml: 1 }} disabled={selectedUsers.length === 0}>
            Разблокировать
          </Button>
          <Button variant="outlined" onClick={handleActivateUsers} sx={{ ml: 1 }} disabled={selectedUsers.length === 0}>
            Активировать
          </Button>
          <Button variant="outlined" onClick={handleDeactivateUsers} sx={{ ml: 1 }} disabled={selectedUsers.length === 0}>
            Деактивировать
          </Button>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить клиента</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Telegram ID"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Имя"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Фамилия"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Телефон"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Email"
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

export default Users;