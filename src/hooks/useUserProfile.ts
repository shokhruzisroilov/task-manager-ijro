import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, uploadProfilePhoto, deleteProfilePhoto } from '../api/endpoints/users';
import type { User } from '../types/models';

export const useUserProfile = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'me'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: deleteProfilePhoto,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'me'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user,
    isLoading,
    error,
    uploadPhoto: uploadPhotoMutation.mutate,
    deletePhoto: deletePhotoMutation.mutate,
    isUploadingPhoto: uploadPhotoMutation.isPending,
    isDeletingPhoto: deletePhotoMutation.isPending,
  };
};
