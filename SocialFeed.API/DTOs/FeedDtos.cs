namespace SocialFeed.API.DTOs;

public record CreatePostRequest(
    string Content,
    string? ImageUrl,
    bool IsPrivate
);

public record PostResponse(
    int Id,
    string Content,
    string? ImageUrl,
    bool IsPrivate,
    string AuthorName,
    string? AuthorAvatar,
    int LikesCount,
    int CommentsCount,
    DateTime CreatedAt,
    bool IsLikedByCurrentUser // Critical for the UI heart icon
);

public record CreateCommentRequest(
    string Content,
    int? ParentCommentId
);

public record CommentResponse(
    int Id,
    string Content,
    DateTime CreatedAt,
    string AuthorName,
    string? AuthorAvatar,
    int LikesCount,
    bool IsLikedByCurrentUser,
    int? ParentCommentId,
    List<CommentResponse> Replies
);

public record PostLikeResponse(
    int PostId,
    bool IsLiked,
    int TotalLikes
);

public record CommentLikeResponse(
    int CommentId,
    bool IsLiked,
    int TotalLikes
);