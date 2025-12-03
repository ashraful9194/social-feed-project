export interface PostResponse {
    id: number;
    content: string;
    imageUrl?: string | null;
    isPrivate: boolean;
    authorName: string;
    authorAvatar?: string | null;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isLikedByCurrentUser: boolean;
}

export interface CreatePostRequest {
    content: string;
    imageUrl?: string | null;
    isPrivate: boolean;
}

export interface CreateCommentRequest {
    content: string;
    parentCommentId?: number | null;
}

export interface CommentResponse {
    id: number;
    content: string;
    createdAt: string;
    authorName: string;
    authorAvatar?: string | null;
    likesCount: number;
    isLikedByCurrentUser: boolean;
    parentCommentId?: number | null;
    replies: CommentResponse[];
}

export interface PostLikeResponse {
    postId: number;
    isLiked: boolean;
    totalLikes: number;
}

export interface CommentLikeResponse {
    commentId: number;
    isLiked: boolean;
    totalLikes: number;
}

export interface LikeUserResponse {
    userId: number;
    fullName: string;
    avatarUrl?: string | null;
}

export interface UploadResponse {
    url: string;
    originalFileName: string;
    size: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    nextCursor?: number | null;
}

