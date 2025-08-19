import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HandwritingCanvas from "@/components/handwriting-canvas";
import ResultsPanel from "@/components/results-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, PillBottle, BarChart3, Info, Building, FlaskConical, Pill } from "lucide-react";

interface Statistics {
  totalMedicines: number;
  totalManufacturers: number;
  totalCategories: number;
  recognitionAccuracy: number;
}

export default function Home() {
  const [recognitionResults, setRecognitionResults] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { data: statistics } = useQuery<Statistics>({
    queryKey: ["/api/statistics"],
  });

  const handleRecognitionResult = (results: any) => {
    setRecognitionResults(results);
  };

  const handleManualSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.medicines || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <PillBottle className="text-medical-primary text-2xl mr-3" />
                <h1 className="text-xl font-bold text-gray-900">MedScript</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-medical-primary font-medium">Recognize</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Search</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">History</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Help</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Handwriting Recognition</h2>
          <p className="text-lg text-gray-600">Write medicine names and get instant matches from our database</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drawing Canvas Section */}
          <HandwritingCanvas onRecognitionResult={handleRecognitionResult} />
          
          {/* Results Section */}
          <ResultsPanel 
            recognitionResults={recognitionResults}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onSearchQueryChange={(query) => {
              setSearchQuery(query);
              handleManualSearch(query);
            }}
          />
        </div>

        {/* Statistics Section */}
        {statistics && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="text-medical-primary mr-2" />
                Database Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-medical-primary">{statistics.totalMedicines.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Medicines</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-medical-success">{statistics.totalManufacturers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Manufacturers</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{statistics.totalCategories}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-medical-warning">{statistics.recognitionAccuracy}%</div>
                  <div className="text-sm text-gray-600">Recognition Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Info className="text-medical-primary mr-2" />
              How to Use
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-start space-x-3">
                <div className="bg-medical-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <h4 className="font-medium mb-1">Write Clearly</h4>
                  <p>Use clear, block letters for better recognition accuracy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-medical-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <h4 className="font-medium mb-1">Review Results</h4>
                  <p>Check recognition candidates and confidence scores</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-medical-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <h4 className="font-medium mb-1">Verify Matches</h4>
                  <p>Review medicine details and match percentages</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2024 MedScript. Powered by Google Handwriting Recognition API
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700">Terms of Service</a>
              <a href="#" className="hover:text-gray-700">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
