import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { TaskPriority, TaskItem, NoteItem } from '../../types';
import { 
  FileText, 
  CheckSquare, 
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading1,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table2,
  CheckSquare2,
  Undo2,
  Redo2,
  Plus, 
  Pin, 
  Trash2, 
  Tag, 
  Calendar as CalendarIcon, 
  Sparkles,
  Edit2,
  Maximize2,
  X,
  BookOpen,
  ListPlus,
  Search,
  Copy,
  Check,
  Star
} from 'lucide-react';

type TaskFilter = 'all' | 'high' | 'overdue' | 'completed';
type NoteFilter = 'all' | 'general' | 'important' | 'pinned';

const getCardAccent = (value: string) => {
  const palette = ['#4f46e5', '#10b981', '#8b5cf6', '#f59e0b', '#0ea5e9', '#ec4899'];
  return palette[Math.abs([...value].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % palette.length];
};

const isOverdue = (dueDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

/**
 * Formats plain text or markdown to clean HTML paragraphs/elements for the note editor.
 */
const formatNoteContentToHtml = (content: string): string => {
  if (!content) return '<p><br></p>';
  
  // If already contains HTML block tags, return as-is
  if (/<(p|h[1-6]|ul|ol|table|div|blockquote)[^>]*>/i.test(content)) {
    return content;
  }

  // Convert markdown / plain text to clean HTML
  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^- \[ \]\s+(.*)$/gim, '<ul class="note-checklist"><li><span class="checklist-box">☐</span> $1</li></ul>');
  html = html.replace(/^- \[x\]\s+(.*)$/gim, '<ul class="note-checklist"><li><span class="checklist-box">☑</span> <span class="line-through text-slate-400">$1</span></li></ul>');
  html = html.replace(/^[*-]\s+(.*)$/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');
  html = html.replace(/^\d+\.\s+(.*)$/gim, '<ol><li>$1</li></ol>');
  html = html.replace(/<\/ol>\s*<ol>/gim, '');

  const lines = html.split('\n');
  const processed = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<p><br></p>';
    if (/^<(h[1-6]|ul|ol|table|div|blockquote|li)/i.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  });
  return processed.join('');
};

/**
 * Strips HTML tags and markdown symbols to produce a clean plain-text snippet for card previews.
 */
const getNotePlainTextPreview = (content: string): string => {
  if (!content) return 'No content yet...';
  let decoded = content;
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(content, 'text/html');
      decoded = doc.body.textContent || '';
    } catch {
      // Fallback
    }
  }
  const textWithoutTags = decoded.replace(/<[^>]*>/g, ' ');
  const cleaned = textWithoutTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lambda;/g, 'λ')
    .replace(/[#*`$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'No content yet...';
};

export const NotesAndTasks: React.FC = () => {
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    togglePinNote, 
    tasks, 
    addTask, 
    updateTask, 
    toggleTask, 
    deleteTask, 
    toggleSubtask, 
    addSubtask 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'tasks'>('notes');
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  // Full Page Reader Modal state
  const [fullPageNote, setFullPageNote] = useState<NoteItem | null>(null);
  const [noteMode, setNoteMode] = useState<'edit' | 'preview'>('edit');
  const [copiedToast, setCopiedToast] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editSubjectInput, setEditSubjectInput] = useState('');

  // Ref for uncontrolled contentEditable editor to prevent React re-render cursor jumps
  const editorRef = useRef<HTMLDivElement>(null);

  // New Note Modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('Data Structures');
  const [noteCategory, setNoteCategory] = useState<'general' | 'important'>('general');
  const [noteTags, setNoteTags] = useState('notes, cs');
  const [noteContent, setNoteContent] = useState('');

  // Task Modal state (Add / Edit)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubject, setTaskSubject] = useState('Data Structures');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('17:00');

  // Synchronize editor content when fullPageNote opens or note changes or mode changes to edit
  useEffect(() => {
    if (fullPageNote && noteMode === 'edit' && editorRef.current) {
      const formattedHtml = formatNoteContentToHtml(fullPageNote.content);
      if (editorRef.current.innerHTML !== formattedHtml) {
        editorRef.current.innerHTML = formattedHtml;
      }
    }
  }, [fullPageNote?.id, fullPageNote?.content, noteMode]);

  // Notes filtering by category, search query, and active tag
  const filteredNotes = notes.filter(note => {
    if (noteFilter === 'pinned' && !note.isPinned) return false;
    if (noteFilter === 'important' && note.category !== 'important') return false;
    if (noteFilter === 'general' && note.category === 'important') return false;
    if (activeTagFilter && !note.tags.some(t => t.toLowerCase() === activeTagFilter.toLowerCase())) return false;
    
    if (noteSearchQuery.trim()) {
      const q = noteSearchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(q);
      const subjectMatch = note.subject.toLowerCase().includes(q);
      const tagMatch = note.tags.some(t => t.toLowerCase().includes(q));
      const contentMatch = getNotePlainTextPreview(note.content).toLowerCase().includes(q);
      if (!titleMatch && !subjectMatch && !tagMatch && !contentMatch) return false;
    }
    return true;
  });

  const filteredTasks = tasks
    .filter(task => {
      if (taskFilter === 'high') return task.priority === 'high' && !task.completed;
      if (taskFilter === 'overdue') return isOverdue(task.dueDate) && !task.completed;
      if (taskFilter === 'completed') return task.completed;
      return true;
    })
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const htmlContent = noteContent.trim() 
      ? formatNoteContentToHtml(noteContent.trim()) 
      : '<p>Start typing your lecture notes here...</p>';

    addNote({
      title: noteTitle.trim(),
      subject: noteSubject.trim() || 'General',
      category: noteCategory,
      tags: noteTags.split(',').map(t => t.trim()).filter(Boolean),
      content: htmlContent,
      isPinned: false,
    });

    setNoteTitle('');
    setNoteContent('');
    setNoteTags('notes, cs');
    setShowNoteModal(false);
  };

  const openNoteForEditing = (note: NoteItem) => {
    setFullPageNote(note);
    setNoteMode('edit');
    setIsAddingTag(false);
    setIsEditingSubject(false);
    setEditSubjectInput(note.subject);
  };

  const handleEditorInput = () => {
    if (!editorRef.current || !fullPageNote) return;
    const content = editorRef.current.innerHTML;
    updateNote(fullPageNote.id, { content });
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.classList.contains('checklist-box')) {
      if (target.textContent === '☐') {
        target.textContent = '☑';
        target.style.color = '#10b981';
        const li = target.closest('li');
        if (li) li.classList.add('line-through', 'text-slate-400');
      } else {
        target.textContent = '☐';
        target.style.color = '';
        const li = target.closest('li');
        if (li) li.classList.remove('line-through', 'text-slate-400');
      }
      if (editorRef.current && fullPageNote) {
        const content = editorRef.current.innerHTML;
        updateNote(fullPageNote.id, { content });
      }
    }
  };

  const switchNoteMode = (mode: 'edit' | 'preview') => {
    if (noteMode === 'edit' && editorRef.current && fullPageNote) {
      const currentHtml = editorRef.current.innerHTML;
      updateNote(fullPageNote.id, { content: currentHtml });
      setFullPageNote(prev => prev ? { ...prev, content: currentHtml } : null);
    }
    setNoteMode(mode);
  };

  const closeFullPageNote = () => {
    if (noteMode === 'edit' && editorRef.current && fullPageNote) {
      const currentHtml = editorRef.current.innerHTML;
      updateNote(fullPageNote.id, { content: currentHtml });
    }
    setFullPageNote(null);
  };

  const handleCopyNote = async () => {
    if (!fullPageNote) return;
    const plainText = `${fullPageNote.title}\nSubject: ${fullPageNote.subject}\nTags: ${fullPageNote.tags.join(', ')}\n\n${getNotePlainTextPreview(fullPageNote.content)}`;
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleDeleteNoteFromModal = () => {
    if (!fullPageNote) return;
    deleteNote(fullPageNote.id);
    setFullPageNote(null);
  };

  const handleAddTagToFullNote = () => {
    if (!newTagInput.trim() || !fullPageNote) return;
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!fullPageNote.tags.includes(clean)) {
      const updatedTags = [...fullPageNote.tags, clean];
      setFullPageNote({ ...fullPageNote, tags: updatedTags });
      updateNote(fullPageNote.id, { tags: updatedTags });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTagFromFullNote = (tagToRemove: string) => {
    if (!fullPageNote) return;
    const updatedTags = fullPageNote.tags.filter(t => t !== tagToRemove);
    setFullPageNote({ ...fullPageNote, tags: updatedTags });
    updateNote(fullPageNote.id, { tags: updatedTags });
  };

  const handleToggleNoteCategory = () => {
    if (!fullPageNote) return;
    const nextCat = fullPageNote.category === 'important' ? 'general' : 'important';
    setFullPageNote({ ...fullPageNote, category: nextCat });
    updateNote(fullPageNote.id, { category: nextCat });
  };

  const handleSaveSubject = () => {
    if (!fullPageNote || !editSubjectInput.trim()) {
      setIsEditingSubject(false);
      return;
    }
    const newSubj = editSubjectInput.trim();
    setFullPageNote({ ...fullPageNote, subject: newSubj });
    updateNote(fullPageNote.id, { subject: newSubj });
    setIsEditingSubject(false);
  };

  const runEditorCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (command === 'formatH2') {
      const selection = window.getSelection();
      let isH2 = false;
      if (selection && selection.anchorNode) {
        let parent: Node | null = selection.anchorNode;
        while (parent && parent !== editorRef.current) {
          if (parent.nodeName === 'H2') {
            isH2 = true;
            break;
          }
          parent = parent.parentNode;
        }
      }
      document.execCommand('formatBlock', false, isH2 ? '<p>' : '<h2>');
    } else if (command === 'formatH1') {
      document.execCommand('formatBlock', false, '<h1>');
    } else if (command === 'formatQuote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else if (command === 'insertCode') {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        document.execCommand('insertHTML', false, `<code>${selection.toString()}</code>`);
      } else {
        document.execCommand('insertHTML', false, '<code>code snippet</code>&nbsp;');
      }
    } else if (command === 'insertTable') {
      document.execCommand('insertHTML', false, '<table><thead><tr><th>Topic</th><th>Notes / Summary</th></tr></thead><tbody><tr><td>Concept A</td><td>Details and explanation</td></tr><tr><td>Concept B</td><td>Details and explanation</td></tr></tbody></table><p><br></p>');
    } else if (command === 'insertChecklist') {
      document.execCommand('insertHTML', false, '<ul class="note-checklist"><li><span class="checklist-box">☐</span> Action item</li></ul><p><br></p>');
    } else {
      document.execCommand(command, false, value);
    }

    if (fullPageNote && editorRef.current) {
      const content = editorRef.current.innerHTML;
      updateNote(fullPageNote.id, { content });
    }
  };

  const openAddTaskModal = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskSubject('Data Structures');
    setTaskPriority('high');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setShowTaskModal(true);
  };

  const formatTaskDueDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    const isValid = !Number.isNaN(date.getTime());
    const dateFormatted = isValid ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : dateStr;
    
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        const period = h >= 12 ? 'PM' : 'AM';
        const hours12 = h % 12 || 12;
        const minsFormatted = m.toString().padStart(2, '0');
        return `${dateFormatted} at ${hours12}:${minsFormatted} ${period}`;
      }
      return `${dateFormatted} at ${timeStr}`;
    }

    if (isValid && (date.getHours() !== 0 || date.getMinutes() !== 0)) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }

    return dateFormatted;
  };

  const openEditTaskModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskSubject(task.subject || 'Data Structures');
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate.split('T')[0]);
    setTaskDueTime(task.dueTime || '17:00');
    setShowTaskModal(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: taskTitle.trim(),
        description: taskDesc,
        subject: taskSubject,
        priority: taskPriority,
        dueDate: taskDueDate || new Date().toISOString().split('T')[0],
        dueTime: taskDueTime || undefined,
      });
    } else {
      addTask({
        title: taskTitle.trim(),
        description: taskDesc,
        subject: taskSubject,
        priority: taskPriority,
        dueDate: taskDueDate || new Date().toISOString().split('T')[0],
        dueTime: taskDueTime || undefined,
        completed: false,
      });
    }

    setShowTaskModal(false);
  };

  const handleToggleTaskCheck = (id: string) => {
    toggleTask(id);
  };

  const handleAddSubtask = (taskId: string) => {
    if (!subtaskTitle.trim()) return;
    addSubtask(taskId, subtaskTitle);
    setSubtaskTitle('');
    setAddingSubtaskFor(null);
  };

  const editorTools: Array<{ command: string; icon: React.ReactNode; label: string }> = [
    { command: 'bold', icon: <Bold className="h-5 w-5 stroke-[2.5]" />, label: 'Bold (Ctrl+B)' },
    { command: 'italic', icon: <Italic className="h-5 w-5 stroke-[2.5]" />, label: 'Italic (Ctrl+I)' },
    { command: 'underline', icon: <Underline className="h-5 w-5 stroke-[2.5]" />, label: 'Underline (Ctrl+U)' },
    { command: 'strikeThrough', icon: <Strikethrough className="h-5 w-5 stroke-[2.2]" />, label: 'Strikethrough' },
    { command: 'formatH1', icon: <Heading1 className="h-5 w-5 stroke-[2.5]" />, label: 'Title Heading (H1)' },
    { command: 'formatH2', icon: <Heading2 className="h-5 w-5 stroke-[2.5]" />, label: 'Section Heading (H2)' },
    { command: 'formatQuote', icon: <Quote className="h-5 w-5 stroke-[2.2]" />, label: 'Quote block' },
    { command: 'insertCode', icon: <Code className="h-5 w-5 stroke-[2.5]" />, label: 'Inline Code' },
    { command: 'justifyLeft', icon: <AlignLeft className="h-5 w-5 stroke-[2.2]" />, label: 'Align left' },
    { command: 'justifyCenter', icon: <AlignCenter className="h-5 w-5 stroke-[2.2]" />, label: 'Align center' },
    { command: 'justifyRight', icon: <AlignRight className="h-5 w-5 stroke-[2.2]" />, label: 'Align right' },
    { command: 'insertUnorderedList', icon: <List className="h-5 w-5 stroke-[2.5]" />, label: 'Bulleted list' },
    { command: 'insertOrderedList', icon: <ListOrdered className="h-5 w-5 stroke-[2.5]" />, label: 'Numbered list' },
    { command: 'undo', icon: <Undo2 className="h-5 w-5 stroke-[2.2]" />, label: 'Undo (Ctrl+Z)' },
    { command: 'redo', icon: <Redo2 className="h-5 w-5 stroke-[2.2]" />, label: 'Redo (Ctrl+Y)' },
  ];

  return (
    <div className="tasks-page p-3 sm:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* =========================================================================
          SLIDING SEGMENTED NAVIGATION TOGGLE (Liquid Orange Sliding Pill)
          ========================================================================= */}
      <div className="flex flex-col items-center justify-center space-y-4">
        
        {/* Floating Sliding Pill Control */}
        <div className="relative flex items-center p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md max-w-xs w-full">
          <div 
            className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-full liquid-orange-pill text-white transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              activeSubTab === 'notes' ? 'translate-x-0' : 'translate-x-full'
            }`}
          />

          <button
            onClick={() => setActiveSubTab('notes')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-black transition-colors ${
              activeSubTab === 'notes' ? 'text-white drop-shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-black transition-colors ${
              activeSubTab === 'tasks' ? 'text-white drop-shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>To-Do ({tasks.length})</span>
          </button>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col sm:flex-row w-full max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {(activeSubTab === 'tasks'
              ? (['all', 'high', 'overdue', 'completed'] as TaskFilter[]).map(filter => (
              <button key={filter} onClick={() => setTaskFilter(filter)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${taskFilter === filter ? 'bg-[#4338ca] text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                {filter === 'high' ? 'High Priority' : filter[0].toUpperCase() + filter.slice(1)}
              </button>
            ))
              : (['all', 'general', 'important', 'pinned'] as NoteFilter[]).map(filter => (
                <button key={filter} onClick={() => setNoteFilter(filter)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${noteFilter === filter ? 'bg-[#4338ca] text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                  {filter === 'pinned' ? '📌 Pinned' : filter === 'important' ? '⭐ Important' : filter[0].toUpperCase() + filter.slice(1)}
                </button>
              )))}
          </div>

          {/* Search bar for Notes */}
          {activeSubTab === 'notes' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                placeholder="Search notes, tags, subjects..."
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl pl-9 pr-8 py-1.5 text-xs border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none shadow-xs"
              />
              {noteSearchQuery && (
                <button
                  onClick={() => setNoteSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Tag Filter Indicator */}
        {activeSubTab === 'notes' && activeTagFilter && (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-full border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-300">
            <Tag className="w-3.5 h-3.5" />
            <span>Filtering by tag: <strong>#{activeTagFilter}</strong></span>
            <button
              onClick={() => setActiveTagFilter(null)}
              className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          MAIN CONTENT: Notes Grid vs Tasks To-Do List
          ========================================================================= */}
      {activeSubTab === 'notes' ? (
        /* NOTES GRID VIEW WITH FULL PAGE READER OVERLAY */
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center text-slate-400 space-y-3 border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto opacity-60" />
              <p className="font-bold text-base text-slate-800 dark:text-slate-200">
                {noteSearchQuery || activeTagFilter ? 'No matching notes found!' : 'No study notes found!'}
              </p>
              <p className="text-xs">
                {noteSearchQuery || activeTagFilter 
                  ? 'Try clearing the search query or tag filter.' 
                  : 'Click the "+" button to write your lecture summary.'}
              </p>
              {(noteSearchQuery || activeTagFilter) && (
                <button
                  onClick={() => { setNoteSearchQuery(''); setActiveTagFilter(null); setNoteFilter('all'); }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openNoteForEditing(n)}
                  style={{ borderLeftColor: getCardAccent(n.subject), borderLeftWidth: '5px' }}
                  className="relative overflow-hidden rounded-3xl p-6 border border-indigo-200/90 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white/95 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/90 hover:border-indigo-400 bouncy-hover cursor-pointer flex flex-col justify-between space-y-4 group shadow-md hover:shadow-xl transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-900/60">
                          {n.subject}
                        </span>
                        {n.category === 'important' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Important
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinNote(n.id); }}
                          className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${n.isPinned ? 'text-amber-500' : 'text-slate-400'}`}
                          title={n.isPinned ? 'Unpin Note' : 'Pin Note'}
                        >
                          <Pin className="w-4 h-4 fill-current" />
                        </button>

                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            deleteNote(n.id); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {n.title}
                    </h3>

                    {/* Clean plain-text preview without raw HTML tags */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed opacity-90 font-normal">
                      {getNotePlainTextPreview(n.content)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-indigo-100/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      {n.tags.slice(0, 3).map(t => (
                        <button
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTagFilter(activeTagFilter === t ? null : t);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 transition-colors ${
                            activeTagFilter === t 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-white/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-indigo-200/50 dark:border-slate-700'
                          }`}
                          title={`Filter by #${t}`}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          #{t}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); openNoteForEditing(n); }}
                      className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline group-hover:translate-x-1 transition-transform ml-auto shrink-0"
                    >
                      <span>Open Note</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TASKS TO-DO LIST VIEW (Vibrant Sky/Indigo Aurora Glass) */
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-sky-200/90 dark:border-sky-800/60 bg-gradient-to-br from-sky-50/95 via-indigo-50/50 to-white/95 dark:from-sky-950/40 dark:via-indigo-950/25 dark:to-slate-900/90 shadow-xl shadow-sky-500/5 space-y-6">
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-headline flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 flex items-center justify-center border border-sky-200/60">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span>Assignments & Action Items</span>
            </h3>
            <span className="text-xs font-black text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-950/80 px-3 py-1 rounded-full border border-sky-200/80 dark:border-sky-900/60 shadow-xs">
              {tasks.filter(t => t.completed).length} / {tasks.length} Completed
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2 relative z-10">
              <Sparkles className="w-10 h-10 text-indigo-600 mx-auto opacity-50" />
              <p className="font-bold text-base text-slate-800 dark:text-slate-200">No tasks found!</p>
            </div>
          ) : (
            <div className="space-y-2.5 relative z-10">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  style={{ borderRightColor: getCardAccent(t.subject || t.priority), borderRightWidth: '5px' }}
                  className="task-card group p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-800 transition-all border border-sky-200/60 dark:border-slate-700 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => handleToggleTaskCheck(t.id)}
                      className="mt-1 w-5 h-5 rounded-md border-2 border-indigo-600 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className={`font-bold text-slate-900 dark:text-white text-base ${t.completed ? 'line-through opacity-50' : ''}`}>
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-xs font-black rounded-lg uppercase tracking-wider ${
                            t.priority === 'high' 
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60' 
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60'
                          }`}>
                            {t.priority}
                          </span>

                          <button
                            onClick={() => openEditTaskModal(t)}
                            aria-label={`Edit ${t.title}`}
                            className="glass-icon-button h-8 w-8 p-1.5 text-slate-400 hover:text-indigo-600"
                            title="Edit Task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteTask(t.id)}
                            aria-label={`Delete ${t.title}`}
                            className="glass-icon-button h-8 w-8 p-1.5 text-slate-400 hover:text-rose-500"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {t.subject && (
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                            {t.subject}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-medium">
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                          Due: {formatTaskDueDate(t.dueDate, t.dueTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subtasks if present */}
                  {t.subtasks && t.subtasks.length > 0 && (
                    <div className="task-subtasks ml-9 pt-2 border-t border-indigo-100 dark:border-slate-700 space-y-1">
                      {t.subtasks.map(sub => (
                        <label key={sub.id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => toggleSubtask(t.id, sub.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600"
                          />
                          <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                            {sub.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {addingSubtaskFor === t.id ? (
                    <div className="ml-9 flex items-center gap-2">
                      <input
                        autoFocus
                        value={subtaskTitle}
                        onChange={(event) => setSubtaskTitle(event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter') handleAddSubtask(t.id); }}
                        placeholder="Subtask name"
                        className="glass-input py-2 text-xs"
                      />
                      <button type="button" onClick={() => handleAddSubtask(t.id)} className="glass-primary-button shrink-0 rounded-full px-3 py-2 text-xs">Add</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setAddingSubtaskFor(t.id); setSubtaskTitle(''); }} className="task-add-subtask ml-9 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black">
                      <ListPlus className="h-3.5 w-3.5" /> Add subtask
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button
        type="button"
        onClick={activeSubTab === 'notes' ? () => setShowNoteModal(true) : openAddTaskModal}
        aria-label={activeSubTab === 'notes' ? 'Create note' : 'Add task'}
        className="tasks-fab glass-fab"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* FULL PAGE NOTE READER & EDITOR OVERLAY MODAL */}
      {fullPageNote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-[94vh] max-w-6xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 sm:px-7 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Subject Pill / Subject Editor */}
                {isEditingSubject ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={editSubjectInput}
                      onChange={(e) => setEditSubjectInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSubject(); if (e.key === 'Escape') setIsEditingSubject(false); }}
                      placeholder="Subject name"
                      className="text-xs font-black px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-400 text-indigo-700 dark:text-indigo-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSubject}
                      className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditSubjectInput(fullPageNote.subject); setIsEditingSubject(true); }}
                    className="text-xs font-black px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-400 transition-colors flex items-center gap-1"
                    title="Click to edit subject"
                  >
                    <span>{fullPageNote.subject}</span>
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                  </button>
                )}

                {/* Category Toggle Badge */}
                <button
                  type="button"
                  onClick={handleToggleNoteCategory}
                  className={`text-xs font-black px-2.5 py-1 rounded-xl border transition-colors flex items-center gap-1 ${
                    fullPageNote.category === 'important'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Toggle Important"
                >
                  <Star className={`w-3 h-3 ${fullPageNote.category === 'important' ? 'fill-current text-amber-500' : ''}`} />
                  <span>{fullPageNote.category === 'important' ? 'Important' : 'General'}</span>
                </button>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mode Switcher */}
                <div className="flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 shadow-xs">
                  <button 
                    type="button" 
                    onClick={() => switchNoteMode('edit')} 
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${noteMode === 'edit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Edit
                  </button>
                  <button 
                    type="button" 
                    onClick={() => switchNoteMode('preview')} 
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${noteMode === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Preview
                  </button>
                </div>

                {/* Copy Note Button */}
                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="glass-icon-button p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                  title="Copy Note Text"
                >
                  {copiedToast ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Pin Button */}
                <button
                  type="button"
                  onClick={() => {
                    togglePinNote(fullPageNote.id);
                    setFullPageNote(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null);
                  }}
                  className={`glass-icon-button p-2 ${fullPageNote.isPinned ? 'text-amber-500' : 'text-slate-400'}`}
                  title={fullPageNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                >
                  <Pin className="w-4 h-4 fill-current" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={handleDeleteNoteFromModal}
                  className="glass-icon-button p-2 text-slate-400 hover:text-rose-500"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeFullPageNote}
                  aria-label="Close note editor"
                  className="glass-icon-button p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Note Editor Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-12 sm:py-8 space-y-4">
              
              {/* Note Title Input */}
              {noteMode === 'edit' ? (
                <input
                  type="text"
                  value={fullPageNote.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFullPageNote(prev => prev ? { ...prev, title } : null);
                    updateNote(fullPageNote.id, { title });
                  }}
                  className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white font-headline bg-transparent border-none focus:outline-none w-full"
                  placeholder="Note Title..."
                />
              ) : (
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-4xl">
                  {fullPageNote.title || 'Untitled note'}
                </h1>
              )}

              {/* Tags and Timestamps Subheader */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                {fullPageNote.tags.map(t => (
                  <span key={t} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    <Tag className="w-3 h-3" />
                    #{t}
                    {noteMode === 'edit' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTagFromFullNote(t)}
                        className="hover:text-rose-500 ml-0.5"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                {/* Add Tag Inline Form */}
                {noteMode === 'edit' && (
                  isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') handleAddTagToFullNote();
                          if (e.key === 'Escape') setIsAddingTag(false);
                        }}
                        placeholder="Tag name"
                        className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-indigo-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddTagToFullNote}
                        className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded-md font-bold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(true)}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add tag
                    </button>
                  )
                )}

                <span className="text-xs text-slate-400 sm:ml-auto">
                  Updated {new Date(fullPageNote.updatedAt).toLocaleString()}
                </span>
              </div>

              {/* Sticky Rich Text Toolbar with Comfortable, Highly Visible Buttons */}
              {noteMode === 'edit' && (
                <div className="sticky top-0 z-10 -mx-5 flex flex-wrap items-center gap-1.5 sm:gap-2 border-y border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:-mx-12 sm:px-8 shadow-xs">
                  {editorTools.map(({ command, icon, label }) => (
                    <button 
                      key={command} 
                      type="button" 
                      onMouseDown={event => event.preventDefault()} 
                      onClick={() => runEditorCommand(command)} 
                      aria-label={label} 
                      title={label} 
                      className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-600 shadow-xs transition-all active:scale-95"
                    >
                      {icon}
                    </button>
                  ))}
                  <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                  <button 
                    type="button" 
                    onMouseDown={event => event.preventDefault()} 
                    onClick={() => runEditorCommand('insertTable')} 
                    aria-label="Insert Table" 
                    title="Insert Table" 
                    className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-600 shadow-xs transition-all active:scale-95"
                  >
                    <Table2 className="h-5 w-5 stroke-[2.2]" />
                  </button>
                  <button 
                    type="button" 
                    onMouseDown={event => event.preventDefault()} 
                    onClick={() => runEditorCommand('insertChecklist')} 
                    aria-label="Insert Checklist" 
                    title="Insert Checklist" 
                    className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-600 shadow-xs transition-all active:scale-95"
                  >
                    <CheckSquare2 className="h-5 w-5 stroke-[2.2]" />
                  </button>
                </div>
              )}

              {/* Editor / Preview Content Area */}
              {noteMode === 'edit' ? (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onClick={handleEditorClick}
                  className="note-editor-content min-h-[50vh] w-full bg-transparent pt-3 text-base leading-relaxed text-slate-800 outline-none dark:text-slate-200 cursor-text font-normal"
                  data-placeholder="Start typing your study notes here..."
                />
              ) : (
                <div 
                  className="note-editor-content min-h-[50vh] pt-3 text-base leading-relaxed text-slate-800 dark:text-slate-200" 
                  dangerouslySetInnerHTML={{ __html: formatNoteContentToHtml(fullPageNote.content) }} 
                  onClick={handleEditorClick}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Created on {new Date(fullPageNote.createdAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={closeFullPageNote}
                className="px-6 py-2.5 rounded-2xl bg-[#4338ca] text-white font-black text-sm shadow-md hover:bg-[#3730a3] transition-colors"
              >
                Close & Save Note
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Create Note */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-headline">Create New Study Note</h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Graph Algorithms Overview"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                  <input
                    type="text"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    placeholder="e.g. Data Structures"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="e.g. notes, cs, midterm"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <select 
                  value={noteCategory} 
                  onChange={e => setNoteCategory(e.target.value as 'general' | 'important')} 
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold"
                >
                  <option value="general">General</option>
                  <option value="important">⭐ Important</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Initial Summary / Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Write note points or summary here..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none resize-none font-sans"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#4338ca] text-white text-sm font-black shadow-md hover:bg-[#3730a3]"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-headline">
              {editingTaskId ? 'Edit Assignment' : 'Add New Assignment'}
            </h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Prepare for Linear Algebra Midterm"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                <input
                  type="text"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Optional details or subtask instructions"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                  <input
                    type="text"
                    value={taskSubject}
                    onChange={(e) => setTaskSubject(e.target.value)}
                    placeholder="Optional (e.g. Mathematics)"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-4 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl py-2.5 px-3 text-sm border border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:outline-none font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#4338ca] text-white text-sm font-black shadow-md hover:bg-[#3730a3]"
                >
                  {editingTaskId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
