import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import React, { useEffect } from 'react'
import { Link, useLocation, useParams } from 'wouter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ImageDetails() {
    const [, setLocation] = useLocation();
    const params = useParams();
    const imageId = params.id || '';
    const [user, setUser] = React.useState<User | null>(null);
    const [image, setImage] = React.useState<any | null>(null);
    const [annotations, setAnnotations] = React.useState<any[]>([]);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return
        const response = await fetch(`/api/images/${imageId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        setImage(data.data)
      } catch (error) {
        console.error('Error fetching image details:', error)
      }
    }
    loadImage()

    const loadAnnotations = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return
        const response = await fetch(`/api/images/${imageId}/annotations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        console.log('Fetched annotations:', data)
        setAnnotations(data)
      } catch (error) {
        console.error('Error fetching annotations:', error)
      }
    }
    loadAnnotations()
  }, [])

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
  
  const handleDeleteImage = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setLocation('/specialist/portfolio');
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
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

      {/* Main */}
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <Link href='/specialist/portfolio' className="text-sm text-black  hover:underline">
          &larr; Back to Portfolio
        </Link>
        {/* Image Display */}
        <Card>
          
          <CardHeader>
            
            <CardTitle>{image?.filename}</CardTitle>
            <CardDescription>
              Uploaded: {new Date(image?.uploadedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <img
              src={image?.url}
              alt={image?.filename}
              className="w-full rounded-md border shadow"
            />
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={handleDeleteImage}>
              Delete Image
            </Button>
          </CardFooter> 
        </Card>
        {/* Annotations List */}
        <div>
          
          <h2 className="text-2xl font-bold mb-4">
            Annotations {annotations?.length}
          </h2>
          {annotations?.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              
              No annotations for this image?.
            </Card>
          ) : (
            <div className="space-y-4">
              
              {annotations?.map((ann) => (
                <Card key={ann.id} className="p-4">
                  
                  <div className="flex flex-col gap-2">
                    
                    <p>
                      <strong>Project:</strong> {ann.projectName}
                    </p>
                    <p>
                      <strong>Label Type:</strong> {ann.labelTypeName}
                    </p>
                    <p>
                      <strong>Label Class:</strong> {ann.labelClassName}
                    </p>
                    <p>
                      <strong>Annotated By:</strong> {ann.annotatorName}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
