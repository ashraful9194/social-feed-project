using Microsoft.EntityFrameworkCore;
using SocialFeed.API.Data;
using SocialFeed.API.DTOs;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Services;

public class PostService : IPostService
{
    private readonly AppDbContext _context;

    public PostService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PostResponse>> GetFeedAsync(int currentUserId)
    {
        var posts = await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Where(p => !p.IsPrivate || p.UserId == currentUserId)
            .OrderByDescending(p => p.CreatedAt)
            .Take(20)
            .Select(p => new PostResponse(
                p.Id,
                p.Content,
                p.ImageUrl,
                p.IsPrivate,
                $"{p.User.FirstName} {p.User.LastName}",
                ResolveAvatar(p.User.ProfileImageUrl),
                p.Likes.Count,
                p.Comments.Count,
                p.CreatedAt,
                p.Likes.Any(l => l.UserId == currentUserId)
            ))
            .ToListAsync();

        return posts;
    }

    public async Task<PostResponse> CreatePostAsync(CreatePostRequest request, int currentUserId)
    {
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

        var user = await _context.Users.FindAsync(currentUserId);

        return new PostResponse(
            newPost.Id,
            newPost.Content,
            newPost.ImageUrl,
            newPost.IsPrivate,
            $"{user!.FirstName} {user.LastName}",
            ResolveAvatar(user.ProfileImageUrl),
            0, 0, newPost.CreatedAt, false
        );
    }

    public async Task<PostLikeResponse> TogglePostLikeAsync(int postId, int currentUserId)
    {
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) throw new KeyNotFoundException("Post not found.");

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

        return new PostLikeResponse(postId, isLiked, totalLikes);
    }

    public async Task<List<LikeUserResponse>> GetPostLikesAsync(int postId, int currentUserId)
    {
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) throw new KeyNotFoundException("Post not found.");

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

        return likes;
    }

    public async Task<List<CommentResponse>> GetCommentsAsync(int postId, int currentUserId)
    {
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) throw new KeyNotFoundException("Post not found.");

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

        return response;
    }

    public async Task<CommentResponse> CreateCommentAsync(int postId, CreateCommentRequest request, int currentUserId)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ArgumentException("Content is required.");
        }

        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) throw new KeyNotFoundException("Post not found.");

        if (request.ParentCommentId.HasValue)
        {
            var parentCommentExists = await _context.Comments
                .AnyAsync(c => c.Id == request.ParentCommentId.Value && c.PostId == postId);
            if (!parentCommentExists)
            {
                throw new ArgumentException("Parent comment was not found on this post.");
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

        return new CommentResponse(
            comment.Id,
            comment.Content,
            comment.CreatedAt,
            $"{comment.User.FirstName} {comment.User.LastName}",
            ResolveAvatar(comment.User.ProfileImageUrl),
            0,
            false,
            comment.ParentCommentId,
            new List<CommentResponse>()
        );
    }

    public async Task<CommentLikeResponse> ToggleCommentLikeAsync(int commentId, int currentUserId)
    {
        var comment = await FindAccessibleCommentAsync(commentId, currentUserId);
        if (comment == null) throw new KeyNotFoundException("Comment not found.");

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

        return new CommentLikeResponse(commentId, isLiked, totalLikes);
    }

    public async Task<List<LikeUserResponse>> GetCommentLikesAsync(int commentId, int currentUserId)
    {
        var comment = await FindAccessibleCommentAsync(commentId, currentUserId);
        if (comment == null) throw new KeyNotFoundException("Comment not found.");

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

        return likes;
    }

    public async Task<Post?> FindVisiblePostAsync(int postId, int currentUserId)
    {
        return await _context.Posts
            .FirstOrDefaultAsync(p => p.Id == postId && (!p.IsPrivate || p.UserId == currentUserId));
    }

    public async Task<Comment?> FindAccessibleCommentAsync(int commentId, int currentUserId)
    {
        return await _context.Comments
            .Include(c => c.Post)
            .FirstOrDefaultAsync(c => c.Id == commentId && (!c.Post.IsPrivate || c.Post.UserId == currentUserId));
    }

    /// <summary>
    /// Resolves avatar URL, returning default if null or empty
    /// </summary>
    public static string ResolveAvatar(string? avatarPath)
    {
        return string.IsNullOrWhiteSpace(avatarPath) ? "/assets/images/Avatar.png" : avatarPath;
    }
}

