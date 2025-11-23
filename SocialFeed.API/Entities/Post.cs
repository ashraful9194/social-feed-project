namespace SocialFeed.API.Entities;

public class Post
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty; // The Text
    public string? ImageUrl { get; set; } // The Image
    public bool IsPrivate { get; set; } = false; // Requirement: Private vs Public
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign Key
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Navigations
    public List<Comment> Comments { get; set; } = new();
    public List<PostLike> Likes { get; set; } = new();
}