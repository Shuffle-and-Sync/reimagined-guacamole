import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/contexts/CommunityContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user } = useAuth();
  const { communities } = useCommunity();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [primaryCommunity, setPrimaryCommunity] = useState('');

  // Initialize form values when user or dialog opens
  useEffect(() => {
    if (user && open) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPrimaryCommunity(user.primaryCommunity || '');
    }
  }, [user, open]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; primaryCommunity: string }) => {
      return apiRequest('PATCH', '/api/user/profile', data);
    },
    onSuccess: () => {
      toast({ title: 'Profile updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: 'Failed to update profile', 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      primaryCommunity: primaryCommunity || '',
    });
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const first = firstName?.[0] || user.firstName?.[0] || "";
    const last = lastName?.[0] || user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  const selectedCommunityData = communities.find(c => c.id === primaryCommunity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <i className="fas fa-user text-primary"></i>
            <span>Edit Profile</span>
          </DialogTitle>
          <DialogDescription>
            Update your personal information and gaming preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {selectedCommunityData && (
                <div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center"
                  style={{ backgroundColor: selectedCommunityData.themeColor }}
                  title={`${selectedCommunityData.displayName} Member`}
                >
                  <i className={`${selectedCommunityData.iconClass} text-white text-xs`}></i>
                </div>
              )}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                data-testid="input-last-name"
              />
            </div>
          </div>

          {/* Primary Community */}
          <div className="space-y-2">
            <Label htmlFor="primaryCommunity">Primary Gaming Community</Label>
            <Select value={primaryCommunity} onValueChange={setPrimaryCommunity}>
              <SelectTrigger data-testid="select-primary-community">
                <SelectValue placeholder="Choose your main gaming community" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific community</SelectItem>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: community.themeColor }}
                      ></div>
                      <i className={`${community.iconClass} text-sm`}></i>
                      <span>{community.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This affects your default community selection and theming.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}