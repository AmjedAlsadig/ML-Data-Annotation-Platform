import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Plus, Upload, X, FolderPlus, AlertCircle, Image, Tags, CheckCircle2, FeatherIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LabelManager from '@/components/LabelManager';
import PortfolioUpload from '@/components/PortfolioUpload';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { images } from '@shared/schema';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  labelTypeId: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
  numberOfImages: number;
  annotatedImages: number;
  totalAnnotations: number;
  activeAnnotators: number;
}

interface LabelType {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  classCount?: number; // From getAllLabelTypes
}

interface Image {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  // Note: assignedToProject needs to be calculated since it's not in the schema
}

interface PortfolioImage extends Image {
  assignedToProject: boolean; // This will be calculated
  projectName?: string;
  projectId?: string;
  isAnnotated?: boolean;
}

export default function SpecialistDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('projects');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [labelTypes, setLabelTypes] = useState<LabelType[]>([]);
  const [availableImages, setAvailableImages] = useState<Image[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [selectedLabelTypeId, setSelectedLabelTypeId] = useState<string>('');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  // Portfolio stats state
  const [portfolioStats, setPortfolioStats] = useState<{
    totalImages: number;
    totalProjects: number;
    annotatedImages: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // spriječi otvaranje projekta
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete project");
        return;
      }

      // Reload
      await loadData();

      toast({
        title: "Project deleted",
        description: "The project was successfully removed."
      });

    } catch (err) {
      console.error(err);
      alert("Error deleting project.");
    }
  };

  const loadPortfolioStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/portfolio/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load portfolio stats:', err);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
    localStorage.removeItem('authToken');
    setLocation('/login');
  };

  const fetchLabelTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/label-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Label types response:', data.daata); // Debug log
      setLabelTypes(data.data);
      if (response.ok) {
        // Handle different response structures
        let typesArray;
        if (Array.isArray(data)) {
          typesArray = data;
        } else if (data && Array.isArray(data.data)) {
          typesArray = data.data;
        } else {
          console.warn('Unexpected label types response format:', data);
          typesArray = [];
        }
        setLabelTypes(typesArray);
      }
    } catch (err) {
      console.error('Failed to fetch label types:', err);
    }
  };

  const fetchPortfolioImages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/portfolio/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }
      console.log('response: ' + response)
      const dataRes = await response.json();
      console.log('Portfolio images response:', dataRes); // Debug log
      setPortfolioImages(dataRes);
      // const data = dataRes.data;

      // // Handle different response structures
      // let imagesArray;
      // if (Array.isArray(data)) {
      //   imagesArray = data;
      // } else if (data && Array.isArray(data.images)) {
      //   imagesArray = data.images;
      // } else if (data && Array.isArray(data.data)) {
      //   imagesArray = data.data;
      // } else {
      //   console.warn('Unexpected portfolio images response format:', data);
      //   imagesArray = [];
      // }
      // console.log('imagesArray: '+imagesArray)

      // // Get project images to determine which images are already assigned
      // const projectsResponse = await fetch('/api/projects', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });

      // let projectImages: string[] = [];
      // if (projectsResponse.ok) {
      //   const projectsData = await projectsResponse.json();
      //   // For each project, fetch its images to build a set of assigned image IDs
      //   for (const project of projectsData) {
      //     const projectImagesResponse = await fetch(`/api/projects/${project.id}/images`, {
      //       headers: {
      //         'Authorization': `Bearer ${token}`,
      //       },
      //     });
      //     if (projectImagesResponse.ok) {
      //       const projectImagesData = await projectImagesResponse.json();
      //       const assignedIds = projectImagesData.map((img: Image) => img.id);
      //       projectImages = [...projectImages, ...assignedIds];
      //     }
      //   }
      // }

      // // Convert to PortfolioImage with assignedToProject calculated
      // const portfolioImagesWithAssignment: PortfolioImage[] = imagesArray.map((image: Image) => ({
      //   ...image,
      //   assignedToProject: projectImages.includes(image.id)
      // }));

      // setPortfolioImages(portfolioImagesWithAssignment);

    } catch (err) {
      console.error('Failed to fetch portfolio images:', err);
    }
  };

  // /api/annotation/project/:projectId/stats
  const fetchProjectStats = async (projectId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/annotation/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // console.log('Label types response:', data.daata); // Debug log
      // setLabelTypes(data.data);
      // if (response.ok) {
      //   // Handle different response structures
      //   let typesArray;
      //   if (Array.isArray(data)) {
      //     typesArray = data;
      //   } else if (data && Array.isArray(data.data)) {
      //     typesArray = data.data;
      //   } else {
      //     console.warn('Unexpected label types response format:', data);
      //     typesArray = [];
      //   }
      //   setLabelTypes(typesArray);
      // }
    } catch (err) {
      console.error('Failed to fetch label types:', err);
    }
  };

  const fetchavailableImages = async () => {
    try {
      console.log('fetchavailableImages...');
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });


      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }
      console.log('response: ' + response)
      const data = await response.json();
      console.log('available images response:', data); // Debug log
      setAvailableImages(data);


    } catch (err) {
      console.error('Failed to fetch portfolio images:', err);
    }
  };
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch current user
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLocation('/login');
        return;
      }

      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

      // Fetch projects
      const projectsResponse = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('Projects response:', projectsData); // Debug log

        // Handle different response structures
        let projectsArray;
        if (Array.isArray(projectsData)) {
          projectsArray = projectsData;
        } else if (projectsData && Array.isArray(projectsData.data)) {
          projectsArray = projectsData.data;
        } else {
          console.warn('Unexpected projects response format:', projectsData);
          projectsArray = [];
        }

        setProjects(projectsArray);
      }

      // Fetch supporting data
      await fetchLabelTypes();
      await fetchPortfolioImages();
      await fetchavailableImages();
      await loadPortfolioStats();
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedLabelTypeId || selectedImageIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields, select a Label Type, and assign at least one image.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Create project
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription || null,
          labelTypeId: selectedLabelTypeId,
          status: 'not_started',
        }),
      });

      if (!projectResponse.ok) {
        const data = await projectResponse.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await projectResponse.json();

      // 2. Assign images from portfolio
      const assignResponse = await fetch(`/api/projects/${project.id}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageIds: selectedImageIds,
        }),
      });

      if (!assignResponse.ok) {
        const data = await assignResponse.json();
        console.error('Failed to assign images:', data.error);
      }

      toast({
        title: 'Success',
        description: `Project "${projectName}" created and ${selectedImageIds.length} images assigned!`,
      });

      // Reset form
      setIsCreateDialogOpen(false);
      setProjectName('');
      setProjectDescription('');
      setSelectedLabelTypeId('');
      setSelectedImageIds([]);

      // Reload projects and images
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalImages = portfolioStats?.totalImages || portfolioImages.length;
  const annotatedImages = portfolioStats?.annotatedImages || 0;
  const annotationProgress = totalImages > 0 ? Math.round((annotatedImages / totalImages) * 100) : 0;

  // Filter unassigned images for project creation
  // const unassignedImages = availableImages.filter(img => img.assignedToProject);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
              </svg>
            </div>
            <span className="text-lg font-semibold">VT-Annotator</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/specialist/portfolio')}
              className="gap-2"
              data-testid="button-portfolio-nav"
            >
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => setLocation('/profile')}>
              <span className="text-sm text-muted-foreground hidden sm:inline">Hello</span>
              <span className="text-sm font-medium">{user?.name}</span>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getUserInitials(user.name) : 'DS'}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold mb-2">Welcome {user?.name}</h1>
              <p className="text-muted-foreground">Manage your annotation projects and datasets</p>
            </div>

            <TabsList className="grid w-full grid-cols-3 my-6">
              <TabsTrigger value="projects" data-testid="tab-projects">
                <FolderPlus className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="portfolio" data-testid="tab-portfolio">
                <Image className="w-4 h-4 mr-2" />
                Image Portfolio
              </TabsTrigger>
              <TabsTrigger value="labels" data-testid="tab-labels">
                <Tags className="w-4 h-4 mr-2" />
                Label Management
              </TabsTrigger>
            </TabsList>

            {/* Projects Tab Content */}
            <TabsContent value="projects" className="space-y-8">
              <div className="flex justify-end">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-create-project">
                      <FolderPlus className="w-4 h-4" />
                      Create Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Set up a new annotation project by selecting a Label Type and assigning images from your portfolio.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }} className="space-y-6 py-4 max-h-[90vh] overflow-y-auto">
                      {/* Project Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                              id="project-name"
                              placeholder="e.g., Dog Breed Classification"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              disabled={isCreating}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="project-description">Description (optional)</Label>
                            <Input
                              id="project-description"
                              placeholder="e.g., Dataset for identifying dog breeds"
                              value={projectDescription}
                              onChange={(e) => setProjectDescription(e.target.value)}
                              disabled={isCreating}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="label-type">Assign Label Type</Label>
                            <Select
                              value={selectedLabelTypeId}
                              onValueChange={setSelectedLabelTypeId}
                              disabled={isCreating || labelTypes.length === 0}
                              required
                            >
                              <SelectTrigger id="label-type">
                                <SelectValue placeholder={labelTypes.length > 0 ? "Select a pre-defined Label Type" : "No Label Types available. Create one first."} />
                              </SelectTrigger>
                              <SelectContent>
                                {labelTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Image Selection */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Select Images to Assign</CardTitle>
                          <CardDescription>
                            Select unassigned images from your portfolio. ({selectedImageIds.length} selected)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {availableImages.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No unassigned images in your portfolio. Upload some first!
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-4 max-h-64 overflow-y-auto p-2 border rounded-md">
                              {availableImages.map((image) => (
                                <div
                                  key={image.id}
                                  className={`relative aspect-square cursor-pointer border-2 rounded-md overflow-hidden transition-all ${selectedImageIds.includes(image.id)
                                    ? 'border-primary ring-2 ring-primary'
                                    : 'border-transparent hover:border-muted-foreground/50'
                                    }`}
                                  onClick={() => handleImageSelection(image.id)}
                                >
                                  <img
                                    src={image.url}
                                    alt={image.filename}
                                    className="w-full h-full object-cover"
                                  />
                                  {selectedImageIds.includes(image.id) && (
                                    <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                                      <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <DialogFooter>
                        <Button type="submit" disabled={isCreating} data-testid="button-submit-create-project">
                          {isCreating ? 'Creating...' : 'Create Project'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-sm font-medium">Total Projects</CardDescription>
                      <FolderPlus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{projects.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-sm font-medium">Total Images</CardDescription>
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalImages}</div>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-xs"
                      onClick={() => setActiveTab('portfolio')}
                      data-testid="link-view-portfolio"
                    >
                      View Portfolio
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-sm font-medium">Annotation Progress</CardDescription>
                      <Tags className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{annotationProgress}%</div>
                    <div className="text-sm text-muted-foreground">
                      {annotatedImages} of {totalImages} images annotated
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project List */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Project List</h3>
                {projects.length === 0 ? (
                  <Card className="p-12 text-center">
                    <CardContent>
                      <p className="text-muted-foreground">No projects created yet. Click "Create Project" to start.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                      let projectProgress;
                      if (project.numberOfImages > 0) {
                        projectProgress = parseFloat((((project.annotatedImages / project.numberOfImages) * 100)).toFixed(1));
                      } else {
                        projectProgress = 0;
                      }

                      return (
                        <Card key={project.id} className="hover-elevate cursor-pointer" onClick={() => setLocation(`/specialist/projects/${project.id}`)} data-testid={`card-project-${project.id}`}>
                          <CardHeader className="space-y-1">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-xl">{project.name}</CardTitle>
                              <Badge variant={getStatusBadgeVariant(project.status)}>{
                                projectProgress === 100 ? 'Completed' : (projectProgress > 0 ? "In Progress" : 'Not Started')
                              }</Badge>
                            </div>
                            <CardDescription>
                              Created: {new Date(project.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                              {project.description || 'No description'}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress:</span>
                              <span className="font-medium">{projectProgress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${projectProgress}%` }}></div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button variant="destructive" size="sm" onClick={(e) => handleDeleteProject(project.id, e)} >
                              Delete
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Portfolio Tab Content */}
            <TabsContent value="portfolio" className="space-y-8">
              <PortfolioUpload onUploadSuccess={loadData} />
              <div className="mt-8">
                <Button
                  variant="outline"
                  onClick={() => setLocation('/specialist/portfolio')}
                  data-testid="button-view-full-portfolio"
                >
                  View Full Image Portfolio
                </Button>
              </div>
            </TabsContent>

            {/* Label Management Tab Content */}
            <TabsContent value="labels" className="space-y-8">
              <LabelManager labelTypes={labelTypes} onLabelTypeChange={fetchLabelTypes} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}