/**
 * Custom hooks exports
 * Central export point for all React Query hooks
 */

// Workspace hooks
export {
  useWorkspaces,
  useWorkspace,
  useWorkspaceMembers,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useAddWorkspaceMember,
  useRemoveWorkspaceMember,
  useUpdateWorkspaceMemberRole
} from './useWorkspaces';

// Board hooks
export {
  useBoards,
  useBoard,
  useCreateBoard,
  useUpdateBoard,
  useArchiveBoard,
  useDeleteBoard,
  useAddBoardMember,
  useRemoveBoardMember
} from './useBoards';

// Column hooks
export {
  useColumns,
  useCreateColumn,
  useUpdateColumn,
  useUpdateColumnPosition,
  useDeleteColumn
} from './useColumns';

// Card hooks
export {
  useCards,
  useCard,
  useCreateCard,
  useUpdateCard,
  useMoveCard,
  useArchiveCard,
  useDeleteCard,
  useAssignCardMember,
  useUnassignCardMember
} from './useCards';

// Label hooks
export {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
  useAttachLabel,
  useDetachLabel
} from './useLabels';

// Comment hooks
export {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment
} from './useComments';

// Attachment hooks
export {
  useAttachments,
  useDeleteAttachment,
  useResumableUpload
} from './useAttachments';

// Drag and Drop hooks
export {
  ItemTypes,
  useDraggableCard,
  useDroppableColumn,
  useDroppableCardPosition,
  useDraggableColumn,
  useDroppableBoard,
  useDroppableColumnPosition
} from './useDragAndDrop';

export type { CardDragItem, ColumnDragItem } from './useDragAndDrop';

// Responsive hooks
export {
  useMediaQuery,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice
} from './useMediaQuery';

// Accessibility hooks
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useFocusTrap } from './useFocusTrap';
export { useCardNavigation } from './useCardNavigation';

// Navigation hooks
export { useBreadcrumbs } from './useBreadcrumbs';
export type { BreadcrumbItem } from './useBreadcrumbs';
