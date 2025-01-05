import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import {useMutation} from '@tanstack/react-query'

// Initialize Supabase client
const supabase = createClient('https://lalhrowagdujluyyztsd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbGhyb3dhZ2R1amx1eXl6dHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMzczMjMsImV4cCI6MjA0ODkxMzMyM30.0WmOp9pbjZsQ4RFGeJmtQMatsJjrzKm3NoXDXu587BE');

interface UploadResult {
    downloadUrl: string;
  }
  
  export function useFileUpload() {
    const [uploadProgress, setUploadProgress] = useState(0);
  
    const mutation = useMutation<UploadResult, Error, string>({
      mutationFn: async (fileUri: string) => {
        const fileName = `${Date.now()}_${fileUri.split('/').pop()}_${Math.random().toString(36).substring(7)}`;
        
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
  
        const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  
        const { data, error } = await supabase.storage
          .from('nutralize')
          .upload(fileName, decode(fileContent), {
            contentType: 'application/octet-stream', // You might want to determine this based on the file type
            upsert: true,
          });
  
        if (error) {
          throw new Error(error.message);
        }
  
        const { data: { publicUrl } } = supabase.storage
          .from('nutralize')
          .getPublicUrl(data.path);
        
        return { downloadUrl: publicUrl };
      },
      onMutate: (variables) => {
        setUploadProgress(0);
      },
      onError: (error) => {
        setUploadProgress(0);
      },
      onSuccess: (data) => {
        setUploadProgress(100);
      },
      onSettled: (data, error, variables) => {
      },
    });
  
    const uploadFile = async (fileUri: string) => {
      try {
        const result = await mutation.mutateAsync(fileUri);
        return result;
      } catch (error) {
        throw error;
      }
    };
  
    return {
      uploadFile,
      isUploading: mutation.isPending,
      uploadProgress,
      error: mutation.error,
    };
  }
  
  // Helper function to decode base64
  function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  