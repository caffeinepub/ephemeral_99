import { create } from "zustand";
import {
  type EditorTool,
  type TextItem,
  type DrawingStroke,
  type CropRegion,
  type CropAspectRatio,
  EDITOR_COLORS,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_CROP_REGION,
} from "../utils/constants";

export type AppView =
  | "inbox"
  | "camera"
  | "editor"
  | "send"
  | "friends"
  | "conversation";

export interface ConversationFriend {
  principal: string;
  name: string;
  username: string;
}

interface AppState {
  currentView: AppView;
  setView: (view: AppView) => void;
  capturedMediaBlob: Blob | null;
  setCapturedMediaBlob: (blob: Blob | null) => void;
  capturedMediaType: "image" | "video";
  setCapturedMedia: (blob: Blob, type: "image" | "video") => void;
  editedMediaBlob: Blob | null;
  setEditedMediaBlob: (blob: Blob | null) => void;
  selectedFilter: string | null;
  setSelectedFilter: (filter: string | null) => void;
  expirationSeconds: number;
  setExpirationSeconds: (seconds: number) => void;
  viewingSnapId: number | null;
  setViewingSnapId: (id: number | null) => void;
  viewingStoryUserId: string | null;
  setViewingStoryUserId: (id: string | null) => void;
  viewingStoryIndex: number;
  setViewingStoryIndex: (index: number) => void;
  conversationFriend: ConversationFriend | null;
  setConversationFriend: (friend: ConversationFriend | null) => void;

  // Editor overlay state
  activeEditorTool: EditorTool;
  setActiveEditorTool: (tool: EditorTool) => void;
  textItems: TextItem[];
  addTextItem: (item: TextItem) => void;
  updateTextItem: (id: string, updates: Partial<TextItem>) => void;
  removeTextItem: (id: string) => void;
  drawingStrokes: DrawingStroke[];
  addDrawingStroke: (stroke: DrawingStroke) => void;
  undoDrawingStroke: () => void;
  clearDrawingStrokes: () => void;
  drawColor: string;
  setDrawColor: (color: string) => void;
  drawBrushSize: number;
  setDrawBrushSize: (size: number) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  // Crop state
  cropRegion: CropRegion;
  setCropRegion: (region: CropRegion) => void;
  cropAspectRatio: CropAspectRatio;
  setCropAspectRatio: (ratio: CropAspectRatio) => void;
  appliedCrop: CropRegion | null;
  setAppliedCrop: (crop: CropRegion | null) => void;
  resetCrop: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "inbox",
  setView: (view) =>
    set(
      view === "inbox"
        ? { currentView: view, conversationFriend: null }
        : { currentView: view },
    ),
  capturedMediaBlob: null,
  capturedMediaType: "image",
  setCapturedMediaBlob: (blob) =>
    set({
      capturedMediaBlob: blob,
      capturedMediaType: "image",
      editedMediaBlob: null,
      selectedFilter: null,
      activeEditorTool: "filter",
      textItems: [],
      drawingStrokes: [],
      editingTextId: null,
      cropRegion: { ...DEFAULT_CROP_REGION },
      cropAspectRatio: "free",
      appliedCrop: null,
    }),
  setCapturedMedia: (blob, type) =>
    set({
      capturedMediaBlob: blob,
      capturedMediaType: type,
      editedMediaBlob: null,
      selectedFilter: null,
      activeEditorTool: "filter",
      textItems: [],
      drawingStrokes: [],
      editingTextId: null,
      cropRegion: { ...DEFAULT_CROP_REGION },
      cropAspectRatio: "free",
      appliedCrop: null,
    }),
  editedMediaBlob: null,
  setEditedMediaBlob: (blob) => set({ editedMediaBlob: blob }),
  selectedFilter: null,
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  expirationSeconds: 5,
  setExpirationSeconds: (seconds) => set({ expirationSeconds: seconds }),
  viewingSnapId: null,
  setViewingSnapId: (id) => set({ viewingSnapId: id }),
  viewingStoryUserId: null,
  setViewingStoryUserId: (id) => set({ viewingStoryUserId: id }),
  viewingStoryIndex: 0,
  setViewingStoryIndex: (index) => set({ viewingStoryIndex: index }),
  conversationFriend: null,
  setConversationFriend: (friend) => set({ conversationFriend: friend }),

  // Editor overlay state
  activeEditorTool: "filter",
  setActiveEditorTool: (tool) =>
    set((s) => {
      // When switching away from text, clean up empty text items
      if (tool !== "text" && s.editingTextId) {
        return {
          activeEditorTool: tool,
          editingTextId: null,
          textItems: s.textItems.filter((t) => t.content.trim() !== ""),
        };
      }
      return { activeEditorTool: tool };
    }),
  textItems: [],
  addTextItem: (item) => set((s) => ({ textItems: [...s.textItems, item] })),
  updateTextItem: (id, updates) =>
    set((s) => ({
      textItems: s.textItems.map((t) =>
        t.id === id ? { ...t, ...updates } : t,
      ),
    })),
  removeTextItem: (id) =>
    set((s) => ({
      textItems: s.textItems.filter((t) => t.id !== id),
      editingTextId: s.editingTextId === id ? null : s.editingTextId,
    })),
  drawingStrokes: [],
  addDrawingStroke: (stroke) =>
    set((s) => ({ drawingStrokes: [...s.drawingStrokes, stroke] })),
  undoDrawingStroke: () =>
    set((s) => ({ drawingStrokes: s.drawingStrokes.slice(0, -1) })),
  clearDrawingStrokes: () => set({ drawingStrokes: [] }),
  drawColor: EDITOR_COLORS[0],
  setDrawColor: (color) => set({ drawColor: color }),
  drawBrushSize: DEFAULT_BRUSH_SIZE,
  setDrawBrushSize: (size) => set({ drawBrushSize: size }),
  textColor: EDITOR_COLORS[0],
  setTextColor: (color) => set({ textColor: color }),
  textFontSize: DEFAULT_TEXT_FONT_SIZE,
  setTextFontSize: (size) => set({ textFontSize: size }),
  editingTextId: null,
  setEditingTextId: (id) => set({ editingTextId: id }),

  // Crop state
  cropRegion: { ...DEFAULT_CROP_REGION },
  setCropRegion: (region) => set({ cropRegion: region }),
  cropAspectRatio: "free",
  setCropAspectRatio: (ratio) => set({ cropAspectRatio: ratio }),
  appliedCrop: null,
  setAppliedCrop: (crop) => set({ appliedCrop: crop }),
  resetCrop: () =>
    set({
      cropRegion: { ...DEFAULT_CROP_REGION },
      cropAspectRatio: "free",
      appliedCrop: null,
    }),
}));
