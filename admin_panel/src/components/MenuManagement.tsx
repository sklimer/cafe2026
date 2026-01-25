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
  parent: number | null;
  restaurant: number;
  description?: string;
  image_url?: string;
  icon_url?: string;
  display_order?: number;
  is_active?: boolean;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: number;
  name: string;
  category: number;
  price: number;
  cost_price: number;
  is_available: boolean;
  stock_quantity: number;
  description: string;
  restaurant: number;
  old_price?: number;
  profit_margin?: number;
  weight_grams?: number;
  volume_ml?: number;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
  main_image_url?: string;
  image_urls?: string[];
  video_url?: string;
  is_popular?: boolean;
  is_new?: boolean;
  is_recommended?: boolean;
  is_spicy?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  cooking_time_minutes?: number;
  preparation_instructions?: string;
  display_order?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

const MenuManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.allSettled([
          menuAPI.getCategories(),
          menuAPI.getProducts()
        ]);

        if (categoriesRes.status === 'fulfilled') {
          // Django возвращает пагинированный ответ, берем results или используем весь объект
          const data = categoriesRes.value.data;
          const categoriesArray = Array.isArray(data) ? data : (data.results || []);
          console.log('Categories data:', categoriesArray); // Для отладки
          setCategories(categoriesArray);
        }

        if (productsRes.status === 'fulfilled') {
          const data = productsRes.value.data;
          const productsArray = Array.isArray(data) ? data : (data.results || []);
          console.log('Products data:', productsArray); // Для отладки
          setProducts(productsArray);
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

  // States for form data
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    costPrice: '',
    isAvailable: true,
    stockQuantity: '',
    tags: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parentId: ''
  });

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
    {
      field: 'category',
      headerName: 'Категория',
      width: 150,
      valueGetter: (params) => {
        const category = categories.find(cat => cat.id === params.row.category);
        return category ? category.name : 'Не указана';
      }
    },
    { field: 'price', headerName: 'Цена', width: 100, valueFormatter: (params) => `${params.value}₽` },
    { field: 'cost_price', headerName: 'Себестоимость', width: 150, valueFormatter: (params) => `${params.value}₽` },
    {
      field: 'is_available',
      headerName: 'Доступен',
      width: 100,
      renderCell: (params) => (
        <Switch checked={params.value} />
      )
    },
    { field: 'stock_quantity', headerName: 'Остаток', width: 100 },
    {
      field: 'tags',
      headerName: 'Теги',
      width: 150,
      renderCell: (params) => (
        <Box>
          {(params.value || []).map((tag: string, index: number) => (
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
    // Reset form
    setProductForm({
      name: '',
      categoryId: '',
      price: '',
      costPrice: '',
      isAvailable: true,
      stockQuantity: '',
      tags: ''
    });
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    // Reset form
    setCategoryForm({
      name: '',
      parentId: ''
    });
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductSelectChange = (name: string, value: any) => {
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySelectChange = (name: string, value: any) => {
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitProduct = async () => {
    try {
      // First, get the current user's restaurant ID or use a default one
      // For now, we'll fetch the first available restaurant or use a default ID
      const productData = {
        name: productForm.name,
        category: parseInt(productForm.categoryId) || null,
        price: parseFloat(productForm.price) || 0,
        cost_price: parseFloat(productForm.costPrice) || 0,
        is_available: productForm.isAvailable,
        stock_quantity: parseInt(productForm.stockQuantity) || 0,
        description: productForm.name, // Using name as description for now
        restaurant: 1, // We need to either fetch the user's restaurant or use a default
        tags: productForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await menuAPI.createProduct(productData);

      // Refresh the products list
      const response = await menuAPI.getProducts();
      const productsArray = response.data.results || response.data;
      setProducts(productsArray);

      setOpenProductDialog(false);
      // Reset form
      setProductForm({
        name: '',
        categoryId: '',
        price: '',
        costPrice: '',
        isAvailable: true,
        stockQuantity: '',
        tags: ''
      });
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Ошибка при создании товара');
    }
  };

  const handleSubmitCategory = async () => {
    try {
      const categoryData = {
        name: categoryForm.name,
        parent: categoryForm.parentId ? parseInt(categoryForm.parentId) : null,
        restaurant: 1 // We need to either fetch the user's restaurant or use a default
      };

      await menuAPI.createCategory(categoryData);

      // Refresh the categories list
      const response = await menuAPI.getCategories();
      const categoriesArray = response.data.results || response.data;
      setCategories(categoriesArray);

      setOpenCategoryDialog(false);
      // Reset form
      setCategoryForm({
        name: '',
        parentId: ''
      });
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Ошибка при создании категории');
    }
  };

  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  // Calculate category level and child count
  const getCategoryLevel = (category: Category, allCategories: Category[]): number => {
    let level = 0;
    let currentParentId = category.parent;

    while (currentParentId) {
      const parent = allCategories.find(cat => cat.id === currentParentId);
      if (parent) {
        level++;
        currentParentId = parent.parent;
      } else {
        break;
      }
    }

    return level;
  };

  const getChildCount = (categoryId: number, allCategories: Category[]): number => {
    return allCategories.filter(cat => cat.parent === categoryId).length;
  };

  const toggleCategory = (id: number) => {
    if (expandedCategories.includes(id)) {
      setExpandedCategories(expandedCategories.filter(catId => catId !== id));
    } else {
      setExpandedCategories([...expandedCategories, id]);
    }
  };

  const renderTree = (nodes: Category[], parentId: number | null = null) => {
    const children = nodes.filter(node => node.parent === parentId);

    return children.map(node => (
      <div key={node.id}>
        <ListItem button onClick={() => toggleCategory(node.id)}>
          <ListItemText primary={`${node.name} (${getChildCount(node.id, nodes)})`} />
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
              name="name"
              value={productForm.name}
              onChange={handleProductFormChange}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Категория</InputLabel>
              <Select
                label="Категория"
                value={productForm.categoryId || ''}
                onChange={(e) => handleProductSelectChange('categoryId', e.target.value)}
              >
                <MenuItem value="">Выберите категорию</MenuItem>
                {categories.filter(cat => cat.parent === null).map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Цена"
              name="price"
              value={productForm.price}
              onChange={handleProductFormChange}
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Себестоимость"
              name="costPrice"
              value={productForm.costPrice}
              onChange={handleProductFormChange}
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.isAvailable}
                  onChange={(e) => handleProductSelectChange('isAvailable', e.target.checked)}
                />
              }
              label="Доступен"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Остаток"
              name="stockQuantity"
              value={productForm.stockQuantity}
              onChange={handleProductFormChange}
              fullWidth
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Теги (через запятую)"
              name="tags"
              value={productForm.tags}
              onChange={handleProductFormChange}
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
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryFormChange}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Родительская категория</InputLabel>
              <Select
                label="Родительская категория"
                value={categoryForm.parentId || ''}
                onChange={(e) => handleCategorySelectChange('parentId', e.target.value)}
              >
                <MenuItem value="">Без родителя</MenuItem>
                {categories.filter(cat => cat.parent === null).map(cat => (
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