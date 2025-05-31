import React, { useRef, useEffect } from "react";
import { useAppStore, TagData, DateFilter } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";

interface TagProps {
  tag: TagData;
  dataTagDisplayId: string;
  children: React.ReactNode;
  onFilterChangeInEditor: (displayId: string, newFilter: DateFilter) => void;
}

const dateFilterOptions: DateFilter[] = [
  "this month",
  "previous month",
  "last 3 months",
  "all months",
];

const Tag: React.FC<TagProps> = ({
  tag,
  dataTagDisplayId,
  children,
  onFilterChangeInEditor,
}) => {
  const {
    updateTagFilter,
    setTagDropdownVisibleForId,
    tagDropdownVisibleForId,
  } = useAppStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDropdownOpen = tagDropdownVisibleForId === tag.displayId;

  console.log(
    `Tag [${tag.name}] (displayId: ${tag.displayId}) received onFilterChangeInEditor:`,
    onFilterChangeInEditor
  );

  const handleFilterSelect = (newFilter: DateFilter) => {
    updateTagFilter(tag.displayId, newFilter);
    if (typeof onFilterChangeInEditor === "function") {
      onFilterChangeInEditor(tag.displayId, newFilter);
    } else {
      console.error(
        "onFilterChangeInEditor is not a function when trying to update tag filter in editor."
      );
    }
    setTagDropdownVisibleForId(null);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTagDropdownVisibleForId(isDropdownOpen ? null : tag.displayId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (isDropdownOpen) {
          setTagDropdownVisibleForId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, setTagDropdownVisibleForId]);

  return (
    <span
      data-tag-display-id={dataTagDisplayId}
      contentEditable={false}
      className="inline-flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-1 my-0.5 relative cursor-pointer"
      onClick={toggleDropdown}
      ref={dropdownRef}
    >
      {tag.name}
      <span className="ml-1 text-blue-600">({tag.filter})</span>
      <FontAwesomeIcon
        icon={faCalendarDays}
        className="ml-1 text-blue-500 text-xs"
      />
      {isDropdownOpen && (
        <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg py-1 mt-2 top-full left-0 w-max">
          {dateFilterOptions.map((option) => (
            <button
              key={option}
              onClick={(e) => {
                e.stopPropagation();
                handleFilterSelect(option);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {children}
    </span>
  );
};

export default Tag;
