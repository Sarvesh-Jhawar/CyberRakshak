import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface EmailMLAnalysisProps {
  mlAnalysis: any;
  phishingScore: number;
  threatLevel: string;
  llmAnalysis?: any;
}

export const EmailMLAnalysis = ({ mlAnalysis, phishingScore, threatLevel, llmAnalysis }: EmailMLAnalysisProps) => {
  if (!mlAnalysis) {
    return (
      <Card className="border-l-4 border-gray-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ML Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No ML analysis available</p>
        </CardContent>
      </Card>
    );
  }

  const getThreatIcon = (level: string) => {
    switch (level) {
      case "malicious":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "suspicious":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      {/* Threat Overview */}
      <Card className="border-l-4 border-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getThreatIcon(threatLevel)}
            Threat Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Threat Level</p>
              <Badge
                className={`mt-1 ${
                  threatLevel === "malicious"
                    ? "bg-red-100 text-red-800"
                    : threatLevel === "suspicious"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {threatLevel.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Phishing Score</p>
              <p className={`text-lg font-bold mt-1 ${getScoreColor(phishingScore)}`}>
                {phishingScore.toFixed(1)}/100
              </p>
            </div>
          </div>

          {/* Phishing Score Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Risk Level</span>
              <span className="font-mono font-bold">{phishingScore.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  phishingScore > 70
                    ? "bg-red-500"
                    : phishingScore > 40
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${phishingScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Model Details */}
      {typeof mlAnalysis === "object" && Object.keys(mlAnalysis).length > 0 && (
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              ML Model Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Model Info */}
            {mlAnalysis.model_used && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Model Used</p>
                <p className="text-sm font-medium mt-1">{mlAnalysis.model_used}</p>
              </div>
            )}

            {/* Prediction */}
            {mlAnalysis.prediction && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Prediction</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    mlAnalysis.prediction === "benign" || mlAnalysis.prediction === "legitimate"
                      ? "border-green-500 text-green-700"
                      : "border-red-500 text-red-700"
                  }`}
                >
                  {mlAnalysis.prediction.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Confidence/Probability */}
            {(mlAnalysis.confidence !== undefined || mlAnalysis.threat_probability !== undefined) && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Confidence</p>
                <div className="mt-1">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Threat Confidence</span>
                    <span className="font-mono font-bold">
                      {((mlAnalysis.confidence || mlAnalysis.threat_probability || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (mlAnalysis.confidence || mlAnalysis.threat_probability || 0) > 0.7
                          ? "bg-red-500"
                          : (mlAnalysis.confidence || mlAnalysis.threat_probability || 0) > 0.4
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.round((mlAnalysis.confidence || mlAnalysis.threat_probability || 0) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Model Performance */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              {mlAnalysis.model_accuracy && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Accuracy</p>
                  <p className="text-sm font-medium mt-1">{mlAnalysis.model_accuracy}</p>
                </div>
              )}
              {mlAnalysis.model_roc_auc && mlAnalysis.model_roc_auc !== "N/A" && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">ROC-AUC</p>
                  <p className="text-sm font-medium mt-1">{mlAnalysis.model_roc_auc}</p>
                </div>
              )}
            </div>

            {/* Class Probabilities */}
            {mlAnalysis.class_probabilities && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Class Probabilities</p>
                <div className="space-y-1">
                  {Object.entries(mlAnalysis.class_probabilities).map(([className, prob]: [string, any]) => (
                    <div key={className} className="flex justify-between text-xs">
                      <span className="capitalize">{className}</span>
                      <span className="font-mono">{(Number(prob) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LLM Contextual Analysis */}
      {llmAnalysis && !llmAnalysis.error && (
        <Card className="border-l-4 border-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              LLM Contextual Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Threat Verdict */}
            {llmAnalysis.threat_verdict && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">AI Threat Assessment</p>
                <Badge
                  className={`mt-1 ${
                    llmAnalysis.threat_verdict === "MALICIOUS"
                      ? "bg-red-100 text-red-800"
                      : llmAnalysis.threat_verdict === "SUSPICIOUS"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {llmAnalysis.threat_verdict}
                </Badge>
              </div>
            )}

            {/* Severity */}
            {llmAnalysis.severity && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Severity Level</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    llmAnalysis.severity === "Critical"
                      ? "border-red-500 text-red-700"
                      : llmAnalysis.severity === "High"
                      ? "border-orange-500 text-orange-700"
                      : llmAnalysis.severity === "Medium"
                      ? "border-yellow-500 text-yellow-700"
                      : "border-green-500 text-green-700"
                  }`}
                >
                  {llmAnalysis.severity}
                </Badge>
              </div>
            )}

            {/* Detection Summary */}
            {llmAnalysis.detection_summary && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Detection Summary</p>
                <p className="text-sm mt-1 font-medium">{llmAnalysis.detection_summary}</p>
              </div>
            )}

            {/* User Alert */}
            {llmAnalysis.user_alert && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-700 uppercase tracking-wide font-semibold">⚠️ Immediate Action Required</p>
                <p className="text-sm text-orange-800 mt-1">{llmAnalysis.user_alert}</p>
              </div>
            )}

            {/* Technical Details */}
            {llmAnalysis.technical_details && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Technical Indicators</p>
                {llmAnalysis.technical_details.indicators && llmAnalysis.technical_details.indicators.length > 0 && (
                  <div className="space-y-1">
                    {llmAnalysis.technical_details.indicators.map((indicator: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-indigo-500"></span>
                        <span>{indicator}</span>
                      </div>
                    ))}
                  </div>
                )}
                {llmAnalysis.technical_details.analysis && (
                  <p className="text-sm text-gray-700 mt-2 italic">{llmAnalysis.technical_details.analysis}</p>
                )}
              </div>
            )}

            {/* Recommended Actions */}
            {llmAnalysis.recommended_actions && (
              <div className="space-y-3">
                {llmAnalysis.recommended_actions.immediate && llmAnalysis.recommended_actions.immediate.length > 0 && (
                  <div>
                    <p className="text-xs text-red-700 uppercase tracking-wide font-semibold mb-2">🚨 Immediate Actions</p>
                    <ul className="space-y-1">
                      {llmAnalysis.recommended_actions.immediate.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmAnalysis.recommended_actions.investigation && llmAnalysis.recommended_actions.investigation.length > 0 && (
                  <div>
                    <p className="text-xs text-blue-700 uppercase tracking-wide font-semibold mb-2">🔍 Investigation Steps</p>
                    <ul className="space-y-1">
                      {llmAnalysis.recommended_actions.investigation.map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmAnalysis.recommended_actions.prevention && llmAnalysis.recommended_actions.prevention.length > 0 && (
                  <div>
                    <p className="text-xs text-green-700 uppercase tracking-wide font-semibold mb-2">🛡️ Prevention Measures</p>
                    <ul className="space-y-1">
                      {llmAnalysis.recommended_actions.prevention.map((measure: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold mt-0.5">
                            ✓
                          </span>
                          <span>{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Playbook */}
            {llmAnalysis.playbook && llmAnalysis.playbook.length > 0 && (
              <div>
                <p className="text-xs text-purple-700 uppercase tracking-wide font-semibold mb-2">📋 Response Playbook</p>
                <ol className="space-y-2">
                  {llmAnalysis.playbook.map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-purple-800">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Evidence to Collect */}
            {llmAnalysis.evidence_to_collect && llmAnalysis.evidence_to_collect.length > 0 && (
              <div>
                <p className="text-xs text-gray-700 uppercase tracking-wide font-semibold mb-2">📊 Evidence to Collect</p>
                <ul className="space-y-1">
                  {llmAnalysis.evidence_to_collect.map((evidence: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-gray-500"></span>
                      <span>{evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fallback Recommended Actions */}
      {!llmAnalysis && (
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {threatLevel === "malicious" && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">!</span>
                    <p className="text-sm">Do not click any links or download attachments</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">!</span>
                    <p className="text-sm">Report this email to your IT security team immediately</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">!</span>
                    <p className="text-sm">Delete this email and empty your trash</p>
                  </div>
                </>
              )}
              {threatLevel === "suspicious" && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">?</span>
                    <p className="text-sm">Verify the sender's identity through official channels</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">?</span>
                    <p className="text-sm">Hover over links to check their actual destination</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">?</span>
                    <p className="text-sm">Contact the sender directly using known contact information</p>
                  </div>
                </>
              )}
              {threatLevel === "safe" && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
                    <p className="text-sm">This email appears safe, but always exercise caution</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
                    <p className="text-sm">Verify important requests through multiple channels</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};