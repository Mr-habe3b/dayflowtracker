'use client';
import type { LucideProps } from 'lucide-react';
import {
  Briefcase,
  BedDouble,
  Gamepad2,
  Dumbbell,
  Home,
  BookOpen,
  Utensils,
  ShoppingCart,
  Plane,
  Smile,
  CircleDot,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import type React from 'react';

export const ICON_LIST: { name: string; component: LucideIcon }[] = [
  { name: 'Briefcase', component: Briefcase },
  { name: 'BedDouble', component: BedDouble },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Home', component: Home },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Utensils', component: Utensils },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Plane', component: Plane },
  { name: 'Smile', component: Smile },
  { name: 'Pencil', component: Pencil },
  { name: 'CircleDot', component: CircleDot },
];

const iconMap: Record<string, LucideIcon> = ICON_LIST.reduce(
  (acc, curr) => {
    acc[curr.name] = curr.component;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

export const GetIcon = ({ name, ...props }: { name: string } & LucideProps): React.ReactElement | null => {
  const IconComponent = iconMap[name] || CircleDot; // Default to CircleDot if not found
  return <IconComponent {...props} />;
};
