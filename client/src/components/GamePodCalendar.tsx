import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Plus, Settings, Copy, RotateCcw } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import JoinPodButton from '@/components/JoinPodButton';

interface GamePodCalendarProps {
  communityId: string;
  communityName: string;
  theme: any; // Community theme object
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location: string;
  playerSlots: number;
  alternateSlots: number;
  gameFormat: string;
  powerLevel: number;
  creator: any;
  creatorId: string;
  attendeeCount: number;
  mainPlayers: number;
  alternates: number;
}

const GAME_FORMATS = [
  { id: 'commander', name: 'Commander', icon: 'fas fa-crown' },
  { id: 'standard', name: 'Standard', icon: 'fas fa-shield-alt' },
  { id: 'limited', name: 'Limited', icon: 'fas fa-box' },
  { id: 'legacy', name: 'Legacy', icon: 'fas fa-scroll' },
  { id: 'modern', name: 'Modern', icon: 'fas fa-bolt' },
  { id: 'draft', name: 'Draft', icon: 'fas fa-random' },
];

const POWER_LEVELS = [
  { value: 1, label: 'Casual (1-2)', description: 'Precons and simple decks' },
  { value: 3, label: 'Focused (3-4)', description: 'Some synergy and power' },
  { value: 5, label: 'Optimized (5-6)', description: 'Strong synergy and efficiency' },
  { value: 7, label: 'High Power (7-8)', description: 'Fast mana and powerful plays' },
  { value: 9, label: 'cEDH (9-10)', description: 'Competitive tournament level' },
];

export default function GamePodCalendar({ communityId, communityName, theme }: GamePodCalendarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calendar state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  
  // Game pod creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkScheduleOpen, setIsBulkScheduleOpen] = useState(false);
  const [podTitle, setPodTitle] = useState('');
  const [podDescription, setPodDescription] = useState('');
  const [podDate, setPodDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [podTime, setPodTime] = useState('19:00');
  const [podLocation, setPodLocation] = useState('Online');
  const [playerSlots, setPlayerSlots] = useState(4);
  const [alternateSlots, setAlternateSlots] = useState(2);
  const [gameFormat, setGameFormat] = useState('commander');
  const [powerLevel, setPowerLevel] = useState(5);
  
  // Recurring schedule state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  // Bulk schedule state
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [bulkTimes, setBulkTimes] = useState<string[]>(['19:00']);

  // Fetch calendar events for the current view
  const { data: calendarEvents = [], isLoading } = useQuery({
    queryKey: ['/api/calendar/events', communityId, currentWeek],
    queryFn: async () => {
      const startDate = format(startOfWeek(currentWeek), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(addDays(currentWeek, view === 'week' ? 6 : 27)), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/calendar/events?communityId=${communityId}&startDate=${startDate}&endDate=${endDate}&type=game_pod`);
      if (!response.ok) throw new Error('Failed to fetch calendar events');
      return response.json();
    },
  });

  // Create single game pod
  const createPodMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          type: 'game_pod',
          communityId,
        }),
      });
      if (!response.ok) throw new Error('Failed to create game pod');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events', communityId] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Game pod created successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to create game pod', variant: 'destructive' });
    },
  });

  // Create recurring events
  const createRecurringMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/events/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          type: 'game_pod',
          communityId,
          isRecurring: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to create recurring events');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events', communityId] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: `Created ${data.length} recurring game pods!` });
    },
    onError: () => {
      toast({ title: 'Failed to create recurring events', variant: 'destructive' });
    },
  });

  // Create bulk events
  const createBulkMutation = useMutation({
    mutationFn: async (eventsData: any[]) => {
      const response = await fetch('/api/events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsData.map(event => ({
            ...event,
            type: 'game_pod',
            communityId,
          })),
        }),
      });
      if (!response.ok) throw new Error('Failed to create bulk events');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events', communityId] });
      setIsBulkScheduleOpen(false);
      resetBulkForm();
      toast({ title: `Created ${data.length} game pods!` });
    },
    onError: () => {
      toast({ title: 'Failed to create bulk events', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setPodTitle('');
    setPodDescription('');
    setPodDate(format(new Date(), 'yyyy-MM-dd'));
    setPodTime('19:00');
    setPodLocation('Online');
    setPlayerSlots(4);
    setAlternateSlots(2);
    setGameFormat('commander');
    setPowerLevel(5);
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setRecurrenceInterval(1);
    setRecurrenceEndDate('');
  };

  const resetBulkForm = () => {
    setBulkDates([]);
    setBulkTimes(['19:00']);
  };

  const handleCreatePod = () => {
    if (!podTitle || !podDate || !podTime) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const eventData = {
      title: podTitle,
      description: podDescription,
      date: podDate,
      time: podTime,
      location: podLocation,
      playerSlots,
      alternateSlots,
      gameFormat,
      powerLevel,
      isPublic: true,
    };

    if (isRecurring && recurrenceEndDate) {
      createRecurringMutation.mutate({
        ...eventData,
        recurrencePattern,
        recurrenceInterval,
        recurrenceEndDate,
      });
    } else {
      createPodMutation.mutate(eventData);
    }
  };

  const handleBulkSchedule = () => {
    if (bulkDates.length === 0 || bulkTimes.length === 0) {
      toast({ title: 'Please select dates and times', variant: 'destructive' });
      return;
    }

    const eventsData = [];
    for (const date of bulkDates) {
      for (const time of bulkTimes) {
        eventsData.push({
          title: podTitle || `${gameFormat.charAt(0).toUpperCase() + gameFormat.slice(1)} Pod`,
          description: podDescription,
          date,
          time,
          location: podLocation,
          playerSlots,
          alternateSlots,
          gameFormat,
          powerLevel,
          isPublic: true,
        });
      }
    }

    createBulkMutation.mutate(eventsData);
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarEvents.filter((event: CalendarEvent) => event.date === dateStr);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const addBulkDate = () => {
    const newDate = format(new Date(), 'yyyy-MM-dd');
    setBulkDates(prev => [...prev, newDate]);
  };

  const updateBulkDate = (index: number, date: string) => {
    setBulkDates(prev => prev.map((d, i) => i === index ? date : d));
  };

  const removeBulkDate = (index: number) => {
    setBulkDates(prev => prev.filter((_, i) => i !== index));
  };

  const addBulkTime = () => {
    setBulkTimes(prev => [...prev, '19:00']);
  };

  const updateBulkTime = (index: number, time: string) => {
    setBulkTimes(prev => prev.map((t, i) => i === index ? time : t));
  };

  const removeBulkTime = (index: number) => {
    setBulkTimes(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-2" style={{ borderColor: theme.colors.primary, background: theme.gradients.card }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                 style={{ background: theme.gradients.primary }}>
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>
                Game Pod Calendar
              </CardTitle>
              <CardDescription style={{ color: theme.colors.textSecondary }}>
                Schedule and manage {communityName} game sessions
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkScheduleOpen} onOpenChange={setIsBulkScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-bulk-schedule">
                  <Copy className="h-4 w-4 mr-1" />
                  Bulk Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Schedule Game Pods</DialogTitle>
                  <DialogDescription>
                    Create multiple game pods across different dates and times
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Bulk scheduling form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Game Format</Label>
                      <Select value={gameFormat} onValueChange={setGameFormat}>
                        <SelectTrigger data-testid="select-bulk-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {GAME_FORMATS.map((format) => (
                            <SelectItem key={format.id} value={format.id}>
                              <div className="flex items-center gap-2">
                                <i className={format.icon}></i>
                                {format.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Power Level</Label>
                      <Select value={powerLevel.toString()} onValueChange={(v) => setPowerLevel(Number(v))}>
                        <SelectTrigger data-testid="select-bulk-power">
                          <SelectValue placeholder="Select power level" />
                        </SelectTrigger>
                        <SelectContent>
                          {POWER_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value.toString()}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Dates</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addBulkDate}
                        data-testid="button-add-bulk-date"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Date
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {bulkDates.map((date, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={date}
                            onChange={(e) => updateBulkDate(index, e.target.value)}
                            data-testid={`input-bulk-date-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBulkDate(index)}
                            data-testid={`button-remove-bulk-date-${index}`}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Times */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Times</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addBulkTime}
                        data-testid="button-add-bulk-time"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Time
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {bulkTimes.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => updateBulkTime(index, e.target.value)}
                            data-testid={`input-bulk-time-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBulkTime(index)}
                            data-testid={`button-remove-bulk-time-${index}`}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsBulkScheduleOpen(false)}
                      data-testid="button-cancel-bulk"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleBulkSchedule}
                      disabled={createBulkMutation.isPending}
                      data-testid="button-create-bulk"
                    >
                      {createBulkMutation.isPending ? 'Creating...' : `Create ${bulkDates.length * bulkTimes.length} Pods`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-pod">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pod
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Game Pod</DialogTitle>
                  <DialogDescription>
                    Schedule a new game session for {communityName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="pod-title">Pod Title</Label>
                    <Input
                      id="pod-title"
                      placeholder="Commander Night, Draft Pod, etc."
                      value={podTitle}
                      onChange={(e) => setPodTitle(e.target.value)}
                      data-testid="input-pod-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pod-description">Description</Label>
                    <Textarea
                      id="pod-description"
                      placeholder="Describe the game session, power level, themes, etc."
                      value={podDescription}
                      onChange={(e) => setPodDescription(e.target.value)}
                      data-testid="textarea-pod-description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pod-date">Date</Label>
                      <Input
                        id="pod-date"
                        type="date"
                        value={podDate}
                        onChange={(e) => setPodDate(e.target.value)}
                        data-testid="input-pod-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pod-time">Time</Label>
                      <Input
                        id="pod-time"
                        type="time"
                        value={podTime}
                        onChange={(e) => setPodTime(e.target.value)}
                        data-testid="input-pod-time"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pod-location">Location</Label>
                    <Input
                      id="pod-location"
                      placeholder="Online, Local Game Store, etc."
                      value={podLocation}
                      onChange={(e) => setPodLocation(e.target.value)}
                      data-testid="input-pod-location"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Game Format</Label>
                      <Select value={gameFormat} onValueChange={setGameFormat}>
                        <SelectTrigger data-testid="select-pod-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {GAME_FORMATS.map((format) => (
                            <SelectItem key={format.id} value={format.id}>
                              <div className="flex items-center gap-2">
                                <i className={format.icon}></i>
                                {format.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Power Level</Label>
                      <Select value={powerLevel.toString()} onValueChange={(v) => setPowerLevel(Number(v))}>
                        <SelectTrigger data-testid="select-pod-power">
                          <SelectValue placeholder="Select power level" />
                        </SelectTrigger>
                        <SelectContent>
                          {POWER_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value.toString()}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Player Slots</Label>
                      <Select value={playerSlots.toString()} onValueChange={(v) => setPlayerSlots(Number(v))}>
                        <SelectTrigger data-testid="select-player-slots">
                          <SelectValue placeholder="Number of players" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Players</SelectItem>
                          <SelectItem value="3">3 Players</SelectItem>
                          <SelectItem value="4">4 Players</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Alternate Slots</Label>
                      <Select value={alternateSlots.toString()} onValueChange={(v) => setAlternateSlots(Number(v))}>
                        <SelectTrigger data-testid="select-alternate-slots">
                          <SelectValue placeholder="Number of alternates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No Alternates</SelectItem>
                          <SelectItem value="1">1 Alternate</SelectItem>
                          <SelectItem value="2">2 Alternates</SelectItem>
                          <SelectItem value="3">3 Alternates</SelectItem>
                          <SelectItem value="4">4 Alternates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recurring options */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recurring-toggle">Make this a recurring pod</Label>
                      <Switch
                        id="recurring-toggle"
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                        data-testid="switch-recurring"
                      />
                    </div>
                    
                    {isRecurring && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Repeat</Label>
                          <Select value={recurrencePattern} onValueChange={(value) => setRecurrencePattern(value as "daily" | "weekly" | "monthly")}>
                            <SelectTrigger data-testid="select-recurrence-pattern">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Every</Label>
                          <Select value={recurrenceInterval.toString()} onValueChange={(v) => setRecurrenceInterval(Number(v))}>
                            <SelectTrigger data-testid="select-recurrence-interval">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} {recurrencePattern}(s)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={recurrenceEndDate}
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                            data-testid="input-recurrence-end"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-pod">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreatePod}
                      disabled={createPodMutation.isPending || createRecurringMutation.isPending}
                      data-testid="button-submit-pod"
                    >
                      {createPodMutation.isPending || createRecurringMutation.isPending ? 'Creating...' : 
                       isRecurring ? 'Create Recurring Pods' : 'Create Pod'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')} data-testid="button-prev-week">
              ←
            </Button>
            <h3 className="font-medium">
              {format(startOfWeek(currentWeek), 'MMM d')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')} data-testid="button-next-week">
              →
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentWeek(new Date())}
            data-testid="button-today"
          >
            Today
          </Button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getWeekDays().map((date) => {
            const dayEvents = getEventsForDate(date);
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);

            return (
              <div
                key={date.toString()}
                className={`min-h-[120px] p-1 border rounded cursor-pointer transition-colors ${
                  isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
                  isSelected ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
                }`}
                onClick={() => setSelectedDate(date)}
                data-testid={`calendar-day-${format(date, 'yyyy-MM-dd')}`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(date, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event: CalendarEvent) => {
                    const formatData = GAME_FORMATS.find(f => f.id === event.gameFormat);
                    const isFull = event.mainPlayers >= event.playerSlots;
                    
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate ${
                          isFull ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                          event.mainPlayers > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        }`}
                        title={`${event.title} - ${formatData?.name || event.gameFormat} (${event.mainPlayers}/${event.playerSlots}+${event.alternates})`}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-center gap-1">
                          <i className={formatData?.icon || 'fas fa-gamepad'} style={{ fontSize: '8px' }}></i>
                          <span className="truncate">{event.title}</span>
                        </div>
                        <div className="text-xs opacity-75">
                          {event.time} • {event.mainPlayers}/{event.playerSlots}
                          {event.alternates > 0 && `+${event.alternates}`}
                        </div>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected date events */}
        {selectedDate && (
          <div className="mt-6 p-4 border rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
            <h3 className="font-medium mb-3" style={{ color: theme.colors.text }}>
              Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map((event: CalendarEvent) => {
                const formatData = GAME_FORMATS.find(f => f.id === event.gameFormat);
                const powerLevelData = POWER_LEVELS.find(p => p.value === event.powerLevel);
                const isFull = event.mainPlayers >= event.playerSlots;
                
                return (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isFull ? 'bg-red-500' : event.mainPlayers > 0 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}>
                          <i className={`${formatData?.icon || 'fas fa-gamepad'} text-white text-sm`}></i>
                        </div>
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><Clock className="h-3 w-3 inline mr-1" />{event.time}</span>
                            <span><Users className="h-3 w-3 inline mr-1" />
                              {event.mainPlayers}/{event.playerSlots}
                              {event.alternates > 0 && ` (+${event.alternates} alt)`}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {formatData?.name || event.gameFormat}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              PL {event.powerLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isFull ? 'destructive' : event.mainPlayers > 0 ? 'secondary' : 'default'}>
                          {isFull ? 'Full' : event.mainPlayers > 0 ? 'Open' : 'New'}
                        </Badge>
                        <JoinPodButton 
                          event={event} 
                          isFull={isFull}
                          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/calendar/events', communityId] })}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
              {getEventsForDate(selectedDate).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No game pods scheduled for this date
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}