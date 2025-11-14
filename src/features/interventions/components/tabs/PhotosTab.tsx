/**
 * Onglet Photos - Galerie photos avec catégories (avant/pendant/après)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Image as ImageIcon,
  Upload,
  X,
  Download,
  Maximize2,
  Trash2,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface PhotosTabProps {
  interventionId: string;
}

type PhotoCategory = 'before' | 'during' | 'after';

const CATEGORIES = {
  before: { label: 'Avant', color: 'bg-red-500', icon: Camera },
  during: { label: 'Pendant', color: 'bg-blue-500', icon: Camera },
  after: { label: 'Après', color: 'bg-green-500', icon: Camera },
};

export const PhotosTab = ({ interventionId }: PhotosTabProps) => {
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('before');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // TODO: Récupérer les photos depuis Firestore
  const photos = {
    before: [],
    during: [],
    after: [],
  };

  const handleFileUpload = async (category: PhotoCategory, files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Vérifier la taille (max 5MB par fichier)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      // TODO: Upload vers le serveur
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`${validFiles.length} photo(s) ajoutée(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      // TODO: Appel API
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Photo supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getTotalPhotos = () => {
    return photos.before.length + photos.during.length + photos.after.length;
  };

  const renderPhotoGrid = (category: PhotoCategory) => {
    const categoryPhotos = photos[category];

    return (
      <div className="space-y-4">
        {/* Zone d'upload */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            id={`upload-${category}`}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(category, e.target.files)}
            disabled={isUploading}
          />
          <label htmlFor={`upload-${category}`} className="cursor-pointer block">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {isUploading ? 'Upload en cours...' : 'Cliquez ou glissez des photos ici'}
            </p>
            <p className="text-sm text-gray-500">
              Formats acceptés : JPG, PNG, WEBP (max 5MB)
            </p>
          </label>
        </div>

        {/* Grille de photos */}
        {categoryPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Aucune photo {CATEGORIES[category].label.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
                onClick={() => setSelectedPhoto(photo.url)}
              >
                {/* Image */}
                <img
                  src={photo.url}
                  alt={photo.caption || 'Photo intervention'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />

                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(photo.url);
                    }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Badge catégorie */}
                <div className="absolute top-2 left-2">
                  <Badge className={cn('text-white', CATEGORIES[category].color)}>
                    {CATEGORIES[category].label}
                  </Badge>
                </div>

                {/* Caption si présente */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-sm truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(CATEGORIES).map(([key, config]) => {
          const count = photos[key as PhotoCategory].length;
          return (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={cn('p-3 rounded-full', config.color)}>
                    <config.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Onglets par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Galerie photos
            </span>
            <Badge variant="secondary">{getTotalPhotos()} photo(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as PhotoCategory)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="before" className="gap-2">
                <div className={cn('h-2 w-2 rounded-full', CATEGORIES.before.color)} />
                {CATEGORIES.before.label}
                <Badge variant="secondary" className="ml-2">
                  {photos.before.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="during" className="gap-2">
                <div className={cn('h-2 w-2 rounded-full', CATEGORIES.during.color)} />
                {CATEGORIES.during.label}
                <Badge variant="secondary" className="ml-2">
                  {photos.during.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="after" className="gap-2">
                <div className={cn('h-2 w-2 rounded-full', CATEGORIES.after.color)} />
                {CATEGORIES.after.label}
                <Badge variant="secondary" className="ml-2">
                  {photos.after.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="before" className="mt-6">
              {renderPhotoGrid('before')}
            </TabsContent>
            <TabsContent value="during" className="mt-6">
              {renderPhotoGrid('during')}
            </TabsContent>
            <TabsContent value="after" className="mt-6">
              {renderPhotoGrid('after')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Photo en plein écran"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
