using SocialFeed.API.DTOs;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Services;

public interface IPostService
{
    Task<List<PostResponse>> GetFeedAsync(int currentUserId);
    Task<PostResponse> CreatePostAsync(CreatePostRequest request, int currentUserId);
    Task<PostLikeResponse> TogglePostLikeAsync(int postId, int currentUserId);
    Task<List<LikeUserResponse>> GetPostLikesAsync(int postId, int currentUserId);
    Task<List<CommentResponse>> GetCommentsAsync(int postId, int currentUserId);
    Task<CommentResponse> CreateCommentAsync(int postId, CreateCommentRequest request, int currentUserId);
    Task<CommentLikeResponse> ToggleCommentLikeAsync(int commentId, int currentUserId);
    Task<List<LikeUserResponse>> GetCommentLikesAsync(int commentId, int currentUserId);
    Task<Post?> FindVisiblePostAsync(int postId, int currentUserId);
    Task<Comment?> FindAccessibleCommentAsync(int commentId, int currentUserId);
}

