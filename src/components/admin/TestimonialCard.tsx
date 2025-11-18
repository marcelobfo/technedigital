import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Star } from "lucide-react";

interface TestimonialCardProps {
  testimonial: any;
  onEdit: (testimonial: any) => void;
  onDelete: (id: string) => void;
}

export default function TestimonialCard({ testimonial, onEdit, onDelete }: TestimonialCardProps) {
  const statusColors = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
  };

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-4">
          {testimonial.client_photo ? (
            <img
              src={testimonial.client_photo}
              alt={testimonial.client_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold">
              {testimonial.client_name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{testimonial.client_name}</h3>
                <p className="text-sm text-muted-foreground">{testimonial.client_role}</p>
                {testimonial.client_company && (
                  <p className="text-xs text-muted-foreground">{testimonial.client_company}</p>
                )}
              </div>
              <div className="flex gap-2">
                {testimonial.is_featured && (
                  <Badge className="bg-yellow-500">
                    <Star className="h-3 w-3" />
                  </Badge>
                )}
                <Badge className={statusColors[testimonial.status as keyof typeof statusColors]}>
                  {testimonial.status}
                </Badge>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < testimonial.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-4 text-sm text-muted-foreground italic">
          "{testimonial.testimonial_text}"
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(testimonial)}
          className="flex-1"
        >
          <Edit className="mr-2 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(testimonial.id)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
