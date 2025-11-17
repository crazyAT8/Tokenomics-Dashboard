# Tokenomics Dashboard

A real-time cryptocurrency tokenomics dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔄 **Real-time Data**: Live cryptocurrency data from CoinGecko API
- 📊 **Interactive Charts**: Price history and tokenomics visualizations
- 🎯 **Tokenomics Analysis**: Supply distribution, market cap, and key metrics
- 🔍 **Coin Search**: Search and select from thousands of cryptocurrencies
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚡ **Fast Performance**: Optimized with Next.js and modern React patterns

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **API**: CoinGecko API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd tokenomics-dashboard
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

3. Run the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── charts/           # Chart components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── api.ts           # API functions
│   ├── store.ts         # Zustand store
│   └── types.ts         # TypeScript types
└── public/              # Static assets
```

## Key Components

### Dashboard Components

- **Header**: Navigation and refresh controls
- **CoinSelector**: Search and select cryptocurrencies
- **TokenomicsOverview**: Comprehensive tokenomics analysis
- **MetricCard**: Display key metrics with trends

### Charts

- **PriceChart**: Interactive price history visualization
- **TokenomicsChart**: Supply distribution pie chart

### API Integration

- **CoinGecko API**: Real-time cryptocurrency data
- **RESTful endpoints**: `/api/coins/[id]` and `/api/coins/search`

## Features in Detail

### Real-time Data

- Live price updates
- Market cap and volume tracking
- 24h price change indicators
- Supply distribution analysis

### Tokenomics Analysis

- Circulating vs total supply
- Market cap ranking
- Price history visualization
- Key performance metrics

### User Experience

- Responsive design
- Loading states
- Error handling
- Smooth animations

## Customization

### Adding New Metrics

1. Update the `TokenomicsData` interface in `lib/types.ts`
2. Modify the API response handling in `lib/api.ts`
3. Add new metric cards in `components/dashboard/`

### Styling

- Modify `tailwind.config.js` for theme customization
- Update `app/globals.css` for global styles
- Use Tailwind classes for component styling

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

- **Netlify**: Build command: `npm run build`
- **Railway**: Add `package.json` with build script
- **Docker**: Use the included Dockerfile

## API Rate Limits

The CoinGecko API has rate limits:

- Free tier: 10-50 calls/minute
- Consider upgrading for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Review the API documentation

---

Built with ❤️ using Next.js and modern web technologies.
