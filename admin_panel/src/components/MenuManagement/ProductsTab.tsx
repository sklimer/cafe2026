import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Grid,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ImageIcon from '@mui/icons-material/Image';
import { menuAPI, getCsrfToken } from '../../services/api';
import { env } from '../../config/env';

interface Product {
  id: number;
  name: string;
  category: string;
  category_id?: number | null;
  category_name?: string;
  price: number | string;
  costPrice: number | string;
  isAvailable: boolean;
  stockQuantity: number;
  orderCount: number;
  tags: string[];
  description: string;
  main_image_url?: string;
  image_urls?: string[];
  short_description?: string;
  old_price?: number | string;
  weight_grams?: number;
  calories?: number;
  cooking_time_minutes?: number;
  is_vegetarian?: boolean;
  is_spicy?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  onUpdateProducts: (products: Product[]) => void;
  onAvailabilityToggle: (productId: number, newAvailability: boolean) => void;
  onDeleteProduct: (productId: number) => void;
}

interface ProductImage {
  url: string;
  file?: File;
  isNew?: boolean;
  isMain?: boolean;
}

const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  categories,
  onUpdateProducts,
  onAvailabilityToggle,
  onDeleteProduct,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояния для серверной пагинации
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [productForm, setProductForm] = useState({
    id: undefined as number | undefined,
    name: '',
    category: '',
    price: '',
    isAvailable: true,
    stockQuantity: '0',
    tags: [] as string[],
    description: '',
    short_description: '',
    old_price: '',
    weight_grams: '',
    calories: '',
    cooking_time_minutes: '',
    is_vegetarian: false,
    is_spicy: false,
    is_popular: false,
    is_new: false,
  });

  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  // Заглушка для тегов
  const tags: Tag[] = [
    { id: 1, name: 'Новинка', color: '#4caf50' },
    { id: 2, name: 'Хит продаж', color: '#ff9800' },
    { id: 3, name: 'Вегетарианское', color: '#8bc34a' },
    { id: 4, name: 'Острое', color: '#f44336' },
  ];

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const productColumns: GridColDef[] = [
    {
      field: 'checkbox',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <input
          type="checkbox"
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
    {
      field: 'image',
      headerName: 'Изображение',
      width: 80,
      renderCell: (params) => (
        <Avatar
          src={params.row.main_image_url}
          variant="rounded"
          sx={{ width: 40, height: 40 }}
        >
          {!params.row.main_image_url && <ImageIcon />}
        </Avatar>
      )
    },
    { field: 'name', headerName: 'Название', width: 180 },
    {
      field: 'category',
      headerName: 'Категория',
      width: 130,
      renderCell: (params) => {
        const categoryId = params.row.category_id;
        const categoryName = params.row.category;

        if (categoryId) {
          return (
            <Tooltip title={`ID: ${categoryId}`}>
              <span>{categoryName}</span>
            </Tooltip>
          );
        }

        return <span>{categoryName}</span>;
      }
    },
    {
      field: 'price',
      headerName: 'Цена',
      width: 100,
      renderCell: (params) => {
        const price = typeof params.value === 'number' ? params.value : parseFloat(params.value) || 0;
        return `${price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}₽`;
      }
    },
    {
      field: 'old_price',
      headerName: 'Старая цена',
      width: 110,
      renderCell: (params) => {
        const oldPrice = params.value;
        if (!oldPrice) return '-';
        const price = typeof oldPrice === 'number' ? oldPrice : parseFloat(oldPrice) || 0;
        return (
          <Typography color="error" sx={{ textDecoration: 'line-through' }}>
            {price.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}₽
          </Typography>
        );
      }
    },
    {
      field: 'isAvailable',
      headerName: 'Доступен',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => onAvailabilityToggle(params.row.id, e.target.checked)}
        />
      )
    },
    { field: 'stockQuantity', headerName: 'Остаток', width: 90 },
    {
      field: 'badges',
      headerName: 'Метки',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {params.row.is_new && (
            <Chip label="Новинка" size="small" color="success" variant="outlined" />
          )}
          {params.row.is_popular && (
            <Chip label="Популярное" size="small" color="warning" variant="outlined" />
          )}
          {params.row.is_vegetarian && (
            <Chip label="Вегетарианское" size="small" color="info" variant="outlined" />
          )}
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
          <IconButton size="small" onClick={() => onDeleteProduct(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    },
  ];

  // Функция загрузки продуктов с сервера
  const loadProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: paginationModel.page + 1, // MUI использует 0-based, а сервер 1-based
        page_size: paginationModel.pageSize,
      };

      // Добавляем сортировку
      if (sortModel.length > 0) {
        const sortField = sortModel[0].field;
        const sortOrder = sortModel[0].sort;
        params.ordering = sortOrder === 'desc' ? `-${sortField}` : sortField;
      }

      // Добавляем поиск
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await menuAPI.getProducts(params);
      const data = response.data;

      console.log('Products API response:', data);

      let productsArray: any[] = [];
      let totalCount = 0;

      // Обрабатываем различные форматы ответа
      if (Array.isArray(data)) {
        productsArray = data;
        totalCount = data.length;
      } else if (data && data.results && Array.isArray(data.results)) {
        productsArray = data.results;
        totalCount = data.count || 0;
      } else if (data && data.data && Array.isArray(data.data)) {
        productsArray = data.data;
        totalCount = data.total || 0;
      }

      // Преобразование продуктов
      const transformedProducts = productsArray.map((product: any) => {
        const price = parseFloat(product.price) || 0;
        const oldPrice = parseFloat(product.old_price) || null;
        const isAvailable = Boolean(product.is_available ?? true);

        const categoryId = product.category?.id || product.category_id || null;
        const categoryName = categories.find(c => c.id === categoryId)?.name ||
                           product.category?.name ||
                           product.category_name ||
                           product.category ||
                           'Не указана';

        return {
          id: product.id,
          name: product.name || 'Без названия',
          category: categoryName,
          category_id: categoryId,
          category_name: categoryName,
          price: price,
          old_price: oldPrice,
          costPrice: product.cost_price || 0,
          isAvailable: isAvailable,
          stockQuantity: product.stock_quantity || 0,
          orderCount: product.order_count || 0,
          tags: Array.isArray(product.tags) ? product.tags : [],
          description: product.description || '',
          short_description: product.short_description || '',
          main_image_url: product.main_image_url || '',
          image_urls: product.image_urls || [],
          weight_grams: product.weight_grams || null,
          calories: product.calories || null,
          cooking_time_minutes: product.cooking_time_minutes || null,
          is_vegetarian: product.is_vegetarian || false,
          is_spicy: product.is_spicy || false,
          is_popular: product.is_popular || false,
          is_new: product.is_new || false,
        };
      });

      console.log('Transformed products count:', transformedProducts.length);
      console.log('Total count from server:', totalCount);

      setRowCount(totalCount);
      onUpdateProducts(transformedProducts);

    } catch (error) {
      console.error('Error loading products:', error);
      showSnackbar('Ошибка загрузки товаров', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем продукты при изменении параметров
  useEffect(() => {
    loadProducts();
  }, [paginationModel, sortModel, searchQuery]);

  // Обновляем счетчик строк при изменении продуктов
  useEffect(() => {
    if (products.length > 0 && rowCount === 0) {
      // Если у нас есть продукты, но rowCount не установлен, показываем приблизительное значение
      setRowCount(products.length * 2); // Примерное значение
    }
  }, [products, rowCount]);

  const handleEditProduct = (product: Product) => {
    console.log('Редактирование продукта:', product);

    let categoryIdForForm = '';
    if (product.category_id) {
      categoryIdForForm = product.category_id.toString();
    } else if (product.category && product.category !== 'Не указана') {
      const foundCategory = categories.find(cat =>
        cat.name.toLowerCase().trim() === product.category.toLowerCase().trim()
      );
      if (foundCategory) {
        categoryIdForForm = foundCategory.id.toString();
      }
    }

    // Собираем все изображения
    const allImages: ProductImage[] = [];

    // Основное изображение
    if (product.main_image_url) {
      allImages.push({
        url: product.main_image_url,
        isNew: false,
        isMain: true
      });
    }

    // Дополнительные изображения
    if (product.image_urls && Array.isArray(product.image_urls)) {
      product.image_urls.forEach(url => {
        allImages.push({
          url,
          isNew: false,
          isMain: false
        });
      });
    }

    setProductImages(allImages);

    setProductForm({
      id: product.id,
      name: product.name,
      category: categoryIdForForm,
      price: typeof product.price === 'number' ? product.price.toString() : product.price,
      isAvailable: product.isAvailable,
      stockQuantity: product.stockQuantity?.toString() || '0',
      tags: Array.isArray(product.tags) ? product.tags : [],
      description: product.description || '',
      short_description: product.short_description || '',
      old_price: product.old_price?.toString() || '',
      weight_grams: product.weight_grams?.toString() || '',
      calories: product.calories?.toString() || '',
      cooking_time_minutes: product.cooking_time_minutes?.toString() || '',
      is_vegetarian: product.is_vegetarian || false,
      is_spicy: product.is_spicy || false,
      is_popular: product.is_popular || false,
      is_new: product.is_new || false,
    });
    setOpenProductDialog(true);
  };

  const handleAddProduct = () => {
    setProductForm({
      id: undefined,
      name: '',
      category: '',
      price: '',
      isAvailable: true,
      stockQuantity: '0',
      tags: [],
      description: '',
      short_description: '',
      old_price: '',
      weight_grams: '',
      calories: '',
      cooking_time_minutes: '',
      is_vegetarian: false,
      is_spicy: false,
      is_popular: false,
      is_new: false,
    });
    setProductImages([]);
    setOpenProductDialog(true);
  };

  const handleCloseProductDialog = () => {
    setOpenProductDialog(false);
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ProductImage[] = [];
    const newFiles: File[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        newImages.push({
          url: imageUrl,
          file,
          isNew: true,
          isMain: productImages.length === 0 && newImages.length === 0 // Первое изображение будет основным
        });
        newFiles.push(file);
      }
    });

    // Добавляем изображения к существующим
    const updatedImages = [...productImages, ...newImages];

    // Если нет основного изображения, делаем первое основным
    if (!productImages.some(img => img.isMain) && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
    }

    setProductImages(updatedImages);

    // Сбрасываем значение input, чтобы можно было загружать те же файлы снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = productImages[index];

    // Если удаляем основное изображение, делаем следующее изображение основным
    if (imageToRemove.isMain) {
      const remainingImages = productImages.filter((_, i) => i !== index);
      if (remainingImages.length > 0) {
        remainingImages[0].isMain = true;
      }
    }

    // Удаляем из списка
    const updatedImages = productImages.filter((_, i) => i !== index);

    setProductImages(updatedImages);
  };

  const handleSetMainImage = (index: number) => {
    const updatedImages = productImages.map((img, i) => ({
      ...img,
      isMain: i === index
    }));
    setProductImages(updatedImages);
  };

  const handleSubmitProduct = async () => {
    try {
      // Валидация формы
      if (!productForm.name.trim()) {
        showSnackbar('Пожалуйста, заполните название товара', 'error');
        return;
      }

      if (!productForm.price || parseFloat(productForm.price) <= 0) {
        showSnackbar('Пожалуйста, укажите корректную цену', 'error');
        return;
      }

      const isEditing = Boolean(productForm.id);

      // Создаем FormData для отправки данных с файлами
      const formData = new FormData();

      // Добавляем текстовые поля
      formData.append('name', productForm.name.trim());
      formData.append('description', productForm.description.trim());
      formData.append('price', parseFloat(productForm.price).toString());
      formData.append('is_available', productForm.isAvailable.toString());
      formData.append('stock_quantity', parseInt(productForm.stockQuantity).toString() || '0');

      // Добавляем необязательные поля
      if (productForm.short_description.trim()) {
        formData.append('short_description', productForm.short_description.trim());
      }

      if (productForm.old_price && parseFloat(productForm.old_price) > 0) {
        formData.append('old_price', parseFloat(productForm.old_price).toString());
      }

      if (productForm.weight_grams) {
        formData.append('weight_grams', productForm.weight_grams);
      }

      if (productForm.calories) {
        formData.append('calories', productForm.calories);
      }

      if (productForm.cooking_time_minutes) {
        formData.append('cooking_time_minutes', productForm.cooking_time_minutes);
      }

      // Флаги
      formData.append('is_vegetarian', productForm.is_vegetarian.toString());
      formData.append('is_spicy', productForm.is_spicy.toString());
      formData.append('is_popular', productForm.is_popular.toString());
      formData.append('is_new', productForm.is_new.toString());

      // Категория
      if (productForm.category) {
        const categoryId = parseInt(productForm.category);
        const categoryExists = categories.find(c => c.id === categoryId);
        if (categoryExists) {
          formData.append('category', categoryId.toString());
        }
      }

      // ВАЖНО: Добавляем изображения правильно
      // Находим основное изображение
      const mainImage = productImages.find(img => img.isMain && img.file);

      // Добавляем основное изображение (если есть новое)
      if (mainImage && mainImage.file) {
        formData.append('main_image', mainImage.file);
      }

      // Добавляем дополнительные изображения (только новые)
      productImages.forEach((image) => {
        if (image.file && !image.isMain) {
          formData.append('additional_images', image.file);
        }
      });

      console.log('Submitting product with FormData');

      let response;
      let productId: number;

      // Создаем или обновляем товар
      if (isEditing && productForm.id) {
        response = await menuAPI.updateProduct(productForm.id, formData);
        productId = productForm.id;
      } else {
        response = await menuAPI.createProduct(formData);
        productId = response.data.id;
      }

      console.log('Server response:', response);

      // Перезагружаем продукты
      await loadProducts();
      handleCloseProductDialog();

      showSnackbar(
        isEditing ? 'Товар успешно обновлен' : 'Товар успешно создан',
        'success'
      );

    } catch (error: any) {
      console.error('Error creating/updating product:', error);

      // Подробная информация об ошибке
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);

        let errorMessage = 'Ошибка при сохранении товара:\n';

        if (error.response.data.detail) {
          errorMessage += error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          Object.keys(error.response.data).forEach(key => {
            if (Array.isArray(error.response.data[key])) {
              errorMessage += `${key}: ${error.response.data[key].join(', ')}\n`;
            } else {
              errorMessage += `${key}: ${error.response.data[key]}\n`;
            }
          });
        } else if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }

        showSnackbar(errorMessage, 'error');
      } else if (error.message) {
        showSnackbar(`Ошибка: ${error.message}`, 'error');
      } else {
        showSnackbar('Ошибка при сохранении товара', 'error');
      }
    }
  };

  // Обработчики пагинации и сортировки
  const handlePaginationModelChange = (newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  };

  const handleSortModelChange = (newModel: GridSortModel) => {
    setSortModel(newModel);
  };

  // Обработчик поиска
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Сбрасываем пагинацию при поиске
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
  };

  return (
    <Box>
      {/* Панель управления */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="div">
          Управление товарами
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Поле поиска */}
          <TextField
            placeholder="Поиск товаров..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ width: 300 }}
          />
          <Button variant="contained" onClick={handleAddProduct} startIcon={<AddIcon />}>
            Добавить товар
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 600 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Товары ({rowCount})
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : products.length > 0 ? (
          <DataGrid
            rows={products}
            columns={productColumns}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            paginationMode="server"
            sortingMode="server"
            rowCount={rowCount}
            pageSizeOptions={[10, 20, 50, 100]}
            loading={loading}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-virtualScroller': {
                overflow: 'auto',
              }
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery ? 'Товары не найдены по вашему запросу' : 'Товары не найдены'}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Product Dialog */}
      <Dialog
        open={openProductDialog}
        onClose={handleCloseProductDialog}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>{productForm.id ? 'Редактировать товар' : 'Добавить товар'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Левая колонка - Основная информация */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  name="name"
                  autoFocus
                  margin="dense"
                  label="Название *"
                  fullWidth
                  variant="outlined"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  required
                  error={!productForm.name.trim()}
                  helperText={!productForm.name.trim() ? "Обязательное поле" : ""}
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Категория</InputLabel>
                    <Select
                      name="category"
                      label="Категория"
                      value={productForm.category}
                      onChange={handleProductFormChange}
                    >
                      <MenuItem value="">Не выбрана</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id.toString()}>
                          {cat.name} (ID: {cat.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="price"
                    label="Цена *"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    required
                    error={!productForm.price || parseFloat(productForm.price) <= 0}
                    helperText={(!productForm.price || parseFloat(productForm.price) <= 0) ? "Укажите цену больше 0" : ""}
                    InputProps={{
                      endAdornment: <Typography color="textSecondary">₽</Typography>
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="old_price"
                    label="Старая цена"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={productForm.old_price}
                    onChange={handleProductFormChange}
                    InputProps={{
                      endAdornment: <Typography color="textSecondary">₽</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="stockQuantity"
                    label="Остаток"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={handleProductFormChange}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <TextField
                  name="description"
                  label="Описание *"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  required
                  error={!productForm.description.trim()}
                  helperText={!productForm.description.trim() ? "Обязательное поле" : ""}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  name="short_description"
                  label="Краткое описание"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={productForm.short_description}
                  onChange={handleProductFormChange}
                  placeholder="Краткое описание для карточки товара (необязательно)"
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="weight_grams"
                    label="Вес (г)"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={productForm.weight_grams}
                    onChange={handleProductFormChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="calories"
                    label="Калории"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={productForm.calories}
                    onChange={handleProductFormChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="cooking_time_minutes"
                    label="Время готовки (мин)"
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={productForm.cooking_time_minutes}
                    onChange={handleProductFormChange}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth sx={{ mb: 3 }}>
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
            </Grid>

            {/* Правая колонка - Изображения и флаги */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Изображения товара
                </Typography>

                {/* Кнопка загрузки */}
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Загрузить изображения
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </Button>

                {/* Предупреждение о основном изображении */}
                {productImages.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Щелкните на изображение, чтобы сделать его основным. Основное изображение отмечено синей рамкой.
                  </Alert>
                )}

                {/* Список изображений */}
                <Stack spacing={2}>
                  {productImages.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        border: image.isMain ? '2px solid #1976d2' : '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': {
                          '& .overlay': {
                            opacity: 1,
                          }
                        }
                      }}
                      onClick={() => handleSetMainImage(index)}
                    >
                      <Avatar
                        src={image.url}
                        variant="rounded"
                        sx={{ width: '100%', height: 120 }}
                      >
                        <ImageIcon sx={{ fontSize: 40 }} />
                      </Avatar>

                      {/* Наклейка "Основное" */}
                      {image.isMain && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#1976d2',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                          }}
                        >
                          Основное
                        </Box>
                      )}

                      {/* Кнопка удаления */}
                      <Box
                        className="overlay"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                        >
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                {productImages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2">
                      Изображения не загружены
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Загрузите изображения или оставьте поле пустым
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Флаги товара
                </Typography>

                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.isAvailable}
                        onChange={(e) => setProductForm({...productForm, isAvailable: e.target.checked})}
                      />
                    }
                    label="Доступен"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.is_new}
                        onChange={(e) => setProductForm({...productForm, is_new: e.target.checked})}
                      />
                    }
                    label="Новинка"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.is_popular}
                        onChange={(e) => setProductForm({...productForm, is_popular: e.target.checked})}
                      />
                    }
                    label="Популярное"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.is_vegetarian}
                        onChange={(e) => setProductForm({...productForm, is_vegetarian: e.target.checked})}
                      />
                    }
                    label="Вегетарианское"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productForm.is_spicy}
                        onChange={(e) => setProductForm({...productForm, is_spicy: e.target.checked})}
                      />
                    }
                    label="Острое"
                  />
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {uploadingImages && (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          )}
          <Button onClick={handleCloseProductDialog} disabled={uploadingImages}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmitProduct}
            variant="contained"
            disabled={uploadingImages || !productForm.name.trim() || !productForm.description.trim() || !productForm.price || parseFloat(productForm.price) <= 0}
          >
            {uploadingImages ? 'Загрузка...' : (productForm.id ? 'Сохранить' : 'Создать')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({...snackbar, open: false})}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductsTab;