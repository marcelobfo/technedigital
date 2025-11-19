import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';
import { BlogSidebar } from '@/components/blog/BlogSidebar';

export default function Blog() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', selectedCategory, selectedTag],
    queryFn: async () => {
      let query = supabase.from('blog_posts').select('*').eq('status', 'published');
      if (selectedCategory) query = query.eq('category', selectedCategory);
      if (selectedTag) query = query.contains('tags', [selectedTag]);
      const { data, error } = await query.order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-up">
              <h1 className="text-4xl md:text-6xl font-bold">{t('blog.title')}</h1>
              <p className="text-lg md:text-xl text-muted-foreground">{t('blog.subtitle')}</p>
            </div>
          </div>
        </section>

        {isLoading && (
          <section className="py-20">
            <div className="container flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </section>
        )}

        {!isLoading && blogPosts.length > 0 && !selectedCategory && !selectedTag && (
          <section className="py-12 border-b border-border/40">
            <div className="container">
              <div className="max-w-5xl mx-auto">
                <Card className="overflow-hidden hover-lift">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-auto overflow-hidden">
                      <img src={blogPosts[0].cover_image || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop'} alt={blogPosts[0].title} className="w-full h-full object-cover" loading="eager" />
                    </div>
                    <CardContent className="p-8 flex flex-col justify-center space-y-4">
                      <Badge className="w-fit">{blogPosts[0].category}</Badge>
                      <h2 className="text-3xl font-bold">{blogPosts[0].title}</h2>
                      <p className="text-muted-foreground">{blogPosts[0].excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(blogPosts[0].published_at || blogPosts[0].created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Link to={`/blog/${blogPosts[0].slug}`}>
                        <Button className="w-full md:w-auto group">
                          {t('blog.read')}
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        )}

        {!isLoading && (
          <section className="py-20">
            <div className="container">
              <div className="grid lg:grid-cols-[300px_1fr] gap-8">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <BlogSidebar selectedCategory={selectedCategory} selectedTag={selectedTag} onCategorySelect={setSelectedCategory} onTagSelect={setSelectedTag} />
                </aside>
                <div className="space-y-8">
                  {(selectedCategory || selectedTag) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Filtrando por:</span>
                      {selectedCategory && <Badge>{selectedCategory}</Badge>}
                      {selectedTag && <Badge variant="secondary">{selectedTag}</Badge>}
                    </div>
                  )}
                  {blogPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">Nenhum post encontrado com os filtros selecionados.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {(selectedCategory || selectedTag ? blogPosts : blogPosts.slice(1)).map((post, index) => (
                        <Card key={post.id} className="hover-lift overflow-hidden group" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="aspect-video overflow-hidden">
                            <img src={post.cover_image || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop'} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                          </div>
                          <CardContent className="p-6 space-y-4">
                            <Badge variant="secondary">{post.category}</Badge>
                            <h3 className="text-xl font-semibold line-clamp-2">{post.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(post.published_at || post.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <Link to={`/blog/${post.slug}`}>
                              <Button variant="ghost" className="w-full group">
                                {t('blog.read')}
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {!isLoading && blogPosts.length === 0 && !selectedCategory && !selectedTag && (
          <section className="py-20">
            <div className="container text-center">
              <p className="text-lg text-muted-foreground">Nenhum post publicado ainda. Volte em breve!</p>
            </div>
          </section>
        )}

        <NewsletterSubscribe />
      </main>
      <Footer />
    </div>
  );
}
