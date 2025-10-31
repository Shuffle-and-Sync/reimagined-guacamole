import { useDroppable } from "@dnd-kit/core";
import React from "react";
import { cn } from "@/lib/utils";

interface DroppableTimeSlotProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableTimeSlot({
  id,
  children,
  className,
}: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "bg-primary/10 ring-2 ring-primary")}
    >
      {children}
    </div>
  );
}
