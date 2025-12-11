import { ChartType, MarketData } from '@/lib/types';
import { Currency } from '@/lib/store';
import { formatCurrencyFull } from '@/lib/utils/currency';

interface ExportPriceReportParams {
  marketData: MarketData;
  currency: Currency;
  chartType: ChartType;
}

const formatPercent = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return 'N/A';
  const fixed = value.toFixed(2);
  const sign = value > 0 ? '+' : '';
  return `${sign}${fixed}%`;
};

const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const exportPriceReportPdf = async ({
  marketData,
  currency,
  chartType,
}: ExportPriceReportParams) => {
  if (typeof window === 'undefined') {
    // Prevent SSR execution
    return;
  }

  const isCandles =
    chartType === 'candlestick' &&
    marketData.ohlcData &&
    marketData.ohlcData.length > 0;
  const rows = isCandles ? marketData.ohlcData ?? [] : marketData.priceHistory;

  if (!rows || rows.length === 0) return;

  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const marginX = 40;
  let cursorY = 40;

  const { coin } = marketData;

  doc.setFontSize(16);
  doc.text(`${coin.name} (${coin.symbol.toUpperCase()}) Report`, marginX, cursorY);

  doc.setFontSize(10);
  cursorY += 16;
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, cursorY);
  cursorY += 14;
  doc.text(`Currency: ${currency.toUpperCase()}`, marginX, cursorY);
  cursorY += 14;
  doc.text(
    `Chart type: ${isCandles ? 'Candlestick' : 'Line (price)'}`,
    marginX,
    cursorY
  );
  cursorY += 14;
  doc.text(`Data points: ${rows.length}`, marginX, cursorY);
  cursorY += 14;

  const firstTimestamp = rows[0]?.timestamp;
  const lastTimestamp = rows[rows.length - 1]?.timestamp;
  if (firstTimestamp && lastTimestamp) {
    doc.text(
      `Range: ${formatDateTime(firstTimestamp)} - ${formatDateTime(lastTimestamp)}`,
      marginX,
      cursorY
    );
    cursorY += 18;
  } else {
    cursorY += 8;
  }

  autoTable(doc, {
    startY: cursorY,
    head: [['Metric', 'Value']],
    body: [
      ['Current Price', formatCurrencyFull(coin.current_price, currency)],
      ['24h Change', formatPercent(coin.price_change_percentage_24h)],
      ['24h Price', coin.price_change_24h !== null ? formatCurrencyFull(coin.price_change_24h, currency) : 'N/A'],
      ['Market Cap', formatCurrencyFull(coin.market_cap, currency)],
      ['24h Volume', formatCurrencyFull(coin.total_volume, currency)],
      ['24h High', coin.high_24h !== null ? formatCurrencyFull(coin.high_24h, currency) : 'N/A'],
      ['24h Low', coin.low_24h !== null ? formatCurrencyFull(coin.low_24h, currency) : 'N/A'],
      [
        'ATH',
        coin.ath !== null
          ? `${formatCurrencyFull(coin.ath, currency)} (${formatPercent(coin.ath_change_percentage)})`
          : 'N/A',
      ],
      [
        'ATL',
        coin.atl !== null
          ? `${formatCurrencyFull(coin.atl, currency)} (${formatPercent(coin.atl_change_percentage)})`
          : 'N/A',
      ],
      ['Circulating Supply', coin.circulating_supply !== null ? coin.circulating_supply.toLocaleString() : 'N/A'],
      ['Max Supply', coin.max_supply !== null ? coin.max_supply.toLocaleString() : 'N/A'],
      ['Market Cap Rank', coin.market_cap_rank ? `#${coin.market_cap_rank}` : 'N/A'],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const summaryY = (doc as any).lastAutoTable?.finalY ?? cursorY + 16;

  const priceHead = isCandles
    ? ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
    : ['Timestamp', 'Price'];

  const maxRows = 40;
  const tableRows = rows
    .slice(rows.length > maxRows ? rows.length - maxRows : 0)
    .map((item: any) => {
      const base = [formatDateTime(item.timestamp)];
      if (isCandles) {
        return [
          ...base,
          item.open?.toFixed(4) ?? '—',
          item.high?.toFixed(4) ?? '—',
          item.low?.toFixed(4) ?? '—',
          item.close?.toFixed(4) ?? '—',
          item.volume !== undefined ? item.volume.toLocaleString() : '—',
        ];
      }
      return [...base, item.price?.toFixed(6) ?? '—'];
    });

  autoTable(doc, {
    startY: summaryY + 12,
    head: [priceHead],
    body: tableRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  const fileName = `${coin.id}-${isCandles ? 'ohlc' : 'price'}-${currency}-report.pdf`;
  doc.save(fileName);
};

