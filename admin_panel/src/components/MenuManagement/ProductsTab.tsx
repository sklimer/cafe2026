
import React, { useState, useRef } from 'react';
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
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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

  const uploadImages = async (productId: number): Promise<{ main_image_url: string; image_urls: string[] }> => {
    const formData = new FormData();

    // Find main image and additional images
    const mainImage = productImages.find(img => img.isMain && img.file);
    const additionalImages = productImages.filter(img => !img.isMain && img.file);

    // Append main image if exists and is new
    if (mainImage && mainImage.file && mainImage.isNew) {
      formData.append('main_image', mainImage.file);
    }

    // Append additional images if they are new
    additionalImages.forEach((img, index) => {
      if (img.file && img.isNew) {
        formData.append(`additional_images`, img.file);
      }
    });

    // Only make API call if there are new images to upload
    if ((mainImage && mainImage.file && mainImage.isNew) || additionalImages.some(img => img.file && img.isNew)) {
      try {
        // Create axios instance with multipart/form-data headers for file upload
        const uploadApi = axios.create({
          baseURL: env.REACT_APP_API_URL || '/api/',
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Add CSRF token
        const csrfToken = await getCsrfToken();
        if (csrfToken) {
          uploadApi.defaults.headers.common['X-CSRFToken'] = csrfToken;
        }

        // Upload images to a dedicated endpoint
        const response = await uploadApi.post(`/products/${productId}/upload-images/`, formData);

        // Return the uploaded image URLs from the response
        return {
          main_image_url: response.data.main_image_url || '',
          image_urls: response.data.image_urls || []
        };
      } catch (error) {
        console.error('Error uploading images:', error);
        // If upload fails, return empty URLs
        return {
          main_image_url: '',
          image_urls: []
        };
      }
    } else {
      // If no new images to upload, return empty strings since we don't want to send temporary URLs
      // The images that were already stored on the server should remain unchanged
      // We don't send any image URLs in this case to avoid overwriting with temporary URLs
      return {
        main_image_url: '',  // Don't update with temporary URLs
        image_urls: []       // Don't update with temporary URLs
      };
    }
  };

  const updateProductWithImages = async (productId: number, productData: any) => {
    try {
      // Check if there are new images to upload
      const hasNewImages = productImages.some(img => img.file && img.isNew);

      if (hasNewImages) {
        const uploadedImages = await uploadImages(productId);

        // Only update images if we have actual URLs from successful upload
        if (uploadedImages.main_image_url || uploadedImages.image_urls.length > 0) {
          // Используем PATCH для частичного обновления изображений
          return await menuAPI.patchProduct(productId, {
            main_image_url: uploadedImages.main_image_url,
            image_urls: uploadedImages.image_urls
          });
        }
      }
      return null;
    } catch (uploadError: any) {
      console.error('Error uploading images:', uploadError);

      // Подробная информация об ошибке
      if (uploadError.response?.data) {
        console.error('Server error details for images:', uploadError.response.data);
        throw new Error(`Ошибка загрузки изображений: ${JSON.stringify(uploadError.response.data)}`);
      } else if (uploadError.message) {
        throw new Error(`Ошибка загрузки изображений: ${uploadError.message}`);
      } else {
        throw new Error('Неизвестная ошибка при загрузке изображений');
      }
    }
  };

  const handleSubmitProduct = async () => {
    try {
      // Валидация формы
      if (!productForm.name.trim()) {
        showSnackbar('Пожалуйста, заполните название товара', 'error');
        return;
      }

      if (!productForm.description.trim()) {
        showSnackbar('Пожалуйста, заполните описание товара', 'error');
        return;
      }

      if (!productForm.price || parseFloat(productForm.price) <= 0) {
        showSnackbar('Пожалуйста, укажите корректную цену', 'error');
        return;
      }

      const isEditing = Boolean(productForm.id);

      // Создаем базовый объект продукта
      const productData: any = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price) || 0,
        is_available: productForm.isAvailable,
        stock_quantity: parseInt(productForm.stockQuantity) || 0,
        tags: productForm.tags || [],
      };

      // Добавляем необязательные поля, если они заполнены
      if (productForm.short_description.trim()) {
        productData.short_description = productForm.short_description.trim();
      }

      if (productForm.old_price && parseFloat(productForm.old_price) > 0) {
        productData.old_price = parseFloat(productForm.old_price);
      }

      if (productForm.weight_grams) {
        productData.weight_grams = parseInt(productForm.weight_grams);
      }

      if (productForm.calories) {
        productData.calories = parseInt(productForm.calories);
      }

      if (productForm.cooking_time_minutes) {
        productData.cooking_time_minutes = parseInt(productForm.cooking_time_minutes);
      }

      // Флаги
      productData.is_vegetarian = productForm.is_vegetarian;
      productData.is_spicy = productForm.is_spicy;
      productData.is_popular = productForm.is_popular;
      productData.is_new = productForm.is_new;

      // Категория - если выбрана
      if (productForm.category) {
        const categoryId = parseInt(productForm.category);
        // Проверяем, существует ли такая категория
        const categoryExists = categories.find(c => c.id === categoryId);
        if (categoryExists) {
          productData.category = categoryId; // Передаем ID категории
        } else {
          showSnackbar(`Категория с ID ${categoryId} не найдена. Выберите существующую категорию.`, 'error');
          return;
        }
      }

      console.log('Submitting product:', productData);

      let productId: number;
      let response;

      // Сначала создаем/обновляем продукт
      if (isEditing && productForm.id) {
        response = await menuAPI.updateProduct(productForm.id, productData);
        productId = productForm.id;
      } else {
        response = await menuAPI.createProduct(productData);
        productId = response.data.id;
      }

      console.log('Server response:', response);

      // Если успешно создали/обновили
      if (response.status >= 200 && response.status < 300) {
        // Затем обновляем изображения, если они есть
        if (productImages.length > 0) {
          setUploadingImages(true);
          try {
            await updateProductWithImages(productId, productData);
          } catch (uploadError: any) {
            console.error('Error uploading images:', uploadError);
            // Не показываем ошибку пользователю, только в консоль
            // Товар уже сохранен, изображения можно загрузить позже
          } finally {
            setUploadingImages(false);
          }
        }

        // Обновляем список продуктов
        try {
          const productsRes = await menuAPI.getProducts();
          const data = productsRes.data;

          let productsArray: any[] = [];
          if (Array.isArray(data)) {
            productsArray = data;
          } else if (data && data.results && Array.isArray(data.results)) {
            productsArray = data.results;
          } else if (data && data.data && Array.isArray(data.data)) {
            productsArray = data.data;
          }

          const transformedProducts = productsArray.map((product: any) => {
            const price = parseFloat(product.price) || 0;
            const oldPrice = parseFloat(product.old_price) || null;
            const isAvailable = Boolean(
              product.in_stock ??
              product.is_available ??
              product.isAvailable ??
              product.available ??
              product.status === 'available' ??
              false
            );

            const categoryId = product.category?.id || product.category_id || product.categoryId || null;
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
              stockQuantity: product.stock_quantity || product.stockQuantity || 0,
              orderCount: product.order_count || product.orderCount || 0,
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

          onUpdateProducts(transformedProducts);
          handleCloseProductDialog();

          showSnackbar(
            isEditing ? 'Товар успешно обновлен' : 'Товар успешно создан',
            'success'
          );
          console.log(isEditing ? 'Product updated successfully' : 'Product created successfully');
        } catch (refreshError) {
          console.error('Error refreshing products list:', refreshError);
          showSnackbar('Товар сохранен, но возникла ошибка при обновлении списка', 'warning');
        }
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error creating/updating product:', error);

      // Подробная информация об ошибке
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);

        // Показываем детали ошибки пользователю
        let errorMessage = 'Ошибка при сохранении товара:\n';

        if (error.response.data.detail) {
          errorMessage += error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Парсим ошибки валидации Django
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

  return (
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