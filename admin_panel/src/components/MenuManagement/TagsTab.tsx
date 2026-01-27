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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagsTabProps {
  tags: Tag[];
  onUpdateTags: (tags: Tag[]) => void;
}

const TagsTab: React.FC<TagsTabProps> = ({ tags, onUpdateTags }) => {
  const [openTagDialog, setOpenTagDialog] = useState(false);
  const [tagForm, setTagForm] = useState({
    name: '',
    color: '#1976d2',
  });

  const handleAddTag = () => {
    setTagForm({
      name: '',
      color: '#1976d2',
    });
    setOpenTagDialog(true);
  };

  const handleCloseTagDialog = () => {
    setOpenTagDialog(false);
  };

  const handleTagFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTagForm({
      ...tagForm,
      [name]: value,
    });
  };

  const handleSubmitTag = () => {
    const newTag = {
      id: tags.length + 1,
      name: tagForm.name,
      color: tagForm.color,
    };
    onUpdateTags([...tags, newTag]);
    setOpenTagDialog(false);
    setTagForm({
      name: '',
      color: '#1976d2',
    });
  };

  const handleDeleteTag = (tagId: number) => {
    const newTags = tags.filter(tag => tag.id !== tagId);
    onUpdateTags(newTags);
  };

  return (
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
                <IconButton size="small" onClick={() => handleDeleteTag(tag.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Box>
  );
};

export default TagsTab;