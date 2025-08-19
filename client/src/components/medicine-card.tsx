import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, FlaskConical, Pill } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  brand_name: string | null;
  manufacturer_name: string;
  short_composition: string | null;
  category: string | null;
  rx_required: string | null;
}

interface MedicineCardProps {
  medicine: Medicine;
  matchScore?: number;
}

export default function MedicineCard({ medicine, matchScore }: MedicineCardProps) {
  const getMatchScoreColor = (score: number) => {
    if (score >= 0.9) return "bg-green-100 text-green-800";
    if (score >= 0.75) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h5 className="font-semibold text-gray-900">{medicine.name}</h5>
            {medicine.brand_name && (
              <p className="text-sm text-medical-primary font-medium">{medicine.brand_name}</p>
            )}
          </div>
          {matchScore && (
            <Badge className={`text-xs ${getMatchScoreColor(matchScore)}`}>
              Match: {Math.round(matchScore * 100)}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Building className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{medicine.manufacturer_name}</span>
          </div>
          
          {medicine.short_composition && (
            <div className="flex items-center text-gray-600">
              <FlaskConical className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-xs">{medicine.short_composition}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <Pill className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{medicine.category || "Unknown Category"}</span>
            {medicine.rx_required && (
              <>
                <span className="mx-2">•</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    medicine.rx_required.toLowerCase().includes('prescription') 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {medicine.rx_required}
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex space-x-2">
          <Button size="sm" className="bg-medical-primary hover:bg-blue-700 text-xs">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Save to List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
