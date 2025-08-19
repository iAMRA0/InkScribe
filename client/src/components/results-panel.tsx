import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Pill, ArrowRight } from "lucide-react";
import MedicineCard from "./medicine-card";

interface RecognitionCandidate {
  text: string;
  confidence: number;
}

interface MedicineMatch {
  medicine: {
    id: string;
    name: string;
    brand_name: string | null;
    manufacturer_name: string;
    short_composition: string | null;
    category: string | null;
    rx_required: string | null;
  };
  matchScore: number;
  matchedField: string;
}

interface ResultsPanelProps {
  recognitionResults: {
    candidates: RecognitionCandidate[];
    matches: MedicineMatch[];
  } | null;
  searchQuery: string;
  searchResults: any[];
  onSearchQueryChange: (query: string) => void;
}

export default function ResultsPanel({ 
  recognitionResults, 
  searchQuery, 
  searchResults,
  onSearchQueryChange 
}: ResultsPanelProps) {
  const candidates = recognitionResults?.candidates || [];
  const matches = recognitionResults?.matches || [];
  const displayResults = searchQuery ? searchResults : matches;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Pill className="text-medical-primary mr-2" />
            Recognition Results
          </h3>
          <div className="text-sm text-gray-500">
            {displayResults.length} matches found
          </div>
        </div>

        {/* Search Fallback */}
        <div className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Or search manually..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Recognition Candidates */}
        {candidates.length > 0 && !searchQuery && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recognition Candidates</h4>
            <div className="space-y-2">
              {candidates.map((candidate, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">{candidate.text}</span>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={candidate.confidence > 0.8 ? "default" : "secondary"}
                      className={`text-xs ${
                        candidate.confidence > 0.8 ? "bg-medical-success" : "bg-medical-warning"
                      }`}
                    >
                      {Math.round(candidate.confidence * 100)}%
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-medical-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Medicines */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {searchQuery ? "Search Results" : "Matched Medicines"}
          </h4>
          
          {displayResults.length > 0 ? (
            <div className="space-y-4">
              {displayResults.map((result, index) => (
                <MedicineCard
                  key={result.id || index}
                  medicine={searchQuery ? result : result.medicine}
                  matchScore={searchQuery ? undefined : result.matchScore}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-2">No matches found</h4>
              <p className="text-sm text-gray-400">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Try writing more clearly or use manual search"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
