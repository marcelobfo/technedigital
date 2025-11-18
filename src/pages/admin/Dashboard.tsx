import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Briefcase, MessageSquare, Users } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    projects: 0,
    testimonials: 0,
    newLeads: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [postsData, projectsData, testimonialsData, leadsData] = await Promise.all([
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('portfolio_projects').select('id', { count: 'exact', head: true }),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]);

    setStats({
      posts: postsData.count || 0,
      projects: projectsData.count || 0,
      testimonials: testimonialsData.count || 0,
      newLeads: leadsData.count || 0,
    });
  };

  const cards = [
    { title: 'Posts Publicados', value: stats.posts, icon: FileText, color: 'text-blue-600' },
    { title: 'Projetos', value: stats.projects, icon: Briefcase, color: 'text-purple-600' },
    { title: 'Depoimentos', value: stats.testimonials, icon: MessageSquare, color: 'text-green-600' },
    { title: 'Leads Novos', value: stats.newLeads, icon: Users, color: 'text-orange-600' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
