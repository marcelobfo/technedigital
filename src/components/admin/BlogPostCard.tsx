import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlogPostCardProps {
  post: any;
  onEdit: (post: any) => void;
  onDelete: (id: string) => void;
}

export default function BlogPostCard({ post, onEdit, onDelete }: BlogPostCardProps) {
  const statusColors = {
    draft: "bg-yellow-500",
    published: "bg-green-500",
    archived: "bg-gray-500",
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {post.cover_image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute right-2 top-2">
            <Badge className={statusColors[post.status as keyof typeof statusColors]}>
              {post.status}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2">
              {post.category}
            </Badge>
            <h3 className="line-clamp-2 font-semibold">{post.title}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {post.excerpt || post.content?.substring(0, 150)}
        </p>
        
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(post.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(post)}
          className="flex-1"
        >
          <Edit className="mr-2 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(post.id)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
