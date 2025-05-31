import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useAppStore, TagData, DateFilter } from "../store";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteItem } from "../utils/types";
import Tag from "./Tag";
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  Range,
  Path,
} from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { TagElement, ParagraphElement } from "../store";

interface FormulaInputProps {
  apiData: AutocompleteItem[] | undefined;
}

const API_URL = "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete";

const withTags = (editor: Editor) => {
  const { isVoid, isInline } = editor;

  editor.isVoid = (element: SlateElement) => {
    return element.type === "tag" ? true : isVoid(element);
  };

  editor.isInline = (element: SlateElement) => {
    return element.type === "tag" ? true : isInline(element);
  };

  return editor;
};

const Element = ({
  attributes,
  children,
  element,
  onFilterChangeInEditor,
}: any) => {
  console.log(
    `Element render for type: ${element.type}, onFilterChangeInEditor:`,
    onFilterChangeInEditor
  );

  switch (element.type) {
    case "tag":
      return (
        <Tag
          tag={element as TagElement}
          dataTagDisplayId={element.displayId}
          onFilterChangeInEditor={onFilterChangeInEditor}
          {...attributes}
        >
          {children}
        </Tag>
      );
    case "paragraph":
      return <p {...attributes}>{children}</p>;
    default:
      return <span {...attributes}>{children}</span>;
  }
};

const Leaf = ({ attributes, children }: any) => {
  return <span {...attributes}>{children}</span>;
};

const FormulaInput: React.FC<FormulaInputProps> = ({ apiData }) => {
  const {
    formulaInput,
    autocompleteQuery,
    autocompleteResults,
    isFormulaInputEditable,
    setFormulaInput,
    addTag,
    removeTag,
    setAutocompleteQuery,
    setAutocompleteResults,
    setIsFormulaInputEditable,
    setTagDropdownVisibleForId,
  } = useAppStore();

  const editor = useMemo(() => withTags(withReact(createEditor())), []);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const { data: fetchedApiData } = useQuery<AutocompleteItem[]>({
    queryKey: ["autocompleteData"],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    enabled: !apiData,
  });

  const effectiveApiData = apiData || fetchedApiData;

  const handleEditorChange = useCallback(
    (value: Descendant[]) => {
      setFormulaInput(value);
      const { selection } = editor;

      let query = "";
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const wordBefore = Editor.before(editor, start, { unit: "word" });
        const beforeRange =
          wordBefore && Editor.range(editor, wordBefore, start);
        const beforeText = beforeRange && Editor.string(editor, beforeRange);

        if (beforeText) {
          const lastQueryMatch = beforeText.match(/([a-zA-Z0-9\s]+)$/);
          if (lastQueryMatch) {
            query = lastQueryMatch[1].trim();
          }
        }
      }

      if (query.length > 0) {
        setAutocompleteQuery(query);
        if (effectiveApiData) {
          const filtered = effectiveApiData.filter((item) =>
            item.name.toLowerCase().includes(query.toLowerCase())
          );
          setAutocompleteResults(filtered);
        }
      } else {
        setAutocompleteQuery("");
        setAutocompleteResults([]);
      }
      setTagDropdownVisibleForId(null);
    },
    [
      editor,
      setFormulaInput,
      setAutocompleteQuery,
      setAutocompleteResults,
      effectiveApiData,
      setTagDropdownVisibleForId,
    ]
  );

  const handleAutocompleteSelect = useCallback(
    (item: AutocompleteItem) => {
      const { selection } = editor;
      if (!selection || !Range.isCollapsed(selection)) return;
      const [end] = Range.edges(selection);
      const queryLength = autocompleteQuery.length;
      const queryStart = Editor.before(editor, end, {
        unit: "character",
        distance: queryLength,
      });

      if (queryStart) {
        const rangeToDelete = Editor.range(editor, queryStart, end);
        Transforms.delete(editor, { at: rangeToDelete });
      }

      const displayId = `tag-${item.id}-${Date.now()}`;
      const newTagData: TagData = {
        displayId,
        apiItemId: item.id,
        name: item.name,
        apiValue: item.value,
        filter: "all months",
      };
      addTag(newTagData);

      const tagElement: TagElement = {
        type: "tag",
        displayId: newTagData.displayId,
        apiItemId: newTagData.apiItemId,
        name: newTagData.name,
        apiValue: newTagData.apiValue,
        filter: newTagData.filter,
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, tagElement);
      Transforms.insertText(editor, " ");

      setAutocompleteQuery("");
      setAutocompleteResults([]);
    },
    [
      editor,
      autocompleteQuery,
      addTag,
      setAutocompleteQuery,
      setAutocompleteResults,
    ]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const { selection } = editor;

      if (event.key === "Escape") {
        setAutocompleteQuery("");
        setAutocompleteResults([]);
        event.preventDefault();
        return;
      }

      if (
        event.key === "Backspace" &&
        selection &&
        Range.isCollapsed(selection)
      ) {
        const [start] = Range.edges(selection);
        const nodeBefore = Editor.before(editor, start);

        if (nodeBefore) {
          const [parentNode, parentPath] = Editor.parent(editor, nodeBefore);
          if (SlateElement.isElement(parentNode) && parentNode.type === "tag") {
            event.preventDefault();
            removeTag(parentNode.displayId);
            Transforms.removeNodes(editor, { at: parentPath });
            return;
          }
        }
      }
    },
    [editor, removeTag, setAutocompleteQuery, setAutocompleteResults]
  );

  const handleDoubleClick = useCallback(() => {
    setIsFormulaInputEditable(true);
    ReactEditor.focus(editor);

    if (Editor.isEmpty(editor) || Editor.string(editor, []).trim() === "") {
      Transforms.insertNodes(editor, {
        type: "paragraph",
        children: [{ text: "" }],
      } as ParagraphElement); // Explicitly cast
      Transforms.select(editor, Editor.start(editor, [0]));
    } else {
      Transforms.select(editor, Editor.start(editor, []));
    }
  }, [setIsFormulaInputEditable, editor]);

  const onTagFilterChangeInEditor = useCallback(
    (displayId: string, newFilter: DateFilter) => {
      console.log(
        `onTagFilterChangeInEditor called for ${displayId} with filter: ${newFilter}`
      );

      let tagPath: Path | undefined;
      for (const [node, path] of Editor.nodes(editor, {
        at: [],
        match: (n) =>
          SlateElement.isElement(n) &&
          (n as TagElement).type === "tag" &&
          (n as TagElement).displayId === displayId,
      })) {
        tagPath = path;
        break;
      }

      if (tagPath) {
        Transforms.setNodes(
          editor,
          { filter: newFilter } as Partial<TagElement>,
          { at: tagPath }
        );
      } else {
        console.warn(
          `Tag with displayId ${displayId} not found in Slate editor to update filter.`
        );
      }
    },
    [editor]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setAutocompleteResults([]);
        setAutocompleteQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setAutocompleteResults, setAutocompleteQuery]);

  return (
    <div className="relative w-full flex items-center">
      {isFormulaInputEditable && (
        <span className="select-none text-gray-500 font-semibold mr-1">=</span>
      )}
      <div
        className={`flex-1 p-3 border rounded-lg shadow-sm text-gray-800 text-lg min-h-[48px] flex flex-wrap items-center ${
          isFormulaInputEditable
            ? "border-blue-500 ring-2 ring-blue-200 bg-white"
            : "border-gray-300 bg-gray-50 cursor-pointer"
        }`}
        onDoubleClick={handleDoubleClick}
      >
        <Slate
          editor={editor}
          initialValue={formulaInput}
          value={formulaInput}
          onChange={handleEditorChange}
        >
          <Editable
            readOnly={!isFormulaInputEditable}
            renderElement={(props) =>
              props.element.type === "tag" ? (
                <Element
                  {...props}
                  onFilterChangeInEditor={onTagFilterChangeInEditor}
                />
              ) : (
                <Element {...props} />
              )
            }
            renderLeaf={Leaf}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none"
          />
        </Slate>
      </div>

      {autocompleteQuery && autocompleteResults.length > 0 && (
        <div
          ref={autocompleteRef}
          className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ top: "100%", left: 0 }}
        >
          {autocompleteResults.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="p-3 cursor-pointer hover:bg-blue-100 text-gray-800 flex justify-between items-center"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAutocompleteSelect(item);
              }}
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-sm text-gray-500">{item.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormulaInput;
