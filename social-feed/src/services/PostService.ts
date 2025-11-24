import axiosClient from '../api/AxiosClient';
import type {
    CommentLikeResponse,
    CommentResponse,
    CreateCommentRequest,
    CreatePostRequest,
    PostLikeResponse,
    PostResponse
} from '../types/feed';

export const postService = {
    getFeed: async () => {
        const response = await axiosClient.get<PostResponse[]>('/posts');
        return response.data;
    },

    createPost: async (payload: CreatePostRequest) => {
        const response = await axiosClient.post<PostResponse>('/posts', payload);
        return response.data;
    },

    togglePostLike: async (postId: number) => {
        const response = await axiosClient.post<PostLikeResponse>(`/posts/${postId}/likes`);
        return response.data;
    },

    getComments: async (postId: number) => {
        const response = await axiosClient.get<CommentResponse[]>(`/posts/${postId}/comments`);
        return response.data;
    },

    createComment: async (postId: number, payload: CreateCommentRequest) => {
        const response = await axiosClient.post<CommentResponse>(`/posts/${postId}/comments`, payload);
        return response.data;
    },

    toggleCommentLike: async (commentId: number) => {
        const response = await axiosClient.post<CommentLikeResponse>(`/comments/${commentId}/likes`);
        return response.data;
    }
};

