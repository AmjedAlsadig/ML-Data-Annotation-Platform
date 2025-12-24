import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
}

interface LabelType {
  id: string;
  name: string;
  description: string | null;
}

interface LabelClass {
  id: string;
  name: string;
  labelTypeId: string;
}

interface Image {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  published: boolean;
}

interface Annotation {
  id: string;
  imageId: string;
  labelClassesId: string;
  userId: string;
  projectId: string;
}

export default function AnnotationInterface() {
  const params = useParams();
  const projectId = params.id || '';
  const [, setLocation] = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [labelType, setLabelType] = useState<LabelType | null>(null);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedLabelClassId, setSelectedLabelClassId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user
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
      console.log('Project data:', projectData);
      setProject(projectData);

      // If project has a label type, fetch the label type and its classes
      if (projectData.labelTypeId) {
        await fetchLabelTypeAndClasses(projectData.labelTypeId);
      } else {
        console.warn('Project has no label type assigned');
        setLabelClasses([]);
      }

      // Fetch images for this project
      const imagesResponse = await fetch(`/api/projects/${projectId}/images`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!imagesResponse.ok) {
        throw new Error(`Failed to load images: ${imagesResponse.status}`);
      }

      const imagesData = await imagesResponse.json();
      console.log('Images data:', imagesData);

      // Handle different response structures
      let imagesArray;
      if (Array.isArray(imagesData)) {
        imagesArray = imagesData;
      } else if (imagesData && Array.isArray(imagesData.data)) {
        imagesArray = imagesData.data;
      } else if (imagesData && Array.isArray(imagesData.images)) {
        imagesArray = imagesData.images;
      } else {
        console.warn('Unexpected images response format:', imagesData);
        imagesArray = [];
      }

      setImages(imagesArray);

      // Load annotations for current image if there are images
      if (imagesArray.length > 0) {
        await loadAnnotations(imagesArray[0].id);
      }
    } catch (err: any) {
      console.error('Load data error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLabelTypeAndClasses = async (labelTypeId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Fetch label type details
      const labelTypeResponse = await fetch(`/api/label-types/${labelTypeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (labelTypeResponse.ok) {
        const labelTypeData = await labelTypeResponse.json();
        console.log('Label type data:', labelTypeData);

        // Handle different response structures
        let labelTypeObj;
        if (labelTypeData && labelTypeData.id) {
          labelTypeObj = labelTypeData;
        } else if (labelTypeData && labelTypeData.data) {
          labelTypeObj = labelTypeData.data;
        } else {
          console.warn('Unexpected label type response format:', labelTypeData);
          labelTypeObj = null;
        }
        setLabelType(labelTypeObj);
      }

      console.log(labelTypeId)
      // Fetch label classes for this label type
      const labelClassesResponse = await fetch(`/api/label-types/${labelTypeId}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (labelClassesResponse.ok) {
        const labelClassesData = await labelClassesResponse.json();
        console.log('Label classes data:', labelClassesData.data);

        // Handle different response structures
        let classesArray;
        if (Array.isArray(labelClassesData)) {
          classesArray = labelClassesData;
        } else if (labelClassesData && Array.isArray(labelClassesData.data)) {
          classesArray = labelClassesData.data;
        } else if (labelClassesData && Array.isArray(labelClassesData.classes)) {
          classesArray = labelClassesData.classes;
        } else {
          console.warn('Unexpected label classes response format:', labelClassesData);
          classesArray = [];
        }
        setLabelClasses(classesArray);
      } else {
        console.error('Failed to fetch label classes:', labelClassesResponse.status);
        setLabelClasses([]);
      }
    } catch (err) {
      console.error('Error fetching label type and classes:', err);
      setLabelClasses([]);
    }
  };

  const loadAnnotations = async (imageId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/images/${imageId}/annotations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(`No annotations found for image ${imageId}:`, response.status);
        setAnnotations([]);
        setSelectedLabelClassId(null);
        return;
      }

      const data = await response.json();
      console.log('Annotations data:', data);

      // Handle different response structures
      let annotationsArray;
      if (Array.isArray(data)) {
        annotationsArray = data;
      } else if (data && Array.isArray(data.data)) {
        annotationsArray = data.data;
      } else if (data && Array.isArray(data.annotations)) {
        annotationsArray = data.annotations;
      } else {
        console.warn('Unexpected annotations response format:', data);
        annotationsArray = [];
      }

      setAnnotations(annotationsArray);

      // If there's an existing annotation, pre-select it
      if (annotationsArray.length > 0) {
        setSelectedLabelClassId(annotationsArray[0].labelClassesId);
      } else {
        setSelectedLabelClassId(null);
      }
    } catch (err) {
      console.error('Failed to load annotations:', err);
      setAnnotations([]);
      setSelectedLabelClassId(null);
    }
  };

  const handleBack = () => {
    setLocation('/annotator/dashboard');
  };

  const handleLabelSelect = (labelClassId: string) => {
    setSelectedLabelClassId(labelClassId);
  };

  const handleSaveAndNext = async () => {
    if (!selectedLabelClassId || !user || !project) return;

    const currentImage = images[currentImageIndex];
    if (!currentImage) return;

    setIsSaving(true);
    setError(null);

    try {
      // Create annotation
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          imageId: currentImage.id,
          labelClassesId: selectedLabelClassId,
          labelId: labelType?.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Annotation save error:', errorText);
        let errorMessage = 'Failed to save annotation';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const annotationData = await response.json();
      console.log('Annotation saved:', annotationData);

      // Move to next image
      if (currentImageIndex < images.length - 1) {
        const nextIndex = currentImageIndex + 1;
        setCurrentImageIndex(nextIndex);
        setSelectedLabelClassId(null);
        await loadAnnotations(images[nextIndex].id);
      } else {
        alert('Annotation complete! All images have been annotated.');
        setLocation('/annotator/dashboard');
      }
    } catch (err: any) {
      console.error('Save annotation error:', err);
      setError(err.message || 'Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevious = async () => {
    if (currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setSelectedLabelClassId(null);
      await loadAnnotations(images[prevIndex].id);
    }
  };

  const handlePublish = async () => {
    if (!user || !project) return;

    const currentImage = images[currentImageIndex];
    if (!currentImage) return;

    if (currentImage.published) {
      // Already published, just move to next
      if (currentImageIndex < images.length - 1) {
        const nextIndex = currentImageIndex + 1;
        setCurrentImageIndex(nextIndex);
        setSelectedLabelClassId(null);
        await loadAnnotations(images[nextIndex].id);
      } else {
        alert('All images have been reviewed!');
        setLocation('/annotator/dashboard');
      }
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // First, save the annotation if a label is selected
      if (selectedLabelClassId && labelType?.id) {
        const annotationResponse = await fetch('/api/annotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: project.id,
            imageId: currentImage.id,
            labelClassesId: selectedLabelClassId,
            labelId: labelType.id
          }),
        });

        if (!annotationResponse.ok) {
          const errorText = await annotationResponse.text();
          console.error('Annotation save error:', errorText);
          // Don't throw - still allow publish even if annotation fails
        } else {
          console.log('Annotation saved before publish');
        }
      }

      // Then publish the image
      const response = await fetch(`/api/projects/${project.id}/images/${currentImage.id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          published: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish image');
      }

      // Update local state
      setImages(images.map(img =>
        img.id === currentImage.id
          ? { ...img, published: true }
          : img
      ));

      // Move to next image
      if (currentImageIndex < images.length - 1) {
        const nextIndex = currentImageIndex + 1;
        setCurrentImageIndex(nextIndex);
        setSelectedLabelClassId(null);
        await loadAnnotations(images[nextIndex].id);
      } else {
        alert('All images have been reviewed!');
        setLocation('/annotator/dashboard');
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Failed to publish image');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Unsaved progress will be lost.')) {
      setLocation('/annotator/dashboard');
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

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                  {user ? getUserInitials(user.name) : 'U'}
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

      {/* Sidebar & Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">My profile</h2>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleBack}
              data-testid="button-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start mt-2"
              data-testid="button-my-projects"
            >
              My projects
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Title & Progress */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{project?.name || 'Project'}</h1>
                  {labelType && (
                    <p className="text-sm text-muted-foreground">
                      Label Type: {labelType.name}
                      {labelType.description && ` - ${labelType.description}`}
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground" data-testid="text-progress">
                  {images.length > 0 ? `Image ${currentImageIndex + 1} of ${images.length}` : 'No images available'}
                </div>
              </div>

              {/* No Images Message */}
              {images.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No images available in this project.</p>
                  <Button className="mt-4" onClick={handleBack}>
                    Back to Dashboard
                  </Button>
                </Card>
              ) : (
                <>
                  {/* Image Display */}
                  <Card className="p-8">
                    <div className="flex items-center justify-center bg-muted rounded-lg relative" style={{ minHeight: '400px' }}>
                      {/* Published Badge (informational only) */}
                      {currentImage.published && (
                        <div className="absolute top-4 left-4 z-10 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 shadow-lg">
                          <Lock className="w-4 h-4" />
                          Published
                        </div>
                      )}

                      <img
                        src={currentImage.url}
                        alt={currentImage.filename}
                        className="max-h-[400px] max-w-full object-contain rounded-lg"
                        onError={(e) => {
                          console.error('Image failed to load:', currentImage.url);
                          e.currentTarget.src = '/api/placeholder/400/300';
                        }}
                      />
                    </div>
                  </Card>

                  {/* Annotation Controls */}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Label Classes */}
                    <Card className="flex-1 p-4 space-y-4">
                      <h3 className="text-lg font-semibold">
                        Select Label Class
                        {labelType && ` (${labelType.name})`}
                      </h3>
                      {labelClasses.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            {project?.labelTypeId
                              ? "No label classes available for this label type."
                              : "This project doesn't have a label type assigned."}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {labelClasses.map((labelClass) => {
                            const isSelected = selectedLabelClassId === labelClass.id;
                            return (
                              <Button
                                key={labelClass.id}
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => handleLabelSelect(labelClass.id)}
                                disabled={currentImage?.published}
                                className={isSelected && currentImage?.published
                                  ? 'bg-green-600 hover:bg-green-600 text-white border-green-600 opacity-100'
                                  : ''
                                }
                                data-testid={`button-label-class-${labelClass.id}`}
                              >
                                {labelClass.name}
                                {isSelected && currentImage?.published && ' ✓'}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </Card>

                    {/* Navigation */}
                    <Card className="p-4 flex flex-col justify-between w-full md:w-64">
                      <h3 className="text-lg font-semibold mb-4">Navigation</h3>
                      <div className="space-y-2">
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={handlePrevious}
                          disabled={currentImageIndex === 0}
                          data-testid="button-previous"
                        >
                          Previous
                        </Button>
                        <Button
                          className="w-full"
                          onClick={handleSaveAndNext}
                          disabled={!selectedLabelClassId || isSaving || labelClasses.length === 0 || currentImage?.published}
                          data-testid="button-save-next"
                        >
                          {isSaving ? 'Saving...' : currentImage?.published ? 'Image Published' : 'Save & Next'}
                        </Button>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={handlePublish}
                          disabled={isPublishing}
                          data-testid="button-publish"
                        >
                          {isPublishing ? 'Publishing...' : currentImage?.published ? 'Next Image' : 'Publish & Next'}
                        </Button>
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={handleExit}
                          data-testid="button-exit"
                        >
                          Exit
                        </Button>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}