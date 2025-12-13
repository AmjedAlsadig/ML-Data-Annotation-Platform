import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, ArrowLeft, Tag, ImageIcon, Users, Plus, Trash2, AlertCircle, Edit, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  labelTypeId: string | null;
  createdBy: string;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
}

// Updated: Label is now a global label type
interface LabelType {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

// New: Label classes belong to label types
interface LabelClass {
  id: string;
  labelTypeId: string;
  name: string;
  createdAt: string;
}

interface Image {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  published: boolean;
}

interface PortfolioImage extends Image {
  assignedToProject: boolean;
}

interface Assignment {
  id: string;
  projectId: string;
  userId: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// New: Project stats interface
interface ProjectStats {
  numberOfImages: number;
  annotatedImages: number;
  totalAnnotations: number;
  activeAnnotators: number;
}

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params.id || '';
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [labelType, setLabelType] = useState<LabelType | null>(null);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [availableImages, setAvailableImages] = useState<Image[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableAnnotators, setAvailableAnnotators] = useState<User[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Label Type Management State
  const [isLabelTypeDialogOpen, setIsLabelTypeDialogOpen] = useState(false);
  const [availableLabelTypes, setAvailableLabelTypes] = useState<LabelType[]>([]);
  const [selectedNewLabelTypeId, setSelectedNewLabelTypeId] = useState<string>('');
  const [isChangingLabelType, setIsChangingLabelType] = useState(false);

  // Image Assignment State
  const [isImageAssignmentDialogOpen, setIsImageAssignmentDialogOpen] = useState(false);
  // const [availableImages, setAvailableImages] = useState<PortfolioImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [isAssigningImages, setIsAssigningImages] = useState(false);

  // Assignment State
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAnnotatorId, setSelectedAnnotatorId] = useState('');
  const [isAssigningUser, setIsAssigningUser] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

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
      setUser(userData);

      // Fetch project
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to load project');
      }

      const projectData = await projectResponse.json();
      setProject(projectData);

      // Fetch label type if project has one
      if (projectData.labelTypeId) {
        const labelTypeResponse = await fetch(`/api/label-types/${projectData.labelTypeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (labelTypeResponse.ok) {
          const labelTypeData = await labelTypeResponse.json();
          setLabelType(labelTypeData.data);
        }

        // Fetch label classes for this label type
        const labelClassesResponse = await fetch(`/api/label-types/${projectData.labelTypeId}/classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (labelClassesResponse.ok) {
          const labelClassesData = await labelClassesResponse.json();
          setLabelClasses(labelClassesData.data);
        }
      }

      // Fetch images for this project
      const imagesResponse = await fetch(`/api/projects/${projectId}/images`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        setImages(imagesData.data);
      }

      // Fetch assignments
      const assignmentsResponse = await fetch(`/api/projects/${projectId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData);
      }

      // Fetch all annotators
      const annotatorsResponse = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (annotatorsResponse.ok) {
        const annotatorsData = await annotatorsResponse.json();
        setAvailableAnnotators(annotatorsData.filter((u: User) => u.role === 'annotator'));
      }

      // Fetch project stats
      const statsResponse = await fetch(`/api/annotation/project/${projectId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setProjectStats(statsData.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableLabelTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/label-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out the current label type if one is assigned
        const filteredTypes = data.data.filter((type: LabelType) => type.id !== project?.labelTypeId);
        setAvailableLabelTypes(filteredTypes);
      }
    } catch (err) {
      console.error('Failed to fetch label types:', err);
    }
  };

  const fetchAvailableImages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Handle different response structures
        let imagesArray;
        if (Array.isArray(data)) {
          imagesArray = data;
        } else if (data && Array.isArray(data.images)) {
          imagesArray = data.images;
        } else if (data && Array.isArray(data.data)) {
          imagesArray = data.data;
        } else {
          console.warn('Unexpected images response format:', data);
          imagesArray = [];
        }
        setAvailableImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch available images:', err);
    }
  };

  const handleChangeLabelType = async () => {
    if (!selectedNewLabelTypeId || !project) return;

    setIsChangingLabelType(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          labelTypeId: selectedNewLabelTypeId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change label type');
      }

      toast({
        title: 'Success',
        description: 'Project label type updated successfully',
      });

      // Reset and reload data
      setSelectedNewLabelTypeId('');
      setIsLabelTypeDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to change label type',
        variant: 'destructive',
      });
    } finally {
      setIsChangingLabelType(false);
    }
  };

  const handleAssignLabelType = async () => {
    if (!selectedNewLabelTypeId || !project) return;

    setIsChangingLabelType(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          labelTypeId: selectedNewLabelTypeId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign label type');
      }

      toast({
        title: 'Success',
        description: 'Label type assigned to project successfully',
      });

      // Reset and reload data
      setSelectedNewLabelTypeId('');
      setIsLabelTypeDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign label type',
        variant: 'destructive',
      });
    } finally {
      setIsChangingLabelType(false);
    }
  };

  const handleAssignImages = async () => {
    if (selectedImageIds.length === 0 || !project) return;

    setIsAssigningImages(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/projects/${project.id}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageIds: selectedImageIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign images');
      }

      toast({
        title: 'Success',
        description: `${selectedImageIds.length} images assigned to project successfully`,
      });

      // Reset and reload data
      setSelectedImageIds([]);
      setIsImageAssignmentDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign images',
        variant: 'destructive',
      });
    } finally {
      setIsAssigningImages(false);
    }
  };

  const handleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleBack = () => {
    setLocation('/specialist/dashboard');
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

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      //  /api/projects/:id/images
      const response = await fetch(`/api/projects/${projectId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      setImages(images.filter(img => img.id !== imageId));

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublished = async (imageId: string, currentPublishedState: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const newPublishedState = !currentPublishedState;

      const response = await fetch(`/api/projects/${projectId}/images/${imageId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          published: newPublishedState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update published state');
      }

      // Update local state
      setImages(images.map(img =>
        img.id === imageId
          ? { ...img, published: newPublishedState }
          : img
      ));

      toast({
        title: 'Success',
        description: `Image ${newPublishedState ? 'published' : 'unpublished'} successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update published state',
        variant: 'destructive',
      });
    }
  };

  const handleAssignAnnotator = async () => {
    if (!selectedAnnotatorId) {
      toast({
        title: 'Error',
        description: 'Please select an annotator',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigningUser(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedAnnotatorId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign annotator');
      }

      const newAssignment = await response.json();

      // Find the user details
      const assignedUser = availableAnnotators.find(u => u.id === selectedAnnotatorId);

      setAssignments([
        ...assignments,
        {
          ...newAssignment,
          user: assignedUser ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email,
          } : undefined,
        },
      ]);

      setSelectedAnnotatorId('');
      setIsAssignDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Annotator assigned successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign annotator',
        variant: 'destructive',
      });
    } finally {
      setIsAssigningUser(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      setAssignments(assignments.filter(a => a.id !== assignmentId));

      toast({
        title: 'Success',
        description: 'Assignment removed successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove assignment',
        variant: 'destructive',
      });
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

  // Filter out already assigned annotators
  const unassignedAnnotators = availableAnnotators.filter(
    annotator => !assignments.some(a => a.userId === annotator.id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
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
          {/* Back Button & Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Project Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{project?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project?.description || 'No description'}
            </p>
            {labelType && (
              <p className="text-sm text-muted-foreground mt-1">
                Label Type: <span className="font-medium">{labelType.name}</span>
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">Number Of Images</CardDescription>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{projectStats?.numberOfImages || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">annotatedImages</CardDescription>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{projectStats?.annotatedImages || 0}</div>
              </CardContent>
            </Card>



            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">Annotators</CardDescription>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{projectStats?.activeAnnotators || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="label-classes" className="w-full">
            <TabsList>
              <TabsTrigger value="label-classes">Label Classes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="annotators">Annotators</TabsTrigger>
            </TabsList>

            {/* Label Classes Tab */}
            <TabsContent value="label-classes" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Label Classes {labelType && `for ${labelType.name}`}
                </h3>

              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {labelClasses.length === 0 ? (
                      <p className="p-4 text-muted-foreground text-center">
                        {project?.labelTypeId
                          ? "No label classes defined for this label type."
                          : "This project doesn't have a label type assigned yet."}
                      </p>
                    ) : (
                      labelClasses.map((labelClass) => (
                        <div key={labelClass.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <span className="font-medium">{labelClass.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Project Images ({images.length})</h3>
                <Dialog open={isImageAssignmentDialogOpen} onOpenChange={(open) => {
                  setIsImageAssignmentDialogOpen(open);
                  if (open) {
                    fetchAvailableImages();
                    setSelectedImageIds([]);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-assign-images">
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Images
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>Assign Images to Project</DialogTitle>
                      <DialogDescription>
                        Select images from your portfolio to assign to this project. ({selectedImageIds.length} selected)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {availableImages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No unassigned images available in your portfolio.
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
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAssignImages}
                        disabled={selectedImageIds.length === 0 || isAssigningImages}
                        data-testid="button-submit-image-assignment"
                      >
                        {isAssigningImages ? 'Assigning...' : `Assign ${selectedImageIds.length} Images`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.length === 0 ? (
                  <Card className="col-span-full p-12 text-center">
                    <CardContent>
                      <p className="text-muted-foreground">No images assigned to this project yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  images.map((image) => (
                    <Card key={image.id} className="relative group overflow-hidden">
                      {/* Published Badge */}
                      {image.published && (
                        <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Published
                        </div>
                      )}

                      {/* Image */}
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Delete Button Overlay (only if not published) */}
                      {!image.published && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteImage(image.id)}
                            data-testid={`button-delete-image-${image.id}`}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Annotators Tab */}
            <TabsContent value="annotators" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Assigned Annotators ({assignments.length})</h3>
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-assign-annotator">
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Annotator
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Annotator</DialogTitle>
                      <DialogDescription>
                        Select an annotator to assign to this project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="annotator-select">Annotator</Label>
                        <Select
                          value={selectedAnnotatorId}
                          onValueChange={setSelectedAnnotatorId}
                          disabled={unassignedAnnotators.length === 0}
                        >
                          <SelectTrigger id="annotator-select" data-testid="select-annotator">
                            <SelectValue placeholder={unassignedAnnotators.length > 0 ? "Select an annotator" : "No unassigned annotators"} />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedAnnotators.map((annotator) => (
                              <SelectItem key={annotator.id} value={annotator.id}>
                                {annotator.name} ({annotator.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleAssignAnnotator}
                          disabled={!selectedAnnotatorId || isAssigningUser}
                          data-testid="button-submit-assign"
                        >
                          {isAssigningUser ? 'Assigning...' : 'Assign'}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {assignments.length === 0 ? (
                      <p className="p-4 text-muted-foreground text-center">No annotators assigned to this project.</p>
                    ) : (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                {assignment.user ? getUserInitials(assignment.user.name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{assignment.user?.name}</p>
                              <p className="text-sm text-muted-foreground">{assignment.user?.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            data-testid={`button-delete-assignment-${assignment.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}