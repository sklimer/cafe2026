
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
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from '@mui/icons-material/Settings';
import { menuAPI, restaurantsAPI } from '../services/api';

// Обновленный интерфейс на основе того, что возвращает API
interface Category {
  id: number;
  name: string;
  parent?: number | null;
  level?: number;
  restaurant?: number;
  restaurant_name?: string;
  description?: string;
  image_url?: string;
  icon_url?: string;
  children?: Category[];
  is_active?: boolean;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  category_id?: number;
  price: number | string;  // Price can come as string from API
  costPrice: number | string;  // Cost price can come as string from API
  isAvailable: boolean;
  stockQuantity: number;
  orderCount: number;
  tags: string[];
  description: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Option {
  id: number;
  name: string;
  type: string;
  required: boolean;
  choices: string[];
}

const MenuManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [restaurants, setRestaurants] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояния для формы категории
  const [categoryForm, setCategoryForm] = useState({
    id: null as number | null,
    name: '',
    parentId: '',
    description: '',
    is_active: true,
    is_visible: true,
  });

  // Состояния для формы продукта
  const [productForm, setProductForm] = useState({
    id: undefined as number | undefined,
    name: '',
    category: '',
    price: '',
    costPrice: '',
    isAvailable: false,
    stockQuantity: '',
    tags: [] as string[],
    description: '',
  });

  // Состояния для формы тега
  const [tagForm, setTagForm] = useState({
    name: '',
    color: '#1976d2',
  });

  // Состояния для формы опции
  const [optionForm, setOptionForm] = useState({
    name: '',
    type: 'select',
    required: false,
    choices: [''],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');

        // Получаем данные параллельно
        const [categoriesRes, productsRes] = await Promise.allSettled([
          menuAPI.getCategories(),
          menuAPI.getProducts(),
        ]);

        console.log('All promises settled:', { categoriesRes, productsRes });

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
            price: parseFloat(product.price) || 0,
            costPrice: parseFloat(product.cost_price || product.costPrice) || 0,
            isAvailable: product.is_available || product.isAvailable || false,
            stockQuantity: product.stock_quantity || product.stockQuantity || 0,
            orderCount: product.order_count || product.orderCount || 0,
            tags: product.tags || [],
            description: product.description || '',
          }));

          console.log('Transformed products:', transformedProducts);
          setProducts(transformedProducts);
        } else {
          console.error('Failed to fetch products:', productsRes.reason);
        }

        // Заглушки для тегов и опций
        setTags([
          { id: 1, name: 'Новинка', color: '#4caf50' },
          { id: 2, name: 'Хит продаж', color: '#ff9800' },
          { id: 3, name: 'Вегетарианское', color: '#8bc34a' },
          { id: 4, name: 'Острое', color: '#f44336' },
        ]);

        setOptions([
          { id: 1, name: 'Размер порции', type: 'select', required: true, choices: ['Маленькая', 'Средняя', 'Большая'] },
          { id: 2, name: 'Дополнительные ингредиенты', type: 'multi', required: false, choices: ['Сыр', 'Бекон', 'Грибы', 'Оливки'] },
          { id: 3, name: 'Степень прожарки', type: 'select', required: false, choices: ['С кровью', 'Средняя', 'Полная'] },
        ]);

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
  const [openTagDialog, setOpenTagDialog] = useState(false);
  const [openOptionDialog, setOpenOptionDialog] = useState(false);
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
      valueFormatter: (params) => {
        const price = typeof params.value === 'number' ? params.value : parseFloat(params.value) || 0;
        return `${price.toLocaleString('ru-RU')}₽`;
      }
    },
    {
      field: 'costPrice',
      headerName: 'Себестоимость',
      width: 150,
      valueFormatter: (params) => {
        const costPrice = typeof params.value === 'number' ? params.value : parseFloat(params.value) || 0;
        return `${costPrice.toLocaleString('ru-RU')}₽`;
      }
    },
    {
      field: 'isAvailable',
      headerName: 'Доступен',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleAvailabilityToggle(params.row.id, e.target.checked)}
        />
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
          <IconButton size="small" onClick={() => handleEditProduct(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => handleDeleteProduct(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    },
  ];

  const handleAvailabilityToggle = async (productId: number, isAvailable: boolean) => {
    try {
      // Update the availability in the backend
      await menuAPI.updateProduct(productId, { is_available: isAvailable });

      // Update the local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, isAvailable } : product
        )
      );
    } catch (error) {
      console.error('Error updating product availability:', error);
      // Revert the change if the API call failed
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, isAvailable: !isAvailable } : product
        )
      );
    }
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      category: product.category_id?.toString() || product.category || '',
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      isAvailable: product.isAvailable,
      stockQuantity: product.stockQuantity.toString(),
      tags: product.tags || [],
      description: product.description,
    });
    setOpenProductDialog(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await menuAPI.deleteProduct(productId);

        // Update the local state
        setProducts(prevProducts =>
          prevProducts.filter(product => product.id !== productId)
        );
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении товара');
      }
    }
  };

  const toggleCategory = (id: number) => {
    setExpandedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      parentId: category.parent?.toString() || '',
      description: category.description || '',
      is_active: category.is_active ?? true,
      is_visible: category.is_visible ?? true,
    });
    setOpenCategoryDialog(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        await menuAPI.deleteCategory(categoryId);

        // Update the local state
        setCategories(prevCategories =>
          prevCategories.filter(category => category.id !== categoryId)
        );
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Ошибка при удалении категории');
      }
    }
  };

  // Функция для отображения дерева категорий
  const renderCategoryTree = (categoriesList: Category[], parentId: number | null = null, level: number = 0) => {
    const filtered = categoriesList.filter(cat => {
      if (parentId === null) {
        return !cat.parent || cat.parent === null;
      }
      return cat.parent === parentId;
    });

    if (filtered.length === 0) {
      return null;
    }

    return filtered.map(category => {
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
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <ListItemText primary={category.name} secondary={
                <>
                  {category.description && <div>{category.description}</div>}
                  {category.restaurant_name && <div>({category.restaurant_name})</div>}
                </>
              } />
            </Box>
            <Box>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
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
      id: null,
      name: '',
      parentId: '',
      description: '',
      is_active: true,
      is_visible: true,
    });
    setOpenCategoryDialog(true);
  };

  const handleAddTag = () => {
    setTagForm({
      name: '',
      color: '#1976d2',
    });
    setOpenTagDialog(true);
  };

  const handleAddOption = () => {
    setOptionForm({
      name: '',
      type: 'select',
      required: false,
      choices: [''],
    });
    setOpenOptionDialog(true);
  };

  const handleCloseProductDialog = () => {
    setProductForm({
      name: '',
      category: '',
      price: '',
      costPrice: '',
      isAvailable: false,
      stockQuantity: '',
      tags: [],
      description: '',
    });
    setOpenProductDialog(false);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryForm({
      name: '',
      parentId: '',
      description: '',
    });
    setOpenCategoryDialog(false);
  };

  const handleCloseTagDialog = () => {
    setTagForm({
      name: '',
      color: '#1976d2',
    });
    setOpenTagDialog(false);
  };

  const handleCloseOptionDialog = () => {
    setOptionForm({
      name: '',
      type: 'select',
      required: false,
      choices: [''],
    });
    setOpenOptionDialog(false);
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

  const handleTagFormChange = (e: any) => {
    const { name, value } = e.target;
    setTagForm({
      ...tagForm,
      [name]: value,
    });
  };

  const handleOptionFormChange = (e: any) => {
    const { name, value } = e.target;
    setOptionForm({
      ...optionForm,
      [name]: value,
    });
  };


  const handleOptionSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptionForm({
      ...optionForm,
      required: e.target.checked,
    });
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...optionForm.choices];
    newChoices[index] = value;
    setOptionForm({
      ...optionForm,
      choices: newChoices,
    });
  };

  const addChoice = () => {
    setOptionForm({
      ...optionForm,
      choices: [...optionForm.choices, ''],
    });
  };

  const removeChoice = (index: number) => {
    const newChoices = optionForm.choices.filter((_, i) => i !== index);
    setOptionForm({
      ...optionForm,
      choices: newChoices,
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
        description: productForm.description,
        price: parseFloat(productForm.price) || 0,
        cost_price: parseFloat(productForm.costPrice) || 0,
        is_available: productForm.isAvailable,
        stock_quantity: parseInt(productForm.stockQuantity) || 0,
        tags: productForm.tags,
        restaurant: 1,
      };

      console.log('Submitting product:', productData);

      // Check if we're editing an existing product (this requires tracking if we're in edit mode)
      // We'll need to track the editing state differently, so we'll need to update the state
      const isEditing = Boolean(productForm.id); // Assuming we add an id field to productForm

      if (isEditing) {
        // Update existing product
        await menuAPI.updateProduct(Number(productForm.id), productData);
      } else {
        // Create new product
        await menuAPI.createProduct(productData);
      }

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
        price: parseFloat(product.price) || 0,
        costPrice: parseFloat(product.cost_price || product.costPrice) || 0,
        isAvailable: product.is_available || product.isAvailable || false,
        stockQuantity: product.stock_quantity || product.stockQuantity || 0,
        orderCount: product.order_count || product.orderCount || 0,
        tags: product.tags || [],
        description: product.description || '',
      }));

      setProducts(transformedProducts);
      setOpenProductDialog(false);
      setProductForm({
        id: undefined,
        name: '',
        category: '',
        price: '',
        costPrice: '',
        isAvailable: false,
        stockQuantity: '',
        tags: [],
        description: '',
      });

      console.log(isEditing ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      console.error('Error creating/updating product:', error);
      alert('Ошибка при сохранении товара');
    }
  };

  const handleSubmitCategory = async () => {
    try {
      if (!categoryForm.name) {
        alert('Пожалуйста, заполните название категории');
        return;
      }

      const categoryData = {
        name: categoryForm.name,
        parent: categoryForm.parentId ? parseInt(categoryForm.parentId) : null,
        description: categoryForm.description || '',
        is_active: categoryForm.is_active,
        is_visible: categoryForm.is_visible,
      };

      console.log('Submitting category:', categoryData);

      if (categoryForm.id) {
        // Update existing category
        await menuAPI.updateCategory(categoryForm.id, categoryData);
      } else {
        // Create new category
        await menuAPI.createCategory(categoryData);
      }

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
      setCategoryForm({
        id: null,
        name: '',
        parentId: '',
        description: '',
        is_active: true,
        is_visible: true,
      });

      console.log(categoryForm.id ? 'Category updated successfully' : 'Category created successfully');
    } catch (error) {
      console.error(categoryForm.id ? 'Error updating category:' : 'Error creating category:', error);
      alert(categoryForm.id ? 'Ошибка при обновлении категории' : 'Ошибка при создании категории');
    }
  };

  const handleSubmitTag = () => {
    const newTag = {
      id: tags.length + 1,
      name: tagForm.name,
      color: tagForm.color,
    };
    setTags([...tags, newTag]);
    setOpenTagDialog(false);
    setTagForm({
      name: '',
      color: '#1976d2',
    });
  };

  const handleSubmitOption = () => {
    const newOption = {
      id: options.length + 1,
      name: optionForm.name,
      type: optionForm.type,
      required: optionForm.required,
      choices: optionForm.choices.filter(choice => choice.trim() !== ''),
    };
    setOptions([...options, newOption]);
    setOpenOptionDialog(false);
    setOptionForm({
      name: '',
      type: 'select',
      required: false,
      choices: [''],
    });
  };

  const renderCategoriesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" onClick={handleAddCategory} startIcon={<AddIcon />}>
          Добавить категорию
        </Button>
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Дерево категорий ({categories.length})
        </Typography>
        {loading ? (
          <Typography>Загрузка...</Typography>
        ) : categories.length > 0 ? (
          <List>
            {renderCategoryTree(categories)}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Категории не найдены
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );

  const renderProductsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" onClick={handleAddProduct} startIcon={<AddIcon />}>
          Добавить товар
        </Button>
      </Box>
      <Paper sx={{ height: 600 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Товары ({products.length})
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Загрузка...</Typography>
          </Box>
        ) : products.length > 0 ? (
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
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );

  const renderTagsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" onClick={handleAddTag} startIcon={<AddIcon />}>
          Добавить тег
        </Button>
      </Box>
      <Grid container spacing={2}>
        {tags.map((tag) => (
          <Grid item xs={12} sm={6} md={4} key={tag.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocalOfferIcon sx={{ color: tag.color, mr: 1 }} />
                  <Typography variant="h6">{tag.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: tag.color,
                      borderRadius: 1,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {tag.color}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
                <IconButton size="small">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderOptionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" onClick={handleAddOption} startIcon={<AddIcon />}>
          Добавить опцию
        </Button>
      </Box>
      <Grid container spacing={2}>
        {options.map((option) => (
          <Grid item xs={12} md={6} key={option.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">{option.name}</Typography>
                  </Box>
                  <Chip
                    label={option.required ? 'Обязательная' : 'Необязательная'}
                    color={option.required ? 'error' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Тип: {option.type === 'select' ? 'Выбор одного' : 'Множественный выбор'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Варианты выбора:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {option.choices.map((choice, index) => (
                    <Chip key={index} label={choice} size="small" />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
                <IconButton size="small">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

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
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Категории" />
          <Tab label="Товары" />
          <Tab label="Теги" />
          <Tab label="Опции" />
        </Tabs>
      </Paper>

      {currentTab === 0 && renderCategoriesTab()}
      {currentTab === 1 && renderProductsTab()}
      {currentTab === 2 && renderTagsTab()}
      {currentTab === 3 && renderOptionsTab()}

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
              name="description"
              margin="dense"
              label="Описание"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={productForm.description}
              onChange={handleProductFormChange}
              sx={{ mb: 2 }}
            />
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
                  onChange={(e) => setProductForm({...productForm, isAvailable: e.target.checked})}
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Теги</InputLabel>
              <Select
                multiple
                value={productForm.tags}
                onChange={(e) => setProductForm({...productForm, tags: e.target.value as string[]})}
                label="Теги"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Отмена</Button>
          <Button onClick={handleSubmitProduct} variant="contained">
            {productForm.id ? 'Сохранить' : 'Создать'}
          </Button>
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

      {/* Tag Dialog */}
      <Dialog open={openTagDialog} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить тег</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="name"
              autoFocus
              margin="dense"
              label="Название тега *"
              fullWidth
              variant="outlined"
              value={tagForm.name}
              onChange={handleTagFormChange}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              name="color"
              margin="dense"
              label="Цвет"
              fullWidth
              variant="outlined"
              type="color"
              value={tagForm.color}
              onChange={handleTagFormChange}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTagDialog}>Отмена</Button>
          <Button onClick={handleSubmitTag} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={openOptionDialog} onClose={handleCloseOptionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить опцию</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="name"
              autoFocus
              margin="dense"
              label="Название опции *"
              fullWidth
              variant="outlined"
              value={optionForm.name}
              onChange={handleOptionFormChange}
              sx={{ mb: 2 }}
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Тип опции</InputLabel>
              <Select
                name="type"
                label="Тип опции"
                value={optionForm.type}
                onChange={handleOptionFormChange}
              >
                <MenuItem value="select">Выбор одного</MenuItem>
                <MenuItem value="multi">Множественный выбор</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={optionForm.required}
                  onChange={handleOptionSwitchChange}
                />
              }
              label="Обязательная опция"
              sx={{ mb: 2, display: 'block' }}
            />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Варианты выбора:
            </Typography>
            {optionForm.choices.map((choice, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  value={choice}
                  onChange={(e) => handleChoiceChange(index, e.target.value)}
                  label={`Вариант ${index + 1}`}
                  variant="outlined"
                  size="small"
                />
                <Button
                  disabled={optionForm.choices.length === 1}
                  onClick={() => removeChoice(index)}
                  color="error"
                >
                  Удалить
                </Button>
              </Box>
            ))}
            <Button onClick={addChoice} startIcon={<AddIcon />}>
              Добавить вариант
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOptionDialog}>Отмена</Button>
          <Button onClick={handleSubmitOption} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuManagement;