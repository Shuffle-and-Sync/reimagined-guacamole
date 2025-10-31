import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { cn } from "@/lib/utils";

interface DraggableEventProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function DraggableEvent({
  id,
  children,
  className,
  style,
  onClick,
}: DraggableEventProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });

  const draggableStyle = {
    ...style,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={draggableStyle}
      className={cn(className, isDragging && "z-50")}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
