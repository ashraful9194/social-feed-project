namespace SocialFeed.API.Entities;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign Keys
    public int PostId { get; set; }
    public Post Post { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // **Self-Referencing Key for Replies** // If ParentCommentId is null, it's a main comment. 
    // If it has a value, it's a reply to that comment.
    public int? ParentCommentId { get; set; }
    public Comment? ParentComment { get; set; }
    public List<Comment> Replies { get; set; } = new();
    
    public List<CommentLike> Likes { get; set; } = new();
}