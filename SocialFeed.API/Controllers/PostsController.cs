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
    public async Task<ActionResult<List<PostResponse>>> GetFeed()
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var posts = await _postService.GetFeedAsync(currentUserId);
            return Ok(posts);
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
    public async Task<ActionResult<List<LikeUserResponse>>> GetPostLikes(int postId)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var likes = await _postService.GetPostLikesAsync(postId, currentUserId);
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
    public async Task<ActionResult<List<CommentResponse>>> GetComments(int postId)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var comments = await _postService.GetCommentsAsync(postId, currentUserId);
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
    public async Task<ActionResult<List<LikeUserResponse>>> GetCommentLikes(int commentId)
    {
        try
        {
            var currentUserId = this.GetCurrentUserId();
            var likes = await _postService.GetCommentLikesAsync(commentId, currentUserId);
            return Ok(likes);
        }
        catch (Exception ex)
        {
            return ControllerHelper.HandleException(ex);
        }
    }
}
