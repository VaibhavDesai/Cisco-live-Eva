export type ThreadStatus = 'open' | 'resolved';

export interface Thread {
  id: string;
  route: string;
  selector: string;
  x_ratio: number;
  y_ratio: number;
  element_label: string | null;
  status: ThreadStatus;
  created_at: string;
}

export interface Comment {
  id: string;
  thread_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface ThreadWithComments extends Thread {
  comments: Comment[];
}

export interface Anchor {
  selector: string;
  xRatio: number;
  yRatio: number;
  label: string | null;
}
