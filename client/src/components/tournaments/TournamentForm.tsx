import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TournamentFormData {
  name: string;
  description: string;
  gameFormat: string;
  maxParticipants: number;
  startDate: string;
  prizePool: string;
  rules: string;
}

interface TournamentFormProps {
  formData: TournamentFormData;
  onFormChange: (data: TournamentFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  isEdit?: boolean;
  isActive?: boolean;
}

export function TournamentForm({
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  isEdit = false,
  isActive = false,
}: TournamentFormProps) {
  const handleChange = (
    field: keyof TournamentFormData,
    value: string | number,
  ) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? "edit-" : ""}tournament-name`}>
            Tournament Name*
          </Label>
          <Input
            id={`${isEdit ? "edit-" : ""}tournament-name`}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Weekly Commander Night"
            data-testid={`input-${isEdit ? "edit-" : ""}tournament-name`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? "edit-" : ""}game-format`}>
            Game Format*
          </Label>
          <Select
            value={formData.gameFormat}
            onValueChange={(value) => handleChange("gameFormat", value)}
            disabled={isActive}
          >
            <SelectTrigger
              data-testid={`select-${isEdit ? "edit-" : ""}game-format`}
            >
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commander">Commander/EDH</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pokemon-standard">Pokemon Standard</SelectItem>
              <SelectItem value="lorcana-constructed">
                Lorcana Constructed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? "edit-" : ""}description`}>
          Description
        </Label>
        <Textarea
          id={`${isEdit ? "edit-" : ""}description`}
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe your tournament..."
          data-testid={`textarea-${isEdit ? "edit-" : ""}tournament-description`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? "edit-" : ""}max-participants`}>
            Max Participants
          </Label>
          <Select
            value={formData.maxParticipants.toString()}
            onValueChange={(value) =>
              handleChange("maxParticipants", parseInt(value))
            }
            disabled={isActive}
          >
            <SelectTrigger
              data-testid={`select-${isEdit ? "edit-" : ""}max-participants`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 Players</SelectItem>
              <SelectItem value="8">8 Players</SelectItem>
              <SelectItem value="16">16 Players</SelectItem>
              <SelectItem value="32">32 Players</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? "edit-" : ""}start-date`}>
            Start Date*
          </Label>
          <Input
            id={`${isEdit ? "edit-" : ""}start-date`}
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            disabled={isActive}
            data-testid={`input-${isEdit ? "edit-" : ""}start-date`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? "edit-" : ""}prize-pool`}>
          Prize Pool (Optional)
        </Label>
        <Input
          id={`${isEdit ? "edit-" : ""}prize-pool`}
          value={formData.prizePool}
          onChange={(e) => handleChange("prizePool", e.target.value)}
          placeholder="$100 store credit, booster packs, etc."
          data-testid={`input-${isEdit ? "edit-" : ""}prize-pool`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? "edit-" : ""}rules`}>
          Tournament Rules
        </Label>
        <Textarea
          id={`${isEdit ? "edit-" : ""}rules`}
          value={formData.rules}
          onChange={(e) => handleChange("rules", e.target.value)}
          placeholder="Special rules, deck restrictions, etc."
          data-testid={`textarea-${isEdit ? "edit-" : ""}tournament-rules`}
        />
      </div>

      {isActive && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              This tournament is active. Only name, description, rules, and
              prize pool can be edited.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          data-testid={`button-cancel-${isEdit ? "edit-" : ""}tournament`}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          data-testid={`button-submit-${isEdit ? "edit-" : ""}tournament`}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
