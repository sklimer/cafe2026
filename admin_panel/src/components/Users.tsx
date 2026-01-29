import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Tabs,
  Tab,
  IconButton,
  Checkbox,
  Avatar,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { usersAPI } from '../services/api';
import { useDebounce } from '@mui/material'; // Или useDebouncedCallback

interface User {
  id: number;
  telegram_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  registration_date: string;
  total_orders: number;
  total_spent: number;
  bonus_balance: number;
  is_active: boolean;
  is_blocked: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Используем useDebounce для задержки поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      };

      // Добавляем поисковый запрос
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      // Добавляем фильтр по вкладке
      const statusMap = ['all', 'active', 'blocked', 'new'];
      const status = statusMap[currentTab];
      if (status !== 'all') {
        params.status = status;
      }

      const response = await usersAPI.getAll(params);
      setUsers(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  }, [debouncedSearchQuery, currentTab, paginationModel]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

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
    { field: 'first_name', headerName: 'Имя', width: 150 },
    { field: 'last_name', headerName: 'Фамилия', width: 150 },
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'phone', headerName: 'Телефон', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'registration_date',
      headerName: 'Регистрация',
      width: 120,
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString();
      }
    },
    {
      field: 'total_orders',
      headerName: 'Заказы',
      width: 100,
      valueFormatter: (params) => params.value || 0
    },
    {
      field: 'total_spent',
      headerName: 'Потрачено',
      width: 120,
      valueFormatter: (params) => `${parseFloat(params.value) || 0}₽`
    },
    {
      field: 'bonus_balance',
      headerName: 'Бонусы',
      width: 120,
      valueFormatter: (params) => `${parseFloat(params.value) || 0} баллов`
    },
    {
      field: 'is_active',
      headerName: 'Активен',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Да' : 'Нет'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'is_blocked',
      headerName: 'Заблокирован',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Да' : 'Нет'}
          color={params.value ? 'error' : 'default'}
          size="small"
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

  const handleSendMessage = async () => {
    console.log('Send message to users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleBlockUsers = async () => {
    try {
      await usersAPI.bulkAction(selectedUsers, 'block');
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error blocking users:', error);
    }
  };

  const handleUnblockUsers = async () => {
    try {
      await usersAPI.bulkAction(selectedUsers, 'unblock');
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error unblocking users:', error);
    }
  };

  const handleActivateUsers = async () => {
    try {
      await usersAPI.bulkAction(selectedUsers, 'activate');
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error activating users:', error);
    }
  };

  const handleDeactivateUsers = async () => {
    try {
      await usersAPI.bulkAction(selectedUsers, 'deactivate');
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error deactivating users:', error);
    }
  };

  const handleAddUser = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      // Handle form submission
      setOpenDialog(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleRowSelection = (rowSelectionModel: GridRowSelectionModel) => {
    setSelectedUsers(rowSelectionModel as number[]);
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={(e) => handleSearch(e.target.value)}
          value={searchQuery}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={users}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            rowCount={users.length}
            loading={loading}
            checkboxSelection
            onRowSelectionModelChange={handleRowSelection}
            rowSelectionModel={selectedUsers}
          />
        )}
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
          <Button variant="outlined" color="success" onClick={handleActivateUsers} sx={{ ml: 1 }} disabled={selectedUsers.length === 0}>
            Активировать
          </Button>
          <Button variant="outlined" color="error" onClick={handleDeactivateUsers} sx={{ ml: 1 }} disabled={selectedUsers.length === 0}>
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
              required
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
              required
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
              required
            />
            <TextField
              margin="dense"
              label="Email"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              required
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