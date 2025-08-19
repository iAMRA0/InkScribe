# InkScribe - Medical Handwriting Recognition System

A full-stack web application that recognizes handwritten medical prescriptions and matches them against a comprehensive medicine database. Built with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## 🚀 Features

- **Handwriting Canvas**: Interactive drawing canvas for capturing handwritten medicine names
- **Real-time Recognition**: Optional automatic recognition as you write
- **Medicine Database**: Comprehensive database with 50,000+ medicines
- **Fuzzy Matching**: Intelligent medicine matching using Levenshtein distance algorithm
- **Search Functionality**: Manual text-based medicine search
- **Recognition Statistics**: Database metrics and recognition accuracy tracking
- **Responsive Design**: Mobile-friendly interface with touch support

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **ShadCN/UI** components built on Radix UI primitives
- **TanStack Query** for server state management
- **Tailwind CSS** for styling
- **Wouter** for lightweight routing

### Backend
- **Express.js** RESTful API
- **Drizzle ORM** with PostgreSQL
- **Zod** for runtime validation
- **In-memory storage** for development
- **CSV data loading** for medicine database

### Key Components
- **Handwriting Canvas**: HTML5 canvas with stroke capture
- **Recognition Engine**: Mock Google Handwriting Recognition API
- **Medicine Matching**: Fuzzy search with confidence scoring
- **Results Panel**: Interactive medicine cards with detailed information

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (for production)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InkScribe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure your database connection and other settings in `.env`

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🚀 Usage

### Writing Recognition
1. **Draw on Canvas**: Use the handwriting canvas to write medicine names
2. **Real-time Recognition**: Enable automatic recognition as you write
3. **Manual Recognition**: Click "Recognize" button to process handwriting
4. **Review Results**: Check recognition candidates and confidence scores
5. **Verify Matches**: Review medicine details and match percentages

### Manual Search
- Use the search input to manually look up medicines
- Search by medicine name, brand name, or manufacturer
- Results are filtered and ranked by relevance

### Canvas Controls
- **Clear**: Remove all strokes from canvas
- **Undo**: Remove the last stroke
- **Real-time Toggle**: Enable/disable automatic recognition

## 📁 Project Structure

```
InkScribe/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # ShadCN/UI components
│   │   │   ├── handwriting-canvas.tsx
│   │   │   ├── medicine-card.tsx
│   │   │   └── results-panel.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API clients
│   │   ├── pages/          # Page components
│   │   └── App.tsx
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   └── vite.ts            # Vite integration
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database and API schemas
├── attached_assets/       # Medicine database CSV
└── package.json
```

## 🔌 API Endpoints

### Recognition
- `POST /api/recognize` - Process handwriting strokes
  ```json
  {
    "strokes": [
      [
        {"x": 100, "y": 150, "time": 1234567890},
        {"x": 105, "y": 155, "time": 1234567891}
      ]
    ]
  }
  ```

### Search
- `GET /api/medicines/search?q=medicine_name` - Search medicines by text

### Statistics
- `GET /api/statistics` - Get database and recognition statistics

## 🗄️ Database Schema

### Medicines Table
- `id` - Primary key
- `name` - Medicine name
- `brand_name` - Brand/commercial name
- `manufacturer_name` - Manufacturer
- `short_composition` - Active ingredients
- `category` - Medicine category
- `rx_required` - Prescription requirement
- `power` - Dosage strength

### Users Table
- `id` - Primary key
- `username` - User identifier
- `password` - Hashed password

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema

### Development Features
- Hot module replacement
- Runtime error overlay
- TypeScript support
- Path aliases (`@/` for client src, `@shared/` for shared)

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Handwriting Recognition API (simulated)
- ShadCN/UI for beautiful components
- Radix UI for accessible primitives
- Medicine database from 1mg.com

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Note**: This application currently uses a mock recognition API. For production use, integrate with the actual Google Handwriting Recognition API or similar service.