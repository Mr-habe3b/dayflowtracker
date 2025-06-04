
'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category } from '@/types/dayflow';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ICON_LIST, GetIcon } from './icons';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function CategoryManager({ categories, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(ICON_LIST[0]?.name || 'CircleDot');
  const { toast } = useToast();

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast({ title: 'Error', description: 'Category name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (categories.find(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({ title: 'Error', description: 'Category name already exists.', variant: 'destructive' });
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(), // Simple unique ID
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
    };
    onAddCategory(newCategory);
    setNewCategoryName('');
    toast({ title: 'Success', description: `Category "${newCategory.name}" added.` });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4">
        <CardTitle className="font-headline text-xl">Manage Categories</CardTitle>
        <CardDescription>Create and organize your activity categories.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form onSubmit={handleAddCategory} className="space-y-3 mb-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="font-medium">New Category Name</Label>
            <Input
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Work, Study, Exercise"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryIcon" className="font-medium">Icon</Label>
            <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
              <SelectTrigger id="categoryIcon" className="bg-white">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {ICON_LIST.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center gap-2">
                      <GetIcon name={icon.name} className="h-4 w-4" />
                      {icon.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </form>

        <h3 className="font-semibold mb-2 text-lg">Existing Categories:</h3>
        {categories.length === 0 ? (
          <p className="text-muted-foreground">No categories added yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between p-2 rounded-md border-b border-border last:border-b-0">
                <div className="flex items-center gap-2">
                  <GetIcon name={category.icon} className="h-5 w-5 text-primary" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDeleteCategory(category.id)} aria-label={`Delete ${category.name} category`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
