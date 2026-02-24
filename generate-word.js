const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, PageBreak, TabStopPosition, TabStopType,
  ImageRun, Header, Footer, PageNumber, NumberFormat,
  TableOfContents, StyleLevel, convertInchesToTwip,
  VerticalAlign, TableLayoutType,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ===== COLOR PALETTE =====
const PURPLE = '7C3AED';
const PURPLE_DARK = '5B21B6';
const PURPLE_MEDIUM = '8B5CF6';
const DARK = '1E293B';
const DARK_TEXT = '334155';
const GREY = '64748B';
const GREY_LIGHT = '94A3B8';
const LIGHT_BG = 'F8FAFC';
const LIGHT_PURPLE = 'F5F3FF';
const LIGHTER_PURPLE = 'FAF5FF';
const ACCENT_PURPLE = 'EDE9FE';
const GREEN_CHECK = '16A34A';
const RED_X = 'DC2626';
const AMBER = 'D97706';
const WHITE = 'FFFFFF';
const BORDER_LIGHT = 'E2E8F0';
const BORDER_MID = 'CBD5E1';

// ===== PROFESSIONAL BORDER PRESETS =====
const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: BORDER_LIGHT,
};

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: WHITE,
};

const HEADER_BORDER_BOTTOM = {
  style: BorderStyle.SINGLE,
  size: 2,
  color: PURPLE,
};

const TABLE_BORDER_BOTTOM = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: BORDER_LIGHT,
};

// ===== HELPERS =====
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 480 : 300, after: 180 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: level === HeadingLevel.HEADING_1 ? PURPLE : DARK,
        font: 'Calibri',
        size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24,
      }),
    ],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.afterSpacing || 120, line: 276 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.indent ? { firstLine: 400 } : undefined,
    children: Array.isArray(text) ? text : [
      new TextRun({
        text,
        font: 'Calibri',
        size: opts.size || 22,
        color: opts.color || DARK_TEXT,
        bold: opts.bold || false,
        italics: opts.italic || false,
      }),
    ],
  });
}

function boldPara(label, value) {
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    children: [
      new TextRun({ text: label, bold: true, font: 'Calibri', size: 22, color: PURPLE }),
      new TextRun({ text: value, font: 'Calibri', size: 22, color: DARK_TEXT }),
    ],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: opts.level || 0 },
    spacing: { after: 60, line: 276 },
    children: Array.isArray(text) ? text : [
      new TextRun({ text, font: 'Calibri', size: 21, color: DARK_TEXT }),
    ],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

// ===== PROFESSIONAL TABLE HELPERS =====

// Cell with professional styling
function proCell(content, opts = {}) {
  const paragraphs = [];

  if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'string') {
    // Array of strings = multiple paragraphs in one cell
    content.forEach((line, idx) => {
      paragraphs.push(new Paragraph({
        spacing: { after: idx < content.length - 1 ? 40 : 0 },
        alignment: opts.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: line,
            font: 'Calibri',
            size: opts.size || 19,
            color: opts.color || DARK_TEXT,
            bold: opts.bold || false,
            italics: opts.italic || false,
          }),
        ],
      }));
    });
  } else if (Array.isArray(content)) {
    // Array of TextRuns
    paragraphs.push(new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: content,
    }));
  } else {
    // Single string
    paragraphs.push(new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: content || '',
          font: 'Calibri',
          size: opts.size || 19,
          color: opts.color || DARK_TEXT,
          bold: opts.bold || false,
          italics: opts.italic || false,
        }),
      ],
    }));
  }

  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: opts.topMargin || 100,
      bottom: opts.bottomMargin || 100,
      left: opts.leftMargin || 120,
      right: opts.rightMargin || 120,
    },
    borders: opts.borders || {
      top: TABLE_BORDER_BOTTOM,
      bottom: TABLE_BORDER_BOTTOM,
      left: NO_BORDER,
      right: NO_BORDER,
    },
    columnSpan: opts.colSpan || undefined,
    rowSpan: opts.rowSpan || undefined,
    children: paragraphs,
  });
}

// Professional header cell
function proHeaderCell(text, width, opts = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.SOLID, color: opts.headerColor || PURPLE_DARK },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: 120,
      bottom: 120,
      left: 120,
      right: 120,
    },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: opts.headerColor || PURPLE_DARK },
      bottom: { style: BorderStyle.SINGLE, size: 3, color: PURPLE },
      left: { style: BorderStyle.SINGLE, size: 1, color: opts.headerColor || PURPLE_DARK },
      right: { style: BorderStyle.SINGLE, size: 1, color: opts.headerColor || PURPLE_DARK },
    },
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text: text || '',
            font: 'Calibri',
            size: opts.size || 19,
            color: WHITE,
            bold: true,
          }),
        ],
      }),
    ],
  });
}

// Professional table with clean lines design
function createProTable(headers, rows, colWidths, opts = {}) {
  const tableRows = [];

  // Header row
  tableRows.push(new TableRow({
    tableHeader: true,
    height: { value: 480, rule: 'atLeast' },
    children: headers.map((h, i) => proHeaderCell(h, colWidths ? colWidths[i] : undefined)),
  }));

  // Data rows with alternating subtle backgrounds
  rows.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    tableRows.push(new TableRow({
      height: { value: 380, rule: 'atLeast' },
      children: row.map((cellContent, i) => {
        const isFirstCol = i === 0;
        return proCell(cellContent, {
          width: colWidths ? colWidths[i] : undefined,
          shading: isEven ? LIGHT_BG : WHITE,
          bold: isFirstCol && (opts.boldFirstCol !== false),
          color: isFirstCol ? DARK : DARK_TEXT,
          size: 19,
        });
      }),
    }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: tableRows,
  });
}

// Comparison table with colored status indicators
function createComparisonTable(headers, rows, colWidths) {
  const tableRows = [];

  // Header row
  tableRows.push(new TableRow({
    tableHeader: true,
    height: { value: 480, rule: 'atLeast' },
    children: headers.map((h, i) => {
      // Last column (ECHO.) gets special styling
      const isEcho = i === headers.length - 1;
      return proHeaderCell(h, colWidths ? colWidths[i] : undefined, {
        headerColor: isEcho ? PURPLE : PURPLE_DARK,
      });
    }),
  }));

  // Data rows
  rows.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    tableRows.push(new TableRow({
      height: { value: 360, rule: 'atLeast' },
      children: row.map((cellContent, i) => {
        const isFirstCol = i === 0;
        const isLastCol = i === row.length - 1;

        // Determine color for status cells (✅, ❌)
        let cellColor = DARK_TEXT;
        if (typeof cellContent === 'string') {
          if (cellContent.startsWith('✅')) cellColor = GREEN_CHECK;
          else if (cellContent.startsWith('❌')) cellColor = RED_X;
        }

        return proCell(cellContent, {
          width: colWidths ? colWidths[i] : undefined,
          shading: isLastCol ? LIGHTER_PURPLE : (isEven ? LIGHT_BG : WHITE),
          bold: isFirstCol || isLastCol,
          color: isLastCol ? PURPLE_DARK : (isFirstCol ? DARK : cellColor),
          size: 18,
          align: (!isFirstCol && !isLastCol) ? AlignmentType.CENTER : AlignmentType.LEFT,
        });
      }),
    }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: tableRows,
  });
}

// Matrix cell for positioning map
function matrixCell(content, opts = {}) {
  return proCell(content, {
    ...opts,
    align: AlignmentType.CENTER,
    topMargin: 80,
    bottomMargin: 80,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: opts.borderColor || BORDER_LIGHT },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: opts.borderColor || BORDER_LIGHT },
      left: { style: BorderStyle.SINGLE, size: 1, color: opts.borderColor || BORDER_LIGHT },
      right: { style: BorderStyle.SINGLE, size: 1, color: opts.borderColor || BORDER_LIGHT },
    },
  });
}

// Professional positioning matrix as a real table
function createPositioningMatrix() {
  const AXIS_BG = 'F1F5F9';
  const HIGHLIGHT_BG = 'F5F3FF';
  const ECHO_BG = 'EDE9FE';

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // Title row
      new TableRow({
        children: [
          proCell('', { width: 16, shading: WHITE, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
          proCell([
            new TextRun({ text: 'EXPÉRIENCE VISUELLE  →', font: 'Calibri', size: 18, bold: true, color: GREY }),
          ], { width: 28, shading: WHITE, align: AlignmentType.CENTER, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
          proCell('', { width: 28, shading: WHITE, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
          proCell('', { width: 28, shading: WHITE, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
        ],
      }),
      // Sub-header row
      new TableRow({
        height: { value: 340, rule: 'atLeast' },
        children: [
          matrixCell([
            new TextRun({ text: '↓ IA', font: 'Calibri', size: 17, bold: true, color: GREY }),
          ], { width: 16, shading: AXIS_BG }),
          matrixCell([
            new TextRun({ text: 'Basique', font: 'Calibri', size: 17, bold: true, color: GREY_LIGHT }),
          ], { width: 28, shading: AXIS_BG }),
          matrixCell([
            new TextRun({ text: 'Intermédiaire', font: 'Calibri', size: 17, bold: true, color: GREY_LIGHT }),
          ], { width: 28, shading: AXIS_BG }),
          matrixCell([
            new TextRun({ text: 'Avancée', font: 'Calibri', size: 17, bold: true, color: GREY_LIGHT }),
          ], { width: 28, shading: AXIS_BG }),
        ],
      }),
      // Row 1: IA Avancée
      new TableRow({
        height: { value: 680, rule: 'atLeast' },
        children: [
          matrixCell([
            new TextRun({ text: 'Avancée', font: 'Calibri', size: 17, bold: true, color: GREY }),
          ], { width: 16, shading: AXIS_BG }),
          matrixCell([
            new TextRun({ text: 'Rosebud', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(IA avancée, pas de visuel)', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: LIGHT_BG }),
          matrixCell([
            new TextRun({ text: 'Youper', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(Thérapie IA, CBT)', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: LIGHT_BG }),
          matrixCell([
            new TextRun({ text: '★ ECHO.', font: 'Calibri', size: 20, bold: true, color: PURPLE }),
            new TextRun({ text: '\nIA + Art génératif', font: 'Calibri', size: 16, bold: true, color: PURPLE_MEDIUM }),
          ], { width: 28, shading: ECHO_BG, borderColor: PURPLE_MEDIUM }),
        ],
      }),
      // Row 2: IA Intermédiaire
      new TableRow({
        height: { value: 680, rule: 'atLeast' },
        children: [
          matrixCell([
            new TextRun({ text: 'Interméd.', font: 'Calibri', size: 17, bold: true, color: GREY }),
          ], { width: 16, shading: AXIS_BG }),
          matrixCell([
            new TextRun({ text: 'Reflectly', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(IA basique, prompts)', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: WHITE }),
          matrixCell([
            new TextRun({ text: 'Headspace', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(Chatbot "Ebb")', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: WHITE }),
          matrixCell('', { width: 28, shading: HIGHLIGHT_BG }),
        ],
      }),
      // Row 3: IA Basique
      new TableRow({
        height: { value: 680, rule: 'atLeast' },
        children: [
          matrixCell([
            new TextRun({ text: 'Basique', font: 'Calibri', size: 17, bold: true, color: GREY }),
          ], { width: 16, shading: AXIS_BG }),
          matrixCell([
            new TextRun({ text: 'Moodnotes', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(CBT, pas d\'IA)', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: LIGHT_BG }),
          matrixCell([
            new TextRun({ text: 'Daylio', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(Icônes, stats)', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: LIGHT_BG }),
          matrixCell([
            new TextRun({ text: 'Day One', font: 'Calibri', size: 18, bold: true, color: DARK }),
            new TextRun({ text: '\n(Photos, multimédia)', font: 'Calibri', size: 15, color: GREY }),
          ], { width: 28, shading: LIGHT_BG }),
        ],
      }),
    ],
  });
}

// Professional Business Model Canvas as a visual grid
function createBMCTable() {
  const BMC_HEADER = PURPLE_DARK;
  const BMC_BG = 'FAFAFE';

  function bmcHeaderCell(text, width, colSpan) {
    return new TableCell({
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      columnSpan: colSpan || undefined,
      shading: { type: ShadingType.SOLID, color: BMC_HEADER },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: PURPLE_DARK },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: PURPLE },
        left: { style: BorderStyle.SINGLE, size: 1, color: PURPLE_DARK },
        right: { style: BorderStyle.SINGLE, size: 1, color: PURPLE_DARK },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text, font: 'Calibri', size: 17, bold: true, color: WHITE }),
          ],
        }),
      ],
    });
  }

  function bmcContentCell(lines, width, colSpan, opts = {}) {
    const children = [];
    lines.forEach((line, idx) => {
      children.push(new Paragraph({
        spacing: { after: idx < lines.length - 1 ? 50 : 0 },
        children: [
          new TextRun({
            text: line,
            font: 'Calibri',
            size: 17,
            color: opts.highlight ? PURPLE_DARK : DARK_TEXT,
            bold: opts.highlight && idx === 0,
          }),
        ],
      }));
    });

    return new TableCell({
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      columnSpan: colSpan || undefined,
      shading: { type: ShadingType.SOLID, color: opts.shading || BMC_BG },
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
        left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
        right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
      },
      children,
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // ===== ROW 1 HEADERS: Partenaires | Activités | Proposition | Relations | Segments =====
      new TableRow({
        children: [
          bmcHeaderCell('PARTENAIRES CLÉS', 20),
          bmcHeaderCell('ACTIVITÉS CLÉS', 20),
          bmcHeaderCell('PROPOSITION DE VALEUR', 20, undefined),
          bmcHeaderCell('RELATION CLIENT', 20),
          bmcHeaderCell('SEGMENTS CLIENTS', 20),
        ],
      }),
      // ===== ROW 2 CONTENT =====
      new TableRow({
        height: { value: 2400, rule: 'atLeast' },
        children: [
          bmcContentCell([
            '• Anthropic (Claude)',
            '   → Analyse IA émotionnelle',
            '',
            '• Pollinations.ai',
            '   → Génération images IA',
            '',
            '• Supabase',
            '   → BDD & authentification',
            '',
            '• Vercel',
            '   → Hébergement serverless',
          ], 20),
          bmcContentCell([
            '• Développement produit',
            '   (Next.js, React, TS)',
            '',
            '• R&D algorithmes',
            '   génératifs & IA',
            '',
            '• Maintenance &',
            '   amélioration continue',
            '',
            '• Acquisition & rétention',
            '',
            '• Design UX/UI &',
            '   identité visuelle',
          ], 20),
          bmcContentCell([
            '« Transformez vos émotions',
            '  en œuvres d\'art uniques »',
            '',
            '✦ Journaling vocal et',
            '  textuel 100 % français',
            '',
            '✦ Analyse IA de 10 émotions',
            '  avec intensité',
            '',
            '✦ 6 styles de visualisation',
            '  artistique unique',
            '',
            '✦ Mosaïque émotionnelle',
            '  personnelle',
            '',
            '✦ Export HD pour',
            '  posters et livres',
          ], 20, undefined, { shading: LIGHT_PURPLE, highlight: true }),
          bmcContentCell([
            '• Self-service (freemium)',
            '',
            '• Onboarding guidé',
            '   en 3 étapes',
            '',
            '• Notifications',
            '   d\'encouragement',
            '',
            '• Support prioritaire',
            '   (tier Studio)',
          ], 20),
          bmcContentCell([
            '• Jeunes adultes (18-35)',
            '   soucieux de bien-être',
            '',
            '• Personnes en quête',
            '   d\'introspection',
            '',
            '• Créatifs sensibles à',
            '   l\'esthétique',
            '',
            '• Francophones',
            '',
            '• Professionnels stressés',
            '   (rituel décompression)',
          ], 20),
        ],
      }),
      // ===== ROW 3 HEADERS: Ressources | Canaux =====
      new TableRow({
        children: [
          bmcHeaderCell('RESSOURCES CLÉS', 20),
          bmcHeaderCell('CANAUX', 20),
          bmcHeaderCell('', 20), // Empty middle to maintain grid
          bmcHeaderCell('STRUCTURE DE COÛTS', 20),
          bmcHeaderCell('FLUX DE REVENUS', 20),
        ],
      }),
      // ===== ROW 4 CONTENT =====
      new TableRow({
        height: { value: 1800, rule: 'atLeast' },
        children: [
          bmcContentCell([
            '• 6 algorithmes de',
            '   visualisation propriétaires',
            '',
            '• Modèle émotionnel',
            '   à 10 dimensions',
            '',
            '• Stack technique',
            '   (Next.js, Supabase, IA)',
            '',
            '• Équipe fondatrice',
            '   (dev + design)',
          ], 20),
          bmcContentCell([
            '• Application web',
            '   responsive (PWA)',
            '',
            '• App Store / Play Store',
            '   (futur)',
            '',
            '• Réseaux sociaux',
            '   (partage de visuels)',
            '',
            '• Bouche-à-oreille',
            '   (viralité visuelle)',
          ], 20),
          bmcContentCell([
            '',
          ], 20, undefined, { shading: LIGHT_PURPLE }), // Center continues visual
          bmcContentCell([
            '• Hébergement Vercel',
            '   (serverless, variable)',
            '',
            '• API Claude',
            '   (analyse IA, variable)',
            '',
            '• Supabase (BDD + auth)',
            '',
            '• Nom de domaine + SSL',
            '',
            '• Marketing & acquisition',
            '',
            '→ Coûts majoritairement',
            '   variables et faibles',
          ], 20),
          bmcContentCell([
            '• Freemium (acquisition)',
            '',
            '• Premium : 8 €/mois',
            '   (illimité, voix, 6 styles)',
            '',
            '• Studio : 24 €/mois',
            '   (export HD, archivage)',
            '',
            '• [Futur] Partenariats B2B',
            '   (bien-être entreprise)',
          ], 20, undefined, { shading: LIGHTER_PURPLE }),
        ],
      }),
    ],
  });
}

// Professional architecture diagram as styled table
function createArchitectureDiagram() {
  const STEP_BG = LIGHT_PURPLE;
  const ARROW_COLOR = PURPLE_MEDIUM;

  function stepRow(icon, title, items, isPrimary) {
    return new TableRow({
      height: { value: 600, rule: 'atLeast' },
      children: [
        proCell([
          new TextRun({ text: icon, font: 'Calibri', size: 28 }),
        ], {
          width: 8,
          align: AlignmentType.CENTER,
          shading: isPrimary ? ACCENT_PURPLE : LIGHT_BG,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
            left: { style: BorderStyle.SINGLE, size: 2, color: isPrimary ? PURPLE : BORDER_MID },
            right: NO_BORDER,
          },
        }),
        proCell([
          new TextRun({ text: title, font: 'Calibri', size: 20, bold: true, color: isPrimary ? PURPLE_DARK : DARK }),
        ], {
          width: 28,
          shading: isPrimary ? ACCENT_PURPLE : LIGHT_BG,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
            left: NO_BORDER,
            right: NO_BORDER,
          },
        }),
        proCell(items.map(item =>
          new TextRun({ text: item + '   ', font: 'Calibri', size: 18, color: DARK_TEXT })
        ), {
          width: 64,
          shading: isPrimary ? ACCENT_PURPLE : LIGHT_BG,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_LIGHT },
            left: NO_BORDER,
            right: { style: BorderStyle.SINGLE, size: 2, color: isPrimary ? PURPLE : BORDER_MID },
          },
        }),
      ],
    });
  }

  function arrowRow() {
    return new TableRow({
      height: { value: 280, rule: 'atLeast' },
      children: [
        proCell('', { width: 8, shading: WHITE, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
        proCell([
          new TextRun({ text: '        ↓', font: 'Calibri', size: 22, bold: true, color: PURPLE_MEDIUM }),
        ], { width: 28, shading: WHITE, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
        proCell('', { width: 64, shading: WHITE, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
      ],
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      stepRow('✍️', 'ENTRÉE UTILISATEUR', ['Écriture libre (50-2000 car.)  |  Dictée vocale fr-FR en temps réel'], false),
      arrowRow(),
      stepRow('🧠', 'ANALYSE ÉMOTIONNELLE', ['1. Claude API (Anthropic) — prioritaire  |  2. Fallback local par mots-clés — 100% disponibilité'], true),
      arrowRow(),
      stepRow('🎨', 'GÉNÉRATION VISUELLE', ['1. Mode IA (Stable Diffusion via Pollinations)  |  2. Mode Canvas (6 algos, offline, instantané)'], true),
      arrowRow(),
      stepRow('💾', 'SAUVEGARDE & AFFICHAGE', ['Supabase (PostgreSQL)  →  Mosaïque interactive  →  Export HD 2000×2000px'], false),
    ],
  });
}

// ===== DOCUMENT =====
async function generateDocument() {
  console.log('📝 Génération du document Word (version PRO)...');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: DARK_TEXT },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1300, right: 1300 },
          },
        },
        children: [
          // ===== PAGE DE TITRE =====
          emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'ECHO.', font: 'Calibri', size: 72, bold: true, color: PURPLE }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Journaling émotionnel augmenté par l\'intelligence artificielle', font: 'Calibri', size: 24, color: GREY, italics: true }),
            ],
          }),
          emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━', font: 'Calibri', size: 24, color: ACCENT_PURPLE }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'CONCURRENCE & OFFRE', font: 'Calibri', size: 40, bold: true, color: DARK }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━', font: 'Calibri', size: 24, color: ACCENT_PURPLE }),
            ],
          }),
          emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Marieme SARR', font: 'Calibri', size: 28, bold: true, color: DARK }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'Février 2026', font: 'Calibri', size: 22, color: GREY }),
            ],
          }),

          // ===== PAGE BREAK =====
          new Paragraph({ children: [new PageBreak()] }),

          // ===== 1. ANALYSE DE LA CONCURRENCE =====
          heading('1. Analyse de la concurrence'),

          heading('1.1 Contexte du marché', HeadingLevel.HEADING_2),

          para('Le marché mondial des applications de santé mentale est estimé à 8,64 milliards USD en 2026 et devrait atteindre 35,29 milliards USD d\'ici 2034, avec un taux de croissance annuel composé (TCAC) de 19,23 % (Fortune Business Insights).', { indent: true }),

          para('En France, le marché de la santé mentale numérique devrait atteindre 8,14 milliards USD d\'ici 2035 avec un TCAC de 18,48 %, soutenu par la déclaration de la santé mentale comme grande cause nationale en 2025.', { indent: true }),

          para('Le segment spécifique du journaling émotionnel en ligne représente 1,2 milliard USD en 2024 et devrait tripler pour atteindre 3,5 milliards USD d\'ici 2033 (TCAC de 12,5 %).', { indent: true }),

          para([
            new TextRun({ text: 'Ce contexte est favorable à ECHO. : ', font: 'Calibri', size: 22, color: DARK_TEXT }),
            new TextRun({ text: 'la demande pour des outils numériques d\'introspection émotionnelle est en pleine explosion', font: 'Calibri', size: 22, color: DARK, bold: true }),
            new TextRun({ text: ', portée par une prise de conscience post-COVID de l\'importance de la santé mentale — seulement 12 % des Français estiment être en bonne santé psychique.', font: 'Calibri', size: 22, color: DARK_TEXT }),
          ], { indent: true }),

          emptyLine(),
          heading('1.2 Concurrence directe', HeadingLevel.HEADING_2),

          para('Les concurrents directs sont des applications de journaling émotionnel avec composante IA et/ou suivi d\'humeur, ciblant un usage quotidien de bien-être personnel.'),

          emptyLine(),
          createProTable(
            ['Concurrent', 'Pays', 'Modèle', 'Prix', 'Points forts', 'Limites'],
            [
              ['Daylio', 'Slovaquie', 'Freemium', '4,99 $/mois', 'Micro-journaling sans écriture, icônes d\'humeur, stats avancées, 4,8★', 'Pas d\'IA, pas de génération visuelle, pas de voix'],
              ['Reflectly', 'Danemark', 'Freemium', '9,99 $/mois', 'IA conversationnelle, prompts personnalisés, approche CBT', 'Premium peu différencié, pas de visualisation artistique'],
              ['Moodflow', 'International', 'Freemium', '3,49 $/mois', 'Défis 28 jours, journal de gratitude, routines', 'Pas d\'IA, pas de voix, fonctionnalités basiques'],
              ['Rosebud', 'USA', 'Freemium', '~7,99 $/mois', 'IA avancée, reconnaissance de patterns, analyse hebdo', 'Anglophone uniquement, pas de visualisation artistique'],
              ['Moodnotes', 'USA', 'Payant', '~3,99 $ (achat)', 'Basé sur la CBT, pièges de pensée', 'Pas d\'IA, design vieillissant'],
            ],
            [14, 10, 10, 12, 28, 26]
          ),

          emptyLine(),
          heading('1.3 Concurrence indirecte', HeadingLevel.HEADING_2),

          para('Les concurrents indirects sont des applications de bien-être mental au sens large, intégrant des fonctionnalités de journaling ou de suivi émotionnel en complément de leur offre principale.'),

          emptyLine(),
          createProTable(
            ['Concurrent', 'Catégorie', 'Journaling', 'Prix', 'Menace'],
            [
              ['Calm', 'Méditation & sommeil', 'Suivi d\'humeur, méditations personnalisées', '49,99 $/an', 'Moyenne'],
              ['Headspace', 'Méditation & coaching', 'Suivi humeur quotidien, chatbot IA "Ebb"', '~12,99 $/mois', 'Moyenne'],
              ['Youper', 'Thérapie IA', 'Check-ins émotionnels, conversations CBT', 'Freemium', 'Élevée'],
              ['Day One', 'Journal traditionnel', 'Journal riche (photos, vidéos, lieux)', '34,99 $/an', 'Faible'],
              ['Teale 🇫🇷', 'Bien-être au travail', 'Bien-être mental en entreprise, stress', 'B2B', 'Faible'],
            ],
            [14, 18, 30, 14, 12]
          ),

          emptyLine(),
          heading('1.4 Synthèse concurrentielle', HeadingLevel.HEADING_2),

          para([
            new TextRun({ text: 'Le marché présente une fragmentation importante ', font: 'Calibri', size: 22, color: DARK_TEXT }),
            new TextRun({ text: 'avec de nombreux acteurs, mais aucun ne combine simultanément :', font: 'Calibri', size: 22, color: DARK_TEXT }),
          ]),

          bullet([new TextRun({ text: '✅  Journaling émotionnel en français', font: 'Calibri', size: 21, color: GREEN_CHECK })]),
          bullet([new TextRun({ text: '✅  Analyse IA des émotions (10 dimensions)', font: 'Calibri', size: 21, color: GREEN_CHECK })]),
          bullet([new TextRun({ text: '✅  Génération de visualisations artistiques (art génératif)', font: 'Calibri', size: 21, color: GREEN_CHECK })]),
          bullet([new TextRun({ text: '✅  Dictée vocale en français natif', font: 'Calibri', size: 21, color: GREEN_CHECK })]),
          bullet([new TextRun({ text: '✅  Approche esthétique et sensorielle', font: 'Calibri', size: 21, color: GREEN_CHECK })]),

          emptyLine(),
          para([
            new TextRun({ text: 'ECHO. se positionne sur un espace blanc ', font: 'Calibri', size: 22, color: PURPLE, bold: true }),
            new TextRun({ text: ': l\'intersection entre le journaling émotionnel, l\'art génératif et l\'IA, avec un ancrage francophone.', font: 'Calibri', size: 22, color: DARK_TEXT }),
          ]),

          // ===== 2. CARTOGRAPHIE =====
          new Paragraph({ children: [new PageBreak()] }),
          heading('2. Cartographie des concurrents'),

          heading('2.1 Matrice de positionnement', HeadingLevel.HEADING_2),
          para('La matrice ci-dessous positionne les acteurs selon deux axes stratégiques : le niveau d\'intégration de l\'IA (axe vertical) et la richesse de l\'expérience visuelle/artistique (axe horizontal).'),

          emptyLine(),
          createPositioningMatrix(),

          emptyLine(),
          para([
            new TextRun({ text: '★ ECHO. ', font: 'Calibri', size: 22, bold: true, color: PURPLE }),
            new TextRun({ text: 'se positionne en haut à droite : forte IA + forte expérience visuelle — un positionnement unique sur le marché.', font: 'Calibri', size: 22, color: DARK_TEXT }),
          ]),

          emptyLine(),
          heading('2.2 Comparatif fonctionnel', HeadingLevel.HEADING_2),

          createComparisonTable(
            ['Critère', 'Daylio', 'Reflectly', 'Moodflow', 'Rosebud', 'Calm', 'ECHO.'],
            [
              ['Analyse IA émotions', '❌', '✅ Basique', '❌', '✅ Avancée', '❌', '✅ Avancée (Claude)'],
              ['Visualisation artistique', '❌', '❌', '❌', '❌', '❌', '✅ 6 styles + IA'],
              ['Dictée vocale', '❌', '✅', '❌', '❌', '❌', '✅ Français natif'],
              ['Français natif', '❌', '❌', '❌', '❌', '✅ Partiel', '✅ 100 %'],
              ['10 émotions fines', '❌', '❌', '❌', '❌', '❌', '✅ Modèle propriétaire'],
              ['Export HD (poster)', '❌', '❌', '❌', '❌', '❌', '✅ 2000×2000px'],
              ['Mode hors ligne', '✅', '✅', '✅', '❌', '❌', '✅ Canvas offline'],
              ['Prix entrée', 'Gratuit', 'Gratuit', 'Gratuit', 'Gratuit', '49,99$/an', 'Gratuit'],
            ],
            [17, 9, 11, 10, 12, 9, 22]
          ),

          // ===== 3. AVANTAGES CONCURRENTIELS =====
          new Paragraph({ children: [new PageBreak()] }),
          heading('3. Avantages concurrentiels et barrières à l\'entrée'),

          heading('3.1 Avantages concurrentiels d\'ECHO.', HeadingLevel.HEADING_2),

          emptyLine(),
          boldPara('① Proposition de valeur unique — « L\'émotion devient art » — ', 'ECHO. est la première application qui transforme les émotions de l\'utilisateur en visualisations artistiques uniques grâce à l\'art génératif. Aucun concurrent ne propose cette fusion entre journaling émotionnel et création artistique personnalisée.'),
          emptyLine(),
          boldPara('② Double moteur IA propriétaire — ', 'Analyse émotionnelle via Claude (Anthropic) avec un modèle à 10 émotions francophones plus granulaire que le simple « positif/négatif » des concurrents. Fallback intelligent local garantissant une disponibilité de 100 %.'),
          emptyLine(),
          boldPara('③ Dictée vocale native en français — ', 'La reconnaissance vocale (Web Speech API, fr-FR) permet de dicter ses émotions naturellement, avec transcription en temps réel. Cela abaisse considérablement la barrière à l\'entrée pour les utilisateurs qui n\'aiment pas écrire.'),
          emptyLine(),
          boldPara('④ Positionnement francophone — ', 'Interface, prompts IA, émotions et vocabulaire entièrement pensés en français. Les concurrents majeurs (Daylio, Reflectly, Rosebud) sont anglophones avec des traductions parfois approximatives.'),
          emptyLine(),
          boldPara('⑤ Architecture résiliente et économique — ', 'Le mode Canvas (gratuit, instantané, hors ligne) ne dépend d\'aucune API externe. Le mode IA (Stable Diffusion via Pollinations.ai) offre une génération d\'images sans coût de serveur GPU. Coût marginal par utilisateur quasi nul.'),
          emptyLine(),
          boldPara('⑥ Modèle freemium accessible — ', 'Gratuit : 50 entrées/mois, mosaïque, analyse IA. Premium (8 €/mois) : illimité, dictée vocale, 6 styles. Studio (24 €/mois) : export poster/livre HD, archivage.'),

          emptyLine(),
          heading('3.2 Barrières à l\'entrée', HeadingLevel.HEADING_2),

          createProTable(
            ['Barrière', 'Description', 'Niveau'],
            [
              ['Complexité technique', 'Combiner analyse IA, art génératif (6 algorithmes Canvas), reconnaissance vocale et infrastructure serverless requiert une expertise multidisciplinaire', '🔒🔒🔒 Élevé'],
              ['Modèle émotionnel francophone', 'Le lexique de 10 émotions avec palettes de couleurs et algorithmes de visualisation associés constitue un actif propriétaire difficile à reproduire', '🔒🔒🔒 Élevé'],
              ['Coût d\'acquisition utilisateur', 'Le marché du bien-être mental est saturé en publicité ; la différenciation par l\'art génératif offre un avantage organique (viralité visuelle)', '🔒🔒 Moyen'],
              ['Effet de réseau', 'Plus l\'utilisateur crée de tuiles, plus sa mosaïque devient précieuse, créant un switching cost émotionnel', '🔒🔒 Moyen'],
              ['Réglementation données', 'La conformité RGPD et les bonnes pratiques en matière de données de santé mentale nécessitent une attention juridique', '🔒🔒 Moyen'],
            ],
            [20, 58, 16]
          ),

          // ===== 4. PRODUIT / SERVICE =====
          new Paragraph({ children: [new PageBreak()] }),
          heading('4. Le produit et/ou le service'),

          heading('4.1 Description du produit', HeadingLevel.HEADING_2),

          para([
            new TextRun({ text: 'ECHO.', font: 'Calibri', size: 22, bold: true, color: PURPLE }),
            new TextRun({ text: ' est une application web progressive (PWA) de ', font: 'Calibri', size: 22, color: DARK_TEXT }),
            new TextRun({ text: 'journaling émotionnel augmenté par l\'intelligence artificielle', font: 'Calibri', size: 22, bold: true, color: DARK }),
            new TextRun({ text: ', qui transforme chaque entrée textuelle ou vocale en une visualisation artistique unique.', font: 'Calibri', size: 22, color: DARK_TEXT }),
          ], { indent: true }),

          para('L\'utilisateur exprime ses émotions par écrit ou par la voix. L\'IA analyse le texte pour identifier l\'émotion dominante parmi 10 émotions, son intensité (0 à 10) et sa valence (positive, négative, neutre). Un algorithme génératif crée ensuite une œuvre visuelle personnalisée qui incarne cette émotion, dans le style artistique choisi par l\'utilisateur.', { indent: true }),

          para('Chaque visualisation rejoint une mosaïque personnelle — un tableau vivant de l\'historique émotionnel de l\'utilisateur, consultable et exportable.', { indent: true }),

          emptyLine(),
          heading('4.2 Fonctionnalités principales', HeadingLevel.HEADING_2),

          createProTable(
            ['Fonctionnalité', 'Description', 'Tier'],
            [
              ['Écriture émotionnelle', 'Zone de texte guidée (50-2000 caractères), placeholder empathique', 'Gratuit'],
              ['Dictée vocale', 'Reconnaissance vocale fr-FR, transcription temps réel, ondes visuelles', 'Premium'],
              ['Analyse IA', 'Détection de 10 émotions, intensité 0-10, valence, mots-clés', 'Gratuit'],
              ['Visualisation Canvas', '6 styles génératifs (géométrique, organique, aquarelle, minimaliste, abstrait, mosaïque)', 'Gratuit'],
              ['Visualisation IA', 'Art unique via Stable Diffusion, prompt émotionnel automatique', 'Premium'],
              ['Mosaïque interactive', 'Grille responsive, survol avec détails, navigation entre tuiles', 'Gratuit'],
              ['Statistiques', 'Distribution émotionnelle, intensité moyenne, heatmap 6 mois', 'Gratuit'],
              ['Export HD', 'Posters et livres à 2000×2000px, archivage haute qualité', 'Studio'],
              ['Dark mode', 'Thème sombre adaptatif', 'Gratuit'],
              ['Sauvegarde auto', 'Brouillons persistants dans le navigateur', 'Gratuit'],
            ],
            [20, 58, 14]
          ),

          emptyLine(),
          heading('4.3 Les 6 styles de visualisation', HeadingLevel.HEADING_2),

          para('Chaque style est un algorithme Canvas unique qui génère des œuvres procédurales non reproductibles :'),

          bullet([
            new TextRun({ text: 'Géométrique', font: 'Calibri', size: 21, bold: true, color: PURPLE }),
            new TextRun({ text: ' — Polygones rotatifs avec gradients radiaux, formes cristallines', font: 'Calibri', size: 21, color: DARK_TEXT }),
          ]),
          bullet([
            new TextRun({ text: 'Organique', font: 'Calibri', size: 21, bold: true, color: PURPLE }),
            new TextRun({ text: ' — Blobs fluides avec courbes de Bézier, formes vivantes', font: 'Calibri', size: 21, color: DARK_TEXT }),
          ]),
          bullet([
            new TextRun({ text: 'Aquarelle', font: 'Calibri', size: 21, bold: true, color: PURPLE }),
            new TextRun({ text: ' — Effet peinture à l\'eau avec transparences superposées', font: 'Calibri', size: 21, color: DARK_TEXT }),
          ]),
          bullet([
            new TextRun({ text: 'Minimaliste', font: 'Calibri', size: 21, bold: true, color: PURPLE }),
            new TextRun({ text: ' — Cercles concentriques et lignes épurées, esthétique zen', font: 'Calibri', size: 21, color: DARK_TEXT }),
          ]),
          bullet([
            new TextRun({ text: 'Abstrait', font: 'Calibri', size: 21, bold: true, color: PURPLE }),
            new TextRun({ text: ' — Courbes expressives et rectangles, énergie et mouvement', font: 'Calibri', size: 21, color: DARK_TEXT }),
          ]),
          bullet([
            new TextRun({ text: 'Mosaïque', font: 'Calibri', size: 21, bold: true, color: PURPLE }),
            new TextRun({ text: ' — Grille de tuiles colorées avec opacités variables, effet pixelisé', font: 'Calibri', size: 21, color: DARK_TEXT }),
          ]),

          emptyLine(),
          para('Chaque style est modulé par l\'émotion dominante (palette de couleurs dédiée), l\'intensité (0-10, affecte la complexité) et la randomisation (chaque génération est unique).'),

          emptyLine(),
          heading('4.4 Éléments de différenciation', HeadingLevel.HEADING_2),

          createProTable(
            ['Axe', 'Concurrents', 'ECHO.'],
            [
              ['Output', 'Texte, graphiques, statistiques', 'Art génératif unique — l\'émotion devient tangible'],
              ['Expérience', 'Utilitaire, fonctionnel', 'Sensoriel, esthétique, contemplatif'],
              ['Rétention', 'Habitude par rappels', 'Mosaïque qui se construit — motivation intrinsèque'],
              ['Partage', 'Screenshots de stats', 'Œuvres visuelles partageables sur les réseaux'],
              ['Granularité', '5 niveaux d\'humeur (bien → mal)', '10 émotions × 10 intensités = 100 états'],
              ['Langue', 'Anglais (traductions)', 'Français natif, lexique émotionnel adapté'],
            ],
            [14, 36, 46]
          ),

          // ===== 5. R&D =====
          new Paragraph({ children: [new PageBreak()] }),
          heading('5. R&D et aspects techniques'),

          heading('5.1 Stack technologique', HeadingLevel.HEADING_2),

          createProTable(
            ['Couche', 'Technologie', 'Justification'],
            [
              ['Frontend', 'Next.js 14, React 18, TypeScript', 'SSR performant, typage fort, écosystème mature'],
              ['Styling', 'Tailwind CSS 3.4, CSS Variables', 'Design system cohérent, responsive, dark mode'],
              ['Typographie', 'Fraunces (serif), Manrope (sans)', 'Identité visuelle premium, lisibilité optimale'],
              ['Backend', 'Next.js API Routes (serverless)', 'Pas de serveur à maintenir, scaling auto'],
              ['Base de données', 'Supabase (PostgreSQL)', 'Open-source, auth intégrée, RGPD-friendly'],
              ['Auth', 'Supabase Auth', 'Email/password, sessions JWT'],
              ['IA — Analyse', 'API Claude (Anthropic, Sonnet)', 'Meilleure compréhension du français'],
              ['IA — Fallback', 'Analyse locale par mots-clés', 'Disponibilité 100 %, zéro dépendance'],
              ['IA — Images', 'Pollinations.ai (Stable Diffusion)', 'Gratuit, pas de GPU nécessaire'],
              ['Visualisation', 'Canvas 2D API (6 algos propriétaires)', 'Génération instantanée côté client'],
              ['Voix', 'Web Speech API (fr-FR)', 'Natif navigateur, privacy-first'],
              ['Validation', 'Zod 4', 'Validation TypeScript, sécurité données'],
            ],
            [16, 34, 46]
          ),

          emptyLine(),
          heading('5.2 Architecture et résilience', HeadingLevel.HEADING_2),

          para('L\'architecture d\'ECHO. repose sur un principe de dégradation gracieuse (graceful degradation) :'),

          emptyLine(),
          createArchitectureDiagram(),

          emptyLine(),
          para('Ce système garantit que l\'application fonctionne toujours, même en cas de panne API. La logique de retry (2 tentatives avec backoff exponentiel) assure une robustesse maximale.'),

          emptyLine(),
          heading('5.3 Innovations R&D', HeadingLevel.HEADING_2),

          createProTable(
            ['Innovation', 'Description', 'Statut'],
            [
              ['Modèle émotionnel 10D', 'Classification émotionnelle propriétaire en français avec palettes chromatiques', '✅ Implémenté'],
              ['Art génératif paramétrique', '6 algorithmes Canvas modulés par émotion, intensité et aléatoire', '✅ Implémenté'],
              ['Double pipeline IA', 'Claude + fallback local, Stable Diffusion + fallback Canvas', '✅ Implémenté'],
              ['Export HD', 'Visualisations 2000×2000px pour impression poster/livre', '✅ Implémenté'],
              ['Reconnaissance vocale fr-FR', 'Dictée continue avec transcription temps réel', '✅ Implémenté'],
              ['Analyse vocale émotionnelle', 'Détection d\'émotions depuis la prosodie et le ton', '🔄 Roadmap'],
              ['Mode communauté', 'Mosaïques collectives anonymes par thème émotionnel', '🔄 Roadmap'],
              ['Intégration wearables', 'Données biométriques (fréquence cardiaque) pour enrichir l\'analyse', '🔄 Roadmap'],
            ],
            [22, 54, 16]
          ),

          emptyLine(),
          heading('5.4 Propriété intellectuelle', HeadingLevel.HEADING_2),

          createProTable(
            ['Actif', 'Type', 'Protection'],
            [
              ['6 algorithmes de visualisation', 'Code source', 'Droit d\'auteur (code)'],
              ['Modèle émotionnel 10 dimensions + palettes', 'Base de données / savoir-faire', 'Secret commercial'],
              ['Interface et design system', 'Création graphique', 'Droit d\'auteur'],
              ['Marque ECHO. + logo', 'Identité visuelle', 'Dépôt de marque (à effectuer)'],
            ],
            [36, 30, 30]
          ),

          // ===== 6. BUSINESS MODEL CANVAS =====
          new Paragraph({ children: [new PageBreak()] }),
          heading('6. Business Model Canvas — Produit/Service'),

          para('Le Business Model Canvas ci-dessous synthétise les 9 blocs stratégiques de l\'offre ECHO., structurés selon le modèle d\'Alexander Osterwalder.'),

          emptyLine(),
          createBMCTable(),

          // ===== SOURCES =====
          emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━', font: 'Calibri', size: 20, color: ACCENT_PURPLE }),
            ],
          }),
          emptyLine(),
          heading('Sources et références', HeadingLevel.HEADING_3),
          bullet([new TextRun({ text: 'Fortune Business Insights — Mental Health Apps Market (2026-2034)', font: 'Calibri', size: 20, color: GREY, italics: true })]),
          bullet([new TextRun({ text: 'Spherical Insights — France Digital Mental Health Market (2025-2035)', font: 'Calibri', size: 20, color: GREY, italics: true })]),
          bullet([new TextRun({ text: 'Mordor Intelligence — Mental Health Apps Market Size & Share', font: 'Calibri', size: 20, color: GREY, italics: true })]),
          bullet([new TextRun({ text: 'Bpifrance Le Hub — Les 6 chiffres clés du secteur de l\'e-santé', font: 'Calibri', size: 20, color: GREY, italics: true })]),
          bullet([new TextRun({ text: 'Verified Market Reports — Online Journal App Market', font: 'Calibri', size: 20, color: GREY, italics: true })]),
          bullet([new TextRun({ text: 'Vantage Fit — Best Mood Tracker Apps 2026', font: 'Calibri', size: 20, color: GREY, italics: true })]),

          emptyLine(), emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Document rédigé par Marieme SARR — Projet ECHO.', font: 'Calibri', size: 20, italics: true, color: GREY }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Données de marché actualisées — Février 2026', font: 'Calibri', size: 20, italics: true, color: GREY }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'exports', 'Concurrence-Offre-ECHO-Marieme-SARR.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  ✅ DOCUMENT WORD PRO GÉNÉRÉ !                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║                                                      ║');
  console.log('║  📄 exports/Concurrence-Offre-ECHO-Marieme-SARR.docx ║');
  console.log('║                                                      ║');
  console.log('║  ✨ Tableaux professionnels avec bordures fines       ║');
  console.log('║  ✨ Matrice de positionnement en grille visuelle      ║');
  console.log('║  ✨ Business Model Canvas en layout 5 colonnes        ║');
  console.log('║  ✨ Diagramme d\'architecture stylisé                  ║');
  console.log('║  ✨ Comparatif fonctionnel colorisé                   ║');
  console.log('║                                                      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}

generateDocument().catch(err => {
  console.error('❌ Erreur:', err.message);
  console.error(err.stack);
  process.exit(1);
});
