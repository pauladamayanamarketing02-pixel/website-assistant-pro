import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Pencil, Sparkles, ArrowLeft, Copy } from 'lucide-react';

type ToolLanguage = 'html' | 'react' | 'nextjs';

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  codeLanguage: ToolLanguage;
  codeContent: string;
}

type ViewMode = 'tools' | 'tool-detail' | 'tool-create';

export default function AIGenerator() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);

  // Tools management (default screen)
  const [viewMode, setViewMode] = useState<ViewMode>('tools');
  const [tools, setTools] = useState<AITool[]>([]);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [savingTool, setSavingTool] = useState(false);

  // Tool form
  const [toolForm, setToolForm] = useState({
    title: '',
    description: '',
    icon: 'Sparkles',
    color: 'bg-primary/10 text-primary',
    codeLanguage: 'html' as ToolLanguage,
    codeContent: '',
  });

  const canUsePage = useMemo(() => Boolean(user?.id), [user?.id]);

  const loadTools = async () => {
    if (!user?.id) return;
    setLoadingTools(true);
    try {
      const { data, error } = await (supabase as any)
        .from('assist_ai_tools')
        .select('id,title,description,icon,color,code_language,code_content')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: AITool[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? '',
        description: row.description ?? '',
        icon: row.icon ?? 'Sparkles',
        color: row.color ?? 'bg-primary/10 text-primary',
        codeLanguage: (row.code_language ?? 'html') as ToolLanguage,
        codeContent: row.code_content ?? '',
      }));

      setTools(mapped);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat tools',
        description: e?.message ?? 'Terjadi kesalahan.',
      });
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void loadTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleToolGenerate = () => {
    if (!selectedTool) return;
    setGenerating(true);
    setTimeout(() => {
      setResult(
        `Generated ${selectedTool.title} content:\n\n"${prompt}"\n\nThis is a placeholder. Connect to AI Gateway for real generation.`
      );
      setGenerating(false);
    }, 2000);
  };

  const handleAddTool = () => {
    setEditingTool(null);
    setToolForm({
      title: '',
      description: '',
      icon: 'Sparkles',
      color: 'bg-primary/10 text-primary',
      codeLanguage: 'html',
      codeContent: '',
    });
    setViewMode('tool-create');
  };

  const handleEditTool = (tool: AITool) => {
    setEditingTool(tool);
    setToolForm({
      title: tool.title,
      description: tool.description,
      icon: tool.icon,
      color: tool.color,
      codeLanguage: tool.codeLanguage,
      codeContent: tool.codeContent,
    });
    setViewMode('tool-create');
  };

  const handleSaveTool = async () => {
    if (!user?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Kamu harus login.' });
      return;
    }

    if (!toolForm.title.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Tool name is required.' });
      return;
    }

    setSavingTool(true);
    try {
      if (editingTool) {
        const { error } = await (supabase as any)
          .from('assist_ai_tools')
          .update({
            title: toolForm.title,
            description: toolForm.description ?? '',
            icon: toolForm.icon,
            color: toolForm.color,
            json_config: {},
            code_language: toolForm.codeLanguage,
            code_content: toolForm.codeContent,
          })
          .eq('id', editingTool.id)
          .eq('created_by', user.id);

        if (error) throw error;
        toast({ title: 'Tool Updated', description: 'Tool berhasil diupdate.' });
      } else {
        const { error } = await (supabase as any)
          .from('assist_ai_tools')
          .insert({
            created_by: user.id,
            title: toolForm.title,
            description: toolForm.description ?? '',
            icon: toolForm.icon,
            color: toolForm.color,
            json_config: {},
            code_language: toolForm.codeLanguage,
            code_content: toolForm.codeContent,
            is_active: true,
          });

        if (error) throw error;
        toast({ title: 'Tool Created', description: 'Tool berhasil dibuat.' });
      }

      setViewMode('tools');
      setEditingTool(null);
      await loadTools();
    } catch (e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan tool',
        description: e?.message ?? 'Terjadi kesalahan.',
      });
    } finally {
      setSavingTool(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await (supabase as any)
        .from('assist_ai_tools')
        .delete()
        .eq('id', toolId)
        .eq('created_by', user.id);

      if (error) throw error;
      toast({ title: 'Tool Deleted', description: 'Tool berhasil dihapus.' });
      await loadTools();
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: e?.message ?? 'Terjadi kesalahan.' });
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied!', description: 'Content copied to clipboard.' });
  };

  // Create/edit tool view (full page)
  if (viewMode === 'tool-create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setViewMode('tools');
              setEditingTool(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{editingTool ? 'Edit Tool' : 'Create New Tool'}</h1>
            <p className="text-muted-foreground">Simpan tool ke database</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tool Details</CardTitle>
            <CardDescription>Masukkan info tool + code snippet (HTML/React/Next.js)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tool Name *</Label>
              <Input
                placeholder="Enter tool name..."
                value={toolForm.title}
                onChange={(e) => setToolForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Enter tool description..."
                value={toolForm.description}
                onChange={(e) => setToolForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={toolForm.icon} onValueChange={(value) => setToolForm((prev) => ({ ...prev, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sparkles">Sparkles</SelectItem>
                    <SelectItem value="FileText">FileText</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Users">Users</SelectItem>
                    <SelectItem value="PenTool">PenTool</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="MessageSquare">MessageSquare</SelectItem>
                    <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color Theme</Label>
                <Select value={toolForm.color} onValueChange={(value) => setToolForm((prev) => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-primary/10 text-primary">Primary</SelectItem>
                    <SelectItem value="bg-blue-500/10 text-blue-500">Blue</SelectItem>
                    <SelectItem value="bg-purple-500/10 text-purple-500">Purple</SelectItem>
                    <SelectItem value="bg-green-500/10 text-green-500">Green</SelectItem>
                    <SelectItem value="bg-orange-500/10 text-orange-500">Orange</SelectItem>
                    <SelectItem value="bg-pink-500/10 text-pink-500">Pink</SelectItem>
                    <SelectItem value="bg-cyan-500/10 text-cyan-500">Cyan</SelectItem>
                    <SelectItem value="bg-yellow-500/10 text-yellow-500">Yellow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Code Language</Label>
                <Select
                  value={toolForm.codeLanguage}
                  onValueChange={(value) => setToolForm((prev) => ({ ...prev, codeLanguage: value as ToolLanguage }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Code Snippet</Label>
              <Textarea
                placeholder="Paste your HTML / React / Next.js code here..."
                value={toolForm.codeContent}
                onChange={(e) => setToolForm((prev) => ({ ...prev, codeContent: e.target.value }))}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode('tools');
                  setEditingTool(null);
                }}
                disabled={savingTool}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTool} disabled={savingTool}>
                {savingTool ? 'Saving...' : editingTool ? 'Update Tool' : 'Create Tool'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tool detail view
  if (viewMode === 'tool-detail' && selectedTool) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setViewMode('tools'); setSelectedTool(null); setPrompt(''); setResult(''); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${selectedTool.color}`}>
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{selectedTool.title}</h1>
              <p className="text-muted-foreground">{selectedTool.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Prompt</CardTitle>
              <CardDescription>Describe what you want to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe what you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px]"
              />
              <Button 
                onClick={handleToolGenerate} 
                disabled={generating || !prompt}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Content'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Your generated content will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg min-h-[200px]">
                    <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleCopyResult}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <p>Enter a prompt and click generate to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    );
  }

  // Tools management view
  if (viewMode === 'tools') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Generator</h1>
            <p className="text-muted-foreground">All Tools</p>
          </div>
          <Button onClick={handleAddTool}>
            <Plus className="h-4 w-4 mr-2" />
            New Tool
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tools</CardTitle>
            <CardDescription>Click on a tool to use it, or edit/delete from actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Card 
                  key={tool.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/50"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1"
                        onClick={() => { setSelectedTool(tool); setViewMode('tool-detail'); }}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tool.color}`}>
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tool.title}</CardTitle>
                          <CardDescription className="text-xs">{tool.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditTool(tool); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    );
  }

  // No other view modes.
  return null;
}
