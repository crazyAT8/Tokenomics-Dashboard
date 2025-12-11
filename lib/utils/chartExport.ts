type Html2Canvas = typeof import('html2canvas')['default'];

interface ExportChartOptions {
  fileName: string;
  backgroundColor?: string;
}

/**
 * Export a chart container as a PNG image using html2canvas.
 * Uses dynamic import to avoid SSR issues.
 */
export const exportChartAsImage = async (
  element: HTMLElement,
  options: ExportChartOptions
) => {
  if (typeof window === 'undefined' || !element) return;

  const html2canvasModule = await import('html2canvas');
  const html2canvas = (html2canvasModule.default ||
    html2canvasModule) as Html2Canvas;

  const background =
    options.backgroundColor ||
    window.getComputedStyle(element).backgroundColor ||
    '#ffffff';

  const scale = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: background,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = options.fileName || 'chart.png';
  link.click();
};


