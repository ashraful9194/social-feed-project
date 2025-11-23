namespace SocialFeed.API.Entities;

public class CommentLike
{
    public int CommentId { get; set; }
    public int UserId { get; set; }

    // Navigations
    public Comment Comment { get; set; } = null!;
    public User User { get; set; } = null!;
}