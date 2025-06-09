
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
import { PlusCircle, X } from 'lucide-react'; // Changed Trash2 to X
import { ICON_LIST, GetIcon } from './icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Added ScrollArea and ScrollBar

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
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="categoryName" className="font-medium text-sm">New Category Name</Label>
            <Input
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Work, Study, Exercise"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="categoryIcon" className="font-medium text-sm">Icon</Label>
            <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
              <SelectTrigger id="categoryIcon" className="text-sm">
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </form>

        <div>
          <h3 className="font-semibold mb-2 text-base">Existing Categories:</h3>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">No categories added yet.</p>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex space-x-2 p-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium bg-card hover:bg-muted/50 shadow-sm"
                  >
                    <GetIcon name={category.icon} className="h-3.5 w-3.5 text-primary" />
                    <span className="text-foreground whitespace-nowrap">{category.name}</span>
                    <button
                      onClick={() => onDeleteCategory(category.id)}
                      aria-label={`Delete ${category.name} category`}
                      className="ml-1 p-0.5 rounded-full text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-1 focus:ring-destructive/50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
