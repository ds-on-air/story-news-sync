import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  cover_image_url: string | null;
  audio_url: string | null;
  audio_status: string;
  view_count: number;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    if (id) {
      fetchStory();
      incrementViewCount();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      audio.pause();
    };
  }, [audio]);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select(`
          *,
          profiles!stories_author_id_fkey (full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setStory(data as any);

      if (data.audio_url) {
        audio.src = data.audio_url;
        audio.onended = () => setIsPlaying(false);
      }
    } catch (error: any) {
      toast.error("Không thể tải truyện");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("view_count")
        .eq("id", id)
        .single();

      if (!error && data) {
        await supabase
          .from("stories")
          .update({ view_count: data.view_count + 1 })
          .eq("id", id);
      }
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12">
          <Card className="h-96 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <article className="max-w-4xl mx-auto">
          {story.cover_image_url && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8 shadow-soft">
              <img
                src={story.cover_image_url}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              {story.title}
            </h1>

            {story.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {story.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span>Tác giả: {story.profiles?.full_name || "Ẩn danh"}</span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDate(story.created_at)}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {story.view_count} lượt xem
              </span>
            </div>

            {story.audio_url && story.audio_status === "completed" && (
              <Card className="p-6 mb-8 bg-gradient-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">Nghe Audio</h3>
                    <p className="text-sm text-muted-foreground">
                      Nghe truyện dưới dạng audio
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={toggleAudio}
                    className="rounded-full w-14 h-14"
                  >
                    {isPlaying ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <Card className="p-8 md:p-12 shadow-soft">
            <div 
              className="prose prose-lg max-w-none"
              style={{
                lineHeight: "1.8",
                fontSize: "1.125rem",
              }}
            >
              {story.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        </article>
      </main>
    </div>
  );
};

export default StoryDetail;
