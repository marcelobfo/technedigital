import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Star } from "lucide-react";

interface ServiceCardProps {
  service: any;
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
}

export default function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const statusColors = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
  };

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center justify-between">
              {service.icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-2xl">{service.icon}</span>
                </div>
              )}
              <div className="flex gap-2">
                {service.is_featured && (
                  <Badge className="bg-yellow-500">
                    <Star className="mr-1 h-3 w-3" />
                    Destaque
                  </Badge>
                )}
                <Badge className={statusColors[service.status as keyof typeof statusColors]}>
                  {service.status}
                </Badge>
              </div>
            </div>
            <h3 className="font-semibold">{service.title}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {service.short_description}
        </p>
        
        {service.features && service.features.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recursos:</p>
            <ul className="space-y-1">
              {service.features.slice(0, 3).map((feature: string, index: number) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start">
                  <span className="mr-2">•</span>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(service)}
          className="flex-1"
        >
          <Edit className="mr-2 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(service.id)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
