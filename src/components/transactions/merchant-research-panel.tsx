'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';

interface MerchantResearchResult {
  businessName?: string;
  businessType?: string;
  categoryName?: string;
  categorySlug?: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  confidence?: number;
  reasoning?: string;
  website?: string;
  location?: string;
  sources?: string[];
}

interface MerchantResearchPanelProps {
  researching: boolean;
  researchResult: MerchantResearchResult | null;
  researchError: string | null;
  editing: boolean;
  onResearch: () => Promise<void>;
}

export function MerchantResearchPanel({
  researching,
  researchResult,
  researchError,
  editing,
  onResearch,
}: MerchantResearchPanelProps) {
  return (
    <div className="space-y-4">
      {/* Research Button */}
      {!editing && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResearch}
          disabled={researching}
        >
          {researching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Researching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Research Merchant
            </>
          )}
        </Button>
      )}

      {/* Research Results */}
      {researchResult && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Research Results
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Claude AI found information about this merchant
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {researchResult.businessName && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Business Name:</strong>{' '}
                <span className="text-blue-700 dark:text-blue-300">{researchResult.businessName}</span>
              </div>
            )}
            {researchResult.businessType && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Business Type:</strong>{' '}
                <span className="text-blue-700 dark:text-blue-300">{researchResult.businessType}</span>
              </div>
            )}
            {researchResult.categoryName && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Suggested Category:</strong>{' '}
                <Badge
                  variant="secondary"
                  className="ml-1"
                >
                  {researchResult.categoryName}
                  {researchResult.subcategoryName && ` → ${researchResult.subcategoryName}`}
                </Badge>
              </div>
            )}
            {researchResult.confidence !== undefined && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Confidence:</strong>{' '}
                <span className="text-blue-700 dark:text-blue-300">
                  {Math.round(researchResult.confidence * 100)}%
                </span>
              </div>
            )}
            {researchResult.reasoning && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Reasoning:</strong>{' '}
                <span className="text-blue-700 dark:text-blue-300">{researchResult.reasoning}</span>
              </div>
            )}
            {researchResult.website && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Website:</strong>{' '}
                <a
                  href={researchResult.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {researchResult.website}
                </a>
              </div>
            )}
            {researchResult.location && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Location:</strong>{' '}
                <span className="text-blue-700 dark:text-blue-300">{researchResult.location}</span>
              </div>
            )}
            {researchResult.sources && researchResult.sources.length > 0 && (
              <div>
                <strong className="text-blue-900 dark:text-blue-100">Sources:</strong>
                <ul className="mt-1 space-y-1">
                  {researchResult.sources.map((source: string, idx: number) => (
                    <li key={idx}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {editing && researchResult.categorySlug && (
            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                The suggested category has been applied. Review and save when ready.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Research Error */}
      {researchError && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            <strong>Research failed:</strong> {researchError}
          </p>
        </div>
      )}
    </div>
  );
}
