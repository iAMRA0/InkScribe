# Medical Handwriting Recognition System

## Overview
A full-stack web application that recognizes handwritten medical prescriptions and matches them against a comprehensive medicine database. Built with React frontend, Express backend, and PostgreSQL database using Drizzle ORM. The system features a drawing canvas for handwriting input, real-time recognition processing, and intelligent medicine matching with fuzzy search capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based architecture using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **ShadCN/UI Components**: Comprehensive UI component library built on Radix UI primitives
- **TanStack Query**: Server state management for API calls and caching
- **Wouter Router**: Lightweight client-side routing solution
- **Tailwind CSS**: Utility-first styling with custom design tokens and CSS variables

### Drawing and Recognition System
- **HTML5 Canvas**: Custom handwriting canvas component for stroke capture
- **Stroke Data Structure**: Points with coordinates and timestamps for precise handwriting representation
- **Real-time Recognition**: Optional automatic recognition as user writes
- **Mock Recognition API**: Simulates Google Handwriting Recognition API responses

### Backend Architecture
- **Express.js Server**: RESTful API with middleware for logging and error handling
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Zod Validation**: Runtime type checking for API requests and responses
- **In-Memory Storage**: Development storage implementation with CSV data loading
- **Fuzzy Matching**: Levenshtein distance algorithm for medicine name matching

### Database Design
- **Medicines Table**: Comprehensive medicine database with manufacturer, composition, and regulatory information
- **Users Table**: Basic user authentication schema
- **Structured Medicine Data**: Normalized fields for name, brand, manufacturer, composition, and prescription requirements

### API Architecture
- **Recognition Endpoint**: POST `/api/recognize` - Processes handwriting strokes and returns medicine matches
- **Search Endpoint**: GET `/api/medicines/search` - Manual text-based medicine search
- **Statistics Endpoint**: GET `/api/statistics` - Application usage and database metrics
- **RESTful Design**: Consistent HTTP methods and response formats

### Development Tooling
- **TypeScript Configuration**: Shared types between frontend and backend
- **Path Aliases**: Simplified imports using @ and @shared prefixes
- **Hot Module Replacement**: Fast development feedback loop
- **Error Overlay**: Runtime error display in development

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **Lucide Icons**: Consistent icon library for interface elements
- **Class Variance Authority**: Dynamic className composition utility

### Development and Build
- **Vite**: Frontend build tool with React plugin support
- **ESBuild**: Fast JavaScript bundler for server-side code
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Database and ORM
- **Drizzle Kit**: Database migrations and schema management
- **Neon Database**: Serverless PostgreSQL database hosting
- **PostgreSQL**: Primary database system for production deployment

### State Management and Data Fetching
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for type-safe data handling

### Replit Integration
- **Runtime Error Modal**: Development error display plugin
- **Cartographer**: Replit-specific development tooling
- **Development Banner**: Replit environment integration script