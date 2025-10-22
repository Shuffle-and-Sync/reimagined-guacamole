import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

interface CSVUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  communityId: string;
}

interface CSVEventRow {
  title?: string;
  type?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  [key: string]: string | undefined;
}

export function CSVUploadDialog({
  isOpen,
  onClose,
  onSuccess,
  communityId,
}: CSVUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVEventRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Please select a CSV file"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);

    Papa.parse(selectedFile, {
      header: true,
      complete: (results) => {
        const validationErrors: string[] = [];
        const validData: CSVEventRow[] = [];

        results.data.forEach((row: unknown, index) => {
          const csvRow = row as CSVEventRow;
          // Skip empty rows
          if (!csvRow.title && !csvRow.date) return;

          // Validate required fields
          if (!csvRow.title)
            validationErrors.push(`Row ${index + 1}: Missing title`);
          if (!csvRow.type)
            validationErrors.push(`Row ${index + 1}: Missing type`);
          if (!csvRow.date)
            validationErrors.push(`Row ${index + 1}: Missing date`);
          if (!csvRow.time)
            validationErrors.push(`Row ${index + 1}: Missing time`);
          if (!csvRow.location)
            validationErrors.push(`Row ${index + 1}: Missing location`);

          // Validate event type
          const validTypes = [
            "tournament",
            "convention",
            "release",
            "game_pod",
            "community",
          ];
          if (csvRow.type && !validTypes.includes(csvRow.type)) {
            validationErrors.push(
              `Row ${index + 1}: Invalid type '${csvRow.type}'. Must be one of: ${validTypes.join(", ")}`,
            );
          }

          if (Object.keys(csvRow).some((key) => csvRow[key])) {
            validData.push(csvRow);
          }
        });

        setErrors(validationErrors);
        setPreview(validData.slice(0, 10)); // Show first 10 rows
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      },
    });
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) return;

    setIsUploading(true);

    try {
      const events = preview.map((row) => ({
        title: row.title,
        description: row.description || "",
        type: row.type,
        date: row.date,
        time: row.time,
        location: row.location,
        communityId: communityId,
        playerSlots: row.playerSlots ? parseInt(row.playerSlots) : undefined,
        alternateSlots: row.alternateSlots
          ? parseInt(row.alternateSlots)
          : undefined,
        gameFormat: row.gameFormat || undefined,
        powerLevel: row.powerLevel ? parseInt(row.powerLevel) : undefined,
        maxAttendees: row.maxAttendees ? parseInt(row.maxAttendees) : undefined,
      }));

      const response = await fetch("/api/events/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error("Failed to create events");
      }

      const createdEvents = await response.json();

      toast({
        title: "Success!",
        description: `Created ${createdEvents.length} events`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload events",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    onClose();
  };

  const downloadTemplate = () => {
    const template = `title,description,type,date,time,location,playerSlots,alternateSlots,gameFormat,powerLevel,maxAttendees
Weekly EDH Pod,Commander night,game_pod,2024-12-20,18:00,Local Game Store,4,2,commander,7,
Friday Night Magic,Standard tournament,tournament,2024-12-22,19:00,LGS Downtown,,,,,32
Holiday Party,Year end celebration,community,2024-12-25,14:00,Community Center,,,,,50`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "events-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Events from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple events at once. Download the
            template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="mt-8"
            >
              <i className="fas fa-download mr-2"></i>
              Download Template
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="font-semibold mb-2">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {errors.length > 5 && (
                    <li>...and {errors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                Preview (showing first 10 rows):
              </h3>
              <div className="border rounded overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.time}</TableCell>
                        <TableCell>{row.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                preview.length === 0 || errors.length > 0 || isUploading
              }
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Upload {preview.length} Events
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
