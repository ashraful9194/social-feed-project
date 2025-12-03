using SocialFeed.API.DTOs;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Services;

public interface IPostService
{
    Task<PaginatedResponse<PostResponse>> GetFeedAsync(int currentUserId, int limit = 20, int? cursor = null);
    Task<PostResponse> CreatePostAsync(CreatePostRequest request, int currentUserId);
    Task<PostLikeResponse> TogglePostLikeAsync(int postId, int currentUserId);
    Task<PaginatedResponse<LikeUserResponse>> GetPostLikesAsync(int postId, int currentUserId, int limit = 20, int? cursor = null);
    Task<PaginatedResponse<CommentResponse>> GetCommentsAsync(int postId, int currentUserId, int limit = 20, int? cursor = null);
    Task<CommentResponse> CreateCommentAsync(int postId, CreateCommentRequest request, int currentUserId);
    Task<CommentLikeResponse> ToggleCommentLikeAsync(int commentId, int currentUserId);
    Task<PaginatedResponse<LikeUserResponse>> GetCommentLikesAsync(int commentId, int currentUserId, int limit = 20, int? cursor = null);
    Task<Post?> FindVisiblePostAsync(int postId, int currentUserId);
    Task<Comment?> FindAccessibleCommentAsync(int commentId, int currentUserId);
}

