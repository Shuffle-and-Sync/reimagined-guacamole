import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CalendarLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface CalendarLayerToggleProps {
  layers: CalendarLayer[];
  onToggle: (layerId: string) => void;
}

export function CalendarLayerToggle({
  layers,
  onToggle,
}: CalendarLayerToggleProps) {
  return (
    <div className="space-y-2 p-4 border rounded-lg">
      <h4 className="font-medium mb-3">Calendar Layers</h4>
      {layers.map((layer) => (
        <div key={layer.id} className="flex items-center gap-2">
          <Checkbox
            id={layer.id}
            checked={layer.visible}
            onCheckedChange={() => onToggle(layer.id)}
          />
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: layer.color }}
          />
          <Label htmlFor={layer.id} className="cursor-pointer">
            {layer.name}
          </Label>
        </div>
      ))}
    </div>
  );
}
