import {
  User,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Board,
  BoardMember,
  BoardRole,
  Column,
  Card,
  CardMember,
  Label,
  Comment,
  Attachment
} from './models';

// Authentication Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  data?: any; // For backward compatibility
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  verified?: boolean;
  createdAt: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
}

// Workspace Request/Response Types
export interface WorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceResponse extends Workspace {}

export interface AddMemberRequest {
  userId: number;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole;
}

export interface MemberResponse extends WorkspaceMember {}

// Board Request/Response Types
export interface BoardRequest {
  name: string;
  description?: string;
}

export interface BoardResponse extends Board {}

export interface AddBoardMemberRequest {
  userId: number;
  role: BoardRole;
}

export interface BoardMemberResponse extends BoardMember {}

// Column Request/Response Types
export interface ColumnRequest {
  name: string;
}

export interface ColumnResponse extends Column {}

export interface UpdatePositionRequest {
  newPosition?: number;
}

// Card Request/Response Types
export interface CardRequest {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface CardResponse extends Card {}

export interface MoveCardRequest {
  targetColumnId?: number;
  newPosition?: number;
  columnId?: number; // For backward compatibility
  position?: number; // For backward compatibility
}

export interface CardMemberResponse extends CardMember {}

// Label Request/Response Types
export interface LabelRequest {
  name: string;
  color: string;
}

export interface LabelResponse extends Label {}

// Comment Request/Response Types
export interface CommentRequest {
  text: string;
}

export interface CommentResponse extends Comment {}

// Attachment Request/Response Types
export interface AttachmentRequest {
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export interface AttachmentResponse extends Attachment {}

// API Error Types
export interface APIError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Pagination Types (for future use)
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
