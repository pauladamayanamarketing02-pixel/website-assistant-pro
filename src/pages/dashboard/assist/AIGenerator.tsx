import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  ArrowLeft,
  Code,
  Copy,
} from 'lucide-react';

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  jsonConfig: string;
}

const defaultTools: AITool[] = [
  {
    id: 'bkb',
    title: 'Business Knowledge Base',
    description: 'Generate comprehensive business documentation',
    icon: 'FileText',
    color: 'bg-blue-500/10 text-blue-500',
    jsonConfig: '{"systemPrompt": "You are a business expert...", "temperature": 0.7}',
  },
  {
    id: 'be',
    title: 'Brand Expert',
    description: 'Create brand voice and messaging guidelines',
    icon: 'User',
    color: 'bg-purple-500/10 text-purple-500',
    jsonConfig: '{"systemPrompt": "You are a brand strategist...", "temperature": 0.8}',
  },
  {
    id: 'persona',
    title: 'Customer Persona',
    description: 'Build detailed customer personas',
    icon: 'Users',
    color: 'bg-green-500/10 text-green-500',
    jsonConfig: '{"systemPrompt": "You are a marketing expert...", "temperature": 0.7}',
  },
  {
    id: 'blog',
    title: 'Content Blogs',
    description: 'Generate SEO-optimized blog content',
    icon: 'PenTool',
    color: 'bg-orange-500/10 text-orange-500',
    jsonConfig: '{"systemPrompt": "You are an SEO content writer...", "temperature": 0.7}',
  },
  {
    id: 'image',
    title: 'Generate Images',
    description: 'Create AI-powered visuals for your brand',
    icon: 'Image',
    color: 'bg-pink-500/10 text-pink-500',
    jsonConfig: '{"systemPrompt": "You are an image prompt expert...", "temperature": 0.9}',
  },
  {
    id: 'social',
    title: 'Social Media Posts',
    description: 'Generate engaging social media content',
    icon: 'MessageSquare',
    color: 'bg-cyan-500/10 text-cyan-500',
    jsonConfig: '{"systemPrompt": "You are a social media expert...", "temperature": 0.8}',
  },
  {
    id: 'ideas',
    title: 'Content Ideas',
    description: 'Get AI-powered content suggestions',
    icon: 'Lightbulb',
    color: 'bg-yellow-500/10 text-yellow-500',
    jsonConfig: '{"systemPrompt": "You are a creative content strategist...", "temperature": 0.9}',
  },
];


type ViewMode = 'tools' | 'tool-detail';

export default function AIGenerator() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);

  // Tools management (default screen)
  const [viewMode, setViewMode] = useState<ViewMode>('tools');
  const [tools, setTools] = useState<AITool[]>([]);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [showToolDialog, setShowToolDialog] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  
  // Tool form
  const [toolForm, setToolForm] = useState({
    title: '',
    description: '',
    icon: 'Sparkles',
    color: 'bg-primary/10 text-primary',
    jsonConfig: '{}',
  });

  useEffect(() => {
    // Load tools from localStorage or use defaults
    const savedTools = localStorage.getItem('assist_ai_tools');
    if (savedTools) {
      setTools(JSON.parse(savedTools));
    } else {
      setTools(defaultTools);
    }
  }, []);

  const saveTools = (newTools: AITool[]) => {
    setTools(newTools);
    localStorage.setItem('assist_ai_tools', JSON.stringify(newTools));
  };


  const handleToolGenerate = () => {
    if (!selectedTool) return;
    setGenerating(true);
    setTimeout(() => {
      setResult(`Generated ${selectedTool.title} content:\n\n"${prompt}"\n\nThis is a placeholder. Connect to AI Gateway for real generation.`);
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
      jsonConfig: '{}',
    });
    setShowToolDialog(true);
  };

  const handleEditTool = (tool: AITool) => {
    setEditingTool(tool);
    setToolForm({
      title: tool.title,
      description: tool.description,
      icon: tool.icon,
      color: tool.color,
      jsonConfig: tool.jsonConfig,
    });
    setShowToolDialog(true);
  };

  const handleSaveTool = () => {
    if (!toolForm.title) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tool name is required.',
      });
      return;
    }

    // Validate JSON
    try {
      JSON.parse(toolForm.jsonConfig);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid JSON configuration.',
      });
      return;
    }

    if (editingTool) {
      const updated = tools.map(t => 
        t.id === editingTool.id 
          ? { ...t, ...toolForm }
          : t
      );
      saveTools(updated);
      toast({ title: 'Tool Updated', description: 'Tool has been updated successfully.' });
    } else {
      const newTool: AITool = {
        id: `tool-${Date.now()}`,
        ...toolForm,
      };
      saveTools([...tools, newTool]);
      toast({ title: 'Tool Created', description: 'New tool has been created.' });
    }
    setShowToolDialog(false);
  };

  const handleDeleteTool = (toolId: string) => {
    const updated = tools.filter(t => t.id !== toolId);
    saveTools(updated);
    toast({ title: 'Tool Deleted', description: 'Tool has been removed.' });
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied!', description: 'Content copied to clipboard.' });
  };

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              JSON Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-sm overflow-auto">
              {JSON.stringify(JSON.parse(selectedTool.jsonConfig), null, 2)}
            </pre>
          </CardContent>
        </Card>
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

        {/* Tool Dialog */}
        <Dialog open={showToolDialog} onOpenChange={setShowToolDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTool ? 'Edit Tool' : 'Create New Tool'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tool Name *</Label>
                <Input
                  placeholder="Enter tool name..."
                  value={toolForm.title}
                  onChange={(e) => setToolForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Enter tool description..."
                  value={toolForm.description}
                  onChange={(e) => setToolForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select 
                    value={toolForm.icon} 
                    onValueChange={(value) => setToolForm(prev => ({ ...prev, icon: value }))}
                  >
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
                  <Select 
                    value={toolForm.color} 
                    onValueChange={(value) => setToolForm(prev => ({ ...prev, color: value }))}
                  >
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
              <div className="space-y-2">
                <Label>JSON Configuration</Label>
                <Textarea
                  placeholder='{"systemPrompt": "...", "temperature": 0.7}'
                  value={toolForm.jsonConfig}
                  onChange={(e) => setToolForm(prev => ({ ...prev, jsonConfig: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Enter valid JSON for tool configuration</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowToolDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveTool}>
                {editingTool ? 'Update Tool' : 'Create Tool'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // No other view modes.
  return null;
}
