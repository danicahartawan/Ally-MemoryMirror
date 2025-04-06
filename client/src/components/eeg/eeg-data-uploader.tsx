import { useState } from 'react';
import { useProfileContext } from '@/contexts/profile-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UploadCloud, FileType, CheckCircle, InfoIcon, AlertCircle, BrainCircuit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  eegFile: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: 'Please select an EEG data file to upload.',
    })
    .transform((files) => files.item(0) as File),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EegDataUploader() {
  const { selectedProfile } = useProfileContext();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!selectedProfile) {
      toast({
        title: 'Error',
        description: 'Please select a profile first',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.floor(Math.random() * 10) + 5;
        const newValue = Math.min(prev + increment, 95);
        return newValue;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('eegFile', data.eegFile);
      formData.append('profileId', selectedProfile.id.toString());
      if (data.notes) {
        formData.append('notes', data.notes);
      }

      const response = await fetch('/api/eeg-uploads', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type, it will be set automatically for FormData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload EEG data');
      }

      const result = await response.json();
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadResult({
        success: true,
        message: 'EEG data uploaded successfully! The system will analyze and process the data to generate cognitive insights.',
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/eeg-readings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/eeg-cognitive-profiles'] });

      toast({
        title: 'Upload Successful',
        description: 'EEG data has been uploaded successfully.',
      });

      // Reset form
      form.reset();
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload EEG data',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Please select a profile</h2>
        <p className="text-neutral-medium">
          You need to select a profile to upload EEG data.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5" />
          Upload EEG Data
        </CardTitle>
        <CardDescription>
          Upload EEG recordings for analysis and cognitive profile generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Upload raw EEG data files from compatible EEG headsets. The system supports common formats 
            like EDF, BDF, and CSV. Data will be analyzed to generate insights and build cognitive profiles.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="eegFile"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>EEG Data File</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-input rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer"
                      onClick={() => document.getElementById('eeg-file-input')?.click()}>
                      <input
                        id="eeg-file-input"
                        type="file"
                        className="hidden"
                        accept=".edf,.bdf,.csv,.txt"
                        onChange={(e) => {
                          onChange(e.target.files);
                        }}
                        {...field}
                      />
                      <UploadCloud className="h-12 w-12 mb-4 text-primary" />
                      <div className="font-medium mb-1">Click to upload or drag and drop</div>
                      <div className="text-sm text-neutral-medium">
                        {value instanceof File ? (
                          <div className="flex items-center text-primary">
                            <FileType className="mr-2 h-4 w-4" />
                            {value.name} ({Math.round(value.size / 1024)} KB)
                          </div>
                        ) : (
                          'EDF, BDF, CSV or TXT files (max 50MB)'
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recording Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about the recording context, subject's state, or testing conditions..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any relevant information about this EEG recording.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadResult && (
              <Alert
                variant={uploadResult.success ? 'default' : 'destructive'}
                className="mt-4"
              >
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {uploadResult.success ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription>{uploadResult.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload EEG Data'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-neutral-medium bg-background-subtle rounded-b-lg">
        <div className="flex items-start space-x-2">
          <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Regular EEG data uploads help build a more accurate cognitive profile
            and improve memory assistance features. We recommend uploading data
            at least once a week.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}