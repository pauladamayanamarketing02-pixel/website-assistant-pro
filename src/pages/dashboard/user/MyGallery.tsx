import { useState, useRef, useEffect } from 'react';
import { 
  ImageIcon, Video, FileIcon, Upload, Trash2, 
  MoreVertical, Download, Eye, Grid, List, X, Copy, Link 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  created_at: string;
}

export default function MyGallery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTab, setSelectedTab] = useState('all');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch gallery from database
  useEffect(() => {
    const fetchGallery = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_gallery')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setMedia(data);
      }
      setLoading(false);
    };

    fetchGallery();
  }, [user]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const type = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
        ? 'video' 
        : 'file';

      // Upload to Supabase Storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}`,
        });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('user_gallery')
        .insert({
          user_id: user.id,
          name: file.name,
          type,
          url: urlData.publicUrl,
          size: file.size,
        })
        .select()
        .single();

      if (dbData) {
        setMedia(prev => [dbData, ...prev]);
      }
    }

    setUploading(false);
    toast({
      title: 'Uploaded!',
      description: `${files.length} file(s) uploaded successfully.`,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: MediaItem) => {
    // Delete from storage
    const filePath = item.url.split('/user-files/')[1];
    if (filePath) {
      await supabase.storage.from('user-files').remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('user_gallery')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete file.',
      });
      return;
    }

    setMedia(prev => prev.filter(m => m.id !== item.id));
    toast({
      title: 'Deleted',
      description: 'File has been removed.',
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied!',
      description: 'URL copied to clipboard.',
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const filteredMedia = media.filter((item) => {
    if (selectedTab === 'all') return true;
    return item.type === selectedTab;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Gallery</h1>
          <p className="text-muted-foreground">Manage your images, videos, and files</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="file">Files</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {filteredMedia.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No files yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first file to get started</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredMedia.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative aspect-square bg-muted">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getIcon(item.type)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleCopyUrl(item.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatSize(item.size)} • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewItem(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyUrl(item.url)}>
                            <Link className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={item.url} download={item.name} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewItem?.name}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => previewItem && handleCopyUrl(previewItem.url)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewItem?.type === 'image' ? (
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="w-full rounded-lg"
              />
            ) : previewItem?.type === 'video' ? (
              <video
                src={previewItem.url}
                controls
                className="w-full rounded-lg"
              />
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Preview not available for this file type</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
