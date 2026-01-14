import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicLayout } from '@/components/layout/PublicLayout';

const blogPosts = [
  {
    id: 1,
    title: '5 Ways to Optimize Your Google Business Profile in 2024',
    excerpt: 'Learn the latest strategies to make your GMB listing stand out and attract more local customers.',
    category: 'GMB Tips',
    author: 'Marketing Team',
    date: 'Dec 20, 2024',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'The Small Business Guide to Social Media Content',
    excerpt: 'Discover what content works best for small businesses and how to create it efficiently.',
    category: 'Social Media',
    author: 'Marketing Team',
    date: 'Dec 18, 2024',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'Why Every Business Needs a Simple Website',
    excerpt: 'Even in the age of social media, a website remains your most important digital asset.',
    category: 'Websites',
    author: 'Marketing Team',
    date: 'Dec 15, 2024',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop',
  },
  {
    id: 4,
    title: 'SEO Basics: Getting Found Online Without Breaking the Bank',
    excerpt: 'Simple, practical SEO strategies that any small business can implement today.',
    category: 'SEO',
    author: 'Marketing Team',
    date: 'Dec 12, 2024',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop',
  },
  {
    id: 5,
    title: 'How to Write Blog Posts That Actually Get Read',
    excerpt: 'Tips for creating blog content that engages your audience and ranks well in search.',
    category: 'Content',
    author: 'Marketing Team',
    date: 'Dec 10, 2024',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop',
  },
  {
    id: 6,
    title: 'Working with a Marketing Assist vs Hiring an Agency',
    excerpt: 'Compare the benefits of personal marketing assistance versus traditional agency services.',
    category: 'Business',
    author: 'Marketing Team',
    date: 'Dec 8, 2024',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
  },
];

export default function Blog() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Marketing Tips & <span className="text-gradient">Insights</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical advice to help you grow your business online. No jargon, just helpful tips.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <Card
                key={post.id}
                className="overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit text-xs">
                    {post.category}
                  </Badge>
                  <h3 className="text-xl font-semibold text-foreground mt-2 line-clamp-2">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0">
                    Read More
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Get Marketing Tips in Your Inbox
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join our newsletter for weekly tips on growing your business online.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}