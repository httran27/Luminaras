import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Trophy } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  image?: string;
}

const categories = ["All", "Events", "Tournaments", "Updates", "Community"];

export default function NewsPage() {
  const { data: newsItems } = useQuery<NewsItem[]>({
    queryKey: ["/api/news"],
  });

  if (!newsItems) return null;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Gaming News & Events</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest in gaming
        </p>
      </div>

      <Tabs defaultValue="All">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsItems
                .filter(
                  (item) =>
                    category === "All" || item.category === category
                )
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image && (
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge>{item.category}</Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {item.category === "Tournaments" && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Trophy className="h-4 w-4 mr-1" />
                          Prize pool available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
