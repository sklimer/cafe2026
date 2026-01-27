import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

interface Option {
  id: number;
  name: string;
  type: string;
  required: boolean;
  choices: string[];
}

interface OptionsTabProps {
  options: Option[];
  onUpdateOptions: (options: Option[]) => void;
}

const OptionsTab: React.FC<OptionsTabProps> = ({ options, onUpdateOptions }) => {
  const [openOptionDialog, setOpenOptionDialog] = useState(false);
  const [optionForm, setOptionForm] = useState({
    name: '',
    type: 'select',
    required: false,
    choices: [''],
  });

  const handleAddOption = () => {
    setOptionForm({
      name: '',
      type: 'select',
      required: false,
      choices: [''],
    });
    setOpenOptionDialog(true);
  };

  const handleCloseOptionDialog = () => {
    setOpenOptionDialog(false);
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

  const handleSubmitOption = () => {
    const newOption = {
      id: options.length + 1,
      name: optionForm.name,
      type: optionForm.type,
      required: optionForm.required,
      choices: optionForm.choices.filter(choice => choice.trim() !== ''),
    };
    onUpdateOptions([...options, newOption]);
    setOpenOptionDialog(false);
    setOptionForm({
      name: '',
      type: 'select',
      required: false,
      choices: [''],
    });
  };

  const handleDeleteOption = (optionId: number) => {
    const newOptions = options.filter(option => option.id !== optionId);
    onUpdateOptions(newOptions);
  };

  return (
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
                <IconButton size="small" onClick={() => handleDeleteOption(option.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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

export default OptionsTab;