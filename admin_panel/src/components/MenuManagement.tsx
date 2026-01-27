import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { menuAPI } from '../services/api';
import CategoriesTab from './MenuManagement/CategoriesTab';
import ProductsTab from './MenuManagement/ProductsTab';
import TagsTab from './MenuManagement/TagsTab';
import OptionsTab from './MenuManagement/OptionsTab';

// Интерфейсы
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
  category_id?: number | null;
  category_name?: string;
  price: number | string;
  costPrice: number | string;
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
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');

        // Получаем категории
        const categoriesRes = await menuAPI.getCategories();
        const categoriesData = categoriesRes.data;

        console.log('Raw categories data from API:', categoriesData);

        let categoriesArray: Category[] = [];

        if (Array.isArray(categoriesData)) {
          categoriesArray = categoriesData;
        } else if (categoriesData && categoriesData.results && Array.isArray(categoriesData.results)) {
          categoriesArray = categoriesData.results;
        } else if (categoriesData && categoriesData.data && Array.isArray(categoriesData.data)) {
          categoriesArray = categoriesData.data;
        } else {
          console.warn('Unexpected categories data format:', categoriesData);
        }

        // Создаем маппинг названий категорий
        const categoryNameToIdMap: Record<string, number> = {};
        const categoryIdToNameMap: Record<number, string> = {};

        categoriesArray.forEach(category => {
          if (category.name) {
            categoryNameToIdMap[category.name.toLowerCase().trim()] = category.id;
            categoryIdToNameMap[category.id] = category.name;
          }
        });

        // Получаем продукты
        const productsRes = await menuAPI.getProducts();
        const productsData = productsRes.data;

        console.log('Raw products data from API:', productsData);

        let productsArray: any[] = [];

        if (Array.isArray(productsData)) {
          productsArray = productsData;
        } else if (productsData && productsData.results && Array.isArray(productsData.results)) {
          productsArray = productsData.results;
        } else if (productsData && productsData.data && Array.isArray(productsData.data)) {
          productsArray = productsData.data;
        } else {
          console.warn('Unexpected products data format:', productsData);
        }

        const transformedProducts = productsArray.map((product: any) => {
          const price = parseFloat(product.price) || 0;
          const costPrice = parseFloat(product.cost_price || product.costPrice || 0) || 0;

          let categoryId: number | null = null;
          let categoryName = 'Не указана';

          if (product.category_id || product.categoryId) {
            categoryId = product.category_id || product.categoryId;
            categoryName = categoryIdToNameMap[categoryId] || product.category_name || product.category?.name || 'Не указана';
          }
          else if (product.category && typeof product.category === 'object') {
            categoryId = product.category.id;
            categoryName = product.category.name || 'Не указана';
          }
          else if (typeof product.category === 'string' && product.category !== 'Не указана') {
            const lowerCaseCategoryName = product.category.toLowerCase().trim();
            categoryId = categoryNameToIdMap[lowerCaseCategoryName] || null;
            categoryName = product.category;
          }
          else if (product.category_name) {
            const lowerCaseCategoryName = product.category_name.toLowerCase().trim();
            categoryId = categoryNameToIdMap[lowerCaseCategoryName] || null;
            categoryName = product.category_name;
          }

          const isAvailable = Boolean(
            product.in_stock ??
            product.is_available ??
            product.isAvailable ??
            product.available ??
            product.status === 'available' ??
            false
          );

          return {
            id: product.id,
            name: product.name || 'Без названия',
            category: categoryName,
            category_id: categoryId,
            category_name: categoryName,
            price: price,
            costPrice: costPrice,
            isAvailable: isAvailable,
            stockQuantity: product.stock_quantity || product.stockQuantity || 0,
            orderCount: product.order_count || product.orderCount || 0,
            tags: Array.isArray(product.tags) ? product.tags : [],
            description: product.description || '',
          };
        });

        console.log('Transformed products:', transformedProducts);

        setCategories(categoriesArray);
        setProducts(transformedProducts);

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

  // Обработчики для обновления данных
  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const handleUpdateTags = (newTags: Tag[]) => {
    setTags(newTags);
  };

  const handleUpdateOptions = (newOptions: Option[]) => {
    setOptions(newOptions);
  };

  // Функция для обновления доступности продукта
  const handleAvailabilityToggle = async (productId: number, newAvailability: boolean) => {
    const oldProducts = [...products];
    const productToUpdate = products.find(p => p.id === productId);

    if (!productToUpdate) {
      alert('Товар не найден');
      return;
    }

    try {
      // Оптимистичное обновление UI
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, isAvailable: newAvailability } : product
        )
      );

      await menuAPI.patchProduct(productId, {
        is_available: newAvailability
      });

      console.log(`Product ${productId} availability updated to: ${newAvailability}`);

    } catch (error: any) {
      console.error('Error updating product availability:', error);

      // Откатываем изменения в UI
      setProducts(oldProducts);

      let errorMessage = 'Ошибка при обновлении доступности товара';
      if (error.response?.data) {
        errorMessage += `: ${JSON.stringify(error.response.data)}`;
      }
      alert(errorMessage);
    }
  };

  // Функция для удаления продукта
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await menuAPI.deleteProduct(productId);

        setProducts(prevProducts =>
          prevProducts.filter(product => product.id !== productId)
        );
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении товара');
      }
    }
  };

  // Функция для удаления категории
  const handleDeleteCategory = async (categoryId: number) => {
    // Проверяем, есть ли товары в этой категории
    const productsInCategory = products.filter(p => {
      if (p.category_id === categoryId) return true;
      if (p.category && p.category !== 'Не указана') {
        const category = categories.find(c => c.id === categoryId);
        return category && p.category.toLowerCase().trim() === category.name.toLowerCase().trim();
      }
      return false;
    });

    if (productsInCategory.length > 0) {
      if (!window.confirm(`В этой категории есть ${productsInCategory.length} товаров. Удалить категорию вместе с товарами?`)) {
        return;
      }

      // Удаляем товары в категории
      for (const product of productsInCategory) {
        try {
          await menuAPI.deleteProduct(product.id);
        } catch (error) {
          console.error('Error deleting product:', error);
        }
      }
    }

    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        await menuAPI.deleteCategory(categoryId);

        setCategories(prevCategories =>
          prevCategories.filter(category => category.id !== categoryId)
        );

        // Обновляем продукты, которые ссылались на эту категорию
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          setProducts(prevProducts =>
            prevProducts.map(product =>
              product.category_id === categoryId ||
              (product.category && product.category.toLowerCase().trim() === category.name.toLowerCase().trim())
                ? { ...product, category: 'Не указана', category_id: null }
                : product
            )
          );
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Ошибка при удалении категории');
      }
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label={`Категории (${categories.length})`} />
          <Tab label={`Товары (${products.length})`} />
          <Tab label={`Теги (${tags.length})`} />
          <Tab label={`Опции (${options.length})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка данных...</Typography>
        </Box>
      ) : (
        <>
          {currentTab === 0 && (
            <CategoriesTab
              categories={categories}
              products={products}
              onUpdateCategories={handleUpdateCategories}
              onDeleteCategory={handleDeleteCategory}
              searchQuery={searchQuery}
            />
          )}
          {currentTab === 1 && (
            <ProductsTab
              products={products}
              categories={categories}
              onUpdateProducts={handleUpdateProducts}
              onAvailabilityToggle={handleAvailabilityToggle}
              onDeleteProduct={handleDeleteProduct}
            />
          )}
          {currentTab === 2 && (
            <TagsTab
              tags={tags}
              onUpdateTags={handleUpdateTags}
            />
          )}
          {currentTab === 3 && (
            <OptionsTab
              options={options}
              onUpdateOptions={handleUpdateOptions}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default MenuManagement;