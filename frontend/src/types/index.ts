export interface Link {
  id: string;
  url: string;
  title: string;
  summary?: string;
  content?: string;
  tags: string[];
  source: string;
  domain?: string;
  author?: string;
  reading_time?: number;
  image_url?: string;
  video_url?: string;
  is_read: boolean;
  is_favorite: boolean;
  nested_links?: string[];
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LinksResponse {
  links: Link[];
  total: number;
  skip: number;
  limit: number;
}

export interface Stats {
  total_links: number;
  read: number;
  unread: number;
  favorites: number;
  scheduled: number;
}
