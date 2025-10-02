import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Story {
  id: string;
  title: string;
  view_count: number;
  created_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [myStories, setMyStories] = useState<Story[]>([]);

  useEffect(() => {
    checkAuth();
    fetchProfile();
    fetchMyStories();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Vui lòng đăng nhập");
      navigate("/auth");
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
    }
  };

  const fetchMyStories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("stories")
      .select("id, title, view_count, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
    } else {
      setMyStories(data || []);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Không tìm thấy người dùng");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Cập nhật thông tin thành công!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Bạn có chắc muốn xóa truyện này?")) return;

    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;

      toast.success("Đã xóa truyện");
      fetchMyStories();
    } catch (error: any) {
      toast.error("Không thể xóa truyện");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">
              Quản Lý Tài Khoản
            </h1>
            <p className="text-muted-foreground">
              Cập nhật thông tin và quản lý truyện của bạn
            </p>
          </div>

          <Card className="p-8 shadow-soft">
            <h2 className="text-2xl font-serif font-semibold mb-6">
              Thông Tin Cá Nhân
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật"
                )}
              </Button>
            </form>
          </Card>

          <Card className="p-8 shadow-soft">
            <h2 className="text-2xl font-serif font-semibold mb-6">
              Truyện Của Tôi ({myStories.length})
            </h2>

            {myStories.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Bạn chưa đăng truyện nào
                </p>
                <Button onClick={() => navigate("/upload")}>
                  Đăng truyện đầu tiên
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myStories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/story/${story.id}`)}
                    >
                      <h3 className="font-semibold mb-1">{story.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {story.view_count} lượt xem • {new Date(story.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Account;
