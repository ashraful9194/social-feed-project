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

    public async Task<PaginatedResponse<PostResponse>> GetFeedAsync(int currentUserId, int limit = 20, int? cursor = null)
    {
        var query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Where(p => !p.IsPrivate || p.UserId == currentUserId);

        if (cursor.HasValue)
        {
            query = query.Where(p => p.Id < cursor.Value);
        }

        var posts = await query
            .OrderByDescending(p => p.Id)
            .Take(limit + 1)
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

        int? nextCursor = null;
        if (posts.Count > limit)
        {
            nextCursor = posts.Last().Id; // The (limit+1)th item's ID is the cursor? No, wait.
            // If we fetched 21 items (limit 20), the 21st item exists.
            // The cursor for the NEXT page should be the ID of the 20th item.
            // Actually, usually we drop the 21st item from the result list.
            // And the cursor is the ID of the last item in the *returned* list (the 20th item).
            
            var lastItem = posts[limit - 1];
            nextCursor = lastItem.Id;
            posts.RemoveAt(limit); // Remove the extra item
        }
        else if (posts.Count > 0)
        {
             // If we didn't fetch more than limit, we reached the end.
             // But wait, standard cursor logic:
             // If I ask for 20 and get 20, there MIGHT be more. 
             // That's why we ask for limit + 1.
             // If count > limit:
             //   We have a next page.
             //   Next cursor is the ID of the 20th item (the last one we return).
             //   We remove the 21st item.
             
             // Correction:
             // Cursor logic: "Give me items where Id < X".
             // If I return item with Id 100 as the last item.
             // Next request: "Give me items where Id < 100".
             // So yes, nextCursor = posts[limit-1].Id.
        }

        return new PaginatedResponse<PostResponse>(posts, nextCursor);
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

    public async Task<PaginatedResponse<LikeUserResponse>> GetPostLikesAsync(int postId, int currentUserId, int limit = 20, int? cursor = null)
    {
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) throw new KeyNotFoundException("Post not found.");

        var query = _context.PostLikes
            .Where(pl => pl.PostId == postId);

        if (cursor.HasValue)
        {
            query = query.Where(pl => pl.UserId > cursor.Value);
        }

        var likes = await query
            .Include(pl => pl.User)
            .OrderBy(pl => pl.UserId) // Changed from Name to ID for cursor pagination
            .Take(limit + 1) // Fetch one extra to check for next page
            .Select(pl => new LikeUserResponse(
                pl.UserId,
                $"{pl.User.FirstName} {pl.User.LastName}",
                ResolveAvatar(pl.User.ProfileImageUrl)
            ))
            .ToListAsync();

        int? nextCursor = null;
        if (likes.Count > limit)
        {
            nextCursor = likes.Last().UserId; // Actually, the last one is the (limit+1)th item.
            // Wait, if we take limit+1, the (limit+1)th item IS the proof there is a next page.
            // But the cursor for the NEXT page should be the ID of the 'limit'th item.
            // Let's correct this standard pattern:
            // 1. Take limit + 1
            // 2. If count > limit, we have a next page.
            // 3. The next cursor is the ID of the `limit`-th item (the last item of the current page).
            // 4. Remove the extra item from the result list.
            
            var lastItem = likes[limit - 1];
            nextCursor = lastItem.UserId;
            likes.RemoveAt(limit); // Remove the extra item
        }

        return new PaginatedResponse<LikeUserResponse>(likes, nextCursor);
    }

    public async Task<PaginatedResponse<CommentResponse>> GetCommentsAsync(int postId, int currentUserId, int limit = 20, int? cursor = null)
    {
        var post = await FindVisiblePostAsync(postId, currentUserId);
        if (post == null) throw new KeyNotFoundException("Post not found.");

        var query = _context.Comments
            .Where(c => c.PostId == postId);

        if (cursor.HasValue)
        {
            query = query.Where(c => c.Id < cursor.Value); // Newest first, so ID < cursor
        }

        var comments = await query
            .Include(c => c.User)
            .Include(c => c.Likes)
            .OrderByDescending(c => c.CreatedAt) // Newest first
            .Take(limit + 1)
            .ToListAsync();

        // Note: We are NOT fetching replies recursively here for pagination simplicity in this pass.
        // If we need replies, we should probably fetch them separately or just include them if they are small.
        // The original code grouped replies in memory.
        // For 1 million users, fetching ALL comments and grouping in memory is bad.
        // We will just return top-level comments here, OR we assume flat list for now?
        // The original code did: .Where(c => c.ParentCommentId == null) at the end.
        // Let's filter for top-level comments in the DB query to be efficient.
        
        // RE-WRITING QUERY TO FILTER ROOT COMMENTS ONLY
        query = _context.Comments
            .Where(c => c.PostId == postId && c.ParentCommentId == null);

        if (cursor.HasValue)
        {
            query = query.Where(c => c.Id < cursor.Value);
        }

        var rootComments = await query
            .Include(c => c.User)
            .Include(c => c.Likes)
            .OrderByDescending(c => c.CreatedAt) // Newest first
            .Take(limit + 1)
            .ToListAsync();

        // For replies, we might need a separate strategy or just fetch them for these specific root comments.
        // For now, let's just map the root comments.
        // To keep it simple and safe: We will NOT return replies in the paginated list for now, 
        // OR we fetch replies for just these 20 comments.
        // Let's fetch replies for these 20 comments to preserve some functionality.
        
        var rootIds = rootComments.Select(c => c.Id).ToList();
        var replies = await _context.Comments
            .Where(c => c.PostId == postId && c.ParentCommentId.HasValue && rootIds.Contains(c.ParentCommentId.Value))
            .Include(c => c.User)
            .Include(c => c.Likes)
            .ToListAsync();
            
        var repliesLookup = replies
            .GroupBy(c => c.ParentCommentId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        CommentResponse MapComment(Comment comment)
        {
            var children = repliesLookup.TryGetValue(comment.Id, out var r) ? r : new List<Comment>();
            // Recursion for deeper replies if any (though usually 1 level deep in this app?)
            // The original code supported recursion.
            
            return new CommentResponse(
                comment.Id,
                comment.Content,
                comment.CreatedAt,
                $"{comment.User.FirstName} {comment.User.LastName}",
                ResolveAvatar(comment.User.ProfileImageUrl),
                comment.Likes.Count,
                comment.Likes.Any(l => l.UserId == currentUserId),
                comment.ParentCommentId,
                children.Select(child => new CommentResponse(
                    child.Id,
                    child.Content,
                    child.CreatedAt,
                    $"{child.User.FirstName} {child.User.LastName}",
                    ResolveAvatar(child.User.ProfileImageUrl),
                    child.Likes.Count,
                    child.Likes.Any(l => l.UserId == currentUserId),
                    child.ParentCommentId,
                    new List<CommentResponse>() // No deep nesting for replies of replies in this optimization step
                )).ToList()
            );
        }

        int? nextCursor = null;
        if (rootComments.Count > limit)
        {
            var lastItem = rootComments[limit - 1];
            nextCursor = lastItem.Id;
            rootComments.RemoveAt(limit);
        }

        var responseItems = rootComments.Select(MapComment).ToList();
        return new PaginatedResponse<CommentResponse>(responseItems, nextCursor);
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

    public async Task<PaginatedResponse<LikeUserResponse>> GetCommentLikesAsync(int commentId, int currentUserId, int limit = 20, int? cursor = null)
    {
        var comment = await FindAccessibleCommentAsync(commentId, currentUserId);
        if (comment == null) throw new KeyNotFoundException("Comment not found.");

        var query = _context.CommentLikes
            .Where(cl => cl.CommentId == commentId);

        if (cursor.HasValue)
        {
            query = query.Where(cl => cl.UserId > cursor.Value);
        }

        var likes = await query
            .Include(cl => cl.User)
            .OrderBy(cl => cl.UserId) // Changed to ID
            .Take(limit + 1)
            .Select(cl => new LikeUserResponse(
                cl.UserId,
                $"{cl.User.FirstName} {cl.User.LastName}",
                ResolveAvatar(cl.User.ProfileImageUrl)
            ))
            .ToListAsync();

        int? nextCursor = null;
        if (likes.Count > limit)
        {
            var lastItem = likes[limit - 1];
            nextCursor = lastItem.UserId;
            likes.RemoveAt(limit);
        }

        return new PaginatedResponse<LikeUserResponse>(likes, nextCursor);
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

