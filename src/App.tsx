import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useAppStore, TagElement } from "./store"; // Import ParagraphElement
import { AutocompleteItem } from "./utils/types"; // Corrected import path
import FormulaInput from "./components/FormulaInput";
import { v4 as uuidv4 } from "uuid";
import * as math from "mathjs";
import { Descendant, Text, Element as SlateElement } from "slate"; // Import Element as SlateElement

const queryClient = new QueryClient();

const API_URL = "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete";

const dateCells = [
  { id: uuidv4(), date: "2025-01-24" },
  { id: uuidv4(), date: "2025-01-25" },
  { id: uuidv4(), date: "2025-01-26" },
  { id: uuidv4(), date: "2025-01-27" },
];

const extractExecutableFormula = (slateValue: Descendant[]): string => {
  let formula = "";

  slateValue.forEach((node) => {
    if (Text.isText(node)) {
      formula += node.text;
    } else {
      const element = node as SlateElement;
      if (element.type === "tag") {
        const tagElement = element as TagElement;
        const tagValue =
          typeof tagElement.apiValue === "string"
            ? parseFloat(String(tagElement.apiValue))
            : tagElement.apiValue;

        if (!isNaN(tagValue as number)) {
          const stringTagValue = String(tagValue);
          if (
            formula.length > 0 &&
            !/[+\-*/^%(]/.test(formula[formula.length - 1])
          ) {
            formula += " ";
          }
          formula += stringTagValue;
          formula += " ";
        } else {
          formula += "0";
        }
      } else if (element.children) {
        formula += extractExecutableFormula(element.children);
      }
    }
  });

  return formula.replace(/\s+/g, " ").trim();
};

const calculateFormula = (slateValue: Descendant[]): string => {
  const executableFormula = extractExecutableFormula(slateValue);

  try {
    const result = math.evaluate(executableFormula);

    if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
      return "Error";
    }

    return result.toFixed(2);
  } catch (e) {
    console.error("Calculation error with mathjs:", e);
    return "Error";
  }
};

function App() {
  const { formulaInput, tags } = useAppStore();
  const [calculatedResults, setCalculatedResults] = useState<
    Record<string, string>
  >({});

  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery<AutocompleteItem[]>({
    queryKey: ["autocompleteData"],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  useEffect(() => {
    const newResults: Record<string, string> = {};
    dateCells.forEach((cell) => {
      newResults[cell.id] = calculateFormula(formulaInput);
    });
    setCalculatedResults(newResults);
  }, [formulaInput, tags]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
        <p className="text-xl font-semibold">Loading API data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800">
        <p className="text-xl font-semibold">
          Error fetching API data: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          Causal-like formula app
        </h1>

        <div className="grid grid-cols-[1fr_repeat(4,minmax(0,100px))] gap-2 mb-2">
          <div className="p-2 text-gray-600 font-semibold text-sm">
            Formula / Date
          </div>
          {dateCells.map((cell) => (
            <div
              key={cell.id}
              className="p-2 text-center bg-gray-100 rounded-md text-gray-700 font-medium text-sm"
            >
              {new Date(cell.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_repeat(4,minmax(0,100px))] gap-2 items-center">
          <div className="relative">
            <FormulaInput apiData={apiData} />
          </div>
          {dateCells.map((cell) => (
            <div
              key={cell.id}
              className={`p-3 text-center rounded-lg font-bold text-lg ${
                calculatedResults[cell.id] === "Error"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {calculatedResults[cell.id]}
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Double-click the formula cell to edit. Type any character to trigger
          autocomplete.
        </p>

        <p className="text-xs italic text-gray-400 mt-6 text-center">
          Lucid FE Test by Fordyce Gozali
        </p>
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
