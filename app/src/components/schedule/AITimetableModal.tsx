import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  Trash2,
  Clock,
  MapPin,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ClassSchedule } from '../../types';
import {
  scanTimetableDocument,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../../services/timetableScanner';

interface AITimetableModalProps {
  open: boolean;
  onClose: () => void;
  onImportClasses: (classes: Omit<ClassSchedule, 'id'>[], replaceExisting?: boolean) => void;
}

export const AITimetableModal: React.FC<AITimetableModalProps> = ({
  open,
  onClose,
  onImportClasses,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>(getGeminiApiKey());
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!getGeminiApiKey());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedClasses, setExtractedClasses] = useState<
    (Omit<ClassSchedule, 'id'> & { selected: boolean })[]
  >([]);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleStartScan = async () => {
    if (!file) {
      setErrorMsg('Please select a timetable image or PDF first.');
      return;
    }

    const currentKey = apiKey.trim() || getGeminiApiKey();
    if (!currentKey) {
      setShowKeyInput(true);
      setErrorMsg('Please enter your free Google Gemini API Key below to scan.');
      return;
    }

    setGeminiApiKey(currentKey);
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const results = await scanTimetableDocument(file, currentKey);
      if (results.length === 0) {
        setErrorMsg('No weekly classes could be detected in this file. Please ensure the timetable image or PDF is clear.');
      } else {
        setExtractedClasses(results.map((c) => ({ ...c, selected: true })));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to scan timetable. Please check your file and API key.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleClass = (index: number) => {
    setExtractedClasses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleRemoveClass = (index: number) => {
    setExtractedClasses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateClassField = (
    index: number,
    field: keyof Omit<ClassSchedule, 'id'>,
    value: string
  ) => {
    setExtractedClasses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleConfirmImport = () => {
    const selected = extractedClasses.filter((c) => c.selected);
    if (selected.length === 0) {
      setErrorMsg('Please select at least one class to import.');
      return;
    }

    const classesToImport = selected.map((item) => ({
      subjectName: item.subjectName,
      code: item.code,
      instructor: item.instructor,
      location: item.location,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      color: item.color,
    }));
    onImportClasses(classesToImport, replaceExisting);

    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  const selectedCount = extractedClasses.filter((c) => c.selected).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2rem] border border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/95 via-purple-50/50 to-white/95 dark:from-indigo-950/45 dark:via-purple-950/25 dark:to-slate-900/90 shadow-2xl">
        
        {/* Ambient Glow Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/20 dark:from-indigo-500/15 dark:to-purple-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 sm:p-7 border-b border-indigo-100/90 dark:border-slate-800 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center border border-indigo-200/60">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-2">
                <span>AI Timetable Scanner</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Upload your semester timetable photo or PDF to auto-populate the week.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI scanner dialog"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto relative z-10">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {extractedClasses.length === 0 ? (
            <>
              {/* File Dropzone */}
              <label
                htmlFor="timetable-file-input"
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                  file
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                    : 'border-indigo-200 dark:border-slate-700 hover:border-indigo-400 bg-white/70 dark:bg-slate-800/70'
                }`}
              >
                <input
                  id="timetable-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs border border-indigo-200/60 mb-3">
                  {file ? <FileText className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                </div>

                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      Click to choose or drag & drop timetable
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Supports Timetable Photos (PNG, JPG, WEBP) and PDF files
                    </p>
                  </div>
                )}
              </label>

              {/* API Key Toggle & Input */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Gemini AI Key Configuration
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Get Free Key ↗
                  </a>
                </div>

                {showKeyInput ? (
                  <div className="space-y-1.5">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your Gemini API key (starts with AIzaSy...)"
                      className="w-full bg-white/85 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-xs border border-indigo-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-mono shadow-xs"
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Stored safely in your browser. Free tier covers 1,500 scans/day with 0 cost.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Gemini API Key active
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(true)}
                      className="text-emerald-700 dark:text-emerald-300 underline font-bold"
                    >
                      Change Key
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Review Extracted Classes Grid */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Detected {extractedClasses.length} Classes
                  </h4>
                  <p className="text-xs text-slate-500">
                    Review and adjust detected timetable entries before adding to your schedule.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setExtractedClasses([]);
                    setFile(null);
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Scan Another File
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {extractedClasses.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.selected
                        ? 'bg-white/90 dark:bg-slate-800/90 border-indigo-200 dark:border-slate-700 shadow-xs'
                        : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleClass(idx)}
                        className="mt-1 w-4 h-4 rounded-md border-2 border-indigo-600 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600 shrink-0"
                      />

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={item.subjectName}
                            onChange={(e) =>
                              handleUpdateClassField(idx, 'subjectName', e.target.value)
                            }
                            className="text-sm font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none px-1 min-w-[12rem]"
                          />
                          <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">
                            {item.dayOfWeek}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-600" />
                            <input
                              type="time"
                              value={item.startTime}
                              onChange={(e) =>
                                handleUpdateClassField(idx, 'startTime', e.target.value)
                              }
                              className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5 text-xs font-bold"
                            />
                            <span>–</span>
                            <input
                              type="time"
                              value={item.endTime}
                              onChange={(e) =>
                                handleUpdateClassField(idx, 'endTime', e.target.value)
                              }
                              className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5 text-xs font-bold"
                            />
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <input
                              type="text"
                              value={item.location}
                              placeholder="Location"
                              onChange={(e) =>
                                handleUpdateClassField(idx, 'location', e.target.value)
                              }
                              className="bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none text-xs w-20"
                            />
                          </span>

                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <input
                              type="text"
                              value={item.instructor}
                              placeholder="Instructor"
                              onChange={(e) =>
                                handleUpdateClassField(idx, 'instructor', e.target.value)
                              }
                              className="bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none text-xs w-24"
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveClass(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extractedClasses.length > 0 && (
            <div className="px-6 py-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
                <span>Replace existing timetable classes with scanned schedule</span>
              </label>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between p-6 sm:p-7 border-t border-indigo-100/90 dark:border-slate-800 relative z-10 shrink-0 bg-white/40 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {extractedClasses.length === 0 ? (
            <button
              type="button"
              disabled={!file || isScanning}
              onClick={handleStartScan}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-xs shadow-md transition-all ${
                !file || isScanning
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-[#4338ca] hover:bg-[#3730a3] text-white active:scale-95 shadow-indigo-600/25'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning Timetable...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Scan & Extract Classes</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-xs shadow-md transition-all ${
                selectedCount === 0
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-600/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {selectedCount} Classes to Schedule</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
