import React, { useState, useMemo } from 'react';
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
  IconButton,
  Collapse,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Divider,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { menuAPI } from '../../services/api';

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
}

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  onUpdateCategories: (categories: Category[]) => void;
  onDeleteCategory: (categoryId: number) => void;
  searchQuery: string;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  products,
  onUpdateCategories,
  onDeleteCategory,
  searchQuery,
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' as 'asc' | 'desc' });
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: null as number | null,
    name: '',
    parentId: '',
    description: '',
    is_active: true,
    is_visible: true,
  });

  // Мемоизированный расчет статистики категорий
  const categoryStats = useMemo(() => {
    const stats: Record<number, { productCount: number; childrenCount: number }> = {};

    categories.forEach(category => {
      stats[category.id] = { productCount: 0, childrenCount: 0 };
    });

    products.forEach(product => {
      if (product.category_id) {
        if (stats[product.category_id]) {
          stats[product.category_id].productCount++;
        } else {
          stats[product.category_id] = { productCount: 1, childrenCount: 0 };
        }
      } else if (product.category && product.category !== 'Не указана') {
        const foundCategory = categories.find(cat =>
          cat.name.toLowerCase().trim() === product.category.toLowerCase().trim()
        );
        if (foundCategory) {
          stats[foundCategory.id].productCount++;
        }
      }
    });

    categories.forEach(category => {
      if (category.parent) {
        if (stats[category.parent]) {
          stats[category.parent].childrenCount++;
        }
      }
    });

    return stats;
  }, [categories, products]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedCategories = [...categories].sort((a, b) => {
    if (sortConfig.field === 'name') {
      return sortConfig.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortConfig.field === 'product_count') {
      const countA = categoryStats[a.id]?.productCount || 0;
      const countB = categoryStats[b.id]?.productCount || 0;
      return sortConfig.direction === 'asc' ? countA - countB : countB - countA;
    }
    if (sortConfig.field === 'children_count') {
      const countA = categoryStats[a.id]?.childrenCount || 0;
      const countB = categoryStats[b.id]?.childrenCount || 0;
      return sortConfig.direction === 'asc' ? countA - countB : countB - countA;
    }
    return 0;
  });

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

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
  };

  const handleCategoryFormChange = (e: any) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value,
    }));
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

      if (categoryForm.id) {
        await menuAPI.updateCategory(categoryForm.id, categoryData);
      } else {
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

      onUpdateCategories(categoriesArray);
      setOpenCategoryDialog(false);
      setCategoryForm({
        id: null,
        name: '',
        parentId: '',
        description: '',
        is_active: true,
        is_visible: true,
      });

    } catch (error) {
      console.error(categoryForm.id ? 'Error updating category:' : 'Error creating category:', error);
      alert(categoryForm.id ? 'Ошибка при обновлении категории' : 'Ошибка при создании категории');
    }
  };

  const toggleCategoryStatus = async (categoryId: number, field: 'is_active' | 'is_visible') => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    try {
      const newValue = !category[field];
      await menuAPI.updateCategory(categoryId, {
        [field]: newValue
      });

      const updatedCategories = categories.map(cat =>
        cat.id === categoryId ? { ...cat, [field]: newValue } : cat
      );
      onUpdateCategories(updatedCategories);
    } catch (error) {
      console.error('Error updating category status:', error);
      alert('Ошибка при обновлении статуса категории');
    }
  };

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
      const stats = categoryStats[category.id] || { productCount: 0, childrenCount: 0 };
      const isExpanded = expandedCategories.includes(category.id);

      return (
        <div key={category.id}>
          <Card
            sx={{
              ml: level * 3,
              mb: 1,
              borderLeft: level > 0 ? `3px solid ${category.is_active ? '#4caf50' : '#f44336'}` : 'none',
              backgroundColor: isExpanded ? '#f5f5f5' : 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 3,
                backgroundColor: '#fafafa',
              },
            }}
          >
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Avatar
                    src={category.image_url || category.icon_url}
                    sx={{
                      mr: 2,
                      bgcolor: category.is_active ? 'primary.main' : 'grey.500',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {category.is_active ? <FolderOpenIcon /> : <FolderIcon />}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight="medium" sx={{ mr: 1 }}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={`ID: ${category.id}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      {category.restaurant_name && (
                        <Chip
                          label={category.restaurant_name}
                          size="small"
                          icon={<RestaurantIcon />}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>

                    {category.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {category.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Tooltip title={category.is_active ? "Активна" : "Неактивна"}>
                        <Chip
                          icon={category.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                          label={category.is_active ? "Активна" : "Неактивна"}
                          size="small"
                          color={category.is_active ? "success" : "error"}
                          variant="outlined"
                          clickable
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryStatus(category.id, 'is_active');
                          }}
                        />
                      </Tooltip>

                      <Tooltip title={category.is_visible ? "Видима" : "Скрыта"}>
                        <Chip
                          icon={category.is_visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          label={category.is_visible ? "Видима" : "Скрыта"}
                          size="small"
                          color={category.is_visible ? "info" : "default"}
                          variant="outlined"
                          clickable
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryStatus(category.id, 'is_visible');
                          }}
                        />
                      </Tooltip>

                      <Tooltip title={`Количество товаров: ${stats.productCount}`}>
                        <Chip
                          icon={<LocalOfferIcon />}
                          label={`Товаров: ${stats.productCount}`}
                          size="small"
                          variant="outlined"
                          color={stats.productCount > 0 ? "primary" : "default"}
                        />
                      </Tooltip>

                      {hasChildren && (
                        <Tooltip title="Дочерние категории">
                          <Chip
                            icon={<CategoryIcon />}
                            label={`Подкатегорий: ${stats.childrenCount}`}
                            size="small"
                            variant="outlined"
                            color={stats.childrenCount > 0 ? "secondary" : "default"}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Редактировать">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Удалить">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.id); }}
                      sx={{ mr: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>

                  {hasChildren && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.id);
                      }}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </Box>
              </Box>

              {category.created_at && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">
                    Создана: {new Date(category.created_at).toLocaleDateString('ru-RU')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {hasChildren && isExpanded && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2 }}>
                {renderCategoryTree(categoriesList, category.id, level + 1)}
              </Box>
            </Collapse>
          )}
        </div>
      );
    });
  };

  const renderCategoriesTable = () => {
    const filteredCategories = sortedCategories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'name'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('name')}
                >
                  Название
                </TableSortLabel>
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'product_count'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('product_count')}
                >
                  Товары
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.field === 'children_count'}
                  direction={sortConfig.direction}
                  onClick={() => handleSort('children_count')}
                >
                  Подкатегории
                </TableSortLabel>
              </TableCell>
              <TableCell>Ресторан</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.map((category) => {
              const stats = categoryStats[category.id] || { productCount: 0, childrenCount: 0 };
              return (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={category.image_url || category.icon_url}
                        sx={{ mr: 2, width: 32, height: 32 }}
                      >
                        <FolderIcon />
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {category.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={category.id} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {category.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={stats.productCount}
                      size="small"
                      color={stats.productCount > 0 ? "primary" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={stats.childrenCount}
                      size="small"
                      color={stats.childrenCount > 0 ? "secondary" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {category.restaurant_name ? (
                      <Chip label={category.restaurant_name} size="small" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title={category.is_active ? "Активна" : "Неактивна"}>
                        <CheckCircleIcon
                          fontSize="small"
                          color={category.is_active ? "success" : "disabled"}
                        />
                      </Tooltip>
                      <Tooltip title={category.is_visible ? "Видима" : "Скрыта"}>
                        {category.is_visible ? (
                          <VisibilityIcon fontSize="small" color="action" />
                        ) : (
                          <VisibilityOffIcon fontSize="small" color="action" />
                        )}
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Редактировать">
                        <IconButton size="small" onClick={() => handleEditCategory(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton size="small" onClick={() => onDeleteCategory(category.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Категории ({categories.length})
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              Всего товаров: {products.length}
            </Typography>
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Дерево категорий">
                <Button
                  variant={viewMode === 'tree' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('tree')}
                  startIcon={<SubdirectoryArrowRightIcon />}
                >
                  Дерево
                </Button>
              </Tooltip>
              <Tooltip title="Таблица категорий">
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  startIcon={<SortByAlphaIcon />}
                >
                  Таблица
                </Button>
              </Tooltip>
            </Box>

            <Button variant="contained" onClick={handleAddCategory} startIcon={<AddIcon />}>
              Добавить категорию
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {categories.length > 0 ? (
          <Box>
            {viewMode === 'tree' ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Щелкните по категории, чтобы развернуть/свернуть подкатегории. Используйте кнопки для управления статусами.
                </Alert>
                {renderCategoryTree(categories)}
              </Box>
            ) : (
              renderCategoriesTable()
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CategoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Категории не найдены
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Создайте первую категорию для организации вашего меню
            </Typography>
            <Button variant="contained" onClick={handleAddCategory} startIcon={<AddIcon />}>
              Создать категорию
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {expandedCategories.length > 0
              ? `Развернуто категорий: ${expandedCategories.length} из ${categories.length}`
              : 'Используйте кнопки развертывания для просмотра подкатегорий'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => setExpandedCategories(categories.filter(cat =>
                categories.some(c => c.parent === cat.id)
              ).map(cat => cat.id))}
            >
              Развернуть все
            </Button>
            <Button size="small" onClick={() => setExpandedCategories([])}>
              Свернуть все
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{categoryForm.id ? 'Редактировать категорию' : 'Добавить категорию'}</DialogTitle>
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
          <Button onClick={handleSubmitCategory} variant="contained">
            {categoryForm.id ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesTab;