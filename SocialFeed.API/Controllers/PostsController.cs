using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialFeed.API.Data;
using SocialFeed.API.DTOs;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // 🔒 Protects all endpoints below
public class PostsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PostsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/posts
    // Returns the Main Feed
    [HttpGet]
    public async Task<ActionResult<List<PostResponse>>> GetFeed()
    {
        var currentUserId = GetCurrentUserId();

        // 1. Query the Database
        var posts = await _context.Posts
            .Include(p => p.User) // Join with User table
            .Include(p => p.Likes) // Join with Likes to check status
            .Where(p => !p.IsPrivate || p.UserId == currentUserId) // 🔒 Privacy Filter
            .OrderByDescending(p => p.CreatedAt) // 🕒 Newest first
            .Take(20) // Limit to 20 for now (Simple pagination)
            .Select(p => new PostResponse(
                p.Id,
                p.Content,
                p.ImageUrl,
                p.IsPrivate,
                $"{p.User.FirstName} {p.User.LastName}",
                ResolveAvatar(p.User.ProfileImageUrl), // Fallback image
                p.Likes.Count, // Count total likes
                p.Comments.Count,
                p.CreatedAt,
                p.Likes.Any(l => l.UserId == currentUserId) // ❤️ Did I like this?
            ))
            .ToListAsync();

        return Ok(posts);
    }

    // POST: api/posts/{postId}/likes
    // Toggle like on a post
    [HttpPost("{postId}/likes")]
    public async Task<ActionResult<PostLikeResponse>> TogglePostLike(int postId)
    {
        var currentUserId = GetCurrentUserId();
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) return NotFound();

        var existingLike = await _context.PostLikes
            .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == currentUserId);

        var isLiked = existingLike == null;

        if (existingLike == null)
        {
            _context.PostLikes.Add(new PostLike { PostId = postId, UserId = currentUserId });
        }
        else
        {
            _context.PostLikes.Remove(existingLike);
        }

        await _context.SaveChangesAsync();

        var totalLikes = await _context.PostLikes.CountAsync(pl => pl.PostId == postId);

        return Ok(new PostLikeResponse(postId, isLiked, totalLikes));
    }

    // GET: api/posts/{postId}/likes
    // Returns the users who liked a post
    [HttpGet("{postId}/likes")]
    public async Task<ActionResult<List<LikeUserResponse>>> GetPostLikes(int postId)
    {
        var currentUserId = GetCurrentUserId();
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) return NotFound();

        var likes = await _context.PostLikes
            .Where(pl => pl.PostId == postId)
            .Include(pl => pl.User)
            .OrderBy(pl => pl.User.FirstName)
            .ThenBy(pl => pl.User.LastName)
            .Select(pl => new LikeUserResponse(
                pl.UserId,
                $"{pl.User.FirstName} {pl.User.LastName}",
                ResolveAvatar(pl.User.ProfileImageUrl)
            ))
            .ToListAsync();

        return Ok(likes);
    }

    // POST: api/posts
    // Creates a new Post
    [HttpPost]
    public async Task<ActionResult<PostResponse>> CreatePost(CreatePostRequest request)
    {
        var currentUserId = GetCurrentUserId();

        var newPost = new Post
        {
            Content = request.Content,
            ImageUrl = request.ImageUrl,
            IsPrivate = request.IsPrivate,
            UserId = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(newPost);
        await _context.SaveChangesAsync();

        // Return the created post structure
        // We load the user to return the author name immediately
        var user = await _context.Users.FindAsync(currentUserId);
        
        return Ok(new PostResponse(
            newPost.Id,
            newPost.Content,
            newPost.ImageUrl,
            newPost.IsPrivate,
            $"{user!.FirstName} {user.LastName}",
            ResolveAvatar(user.ProfileImageUrl),
            0, 0, newPost.CreatedAt, false
        ));
    }

    // GET: api/posts/{postId}/comments
    // Fetch comments with nested replies for a post
    [HttpGet("{postId}/comments")]
    public async Task<ActionResult<List<CommentResponse>>> GetComments(int postId)
    {
        var currentUserId = GetCurrentUserId();
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) return NotFound();

        var comments = await _context.Comments
            .Where(c => c.PostId == postId)
            .Include(c => c.User)
            .Include(c => c.Likes)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var repliesLookup = comments
            .Where(c => c.ParentCommentId.HasValue)
            .GroupBy(c => c.ParentCommentId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        CommentResponse MapComment(Comment comment)
        {
            var replies = repliesLookup.TryGetValue(comment.Id, out var children)
                ? children.Select(MapComment).ToList()
                : new List<CommentResponse>();

            return new CommentResponse(
                comment.Id,
                comment.Content,
                comment.CreatedAt,
                $"{comment.User.FirstName} {comment.User.LastName}",
                ResolveAvatar(comment.User.ProfileImageUrl),
                comment.Likes.Count,
                comment.Likes.Any(l => l.UserId == currentUserId),
                comment.ParentCommentId,
                replies
            );
        }

        var response = comments
            .Where(c => c.ParentCommentId == null)
            .Select(MapComment)
            .ToList();

        return Ok(response);
    }

    // POST: api/posts/{postId}/comments
    // Create a comment or a reply
    [HttpPost("{postId}/comments")]
    public async Task<ActionResult<CommentResponse>> CreateComment(int postId, CreateCommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Content is required.");
        }

        var currentUserId = GetCurrentUserId();
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) return NotFound();

        if (request.ParentCommentId.HasValue)
        {
            var parentCommentExists = await _context.Comments
                .AnyAsync(c => c.Id == request.ParentCommentId.Value && c.PostId == postId);
            if (!parentCommentExists)
            {
                return BadRequest("Parent comment was not found on this post.");
            }
        }

        var comment = new Comment
        {
            Content = request.Content.Trim(),
            PostId = postId,
            UserId = currentUserId,
            ParentCommentId = request.ParentCommentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        await _context.Entry(comment).Reference(c => c.User).LoadAsync();

        return Ok(new CommentResponse(
            comment.Id,
            comment.Content,
            comment.CreatedAt,
            $"{comment.User.FirstName} {comment.User.LastName}",
            ResolveAvatar(comment.User.ProfileImageUrl),
            0,
            false,
            comment.ParentCommentId,
            new List<CommentResponse>()
        ));
    }

    // POST: api/comments/{commentId}/likes
    // Toggle like on a comment
    [HttpPost("~/api/comments/{commentId}/likes")]
    public async Task<ActionResult<CommentLikeResponse>> ToggleCommentLike(int commentId)
    {
        var currentUserId = GetCurrentUserId();
        var comment = await FindAccessibleCommentAsync(commentId, currentUserId);
        if (comment == null) return NotFound();

        var existingLike = await _context.CommentLikes
            .FirstOrDefaultAsync(cl => cl.CommentId == commentId && cl.UserId == currentUserId);

        var isLiked = existingLike == null;

        if (existingLike == null)
        {
            _context.CommentLikes.Add(new CommentLike { CommentId = commentId, UserId = currentUserId });
        }
        else
        {
            _context.CommentLikes.Remove(existingLike);
        }

        await _context.SaveChangesAsync();

        var totalLikes = await _context.CommentLikes.CountAsync(cl => cl.CommentId == commentId);

        return Ok(new CommentLikeResponse(commentId, isLiked, totalLikes));
    }

    // GET: api/comments/{commentId}/likes
    // Returns users who liked a specific comment (or reply)
    [HttpGet("~/api/comments/{commentId}/likes")]
    public async Task<ActionResult<List<LikeUserResponse>>> GetCommentLikes(int commentId)
    {
        var currentUserId = GetCurrentUserId();
        var comment = await FindAccessibleCommentAsync(commentId, currentUserId);
        if (comment == null) return NotFound();

        var likes = await _context.CommentLikes
            .Where(cl => cl.CommentId == commentId)
            .Include(cl => cl.User)
            .OrderBy(cl => cl.User.FirstName)
            .ThenBy(cl => cl.User.LastName)
            .Select(cl => new LikeUserResponse(
                cl.UserId,
                $"{cl.User.FirstName} {cl.User.LastName}",
                ResolveAvatar(cl.User.ProfileImageUrl)
            ))
            .ToListAsync();

        return Ok(likes);
    }

    // --- Helper to extract User ID from JWT Token ---
    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier); // "sub" in JWT
        if (claim == null) throw new UnauthorizedAccessException();
        return int.Parse(claim.Value);
    }

    private Task<Post?> FindVisiblePostAsync(int postId, int currentUserId)
    {
        return _context.Posts
            .FirstOrDefaultAsync(p => p.Id == postId && (!p.IsPrivate || p.UserId == currentUserId));
    }

    private Task<Comment?> FindAccessibleCommentAsync(int commentId, int currentUserId)
    {
        return _context.Comments
            .Include(c => c.Post)
            .FirstOrDefaultAsync(c => c.Id == commentId && (!c.Post.IsPrivate || c.Post.UserId == currentUserId));
    }

    private static string ResolveAvatar(string? avatarPath)
    {
        return string.IsNullOrWhiteSpace(avatarPath) ? "/assets/images/Avatar.png" : avatarPath;
    }
}