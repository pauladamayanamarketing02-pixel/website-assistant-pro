import { useState } from 'react';
import { 
  Sparkles, FileText, User, Users, PenTool, Image, 
  MessageSquare, Lightbulb, ArrowRight, ArrowLeft, Copy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const aiTools: AITool[] = [
  {
    id: 'bkb',
    title: 'Business Knowledge Base',
    description: 'Generate comprehensive business documentation',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'be',
    title: 'Brand Expert',
    description: 'Create brand voice and messaging guidelines',
    icon: User,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    id: 'persona',
    title: 'Customer Persona',
    description: 'Build detailed customer personas',
    icon: Users,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    id: 'blog',
    title: 'Content Blogs',
    description: 'Generate SEO-optimized blog content',
    icon: PenTool,
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    id: 'image',
    title: 'Generate Images',
    description: 'Create AI-powered visuals for your brand',
    icon: Image,
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    id: 'social',
    title: 'Social Media Posts',
    description: 'Generate engaging social media content',
    icon: MessageSquare,
    color: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    id: 'ideas',
    title: 'Content Ideas',
    description: 'Get AI-powered content suggestions',
    icon: Lightbulb,
    color: 'bg-yellow-500/10 text-yellow-500',
  },
];

export default function AICreation() {
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a prompt',
      });
      return;
    }

    setGenerating(true);
    // Simulate AI generation - in production, this would call an AI API
    setTimeout(() => {
      setResult(`Generated ${selectedTool?.title} content based on your prompt:\n\n"${prompt}"\n\nThis is a placeholder for AI-generated content. Connect to an AI service to enable real generation.`);
      setGenerating(false);
      toast({
        title: 'Generated!',
        description: 'Your content has been generated successfully.',
      });
    }, 2000);
  };

  const handleBack = () => {
    setSelectedTool(null);
    setPrompt('');
    setResult('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied!', description: 'Content copied to clipboard' });
  };

  // Full page tool view
  if (selectedTool) {
    const ToolIcon = selectedTool.icon;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${selectedTool.color}`}>
              <ToolIcon className="h-6 w-6" />
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
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={generating}
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
                  <Button variant="outline" className="w-full" onClick={handleCopy}>
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

  // Tool selection grid view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Creation
        </h1>
        <p className="text-muted-foreground">Create content with AI-powered tools</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((tool) => (
          <Card 
            key={tool.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary/50"
            onClick={() => {
              setSelectedTool(tool);
              setPrompt('');
              setResult('');
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${tool.color}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}