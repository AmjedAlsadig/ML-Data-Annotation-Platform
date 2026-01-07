import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LogOut,
  ArrowLeft,
  Image as ImageIcon,
  Folder,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PortfolioImageCard } from '@/components/PortfolioImageCard';
import { usePortfolio } from '@/hooks/usePortfolio';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
}

export default function ImagePortfolio() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const {
    data,
    isLoading: isPortfolioLoading,
    error: portfolioError,
    filters,
    updateFilters,
    deleteImage,
    loadMore,
  } = usePortfolio();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsUserLoading(true);
      setUserError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setLocation('/login');
        return;
      }

      const userResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userResponse.ok) {
        setLocation('/login');
        return;
      }

      const userData = await userResponse.json();

      if (userData.role !== 'data_specialist') {
        setLocation('/annotator/dashboard');
        return;
      }

      setUser(userData);

      const projectsResponse = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectsResponse.ok) {
        setProjects(await projectsResponse.json());
      }
    } catch (err: any) {
      setUserError(err.message || 'Failed to load data');
      toast({
        title: 'Error',
        description: 'Failed to load user data.',
        variant: 'destructive',
      });
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem('authToken');
    setLocation('/login');
  };

  const handleNavigateToProject = (projectId: string) => {
    setLocation(`/specialist/projects/${projectId}`);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    await deleteImage(imageId);
  };

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const isLoading = isUserLoading || isPortfolioLoading;
  const error = userError || portfolioError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
              </svg>
            </div>
            <span className="text-lg font-semibold">VT-Annotator</span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => setLocation('/profile')}
            >
              <span className="text-sm text-muted-foreground hidden sm:inline">Hello</span>
              <span className="text-sm font-medium">{user?.name}</span>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'DS'}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/specialist/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <Filter className="w-4 h-4" />

          {/* PROJECT FILTER */}
          <Select
            value={filters.projectId || 'all'}
            onValueChange={(v) =>
              updateFilters({ projectId: v === 'all' ? undefined : v })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* SORT FILTER (STAROST / NAZIV) */}
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as any;
              updateFilters({ sortBy, sortOrder });
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uploadedAt-desc">Newest First</SelectItem>
              <SelectItem value="uploadedAt-asc">Oldest First</SelectItem>
              <SelectItem value="projectName-asc">Project A–Z</SelectItem>
              <SelectItem value="projectName-desc">Project Z–A</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline">{data?.total || 0} images</Badge>
        </div>

        {/* Gallery */}
        {data?.images.length === 0 ? (
          <Card className="p-12 text-center">
            <CardTitle>No Images Found</CardTitle>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {data?.images.map((image) => (
              <PortfolioImageCard
                key={image.id}
                image={image}
                onDelete={handleDeleteImage}
                onNavigateToProject={handleNavigateToProject}
              />
            ))}
          </div>
        )}

        {data && data.images.length < data.total && (
          <div className="text-center">
            <Button variant="outline" onClick={loadMore}>
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
