export interface Text {
  id: string;
  title: string;
  content: string;
  preview: string;
  isExample?: boolean;
}

// API response type
export interface DocumentResponse {
  id: string;
  title: string;
  name?: string;
  content?: string;
  preview?: string;
  created_at?: string;
}

export interface Document {
  id: string;
  title: string;
  created_at: string;
  content?: string;
  preview?: string;
  name?: string;
  isExample?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}