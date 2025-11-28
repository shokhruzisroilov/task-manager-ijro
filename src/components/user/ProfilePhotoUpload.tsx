import { useRef, useState } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import './ProfilePhotoUpload.css';

export const ProfilePhotoUpload = () => {
  const { user, uploadPhoto, deletePhoto, isUploadingPhoto, isDeletingPhoto } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadPhoto(file, {
      onSuccess: () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (error) => {
        console.error('Upload failed:', error);
        setPreviewUrl(null);
        alert('Failed to upload photo. Please try again.');
      },
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete your profile photo?')) {
      deletePhoto();
    }
  };

  const displayUrl = previewUrl || user?.profilePhotoUrl;

  return (
    <div className="profile-photo-upload">
      <div className="profile-photo-preview">
        <Avatar
          name={user?.name || ''}
          imageUrl={displayUrl}
          size="large"
        />
        {(isUploadingPhoto || isDeletingPhoto) && (
          <div className="profile-photo-loading">
            <div className="spinner" />
          </div>
        )}
      </div>

      <div className="profile-photo-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploadingPhoto || isDeletingPhoto}
        />

        <Button
          onClick={handleUploadClick}
          disabled={isUploadingPhoto || isDeletingPhoto}
          variant="primary"
          size="small"
        >
          {user?.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>

        {user?.profilePhotoUrl && (
          <Button
            onClick={handleDelete}
            disabled={isUploadingPhoto || isDeletingPhoto}
            variant="secondary"
            size="small"
          >
            Remove Photo
          </Button>
        )}
      </div>

      <p className="profile-photo-hint">
        Recommended: Square image, at least 200x200px, max 5MB
      </p>
    </div>
  );
};
