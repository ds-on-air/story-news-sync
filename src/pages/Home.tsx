import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  view_count: number;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

const Home = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select(`
          *,
          profiles!stories_author_id_fkey (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStories(data as any || []);
    } catch (error: any) {
      toast.error("Không thể tải danh sách truyện");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-serif font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Thư Viện Truyện & Báo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá hàng ngàn câu chuyện thú vị, đọc và nghe mọi lúc mọi nơi
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-80 animate-pulse bg-muted" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground mb-4">
              Chưa có truyện nào
            </p>
            <Button onClick={() => navigate("/upload")}>
              Đăng truyện đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card
                key={story.id}
                className="overflow-hidden cursor-pointer transition-smooth hover:shadow-hover group"
                onClick={() => navigate(`/story/${story.id}`)}
              >
                <div className="aspect-video bg-gradient-card relative overflow-hidden">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-serif font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {story.title}
                  </h3>
                  
                  {story.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {story.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(story.created_at)}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {story.view_count}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Tác giả: {story.profiles?.full_name || "Ẩn danh"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
