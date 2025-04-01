'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/translation/language-selector';
import { requestTranslation, getTranslation } from '@/lib/api/translation';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Download, Check, AlertCircle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/ai';

interface TranslationCardProps {
  transcriptId: string;
  transcriptLanguage?: string;
}

export function TranslationCard({ transcriptId, transcriptLanguage }: TranslationCardProps) {
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationId, setTranslationId] = useState<string | null>(null);
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [translationContent, setTranslationContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast({
        title: 'Please select a language',
        description: 'You need to select a target language for translation',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsTranslating(true);
      setError(null);
      setTranslationStatus('processing');
      
      const result = await requestTranslation(
        transcriptId,
        targetLanguage,
        transcriptLanguage
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start translation');
      }
      
      if (result.translation) {
        setTranslationId(result.translation.id);
        
        // If translation already exists and is completed
        if (result.translation.status === 'completed') {
          await checkTranslationStatus(result.translation.id);
        } else {
          // Start polling for translation status
          pollTranslationStatus(result.translation.id);
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to translate transcript');
      
      toast({
        title: 'Translation failed',
        description: error instanceof Error ? error.message : 'Failed to translate transcript',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  const pollTranslationStatus = async (id: string) => {
    try {
      // Poll for translation status every 2 seconds
      const intervalId = setInterval(async () => {
        const result = await checkTranslationStatus(id);
        
        // Stop polling when translation is complete or failed
        if (result && (result.status === 'completed' || result.status === 'error')) {
          clearInterval(intervalId);
        }
      }, 2000);
      
      // Clear interval after 5 minutes (300 seconds) in case of very long translations
      setTimeout(() => clearInterval(intervalId), 300000);
    } catch (error) {
      console.error('Error polling translation status:', error);
    }
  };
  
  const checkTranslationStatus = async (id: string) => {
    try {
      const result = await getTranslation(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get translation status');
      }
      
      if (result.translation) {
        setTranslationStatus(result.translation.status as any);
        
        if (result.translation.status === 'completed' && result.translation.content) {
          setTranslationContent(result.translation.content);
          
          toast({
            title: 'Translation completed',
            description: 'Your transcript has been translated successfully',
          });
        } else if (result.translation.status === 'error') {
          setError(result.translation.processing_error || 'An error occurred during translation');
          
          toast({
            title: 'Translation failed',
            description: result.translation.processing_error || 'An error occurred during translation',
            variant: 'destructive',
          });
        }
        
        return result.translation;
      }
    } catch (error) {
      console.error('Error checking translation status:', error);
      setTranslationStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to check translation status');
    }
    
    return null;
  };
  
  const handleRefresh = async () => {
    if (translationId) {
      await checkTranslationStatus(translationId);
    }
  };
  
  const downloadTranslation = () => {
    if (!translationContent) return;
    
    const blob = new Blob([translationContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_translation_${targetLanguage}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const languageName = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage)?.name;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Translation</CardTitle>
        <CardDescription>
          Translate your transcript to another language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Language</label>
            <LanguageSelector 
              value={targetLanguage}
              onValueChange={setTargetLanguage}
              placeholder="Select target language"
              disabled={isTranslating || translationStatus === 'processing'}
            />
          </div>
          
          {translationStatus === 'completed' && translationContent && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">
                Translation to {languageName}
              </h3>
              <div className="p-3 bg-muted rounded-md max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">{translationContent}</p>
              </div>
            </div>
          )}
          
          {translationStatus === 'error' && error && (
            <div className="flex items-start gap-2 p-3 text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Translation failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          {translationStatus === 'processing' && (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing translation...
            </div>
          )}
          {translationStatus === 'completed' && (
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Translation complete
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {translationStatus === 'completed' && (
            <Button size="sm" variant="outline" onClick={downloadTranslation}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          
          {translationStatus === 'completed' || translationStatus === 'error' ? (
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleTranslate}
              disabled={!targetLanguage || isTranslating || translationStatus === 'processing'}
            >
              {isTranslating || translationStatus === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                'Translate'
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 