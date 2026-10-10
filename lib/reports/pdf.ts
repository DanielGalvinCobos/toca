import {
  LineCapStyle,
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import {
  LOGO_HEIGHT,
  LOGO_PATH,
  LOGO_WIDTH,
} from "./logo";

export type ReportSource = {
  source: "nfc" | "qr" | "direct";
  visits: number;
  googleClicks: number;
};

export type ReportDailyRow = {
  date: string;
  visits: number;
  googleClicks: number;
  source: "nfc" | "qr" | "direct";
  lastActivity?: string | null;
};

export type ReportData = {
  businessName: string;
  periodLabel?: string;
  periodFrom: string;
  periodTo: string;
  totalVisits: number;
  totalGoogleClicks: number;
  lastActivity?: string | null;
  bySource: ReportSource[];
  daily: ReportDailyRow[];
};

type ChartPoint = {
  date: string;
  visits: number;
  googleClicks: number;
};

type IconPath = {
  d: string;
  stroke?: number;
  opacity?: number;
};

/*
 * Medidas equivalentes a la versión individual (@media print):
 * @page { margin: 12mm 13mm } y 1px de CSS = 0.75pt en el PDF.
 */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 36.85;
const MARGIN_Y = 34.02;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const CARD_RADIUS = 9;
const CARD_PADDING_X = 11.25;
const CARD_PADDING_Y = 9.75;

const FOOTER_RESERVE = 48;

const COLORS = {
  violet: rgb(0.388, 0.4, 0.945),
  violetSoft: rgb(0.945, 0.941, 1),
  white: rgb(1, 1, 1),
  text: rgb(0.067, 0.067, 0.067),
  textSecondary: rgb(0.42, 0.447, 0.502),
  textMuted: rgb(0.612, 0.639, 0.686),
  border: rgb(0.898, 0.906, 0.922),
  track: rgb(0.925, 0.925, 0.949),
  tableHeader: rgb(0.98, 0.98, 1),
};

const SOURCE_LABELS: Record<
  ReportSource["source"],
  string
> = {
  nfc: "NFC",
  qr: "QR",
  direct: "Directo",
};

/*
 * Iconos de la versión individual (viewBox 24x24).
 * Los rectángulos y círculos se han convertido a paths.
 */

const ICONS: Record<string, IconPath[]> = {
  nfc: [
    {
      d: "M10 5 H14 A2 2 0 0 1 16 7 V17 A2 2 0 0 1 14 19 H10 A2 2 0 0 1 8 17 V7 A2 2 0 0 1 10 5 Z",
      stroke: 1.7,
    },
    {
      d: "M5.5 8.2 A5.8 5.8 0 0 0 5.5 15.8",
      stroke: 1.7,
    },
    {
      d: "M18.5 8.2 A5.8 5.8 0 0 1 18.5 15.8",
      stroke: 1.7,
    },
    {
      d: "M3.2 6.2 A9 9 0 0 0 3.2 17.8",
      stroke: 1.45,
      opacity: 0.5,
    },
    {
      d: "M20.8 6.2 A9 9 0 0 1 20.8 17.8",
      stroke: 1.45,
      opacity: 0.5,
    },
    {
      d: "M10.75 12 A1.25 1.25 0 1 0 13.25 12 A1.25 1.25 0 1 0 10.75 12 Z",
    },
  ],
  qr: [
    { d: "M4 4 H10 V10 H4 Z", stroke: 1.7 },
    { d: "M14 4 H20 V10 H14 Z", stroke: 1.7 },
    { d: "M4 14 H10 V20 H4 Z", stroke: 1.7 },
    { d: "M6.2 6.2 H7.8 V7.8 H6.2 Z" },
    { d: "M16.2 6.2 H17.8 V7.8 H16.2 Z" },
    { d: "M6.2 16.2 H7.8 V17.8 H6.2 Z" },
    {
      d: "M14 14 H17 V17 H14 Z M18 14 H20 V16 H18 Z M17 18 H20 V20 H17 Z M14 18 H16 V20 H14 Z",
    },
  ],
  direct: [
    {
      d: "M7 4.5 H17 A2.5 2.5 0 0 1 19.5 7 V17 A2.5 2.5 0 0 1 17 19.5 H7 A2.5 2.5 0 0 1 4.5 17 V7 A2.5 2.5 0 0 1 7 4.5 Z",
      stroke: 1.6,
    },
    { d: "M8 15.5 L15.5 8", stroke: 1.8 },
    { d: "M11.5 8 H15.5 V12", stroke: 1.8 },
  ],
  visits: [
    { d: "M4 17.5 L9 12 L12.5 15 L20 7", stroke: 1.8 },
    { d: "M15.5 7 H20 V11.5", stroke: 1.8 },
  ],
  google: [
    {
      d: "M21.35 12.27 C21.35 11.57 21.29 10.9 21.17 10.27 H12 V14.06 H17.24 A4.48 4.48 0 0 1 15.3 17 V19.45 H18.44 C20.28 17.75 21.35 15.25 21.35 12.27 Z",
    },
    {
      d: "M12 21.65 C14.63 21.65 16.84 20.78 18.45 19.3 L15.31 16.85 C14.44 17.43 13.33 17.77 12 17.77 C9.46 17.77 7.31 16.05 6.54 13.74 H3.29 V16.27 A9.75 9.75 0 0 0 12 21.65 Z",
      opacity: 0.78,
    },
    {
      d: "M6.54 13.74 A5.86 5.86 0 0 1 6.23 12 C6.23 11.39 6.34 10.8 6.54 10.26 V7.73 H3.29 A9.75 9.75 0 0 0 2.25 12 C2.25 13.57 2.63 15.05 3.29 16.27 L6.54 13.74 Z",
      opacity: 0.58,
    },
    {
      d: "M12 6.23 C13.43 6.23 14.72 6.72 15.73 7.69 L18.53 4.89 C16.84 3.32 14.63 2.35 12 2.35 A9.75 9.75 0 0 0 3.29 7.73 L6.54 10.26 C7.31 7.95 9.46 6.23 12 6.23 Z",
      opacity: 0.9,
    },
  ],
  interaction: [
    {
      d: "M5 8 A3 3 0 1 0 11 8 A3 3 0 1 0 5 8 Z",
      stroke: 1.7,
    },
    { d: "M3.5 19 A4.5 4.5 0 0 1 12.5 19", stroke: 1.7 },
    { d: "M15 13 L17 15 L21 10", stroke: 1.8 },
  ],
  activity: [
    {
      d: "M3.5 12 A8.5 8.5 0 1 0 20.5 12 A8.5 8.5 0 1 0 3.5 12 Z",
      stroke: 1.7,
    },
    { d: "M12 7 V12 L15.2 14", stroke: 1.8 },
  ],
};

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return dateString;
  }

  return `${day}/${month}/${year}`;
}

function formatShortDate(dateString: string) {
  const [, month, day] = dateString.split("-");

  if (!month || !day) {
    return dateString;
  }

  return `${day}/${month}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sin actividad";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date);
}

function getSourcePercentage(
  visits: number,
  total: number,
) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((visits / total) * 100);
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = COLORS.text,
) {
  page.drawText(text, {
    x,
    y,
    font,
    size,
    color,
  });
}

/*
 * Texto con separación entre letras (letter-spacing del CSS).
 */

function getSpacedTextWidth(
  text: string,
  font: PDFFont,
  size: number,
  spacing: number,
) {
  return (
    font.widthOfTextAtSize(text, size) +
    spacing * Math.max(text.length - 1, 0)
  );
}

function drawSpacedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  spacing: number,
) {
  let cursor = x;

  for (const char of text) {
    drawText(page, char, cursor, y, font, size, color);

    cursor +=
      font.widthOfTextAtSize(char, size) + spacing;
  }
}

/*
 * Y de la línea base de un texto que empieza en "top"
 * dentro de una línea con la altura indicada.
 */

function getBaseline(
  top: number,
  size: number,
  lineHeight: number,
) {
  return top - (lineHeight - size) / 2 - size * 0.8;
}

function drawBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color,
  });
}

function createRoundedPath(
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);

  return (
    `M ${r} 0 H ${width - r} ` +
    `A ${r} ${r} 0 0 1 ${width} ${r} ` +
    `V ${height - r} ` +
    `A ${r} ${r} 0 0 1 ${width - r} ${height} ` +
    `H ${r} ` +
    `A ${r} ${r} 0 0 1 0 ${height - r} ` +
    `V ${r} ` +
    `A ${r} ${r} 0 0 1 ${r} 0 Z`
  );
}

function drawRoundedBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color?: ReturnType<typeof rgb>,
  borderColor?: ReturnType<typeof rgb>,
  borderWidth = 0.75,
) {
  page.drawSvgPath(
    createRoundedPath(width, height, radius),
    {
      x,
      y: y + height,
      color,
      borderColor,
      borderWidth: borderColor ? borderWidth : 0,
    },
  );
}

function drawLine(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = COLORS.border,
  thickness = 0.75,
) {
  page.drawLine({
    start: {
      x: x1,
      y: y1,
    },
    end: {
      x: x2,
      y: y2,
    },
    color,
    thickness,
    lineCap: LineCapStyle.Round,
  });
}

function drawCard(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  height: number,
  radius = CARD_RADIUS,
) {
  drawRoundedBox(
    page,
    x,
    top - height,
    width,
    height,
    radius,
    COLORS.white,
    COLORS.border,
  );
}

function truncateText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }

  let result = text;

  while (
    result.length > 1 &&
    font.widthOfTextAtSize(`${result}…`, size) > maxWidth
  ) {
    result = result.slice(0, -1);
  }

  return `${result.trim()}…`;
}

function drawLogo(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  opacity = 1,
) {
  page.drawSvgPath(LOGO_PATH, {
    x,
    y: top,
    scale: width / LOGO_WIDTH,
    color: COLORS.violet,
    opacity,
    borderWidth: 0,
  });
}

function drawIcon(
  page: PDFPage,
  icon: IconPath[],
  x: number,
  top: number,
  size: number,
  color = COLORS.violet,
) {
  const scale = size / 24;

  for (const path of icon) {
    if (path.stroke) {
      page.drawSvgPath(path.d, {
        x,
        y: top,
        scale,
        borderColor: color,
        borderWidth: path.stroke,
        borderOpacity: path.opacity ?? 1,
        borderLineCap: LineCapStyle.Round,
      });
    } else {
      page.drawSvgPath(path.d, {
        x,
        y: top,
        scale,
        color,
        opacity: path.opacity ?? 1,
        borderWidth: 0,
      });
    }
  }
}

/*
 * Cabecera de las tarjetas: etiqueta violeta, título
 * y texto pequeño alineado a la derecha.
 * Devuelve la altura que ocupa.
 */

function drawSectionHeading(
  page: PDFPage,
  label: string,
  title: string,
  rightText: string,
  x: number,
  top: number,
  width: number,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  drawSpacedText(
    page,
    label.toUpperCase(),
    x,
    getBaseline(top, 6.24, 7.5),
    boldFont,
    6.24,
    COLORS.violet,
    0.75,
  );

  drawText(
    page,
    title,
    x,
    getBaseline(top - 7.5 - 3, 11, 12.7),
    boldFont,
    11,
    COLORS.text,
  );

  if (rightText) {
    const rightWidth = regularFont.widthOfTextAtSize(
      rightText,
      6.5,
    );

    drawText(
      page,
      rightText,
      x + width - rightWidth,
      getBaseline(top, 6.5, 8),
      regularFont,
      6.5,
      COLORS.textMuted,
    );
  }

  return 7.5 + 3 + 12.7;
}

function drawHeader(
  page: PDFPage,
  regularFont: PDFFont,
  boldFont: PDFFont,
  businessName: string,
) {
  let y = PAGE_HEIGHT - MARGIN_Y;

  const logoWidth = 61.5;
  const logoHeight = (logoWidth * LOGO_HEIGHT) / LOGO_WIDTH;

  drawLogo(
    page,
    (PAGE_WIDTH - logoWidth) / 2,
    y,
    logoWidth,
  );

  y -= logoHeight + 8.25;

  drawSpacedText(
    page,
    "ESTADÍSTICAS",
    MARGIN_X,
    getBaseline(y, 7, 8.4),
    boldFont,
    7,
    COLORS.violet,
    0.9,
  );

  y -= 8.4 + 3;

  drawText(
    page,
    truncateText(
      businessName,
      boldFont,
      19.8,
      CONTENT_WIDTH,
    ),
    MARGIN_X,
    getBaseline(y, 19.8, 21.4),
    boldFont,
    19.8,
    COLORS.text,
  );

  y -= 21.4 + 3.75;

  drawText(
    page,
    "Evolución de los accesos e interacciones de este local.",
    MARGIN_X,
    getBaseline(y, 7.8, 11.3),
    regularFont,
    7.8,
    COLORS.textSecondary,
  );

  y -= 11.3 + 9.75;

  drawLine(
    page,
    MARGIN_X,
    y,
    PAGE_WIDTH - MARGIN_X,
    y,
    COLORS.border,
    0.75,
  );

  return y - 11.25;
}

function drawPeriodCard(
  page: PDFPage,
  top: number,
  label: string,
  periodFrom: string,
  periodTo: string,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const height = 57;

  drawCard(page, MARGIN_X, top, CONTENT_WIDTH, height);

  const x = MARGIN_X + CARD_PADDING_X;
  let y = top - CARD_PADDING_Y;

  drawSpacedText(
    page,
    "PERIODO",
    x,
    getBaseline(y, 6.24, 7.5),
    boldFont,
    6.24,
    COLORS.violet,
    0.75,
  );

  y -= 7.5 + 3;

  drawText(
    page,
    label,
    x,
    getBaseline(y, 11.4, 13.1),
    boldFont,
    11.4,
    COLORS.text,
  );

  y -= 13.1 + 2.25;

  drawText(
    page,
    `${formatDate(periodFrom)} — ${formatDate(periodTo)}`,
    x,
    getBaseline(y, 7.9, 11.5),
    regularFont,
    7.9,
    COLORS.textSecondary,
  );

  return height;
}

function drawStatCard(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  height: number,
  icon: IconPath[],
  label: string,
  value: string,
  detail: string,
  valueSize: number,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  drawCard(page, x, top, width, height, 8.25);

  const padding = 9;
  const innerX = x + padding;
  const innerWidth = width - padding * 2;

  let y = top - padding;

  drawRoundedBox(
    page,
    innerX,
    y - 18.75,
    18.75,
    18.75,
    6,
    COLORS.violetSoft,
  );

  drawIcon(
    page,
    icon,
    innerX + (18.75 - 9.75) / 2,
    y - (18.75 - 9.75) / 2,
    9.75,
  );

  y -= 18.75 + 5.25;

  drawText(
    page,
    label,
    innerX,
    getBaseline(y, 6.4, 8),
    boldFont,
    6.4,
    COLORS.textSecondary,
  );

  y -= 8 + 2.25;

  drawText(
    page,
    truncateText(value, boldFont, valueSize, innerWidth),
    innerX,
    getBaseline(y, valueSize, valueSize * 1.05),
    boldFont,
    valueSize,
    COLORS.text,
  );

  y -= valueSize * 1.05 + 2.25;

  drawText(
    page,
    truncateText(detail, regularFont, 5.9, innerWidth),
    innerX,
    getBaseline(y, 5.9, 7.6),
    regularFont,
    5.9,
    COLORS.textMuted,
  );
}

function drawStatsGrid(
  page: PDFPage,
  top: number,
  data: ReportData,
  interactionRate: number,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const gap = 5.25;
  const height = 76;
  const width = (CONTENT_WIDTH - gap * 3) / 4;

  const cards = [
    {
      icon: ICONS.visits,
      label: "Visitas",
      value: String(data.totalVisits),
      detail: "Accesos registrados",
      size: 13.8,
    },
    {
      icon: ICONS.google,
      label: "Google",
      value: String(data.totalGoogleClicks),
      detail: "Clics en dejar reseña",
      size: 13.8,
    },
    {
      icon: ICONS.interaction,
      label: "Interacción",
      value: `${interactionRate}%`,
      detail: "Clics de Google sobre visitas",
      size: 13.8,
    },
    {
      icon: ICONS.activity,
      label: "Última actividad",
      value: formatDateTime(data.lastActivity),
      detail: "Último evento del periodo",
      size: 8.6,
    },
  ];

  cards.forEach((card, index) => {
    drawStatCard(
      page,
      MARGIN_X + index * (width + gap),
      top,
      width,
      height,
      card.icon,
      card.label,
      card.value,
      card.detail,
      card.size,
      regularFont,
      boldFont,
    );
  });

  return height;
}

function groupDaily(rows: ReportDailyRow[]) {
  const grouped = new Map<string, ChartPoint>();

  for (const row of rows) {
    const visits = Number(row.visits) || 0;
    const googleClicks = Number(row.googleClicks) || 0;

    const current = grouped.get(row.date);

    if (current) {
      current.visits += visits;
      current.googleClicks += googleClicks;
    } else {
      grouped.set(row.date, {
        date: row.date,
        visits,
        googleClicks,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function getLabelStep(total: number) {
  if (total <= 7) {
    return 1;
  }

  if (total <= 14) {
    return 2;
  }

  if (total <= 31) {
    return 5;
  }

  if (total <= 60) {
    return 7;
  }

  if (total <= 90) {
    return 10;
  }

  return Math.ceil(total / 9);
}

function drawActivityChart(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  height: number,
  chartData: ChartPoint[],
  regularFont: PDFFont,
) {
  if (chartData.length === 0) {
    const message =
      "No hay actividad registrada en este periodo.";

    const messageWidth = regularFont.widthOfTextAtSize(
      message,
      8,
    );

    drawText(
      page,
      message,
      x + (width - messageWidth) / 2,
      top - height / 2,
      regularFont,
      8,
      COLORS.textSecondary,
    );

    return;
  }

  /*
   * Se mantiene la geometría del gráfico de la página
   * (viewBox 1000 x 280) y se escala al ancho disponible.
   */

  const viewWidth = 1000;
  const viewHeight = 280;
  const paddingLeft = 44;
  const paddingRight = 22;
  const paddingTop = 20;
  const paddingBottom = 38;

  const innerWidth = viewWidth - paddingLeft - paddingRight;
  const innerHeight = viewHeight - paddingTop - paddingBottom;

  const scale = width / viewWidth;

  const svgHeight = viewHeight * scale;
  const svgTop = top - (height - svgHeight) / 2;

  const maxVisits = Math.max(
    ...chartData.map((item) => item.visits),
    1,
  );

  const toX = (value: number) => x + value * scale;
  const toY = (value: number) => svgTop - value * scale;

  for (let line = 0; line <= 4; line += 1) {
    const lineY = toY(
      paddingTop + (line * innerHeight) / 4,
    );

    drawLine(
      page,
      toX(paddingLeft),
      lineY,
      toX(viewWidth - paddingRight),
      lineY,
      COLORS.track,
      1 * scale,
    );
  }

  const points = chartData.map((item, index) => ({
    ...item,
    x:
      chartData.length <= 1
        ? viewWidth / 2
        : paddingLeft +
          (index / (chartData.length - 1)) * innerWidth,
    y:
      paddingTop +
      innerHeight -
      (item.visits / maxVisits) * innerHeight,
  }));

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");

  const baseY = paddingTop + innerHeight;

  const areaPath =
    `${linePath} L ${points[points.length - 1].x} ${baseY}` +
    ` L ${points[0].x} ${baseY} Z`;

  /*
   * El degradado de la página no existe en pdf-lib:
   * se usa un relleno suave de un solo tono.
   */

  page.drawSvgPath(areaPath, {
    x: toX(0),
    y: toY(0),
    scale,
    color: COLORS.violet,
    opacity: 0.08,
    borderWidth: 0,
  });

  for (let index = 0; index < points.length - 1; index += 1) {
    drawLine(
      page,
      toX(points[index].x),
      toY(points[index].y),
      toX(points[index + 1].x),
      toY(points[index + 1].y),
      COLORS.violet,
      2.25,
    );
  }

  for (const point of points) {
    page.drawCircle({
      x: toX(point.x),
      y: toY(point.y),
      size: 4.5 * scale,
      color: COLORS.white,
      borderColor: COLORS.violet,
      borderWidth: 1.9,
    });
  }

  const labelStep = getLabelStep(chartData.length);

  points.forEach((point, index) => {
    if (
      index !== 0 &&
      index !== points.length - 1 &&
      index % labelStep !== 0
    ) {
      return;
    }

    const label = formatShortDate(point.date);

    const labelWidth = regularFont.widthOfTextAtSize(
      label,
      6,
    );

    drawText(
      page,
      label,
      toX(point.x) - labelWidth / 2,
      svgTop - svgHeight - 9,
      regularFont,
      6,
      COLORS.textSecondary,
    );
  });
}

function drawChartCard(
  page: PDFPage,
  top: number,
  periodLabel: string,
  chartData: ChartPoint[],
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const chartHeight = 142.5;
  const labelsHeight = 16.5;
  const chartMargin = 13.5;

  const innerX = MARGIN_X + CARD_PADDING_X + 0.75;
  const innerWidth = CONTENT_WIDTH - (CARD_PADDING_X + 0.75) * 2;

  const headingHeight = 23.2;

  const height =
    CARD_PADDING_Y * 2 +
    headingHeight +
    chartMargin +
    chartHeight +
    labelsHeight;

  drawCard(page, MARGIN_X, top, CONTENT_WIDTH, height);

  drawSectionHeading(
    page,
    "Evolución",
    "Accesos por día",
    periodLabel,
    innerX,
    top - CARD_PADDING_Y,
    innerWidth,
    regularFont,
    boldFont,
  );

  drawActivityChart(
    page,
    innerX,
    top - CARD_PADDING_Y - headingHeight - chartMargin,
    innerWidth,
    chartHeight,
    chartData,
    regularFont,
  );

  return height;
}

function drawSourceRow(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  icon: IconPath[],
  label: string,
  visits: number,
  googleClicks: number,
  percentage: number,
  isLast: boolean,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const paddingY = 6.75;
  const iconSize = 21.75;
  const gap = 9;

  const rowHeight = isLast
    ? paddingY + iconSize
    : paddingY * 2 + iconSize + 0.75;

  const centerY = top - paddingY - iconSize / 2;

  drawRoundedBox(
    page,
    x,
    centerY - iconSize / 2,
    iconSize,
    iconSize,
    6.75,
    COLORS.violetSoft,
  );

  drawIcon(
    page,
    icon,
    x + (iconSize - 12) / 2,
    centerY + 6,
    12,
  );

  drawText(
    page,
    label,
    x + iconSize + 5.25,
    centerY - 7.7 * 0.35,
    boldFont,
    7.7,
    COLORS.text,
  );

  const numbersWidth = 108.75;

  const detail = `${visits} visitas · ${googleClicks} Google`;

  const detailWidth = regularFont.widthOfTextAtSize(
    detail,
    6.6,
  );

  const percentageText = `${percentage}%`;

  const percentageWidth = boldFont.widthOfTextAtSize(
    percentageText,
    8.2,
  );

  const right = x + width;
  const textY = centerY - 8.2 * 0.35;

  drawText(
    page,
    detail,
    right - detailWidth,
    textY,
    regularFont,
    6.6,
    COLORS.textMuted,
  );

  drawText(
    page,
    percentageText,
    right - detailWidth - 5.25 - percentageWidth,
    textY,
    boldFont,
    8.2,
    COLORS.text,
  );

  const barX = x + 78.75 + gap;
  const barWidth = width - 78.75 - numbersWidth - gap * 2;
  const barHeight = 5.25;

  drawRoundedBox(
    page,
    barX,
    centerY - barHeight / 2,
    barWidth,
    barHeight,
    barHeight / 2,
    COLORS.track,
  );

  drawRoundedBox(
    page,
    barX,
    centerY - barHeight / 2,
    Math.max(1.5, barWidth * (percentage / 100)),
    barHeight,
    barHeight / 2,
    COLORS.violet,
  );

  if (!isLast) {
    drawLine(
      page,
      x,
      top - rowHeight + 0.375,
      right,
      top - rowHeight + 0.375,
      COLORS.border,
      0.75,
    );
  }

  return rowHeight;
}

function drawSourceCard(
  page: PDFPage,
  top: number,
  data: ReportData,
  periodLabel: string,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const innerX = MARGIN_X + CARD_PADDING_X + 0.75;
  const innerWidth = CONTENT_WIDTH - (CARD_PADDING_X + 0.75) * 2;

  const headingHeight = 23.2;
  const listMargin = 10.5;
  const listHeight = 36 + 36 + 28.5;

  const height =
    CARD_PADDING_Y * 2 +
    headingHeight +
    listMargin +
    listHeight;

  drawCard(page, MARGIN_X, top, CONTENT_WIDTH, height);

  drawSectionHeading(
    page,
    "Origen de las visitas",
    "¿Cómo llegan los clientes?",
    periodLabel,
    innerX,
    top - CARD_PADDING_Y,
    innerWidth,
    regularFont,
    boldFont,
  );

  const sources: ReportSource["source"][] = [
    "nfc",
    "qr",
    "direct",
  ];

  let y =
    top - CARD_PADDING_Y - headingHeight - listMargin;

  sources.forEach((key, index) => {
    const source = data.bySource.find(
      (item) => item.source === key,
    );

    const visits = Number(source?.visits) || 0;
    const googleClicks = Number(source?.googleClicks) || 0;

    y -= drawSourceRow(
      page,
      innerX,
      y,
      innerWidth,
      ICONS[key],
      SOURCE_LABELS[key],
      visits,
      googleClicks,
      getSourcePercentage(visits, data.totalVisits),
      index === sources.length - 1,
      regularFont,
      boldFont,
    );
  });

  return height;
}

function drawDetailTableHeader(
  page: PDFPage,
  x: number,
  top: number,
  width: number,
  columns: number[],
  boldFont: PDFFont,
) {
  const headerHeight = 20;

  drawRoundedBox(
    page,
    x,
    top - headerHeight,
    width,
    headerHeight,
    7.5,
    COLORS.tableHeader,
  );

  drawBox(
    page,
    x,
    top - headerHeight,
    width,
    headerHeight / 2,
    COLORS.tableHeader,
  );

  const titles = [
    "FECHA",
    "ORIGEN",
    "VISITAS",
    "GOOGLE",
    "ÚLTIMA ACTIVIDAD",
  ];

  titles.forEach((title, index) => {
    drawSpacedText(
      page,
      title,
      columns[index] + 5.25,
      getBaseline(top, 6.2, headerHeight),
      boldFont,
      6.2,
      COLORS.textSecondary,
      0.25,
    );
  });

  drawLine(
    page,
    x,
    top - headerHeight,
    x + width,
    top - headerHeight,
    COLORS.border,
    0.75,
  );

  return headerHeight;
}

function drawDetailRow(
  page: PDFPage,
  top: number,
  rowHeight: number,
  columns: number[],
  tableX: number,
  tableWidth: number,
  row: ReportDailyRow,
  isLast: boolean,
  regularFont: PDFFont,
  boldFont: PDFFont,
) {
  const baseline = getBaseline(top, 7.2, rowHeight);

  drawText(
    page,
    formatDate(row.date),
    columns[0] + 5.25,
    baseline,
    regularFont,
    7.2,
    COLORS.text,
  );

  const label = SOURCE_LABELS[row.source];

  const labelWidth = boldFont.widthOfTextAtSize(label, 6.1);

  const pillWidth = labelWidth + 9;
  const pillHeight = 11.5;

  drawRoundedBox(
    page,
    columns[1] + 5.25,
    top - rowHeight / 2 - pillHeight / 2,
    pillWidth,
    pillHeight,
    3.75,
    COLORS.violetSoft,
  );

  drawText(
    page,
    label,
    columns[1] + 5.25 + 4.5,
    top - rowHeight / 2 - 6.1 * 0.35,
    boldFont,
    6.1,
    COLORS.violet,
  );

  drawText(
    page,
    String(Number(row.visits) || 0),
    columns[2] + 5.25,
    baseline,
    regularFont,
    7.2,
    COLORS.text,
  );

  drawText(
    page,
    String(Number(row.googleClicks) || 0),
    columns[3] + 5.25,
    baseline,
    regularFont,
    7.2,
    COLORS.text,
  );

  drawText(
    page,
    formatDateTime(row.lastActivity),
    columns[4] + 5.25,
    baseline,
    regularFont,
    7.2,
    COLORS.text,
  );

  if (!isLast) {
    drawLine(
      page,
      tableX,
      top - rowHeight,
      tableX + tableWidth,
      top - rowHeight,
      COLORS.border,
      0.75,
    );
  }
}

function drawFooter(
  page: PDFPage,
  regularFont: PDFFont,
) {
  const text = "Todo tu negocio. En un toque.";

  const textWidth = regularFont.widthOfTextAtSize(text, 6.2);

  drawText(
    page,
    text,
    (PAGE_WIDTH - textWidth) / 2,
    MARGIN_Y + 3,
    regularFont,
    6.2,
    COLORS.textMuted,
  );

  const logoWidth = 37.5;
  const logoHeight = (logoWidth * LOGO_HEIGHT) / LOGO_WIDTH;

  drawLogo(
    page,
    (PAGE_WIDTH - logoWidth) / 2,
    MARGIN_Y + 3 + 6.2 + 3.75 + logoHeight,
    logoWidth,
    0.75,
  );
}

export async function generateReportPdf(
  data: ReportData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const regularFont = await pdf.embedFont(
    StandardFonts.Helvetica,
  );

  const boldFont = await pdf.embedFont(
    StandardFonts.HelveticaBold,
  );

  const periodLabel =
    data.periodLabel ?? "Periodo seleccionado";

  const totalVisits = Number(data.totalVisits) || 0;

  const totalGoogleClicks =
    Number(data.totalGoogleClicks) || 0;

  const interactionRate =
    totalVisits > 0
      ? Number(
          ((totalGoogleClicks / totalVisits) * 100).toFixed(2),
        )
      : 0;

  const reportData: ReportData = {
    ...data,
    totalVisits,
    totalGoogleClicks,
  };

  const chartData = groupDaily(data.daily);

  /*
   * =======================================================
   * PÁGINA 1 — RESUMEN
   * =======================================================
   */

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let y = drawHeader(
    page,
    regularFont,
    boldFont,
    data.businessName,
  );

  y -= drawPeriodCard(
    page,
    y,
    periodLabel,
    data.periodFrom,
    data.periodTo,
    regularFont,
    boldFont,
  );

  y -= 9;

  y -= drawStatsGrid(
    page,
    y,
    reportData,
    interactionRate,
    regularFont,
    boldFont,
  );

  y -= 7.5;

  y -= drawChartCard(
    page,
    y,
    periodLabel,
    chartData,
    regularFont,
    boldFont,
  );

  y -= 7.5;

  drawSourceCard(
    page,
    y,
    reportData,
    periodLabel,
    regularFont,
    boldFont,
  );

  /*
   * =======================================================
   * PÁGINA 2+ — DETALLE (más recientes primero)
   * =======================================================
   */

  const rows = data.daily.slice().reverse();

  const rowHeight = 21;
  const headerHeight = 20;
  const headingHeight = 23.2;
  const tableMargin = 12;

  const innerX = MARGIN_X + CARD_PADDING_X + 0.75;
  const innerWidth = CONTENT_WIDTH - (CARD_PADDING_X + 0.75) * 2;

  const percentages = [0.17, 0.16, 0.13, 0.13, 0.41];

  const columns = percentages.map((_, index) =>
    percentages
      .slice(0, index)
      .reduce(
        (total, value) => total + value * innerWidth,
        innerX,
      ),
  );

  let remainingRows = rows;
  let isFirstDetailPage = true;

  do {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    const top = PAGE_HEIGHT - MARGIN_Y;

    const available =
      top -
      MARGIN_Y -
      FOOTER_RESERVE -
      CARD_PADDING_Y * 2 -
      (isFirstDetailPage ? headingHeight + tableMargin : 0) -
      headerHeight;

    const capacity = Math.max(
      1,
      Math.floor(available / rowHeight),
    );

    const chunk = remainingRows.slice(0, capacity);

    remainingRows = remainingRows.slice(capacity);

    const bodyHeight =
      chunk.length === 0 ? 53 : chunk.length * rowHeight;

    const cardHeight =
      CARD_PADDING_Y * 2 +
      (isFirstDetailPage ? headingHeight + tableMargin : 0) +
      headerHeight +
      bodyHeight;

    drawCard(page, MARGIN_X, top, CONTENT_WIDTH, cardHeight);

    let tableTop = top - CARD_PADDING_Y;

    if (isFirstDetailPage) {
      drawSectionHeading(
        page,
        "Detalle",
        "Actividad registrada",
        `${rows.length} ${
          rows.length === 1 ? "registro" : "registros"
        }`,
        innerX,
        tableTop,
        innerWidth,
        regularFont,
        boldFont,
      );

      tableTop -= headingHeight + tableMargin;
    }

    drawDetailTableHeader(
      page,
      innerX,
      tableTop,
      innerWidth,
      columns,
      boldFont,
    );

    let rowTop = tableTop - headerHeight;

    if (chunk.length === 0) {
      const message =
        "No hay actividad registrada en este periodo.";

      const messageWidth = regularFont.widthOfTextAtSize(
        message,
        7.2,
      );

      drawText(
        page,
        message,
        innerX + (innerWidth - messageWidth) / 2,
        rowTop - bodyHeight / 2 - 2.5,
        regularFont,
        7.2,
        COLORS.textSecondary,
      );
    }

    chunk.forEach((row, index) => {
      drawDetailRow(
        page,
        rowTop,
        rowHeight,
        columns,
        innerX,
        innerWidth,
        row,
        index === chunk.length - 1,
        regularFont,
        boldFont,
      );

      rowTop -= rowHeight;
    });

    drawRoundedBox(
      page,
      innerX,
      tableTop - headerHeight - bodyHeight,
      innerWidth,
      headerHeight + bodyHeight,
      7.5,
      undefined,
      COLORS.border,
    );

    isFirstDetailPage = false;
  } while (remainingRows.length > 0);

  /*
   * =======================================================
   * FOOTER (solo en la última página, como en el individual)
   * =======================================================
   */

  drawFooter(page, regularFont);

  return pdf.save();
}
