import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Collapse,
  Switch,
  FormControlLabel,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { menuAPI, restaurantsAPI } from '../services/api';

// Обновленный интерфейс на основе того, что возвращает API
interface Category {
  id: number;
  name: string;
  parent?: number | null;
  level?: number;
  restaurant?: number;
  description?: string;
  image_url?: string;
  icon_url?: string;
  children?: Category[];
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
  const [restaurants, setRestaurants] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояния для формы категории
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    restaurantId: '',
    parentId: '',
    description: '',
  });

  // Состояния для формы продукта
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    costPrice: '',
    isAvailable: false,
    stockQuantity: '',
    tags: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');

        // Получаем данные параллельно
        const [categoriesRes, productsRes, restaurantsRes] = await Promise.allSettled([
          menuAPI.getCategories(),
          menuAPI.getProducts(),
          restaurantsAPI.getAll()
        ]);

        console.log('All promises settled:', { categoriesRes, productsRes, restaurantsRes });

        // Обработка категорий
        if (categoriesRes.status === 'fulfilled') {
          const data = categoriesRes.value.data;
          console.log('Raw categories data from API:', data);

          let categoriesArray: Category[] = [];

          if (Array.isArray(data)) {
            categoriesArray = data;
          } else if (data && data.results && Array.isArray(data.results)) {
            categoriesArray = data.results;
          } else if (data && data.data && Array.isArray(data.data)) {
            categoriesArray = data.data;
          } else {
            console.warn('Unexpected categories data format:', data);
          }

          console.log('Processed categories array:', categoriesArray);

          // Если категории не загрузились, попробуем другой эндпоинт
          if (categoriesArray.length === 0) {
            console.log('No categories found, trying alternative endpoint...');
            // Можно попробовать другой endpoint здесь
          }

          setCategories(categoriesArray);
        } else {
          console.error('Failed to fetch categories:', categoriesRes.reason);
        }

        // Обработка продуктов
        if (productsRes.status === 'fulfilled') {
          const data = productsRes.value.data;
          console.log('Raw products data from API:', data);

          let productsArray: any[] = [];

          if (Array.isArray(data)) {
            productsArray = data;
          } else if (data && data.results && Array.isArray(data.results)) {
            productsArray = data.results;
          } else if (data && data.data && Array.isArray(data.data)) {
            productsArray = data.data;
          } else {
            console.warn('Unexpected products data format:', data);
          }

          const transformedProducts = productsArray.map((product: any) => ({
            id: product.id,
            name: product.name || 'Без названия',
            category: product.category_name || product.category?.name || String(product.category_id || product.category || 'Не указана'),
            price: product.price || 0,
            costPrice: product.cost_price || product.costPrice || 0,
            isAvailable: product.is_available || product.isAvailable || false,
            stockQuantity: product.stock_quantity || product.stockQuantity || 0,
            orderCount: product.order_count || product.orderCount || 0,
            tags: product.tags || []
          }));

          console.log('Transformed products:', transformedProducts);
          setProducts(transformedProducts);
        } else {
          console.error('Failed to fetch products:', productsRes.reason);
        }

        // Обработка ресторанов
        if (restaurantsRes.status === 'fulfilled') {
          const data = restaurantsRes.value.data;
          console.log('Raw restaurants data from API:', data);

          let restaurantsArray: any[] = [];

          if (Array.isArray(data)) {
            restaurantsArray = data;
          } else if (data && data.results && Array.isArray(data.results)) {
            restaurantsArray = data.results;
          } else if (data && data.data && Array.isArray(data.data)) {
            restaurantsArray = data.data;
          } else {
            console.warn('Unexpected restaurants data format:', data);
          }

          console.log('Restaurants array:', restaurantsArray);
          setRestaurants(restaurantsArray.map(r => ({ id: r.id, name: r.name })));
        } else {
          console.error('Failed to fetch restaurants:', restaurantsRes.reason);
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
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

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
    {
      field: 'price',
      headerName: 'Цена',
      width: 100,
      valueFormatter: (params) => `${params.value}₽`
    },
    {
      field: 'costPrice',
      headerName: 'Себестоимость',
      width: 150,
      valueFormatter: (params) => `${params.value}₽`
    },
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
          {Array.isArray(params.value) && params.value.map((tag: string, index: number) => (
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
        <Box>
          <IconButton size="small" onClick={() => console.log('Edit', params.row.id)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => console.log('Delete', params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    },
  ];

  const toggleCategory = (id: number) => {
    setExpandedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  // Функция для отображения дерева категорий
  const renderCategoryTree = (categoriesList: Category[], parentId: number | null = null, level: number = 0) => {
    // Фильтруем категории по parentId
    const filtered = categoriesList.filter(cat => {
      // Если parentId null, ищем корневые категории (те, у которых parent = null или undefined)
      if (parentId === null) {
        return !cat.parent || cat.parent === null;
      }
      return cat.parent === parentId;
    });

    if (filtered.length === 0) {
      return null;
    }

    return filtered.map(category => {
      // Проверяем, есть ли у категории дети
      const hasChildren = categoriesList.some(cat => cat.parent === category.id);

      return (
        <div key={category.id}>
          <ListItem
            button
            onClick={() => hasChildren && toggleCategory(category.id)}
            sx={{
              pl: level * 3 + 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <ListItemText primary={category.name} />
            {hasChildren ? (
              expandedCategories.includes(category.id) ?
                <ExpandLess /> :
                <ExpandMore />
            ) : null}
          </ListItem>
          {hasChildren && (
            <Collapse in={expandedCategories.includes(category.id)} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderCategoryTree(categoriesList, category.id, level + 1)}
              </List>
            </Collapse>
          )}
        </div>
      );
    });
  };

  const handleAddProduct = () => {
    setOpenProductDialog(true);
  };

  const handleAddCategory = () => {
    setCategoryForm({
      name: '',
      restaurantId: '',
      parentId: '',
      description: '',
    });
    setOpenCategoryDialog(true);
  };

  const handleCloseProductDialog = () => {
    setProductForm({
      name: '',
      category: '',
      price: '',
      costPrice: '',
      isAvailable: false,
      stockQuantity: '',
      tags: '',
    });
    setOpenProductDialog(false);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryForm({
      name: '',
      restaurantId: '',
      parentId: '',
      description: '',
    });
    setOpenCategoryDialog(false);
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });
  };

  const handleCategoryFormChange = (e: any) => {
    const { name, value } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: value,
    });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductForm({
      ...productForm,
      isAvailable: e.target.checked,
    });
  };

  const handleSubmitProduct = async () => {
    try {
      if (!productForm.name) {
        alert('Пожалуйста, заполните название товара');
        return;
      }

      const productData = {
        name: productForm.name,
        category: productForm.category ? parseInt(productForm.category) : null,
        price: parseFloat(productForm.price) || 0,
        cost_price: parseFloat(productForm.costPrice) || 0,
        is_available: productForm.isAvailable,
        stock_quantity: parseInt(productForm.stockQuantity) || 0,
        tags: productForm.tags ? productForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      };

      console.log('Submitting product:', productData);
      await menuAPI.createProduct(productData);

      // Обновляем список продуктов
      const productsRes = await menuAPI.getProducts();
      const data = productsRes.data;

      let productsArray: any[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && data.results && Array.isArray(data.results)) {
        productsArray = data.results;
      }

      const transformedProducts = productsArray.map((product: any) => ({
        id: product.id,
        name: product.name || 'Без названия',
        category: product.category_name || product.category?.name || String(product.category_id || product.category || 'Не указана'),
        price: product.price || 0,
        costPrice: product.cost_price || product.costPrice || 0,
        isAvailable: product.is_available || product.isAvailable || false,
        stockQuantity: product.stock_quantity || product.stockQuantity || 0,
        orderCount: product.order_count || product.orderCount || 0,
        tags: product.tags || []
      }));

      setProducts(transformedProducts);
      setOpenProductDialog(false);

      // Сброс формы
      setProductForm({
        name: '',
        category: '',
        price: '',
        costPrice: '',
        isAvailable: false,
        stockQuantity: '',
        tags: '',
      });

      console.log('Product created successfully');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Ошибка при создании товара');
    }
  };

  const handleSubmitCategory = async () => {
    try {
      if (!categoryForm.name) {
        alert('Пожалуйста, заполните название категории');
        return;
      }

      if (!categoryForm.restaurantId) {
        alert('Пожалуйста, выберите ресторан');
        return;
      }

      const categoryData = {
        name: categoryForm.name,
        parent: categoryForm.parentId ? parseInt(categoryForm.parentId) : null,
        restaurant: parseInt(categoryForm.restaurantId),
        description: categoryForm.description || '',
      };

      console.log('Submitting category:', categoryData);
      await menuAPI.createCategory(categoryData);

      // Обновляем список категорий
      const categoriesRes = await menuAPI.getCategories();
      const data = categoriesRes.data;

      let categoriesArray: Category[] = [];
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data && data.results && Array.isArray(data.results)) {
        categoriesArray = data.results;
      }

      setCategories(categoriesArray);
      setOpenCategoryDialog(false);

      // Сброс формы
      setCategoryForm({
        name: '',
        restaurantId: '',
        parentId: '',
        description: '',
      });

      console.log('Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Ошибка при создании категории');
    }
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Загрузка...</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Paper sx={{ width: '30%', p: 2, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Категории ({categories.length})
            </Typography>
            <List>
              {categories.length > 0 ? (
                renderCategoryTree(categories)
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Категории не найдены
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Проверьте endpoint API или создайте первую категорию
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>

          <Paper sx={{ width: '70%', height: 600 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Товары ({products.length})
            </Typography>
            {products.length > 0 ? (
              <DataGrid
                rows={products}
                columns={productColumns}
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 },
                  },
                }}
                checkboxSelection={false}
                disableRowSelectionOnClick
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Товары не найдены
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Создайте первый товар или проверьте endpoint API
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Product Dialog */}
      <Dialog open={openProductDialog} onClose={handleCloseProductDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить товар</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="name"
              autoFocus
              margin="dense"
              label="Название *"
              fullWidth
              variant="outlined"
              value={productForm.name}
              onChange={handleProductFormChange}
              sx={{ mb: 2 }}
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Категория</InputLabel>
              <Select
                name="category"
                label="Категория"
                value={productForm.category}
                onChange={handleProductFormChange}
              >
                <MenuItem value="">Не выбрана</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="price"
              margin="dense"
              label="Цена"
              fullWidth
              variant="outlined"
              type="number"
              value={productForm.price}
              onChange={handleProductFormChange}
              sx={{ mb: 2 }}
            />
            <TextField
              name="costPrice"
              margin="dense"
              label="Себестоимость"
              fullWidth
              variant="outlined"
              type="number"
              value={productForm.costPrice}
              onChange={handleProductFormChange}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.isAvailable}
                  onChange={handleSwitchChange}
                />
              }
              label="Доступен"
              sx={{ mb: 2, display: 'block' }}
            />
            <TextField
              name="stockQuantity"
              margin="dense"
              label="Остаток"
              fullWidth
              variant="outlined"
              type="number"
              value={productForm.stockQuantity}
              onChange={handleProductFormChange}
              sx={{ mb: 2 }}
            />
            <TextField
              name="tags"
              margin="dense"
              label="Теги (через запятую)"
              fullWidth
              variant="outlined"
              value={productForm.tags}
              onChange={handleProductFormChange}
              sx={{ mb: 2 }}
              placeholder="горячее, новинка, акция"
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
              name="name"
              autoFocus
              margin="dense"
              label="Название *"
              fullWidth
              variant="outlined"
              value={categoryForm.name}
              onChange={handleCategoryFormChange}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              name="description"
              margin="dense"
              label="Описание"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={categoryForm.description}
              onChange={handleCategoryFormChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ресторан *</InputLabel>
              <Select
                name="restaurantId"
                label="Ресторан *"
                value={categoryForm.restaurantId}
                onChange={handleCategoryFormChange}
                required
              >
                {restaurants.map(restaurant => (
                  <MenuItem key={restaurant.id} value={restaurant.id}>{restaurant.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Родительская категория</InputLabel>
              <Select
                name="parentId"
                label="Родительская категория"
                value={categoryForm.parentId}
                onChange={handleCategoryFormChange}
              >
                <MenuItem value="">Без родителя (корневая)</MenuItem>
                {categories.map(cat => (
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