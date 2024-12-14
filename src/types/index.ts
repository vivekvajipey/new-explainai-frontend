export interface Text {
  id: string;
  title: string;
  content: string;
  preview: string;
}

export interface DocumentResponse {
  id: string;
  title?: string;
  content: string;
  preview?: string;
}
