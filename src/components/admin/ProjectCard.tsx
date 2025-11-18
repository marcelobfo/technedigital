import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Star } from "lucide-react";

interface ProjectCardProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const statusColors = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {project.cover_image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={project.cover_image}
            alt={project.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            {project.is_featured && (
              <Badge className="bg-yellow-500">
                <Star className="mr-1 h-3 w-3" />
                Destaque
              </Badge>
            )}
            <Badge className={statusColors[project.status as keyof typeof statusColors]}>
              {project.status}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {project.client_name && (
              <Badge variant="outline" className="mb-2">
                {project.client_name}
              </Badge>
            )}
            <h3 className="line-clamp-2 font-semibold">{project.title}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {project.description}
        </p>
        
        {project.technologies && project.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {project.technologies.slice(0, 4).map((tech: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(project)}
          className="flex-1"
        >
          <Edit className="mr-2 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(project.id)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
