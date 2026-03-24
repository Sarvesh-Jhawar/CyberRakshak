import {
  AlertTriangle,
  Shield,
  BookOpen,
  ClipboardList,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AIResponseProps {
  data: {
    detection_summary?: string;
    user_alert?: string;
    playbook?: string[];
    evidence_to_collect?: string[];
    severity?: string;
    cert_alert?: string;
    technical_details?: Record<string, any>;
    ui_labels?: Record<string, any>;
  };
}

export const AIResponse = ({ data }: AIResponseProps) => {
  if (!data) {
    return null;
  }

  const getSeverityBadgeVariant = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6 p-2">
      {data.detection_summary && (
        <Card className="border-l-4 border-yellow-500">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <CardTitle className="font-bold text-lg">Detection Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base">{data.detection_summary}</p>
          </CardContent>
        </Card>
      )}

      {data.user_alert && (
        <Card className="border-l-4 border-blue-500">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Info className="h-6 w-6 text-blue-500" />
              <CardTitle className="font-bold text-lg">User Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-base">{data.user_alert}</p>
              {data.severity && (
                <Badge variant={getSeverityBadgeVariant(data.severity)} className="text-sm">
                  {data.severity}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {data.playbook && data.playbook.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-green-500" />
                <CardTitle className="font-bold text-lg">Playbook</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.playbook.map((step, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-500 text-white text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {data.evidence_to_collect && data.evidence_to_collect.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <ClipboardList className="h-6 w-6 text-purple-500" />
                <CardTitle className="font-bold text-lg">Evidence to Collect</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.evidence_to_collect.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-purple-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
      
      {data.technical_details && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="technical-details">
            <AccordionTrigger className="font-bold text-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6" />
                <span>Technical Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                {JSON.stringify(data.technical_details, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {data.cert_alert && (
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle className="font-bold text-lg">CERT Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{data.cert_alert}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};