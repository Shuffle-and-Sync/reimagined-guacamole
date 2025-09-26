import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  // Handle long messages by breaking them into multiple lines with proper indentation
  const prefix = `${formattedTime} [${source}]`;
  const maxLineLength = 120; // Reasonable terminal width
  const indentLength = prefix.length + 1; // +1 for the space
  
  if (message.length + indentLength <= maxLineLength) {
    // Short message, log normally
    console.log(`${prefix} ${message}`);
  } else {
    // Long message, split into multiple lines with proper indentation
    const words = message.split(' ');
    let currentLine = '';
    const lines = [];
    
    for (const word of words) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length + indentLength <= maxLineLength) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Log first line with full prefix
    console.log(`${prefix} ${lines[0]}`);
    
    // Log continuation lines with proper indentation
    const indent = ' '.repeat(indentLength);
    for (let i = 1; i < lines.length; i++) {
      console.log(`${indent}${lines[i]}`);
    }
  }
}

export function serveStatic(app: Express) {
  // Use safe path resolution for production
  const dirname = typeof import.meta !== 'undefined' && import.meta.dirname 
    ? import.meta.dirname 
    : process.cwd();
  
  // In production, the built server is in dist/index.js and public is in dist/public
  // In development, we serve from the current working directory
  let distPath: string;
  
  if (process.env.NODE_ENV === 'production') {
    // For production build, assume we're running from dist/index.js
    // So public directory is at ./public relative to the built script
    distPath = path.resolve(dirname, "public");
    
    // If that doesn't exist, try relative to process.cwd()
    if (!fs.existsSync(distPath)) {
      distPath = path.resolve(process.cwd(), "dist", "public");
    }
  } else {
    // Development mode
    distPath = path.resolve(dirname, "public");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}