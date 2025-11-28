// User Models
export interface User {
  id: number;
  email: string;
  name: string;
  profilePhotoUrl?: string;
  createdAt: string;
}

export interface UserProfile extends User {
  verified: boolean;
}

// Workspace Models
export interface Workspace {
  id: number;
  name: string;
  description?: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: number;
  userName: string;
  userEmail: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

// Board Models
export interface Board {
  id: number;
  name: string;
  description?: string;
  workspaceId: number;
  archived: boolean;
  position: number;
  columns: ColumnSummary[];
  members?: BoardMember[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  userId: number;
  userName: string;
  userEmail: string;
  role: BoardRole;
  joinedAt: string;
}

export enum BoardRole {
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

// Column Models
export interface Column {
  id: number;
  name: string;
  boardId: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnSummary {
  id: number;
  name: string;
  position: number;
}

// Card Models
export interface Card {
  id: number;
  title: string;
  description?: string;
  columnId: number;
  dueDate?: string;
  archived: boolean;
  position: number;
  members: CardMember[];
  comments: CommentSummary[];
  labels: LabelSummary[];
  attachments: AttachmentSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface CardMember {
  userId: number;
  name: string;
}

// Label Models
export interface Label {
  id: number;
  name: string;
  color: string;
  boardId: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabelSummary {
  id: number;
  name: string;
  color: string;
}

// Comment Models
export interface Comment {
  id: number;
  text: string;
  cardId: number;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentSummary {
  id: number;
  text: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

// Attachment Models
export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  cardId: number;
  uploadedBy: number;
  uploaderName: string;
  createdAt: string;
}

export interface AttachmentSummary {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: number;
  createdAt: string;
}

// Upload Models
export interface UploadProgress {
  uploadId: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
}

export interface UploadChunk {
  uploadId: string;
  chunkIndex: number;
  chunkData: Blob;
  totalChunks: number;
}

// Drag and Drop Models
export interface DragItem {
  type: 'card' | 'column';
  id: number;
  sourceId: number; // columnId for cards, boardId for columns
  sourceIndex: number;
}

export interface DropResult {
  targetId: number;
  targetIndex: number;
}
