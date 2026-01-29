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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { usersAPI } from '../services/api';

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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        page: 1,
        limit: 1000, // Загружаем все данные для локальной фильтрации
      };

      // Добавляем поисковый запрос
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Добавляем фильтр по вкладке
      const statusMap = ['all', 'active', 'blocked', 'new'];
      const status = statusMap[currentTab];
      if (status !== 'all') {
        params.status = status;
      }

      const response = await usersAPI.getAll(params);

      // Обрабатываем данные в зависимости от структуры ответа
      let fetchedUsers: User[] = [];
      if (response.data && Array.isArray(response.data.results)) {
        fetchedUsers = response.data.results;
      } else if (response.data && Array.isArray(response.data.users)) {
        fetchedUsers = response.data.users;
      } else if (Array.isArray(response.data)) {
        fetchedUsers = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        fetchedUsers = response.data;
      }

      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
      setLoading(false);
    }
  }, [searchQuery, currentTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0); // Сбрасываем на первую страницу при поиске
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0); // Сбрасываем на первую страницу при смене вкладки
  };

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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentPageUsers = filteredUsers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    if (selectedUsers.length === currentPageUsers.length) {
      // Если все выбраны, снимаем выделение
      setSelectedUsers([]);
    } else {
      // Выбираем всех пользователей на текущей странице
      const pageUserIds = currentPageUsers.map(user => user.id);
      setSelectedUsers(pageUserIds);
    }
  };

  // Получаем пользователей для текущей страницы
  const displayedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 540 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < displayedUsers.length}
                        checked={displayedUsers.length > 0 && selectedUsers.length === displayedUsers.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Аватар</TableCell>
                    <TableCell>Имя</TableCell>
                    <TableCell>Фамилия</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Телефон</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Регистрация</TableCell>
                    <TableCell>Заказы</TableCell>
                    <TableCell>Потрачено</TableCell>
                    <TableCell>Бонусы</TableCell>
                    <TableCell>Активен</TableCell>
                    <TableCell>Заблокирован</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.map((user) => (
                    <TableRow key={user.id} hover selected={selectedUsers.includes(user.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </TableCell>
                      <TableCell>{user.first_name}</TableCell>
                      <TableCell>{user.last_name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.registration_date ? new Date(user.registration_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{user.total_orders || 0}</TableCell>
                      <TableCell>{user.total_spent ? `${user.total_spent}₽` : '0₽'}</TableCell>
                      <TableCell>{user.bonus_balance ? `${user.bonus_balance} баллов` : '0 баллов'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Да' : 'Нет'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_blocked ? 'Да' : 'Нет'}
                          color={user.is_blocked ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => console.log('Edit', user.id)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => console.log('Send message', user.id)}>
                          <SendIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {displayedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} align="center">
                        Пользователи не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
              }
            />
          </>
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