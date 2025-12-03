using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialFeed.API.DTOs;
using SocialFeed.API.Helpers;
using SocialFeed.API.Services;

namespace SocialFeed.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    /// <summary>
    /// Get the main feed of posts
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<PostResponse>>> GetFeed(
        [FromQuery] int limit = 20,
        [FromQuery] int? cursor = null)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var result = await _postService.GetFeedAsync(userId, limit, cursor);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Create a new post
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PostResponse>> CreatePost(CreatePostRequest request)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var post = await _postService.CreatePostAsync(request, currentUserId);
            return Ok(post);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Toggle like on a post
    /// </summary>
    [HttpPost("{postId}/likes")]
    public async Task<ActionResult<PostLikeResponse>> TogglePostLike(int postId)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var response = await _postService.TogglePostLikeAsync(postId, currentUserId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Get users who liked a post
    /// </summary>
    [HttpGet("{postId}/likes")]
    public async Task<ActionResult<PaginatedResponse<LikeUserResponse>>> GetPostLikes(int postId, [FromQuery] int limit = 20, [FromQuery] int? cursor = null)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var likes = await _postService.GetPostLikesAsync(postId, currentUserId, limit, cursor);
            return Ok(likes);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Get comments for a post
    /// </summary>
    [HttpGet("{postId}/comments")]
    public async Task<ActionResult<PaginatedResponse<CommentResponse>>> GetComments(int postId, [FromQuery] int limit = 20, [FromQuery] int? cursor = null)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var comments = await _postService.GetCommentsAsync(postId, currentUserId, limit, cursor);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Create a comment or reply on a post
    /// </summary>
    [HttpPost("{postId}/comments")]
    public async Task<ActionResult<CommentResponse>> CreateComment(int postId, CreateCommentRequest request)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var comment = await _postService.CreateCommentAsync(postId, request, currentUserId);
            return Ok(comment);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Toggle like on a comment
    /// </summary>
    [HttpPost("~/api/comments/{commentId}/likes")]
    public async Task<ActionResult<CommentLikeResponse>> ToggleCommentLike(int commentId)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var response = await _postService.ToggleCommentLikeAsync(commentId, currentUserId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }

    /// <summary>
    /// Get users who liked a comment
    /// </summary>
    [HttpGet("~/api/comments/{commentId}/likes")]
    public async Task<ActionResult<PaginatedResponse<LikeUserResponse>>> GetCommentLikes(int commentId, [FromQuery] int limit = 20, [FromQuery] int? cursor = null)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var likes = await _postService.GetCommentLikesAsync(commentId, currentUserId, limit, cursor);
            return Ok(likes);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }
}
