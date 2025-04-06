import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Extended schema for the form
const photoUploadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  relationship: z.string().optional(),
  place: z.string().optional(),
  memoryNotes: z.string().optional(),
  imageBase64: z.string().min(1, "Please upload an image"),
});

type PhotoUploadFormValues = z.infer<typeof photoUploadSchema>;

type PhotoUploadProps = {
  profileId: number;
  onSuccess?: () => void;
};

export default function PhotoUpload({ profileId, onSuccess }: PhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Setup form
  const form = useForm<PhotoUploadFormValues>({
    resolver: zodResolver(photoUploadSchema),
    defaultValues: {
      name: "",
      relationship: "",
      place: "",
      memoryNotes: "",
      imageBase64: "",
    },
  });
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: PhotoUploadFormValues) => {
      const res = await apiRequest("POST", "/api/photos", {
        ...data,
        profileId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', profileId] });
      form.reset();
      setPreviewUrl(null);
      toast({
        title: "Photo uploaded",
        description: "The photo has been added to your library.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive", 
        title: "Upload failed",
        description: error.message,
      });
    },
  });
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 5MB",
      });
      return;
    }
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Remove data:image/jpeg;base64, prefix
        const base64Data = result.split(",")[1];
        form.setValue("imageBase64", base64Data);
        setPreviewUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Handle form submission
  const onSubmit = (data: PhotoUploadFormValues) => {
    uploadMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <FormLabel>Upload Photo</FormLabel>
          <div className="flex items-center space-x-4">
            {previewUrl ? (
              <div className="relative w-24 h-24 rounded-md overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-0 right-0 w-6 h-6 p-0 flex items-center justify-center rounded-full"
                  onClick={() => {
                    setPreviewUrl(null);
                    form.setValue("imageBase64", "");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-neutral-light rounded-md flex items-center justify-center">
                <i className="fas fa-image text-neutral-medium text-2xl"></i>
              </div>
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
              >
                <i className="fas fa-upload mr-2"></i>
                Select Image
              </Button>
            </div>
          </div>
          {form.formState.errors.imageBase64 && (
            <p className="text-sm text-red-500">
              {form.formState.errors.imageBase64.message}
            </p>
          )}
        </div>
        
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Full name of the person" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Relationship */}
        <FormField
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Granddaughter, Son, Friend" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Place */}
        <FormField
          control={form.control}
          name="place"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place</FormLabel>
              <FormControl>
                <Input placeholder="Where you typically meet this person" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Memory Notes */}
        <FormField
          control={form.control}
          name="memoryNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Memory Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add important details about this person that will help with recognition" 
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={uploadMutation.isPending || !form.getValues().imageBase64}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </form>
    </Form>
  );
}
