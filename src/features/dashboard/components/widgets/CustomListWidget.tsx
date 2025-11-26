/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-refresh/only-export-components, @typescript-eslint/ban-ts-comment, react-hooks/exhaustive-deps */
/**
 * CustomListWidget Component
 *
 * Widget de liste personnalisée avec checkboxes et priorités
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { List, CheckSquare, Square, Circle } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/checkbox';

interface ListItem {
  id: string;
  text: string;
  checked?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

interface CustomListWidgetProps {
  title: string;
  items: ListItem[];
  editable?: boolean;
  showCheckboxes?: boolean;
  onItemToggle?: (itemId: string) => void;
}

export const CustomListWidget = ({
  title,
  items = [],
  editable = false,
  showCheckboxes = false,
  onItemToggle,
}: CustomListWidgetProps) => {
  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    const colorMap = {
      low: 'text-green-500',
      medium: 'text-yellow-500',
      high: 'text-red-500',
    };

    return priority ? colorMap[priority] : 'text-gray-400';
  };

  const handleToggle = (itemId: string) => {
    if (editable && onItemToggle) {
      onItemToggle(itemId);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <List size={20} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Liste vide</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
              >
                {showCheckboxes ? (
                  <Checkbox
                    checked={item.checked || false}
                    onCheckedChange={() => handleToggle(item.id)}
                    disabled={!editable}
                    className="mt-1"
                  />
                ) : (
                  <Circle
                    size={8}
                    className={`mt-2 flex-shrink-0 ${getPriorityColor(item.priority)}`}
                    fill="currentColor"
                  />
                )}

                <span
                  className={`
                    text-sm flex-1
                    ${item.checked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                  `}
                >
                  {item.text}
                </span>

                {item.priority && !showCheckboxes && (
                  <span className={`text-xs font-medium ${getPriorityColor(item.priority)} uppercase`}>
                    {item.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
