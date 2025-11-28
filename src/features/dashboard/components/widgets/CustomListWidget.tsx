/**
 * CustomListWidget Component
 *
 * Widget de liste personnalisée avec checkboxes et priorités - Responsive
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { List, Circle } from 'lucide-react';
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
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <List size={18} className="flex-shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-sm">Liste vide</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map(item => (
              <li
                key={item.id}
                className="flex items-start gap-2 group hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded transition-colors overflow-hidden"
              >
                {showCheckboxes ? (
                  <Checkbox
                    checked={item.checked || false}
                    onCheckedChange={() => handleToggle(item.id)}
                    disabled={!editable}
                    className="mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <Circle
                    size={6}
                    className={`mt-1.5 flex-shrink-0 ${getPriorityColor(item.priority)}`}
                    fill="currentColor"
                  />
                )}

                <span
                  className={`
                    text-xs sm:text-sm flex-1 min-w-0 break-words
                    ${item.checked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                  `}
                  style={{ wordBreak: 'break-word' }}
                >
                  {item.text}
                </span>

                {item.priority && !showCheckboxes && (
                  <span
                    className={`text-[10px] font-medium ${getPriorityColor(item.priority)} uppercase flex-shrink-0`}
                  >
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
