/**
 * Kisan Seva - Mini Project Synopsis (.docx)
 * Template-following mode: mirrors the user's sample synopsis structure.
 * English document -> Times New Roman throughout. No cover, no TOC (short doc).
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType,
} = require("docx");
const fs = require("fs");

// ---- Palette (mirrors PDF cascade palette) ----
const C = {
  text: "181816",
  muted: "87857D",
  headerFill: "524B36",
  stripe: "F0EFED",
  border: "D5D2CB",
};
const FONT = "Times New Roman";
const BLANK = "____________________";

const cellMargins = { top: 50, bottom: 50, left: 120, right: 120 };

// ---- Helpers ----
function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 150, after: 70, line: 312 },
    children: [new TextRun({
      text, bold: true, size: 24, color: "000000",
      font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT },
    })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 70, line: 312 },
    children: [new TextRun({
      text, size: 21, color: C.text,
      font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT },
    })],
    ...opts,
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    alignment: AlignmentType.LEFT,
    spacing: { after: 25, line: 312 },
    children: [new TextRun({
      text, size: 21, color: C.text,
      font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT },
    })],
  });
}

function stage(name, desc) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 240 },
    spacing: { after: 50, line: 312 },
    children: [
      new TextRun({ text: name + ": ", bold: true, size: 21, color: C.text, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT } }),
      new TextRun({ text: desc, size: 21, color: C.text, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT } }),
    ],
  });
}

function run(text, opts = {}) {
  return new TextRun({
    text, size: 21, color: C.text,
    font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT },
    ...opts,
  });
}

function cellPara(text, opts = {}) {
  const { bold = false, color = C.text, align = AlignmentType.LEFT, size = 20 } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { line: 312 },
    children: [new TextRun({ text, bold, size, color, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT } })],
  });
}

const gridBorders = {
  top: { style: BorderStyle.SINGLE, size: 5, color: C.border },
  bottom: { style: BorderStyle.SINGLE, size: 5, color: C.border },
  left: { style: BorderStyle.SINGLE, size: 5, color: C.border },
  right: { style: BorderStyle.SINGLE, size: 5, color: C.border },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 5, color: C.border },
  insideVertical: { style: BorderStyle.SINGLE, size: 5, color: C.border },
};

function makeTable(rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: gridBorders,
    rows,
  });
}

// ---- Header block ----
const headerBlock = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40, line: 312 },
    children: [run("AKASH INSTITUTE OF ENGINEERING AND TECHNOLOGY", { bold: true, size: 25 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 312 },
    children: [run("Department of Artificial Intelligence and Data Science", { size: 21 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, line: 312 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 9, color: C.headerFill, space: 4 } },
    children: [run("MINI PROJECT SYNOPSIS", { size: 20, color: C.muted })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160, line: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: C.border, space: 6 } },
    children: [run("KISAN SEVA \u2013 VOICE-BASED FARMER ASSISTANT", { bold: true, size: 30 })],
  }),
];

// ---- 1-4 ----
const sec1to4 = [
  heading("1. INTRODUCTION"),
  body("Kisan Seva is a voice-based AI web assistant that delivers agricultural advisory services through simple spoken conversation. The farmer speaks a question in English, Hindi, or Kannada; the system converts the speech to text, understands its intent using Artificial Intelligence and Natural Language Processing (NLP), and replies with a short, spoken answer. It targets the three most urgent farming questions: what is wrong with a crop, what the weather will be, and what price the produce may fetch. It also includes a Photo Crop Doctor (leaf photo disease diagnosis), a Daily Voice Bulletin of district weather and mandi prices, and live weather updates, so that reliable advice requires no reading, typing, or technical skill."),
  heading("2. PROBLEM STATEMENT"),
  body("Farmers need timely information about crop diseases, weather, and market prices, but existing digital sources are text-heavy, predominantly in English, and demand typing and navigation skills that many farmers do not possess. Diseases are traditionally identified only through expert visits or lab trips, during which the infection spreads and costs rise. Weather and price information is scattered across sources and often reached too late, forcing farmers to depend on guesswork and middlemen. There is therefore a clear need for a single, zero-literacy tool where a farmer can simply speak a question and immediately receive an understandable spoken answer."),
  heading("3. OBJECTIVES"),
  bullet("To develop a voice-first web assistant that accepts the farmer's questions by speech."),
  bullet("To support English, Hindi, and Kannada for both voice input and spoken output."),
  bullet("To classify spoken queries into crop disease, weather, and market-price categories using AI/NLP."),
  bullet("To reply with short, spoken-style answers through text-to-speech (TTS) in the farmer's chosen language."),
  bullet("To provide instant crop disease diagnosis from an uploaded leaf photo using vision AI."),
  bullet("To deliver a daily voice bulletin of district weather and mandi prices."),
  bullet("To fetch real-time weather data from a public API with fallback sources."),
  bullet("To personalise answers using secure phone-based login with district and language preferences."),
  bullet("To keep the interface simple, mobile-friendly, and fully usable without literacy."),
  heading("4. PROPOSED SYSTEM"),
  body("The proposed system is a web application built around a conversational voice assistant. The farmer taps the microphone and speaks; the browser's speech recognition converts the utterance to text, and an AI model classifies it into one of the three domains and extracts details such as the crop and the district. The system then generates disease management advice, fetches live weather, or looks up mandi prices, and composes a short spoken-style answer in the selected language, which is displayed and automatically spoken back. A Photo Crop Doctor screen lets the farmer upload a leaf image and receive the likely disease with precautionary measures. District and language preferences personalise every answer, and each query is saved for history."),
];

// ---- 5. Methodology ----
const stages = [
  ["Data Collection", "Assemble crop disease advisories, a mandi price dataset for Karnataka markets, and the district list for weather lookups."],
  ["Speech Pipeline", "Capture speech through the Web Speech API in en-IN, hi-IN, and kn-IN locales and convert it into text."],
  ["AI/NLP Processing", "Use a large language model to classify each query into crop disease, weather, price, or general, extracting entities such as crop and district."],
  ["Answer Generation", "Generate short, spoken-style answers in the chosen language, grounded in the retrieved data."],
  ["Vision Diagnosis", "Analyse the uploaded leaf photo with a vision model that identifies the likely disease and returns precautionary measures."],
  ["Speech Output", "Convert the final answer to speech with a voice matched to the selected language."],
  ["Reliability and Storage", "Apply fallback chains for API failures and persist every query for user history."],
  ["Testing", "Test all categories and languages, typed and spoken input, and failure cases such as network loss."],
];
const sec5 = [heading("5. METHODOLOGY"), ...stages.map(([n, d]) => stage(n, d))];

// ---- 6. Architecture ----
const sec6 = [
  heading("6. SYSTEM ARCHITECTURE"),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 120, line: 312 },
    children: [run("Farmer \u2192 Voice / Photo Input \u2192 Next.js Web Backend \u2192 AI/NLP Intent Classification \u2192 [Crop Disease Advice | Live Weather API | Price Database | Vision Diagnosis] \u2192 Answer Generation \u2192 Text-to-Speech \u2192 Spoken Answer to Farmer")],
  }),
];

// ---- 7. Technologies table ----
const techRowsData = [
  ["Frontend", "Next.js 16, TypeScript, Tailwind CSS"],
  ["Backend", "Next.js API routes (Node.js)"],
  ["AI / NLP", "LLM (intent classification, answers); Vision model (disease diagnosis)"],
  ["Speech", "Web Speech API for Speech-to-Text (STT) and Text-to-Speech (TTS)"],
  ["Database", "Prisma ORM with SQLite"],
  ["Weather Data", "Open-Meteo live API with fallback weather sources"],
  ["Authentication", "Phone-number login, scrypt password hashing, signed session cookies"],
  ["Development Tools", "Visual Studio Code, Git, Google Chrome / Microsoft Edge"],
];
const techHeader = new TableRow({
  tableHeader: true,
  cantSplit: true,
  children: [
    new TableCell({
      children: [cellPara("Component", { bold: true, color: "FFFFFF" })],
      shading: { type: ShadingType.CLEAR, fill: C.headerFill },
      margins: cellMargins,
      width: { size: 28, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [cellPara("Technology", { bold: true, color: "FFFFFF" })],
      shading: { type: ShadingType.CLEAR, fill: C.headerFill },
      margins: cellMargins,
      width: { size: 72, type: WidthType.PERCENTAGE },
    }),
  ],
});
const techDataRowsFixed = techRowsData.map(([k, v], i) => new TableRow({
  cantSplit: true,
  children: [
    new TableCell({
      children: [cellPara(k)],
      shading: i % 2 === 1 ? { type: ShadingType.CLEAR, fill: C.stripe } : undefined,
      margins: cellMargins,
      width: { size: 28, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [cellPara(v)],
      shading: i % 2 === 1 ? { type: ShadingType.CLEAR, fill: C.stripe } : undefined,
      margins: cellMargins,
      width: { size: 72, type: WidthType.PERCENTAGE },
    }),
  ],
}));
const techTable = makeTable([techHeader, ...techDataRowsFixed]);

const sec7 = [
  new Paragraph({
    keepNext: true,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 150, after: 70, line: 312 },
    children: [new TextRun({ text: "7. TECHNOLOGIES USED", bold: true, size: 24, color: "000000", font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT } })],
  }),
  techTable,
];

// ---- 8-12 ----
const sec8to12 = [
  new Paragraph({ spacing: { after: 60 }, children: [run("", { size: 2 })] }),
  heading("8. EXPECTED OUTCOME"),
  body("The project is expected to produce a working voice assistant that answers a farmer's spoken question within seconds, in the farmer's own language and district context. The system will deliver instant spoken advice on crop disease, weather, and prices, diagnose uploaded leaf photos on demand, and read out a daily bulletin of district weather and mandi rates. By removing the literacy and typing barriers, it is expected to reduce farmers' dependence on middlemen and demonstrate a practical use of AI for rural users."),
  heading("9. SCOPE OF THE PROJECT"),
  body("The initial version focuses on the three advisory domains, three languages, and district-level weather and mandi prices for Karnataka, delivered as a web application that runs in any modern smartphone browser. Future enhancements can add more regional languages and crops, a native Android application, telephone (IVR) access for farmers without smartphones, offline caching of daily bulletins, government scheme information, and an administrative dashboard with usage analytics."),
  heading("10. HARDWARE REQUIREMENTS"),
  bullet("A laptop or desktop with at least 4 GB RAM and an internet connection."),
  bullet("A microphone (built-in or external) for voice queries."),
  bullet("A smartphone with microphone and camera for field use and photo-based diagnosis."),
  heading("11. SOFTWARE REQUIREMENTS"),
  bullet("Windows or any modern operating system."),
  bullet("Node.js 20+ runtime with the Next.js framework, Prisma ORM, and SQLite database."),
  bullet("Visual Studio Code editor and Git version control."),
  bullet("Google Chrome or Microsoft Edge browser (Web Speech API support)."),
  heading("12. CONCLUSION"),
  body("Kisan Seva demonstrates how speech recognition, artificial intelligence, and computer vision can be combined into one practical tool for smallholder farmers. By letting farmers ask questions in their own voice and receive spoken answers in return, the system removes the literacy and typing barriers that keep most digital advisory services out of reach, and provides an extensible foundation for a complete digital agricultural advisory platform for rural India."),
];

// ---- 13. Team details ----
const infoRows = [
  ["Project Title", "Kisan Seva \u2013 Voice-Based Farmer Assistant"],
  ["Department", "Artificial Intelligence and Data Science"],
  ["Semester", "5th Semester"],
  ["Institute", "Akash Institute of Engineering and Technology"],
  ["Academic Year", "2026\u20132027"],
];
const infoTable = makeTable(infoRows.map(([k, v]) => new TableRow({
  cantSplit: true,
  children: [
    new TableCell({
      children: [cellPara(k, { bold: true })],
      margins: cellMargins,
      width: { size: 30, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [cellPara(v)],
      margins: cellMargins,
      width: { size: 70, type: WidthType.PERCENTAGE },
    }),
  ],
})));

const rosterHeader = new TableRow({
  tableHeader: true,
  cantSplit: true,
  children: [
    new TableCell({
      children: [cellPara("Role", { bold: true, color: "FFFFFF" })],
      shading: { type: ShadingType.CLEAR, fill: C.headerFill },
      margins: cellMargins,
      width: { size: 24, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [cellPara("Name", { bold: true, color: "FFFFFF" })],
      shading: { type: ShadingType.CLEAR, fill: C.headerFill },
      margins: cellMargins,
      width: { size: 44, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [cellPara("USN", { bold: true, color: "FFFFFF" })],
      shading: { type: ShadingType.CLEAR, fill: C.headerFill },
      margins: cellMargins,
      width: { size: 32, type: WidthType.PERCENTAGE },
    }),
  ],
});
const rosterRows = [];
for (let i = 1; i <= 4; i++) {
  const fill = i % 2 === 0 ? { type: ShadingType.CLEAR, fill: C.stripe } : undefined;
  rosterRows.push(new TableRow({
    cantSplit: true,
    children: [
      new TableCell({ children: [cellPara("Student " + i)], shading: fill, margins: cellMargins, width: { size: 24, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [cellPara(BLANK, { align: AlignmentType.CENTER })], shading: fill, margins: cellMargins, width: { size: 44, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [cellPara(BLANK, { align: AlignmentType.CENTER })], shading: fill, margins: cellMargins, width: { size: 32, type: WidthType.PERCENTAGE } }),
    ],
  }));
}
rosterRows.push(new TableRow({
  cantSplit: true,
  children: [
    new TableCell({ children: [cellPara("Project Guide")], margins: cellMargins, width: { size: 24, type: WidthType.PERCENTAGE } }),
    new TableCell({ children: [cellPara(BLANK, { align: AlignmentType.CENTER })], margins: cellMargins, width: { size: 76, type: WidthType.PERCENTAGE }, columnSpan: 2 }),
  ],
}));
const rosterTable = makeTable([rosterHeader, ...rosterRows]);

const sec13 = [
  new Paragraph({ spacing: { after: 60 }, children: [run("", { size: 2 })] }),
  heading("13. TEAM DETAILS"),
  infoTable,
  new Paragraph({ spacing: { after: 80 }, children: [run("", { size: 2 })] }),
  rosterTable,
];

// ---- 14. References ----
const refs = [
  "Next.js Documentation \u2013 https://nextjs.org/docs",
  "MDN Web Docs, Web Speech API \u2013 https://developer.mozilla.org/docs/Web/API/Web_Speech_API",
  "Open-Meteo Weather API \u2013 https://open-meteo.com/en/docs",
  "Prisma ORM Documentation \u2013 https://www.prisma.io/docs",
  "General references on speech recognition, natural language processing, and agricultural advisory systems.",
];
const sec14 = [
  new Paragraph({ spacing: { after: 60 }, children: [run("", { size: 2 })] }),
  heading("14. REFERENCES"),
  ...refs.map(r => bullet(r)),
];

// ---- Document ----
const doc = new Document({
  creator: "Z.ai",
  title: "Kisan Seva - Voice-Based Farmer Assistant - Mini Project Synopsis",
  subject: "Mini Project Synopsis",
  styles: {
    default: {
      document: {
        run: { font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT }, size: 21, color: C.text },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1020, bottom: 1020, left: 1080, right: 1080 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: C.muted, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT } })],
        })],
      }),
    },
    children: [
      ...headerBlock,
      ...sec1to4,
      ...sec5,
      ...sec6,
      ...sec7,
      ...sec8to12,
      ...sec13,
      ...sec14,
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/Kisan_Seva_Mini_Project_Synopsis.docx", buf);
  console.log("DOCX generated: /home/z/my-project/download/Kisan_Seva_Mini_Project_Synopsis.docx");
});
