export interface NoteMeta {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  is_folder: number;
  is_pinned: number;
  is_archived: number;
  sort_order: number;
  is_shared: number;
  share_slug: string | null;
  has_share_password: boolean | number;
  created_at: number;
  updated_at: number;
}

export interface NoteDetail extends NoteMeta {
  content: string;
  share_views?: number;
  tags?: { id: string; name: string; color: string }[];
}

export interface AuthStatus {
  initialized: boolean;
  autoLockMinutes: number;
  appTitle: string;
  needsEnvSetup?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  icon: string;
  snippet: string;
  updated_at: number;
}

export interface SharedNoteMeta {
  title: string;
  icon: string;
  is_protected: boolean;
  updated_at: number;
  views: number;
}

export interface SharedNoteContent {
  id: string;
  title: string;
  icon: string;
  content: string;
  updated_at: number;
  views: number;
}
