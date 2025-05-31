import { create } from "zustand";
import { AutocompleteItem } from "../utils/types";
import { Descendant } from "slate";

export type DateFilter =
  | "this month"
  | "previous month"
  | "last 3 months"
  | "all months"
  | "Custom";

export interface TagData {
  displayId: string;
  apiItemId: string;
  name: string;
  apiValue: string | number;
  filter: DateFilter;
}

export interface TagElement {
  type: "tag";
  displayId: string;
  apiItemId: string;
  name: string;
  apiValue: string | number;
  filter: DateFilter;
  children: [{ text: "" }];
}

export interface ParagraphElement {
  type: "paragraph";
  children: Descendant[];
}

interface AppState {
  formulaInput: Descendant[];
  tags: TagData[];
  autocompleteQuery: string;
  autocompleteResults: AutocompleteItem[];
  isFormulaInputEditable: boolean;
  tagDropdownVisibleForId: string | null;
}

interface AppActions {
  setFormulaInput: (input: Descendant[]) => void;
  addTag: (tag: TagData) => void;
  removeTag: (displayId: string) => void;
  updateTagFilter: (displayId: string, filter: DateFilter) => void;
  setAutocompleteQuery: (query: string) => void;
  setAutocompleteResults: (results: AutocompleteItem[]) => void;
  setIsFormulaInputEditable: (editable: boolean) => void;
  setTagDropdownVisibleForId: (displayId: string | null) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set, get) => ({
  formulaInput: [{ type: "paragraph", children: [{ text: "" }] }],
  tags: [],
  autocompleteQuery: "",
  autocompleteResults: [],
  isFormulaInputEditable: false,
  tagDropdownVisibleForId: null,

  setFormulaInput: (input) => set({ formulaInput: input }),
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (displayId) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.displayId !== displayId),
    })),
  updateTagFilter: (displayId, filter) =>
    set((state) => ({
      tags: state.tags.map((t) =>
        t.displayId === displayId ? { ...t, filter } : t
      ),
    })),
  setAutocompleteQuery: (query) => set({ autocompleteQuery: query }),
  setAutocompleteResults: (results) => set({ autocompleteResults: results }),
  setIsFormulaInputEditable: (editable) =>
    set({ isFormulaInputEditable: editable }),
  setTagDropdownVisibleForId: (displayId) =>
    set({ tagDropdownVisibleForId: displayId }),
}));
