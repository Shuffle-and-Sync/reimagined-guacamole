import { fn } from "@storybook/test";
import { CalendarHeader } from "./CalendarHeader";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * CalendarHeader displays navigation controls for the calendar
 *
 * Extracted from calendar.tsx to improve maintainability and reduce file size.
 * Provides month navigation and a "Today" button to quickly return to the current date.
 *
 * @example
 * ```tsx
 * <CalendarHeader
 *   currentDate={new Date()}
 *   onPreviousMonth={() => console.log('prev')}
 *   onNextMonth={() => console.log('next')}
 *   onToday={() => console.log('today')}
 * />
 * ```
 */
const meta = {
  title: "Calendar/CalendarHeader",
  component: CalendarHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    currentDate: {
      control: "date",
      description: "The currently displayed month",
    },
  },
} satisfies Meta<typeof CalendarHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default calendar header showing January 2024
 */
export const Default: Story = {
  args: {
    currentDate: new Date(2024, 0, 15), // January 15, 2024
    onPreviousMonth: fn(),
    onNextMonth: fn(),
    onToday: fn(),
  },
};

/**
 * Calendar header showing December (year-end month)
 */
export const December: Story = {
  args: {
    currentDate: new Date(2024, 11, 25), // December 25, 2024
    onPreviousMonth: fn(),
    onNextMonth: fn(),
    onToday: fn(),
  },
};

/**
 * Calendar header showing February (short month)
 */
export const February: Story = {
  args: {
    currentDate: new Date(2024, 1, 15), // February 15, 2024
    onPreviousMonth: fn(),
    onNextMonth: fn(),
    onToday: fn(),
  },
};

/**
 * Calendar header showing current month
 */
export const CurrentMonth: Story = {
  args: {
    currentDate: new Date(),
    onPreviousMonth: fn(),
    onNextMonth: fn(),
    onToday: fn(),
  },
};
