import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  UserPlus, 
  MoreHorizontal, 
  Crown, 
  Star, 
  Mic, 
  Shield, 
  Check, 
  X,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useStreamCollaborators, 
  useAddStreamCollaborator, 
  useRemoveStreamCollaborator 
} from '../hooks/useCollaborativeStreaming';
import type { StreamCollaborator, CollaboratorInviteData } from '../types';

const collaboratorInviteSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email('Valid email required').optional(),
  role: z.enum(['host', 'co_host', 'guest', 'moderator']),
  platformHandles: z.record(z.string()).optional(),
  streamingCapabilities: z.array(z.string()).min(1, 'At least one capability required'),
  message: z.string().max(500).optional(),
});

type CollaboratorManagementProps = {
  eventId: string;
  isOwner?: boolean;
};

const ROLE_ICONS = {
  host: <Crown className="h-4 w-4" />,
  co_host: <Star className="h-4 w-4" />,
  guest: <Mic className="h-4 w-4" />,
  moderator: <Shield className="h-4 w-4" />,
};

const ROLE_COLORS = {
  host: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  co_host: 'bg-purple-100 text-purple-800 border-purple-200',
  guest: 'bg-blue-100 text-blue-800 border-blue-200',
  moderator: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS = {
  invited: 'bg-gray-100 text-gray-800 border-gray-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  removed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STREAMING_CAPABILITIES = [
  { value: 'host', label: 'Main Host' },
  { value: 'co_stream', label: 'Co-Stream' },
  { value: 'guest_appear', label: 'Guest Appearance' },
  { value: 'voice_chat', label: 'Voice Chat' },
  { value: 'screen_share', label: 'Screen Share' },
  { value: 'moderate_chat', label: 'Moderate Chat' },
];

export function CollaboratorManagement({ eventId, isOwner = false }: CollaboratorManagementProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { data: collaborators = [], isLoading } = useStreamCollaborators(eventId);
  const addCollaborator = useAddStreamCollaborator();
  const removeCollaborator = useRemoveStreamCollaborator();
  
  // Now properly typed with React Query generics

  const form = useForm<CollaboratorInviteData>({
    resolver: zodResolver(collaboratorInviteSchema),
    defaultValues: {
      role: 'guest',
      streamingCapabilities: ['guest_appear'],
      platformHandles: {},
    },
  });

  const onInviteSubmit = (data: CollaboratorInviteData) => {
    addCollaborator.mutate({
      eventId,
      collaboratorData: {
        eventId, // Required field
        userId: data.userId || '',
        role: data.role,
        status: 'invited',
        invitedBy: '', // This will be set by the backend
        platformHandles: typeof data.platformHandles === 'object' 
          ? JSON.stringify(data.platformHandles) 
          : data.platformHandles || '{}',
        streamingCapabilities: Array.isArray(data.streamingCapabilities)
          ? JSON.stringify(data.streamingCapabilities)
          : data.streamingCapabilities || '[]',
      },
    }, {
      onSuccess: () => {
        setIsInviteDialogOpen(false);
        form.reset();
      },
    });
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    removeCollaborator.mutate({ eventId, collaboratorId });
  };

  if (isLoading) {
    return (
      <Card data-testid="card-collaborators-loading">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-300 rounded" />
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-collaborator-management">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Collaborators ({collaborators.length})
        </CardTitle>
        {isOwner && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-invite-collaborator">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Collaborator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onInviteSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="collaborator@example.com" 
                            {...field} 
                            data-testid="input-collaborator-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-collaborator-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="co_host">Co-Host</SelectItem>
                            <SelectItem value="guest">Guest</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="streamingCapabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Streaming Capabilities</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {STREAMING_CAPABILITIES.map((capability) => (
                            <label
                              key={capability.value}
                              className="flex items-center space-x-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={field.value?.includes(capability.value) || false}
                                onChange={(e) => {
                                  const current = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...current, capability.value]);
                                  } else {
                                    field.onChange(current.filter(c => c !== capability.value));
                                  }
                                }}
                                data-testid={`checkbox-capability-${capability.value}`}
                              />
                              <span>{capability.label}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add a personal message to your invitation..."
                            {...field}
                            data-testid="textarea-invite-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      data-testid="button-cancel-invite"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addCollaborator.isPending}
                      data-testid="button-send-invite"
                    >
                      {addCollaborator.isPending ? 'Sending...' : 'Send Invite'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500" data-testid="text-no-collaborators">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No collaborators yet</p>
            <p className="text-sm">Invite streamers to collaborate on this event</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collaborator: StreamCollaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                data-testid={`collaborator-${collaborator.id}`}
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {collaborator.userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{collaborator.userId}</span>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${ROLE_COLORS[collaborator.role as keyof typeof ROLE_COLORS]}`}
                      >
                        {ROLE_ICONS[collaborator.role as keyof typeof ROLE_ICONS]}
                        {collaborator.role}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={STATUS_COLORS[collaborator.status as keyof typeof STATUS_COLORS]}
                      >
                        {collaborator.status === 'accepted' && <Check className="h-3 w-3 mr-1" />}
                        {collaborator.status === 'declined' && <X className="h-3 w-3 mr-1" />}
                        {collaborator.status === 'invited' && <Mail className="h-3 w-3 mr-1" />}
                        {collaborator.status}
                      </Badge>
                    </div>
                    
                    {(() => {
                      const capabilities = typeof collaborator.streamingCapabilities === 'string'
                        ? JSON.parse(collaborator.streamingCapabilities || '[]')
                        : (Array.isArray(collaborator.streamingCapabilities) ? collaborator.streamingCapabilities : []);
                      
                      return capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {capabilities.map((capability: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {STREAMING_CAPABILITIES.find(c => c.value === capability)?.label || capability}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {isOwner && collaborator.role !== 'host' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-collaborator-menu-${collaborator.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {/* TODO: Send message */}}
                        data-testid={`menu-message-${collaborator.id}`}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        className="text-destructive"
                        data-testid={`menu-remove-${collaborator.id}`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Collaborator
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}