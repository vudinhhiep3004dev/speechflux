import { DashboardHeader } from '@/components/dashboard/header';
import { Shell } from '@/components/shell';
import { FileList } from '@/components/files/fileList';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import Link from 'next/link';

// Force dynamic rendering for auth context
export const dynamic = 'force-dynamic';

export default function FilesPage() {
  return (
    <Shell>
      <DashboardHeader 
        heading="Files" 
        text="Manage your audio files."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              Dashboard
            </Link>
          </Button>
        </div>
      </DashboardHeader>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">All Files</h2>
          <FileUpload
            accept="audio/*"
            maxSizeMB={25}
          />
        </div>
        
        <FileList />
      </div>
    </Shell>
  );
} 