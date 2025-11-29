import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LabelType {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface LabelClass {
  id: string;
  name: string;
  labelTypeId: string;
}

interface LabelManagerProps {
  labelTypes: LabelType[];
  onLabelTypeChange: () => void;
}

const LabelManager = ({ labelTypes: initialLabelTypes, onLabelTypeChange }: LabelManagerProps) => {
  const { toast } = useToast();
  const [labelTypes, setLabelTypes] = useState<LabelType[]>(initialLabelTypes);
  const [isLoading, setIsLoading] = useState(false); // Changed to false since we get data from props
  const [error, setError] = useState<string | null>(null);

  // State for creating a new Label Type
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelDescription, setNewLabelDescription] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  // State for managing classes
  const [selectedLabel, setSelectedLabel] = useState<LabelType | null>(null);
  const [classes, setClasses] = useState<LabelClass[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [isManagingClasses, setIsManagingClasses] = useState(false);

  // Get auth token helper
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Get auth headers helper
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    setLabelTypes(initialLabelTypes);
    setIsLoading(false); // Data is loaded from parent
  }, [initialLabelTypes]);

  // Remove the duplicate fetchLabelTypes function since data comes from parent
  // const fetchLabelTypes = async () => { ... }

  const handleCreateLabelType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    setIsCreatingLabel(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/label-types', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newLabelName.trim(),
          description: newLabelDescription.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create label type');
      }

      toast({ title: 'Success', description: `Label Type "${newLabelName}" created.` });
      setNewLabelName('');
      setNewLabelDescription('');
      setIsCreatingLabel(false);
      onLabelTypeChange(); // Notify parent to refresh
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setIsCreatingLabel(false);
    }
  };

  const handleDeleteLabelType = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the Label Type: "${name}"? This will also delete all associated classes.`)) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/label-types', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete label type');
      }

      toast({ title: 'Success', description: `Label Type "${name}" deleted.` });
      onLabelTypeChange(); // Notify parent to refresh
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // --- Class Management Functions ---

  const fetchClasses = async (labelId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/label-types/${labelId}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Classes API response:', data); // Debug log
      
      // Handle different response structures
      let classesArray;
      if (Array.isArray(data)) {
        classesArray = data;
      } else if (data && Array.isArray(data.data)) {
        classesArray = data.data;
      } else if (data && Array.isArray(data.classes)) {
        classesArray = data.classes;
      } else {
        console.warn('Unexpected classes response format:', data);
        classesArray = [];
      }
      
      setClasses(classesArray);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setClasses([]);
    }
  };

  const handleManageClasses = (label: LabelType) => {
    setSelectedLabel(label);
    setIsManagingClasses(true);
    fetchClasses(label.id);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !selectedLabel) return;

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/label-types/${selectedLabel.id}/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newClassName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add class');
      }

      toast({ title: 'Success', description: `Class "${newClassName}" added to ${selectedLabel.name}.` });
      setNewClassName('');
      fetchClasses(selectedLabel.id); // Refresh classes list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemoveClass = async (classId: string, className: string) => {
    if (!selectedLabel) return;
    if (!window.confirm(`Are you sure you want to remove the class: "${className}" from ${selectedLabel.name}?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/label-types/${selectedLabel.id}/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove class');
      }

      toast({ title: 'Success', description: `Class "${className}" removed.` });
      fetchClasses(selectedLabel.id); // Refresh classes list
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Remove loading state since data comes from parent
  // if (isLoading) {
  //   return <div className="text-center py-10 text-muted-foreground">Loading Label Types...</div>;
  // }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading labels: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Label Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Label
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Label Type</DialogTitle>
              <DialogDescription>
                A Label Type is a collection of classes used for annotation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLabelType} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label-name">Label Name</Label>
                <Input
                  id="label-name"
                  placeholder="e.g., Object Detection"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  required
                  disabled={isCreatingLabel}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label-description">Description (Optional)</Label>
                <Input
                  id="label-description"
                  placeholder="e.g., Labels for bounding box annotations"
                  value={newLabelDescription}
                  onChange={(e) => setNewLabelDescription(e.target.value)}
                  disabled={isCreatingLabel}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreatingLabel}>
                  {isCreatingLabel ? 'Creating...' : 'Create Label Type'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {labelTypes.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent>
            <h3 className="text-lg font-medium mb-2">No Label Types Created</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating a new Label Type to define your annotation classes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labelTypes.map((label) => (
            <Card key={label.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{label.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleManageClasses(label)}
                    title="Manage Classes"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteLabelType(label.id, label.name)}
                    title="Delete Label Type"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{label.description || 'No description provided.'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Managing Classes */}
      <Dialog open={isManagingClasses} onOpenChange={setIsManagingClasses}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Classes for: {selectedLabel?.name}</DialogTitle>
            <DialogDescription>
              Add or remove annotation classes for this Label Type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Add New Class Form */}
            <form onSubmit={handleAddClass} className="flex gap-2">
              <Input
                placeholder="New class name (e.g., Car, Pedestrian)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                required
              />
              <Button type="submit" className="flex-shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </form>

            {/* List of Existing Classes */}
            <div className="space-y-3">
              <h3 className="text-md font-semibold">Existing Classes ({classes.length})</h3>
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes defined yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex justify-between items-center p-2 border rounded-md">
                      <span className="text-sm">{cls.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClass(cls.id, cls.name)}
                        title="Remove Class"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManagingClasses(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabelManager;