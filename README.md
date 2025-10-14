# Cooler Admin Interface

A comprehensive admin dashboard for managing the Cooler API system, including anomaly monitoring and resolution.

## Features

### Dashboard

- **Customer Management**: View and manage API customers
- **Usage Analytics**: Track API usage patterns and performance metrics
- **Real-time Monitoring**: Monitor system health and performance

### Anomaly Management

- **Anomaly Detection**: View all flagged anomalies from the footprint calculation system
- **Filtering & Search**: Filter by type, severity, resolution status
- **Resolution Tracking**: Mark anomalies as resolved with notes
- **Analytics**: Charts showing anomaly trends and distributions

## Getting Started

### Prerequisites

- Node.js 20.x
- Access to the Cooler API backend

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=https://api.cooler.dev
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3004](http://localhost:3004) in your browser

### Building for Production

```bash
npm run build
npm start
```

## API Endpoints

The admin interface expects the following API endpoints to be available:

### Anomalies

- `GET /admin/anomalies` - List anomalies with filtering and pagination
- `GET /admin/anomalies/stats` - Get anomaly statistics and charts data
- `PATCH /admin/anomalies/:id/resolve` - Resolve an anomaly

### Dashboard

- `GET /admin/stats` - Get dashboard statistics
- `GET /admin/customers` - List customers with pagination
- `GET /admin/api-usage` - Get aggregate API usage data

## Anomaly Types

The system tracks several types of anomalies:

### Data Quality

- Missing product names or categories
- Invalid postal codes
- Unusual pricing data

### Calculation

- Low confidence scores from OpenAI
- Default NAICS code usage
- Unusual carbon intensity values

### Process

- OpenAI API failures
- Vector search failures
- Database timeouts
- JSON parsing failures

### Business Logic

- Zero or extreme footprint values
- Inconsistent category classifications
- Unusual price-to-footprint ratios

## Severity Levels

- **CRITICAL**: System-breaking issues requiring immediate attention
- **HIGH**: Important issues that should be resolved soon
- **MEDIUM**: Moderate issues that can be addressed in normal workflow
- **LOW**: Minor issues for awareness

## Development

### Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main dashboard
│   └── anomalies/
│       └── page.tsx     # Anomaly management
├── components/
│   ├── DarkModeToggle.tsx
│   └── ThemeSelector.tsx
└── utils/
    └── themes.ts
```

### Technologies Used

- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Heroicons**: Icons
- **Axios**: HTTP client

## Contributing

1. Follow the existing code style
2. Add TypeScript types for all new interfaces
3. Test thoroughly before submitting
4. Update documentation for new features
