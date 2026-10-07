import { GoogleGenAI } from '@google/genai';
import type { ClassSchedule } from '../types';

export interface ParsedTimetableClass {
  subjectName: string;
  code?: string;
  instructor?: string;
  location?: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

const PALETTE = [
  '#4338ca', // Indigo
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

export const getGeminiApiKey = (): string => {
  return (localStorage.getItem('study_flow_gemini_key') || '').trim();
};

export const setGeminiApiKey = (key: string): void => {
  localStorage.setItem('study_flow_gemini_key', key.trim());
};

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({
        mimeType: file.type || 'image/jpeg',
        data: base64Data,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const sanitizeTime = (timeStr: string, fallback: string): string => {
  if (!timeStr) return fallback;
  const clean = timeStr.trim();
  // Match HH:MM format
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = match24[1].padStart(2, '0');
    const m = match24[2];
    return `${h}:${m}`;
  }
  // Match 12-hour format with AM/PM e.g. "9:30 AM" or "02:00 PM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const ampm = match12[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  }
  return fallback;
};

const validDays: ClassSchedule['dayOfWeek'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const scanTimetableDocument = async (
  file: File,
  customApiKey?: string
): Promise<Omit<ClassSchedule, 'id'>[]> => {
  const apiKey = (customApiKey || getGeminiApiKey()).trim();
  if (!apiKey) {
    throw new Error(
      'Gemini API key is missing. Please enter your free Google AI Studio API key to scan timetables.'
    );
  }

  const { mimeType, data } = await fileToBase64(file);

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are an expert academic timetable extraction system.
Analyze the provided weekly timetable image or document (which may be a grid, list, photo of a notice board, or PDF page).
Extract all scheduled lecture, lab, tutorial, and seminar classes for the week.

Output MUST be a strictly valid JSON array of objects. Do not wrap in markdown or backticks. Return ONLY the raw JSON array.
Each object must have the following fields:
- "subjectName": string (The name of the course or subject e.g. "Data Structures", "Operating Systems")
- "code": string (Course code if visible e.g. "CS302", or empty string)
- "instructor": string (Professor / Lecturer name if available, or "TBA")
- "location": string (Classroom, Hall, Lab number e.g. "Room 402", "Lab 3", or "TBA")
- "dayOfWeek": string (Must strictly be one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
- "startTime": string (24-hour format HH:mm e.g. "09:00", "14:30")
- "endTime": string (24-hour format HH:mm e.g. "10:30", "16:00")

Ensure:
1. Deduplicate entries if identical.
2. If time ranges are given like 9:00 - 10:30 AM, convert to 24-hour "09:00" and "10:30".
3. If no courses are found, return an empty array [].`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data,
            },
          },
          {
            text: 'Extract all weekly classes from this timetable into the required JSON format.',
          },
        ],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const responseText = response.text || '[]';
  let rawParsed: ParsedTimetableClass[] = [];

  try {
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    rawParsed = JSON.parse(cleanedText);
    if (!Array.isArray(rawParsed)) rawParsed = [];
  } catch {
    throw new Error('Failed to parse timetable response from AI. Please ensure the image is clear.');
  }

  return rawParsed
    .filter((item) => Boolean(item.subjectName && item.dayOfWeek))
    .map((item, index) => {
      const normalizedDay = validDays.find(
        (d) => d.toLowerCase() === (item.dayOfWeek || '').toLowerCase()
      ) || 'Monday';

      const sTime = sanitizeTime(item.startTime, '09:00');
      const eTime = sanitizeTime(item.endTime, '10:30');

      return {
        subjectName: item.subjectName.trim(),
        code: (item.code || '').trim(),
        instructor: (item.instructor || 'TBA').trim(),
        location: (item.location || 'TBA').trim(),
        dayOfWeek: normalizedDay,
        startTime: sTime,
        endTime: eTime >= sTime ? eTime : '10:30',
        color: PALETTE[index % PALETTE.length],
      };
    });
};
