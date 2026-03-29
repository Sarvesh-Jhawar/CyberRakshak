'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Loader2, Mail, Shield, ExternalLink } from 'lucide-react';
import { UserLayout } from '@/components/dashboard/user-layout';
import { api, getAuthHeaders } from '@/lib/api';
import Link from 'next/link';

interface Email {
  id: string;
  gmail_message_id: string;
  subject: string;
  from_address: string;
  to_address: string;
  body_preview: string;
  phishing_score: number;
  threat_level: 'safe' | 'suspicious' | 'malicious';
  ml_analysis: any;
  is_read: boolean;
  created_at: string;
}

interface EmailStats {
  total: number;
  safe: number;
  suspicious: number;
  malicious: number;
}

export default function GmailAnalysisPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [threatFilter, setThreatFilter] = useState<'all' | 'safe' | 'suspicious' | 'malicious'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  // Fetch emails
  const fetchEmails = async (threatLevel: string, pageNum: number = 0) => {
    try {
      setLoading(true);

      const url = new URL(api.emails.list);
      url.searchParams.append('limit', '20');
      url.searchParams.append('offset', String(pageNum * 20));

      if (threatLevel !== 'all') {
        url.searchParams.append('threat_level', threatLevel);
      }

      const response = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setEmails(data.data?.emails || []);
        setHasMore((data.data?.offset || 0) + (data.data?.emails?.length || 0) < data.data?.total);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data?.message || 'Failed to load emails',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to fetch emails',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(api.emails.stats, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setStats({
          total: data.data.total_emails || 0,
          safe: data.data.safe || 0,
          suspicious: data.data.suspicious || 0,
          malicious: data.data.malicious || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch email detail
  const fetchEmailDetail = async (emailId: string) => {
    try {
      const response = await fetch(api.emails.detail(emailId), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedEmail(data.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load email details',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to fetch email detail',
      });
    }
  };

  useEffect(() => {
    fetchEmails(threatFilter, page);
    if (page === 0) {
      fetchStats();
    }
  }, [threatFilter, page]);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'malicious':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle className="w-4 h-4" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4" />;
      case 'malicious':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 33) return 'text-green-600';
    if (score < 66) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Analysis</h1>
            <p className="text-gray-500 mt-1">Analyze your Gmail emails for threats and security risks</p>
          </div>
          <Link href="/user-dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Emails</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.safe}</div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Suspicious</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.suspicious}</div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Malicious</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.malicious}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['all', 'safe', 'suspicious', 'malicious'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={threatFilter === filter ? 'default' : 'outline'}
                  onClick={() => {
                    setThreatFilter(filter);
                    setPage(0);
                  }}
                  className="capitalize"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email List */}
        <div className="space-y-3">
          {loading && page === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading emails...</span>
            </div>
          ) : emails.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {threatFilter === 'all'
                    ? 'No emails analyzed yet. Connect your Gmail account to get started.'
                    : `No ${threatFilter} emails found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {emails.map((email) => (
                <Card
                  key={email.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => fetchEmailDetail(email.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${getThreatColor(email.threat_level)}`}>
                            {getThreatIcon(email.threat_level)}
                          </div>
                          <h3 className="text-lg font-semibold truncate">{email.subject || '(No Subject)'}</h3>
                          <Badge variant="outline" className="ml-auto">
                            {email.is_read ? 'Read' : 'Unread'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">From:</span> {email.from_address || 'Unknown'}
                          </div>
                          <div>
                            <span className="font-medium">To:</span> {email.to_address || 'Unknown'}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {email.body_preview || '(No preview available)'}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            <span>Threat Level:</span>
                            <Badge className={getThreatColor(email.threat_level)}>
                              {email.threat_level}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <span>Phishing Score:</span>
                            <span className={`font-bold ${getScoreColor(email.phishing_score)}`}>
                              {email.phishing_score.toFixed(1)}/100
                            </span>
                          </div>

                          <div className="text-gray-500">
                            {new Date(email.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchEmailDetail(email.id);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">Page {page + 1}</span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1 rounded ${getThreatColor(selectedEmail.threat_level)}`}>
                      {getThreatIcon(selectedEmail.threat_level)}
                    </div>
                    <CardTitle>{selectedEmail.subject || '(No Subject)'}</CardTitle>
                  </div>
                  <CardDescription>Email Analysis Details</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-500"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {/* Threat Alert */}
              {selectedEmail.threat_level !== 'safe' && (
                <Alert
                  variant={selectedEmail.threat_level === 'malicious' ? 'destructive' : 'default'}
                  className={
                    selectedEmail.threat_level === 'suspicious'
                      ? 'border-yellow-300 bg-yellow-50'
                      : ''
                  }
                >
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>
                    {selectedEmail.threat_level === 'malicious'
                      ? 'Malicious Email Detected'
                      : 'Suspicious Email Detected'}
                  </AlertTitle>
                  <AlertDescription>
                    This email has been flagged as{' '}
                    <strong>{selectedEmail.threat_level}</strong> based on LLM analysis and threat indicators.
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Headers */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">From</label>
                  <p className="text-sm">{selectedEmail.from_address || 'Unknown'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">To</label>
                  <p className="text-sm">{selectedEmail.to_address || 'Unknown'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Subject</label>
                  <p className="text-sm">{selectedEmail.subject || '(No Subject)'}</p>
                </div>
              </div>

              {/* Threat Analysis */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold">Threat Analysis</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs font-medium text-gray-600 uppercase">Threat Level</label>
                    <Badge className={`${getThreatColor(selectedEmail.threat_level)} mt-1`}>
                      {selectedEmail.threat_level}
                    </Badge>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs font-medium text-gray-600 uppercase">Phishing Score</label>
                    <p className={`text-lg font-bold mt-1 ${getScoreColor(selectedEmail.phishing_score)}`}>
                      {selectedEmail.phishing_score.toFixed(1)}/100
                    </p>
                  </div>
                </div>

                {/* ML Analysis Details */}
                {selectedEmail.ml_analysis && (
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <h4 className="font-medium text-sm">ML Model Analysis</h4>
                    {typeof selectedEmail.ml_analysis === 'object' ? (
                      <div className="text-sm space-y-2 font-mono text-gray-700">
                        {Object.entries(selectedEmail.ml_analysis).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-semibold">{key}:</span>{' '}
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">{String(selectedEmail.ml_analysis)}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Email Body Preview */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Email Preview</h3>
                <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {selectedEmail.body_preview || '(No preview available)'}
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t pt-4 text-xs text-gray-500">
                <p>Email ID: {selectedEmail.id}</p>
                <p>Gmail Message ID: {selectedEmail.gmail_message_id}</p>
                <p>Analyzed: {new Date(selectedEmail.created_at).toLocaleString()}</p>
              </div>
            </CardContent>

            <div className="border-t p-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEmail(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </UserLayout>
  );
}
