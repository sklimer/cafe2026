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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Switch,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { menuAPI } from '../services/api';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  childCount: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  isAvailable: boolean;
  stockQuantity: number;
  orderCount: number;
  tags: string[];
}

const MenuManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Using API service to fetch real data
        const [categoriesRes, productsRes] = await Promise.allSettled([
          menuAPI.getCategories(),
          menuAPI.getProducts()
        ]);

        if (categoriesRes.status === 'fulfilled') {
          setCategories(categoriesRes.value.data);
        }

        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching menu data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const productColumns: GridColDef[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedProducts.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, params.row.id]);
            } else {
              setSelectedProducts(selectedProducts.filter(id => id !== params.row.id));
            }
          }}
        />
      )
    },
    { field: 'name', headerName: 'Название', width: 200 },
    { field: 'category', headerName: 'Категория', width: 150 },
    { field: 'price', headerName: 'Цена', width: 100, valueFormatter: (params) => `${params.value}₽` },
    { field: 'costPrice', headerName: 'Себестоимость', width: 150, valueFormatter: (params) => `${params.value}₽` },
    {
      field: 'isAvailable',
      headerName: 'Доступен',
      width: 100,
      renderCell: (params) => (
        <Switch checked={params.value} />
      )
    },
    { field: 'stockQuantity', headerName: 'Остаток', width: 100 },
    { field: 'orderCount', headerName: 'Заказов', width: 100 },
    {
      field: 'tags',
      headerName: 'Теги',
      width: 150,
      renderCell: (params) => (
        <Box>
          {params.value.map((tag: string, index: number) => (
            <Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
        </Box>
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

  const handleAddProduct = () => {
    setOpenProductDialog(true);
  };

  const handleAddCategory = () => {
    setOpenCategoryDialog(true);
  };

  const handleCloseProductDialog = () => {
    setOpenProductDialog(false);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
  };

  const handleSubmitProduct = () => {
    // Handle form submission
    setOpenProductDialog(false);
  };

  const handleSubmitCategory = () => {
    // Handle form submission
    setOpenCategoryDialog(false);
  };

  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategory = (id: number) => {
    if (expandedCategories.includes(id)) {
      setExpandedCategories(expandedCategories.filter(catId => catId !== id));
    } else {
      setExpandedCategories([...expandedCategories, id]);
    }
  };

  const renderTree = (nodes: Category[], parentId: number | null = null) => {
    const children = nodes.filter(node => node.parentId === parentId);

    return children.map(node => (
      <div key={node.id}>
        <ListItem button onClick={() => toggleCategory(node.id)}>
          <ListItemText primary={`${node.name} (${node.childCount})`} />
          {expandedCategories.includes(node.id) ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={expandedCategories.includes(node.id)}>
          <List component="div" disablePadding>
            {renderTree(nodes, node.id)}
          </List>
        </Collapse>
      </div>
    ));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Управление меню
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Поиск по названию товара"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Категории" />
            <Tab label="Товары" />
            <Tab label="Теги" />
            <Tab label="Опции" />
          </Tabs>
          <Box>
            <Button variant="contained" onClick={handleAddCategory} sx={{ mr: 1 }}>
              <AddIcon sx={{ mr: 1 }} /> Категория
            </Button>
            <Button variant="contained" onClick={handleAddProduct}>
              <AddIcon sx={{ mr: 1 }} /> Товар
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ width: '30%', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Категории
          </Typography>
          <List>
            {renderTree(categories)}
          </List>
        </Paper>

        <Paper sx={{ width: '70%', height: 600 }}>
          <DataGrid
            rows={products}
            columns={productColumns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Paper>
      </Box>

      {/* Product Dialog */}
      <Dialog open={openProductDialog} onClose={handleCloseProductDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить товар</DialogTitle>
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
              <InputLabel>Категория</InputLabel>
              <Select label="Категория">
                {categories.filter(cat => cat.level === 0).map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Цена"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Себестоимость"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch />}
              label="Доступен"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Остаток"
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Теги (через запятую)"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Отмена</Button>
          <Button onClick={handleSubmitProduct} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить категорию</DialogTitle>
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
              <InputLabel>Родительская категория</InputLabel>
              <Select label="Родительская категория">
                <MenuItem value="">Без родителя</MenuItem>
                {categories.filter(cat => cat.level === 0).map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Отмена</Button>
          <Button onClick={handleSubmitCategory} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuManagement;